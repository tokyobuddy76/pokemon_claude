/**
 * GET /api/pokemon?id=<National Pokédex number>
 *
 * Server-side proxy to the public PokéAPI. The browser never calls
 * PokéAPI directly, and it only ever sends a Pokémon id to this route,
 * never quiz answers.
 *
 * - Only ids that exist in the PokéMatch profile list are accepted
 *   (validated before any outbound request).
 * - Upstream requests time out (default 8 s) → 504.
 * - Upstream errors or incomplete payloads → 502. No data is invented.
 * - Missing artwork is returned as `artwork: null` and never replaced.
 *
 * PokéAPI requires no key. If a future provider needs one, read it here
 * from process.env (never with a VITE_ prefix) and, when missing, return
 * 503 { error: 'key not configured' } BEFORE calling the provider, e.g.:
 *   const key = process.env.SOME_PROVIDER_KEY;
 *   if (!key) return sendJson(res, 503, { error: 'key not configured' });
 *
 * Written against Node's plain (req, res) interface so the same handler
 * runs on Vercel and inside the Vite dev-server middleware.
 */

import { ALLOWED_POKEMON_IDS } from '../src/data/pokemonProfiles.js';

const DEFAULT_BASE_URL = 'https://pokeapi.co/api/v2';
const DEFAULT_TIMEOUT_MS = 8000;

function config() {
  const base = (process.env.POKEAPI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const timeout = Number.parseInt(process.env.POKEAPI_TIMEOUT_MS ?? '', 10);
  return {
    baseUrl: base,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 && timeout <= 30000 ? timeout : DEFAULT_TIMEOUT_MS,
  };
}

function sendJson(res, status, body, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

/** Parses and validates the id. Returns a number, or null if invalid. */
export function parsePokemonId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d{0,3}$/.test(raw)) return null;
  const id = Number(raw);
  return ALLOWED_POKEMON_IDS.has(id) ? id : null;
}

const titleCase = (slug) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

/**
 * Reduces the PokéAPI payload to the fields PokéMatch shows.
 * Returns null when required fields are missing (incomplete response).
 */
export function mapPokemon(data, expectedId) {
  if (!data || typeof data !== 'object') return null;
  const { id, height, weight, types, abilities, sprites } = data;
  // Prefer the species name ("mimikyu") over the default form name ("mimikyu-disguised").
  const name = typeof data.species?.name === 'string' && data.species.name ? data.species.name : data.name;
  if (id !== expectedId || typeof name !== 'string' || !name) return null;
  if (!Array.isArray(types) || types.length === 0) return null;

  const typeNames = types
    .slice()
    .sort((a, b) => (a?.slot ?? 0) - (b?.slot ?? 0))
    .map((t) => t?.type?.name)
    .filter((t) => typeof t === 'string' && t);
  if (typeNames.length === 0) return null;

  const abilityList = Array.isArray(abilities)
    ? abilities
        .filter((a) => typeof a?.ability?.name === 'string')
        .map((a) => ({ name: titleCase(a.ability.name), hidden: Boolean(a.is_hidden) }))
    : [];

  const artworkUrl = sprites?.other?.['official-artwork']?.front_default;
  const artwork = typeof artworkUrl === 'string' && /^https:\/\//.test(artworkUrl) ? artworkUrl : null;

  return {
    id,
    name: titleCase(name),
    types: typeNames,
    // PokéAPI units: height in decimetres, weight in hectograms. null if absent.
    heightM: Number.isFinite(height) ? height / 10 : null,
    weightKg: Number.isFinite(weight) ? weight / 10 : null,
    abilities: abilityList,
    artwork,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const url = new URL(req.url ?? '/', 'http://localhost');
  const id = parsePokemonId(url.searchParams.get('id'));
  if (id === null) {
    return sendJson(res, 400, { error: 'Invalid Pokémon id.' });
  }

  const { baseUrl, timeoutMs } = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(`${baseUrl}/pokemon/${id}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'PokeMatch/1.0 (fan quiz)' },
    });
    if (!upstream.ok) {
      return sendJson(res, 502, { error: `PokéAPI responded with status ${upstream.status}.` });
    }
    let data;
    try {
      data = await upstream.json();
    } catch {
      return sendJson(res, 502, { error: 'PokéAPI returned an unreadable response.' });
    }
    const pokemon = mapPokemon(data, id);
    if (!pokemon) {
      return sendJson(res, 502, { error: 'PokéAPI returned incomplete data for this Pokémon.' });
    }
    // Official data changes rarely. Cache at the edge to respect PokéAPI fair use.
    return sendJson(res, 200, pokemon, 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  } catch (err) {
    if (err?.name === 'AbortError') {
      return sendJson(res, 504, { error: 'PokéAPI took too long to respond.' });
    }
    return sendJson(res, 502, { error: 'Could not reach PokéAPI.' });
  } finally {
    clearTimeout(timer);
  }
}
