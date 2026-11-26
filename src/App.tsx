import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Mode } from './types';
import { catalogue, useCatalogue } from './data/catalogue';
import { wall, useWall } from './data/wall';
import { ShelfTabs, type ShelfView } from './components/shelf/ShelfTabs';
import { engine } from './audio/engine';
import { availableSources, describeSource, type SourceKind } from './audio/adapters';
import { external } from './audio/external/store';
import { useExternal } from './audio/external/useExternal';
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
import { AddRecordDialog } from './components/shelf/AddRecordDialog';
import './components/layout/layout.css';

export default function App() {
  const albums = useCatalogue();
  const [selectedId, setSelectedId] = useState(albums[0].id);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<Mode>('shelf');
  const [view, setView] = useState<ShelfView>('all');
  const wallState = useWall();
  const { favs, toggle, isFav } = useFavourites();
  const shelfState = useChannel(engine.shelf);
  const ext = useExternal();
  const [sourcePref, setSourcePref] = useState<{ albumId: string; kind: SourceKind } | null>(null);

  const everything = useMemo(() => [...albums, ...wallState.albums], [albums, wallState.albums]);
  const album = everything.find((a) => a.id === selectedId) ?? albums[0];

  // Load the community wall once; `#moderate` lets a moderator enter their token.
  useEffect(() => {
    void wall.load();
    if (window.location.hash === '#moderate') {
      const token = window.prompt('Moderator token for the community wall:');
      if (token) wall.setAdminToken(token.trim());
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);
  const sources = availableSources(album);
  const sourceKind: SourceKind =
    sourcePref?.albumId === album.id && sources.some((s) => s.kind === sourcePref.kind)
      ? sourcePref.kind
      : describeSource(album).kind;
  const visible = useMemo(() => {
    if (view === 'wall') return wallState.albums;
    if (view === 'mine') return albums.filter((a) => a.userAdded);
    if (view === 'favs') return everything.filter((a) => favs.includes(a.id));
    return albums;
  }, [view, favs, albums, everything, wallState.albums]);

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
    [visible, selectedId, albums],
  );

  const removeRecord = useCallback(
    (id: string) => {
      const i = albums.findIndex((a) => a.id === id);
      if (id === selectedId) setSelectedId((albums[i - 1] ?? albums[0]).id);
      catalogue.remove(id);
    },
    [albums, selectedId],
  );

  const changeMode = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      if (m === 'dj') {
        engine.shelf.pause();
        external.pause();
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
    [mode, album, albums],
  );

  const theme = album.themeColor || FALLBACK_THEME;
  const style = {
    '--stage': theme,
    '--stage-ink': readableInk(theme),
    '--stage-deep': mix(theme, '#684568', 0.18),
    '--accent': album.spineColor,
  } as React.CSSProperties;

  const shelfPlaying =
    sourceKind === 'file'
      ? shelfState.status === 'PLAYING' && shelfState.albumId === album.id
      : ext.albumId === album.id && (ext.status === 'PLAYING' || ext.buffering);
  const liveDemoEnabled =
    mode === 'dj'
      ? describeSource(album).kind === 'file'
      : sourceKind === 'file'
        ? shelfState.albumId === album.id && engine.shelf.canPlay
        : (sourceKind === 'youtube' || sourceKind === 'soundcloud') && ext.albumId === album.id && external.canControl;

  return (
    <div className="page" style={style}>
      <a className="skip-link" href="#shelf">Skip to the record shelf</a>
      <main className="shell">
        <section className="showcase" aria-label="Record shop">
          <Header
            mode={mode}
            onMode={changeMode}
            favouritesOnly={view === 'favs'}
            onFavouritesOnly={(on) => setView(on ? 'favs' : 'all')}
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
                sourceKind={sourceKind}
                onSourceKind={(kind) => setSourcePref({ albumId: album.id, kind })}
                onRemove={album.userAdded ? () => removeRecord(album.id) : undefined}
                onModeratorRemove={
                  album.wallId && wall.adminToken
                    ? async () => {
                        const err = await wall.remove(album.wallId!);
                        if (err) window.alert(err);
                        else step(1);
                      }
                    : undefined
                }
              />
            ) : (
              <DJMode pickedId={album.id} />
            )}
            <div id="shelf">
              <ShelfTabs
                view={view}
                onView={(v) => {
                  setView(v);
                  if (v === 'wall') void wall.load();
                }}
                counts={{
                  all: albums.length,
                  wall: wallState.status === 'ready' ? wallState.albums.length : null,
                  mine: albums.filter((a) => a.userAdded).length,
                  favs: everything.filter((a) => favs.includes(a.id)).length,
                }}
              />
              <RecordShelf
                albums={visible}
                selectedId={selectedId}
                isFav={isFav}
                onSelect={setSelectedId}
                view={view}
                wallStatus={wallState.status}
                wallMessage={wallState.message}
                onClearFilter={() => setView('all')}
                onAdd={() => setAdding(true)}
              />
            </div>
          </div>
        </section>
        <InfoPanel
          album={album}
          mode={mode}
          favourites={everything.filter((a) => favs.includes(a.id))}
          onSelect={setSelectedId}
          liveDemoLabel={shelfPlaying ? 'lift the needle' : 'drop the needle'}
          liveDemoEnabled={liveDemoEnabled}
          sourceKind={mode === 'dj' ? describeSource(album).kind : sourceKind}
          wallStatus={wallState.status}
          wallRecords={wallState.albums}
          onBrowseWall={() => {
            setView('wall');
            void wall.load();
            document.getElementById('shelf')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
          onAdd={() => setAdding(true)}
          onLiveDemo={() => {
            if (mode !== 'shelf') {
              changeMode('shelf');
              setSourcePref({ albumId: album.id, kind: 'file' });
              engine.shelf.play();
            } else if (sourceKind === 'file') engine.shelf.toggle();
            else external.toggle();
            document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        />
      </main>
      <AddRecordDialog
        open={adding}
        wallStatus={wallState.status}
        onClose={() => setAdding(false)}
        onAdded={(id, where) => {
          setAdding(false);
          setView(where === 'wall' ? 'wall' : 'mine');
          setSelectedId(id);
          if (mode !== 'shelf') changeMode('shelf');
        }}
      />
    </div>
  );
}
