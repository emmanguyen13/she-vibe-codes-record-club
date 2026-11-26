import { useCallback, useEffect, useRef, useState } from 'react';

const FAV_KEY = 'svc-record-club:favourites';

function readFavourites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Favourites persisted to localStorage (falls back to memory if storage is blocked). */
export function useFavourites() {
  const [favs, setFavs] = useState<string[]>(readFavourites);
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {
      /* private mode / storage disabled → in-memory only */
    }
  }, [favs]);
  const toggle = useCallback(
    (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    [],
  );
  const isFav = useCallback((id: string) => favs.includes(id), [favs]);
  return { favs, toggle, isFav };
}

/** Runs `cb` every animation frame while `active` is true. */
export function useAnimationFrame(cb: () => void, active: boolean) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) {
      ref.current();
      return;
    }
    let raf = 0;
    const loop = () => {
      ref.current();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
