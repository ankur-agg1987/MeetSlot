import { Link, useLocation } from 'react-router-dom';
import { DateTime } from 'luxon';

export default function BookingConfirmed() {
  const { state } = useLocation();
  const booking = state?.booking;

  if (!booking) {
    return (
      <div className="container">
        <p>No booking details found. <Link to="/">Go home</Link></p>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>✅ Your session is booked!</h2>
        <p>
          {DateTime.fromISO(booking.startTime).setZone(booking.timezone).toFormat('cccc, LLLL d, yyyy · h:mm a')}
        </p>
        <p>A confirmation email has been sent to your inbox, and your advisor has been notified.</p>
        <Link to="/" className="btn">Back to homepage</Link>
      </div>
    </div>
  );
}
