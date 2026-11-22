/**
 * PokéMatch personality profiles.
 *
 * ⚠️ CREATIVE INTERPRETATION — NOT OFFICIAL DATA.
 * These eight-dimension personality scores and descriptions are fan-made
 * interpretations written for this quiz. They are not official Pokémon
 * personality classifications and are not endorsed by Nintendo, Game Freak,
 * or The Pokémon Company.
 *
 * Official facts (types, height, weight, abilities, artwork) are NOT stored
 * here. They are fetched live from PokéAPI through /api/pokemon. `id` is
 * the National Pokédex number, used as the lookup key and as the final
 * tie-breaker. `name` is only a display label shown before live data loads.
 *
 * Score order (0–100):
 * courage, intelligence, loyalty, creativity, sociability, independence,
 * calmness, adventurousness
 */

import { DIMENSIONS } from './questions.js';

function entry(id, name, scores, description) {
  if (scores.length !== DIMENSIONS.length) {
    throw new Error(`Profile for ${name} must have ${DIMENSIONS.length} scores`);
  }
  const profile = Object.fromEntries(DIMENSIONS.map((dim, i) => [dim, scores[i]]));
  return Object.freeze({ id, name, profile: Object.freeze(profile), description });
}

//                                cou int loy cre soc ind cal adv
export const POKEMON_PROFILES = Object.freeze([
  entry(1, 'Bulbasaur',          [40, 55, 80, 45, 55, 35, 75, 35], 'Steady, caring, and patient, you are the friend who quietly keeps everyone growing.'),
  entry(4, 'Charmander',         [70, 40, 70, 50, 55, 40, 30, 70], 'Your inner flame burns bright — eager, warm-hearted, and always ready for the next step.'),
  entry(6, 'Charizard',          [95, 50, 55, 45, 30, 85, 25, 85], 'Bold and fiercely independent, you soar toward big challenges and do things your own way.'),
  entry(7, 'Squirtle',           [60, 45, 65, 55, 85, 40, 50, 60], 'Cool, playful, and loved by your crew, you make every adventure more fun.'),
  entry(9, 'Blastoise',          [75, 60, 80, 30, 45, 50, 75, 35], 'Strong and dependable, you are a steady shield for the people who count on you.'),
  entry(25, 'Pikachu',           [80, 55, 90, 55, 80, 50, 35, 80], 'Energetic and loyal to the core, you spark joy and never back down for a friend.'),
  entry(35, 'Clefairy',          [25, 50, 65, 75, 80, 30, 60, 45], 'Gentle and a little magical, you bring wonder and kindness to every gathering.'),
  entry(39, 'Jigglypuff',        [45, 35, 40, 90, 70, 60, 40, 45], 'A born performer with a creative streak — you want the world to hear your song.'),
  entry(52, 'Meowth',            [50, 75, 35, 80, 60, 80, 30, 60], 'Street-smart and full of schemes, you think on your feet and make your own luck.'),
  entry(54, 'Psyduck',           [30, 35, 60, 60, 55, 40, 70, 30], 'Easygoing and unexpectedly deep, you have hidden powers that surprise everyone.'),
  entry(59, 'Arcanine',          [90, 50, 95, 35, 60, 40, 50, 70], 'Noble and devoted, you charge forward bravely to protect the ones you love.'),
  entry(65, 'Alakazam',          [45, 100, 40, 55, 25, 80, 85, 35], 'A brilliant, composed thinker who prefers sharp logic and quiet focus.'),
  entry(68, 'Machamp',           [90, 35, 70, 25, 65, 45, 45, 50], 'Hard-working and fearless, you love a challenge and lift others up — literally.'),
  entry(94, 'Gengar',            [60, 60, 40, 90, 70, 70, 25, 65], 'Mischievous and wildly imaginative, you light up the room with pranks and surprises.'),
  entry(95, 'Onix',              [65, 35, 60, 20, 25, 75, 80, 40], 'Solid, unshakeable, and self-reliant, you weather any storm without fuss.'),
  entry(113, 'Chansey',          [35, 55, 90, 40, 80, 25, 80, 25], 'Nurturing and warm, you are happiest when you are helping someone feel better.'),
  entry(130, 'Gyarados',         [95, 35, 40, 30, 20, 90, 10, 70], 'Intense and unstoppable, you have transformed through sheer willpower.'),
  entry(131, 'Lapras',           [50, 75, 90, 55, 70, 35, 85, 70], 'Wise and gentle, you love carrying friends across new horizons.'),
  entry(132, 'Ditto',            [40, 50, 50, 95, 60, 55, 75, 50], 'Adaptable and endlessly creative, you can fit into any situation with ease.'),
  entry(133, 'Eevee',            [50, 55, 75, 80, 75, 40, 50, 75], 'Curious and full of potential, you could grow in any direction you choose.'),
  entry(143, 'Snorlax',          [40, 40, 60, 35, 45, 60, 100, 10], 'Unbothered and blissfully relaxed, you know the true value of a good nap.'),
  entry(149, 'Dragonite',        [75, 60, 90, 50, 85, 40, 70, 80], 'Kind-hearted and powerful, you would fly around the world to help a friend.'),
  entry(150, 'Mewtwo',           [80, 100, 25, 60, 10, 100, 60, 50], 'Brilliant and fiercely self-directed, you question everything and forge your own path.'),
  entry(151, 'Mew',              [50, 80, 40, 100, 65, 75, 55, 95], 'Playful, curious, and boundlessly creative, you treat the whole world as a playground.'),
  entry(152, 'Chikorita',        [50, 40, 90, 50, 75, 30, 60, 45], 'Sweet and devoted, you put your whole heart into your friendships.'),
  entry(155, 'Cyndaquil',        [35, 45, 70, 50, 35, 45, 55, 40], 'Shy at first but with a fire inside, you shine brightly once you feel safe.'),
  entry(158, 'Totodile',         [75, 30, 60, 65, 90, 45, 20, 80], 'Bouncy and fearless, you dive into fun with total enthusiasm.'),
  entry(175, 'Togepi',           [30, 30, 75, 70, 90, 20, 55, 60], 'Cheerful and full of good luck, you spread happiness wherever you go.'),
  entry(181, 'Ampharos',         [55, 60, 100, 40, 65, 30, 70, 35], 'A guiding light for others, you are steadfast, warm, and endlessly reliable.'),
  entry(194, 'Wooper',           [40, 25, 55, 60, 65, 50, 90, 45], 'Carefree and delightfully chill, you go with the flow and enjoy the ride.'),
  entry(196, 'Espeon',           [45, 90, 85, 60, 55, 45, 80, 40], 'Perceptive and devoted, you sense what others need before they say it.'),
  entry(197, 'Umbreon',          [65, 65, 85, 40, 25, 75, 80, 40], 'Quiet and watchful, you are a loyal guardian who works best in the background.'),
  entry(248, 'Tyranitar',        [95, 40, 35, 25, 15, 95, 30, 60], 'Mighty and strong-willed, you go your own way and refuse to be pushed around.'),
  entry(249, 'Lugia',            [65, 90, 70, 50, 25, 75, 95, 45], 'Serene and wise, you keep the peace and use your strength only when it matters.'),
  entry(251, 'Celebi',           [40, 70, 60, 90, 50, 65, 70, 90], 'A gentle dreamer and explorer, you see possibilities others miss.'),
  entry(257, 'Blaziken',         [95, 55, 65, 40, 50, 65, 40, 70], 'Driven and passionate, you train hard and give every challenge your all.'),
  entry(258, 'Mudkip',           [55, 45, 75, 50, 70, 40, 75, 60], 'Friendly and adaptable, you stay calm and cheerful in any waters.'),
  entry(282, 'Gardevoir',        [60, 80, 100, 60, 55, 35, 80, 30], 'Graceful and deeply loyal, you would do anything to protect your trusted partner.'),
  entry(302, 'Sableye',          [50, 60, 35, 80, 45, 80, 35, 75], 'Sly and curious, you love treasure-hunting in places nobody else dares to look.'),
  entry(334, 'Altaria',          [40, 55, 70, 85, 75, 40, 85, 60], 'Soft-spoken and artistic, you bring harmony and beauty to the world around you.'),
  entry(359, 'Absol',            [75, 80, 60, 35, 15, 95, 70, 55], 'Misunderstood but wise, you see trouble coming and warn others from a distance.'),
  entry(384, 'Rayquaza',         [95, 70, 40, 40, 10, 95, 50, 85], 'A powerful lone guardian, you rule the skies and answer to no one.'),
  entry(393, 'Piplup',           [65, 60, 50, 45, 55, 85, 45, 55], 'Proud and determined, you hold your head high and never ask for help.'),
  entry(417, 'Pachirisu',        [50, 40, 70, 65, 95, 35, 25, 75], 'Bubbly and social, your energy is contagious and your friend list is endless.'),
  entry(445, 'Garchomp',         [95, 45, 55, 30, 35, 75, 35, 90], 'Fast, fierce, and thrill-seeking, you live for speed and big challenges.'),
  entry(448, 'Lucario',          [85, 80, 90, 40, 35, 60, 80, 50], 'Disciplined and honorable, you combine inner calm with unwavering courage.'),
  entry(470, 'Leafeon',          [45, 60, 65, 65, 40, 60, 90, 55], 'Peaceful and grounded, you find your strength in nature and quiet moments.'),
  entry(471, 'Glaceon',          [50, 80, 55, 55, 30, 80, 85, 35], 'Cool-headed and elegant, you think clearly when everyone else is flustered.'),
  entry(494, 'Victini',          [75, 45, 70, 70, 90, 40, 35, 85], 'A cheerful champion, you bring victory and good energy to everyone around you.'),
  entry(495, 'Snivy',            [55, 85, 45, 55, 30, 90, 75, 40], 'Clever, composed, and quietly confident, you prefer to handle things yourself.'),
  entry(570, 'Zorua',            [50, 60, 55, 100, 60, 65, 30, 80], 'A playful trickster with an endless imagination and a soft heart underneath.'),
  entry(609, 'Chandelure',       [55, 75, 30, 85, 30, 80, 60, 45], 'Mysterious and artistic, you are drawn to the unusual and the beautiful.'),
  entry(658, 'Greninja',         [85, 80, 60, 65, 30, 85, 70, 75], 'Swift, smart, and self-reliant, you move like a ninja and adapt to anything.'),
  entry(700, 'Sylveon',          [40, 55, 95, 70, 95, 25, 65, 45], 'Affectionate and gentle, you build bonds that make everyone feel welcome.'),
  entry(722, 'Rowlet',           [50, 70, 60, 45, 40, 60, 90, 30], 'Calm and observant, you take life at your own unhurried pace.'),
  entry(778, 'Mimikyu',          [60, 55, 75, 85, 40, 70, 40, 40], 'Creative and determined, you put your heart into making true connections.'),
  entry(785, 'Tapu Koko',        [90, 50, 45, 65, 60, 85, 20, 90], 'Electric and impulsive, you rush into action wherever the excitement is.'),
  entry(813, 'Scorbunny',        [80, 40, 65, 55, 90, 45, 30, 85], 'Sporty and spirited, you are always first to say "let\'s go!"'),
  entry(816, 'Sobble',           [20, 60, 70, 75, 30, 50, 45, 30], 'Sensitive and imaginative, you notice the details others overlook.'),
  entry(906, 'Sprigatito',       [50, 55, 55, 75, 55, 85, 55, 60], 'Charming and a little aloof, you love attention — but strictly on your own terms.'),
  entry(925, 'Maushold',         [50, 40, 90, 45, 100, 10, 55, 55], 'All about family and togetherness, you are happiest in a big, happy group.'),
  entry(959, 'Tinkaton',         [85, 60, 60, 85, 50, 80, 35, 60], 'Inventive and fearless, you build your own tools — and your own path.'),
]);

/** Set of National Pokédex numbers that PokéMatch may request from PokéAPI. */
export const ALLOWED_POKEMON_IDS = Object.freeze(new Set(POKEMON_PROFILES.map((p) => p.id)));

export function getProfileById(id) {
  return POKEMON_PROFILES.find((p) => p.id === id) ?? null;
}
