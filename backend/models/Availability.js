const mongoose = require('mongoose');

// One document per organizer describing their recurring weekly hours
// plus one-off date overrides (days off, or extra/reduced hours on a specific date).
const rangeSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // "09:00"
    end: { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timezone: { type: String, default: 'Asia/Kolkata' },

    // Recurring weekly schedule. day: 0=Sunday ... 6=Saturday
    weeklyHours: [
      {
        day: { type: Number, required: true, min: 0, max: 6 },
        enabled: { type: Boolean, default: false },
        ranges: [rangeSchema],
      },
    ],

    // Date-specific overrides, e.g. { date: "2026-12-25", available: false }
    // or { date: "2026-09-10", available: true, ranges: [{start:"10:00", end:"12:00"}] }
    dateOverrides: [
      {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        available: { type: Boolean, required: true },
        ranges: [rangeSchema],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
