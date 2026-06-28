import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

// ─── Reusable star rating component ──────────────────────────────────────
export default function StarRating({ comicId, size = '1.4rem' }) {
  const { user } = useAuth();
  const [average,    setAverage]    = useState(0);
  const [count,      setCount]      = useState(0);
  const [userRating, setUserRating] = useState(0); // what this user rated
  const [hovered,    setHovered]    = useState(0); // which star mouse is over
  const [loading,    setLoading]    = useState(false);

  // Load rating on mount
  useEffect(() => {
    api.get(`/comics/${comicId}/rating`)
      .then(r => {
        setAverage(r.data.average || 0);
        setCount(r.data.count || 0);
        setUserRating(r.data.userRating || 0);
      })
      .catch(() => {});
  }, [comicId]);

  // Submit a new rating
  const rate = async (stars) => {
    if (!user) return alert('Please login to rate.');
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/comics/${comicId}/rating`, { stars });
      setAverage(data.average || 0);
      setCount(data.count || 0);
      setUserRating(stars);
    } catch {
      // Demo: update locally
      setUserRating(stars);
      setAverage(stars);
      setCount(c => c + 1);
    }
    setLoading(false);
  };

  // Which value to display — hovered > userRating > 0
  const display = hovered || userRating;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
      {/* 5 clickable stars */}
      <div style={{ display:'flex', gap:2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => rate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{
              fontSize: size,
              cursor: user ? 'pointer' : 'default',
              // filled star = gold, empty = grey
              color: star <= display ? '#f4c430' : star <= average ? '#f4c43066' : '#444',
              transition: 'color 0.15s, transform 0.1s',
              transform: star <= display ? 'scale(1.15)' : 'scale(1)',
              display: 'inline-block',
              lineHeight: 1,
            }}>
            ★
          </span>
        ))}
      </div>

      {/* Average number + vote count */}
      <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
        {average > 0 ? average.toFixed(1) : '—'}
        {count > 0 && <span style={{ color:'var(--text-dim)', marginLeft:3 }}>({count})</span>}
      </span>

      {/* Show what this user rated */}
      {userRating > 0 && (
        <span style={{ fontSize:'0.72rem', color:'#f4c430' }}>
          Your rating: {userRating}★
        </span>
      )}
    </div>
  );
}
