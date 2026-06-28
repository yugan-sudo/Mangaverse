import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReadChapters } from '../utils/historyStorage';

export default function ChapterList({ comicId, chapters }) {
  const { user } = useAuth();
  const readSet = getReadChapters(user, comicId);

  if (!chapters || chapters.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)',
        background:'var(--bg-card)', borderRadius:12, border:'1px solid var(--border)' }}>
        No chapters available yet.
      </div>
    );
  }

  return (
    <div className="chapter-list">
      {chapters.map(ch => (
        <Link key={ch.id}
          to={`/comic/${comicId}/chapter/${ch.id}`}
          className={`chapter-item ${readSet.has(ch.id) ? 'read' : ''}`}>
          <div>
            <span style={{ fontWeight:700 }}>Ch. {ch.chapterNumber}</span>
            {ch.title && (
              <span style={{ color:'var(--text-muted)', marginLeft:'0.5rem', fontSize:'0.84rem' }}>
                {ch.title}
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            {readSet.has(ch.id) && (
              <span style={{ fontSize:'0.68rem', color:'#38b060', fontWeight:600 }}>✓ Read</span>
            )}
            <span style={{ fontSize:'0.75rem', color:'var(--text-dim)' }}>
              {ch.createdAt ? new Date(ch.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
