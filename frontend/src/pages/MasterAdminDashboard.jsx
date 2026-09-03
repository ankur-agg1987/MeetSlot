import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import api from '../api/axios';

function AdvisorEditForm({ advisor, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: advisor.name,
    username: advisor.username,
    designation: advisor.designation || '',
    department: advisor.department || '',
    bio: advisor.bio || '',
    photoUrl: advisor.photoUrl || '',
    notifyEmail: advisor.notifyEmail || '',
    isActive: advisor.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/advisors/${advisor._id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (newPassword.length < 8) return setError('New password must be at least 8 characters');
    setResetting(true);
    setError('');
    try {
      await api.put(`/admin/advisors/${advisor._id}/password`, { newPassword });
      alert(`Password reset. Share it with the advisor:\n\nUsername: ${form.username}\nPassword: ${newPassword}`);
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="card" style={{ background: '#fafbfc' }}>
      <form onSubmit={save}>
        <div className="grid-2">
          <div>
            <label>Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Login username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <label>Designation</label>
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Senior Career Advisor" />
            <label>Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label>Notification Gmail (booking details are sent here)</label>
            <input type="email" value={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })} placeholder="advisor@gmail.com" required />
            <label>Short bio (shown on booking page)</label>
            <textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <label>Photo URL (optional)</label>
            <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Visible on homepage (active)
            </label>
          </div>
        </div>
        {error && <p style={{ color: '#c62828' }}>{error}</p>}
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          <button type="button" className="btn secondary" onClick={onClose}>Close</button>
        </div>
      </form>

      <hr style={{ margin: '18px 0' }} />
      <strong>Reset login password</strong>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input type="text" placeholder="New password (min 8 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button className="btn secondary" onClick={resetPassword} disabled={resetting}>Reset</button>
      </div>
    </div>
  );
}

export default function MasterAdminDashboard() {
  const [advisors, setAdvisors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('advisors');

  async function loadAdvisors() {
    const { data } = await api.get('/admin/advisors');
    setAdvisors(data.advisors);
  }
  async function loadBookings() {
    const { data } = await api.get('/admin/bookings');
    setBookings(data.bookings);
  }

  useEffect(() => {
    loadAdvisors();
    loadBookings();
  }, []);

  return (
    <div className="container">
      <h2>Master Admin</h2>
      <p style={{ color: '#666' }}>Manage the 10 advisor accounts and review all booking activity across the platform.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn ${tab === 'advisors' ? '' : 'secondary'}`} onClick={() => setTab('advisors')}>Advisor Accounts</button>
        <button className={`btn ${tab === 'bookings' ? '' : 'secondary'}`} onClick={() => setTab('bookings')}>All Bookings ({bookings.length})</button>
      </div>

      {tab === 'advisors' && (
        <>
          {advisors.map((a) => (
            <div key={a._id}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{a.name}</strong>{' '}
                  <span className={`badge ${a.isActive ? 'confirmed' : 'inactive'}`}>{a.isActive ? 'Active' : 'Hidden'}</span>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                    Username: <code>{a.username}</code> · {a.designation || 'No designation set'} · Notify: {a.notifyEmail || 'not set'}
                  </p>
                </div>
                <button className="btn secondary" onClick={() => setEditingId(editingId === a._id ? null : a._id)}>
                  {editingId === a._id ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingId === a._id && (
                <AdvisorEditForm
                  advisor={a}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    loadAdvisors();
                  }}
                />
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'bookings' && (
        <div className="card">
          {bookings.length === 0 && <p>No bookings yet.</p>}
          {bookings.map((b) => (
            <div key={b._id} style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
              <strong>{b.studentName}</strong> with <strong>{b.advisor?.name}</strong> — {b.eventType?.title}{' '}
              <span className={`badge ${b.status}`}>{b.status}</span>
              <p style={{ margin: '4px 0', fontSize: 13, color: '#666' }}>
                {DateTime.fromISO(b.startTime).toFormat('cccc, LLLL d, yyyy · h:mm a')}
              </p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>{b.studentEmail} {b.studentPhone && `· ${b.studentPhone}`}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
