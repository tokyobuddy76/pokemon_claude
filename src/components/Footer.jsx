export default function Footer() {
  return (
    <footer className="footer">
      <p>
        Pokémon data:{' '}
        <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">
          PokéAPI
        </a>
      </p>
      <p>Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and The Pokémon Company.</p>
      <p>
        This is an unofficial fan-made personality quiz and is not affiliated with or endorsed by the Pokémon rights
        holders.
      </p>
      <p className="footer__note">
        Personality profiles are creative interpretations, not official Pokémon classifications. Match percentages show
        algorithmic similarity, not a scientific personality assessment.
      </p>
    </footer>
  );
}
