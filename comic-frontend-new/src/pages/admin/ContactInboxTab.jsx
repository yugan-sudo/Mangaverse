import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';

function ContactInboxTab({ onToast }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('UNREAD');
  const [expanded, setExpanded] = useState(null);

  const STATUS_COLORS = { UNREAD:'#e94560', READ:'#3b82f6', RESOLVED:'#22c55e' };
  const SUBJECT_ICONS = {
    general:'💬', content:'📚', bug:'🐛', account:'👤',
    partnership:'🤝', dmca:'⚖️', other:'📌',
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/contact', { params: { status: filter } });
      setMessages(Array.isArray(data) ? data : []);
    } catch { onToast('❌ Failed to load messages'); }
    setLoading(false);
  }, [filter, onToast]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/admin/contact/${id}/status`, null, { params: { status } });
      onToast(`✅ Marked as ${status.toLowerCase()}`);
      load();
    } catch { onToast('❌ Failed to update'); }
  };

  function fmtDate(iso) {
    return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>📧 Contact Inbox</h1>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {['UNREAD','READ','RESOLVED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding:'0.35rem 0.9rem', borderRadius:20, fontSize:'0.78rem', fontWeight:700,
                border:'none', cursor:'pointer', transition:'all 0.15s',
                background: filter === s ? (STATUS_COLORS[s] || 'var(--accent-main)') : 'var(--bg-elevated)',
                color: filter === s ? '#fff' : 'var(--text-muted)',
              }}>
              {s === 'UNREAD' ? '🔴' : s === 'READ' ? '🔵' : '✅'} {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        Array.from({length:4}).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:80, borderRadius:10, marginBottom:'0.65rem' }} />
        ))
      ) : messages.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', border:'2px dashed var(--border)',
          borderRadius:12, color:'var(--text-dim)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📭</div>
          <div style={{ fontWeight:600 }}>No {filter.toLowerCase()} messages</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12,
              overflow:'hidden',
              borderLeft:`4px solid ${STATUS_COLORS[msg.status] || 'var(--border)'}`,
            }}>
              {/* Header row */}
              <div
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.9rem 1.2rem',
                  cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize:'1.1rem', flexShrink:0 }}>
                  {SUBJECT_ICONS[msg.subject] || '📌'}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, fontSize:'0.9rem' }}>{msg.name}</span>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>{msg.email}</span>
                    <span style={{ fontSize:'0.7rem', background: STATUS_COLORS[msg.status],
                      color:'#fff', padding:'0.1rem 0.4rem', borderRadius:3, fontWeight:700,
                      textTransform:'uppercase', marginLeft:'auto' }}>
                      {msg.status}
                    </span>
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.15rem',
                    display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    [{msg.subject}] {msg.message}
                  </div>
                </div>
                <span style={{ fontSize:'0.72rem', color:'var(--text-dim)', flexShrink:0 }}>
                  {fmtDate(msg.createdAt)}
                </span>
                <span style={{ fontSize:'0.7rem', color:'var(--text-dim)',
                  transform: expanded === msg.id ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s' }}>
                  ▼
                </span>
              </div>

              {/* Expanded body */}
              {expanded === msg.id && (
                <div style={{ padding:'0 1.2rem 1.2rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                  <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'0.85rem 1rem',
                    fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.7, marginBottom:'1rem',
                    whiteSpace:'pre-wrap' }}>
                    {msg.message}
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    <a href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}`}
                      style={{ background:'var(--accent-main)', color:'#fff', border:'none',
                        padding:'0.4rem 1rem', borderRadius:7, fontWeight:700, fontSize:'0.8rem',
                        cursor:'pointer', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.35rem' }}>
                      📤 Reply via Email
                    </a>
                    {msg.status !== 'READ' && (
                      <button onClick={() => setStatus(msg.id, 'READ')}
                        style={{ background:'rgba(59,130,246,0.12)', color:'#3b82f6', border:'none',
                          padding:'0.4rem 0.9rem', borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>
                        🔵 Mark Read
                      </button>
                    )}
                    {msg.status !== 'RESOLVED' && (
                      <button onClick={() => setStatus(msg.id, 'RESOLVED')}
                        style={{ background:'rgba(34,197,94,0.12)', color:'#22c55e', border:'none',
                          padding:'0.4rem 0.9rem', borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>
                        ✅ Resolve
                      </button>
                    )}
                    {msg.status !== 'UNREAD' && (
                      <button onClick={() => setStatus(msg.id, 'UNREAD')}
                        style={{ background:'rgba(233,69,96,0.1)', color:'var(--accent-main)', border:'none',
                          padding:'0.4rem 0.9rem', borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>
                        🔴 Mark Unread
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContactInboxTab;
