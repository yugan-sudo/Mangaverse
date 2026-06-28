import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Fixed bottom navigation bar for mobile ──────────────────────────────
// Only visible on mobile (≤768px), hidden on desktop
export default function MobileBottomNav() {
  const { user, unreadCount } = useAuth();
  const location = useLocation();

  // Don't show on reader page (it has its own toolbar)
  if (location.pathname.includes('/chapter/')) return null;

  const active = (path) => {
    if (path === '/' ) return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const items = [
    { icon: '🏠', label: 'Home',    path: '/'              },
    { icon: '🔍', label: 'Browse',  path: '/browse'        },
    { icon: '📖', label: 'Library', path: '/bookmarks'     },
    { icon: '🔔', label: 'Alerts',  path: '/notifications',
      badge: unreadCount > 0 ? unreadCount : null },
    user
      ? { icon: '👤', label: 'Profile', path: `/user/${user.username}` }
      : { icon: '🚪', label: 'Login',   path: '/login' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 990,
      background: 'var(--bg-secondary)',
      boxShadow: '0 -1px 0 var(--border)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      height: 60,
      paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area
    }}
      className="mobile-bottom-nav"
    >
      {items.map(item => (
        <Link key={item.path} to={item.path}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', gap: 2, padding: '0.35rem 0',
            position: 'relative',
          }}>
          {/* Icon with optional badge */}
          <div style={{ position: 'relative', lineHeight: 1 }}>
            <span style={{
              fontSize: '1.25rem', lineHeight: 1,
              filter: active(item.path) ? 'none' : 'grayscale(0.6) opacity(0.6)',
              transition: 'filter 0.2s',
            }}>
              {item.icon}
            </span>
            {item.badge && (
              <span style={{
                position: 'absolute', top: -5, right: -8,
                background: 'var(--accent-main)', color: '#fff',
                borderRadius: '50%', fontSize: '0.52rem', fontWeight: 800,
                width: 15, height: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </div>
          {/* Label */}
          <span style={{
            fontSize: '0.58rem', fontWeight: 600, letterSpacing: 0.3,
            color: active(item.path) ? 'var(--accent-main)' : 'var(--text-dim)',
            transition: 'color 0.2s',
          }}>
            {item.label}
          </span>
          {/* Active dot indicator */}
          {active(item.path) && (
            <div style={{
              position: 'absolute', bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 20, height: 2, borderRadius: 2,
              background: 'var(--accent-main)',
            }} />
          )}
        </Link>
      ))}
    </nav>
  );
}
