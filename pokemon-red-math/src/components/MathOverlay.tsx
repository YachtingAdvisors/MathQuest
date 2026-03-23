import styled, { keyframes } from "styled-components";
import { useSelector } from "react-redux";
import {
  selectCurrentProblem,
  selectProblemStartTime,
  selectShowingMathOverlay,
  selectShowingResult,
  selectLastMathResult,
} from "../state/mathSlice";
import { useState, useEffect } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Arrow from "./Arrow";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 200ms ease-out;
`;

const TopSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2vh 3vh;

  @media (max-width: 1000px) {
    padding: 5px 8px;
  }
`;

const Question = styled.div`
  font-family: "PokemonGB";
  font-size: 4vh;
  color: black;
  text-align: center;
  line-height: 1.6;
  max-width: 90%;

  @media (max-width: 1000px) {
    font-size: 9px;
    line-height: 1.4;
  }
`;

const TimerBar = styled.div`
  width: 80%;
  height: 2vh;
  background: #333;
  margin-top: 1.5vh;
  position: relative;
  border: 2px solid black;

  @media (max-width: 1000px) {
    height: 6px;
    margin-top: 4px;
  }
`;

const TimerFill = styled.div<{ $pct: number; $danger: boolean }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$danger ? "#d44" : p.$pct > 50 ? "#4a4" : "#da4")};
  transition: width 0.5s linear;
`;

const StreakText = styled.div<{ $active: boolean }>`
  font-family: "PokemonGB";
  font-size: 2.5vh;
  color: ${(p) => (p.$active ? "#d44" : "#666")};
  margin-top: 0.5vh;

  @media (max-width: 1000px) {
    font-size: 7px;
    margin-top: 2px;
  }
`;

const BottomSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1vh;
  padding: 2vh;

  @media (max-width: 1000px) {
    gap: 3px;
    padding: 5px;
  }
`;

const ChoiceButton = styled.button<{ $active: boolean; $correct?: boolean; $wrong?: boolean }>`
  font-family: "PokemonGB";
  font-size: 3.5vh;
  color: black;
  background: ${(p) =>
    p.$correct ? "#6d6" : p.$wrong ? "#d66" : p.$active ? "rgba(0,0,0,0.1)" : "var(--bg)"};
  border: 3px solid black;
  padding: 1.5vh 3vh;
  min-width: 40%;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;

  @media (max-width: 1000px) {
    font-size: 9px;
    padding: 4px 8px;
    border: 2px solid black;
  }
`;

const ArrowSlot = styled.div`
  width: 3vh;
  min-width: 15px;
  margin-right: 1vh;

  @media (max-width: 1000px) {
    width: 10px;
    margin-right: 3px;
  }
`;

const ResultOverlay = styled.div<{ $correct: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 210;
  background: ${(p) => (p.$correct ? "rgba(80,200,80,0.3)" : "rgba(200,80,80,0.3)")};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 150ms ease-out;
`;

const ResultText = styled.div`
  font-family: "PokemonGB";
  font-size: 3vh;
  color: black;
  text-align: center;
  padding: 2vh;
  max-width: 90%;
  line-height: 1.6;

  @media (max-width: 1000px) {
    font-size: 8px;
    padding: 5px;
  }
`;

const SpeedLabel = styled.div`
  font-family: "PokemonGB";
  font-size: 4vh;
  color: #d44;

  @media (max-width: 1000px) {
    font-size: 10px;
  }
`;

const HintButton = styled.button`
  font-family: "PokemonGB";
  font-size: 2vh;
  color: #666;
  background: transparent;
  border: 2px solid #999;
  padding: 0.5vh 2vh;
  margin-top: 1vh;
  cursor: pointer;

  @media (max-width: 1000px) {
    font-size: 6px;
    padding: 2px 6px;
    margin-top: 3px;
  }
`;

const HintText = styled.div`
  font-family: "PokemonGB";
  font-size: 2vh;
  color: #555;
  margin-top: 0.5vh;
  text-align: center;
  max-width: 85%;

  @media (max-width: 1000px) {
    font-size: 6px;
  }
`;

interface Props {
  streak: number;
  onAnswer: (choiceIndex: number) => void;
  onHint: () => string;
  onTimeout: () => void;
}

const MathOverlay = ({ streak, onAnswer, onHint, onTimeout }: Props) => {
  const problem = useSelector(selectCurrentProblem);
  const startTime = useSelector(selectProblemStartTime);
  const showing = useSelector(selectShowingMathOverlay);
  const showingResult = useSelector(selectShowingResult);
  const lastResult = useSelector(selectLastMathResult);

  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [hintText, setHintText] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset when new problem appears
  const problemId = problem?.id;
  useEffect(() => {
    if (problemId) {
      setActiveIndex(0);
      setHintText(null);
      setAnswered(false);
      setSelectedIndex(-1);
    }
  }, [problemId]);

  // Timer
  useEffect(() => {
    if (!problem || !showing || answered) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / (problem.timeLimit * 1000)) * 100);
      setTimeLeft(pct);

      if (pct <= 0) {
        clearInterval(interval);
        setAnswered(true);
        onTimeout();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [problem, showing, startTime, answered, onTimeout]);

  // Navigation
  useEvent(Event.Up, () => {
    if (!showing || answered || showingResult) return;
    setActiveIndex((prev) => {
      if (prev <= 1) return prev;
      return prev - 2;
    });
  });

  useEvent(Event.Down, () => {
    if (!showing || answered || showingResult) return;
    setActiveIndex((prev) => {
      if (!problem) return prev;
      if (prev >= problem.choices.length - 2) return prev;
      return prev + 2;
    });
  });

  useEvent(Event.Left, () => {
    if (!showing || answered || showingResult) return;
    setActiveIndex((prev) => {
      if (prev === 0 || prev === 2) return prev;
      return prev - 1;
    });
  });

  useEvent(Event.Right, () => {
    if (!showing || answered || showingResult) return;
    setActiveIndex((prev) => {
      if (!problem) return prev;
      if (prev === 1 || prev === 3) return prev;
      if (prev >= problem.choices.length - 1) return prev;
      return prev + 1;
    });
  });

  // Select answer
  useEvent(Event.A, () => {
    if (!showing || !problem) return;

    if (showingResult) return; // handled by parent

    if (!answered) {
      setAnswered(true);
      setSelectedIndex(activeIndex);
      onAnswer(activeIndex);
    }
  });

  // Hint on B
  useEvent(Event.B, () => {
    if (!showing || answered || showingResult || !problem) return;
    const hint = onHint();
    setHintText(hint);
  });

  if (!showing || !problem) return null;

  const correctIndex = problem.choices.indexOf(problem.answer);

  return (
    <Overlay>
      <TopSection>
        <Question>{problem.question}</Question>
        <TimerBar>
          <TimerFill $pct={timeLeft} $danger={timeLeft < 25} />
        </TimerBar>
        <StreakText $active={streak >= 3}>
          {streak >= 3 ? `Streak: ${streak}` : ""}
        </StreakText>
        {hintText && <HintText>{hintText}</HintText>}
        {!hintText && !answered && <HintButton>B = Hint</HintButton>}
      </TopSection>

      <BottomSection>
        {problem.choices.map((choice, index) => {
          const isCorrect = answered && index === correctIndex;
          const isWrong = answered && index === selectedIndex && selectedIndex !== correctIndex;
          return (
            <ChoiceButton
              key={index}
              $active={index === activeIndex && !answered}
              $correct={isCorrect}
              $wrong={isWrong}
            >
              <ArrowSlot>
                <Arrow menu show={index === activeIndex && !answered} />
              </ArrowSlot>
              {choice}
            </ChoiceButton>
          );
        })}
      </BottomSection>

      {showingResult && lastResult && (
        <ResultOverlay $correct={lastResult.correct}>
          {lastResult.speedLabel && <SpeedLabel>{lastResult.speedLabel}</SpeedLabel>}
          <ResultText>{lastResult.message}</ResultText>
        </ResultOverlay>
      )}
    </Overlay>
  );
};

export default MathOverlay;
