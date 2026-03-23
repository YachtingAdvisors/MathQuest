import styled, { keyframes } from "styled-components";
import { useSelector } from "react-redux";
import { selectRareCounter, selectRareEncounterReady } from "../state/mathSlice";
import { selectGradeSelected } from "../state/mathSlice";
import { selectPokemonEncounter } from "../state/gameSlice";

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const Bar = styled.div<{ $ready: boolean; $inBattle: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 90;
  background: ${(p) => (p.$ready ? "rgba(200, 160, 0, 0.95)" : "rgba(0, 0, 0, 0.7)")};
  display: ${(p) => (p.$inBattle ? "none" : "flex")};
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  gap: 8px;
  animation: ${(p) => (p.$ready ? pulse : "none")} 1s infinite;

  @media (max-width: 1000px) {
    padding: 2px 4px;
    gap: 4px;
  }
`;

const Label = styled.span`
  font-family: "PokemonGB";
  font-size: 1.8vh;
  color: #fff;
  white-space: nowrap;

  @media (max-width: 1000px) {
    font-size: 5px;
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  max-width: 200px;
  height: 1.2vh;
  background: #333;
  border: 1px solid #666;
  position: relative;
  overflow: hidden;

  @media (max-width: 1000px) {
    height: 4px;
    max-width: 80px;
  }
`;

const Fill = styled.div<{ $pct: number; $ready: boolean }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$ready ? "#ff0" : "#4a4")};
  transition: width 0.3s ease;
`;

const Count = styled.span<{ $ready: boolean }>`
  font-family: "PokemonGB";
  font-size: 1.8vh;
  color: ${(p) => (p.$ready ? "#fff" : "#aaa")};
  white-space: nowrap;
  min-width: 50px;
  text-align: right;

  @media (max-width: 1000px) {
    font-size: 5px;
    min-width: 25px;
  }
`;

const RareCounter = () => {
  const counter = useSelector(selectRareCounter);
  const ready = useSelector(selectRareEncounterReady);
  const gradeSelected = useSelector(selectGradeSelected);
  const inBattle = !!useSelector(selectPokemonEncounter);

  if (!gradeSelected) return null;

  const pct = (counter / 30) * 100;

  return (
    <Bar $ready={ready} $inBattle={inBattle}>
      <Label>{ready ? "RARE POKeMON!" : "Rare Encounter"}</Label>
      <ProgressBar>
        <Fill $pct={pct} $ready={ready} />
      </ProgressBar>
      <Count $ready={ready}>{counter}/30</Count>
    </Bar>
  );
};

export default RareCounter;
