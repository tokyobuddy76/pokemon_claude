/**
 * PokéMatch matching engine — deterministic, rule-based, no randomness.
 *
 * Pipeline
 * 1. Raw scores: every selected answer adds its weights to the user's raw
 *    total for each of the eight dimensions.
 * 2. Normalisation: each raw total is divided by the MAXIMUM total that
 *    dimension could reach across the questionnaire (best option per
 *    question), then scaled to 0–100. This stops dimensions that appear in
 *    more answers from dominating.
 * 3. Similarity with each Pokémon profile (both vectors 0–100):
 *      shape     = (pearson(user, pokemon) + 1) / 2              in [0, 1]
 *                  Do the highs and lows line up? Pearson ignores overall
 *                  level, so "high in everything" profiles get no free win.
 *      closeness = 1 - ‖(u − ū) − (p − p̄)‖ / (100·√8)             in [0, 1]
 *                  Euclidean distance between the mean-centred vectors:
 *                  how strongly the contrasts match, not just their direction.
 *      score     = 0.6·shape + 0.4·closeness                      in [0, 1]
 *    Match % = round(score × 100).
 * 4. Ranking and tie-breaking (documented, deterministic):
 *      a. higher unrounded score wins;
 *      b. if scores tie (|Δ| < 1e-9), the smaller largest single-dimension
 *         gap (on the centred vectors) wins — the more "evenly" close match;
 *      c. if still tied, the lower National Pokédex number wins.
 *
 * Match percentages express algorithmic similarity between two vectors.
 * They are NOT a scientifically validated measure of personality.
 */

import { DIMENSIONS, QUESTIONS } from '../data/questions.js';
import { POKEMON_PROFILES } from '../data/pokemonProfiles.js';

export const SHAPE_WEIGHT = 0.6;
export const CLOSENESS_WEIGHT = 0.4;
export const TIE_EPSILON = 1e-9;
const MAX_CENTERED_DISTANCE = 100 * Math.sqrt(DIMENSIONS.length);

const zeroVector = () => Object.fromEntries(DIMENSIONS.map((d) => [d, 0]));

/** Highest raw total each dimension can reach, given the questions. */
export function getMaxPossibleScores(questions = QUESTIONS) {
  const max = zeroVector();
  for (const question of questions) {
    for (const dim of DIMENSIONS) {
      const best = Math.max(0, ...question.options.map((o) => o.weights[dim] ?? 0));
      max[dim] += best;
    }
  }
  return max;
}

/**
 * Checks that `answers` ({ questionId: optionId }) covers every question
 * with a known option. Returns { valid, missing, invalid }.
 */
export function validateAnswers(answers, questions = QUESTIONS) {
  const missing = [];
  const invalid = [];
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return { valid: false, missing: questions.map((q) => q.id), invalid: [] };
  }
  for (const question of questions) {
    const chosen = answers[question.id];
    if (chosen === undefined || chosen === null) missing.push(question.id);
    else if (!question.options.some((o) => o.id === chosen)) invalid.push(question.id);
  }
  return { valid: missing.length === 0 && invalid.length === 0, missing, invalid };
}

/** Sums answer weights per dimension (no normalisation). */
export function calculateRawScores(answers, questions = QUESTIONS) {
  const raw = zeroVector();
  for (const question of questions) {
    const option = question.options.find((o) => o.id === answers[question.id]);
    if (!option) continue;
    for (const [dim, weight] of Object.entries(option.weights)) {
      if (dim in raw) raw[dim] += weight;
    }
  }
  return raw;
}

/** Normalises raw scores to 0–100 per dimension. */
export function normalizeScores(raw, maxPossible) {
  const out = {};
  for (const dim of DIMENSIONS) {
    const max = maxPossible[dim];
    const value = max > 0 ? (100 * (raw[dim] ?? 0)) / max : 0;
    out[dim] = Math.min(100, Math.max(0, value));
  }
  return out;
}

/** Full user profile (0–100 per dimension). Throws on an incomplete quiz. */
export function calculateUserProfile(answers, questions = QUESTIONS) {
  const { valid, missing, invalid } = validateAnswers(answers, questions);
  if (!valid) {
    throw new Error(
      `Questionnaire incomplete or invalid (missing: ${missing.join(', ') || 'none'}; invalid: ${invalid.join(', ') || 'none'})`,
    );
  }
  return normalizeScores(calculateRawScores(answers, questions), getMaxPossibleScores(questions));
}

const toArray = (vector) => DIMENSIONS.map((d) => vector[d]);
const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
const center = (arr) => {
  const m = mean(arr);
  return arr.map((v) => v - m);
};

/** Similarity details between a user profile and a Pokémon profile. */
export function calculateSimilarity(userProfile, pokemonProfile) {
  const u = center(toArray(userProfile));
  const p = center(toArray(pokemonProfile));

  const dot = u.reduce((s, v, i) => s + v * p[i], 0);
  const normU = Math.sqrt(u.reduce((s, v) => s + v * v, 0));
  const normP = Math.sqrt(p.reduce((s, v) => s + v * v, 0));
  // A perfectly flat vector has no shape; treat its correlation as neutral (0).
  const pearson = normU === 0 || normP === 0 ? 0 : dot / (normU * normP);
  const shape = (Math.max(-1, Math.min(1, pearson)) + 1) / 2;

  const diffs = u.map((v, i) => v - p[i]);
  const distance = Math.sqrt(diffs.reduce((s, v) => s + v * v, 0));
  const closeness = Math.max(0, 1 - distance / MAX_CENTERED_DISTANCE);
  const maxGap = Math.max(...diffs.map(Math.abs));

  const score = SHAPE_WEIGHT * shape + CLOSENESS_WEIGHT * closeness;
  return { score, shape, closeness, maxGap, percent: Math.round(score * 100) };
}

/** Deterministic comparator implementing the documented tie-breaking rule. */
export function compareMatches(a, b) {
  if (Math.abs(a.score - b.score) >= TIE_EPSILON) return b.score - a.score;
  if (Math.abs(a.maxGap - b.maxGap) >= TIE_EPSILON) return a.maxGap - b.maxGap;
  return a.pokemon.id - b.pokemon.id;
}

/** Scores and ranks every Pokémon for a user profile (best first). */
export function rankPokemon(userProfile, profiles = POKEMON_PROFILES) {
  return profiles
    .map((pokemon) => ({ pokemon, ...calculateSimilarity(userProfile, pokemon.profile) }))
    .sort(compareMatches);
}

/**
 * Main entry point: answers → { userProfile, matches } where matches holds
 * the `limit` best Pokémon in rank order.
 */
export function findBestMatches(answers, { questions = QUESTIONS, profiles = POKEMON_PROFILES, limit = 3 } = {}) {
  const userProfile = calculateUserProfile(answers, questions);
  const matches = rankPokemon(userProfile, profiles).slice(0, limit);
  return { userProfile, matches };
}

/** Dimensions sorted from strongest to weakest (ties: DIMENSIONS order). */
export function getTopTraits(profile, count = 3) {
  return [...DIMENSIONS]
    .sort((a, b) => profile[b] - profile[a] || DIMENSIONS.indexOf(a) - DIMENSIONS.indexOf(b))
    .slice(0, count);
}
