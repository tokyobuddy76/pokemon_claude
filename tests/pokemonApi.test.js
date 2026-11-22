import { describe, it, expect, vi, afterEach } from 'vitest';
import handler, { mapPokemon, parsePokemonId } from '../api/pokemon.js';

/** Minimal Node-style response double. */
function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    headersSent: false,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end(chunk) {
      this.body = chunk ? JSON.parse(chunk) : undefined;
      this.headersSent = true;
    },
  };
}
const call = async (url, method = 'GET') => {
  const res = mockRes();
  await handler({ method, url }, res);
  return res;
};

const pikachuPayload = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  types: [{ slot: 1, type: { name: 'electric' } }],
  abilities: [
    { ability: { name: 'static' }, is_hidden: false },
    { ability: { name: 'lightning-rod' }, is_hidden: true },
  ],
  sprites: { other: { 'official-artwork': { front_default: 'https://example.com/25.png' } } },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('id validation', () => {
  it('accepts ids in the PokéMatch list only', () => {
    expect(parsePokemonId('25')).toBe(25);
    expect(parsePokemonId('2')).toBeNull(); // valid Pokémon, but not in the quiz list
    for (const bad of [null, '', '0', '-1', '25.5', '025', 'pikachu', '1e3', '99999', '../etc', '25;drop']) {
      expect(parsePokemonId(bad)).toBeNull();
    }
  });

  it('returns 400 without calling upstream for invalid ids', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await call('/api/pokemon?id=abc');
    expect(res.statusCode).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects non-GET methods', async () => {
    const res = await call('/api/pokemon?id=25', 'POST');
    expect(res.statusCode).toBe(405);
  });
});

describe('upstream handling', () => {
  it('maps a full PokéAPI payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => pikachuPayload })));
    const res = await call('/api/pokemon?id=25');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 25,
      name: 'Pikachu',
      types: ['electric'],
      heightM: 0.4,
      weightKg: 6,
      abilities: [
        { name: 'Static', hidden: false },
        { name: 'Lightning Rod', hidden: true },
      ],
      artwork: 'https://example.com/25.png',
    });
    expect(res.headers['cache-control']).toMatch(/s-maxage/);
  });

  it('returns artwork: null instead of inventing an image', () => {
    const noArt = { ...pikachuPayload, sprites: { other: {} } };
    expect(mapPokemon(noArt, 25).artwork).toBeNull();
  });

  it('returns 502 for incomplete data', async () => {
    const incomplete = { ...pikachuPayload, types: [] };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => incomplete })));
    expect((await call('/api/pokemon?id=25')).statusCode).toBe(502);
  });

  it('returns 502 when the id in the payload does not match', () => {
    expect(mapPokemon({ ...pikachuPayload, id: 26 }, 25)).toBeNull();
  });

  it('returns 502 on upstream error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    const res = await call('/api/pokemon?id=25');
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toMatch(/503/);
  });

  it('returns 502 on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('fetch failed');
    }));
    expect((await call('/api/pokemon?id=25')).statusCode).toBe(502);
  });

  it('returns 504 on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }));
    expect((await call('/api/pokemon?id=25')).statusCode).toBe(504);
  });
});
