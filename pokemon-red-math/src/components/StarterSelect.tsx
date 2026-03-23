import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectPokemon,
  selectMapId,
  selectPos,
  selectDirection,
  setStarterPokemon,
  encounterPokemon,
  encounterTrainer,
} from "../state/gameSlice";
// selectMenuOpen removed — StarterSelect handles its own state
import { selectGradeSelected } from "../state/mathSlice";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { MapId } from "../maps/map-types";
import { Direction } from "../state/state-types";
import { directionModifier } from "../app/map-helper";
import PixelImage from "../styles/PixelImage";
import Arrow from "./Arrow";
import Frame from "./Frame";
import { rival } from "../app/npcs";
import getPokemonEncounter from "../app/pokemon-encounter-helper";

// ---------------------------------------------------------------------------
// In the real Pokemon Red, in Oak's Lab:
// 1. Player walks up to the table with 3 Pokeballs
// 2. Pressing A on a Pokeball → Oak: "So! You want <POKEMON>?"
// 3. Player confirms → receives Pokemon
// 4. Rival: "I'll take this one then!" (picks type advantage)
// 5. Rival: "Let's battle!" → trainer battle
// ---------------------------------------------------------------------------

interface Starter {
  id: number;
  name: string;
  type: string;
  // Table positions in the lab (row 1, cols 3, 4, 5)
  tableX: number;
  rivalCounterId: number;
}

const STARTERS: Starter[] = [
  { id: 1, name: "BULBASAUR", type: "GRASS", tableX: 3, rivalCounterId: 4 },
  { id: 4, name: "CHARMANDER", type: "FIRE", tableX: 4, rivalCounterId: 7 },
  { id: 7, name: "SQUIRTLE", type: "WATER", tableX: 5, rivalCounterId: 1 },
];

// Dialogue phases after player interacts with a Pokeball
enum Phase {
  IDLE,               // Waiting for player to interact with table
  OAK_INTRO,          // "There are 3 POKeMON here!"
  OAK_CHOOSE,         // "They are inside the POKe BALLS. Choose!"
  EXAMINING,          // Player walked to a Pokeball
  OAK_CONFIRM,        // "So! You want <POKEMON>?"
  OAK_CONFIRM_WAIT,   // Waiting for player to press A to confirm
  RECEIVED,           // "<PLAYER> received <POKEMON>!"
  RIVAL_JEALOUS,      // "RIVAL: Hey! I was here first!"
  OAK_PATIENCE,       // "OAK: Be patient! You can have one too!"
  RIVAL_PICKS,        // "<RIVAL> picked up <POKEMON>!"
  RIVAL_CHALLENGE_1,  // "RIVAL: My POKeMON looks stronger!"
  RIVAL_CHALLENGE_2,  // "RIVAL: Let's check it out!"
  BATTLE,             // Launches rival battle
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const DialogueBox = styled.div`
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  height: 20%;
  z-index: 150;
  animation: ${fadeIn} 100ms ease-out;

  @media (max-width: 1000px) {
    height: 30%;
  }
`;

const ConfirmOverlay = styled.div`
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 160;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 200ms ease-out;
`;

const TopArea = styled.div`
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 2vh;
  @media (max-width: 1000px) { padding: 5px; }
`;

const StarterImage = styled(PixelImage)`
  height: 20vh; margin-bottom: 1vh;
  @media (max-width: 1000px) { height: 45px; margin-bottom: 3px; }
`;

const StarterName = styled.div`
  font-family: "PokemonGB"; font-size: 4vh; color: black; text-align: center;
  @media (max-width: 1000px) { font-size: 10px; }
`;

const StarterType = styled.div`
  font-family: "PokemonGB"; font-size: 2.5vh; color: #555; text-align: center;
  margin-top: 0.5vh;
  @media (max-width: 1000px) { font-size: 7px; }
`;

const ConfirmButtons = styled.div`
  display: flex; justify-content: center; gap: 4vh; padding: 2vh;
  @media (max-width: 1000px) { gap: 10px; padding: 5px; }
`;

const ConfirmBtn = styled.button<{ $active: boolean }>`
  font-family: "PokemonGB"; font-size: 3vh; color: black;
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.1)" : "transparent")};
  border: 3px solid ${(p) => (p.$active ? "black" : "#999")};
  padding: 1vh 3vh; display: flex; align-items: center; gap: 1vh;
  @media (max-width: 1000px) {
    font-size: 8px; padding: 4px 8px; border-width: 2px; gap: 3px;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StarterSelect = () => {
  const dispatch = useDispatch();
  const pokemon = useSelector(selectPokemon);
  const mapId = useSelector(selectMapId);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const gradeSelected = useSelector(selectGradeSelected);

  const [phase, setPhase] = useState(Phase.OAK_INTRO);
  const [selectedStarter, setSelectedStarter] = useState<Starter | null>(null);
  const [confirmIndex, setConfirmIndex] = useState(0); // 0=Yes 1=No
  const [hasInteracted, setHasInteracted] = useState(false);

  // Only active in the lab, before player has pokemon, after grade selected
  const isActive =
    mapId === MapId.PalletTownLab &&
    pokemon.length === 0 &&
    gradeSelected;

  const getRivalName = (): string => {
    // Read from game state
    try {
      const saved = localStorage.getItem("mathquest-save");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rivalName) return parsed.rivalName;
      }
    } catch { /* ignore */ }
    return "RIVAL";
  };

  const getPlayerName = (): string => {
    try {
      const saved = localStorage.getItem("mathquest-save");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) return parsed.name;
      }
    } catch { /* ignore */ }
    return "PLAYER";
  };

  const rivalNameStr = getRivalName();

  const getText = (): string => {
    switch (phase) {
      case Phase.OAK_INTRO:
        return "OAK: Ah! There are 3 POKeMON here! Haha!";
      case Phase.OAK_CHOOSE:
        return "OAK: They are inside the POKe BALLS. When I was young, I was a serious POKeMON trainer! In my old age, I have only 3 left, but you can have one! Go on, choose!";
      case Phase.EXAMINING:
        if (!selectedStarter) return "";
        return `${selectedStarter.name} - ${selectedStarter.type} type POKeMON. Choose this one?`;
      case Phase.RECEIVED:
        if (!selectedStarter) return "";
        return `${getPlayerName()} received ${selectedStarter.name}!`;
      case Phase.RIVAL_JEALOUS:
        return `${rivalNameStr}: Hey! I was here first! Gramps, what about me?`;
      case Phase.OAK_PATIENCE:
        return `OAK: Be patient, ${rivalNameStr}! You can have one too!`;
      case Phase.RIVAL_PICKS: {
        if (!selectedStarter) return "";
        const rivalMeta = getPokemonMetadata(selectedStarter.rivalCounterId);
        return `${rivalNameStr} picked up ${rivalMeta.name.toUpperCase()}!`;
      }
      case Phase.RIVAL_CHALLENGE_1:
        return `${rivalNameStr}: My POKeMON looks a lot stronger than yours!`;
      case Phase.RIVAL_CHALLENGE_2:
        return `${rivalNameStr}: I'll take you on right here and now!`;
      default:
        return "";
    }
  };

  // Give the player their starter
  const giveStarter = () => {
    if (!selectedStarter) return;
    const meta = getPokemonMetadata(selectedStarter.id);
    const stats = getPokemonStats(selectedStarter.id, 5);
    dispatch(
      setStarterPokemon({
        id: selectedStarter.id,
        level: 5,
        xp: 0,
        hp: stats.hp,
        moves: meta.moves
          .filter((m: any) => m.levelLearnedAt <= 5)
          .slice(0, 2)
          .map((m: any) => ({ id: m.name, pp: 35 })),
      })
    );
  };

  // Launch rival battle
  const startRivalBattle = () => {
    if (!selectedStarter) return;
    const rivalPokemonId = selectedStarter.rivalCounterId;
    dispatch(
      encounterTrainer({
        npc: rival,
        pokemon: [{ id: rivalPokemonId, level: 5 }],
        facing: Direction.Left,
        intro: [
          `${rivalNameStr}: Let's see how good you really are!`,
        ],
        outtro: [
          `${rivalNameStr}: What? Unbelievable!`,
          `I picked the wrong POKeMON!`,
        ],
        money: 175,
        pos: { x: 6, y: 3 },
      })
    );
    // The trainer encounter system will handle the battle from here
    dispatch(
      encounterPokemon(getPokemonEncounter(rivalPokemonId, 5))
    );
  };

  // Check if player is facing a Pokeball on the table
  const checkPokeball = (): Starter | null => {
    if (facing !== Direction.Up) return null;
    const mod = directionModifier(facing);
    const targetX = pos.x + mod.x;
    const targetY = pos.y + mod.y;
    // Table is at row 1, cols 3-5
    if (targetY !== 1) return null;
    return STARTERS.find((s) => s.tableX === targetX) || null;
  };

  // --- Keyboard ---
  useEvent(Event.A, () => {
    if (!isActive) return;

    // Oak's initial dialogue
    if (phase === Phase.OAK_INTRO && !hasInteracted) {
      setHasInteracted(true);
      setPhase(Phase.OAK_CHOOSE);
      return;
    }

    if (phase === Phase.OAK_CHOOSE) {
      setPhase(Phase.IDLE);
      return;
    }

    // Player is at the table, press A to examine
    if (phase === Phase.IDLE) {
      const starter = checkPokeball();
      if (starter) {
        setSelectedStarter(starter);
        setPhase(Phase.EXAMINING);
        setConfirmIndex(0);
      }
      return;
    }

    // Confirming choice
    if (phase === Phase.EXAMINING) {
      if (confirmIndex === 0) {
        // Yes
        giveStarter();
        setPhase(Phase.RECEIVED);
      } else {
        // No - go back
        setSelectedStarter(null);
        setPhase(Phase.IDLE);
      }
      return;
    }

    // Flow through rival dialogue
    if (phase === Phase.RECEIVED) { setPhase(Phase.RIVAL_JEALOUS); return; }
    if (phase === Phase.RIVAL_JEALOUS) { setPhase(Phase.OAK_PATIENCE); return; }
    if (phase === Phase.OAK_PATIENCE) { setPhase(Phase.RIVAL_PICKS); return; }
    if (phase === Phase.RIVAL_PICKS) { setPhase(Phase.RIVAL_CHALLENGE_1); return; }
    if (phase === Phase.RIVAL_CHALLENGE_1) { setPhase(Phase.RIVAL_CHALLENGE_2); return; }
    if (phase === Phase.RIVAL_CHALLENGE_2) {
      startRivalBattle();
      setPhase(Phase.BATTLE);
      return;
    }
  });

  useEvent(Event.B, () => {
    if (!isActive) return;
    if (phase === Phase.EXAMINING) {
      setSelectedStarter(null);
      setPhase(Phase.IDLE);
    }
  });

  useEvent(Event.Left, () => {
    if (!isActive) return;
    if (phase === Phase.EXAMINING) {
      setConfirmIndex(1);
    }
  });

  useEvent(Event.Right, () => {
    if (!isActive) return;
    if (phase === Phase.EXAMINING) {
      setConfirmIndex(0);
    }
  });

  if (!isActive) return null;

  // --- Oak intro dialogue ---
  if (phase === Phase.OAK_INTRO || phase === Phase.OAK_CHOOSE) {
    return (
      <DialogueBox>
        <Frame wide tall flashing>
          {getText()}
        </Frame>
      </DialogueBox>
    );
  }

  // --- Examining a Pokeball (confirm overlay) ---
  if (phase === Phase.EXAMINING && selectedStarter) {
    const meta = getPokemonMetadata(selectedStarter.id);
    return (
      <ConfirmOverlay>
        <TopArea>
          <StarterImage src={meta.images.front} />
          <StarterName>{selectedStarter.name}</StarterName>
          <StarterType>{selectedStarter.type} type</StarterType>
        </TopArea>
        <Frame wide>
          <div style={{ fontFamily: "PokemonGB", fontSize: "3vh", color: "black", padding: "1vh" }}>
            OAK: So! You want {selectedStarter.name}?
          </div>
        </Frame>
        <ConfirmButtons>
          <ConfirmBtn $active={confirmIndex === 0}>
            <Arrow menu show={confirmIndex === 0} />
            YES
          </ConfirmBtn>
          <ConfirmBtn $active={confirmIndex === 1}>
            <Arrow menu show={confirmIndex === 1} />
            NO
          </ConfirmBtn>
        </ConfirmButtons>
      </ConfirmOverlay>
    );
  }

  // --- Post-selection dialogue (received, rival, battle) ---
  if (phase >= Phase.RECEIVED && phase <= Phase.RIVAL_CHALLENGE_2) {
    return (
      <DialogueBox>
        <Frame wide tall flashing>
          {getText()}
        </Frame>
      </DialogueBox>
    );
  }

  // IDLE or BATTLE — don't render anything
  return null;
};

export default StarterSelect;
