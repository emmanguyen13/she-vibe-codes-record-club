import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Mode } from './types';
import { albums, albumById } from './data/albums';
import { engine } from './audio/engine';
import { describeSource } from './audio/adapters';
import { syncRate } from './audio/mixMath';
import { useChannel } from './audio/useChannel';
import { useFavourites } from './lib/hooks';
import { FALLBACK_THEME, mix, readableInk } from './lib/color';
import { Header } from './components/layout/Header';
import { StageBar } from './components/layout/StageBar';
import { InfoPanel } from './components/layout/InfoPanel';
import { FeaturedRecordStage } from './components/stage/FeaturedRecordStage';
import { RecordShelf } from './components/shelf/RecordShelf';
import { DJMode } from './components/dj/DJMode';
import './components/layout/layout.css';

export default function App() {
  const [selectedId, setSelectedId] = useState(albums[0].id);
  const [mode, setMode] = useState<Mode>('shelf');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const { favs, toggle, isFav } = useFavourites();
  const shelfState = useChannel(engine.shelf);

  const album = albumById(selectedId) ?? albums[0];
  const visible = useMemo(() => (favouritesOnly ? albums.filter((a) => favs.includes(a.id)) : albums), [favouritesOnly, favs]);

  // Load the featured record into the Shelf channel whenever it changes.
  useEffect(() => {
    void engine.shelf.load(album);
  }, [album]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const list = visible.length ? visible : albums;
      const i = list.findIndex((a) => a.id === selectedId);
      const next = list[(i + dir + list.length) % list.length];
      setSelectedId(next.id);
    },
    [visible, selectedId],
  );

  const changeMode = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      if (m === 'dj') {
        engine.shelf.pause();
        // Pre-load sensible defaults the first time: picked record on A, next playable on B.
        if (engine.A.getState().status === 'EMPTY' && describeSource(album).kind === 'file') void engine.A.load(album);
        if (engine.B.getState().status === 'EMPTY') {
          const i = albums.indexOf(album);
          const rest = [...albums.slice(i + 1), ...albums.slice(0, i)].filter((a) => describeSource(a).kind === 'file');
          // prefer a record whose tempo can be synced with deck A
          const next = rest.find((a) => album.bpm && a.bpm && syncRate(album.bpm, 1, a.bpm) !== null) ?? rest[0];
          if (next) void engine.B.load(next);
        }
      } else {
        // Leaving DJ Mode pauses the decks (records stay loaded) so nothing plays unseen.
        engine.A.pause();
        engine.B.pause();
      }
      setMode(m);
    },
    [mode, album],
  );

  const theme = album.themeColor || FALLBACK_THEME;
  const style = {
    '--stage': theme,
    '--stage-ink': readableInk(theme),
    '--stage-deep': mix(theme, '#684568', 0.18),
    '--accent': album.spineColor,
  } as React.CSSProperties;

  const shelfPlaying = shelfState.status === 'PLAYING' && shelfState.albumId === album.id;

  return (
    <div className="page" style={style}>
      <a className="skip-link" href="#shelf">Skip to the record shelf</a>
      <main className="shell">
        <section className="showcase" aria-label="Record shop">
          <Header
            mode={mode}
            onMode={changeMode}
            favouritesOnly={favouritesOnly}
            onFavouritesOnly={setFavouritesOnly}
            isFav={isFav(album.id)}
            onFav={() => toggle(album.id)}
            favLabel={`Favourite ${album.title}`}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />
          <div className="stage-card" id="stage" data-mode={mode}>
            <StageBar mode={mode} onMode={changeMode} />
            {mode === 'shelf' ? (
              <FeaturedRecordStage
                album={album}
                isFav={isFav(album.id)}
                onFav={() => toggle(album.id)}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
              />
            ) : (
              <DJMode pickedId={album.id} />
            )}
            <div id="shelf">
              <RecordShelf
                albums={visible}
                selectedId={selectedId}
                isFav={isFav}
                onSelect={setSelectedId}
                favouritesOnly={favouritesOnly}
                onClearFilter={() => setFavouritesOnly(false)}
              />
            </div>
          </div>
        </section>
        <InfoPanel
          album={album}
          mode={mode}
          favourites={albums.filter((a) => favs.includes(a.id))}
          onSelect={setSelectedId}
          liveDemoLabel={shelfPlaying ? 'lift the needle' : 'drop the needle'}
          onLiveDemo={() => {
            if (mode !== 'shelf') changeMode('shelf');
            engine.shelf.toggle();
            document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        />
      </main>
    </div>
  );
}
