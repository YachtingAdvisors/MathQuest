import { useCallback, useState } from "react";
import styled from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Arrow from "./Arrow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MasteryEntry {
  correct: number;
  total: number;
}

interface Props {
  show: boolean;
  close: () => void;
  masteryData: Record<string, MasteryEntry>;
}

// ---------------------------------------------------------------------------
// Problem type display names & order
// ---------------------------------------------------------------------------

const PROBLEM_TYPES: { key: string; label: string }[] = [
  { key: "counting", label: "Counting" },
  { key: "addition", label: "Addition" },
  { key: "subtraction", label: "Subtraction" },
  { key: "multiplication", label: "Multiply" },
  { key: "division", label: "Division" },
  { key: "skipCounting", label: "Skip Count" },
  { key: "missingFactor", label: "Missing #" },
  { key: "fractions", label: "Fractions" },
  { key: "decimals", label: "Decimals" },
  { key: "percentages", label: "Percents" },
  { key: "wordProblem", label: "Word Prob" },
  { key: "basicAlgebra", label: "Algebra" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccuracy(entry: MasteryEntry | undefined): number {
  if (!entry || entry.total === 0) return 0;
  return Math.round((entry.correct / entry.total) * 100);
}

function getStars(accuracy: number): string {
  if (accuracy === 0) return "-----";
  if (accuracy < 30) return "*----";
  if (accuracy < 50) return "**---";
  if (accuracy < 70) return "***--";
  if (accuracy < 90) return "****-";
  return "*****";
}

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

const List = styled.ul`
  flex: 1;
  overflow: hidden;
  padding: 8px 0;
  list-style: none;
  margin: 0;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  padding: 6px 16px;
  font-size: 2rem;
  position: relative;

  @media (max-width: 1000px) {
    font-size: 0.75rem;
    padding: 3px 8px;
  }
`;

const ArrowCol = styled.div`
  width: 28px;
  flex-shrink: 0;

  @media (max-width: 1000px) {
    width: 14px;
  }
`;

const Label = styled.span`
  width: 180px;
  flex-shrink: 0;

  @media (max-width: 1000px) {
    width: 72px;
  }
`;

const Stars = styled.span`
  width: 120px;
  flex-shrink: 0;
  letter-spacing: 2px;

  @media (max-width: 1000px) {
    width: 48px;
    letter-spacing: 1px;
  }
`;

const Accuracy = styled.span`
  width: 80px;
  text-align: right;
  flex-shrink: 0;

  @media (max-width: 1000px) {
    width: 36px;
  }
`;

const Solved = styled.span`
  width: 60px;
  text-align: right;
  flex-shrink: 0;

  @media (max-width: 1000px) {
    width: 28px;
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

const MAX_VISIBLE = 8;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MathPokedex = ({ show, close, masteryData }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleUp = useCallback(() => {
    if (!show) return;
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      if (activeIndex - scrollOffset === 0 && scrollOffset > 0) {
        setScrollOffset((prev) => prev - 1);
      }
    }
  }, [show, activeIndex, scrollOffset]);

  const handleDown = useCallback(() => {
    if (!show) return;
    if (activeIndex < PROBLEM_TYPES.length - 1) {
      setActiveIndex((prev) => prev + 1);
      if (activeIndex - scrollOffset >= MAX_VISIBLE - 1) {
        setScrollOffset((prev) => prev + 1);
      }
    }
  }, [show, activeIndex, scrollOffset]);

  const handleClose = useCallback(() => {
    if (!show) return;
    setActiveIndex(0);
    setScrollOffset(0);
    close();
  }, [show, close]);

  useEvent(Event.Up, handleUp);
  useEvent(Event.Down, handleDown);
  useEvent(Event.B, handleClose);

  if (!show) return null;

  const visibleTypes = PROBLEM_TYPES.slice(
    scrollOffset,
    scrollOffset + MAX_VISIBLE
  );

  return (
    <Overlay>
      <Header>MATH POKEDEX</Header>
      <List>
        {visibleTypes.map((pt, i) => {
          const globalIndex = scrollOffset + i;
          const entry = masteryData[pt.key];
          const acc = getAccuracy(entry);
          const stars = getStars(acc);
          const total = entry ? entry.total : 0;

          return (
            <Row key={pt.key}>
              <ArrowCol>
                <Arrow show={globalIndex === activeIndex} menu />
              </ArrowCol>
              <Label>{pt.label}</Label>
              <Stars>{stars}</Stars>
              <Accuracy>{acc}%</Accuracy>
              <Solved>{total}</Solved>
            </Row>
          );
        })}
      </List>
      <Footer>UP/DOWN navigate | B close</Footer>
    </Overlay>
  );
};

export default MathPokedex;
