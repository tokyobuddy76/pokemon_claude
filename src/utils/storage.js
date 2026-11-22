/**
 * Quiz progress in sessionStorage. It stays in this browser tab and is
 * cleared when the tab closes. Only question/option ids and the current
 * screen are stored: no names, no personal data, nothing sent anywhere.
 */
import { QUESTIONS } from '../data/questions.js';
import { validateAnswers } from './matchingAlgorithm.js';

const KEY = 'pokematch:progress:v1';

function storage() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null; // storage disabled (privacy mode, etc.)
  }
}

/**
 * Loads and sanitises saved progress. Unknown questions/options are
 * dropped, and the screen and index are corrected if they don't fit.
 * Returns null when nothing usable is stored.
 */
export function loadProgress(questions = QUESTIONS) {
  const store = storage();
  if (!store) return null;
  let saved;
  try {
    saved = JSON.parse(store.getItem(KEY) ?? 'null');
  } catch {
    store.removeItem(KEY);
    return null;
  }
  if (!saved || typeof saved !== 'object' || typeof saved.answers !== 'object' || saved.answers === null) return null;

  const answers = {};
  for (const q of questions) {
    const chosen = saved.answers[q.id];
    if (q.options.some((o) => o.id === chosen)) answers[q.id] = chosen;
  }
  const firstMissing = questions.findIndex((q) => !answers[q.id]);
  if (Object.keys(answers).length === 0) return null;

  if (saved.screen === 'results' && validateAnswers(answers, questions).valid) {
    return { screen: 'results', currentIndex: questions.length - 1, answers };
  }
  const requested = Number.isInteger(saved.currentIndex) ? saved.currentIndex : 0;
  const maxIndex = firstMissing === -1 ? questions.length - 1 : firstMissing;
  return { screen: 'quiz', currentIndex: Math.min(Math.max(0, requested), maxIndex), answers };
}

export function saveProgress({ screen, currentIndex, answers }) {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify({ screen, currentIndex, answers }));
  } catch {
    /* quota or disabled: progress just won't persist */
  }
}

export function clearProgress() {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
