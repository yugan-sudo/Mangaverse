import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// ─── Real-time update banner ──────────────────────────────────────────────
// Polls /api/comics/recent every 60s and shows a banner when new chapters arrive
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function RealtimeUpdates() {
  const [updates, setUpdates] = useState([]);  // list of recent updates
  const [show,    setShow]    = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/comics/recent?size=5`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.content || [];
        setUpdates(items.slice(0, 3));
      } catch { /* backend offline, ignore */ }
    };

    check(); // run immediately on mount
    const interval = setInterval(check, 60000); // then every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (!show || updates.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(67,97,238,0.15), rgba(233,69,96,0.15))',
      border: '1px solid rgba(67,97,238,0.3)',
      borderRadius: 10, padding: '0.6rem 1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem',
    }}>
      {/* Live indicator dot */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#38b060', display: 'inline-block',
          boxShadow: '0 0 6px #38b060',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-muted)' }}>
          RECENTLY UPDATED
        </span>
      </div>

      {/* Scrolling list of recent manga */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
        {updates.map(c => (
          <Link key={c.id} to={`/comic/${c.id}`}
            style={{ fontSize:'0.78rem', color:'var(--accent-main)',
              textDecoration:'none', fontWeight:600 }}>
            📖 {c.title}
          </Link>
        ))}
      </div>

      {/* Close button */}
      <button onClick={() => setShow(false)}
        style={{ background:'none', border:'none', color:'var(--text-dim)',
          cursor:'pointer', fontSize:'1rem', padding:0, lineHeight:1 }}>
        ✕
      </button>
    </div>
  );
}
