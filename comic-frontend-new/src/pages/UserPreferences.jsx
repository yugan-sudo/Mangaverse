import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Keys used to store preferences in localStorage
const PREF_KEY = 'user_preferences';

// Load saved preferences (or return defaults)
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY)) || {};
  } catch { return {}; }
}

export default function UserPreferences() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  // Load preferences from localStorage
  const saved = loadPrefs();
  const [prefs, setPrefs] = useState({
    fontSize:        saved.fontSize        || 'medium',  // small / medium / large
    readingMode:     saved.readingMode     || 'scroll',  // scroll / page
    notifications:   saved.notifications   !== false,    // default on
    autoBookmark:    saved.autoBookmark    || false,
    language:        saved.language        || 'en',
    contentFilter:   saved.contentFilter   || 'all',
  });
  const [saved2, setSaved2] = useState(false); // shows "Saved!" confirmation

  // Update one preference field
  const update = (key, value) => setPrefs(p => ({ ...p, [key]: value }));

  // Save all preferences to localStorage
  const save = () => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));

    // Apply font size preference immediately to the whole app
    const sizes = { small:'14px', medium:'16px', large:'18px' };
    document.documentElement.style.fontSize = sizes[prefs.fontSize];

    setSaved2(true);
    setTimeout(() => setSaved2(false), 2000);
  };

  // ─── Reusable toggle switch ─────────────────────────────────────────────
  const Toggle = ({ value, onChange, label, description }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'1rem', background:'var(--bg-elevated)', borderRadius:10,
      border:'1px solid var(--border)', marginBottom:'0.6rem' }}>
      <div>
        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{label}</div>
        {description && <div style={{ fontSize:'0.76rem', color:'var(--text-dim)', marginTop:2 }}>{description}</div>}
      </div>
      {/* Toggle button */}
      <button type="button" role="switch" aria-checked={value} aria-label={label}
        onClick={() => onChange(!value)}
        style={{
          width:44, height:24, borderRadius:12, cursor:'pointer',
          background: value ? '#4361ee' : 'var(--border)',
          position:'relative', transition:'background 0.2s', flexShrink:0,
          border:'none', padding:0,
        }}>
        <span aria-hidden="true" style={{
          position:'absolute', top:3, borderRadius:'50%',
          width:18, height:18, background:'#fff',
          left: value ? 23 : 3, transition:'left 0.2s',
        }} />
      </button>
    </div>
  );

  // ─── Reusable option selector (row of buttons) ──────────────────────────
  const Options = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom:'0.6rem' }}>
      <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'0.4rem',
        fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
        {options.map(opt => (
          <button key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            style={{
              padding:'0.45rem 1rem', borderRadius:20, fontSize:'0.82rem',
              cursor:'pointer', fontWeight:600, border:'none',
              background: value === opt.value ? '#4361ee' : 'var(--bg-elevated)',
              color: value === opt.value ? '#fff' : 'var(--text-muted)',
              transition:'all 0.15s',
            }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth:680 }}>
      <h1 style={{ fontSize:'1.5rem', marginBottom:'0.4rem' }}>⚙️ Preferences</h1>
      <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'2rem' }}>
        Customize your reading experience. Settings are saved in your browser.
      </p>

      {/* ── Appearance ──────────────────────────────────────────────────── */}
      <section style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'0.78rem', color:'var(--text-dim)', textTransform:'uppercase',
          letterSpacing:2, marginBottom:'0.75rem' }}>APPEARANCE</h2>

        {/* Dark / Light mode toggle */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'1rem', background:'var(--bg-elevated)', borderRadius:10,
          border:'1px solid var(--border)', marginBottom:'0.6rem' }}>
          <div>
            <div style={{ fontWeight:600, fontSize:'0.9rem' }}>
              {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </div>
            <div style={{ fontSize:'0.76rem', color:'var(--text-dim)', marginTop:2 }}>
              Theme saved automatically
            </div>
          </div>
          <button type="button" role="switch" aria-checked={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            style={{
              width:44, height:24, borderRadius:12, cursor:'pointer',
              background: isDark ? '#4361ee' : '#f0c040',
              position:'relative', transition:'background 0.2s', flexShrink:0,
              border:'none', padding:0,
            }}>
            <span aria-hidden="true" style={{
              position:'absolute', top:3, borderRadius:'50%',
              width:18, height:18, background:'#fff',
              left: isDark ? 23 : 3, transition:'left 0.2s',
            }} />
          </button>
        </div>

        <Options
          label="Font Size"
          value={prefs.fontSize}
          onChange={v => update('fontSize', v)}
          options={[
            { value:'small',  label:'Small'  },
            { value:'medium', label:'Medium' },
            { value:'large',  label:'Large'  },
          ]}
        />
      </section>

      {/* ── Reading ──────────────────────────────────────────────────────── */}
      <section style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'0.78rem', color:'var(--text-dim)', textTransform:'uppercase',
          letterSpacing:2, marginBottom:'0.75rem' }}>READING</h2>

        <Options
          label="Reading Mode"
          value={prefs.readingMode}
          onChange={v => update('readingMode', v)}
          options={[
            { value:'scroll', label:'📜 Scroll (Webtoon)' },
            { value:'page',   label:'📖 Page by Page'     },
          ]}
        />

        <Toggle
          label="Auto-bookmark on read"
          description="Automatically bookmark a comic when you start reading"
          value={prefs.autoBookmark}
          onChange={v => update('autoBookmark', v)}
        />
      </section>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <section style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'0.78rem', color:'var(--text-dim)', textTransform:'uppercase',
          letterSpacing:2, marginBottom:'0.75rem' }}>NOTIFICATIONS</h2>

        <Toggle
          label="New chapter alerts"
          description="Get notified when a bookmarked comic gets a new chapter"
          value={prefs.notifications}
          onChange={v => update('notifications', v)}
        />
      </section>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'0.78rem', color:'var(--text-dim)', textTransform:'uppercase',
          letterSpacing:2, marginBottom:'0.75rem' }}>CONTENT</h2>

        <Options
          label="Content Filter"
          value={prefs.contentFilter}
          onChange={v => update('contentFilter', v)}
          options={[
            { value:'all',   label:'All'   },
            { value:'clean', label:'Clean' },
          ]}
        />

        <Options
          label="Language"
          value={prefs.language}
          onChange={v => update('language', v)}
          options={[
            { value:'en', label:'English' },
            { value:'jp', label:'Japanese' },
            { value:'kr', label:'Korean'  },
          ]}
        />
      </section>

      {/* Save button */}
      <button className="btn-accent"
        onClick={save}
        style={{ padding:'0.75rem 2rem', fontSize:'0.95rem', width:'100%' }}>
        {saved2 ? '✅ Saved!' : '💾 Save Preferences'}
      </button>

      {/* Note for non-logged-in users */}
      {!user && (
        <p style={{ textAlign:'center', fontSize:'0.78rem', color:'var(--text-dim)', marginTop:'1rem' }}>
          Login to sync preferences across devices.
        </p>
      )}
    </div>
  );
}
