import { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Arrow from "./Arrow";
import { MathEngine } from "../math/mathEngine";
import { MathProblem, ProblemType } from "../math/types";
import { GRADE_CONFIGS } from "../math/gradeConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  show: boolean;
  close: () => void;
  grade: number;
}

type Phase = "menu" | "problem" | "result";

// ---------------------------------------------------------------------------
// Display names for problem types
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  counting: "Counting",
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  skipCounting: "Skip Counting",
  missingFactor: "Missing Factor",
  fractions: "Fractions",
  decimals: "Decimals",
  percentages: "Percentages",
  wordProblem: "Word Problems",
  basicAlgebra: "Basic Algebra",
};

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: var(--bg, #f8f8f8);
  font-family: "PokemonGB", monospace;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  text-align: center;
  padding: 12px 0 8px;
  font-size: 2.5rem;
  border-bottom: 4px solid #333;

  @media (max-width: 1000px) {
    font-size: 0.9rem;
    padding: 6px 0 4px;
    border-bottom: 2px solid #333;
  }
`;

const SubHeader = styled.div`
  text-align: center;
  font-size: 1.8rem;
  padding: 6px 0;
  color: #555;

  @media (max-width: 1000px) {
    font-size: 0.65rem;
    padding: 3px 0;
  }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  overflow: hidden;

  @media (max-width: 1000px) {
    padding: 6px 8px;
  }
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuRow = styled.li`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 2.2rem;

  @media (max-width: 1000px) {
    font-size: 0.75rem;
    padding: 3px 6px;
  }
`;

const ArrowCol = styled.div`
  width: 28px;
  flex-shrink: 0;

  @media (max-width: 1000px) {
    width: 14px;
  }
`;

const CenterBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Question = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 1rem;
    margin-bottom: 10px;
  }
`;

const HintBox = styled.div`
  font-size: 1.8rem;
  margin-bottom: 16px;
  padding: 8px;
  border: 2px dashed #555;
  background: #fff;
  max-width: 90%;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.6rem;
    margin-bottom: 8px;
    padding: 4px;
    border: 1px dashed #555;
  }
`;

const ChoiceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  max-width: 400px;

  @media (max-width: 1000px) {
    max-width: 200px;
  }
`;

const ChoiceRow = styled.li`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 2.4rem;

  @media (max-width: 1000px) {
    font-size: 0.8rem;
    padding: 3px 6px;
  }
`;

const ResultBanner = styled.div<{ $correct: boolean }>`
  font-size: 2.8rem;
  color: ${(p) => (p.$correct ? "#080" : "#c00")};
  margin-bottom: 12px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
`;

const ExplanationBox = styled.div`
  font-size: 1.8rem;
  margin: 12px 0;
  padding: 10px;
  border: 3px solid #333;
  background: #fff;
  max-width: 90%;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.6rem;
    margin: 6px 0;
    padding: 5px;
    border: 2px solid #333;
  }
`;

const ResultText = styled.div`
  font-size: 2.2rem;
  margin-bottom: 8px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }
`;

const Footer = styled.div`
  text-align: center;
  padding: 8px 0;
  font-size: 1.6rem;
  border-top: 4px solid #333;
  color: #555;

  @media (max-width: 1000px) {
    font-size: 0.6rem;
    padding: 4px 0;
    border-top: 2px solid #333;
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildExplanation(problem: MathProblem): string {
  const { question, answer, type } = problem;
  switch (type) {
    case "addition":
      return `${question} = ${answer}. Add the numbers together!`;
    case "subtraction":
      return `${question} = ${answer}. Take the smaller from the bigger!`;
    case "multiplication":
      return `${question} = ${answer}. Multiply means repeated addition!`;
    case "division":
      return `${question} = ${answer}. Division splits into equal groups!`;
    case "fractions":
      return `${question} = ${answer}. Think about parts of a whole!`;
    case "decimals":
      return `${question} = ${answer}. Line up the decimal points!`;
    case "percentages":
      return `${question} = ${answer}. Percent means out of 100!`;
    case "basicAlgebra":
      return `${question} = ${answer}. Find the unknown value!`;
    default:
      return `${question} = ${answer}. Great practice!`;
  }
}

function buildVisualAid(problem: MathProblem): string | null {
  if (problem.type === "addition" || problem.type === "subtraction") {
    return problem.hint1;
  }
  if (problem.type === "multiplication") {
    return problem.hint1;
  }
  if (problem.type === "fractions") {
    return problem.hint1;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MathLab = ({ show, close, grade }: Props) => {
  const [phase, setPhase] = useState<Phase>("menu");
  const [menuIndex, setMenuIndex] = useState(0);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState("");
  const [lastCorrect, setLastCorrect] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [visualAid, setVisualAid] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ProblemType | null>(null);

  const engineRef = useRef<MathEngine | null>(null);

  // Get available types for the grade
  const config = GRADE_CONFIGS[grade] || GRADE_CONFIGS[3];
  const availableTypes = config.problemTypes;

  // Scrolling
  const MAX_VISIBLE = 7;
  const [scrollOffset, setScrollOffset] = useState(0);

  const generateNewProblem = useCallback(
    (type: ProblemType) => {
      if (!engineRef.current) {
        engineRef.current = new MathEngine(grade);
      }
      // Keep generating until we get the right type
      let problem: MathProblem;
      let attempts = 0;
      do {
        problem = engineRef.current.generateProblem("heal");
        attempts++;
      } while (problem.type !== type && attempts < 50);

      setCurrentProblem(problem);
      setChoiceIndex(0);
      setShowHint(false);
      setHintText("");
      setVisualAid(buildVisualAid(problem));
      setPhase("problem");
    },
    [grade]
  );

  // Keyboard: Up
  const handleUp = useCallback(() => {
    if (!show) return;
    if (phase === "menu") {
      if (menuIndex > 0) {
        setMenuIndex((prev) => prev - 1);
        if (menuIndex - scrollOffset === 0 && scrollOffset > 0) {
          setScrollOffset((prev) => prev - 1);
        }
      }
    } else if (phase === "problem" && currentProblem) {
      setChoiceIndex((prev) => Math.max(0, prev - 1));
    }
  }, [show, phase, menuIndex, scrollOffset, currentProblem]);

  // Keyboard: Down
  const handleDown = useCallback(() => {
    if (!show) return;
    if (phase === "menu") {
      if (menuIndex < availableTypes.length - 1) {
        setMenuIndex((prev) => prev + 1);
        if (menuIndex - scrollOffset >= MAX_VISIBLE - 1) {
          setScrollOffset((prev) => prev + 1);
        }
      }
    } else if (phase === "problem" && currentProblem) {
      setChoiceIndex((prev) =>
        Math.min(currentProblem.choices.length - 1, prev + 1)
      );
    }
  }, [show, phase, menuIndex, scrollOffset, availableTypes.length, currentProblem]);

  // Keyboard: A
  const handleA = useCallback(() => {
    if (!show) return;

    if (phase === "menu") {
      const type = availableTypes[menuIndex];
      setSelectedType(type);
      generateNewProblem(type);
    } else if (phase === "problem" && currentProblem && engineRef.current) {
      const chosen = currentProblem.choices[choiceIndex];
      const result = engineRef.current.recordAnswer(
        currentProblem.id,
        chosen,
        0 // untimed
      );
      setLastCorrect(result.correct);
      setExplanation(buildExplanation(currentProblem));
      setPhase("result");
    } else if (phase === "result" && selectedType) {
      generateNewProblem(selectedType);
    }
  }, [
    show,
    phase,
    menuIndex,
    availableTypes,
    currentProblem,
    choiceIndex,
    selectedType,
    generateNewProblem,
  ]);

  // Keyboard: B
  const handleB = useCallback(() => {
    if (!show) return;
    if (phase === "menu") {
      setMenuIndex(0);
      setScrollOffset(0);
      close();
    } else if (phase === "problem") {
      // Show hint on first B, go back on second
      if (!showHint && currentProblem && engineRef.current) {
        const hint = engineRef.current.getHint(currentProblem.id);
        setHintText(hint);
        setShowHint(true);
      } else {
        setPhase("menu");
        setShowHint(false);
      }
    } else if (phase === "result") {
      setPhase("menu");
    }
  }, [show, phase, showHint, currentProblem, close]);

  useEvent(Event.Up, handleUp);
  useEvent(Event.Down, handleDown);
  useEvent(Event.A, handleA);
  useEvent(Event.B, handleB);

  if (!show) return null;

  // Menu phase: pick a problem type
  if (phase === "menu") {
    const visible = availableTypes.slice(
      scrollOffset,
      scrollOffset + MAX_VISIBLE
    );

    return (
      <Overlay>
        <Header>PROF. OAK&apos;S MATH LAB</Header>
        <SubHeader>Pick a topic to practice!</SubHeader>
        <Body>
          <MenuList>
            {visible.map((type, i) => {
              const globalIndex = scrollOffset + i;
              return (
                <MenuRow key={type}>
                  <ArrowCol>
                    <Arrow show={globalIndex === menuIndex} menu />
                  </ArrowCol>
                  {TYPE_LABELS[type] || type}
                </MenuRow>
              );
            })}
          </MenuList>
        </Body>
        <Footer>A select | B close</Footer>
      </Overlay>
    );
  }

  // Problem phase
  if (phase === "problem" && currentProblem) {
    return (
      <Overlay>
        <Header>MATH LAB - {TYPE_LABELS[currentProblem.type] || currentProblem.type}</Header>
        <Body>
          <CenterBody>
            {visualAid && <HintBox>{visualAid}</HintBox>}
            <Question>{currentProblem.question}</Question>
            {showHint && <HintBox>Hint: {hintText}</HintBox>}
            <ChoiceList>
              {currentProblem.choices.map((choice, i) => (
                <ChoiceRow key={i}>
                  <ArrowCol>
                    <Arrow show={choiceIndex === i} menu />
                  </ArrowCol>
                  {choice}
                </ChoiceRow>
              ))}
            </ChoiceList>
          </CenterBody>
        </Body>
        <Footer>A answer | B hint/back</Footer>
      </Overlay>
    );
  }

  // Result phase
  if (phase === "result" && currentProblem) {
    return (
      <Overlay>
        <Header>MATH LAB</Header>
        <Body>
          <CenterBody>
            <ResultBanner $correct={lastCorrect}>
              {lastCorrect ? "CORRECT!" : "NOT QUITE!"}
            </ResultBanner>
            <ResultText>{currentProblem.question}</ResultText>
            <ExplanationBox>{explanation}</ExplanationBox>
            {!lastCorrect && (
              <ResultText>Answer: {currentProblem.answer}</ResultText>
            )}
          </CenterBody>
        </Body>
        <Footer>A next problem | B back to menu</Footer>
      </Overlay>
    );
  }

  return null;
};

export default MathLab;
