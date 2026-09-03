const express = require('express');
const Availability = require('../models/Availability');
const { requireAuth, requireAdvisor } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_WEEKLY = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  enabled: day >= 1 && day <= 5, // Mon-Fri on by default
  ranges: day >= 1 && day <= 5 ? [{ start: '09:00', end: '17:00' }] : [],
}));

// Get (or lazily create) the advisor's availability doc
router.get('/', requireAuth, requireAdvisor, async (req, res) => {
  let availability = await Availability.findOne({ advisor: req.user._id });
  if (!availability) {
    availability = await Availability.create({
      advisor: req.user._id,
      timezone: req.user.timezone || 'Asia/Kolkata',
      weeklyHours: DEFAULT_WEEKLY,
      dateOverrides: [],
    });
  }
  res.json({ availability });
});

// Replace weekly hours + timezone
router.put('/', requireAuth, requireAdvisor, async (req, res) => {
  const { weeklyHours, timezone } = req.body;
  const availability = await Availability.findOneAndUpdate(
    { advisor: req.user._id },
    { $set: { weeklyHours, timezone } },
    { new: true, upsert: true }
  );
  res.json({ availability });
});

// Add or replace a date override
router.post('/overrides', requireAuth, requireAdvisor, async (req, res) => {
  const { date, available, ranges } = req.body;
  if (!date) return res.status(400).json({ message: 'date is required' });

  const availability = await Availability.findOneAndUpdate(
    { advisor: req.user._id },
    { $pull: { dateOverrides: { date } } },
    { new: true, upsert: true }
  );
  availability.dateOverrides.push({ date, available, ranges: ranges || [] });
  await availability.save();
  res.json({ availability });
});

router.delete('/overrides/:date', requireAuth, requireAdvisor, async (req, res) => {
  const availability = await Availability.findOneAndUpdate(
    { advisor: req.user._id },
    { $pull: { dateOverrides: { date: req.params.date } } },
    { new: true }
  );
  res.json({ availability });
});

module.exports = router;
