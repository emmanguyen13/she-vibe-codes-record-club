import type { DeckStatus } from '../engine';
import type { SourceKind } from '../adapters';

/**
 * Truthful state of the currently mounted third-party player (YouTube or
 * SoundCloud) in Shelf Mode. The status only changes when the provider's
 * own API reports an event — never optimistically on a click.
 */
export type ExternalState = {
  albumId: string | null;
  kind: SourceKind | null;
  status: DeckStatus;
  duration: number;
  message: string | null;
  /** Provider API reported ready (controls work from here on). */
  ready: boolean;
  /** Provider is buffering after a play request (not audible yet). */
  buffering: boolean;
};

type Controller = {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  position(): number;
};

const IDLE: ExternalState = { albumId: null, kind: null, status: 'EMPTY', duration: 0, message: null, ready: false, buffering: false };

class ExternalPlayback {
  private state: ExternalState = IDLE;
  private listeners = new Set<() => void>();
  private controller: Controller | null = null;
  private owner = 0;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getState = () => this.state;

  /** Called by an embed when it mounts; returns a token used for updates. */
  attach(albumId: string, kind: SourceKind, controller: Controller): number {
    this.owner += 1;
    this.controller = controller;
    this.set({ albumId, kind, status: 'LOADING', duration: 0, message: null, ready: false, buffering: false });
    return this.owner;
  }
  detach(token: number) {
    if (token !== this.owner) return;
    this.controller = null;
    this.state = IDLE;
    this.listeners.forEach((l) => l());
  }
  update(token: number, patch: Partial<ExternalState>) {
    if (token === this.owner) this.set(patch);
  }
  private set(patch: Partial<ExternalState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  get canControl() {
    return !!this.controller && this.state.ready && this.state.status !== 'UNAVAILABLE';
  }
  /** Playing or trying to (buffering) — the button should offer "pause". */
  get active() {
    return this.state.status === 'PLAYING' || this.state.buffering;
  }
  play() { this.controller?.play(); }
  pause() { this.controller?.pause(); }
  toggle() {
    if (this.active) this.pause();
    else this.play();
  }
  seek(t: number) { this.controller?.seek(t); }
  position() { return this.controller?.position() ?? 0; }
}

export const external = new ExternalPlayback();
