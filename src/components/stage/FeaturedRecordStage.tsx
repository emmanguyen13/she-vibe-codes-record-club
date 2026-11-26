import type { Album } from '../../types';
import { engine } from '../../audio/engine';
import { useChannel } from '../../audio/useChannel';
import { AlbumSleeve } from './AlbumSleeve';
import { VinylRecord } from './VinylRecord';
import { Tonearm } from './Tonearm';
import { PlaybackControls } from './PlaybackControls';
import { StageSticker } from './StageSticker';
import './stage.css';

type Props = { album: Album; isFav: boolean; onFav: () => void; onPrev: () => void; onNext: () => void };

export function FeaturedRecordStage({ album, isFav, onFav, onPrev, onNext }: Props) {
  const ch = useChannel(engine.shelf);
  const playing = ch.status === 'PLAYING' && ch.albumId === album.id;
  const meta = [album.year, album.format, album.genre, album.bpm ? `${album.bpm} BPM` : null].filter(Boolean);

  return (
    <div className="featured">
      <StageSticker />
      <div className="featured__deck" aria-hidden="true">
        <div className="turntable" key={album.id}>
          <div className="turntable__vinyl-slot">
            <VinylRecord album={album} spinning={playing} />
          </div>
          <div className="turntable__sleeve-slot">
            <AlbumSleeve album={album} />
            <span className="picked-sticker pixel">picked ♥</span>
          </div>
          <Tonearm down={playing} className="turntable__arm" />
        </div>
      </div>
      <div className="featured__meta" aria-live="polite">
        <p className="featured__artist pixel">{album.artist}</p>
        <h2 className="featured__title">{album.title}</h2>
        <p className="featured__info">{meta.join(' · ')}</p>
        {album.label && <p className="featured__label">{album.label}</p>}
      </div>
      <div className="featured__player">
        <PlaybackControls album={album} isFav={isFav} onFav={onFav} onPrev={onPrev} onNext={onNext} />
      </div>
    </div>
  );
}
