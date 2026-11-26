import { useEffect, useRef } from 'react';
import type { Album } from '../../types';
import { describeSource } from '../../audio/adapters';
import { CoverArt } from '../stage/CoverArt';
import { Icon } from '../ui/Icon';
import './dj.css';

type Props = {
  target: 'A' | 'B' | null;
  albums: Album[];
  pickedId: string;
  onPick: (albumId: string) => void;
  onClose: () => void;
};

/** Native <dialog> catalogue browser for loading a deck. */
export function TrackPicker({ target, albums, pickedId, onPick, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (target && !d.open) d.showModal();
    if (!target && d.open) d.close();
  }, [target]);

  const ordered = [...albums].sort((a, b) => (a.id === pickedId ? -1 : b.id === pickedId ? 1 : 0));

  return (
    <dialog
      ref={ref}
      className="picker"
      aria-labelledby="picker-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="picker__inner">
        <header className="picker__head">
          <h2 id="picker-title">Load deck {target}</h2>
          <button type="button" className="pill-btn pill-btn--icon" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <ul className="picker__list">
          {ordered.map((a) => {
            const src = describeSource(a);
            return (
              <li key={a.id}>
                <button type="button" className="picker__item" onClick={() => onPick(a.id)}>
                  <CoverArt album={a} showText={false} className="picker__thumb" />
                  <span className="picker__text">
                    <strong>{a.title}</strong>
                    <span>{a.artist}{a.bpm ? ` · ${a.bpm} BPM` : ''}</span>
                  </span>
                  {a.id === pickedId && <span className="picker__tag picker__tag--picked">picked</span>}
                  <span className={`picker__tag picker__tag--${src.kind === 'file' || src.kind === 'none' ? src.kind : 'stream'}`}>{src.kind === 'file' ? 'mixable' : src.kind === 'none' ? 'no preview' : `${src.label} only`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
