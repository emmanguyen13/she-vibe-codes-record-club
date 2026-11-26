import { describe, expect, it } from 'vitest';
import { cleanHandle, cleanTitle, handleWall, LIMITS, memoryStore } from './wall';

const post = (body: unknown, ip = '1.2.3.4') =>
  new Request('http://x/api/wall', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body) });

describe('wall API', () => {
  it('503s honestly when no database is configured', async () => {
    const res = await handleWall(new Request('http://x/api/wall'), null);
    expect(res.status).toBe(503);
  });

  it('accepts a valid link, cleans fields, dedupes', async () => {
    const store = memoryStore();
    const res = await handleWall(post({ link: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x', title: ' Late‮ night http://spam.com mix ', handle: '@She.Vibe_Codes', swatch: 3 }), store);
    expect(res.status).toBe(201);
    const { entry } = await res.json();
    expect(entry).toMatchObject({ link: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', title: 'Late night mix', handle: 'she.vibe_codes', swatch: 3, what: 'Spotify playlist' });
    const again = await handleWall(post({ link: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' }), store);
    expect((await again.json()).duplicate).toBe(true);
    const list = await (await handleWall(new Request('http://x/api/wall'), store)).json();
    expect(list.entries).toHaveLength(1);
  });

  it('rejects links that are not official players', async () => {
    const res = await handleWall(post({ link: 'https://zingmp3.vn/album/x' }), memoryStore());
    expect(res.status).toBe(400);
    const xss = await handleWall(post({ link: 'javascript:alert(1)' }), memoryStore());
    expect(xss.status).toBe(400);
  });

  it('rate-limits per client', async () => {
    const store = memoryStore();
    let last = 0;
    for (let i = 0; i <= LIMITS.postsPerHour; i++) {
      last = (await handleWall(post({ link: `https://soundcloud.com/user/track-${i}` }, '9.9.9.9'), store)).status;
    }
    expect(last).toBe(429);
    expect((await handleWall(post({ link: 'https://soundcloud.com/user/other' }, '8.8.8.8'), store)).status).toBe(201);
  });

  it('only lets moderators delete', async () => {
    const store = memoryStore();
    const { entry } = await (await handleWall(post({ link: 'https://soundcloud.com/a/b' }), store)).json();
    const del = (auth?: string) =>
      handleWall(new Request(`http://x/api/wall?id=${entry.id}`, { method: 'DELETE', headers: auth ? { authorization: auth } : {} }), store, 'secret');
    expect((await del()).status).toBe(403);
    expect((await del('Bearer wrong')).status).toBe(403);
    expect((await del('Bearer secret')).status).toBe(200);
    expect(await store.count()).toBe(0);
  });

  it('cleans handles and titles', () => {
    expect(cleanHandle('https://www.threads.net/@she.vibe.codes')).toBe('she.vibe.codes');
    expect(cleanHandle('bad handle!')).toBeNull();
    expect(cleanTitle('a'.repeat(100))).toHaveLength(LIMITS.titleLen);
  });
});

import { storeFromEnv } from './wall';
describe('storeFromEnv', () => {
  it('finds plain, prefixed and Upstash-named credentials', () => {
    expect(storeFromEnv({ KV_REST_API_URL: 'https://a', KV_REST_API_TOKEN: 't' })).not.toBeNull();
    expect(storeFromEnv({ STORAGE_KV_REST_API_URL: 'https://a', STORAGE_KV_REST_API_TOKEN: 't' })).not.toBeNull();
    expect(storeFromEnv({ UPSTASH_REDIS_REST_URL: 'https://a', UPSTASH_REDIS_REST_TOKEN: 't' })).not.toBeNull();
    expect(storeFromEnv({ KV_REST_API_URL: 'https://a', KV_REST_API_READ_ONLY_TOKEN: 't' })).toBeNull();
    expect(storeFromEnv({})).toBeNull();
  });
});
