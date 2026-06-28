import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReadChapters } from '../utils/historyStorage';
import LazyImage from './LazyImage';

const STATUS_CLASS = {
  ONGOING:   'badge-ongoing',
  COMPLETED: 'badge-completed',
  HIATUS:    'badge-hiatus',
};

// ─── Read progress from localStorage ─────────────────────────────────────
// Returns { readCount, totalChapters, percent }
function getReadProgress(user, comicId, totalChapters) {
  if (!comicId || !totalChapters) return null;
  try {
    const readSet = getReadChapters(user, comicId);
    const readCount = readSet.size;
    if (readCount === 0) return null;
    const percent = Math.min(100, Math.round((readCount / totalChapters) * 100));
    return { readCount, totalChapters, percent };
  } catch { return null; }
}

export default function ComicCard({ comic, compact = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cover    = comic.coverImage || `https://picsum.photos/seed/${comic.id}/200/300`;
  const progress = getReadProgress(user, comic.id, comic.totalChapters || comic.chapterCount);

  // ── Compact mode (used in horizontal strips) ──────────────────────────
  if (compact) {
    return (
      <div onClick={() => navigate(`/comic/${comic.id}`)}
        style={{ cursor:'pointer', borderRadius:10, overflow:'hidden',
          background:'var(--bg-card)', border:'1px solid var(--border)',
          transition:'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
        <LazyImage src={cover} alt={comic.title} fallbackSeed={comic.id + 99}
          style={{ width:'100%', aspectRatio:'2/3' }} />
        <div style={{ padding:'0.4rem 0.5rem' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, lineHeight:1.3,
            display:'-webkit-box', WebkitLineClamp:2,
            WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {comic.title}
          </div>
        </div>
      </div>
    );
  }

  // ── Full card ─────────────────────────────────────────────────────────
  return (
    <div className="comic-card"
      onClick={() => navigate(`/comic/${comic.id}`)}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/comic/${comic.id}`)}>

      <div className="comic-card-img-wrapper">
        {/* Lazy-loaded cover with blur placeholder */}
        <LazyImage src={cover} alt={comic.title} fallbackSeed={comic.id + 99}
          style={{ width:'100%', height:'100%' }} />

        {/* Status badge */}
        {comic.status && (
          <span className={`comic-card-badge ${STATUS_CLASS[comic.status] || 'badge-ongoing'}`}>
            {comic.status}
          </span>
        )}

        {/* Hover overlay */}
        <div className="comic-card-overlay">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/comic/${comic.id}`); }}
            style={{ background:'var(--accent-main)', color:'#fff', border:'none',
              borderRadius:20, padding:'0.35rem 0.9rem',
              fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>
            Read Now
          </button>
        </div>
      </div>

      <div className="comic-card-body">
        <div className="comic-card-title">{comic.title}</div>
        <div className="comic-card-genre">{comic.genre || 'Manga'}</div>
        <div className="comic-card-meta">
          {comic.rating > 0 && (
            <span style={{ color:'#f4c430' }}>{'★'.repeat(Math.round(comic.rating))} </span>
          )}
          <span>{comic.author || 'Unknown'}</span>
        </div>

        {/* ── Read Progress bar ─────────────────────────────────────── */}
        {/* Shows only if user has read at least one chapter */}
        {progress && (
          <div style={{ marginTop:'0.45rem' }}>
            {/* Progress bar track */}
            <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:2,
                background: progress.percent === 100
                  ? 'linear-gradient(90deg,#38b060,#2d9a52)' // green when completed
                  : 'linear-gradient(90deg,#4361ee,#e94560)',
                width: `${progress.percent}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            {/* Ch. X / Y label */}
            <div style={{ fontSize:'0.62rem', color:'var(--text-dim)', marginTop:2 }}>
              {progress.percent === 100
                ? '✓ Completed'
                : `Ch. ${progress.readCount} / ${progress.totalChapters} read`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
