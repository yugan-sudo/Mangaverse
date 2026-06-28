import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

function AnalyticsTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [days,    setDays]    = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/admin/analytics', { params: { days } });
        setData(d);
      } catch { setData(null); }
      setLoading(false);
    };
    load();
  }, [days]);

  const CHART_COLORS = ['#e94560','#8b5cf6','#3b82f6','#22c55e','#f59e0b','#ec4899','#14b8a6','#f97316'];

  function SimpleBarChart({ rows, labelKey, valueKey, color = '#e94560', height = 120 }) {
    if (!rows || rows.length === 0) return (
      <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--text-dim)', fontSize:'0.8rem' }}>No data yet</div>
    );
    const max = Math.max(...rows.map(r => Number(r[valueKey]) || 0), 1);
    return (
      <div style={{ display:'flex', alignItems:'flex-end', gap:3, height, width:'100%', paddingTop:8 }}>
        {rows.map((r, i) => {
          const pct = (Number(r[valueKey]) || 0) / max;
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, height:'100%', justifyContent:'flex-end' }}
              title={`${r[labelKey]}: ${r[valueKey]}`}>
              <div style={{ fontSize:'0.58rem', color:'var(--text-dim)', lineHeight:1, textAlign:'center' }}>
                {r[valueKey]}
              </div>
              <div style={{ width:'100%', background: color, borderRadius:'3px 3px 0 0',
                height: `${Math.max(pct * (height - 28), 2)}px`, opacity: 0.85, transition:'height 0.4s',
                minHeight: 2 }} />
              {rows.length <= 14 && (
                <div style={{ fontSize:'0.55rem', color:'var(--text-dim)', lineHeight:1,
                  textAlign:'center', transform:'rotate(-35deg)', transformOrigin:'top center',
                  marginTop:2, whiteSpace:'nowrap', overflow:'hidden', maxWidth:28 }}>
                  {String(r[labelKey]).slice(5)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function DonutChart({ data: items, size = 140 }) {
    if (!items || items.length === 0) return (
      <div style={{ width:size, height:size, display:'flex', alignItems:'center',
        justifyContent:'center', color:'var(--text-dim)', fontSize:'0.8rem' }}>No data</div>
    );
    const total = items.reduce((s, d) => s + Number(d.count), 0);
    let cumAngle = -90;
    const segments = items.map((item, i) => {
      const angle = (Number(item.count) / total) * 360;
      const startAngle = cumAngle;
      cumAngle += angle;
      return { ...item, startAngle, angle, color: CHART_COLORS[i % CHART_COLORS.length] };
    });

    function polarToCart(cx, cy, r, deg) {
      const rad = (deg * Math.PI) / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }

    const cx = size / 2, cy = size / 2, r = size * 0.4, ir = size * 0.22;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const [x1, y1] = polarToCart(cx, cy, r, seg.startAngle);
          const [x2, y2] = polarToCart(cx, cy, r, seg.startAngle + seg.angle);
          const [ix1, iy1] = polarToCart(cx, cy, ir, seg.startAngle + seg.angle);
          const [ix2, iy2] = polarToCart(cx, cy, ir, seg.startAngle);
          const large = seg.angle > 180 ? 1 : 0;
          return (
            <path key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2} Z`}
              fill={seg.color} opacity={0.9}>
              <title>{seg.genre}: {seg.count}</title>
            </path>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-primary)">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="var(--text-dim)">comics</text>
      </svg>
    );
  }

  if (loading) return (
    <div>
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {Array.from({length:5}).map((_,i) => (
          <div key={i} className="skeleton" style={{ flex:'1 1 140px', height:90, borderRadius:12 }} />
        ))}
      </div>
      {Array.from({length:2}).map((_,i) => (
        <div key={i} className="skeleton" style={{ height:200, borderRadius:14, marginBottom:'1rem' }} />
      ))}
    </div>
  );

  if (!data) return (
    <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-dim)' }}>
      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📉</div>
      <div>Failed to load analytics</div>
    </div>
  );

  const summaryCards = [
    { icon:'📚', label:'Total Comics',    value: data.totalComics,    color:'#8b5cf6' },
    { icon:'👥', label:'Total Users',     value: data.totalUsers,     color:'#3b82f6' },
    { icon:'📄', label:'Total Chapters',  value: data.totalChapters,  color:'#22c55e' },
    { icon:'🔖', label:'Bookmarks',       value: data.totalBookmarks, color:'#f59e0b' },
    { icon:'❤️', label:'Total Likes',    value: data.totalLikes,     color:'#e94560' },
    { icon:'🆕', label:`New Users (${days}d)`, value: data.newUsers,  color:'#14b8a6' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>📈 Analytics</h1>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding:'0.35rem 0.85rem', borderRadius:20, fontSize:'0.78rem', fontWeight:700,
                border:'none', cursor:'pointer', transition:'all 0.15s',
                background: days === d ? 'var(--accent-main)' : 'var(--bg-elevated)',
                color: days === d ? '#fff' : 'var(--text-muted)' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="analytics-summary-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{
            background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
            padding:'1.1rem', borderTop:`3px solid ${card.color}`,
          }}>
            <div style={{ fontSize:'1.4rem', marginBottom:'0.4rem' }}>{card.icon}</div>
            <div style={{ fontSize:'1.6rem', fontWeight:800, color: card.color, lineHeight:1 }}>
              {Number(card.value || 0).toLocaleString()}
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:'0.25rem', fontWeight:600 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="analytics-chart-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>

        {/* Registrations by day */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ width:3, height:16, background:'#3b82f6', borderRadius:2, display:'inline-block' }} />
            New Registrations
          </div>
          <SimpleBarChart rows={data.registrationsByDay} labelKey="date" valueKey="count" color="#3b82f6" height={130} />
        </div>

        {/* Chapter uploads by day */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ width:3, height:16, background:'#22c55e', borderRadius:2, display:'inline-block' }} />
            Chapter Uploads
          </div>
          <SimpleBarChart rows={data.chaptersByDay} labelKey="date" valueKey="count" color="#22c55e" height={130} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="analytics-chart-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

        {/* Comics by genre — donut + legend */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ width:3, height:16, background:'#8b5cf6', borderRadius:2, display:'inline-block' }} />
            Comics by Genre
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
            <DonutChart data={data.comicsByGenre} size={150} />
            <div style={{ flex:1, minWidth:120 }}>
              {(data.comicsByGenre || []).slice(0, 8).map((g, i) => (
                <div key={g.genre} style={{ display:'flex', alignItems:'center', gap:'0.5rem',
                  marginBottom:'0.4rem', fontSize:'0.78rem' }}>
                  <span style={{ width:10, height:10, borderRadius:2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink:0 }} />
                  <span style={{ flex:1, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.genre}</span>
                  <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comics added by day */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ width:3, height:16, background:'#e94560', borderRadius:2, display:'inline-block' }} />
            Comics Added
          </div>
          <SimpleBarChart rows={data.comicsByDay} labelKey="date" valueKey="count" color="#e94560" height={130} />
        </div>
      </div>

      {/* Charts row 3 — Most-read chapters + Retention */}
      <div className="analytics-chart-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem' }}>

        {/* Most-read chapters */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ width:3, height:16, background:'#f59e0b', borderRadius:2, display:'inline-block' }} />
            Most-Read Chapters
          </div>
          {(!data.mostReadChapters || data.mostReadChapters.length === 0) ? (
            <div style={{ height:130, display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--text-dim)', fontSize:'0.8rem' }}>No data yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {data.mostReadChapters.slice(0, 6).map((c, i) => (
                <div key={c.chapterId} style={{ display:'flex', alignItems:'center', gap:'0.6rem', fontSize:'0.78rem' }}>
                  <span style={{ width:18, color:'var(--text-dim)', fontWeight:700 }}>{i + 1}</span>
                  <div style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <span style={{ fontWeight:600 }}>{c.comicTitle}</span>
                    <span style={{ color:'var(--text-dim)' }}> — Ch. {c.chapterNum}</span>
                  </div>
                  <span style={{ fontWeight:700, color:'#f59e0b' }}>{Number(c.reads).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retention */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ width:3, height:16, background:'#3b82f6', borderRadius:2, display:'inline-block' }} />
            User Retention
          </div>
          <div style={{ display:'flex', gap:'1.5rem', justifyContent:'space-around', paddingTop:'0.5rem' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2rem', fontWeight:800, color:'#3b82f6' }}>
                {data.retention?.day1Rate ?? 0}%
              </div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginTop:'0.25rem' }}>Day 1 Retention</div>
              <div style={{ fontSize:'0.68rem', color:'var(--text-dim)', marginTop:'0.15rem' }}>
                {data.retention?.day1Eligible ?? 0} users eligible
              </div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2rem', fontWeight:800, color:'#8b5cf6' }}>
                {data.retention?.day7Rate ?? 0}%
              </div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginTop:'0.25rem' }}>Day 7 Retention</div>
              <div style={{ fontSize:'0.68rem', color:'var(--text-dim)', marginTop:'0.15rem' }}>
                {data.retention?.day7Eligible ?? 0} users eligible
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel metrics */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem', marginTop:'1rem' }}>
        <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
          <span style={{ width:3, height:16, background:'#22c55e', borderRadius:2, display:'inline-block' }} />
          User Funnel
        </div>
        {(!data.funnel || data.funnel.length === 0) ? (
          <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text-dim)', fontSize:'0.8rem' }}>No data yet</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {data.funnel.map((stage, i) => {
              const max = Number(data.funnel[0]?.count) || 1;
              const pct = Math.max((Number(stage.count) / max) * 100, 2);
              return (
                <div key={stage.stage}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'0.25rem' }}>
                    <span style={{ fontWeight:600 }}>{stage.stage}</span>
                    <span style={{ fontWeight:700 }}>{Number(stage.count).toLocaleString()}</span>
                  </div>
                  <div style={{ width:'100%', height:10, background:'var(--bg-elevated)', borderRadius:5, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%',
                      background: CHART_COLORS[i % CHART_COLORS.length], borderRadius:5, transition:'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsTab;
