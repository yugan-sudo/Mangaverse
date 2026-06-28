import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import useSEO from '../hooks/useSEO';
import { CoverUploader } from '../components/CloudinaryUpload';

const PRESET_AVATARS = ['👻','🐉','⚔️','🌙','🔥','💀','🌸','⚡','🦊','🐺','🌊','🎭','🏹','🧿','🎪','🦋'];
const GENRES_LIST   = ['Action','Adventure','Fantasy','Romance','Horror','Comedy','Sci-Fi','Drama','Slice of Life','Mystery'];

export default function EditProfile() {
  const { user, refreshUser } = useAuth();   // FIX: pull refreshUser from context
  const navigate = useNavigate();
  useSEO({ title:'Edit Profile' });

  const [form,    setForm]    = useState({ displayName:'', bio:'', avatar:'👻', favouriteGenres:[] });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState({ msg:'', ok:true });
  const [tab,     setTab]     = useState('profile');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/me/profile').then(({ data }) => {
      setForm({
        displayName:     data.displayName     || user.username || '',
        bio:             data.bio             || '',
        avatar:          data.avatar          || '👻',
        favouriteGenres: data.favouriteGenres ? data.favouriteGenres.split(',').filter(Boolean) : [],
      });
    }).catch(() => {
      setForm(f => ({ ...f, displayName: user.username || '' }));
    }).finally(() => setLoading(false));
  }, [user]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg:'', ok:true }), 3000);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/me/profile', {
        ...form,
        favouriteGenres: form.favouriteGenres.join(','),
      });
      // FIX: refresh the global user object so the new avatar/displayName
      // propagates immediately to Navbar, ChapterComments, UserProfile,
      // and anywhere else that reads user from AuthContext.
      await refreshUser();
      showToast('✅ Profile updated!', true);
    } catch (err) {
      showToast(`❌ ${err?.response?.data?.message || 'Failed to save'}`, false);
    }
    setSaving(false);
  };

  const toggleGenre = (g) => setForm(f => ({
    ...f,
    favouriteGenres: f.favouriteGenres.includes(g)
      ? f.favouriteGenres.filter(x => x !== g)
      : [...f.favouriteGenres, g],
  }));

  // Reusable avatar renderer — handles emoji, image URL, and letter fallback
  const AvatarPreview = ({ avatar, size = 52, username = '' }) => {
    const isUrl = avatar?.startsWith('http');
    const isEmoji = avatar && !isUrl && avatar.length <= 2;
    return (
      <div style={{ width:size, height:size, borderRadius:'50%',
        background:'linear-gradient(135deg,#8b5cf6,#e94560)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: isEmoji ? size * 0.55 : size * 0.4,
        overflow:'hidden', flexShrink:0 }}>
        {isUrl
          ? <img src={avatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : isEmoji ? avatar : (username[0] || '?').toUpperCase()}
      </div>
    );
  };

  return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>
      <div style={{ background:'var(--gradient-subtle)', padding:'2.5rem 1.5rem 3.5rem' }}>
        <div className="page-container">
          <h1 style={{ color:'#fff', fontSize:'1.6rem' }}>⚙️ Edit Profile</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.88rem' }}>Customise how others see you</p>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth:700, paddingTop:'1.5rem', paddingBottom:'4rem' }}>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.5rem' }}>
          {[['profile','👤 Profile'],['account','🔑 Account'],['privacy','🔒 Privacy']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:'0.7rem 1.25rem', background:'none', border:'none', cursor:'pointer',
                fontWeight:700, fontSize:'0.85rem',
                borderBottom: tab===id ? '2px solid var(--accent-main)' : '2px solid transparent',
                color: tab===id ? 'var(--accent-main)' : 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[180,48,48,120].map((h,i) => (
              <div key={i} className="skeleton" style={{ height:h, borderRadius:16 }} />
            ))}
          </div>
        ) : (
          <>
            {tab === 'profile' && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.75rem' }}>

                {/* ── Avatar picker ── */}
                <div style={{ marginBottom:'1.5rem' }}>
                  <label style={lbl}>Choose Avatar</label>

                  {/* Current avatar preview */}
                  <div style={{ display:'flex', alignItems:'center', gap:'0.85rem', marginBottom:'0.85rem' }}>
                    <AvatarPreview avatar={form.avatar} size={56} username={user?.username} />
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.85rem' }}>Current avatar</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:2 }}>
                        {form.avatar?.startsWith('http') ? 'Custom image' : 'Emoji'}
                      </div>
                    </div>
                  </div>

                  {/* Emoji presets */}
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem' }}>
                    {PRESET_AVATARS.map(a => (
                      <button key={a} onClick={() => setForm(f => ({...f, avatar:a}))}
                        style={{ width:44, height:44, borderRadius:'50%',
                          border:`2px solid ${form.avatar===a ? 'var(--accent-main)' : 'var(--border)'}`,
                          background: form.avatar===a ? 'rgba(233,69,96,0.1)' : 'var(--bg-elevated)',
                          fontSize:'1.3rem', cursor:'pointer', transition:'all 0.15s',
                          transform: form.avatar===a ? 'scale(1.18)' : 'scale(1)' }}>
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* Custom image upload */}
                  <div>
                    <label style={{ ...lbl, marginBottom:'0.4rem' }}>Or upload a custom image</label>
                    <div style={{ maxWidth:220 }}>
                      <CoverUploader onUploaded={(url) => setForm(f => ({...f, avatar:url}))} />
                    </div>
                  </div>
                </div>

                {/* ── Display name ── */}
                <div style={{ marginBottom:'1rem' }}>
                  <label style={lbl}>Display Name</label>
                  <input value={form.displayName}
                    onChange={e => setForm(f => ({...f, displayName:e.target.value}))}
                    placeholder={user?.username} maxLength={30} style={inp} />
                  <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:3 }}>{form.displayName.length}/30</div>
                </div>

                {/* ── Bio ── */}
                <div style={{ marginBottom:'1.25rem' }}>
                  <label style={lbl}>Bio</label>
                  <textarea value={form.bio}
                    onChange={e => setForm(f => ({...f, bio:e.target.value}))}
                    placeholder="Tell others about yourself…" rows={3} maxLength={200}
                    style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
                  <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:3 }}>{form.bio.length}/200</div>
                </div>

                {/* ── Favourite genres ── */}
                <div style={{ marginBottom:'1.5rem' }}>
                  <label style={lbl}>Favourite Genres</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'0.5rem' }}>
                    {GENRES_LIST.map(g => (
                      <button key={g} onClick={() => toggleGenre(g)}
                        style={{ padding:'0.3rem 0.85rem', borderRadius:20, fontSize:'0.8rem', fontWeight:600,
                          border:`1px solid ${form.favouriteGenres.includes(g) ? 'var(--accent-main)' : 'var(--border)'}`,
                          background: form.favouriteGenres.includes(g) ? 'var(--accent-main)' : 'transparent',
                          color: form.favouriteGenres.includes(g) ? '#fff' : 'var(--text-muted)', cursor:'pointer' }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={save} disabled={saving}
                  style={{ background:'var(--accent-main)', color:'#fff', border:'none',
                    padding:'0.7rem 2rem', borderRadius:10, fontWeight:700, fontSize:'0.9rem',
                    cursor:'pointer', opacity:saving?0.7:1 }}>
                  {saving ? 'Saving…' : '💾 Save Changes'}
                </button>
              </div>
            )}

            {tab === 'account' && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.75rem' }}>
                <h3 style={{ marginBottom:'1.25rem', fontSize:'1rem' }}>🔑 Account Settings</h3>
                <div style={{ padding:'1rem', background:'rgba(233,69,96,0.06)',
                  border:'1px solid rgba(233,69,96,0.2)', borderRadius:10,
                  fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
                  Username and email changes are managed by an admin. Contact us via the{' '}
                  <a href="/contact" style={{ color:'var(--accent-main)' }}>Contact page</a>.
                </div>
                <div style={{ marginBottom:'1rem' }}>
                  <label style={lbl}>Username (read-only)</label>
                  <input value={user?.username || ''} disabled style={{ ...inp, opacity:0.5 }} />
                </div>
                <div>
                  <label style={lbl}>Email (read-only)</label>
                  <input value={user?.email || ''} disabled style={{ ...inp, opacity:0.5 }} />
                </div>
              </div>
            )}

            {tab === 'privacy' && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.75rem' }}>
                <h3 style={{ marginBottom:'1.25rem', fontSize:'1rem' }}>🔒 Privacy & Safety</h3>
                <a href="/blocked-users" style={{ display:'block', background:'var(--bg-elevated)',
                  border:'1px solid var(--border)', borderRadius:10, padding:'1rem',
                  textDecoration:'none', color:'var(--text-primary)', marginBottom:'0.75rem',
                  fontWeight:600, fontSize:'0.88rem' }}>
                  🚫 Manage Blocked Users →
                </a>
                <a href="/notifications" style={{ display:'block', background:'var(--bg-elevated)',
                  border:'1px solid var(--border)', borderRadius:10, padding:'1rem',
                  textDecoration:'none', color:'var(--text-primary)', fontWeight:600, fontSize:'0.88rem' }}>
                  🔔 Notification Preferences →
                </a>
              </div>
            )}
          </>
        )}

        {/* Toast */}
        {toast.msg && (
          <div style={{ position:'fixed', bottom:'5rem', left:'50%', transform:'translateX(-50%)',
            background: toast.ok ? 'var(--bg-card)' : 'rgba(233,69,96,0.15)',
            border:`1px solid ${toast.ok ? 'var(--border)' : 'rgba(233,69,96,0.4)'}`,
            borderRadius:50, padding:'0.65rem 1.4rem', fontWeight:600,
            fontSize:'0.85rem', zIndex:9999, boxShadow:'0 8px 30px rgba(0,0,0,0.4)',
            whiteSpace:'nowrap', color: toast.ok ? 'var(--text-primary)' : '#f87171' }}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'0.3rem' };
const inp = { width:'100%', boxSizing:'border-box', background:'var(--bg-elevated)',
  border:'1px solid var(--border)', borderRadius:8, padding:'0.6rem 0.85rem',
  color:'var(--text-primary)', fontSize:'0.88rem', outline:'none', marginBottom:0 };
