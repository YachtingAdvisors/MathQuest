export interface MathProblem {
  id: string;
  type: string;
  question: string;
  answer: number;
  choices: number[];
  difficulty: number;
  timeLimit: number;
  hint1: string;
  hint2: string;
}

export interface MathResult {
  correct: boolean;
  streak: number;
  xpEarned: number;
  message: string;
  timeMs: number;
  speedBonus: number;
  speedLabel: string;
  damageMultiplier: number;
}

export interface MathEngineState {
  grade: number; // 0=K, 1=1st, ... 8=8th
  difficulty: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  history: Record<number, Array<{ correct: boolean; timeMs: number }>>;
  masteryByType: Record<string, { correct: number; total: number }>;
  streakShield: boolean;
  dailyChallengeScore: number;
  dailyChallengeDate: string;
  mathPokedex: Record<string, { mastered: boolean; accuracy: number; totalSolved: number }>;
  timedMode: boolean;
  evolutionMastery: Record<number, { requiredType: string; requiredAccuracy: number }>;
}

export type MathContext =
  | "attack"
  | "defend"
  | "heal"
  | "shop"
  | "catch"
  | "boss"
  | "run"
  | "item"
  | "switch";

export type ProblemType =
  | "counting"
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "skipCounting"
  | "missingFactor"
  | "wordProblem"
  | "fractions"
  | "decimals"
  | "percentages"
  | "basicAlgebra";

export interface GradeConfig {
  label: string;
  description: string;
  minTier: number;
  maxTier: number;
  problemTypes: ProblemType[];
}

export interface MathTypeAdvantage {
  pokemonType: string;
  mathTypes: ProblemType[];
  bonusMultiplier: number;
}

export interface DailyChallengeResult {
  date: string;
  score: number;
  totalProblems: number;
  accuracy: number;
  bestStreak: number;
  timeMs: number;
}

export interface MathBadge {
  id: string;
  name: string;
  description: string;
  requiredType: ProblemType;
  requiredAccuracy: number;
  requiredSolved: number;
  earned: boolean;
}

export interface BossMathChallenge {
  problems: number; // number of consecutive problems to solve
  context: MathContext;
  bonusDamageOnPerfect: number; // multiplier for getting all right
}

export interface VisualAid {
  type: 'array' | 'numberLine' | 'fractionBar' | 'none';
  data: any;
}

export type PendingBattleAction =
  | { type: "attack"; moveId: string }
  | { type: "item" }
  | { type: "catch" }
  | { type: "run" }
  | { type: "switch"; pokemonIndex: number };
