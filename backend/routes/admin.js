const express = require('express');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const Booking = require('../models/Booking');
const { requireAuth, requireMasterAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireMasterAdmin);

// List all advisor accounts (not the master admin itself)
router.get('/advisors', async (req, res) => {
  const advisors = await AdminUser.find({ role: 'advisor' }).sort({ createdAt: 1 });
  res.json({ advisors });
});

// Update an advisor's profile details (name, designation, notifyEmail, bio, active status)
router.put('/advisors/:id', async (req, res) => {
  const advisor = await AdminUser.findOne({ _id: req.params.id, role: 'advisor' });
  if (!advisor) return res.status(404).json({ message: 'Advisor not found' });

  const fields = ['name', 'designation', 'department', 'bio', 'photoUrl', 'notifyEmail', 'isActive', 'username'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) advisor[f] = req.body[f];
  });

  if (req.body.username) advisor.username = req.body.username.toLowerCase().trim();

  try {
    await advisor.save();
    res.json({ advisor });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That username is already taken' });
    res.status(500).json({ message: err.message });
  }
});

// Reset an advisor's password
router.put('/advisors/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  const advisor = await AdminUser.findOne({ _id: req.params.id, role: 'advisor' });
  if (!advisor) return res.status(404).json({ message: 'Advisor not found' });

  advisor.passwordHash = await bcrypt.hash(newPassword, 10);
  advisor.mustChangePassword = true;
  await advisor.save();
  res.json({ message: 'Password reset. The advisor will be asked to change it on next login.' });
});

// View every booking across all advisors
router.get('/bookings', async (req, res) => {
  const bookings = await Booking.find({})
    .populate('advisor', 'name username')
    .populate('eventType', 'title duration')
    .sort({ startTime: -1 })
    .limit(500);
  res.json({ bookings });
});

module.exports = router;
