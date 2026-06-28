import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReadingHistory, saveReadingHistory, clearReadingHistory } from '../utils/historyStorage';

// ─── time ago helper ──────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Group history items by date ──────────────────────────────────────────
function groupByDate(items) {
  const groups = {};
  items.forEach(item => {
    const date = item.savedAt ? new Date(item.savedAt).toDateString() : 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });
  return groups;
}

// ─── Single history card ──────────────────────────────────────────────────
function HistoryCard({ item, onRemove }) {
  const navigate = useNavigate();

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'0.85rem',
      padding:'0.75rem', background:'var(--bg-card)',
      border:'1px solid var(--border)', borderRadius:12,
      transition:'border-color 0.2s',
      cursor:'pointer',
    }}
      onClick={() => navigate(`/comic/${item.comicId}/chapter/${item.chapterId}`)}
      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(67,97,238,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>

      {/* Cover image */}
      <img
        src={item.cover || `https://picsum.photos/seed/${item.comicId}/60/88`}
        alt={item.title}
        style={{ width:52, height:72, objectFit:'cover', borderRadius:8, flexShrink:0 }}
        onError={e => { e.target.src = `https://picsum.photos/seed/${Number(item.comicId)+50}/60/88`; }}
      />

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Comic title */}
        <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.2rem',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {item.title}
        </div>
        {/* Chapter number */}
        <div style={{ fontSize:'0.78rem', color:'var(--accent-blue)', fontWeight:600, marginBottom:'0.3rem' }}>
          Chapter {item.chapter}
        </div>
        {/* Progress bar */}
        <div style={{ height:3, background:'var(--border)', borderRadius:2, marginBottom:'0.3rem', width:'100%' }}>
          <div style={{
            height:'100%', borderRadius:2,
            background:'linear-gradient(90deg,#4361ee,#e94560)',
            width:`${item.progress || 20}%`,
            transition:'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-dim)' }}>
          {timeAgo(item.savedAt)}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem', flexShrink:0 }}>
        {/* Continue reading */}
        <button
          onClick={e => { e.stopPropagation(); navigate(`/comic/${item.comicId}/chapter/${item.chapterId}`); }}
          className="btn-accent"
          style={{ fontSize:'0.72rem', padding:'0.3rem 0.7rem', whiteSpace:'nowrap' }}>
          ▶ Continue
        </button>
        {/* View comic page */}
        <button
          onClick={e => { e.stopPropagation(); navigate(`/comic/${item.comicId}`); }}
          className="btn-outline"
          style={{ fontSize:'0.72rem', padding:'0.28rem 0.7rem', whiteSpace:'nowrap' }}>
          📖 Details
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(item.comicId); }}
        title="Remove from history"
        style={{ background:'none', border:'none', color:'var(--text-dim)',
          cursor:'pointer', fontSize:'1rem', padding:'0.2rem',
          flexShrink:0, lineHeight:1, alignSelf:'flex-start' }}>
        ✕
      </button>
    </div>
  );
}

// ─── Main History Page ─────────────────────────────────────────────────────
export default function History() {
  const [history, setHistory]   = useState([]);
  const [search,  setSearch]    = useState('');
  const [confirm, setConfirm]   = useState(false); // confirm clear all
  const { user } = useAuth();

  // Load history from localStorage on mount (user-specific)
  useEffect(() => {
    const raw = getReadingHistory(user);
    // Sort by most recently read first
    const sorted = raw.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
    setHistory(sorted);
  }, [user]);

  // Remove one item from history
  const remove = (comicId) => {
    const updated = history.filter(h => String(h.comicId) !== String(comicId));
    setHistory(updated);
    saveReadingHistory(user, updated);
  };

  // Clear entire history
  const clearAll = () => {
    setHistory([]);
    clearReadingHistory(user);
    setConfirm(false);
  };

  // Filter by search
  const filtered = history.filter(h =>
    !search || h.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered items by date
  const grouped = groupByDate(filtered);
  const dateKeys = Object.keys(grouped);

  return (
    <div className="page-container" style={{ maxWidth:720 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>🕐 Reading History</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>
            {history.length} manga read · Saved in your browser
          </p>
        </div>

        {/* Clear all button */}
        {history.length > 0 && (
          !confirm
            ? <button className="btn-outline"
                style={{ fontSize:'0.8rem', color:'var(--accent-main)', borderColor:'var(--accent-main)' }}
                onClick={() => setConfirm(true)}>
                🗑 Clear All
              </button>
            : <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Sure?</span>
                <button className="btn-accent" style={{ fontSize:'0.78rem', padding:'0.35rem 0.8rem' }}
                  onClick={clearAll}>Yes, Clear</button>
                <button className="btn-outline" style={{ fontSize:'0.78rem', padding:'0.35rem 0.8rem' }}
                  onClick={() => setConfirm(false)}>Cancel</button>
              </div>
        )}
      </div>

      {/* ── Search within history ────────────────────────────────────── */}
      {history.length > 3 && (
        <div className="search-bar" style={{ marginBottom:'1.5rem' }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search your history…" />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }}>✕</button>
          )}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {history.length === 0 ? (
        <div style={{ textAlign:'center', padding:'5rem 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>📭</div>
          <h2 style={{ fontSize:'1.2rem', marginBottom:'0.5rem' }}>No reading history yet</h2>
          <p style={{ fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            Start reading manga and your history will appear here automatically.
          </p>
          <Link to="/"><button className="btn-accent">Browse Manga</button></Link>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔍</div>
          <p>No results for "<strong>{search}</strong>"</p>
        </div>
      ) : (
        /* ── Grouped by date ─────────────────────────────────────────── */
        dateKeys.map(dateKey => (
          <div key={dateKey} style={{ marginBottom:'1.75rem' }}>
            {/* Date header */}
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-dim)',
              textTransform:'uppercase', letterSpacing:1.5,
              padding:'0.35rem 0', marginBottom:'0.6rem',
              borderBottom:'1px solid var(--border)' }}>
              {dateKey === new Date().toDateString() ? 'Today'
                : dateKey === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday'
                : dateKey}
            </div>

            {/* Items for this date */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {grouped[dateKey].map(item => (
                <HistoryCard key={`${item.comicId}-${item.savedAt}`}
                  item={item} onRemove={remove} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Footer note ─────────────────────────────────────────────── */}
      {history.length > 0 && (
        <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--text-dim)', marginTop:'1rem' }}>
          History is stored locally in your browser and is not synced across devices.
        </p>
      )}
    </div>
  );
}
