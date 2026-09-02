import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import api from '../api/axios';

function BookingRow({ b, label, onCancel }) {
  return (
    <div className="card">
      <strong>{b.eventType?.title}</strong>{' '}
      <span className={`badge ${b.status}`}>{b.status}</span>
      <p style={{ margin: '6px 0' }}>
        {DateTime.fromISO(b.startTime).setZone(b.timezone).toFormat('cccc, LLLL d, yyyy · h:mm a')}
      </p>
      <p style={{ color: '#666', margin: 0 }}>{label}</p>
      {b.meetLink && b.status === 'confirmed' && (
        <p><a href={b.meetLink} target="_blank" rel="noreferrer">Join Google Meet</a></p>
      )}
      {b.status === 'confirmed' && (
        <button className="btn danger" onClick={() => onCancel(b._id)} style={{ marginTop: 8 }}>Cancel</button>
      )}
    </div>
  );
}

export default function MyBookings() {
  const [data, setData] = useState({ asOrganizer: [], asClient: [] });

  async function load() {
    const { data } = await api.get('/bookings/mine');
    setData(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    if (!confirm('Cancel this booking?')) return;
    await api.post(`/bookings/${id}/cancel`, { reason: 'Cancelled by user' });
    load();
  }

  return (
    <div className="container">
      <h2>Meetings I booked</h2>
      {data.asClient.length === 0 && <p>No bookings yet.</p>}
      {data.asClient.map((b) => (
        <BookingRow key={b._id} b={b} label={`with ${b.organizer?.name}`} onCancel={cancel} />
      ))}

      {data.asOrganizer.length > 0 && (
        <>
          <h2>Meetings booked with me</h2>
          {data.asOrganizer.map((b) => (
            <BookingRow key={b._id} b={b} label={`with ${b.clientName} (${b.clientEmail})`} onCancel={cancel} />
          ))}
        </>
      )}
    </div>
  );
}
