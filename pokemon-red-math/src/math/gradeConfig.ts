import { GradeConfig } from "./types";

export const GRADE_CONFIGS: Record<number, GradeConfig> = {
  0: {
    label: "Kindergarten",
    description: "Counting & addition to 5",
    minTier: 1,
    maxTier: 2,
    problemTypes: ["counting", "addition"],
  },
  1: {
    label: "1st Grade",
    description: "Addition & subtraction to 20",
    minTier: 1,
    maxTier: 3,
    problemTypes: ["addition", "subtraction"],
  },
  2: {
    label: "2nd Grade",
    description: "Add/sub to 100, intro multiply",
    minTier: 2,
    maxTier: 4,
    problemTypes: ["addition", "subtraction", "multiplication"],
  },
  3: {
    label: "3rd Grade",
    description: "Multiplication & division facts",
    minTier: 3,
    maxTier: 5,
    problemTypes: ["multiplication", "division", "skipCounting"],
  },
  4: {
    label: "4th Grade",
    description: "Multi-digit multiply & long division",
    minTier: 4,
    maxTier: 6,
    problemTypes: [
      "multiplication",
      "division",
      "skipCounting",
      "missingFactor",
    ],
  },
  5: {
    label: "5th Grade",
    description: "Fractions, decimals & order of ops",
    minTier: 5,
    maxTier: 7,
    problemTypes: [
      "multiplication",
      "division",
      "missingFactor",
      "fractions",
      "decimals",
    ],
  },
  6: {
    label: "6th Grade",
    description: "Ratios, percentages & basic algebra",
    minTier: 6,
    maxTier: 8,
    problemTypes: [
      "multiplication",
      "division",
      "missingFactor",
      "wordProblem",
      "percentages",
      "basicAlgebra",
    ],
  },
  7: {
    label: "7th Grade",
    description: "Proportions, integers & expressions",
    minTier: 7,
    maxTier: 9,
    problemTypes: [
      "multiplication",
      "division",
      "missingFactor",
      "wordProblem",
      "fractions",
      "percentages",
      "basicAlgebra",
    ],
  },
  8: {
    label: "8th Grade",
    description: "Linear equations, exponents & geometry",
    minTier: 8,
    maxTier: 10,
    problemTypes: [
      "multiplication",
      "division",
      "missingFactor",
      "wordProblem",
      "fractions",
      "decimals",
      "percentages",
      "basicAlgebra",
    ],
  },
};

export const TIME_LIMITS: Record<string, number> = {
  attack: 15,
  defend: 8,
  heal: 20,
  shop: 30,
  catch: 12,
  boss: 10,
  run: 10,
  item: 15,
  switch: 10,
};

export const STREAK_MILESTONES = [
  { threshold: 10, label: "LEGENDARY!", multiplier: 3.0 },
  { threshold: 5, label: "On Fire!", multiplier: 2.0 },
  { threshold: 3, label: "Nice!", multiplier: 1.5 },
];

export const SPEED_BONUSES = [
  { maxMs: 2000, bonus: 1.3, label: "BLAZING!" },
  { maxMs: 4000, bonus: 1.15, label: "FAST!" },
  { maxMs: 6000, bonus: 1.05, label: "QUICK!" },
];

export const ROLLING_WINDOW = 20;
export const MIN_PROBLEMS_FOR_ADJUST = 5;
export const ACCURACY_UP_THRESHOLD = 0.85;
export const ACCURACY_DOWN_THRESHOLD = 0.6;
export const STRETCH_CHANCE = 0.2;
export const FAST_ANSWER_MS = 5000;
export const BASE_XP = 10;
export const HINT_XP_PENALTY = 0.5;
