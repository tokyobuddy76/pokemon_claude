# PokéMatch — Discover Your Inner Pokémon!

An unofficial, fan-made personality quiz. Answer 10 questions and PokéMatch matches your personality to one of **62 Pokémon** (Generations 1–9) using a deterministic, rule-based similarity algorithm. Official Pokémon details (artwork, types, height, weight, abilities) are loaded live from [PokéAPI](https://pokeapi.co/) through a Vercel serverless function.

Built with **Vite + React**, **Recharts** (radar chart), **Lucide React** (icons), and plain CSS.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (includes /api/pokemon)
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload. `/api/*` routes are served by a small Vite plugin, so no Vercel CLI is needed. |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally, including `/api/*` |
| `npm test` | Runs the automated tests (Vitest) |

Requires Node.js 20 or newer.

### Environment variables

None are required. PokéAPI is free and needs no key. `.env.example` lists optional **server-side** overrides, read only inside `api/` through `process.env`:

| Name | Purpose | Default |
|---|---|---|
| `POKEAPI_BASE_URL` | Upstream base URL | `https://pokeapi.co/api/v2` |
| `POKEAPI_TIMEOUT_MS` | Upstream timeout (1–30000 ms) | `8000` |

Never put secrets in a `VITE_`-prefixed variable, because those are bundled into the browser code. If a future provider needs a key, read it in `api/` and return `503 { "error": "key not configured" }` before calling the provider when it's missing (see the comment in `api/pokemon.js`).

---

## Testing

```bash
npm test
```

`tests/matchingAlgorithm.test.js` covers:
- **Data integrity:** 10 questions with 4 options each; 50+ Pokémon with complete 0–100 profiles.
- **Score normalisation:** per-dimension maximums, 0–100 bounds, and divide-by-zero guards.
- **Similarity:** an identical profile gives 100%; scores stay within [0, 1]; the opposite shape scores lower; a "high in everything" profile gets no free win.
- **Determinism:** identical answers give identical results; profile-list order doesn't matter; `Math.random` is never called.
- **Tie-breaking:** exact ties go to the lower Pokédex number; smaller max gap wins before Pokédex number; the epsilon is handled.
- **Ranking:** results are sorted; top 3 are distinct; a planted clone ranks first; variety across 5,000 sampled answer sets (40+ distinct winners, none above 10%).
- **Explanations and sharing:** explanations reference the user's real answers; share text never contains answers.

`tests/pokemonApi.test.js` covers the serverless function: ID validation (no upstream call for bad IDs), response mapping, missing artwork returned as `null`, incomplete data (502), upstream errors (502), network failures (502), timeouts (504), and non-GET requests (405).

### Manual checklist (desktop and mobile)
1. Home → **Find My Pokémon**.
2. **Next** stays disabled until you pick an answer. **Back** keeps your earlier answers, and you can change them.
3. Refresh mid-quiz: your progress is restored from `sessionStorage`.
4. Finish: the loading animation plays, then the results screen appears.
5. Results show artwork, types, height, weight, abilities, match %, strengths, explanation, radar chart and table, and the top 3.
6. **Copy Results** / **Share My Match** share only the Pokémon name, percentage and link.
7. **Retake Quiz** clears everything.
8. Keyboard only: Tab to the answers, arrow keys to choose, Enter for Next.
9. Upstream failure: run `POKEAPI_BASE_URL=http://127.0.0.1:9 npm run dev`. Cards show a friendly error and **Retry**, with no placeholder data.

---

## Deploying to Vercel

1. Push the project to a Git repository and import it in Vercel, or run `npx vercel` from the project folder.
2. Vercel detects Vite (`vercel.json` also sets `framework`, `buildCommand` and `outputDirectory`).
3. `api/pokemon.js` is deployed automatically as a serverless function at `/api/pokemon`.
4. No environment variables are needed.

`vercel dev` also works locally if you prefer the Vercel CLI.

---

## How matching works

Source: `src/utils/matchingAlgorithm.js`. It contains no UI code and no randomness.

1. **Raw scores.** Each answer adds 0–3 points to some of the eight dimensions: Courage, Intelligence, Loyalty, Creativity, Sociability, Independence, Calmness, Adventurousness.
2. **Normalisation.** Each dimension total is divided by the maximum that dimension could reach across the questionnaire, then scaled to 0–100.
3. **Similarity** with each Pokémon profile:
   - `shape = (pearson(user, pokemon) + 1) / 2`: do the highs and lows line up?
   - `closeness = 1 − ‖(u − ū) − (p − p̄)‖ / (100·√8)`: how strongly do the contrasts match? (distance between mean-centred vectors)
   - `score = 0.6·shape + 0.4·closeness`, and **match % = round(score × 100)**.
4. **Tie-breaking**, applied in order:
   1. Higher unrounded score.
   2. Smaller largest single-dimension gap.
   3. Lower National Pokédex number.

Because the comparison uses mean-centred vectors, Pokémon that are high in every trait (like Mewtwo) don't win by default. Across all 4¹⁰ = 1,048,576 possible answer combinations, **all 62 Pokémon can win**, and no single Pokémon wins more than about 6.6% of the time.

> **Disclaimer:** the personality profiles in `src/data/pokemonProfiles.js` are creative, fan-made interpretations, **not** official Pokémon personality classifications. Match percentages show algorithmic similarity, not a scientifically validated personality assessment.

---

## Security and privacy

- The browser only calls `/api/pokemon?id=<number>`, never PokéAPI directly. Pokémon **images** are loaded from PokéAPI's sprite repository on GitHub, at the URLs PokéAPI returns.
- The API accepts only the 62 Pokédex IDs used by the quiz. It validates input before any outbound request, applies a timeout, trims the response, and sends cache headers to respect PokéAPI's fair-use policy.
- No data is invented. Missing artwork shows "Artwork unavailable", and failed requests show an error with Retry.
- No accounts and no personal data. Quiz progress (question and answer IDs only) is kept in `sessionStorage` in your browser and cleared when the tab closes. Answers are never sent to a server or an AI model.
- Explanations come from predefined templates in `src/utils/explanations.js`.

## Accessibility

- Native radio groups, so arrow keys and screen-reader announcements work.
- Visible focus rings, a skip link, and focus moved to each new screen or question.
- Live regions for errors and status messages.
- A data table alongside the radar chart; the chart's colours were checked for colour-blind separation, and the "You" line is also dashed.
- Buttons and options are at least 44 px tall.
- `prefers-reduced-motion` turns off decorative animation and chart animation.

---

## Project structure

```text
pokematch/
├── api/pokemon.js                 Serverless PokéAPI proxy (Vercel + local dev)
├── public/favicon.svg
├── src/
│   ├── components/
│   │   ├── HomeScreen.jsx         Landing screen
│   │   ├── QuizScreen.jsx         Question flow, Back/Next, validation
│   │   ├── QuestionCard.jsx       One question as an accessible radio group
│   │   ├── ProgressBar.jsx        Quiz progress
│   │   ├── ResultsScreen.jsx      Results, top 3, share, retake
│   │   ├── PokemonCard.jsx        Live Pokémon data with loading/error/retry
│   │   ├── PersonalityChart.jsx   Recharts radar chart + comparison table
│   │   └── Footer.jsx             Credits and disclaimers
│   ├── data/
│   │   ├── questions.js           10 questions, answer weights, dimensions
│   │   └── pokemonProfiles.js     62 creative personality profiles
│   ├── utils/
│   │   ├── matchingAlgorithm.js   Scoring, similarity, ranking, tie-breaks
│   │   ├── explanations.js        Explanation/strength/share templates
│   │   ├── pokemonApi.js          Frontend client + usePokemon hook
│   │   ├── storage.js             sessionStorage progress (validated)
│   │   └── theme.js               Type colours, reduced-motion hook
│   ├── App.jsx, main.jsx, index.css
├── tests/
│   ├── matchingAlgorithm.test.js
│   └── pokemonApi.test.js
├── index.html, vite.config.js, vercel.json, package.json
├── .env.example, .gitignore
└── README.md
```

---

## Credits

Pokémon data: [PokéAPI](https://pokeapi.co/).
Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and The Pokémon Company.
This is an unofficial fan-made personality quiz and is not affiliated with or endorsed by the Pokémon rights holders.
