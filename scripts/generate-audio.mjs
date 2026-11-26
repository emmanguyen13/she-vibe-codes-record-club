#!/usr/bin/env node
/**
 * She Vibe Codes — original demo-audio generator.
 *
 * Synthesises short, seamless loops (drums, bass, pads, arps) from scratch
 * so the app ships with audio that is 100% original and free to process in
 * the browser (crossfade, EQ, metering). No samples, no third-party audio.
 *
 *   npm run audio          → writes public/audio/<id>.wav
 *
 * Every track's BPM is exact, which is what lets DJ Mode's SYNC button match
 * tempo and beat phase honestly (see src/audio/mixMath.ts).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050; // mono, 16-bit — keeps the demo light (~1.3 MB per loop)
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

/** Keep in sync with `bpm` in src/data/albums.ts */
export const TRACKS = [
  { id: 'glitter-firmware', bpm: 122, root: 57, mode: 'minor', prog: [0, 5, 2, 6], kick: 'four', snare: 'clap', hats: 'offbeat', bass: 'offbeat', pad: true, arp: 'up', wave: 'square', bright: 3200, swing: 0, seed: 1 },
  { id: 'dial-up-daydream', bpm: 84, root: 52, mode: 'dorian', prog: [0, 3, 4, 0], kick: 'boom', snare: '2and4', hats: 'shuffle', bass: 'walk', pad: true, arp: 'random', wave: 'tri', bright: 1600, swing: 0.22, lofi: true, seed: 2 },
  { id: 'butterfly-clipboard', bpm: 108, root: 60, mode: 'major', prog: [0, 4, 5, 3], kick: 'four', snare: '2and4', hats: '8th', bass: 'root8', pad: true, arp: 'up', wave: 'saw', bright: 2600, swing: 0, seed: 3 },
  { id: 'pastel-protocol', bpm: 132, root: 53, mode: 'minor', prog: [0, 6, 5, 4], kick: 'garage', snare: 'clap', hats: '16th', bass: 'sub', pad: true, arp: 'none', wave: 'saw', bright: 2400, swing: 0.18, seed: 4 },
  { id: 'strawberry-syntax', bpm: 140, root: 64, mode: 'major', prog: [0, 5, 3, 4], kick: 'four', snare: '2and4', hats: '8th', bass: 'root8', pad: false, arp: 'up', wave: 'square', bright: 5200, swing: 0, chip: true, seed: 5 },
  { id: 'lilac-loading-bar', bpm: 72, root: 50, mode: 'lydian', prog: [0, 1, 4, 0], kick: 'none', snare: 'none', hats: 'off', bass: 'sub', pad: true, arp: 'random', wave: 'sine', bright: 1400, swing: 0, seed: 6 },
  { id: 'roller-disco-exe', bpm: 118, root: 55, mode: 'dorian', prog: [0, 3, 0, 4], kick: 'four', snare: '2and4', hats: 'offbeat', bass: 'octave', pad: true, arp: 'none', wave: 'saw', bright: 3000, swing: 0, seed: 7 },
  { id: 'sparkle-merge-conflict', bpm: 128, root: 56, mode: 'minor', prog: [0, 0, 5, 6], kick: 'break', snare: 'break', hats: '16th', bass: 'sub', pad: false, arp: 'up', wave: 'square', bright: 2800, swing: 0.05, seed: 8 },
  { id: 'chrome-heart-club', bpm: 124, root: 54, mode: 'minor', prog: [0, 3, 5, 4], kick: 'four', snare: 'clap', hats: '8th', bass: 'root8', pad: false, arp: 'up', wave: 'saw', bright: 2200, swing: 0, seed: 9 },
  { id: 'peach-fuzz-patch-notes', bpm: 92, root: 58, mode: 'major', prog: [1, 4, 0, 5], kick: 'boom', snare: '2and4', hats: 'shuffle', bass: 'walk', pad: true, arp: 'none', wave: 'tri', bright: 1900, swing: 0.16, seed: 10 },
  { id: 'baby-blue-buffer', bpm: 96, root: 62, mode: 'lydian', prog: [0, 4, 1, 3], kick: 'half', snare: '2and4', hats: '8th', bass: 'sub', pad: true, arp: 'random', wave: 'sine', bright: 1800, swing: 0.1, lofi: true, seed: 11 },
  { id: 'bubble-tea-boot-sequence', bpm: 138, root: 57, mode: 'minor', prog: [0, 5, 3, 4], kick: 'four', snare: 'clap', hats: 'offbeat', bass: 'offbeat', pad: true, arp: 'up', wave: 'saw', bright: 3600, swing: 0, seed: 12 },
  { id: 'diary-zip', bpm: 78, root: 53, mode: 'major', prog: [3, 4, 2, 5], kick: 'boom', snare: '2and4', hats: 'shuffle', bass: 'sub', pad: true, arp: 'random', wave: 'tri', bright: 1300, swing: 0.25, lofi: true, seed: 13 },
  { id: 'butter-yellow-bug-fix', bpm: 112, root: 52, mode: 'dorian', prog: [0, 3, 0, 3], kick: 'funk', snare: '2and4', hats: '16th', bass: 'funk', pad: false, arp: 'none', wave: 'square', bright: 2600, swing: 0.08, seed: 14 },
  { id: 'moonlit-mood-board', bpm: 100, root: 50, mode: 'minor', prog: [0, 5, 6, 4], kick: 'four', snare: '2and4', hats: '8th', bass: 'root8', pad: true, arp: 'up', wave: 'saw', bright: 2000, swing: 0, seed: 15 },
  { id: 'heart-shaped-hotkey', bpm: 126, root: 59, mode: 'major', prog: [5, 3, 0, 4], kick: 'four', snare: 'clap', hats: 'offbeat', bass: 'offbeat', pad: true, arp: 'random', wave: 'square', bright: 3400, swing: 0, seed: 16 },
];

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

function rng(seed) {
  let a = seed * 9301 + 49297;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const lpCoef = (fc) => 1 - Math.exp((-2 * Math.PI * Math.min(fc, SR * 0.45)) / SR);
function osc(wave, ph) {
  const p = ph - Math.floor(ph);
  switch (wave) {
    case 'square': return p < 0.5 ? 0.6 : -0.6;
    case 'saw': return 2 * p - 1;
    case 'tri': return 1 - 4 * Math.abs(p - 0.5);
    default: return Math.sin(2 * Math.PI * p);
  }
}

function render(t) {
  const rand = rng(t.seed);
  const beat = 60 / t.bpm;
  const step = beat / 4;
  const bars = Math.max(8, Math.round((30 / (beat * 4)) / 4) * 4); // ≈30 s, multiple of 4 bars
  const N = Math.round(bars * 4 * beat * SR);
  const buf = new Float32Array(N);
  const add = (i, v) => { buf[((i % N) + N) % N] += v; }; // circular → seamless loops
  const scale = SCALES[t.mode];
  const degree = (d, oct = 0) => {
    const o = Math.floor(d / 7);
    return t.root + scale[((d % 7) + 7) % 7] + 12 * (o + oct);
  };
  const chordOf = (d) => [degree(d), degree(d + 2), degree(d + 4), degree(d + 6)];
  const at = (s) => {
    const swing = s % 2 === 1 ? t.swing * step : 0;
    return Math.round((s * step + swing) * SR);
  };

  // ── drums ────────────────────────────────────────────────
  const kick = (i0, gain = 0.95) => {
    let ph = 0;
    for (let k = 0; k < SR * 0.4; k++) {
      const tt = k / SR;
      ph += (44 + 80 * Math.exp(-tt * 28)) / SR;
      add(i0 + k, Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 8) * gain);
    }
  };
  const noiseHit = (i0, len, decay, gain, hpFc, lpFc = 0) => {
    let lp = 0, lp2 = 0;
    const a = lpCoef(hpFc), b = lpFc ? lpCoef(lpFc) : 1;
    for (let k = 0; k < SR * len; k++) {
      const n = rand() * 2 - 1;
      lp += a * (n - lp);
      const hp = n - lp;
      lp2 += b * (hp - lp2);
      add(i0 + k, lp2 * Math.exp((-k / SR) * decay) * gain);
    }
  };
  const snare = (i0) => {
    noiseHit(i0, 0.25, 20, 0.38, 1200);
    for (let k = 0; k < SR * 0.15; k++) add(i0 + k, Math.sin((2 * Math.PI * 185 * k) / SR) * Math.exp((-k / SR) * 32) * 0.3);
  };
  const clap = (i0) => {
    for (const off of [0, 0.011, 0.023]) noiseHit(i0 + Math.round(off * SR), 0.03, 60, 0.3, 900, 3500);
    noiseHit(i0 + Math.round(0.03 * SR), 0.3, 14, 0.25, 900, 3500);
  };
  const hat = (i0, open) => noiseHit(i0, open ? 0.3 : 0.06, open ? 11 : 55, open ? 0.12 : 0.16, 7000);
  const chipHat = (i0) => noiseHit(i0, 0.04, 70, 0.12, 4000);

  // ── tonal voices ─────────────────────────────────────────
  const tone = (i0, midi, dur, { wave = 'saw', gain = 0.2, fc = 1200, env = 8, attack = 0.004, release = 0.05, detune = 0 }) => {
    const f = mtof(midi) * (1 + detune);
    let ph = rand(), lp = 0;
    const len = Math.round((dur + release) * SR);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const a = Math.min(1, tt / attack) * (tt > dur ? Math.max(0, 1 - (tt - dur) / release) : 1);
      ph += f / SR;
      const cut = fc * (0.35 + 0.65 * Math.exp(-tt * env));
      lp += lpCoef(cut) * (osc(wave, ph) - lp);
      add(i0 + k, lp * a * gain);
    }
  };

  const totalSteps = bars * 16;
  const hatPat = { '8th': [0, 2, 4, 6, 8, 10, 12, 14], '16th': [...Array(16).keys()], offbeat: [2, 6, 10, 14], shuffle: [0, 3, 4, 7, 8, 11, 12, 15], off: [] }[t.hats];
  const kickPat = { four: [0, 4, 8, 12], boom: [0, 7, 10], break: [0, 6, 10], half: [0, 10], garage: [0, 7, 10, 12], funk: [0, 3, 8, 11, 14], none: [] }[t.kick];
  const snarePat = { '2and4': [4, 12], clap: [4, 12], break: [4, 9, 12, 15], none: [] }[t.snare];

  for (let s = 0; s < totalSteps; s++) {
    const st = s % 16;
    const bar = Math.floor(s / 16);
    const chord = chordOf(t.prog[bar % t.prog.length]);
    const i0 = at(s);
    if (kickPat.includes(st)) kick(i0, t.chip ? 0.7 : 0.95);
    if (snarePat.includes(st)) (t.snare === 'clap' ? clap : snare)(i0);
    if (hatPat.includes(st)) (t.chip ? chipHat : hat)(i0, t.hats === 'offbeat');
    if (t.hats === '16th' && st === 14 && bar % 2 === 1) hat(i0, true);

    // bass
    const b = chord[0] - 24;
    const bassOpts = { wave: t.bass === 'sub' ? 'sine' : t.chip ? 'square' : 'saw', gain: t.bass === 'sub' ? 0.42 : 0.3, fc: 700, env: 10 };
    if (t.bass === 'root8' && st % 2 === 0) tone(i0, b, step * 1.6, bassOpts);
    if (t.bass === 'offbeat' && st % 4 === 2) tone(i0, b, step * 1.8, bassOpts);
    if (t.bass === 'octave' && st % 2 === 0) tone(i0, b + (st % 4 === 2 ? 12 : 0), step * 1.5, bassOpts);
    if (t.bass === 'sub' && (st === 0 || st === 10)) tone(i0, b, step * (st === 0 ? 9 : 5), bassOpts);
    if (t.bass === 'walk' && st % 4 === 0) tone(i0, chord[[0, 1, 2, 1][st / 4]] - 24, step * 3.5, bassOpts);
    if (t.bass === 'funk' && [0, 3, 6, 8, 11, 14].includes(st)) tone(i0, b + (st === 6 || st === 14 ? 12 : 0), step * 0.9, { ...bassOpts, fc: 1100, env: 18 });

    // pads, one per bar
    if (t.pad && st === 0) {
      for (const n of chord.slice(0, 3)) {
        for (const d of [-0.003, 0.003]) tone(i0, n, beat * 4 - 0.05, { wave: 'saw', gain: 0.035, fc: t.bright * 0.45, env: 0.6, attack: 0.25, release: 0.35, detune: d });
      }
    }
    // arp / lead
    if (t.arp !== 'none') {
      const every = t.bpm > 115 ? 2 : 1;
      if (st % every === 0 && (t.arp === 'up' || rand() < 0.55)) {
        const idx = t.arp === 'up' ? (s / every) % 4 : Math.floor(rand() * 4);
        tone(i0, chord[idx] + 12, step * every * 0.8, { wave: t.wave, gain: t.chip ? 0.08 : 0.09, fc: t.bright, env: 12 });
      }
    }
  }

  // lo-fi crackle + warmth
  if (t.lofi) for (let k = 0; k < N; k++) if (rand() < 0.0009) buf[k] += (rand() - 0.5) * 0.25;

  // master: gentle tone shaping, soft clip, normalise
  let lp = 0;
  const a = lpCoef(t.lofi ? 5000 : 9000);
  let peak = 0;
  for (let k = 0; k < N; k++) {
    lp += a * (buf[k] - lp);
    buf[k] = Math.tanh(lp * 1.15);
    peak = Math.max(peak, Math.abs(buf[k]));
  }
  const g = 0.89 / (peak || 1);
  for (let k = 0; k < N; k++) buf[k] *= g;
  return { buf, bars, seconds: N / SR };
}

function wav(buf) {
  const data = Buffer.alloc(44 + buf.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + buf.length * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(buf.length * 2, 40);
  for (let i = 0; i < buf.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  return data;
}

mkdirSync(OUT, { recursive: true });
for (const t of TRACKS) {
  const { buf, bars, seconds } = render(t);
  const file = join(OUT, `${t.id}.wav`);
  writeFileSync(file, wav(buf));
  console.log(`✓ ${t.id.padEnd(26)} ${t.bpm} BPM · ${bars} bars · ${seconds.toFixed(1)}s`);
}
