/**
 * GameData - Complete Game Data for MathQuest RPG
 *
 * Contains all creatures, moves, type effectiveness, items, maps, NPCs,
 * progression gates, and utility functions for a Pokemon FireRed-style
 * browser RPG math game designed for 2nd-4th graders.
 *
 * Exported via window.GameData.
 *
 * @version 1.0.0
 */
(function () {
  'use strict';

  // ===========================================================================
  // MOVES
  // ===========================================================================

  var moves = {
    // --- Normal ---
    tackle: {
      id: 'tackle',
      name: 'Tackle',
      type: 'normal',
      power: 35,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'A basic charge attack. Every creature knows this one!',
      effect: null,
    },
    quickStrike: {
      id: 'quickStrike',
      name: 'Quick Strike',
      type: 'normal',
      power: 45,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'A swift strike that hits before the opponent can react.',
      effect: null,
    },
    slam: {
      id: 'slam',
      name: 'Slam',
      type: 'normal',
      power: 60,
      accuracy: 0.85,
      mathContext: 'attack',
      description: 'A powerful body slam that shakes the ground.',
      effect: null,
    },

    // --- Fire ---
    ember: {
      id: 'ember',
      name: 'Ember',
      type: 'fire',
      power: 40,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'A small flame that singes the target.',
      effect: null,
    },
    flameBurst: {
      id: 'flameBurst',
      name: 'Flame Burst',
      type: 'fire',
      power: 65,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'An eruption of flames that explodes on impact.',
      effect: null,
    },
    blazeStorm: {
      id: 'blazeStorm',
      name: 'Blaze Storm',
      type: 'fire',
      power: 90,
      accuracy: 0.80,
      mathContext: 'boss',
      description: 'A raging firestorm that engulfs everything nearby.',
      effect: null,
    },

    // --- Water ---
    waterSplash: {
      id: 'waterSplash',
      name: 'Water Splash',
      type: 'water',
      power: 40,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'A playful splash of water that stings more than you think.',
      effect: null,
    },
    tidalWave: {
      id: 'tidalWave',
      name: 'Tidal Wave',
      type: 'water',
      power: 65,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'A surging wave that crashes into the target.',
      effect: null,
    },
    oceanFury: {
      id: 'oceanFury',
      name: 'Ocean Fury',
      type: 'water',
      power: 90,
      accuracy: 0.80,
      mathContext: 'boss',
      description: 'The full fury of the ocean unleashed in a single strike.',
      effect: null,
    },

    // --- Grass ---
    vineWhip: {
      id: 'vineWhip',
      name: 'Vine Whip',
      type: 'grass',
      power: 40,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'Thorny vines lash out at the target.',
      effect: null,
    },
    thornBarrage: {
      id: 'thornBarrage',
      name: 'Thorn Barrage',
      type: 'grass',
      power: 65,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'A rapid volley of sharp thorns fired at the target.',
      effect: null,
    },
    naturesWrath: {
      id: 'naturesWrath',
      name: "Nature's Wrath",
      type: 'grass',
      power: 90,
      accuracy: 0.80,
      mathContext: 'boss',
      description: 'The forest itself rises up to smash the opponent.',
      effect: null,
    },

    // --- Electric ---
    spark: {
      id: 'spark',
      name: 'Spark',
      type: 'electric',
      power: 40,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'A small jolt of electricity zaps the target.',
      effect: null,
    },
    thunderBolt: {
      id: 'thunderBolt',
      name: 'Thunder Bolt',
      type: 'electric',
      power: 65,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'A crackling bolt of lightning strikes from above.',
      effect: null,
    },
    lightningStorm: {
      id: 'lightningStorm',
      name: 'Lightning Storm',
      type: 'electric',
      power: 90,
      accuracy: 0.80,
      mathContext: 'boss',
      description: 'A massive electrical storm that lights up the sky.',
      effect: null,
    },

    // --- Rock ---
    rockThrow: {
      id: 'rockThrow',
      name: 'Rock Throw',
      type: 'rock',
      power: 50,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'A heavy rock hurled at the target with surprising force.',
      effect: null,
    },
    boulderCrush: {
      id: 'boulderCrush',
      name: 'Boulder Crush',
      type: 'rock',
      power: 75,
      accuracy: 0.85,
      mathContext: 'attack',
      description: 'A massive boulder slams down from above.',
      effect: null,
    },

    // --- Ghost ---
    shadowWisp: {
      id: 'shadowWisp',
      name: 'Shadow Wisp',
      type: 'ghost',
      power: 45,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'A ghostly wisp drifts through the target, chilling them.',
      effect: null,
    },
    phantomStrike: {
      id: 'phantomStrike',
      name: 'Phantom Strike',
      type: 'ghost',
      power: 70,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'An invisible force strikes from the shadows.',
      effect: null,
    },

    // --- Flying ---
    wingSlash: {
      id: 'wingSlash',
      name: 'Wing Slash',
      type: 'flying',
      power: 45,
      accuracy: 0.95,
      mathContext: 'attack',
      description: 'Razor-sharp wings slice through the air.',
      effect: null,
    },
    skyDive: {
      id: 'skyDive',
      name: 'Sky Dive',
      type: 'flying',
      power: 70,
      accuracy: 0.90,
      mathContext: 'attack',
      description: 'A high-speed dive from the clouds. Hard to dodge!',
      effect: null,
    },

    // --- Mystic ---
    numberBlast: {
      id: 'numberBlast',
      name: 'Number Blast',
      type: 'mystic',
      power: 55,
      accuracy: 0.92,
      mathContext: 'attack',
      description: 'Glowing numbers swirl together and blast the target.',
      effect: null,
    },
    equationBeam: {
      id: 'equationBeam',
      name: 'Equation Beam',
      type: 'mystic',
      power: 80,
      accuracy: 0.85,
      mathContext: 'boss',
      description: 'A beam of pure mathematical energy. Solves problems and opponents alike.',
      effect: null,
    },

    // --- Heal / Support ---
    healPulse: {
      id: 'healPulse',
      name: 'Heal Pulse',
      type: 'normal',
      power: 0,
      accuracy: 1.0,
      mathContext: 'heal',
      description: 'A warm pulse of energy restores health.',
      effect: { type: 'heal', amount: 0.30 },
    },
    shieldUp: {
      id: 'shieldUp',
      name: 'Shield Up',
      type: 'normal',
      power: 0,
      accuracy: 1.0,
      mathContext: 'defend',
      description: 'Raises a protective shield that boosts defense.',
      effect: { type: 'buff', stat: 'defense', stages: 1 },
    },
    speedBoost: {
      id: 'speedBoost',
      name: 'Speed Boost',
      type: 'normal',
      power: 0,
      accuracy: 1.0,
      mathContext: 'defend',
      description: 'Focus your mind to move faster than ever.',
      effect: { type: 'buff', stat: 'speed', stages: 1 },
    },
    powerUp: {
      id: 'powerUp',
      name: 'Power Up',
      type: 'normal',
      power: 0,
      accuracy: 1.0,
      mathContext: 'attack',
      description: 'Channel your inner strength to hit harder.',
      effect: { type: 'buff', stat: 'attack', stages: 1 },
    },
  };

  // ===========================================================================
  // CREATURES
  // ===========================================================================

  var creatures = {
    // -------------------------------------------------------------------------
    // Starters
    // -------------------------------------------------------------------------
    flametail: {
      id: 'flametail',
      name: 'Flametail',
      type: 'fire',
      baseHP: 45,
      baseAttack: 52,
      baseDefense: 43,
      baseSpeed: 65,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'ember', learnLevel: 1 },
        { moveId: 'quickStrike', learnLevel: 5 },
        { moveId: 'flameBurst', learnLevel: 8 },
        { moveId: 'speedBoost', learnLevel: 10 },
      ],
      evolveLevel: 12,
      evolveTo: 'blazefang',
      catchRate: 0,
      xpYield: 62,
      description: 'A fiery little fox with a tail that flickers like a candle. Its speed makes it hard to catch!',
      mathAffinity: 'multiplication',
      spriteKey: 'flametail',
    },

    aquapup: {
      id: 'aquapup',
      name: 'Aquapup',
      type: 'water',
      baseHP: 50,
      baseAttack: 48,
      baseDefense: 55,
      baseSpeed: 43,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'waterSplash', learnLevel: 1 },
        { moveId: 'shieldUp', learnLevel: 5 },
        { moveId: 'tidalWave', learnLevel: 8 },
        { moveId: 'healPulse', learnLevel: 10 },
      ],
      evolveLevel: 12,
      evolveTo: 'tidalfang',
      catchRate: 0,
      xpYield: 62,
      description: 'A playful otter pup that loves to splash around. It never backs down from a challenge!',
      mathAffinity: 'division',
      spriteKey: 'aquapup',
    },

    thornsprout: {
      id: 'thornsprout',
      name: 'Thornsprout',
      type: 'grass',
      baseHP: 55,
      baseAttack: 49,
      baseDefense: 55,
      baseSpeed: 40,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'vineWhip', learnLevel: 1 },
        { moveId: 'healPulse', learnLevel: 5 },
        { moveId: 'thornBarrage', learnLevel: 8 },
        { moveId: 'shieldUp', learnLevel: 10 },
      ],
      evolveLevel: 12,
      evolveTo: 'thornraptor',
      catchRate: 0,
      xpYield: 62,
      description: 'A sturdy little dinosaur with a leafy mane. It can take a hit and keep on going!',
      mathAffinity: 'skipCounting',
      spriteKey: 'thornsprout',
    },

    leafbara: {
      id: 'leafbara',
      name: 'Leafbara',
      type: 'grass',
      baseHP: 58,
      baseAttack: 49,
      baseDefense: 57,
      baseSpeed: 38,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'vineWhip', learnLevel: 1 },
        { moveId: 'healPulse', learnLevel: 5 },
        { moveId: 'thornBarrage', learnLevel: 8 },
        { moveId: 'shieldUp', learnLevel: 10 },
      ],
      evolveLevel: 12,
      evolveTo: 'thornraptor',
      catchRate: 0,
      xpYield: 62,
      description: 'A calm capybara wrapped in living vines and leaves. Its leaf tornado can sweep away any problem!',
      mathAffinity: 'skipCounting',
      spriteKey: 'leafbara',
    },

    // -------------------------------------------------------------------------
    // Wild creatures
    // -------------------------------------------------------------------------
    sparkling: {
      id: 'sparkling',
      name: 'Sparkling',
      type: 'electric',
      baseHP: 35,
      baseAttack: 55,
      baseDefense: 30,
      baseSpeed: 90,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'spark', learnLevel: 1 },
        { moveId: 'quickStrike', learnLevel: 6 },
        { moveId: 'thunderBolt', learnLevel: 10 },
        { moveId: 'speedBoost', learnLevel: 13 },
      ],
      evolveLevel: 16,
      evolveTo: 'voltpounce',
      catchRate: 0.50,
      xpYield: 55,
      description: 'A tiny spark-covered critter that zips around at blinding speed. Blink and you might miss it!',
      mathAffinity: 'multiplication',
      spriteKey: 'sparkling',
    },

    geolem: {
      id: 'geolem',
      name: 'Geolem',
      type: 'rock',
      baseHP: 70,
      baseAttack: 55,
      baseDefense: 75,
      baseSpeed: 20,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'rockThrow', learnLevel: 1 },
        { moveId: 'shieldUp', learnLevel: 5 },
        { moveId: 'boulderCrush', learnLevel: 9 },
        { moveId: 'slam', learnLevel: 12 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0.40,
      xpYield: 70,
      description: 'A living boulder with glowing crystal eyes. Slow but nearly impossible to knock down!',
      mathAffinity: 'division',
      spriteKey: 'geolem',
    },

    mistwisp: {
      id: 'mistwisp',
      name: 'Mistwisp',
      type: 'ghost',
      baseHP: 40,
      baseAttack: 45,
      baseDefense: 35,
      baseSpeed: 70,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'shadowWisp', learnLevel: 1 },
        { moveId: 'speedBoost', learnLevel: 6 },
        { moveId: 'phantomStrike', learnLevel: 10 },
        { moveId: 'healPulse', learnLevel: 13 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0.30,
      xpYield: 65,
      description: 'A mischievous floating spirit that loves playing tricks. It phases through walls just for fun!',
      mathAffinity: 'missingFactor',
      spriteKey: 'mistwisp',
    },

    skyclaw: {
      id: 'skyclaw',
      name: 'Skyclaw',
      type: 'flying',
      baseHP: 45,
      baseAttack: 60,
      baseDefense: 40,
      baseSpeed: 75,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'wingSlash', learnLevel: 1 },
        { moveId: 'quickStrike', learnLevel: 5 },
        { moveId: 'skyDive', learnLevel: 9 },
        { moveId: 'powerUp', learnLevel: 12 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0.25,
      xpYield: 68,
      description: 'A fierce hawk with talons that gleam like silver. The fastest hunter in the skies!',
      mathAffinity: 'multiplication',
      spriteKey: 'skyclaw',
    },

    numbit: {
      id: 'numbit',
      name: 'Numbit',
      type: 'mystic',
      baseHP: 48,
      baseAttack: 50,
      baseDefense: 50,
      baseSpeed: 55,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'numberBlast', learnLevel: 1 },
        { moveId: 'healPulse', learnLevel: 5 },
        { moveId: 'shieldUp', learnLevel: 8 },
        { moveId: 'equationBeam', learnLevel: 12 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0.15,
      xpYield: 80,
      description: 'A rare creature made of shimmering numbers. Legends say it was born from the first equation ever solved!',
      mathAffinity: 'wordProblem',
      spriteKey: 'numbit',
    },

    // -------------------------------------------------------------------------
    // Evolutions (~30% stat boost)
    // -------------------------------------------------------------------------
    blazefang: {
      id: 'blazefang',
      name: 'Blazefang',
      type: 'fire',
      baseHP: 59,
      baseAttack: 68,
      baseDefense: 56,
      baseSpeed: 85,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'ember', learnLevel: 1 },
        { moveId: 'quickStrike', learnLevel: 5 },
        { moveId: 'flameBurst', learnLevel: 8 },
        { moveId: 'speedBoost', learnLevel: 10 },
        { moveId: 'blazeStorm', learnLevel: 14 },
        { moveId: 'powerUp', learnLevel: 16 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0,
      xpYield: 140,
      description: 'A blazing wolf with fangs of living fire. Its howl can melt steel and its speed is unmatched!',
      mathAffinity: 'multiplication',
      spriteKey: 'blazefang',
    },

    tidalfang: {
      id: 'tidalfang',
      name: 'Tidalfang',
      type: 'water',
      baseHP: 65,
      baseAttack: 62,
      baseDefense: 72,
      baseSpeed: 56,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'waterSplash', learnLevel: 1 },
        { moveId: 'shieldUp', learnLevel: 5 },
        { moveId: 'tidalWave', learnLevel: 8 },
        { moveId: 'healPulse', learnLevel: 10 },
        { moveId: 'oceanFury', learnLevel: 14 },
        { moveId: 'slam', learnLevel: 16 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0,
      xpYield: 140,
      description: 'A powerful sea beast with crushing jaws. It commands the tides and protects its friends fiercely!',
      mathAffinity: 'division',
      spriteKey: 'tidalfang',
    },

    thornraptor: {
      id: 'thornraptor',
      name: 'Thornraptor',
      type: 'grass',
      baseHP: 72,
      baseAttack: 64,
      baseDefense: 72,
      baseSpeed: 52,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'vineWhip', learnLevel: 1 },
        { moveId: 'healPulse', learnLevel: 5 },
        { moveId: 'thornBarrage', learnLevel: 8 },
        { moveId: 'shieldUp', learnLevel: 10 },
        { moveId: 'naturesWrath', learnLevel: 14 },
        { moveId: 'powerUp', learnLevel: 16 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0,
      xpYield: 140,
      description: 'A towering armored raptor covered in thorny vines. The forest bows to its mighty roar!',
      mathAffinity: 'skipCounting',
      spriteKey: 'thornraptor',
    },

    voltpounce: {
      id: 'voltpounce',
      name: 'Voltpounce',
      type: 'electric',
      baseHP: 46,
      baseAttack: 72,
      baseDefense: 39,
      baseSpeed: 117,
      moves: [
        { moveId: 'tackle', learnLevel: 1 },
        { moveId: 'spark', learnLevel: 1 },
        { moveId: 'quickStrike', learnLevel: 6 },
        { moveId: 'thunderBolt', learnLevel: 10 },
        { moveId: 'speedBoost', learnLevel: 13 },
        { moveId: 'lightningStorm', learnLevel: 18 },
        { moveId: 'powerUp', learnLevel: 20 },
      ],
      evolveLevel: null,
      evolveTo: null,
      catchRate: 0,
      xpYield: 130,
      description: 'A lightning-fast predator that pounces with electric claws. You hear the thunder AFTER it strikes!',
      mathAffinity: 'multiplication',
      spriteKey: 'voltpounce',
    },
  };

  // ===========================================================================
  // TYPE EFFECTIVENESS CHART
  // ===========================================================================
  //
  // Multipliers: 2 = super effective, 0.5 = not very effective, 1 = normal
  // Only non-1.0 matchups are listed. Anything missing defaults to 1.

  var typeChart = {
    fire:     { grass: 2, water: 0.5, rock: 0.5, fire: 0.5 },
    water:    { fire: 2, grass: 0.5, water: 0.5, rock: 2 },
    grass:    { water: 2, fire: 0.5, grass: 0.5, flying: 0.5 },
    electric: { water: 2, flying: 2, electric: 0.5, rock: 0.5 },
    rock:     { fire: 2, flying: 2, rock: 0.5 },
    ghost:    { mystic: 2, ghost: 0.5 },
    flying:   { grass: 2, flying: 0.5, rock: 0.5, electric: 0.5 },
    mystic:   { ghost: 0.5 },
    normal:   {},
  };

  /**
   * Look up the type effectiveness multiplier for attacker vs defender.
   * @param {string} attackType - The attacking move's element type.
   * @param {string} defendType - The defending creature's element type.
   * @returns {number} Multiplier (0.5, 1, or 2).
   */
  function getTypeMultiplier(attackType, defendType) {
    var chart = typeChart[attackType];
    if (!chart) return 1;
    return chart[defendType] !== undefined ? chart[defendType] : 1;
  }

  // ===========================================================================
  // ITEMS
  // ===========================================================================

  var items = {
    potion: {
      id: 'potion',
      name: 'Potion',
      description: 'A basic healing spray. Restores 30 HP to one creature.',
      cost: 50,
      sellPrice: 25,
      category: 'heal',
      effect: { type: 'heal', amount: 30 },
      usableInBattle: true,
      usableOutside: true,
    },
    superPotion: {
      id: 'superPotion',
      name: 'Super Potion',
      description: 'A stronger healing spray. Restores 70 HP to one creature.',
      cost: 150,
      sellPrice: 75,
      category: 'heal',
      effect: { type: 'heal', amount: 70 },
      usableInBattle: true,
      usableOutside: true,
    },
    mathOrb: {
      id: 'mathOrb',
      name: 'MathOrb',
      description: 'A special orb powered by math. Use it to catch wild creatures!',
      cost: 100,
      sellPrice: 50,
      category: 'catch',
      effect: { type: 'catch', bonusRate: 0 },
      usableInBattle: true,
      usableOutside: false,
    },
    greatMathOrb: {
      id: 'greatMathOrb',
      name: 'Great MathOrb',
      description: 'An upgraded MathOrb with better catch power. Great for tricky creatures!',
      cost: 300,
      sellPrice: 150,
      category: 'catch',
      effect: { type: 'catch', bonusRate: 0.25 },
      usableInBattle: true,
      usableOutside: false,
    },
    boostCandy: {
      id: 'boostCandy',
      name: 'Boost Candy',
      description: 'A magical candy that permanently boosts one stat by 2 points. Yummy!',
      cost: 500,
      sellPrice: 250,
      category: 'stat',
      effect: { type: 'statBoost', amount: 2, stat: 'random' },
      usableInBattle: false,
      usableOutside: true,
    },
    revive: {
      id: 'revive',
      name: 'Revive',
      description: 'Brings a fainted creature back to life with half its HP. A real lifesaver!',
      cost: 200,
      sellPrice: 100,
      category: 'heal',
      effect: { type: 'revive', hpPercent: 0.50 },
      usableInBattle: true,
      usableOutside: true,
    },
  };

  // ===========================================================================
  // MAP HELPERS
  // ===========================================================================

  // Tile key reference (maps to spriteKey names in sprites.js):
  //   G  = grass            (walkable, basic ground)
  //   T  = tree             (blocked, decoration)
  //   W  = water            (blocked)
  //   P  = path             (walkable, dirt road)
  //   F  = floor            (walkable, indoor tile)
  //   TG = tallGrass        (walkable, triggers wild encounters)
  //   R  = rock             (blocked)
  //   S  = sand             (walkable)
  //   C  = caveFloor        (walkable)
  //   CR = crystal          (blocked, decoration)
  //   CW = caveWall         (blocked)
  //   D  = door             (walkable, transition trigger)
  //   H  = houseWall        (blocked)
  //   RF = roof             (blocked)
  //   SG = sign             (blocked, interactable)
  //   FL = flower           (walkable, decoration)
  //   FN = fence            (blocked)
  //   BR = bridge           (walkable, over water)

  /** Tile IDs that block player movement */
  var BLOCKED_TILES = ['T', 'W', 'R', 'CR', 'CW', 'H', 'RF', 'SG', 'FN'];

  /** Tile IDs that trigger wild encounter checks */
  var ENCOUNTER_TILES = ['TG', 'C'];

  /**
   * Parse a compact string grid into a 2D array of tile IDs.
   * Each row is a whitespace-separated string of tile codes.
   */
  function parseGrid(rows) {
    return rows.map(function (row) {
      return row.trim().split(/\s+/);
    });
  }

  /**
   * Build a collision grid from a tile grid.
   * 1 = blocked, 0 = walkable.
   */
  function buildCollision(tileGrid) {
    return tileGrid.map(function (row) {
      return row.map(function (tile) {
        return BLOCKED_TILES.indexOf(tile) !== -1 ? 1 : 0;
      });
    });
  }

  // ===========================================================================
  // MAP 1: STARTER TOWN
  // ===========================================================================
  //
  // Layout sketch (20 wide x 15 tall):
  //   Row 0:  border trees
  //   Row 1:  open grass with flowers
  //   Row 2:  open area
  //   Row 3:  Professor's lab roof  |  path  |  Mom's house roof
  //   Row 4:  Professor's lab wall  |  path  |  Mom's house wall
  //   Row 5:  lab door / NPC        |  path  |  house door / NPC
  //   Row 6:  open grass
  //   Row 7:  main crossroad path
  //   Row 8:  open grass
  //   Row 9:  Shop roof             |  path  |  Heal station roof
  //   Row 10: Shop wall             |  path  |  Heal station wall
  //   Row 11: shop door / NPC       |  path  |  heal door / NPC
  //   Row 12: open grass
  //   Row 13: open grass
  //   Row 14: border trees with south exit

  var starterTownTiles = parseGrid([
    'T  T  T  T  T  T  T  T  T  T  T  T  T  T  T  T  T  T  T  T',
    'T  T  G  G  G  G  FL G  G  G  G  G  FL G  G  G  G  G  T  T',
    'T  G  G  FL G  G  G  G  G  P  G  G  G  G  G  FL G  G  G  T',
    'T  G  G  RF RF RF G  G  G  P  G  G  G  RF RF RF G  G  G  T',
    'T  G  G  H  H  H  G  G  G  P  G  G  G  H  H  H  G  G  G  T',
    'T  G  G  H  F  D  G  SG G  P  G  SG G  F  F  H  G  G  G  T',
    'T  G  FL G  G  G  G  G  G  P  G  G  G  G  G  G  FL G  G  T',
    'T  G  G  G  G  P  P  P  P  P  P  P  P  P  P  G  G  G  G  T',
    'T  G  G  G  G  G  G  G  G  P  G  G  G  G  G  G  G  G  G  T',
    'T  G  G  RF RF RF G  G  G  P  G  G  G  RF RF RF G  G  G  T',
    'T  G  G  H  H  H  G  G  FN P  FN G  G  H  H  H  G  G  G  T',
    'T  G  G  H  F  D  G  G  FN FL FN G  G  D  F  H  G  G  G  T',
    'T  G  FL G  G  G  G  G  G  P  G  G  G  G  G  G  FL G  G  T',
    'T  T  G  G  G  G  G  G  G  P  G  G  G  G  G  G  G  G  T  T',
    'T  T  T  T  T  T  T  T  T  D  T  T  T  T  T  T  T  T  T  T',
  ]);

  var starterTownCollision = buildCollision(starterTownTiles);

  var starterTownMap = {
    id: 'starterTown',
    name: 'Starter Town',
    width: 20,
    height: 15,
    tiles: starterTownTiles,
    collision: starterTownCollision,
    encounters: [],
    encounterRate: 0,
    music: 'town_theme',
    npcs: [
      {
        id: 'professorEuclid',
        name: 'Professor Euclid',
        x: 6,
        y: 6,
        sprite: 'npc_professor',
        facing: 'down',
        dialogue: {
          default: [
            "Welcome to the world of MathQuest! I'm Professor Euclid.",
            "In this world, amazing creatures called MathBeasts roam the land.",
            "By solving math problems, you power up your creatures and make them stronger!",
            "The better and faster you solve problems, the more damage your creature deals.",
            "I have three special creatures waiting for a partner. Would you like to choose one?",
          ],
          afterStarter: [
            "Wonderful choice! That creature already likes you - I can tell.",
            "Walk through the tall grass on Route 1 to find wild creatures.",
            "Solve math problems to attack, catch, and heal. Math is your superpower!",
            "Visit Nurse Joy to heal for free, and Penny's Shop for supplies.",
            "Head south when you're ready. Your grand adventure begins now!",
          ],
          revisit: [
            "Welcome back! How is your adventure going?",
            "Remember: practicing math makes your creatures stronger. Keep it up!",
            "If you get stuck, try using hints. There is no shame in learning!",
          ],
        },
        trainer: false,
        team: null,
        givesStarter: true,
      },
      {
        id: 'mom',
        name: 'Mom',
        x: 13,
        y: 5,
        sprite: 'npc_mom',
        facing: 'down',
        dialogue: {
          default: [
            "Good morning, sweetie! Professor Euclid has been looking for you.",
            "He is in the lab across the path. He has a special surprise!",
            "Go see him - this is going to be an amazing day!",
          ],
          afterStarter: [
            "Oh wow, what an adorable creature! You two are perfect together.",
            "Here, take this with you.",
            "Be brave out there! And remember, I am always proud of you.",
            "Come visit me anytime. I love you!",
          ],
        },
        trainer: false,
        team: null,
        givesItem: { itemId: 'potion', quantity: 3, once: true },
      },
      {
        id: 'shopkeeper',
        name: 'Shopkeeper Penny',
        x: 4,
        y: 12,
        sprite: 'npc_shopkeeper',
        facing: 'up',
        dialogue: {
          default: [
            "Welcome to Penny's Supply Shop!",
            "I have Potions, MathOrbs, and all sorts of goodies for adventurers.",
            "Earn coins by winning battles and solving problems. Then come spend them here!",
          ],
        },
        trainer: false,
        team: null,
        isShop: true,
        shopInventory: ['potion', 'mathOrb', 'revive'],
      },
      {
        id: 'healer',
        name: 'Nurse Joy',
        x: 14,
        y: 12,
        sprite: 'npc_healer',
        facing: 'down',
        dialogue: {
          default: [
            "Hello there! Welcome to the Healing Station.",
            "I will restore all your creatures to full health for free!",
            "...",
            "All done! Your creatures are feeling great. Good luck out there!",
          ],
        },
        trainer: false,
        team: null,
        isHealer: true,
      },
      {
        id: 'signLab',
        name: 'Sign',
        x: 7,
        y: 5,
        sprite: 'sign',
        facing: 'down',
        dialogue: {
          default: [
            "PROFESSOR EUCLID'S LAB",
            "\"Where Math Meets Monsters!\"",
          ],
        },
        trainer: false,
        team: null,
      },
      {
        id: 'signHome',
        name: 'Sign',
        x: 11,
        y: 5,
        sprite: 'sign',
        facing: 'down',
        dialogue: {
          default: [
            "YOUR HOUSE",
            "Home sweet home.",
          ],
        },
        trainer: false,
        team: null,
      },
    ],
    connections: {
      south: { map: 'route1', spawnX: 9, spawnY: 0 },
    },
    warps: [
      { x: 5, y: 5, targetMap: 'professorLab', spawnX: 4, spawnY: 6 },
      { x: 5, y: 11, targetMap: 'pennyShop', spawnX: 3, spawnY: 4 },
      { x: 13, y: 11, targetMap: 'healStation', spawnX: 3, spawnY: 4 },
    ],
    hiddenItems: [
      { x: 2, y: 3, itemId: 'potion', name: 'Potion', quantity: 1 },
      { x: 14, y: 8, itemId: 'mathOrb', name: 'MathOrb', quantity: 2 },
    ],
    spawnX: 9,
    spawnY: 7,
    requirement: null,
  };

  // ===========================================================================
  // MAP 2: ROUTE 1 (MEADOW PATH)
  // ===========================================================================
  //
  // A winding grassy route with patches of tall grass for encounters.
  // Two trainers stand along the path. Connects town (north) to forest (south).

  var route1Tiles = parseGrid([
    'T  T  T  T  T  T  T  T  T  D  T  T  T  T  T  T  T  T  T  T',
    'T  G  G  TG TG TG G  G  G  P  G  G  G  TG TG TG G  G  G  T',
    'T  G  TG TG TG TG G  G  G  P  G  G  TG TG TG TG TG G  G  T',
    'T  G  TG TG TG G  G  FL G  P  G  FL G  G  TG TG TG G  G  T',
    'T  G  G  TG G  G  G  G  P  P  P  G  G  G  G  TG G  G  G  T',
    'T  G  G  G  G  G  SG G  P  G  P  G  G  G  G  G  G  G  G  T',
    'T  G  FL G  G  G  G  G  P  G  P  G  G  FL G  G  G  FL G  T',
    'T  G  G  G  G  G  G  P  P  G  P  P  P  G  TG TG G  G  G  T',
    'T  G  TG TG G  G  G  P  G  G  G  G  P  TG TG TG TG G  G  T',
    'T  G  TG TG TG G  G  P  G  G  G  G  P  TG TG TG G  G  G  T',
    'T  G  TG TG G  G  G  P  G  G  SG G  P  G  TG G  G  G  G  T',
    'T  G  G  G  G  G  P  P  G  FL G  G  P  P  G  G  G  FL G  T',
    'T  G  G  FL G  G  P  G  G  G  G  G  G  P  G  G  G  G  G  T',
    'T  T  G  G  G  G  P  G  G  G  G  G  G  P  G  G  G  G  T  T',
    'T  T  T  T  T  T  D  T  T  T  T  T  T  D  T  T  T  T  T  T',
  ]);

  var route1Collision = buildCollision(route1Tiles);

  var route1Map = {
    id: 'route1',
    name: 'Route 1 - Meadow Path',
    width: 20,
    height: 15,
    tiles: route1Tiles,
    collision: route1Collision,
    encounters: [
      { creatureId: 'sparkling', weight: 45, minLevel: 3, maxLevel: 5 },
      { creatureId: 'skyclaw', weight: 25, minLevel: 3, maxLevel: 5 },
      { creatureId: 'thornsprout', weight: 20, minLevel: 3, maxLevel: 5 },
      { creatureId: 'numbit', weight: 5, minLevel: 4, maxLevel: 6 },
      { creatureId: 'mistwisp', weight: 5, minLevel: 3, maxLevel: 5 },
    ],
    encounterRate: 0.15,
    music: 'route_theme',
    npcs: [
      {
        id: 'trainerBen',
        name: 'Youngster Ben',
        x: 8,
        y: 5,
        sprite: 'npc_trainer_boy',
        facing: 'left',
        sightRange: 3,
        dialogue: {
          before: [
            "Hey, you look new around here!",
            "I just caught my first creature yesterday. Let's see who is stronger!",
          ],
          after: [
            "Whoa! You solved those problems super fast!",
            "I need to study my times tables more. Good battle though!",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'sparkling', level: 4, nickname: null },
        ],
        reward: 80,
        badge: null,
      },
      {
        id: 'trainerLily',
        name: 'Lass Lily',
        x: 12,
        y: 8,
        sprite: 'npc_trainer_girl',
        facing: 'left',
        sightRange: 3,
        dialogue: {
          before: [
            "I love my little team so much! They are the cutest!",
            "But don't let their cute faces fool you - we are tough!",
          ],
          after: [
            "Oh no, we lost! But wow, that was actually really fun!",
            "You are super smart with numbers. Keep going south to the forest!",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'thornsprout', level: 3, nickname: 'Sprouty' },
          { creatureId: 'sparkling', level: 4, nickname: null },
        ],
        reward: 120,
        badge: null,
      },
      {
        id: 'signRoute1North',
        name: 'Sign',
        x: 6,
        y: 5,
        sprite: 'sign',
        facing: 'down',
        dialogue: {
          default: [
            "ROUTE 1 - MEADOW PATH",
            "North: Starter Town",
            "South: Emerald Forest",
          ],
        },
        trainer: false,
        team: null,
      },
      {
        id: 'signRoute1South',
        name: 'Sign',
        x: 10,
        y: 10,
        sprite: 'sign',
        facing: 'down',
        dialogue: {
          default: [
            "TIP: Wild creatures hide in tall grass!",
            "Walk through the dark green patches to find them.",
            "Weaken them first, then throw a MathOrb to catch them!",
          ],
        },
        trainer: false,
        team: null,
      },
      {
        id: 'npcHiker',
        name: 'Wandering Hiker',
        x: 3,
        y: 8,
        sprite: 'npc_hiker',
        facing: 'right',
        dialogue: {
          default: [
            "The tall grass around here is full of Sparklings!",
            "They are super fast, so catching them is tricky.",
            "Try to lower their HP first, then use a MathOrb. Good luck!",
          ],
        },
        trainer: false,
        team: null,
      },
    ],
    connections: {
      north: { map: 'starterTown', spawnX: 9, spawnY: 13 },
      south: { map: 'emeraldForest', spawnX: 9, spawnY: 0 },
    },
    hiddenItems: [
      { x: 1, y: 1, itemId: 'potion', name: 'Potion', quantity: 1 },
      { x: 17, y: 6, itemId: 'mathOrb', name: 'MathOrb', quantity: 3 },
      { x: 5, y: 12, itemId: 'revive', name: 'Revive', quantity: 1 },
    ],
    spawnX: 9,
    spawnY: 0,
    requirement: null,
  };

  // ===========================================================================
  // MAP 3: EMERALD FOREST
  // ===========================================================================
  //
  // A dense forest with winding paths, tall grass, and rocky obstacles.
  // Two trainers and a boss (Forest Guardian) who blocks the south exit.

  var emeraldForestTiles = parseGrid([
    'T  T  T  T  T  T  T  T  T  D  T  T  T  T  T  T  T  T  T  T',
    'T  T  TG TG G  G  G  G  G  P  G  G  G  G  TG TG T  T  T  T',
    'T  TG TG TG TG G  G  FL G  P  G  FL G  TG TG TG TG T  T  T',
    'T  TG TG TG G  G  G  G  P  P  P  G  G  G  TG TG G  G  T  T',
    'T  G  TG G  G  R  G  G  P  G  P  G  G  R  G  TG G  G  G  T',
    'T  G  G  G  T  T  G  G  P  G  P  G  G  T  T  G  G  TG G  T',
    'T  G  FL T  T  G  G  G  P  G  P  P  P  G  T  T  TG TG G  T',
    'T  TG G  G  T  G  G  G  P  G  G  G  P  G  T  G  TG TG G  T',
    'T  TG TG G  G  G  G  R  P  G  G  G  P  R  G  G  G  TG G  T',
    'T  TG TG TG G  G  P  P  P  G  G  G  P  P  P  G  TG TG G  T',
    'T  G  TG TG G  G  P  G  G  G  R  G  G  G  P  G  TG G  G  T',
    'T  G  G  G  G  G  P  G  G  G  G  G  G  G  P  G  G  G  G  T',
    'T  G  FL G  G  P  P  G  G  SG G  G  G  P  P  G  G  FL G  T',
    'T  T  G  G  G  P  G  G  G  G  G  G  G  G  P  G  G  G  T  T',
    'T  T  T  T  T  D  T  T  T  T  T  T  T  T  D  T  T  T  T  T',
  ]);

  var emeraldForestCollision = buildCollision(emeraldForestTiles);

  var emeraldForestMap = {
    id: 'emeraldForest',
    name: 'Emerald Forest',
    width: 20,
    height: 15,
    tiles: emeraldForestTiles,
    collision: emeraldForestCollision,
    encounters: [
      { creatureId: 'thornsprout', weight: 35, minLevel: 5, maxLevel: 8 },
      { creatureId: 'mistwisp', weight: 20, minLevel: 6, maxLevel: 8 },
      { creatureId: 'skyclaw', weight: 10, minLevel: 6, maxLevel: 9 },
      { creatureId: 'sparkling', weight: 20, minLevel: 5, maxLevel: 7 },
      { creatureId: 'numbit', weight: 8, minLevel: 7, maxLevel: 9 },
      { creatureId: 'geolem', weight: 7, minLevel: 6, maxLevel: 8 },
    ],
    encounterRate: 0.20,
    music: 'forest_theme',
    npcs: [
      {
        id: 'trainerMarcus',
        name: 'Bug Catcher Marcus',
        x: 8,
        y: 4,
        sprite: 'npc_trainer_boy',
        facing: 'down',
        sightRange: 2,
        dialogue: {
          before: [
            "I have been training in this forest for days!",
            "My creatures have gotten way stronger. Ready to test yours?",
          ],
          after: [
            "Whoa, you really know your division! I couldn't keep up.",
            "The path ahead gets tougher. Make sure you stock up on Potions!",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'thornsprout', level: 6, nickname: null },
          { creatureId: 'mistwisp', level: 7, nickname: 'Whisper' },
        ],
        reward: 160,
        badge: null,
      },
      {
        id: 'trainerSophia',
        name: 'Ranger Sophia',
        x: 13,
        y: 7,
        sprite: 'npc_trainer_girl',
        facing: 'left',
        sightRange: 3,
        dialogue: {
          before: [
            "Halt! I am Ranger Sophia, protector of this forest.",
            "Only skilled trainers may pass through my territory. Battle me!",
          ],
          after: [
            "Impressive! Your multiplication skills are lightning fast.",
            "The Forest Guardian awaits at the south gate. Be prepared!",
            "You might want to heal your team first though.",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'skyclaw', level: 7, nickname: null },
          { creatureId: 'thornsprout', level: 7, nickname: null },
          { creatureId: 'sparkling', level: 6, nickname: 'Zippy' },
        ],
        reward: 200,
        badge: null,
      },
      {
        id: 'forestGuardian',
        name: 'Forest Guardian Oakhart',
        x: 9,
        y: 12,
        sprite: 'npc_boss',
        facing: 'up',
        sightRange: 2,
        dialogue: {
          before: [
            "...",
            "I am Oakhart, Guardian of the Emerald Forest.",
            "For years I have protected these woods and all who live here.",
            "Only those with truly sharp minds may enter the Crystal Cave beyond.",
            "Prepare yourself. This will be your greatest challenge yet!",
          ],
          after: [
            "Magnificent! Your mathematical skill is extraordinary!",
            "I can see it in your eyes - you have the heart of a true champion.",
            "Take this Forest Badge as proof of your victory.",
            "The path to Crystal Cave is now open. Be careful in there!",
            "The creatures are stronger, and the Cave Master is no pushover.",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'thornraptor', level: 10, nickname: 'Ancient Oak' },
          { creatureId: 'skyclaw', level: 9, nickname: null },
          { creatureId: 'mistwisp', level: 9, nickname: 'Shade' },
        ],
        reward: 500,
        badge: 'forestBadge',
        isBoss: true,
        mathContext: 'boss',
      },
      {
        id: 'signForest',
        name: 'Sign',
        x: 8,
        y: 12,
        sprite: 'sign',
        facing: 'down',
        dialogue: {
          default: [
            "EMERALD FOREST - GUARDIAN'S GATE",
            "\"Only the mathematically worthy may pass.\"",
            "Defeat the Forest Guardian to earn the Forest Badge.",
          ],
        },
        trainer: false,
        team: null,
      },
      {
        id: 'npcBirdWatcher',
        name: 'Bird Watcher Fern',
        x: 1,
        y: 7,
        sprite: 'npc_girl',
        facing: 'right',
        dialogue: {
          default: [
            "Shh! I am watching for Skyclaws. They nest in the treetops.",
            "They are super rare here but very powerful!",
            "If you see one in the tall grass, try to catch it!",
          ],
        },
        trainer: false,
        team: null,
      },
    ],
    connections: {
      north: { map: 'route1', spawnX: 9, spawnY: 13 },
      south: { map: 'crystalCave', spawnX: 9, spawnY: 0 },
    },
    spawnX: 9,
    spawnY: 0,
    requirement: {
      type: 'problemsSolved',
      count: 10,
      message: "You need to solve at least 10 math problems before the forest lets you in. Keep practicing!",
    },
  };

  // ===========================================================================
  // MAP 4: CRYSTAL CAVE
  // ===========================================================================
  //
  // An underground cave with glowing crystals, rocky walls, and tough encounters.
  // Two trainers and the final boss: Cave Master Granite.

  var crystalCaveTiles = parseGrid([
    'CW CW CW CW CW CW CW CW CW D  CW CW CW CW CW CW CW CW CW CW',
    'CW C  C  C  C  C  C  CW CW C  CW CW C  C  C  C  C  CW CW CW',
    'CW C  CR C  C  C  C  C  CW C  CW C  C  C  CR C  C  C  CW CW',
    'CW C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  CW',
    'CW CW C  C  CR C  C  C  C  C  C  C  C  CR C  C  C  C  C  CW',
    'CW C  C  C  C  C  CW CW C  C  C  CW CW C  C  C  C  C  C  CW',
    'CW C  C  C  C  CW CW CW C  C  C  CW CW CW C  C  CR C  C  CW',
    'CW C  CR C  C  C  CW C  C  C  C  C  CW C  C  C  C  C  C  CW',
    'CW C  C  C  C  C  C  C  C  CR C  C  C  C  C  C  C  C  C  CW',
    'CW CW C  C  C  C  C  C  C  C  C  C  C  C  C  CR C  C  CW CW',
    'CW CW CW C  C  CR C  C  C  C  C  C  C  CR C  C  C  CW CW CW',
    'CW CW C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  CW CW',
    'CW C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  CW',
    'CW C  C  C  CR C  C  C  C  C  C  C  C  C  CR C  C  C  C  CW',
    'CW CW CW CW CW CW CW CW CW CW CW CW CW CW CW CW CW CW CW CW',
  ]);

  var crystalCaveCollision = buildCollision(crystalCaveTiles);

  var crystalCaveMap = {
    id: 'crystalCave',
    name: 'Crystal Cave',
    width: 20,
    height: 15,
    tiles: crystalCaveTiles,
    collision: crystalCaveCollision,
    encounters: [
      { creatureId: 'geolem', weight: 40, minLevel: 8, maxLevel: 11 },
      { creatureId: 'mistwisp', weight: 30, minLevel: 8, maxLevel: 11 },
      { creatureId: 'numbit', weight: 15, minLevel: 9, maxLevel: 12 },
      { creatureId: 'sparkling', weight: 15, minLevel: 8, maxLevel: 10 },
    ],
    encounterRate: 0.22,
    music: 'cave_theme',
    npcs: [
      {
        id: 'trainerRocky',
        name: 'Hiker Rocky',
        x: 3,
        y: 3,
        sprite: 'npc_trainer_boy',
        facing: 'down',
        sightRange: 2,
        dialogue: {
          before: [
            "These caves are full of rare crystals and tough creatures!",
            "I have been training my Geolems here for weeks.",
            "Think your math is strong enough? Let's find out!",
          ],
          after: [
            "You cracked those problems like I crack rocks! Amazing!",
            "The Cave Master is deeper inside. He is seriously tough.",
            "Make sure your team is fully healed before you challenge him.",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'geolem', level: 9, nickname: 'Pebble' },
          { creatureId: 'geolem', level: 10, nickname: 'Boulder' },
        ],
        reward: 220,
        badge: null,
      },
      {
        id: 'trainerLuna',
        name: 'Mystic Luna',
        x: 15,
        y: 6,
        sprite: 'npc_trainer_girl',
        facing: 'left',
        sightRange: 3,
        dialogue: {
          before: [
            "I sense great potential in you...",
            "But potential without practice means nothing!",
            "Let me test your skills with a real challenge!",
          ],
          after: [
            "The numbers speak the truth - you have a real gift for math!",
            "The Cave Master awaits in the deepest chamber.",
            "May the equations guide your way. You can do this!",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'mistwisp', level: 10, nickname: 'Phantom' },
          { creatureId: 'numbit', level: 10, nickname: 'Pi' },
          { creatureId: 'mistwisp', level: 9, nickname: null },
        ],
        reward: 280,
        badge: null,
      },
      {
        id: 'caveMaster',
        name: 'Cave Master Granite',
        x: 9,
        y: 12,
        sprite: 'npc_boss',
        facing: 'up',
        sightRange: 2,
        dialogue: {
          before: [
            "...",
            "So. You have made it to the heart of Crystal Cave.",
            "I am Granite, the Cave Master. I have trained here for many years.",
            "My evolved creatures are the strongest in the entire region.",
            "Only a true Math Champion can defeat me.",
            "Show me everything you have learned. Give me your best!",
          ],
          after: [
            "... I am speechless.",
            "Your math skills are absolutely extraordinary!",
            "You have earned the Crystal Badge - the mark of a true champion!",
            "You have proven that math is the greatest superpower of all.",
            "Keep practicing, keep exploring. The world of MathQuest is vast.",
            "Perhaps one day, you will become a Professor yourself!",
            "Congratulations, Math Champion. The whole world awaits!",
          ],
        },
        trainer: true,
        team: [
          { creatureId: 'geolem', level: 12, nickname: 'Granite Jr.' },
          { creatureId: 'voltpounce', level: 13, nickname: 'Storm' },
          { creatureId: 'blazefang', level: 14, nickname: 'Inferno' },
          { creatureId: 'tidalfang', level: 14, nickname: 'Tsunami' },
        ],
        reward: 1000,
        badge: 'crystalBadge',
        isBoss: true,
        mathContext: 'boss',
      },
      {
        id: 'npcGeologist',
        name: 'Geologist Crystal',
        x: 13,
        y: 2,
        sprite: 'npc_girl',
        facing: 'down',
        dialogue: {
          default: [
            "Look at all these beautiful crystals! Each one is unique.",
            "The wild Geolems here are drawn to the crystal energy.",
            "They are very tough to catch, but totally worth it!",
            "Try weakening them with Water or Grass moves first.",
          ],
        },
        trainer: false,
        team: null,
      },
      {
        id: 'npcMiner',
        name: 'Miner Dusty',
        x: 1,
        y: 8,
        sprite: 'npc_hiker',
        facing: 'right',
        dialogue: {
          default: [
            "I have been digging in these caves for months.",
            "Sometimes I find rare Numbits hiding behind the crystals!",
            "They are the rarest creatures in the whole region.",
            "If you see one, don't let it get away!",
          ],
        },
        trainer: false,
        team: null,
      },
    ],
    connections: {
      north: { map: 'emeraldForest', spawnX: 9, spawnY: 13 },
    },
    spawnX: 9,
    spawnY: 1,
    requirement: {
      type: 'badge',
      badge: 'forestBadge',
      minAccuracy: 0.85,
      minTier: 3,
      message: "The Crystal Cave is sealed! You need the Forest Badge AND at least 85% accuracy on tier 3+ math problems to enter.",
    },
  };

  // ===========================================================================
  // MAP 5: PROFESSOR EUCLID'S LAB (INDOOR)
  // ===========================================================================
  //
  // Interior of the Professor's lab. 10 wide x 8 tall.
  // Bookshelves along walls, a creature display table, and the Professor inside.
  // Door at bottom leads back to Starter Town.

  var professorLabTiles = parseGrid([
    'H  H  H  H  H  H  H  H  H  H',
    'H  R  R  F  F  F  F  R  R  H',
    'H  R  F  F  F  F  F  F  R  H',
    'H  F  F  F  R  R  F  F  F  H',
    'H  F  F  F  F  F  F  F  F  H',
    'H  F  F  F  F  F  F  F  F  H',
    'H  F  F  F  F  F  F  F  F  H',
    'H  H  H  H  D  D  H  H  H  H',
  ]);

  var professorLabCollision = buildCollision(professorLabTiles);

  var professorLabMap = {
    id: 'professorLab',
    name: "Professor Euclid's Lab",
    width: 10,
    height: 8,
    tiles: professorLabTiles,
    collision: professorLabCollision,
    encounters: [],
    encounterRate: 0,
    music: 'town_theme',
    npcs: [
      {
        id: 'professorEuclidIndoor',
        name: 'Professor Euclid',
        x: 5,
        y: 4,
        sprite: 'npc_professor',
        facing: 'down',
        dialogue: {
          default: [
            "Welcome to my lab! This is where I study MathBeasts.",
            "Every creature in this world can be understood through numbers.",
            "The more math you practice, the stronger your bond with them grows!",
            "Feel free to look around. Knowledge is the greatest power!",
          ],
          afterStarter: [
            "Wonderful choice! That creature already likes you - I can tell.",
            "Walk through the tall grass on Route 1 to find wild creatures.",
            "Solve math problems to attack, catch, and heal. Math is your superpower!",
            "Visit Nurse Joy to heal for free, and Penny's Shop for supplies.",
            "Head south when you're ready. Your grand adventure begins now!",
          ],
          revisit: [
            "Welcome back to the lab! How is your adventure going?",
            "Remember: practicing math makes your creatures stronger. Keep it up!",
            "If you get stuck, try using hints. There is no shame in learning!",
          ],
        },
        trainer: false,
        team: null,
        givesStarter: true,
      },
      {
        id: 'dailyChallenge',
        name: 'Math Master Max',
        x: 7,
        y: 3,
        sprite: 'npc_trainer_boy',
        facing: 'down',
        dialogue: {
          default: [
            "Hey there, challenger! I am Math Master Max.",
            "Every day I prepare a fresh set of math challenges for brave trainers.",
            "Complete my daily challenge to earn bonus coins and XP!",
            "Think you have what it takes? Let's find out!",
          ],
        },
        trainer: false,
        team: null,
        isDailyChallenge: true,
      },
    ],
    connections: {
      south: { map: 'starterTown', spawnX: 5, spawnY: 6 },
    },
    spawnX: 4,
    spawnY: 6,
    requirement: null,
  };

  // ===========================================================================
  // MAP 6: PENNY'S SHOP (INDOOR)
  // ===========================================================================
  //
  // Small shop interior. 8 wide x 6 tall.
  // Counter with shelves of items. Shopkeeper Penny inside.
  // Door at bottom leads back to Starter Town.

  var pennyShopTiles = parseGrid([
    'H  H  H  H  H  H  H  H',
    'H  R  R  R  R  R  R  H',
    'H  F  F  F  F  F  F  H',
    'H  F  F  R  R  F  F  H',
    'H  F  F  F  F  F  F  H',
    'H  H  H  D  D  H  H  H',
  ]);

  var pennyShopCollision = buildCollision(pennyShopTiles);

  var pennyShopMap = {
    id: 'pennyShop',
    name: "Penny's Shop",
    width: 8,
    height: 6,
    tiles: pennyShopTiles,
    collision: pennyShopCollision,
    encounters: [],
    encounterRate: 0,
    music: 'town_theme',
    npcs: [
      {
        id: 'shopkeeperIndoor',
        name: 'Shopkeeper Penny',
        x: 4,
        y: 2,
        sprite: 'npc_shopkeeper',
        facing: 'down',
        dialogue: {
          default: [
            "Welcome to Penny's Supply Shop!",
            "I have Potions, MathOrbs, and all sorts of goodies for adventurers.",
            "Earn coins by winning battles and solving problems. Then come spend them here!",
          ],
        },
        trainer: false,
        team: null,
        isShop: true,
        shopInventory: ['potion', 'mathOrb', 'revive'],
      },
    ],
    connections: {
      south: { map: 'starterTown', spawnX: 5, spawnY: 12 },
    },
    spawnX: 3,
    spawnY: 4,
    requirement: null,
  };

  // ===========================================================================
  // MAP 7: HEAL STATION (INDOOR)
  // ===========================================================================
  //
  // Healing station interior. 8 wide x 6 tall.
  // Counter with Nurse Joy behind it.
  // Door at bottom leads back to Starter Town.

  var healStationTiles = parseGrid([
    'H  H  H  H  H  H  H  H',
    'H  F  F  F  F  F  F  H',
    'H  F  F  F  F  F  F  H',
    'H  F  F  R  R  F  F  H',
    'H  F  F  F  F  F  F  H',
    'H  H  H  D  D  H  H  H',
  ]);

  var healStationCollision = buildCollision(healStationTiles);

  var healStationMap = {
    id: 'healStation',
    name: 'Heal Station',
    width: 8,
    height: 6,
    tiles: healStationTiles,
    collision: healStationCollision,
    encounters: [],
    encounterRate: 0,
    music: 'town_theme',
    npcs: [
      {
        id: 'healerIndoor',
        name: 'Nurse Joy',
        x: 4,
        y: 2,
        sprite: 'npc_healer',
        facing: 'down',
        dialogue: {
          default: [
            "Hello there! Welcome to the Healing Station.",
            "I will restore all your creatures to full health for free!",
            "...",
            "All done! Your creatures are feeling great. Good luck out there!",
          ],
        },
        trainer: false,
        team: null,
        isHealer: true,
      },
    ],
    connections: {
      south: { map: 'starterTown', spawnX: 13, spawnY: 12 },
    },
    spawnX: 3,
    spawnY: 4,
    requirement: null,
  };

  // ===========================================================================
  // MAPS COLLECTION
  // ===========================================================================

  var maps = {
    starterTown: starterTownMap,
    route1: route1Map,
    emeraldForest: emeraldForestMap,
    crystalCave: crystalCaveMap,
    professorLab: professorLabMap,
    pennyShop: pennyShopMap,
    healStation: healStationMap,
  };

  // ===========================================================================
  // PROGRESSION
  // ===========================================================================

  var progression = {
    badges: {
      forestBadge: {
        id: 'forestBadge',
        name: 'Forest Badge',
        description: 'Awarded for defeating Forest Guardian Oakhart. Proves mastery of basic math!',
        icon: 'badge_forest',
      },
      crystalBadge: {
        id: 'crystalBadge',
        name: 'Crystal Badge',
        description: 'Awarded for defeating Cave Master Granite. The mark of a true Math Champion!',
        icon: 'badge_crystal',
      },
    },
    gates: {
      starterTown: null,
      route1: null,
      emeraldForest: {
        type: 'problemsSolved',
        count: 10,
      },
      crystalCave: {
        type: 'badge',
        badge: 'forestBadge',
        minAccuracy: 0.85,
        minTier: 3,
      },
    },
  };

  // ===========================================================================
  // XP & LEVELING SYSTEM
  // ===========================================================================

  /**
   * Total cumulative XP needed to reach a given level.
   * Uses a medium-fast growth curve: 0.8 * level^3
   * @param {number} level - Target level (1+).
   * @returns {number}
   */
  function xpForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(0.8 * Math.pow(level, 3));
  }

  /**
   * XP needed from the current level to reach the next level.
   * @param {number} level - Current level.
   * @returns {number}
   */
  function xpCurve(level) {
    return xpForLevel(level + 1) - xpForLevel(level);
  }

  /**
   * Calculate a single stat value at a given level.
   * HP formula:  floor((baseStat * 2 * level) / 100) + level + 10
   * Other stats: floor((baseStat * 2 * level) / 100) + 5
   *
   * @param {number} baseStat - Base stat value from creature data.
   * @param {number} level - Creature level.
   * @param {boolean} isHP - True for HP calculation.
   * @returns {number}
   */
  function calcStat(baseStat, level, isHP) {
    if (isHP) {
      return Math.floor((baseStat * 2 * level) / 100) + level + 10;
    }
    return Math.floor((baseStat * 2 * level) / 100) + 5;
  }

  /**
   * Get all computed stats for a creature at a given level.
   * @param {object} creatureData - Base creature data from creatures table.
   * @param {number} level
   * @returns {{ hp: number, attack: number, defense: number, speed: number }}
   */
  function getStatsAtLevel(creatureData, level) {
    return {
      hp: calcStat(creatureData.baseHP, level, true),
      attack: calcStat(creatureData.baseAttack, level, false),
      defense: calcStat(creatureData.baseDefense, level, false),
      speed: calcStat(creatureData.baseSpeed, level, false),
    };
  }

  /**
   * Calculate the stat gains when leveling up (difference between levels).
   * @param {object} creatureData - Base creature data.
   * @param {number} newLevel - The new level reached.
   * @returns {{ hp: number, attack: number, defense: number, speed: number }}
   */
  function levelUpStats(creatureData, newLevel) {
    var oldStats = getStatsAtLevel(creatureData, newLevel - 1);
    var newStats = getStatsAtLevel(creatureData, newLevel);
    return {
      hp: newStats.hp - oldStats.hp,
      attack: newStats.attack - oldStats.attack,
      defense: newStats.defense - oldStats.defense,
      speed: newStats.speed - oldStats.speed,
    };
  }

  /**
   * Get move IDs a creature knows at a given level.
   * Returns up to 4 moves (the most recently learned ones).
   * @param {object} creatureData
   * @param {number} level
   * @returns {string[]}
   */
  function getMovesAtLevel(creatureData, level) {
    var learned = creatureData.moves
      .filter(function (m) { return m.learnLevel <= level; })
      .sort(function (a, b) { return a.learnLevel - b.learnLevel; });

    if (learned.length > 4) {
      learned = learned.slice(learned.length - 4);
    }
    return learned.map(function (m) { return m.moveId; });
  }

  /**
   * Check if a creature should evolve at the given level.
   * @param {object} creatureData
   * @param {number} level
   * @returns {{ shouldEvolve: boolean, evolveTo: string|null }}
   */
  function checkEvolution(creatureData, level) {
    if (
      creatureData.evolveLevel &&
      level >= creatureData.evolveLevel &&
      creatureData.evolveTo
    ) {
      return { shouldEvolve: true, evolveTo: creatureData.evolveTo };
    }
    return { shouldEvolve: false, evolveTo: null };
  }

  /**
   * Calculate catch probability for a wild creature.
   *
   * Factors:
   *   - Base catch rate (creature data)
   *   - HP percentage (lower HP = easier)
   *   - Orb bonus (Great MathOrb gives +0.25)
   *   - Math accuracy bonus (correct answer = 1.5x, wrong = 0.5x)
   *
   * @param {object} creatureData
   * @param {number} currentHPPercent - 0.0 to 1.0
   * @param {number} orbBonus - 0 for MathOrb, 0.25 for Great MathOrb
   * @param {boolean} mathCorrect - Whether the catch math problem was solved correctly
   * @returns {number} 0.0 to 1.0
   */
  function calcCatchRate(creatureData, currentHPPercent, orbBonus, mathCorrect) {
    var baseRate = creatureData.catchRate;
    if (baseRate <= 0) return 0; // Uncatchable

    // Lower HP = easier to catch (at 100% HP: 0.5x, at 0% HP: 1.5x)
    var hpMod = 1.5 - currentHPPercent;

    // Math bonus: correct = 1.5x, wrong = 0.5x
    var mathMod = mathCorrect ? 1.5 : 0.5;

    var rate = baseRate * hpMod * mathMod + orbBonus;
    return Math.min(1.0, Math.max(0.0, rate));
  }

  /**
   * Create a fully computed creature instance for battle or party use.
   * @param {string} creatureId - Key from the creatures table.
   * @param {number} level
   * @param {string|null} nickname
   * @returns {object|null}
   */
  function createCreatureInstance(creatureId, level, nickname) {
    var data = creatures[creatureId];
    if (!data) return null;

    var stats = getStatsAtLevel(data, level);
    var knownMoves = getMovesAtLevel(data, level);

    return {
      id: creatureId,
      instanceId: creatureId + '_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
      name: nickname || data.name,
      nickname: nickname,
      type: data.type,
      level: level,
      xp: xpForLevel(level),
      xpToNext: xpCurve(level),
      stats: {
        hp: stats.hp,
        maxHP: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
      },
      currentHP: stats.hp,
      moves: knownMoves,
      spriteKey: data.spriteKey,
      statBoosts: { attack: 0, defense: 0, speed: 0 },
      statusEffects: [],
      fainted: false,
    };
  }

  // ===========================================================================
  // DAMAGE FORMULA
  // ===========================================================================

  /**
   * Calculate damage for an attack move.
   *
   * Formula (simplified Pokemon-style):
   *   base = ((2 * level / 5 + 2) * power * attack / defense) / 50 + 2
   *   * STAB (1.5x if move type == attacker type)
   *   * Type effectiveness
   *   * Critical hit (6.25% chance, 1.5x)
   *   * Random (0.85 - 1.0)
   *
   * @param {number} level - Attacker's level.
   * @param {number} power - Move base power.
   * @param {number} attack - Attacker's effective attack stat.
   * @param {number} defense - Defender's effective defense stat.
   * @param {string} moveType - Move's element type.
   * @param {string} defenderType - Defender creature's type.
   * @param {string} attackerType - Attacker creature's type (for STAB).
   * @returns {{ damage: number, effectiveness: number, stab: boolean, critical: boolean }}
   */
  function calcDamage(level, power, attack, defense, moveType, defenderType, attackerType) {
    if (power <= 0) {
      return { damage: 0, effectiveness: 1, stab: false, critical: false };
    }

    // Base damage
    var base = ((2 * level / 5 + 2) * power * attack / defense) / 50 + 2;

    // STAB: Same Type Attack Bonus (1.5x)
    var stab = (moveType === attackerType);
    if (stab) base *= 1.5;

    // Type effectiveness
    var effectiveness = getTypeMultiplier(moveType, defenderType);
    base *= effectiveness;

    // Critical hit: 6.25% chance, 1.5x
    var critical = Math.random() < 0.0625;
    if (critical) base *= 1.5;

    // Random factor: 0.85 to 1.00
    var rand = 0.85 + Math.random() * 0.15;
    base *= rand;

    var finalDamage = Math.max(1, Math.floor(base));

    return {
      damage: finalDamage,
      effectiveness: effectiveness,
      stab: stab,
      critical: critical,
    };
  }

  // ===========================================================================
  // SPEED TIE-BREAKING & TURN ORDER
  // ===========================================================================

  /**
   * Determine which creature acts first in a battle round.
   * @param {object} creatureA - Creature instance (attacker/player).
   * @param {object} creatureB - Creature instance (defender/enemy).
   * @returns {string} 'a' or 'b'
   */
  function determineTurnOrder(creatureA, creatureB) {
    var speedA = creatureA.stats.speed * getStatMultiplier(creatureA.statBoosts.speed);
    var speedB = creatureB.stats.speed * getStatMultiplier(creatureB.statBoosts.speed);

    if (speedA > speedB) return 'a';
    if (speedB > speedA) return 'b';
    // Tie: coin flip
    return Math.random() < 0.5 ? 'a' : 'b';
  }

  /**
   * Get the multiplier for a stat stage boost/debuff.
   * Stages range from -6 to +6.
   * @param {number} stage
   * @returns {number}
   */
  function getStatMultiplier(stage) {
    var clamped = Math.max(-6, Math.min(6, stage));
    if (clamped >= 0) {
      return (2 + clamped) / 2;
    }
    return 2 / (2 - clamped);
  }

  // ===========================================================================
  // XP GAIN FORMULA
  // ===========================================================================

  /**
   * Calculate XP gained from defeating a creature.
   * @param {number} enemyBaseXPYield - The xpYield from creature data.
   * @param {number} enemyLevel - Level of the defeated creature.
   * @param {boolean} isTrainerBattle - Trainer battles give 1.5x XP.
   * @returns {number}
   */
  function calcXPGain(enemyBaseXPYield, enemyLevel, isTrainerBattle) {
    var xp = (enemyBaseXPYield * enemyLevel) / 7;
    if (isTrainerBattle) xp *= 1.5;
    return Math.max(1, Math.floor(xp));
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  window.GameData = {
    // --- Data tables ---
    creatures: creatures,
    moves: moves,
    typeChart: typeChart,
    items: items,
    maps: maps,
    progression: progression,

    // --- Constants ---
    starters: ['flametail', 'aquapup', 'leafbara'],
    mapOrder: ['starterTown', 'route1', 'emeraldForest', 'crystalCave'],
    BLOCKED_TILES: BLOCKED_TILES,
    ENCOUNTER_TILES: ENCOUNTER_TILES,

    // --- Leveling & XP ---
    xpForLevel: xpForLevel,
    xpCurve: xpCurve,
    calcStat: calcStat,
    getStatsAtLevel: getStatsAtLevel,
    levelUpStats: levelUpStats,
    calcXPGain: calcXPGain,

    // --- Creature utilities ---
    getMovesAtLevel: getMovesAtLevel,
    checkEvolution: checkEvolution,
    createCreatureInstance: createCreatureInstance,
    calcCatchRate: calcCatchRate,

    // --- Battle utilities ---
    calcDamage: calcDamage,
    getTypeMultiplier: getTypeMultiplier,
    determineTurnOrder: determineTurnOrder,
    getStatMultiplier: getStatMultiplier,

    // --- Lookup helpers ---

    /** @param {string} moveId @returns {object|null} */
    getMove: function (moveId) {
      return moves[moveId] || null;
    },

    /** @param {string} creatureId @returns {object|null} */
    getCreature: function (creatureId) {
      return creatures[creatureId] || null;
    },

    /** @param {string} itemId @returns {object|null} */
    getItem: function (itemId) {
      return items[itemId] || null;
    },

    /** @param {string} mapId @returns {object|null} */
    getMap: function (mapId) {
      return maps[mapId] || null;
    },

    /**
     * Get effectiveness label text for battle messages.
     * @param {number} multiplier
     * @returns {string}
     */
    getEffectivenessLabel: function (multiplier) {
      if (multiplier >= 2) return "It's super effective!";
      if (multiplier <= 0.5) return "It's not very effective...";
      return '';
    },

    /**
     * Check if a tile triggers wild encounters.
     * @param {string} mapId
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isEncounterTile: function (mapId, x, y) {
      var map = maps[mapId];
      if (!map || !map.tiles[y] || !map.tiles[y][x]) return false;
      return ENCOUNTER_TILES.indexOf(map.tiles[y][x]) !== -1;
    },

    /**
     * Check if a tile is blocked (not walkable).
     * @param {string} mapId
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isTileBlocked: function (mapId, x, y) {
      var map = maps[mapId];
      if (!map) return true;
      if (y < 0 || y >= map.height || x < 0 || x >= map.width) return true;
      return map.collision[y][x] === 1;
    },

    /**
     * Roll for a random wild encounter on a map.
     * Uses weighted random selection from the map's encounter table.
     *
     * @param {string} mapId
     * @returns {{ creatureId: string, level: number }|null}
     */
    rollEncounter: function (mapId) {
      var map = maps[mapId];
      if (!map || !map.encounters.length) return null;
      if (Math.random() > map.encounterRate) return null;

      // Weighted random selection
      var totalWeight = 0;
      var i;
      for (i = 0; i < map.encounters.length; i++) {
        totalWeight += map.encounters[i].weight;
      }

      var roll = Math.random() * totalWeight;
      var cumulative = 0;
      for (i = 0; i < map.encounters.length; i++) {
        cumulative += map.encounters[i].weight;
        if (roll <= cumulative) {
          var enc = map.encounters[i];
          var level = enc.minLevel + Math.floor(
            Math.random() * (enc.maxLevel - enc.minLevel + 1)
          );
          return { creatureId: enc.creatureId, level: level };
        }
      }

      return null;
    },

    /**
     * Find NPC at a tile position on a map.
     * @param {string} mapId
     * @param {number} x
     * @param {number} y
     * @returns {object|null}
     */
    getNPCAt: function (mapId, x, y) {
      var map = maps[mapId];
      if (!map) return null;
      for (var i = 0; i < map.npcs.length; i++) {
        if (map.npcs[i].x === x && map.npcs[i].y === y) {
          return map.npcs[i];
        }
      }
      return null;
    },

    /**
     * Find NPC by ID on a map.
     * @param {string} mapId
     * @param {string} npcId
     * @returns {object|null}
     */
    getNPCById: function (mapId, npcId) {
      var map = maps[mapId];
      if (!map) return null;
      for (var i = 0; i < map.npcs.length; i++) {
        if (map.npcs[i].id === npcId) {
          return map.npcs[i];
        }
      }
      return null;
    },

    /**
     * Check if the player meets the requirements to enter a map.
     *
     * @param {string} mapId
     * @param {object} playerState - { problemsSolved, badges: [], accuracy, maxTier }
     * @returns {{ allowed: boolean, message: string }}
     */
    checkMapRequirement: function (mapId, playerState) {
      var map = maps[mapId];
      if (!map || !map.requirement) {
        return { allowed: true, message: '' };
      }

      var req = map.requirement;

      if (req.type === 'problemsSolved') {
        if ((playerState.problemsSolved || 0) >= req.count) {
          return { allowed: true, message: '' };
        }
        return { allowed: false, message: req.message };
      }

      if (req.type === 'badge') {
        var hasBadge = playerState.badges && playerState.badges.indexOf(req.badge) !== -1;
        var meetsAccuracy = !req.minAccuracy || (playerState.accuracy || 0) >= req.minAccuracy;
        var meetsTier = !req.minTier || (playerState.maxTier || 1) >= req.minTier;

        if (hasBadge && meetsAccuracy && meetsTier) {
          return { allowed: true, message: '' };
        }
        return { allowed: false, message: req.message };
      }

      return { allowed: true, message: '' };
    },

    /**
     * Get all creatures of a specific type.
     * @param {string} type
     * @returns {object[]}
     */
    getCreaturesByType: function (type) {
      var result = [];
      for (var key in creatures) {
        if (creatures.hasOwnProperty(key) && creatures[key].type === type) {
          result.push(creatures[key]);
        }
      }
      return result;
    },

    /**
     * Get all moves of a specific type.
     * @param {string} type
     * @returns {object[]}
     */
    getMovesByType: function (type) {
      var result = [];
      for (var key in moves) {
        if (moves.hasOwnProperty(key) && moves[key].type === type) {
          result.push(moves[key]);
        }
      }
      return result;
    },

    /**
     * Build a full NPC trainer team from their team config.
     * Creates creature instances for each entry.
     * @param {object} npc - NPC data with a team array.
     * @returns {object[]} Array of creature instances.
     */
    buildNPCTeam: function (npc) {
      if (!npc || !npc.team) return [];
      return npc.team.map(function (entry) {
        return createCreatureInstance(entry.creatureId, entry.level, entry.nickname);
      }).filter(function (c) { return c !== null; });
    },

    /**
     * Get the connection data for leaving a map in a given direction.
     * @param {string} mapId
     * @param {string} direction - 'north', 'south', 'east', 'west'
     * @returns {{ map: string, spawnX: number, spawnY: number }|null}
     */
    getConnection: function (mapId, direction) {
      var map = maps[mapId];
      if (!map || !map.connections) return null;
      return map.connections[direction] || null;
    },

    /** Version string for save-file compatibility */
    version: '1.0.0',
  };
})();
