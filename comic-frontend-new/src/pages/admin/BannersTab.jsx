import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axiosConfig';
import { aLabelStyle, aInputStyle } from './shared';

function BannersTab({ onToast }) {
  const [banners,  setBanners]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const EMPTY = useMemo(() => ({ title:'', description:'', imageUrl:'', linkUrl:'', linkLabel:'Read Now',
                  placement:'HERO', active:true, sortOrder:0, startsAt:'', endsAt:'' }), []);
  const [form, setForm] = useState(EMPTY);

  const PLACEMENTS = [
    { id:'HERO',    icon:'🖼️', label:'Hero Banner',   desc:'Full-width rotating banner on homepage' },
    { id:'SIDEBAR', icon:'📌', label:'Sidebar Banner', desc:'Shown in the right sidebar widget'      },
    { id:'TOP_BAR', icon:'📣', label:'Top Bar',        desc:'Thin strip at the very top of the page' },
  ];

  const PLACEMENT_COLORS = { HERO:'#8b5cf6', SIDEBAR:'#3b82f6', TOP_BAR:'#f59e0b' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/banners/admin/all');
      setBanners(Array.isArray(data) ? data : []);
    } catch { onToast('❌ Failed to load banners'); }
    setLoading(false);
  }, [onToast]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY); setEditing({}); };
  const openEdit = (b) => {
    setForm({
      title: b.title || '', description: b.description || '',
      imageUrl: b.imageUrl || '', linkUrl: b.linkUrl || '',
      linkLabel: b.linkLabel || 'Read Now', placement: b.placement || 'HERO',
      active: b.active, sortOrder: b.sortOrder || 0,
      startsAt: b.startsAt ? b.startsAt.slice(0,16) : '',
      endsAt:   b.endsAt   ? b.endsAt.slice(0,16)   : '',
    });
    setEditing(b);
  };

  const save = async () => {
    if (!form.title.trim())    { onToast('❌ Title required'); return; }
    if (!form.imageUrl.trim()) { onToast('❌ Image URL required'); return; }
    setSaving(true);
    const payload = { ...form,
      startsAt: form.startsAt ? form.startsAt + ':00' : '',
      endsAt:   form.endsAt   ? form.endsAt   + ':00' : '',
    };
    try {
      if (editing?.id) await api.put(`/banners/admin/${editing.id}`, payload);
      else             await api.post('/banners/admin', payload);
      onToast(`✅ Banner ${editing?.id ? 'updated' : 'created'}!`);
      setEditing(null);
      load();
    } catch { onToast('❌ Failed to save'); }
    setSaving(false);
  };

  const toggle = async (b) => {
    try {
      await api.patch(`/banners/admin/${b.id}/toggle`);
      onToast(b.active ? '✅ Banner hidden' : '✅ Banner is now live');
      load();
    } catch { onToast('❌ Failed to update'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/admin/${id}`);
      onToast('✅ Deleted');
      load();
    } catch { onToast('❌ Failed to delete'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>🖼️ Banners</h1>
        <button onClick={openNew}
          style={{ background:'var(--accent-main)', color:'#fff', border:'none',
            padding:'0.55rem 1.2rem', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.88rem' }}>
          + New Banner
        </button>
      </div>

      <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.25rem',
        background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)',
        borderRadius:8, padding:'0.65rem 1rem' }}>
        💡 Hero banners replace the homepage carousel. Sidebar banners appear in the right widget. Top Bar shows a thin strip. Set start/end dates to schedule campaigns.
      </p>

      {/* Banner form modal */}
      {editing !== null && (
        <div onClick={() => setEditing(null)} style={{
          position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.65)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
        }}>
          <div className="admin-modal-inner" onClick={e => e.stopPropagation()}
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16,
              padding:'1.75rem', width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto',
              boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize:'1.1rem', marginBottom:'1.25rem' }}>
              {editing?.id ? '✏️ Edit Banner' : '🖼️ New Banner'}
            </h2>

            {/* Placement */}
            <label style={aLabelStyle}>Placement</label>
            <div className="banner-placement-row" style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem' }}>
              {PLACEMENTS.map(p => (
                <button key={p.id} onClick={() => set('placement', p.id)}
                  style={{ flex:'1 1 140px', padding:'0.6rem 0.75rem', borderRadius:10, fontSize:'0.78rem',
                    fontWeight:600, border:`2px solid ${form.placement===p.id ? PLACEMENT_COLORS[p.id] : 'var(--border)'}`,
                    cursor:'pointer', background: form.placement===p.id ? `${PLACEMENT_COLORS[p.id]}18` : 'var(--bg-elevated)',
                    color: form.placement===p.id ? PLACEMENT_COLORS[p.id] : 'var(--text-muted)',
                    textAlign:'left', transition:'all 0.15s' }}>
                  <div>{p.icon} {p.label}</div>
                  <div style={{ fontSize:'0.68rem', opacity:0.7, marginTop:2 }}>{p.desc}</div>
                </button>
              ))}
            </div>

            <label style={aLabelStyle}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. New Series Launch — Shadow Chronicles!" style={aInputStyle} />

            <label style={aLabelStyle}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Short tagline shown on the banner…" rows={2}
              style={{ ...aInputStyle, resize:'vertical' }} />

            <label style={aLabelStyle}>Image URL * <span style={{ color:'var(--text-dim)', fontWeight:400 }}>(use Cloudinary or any image URL)</span></label>
            <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
              placeholder="https://res.cloudinary.com/..." style={aInputStyle} />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" onError={e => e.target.style.display='none'}
                style={{ width:'100%', height:100, objectFit:'cover', borderRadius:8, marginBottom:'0.85rem', display:'block' }} />
            )}

            <div className="admin-form-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={aLabelStyle}>Link URL</label>
                <input value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)}
                  placeholder="/comic/123" style={aInputStyle} />
              </div>
              <div>
                <label style={aLabelStyle}>Button Label</label>
                <input value={form.linkLabel} onChange={e => set('linkLabel', e.target.value)}
                  placeholder="Read Now" style={aInputStyle} />
              </div>
            </div>

            <div className="admin-form-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={aLabelStyle}>Starts At <span style={{ color:'var(--text-dim)', fontWeight:400 }}>(optional)</span></label>
                <input type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} style={aInputStyle} />
              </div>
              <div>
                <label style={aLabelStyle}>Ends At <span style={{ color:'var(--text-dim)', fontWeight:400 }}>(optional)</span></label>
                <input type="datetime-local" value={form.endsAt} onChange={e => set('endsAt', e.target.value)} style={aInputStyle} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
              <div>
                <label style={aLabelStyle}>Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))}
                  style={aInputStyle} min={0} />
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:'0.85rem' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
                  <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
                    style={{ width:16, height:16, accentColor:'var(--accent-main)' }} />
                  Active / Visible
                </label>
              </div>
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
                  fontSize:'0.88rem', opacity:saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : (editing?.id ? 'Update' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner list */}
      {loading ? (
        Array.from({length:3}).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:90, borderRadius:12, marginBottom:'0.75rem' }} />
        ))
      ) : banners.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-dim)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🖼️</div>
          <div style={{ fontWeight:600 }}>No banners yet</div>
          <div style={{ fontSize:'0.82rem', marginTop:'0.35rem' }}>Create your first promotional banner above</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {banners.map(b => (
            <div key={b.id} style={{
              background:'var(--bg-card)', border:`1px solid ${b.active ? 'var(--border)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius:12, overflow:'hidden', opacity:b.active ? 1 : 0.55,
              display:'flex', alignItems:'stretch',
            }}>
              {/* Image preview */}
              <div style={{ width:120, flexShrink:0, background:'var(--bg-elevated)', overflow:'hidden' }}>
                <img src={b.imageUrl} alt={b.title} onError={e => e.target.style.display='none'}
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              {/* Info */}
              <div style={{ flex:1, padding:'0.9rem 1.1rem', minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.3rem' }}>
                  <span style={{ fontSize:'0.62rem', background: PLACEMENT_COLORS[b.placement] || '#888',
                    color:'#fff', padding:'0.1rem 0.45rem', borderRadius:3, fontWeight:700, textTransform:'uppercase' }}>
                    {b.placement}
                  </span>
                  {!b.active && <span style={{ fontSize:'0.6rem', background:'var(--bg-elevated)', color:'var(--text-dim)',
                    padding:'0.1rem 0.35rem', borderRadius:3, fontWeight:700 }}>HIDDEN</span>}
                  <span style={{ fontWeight:700, fontSize:'0.9rem' }}>{b.title}</span>
                </div>
                {b.description && (
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'0.3rem',
                    display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {b.description}
                  </div>
                )}
                <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                  {b.linkUrl && <span>🔗 {b.linkUrl}</span>}
                  {b.startsAt && <span>▶ {b.startsAt.slice(0,10)}</span>}
                  {b.endsAt   && <span>⏹ {b.endsAt.slice(0,10)}</span>}
                  <span>Sort: {b.sortOrder}</span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', padding:'0.75rem',
                justifyContent:'center', flexShrink:0 }}>
                <button onClick={() => toggle(b)}
                  style={{ background:'var(--bg-elevated)', color:'var(--text-muted)', border:'1px solid var(--border)',
                    padding:'0.3rem 0.7rem', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
                  {b.active ? '👁 Hide' : '👁 Show'}
                </button>
                <button onClick={() => openEdit(b)}
                  style={{ background:'rgba(67,97,238,0.12)', color:'#4361ee', border:'none',
                    padding:'0.3rem 0.7rem', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
                  ✏️ Edit
                </button>
                <button onClick={() => remove(b.id)}
                  style={{ background:'rgba(233,69,96,0.1)', color:'var(--accent-main)', border:'none',
                    padding:'0.3rem 0.7rem', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
                  🗑 Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BannersTab;
