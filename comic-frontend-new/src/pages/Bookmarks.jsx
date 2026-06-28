import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Bookmarks() {
  const navigate   = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    api.get('/bookmarks')
      .then(r => setBookmarks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (comicId) => {
    try { await api.delete(`/bookmarks/${comicId}`); } catch {}
    setBookmarks(prev => prev.filter(b => b.comic?.id !== comicId));
  };

  const filtered = bookmarks.filter(b =>
    !search || b.comic?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container" style={{ maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>📖 My Library</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{bookmarks.length} saved series</p>
        </div>
      </div>

      {/* Search within bookmarks */}
      {bookmarks.length > 3 && (
        <div className="search-bar" style={{ marginBottom:'1.25rem' }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your library…" />
          {search && <button onClick={() => setSearch('')}
            style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }}>✕</button>}
        </div>
      )}

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:'1rem' }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio:'2/3', borderRadius:14 }} />
              <div className="skeleton" style={{ height:12, margin:'0.5rem 0 0.25rem', borderRadius:4 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>📚</div>
          <h2 style={{ fontSize:'1.2rem', marginBottom:'0.5rem' }}>
            {search ? 'No results found' : 'Your library is empty'}
          </h2>
          <p style={{ fontSize:'0.88rem', marginBottom:'1.5rem' }}>
            {search ? 'Try a different search term.' : 'Start saving manga you love.'}
          </p>
          {!search && <Link to="/"><button className="btn-accent">Browse Manga</button></Link>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:'1.25rem' }}>
          {filtered.map(b => {
            const c = b.comic || {};
            const cover = c.coverImage || `https://picsum.photos/seed/${c.id}/200/300`;
            return (
              <div key={b.id} style={{ position:'relative', cursor:'pointer' }}
                onClick={() => navigate(`/comic/${c.id}`)}>
                <div style={{ position:'relative', borderRadius:14, overflow:'hidden',
                  aspectRatio:'2/3', background:'var(--bg-elevated)' }}>
                  <img src={cover} alt={c.title} loading="lazy"
                    style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.3s' }}
                    onError={e => { e.target.src = `https://picsum.photos/seed/${c.id+99}/200/300`; }}
                    onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform='scale(1)'} />
                  {/* Remove button */}
                  <button onClick={e => { e.stopPropagation(); remove(c.id); }}
                    title="Remove from library"
                    style={{ position:'absolute', top:6, right:6, background:'rgba(233,69,96,0.85)',
                      color:'#fff', border:'none', borderRadius:'50%', width:26, height:26,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>
                    ✕
                  </button>
                  {/* Status badge */}
                  {c.status && (
                    <span style={{ position:'absolute', bottom:6, left:6,
                      background: c.status==='ONGOING' ? 'rgba(67,97,238,0.85)' :
                                  c.status==='COMPLETED' ? 'rgba(56,176,96,0.85)' : 'rgba(247,37,133,0.85)',
                      color:'#fff', fontSize:'0.58rem', fontWeight:800, padding:'0.15rem 0.45rem',
                      borderRadius:20, textTransform:'uppercase' }}>
                      {c.status}
                    </span>
                  )}
                </div>
                <div style={{ marginTop:'0.5rem' }}>
                  <div style={{ fontWeight:700, fontSize:'0.82rem', lineHeight:1.3,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'var(--accent-blue)', marginTop:2 }}>{c.genre}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-dim)', marginTop:2 }}>
                    Saved {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
