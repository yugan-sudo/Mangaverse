import { useState, useEffect } from 'react';

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  if (!msg) return null;
  return (
    <div style={{
      position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
      background: msg.startsWith('✅') ? '#1a3a2a' : '#3a1a1a',
      border: `1px solid ${msg.startsWith('✅') ? '#38b060' : '#e94560'}`,
      color: msg.startsWith('✅') ? '#38b060' : '#e94560',
      padding:'0.65rem 1.25rem', borderRadius:40, fontSize:'0.85rem', fontWeight:700,
      zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
      animation:'fadeIn 0.2s ease',
    }}>
      {msg}
    </div>
  );
}

// ─── Warn/Ban bottom-sheet modal ──────────────────────────────────────────
function ActionSheet({ report, onClose, onAction }) {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState(''); // warn | ban | delete

  const actions = [
    { id:'warn',   label:'⚠️ Warn User',    desc:'Send a warning notification to the user', color:'#f4c430' },
    { id:'ban',    label:'🚫 Ban User',     desc:'Temporarily restrict user access',         color:'#e94560' },
    { id:'delete', label:'🗑 Delete Comment', desc:'Remove the comment permanently',          color:'#888'    },
  ];

  const submit = async () => {
    if (!action) return;
    await onAction(report, action, reason);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:8000,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
    }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background:'var(--bg-card)', borderRadius:'20px 20px 0 0',
          border:'1px solid var(--border)', width:'100%', maxWidth:560,
          padding:'1.5rem 1.25rem 2rem',
          animation:'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>
        {/* Handle bar */}
        <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)',
          margin:'0 auto 1.25rem' }} />

        <h3 style={{ fontSize:'1rem', marginBottom:'0.35rem' }}>Take Action</h3>
        <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.25rem' }}>
          Report by <strong style={{ color:'var(--accent-blue)' }}>{report.reporter?.username}</strong>
          {' '}against <strong style={{ color:'var(--accent-main)' }}>{report.comment?.user?.username}</strong>
        </p>

        {/* Comment excerpt */}
        <div style={{ background:'var(--bg-elevated)', borderLeft:'3px solid #e94560',
          padding:'0.55rem 0.85rem', borderRadius:'0 8px 8px 0',
          fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.25rem' }}>
          "{report.comment?.content?.slice(0, 120) || '—'}"
        </div>

        {/* Action options */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1rem' }}>
          {actions.map(a => (
            <div key={a.id} onClick={() => setAction(a.id)}
              style={{
                display:'flex', alignItems:'center', gap:'0.85rem',
                padding:'0.75rem 1rem', borderRadius:12, cursor:'pointer',
                border:`2px solid ${action === a.id ? a.color : 'var(--border)'}`,
                background: action === a.id ? `${a.color}15` : 'var(--bg-elevated)',
                transition:'all 0.15s',
              }}>
              <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                border:`2px solid ${action === a.id ? a.color : 'var(--border)'}`,
                background: action === a.id ? a.color : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {action === a.id && <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }} />}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.88rem', color: action === a.id ? a.color : 'var(--text-primary)' }}>
                  {a.label}
                </div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Optional reason */}
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Add a reason (optional)…" rows={2}
          style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
            color:'var(--text-primary)', padding:'0.65rem 0.85rem', borderRadius:10,
            fontSize:'0.85rem', outline:'none', resize:'none', fontFamily:'inherit',
            marginBottom:'1rem' }} />

        {/* Buttons */}
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn-outline" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="btn-accent" onClick={submit} disabled={!action}
            style={{ flex:2, opacity: action ? 1 : 0.4 }}>
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color, trend }) {
  const hasTrend = trend !== undefined && trend !== null;
  const isUp = hasTrend && trend >= 0;
  return (
    <div className="stat-card" style={{ flexDirection:'column', alignItems:'stretch', gap:'0.6rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div className="stat-icon" style={{ background:`${color}1a`, width:38, height:38, fontSize:'1.05rem' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {hasTrend && (
          <span style={{ fontSize:'0.72rem', fontWeight:700,
            color: isUp ? '#38b060' : '#e94560',
            display:'flex', alignItems:'center', gap:'0.2rem' }}>
            {isUp ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="stat-value">{Number(value || 0).toLocaleString()}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, placeholder, type='text' }) {
  return (
    <div className="auth-form-group">
      <label>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

export { Toast, ActionSheet, StatCard, Field };

// ─── Shared form styles (used by Banners admin tab) ───────────────────────
export const aLabelStyle = { fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600,
  display:'block', marginBottom:'0.28rem' };
export const aInputStyle = { width:'100%', boxSizing:'border-box',
  background:'var(--bg-elevated)', border:'1px solid var(--border)',
  borderRadius:8, padding:'0.55rem 0.85rem', color:'var(--text-primary)',
  fontSize:'0.85rem', marginBottom:'0.85rem', outline:'none' };
