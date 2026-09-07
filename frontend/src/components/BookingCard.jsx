import { useState } from 'react';
import { DateTime } from 'luxon';
import api from '../api/axios';

export default function BookingCard({ booking, onChanged, showRemarksForm }) {
  const [remarks, setRemarks] = useState(booking.remarks || '');
  const [actionPlan, setActionPlan] = useState(booking.actionPlan || '');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  async function send() {
    setSending(true);
    try {
      await api.post(`/bookings/${booking._id}/remarks`, { remarks, actionPlan });
      onChanged?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel this session?')) return;
    await api.post(`/bookings/${booking._id}/cancel`, { reason: 'Cancelled by advisor' });
    onChanged?.();
  }

  return (
    <div style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
      <strong>{booking.studentName}</strong> — {booking.eventType?.title}{' '}
      <span className={`badge ${booking.status}`}>{booking.status}</span>
      {booking.remarksSentAt && <span className="badge confirmed" style={{ marginLeft: 4 }}>Follow-up sent</span>}
      <p style={{ margin: '4px 0', fontSize: 13, color: '#666' }}>
        {DateTime.fromISO(booking.startTime).setZone(booking.timezone).toFormat('cccc, LLLL d · h:mm a')}
      </p>
      <p style={{ margin: '4px 0', fontSize: 13 }}>{booking.studentEmail}{booking.studentPhone && ` · ${booking.studentPhone}`}</p>
      {booking.purpose && <p style={{ margin: '4px 0', fontSize: 13 }}>Purpose: {booking.purpose}</p>}
      {booking.message && <p style={{ margin: '4px 0', fontSize: 13, color: '#666' }}>Student note: {booking.message}</p>}

      {booking.status === 'confirmed' && (
        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {showRemarksForm && (
            <button className="btn secondary" onClick={() => setOpen(!open)}>
              {open ? 'Hide' : booking.remarksSentAt ? 'View / update follow-up' : 'Add remarks & send follow-up'}
            </button>
          )}
          <button className="btn danger" onClick={cancel}>Cancel</button>
        </div>
      )}

      {open && (
        <div style={{ marginTop: 10, background: '#fafbfc', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
          <label>Discussion notes / remarks</label>
          <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="What was discussed in this session..." />
          <label>Action plan for the student</label>
          <textarea rows={3} value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} placeholder="Next steps, resources, follow-up tasks..." />
          <button className="btn" onClick={send} disabled={sending} style={{ marginTop: 10 }}>
            {sending ? 'Sending...' : 'Send to student\u2019s email'}
          </button>
        </div>
      )}
    </div>
  );
}
