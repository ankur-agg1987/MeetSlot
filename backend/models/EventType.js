const mongoose = require('mongoose');

const eventTypeSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true }, // unique per organizer, forms the booking URL
    description: { type: String, default: '' },
    duration: { type: Number, required: true, default: 30 }, // minutes
    color: { type: String, default: '#0069ff' },
    isActive: { type: Boolean, default: true },
    bufferBeforeMin: { type: Number, default: 0 },
    bufferAfterMin: { type: Number, default: 0 },
    minNoticeHours: { type: Number, default: 4 }, // can't book within X hours of now
    maxBookingWindowDays: { type: Number, default: 30 }, // can't book more than X days out
    locationType: { type: String, default: 'google_meet' }, // google_meet | in_person | phone | custom
    locationDetail: { type: String, default: '' },
  },
  { timestamps: true }
);

eventTypeSchema.index({ organizer: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('EventType', eventTypeSchema);
