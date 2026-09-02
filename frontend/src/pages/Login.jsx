import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';

const ERROR_MESSAGES = {
  missing_code: 'Google did not return an authorization code. Please try again.',
  oauth_failed: 'Something went wrong connecting your Google account.',
  reconnect_required:
    "We couldn't get calendar permissions this time. Go to myaccount.google.com/permissions, remove MeetSlot's access, then try connecting again.",
};

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');

  function connectAsOrganizer() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      {error && (
        <div className="card" style={{ borderColor: '#e0245e', color: '#c62828' }}>
          {ERROR_MESSAGES[error] || 'Login failed. Please try again.'}
        </div>
      )}

      <div className="card">
        <h2>Book a meeting</h2>
        <p>Sign in with your Gmail account to book a session with someone.</p>
        <GoogleSignInButton onSuccess={() => navigate('/my-bookings')} />
      </div>

      <div className="card">
        <h2>Host meetings</h2>
        <p>
          Connect your Google Calendar to set your availability and let others book time
          with you. This grants MeetSlot permission to check your free/busy time and create
          calendar invites.
        </p>
        <button className="btn" onClick={connectAsOrganizer}>Connect Google Calendar</button>
      </div>
    </div>
  );
}
