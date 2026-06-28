import { useState } from 'react';
import useSEO from '../hooks/useSEO';

const FAQS = [
  {
    category: '📖 Reading',
    items: [
      {
        q: 'Is MangaVerse free to use?',
        a: 'Yes! MangaVerse is completely free. You can browse and read all manga, manhwa, and manhua without paying anything. Creating an account is also free and unlocks bookmarks, reading history, and notifications.',
      },
      {
        q: 'Do I need an account to read?',
        a: 'No account is required to read. However, registering lets you bookmark series, track your reading history, get notified when new chapters drop, and sync your progress across devices.',
      },
      {
        q: 'How do I continue where I left off?',
        a: 'If you are logged in, your reading history is saved automatically. You can find it under your profile → History. If you are not logged in, history is saved locally in your browser.',
      },
      {
        q: 'Can I change the reading direction?',
        a: 'Yes. While reading a chapter, open the Settings panel (gear icon) and toggle between Left-to-Right (manhwa/manhua) and Right-to-Left (manga) reading modes. Your preference is saved.',
      },
      {
        q: 'Why are some chapters missing?',
        a: 'Chapters are added by our team as they are released. If a chapter is missing it may still be in the upload queue. Check back in a few hours or enable notifications to be alerted the moment it goes live.',
      },
    ],
  },
  {
    category: '🔖 Account & Bookmarks',
    items: [
      {
        q: 'How do I bookmark a series?',
        a: 'Click the ☆ Bookmark button on any comic card, in the hero banner, or on the comic detail page. You must be logged in. All bookmarks are accessible from the Bookmarks page in your profile menu.',
      },
      {
        q: 'I forgot my password. What do I do?',
        a: 'On the Login page click "Forgot password?" and enter your registered email. You will receive a reset link within a few minutes. Check your spam folder if it does not arrive.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes. Go to Preferences → Account → Delete Account. This permanently removes your account, bookmarks, comments, and history. This action cannot be undone.',
      },
    ],
  },
  {
    category: '📢 Content & Requests',
    items: [
      {
        q: 'How do I request a new series?',
        a: 'Visit the Community page and post in the #requests channel. Our team reviews all requests weekly. Popular requests with the most upvotes are prioritised for addition.',
      },
      {
        q: 'How do I report a translation error or wrong chapter?',
        a: 'Use the Report button (🚨) on the chapter reader page, or visit the Contact page and select "Content Issue". Please include the series name and chapter number to help us fix it quickly.',
      },
      {
        q: 'Can I upload my own translations?',
        a: 'Not directly yet. If you are a scanlation group interested in partnering with us to host your work, please reach out via the Contact page.',
      },
    ],
  },
  {
    category: '⚙️ Technical',
    items: [
      {
        q: 'Images are not loading. What should I do?',
        a: 'Try refreshing the page. If that does not help, clear your browser cache (Ctrl+Shift+Delete), disable any ad-blocker for this site, or try a different browser. If the problem persists, contact us.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'Not yet, but the website is fully responsive and works great on mobile browsers. A dedicated Android and iOS app is on our roadmap — follow Announcements for updates.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'MangaVerse works on all modern browsers — Chrome, Firefox, Safari, and Edge. We recommend keeping your browser up to date for the best experience.',
      },
    ],
  },
];

export default function FAQ() {
  useSEO({ title: 'FAQ — MangaVerse', description: 'Frequently asked questions about MangaVerse.' });

  const [open, setOpen]   = useState({});
  const [search, setSearch] = useState('');

  const toggle = (key) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #e94560 100%)',
        padding: '3.5rem 1.5rem 4rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❓</div>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '0.75rem' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Can't find an answer? Head over to the <a href="/contact" style={{ color: '#fff', fontWeight: 700 }}>Contact</a> page and we'll help you out.
        </p>
        {/* Search */}
        <div style={{ maxWidth: 440, margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.75rem 1rem 0.75rem 2.4rem', borderRadius: 50,
              border: '1px solid rgba(255,255,255,0.2)', fontSize: '16px',
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              backdropFilter: 'blur(8px)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-container" style={{ maxWidth: 760, paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🤷</div>
            <div style={{ fontWeight: 600 }}>No results for "{search}"</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>Try different keywords or <a href="/contact" style={{ color: 'var(--accent-main)' }}>contact us</a>.</div>
          </div>
        ) : filtered.map((cat) => (
          <div key={cat.category} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 4, height: 18, background: 'var(--accent-main)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
              {cat.category}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cat.items.map((item, i) => {
                const key = `${cat.category}-${i}`;
                const isOpen = !!open[key];
                return (
                  <div key={key}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 12, overflow: 'hidden',
                      borderLeft: isOpen ? '3px solid var(--accent-main)' : '3px solid transparent',
                      transition: 'border-color 0.2s',
                    }}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'none', border: 'none',
                        padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                      }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {item.q}
                      </span>
                      <span style={{
                        flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                        background: isOpen ? 'var(--accent-main)' : 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', color: isOpen ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.25s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}>
                        ✕
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 1.2rem 1rem', fontSize: '0.88rem',
                        color: 'var(--text-muted)', lineHeight: 1.7,
                        borderTop: '1px solid var(--border)',
                        paddingTop: '0.85rem',
                      }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '2rem', textAlign: 'center', marginTop: '1rem',
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💬</div>
          <h3 style={{ marginBottom: '0.4rem', fontSize: '1rem' }}>Still have questions?</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Our team usually responds within 24 hours.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/contact">
              <button style={{
                background: 'var(--accent-main)', color: '#fff', border: 'none',
                padding: '0.6rem 1.4rem', borderRadius: 8, fontWeight: 700,
                fontSize: '0.88rem', cursor: 'pointer',
              }}>
                Contact Us
              </button>
            </a>
            <a href="/community">
              <button style={{
                background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', padding: '0.6rem 1.4rem',
                borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              }}>
                Ask Community
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
