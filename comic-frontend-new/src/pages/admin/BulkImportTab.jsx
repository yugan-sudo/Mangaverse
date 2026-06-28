import { useState, useRef } from 'react';
import api from '../../api/axiosConfig';

function BulkImportTab({ onToast }) {
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState([]);
  const [importing,setImporting]= useState(false);
  const [results,  setResults]  = useState(null);
  const fileRef = useRef();

  const CSV_TEMPLATE = `title,author,genre,tags,description,coverImage,status,totalChapters
Solo Leveling,Chugong,"Action,Fantasy","isekai,overpowered","A weakest hunter becomes the strongest...",https://example.com/cover.jpg,ONGOING,200
Nano Machine,GreatH,"Action,Martial Arts","murim,system","A descendant of a martial arts clan...",https://example.com/cover2.jpg,ONGOING,180`;

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mangaverse_import_template.csv';
    a.click();
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
    return lines.slice(1).map(line => {
      const values = [];
      let current = '', inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      values.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    }).filter(r => r.title);
  };

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setResults(null);
    const text = await f.text();
    try {
      let rows;
      if (f.name.endsWith('.json')) {
        rows = JSON.parse(text);
        if (!Array.isArray(rows)) rows = [rows];
      } else {
        rows = parseCSV(text);
      }
      setPreview(rows.slice(0, 5));
    } catch { onToast('❌ Invalid file format'); }
  };

  const importAll = async () => {
    if (!file || preview.length === 0) return;
    setImporting(true);
    const text = await file.text();
    let rows;
    try {
      rows = file.name.endsWith('.json') ? JSON.parse(text) : parseCSV(text);
    } catch { onToast('❌ Parse error'); setImporting(false); return; }

    let created = 0, failed = 0, errors = [];
    for (const row of rows) {
      try {
        await api.post('/admin/comics', {
          title:         row.title,
          author:        row.author,
          genre:         row.genre,
          tags:          row.tags || '',
          description:   row.description || '',
          coverImage:    row.coverImage || '',
          status:        (row.status || 'ONGOING').toUpperCase(),
          totalChapters: Number(row.totalChapters) || 0,
        });
        created++;
      } catch (e) {
        failed++;
        errors.push(`${row.title}: ${e.response?.data?.message || 'Failed'}`);
      }
    }
    setResults({ created, failed, errors, total: rows.length });
    setImporting(false);
    onToast(`✅ Imported ${created}/${rows.length} comics`);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.4rem', margin:0 }}>📦 Bulk Import Comics</h1>
        <button onClick={downloadTemplate}
          style={{ background:'var(--bg-elevated)', color:'var(--text-muted)', border:'1px solid var(--border)',
            padding:'0.5rem 1rem', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
          ⬇️ Download CSV Template
        </button>
      </div>

      <div style={{ background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)',
        borderRadius:10, padding:'0.85rem 1rem', marginBottom:'1.25rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
        💡 Upload a <strong style={{ color:'var(--text-primary)' }}>CSV or JSON</strong> file with columns:
        <code style={{ background:'var(--bg-elevated)', padding:'0.1rem 0.4rem', borderRadius:4, margin:'0 0.25rem', fontSize:'0.78rem' }}>
          title, author, genre, tags, description, coverImage, status, totalChapters
        </code>
        Download the template above to get started.
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{ border:`2px dashed ${file ? 'var(--accent-main)' : 'var(--border)'}`, borderRadius:14,
          padding:'2.5rem', textAlign:'center', cursor:'pointer',
          background: file ? 'rgba(233,69,96,0.04)' : 'var(--bg-elevated)',
          marginBottom:'1.25rem', transition:'all 0.2s' }}>
        {file ? (
          <div>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.4rem' }}>📄</div>
            <div style={{ fontWeight:700, color:'var(--accent-main)' }}>{file.name}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginTop:'0.25rem' }}>
              {preview.length > 0 ? `${preview.length}+ rows detected` : 'Processing…'} · Click to change
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📦</div>
            <div style={{ fontWeight:700, fontSize:'0.95rem' }}>Drop CSV or JSON here</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', marginTop:'0.35rem' }}>or click to browse</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".csv,.json" style={{ display:'none' }}
        onChange={e => handleFile(e.target.files[0])} />

      {/* Preview table */}
      {preview.length > 0 && !results && (
        <div style={{ marginBottom:'1.25rem' }}>
          <div style={{ fontWeight:700, fontSize:'0.88rem', marginBottom:'0.6rem', color:'var(--text-muted)' }}>
            Preview (first {preview.length} rows):
          </div>
          <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid var(--border)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
              <thead>
                <tr style={{ background:'var(--bg-elevated)' }}>
                  {['Title','Author','Genre','Status','Cover'].map(h => (
                    <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'var(--text-dim)',
                      fontWeight:700, textTransform:'uppercase', fontSize:'0.65rem', letterSpacing:0.5 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                    <td style={{ padding:'0.5rem 0.75rem', fontWeight:600 }}>{row.title}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'var(--text-muted)' }}>{row.author}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'var(--text-muted)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.genre}</td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      <span style={{ background: row.status==='ONGOING'?'rgba(34,197,94,0.15)':row.status==='COMPLETED'?'rgba(59,130,246,0.15)':'rgba(245,158,11,0.15)',
                        color: row.status==='ONGOING'?'#22c55e':row.status==='COMPLETED'?'#3b82f6':'#f59e0b',
                        padding:'0.1rem 0.5rem', borderRadius:4, fontSize:'0.7rem', fontWeight:700 }}>
                        {row.status || 'ONGOING'}
                      </span>
                    </td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      {row.coverImage ? (
                        <img src={row.coverImage} alt="" style={{ width:28, height:38, objectFit:'cover', borderRadius:4 }}
                          onError={e => e.target.style.display='none'} />
                      ) : <span style={{ color:'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={importAll} disabled={importing}
            style={{ marginTop:'1rem', background:'var(--accent-main)', color:'#fff', border:'none',
              padding:'0.7rem 2rem', borderRadius:10, fontWeight:700, fontSize:'0.9rem',
              cursor:importing?'default':'pointer', opacity:importing?0.7:1 }}>
            {importing ? '⏳ Importing…' : `📦 Import All Comics`}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem' }}>
          <div style={{ fontSize:'1.5rem', marginBottom:'0.75rem' }}>{results.failed === 0 ? '🎉' : '⚠️'}</div>
          <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.5rem' }}>
            Import Complete: {results.created}/{results.total} created
          </div>
          {results.failed > 0 && (
            <div style={{ fontSize:'0.82rem', color:'var(--accent-main)', marginBottom:'0.5rem' }}>
              {results.failed} failed
            </div>
          )}
          {results.errors.length > 0 && (
            <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'0.75rem', fontSize:'0.75rem',
              color:'var(--text-dim)', maxHeight:120, overflowY:'auto' }}>
              {results.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <button onClick={() => { setFile(null); setPreview([]); setResults(null); }}
            style={{ marginTop:'1rem', background:'var(--accent-main)', color:'#fff', border:'none',
              padding:'0.55rem 1.2rem', borderRadius:8, fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
            Import More
          </button>
        </div>
      )}
    </div>
  );
}

export default BulkImportTab;
