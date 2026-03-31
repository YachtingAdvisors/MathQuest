import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { xToPx, yToPx } from "../app/position-helper";
import pokeballImg from "../assets/misc/pokeball.png";
import PixelImage from "../styles/PixelImage";
import {
  selectPokemon,
  selectMapId,
  selectPos,
  selectDirection,
  selectName,
  setStarterPokemon,
  encounterPokemon,
  encounterTrainer,
} from "../state/gameSlice";
import { selectGradeSelected } from "../state/mathSlice";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { MapId } from "../maps/map-types";
import { Direction } from "../state/state-types";
import { directionModifier } from "../app/map-helper";
import { rival } from "../app/npcs";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import Arrow from "./Arrow";
import { RootState } from "../state/store";

// ---------------------------------------------------------------------------
// Authentic Pokemon Blue lab flow:
//
// 1. Player enters lab → Oak dialogue at bottom of screen (lab visible)
// 2. "There are 3 POKeMON here! Go choose!" → dialogue closes
// 3. Player walks freely in the lab to the table (row 1, cols 3/4/5)
// 4. Player faces up at row 2 and presses A on a Pokeball
// 5. "BULBASAUR? A GRASS type. Do you want it?" → Yes/No
// 6. After picking → rival reacts → rival picks → rival challenges
// 7. Rival battle launches
// ---------------------------------------------------------------------------

interface Starter {
  id: number;
  name: string;
  type: string;
  tableX: number; // Which column on the table (3=left, 4=center, 5=right)
  rivalCounterId: number;
}

// Pokeballs are on the table on the RIGHT side of the lab
// Table is at row 3, columns 6, 7, 8 (walls in map data)
// Player stands at row 4 facing up to interact
const STARTERS: Starter[] = [
  { id: 1, name: "BULBASAUR", type: "GRASS", tableX: 6, rivalCounterId: 4 },
  { id: 4, name: "CHARMANDER", type: "FIRE", tableX: 7, rivalCounterId: 7 },
  { id: 7, name: "SQUIRTLE", type: "WATER", tableX: 8, rivalCounterId: 1 },
];

enum Phase {
  // Bottom-of-screen dialogue (lab visible behind)
  OAK_GREETING,       // "Ah, RED! I've been waiting!"
  OAK_EXPLAIN,        // "There are 3 POKeMON here!"
  OAK_CHOOSE,         // "Go choose one!"

  // Player walks freely — no UI shown
  WALKING,

  // Player pressed A on a Pokeball — bottom dialogue
  POKEBALL_EXAMINE,   // "CHARMANDER, the FIRE type. Do you want it?"
  CONFIRM,            // Yes / No menu

  // Post-selection flow — bottom dialogue
  RECEIVED,           // "RED received CHARMANDER!"
  RIVAL_JEALOUS,      // "RIVAL: Hey! I was here first!"
  OAK_PATIENCE,       // "OAK: Be patient!"
  RIVAL_PICKS,        // "RIVAL picked up SQUIRTLE!"
  RIVAL_CHALLENGE_1,  // "My POKeMON looks stronger!"
  RIVAL_CHALLENGE_2,  // "I'll take you on!"

  DONE,
}

// ---------------------------------------------------------------------------
// Styles — bottom dialogue box (not full overlay)
// ---------------------------------------------------------------------------

const DialogueContainer = styled.div`
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  height: 20%;
  z-index: 150;

  @media (max-width: 1000px) {
    height: 30%;
  }
`;

const DialogueBox = styled.div`
  width: 100%; height: 100%;
  background: var(--bg);
  border: 4px solid black;
  padding: 2vh;
  font-family: "PokemonGB";
  font-size: 3vh;
  color: black;
  line-height: 1.8;
  position: relative;
  display: flex;
  align-items: center;

  @media (max-width: 1000px) {
    font-size: 8px; padding: 5px;
    border: 2px solid black; line-height: 1.6;
  }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
`;

const ContinueArrow = styled.div`
  position: absolute;
  bottom: 6px; right: 10px;
  font-size: 2.5vh; color: black;
  animation: ${bounce} 0.8s infinite;
  @media (max-width: 1000px) { font-size: 7px; bottom: 3px; right: 5px; }
`;

// Yes/No menu
const ConfirmMenu = styled.div`
  position: absolute;
  right: 0; bottom: 100%;
  background: var(--bg);
  border: 4px solid black;
  z-index: 160;
  display: flex;
  flex-direction: column;
  min-width: 120px;

  @media (max-width: 1000px) {
    border: 2px solid black;
    min-width: 55px;
  }
`;

const ConfirmOption = styled.div<{ $active: boolean }>`
  font-family: "PokemonGB";
  font-size: 3vh;
  color: black;
  padding: 1vh 2vh;
  display: flex;
  align-items: center;
  gap: 1vh;
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.08)" : "transparent")};

  @media (max-width: 1000px) {
    font-size: 8px;
    padding: 3px 6px;
    gap: 3px;
  }
`;

const ArrowSlot = styled.div`
  width: 3vh; min-width: 12px;
  @media (max-width: 1000px) { width: 10px; }
`;

// Visual Pokeball on table
interface PokeballPos {
  $x: number;
  $y: number;
}

const TablePokeball = styled.div<PokeballPos>`
  position: absolute;
  top: ${(p) => yToPx(p.$y)};
  left: ${(p) => xToPx(p.$x)};
  transform: translateY(-20%);
  z-index: 5;
  pointer-events: none;
`;

const PokeballSprite = styled(PixelImage)`
  width: ${xToPx(1)};
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
  const playerName = useSelector(selectName) || "PLAYER";
  const rivalNameStr =
    useSelector((state: RootState) => (state.game as any).rivalName) || "RIVAL";

  const [phase, setPhase] = useState(Phase.OAK_GREETING);
  const [examinedStarter, setExaminedStarter] = useState<Starter | null>(null);
  const [confirmIndex, setConfirmIndex] = useState(0); // 0=Yes, 1=No

  const isActive =
    mapId === MapId.PalletTownLab &&
    pokemon.length === 0 &&
    gradeSelected &&
    phase !== Phase.DONE;

  // Check which Pokeball the player is facing (if any)
  // Table is at row 3. Player stands at row 4 facing up.
  const getFacingPokeball = (): Starter | null => {
    if (facing !== Direction.Up) return null;
    const mod = directionModifier(facing);
    const targetX = pos.x + mod.x;
    const targetY = pos.y + mod.y;
    if (targetY !== 3) return null;
    return STARTERS.find((s) => s.tableX === targetX) || null;
  };

  const giveStarter = (starter: Starter) => {
    const meta = getPokemonMetadata(starter.id);
    const stats = getPokemonStats(starter.id, 5);
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
  };

  const startRivalBattle = () => {
    if (!examinedStarter) return;
    dispatch(
      encounterTrainer({
        npc: rival,
        pokemon: [{ id: examinedStarter.rivalCounterId, level: 5 }],
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
    dispatch(
      encounterPokemon(
        getPokemonEncounter(examinedStarter.rivalCounterId, 5)
      )
    );
    setPhase(Phase.DONE);
  };

  // --- Keyboard ---
  useEvent(Event.A, () => {
    if (!isActive) return;

    switch (phase) {
      case Phase.OAK_GREETING:
        setPhase(Phase.OAK_EXPLAIN);
        break;
      case Phase.OAK_EXPLAIN:
        setPhase(Phase.OAK_CHOOSE);
        break;
      case Phase.OAK_CHOOSE:
        setPhase(Phase.WALKING);
        break;

      case Phase.WALKING: {
        // Player presses A — check if facing a Pokeball
        const pokeball = getFacingPokeball();
        if (pokeball) {
          setExaminedStarter(pokeball);
          setConfirmIndex(0);
          setPhase(Phase.POKEBALL_EXAMINE);
        }
        break;
      }

      case Phase.POKEBALL_EXAMINE:
        setPhase(Phase.CONFIRM);
        break;

      case Phase.CONFIRM:
        if (confirmIndex === 0) {
          // Yes — give the starter
          if (examinedStarter) giveStarter(examinedStarter);
          setPhase(Phase.RECEIVED);
        } else {
          // No — go back to walking
          setExaminedStarter(null);
          setPhase(Phase.WALKING);
        }
        break;

      case Phase.RECEIVED:
        setPhase(Phase.RIVAL_JEALOUS);
        break;
      case Phase.RIVAL_JEALOUS:
        setPhase(Phase.OAK_PATIENCE);
        break;
      case Phase.OAK_PATIENCE:
        setPhase(Phase.RIVAL_PICKS);
        break;
      case Phase.RIVAL_PICKS:
        setPhase(Phase.RIVAL_CHALLENGE_1);
        break;
      case Phase.RIVAL_CHALLENGE_1:
        setPhase(Phase.RIVAL_CHALLENGE_2);
        break;
      case Phase.RIVAL_CHALLENGE_2:
        startRivalBattle();
        break;
    }
  });

  useEvent(Event.B, () => {
    if (!isActive) return;
    if (phase === Phase.POKEBALL_EXAMINE || phase === Phase.CONFIRM) {
      setExaminedStarter(null);
      setPhase(Phase.WALKING);
    }
  });

  useEvent(Event.Up, () => {
    if (!isActive) return;
    if (phase === Phase.CONFIRM) setConfirmIndex(0);
  });

  useEvent(Event.Down, () => {
    if (!isActive) return;
    if (phase === Phase.CONFIRM) setConfirmIndex(1);
  });

  if (!isActive) return null;

  // --- Dialogue text ---
  const getText = (): string => {
    switch (phase) {
      case Phase.OAK_GREETING:
        return `OAK: Ah, ${playerName}! I've been waiting for you!`;
      case Phase.OAK_EXPLAIN:
        return "OAK: There are 3 POKeMON here! They are inside the POKe BALLS on that table!";
      case Phase.OAK_CHOOSE:
        return "OAK: When I was young, I was a serious POKeMON trainer! In my old age, I have only 3 left. You can have one! Go ahead and choose!";
      case Phase.POKEBALL_EXAMINE:
        return examinedStarter
          ? `${examinedStarter.name}, the ${examinedStarter.type}-type POKeMON. Do you want it?`
          : "";
      case Phase.RECEIVED:
        return `${playerName} received ${examinedStarter?.name || "POKeMON"}!`;
      case Phase.RIVAL_JEALOUS:
        return `${rivalNameStr}: Hey! I was here first! Gramps, what about me?`;
      case Phase.OAK_PATIENCE:
        return `OAK: Be patient, ${rivalNameStr}! You can have one too!`;
      case Phase.RIVAL_PICKS: {
        if (!examinedStarter) return "";
        const meta = getPokemonMetadata(examinedStarter.rivalCounterId);
        return `${rivalNameStr} picked up ${meta.name.toUpperCase()}!`;
      }
      case Phase.RIVAL_CHALLENGE_1:
        return `${rivalNameStr}: My POKeMON looks a lot stronger than yours!`;
      case Phase.RIVAL_CHALLENGE_2:
        return `${rivalNameStr}: I'll take you on right here and now!`;
      default:
        return "";
    }
  };

  // Determine which pokeballs to show — hide the one the player picked
  const chosenX = phase >= Phase.RECEIVED && examinedStarter ? examinedStarter.tableX : -1;
  const showDialogue = phase !== Phase.WALKING;

  // --- Render: Pokeballs on table + optional dialogue ---
  return (
    <>
      {/* Visual Pokeballs on the table */}
      {STARTERS.map((s) =>
        s.tableX !== chosenX ? (
          <TablePokeball key={s.tableX} $x={s.tableX} $y={3}>
            <PokeballSprite src={pokeballImg} />
          </TablePokeball>
        ) : null
      )}

      {/* Bottom dialogue box */}
      {showDialogue && (
        <DialogueContainer>
          <DialogueBox>
            {getText()}
            {phase !== Phase.CONFIRM && <ContinueArrow>v</ContinueArrow>}
          </DialogueBox>

          {/* Yes/No menu for confirm phase */}
          {phase === Phase.CONFIRM && (
            <ConfirmMenu>
              <ConfirmOption $active={confirmIndex === 0}>
                <ArrowSlot>
                  <Arrow menu show={confirmIndex === 0} />
                </ArrowSlot>
                YES
              </ConfirmOption>
              <ConfirmOption $active={confirmIndex === 1}>
                <ArrowSlot>
                  <Arrow menu show={confirmIndex === 1} />
                </ArrowSlot>
                NO
              </ConfirmOption>
            </ConfirmMenu>
          )}
        </DialogueContainer>
      )}
    </>
  );
};

export default StarterSelect;
