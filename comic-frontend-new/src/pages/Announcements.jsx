import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';

const TYPE_STYLES = {
  MAINTENANCE: { icon: '🔧', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  label: 'Maintenance', labelBg: '#f59e0b' },
  UPDATE:      { icon: '✨', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)',  label: 'Update',      labelBg: '#3b82f6' },
  WARNING:     { icon: '⚠️', bg: 'rgba(233,69,96,0.1)',   border: 'rgba(233,69,96,0.3)',   label: 'Warning',     labelBg: '#e94560' },
  INFO:        { icon: '📢', bg: 'rgba(147,51,234,0.08)', border: 'rgba(147,51,234,0.25)', label: 'Info',        labelBg: '#9333ea' },
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Announcements() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useSEO({ title: 'Announcements', description: 'Latest site announcements and updates.' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/announcements');
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="page-container" style={{ maxWidth: 760, paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.4rem 0.8rem', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-main)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          ← Back
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>📢 Announcements</h1>
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 11, width: '100%', borderRadius: 3, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 11, width: '80%', borderRadius: 3 }} />
          </div>
        ))
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
          No announcements yet.
        </div>
      ) : (
        items.map(a => {
          const style = TYPE_STYLES[a.type] || TYPE_STYLES.INFO;
          return (
            <div key={a.id} style={{
              background: style.bg, border: `1px solid ${style.border}`,
              borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1rem',
              borderLeft: `4px solid ${style.labelBg}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem' }}>{style.icon}</span>
                {a.pinned && (
                  <span style={{ fontSize: '0.6rem', background: 'var(--accent-main)', color: '#fff',
                    padding: '0.15rem 0.4rem', borderRadius: 3, fontWeight: 700, letterSpacing: 0.4,
                    textTransform: 'uppercase' }}>PINNED</span>
                )}
                <span style={{ fontSize: '0.65rem', background: style.labelBg, color: '#fff',
                  padding: '0.15rem 0.45rem', borderRadius: 3, fontWeight: 700, letterSpacing: 0.3,
                  textTransform: 'uppercase' }}>{style.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {fmtDate(a.createdAt)}
                </span>
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>{a.title}</h2>
              {a.content && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  {a.content}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
