import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      if (user.mustChangePassword) {
        navigate('/change-password');
      } else if (user.role === 'master_admin') {
        navigate('/master-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Advisor / Admin Login</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          This login is for CDC advisors and the master administrator only.
          Students do not need to log in — go back to the homepage to book a session directly.
        </p>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: '#c62828' }}>{error}</p>}
          <button className="btn" disabled={submitting} style={{ marginTop: 16 }}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
