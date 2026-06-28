import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught:', error.message);
    console.error('Component stack:', info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || 'Unknown error';

    // Helpful hints for common errors
    const hint =
      msg.includes("reading '0'") || msg.includes("Cannot read properties")
        ? '💡 Hint: This usually means a user object is missing a field. Try logging out and back in.'
        : msg.includes('fetch') || msg.includes('network')
        ? '💡 Hint: Backend may be offline. Check that Spring Boot is running on port 8080.'
        : null;

    return (
      <div style={{ minHeight:'50vh', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'2rem', textAlign:'center' }}>
        <div style={{ maxWidth:500 }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>💥</div>
          <h2 style={{ fontSize:'1.3rem', marginBottom:'0.5rem' }}>Something went wrong</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'1rem' }}>
            This part of the page crashed. The rest of the app still works.
          </p>

          {/* Hint box */}
          {hint && (
            <div style={{ background:'rgba(67,97,238,0.1)', border:'1px solid rgba(67,97,238,0.3)',
              borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem',
              fontSize:'0.82rem', color:'var(--accent-blue)', textAlign:'left' }}>
              {hint}
            </div>
          )}

          {/* Error details (collapsible) */}
          <details style={{ marginBottom:'1.5rem', textAlign:'left' }}>
            <summary style={{ cursor:'pointer', fontSize:'0.8rem',
              color:'var(--text-dim)', marginBottom:'0.5rem' }}>
              Show error details
            </summary>
            <pre style={{ background:'var(--bg-elevated)', padding:'0.75rem',
              borderRadius:8, fontSize:'0.72rem', color:'#e94560',
              overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word',
              border:'1px solid var(--border)' }}>
              {msg}
              {this.state.info?.componentStack?.split('\n').slice(0,5).join('\n')}
            </pre>
          </details>

          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-accent"
              onClick={() => this.setState({ hasError: false, error: null, info: null })}>
              🔄 Try Again
            </button>
            <button className="btn-outline"
              onClick={() => { window.location.href = '/'; }}>
              🏠 Go Home
            </button>
            {/* Quick fix: clear auth and reload */}
            <button className="btn-outline"
              style={{ fontSize:'0.8rem' }}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
              }}>
              🔐 Logout & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
