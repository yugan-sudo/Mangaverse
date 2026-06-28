import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';

const STATUS_COLOR = { ONGOING:'#22c55e', COMPLETED:'#3b82f6', HIATUS:'#f59e0b' };

export default function GenrePage() {
  const { genre } = useParams();
  const navigate  = useNavigate();
  const [data, setData] = useState({ comics:[], total:0 });
  const [loading, setLoading] = useState(true);

  useSEO({ title:`${genre} Manga & Manhwa`, description:`Read the best ${genre} manga, manhwa and manhua online free.` });

  useEffect(() => {
    if (!genre) return;
    setLoading(true);
    api.get(`/discovery/genre/${encodeURIComponent(genre)}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData({ comics:[], total:0 }))
      .finally(() => setLoading(false));
  }, [genre]);

  return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>
      <div style={{ background:'var(--gradient-subtle)', padding:'3rem 1.5rem 4rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 65%)' }} />
        <div className="page-container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🎭</div>
          <h1 style={{ color:'#fff', fontSize:'clamp(1.6rem,4vw,2.4rem)', marginBottom:'0.5rem' }}>{genre}</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.88rem' }}>
            {data.total} series in this genre
          </p>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop:'2rem', paddingBottom:'4rem' }}>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'1rem' }}>
            {Array.from({length:12}).map((_,i) => (
              <div key={i} style={{ borderRadius:10, overflow:'hidden', border:'1px solid var(--border)' }}>
                <div className="skeleton" style={{ aspectRatio:'2/3' }} />
                <div style={{ padding:'0.5rem' }}>
                  <div className="skeleton" style={{ height:11, borderRadius:3, marginBottom:5 }} />
                  <div className="skeleton" style={{ height:9, width:'60%', borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        ) : data.comics.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem', color:'var(--text-dim)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📚</div>
            <div style={{ fontWeight:600 }}>No comics found for {genre}</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'1rem' }}>
            {data.comics.map(c => (
              <div key={c.id} onClick={() => navigate(`/comic/${c.id}`)}
                style={{ cursor:'pointer', borderRadius:10, overflow:'hidden', border:'1px solid var(--border)',
                  background:'var(--bg-card)', transition:'transform 0.2s,border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='var(--accent-main)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='var(--border)'; }}>
                <div style={{ position:'relative', aspectRatio:'2/3', overflow:'hidden' }}>
                  <img src={c.coverImage} alt={c.title} loading="lazy"
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    onError={e => e.target.src=`https://picsum.photos/seed/${c.id}/130/195`} />
                  {c.status && (
                    <span style={{ position:'absolute', top:5, left:5, background:STATUS_COLOR[c.status]||'#22c55e',
                      color:'#fff', fontSize:'0.58rem', fontWeight:700, padding:'0.12rem 0.4rem', borderRadius:3 }}>
                      {c.status==='ONGOING'?'ON':c.status==='COMPLETED'?'END':'HIA'}
                    </span>
                  )}
                </div>
                <div style={{ padding:'0.45rem 0.5rem' }}>
                  <div style={{ fontSize:'0.76rem', fontWeight:700, lineHeight:1.3,
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize:'0.66rem', color:'var(--text-dim)', marginTop:2 }}>{c.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
