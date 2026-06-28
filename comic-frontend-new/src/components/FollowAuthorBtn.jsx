import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

// ─── Reusable Follow Author button ───────────────────────────────────────
// Usage: <FollowAuthorBtn authorName="Kishimoto M." />
export default function FollowAuthorBtn({ authorName }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Load follow state from backend on mount
  useEffect(() => {
    if (!user || !authorName) return;
    api.get(`/authors/${encodeURIComponent(authorName)}/following`)
      .then(r => setFollowing(r.data.following || false))
      .catch(() => {});
  }, [user, authorName]);

  const toggle = async () => {
    if (!user) return alert('Please login to follow authors.');
    setLoading(true);
    try {
      const { data } = await api.post(`/authors/${encodeURIComponent(authorName)}/follow`);
      setFollowing(data.following);
    } catch {
      setFollowing(f => !f); // demo toggle
    }
    setLoading(false);
  };

  if (!authorName) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={following ? 'btn-accent' : 'btn-outline'}
      style={{ fontSize:'0.78rem', padding:'0.35rem 0.9rem', borderRadius:40 }}>
      {loading ? '…' : following ? '✓ Following' : '+ Follow Author'}
    </button>
  );
}
