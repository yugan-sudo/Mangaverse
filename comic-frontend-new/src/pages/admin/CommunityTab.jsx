import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';

function CommunityTab({ onToast }) {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async (pg = 0, reset = true) => {
    setLoading(true);
    try {
      const { data } = await api.get('/community/posts', { params: { page: pg, size: 15, sort: 'latest' } });
      const items = Array.isArray(data) ? data : (data.content || []);
      setPosts(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length === 15);
    } catch { onToast('❌ Failed to load posts'); }
    setLoading(false);
  }, [onToast]);

  useEffect(() => { load(0, true); }, [load]);

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/admin/community/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      onToast('✅ Post deleted');
    } catch { onToast('❌ Failed to delete'); }
  };

  const filtered = posts.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const CAT_COLORS = {
    general:'#3b82f6', requests:'#8b5cf6', reviews:'#f59e0b',
    recommendations:'#22c55e', news:'#e94560', 'off-topic':'#94a3b8',
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>💬 Community Posts</h1>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search posts or users…"
          style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8,
            padding:'0.5rem 0.9rem', color:'var(--text-primary)', fontSize:'0.85rem',
            outline:'none', width:220 }} />
      </div>

      {loading && posts.length === 0 ? (
        Array.from({length:5}).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:72, borderRadius:10, marginBottom:'0.6rem' }} />
        ))
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-dim)' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
          <div>No posts found</div>
        </div>
      ) : (
        <>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            {filtered.map((post, i) => {
              const catColor = CAT_COLORS[post.category] || '#94a3b8';
              return (
                <div key={post.id} style={{
                  display:'flex', alignItems:'flex-start', gap:'1rem', padding:'0.9rem 1.2rem',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition:'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* Category dot */}
                  <div style={{ width:8, height:8, borderRadius:'50%', background:catColor,
                    flexShrink:0, marginTop:6 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.88rem', marginBottom:'0.2rem',
                      display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                      <span>👤 {post.username || post.author?.username || 'Anonymous'}</span>
                      <span>🏷 {post.category}</span>
                      <span>❤️ {post.likes || 0}</span>
                      <span>💬 {post.commentCount || 0}</span>
                      <span>🕐 {timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => deletePost(post.id)}
                    style={{ background:'rgba(233,69,96,0.1)', color:'var(--accent-main)', border:'none',
                      padding:'0.3rem 0.7rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem',
                      fontWeight:600, flexShrink:0 }}>
                    🗑 Delete
                  </button>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button onClick={() => { const next = page + 1; setPage(next); load(next, false); }}
              disabled={loading}
              style={{ width:'100%', marginTop:'1rem', padding:'0.65rem', background:'var(--bg-card)',
                border:'1px solid var(--border)', borderRadius:10, color:'var(--text-muted)',
                fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}>
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default CommunityTab;
