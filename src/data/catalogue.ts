import { useSyncExternalStore } from 'react';
import type { Album, CoverPattern } from '../types';
import { albums as curated } from './albums';
import { detectLink } from '../audio/adapters';

/**
 * The shelf = the curated catalogue + records the visitor added by pasting a
 * playlist/album link. Visitor records live in localStorage on their device
 * only (no server); every stored link is re-validated on load.
 */
const KEY = 'svc-record-club:my-records';
const MAX = 40;

export const SWATCHES = [
  { name: 'Bubblegum', spine: '#FF7FB8', theme: '#FFCFE6', art: ['#FF8FCB', '#FFF0A8', '#FFFFFF'] },
  { name: 'Lilac', spine: '#A98BFF', theme: '#DCD0FF', art: ['#C9B8FF', '#FF8FCB', '#FFF9F5'] },
  { name: 'Baby blue', spine: '#5FA8E8', theme: '#D2EAFF', art: ['#A9D8FF', '#FFF9F5', '#FFF0A8'] },
  { name: 'Peach', spine: '#F4A58A', theme: '#FFDCCD', art: ['#FFC6AE', '#FF8FCB', '#FFF9F5'] },
  { name: 'Butter', spine: '#FFD23F', theme: '#FFF1B0', art: ['#FFF0A8', '#FFC6AE', '#684568'] },
] as const;

const PATTERNS: CoverPattern[] = ['hearts', 'stars', 'bubbles', 'flower', 'rings', 'waves', 'butterfly', 'checker'];

/** Builds a shelf record that plays a pasted link through the official player. */
export function linkRecord(r: {
  id: string; title: string; link: string; swatch: number; pattern: CoverPattern; artist: string; format: string; stamp: string;
}): Album | null {
  const d = detectLink(r.link);
  if (!d.ok) return null;
  const sw = SWATCHES[r.swatch] ?? SWATCHES[0];
  return {
    id: r.id,
    artist: r.artist,
    title: r.title,
    genre: d.what,
    format: r.format,
    art: { pattern: r.pattern, colors: [...sw.art] as [string, string, string], stamp: r.stamp },
    spineColor: sw.spine,
    themeColor: sw.theme,
    ...d.fields,
  };
}

export const patternFor = (seed: string): CoverPattern => {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PATTERNS[h % PATTERNS.length];
};

type Stored = { id: string; title: string; link: string; swatch: number; pattern: CoverPattern; added: number };

function toAlbum(r: Stored): Album | null {
  const a = linkRecord({ ...r, artist: 'Added by you', format: 'Your link', stamp: 'mine' });
  return a && { ...a, userAdded: true };
}

function read(): Stored[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r): r is Stored => r && typeof r.id === 'string' && typeof r.link === 'string' && typeof r.title === 'string')
      .map((r) => ({ ...r, title: r.title.slice(0, 60), pattern: PATTERNS.includes(r.pattern) ? r.pattern : 'hearts' }))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

let stored: Stored[] = typeof window !== 'undefined' ? read() : [];
let snapshot: Album[] = build();
const listeners = new Set<() => void>();

function build(): Album[] {
  return [...curated, ...stored.map(toAlbum).filter((a): a is Album => !!a)];
}
function commit(next: Stored[]) {
  stored = next;
  snapshot = build();
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* storage blocked → keeps working in memory for this visit */
  }
  listeners.forEach((l) => l());
}

// The community wall registers itself here so decks & lookups can find its records.
let extraFind: (id: string | null | undefined) => Album | undefined = () => undefined;
export function registerExtraLookup(fn: typeof extraFind) {
  extraFind = fn;
}

export const catalogue = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getAll: () => snapshot,
  find: (id: string | null | undefined) => snapshot.find((a) => a.id === id) ?? extraFind(id),
  get full() {
    return stored.length >= MAX;
  },
  /** Adds a visitor record; returns its id, or an error message. */
  add(link: string, title: string, swatch: number): { id: string } | { error: string } {
    const d = detectLink(link);
    if (!d.ok) return { error: d.error };
    if (stored.length >= MAX) return { error: `Your shelf is full (${MAX} links). Remove one first.` };
    const canonical = d.fields.youtubeUrl ?? d.fields.soundcloudUrl ?? d.fields.appleMusicUrl ?? d.fields.spotifyAlbumUrl ?? link.trim();
    const dupe = stored.find((r) => r.link === canonical);
    if (dupe) return { id: dupe.id };
    const id = `mine-${Date.now().toString(36)}`;
    const name = title.trim().slice(0, 60) || `My ${d.what}`;
    commit([...stored, { id, title: name, link: canonical, swatch, pattern: PATTERNS[stored.length % PATTERNS.length], added: Date.now() }]);
    return { id };
  },
  remove(id: string) {
    commit(stored.filter((r) => r.id !== id));
  },
};

export function useCatalogue(): Album[] {
  return useSyncExternalStore(catalogue.subscribe, catalogue.getAll, catalogue.getAll);
}
