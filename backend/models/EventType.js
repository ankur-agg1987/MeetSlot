const mongoose = require('mongoose');

// A "session type" an advisor offers, e.g. "Resume Review - 30 min".
const eventTypeSchema = new mongoose.Schema(
  {
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true }, // unique per advisor, forms the booking URL
    description: { type: String, default: '' },
    duration: { type: Number, required: true, default: 30 }, // minutes
    color: { type: String, default: '#1a3d7c' },
    isActive: { type: Boolean, default: true },
    bufferBeforeMin: { type: Number, default: 0 },
    bufferAfterMin: { type: Number, default: 0 },
    minNoticeHours: { type: Number, default: 4 }, // can't book within X hours of now
    maxBookingWindowDays: { type: Number, default: 30 }, // can't book more than X days out
    locationType: { type: String, default: 'in_person' }, // in_person | video_call | phone_call
    locationDetail: { type: String, default: '' }, // e.g. room number, or "link shared via email"
  },
  { timestamps: true }
);

eventTypeSchema.index({ advisor: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('EventType', eventTypeSchema);
