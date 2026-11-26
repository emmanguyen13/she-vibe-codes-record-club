import { forwardRef } from 'react';
import type { Album } from '../../types';
import { readableInk } from '../../lib/color';
import { describeSource } from '../../audio/adapters';
import { CoverArt } from '../stage/CoverArt';
import './shelf.css';

type Props = {
  album: Album;
  selected: boolean;
  isFav: boolean;
  focusable: boolean;
  index: number;
  onSelect: () => void;
};

const motifs = ['♥', '✦', '☆', '✿', '☺', '♪'];

function widthFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 46 + (h % 5) * 5; // 46–66px
}

export const RecordSpine = forwardRef<HTMLButtonElement, Props>(function RecordSpine(
  { album, selected, isFav, focusable, index, onSelect },
  ref,
) {
  const ink = readableInk(album.spineColor);
  const available = describeSource(album).kind !== 'none';
  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={selected}
      tabIndex={focusable ? 0 : -1}
      className={`spine ${selected ? 'is-selected' : ''} ${available ? '' : 'is-unavailable'}`}
      style={{ '--spine': album.spineColor, '--spine-ink': ink, '--w': `${widthFor(album.id)}px` } as React.CSSProperties}
      onClick={onSelect}
      aria-label={`${album.title} by ${album.artist}${available ? '' : ' (no preview)'}${isFav ? ', favourite' : ''}`}
    >
      <span className="spine__card-art" aria-hidden="true">
        <CoverArt album={album} showText={false} />
      </span>
      <span className="spine__text" aria-hidden="true">
        <span className="spine__title">{album.title}</span>
        <span className="spine__artist">{album.artist}</span>
      </span>
      <span className="spine__dot" aria-hidden="true">{isFav ? '♥' : motifs[index % motifs.length]}</span>
      {selected && <span className="spine__picked pixel" aria-hidden="true">on deck</span>}
    </button>
  );
});
