import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Where is Nerom from?",
    options: [
      { id: 'a', text: "Nigeria", isCorrect: false },
      { id: 'b', text: "Outerspace", isCorrect: true },
    ],
    comment: "Nerom is actually too bad and not from this planet",
  },
  {
    id: 2,
    text: "Which does Nerom prefer more?",
    options: [
      { id: 'a', text: "Spotify", isCorrect: true },
      { id: 'b', text: "Apple Music", isCorrect: false },
    ],
    comment: "Apple Music is ass.",
  },
  {
    id: 3,
    text: "Which does Nerom prefer more?",
    options: [
      { id: 'a', text: "AI", isCorrect: true },
      { id: 'b', text: "ZK", isCorrect: true },
    ],
    comment: "Both, just like cysic",
  },
  {
    id: 4,
    text: "Which does Nerom prefer more?",
    options: [
      { id: 'a', text: "Samsung", isCorrect: false },
      { id: 'b', text: "Apple", isCorrect: true },
    ],
    comment: "Green bubbles are his biggest ick. He blocks Android users on sight.",
  },
  {
    id: 5,
    text: "Nerom is an?",
    options: [
      { id: 'a', text: "Introvert", isCorrect: true },
      { id: 'b', text: "Extrovert", isCorrect: true },
    ],
    comment: "Nerom is an introverted extrovert.",
  },
  {
    id: 6,
    text: "Which does Nerom prefer more?",
    options: [
      { id: 'a', text: "Movies", isCorrect: false },
      { id: 'b', text: "Series", isCorrect: true },
    ],
    comment: "Nerom would rather finish 8 seasons of GOT than watch a 2 hour movie. His brain is weird.",
  },
  {
    id: 7,
    text: "Which does Nerom prefer more?",
    options: [
      { id: 'a', text: "Instagram", isCorrect: false },
      { id: 'b', text: "TikTok", isCorrect: true },
    ],
    comment: "Doom scrolling is a full time job.",
  },
  {
    id: 8,
    text: "Who does Nerom prefer?",
    options: [
      { id: 'a', text: "Drake", isCorrect: false },
      { id: 'b', text: "Kendrick", isCorrect: true },
    ],
    comment: "They not like us.",
  },
  {
    id: 9,
    text: "Who does Nerom prefer?",
    options: [
      { id: 'a', text: "Wizkid", isCorrect: false },
      { id: 'b', text: "Davido", isCorrect: false },
    ],
    comment: "None of em. Burna Boy is >>>>",
  },
  {
    id: 10,
    text: "How much does Nerom have in his wallet?",
    options: [
      { id: 'a', text: "More than $1k+", isCorrect: false },
      { id: 'b', text: "$69", isCorrect: false },
    ],
    comment: "He got liquidated while you were reading this. He is now eating ice for dinner.",
  },
];

export const RESULT_MESSAGES = {
  high: "You're literally Nerom's twin. It's scary.",
  mid: "Mid. You know him, but do you *know* him?",
  low: "We are revoking your friendship card. Get out.",
};

export const ROASTS = [
  "Bruh...", 
  "Skill issue 💀", 
  "Side eye...", 
  "Are you serious?", 
  "Emotional Damage", 
  "Cringe", 
  "Nerom is judging you", 
  "Delete the app",
  "Even my grandma knew that",
  "Yikes..."
];