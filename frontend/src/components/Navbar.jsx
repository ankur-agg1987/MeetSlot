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
      <Link to="/" className="brand">📅 MeetSlot</Link>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {user ? (
          <>
            {user.isOrganizer && <Link to="/dashboard">Dashboard</Link>}
            <Link to="/my-bookings">My Bookings</Link>
            <span>{user.name}</span>
            <button className="btn secondary" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="btn">Log in</Link>
        )}
      </div>
    </div>
  );
}
