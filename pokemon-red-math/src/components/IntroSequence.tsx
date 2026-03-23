import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectPokemon,
  setName,
  setRivalName as setRivalNameAction,
  setMapWithPos,
} from "../state/gameSlice";
import {
  selectLoadMenu,
  selectTitleMenu,
  selectGameboyMenu,
} from "../state/uiSlice";
import PixelImage from "../styles/PixelImage";
import Arrow from "./Arrow";
import { GRADE_CONFIGS } from "../math/gradeConfig";
import { selectGrade as selectGradeAction } from "../state/mathSlice";
import { MapId } from "../maps/map-types";

import oakPortrait from "../assets/portraits/oak.png";

// ---------------------------------------------------------------------------
// Faithful Pokemon Red/Blue pre-game intro:
//   Oak speech → name player → name rival → grade select → sendoff
//   Then player is placed in Oak's Lab to pick their starter from the table.
// ---------------------------------------------------------------------------

enum Phase {
  OAK_WELCOME,
  OAK_NAME,
  OAK_POKEMON,
  OAK_PURPOSE,
  OAK_STUDY,
  OAK_ABOUT_YOU,
  PLAYER_NAME_ENTRY,
  PLAYER_CONFIRM,
  RIVAL_INTRO,
  RIVAL_WHAT_NAME,
  RIVAL_NAME_ENTRY,
  RIVAL_CONFIRM,
  GRADE_INTRO,
  GRADE_SELECT,
  GRADE_CONFIRM,
  SENDOFF_1,
  SENDOFF_2,
  DONE,
}

const PLAYER_PRESETS = ["RED", "ASH", "JACK"];
const RIVAL_PRESETS = ["BLUE", "GARY", "JOHN"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const COLS = 9;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const Overlay = styled.div`
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%; z-index: 998;
  background: var(--bg); display: flex; flex-direction: column;
  animation: ${fadeIn} 500ms ease-out;
`;
const TopArea = styled.div`
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 2vh; overflow-y: auto;
  @media (max-width: 1000px) { padding: 5px; }
`;
const OakImage = styled(PixelImage)`
  height: 28vh; margin-bottom: 1vh;
  @media (max-width: 1000px) { height: 55px; margin-bottom: 3px; }
`;
const TextBox = styled.div`
  width: 90%; min-height: 18%; background: var(--bg);
  border: 4px solid black; padding: 2vh;
  font-family: "PokemonGB"; font-size: 3vh; color: black;
  line-height: 1.8; position: relative;
  @media (max-width: 1000px) {
    font-size: 8px; padding: 5px; border: 2px solid black; line-height: 1.6;
  }
`;
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
`;
const ContinueHint = styled.div`
  position: absolute; bottom: 4px; right: 8px;
  font-size: 2.5vh; color: black;
  animation: ${bounce} 0.8s infinite;
  @media (max-width: 1000px) { font-size: 7px; }
`;

// Name entry
const NameEntryWrap = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 1.5vh;
  @media (max-width: 1000px) { gap: 4px; }
`;
const NameLabel = styled.div`
  font-family: "PokemonGB"; font-size: 3.5vh; color: black;
  @media (max-width: 1000px) { font-size: 9px; }
`;
const NameDisplay = styled.div`
  font-family: "PokemonGB"; font-size: 5vh; color: black;
  border-bottom: 3px solid black;
  min-width: 200px; text-align: center; min-height: 6vh; padding: 0.5vh 1vh;
  @media (max-width: 1000px) {
    font-size: 12px; min-width: 80px; min-height: 18px; border-bottom: 2px solid black;
  }
`;
const LetterGrid = styled.div`
  display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5vh; max-width: 80%;
  @media (max-width: 1000px) { gap: 1px; max-width: 95%; }
`;
const LetterBtn = styled.button<{ $active: boolean }>`
  font-family: "PokemonGB"; font-size: 3vh; color: black;
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.15)" : "transparent")};
  border: ${(p) => (p.$active ? "2px solid black" : "2px solid transparent")};
  width: 5vh; height: 5vh;
  display: flex; align-items: center; justify-content: center;
  @media (max-width: 1000px) { font-size: 8px; width: 14px; height: 14px; border-width: 1px; }
`;
const PresetRow = styled.div`
  display: flex; gap: 2vh; margin-top: 0.5vh;
  @media (max-width: 1000px) { gap: 5px; margin-top: 2px; }
`;
const PresetBtn = styled.button<{ $active: boolean }>`
  font-family: "PokemonGB"; font-size: 2.5vh; color: black;
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.15)" : "transparent")};
  border: 2px solid ${(p) => (p.$active ? "black" : "#999")};
  padding: 0.5vh 2vh;
  @media (max-width: 1000px) { font-size: 7px; padding: 2px 6px; border-width: 1px; }
`;
const HintText = styled.div`
  font-family: "PokemonGB"; font-size: 1.8vh; color: #888; margin-top: 0.3vh;
  @media (max-width: 1000px) { font-size: 5px; }
`;

// Grade select
const GradeGrid = styled.div`
  display: flex; flex-direction: column; width: 90%; max-width: 600px; overflow-y: auto;
`;
const GradeRow = styled.button<{ $active: boolean }>`
  display: flex; align-items: center; width: 100%; padding: 1vh 2vh;
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.1)" : "transparent")};
  border: none; cursor: pointer;
  @media (max-width: 1000px) { padding: 3px 6px; }
`;
const GradeArrowSlot = styled.div`
  width: 4vh; min-width: 20px; display: flex; align-items: center; justify-content: center;
`;
const GradeGradeLabel = styled.span`
  font-family: "PokemonGB"; font-size: 3vh; color: black; min-width: 160px;
  @media (max-width: 1000px) { font-size: 8px; min-width: 70px; }
`;
const GradeDesc = styled.span`
  font-family: "PokemonGB"; font-size: 2vh; color: #555; margin-left: 2vh;
  @media (max-width: 1000px) { font-size: 6px; margin-left: 5px; }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IntroSequence = () => {
  const dispatch = useDispatch();
  const titleOpen = useSelector(selectTitleMenu);
  const loadOpen = useSelector(selectLoadMenu);
  const gameboyOpen = useSelector(selectGameboyMenu);
  const pokemon = useSelector(selectPokemon);

  const [phase, setPhase] = useState(Phase.OAK_WELCOME);
  const [introDone, setIntroDone] = useState(false);

  const [playerName, setPlayerName] = useState("");
  const [rivalName, setRivalName] = useState("");
  const [letterIndex, setLetterIndex] = useState(0);
  const [onPresets, setOnPresets] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);
  const [gradeIndex, setGradeIndex] = useState(3);
  const grades = Object.entries(GRADE_CONFIGS);

  const isNamingRival = phase === Phase.RIVAL_NAME_ENTRY;
  const currentName = isNamingRival ? rivalName : playerName;
  const setCurrentName = isNamingRival ? setRivalName : setPlayerName;
  const currentPresets = isNamingRival ? RIVAL_PRESETS : PLAYER_PRESETS;

  // Show if: past title/load/gameboy, no pokemon yet, and not done
  const shouldShow =
    !titleOpen && !loadOpen && !gameboyOpen && pokemon.length === 0 && !introDone;

  const getText = (): string => {
    switch (phase) {
      case Phase.OAK_WELCOME: return "Hello there! Welcome to the world of POKeMON!";
      case Phase.OAK_NAME: return "My name is OAK! People call me the POKeMON PROF!";
      case Phase.OAK_POKEMON: return "This world is inhabited by creatures called POKeMON!";
      case Phase.OAK_PURPOSE: return "For some people, POKeMON are pets. Others use them for fights.";
      case Phase.OAK_STUDY: return "Myself... I study POKeMON as a profession.";
      case Phase.OAK_ABOUT_YOU: return "First, what is your name?";
      case Phase.PLAYER_CONFIRM: return `Right! So your name is ${playerName}!`;
      case Phase.RIVAL_INTRO: return "This is my grandson. He's been your rival since you were a baby.";
      case Phase.RIVAL_WHAT_NAME: return "...Erm, what is his name again?";
      case Phase.RIVAL_CONFIRM: return `That's right! I remember now! His name is ${rivalName}!`;
      case Phase.GRADE_INTRO: return `Now ${playerName}, one more thing. In this world, trainers sharpen their minds with math to make their POKeMON stronger. What level of math are you ready for?`;
      case Phase.GRADE_CONFIRM: {
        const g = GRADE_CONFIGS[Number(grades[gradeIndex][0])];
        return `${g.label}! ${g.description}. A fine challenge for a trainer!`;
      }
      case Phase.SENDOFF_1: return `${playerName}! Your very own POKeMON legend is about to unfold!`;
      case Phase.SENDOFF_2: return "A world of dreams and adventures with POKeMON awaits! Let's go!";
      default: return "";
    }
  };

  const advanceText = () => {
    const transitions: Partial<Record<Phase, Phase>> = {
      [Phase.OAK_WELCOME]: Phase.OAK_NAME,
      [Phase.OAK_NAME]: Phase.OAK_POKEMON,
      [Phase.OAK_POKEMON]: Phase.OAK_PURPOSE,
      [Phase.OAK_PURPOSE]: Phase.OAK_STUDY,
      [Phase.OAK_STUDY]: Phase.OAK_ABOUT_YOU,
      [Phase.OAK_ABOUT_YOU]: Phase.PLAYER_NAME_ENTRY,
      [Phase.PLAYER_CONFIRM]: Phase.RIVAL_INTRO,
      [Phase.RIVAL_INTRO]: Phase.RIVAL_WHAT_NAME,
      [Phase.RIVAL_WHAT_NAME]: Phase.RIVAL_NAME_ENTRY,
      [Phase.RIVAL_CONFIRM]: Phase.GRADE_INTRO,
      [Phase.GRADE_INTRO]: Phase.GRADE_SELECT,
      [Phase.GRADE_CONFIRM]: Phase.SENDOFF_1,
      [Phase.SENDOFF_1]: Phase.SENDOFF_2,
    };
    const next = transitions[phase];
    if (next !== undefined) {
      setPhase(next);
      if (next === Phase.PLAYER_NAME_ENTRY || next === Phase.RIVAL_NAME_ENTRY) {
        setLetterIndex(0);
        setOnPresets(false);
        setPresetIndex(0);
      }
    }
  };

  // Name entry
  const handleNameA = () => {
    if (onPresets) {
      setCurrentName(currentPresets[presetIndex]);
      setPhase(isNamingRival ? Phase.RIVAL_CONFIRM : Phase.PLAYER_CONFIRM);
      return;
    }
    if (currentName.length < 7) setCurrentName(currentName + LETTERS[letterIndex]);
  };
  const handleNameB = () => {
    if (currentName.length > 0) setCurrentName(currentName.slice(0, -1));
  };
  const handleNameDone = () => {
    if (currentName.length > 0)
      setPhase(isNamingRival ? Phase.RIVAL_CONFIRM : Phase.PLAYER_CONFIRM);
  };

  // Finish overlay → place player in Oak's Lab
  const finishOverlay = () => {
    dispatch(setName(playerName));
    dispatch(setRivalNameAction(rivalName) as any);
    dispatch(selectGradeAction(Number(grades[gradeIndex][0])));
    // Place player at the bottom of the lab — they walk up to the table
    dispatch(setMapWithPos({ map: MapId.PalletTownLab, pos: { x: 5, y: 8 } }));
    setIntroDone(true);
  };

  const totalLetters = LETTERS.length;
  const letterRow = Math.floor(letterIndex / COLS);
  const letterCol = letterIndex % COLS;
  const maxRow = Math.floor((totalLetters - 1) / COLS);

  // Keyboard
  useEvent(Event.A, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) { handleNameA(); return; }
    if (phase === Phase.GRADE_SELECT) { setPhase(Phase.GRADE_CONFIRM); return; }
    if (phase === Phase.SENDOFF_2) { finishOverlay(); return; }
    advanceText();
  });

  useEvent(Event.B, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) handleNameB();
    if (phase === Phase.GRADE_SELECT) setPhase(Phase.GRADE_INTRO);
    if (phase === Phase.GRADE_CONFIRM) setPhase(Phase.GRADE_SELECT);
  });

  useEvent(Event.Start, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) handleNameDone();
  });

  useEvent(Event.Up, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
      if (onPresets) { setOnPresets(false); return; }
      const newRow = Math.max(0, letterRow - 1);
      setLetterIndex(Math.min(newRow * COLS + letterCol, totalLetters - 1));
    }
    if (phase === Phase.GRADE_SELECT) setGradeIndex((p) => Math.max(0, p - 1));
  });

  useEvent(Event.Down, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
      if (letterRow >= maxRow) { setOnPresets(true); return; }
      const newRow = Math.min(maxRow, letterRow + 1);
      setLetterIndex(Math.min(newRow * COLS + letterCol, totalLetters - 1));
    }
    if (phase === Phase.GRADE_SELECT) setGradeIndex((p) => Math.min(grades.length - 1, p + 1));
  });

  useEvent(Event.Left, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
      if (onPresets) setPresetIndex(Math.max(0, presetIndex - 1));
      else setLetterIndex(Math.max(0, letterIndex - 1));
    }
  });

  useEvent(Event.Right, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
      if (onPresets) setPresetIndex(Math.min(currentPresets.length - 1, presetIndex + 1));
      else setLetterIndex(Math.min(totalLetters - 1, letterIndex + 1));
    }
  });

  if (!shouldShow) return null;

  // --- Name entry ---
  if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
    return (
      <Overlay>
        <TopArea>
          <OakImage src={oakPortrait} />
          <NameEntryWrap>
            <NameLabel>{isNamingRival ? "RIVAL'S NAME?" : "YOUR NAME?"}</NameLabel>
            <NameDisplay>{currentName}{"_".repeat(Math.max(0, 7 - currentName.length))}</NameDisplay>
            <LetterGrid>
              {LETTERS.map((letter, i) => (
                <LetterBtn key={letter} $active={!onPresets && letterIndex === i}>{letter}</LetterBtn>
              ))}
            </LetterGrid>
            <PresetRow>
              {currentPresets.map((name, i) => (
                <PresetBtn key={name} $active={onPresets && presetIndex === i}>{name}</PresetBtn>
              ))}
            </PresetRow>
            <HintText>ENTER=Type SHIFT=Delete SPACE=Done</HintText>
          </NameEntryWrap>
        </TopArea>
      </Overlay>
    );
  }

  // --- Grade select ---
  if (phase === Phase.GRADE_SELECT) {
    return (
      <Overlay>
        <TopArea>
          <OakImage src={oakPortrait} />
          <NameLabel style={{ marginBottom: "1vh" }}>What grade are you in?</NameLabel>
          <GradeGrid>
            {grades.map(([key, config], index) => (
              <GradeRow key={key} $active={index === gradeIndex}>
                <GradeArrowSlot><Arrow menu show={index === gradeIndex} /></GradeArrowSlot>
                <GradeGradeLabel>{config.label}</GradeGradeLabel>
                <GradeDesc>{config.description}</GradeDesc>
              </GradeRow>
            ))}
          </GradeGrid>
        </TopArea>
      </Overlay>
    );
  }

  // --- Dialogue ---
  return (
    <Overlay>
      <TopArea><OakImage src={oakPortrait} /></TopArea>
      <TextBox>
        {getText()}
        <ContinueHint>v</ContinueHint>
      </TextBox>
    </Overlay>
  );
};

export default IntroSequence;
