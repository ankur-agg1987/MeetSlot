const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

// Verifies the JWT issued at login (sent as an httpOnly cookie "token") and
// attaches the full admin/advisor document to req.user.
async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await AdminUser.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'Account not found or disabled' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'You do not have permission to do that' });
    }
    next();
  };
}

const requireMasterAdmin = requireRole('master_admin');
const requireAdvisor = requireRole('advisor');

module.exports = { requireAuth, requireMasterAdmin, requireAdvisor };
