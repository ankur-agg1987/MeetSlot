import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="navbar">
      <Link to="/" className="brand">🎓 CDC MeetSlot</Link>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        {user ? (
          <>
            {user.role === 'master_admin' && <Link to="/master-admin">Master Admin</Link>}
            {user.role === 'advisor' && <Link to="/dashboard">My Dashboard</Link>}
            <span>{user.name}</span>
            <button className="btn secondary" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="top-login-link">Advisor / Admin Login</Link>
        )}
      </div>
    </div>
  );
}
