# She Vibe Codes · Record Club

A one-screen, cute-Y2K record shelf with a real two-deck DJ mixer.

Pull a spine off the shelf and its sleeve springs onto the stage. The vinyl slides out and the stage takes on the record's colour. Dropping the needle plays **real audio**. Switch to **DJ Mode** for two independent turntables and a stereo mixer. The 3-band EQ, volume, crossfader, pitch, BPM sync and LED meters all process and measure the actual audio signal.

> The interaction concept is a reinterpretation of the DEADWAX record-shop reference. DEADWAX is not this project's brand, and nothing from it (code, artwork, audio) is used.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (mixer maths, sync, contrast) |
| `npm run audio` | Re-generate the original demo loops in `public/audio/` |

Requirements: Node 18+ and a modern browser (Chrome/Edge 124+, Safari 17.4+, Firefox 126+ for vertical range sliders).

---

## What's in the box

### Shelf Mode (default)
- A dense horizontal shelf of record spines. You can scroll it with touch or a trackpad. On phones it becomes swipeable music cards with cover thumbnails.
- Click/tap a spine, or use the keyboard (**← → ↑ ↓ / Home / End** inside the shelf), to select a record. The selected spine lifts up with an "on deck" tag.
- The featured stage animates in: the sleeve springs in, the vinyl slides out, and a "picked ♥" sticker pops on. The stage colour changes to the album's `themeColor`, and the text colour is chosen automatically for contrast (≥ 4.5:1, unit-tested).
- Portable-player widget: play/pause, seekable progress bar, previous/next and a favourite heart.
  - The vinyl spins and the tonearm drops **only while audio is actually playing**.
- The previous/next controls in the header and in the player step through the collection.
- **Favourites** are saved in `localStorage`. If storage is blocked (some private modes), they fall back to memory for the current session. Hearting a record plays a small sparkle burst. The menu has a "Favourites only" shelf filter with a friendly empty state.

### DJ Mode
- Open it with the **Shelf | DJ** toggle on the stage or from **Menu → DJ Mode**. Switch back the same way; your selected record and both loaded decks are kept.
  - Leaving DJ Mode pauses the decks, so nothing keeps playing out of sight.
- The first time you open DJ Mode, Deck A gets the record you picked and Deck B gets a record whose tempo can be synced with it.
- **Each deck:** status (EMPTY · LOADING · LOADED · CUE · PLAYING · PAUSED · UNAVAILABLE), Cue, Play/Pause, Stop, Sync, Load (opens a catalogue dialog), a seekable progress bar and a ±16% pitch fader.
- **Mixer:** treble/mid/bass knobs per channel (−26 dB "kill" to +6 dB), channel volume faders, per-channel and master LED meters, an equal-power crossfader and a master volume knob.
  - Knobs: drag up/down or use the arrow keys, PageUp/PageDown, Home/End. Double-click resets.
  - Faders: double-click resets the pitch and the crossfader.

### Control honesty: what each control really does

| Control | Implementation |
| --- | --- |
| Crossfader | Real equal-power gain curve on each deck's crossfade `GainNode` |
| Volume | Per-deck `GainNode` |
| Bass / Mid / Treble | `BiquadFilterNode`s: low-shelf at 220 Hz, peaking at 1 kHz, high-shelf at 4.2 kHz |
| Meters | `AnalyserNode` RMS of each channel (post-fader) and of the master output. They read zero when nothing is playing. |
| Pitch | `AudioBufferSourceNode.playbackRate` (tempo and pitch change together, like a turntable) |
| Sync | Matches the tempo to the other deck using **catalogue BPM** (not BPM detection). If both decks are playing, it also aligns the beat phase. Half/double-time is used when needed. It refuses honestly when the tempo gap is beyond ±16%. |
| Cue | CDJ-style **cue point**. While playing, it jumps back to the cue point and holds. While stopped, it sets the cue point. **Headphone cue monitoring is not offered:** browsers expose only one audio output, so split monitoring can't be done. |

---

## Audio: where it comes from

The 16 loops in `public/audio/*.wav` are **original audio created for this project** by `scripts/generate-audio.mjs`. The drums, bass, pads and arpeggios are all synthesised from scratch with no samples. You can use and process them in-browser freely.

Format: 22.05 kHz mono 16-bit WAV, about 30 s each, about 20 MB in total. The loops are seamless, and each one's BPM is exact (that's what makes Sync reliable).

Two records ("Lorem Ipsum Love Songs" and "Coming Soon Cassette") deliberately have **no audio**, so you can see the honest *Preview unavailable* / `UNAVAILABLE` state.

Browsers block autoplay. The `AudioContext` is only created when you press play (a user gesture). Files are decoded ahead of time with an `OfflineAudioContext`, which needs no gesture.

### Using your own audio
For each album in `src/data/albums.ts`, set:
```ts
previewAudioUrl: '/audio/my-track.mp3', // file in public/audio, or a URL you control
bpm: 124,                               // needed for Sync
```
- Only use audio you are authorised to stream **and** process.
- Remote URLs must send CORS headers (`Access-Control-Allow-Origin`), or the browser can't decode them.
- MP3, AAC/M4A, OGG and WAV all work wherever the browser supports them.

---

## Streaming services: YouTube, SoundCloud, Apple Music, Spotify

Add any of these fields to an album in `src/data/albums.ts`. Only the services' **official** players are used, and their scripts load only when a record actually needs them.

```ts
youtubeUrl:      'https://www.youtube.com/watch?v=VIDEO_ID',   // or youtu.be/…, /shorts/…, or the bare 11-char ID
soundcloudUrl:   'https://soundcloud.com/artist/track',        // public track or playlist
appleMusicUrl:   'https://music.apple.com/us/album/name/ID',   // album, song or playlist link
spotifyEmbedUrl: 'https://open.spotify.com/embed/album/ID',    // + optional spotifyAlbumUrl for "Open in Spotify"
```

If a record has more than one source, the player shows **source tabs** (Audio / YouTube / SoundCloud / Apple Music / Spotify). The default order is the order shown in the table below.

| Source | How it's connected | Our play/pause + seek | Vinyl & tonearm | DJ Mode |
| --- | --- | --- | --- | --- |
| Audio file (`previewAudioUrl`) | Web Audio engine | ✅ | ✅ real state | ✅ full mixing |
| **YouTube** | [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) (`youtube-nocookie.com` host) | ✅ via the API | ✅ follows YouTube's own state events (buffering doesn't count as playing) | ❌ |
| **SoundCloud** | [Widget API](https://developers.soundcloud.com/docs/api/html5-widget) | ✅ via the API | ✅ follows SoundCloud's PLAY/PAUSE/FINISH events | ❌ |
| **Apple Music** | Official embed (`embed.music.apple.com`) | ❌ controlled inside Apple's player | idle | ❌ |
| **Spotify** | Official embed (`open.spotify.com/embed`) | ❌ controlled inside Spotify's player | idle | ❌ |

Rules this follows:
- **No credentials needed** for any of the above.
- Full tracks on Apple Music and Spotify require the listener to be signed in to that service with a subscription. Otherwise those players play short previews.
- **The YouTube video stays visible** in a player at least 200 px tall, as YouTube's API terms require. We never hide the video or separate its audio.
- **Nothing is mixed.** No streaming service exposes its raw audio, so these records show `UNAVAILABLE` on the DJ decks, with the reason, and they're tagged "YouTube only" and so on in the deck's Load dialog. DJ Mode mixes only audio files you're licensed to process.
- If a provider reports an error, the player shows it in plain words. Errors include a private or removed video, the owner disabling embedding, or the script being blocked by a content blocker.
- **Privacy:** loading a YouTube, SoundCloud, Apple or Spotify player connects the visitor's browser to that company. If you need a cookie banner, gate these sources behind consent.

**Zing MP3:** there's no official public API, so it's not integrated. Unofficial "Zing APIs" scrape the site, and this project deliberately doesn't use them.

### Visitors can add their own playlists
There are two entry points: the **"+ Add your playlist"** button at the end of the shelf, and the **"Bring your playlist"** card in the info panel.

- **What visitors can paste:** a playlist, album or track link from Spotify, Apple Music, YouTube or SoundCloud. The dialog recognises the service as they type.
  - Spotify accepts `open.spotify.com/...` links (including `/intl-xx/`) and `spotify:` URIs.
  - YouTube accepts `playlist?list=` links, or a `watch?v=…&list=…` link to start from a specific video.
  - SoundCloud accepts `/sets/` playlists and single tracks.
  - Apple Music accepts album, playlist or song links.
- **Short share links** (`on.soundcloud.com`, `spotify.link`, `apple.co`) are rejected with a hint to open them and copy the full address. Anything else, such as Zing MP3, gets a friendly error.
- **The new record:** it gets a name (optional), a spine colour and generated cover art. It appears on the shelf with a "mine" tag and opens straight away. Visitors can remove it with "Remove from my shelf" in the player.
- **Storage:** records are saved in **that visitor's browser only** (`localStorage`, key `svc-record-club:my-records`, max 40). Nothing is uploaded, and other visitors can't see them. Links are re-validated on every load and only ever play through the services' official embeds.
- **Shared shelves:** sharing a shelf between people (for example a community playlist wall) would need a backend or database. That isn't included.

### Optional upgrades that need developer accounts
- **Apple MusicKit JS:** lets our own controls drive Apple Music. You need an Apple Developer Program membership and a MusicKit key, plus a small backend to sign the developer token (never ship the private key to the browser).
- **Spotify Web Playback SDK:** gives full-track control in Shelf Mode only. Setup:
  1. Create an app at <https://developer.spotify.com/dashboard> and register your redirect URI.
  2. Use **Authorization Code with PKCE**. Never put a client secret in frontend code.
  3. Request the scopes `streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state`.
  4. Listeners need **Spotify Premium** and a supported desktop browser.
  5. Store `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_REDIRECT_URI` in `.env.local`.
  6. Add an SDK branch in `src/audio/adapters.ts` that reports PLAYING only from `player_state_changed`.
  7. Keep the mixer disabled for that source.

---

## Replacing the sample collection

Everything is in **one file: `src/data/albums.ts`**. Every artist, title and label there is fictional.

```ts
type Album = {
  id: string; artist: string; title: string;
  year?: string; label?: string; format?: string; genre?: string;
  coverImage?: string;      // licensed artwork, e.g. '/covers/x.jpg' (put files in public/covers/)
  art: CoverArtSpec;        // generated fallback art: pattern + 3 colours (+ optional stamp)
  spineColor: string;       // shelf spine
  themeColor: string;       // stage background when selected
  bpm?: number; trackTitle?: string;
  previewAudioUrl?: string;
  youtubeUrl?: string; soundcloudUrl?: string; appleMusicUrl?: string;
  spotifyAlbumUrl?: string; spotifyEmbedUrl?: string;
};
```
- **Cover art:** by default each sleeve is generated as SVG (`src/components/stage/CoverArt.tsx`). Patterns: hearts, stars, checker, waves, bubbles, flower, smiley, chrome, rings, pixel, butterfly, grid. Set `coverImage` only for artwork you're licensed to use. Don't hotlink.
- **Theme colours:** pick light pastels for `themeColor`. The stage text switches between plum and cream automatically. `npm test` checks every catalogue theme meets 4.5:1 contrast.

### Site copy & switches: `src/config.ts`
`brand`, `productName`, `tagline`, `eventLabel` (the "● LISTENING CLUB · OPEN STUDIO" pill; set to `''` to hide), `description`, `credit`, and `qrUrl`.

If `qrUrl` is `null`, an abstract sticker is shown instead of a fake QR code. If it's set, a real "Visit ↗" link appears.

### Files the owner should replace
- `src/data/albums.ts`: your catalogue, plus any YouTube, SoundCloud, Apple Music or Spotify links
- `src/data/catalogue.ts`: merges your catalogue with visitors' own links (spine colour swatches live here)
- `public/audio/*`: your licensed audio (or keep the originals)
- `src/config.ts`: copy, event label, credit line
- Branding is typographic (an "SVC" monogram chip plus the wordmark). Swap in the official She Vibe Codes logo when one is supplied (`components/layout/Header.tsx`, the `brand-chip`).

---

## Architecture

```
src/
  App.tsx                     mode, selection, favourites, theme vars
  config.ts                   site copy & switches
  types.ts                    Album / CoverArtSpec / Mode
  data/albums.ts              sample catalogue (fictional)
  audio/
    engine.ts                 Web Audio engine: shelf + deck A/B channels, master
    adapters.ts               source abstraction: file | youtube | soundcloud | spotify | apple | none
    external/                 YouTube & SoundCloud controller store, script loader, API typings
    mixMath.ts (+ .test.ts)   crossfade curve, sync rate, beat-phase alignment
    useChannel.ts             useSyncExternalStore binding
  components/
    layout/   Header, MenuPopover, StageBar, InfoPanel
    stage/    FeaturedRecordStage, AlbumSleeve, CoverArt, VinylRecord, Tonearm,
              PlaybackControls (source tabs), ProgressBar, StageSticker,
              embeds/ (YouTubeEmbed, SoundCloudEmbed, IframeEmbed)
    shelf/    RecordShelf (listbox + roving tabindex), RecordSpine
    dj/       DJMode, Deck, Mixer, TrackPicker (<dialog>)
    ui/       Icon, HeartButton, Knob, LevelMeter
  styles/base.css             design tokens, buttons, focus, motion
scripts/generate-audio.mjs    original loop synthesiser
```

**Audio graph per deck:**
`BufferSource → trim → low-shelf → peaking → high-shelf → volume ─┬→ crossfade → master → speakers`
`                                                                  └→ analyser (meter)`

The Shelf channel uses the same chain but bypasses the crossfader.

**Design system:** tokens from the brief (`--sv-pink`, `--sv-hot-pink`, `--sv-lilac`, `--sv-blue`, `--sv-peach`, `--sv-butter`, `--sv-cream`, `--sv-ink`, `--sv-plum`), plus chrome/iridescent gradients used sparingly.
- Fonts (bundled, SIL OFL): **Fredoka** for display, **DM Sans** for body, and **Silkscreen** for pixel micro-labels.
- Responsive layout uses viewport media queries for the page and **container queries** on the stage, so the stage adapts to its own width.

**Accessibility:**
- Semantic landmarks, and a skip link to the shelf.
- The shelf is a listbox with roving tabindex. The mode switch is a radiogroup with arrow keys. The menu supports Esc, arrow keys and outside-click.
- Knobs are `role="slider"` with value text. Meters are `role="meter"`. Range inputs are used for faders and seek bars. Visible pink focus rings throughout.
- Touch targets are 44 px or larger.
- `prefers-reduced-motion`: sleeve and vinyl fade in instead of flying, the vinyl doesn't spin (the play button and status text still show the state), and the sparkles, bounce and floating sticker are turned off.

---

## Assumptions (all reversible)
- Fresh repo, so I chose Vite + React 18 + TypeScript with plain CSS and no UI or animation libraries.
- The DEADWAX reference's "Upgrade / Sign in" buttons and "Get the prompt" panel were left out. They aren't part of the record-shop experience, and sign-in would be a fake feature.
- "Live demo" in the info panel drops or lifts the needle on the featured record (switching back to Shelf Mode if needed).
- BPM comes from catalogue metadata. There's no automatic BPM detection.
- Leaving DJ Mode pauses both decks. Entering DJ Mode pauses the Shelf player.

## Known limitations
- No headphone/cue split (browser limitation, explained in the UI).
- Pitch changes key as well as tempo (vinyl-style). There's no key-lock/time-stretching.
- Sync is a one-shot match, not a continuous lock. If you move the pitch fader afterwards, the decks drift apart (the Sync button lights only while the tempos actually match).
- The demo WAVs are about 20 MB in total. For production, convert real catalogue audio to AAC/MP3.
- Spotify and Apple Music playback state isn't mirrored into the custom player: they're embed-only, with no SDK wired in.
- YouTube and SoundCloud load in about 1–5 s. On iOS, the first YouTube play may need a tap on the video itself (an iOS media rule).
