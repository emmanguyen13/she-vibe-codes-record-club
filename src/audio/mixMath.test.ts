import { describe, expect, it } from 'vitest';
import { crossfadeGains, phaseAlignedPosition, syncRate } from './mixMath';
import { contrastRatio, readableInk } from '../lib/color';

describe('crossfadeGains', () => {
  it('is full A at 0, full B at 1, equal power at centre', () => {
    expect(crossfadeGains(0).a).toBeCloseTo(1);
    expect(crossfadeGains(0).b).toBeCloseTo(0);
    expect(crossfadeGains(1).a).toBeCloseTo(0);
    expect(crossfadeGains(1).b).toBeCloseTo(1);
    const c = crossfadeGains(0.5);
    expect(c.a ** 2 + c.b ** 2).toBeCloseTo(1);
  });
});

describe('syncRate', () => {
  it('matches tempo within pitch range', () => {
    expect(syncRate(126, 1, 122)).toBeCloseTo(126 / 122);
  });
  it('uses double/half time when needed', () => {
    expect(syncRate(140, 1, 72)).toBeCloseTo(140 / 72 / 2);
  });
  it('returns null when impossible', () => {
    expect(syncRate(100, 1, 140)).toBeNull();
  });
});

describe('phaseAlignedPosition', () => {
  it('copies beat phase', () => {
    // leader halfway through a beat at 120 BPM (beat = 0.5s)
    const p = phaseAlignedPosition(10.25, 120, 3.1, 100, 30);
    const fBeat = 0.6;
    expect(((p / fBeat) % 1)).toBeCloseTo(0.5);
  });
});

describe('readableInk', () => {
  it('keeps catalogue themes legible', async () => {
    const { albums } = await import('../data/albums');
    for (const a of albums) expect(contrastRatio(a.themeColor, readableInk(a.themeColor))).toBeGreaterThan(4.5);
  });
});

import { parseAppleMusicUrl, parseSoundCloudUrl, parseYouTubeId } from './adapters';

describe('source URL parsing', () => {
  it('parses YouTube links', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=jNQXAC9IVRw&t=3')).toBe('jNQXAC9IVRw');
    expect(parseYouTubeId('https://youtu.be/jNQXAC9IVRw')).toBe('jNQXAC9IVRw');
    expect(parseYouTubeId('https://youtube.com/shorts/jNQXAC9IVRw')).toBe('jNQXAC9IVRw');
    expect(parseYouTubeId('jNQXAC9IVRw')).toBe('jNQXAC9IVRw');
    expect(parseYouTubeId('https://evil.com/watch?v=jNQXAC9IVRw')).toBeNull();
  });
  it('parses SoundCloud links', () => {
    expect(parseSoundCloudUrl('https://soundcloud.com/forss/flickermood')).toBe('https://soundcloud.com/forss/flickermood');
    expect(parseSoundCloudUrl('https://soundcloud.com/forss')).toBeNull();
    expect(parseSoundCloudUrl('http://soundcloud.com/a/b')).toBeNull();
  });
  it('converts Apple Music links to embeds', () => {
    expect(parseAppleMusicUrl('https://music.apple.com/us/album/x/123')?.embedUrl).toBe('https://embed.music.apple.com/us/album/x/123');
    expect(parseAppleMusicUrl('https://example.com/us/album/x/123')).toBeNull();
  });
});
