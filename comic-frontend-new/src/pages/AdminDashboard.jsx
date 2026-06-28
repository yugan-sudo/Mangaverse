import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { CoverUploader, PagesUploader } from '../components/CloudinaryUpload';
import { Toast, ActionSheet, StatCard, Field } from './admin/shared';
import AnalyticsTab from './admin/AnalyticsTab';
import AnnouncementsTab from './admin/AnnouncementsTab';
import BannersTab from './admin/BannersTab';
import BulkImportTab from './admin/BulkImportTab';
import CommunityTab from './admin/CommunityTab';
import ContactInboxTab from './admin/ContactInboxTab';
import ReportsTab from './admin/ReportsTab';

// ─── Sidebar tab definitions ──────────────────────────────────────────────
// NOTE: 'Schedule' tab removed — scheduling is now an inline step inside
// Add Chapter so admins never need to find/copy a chapter ID manually.
const TABS = [
  { id:'Dashboard',     icon:'📊', label:'Dashboard'         },
  { id:'Analytics',     icon:'📈', label:'Analytics'         },
  { id:'Comics',        icon:'📚', label:'Comics'             },
  { id:'AddComic',      icon:'➕', label:'Add Comic'          },
  { id:'EditComic',     icon:'✏️', label:'Edit Comic'        },
  { id:'AddChapter',    icon:'📄', label:'Add Chapter'        },
  { id:'Announcements', icon:'📢', label:'Announcements'      },
  { id:'Banners',       icon:'🖼️', label:'Banners'           },
  { id:'BulkImport',    icon:'📦', label:'Bulk Import'        },
  { id:'Community',     icon:'💬', label:'Community'          },
  { id:'ContactInbox',  icon:'📧', label:'Contact Inbox'      },
  { id:'Reports',       icon:'🚨', label:'Reports'            },
  { id:'Users',         icon:'👥', label:'Users'              },
];

// ─── Add Comic ────────────────────────────────────────────────────────────
function AddComicForm({ onAdded, isMobile }) {
  const [form, setForm] = useState({ title:'', author:'', genre:'', tags:'', description:'', coverImage:'', status:'ONGOING' });
  const [msg,  setMsg]  = useState('');
  const [uploadMode, setUploadMode] = useState('url');
  const h = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (!form.title.trim()) { setMsg('❌ Title is required.'); return; }
    try {
      await api.post('/admin/comics', form);
      setMsg('✅ Comic added!');
      setForm({ title:'', author:'', genre:'', tags:'', description:'', coverImage:'', status:'ONGOING' });
      setTimeout(() => onAdded?.(), 1500);
    } catch { setMsg('❌ Failed. Check backend.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={{ maxWidth:580 }}>
      {!isMobile && <h2 style={{ fontSize:'1.2rem', marginBottom:'1.5rem' }}>➕ Add New Comic</h2>}
      {msg && <div style={{ marginBottom:'1rem', fontSize:'0.88rem',
        color: msg.startsWith('✅') ? '#38b060':'#e94560' }}>{msg}</div>}
      <form onSubmit={submit}>
        <Field label="Title *"  name="title"  value={form.title}  onChange={h} placeholder="Comic title" />
        <Field label="Author"   name="author" value={form.author} onChange={h} placeholder="Author name" />
        <Field label="Genre"    name="genre"  value={form.genre}  onChange={h} placeholder="e.g. Action, Romance" />
        <div className="auth-form-group">
          <label>Tags</label>
          <input name="tags" value={form.tags} onChange={h}
            placeholder="e.g. isekai, system, regression (comma-separated)" />
          <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', marginTop:'0.3rem' }}>
            Comma-separated. These power the tag chips on Browse and the comic detail page.
          </div>
        </div>
        <div className="auth-form-group">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
            <label style={{ margin:0 }}>Cover Image</label>
            <div style={{ display:'flex', gap:'0.3rem' }}>
              {['url','upload'].map(m => (
                <button key={m} type="button" onClick={() => setUploadMode(m)}
                  style={{ fontSize:'0.72rem', padding:'0.2rem 0.6rem', borderRadius:20,
                    border:'none', cursor:'pointer', fontWeight:600,
                    background: uploadMode === m ? 'var(--accent-main)' : 'var(--bg-elevated)',
                    color: uploadMode === m ? '#fff' : 'var(--text-muted)' }}>
                  {m === 'url' ? '🔗 URL' : '☁️ Upload'}
                </button>
              ))}
            </div>
          </div>
          {uploadMode === 'url' ? (
            <input name="coverImage" value={form.coverImage} onChange={h}
              placeholder="https://picsum.photos/seed/title/300/450" style={{ width:'100%' }} />
          ) : (
            <CoverUploader onUploaded={url => setForm(f => ({ ...f, coverImage: url }))} />
          )}
          {form.coverImage && (
            <div style={{ marginTop:'0.5rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
              <img src={form.coverImage} alt="preview"
                style={{ width:50, height:70, objectFit:'cover', borderRadius:6 }} />
              <span style={{ fontSize:'0.72rem', color:'#38b060', wordBreak:'break-all' }}>
                ✅ {form.coverImage.slice(0, 60)}{form.coverImage.length > 60 ? '…' : ''}
              </span>
            </div>
          )}
        </div>
        <div className="auth-form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={h}
            placeholder="Comic description…" rows={3}
            style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
              color:'var(--text-primary)', padding:'0.75rem', borderRadius:8,
              fontSize:'0.88rem', outline:'none', resize:'vertical', fontFamily:'inherit' }} />
        </div>
        <div className="auth-form-group">
          <label>Status</label>
          <select name="status" value={form.status} onChange={h}
            style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
              color:'var(--text-primary)', padding:'0.75rem', borderRadius:8, fontSize:'0.88rem', outline:'none' }}>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="HIATUS">Hiatus</option>
          </select>
        </div>
        <button className="auth-btn" type="submit" disabled={!form.title.trim()}>Add Comic</button>
      </form>
    </div>
  );
}

// ─── Edit Comic ───────────────────────────────────────────────────────────
function EditComicForm({ isMobile }) {
  const [comicId, setComicId] = useState('');
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [uploadMode, setUploadMode] = useState('url');

  const load = async () => {
    if (!comicId) return; setLoading(true);
    try {
      const { data } = await api.get(`/admin/comics/${comicId}`);
      setForm({ title:data.title||'', author:data.author||'', genre:data.genre||'', tags:data.tags||'',
        description:data.description||'', coverImage:data.coverImage||'', status:data.status||'ONGOING' });
      setMsg('');
    } catch { setMsg('❌ Not found.'); setForm(null); }
    setLoading(false);
  };

  const h = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    try { await api.put(`/admin/comics/${comicId}`, form); setMsg('✅ Updated!'); }
    catch { setMsg('❌ Failed.'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={{ maxWidth:580 }}>
      {!isMobile && <h2 style={{ fontSize:'1.2rem', marginBottom:'1.5rem' }}>✏️ Edit Comic</h2>}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', alignItems:'flex-end' }}>
        <div className="auth-form-group" style={{ flex:1, margin:0 }}>
          <label>Comic ID</label>
          <input type="number" min="1" value={comicId}
            onChange={e => { setComicId(e.target.value); setForm(null); }}
            placeholder="Enter comic ID" />
        </div>
        <button className="btn-accent" style={{ padding:'0.65rem 1.2rem' }}
          onClick={load} disabled={loading||!comicId}>
          {loading ? '…' : 'Load'}
        </button>
      </div>
      {msg && <div style={{ marginBottom:'1rem', fontSize:'0.88rem',
        color: msg.startsWith('✅') ? '#38b060':'#e94560' }}>{msg}</div>}
      {form && (
        <form onSubmit={submit}>
          <Field label="Title"  name="title"  value={form.title}  onChange={h} placeholder="Title" />
          <Field label="Author" name="author" value={form.author} onChange={h} placeholder="Author" />
          <Field label="Genre"  name="genre"  value={form.genre}  onChange={h} placeholder="Genre" />
          <div className="auth-form-group">
            <label>Tags</label>
            <input name="tags" value={form.tags} onChange={h}
              placeholder="e.g. isekai, system, regression (comma-separated)" />
            <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', marginTop:'0.3rem' }}>
              Comma-separated. Powers tag chips on Browse and the comic detail page.
            </div>
          </div>
          <div className="auth-form-group">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
              <label style={{ margin:0 }}>Cover Image</label>
              <div style={{ display:'flex', gap:'0.3rem' }}>
                {['url','upload'].map(m => (
                  <button key={m} type="button" onClick={() => setUploadMode(m)}
                    style={{ fontSize:'0.72rem', padding:'0.2rem 0.6rem', borderRadius:20,
                      border:'none', cursor:'pointer', fontWeight:600,
                      background: uploadMode === m ? 'var(--accent-main)' : 'var(--bg-elevated)',
                      color: uploadMode === m ? '#fff' : 'var(--text-muted)' }}>
                    {m === 'url' ? '🔗 URL' : '☁️ Upload'}
                  </button>
                ))}
              </div>
            </div>
            {uploadMode === 'url' ? (
              <input name="coverImage" value={form.coverImage} onChange={h} placeholder="https://..." />
            ) : (
              <CoverUploader onUploaded={url => setForm(f => ({ ...f, coverImage: url }))} />
            )}
            {form.coverImage && (
              <div style={{ marginTop:'0.5rem', display:'flex', gap:'0.75rem', alignItems:'center' }}>
                <img src={form.coverImage} alt="preview"
                  style={{ width:50, height:70, objectFit:'cover', borderRadius:6 }} />
                <span style={{ fontSize:'0.72rem', color:'#38b060', wordBreak:'break-all' }}>
                  ✅ {form.coverImage.slice(0, 60)}{form.coverImage.length > 60 ? '…' : ''}
                </span>
              </div>
            )}
          </div>
          <div className="auth-form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={h} rows={3}
              style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
                color:'var(--text-primary)', padding:'0.75rem', borderRadius:8,
                fontSize:'0.88rem', outline:'none', resize:'vertical', fontFamily:'inherit' }} />
          </div>
          <div className="auth-form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={h}
              style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
                color:'var(--text-primary)', padding:'0.75rem', borderRadius:8, fontSize:'0.88rem', outline:'none' }}>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="HIATUS">Hiatus</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button className="auth-btn" type="submit" style={{ flex:1 }}>💾 Update</button>
            <button type="button" className="btn-outline"
              onClick={() => { setForm(null); setComicId(''); }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Add Chapter (with inline Schedule step) ──────────────────────────────
// After a chapter is created, a "📅 Schedule this chapter" panel appears
// automatically — the chapter ID is pre-filled so the admin never needs
// to find it manually or navigate to a separate tab.
function AddChapterForm({ isMobile }) {
  const [mode,        setMode]        = useState('zip');
  const [form,        setForm]        = useState({ comicId:'', chapterNumber:'', title:'' });
  const [urlInputs,   setUrlInputs]   = useState(['']);
  const [imageUrls,   setImageUrls]   = useState([]);
  const [zipFile,     setZipFile]     = useState(null);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatus,   setZipStatus]   = useState('idle');
  const [zipResult,   setZipResult]   = useState(null);
  const [msg,         setMsg]         = useState('');
  // Inline schedule state
  const [createdId,      setCreatedId]      = useState(null);
  const [showSchedule,   setShowSchedule]   = useState(false);
  const [scheduledAt,    setScheduledAt]    = useState('');
  const [scheduleMsg,    setScheduleMsg]    = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const zipRef = useRef();
  const h = e => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => {
    setForm({ comicId:'', chapterNumber:'', title:'' });
    setZipFile(null); setZipStatus('idle'); setZipResult(null);
    setUrlInputs(['']); setImageUrls([]);
    setMsg(''); setCreatedId(null);
    setShowSchedule(false); setScheduledAt(''); setScheduleMsg('');
  };

  const onCreated = (id, pages) => {
    setCreatedId(id);
    setForm({ comicId:'', chapterNumber:'', title:'' });
    setZipFile(null);
    setMsg(`✅ Chapter created (ID: ${id}) with ${pages} page${pages !== 1 ? 's' : ''}! Bookmarked users notified.`);
    setShowSchedule(true); // auto-reveal the inline schedule step
  };

  const handleZipFile = (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      setMsg('Please select a .zip file.'); return;
    }
    setZipFile(file); setZipStatus('idle'); setZipResult(null); setMsg('');
  };

  const uploadZip = async () => {
    if (!zipFile || !form.comicId || !form.chapterNumber) {
      setMsg('Comic ID, Chapter Number and ZIP file are required.'); return;
    }
    setZipStatus('uploading'); setZipProgress(0); setMsg('');
    const fd = new FormData();
    fd.append('file',          zipFile);
    fd.append('comicId',       form.comicId);
    fd.append('chapterNumber', form.chapterNumber);
    fd.append('title',         form.title || '');
    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/chapters/zip');
        // FIX: JWT is now in an HttpOnly cookie — withCredentials sends it
        // automatically. The old localStorage.getItem('token') no longer works.
        xhr.withCredentials = true;
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setZipProgress(Math.round((e.loaded / e.total) * 88));
        };
        xhr.onload = () => {
          setZipProgress(100);
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')); }
            catch { reject(new Error('Upload failed')); }
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });
      setZipResult(result);
      setZipStatus('done');
      onCreated(result.chapterId, result.totalPages);
    } catch (err) {
      setZipStatus('error');
      setMsg(`❌ ${err.message}`);
    }
  };

  const submitUrls = async e => {
    e.preventDefault();
    const urls = mode === 'url' ? urlInputs.filter(u => u.trim()) : imageUrls;
    if (!form.comicId || !form.chapterNumber) { setMsg('Comic ID and Chapter Number are required.'); return; }
    try {
      const { data } = await api.post('/admin/chapters', {
        comicId: Number(form.comicId), chapterNumber: Number(form.chapterNumber),
        title: form.title, imageUrls: urls,
      });
      onCreated(data.id || data.chapterId, urls.length);
      setUrlInputs(['']); setImageUrls([]);
    } catch { setMsg('❌ Failed. Check comic ID and backend.'); }
  };

  const saveSchedule = async () => {
    if (!createdId) return;
    setScheduleSaving(true); setScheduleMsg('');
    try {
      const body = scheduledAt ? { scheduledAt } : {};
      const { data } = await api.put(`/calendar/admin/chapters/${createdId}/schedule`, body);
      setScheduleMsg('✅ ' + data.message);
      setTimeout(() => reset(), 2000);
    } catch (err) {
      setScheduleMsg('❌ ' + (err?.response?.data?.error || 'Failed to schedule.'));
    }
    setScheduleSaving(false);
  };

  const isSuccess = msg.startsWith('✅');

  return (
    <div style={{ maxWidth:620 }}>
      {!isMobile && <h2 style={{ fontSize:'1.2rem', marginBottom:'0.5rem' }}>📄 Add Chapter</h2>}
      <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'1.25rem' }}>
        Bookmarked users get an in-app notification when you upload.
        After creating a chapter you can optionally pre-schedule its release date.
      </p>

      {/* Mode selector */}
      <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1.25rem' }}>
        {[['zip','🗜️','ZIP Upload'],['url','🔗','Paste URLs'],['upload','☁️','Upload Files']].map(([id,icon,label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} style={{
            flex:1, padding:'0.55rem 0', borderRadius:10, border:'none', cursor:'pointer',
            fontWeight:700, fontSize:'0.82rem', transition:'all 0.15s',
            background: mode === id ? 'var(--accent-main)' : 'var(--bg-elevated)',
            color: mode === id ? '#fff' : 'var(--text-muted)',
          }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ marginBottom:'1rem', fontSize:'0.88rem', padding:'0.7rem 1rem', borderRadius:8,
          border:`1px solid ${isSuccess ? 'rgba(56,176,96,0.3)' : 'rgba(233,69,96,0.3)'}`,
          background: isSuccess ? 'rgba(56,176,96,0.08)' : 'rgba(233,69,96,0.08)',
          color: isSuccess ? '#38b060' : '#e94560' }}>
          {msg}
        </div>
      )}

      {/* Chapter fields — hidden once chapter is created */}
      {!showSchedule && (
        <>
          <Field label="Comic ID *"       name="comicId"       value={form.comicId}       onChange={h} placeholder="e.g. 1"  type="number" />
          <Field label="Chapter Number *" name="chapterNumber" value={form.chapterNumber} onChange={h} placeholder="e.g. 12" type="number" />
          <Field label="Title (optional)" name="title"         value={form.title}         onChange={h} placeholder="e.g. The Beginning" />

          {mode === 'zip' && (
            <div>
              <div onClick={() => zipRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleZipFile(e.dataTransfer.files[0]); }}
                style={{
                  border:`2px dashed ${zipFile ? 'var(--accent-main)' : 'var(--border)'}`,
                  borderRadius:12, padding:'1.75rem', textAlign:'center', cursor:'pointer',
                  background: zipFile ? 'rgba(233,69,96,0.04)' : 'var(--bg-elevated)',
                  transition:'all 0.2s', marginBottom:'0.75rem',
                }}>
                {zipFile ? (
                  <div>
                    <div style={{ fontSize:'2rem', marginBottom:'0.35rem' }}>🗜️</div>
                    <div style={{ fontWeight:700, color:'var(--accent-main)' }}>{zipFile.name}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:'0.2rem' }}>
                      {(zipFile.size/1024/1024).toFixed(1)} MB · Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:'2rem', marginBottom:'0.4rem' }}>🗜️</div>
                    <div style={{ fontWeight:700, fontSize:'0.9rem' }}>Drop ZIP here or click to browse</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:'0.3rem' }}>
                      Name files 001.jpg, 002.jpg… for correct page order · Max 200 MB
                    </div>
                  </div>
                )}
              </div>
              <input ref={zipRef} type="file" accept=".zip" style={{ display:'none' }}
                onChange={e => handleZipFile(e.target.files[0])} />

              {zipStatus === 'uploading' && (
                <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'0.85rem', marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>
                    <span>{zipProgress < 90 ? `Uploading… ${zipProgress}%` : 'Extracting & saving pages…'}</span>
                    <span style={{ fontWeight:700, color:'var(--accent-main)' }}>{zipProgress}%</span>
                  </div>
                  <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:4, width:`${zipProgress}%`,
                      background:'linear-gradient(90deg,#8b5cf6,#e94560)', transition:'width 0.3s' }} />
                  </div>
                </div>
              )}

              {zipStatus === 'done' && zipResult && (
                <div style={{ background:'rgba(56,176,96,0.08)', border:'1px solid rgba(56,176,96,0.25)',
                  borderRadius:10, padding:'0.85rem 1rem', marginBottom:'0.75rem' }}>
                  <div style={{ fontWeight:700, color:'#38b060', marginBottom:'0.5rem' }}>
                    {zipResult.totalPages} pages extracted and saved in order
                  </div>
                  <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>
                    {zipResult.pageNames.slice(0,10).map((name,i) => (
                      <span key={i} style={{ background:'var(--bg-elevated)', fontSize:'0.62rem',
                        padding:'0.12rem 0.4rem', borderRadius:4, color:'var(--text-muted)' }}>
                        {i+1}. {name}
                      </span>
                    ))}
                    {zipResult.pageNames.length > 10 && (
                      <span style={{ fontSize:'0.62rem', color:'var(--text-dim)', padding:'0.12rem' }}>
                        +{zipResult.pageNames.length-10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button type="button" onClick={uploadZip}
                disabled={!zipFile || !form.comicId || !form.chapterNumber || zipStatus === 'uploading'}
                style={{
                  width:'100%', padding:'0.75rem', borderRadius:10, border:'none', cursor:'pointer',
                  fontWeight:700, fontSize:'0.9rem', transition:'all 0.2s',
                  background: (zipFile && form.comicId && form.chapterNumber) ? 'var(--accent-main)' : 'var(--bg-elevated)',
                  color: (zipFile && form.comicId && form.chapterNumber) ? '#fff' : 'var(--text-dim)',
                  opacity: zipStatus === 'uploading' ? 0.7 : 1,
                }}>
                {zipStatus === 'uploading' ? `Uploading… ${zipProgress}%` : zipFile ? '🗜️ Upload & Extract ZIP' : 'Select a ZIP file above'}
              </button>
            </div>
          )}

          {mode === 'url' && (
            <form onSubmit={submitUrls}>
              <div className="auth-form-group">
                <label>Chapter Pages (one URL per page, in order)</label>
                {urlInputs.map((url,i) => (
                  <div key={i} style={{ display:'flex', gap:'0.4rem', marginBottom:'0.35rem' }}>
                    <input value={url} onChange={e => { const u=[...urlInputs]; u[i]=e.target.value; setUrlInputs(u); }}
                      placeholder={`Page ${i+1} image URL`} style={{ flex:1 }} />
                    {urlInputs.length > 1 && (
                      <button type="button" onClick={() => setUrlInputs(urlInputs.filter((_,idx)=>idx!==i))}
                        style={{ background:'rgba(233,69,96,0.15)', color:'#e94560', border:'none', borderRadius:6, padding:'0 0.6rem', cursor:'pointer' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setUrlInputs([...urlInputs,''])}
                  className="btn-outline" style={{ fontSize:'0.78rem', padding:'0.3rem 0.75rem', marginTop:'0.35rem' }}>
                  + Add Page URL
                </button>
              </div>
              <button className="auth-btn" type="submit" disabled={!form.comicId || !form.chapterNumber}>
                Save Chapter
              </button>
            </form>
          )}

          {mode === 'upload' && (
            <form onSubmit={submitUrls}>
              <div className="auth-form-group">
                <label>Chapter Pages (upload to Cloudinary)</label>
                <PagesUploader onUploaded={urls => setImageUrls(urls)} />
                {imageUrls.length > 0 && (
                  <div style={{ fontSize:'0.78rem', color:'#38b060', marginTop:'0.4rem' }}>
                    ✅ {imageUrls.length} pages ready
                  </div>
                )}
              </div>
              <button className="auth-btn" type="submit"
                disabled={!form.comicId || !form.chapterNumber || imageUrls.length === 0}>
                Save Chapter
              </button>
            </form>
          )}
        </>
      )}

      {/* ── INLINE SCHEDULE STEP ─────────────────────────────────────────────
          Appears automatically right after a chapter is created.
          The chapter ID is already known here — no separate tab, no copy-paste.
          Admin can pick a date or just click "Done" to publish immediately. ── */}
      {showSchedule && createdId && (
        <div style={{ background:'var(--bg-card)', border:'1px solid rgba(139,92,246,0.35)',
          borderRadius:14, padding:'1.35rem', marginTop:'0.25rem',
          boxShadow:'0 4px 24px rgba(139,92,246,0.1)' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div style={{ fontWeight:700, fontSize:'0.95rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              📅 Schedule this chapter
              <span style={{ background:'rgba(139,92,246,0.15)', color:'#a78bfa',
                fontSize:'0.72rem', padding:'0.15rem 0.55rem', borderRadius:20, fontWeight:600 }}>
                Chapter ID: {createdId}
              </span>
            </div>
            <button onClick={reset}
              style={{ background:'none', border:'none', color:'var(--text-dim)',
                cursor:'pointer', fontSize:'0.82rem', textDecoration:'underline', padding:0 }}>
              Add another chapter
            </button>
          </div>

          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
            Pick a future release date to pre-schedule this chapter on the Release Calendar.
            Leave blank to publish immediately — readers can already access it.
          </p>

          <div className="auth-form-group">
            <label>Release Date &amp; Time (optional)</label>
            <input type="datetime-local" value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)',
                color:'var(--text-primary)', padding:'0.75rem', borderRadius:8,
                fontSize:'0.88rem', outline:'none', colorScheme:'dark' }} />
          </div>

          {scheduledAt && (
            <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)',
              borderRadius:8, padding:'0.65rem 0.9rem', marginBottom:'1rem',
              fontSize:'0.8rem', color:'#c4b5fd' }}>
              📅 Will appear on the Release Calendar on{' '}
              <strong>{new Date(scheduledAt).toLocaleDateString('en-US',
                { weekday:'long', month:'long', day:'numeric' })}</strong>{' '}
              at <strong>{new Date(scheduledAt).toLocaleTimeString('en-US',
                { hour:'2-digit', minute:'2-digit' })}</strong>
            </div>
          )}

          {scheduleMsg && (
            <div style={{ marginBottom:'0.85rem', fontSize:'0.85rem', padding:'0.6rem 0.85rem', borderRadius:8,
              color: scheduleMsg.startsWith('✅') ? '#38b060' : '#e94560',
              background: scheduleMsg.startsWith('✅') ? 'rgba(56,176,96,0.08)' : 'rgba(233,69,96,0.08)',
              border:`1px solid ${scheduleMsg.startsWith('✅') ? 'rgba(56,176,96,0.3)' : 'rgba(233,69,96,0.3)'}` }}>
              {scheduleMsg}
            </div>
          )}

          <button className="auth-btn" onClick={saveSchedule}
            disabled={scheduleSaving} style={{ width:'100%' }}>
            {scheduleSaving ? 'Saving…' : scheduledAt ? '📅 Schedule Release' : '✅ Done (Publish Now)'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab,            setTab]            = useState('Dashboard');
  const [stats,          setStats]          = useState({ comics:0, chapters:0, users:0 });
  const [comics,         setComics]         = useState([]);
  const [users,          setUsers]          = useState([]);
  const [pendingReports, setPendingReports] = useState(0);
  const [toast,          setToast]          = useState('');
  const [isMobile,       setIsMobile]       = useState(window.innerWidth <= 768);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').catch(() => null),
      api.get('/comics?size=100').catch(() => null),
      api.get('/admin/users').catch(() => null),
      api.get('/comments/reports/count').catch(() => null),
    ]).then(([s, c, u, r]) => {
      if (s) setStats(s.data);
      if (c) setComics(c.data?.content || c.data || []);
      if (u) setUsers(u.data || []);
      if (r) setPendingReports(r.data?.pending || 0);
    });
  }, []);

  const deleteComic = async (id) => {
    if (!window.confirm('Delete this comic and ALL its chapters, comments and reports? This cannot be undone.')) return;
    // FIX: previously did optimistic remove before the API call — if the
    // DELETE failed (e.g. FK constraint) the comic vanished from the list
    // but still existed in the DB, so the admin had no way to retry.
    // Now: call API first, only remove from state on success.
    try {
      await api.delete(`/admin/comics/${id}`);
      setComics(prev => prev.filter(c => c.id !== id));
      setToast('✅ Comic deleted.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || '';
      setToast(`❌ Delete failed${msg ? ': ' + msg : '. Check if chapters/comments still reference this comic.'}`);
    }
  };

  const statusStyle = s =>
    s === 'ONGOING'   ? { bg:'rgba(67,97,238,0.2)',  text:'#4361ee' } :
    s === 'COMPLETED' ? { bg:'rgba(56,176,96,0.2)',  text:'#38b060' } :
                        { bg:'rgba(247,37,133,0.2)', text:'#f72585' };

  const currentTab = TABS.find(t => t.id === tab);

  const SidebarContent = () => (
    <>
      {!isMobile && (
        <div style={{ fontFamily:'Bangers,cursive', fontSize:'1.2rem', letterSpacing:2,
          background:'linear-gradient(135deg,#e94560,#7209b7)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          marginBottom:'1.25rem', padding:'0 0.5rem' }}>
          ADMIN PANEL
        </div>
      )}
      {TABS.map(t => (
        <div key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }}
          role="button" tabIndex={0}
          onKeyDown={e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); setTab(t.id); setSidebarOpen(false); } }}
          style={{
            display:'flex', alignItems:'center', gap:'0.6rem',
            padding:'0.65rem 0.85rem', borderRadius:10, cursor:'pointer',
            fontSize:'0.88rem', fontWeight:600, marginBottom:'0.2rem',
            color: tab === t.id ? 'var(--accent-main)' : 'var(--text-muted)',
            background: tab === t.id ? 'rgba(233,69,96,0.1)' : 'transparent',
            transition:'all 0.15s',
          }}
          onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background='var(--bg-elevated)'; }}
          onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background='transparent'; }}>
          <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{t.icon}</span>
          <span>{t.label}</span>
          {t.id === 'Reports' && pendingReports > 0 && (
            <span style={{ marginLeft:'auto', background:'#e94560', color:'#fff',
              borderRadius:20, fontSize:'0.6rem', padding:'0.1rem 0.45rem', fontWeight:800 }}>
              {pendingReports}
            </span>
          )}
        </div>
      ))}
    </>
  );

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 64px)' }}>

      {!isMobile && (
        <aside style={{ width:220, flexShrink:0, background:'var(--bg-secondary)',
          borderRight:'1px solid var(--border)', padding:'1.25rem 0.85rem',
          position:'sticky', top:64, height:'calc(100vh - 64px)', overflowY:'auto' }}>
          <SidebarContent />
        </aside>
      )}

      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:7000, background:'rgba(0,0,0,0.5)' }} />
          <div style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:7001, width:260,
            background:'var(--bg-card)', borderRight:'1px solid var(--border)',
            padding:'1.25rem 0.85rem', overflowY:'auto',
            animation:'slideInLeft 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
            <div style={{ fontFamily:'Bangers,cursive', fontSize:'1.2rem', letterSpacing:2,
              background:'linear-gradient(135deg,#e94560,#7209b7)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              marginBottom:'1.25rem' }}>
              ADMIN PANEL
            </div>
            <SidebarContent />
          </div>
        </>
      )}

      <main style={{ flex:1, overflowY:'auto',
        padding: isMobile ? '0' : '1.75rem',
        paddingBottom: isMobile ? '70px' : undefined }}>

        {isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem',
            padding:'0.85rem 1rem', background:'var(--bg-secondary)',
            borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
            <button onClick={() => setSidebarOpen(true)}
              style={{ background:'none', border:'none', color:'var(--text-primary)',
                cursor:'pointer', fontSize:'1.3rem', lineHeight:1, padding:0 }}>
              ☰
            </button>
            <span style={{ fontWeight:700, fontSize:'1rem' }}>
              {currentTab?.icon} {currentTab?.label}
            </span>
            {tab === 'Reports' && pendingReports > 0 && (
              <span style={{ marginLeft:'auto', background:'#e94560', color:'#fff',
                borderRadius:20, fontSize:'0.7rem', padding:'0.15rem 0.5rem', fontWeight:800 }}>
                {pendingReports}
              </span>
            )}
          </div>
        )}

        <div style={{ padding: isMobile ? '1rem' : '0' }}>

          {tab === 'Dashboard' && (
            <>
              {!isMobile && <h1 style={{ fontSize:'1.5rem', marginBottom:'1.5rem' }}>📊 Overview</h1>}
              <div style={{ display:'grid',
                gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(180px,1fr))',
                gap:'0.85rem', marginBottom:'1.5rem' }}>
                <StatCard icon="📚" value={stats.comics}   label="Comics"   color="#4361ee" />
                <StatCard icon="📄" value={stats.chapters} label="Chapters" color="#e94560" />
                <StatCard icon="👥" value={stats.users}    label="Users"    color="#7209b7" />
                <StatCard icon="🚨" value={pendingReports} label="Reports"  color="#f72585" />
              </div>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:14, padding:'1.25rem' }}>
                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-dim)',
                  textTransform:'uppercase', letterSpacing:1, marginBottom:'0.85rem' }}>
                  QUICK ACTIONS
                </div>
                <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
                  <button className="btn-accent" onClick={() => setTab('AddComic')}>➕ Add Comic</button>
                  <button className="btn-outline" onClick={() => setTab('EditComic')}>✏️ Edit Comic</button>
                  <button className="btn-outline" onClick={() => setTab('AddChapter')}>📄 Add Chapter</button>
                  {pendingReports > 0 && (
                    <button onClick={() => setTab('Reports')}
                      style={{ background:'rgba(233,69,96,0.15)', color:'#e94560',
                        border:'1px solid rgba(233,69,96,0.3)', borderRadius:40,
                        padding:'0.5rem 1.2rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:700 }}>
                      🚨 {pendingReports} Reports
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'Comics' && (
            <>
              {!isMobile && <h1 style={{ fontSize:'1.5rem', marginBottom:'1.5rem' }}>📚 Manage Comics</h1>}
              {comics.length === 0 ? <p style={{ color:'var(--text-muted)' }}>No comics yet.</p> : (
                isMobile ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                    {comics.map(c => {
                      const col = statusStyle(c.status);
                      return (
                        <div key={c.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'0.85rem' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.4rem' }}>
                            <div>
                              <div style={{ fontWeight:700 }}>{c.title}</div>
                              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>ID:{c.id} · {c.author}</div>
                            </div>
                            <span style={{ padding:'0.12rem 0.45rem', borderRadius:20, fontSize:'0.62rem', fontWeight:700, background:col.bg, color:col.text }}>{c.status}</span>
                          </div>
                          <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.5rem' }}>
                            <button onClick={() => setTab('EditComic')} style={{ background:'rgba(67,97,238,0.12)', color:'#4361ee', border:'none', borderRadius:6, padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.75rem' }}>✏️ Edit</button>
                            <button onClick={() => deleteComic(c.id)} style={{ background:'rgba(233,69,96,0.12)', color:'#e94560', border:'none', borderRadius:6, padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.75rem' }}>🗑 Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid var(--border)', color:'var(--text-muted)' }}>
                          {['ID','Title','Author','Genre','Status','Actions'].map(h => (
                            <th key={h} style={{ textAlign:'left', padding:'0.75rem 0.5rem', fontWeight:600, fontSize:'0.78rem', textTransform:'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comics.map(c => {
                          const col = statusStyle(c.status);
                          return (
                            <tr key={c.id} style={{ borderBottom:'1px solid var(--border)' }}>
                              <td style={{ padding:'0.75rem 0.5rem', color:'var(--text-dim)' }}>{c.id}</td>
                              <td style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>{c.title}</td>
                              <td style={{ padding:'0.75rem 0.5rem', color:'var(--text-muted)' }}>{c.author}</td>
                              <td style={{ padding:'0.75rem 0.5rem', color:'var(--accent-blue)' }}>{c.genre}</td>
                              <td style={{ padding:'0.75rem 0.5rem' }}>
                                <span style={{ padding:'0.15rem 0.55rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:col.bg, color:col.text }}>{c.status}</span>
                              </td>
                              <td style={{ padding:'0.75rem 0.5rem' }}>
                                <div style={{ display:'flex', gap:'0.4rem' }}>
                                  <button onClick={() => setTab('EditComic')} style={{ background:'rgba(67,97,238,0.12)', color:'#4361ee', border:'none', padding:'0.3rem 0.75rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>✏️ Edit</button>
                                  <button onClick={() => deleteComic(c.id)} style={{ background:'rgba(233,69,96,0.12)', color:'#e94560', border:'none', padding:'0.3rem 0.75rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>🗑 Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </>
          )}

          {tab === 'AddComic'      && <AddComicForm onAdded={() => setTab('Comics')} isMobile={isMobile} />}
          {tab === 'EditComic'     && <EditComicForm isMobile={isMobile} />}
          {tab === 'AddChapter'    && <AddChapterForm isMobile={isMobile} />}
          {tab === 'Analytics'     && <AnalyticsTab />}
          {tab === 'Announcements' && <AnnouncementsTab onToast={setToast} />}
          {tab === 'Banners'       && <BannersTab onToast={setToast} />}
          {tab === 'BulkImport'    && <BulkImportTab onToast={setToast} />}
          {tab === 'Community'     && <CommunityTab onToast={setToast} />}
          {tab === 'ContactInbox'  && <ContactInboxTab onToast={setToast} />}
          {tab === 'Reports'       && <ReportsTab onToast={setToast} />}

          {tab === 'Users' && (
            <>
              {!isMobile && <h1 style={{ fontSize:'1.5rem', marginBottom:'1.5rem' }}>👥 Users</h1>}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {users.map(u => (
                  <div key={u.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                    borderRadius:10, padding:'0.75rem 1rem',
                    display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{u.username}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                      <span style={{ fontSize:'0.75rem', fontWeight:700, color: u.role==='ADMIN'?'#e94560':'#4361ee' }}>{u.role}</span>
                      {u.createdAt && <span style={{ fontSize:'0.7rem', color:'var(--text-dim)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
