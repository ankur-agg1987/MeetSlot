const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { username, timezone } = req.body;

    if (username) {
      const clean = username.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      if (clean.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
      const taken = await User.findOne({ username: clean, _id: { $ne: req.user._id } });
      if (taken) return res.status(409).json({ message: 'Username already taken' });
      req.user.username = clean;
    }
    if (timezone) req.user.timezone = timezone;

    await req.user.save();
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        timezone: req.user.timezone,
        isOrganizer: req.user.isOrganizer,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
