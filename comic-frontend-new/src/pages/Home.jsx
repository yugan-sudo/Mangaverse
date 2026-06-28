import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';

/* ── helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtViews(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

const GENRES = ['All','Action','Romance','Fantasy','Horror','Comedy','Sci-Fi','Drama','Slice of Life'];
const STATUS_COLORS = { ONGOING: '#22c55e', COMPLETED: '#3b82f6', HIATUS: '#f59e0b' };
const ANNC_ICONS = { MAINTENANCE: '🔧', UPDATE: '✨', WARNING: '⚠️', INFO: '📢' };

/* ══════════════════════════════════════════════════════════════════════════
   MAIN HOME PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [comics,         setComics]         = useState([]);
  const [announcements,  setAnnouncements]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [anncLoading,    setAnncLoading]    = useState(true);
  const [sideBanners,    setSideBanners]    = useState([]);
  const [heroBanners,    setHeroBanners]    = useState([]);
  const [topBarBanner,   setTopBarBanner]   = useState(null);
  const [recommendations,  setRecommendations]  = useState({ reason:'', comics:[] });
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [hotComics,        setHotComics]         = useState([]);
  const [activeGenre,    setActiveGenre]    = useState('All');
  const [popularTab,     setPopularTab]     = useState('weekly');
  const [updatesPage,    setUpdatesPage]    = useState(0);
  const [bookmarkedIds,  setBookmarkedIds]  = useState(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: 'MangaVerse — Read Manga, Manhwa & Manhua Free',
    description: 'Read manga, manhwa and manhua online for free. Thousands of titles updated daily.',
  });

  /* ── fetch comics ─────────────────────────────────────────────────────── */
  const fetchComics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/comics', { params: { page: 0, size: 100, sort: 'popular' } });
      const items = Array.isArray(data) ? data : (data.content || []);
      setComics(items.length > 0 ? items : []);
    } catch {
      setComics([]);
    }
    setLoading(false);
  }, []);

  /* ── fetch announcements from backend ─────────────────────────────────── */
  const fetchAnnouncements = useCallback(async () => {
    setAnncLoading(true);
    try {
      const { data } = await api.get('/announcements/latest', { params: { limit: 4 } });
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      setAnnouncements([]);
    }
    setAnncLoading(false);
  }, []);

  /* ── fetch all banners ──────────────────────────────────────────────── */
  const fetchSideBanners = useCallback(async () => {
    try {
      const [sideRes, heroRes, topRes] = await Promise.allSettled([
        api.get('/banners', { params: { placement: 'SIDEBAR'  } }),
        api.get('/banners', { params: { placement: 'HERO'     } }),
        api.get('/banners', { params: { placement: 'TOP_BAR'  } }),
      ]);
      if (sideRes.status === 'fulfilled') setSideBanners(Array.isArray(sideRes.value.data) ? sideRes.value.data : []);
      if (heroRes.status === 'fulfilled') setHeroBanners(Array.isArray(heroRes.value.data) ? heroRes.value.data : []);
      if (topRes.status  === 'fulfilled') setTopBarBanner((topRes.value.data || [])[0] || null);
    } catch { /* silently ignore */ }
  }, []);

  /* ── fetch user bookmarks (for toggle state) ─────────────────────────── */
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/bookmarks');
      const ids = new Set((Array.isArray(data) ? data : []).map(b => b.comic?.id || b.comicId));
      setBookmarkedIds(ids);
    } catch { /* silently ignore */ }
  }, [user]);

  useEffect(() => { fetchComics(); fetchAnnouncements(); fetchSideBanners(); }, [fetchComics, fetchAnnouncements, fetchSideBanners]);

  useEffect(() => {
    // Hot Right Now
    api.get('/discovery/hot', { params:{ limit:10 } })
      .then(({ data }) => setHotComics(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Currently Reading (from reading progress)
    if (user) {
      api.get('/progress/all')
        .then(({ data }) => setCurrentlyReading(Array.isArray(data) ? data.slice(0, 3) : []))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    api.get('/recommendations', { params:{ limit:12 } })
      .then(({ data }) => setRecommendations(data))
      .catch(() => {});
  }, []);
  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  /* ── bookmark toggle ─────────────────────────────────────────────────── */
  const toggleBookmark = async (comicId, e) => {
    e?.stopPropagation();
    if (!comicId || comicId === undefined) return;
    if (!user) { navigate('/login'); return; }
    const wasBookmarked = bookmarkedIds.has(comicId);
    // Optimistic update
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      wasBookmarked ? next.delete(comicId) : next.add(comicId);
      return next;
    });
    try {
      if (wasBookmarked) {
        await api.delete(`/bookmarks/${comicId}`);
      } else {
        await api.post('/bookmarks', { comicId });
      }
    } catch {
      // Revert on error
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        wasBookmarked ? next.add(comicId) : next.delete(comicId);
        return next;
      });
    }
  };

  /* ── derived lists ───────────────────────────────────────────────────── */
  const filtered = activeGenre === 'All'
    ? comics
    : comics.filter(c => c.genre?.toLowerCase().split(/[,，\s]+/).map(g => g.trim()).includes(activeGenre.toLowerCase()));

  const latestUpdates = [...filtered]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(updatesPage * 6, (updatesPage + 1) * 6);

  const totalPages = Math.ceil(filtered.length / 6);

  const popular = [...comics].sort((a, b) => {
    if (popularTab === 'weekly')  return (b.views || 0) - (a.views || 0);
    if (popularTab === 'monthly') return (b.rating || 0) - (a.rating || 0);
    return ((b.views || 0) * (b.rating || 1)) - ((a.views || 0) * (a.rating || 1));
  }).slice(0, 10);

  const newArrivals = [...comics].sort((a, b) => b.id - a.id).slice(0, 12);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* ── TOP BAR BANNER ──────────────────────────────────────────────── */}
      {topBarBanner && <TopBarBanner banner={topBarBanner} />}

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <HeroBanner
        comics={comics.slice(0, 5)}
        heroBanners={heroBanners}
        loading={loading}
        navigate={navigate}
        bookmarkedIds={bookmarkedIds}
        toggleBookmark={toggleBookmark}
        user={user}
      />

      {/* ── GENRE FILTER BAR ────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 64, zIndex: 90 }}>
        <div className="page-container" style={{ padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', padding: '0.65rem 0',
            scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {GENRES.map(g => (
              <button key={g}
                onClick={() => { setActiveGenre(g); setUpdatesPage(0); }}
                style={{
                  flexShrink: 0, padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.8rem',
                  fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeGenre === g ? 'var(--accent-main)' : 'var(--bg-elevated)',
                  color: activeGenre === g ? '#fff' : 'var(--text-muted)',
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT + SIDEBAR ──────────────────────────────────────── */}
      <div className="page-container" style={{ paddingTop: 'clamp(1rem, 3vw, 1.5rem)', paddingBottom: '3rem' }}>
        <div className="home-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ══ LEFT ═══════════════════════════════════════════════════════ */}
          <div>
            {/* Latest Updates */}
            {/* ── Currently Reading ───────────────────────── */}
            {currentlyReading.length > 0 && (
              <div style={{ marginBottom:'1.5rem' }}>
                <SectionHeader title="Continue Reading" icon="▶️" />
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {currentlyReading.map(p => (
                    <div key={p.comicId}
                      onClick={() => navigate(`/comic/${p.comicId}/chapter/${p.lastChapterId}`)}
                      style={{ display:'flex', gap:'0.75rem', alignItems:'center',
                        background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12,
                        padding:'0.7rem 1rem', cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent-main)'; e.currentTarget.style.background='var(--bg-elevated)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-card)'; }}>
                      <img src={p.comicCover} alt={p.comicTitle}
                        style={{ width:40, height:56, objectFit:'cover', borderRadius:6, flexShrink:0 }}
                        onError={e => e.target.src=`https://picsum.photos/seed/${p.comicId}/40/56`} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.85rem', marginBottom:'0.2rem',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.comicTitle}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Ch.{p.lastChapterNumber}
                          {p.totalChapters ? ` / ${p.totalChapters}` : ''}</div>
                        {p.totalChapters > 0 && (
                          <div style={{ height:3, background:'var(--border)', borderRadius:2, marginTop:'0.3rem', overflow:'hidden' }}>
                            <div style={{ height:'100%', background:'var(--accent-main)', borderRadius:2,
                              width:`${Math.min((p.chaptersRead/p.totalChapters)*100,100)}%` }} />
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize:'0.72rem', color:'var(--accent-main)', fontWeight:700, flexShrink:0 }}>Resume →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SectionHeader title="Latest Updates" icon="🕐" />
            <div className="updates-list" style={{ display: 'flex', flexDirection: 'column', borderRadius: 12,
              overflow: 'hidden', border: '1px solid var(--border)' }}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <UpdateRowSkeleton key={i} />)
                : latestUpdates.map((c, i) => (
                    <UpdateRow key={c.id} comic={c} navigate={navigate}
                      isLast={i === latestUpdates.length - 1}
                      bookmarked={bookmarkedIds.has(c.id)}
                      onBookmark={toggleBookmark}
                    />
                  ))
              }
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.25rem',
                justifyContent: 'center', flexWrap: 'wrap' }}>
                <PaginationBtn label="‹ Prev" onClick={() => setUpdatesPage(p => Math.max(0, p - 1))} disabled={updatesPage === 0} />
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i).map(p => (
                  <PaginationBtn key={p} label={p + 1} onClick={() => setUpdatesPage(p)} active={p === updatesPage} />
                ))}
                <PaginationBtn label="Next ›" onClick={() => setUpdatesPage(p => Math.min(totalPages - 1, p + 1))} disabled={updatesPage >= totalPages - 1} />
              </div>
            )}

            {/* New Arrivals */}
            <div style={{ marginTop: '2.5rem' }}>
              <SectionHeader title="New Arrivals" icon="✨" />
              <div className="new-arrivals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                  : newArrivals.map((c, idx) => (
                      <ComicTile key={c.id} comic={{ ...c, _index: idx }} navigate={navigate}
                        bookmarked={bookmarkedIds.has(c.id)}
                        onBookmark={toggleBookmark}
                      />
                    ))
                }
              </div>
            </div>

            {/* ── RECOMMENDATIONS ─────────────────────────────────── */}
            {recommendations.comics.length > 0 && (
              <div style={{ marginTop:'2.5rem' }}>
                <SectionHeader title={recommendations.reason || 'Recommended for You'} icon="🎯" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'0.75rem' }}>
                  {recommendations.comics.map(c => (
                    <ComicTile key={c.id} comic={c} navigate={navigate}
                      bookmarked={bookmarkedIds.has(c.id)}
                      onBookmark={toggleBookmark} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ══════════════════════════════════════════════ */}
          <aside className="home-sidebar" style={{ display: 'flex', flexDirection: 'column',
            gap: '1.5rem', position: 'sticky', top: 120 }}>

            {/* Popular Rankings */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ borderBottom: '1px solid var(--border)', padding: '1rem 1.2rem 0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>🏆 Popular</div>
                <div style={{ display: 'flex' }}>
                  {[['weekly','Weekly'],['monthly','Monthly'],['all','All Time']].map(([k, label]) => (
                    <button key={k} onClick={() => setPopularTab(k)}
                      style={{
                        flex: 1, padding: '0.4rem 0', fontSize: '0.74rem', fontWeight: 600,
                        background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: popularTab === k ? '2px solid var(--accent-main)' : '2px solid transparent',
                        color: popularTab === k ? 'var(--accent-main)' : 'var(--text-muted)',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '0.5rem 0', overflow: 'hidden' }}>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <RankSkeleton key={i} />)
                  : popular.map((c, idx) => (
                      <RankRow key={c.id} comic={c} rank={idx + 1} navigate={navigate}
                        bookmarked={bookmarkedIds.has(c.id)}
                        onBookmark={toggleBookmark}
                      />
                    ))
                }
              </div>
            </div>

            {/* Sidebar Banners from admin */}
            {sideBanners.length > 0 && <SidebarBannersWidget banners={sideBanners} />}

            {/* Announcements — backend-connected */}
            <AnnouncementsWidget
              announcements={announcements}
              loading={anncLoading}
              navigate={navigate}
            />

          </aside>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO BANNER
   ══════════════════════════════════════════════════════════════════════════ */
function HeroBanner({ comics, heroBanners = [], loading, navigate, bookmarkedIds, toggleBookmark, user }) {
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const timerRef = useRef(null);

  // Use admin HERO banners if any exist, else fall back to comics
  const useAdminBanners = heroBanners.length > 0;
  const featured = useAdminBanners ? heroBanners : comics.slice(0, 5);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (featured.length === 0) return;
    timerRef.current = setInterval(() => setActive(p => (p + 1) % featured.length), 5500);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  const current = featured[active] || {};

  if (loading || (!useAdminBanners && !current.id)) {
    return <div style={{ height: isMobile ? 220 : 380, background: 'var(--bg-elevated)', animation: 'pulse 1.5s infinite' }} />;
  }

  // Normalise admin banner vs comic into same shape
  const heroItem = useAdminBanners ? {
    id:          current.id,
    title:       current.title,
    description: current.description,
    coverImage:  current.imageUrl,
    genre:       'Promo',
    author:      null,
    status:      null,
    linkUrl:     current.linkUrl,
    linkLabel:   current.linkLabel || 'Read Now',
    isAdminBanner: true,
  } : {
    ...current,
    linkUrl:   `/comic/${current.id}`,
    linkLabel: 'Read Now',
    isAdminBanner: false,
  };

  const isBookmarked = !heroItem.isAdminBanner && bookmarkedIds.has(heroItem.id);

  /* ── MOBILE HERO ─────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>
        {/* Blurred BG */}
        <img src={heroItem.coverImage} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', filter: 'blur(18px) brightness(0.25)', transform: 'scale(1.1)', display: 'block' }} />
        {/* Bottom gradient */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '1.25rem 1rem 1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-end', minHeight: 190 }}>
          {/* Cover */}
          <img src={heroItem.coverImage} alt={heroItem.title}
            onClick={() => heroItem.linkUrl && navigate(heroItem.linkUrl)}
            style={{ width: 85, height: 124, objectFit: 'cover', borderRadius: 8, flexShrink: 0,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
              border: '2px solid rgba(255,255,255,0.2)' }}
            onError={e => e.currentTarget.style.display='none'} />

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
              {(heroItem.genre ? heroItem.genre.split(/[,，]/).map(g => g.trim()).filter(Boolean) : ['Manga']).map((g, i) => (
                <span key={i} style={{ display: 'inline-block', background: 'var(--accent-main)', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: 4,
                  textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {g}
                </span>
              ))}
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.2rem',
              textShadow: '0 1px 6px rgba(0,0,0,0.8)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {heroItem.title}
            </h2>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.55rem' }}>
              {heroItem.author && <>{heroItem.author} · </>}
              {heroItem.status && <span style={{ color: STATUS_COLORS[heroItem.status] || '#22c55e' }}>{heroItem.status}</span>}
            </div>
            {/* Action buttons — compact row */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => heroItem.linkUrl && navigate(heroItem.linkUrl)}
                style={{ flex: 1, background: 'var(--accent-main)', color: '#fff', border: 'none',
                  padding: '0.45rem 0', borderRadius: 7, fontWeight: 700, fontSize: '0.75rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                ▶ {heroItem.linkLabel || 'Read'}
              </button>
              {!heroItem.isAdminBanner && <button onClick={(e) => toggleBookmark(heroItem.id, e)}
                style={{ flex: 1, background: isBookmarked ? 'rgba(233,69,96,0.35)' : 'rgba(255,255,255,0.12)',
                  color: '#fff', border: `1px solid ${isBookmarked ? 'var(--accent-main)' : 'rgba(255,255,255,0.25)'}`,
                  padding: '0.45rem 0', borderRadius: 7, fontWeight: 600, fontSize: '0.75rem',
                  cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                {isBookmarked ? '★ Saved' : '☆ Save'}
              </button>}
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', padding: '0.5rem 0 0.65rem' }}>
          {featured.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{ width: active === i ? 16 : 5, height: 5, borderRadius: 3, border: 'none',
                background: active === i ? 'var(--accent-main)' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', padding: 0, transition: 'all 0.25s' }} />
          ))}
        </div>
      </div>
    );
  }

  /* ── DESKTOP HERO ────────────────────────────────────────────────────── */
  return (
    <div style={{ position: 'relative', height: 380, overflow: 'hidden', background: '#000' }}>
      <img src={heroItem.coverImage}
        alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'blur(14px) brightness(0.3)', transform: 'scale(1.06)', display: 'block' }}
        onError={e => e.currentTarget.style.display = 'none'} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: '2rem',
        alignItems: 'center', padding: '2rem 3rem', maxWidth: 1320, margin: '0 auto', left: 0, right: 0 }}>
        {heroItem.coverImage && (
          <img src={heroItem.coverImage} alt={heroItem.title}
            onClick={() => heroItem.linkUrl && navigate(heroItem.linkUrl)}
            style={{ width: 160, height: 240, objectFit: 'cover', borderRadius: 12,
              flexShrink: 0, cursor: 'pointer', transition: 'transform 0.3s',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)', border: '2px solid rgba(255,255,255,0.15)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onError={e => e.currentTarget.style.display = 'none'} />
        )}

        <div style={{ color: '#fff', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {(heroItem.genre ? heroItem.genre.split(/[,，]/).map(g => g.trim()).filter(Boolean) : ['Promo']).map((g, i) => (
              <span key={i} style={{ display: 'inline-block', background: 'var(--accent-main)', color: '#fff',
                fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 4,
                textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {g}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', fontWeight: 800, lineHeight: 1.2,
            marginBottom: '0.65rem', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {heroItem.title}
          </h1>
          {(heroItem.author || heroItem.status) && (
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem' }}>
            {heroItem.author && <>by {heroItem.author} &nbsp;·&nbsp;</>}
            {heroItem.status && <span style={{ color: STATUS_COLORS[heroItem.status] || '#22c55e' }}>{heroItem.status}</span>}
          </div>)}
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', maxWidth: 480,
            lineHeight: 1.65, marginBottom: '1.2rem',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {heroItem.description || ''}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => heroItem.linkUrl && navigate(heroItem.linkUrl)}
              style={{ background: 'var(--accent-main)', color: '#fff', border: 'none',
                padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              ▶ {heroItem.linkLabel || 'Read Now'}
            </button>
            {!heroItem.isAdminBanner && <button onClick={(e) => toggleBookmark(heroItem.id, e)}
              style={{ background: isBookmarked ? 'rgba(233,69,96,0.3)' : 'rgba(255,255,255,0.15)',
                color: '#fff', border: `1px solid ${isBookmarked ? 'var(--accent-main)' : 'rgba(255,255,255,0.3)'}`,
                padding: '0.6rem 1.4rem', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem',
                cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onMouseEnter={e => !isBookmarked && (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => !isBookmarked && (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
              {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '6px' }}>
        {featured.map((_, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ width: active === i ? 20 : 6, height: 6, borderRadius: 3, border: 'none',
              background: active === i ? 'var(--accent-main)' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {featured.map((c, i) => (
          <img key={c.id || i} src={c.imageUrl || c.coverImage} alt={c.title} onClick={() => setActive(i)}
            style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
              border: `2px solid ${i === active ? 'var(--accent-main)' : 'transparent'}`,
              opacity: i === active ? 1 : 0.55, transition: 'all 0.25s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   UPDATE ROW
   ══════════════════════════════════════════════════════════════════════════ */
function UpdateRow({ comic, navigate, isLast, bookmarked, onBookmark }) {
  const chapters = comic.chapters || [{
    id: 1,
    chapterNumber: comic.latestChapter || 1,
    updatedAt: comic.updatedAt,
  }];

  return (
    <div
      style={{ display: 'flex', gap: '0.85rem', padding: '0.75rem 1rem',
        background: 'var(--bg-card)', borderBottom: isLast ? 'none' : '1px solid var(--border)',
        transition: 'background 0.15s', cursor: 'pointer', position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
      onClick={() => navigate(`/comic/${comic.id}`)}>

      {/* Cover */}
      <img src={comic.coverImage || `https://picsum.photos/seed/${comic.id}/80/120`}
        alt={comic.title}
        className="update-row-cover"
        style={{ width: 54, height: 78, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', paddingTop: 2 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.35, marginBottom: '0.25rem',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {comic.title}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {comic.genre?.split(/[,，]/)[0]?.trim() || ''}
          </div>
        </div>
        {/* Chapter pills — clicking goes directly to that chapter */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {chapters.slice(0, 3).map((ch, i) => (
            <div key={i}
              onClick={(e) => { e.stopPropagation(); navigate(`/comic/${comic.id}/chapter/${ch.id}`); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.borderColor = 'var(--accent-main)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ch.{ch.chapterNumber}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.67rem' }}>{timeAgo(ch.updatedAt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bookmark icon button */}
      <button
        onClick={(e) => onBookmark(comic.id, e)}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        style={{
          alignSelf: 'center', flexShrink: 0, background: 'none', border: 'none',
          fontSize: '1rem', cursor: 'pointer', padding: '0.3rem',
          color: bookmarked ? 'var(--accent-main)' : 'var(--text-dim)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-main)'}
        onMouseLeave={e => e.currentTarget.style.color = bookmarked ? 'var(--accent-main)' : 'var(--text-dim)'}>
        {bookmarked ? '★' : '☆'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   RANK ROW
   ══════════════════════════════════════════════════════════════════════════ */
function RankRow({ comic, rank, navigate, bookmarked, onBookmark }) {
  const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'var(--text-dim)';
  return (
    <div onClick={() => navigate(`/comic/${comic.id}`)}
      style={{ display: 'flex', gap: '0.5rem', padding: '0.55rem 0.85rem',
        cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center', overflow: 'hidden' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 18, flexShrink: 0, textAlign: 'center',
        fontWeight: 800, fontSize: rank <= 3 ? '0.9rem' : '0.78rem', color: rankColor }}>
        {rank}
      </div>
      <img src={comic.coverImage || `https://picsum.photos/seed/${comic.id}/60/80`}
        alt={comic.title}
        style={{ width: 32, height: 46, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, marginBottom: '0.25rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {comic.title}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'flex', gap: '0.5rem' }}>
          <span>⭐ {comic.rating}</span>
          <span>👁 {fmtViews(comic.views || 0)}</span>
        </div>
      </div>
      {/* Bookmark toggle */}
      <button
        onClick={(e) => onBookmark(comic.id, e)}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        style={{ background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer',
          padding: '0.2rem', flexShrink: 0,
          color: bookmarked ? 'var(--accent-main)' : 'var(--text-dim)', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-main)'}
        onMouseLeave={e => e.currentTarget.style.color = bookmarked ? 'var(--accent-main)' : 'var(--text-dim)'}>
        {bookmarked ? '★' : '☆'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMIC TILE (New Arrivals grid)
   ══════════════════════════════════════════════════════════════════════════ */
function ComicTile({ comic, navigate, bookmarked, onBookmark }) {
  return (
    <div onClick={() => navigate(`/comic/${comic.id}`)}
      style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
        border: '1px solid var(--border)', background: 'var(--bg-card)',
        transition: 'transform 0.2s, border-color 0.2s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-main)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
        <img src={comic.coverImage || `https://picsum.photos/seed/${comic.id}/120/180`}
          alt={comic.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          // FIX: was always loading="lazy" — images in the first visible row are
          // above the fold, so Chrome's Intervention warning fires because the
          // browser has to defer them and then replace placeholders. Using
          // loading="eager" for tiles rendered at index < 6 (first row on any
          // screen) and lazy for everything below the fold.
          loading={comic._index < 6 ? 'eager' : 'lazy'} />
        {/* Status badge */}
        {comic.status && (
          <span style={{ position: 'absolute', top: 5, left: 5,
            background: STATUS_COLORS[comic.status] || '#22c55e', color: '#fff',
            fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 3,
            textTransform: 'uppercase' }}>
            {comic.status === 'ONGOING' ? 'ON' : comic.status === 'COMPLETED' ? 'END' : 'HIA'}
          </span>
        )}
        {/* Bookmark button overlay */}
        <button
          onClick={(e) => onBookmark(comic.id, e)}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)',
            border: 'none', borderRadius: 4, width: 22, height: 22, fontSize: '0.7rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: bookmarked ? '#fbbf24' : '#fff', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}>
          {bookmarked ? '★' : '☆'}
        </button>
      </div>
      <div style={{ padding: '0.45rem 0.5rem' }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {comic.title}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: 2 }}>
          Ch.{comic.latestChapter || '—'}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS WIDGET — fetches from /api/announcements/latest
   ══════════════════════════════════════════════════════════════════════════ */
function AnnouncementsWidget({ announcements, loading, navigate }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📢 Announcements</span>
        {/* View All navigates to /announcements (or a modal) */}
        <button
          onClick={() => navigate('/announcements')}
          style={{ fontSize: '0.72rem', color: 'var(--accent-main)', background: 'none',
            border: 'none', cursor: 'pointer', fontWeight: 600, padding: '0.2rem 0.4rem',
            borderRadius: 4, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,69,96,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          View All →
        </button>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: '0.85rem 1.2rem', borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 3, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 3 }} />
            </div>
          </div>
        ))
      ) : announcements.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          No announcements right now.
        </div>
      ) : (
        announcements.map((a, i) => (
          <div key={a.id}
            style={{
              padding: '0.8rem 1.2rem',
              borderBottom: i < announcements.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 0.15s',
              display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {/* Type icon */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: a.pinned ? 'rgba(233,69,96,0.15)' : 'var(--bg-elevated)',
              border: `1px solid ${a.pinned ? 'var(--accent-main)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem',
            }}>
              {ANNC_ICONS[a.type] || '📢'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)',
                lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {a.pinned && (
                  <span style={{ fontSize: '0.6rem', background: 'var(--accent-main)', color: '#fff',
                    padding: '0.1rem 0.35rem', borderRadius: 3, fontWeight: 700, letterSpacing: 0.3,
                    textTransform: 'uppercase', flexShrink: 0 }}>
                    PIN
                  </span>
                )}
                {a.title}
              </div>
              {a.content && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.content}
                </div>
              )}
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 3 }}>
                {fmtDate(a.createdAt)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'clamp(0.6rem, 2vw, 0.85rem)' }}>
      <div style={{ width: 4, height: 20, background: 'var(--accent-main)', borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{icon} {title}</h2>
    </div>
  );
}

function PaginationBtn({ label, onClick, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        minWidth: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
        background: active ? 'var(--accent-main)' : 'var(--bg-card)',
        color: active ? '#fff' : disabled ? 'var(--text-dim)' : 'var(--text-muted)',
        fontWeight: 600, fontSize: '0.82rem', cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s', padding: '0 0.6rem', opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.borderColor = 'var(--accent-main)'; }}
      onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.borderColor = 'var(--border)'; }}>
      {label}
    </button>
  );
}

function UpdateRowSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '0.85rem', padding: '0.75rem 1rem',
      background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ width: 54, height: 78, borderRadius: 6, flexShrink: 0, minWidth: 54 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton" style={{ height: 22, width: 68, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 22, width: 68, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

function RankSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '0.65rem', padding: '0.6rem 1.2rem', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: 22, height: 16, borderRadius: 3 }} />
      <div className="skeleton" style={{ width: 36, height: 52, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 11, width: '80%', borderRadius: 3, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 9, width: '50%', borderRadius: 3 }} />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ aspectRatio: '2/3', width: '100%' }} />
      <div style={{ padding: '0.45rem 0.5rem' }}>
        <div className="skeleton" style={{ height: 10, width: '90%', borderRadius: 3, marginBottom: 5 }} />
        <div className="skeleton" style={{ height: 8, width: '50%', borderRadius: 3 }} />
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   TOP BAR BANNER — thin dismissible strip below navbar
   ══════════════════════════════════════════════════════════════════════════ */
function TopBarBanner({ banner }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      background: 'var(--gradient-purple)',
      color: '#fff', padding: '0.5rem 1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
      fontSize: '0.82rem', fontWeight: 600, position: 'relative', zIndex: 89,
    }}>
      <span>📢</span>
      <span>{banner.title}</span>
      {banner.linkUrl && (
        <a href={banner.linkUrl} style={{ color: '#fff', fontWeight: 800,
          textDecoration: 'underline', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          {banner.linkLabel || 'Learn More'} →
        </a>
      )}
      <button onClick={() => setVisible(false)}
        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
          width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
        ✕
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR BANNERS WIDGET
   ══════════════════════════════════════════════════════════════════════════ */
function SidebarBannersWidget({ banners }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const current = banners[idx] || banners[0];

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  if (!current) return null;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden' }}>
      {/* Banner image */}
      <a href={current.linkUrl || '#'} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ position: 'relative', aspectRatio: '16/7', overflow: 'hidden' }}>
          <img src={current.imageUrl} alt={current.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.3s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', lineHeight: 1.3,
              marginBottom: current.description ? '0.2rem' : 0 }}>
              {current.title}
            </div>
            {current.description && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {current.description}
              </div>
            )}
          </div>
        </div>
      </a>
      {/* CTA + dots */}
      <div style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '0.5rem' }}>
        {current.linkUrl ? (
          <a href={current.linkUrl} style={{ textDecoration: 'none' }}>
            <button style={{ background: 'var(--accent-main)', color: '#fff', border: 'none',
              padding: '0.35rem 0.9rem', borderRadius: 6, fontWeight: 700, fontSize: '0.78rem',
              cursor: 'pointer' }}>
              {current.linkLabel || 'View →'}
            </button>
          </a>
        ) : <div />}
        {banners.length > 1 && (
          <div style={{ display: 'flex', gap: 5 }}>
            {banners.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ width: idx === i ? 16 : 6, height: 6, borderRadius: 3, border: 'none',
                  background: idx === i ? 'var(--accent-main)' : 'var(--border)',
                  cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
