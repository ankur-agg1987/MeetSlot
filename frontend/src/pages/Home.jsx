import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Avatar from '../components/Avatar';

export default function Home() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/advisors')
      .then(({ data }) => setAdvisors(data.advisors))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="hero">
        <h1>Book a One-on-One Career Advisory Session with a CDC Advisor</h1>
        <p>
          The Career Development Center connects you directly with dedicated advisors for
          resume reviews, interview preparation, placement guidance and more — pick an
          advisor below and choose a time that works for you.
        </p>
        <div className="stats">
          <div>
            <div className="stat-num">{advisors.length}</div>
            <div className="stat-label">Advisors available</div>
          </div>
          <div>
            <div className="stat-num">No login</div>
            <div className="stat-label">Book instantly as a student</div>
          </div>
          <div>
            <div className="stat-num">Free</div>
            <div className="stat-label">For all MRIIRS / MRU students</div>
          </div>
        </div>
      </div>

      <div className="container">
        <h2 className="section-title">Choose Your Advisor</h2>
        <p className="section-sub">Select an advisor to view their available session types and time slots.</p>

        {loading && <p style={{ textAlign: 'center' }}>Loading advisors...</p>}
        {!loading && advisors.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            No advisors are available for booking right now. Please check back later.
          </p>
        )}

        <div className="advisor-grid">
          {advisors.map((a) => (
            <Link key={a.username} to={`/advisor/${a.username}`} className="advisor-card">
              <Avatar name={a.name} photoUrl={a.photoUrl} />
              <h3>{a.name}</h3>
              <div className="designation">{a.designation}{a.department ? ` · ${a.department}` : ''}</div>
              {a.bio && <div className="bio">{a.bio}</div>}
              <span className="btn accent">Book a Session</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
