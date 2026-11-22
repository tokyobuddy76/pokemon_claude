import { useMemo, useState } from 'react';
import { AlertCircle, Check, Copy, Lightbulb, RotateCcw, Share2, Star, Trophy } from 'lucide-react';
import PokemonCard from './PokemonCard.jsx';
import PersonalityChart from './PersonalityChart.jsx';
import { findBestMatches } from '../utils/matchingAlgorithm.js';
import { buildExplanation, buildMatchReason, buildShareText, getStrengths } from '../utils/explanations.js';
import { usePokemon } from '../utils/pokemonApi.js';
import { DEFAULT_THEME, themeForTypes } from '../utils/theme.js';

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for older browsers / non-secure contexts.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('copy failed');
}

function MatchRing({ percent }) {
  return (
    <div className="ring" style={{ '--p': percent }} role="img" aria-label={`${percent}% match`}>
      <span className="ring__value">
        {percent}
        <small>%</small>
      </span>
      <span className="ring__label">match</span>
    </div>
  );
}

function TopMatchItem({ match, rank, userProfile }) {
  const state = usePokemon(match.pokemon.id);
  return (
    <li>
      <PokemonCard
        variant="compact"
        state={state}
        fallbackName={match.pokemon.name}
        percent={match.percent}
        rank={rank}
        reason={buildMatchReason(userProfile, match.pokemon)}
      />
    </li>
  );
}

function ShareActions({ match }) {
  const [status, setStatus] = useState('');
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const text = buildShareText(match);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const share = async () => {
    try {
      await navigator.share({ title: 'My PokéMatch result', text, url });
      setStatus('Thanks for sharing!');
    } catch (err) {
      if (err?.name !== 'AbortError') setStatus("Sharing isn't available right now. Try Copy Results instead.");
    }
  };

  const copy = async () => {
    try {
      await copyText(buildShareText(match, url));
      setStatus('Results copied to your clipboard!');
    } catch {
      setStatus("Couldn't copy automatically. Please select and copy the text manually.");
    }
  };

  return (
    <div className="share">
      {canShare && (
        <button type="button" className="btn btn--primary" onClick={share}>
          <Share2 size={18} aria-hidden="true" /> Share My Match
        </button>
      )}
      <button type="button" className={`btn ${canShare ? 'btn--secondary' : 'btn--primary'}`} onClick={copy}>
        {status.startsWith('Results copied') ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        Copy Results
      </button>
      <p className="share__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

export default function ResultsScreen({ answers, onRetake }) {
  const result = useMemo(() => {
    try {
      return findBestMatches(answers, { limit: 3 });
    } catch {
      return null;
    }
  }, [answers]);

  const topId = result?.matches[0]?.pokemon.id ?? 0;
  const heroState = usePokemon(topId);

  if (!result) {
    return (
      <section className="results results--invalid" aria-labelledby="invalid-title">
        <AlertCircle size={48} aria-hidden="true" />
        <h1 id="invalid-title">Oops — we couldn&apos;t read your answers</h1>
        <p>Some quiz answers are missing or no longer valid. Please take the quiz again to get your match.</p>
        <button type="button" className="btn btn--primary" onClick={onRetake}>
          <RotateCcw size={18} aria-hidden="true" /> Retake Quiz
        </button>
      </section>
    );
  }

  const { userProfile, matches } = result;
  const best = matches[0];
  const pokemon = best.pokemon;
  const displayName = heroState.status === 'success' ? heroState.data.name : pokemon.name;
  const theme = heroState.status === 'success' ? themeForTypes(heroState.data.types) : DEFAULT_THEME;
  const strengths = getStrengths(pokemon.profile);
  const explanation = buildExplanation(userProfile, { ...pokemon, name: displayName }, answers);

  return (
    <section className="results" style={{ '--theme': theme }} aria-labelledby="results-title">
      <div className="results__confetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ '--i': i }} />
        ))}
      </div>

      <header className="results__header">
        <p className="results__eyebrow">Your Pokémon Match Is…</p>
        <h1 id="results-title" className="results__name">
          {displayName}!
        </h1>
        <MatchRing percent={best.percent} />
      </header>

      <div className="results__grid">
        <PokemonCard state={heroState} fallbackName={pokemon.name} percent={best.percent} />

        <div className="results__details">
          <section className="panel" aria-labelledby="about-title">
            <h2 id="about-title">
              <Star size={20} aria-hidden="true" /> Your personality
            </h2>
            <p className="results__description">{pokemon.description}</p>
          </section>

          <section className="panel" aria-labelledby="strengths-title">
            <h2 id="strengths-title">
              <Trophy size={20} aria-hidden="true" /> Key strengths
            </h2>
            <ul className="strengths">
              {strengths.map((s) => (
                <li key={s.dimension} className="strength">
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel" aria-labelledby="why-title">
            <h2 id="why-title">
              <Lightbulb size={20} aria-hidden="true" /> Why {displayName} matches you
            </h2>
            {explanation.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        </div>
      </div>

      <section className="panel panel--wide" aria-labelledby="compare-title">
        <h2 id="compare-title">You vs. {displayName}</h2>
        <PersonalityChart userProfile={userProfile} pokemonProfile={pokemon.profile} pokemonName={displayName} />
      </section>

      <section className="panel panel--wide" aria-labelledby="top3-title">
        <h2 id="top3-title">Your top 3 matches</h2>
        <ol className="top3">
          {matches.map((m, i) => (
            <TopMatchItem key={m.pokemon.id} match={m} rank={i + 1} userProfile={userProfile} />
          ))}
        </ol>
      </section>

      <div className="results__actions">
        <ShareActions match={{ ...best, pokemon: { ...pokemon, name: displayName } }} />
        <button type="button" className="btn btn--ghost" onClick={onRetake}>
          <RotateCcw size={18} aria-hidden="true" /> Retake Quiz
        </button>
      </div>

      <p className="results__disclaimer">
        Match percentages show how similar your answers are to our fan-made personality profiles. Just for fun, not a
        scientific assessment.
      </p>
    </section>
  );
}
