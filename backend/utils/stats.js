const { DateTime } = require('luxon');

// Buckets bookings into ISO weeks (Mon-Sun) for the last `weeksBack` weeks,
// counting how many were received, how many are completed (advisor sent
// remarks), and how many are still pending action (session time has passed
// but no remarks sent yet). Cancelled bookings are excluded from all counts.
function computeWeeklyStats(bookings, weeksBack = 8) {
  const now = DateTime.now();
  const weeks = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = now.minus({ weeks: i }).startOf('week');
    weeks.push({
      weekStart: weekStart.toISODate(),
      label: weekStart.toFormat('LLL d'),
      received: 0,
      completed: 0,
      pending: 0,
      upcoming: 0,
      cancelled: 0,
    });
  }

  const findBucket = (dt) => {
    const weekStart = dt.startOf('week').toISODate();
    return weeks.find((w) => w.weekStart === weekStart);
  };

  for (const b of bookings) {
    const startTime = DateTime.fromJSDate(b.startTime);
    const bucket = findBucket(startTime);
    if (!bucket) continue; // outside the window we're reporting on

    bucket.received += 1;
    if (b.status === 'cancelled') {
      bucket.cancelled += 1;
    } else if (b.remarksSentAt) {
      bucket.completed += 1;
    } else if (startTime < now) {
      bucket.pending += 1;
    } else {
      bucket.upcoming += 1;
    }
  }

  return weeks;
}

module.exports = { computeWeeklyStats };
