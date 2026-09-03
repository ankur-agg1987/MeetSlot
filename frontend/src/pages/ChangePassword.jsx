import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters');
    if (newPassword !== confirm) return setError('Passwords do not match');

    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setUser({ ...user, mustChangePassword: false });
      navigate(user.role === 'master_admin' ? '/master-admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Set a new password</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          {user?.mustChangePassword
            ? 'For security, please set your own password before continuing.'
            : 'Update your account password.'}
        </p>
        <form onSubmit={submit}>
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          <label>Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          {error && <p style={{ color: '#c62828' }}>{error}</p>}
          <button className="btn" disabled={saving} style={{ marginTop: 16 }}>{saving ? 'Saving...' : 'Save new password'}</button>
        </form>
      </div>
    </div>
  );
}
