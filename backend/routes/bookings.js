const express = require('express');
const { DateTime } = require('luxon');
const Booking = require('../models/Booking');
const EventType = require('../models/EventType');
const AdminUser = require('../models/AdminUser');
const { requireAuth, requireAdvisor } = require('../middleware/auth');
const { sendAdvisorNotification, sendStudentConfirmation, sendRemarksEmail } = require('../utils/email');
const { computeWeeklyStats } = require('../utils/stats');

const router = express.Router();

// Create a booking. NO AUTH REQUIRED - any student can book by filling the form.
router.post('/', async (req, res) => {
  try {
    const {
      username,
      slug,
      startTime,
      studentName,
      studentId,
      studentEmail,
      studentPhone,
      program,
      yearOrSemester,
      purpose,
      message,
    } = req.body;

    if (!username || !slug || !startTime) {
      return res.status(400).json({ message: 'username, slug and startTime are required' });
    }
    if (!studentName || !studentEmail) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(studentEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const advisor = await AdminUser.findOne({ username, role: 'advisor', isActive: true });
    if (!advisor) return res.status(404).json({ message: 'Advisor not found' });

    const eventType = await EventType.findOne({ advisor: advisor._id, slug, isActive: true });
    if (!eventType) return res.status(404).json({ message: 'Session type not found' });

    const start = DateTime.fromISO(startTime);
    const end = start.plus({ minutes: eventType.duration });

    // Re-validate against existing bookings right before booking to avoid double-booking races
    const conflict = await Booking.findOne({
      advisor: advisor._id,
      status: 'confirmed',
      startTime: { $lt: end.toJSDate() },
      endTime: { $gt: start.toJSDate() },
    });
    if (conflict) {
      return res.status(409).json({ message: 'This slot was just taken. Please pick another time.' });
    }

    const booking = await Booking.create({
      eventType: eventType._id,
      advisor: advisor._id,
      studentName,
      studentId,
      studentEmail,
      studentPhone,
      program,
      yearOrSemester,
      purpose: purpose || 'Other',
      message,
      startTime: start.toJSDate(),
      endTime: end.toJSDate(),
      timezone: advisor.timezone || 'Asia/Kolkata',
    });

    // Fire off notification emails - don't fail the booking if email sending has an issue,
    // just record whether they went out so the master admin can see problems.
    try {
      await sendAdvisorNotification({ advisor, eventType, booking });
      booking.advisorNotified = true;
    } catch (e) {
      console.error('Failed to email advisor:', e.message);
    }
    try {
      await sendStudentConfirmation({ advisor, eventType, booking });
      booking.studentConfirmed = true;
    } catch (e) {
      console.error('Failed to email student:', e.message);
    }
    await booking.save();

    res.status(201).json({ booking });
  } catch (err) {
    console.error('Booking creation failed:', err);
    res.status(500).json({ message: err.message || 'Failed to create booking' });
  }
});

// Advisor: list their own upcoming/past bookings
router.get('/mine', requireAuth, requireAdvisor, async (req, res) => {
  const bookings = await Booking.find({ advisor: req.user._id })
    .populate('eventType', 'title duration')
    .sort({ startTime: 1 });
  res.json({ bookings });
});

// Advisor: their own week-by-week self-analytics
router.get('/mine/stats', requireAuth, requireAdvisor, async (req, res) => {
  const weeksBack = Math.min(Number(req.query.weeks) || 8, 26);
  const bookings = await Booking.find({ advisor: req.user._id }).select('startTime status remarksSentAt');
  const weeks = computeWeeklyStats(bookings, weeksBack);
  res.json({ weeks });
});

// Advisor: record post-session remarks/action plan and email them to the student
router.post('/:id/remarks', requireAuth, requireAdvisor, async (req, res) => {
  const { remarks, actionPlan } = req.body;
  if (!remarks && !actionPlan) {
    return res.status(400).json({ message: 'Please add remarks or an action plan before sending' });
  }

  const booking = await Booking.findOne({ _id: req.params.id, advisor: req.user._id }).populate('eventType');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.remarks = remarks || '';
  booking.actionPlan = actionPlan || '';

  try {
    await sendRemarksEmail({ advisor: req.user, eventType: booking.eventType, booking });
    booking.remarksSentAt = new Date();
    await booking.save();
    res.json({ booking, message: 'Sent to the student.' });
  } catch (err) {
    await booking.save(); // keep the notes even if the email failed
    console.error('Failed to send remarks email:', err.message);
    res.status(502).json({ message: 'Notes saved, but the email failed to send. Please try again.' });
  }
});

// Advisor or master admin can cancel a booking
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('eventType').populate('advisor');
  if (!booking) return res.status(404).json({ message: 'Not found' });

  const isOwningAdvisor = req.user.role === 'advisor' && String(booking.advisor._id) === String(req.user._id);
  const isMaster = req.user.role === 'master_admin';
  if (!isOwningAdvisor && !isMaster) return res.status(403).json({ message: 'Not permitted' });

  booking.status = 'cancelled';
  booking.cancelReason = req.body.reason || '';
  await booking.save();

  res.json({ booking });
});

module.exports = router;
