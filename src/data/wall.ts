import { useSyncExternalStore } from 'react';
import type { Album } from '../types';
import type { WallEntry } from '../../server/wall';
import { linkRecord, patternFor, registerExtraLookup } from './catalogue';

/**
 * Client for the shared community wall (/api/wall). If the database isn't
 * connected the API answers 503 and the UI says so — it never pretends.
 */
export type WallStatus = 'idle' | 'loading' | 'ready' | 'offline' | 'error';
type State = { status: WallStatus; albums: Album[]; message: string | null; updatedAt: number };

const ADMIN_KEY = 'svc-wall-admin';
let state: State = { status: 'idle', albums: [], message: null, updatedAt: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

function toAlbum(e: WallEntry): Album | null {
  const a = linkRecord({
    id: `wall-${e.id}`,
    title: e.title,
    link: e.link,
    swatch: e.swatch,
    pattern: patternFor(e.id),
    artist: e.handle ? `@${e.handle}` : 'Community',
    format: 'Community wall',
    stamp: 'wall',
  });
  return a && { ...a, wallId: e.id, sharedBy: e.handle };
}

async function readError(res: Response, fallback: string) {
  try {
    const j = (await res.json()) as { message?: string };
    return j.message ?? fallback;
  } catch {
    return fallback;
  }
}

export const wall = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getState: () => state,

  async load() {
    if (state.status === 'idle') set({ status: 'loading' });
    try {
      const res = await fetch('/api/wall', { headers: { accept: 'application/json' } });
      if (res.status === 503 || res.status === 404) {
        set({ status: 'offline', message: 'The community wall isn’t switched on yet.' });
        return;
      }
      if (!res.ok) throw new Error(await readError(res, 'Couldn’t load the wall.'));
      const { entries } = (await res.json()) as { entries: WallEntry[] };
      set({ status: 'ready', albums: entries.map(toAlbum).filter((a): a is Album => !!a), message: null, updatedAt: Date.now() });
    } catch (err) {
      set({ status: state.albums.length ? 'ready' : 'error', message: err instanceof Error ? err.message : 'Network error.' });
    }
  },

  /** Posts a link; resolves to the new record id or an error message. */
  async post(input: { link: string; title: string; handle: string; swatch: number }): Promise<{ id: string } | { error: string }> {
    try {
      const res = await fetch('/api/wall', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) return { error: await readError(res, 'Couldn’t post to the wall.') };
      const { entry } = (await res.json()) as { entry: WallEntry };
      await wall.load();
      return { id: `wall-${entry.id}` };
    } catch {
      return { error: 'Network error — check your connection and try again.' };
    }
  },

  // ── moderation ──
  get adminToken(): string | null {
    try {
      return sessionStorage.getItem(ADMIN_KEY);
    } catch {
      return null;
    }
  },
  setAdminToken(token: string | null) {
    try {
      if (token) sessionStorage.setItem(ADMIN_KEY, token);
      else sessionStorage.removeItem(ADMIN_KEY);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
  async remove(wallId: string): Promise<string | null> {
    const token = wall.adminToken;
    if (!token) return 'Moderator token missing.';
    const res = await fetch(`/api/wall?id=${encodeURIComponent(wallId)}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    if (res.status === 403) {
      wall.setAdminToken(null);
      return 'That moderator token was rejected.';
    }
    await wall.load();
    return res.ok ? null : await readError(res, 'Couldn’t remove it.');
  },
};

export function useWall() {
  return useSyncExternalStore(wall.subscribe, wall.getState, wall.getState);
}

registerExtraLookup((id) => state.albums.find((a) => a.id === id));
