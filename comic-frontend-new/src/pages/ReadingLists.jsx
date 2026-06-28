import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LazyImage from '../components/LazyImage';
import useSEO from '../hooks/useSEO';

// ─── localStorage key ─────────────────────────────────────────────────────
const LISTS_KEY = 'reading_lists';

// ─── Default lists every user starts with ────────────────────────────────
const DEFAULT_LISTS = [
  { id: 'to-read',      name: 'To Read',      icon: '📌', color: '#4361ee', comics: [] },
  { id: 'favourites',   name: 'Favourites',   icon: '❤️', color: '#e94560', comics: [] },
  { id: 'recommended',  name: 'Recommended',  icon: '👍', color: '#38b060', comics: [] },
  { id: 'completed',    name: 'Completed',    icon: '✅', color: '#7209b7', comics: [] },
];

// ─── Load lists from localStorage ────────────────────────────────────────
function loadLists() {
  try {
    const saved = JSON.parse(localStorage.getItem(LISTS_KEY));
    return saved && saved.length ? saved : DEFAULT_LISTS;
  } catch { return DEFAULT_LISTS; }
}

// ─── Save lists to localStorage ──────────────────────────────────────────
function saveLists(lists) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

// ─── Generate unique ID ───────────────────────────────────────────────────
const uid = () => Date.now().toString(36);

export default function ReadingLists() {
  useSEO({ title: 'My Reading Lists', description: 'Manage your manga reading lists and collections.' });

  const [lists,      setLists]      = useState(loadLists);
  const [activeList, setActiveList] = useState(null);  // null = show all lists
  const [newName,    setNewName]    = useState('');
  const [newIcon,    setNewIcon]    = useState('📚');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId,  setEditingId]  = useState(null);  // list being renamed
  const [editName,   setEditName]   = useState('');
  const navigate = useNavigate();

  // Persist to localStorage whenever lists change
  useEffect(() => { saveLists(lists); }, [lists]);

  // ── Create a new list ─────────────────────────────────────────────────
  const createList = () => {
    if (!newName.trim()) return;
    const list = { id: uid(), name: newName.trim(), icon: newIcon, color: '#4361ee', comics: [] };
    setLists(prev => [...prev, list]);
    setNewName(''); setNewIcon('📚'); setShowCreate(false);
  };

  // ── Delete a list (with confirmation) ────────────────────────────────
  const deleteList = (listId) => {
    if (!window.confirm('Delete this list?')) return;
    setLists(prev => prev.filter(l => l.id !== listId));
    if (activeList?.id === listId) setActiveList(null);
  };

  // ── Remove a comic from a list ────────────────────────────────────────
  const removeComic = (listId, comicId) => {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, comics: l.comics.filter(c => c.id !== comicId) } : l
    ));
    if (activeList?.id === listId)
      setActiveList(prev => ({ ...prev, comics: prev.comics.filter(c => c.id !== comicId) }));
  };

  // ── Rename a list ─────────────────────────────────────────────────────
  const renameList = (listId) => {
    if (!editName.trim()) return;
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, name: editName.trim() } : l
    ));
    setEditingId(null); setEditName('');
  };

  // ── Default list icons to choose from ────────────────────────────────
  const ICONS = ['📚','❤️','📌','✅','👍','🔥','⭐','🎯','📖','💡','🗂','🏆'];

  // ── View = all lists grid ─────────────────────────────────────────────
  if (!activeList) {
    return (
      <div className="page-container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>🗂 Reading Lists</h1>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>
              {lists.length} lists · Saved in your browser
            </p>
          </div>
          <button className="btn-accent" onClick={() => setShowCreate(v => !v)}
            style={{ fontSize:'0.85rem' }}>
            + New List
          </button>
        </div>

        {/* Create list form */}
        {showCreate && (
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:14, padding:'1.25rem', marginBottom:'1.5rem' }}>
            <h3 style={{ fontSize:'1rem', marginBottom:'1rem' }}>Create New List</h3>

            {/* Icon picker */}
            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setNewIcon(icon)}
                  style={{ fontSize:'1.3rem', background: newIcon === icon ? 'var(--bg-elevated)' : 'none',
                    border: newIcon === icon ? '2px solid var(--accent-main)' : '2px solid transparent',
                    borderRadius:8, padding:'0.2rem 0.4rem', cursor:'pointer' }}>
                  {icon}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
              <span style={{ fontSize:'1.4rem' }}>{newIcon}</span>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="List name (e.g. To Read Later)"
                onKeyDown={e => e.key === 'Enter' && createList()}
                style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)',
                  color:'var(--text-primary)', padding:'0.65rem 1rem',
                  borderRadius:8, fontSize:'0.9rem', outline:'none' }} />
              <button className="btn-accent" onClick={createList}
                disabled={!newName.trim()} style={{ padding:'0.65rem 1.2rem' }}>
                Create
              </button>
              <button className="btn-outline" onClick={() => setShowCreate(false)}
                style={{ padding:'0.65rem 1rem' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Lists grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
          {lists.map(list => (
            <div key={list.id}
              style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:14, padding:'1.25rem', cursor:'pointer',
                transition:'border-color 0.2s, transform 0.2s', position:'relative' }}
              onClick={() => setActiveList(list)}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent-main)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}>

              {/* Icon + name */}
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>{list.icon}</div>

              {/* Rename inline */}
              {editingId === list.id ? (
                <div onClick={e => e.stopPropagation()} style={{ display:'flex', gap:'0.4rem', marginBottom:'0.4rem' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    autoFocus onKeyDown={e => { if (e.key==='Enter') renameList(list.id); if (e.key==='Escape') setEditingId(null); }}
                    style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)',
                      color:'var(--text-primary)', padding:'0.35rem 0.6rem', borderRadius:6,
                      fontSize:'0.85rem', outline:'none' }} />
                  <button onClick={() => renameList(list.id)} className="btn-accent"
                    style={{ fontSize:'0.72rem', padding:'0.3rem 0.6rem' }}>✓</button>
                </div>
              ) : (
                <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.3rem' }}>{list.name}</div>
              )}

              {/* Comic count */}
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                {list.comics.length} {list.comics.length === 1 ? 'manga' : 'manga'}
              </div>

              {/* Tiny preview covers */}
              {list.comics.length > 0 && (
                <div style={{ display:'flex', gap:4, marginTop:'0.6rem' }}>
                  {list.comics.slice(0, 4).map(c => (
                    <img key={c.id}
                      src={c.cover || `https://picsum.photos/seed/${c.id}/30/44`}
                      alt={c.title}
                      style={{ width:28, height:40, objectFit:'cover', borderRadius:4 }} />
                  ))}
                  {list.comics.length > 4 && (
                    <div style={{ width:28, height:40, borderRadius:4, background:'var(--bg-elevated)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.65rem', color:'var(--text-dim)', fontWeight:700 }}>
                      +{list.comics.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons (top-right) */}
              <div onClick={e => e.stopPropagation()}
                style={{ position:'absolute', top:10, right:10, display:'flex', gap:4 }}>
                <button onClick={() => { setEditingId(list.id); setEditName(list.name); }}
                  title="Rename" style={{ background:'none', border:'none',
                    color:'var(--text-dim)', cursor:'pointer', fontSize:'0.8rem', padding:2 }}>✏️</button>
                {/* Only allow deleting custom lists, not defaults */}
                {!DEFAULT_LISTS.find(d => d.id === list.id) && (
                  <button onClick={() => deleteList(list.id)}
                    title="Delete" style={{ background:'none', border:'none',
                      color:'var(--text-dim)', cursor:'pointer', fontSize:'0.8rem', padding:2 }}>🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── View = inside a specific list ─────────────────────────────────────
  const list = lists.find(l => l.id === activeList.id) || activeList;
  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      {/* Back + header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <button className="btn-outline" style={{ fontSize:'0.8rem', padding:'0.35rem 0.8rem' }}
          onClick={() => setActiveList(null)}>
          ← All Lists
        </button>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>
          {list.icon} {list.name}
        </h1>
        <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>
          {list.comics.length} manga
        </span>
      </div>

      {/* Comics in this list */}
      {list.comics.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📭</div>
          <p style={{ marginBottom:'1rem' }}>This list is empty.</p>
          <p style={{ fontSize:'0.83rem', color:'var(--text-dim)' }}>
            Go to any manga page and click "+ Add to List" to add it here.
          </p>
          <Link to="/"><button className="btn-accent" style={{ marginTop:'1rem' }}>Browse Manga</button></Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:'1.25rem' }}>
          {list.comics.map(c => (
            <div key={c.id} style={{ position:'relative', cursor:'pointer' }}
              onClick={() => navigate(`/comic/${c.id}`)}>
              <div style={{ borderRadius:14, overflow:'hidden', aspectRatio:'2/3', background:'var(--bg-elevated)' }}>
                <LazyImage src={c.cover || `https://picsum.photos/seed/${c.id}/200/300`}
                  alt={c.title} fallbackSeed={c.id + 50}
                  style={{ width:'100%', height:'100%' }} />
                {/* Remove button */}
                <button onClick={e => { e.stopPropagation(); removeComic(list.id, c.id); }}
                  style={{ position:'absolute', top:6, right:6, background:'rgba(233,69,96,0.9)',
                    color:'#fff', border:'none', borderRadius:'50%', width:24, height:24,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', fontSize:'0.7rem', fontWeight:800 }}>✕</button>
              </div>
              <div style={{ marginTop:'0.4rem', fontWeight:700, fontSize:'0.8rem',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exported helper: Add a comic to a list (called from ComicDetails) ────
export function addToList(listId, comic) {
  const lists = loadLists();
  const updated = lists.map(l => {
    if (l.id !== listId) return l;
    // Avoid duplicates
    if (l.comics.find(c => c.id === comic.id)) return l;
    return { ...l, comics: [...l.comics, comic] };
  });
  saveLists(updated);
}

export function getLists() { return loadLists(); }
