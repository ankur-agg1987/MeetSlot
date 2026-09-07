const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Single login endpoint for both master admin and advisor accounts.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await AdminUser.findOne({ username: username.toLowerCase().trim() }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });
    if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated. Contact the master admin.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid username or password' });

    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u._id,
      username: u.username,
      name: u.name,
      role: u.role,
      mustChangePassword: u.mustChangePassword,
      timezone: u.timezone,
    },
  });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }
  const user = await AdminUser.findById(req.user._id).select('+passwordHash');
  const match = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();
  res.json({ message: 'Password updated' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
