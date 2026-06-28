import { useState } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const REASONS = [
  { value:'SPAM',          label:'🚫 Spam',             desc:'Repetitive or promotional content' },
  { value:'HATE',          label:'😡 Hate Speech',      desc:'Offensive or discriminatory language' },
  { value:'SPOILER',       label:'⚠️ Spoilers',         desc:'Reveals plot without warning' },
  { value:'INAPPROPRIATE', label:'🔞 Inappropriate',    desc:'Not suitable for all audiences' },
  { value:'OTHER',         label:'📝 Other',            desc:'Something else' },
];

// ─── Report Comment Modal ─────────────────────────────────────────────────
export default function ReportModal({ commentId, commentPreview, onClose }) {
  const { user } = useAuth();
  const [reason,    setReason]    = useState('');
  const [details,   setDetails]   = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  const submit = async () => {
    if (!reason) { setError('Please select a reason.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/comments/${commentId}/report`, { reason, details });
      setDone(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit report.');
    }
    setSubmitting(false);
  };

  return (
    // Backdrop
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:10000,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
    }}>
      {/* Modal box */}
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:420,
        boxShadow:'0 16px 60px rgba(0,0,0,0.5)',
      }}>
        {done ? (
          // Success state
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>✅</div>
            <h3 style={{ marginBottom:'0.5rem' }}>Report Submitted</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'1.25rem' }}>
              Thank you. Admins have been notified and will review this comment.
            </p>
            <button className="btn-accent" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'1rem' }}>
              <h3 style={{ margin:0, fontSize:'1.1rem' }}>🚨 Report Comment</h3>
              <button onClick={onClose} style={{ background:'none', border:'none',
                color:'var(--text-dim)', cursor:'pointer', fontSize:'1.2rem', lineHeight:1 }}>
                ✕
              </button>
            </div>

            {/* Comment preview */}
            {commentPreview && (
              <div style={{ background:'var(--bg-elevated)', borderRadius:8,
                padding:'0.65rem 0.85rem', marginBottom:'1rem',
                fontSize:'0.82rem', color:'var(--text-muted)',
                borderLeft:'3px solid var(--border)' }}>
                "{commentPreview.length > 100
                  ? commentPreview.slice(0, 100) + '…'
                  : commentPreview}"
              </div>
            )}

            {/* Reason selector */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.78rem', fontWeight:700,
                color:'var(--text-muted)', textTransform:'uppercase',
                letterSpacing:0.5, display:'block', marginBottom:'0.5rem' }}>
                Reason *
              </label>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                {REASONS.map(r => (
                  <div key={r.value}
                    onClick={() => setReason(r.value)}
                    style={{
                      display:'flex', alignItems:'center', gap:'0.75rem',
                      padding:'0.6rem 0.85rem', borderRadius:10, cursor:'pointer',
                      border:`2px solid ${reason === r.value ? 'var(--accent-main)' : 'var(--border)'}`,
                      background: reason === r.value ? 'rgba(233,69,96,0.08)' : 'var(--bg-elevated)',
                      transition:'all 0.15s',
                    }}>
                    {/* Radio circle */}
                    <div style={{
                      width:16, height:16, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${reason === r.value ? 'var(--accent-main)' : 'var(--border)'}`,
                      background: reason === r.value ? 'var(--accent-main)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {reason === r.value && (
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{r.label}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.78rem', fontWeight:700,
                color:'var(--text-muted)', textTransform:'uppercase',
                letterSpacing:0.5, display:'block', marginBottom:'0.4rem' }}>
                Additional details (optional)
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Describe the issue…"
                rows={2}
                maxLength={300}
                style={{ width:'100%', background:'var(--bg-elevated)',
                  border:'1px solid var(--border)', color:'var(--text-primary)',
                  padding:'0.6rem 0.85rem', borderRadius:8, fontSize:'0.85rem',
                  outline:'none', resize:'none', fontFamily:'inherit' }}
              />
              <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', textAlign:'right' }}>
                {details.length}/300
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ color:'#e94560', fontSize:'0.82rem',
                marginBottom:'0.75rem', padding:'0.5rem 0.75rem',
                background:'rgba(233,69,96,0.1)', borderRadius:8 }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="btn-outline" onClick={onClose}
                style={{ flex:1 }} disabled={submitting}>
                Cancel
              </button>
              <button className="btn-accent" onClick={submit}
                style={{ flex:1, background:'linear-gradient(135deg,#e94560,#c0392b)' }}
                disabled={submitting || !reason}>
                {submitting ? 'Submitting…' : '🚨 Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
