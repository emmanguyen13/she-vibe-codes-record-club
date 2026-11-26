import { useEffect, useRef } from 'react';
import { loadScript } from '../../../audio/external/loadScript';
import { external } from '../../../audio/external/store';
import type { DeckStatus } from '../../../audio/engine';

const YT_ERRORS: Record<number, string> = {
  2: 'That YouTube link looks invalid.',
  5: 'YouTube couldn’t play this in the browser.',
  100: 'This YouTube video was removed or is private.',
  101: 'The owner doesn’t allow this video to be embedded.',
  150: 'The owner doesn’t allow this video to be embedded.',
};

function loadYouTubeApi() {
  return loadScript('https://www.youtube.com/iframe_api', (resolve) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
}

/**
 * Official YouTube IFrame Player. The video stays visible (≥200×200 as the
 * YouTube API terms require); our transport drives it through the API and
 * the vinyl/tonearm follow YouTube's real state events.
 */
export function YouTubeEmbed({ videoId, albumId, title }: { videoId: string; albumId: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let player: YT.Player | null = null;
    let ready = false;
    let disposed = false;
    const token = external.attach(albumId, 'youtube', {
      play: () => ready && player?.playVideo(),
      pause: () => ready && player?.pauseVideo(),
      seek: (t) => ready && player?.seekTo(t, true),
      position: () => (ready && player ? player.getCurrentTime() : 0),
    });

    loadYouTubeApi()
      .then(() => {
        if (disposed || !host.current || !window.YT) return;
        const mount = document.createElement('div');
        host.current.appendChild(mount);
        player = new window.YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          videoId,
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: (e) => {
              ready = true;
              e.target.getIframe().setAttribute('title', `YouTube player: ${title}`);
              external.update(token, { status: 'LOADED', ready: true, duration: e.target.getDuration() || 0 });
            },
            onStateChange: (e) => {
              const d = e.target.getDuration() || 0;
              // -1 unstarted · 0 ended · 1 playing · 2 paused · 3 buffering · 5 cued
              const map: Record<number, DeckStatus> = {
                [-1]: 'LOADED', 0: 'LOADED', 1: 'PLAYING', 2: 'PAUSED', 3: 'LOADING', 5: 'LOADED',
              };
              external.update(token, { status: map[e.data] ?? 'LOADED', buffering: e.data === 3, duration: d });
            },
            onError: (e) => external.update(token, { status: 'UNAVAILABLE', message: YT_ERRORS[e.data] ?? 'YouTube player error.' }),
          },
        });
      })
      .catch((err: Error) => external.update(token, { status: 'UNAVAILABLE', message: err.message }));

    return () => {
      disposed = true;
      try { player?.destroy(); } catch { /* already gone */ }
      if (host.current) host.current.innerHTML = '';
      external.detach(token);
    };
  }, [videoId, albumId, title]);

  return <div className="embed embed--youtube" ref={host} />;
}
