import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';

const BADGE_META = {
  FIRST_CHAPTER:  { icon:'📖', label:'First Chapter',    desc:'Read your very first chapter'         },
  READ_10:        { icon:'📗', label:'10 Chapters',       desc:'Read 10 chapters total'               },
  READ_50:        { icon:'📘', label:'50 Chapters',       desc:'Read 50 chapters total'               },
  READ_100:       { icon:'📙', label:'100 Chapters',      desc:'Read 100 chapters total'              },
  READ_500:       { icon:'🏆', label:'500 Chapters',      desc:'Read 500 chapters — legendary!'       },
  STREAK_7:       { icon:'🔥', label:'7-Day Streak',      desc:'Read 7 days in a row'                 },
  STREAK_30:      { icon:'🔥', label:'30-Day Streak',     desc:'Read every day for a month!'          },
  NIGHT_OWL:      { icon:'🦉', label:'Night Owl',         desc:'Read between 11 PM and 4 AM'          },
  FIRST_BOOKMARK: { icon:'🔖', label:'First Bookmark',    desc:'Bookmarked your first series'         },
  GENRE_EXPLORER: { icon:'🗺️', label:'Genre Explorer',  desc:'Read 5 different genres'              },
};

function timeAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

// FIX: shared avatar component — renders image URL, emoji, or letter initial.
function Avatar({ avatar, username, size = 72 }) {
  const isUrl   = avatar?.startsWith('http');
  const isEmoji = avatar && !isUrl && avatar.length <= 2;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg,#8b5cf6,#e94560)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: isEmoji ? size * 0.5 : size * 0.38,
      fontWeight:800, color:'#fff',
      border:'3px solid rgba(255,255,255,0.25)',
      boxShadow:'0 6px 24px rgba(0,0,0,0.4)',
      overflow:'hidden',
    }}>
      {isUrl
        ? <img src={avatar} alt={username} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : isEmoji ? avatar : (username?.[0] || '?').toUpperCase()}
    </div>
  );
}

export default function UserProfile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate     = useNavigate();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [blocked,   setBlocked]   = useState(false);
  const [tab,       setTab]       = useState('activity');
  const [toast,     setToast]     = useState('');

  useSEO({ title: username ? `${username}'s Profile` : 'Profile' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${username}`);
        setProfile(data);
        setFollowing(data.isFollowing);
        setFollowers(data.followers);
      } catch { setProfile(null); }
      setLoading(false);
    };
    load();
  }, [username]);

  useEffect(() => {
    if (!me || me.username === username) return;
    api.get('/me/blocked').then(({ data }) => {
      setBlocked(Array.isArray(data) && data.some(b => b.username === username));
    }).catch(() => {});
  }, [me, username]);

  const toggleBlock = async () => {
    if (!me) { navigate('/login'); return; }
    try {
      if (blocked) {
        await api.delete(`/me/blocked/${username}`);
        setBlocked(false); setToast(`Unblocked ${username}`);
      } else {
        await api.post(`/me/blocked/${username}`);
        setBlocked(true); setToast(`Blocked ${username}`);
      }
      setTimeout(() => setToast(''), 3000);
    } catch {}
  };

  const toggleFollow = async () => {
    if (!me) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/users/${username}/follow`);
      setFollowing(data.following); setFollowers(data.followers);
      setToast(data.following ? `Following ${username}` : `Unfollowed ${username}`);
      setTimeout(() => setToast(''), 2500);
    } catch { setToast('Failed to update'); setTimeout(() => setToast(''), 2000); }
  };

  if (loading) return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>
      <div style={{ height:260, background:'linear-gradient(135deg,#1a1a3e 0%,#2d1b69 100%)' }} />
      <div className="page-container" style={{ marginTop:'-2rem' }}>
        <div className="skeleton" style={{ height:72, borderRadius:12, marginBottom:'1rem' }} />
        <div className="skeleton" style={{ height:180, borderRadius:12 }} />
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign:'center', padding:'6rem 2rem', color:'var(--text-dim)' }}>
      <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>👤</div>
      <h2>User not found</h2>
    </div>
  );

  const isMe = me?.username === username;
  const stats = [
    { label:'Followers',  value:followers            },
    { label:'Following',  value:profile.following    },
    { label:'Bookmarks',  value:profile.bookmarkCount},
    { label:'Ch. Read',   value:profile.chaptersRead },
  ];

  return (
    <div style={{ background:'var(--bg-primary)', minHeight:'100vh' }}>

      {/* ── HERO ── */}
      <div style={{ background:'linear-gradient(160deg,#1a1a3e 0%,#2d1b69 55%,#1a1a3e 100%)',
        padding:'0 0 3.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse at 60% 0%,rgba(139,92,246,0.3) 0%,transparent 65%)' }} />

        <div className="page-container" style={{ position:'relative', zIndex:1, paddingTop:'1.25rem' }}>

          <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,0.1)',
            border:'1px solid rgba(255,255,255,0.18)', color:'#fff', borderRadius:8,
            padding:'0.35rem 0.9rem', fontSize:'0.78rem', cursor:'pointer',
            marginBottom:'1.5rem', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>
            ← Back
          </button>

          {/* Avatar + name row */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem' }}>

            {/* FIX: render the user's actual saved avatar */}
            <Avatar avatar={profile.avatar} username={username} size={72} />

            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ color:'#fff', fontSize:'clamp(1.2rem,5vw,1.7rem)',
                fontWeight:800, marginBottom:'0.15rem', lineHeight:1.2 }}>
                {profile.displayName || username}
              </h1>
              {profile.joinedAt && (
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.72rem' }}>
                  Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month:'short', year:'numeric' })}
                </div>
              )}
              {profile.bio && (
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.78rem', marginTop:'0.3rem',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>
                  {profile.bio}
                </div>
              )}
            </div>

            {/* Follow / Edit buttons */}
            {!isMe ? (
              <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                <button onClick={toggleFollow} style={{ flexShrink:0,
                  background: following ? 'rgba(255,255,255,0.12)' : 'var(--accent-main)',
                  color:'#fff', border: following ? '1px solid rgba(255,255,255,0.25)' : 'none',
                  padding:'0.5rem 1.1rem', borderRadius:50, fontWeight:700,
                  fontSize:'0.82rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {following ? '✓ Following' : '+ Follow'}
                </button>
                <button onClick={toggleBlock} title={blocked ? 'Unblock user' : 'Block user'} style={{
                  flexShrink:0,
                  background: blocked ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
                  color:'#fff', border: blocked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  padding:'0.5rem 1.1rem', borderRadius:50, fontWeight:700,
                  fontSize:'0.82rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {blocked ? '✓ Blocked' : '🚫 Block'}
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/edit-profile')} style={{ flexShrink:0,
                background:'rgba(255,255,255,0.1)', color:'#fff',
                border:'1px solid rgba(255,255,255,0.2)', padding:'0.5rem 1rem',
                borderRadius:50, fontWeight:600, fontSize:'0.78rem',
                cursor:'pointer', whiteSpace:'nowrap' }}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem',
            background:'rgba(0,0,0,0.2)', borderRadius:12, padding:'0.85rem 0.5rem',
            border:'1px solid rgba(255,255,255,0.07)' }}>
            {stats.map((s,i) => (
              <div key={s.label} style={{ textAlign:'center',
                borderRight: i < stats.length-1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                padding:'0 0.25rem' }}>
                <div style={{ color:'#fff', fontWeight:800, fontSize:'clamp(1rem,4vw,1.25rem)', lineHeight:1 }}>
                  {s.value ?? 0}
                </div>
                <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'clamp(0.58rem,2vw,0.65rem)',
                  textTransform:'uppercase', letterSpacing:0.4, marginTop:'0.25rem' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STREAK CARD ── */}
      {(profile.currentStreak > 0 || profile.longestStreak > 0) && (
        <div className="page-container" style={{ marginTop:'-1.75rem', position:'relative', zIndex:10 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
            padding:'0.9rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem',
            boxShadow:'0 8px 32px rgba(0,0,0,0.25)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1 }}>
              <span style={{ fontSize:'1.4rem' }}>🔥</span>
              <div>
                <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#f97316', lineHeight:1 }}>
                  {profile.currentStreak} day{profile.currentStreak !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize:'0.62rem', color:'var(--text-dim)', fontWeight:600,
                  textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>Current Streak</div>
              </div>
            </div>
            <div style={{ width:1, height:32, background:'var(--border)', flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'1rem', lineHeight:1 }}>
                {profile.longestStreak} day{profile.longestStreak !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-dim)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>Best Streak</div>
            </div>
            <div style={{ flexShrink:0, display:'flex', gap:4 }}>
              {[1,2,3,4,5,6,7].map(d => (
                <div key={d} style={{ width:6, height:20, borderRadius:3, transition:'background 0.3s',
                  background: d <= (profile.currentStreak % 7 || (profile.currentStreak > 0 ? 7 : 0))
                    ? '#f97316' : 'var(--border)' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="page-container" style={{ paddingTop:'1.25rem', paddingBottom:'5rem' }}>
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.25rem' }}>
          {[['activity','🕐 Activity'],['badges','🏅 Badges']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'0.7rem 0',
              background:'none', border:'none', fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
              borderBottom: tab===id ? '2px solid var(--accent-main)' : '2px solid transparent',
              color: tab===id ? 'var(--accent-main)' : 'var(--text-muted)', transition:'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'activity' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.6rem' }}>
            {(profile.recentActivity || []).length === 0 ? (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem 1rem', color:'var(--text-dim)' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📭</div>
                <div style={{ fontWeight:600 }}>No reading activity yet</div>
                <div style={{ fontSize:'0.78rem', marginTop:'0.35rem' }}>Start reading to track progress here</div>
              </div>
            ) : (profile.recentActivity || []).map((item,i) => (
              <Link key={i} to={`/comic/${item.comicId}/chapter/${item.lastChapter}`}
                style={{ textDecoration:'none' }}>
                <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                  borderRadius:10, overflow:'hidden', transition:'transform 0.2s,border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor='var(--accent-main)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='var(--border)'; }}>
                  <div style={{ aspectRatio:'2/3', overflow:'hidden' }}>
                    <img src={item.comicCover || `https://picsum.photos/seed/${item.comicId}/200/300`}
                      alt={item.comicTitle}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy" />
                  </div>
                  <div style={{ padding:'0.4rem 0.45rem' }}>
                    <div style={{ fontWeight:700, fontSize:'0.7rem', lineHeight:1.3,
                      display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {item.comicTitle}
                    </div>
                    <div style={{ fontSize:'0.62rem', color:'var(--text-dim)', marginTop:2,
                      display:'flex', justifyContent:'space-between' }}>
                      <span>Ch.{item.lastChapter}</span>
                      <span>{timeAgo(item.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'badges' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'0.75rem' }}>
            {(profile.badges || []).map(b => {
              const meta = BADGE_META[b.key] || { icon:'🎖️', label:b.key, desc:'' };
              return (
                <div key={b.key} style={{ background:'var(--bg-card)', borderRadius:14, padding:'1rem 0.75rem',
                  textAlign:'center', border:'1px solid var(--border)', borderTop:'3px solid var(--accent-main)',
                  boxShadow:'0 2px 12px rgba(233,69,96,0.08)' }}
                  title={`Earned ${b.earnedAt ? new Date(b.earnedAt).toLocaleDateString() : ''}`}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.4rem' }}>{meta.icon}</div>
                  <div style={{ fontWeight:700, fontSize:'0.78rem', marginBottom:'0.2rem' }}>{meta.label}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-dim)', lineHeight:1.4 }}>{meta.desc}</div>
                </div>
              );
            })}
            {Object.entries(BADGE_META)
              .filter(([k]) => !(profile.badges || []).find(b => b.key === k))
              .map(([k,meta]) => (
                <div key={k} style={{ background:'var(--bg-card)', borderRadius:14, padding:'1rem 0.75rem',
                  textAlign:'center', border:'1px solid var(--border)', opacity:0.38 }}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.4rem', filter:'grayscale(1)' }}>{meta.icon}</div>
                  <div style={{ fontWeight:700, fontSize:'0.78rem', marginBottom:'0.2rem' }}>{meta.label}</div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-dim)', marginTop:'0.3rem' }}>🔒 Locked</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:'5rem', left:'50%', transform:'translateX(-50%)',
          background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:50,
          padding:'0.65rem 1.4rem', fontWeight:600, fontSize:'0.85rem', zIndex:9999,
          boxShadow:'0 8px 30px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
