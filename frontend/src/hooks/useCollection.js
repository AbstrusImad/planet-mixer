import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'planet-mixer.collection.v1';

function load() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Persistent discovered-planet collection backed by localStorage.
export function useCollection() {
  const [collection, setCollection] = useState(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch {
      /* storage may be full or blocked */
    }
  }, [collection]);

  const has = useCallback((id) => collection.some((p) => p.id === id), [collection]);

  // Returns { added, planet }. added=false means it already existed.
  const add = useCallback((planet) => {
    let added = false;
    setCollection((prev) => {
      if (prev.some((p) => p.id === planet.id)) return prev;
      added = true;
      return [{ ...planet, discoveredAt: Date.now() }, ...prev];
    });
    return added;
  }, []);

  const clear = useCallback(() => setCollection([]), []);

  return { collection, add, has, clear };
}
