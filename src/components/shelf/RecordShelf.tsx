import { useEffect, useRef } from 'react';
import type { Album } from '../../types';
import { RecordSpine } from './RecordSpine';
import type { ShelfView } from './ShelfTabs';
import type { WallStatus } from '../../data/wall';
import './shelf.css';

type Props = {
  albums: Album[];
  selectedId: string;
  isFav: (id: string) => boolean;
  onSelect: (id: string) => void;
  view: ShelfView;
  wallStatus: WallStatus;
  wallMessage: string | null;
  onClearFilter: () => void;
  onAdd: () => void;
};

/**
 * Horizontal, scrollable shelf. Implements the WAI-ARIA listbox pattern with
 * roving tabindex: ←/→ (and ↑/↓) move + select, Home/End jump.
 */
export function RecordShelf({ albums, selectedId, isFav, onSelect, view, wallStatus, wallMessage, onClearFilter, onAdd }: Props) {
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
    let msg: string;
    let action: { label: string; run: () => void } | null = { label: 'Back to our shelf', run: onClearFilter };
    if (view === 'favs') msg = 'No hearts yet ♡ — tap the heart on a record you love and it’ll live here.';
    else if (view === 'mine') {
      msg = 'Nothing here yet — paste a playlist link and it becomes a record on your shelf.';
      action = { label: '+ Add your playlist', run: onAdd };
    } else if (wallStatus === 'loading' || wallStatus === 'idle') {
      msg = 'Dusting off the community wall…';
      action = null;
    } else if (wallStatus === 'offline' || wallStatus === 'error') {
      msg = wallMessage ?? 'The community wall is unavailable right now.';
    } else {
      msg = 'The wall is empty — be the first to pin a playlist ✦';
      action = { label: '+ Share your playlist', run: onAdd };
    }
    return (
      <div className="shelf shelf--empty" id="shelf-panel" role="tabpanel" aria-labelledby={`shelf-tab-${view}`}>
        <p role="status">{msg}</p>
        {action && <button type="button" className="pill-btn" onClick={action.run}>{action.label}</button>}
      </div>
    );
  }

  return (
    <div className="shelf" id="shelf-panel" role="tabpanel" aria-labelledby={`shelf-tab-${view}`}>
      <div
        ref={listRef}
        className="shelf__row"
        role="listbox"
        aria-label={view === 'wall' ? 'Community wall records' : view === 'favs' ? 'Favourite records' : view === 'mine' ? 'My records' : 'Record shelf'}
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
      </div>
      <button type="button" className="shelf__add" onClick={onAdd} aria-label={`Add your playlist to the shelf (${albums.length} records)`}>
        <span className="shelf__add-plus" aria-hidden="true">+</span>
        <span className="shelf__add-text">Add your playlist</span>
        <span className="pixel shelf__add-count">{albums.length} records</span>
      </button>
      <div className="shelf__plank" aria-hidden="true" />
    </div>
  );
}
