import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Arrow from "./Arrow";
import { MathEngine } from "../math/mathEngine";
import { MathProblem } from "../math/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_PROBLEMS = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  show: boolean;
  close: () => void;
  grade: number;
}


type Phase = "intro" | "problem" | "result" | "summary";

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
  display: flex;
  justify-content: space-between;
  padding: 12px 16px 8px;
  font-size: 2rem;
  border-bottom: 4px solid #333;

  @media (max-width: 1000px) {
    font-size: 0.75rem;
    padding: 6px 8px 4px;
    border-bottom: 2px solid #333;
  }
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;

  @media (max-width: 1000px) {
    padding: 8px;
  }
`;

const Question = styled.div`
  font-size: 3rem;
  margin-bottom: 24px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 1rem;
    margin-bottom: 12px;
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
  position: relative;

  @media (max-width: 1000px) {
    font-size: 0.8rem;
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

const ResultText = styled.div`
  font-size: 2.2rem;
  margin-bottom: 8px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }
`;

const BigText = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 1rem;
    margin-bottom: 8px;
  }
`;

const SmallText = styled.div`
  font-size: 1.6rem;
  color: #555;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.6rem;
  }
`;

const CorrectBanner = styled.div`
  font-size: 2.8rem;
  color: #080;
  margin-bottom: 12px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
`;

const WrongBanner = styled.div`
  font-size: 2.8rem;
  color: #c00;
  margin-bottom: 12px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
`;

const Timer = styled.span``;

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

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DailyChallenge = ({ show, close, grade }: Props) => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [problemIndex, setProblemIndex] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [lastAnswer, setLastAnswer] = useState<number>(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const engineRef = useRef<MathEngine | null>(null);

  // Timer tick
  useEffect(() => {
    if (!show || phase !== "problem") return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [show, phase, startTime]);

  // Reset on show
  useEffect(() => {
    if (show) {
      setPhase("intro");
      setProblemIndex(0);
      setScore(0);
      setCorrect(0);
      setStreak(0);
      setBestStreak(0);
      setChoiceIndex(0);
      setLastCorrect(null);
      engineRef.current = new MathEngine(grade);
    }
  }, [show, grade]);

  const nextProblem = useCallback(() => {
    if (!engineRef.current) return;
    const problem = engineRef.current.generateProblem("attack");
    setCurrentProblem(problem);
    setChoiceIndex(0);
    setLastCorrect(null);
    setPhase("problem");
  }, []);

  // Start challenge
  const startChallenge = useCallback(() => {
    setStartTime(Date.now());
    setElapsed(0);
    setProblemIndex(0);
    nextProblem();
  }, [nextProblem]);

  // Submit answer
  const submitAnswer = useCallback(() => {
    if (!currentProblem || !engineRef.current) return;
    const chosen = currentProblem.choices[choiceIndex];
    const timeMs = Date.now() - startTime;
    const result = engineRef.current.recordAnswer(currentProblem.id, chosen, timeMs);

    setLastCorrect(result.correct);
    setLastAnswer(currentProblem.answer);

    if (result.correct) {
      setCorrect((prev) => prev + 1);
      setScore((prev) => prev + result.xpEarned);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setPhase("result");
  }, [currentProblem, choiceIndex, startTime]);

  // Advance from result to next problem or summary
  const advanceFromResult = useCallback(() => {
    const nextIdx = problemIndex + 1;
    if (nextIdx >= TOTAL_PROBLEMS) {
      setPhase("summary");
    } else {
      setProblemIndex(nextIdx);
      nextProblem();
    }
  }, [problemIndex, nextProblem]);

  // Keyboard handlers
  const handleUp = useCallback(() => {
    if (!show) return;
    if (phase === "problem") {
      setChoiceIndex((prev) => Math.max(0, prev - 1));
    }
  }, [show, phase]);

  const handleDown = useCallback(() => {
    if (!show) return;
    if (phase === "problem" && currentProblem) {
      setChoiceIndex((prev) =>
        Math.min(currentProblem.choices.length - 1, prev + 1)
      );
    }
  }, [show, phase, currentProblem]);

  const handleA = useCallback(() => {
    if (!show) return;
    if (phase === "intro") {
      startChallenge();
    } else if (phase === "problem") {
      submitAnswer();
    } else if (phase === "result") {
      advanceFromResult();
    } else if (phase === "summary") {
      close();
    }
  }, [show, phase, startChallenge, submitAnswer, advanceFromResult, close]);

  const handleB = useCallback(() => {
    if (!show) return;
    if (phase === "intro" || phase === "summary") {
      close();
    }
  }, [show, phase, close]);

  useEvent(Event.Up, handleUp);
  useEvent(Event.Down, handleDown);
  useEvent(Event.A, handleA);
  useEvent(Event.B, handleB);

  if (!show) return null;

  // Intro screen
  if (phase === "intro") {
    return (
      <Overlay>
        <Header>
          <span>DAILY CHALLENGE</span>
        </Header>
        <Body>
          <BigText>Ready for today&apos;s challenge?</BigText>
          <ResultText>{TOTAL_PROBLEMS} problems</ResultText>
          <ResultText>Beat your best score!</ResultText>
          <SmallText>A to start | B to exit</SmallText>
        </Body>
        <Footer>Press A to begin</Footer>
      </Overlay>
    );
  }

  // Problem screen
  if (phase === "problem" && currentProblem) {
    return (
      <Overlay>
        <Header>
          <span>
            {problemIndex + 1}/{TOTAL_PROBLEMS}
          </span>
          <span>Score: {score}</span>
          <Timer>{formatTime(elapsed)}</Timer>
        </Header>
        <Body>
          <Question>{currentProblem.question}</Question>
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
        </Body>
        <Footer>
          {streak >= 3 ? `Streak: ${streak}!` : "UP/DOWN select | A confirm"}
        </Footer>
      </Overlay>
    );
  }

  // Result screen (after each answer)
  if (phase === "result") {
    return (
      <Overlay>
        <Header>
          <span>
            {problemIndex + 1}/{TOTAL_PROBLEMS}
          </span>
          <span>Score: {score}</span>
          <Timer>{formatTime(elapsed)}</Timer>
        </Header>
        <Body>
          {lastCorrect ? (
            <CorrectBanner>CORRECT!</CorrectBanner>
          ) : (
            <>
              <WrongBanner>WRONG!</WrongBanner>
              <ResultText>Answer was: {lastAnswer}</ResultText>
            </>
          )}
          {streak >= 3 && <ResultText>Streak: {streak}!</ResultText>}
        </Body>
        <Footer>Press A to continue</Footer>
      </Overlay>
    );
  }

  // Summary screen
  if (phase === "summary") {
    const accuracy =
      TOTAL_PROBLEMS > 0
        ? Math.round((correct / TOTAL_PROBLEMS) * 100)
        : 0;

    return (
      <Overlay>
        <Header>
          <span>CHALLENGE COMPLETE!</span>
        </Header>
        <Body>
          <BigText>Final Score: {score}</BigText>
          <ResultText>
            Correct: {correct}/{TOTAL_PROBLEMS}
          </ResultText>
          <ResultText>Accuracy: {accuracy}%</ResultText>
          <ResultText>Best Streak: {bestStreak}</ResultText>
          <ResultText>Time: {formatTime(elapsed)}</ResultText>
          <SmallText>Press A or B to exit</SmallText>
        </Body>
        <Footer>Great job!</Footer>
      </Overlay>
    );
  }

  return null;
};

export default DailyChallenge;
