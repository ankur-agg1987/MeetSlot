import { useEffect, useState } from 'react';
import api from '../api/axios';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilitySettings() {
  const [availability, setAvailability] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideAvailable, setOverrideAvailable] = useState(false);

  function load() {
    setLoadError('');
    api
      .get('/availability')
      .then(({ data }) => setAvailability(data.availability))
      .catch((err) => setLoadError(err.response?.data?.message || 'Failed to load availability. Please try refreshing the page.'));
  }

  useEffect(() => {
    load();
  }, []);

  if (loadError) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ color: '#c62828' }}>{loadError}</p>
          <button className="btn secondary" onClick={load}>Try again</button>
        </div>
      </div>
    );
  }

  if (!availability) return <div className="container">Loading...</div>;

  function updateDay(day, patch) {
    setAvailability((av) => ({
      ...av,
      weeklyHours: av.weeklyHours.map((w) => (w.day === day ? { ...w, ...patch } : w)),
    }));
  }

  function updateRange(day, idx, field, value) {
    setAvailability((av) => ({
      ...av,
      weeklyHours: av.weeklyHours.map((w) =>
        w.day === day
          ? { ...w, ranges: w.ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)) }
          : w
      ),
    }));
  }

  function addRange(day) {
    setAvailability((av) => ({
      ...av,
      weeklyHours: av.weeklyHours.map((w) =>
        w.day === day ? { ...w, ranges: [...w.ranges, { start: '09:00', end: '17:00' }] } : w
      ),
    }));
  }

  function removeRange(day, idx) {
    setAvailability((av) => ({
      ...av,
      weeklyHours: av.weeklyHours.map((w) =>
        w.day === day ? { ...w, ranges: w.ranges.filter((_, i) => i !== idx) } : w
      ),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.put('/availability', {
        weeklyHours: availability.weeklyHours,
        timezone: availability.timezone,
      });
      setAvailability(data.availability);
      alert('Saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function addOverride(e) {
    e.preventDefault();
    if (!overrideDate) return;
    const { data } = await api.post('/availability/overrides', {
      date: overrideDate,
      available: overrideAvailable,
      ranges: overrideAvailable ? [{ start: '09:00', end: '17:00' }] : [],
    });
    setAvailability(data.availability);
    setOverrideDate('');
  }

  async function removeOverride(date) {
    const { data } = await api.delete(`/availability/overrides/${date}`);
    setAvailability(data.availability);
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Timezone</h3>
        <input
          value={availability.timezone}
          onChange={(e) => setAvailability({ ...availability, timezone: e.target.value })}
          placeholder="e.g. Asia/Kolkata"
        />
        <p style={{ fontSize: 12, color: '#888' }}>Use an IANA timezone name, e.g. Asia/Kolkata, America/New_York.</p>
      </div>

      <div className="card">
        <h3>Weekly hours</h3>
        <p style={{ fontSize: 13, color: '#666' }}>
          Turn on the days you're available, and add one or more time ranges per day (e.g. a
          morning block and a separate afternoon block).
        </p>
        {availability.weeklyHours
          .slice()
          .sort((a, b) => a.day - b.day)
          .map((w) => (
            <div key={w.day} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
              <div className="day-row">
                <div className="day-label">{DAY_NAMES[w.day]}</div>
                <input type="checkbox" checked={w.enabled} onChange={(e) => updateDay(w.day, { enabled: e.target.checked })} />
                {!w.enabled && <span style={{ color: '#888' }}>Unavailable</span>}
              </div>
              {w.enabled && (
                <div style={{ marginLeft: 102 }}>
                  {(w.ranges.length ? w.ranges : [{ start: '09:00', end: '17:00' }]).map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <input type="time" value={r.start} style={{ width: 120 }} onChange={(e) => updateRange(w.day, idx, 'start', e.target.value)} />
                      <span>to</span>
                      <input type="time" value={r.end} style={{ width: 120 }} onChange={(e) => updateRange(w.day, idx, 'end', e.target.value)} />
                      {w.ranges.length > 1 && (
                        <button type="button" className="btn danger" style={{ padding: '4px 10px' }} onClick={() => removeRange(w.day, idx)}>Remove</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn secondary" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => addRange(w.day)}>
                    + Add another time slot
                  </button>
                </div>
              )}
            </div>
          ))}
        <button className="btn" onClick={save} disabled={saving} style={{ marginTop: 16 }}>{saving ? 'Saving...' : 'Save weekly hours'}</button>
      </div>

      <div className="card">
        <h3>Date overrides</h3>
        <p>Block off a specific date (e.g. a holiday), or open up extra availability on a day you'd normally be off.</p>
        <form onSubmit={addOverride} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label>Date</label>
            <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} required />
          </div>
          <div>
            <label>Available?</label>
            <select value={overrideAvailable ? 'yes' : 'no'} onChange={(e) => setOverrideAvailable(e.target.value === 'yes')}>
              <option value="no">Unavailable (day off)</option>
              <option value="yes">Available 09:00-17:00</option>
            </select>
          </div>
          <button className="btn">Add override</button>
        </form>

        <ul>
          {availability.dateOverrides.map((o) => (
            <li key={o.date} style={{ marginTop: 8 }}>
              {o.date} — {o.available ? `Available ${o.ranges.map((r) => `${r.start}-${r.end}`).join(', ')}` : 'Unavailable'}{' '}
              <button className="btn secondary" onClick={() => removeOverride(o.date)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
