import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import ReportModal from './ReportModal';

// ─── time ago helper ───────────────────────────────────────────────────────
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

// ─── Avatar circle ──────────────────────────────────────────────────────────
function Avatar({ username, size = 34 }) {
  const colors = ['#4361ee','#e94560','#7209b7','#38b060','#f4c430','#e8a000'];
  const color  = colors[(username?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`linear-gradient(135deg,${color},${color}88)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:800, fontSize:size * 0.35, color:'#fff' }}>
      {(username || '?')[0].toUpperCase()}
    </div>
  );
}

// ─── Single reply row ──────────────────────────────────────────────────────
function ReplyRow({ reply, onDelete, currentUser }) {
  return (
    <div style={{ display:'flex', gap:'0.55rem',
      padding:'0.55rem 0.75rem 0.55rem 0.75rem',
      background:'rgba(67,97,238,0.05)',
      borderLeft:'2px solid rgba(67,97,238,0.3)',
      borderRadius:'0 8px 8px 0', marginBottom:4 }}>
      <Avatar username={reply.user?.username} size={26} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.2rem' }}>
          <span style={{ fontWeight:700, fontSize:'0.76rem', color:'var(--accent-blue)' }}>
            {reply.user?.username}
          </span>
          <span style={{ fontSize:'0.66rem', color:'var(--text-dim)' }}>{timeAgo(reply.createdAt)}</span>
        </div>
        <p style={{ fontSize:'0.82rem', margin:0, lineHeight:1.5, color:'var(--text-primary)', wordBreak:'break-word' }}>
          {/* Show @username in accent colour */}
          {reply.replyToUsername && (
            <span style={{ color:'var(--accent-main)', fontWeight:700, marginRight:4 }}>
              @{reply.replyToUsername}
            </span>
          )}
          {reply.content}
        </p>
      </div>
      {currentUser?.username === reply.user?.username && (
        <button onClick={() => onDelete(reply.id)}
          style={{ background:'none', border:'none', color:'var(--text-dim)',
            cursor:'pointer', fontSize:'0.8rem', alignSelf:'flex-start', padding:0 }}>
          🗑
        </button>
      )}
    </div>
  );
}

// ─── Single comment with threaded replies ─────────────────────────────────
function CommentItem({ comment, onDelete, comicId }) {
  const { user } = useAuth();
  const [replies,      setReplies]      = useState([]);
  const [showReplies,  setShowReplies]  = useState(false);
  const [replying,     setReplying]     = useState(false); // show reply input
  const [replyText,    setReplyText]    = useState('');
  const [posting,      setPosting]      = useState(false);
  const [showReport,   setShowReport]   = useState(false); // report modal

  // Load replies when expanded
  useEffect(() => {
    if (!showReplies) return;
    api.get(`/comments/${comment.id}/replies`)
      .then(r => setReplies(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, [showReplies, comment.id]);

  // Post a reply
  const postReply = async () => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/comments/${comment.id}/replies`, {
        content: replyText.trim(),
        replyToUsername: comment.user?.username,
      });
      setReplies(prev => [...prev, data]);
      setReplyText('');
      setReplying(false);
      setShowReplies(true);
    } catch {
      // Demo: add locally
      setReplies(prev => [...prev, {
        id: Date.now(), content: replyText.trim(),
        user: { username: user?.username },
        replyToUsername: comment.user?.username,
        createdAt: new Date().toISOString(),
      }]);
      setReplyText(''); setReplying(false); setShowReplies(true);
    }
    setPosting(false);
  };

  const deleteReply = async (replyId) => {
    try { await api.delete(`/comments/${comment.id}/replies/${replyId}`); } catch {}
    setReplies(prev => prev.filter(r => r.id !== replyId));
  };

  return (
    <div style={{ padding:'0.85rem 1rem', background:'var(--bg-card)',
      border:'1px solid var(--border)', borderRadius:10, marginBottom:'0.75rem' }}>

      {/* Comment header */}
      <div style={{ display:'flex', gap:'0.65rem', marginBottom:'0.5rem' }}>
        <Avatar username={comment.user?.username} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
            <span style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--accent-blue)' }}>
              {comment.user?.username || 'User'}
            </span>
            <span style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p style={{ fontSize:'0.88rem', margin:0, lineHeight:1.55,
            color:'var(--text-primary)', wordBreak:'break-word' }}>
            {comment.content}
          </p>
        </div>
        {/* Delete own comment */}
        {user?.username === comment.user?.username && (
          <button onClick={() => onDelete(comment.id)}
            style={{ background:'none', border:'none', color:'var(--text-dim)',
              cursor:'pointer', fontSize:'0.85rem', alignSelf:'flex-start', padding:0 }}>
            🗑
          </button>
        )}
      </div>

      {/* Action row: Reply + Show Replies */}
      <div style={{ display:'flex', gap:'0.75rem', paddingLeft: 42 }}>
        {user && (
          <button onClick={() => setReplying(v => !v)}
            style={{ background:'none', border:'none', color:'var(--text-muted)',
              cursor:'pointer', fontSize:'0.76rem', fontWeight:600, padding:0 }}>
            💬 Reply
          </button>
        )}
        {/* Show/hide replies toggle */}
        <button onClick={() => setShowReplies(v => !v)}
          style={{ background:'none', border:'none', color:'var(--accent-blue)',
            cursor:'pointer', fontSize:'0.76rem', fontWeight:600, padding:0 }}>
          {showReplies
            ? `▲ Hide replies`
            : `▼ ${replies.length > 0 ? replies.length : ''} Show replies`}
        </button>

        {/* Report button — only for other users' comments */}
        {user && user.username !== comment.user?.username && (
          <button onClick={() => setShowReport(true)}
            style={{ background:'none', border:'none', color:'var(--text-dim)',
              cursor:'pointer', fontSize:'0.76rem', fontWeight:600, padding:0,
              marginLeft:'auto' }}>
            🚨 Report
          </button>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          commentId={comment.id}
          commentPreview={comment.content}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Reply input box */}
      {replying && (
        <div style={{ paddingLeft:42, marginTop:'0.6rem', display:'flex', gap:'0.5rem' }}>
          <Avatar username={user?.username} size={26} />
          <div style={{ flex:1 }}>
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to @${comment.user?.username}…`}
              autoFocus
              onKeyDown={e => { if (e.key==='Enter') postReply(); if (e.key==='Escape') setReplying(false); }}
              style={{ width:'100%', background:'var(--bg-elevated)',
                border:'1px solid var(--border)', color:'var(--text-primary)',
                padding:'0.45rem 0.75rem', borderRadius:8,
                fontSize:'0.83rem', outline:'none' }}
            />
            <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.35rem' }}>
              <button onClick={postReply} disabled={posting || !replyText.trim()}
                className="btn-accent" style={{ fontSize:'0.74rem', padding:'0.28rem 0.75rem' }}>
                {posting ? '…' : 'Reply'}
              </button>
              <button onClick={() => setReplying(false)} className="btn-outline"
                style={{ fontSize:'0.74rem', padding:'0.28rem 0.7rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies list */}
      {showReplies && replies.length > 0 && (
        <div style={{ paddingLeft:42, marginTop:'0.6rem' }}>
          {replies.map(r => (
            <ReplyRow key={r.id} reply={r}
              onDelete={deleteReply} currentUser={user} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main CommentThread — renders all comments with reply threading ─────
export default function CommentThread({ comicId, comments, onDelete }) {
  const { user } = useAuth();

  if (comments.length === 0) return (
    <div style={{ textAlign:'center', padding:'2.5rem 0', color:'var(--text-muted)' }}>
      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>💬</div>
      No comments yet. Be the first!
    </div>
  );

  return (
    <div>
      {comments.map(c => (
        <CommentItem key={c.id} comment={c}
          onDelete={onDelete} comicId={comicId} />
      ))}
    </div>
  );
}
