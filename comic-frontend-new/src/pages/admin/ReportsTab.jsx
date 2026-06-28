import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { ActionSheet } from './shared';

function ReportsTab({ onToast }) {
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('PENDING');
  const [actionSheet, setActionSheet] = useState(null); // report being actioned

  const load = useCallback(() => {
    setLoading(true);
    api.get('/comments/reports')
      .then(r => setReports(Array.isArray(r.data) ? r.data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (report, action, reason) => {
    try {
      if (action === 'delete') {
        await api.delete(`/comments/reports/${report.id}/delete-comment`);
        onToast('✅ Comment deleted and report resolved.');
      } else if (action === 'warn' || action === 'ban') {
        await api.put(`/comments/reports/${report.id}/status`, { status:'REVIEWED' });
        onToast(`✅ User ${action === 'warn' ? 'warned' : 'banned'} and report resolved.`);
      }
      load();
    } catch { onToast('❌ Action failed. Check backend.'); }
  };

  const markAllRead = async () => {
    await Promise.all(
      reports.filter(r => r.status === 'PENDING')
        .map(r => api.put(`/comments/reports/${r.id}/status`, { status:'REVIEWED' }).catch(() => {}))
    );
    onToast('✅ All reports marked as reviewed.');
    load();
  };

  const filtered  = filter === 'ALL' ? reports : reports.filter(r => r.status === filter);
  const pendingCt = reports.filter(r => r.status === 'PENDING').length;

  const reasonColor = r =>
    r === 'HATE'          ? '#e94560' :
    r === 'SPAM'          ? '#f4c430' :
    r === 'INAPPROPRIATE' ? '#f72585' :
    r === 'SPOILER'       ? '#7209b7' : '#888';

  const statusCol = s =>
    s === 'PENDING'  ? { bg:'rgba(247,37,133,0.15)', text:'#f72585' } :
    s === 'REVIEWED' ? { bg:'rgba(56,176,96,0.15)',  text:'#38b060' } :
                       { bg:'rgba(100,100,100,0.15)', text:'#888'    };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
          <h1 style={{ fontSize:'1.4rem', margin:0 }}>🚨 Reports</h1>
          {pendingCt > 0 && (
            <span style={{ background:'#e94560', color:'#fff', borderRadius:20,
              fontSize:'0.72rem', padding:'0.15rem 0.55rem', fontWeight:800 }}>
              {pendingCt} pending
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', alignItems:'center' }}>
          {pendingCt > 0 && (
            <button onClick={markAllRead} className="btn-outline"
              style={{ fontSize:'0.75rem', padding:'0.3rem 0.75rem', color:'#38b060', borderColor:'#38b060' }}>
              ✓ Mark All Read
            </button>
          )}
          {['ALL','PENDING','REVIEWED','DISMISSED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={filter === f ? 'btn-accent' : 'btn-outline'}
              style={{ fontSize:'0.72rem', padding:'0.28rem 0.65rem' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        Array.from({length:3}).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:100, borderRadius:12, marginBottom:'0.75rem' }} />
        ))
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>✅</div>
          <p>No {filter.toLowerCase()} reports.</p>
        </div>
      ) : filtered.map(report => {
        const col = statusCol(report.status);
        return (
          <div key={report.id} style={{ background:'var(--bg-card)',
            border:'1px solid var(--border)', borderRadius:14,
            padding:'1rem 1.1rem', marginBottom:'0.75rem' }}>

            {/* Top row: reporter → reported + reason + status */}
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.6rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, fontSize:'0.83rem', color:'var(--accent-blue)' }}>
                  {report.reporter?.username}
                </span>
                <span style={{ color:'var(--text-dim)', fontSize:'0.78rem' }}>reported</span>
                <span style={{ fontWeight:700, fontSize:'0.83rem', color:'var(--accent-main)' }}>
                  {report.comment?.user?.username}
                </span>
                {/* Reason badge */}
                <span style={{ padding:'0.1rem 0.5rem', borderRadius:20,
                  fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase',
                  background:`${reasonColor(report.reason)}20`,
                  color: reasonColor(report.reason) }}>
                  {report.reason || 'OTHER'}
                </span>
              </div>
              {/* Status badge */}
              <span style={{ padding:'0.18rem 0.55rem', borderRadius:20,
                fontSize:'0.68rem', fontWeight:700, background:col.bg, color:col.text }}>
                {report.status}
              </span>
            </div>

            {/* Reported comment */}
            <div style={{ background:'var(--bg-elevated)', borderLeft:'3px solid #e94560',
              padding:'0.5rem 0.8rem', borderRadius:'0 8px 8px 0',
              fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'0.6rem' }}>
              "{report.comment?.content?.slice(0, 140) || '—'}"
            </div>

            {/* Reporter details */}
            {report.details && (
              <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginBottom:'0.5rem' }}>
                📝 {report.details}
              </div>
            )}

            {/* Timestamp */}
            <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', marginBottom:'0.7rem' }}>
              {report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}
            </div>

            {/* Inline quick actions (PENDING only) */}
            {report.status === 'PENDING' && (
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                {/* Full action sheet */}
                <button onClick={() => setActionSheet(report)}
                  style={{ background:'linear-gradient(135deg,var(--accent-main),var(--accent-alt))',
                    color:'#fff', border:'none', borderRadius:8,
                    padding:'0.38rem 0.85rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}>
                  ⚡ Take Action
                </button>
                {/* Quick dismiss */}
                <button onClick={async () => {
                    await api.put(`/comments/reports/${report.id}/status`, { status:'DISMISSED' }).catch(()=>{});
                    onToast('Report dismissed.'); load();
                  }}
                  style={{ background:'rgba(100,100,100,0.12)', color:'#888',
                    border:'none', borderRadius:8, padding:'0.38rem 0.8rem',
                    cursor:'pointer', fontSize:'0.78rem' }}>
                  ✕ Dismiss
                </button>
                {/* Quick delete comment */}
                <button onClick={async () => {
                    await api.delete(`/comments/reports/${report.id}/delete-comment`).catch(()=>{});
                    onToast('✅ Comment deleted.'); load();
                  }}
                  style={{ background:'rgba(233,69,96,0.12)', color:'#e94560',
                    border:'none', borderRadius:8, padding:'0.38rem 0.8rem',
                    cursor:'pointer', fontSize:'0.78rem' }}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Action sheet modal */}
      {actionSheet && (
        <ActionSheet
          report={actionSheet}
          onClose={() => setActionSheet(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

export default ReportsTab;
