import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import LazyImage from './LazyImage';

// ─── Pick a comic deterministically by day of year ────────────────────────
// Same comic shows all day for all users, changes at midnight
function pickByDay(comics) {
  if (!comics.length) return null;
  const start    = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return comics[dayOfYear % comics.length];
}

export default function MangaOfTheDay() {
  const navigate = useNavigate();
  const [comic, setComic] = useState(null);

  useEffect(() => {
    api.get('/comics?size=50&sort=newest')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : r.data.content || [];
        setComic(pickByDay(list));
      })
      .catch(() => {
        // Demo fallback
        setComic({
          id: 1, title: 'Shadow Chronicles',
          author: 'Kishimoto M.', genre: 'Action',
          status: 'ONGOING',
          description: 'A young warrior discovers a forbidden power within, reshaping the fate of humanity.',
          coverImage: 'https://picsum.photos/seed/11/400/600',
        });
      });
  }, []);

  if (!comic) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      {/* Section label */}
      <div className="section-header" style={{ marginBottom: '0.75rem' }}>
        <h2 className="section-title">⭐ Manga of the Day</h2>
        {/* Countdown hint */}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Refreshes tomorrow
        </span>
      </div>

      {/* Card */}
      <div onClick={() => navigate(`/comic/${comic.id}`)}
        style={{
          display: 'flex', gap: '1.25rem', alignItems: 'stretch',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
          position: 'relative',
          transition: 'transform 0.22s, box-shadow 0.22s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>

        {/* Blurred banner background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${comic.coverImage || `https://picsum.photos/seed/${comic.id}/400/200`})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(20px) brightness(0.2)',
          transform: 'scale(1.05)',
        }} />

        {/* Cover image */}
        <LazyImage
          src={comic.coverImage || `https://picsum.photos/seed/${comic.id}/200/300`}
          alt={comic.title}
          fallbackSeed={comic.id + 20}
          style={{ width: 120, flexShrink: 0, aspectRatio: '2/3', position: 'relative', zIndex: 1 }}
        />

        {/* Info */}
        <div style={{ flex: 1, padding: '1.25rem 1.25rem 1.25rem 0', position: 'relative', zIndex: 1 }}>
          {/* Today badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'linear-gradient(135deg,#f4c430,#e8a000)',
            color: '#000', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800,
            padding: '0.2rem 0.65rem', marginBottom: '0.6rem', textTransform: 'uppercase',
          }}>
            ⭐ Today's Pick
          </div>

          {/* Title */}
          <h2 style={{ fontSize: 'clamp(1rem,2.5vw,1.4rem)', fontWeight: 800, marginBottom: '0.3rem' }}>
            {comic.title}
          </h2>

          {/* Author + genre */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            ✍️ {comic.author || 'Unknown'} &nbsp;·&nbsp;
            <span style={{ color: 'var(--accent-blue)' }}>{comic.genre}</span>
          </div>

          {/* Description (truncated) */}
          <p style={{
            fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: '0.85rem', maxWidth: 480,
          }}>
            {comic.description || 'No description available.'}
          </p>

          {/* CTA button */}
          <button className="btn-accent"
            style={{ fontSize: '0.82rem', padding: '0.45rem 1.2rem' }}
            onClick={e => { e.stopPropagation(); navigate(`/comic/${comic.id}`); }}>
            📖 Read Now
          </button>
        </div>
      </div>
    </section>
  );
}
