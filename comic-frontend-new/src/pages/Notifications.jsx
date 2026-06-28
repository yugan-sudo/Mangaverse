import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import useSEO from '../hooks/useSEO';

export default function Notifications() {
  useSEO({ title: 'Notifications' });
  const { fetchUnread } = useAuth();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(r => setNotifs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    fetchUnread();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    fetchUnread();
  };

  // FIX: dismiss (delete) a single notification
  const dismiss = async (id, e) => {
    e.stopPropagation(); // don't trigger markRead on the card
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
    fetchUnread();
  };

  // FIX: clear ALL notifications
  const clearAll = async () => {
    await api.delete('/notifications/all').catch(() => {});
    setNotifs([]);
    fetchUnread();
  };

  const icon = (type) =>
    type === 'NEW_CHAPTER' ? '📖' :
    type === 'CHAPTER_UPDATE' ? '📖' :
    type === 'COMMENT'     ? '💬' :
    type === 'REPORT'      ? '🚨' :
    type === 'FOLLOW'      ? '👤' : '🔔';

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>

      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:'1.5rem', gap:'0.5rem', flexWrap:'wrap' }}>
        <h1 style={{ fontSize:'1.5rem', margin:0 }}>
          🔔 Notifications
          {unreadCount > 0 && (
            <span style={{ marginLeft:'0.5rem', background:'var(--accent-main)', color:'#fff',
              borderRadius:20, fontSize:'0.72rem', padding:'0.15rem 0.55rem',
              fontWeight:700, verticalAlign:'middle' }}>
              {unreadCount}
            </span>
          )}
        </h1>

        <div style={{ display:'flex', gap:'0.5rem' }}>
          {unreadCount > 0 && (
            <button className="btn-outline" style={{ fontSize:'0.8rem' }} onClick={markAllRead}>
              ✓ Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={clearAll}
              style={{ background:'rgba(233,69,96,0.1)', color:'var(--accent-main)',
                border:'1px solid rgba(233,69,96,0.25)', borderRadius:8,
                padding:'0.4rem 0.85rem', fontSize:'0.8rem', fontWeight:600,
                cursor:'pointer' }}>
              🗑 Clear all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton"
            style={{ height:64, borderRadius:12, marginBottom:'0.75rem' }} />
        ))
      ) : notifs.length === 0 ? (
        <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'4rem 0' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔕</div>
          <p style={{ fontWeight:600, marginBottom:'0.35rem' }}>No notifications</p>
          <p style={{ fontSize:'0.84rem', color:'var(--text-dim)' }}>
            You're all caught up! New chapter updates and replies will appear here.
          </p>
        </div>
      ) : (
        notifs.map(n => (
          <div key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            style={{
              display:'flex', alignItems:'center', gap:'0.85rem',
              padding:'0.9rem 1rem 0.9rem 1.1rem',
              borderRadius:12, marginBottom:'0.55rem',
              background: n.read ? 'var(--bg-card)' : 'rgba(67,97,238,0.1)',
              border:`1px solid ${n.read ? 'var(--border)' : 'rgba(67,97,238,0.3)'}`,
              cursor: n.read ? 'default' : 'pointer',
              transition:'background 0.15s',
              position:'relative',
            }}>

            {/* Unread dot */}
            {!n.read && (
              <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
                width:3, height:'60%', background:'#4361ee', borderRadius:'0 3px 3px 0' }} />
            )}

            <span style={{ fontSize:'1.3rem', flexShrink:0 }}>{icon(n.type)}</span>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.86rem',
                color: n.read ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight:1.45 }}>
                {n.message}
              </div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', marginTop:3 }}>
                {new Date(n.createdAt).toLocaleString('en-US',
                  { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>

            {/* FIX: dismiss × button — stops propagation so it doesn't
                toggle read state, calls DELETE /notifications/{id} */}
            <button
              onClick={e => dismiss(n.id, e)}
              title="Dismiss notification"
              aria-label="Dismiss notification"
              style={{ flexShrink:0, width:28, height:28, borderRadius:'50%',
                background:'transparent', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'var(--text-dim)', fontSize:'0.9rem', transition:'all 0.15s' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(233,69,96,0.12)';
                e.currentTarget.style.color = '#e94560';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-dim)';
              }}>
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}
