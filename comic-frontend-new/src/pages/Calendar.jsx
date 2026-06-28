import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';

/* ─── Date helpers ────────────────────────────────────────────────────── */

// FIX: was doing new Date(iso) - new Date() using exact current time,
// so chapters scheduled for earlier today showed negative hours and
// Math.ceil gave 0 which accidentally looked correct but broke for
// "yesterday" entries (released chapters that shouldn't appear).
// Now only chapters with scheduledAt > now are shown (backend already
// filters this, but guard here too).
function daysUntil(iso) {
  const diff = new Date(iso) - Date.now();
  return Math.ceil(diff / 86400000);
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// FIX: previous version appended 'T00:00:00' to make a local-time parse,
// but then compared against now.toDateString() — this mixed local-midnight
// vs current-time comparisons that shift by one day in timezones like
// UTC+5:30 (India/Chennai). Now we compare purely by date strings in
// local time, derived from the actual scheduledAt ISO timestamp.
function fmtDateLabel(isoDateStr) {
  // isoDateStr is "yyyy-MM-dd" from the backend grouping key
  const todayStr    = new Date().toLocaleDateString('en-CA'); // "2025-07-14" always
  const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');
  if (isoDateStr === todayStr)     return 'Today';
  if (isoDateStr === tomorrowStr)  return 'Tomorrow';
  // Parse as local noon to avoid DST/UTC midnight edge cases
  const d = new Date(isoDateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function Calendar() {
  const [days,    setDays]    = useState(14);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useSEO({
    title: 'New Releases Calendar',
    description: 'See upcoming chapter release dates for your favourite series.',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/calendar', { params: { days } });
        setData(Array.isArray(d) ? d : []);
      } catch { setData([]); }
      setLoading(false);
    };
    load();
  }, [days]);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)',
        padding: '2.5rem 1.5rem 3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.2) 0%, transparent 65%)' }} />
        <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.4rem,4vw,2.2rem)', marginBottom: '0.5rem' }}>
            📅 Release Calendar
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Upcoming chapter releases — never miss a drop.
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                style={{ padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.8rem',
                  fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: days === d ? 'var(--accent-main)' : 'rgba(255,255,255,0.12)',
                  color: '#fff', transition: 'background 0.15s' }}>
                {d} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="page-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem', maxWidth: 720 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton"
              style={{ height: 100, borderRadius: 14, marginBottom: '1rem' }} />
          ))
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              No scheduled releases
            </div>
            <div style={{ fontSize: '0.84rem', marginBottom: '1.25rem' }}>
              Admins can schedule chapters from the Admin Dashboard → Chapters tab.
            </div>
            <button className="btn-accent" onClick={() => navigate('/browse')}>
              Browse all comics
            </button>
          </div>
        ) : (
          data.map(({ date, chapters }) => {
            const label      = fmtDateLabel(date);
            const isToday    = label === 'Today';
            const isTomorrow = label === 'Tomorrow';

            return (
              <div key={date} style={{ marginBottom: '1.5rem' }}>
                {/* Date header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem',
                    color: isToday ? 'var(--accent-main)' : isTomorrow ? '#8b5cf6' : 'var(--text-primary)' }}>
                    {label}
                  </div>
                  {isToday && (
                    <span style={{ background: 'var(--accent-main)', color: '#fff', fontSize: '0.6rem',
                      fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 20 }}>
                      TODAY
                    </span>
                  )}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Chapter cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {chapters.map(ch => {
                    const d = daysUntil(ch.scheduledAt);
                    return (
                      <div key={ch.chapterId}
                        onClick={() => navigate(`/comic/${ch.comicId}`)}
                        role="button" tabIndex={0}
                        aria-label={`View ${ch.comicTitle} chapter ${ch.chapterNumber}`}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/comic/${ch.comicId}`); } }}
                        style={{ background: 'var(--bg-card)',
                          border: `1px solid ${isToday ? 'rgba(233,69,96,0.3)' : 'var(--border)'}`,
                          borderRadius: 12, padding: '0.85rem 1.1rem',
                          display: 'flex', gap: '0.9rem', alignItems: 'center',
                          cursor: 'pointer', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-main)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = isToday ? 'rgba(233,69,96,0.3)' : 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)'; }}>

                        {/* Cover */}
                        <img src={ch.comicCover || `https://picsum.photos/seed/${ch.comicId}/60/85`}
                          alt={ch.comicTitle}
                          loading="lazy"
                          style={{ width: 46, height: 66, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }}
                          onError={e => { e.target.src = `https://picsum.photos/seed/${ch.comicId}/60/85`; }} />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ch.comicTitle}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                            Chapter {ch.chapterNumber}
                            {ch.title && ch.title !== `Chapter ${ch.chapterNumber}` ? ` — ${ch.title}` : ''}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)',
                            display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>🕐</span>
                            <span>{fmtTime(ch.scheduledAt)}</span>
                            {ch.comicGenre && (
                              <>
                                <span style={{ opacity: 0.4 }}>·</span>
                                <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                                  {ch.comicGenre.split(',')[0].trim()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Countdown badge */}
                        <div style={{ flexShrink: 0, textAlign: 'center',
                          background: d <= 0 ? 'var(--accent-main)' : d === 1 ? 'rgba(139,92,246,0.15)' : 'var(--bg-elevated)',
                          color: d <= 0 ? '#fff' : d === 1 ? '#8b5cf6' : 'var(--text-muted)',
                          borderRadius: 10, padding: '0.4rem 0.75rem', minWidth: 64 }}>
                          {d <= 0 ? (
                            <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>TODAY</div>
                          ) : (
                            <>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>{d}</div>
                              <div style={{ fontSize: '0.62rem', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                day{d !== 1 ? 's' : ''}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
