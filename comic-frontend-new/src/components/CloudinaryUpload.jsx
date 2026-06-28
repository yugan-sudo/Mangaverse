import { useState, useRef } from 'react';
import { uploadToCloudinary, uploadMultiple } from '../utils/cloudinary';

// ─── Single image uploader (cover image) ──────────────────────────────────
export function CoverUploader({ onUploaded }) {
  const [preview,    setPreview]    = useState('');
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    // Show local preview immediately while uploading
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file, setProgress);
      onUploaded(url);   // send URL up to parent form
    } catch (e) {
      setError(e.message);
      setPreview('');
    }
    setUploading(false);
    setProgress(0);
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${preview ? 'var(--accent-main)' : 'var(--border)'}`,
          borderRadius: 12, padding: '1.25rem',
          textAlign: 'center', cursor: 'pointer',
          background: preview ? 'rgba(233,69,96,0.04)' : 'var(--bg-elevated)',
          transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
          minHeight: 140,
        }}>

        {preview ? (
          <img src={preview} alt="Cover preview"
            style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover', display: 'block', margin: '0 auto' }} />
        ) : (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
            <div style={{ fontWeight: 600 }}>Click or drag cover image here</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              JPG, PNG, WEBP · Max 10MB
            </div>
          </div>
        )}

        {/* Progress bar overlay */}
        {uploading && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.6)', padding: '0.5rem 0.75rem',
          }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`,
                background: 'var(--accent-main)', transition: 'width 0.2s', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fff', marginTop: 4, textAlign: 'center' }}>
              Uploading… {progress}%
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={inputRef} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />

      {/* Error */}
      {error && (
        <div style={{ color: '#e94560', fontSize: '0.8rem', marginTop: '0.4rem' }}>❌ {error}</div>
      )}

      {/* Success */}
      {preview && !uploading && !error && (
        <div style={{ color: '#38b060', fontSize: '0.78rem', marginTop: '0.4rem' }}>
          ✅ Cover uploaded to Cloudinary
          <button onClick={() => { setPreview(''); onUploaded(''); }}
            style={{ marginLeft: '0.5rem', background: 'none', border: 'none',
              color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem' }}>
            Change
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Multi-page uploader (chapter pages) ─────────────────────────────────
export function PagesUploader({ onUploaded }) {
  const [files,     setFiles]     = useState([]);    // File[] selected
  const [previews,  setPreviews]  = useState([]);    // local preview URLs
  const [progress,  setProgress]  = useState(0);     // overall %
  const [current,   setCurrent]   = useState(0);     // page being uploaded
  const [total,     setTotal]     = useState(0);     // total pages
  const [uploading, setUploading] = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');
  const inputRef = useRef();

  const handleFiles = (selected) => {
    if (!selected.length) return;
    const arr = Array.from(selected);
    // Sort by filename so pages are in order
    arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
    setDone(false);
    setError('');
  };

  const removeFile = (i) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setProgress(0);
    setTotal(files.length);
    try {
      const urls = await uploadMultiple(files, (overall, cur, tot) => {
        setProgress(overall);
        setCurrent(cur);
        setTotal(tot);
      });
      onUploaded(urls);   // send array of URLs up to parent
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setUploading(false);
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: '2px dashed var(--border)', borderRadius: 12,
          padding: '1.25rem', textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: 'var(--bg-elevated)', transition: 'border-color 0.2s',
          marginBottom: '0.75rem',
        }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
          {files.length > 0
            ? `${files.length} pages selected — click to add more`
            : 'Click or drag all chapter page images here'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          Select multiple files at once · Sorted by filename automatically
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />

      {/* Page previews grid */}
      {previews.length > 0 && (
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '0.5rem', marginBottom: '0.75rem' }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={src} alt={`Page ${i + 1}`}
                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover',
                  borderRadius: 8, display: 'block' }} />
              {/* Page number */}
              <div style={{ position: 'absolute', bottom: 4, left: 4,
                background: 'rgba(0,0,0,0.7)', color: '#fff',
                fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.3rem',
                borderRadius: 4 }}>
                {i + 1}
              </div>
              {/* Remove button */}
              {!uploading && (
                <button onClick={() => removeFile(i)}
                  style={{ position: 'absolute', top: 3, right: 3,
                    background: 'rgba(233,69,96,0.85)', color: '#fff',
                    border: 'none', borderRadius: '50%', width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 }}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10,
          padding: '0.85rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span>Uploading page {current} of {total}…</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #4361ee, #e94560)',
              transition: 'width 0.3s', borderRadius: 3 }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: '#e94560', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          ❌ {error}
        </div>
      )}

      {done && (
        <div style={{ color: '#38b060', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          ✅ All {files.length} pages uploaded to Cloudinary!
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && !done && (
        <button onClick={upload} disabled={uploading} className="btn-accent"
          style={{ width: '100%', marginBottom: '0.5rem' }}>
          {uploading
            ? `Uploading ${current}/${total} pages…`
            : `☁️ Upload ${files.length} Pages to Cloudinary`}
        </button>
      )}
    </div>
  );
}
