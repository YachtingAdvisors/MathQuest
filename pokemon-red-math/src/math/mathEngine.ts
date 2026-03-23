import {
  MathProblem,
  MathResult,
  MathEngineState,
  MathContext,
} from "./types";
import {
  GRADE_CONFIGS,
  TIME_LIMITS,
  STREAK_MILESTONES,
  SPEED_BONUSES,
  ROLLING_WINDOW,
  MIN_PROBLEMS_FOR_ADJUST,
  ACCURACY_UP_THRESHOLD,
  ACCURACY_DOWN_THRESHOLD,
  STRETCH_CHANCE,
  FAST_ANSWER_MS,
  BASE_XP,
  HINT_XP_PENALTY,
} from "./gradeConfig";
import { GENERATORS } from "./problemGenerators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let _idCounter = 0;
function nextId(): string {
  _idCounter += 1;
  return "prob_" + Date.now().toString(36) + "_" + _idCounter;
}

const ENCOURAGEMENT = [
  "Almost! Keep going, you've got this!",
  "Don't give up - every great trainer makes mistakes!",
  "Oops! Try again, you're still awesome!",
  "So close! Learning from mistakes is a superpower!",
  "No worries - the next one is yours!",
];

// ---------------------------------------------------------------------------
// MathEngine class
// ---------------------------------------------------------------------------

export class MathEngine {
  private state: MathEngineState;
  private activeProblem: MathProblem | null = null;
  private hintsUsed = 0;

  constructor(grade: number = 3, savedState?: MathEngineState) {
    if (savedState) {
      this.state = { ...savedState };
    } else {
      const config = GRADE_CONFIGS[grade] || GRADE_CONFIGS[3];
      this.state = {
        grade,
        difficulty: config.minTier,
        streak: 0,
        bestStreak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        history: {},
        masteryByType: {},
      };
    }
  }

  // -------------------------------------------------------------------------
  // Problem generation
  // -------------------------------------------------------------------------

  generateProblem(context: MathContext = "attack"): MathProblem {
    const config = GRADE_CONFIGS[this.state.grade] || GRADE_CONFIGS[3];

    // Determine effective difficulty with stretch
    let effective = this.state.difficulty;
    if (
      Math.random() < STRETCH_CHANCE &&
      this.state.difficulty < config.maxTier
    ) {
      effective = this.state.difficulty + 1;
    }
    effective = clamp(effective, config.minTier, config.maxTier);

    // Pick a random available problem type for this grade
    const type = pick(config.problemTypes);
    const generator = GENERATORS[type];
    const raw = generator(effective);

    const timeLimit = TIME_LIMITS[context] || TIME_LIMITS.attack;
    const id = nextId();

    const problem: MathProblem = {
      id,
      type: raw.type,
      question: raw.question,
      answer: raw.answer,
      choices: raw.choices,
      difficulty: effective,
      timeLimit,
      hint1: raw.hint1,
      hint2: raw.hint2,
    };

    this.activeProblem = problem;
    this.hintsUsed = 0;

    return problem;
  }

  // -------------------------------------------------------------------------
  // Record answer
  // -------------------------------------------------------------------------

  recordAnswer(
    problemId: string,
    givenAnswer: number,
    timeMs: number
  ): MathResult {
    if (!this.activeProblem || this.activeProblem.id !== problemId) {
      return {
        correct: false,
        streak: this.state.streak,
        xpEarned: 0,
        message: "Problem not found.",
        timeMs: 0,
        speedBonus: 1.0,
        speedLabel: "",
      };
    }

    const correct = givenAnswer === this.activeProblem.answer;
    this.state.totalAnswered += 1;

    // Update mastery
    const ptype = this.activeProblem.type;
    if (!this.state.masteryByType[ptype]) {
      this.state.masteryByType[ptype] = { correct: 0, total: 0 };
    }
    this.state.masteryByType[ptype].total += 1;

    let xpEarned = 0;
    let message = "";
    let speedBonus = 1.0;
    let speedLabel = "";

    // Calculate speed bonus
    for (const sb of SPEED_BONUSES) {
      if (timeMs < sb.maxMs) {
        speedBonus = sb.bonus;
        speedLabel = sb.label;
        break;
      }
    }

    if (correct) {
      this.state.totalCorrect += 1;
      this.state.streak += 1;
      this.state.masteryByType[ptype].correct += 1;

      if (this.state.streak > this.state.bestStreak) {
        this.state.bestStreak = this.state.streak;
      }

      const usedHint = this.hintsUsed > 0;
      xpEarned = this.calcXP(this.activeProblem.difficulty, usedHint);

      const milestone = this.currentMilestone();
      if (milestone) {
        message = `${milestone.label} ${this.state.streak} in a row! (+${xpEarned} XP)`;
      } else {
        message = `Correct! (+${xpEarned} XP)`;
      }
      if (usedHint) message += " (hint used - half XP)";
      if (speedLabel) message += ` ${speedLabel}`;
    } else {
      const wasOnStreak = this.state.streak >= 3;
      this.state.streak = 0;
      speedBonus = 0;
      speedLabel = "";
      message = pick(ENCOURAGEMENT);
      if (wasOnStreak) message += " Your streak will be back!";
      message += ` The answer was ${this.activeProblem.answer}.`;
    }

    // Push to rolling history
    this.pushHistory(this.activeProblem.difficulty, correct, timeMs);

    // Adapt difficulty
    this.adaptDifficulty();

    // Clear
    this.activeProblem = null;
    this.hintsUsed = 0;

    return { correct, streak: this.state.streak, xpEarned, message, timeMs, speedBonus, speedLabel };
  }

  // -------------------------------------------------------------------------
  // Hints
  // -------------------------------------------------------------------------

  getHint(problemId: string): string {
    if (!this.activeProblem || this.activeProblem.id !== problemId) {
      return "No active problem.";
    }
    this.hintsUsed += 1;
    return this.hintsUsed <= 1
      ? this.activeProblem.hint1
      : this.activeProblem.hint2;
  }

  // -------------------------------------------------------------------------
  // State access
  // -------------------------------------------------------------------------

  getState(): MathEngineState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getStats() {
    const accuracy =
      this.state.totalAnswered > 0
        ? this.state.totalCorrect / this.state.totalAnswered
        : 0;
    return {
      level: this.state.difficulty,
      accuracy: Math.round(accuracy * 1000) / 1000,
      streak: this.state.streak,
      bestStreak: this.state.bestStreak,
      totalSolved: this.state.totalAnswered,
      masteryByType: { ...this.state.masteryByType },
    };
  }

  getDifficulty(): number {
    return this.state.difficulty;
  }

  getStreak(): number {
    return this.state.streak;
  }

  getActiveProblem(): MathProblem | null {
    return this.activeProblem;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private pushHistory(tier: number, correct: boolean, timeMs: number) {
    if (!this.state.history[tier]) {
      this.state.history[tier] = [];
    }
    this.state.history[tier].push({ correct, timeMs });
    if (this.state.history[tier].length > ROLLING_WINDOW) {
      this.state.history[tier].shift();
    }
  }

  private adaptDifficulty() {
    const config = GRADE_CONFIGS[this.state.grade] || GRADE_CONFIGS[3];
    const tier = this.state.difficulty;
    const window = this.state.history[tier] || [];

    if (window.length < MIN_PROBLEMS_FOR_ADJUST) return;

    const recentFive = window.slice(-MIN_PROBLEMS_FOR_ADJUST);
    const recentCorrect = recentFive.filter((r) => r.correct).length;
    const recentAccuracy = recentCorrect / recentFive.length;
    const avgTime =
      recentFive.reduce((sum, r) => sum + r.timeMs, 0) / recentFive.length;
    const fastMastery =
      recentAccuracy >= ACCURACY_UP_THRESHOLD && avgTime < FAST_ANSWER_MS;

    const correctCount = window.filter((r) => r.correct).length;
    const accuracy = correctCount / window.length;

    if (recentAccuracy >= ACCURACY_UP_THRESHOLD || fastMastery) {
      const jump = fastMastery && accuracy >= 0.9 ? 2 : 1;
      this.state.difficulty = clamp(
        this.state.difficulty + jump,
        config.minTier,
        config.maxTier
      );
    } else if (recentAccuracy < ACCURACY_DOWN_THRESHOLD) {
      this.state.difficulty = clamp(
        this.state.difficulty - 1,
        config.minTier,
        config.maxTier
      );
    }
  }

  private currentMilestone() {
    for (const ms of STREAK_MILESTONES) {
      if (this.state.streak >= ms.threshold) return ms;
    }
    return null;
  }

  private calcXP(difficulty: number, usedHint: boolean): number {
    const milestone = this.currentMilestone();
    const multiplier = milestone ? milestone.multiplier : 1;
    let xp = Math.round(BASE_XP * difficulty * multiplier);
    if (usedHint) xp = Math.round(xp * HINT_XP_PENALTY);
    return xp;
  }
}
