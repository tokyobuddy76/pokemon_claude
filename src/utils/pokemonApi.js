/**
 * Frontend client for /api/pokemon. The browser only ever talks to our
 * own serverless function, never to PokéAPI directly, and it only sends a
 * Pokémon id.
 */
import { useCallback, useEffect, useState } from 'react';

const CLIENT_TIMEOUT_MS = 12000;
const SLOW_AFTER_MS = 4000;

const cache = new Map(); // id → data (successful responses only)
const inFlight = new Map(); // id → Promise

export class PokemonApiError extends Error {}

function friendlyMessage(status) {
  if (status === 504) return 'The Pokémon database is taking too long to answer.';
  if (status === 400) return "We couldn't look up this Pokémon.";
  return 'The Pokémon database is unavailable right now.';
}

/** Checks the payload has what the UI needs. Missing artwork is allowed (null). */
function isValidPokemon(data, id) {
  return (
    data &&
    data.id === id &&
    typeof data.name === 'string' &&
    Array.isArray(data.types) &&
    data.types.length > 0 &&
    Array.isArray(data.abilities) &&
    (data.artwork === null || typeof data.artwork === 'string')
  );
}

export async function fetchPokemon(id) {
  if (cache.has(id)) return cache.get(id);
  if (inFlight.has(id)) return inFlight.get(id);

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      let response;
      try {
        response = await fetch(`/api/pokemon?id=${encodeURIComponent(id)}`, { signal: controller.signal });
      } catch (err) {
        throw new PokemonApiError(
          err?.name === 'AbortError'
            ? 'The Pokémon database is taking too long to answer.'
            : "We couldn't connect. Please check your internet connection.",
        );
      }
      if (!response.ok) throw new PokemonApiError(friendlyMessage(response.status));
      const data = await response.json().catch(() => null);
      if (!isValidPokemon(data, id)) throw new PokemonApiError('We received incomplete Pokémon data.');
      cache.set(id, data);
      return data;
    } finally {
      clearTimeout(timer);
      inFlight.delete(id);
    }
  })();

  inFlight.set(id, request);
  return request;
}

/**
 * React hook: { status: 'loading' | 'success' | 'error', data, error, slow, retry }
 * `slow` turns true when a request takes longer than 4 s.
 */
export function usePokemon(id) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() =>
    cache.has(id) ? { status: 'success', data: cache.get(id), error: null, slow: false } : { status: 'loading', data: null, error: null, slow: false },
  );

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(id) || id <= 0) {
      setState({ status: 'error', data: null, error: "We couldn't look up this Pokémon.", slow: false });
      return undefined;
    }
    if (cache.has(id)) {
      setState({ status: 'success', data: cache.get(id), error: null, slow: false });
      return undefined;
    }
    setState({ status: 'loading', data: null, error: null, slow: false });
    const slowTimer = setTimeout(() => active && setState((s) => (s.status === 'loading' ? { ...s, slow: true } : s)), SLOW_AFTER_MS);
    fetchPokemon(id)
      .then((data) => active && setState({ status: 'success', data, error: null, slow: false }))
      .catch((err) =>
        active &&
        setState({
          status: 'error',
          data: null,
          error: err instanceof PokemonApiError ? err.message : 'Something went wrong while loading this Pokémon.',
          slow: false,
        }),
      )
      .finally(() => clearTimeout(slowTimer));
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
