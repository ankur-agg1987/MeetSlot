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
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>✅ You're booked!</h2>
        <p>
          {DateTime.fromISO(booking.startTime).setZone(booking.timezone).toFormat('cccc, LLLL d, yyyy · h:mm a')}
        </p>
        <p>A calendar invite has been sent to your Gmail address.</p>
        {booking.meetLink && (
          <p>
            <a href={booking.meetLink} target="_blank" rel="noreferrer">Join Google Meet</a>
          </p>
        )}
        <Link to="/my-bookings" className="btn">View my bookings</Link>
      </div>
    </div>
  );
}
