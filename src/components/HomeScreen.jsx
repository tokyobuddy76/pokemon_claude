import { Sparkles, Clock, ListChecks, Users } from 'lucide-react';
import { POKEMON_PROFILES } from '../data/pokemonProfiles.js';
import { QUESTIONS } from '../data/questions.js';

export default function HomeScreen({ onStart }) {
  return (
    <section className="home" aria-labelledby="home-title">
      <div className="home__decor" aria-hidden="true">
        <span className="float-ball float-ball--1" />
        <span className="float-ball float-ball--2" />
        <span className="float-ball float-ball--3" />
        <span className="float-ball float-ball--4" />
      </div>

      <div className="home__hero">
        <div className="hero-ball" aria-hidden="true">
          <span className="hero-ball__button" />
        </div>
        <h1 id="home-title" className="home__title">
          Poké<span>Match</span>
        </h1>
        <p className="home__tagline">Discover Your Inner Pokémon!</p>
        <p className="home__intro">
          Answer {QUESTIONS.length} quick questions about how you think, play, and handle challenges. We&apos;ll match
          your personality with one of {POKEMON_PROFILES.length} Pokémon partners.
        </p>

        <button type="button" className="btn btn--primary btn--large home__cta" onClick={onStart}>
          <Sparkles size={22} aria-hidden="true" />
          Find My Pokémon
        </button>

        <ul className="home__facts">
          <li>
            <ListChecks size={18} aria-hidden="true" /> {QUESTIONS.length} questions
          </li>
          <li>
            <Clock size={18} aria-hidden="true" /> 2–3 minutes
          </li>
          <li>
            <Users size={18} aria-hidden="true" /> {POKEMON_PROFILES.length} Pokémon
          </li>
        </ul>
        <p className="home__privacy">No sign-up. Your answers stay in your browser.</p>
      </div>
    </section>
  );
}
