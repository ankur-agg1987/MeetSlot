import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [eventTypes, setEventTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ title: '', duration: 30, description: '', locationType: 'in_person', locationDetail: '' });
  const [creating, setCreating] = useState(false);

  async function loadEventTypes() {
    const { data } = await api.get('/event-types');
    setEventTypes(data.eventTypes);
  }
  async function loadBookings() {
    const { data } = await api.get('/bookings/mine');
    setBookings(data.bookings);
  }

  useEffect(() => {
    loadEventTypes();
    loadBookings();
  }, []);

  async function createEventType(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/event-types', form);
      setForm({ title: '', duration: 30, description: '', locationType: 'in_person', locationDetail: '' });
      loadEventTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create session type');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(et) {
    await api.put(`/event-types/${et._id}`, { isActive: !et.isActive });
    loadEventTypes();
  }

  async function remove(et) {
    if (!confirm(`Delete "${et.title}"?`)) return;
    await api.delete(`/event-types/${et._id}`);
    loadEventTypes();
  }

  async function cancelBooking(id) {
    if (!confirm('Cancel this session?')) return;
    await api.post(`/bookings/${id}/cancel`, { reason: 'Cancelled by advisor' });
    loadBookings();
  }

  const bookingPageUrl = user?.username ? `${window.location.origin}/advisor/${user.username}` : null;
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime) > new Date());

  return (
    <div className="container">
      <h2>Welcome, {user?.name}</h2>
      {bookingPageUrl && (
        <p>
          Your public booking link: <a href={bookingPageUrl} target="_blank" rel="noreferrer">{bookingPageUrl}</a>
        </p>
      )}

      <div className="grid-2">
        <div>
          <div className="card">
            <h3>New session type</h3>
            <form onSubmit={createEventType}>
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Resume Review" />

              <label>Duration (minutes)</label>
              <input required type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />

              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What students should expect from this session" />

              <label>Session mode</label>
              <select value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value })}>
                <option value="in_person">In person (CDC office)</option>
                <option value="video_call">Video call</option>
                <option value="phone_call">Phone call</option>
              </select>

              <label>Location / details (optional)</label>
              <input value={form.locationDetail} onChange={(e) => setForm({ ...form, locationDetail: e.target.value })} placeholder="e.g. Room 204, CDC Office" />

              <div style={{ marginTop: 14 }}>
                <button className="btn" disabled={creating}>Create session type</button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3>Availability</h3>
            <p>Set your weekly working hours and block off specific dates.</p>
            <Link to="/availability" className="btn secondary">Manage availability</Link>
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Your session types</h3>
            {eventTypes.length === 0 && <p>No session types yet — create one on the left.</p>}
            {eventTypes.map((et) => (
              <div key={et._id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
                <strong>{et.title}</strong> — {et.duration} min{' '}
                <span className={`badge ${et.isActive ? 'confirmed' : 'inactive'}`}>{et.isActive ? 'Active' : 'Hidden'}</span>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn secondary" onClick={() => toggleActive(et)}>{et.isActive ? 'Hide' : 'Unhide'}</button>
                  <button className="btn danger" onClick={() => remove(et)}>Delete</button>
                  {bookingPageUrl && (
                    <a className="btn secondary" href={`${bookingPageUrl}/${et.slug}`} target="_blank" rel="noreferrer">Preview</a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Upcoming sessions ({upcoming.length})</h3>
            {upcoming.length === 0 && <p>No upcoming sessions booked yet.</p>}
            {upcoming.map((b) => (
              <div key={b._id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
                <strong>{b.studentName}</strong> — {b.eventType?.title}
                <p style={{ margin: '4px 0', fontSize: 13, color: '#666' }}>
                  {DateTime.fromISO(b.startTime).setZone(b.timezone).toFormat('cccc, LLLL d · h:mm a')}
                </p>
                <p style={{ margin: '4px 0', fontSize: 13 }}>{b.studentEmail} {b.studentPhone && `· ${b.studentPhone}`}</p>
                {b.purpose && <p style={{ margin: '4px 0', fontSize: 13 }}>Purpose: {b.purpose}</p>}
                <button className="btn danger" onClick={() => cancelBooking(b._id)} style={{ marginTop: 4 }}>Cancel</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
