import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import useSEO from '../hooks/useSEO';

export default function BlockedUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useSEO({ title: 'Blocked Users' });

  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    setLoading(true);
    api.get('/me/blocked')
      .then(({ data }) => setBlocked(Array.isArray(data) ? data : []))
      .catch(() => setBlocked([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [user]);

  const unblock = async (username) => {
    try {
      await api.delete(`/me/blocked/${username}`);
      setBlocked(prev => prev.filter(b => b.username !== username));
      showToast(`Unblocked ${username}`);
    } catch {
      showToast('Failed to unblock');
    }
  };

  return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>
      <div style={{ background:'var(--gradient-subtle)', padding:'2.5rem 1.5rem 3.5rem' }}>
        <div className="page-container">
          <h1 style={{ color:'#fff', fontSize:'1.6rem' }}>🚫 Blocked Users</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.88rem' }}>
            Comments and posts from blocked users are hidden from you
          </p>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth:700, paddingTop:'1.5rem', paddingBottom:'4rem' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {Array.from({ length:3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height:60, borderRadius:12 }} />
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-dim)' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🙂</div>
            <div>You haven't blocked anyone</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {blocked.map(b => (
              <div key={b.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:12, padding:'0.9rem 1.1rem' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{b.username}</div>
                  {b.blockedAt && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:2 }}>
                      Blocked {new Date(b.blockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button onClick={() => unblock(b.username)}
                  style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)',
                    color:'var(--text-primary)', borderRadius:8, padding:'0.4rem 1rem',
                    fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div style={{ position:'fixed', bottom:'5rem', left:'50%', transform:'translateX(-50%)',
            background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:50,
            padding:'0.65rem 1.4rem', fontWeight:600, fontSize:'0.85rem', zIndex:9999,
            boxShadow:'0 8px 30px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
