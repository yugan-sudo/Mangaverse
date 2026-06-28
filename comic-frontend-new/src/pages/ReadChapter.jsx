import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import ChapterComments from '../components/ChapterComments';
import ChapterReactions from '../components/ChapterReactions';
import ReadingSettings, { loadReadingSettings, saveReadingSettings, detectReadingMode } from '../components/ReadingSettings';
import { getReadingHistory, saveReadingHistory, markChapterAsRead } from '../utils/historyStorage';

const demoPages = (chId) =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, pageNumber: i + 1,
    imageUrl: `https://picsum.photos/seed/ch${chId}p${i + 1}/900/1280`,
  }));

export default function ReadChapter() {
  const { comicId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pages,        setPages]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [settings,     setSettings]     = useState(loadReadingSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [showBar,      setShowBar]      = useState(true);
  const [prevChId,     setPrevChId]     = useState(null);
  const [nextChId,     setNextChId]     = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [comicTitle,   setComicTitle]   = useState('');
  const [comicGenre,   setComicGenre]   = useState('');
  const [allChapters,  setAllChapters]  = useState([]);
  const [showChList,   setShowChList]   = useState(false);
  const [currentPage,  setCurrentPage]  = useState(0);
  const [badgeToast,   setBadgeToast]   = useState('');
  const [zoom,         setZoom]         = useState(() => Number(localStorage.getItem('readerZoom') || 100));
  const [direction,    setDirection]    = useState(() => localStorage.getItem('readerDir') || 'ltr');
  const [autoNext,     setAutoNext]     = useState(false);
  const [autoNextCount,setAutoNextCount]= useState(3);

  const autoNextRef = useRef(null);
  const scrollTimer = useRef(null);
  const hideTimer   = useRef(null);
  const commentsRef = useRef(null); // anchor for "jump to comments"

  // Derive effective mode before any useEffect.
  const effectiveMode = settings.readingMode === 'auto'
    ? detectReadingMode(comicGenre)
    : settings.readingMode;

  const isPageMode   = effectiveMode === 'page';
  const isScrollMode = effectiveMode === 'scroll';

  const bg = settings.darkMode ? '#0a0a0a' : '#e8e8e8';
  const toolbarVisible = settings.showToolbar === 'always' ? true :
                         settings.showToolbar === 'never'  ? false : showBar;

  // ── Persist zoom + direction ──────────────────────────────────────────
  useEffect(() => { localStorage.setItem('readerZoom', zoom); }, [zoom]);
  useEffect(() => { localStorage.setItem('readerDir', direction); }, [direction]);

  // ── Load pages ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setProgress(0);
      setCurrentPage(0);
      setShowChList(false);

      try {
        const { data } = await api.get(`/chapters/${chapterId}/pages`);
        setPages(Array.isArray(data) ? data : data.content || []);
      } catch {
        setPages(demoPages(Number(chapterId)));
      }

      try {
        const [chapRes, comicRes] = await Promise.all([
          api.get(`/comics/${comicId}/chapters`),
          api.get(`/comics/${comicId}`),
        ]);
        const list = Array.isArray(chapRes.data) ? chapRes.data : chapRes.data.content || [];
        setAllChapters(list);
        setComicTitle(comicRes.data?.title || '');
        setComicGenre(comicRes.data?.genre || '');
        const idx = list.findIndex(c => String(c.id) === String(chapterId));
        const ch  = list[idx];
        setChapterTitle(ch?.title || `Chapter ${ch?.chapterNumber || chapterId}`);
        setPrevChId(idx > 0 ? list[idx - 1].id : null);
        setNextChId(idx < list.length - 1 ? list[idx + 1].id : null);

        const history = getReadingHistory(user);
        saveReadingHistory(user, [
          { comicId, chapterId, title: comicRes.data?.title || `Comic ${comicId}`,
            cover: comicRes.data?.coverImage || '',
            chapter: ch?.chapterNumber || chapterId,
            progress: 20, savedAt: new Date().toISOString() },
          ...history.filter(h => String(h.comicId) !== String(comicId)),
        ].slice(0, 20));

        markChapterAsRead(user, comicId, chapterId);

        if (user && comicId && chapterId && comicId !== 'undefined' && chapterId !== 'undefined') {
          try {
            const { data: prog } = await api.post(`/progress/${comicId}/chapter/${chapterId}`);
            if (prog.newBadges?.length > 0) {
              setBadgeToast(`🏅 Badge earned: ${prog.newBadges[0]}`);
              setTimeout(() => setBadgeToast(''), 4000);
            }
          } catch { /* optional */ }
        }
      } catch {
        setChapterTitle(`Chapter ${chapterId}`);
        setPrevChId(Number(chapterId) > 1 ? Number(chapterId) - 1 : null);
        setNextChId(Number(chapterId) + 1);
      }

      setLoading(false);
    };
    load();
    window.scrollTo(0, 0);
  }, [chapterId, comicId]);

  // ── Preload adjacent pages ────────────────────────────────────────────
  useEffect(() => {
    if (!isPageMode || pages.length === 0) return;
    const depth = settings.preloadDepth || 2;
    for (let i = 1; i <= depth; i++) {
      const next = pages[currentPage + i];
      if (next?.imageUrl) {
        const img = new Image();
        img.src = next.imageUrl;
      }
    }
  }, [currentPage, pages, isPageMode, settings.preloadDepth]);

  // ── Auto-next countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (!autoNext || !nextChId) return;
    setAutoNextCount(3);
    autoNextRef.current = setInterval(() => {
      setAutoNextCount(c => {
        if (c <= 1) { clearInterval(autoNextRef.current); navigate(`/comic/${comicId}/chapter/${nextChId}`); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(autoNextRef.current);
  }, [autoNext, nextChId, comicId, navigate]);

  // ── Scroll progress + auto-hide toolbar (vertical scroll) ────────────
  const onScroll = useCallback(() => {
    const doc = document.documentElement;
    const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
    setProgress(Math.min(100, pct || 0));
    if (settings.showToolbar === 'auto') {
      setShowBar(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowBar(false), 3500);
    }
  }, [settings.showToolbar]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  useEffect(() => {
    if (settings.showToolbar === 'always') setShowBar(true);
    if (settings.showToolbar === 'never')  setShowBar(false);
  }, [settings.showToolbar]);

  // ── Auto scroll (vertical scroll mode only now) ───────────────────────
  useEffect(() => {
    const mode = settings.readingMode === 'auto' ? detectReadingMode(comicGenre) : settings.readingMode;
    const speed = settings.scrollSpeed || 2;
    if (settings.autoScroll && mode === 'scroll') {
      scrollTimer.current = setInterval(() => window.scrollBy(0, speed), 50);
    } else {
      clearInterval(scrollTimer.current);
    }
    return () => clearInterval(scrollTimer.current);
  }, [settings.autoScroll, settings.scrollSpeed, settings.readingMode, comicGenre]);

  // ── Keyboard handler ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const mode = settings.readingMode === 'auto' ? detectReadingMode(comicGenre) : settings.readingMode;
      const inPageMode = mode === 'page';
      const isRTL = direction === 'rtl';

      if (inPageMode) {
        const fwdKey  = isRTL ? 'ArrowLeft'  : 'ArrowRight';
        const backKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

        if (e.key === fwdKey || e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentPage + 1 < pages.length) setCurrentPage(p => p + 1);
          else if (nextChId) {
            if (settings.autoAdvance) navigate(`/comic/${comicId}/chapter/${nextChId}`);
            else setAutoNext(true);
          }
        }
        if (e.key === backKey || e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentPage - 1 >= 0) setCurrentPage(p => Math.max(0, p - 1));
          else if (prevChId) navigate(`/comic/${comicId}/chapter/${prevChId}`);
        }
      }

      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 10, 200));
      if (e.key === '-')                   setZoom(z => Math.max(z - 10, 50));
      if (e.key === '0')                   setZoom(100);

      if (e.key === 'Escape') { setShowChList(false); setShowSettings(false); }
      if (e.key === 's')      setShowSettings(v => !v);
      if (e.key === 'f')      document.documentElement.requestFullscreen?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [settings.readingMode, settings.autoAdvance, comicGenre, direction,
      currentPage, pages.length, nextChId, prevChId, comicId, navigate]);

  // ── Progress for page mode ────────────────────────────────────────────
  useEffect(() => {
    if (isPageMode && pages.length > 0) {
      setProgress(Math.round(((currentPage + 1) / pages.length) * 100));
    }
  }, [currentPage, pages.length, isPageMode]);

  // ── Navigate helpers ──────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (isPageMode) {
      if (currentPage + 1 < pages.length) { setCurrentPage(p => p + 1); return; }
    }
    if (nextChId) {
      if (settings.autoAdvance) navigate(`/comic/${comicId}/chapter/${nextChId}`);
      else setAutoNext(true);
    }
  }, [isPageMode, currentPage, pages.length, nextChId, settings.autoAdvance, comicId, navigate]);

  const goPrev = useCallback(() => {
    if (isPageMode) {
      if (currentPage - 1 >= 0) { setCurrentPage(p => Math.max(0, p - 1)); return; }
    }
    if (prevChId) navigate(`/comic/${comicId}/chapter/${prevChId}`);
  }, [isPageMode, currentPage, prevChId, comicId, navigate]);

  // ── Swipe support (page mode only) ────────────────────────────────────
  const touchStart = useRef(null);
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40 && isPageMode) {
      const isRTL = direction === 'rtl';
      if (dx < 0) isRTL ? goPrev() : goNext();
      else        isRTL ? goNext() : goPrev();
    }
    touchStart.current = null;
  };

  // ── NEW: scroll-to-top / jump-to-comments floating arrows ─────────────
  // Hidden by default. Double-clicking anywhere on the reader reveals them
  // for a few seconds, then they auto-hide again.
  const [showJumpArrows, setShowJumpArrows] = useState(false);
  const jumpArrowsHideTimer = useRef(null);

  const revealJumpArrows = useCallback(() => {
    setShowJumpArrows(true);
    clearTimeout(jumpArrowsHideTimer.current);
    jumpArrowsHideTimer.current = setTimeout(() => setShowJumpArrows(false), 3000);
  }, []);

  useEffect(() => () => clearTimeout(jumpArrowsHideTimer.current), []);

  const jumpToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isPageMode) setCurrentPage(0);
    clearTimeout(jumpArrowsHideTimer.current);
    jumpArrowsHideTimer.current = setTimeout(() => setShowJumpArrows(false), 3000);
  };

  const jumpToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearTimeout(jumpArrowsHideTimer.current);
    jumpArrowsHideTimer.current = setTimeout(() => setShowJumpArrows(false), 3000);
  };

  // ── Image style helper ────────────────────────────────────────────────
  const imgStyle = (extra = {}) => ({
    display: 'block',
    maxWidth: `${zoom}%`,
    width: zoom === 100 ? '100%' : undefined,
    margin: '0 auto',
    userSelect: 'none',
    ...extra,
  });

  return (
    <div
      style={{ background: bg, minHeight: '100vh' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onDoubleClick={revealJumpArrows}
      onClick={() => { if (settings.showToolbar === 'auto') setShowBar(v => !v); setShowChList(false); }}>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 200, height: 3,
        width: `${progress}%`, background: 'linear-gradient(90deg,#4361ee,#e94560)',
        transition: 'width 0.15s', pointerEvents: 'none' }} />

      {/* ── Toolbar ── */}
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 199,
          background: 'rgba(8,8,14,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0.5rem 0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.4rem', flexWrap: 'wrap',
          opacity: toolbarVisible ? 1 : 0,
          transform: toolbarVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.3s, transform 0.3s' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Link to={`/comic/${comicId}`}
            style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              fontSize: '0.78rem', padding: '0.28rem 0.6rem',
              background: 'rgba(255,255,255,0.07)', borderRadius: 6, whiteSpace: 'nowrap' }}>
            ← {comicTitle ? comicTitle.slice(0, 15) + (comicTitle.length > 15 ? '…' : '') : 'Back'}
          </Link>
          <button onClick={() => prevChId && navigate(`/comic/${comicId}/chapter/${prevChId}`)}
            disabled={!prevChId}
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: '#ccc',
              background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
              cursor: prevChId ? 'pointer' : 'default', opacity: prevChId ? 1 : 0.4 }}>
            ‹ Prev
          </button>
          <button onClick={() => nextChId && navigate(`/comic/${comicId}/chapter/${nextChId}`)}
            disabled={!nextChId}
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: '#ccc',
              background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
              cursor: nextChId ? 'pointer' : 'default', opacity: nextChId ? 1 : 0.4 }}>
            Next ›
          </button>
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: 200, textAlign: 'center' }}>
          <button onClick={e => { e.stopPropagation(); setShowChList(v => !v); }}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 6, fontSize: '0.72rem',
              cursor: 'pointer', maxWidth: '100%', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {chapterTitle} · {Math.round(progress)}% ▾
          </button>
          {showChList && allChapters.length > 0 && (
            <div onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', top: '110%', left: '50%',
                transform: 'translateX(-50%)', zIndex: 300,
                background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '0.4rem', maxHeight: 260,
                overflowY: 'auto', minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              {allChapters.map(ch => (
                <div key={ch.id}
                  onClick={() => { navigate(`/comic/${comicId}/chapter/${ch.id}`); setShowChList(false); }}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: 6, cursor: 'pointer',
                    fontSize: '0.78rem',
                    background: String(ch.id) === String(chapterId) ? 'rgba(233,69,96,0.2)' : 'transparent',
                    color: String(ch.id) === String(chapterId) ? '#e94560' : '#ccc' }}>
                  Ch. {ch.chapterNumber} {ch.title ? `— ${ch.title}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>

          {isPageMode && !loading && pages.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input type="number" min={1} max={pages.length} value={currentPage + 1}
                onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= pages.length) setCurrentPage(v - 1); }}
                style={{ width: 42, fontSize: '0.7rem', textAlign: 'center',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4, color: '#fff', padding: '0.1rem 0.2rem' }} />
              <span>/{pages.length}</span>
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button onClick={() => setZoom(z => Math.max(z - 10, 50))}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#ccc', borderRadius: 4, padding: '0.15rem 0.45rem',
                fontSize: '0.82rem', cursor: 'pointer', lineHeight: 1 }}>−</button>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', minWidth: 32, textAlign: 'center' }}>
              {zoom}%
            </span>
            <button onClick={() => setZoom(z => Math.min(z + 10, 200))}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#ccc', borderRadius: 4, padding: '0.15rem 0.45rem',
                fontSize: '0.82rem', cursor: 'pointer', lineHeight: 1 }}>+</button>
          </div>

          {isPageMode && (
            <button onClick={() => setDirection(d => d === 'ltr' ? 'rtl' : 'ltr')}
              title={direction === 'rtl' ? 'Right-to-left (manga)' : 'Left-to-right'}
              style={{ background: direction === 'rtl' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${direction === 'rtl' ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.15)'}`,
                color: '#ccc', borderRadius: 4, padding: '0.18rem 0.5rem',
                fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}>
              {direction === 'rtl' ? '→ RTL' : '→ LTR'}
            </button>
          )}

          {isScrollMode && (
            <button onClick={() => { const u = { ...settings, autoScroll: !settings.autoScroll }; setSettings(u); saveReadingSettings(u); }}
              style={{ fontSize: '0.68rem', padding: '0.22rem 0.55rem',
                background: settings.autoScroll ? '#e94560' : 'rgba(255,255,255,0.08)',
                border: settings.autoScroll ? 'none' : '1px solid rgba(255,255,255,0.15)',
                color: '#fff', borderRadius: 4, cursor: 'pointer' }}>
              {settings.autoScroll ? '⏸ Auto' : '▶ Auto'}
            </button>
          )}

          <button onClick={e => { e.stopPropagation(); setShowSettings(v => !v); }}
            style={{ fontSize: '0.68rem', padding: '0.22rem 0.55rem',
              background: showSettings ? '#e94560' : 'rgba(255,255,255,0.08)',
              border: showSettings ? 'none' : '1px solid rgba(255,255,255,0.15)',
              color: '#fff', borderRadius: 4, cursor: 'pointer' }}>
            ⚙️
          </button>
        </div>
      </div>

      {/* ── SCROLL MODE ── vertical strip */}
      {isScrollMode && (
        <div style={{ paddingTop: 48, maxWidth: 900, margin: '0 auto' }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton"
                  style={{ width: '100%', height: 500, marginBottom: settings.pageGap, borderRadius: 0 }} />
              ))
            : pages.map(p => (
                <img key={p.id} src={p.imageUrl} alt={`Page ${p.pageNumber}`}
                  loading="lazy"
                  style={{ ...imgStyle(), marginBottom: settings.pageGap }} />
              ))}
        </div>
      )}

      {/* ── PAGE MODE — single page ── */}
      {isPageMode && (
        <div style={{ paddingTop: 48, maxWidth: 900, margin: '0 auto',
          minHeight: 'calc(100vh - 48px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: 600, borderRadius: 0 }} />
          ) : pages.length > 0 ? (
            <>
              <img key={pages[currentPage]?.id} src={pages[currentPage]?.imageUrl}
                alt={`Page ${currentPage + 1}`}
                style={{ ...imgStyle({ animation: 'fadeIn 0.18s ease' }) }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem', background: 'rgba(0,0,0,0.7)', width: '100%',
                justifyContent: 'center', boxSizing: 'border-box' }}>
                <button onClick={goPrev} disabled={currentPage === 0 && !prevChId}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                    padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.85rem',
                    cursor: 'pointer', opacity: currentPage === 0 && !prevChId ? 0.4 : 1 }}>
                  {direction === 'rtl' ? 'Next ›' : '‹ Prev'}
                </button>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem',
                  minWidth: 80, textAlign: 'center' }}>
                  {currentPage + 1} / {pages.length}
                </span>
                <button onClick={goNext}
                  style={{ background: currentPage === pages.length - 1 ? '#e94560' : 'rgba(255,255,255,0.12)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {currentPage < pages.length - 1
                    ? (direction === 'rtl' ? '‹ Prev' : 'Next ›')
                    : 'Next Chapter →'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Bottom nav (scroll mode) */}
      {!loading && isScrollMode && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem',
          padding: '2rem 1rem 1.5rem', background: 'rgba(0,0,0,0.8)', flexWrap: 'wrap' }}>
          <button disabled={!prevChId} onClick={() => prevChId && navigate(`/comic/${comicId}/chapter/${prevChId}`)}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
              padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer',
              opacity: prevChId ? 1 : 0.4 }}>
            ‹ Previous Chapter
          </button>
          <Link to={`/comic/${comicId}`}>
            <button style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
              padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
              📋 Chapter List
            </button>
          </Link>
          <button disabled={!nextChId} onClick={() => nextChId && navigate(`/comic/${comicId}/chapter/${nextChId}`)}
            style={{ background: nextChId ? '#e94560' : 'rgba(255,255,255,0.08)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem',
              fontWeight: 700, cursor: nextChId ? 'pointer' : 'default', opacity: nextChId ? 1 : 0.4 }}>
            Next Chapter ›
          </button>
        </div>
      )}

      {/* Hint bar */}
      {!loading && (
        <div style={{ textAlign: 'center', padding: '0.5rem',
          fontSize: '0.62rem', color: 'rgba(255,255,255,0.15)' }}>
          {isPageMode
            ? `${direction === 'rtl' ? '← →' : '→ ←'} arrow keys · S = settings · double-click for jump arrows · swipe to navigate`
            : '↑ ↓ scroll · S = settings · double-click for jump arrows'}
        </div>
      )}

      {/* Auto-next overlay */}
      {autoNext && nextChId && (
        <div style={{ position: 'fixed', bottom: '6rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,14,24,0.95)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, padding: '1rem 1.5rem', textAlign: 'center', zIndex: 9000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
            Next chapter in <strong style={{ color: '#e94560', fontSize: '1.1rem' }}>{autoNextCount}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={() => { clearInterval(autoNextRef.current); setAutoNext(false); }}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '0.4rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={() => navigate(`/comic/${comicId}/chapter/${nextChId}`)}
              style={{ background: '#e94560', color: '#fff', border: 'none', borderRadius: 8,
                padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              Go Now
            </button>
          </div>
        </div>
      )}

      {/* Badge toast */}
      {badgeToast && (
        <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#8b5cf6,#e94560)', color: '#fff', borderRadius: 50,
          padding: '0.75rem 1.75rem', fontWeight: 700, fontSize: '0.92rem', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {badgeToast}
        </div>
      )}

      {/* ── NEW: floating jump-to-top / jump-to-comments arrows ──
            Hidden by default. Double-click anywhere on the reader (background,
            not buttons) shows them for 3 seconds, then they fade out again.
            Each click also resets that 3-second window. ── */}
      <div style={{ position: 'fixed', right: '1rem', bottom: '6.5rem', zIndex: 500,
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
        opacity: showJumpArrows ? 1 : 0,
        transform: showJumpArrows ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: showJumpArrows ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, transform 0.25s ease' }}>
        <button onClick={(e) => { e.stopPropagation(); jumpToTop(); }}
          title="Scroll to top"
          aria-label="Scroll to top"
          style={{ width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(20,20,30,0.85)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
            transition: 'background 0.15s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,69,96,0.85)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,20,30,0.85)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          ↑
        </button>
        <button onClick={(e) => { e.stopPropagation(); jumpToComments(); }}
          title="Jump to comments"
          aria-label="Jump to comments"
          style={{ width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(20,20,30,0.85)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
            transition: 'background 0.15s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(67,97,238,0.85)'; e.currentTarget.style.transform = 'translateY(2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,20,30,0.85)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          ↓
        </button>
      </div>

      <ChapterReactions chapterId={chapterId} />

      {/* anchor wrapper so the down-arrow can scroll straight to comments */}
      <div ref={commentsRef}>
        {!loading && <ChapterComments chapterId={chapterId} chapterTitle={chapterTitle} />}
      </div>

      {showSettings && (
        <ReadingSettings
          settings={settings}
          genre={comicGenre}
          onChange={s => { setSettings(s); saveReadingSettings(s); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  );
}
