import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SearchSuggestions from './SearchSuggestions';

function NavAvatar({ avatar, username, size = 42 }) {
  const isUrl   = avatar?.startsWith('http');
  const isEmoji = avatar && !isUrl && avatar.length <= 2;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: isEmoji ? size * 0.52 : size * 0.38,
      fontWeight: 800, color: '#fff', overflow: 'hidden',
    }}>
      {isUrl
        ? <img src={avatar} alt={username}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        : isEmoji ? avatar : (username?.[0] || '?').toUpperCase()}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate     = useNavigate();
  const menuRef      = useRef(null);
  const resourcesRef = useRef(null);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [isMobile,      setIsMobile]      = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current      && !menuRef.current.contains(e.target))      setMenuOpen(false);
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) setResourcesOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (path) => {
    setMenuOpen(false); setMobileOpen(false); setResourcesOpen(false);
    navigate(path);
  };

  const resourcesItems = [
    { icon: '📅', label: 'Release Calendar', path: '/calendar'      },
    { icon: '📢', label: 'Announcements',    path: '/announcements' },
    { icon: '❓', label: 'FAQ',              path: '/faq'           },
    { icon: '💬', label: 'Community',        path: '/community'     },
    { icon: '📧', label: 'Contact',          path: '/contact'       },
  ];

  const userMenuItems = [
    { icon: '👤', label: 'My Profile',    path: `/user/${user?.username || ''}` },
    { icon: '✏️', label: 'Edit Profile',  path: '/edit-profile'                 },
    { icon: '📖', label: 'Library',       path: '/bookmarks'                    },
    { icon: '🕐', label: 'History',       path: '/history'                      },
    { icon: '📂', label: 'Lists',         path: '/lists'                        },
    { icon: '🔔', label: 'Notifications', path: '/notifications', badge: unreadCount > 0 ? unreadCount : null },
    { icon: '⚙️', label: 'Preferences',  path: '/preferences'                  },
  ];

  const dropBg     = 'var(--bg-card)';
  const dropBorder = 'var(--border)';
  const dropText   = 'var(--text-primary)';
  const dropMuted  = 'var(--text-muted)';
  const dropHover  = 'var(--bg-elevated)';

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '0 1rem',
        gap: '1rem', height: 64, position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 1000,
        background: 'linear-gradient(90deg,#8b5cf6 0%,#7c3aed 100%)',
      }}>

        {/* Brand */}
        <Link to="/" style={{
          flexShrink: 0, width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.3rem', color: '#fff',
          textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)',
        }}>
          👻
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <ul style={{ display:'flex', alignItems:'center', gap:'1.5rem',
            listStyle:'none', margin:0, padding:0, flexShrink:0 }}>
            <li><NavBtn label="Home"      onClick={() => go('/')}         /></li>
            <li><NavBtn label="Bookmarks" onClick={() => go('/bookmarks')} /></li>
            <li><NavBtn label="Browse"    onClick={() => go('/browse')}    /></li>
            <li style={{ position:'relative' }} ref={resourcesRef}>
              <button onClick={() => setResourcesOpen(o => !o)}
                aria-expanded={resourcesOpen} aria-haspopup="true"
                style={{ background:'none', border:'none', color:'#fff', fontWeight:600,
                  fontSize:'0.95rem', cursor:'pointer', display:'flex', alignItems:'center',
                  gap:'0.35rem', padding:'0.4rem 0.2rem' }}>
                Resources
                <span style={{ fontSize:'0.65rem', transition:'transform 0.2s',
                  transform: resourcesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              {resourcesOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:9999,
                  background:dropBg, border:`1px solid ${dropBorder}`,
                  borderRadius:12, padding:'0.4rem', minWidth:200,
                  boxShadow:'0 12px 40px rgba(0,0,0,0.35)' }}>
                  {resourcesItems.map(item => (
                    <DropItem key={item.path} icon={item.icon} label={item.label}
                      onClick={() => go(item.path)} textColor={dropText} hoverBg={dropHover} />
                  ))}
                </div>
              )}
            </li>
          </ul>
        )}

        <div style={{ flex:1 }} />

        {!isMobile && (
          <SearchSuggestions style={{ width:280, flexShrink:0 }} placeholder="Search…" />
        )}

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>

          {/* Notification bell — desktop only; mobile shows in drawer */}
          {!isMobile && user && unreadCount > 0 && (
            <button onClick={() => navigate('/notifications')}
              style={{ position:'relative', background:'none', border:'none', cursor:'pointer',
                padding:'0.25rem', color:'#fff', fontSize:'1.1rem', flexShrink:0 }}>
              🔔
              <span style={{ position:'absolute', top:0, right:0,
                background:'var(--accent-main)', color:'#fff', borderRadius:'50%',
                width:16, height:16, fontSize:'0.55rem', fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </button>
          )}

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:'50%', width:36, height:36, fontSize:'1rem', cursor:'pointer',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0 }}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {!user ? (
            <Link to="/login">
              <button style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.3)',
                color:'#fff', fontWeight:700, fontSize:'0.88rem', cursor:'pointer',
                padding:'0.45rem 1rem', borderRadius:8 }}>
                🚪 Log In
              </button>
            </Link>
          ) : (
            <>
              {/* Profile button — desktop: opens dropdown; mobile: opens drawer */}
              {!isMobile ? (
                <div ref={menuRef} style={{ position:'relative' }}>
                  <button onClick={() => setMenuOpen(o => !o)}
                    aria-label="Open profile menu"
                    style={{ width:42, height:42, borderRadius:'50%', padding:0,
                      border:`2px solid ${menuOpen ? '#fff' : 'rgba(255,255,255,0.35)'}`,
                      cursor:'pointer', flexShrink:0, background:'rgba(0,0,0,0.3)',
                      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    <NavAvatar avatar={user.avatar} username={user.username} size={42} />
                  </button>

                  {menuOpen && (
                    <div style={{ position:'fixed', top:72, right:16, zIndex:9999,
                      background:dropBg, border:`1px solid ${dropBorder}`,
                      borderRadius:14, padding:'0.4rem', minWidth:240,
                      boxShadow:'0 12px 50px rgba(0,0,0,0.4)' }}>
                      <div style={{ padding:'0.75rem 1rem 0.8rem',
                        borderBottom:`1px solid ${dropBorder}`, marginBottom:'0.3rem',
                        display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <NavAvatar avatar={user.avatar} username={user.username} size={36} />
                        <div>
                          <div style={{ fontWeight:700, color:dropText, fontSize:'0.95rem' }}>
                            {user.displayName || user.username}
                          </div>
                          <div style={{ fontSize:'0.7rem', color:dropMuted,
                            textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>
                            {user.role}
                          </div>
                        </div>
                      </div>
                      {userMenuItems.map(item => (
                        <DropItem key={item.path} icon={item.icon} label={item.label}
                          onClick={() => go(item.path)}
                          textColor={dropText} hoverBg={dropHover}
                          badge={item.path === '/notifications' && unreadCount > 0 ? unreadCount : null} />
                      ))}
                      {user.role === 'ADMIN' && (
                        <DropItem icon="🛡️" label="Admin Panel"
                          onClick={() => go('/admin')}
                          textColor="var(--accent-main)" hoverBg="rgba(233,69,96,0.1)" bold />
                      )}
                      <div style={{ borderTop:`1px solid ${dropBorder}`, marginTop:'0.3rem', paddingTop:'0.3rem' }}>
                        <DropItem icon="🌙" label={isDark ? 'Light Mode' : 'Dark Mode'}
                          onClick={() => { toggleTheme(); setMenuOpen(false); }}
                          textColor={dropText} hoverBg={dropHover} />
                        <DropItem icon="🚪" label="Logout"
                          onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                          textColor="var(--accent-main)" hoverBg="rgba(233,69,96,0.1)" bold />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Mobile: show avatar button that opens the drawer */
                <button onClick={() => setMobileOpen(o => !o)}
                  style={{ width:38, height:38, borderRadius:'50%', padding:0,
                    border:'2px solid rgba(255,255,255,0.4)', cursor:'pointer',
                    background:'rgba(0,0,0,0.3)',
                    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  <NavAvatar avatar={user.avatar} username={user.username} size={38} />
                </button>
              )}
            </>
          )}

          {/* Mobile hamburger — only shown when NOT logged in on mobile */}
          {isMobile && !user && (
            <button onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{ background:'none', border:'none', color:'#fff',
                fontSize:'1.4rem', cursor:'pointer', padding:'0.25rem' }}>
              {mobileOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && isMobile && (
        <>
          {/* Backdrop */}
          <div onClick={() => setMobileOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:994, background:'rgba(0,0,0,0.4)' }} />

          {/* Drawer panel — slides in from the right */}
          <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:995,
            width: Math.min(300, window.innerWidth * 0.85),
            background:'linear-gradient(180deg,#7c3aed 0%,#5b21b6 100%)',
            display:'flex', flexDirection:'column', overflowY:'auto',
            boxShadow:'-8px 0 32px rgba(0,0,0,0.4)' }}>

            {/* Drawer header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'0.85rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontFamily:'Bangers,cursive', fontSize:'1.2rem', letterSpacing:2, color:'#fff' }}>
                MANGAVERSE
              </span>
              <button onClick={() => setMobileOpen(false)}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
                  width:32, height:32, borderRadius:'50%', cursor:'pointer',
                  fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                ✕
              </button>
            </div>

            {/* User account section — shown at top of drawer when logged in */}
            {user && (
              <div style={{ padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
                {/* Account card */}
                <div style={{ display:'flex', alignItems:'center', gap:'0.85rem',
                  background:'rgba(0,0,0,0.2)', borderRadius:12, padding:'0.85rem' }}>
                  <NavAvatar avatar={user.avatar} username={user.username} size={46} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:'0.95rem',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {user.displayName || user.username}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.7rem',
                      textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>
                      {user.role}
                      {unreadCount > 0 && (
                        <span style={{ marginLeft:8, background:'#e94560', color:'#fff',
                          borderRadius:20, fontSize:'0.6rem', padding:'0.1rem 0.45rem', fontWeight:800 }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account quick links */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', marginTop:'0.65rem' }}>
                  {[
                    { icon:'👤', label:'Profile',       path:`/user/${user.username}` },
                    { icon:'✏️', label:'Edit Profile',  path:'/edit-profile'          },
                    { icon:'🔔', label:'Notifications', path:'/notifications'         },
                    { icon:'⚙️', label:'Preferences',  path:'/preferences'           },
                  ].map(item => (
                    <button key={item.path} onClick={() => go(item.path)}
                      style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:8, padding:'0.5rem 0.4rem', cursor:'pointer',
                        color:'#fff', fontSize:'0.75rem', fontWeight:600,
                        display:'flex', alignItems:'center', gap:'0.35rem' }}>
                      <span>{item.icon}</span><span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {user.role === 'ADMIN' && (
                  <button onClick={() => go('/admin')}
                    style={{ width:'100%', marginTop:'0.4rem',
                      background:'rgba(233,69,96,0.25)', border:'1px solid rgba(233,69,96,0.4)',
                      borderRadius:8, padding:'0.5rem', cursor:'pointer',
                      color:'#fff', fontSize:'0.8rem', fontWeight:700 }}>
                    🛡️ Admin Panel
                  </button>
                )}
              </div>
            )}

            {/* Nav links */}
            <div style={{ padding:'0.5rem 0.75rem', flex:1 }}>
              {[
                { icon:'🏠', label:'Home',             path:'/'              },
                { icon:'📚', label:'Bookmarks',        path:'/bookmarks'     },
                { icon:'🔍', label:'Browse',           path:'/browse'        },
                { icon:'📅', label:'Release Calendar', path:'/calendar'      },
                { icon:'📢', label:'Announcements',    path:'/announcements' },
                { icon:'❓', label:'FAQ',              path:'/faq'           },
                { icon:'💬', label:'Community',        path:'/community'     },
              ].map(item => (
                <div key={item.path} onClick={() => go(item.path)}
                  style={{ padding:'0.75rem 0.6rem', color:'#fff', fontWeight:600,
                    fontSize:'0.88rem', cursor:'pointer', borderRadius:8,
                    display:'flex', alignItems:'center', gap:'0.65rem',
                    transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:'1rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Drawer footer */}
            <div style={{ padding:'0.75rem 1rem', borderTop:'1px solid rgba(255,255,255,0.15)',
              display:'flex', gap:'0.5rem' }}>
              <button onClick={() => { toggleTheme(); }}
                style={{ flex:1, background:'rgba(255,255,255,0.12)', border:'none',
                  borderRadius:8, padding:'0.6rem', cursor:'pointer',
                  color:'#fff', fontSize:'0.82rem', fontWeight:600 }}>
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </button>
              {user ? (
                <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                  style={{ flex:1, background:'rgba(233,69,96,0.2)', border:'1px solid rgba(233,69,96,0.35)',
                    borderRadius:8, padding:'0.6rem', cursor:'pointer',
                    color:'#fff', fontSize:'0.82rem', fontWeight:700 }}>
                  🚪 Logout
                </button>
              ) : (
                <button onClick={() => go('/login')}
                  style={{ flex:1, background:'rgba(255,255,255,0.15)', border:'none',
                    borderRadius:8, padding:'0.6rem', cursor:'pointer',
                    color:'#fff', fontSize:'0.82rem', fontWeight:700 }}>
                  🚪 Log In
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:'none', border:'none', color:'#fff', fontWeight:600,
        fontSize:'0.95rem', cursor:'pointer', padding:'0.4rem 0.2rem' }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      {label}
    </button>
  );
}

function DropItem({ icon, label, onClick, textColor, hoverBg, bold, badge }) {
  return (
    <div onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'0.65rem',
        padding:'0.65rem 1rem', borderRadius:8, cursor:'pointer',
        fontSize:'0.88rem', color:textColor || 'var(--text-primary)',
        fontWeight:bold ? 700 : 600, transition:'background 0.15s',
        justifyContent:'space-between' }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg || 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      {badge && (
        <span style={{ background:'var(--accent-main)', color:'#fff',
          borderRadius:10, fontSize:'0.65rem', fontWeight:800,
          padding:'0.1rem 0.45rem', minWidth:18, textAlign:'center' }}>
          {badge}
        </span>
      )}
    </div>
  );
}
