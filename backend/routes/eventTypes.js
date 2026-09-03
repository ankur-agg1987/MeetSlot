const express = require('express');
const EventType = require('../models/EventType');
const { requireAuth, requireAdvisor } = require('../middleware/auth');

const router = express.Router();

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// List the logged-in advisor's session types
router.get('/', requireAuth, requireAdvisor, async (req, res) => {
  const types = await EventType.find({ advisor: req.user._id }).sort({ createdAt: -1 });
  res.json({ eventTypes: types });
});

// Create a new session type
router.post('/', requireAuth, requireAdvisor, async (req, res) => {
  try {
    const { title, description, duration, color, bufferBeforeMin, bufferAfterMin, minNoticeHours, maxBookingWindowDays, locationType, locationDetail } = req.body;
    if (!title || !duration) return res.status(400).json({ message: 'title and duration are required' });

    let slug = slugify(title);
    let candidate = slug;
    let n = 1;
    while (await EventType.findOne({ advisor: req.user._id, slug: candidate })) {
      candidate = `${slug}-${++n}`;
    }

    const eventType = await EventType.create({
      advisor: req.user._id,
      title,
      slug: candidate,
      description,
      duration,
      color,
      bufferBeforeMin,
      bufferAfterMin,
      minNoticeHours,
      maxBookingWindowDays,
      locationType,
      locationDetail,
    });
    res.status(201).json({ eventType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', requireAuth, requireAdvisor, async (req, res) => {
  const eventType = await EventType.findOne({ _id: req.params.id, advisor: req.user._id });
  if (!eventType) return res.status(404).json({ message: 'Not found' });

  const fields = ['title', 'description', 'duration', 'color', 'isActive', 'bufferBeforeMin', 'bufferAfterMin', 'minNoticeHours', 'maxBookingWindowDays', 'locationType', 'locationDetail'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) eventType[f] = req.body[f];
  });
  await eventType.save();
  res.json({ eventType });
});

router.delete('/:id', requireAuth, requireAdvisor, async (req, res) => {
  const result = await EventType.deleteOne({ _id: req.params.id, advisor: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
