import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import api from '../api/axios';

const PURPOSES = ['Resume Review', 'Interview Preparation', 'Career Guidance', 'Placement Preparation', 'Internship Guidance', 'Other'];

function nextNDates(n) {
  return Array.from({ length: n }, (_, i) => DateTime.now().plus({ days: i }));
}

export default function BookEventType() {
  const { username, slug } = useParams();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
  const [slots, setSlots] = useState([]);
  const [tz, setTz] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    studentName: '',
    studentId: '',
    studentEmail: '',
    studentPhone: '',
    program: '',
    yearOrSemester: '',
    purpose: PURPOSES[0],
    message: '',
  });

  useEffect(() => {
    setLoadingSlots(true);
    setError('');
    api
      .get(`/public/advisors/${username}/${slug}/slots`, { params: { date: selectedDate } })
      .then(({ data }) => {
        setSlots(data.slots);
        setTz(data.timezone);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load times'))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, username, slug]);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function confirmBooking(e) {
    e.preventDefault();
    setBooking(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', {
        username,
        slug,
        startTime: selectedSlot,
        ...form,
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
                  style={active ? { background: '#1a3d7c', color: '#fff' } : {}}
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
                style={s === selectedSlot ? { background: '#1a3d7c', color: '#fff' } : {}}
                onClick={() => setSelectedSlot(s)}
              >
                {DateTime.fromISO(s).setZone(tz).toFormat('h:mm a')}
              </button>
            ))}
        </div>
      </div>

      {selectedSlot && (
        <div className="card">
          <h3>Your details</h3>
          <p style={{ color: '#666' }}>
            Booking for {DateTime.fromISO(selectedSlot).setZone(tz).toFormat('cccc, LLLL d, yyyy · h:mm a')} ({tz})
          </p>

          <form onSubmit={confirmBooking}>
            <div className="grid-2">
              <div>
                <label>Full name *</label>
                <input required value={form.studentName} onChange={(e) => updateForm('studentName', e.target.value)} />

                <label>Student ID / Roll number</label>
                <input value={form.studentId} onChange={(e) => updateForm('studentId', e.target.value)} />

                <label>Email address *</label>
                <input required type="email" value={form.studentEmail} onChange={(e) => updateForm('studentEmail', e.target.value)} placeholder="you@example.com" />

                <label>Phone number</label>
                <input value={form.studentPhone} onChange={(e) => updateForm('studentPhone', e.target.value)} />
              </div>
              <div>
                <label>Program / Branch</label>
                <input value={form.program} onChange={(e) => updateForm('program', e.target.value)} placeholder="e.g. B.Tech CSE" />

                <label>Year / Semester</label>
                <input value={form.yearOrSemester} onChange={(e) => updateForm('yearOrSemester', e.target.value)} placeholder="e.g. 3rd Year, Sem 5" />

                <label>Purpose of meeting</label>
                <select value={form.purpose} onChange={(e) => updateForm('purpose', e.target.value)}>
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <label>Anything specific you'd like to discuss?</label>
                <textarea rows={3} value={form.message} onChange={(e) => updateForm('message', e.target.value)} />
              </div>
            </div>

            {error && <p style={{ color: '#c62828' }}>{error}</p>}
            <button className="btn" disabled={booking} style={{ marginTop: 16 }}>
              {booking ? 'Booking...' : 'Confirm booking'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
