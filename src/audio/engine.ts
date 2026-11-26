/**
 * Source-agnostic Web Audio engine.
 *
 *  Channel graph (per deck):
 *    AudioBufferSource → trim → low-shelf → peaking(mid) → high-shelf → volume ─┬→ crossfade → master → speakers
 *                                                                              └→ analyser (channel meter)
 *
 *  Every state reported to the UI (PLAYING, PAUSED…) reflects the real
 *  AudioBufferSourceNode. Meters read real samples from AnalyserNodes, so
 *  nothing moves unless sound is actually flowing.
 *
 *  Only sources that can legally be decoded & processed in-browser go through
 *  here (`previewAudioUrl`). Spotify content is never routed through this
 *  engine — see adapters.ts.
 */
import type { Album } from '../types';
import { clampRate, crossfadeGains, dbToGain } from './mixMath';
import { describeSource } from './adapters';

export type DeckStatus = 'EMPTY' | 'LOADING' | 'LOADED' | 'CUE' | 'PLAYING' | 'PAUSED' | 'UNAVAILABLE';
export type ChannelId = 'shelf' | 'A' | 'B';
export type EqBand = 'low' | 'mid' | 'high';

export type ChannelState = {
  status: DeckStatus;
  albumId: string | null;
  duration: number;
  rate: number;
  volume: number; // 0..1
  eq: Record<EqBand, number>; // dB
  cuePoint: number;
  loop: boolean;
  message: string | null; // reason when UNAVAILABLE
};

type Listener = () => void;

// ── shared decoding (no AudioContext needed → no autoplay warnings) ──
let decoder: OfflineAudioContext | null = null;
const bufferCache = new Map<string, Promise<AudioBuffer>>();

function decode(url: string): Promise<AudioBuffer> {
  let p = bufferCache.get(url);
  if (!p) {
    p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Audio file not found (${res.status}).`);
      const bytes = await res.arrayBuffer();
      decoder ??= new OfflineAudioContext(1, 1, 44100);
      return await decoder.decodeAudioData(bytes);
    })();
    p.catch(() => bufferCache.delete(url));
    bufferCache.set(url, p);
  }
  return p;
}

class Channel {
  readonly id: ChannelId;
  private engine: AudioEngine;
  private state: ChannelState;
  private listeners = new Set<Listener>();
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startedAtCtx = 0;
  private startOffset = 0;
  private pausedAt = 0;
  private loadToken = 0;
  private nodes: {
    trim: GainNode; low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode;
    vol: GainNode; xf: GainNode; analyser: AnalyserNode;
  } | null = null;
  private sampleBuf: Float32Array<ArrayBuffer> | null = null;

  constructor(engine: AudioEngine, id: ChannelId, loop: boolean) {
    this.engine = engine;
    this.id = id;
    this.state = {
      status: 'EMPTY', albumId: null, duration: 0, rate: 1, volume: id === 'shelf' ? 0.9 : 0.8,
      eq: { low: 0, mid: 0, high: 0 }, cuePoint: 0, loop, message: null,
    };
  }

  // ── store plumbing (for useSyncExternalStore) ──
  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getState = () => this.state;
  private set(patch: Partial<ChannelState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Builds this channel's node graph the first time audio is needed. */
  connect(ctx: AudioContext, dest: AudioNode) {
    if (this.nodes) return;
    const trim = ctx.createGain();
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf'; low.frequency.value = 220;
    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 0.7;
    const high = ctx.createBiquadFilter();
    high.type = 'highshelf'; high.frequency.value = 4200;
    const vol = ctx.createGain();
    const xf = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    trim.connect(low).connect(mid).connect(high).connect(vol);
    vol.connect(xf).connect(dest);
    vol.connect(analyser);
    this.nodes = { trim, low, mid, high, vol, xf, analyser };
    this.applyParams();
  }

  private applyParams() {
    if (!this.nodes) return;
    const { eq, volume } = this.state;
    this.nodes.low.gain.value = eq.low;
    this.nodes.mid.gain.value = eq.mid;
    this.nodes.high.gain.value = eq.high;
    this.nodes.vol.gain.value = volume;
    this.setCrossfadeGain(this.engine.crossfadeGainFor(this.id));
  }

  setCrossfadeGain(g: number) {
    if (this.nodes) this.nodes.xf.gain.setTargetAtTime(g, this.nodes.xf.context.currentTime, 0.01);
  }

  // ── loading ──
  async load(album: Album | undefined) {
    const token = ++this.loadToken;
    this.stopSource();
    this.buffer = null;
    this.pausedAt = 0;
    if (!album) {
      this.set({ status: 'EMPTY', albumId: null, duration: 0, message: null, cuePoint: 0 });
      return;
    }
    const src = describeSource(album);
    if (src.kind !== 'file') {
      this.set({ status: 'UNAVAILABLE', albumId: album.id, duration: 0, cuePoint: 0, message: src.reason });
      return;
    }
    this.set({ status: 'LOADING', albumId: album.id, duration: 0, cuePoint: 0, message: null });
    try {
      const buffer = await decode(src.url);
      if (token !== this.loadToken) return;
      this.buffer = buffer;
      this.set({ status: 'LOADED', duration: buffer.duration });
    } catch (err) {
      if (token !== this.loadToken) return;
      this.set({ status: 'UNAVAILABLE', message: err instanceof Error ? err.message : 'Could not decode audio.' });
    }
  }

  // ── transport ──
  get canPlay() {
    return !!this.buffer && this.state.status !== 'LOADING';
  }

  position(): number {
    const d = this.state.duration;
    if (this.state.status !== 'PLAYING' || !this.source) return this.pausedAt;
    const ctx = this.engine.context!;
    const p = this.startOffset + (ctx.currentTime - this.startedAtCtx) * this.state.rate;
    return this.state.loop && d > 0 ? p % d : Math.min(p, d);
  }

  play() {
    if (!this.buffer || this.state.status === 'PLAYING') return;
    const ctx = this.engine.ensure();
    const offset = this.pausedAt >= this.buffer.duration ? 0 : this.pausedAt;
    this.startSource(ctx, offset);
    this.set({ status: 'PLAYING' });
  }

  private startSource(ctx: AudioContext, offset: number) {
    this.stopSource();
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = this.state.loop;
    src.playbackRate.value = this.state.rate;
    src.connect(this.nodes!.trim);
    src.onended = () => {
      if (this.source !== src) return; // replaced or stopped deliberately
      this.source = null;
      this.pausedAt = 0;
      this.set({ status: 'LOADED' });
    };
    src.start(0, offset);
    this.source = src;
    this.startedAtCtx = ctx.currentTime;
    this.startOffset = offset;
  }

  private stopSource() {
    const s = this.source;
    this.source = null;
    if (s) {
      s.onended = null;
      try { s.stop(); } catch { /* already stopped */ }
      s.disconnect();
    }
  }

  pause() {
    if (this.state.status !== 'PLAYING') return;
    this.pausedAt = this.position();
    this.stopSource();
    this.set({ status: 'PAUSED' });
  }

  toggle() {
    if (this.state.status === 'PLAYING') this.pause();
    else this.play();
  }

  stop() {
    if (!this.buffer) return;
    this.stopSource();
    this.pausedAt = 0;
    this.set({ status: 'LOADED' });
  }

  /**
   * CDJ-style cue: while playing → jump back to the cue point and hold.
   * While stopped/paused → store the current position as the cue point.
   */
  cue() {
    if (!this.buffer) return;
    if (this.state.status === 'PLAYING') {
      this.stopSource();
      this.pausedAt = this.state.cuePoint;
      this.set({ status: 'CUE' });
    } else {
      this.set({ status: 'CUE', cuePoint: this.pausedAt });
    }
  }

  seek(t: number) {
    if (!this.buffer) return;
    const pos = Math.max(0, Math.min(t, this.buffer.duration - 0.01));
    if (this.state.status === 'PLAYING') this.startSource(this.engine.ensure(), pos);
    else this.pausedAt = pos;
    this.listeners.forEach((l) => l());
  }

  setRate(rate: number) {
    const r = clampRate(rate);
    if (this.source && this.state.status === 'PLAYING') {
      const ctx = this.engine.context!;
      this.startOffset = this.position();
      this.startedAtCtx = ctx.currentTime;
      this.source.playbackRate.value = r;
    }
    this.set({ rate: r });
  }

  setVolume(v: number) {
    const vol = Math.max(0, Math.min(1, v));
    if (this.nodes) this.nodes.vol.gain.setTargetAtTime(vol, this.nodes.vol.context.currentTime, 0.01);
    this.set({ volume: vol });
  }

  setEq(band: EqBand, db: number) {
    const v = Math.max(-26, Math.min(6, db));
    if (this.nodes) this.nodes[band].gain.setTargetAtTime(v, this.nodes[band].context.currentTime, 0.01);
    this.set({ eq: { ...this.state.eq, [band]: v } });
  }

  /** Real RMS/peak of this channel's post-fader signal (0..1). */
  level(): { rms: number; peak: number } {
    if (!this.nodes || this.state.status !== 'PLAYING') return { rms: 0, peak: 0 };
    const an = this.nodes.analyser;
    if (!this.sampleBuf) this.sampleBuf = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(this.sampleBuf);
    let sum = 0, peak = 0;
    for (const s of this.sampleBuf) {
      sum += s * s;
      const a = Math.abs(s);
      if (a > peak) peak = a;
    }
    return { rms: Math.sqrt(sum / this.sampleBuf.length), peak };
  }
}

export class AudioEngine {
  context: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterBuf: Float32Array<ArrayBuffer> | null = null;
  private crossfader = 0.5;
  readonly shelf: Channel;
  readonly A: Channel;
  readonly B: Channel;

  constructor() {
    this.shelf = new Channel(this, 'shelf', false);
    this.A = new Channel(this, 'A', true);
    this.B = new Channel(this, 'B', true);
  }

  /** Creates/resumes the AudioContext. Call only from a user gesture. */
  ensure(): AudioContext {
    if (!this.context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.context.destination);
      this.masterAnalyser = this.context.createAnalyser();
      this.masterAnalyser.fftSize = 1024;
      this.master.connect(this.masterAnalyser);
      for (const ch of [this.shelf, this.A, this.B]) ch.connect(this.context, this.master);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  crossfadeGainFor(id: ChannelId): number {
    if (id === 'shelf') return 1;
    const g = crossfadeGains(this.crossfader);
    return id === 'A' ? g.a : g.b;
  }

  getCrossfader = () => this.crossfader;
  setCrossfader(x: number) {
    this.crossfader = Math.min(1, Math.max(0, x));
    this.A.setCrossfadeGain(this.crossfadeGainFor('A'));
    this.B.setCrossfadeGain(this.crossfadeGainFor('B'));
  }

  setMasterDb(db: number) {
    if (this.master) this.master.gain.setTargetAtTime(dbToGain(db), this.master.context.currentTime, 0.01);
  }

  /** Real RMS/peak of the final output (after crossfader & master). */
  level(): { rms: number; peak: number } {
    const an = this.masterAnalyser;
    if (!an) return { rms: 0, peak: 0 };
    this.masterBuf ??= new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(this.masterBuf);
    let sum = 0, peak = 0;
    for (const v of this.masterBuf) {
      sum += v * v;
      if (Math.abs(v) > peak) peak = Math.abs(v);
    }
    return { rms: Math.sqrt(sum / this.masterBuf.length), peak };
  }

  get supported() {
    return typeof window !== 'undefined' && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }
}

export type { Channel };
export const engine = new AudioEngine();
