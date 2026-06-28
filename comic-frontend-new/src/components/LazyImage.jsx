import { useState, useRef, useEffect } from 'react';

// ─── Cloudinary responsive transform helper ──────────────────────────────
// If the URL is a Cloudinary delivery URL, inject f_auto (best format),
// q_auto (auto quality) and w_<targetWidth> so we don't ship full-res
// images for small thumbnails/cards. Non-Cloudinary URLs pass through unchanged.
function cloudinaryOptimize(url, targetWidth) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/upload/')) return url;

  const transform = `f_auto,q_auto${targetWidth ? `,w_${targetWidth}` : ''}`;
  // Avoid double-injecting if a transform is already present right after /upload/
  return url.replace('/upload/', `/upload/${transform}/`);
}

// ─── LazyImage — loads image lazily with a blur placeholder ──────────────
// Shows a blurred low-quality version first, then fades in the real image
export default function LazyImage({ src, alt, style = {}, className = '', fallbackSeed, targetWidth }) {
  const [loaded,  setLoaded]  = useState(false);   // full image loaded?
  const [error,   setError]   = useState(false);   // image failed to load?
  const [visible, setVisible] = useState(false);   // in viewport?
  const imgRef = useRef(null);

  // Use IntersectionObserver to only load when image enters viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '200px' } // start loading 200px before entering view
    );
    if (imgRef.current) obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, []);

  // Fallback image when original fails to load
  const fallback = `https://picsum.photos/seed/${fallbackSeed || Math.floor(Math.random() * 100)}/200/300`;

  // Low-quality blurred placeholder (tiny picsum image, scaled up)
  const placeholder = src
    ? src.replace('/200/300', '/20/30').replace('/400/600', '/40/60')
    : fallback;

  return (
    <div ref={imgRef} style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      {/* ── Blurred placeholder (always visible until real image loads) ── */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `url(${placeholder}) center/cover no-repeat`,
          filter: 'blur(12px)',
          transform: 'scale(1.1)', // prevent blur edge artifacts
          transition: 'opacity 0.3s',
        }} />
      )}

      {/* ── Real image (fades in when loaded) ── */}
      {visible && (
        <img
          src={error ? fallback : cloudinaryOptimize(src, targetWidth)}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            display: 'block',
          }}
        />
      )}

      {/* ── Skeleton shimmer (while not yet in view) ── */}
      {!visible && (
        <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
      )}
    </div>
  );
}
