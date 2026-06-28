import { useState, useEffect } from 'react';

/**
 * Tracks the OS-level "prefers-reduced-motion" setting and stays in sync if
 * the user changes it while the app is open.
 *
 * Use this for any inline-styled transform/opacity transitions driven by
 * React state — CSS class-based transitions are already covered by the
 * global `@media (prefers-reduced-motion: reduce)` rule in index.css, but
 * inline `style={{ transition: '...' }}` values bypass that rule entirely
 * since they're not toggled via a class the media query can target.
 *
 * Usage:
 *   const reducedMotion = usePrefersReducedMotion();
 *   style={{ transition: reducedMotion ? 'none' : 'transform 0.25s ease' }}
 */
export default function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
