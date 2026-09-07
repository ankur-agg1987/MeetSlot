export default function WeeklyStatsTable({ weeks }) {
  if (!weeks || weeks.length === 0) return <p>No data yet.</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #e1e4e8' }}>
            <th style={{ padding: '6px 8px' }}>Week of</th>
            <th style={{ padding: '6px 8px' }}>Received</th>
            <th style={{ padding: '6px 8px' }}>Completed</th>
            <th style={{ padding: '6px 8px' }}>Pending action</th>
            <th style={{ padding: '6px 8px' }}>Upcoming</th>
            <th style={{ padding: '6px 8px' }}>Cancelled</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.weekStart} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{w.label}</td>
              <td style={{ padding: '6px 8px' }}>{w.received}</td>
              <td style={{ padding: '6px 8px', color: '#1e7e34' }}>{w.completed}</td>
              <td style={{ padding: '6px 8px', color: '#b3541e' }}>{w.pending}</td>
              <td style={{ padding: '6px 8px' }}>{w.upcoming}</td>
              <td style={{ padding: '6px 8px', color: '#c62828' }}>{w.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
