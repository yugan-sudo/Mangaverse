import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// ─── Demo suggestions shown when backend is offline ───────────────────────
const DEMO_TITLES = [
  'Shadow Chronicles','Eternal Flame','Dragon Sanctuary','Neon Tokyo',
  'Void Walkers','Crimson Moon','Steel Wings','Lost Paradise',
  'Thunder God','Phantom Blade','Silver Soul','Dark Horizon',
];

// ─── Debounce hook — waits ms after user stops typing before firing ────────
function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ─── Main SearchSuggestions component ─────────────────────────────────────
// Drop-in replacement for any search <input> — wrap your input with this
export default function SearchSuggestions({ className, style, placeholder = 'Search manga…' }) {
  const navigate  = useNavigate();
  const wrapRef   = useRef(null); // ref to whole component to detect outside click

  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);   // dropdown visible?
  const [highlighted, setHighlighted] = useState(-1);      // keyboard nav index

  const debounced = useDebounce(query, 280); // wait 280ms after user stops typing

  // ── Fetch suggestions from backend ────────────────────────────────────
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]); setOpen(false); return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/comics/suggestions?q=${encodeURIComponent(q)}`);
      setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
      setOpen(true);
    } catch {
      // Backend offline → filter demo titles locally
      const matched = DEMO_TITLES
        .filter(t => t.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8)
        .map((t, i) => ({ id: i + 1, title: t, genre: 'Manga',
          coverImage: `https://picsum.photos/seed/${i + 10}/40/56` }));
      setSuggestions(matched);
      setOpen(matched.length > 0);
    }
    setLoading(false);
  }, []);

  // Run fetch whenever debounced query changes
  useEffect(() => { fetchSuggestions(debounced); }, [debounced, fetchSuggestions]);

  // ── Close dropdown when clicking outside ──────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Navigate to comic or search page ──────────────────────────────────
  const go = (comic) => {
    setOpen(false); setQuery('');
    navigate(`/comic/${comic.id}`);
  };

  const goSearch = () => {
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/?search=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  // ── Keyboard navigation (↑ ↓ Enter Escape) ────────────────────────────
  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && suggestions[highlighted]) go(suggestions[highlighted]);
      else goSearch();
    } else if (e.key === 'Escape') {
      setOpen(false); setHighlighted(-1);
    }
  };

  return (
    <div ref={wrapRef} style={{ position:'relative', ...style }} className={className}>
      {/* ── Search input ────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem',
        background:'var(--bg-elevated)', border:'1px solid var(--border)',
        borderRadius: open && suggestions.length > 0 ? '12px 12px 0 0' : '40px',
        padding:'0.4rem 1rem',
        transition:'border-radius 0.15s',
        boxShadow: open ? '0 0 0 2px rgba(67,97,238,0.2)' : 'none' }}>
        <span style={{ color:'var(--text-dim)', flexShrink:0 }}>
          {loading ? '⏳' : '🔍'}
        </span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlighted(-1); }}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{ background:'none', border:'none', outline:'none',
            color:'var(--text-primary)', fontSize:'0.88rem', flex:1, minWidth:0 }}
        />
        {/* Clear button */}
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); }}
            style={{ background:'none', border:'none', color:'var(--text-dim)',
              cursor:'pointer', padding:0, fontSize:'0.9rem', lineHeight:1, flexShrink:0 }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Dropdown suggestions ─────────────────────────────────────── */}
      {open && suggestions.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:500,
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderTop:'none', borderRadius:'0 0 12px 12px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
          overflow:'hidden',
        }}>
          {suggestions.map((comic, i) => (
            <div key={comic.id}
              onMouseEnter={() => setHighlighted(i)}
              onMouseLeave={() => setHighlighted(-1)}
              onClick={() => go(comic)}
              style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                padding:'0.55rem 1rem', cursor:'pointer',
                background: highlighted === i ? 'var(--bg-elevated)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                transition:'background 0.12s',
              }}>
              {/* Cover thumbnail */}
              <img src={comic.coverImage || `https://picsum.photos/seed/${comic.id}/40/56`}
                alt={comic.title}
                style={{ width:32, height:44, objectFit:'cover', borderRadius:4, flexShrink:0 }}
                onError={e => { e.target.src = `https://picsum.photos/seed/${comic.id+50}/40/56`; }} />

              {/* Title + genre */}
              <div style={{ flex:1, minWidth:0 }}>
                {/* Highlight matched part of title */}
                <HighlightMatch text={comic.title} query={query} />
                <div style={{ fontSize:'0.7rem', color:'var(--accent-blue)', marginTop:2 }}>
                  {comic.genre} {comic.status && `· ${comic.status}`}
                </div>
              </div>

              {/* Arrow hint */}
              <span style={{ color:'var(--text-dim)', fontSize:'0.75rem', flexShrink:0 }}>
                {highlighted === i ? '↵' : '→'}
              </span>
            </div>
          ))}

          {/* "See all results" footer */}
          <div onClick={goSearch}
            style={{ padding:'0.6rem 1rem', textAlign:'center', cursor:'pointer',
              fontSize:'0.8rem', fontWeight:600, color:'var(--accent-main)',
              background:'var(--bg-elevated)',
              borderTop:'1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}>
            🔍 See all results for "<strong>{query}</strong>"
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Highlights the matching part of the text in bold red ─────────────────
function HighlightMatch({ text, query }) {
  if (!query || !text) return <span style={{ fontWeight:600, fontSize:'0.85rem' }}>{text}</span>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span style={{ fontWeight:600, fontSize:'0.85rem' }}>{text}</span>;

  return (
    <span style={{ fontWeight:600, fontSize:'0.85rem' }}>
      {text.slice(0, idx)}
      <span style={{ color:'var(--accent-main)', background:'rgba(233,69,96,0.12)',
        borderRadius:3, padding:'0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
}
