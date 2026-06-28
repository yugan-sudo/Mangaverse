import { Link } from 'react-router-dom';

const GENRES = ['Action','Romance','Fantasy','Horror','Comedy','Sci-Fi'];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div style={{ maxWidth:1320, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
          gap:'2rem', marginBottom:'2rem' }}>

          {/* Brand col */}
          <div>
            <div style={{ fontFamily:'Bangers,cursive', fontSize:'1.8rem', letterSpacing:3,
              background:'linear-gradient(135deg,var(--accent-main),var(--accent-purple))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              marginBottom:'0.75rem' }}>
              MANGAVERSE
            </div>
            <p style={{ lineHeight:1.7, fontSize:'0.83rem', color:'var(--text-dim)', maxWidth:240 }}>
              Your ultimate manga, manhwa &amp; manhua reading destination. Free, fast, always updated.
            </p>
            {/* Social icons */}
            <div style={{ display:'flex', gap:'0.6rem', marginTop:'1rem' }}>
              {['𝕏','📘','💬'].map((icon, i) => (
                <div key={i} style={{ width:32, height:32, borderRadius:'50%',
                  background:'var(--bg-elevated)', border:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.85rem', cursor:'pointer', transition:'var(--transition)' }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Browse col */}
          <div>
            <div style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.85rem',
              textTransform:'uppercase', letterSpacing:1, color:'var(--text-primary)' }}>
              Browse
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {GENRES.map(g => (
                <Link key={g} to={`/?genre=${g}`}
                  style={{ color:'var(--text-dim)', textDecoration:'none', fontSize:'0.85rem',
                    transition:'var(--transition)' }}
                  onMouseEnter={e => e.target.style.color='var(--accent-main)'}
                  onMouseLeave={e => e.target.style.color='var(--text-dim)'}>
                  {g}
                </Link>
              ))}
            </div>
          </div>

          {/* Account col */}
          <div>
            <div style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.85rem',
              textTransform:'uppercase', letterSpacing:1, color:'var(--text-primary)' }}>
              Account
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {[['Login','/login'],['Register','/register'],['Bookmarks','/bookmarks'],
                ['Notifications','/notifications'],['Preferences','/preferences']].map(([label, to]) => (
                <Link key={to} to={to}
                  style={{ color:'var(--text-dim)', textDecoration:'none', fontSize:'0.85rem',
                    transition:'var(--transition)' }}
                  onMouseEnter={e => e.target.style.color='var(--accent-main)'}
                  onMouseLeave={e => e.target.style.color='var(--text-dim)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* App stats col */}
          <div>
            <div style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.85rem',
              textTransform:'uppercase', letterSpacing:1, color:'var(--text-primary)' }}>
              Platform
            </div>
            {[['📚','10K+ Titles'],['📖','Daily Updates'],['👥','Free Forever'],['🌍','Multi-language']].map(([icon, text]) => (
              <div key={text} style={{ display:'flex', gap:'0.5rem', alignItems:'center',
                marginBottom:'0.5rem', fontSize:'0.83rem', color:'var(--text-dim)' }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1.25rem',
          display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem',
          fontSize:'0.78rem', color:'var(--text-dim)' }}>
          <span>© {new Date().getFullYear()} MangaVerse. Built with ❤️ using React + Spring Boot.</span>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            <span style={{ cursor:'pointer' }}>Privacy Policy</span>
            <span style={{ cursor:'pointer' }}>Terms of Service</span>
            <span style={{ cursor:'pointer' }}>DMCA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
