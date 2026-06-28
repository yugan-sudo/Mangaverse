import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';

function AnnouncementsTab({ onToast }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // null | {} | existing item
  const [form,    setForm]    = useState({ title:'', content:'', type:'INFO', pinned:false, active:true, publishAt:'' });
  const [saving,  setSaving]  = useState(false);

  const TYPES = ['INFO','UPDATE','MAINTENANCE','WARNING'];
  const TYPE_ICONS = { INFO:'📢', UPDATE:'✨', MAINTENANCE:'🔧', WARNING:'⚠️' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/announcements');
      setItems(Array.isArray(data) ? data : []);
    } catch { onToast('❌ Failed to load announcements'); }
    setLoading(false);
  }, [onToast]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ title:'', content:'', type:'INFO', pinned:false, active:true });
    setEditing({});
  };

  const openEdit = (a) => {
    setForm({ title: a.title, content: a.content || '', type: a.type || 'INFO',
              pinned: a.pinned, active: a.active,
              publishAt: a.publishAt ? a.publishAt.slice(0,16) : '' });
    setEditing(a);
  };

  const save = async () => {
    if (!form.title.trim()) { onToast('❌ Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form,
        publishAt: form.publishAt ? form.publishAt + ':00' : '' };
      if (editing?.id) {
        await api.put(`/admin/announcements/${editing.id}`, payload);
        onToast('✅ Announcement updated');
      } else {
        await api.post('/admin/announcements', payload);
        onToast(form.publishAt
          ? `✅ Scheduled for ${new Date(form.publishAt).toLocaleString()}`
          : '✅ Published — users will see it immediately');
      }
      setEditing(null);
      load();
    } catch { onToast('❌ Failed to save'); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      onToast('✅ Deleted');
      load();
    } catch { onToast('❌ Failed to delete'); }
  };

  const toggleActive = async (a) => {
    try {
      await api.put(`/admin/announcements/${a.id}`, { ...a, active: !a.active });
      onToast(a.active ? '✅ Hidden from users' : '✅ Now visible to users');
      load();
    } catch { onToast('❌ Failed to update'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>📢 Announcements</h1>
        <button onClick={openNew}
          style={{ background:'var(--accent-main)', color:'#fff', border:'none',
            padding:'0.55rem 1.2rem', borderRadius:8, fontWeight:700, cursor:'pointer',
            fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
          + New Announcement
        </button>
      </div>

      <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.25rem',
        background:'rgba(233,69,96,0.08)', border:'1px solid rgba(233,69,96,0.2)',
        borderRadius:8, padding:'0.65rem 1rem' }}>
        💡 Announcements you create here are shown to <strong style={{ color:'var(--text-primary)' }}>all users</strong> on the homepage sidebar and <strong style={{ color:'var(--text-primary)' }}>/announcements</strong> page instantly.
      </p>

      {/* ── Form Modal ─────────────────────────────────────────────────── */}
      {editing !== null && (
        <div onClick={() => setEditing(null)} style={{
          position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.6)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center',
          padding:'1rem',
        }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
              borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:520,
              boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize:'1.1rem', marginBottom:'1.25rem' }}>
              {editing?.id ? '✏️ Edit Announcement' : '➕ New Announcement'}
            </h2>

            {/* Title */}
            <label style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'0.3rem' }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              placeholder="e.g. Site maintenance on June 5th"
              style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
                borderRadius:8, padding:'0.6rem 0.85rem', color:'var(--text-primary)',
                fontSize:'0.88rem', marginBottom:'0.85rem', boxSizing:'border-box' }} />

            {/* Content */}
            <label style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'0.3rem' }}>Message (shown to all users)</label>
            <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))}
              placeholder="Describe the announcement in detail…"
              rows={4}
              style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
                borderRadius:8, padding:'0.6rem 0.85rem', color:'var(--text-primary)',
                fontSize:'0.88rem', resize:'vertical', marginBottom:'0.85rem',
                boxSizing:'border-box', lineHeight:1.6 }} />

            {/* Type */}
            <label style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'0.3rem' }}>Type</label>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.85rem' }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({...f, type: t}))}
                  style={{ padding:'0.35rem 0.9rem', borderRadius:20, fontSize:'0.78rem', fontWeight:700,
                    border:'1px solid var(--border)', cursor:'pointer', transition:'all 0.15s',
                    background: form.type === t ? 'var(--accent-main)' : 'var(--bg-elevated)',
                    color: form.type === t ? '#fff' : 'var(--text-muted)' }}>
                  {TYPE_ICONS[t]} {t}
                </button>
              ))}
            </div>

            {/* Schedule — optional publish date */}
            <label style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'0.3rem' }}>
              🗓 Schedule (optional) <span style={{ fontWeight:400 }}>— leave blank to publish immediately</span>
            </label>
            <input type="datetime-local" value={form.publishAt || ''} onChange={e => setForm(f => ({...f, publishAt: e.target.value}))}
              style={{ width:'100%', boxSizing:'border-box', background:'var(--bg-elevated)', border:'1px solid var(--border)',
                borderRadius:8, padding:'0.6rem 0.85rem', color:'var(--text-primary)',
                fontSize:'0.88rem', marginBottom:'0.85rem', outline:'none' }} />

            {/* Toggles */}
            <div style={{ display:'flex', gap:'1.5rem', marginBottom:'1.25rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({...f, pinned: e.target.checked}))}
                  style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--accent-main)' }} />
                📌 Pinned
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))}
                  style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--accent-main)' }} />
                👁 Visible to users
              </label>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button onClick={() => setEditing(null)}
                style={{ background:'var(--bg-elevated)', color:'var(--text-muted)', border:'1px solid var(--border)',
                  padding:'0.55rem 1.2rem', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.88rem' }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ background:'var(--accent-main)', color:'#fff', border:'none',
                  padding:'0.55rem 1.4rem', borderRadius:8, cursor:'pointer', fontWeight:700,
                  fontSize:'0.88rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : (editing?.id ? 'Update' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── List ───────────────────────────────────────────────────────── */}
      {loading ? (
        Array.from({length:3}).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:80, borderRadius:10, marginBottom:'0.75rem' }} />
        ))
      ) : items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-dim)',
          border:'2px dashed var(--border)', borderRadius:12 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📢</div>
          <div style={{ fontWeight:600 }}>No announcements yet</div>
          <div style={{ fontSize:'0.82rem', marginTop:'0.35rem' }}>Click "+ New Announcement" to message all users</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {items.map(a => (
            <div key={a.id} style={{
              background:'var(--bg-card)', border:`1px solid ${a.active ? 'var(--border)' : 'rgba(255,255,255,0.03)'}`,
              borderRadius:12, padding:'1rem 1.25rem',
              opacity: a.active ? 1 : 0.55,
              borderLeft:`4px solid ${a.pinned ? 'var(--accent-main)' : 'transparent'}`,
              display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap',
            }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'1rem' }}>{TYPE_ICONS[a.type] || '📢'}</span>
                  {a.pinned && <span style={{ fontSize:'0.6rem', background:'var(--accent-main)', color:'#fff',
                    padding:'0.1rem 0.35rem', borderRadius:3, fontWeight:700 }}>PINNED</span>}
                  {!a.active && <span style={{ fontSize:'0.6rem', background:'var(--bg-elevated)', color:'var(--text-dim)',
                    padding:'0.1rem 0.35rem', borderRadius:3, fontWeight:700 }}>HIDDEN</span>}
                  {a.active && a.publishAt && new Date(a.publishAt) > new Date() && (
                    <span style={{ fontSize:'0.6rem', background:'rgba(139,92,246,0.2)', color:'#8b5cf6',
                      padding:'0.1rem 0.4rem', borderRadius:3, fontWeight:700 }}>
                      🗓 {new Date(a.publishAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </span>
                  )}
                  <span style={{ fontSize:'0.88rem', fontWeight:700 }}>{a.title}</span>
                </div>
                {a.content && (
                  <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', margin:0, lineHeight:1.5,
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {a.content}
                  </p>
                )}
                <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', marginTop:'0.35rem' }}>
                  {new Date(a.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  {' · '}{a.type}
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.4rem', flexShrink:0 }}>
                <button onClick={() => toggleActive(a)}
                  title={a.active ? 'Hide from users' : 'Show to users'}
                  style={{ background:'var(--bg-elevated)', color:'var(--text-muted)', border:'1px solid var(--border)',
                    padding:'0.3rem 0.65rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                  {a.active ? '👁 Hide' : '👁 Show'}
                </button>
                <button onClick={() => openEdit(a)}
                  style={{ background:'rgba(67,97,238,0.12)', color:'#4361ee', border:'none',
                    padding:'0.3rem 0.65rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                  ✏️ Edit
                </button>
                <button onClick={() => remove(a.id)}
                  style={{ background:'rgba(233,69,96,0.1)', color:'var(--accent-main)', border:'none',
                    padding:'0.3rem 0.65rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsTab;
