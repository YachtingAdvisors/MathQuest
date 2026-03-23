import { ProblemType } from "./types";

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Factor pools by tier
// ---------------------------------------------------------------------------

const FACTOR_TIERS: Record<number, number[]> = {
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

function pickFactors(tier: number): { a: number; b: number } {
  const pool = FACTOR_TIERS[tier] || FACTOR_TIERS[1];
  const a = pick(pool);
  let bPool: number[];
  if (tier <= 2) bPool = [1, 2, 3, 4, 5, 10];
  else if (tier <= 4) bPool = [2, 3, 4, 5, 6];
  else if (tier <= 6) bPool = [2, 3, 4, 5, 6, 7, 8, 9];
  else bPool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const b = pick(bPool);
  return { a, b };
}

// ---------------------------------------------------------------------------
// Distractor generation
// ---------------------------------------------------------------------------

function generateDistractors(
  correct: number,
  a: number,
  b: number,
  op: string
): number[] {
  const candidates = new Set<number>();

  if (op === "multiply") {
    candidates.add((a + 1) * b);
    candidates.add((a - 1) * b);
    candidates.add(a * (b + 1));
    candidates.add(a * (b - 1));
    candidates.add(a + b);
    candidates.add(correct + 1);
    candidates.add(correct - 1);
    candidates.add(correct + 2);
    if (correct >= 10) {
      const s = String(correct);
      const swapped = parseInt(s.split("").reverse().join(""), 10);
      if (swapped !== correct && swapped > 0) candidates.add(swapped);
    }
  } else if (op === "divide") {
    candidates.add(correct + 1);
    candidates.add(correct - 1);
    candidates.add(correct + 2);
    candidates.add(a * b);
    candidates.add(a - b);
    candidates.add(b);
  } else {
    candidates.add(correct + 1);
    candidates.add(correct - 1);
    candidates.add(correct + 2);
    candidates.add(correct - 2);
    candidates.add(correct + 3);
    candidates.add(correct - 3);
    if (correct > 10) candidates.add(correct + 10);
    if (correct > 10) candidates.add(correct - 10);
  }

  candidates.delete(correct);
  candidates.delete(0);
  Array.from(candidates).forEach((c) => {
    if (c <= 0) candidates.delete(c);
  });

  let arr = Array.from(candidates);
  shuffle(arr);
  arr = arr.slice(0, 3);

  while (arr.length < 3) {
    let fallback = correct + randInt(-5, 5);
    if (fallback <= 0) fallback = correct + randInt(1, 5);
    if (fallback !== correct && !arr.includes(fallback)) {
      arr.push(fallback);
    }
  }

  return arr;
}

function buildChoices(correct: number, distractors: number[]): number[] {
  const choices = [correct, ...distractors.slice(0, 3)];
  return shuffle(choices);
}

// ---------------------------------------------------------------------------
// Raw problem shape (before wrapping)
// ---------------------------------------------------------------------------

interface RawProblem {
  type: ProblemType;
  question: string;
  answer: number;
  choices: number[];
  hint1: string;
  hint2: string;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

export function genCounting(tier: number): RawProblem {
  const max = tier <= 1 ? 5 : 10;
  const items = randInt(1, max);
  const names = [
    "Pikachu",
    "Pokeball",
    "Potion",
    "Berry",
    "Star",
    "Badge",
  ];
  const name = pick(names);
  const question = `Count the ${name}s: ${"* ".repeat(items).trim()}`;
  const answer = items;
  const distractors = generateDistractors(answer, items, 1, "generic");
  return {
    type: "counting",
    question,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: "Count each one carefully!",
    hint2: `There are ${answer} of them.`,
  };
}

export function genAddition(tier: number): RawProblem {
  let a: number, b: number;
  if (tier <= 1) {
    a = randInt(0, 5);
    b = randInt(0, 5);
  } else if (tier <= 2) {
    a = randInt(1, 10);
    b = randInt(1, 10);
  } else if (tier <= 3) {
    a = randInt(5, 20);
    b = randInt(5, 20);
  } else if (tier <= 5) {
    a = randInt(10, 50);
    b = randInt(10, 50);
  } else {
    a = randInt(20, 100);
    b = randInt(20, 100);
  }
  const answer = a + b;
  const distractors = generateDistractors(answer, a, b, "generic");
  return {
    type: "addition",
    question: `${a} + ${b} = ?`,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: `Start at ${a} and count up ${b} more.`,
    hint2: `${a} + ${b} = ${answer}`,
  };
}

export function genSubtraction(tier: number): RawProblem {
  let a: number, b: number;
  if (tier <= 2) {
    a = randInt(5, 20);
    b = randInt(1, a);
  } else if (tier <= 4) {
    a = randInt(10, 50);
    b = randInt(1, a);
  } else {
    a = randInt(20, 100);
    b = randInt(1, a);
  }
  const answer = a - b;
  const distractors = generateDistractors(answer, a, b, "generic");
  return {
    type: "subtraction",
    question: `${a} - ${b} = ?`,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: `Start at ${a} and count back ${b}.`,
    hint2: `${a} - ${b} = ${answer}`,
  };
}

export function genMultiplication(tier: number): RawProblem {
  const { a, b } = pickFactors(tier);
  const answer = a * b;
  const distractors = generateDistractors(answer, a, b, "multiply");
  return {
    type: "multiplication",
    question: `${a} \u00d7 ${b} = ?`,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: `Think of ${a} \u00d7 ${b} as ${a} groups of ${b}.`,
    hint2:
      b >= 4 && b % 2 === 0
        ? `${a} \u00d7 ${b} = ${a} \u00d7 ${b / 2} + ${a} \u00d7 ${b / 2} = ${a * (b / 2)} + ${a * (b / 2)} = ${answer}`
        : `${a} \u00d7 ${b} = ${answer}`,
  };
}

export function genDivision(tier: number): RawProblem {
  const { a, b } = pickFactors(tier);
  const dividend = a * b;
  const answer = a;
  const distractors = generateDistractors(answer, dividend, b, "divide");
  return {
    type: "division",
    question: `${dividend} \u00f7 ${b} = ?`,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: `How many groups of ${b} fit into ${dividend}?`,
    hint2: `${b} \u00d7 ${answer} = ${dividend}, so ${dividend} \u00f7 ${b} = ${answer}`,
  };
}

export function genSkipCounting(tier: number): RawProblem {
  const pool = FACTOR_TIERS[tier] || FACTOR_TIERS[1];
  const step = pick(pool);
  const termCount = tier >= 5 ? 4 : 3;
  const terms: number[] = [];
  for (let i = 0; i < termCount; i++) {
    terms.push(step * (i + 1));
  }
  const answer = step * (termCount + 1);
  const distractors = generateDistractors(answer, step, termCount + 1, "multiply");
  return {
    type: "skipCounting",
    question: `What comes next: ${terms.join(", ")}, ___?`,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: "Look at the pattern - what are you adding each time?",
    hint2: `Each number goes up by ${step}. So ${terms[terms.length - 1]} + ${step} = ${answer}.`,
  };
}

export function genMissingFactor(tier: number): RawProblem {
  const { a, b } = pickFactors(tier);
  const product = a * b;
  const missingFirst = Math.random() < 0.5;
  const answer = missingFirst ? a : b;
  const shown = missingFirst ? b : a;
  const question = missingFirst
    ? `___ \u00d7 ${shown} = ${product}`
    : `${shown} \u00d7 ___ = ${product}`;
  const distractors = generateDistractors(answer, a, b, "divide");
  return {
    type: "missingFactor",
    question,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: `What number times ${shown} gives you ${product}?`,
    hint2: `${product} \u00f7 ${shown} = ${answer}`,
  };
}

export function genWordProblem(tier: number): RawProblem {
  const { a, b } = pickFactors(tier);
  const templates = [
    {
      text: `A trainer has ${a} Pokeballs with ${b} Pokemon each. How many Pokemon total?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `There are ${a} gyms. Each gym has ${b} badges to earn. How many badges in all?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `A Pikachu used ${a * b} Thunder Bolts in ${b} battles. How many per battle?`,
      answer: a,
      op: "divide" as const,
    },
    {
      text: `${a * b} Rare Candies need to be shared equally among ${b} Pokemon. How many each?`,
      answer: a,
      op: "divide" as const,
    },
    {
      text: `A trainer earns ${a} coins every battle. After ${b} battles, how many coins?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `Professor Oak planted ${a} rows of Berry trees with ${b} trees in each row. How many trees?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `Nurse Joy healed ${a} Pokemon. Each had ${b} HP restored. How much HP total?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `Team Rocket stole ${a * b} Pokemon and split them into ${b} equal groups. How many per group?`,
      answer: a,
      op: "divide" as const,
    },
    {
      text: `Your Pokedex shows ${a} Pokemon in ${b} different routes. How many Pokemon total?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `Brock's gym has ${a} trainers. Each has ${b} Rock Pokemon. How many Rock Pokemon total?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `Misty's pool has ${a * b} Magikarp swimming in ${a} equal lanes. How many per lane?`,
      answer: b,
      op: "divide" as const,
    },
    {
      text: `You traded ${a} Rare Candies for ${b} Pokeballs each. How many Pokeballs did you get?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `The Elite Four each have ${b} Pokemon. How many total for all ${a} of them?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `A Snorlax eats ${a} berries every hour. After ${b} hours, how many berries?`,
      answer: a * b,
      op: "multiply" as const,
    },
    {
      text: `You found ${a * b} TMs in ${b} treasure chests. How many TMs per chest?`,
      answer: a,
      op: "divide" as const,
    },
    {
      text: `Ash caught ${a} Pokemon on Monday and ${b} times as many on Tuesday. How many on Tuesday?`,
      answer: a * b,
      op: "multiply" as const,
    },
  ];
  const tmpl = pick(templates);
  const distractors = generateDistractors(
    tmpl.answer,
    a,
    b,
    tmpl.op
  );
  return {
    type: "wordProblem",
    question: tmpl.text,
    answer: tmpl.answer,
    choices: buildChoices(tmpl.answer, distractors),
    hint1: "Read the problem again carefully. What operation do you need?",
    hint2:
      tmpl.op === "multiply"
        ? `Multiply: ${a} \u00d7 ${b} = ${tmpl.answer}`
        : `Divide: ${a * b} \u00f7 ${b} = ${tmpl.answer}`,
  };
}

export function genFractions(tier: number): RawProblem {
  const denominators = tier <= 6 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 8, 10];
  const d = pick(denominators);
  const n1 = randInt(1, d - 1);
  const n2 = randInt(1, d - 1);
  // Addition of fractions with same denominator
  const answerNum = n1 + n2;
  const question = `${n1}/${d} + ${n2}/${d} = ?/${d}`;
  const answer = answerNum;
  const distractors = generateDistractors(answer, n1, n2, "generic");
  return {
    type: "fractions",
    question,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: "When denominators are the same, just add the numerators!",
    hint2: `${n1} + ${n2} = ${answer}, so the answer is ${answer}/${d}`,
  };
}

export function genDecimals(_tier: number): RawProblem {
  // Simple decimal addition: 0.X + 0.Y style
  const tenthsA = randInt(1, 9);
  const tenthsB = randInt(1, 9);
  const sum = tenthsA + tenthsB;
  const question = `0.${tenthsA} + 0.${tenthsB} = 0.___`;
  const answer = sum;
  const distractors = generateDistractors(answer, tenthsA, tenthsB, "generic");
  return {
    type: "decimals",
    question,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: "Add the tenths digits together.",
    hint2: `${tenthsA} + ${tenthsB} = ${answer}, so the answer is 0.${answer}`,
  };
}

export function genPercentages(tier: number): RawProblem {
  const percents = [10, 20, 25, 50];
  const percent = pick(percents);
  const bases = [20, 40, 50, 60, 80, 100, 200];
  const base = pick(bases);
  const answer = (percent / 100) * base;
  const question = `What is ${percent}% of ${base}?`;
  const distractors = generateDistractors(
    answer,
    percent,
    base,
    "generic"
  );
  return {
    type: "percentages",
    question,
    answer,
    choices: buildChoices(answer, distractors),
    hint1: `${percent}% means ${percent} out of 100.`,
    hint2: `${percent}/100 \u00d7 ${base} = ${answer}`,
  };
}

export function genBasicAlgebra(tier: number): RawProblem {
  // x + a = b  or  a * x = b
  if (Math.random() < 0.5) {
    const x = randInt(1, tier <= 7 ? 10 : 20);
    const a = randInt(1, tier <= 7 ? 10 : 15);
    const b = x + a;
    const question = `x + ${a} = ${b}. What is x?`;
    const answer = x;
    const distractors = generateDistractors(answer, a, b, "generic");
    return {
      type: "basicAlgebra",
      question,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `To find x, subtract ${a} from both sides.`,
      hint2: `x = ${b} - ${a} = ${answer}`,
    };
  } else {
    const x = randInt(2, 8);
    const a = randInt(2, 6);
    const b = a * x;
    const question = `${a} \u00d7 x = ${b}. What is x?`;
    const answer = x;
    const distractors = generateDistractors(answer, a, b, "divide");
    return {
      type: "basicAlgebra",
      question,
      answer,
      choices: buildChoices(answer, distractors),
      hint1: `To find x, divide both sides by ${a}.`,
      hint2: `x = ${b} \u00f7 ${a} = ${answer}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Visual aid helper
// ---------------------------------------------------------------------------

export function getVisualAid(type: string, a: number, b: number): string {
  if (type === 'multiplication' && a <= 5 && b <= 5) {
    // Return array dots visualization
    let grid = '';
    for (let i = 0; i < a; i++) {
      grid += '* '.repeat(b).trim() + '\n';
    }
    return grid.trim();
  }
  if (type === 'addition' && a <= 10 && b <= 10) {
    return '|'.repeat(a) + ' + ' + '|'.repeat(b) + ' = ?';
  }
  if (type === 'skipCounting') {
    return `+${a} each time`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

export const GENERATORS: Record<ProblemType, (tier: number) => RawProblem> = {
  counting: genCounting,
  addition: genAddition,
  subtraction: genSubtraction,
  multiplication: genMultiplication,
  division: genDivision,
  skipCounting: genSkipCounting,
  missingFactor: genMissingFactor,
  wordProblem: genWordProblem,
  fractions: genFractions,
  decimals: genDecimals,
  percentages: genPercentages,
  basicAlgebra: genBasicAlgebra,
};
