import type { Album, Mode } from '../../types';
import { siteConfig } from '../../config';
import type { SourceKind } from '../../audio/adapters';
import { CoverArt } from '../stage/CoverArt';
import { Icon } from '../ui/Icon';
import './layout.css';

type Props = {
  album: Album;
  mode: Mode;
  favourites: Album[];
  onSelect: (id: string) => void;
  onLiveDemo: () => void;
  liveDemoLabel: string;
  liveDemoEnabled: boolean;
  sourceKind: SourceKind;
};

export function InfoPanel({ album, favourites, onSelect, onLiveDemo, liveDemoLabel, liveDemoEnabled, sourceKind: kind }: Props) {
  const playable = liveDemoEnabled;
  return (
    <aside className="info" aria-label="About this project">
      <section className="info-card info-card--hero">
        <p className="info__eyebrow pixel">Web system</p>
        <h1 className="info__title">
          {siteConfig.brand.split(' ').map((w) => (
            <span key={w}>{w} </span>
          ))}
        </h1>
        <p className="info__product">
          {siteConfig.productName} <span aria-hidden="true">♡</span>
        </p>
        <p className="info__tagline">{siteConfig.tagline}</p>
        <p className="info__desc">{siteConfig.description}</p>
        <button type="button" className="pill-btn pill-btn--ink info__cta" onClick={onLiveDemo} disabled={!playable}>
          <Icon name="play" /> Live demo
          <span className="info__cta-sub">{playable ? liveDemoLabel : kind === 'none' ? 'pick a record with a preview' : kind === 'spotify' || kind === 'apple' ? 'use the embedded player' : 'loading…'}</span>
        </button>
        <p className="info__credit">
          <span className="info__avatar" aria-hidden="true">✦</span>
          {siteConfig.credit}
        </p>
      </section>

      <section className="info-card" id="about-audio" aria-labelledby="audio-h">
        <h2 id="audio-h" className="info__h2">What’s real here</h2>
        <ul className="checklist">
          <li><span aria-hidden="true">✓</span> Original loops synthesised for this project — real audio, no samples.</li>
          <li><span aria-hidden="true">✓</span> Spinning vinyl, tonearm and meters follow the actual playback state.</li>
          <li><span aria-hidden="true">✓</span> DJ Mode: two independent decks, 3-band EQ, volume, crossfader, pitch & BPM sync via Web Audio.</li>
          <li><span aria-hidden="true">✓</span> YouTube & SoundCloud via their official player APIs — our play button and the vinyl follow their real state.</li>
          <li className="is-muted"><span aria-hidden="true">○</span> Spotify & Apple Music: official embedded players, controlled inside their own iframe.</li>
          <li className="is-muted"><span aria-hidden="true">○</span> Streaming-service audio can’t be mixed — DJ Mode uses licensed audio files only.</li>
          <li className="is-muted"><span aria-hidden="true">○</span> Headphone cue isn’t possible in browsers, so CUE sets a cue point.</li>
        </ul>
      </section>

      <section className="info-card" aria-labelledby="fav-h">
        <h2 id="fav-h" className="info__h2">
          Your favourites <span className="info__count">{favourites.length}</span>
        </h2>
        {favourites.length ? (
          <ul className="favs">
            {favourites.map((a) => (
              <li key={a.id}>
                <button type="button" className="favs__item" onClick={() => onSelect(a.id)} aria-current={a.id === album.id || undefined}>
                  <CoverArt album={a} showText={false} className="favs__thumb" />
                  <span>
                    <strong>{a.title}</strong>
                    <small>{a.artist}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="info__empty">No hearts yet. Tap ♡ on a record and it’ll be saved on this device.</p>
        )}
      </section>
    </aside>
  );
}
