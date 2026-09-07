import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingCard from '../components/BookingCard';
import WeeklyStatsTable from '../components/WeeklyStatsTable';

export default function Dashboard() {
  const { user } = useAuth();
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesError, setEventTypesError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState('');
  const [stats, setStats] = useState([]);
  const [form, setForm] = useState({ title: '', duration: 30, description: '', locationType: 'in_person', locationDetail: '' });
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState('upcoming');

  async function loadEventTypes() {
    setEventTypesError('');
    try {
      const { data } = await api.get('/event-types');
      setEventTypes(data.eventTypes);
    } catch (err) {
      setEventTypesError(err.response?.data?.message || 'Failed to load session types');
    }
  }
  async function loadBookings() {
    setBookingsError('');
    try {
      const { data } = await api.get('/bookings/mine');
      setBookings(data.bookings);
    } catch (err) {
      setBookingsError(err.response?.data?.message || 'Failed to load bookings');
    }
  }
  async function loadStats() {
    try {
      const { data } = await api.get('/bookings/mine/stats');
      setStats(data.weeks);
    } catch {
      // non-critical, fail silently
    }
  }

  useEffect(() => {
    loadEventTypes();
    loadBookings();
    loadStats();
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

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime) > now);
  const pending = bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime) <= now && !b.remarksSentAt);
  const completed = bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime) <= now && b.remarksSentAt);

  const bookingPageUrl = user?.username ? `${window.location.origin}/advisor/${user.username}` : null;

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

          <div className="card">
            <h3>Your session types</h3>
            {eventTypesError && (
              <div>
                <p style={{ color: '#c62828' }}>{eventTypesError}</p>
                <button className="btn secondary" onClick={loadEventTypes}>Try again</button>
              </div>
            )}
            {!eventTypesError && eventTypes.length === 0 && <p>No session types yet — create one above.</p>}
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
        </div>

        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <button className={`btn ${tab === 'upcoming' ? '' : 'secondary'}`} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
              <button className={`btn ${tab === 'pending' ? '' : 'secondary'}`} onClick={() => setTab('pending')}>Pending ({pending.length})</button>
              <button className={`btn ${tab === 'completed' ? '' : 'secondary'}`} onClick={() => setTab('completed')}>Completed ({completed.length})</button>
            </div>

            {bookingsError && (
              <div>
                <p style={{ color: '#c62828' }}>{bookingsError}</p>
                <button className="btn secondary" onClick={loadBookings}>Try again</button>
              </div>
            )}

            {!bookingsError && tab === 'upcoming' && (
              <>
                {upcoming.length === 0 && <p>No upcoming sessions.</p>}
                {upcoming.map((b) => <BookingCard key={b._id} booking={b} onChanged={loadBookings} showRemarksForm={false} />)}
              </>
            )}
            {!bookingsError && tab === 'pending' && (
              <>
                <p style={{ fontSize: 13, color: '#666' }}>Sessions that have already happened and are waiting on your follow-up notes.</p>
                {pending.length === 0 && <p>Nothing pending — you're all caught up.</p>}
                {pending.map((b) => <BookingCard key={b._id} booking={b} onChanged={() => { loadBookings(); loadStats(); }} showRemarksForm />)}
              </>
            )}
            {!bookingsError && tab === 'completed' && (
              <>
                {completed.length === 0 && <p>No completed sessions yet.</p>}
                {completed.map((b) => <BookingCard key={b._id} booking={b} onChanged={loadBookings} showRemarksForm />)}
              </>
            )}
          </div>

          <div className="card">
            <h3>Your weekly activity</h3>
            <WeeklyStatsTable weeks={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}
