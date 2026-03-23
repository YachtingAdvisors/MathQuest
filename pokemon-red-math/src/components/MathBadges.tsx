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
// Badge definitions (modeled after the 8 Kanto gym badges)
// ---------------------------------------------------------------------------

interface BadgeDef {
  id: string;
  name: string;
  mathType: string;
  typeLabel: string;
  requiredAccuracy: number;
  requiredSolved: number;
}

const BADGES: BadgeDef[] = [
  {
    id: "boulder",
    name: "Boulder",
    mathType: "addition",
    typeLabel: "ADD",
    requiredAccuracy: 70,
    requiredSolved: 20,
  },
  {
    id: "cascade",
    name: "Cascade",
    mathType: "subtraction",
    typeLabel: "SUB",
    requiredAccuracy: 70,
    requiredSolved: 20,
  },
  {
    id: "thunder",
    name: "Thunder",
    mathType: "multiplication",
    typeLabel: "MULT",
    requiredAccuracy: 75,
    requiredSolved: 25,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    mathType: "division",
    typeLabel: "DIV",
    requiredAccuracy: 75,
    requiredSolved: 25,
  },
  {
    id: "soul",
    name: "Soul",
    mathType: "fractions",
    typeLabel: "FRAC",
    requiredAccuracy: 70,
    requiredSolved: 15,
  },
  {
    id: "marsh",
    name: "Marsh",
    mathType: "basicAlgebra",
    typeLabel: "ALGEBRA",
    requiredAccuracy: 70,
    requiredSolved: 15,
  },
  {
    id: "volcano",
    name: "Volcano",
    mathType: "percentages",
    typeLabel: "PCT",
    requiredAccuracy: 70,
    requiredSolved: 15,
  },
  {
    id: "earth",
    name: "Earth",
    mathType: "wordProblem",
    typeLabel: "WORD",
    requiredAccuracy: 70,
    requiredSolved: 15,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isBadgeEarned(badge: BadgeDef, mastery: MasteryEntry | undefined): boolean {
  if (!mastery || mastery.total === 0) return false;
  const accuracy = Math.round((mastery.correct / mastery.total) * 100);
  return accuracy >= badge.requiredAccuracy && mastery.total >= badge.requiredSolved;
}

function getBadgeProgress(
  badge: BadgeDef,
  mastery: MasteryEntry | undefined
): { accPct: number; solvedPct: number } {
  if (!mastery || mastery.total === 0) return { accPct: 0, solvedPct: 0 };
  const accuracy = Math.round((mastery.correct / mastery.total) * 100);
  const accPct = Math.min(100, Math.round((accuracy / badge.requiredAccuracy) * 100));
  const solvedPct = Math.min(
    100,
    Math.round((mastery.total / badge.requiredSolved) * 100)
  );
  return { accPct, solvedPct };
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

const BadgeGrid = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  padding: 16px;
  gap: 12px;

  @media (max-width: 1000px) {
    padding: 8px;
    gap: 6px;
  }
`;

const BadgeSlot = styled.div<{ $earned: boolean; $selected: boolean }>`
  width: 140px;
  height: 100px;
  border: 3px solid ${(p) => (p.$selected ? "#333" : p.$earned ? "#333" : "#bbb")};
  border-radius: 8px;
  background: ${(p) => (p.$earned ? "#fff" : "#ddd")};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: ${(p) => (p.$earned ? 1 : 0.5)};
  position: relative;

  @media (max-width: 1000px) {
    width: 64px;
    height: 48px;
    border: 2px solid ${(p) => (p.$selected ? "#333" : p.$earned ? "#333" : "#bbb")};
    border-radius: 4px;
  }
`;

const BadgeName = styled.div`
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 2px;

  @media (max-width: 1000px) {
    font-size: 0.5rem;
  }
`;

const BadgeType = styled.div`
  font-size: 1.4rem;
  color: #555;

  @media (max-width: 1000px) {
    font-size: 0.45rem;
  }
`;

const SelectedArrow = styled.div`
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);

  @media (max-width: 1000px) {
    top: -10px;
  }
`;

const DetailPanel = styled.div`
  padding: 12px 16px;
  border-top: 4px solid #333;
  min-height: 80px;

  @media (max-width: 1000px) {
    padding: 6px 8px;
    border-top: 2px solid #333;
    min-height: 40px;
  }
`;

const DetailLine = styled.div`
  font-size: 1.8rem;
  line-height: 1.5;

  @media (max-width: 1000px) {
    font-size: 0.6rem;
    line-height: 1.3;
  }
`;

const ProgressBar = styled.div`
  font-size: 1.6rem;
  white-space: pre;

  @media (max-width: 1000px) {
    font-size: 0.55rem;
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
// Helpers for progress bar
// ---------------------------------------------------------------------------

function makeBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return "[" + "=".repeat(filled) + "-".repeat(10 - filled) + "]";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MathBadges = ({ show, close, masteryData }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleLeft = useCallback(() => {
    if (!show) return;
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, [show]);

  const handleRight = useCallback(() => {
    if (!show) return;
    setSelectedIndex((prev) => Math.min(BADGES.length - 1, prev + 1));
  }, [show]);

  const handleUp = useCallback(() => {
    if (!show) return;
    // Move up a row (3 per row)
    setSelectedIndex((prev) => Math.max(0, prev - 3));
  }, [show]);

  const handleDown = useCallback(() => {
    if (!show) return;
    setSelectedIndex((prev) => Math.min(BADGES.length - 1, prev + 3));
  }, [show]);

  const handleClose = useCallback(() => {
    if (!show) return;
    setSelectedIndex(0);
    close();
  }, [show, close]);

  useEvent(Event.Left, handleLeft);
  useEvent(Event.Right, handleRight);
  useEvent(Event.Up, handleUp);
  useEvent(Event.Down, handleDown);
  useEvent(Event.B, handleClose);

  if (!show) return null;

  const selected = BADGES[selectedIndex];
  const selectedMastery = masteryData[selected.mathType];
  const earned = isBadgeEarned(selected, selectedMastery);
  const progress = getBadgeProgress(selected, selectedMastery);

  const totalEarned = BADGES.filter((b) =>
    isBadgeEarned(b, masteryData[b.mathType])
  ).length;

  return (
    <Overlay>
      <Header>MATH BADGES ({totalEarned}/{BADGES.length})</Header>
      <BadgeGrid>
        {BADGES.map((badge, i) => {
          const mastery = masteryData[badge.mathType];
          const badgeEarned = isBadgeEarned(badge, mastery);

          return (
            <BadgeSlot
              key={badge.id}
              $earned={badgeEarned}
              $selected={i === selectedIndex}
            >
              {i === selectedIndex && (
                <SelectedArrow>
                  <Arrow show menu />
                </SelectedArrow>
              )}
              <BadgeName>{badgeEarned ? badge.name : "???"}</BadgeName>
              <BadgeType>{badge.typeLabel}</BadgeType>
            </BadgeSlot>
          );
        })}
      </BadgeGrid>

      <DetailPanel>
        <DetailLine>
          {selected.name} Badge - {selected.typeLabel}
        </DetailLine>
        {earned ? (
          <DetailLine>EARNED! Mastered {selected.typeLabel}!</DetailLine>
        ) : (
          <>
            <DetailLine>
              Need: {selected.requiredAccuracy}% accuracy,{" "}
              {selected.requiredSolved} solved
            </DetailLine>
            <ProgressBar>
              Accuracy: {makeBar(progress.accPct)} {progress.accPct}%
            </ProgressBar>
            <ProgressBar>
              Solved:   {makeBar(progress.solvedPct)} {progress.solvedPct}%
            </ProgressBar>
          </>
        )}
      </DetailPanel>

      <Footer>D-pad navigate | B close</Footer>
    </Overlay>
  );
};

export default MathBadges;
