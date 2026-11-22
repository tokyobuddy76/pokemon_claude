import { describe, it, expect } from 'vitest';
import { DIMENSIONS, QUESTIONS } from '../src/data/questions.js';
import { POKEMON_PROFILES, ALLOWED_POKEMON_IDS } from '../src/data/pokemonProfiles.js';
import {
  calculateRawScores,
  calculateSimilarity,
  calculateUserProfile,
  compareMatches,
  findBestMatches,
  getMaxPossibleScores,
  getTopTraits,
  normalizeScores,
  rankPokemon,
  validateAnswers,
} from '../src/utils/matchingAlgorithm.js';
import { buildExplanation, buildMatchReason, buildShareText, getStrengths } from '../src/utils/explanations.js';

/** Answers that pick option `index` for every question. */
const uniformAnswers = (index) => Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[index].id]));

/** Small deterministic PRNG (mulberry32), used only to sample answer sets in tests. */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randomAnswers = (rand) =>
  Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[Math.floor(rand() * q.options.length)].id]));

const flat = (value) => Object.fromEntries(DIMENSIONS.map((d) => [d, value]));
const fakePokemon = (id, scores) => ({
  id,
  name: `Test${id}`,
  profile: Object.fromEntries(DIMENSIONS.map((d, i) => [d, scores[i]])),
});

describe('data integrity', () => {
  it('has 10 questions with 4 distinct options each, all weighting known dimensions', () => {
    expect(QUESTIONS).toHaveLength(10);
    const optionIds = new Set();
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(4);
      for (const o of q.options) {
        expect(optionIds.has(o.id)).toBe(false);
        optionIds.add(o.id);
        expect(Object.keys(o.weights).length).toBeGreaterThan(0);
        for (const [dim, w] of Object.entries(o.weights)) {
          expect(DIMENSIONS).toContain(dim);
          expect(w).toBeGreaterThan(0);
          expect(w).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  it('has at least 50 Pokémon with unique ids and complete 0–100 profiles', () => {
    expect(POKEMON_PROFILES.length).toBeGreaterThanOrEqual(50);
    expect(ALLOWED_POKEMON_IDS.size).toBe(POKEMON_PROFILES.length);
    for (const p of POKEMON_PROFILES) {
      expect(Number.isInteger(p.id)).toBe(true);
      expect(p.description.length).toBeGreaterThan(10);
      for (const dim of DIMENSIONS) {
        expect(p.profile[dim]).toBeGreaterThanOrEqual(0);
        expect(p.profile[dim]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('every dimension can be reached by at least one answer', () => {
    const max = getMaxPossibleScores();
    for (const dim of DIMENSIONS) expect(max[dim]).toBeGreaterThan(0);
  });
});

describe('answer validation', () => {
  it('accepts a complete answer set', () => {
    expect(validateAnswers(uniformAnswers(0)).valid).toBe(true);
  });

  it('reports missing and invalid answers', () => {
    const answers = uniformAnswers(0);
    delete answers.q3;
    answers.q5 = 'not-a-real-option';
    const result = validateAnswers(answers);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['q3']);
    expect(result.invalid).toEqual(['q5']);
  });

  it('rejects non-object input', () => {
    expect(validateAnswers(null).valid).toBe(false);
    expect(validateAnswers([]).valid).toBe(false);
    expect(validateAnswers('q1a').valid).toBe(false);
  });

  it('refuses to profile an incomplete quiz', () => {
    expect(() => calculateUserProfile({ q1: 'q1a' })).toThrow(/incomplete/);
    expect(() => findBestMatches({})).toThrow();
  });
});

describe('score normalisation', () => {
  it('computes the per-dimension maximum from the best option of each question', () => {
    const questions = [
      { id: 'a', options: [{ id: 'a1', weights: { courage: 3 } }, { id: 'a2', weights: { courage: 1, calmness: 2 } }] },
      { id: 'b', options: [{ id: 'b1', weights: { courage: 2 } }, { id: 'b2', weights: { calmness: 1 } }] },
    ];
    const max = getMaxPossibleScores(questions);
    expect(max.courage).toBe(5);
    expect(max.calmness).toBe(3);
    expect(max.loyalty).toBe(0);
  });

  it('scales raw totals to 0–100 and guards against divide-by-zero', () => {
    const max = { ...flat(10), loyalty: 0 };
    const raw = { ...flat(5), courage: 10, calmness: 0 };
    const norm = normalizeScores(raw, max);
    expect(norm.courage).toBe(100);
    expect(norm.calmness).toBe(0);
    expect(norm.intelligence).toBe(50);
    expect(norm.loyalty).toBe(0);
  });

  it('keeps every user dimension within 0–100 for many answer sets', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 500; i++) {
      const profile = calculateUserProfile(randomAnswers(rand));
      for (const dim of DIMENSIONS) {
        expect(profile[dim]).toBeGreaterThanOrEqual(0);
        expect(profile[dim]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('raw scores equal the sum of the chosen option weights', () => {
    const answers = uniformAnswers(0);
    const raw = calculateRawScores(answers);
    const expected = flat(0);
    for (const q of QUESTIONS) for (const [d, w] of Object.entries(q.options[0].weights)) expected[d] += w;
    expect(raw).toEqual(expected);
  });
});

describe('similarity', () => {
  it('gives an identical profile a 100% match', () => {
    const profile = POKEMON_PROFILES[0].profile;
    const result = calculateSimilarity(profile, profile);
    expect(result.score).toBeCloseTo(1, 10);
    expect(result.percent).toBe(100);
    expect(result.maxGap).toBeCloseTo(0, 10);
  });

  it('always returns scores in [0, 1] with percent = round(score × 100)', () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const user = calculateUserProfile(randomAnswers(rand));
      for (const p of POKEMON_PROFILES) {
        const s = calculateSimilarity(user, p.profile);
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(1);
        expect(s.percent).toBe(Math.round(s.score * 100));
      }
    }
  });

  it('scores an opposite-shaped profile lower than a same-shaped one', () => {
    const user = fakePokemon(0, [90, 10, 90, 10, 90, 10, 90, 10]).profile;
    const same = fakePokemon(1, [80, 20, 80, 20, 80, 20, 80, 20]).profile;
    const opposite = fakePokemon(2, [20, 80, 20, 80, 20, 80, 20, 80]).profile;
    expect(calculateSimilarity(user, same).score).toBeGreaterThan(calculateSimilarity(user, opposite).score);
  });

  it('does not reward a profile just for being high everywhere', () => {
    const user = fakePokemon(0, [90, 20, 30, 20, 30, 20, 30, 90]).profile;
    const matchingShape = fakePokemon(1, [70, 30, 40, 30, 40, 30, 40, 70]).profile;
    const maxedOut = fakePokemon(2, [100, 95, 95, 95, 95, 95, 95, 100]).profile;
    expect(calculateSimilarity(user, matchingShape).score).toBeGreaterThan(calculateSimilarity(user, maxedOut).score);
  });

  it('treats a perfectly flat profile as neutral rather than crashing', () => {
    const result = calculateSimilarity(flat(50), POKEMON_PROFILES[0].profile);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.shape).toBe(0.5);
  });
});

describe('determinism', () => {
  it('returns identical results for identical answers', () => {
    const rand = mulberry32(2024);
    for (let i = 0; i < 100; i++) {
      const answers = randomAnswers(rand);
      const a = findBestMatches(answers);
      const b = findBestMatches({ ...answers });
      expect(b.matches.map((m) => [m.pokemon.id, m.score])).toEqual(a.matches.map((m) => [m.pokemon.id, m.score]));
      expect(b.userProfile).toEqual(a.userProfile);
    }
  });

  it('does not depend on the order of the profile list', () => {
    const answers = uniformAnswers(2);
    const forward = rankPokemon(calculateUserProfile(answers), POKEMON_PROFILES).map((m) => m.pokemon.id);
    const reversed = rankPokemon(calculateUserProfile(answers), [...POKEMON_PROFILES].reverse()).map((m) => m.pokemon.id);
    expect(reversed).toEqual(forward);
  });

  it('does not use Math.random', () => {
    const original = Math.random;
    Math.random = () => {
      throw new Error('Math.random must not be used by the matching engine');
    };
    try {
      expect(() => findBestMatches(uniformAnswers(1))).not.toThrow();
    } finally {
      Math.random = original;
    }
  });
});

describe('tie-breaking', () => {
  const user = fakePokemon(0, [80, 40, 60, 30, 50, 70, 20, 90]).profile;

  it('breaks an exact score tie by lower National Pokédex number', () => {
    const scores = [70, 40, 60, 30, 50, 70, 20, 80];
    const ranked = rankPokemon(user, [fakePokemon(300, scores), fakePokemon(12, scores), fakePokemon(150, scores)]);
    expect(ranked.map((m) => m.pokemon.id)).toEqual([12, 150, 300]);
    expect(ranked[0].score).toBe(ranked[1].score);
  });

  it('prefers the smaller largest single-dimension gap before the Pokédex number', () => {
    const base = { pokemon: { id: 1 }, score: 0.8, maxGap: 30 };
    const evener = { pokemon: { id: 99 }, score: 0.8, maxGap: 10 };
    expect([base, evener].sort(compareMatches).map((m) => m.pokemon.id)).toEqual([99, 1]);
  });

  it('treats differences below 1e-9 as a tie', () => {
    const a = { pokemon: { id: 50 }, score: 0.75 + 1e-12, maxGap: 20 };
    const b = { pokemon: { id: 5 }, score: 0.75, maxGap: 20 };
    expect([a, b].sort(compareMatches).map((m) => m.pokemon.id)).toEqual([5, 50]);
  });

  it('a higher score always beats the tie-breakers', () => {
    const better = { pokemon: { id: 900 }, score: 0.81, maxGap: 60 };
    const worse = { pokemon: { id: 1 }, score: 0.8, maxGap: 0 };
    expect([worse, better].sort(compareMatches)[0].pokemon.id).toBe(900);
  });
});

describe('ranking', () => {
  it('ranks every Pokémon in non-increasing score order', () => {
    const ranked = rankPokemon(calculateUserProfile(uniformAnswers(3)));
    expect(ranked).toHaveLength(POKEMON_PROFILES.length);
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
  });

  it('returns exactly three distinct top matches whose first entry is the overall best', () => {
    const answers = uniformAnswers(1);
    const { matches, userProfile } = findBestMatches(answers);
    expect(matches).toHaveLength(3);
    expect(new Set(matches.map((m) => m.pokemon.id)).size).toBe(3);
    expect(matches[0].pokemon.id).toBe(rankPokemon(userProfile)[0].pokemon.id);
  });

  it('ranks a planted exact copy of the user profile first', () => {
    const userProfile = calculateUserProfile(uniformAnswers(0));
    const clone = { id: 9999, name: 'Clone', profile: { ...userProfile } };
    expect(rankPokemon(userProfile, [...POKEMON_PROFILES, clone])[0].pokemon.id).toBe(9999);
  });

  it('produces meaningful variety instead of always picking the same Pokémon', () => {
    const rand = mulberry32(12345);
    const counts = new Map();
    const samples = 5000;
    for (let i = 0; i < samples; i++) {
      const id = findBestMatches(randomAnswers(rand), { limit: 1 }).matches[0].pokemon.id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(counts.size).toBeGreaterThanOrEqual(40);
    expect(Math.max(...counts.values()) / samples).toBeLessThan(0.1);
  });

  it('different "pure" answer styles lead to different Pokémon', () => {
    const winners = [0, 1, 2, 3].map((i) => findBestMatches(uniformAnswers(i)).matches[0].pokemon.id);
    expect(new Set(winners).size).toBe(4);
  });
});

describe('explanations and sharing', () => {
  it('lists the Pokémon\'s three strongest traits as strengths', () => {
    const p = POKEMON_PROFILES.find((x) => x.name === 'Snorlax');
    const strengths = getStrengths(p.profile);
    expect(strengths).toHaveLength(3);
    expect(strengths[0].dimension).toBe('calmness');
    expect(strengths.map((s) => s.dimension)).toEqual(getTopTraits(p.profile, 3));
  });

  it('builds an explanation that references the user\'s actual answers', () => {
    const answers = uniformAnswers(0);
    const { userProfile, matches } = findBestMatches(answers);
    const text = buildExplanation(userProfile, matches[0].pokemon, answers).join(' ');
    const phrases = QUESTIONS.map((q) => q.options[0].phrase);
    expect(phrases.some((ph) => text.includes(ph))).toBe(true);
    expect(text).toContain(matches[0].pokemon.name);
    expect(buildMatchReason(userProfile, matches[1].pokemon).length).toBeGreaterThan(5);
  });

  it('share text includes only the match name and percentage, never answer text', () => {
    const answers = uniformAnswers(2);
    const { matches } = findBestMatches(answers);
    const text = buildShareText(matches[0], 'https://example.com');
    expect(text).toContain(matches[0].pokemon.name);
    expect(text).toContain(`${matches[0].percent}%`);
    for (const q of QUESTIONS) {
      for (const o of q.options) {
        expect(text).not.toContain(o.text);
        expect(text).not.toContain(o.phrase);
      }
    }
  });
});
