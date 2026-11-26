/** Pattern used by the procedural, original cover-art generator. */
export type CoverPattern = 'hearts' | 'stars' | 'checker' | 'waves' | 'bubbles' | 'flower' | 'smiley' | 'chrome' | 'rings' | 'pixel' | 'butterfly' | 'grid';

export type CoverArtSpec = {
  pattern: CoverPattern;
  /** [background, primary motif, secondary motif] */
  colors: [string, string, string];
  /** Short word printed on the sleeve. */
  stamp?: string;
};

export type Album = {
  id: string;
  artist: string;
  title: string;
  year?: string;
  label?: string;
  format?: string;
  genre?: string;
  /** Optional licensed artwork URL (e.g. /covers/my-album.jpg). Falls back to `art`. */
  coverImage?: string;
  /** Original generated artwork used when no coverImage is supplied. */
  art: CoverArtSpec;
  spineColor: string;
  themeColor: string;
  /** Tempo in BPM — required for DJ Mode SYNC. */
  bpm?: number;
  /** Track title shown in the player (defaults to album title). */
  trackTitle?: string;
  /** Link out to the album on Spotify (opens Spotify; no playback in-page). */
  spotifyAlbumUrl?: string;
  /** Official Spotify embed URL, e.g. https://open.spotify.com/embed/album/<id> */
  spotifyEmbedUrl?: string;
  /** Audio the project owner is authorised to stream & process in-browser. */
  previewAudioUrl?: string;
  /** YouTube watch / youtu.be / shorts URL, or an 11-character video ID. */
  youtubeUrl?: string;
  /** Public SoundCloud track or playlist URL, e.g. https://soundcloud.com/artist/track */
  soundcloudUrl?: string;
  /** Apple Music album/song/playlist URL (music.apple.com or embed.music.apple.com). */
  appleMusicUrl?: string;
};

export type Mode = 'shelf' | 'dj';
