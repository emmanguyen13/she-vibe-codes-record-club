// Minimal typings for the official YouTube IFrame & SoundCloud Widget APIs.
declare namespace YT {
  interface PlayerEvent { target: Player }
  interface OnStateChangeEvent { data: number; target: Player }
  interface OnErrorEvent { data: number; target: Player }
  interface PlayerOptions {
    host?: string;
    width?: string | number;
    height?: string | number;
    videoId: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (e: PlayerEvent) => void;
      onStateChange?: (e: OnStateChangeEvent) => void;
      onError?: (e: OnErrorEvent) => void;
    };
  }
  class Player {
    constructor(el: HTMLElement | string, opts: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
    getIframe(): HTMLIFrameElement;
  }
}

declare namespace SC {
  interface WidgetInstance {
    bind(event: string, cb: (e?: { currentPosition?: number }) => void): void;
    unbind(event: string): void;
    play(): void;
    pause(): void;
    seekTo(ms: number): void;
    getDuration(cb: (ms: number) => void): void;
    getCurrentSound(cb: (s: { title?: string; user?: { username?: string } } | null) => void): void;
  }
  interface WidgetFactory {
    (iframe: HTMLIFrameElement | string): WidgetInstance;
    Events: Record<'READY' | 'PLAY' | 'PAUSE' | 'FINISH' | 'PLAY_PROGRESS' | 'ERROR', string>;
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
  SC?: { Widget: SC.WidgetFactory };
}
