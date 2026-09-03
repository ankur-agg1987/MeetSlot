const mongoose = require('mongoose');

// Single model for both login types:
//   role: 'master_admin' -> the one super-admin who manages advisor accounts
//   role: 'advisor'      -> one of the 10 CDC advisors/mentors who take bookings
const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['master_admin', 'advisor'], required: true },

    name: { type: String, required: true },
    designation: { type: String, default: '' }, // e.g. "Senior Placement Advisor"
    department: { type: String, default: 'Career Development Center' },
    bio: { type: String, default: '' },
    photoUrl: { type: String, default: '' },

    // Where booking notification emails are sent for this advisor. Set by the
    // master admin. Not used for master_admin accounts.
    notifyEmail: { type: String, default: '' },

    isActive: { type: Boolean, default: true }, // advisor visible on homepage / can log in
    timezone: { type: String, default: 'Asia/Kolkata' },

    mustChangePassword: { type: Boolean, default: true }, // forces reset on first login
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
