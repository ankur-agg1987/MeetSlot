const express = require('express');
const { DateTime } = require('luxon');
const AdminUser = require('../models/AdminUser');
const EventType = require('../models/EventType');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { computeSlotsForDate } = require('../utils/slots');

const router = express.Router();

// GET /api/public/advisors -> directory of active advisors for the homepage
router.get('/advisors', async (req, res) => {
  const advisors = await AdminUser.find({ role: 'advisor', isActive: true }).select(
    'name designation department bio photoUrl username'
  );
  res.json({ advisors });
});

// GET /api/public/advisors/:username -> one advisor's profile + active session types
router.get('/advisors/:username', async (req, res) => {
  const advisor = await AdminUser.findOne({ username: req.params.username, role: 'advisor', isActive: true });
  if (!advisor) return res.status(404).json({ message: 'Advisor not found' });

  const eventTypes = await EventType.find({ advisor: advisor._id, isActive: true }).select(
    'title slug description duration color locationType locationDetail'
  );

  res.json({
    advisor: {
      name: advisor.name,
      designation: advisor.designation,
      department: advisor.department,
      bio: advisor.bio,
      photoUrl: advisor.photoUrl,
      username: advisor.username,
    },
    eventTypes,
  });
});

// GET /api/public/advisors/:username/:slug/slots?date=YYYY-MM-DD
router.get('/advisors/:username/:slug/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param (YYYY-MM-DD) is required' });

    const advisor = await AdminUser.findOne({ username: req.params.username, role: 'advisor', isActive: true });
    if (!advisor) return res.status(404).json({ message: 'Advisor not found' });

    const eventType = await EventType.findOne({ advisor: advisor._id, slug: req.params.slug, isActive: true });
    if (!eventType) return res.status(404).json({ message: 'Session type not found' });

    const availability = await Availability.findOne({ advisor: advisor._id });
    if (!availability) return res.json({ slots: [] });

    const tz = availability.timezone;
    const dayStart = DateTime.fromISO(date, { zone: tz }).startOf('day');
    const dayEnd = dayStart.endOf('day');

    const existingBookings = await Booking.find({
      advisor: advisor._id,
      status: 'confirmed',
      startTime: { $lt: dayEnd.toJSDate() },
      endTime: { $gt: dayStart.toJSDate() },
    }).select('startTime endTime');

    const busyBlocks = existingBookings.map((b) => ({
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
      busyBlocks,
      timezone: tz,
    });

    res.json({ slots, timezone: tz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to compute availability' });
  }
});

module.exports = router;
