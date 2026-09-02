const express = require('express');
const { DateTime } = require('luxon');
const Booking = require('../models/Booking');
const EventType = require('../models/EventType');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getBusyBlocks, createCalendarEvent, deleteCalendarEvent } = require('../utils/googleCalendar');

const router = express.Router();

// Create a booking. Caller must be Gmail-authenticated (any logged-in user, client or organizer).
router.post('/', requireAuth, async (req, res) => {
  try {
    const { username, slug, startTime, notes } = req.body;
    if (!username || !slug || !startTime) {
      return res.status(400).json({ message: 'username, slug and startTime are required' });
    }

    const organizer = await User.findOne({ username, isOrganizer: true });
    if (!organizer) return res.status(404).json({ message: 'Organizer not found' });
    if (String(organizer._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't book your own event type" });
    }

    const eventType = await EventType.findOne({ organizer: organizer._id, slug, isActive: true });
    if (!eventType) return res.status(404).json({ message: 'Event type not found' });

    const start = DateTime.fromISO(startTime);
    const end = start.plus({ minutes: eventType.duration });

    // Re-validate against Google Calendar right before booking to avoid double-booking races
    const busy = await getBusyBlocks(
      organizer._id,
      start.minus({ minutes: eventType.bufferBeforeMin }).toUTC().toISO(),
      end.plus({ minutes: eventType.bufferAfterMin }).toUTC().toISO()
    );
    const conflict = busy.some((b) => start < DateTime.fromISO(b.end) && end > DateTime.fromISO(b.start));
    if (conflict) {
      return res.status(409).json({ message: 'This slot was just taken. Please pick another time.' });
    }

    const existing = await Booking.findOne({
      organizer: organizer._id,
      status: 'confirmed',
      startTime: { $lt: end.toJSDate() },
      endTime: { $gt: start.toJSDate() },
    });
    if (existing) {
      return res.status(409).json({ message: 'This slot was just taken. Please pick another time.' });
    }

    const { googleEventId, meetLink } = await createCalendarEvent({
      organizerId: organizer._id,
      summary: `${eventType.title} - ${req.user.name} & ${organizer.name}`,
      description: notes || eventType.description,
      startISO: start.toUTC().toISO(),
      endISO: end.toUTC().toISO(),
      timezone: req.user.timezone || 'Asia/Kolkata',
      clientEmail: req.user.email,
      wantsMeetLink: eventType.locationType === 'google_meet',
    });

    const booking = await Booking.create({
      eventType: eventType._id,
      organizer: organizer._id,
      client: req.user._id,
      clientName: req.user.name,
      clientEmail: req.user.email,
      notes,
      startTime: start.toJSDate(),
      endTime: end.toJSDate(),
      timezone: req.user.timezone || 'Asia/Kolkata',
      googleEventId,
      meetLink,
    });

    res.status(201).json({ booking });
  } catch (err) {
    console.error('Booking creation failed:', err);
    res.status(500).json({ message: err.message || 'Failed to create booking' });
  }
});

// List bookings where the logged-in user is either the organizer or the client
router.get('/mine', requireAuth, async (req, res) => {
  const asOrganizer = await Booking.find({ organizer: req.user._id })
    .populate('eventType', 'title duration')
    .sort({ startTime: 1 });
  const asClient = await Booking.find({ client: req.user._id })
    .populate('eventType', 'title duration')
    .populate('organizer', 'name email')
    .sort({ startTime: 1 });

  res.json({ asOrganizer, asClient });
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Not found' });

  const isParty = [String(booking.organizer), String(booking.client)].includes(String(req.user._id));
  if (!isParty) return res.status(403).json({ message: 'Not your booking' });

  booking.status = 'cancelled';
  booking.cancelReason = req.body.reason || '';
  await booking.save();

  if (booking.googleEventId) {
    try {
      await deleteCalendarEvent(booking.organizer, booking.googleEventId);
    } catch (e) {
      console.error('Failed to delete calendar event on cancel:', e.message);
    }
  }

  res.json({ booking });
});

module.exports = router;
