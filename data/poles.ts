import { Rarity } from '@/lib/types';

export interface FishingPole {
  level: number;
  name: string;
  price: number;
  description: string;
  emoji: string;
  modifiers: Record<Rarity, number>;
}

export const FISHING_POLES: FishingPole[] = [
  {
    level: 1,
    name: "Ol' Bendy",
    price: 0,
    description: "A bent twig. It works... barely.",
    emoji: "🪵",
    modifiers: {
      common: 1.0,
      uncommon: 1.0,
      rare: 1.0,
      epic: 1.0,
      legendary: 1.0,
    },
  },
  {
    level: 2,
    name: "The Noodler",
    price: 100,
    description: "Soggy but serviceable.",
    emoji: "🍜",
    modifiers: {
      common: 0.9,
      uncommon: 0.95,
      rare: 1.3,
      epic: 1.5,
      legendary: 1.5,
    },
  },
  {
    level: 3,
    name: "Bass Blaster 3000",
    price: 500,
    description: "As seen on TV!",
    emoji: "📺",
    modifiers: {
      common: 0.8,
      uncommon: 0.9,
      rare: 1.6,
      epic: 2.0,
      legendary: 2.0,
    },
  },
  {
    level: 4,
    name: "Chad's Choice",
    price: 2000,
    description: "Peak fishing energy.",
    emoji: "💪",
    modifiers: {
      common: 0.65,
      uncommon: 0.8,
      rare: 2.0,
      epic: 2.5,
      legendary: 3.0,
    },
  },
  {
    level: 5,
    name: "The Sigma Rod",
    price: 10000,
    description: "Rares respect this rod.",
    emoji: "🐺",
    modifiers: {
      common: 0.5,
      uncommon: 0.7,
      rare: 2.5,
      epic: 3.5,
      legendary: 4.0,
    },
  },
  {
    level: 6,
    name: "GIGACASTER 9000",
    price: 50000,
    description: "The ultimate fishing experience.",
    emoji: "🚀",
    modifiers: {
      common: 0.35,
      uncommon: 0.6,
      rare: 3.0,
      epic: 5.0,
      legendary: 6.0,
    },
  },
];

export function getPole(level: number): FishingPole {
  return FISHING_POLES[level - 1] || FISHING_POLES[0];
}

export function getNextPole(currentLevel: number): FishingPole | null {
  if (currentLevel >= 6) return null;
  return FISHING_POLES[currentLevel];
}
