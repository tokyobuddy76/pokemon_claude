import { useState } from 'react';
import { AlertTriangle, ImageOff, RefreshCw, Ruler, Weight, Zap } from 'lucide-react';
import { themeForTypes } from '../utils/theme.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Official artwork, or an honest placeholder when the image is missing or fails to load. */
function Artwork({ src, name, size }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`artwork artwork--missing artwork--${size}`} role="img" aria-label={`Artwork for ${name} is unavailable`}>
        <ImageOff size={size === 'hero' ? 48 : 28} aria-hidden="true" />
        <span>Artwork unavailable</span>
      </div>
    );
  }
  return (
    <img
      className={`artwork artwork--${size}`}
      src={src}
      alt={`Official artwork of ${name}`}
      loading={size === 'hero' ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function TypeBadges({ types }) {
  return (
    <ul className="types" aria-label="Type">
      {types.map((t) => (
        <li key={t} className="type-badge" style={{ '--type': themeForTypes([t]) }}>
          {cap(t)}
        </li>
      ))}
    </ul>
  );
}

function LoadingState({ slow, compact }) {
  return (
    <div className={`pokemon-card__status${compact ? ' is-compact' : ''}`} role="status">
      <div className="skeleton skeleton--art" aria-hidden="true" />
      <p>{slow ? 'Still loading — the Pokémon database is a bit slow today…' : 'Loading Pokémon data…'}</p>
    </div>
  );
}

function ErrorState({ message, onRetry, compact }) {
  return (
    <div className={`pokemon-card__status pokemon-card__status--error${compact ? ' is-compact' : ''}`} role="alert">
      <AlertTriangle size={compact ? 24 : 36} aria-hidden="true" />
      <p>{message}</p>
      {!compact && <p className="muted">Your match is ready. We just couldn&apos;t load the official Pokémon details.</p>}
      <button type="button" className="btn btn--secondary btn--small" onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" /> Retry
      </button>
    </div>
  );
}

/**
 * Presentational card. `state` comes from usePokemon(id). Official details
 * (name, types, size, abilities, artwork) are only shown once PokéAPI data
 * has loaded. `fallbackName` is the quiz's own label for the Pokémon.
 */
export default function PokemonCard({ state, fallbackName, variant = 'hero', percent, reason, rank }) {
  const compact = variant === 'compact';
  const data = state.status === 'success' ? state.data : null;
  const name = data?.name ?? fallbackName;

  if (compact) {
    return (
      <article className="pokemon-card pokemon-card--compact" style={{ '--theme': themeForTypes(data?.types) }}>
        <span className="pokemon-card__rank" aria-label={`Rank ${rank}`}>
          #{rank}
        </span>
        {state.status === 'loading' && <LoadingState slow={state.slow} compact />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={state.retry} compact />}
        {data && <Artwork key={data.artwork} src={data.artwork} name={name} size="compact" />}
        <h3 className="pokemon-card__name">{name}</h3>
        {data && <TypeBadges types={data.types} />}
        <p className="pokemon-card__percent">
          <strong>{percent}%</strong> match
        </p>
        {reason && <p className="pokemon-card__reason">{reason}</p>}
      </article>
    );
  }

  return (
    <article className="pokemon-card pokemon-card--hero" aria-label={`${name}, ${percent}% match`}>
      {state.status === 'loading' && <LoadingState slow={state.slow} />}
      {state.status === 'error' && <ErrorState message={state.error} onRetry={state.retry} />}
      {data && (
        <>
          <div className="pokemon-card__art-wrap">
            <div className="pokemon-card__glow" aria-hidden="true" />
            <Artwork key={data.artwork} src={data.artwork} name={name} size="hero" />
          </div>
          <TypeBadges types={data.types} />
          <dl className="facts">
            <div>
              <dt>
                <Ruler size={16} aria-hidden="true" /> Height
              </dt>
              <dd>{data.heightM !== null ? `${data.heightM} m` : 'Not available'}</dd>
            </div>
            <div>
              <dt>
                <Weight size={16} aria-hidden="true" /> Weight
              </dt>
              <dd>{data.weightKg !== null ? `${data.weightKg} kg` : 'Not available'}</dd>
            </div>
            <div className="facts__wide">
              <dt>
                <Zap size={16} aria-hidden="true" /> Abilities
              </dt>
              <dd>
                {data.abilities.length
                  ? data.abilities.map((a) => (a.hidden ? `${a.name} (hidden)` : a.name)).join(', ')
                  : 'Not available'}
              </dd>
            </div>
          </dl>
        </>
      )}
    </article>
  );
}
