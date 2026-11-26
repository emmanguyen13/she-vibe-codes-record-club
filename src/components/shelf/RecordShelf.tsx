import { useEffect, useRef } from 'react';
import type { Album } from '../../types';
import { RecordSpine } from './RecordSpine';
import './shelf.css';

type Props = {
  albums: Album[];
  selectedId: string;
  isFav: (id: string) => boolean;
  onSelect: (id: string) => void;
  favouritesOnly: boolean;
  onClearFilter: () => void;
};

/**
 * Horizontal, scrollable shelf. Implements the WAI-ARIA listbox pattern with
 * roving tabindex: ←/→ (and ↑/↓) move + select, Home/End jump.
 */
export function RecordShelf({ albums, selectedId, isFav, onSelect, favouritesOnly, onClearFilter }: Props) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIndex = albums.findIndex((a) => a.id === selectedId);
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex;

  // keep the selected spine in view (no page scroll, only the shelf)
  useEffect(() => {
    const el = refs.current.get(selectedId);
    const list = listRef.current;
    if (!el || !list) return;
    const target = el.offsetLeft - list.clientWidth / 2 + el.offsetWidth / 2;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' });
  }, [selectedId]);

  const move = (i: number) => {
    const n = albums.length;
    if (!n) return;
    const next = albums[((i % n) + n) % n];
    onSelect(next.id);
    refs.current.get(next.id)?.focus({ preventScroll: true });
  };

  if (!albums.length) {
    return (
      <div className="shelf shelf--empty">
        <p>
          No hearts yet ♡ — tap the heart on a record you love and it’ll live here.
        </p>
        <button type="button" className="pill-btn" onClick={onClearFilter}>Show the whole shelf</button>
      </div>
    );
  }

  return (
    <div className="shelf">
      <div
        ref={listRef}
        className="shelf__row"
        role="listbox"
        aria-label={favouritesOnly ? 'Favourite records' : 'Record shelf'}
        aria-orientation="horizontal"
        onKeyDown={(e) => {
          const keys: Record<string, number> = {
            ArrowRight: focusIndex + 1, ArrowDown: focusIndex + 1, ArrowLeft: focusIndex - 1, ArrowUp: focusIndex - 1,
            Home: 0, End: albums.length - 1,
          };
          if (e.key in keys) {
            e.preventDefault();
            move(keys[e.key]);
          }
        }}
      >
        {albums.map((a, i) => (
          <RecordSpine
            key={a.id}
            ref={(el) => {
              if (el) refs.current.set(a.id, el);
              else refs.current.delete(a.id);
            }}
            album={a}
            index={i}
            selected={a.id === selectedId}
            focusable={i === focusIndex}
            isFav={isFav(a.id)}
            onSelect={() => onSelect(a.id)}
          />
        ))}
        <div className="shelf__bookend" aria-hidden="true">
          <span className="pixel">{albums.length} records</span>
          <span className="shelf__bookend-heart">♥</span>
        </div>
      </div>
      <div className="shelf__plank" aria-hidden="true" />
    </div>
  );
}
