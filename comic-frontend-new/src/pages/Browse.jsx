import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';
import LazyImage from '../components/LazyImage';

const GENRES   = ['Action','Adventure','Fantasy','Romance','Horror','Comedy','Sci-Fi','Drama','Slice of Life','Mystery','Thriller','Sports','Historical'];
const STATUSES = ['ONGOING','COMPLETED','HIATUS'];
const SORTS    = [
  { value:'popular',  label:'Most Popular'  },
  { value:'newest',   label:'Newest First'  },
  { value:'updated',  label:'Recently Updated' },
  { value:'rating',   label:'Top Rated'     },
  { value:'title',    label:'A → Z'         },
];
const POPULAR_TAGS = ['isekai','system','regression','villainess','overpowered','reincarnation','magic','dungeon','hunter','academy','harem','solo','revenge','murim'];

const STATUS_COLOR = { ONGOING:'#22c55e', COMPLETED:'#3b82f6', HIATUS:'#f59e0b' };

function fmtStatus(s) {
  return s === 'ONGOING' ? 'ON' : s === 'COMPLETED' ? 'END' : 'HIA';
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters from URL params
  const [q,          setQ]          = useState(searchParams.get('q') || '');
  const [genres,     setGenres]     = useState(searchParams.getAll('genre'));
  const [status,     setStatus]     = useState(searchParams.get('status') || '');
  const [tag,        setTag]        = useState(searchParams.get('tag') || '');
  const [sort,       setSort]       = useState(searchParams.get('sort') || 'popular');
  const [page,       setPage]       = useState(0);

  const [comics,     setComics]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [sideOpen,   setSideOpen]   = useState(window.innerWidth > 900);

  useSEO({ title: 'Browse Manga, Manhwa & Manhua', description: 'Browse thousands of manga, manhwa and manhua. Filter by genre, status, tags and sort.' });

  const SIZE = 24;

  const fetch = useCallback(async (pg = 0, reset = true) => {
    setLoading(true);
    try {
      // Only include params that have real values — never send empty strings
      const params = new URLSearchParams();
      params.set('page', pg);
      params.set('size', SIZE);
      params.set('sort', sort);
      if (q?.trim())         params.set('q',      q.trim());
      if (genres.length > 0) params.set('genre',  genres[0]); // LIKE search handles multi
      if (status)            params.set('status', status);
      if (tag?.trim())       params.set('tag',    tag.trim());

      const { data } = await api.get('/comics', { params });
      const items = Array.isArray(data) ? data : (data.content || []);
      const tot   = data.totalElements ?? data.total ?? items.length;
      setComics(prev => reset ? items : [...prev, ...items]);
      setTotal(tot);
    } catch (err) {
      console.error('Browse fetch error:', err);
      setComics([]);
    }
    setLoading(false);
  }, [q, genres, status, tag, sort]);

  useEffect(() => { setPage(0); fetch(0, true); }, [fetch]);

  // FIX: this previously ran on every `searchParams` change, creating a
  // circular fight with the URL-sync effect below (state → URL → state → URL…).
  // Clicking a tag chip called setTag(t), which triggered the URL-sync effect
  // to write the new URL, which changed `searchParams`, which re-triggered
  // THIS effect to read searchParams back into state — using a STALE closure
  // over `tag`/`genres`/etc (note the original eslint-disable on the dep array).
  // That stale read could silently overwrite the just-clicked tag with the old
  // value, making tag clicks appear to do nothing.
  //
  // Fix: only read filters FROM the URL once, on initial mount. This still
  // supports deep-linking (e.g. a shared /browse?tag=isekai link, or clicking
  // a tag chip on ComicDetails.jsx which navigates here fresh) without fighting
  // the URL-sync effect for ownership of state on every subsequent click.
  useEffect(() => {
    const urlQ      = searchParams.get('q') || '';
    const urlGenres = searchParams.getAll('genre');
    const urlStatus = searchParams.get('status') || '';
    const urlTag    = searchParams.get('tag') || '';
    const urlSort   = searchParams.get('sort') || 'popular';

    if (urlQ)               setQ(urlQ);
    if (urlGenres.length)    setGenres(urlGenres);
    if (urlStatus)           setStatus(urlStatus);
    if (urlTag)              setTag(urlTag);
    if (urlSort !== 'popular') setSort(urlSort);
    // Intentionally empty deps — mount-only. Re-syncing on every searchParams
    // change is what caused the bug; see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(total / SIZE);

  // ─── Infinite scroll ────────────────────────────────────────────────────
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    const nextPage = page + 1;
    if (nextPage >= totalPages) return;
    setLoadingMore(true);
    setPage(nextPage);
    await fetch(nextPage, false);
    setLoadingMore(false);
  }, [loadingMore, loading, page, fetch, totalPages]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);


  // Sync filters → URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (q)      p.set('q',      q);
    genres.forEach(g => p.append('genre', g));
    if (status) p.set('status', status);
    if (tag)    p.set('tag',    tag);
    if (sort !== 'popular') p.set('sort', sort);
    setSearchParams(p, { replace: true });
  }, [q, genres, status, tag, sort]);

  const toggleGenre = (g) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const clearAll = () => { setQ(''); setGenres([]); setStatus(''); setTag(''); setSort('popular'); };

  const hasFilters = q || genres.length || status || tag || sort !== 'popular';

  return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1a1a3e 0%,#2d1b69 100%)', padding:'2.5rem 1.5rem 3rem' }}>
        <div className="page-container">
          <h1 style={{ color:'#fff', fontSize:'clamp(1.5rem,4vw,2.2rem)', marginBottom:'1rem' }}>🔍 Browse</h1>
          <div style={{ position:'relative', maxWidth:560 }}>
            <span style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem' }}>🔍</span>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search by title, author, genre…"
              style={{ width:'100%', boxSizing:'border-box', padding:'0.8rem 1rem 0.8rem 2.8rem',
                borderRadius:50, border:'none', fontSize:'1rem', background:'rgba(255,255,255,0.12)',
                color:'#fff', outline:'none', backdropFilter:'blur(8px)' }} />
            {q && <button onClick={() => setQ('')} style={{ position:'absolute', right:'1rem', top:'50%',
              transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.6)',
              cursor:'pointer', fontSize:'1.1rem' }}>✕</button>}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop:'1.5rem', paddingBottom:'4rem' }}>
        <div style={{ display:'grid', gridTemplateColumns: sideOpen ? '240px 1fr' : '1fr', gap:'1.5rem', alignItems:'start' }}>

          {/* ── Sidebar filters ──────────────────────────────────────── */}
          {sideOpen && (
            <aside style={{ position:'sticky', top:74, display:'flex', flexDirection:'column', gap:'1.25rem' }}>

              {/* Sort */}
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem 1.2rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', marginBottom:'0.75rem' }}>⚡ Sort By</div>
                {SORTS.map(s => (
                  <div key={s.value}
                    onClick={() => setSort(s.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSort(s.value); } }}
                    role="button" tabIndex={0} aria-pressed={sort === s.value}
                    style={{ padding:'0.45rem 0.6rem', borderRadius:8, cursor:'pointer', fontSize:'0.84rem',
                      fontWeight: sort === s.value ? 700 : 500,
                      color: sort === s.value ? 'var(--accent-main)' : 'var(--text-muted)',
                      background: sort === s.value ? 'rgba(233,69,96,0.08)' : 'transparent',
                      transition:'all 0.15s' }}>
                    {s.label}
                  </div>
                ))}
              </div>

              {/* Status */}
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem 1.2rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', marginBottom:'0.75rem' }}>📌 Status</div>
                <div onClick={() => setStatus('')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatus(''); } }}
                  role="button" tabIndex={0} aria-pressed={!status}
                  style={{ padding:'0.35rem 0.8rem', borderRadius:8, cursor:'pointer', fontSize:'0.82rem',
                    fontWeight: !status ? 700 : 500, color: !status ? 'var(--accent-main)' : 'var(--text-muted)',
                    background: !status ? 'rgba(233,69,96,0.08)' : 'transparent', marginBottom:'0.25rem' }}>All</div>
                {STATUSES.map(s => (
                  <div key={s}
                    onClick={() => setStatus(status === s ? '' : s)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatus(status === s ? '' : s); } }}
                    role="button" tabIndex={0} aria-pressed={status === s}
                    style={{ padding:'0.35rem 0.8rem', borderRadius:8, cursor:'pointer', fontSize:'0.82rem',
                      fontWeight: status === s ? 700 : 500,
                      color: status === s ? STATUS_COLOR[s] : 'var(--text-muted)',
                      background: status === s ? `${STATUS_COLOR[s]}18` : 'transparent', marginBottom:'0.25rem' }}>
                    {s}
                  </div>
                ))}
              </div>

              {/* Genres (multi-select) */}
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem 1.2rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', marginBottom:'0.75rem' }}>🎭 Genre</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                  {GENRES.map(g => (
                    <button key={g} onClick={() => toggleGenre(g)}
                      style={{ padding:'0.28rem 0.7rem', borderRadius:20, fontSize:'0.75rem', fontWeight:600,
                        border:`1px solid ${genres.includes(g) ? 'var(--accent-main)' : 'var(--border)'}`,
                        background: genres.includes(g) ? 'var(--accent-main)' : 'transparent',
                        color: genres.includes(g) ? '#fff' : 'var(--text-muted)', cursor:'pointer' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem 1.2rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', marginBottom:'0.75rem' }}>🏷️ Tags</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
                  {POPULAR_TAGS.map(t => (
                    <button key={t} onClick={() => setTag(tag === t ? '' : t)}
                      style={{ padding:'0.22rem 0.6rem', borderRadius:20, fontSize:'0.72rem', fontWeight:600,
                        border:`1px solid ${tag === t ? '#8b5cf6' : 'var(--border)'}`,
                        background: tag === t ? '#8b5cf6' : 'transparent',
                        color: tag === t ? '#fff' : 'var(--text-muted)', cursor:'pointer' }}>
                      #{t}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearAll}
                  style={{ background:'rgba(233,69,96,0.1)', color:'var(--accent-main)', border:'1px solid rgba(233,69,96,0.25)',
                    borderRadius:10, padding:'0.6rem', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
                  ✕ Clear All Filters
                </button>
              )}
            </aside>
          )}

          {/* ── Main grid ────────────────────────────────────────────── */}
          <div>
            {/* Toolbar */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <button onClick={() => setSideOpen(o => !o)}
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8,
                    padding:'0.4rem 0.8rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer',
                    color:'var(--text-muted)' }}>
                  {sideOpen ? '← Hide' : '⚙️ Filters'}
                </button>
                {hasFilters && <span style={{ fontSize:'0.78rem', color:'var(--accent-main)', fontWeight:700 }}>Filtered</span>}
              </div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-dim)' }}>
                {loading ? 'Loading…' : `${total.toLocaleString()} results`}
              </div>
            </div>

            {/* Active tag/genre chips */}
            {(genres.length > 0 || tag || status) && (
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.85rem' }}>
                {genres.map(g => (
                  <span key={g} onClick={() => toggleGenre(g)}
                    style={{ background:'var(--accent-main)', color:'#fff', fontSize:'0.72rem', fontWeight:700,
                      padding:'0.2rem 0.6rem', borderRadius:20, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                    {g} ✕
                  </span>
                ))}
                {tag && <span onClick={() => setTag('')}
                  style={{ background:'#8b5cf6', color:'#fff', fontSize:'0.72rem', fontWeight:700,
                    padding:'0.2rem 0.6rem', borderRadius:20, cursor:'pointer' }}>
                  #{tag} ✕
                </span>}
                {status && <span onClick={() => setStatus('')}
                  style={{ background: STATUS_COLOR[status], color:'#fff', fontSize:'0.72rem', fontWeight:700,
                    padding:'0.2rem 0.6rem', borderRadius:20, cursor:'pointer' }}>
                  {status} ✕
                </span>}
              </div>
            )}

            {/* Comics grid */}
            {loading && comics.length === 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'1rem' }}>
                {Array.from({length:12}).map((_,i) => (
                  <div key={i} style={{ borderRadius:10, overflow:'hidden', border:'1px solid var(--border)' }}>
                    <div className="skeleton" style={{ aspectRatio:'2/3', width:'100%' }} />
                    <div style={{ padding:'0.5rem' }}>
                      <div className="skeleton" style={{ height:11, width:'85%', borderRadius:3, marginBottom:5 }} />
                      <div className="skeleton" style={{ height:9, width:'55%', borderRadius:3 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : comics.length === 0 ? (
              <div style={{ textAlign:'center', padding:'5rem 2rem', color:'var(--text-dim)' }}>
                <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🔍</div>
                <div style={{ fontWeight:700, marginBottom:'0.4rem' }}>No results found</div>
                <div style={{ fontSize:'0.85rem' }}>Try different filters or search terms</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'0.85rem' }}>
                {comics.map(c => (
                  <div key={c.id}
                    onClick={() => navigate(`/comic/${c.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/comic/${c.id}`); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${c.title}`}
                    style={{ cursor:'pointer', borderRadius:10, overflow:'hidden',
                      border:'1px solid var(--border)', background:'var(--bg-card)',
                      transition:'transform 0.2s,border-color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='var(--accent-main)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='var(--border)'; }}>
                    <div style={{ position:'relative', aspectRatio:'2/3', overflow:'hidden' }}>
                      <LazyImage src={c.coverImage} alt={c.title} fallbackSeed={c.id} targetWidth={260}
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      {c.status && (
                        <span style={{ position:'absolute', top:5, left:5, background: STATUS_COLOR[c.status] || '#22c55e',
                          color:'#fff', fontSize:'0.58rem', fontWeight:700, padding:'0.12rem 0.4rem', borderRadius:3 }}>
                          {fmtStatus(c.status)}
                        </span>
                      )}
                    </div>
                    <div style={{ padding:'0.45rem 0.5rem' }}>
                      <div style={{ fontSize:'0.75rem', fontWeight:700, lineHeight:1.3,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-dim)', marginTop:2 }}>{c.author}</div>
                      {c.tags && (
                        // FIX: tag chips were ~10px tall with 1-2px padding — far below
                        // the 44x44px minimum touch target. On phones a tap meant for
                        // the tiny tag pill almost always registered on the parent
                        // card instead, navigating to the comic and making it LOOK
                        // like tags "didn't work" or weren't even visible/tappable.
                        // Increased padding/font-size and added a real min touch box
                        // via padding, while keeping the visual chip compact.
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
                          {c.tags.split(',').slice(0,3).map(t => t.trim()).filter(Boolean).map(t => (
                            <button key={t}
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                setTag(t);
                              }}
                              onTouchEnd={e => {
                                // FIX: stopPropagation on touchend too — some mobile
                                // browsers fire both the touch and the synthesized
                                // click on the underlying card if propagation isn't
                                // halted at every event stage, not just 'click'.
                                e.stopPropagation();
                              }}
                              style={{ fontSize:'0.66rem', lineHeight:1, background:'rgba(139,92,246,0.18)',
                                color:'#a78bfa', padding:'0.32rem 0.55rem', borderRadius:6, fontWeight:700,
                                cursor:'pointer', border:'1px solid rgba(139,92,246,0.3)',
                                minHeight:26, display:'inline-flex', alignItems:'center',
                                WebkitTapHighlightColor:'transparent' }}>
                              #{t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel + spinner */}
            {!loading && comics.length > 0 && page + 1 < totalPages && (
              <div ref={sentinelRef} style={{ height:1 }} />
            )}
            {loadingMore && (
              <div style={{ display:'flex', justifyContent:'center', padding:'1.5rem' }}>
                <div className="skeleton" style={{ width:32, height:32, borderRadius:'50%' }} />
              </div>
            )}

            {/* Pagination (manual jump, also works alongside infinite scroll) */}
            {!loading && totalPages > 1 && (
              <div style={{ display:'flex', gap:'0.4rem', marginTop:'1.5rem', justifyContent:'center', flexWrap:'wrap' }}>
                <PBtn label="‹" onClick={() => { setPage(p => p-1); fetch(page-1); }} disabled={page===0} />
                {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+Math.max(0,page-3)).filter(p=>p<totalPages).map(p => (
                  <PBtn key={p} label={p+1} active={p===page} onClick={() => { setPage(p); fetch(p); }} />
                ))}
                <PBtn label="›" onClick={() => { setPage(p => p+1); fetch(page+1); }} disabled={page>=totalPages-1} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PBtn({ label, onClick, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ minWidth:36, height:36, borderRadius:8, border:'1px solid var(--border)',
        background: active ? 'var(--accent-main)' : 'var(--bg-card)',
        color: active ? '#fff' : disabled ? 'var(--text-dim)' : 'var(--text-muted)',
        fontWeight:600, fontSize:'0.82rem', cursor:disabled?'default':'pointer',
        opacity:disabled?0.4:1, padding:'0 0.5rem' }}>
      {label}
    </button>
  );
}
