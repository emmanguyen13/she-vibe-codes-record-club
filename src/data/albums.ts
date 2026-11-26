import type { Album } from '../types';

/**
 * Sample catalogue — every artist, title and label here is FICTIONAL.
 * Cover art is generated in-app (see components/stage/CoverArt.tsx) and the
 * audio loops in /public/audio are original, synthesised by
 * scripts/generate-audio.mjs.
 *
 * To use a real catalogue, replace this array. Only add artwork/audio you are
 * licensed to use. See README → "Replacing the sample collection".
 */
const audio = (id: string) => `/audio/${id}.wav`;

export const albums: Album[] = [
  {
    id: 'glitter-firmware', artist: 'Pixel Petals', title: 'Glitter Firmware', trackTitle: 'Boot Sparkle',
    year: '2001', label: 'Gloss Disc', format: 'LP', genre: 'Bubblegum House', bpm: 122,
    art: { pattern: 'stars', colors: ['#FF8FCB', '#FFF0A8', '#FFFFFF'], stamp: 'v1.0' },
    spineColor: '#FF5EAD', themeColor: '#FFC2E2', previewAudioUrl: audio('glitter-firmware'),
  },
  {
    id: 'dial-up-daydream', artist: 'Modem Hearts', title: 'Dial-Up Daydream', trackTitle: '56k Lullaby',
    year: '1999', label: 'Beep Boop Rec.', format: 'LP', genre: 'Lo-fi Beats', bpm: 84,
    art: { pattern: 'waves', colors: ['#A9D8FF', '#C9B8FF', '#FFF9F5'], stamp: '56k' },
    spineColor: '#7FB8F0', themeColor: '#CDE6FF', previewAudioUrl: audio('dial-up-daydream'),
  },
  {
    id: 'butterfly-clipboard', artist: 'Lip Gloss Linux', title: 'Butterfly Clipboard', trackTitle: 'Ctrl+C My Heart',
    year: '2003', label: 'Sudo Sweet', format: '2×LP', genre: 'Synth-pop', bpm: 108,
    art: { pattern: 'butterfly', colors: ['#C9B8FF', '#FF8FCB', '#FFF0A8'] },
    spineColor: '#A98BFF', themeColor: '#DCD0FF', previewAudioUrl: audio('butterfly-clipboard'),
  },
  {
    id: 'pastel-protocol', artist: 'The Cookie Consents', title: 'Pastel Protocol', trackTitle: 'Accept All',
    year: '2002', label: 'Handshake Audio', format: 'EP', genre: 'UK Garage', bpm: 132,
    art: { pattern: 'checker', colors: ['#FFC6AE', '#FF8FCB', '#34243D'] },
    spineColor: '#FF9B7A', themeColor: '#FFD8C8', previewAudioUrl: audio('pastel-protocol'),
  },
  {
    id: 'strawberry-syntax', artist: 'Bit Bunnies', title: 'Strawberry Syntax', trackTitle: 'Semicolon Sundae',
    year: '2000', label: '8-Bit Bakery', format: 'LP', genre: 'Chiptune', bpm: 140,
    art: { pattern: 'pixel', colors: ['#FF5EAD', '#FFF0A8', '#7CE0B8'], stamp: 'P1' },
    spineColor: '#E8437F', themeColor: '#FFB8D4', previewAudioUrl: audio('strawberry-syntax'),
  },
  {
    id: 'lilac-loading-bar', artist: 'Holo Hearts', title: 'Lilac Loading Bar', trackTitle: '99% Forever',
    year: '2004', label: 'Mist Mode', format: 'LP', genre: 'Ambient', bpm: 72,
    art: { pattern: 'rings', colors: ['#E9DEFF', '#A98BFF', '#A9D8FF'] },
    spineColor: '#C9B8FF', themeColor: '#E6DCFF', previewAudioUrl: audio('lilac-loading-bar'),
  },
  {
    id: 'roller-disco-exe', artist: 'Sugar Cache', title: 'Roller Disco.exe', trackTitle: 'Skate Mode',
    year: '2001', label: 'Glitterball', format: '12"', genre: 'Nu-Disco', bpm: 118,
    art: { pattern: 'chrome', colors: ['#FFF0A8', '#FF8FCB', '#C9B8FF'], stamp: '.exe' },
    spineColor: '#F5C84B', themeColor: '#FFF0B8', previewAudioUrl: audio('roller-disco-exe'),
  },
  {
    id: 'sparkle-merge-conflict', artist: 'Velvet Vector', title: 'Sparkle Merge Conflict', trackTitle: '<<<<<<< HEAD',
    year: '2005', label: 'Rebase Records', format: 'EP', genre: 'Breakbeat', bpm: 128,
    art: { pattern: 'grid', colors: ['#34243D', '#FF8FCB', '#A9D8FF'], stamp: 'git' },
    spineColor: '#684568', themeColor: '#EBC6E8', previewAudioUrl: audio('sparkle-merge-conflict'),
  },
  {
    id: 'chrome-heart-club', artist: 'Gloss Engine', title: 'Chrome Heart Club', trackTitle: 'Polish Pass',
    year: '2002', label: 'Mirrorball', format: 'LP', genre: 'Electro', bpm: 124,
    art: { pattern: 'hearts', colors: ['#D8DCE6', '#FF5EAD', '#FFFFFF'] },
    spineColor: '#B8BECC', themeColor: '#E4E7F0', previewAudioUrl: audio('chrome-heart-club'),
  },
  {
    id: 'peach-fuzz-patch-notes', artist: 'Mochi Mainframe', title: 'Peach Fuzz Patch Notes', trackTitle: 'Minor Fixes',
    year: '2003', label: 'Soft Serve', format: 'LP', genre: 'R&B', bpm: 92,
    art: { pattern: 'bubbles', colors: ['#FFC6AE', '#FFF9F5', '#FF8FCB'] },
    spineColor: '#F4A58A', themeColor: '#FFDCCD', previewAudioUrl: audio('peach-fuzz-patch-notes'),
  },
  {
    id: 'baby-blue-buffer', artist: 'Cloud Cardigan', title: 'Baby Blue Buffer', trackTitle: 'Stream Of Clouds',
    year: '2000', label: 'Cumulus', format: 'LP', genre: 'Downtempo', bpm: 96,
    art: { pattern: 'flower', colors: ['#A9D8FF', '#FFF9F5', '#FFF0A8'] },
    spineColor: '#5FA8E8', themeColor: '#D2EAFF', previewAudioUrl: audio('baby-blue-buffer'),
  },
  {
    id: 'bubble-tea-boot-sequence', artist: 'Tapioca Kernel', title: 'Bubble Tea Boot Sequence', trackTitle: 'Pearl Init',
    year: '2004', label: 'Boba Beats', format: '12"', genre: 'Trance', bpm: 138,
    art: { pattern: 'bubbles', colors: ['#7A5A8C', '#FFC6AE', '#C9B8FF'], stamp: 'boot' },
    spineColor: '#8E6AA8', themeColor: '#E2D0F0', previewAudioUrl: audio('bubble-tea-boot-sequence'),
  },
  {
    id: 'diary-zip', artist: 'Secret Sticker Society', title: 'Diary.zip', trackTitle: 'Do Not Read',
    year: '1999', label: 'Padlock Press', format: 'Tape', genre: 'Lo-fi', bpm: 78,
    art: { pattern: 'smiley', colors: ['#FFF0A8', '#34243D', '#FF8FCB'] },
    spineColor: '#FFE066', themeColor: '#FFF5C2', previewAudioUrl: audio('diary-zip'),
  },
  {
    id: 'butter-yellow-bug-fix', artist: 'Sunny Stack', title: 'Butter Yellow Bug Fix', trackTitle: 'Works On My Machine',
    year: '2002', label: 'Hotfix Funk', format: 'LP', genre: 'Funk', bpm: 112,
    art: { pattern: 'checker', colors: ['#FFF0A8', '#FFC6AE', '#684568'] },
    spineColor: '#FFD23F', themeColor: '#FFF1B0', previewAudioUrl: audio('butter-yellow-bug-fix'),
  },
  {
    id: 'moonlit-mood-board', artist: 'Starry Stylesheet', title: 'Moonlit Mood Board', trackTitle: 'z-index: 9999',
    year: '2005', label: 'Night Mode', format: '2×LP', genre: 'Synthwave', bpm: 100,
    art: { pattern: 'stars', colors: ['#3E2E5C', '#C9B8FF', '#FF8FCB'], stamp: 'night' },
    spineColor: '#4B3A73', themeColor: '#D6CCF2', previewAudioUrl: audio('moonlit-mood-board'),
  },
  {
    id: 'heart-shaped-hotkey', artist: 'Kiss Commit', title: 'Heart-Shaped Hotkey', trackTitle: '⌘ + ♥',
    year: '2001', label: 'Shortcut Sweet', format: 'EP', genre: 'House', bpm: 126,
    art: { pattern: 'hearts', colors: ['#FF5EAD', '#FFC2E2', '#FFF9F5'] },
    spineColor: '#FF7FB8', themeColor: '#FFCFE6', previewAudioUrl: audio('heart-shaped-hotkey'),
  },
  // ── No preview configured: demonstrates the honest "unavailable" state ──
  // To connect a streaming service instead, add any of these (official players only):
  //   youtubeUrl:    'https://www.youtube.com/watch?v=VIDEO_ID',
  //   soundcloudUrl: 'https://soundcloud.com/artist/track',
  //   appleMusicUrl: 'https://music.apple.com/us/album/name/ALBUM_ID',
  //   spotifyEmbedUrl: 'https://open.spotify.com/embed/album/ALBUM_ID',
  {
    id: 'velvet-placeholder', artist: 'Velvet Placeholder', title: 'Lorem Ipsum Love Songs',
    year: '2003', label: 'TBA', format: 'LP', genre: 'Indie Pop',
    art: { pattern: 'flower', colors: ['#F2E6FF', '#C9B8FF', '#FF8FCB'], stamp: 'soon' },
    spineColor: '#E3D2FF', themeColor: '#EEE4FF',
  },
  {
    id: 'coming-soon-cassette', artist: 'Draft Mode', title: 'Coming Soon Cassette',
    year: '2006', label: 'Unreleased', format: 'Tape', genre: 'Bedroom Pop',
    art: { pattern: 'rings', colors: ['#FFF9F5', '#FFC6AE', '#A9D8FF'], stamp: 'wip' },
    spineColor: '#FFE3D6', themeColor: '#FFE9DF',
  },
];

export const albumById = (id: string | null | undefined) => albums.find((a) => a.id === id);
