import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext(null);

function isValidUser(u) {
  return u && typeof u === 'object' && typeof u.username === 'string' && u.username.length > 0;
}

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Prevent double-call in React StrictMode (dev only) — useRef persists across
  // the double-mount but doesn't trigger re-renders.
  const startupDone = useRef(false);

  // ── Startup: validate the cookie against the server ─────────────────────
  // /api/auth/me returns the full user object if the cookie is valid,
  // or 401 if it is missing / expired / revoked.
  // We catch the 401 silently — being unauthenticated is normal on first visit.
  useEffect(() => {
    if (startupDone.current) return;
    startupDone.current = true;

    api.get('/auth/me')
      .then(({ data }) => {
        if (isValidUser(data)) setUser(data);
        else                   setUser(null);
      })
      .catch(() => {
        // 401 = no valid session — stay unauthenticated, do NOT redirect here
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Re-fetch the user from the server (after profile edits, etc.) ────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (isValidUser(data)) { setUser(data); return data; }
      setUser(null); return null;
    } catch {
      setUser(null); return null;
    }
  }, []);

  // ── Update a subset of user fields locally (optimistic, no round-trip) ───
  // Used by EditProfile after a successful save so the Navbar avatar updates instantly.
  const updateUser = useCallback((patch) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  // ── Unread notification badge ────────────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count || 0);
    } catch { setUnreadCount(0); }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    fetchUnread();
    
    let timerId;
    const tick = async () => {
      await fetchUnread();
      timerId = setTimeout(tick, 30000);
    };
    
    timerId = setTimeout(tick, 30000);
    
    return () => clearTimeout(timerId);
  }, [user, fetchUnread]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  // login() is called after a successful POST /auth/login.
  // The backend sets the HttpOnly cookie — we just store the user data in state.
  const login = useCallback((userData) => {
    if (isValidUser(userData)) setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    setUnreadCount(0);
    // Redirect to home so protected pages dismount cleanly
    window.location.replace('/');
  }, []);

  const isAdmin = () => user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout,
      refreshUser, updateUser,
      isAdmin,
      unreadCount, fetchUnread,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
