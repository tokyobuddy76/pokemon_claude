/**
 * PokéMatch questionnaire.
 *
 * Each answer option awards weighted points (0–3) to one or more of the
 * eight personality dimensions defined in DIMENSIONS. The matching engine
 * normalises the totals per dimension, so options do not need to be
 * perfectly balanced against each other.
 *
 * `phrase` is a short, second-person paraphrase of the option, used by the
 * explanation templates on the results screen ("you'd rather ...").
 */

export const DIMENSIONS = [
  'courage',
  'intelligence',
  'loyalty',
  'creativity',
  'sociability',
  'independence',
  'calmness',
  'adventurousness',
];

export const DIMENSION_LABELS = {
  courage: 'Courage',
  intelligence: 'Intelligence',
  loyalty: 'Loyalty',
  creativity: 'Creativity',
  sociability: 'Sociability',
  independence: 'Independence',
  calmness: 'Calmness',
  adventurousness: 'Adventurousness',
};

export const QUESTIONS = [
  {
    id: 'q1',
    text: 'How do you usually spend your free time?',
    emoji: '🌤️',
    options: [
      { id: 'q1a', text: 'Exploring a new trail, town, or hidden spot', phrase: 'spend free time exploring somewhere new', weights: { adventurousness: 3, courage: 1, independence: 1 } },
      { id: 'q1b', text: 'Hanging out with friends or family', phrase: 'spend free time with friends and family', weights: { sociability: 3, loyalty: 2 } },
      { id: 'q1c', text: 'Reading, solving puzzles, or learning something new', phrase: 'spend free time learning and solving puzzles', weights: { intelligence: 3, calmness: 1, independence: 1 } },
      { id: 'q1d', text: 'Drawing, building, cooking, or making music', phrase: 'spend free time making things', weights: { creativity: 3, calmness: 1 } },
    ],
  },
  {
    id: 'q2',
    text: 'How do you react when facing a difficult challenge?',
    emoji: '⛰️',
    options: [
      { id: 'q2a', text: "Charge straight in — I'll figure it out on the way", phrase: 'charge straight into a tough challenge', weights: { courage: 3, adventurousness: 2 } },
      { id: 'q2b', text: 'Make a plan and break it into small steps', phrase: 'tackle challenges with a step-by-step plan', weights: { intelligence: 3, calmness: 2 } },
      { id: 'q2c', text: 'Call my friends and team up', phrase: 'team up with friends when things get hard', weights: { sociability: 2, loyalty: 2 } },
      { id: 'q2d', text: 'Look for a clever trick nobody has tried', phrase: 'hunt for a clever trick nobody has tried', weights: { creativity: 3, independence: 1, intelligence: 1 } },
    ],
  },
  {
    id: 'q3',
    text: 'How would your friends describe you?',
    emoji: '💬',
    options: [
      { id: 'q3a', text: 'Brave and bold', phrase: 'are known as brave and bold', weights: { courage: 3, adventurousness: 1 } },
      { id: 'q3b', text: 'Kind and dependable', phrase: 'are known as kind and dependable', weights: { loyalty: 3, calmness: 1 } },
      { id: 'q3c', text: 'Funny and full of energy', phrase: 'are known as funny and full of energy', weights: { sociability: 3, creativity: 1, adventurousness: 1 } },
      { id: 'q3d', text: 'Wise and thoughtful', phrase: 'are known as wise and thoughtful', weights: { intelligence: 2, calmness: 2 } },
    ],
  },
  {
    id: 'q4',
    text: 'What environment makes you happiest?',
    emoji: '🗺️',
    options: [
      { id: 'q4a', text: 'A quiet forest or a peaceful beach', phrase: 'feel happiest somewhere quiet and peaceful', weights: { calmness: 3, independence: 1 } },
      { id: 'q4b', text: 'A busy festival full of music and people', phrase: 'feel happiest at a lively festival', weights: { sociability: 3, adventurousness: 1 } },
      { id: 'q4c', text: 'A mountain peak or an unexplored cave', phrase: 'feel happiest on a mountain peak or in a hidden cave', weights: { adventurousness: 3, courage: 2 } },
      { id: 'q4d', text: 'A cozy workshop, studio, or library', phrase: 'feel happiest in a cozy workshop or library', weights: { creativity: 2, intelligence: 2, independence: 1 } },
    ],
  },
  {
    id: 'q5',
    text: 'How do you behave when working in a team?',
    emoji: '🤝',
    options: [
      { id: 'q5a', text: 'I take the lead and keep everyone moving', phrase: 'take the lead in a team', weights: { courage: 2, sociability: 2 } },
      { id: 'q5b', text: 'I support everyone and make sure no one is left behind', phrase: 'make sure no teammate gets left behind', weights: { loyalty: 3, sociability: 1 } },
      { id: 'q5c', text: 'I bring the fresh, unusual ideas', phrase: 'bring the fresh ideas to a team', weights: { creativity: 3, intelligence: 1 } },
      { id: 'q5d', text: 'I take my own part and deliver it on my own', phrase: 'prefer to own your part of a project', weights: { independence: 3, calmness: 1 } },
    ],
  },
  {
    id: 'q6',
    text: 'What is your greatest strength?',
    emoji: '💪',
    options: [
      { id: 'q6a', text: 'Courage — I face my fears', phrase: 'see courage as your greatest strength', weights: { courage: 3, adventurousness: 1 } },
      { id: 'q6b', text: 'Brains — I figure things out', phrase: 'see your brains as your greatest strength', weights: { intelligence: 3, calmness: 1 } },
      { id: 'q6c', text: 'Loyalty — I always have your back', phrase: 'see loyalty as your greatest strength', weights: { loyalty: 3, sociability: 1 } },
      { id: 'q6d', text: 'Imagination — I dream up new things', phrase: 'see imagination as your greatest strength', weights: { creativity: 3, independence: 1 } },
    ],
  },
  {
    id: 'q7',
    text: 'How do you handle disagreements?',
    emoji: '⚖️',
    options: [
      { id: 'q7a', text: 'Speak up directly and stand my ground', phrase: 'stand your ground in a disagreement', weights: { courage: 2, independence: 2 } },
      { id: 'q7b', text: 'Stay calm and look for a compromise', phrase: 'stay calm and look for compromise', weights: { calmness: 3, loyalty: 1 } },
      { id: 'q7c', text: 'Crack a joke to lighten the mood', phrase: 'lighten the mood with a joke', weights: { sociability: 2, creativity: 2 } },
      { id: 'q7d', text: 'Take some time alone to think it through', phrase: 'take time alone to think disagreements through', weights: { independence: 2, intelligence: 2 } },
    ],
  },
  {
    id: 'q8',
    text: 'What motivates you the most?',
    emoji: '🔥',
    options: [
      { id: 'q8a', text: 'Discovering something no one has seen before', phrase: 'are driven by discovery', weights: { adventurousness: 3, creativity: 1 } },
      { id: 'q8b', text: 'Protecting the people I care about', phrase: 'are driven to protect the people you care about', weights: { loyalty: 3, courage: 2 } },
      { id: 'q8c', text: 'Mastering a skill and becoming the best', phrase: 'are driven to master your skills', weights: { intelligence: 2, independence: 2, courage: 1 } },
      { id: 'q8d', text: 'Peace, comfort, and good vibes', phrase: 'are driven by peace and good vibes', weights: { calmness: 3, sociability: 1 } },
    ],
  },
  {
    id: 'q9',
    text: 'If you had a special power, what would it be?',
    emoji: '✨',
    options: [
      { id: 'q9a', text: 'Flying anywhere in the world', phrase: 'would choose the power of flight', weights: { adventurousness: 3, independence: 1 } },
      { id: 'q9b', text: 'Reading minds', phrase: 'would choose to read minds', weights: { intelligence: 3, sociability: 1 } },
      { id: 'q9c', text: 'Shape-shifting into anything I imagine', phrase: 'would choose shape-shifting', weights: { creativity: 3, adventurousness: 1 } },
      { id: 'q9d', text: 'Healing others', phrase: 'would choose the power to heal others', weights: { loyalty: 2, calmness: 2, sociability: 1 } },
    ],
  },
  {
    id: 'q10',
    text: 'Which statement best describes your personality?',
    emoji: '🌟',
    options: [
      { id: 'q10a', text: "Life is an adventure — let's go!", phrase: "believe life is an adventure", weights: { adventurousness: 2, courage: 2 } },
      { id: 'q10b', text: 'I march to the beat of my own drum.', phrase: 'march to the beat of your own drum', weights: { independence: 3, creativity: 1 } },
      { id: 'q10c', text: 'Friends are everything.', phrase: 'believe friends are everything', weights: { sociability: 2, loyalty: 2 } },
      { id: 'q10d', text: 'Slow and steady wins the race.', phrase: 'believe slow and steady wins the race', weights: { calmness: 3, intelligence: 1 } },
    ],
  },
];
