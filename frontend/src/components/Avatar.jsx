const COLORS = ['#1a3d7c', '#b3541e', '#1e7e5c', '#7c3aed', '#0e7490', '#b3261e', '#4d5b8c', '#8a6d00', '#2f6b3a', '#a8325c'];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

export default function Avatar({ name, photoUrl, size = 72 }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', display: 'block' }} />;
  }
  return (
    <div className="avatar" style={{ background: colorFor(name || '?'), width: size, height: size, fontSize: size * 0.3 }}>
      {initials(name || '?').toUpperCase()}
    </div>
  );
}
