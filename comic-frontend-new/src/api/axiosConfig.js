import axios from 'axios';

/**
 * Axios instance for all MangaVerse API calls.
 *
 * JWT is stored in an HttpOnly cookie — set by the backend on login.
 * The browser attaches it automatically on every same-origin or
 * credentialed cross-origin request.  We never read/write it in JS.
 *
 * withCredentials: true  →  required for the cookie to be sent when
 * the Vite dev-server proxies requests to the Spring Boot backend.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
});

// ── Global 401 handler ─────────────────────────────────────────────────────
// Rules:
//  1. Startup /auth/me call — AuthContext handles this itself; skip redirect.
//  2. Login/register calls — never redirect on their 401 (bad credentials).
//  3. Any other authenticated endpoint that returns 401 while the user
//     appears to be logged in → session expired → redirect to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url || '';

    const isAuthMeCall     = url.includes('/auth/me');
    const isAuthFormCall   = url.includes('/auth/login') || url.includes('/auth/register');
    const alreadyOnLogin   = window.location.pathname === '/login' ||
                             window.location.pathname === '/register';

    if (status === 401 && !isAuthMeCall && !isAuthFormCall && !alreadyOnLogin) {
      // Mid-session token expiry — clear and redirect once
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);

export default api;
