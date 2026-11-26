import { useEffect, useRef, useState } from 'react';
import { loadScript } from '../../../audio/external/loadScript';
import { external } from '../../../audio/external/store';

/**
 * Official SoundCloud Widget. Our transport drives it via the Widget API and
 * state comes from SoundCloud's PLAY / PAUSE / FINISH events.
 */
export function SoundCloudEmbed({ url, albumId, title }: { url: string; albumId: string; title: string }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [apiReady, setApiReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    loadScript('https://w.soundcloud.com/player/api.js')
      .then(() => setApiReady(true))
      .catch((e: Error) => setFailed(e.message));
  }, []);

  useEffect(() => {
    if (!apiReady || !iframe.current || !window.SC) return;
    const SCW = window.SC.Widget;
    const widget = SCW(iframe.current);
    let pos = 0;
    let ready = false;
    const token = external.attach(albumId, 'soundcloud', {
      play: () => ready && widget.play(),
      pause: () => ready && widget.pause(),
      seek: (t) => {
        if (!ready) return;
        pos = t;
        widget.seekTo(t * 1000);
      },
      position: () => pos,
    });
    const E = SCW.Events;
    widget.bind(E.READY, () => {
      ready = true;
      widget.getDuration((ms) => external.update(token, { status: 'LOADED', ready: true, duration: ms / 1000 }));
    });
    widget.bind(E.PLAY, () => {
      widget.getDuration((ms) => external.update(token, { status: 'PLAYING', duration: ms / 1000 }));
    });
    widget.bind(E.PAUSE, () => external.update(token, { status: 'PAUSED' }));
    widget.bind(E.FINISH, () => {
      pos = 0;
      external.update(token, { status: 'LOADED' });
    });
    widget.bind(E.PLAY_PROGRESS, (e) => {
      if (e?.currentPosition != null) pos = e.currentPosition / 1000;
    });
    widget.bind(E.ERROR, () => external.update(token, { status: 'UNAVAILABLE', message: 'SoundCloud couldn’t load this track (private, removed or not embeddable).' }));
    return () => {
      for (const ev of Object.values(E)) {
        try { widget.unbind(ev); } catch { /* iframe gone */ }
      }
      external.detach(token);
    };
  }, [apiReady, url, albumId]);

  useEffect(() => {
    if (!failed) return;
    const token = external.attach(albumId, 'soundcloud', { play() {}, pause() {}, seek() {}, position: () => 0 });
    external.update(token, { status: 'UNAVAILABLE', message: failed });
    return () => external.detach(token);
  }, [failed, albumId]);

  const src =
    'https://w.soundcloud.com/player/?' +
    new URLSearchParams({
      url,
      color: '#ff5ead',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'false',
    }).toString();

  if (!apiReady) return <div className="embed embed--soundcloud embed--placeholder" aria-hidden="true" />;
  return (
    <iframe
      ref={iframe}
      className="embed embed--soundcloud"
      title={`SoundCloud player: ${title}`}
      src={src}
      allow="autoplay; encrypted-media"
      loading="lazy"
    />
  );
}
