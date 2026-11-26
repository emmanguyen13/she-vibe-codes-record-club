import type { Album } from '../../types';
import { describeSource } from '../../audio/adapters';
import { engine } from '../../audio/engine';
import { useChannel } from '../../audio/useChannel';
import { Icon } from '../ui/Icon';
import { HeartButton } from '../ui/HeartButton';
import { CoverArt } from './CoverArt';
import { ProgressBar } from './ProgressBar';
import './stage.css';

type Props = { album: Album; isFav: boolean; onFav: () => void; onPrev: () => void; onNext: () => void };

const statusCopy: Record<string, string> = {
  LOADING: 'Warming up the vinyl…',
  LOADED: 'Ready — drop the needle',
  PAUSED: 'Paused',
  PLAYING: 'Now spinning',
  CUE: 'Cued',
  EMPTY: 'Pick a record',
};

/** Compact, translucent "portable player" widget for Shelf Mode. */
export function PlaybackControls({ album, isFav, onFav, onPrev, onNext }: Props) {
  const ch = useChannel(engine.shelf);
  const source = describeSource(album);
  const playing = ch.status === 'PLAYING';
  const canPlay = source.kind === 'file' && ch.albumId === album.id && ch.status !== 'LOADING' && ch.status !== 'UNAVAILABLE';
  const status = ch.status === 'UNAVAILABLE' ? ch.message ?? 'Unavailable' : statusCopy[ch.status];

  return (
    <section className="player" aria-label="Player">
      <div className="player__top">
        <CoverArt album={album} showText={false} className="player__thumb" />
        <div className="player__text">
          <p className="player__track">{album.trackTitle ?? album.title}</p>
          <p className="player__artist">{album.artist}</p>
          <span className={`player__badge player__badge--${source.kind}`}>{source.label}</span>
        </div>
        <HeartButton size="sm" active={isFav} onToggle={onFav} label={`Favourite ${album.title}`} />
      </div>

      {source.kind === 'spotify' ? (
        <div className="player__spotify">
          <iframe
            title={`Spotify player: ${album.title}`}
            src={source.embedUrl}
            width="100%"
            height="80"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
          <p className="player__note">Playback happens in Spotify’s player above (Spotify login may be required for full tracks).</p>
        </div>
      ) : (
        <>
          <ProgressBar channel={engine.shelf} status={ch.albumId === album.id ? ch.status : 'LOADING'} duration={ch.albumId === album.id ? ch.duration : 0} label="Seek" compact />
          <div className="player__controls">
            <button type="button" className="pill-btn pill-btn--icon" onClick={onPrev} aria-label="Previous record">
              <Icon name="prev" />
            </button>
            <button
              type="button"
              className={`player__play ${playing ? 'is-playing' : ''}`}
              onClick={() => engine.shelf.toggle()}
              disabled={!canPlay}
              aria-label={playing ? `Pause ${album.title}` : `Play ${album.title}`}
              aria-pressed={playing}
            >
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
            <button type="button" className="pill-btn pill-btn--icon" onClick={onNext} aria-label="Next record">
              <Icon name="next" />
            </button>
          </div>
        </>
      )}
      <p className="player__status" role="status" aria-live="polite">
        {source.kind === 'none' ? 'This one’s shy — no preview yet ♡' : source.kind === 'spotify' ? 'Spotify embed' : status}
      </p>
      {source.kind === 'spotify' && source.albumUrl && (
        <a className="player__link" href={source.albumUrl} target="_blank" rel="noreferrer">
          Open in Spotify <Icon name="external" className="icon icon--xs" />
        </a>
      )}
    </section>
  );
}
