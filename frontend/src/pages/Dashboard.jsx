import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [eventTypes, setEventTypes] = useState([]);
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);
  const [form, setForm] = useState({ title: '', duration: 30, description: '', locationType: 'google_meet' });
  const [creating, setCreating] = useState(false);

  async function loadEventTypes() {
    const { data } = await api.get('/event-types');
    setEventTypes(data.eventTypes);
  }

  useEffect(() => {
    loadEventTypes();
  }, []);

  async function saveUsername(e) {
    e.preventDefault();
    setSavingUsername(true);
    try {
      const { data } = await api.put('/users/me', { username: usernameInput });
      setUser((u) => ({ ...u, username: data.user.username }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save username');
    } finally {
      setSavingUsername(false);
    }
  }

  async function createEventType(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/event-types', form);
      setForm({ title: '', duration: 30, description: '', locationType: 'google_meet' });
      loadEventTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event type');
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

  const bookingPageUrl = user?.username ? `${window.location.origin}/u/${user.username}` : null;

  return (
    <div className="container">
      <div className="grid-2">
        <div>
          <div className="card">
            <h3>Your booking page</h3>
            <form onSubmit={saveUsername} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Username</label>
                <input value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="e.g. jane-doe" />
              </div>
              <button className="btn" disabled={savingUsername}>Save</button>
            </form>
            {bookingPageUrl && (
              <p style={{ marginTop: 10 }}>
                Share this link: <a href={bookingPageUrl} target="_blank" rel="noreferrer">{bookingPageUrl}</a>
              </p>
            )}
          </div>

          <div className="card">
            <h3>New event type</h3>
            <form onSubmit={createEventType}>
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="30 Minute Meeting" />

              <label>Duration (minutes)</label>
              <input required type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />

              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <label>Location</label>
              <select value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value })}>
                <option value="google_meet">Google Meet (auto-generated link)</option>
                <option value="in_person">In person</option>
                <option value="phone">Phone call</option>
                <option value="custom">Custom / TBD</option>
              </select>

              <div style={{ marginTop: 14 }}>
                <button className="btn" disabled={creating}>Create event type</button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Availability</h3>
            <p>Set your weekly working hours and block off specific dates.</p>
            <Link to="/availability" className="btn secondary">Manage availability</Link>
          </div>

          <div className="card">
            <h3>Your event types</h3>
            {eventTypes.length === 0 && <p>No event types yet — create one on the left.</p>}
            {eventTypes.map((et) => (
              <div key={et._id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
                <strong>{et.title}</strong> — {et.duration} min{' '}
                <span className="badge" style={{ background: et.isActive ? '#e6f4ea' : '#f1f1f1', color: et.isActive ? '#1e7e34' : '#888' }}>
                  {et.isActive ? 'Active' : 'Hidden'}
                </span>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
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
      </div>
    </div>
  );
}
