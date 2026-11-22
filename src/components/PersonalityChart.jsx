import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DIMENSIONS, DIMENSION_LABELS } from '../data/questions.js';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../utils/theme.js';

// Long axis labels get clipped on phone-width radar charts.
const SHORT_LABELS = { Adventurousness: 'Adventure' };

function useIsNarrow(maxWidth = 480) {
  const query = `(max-width: ${maxWidth}px)`;
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;
    const onChange = () => setNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}

// Fixed two-series palette (checked for colour-blind separation and contrast on white).
// It doesn't change with Pokémon type, so "You" always looks the same.
const USER_COLOR = '#2f6fde';
const POKEMON_COLOR = '#e8590c';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__swatch" style={{ background: p.color }} aria-hidden="true" />
          <span>{p.name}</span>
          <span className="chart-tooltip__value">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Radar chart plus a table comparing the user's eight dimensions with a Pokémon's profile. */
export default function PersonalityChart({ userProfile, pokemonProfile, pokemonName }) {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useIsNarrow();
  const data = DIMENSIONS.map((dim) => ({
    trait: DIMENSION_LABELS[dim],
    you: Math.round(userProfile[dim]),
    pokemon: pokemonProfile[dim],
  }));

  return (
    <figure className="chart">
      <div className="chart__plot" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="#e3e5ea" />
            <PolarAngleAxis
              dataKey="trait"
              tick={{ fill: '#4b5563', fontSize: narrow ? 11 : 12 }}
              tickFormatter={(label) => (narrow ? SHORT_LABELS[label] ?? label : label)}
            />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={false} axisLine={false} />
            <Radar
              name={pokemonName}
              dataKey="pokemon"
              stroke={POKEMON_COLOR}
              strokeWidth={2}
              fill={POKEMON_COLOR}
              fillOpacity={0.18}
              dot={{ r: 4, fill: POKEMON_COLOR, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={!reducedMotion}
            />
            <Radar
              name="You"
              dataKey="you"
              stroke={USER_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              fill={USER_COLOR}
              fillOpacity={0.14}
              dot={{ r: 4, fill: USER_COLOR, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={!reducedMotion}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: '#374151' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="chart__caption">
        Your personality profile (dashed blue) compared with {pokemonName}&apos;s profile (solid orange), each scored 0–100.
      </figcaption>

      <table className="trait-table">
        <caption className="sr-only">Personality comparison: you and {pokemonName}</caption>
        <thead>
          <tr>
            <th scope="col">Trait</th>
            <th scope="col">You</th>
            <th scope="col">{pokemonName}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.trait}>
              <th scope="row">{row.trait}</th>
              <td>
                <span className="trait-bar" style={{ '--v': row.you, '--c': USER_COLOR }} aria-hidden="true" />
                {row.you}
              </td>
              <td>
                <span className="trait-bar" style={{ '--v': row.pokemon, '--c': POKEMON_COLOR }} aria-hidden="true" />
                {row.pokemon}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
