import { useCallback, useState } from "react";
import styled from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";

// ---------------------------------------------------------------------------
// NOTE: To integrate with Redux, add a `speed` field to gameSlice and replace
// the useState below with useSelector/useDispatch:
//
//   import { useDispatch, useSelector } from "react-redux";
//   const speed = useSelector(selectSpeed);
//   dispatch(setSpeed(newSpeed));
//
// For now this uses local state so it works out of the box.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Pill = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 150;
  background: var(--bg, #f8f8f8);
  border: 3px solid #333;
  border-radius: 20px;
  padding: 4px 14px;
  font-family: "PokemonGB", monospace;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;

  @media (max-width: 1000px) {
    font-size: 0.6rem;
    padding: 2px 8px;
    gap: 4px;
    border: 2px solid #333;
    border-radius: 12px;
    top: 4px;
    right: 4px;
  }
`;

const SpeedLabel = styled.span<{ $active: boolean }>`
  color: ${(p) => (p.$active ? "#333" : "#bbb")};
  font-weight: ${(p) => (p.$active ? "bold" : "normal")};
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SPEEDS = [1, 2, 3, 4, 5];

const SpeedControl = () => {
  const [speed, setSpeed] = useState(1);

  const handleLeft = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      return idx > 0 ? SPEEDS[idx - 1] : prev;
    });
  }, []);

  const handleRight = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      return idx < SPEEDS.length - 1 ? SPEEDS[idx + 1] : prev;
    });
  }, []);

  useEvent(Event.Left, handleLeft);
  useEvent(Event.Right, handleRight);

  return (
    <Pill>
      {SPEEDS.map((s, i) => (
        <span key={s}>
          <SpeedLabel $active={s === speed}>{s}x</SpeedLabel>
          {i < SPEEDS.length - 1 && " "}
        </span>
      ))}
    </Pill>
  );
};

export default SpeedControl;
