import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'reading_settings';

// ─── Default settings ─────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  readingMode:      'auto',      // auto | scroll | page
  autoScroll:       false,
  scrollSpeed:      2,           // 1–8
  darkMode:         true,
  showToolbar:      'auto',      // auto | always | never
  imageQuality:     'high',
  pageGap:          4,           // px
  autoAdvance:      true,        // auto go to next chapter at end
  markReadOnOpen:   true,        // mark chapter read when opened
  rememberPosition: true,        // resume from last position
  preloadDepth:     2,           // pages to preload ahead
};

// ─── Load / save ─────────────────────────────────────────────────────────
export function loadReadingSettings() {
  try {
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
    // FIX: horizontal/double modes removed from the picker. If a user has one
    // of those saved from before, fall back to 'auto' so the reader doesn't
    // load into a mode that's no longer selectable in settings.
    if (merged.readingMode === 'horizontal' || merged.readingMode === 'double') {
      merged.readingMode = 'auto';
    }
    return merged;
  }
  catch { return DEFAULT_SETTINGS; }
}
export function saveReadingSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ─── Auto-detect reading mode from genre ─────────────────────────────────
// FIX: horizontal mode removed — comics now fall back to scroll mode like manhwa.
export function detectReadingMode(genre = '', origin = '') {
  const g = (genre + origin).toLowerCase();
  if (g.includes('manhwa') || g.includes('korean') || g.includes('webtoon'))
    return 'scroll';
  if (g.includes('manga') || g.includes('japanese'))
    return 'page';
  return 'scroll'; // default — also covers western comics now
}

// ─── Small reusable UI pieces ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--text-dim)',
      textTransform:'uppercase', letterSpacing:1.5,
      padding:'1rem 0 0.4rem', borderBottom:'1px solid var(--border)', marginBottom:'0.1rem' }}>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'0.7rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontSize:'0.86rem', fontWeight:600 }}>{label}</div>
        {desc && <div style={{ fontSize:'0.7rem', color:'var(--text-dim)', marginTop:2 }}>{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        style={{ width:42, height:23, borderRadius:12, cursor:'pointer', flexShrink:0,
          background: value ? 'var(--accent-main)' : 'rgba(255,255,255,0.12)',
          position:'relative', transition:'background 0.2s', marginLeft:'1rem',
          border:'none', padding:0 }}>
        <span aria-hidden="true" style={{ position:'absolute', top:3, width:17, height:17, borderRadius:'50%',
          background:'#fff', left: value ? 22 : 3, transition:'left 0.2s',
          boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  );
}

function ChipRow({ label, value, options, onChange }) {
  return (
    <div style={{ padding:'0.7rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize:'0.82rem', fontWeight:600, marginBottom:'0.5rem' }}>{label}</div>
      <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            style={{ padding:'0.32rem 0.8rem', borderRadius:20, fontSize:'0.76rem',
              fontWeight:600, border:'none', cursor:'pointer',
              background: value === o.value ? 'var(--accent-main)' : 'rgba(255,255,255,0.08)',
              color: value === o.value ? '#fff' : 'var(--text-muted)',
              transition:'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange, unit='' }) {
  return (
    <div style={{ padding:'0.7rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
        <div style={{ fontSize:'0.82rem', fontWeight:600 }}>{label}</div>
        <span style={{ fontSize:'0.78rem', color:'var(--accent-blue)', fontWeight:700 }}>
          {value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:'var(--accent-main)', height:4 }} />
      <div style={{ display:'flex', justifyContent:'space-between',
        fontSize:'0.65rem', color:'var(--text-dim)', marginTop:3 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Main ReadingSettings panel ───────────────────────────────────────────
export default function ReadingSettings({ settings, onChange, onClose, genre }) {
  const [local, setLocal] = useState(settings);
  useEffect(() => setLocal(settings), [settings]);

  const update = (key, value) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onChange(updated);
    saveReadingSettings(updated);
  };

  // Effective reading mode (resolve 'auto')
  const effective = local.readingMode === 'auto'
    ? detectReadingMode(genre)
    : local.readingMode;

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:5000,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Reading settings"
        style={{
          position:'fixed', top:0, right:0, bottom:0, zIndex:5001,
          width: Math.min(340, window.innerWidth - 0),
          background:'var(--bg-card)',
          borderLeft:'1px solid var(--border)',
          display:'flex', flexDirection:'column',
          boxShadow:'-12px 0 50px rgba(0,0,0,0.5)',
          animation:'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700 }}>⚙️ Reading Settings</h3>
          <button onClick={onClose}
            aria-label="Close reading settings"
            style={{ background:'none', border:'none', color:'var(--text-dim)',
              cursor:'pointer', fontSize:'1.3rem', lineHeight:1, padding:'0 0.25rem' }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 1.25rem 1rem' }}>

          <SectionLabel>Layout</SectionLabel>
          {/* FIX: removed Horizontal and Double options — only Auto / Scroll / Page remain */}
          <ChipRow label="Reading Mode" value={local.readingMode} onChange={v => update('readingMode', v)}
            options={[
              { value:'auto',   label:'🤖 Auto'   },
              { value:'scroll', label:'📜 Scroll' },
              { value:'page',   label:'📖 Page'   },
            ]}
          />
          {local.readingMode === 'auto' && (
            <div style={{ fontSize:'0.72rem', color:'var(--accent-blue)',
              padding:'0.4rem 0.6rem', background:'rgba(67,97,238,0.1)',
              borderRadius:8, marginTop:'0.35rem' }}>
              Auto detected: <strong>{effective}</strong> mode based on genre
            </div>
          )}

          <SectionLabel>Display</SectionLabel>
          <Toggle label="Dark Background" desc="Easier on eyes when reading"
            value={local.darkMode} onChange={v => update('darkMode', v)} />
          <ChipRow label="Toolbar" value={local.showToolbar} onChange={v => update('showToolbar', v)}
            options={[
              { value:'auto',   label:'Auto Hide' },
              { value:'always', label:'Always'    },
              { value:'never',  label:'Hidden'    },
            ]}
          />
          <SliderRow label="Page Gap" value={local.pageGap} min={0} max={24}
            onChange={v => update('pageGap', v)} unit="px" />

          <SectionLabel>Auto Scroll</SectionLabel>
          <Toggle label="Enable Auto Scroll" desc="Automatically scroll through pages"
            value={local.autoScroll} onChange={v => update('autoScroll', v)} />
          {local.autoScroll && (
            <SliderRow label="Scroll Speed" value={local.scrollSpeed} min={1} max={8}
              onChange={v => update('scrollSpeed', v)} unit="x" />
          )}

          <SectionLabel>Behaviour</SectionLabel>
          <Toggle label="Auto-Advance Chapter" desc="Go to next chapter at end"
            value={local.autoAdvance} onChange={v => update('autoAdvance', v)} />
          <Toggle label="Mark Read on Open" desc="Mark chapter as read when opened"
            value={local.markReadOnOpen} onChange={v => update('markReadOnOpen', v)} />
          <Toggle label="Remember Position" desc="Resume from where you left off"
            value={local.rememberPosition} onChange={v => update('rememberPosition', v)} />

          <SectionLabel>Performance</SectionLabel>
          <ChipRow label="Image Quality" value={local.imageQuality}
            onChange={v => update('imageQuality', v)}
            options={[
              { value:'high', label:'High'         },
              { value:'low',  label:'Low (faster)' },
            ]}
          />
          <SliderRow label="Preload Depth" value={local.preloadDepth} min={1} max={5}
            onChange={v => update('preloadDepth', v)} unit=" pages" />
        </div>

        {/* Footer */}
        <div style={{ padding:'0.85rem 1.25rem', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <button className="btn-outline" style={{ width:'100%', fontSize:'0.82rem' }}
            onClick={() => { saveReadingSettings(DEFAULT_SETTINGS); setLocal(DEFAULT_SETTINGS); onChange(DEFAULT_SETTINGS); }}>
            🔄 Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
