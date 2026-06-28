import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // useAuth() is safe here because AuthProvider wraps ThemeProvider in App.jsx
  const auth = useAuth();
  const user = auth?.user ?? null;

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Apply theme to DOM + localStorage on every change
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // When user logs in, fetch their saved theme preference from backend
  useEffect(() => {
    if (!user) return;
    api.get('/me/theme').then(({ data }) => {
      if (data.theme && data.theme !== theme) {
        setTheme(data.theme);
      }
    }).catch(() => {});
  }, [user?.username]);

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Persist to backend if logged in (fire and forget)
    if (user) {
      api.put('/me/theme', { theme: next }).catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
