/**
 * MathEngine - Adaptive Math Problem Generator for Kids Math RPG
 *
 * Designed for 2nd-4th graders (ages 7-10). Generates multiplication,
 * division, skip counting, missing factor, and word problems with an
 * adaptive difficulty system that responds to per-student performance.
 *
 * Exported via window.MathEngine.
 *
 * @version 1.0.0
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Rolling window size for accuracy tracking per tier */
  const ROLLING_WINDOW = 20;

  /** Minimum problems in window before difficulty can change */
  const MIN_PROBLEMS_FOR_ADJUST = 5;

  /** Accuracy threshold to move UP */
  const ACCURACY_UP_THRESHOLD = 0.85;

  /** Accuracy threshold to move DOWN */
  const ACCURACY_DOWN_THRESHOLD = 0.60;

  /** Chance of serving a "stretch" problem one level above current */
  const STRETCH_CHANCE = 0.20;

  /** Fast-answer threshold in milliseconds - suggests mastery */
  const FAST_ANSWER_MS = 5000;

  /** XP reduction multiplier when a hint is used */
  const HINT_XP_PENALTY = 0.5;

  /** Base XP per correct answer */
  const BASE_XP = 10;

  /** Time limits by RPG context (seconds) */
  const TIME_LIMITS = {
    attack: 15,
    defend: 8,
    heal: 20,
    shop: 30,
    catch: 12,
    boss: 10,
  };

  /** Streak milestones: threshold -> { label, multiplier } */
  const STREAK_MILESTONES = [
    { threshold: 10, label: 'LEGENDARY!', multiplier: 3.0 },
    { threshold: 5, label: 'On Fire!', multiplier: 2.0 },
    { threshold: 3, label: 'Nice!', multiplier: 1.5 },
  ];

  /** Encouraging messages shown when a streak breaks */
  const ENCOURAGEMENT = [
    "Almost! Keep going, you've got this!",
    "Don't give up - every great wizard makes mistakes!",
    "Oops! Try again, you're still awesome!",
    "So close! Learning from mistakes is a superpower!",
    "No worries - the next one is yours!",
  ];

  /**
   * Factor pools by difficulty tier.
   * Each tier lists the multipliers available at that level.
   */
  const FACTOR_TIERS = {
    1: [1, 2, 5, 10],
    2: [1, 2, 5, 10],
    3: [3, 4, 6],
    4: [3, 4, 6],
    5: [7, 8, 9],
    6: [7, 8, 9],
    7: [11, 12],
    8: [11, 12],
    9: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    10: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  };

  /**
   * Problem type availability by difficulty tier.
   * Lower tiers stick to simple multiplication; higher tiers unlock more types.
   */
  const TYPE_AVAILABILITY = {
    1: ['multiplication'],
    2: ['multiplication', 'skipCounting'],
    3: ['multiplication', 'skipCounting'],
    4: ['multiplication', 'skipCounting', 'division'],
    5: ['multiplication', 'division', 'skipCounting'],
    6: ['multiplication', 'division', 'skipCounting', 'missingFactor'],
    7: ['multiplication', 'division', 'missingFactor', 'skipCounting'],
    8: ['multiplication', 'division', 'missingFactor', 'wordProblem'],
    9: ['multiplication', 'division', 'missingFactor', 'wordProblem'],
    10: ['multiplication', 'division', 'missingFactor', 'wordProblem'],
  };

  /** Word problem templates with RPG flavour */
  const WORD_PROBLEM_TEMPLATES = [
    {
      template: (a, b) =>
        `A wizard has ${a} bags with ${b} gems each. How many gems total?`,
      op: 'multiply',
    },
    {
      template: (a, b) =>
        `There are ${a} treasure chests. Each chest holds ${b} gold coins. How many coins in all?`,
      op: 'multiply',
    },
    {
      template: (a, b) =>
        `A dragon has ${a * b} scales arranged in ${a} equal rows. How many scales per row?`,
      op: 'divide',
    },
    {
      template: (a, b) =>
        `${a * b} potions need to be shared equally among ${b} adventurers. How many potions does each adventurer get?`,
      op: 'divide',
    },
    {
      template: (a, b) =>
        `A knight earns ${a} stars every quest. After ${b} quests, how many stars does the knight have?`,
      op: 'multiply',
    },
    {
      template: (a, b) =>
        `An elf plants ${a} rows of magic trees with ${b} trees in each row. How many trees were planted?`,
      op: 'multiply',
    },
    {
      template: (a, b) =>
        `A fairy collects ${a * b} berries and puts them into baskets of ${b}. How many baskets does she fill?`,
      op: 'divide',
    },
    {
      template: (a, b) => {
        const total = a * b + a;
        return `A hero defeats ${a} monsters on floor 1, then finds ${b} rooms each with ${a} monsters. How many monsters total? (Hint: count floor 1 plus all the rooms.)`;
      },
      op: 'multiStep',
      answer: (a, b) => a * b + a,
    },
    {
      template: (a, b) => {
        return `A shopkeeper has ${a} boxes of ${b} arrows each, and ${b} loose arrows. How many arrows altogether?`;
      },
      op: 'multiStep',
      answer: (a, b) => a * b + b,
    },
  ];

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------

  /** Generate a random integer in [min, max] inclusive */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Pick a random element from an array */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Shuffle an array in place (Fisher-Yates) and return it */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Generate a unique problem ID */
  let _idCounter = 0;
  function nextId() {
    _idCounter += 1;
    return 'prob_' + Date.now().toString(36) + '_' + _idCounter;
  }

  /**
   * Clamp a value between min and max.
   * @param {number} val
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  /** @type {number} Current difficulty 1-10 */
  let _difficulty = 1;

  /** @type {number} Current consecutive-correct streak */
  let _streak = 0;

  /** @type {number} Best streak ever achieved in this session/state */
  let _bestStreak = 0;

  /** @type {number} Total problems answered correctly */
  let _totalCorrect = 0;

  /** @type {number} Total problems answered */
  let _totalAnswered = 0;

  /**
   * Rolling history per difficulty tier.
   * Key = tier (1-10), Value = array of { correct: bool, timeMs: number }
   * Each array is capped at ROLLING_WINDOW entries.
   */
  let _history = {};

  /**
   * Mastery tracking by problem type.
   * Key = type string, Value = { correct: number, total: number }
   */
  let _masteryByType = {};

  /** Map of problemId -> problem data (for answer recording & hints) */
  let _activeProblem = null;

  /** Number of hints used for the current active problem */
  let _hintsUsed = 0;

  // ---------------------------------------------------------------------------
  // Internal: difficulty adaptation
  // ---------------------------------------------------------------------------

  /**
   * Push a result into the rolling window for the given tier.
   * @param {number} tier - Difficulty tier 1-10
   * @param {boolean} correct
   * @param {number} timeMs
   */
  function pushHistory(tier, correct, timeMs) {
    if (!_history[tier]) {
      _history[tier] = [];
    }
    _history[tier].push({ correct, timeMs });
    // Cap at rolling window size
    if (_history[tier].length > ROLLING_WINDOW) {
      _history[tier].shift();
    }
  }

  /**
   * Evaluate whether difficulty should change based on recent performance.
   * Called after every answer is recorded.
   */
  function adaptDifficulty() {
    const tier = _difficulty;
    const window = _history[tier] || [];

    if (window.length < MIN_PROBLEMS_FOR_ADJUST) {
      return; // Not enough data yet
    }

    const correctCount = window.filter((r) => r.correct).length;
    const accuracy = correctCount / window.length;

    // Check for fast correct answers as an additional mastery signal
    const recentFive = window.slice(-MIN_PROBLEMS_FOR_ADJUST);
    const recentCorrect = recentFive.filter((r) => r.correct).length;
    const recentAccuracy = recentCorrect / recentFive.length;
    const avgTime =
      recentFive.reduce((sum, r) => sum + r.timeMs, 0) / recentFive.length;
    const fastMastery = recentAccuracy >= ACCURACY_UP_THRESHOLD && avgTime < FAST_ANSWER_MS;

    if (recentAccuracy >= ACCURACY_UP_THRESHOLD || fastMastery) {
      // Move up (can jump by 1, or 2 if fast mastery at high accuracy)
      const jump = fastMastery && accuracy >= 0.9 ? 2 : 1;
      _difficulty = clamp(_difficulty + jump, 1, 10);
    } else if (recentAccuracy < ACCURACY_DOWN_THRESHOLD) {
      // Move down by exactly 1 (never more, to avoid shame spiral)
      _difficulty = clamp(_difficulty - 1, 1, 10);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal: problem generators
  // ---------------------------------------------------------------------------

  /**
   * Pick two factors appropriate for the given difficulty tier.
   * @param {number} tier
   * @returns {{ a: number, b: number }}
   */
  function pickFactors(tier) {
    const pool = FACTOR_TIERS[tier] || FACTOR_TIERS[1];
    const a = pick(pool);
    // b can be any single-digit (or up to 12) factor scaled by tier
    let bPool;
    if (tier <= 2) {
      bPool = [1, 2, 3, 4, 5, 10];
    } else if (tier <= 4) {
      bPool = [2, 3, 4, 5, 6];
    } else if (tier <= 6) {
      bPool = [2, 3, 4, 5, 6, 7, 8, 9];
    } else {
      bPool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
    const b = pick(bPool);
    return { a, b };
  }

  /**
   * Generate plausible wrong choices for a multiplication/division answer.
   * Includes common mistakes: off-by-one factor, adjacent multiples, wrong operation.
   * @param {number} correct - The correct answer
   * @param {number} a - First operand
   * @param {number} b - Second operand
   * @param {string} op - 'multiply' or 'divide'
   * @returns {number[]} Array of 3 unique wrong answers (all > 0)
   */
  function generateDistractors(correct, a, b, op) {
    const candidates = new Set();

    if (op === 'multiply') {
      // Off by one factor: (a-1)*b, (a+1)*b
      candidates.add((a + 1) * b);
      candidates.add((a - 1) * b);
      candidates.add(a * (b + 1));
      candidates.add(a * (b - 1));
      // Wrong operation: a + b
      candidates.add(a + b);
      // Close number
      candidates.add(correct + 1);
      candidates.add(correct - 1);
      candidates.add(correct + 2);
      // Digit swap for larger numbers
      if (correct >= 10) {
        const s = String(correct);
        const swapped = parseInt(s.split('').reverse().join(''), 10);
        if (swapped !== correct && swapped > 0) candidates.add(swapped);
      }
    } else if (op === 'divide') {
      // Common mistakes: answer +/- 1, multiply instead of divide
      candidates.add(correct + 1);
      candidates.add(correct - 1);
      candidates.add(correct + 2);
      candidates.add(a * b); // confused operation
      candidates.add(a - b);
      candidates.add(b);
    } else {
      // Generic distractors
      candidates.add(correct + 1);
      candidates.add(correct - 1);
      candidates.add(correct + 2);
      candidates.add(correct - 2);
      candidates.add(correct * 2);
    }

    // Remove the correct answer and non-positive numbers
    candidates.delete(correct);
    candidates.delete(0);
    for (const c of candidates) {
      if (c <= 0) candidates.delete(c);
    }

    // Convert to array and pick 3
    let arr = Array.from(candidates);
    shuffle(arr);
    arr = arr.slice(0, 3);

    // If we don't have enough, fill with random nearby values
    while (arr.length < 3) {
      let fallback = correct + randInt(-5, 5);
      if (fallback <= 0) fallback = correct + randInt(1, 5);
      if (fallback !== correct && !arr.includes(fallback)) {
        arr.push(fallback);
      }
    }

    return arr;
  }

  /**
   * Build the final choices array: correct answer + 3 distractors, shuffled.
   * @param {number} correct
   * @param {number[]} distractors
   * @returns {number[]}
   */
  function buildChoices(correct, distractors) {
    const choices = [correct, ...distractors.slice(0, 3)];
    return shuffle(choices);
  }

  // --- Individual problem type generators ---

  /**
   * Generate a multiplication problem.
   * @param {number} tier
   * @returns {object} Problem data
   */
  function genMultiplication(tier) {
    const { a, b } = pickFactors(tier);
    const answer = a * b;
    const distractors = generateDistractors(answer, a, b, 'multiply');
    return {
      type: 'multiplication',
      question: `${a} \u00d7 ${b} = ?`,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `Think of ${a} \u00d7 ${b} as ${a} groups of ${b}.`,
      hint2: buildMultiplicationHint(a, b),
      operands: { a, b },
    };
  }

  /**
   * Build a detailed visual hint for multiplication.
   * Breaks the problem into easier sub-problems.
   */
  function buildMultiplicationHint(a, b) {
    // Split the larger factor in half if possible
    if (b >= 4 && b % 2 === 0) {
      const half = b / 2;
      return `${a} \u00d7 ${b} = ${a} \u00d7 ${half} + ${a} \u00d7 ${half} = ${a * half} + ${a * half} = ${a * b}`;
    }
    if (a >= 4 && a % 2 === 0) {
      const half = a / 2;
      return `${a} \u00d7 ${b} = ${half} \u00d7 ${b} + ${half} \u00d7 ${b} = ${half * b} + ${half * b} = ${a * b}`;
    }
    // Fall back to showing the first couple of groups
    const parts = [];
    for (let i = 0; i < Math.min(a, 3); i++) parts.push(b);
    return `${a} \u00d7 ${b} means ${parts.join(' + ')}${a > 3 ? ' + ...' : ''} = ${a * b}`;
  }

  /**
   * Generate a skip counting problem.
   * "What comes next: 3, 6, 9, ___?"
   * @param {number} tier
   * @returns {object}
   */
  function genSkipCounting(tier) {
    const pool = FACTOR_TIERS[tier] || FACTOR_TIERS[1];
    const step = pick(pool);
    // Show 3-4 terms then ask for the next
    const termCount = tier >= 5 ? 4 : 3;
    const start = step; // Start at 1x the step
    const terms = [];
    for (let i = 0; i < termCount; i++) {
      terms.push(start + step * i);
    }
    const answer = start + step * termCount;
    const distractors = generateDistractors(answer, step, termCount + 1, 'multiply');

    return {
      type: 'skipCounting',
      question: `What comes next: ${terms.join(', ')}, ___?`,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `Look at the pattern - what are you adding each time?`,
      hint2: `Each number goes up by ${step}. So ${terms[terms.length - 1]} + ${step} = ${answer}.`,
      operands: { step, termCount },
    };
  }

  /**
   * Generate a missing factor problem.
   * "___ x 4 = 28"
   * @param {number} tier
   * @returns {object}
   */
  function genMissingFactor(tier) {
    const { a, b } = pickFactors(tier);
    const product = a * b;
    // Randomly decide which factor is missing
    const missingFirst = Math.random() < 0.5;
    const answer = missingFirst ? a : b;
    const shown = missingFirst ? b : a;
    const question = missingFirst
      ? `___ \u00d7 ${shown} = ${product}`
      : `${shown} \u00d7 ___ = ${product}`;

    const distractors = generateDistractors(answer, a, b, 'divide');

    return {
      type: 'missingFactor',
      question,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `What number times ${shown} gives you ${product}?`,
      hint2: `${product} \u00f7 ${shown} = ${answer}`,
      operands: { a, b, product },
    };
  }

  /**
   * Generate a division problem.
   * "24 / 6 = ___"
   * @param {number} tier
   * @returns {object}
   */
  function genDivision(tier) {
    const { a, b } = pickFactors(tier);
    const dividend = a * b;
    const divisor = b;
    const answer = a;

    const distractors = generateDistractors(answer, dividend, divisor, 'divide');

    return {
      type: 'division',
      question: `${dividend} \u00f7 ${divisor} = ?`,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `How many groups of ${divisor} fit into ${dividend}?`,
      hint2: `Think: ${divisor} \u00d7 ___ = ${dividend}. The answer is ${answer}.`,
      operands: { dividend, divisor },
    };
  }

  /**
   * Generate a word problem.
   * Uses RPG-themed templates.
   * @param {number} tier
   * @returns {object}
   */
  function genWordProblem(tier) {
    const { a, b } = pickFactors(tier);

    // Filter templates by tier: multi-step only at tier 9-10
    let templates = WORD_PROBLEM_TEMPLATES.filter((t) => {
      if (t.op === 'multiStep') return tier >= 9;
      return true;
    });

    const tmpl = pick(templates);
    const question = tmpl.template(a, b);
    let answer;

    if (tmpl.op === 'multiply') {
      answer = a * b;
    } else if (tmpl.op === 'divide') {
      answer = a; // templates are structured so a is the quotient
    } else if (tmpl.op === 'multiStep' && tmpl.answer) {
      answer = tmpl.answer(a, b);
    } else {
      answer = a * b;
    }

    const opForDistractors = tmpl.op === 'divide' ? 'divide' : 'multiply';
    const distractors = generateDistractors(answer, a, b, opForDistractors);

    return {
      type: 'wordProblem',
      question,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `Read the problem again carefully. What operation do you need?`,
      hint2:
        tmpl.op === 'multiply'
          ? `Multiply: ${a} \u00d7 ${b} = ${answer}`
          : tmpl.op === 'divide'
            ? `Divide: ${a * b} \u00f7 ${b} = ${answer}`
            : `Break it into steps. The answer is ${answer}.`,
      operands: { a, b },
    };
  }

  // ---------------------------------------------------------------------------
  // Problem generation orchestrator
  // ---------------------------------------------------------------------------

  /** Map of type string to generator function */
  const GENERATORS = {
    multiplication: genMultiplication,
    skipCounting: genSkipCounting,
    missingFactor: genMissingFactor,
    division: genDivision,
    wordProblem: genWordProblem,
  };

  /**
   * Core: generate one problem for a given effective difficulty.
   * @param {number} effectiveDifficulty
   * @param {string} context - RPG context for time limit
   * @returns {object} Full problem object
   */
  function createProblem(effectiveDifficulty, context) {
    const tier = clamp(effectiveDifficulty, 1, 10);
    const availableTypes = TYPE_AVAILABILITY[tier];
    const chosenType = pick(availableTypes);
    const generator = GENERATORS[chosenType];
    const raw = generator(tier);

    const id = nextId();
    const timeLimit = TIME_LIMITS[context] || TIME_LIMITS.attack;

    const problem = {
      id,
      type: raw.type,
      question: raw.question,
      answer: raw.answer,
      choices: raw.choices,
      difficulty: tier,
      timeLimit,
      hint: raw.hint1, // First hint shown by default in the hint field
      _hint1: raw.hint1,
      _hint2: raw.hint2,
      _operands: raw.operands,
    };

    return problem;
  }

  // ---------------------------------------------------------------------------
  // Streak & XP helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine the current streak milestone (if any).
   * @returns {{ label: string, multiplier: number } | null}
   */
  function currentMilestone() {
    for (const ms of STREAK_MILESTONES) {
      if (_streak >= ms.threshold) return ms;
    }
    return null;
  }

  /**
   * Calculate XP earned for a correct answer.
   * Accounts for streak multiplier and hint penalty.
   * @param {number} difficulty
   * @param {boolean} usedHint
   * @returns {number}
   */
  function calcXP(difficulty, usedHint) {
    const milestone = currentMilestone();
    const multiplier = milestone ? milestone.multiplier : 1;
    let xp = Math.round(BASE_XP * difficulty * multiplier);
    if (usedHint) {
      xp = Math.round(xp * HINT_XP_PENALTY);
    }
    return xp;
  }

  // ---------------------------------------------------------------------------
  // State management
  // ---------------------------------------------------------------------------

  /** Reset all internal state to defaults */
  function resetState() {
    _difficulty = 1;
    _streak = 0;
    _bestStreak = 0;
    _totalCorrect = 0;
    _totalAnswered = 0;
    _history = {};
    _masteryByType = {};
    _activeProblem = null;
    _hintsUsed = 0;
    _idCounter = 0;
  }

  /**
   * Serialize current state into a plain object for saving.
   * @returns {object}
   */
  function serializeState() {
    return {
      difficulty: _difficulty,
      streak: _streak,
      bestStreak: _bestStreak,
      totalCorrect: _totalCorrect,
      totalAnswered: _totalAnswered,
      history: JSON.parse(JSON.stringify(_history)),
      masteryByType: JSON.parse(JSON.stringify(_masteryByType)),
    };
  }

  /**
   * Restore state from a previously saved object.
   * @param {object} state
   */
  function deserializeState(state) {
    if (!state || typeof state !== 'object') return;
    _difficulty = clamp(state.difficulty || 1, 1, 10);
    _streak = state.streak || 0;
    _bestStreak = state.bestStreak || 0;
    _totalCorrect = state.totalCorrect || 0;
    _totalAnswered = state.totalAnswered || 0;
    _history = state.history || {};
    _masteryByType = state.masteryByType || {};
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.MathEngine = {
    /**
     * Initialize the engine with optional saved state.
     * Call this once before generating problems.
     *
     * @param {object|null} savedState - Previously saved state from getState(), or null for fresh start.
     * @returns {void}
     */
    init(savedState = null) {
      resetState();
      if (savedState) {
        deserializeState(savedState);
      }
    },

    /**
     * Generate a math problem appropriate for the student's current difficulty.
     *
     * The RPG context affects time limits and presentation flavour but does
     * not change the mathematical difficulty.
     *
     * There is a 20% chance of a "stretch" problem served one level above
     * the student's current difficulty, to gently challenge them.
     *
     * @param {string} [context='attack'] - RPG context: 'attack' | 'defend' | 'heal' | 'shop' | 'catch' | 'boss'
     * @returns {{ id: string, type: string, question: string, answer: number, choices: number[], difficulty: number, timeLimit: number, hint: string }}
     */
    generateProblem(context = 'attack') {
      // Determine effective difficulty (stretch problems)
      let effective = _difficulty;
      if (Math.random() < STRETCH_CHANCE && _difficulty < 10) {
        effective = _difficulty + 1;
      }

      const problem = createProblem(effective, context);
      _activeProblem = problem;
      _hintsUsed = 0;

      // Return a clean public-facing object (no internal hint fields)
      return {
        id: problem.id,
        type: problem.type,
        question: problem.question,
        answer: problem.answer,
        choices: problem.choices,
        difficulty: problem.difficulty,
        timeLimit: problem.timeLimit,
        hint: problem.hint,
      };
    },

    /**
     * Record the student's answer for a given problem.
     *
     * Updates internal tracking: streak, mastery, rolling history,
     * and triggers the adaptive difficulty algorithm.
     *
     * @param {string} problemId - The id from the generated problem.
     * @param {number} givenAnswer - The student's answer.
     * @param {number} timeMs - Time taken in milliseconds.
     * @returns {{ correct: boolean, streak: number, xpEarned: number, message: string }}
     */
    recordAnswer(problemId, givenAnswer, timeMs) {
      if (!_activeProblem || _activeProblem.id !== problemId) {
        return {
          correct: false,
          streak: _streak,
          xpEarned: 0,
          message: 'Problem not found. Generate a new problem first.',
        };
      }

      const correct = givenAnswer === _activeProblem.answer;
      _totalAnswered += 1;

      // Update mastery tracking
      const ptype = _activeProblem.type;
      if (!_masteryByType[ptype]) {
        _masteryByType[ptype] = { correct: 0, total: 0 };
      }
      _masteryByType[ptype].total += 1;

      let xpEarned = 0;
      let message = '';

      if (correct) {
        _totalCorrect += 1;
        _streak += 1;
        _masteryByType[ptype].correct += 1;

        if (_streak > _bestStreak) {
          _bestStreak = _streak;
        }

        const usedHint = _hintsUsed > 0;
        xpEarned = calcXP(_activeProblem.difficulty, usedHint);

        // Build message based on streak
        const milestone = currentMilestone();
        if (milestone) {
          message = `${milestone.label} ${_streak} in a row! (+${xpEarned} XP)`;
        } else {
          message = `Correct! (+${xpEarned} XP)`;
        }

        if (usedHint) {
          message += ' (hint used - half XP)';
        }
      } else {
        // Wrong answer
        const wasOnStreak = _streak >= 3;
        _streak = 0;
        message = pick(ENCOURAGEMENT);
        if (wasOnStreak) {
          message += ' Your streak will be back in no time!';
        }
        message += ` The answer was ${_activeProblem.answer}.`;
      }

      // Push to rolling history for the problem's actual difficulty tier
      pushHistory(_activeProblem.difficulty, correct, timeMs);

      // Run adaptive algorithm
      adaptDifficulty();

      // Clear active problem
      _activeProblem = null;
      _hintsUsed = 0;

      return {
        correct,
        streak: _streak,
        xpEarned,
        message,
      };
    },

    /**
     * Get current student statistics.
     *
     * @returns {{ level: number, accuracy: number, streak: number, bestStreak: number, totalSolved: number, masteryByType: object }}
     */
    getStats() {
      const accuracy = _totalAnswered > 0 ? _totalCorrect / _totalAnswered : 0;
      return {
        level: _difficulty,
        accuracy: Math.round(accuracy * 1000) / 1000, // 3 decimal places
        streak: _streak,
        bestStreak: _bestStreak,
        totalSolved: _totalAnswered,
        masteryByType: JSON.parse(JSON.stringify(_masteryByType)),
      };
    },

    /**
     * Get the current difficulty level (1-10).
     *
     * @returns {number}
     */
    getDifficulty() {
      return _difficulty;
    },

    /**
     * Serialize the full engine state for persistence (e.g. localStorage).
     *
     * @returns {object} Plain object safe for JSON.stringify.
     */
    getState() {
      return serializeState();
    },

    /**
     * Load a previously saved state into the engine.
     * This replaces all current state.
     *
     * @param {object} state - State object from getState().
     * @returns {void}
     */
    loadState(state) {
      deserializeState(state);
    },

    /**
     * Get a progressive hint for the current active problem.
     *
     * - First call returns a gentle conceptual hint.
     * - Second call returns a more direct/visual hint.
     * - Using hints reduces XP earned by 50% but does not break the streak.
     *
     * @param {string} problemId - The id of the problem to get a hint for.
     * @returns {string} Hint text, or an error message if no active problem.
     */
    getHint(problemId) {
      if (!_activeProblem || _activeProblem.id !== problemId) {
        return 'No active problem found. Generate a problem first.';
      }

      _hintsUsed += 1;

      if (_hintsUsed <= 1) {
        return _activeProblem._hint1;
      }
      return _activeProblem._hint2;
    },
  };
})();
