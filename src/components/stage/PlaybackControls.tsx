import { useEffect } from 'react';
import type { Album } from '../../types';
import { availableSources, type PlaybackSource, type SourceKind } from '../../audio/adapters';
import { engine } from '../../audio/engine';
import { useChannel } from '../../audio/useChannel';
import { external } from '../../audio/external/store';
import { useExternal } from '../../audio/external/useExternal';
import { Icon } from '../ui/Icon';
import { HeartButton } from '../ui/HeartButton';
import { CoverArt } from './CoverArt';
import { ProgressBar } from './ProgressBar';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';
import { SoundCloudEmbed } from './embeds/SoundCloudEmbed';
import { IframeEmbed } from './embeds/IframeEmbed';
import './stage.css';

type Props = {
  album: Album;
  isFav: boolean;
  onFav: () => void;
  onPrev: () => void;
  onNext: () => void;
  sourceKind: SourceKind;
  onSourceKind: (k: SourceKind) => void;
  /** Only for visitor-added records. */
  onRemove?: () => void;
};

const statusCopy: Record<string, string> = {
  LOADING: 'Warming up the vinyl…',
  LOADED: 'Ready — drop the needle',
  PAUSED: 'Paused',
  PLAYING: 'Now spinning',
  CUE: 'Cued',
  EMPTY: 'Pick a record',
};

/** Compact, translucent "portable player" widget for Shelf Mode. */
export function PlaybackControls({ album, isFav, onFav, onPrev, onNext, sourceKind, onSourceKind, onRemove }: Props) {
  const sources = availableSources(album);
  const source: PlaybackSource | undefined = sources.find((s) => s.kind === sourceKind) ?? sources[0];
  const ch = useChannel(engine.shelf);
  const ext = useExternal();

  // Only one thing plays at a time: leaving the file source pauses the engine.
  useEffect(() => {
    if (source?.kind !== 'file') engine.shelf.pause();
  }, [source?.kind]);

  // Normalise the active source's real state.
  let status: string;
  let duration = 0;
  let controllable = false;
  let message: string | null = null;
  let getPosition = () => 0;
  let onSeek = (_t: number) => {};
  let toggle = () => {};

  if (source?.kind === 'file') {
    const mine = ch.albumId === album.id;
    status = mine ? ch.status : 'LOADING';
    duration = mine ? ch.duration : 0;
    controllable = mine && engine.shelf.canPlay;
    message = mine ? ch.message : null;
    getPosition = () => engine.shelf.position();
    onSeek = (t) => engine.shelf.seek(t);
    toggle = () => engine.shelf.toggle();
  } else if (source?.kind === 'youtube' || source?.kind === 'soundcloud') {
    const mine = ext.albumId === album.id && ext.kind === source.kind;
    status = mine ? ext.status : 'LOADING';
    duration = mine ? ext.duration : 0;
    controllable = mine && external.canControl;
    message = mine ? ext.message : null;
    getPosition = () => external.position();
    onSeek = (t) => external.seek(t);
    toggle = () => external.toggle();
  } else {
    status = source ? 'EMBED' : 'NONE';
  }

  const playing = status === 'PLAYING';
  // show "pause" while a streaming player is buffering after a play request
  const pauseable = playing || (source?.kind !== 'file' && ext.albumId === album.id && ext.buffering);
  const hasTransport = source && (source.kind === 'file' || source.kind === 'youtube' || source.kind === 'soundcloud');

  let statusText: string;
  if (!source) statusText = 'This one’s shy — no preview yet ♡';
  else if (status === 'UNAVAILABLE') statusText = message ?? 'Unavailable';
  else if (status === 'EMBED') statusText = `Use ${source.label}’s player above · login may be needed for full tracks`;
  else if (source.kind !== 'file' && ext.albumId === album.id && ext.buffering) statusText = `Buffering on ${source.label}…`;
  else statusText = statusCopy[status] ?? '';

  return (
    <section className="player" aria-label="Player">
      <div className="player__top">
        <CoverArt album={album} showText={false} className="player__thumb" />
        <div className="player__text">
          <p className="player__track">{album.trackTitle ?? album.title}</p>
          <p className="player__artist">{album.artist}</p>
          {sources.length <= 1 && (
            <span className={`player__badge player__badge--${source?.kind ?? 'none'}`}>{source?.label ?? 'Preview unavailable'}</span>
          )}
        </div>
        <HeartButton size="sm" active={isFav} onToggle={onFav} label={`Favourite ${album.title}`} />
      </div>

      {sources.length > 1 && (
        <div className="source-tabs" role="radiogroup" aria-label="Listen on">
          {sources.map((s) => (
            <button
              key={s.kind}
              type="button"
              role="radio"
              aria-checked={s.kind === source?.kind}
              className={`source-tab source-tab--${s.kind}`}
              onClick={() => onSourceKind(s.kind)}
            >
              {s.short}
            </button>
          ))}
        </div>
      )}

      {source?.kind === 'youtube' && <YouTubeEmbed key={album.id} videoId={source.videoId} listId={source.listId} albumId={album.id} title={album.title} />}
      {source?.kind === 'soundcloud' && <SoundCloudEmbed key={album.id} url={source.url} albumId={album.id} title={album.title} />}
      {source?.kind === 'spotify' && <IframeEmbed kind="spotify" src={source.embedUrl} title={`Spotify player: ${album.title}`} />}
      {source?.kind === 'apple' && <IframeEmbed kind="apple" src={source.embedUrl} title={`Apple Music player: ${album.title}`} />}

      {hasTransport ? (
        <>
          <ProgressBar
            key={`${album.id}-${source!.kind}`}
            getPosition={getPosition}
            onSeek={onSeek}
            playing={playing}
            duration={duration}
            enabled={controllable}
            label="Seek"
            compact
          />
          <div className="player__controls">
            <button type="button" className="pill-btn pill-btn--icon" onClick={onPrev} aria-label="Previous record">
              <Icon name="prev" />
            </button>
            <button
              type="button"
              className={`player__play ${pauseable ? 'is-playing' : ''}`}
              onClick={toggle}
              disabled={!controllable}
              aria-label={pauseable ? `Pause ${album.title}` : `Play ${album.title}`}
              aria-pressed={pauseable}
            >
              <Icon name={pauseable ? 'pause' : 'play'} />
            </button>
            <button type="button" className="pill-btn pill-btn--icon" onClick={onNext} aria-label="Next record">
              <Icon name="next" />
            </button>
          </div>
        </>
      ) : (
        <div className="player__controls player__controls--slim">
          <button type="button" className="pill-btn pill-btn--icon" onClick={onPrev} aria-label="Previous record">
            <Icon name="prev" />
          </button>
          <button type="button" className="pill-btn pill-btn--icon" onClick={onNext} aria-label="Next record">
            <Icon name="next" />
          </button>
        </div>
      )}
      <p className="player__status" role="status" aria-live="polite">{statusText}</p>
      {source?.kind === 'spotify' && source.albumUrl && (
        <a className="player__link" href={source.albumUrl} target="_blank" rel="noreferrer">
          Open in Spotify <Icon name="external" className="icon icon--xs" />
        </a>
      )}
      {source?.kind === 'apple' && (
        <a className="player__link" href={source.openUrl} target="_blank" rel="noreferrer">
          Open in Apple Music <Icon name="external" className="icon icon--xs" />
        </a>
      )}
      {onRemove && (
        <button type="button" className="player__remove" onClick={onRemove}>
          <Icon name="close" className="icon icon--xs" /> Remove from my shelf
        </button>
      )}
    </section>
  );
}
