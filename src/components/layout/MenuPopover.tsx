import { useEffect, useRef, useState } from 'react';
import type { Mode } from '../../types';
import { Icon } from '../ui/Icon';
import './layout.css';

type Props = { mode: Mode; onMode: (m: Mode) => void; favouritesOnly: boolean; onFavouritesOnly: (v: boolean) => void };

export function MenuPopover({ mode, onMode, favouritesOnly, onFavouritesOnly }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    wrap.current?.querySelector<HTMLElement>('[role="menuitemradio"], [role="menuitemcheckbox"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (fn: () => void) => () => {
    fn();
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <div className="menu" ref={wrap}>
      <button
        ref={btn}
        type="button"
        className="pill-btn menu__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? 'close' : 'menu'} />
        Menu
      </button>
      {open && (
        <div
          className="menu__panel"
          role="menu"
          id="main-menu"
          aria-label="Main menu"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            const items = [...(wrap.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
            const i = items.indexOf(document.activeElement as HTMLElement);
            items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
          }}
        >
          <p className="menu__group pixel">View</p>
          <button type="button" role="menuitemradio" aria-checked={mode === 'shelf'} className="menu__item" onClick={choose(() => onMode('shelf'))}>
            <Icon name="shelf" /> Shelf Mode <span className="menu__hint">browse & play</span>
          </button>
          <button type="button" role="menuitemradio" aria-checked={mode === 'dj'} className="menu__item" onClick={choose(() => onMode('dj'))}>
            <Icon name="mixer" /> DJ Mode <span className="menu__hint">2 decks + mixer</span>
          </button>
          <p className="menu__group pixel">Shelf</p>
          <button type="button" role="menuitemcheckbox" aria-checked={favouritesOnly} className="menu__item" onClick={choose(() => onFavouritesOnly(!favouritesOnly))}>
            <Icon name={favouritesOnly ? 'heart-fill' : 'heart'} /> Favourites only
          </button>
          <a role="menuitem" className="menu__item" href="#about-audio" onClick={() => setOpen(false)}>
            <Icon name="info" /> How the audio works
          </a>
        </div>
      )}
    </div>
  );
}
