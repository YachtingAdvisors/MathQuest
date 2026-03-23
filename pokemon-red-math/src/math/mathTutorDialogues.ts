/**
 * NPC Math Tutor dialogues - contextual math lessons delivered by NPCs.
 * These are shown as text dialogues when the player talks to math tutor NPCs.
 */

export interface MathLesson {
  topic: string;
  npcName: string;
  dialogues: string[];
}

export const MATH_TUTOR_LESSONS: Record<string, MathLesson[]> = {
  addition: [
    {
      topic: "addition",
      npcName: "MATH TUTOR",
      dialogues: [
        "Welcome, young trainer!",
        "Addition is like gathering POKeMON!",
        "If you have 3 and catch 4 more...",
        "You count up: 3... 4, 5, 6, 7!",
        "So 3 + 4 = 7! Easy!",
        "Try starting with the bigger number and counting up the smaller one.",
        "Good luck in your battles!",
      ],
    },
  ],
  subtraction: [
    {
      topic: "subtraction",
      npcName: "MATH TUTOR",
      dialogues: [
        "Subtraction is the opposite of addition!",
        "If a SNORLAX eats 5 of your 12 berries...",
        "Start at 12 and count back 5:",
        "12... 11, 10, 9, 8, 7!",
        "So 12 - 5 = 7 berries left!",
        "Think of it as: what plus 5 equals 12?",
      ],
    },
  ],
  multiplication: [
    {
      topic: "multiplication",
      npcName: "MATH TUTOR",
      dialogues: [
        "Multiplication is repeated addition!",
        "3 x 4 means three groups of four.",
        "Like 3 trainers each with 4 POKeMON:",
        "4 + 4 + 4 = 12!",
        "Picture it as rows and columns.",
        "3 rows of 4 dots. Count them all: 12!",
        "Master your times tables and battles get easier!",
      ],
    },
  ],
  division: [
    {
      topic: "division",
      npcName: "MATH TUTOR",
      dialogues: [
        "Division means sharing equally!",
        "If you have 20 RARE CANDIES for 4 POKeMON...",
        "How many does each one get?",
        "20 / 4 = 5 candies each!",
        "Think: 4 times WHAT equals 20?",
        "4 x 5 = 20, so the answer is 5!",
        "Division and multiplication are partners!",
      ],
    },
  ],
  fractions: [
    {
      topic: "fractions",
      npcName: "MATH TUTOR",
      dialogues: [
        "Fractions are parts of a whole!",
        "If a CHANSEY egg breaks into 4 equal pieces...",
        "Each piece is 1/4 of the egg!",
        "The bottom number tells how many pieces total.",
        "The top number tells how many you have.",
        "2/4 means you have 2 out of 4 pieces!",
        "When adding fractions with the same bottom number, just add the tops!",
      ],
    },
  ],
  basicAlgebra: [
    {
      topic: "basicAlgebra",
      npcName: "MATH TUTOR",
      dialogues: [
        "Algebra is like solving a mystery!",
        "x + 3 = 7. What is x?",
        "Think: what number plus 3 gives 7?",
        "Cover up the x with your hand...",
        "? + 3 = 7... The answer is 4!",
        "You can also subtract 3 from both sides:",
        "x = 7 - 3 = 4. Same answer!",
      ],
    },
  ],
  percentages: [
    {
      topic: "percentages",
      npcName: "MATH TUTOR",
      dialogues: [
        "Percentages mean per hundred!",
        "50% means 50 out of 100, or half!",
        "If a POTION heals 50% of 80 HP...",
        "Half of 80 is 40! So it heals 40 HP.",
        "10% is easy: just move the decimal left!",
        "10% of 80 = 8. 20% = 16. 50% = 40!",
        "Build from 10% to find any percentage!",
      ],
    },
  ],
};

/**
 * Get a relevant math lesson based on the player's weakest area.
 */
export function getRecommendedLesson(
  masteryByType: Record<string, { correct: number; total: number }>
): MathLesson | null {
  let worstType: string | null = null;
  let worstAccuracy = 1.0;

  for (const [type, data] of Object.entries(masteryByType)) {
    if (data.total < 3) continue;
    const accuracy = data.correct / data.total;
    if (accuracy < worstAccuracy) {
      worstAccuracy = accuracy;
      worstType = type;
    }
  }

  if (!worstType) return null;

  // Map problem types to lesson topics
  const topicMap: Record<string, string> = {
    addition: "addition",
    subtraction: "subtraction",
    multiplication: "multiplication",
    division: "division",
    skipCounting: "multiplication",
    missingFactor: "multiplication",
    wordProblem: "multiplication",
    fractions: "fractions",
    decimals: "fractions",
    percentages: "percentages",
    basicAlgebra: "basicAlgebra",
    counting: "addition",
  };

  const topic = topicMap[worstType] || "multiplication";
  const lessons = MATH_TUTOR_LESSONS[topic];
  if (!lessons || lessons.length === 0) return null;

  return lessons[0];
}

/**
 * Sound effect names for math events.
 * These map to actual audio files that should be added to assets.
 * For now, we'll use existing sound events.
 */
export const MATH_SOUND_EVENTS = {
  correctAnswer: "correct",
  wrongAnswer: "wrong",
  streakMilestone: "levelup",
  streakShield: "shield",
  badgeEarned: "badge",
  blazingSpeed: "blazing",
  timerWarning: "warning",
} as const;
