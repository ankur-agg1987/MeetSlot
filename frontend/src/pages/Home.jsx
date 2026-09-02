import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container" style={{ textAlign: 'center', maxWidth: 560 }}>
      <h1>Book meetings without the back-and-forth</h1>
      <p>Connect your Google Calendar, share your link, and let people book time with you automatically.</p>
      {!user && (
        <Link to="/login" className="btn">Get started</Link>
      )}
      {user?.isOrganizer && (
        <Link to="/dashboard" className="btn">Go to dashboard</Link>
      )}
      {user && !user.isOrganizer && (
        <Link to="/my-bookings" className="btn">My bookings</Link>
      )}
    </div>
  );
}
