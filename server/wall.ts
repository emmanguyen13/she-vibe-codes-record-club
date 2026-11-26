/**
 * Community playlist wall — request handler shared by the Vercel Function
 * (api/wall.ts) and the local Vite dev server (in-memory store).
 *
 *   GET    /api/wall          → { entries: WallEntry[] }  (newest first)
 *   POST   /api/wall          → body { link, title?, handle?, swatch? }
 *   DELETE /api/wall?id=…     → moderator only (Authorization: Bearer WALL_ADMIN_TOKEN)
 *
 * Every link is re-validated server-side with the same parser the UI uses, so
 * only official Spotify / Apple Music / YouTube / SoundCloud players can end
 * up on the wall. Titles are plain text (React escapes them on render).
 */
import { detectLink } from '../src/audio/adapters.js';

export type WallEntry = {
  id: string;
  link: string;
  title: string;
  handle: string | null; // Threads handle without "@"
  swatch: number;
  what: string; // e.g. "Spotify playlist"
  createdAt: number;
};

export interface WallStore {
  all(): Promise<WallEntry[]>;
  count(): Promise<number>;
  put(e: WallEntry): Promise<void>;
  remove(id: string): Promise<boolean>;
  /** Increments a counter that expires after `windowSec`; returns the new value. */
  hit(key: string, windowSec: number): Promise<number>;
}

export const LIMITS = { maxEntries: 500, postsPerHour: 6, titleLen: 60 };

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

const HANDLE = /^[A-Za-z0-9._]{1,30}$/;

export function cleanTitle(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, '') // control & bidi chars
    .replace(/https?:\/\/\S+/gi, '') // no links in titles
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITS.titleLen);
}

export function cleanHandle(raw: unknown): string | null {
  const h = String(raw ?? '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?threads\.(net|com)\/@?/i, '').replace(/\/.*$/, '');
  return HANDLE.test(h) ? h.toLowerCase() : null;
}

async function clientKey(req: Request): Promise<string> {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  // store only a hash of the IP, never the raw address
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`svc-wall:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handleWall(req: Request, store: WallStore | null, adminToken?: string): Promise<Response> {
  if (!store) return json({ error: 'not_configured', message: 'The community wall database isn’t connected yet.' }, 503);
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      const entries = (await store.all()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 300);
      return json({ entries });
    }

    if (req.method === 'POST') {
      const len = Number(req.headers.get('content-length') ?? 0);
      if (len > 4000) return json({ error: 'too_large' }, 413);
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return json({ error: 'bad_json', message: 'Invalid request.' }, 400);
      }
      const detected = detectLink(String(body.link ?? '').slice(0, 500));
      if (!detected.ok) return json({ error: 'bad_link', message: detected.error }, 400);
      const f = detected.fields;
      const link = f.youtubeUrl ?? f.soundcloudUrl ?? f.appleMusicUrl ?? f.spotifyAlbumUrl ?? '';

      const existing = (await store.all()).find((e) => e.link === link);
      if (existing) return json({ entry: existing, duplicate: true });

      const hits = await store.hit(`post:${await clientKey(req)}`, 3600);
      if (hits > LIMITS.postsPerHour) {
        return json({ error: 'rate_limited', message: 'That’s a lot of sharing! Try again in an hour ♡' }, 429);
      }
      if ((await store.count()) >= LIMITS.maxEntries) {
        return json({ error: 'full', message: 'The wall is full right now — ask a moderator to make room.' }, 507);
      }
      const swatch = Number.isInteger(body.swatch) && (body.swatch as number) >= 0 && (body.swatch as number) < 5 ? (body.swatch as number) : 0;
      const entry: WallEntry = {
        id: crypto.randomUUID().slice(0, 12),
        link,
        title: cleanTitle(body.title) || `A ${detected.what}`,
        handle: cleanHandle(body.handle),
        swatch,
        what: detected.what,
        createdAt: Date.now(),
      };
      await store.put(entry);
      return json({ entry }, 201);
    }

    if (req.method === 'DELETE') {
      const auth = req.headers.get('authorization') ?? '';
      if (!adminToken || auth !== `Bearer ${adminToken}`) return json({ error: 'forbidden' }, 403);
      const id = url.searchParams.get('id') ?? '';
      const ok = await store.remove(id);
      return json({ removed: ok }, ok ? 200 : 404);
    }

    return json({ error: 'method_not_allowed' }, 405, { allow: 'GET, POST, DELETE' });
  } catch (err) {
    console.error('[wall]', err);
    return json({ error: 'server_error', message: 'The wall hiccuped — please try again.' }, 500);
  }
}

/** Upstash Redis over its REST API (no SDK needed). */
export function redisStore(baseUrl: string, token: string): WallStore {
  const KEY = 'svc:wall';
  const cmd = async <T>(...args: (string | number)[]): Promise<T> => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = (await res.json()) as { result?: T; error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? `Redis HTTP ${res.status}`);
    return data.result as T;
  };
  return {
    async all() {
      const flat = (await cmd<string[]>('HGETALL', KEY)) ?? [];
      const out: WallEntry[] = [];
      for (let i = 1; i < flat.length; i += 2) {
        try {
          out.push(JSON.parse(flat[i]) as WallEntry);
        } catch {
          /* skip corrupt row */
        }
      }
      return out;
    },
    count: () => cmd<number>('HLEN', KEY),
    async put(e) {
      await cmd('HSET', KEY, e.id, JSON.stringify(e));
    },
    async remove(id) {
      return (await cmd<number>('HDEL', KEY, id)) > 0;
    },
    async hit(key, windowSec) {
      const k = `svc:rl:${key}`;
      const n = await cmd<number>('INCR', k);
      if (n === 1) await cmd('EXPIRE', k, windowSec);
      return n;
    },
  };
}

/** In-memory store for local development and tests. */
export function memoryStore(seed: WallEntry[] = []): WallStore {
  const rows = new Map(seed.map((e) => [e.id, e]));
  const counters = new Map<string, { n: number; until: number }>();
  return {
    all: async () => [...rows.values()],
    count: async () => rows.size,
    put: async (e) => void rows.set(e.id, e),
    remove: async (id) => rows.delete(id),
    async hit(key, windowSec) {
      const now = Date.now();
      const c = counters.get(key);
      const next = !c || c.until < now ? { n: 1, until: now + windowSec * 1000 } : { n: c.n + 1, until: c.until };
      counters.set(key, next);
      return next.n;
    },
  };
}

export function storeFromEnv(env: Record<string, string | undefined>): WallStore | null {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? redisStore(url, token) : null;
}
