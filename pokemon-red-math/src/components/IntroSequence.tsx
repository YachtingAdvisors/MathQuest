import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectPokemon,
  setName,
  setStarterPokemon,
  setRivalName as setRivalNameAction,
  setMapWithPos,
} from "../state/gameSlice";
import {
  selectLoadMenu,
  selectTitleMenu,
  selectGameboyMenu,
} from "../state/uiSlice";
// mathSlice selectGrade action imported below
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import PixelImage from "../styles/PixelImage";
import Arrow from "./Arrow";
import { GRADE_CONFIGS } from "../math/gradeConfig";
import { selectGrade as selectGradeAction } from "../state/mathSlice";
import { MapId } from "../maps/map-types";

import oakPortrait from "../assets/portraits/oak.png";

// ---------------------------------------------------------------------------
// The actual Pokemon Red/Blue intro sequence:
//
// 1. Black screen → Prof. Oak appears with a Nidorino
// 2. "Hello there! Welcome to the world of POKeMON!"
// 3. "My name is OAK! People call me the POKeMON PROF!"
// 4. Shows a Pokemon: "This world is inhabited by creatures called POKeMON!"
// 5. "For some people, POKeMON are pets. Others use them for fights."
// 6. "Myself... I study POKeMON as a profession."
// 7. Shows player sprite: "First, what is your name?"
// 8. Name entry screen (NEW NAME or presets: RED, ASH, JACK)
// 9. Shows rival sprite: "This is my grandson. He's been your rival since
//    you were a baby. ...Erm, what is his name again?"
// 10. Rival name entry (NEW NAME or presets: BLUE, GARY, JOHN)
// 11. "Right! So his name is <RIVAL>!"
// 12. Shows player again: "<PLAYER>! Your very own POKeMON legend is about
//     to unfold! A world of dreams and adventures with POKeMON awaits!
//     Let's go!"
// 13. Screen shrinks player sprite → fade to black → game starts
//
// After this overlay, the player wakes up in their room in Pallet Town.
// They walk downstairs, Mom says goodbye, they walk outside, try to leave
// town via Route 1, Oak stops them ("It's dangerous to go alone!"), and
// leads them to the lab.
//
// In the lab:
// - Oak stands behind his desk with 3 Pokeballs
// - "There are 3 POKeMON here! ...Choose!"
// - Player picks one (Bulbasaur / Charmander / Squirtle)
// - Rival takes the type-advantaged one
// - Rival challenges you to a battle
// - After battle, Oak gives you the Pokedex
//
// For MathQuest, we add grade selection after the name/rival naming,
// integrated as Oak asking about your math readiness. Then we drop
// the player directly into the lab to keep it authentic.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Phase enum — faithful to the original game's intro flow
// ---------------------------------------------------------------------------

enum Phase {
  // Oak's pre-game monologue
  OAK_WELCOME,         // "Hello there! Welcome to the world of POKeMON!"
  OAK_NAME,            // "My name is OAK! People call me the POKeMON PROF!"
  OAK_POKEMON,         // "This world is inhabited by creatures called POKeMON!"
  OAK_PURPOSE,         // "For some people, POKeMON are pets. Others use them for fights."
  OAK_STUDY,           // "Myself... I study POKeMON as a profession."
  OAK_ABOUT_YOU,       // "First, what is your name?"

  // Player naming
  PLAYER_NAME_ENTRY,

  // Confirm player name
  PLAYER_CONFIRM,      // "Right! So your name is <NAME>!"

  // Rival introduction
  RIVAL_INTRO,         // "This is my grandson. He's been your rival since you were a baby."
  RIVAL_WHAT_NAME,     // "...Erm, what is his name again?"

  // Rival naming
  RIVAL_NAME_ENTRY,

  // Confirm rival name
  RIVAL_CONFIRM,       // "That's right! I remember now! His name is <RIVAL>!"

  // MathQuest addition: grade selection
  GRADE_INTRO,         // "In this world, trainers sharpen their minds..."
  GRADE_SELECT,
  GRADE_CONFIRM,

  // Send-off
  SENDOFF_1,           // "<PLAYER>! Your very own POKeMON legend is about to unfold!"
  SENDOFF_2,           // "A world of dreams and adventures with POKeMON awaits! Let's go!"

  // Lab scene — starter selection
  LAB_INTRO,           // "OAK: There are 3 POKeMON here!"
  LAB_CHOOSE,          // "OAK: They're inside the POKe BALLS. When I was young..."
  STARTER_SELECT,      // Player picks
  STARTER_CONFIRM_ASK, // "So! You want <POKEMON>?"
  RIVAL_JEALOUS,       // "RIVAL: Hey! I was here first! Gramps, what about me?"
  OAK_RIVAL_PICK,      // "OAK: Be patient! <RIVAL>, you can have one too!"
  RIVAL_PICKS,         // "<RIVAL> picked <POKEMON>!"
  RIVAL_CHALLENGE_1,   // "<RIVAL>: My POKeMON looks a lot stronger than yours!"
  RIVAL_CHALLENGE_2,   // "<RIVAL>: Let's check it out in a battle!"

  // Done — launches rival battle, then game continues
  DONE,
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

interface Starter {
  id: number;
  name: string;
  type: string;
  description: string;
  rivalCounterId: number; // What the rival picks if you choose this
}

const STARTERS: Starter[] = [
  {
    id: 1, name: "BULBASAUR", type: "GRASS",
    description: "A strange seed was planted on its back at birth. The plant sprouts and grows with this POKeMON.",
    rivalCounterId: 4, // Rival picks Charmander
  },
  {
    id: 4, name: "CHARMANDER", type: "FIRE",
    description: "Obviously prefers hot places. When it rains, steam is said to spout from the tip of its tail.",
    rivalCounterId: 7, // Rival picks Squirtle
  },
  {
    id: 7, name: "SQUIRTLE", type: "WATER",
    description: "After birth, its back swells and hardens into a shell. Powerfully sprays foam from its mouth.",
    rivalCounterId: 1, // Rival picks Bulbasaur
  },
];

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
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 998;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 500ms ease-out;
`;

const TopArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2vh;
  overflow-y: auto;
  @media (max-width: 1000px) { padding: 5px; }
`;

const OakImage = styled(PixelImage)`
  height: 28vh;
  margin-bottom: 1vh;
  @media (max-width: 1000px) { height: 55px; margin-bottom: 3px; }
`;

const TextBox = styled.div`
  width: 90%;
  min-height: 18%;
  background: var(--bg);
  border: 4px solid black;
  padding: 2vh;
  font-family: "PokemonGB";
  font-size: 3vh;
  color: black;
  line-height: 1.8;
  position: relative;
  @media (max-width: 1000px) {
    font-size: 8px; padding: 5px; border: 2px solid black; line-height: 1.6;
  }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
`;

const ContinueHint = styled.div`
  position: absolute;
  bottom: 4px; right: 8px;
  font-size: 2.5vh; color: black;
  animation: ${bounce} 0.8s infinite;
  @media (max-width: 1000px) { font-size: 7px; }
`;

// Name entry styles
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

// Starter select styles
const StarterContainer = styled.div`
  display: flex; justify-content: center; gap: 3vh; width: 100%; padding: 0 2vh;
  @media (max-width: 1000px) { gap: 8px; padding: 0 4px; }
`;
const StarterCard = styled.div<{ $active: boolean }>`
  display: flex; flex-direction: column; align-items: center; padding: 1.5vh;
  border: 3px solid ${(p) => (p.$active ? "black" : "transparent")};
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.08)" : "transparent")};
  flex: 1; max-width: 33%;
  @media (max-width: 1000px) { padding: 3px; border-width: 2px; }
`;
const StarterImage = styled(PixelImage)`
  height: 15vh; margin-bottom: 0.5vh;
  @media (max-width: 1000px) { height: 35px; margin-bottom: 2px; }
`;
const StarterName = styled.div`
  font-family: "PokemonGB"; font-size: 2.5vh; color: black; text-align: center;
  @media (max-width: 1000px) { font-size: 7px; }
`;
const StarterType = styled.div`
  font-family: "PokemonGB"; font-size: 2vh; color: #555; text-align: center;
  @media (max-width: 1000px) { font-size: 5px; }
`;
const ArrowSlot = styled.div`
  height: 2vh; margin-bottom: 0.5vh;
  @media (max-width: 1000px) { height: 8px; margin-bottom: 1px; }
`;

// Grade select styles
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

  // Name entry
  const [playerName, setPlayerName] = useState("");
  const [rivalName, setRivalName] = useState("");
  const [letterIndex, setLetterIndex] = useState(0);
  const [onPresets, setOnPresets] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);

  // Starter & grade
  const [starterIndex, setStarterIndex] = useState(1);
  const [gradeIndex, setGradeIndex] = useState(3);
  const grades = Object.entries(GRADE_CONFIGS);

  // Which name are we editing?
  const isNamingRival = phase === Phase.RIVAL_NAME_ENTRY;
  const currentName = isNamingRival ? rivalName : playerName;
  const setCurrentName = isNamingRival ? setRivalName : setPlayerName;
  const currentPresets = isNamingRival ? RIVAL_PRESETS : PLAYER_PRESETS;

  const shouldShow =
    !titleOpen && !loadOpen && !gameboyOpen && pokemon.length === 0 && !introDone;

  // --- Dialogue text for each phase ---
  const getText = (): string => {
    switch (phase) {
      case Phase.OAK_WELCOME:
        return "Hello there! Welcome to the world of POKeMON!";
      case Phase.OAK_NAME:
        return "My name is OAK! People call me the POKeMON PROF!";
      case Phase.OAK_POKEMON:
        return "This world is inhabited by creatures called POKeMON!";
      case Phase.OAK_PURPOSE:
        return "For some people, POKeMON are pets. Others use them for fights.";
      case Phase.OAK_STUDY:
        return "Myself... I study POKeMON as a profession.";
      case Phase.OAK_ABOUT_YOU:
        return "First, what is your name?";
      case Phase.PLAYER_CONFIRM:
        return `Right! So your name is ${playerName}!`;
      case Phase.RIVAL_INTRO:
        return "This is my grandson. He's been your rival since you were a baby.";
      case Phase.RIVAL_WHAT_NAME:
        return "...Erm, what is his name again?";
      case Phase.RIVAL_CONFIRM:
        return `That's right! I remember now! His name is ${rivalName}!`;
      case Phase.GRADE_INTRO:
        return `Now ${playerName}, one more thing. In this world, trainers sharpen their minds with math to make their POKeMON stronger. What level of math are you ready for?`;
      case Phase.GRADE_CONFIRM: {
        const g = GRADE_CONFIGS[Number(grades[gradeIndex][0])];
        return `${g.label}! ${g.description}. A fine challenge for a trainer!`;
      }
      case Phase.SENDOFF_1:
        return `${playerName}! Your very own POKeMON legend is about to unfold!`;
      case Phase.SENDOFF_2:
        return "A world of dreams and adventures with POKeMON awaits! Let's go!";

      // Lab scene
      case Phase.LAB_INTRO:
        return `OAK: Ah, ${playerName}! There are 3 POKeMON here!`;
      case Phase.LAB_CHOOSE:
        return "OAK: They are inside the POKe BALLS. When I was young, I was a serious POKeMON trainer! In my old age, I have only 3 left, but you can have one! Choose!";
      case Phase.STARTER_CONFIRM_ASK: {
        const s = STARTERS[starterIndex];
        return `OAK: So! You want ${s.name}, the ${s.type}-type POKeMON?`;
      }
      case Phase.RIVAL_JEALOUS:
        return `${rivalName}: Hey! I was here first! Gramps, what about me?`;
      case Phase.OAK_RIVAL_PICK:
        return `OAK: Be patient, ${rivalName}! You can have one too!`;
      case Phase.RIVAL_PICKS: {
        const rivalPoke = STARTERS[starterIndex].rivalCounterId;
        const rivalMeta = getPokemonMetadata(rivalPoke);
        return `${rivalName} picked up ${rivalMeta.name.toUpperCase()}!`;
      }
      case Phase.RIVAL_CHALLENGE_1:
        return `${rivalName}: My POKeMON looks a lot stronger than yours!`;
      case Phase.RIVAL_CHALLENGE_2:
        return `${rivalName}: I'll take you on, ${playerName}!`;
      default:
        return "";
    }
  };

  // --- Phase transitions ---
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
      [Phase.SENDOFF_2]: Phase.LAB_INTRO,
      [Phase.LAB_INTRO]: Phase.LAB_CHOOSE,
      [Phase.LAB_CHOOSE]: Phase.STARTER_SELECT,
      [Phase.STARTER_CONFIRM_ASK]: Phase.RIVAL_JEALOUS,
      [Phase.RIVAL_JEALOUS]: Phase.OAK_RIVAL_PICK,
      [Phase.OAK_RIVAL_PICK]: Phase.RIVAL_PICKS,
      [Phase.RIVAL_PICKS]: Phase.RIVAL_CHALLENGE_1,
      [Phase.RIVAL_CHALLENGE_1]: Phase.RIVAL_CHALLENGE_2,
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

  // --- Name entry helpers ---
  const handleNameA = () => {
    if (onPresets) {
      setCurrentName(currentPresets[presetIndex]);
      setPhase(isNamingRival ? Phase.RIVAL_CONFIRM : Phase.PLAYER_CONFIRM);
      return;
    }
    if (currentName.length < 7) {
      setCurrentName(currentName + LETTERS[letterIndex]);
    }
  };
  const handleNameB = () => {
    if (currentName.length > 0) setCurrentName(currentName.slice(0, -1));
  };
  const handleNameDone = () => {
    if (currentName.length > 0)
      setPhase(isNamingRival ? Phase.RIVAL_CONFIRM : Phase.PLAYER_CONFIRM);
  };

  // --- Confirm starter & launch rival battle ---
  const confirmStarter = () => {
    const starter = STARTERS[starterIndex];
    const meta = getPokemonMetadata(starter.id);
    const stats = getPokemonStats(starter.id, 5);

    // Set player data
    dispatch(setName(playerName));
    dispatch(setRivalNameAction(rivalName) as any);
    dispatch(selectGradeAction(Number(grades[gradeIndex][0])));
    dispatch(
      setStarterPokemon({
        id: starter.id,
        level: 5,
        xp: 0,
        hp: stats.hp,
        moves: meta.moves
          .filter((m: any) => m.levelLearnedAt <= 5)
          .slice(0, 2)
          .map((m: any) => ({ id: m.name, pp: 35 })),
      })
    );

    // Place player inside the lab
    dispatch(setMapWithPos({ map: MapId.PalletTownLab, pos: { x: 4, y: 4 } }));

    setIntroDone(true);
  };

  // Letter grid helpers
  const totalLetters = LETTERS.length;
  const letterRow = Math.floor(letterIndex / COLS);
  const letterCol = letterIndex % COLS;
  const maxRow = Math.floor((totalLetters - 1) / COLS);

  // --- Keyboard handlers ---
  useEvent(Event.A, () => {
    if (!shouldShow) return;

    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
      handleNameA(); return;
    }
    if (phase === Phase.GRADE_SELECT) {
      setPhase(Phase.GRADE_CONFIRM); return;
    }
    if (phase === Phase.STARTER_SELECT) {
      setPhase(Phase.STARTER_CONFIRM_ASK); return;
    }
    if (phase === Phase.STARTER_CONFIRM_ASK) {
      // Move to rival reaction
      advanceText(); return;
    }
    if (phase === Phase.RIVAL_CHALLENGE_2) {
      confirmStarter(); return;
    }
    advanceText();
  });

  useEvent(Event.B, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) handleNameB();
    if (phase === Phase.STARTER_SELECT) setPhase(Phase.LAB_CHOOSE);
    if (phase === Phase.STARTER_CONFIRM_ASK) setPhase(Phase.STARTER_SELECT);
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
    if (phase === Phase.STARTER_SELECT) setStarterIndex(Math.max(0, starterIndex - 1));
  });

  useEvent(Event.Right, () => {
    if (!shouldShow) return;
    if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
      if (onPresets) setPresetIndex(Math.min(currentPresets.length - 1, presetIndex + 1));
      else setLetterIndex(Math.min(totalLetters - 1, letterIndex + 1));
    }
    if (phase === Phase.STARTER_SELECT) setStarterIndex(Math.min(STARTERS.length - 1, starterIndex + 1));
  });

  if (!shouldShow) return null;

  // =========================================================================
  // RENDER: Name entry
  // =========================================================================
  if (phase === Phase.PLAYER_NAME_ENTRY || phase === Phase.RIVAL_NAME_ENTRY) {
    const label = isNamingRival ? "RIVAL'S NAME?" : "YOUR NAME?";
    return (
      <Overlay>
        <TopArea>
          <OakImage src={oakPortrait} />
          <NameEntryWrap>
            <NameLabel>{label}</NameLabel>
            <NameDisplay>
              {currentName}{"_".repeat(Math.max(0, 7 - currentName.length))}
            </NameDisplay>
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

  // =========================================================================
  // RENDER: Grade select
  // =========================================================================
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

  // =========================================================================
  // RENDER: Starter select
  // =========================================================================
  if (phase === Phase.STARTER_SELECT) {
    return (
      <Overlay>
        <TopArea style={{ justifyContent: "flex-start", paddingTop: "3vh" }}>
          <TextBox style={{ marginBottom: "2vh" }}>OAK: Choose a POKeMON!</TextBox>
          <StarterContainer>
            {STARTERS.map((starter, i) => {
              const meta = getPokemonMetadata(starter.id);
              return (
                <StarterCard key={starter.id} $active={starterIndex === i}>
                  <ArrowSlot><Arrow menu show={starterIndex === i} /></ArrowSlot>
                  <StarterImage src={meta.images.front} />
                  <StarterName>{starter.name}</StarterName>
                  <StarterType>{starter.type}</StarterType>
                </StarterCard>
              );
            })}
          </StarterContainer>
        </TopArea>
        <TextBox>
          {STARTERS[starterIndex].description}
          <ContinueHint>v</ContinueHint>
        </TextBox>
      </Overlay>
    );
  }

  // =========================================================================
  // RENDER: Dialogue (Oak/Rival speaking)
  // =========================================================================
  return (
    <Overlay>
      <TopArea>
        <OakImage src={oakPortrait} />
      </TopArea>
      <TextBox>
        {getText()}
        <ContinueHint>v</ContinueHint>
      </TextBox>
    </Overlay>
  );
};

export default IntroSequence;
