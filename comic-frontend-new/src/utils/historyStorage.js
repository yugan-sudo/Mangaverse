// Generate a user-specific storage key for reading history
export function getHistoryKey(user) {
  if (user && user.id) {
    return `reading_history_${user.id}`;
  }
  if (user && user.username) {
    return `reading_history_${user.username}`;
  }
  // Fallback for anonymous users (store separately so they don't mix with logged-in users)
  return 'reading_history_anonymous';
}

// Generate a user-specific storage key for read chapters
export function getReadChaptersKey(user, comicId) {
  const userKey = user && user.id ? user.id : (user && user.username ? user.username : 'anonymous');
  return `read_${comicId}_${userKey}`;
}

// Get user's reading history from localStorage
export function getReadingHistory(user) {
  const key = getHistoryKey(user);
  return JSON.parse(localStorage.getItem(key) || '[]');
}

// Save user's reading history to localStorage
export function saveReadingHistory(user, history) {
  const key = getHistoryKey(user);
  localStorage.setItem(key, JSON.stringify(history));
}

// Clear user's reading history from localStorage
export function clearReadingHistory(user) {
  const key = getHistoryKey(user);
  localStorage.removeItem(key);
}

// Get user's read chapters for a comic
export function getReadChapters(user, comicId) {
  const key = getReadChaptersKey(user, comicId);
  return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
}

// Add a chapter to user's read list
export function markChapterAsRead(user, comicId, chapterId) {
  const key = getReadChaptersKey(user, comicId);
  const readSet = getReadChapters(user, comicId);
  readSet.add(Number(chapterId));
  localStorage.setItem(key, JSON.stringify([...readSet]));
}

