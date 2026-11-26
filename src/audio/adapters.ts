import type { Album } from '../types';

/**
 * Playback source abstraction. The UI asks "what can this record actually
 * do?" and renders only honest controls.
 *
 *  file       → licensed audio decoded by the Web Audio engine (full DJ features)
 *  youtube    → official YouTube IFrame Player API. Play/pause/seek + real
 *               state events, so the vinyl & tonearm follow it. Video stays
 *               visible (YouTube ToS); audio can't be processed or mixed.
 *  soundcloud → official SoundCloud Widget API. Same capabilities as YouTube.
 *  spotify    → official Spotify embed. Controlled only inside Spotify's iframe.
 *  apple      → official Apple Music embed. Controlled only inside Apple's iframe.
 *  none       → nothing configured → "Preview unavailable".
 *
 * Nothing here extracts, proxies or records third-party audio.
 */
export type SourceKind = 'file' | 'youtube' | 'soundcloud' | 'spotify' | 'apple' | 'none';

export type PlaybackSource =
  | { kind: 'file'; url: string; label: string; short: string }
  | { kind: 'youtube'; videoId: string | null; listId: string | null; label: string; short: string; reason: string }
  | { kind: 'soundcloud'; url: string; label: string; short: string; reason: string }
  | { kind: 'spotify'; embedUrl: string; albumUrl?: string; label: string; short: string; reason: string }
  | { kind: 'apple'; embedUrl: string; openUrl: string; label: string; short: string; reason: string }
  | { kind: 'none'; label: string; short: string; reason: string };

/** Sources whose play/pause state we can read and control from our own UI. */
export const isControllable = (k: SourceKind) => k === 'file' || k === 'youtube' || k === 'soundcloud';

const SPOTIFY_EMBED = /^https:\/\/open\.spotify\.com\/embed\/(album|track|playlist)\/[A-Za-z0-9]{10,40}(\?.*)?$/;
export function isValidSpotifyEmbed(url: string | undefined): url is string {
  return !!url && SPOTIFY_EMBED.test(url);
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YT_LIST = /^[A-Za-z0-9_-]{10,64}$/;

/** Parses YouTube video and/or playlist links (watch, youtu.be, shorts, embed, playlist). */
export function parseYouTube(input: string | undefined): { videoId: string | null; listId: string | null } | null {
  if (!input) return null;
  const s = input.trim();
  if (YT_ID.test(s)) return { videoId: s, listId: null };
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, '');
    let videoId: string | null = null;
    if (host === 'youtu.be') videoId = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      videoId = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ?? null;
    } else return null;
    const list = u.searchParams.get('list');
    const v = videoId && YT_ID.test(videoId) ? videoId : null;
    const l = list && YT_LIST.test(list) ? list : null;
    return v || l ? { videoId: v, listId: l } : null;
  } catch {
    return null;
  }
}

/** Accepts watch?v=, youtu.be/, /shorts/, /embed/ URLs or a bare 11-char ID. */
export function parseYouTubeId(input: string | undefined): string | null {
  return parseYouTube(input)?.videoId ?? null;
}

/** open.spotify.com links (incl. /intl-xx/ and /embed/) or spotify: URIs → official embed. */
export function parseSpotifyUrl(input: string | undefined): { embedUrl: string; openUrl: string; type: string } | null {
  if (!input) return null;
  const s = input.trim();
  const uri = s.match(/^spotify:(album|playlist|track):([A-Za-z0-9]{10,40})$/);
  let type: string | undefined;
  let id: string | undefined;
  if (uri) [, type, id] = uri;
  else {
    try {
      const u = new URL(s);
      if (u.protocol !== 'https:' || u.hostname !== 'open.spotify.com') return null;
      const m = u.pathname.match(/^\/(?:intl-[a-z-]+\/)?(?:embed\/)?(album|playlist|track)\/([A-Za-z0-9]{10,40})\/?$/);
      if (!m) return null;
      [, type, id] = m;
    } catch {
      return null;
    }
  }
  if (!type || !id) return null;
  return { embedUrl: `https://open.spotify.com/embed/${type}/${id}`, openUrl: `https://open.spotify.com/${type}/${id}`, type };
}

export function parseSoundCloudUrl(input: string | undefined): string | null {
  if (!input) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol !== 'https:') return null;
    if (u.hostname === 'soundcloud.com' || u.hostname === 'www.soundcloud.com' || u.hostname === 'm.soundcloud.com') {
      return u.pathname.split('/').filter(Boolean).length >= 2 ? `https://soundcloud.com${u.pathname}` : null;
    }
    if (u.hostname === 'api.soundcloud.com' && /^\/(tracks|playlists)\/\d+/.test(u.pathname)) return u.href;
    return null;
  } catch {
    return null;
  }
}

/** Converts a music.apple.com link into the official embed URL. */
export function parseAppleMusicUrl(input: string | undefined): { embedUrl: string; openUrl: string } | null {
  if (!input) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol !== 'https:') return null;
    if (u.hostname !== 'music.apple.com' && u.hostname !== 'embed.music.apple.com') return null;
    if (!/^\/[a-z]{2}\/(album|playlist|song|station)\//.test(u.pathname)) return null;
    const embed = new URL(u.href);
    embed.hostname = 'embed.music.apple.com';
    const open = new URL(u.href);
    open.hostname = 'music.apple.com';
    return { embedUrl: embed.href, openUrl: open.href };
  } catch {
    return null;
  }
}

const MIX_REASON = (name: string) => `Plays inside ${name}’s own player — its audio can’t be routed through the mixer.`;

/** Every valid source configured for an album, best first. */
export function availableSources(album: Album): PlaybackSource[] {
  const out: PlaybackSource[] = [];
  if (album.previewAudioUrl) out.push({ kind: 'file', url: album.previewAudioUrl, label: 'Original demo audio', short: 'Audio' });
  const yt = parseYouTube(album.youtubeUrl);
  if (yt) out.push({ kind: 'youtube', ...yt, label: 'YouTube', short: 'YouTube', reason: MIX_REASON('YouTube') });
  const sc = parseSoundCloudUrl(album.soundcloudUrl);
  if (sc) out.push({ kind: 'soundcloud', url: sc, label: 'SoundCloud', short: 'SoundCloud', reason: MIX_REASON('SoundCloud') });
  const sp = isValidSpotifyEmbed(album.spotifyEmbedUrl)
    ? { embedUrl: album.spotifyEmbedUrl, openUrl: album.spotifyAlbumUrl }
    : parseSpotifyUrl(album.spotifyAlbumUrl);
  if (sp) out.push({ kind: 'spotify', embedUrl: sp.embedUrl, albumUrl: sp.openUrl, label: 'Spotify', short: 'Spotify', reason: MIX_REASON('Spotify') });
  const am = parseAppleMusicUrl(album.appleMusicUrl);
  if (am) out.push({ kind: 'apple', ...am, label: 'Apple Music', short: 'Apple Music', reason: MIX_REASON('Apple Music') });
  return out;
}

export function describeSource(album: Album): PlaybackSource {
  return (
    availableSources(album)[0] ?? {
      kind: 'none', label: 'Preview unavailable', short: 'None', reason: 'No licensed preview configured for this record yet.',
    }
  );
}

export type DetectedLink =
  | { ok: true; kind: Exclude<SourceKind, 'file' | 'none'>; what: string; fields: Partial<Album> }
  | { ok: false; error: string };

/**
 * Recognises a link a visitor pastes (playlist, album or track) and returns
 * the album fields that point at the service's OFFICIAL player.
 */
export function detectLink(raw: string): DetectedLink {
  const s = raw.trim();
  if (!s) return { ok: false, error: 'Paste a link to get started.' };
  if (/^https:\/\/(on\.soundcloud\.com|spotify\.link|apple\.co)\//.test(s)) {
    return { ok: false, error: 'That’s a short share link — open it first, then copy the full address from the browser.' };
  }
  const sp = parseSpotifyUrl(s);
  if (sp) return { ok: true, kind: 'spotify', what: `Spotify ${sp.type}`, fields: { spotifyEmbedUrl: sp.embedUrl, spotifyAlbumUrl: sp.openUrl } };
  const am = parseAppleMusicUrl(s);
  if (am) {
    const type = new URL(am.openUrl).pathname.split('/')[2];
    return { ok: true, kind: 'apple', what: `Apple Music ${type}`, fields: { appleMusicUrl: am.openUrl } };
  }
  const yt = parseYouTube(s);
  if (yt && /^https?:/.test(s)) {
    return { ok: true, kind: 'youtube', what: yt.listId ? 'YouTube playlist' : 'YouTube video', fields: { youtubeUrl: s } };
  }
  const sc = parseSoundCloudUrl(s);
  if (sc) return { ok: true, kind: 'soundcloud', what: sc.includes('/sets/') ? 'SoundCloud playlist' : 'SoundCloud track', fields: { soundcloudUrl: sc } };
  return { ok: false, error: 'We can read links from Spotify, Apple Music, YouTube or SoundCloud.' };
}
