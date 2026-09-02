const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT issued at login (sent as httpOnly cookie "token" OR Bearer header)
// and attaches the full user document to req.user.
async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

// Extra gate for routes only an organizer (calendar-connected user) can use.
function requireOrganizer(req, res, next) {
  if (!req.user?.isOrganizer) {
    return res.status(403).json({ message: 'You need to connect your Google Calendar as an organizer first' });
  }
  next();
}

module.exports = { requireAuth, requireOrganizer };
