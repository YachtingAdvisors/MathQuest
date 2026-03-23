import labImage from "../assets/map/lab.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { oak, rival } from "../app/npcs";

import music from "../assets/music/maps/oaks-laboratory.mp3";

const lab: MapType = {
  name: "Lab",
  image: labImage,
  height: 12,
  width: 10,
  start: {
    x: 5,
    y: 10,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 1, 2, 3, 6, 7, 8, 9],
    3: [6, 7, 8],
    6: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 6, 7, 8, 9],
  },
  text: {
    1: {
      0: ["Turned on the PC.", "It's not working..."],
    },
  },
  maps: {},
  exits: {
    11: [4, 5],
  },
  exitReturnPos: {
    x: 12,
    y: 12,
  },
  exitReturnMap: MapId.PalletTown,
  music,
  grass: {},
  // Oak and rival are visible in the lab as NPCs.
  // StarterSelect handles the actual starter picking dialogue.
  // These trainers are pre-marked as defeated in gameSlice initialState
  // so TrainerEncounter won't trigger battles — only shows outtro if talked to.
  trainers: [
    {
      npc: oak,
      pokemon: [{ id: 1, level: 5 }],
      facing: Direction.Down,
      intro: ["OAK: Choose a POKeMON from the table!"],
      outtro: [
        "OAK: Go on! The POKe BALLS are on the table!",
        "Choose wisely!",
      ],
      money: 0,
      pos: { x: 4, y: 2 },
    },
    {
      npc: rival,
      pokemon: [{ id: 4, level: 5 }],
      facing: Direction.Down,
      intro: ["Heh, I'm going to get the best one!"],
      outtro: [
        "I'm waiting for you to pick first!",
        "Hurry up already!",
      ],
      money: 0,
      pos: { x: 6, y: 3 },
    },
  ],
};

export default lab;
