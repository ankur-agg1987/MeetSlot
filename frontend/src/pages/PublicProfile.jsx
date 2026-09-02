import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function PublicProfile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/public/${username}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [username]);

  if (error) return <div className="container"><p>{error}</p></div>;
  if (!data) return <div className="container">Loading...</div>;

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        {data.organizer.picture && (
          <img src={data.organizer.picture} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        )}
        <h2>{data.organizer.name}</h2>
        <p>Select an event type to see available times.</p>
      </div>

      {data.eventTypes.map((et) => (
        <Link key={et._id} to={`/u/${username}/${et.slug}`} className="card" style={{ display: 'block', color: 'inherit' }}>
          <strong style={{ color: et.color }}>{et.title}</strong>
          <p style={{ margin: '6px 0 0', color: '#666' }}>{et.duration} min · {et.locationType.replace('_', ' ')}</p>
          {et.description && <p style={{ marginTop: 6 }}>{et.description}</p>}
        </Link>
      ))}
    </div>
  );
}
