import './shelf.css';

export type ShelfView = 'all' | 'wall' | 'mine' | 'favs';

const TABS: { id: ShelfView; label: string }[] = [
  { id: 'all', label: 'Our shelf' },
  { id: 'wall', label: 'Community wall' },
  { id: 'mine', label: 'My links' },
  { id: 'favs', label: '♥ Favourites' },
];

/** Which crate you're digging in. Tabs pattern with arrow-key support. */
export function ShelfTabs({ view, onView, counts }: {
  view: ShelfView;
  onView: (v: ShelfView) => void;
  counts: Record<ShelfView, number | null>;
}) {
  return (
    <div className="shelf-tabs" role="tablist" aria-label="Shelf">
      {TABS.map((t, i) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`shelf-tab-${t.id}`}
          aria-selected={view === t.id}
          aria-controls="shelf-panel"
          tabIndex={view === t.id ? 0 : -1}
          className="shelf-tab"
          onClick={() => onView(t.id)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
            onView(next.id);
            document.getElementById(`shelf-tab-${next.id}`)?.focus();
          }}
        >
          {t.label}
          {counts[t.id] !== null && <span className="shelf-tab__count">{counts[t.id]}</span>}
        </button>
      ))}
    </div>
  );
}
