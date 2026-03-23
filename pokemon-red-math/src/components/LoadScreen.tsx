import styled from "styled-components";
import Menu from "./Menu";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { load, selectHasSave } from "../state/gameSlice";
import {
  hideLoadMenu,
  selectGameboyMenu,
  selectLoadMenu,
  selectTitleMenu,
} from "../state/uiSlice";
import { selectGrade, setEngineState } from "../state/mathSlice";
import { loadSettings } from "../state/settingsSlice";

const StyledLoadScreen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 1000;
  background: var(--bg);
`;

const LoadScreen = () => {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);
  const hasSave = useSelector(selectHasSave);
  const titleOpen = useSelector(selectTitleMenu);
  const show = useSelector(selectLoadMenu);
  const gameboyOpen = useSelector(selectGameboyMenu);

  const loadComplete = () => {
    setLoaded(true);
    setTimeout(() => {
      dispatch(hideLoadMenu());
    }, 300);
  };

  const newGame = {
    label: "New Game",
    action: () => {
      loadComplete();
    },
  };

  const loadGame = {
    label: "Continue",
    action: () => {
      dispatch(load());
      // Restore math state from the saved game state
      try {
        const savedGame = localStorage.getItem("mathquest-save");
        if (savedGame) {
          const parsed = JSON.parse(savedGame);
          if (parsed.mathGrade !== undefined && parsed.mathGrade >= 0) {
            dispatch(selectGrade(parsed.mathGrade));
          }
          if (parsed.mathEngineState) {
            dispatch(setEngineState(parsed.mathEngineState));
          }
        }
      } catch {
        // Ignore errors
      }
      // Restore settings
      dispatch(loadSettings());
      loadComplete();
    },
  };

  if (!show) return null;

  return (
    <StyledLoadScreen>
      <Menu
        disabled={titleOpen || gameboyOpen}
        show={!loaded}
        menuItems={hasSave ? [loadGame, newGame] : [newGame]}
        close={() => setLoaded(true)}
        noExit
        top="2px"
        left="2px"
        padding="7vw"
      />
    </StyledLoadScreen>
  );
};

export default LoadScreen;
