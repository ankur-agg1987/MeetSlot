const { DateTime } = require('luxon');

/**
 * Computes bookable start-time slots for a single calendar date.
 *
 * @param {string} dateStr - "YYYY-MM-DD" in the advisor's timezone
 * @param {object} availability - Availability mongoose doc
 * @param {number} durationMin - event type duration
 * @param {number} bufferBeforeMin
 * @param {number} bufferAfterMin
 * @param {number} minNoticeHours
 * @param {Array<{start: string, end: string}>} busyBlocks - ISO strings of already-booked time ranges to avoid
 * @param {string} timezone - advisor's timezone (IANA)
 * @returns {string[]} array of ISO start-time strings (UTC) for open slots
 */
function computeSlotsForDate({
  dateStr,
  availability,
  durationMin,
  bufferBeforeMin,
  bufferAfterMin,
  minNoticeHours,
  busyBlocks,
  timezone,
}) {
  const day = DateTime.fromISO(dateStr, { zone: timezone });
  const weekday = day.weekday % 7; // luxon: Mon=1..Sun=7 -> convert to Sun=0..Sat=6

  // 1. Determine which ranges apply: date override wins over weekly default
  const override = availability.dateOverrides.find((o) => o.date === dateStr);
  let ranges;
  if (override) {
    if (!override.available) return [];
    ranges = override.ranges;
  } else {
    const weeklyDay = availability.weeklyHours.find((w) => w.day === weekday);
    if (!weeklyDay || !weeklyDay.enabled) return [];
    ranges = weeklyDay.ranges;
  }
  if (!ranges || ranges.length === 0) return [];

  const now = DateTime.now().setZone(timezone);
  const earliestBookable = now.plus({ hours: minNoticeHours });

  const busyIntervals = busyBlocks.map((b) => ({
    start: DateTime.fromISO(b.start),
    end: DateTime.fromISO(b.end),
  }));

  const slots = [];

  for (const range of ranges) {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    let cursor = day.set({ hour: startH, minute: startM, second: 0, millisecond: 0 });
    const rangeEnd = day.set({ hour: endH, minute: endM, second: 0, millisecond: 0 });

    while (cursor.plus({ minutes: durationMin }) <= rangeEnd) {
      const slotStart = cursor;
      const slotEnd = cursor.plus({ minutes: durationMin });

      // padded window used only for conflict checking (buffers around the meeting)
      const paddedStart = slotStart.minus({ minutes: bufferBeforeMin });
      const paddedEnd = slotEnd.plus({ minutes: bufferAfterMin });

      const isPast = slotStart < earliestBookable;
      const overlapsBusy = busyIntervals.some(
        (b) => paddedStart < b.end && paddedEnd > b.start
      );

      if (!isPast && !overlapsBusy) {
        slots.push(slotStart.toUTC().toISO());
      }

      cursor = cursor.plus({ minutes: durationMin });
    }
  }

  return slots;
}

module.exports = { computeSlotsForDate };
