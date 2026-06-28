import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

/* ─── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ avatar, username, size = 32, gradient = '135deg,#e94560,#7209b7' }) {
  const isUrl   = typeof avatar === 'string' && avatar.startsWith('http');
  const isEmoji = avatar && !isUrl && [...avatar].length <= 2;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(${gradient})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: isEmoji ? size * 0.52 : size * 0.4,
      fontWeight: 800, color: '#fff', overflow: 'hidden',
    }}>
      {isUrl
        ? <img src={avatar} alt={username}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : isEmoji ? avatar : (username?.[0] || '?').toUpperCase()}
    </div>
  );
}

/* ─── NEW: User Mini-Profile Popover ─────────────────────────────────────
   Clicking a username or avatar in a comment opens this card — shows
   avatar, display name, follower count, and a Follow/Unfollow button,
   without leaving the comments panel. ── */
function UserPopover({ username, anchorRect, onClose }) {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [busy,      setBusy]      = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/users/${username}`).then(({ data }) => {
      if (cancelled) return;
      setProfile(data);
      setFollowing(!!data.isFollowing);
      setFollowers(data.followers || 0);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    const onClick = (e) => { if (popRef.current && !popRef.current.contains(e.target)) onClose(); };
    const onEsc   = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  const toggleFollow = async () => {
    if (!me) { onClose(); navigate('/login'); return; }
    setBusy(true);
    try {
      const { data } = await api.post(`/users/${username}/follow`);
      setFollowing(data.following);
      setFollowers(data.followers);
    } catch {}
    setBusy(false);
  };

  if (!anchorRect) return null;

  const popHeight  = 190;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const top  = spaceBelow >= popHeight ? anchorRect.bottom + 8 : anchorRect.top - popHeight - 8;
  const left = Math.min(Math.max(8, anchorRect.left), window.innerWidth - 268);

  const isMe = me?.username === username;

  return createPortal(
    <div ref={popRef}
      style={{
        position: 'fixed', top, left, zIndex: 99999, width: 260,
        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '1rem', boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        animation: 'fadeInScale 0.15s ease',
      }}>
      {loading ? (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 4, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 4 }} />
          </div>
        </div>
      ) : !profile ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', textAlign: 'center', padding: '0.5rem 0' }}>
          User not found.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.85rem' }}>
            <Avatar avatar={profile.avatar} username={profile.username} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.displayName || profile.username}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>
                @{profile.username}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
              margin: '0 0 0.85rem', overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {profile.bio}
            </p>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem',
            paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>{followers}</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>followers</span>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>{profile.chaptersRead ?? 0}</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>ch. read</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/user/${profile.username}`} onClick={onClose}
              style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8,
                padding: '0.45rem 0', fontSize: '0.8rem', fontWeight: 700,
                color: '#fff', textDecoration: 'none' }}>
              View Profile
            </Link>
            {!isMe && (
              <button onClick={toggleFollow} disabled={busy}
                style={{ flex: 1, background: following ? 'rgba(255,255,255,0.08)' : '#e94560',
                  border: following ? '1px solid rgba(255,255,255,0.14)' : 'none',
                  borderRadius: 8, padding: '0.45rem 0', fontSize: '0.8rem', fontWeight: 700,
                  color: '#fff', cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                {following ? '✓ Following' : '+ Follow'}
              </button>
            )}
          </div>
        </>
      )}
      <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
    </div>,
    document.body
  );
}

/* ─── NEW: clickable username that opens UserPopover ─────────────────── */
function UsernameLink({ username, onOpen, style, children }) {
  const ref = useRef(null);
  return (
    <span ref={ref}
      onClick={(e) => { e.stopPropagation(); onOpen(username, ref.current.getBoundingClientRect()); }}
      style={{ cursor: 'pointer', ...style }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
      {children}
    </span>
  );
}

/* ─── NEW: render @mentions inside comment text as clickable tokens ──── */
function renderContentWithMentions(content, onMentionClick) {
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      const uname = part.slice(1);
      return (
        <span key={i}
          onClick={(e) => { e.stopPropagation(); onMentionClick(uname, e.currentTarget.getBoundingClientRect()); }}
          style={{ color: '#7dd3fc', fontWeight: 700, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Report Modal ───────────────────────────────────────────────────── */
const REPORT_REASONS = [
  { value: 'SPAM',          label: '🚫 Spam or self-promotion'    },
  { value: 'HATE',          label: '💢 Hate speech or harassment'  },
  { value: 'SPOILER',       label: '⚠️ Unmarked spoilers'         },
  { value: 'INAPPROPRIATE', label: '🔞 Inappropriate content'      },
  { value: 'OTHER',         label: '📝 Other'                     },
];

function ReportModal({ comment, onClose }) {
  const [reason,     setReason]     = useState('');
  const [details,    setDetails]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  const submit = async () => {
    if (!reason) { setError('Please select a reason.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post(`/comments/${comment.id}/report`, { reason, details: details.trim() || null });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit report. Please try again.');
    }
    setSubmitting(false);
  };

  return createPortal(
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'fadeInScale 0.2s ease' }}>

        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '0.4rem' }}>
              Report submitted
            </div>
            <div style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem' }}>
              Moderators will review this comment. Thanks for keeping the community safe.
            </div>
            <button onClick={onClose}
              style={{ background: '#e94560', color: '#fff', border: 'none',
                borderRadius: 8, padding: '0.55rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>🚩 Report comment</div>
              <button onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                  fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '1rem',
              display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Avatar avatar={comment.user?.avatar} username={comment.user?.username} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#4361ee' }}>
                  {comment.user?.username}
                </span>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {comment.content}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reason
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {REPORT_REASONS.map(r => (
                  <label key={r.value}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.55rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                      background: reason === r.value ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${reason === r.value ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'all 0.15s', fontSize: '0.86rem', color: '#eee' }}>
                    <input type="radio" name="report-reason" value={r.value}
                      checked={reason === r.value}
                      onChange={() => { setReason(r.value); setError(''); }}
                      style={{ accentColor: '#e94560', flexShrink: 0 }} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Additional details <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea value={details} onChange={e => setDetails(e.target.value)}
                placeholder="Describe the issue…" rows={2} maxLength={300}
                style={{ width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '0.55rem 0.75rem', color: '#eee',
                  fontSize: '0.84rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {error && (
              <div style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.3)',
                borderRadius: 7, padding: '0.45rem 0.75rem', marginBottom: '0.85rem',
                fontSize: '0.8rem', color: '#f87171' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ccc', borderRadius: 8, padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={submit} disabled={submitting || !reason}
                style={{ background: '#e94560', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.85rem',
                  fontWeight: 700, cursor: submitting || !reason ? 'default' : 'pointer',
                  opacity: submitting || !reason ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                {submitting ? 'Submitting…' : '🚩 Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }`}</style>
    </div>,
    document.body
  );
}

/* ─── Three-dot menu ─────────────────────────────────────────────────── */
function CommentMenu({ isOwn, onDelete, onReport, loggedIn }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  if (!loggedIn) return null;

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0, alignSelf: 'flex-start' }}>
      <button onClick={() => setOpen(v => !v)}
        title="Comment options"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
          cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem', lineHeight: 1,
          transition: 'color 0.15s', borderRadius: 4, letterSpacing: 1 }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.color = open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'}>
        ⋯
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '120%', right: 0, zIndex: 500,
          background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '0.3rem', minWidth: 155,
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)', animation: 'fadeInScale 0.15s ease' }}>

          {isOwn && (
            <button onClick={() => { setOpen(false); onDelete(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%',
                background: 'none', border: 'none', color: '#f87171', fontSize: '0.84rem',
                fontWeight: 600, padding: '0.55rem 0.85rem', borderRadius: 7,
                cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              🗑 Delete
            </button>
          )}

          {!isOwn && (
            <button onClick={() => { setOpen(false); onReport(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%',
                background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.84rem',
                fontWeight: 600, padding: '0.55rem 0.85rem', borderRadius: 7,
                cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              🚩 Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function ChapterComments({ comicId, chapterId, chapterTitle }) {
  const { user } = useAuth();

  const endpoint = comicId
    ? `/comics/${comicId}/comments`
    : `/chapters/${chapterId}/comments`;

  const [open,            setOpen]            = useState(false);
  const [comments,        setComments]        = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [text,            setText]            = useState('');
  const [posting,         setPosting]         = useState(false);
  const [count,           setCount]           = useState(0);
  const [error,           setError]           = useState('');
  const [reportTarget,    setReportTarget]    = useState(null);
  const [popoverUser,     setPopoverUser]     = useState(null); // { username, anchorRect }
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery,    setMentionQuery]    = useState('');
  const textareaRef = useRef(null);

  const loadComments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [commentsRes, blockedRes] = await Promise.all([
        api.get(endpoint),
        user ? api.get('/me/blocked/ids').catch(() => ({ data: [] }))
              : Promise.resolve({ data: [] }),
      ]);
      let data = Array.isArray(commentsRes.data) ? commentsRes.data : [];
      const blockedIds = Array.isArray(blockedRes.data) ? blockedRes.data : [];
      if (blockedIds.length > 0)
        data = data.filter(c => !blockedIds.includes(c.user?.id));
      setComments(data);
      setCount(data.length);
    } catch {
      setError('Failed to load comments.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, user]);

  useEffect(() => { if (open) loadComments(); }, [open, loadComments]);

  useEffect(() => {
    api.get(endpoint)
      .then(r => setCount(Array.isArray(r.data) ? r.data.length : 0))
      .catch(() => {});
  }, [endpoint]);

  // NEW: unique commenters in this thread, used for @mention suggestions
  const knownUsers = (() => {
    const seen = new Map();
    comments.forEach(c => {
      if (c.user?.username && c.user.username !== user?.username && !seen.has(c.user.username)) {
        seen.set(c.user.username, c.user);
      }
    });
    return Array.from(seen.values());
  })();

  const filteredMentionUsers = mentionQuery
    ? knownUsers.filter(u => u.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : knownUsers;

  // NEW: detect "@" typing to trigger the mention dropdown
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    setError('');

    const cursorPos = e.target.selectionStart;
    const beforeCursor = val.slice(0, cursorPos);
    const match = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (username) => {
    const cursorPos = textareaRef.current.selectionStart;
    const before = text.slice(0, cursorPos).replace(/@([a-zA-Z0-9_]*)$/, '');
    const after = text.slice(cursorPos);
    setText(`${before}@${username} ${after}`);
    setShowMentionList(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const openUserPopover = (username, rect) => setPopoverUser({ username, anchorRect: rect });

  const post = async () => {
    if (!text.trim() || posting) return;
    setPosting(true); setError('');
    try {
      const { data } = await api.post(endpoint, { content: text.trim() });
      const enriched = {
        ...data,
        user: {
          ...(data.user || {}),
          id:       data.user?.id       || user.id,
          username: data.user?.username || user.username,
          avatar:   data.user?.avatar   || user.avatar,
        },
      };
      setComments(prev => [enriched, ...prev]);
      setCount(c => c + 1);
      setText('');
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg) {
        setError(msg);
      } else {
        setComments(prev => [{
          id: `temp-${Date.now()}`, content: text.trim(), _pending: true,
          user: { id: user.id, username: user.username, avatar: user.avatar },
          createdAt: new Date().toISOString(),
        }, ...prev]);
        setCount(c => c + 1);
        setText('');
      }
    }
    setPosting(false);
  };

  const remove = async (id) => {
    setComments(prev => prev.filter(c => c.id !== id));
    setCount(c => Math.max(0, c - 1));
    try {
      await api.delete(
        comicId
          ? `/comics/${comicId}/comments/${id}`
          : `/chapters/${chapterId}/comments/${id}`
      );
    } catch { loadComments(); }
  };

  // NEW: quick reply pre-fills "@username " in the compose box
  const replyTo = (username) => {
    if (!user) return;
    const mention = `@${username} `;
    setText(t => t.startsWith(mention) ? t : mention + t);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.85)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#ccc', padding: '0.5rem 1.5rem', borderRadius: 40, cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center',
            gap: '0.5rem', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
          💬 {comicId ? 'Comments' : 'Chapter Comments'}
          {count > 0 && (
            <span style={{ background: '#e94560', color: '#fff', borderRadius: 20,
              fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', lineHeight: 1.4 }}>
              {count}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {open && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1rem 1.5rem', color: '#eee' }}>

          {chapterTitle && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center',
              marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>
              Comments for {chapterTitle}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.3)',
              borderRadius: 8, padding: '0.5rem 0.85rem', marginBottom: '0.75rem',
              fontSize: '0.82rem', color: '#f87171', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')}
                style={{ background: 'none', border: 'none', color: '#f87171',
                  cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>✕</button>
            </div>
          )}

          {/* Compose */}
          {user ? (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Avatar avatar={user.avatar} username={user.username} size={34}
                gradient="135deg,#4361ee,#7209b7" />
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea ref={textareaRef} value={text} onChange={handleTextChange}
                  placeholder="What do you think? Type @ to mention someone…" rows={2}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', color: '#eee',
                    padding: '0.6rem 0.85rem', borderRadius: 10, fontSize: '0.85rem',
                    outline: 'none', resize: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(67,97,238,0.6)'}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                                    setTimeout(() => setShowMentionList(false), 150); }}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); post(); } }} />

                {/* NEW: @mention suggestion dropdown */}
                {showMentionList && filteredMentionUsers.length > 0 && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
                    background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10, padding: '0.3rem', minWidth: 200, maxHeight: 180,
                    overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 50 }}>
                    {filteredMentionUsers.slice(0, 6).map(u => (
                      <div key={u.username}
                        onMouseDown={() => insertMention(u.username)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.4rem 0.6rem', borderRadius: 7, cursor: 'pointer',
                          transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Avatar avatar={u.avatar} username={u.username} size={22} />
                        <span style={{ fontSize: '0.8rem', color: '#eee', fontWeight: 600 }}>{u.username}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', alignItems: 'center' }}>
                  <button onClick={post} disabled={posting || !text.trim()}
                    style={{ background: '#e94560', color: '#fff', border: 'none',
                      borderRadius: 7, padding: '0.38rem 1rem', fontSize: '0.78rem',
                      fontWeight: 700, cursor: posting || !text.trim() ? 'default' : 'pointer',
                      opacity: posting || !text.trim() ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    {posting ? 'Posting…' : 'Post'}
                  </button>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>Ctrl+Enter</span>
                  <button onClick={loadComments} disabled={loading} title="Refresh comments"
                    style={{ marginLeft: 'auto', background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.82rem',
                      padding: '0.2rem 0.4rem', borderRadius: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                    ↻ Refresh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.75rem', marginBottom: '1rem',
              background: 'rgba(255,255,255,0.04)', borderRadius: 10,
              fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              <Link to="/login" style={{ color: '#e94560', fontWeight: 700 }}>Login</Link>
              {' '}to join the discussion.
            </div>
          )}

          {/* List */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 10, width: '30%', borderRadius: 4, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: '80%', borderRadius: 4 }} />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem',
              color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
              💬 No comments yet. Be the first!
            </div>
          ) : (
            comments.map(c => {
              const isOwn = user != null && (
                (c.user?.id && user.id && c.user.id === user.id) ||
                (c.user?.username && c.user.username === user.username)
              );

              return (
                <div key={c.id}
                  style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.85rem',
                    padding: '0.7rem 0.85rem',
                    background: c._pending ? 'rgba(67,97,238,0.07)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${c._pending ? 'rgba(67,97,238,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10 }}>

                  {/* NEW: clicking the avatar opens the mini-profile popover */}
                  <div
                    onClick={(e) => { if (c.user?.username && !c._pending) openUserPopover(c.user.username, e.currentTarget.getBoundingClientRect()); }}
                    style={{ cursor: c._pending ? 'default' : 'pointer' }}>
                    <Avatar avatar={c.user?.avatar} username={c.user?.username} size={30} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {c._pending ? (
                          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#4361ee' }}>
                            {c.user?.username || 'User'}
                          </span>
                        ) : (
                          <UsernameLink username={c.user?.username} onOpen={openUserPopover}
                            style={{ fontWeight: 700, fontSize: '0.78rem', color: '#4361ee' }}>
                            {c.user?.username || 'User'}
                          </UsernameLink>
                        )}
                        {c._pending && (
                          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                            sending…
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>

                    {/* NEW: @mentions inside comment text are clickable too */}
                    <p style={{ fontSize: '0.84rem', margin: 0, lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.8)', wordBreak: 'break-word' }}>
                      {renderContentWithMentions(c.content, openUserPopover)}
                    </p>

                    {/* NEW: quick Reply — pre-fills @username in the compose box */}
                    {!c._pending && user && !isOwn && (
                      <button onClick={() => replyTo(c.user?.username)}
                        style={{ marginTop: '0.35rem', background: 'none', border: 'none',
                          color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600,
                          cursor: 'pointer', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#7dd3fc'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                        ↩ Reply
                      </button>
                    )}
                  </div>

                  {!c._pending && (
                    <CommentMenu
                      isOwn={isOwn}
                      loggedIn={!!user}
                      onDelete={() => remove(c.id)}
                      onReport={() => setReportTarget(c)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {reportTarget && (
        <ReportModal comment={reportTarget} onClose={() => setReportTarget(null)} />
      )}

      {popoverUser && (
        <UserPopover
          username={popoverUser.username}
          anchorRect={popoverUser.anchorRect}
          onClose={() => setPopoverUser(null)}
        />
      )}
    </div>
  );
}
