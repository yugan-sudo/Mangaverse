import { useState } from 'react';
import api from '../api/axiosConfig';
import useSEO from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = [
  { value: 'general',       label: '💬 General Enquiry'      },
  { value: 'content',       label: '📚 Content Issue'        },
  { value: 'bug',           label: '🐛 Bug Report'           },
  { value: 'account',       label: '👤 Account Problem'      },
  { value: 'partnership',   label: '🤝 Partnership'          },
  { value: 'dmca',          label: '⚖️ DMCA / Copyright'    },
  { value: 'other',         label: '📌 Other'               },
];

export default function Contact() {
  useSEO({ title: 'Contact — MangaVerse', description: 'Get in touch with the MangaVerse team.' });

  const { user } = useAuth();

  const [form, setForm] = useState({
    name:    user?.username || '',
    email:   user?.email    || '',
    subject: 'general',
    message: '',
  });
  const [status,     setStatus]     = useState('idle');
  const [toast,      setToast]      = useState(''); // idle | sending | success | error
  const [errorMsg,   setErrorMsg]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim())    return 'Name is required.';
    if (!form.email.trim())   return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email.';
    if (!form.message.trim()) return 'Message is required.';
    if (form.message.trim().length < 10) return 'Message must be at least 10 characters.';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setStatus('sending');
    try {
      await api.post('/contact', form);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const reset = () => {
    setForm({ name: user?.username || '', email: user?.email || '', subject: 'general', message: '' });
    setStatus('idle');
    setErrorMsg('');
    setToast('');
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        padding: '3.5rem 1.5rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(233,69,96,0.2) 0%, transparent 65%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📧</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '0.65rem' }}>
            Contact Us
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 440, margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.65 }}>
            We read every message and aim to respond within <strong style={{ color: '#fff' }}>24–48 hours</strong>. For quick answers check the <a href="/faq" style={{ color: 'var(--accent-main)' }}>FAQ</a> first.
          </p>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth: 1060, paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div className="two-col-sidebar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '2rem', }}>

            {status === 'success' ? (
              /* Success state */
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ marginBottom: '0.5rem' }}>Message Sent!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65, maxWidth: 360, margin: '0 auto 1.5rem' }}>
                  Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within 24–48 hours.
                </p>
                <button onClick={reset}
                  style={{ background: 'var(--accent-main)', color: '#fff', border: 'none',
                    padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Send a Message</h2>

                {/* Name + Email row */}
                <div className="contact-name-email-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0' }}>
                  <div>
                    <label style={labelStyle}>Your Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Jane Smith" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="jane@example.com" style={inputStyle} />
                  </div>
                </div>

                {/* Subject */}
                <label style={labelStyle}>Subject *</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {SUBJECTS.map(s => (
                    <button key={s.value} onClick={() => set('subject', s.value)}
                      style={{
                        padding: '0.35rem 0.85rem', borderRadius: 20, fontSize: '0.78rem',
                        fontWeight: 600, border: `1px solid ${form.subject === s.value ? 'transparent' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: form.subject === s.value ? 'var(--accent-main)' : 'var(--bg-elevated)',
                        color: form.subject === s.value ? '#fff' : 'var(--text-muted)',
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <label style={labelStyle}>Message *</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="Describe your issue or question in detail…"
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />

                {/* Error */}
                {errorMsg && (
                  <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)',
                    borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem',
                    color: 'var(--accent-main)', marginBottom: '1rem' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
                {status === 'error' && (
                  <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)',
                    borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem',
                    color: 'var(--accent-main)', marginBottom: '1rem' }}>
                    ❌ Failed to send. Please try again or email us directly.
                  </div>
                )}

                <button type="button" onClick={submit} disabled={status === 'sending'}
                  style={{
                    width: '100%', background: 'var(--accent-main)', color: '#fff', border: 'none',
                    padding: '0.75rem', borderRadius: 10, fontWeight: 700, fontSize: '0.92rem',
                    cursor: status === 'sending' ? 'default' : 'pointer',
                    opacity: status === 'sending' ? 0.75 : 1, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}>
                  {status === 'sending' ? (
                    <><Spinner /> Sending…</>
                  ) : '📤 Send Message'}
                </button>
              </>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="two-col-sidebar-aside" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: 120 }}>

            {/* Contact methods */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.2rem', fontWeight: 700, fontSize: '0.92rem',
                borderBottom: '1px solid var(--border)' }}>
                📬 Other Ways to Reach Us
              </div>
              {[
                { icon: '📧', label: 'Email',      value: 'support@mangaverse.com',  href: 'mailto:support@mangaverse.com' },
                { icon: '🎮', label: 'Discord',    value: 'discord.gg/mangaverse',   href: 'https://discord.gg' },
                { icon: '🐦', label: 'Twitter/X',  value: '@mangaverse',             href: 'https://twitter.com' },
                { icon: '💬', label: 'Community',  value: 'Ask the community',       href: '/community' },
              ].map(m => (
                <a key={m.label} href={m.href}
                  target={m.href.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  style={{ display: 'flex', gap: '0.75rem', alignItems: 'center',
                    padding: '0.85rem 1.2rem', borderBottom: '1px solid var(--border)',
                    textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.label}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--accent-main)', fontWeight: 600 }}>{m.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Response times */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.85rem' }}>⏱ Response Times</div>
              {[
                { type: 'General',     time: '24–48 hours', dot: '#22c55e' },
                { type: 'Bug Reports', time: '12–24 hours', dot: '#3b82f6' },
                { type: 'DMCA',        time: '48–72 hours', dot: '#f59e0b' },
                { type: 'Partnership', time: '3–5 business days', dot: '#8b5cf6' },
              ].map(r => (
                <div key={r.type} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.dot, display: 'inline-block', flexShrink: 0 }} />
                    {r.type}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.75rem' }}>{r.time}</span>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.85rem' }}>🔗 Quick Links</div>
              {[
                { icon: '❓', label: 'FAQ',           href: '/faq'           },
                { icon: '💬', label: 'Community',     href: '/community'     },
                { icon: '📢', label: 'Announcements', href: '/announcements' },
              ].map(l => (
                <a key={l.href} href={l.href}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0',
                    textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600,
                    color: 'var(--text-muted)', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-main)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <span>{l.icon}</span> {l.label} →
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.6s linear infinite' }} />
  );
}

const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600,
  display: 'block', marginBottom: '0.3rem' };

const inputStyle = { width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '0.6rem 0.85rem', color: 'var(--text-primary)',
  fontSize: '0.88rem', marginBottom: '0.85rem', outline: 'none' };
