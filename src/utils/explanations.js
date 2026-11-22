/**
 * Predefined explanation templates for the results screen.
 * Everything here is built locally from the user's answers and the
 * creative profiles. Nothing is sent to an AI model or a server.
 */

import { DIMENSION_LABELS, QUESTIONS } from '../data/questions.js';
import { getTopTraits } from './matchingAlgorithm.js';

/** Short strength titles shown as badges, per dimension. */
export const STRENGTH_TEMPLATES = {
  courage: { title: 'Fearless Heart', text: 'Faces big challenges head-on.' },
  intelligence: { title: 'Sharp Mind', text: 'Solves problems with clever thinking.' },
  loyalty: { title: 'True Friend', text: 'Always there for the team.' },
  creativity: { title: 'Wild Imagination', text: 'Sees ideas no one else does.' },
  sociability: { title: 'Social Spark', text: 'Brings people together.' },
  independence: { title: 'Free Spirit', text: 'Confident going solo.' },
  calmness: { title: 'Zen Master', text: 'Stays cool under pressure.' },
  adventurousness: { title: 'Born Explorer', text: 'Always chasing the next horizon.' },
};

/** How a trait sounds in a sentence ("your ___"). */
const TRAIT_PHRASES = {
  courage: 'bold courage',
  intelligence: 'curious, clever mind',
  loyalty: 'deep loyalty',
  creativity: 'creative imagination',
  sociability: 'friendly, outgoing energy',
  independence: 'independent streak',
  calmness: 'calm, steady nature',
  adventurousness: 'adventurous spirit',
};

const label = (dim) => DIMENSION_LABELS[dim];

/** The Pokémon's three strongest dimensions, as strength badges. */
export function getStrengths(pokemonProfile) {
  return getTopTraits(pokemonProfile, 3).map((dim) => ({ dimension: dim, ...STRENGTH_TEMPLATES[dim] }));
}

/**
 * Answers that contributed the most points to `dimension`, strongest first.
 * Ties keep questionnaire order, so the output is deterministic.
 */
function answersSupporting(dimension, answers, questions) {
  return questions
    .map((q) => q.options.find((o) => o.id === answers[q.id]))
    .filter((o) => o && (o.weights[dimension] ?? 0) > 0)
    .sort((a, b) => b.weights[dimension] - a.weights[dimension]);
}

/** Joins ["a", "b", "c"] → "a, b, and c". */
function joinList(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

/**
 * Personalised "why this match" explanation, built from the user's top two
 * traits, the answers that produced them, and the traits shared with the
 * Pokémon.
 */
export function buildExplanation(userProfile, pokemon, answers, questions = QUESTIONS) {
  const [first, second] = getTopTraits(userProfile, 2);
  const pokemonTop = getTopTraits(pokemon.profile, 3);
  const shared = getTopTraits(userProfile, 3).filter((d) => pokemonTop.includes(d));

  const evidence = [];
  for (const dim of [first, second]) {
    const best = answersSupporting(dim, answers, questions)[0];
    if (best && !evidence.includes(best.phrase)) evidence.push(best.phrase);
  }

  const paragraphs = [];
  paragraphs.push(
    `Your strongest traits are ${label(first)} and ${label(second)}` +
      (evidence.length ? ` — you said you ${joinList(evidence)}.` : '.'),
  );

  if (shared.length >= 2) {
    paragraphs.push(
      `${pokemon.name} shares your ${joinList(shared.map((d) => TRAIT_PHRASES[d]))}, which is why your profiles line up so closely.`,
    );
  } else if (shared.length === 1) {
    paragraphs.push(
      `${pokemon.name} shares your ${TRAIT_PHRASES[shared[0]]}, and the rest of its profile follows the same pattern of highs and lows as yours.`,
    );
  } else {
    paragraphs.push(
      `${pokemon.name}'s balance of ${joinList(pokemonTop.slice(0, 2).map(label))} mirrors the overall shape of your answers better than any other Pokémon.`,
    );
  }

  const [userLow] = getTopTraits(invert(userProfile), 1);
  const values = Object.values(pokemon.profile);
  const pokemonAverage = values.reduce((s, v) => s + v, 0) / values.length;
  paragraphs.push(
    pokemon.profile[userLow] < pokemonAverage
      ? `Like ${pokemon.name}, you lean less on ${label(userLow).toLowerCase()} — and that's okay. Every great team needs different strengths!`
      : `${label(userLow)} is your quietest trait, and ${pokemon.name} is a great partner to help you build it up.`,
  );
  return paragraphs;
}

/** One-sentence reason for a top-3 card. */
export function buildMatchReason(userProfile, pokemon) {
  const userTop = getTopTraits(userProfile, 3);
  const shared = getTopTraits(pokemon.profile, 3).filter((d) => userTop.includes(d));
  if (shared.length >= 2) return `You both shine in ${joinList(shared.map(label))}.`;
  if (shared.length === 1) return `You share a standout ${label(shared[0]).toLowerCase()} trait.`;
  return `Its ${label(getTopTraits(pokemon.profile, 1)[0]).toLowerCase()} complements your personality pattern.`;
}

/** Share text: Pokémon name and percentage only, with no answers or personal data. */
export function buildShareText(match, url) {
  const text = `I got ${match.pokemon.name} (${match.percent}% match) on PokéMatch! Discover your inner Pokémon:`;
  return url ? `${text} ${url}` : text;
}

function invert(profile) {
  return Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, -v]));
}
