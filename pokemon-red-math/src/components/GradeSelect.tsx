import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { selectGrade, selectGradeSelected } from "../state/mathSlice";
import { selectLoadMenu, selectTitleMenu } from "../state/uiSlice";
import { GRADE_CONFIGS } from "../math/gradeConfig";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Arrow from "./Arrow";

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 999;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2%;
`;

const Title = styled.h1`
  font-family: "PokemonGB";
  font-size: 4vh;
  color: black;
  margin-bottom: 2vh;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 11px;
    margin-bottom: 5px;
  }
`;

const Subtitle = styled.p`
  font-family: "PokemonGB";
  font-size: 2.5vh;
  color: black;
  margin-bottom: 2vh;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 7px;
    margin-bottom: 4px;
  }
`;

const GradeGrid = styled.div`
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 600px;
  overflow-y: auto;
`;

const GradeRow = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1vh 2vh;
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.1)" : "transparent")};
  border: none;
  cursor: pointer;
  position: relative;

  @media (max-width: 1000px) {
    padding: 3px 6px;
  }
`;

const ArrowSlot = styled.div`
  width: 4vh;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GradeLabel = styled.span`
  font-family: "PokemonGB";
  font-size: 3vh;
  color: black;
  min-width: 160px;

  @media (max-width: 1000px) {
    font-size: 8px;
    min-width: 70px;
  }
`;

const GradeDesc = styled.span`
  font-family: "PokemonGB";
  font-size: 2vh;
  color: #555;
  margin-left: 2vh;

  @media (max-width: 1000px) {
    font-size: 6px;
    margin-left: 5px;
  }
`;

const GradeSelect = () => {
  const dispatch = useDispatch();
  const gradeSelected = useSelector(selectGradeSelected);
  const titleOpen = useSelector(selectTitleMenu);
  const loadOpen = useSelector(selectLoadMenu);
  const [activeIndex, setActiveIndex] = useState(3); // Default to 3rd grade

  const grades = Object.entries(GRADE_CONFIGS);

  useEvent(Event.Up, () => {
    if (gradeSelected || titleOpen || loadOpen) return;
    setActiveIndex((prev) => Math.max(0, prev - 1));
  });

  useEvent(Event.Down, () => {
    if (gradeSelected || titleOpen || loadOpen) return;
    setActiveIndex((prev) => Math.min(grades.length - 1, prev + 1));
  });

  useEvent(Event.A, () => {
    if (gradeSelected || titleOpen || loadOpen) return;
    dispatch(selectGrade(Number(grades[activeIndex][0])));
  });

  if (gradeSelected || titleOpen || loadOpen) return null;

  return (
    <Overlay>
      <Title>MathQuest</Title>
      <Subtitle>What grade are you in?</Subtitle>
      <GradeGrid>
        {grades.map(([key, config], index) => (
          <GradeRow key={key} $active={index === activeIndex}>
            <ArrowSlot>
              <Arrow menu show={index === activeIndex} />
            </ArrowSlot>
            <GradeLabel>{config.label}</GradeLabel>
            <GradeDesc>{config.description}</GradeDesc>
          </GradeRow>
        ))}
      </GradeGrid>
    </Overlay>
  );
};

export default GradeSelect;
