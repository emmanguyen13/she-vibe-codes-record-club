/** Pure maths for the mixer — unit-tested in mixMath.test.ts. */

/** Equal-power crossfade. x: 0 = full Deck A, 1 = full Deck B. */
export function crossfadeGains(x: number): { a: number; b: number } {
  const t = Math.min(1, Math.max(0, x));
  return { a: Math.cos((t * Math.PI) / 2), b: Math.cos(((1 - t) * Math.PI) / 2) };
}

export const dbToGain = (db: number) => Math.pow(10, db / 20);
export const gainToDb = (g: number) => (g <= 0 ? -Infinity : 20 * Math.log10(g));

export const MIN_RATE = 0.84;
export const MAX_RATE = 1.16;
export const clampRate = (r: number) => Math.min(MAX_RATE, Math.max(MIN_RATE, r));

/**
 * Playback rate that makes `followerBpm` sound at the leader's effective tempo.
 * Returns null when the required ratio is outside the pitch range.
 */
export function syncRate(leaderBpm: number, leaderRate: number, followerBpm: number): number | null {
  const target = (leaderBpm * leaderRate) / followerBpm;
  // allow half/double-time matching when it lands in range
  for (const k of [1, 2, 0.5]) {
    const r = target * k;
    if (r >= MIN_RATE && r <= MAX_RATE) return r;
  }
  return null;
}

/**
 * Track position for the follower so its beat phase matches the leader's.
 * Positions are in track seconds; both tracks start on a downbeat.
 */
export function phaseAlignedPosition(
  leaderPos: number,
  leaderBpm: number,
  followerPos: number,
  followerBpm: number,
  followerDuration: number,
): number {
  const leaderBeat = 60 / leaderBpm;
  const followerBeat = 60 / followerBpm;
  const phase = (leaderPos / leaderBeat) % 1;
  const beatIndex = Math.floor(followerPos / followerBeat);
  const pos = (beatIndex + phase) * followerBeat;
  return followerDuration > 0 ? pos % followerDuration : pos;
}
