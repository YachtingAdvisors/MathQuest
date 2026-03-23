import { useCallback, useState } from "react";
import styled from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { GRADE_CONFIGS } from "../math/gradeConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EngineState = any;

interface Props {
  show: boolean;
  close: () => void;
  engineState: EngineState | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  counting: "Counting",
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiply",
  division: "Division",
  skipCounting: "Skip Count",
  missingFactor: "Missing #",
  fractions: "Fractions",
  decimals: "Decimals",
  percentages: "Percents",
  wordProblem: "Word Prob",
  basicAlgebra: "Algebra",
};

function makeBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return "[" + "=".repeat(filled) + "-".repeat(10 - filled) + "]";
}

function getRecommendation(
  mastery: Record<string, { correct: number; total: number }>
): string {
  let worstType = "";
  let worstAcc = 101;

  for (const [type, data] of Object.entries(mastery)) {
    if (data.total < 3) continue;
    const acc = Math.round((data.correct / data.total) * 100);
    if (acc < worstAcc) {
      worstAcc = acc;
      worstType = type;
    }
  }

  if (!worstType) return "Keep practicing to unlock insights!";
  const label = TYPE_LABELS[worstType] || worstType;
  return `Focus on ${label} - only ${worstAcc}% accuracy`;
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
  overflow: hidden;
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

const ScrollArea = styled.div`
  flex: 1;
  overflow: hidden;
  padding: 8px 16px;

  @media (max-width: 1000px) {
    padding: 4px 8px;
  }
`;

const Section = styled.div`
  margin-bottom: 10px;

  @media (max-width: 1000px) {
    margin-bottom: 4px;
  }
`;

const SectionTitle = styled.div`
  font-size: 2rem;
  margin-bottom: 4px;
  text-decoration: underline;

  @media (max-width: 1000px) {
    font-size: 0.7rem;
    margin-bottom: 2px;
  }
`;

const StatLine = styled.div`
  font-size: 1.8rem;
  line-height: 1.6;

  @media (max-width: 1000px) {
    font-size: 0.65rem;
    line-height: 1.4;
  }
`;

const BarLine = styled.div`
  font-size: 1.6rem;
  line-height: 1.5;
  white-space: pre;

  @media (max-width: 1000px) {
    font-size: 0.55rem;
    line-height: 1.3;
  }
`;

const NeedsWork = styled.span`
  color: #c00;
`;

const Recommendation = styled.div`
  font-size: 1.6rem;
  margin-top: 6px;
  padding: 6px;
  border: 2px solid #333;
  background: #fff;

  @media (max-width: 1000px) {
    font-size: 0.55rem;
    margin-top: 3px;
    padding: 3px;
    border: 1px solid #333;
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
// Component
// ---------------------------------------------------------------------------

const ParentDashboard = ({ show, close, engineState }: Props) => {
  const [scrollY, setScrollY] = useState(0);

  const handleClose = useCallback(() => {
    if (!show) return;
    setScrollY(0);
    close();
  }, [show, close]);

  const handleUp = useCallback(() => {
    if (!show) return;
    setScrollY((prev) => Math.max(0, prev - 1));
  }, [show]);

  const handleDown = useCallback(() => {
    if (!show) return;
    setScrollY((prev) => prev + 1);
  }, [show]);

  useEvent(Event.B, handleClose);
  useEvent(Event.Up, handleUp);
  useEvent(Event.Down, handleDown);

  if (!show || !engineState) return null;

  const { totalCorrect, totalAnswered, bestStreak, masteryByType, grade, difficulty } =
    engineState;

  const overallAcc =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const gradeLabel = GRADE_CONFIGS[grade]?.label || `Grade ${grade}`;

  // Build bar chart data
  const barData = Object.entries(masteryByType).map(([type, rawData]) => {
    const data = rawData as { correct: number; total: number };
    const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const label = (TYPE_LABELS[type] || type).padEnd(11);
    const bar = makeBar(acc);
    return { label, bar, acc, needsWork: acc < 50 && data.total >= 3 };
  });

  const recommendation = getRecommendation(masteryByType);

  // Scroll offset for the content sections
  const translateY = scrollY * -30;

  return (
    <Overlay>
      <Header>PARENT DASHBOARD</Header>
      <ScrollArea style={{ transform: `translateY(${translateY}px)` }}>
        <Section>
          <SectionTitle>OVERVIEW</SectionTitle>
          <StatLine>Accuracy: {overallAcc}%</StatLine>
          <StatLine>Total Solved: {totalAnswered}</StatLine>
          <StatLine>Best Streak: {bestStreak}</StatLine>
          <StatLine>Grade: {gradeLabel}</StatLine>
          <StatLine>Difficulty Tier: {difficulty}</StatLine>
        </Section>

        <Section>
          <SectionTitle>BY PROBLEM TYPE</SectionTitle>
          {barData.length === 0 && <StatLine>No data yet</StatLine>}
          {barData.map((d, i) => (
            <BarLine key={i}>
              {d.label} {d.bar} {d.acc}%
              {d.needsWork && <NeedsWork> &lt;-- Needs work!</NeedsWork>}
            </BarLine>
          ))}
        </Section>

        <Section>
          <SectionTitle>RECOMMENDATION</SectionTitle>
          <Recommendation>{recommendation}</Recommendation>
        </Section>
      </ScrollArea>
      <Footer>UP/DOWN scroll | B close</Footer>
    </Overlay>
  );
};

export default ParentDashboard;
