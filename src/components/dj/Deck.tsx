import { useState } from 'react';
import type { Channel } from '../../audio/engine';
import { useChannel } from '../../audio/useChannel';
import { MAX_RATE, MIN_RATE, phaseAlignedPosition, syncRate } from '../../audio/mixMath';
import { albumById } from '../../data/albums';
import { Icon } from '../ui/Icon';
import { VinylRecord } from '../stage/VinylRecord';
import { Tonearm } from '../stage/Tonearm';
import { ProgressBar } from '../stage/ProgressBar';
import './dj.css';

type Props = { id: 'A' | 'B'; channel: Channel; other: Channel; onLoad: () => void };

const STATUS_COPY: Record<string, string> = {
  EMPTY: 'Empty — load a record',
  LOADING: 'Loading…',
  LOADED: 'Loaded',
  CUE: 'Cue point set',
  PLAYING: 'Playing',
  PAUSED: 'Paused',
  UNAVAILABLE: 'Unavailable',
};

export function Deck({ id, channel, other, onLoad }: Props) {
  const st = useChannel(channel);
  const ot = useChannel(other);
  const [note, setNote] = useState<string | null>(null);
  const album = albumById(st.albumId);
  const otherAlbum = albumById(ot.albumId);
  const ready = channel.canPlay;
  const playing = st.status === 'PLAYING';
  const effBpm = album?.bpm ? album.bpm * st.rate : null;
  const otherEff = otherAlbum?.bpm && other.canPlay ? otherAlbum.bpm * ot.rate : null;
  const canSync = ready && !!effBpm && !!otherEff;
  const inSync = canSync && Math.abs(effBpm! - otherEff!) < 0.05;
  const pitchPct = (st.rate - 1) * 100;

  const sync = () => {
    if (!album?.bpm || !otherAlbum?.bpm) return;
    const r = syncRate(otherAlbum.bpm, ot.rate, album.bpm);
    if (r === null) {
      setNote(`Tempo gap too wide to sync within ±${Math.round((MAX_RATE - 1) * 100)}%.`);
      return;
    }
    channel.setRate(r);
    if (playing && ot.status === 'PLAYING') {
      // positions are in track seconds, so beat length uses each track's original BPM
      channel.seek(phaseAlignedPosition(other.position(), otherAlbum.bpm, channel.position(), album.bpm, st.duration));
      setNote('Tempo & beat phase matched to the other deck.');
    } else {
      setNote('Tempo matched. Press SYNC while both decks play to align beats.');
    }
  };

  return (
    <section className={`deck deck--${id}`} aria-label={`Deck ${id}`}>
      <header className="deck__head">
        <span className="deck__name pixel">Deck {id}</span>
        <span className="deck__status" data-status={st.status} role="status" aria-live="polite">
          <span className="deck__led" aria-hidden="true" />
          {st.status}
          <span className="sr-only"> — {STATUS_COPY[st.status]}</span>
        </span>
      </header>

      <div className="deck__plinth">
        <div className="deck__platter" aria-hidden="true">
          <div className="deck__mat" />
          {album ? <VinylRecord album={album} spinning={playing} rate={st.rate} className="deck__vinyl" key={album.id} /> : <div className="deck__empty-plate">♡</div>}
          <Tonearm down={playing} className="deck__arm" />
        </div>
        <div className="deck__pitch">
          <label className="pixel" htmlFor={`pitch-${id}`}>Pitch</label>
          <input
            id={`pitch-${id}`}
            type="range"
            className="fader fader--vertical fader--pitch"
            min={MIN_RATE}
            max={MAX_RATE}
            step={0.001}
            value={st.rate}
            disabled={!ready}
            onChange={(e) => {
              channel.setRate(Number(e.target.value));
              setNote(null);
            }}
            onDoubleClick={() => channel.setRate(1)}
            aria-valuetext={`${pitchPct >= 0 ? '+' : ''}${pitchPct.toFixed(1)} percent`}
          />
          <span className="deck__pitch-val">{pitchPct >= 0 ? '+' : ''}{pitchPct.toFixed(1)}%</span>
        </div>
      </div>

      <div className="deck__info">
        <p className="deck__title">{album ? album.trackTitle ?? album.title : 'No record loaded'}</p>
        <p className="deck__artist">{album ? `${album.artist} · ${album.title}` : 'Tap LOAD to pick from the shelf'}</p>
        <p className="deck__bpm">
          {effBpm ? (
            <>
              <strong>{effBpm.toFixed(1)}</strong> BPM{st.rate !== 1 && <span> (orig. {album!.bpm})</span>}
            </>
          ) : album ? 'BPM unknown' : '— BPM'}
        </p>
      </div>

      <ProgressBar
        getPosition={() => channel.position()}
        onSeek={(t) => channel.seek(t)}
        playing={playing}
        duration={st.duration}
        enabled={ready}
        label={`Deck ${id} position`}
      />

      <div className="deck__transport">
        <button type="button" className="deck-btn deck-btn--cue" onClick={() => channel.cue()} disabled={!ready} title="While playing: jump back to the cue point. Stopped: set the cue point here." aria-label={`Deck ${id} cue`}>
          <Icon name="cue" /><span>Cue</span>
        </button>
        <button
          type="button"
          className={`deck-btn deck-btn--play ${playing ? 'is-on' : ''}`}
          onClick={() => channel.toggle()}
          disabled={!ready}
          aria-pressed={playing}
          aria-label={playing ? `Pause deck ${id}` : `Play deck ${id}`}
        >
          <Icon name={playing ? 'pause' : 'play'} /><span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button type="button" className="deck-btn" onClick={() => channel.stop()} disabled={!ready || st.status === 'LOADED'} aria-label={`Stop deck ${id}`}>
          <Icon name="stop" /><span>Stop</span>
        </button>
        <button
          type="button"
          className={`deck-btn ${inSync ? 'is-on' : ''}`}
          onClick={sync}
          disabled={!canSync}
          aria-pressed={inSync}
          aria-label={`Sync deck ${id} to deck ${id === 'A' ? 'B' : 'A'}`}
          title={canSync ? 'Match tempo (and beat phase while both play) using catalogue BPM' : 'Needs two loaded decks with known BPM'}
        >
          <Icon name="sync" /><span>Sync</span>
        </button>
        <button type="button" className="deck-btn deck-btn--load" onClick={onLoad} aria-label={`Load a record on deck ${id}`}>
          <Icon name="plus" /><span>Load</span>
        </button>
      </div>
      <p className="deck__note" aria-live="polite">
        {st.status === 'UNAVAILABLE' ? st.message : note ?? ' '}
      </p>
    </section>
  );
}
