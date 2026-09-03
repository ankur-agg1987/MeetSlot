import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Avatar from '../components/Avatar';

export default function PublicProfile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/public/advisors/${username}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Advisor not found'));
  }, [username]);

  if (error) return <div className="container"><p>{error}</p></div>;
  if (!data) return <div className="container">Loading...</div>;

  return (
    <div className="container narrow">
      <div className="card" style={{ textAlign: 'center' }}>
        <Avatar name={data.advisor.name} photoUrl={data.advisor.photoUrl} size={80} />
        <h2>{data.advisor.name}</h2>
        <p style={{ color: '#666' }}>{data.advisor.designation}{data.advisor.department ? ` · ${data.advisor.department}` : ''}</p>
        {data.advisor.bio && <p>{data.advisor.bio}</p>}
        <p>Select a session type below to see available times.</p>
      </div>

      {data.eventTypes.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888' }}>This advisor has no session types available right now.</p>
      )}

      {data.eventTypes.map((et) => (
        <Link key={et._id} to={`/advisor/${username}/${et.slug}`} className="card" style={{ display: 'block', color: 'inherit' }}>
          <strong style={{ color: et.color }}>{et.title}</strong>
          <p style={{ margin: '6px 0 0', color: '#666' }}>{et.duration} min · {et.locationType.replace('_', ' ')}</p>
          {et.description && <p style={{ marginTop: 6 }}>{et.description}</p>}
        </Link>
      ))}
    </div>
  );
}
