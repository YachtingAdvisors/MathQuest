/**
 * GameState - Player state management, save/load, inventory, team.
 * Manages all mutable player data and persistence via localStorage.
 *
 * @version 1.0.0
 */
(function () {
  'use strict';

  const SAVE_KEY = 'mathquest_save';
  const MAX_TEAM_SIZE = 4;
  const MAX_STORAGE_CREATURES = 20;

  // -------------------------------------------------------------------------
  // Default player state
  // -------------------------------------------------------------------------

  function defaultState() {
    return {
      version: 1,
      name: 'Player',
      x: 7,
      y: 10,
      currentMap: 'starterTown',
      direction: 'down',
      team: [],           // Array of creature instances
      storage: [],        // Overflow creatures
      inventory: {        // itemId -> count
        potion: 3,
        mathOrb: 5,
      },
      gold: 100,
      badges: [],         // Badge IDs earned
      flags: {},          // Story flags: { choseStarter: true, beatForestBoss: true, ... }
      totalProblems: 0,
      totalCorrect: 0,
      playTime: 0,        // seconds
      mathState: null,     // Serialized MathEngine state
      defeatedTrainers: [], // trainer IDs already beaten
    };
  }

  let _state = defaultState();
  let _playTimer = null;

  // -------------------------------------------------------------------------
  // Creature instance factory
  // -------------------------------------------------------------------------

  let _creatureUid = 0;

  /**
   * Create a creature instance from a species definition.
   * @param {string} speciesId - Key in GameData.creatures
   * @param {number} level - Starting level
   * @param {object} [overrides] - Optional stat/move overrides
   * @returns {object} Creature instance
   */
  function createCreature(speciesId, level, overrides) {
    const data = window.GameData && window.GameData.creatures[speciesId];
    if (!data) {
      console.warn('Unknown creature:', speciesId);
      return null;
    }

    _creatureUid += 1;
    const uid = 'c_' + Date.now().toString(36) + '_' + _creatureUid;

    // Calculate stats for level
    const stats = calcStats(data, level);

    // Determine moves: creature learns moves as it levels up
    const moves = getMovesForLevel(data, level);

    const creature = {
      uid,
      speciesId,
      name: data.name,
      type: data.type,
      level,
      xp: 0,
      xpToNext: xpForLevel(level + 1) - xpForLevel(level),
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      moves,          // Array of move IDs (max 4)
      status: 'ok',   // 'ok' | 'fainted'
      spriteKey: data.spriteKey || speciesId,
      ...overrides,
    };

    return creature;
  }

  /**
   * Calculate stats for a creature at a given level.
   * Uses a simplified Pokemon-style formula.
   */
  function calcStats(data, level) {
    const scale = 1 + (level - 1) * 0.08; // 8% per level
    return {
      hp: Math.floor(data.baseHP * scale) + level,
      attack: Math.floor(data.baseAttack * scale),
      defense: Math.floor(data.baseDefense * scale),
      speed: Math.floor(data.baseSpeed * scale),
    };
  }

  /**
   * Get moves a creature should know at a given level.
   * Takes the last 4 moves it would have learned.
   */
  function getMovesForLevel(data, level) {
    // game-data uses moves: [{ moveId, learnLevel }]
    const moveDefs = data.moves || data.learnset || [];
    const available = moveDefs
      .filter(entry => {
        const lvl = entry.learnLevel || entry.level || 1;
        return lvl <= level;
      })
      .map(entry => entry.moveId || entry.move || entry);
    // Keep last 4 learned move IDs
    return available.slice(-4);
  }

  /**
   * XP needed to reach a given level (cumulative from level 1).
   * Simple cubic curve: XP = level^3
   */
  function xpForLevel(level) {
    return Math.floor(Math.pow(level, 3));
  }

  // -------------------------------------------------------------------------
  // Team management
  // -------------------------------------------------------------------------

  function addToTeam(creature) {
    if (_state.team.length < MAX_TEAM_SIZE) {
      _state.team.push(creature);
      return true;
    }
    // Overflow to storage
    if (_state.storage.length < MAX_STORAGE_CREATURES) {
      _state.storage.push(creature);
      return true;
    }
    return false; // Both full
  }

  function removeFromTeam(index) {
    if (_state.team.length <= 1) return false; // Must keep at least one
    const removed = _state.team.splice(index, 1)[0];
    _state.storage.push(removed);
    return true;
  }

  function swapTeamOrder(i, j) {
    if (i < 0 || j < 0 || i >= _state.team.length || j >= _state.team.length) return;
    [_state.team[i], _state.team[j]] = [_state.team[j], _state.team[i]];
  }

  function getFirstAlive() {
    return _state.team.find(c => c.status !== 'fainted' && c.hp > 0);
  }

  function allFainted() {
    return _state.team.every(c => c.status === 'fainted' || c.hp <= 0);
  }

  /**
   * Heal all creatures to full HP and clear status.
   */
  function healAll() {
    _state.team.forEach(c => {
      c.hp = c.maxHp;
      c.status = 'ok';
    });
  }

  // -------------------------------------------------------------------------
  // Inventory management
  // -------------------------------------------------------------------------

  function addItem(itemId, count) {
    if (!_state.inventory[itemId]) {
      _state.inventory[itemId] = 0;
    }
    _state.inventory[itemId] += count || 1;
  }

  function removeItem(itemId, count) {
    if (!_state.inventory[itemId] || _state.inventory[itemId] < (count || 1)) {
      return false;
    }
    _state.inventory[itemId] -= count || 1;
    if (_state.inventory[itemId] <= 0) {
      delete _state.inventory[itemId];
    }
    return true;
  }

  function hasItem(itemId, count) {
    return (_state.inventory[itemId] || 0) >= (count || 1);
  }

  function getItemCount(itemId) {
    return _state.inventory[itemId] || 0;
  }

  // -------------------------------------------------------------------------
  // Gold management
  // -------------------------------------------------------------------------

  function addGold(amount) {
    _state.gold = Math.max(0, _state.gold + amount);
  }

  function spendGold(amount) {
    if (_state.gold < amount) return false;
    _state.gold -= amount;
    return true;
  }

  // -------------------------------------------------------------------------
  // XP, leveling, evolution
  // -------------------------------------------------------------------------

  /**
   * Award XP to a creature. Returns array of events (levelUp, evolution, newMove).
   */
  function awardXP(creature, amount) {
    const events = [];
    creature.xp += amount;

    while (creature.xp >= creature.xpToNext && creature.level < 50) {
      creature.xp -= creature.xpToNext;
      creature.level += 1;

      const data = window.GameData && window.GameData.creatures[creature.speciesId];
      if (data) {
        const newStats = calcStats(data, creature.level);
        const hpGain = newStats.hp - creature.maxHp;
        creature.maxHp = newStats.hp;
        creature.hp += hpGain; // Heal by the HP gained
        creature.attack = newStats.attack;
        creature.defense = newStats.defense;
        creature.speed = newStats.speed;

        events.push({
          type: 'levelUp',
          level: creature.level,
          stats: { ...newStats },
        });

        // Check for new moves (game-data uses `moves` with { moveId, learnLevel })
        const learnset = data.learnset || data.moves;
        if (learnset) {
          const newMoves = learnset.filter(e => (e.learnLevel || e.level) === creature.level);
          for (const m of newMoves) {
            const moveId = m.moveId || m.move;
            if (moveId && creature.moves.length < 4 && creature.moves.indexOf(moveId) === -1) {
              creature.moves.push(moveId);
              events.push({ type: 'newMove', move: moveId });
            }
          }
        }

        // Check evolution
        if (data.evolveLevel && creature.level >= data.evolveLevel && data.evolveTo) {
          const evoData = window.GameData.creatures[data.evolveTo];
          if (evoData) {
            events.push({
              type: 'evolution',
              from: creature.name,
              to: evoData.name,
              newName: evoData.name,
            });
            creature.speciesId = data.evolveTo;
            creature.name = evoData.name;
            creature.type = evoData.type;
            creature.spriteKey = evoData.spriteKey || data.evolveTo;

            // Recalc stats with new base
            const evoStats = calcStats(evoData, creature.level);
            const evoHpGain = evoStats.hp - creature.maxHp;
            creature.maxHp = evoStats.hp;
            creature.hp += evoHpGain;
            creature.attack = evoStats.attack;
            creature.defense = evoStats.defense;
            creature.speed = evoStats.speed;
          }
        }
      }

      creature.xpToNext = xpForLevel(creature.level + 1) - xpForLevel(creature.level);
    }

    return events;
  }

  // -------------------------------------------------------------------------
  // Flags and progression
  // -------------------------------------------------------------------------

  function setFlag(key, value) {
    _state.flags[key] = value === undefined ? true : value;
  }

  function getFlag(key) {
    return _state.flags[key];
  }

  function addBadge(badgeId) {
    if (!_state.badges.includes(badgeId)) {
      _state.badges.push(badgeId);
    }
  }

  function hasBadge(badgeId) {
    return _state.badges.includes(badgeId);
  }

  function defeatTrainer(trainerId) {
    if (!_state.defeatedTrainers.includes(trainerId)) {
      _state.defeatedTrainers.push(trainerId);
    }
  }

  function isTrainerDefeated(trainerId) {
    return _state.defeatedTrainers.includes(trainerId);
  }

  // -------------------------------------------------------------------------
  // Position management
  // -------------------------------------------------------------------------

  function setPosition(x, y, map) {
    _state.x = x;
    _state.y = y;
    if (map) _state.currentMap = map;
  }

  function setDirection(dir) {
    _state.direction = dir;
  }

  // -------------------------------------------------------------------------
  // Save / Load
  // -------------------------------------------------------------------------

  function save() {
    try {
      // Save MathEngine state too
      if (window.MathEngine) {
        _state.mathState = window.MathEngine.getState();
      }
      const json = JSON.stringify(_state);
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  function load() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return false;
      const loaded = JSON.parse(json);
      if (!loaded || loaded.version !== 1) return false;
      _state = loaded;
      // Restore MathEngine state
      if (_state.mathState && window.MathEngine) {
        window.MathEngine.init(_state.mathState);
      }
      return true;
    } catch (e) {
      console.error('Load failed:', e);
      return false;
    }
  }

  function hasSave() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  }

  function deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function newGame() {
    _state = defaultState();
    if (window.MathEngine) {
      window.MathEngine.init(null);
    }
  }

  // -------------------------------------------------------------------------
  // Play timer
  // -------------------------------------------------------------------------

  function startPlayTimer() {
    if (_playTimer) return;
    _playTimer = setInterval(() => {
      _state.playTime += 1;
    }, 1000);
  }

  function stopPlayTimer() {
    if (_playTimer) {
      clearInterval(_playTimer);
      _playTimer = null;
    }
  }

  function getPlayTime() {
    const total = _state.playTime;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // -------------------------------------------------------------------------
  // Record math performance
  // -------------------------------------------------------------------------

  function recordMathResult(correct) {
    _state.totalProblems += 1;
    if (correct) _state.totalCorrect += 1;
  }

  function getMathAccuracy() {
    if (_state.totalProblems === 0) return 0;
    return _state.totalCorrect / _state.totalProblems;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  window.GameState = {
    // Player state (read-only access)
    get player() { return _state; },
    get team() { return _state.team; },
    get inventory() { return _state.inventory; },
    get gold() { return _state.gold; },
    get badges() { return _state.badges; },
    get flags() { return _state.flags; },
    get currentMap() { return _state.currentMap; },

    // Creature creation
    createCreature,
    xpForLevel,

    // Team
    addToTeam,
    removeFromTeam,
    swapTeamOrder,
    getFirstAlive,
    allFainted,
    healAll,

    // Inventory
    addItem,
    removeItem,
    hasItem,
    getItemCount,

    // Gold
    addGold,
    spendGold,

    // XP & progression
    awardXP,

    // Flags & badges
    setFlag,
    getFlag,
    addBadge,
    hasBadge,
    defeatTrainer,
    isTrainerDefeated,

    // Position
    setPosition,
    setDirection,

    // Save/Load
    save,
    load,
    hasSave,
    deleteSave,
    newGame,

    // Play time
    startPlayTimer,
    stopPlayTimer,
    getPlayTime,

    // Math tracking
    recordMathResult,
    getMathAccuracy,
  };
})();
