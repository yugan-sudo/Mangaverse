import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { getReadChapters, markChapterAsRead } from '../utils/historyStorage';
import { getLists, addToList } from './ReadingLists';
import useSEO from '../hooks/useSEO';
import ChapterComments from '../components/ChapterComments';

/* ── helpers ─────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  const d = Math.floor(m / 1440);
  if (d < 30)   return `${d}d ago`;
  if (d < 365)  return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function fmtCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n || 0);
}

const STATUS_COLORS = { ONGOING: '#22c55e', COMPLETED: '#3b82f6', HIATUS: '#f59e0b' };

/* ── Share Modal ──────────────────────────────────────────────────────── */
function ShareModal({ title, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const text    = encodeURIComponent(`Read "${title}" on MangaVerse: ${url}`);

  const channels = [
    {
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      bg: '#25D366', color: '#fff',
      href: `https://wa.me/?text=${text}`,
    },
    {
      label: 'Telegram',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      bg: '#0088cc', color: '#fff',
      href: `https://t.me/share/url?url=${encoded}&text=${encodeURIComponent(`Read "${title}" on MangaVerse`)}`,
    },
    {
      label: 'Email',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      bg: '#EA4335', color: '#fff',
      href: `mailto:?subject=${encodeURIComponent(`Check out: ${title}`)}&body=${text}`,
    },
    {
      label: 'X / Twitter',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bg: '#000', color: '#fff',
      href: `https://x.com/intent/tweet?text=${text}`,
    },
    {
      label: 'Reddit',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      bg: '#FF4500', color: '#fff',
      href: `https://reddit.com/submit?url=${encoded}&title=${encodeURIComponent(title)}`,
    },
  ];

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); }
    catch { /* fallback */ const t = document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.6)',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        backdropFilter:'blur(4px)', padding:'0 0 env(safe-area-inset-bottom,0)' }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--bg-card,#1a1a2e)', borderRadius:'20px 20px 0 0',
          width:'100%', maxWidth:480, padding:'1.25rem 1.5rem 2rem',
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 -8px 40px rgba(0,0,0,0.5)',
          animation:'slideUp 0.25s cubic-bezier(.32,.72,0,1)',
        }}>
        {/* Handle */}
        <div style={{ width:40, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2, margin:'0 auto 1.25rem' }} />

        {/* Title */}
        <div style={{ marginBottom:'1.25rem' }}>
          <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'.08em',
            color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:'0.25rem' }}>Share</div>
          <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary,#fff)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
        </div>

        {/* Channel icons */}
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {channels.map(ch => (
            <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem',
                textDecoration:'none', color:'var(--text-primary,#fff)', minWidth:52 }}>
              <div style={{
                width:52, height:52, borderRadius:14, background:ch.bg, color:ch.color,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 4px 14px ${ch.bg}55`, transition:'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                {ch.icon}
              </div>
              <span style={{ fontSize:'0.68rem', fontWeight:500, color:'rgba(255,255,255,0.55)', textAlign:'center' }}>
                {ch.label}
              </span>
            </a>
          ))}
        </div>

        {/* Copy link row */}
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center',
          background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:12, padding:'0.6rem 0.85rem' }}>
          <div style={{ flex:1, fontSize:'0.8rem', color:'rgba(255,255,255,0.55)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {url}
          </div>
          <button onClick={copyLink}
            style={{
              flexShrink:0, background: copied ? '#22c55e' : 'var(--accent-main,#e94560)',
              color:'#fff', border:'none', borderRadius:8, padding:'0.4rem 0.9rem',
              fontSize:'0.78rem', fontWeight:700, cursor:'pointer', transition:'background 0.2s',
            }}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <style>{`@keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }`}</style>
    </div>,
    document.body
  );
}

/* ── List picker (portal) ─────────────────────────────────────────────── */
function ListPickerPortal({ anchorRef, lists, listMsg, onPick, onClose }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    const onScroll = () => { if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [anchorRef]);

  if (!rect) return null;

  // Position above the button if too close to bottom, otherwise below
  const spaceBelow = window.innerHeight - rect.bottom;
  const menuHeight = Math.min(lists.length * 48 + 80, 280);
  const top = spaceBelow >= menuHeight ? rect.bottom + 8 : rect.top - menuHeight - 8;

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9998 }} />
      {/* Menu */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:'fixed', zIndex:9999,
          top, left: rect.left,
          background:'var(--bg-card,#1a1a2e)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:12, padding:'0.4rem',
          minWidth:210, maxHeight:280, overflowY:'auto',
          boxShadow:'0 8px 40px rgba(0,0,0,0.6)',
          animation:'fadeIn 0.15s ease',
        }}>
        {listMsg && (
          <div style={{ fontSize:'0.75rem', color:'#86efac', padding:'0.35rem 0.75rem', fontWeight:600 }}>
            ✅ {listMsg}
          </div>
        )}
        {lists.length === 0 && (
          <div style={{ padding:'0.75rem', fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', textAlign:'center' }}>
            No lists yet
          </div>
        )}
        {lists.map(l => (
          <div key={l.id} onClick={() => onPick(l)}
            style={{ display:'flex', alignItems:'center', gap:'0.6rem',
              padding:'0.55rem 0.75rem', borderRadius:8, cursor:'pointer',
              fontSize:'0.88rem', color:'var(--text-primary,#fff)', transition:'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <span>{l.icon}</span><span style={{ flex:1 }}>{l.name}</span>
          </div>
        ))}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:'0.3rem', padding:'0.5rem 0.75rem' }}>
          <a href="/lists" style={{ fontSize:'0.78rem', color:'#c4b5fd', textDecoration:'none', fontWeight:600 }}>
            ⚙️ Manage Lists
          </a>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </>,
    document.body
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function ComicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [comic,         setComic]         = useState(null);
  const [chapters,      setChapters]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [bookmarked,    setBookmarked]    = useState(false);
  const [liked,         setLiked]         = useState(false);
  const [likeCount,     setLikeCount]     = useState(0);
  const [rating,        setRating]        = useState(0);
  const [ratingCount,   setRatingCount]   = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [activeTab,     setActiveTab]     = useState('chapters');
  const [chSearch,      setChSearch]      = useState('');
  const [chSort,        setChSort]        = useState('desc');
  const [showMore,      setShowMore]      = useState(false);
  const [progress,      setProgress]      = useState(null);
  const [reviews,       setReviews]       = useState({ reviews:[], average:0, count:0, myStars:0 });
  const [related,       setRelated]       = useState([]);
  const [readChapters,  setReadChapters]  = useState(() => getReadChapters(user, id));
  const [lists,         setLists]         = useState([]);
  const [showListPicker,setShowListPicker]= useState(false);
  const [listMsg,       setListMsg]       = useState('');
  const [toast,         setToast]         = useState('');
  const [showShare,     setShowShare]     = useState(false);

  // Ref for the 📂 button — used to position the portal dropdown
  const listBtnRef = useRef(null);

  useSEO({
    title:       comic?.title,
    description: comic?.description ? comic.description.slice(0, 160)
      : comic?.title ? `Read ${comic.title} online free on MangaVerse.` : undefined,
    image:       comic?.coverImage,
    type:        'article',
    author:      comic?.author,
    keywords:    comic ? [comic.title, comic.author, comic.genre, 'manga', 'manhwa', 'read online'].filter(Boolean).join(', ') : undefined,
    canonicalUrl: comic ? `${window.location.origin}/comic/${comic.id}` : undefined,
  });

  useEffect(() => { if (showListPicker) setLists(getLists()); }, [showListPicker]);

  useEffect(() => {
    if (!id || id === 'undefined') return;
    const load = async () => {
      setLoading(true);
      try {
        const [comicRes, chapRes] = await Promise.all([
          api.get(`/comics/${id}`),
          api.get(`/comics/${id}/chapters`),
        ]);
        setComic(comicRes.data);
        setChapters(Array.isArray(chapRes.data) ? chapRes.data : chapRes.data.content || []);
      } catch { setLoading(false); return; }

      await Promise.allSettled([
        api.get(`/comics/${id}/likes`).then(({data}) => { setLikeCount(data.count||0); setLiked(data.liked||false); }),
        api.get(`/comics/${id}/rating`).then(({data}) => { setRating(data.rating||0); setRatingCount(data.count||0); }),
        api.get('/bookmarks').then(({data}) => {
          const bks = Array.isArray(data) ? data : [];
          setBookmarked(bks.some(b => String(b.comic?.id) === String(id)));
          setBookmarkCount(bks.length);
        }),
        api.get(`/comics/${id}/reviews`).then(({data}) => setReviews(data)),
        api.get(`/comics/${id}/related`).then(({data}) => setRelated(Array.isArray(data) ? data : [])),
        user && api.get(`/progress/${id}`).then(({data}) => { if (data?.chaptersRead > 0) setProgress(data); }),
      ]);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const toggleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    if (!id || id === 'undefined') return;
    try {
      if (bookmarked) { await api.delete(`/bookmarks/${id}`); setBookmarked(false); showToast('Removed from bookmarks'); }
      else            { await api.post('/bookmarks', { comicId: Number(id) }); setBookmarked(true); showToast('Added to bookmarks!'); }
    } catch {}
  };

  const toggleLike = async () => {
    if (!user) { navigate('/login'); return; }
    if (!id || id === 'undefined') return;
    try {
      const { data } = await api.post(`/comics/${id}/likes`);
      setLiked(data.liked); setLikeCount(data.count);
    } catch {}
  };

  const markRead = (chId) => {
    setReadChapters(new Set([...readChapters, chId]));
    markChapterAsRead(user, id, chId);
  };

  const filteredChapters = chapters
    .filter(c => !chSearch || String(c.chapterNumber).includes(chSearch) || (c.title||'').toLowerCase().includes(chSearch.toLowerCase()))
    .sort((a, b) => chSort === 'desc' ? (b.chapterNumber - a.chapterNumber) : (a.chapterNumber - b.chapterNumber));

  if (loading) return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>
      <div style={{ height:320, background:'var(--gradient-subtle)' }} />
      <div className="page-container" style={{ marginTop:'-3rem' }}>
        <div className="skeleton" style={{ height:180, borderRadius:14, marginBottom:'1rem' }} />
        <div className="skeleton" style={{ height:400, borderRadius:14 }} />
      </div>
    </div>
  );

  if (!comic) return (
    <div style={{ textAlign:'center', padding:'6rem 2rem', color:'var(--text-dim)' }}>
      <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📚</div>
      <h2>Comic not found</h2>
    </div>
  );

  const firstChapter  = chapters[chapters.length - 1];
  const latestChapter = chapters[0];

  return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden', minHeight:320 }}>
        <img src={comic.coverImage} alt=""
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', filter:'blur(20px) brightness(0.25)', transform:'scale(1.08)', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(13,13,26,0.95) 100%)' }} />

        <div className="page-container" style={{ position:'relative', zIndex:1, paddingTop:'2rem', paddingBottom:'2.5rem' }}>
          <div style={{ display:'flex', gap:'1.75rem', alignItems:'flex-start', flexWrap:'wrap' }}>

            {/* Cover */}
            <img src={comic.coverImage} alt={comic.title}
              style={{ width:180, height:260, objectFit:'cover', borderRadius:12, flexShrink:0,
                boxShadow:'0 16px 48px rgba(0,0,0,0.7)', border:'2px solid rgba(255,255,255,0.12)' }}
              onError={e => e.target.style.display='none'} />

            {/* Info */}
            <div style={{ flex:1, minWidth:220, color:'#fff' }}>
              {/* Genre + status */}
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
                {comic.genre && comic.genre.split(',').slice(0,3).map(g => (
                  <span key={g} style={{ background:'rgba(139,92,246,0.25)', color:'#c4b5fd',
                    fontSize:'0.7rem', fontWeight:700, padding:'0.2rem 0.65rem', borderRadius:4,
                    textTransform:'uppercase', letterSpacing:0.3, border:'1px solid rgba(139,92,246,0.35)' }}>
                    {g.trim()}
                  </span>
                ))}
                <span style={{ background: STATUS_COLORS[comic.status] ? `${STATUS_COLORS[comic.status]}30` : 'rgba(34,197,94,0.2)',
                  color: STATUS_COLORS[comic.status] || '#22c55e', fontSize:'0.7rem', fontWeight:700,
                  padding:'0.2rem 0.65rem', borderRadius:4, textTransform:'uppercase', letterSpacing:0.3,
                  border:`1px solid ${STATUS_COLORS[comic.status] || '#22c55e'}50` }}>
                  ● {comic.status}
                </span>
              </div>

              <h1 style={{ fontSize:'clamp(1.4rem,4vw,2.2rem)', fontWeight:800, lineHeight:1.2,
                marginBottom:'0.3rem', textShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>
                {comic.title}
              </h1>
              <div style={{ fontSize:'0.88rem', color:'rgba(255,255,255,0.6)', marginBottom:'1rem' }}>
                by{' '}
                <span onClick={() => navigate(`/author/${encodeURIComponent(comic.author)}`)}
                  className="author-link"
                  style={{ color:'rgba(255,255,255,0.85)', fontWeight:600, cursor:'pointer' }}>
                  {comic.author || 'Unknown'}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display:'flex', gap:'1.5rem', marginBottom:'1.1rem', flexWrap:'wrap' }}>
                {[
                  { icon:'⭐', val: rating > 0 ? rating.toFixed(1) : '—', label:`${fmtCount(ratingCount)} ratings` },
                  { icon:'📖', val: fmtCount(chapters.length), label:'chapters' },
                  { icon:'🔖', val: fmtCount(bookmarkCount), label:'bookmarks' },
                  { icon:'❤️', val: fmtCount(likeCount), label:'likes' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <div style={{ fontWeight:800, fontSize:'1.1rem', lineHeight:1 }}>{s.icon} {s.val}</div>
                    <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.45)', marginTop:3, textTransform:'uppercase', letterSpacing:0.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {comic.description && (
                <div style={{ marginBottom:'1.25rem' }}>
                  <p style={{ fontSize:'0.88rem', color:'rgba(255,255,255,0.75)', lineHeight:1.7, margin:0,
                    display: showMore ? 'block' : '-webkit-box', WebkitLineClamp: showMore ? undefined : 3,
                    WebkitBoxOrient:'vertical', overflow: showMore ? 'visible' : 'hidden' }}>
                    {comic.description}
                  </p>
                  {comic.description.length > 180 && (
                    <button onClick={() => setShowMore(s => !s)}
                      style={{ background:'none', border:'none', color:'var(--accent-main)', fontSize:'0.8rem',
                        fontWeight:700, cursor:'pointer', padding:'0.25rem 0', marginTop:'0.2rem' }}>
                      {showMore ? 'Show less ▲' : 'Show more ▼'}
                    </button>
                  )}
                </div>
              )}

              {/* Tags */}
              {comic.tags && (
                // FIX: same touch-target issue as Browse.jsx cards — chips were
                // small <span> elements with only ~3px padding, well under the
                // 44x44px minimum tap target, so on phones taps frequently missed
                // the chip and hit the page background/cover behind it instead,
                // making it look like tapping a tag did nothing.
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
                  {comic.tags.split(',').slice(0,8).map(t => t.trim()).filter(Boolean).map(t => (
                    <button key={t}
                      type="button"
                      onClick={() => navigate(`/browse?tag=${encodeURIComponent(t)}`)}
                      style={{ background:'rgba(139,92,246,0.12)', color:'#a78bfa',
                        fontSize:'0.74rem', fontWeight:600, padding:'0.36rem 0.75rem', borderRadius:20,
                        border:'1px solid rgba(139,92,246,0.25)', cursor:'pointer', transition:'all 0.15s',
                        minHeight:32, WebkitTapHighlightColor:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(139,92,246,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background='rgba(139,92,246,0.12)'}>
                      #{t}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Action buttons ── */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem', maxWidth:420 }}>

                {/* Primary CTA — full width, visually dominant. Resolves directly to
                    either Resume (if progress exists) or the first chapter,
                    so it's a single unambiguous "start reading" action. */}
                {(progress || firstChapter) && (
                  <button
                    onClick={() => {
                      if (progress) navigate(`/comic/${id}/chapter/${progress.lastChapterId}`);
                      else { markRead(firstChapter.id); navigate(`/comic/${id}/chapter/${firstChapter.id}`); }
                    }}
                    style={{ background:'linear-gradient(135deg,#8b5cf6,#e94560)', color:'#fff',
                      border:'none', padding:'0.85rem 2rem', borderRadius:10, fontWeight:800,
                      fontSize:'1rem', cursor:'pointer', boxShadow:'0 8px 24px rgba(233,69,96,0.4)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                      transition:'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                    {progress ? `↺ Resume Chapter ${progress.lastChapterNumber}` : '▶ Start Reading'}
                  </button>
                )}

                {/* Secondary actions — equal-weight icon row beneath the primary CTA */}
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  <button onClick={toggleBookmark}
                    style={{ flex:'1 1 100px', background: bookmarked ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.08)',
                      color: bookmarked ? 'var(--accent-main)' : '#fff',
                      border:`1px solid ${bookmarked ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.15)'}`,
                      padding:'0.55rem', borderRadius:8, fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                    {bookmarked ? '★ Saved' : '☆ Bookmark'}
                  </button>

                  {latestChapter && latestChapter.id !== firstChapter?.id && (
                    <button onClick={() => { markRead(latestChapter.id); navigate(`/comic/${id}/chapter/${latestChapter.id}`); }}
                      style={{ flex:'1 1 100px', background:'rgba(255,255,255,0.08)', color:'#fff',
                        border:'1px solid rgba(255,255,255,0.15)', padding:'0.55rem', borderRadius:8,
                        fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                      ▶ Latest
                    </button>
                  )}

                  <button onClick={toggleLike}
                    style={{ flex:'1 1 100px', background: liked ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.08)',
                      color: liked ? '#f87171' : '#fff', border:`1px solid ${liked ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.15)'}`,
                      padding:'0.55rem', borderRadius:8, fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                    {liked ? '❤️' : '🤍'} {fmtCount(likeCount)}
                  </button>

                  <button onClick={() => setShowShare(true)} title="Share"
                    style={{ flex:'1 1 100px', background:'rgba(255,255,255,0.08)', color:'#fff',
                      border:'1px solid rgba(255,255,255,0.15)', padding:'0.55rem', borderRadius:8,
                      fontWeight:600, fontSize:'0.82rem', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:'0.35rem' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                  </button>

                  <div style={{ position:'relative' }}>
                    <button ref={listBtnRef}
                      onClick={() => { if (!showListPicker) setLists(getLists()); setShowListPicker(v => !v); }}
                      title="Add to reading list"
                      style={{ background:'rgba(255,255,255,0.08)', color:'#fff',
                        border:'1px solid rgba(255,255,255,0.15)', padding:'0.55rem 0.9rem',
                        borderRadius:8, fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                      📂
                    </button>
                    {showListPicker && (
                      <ListPickerPortal
                        anchorRef={listBtnRef}
                        lists={lists}
                        listMsg={listMsg}
                        onPick={(l) => {
                          addToList(l.id, { id:comic.id, title:comic.title, cover:comic.coverImage });
                          setListMsg(`Added to ${l.name}!`);
                          setTimeout(() => { setListMsg(''); setShowListPicker(false); }, 1500);
                        }}
                        onClose={() => setShowListPicker(false)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)',
        position:'sticky', top:'var(--navbar-height,64px)', zIndex:80 }}>
        <div className="page-container" style={{ padding:'0 1.5rem' }}>
          <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none' }}>
            {[
              ['chapters', `📖 Chapters (${chapters.length})`],
              ['reviews',  `⭐ Reviews (${reviews.count || 0})`],
              ['related',  '🔗 Related'],
              ['comments', '💬 Comments'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ flexShrink:0, padding:'0.85rem 1.2rem', background:'none', border:'none',
                  fontWeight:700, fontSize:'0.85rem', cursor:'pointer', whiteSpace:'nowrap',
                  borderBottom: activeTab === key ? '3px solid var(--accent-main)' : '3px solid transparent',
                  color: activeTab === key ? 'var(--accent-main)' : 'var(--text-muted)',
                  transition:'all 0.15s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="page-container" style={{ paddingTop:'1.5rem', paddingBottom:'5rem' }}>

        {activeTab === 'chapters' && (
          <div>
            {progress && progress.chaptersRead > 0 && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12,
                padding:'0.85rem 1.1rem', marginBottom:'1.1rem',
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>
                    <span>📖 Reading progress</span>
                    <span style={{ fontWeight:700, color:'var(--text-primary)' }}>Ch.{progress.lastChapterNumber}{chapters.length > 0 ? ` / ${chapters.length}` : ''}</span>
                  </div>
                  <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--accent-main)', borderRadius:3,
                      width:`${Math.min((progress.chaptersRead / (chapters.length || 1)) * 100, 100)}%`, transition:'width 0.6s' }} />
                  </div>
                </div>
                <button onClick={() => navigate(`/comic/${id}/chapter/${progress.lastChapterId}`)}
                  style={{ background:'var(--accent-main)', color:'#fff', border:'none', borderRadius:7,
                    padding:'0.45rem 1.1rem', fontSize:'0.82rem', fontWeight:700, cursor:'pointer', flexShrink:0 }}>
                  ↺ Resume
                </button>
              </div>
            )}

            <div style={{ display:'flex', gap:'0.6rem', marginBottom:'1rem', alignItems:'center' }}>
              <div style={{ flex:1, position:'relative' }}>
                <span style={{ position:'absolute', left:'0.8rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)' }}>🔍</span>
                <input value={chSearch} onChange={e => setChSearch(e.target.value)} placeholder="Search chapters…"
                  style={{ width:'100%', boxSizing:'border-box', background:'var(--bg-card)',
                    border:'1px solid var(--border)', borderRadius:8, padding:'0.6rem 0.85rem 0.6rem 2.2rem',
                    color:'var(--text-primary)', fontSize:'0.88rem', outline:'none' }} />
              </div>
              <button onClick={() => setChSort(s => s === 'desc' ? 'asc' : 'desc')}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8,
                  padding:'0.6rem 1rem', fontWeight:600, fontSize:'0.82rem', cursor:'pointer',
                  color:'var(--text-muted)', flexShrink:0, display:'flex', alignItems:'center', gap:'0.3rem' }}>
                {chSort === 'desc' ? '↓ Newest' : '↑ Oldest'}
              </button>
            </div>

            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ width:3, height:18, background:'var(--accent-main)', borderRadius:2, display:'inline-block' }} />
              {chapters.length} Chapters
            </div>

            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
              {filteredChapters.length === 0 ? (
                <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-dim)' }}>No chapters found</div>
              ) : filteredChapters.map((ch, i) => {
                const isRead = readChapters.has(ch.id);
                return (
                  <div key={ch.id}
                    onClick={() => { markRead(ch.id); navigate(`/comic/${id}/chapter/${ch.id}`); }}
                    style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.8rem 1.1rem',
                      cursor:'pointer', transition:'background 0.15s', opacity: isRead ? 0.55 : 1,
                      borderBottom: i < filteredChapters.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width:56, flexShrink:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.88rem', color: isRead ? 'var(--text-dim)' : 'var(--text-primary)' }}>
                        Ch.{ch.chapterNumber}
                      </div>
                      {isRead && <div style={{ fontSize:'0.62rem', color:'#22c55e', fontWeight:600 }}>✓ Read</div>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.88rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ch.title && ch.title !== `Chapter ${ch.chapterNumber}` ? ch.title : ''}
                      </div>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', flexShrink:0 }}>
                      {timeAgo(ch.createdAt || ch.scheduledAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reviews'  && <ReviewsTab comicId={id} reviews={reviews} setReviews={setReviews} />}
        {activeTab === 'related'  && <RelatedTab related={related} navigate={navigate} />}
        {activeTab === 'comments' && <ChapterComments comicId={id} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'5rem', left:'50%', transform:'translateX(-50%)',
          background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:50,
          padding:'0.65rem 1.4rem', fontWeight:600, fontSize:'0.85rem', zIndex:9999,
          boxShadow:'0 8px 30px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          title={comic.title}
          url={window.location.href}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

/* ── REVIEWS TAB ── */
function ReviewsTab({ comicId, reviews, setReviews }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myStars,  setMyStars]  = useState(reviews.myStars || 0);
  const [body,     setBody]     = useState('');
  const [hovering, setHovering] = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const submitReview = async () => {
    if (!comicId || comicId === 'undefined') { showToast('❌ Invalid comic'); return; }
    if (!user) { navigate('/login'); return; }
    if (myStars === 0) { showToast('Please select a star rating'); return; }
    setSaving(true);
    try {
      await api.post(`/comics/${comicId}/reviews`, { stars: myStars, body });
      const { data } = await api.get(`/comics/${comicId}/reviews`);
      setReviews(data); showToast('✅ Review saved!');
    } catch { showToast('❌ Failed to save review'); }
    setSaving(false);
  };

  const markHelpful = async (reviewId) => {
    try {
      await api.post(`/comics/${comicId}/reviews/${reviewId}/helpful`);
      setReviews(prev => ({ ...prev, reviews: prev.reviews.map(r => r.id === reviewId ? {...r, helpfulCount: r.helpfulCount + 1} : r) }));
    } catch {}
  };

  const starColor = (s) => s <= (hovering || myStars) ? '#f59e0b' : 'var(--border)';

  return (
    <div>
      <div style={{ display:'flex', gap:'2rem', alignItems:'center', marginBottom:'1.5rem',
        background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
        padding:'1.25rem 1.5rem', flexWrap:'wrap' }}>
        <div style={{ textAlign:'center', minWidth:80 }}>
          <div style={{ fontSize:'3rem', fontWeight:800, lineHeight:1, color:'#f59e0b' }}>
            {reviews.average > 0 ? reviews.average.toFixed(1) : '—'}
          </div>
          <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:4 }}>
            {reviews.count} review{reviews.count !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ flex:1 }}>
          {[5,4,3,2,1].map(s => {
            const cnt = (reviews.reviews||[]).filter(r => r.stars===s).length;
            const pct = reviews.count > 0 ? (cnt / reviews.count) * 100 : 0;
            return (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-dim)', width:16, textAlign:'right' }}>{s}★</span>
                <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:'#f59e0b', borderRadius:3 }} />
                </div>
                <span style={{ fontSize:'0.68rem', color:'var(--text-dim)', width:14 }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.85rem' }}>✍️ Write a Review</div>
        <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.85rem', alignItems:'center' }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} type="button"
              onMouseEnter={() => setHovering(s)} onMouseLeave={() => setHovering(0)}
              onClick={() => user ? setMyStars(myStars===s?0:s) : navigate('/login')}
              style={{ fontSize:'1.8rem', background:'none', border:'none', cursor:'pointer',
                color:starColor(s), transition:'transform 0.1s',
                transform:(hovering||myStars)>=s?'scale(1.15)':'scale(1)' }}>★</button>
          ))}
          {myStars > 0 && (
            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:600, marginLeft:'0.25rem' }}>
              {['','Poor','Fair','Good','Great','Excellent'][myStars]}
            </span>
          )}
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder={user ? "Share your thoughts… (optional)" : "Log in to leave a review"}
          disabled={!user} rows={3}
          style={{ width:'100%', boxSizing:'border-box', background:'var(--bg-elevated)',
            border:'1px solid var(--border)', borderRadius:8, padding:'0.6rem 0.85rem',
            color:'var(--text-primary)', fontSize:'0.88rem', resize:'vertical',
            marginBottom:'0.75rem', outline:'none', lineHeight:1.6 }} />
        <button onClick={submitReview} disabled={saving || !user || myStars === 0}
          style={{ background:'var(--accent-main)', color:'#fff', border:'none',
            padding:'0.55rem 1.4rem', borderRadius:8, fontWeight:700, fontSize:'0.88rem',
            cursor:(!user||myStars===0)?'default':'pointer', opacity:(!user||myStars===0)?0.5:1 }}>
          {saving ? 'Saving…' : 'Submit Review'}
        </button>
        {toast && <div style={{ marginTop:'0.5rem', fontSize:'0.82rem', color:toast.startsWith('✅')?'#38b060':'var(--accent-main)' }}>{toast}</div>}
      </div>

      {(reviews.reviews||[]).length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-dim)' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>⭐</div>
          <div style={{ fontWeight:600 }}>No reviews yet — be the first!</div>
        </div>
      ) : (reviews.reviews||[]).map(r => (
        <div key={r.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:14, padding:'1.1rem 1.25rem', marginBottom:'0.75rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem', flexWrap:'wrap', gap:'0.4rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
              <div style={{ width:32, height:32, borderRadius:'50%',
                background:'linear-gradient(135deg,#8b5cf6,#e94560)',
                display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.85rem' }}>
                {r.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{r.username}</div>
                <div style={{ color:'#f59e0b', fontSize:'0.85rem' }}>{'★'.repeat(r.stars)}{'☆'.repeat(5-r.stars)}</div>
              </div>
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>
              {new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
            </div>
          </div>
          {r.body && <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', lineHeight:1.65, margin:'0 0 0.75rem' }}>{r.body}</p>}
          <button onClick={() => markHelpful(r.id)}
            style={{ background:'none', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer',
              fontSize:'0.75rem', color:'var(--text-dim)', padding:'0.25rem 0.65rem', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent-main)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            👍 Helpful ({r.helpfulCount})
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── RELATED TAB ── */
function RelatedTab({ related, navigate }) {
  if (related.length === 0) return (
    <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-dim)' }}>
      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🔗</div>
      <div style={{ fontWeight:600 }}>No related comics found yet</div>
    </div>
  );
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'1rem' }}>
      {related.map(c => (
        <div key={c.id} onClick={() => navigate(`/comic/${c.id}`)}
          style={{ cursor:'pointer', borderRadius:10, overflow:'hidden',
            border:'1px solid var(--border)', background:'var(--bg-card)', transition:'transform 0.2s, border-color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='var(--accent-main)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='var(--border)'; }}>
          <div style={{ position:'relative', aspectRatio:'2/3', overflow:'hidden' }}>
            <img src={c.coverImage || `https://picsum.photos/seed/${c.id}/130/195`}
              alt={c.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            {c.status && (
              <span style={{ position:'absolute', top:5, left:5,
                background: STATUS_COLORS[c.status] || '#22c55e', color:'#fff',
                fontSize:'0.58rem', fontWeight:700, padding:'0.12rem 0.4rem', borderRadius:3 }}>
                {c.status === 'ONGOING' ? 'ON' : c.status === 'COMPLETED' ? 'END' : 'HIA'}
              </span>
            )}
          </div>
          <div style={{ padding:'0.45rem 0.5rem' }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, lineHeight:1.3,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {c.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
