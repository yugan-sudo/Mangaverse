import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axiosConfig';

const RatingContext = createContext(null);

export function RatingProvider({ children }) {
  // Cache ratings in memory so we don't re-fetch same comic twice
  const [cache, setCache] = useState({});

  // Fetch rating for a comic (returns { average, count, userRating })
  const fetchRating = useCallback(async (comicId) => {
    if (cache[comicId]) return cache[comicId];
    try {
      const { data } = await api.get(`/comics/${comicId}/rating`);
      setCache(prev => ({ ...prev, [comicId]: data }));
      return data;
    } catch {
      return { average: 0, count: 0, userRating: 0 };
    }
  }, [cache]);

  // Submit a star rating
  const submitRating = useCallback(async (comicId, stars) => {
    try {
      const { data } = await api.post(`/comics/${comicId}/rating`, { stars });
      setCache(prev => ({ ...prev, [comicId]: data }));
      return data;
    } catch {
      return null;
    }
  }, []);

  return (
    <RatingContext.Provider value={{ fetchRating, submitRating }}>
      {children}
    </RatingContext.Provider>
  );
}

export function useRating() { return useContext(RatingContext); }
