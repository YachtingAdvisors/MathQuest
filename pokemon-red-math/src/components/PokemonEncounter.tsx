import { useDispatch, useSelector } from "react-redux";
import styled, { css, keyframes } from "styled-components";
import {
  addInventory,
  addPokemon,
  defeatTrainer,
  encounterPokemon,
  endEncounter,
  faintToTrainer,
  gainMoney,
  recoverFromFainting,
  resetActivePokemon,
  selectActivePokemon,
  selectActivePokemonIndex,
  selectName,
  selectPokemon,
  selectPokemonEncounter,
  selectTrainerEncounter,
  setActivePokemon,
  updatePokemon,
  updatePokemonEncounter,
  updateSpecificPokemon,
} from "../state/gameSlice";
import usePokemonMetadata from "../app/use-pokemon-metadata";
import Frame from "./Frame";
import HealthBar from "./HealthBar";
import usePokemonStats from "../app/use-pokemon-stats";

import corner from "../assets/ui/corner.png";
import { useEffect, useState, useCallback, useRef } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";

import playerBack from "../assets/battle/player-back.png";

import ball1 from "../assets/battle/ball-open-1.png";
import ball2 from "../assets/battle/ball-open-2.png";
import ball3 from "../assets/battle/ball-open-3.png";
import ball4 from "../assets/battle/ball-open-4.png";
import ball5 from "../assets/battle/ball-open-5.png";
import ballIdle from "../assets/battle/ball-idle.png";
import ballLeft from "../assets/battle/ball-left.png";
import ballRight from "../assets/battle/ball-right.png";
import Menu, { MenuItemType } from "./Menu";
import PokemonList from "./PokemonList";
import {
  selectEvolution,
  selectItemsMenu,
  selectPokeballThrowing,
  selectStartMenu,
  showEvolution,
  showItemsMenu,
  showTextThenAction,
  stopThrowingPokeball,
} from "../state/uiSlice";
import useIsMobile from "../app/use-is-mobile";
import { getMoveMetadata } from "../app/use-move-metadata";
import { MoveMetadata } from "../app/move-metadata";
import processMove, { MoveResult } from "../app/move-helper";
import getXp from "../app/xp-helper";
import getLevelData, { getLearnedMove } from "../app/level-helper";
import MoveSelect from "./MoveSelect";
import catchesPokemon from "../app/pokeball-helper";
import { PokemonEncounterType, PokemonInstance } from "../state/state-types";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import PixelImage from "../styles/PixelImage";
import MathOverlay from "./MathOverlay";
import { useMathEngine } from "../hooks/useMathEngine";
import {
  selectShowingMathOverlay,
  selectShowingResult,
  selectLastMathResult,
  selectPendingAction,
  selectGradeSelected,
  dismissMathOverlay,
  selectRareEncounterReady,
  resetRareCounter,
} from "../state/mathSlice";

const MOVEMENT_ANIMATION = 1300;
const FRAME_DURATION = 100;
const ATTACK_ANIMATION = 600;
const IDLE_BALL_DURATION = 1000;

const StyledPokemonEncounter = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  padding-top: 1.5vh;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  flex: 1;
`;

const LeftInfoSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 5%;
`;

const RightInfoSection = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  margin-right: 5%;
`;

const Name = styled.div`
  font-size: 5.5vh;
  font-family: "PokemonGB";
  text-transform: uppercase;

  @media (max-width: 1000px) {
    font-size: 13px;
  }
`;

const Level = styled.div`
  font-size: 4.5vh;
  margin: 0 12vh;
  font-family: "PressStart2P", sans-serif;

  @media (max-width: 1000px) {
    font-size: 12px;
    margin: 0 28px;
  }
`;

const HealthBarContainer = styled.div`
  margin: 0 3.3vh;
  margin-top: 1.2vh;

  @media (max-width: 1000px) {
    margin: 0 8px;
  }
`;

const Health = styled.div`
  font-family: "PokemonGB";

  font-size: 5vh;
  margin: 0 3.3vh;
  margin-top: 1.2vh;
  @media (max-width: 1000px) {
    font-size: 13px;
    margin: 0 8px;
    margin-top: 3px;
  }
`;

const flashing = keyframes`
  0% { opacity: 1; }
  10% { opacity: 0; }
  20% { opacity: 1; }
  30% { opacity: 0; }
  40% { opacity: 1; }
  50% { opacity: 0; }
  60% { opacity: 1; }
  70% { opacity: 0; }
  80% { opacity: 1; }
  90% { opacity: 0; }
  100% { opacity: 1; }
`;

interface ImageContainerProps {
  $flashing?: boolean;
}

const ImageContainer = styled.div<ImageContainerProps>`
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  ${(props: ImageContainerProps) =>
    props.$flashing &&
    css`
      animation: ${flashing} 500ms linear forwards;
    `};
`;

const changePokemon = keyframes`
  0% { transform: translateX(0%); opacity: 1; }
  50% { transform: translateX(-400%); opacity: 1; }
  51% { transform: translateX(-400%); opacity: 0; }
  99% { transform: translateX(0%); opacity: 0; }
  100% { transform: translateX(0%); opacity: 1; }
`;

interface ChangePokemonProps {
  $changing: boolean;
}

const ChangePokemon = styled.div<ChangePokemonProps>`
  height: 100%;
  ${(props: ChangePokemonProps) =>
    props.$changing &&
    css`
      animation: ${changePokemon} ${MOVEMENT_ANIMATION * 2}ms linear forwards;
    `};
`;

const changeEnemyPokemon = keyframes`
  0% { transform: translateX(0%); opacity: 1; }
  50% { transform: translateX(400%); opacity: 1; }
  51% { transform: translateX(400%); opacity: 0; }
  99% { transform: translateX(0%); opacity: 0; }
  100% { transform: translateX(0%); opacity: 1; }
`;

const ChangeEnemyPokemon = styled.div<ChangePokemonProps>`
  height: 100%;
  ${(props: ChangePokemonProps) =>
    props.$changing &&
    css`
      animation: ${changeEnemyPokemon} ${MOVEMENT_ANIMATION * 2}ms linear forwards;
    `};
`;

const inFromRight = keyframes`
  from { transform: translateX(400%); }
  to { transform: translateX(0%); }
`;

const LeftImage = styled(PixelImage)`
  height: 140%;
  transform: translate(400%) scale(1);
  animation: ${inFromRight} ${`${MOVEMENT_ANIMATION}ms`} linear forwards;
  image-rendering: pixelated;
`;

const inFromLeft = keyframes`
  from { transform: translateX(-400%); }
  to { transform: translateX(0%); }
`;

const RightImage = styled(PixelImage)`
  height: 500%;
  min-height: 180px;
  transform: translate(-400%) scale(1);
  animation: ${inFromLeft} ${`${MOVEMENT_ANIMATION}ms`} linear forwards;
  image-rendering: pixelated;

  @media (max-width: 1000px) {
    min-height: 100px;
  }
`;

const attackRight = keyframes`
  0% { transform: translateX(0%); }
  50% { transform: translateX(50%); }
  100% { transform: translateX(0%); }
`;

interface AttackingProps {
  $attacking?: boolean;
}

const AttackRight = styled.div<AttackingProps>`
  height: 100%;
  transform: translateX(0%);
  ${(props: AttackingProps) =>
    props.$attacking &&
    css`
      animation: ${attackRight} ${ATTACK_ANIMATION}ms linear forwards;
    `};
`;

const attackLeft = keyframes`
  0% { transform: translateX(0%); }
  50% { transform: translateX(-50%); }
  100% { transform: translateX(0%); }
`;

const AttackLeft = styled.div<AttackingProps>`
  height: 100%;
  transform: translateX(0%);
  ${(props: AttackingProps) =>
    props.$attacking &&
    css`
      animation: ${attackLeft} ${ATTACK_ANIMATION}ms linear forwards;
    `};
`;

const Corner = styled(PixelImage)`
  transform: translateY(-50%);
  height: 8vh;
  @media (max-width: 1000px) {
    height: 19px;
  }
`;

const CornerContainer = styled.div`
  height: 5vh;
  @media (max-width: 1000px) {
    height: 10px;
  }
`;

const CornerRight = styled(PixelImage)`
  height: 8vh;
  transform: translateY(-70%) scaleX(-1);
  @media (max-width: 1000px) {
    height: 19px;
  }
`;

const TextContainer = styled.div`
  width: 100%;
  height: 20%;
  min-height: 20%;
  flex-shrink: 0;
  z-index: 100;

  @media (max-width: 1000px) {
    height: 30%;
    min-height: 30%;
  }
`;

const moveLeftKF = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0%); }
`;

const moveRightKF = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0%); }
`;

const RightSide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 5%,
    rgba(0, 0, 0, 1) 5%,
    rgba(0, 0, 0, 1) 10%
  );
  transform: translateX(100%);
  animation: ${moveLeftKF} 1500ms linear forwards;
`;

const LeftSide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 5%,
    rgba(0, 0, 0, 0) 5%,
    rgba(0, 0, 0, 0) 10%
  );
  transform: translateX(-100%);
  animation: ${moveRightKF} 1500ms linear forwards;
`;

const BlackOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 100;
`;

const PokemonEncounter = () => {
  const dispatch = useDispatch();
  const enemy = useSelector(selectPokemonEncounter);
  const enemyMetadata = usePokemonMetadata(enemy?.id || null);
  const enemyStats = usePokemonStats(enemy?.id || 1, enemy?.level || 1);
  const active = useSelector(selectActivePokemon);
  const activeMetadata = usePokemonMetadata(active?.id || null);
  const activeStats = usePokemonStats(active?.id || 1, active?.level || 1);
  const itemMenuOpen = useSelector(selectItemsMenu);
  const isMobile = useIsMobile();
  const pokemon = useSelector(selectPokemon);
  const name = useSelector(selectName);
  const startMenuOpen = useSelector(selectStartMenu);
  const pokeballThrowing = useSelector(selectPokeballThrowing);
  const trainer = useSelector(selectTrainerEncounter);
  const activePokemonIndex = useSelector(selectActivePokemonIndex);

  // Math integration
  const mathEngine = useMathEngine();
  const showingMath = useSelector(selectShowingMathOverlay);
  const showingMathResult = useSelector(selectShowingResult);
  const lastMathResult = useSelector(selectLastMathResult);
  const pendingAction = useSelector(selectPendingAction);
  const gradeSelected = useSelector(selectGradeSelected);

  const rareEncounterReady = useSelector(selectRareEncounterReady);

  // Store speed bonus from last math result for catch calculations
  const lastSpeedBonusRef = useRef(1.0);

  const [stage, setStage] = useState(-1);
  const [trainerPokemonIndex, setTrainerPokemonIndex] = useState(0);
  const [outroIndex, setOutroIndex] = useState(0);
  const [involvedPokemon, setInvolvedPokemon] = useState<number[]>([0]);
  const [processingInvolvedPokemon, setProcessingInvolvedPokemon] = useState(0);
  const processingPokemon =
    pokemon[involvedPokemon[processingInvolvedPokemon] || 0];
  const processingMetadata = usePokemonMetadata(processingPokemon?.id || null);
  const pokemonEvolving = useSelector(selectEvolution);

  const [alertText, setAlertText] = useState<string | null>(null);
  const [clickableNotice, setClickableNotice] = useState<string | null>(null);

  const isInBattle = !!enemy && !!active && !!enemyMetadata && !!activeMetadata;
  const isTrainer = !!trainer;
  const isThrowingEnemyPokeball = stage >= 34 && stage <= 38 && isTrainer;

  // Should we gate actions through math? Only if grade was selected
  const mathEnabled = gradeSelected;

  const handleEvolution = () => {
    if (!processingMetadata) return;
    if (!processingMetadata.evolution) return;
    if (processingPokemon.level < processingMetadata.evolution.level) return;
    dispatch(
      showEvolution({
        index: involvedPokemon[processingInvolvedPokemon],
        evolveToId: processingMetadata.evolution.pokemon,
      })
    );
  };

  const endEncounter_ = (exitBattle = false) => {
    handleEvolution();

    if (processingInvolvedPokemon < involvedPokemon.length - 1) {
      const nextIndex = processingInvolvedPokemon + 1;
      if (enemy) {
        dispatch(
          updateSpecificPokemon({
            index: involvedPokemon[nextIndex],
            pokemon: {
              ...pokemon[involvedPokemon[nextIndex]],
              xp:
                pokemon[involvedPokemon[nextIndex]].xp +
                Math.round(
                  getXp(enemy.id, enemy.level) / involvedPokemon.length
                ),
            },
          })
        );
      }
      setProcessingInvolvedPokemon(nextIndex);
      setStage(21);
      return;
    }
    setInvolvedPokemon([activePokemonIndex]);
    setProcessingInvolvedPokemon(0);

    if (exitBattle) {
      setTrainerPokemonIndex(0);
      dispatch(endEncounter());
      dispatch(faintToTrainer());
      return;
    }

    if (isTrainer && trainerPokemonIndex < trainer?.pokemon.length - 1) {
      const newIndex = trainerPokemonIndex + 1;
      const newPokemon = trainer?.pokemon[newIndex];
      dispatch(
        encounterPokemon(getPokemonEncounter(newPokemon.id, newPokemon.level))
      );
      setTrainerPokemonIndex(newIndex);
      throwPokeballAtEnemy(49);
      return;
    }

    if (isTrainer && trainerPokemonIndex === trainer?.pokemon.length - 1) {
      setStage(50);
      setTrainerPokemonIndex(10);
      return;
    }

    setTrainerPokemonIndex(0);
    dispatch(endEncounter());

    // Rare encounter trigger: after 30 correct answers in a row
    if (rareEncounterReady && !isTrainer) {
      dispatch(resetRareCounter());
      // Spawn a random rare Pokemon (legendary/rare pool)
      const rarePokemon = [144, 145, 146, 150, 149, 143, 131, 130, 142, 139, 112, 103, 65, 68, 76]; // Articuno, Zapdos, Moltres, Mewtwo, Dragonite, Snorlax, Lapras, Gyarados, etc.
      const rareId = rarePokemon[Math.floor(Math.random() * rarePokemon.length)];
      const rareLevel = Math.min(50, Math.max(20, (active?.level || 10) + 10));
      setTimeout(() => {
        dispatch(encounterPokemon(getPokemonEncounter(rareId, rareLevel)));
      }, 500);
      return;
    }

    if (isTrainer) {
      if (trainerPokemonIndex === 10) {
        dispatch(defeatTrainer());
        if (trainer.postGame) {
          dispatch(
            showTextThenAction({
              text: trainer.postGame.message,
              action: () => {
                if (trainer.postGame?.items) {
                  trainer.postGame.items.forEach((item) => {
                    dispatch(addInventory({ item, amount: 1 }));
                  });
                }
              },
            })
          );
        }
      } else {
        dispatch(faintToTrainer());
      }
    }
  };

  useEffect(() => {
    if (isInBattle) {
      dispatch(resetActivePokemon());
      setStage(0);
      setTimeout(() => setStage(1), 2000);
      setTimeout(() => setStage(2), 3300);
    }
    if (!isInBattle) setStage(-1);
  }, [isInBattle, dispatch]);

  const throwPokeball = () => {
    setTimeout(() => setStage(4), MOVEMENT_ANIMATION);
    setTimeout(() => setStage(5), MOVEMENT_ANIMATION * 2);
    setTimeout(() => setStage(6), MOVEMENT_ANIMATION * 2 + FRAME_DURATION);
    setTimeout(() => setStage(7), MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 2);
    setTimeout(() => setStage(8), MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 3);
    setTimeout(() => setStage(9), MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 4);
    setTimeout(() => setStage(10), MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 5);
    setTimeout(
      () => setStage(11),
      MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 5 + 500
    );
  };

  const throwPokeballAtEnemy = (end: number = 39) => {
    setStage(34);
    setTimeout(() => setStage(35), FRAME_DURATION);
    setTimeout(() => setStage(36), FRAME_DURATION * 2);
    setTimeout(() => setStage(37), FRAME_DURATION * 3);
    setTimeout(() => setStage(38), FRAME_DURATION * 4);
    setTimeout(() => setStage(end), FRAME_DURATION * 5);
  };

  // -------------------------------------------------------------------------
  // Pokeball catching with math speed bonus
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (pokeballThrowing && enemy) {
      if (isTrainer) {
        setClickableNotice("The trainer blocked the ball!");
        return;
      }

      // If math is enabled, start math challenge for catch
      if (mathEnabled) {
        mathEngine.startChallenge("catch", { type: "catch" });
        dispatch(stopThrowingPokeball());
        return;
      }

      // No math - original behavior
      const shakePokeball = (
        times: number,
        caught: boolean,
        startTimes?: number
      ) => {
        setStage(39);
        setTimeout(() => setStage(40), IDLE_BALL_DURATION);
        setTimeout(() => setStage(39), IDLE_BALL_DURATION + FRAME_DURATION);
        setTimeout(
          () => setStage(41),
          IDLE_BALL_DURATION + FRAME_DURATION * 2
        );
        setTimeout(
          () => setStage(39),
          IDLE_BALL_DURATION + FRAME_DURATION * 3
        );

        if (times > 1) {
          setTimeout(() => {
            shakePokeball(times - 1, caught, startTimes || times);
          }, IDLE_BALL_DURATION + FRAME_DURATION * 4);
        }
        if (times === 1) {
          setTimeout(() => {
            if (caught) {
              setStage(45);
            } else {
              throwPokeballAtEnemy();
              setTimeout(() => {
                if (startTimes === 1) setStage(42);
                else if (startTimes === 2) setStage(43);
                else if (startTimes === 3) setStage(44);
                else throw new Error("Invalid start times");
              }, FRAME_DURATION * 6);
            }
          }, IDLE_BALL_DURATION + FRAME_DURATION * 4);
        }
      };

      throwPokeballAtEnemy();
      const caught = catchesPokemon(enemy, pokeballThrowing);
      setTimeout(() => {
        if (caught) {
          shakePokeball(3, caught);
        } else {
          const shakes = Math.floor(Math.random() * 3) + 1;
          shakePokeball(shakes, caught);
        }
      }, FRAME_DURATION * 6);
      dispatch(stopThrowingPokeball());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokeballThrowing, enemy, dispatch, isTrainer, mathEnabled]);

  // -------------------------------------------------------------------------
  // Handle math result resolution
  // -------------------------------------------------------------------------
  const resolveMathResult = useCallback(() => {
    if (!lastMathResult || !pendingAction) return;

    const { correct, speedBonus } = lastMathResult;
    lastSpeedBonusRef.current = speedBonus;

    dispatch(dismissMathOverlay());

    if (pendingAction.type === "attack") {
      if (correct) {
        processBattle(pendingAction.moveId, speedBonus);
      } else {
        // Wrong answer = attack misses (reduced damage)
        processBattle(pendingAction.moveId, 0);
      }
    } else if (pendingAction.type === "catch") {
      if (correct && enemy) {
        // Proceed with catch, speed bonus applied
        throwPokeballAtEnemy();
        const caught = catchesPokemon(enemy, "poke-ball", speedBonus);
        const shakePokeball = (
          times: number,
          caught: boolean,
          startTimes?: number
        ) => {
          setStage(39);
          setTimeout(() => setStage(40), IDLE_BALL_DURATION);
          setTimeout(() => setStage(39), IDLE_BALL_DURATION + FRAME_DURATION);
          setTimeout(
            () => setStage(41),
            IDLE_BALL_DURATION + FRAME_DURATION * 2
          );
          setTimeout(
            () => setStage(39),
            IDLE_BALL_DURATION + FRAME_DURATION * 3
          );

          if (times > 1) {
            setTimeout(() => {
              shakePokeball(times - 1, caught, startTimes || times);
            }, IDLE_BALL_DURATION + FRAME_DURATION * 4);
          }
          if (times === 1) {
            setTimeout(() => {
              if (caught) {
                setStage(45);
              } else {
                throwPokeballAtEnemy();
                setTimeout(() => {
                  if (startTimes === 1) setStage(42);
                  else if (startTimes === 2) setStage(43);
                  else if (startTimes === 3) setStage(44);
                  else throw new Error("Invalid start times");
                }, FRAME_DURATION * 6);
              }
            }, IDLE_BALL_DURATION + FRAME_DURATION * 4);
          }
        };
        setTimeout(() => {
          if (caught) {
            shakePokeball(3, caught);
          } else {
            const shakes = Math.floor(Math.random() * 3) + 1;
            shakePokeball(shakes, caught);
          }
        }, FRAME_DURATION * 6);
      } else {
        // Wrong answer = auto fail catch
        setClickableNotice("The POKeMON broke free! (wrong answer)");
        setStage(11);
      }
    } else if (pendingAction.type === "run") {
      if (correct) {
        setStage(12);
      } else {
        setClickableNotice("Can't escape! (wrong answer)");
        // Enemy gets a free attack
        if (enemy) {
          const enemyMoveId =
            enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
          const enemyMove = getMoveMetadata(enemyMoveId);
          setAlertText(
            `Enemy ${enemyMetadata?.name.toUpperCase()} used ${enemyMove.name.toUpperCase()}!`
          );
          setStage(18);
          setTimeout(() => {
            const result = processMove(active, enemy, enemyMoveId, false);
            dispatch(updatePokemonEncounter(result.them));
            dispatch(updatePokemon(result.us));
            if (result.us.hp <= 0) {
              setStage(24);
            } else {
              setStage(11);
            }
            setAlertText(null);
          }, ATTACK_ANIMATION + 500);
        }
      }
    } else if (pendingAction.type === "item") {
      if (correct) {
        // Item use proceeds normally - items menu handles its own dispatch
        dispatch(showItemsMenu());
      } else {
        setClickableNotice("Fumbled the item! (wrong answer)");
        setStage(11);
      }
    } else if (pendingAction.type === "switch") {
      dispatch(setActivePokemon(pendingAction.pokemonIndex));
      setInvolvedPokemon([...involvedPokemon, pendingAction.pokemonIndex]);
      if (!correct) {
        // Switch happens but enemy gets free attack
        throwPokeball();
        if (enemy) {
          setTimeout(() => {
            const enemyMoveId =
              enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
            const result = processMove(active, enemy, enemyMoveId, false);
            dispatch(updatePokemonEncounter(result.them));
            dispatch(updatePokemon(result.us));
          }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 5 + 600);
        }
      } else {
        throwPokeball();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMathResult, pendingAction, enemy, active, dispatch]);

  // When math result is shown and user presses A, resolve it
  useEvent(Event.A, () => {
    if (showingMathResult && lastMathResult) {
      resolveMathResult();
      return;
    }

    if (showingMath) return; // Don't process other events during math

    if (startMenuOpen) return;
    if (pokemonEvolving !== null) return;

    if (clickableNotice) {
      setClickableNotice(null);
      return;
    }

    if (stage === 2) {
      setInvolvedPokemon([activePokemonIndex]);
      setProcessingInvolvedPokemon(0);
      if (isTrainer) {
        setStage(46);
        setTimeout(() => throwPokeballAtEnemy(48), 1000);
      } else {
        setStage(3);
        throwPokeball();
      }
    }

    if (stage === 48) {
      setStage(3);
      throwPokeball();
    }

    if (stage === 49) setStage(11);

    if (stage === 12) endEncounter_();

    if (stage === 20) {
      setStage(21);
      if (enemy) {
        dispatch(
          updateSpecificPokemon({
            index: involvedPokemon[processingInvolvedPokemon],
            pokemon: {
              ...processingPokemon,
              xp:
                processingPokemon.xp +
                Math.round(
                  getXp(enemy.id, enemy.level) / involvedPokemon.length
                ),
            },
          })
        );
      }
    }

    if (stage === 21) {
      const { level, leveledUp, remainingXp } = getLevelData(
        processingPokemon.level,
        processingPokemon.xp
      );
      if (leveledUp) {
        dispatch(
          updateSpecificPokemon({
            index: involvedPokemon[processingInvolvedPokemon],
            pokemon: {
              ...processingPokemon,
              level,
              xp: remainingXp,
            },
          })
        );
        setStage(22);
      } else {
        endEncounter_();
      }
    }

    if (stage === 22) {
      const move = getLearnedMove(processingPokemon);
      const hasFourMoves = processingPokemon.moves.length === 4;
      if (move && !hasFourMoves) setStage(29);
      else if (move && hasFourMoves) setStage(30);
      else endEncounter_();
    }

    if (stage === 24) {
      const hasOtherPokemon = pokemon.some((p) => p.hp > 0);
      if (hasOtherPokemon) setStage(25);
      else setStage(26);
      return;
    }

    if (stage === 26) { setStage(27); return; }

    if (stage === 27) {
      setStage(28);
      setTimeout(() => dispatch(recoverFromFainting()), 1000);
      setTimeout(() => endEncounter_(true), 1500);
      return;
    }

    if (stage === 29) {
      const move = getLearnedMove(processingPokemon);
      if (!move) throw new Error("No move found");
      dispatch(
        updateSpecificPokemon({
          index: involvedPokemon[processingInvolvedPokemon],
          pokemon: {
            ...processingPokemon,
            moves: [...processingPokemon.moves, move],
          },
        })
      );
      endEncounter_();
    }

    if (stage === 30) setStage(31);
    if (stage === 31) setStage(32);
    if (stage === 32) setStage(33);

    if ([42, 43, 44].includes(stage)) setStage(11);

    if (stage === 45) {
      if (!enemy) throw new Error("No enemy found");
      if (!enemyMetadata) throw new Error("No enemy metadata found");
      dispatch(
        addPokemon({
          id: enemy.id,
          level: enemy.level,
          xp: 0,
          moves: enemy.moves.map((move) => ({
            id: move,
            pp: getMoveMetadata(move).pp || 0,
          })),
          hp: enemyStats.hp,
          shiny: enemy.shiny,
        })
      );
      endEncounter_();
    }

    if (stage === 50) setStage(51);

    if (stage === 51) {
      if (!trainer) throw new Error("No trainer found");
      if (trainer.outtro.length - 1 > outroIndex) {
        setOutroIndex(outroIndex + 1);
      } else {
        setStage(52);
      }
    }

    if (stage === 52) {
      if (!trainer) throw new Error("No trainer found");
      dispatch(gainMoney(trainer.money || 0));
      endEncounter_();
    }
  });

  if (!isInBattle) return null;

  const text = () => {
    if (clickableNotice) return clickableNotice;
    if (alertText) return alertText;
    if (stage === 2) {
      if (isTrainer)
        return `${trainer?.npc.name.toUpperCase()} wants to fight!`;
      return enemy.shiny
        ? `A shiny wild ${enemyMetadata.name.toUpperCase()} appeared!`
        : `Wild ${enemyMetadata.name.toUpperCase()} appeared!`;
    }
    if (stage >= 4 && stage < 10)
      return `Go! ${activeMetadata.name.toUpperCase()}!`;
    if (stage === 12) return "Got away safely!";
    if (stage === 20)
      return `Enemy ${enemyMetadata.name.toUpperCase()} fainted!`;
    if (stage === 21) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      return `${processingMetadata.name.toUpperCase()} gained ${Math.round(
        getXp(enemy.id, enemy.level) / involvedPokemon.length
      )} EXP. points!`;
    }
    if (stage === 22) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      return `${processingMetadata.name.toUpperCase()} grew to level ${
        getLevelData(processingPokemon.level, processingPokemon.xp).level
      }!`;
    }
    if (stage === 24) return `${activeMetadata?.name?.toUpperCase() ?? "POKeMON"} fainted!`;
    if (stage === 26) return `${name} is out of usable POKeMON!`;
    if (stage === 27) return `${name} blacked out!`;
    if (stage === 29) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      const move = getLearnedMove(processingPokemon);
      if (!move) throw new Error("No move found");
      return `${processingMetadata.name.toUpperCase()} learned ${move.id}!`;
    }
    if (stage === 30) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      const move = getLearnedMove(processingPokemon);
      if (!move) throw new Error("No move found");
      return `${processingMetadata.name.toUpperCase()} is trying to learn ${move.id}.`;
    }
    if (stage === 31) return `But it cannot learn more than 4 moves`;
    if (stage === 32) return `Choose a move you would like to forget`;
    if (stage === 42) return `Darn! The POKeMON broke free!`;
    if (stage === 43) return `Aww! It appeared to be caught!`;
    if (stage === 44) return `Shoot! It was so close too!`;
    if (stage === 45)
      return enemy.shiny
        ? `All right! Shiny ${enemyMetadata.name.toUpperCase()} was caught!`
        : `All right! ${enemyMetadata.name.toUpperCase()} was caught!`;
    if (stage === 48 || stage === 49) {
      return `${trainer?.npc.name.toUpperCase()} sent out ${enemyMetadata.name.toUpperCase()}!`;
    }
    if (stage === 50)
      return `${name.toUpperCase()} defeated ${trainer?.npc.name.toUpperCase()}!`;
    if (stage === 51) return trainer?.outtro[outroIndex] || "";
    if (stage === 52)
      return `${name.toUpperCase()} got $${trainer?.money} for winning!`;

    return "";
  };

  const getRandomEnemyMove = () => {
    return enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
  };

  const getActiveMovesFirst = (
    activeMove: MoveMetadata,
    enemyMove: MoveMetadata
  ) => {
    if (activeMove.priority > enemyMove.priority) return true;
    if (activeMove.priority < enemyMove.priority) return false;
    return activeStats.speed > enemyStats.speed;
  };

  const processMoveResult = (
    result: MoveResult,
    isAttacking: boolean
  ): { us: PokemonInstance; them: PokemonEncounterType } => {
    const {
      us,
      them,
      missed,
      superEffective,
      moveName,
      critical,
      notVeryEffective,
    } = result;
    if (isAttacking) {
      setAlertText(
        `${activeMetadata.name.toUpperCase()} used ${moveName.toUpperCase()}!`
      );
      setStage(15);
      setTimeout(() => {
        dispatch(updatePokemonEncounter(them));
        dispatch(updatePokemon(us));

        if (missed) {
          setAlertText(
            `${activeMetadata.name.toUpperCase()}'s attack missed!`
          );
        } else if (critical) {
          setAlertText(`A critical hit!`);
          setStage(17);
        } else if (superEffective) {
          setAlertText(`It's super effective!`);
          setStage(17);
        } else if (notVeryEffective) {
          setAlertText(`It's not very effective...`);
          setStage(17);
        } else {
          setStage(17);
        }
      }, ATTACK_ANIMATION);
    }

    if (!isAttacking) {
      setAlertText(
        `Enemy ${enemyMetadata.name.toUpperCase()} used ${moveName.toUpperCase()}!`
      );
      setStage(18);
      setTimeout(() => {
        dispatch(updatePokemonEncounter(them));
        dispatch(updatePokemon(us));

        if (missed) {
          setAlertText(
            `${enemyMetadata.name.toUpperCase()}'s attack missed!`
          );
        } else if (critical) {
          setAlertText(`A critical hit!`);
          setStage(19);
        } else if (superEffective) {
          setAlertText(`It's super effective!`);
          setStage(19);
        } else if (notVeryEffective) {
          setAlertText(`It's not very effective...`);
          setStage(19);
        } else {
          setStage(19);
        }
      }, ATTACK_ANIMATION);
    }

    setTimeout(() => setAlertText(null), ATTACK_ANIMATION + 1000);
    return { us, them };
  };

  /**
   * Process a battle turn. speedBonus affects player's attack damage.
   * speedBonus = 0 means the attack was wrong (miss).
   */
  const processBattle = (attackId: string, speedBonus: number = 1.0) => {
    const activeMove = getMoveMetadata(attackId);
    const enemyMove = getMoveMetadata(getRandomEnemyMove());
    const activeMovesFirst = getActiveMovesFirst(activeMove, enemyMove);

    // If wrong answer (speedBonus = 0), force a miss
    const forcePlayerMiss = speedBonus === 0;

    if (activeMovesFirst) {
      let ourResult: MoveResult;
      if (forcePlayerMiss) {
        // Create a "missed" result
        ourResult = {
          us: active,
          them: enemy,
          missed: true,
          superEffective: false,
          moveName: activeMove.name,
          critical: false,
          notVeryEffective: false,
          isBuff: false,
          isDebuff: false,
        };
      } else {
        ourResult = processMove(active, enemy, attackId, true);
      }
      const { us, them } = processMoveResult(ourResult, true);

      setTimeout(() => {
        if (them.hp <= 0) {
          setStage(20);
        } else {
          const { us: usNew } = processMoveResult(
            processMove(us, them, enemyMove.id, false),
            false
          );
          setTimeout(() => {
            if (usNew.hp <= 0) setStage(24);
            else setStage(11);
          }, ATTACK_ANIMATION + 1000);
        }
      }, ATTACK_ANIMATION + 1000);
    } else {
      const { us, them } = processMoveResult(
        processMove(active, enemy, enemyMove.id, false),
        false
      );

      setTimeout(() => {
        if (us.hp <= 0) {
          setStage(24);
        } else {
          let ourResult: MoveResult;
          if (forcePlayerMiss) {
            ourResult = {
              us,
              them,
              missed: true,
              superEffective: false,
              moveName: activeMove.name,
              critical: false,
              notVeryEffective: false,
              isBuff: false,
              isDebuff: false,
            };
          } else {
            ourResult = processMove(us, them, attackId, true);
          }
          const { them: themAfterAttack } = processMoveResult(ourResult, true);
          setTimeout(() => {
            if (themAfterAttack.hp <= 0) setStage(20);
            else setStage(11);
          }, ATTACK_ANIMATION + 1000);
        }
      }, ATTACK_ANIMATION + 1000);
    }
  };

  // -------------------------------------------------------------------------
  // Math-gated action handlers
  // -------------------------------------------------------------------------

  const handleFight = () => {
    if (mathEnabled) {
      // Show move select first, then math will trigger in onMoveSelected
      setStage(14);
    } else {
      setStage(14);
    }
  };

  const onMoveSelected = (moveId: string) => {
    if (mathEnabled) {
      mathEngine.startChallenge("attack", { type: "attack", moveId });
    } else {
      processBattle(moveId);
    }
  };

  const handleRun = () => {
    if (isTrainer) {
      setClickableNotice("No running from trainer battle.");
      return;
    }
    if (mathEnabled) {
      mathEngine.startChallenge("run", { type: "run" });
    } else {
      setStage(12);
    }
  };

  const handleItem = () => {
    if (mathEnabled) {
      mathEngine.startChallenge("item", { type: "item" });
    } else {
      dispatch(showItemsMenu());
    }
  };

  const handleSwitch = (index: number) => {
    if (mathEnabled) {
      mathEngine.startChallenge("switch", {
        type: "switch",
        pokemonIndex: index,
      });
    } else {
      dispatch(setActivePokemon(index));
      setInvolvedPokemon([...involvedPokemon, index]);
      throwPokeball();
    }
  };

  const leftImage = () => {
    if (stage <= 3) return playerBack;
    if (stage === 46) return playerBack;
    if (stage === 48) return playerBack;
    if (isThrowingEnemyPokeball && trainerPokemonIndex === 0) return playerBack;
    if (stage === 5) return ball1;
    if (stage === 6) return ball2;
    if (stage === 7) return ball3;
    if (stage === 8) return ball4;
    if (stage === 9) return ball5;
    if (stage >= 10) return activeMetadata.images.back;
  };

  const rightImage = () => {
    if (stage === 34) return ball1;
    if (stage === 35) return ball2;
    if (stage === 36) return ball3;
    if (stage === 37) return ball4;
    if (stage === 38) return ball5;
    if (stage === 39) return ballIdle;
    if (stage === 40) return ballLeft;
    if (stage === 41) return ballRight;
    if (stage === 45) return ballRight;
    if (stage < 3 && isTrainer) return trainer?.npc.portrait;
    if (stage === 46) return trainer?.npc.portrait;
    if (stage === 51) return trainer?.npc.portrait;
    if (stage === 52) return trainer?.npc.portrait;
    return enemyMetadata.images.front;
  };

  return (
    <>
      {stage === 0 && (
        <>
          <RightSide />
          <LeftSide />
        </>
      )}
      {stage >= 1 && (
        <>
          <StyledPokemonEncounter>
            <Row
              style={{
                opacity: [20, 21, 22, 50].includes(stage) ? "0" : "1",
              }}
            >
              <LeftInfoSection
                style={{
                  opacity:
                    stage >= 3 &&
                    ![46, 51, 52].includes(stage) &&
                    !isThrowingEnemyPokeball
                      ? "1"
                      : "0",
                }}
              >
                <Name>{enemy.shiny ? "\u2728 " : ""}{enemyMetadata.name}</Name>
                <Level>{`:L${enemy.level}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={enemy.hp}
                    maxHealth={enemyStats.hp}
                  />
                </HealthBarContainer>
                <Corner src={corner} />
              </LeftInfoSection>
              <ImageContainer $flashing={stage === 17}>
                <AttackRight $attacking={stage === 18}>
                  <ChangeEnemyPokemon $changing={[46].includes(stage)}>
                    <div style={enemy.shiny && stage >= 10 && stage <= 33 ? { filter: "hue-rotate(90deg) saturate(1.4) brightness(1.1)" } : undefined}>
                      <RightImage src={rightImage()} />
                    </div>
                  </ChangeEnemyPokemon>
                </AttackRight>
              </ImageContainer>
            </Row>
            <Row
              style={{
                opacity: [24, 26, 27, 28].includes(stage) ? "0" : "1",
              }}
            >
              <ImageContainer $flashing={stage === 19}>
                <AttackLeft $attacking={stage === 15}>
                  <ChangePokemon $changing={[3, 25].includes(stage)}>
                    <LeftImage src={leftImage()} />
                  </ChangePokemon>
                </AttackLeft>
              </ImageContainer>
              <RightInfoSection
                style={{
                  opacity:
                    stage >= 11 &&
                    ![46, 48].includes(stage) &&
                    !isThrowingEnemyPokeball
                      ? "1"
                      : "0",
                }}
              >
                <Name>{activeMetadata.name}</Name>
                <Level>{`:L${active.level}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={active.hp}
                    maxHealth={activeStats.hp}
                  />
                </HealthBarContainer>
                <Health>{`${active.hp}/${activeStats.hp}`}</Health>
                <CornerContainer>
                  <CornerRight src={corner} />
                </CornerContainer>
              </RightInfoSection>
            </Row>
          </StyledPokemonEncounter>
          <TextContainer>
            <Frame
              wide
              tall
              flashing={
                [
                  2, 20, 21, 22, 24, 26, 27, 29, 30, 31, 32, 42, 43, 44, 45,
                  48, 49, 50, 51, 52,
                ].includes(stage) || !!clickableNotice
              }
            >
              {text()}
            </Frame>
          </TextContainer>
          <Menu
            compact
            show={stage === 11 && !clickableNotice && !showingMath}
            disabled={itemMenuOpen || startMenuOpen}
            menuItems={[
              {
                label: "Fight",
                action: handleFight,
              },
              {
                pokemon: true,
                label: "PKMN",
                action: () => setStage(13),
              },
              {
                label: "Item",
                action: handleItem,
              },
              {
                label: "Run",
                action: handleRun,
              },
            ]}
            noExit
            close={() => {}}
            bottom="0"
            right="0"
          />
          {stage === 13 && !showingMath && (
            <PokemonList
              close={() => setStage(11)}
              switchAction={(index) => handleSwitch(index)}
            />
          )}
          <MoveSelect
            show={stage === 14 && !showingMath}
            select={(move: string) => onMoveSelected(move)}
            close={() => setStage(11)}
          />
          {stage === 25 && (
            <PokemonList
              text="Bring out which POKeMON?"
              close={() => {}}
              switchAction={(index) => {
                if (pokemon[index].hp <= 0) return;
                dispatch(setActivePokemon(index));
                setInvolvedPokemon([...involvedPokemon, index]);
                throwPokeball();
              }}
            />
          )}
          <Menu
            noExitOption
            disabled={startMenuOpen}
            padding={isMobile ? "100px" : "40vw"}
            show={stage === 33}
            menuItems={[
              ...processingPokemon.moves.map((m) => {
                const newMove = getLearnedMove(processingPokemon);
                if (!newMove)
                  return { label: "Error", action: () => {} };
                const item: MenuItemType = {
                  label: m.id,
                  action: () => {
                    endEncounter_();
                    dispatch(
                      updateSpecificPokemon({
                        index: involvedPokemon[processingInvolvedPokemon],
                        pokemon: {
                          ...processingPokemon,
                          moves: [
                            ...processingPokemon.moves.filter(
                              (move) => move.id !== m.id
                            ),
                            newMove,
                          ],
                        },
                      })
                    );
                  },
                };
                return item;
              }),
              {
                label: getLearnedMove(processingPokemon)?.id || "Error",
                action: () => endEncounter_(),
              },
            ]}
            close={() => endEncounter_()}
            bottom="0"
            right="0"
          />
          <BlackOverlay style={{ opacity: stage === 28 ? "1" : "0" }} />

          {/* Math Overlay - renders on top during math challenges */}
          {showingMath && (
            <MathOverlay
              streak={mathEngine.getStreak()}
              onAnswer={mathEngine.handleAnswer}
              onHint={mathEngine.handleHint}
              onTimeout={mathEngine.handleTimeout}
            />
          )}
        </>
      )}
    </>
  );
};

export default PokemonEncounter;
