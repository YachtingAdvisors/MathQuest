import styled from "styled-components";

import { useSelector } from "react-redux";
import { selectPos, selectMap } from "../state/gameSlice";
import Character from "./Character";
import Text from "./Text";
import MapChangeHandler from "./MapChangeHandler";
import StartMenu from "./StartMenu";
import KeyboardHandler from "./KeyboardHandler";
import MovementHandler from "./MovementHandler";
import ItemsMenu from "./ItemsMenu";
import PlayerMenu from "./PlayerMenu";
import PixelImage from "../styles/PixelImage";
import TitleScreen from "./TitleScreen";
import LoadScreen from "./LoadScreen";
import SoundHandler from "./SoundHandler";
import GameboyMenu from "./GameboyMenu";
import EncounterHandler from "./EncounterHandler";
import PokemonEncounter from "./PokemonEncounter";
import ActionOnPokemon from "./ActionOnPokemon";
import PokemonCenter from "./PokemonCenter";
import Pc from "./Pc";
import PokeMart from "./PokeMart";
import SpinningHandler from "./SpinningHandler";
import { MapItemType, TrainerType } from "../maps/map-types";
import Trainer from "./Trainer";
import { xToPx, yToPx } from "../app/position-helper";
import DebugOverlay from "./DebugOverlay";
import TrainerEncounter from "./TrainerEncounter";
import Item from "./Item";
import TextThenAction from "./TextThenAction";
import LearnMove from "../app/LearnMove";
import QuestHandler from "./QuestHandler";
import ConfirmationMenu from "./ConfirmationMenu";
import Evolution from "./Evolution";
import SpeedControl from "./SpeedControl";
import IntroSequence from "./IntroSequence";
import RareCounter from "./RareCounter";
import StarterSelect, { LabPokeballs } from "./StarterSelect";
import MathPokedex from "./MathPokedex";
import ParentDashboard from "./ParentDashboard";
import DailyChallenge from "./DailyChallenge";
import MathLab from "./MathLab";
import MathBadges from "./MathBadges";
import { useSelector as useSelectorTyped, useDispatch as useDispatchTyped } from "react-redux";
import { RootState } from "../state/store";
import {
  hideMathPokedex,
  hideParentDashboard,
  hideDailyChallenge,
  hideMathLab,
  hideMathBadges,
} from "../state/mathSlice";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const StyledGame = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
  transform: translate(
    calc(50% - ${xToPx(1)} / 2),
    calc(50% - ${yToPx(1)} / 2)
  );
`;

const BackgroundContainer = styled.div<{ $speed?: number }>`
  position: absolute;
  top: 0;
  left: 0;

  transition: transform ${(p) => Math.max(0.03, 0.2 / (p.$speed || 1))}s steps(5, end);
`;

interface BackgroundProps {
  width: number;
  height: number;
}

const Background = styled(PixelImage)<BackgroundProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => xToPx(props.width)};
  height: ${(props) => yToPx(props.height)};
`;

const ColorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  mix-blend-mode: darken;
  opacity: 0.5;
`;

const Game = () => {
  const dispatch = useDispatchTyped();
  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const mathState = useSelectorTyped((state: RootState) => state.math);
  const gradeSelected = mathState?.gradeSelected;
  const grade = mathState?.grade ?? 3;
  const masteryData = mathState?.engineState?.masteryByType ?? {};
  const gameSpeed = useSelectorTyped((state: RootState) => (state as any).settings?.gameSpeed ?? 1);

  return (
    <Container>
      <StyledGame>
        <BackgroundContainer
          $speed={gameSpeed}
          style={{
            transform: `translate(${xToPx(-pos.x)}, ${yToPx(-pos.y)})`,
          }}
        >
          <Background src={map.image} width={map.width} height={map.height} />
          {map.trainers &&
            map.trainers.map((trainer: TrainerType, index: number) => (
              <Trainer key={index} trainer={trainer} />
            ))}
          {map.items &&
            map.items.map((item: MapItemType, index: number) => (
              <Item key={index} item={item} />
            ))}
          <LabPokeballs />
          <DebugOverlay />
        </BackgroundContainer>
        <Character />
      </StyledGame>

      <ColorOverlay />
      <TrainerEncounter />
      <PokemonEncounter />
      <Text />
      <PokemonCenter />
      <Pc />
      <PokeMart />
      <TextThenAction />
      <StartMenu />
      <ItemsMenu />
      <LearnMove />
      <PlayerMenu />
      <ActionOnPokemon />
      <Evolution />
      <ConfirmationMenu />
      <MathPokedex
        show={!!mathState?.showMathPokedex}
        close={() => dispatch(hideMathPokedex())}
        masteryData={masteryData}
      />
      <ParentDashboard
        show={!!mathState?.showParentDashboard}
        close={() => dispatch(hideParentDashboard())}
        engineState={mathState?.engineState}
      />
      <DailyChallenge
        show={!!mathState?.showDailyChallenge}
        close={() => dispatch(hideDailyChallenge())}
        grade={grade}
      />
      <MathLab
        show={!!mathState?.showMathLab}
        close={() => dispatch(hideMathLab())}
        grade={grade}
      />
      <MathBadges
        show={!!mathState?.showMathBadges}
        close={() => dispatch(hideMathBadges())}
        masteryData={masteryData}
      />
      <StarterSelect />
      <RareCounter />
      {gradeSelected && <SpeedControl />}
      <IntroSequence />
      <LoadScreen />
      <TitleScreen />
      <GameboyMenu />

      {/* Handlers */}
      <MapChangeHandler />
      <KeyboardHandler />
      <MovementHandler />
      <SoundHandler />
      <EncounterHandler />
      <SpinningHandler />
      <QuestHandler />
    </Container>
  );
};

export default Game;
