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
      0: ["ASH turned on the PC.", "It's not working..."],
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
  // Oak stands at the top-center of the lab behind his desk
  // Rival stands to the right side of the lab
  trainers: [
    {
      npc: oak,
      pokemon: [], // Oak doesn't battle
      facing: Direction.Down,
      intro: [],
      outtro: [
        "OAK: The world is wide and full of POKeMON!",
        "Go explore and catch them all!",
      ],
      money: 0,
      pos: { x: 4, y: 2 },
    },
    {
      npc: rival,
      pokemon: [{ id: 4, level: 5 }], // Rival's starter set dynamically by quest
      facing: Direction.Down,
      intro: [
        "RIVAL: Hey! I was here first!",
        "Gramps, what about me?",
      ],
      outtro: [
        "RIVAL: What? Unbelievable!",
        "I picked the wrong POKeMON!",
      ],
      money: 175,
      pos: { x: 6, y: 3 },
    },
  ],
};

export default lab;
