import { useDispatch, useSelector } from "react-redux";
import Menu from "./Menu";
import {
  hideStartMenu,
  selectConfirmationMenu,
  selectStartMenu,
  selectStartMenuSubOpen,
  showConfirmationMenu,
  showItemsMenu,
  showPlayerMenu,
  showStartMenu,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import emitter, { Event } from "../app/emitter";
import { useState } from "react";
import {
  save,
  selectName,
  selectPokemon,
  updateSpecificPokemon,
} from "../state/gameSlice";
import PokemonList from "./PokemonList";
import { DEBUG_MODE } from "../app/constants";
import { getPokemonStats } from "../app/use-pokemon-stats";
import {
  showMathPokedex as setShowMathPokedex,
  showParentDashboard as setShowParentDashboard,
  showDailyChallenge as setShowDailyChallenge,
  showMathLab as setShowMathLab,
  showMathBadges as setShowMathBadges,
} from "../state/mathSlice";
import { saveSettings } from "../state/settingsSlice";

const StartMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectStartMenu);
  const disabled = useSelector(selectStartMenuSubOpen);
  const name = useSelector(selectName);
  const saving = !!useSelector(selectConfirmationMenu);
  const allPokemon = useSelector(selectPokemon);

  const [pokemon, setPokemon] = useState(false);
  const [showingMathMenu, setShowingMathMenu] = useState(false);

  useEvent(Event.Start, () => {
    dispatch(showStartMenu());
    emitter.emit(Event.StopMoving);
  });

  if (showingMathMenu) {
    return (
      <Menu
        show={show}
        close={() => setShowingMathMenu(false)}
        disabled={disabled || saving}
        menuItems={[
          {
            label: "Math Lab",
            action: () => {
              dispatch(setShowMathLab());
              dispatch(hideStartMenu());
              setShowingMathMenu(false);
            },
          },
          {
            label: "Pokedex",
            action: () => {
              dispatch(setShowMathPokedex());
              dispatch(hideStartMenu());
              setShowingMathMenu(false);
            },
          },
          {
            label: "Badges",
            action: () => {
              dispatch(setShowMathBadges());
              dispatch(hideStartMenu());
              setShowingMathMenu(false);
            },
          },
          {
            label: "Challenge",
            action: () => {
              dispatch(setShowDailyChallenge());
              dispatch(hideStartMenu());
              setShowingMathMenu(false);
            },
          },
          {
            label: "Stats",
            action: () => {
              dispatch(setShowParentDashboard());
              dispatch(hideStartMenu());
              setShowingMathMenu(false);
            },
          },
        ]}
      />
    );
  }

  return (
    <>
      <Menu
        disabled={disabled || saving || pokemon}
        show={show}
        close={() => dispatch(hideStartMenu())}
        menuItems={[
          {
            label: "POKeMON",
            action: () => {
              if (allPokemon.length === 0) return;
              setPokemon(true);
            },
          },
          {
            label: "Item",
            action: () => dispatch(showItemsMenu()),
          },
          {
            label: "Math",
            action: () => setShowingMathMenu(true),
          },
          {
            label: "Player",
            action: () => dispatch(showPlayerMenu()),
          },
          {
            label: "Save",
            action: () => {
              dispatch(
                showConfirmationMenu({
                  preMessage: "Would you like to SAVE the game?",
                  postMessage: `${name} saved the game!`,
                  confirm: () => {
                    dispatch(save());
                    dispatch(saveSettings());
                  },
                })
              );
            },
          },
          ...(DEBUG_MODE
            ? [
                {
                  label: "Magic",
                  action: () => {
                    dispatch(
                      updateSpecificPokemon({
                        index: 0,
                        pokemon: {
                          id: 1,
                          level: 15,
                          xp: 0,
                          hp: getPokemonStats(3, 100).hp,
                          moves: [
                            { id: "scratch", pp: 35 },
                            { id: "growl", pp: 40 },
                          ],
                        },
                      })
                    );
                  },
                },
              ]
            : []),
        ]}
      />
      {pokemon && <PokemonList close={() => setPokemon(false)} />}
    </>
  );
};

export default StartMenu;
