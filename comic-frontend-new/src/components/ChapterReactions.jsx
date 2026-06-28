import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const REACTIONS = [
  { type:'UPVOTE',    emoji:'👍', label:'Upvote'    },
  { type:'FUNNY',     emoji:'😂', label:'Funny'     },
  { type:'LOVE',      emoji:'❤️', label:'Love'      },
  { type:'SURPRISED', emoji:'😲', label:'Surprised' },
  { type:'ANGRY',     emoji:'😠', label:'Angry'     },
  { type:'SAD',       emoji:'😢', label:'Sad'       },
];

export default function ChapterReactions({ chapterId }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [counts,     setCounts]     = useState({});
  const [myReactions,setMyReactions]= useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!chapterId || chapterId === 'undefined') return;
    api.get(`/chapters/${chapterId}/reactions`)
      .then(({ data }) => {
        setCounts(data.counts || {});
        setMyReactions(data.myReactions || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chapterId]);

  const toggle = async (type) => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/chapters/${chapterId}/reactions/${type}`);
      // Optimistic update
      setCounts(prev => {
        const next = { ...prev };
        if (data.toggled) {
          next[type] = (next[type] || 0) + 1;
          setTotal(t => t + 1);
        } else {
          next[type] = Math.max((next[type] || 0) - 1, 0);
          setTotal(t => Math.max(t - 1, 0));
        }
        return next;
      });
      setMyReactions(prev =>
        data.toggled ? [...prev, type] : prev.filter(r => r !== type)
      );
    } catch {}
  };

  if (loading) return null;

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16,
      padding:'1.25rem 1.5rem', marginTop:'1.5rem' }}>
      <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'0.2rem' }}>
        What did you think of this chapter?
      </div>
      {total > 0 && (
        <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginBottom:'1rem' }}>
          {total.toLocaleString()} reaction{total !== 1 ? 's' : ''}
        </div>
      )}
      <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
        {REACTIONS.map(r => {
          const active = myReactions.includes(r.type);
          const count  = counts[r.type] || 0;
          return (
            <button key={r.type} onClick={() => toggle(r.type)}
              title={r.label}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem',
                padding:'0.5rem 0.85rem', borderRadius:12, cursor:'pointer', transition:'all 0.15s',
                border:`1px solid ${active ? 'var(--accent-main)' : 'var(--border)'}`,
                background: active ? 'rgba(233,69,96,0.1)' : 'var(--bg-elevated)',
                minWidth:52,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor='var(--accent-main)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor='var(--border)'; }}>
              <span style={{ fontSize:'1.4rem', lineHeight:1 }}>{r.emoji}</span>
              <span style={{ fontSize:'0.7rem', fontWeight:700,
                color: active ? 'var(--accent-main)' : 'var(--text-dim)' }}>
                {count > 0 ? count.toLocaleString() : r.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
