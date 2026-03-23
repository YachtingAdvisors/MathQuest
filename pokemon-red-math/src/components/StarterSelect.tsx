import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectPokemon,
  selectMapId,
  selectName,
  setStarterPokemon,
  encounterPokemon,
  encounterTrainer,
} from "../state/gameSlice";
import { selectGradeSelected } from "../state/mathSlice";
// uiSlice not needed — StarterSelect manages its own UI
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { MapId } from "../maps/map-types";
import { Direction } from "../state/state-types";
import { rival } from "../app/npcs";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import PixelImage from "../styles/PixelImage";
import Arrow from "./Arrow";
// Frame not needed — using custom TextBox
import { RootState } from "../state/store";

// ---------------------------------------------------------------------------
// In Pokemon Red, in Oak's Lab:
// 1. Oak greets you and tells you to pick from 3 Pokeballs
// 2. You choose one (full screen overlay with the 3 starters)
// 3. Rival picks the type-advantaged counter
// 4. Rival challenges you to a battle
// ---------------------------------------------------------------------------

interface Starter {
  id: number;
  name: string;
  type: string;
  rivalCounterId: number;
}

const STARTERS: Starter[] = [
  { id: 1, name: "BULBASAUR", type: "GRASS", rivalCounterId: 4 },
  { id: 4, name: "CHARMANDER", type: "FIRE", rivalCounterId: 7 },
  { id: 7, name: "SQUIRTLE", type: "WATER", rivalCounterId: 1 },
];

enum Phase {
  OAK_GREETING,
  OAK_CHOOSE,
  PICK_STARTER,       // Full screen: pick from 3
  CONFIRM,            // "You want CHARMANDER?" Yes/No
  RECEIVED,           // "RED received CHARMANDER!"
  RIVAL_JEALOUS,
  OAK_PATIENCE,
  RIVAL_PICKS,
  RIVAL_CHALLENGE_1,
  RIVAL_CHALLENGE_2,
  DONE,
}

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
  z-index: 300;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 300ms ease-out;
`;

const TopArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2vh;
  @media (max-width: 1000px) { padding: 5px; }
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

const StarterContainer = styled.div`
  display: flex; justify-content: center; gap: 3vh;
  width: 100%; padding: 0 2vh;
  @media (max-width: 1000px) { gap: 8px; padding: 0 4px; }
`;

const StarterCard = styled.div<{ $active: boolean }>`
  display: flex; flex-direction: column; align-items: center;
  padding: 1.5vh;
  border: 3px solid ${(p) => (p.$active ? "black" : "transparent")};
  background: ${(p) => (p.$active ? "rgba(0,0,0,0.08)" : "transparent")};
  flex: 1; max-width: 33%; cursor: pointer;
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
  const gradeSelected = useSelector(selectGradeSelected);
  const playerName = useSelector(selectName) || "PLAYER";
  const rivalNameStr = useSelector((state: RootState) => (state.game as any).rivalName) || "RIVAL";

  const [phase, setPhase] = useState(Phase.OAK_GREETING);
  const [starterIndex, setStarterIndex] = useState(1); // Default Charmander
  const [confirmIndex, setConfirmIndex] = useState(0);
  const [selectedStarter, setSelectedStarter] = useState<Starter | null>(null);

  // Active when: in the lab, no pokemon, grade selected
  const isActive =
    mapId === MapId.PalletTownLab &&
    pokemon.length === 0 &&
    gradeSelected &&
    phase !== Phase.DONE;

  const getText = (): string => {
    switch (phase) {
      case Phase.OAK_GREETING:
        return `OAK: Ah, ${playerName}! I've been waiting for you!`;
      case Phase.OAK_CHOOSE:
        return "OAK: There are 3 POKeMON here! They're inside the POKe BALLS on that table. When I was young, I was a serious POKeMON trainer! In my old age, I have only 3 left, but you can have one! Go on, choose!";
      case Phase.RECEIVED:
        return `${playerName} received ${selectedStarter?.name || "POKeMON"}!`;
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
    if (!selectedStarter) return;
    const rivalPokemonId = selectedStarter.rivalCounterId;
    dispatch(
      encounterTrainer({
        npc: rival,
        pokemon: [{ id: rivalPokemonId, level: 5 }],
        facing: Direction.Left,
        intro: [`${rivalNameStr}: Let's see how good you really are!`],
        outtro: [
          `${rivalNameStr}: What? Unbelievable!`,
          `I picked the wrong POKeMON!`,
        ],
        money: 175,
        pos: { x: 6, y: 3 },
      })
    );
    dispatch(encounterPokemon(getPokemonEncounter(rivalPokemonId, 5)));
    setPhase(Phase.DONE);
  };

  // --- Keyboard ---
  useEvent(Event.A, () => {
    if (!isActive) return;

    switch (phase) {
      case Phase.OAK_GREETING:
        setPhase(Phase.OAK_CHOOSE);
        break;
      case Phase.OAK_CHOOSE:
        setPhase(Phase.PICK_STARTER);
        break;
      case Phase.PICK_STARTER:
        setSelectedStarter(STARTERS[starterIndex]);
        setConfirmIndex(0);
        setPhase(Phase.CONFIRM);
        break;
      case Phase.CONFIRM:
        if (confirmIndex === 0) {
          // Yes
          const starter = STARTERS[starterIndex];
          setSelectedStarter(starter);
          giveStarter(starter);
          setPhase(Phase.RECEIVED);
        } else {
          // No
          setPhase(Phase.PICK_STARTER);
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
    if (phase === Phase.PICK_STARTER) {
      setPhase(Phase.OAK_CHOOSE);
    }
    if (phase === Phase.CONFIRM) {
      setPhase(Phase.PICK_STARTER);
    }
  });

  useEvent(Event.Left, () => {
    if (!isActive) return;
    if (phase === Phase.PICK_STARTER) {
      setStarterIndex(Math.max(0, starterIndex - 1));
    }
    if (phase === Phase.CONFIRM) {
      setConfirmIndex(0);
    }
  });

  useEvent(Event.Right, () => {
    if (!isActive) return;
    if (phase === Phase.PICK_STARTER) {
      setStarterIndex(Math.min(2, starterIndex + 1));
    }
    if (phase === Phase.CONFIRM) {
      setConfirmIndex(1);
    }
  });

  if (!isActive) return null;

  // =========================================================================
  // RENDER: Pick starter (3 cards)
  // =========================================================================
  if (phase === Phase.PICK_STARTER) {
    return (
      <Overlay>
        <TopArea style={{ justifyContent: "flex-start", paddingTop: "3vh" }}>
          <TextBox style={{ marginBottom: "2vh" }}>
            OAK: Choose a POKeMON!
          </TextBox>
          <StarterContainer>
            {STARTERS.map((starter, i) => {
              const meta = getPokemonMetadata(starter.id);
              return (
                <StarterCard key={starter.id} $active={starterIndex === i}>
                  <ArrowSlot>
                    <Arrow menu show={starterIndex === i} />
                  </ArrowSlot>
                  <StarterImage src={meta.images.front} />
                  <StarterName>{starter.name}</StarterName>
                  <StarterType>{starter.type}</StarterType>
                </StarterCard>
              );
            })}
          </StarterContainer>
        </TopArea>
        <TextBox>
          {(() => {
            const s = STARTERS[starterIndex];
            const meta = getPokemonMetadata(s.id);
            const desc: Record<number, string> = {
              1: "A strange seed was planted on its back at birth. The plant sprouts and grows with this POKeMON.",
              4: "Obviously prefers hot places. When it rains, steam is said to spout from the tip of its tail.",
              7: "After birth, its back swells and hardens into a shell. Powerfully sprays foam from its mouth.",
            };
            return desc[s.id] || meta.name;
          })()}
          <ContinueHint>v</ContinueHint>
        </TextBox>
      </Overlay>
    );
  }

  // =========================================================================
  // RENDER: Confirm choice
  // =========================================================================
  if (phase === Phase.CONFIRM) {
    const starter = STARTERS[starterIndex];
    const meta = getPokemonMetadata(starter.id);
    return (
      <Overlay>
        <TopArea>
          <StarterImage src={meta.images.front} style={{ height: "25vh" }} />
          <StarterName style={{ fontSize: "4vh", marginTop: "1vh" }}>
            {starter.name}
          </StarterName>
        </TopArea>
        <TextBox>
          OAK: So! You want {starter.name}?
        </TextBox>
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
      </Overlay>
    );
  }

  // =========================================================================
  // RENDER: All dialogue phases (full overlay so player can't walk away)
  // =========================================================================
  return (
    <Overlay>
      <TopArea />
      <TextBox>
        {getText()}
        <ContinueHint>v</ContinueHint>
      </TextBox>
    </Overlay>
  );
};

export default StarterSelect;
