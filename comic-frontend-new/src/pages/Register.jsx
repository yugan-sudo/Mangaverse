import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ username:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', form);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-split">

      {/* Branding panel — desktop only (auto-hidden below 900px via CSS) */}
      <div className="auth-split-brand">
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:'Bangers,cursive', fontSize:'2.6rem', letterSpacing:3,
            background:'linear-gradient(135deg,#fff,var(--accent-purple))',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'1.5rem' }}>
            MANGAVERSE
          </div>
          <h1 style={{ fontSize:'2.1rem', fontWeight:800, lineHeight:1.25, maxWidth:420,
            color:'#fff', marginBottom:'0.85rem' }}>
            Join thousands of readers — free, forever.
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.95rem', maxWidth:380, lineHeight:1.6 }}>
            Bookmark series, get notified on new chapters, and pick up exactly where you left off.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-split-form">
        <div className="auth-card">
          <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
            <div className="auth-title">Create account</div>
            <p className="auth-subtitle">Join and start reading for free</p>
          </div>

          {error && (
            <div style={{ background:'rgba(233,69,96,0.12)', border:'1px solid rgba(233,69,96,0.3)',
              borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem',
              fontSize:'0.85rem', color:'#e94560' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background:'rgba(56,176,96,0.12)', border:'1px solid rgba(56,176,96,0.3)',
              borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem',
              fontSize:'0.85rem', color:'#38b060' }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-form-group">
              <label>Username</label>
              <input name="username" value={form.username} onChange={handle}
                placeholder="Choose a username" required minLength={3} autoFocus autoComplete="username" />
            </div>
            <div className="auth-form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                placeholder="your@email.com" required autoComplete="email" />
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
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
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent-main)', fontWeight:700 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
