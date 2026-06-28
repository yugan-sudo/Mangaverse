import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ username:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // POST /auth/login — backend sets HttpOnly jwt cookie AND returns full user object
      const { data } = await api.post('/auth/login', form);
      // data: { username, role, email, avatar, displayName }
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-split">

      {/* Branding panel — desktop only (auto-hidden below 900px via CSS) */}
      <div className="auth-split-brand">
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:'Bangers,cursive', fontSize:'2.6rem', letterSpacing:3,
            background:'linear-gradient(135deg,#fff,var(--accent-main))',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'1.5rem' }}>
            MANGAVERSE
          </div>
          <h1 style={{ fontSize:'2.1rem', fontWeight:800, lineHeight:1.25, maxWidth:420,
            color:'#fff', marginBottom:'0.85rem' }}>
            Thousands of stories.<br />One reading home.
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.95rem', maxWidth:380, lineHeight:1.6 }}>
            Track progress, follow creators, and never lose your place — across every device.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-split-form">
        <div className="auth-card">
          <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
            <div className="auth-title">Welcome back</div>
            <p className="auth-subtitle">Sign in to continue reading</p>
          </div>

          {error && (
            <div style={{ background:'rgba(233,69,96,0.12)', border:'1px solid rgba(233,69,96,0.3)',
              borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem',
              fontSize:'0.85rem', color:'#e94560' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-form-group">
              <label>Username</label>
              <input name="username" value={form.username} onChange={handle}
                placeholder="Enter your username" required autoFocus autoComplete="username" />
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                placeholder="Enter your password" required autoComplete="current-password" />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            <span style={{ padding: '0 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>

          <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/oauth2/authorization/google`}
             className="auth-btn" 
             style={{ background: '#fff', color: '#333', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: 18, height: 18 }} />
            Continue with Google
          </a>

          <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.85rem', color:'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--accent-main)', fontWeight:700 }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
