import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CATEGORIES = [
  { id: 'all',         icon: '🌐', label: 'All'           },
  { id: 'general',     icon: '💬', label: 'General'       },
  { id: 'requests',    icon: '📬', label: 'Requests'      },
  { id: 'reviews',     icon: '⭐', label: 'Reviews'       },
  { id: 'recommendations', icon: '🎯', label: 'Recs'      },
  { id: 'news',        icon: '📰', label: 'News'          },
  { id: 'off-topic',   icon: '🎲', label: 'Off-Topic'     },
];

const CAT_COLORS = {
  general: '#3b82f6', requests: '#8b5cf6', reviews: '#f59e0b',
  recommendations: '#22c55e', news: '#e94560', 'off-topic': '#94a3b8',
};

export default function Community() {
  useSEO({ title: 'Community — MangaVerse', description: 'Discuss manga, manhwa and manhua with the MangaVerse community.' });

  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState('all');
  const [sortBy,     setSortBy]     = useState('latest');
  const [page,       setPage]       = useState(0);
  const [hasMore,    setHasMore]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ title: '', body: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchPosts = useCallback(async (pg = 0, reset = false) => {
    setLoading(true);
    try {
      const params = { page: pg, size: 10, sort: sortBy };
      if (category !== 'all') params.category = category;
      const { data } = await api.get('/community/posts', { params });
      const items = Array.isArray(data) ? data : (data.content || []);
      setPosts(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length === 10);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [category, sortBy]);

  useEffect(() => { setPage(0); fetchPosts(0, true); }, [fetchPosts]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, false);
  };

  const submitPost = async () => {
    if (!user) { navigate('/login'); return; }
    if (!form.title?.trim()) { showToast('❌ Title is required'); return; }
    if (!form.body?.trim())  { showToast('❌ Message is required'); return; }
    setSubmitting(true);
    try {
      await api.post('/community/posts', form);
      showToast('✅ Post published!');
      setShowForm(false);
      setForm({ title: '', body: '', category: 'general' });
      setPage(0);
      fetchPosts(0, true);
    } catch {
      showToast('❌ Failed to post. Please try again.');
    }
    setSubmitting(false);
  };

  const likePost = async (id) => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/community/posts/${id}/like`);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1, liked: true } : p));
    } catch { showToast('❌ Could not like post'); }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b69 50%, #1a1a3e 100%)',
        padding: '3rem 1.5rem 3.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '0.65rem' }}>
            Community
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 460, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Discuss series, share recommendations, post requests, and connect with other readers.
          </p>
          <button
            onClick={() => user ? setShowForm(true) : navigate('/login')}
            style={{
              background: 'var(--accent-main)', color: '#fff', border: 'none',
              padding: '0.7rem 1.75rem', borderRadius: 50, fontWeight: 700,
              fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(233,69,96,0.4)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            ✏️ New Post
          </button>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <div className="two-col-sidebar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '2rem', alignItems: 'start' }}>

          {/* ── Posts column ─────────────────────────────────────────────── */}
          <div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem',
              flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    style={{
                      padding: '0.3rem 0.85rem', borderRadius: 20, fontSize: '0.78rem',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      background: category === c.id ? 'var(--accent-main)' : 'var(--bg-card)',
                      color: category === c.id ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${category === c.id ? 'transparent' : 'var(--border)'}`,
                    }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', borderRadius: 8, padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}>
                <option value="latest">Latest</option>
                <option value="popular">Most Liked</option>
                <option value="comments">Most Discussed</option>
              </select>
            </div>

            {/* Posts list */}
            {loading && posts.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem',
                background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>No posts yet</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Be the first to start a discussion!</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onLike={likePost} user={user} navigate={navigate} />
                  ))}
                </div>
                {hasMore && (
                  <button onClick={loadMore} disabled={loading}
                    style={{
                      width: '100%', marginTop: '1.25rem', padding: '0.7rem',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 10, color: 'var(--text-muted)', fontWeight: 600,
                      fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-main)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    {loading ? 'Loading…' : 'Load more posts'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside style={{ position: 'sticky', top: 120, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Community stats */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '1rem' }}>📊 Stats</div>
              {[
                { icon: '👥', label: 'Members',    value: '12.4K' },
                { icon: '💬', label: 'Posts',      value: '48.2K' },
                { icon: '🔥', label: 'Online now', value: '231'   },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.icon} {s.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.85rem' }}>📜 Rules</div>
              {[
                'Be respectful to others',
                'No spoilers without tags',
                'Stay on topic per category',
                'No spam or self-promotion',
                'Use English in posts',
              ].map((rule, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.55rem',
                  fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--accent-main)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                  {rule}
                </div>
              ))}
            </div>

            {/* Join Discord CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #5865f2, #4752c4)',
              borderRadius: 14, padding: '1.2rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🎮</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                Join our Discord
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', marginBottom: '0.85rem' }}>
                Chat in real-time with other readers
              </div>
              <a href="https://discord.gg" target="_blank" rel="noreferrer">
                <button style={{ background: '#fff', color: '#5865f2', border: 'none',
                  padding: '0.5rem 1.2rem', borderRadius: 8, fontWeight: 800,
                  fontSize: '0.82rem', cursor: 'pointer', width: '100%' }}>
                  Join Server
                </button>
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* New post modal */}
      {showForm && (
        <div onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 560,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>✏️ New Post</h2>

            <label style={labelStyle}>Category</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  style={{
                    padding: '0.3rem 0.85rem', borderRadius: 20, fontSize: '0.78rem',
                    fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: form.category === c.id ? (CAT_COLORS[c.id] || 'var(--accent-main)') : 'var(--bg-elevated)',
                    color: form.category === c.id ? '#fff' : 'var(--text-muted)',
                  }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What's your post about?"
              style={inputStyle} />

            <label style={labelStyle}>Message *</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Share your thoughts…" rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }} />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button onClick={() => setShowForm(false)}
                style={{ ...btnSecondary }}>Cancel</button>
              <button onClick={submitPost} disabled={submitting}
                style={{ ...btnPrimary, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Posting…' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '0.75rem 1.4rem', fontWeight: 600, fontSize: '0.88rem', zIndex: 9999,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({ post, onLike, user, navigate }) {
  const catColor = CAT_COLORS[post.category] || '#94a3b8';
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '1.1rem 1.25rem', transition: 'border-color 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        {/* Avatar */}
        <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${catColor}, var(--accent-main))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
          {(post.author?.username || post.username || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span style={{ background: catColor, color: '#fff', fontSize: '0.62rem', fontWeight: 700,
              padding: '0.1rem 0.45rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {post.category || 'general'}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{post.author?.username || post.username || 'Anonymous'}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{timeAgo(post.createdAt)}</span>
          </div>
          {/* Title */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', lineHeight: 1.35 }}>
            {post.title}
          </h3>
          {/* Body preview */}
          {post.body && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.body}
            </p>
          )}
          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <button onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600,
                color: post.liked ? 'var(--accent-main)' : 'var(--text-muted)',
                transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-main)'}
              onMouseLeave={e => e.currentTarget.style.color = post.liked ? 'var(--accent-main)' : 'var(--text-muted)'}>
              {post.liked ? '❤️' : '🤍'} {post.likes || 0}
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              💬 {post.commentCount || post.replies || 0}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              👁 {post.views || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function PostSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '0.75rem',
      display: 'flex', gap: '0.85rem' }}>
      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 10, width: '30%', borderRadius: 3, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '75%', borderRadius: 3, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: '90%', borderRadius: 3, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ── Shared styles ──────────────────────────────────────────────────────── */
const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600,
  display: 'block', marginBottom: '0.3rem' };

const inputStyle = { width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '0.6rem 0.85rem', color: 'var(--text-primary)',
  fontSize: '0.88rem', marginBottom: '0.85rem', outline: 'none' };

const btnPrimary = { background: 'var(--accent-main)', color: '#fff', border: 'none',
  padding: '0.55rem 1.4rem', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' };

const btnSecondary = { background: 'var(--bg-elevated)', color: 'var(--text-muted)',
  border: '1px solid var(--border)', padding: '0.55rem 1.2rem', borderRadius: 8,
  cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' };
