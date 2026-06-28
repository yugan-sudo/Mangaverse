import { useEffect } from 'react';

/**
 * useSEO — sets all SEO meta tags for each page
 * Supports: title, description, image, type, author, keywords, canonicalUrl
 */
export default function useSEO({
  title,
  description,
  image,
  type       = 'website',
  author,
  keywords,
  canonicalUrl,
  noindex    = false,
} = {}) {
  useEffect(() => {
    const SITE      = 'MangaVerse';
    const SITE_DESC = 'Read manga, manhwa and manhua online for free. Thousands of titles updated daily.';
    const fullTitle = title ? `${title} | ${SITE}` : SITE;
    const desc      = description
      ? description.slice(0, 160)
      : SITE_DESC;
    const img       = image || '';
    const canonical = canonicalUrl || window.location.href;

    // ── Page title ──────────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Helper ──────────────────────────────────────────────────────────
    const setMeta = (key, val, isProperty = false) => {
      if (!val) return;
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // ── Standard meta ───────────────────────────────────────────────────
    setMeta('description',      desc);
    if (keywords) setMeta('keywords', keywords);
    if (author)   setMeta('author',   author);
    if (noindex)  setMeta('robots',   'noindex, nofollow');

    // ── Open Graph ──────────────────────────────────────────────────────
    setMeta('og:site_name',   SITE,       true);
    setMeta('og:title',       fullTitle,  true);
    setMeta('og:description', desc,       true);
    setMeta('og:type',        type,       true);
    setMeta('og:url',         canonical,  true);
    if (img) {
      setMeta('og:image',            img,  true);
      setMeta('og:image:width',      '1200', true);
      setMeta('og:image:height',     '630',  true);
      setMeta('og:image:alt',        title || SITE, true);
    }

    // ── Twitter Card ────────────────────────────────────────────────────
    setMeta('twitter:card',        img ? 'summary_large_image' : 'summary');
    setMeta('twitter:title',       fullTitle);
    setMeta('twitter:description', desc);
    if (img) setMeta('twitter:image', img);

    // ── Canonical link ──────────────────────────────────────────────────
    setLink('canonical', canonical);

    // ── Reset on unmount ────────────────────────────────────────────────
    return () => {
      document.title = SITE;
    };
  }, [title, description, image, type, author, keywords, canonicalUrl, noindex]);
}
