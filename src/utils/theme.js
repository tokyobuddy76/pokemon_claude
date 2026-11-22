import { useEffect, useState } from 'react';

/** Accent colours per Pokémon type, used for the results theme only. */
export const TYPE_COLORS = {
  normal: '#9a9a6e',
  fire: '#ee7f30',
  water: '#4f8ef0',
  electric: '#e9b800',
  grass: '#5fb340',
  ice: '#5cc6c2',
  fighting: '#c03028',
  poison: '#a040a0',
  ground: '#d4a948',
  flying: '#8f7fe8',
  psychic: '#f55887',
  bug: '#9aaa1f',
  rock: '#b49d3a',
  ghost: '#6e5896',
  dragon: '#6c3cf5',
  dark: '#5a4a40',
  steel: '#8f8fae',
  fairy: '#e37fbd',
};

export const DEFAULT_THEME = '#ef4036';

export function themeForTypes(types) {
  return (types && TYPE_COLORS[types[0]]) || DEFAULT_THEME;
}

/** Tracks the user's prefers-reduced-motion setting. */
export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
