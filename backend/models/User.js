const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: { type: String },

    // 'organizer' = signed in via full OAuth (has calendar access, can host bookings)
    // 'client'    = signed in via lightweight identity-only Google Sign-In (books meetings)
    // A user can hold both roles over time; role flags below track what they've unlocked.
    isOrganizer: { type: Boolean, default: false },

    // Unique public booking-page handle, e.g. calendly-clone.vercel.app/u/johndoe
    username: { type: String, unique: true, sparse: true },
    timezone: { type: String, default: 'Asia/Kolkata' },

    // OAuth tokens - ONLY populated for organizers (needed for Calendar API calls)
    googleAccessToken: { type: String, select: false },
    googleRefreshToken: { type: String, select: false },
    googleTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
