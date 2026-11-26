import type { Album } from '../types';

/**
 * Playback source abstraction. The UI asks "what can this record actually
 * do?" and renders only honest controls.
 *
 *  file    → licensed audio decoded by the Web Audio engine (full DJ features)
 *  spotify → Spotify's official embed player. Spotify controls playback inside
 *            its own iframe; we never extract, proxy or process its audio, so
 *            mixing/EQ/crossfade are unavailable for these records.
 *  none    → nothing configured → "Preview unavailable".
 */
export type PlaybackSource =
  | { kind: 'file'; url: string; label: string }
  | { kind: 'spotify'; embedUrl: string; albumUrl?: string; label: string; reason: string }
  | { kind: 'none'; label: string; reason: string };

const SPOTIFY_EMBED = /^https:\/\/open\.spotify\.com\/embed\/(album|track|playlist)\/[A-Za-z0-9]{10,40}(\?.*)?$/;

export function isValidSpotifyEmbed(url: string | undefined): url is string {
  return !!url && SPOTIFY_EMBED.test(url);
}

export function describeSource(album: Album): PlaybackSource {
  if (album.previewAudioUrl) {
    return { kind: 'file', url: album.previewAudioUrl, label: 'Original demo audio' };
  }
  if (isValidSpotifyEmbed(album.spotifyEmbedUrl)) {
    return {
      kind: 'spotify',
      embedUrl: album.spotifyEmbedUrl,
      albumUrl: album.spotifyAlbumUrl,
      label: 'Spotify',
      reason: 'Plays inside Spotify’s own player — its audio can’t be routed through the mixer.',
    };
  }
  return { kind: 'none', label: 'Preview unavailable', reason: 'No licensed preview configured for this record yet.' };
}
