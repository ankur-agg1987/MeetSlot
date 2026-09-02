import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

function nextNDates(n) {
  return Array.from({ length: n }, (_, i) => DateTime.now().plus({ days: i }));
}

export default function BookEventType() {
  const { username, slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
  const [slots, setSlots] = useState([]);
  const [tz, setTz] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingSlots(true);
    setError('');
    api
      .get(`/public/${username}/${slug}/slots`, { params: { date: selectedDate } })
      .then(({ data }) => {
        setSlots(data.slots);
        setTz(data.timezone);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load times'))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, username, slug]);

  async function confirmBooking() {
    setBooking(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', {
        username,
        slug,
        startTime: selectedSlot,
        notes,
      });
      navigate('/booking-confirmed', { state: { booking: data.booking } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="container">
      <div className="grid-2">
        <div className="card">
          <h3>Pick a date</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {nextNDates(14).map((d) => {
              const iso = d.toISODate();
              const active = iso === selectedDate;
              return (
                <button
                  key={iso}
                  className="btn secondary"
                  style={active ? { background: '#0069ff', color: '#fff' } : {}}
                  onClick={() => {
                    setSelectedDate(iso);
                    setSelectedSlot(null);
                  }}
                >
                  {d.toFormat('EEE d MMM')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3>Available times {tz && <span style={{ fontSize: 12, color: '#888' }}>({tz})</span>}</h3>
          {loadingSlots && <p>Loading...</p>}
          {!loadingSlots && slots.length === 0 && <p>No available times on this date.</p>}
          {!loadingSlots &&
            slots.map((s) => (
              <button
                key={s}
                className="slot-btn"
                style={s === selectedSlot ? { background: '#0069ff', color: '#fff' } : {}}
                onClick={() => setSelectedSlot(s)}
              >
                {DateTime.fromISO(s).setZone(tz).toFormat('h:mm a')}
              </button>
            ))}
        </div>
      </div>

      {selectedSlot && (
        <div className="card">
          <h3>Confirm booking</h3>
          <p>
            {DateTime.fromISO(selectedSlot).setZone(tz).toFormat('cccc, LLLL d, yyyy · h:mm a')} ({tz})
          </p>

          {!user ? (
            <>
              <p>Sign in with Gmail to confirm this booking.</p>
              <GoogleSignInButton />
            </>
          ) : (
            <>
              <p>Booking as <strong>{user.name}</strong> ({user.email})</p>
              <label>Notes for the organizer (optional)</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              {error && <p style={{ color: '#c62828' }}>{error}</p>}
              <button className="btn" onClick={confirmBooking} disabled={booking} style={{ marginTop: 12 }}>
                {booking ? 'Booking...' : 'Confirm'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
