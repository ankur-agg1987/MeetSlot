const express = require('express');
const { DateTime } = require('luxon');
const User = require('../models/User');
const EventType = require('../models/EventType');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { getBusyBlocks } = require('../utils/googleCalendar');
const { computeSlotsForDate } = require('../utils/slots');

const router = express.Router();

// GET /api/public/:username -> organizer's public profile + active event types
router.get('/:username', async (req, res) => {
  const organizer = await User.findOne({ username: req.params.username, isOrganizer: true });
  if (!organizer) return res.status(404).json({ message: 'Booking page not found' });

  const eventTypes = await EventType.find({ organizer: organizer._id, isActive: true }).select(
    'title slug description duration color locationType'
  );

  res.json({
    organizer: { name: organizer.name, picture: organizer.picture, username: organizer.username },
    eventTypes,
  });
});

// GET /api/public/:username/:slug/slots?date=YYYY-MM-DD
router.get('/:username/:slug/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param (YYYY-MM-DD) is required' });

    const organizer = await User.findOne({ username: req.params.username, isOrganizer: true });
    if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

    const eventType = await EventType.findOne({ organizer: organizer._id, slug: req.params.slug, isActive: true });
    if (!eventType) return res.status(404).json({ message: 'Event type not found' });

    const availability = await Availability.findOne({ organizer: organizer._id });
    if (!availability) return res.json({ slots: [] });

    const tz = availability.timezone;
    const dayStart = DateTime.fromISO(date, { zone: tz }).startOf('day');
    const dayEnd = dayStart.endOf('day');

    // Pull real Google Calendar busy blocks for the day, plus any bookings
    // already made through this app (belt-and-suspenders in case the calendar
    // event creation lags).
    let googleBusy = [];
    try {
      googleBusy = await getBusyBlocks(organizer._id, dayStart.toUTC().toISO(), dayEnd.toUTC().toISO());
    } catch (e) {
      console.error('Freebusy lookup failed, falling back to internal bookings only:', e.message);
    }

    const existingBookings = await Booking.find({
      organizer: organizer._id,
      status: 'confirmed',
      startTime: { $lt: dayEnd.toJSDate() },
      endTime: { $gt: dayStart.toJSDate() },
    }).select('startTime endTime');

    const bookingBusy = existingBookings.map((b) => ({
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
    }));

    const slots = computeSlotsForDate({
      dateStr: date,
      availability,
      durationMin: eventType.duration,
      bufferBeforeMin: eventType.bufferBeforeMin,
      bufferAfterMin: eventType.bufferAfterMin,
      minNoticeHours: eventType.minNoticeHours,
      busyBlocks: [...googleBusy, ...bookingBusy],
      timezone: tz,
    });

    res.json({ slots, timezone: tz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to compute availability' });
  }
});

module.exports = router;
