/**
 * Battle System - Turn-based Pokemon FireRed-style math battle engine
 *
 * Renders entirely on canvas. Every battle action requires solving a math
 * problem via window.MathEngine. Supports wild encounters, trainer battles,
 * and boss fights.
 *
 * Exported as window.Battle.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Dependencies (lazy-accessed globals)
  // ---------------------------------------------------------------------------
  const MathEngine = () => window.MathEngine;
  const Sprites    = () => window.Sprites;
  const GameData   = () => window.GameData;
  const GameState  = () => window.GameState;
  const SFX        = () => window.SFX;

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const PHASE = {
    INTRO:          'intro',
    ACTION_SELECT:  'actionSelect',
    MOVE_SELECT:    'moveSelect',
    ITEM_SELECT:    'itemSelect',
    SWITCH_SELECT:  'switchSelect',
    MATH:           'math',
    RESOLVE:        'resolve',
    ENEMY_TURN:     'enemyTurn',
    VICTORY:        'victory',
    DEFEAT:         'defeat',
    CATCH_ANIM:     'catchAnim',
    LEVEL_UP:       'levelUp',
    EVOLUTION:      'evolution',
    RUN:            'run',
    FADE_OUT:       'fadeOut',
  };

  const C = {
    WHITE:       '#FFFFFF',
    BLACK:       '#1A1A2E',
    DARK:        '#16213E',
    PANEL:       '#0F3460',
    PANEL_LITE:  '#1A4A7A',
    HP_GREEN:    '#4ADE80',
    HP_YELLOW:   '#FACC15',
    HP_RED:      '#EF4444',
    XP_BLUE:     '#60A5FA',
    GOLD:        '#FFD700',
    TEXT:        '#F1F5F9',
    TEXT_DIM:    '#94A3B8',
    ACCENT:      '#E94560',
    CORRECT:     '#22C55E',
    WRONG:       '#EF4444',
    TIMER:       '#38BDF8',
    TIMER_WARN:  '#F97316',
    HINT_BG:     '#7C3AED',
    CATCH_ORB:   '#F472B6',
    SHADOW:      'rgba(0,0,0,0.35)',
  };

  const FONT = {
    sm:     '14px "Press Start 2P", monospace',
    md:     '16px "Press Start 2P", monospace',
    lg:     '20px "Press Start 2P", monospace',
    xl:     '26px "Press Start 2P", monospace',
    xxl:    '32px "Press Start 2P", monospace',
    body:   'bold 18px monospace',
    bodyLg: 'bold 22px monospace',
    title:  'bold 28px monospace',
  };

  const ANIM = {
    INTRO_FLASH:     150,
    INTRO_SLIDE:     350,
    ATTACK_FLASH:    120,
    ATTACK_SHAKE:    300,
    HP_DRAIN:        600,
    FAINT:           700,
    CATCH_FLY:       500,
    CATCH_SHAKE:     400,
    CATCH_BREAK:     300,
    LEVEL_SPARKLE:   1200,
    EVOLVE_FLASH:    2000,
    VICTORY_DELAY:   1500,
    DAMAGE_FLOAT:    900,
    RESOLVE_PAUSE:   1000,
    ENEMY_PAUSE:     800,
  };

  // ---------------------------------------------------------------------------
  // Internal battle state
  // ---------------------------------------------------------------------------

  let _active = false;
  let _canvas = null;
  let _ctx = null;
  let _W = 0;
  let _H = 0;
  let _resolve = null;
  let _animFrameId = null;
  let _lastTime = 0;

  // Virtual viewport for consistent rendering regardless of canvas size
  var VIRT_W = 800;
  var VIRT_H = 480;

  /** The live battle state object. Reset for each battle via initBattle(). */
  let B = null;

  function initBattle() {
    return {
      phase: PHASE.INTRO,
      type: 'wild',
      trainerData: null,
      trainerCreatureIndex: 0,

      // Player creature (active member of the team)
      player: null,
      playerMaxHP: 0,
      playerDisplayHP: 0,
      playerX: 0,
      playerY: 0,
      playerAlpha: 1,
      playerShakeX: 0,
      playerScale: 1,

      // Enemy creature
      enemy: null,
      enemyDisplayHP: 0,
      enemyX: 0,
      enemyY: 0,
      enemyAlpha: 1,
      enemyShakeX: 0,
      enemyScale: 1,

      // Action chosen this turn
      chosenAction: null,
      chosenMove: null,
      chosenItem: null,
      chosenSwitchIndex: null,

      // Math problem
      mathProblem: null,
      mathStartTime: 0,
      mathTimeLeft: 0,
      mathAnswer: null,
      mathCorrect: null,
      mathResult: null,

      // Menu state
      menuCursor: 0,
      menuItems: [],
      scrollOffset: 0,

      // Animation state
      animTimer: 0,
      animType: null,
      animData: {},

      // Floating damage numbers
      floatingTexts: [],

      // Streak display
      streak: 0,
      streakMessage: '',

      // Battle results
      xpGained: 0,
      goldGained: 0,
      caughtCreature: null,
      outcome: null,

      // Intro animation
      introTimer: 0,

      // Messages
      messageQueue: [],
      currentMessage: '',
      messageTimer: 0,

      // Level up / evolution info for end-of-battle screens
      levelUpInfo: null,
      evolutionInfo: null,

      // Button rectangles populated each render frame for hit-testing
      buttons: [],

      // Hint
      hintText: null,
      hintVisible: false,

      // Victory screen counters
      victoryXPDisplay: 0,
      victoryGoldDisplay: 0,

      // Speed bonus (set in submitMathAnswer)
      speedBonus: 1,
      speedLabel: null,

      // Attack particles (type-based animations)
      attackParticles: [],

      // Evolution sparkle particles
      evoParticles: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }
  function randInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function inRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function hpColor(ratio) {
    if (ratio > 0.5) return C.HP_GREEN;
    if (ratio > 0.25) return C.HP_YELLOW;
    return C.HP_RED;
  }

  function easeOut(t) { return t * (2 - t); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  // ---------------------------------------------------------------------------
  // Creature helpers
  // ---------------------------------------------------------------------------

  /** Resolve move IDs/objects to full move data for battle use. */
  function resolveMoves(moveDefs, level) {
    if (!moveDefs || moveDefs.length === 0) {
      return [{ id: 'tackle', name: 'Tackle', power: 40, type: 'normal', accuracy: 0.95 }];
    }
    var gd = GameData();
    var resolved = [];
    for (var i = 0; i < moveDefs.length; i++) {
      var entry = moveDefs[i];
      // Skip moves above current level
      if (entry.learnLevel && entry.learnLevel > level) continue;
      // Get move ID
      var moveId = entry.moveId || entry.move || entry.id || (typeof entry === 'string' ? entry : null);
      if (!moveId) {
        // Already a full move object
        if (entry.name && entry.power != null) { resolved.push(entry); continue; }
        continue;
      }
      // Look up in GameData.moves
      var moveData = gd && gd.moves ? gd.moves[moveId] : null;
      if (!moveData && gd && gd.getMove) moveData = gd.getMove(moveId);
      if (moveData) {
        resolved.push({
          id: moveData.id || moveId,
          name: moveData.name || moveId,
          power: moveData.power || 40,
          type: moveData.type || 'normal',
          accuracy: moveData.accuracy || 0.9,
          effect: moveData.effect || null,
          mathContext: moveData.mathContext || 'attack',
        });
      } else {
        // Fallback
        resolved.push({ id: moveId, name: moveId, power: 40, type: 'normal', accuracy: 0.9 });
      }
    }
    return resolved.slice(-4);
  }

  function buildCreature(creatureId, level) {
    // Ensure creatureId is a string
    if (typeof creatureId !== 'string') {
      creatureId = (creatureId && (creatureId.creatureId || creatureId.id || creatureId.name)) || 'goblin';
    }
    const gd = GameData();
    const base = gd
      ? (gd.creatures && gd.creatures[creatureId]) || (gd.getCreature && gd.getCreature(creatureId))
      : null;

    if (!base) {
      // Fallback: synthesise a reasonable creature so battles always work.
      return {
        id: creatureId,
        name: creatureId.charAt(0).toUpperCase() + creatureId.slice(1),
        level: level,
        hp: 20 + level * 5,
        maxHP: 20 + level * 5,
        attack: 10 + level * 2,
        defense: 8 + level * 2,
        speed: 8 + level * 2,
        type: 'normal',
        moves: [
          { name: 'Tackle', power: 40, type: 'normal' },
          { name: 'Scratch', power: 35, type: 'normal' },
        ],
        xpYield: 50 + level * 10,
        catchRate: 0.4,
        spriteId: creatureId,
        evolveLevel: null,
        evolveTo: null,
      };
    }

    const hp  = Math.floor((base.baseHP      || 45) * (1 + level * 0.08));
    const atk = Math.floor((base.baseAttack   || 12) * (1 + level * 0.06));
    const def = Math.floor((base.baseDefense  || 10) * (1 + level * 0.06));
    const spd = Math.floor((base.baseSpeed    || 10) * (1 + level * 0.06));

    return {
      id: creatureId,
      name: base.name || creatureId,
      level: level,
      hp: hp,
      maxHP: hp,
      attack: atk,
      defense: def,
      speed: spd,
      type: base.type || 'normal',
      moves: resolveMoves(base.moves, level),
      xpYield: base.xpYield || (50 + level * 10),
      catchRate: base.catchRate || 0.4,
      spriteId: base.spriteKey || base.spriteId || creatureId,
      evolveLevel: base.evolveLevel || null,
      evolveTo: base.evolveTo || null,
    };
  }

  function getPlayerCreature() {
    const gs = GameState();
    if (!gs) return null;
    const team = gs.team || (gs.getTeam && gs.getTeam()) || [];
    return team.find(function (c) { return c.hp > 0; }) || team[0] || null;
  }

  function getPlayerTeam() {
    const gs = GameState();
    if (!gs) return [];
    return gs.team || (gs.getTeam && gs.getTeam()) || [];
  }

  function getPlayerInventory() {
    var gs = GameState();
    if (!gs) return [];
    var inv = gs.inventory || (gs.getInventory && gs.getInventory()) || {};
    var gd = GameData();
    // gs.inventory is { itemId: count } — convert to array of item objects
    if (inv && typeof inv === 'object' && !Array.isArray(inv)) {
      var arr = [];
      var keys = Object.keys(inv);
      for (var i = 0; i < keys.length; i++) {
        var count = inv[keys[i]];
        if (count <= 0) continue;
        var itemData = (gd && gd.items && gd.items[keys[i]]) || {};
        arr.push({
          id: keys[i],
          name: itemData.name || keys[i],
          quantity: count,
          category: itemData.category || 'misc',
          effect: itemData.effect || null,
          usableInBattle: itemData.usableInBattle !== false,
          _invKey: keys[i],  // for decrementing later
        });
      }
      return arr;
    }
    return Array.isArray(inv) ? inv : [];
  }

  function getTypeMultiplier(moveType, defenderType) {
    const gd = GameData();
    if (gd && gd.typeChart) {
      const m = gd.typeChart[moveType] && gd.typeChart[moveType][defenderType];
      if (m !== undefined) return m;
    }
    if (gd && gd.getTypeMultiplier) {
      return gd.getTypeMultiplier(moveType, defenderType);
    }
    // Built-in fallback chart
    var chart = {
      fire:     { grass: 2, water: 0.5, fire: 0.5, ice: 2 },
      water:    { fire: 2, grass: 0.5, water: 0.5, ground: 2 },
      grass:    { water: 2, fire: 0.5, grass: 0.5, ground: 2 },
      electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0 },
      ground:   { fire: 2, electric: 2, grass: 0.5 },
      ice:      { grass: 2, ground: 2, fire: 0.5, water: 0.5 },
    };
    return (chart[moveType] && chart[moveType][defenderType]) || 1;
  }

  // ---------------------------------------------------------------------------
  // Damage calculation
  // ---------------------------------------------------------------------------

  function calcDamage(move, attacker, defender, correctAnswer) {
    var levelFactor = (2 * attacker.level / 5 + 2);
    var atkStat = attacker.attack || 12;
    var defStat = defender.defense || 10;
    var baseDmg = (levelFactor * (move.power || 40) * atkStat / defStat) / 50 + 2;
    var typeMultiplier = getTypeMultiplier(move.type || 'normal', defender.type || 'normal');
    var random = 0.85 + Math.random() * 0.15;

    var dmg;
    if (correctAnswer) {
      dmg = Math.max(1, Math.floor(baseDmg * typeMultiplier * random));
    } else {
      dmg = Math.max(1, Math.floor(baseDmg * typeMultiplier * random * 0.25));
    }
    return { damage: dmg, typeMultiplier: typeMultiplier };
  }

  // ---------------------------------------------------------------------------
  // XP and leveling
  // ---------------------------------------------------------------------------

  function calcXPGain(enemy) {
    return Math.floor((enemy.xpYield || 60) * (enemy.level || 1) / 5);
  }

  function checkLevelUp(creature) {
    if (!creature || creature.xp === undefined) return null;
    var gd = GameData();
    var xpNeeded = (gd && gd.xpCurve) ? gd.xpCurve(creature.level) : (creature.level * creature.level * 10);

    if (creature.xp >= xpNeeded) {
      var oldLevel = creature.level;
      creature.level += 1;
      creature.xp -= xpNeeded;

      if (gd && gd.levelUpStats) {
        gd.levelUpStats(creature, creature.level);
      } else {
        var hpGain  = randInt(2, 5);
        var atkGain = randInt(1, 3);
        var defGain = randInt(1, 3);
        creature.maxHP   += hpGain;
        creature.hp      += hpGain;
        creature.attack  = (creature.attack  || 12) + atkGain;
        creature.defense = (creature.defense || 10) + defGain;
      }

      return { oldLevel: oldLevel, newLevel: creature.level };
    }
    return null;
  }

  function checkEvolution(creature) {
    if (creature.evolveLevel && creature.level >= creature.evolveLevel && creature.evolveTo) {
      return { from: creature.name, to: creature.evolveTo, level: creature.level };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Canvas drawing primitives
  // ---------------------------------------------------------------------------

  function clear() {
    _ctx.fillStyle = C.BLACK;
    _ctx.fillRect(0, 0, VIRT_W, VIRT_H);
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    _ctx.beginPath();
    _ctx.moveTo(x + r, y);
    _ctx.lineTo(x + w - r, y);
    _ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    _ctx.lineTo(x + w, y + h - r);
    _ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    _ctx.lineTo(x + r, y + h);
    _ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    _ctx.lineTo(x, y + r);
    _ctx.quadraticCurveTo(x, y, x + r, y);
    _ctx.closePath();
  }

  function fillRoundRect(x, y, w, h, r, color) {
    _ctx.fillStyle = color;
    roundRect(x, y, w, h, r);
    _ctx.fill();
  }

  function strokeRoundRect(x, y, w, h, r, color, lw) {
    _ctx.strokeStyle = color;
    _ctx.lineWidth = lw || 2;
    roundRect(x, y, w, h, r);
    _ctx.stroke();
  }

  function drawText(text, x, y, font, color, align, shadow) {
    _ctx.font = font;
    _ctx.textAlign = align || 'left';
    _ctx.textBaseline = 'top';
    if (shadow) {
      _ctx.fillStyle = 'rgba(0,0,0,0.5)';
      _ctx.fillText(text, x + 2, y + 2);
    }
    _ctx.fillStyle = color;
    _ctx.fillText(text, x, y);
  }

  function drawHPBar(x, y, w, h, current, max) {
    var ratio = clamp(current / Math.max(1, max), 0, 1);
    fillRoundRect(x, y, w, h, h / 2, '#333');
    if (ratio > 0) {
      fillRoundRect(x, y, Math.max(h, w * ratio), h, h / 2, hpColor(ratio));
    }
    strokeRoundRect(x, y, w, h, h / 2, '#555', 1);
  }

  function drawXPBar(x, y, w, h, current, max) {
    var ratio = max > 0 ? clamp(current / max, 0, 1) : 0;
    fillRoundRect(x, y, w, h, h / 2, '#222');
    if (ratio > 0) {
      fillRoundRect(x, y, Math.max(h, w * ratio), h, h / 2, C.XP_BLUE);
    }
  }

  /** Draw a button rectangle and register it for click detection. */
  function drawButton(id, x, y, w, h, label, color, textColor, highlighted) {
    var bg = highlighted ? C.ACCENT : (color || C.PANEL);
    fillRoundRect(x, y, w, h, 8, bg);
    if (highlighted) {
      strokeRoundRect(x, y, w, h, 8, C.WHITE, 3);
    } else {
      strokeRoundRect(x, y, w, h, 8, C.PANEL_LITE, 2);
    }
    drawText(label, x + w / 2, y + h / 2 - 9, FONT.body, textColor || C.TEXT, 'center');
    B.buttons.push({ id: id, x: x, y: y, w: w, h: h });
  }

  /** Draw a creature sprite — PNG sprite sheet if available, else pixel array. */
  function drawCreatureSprite(spriteId, x, y, w, h, alpha, scale, flip) {
    if (!_ctx) return;

    var effectiveScale = (typeof scale === 'number' && scale > 0) ? scale : 1;
    var effectiveAlpha = (typeof alpha === 'number') ? clamp(alpha, 0, 1) : 1;

    var sw = w * effectiveScale;
    var sh = h * effectiveScale;
    var dx = x + (w - sw) / 2;
    var dy = y + (h - sh);

    _ctx.save();
    _ctx.globalAlpha = effectiveAlpha;

    var drawn = false;

    // --- PNG sprite sheet path ---
    var ssd = window.SpriteSheetData && window.SpriteSheetData.getSpriteSheetData(spriteId);
    if (ssd) {
      var img = window.SpriteSheetData.getImage(ssd.sheetSrc);
      if (img && img.complete && img.naturalWidth > 0) {
        var fr = ssd.frames.idle;
        // Draw shadow ellipse
        _ctx.fillStyle = 'rgba(0,0,0,0.18)';
        _ctx.beginPath();
        _ctx.ellipse(dx + sw / 2, dy + sh + 2, sw * 0.38, 7, 0, 0, Math.PI * 2);
        _ctx.fill();
        // Flip horizontally if needed (player creature faces right)
        if (flip) {
          _ctx.save();
          _ctx.translate(dx + sw, dy);
          _ctx.scale(-1, 1);
          _ctx.drawImage(img, fr.sx, fr.sy, fr.sw, fr.sh, 0, 0, sw, sh);
          _ctx.restore();
        } else {
          _ctx.drawImage(img, fr.sx, fr.sy, fr.sw, fr.sh, dx, dy, sw, sh);
        }
        drawn = true;
      }
    }

    var sprites = Sprites();

    if (!drawn && sprites && sprites.creatures && sprites.creatures[spriteId]) {
      var creatureData = sprites.creatures[spriteId];
      var spriteData = creatureData.front;

      if (spriteData && Array.isArray(spriteData) && spriteData.length > 0) {
        // Use flip if needed
        if (flip && typeof sprites.flipH === 'function') {
          spriteData = sprites.flipH(spriteData);
        }
        // Calculate scale factor: sprite is 32x32 (or 16x16), we want it to fill sw x sh
        var spriteW = spriteData[0].length || 16;
        var spriteH = spriteData.length;
        var pixelScale = Math.floor(Math.min(sw / spriteW, sh / spriteH));
        if (pixelScale < 1) pixelScale = 1;

        // Center the sprite in the allocated space
        var renderedW = spriteW * pixelScale;
        var renderedH = spriteH * pixelScale;
        var offsetX = dx + Math.floor((sw - renderedW) / 2);
        var offsetY = dy + (sh - renderedH);

        // Draw dark shadow behind creature for visibility against sky
        _ctx.fillStyle = 'rgba(0,0,0,0.15)';
        _ctx.beginPath();
        _ctx.ellipse(offsetX + renderedW / 2, offsetY + renderedH + 2, renderedW * 0.4, 6, 0, 0, Math.PI * 2);
        _ctx.fill();

        // Draw each pixel directly (proven method from Sprites.drawSprite)
        for (var row = 0; row < spriteH; row++) {
          for (var col = 0; col < spriteW; col++) {
            var color = spriteData[row][col];
            if (color) {
              _ctx.fillStyle = color;
              _ctx.fillRect(offsetX + col * pixelScale, offsetY + row * pixelScale, pixelScale, pixelScale);
            }
          }
        }
        drawn = true;
      }
    }

    if (!drawn) {
      // Big bright placeholder so we know sprite lookup failed
      _ctx.fillStyle = '#FF00FF';
      _ctx.fillRect(dx, dy, sw, sh);
      _ctx.fillStyle = '#000';
      _ctx.font = '12px monospace';
      _ctx.fillText('NO SPRITE: ' + spriteId, dx + 4, dy + sh / 2);
    }

    _ctx.restore();
  }

  function drawPlaceholderSprite(x, y, w, h) {
    // Body
    _ctx.fillStyle = '#7C3AED';
    _ctx.beginPath();
    _ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    _ctx.fill();
    // Eyes
    _ctx.fillStyle = C.WHITE;
    _ctx.beginPath();
    _ctx.arc(x + w * 0.38, y + h * 0.5, w * 0.08, 0, Math.PI * 2);
    _ctx.fill();
    _ctx.beginPath();
    _ctx.arc(x + w * 0.62, y + h * 0.5, w * 0.08, 0, Math.PI * 2);
    _ctx.fill();
    // Pupils
    _ctx.fillStyle = C.BLACK;
    _ctx.beginPath();
    _ctx.arc(x + w * 0.40, y + h * 0.51, w * 0.035, 0, Math.PI * 2);
    _ctx.fill();
    _ctx.beginPath();
    _ctx.arc(x + w * 0.64, y + h * 0.51, w * 0.035, 0, Math.PI * 2);
    _ctx.fill();
    // Mouth
    _ctx.strokeStyle = C.BLACK;
    _ctx.lineWidth = 2;
    _ctx.beginPath();
    _ctx.arc(x + w * 0.5, y + h * 0.62, w * 0.1, 0.1 * Math.PI, 0.9 * Math.PI);
    _ctx.stroke();
  }

  /** Draw the battle background (darker sky, ground, platforms). */
  function drawBattleBg() {
    // Darker sky gradient so creature sprites are clearly visible
    var skyGrad = _ctx.createLinearGradient(0, 0, 0, _H * 0.5);
    skyGrad.addColorStop(0, '#2A5A8A');
    skyGrad.addColorStop(1, '#4A8AB8');
    _ctx.fillStyle = skyGrad;
    _ctx.fillRect(0, 0, _W, _H * 0.5);

    // Lighter horizon band
    _ctx.fillStyle = '#5A9AC8';
    _ctx.fillRect(0, _H * 0.42, _W, _H * 0.08);

    // Ground
    _ctx.fillStyle = '#4A9838';
    _ctx.fillRect(0, _H * 0.5, _W, _H * 0.5);
    _ctx.fillStyle = '#3A8828';
    _ctx.fillRect(0, _H * 0.55, _W, _H * 0.45);

    // Grass detail
    _ctx.fillStyle = '#5AAA48';
    for (var gx = 0; gx < _W; gx += 20) {
      _ctx.fillRect(gx, _H * 0.5 + 4, 8, 4);
      _ctx.fillRect(gx + 10, _H * 0.6, 6, 3);
    }

    // Distant trees
    _ctx.fillStyle = '#2A7020';
    for (var dtx = 0; dtx < _W; dtx += 40) {
      _ctx.beginPath();
      _ctx.arc(dtx + 20, _H * 0.5, 18, Math.PI, 0);
      _ctx.fill();
    }
    return;

    // Ground gradient
    var groundGrad = _ctx.createLinearGradient(0, _H * 0.55, 0, _H);
    groundGrad.addColorStop(0, '#2D5016');
    groundGrad.addColorStop(1, '#1A3409');
    _ctx.fillStyle = groundGrad;
    _ctx.fillRect(0, _H * 0.55, _W, _H * 0.45);

    // Enemy platform (upper right)
    _ctx.fillStyle = '#3D6B24';
    _ctx.beginPath();
    _ctx.ellipse(_W * 0.7, _H * 0.36, _W * 0.18, 22, 0, 0, Math.PI * 2);
    _ctx.fill();
    _ctx.fillStyle = '#2D5016';
    _ctx.beginPath();
    _ctx.ellipse(_W * 0.7, _H * 0.36, _W * 0.18, 14, 0, 0, Math.PI * 2);
    _ctx.fill();

    // Player platform (lower left)
    _ctx.fillStyle = '#3D6B24';
    _ctx.beginPath();
    _ctx.ellipse(_W * 0.28, _H * 0.59, _W * 0.18, 22, 0, 0, Math.PI * 2);
    _ctx.fill();
    _ctx.fillStyle = '#2D5016';
    _ctx.beginPath();
    _ctx.ellipse(_W * 0.28, _H * 0.59, _W * 0.18, 14, 0, 0, Math.PI * 2);
    _ctx.fill();
  }

  function drawPanelBg(y, h) {
    fillRoundRect(0, y, _W, h, 0, C.DARK);
    _ctx.fillStyle = C.PANEL;
    _ctx.fillRect(0, y, _W, 3);
  }

  function drawOrb(x, y, r) {
    var grad = _ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, '#FFC0CB');
    grad.addColorStop(0.6, C.CATCH_ORB);
    grad.addColorStop(1, '#9D174D');
    _ctx.fillStyle = grad;
    _ctx.beginPath();
    _ctx.arc(x, y, r, 0, Math.PI * 2);
    _ctx.fill();
    // Shine
    _ctx.fillStyle = 'rgba(255,255,255,0.5)';
    _ctx.beginPath();
    _ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.3, 0, Math.PI * 2);
    _ctx.fill();
  }

  /** Simple word-wrap that respects canvas measureText. */
  function wrapText(text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var currentLine = '';
    _ctx.font = FONT.bodyLg;

    for (var i = 0; i < words.length; i++) {
      var test = currentLine ? currentLine + ' ' + words[i] : words[i];
      if (_ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [text];
  }

  // ---------------------------------------------------------------------------
  // Shared scene renderer (background + creatures + info boxes + floating text)
  //
  // Returns { panelY, panelH } for panel placement.
  // ---------------------------------------------------------------------------

  function renderBattleScene() {
    var panelH = Math.floor(_H * 0.35);
    var panelY = _H - panelH;

    drawBattleBg();


    // ---- Enemy creature ----
    if (B.enemy) {
      var ew = 160, eh = 160;
      var ex = _W * 0.7 - ew / 2 + B.enemyShakeX;
      var ey = _H * 0.38 - eh;
      B.enemyX = ex;
      B.enemyY = ey;

      drawCreatureSprite(B.enemy.spriteId, ex, ey, ew, eh, B.enemyAlpha, B.enemyScale, false);

      // Enemy info box (top-left)
      fillRoundRect(10, 10, 270, 62, 10, 'rgba(15,52,96,0.92)');
      strokeRoundRect(10, 10, 270, 62, 10, '#334155', 2);
      drawText(B.enemy.name, 18, 16, FONT.body, C.TEXT);
      drawText('Lv.' + B.enemy.level, 204, 16, FONT.sm, C.TEXT_DIM);
      drawHPBar(18, 42, 200, 14, B.enemyDisplayHP, B.enemy.maxHP);
      drawText(Math.ceil(Math.max(0, B.enemyDisplayHP)) + '/' + B.enemy.maxHP, 225, 41, FONT.sm, C.TEXT_DIM);
    }

    // ---- Player creature ----
    if (B.player) {
      var pw = 192, ph = 192;
      var px = _W * 0.25 - pw / 2 + B.playerShakeX;
      var py = _H * 0.58 - ph;
      B.playerX = px;
      B.playerY = py;

      drawCreatureSprite(B.player.spriteId || B.player.id, px, py, pw, ph, B.playerAlpha, B.playerScale, true);

      // Player info box (right side, just above panel)
      var infoX = _W - 285;
      var infoY = panelY - 80;
      fillRoundRect(infoX, infoY, 275, 72, 10, 'rgba(15,52,96,0.92)');
      strokeRoundRect(infoX, infoY, 275, 72, 10, '#334155', 2);
      drawText(B.player.name || B.player.id, infoX + 10, infoY + 8, FONT.body, C.TEXT);
      drawText('Lv.' + B.player.level, infoX + 200, infoY + 8, FONT.sm, C.TEXT_DIM);
      drawHPBar(infoX + 10, infoY + 32, 200, 14, B.playerDisplayHP, B.playerMaxHP);
      drawText(Math.ceil(Math.max(0, B.playerDisplayHP)) + '/' + B.playerMaxHP, infoX + 218, infoY + 31, FONT.sm, C.TEXT_DIM);

      // XP bar
      var xpNeeded = (GameData() && GameData().xpCurve) ? GameData().xpCurve(B.player.level) : (B.player.level * B.player.level * 10);
      drawXPBar(infoX + 10, infoY + 54, 200, 7, B.player.xp || 0, xpNeeded);
    }

    // ---- Floating damage / heal texts ----
    for (var fi = 0; fi < B.floatingTexts.length; fi++) {
      var ft = B.floatingTexts[fi];
      var progress = 1 - ft.timer / ft.maxTimer;
      var alpha = 1 - progress;
      var yOff = -50 * easeOut(progress);
      _ctx.globalAlpha = alpha;
      drawText(ft.text, ft.x, ft.startY + yOff, FONT.lg, ft.color, 'center', true);
      _ctx.globalAlpha = 1;
    }

    // ---- Streak counter ----
    if (B.streak >= 3) {
      var streakText = 'x' + B.streak + ' streak!';
      var pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2;
      _ctx.globalAlpha = pulse;
      drawText(streakText, _W / 2, 82, FONT.bodyLg, C.GOLD, 'center', true);
      _ctx.globalAlpha = 1;
    }

    return { panelY: panelY, panelH: panelH };
  }

  // ---------------------------------------------------------------------------
  // Phase renderers
  // ---------------------------------------------------------------------------

  function renderIntro(dt) {
    B.introTimer += dt;
    var t = B.introTimer;

    // Slide creatures in (alpha always 1 so sprites are visible immediately)
    var slideProgress = clamp((t - ANIM.INTRO_FLASH) / ANIM.INTRO_SLIDE, 0, 1);
    var ease = easeOut(slideProgress);
    B.enemyAlpha  = 1;
    B.playerAlpha = 1;
    B.enemyScale  = 0.5 + 0.5 * ease;
    B.playerScale = 0.5 + 0.5 * ease;

    var scene = renderBattleScene();

    // Flash effect (drawn over scene)
    if (t < ANIM.INTRO_FLASH) {
      var flashAlpha = 1 - t / ANIM.INTRO_FLASH;
      _ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
      _ctx.fillRect(0, 0, _W, _H);
    }

    // Panel message
    drawPanelBg(scene.panelY, scene.panelH);
    var enemyName = B.enemy ? B.enemy.name : 'enemy';
    var msg;
    if (B.type === 'wild') {
      msg = 'A wild ' + enemyName + ' appeared!';
    } else if (B.type === 'boss') {
      msg = 'Boss battle! ' + ((B.trainerData && B.trainerData.name) || 'Boss') + ' sends out ' + enemyName + '!';
    } else {
      msg = ((B.trainerData && B.trainerData.name) || 'Trainer') + ' sends out ' + enemyName + '!';
    }
    drawText(msg, 24, scene.panelY + 24, FONT.body, C.TEXT);

    if (t > ANIM.INTRO_FLASH + ANIM.INTRO_SLIDE + 300) {
      B.phase = PHASE.ACTION_SELECT;
      B.enemyScale  = 1;
      B.playerScale = 1;
      B.enemyAlpha  = 1;
      B.playerAlpha = 1;
    }
  }

  // ---- ACTION SELECT ----

  function renderActionSelect() {
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    var msg = 'What will ' + ((B.player && B.player.name) || 'your creature') + ' do?';
    drawText(msg, 24, scene.panelY + 14, FONT.body, C.TEXT);

    var available = ['FIGHT'];
    if (B.type === 'wild') available.push('CATCH');
    available.push('ITEM');
    if (B.type === 'wild') available.push('RUN');
    available.push('SWITCH');
    B.menuItems = available;

    var btnW = Math.floor((_W - 60) / 2);
    var btnH = 46;
    var startX = 20;
    var startY = scene.panelY + 42;
    var gap = 8;

    var colorMap = {
      FIGHT: '#B91C1C', CATCH: '#7C3AED', ITEM: '#15803D',
      RUN: '#CA8A04', SWITCH: '#0369A1',
    };

    for (var i = 0; i < available.length; i++) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = startX + col * (btnW + gap);
      var by = startY + row * (btnH + gap);
      drawButton('action_' + i, bx, by, btnW, btnH, available[i], colorMap[available[i]] || C.PANEL, C.WHITE, i === B.menuCursor);
    }

    // Control hint
    var hintY = scene.panelY + scene.panelH - 16;
    _ctx.globalAlpha = 0.6;
    drawText('\u2190\u2191\u2193\u2192 / Click to choose   |   Enter to confirm', _W / 2, hintY, FONT.sm, C.TEXT_DIM, 'center');
    _ctx.globalAlpha = 1;
  }

  // ---- MOVE SELECT ----

  function renderMoveSelect() {
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    drawText('Choose a move:', 24, scene.panelY + 16, FONT.body, C.TEXT);

    var moves = (B.player && B.player.moves) || [{ name: 'Tackle', power: 40, type: 'normal' }];
    B.menuItems = moves;

    var btnW = Math.floor((_W - 60) / 2);
    var btnH = 52;
    var startX = 20;
    var startY = scene.panelY + 50;
    var gap = 10;

    for (var i = 0; i < moves.length; i++) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = startX + col * (btnW + gap);
      var by = startY + row * (btnH + gap);
      var label = moves[i].name + ' (' + (moves[i].power || '?') + ')';
      drawButton('move_' + i, bx, by, btnW, btnH, label, C.PANEL, C.WHITE, i === B.menuCursor);
    }

    // Back button
    var backY = startY + Math.ceil(moves.length / 2) * (btnH + gap);
    drawButton('back', startX, backY, 110, 40, 'BACK', '#555', C.TEXT, false);

    // Control hint
    var hintY = scene.panelY + scene.panelH - 16;
    _ctx.globalAlpha = 0.6;
    drawText('Pick a move   |   Esc = back', _W / 2, hintY, FONT.sm, C.TEXT_DIM, 'center');
    _ctx.globalAlpha = 1;
  }

  // ---- ITEM SELECT ----

  function renderItemSelect() {
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    drawText('Choose an item:', 24, scene.panelY + 16, FONT.body, C.TEXT);

    var items = getPlayerInventory().filter(function (item) { return item.usableInBattle !== false; });
    B.menuItems = items;

    if (items.length === 0) {
      drawText('No items available!', 24, scene.panelY + 52, FONT.body, C.TEXT_DIM);
      drawButton('back', 20, scene.panelY + 90, 110, 40, 'BACK', '#555', C.TEXT, true);
      return;
    }

    var btnW = Math.floor((_W - 60) / 2);
    var btnH = 48;
    var startX = 20;
    var startY = scene.panelY + 50;
    var gap = 8;

    var visible = items.slice(B.scrollOffset, B.scrollOffset + 4);
    for (var i = 0; i < visible.length; i++) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = startX + col * (btnW + gap);
      var by = startY + row * (btnH + gap);
      var idx = B.scrollOffset + i;
      var label = visible[i].name + ' x' + (visible[i].quantity || 1);
      drawButton('item_' + idx, bx, by, btnW, btnH, label, '#15803D', C.WHITE, idx === B.menuCursor);
    }

    var backY = startY + 2 * (btnH + gap) + 10;
    drawButton('back', startX, backY, 110, 40, 'BACK', '#555', C.TEXT, false);
  }

  // ---- SWITCH SELECT ----

  function renderSwitchSelect() {
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    var forced = B.player && B.player.hp <= 0;
    drawText(forced ? 'Choose next creature:' : 'Switch to:', 24, scene.panelY + 16, FONT.body, C.TEXT);

    var team = getPlayerTeam();
    B.menuItems = team;

    var btnW = Math.floor((_W - 60) / 2);
    var btnH = 48;
    var startX = 20;
    var startY = scene.panelY + 50;
    var gap = 8;

    for (var i = 0; i < team.length; i++) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = startX + col * (btnW + gap);
      var by = startY + row * (btnH + gap);
      var c = team[i];
      var isCurrent = c === B.player;
      var isFainted = c.hp <= 0;
      var label = (c.name || c.id) + ' Lv' + c.level + ' ' + Math.max(0, c.hp) + '/' + (c.maxHP || c.maxHp || c.hp);
      var bg = isCurrent ? '#444' : (isFainted ? '#7F1D1D' : '#0369A1');
      var tc = (isCurrent || isFainted) ? C.TEXT_DIM : C.WHITE;
      drawButton('switch_' + i, bx, by, btnW, btnH, label, bg, tc, i === B.menuCursor);
    }

    if (!forced) {
      var backY = startY + Math.ceil(team.length / 2) * (btnH + gap);
      drawButton('back', startX, backY, 110, 40, 'BACK', '#555', C.TEXT, false);
    }
  }

  // ---- MATH PROBLEM ----

  function renderMathProblem(dt) {
    renderBattleScene();

    if (!B.mathProblem) return;

    // Darken
    _ctx.fillStyle = 'rgba(0,0,0,0.65)';
    _ctx.fillRect(0, 0, _W, _H);

    var mw = Math.min(_W - 40, 500);
    var mh = 360;
    var mx = (_W - mw) / 2;
    var my = (_H - mh) / 2 - 20;

    fillRoundRect(mx, my, mw, mh, 16, 'rgba(15,20,50,0.96)');
    strokeRoundRect(mx, my, mw, mh, 16, '#3B82F6', 3);

    // Question text (word-wrapped)
    var q = B.mathProblem.question || '';
    var maxTextW = mw - 40;
    var lines = wrapText(q, maxTextW);
    var textY = my + 28;
    for (var li = 0; li < lines.length; li++) {
      drawText(lines[li], mx + mw / 2, textY, FONT.bodyLg, C.WHITE, 'center');
      textY += 30;
    }

    // Timer bar
    var timerY = textY + 14;
    var timerW = mw - 40;
    var timerH = 14;
    var timerX = mx + 20;
    var timeLimit = B.mathProblem.timeLimit || 15;
    var timeRatio = clamp(B.mathTimeLeft / timeLimit, 0, 1);
    var timerColor = B.mathTimeLeft < 3 ? C.TIMER_WARN : C.TIMER;

    fillRoundRect(timerX, timerY, timerW, timerH, timerH / 2, '#1E293B');
    if (timeRatio > 0) {
      fillRoundRect(timerX, timerY, Math.max(timerH, timerW * timeRatio), timerH, timerH / 2, timerColor);
    }

    // Pulse when < 3 seconds
    if (B.mathTimeLeft < 3 && B.mathTimeLeft > 0) {
      var pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
      _ctx.globalAlpha = pulse;
      fillRoundRect(timerX, timerY, Math.max(timerH, timerW * timeRatio), timerH, timerH / 2, '#FF6B6B');
      _ctx.globalAlpha = 1;
    }

    // Answer choices (2 x 2)
    var choices = B.mathProblem.choices || [];
    var choiceBtnW = Math.floor((mw - 60) / 2);
    var choiceBtnH = 58;
    var choiceStartX = mx + 20;
    var choiceStartY = timerY + timerH + 22;
    var choiceGap = 12;

    for (var ci = 0; ci < choices.length; ci++) {
      var ccol = ci % 2;
      var crow = Math.floor(ci / 2);
      var bx = choiceStartX + ccol * (choiceBtnW + choiceGap);
      var by = choiceStartY + crow * (choiceBtnH + choiceGap);
      var highlighted = ci === B.menuCursor && B.mathAnswer === null;

      var bg = C.PANEL;
      var tc = C.WHITE;

      // After answering, highlight correct / wrong
      if (B.mathAnswer !== null) {
        if (choices[ci] === B.mathProblem.answer) {
          bg = C.CORRECT;
        } else if (choices[ci] === B.mathAnswer && !B.mathCorrect) {
          bg = C.WRONG;
        }
      }

      drawButton('choice_' + ci, bx, by, choiceBtnW, choiceBtnH, String(choices[ci]), bg, tc, highlighted);
    }

    // Hint button
    var hintY = choiceStartY + 2 * (choiceBtnH + choiceGap) + 10;
    if (!B.hintVisible && B.mathAnswer === null) {
      drawButton('hint', mx + mw / 2 - 65, hintY, 130, 38, 'Hint', C.HINT_BG, C.WHITE, false);
    }

    // Hint text
    if (B.hintVisible && B.hintText) {
      fillRoundRect(mx + 20, hintY, mw - 40, 38, 6, 'rgba(124,58,237,0.3)');
      drawText(B.hintText, mx + mw / 2, hintY + 10, FONT.sm, '#C4B5FD', 'center');
    }

    // Control hint for math
    if (B.mathAnswer === null) {
      _ctx.globalAlpha = 0.5;
      drawText('Press 1-4 or click an answer   |   H = hint', mx + mw / 2, my + mh - 10, FONT.sm, C.TEXT_DIM, 'center');
      _ctx.globalAlpha = 1;
    }

    // Decrement timer
    if (B.mathAnswer === null) {
      B.mathTimeLeft -= dt;
      if (B.mathTimeLeft <= 0) {
        B.mathTimeLeft = 0;
        submitMathAnswer(null);
      }
    }
  }

  // ---- RESOLVE ----

  function renderResolve(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();

    // --- Tick and render attack particles ---
    for (var pi = B.attackParticles.length - 1; pi >= 0; pi--) {
      var p = B.attackParticles[pi];
      p.life -= dt;
      if (p.life <= 0) {
        B.attackParticles.splice(pi, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      var alpha = clamp(p.life / p.maxLife, 0, 1);
      _ctx.globalAlpha = alpha;
      _ctx.fillStyle = p.color;
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      _ctx.fill();
    }
    _ctx.globalAlpha = 1;

    drawPanelBg(scene.panelY, scene.panelH);

    if (B.currentMessage) {
      drawText(B.currentMessage, 24, scene.panelY + 28, FONT.body, C.TEXT);
    }

    if (B.animTimer > ANIM.RESOLVE_PAUSE * 2) {
      advanceResolve();
    }
  }

  // ---- ENEMY TURN ----

  function renderEnemyTurn(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    if (B.currentMessage) {
      drawText(B.currentMessage, 24, scene.panelY + 28, FONT.body, C.TEXT);
    }

    // Shake player sprite
    if (B.animTimer < ANIM.ATTACK_SHAKE) {
      B.playerShakeX = Math.sin(B.animTimer / 30 * Math.PI) * 6;
    } else {
      B.playerShakeX = 0;
    }

    if (B.animTimer > ANIM.ENEMY_PAUSE * 2) {
      finishEnemyTurn();
    }
  }

  // ---- CATCH ANIMATION ----

  function renderCatchAnim(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    var orbTargetX = _W * 0.7;
    var orbTargetY = _H * 0.25;
    var shakeCount = B.animData.shakeCount || 0;
    var caught = B.animData.caught || false;
    var totalTime = ANIM.CATCH_FLY + shakeCount * ANIM.CATCH_SHAKE + 500;

    if (B.animTimer < ANIM.CATCH_FLY) {
      // Orb flying in
      var t = B.animTimer / ANIM.CATCH_FLY;
      var startX = _W * 0.3;
      var startY = _H * 0.6;
      var cx = lerp(startX, orbTargetX, easeOut(t));
      var cy = lerp(startY, orbTargetY, easeOut(t)) - Math.sin(t * Math.PI) * 60;
      drawOrb(cx, cy, 16);
      B.enemyScale = 1 - t * 0.8;
    } else if (B.animTimer < ANIM.CATCH_FLY + shakeCount * ANIM.CATCH_SHAKE) {
      // Shaking phase
      var shakeTime = B.animTimer - ANIM.CATCH_FLY;
      var shakePhase = (shakeTime % ANIM.CATCH_SHAKE) / ANIM.CATCH_SHAKE;
      var shakeOff = Math.sin(shakePhase * Math.PI * 4) * 8;
      B.enemyScale = 0.2;
      B.enemyAlpha = 0.3;
      drawOrb(orbTargetX + shakeOff, orbTargetY, 16);
      drawText('...', _W / 2, scene.panelY + 30, FONT.lg, C.TEXT, 'center');
    } else {
      // Result
      B.enemyScale = caught ? 0 : 1;
      B.enemyAlpha = caught ? 0 : 1;

      if (caught) {
        drawOrb(orbTargetX, orbTargetY, 16);
        // Sparkle ring
        for (var si = 0; si < 6; si++) {
          var angle = (Date.now() / 200 + si * (Math.PI / 3)) % (Math.PI * 2);
          var sx = orbTargetX + Math.cos(angle) * 30;
          var sy = orbTargetY + Math.sin(angle) * 30;
          _ctx.fillStyle = C.GOLD;
          _ctx.fillRect(sx - 3, sy - 3, 6, 6);
        }
        drawText('Caught ' + B.enemy.name + '!', _W / 2, scene.panelY + 30, FONT.bodyLg, C.GOLD, 'center', true);
      } else {
        drawText(B.enemy.name + ' broke free!', _W / 2, scene.panelY + 30, FONT.body, C.WRONG, 'center');
      }

      if (B.animTimer > totalTime + 1200) {
        if (caught) {
          // Convert battle-format creature to GameState-format
          var e = B.enemy;
          B.caughtCreature = {
            uid: e.id + '_' + Date.now(),
            speciesId: e.id,
            name: e.name,
            level: e.level,
            hp: e.hp,
            maxHp: e.maxHP || e.maxHp || e.hp,
            attack: e.attack,
            defense: e.defense,
            speed: e.speed || 10,
            type: e.type,
            xp: 0,
            xpToNext: (e.level + 1) * (e.level + 1) * (e.level + 1) - e.level * e.level * e.level,
            spriteKey: e.spriteId || e.id,
            moves: (e.moves || []).map(function (m) { return typeof m === 'string' ? m : (m.id || m.moveId || m.name || 'tackle'); }),
            status: null,
            evolveLevel: e.evolveLevel || null,
            evolveTo: e.evolveTo || null,
          };
          B.outcome = 'caught';
          endBattle();
        } else {
          B.phase = PHASE.ENEMY_TURN;
          B.animTimer = 0;
          startEnemyTurn();
        }
      }
    }
  }

  // ---- VICTORY ----

  function renderVictory(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    // Tick up XP and gold displays
    var tickSpeed = dt * 200;
    B.victoryXPDisplay   = Math.min(B.victoryXPDisplay   + tickSpeed, B.xpGained);
    B.victoryGoldDisplay = Math.min(B.victoryGoldDisplay + tickSpeed, B.goldGained);

    drawText('VICTORY!', _W / 2, scene.panelY + 18, FONT.title, C.GOLD, 'center', true);
    drawText('XP Gained: ' + Math.floor(B.victoryXPDisplay), 30, scene.panelY + 62, FONT.body, C.XP_BLUE);
    drawText('Gold: '      + Math.floor(B.victoryGoldDisplay), 30, scene.panelY + 92, FONT.body, C.GOLD);

    // Bonus XP message from MathEngine
    var me = MathEngine();
    if (me && me.getStats) {
      var stats = me.getStats();
      if (stats && stats.bonusXP) {
        drawText('Math Bonus: +' + stats.bonusXP + ' XP', 30, scene.panelY + 118, FONT.sm, '#A78BFA');
      }
    }

    if (B.animTimer > ANIM.VICTORY_DELAY) {
      drawButton('continue', _W / 2 - 85, scene.panelY + scene.panelH - 62, 170, 48, 'CONTINUE', C.ACCENT, C.WHITE, true);
    }
  }

  // ---- DEFEAT ----

  function renderDefeat(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);

    drawText('All your creatures fainted...', _W / 2, scene.panelY + 30, FONT.body, C.WRONG, 'center');
    drawText('Returning to the last heal station.', _W / 2, scene.panelY + 62, FONT.body, C.TEXT_DIM, 'center');

    if (B.animTimer > 2000) {
      drawButton('continue', _W / 2 - 85, scene.panelY + scene.panelH - 62, 170, 48, 'CONTINUE', C.ACCENT, C.WHITE, true);
    }
  }

  // ---- LEVEL UP ----

  function renderLevelUp(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();

    // Sparkle effect around player creature
    if (B.animTimer < ANIM.LEVEL_SPARKLE) {
      var t = B.animTimer / ANIM.LEVEL_SPARKLE;
      for (var pi = 0; pi < 12; pi++) {
        var angle = (t * Math.PI * 4 + pi * Math.PI / 6) % (Math.PI * 2);
        var dist = 30 + t * 50;
        var sx = _W * 0.28 + Math.cos(angle) * dist;
        var sy = _H * 0.48 + Math.sin(angle) * dist;
        _ctx.globalAlpha = 1 - t;
        _ctx.fillStyle = C.GOLD;
        _ctx.fillRect(sx - 3, sy - 3, 6, 6);
      }
      _ctx.globalAlpha = 1;
    }

    drawPanelBg(scene.panelY, scene.panelH);

    var info = B.levelUpInfo;
    if (info) {
      drawText('LEVEL UP!', _W / 2, scene.panelY + 18, FONT.title, C.GOLD, 'center', true);
      drawText(
        ((B.player && B.player.name) || 'Creature') + ' grew to Lv.' + info.newLevel + '!',
        _W / 2, scene.panelY + 60, FONT.body, C.TEXT, 'center'
      );
    }

    if (B.animTimer > ANIM.LEVEL_SPARKLE + 400) {
      drawButton('continue', _W / 2 - 65, scene.panelY + scene.panelH - 60, 130, 44, 'OK', C.ACCENT, C.WHITE, true);
    }
  }

  // ---- EVOLUTION ----

  function renderEvolution(dt) {
    B.animTimer += dt * 1000;

    // Pulsing scale effect on the player creature (oscillate between 0.8 and 1.2)
    var pulseT = B.animTimer * 4; // fast oscillation
    B.playerScale = 1.0 + 0.2 * Math.sin(pulseT);

    var scene = renderBattleScene();

    // Flash overlay with multi-phase dramatic color shift
    if (B.animTimer < ANIM.EVOLVE_FLASH) {
      var t = B.animTimer / ANIM.EVOLVE_FLASH;

      // Phase 1 (0-0.3): purple glow
      // Phase 2 (0.3-0.6): white flash
      // Phase 3 (0.6-1.0): gold shimmer
      var r, g, b, flashAlpha;
      if (t < 0.3) {
        var pt = t / 0.3;
        r = Math.floor(128 + 40 * pt);
        g = Math.floor(0 + 60 * pt);
        b = Math.floor(200 + 55 * pt);
        flashAlpha = 0.2 + pt * 0.4;
      } else if (t < 0.6) {
        var wt = (t - 0.3) / 0.3;
        r = Math.floor(168 + 87 * wt);
        g = Math.floor(60 + 195 * wt);
        b = Math.floor(255 - 0 * wt);
        flashAlpha = 0.5 + wt * 0.3;
      } else {
        var gt = (t - 0.6) / 0.4;
        r = 255;
        g = Math.floor(255 - 40 * gt);
        b = Math.floor(255 - 215 * gt);
        flashAlpha = 0.8 - gt * 0.3;
      }
      _ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + flashAlpha + ')';
      _ctx.fillRect(0, 0, _W, _H);

      // Spawn rainbow sparkle particles around the creature
      if (Math.random() < 0.6) {
        var sparkColors = ['#FF4081', '#E040FB', '#7C4DFF', '#448AFF', '#18FFFF', '#69F0AE', '#FFFF00', '#FFD740', '#FF6E40'];
        var spkX = B.playerX + 65 + (Math.random() - 0.5) * 140;
        var spkY = B.playerY + 40 + (Math.random() - 0.5) * 120;
        B.evoParticles.push({
          x: spkX,
          y: spkY,
          vx: (Math.random() - 0.5) * 50,
          vy: -(20 + Math.random() * 50),
          color: pick(sparkColors),
          life: 0.5 + Math.random() * 0.5,
          maxLife: 0.5 + Math.random() * 0.5,
          size: 2 + Math.random() * 4,
        });
      }
    }

    // Tick and render evolution sparkle particles
    for (var ei = B.evoParticles.length - 1; ei >= 0; ei--) {
      var ep = B.evoParticles[ei];
      ep.life -= dt;
      if (ep.life <= 0) {
        B.evoParticles.splice(ei, 1);
        continue;
      }
      ep.x += ep.vx * dt;
      ep.y += ep.vy * dt;
      var eAlpha = clamp(ep.life / ep.maxLife, 0, 1);
      _ctx.globalAlpha = eAlpha;
      _ctx.fillStyle = ep.color;
      // Draw star-like sparkle
      _ctx.beginPath();
      _ctx.arc(ep.x, ep.y, ep.size * eAlpha, 0, Math.PI * 2);
      _ctx.fill();
      // Cross highlight
      _ctx.fillRect(ep.x - ep.size * 1.5 * eAlpha, ep.y - 0.5, ep.size * 3 * eAlpha, 1);
      _ctx.fillRect(ep.x - 0.5, ep.y - ep.size * 1.5 * eAlpha, 1, ep.size * 3 * eAlpha);
    }
    _ctx.globalAlpha = 1;

    drawPanelBg(scene.panelY, scene.panelH);

    var info = B.evolutionInfo;
    if (info) {
      // Cycle title color: purple -> white -> gold
      var colorT = (B.animTimer * 2) % 3;
      var titleColor;
      if (colorT < 1)      titleColor = '#A78BFA';
      else if (colorT < 2) titleColor = '#FFFFFF';
      else                  titleColor = '#FFD700';
      drawText('EVOLUTION!', _W / 2, scene.panelY + 18, FONT.title, titleColor, 'center', true);
      drawText(info.from + ' evolved into ' + info.to + '!', _W / 2, scene.panelY + 60, FONT.body, C.TEXT, 'center');
    }

    if (B.animTimer > ANIM.EVOLVE_FLASH + 400) {
      B.playerScale = 1; // reset pulse after flash ends
      drawButton('continue', _W / 2 - 65, scene.panelY + scene.panelH - 60, 130, 44, 'OK', C.ACCENT, C.WHITE, true);
    }
  }

  // ---- RUN ----

  function renderRun(dt) {
    B.animTimer += dt * 1000;
    var scene = renderBattleScene();
    drawPanelBg(scene.panelY, scene.panelH);
    drawText('Got away safely!', _W / 2, scene.panelY + 40, FONT.bodyLg, C.TEXT, 'center');

    // Player slides out
    B.playerAlpha = Math.max(0, 1 - B.animTimer / 1000);

    if (B.animTimer > 1200) {
      B.outcome = 'run';
      endBattle();
    }
  }

  // ---------------------------------------------------------------------------
  // Battle logic helpers
  // ---------------------------------------------------------------------------

  function submitMathAnswer(choiceIndex) {
    if (!B || B.mathAnswer !== null) return;

    var problem = B.mathProblem;
    var timeMs = Math.floor(((problem.timeLimit || 15) - B.mathTimeLeft) * 1000);
    var givenAnswer;

    if (choiceIndex === null) {
      givenAnswer = -999;
      B.mathAnswer = -999;
      B.mathCorrect = false;
    } else {
      givenAnswer = problem.choices[choiceIndex];
      B.mathAnswer = givenAnswer;
      B.mathCorrect = givenAnswer === problem.answer;
    }

    // Record with MathEngine
    var me = MathEngine();
    if (me && me.recordAnswer) {
      B.mathResult = me.recordAnswer(problem.id, givenAnswer, timeMs);
      B.streak = (B.mathResult && B.mathResult.streak) || (B.mathCorrect ? B.streak + 1 : 0);
    } else {
      B.mathResult = { correct: B.mathCorrect, streak: B.mathCorrect ? B.streak + 1 : 0 };
      B.streak = B.mathResult.streak;
    }

    // SFX
    var sfx = SFX();
    if (sfx && sfx.play) {
      sfx.play(B.mathCorrect ? 'hit' : 'miss');
    }

    // Speed bonus tiers based on answer time
    var answerTimeSec = timeMs / 1000;
    if (B.mathCorrect) {
      if (answerTimeSec < 2) {
        B.speedBonus = 1.3;
        B.speedLabel = 'BLAZING!';
      } else if (answerTimeSec < 4) {
        B.speedBonus = 1.15;
        B.speedLabel = 'FAST!';
      } else if (answerTimeSec < 6) {
        B.speedBonus = 1.05;
        B.speedLabel = 'QUICK!';
      } else {
        B.speedBonus = 1;
        B.speedLabel = null;
      }
    } else {
      B.speedBonus = 1;
      B.speedLabel = null;
    }

    // Show speed label as floating text in cyan
    if (B.speedLabel) {
      addFloatingText(B.speedLabel, _W * 0.5, _H * 0.55, '#00E5FF');
    }

    // Brief pause to show correct/wrong colors, then resolve
    setTimeout(function () {
      if (!B) return;
      B.phase = PHASE.RESOLVE;
      B.animTimer = 0;
      resolveAction();
    }, 800);
  }

  function startMathChallenge() {
    var me = MathEngine();
    var context = 'attack';
    if (B.chosenAction === 'catch') context = 'catch';
    else if (B.chosenAction === 'item') context = 'heal';
    if (B.type === 'boss') context = 'boss';

    var problem;
    if (me && me.generateProblem) {
      problem = me.generateProblem(context);
    } else {
      // Fallback: generate a multiplication problem
      var a = randInt(2, 9);
      var b = randInt(2, 9);
      var answer = a * b;
      var choices = generateChoices(answer);
      problem = {
        id: 'fb_' + Date.now(),
        question: 'What is ' + a + ' x ' + b + '?',
        answer: answer,
        choices: choices,
        timeLimit: 15,
        hint: 'Think of ' + a + ' groups of ' + b,
      };
    }

    B.mathProblem = problem;
    B.mathStartTime = performance.now();
    B.mathTimeLeft = problem.timeLimit || 15;
    B.mathAnswer = null;
    B.mathCorrect = null;
    B.mathResult = null;
    B.hintText = null;
    B.hintVisible = false;
    B.menuCursor = 0;

    B.phase = PHASE.MATH;
  }

  /** Generate 4 plausible multiple-choice answers including the correct one. */
  function generateChoices(answer) {
    var set = {};
    set[answer] = true;
    while (Object.keys(set).length < 4) {
      var offset = randInt(-5, 5);
      if (offset === 0) offset = randInt(1, 3);
      var wrong = answer + offset;
      if (wrong > 0) set[wrong] = true;
    }
    var arr = Object.keys(set).map(Number);
    // Fisher-Yates shuffle
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // ---- Resolution of each action ----

  function resolveAction() {
    switch (B.chosenAction) {
      case 'fight':  resolveFight();  break;
      case 'catch':  resolveCatch();  break;
      case 'item':   resolveItem();   break;
      case 'switch': resolveSwitch(); break;
    }
  }

  /** Spawn type-based attack particles near the enemy sprite. */
  function playAttackAnimation(moveType) {
    B.attackParticles = [];
    var cx = _W * 0.7;
    var cy = _H * 0.28;
    var count = 18;
    var i, p;

    switch (moveType) {
      case 'fire':
        for (i = 0; i < count; i++) {
          p = {
            x: cx + (Math.random() - 0.5) * 60,
            y: cy + Math.random() * 30,
            vx: (Math.random() - 0.5) * 40,
            vy: -(40 + Math.random() * 80),
            color: Math.random() > 0.5 ? '#FF6B2B' : '#FF3333',
            life: 0.6 + Math.random() * 0.4,
            maxLife: 0.6 + Math.random() * 0.4,
            size: 3 + Math.random() * 5,
          };
          p.maxLife = p.life;
          B.attackParticles.push(p);
        }
        break;

      case 'water':
        for (i = 0; i < count; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 30 + Math.random() * 70;
          p = {
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: Math.random() > 0.5 ? '#42A5F5' : '#80D8FF',
            life: 0.5 + Math.random() * 0.4,
            maxLife: 0.5 + Math.random() * 0.4,
            size: 3 + Math.random() * 4,
          };
          p.maxLife = p.life;
          B.attackParticles.push(p);
        }
        break;

      case 'grass':
        for (i = 0; i < count; i++) {
          var ga = Math.random() * Math.PI * 2;
          var radius = 20 + Math.random() * 40;
          p = {
            x: cx + Math.cos(ga) * radius,
            y: cy + Math.sin(ga) * radius,
            vx: Math.cos(ga + 1.5) * 50,
            vy: Math.sin(ga + 1.5) * 50 - 20,
            color: Math.random() > 0.4 ? '#66BB6A' : '#A5D6A7',
            life: 0.7 + Math.random() * 0.4,
            maxLife: 0.7 + Math.random() * 0.4,
            size: 3 + Math.random() * 4,
          };
          p.maxLife = p.life;
          B.attackParticles.push(p);
        }
        break;

      case 'electric':
        for (i = 0; i < count; i++) {
          p = {
            x: cx + (Math.random() - 0.5) * 70,
            y: cy + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            color: Math.random() > 0.5 ? '#FFD600' : '#FFFF8D',
            life: 0.3 + Math.random() * 0.3,
            maxLife: 0.3 + Math.random() * 0.3,
            size: 2 + Math.random() * 3,
          };
          p.maxLife = p.life;
          B.attackParticles.push(p);
        }
        break;

      default: // normal
        for (i = 0; i < count; i++) {
          var na = Math.random() * Math.PI * 2;
          var ns = 20 + Math.random() * 60;
          p = {
            x: cx,
            y: cy,
            vx: Math.cos(na) * ns,
            vy: Math.sin(na) * ns,
            color: Math.random() > 0.5 ? '#FFFFFF' : '#CFD8DC',
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.4 + Math.random() * 0.3,
            size: 2 + Math.random() * 4,
          };
          p.maxLife = p.life;
          B.attackParticles.push(p);
        }
        break;
    }
  }

  function resolveFight() {
    var move = B.chosenMove || { name: 'Tackle', power: 40, type: 'normal' };
    var result = calcDamage(move, B.player, B.enemy, B.mathCorrect);
    var damage = result.damage;
    var typeMult = result.typeMultiplier;

    // --- Combo multiplier based on streak ---
    var comboMult = 1;
    if (B.streak >= 10)     comboMult = 2;
    else if (B.streak >= 8) comboMult = 1.75;
    else if (B.streak >= 5) comboMult = 1.5;
    else if (B.streak >= 3) comboMult = 1.25;

    // --- Apply speed bonus and combo multiplier ---
    var speedMult = B.speedBonus || 1;
    damage = Math.max(1, Math.floor(damage * comboMult * speedMult));

    B.enemy.hp = Math.max(0, B.enemy.hp - damage);

    // Shake enemy sprite
    B.enemyShakeX = 8;
    setTimeout(function () { if (B) B.enemyShakeX = 0; }, ANIM.ATTACK_SHAKE);

    // Floating damage
    addFloatingText('-' + damage, _W * 0.7, _H * 0.25, B.mathCorrect ? C.WHITE : C.TEXT_DIM);

    // Combo multiplier floating text (gold)
    if (comboMult > 1) {
      addFloatingText('x' + comboMult + ' COMBO!', _W * 0.7, _H * 0.18, C.GOLD);
    }

    // Speed bonus floating text reminder (cyan, slightly offset)
    if (speedMult > 1 && B.speedLabel) {
      addFloatingText(B.speedLabel + ' x' + speedMult, _W * 0.5, _H * 0.18, '#00E5FF');
    }

    // Type-based attack particles
    playAttackAnimation(move.type || 'normal');

    // Message
    var msg = ((B.player && B.player.name) || 'Creature') + ' used ' + move.name + '!';
    if (B.mathCorrect) {
      if (typeMult > 1)      msg += " It's super effective!";
      else if (typeMult < 1) msg += " It's not very effective...";
    } else {
      msg += ' The attack was weak... (wrong answer)';
    }
    B.currentMessage = msg;

    animateHP('enemy');
  }

  function resolveCatch() {
    if (!B.mathCorrect) {
      B.phase = PHASE.CATCH_ANIM;
      B.animTimer = 0;
      B.animData = { shakeCount: 0, caught: false };
      return;
    }

    var hpRatio = B.enemy.hp / Math.max(1, B.enemy.maxHP);
    var catchChance = (B.enemy.catchRate || 0.4) * (1 - hpRatio) * 1.5;
    var caught = Math.random() < catchChance;
    var shakeCount = caught ? 3 : randInt(1, 2);

    B.phase = PHASE.CATCH_ANIM;
    B.animTimer = 0;
    B.animData = { shakeCount: shakeCount, caught: caught };
  }

  function resolveItem() {
    var item = B.chosenItem;
    if (!item) {
      B.currentMessage = 'No item selected.';
      return;
    }

    var isHeal = (item.category === 'heal' || (item.effect && item.effect.type === 'heal'));
    var healAmount = (item.effect && item.effect.amount) || item.healAmount || 20;

    if (B.mathCorrect) {
      if (isHeal) {
        B.player.hp = Math.min(B.playerMaxHP, B.player.hp + healAmount);
        animateHP('player');
        B.currentMessage = 'Used ' + item.name + '! Healed ' + healAmount + ' HP!';
        addFloatingText('+' + healAmount, _W * 0.28, _H * 0.48, C.HP_GREEN);
      } else {
        B.currentMessage = 'Used ' + item.name + ' successfully!';
      }
    } else {
      if (isHeal) {
        var partialHeal = Math.floor(healAmount * 0.5);
        B.player.hp = Math.min(B.playerMaxHP, B.player.hp + partialHeal);
        animateHP('player');
        B.currentMessage = 'Fumbled! ' + item.name + ' only healed ' + partialHeal + ' HP.';
        addFloatingText('+' + partialHeal, _W * 0.28, _H * 0.48, C.HP_YELLOW);
      } else {
        B.currentMessage = 'The item fizzled out! (wrong answer)';
      }
    }

    // Consume from GameState inventory
    var gs = GameState();
    if (gs && gs.inventory && item._invKey) {
      gs.inventory[item._invKey] = Math.max(0, (gs.inventory[item._invKey] || 0) - 1);
    } else if (item.quantity !== undefined) {
      item.quantity -= 1;
    }
  }

  function resolveSwitch() {
    var team = getPlayerTeam();
    var target = team[B.chosenSwitchIndex];
    if (target && target.hp > 0) {
      B.player = target;
      B.playerMaxHP = target.maxHP || target.hp;
      B.playerDisplayHP = target.hp;
      B.playerAlpha = 1;
      B.playerScale = 1;
      B.currentMessage = 'Go, ' + (target.name || target.id) + '!';
    } else {
      B.currentMessage = 'Cannot switch to that creature!';
    }
  }

  function advanceResolve() {
    if (!B) return;

    // Enemy fainted?
    if (B.enemy && B.enemy.hp <= 0) {
      B.enemyAlpha = 0;
      B.enemyScale = 0;
      handleEnemyFainted();
      return;
    }

    // Switch skips enemy turn
    if (B.chosenAction === 'switch') {
      B.phase = PHASE.ACTION_SELECT;
      B.menuCursor = 0;
      B.animTimer = 0;
      return;
    }

    // Enemy turn
    B.phase = PHASE.ENEMY_TURN;
    B.animTimer = 0;
    startEnemyTurn();
  }

  function startEnemyTurn() {
    var enemyMoves = (B.enemy && B.enemy.moves) || [{ name: 'Tackle', power: 40, type: 'normal' }];
    var move = pick(enemyMoves);
    var result = calcDamage(move, B.enemy, B.player, true);
    var damage = result.damage;

    B.player.hp = Math.max(0, B.player.hp - damage);
    B.currentMessage = B.enemy.name + ' used ' + move.name + '!';

    // Shake player
    B.playerShakeX = -8;
    setTimeout(function () { if (B) B.playerShakeX = 0; }, ANIM.ATTACK_SHAKE);

    addFloatingText('-' + damage, _W * 0.28, _H * 0.48, C.WRONG);
    animateHP('player');
  }

  function finishEnemyTurn() {
    if (!B) return;

    if (B.player && B.player.hp <= 0) {
      B.playerAlpha = 0;
      handlePlayerFainted();
      return;
    }

    B.phase = PHASE.ACTION_SELECT;
    B.menuCursor = 0;
    B.animTimer = 0;
  }

  function handleEnemyFainted() {
    var sfx = SFX();
    if (sfx && sfx.play) sfx.play('hit');

    var xp = calcXPGain(B.enemy);
    var gold;
    if (B.type === 'trainer' || B.type === 'boss') {
      gold = (B.trainerData && (B.trainerData.reward || B.trainerData.goldReward)) || 100;
    } else {
      gold = Math.floor(B.enemy.level * 10 + Math.random() * 20);
    }

    B.xpGained += xp;
    B.goldGained += gold;

    // XP and gold are awarded by main.js via the battle result object
    // (B.xpGained / B.goldGained) — do NOT mutate GameState here to avoid double-award

    // Trainer has more creatures?
    if ((B.type === 'trainer' || B.type === 'boss') && B.trainerData) {
      B.trainerCreatureIndex++;
      var trainerTeam = B.trainerData.team || [];
      if (B.trainerCreatureIndex < trainerTeam.length) {
        var next = trainerTeam[B.trainerCreatureIndex];
        var nextId = next.creatureId || next.id || (typeof next === 'string' ? next : 'goblin');
        B.enemy = buildCreature(nextId, next.level || B.enemy.level);
        B.enemyDisplayHP = B.enemy.hp;
        B.enemyAlpha = 0;
        B.enemyScale = 0.5;
        B.currentMessage = ((B.trainerData && B.trainerData.name) || 'Trainer') + ' sends out ' + B.enemy.name + '!';
        B.phase = PHASE.RESOLVE;
        B.animTimer = 0;

        setTimeout(function () {
          if (B) { B.enemyAlpha = 1; B.enemyScale = 1; }
        }, 500);
        setTimeout(function () {
          if (B) { B.phase = PHASE.ACTION_SELECT; B.menuCursor = 0; }
        }, 1500);
        return;
      }
    }

    // Level-up and evolution are handled by main.js after battle via awardXP
    B.phase = PHASE.VICTORY;
    B.animTimer = 0;
    B.outcome = 'win';
    B.victoryXPDisplay = 0;
    B.victoryGoldDisplay = 0;
  }

  function handlePlayerFainted() {
    var team = getPlayerTeam();
    var alive = team.filter(function (c) { return c.hp > 0; });

    if (alive.length > 0) {
      B.phase = PHASE.SWITCH_SELECT;
      B.menuCursor = 0;
      B.currentMessage = ((B.player && B.player.name) || 'Your creature') + ' fainted! Choose another!';
    } else {
      B.phase = PHASE.DEFEAT;
      B.animTimer = 0;
      B.outcome = 'lose';
    }
  }

  function animateHP(who) {
    var startHP = who === 'enemy' ? B.enemyDisplayHP : B.playerDisplayHP;
    var endHP   = who === 'enemy' ? B.enemy.hp       : B.player.hp;
    var start = performance.now();

    function tick() {
      if (!B) return;
      var elapsed = performance.now() - start;
      var t = clamp(elapsed / ANIM.HP_DRAIN, 0, 1);
      var current = lerp(startHP, endHP, easeOut(t));
      if (who === 'enemy') {
        B.enemyDisplayHP = current;
      } else {
        B.playerDisplayHP = current;
      }
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function addFloatingText(text, x, y, color) {
    B.floatingTexts.push({
      text: text, x: x, y: y, startY: y, color: color,
      timer: ANIM.DAMAGE_FLOAT, maxTimer: ANIM.DAMAGE_FLOAT,
    });
  }

  // ---------------------------------------------------------------------------
  // Main render loop
  // ---------------------------------------------------------------------------

  function gameLoop(timestamp) {
    if (!_active || !B) return;

    var dt = Math.min((timestamp - _lastTime) / 1000, 0.1);
    _lastTime = timestamp;

    // Reset button registry each frame
    B.buttons = [];

    // Apply virtual viewport scaling so the battle looks consistent
    var realW = _canvas.width;
    var realH = _canvas.height;
    var scaleX = realW / VIRT_W;
    var scaleY = realH / VIRT_H;
    var sc = Math.min(scaleX, scaleY);
    var ox = Math.floor((realW - VIRT_W * sc) / 2);
    var oy = Math.floor((realH - VIRT_H * sc) / 2);

    _W = VIRT_W;
    _H = VIRT_H;

    _ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    _ctx.fillStyle = '#000';
    _ctx.fillRect(0, 0, realW, realH); // letterbox
    _ctx.translate(ox, oy);
    _ctx.scale(sc, sc);
    _ctx.imageSmoothingEnabled = false;

    // Update floating texts
    for (var i = B.floatingTexts.length - 1; i >= 0; i--) {
      B.floatingTexts[i].timer -= dt * 1000;
      if (B.floatingTexts[i].timer <= 0) {
        B.floatingTexts.splice(i, 1);
      }
    }

    switch (B.phase) {
      case PHASE.INTRO:          renderIntro(dt);      break;
      case PHASE.ACTION_SELECT:  renderActionSelect();  break;
      case PHASE.MOVE_SELECT:    renderMoveSelect();    break;
      case PHASE.ITEM_SELECT:    renderItemSelect();    break;
      case PHASE.SWITCH_SELECT:  renderSwitchSelect();  break;
      case PHASE.MATH:           renderMathProblem(dt); break;
      case PHASE.RESOLVE:        renderResolve(dt);     break;
      case PHASE.ENEMY_TURN:     renderEnemyTurn(dt);   break;
      case PHASE.CATCH_ANIM:     renderCatchAnim(dt);   break;
      case PHASE.VICTORY:        renderVictory(dt);     break;
      case PHASE.DEFEAT:         renderDefeat(dt);      break;
      case PHASE.LEVEL_UP:       renderLevelUp(dt);     break;
      case PHASE.EVOLUTION:      renderEvolution(dt);   break;
      case PHASE.RUN:            renderRun(dt);         break;
      case PHASE.FADE_OUT:       break;
    }

    // Reset transform after rendering
    _ctx.setTransform(1, 0, 0, 1, 0, 0);

    _animFrameId = requestAnimationFrame(gameLoop);
  }

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------

  function handleClick(canvasX, canvasY) {
    if (!_active || !B) return;

    // Convert from real canvas coordinates to virtual viewport coordinates
    var realW = _canvas.width;
    var realH = _canvas.height;
    var scaleX = realW / VIRT_W;
    var scaleY = realH / VIRT_H;
    var sc = Math.min(scaleX, scaleY);
    var ox = Math.floor((realW - VIRT_W * sc) / 2);
    var oy = Math.floor((realH - VIRT_H * sc) / 2);
    var x = (canvasX - ox) / sc;
    var y = (canvasY - oy) / sc;

    // Check registered buttons
    for (var i = 0; i < B.buttons.length; i++) {
      if (inRect(x, y, B.buttons[i])) {
        processButtonClick(B.buttons[i].id);
        return;
      }
    }

    // Clicking during resolve/enemy turn advances
    if (B.phase === PHASE.RESOLVE && B.animTimer > 0.5) {
      advanceResolve();
    } else if (B.phase === PHASE.ENEMY_TURN && B.animTimer > 0.5) {
      finishEnemyTurn();
    }
  }

  function processButtonClick(id) {
    // ---- Action menu ----
    if (id.indexOf('action_') === 0) {
      var idx = parseInt(id.split('_')[1], 10);
      var action = B.menuItems[idx];
      if (!action) return;
      B.menuCursor = 0;

      switch (action) {
        case 'FIGHT':
          B.chosenAction = 'fight';
          B.phase = PHASE.MOVE_SELECT;
          break;
        case 'CATCH':
          B.chosenAction = 'catch';
          startMathChallenge();
          break;
        case 'ITEM':
          B.chosenAction = 'item';
          B.phase = PHASE.ITEM_SELECT;
          B.scrollOffset = 0;
          break;
        case 'RUN':
          B.phase = PHASE.RUN;
          B.animTimer = 0;
          break;
        case 'SWITCH':
          B.chosenAction = 'switch';
          B.phase = PHASE.SWITCH_SELECT;
          break;
      }
      return;
    }

    // ---- Move menu ----
    if (id.indexOf('move_') === 0) {
      var mi = parseInt(id.split('_')[1], 10);
      var moves = (B.player && B.player.moves) || [];
      if (moves[mi]) {
        B.chosenMove = moves[mi];
        B.chosenAction = 'fight';
        startMathChallenge();
      }
      return;
    }

    // ---- Item menu ----
    if (id.indexOf('item_') === 0) {
      var ii = parseInt(id.split('_')[1], 10);
      var items = getPlayerInventory().filter(function (it) { return it.usableInBattle !== false; });
      if (items[ii]) {
        B.chosenItem = items[ii];
        B.chosenAction = 'item';
        startMathChallenge();
      }
      return;
    }

    // ---- Switch menu ----
    if (id.indexOf('switch_') === 0) {
      var si = parseInt(id.split('_')[1], 10);
      var team = getPlayerTeam();
      var target = team[si];
      if (!target || target.hp <= 0 || target === B.player) return;

      B.chosenSwitchIndex = si;
      B.chosenAction = 'switch';

      // Forced switch (player creature fainted) bypasses math
      if (B.player && B.player.hp <= 0) {
        B.player = target;
        B.playerMaxHP = target.maxHP || target.hp;
        B.playerDisplayHP = target.hp;
        B.playerAlpha = 1;
        B.playerScale = 1;
        B.currentMessage = 'Go, ' + (target.name || target.id) + '!';
        B.phase = PHASE.ACTION_SELECT;
        B.menuCursor = 0;
        return;
      }

      startMathChallenge();
      return;
    }

    // ---- Math choices ----
    if (id.indexOf('choice_') === 0) {
      var ci = parseInt(id.split('_')[1], 10);
      submitMathAnswer(ci);
      return;
    }

    // ---- Hint ----
    if (id === 'hint') {
      if (!B.mathProblem) return;
      var me = MathEngine();
      if (me && me.getHint) {
        B.hintText = me.getHint(B.mathProblem.id);
      } else {
        B.hintText = B.mathProblem.hint || 'Think carefully!';
      }
      B.hintVisible = true;
      return;
    }

    // ---- Back ----
    if (id === 'back') {
      B.phase = PHASE.ACTION_SELECT;
      B.menuCursor = 0;
      return;
    }

    // ---- Continue (victory / defeat / level up / evolution) ----
    if (id === 'continue') {
      if (B.phase === PHASE.LEVEL_UP) {
        if (B.evolutionInfo) {
          B.phase = PHASE.EVOLUTION;
          B.animTimer = 0;
        } else {
          B.phase = PHASE.VICTORY;
          B.animTimer = 0;
          B.outcome = 'win';
          B.victoryXPDisplay = 0;
          B.victoryGoldDisplay = 0;
        }
        return;
      }
      if (B.phase === PHASE.EVOLUTION) {
        // Apply evolution to the creature
        if (B.player && B.evolutionInfo) {
          var gd = GameData();
          var evoData = gd && gd.creatures && gd.creatures[B.evolutionInfo.to];
          if (evoData) {
            B.player.id       = B.evolutionInfo.to;
            B.player.name     = evoData.name || B.evolutionInfo.to;
            B.player.spriteId = evoData.spriteKey || evoData.spriteId || B.evolutionInfo.to;
          } else {
            B.player.name     = B.evolutionInfo.to;
            B.player.id       = B.evolutionInfo.to;
            B.player.spriteId = B.evolutionInfo.to;
          }
        }
        B.phase = PHASE.VICTORY;
        B.animTimer = 0;
        B.outcome = 'win';
        B.victoryXPDisplay = 0;
        B.victoryGoldDisplay = 0;
        return;
      }
      // Victory or Defeat: end the battle
      endBattle();
      return;
    }
  }

  function handleKey(key) {
    if (!_active || !B) return;

    var k = key.toLowerCase();

    // ---- Non-menu phases: advance on Enter/Space ----
    var menuPhases = [PHASE.ACTION_SELECT, PHASE.MOVE_SELECT, PHASE.ITEM_SELECT, PHASE.SWITCH_SELECT, PHASE.MATH];
    var isMenu = false;
    for (var mp = 0; mp < menuPhases.length; mp++) {
      if (B.phase === menuPhases[mp]) { isMenu = true; break; }
    }

    if (!isMenu) {
      if (k === 'enter' || k === ' ') {
        if (B.phase === PHASE.RESOLVE && B.animTimer > 0.5) {
          advanceResolve();
        } else if (B.phase === PHASE.ENEMY_TURN && B.animTimer > 0.5) {
          finishEnemyTurn();
        } else if (B.phase === PHASE.VICTORY || B.phase === PHASE.DEFEAT) {
          var cont = null;
          for (var bi = 0; bi < B.buttons.length; bi++) {
            if (B.buttons[bi].id === 'continue') { cont = B.buttons[bi]; break; }
          }
          if (cont) processButtonClick('continue');
        } else if (B.phase === PHASE.LEVEL_UP || B.phase === PHASE.EVOLUTION) {
          var ok = null;
          for (var oi = 0; oi < B.buttons.length; oi++) {
            if (B.buttons[oi].id === 'continue') { ok = B.buttons[oi]; break; }
          }
          if (ok) processButtonClick('continue');
        }
      }
      return;
    }

    // ---- Math phase keyboard ----
    if (B.phase === PHASE.MATH) {
      if (B.mathAnswer !== null) return;
      var choices = (B.mathProblem && B.mathProblem.choices) || [];

      if (k === 'arrowleft' || k === 'a') {
        if (B.menuCursor % 2 !== 0) B.menuCursor--;
      } else if (k === 'arrowright' || k === 'd') {
        if (B.menuCursor % 2 === 0 && B.menuCursor + 1 < choices.length) B.menuCursor++;
      } else if (k === 'arrowup' || k === 'w') {
        if (B.menuCursor >= 2) B.menuCursor -= 2;
      } else if (k === 'arrowdown' || k === 's') {
        if (B.menuCursor + 2 < choices.length) B.menuCursor += 2;
      } else if (k === 'enter' || k === ' ') {
        submitMathAnswer(B.menuCursor);
      } else if (k === 'h') {
        processButtonClick('hint');
      } else if (k === '1' || k === '2' || k === '3' || k === '4') {
        var ni = parseInt(k, 10) - 1;
        if (ni < choices.length) submitMathAnswer(ni);
      }
      return;
    }

    // ---- General menu navigation ----
    var itemCount = B.menuItems.length || 1;
    var cols = 2;

    if (k === 'arrowleft' || k === 'a') {
      if (B.menuCursor % cols > 0) B.menuCursor--;
    } else if (k === 'arrowright' || k === 'd') {
      if (B.menuCursor % cols < cols - 1 && B.menuCursor + 1 < itemCount) B.menuCursor++;
    } else if (k === 'arrowup' || k === 'w') {
      if (B.menuCursor >= cols) B.menuCursor -= cols;
    } else if (k === 'arrowdown' || k === 's') {
      if (B.menuCursor + cols < itemCount) B.menuCursor += cols;
    } else if (k === 'enter' || k === ' ') {
      var prefix;
      switch (B.phase) {
        case PHASE.ACTION_SELECT: prefix = 'action_'; break;
        case PHASE.MOVE_SELECT:   prefix = 'move_';   break;
        case PHASE.ITEM_SELECT:   prefix = 'item_';   break;
        case PHASE.SWITCH_SELECT: prefix = 'switch_'; break;
        default: prefix = ''; break;
      }
      processButtonClick(prefix + B.menuCursor);
    } else if (k === 'escape' || k === 'backspace') {
      if (B.phase !== PHASE.ACTION_SELECT) {
        processButtonClick('back');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Battle lifecycle
  // ---------------------------------------------------------------------------

  function startBattle(canvas, type, enemyCreatureId, enemyLevel, trainerData) {
    _canvas = canvas;
    _ctx = canvas.getContext('2d');
    _W = VIRT_W;
    _H = VIRT_H;
    _active = true;

    B = initBattle();
    B.type = type;
    B.trainerData = trainerData || null;

    // Build enemy creature
    if (type === 'trainer' || type === 'boss') {
      var tTeam = (trainerData && trainerData.team) || [{ creatureId: enemyCreatureId || 'goblin', level: enemyLevel || 5 }];
      B.trainerCreatureIndex = 0;
      var first = tTeam[0];
      var firstId = first.creatureId || first.id || (typeof first === 'string' ? first : 'goblin');
      B.enemy = buildCreature(firstId, first.level || enemyLevel || 5);
    } else {
      B.enemy = buildCreature(enemyCreatureId || 'slime', enemyLevel || 3);
    }
    B.enemyDisplayHP = B.enemy.hp;

    // Get player's active creature
    var playerCreature = getPlayerCreature();
    if (playerCreature) {
      // Normalise field names: game-state uses maxHp/spriteKey, battle uses maxHP/spriteId
      playerCreature.maxHP = playerCreature.maxHP || playerCreature.maxHp || playerCreature.hp;
      playerCreature.spriteId = playerCreature.spriteId || playerCreature.spriteKey || playerCreature.speciesId || playerCreature.uid;
      playerCreature.id = playerCreature.id || playerCreature.speciesId || playerCreature.uid;
      // Resolve move IDs to full move objects
      if (playerCreature.moves && playerCreature.moves.length > 0 && typeof playerCreature.moves[0] === 'string') {
        playerCreature.moves = resolveMoves(
          playerCreature.moves.map(function (m) { return { moveId: m, learnLevel: 1 }; }),
          playerCreature.level
        );
      }
      B.player = playerCreature;
      B.playerMaxHP = playerCreature.maxHP;
      B.playerDisplayHP = playerCreature.hp;
    } else {
      // Fallback starter creature
      B.player = {
        id: 'starter', name: 'MathPup', level: 5,
        hp: 50, maxHP: 50, attack: 15, defense: 12, speed: 12,
        type: 'normal',
        moves: [
          { name: 'Number Crunch', power: 45, type: 'normal' },
          { name: 'Factor Slash',  power: 55, type: 'normal' },
        ],
        xp: 0, spriteId: 'starter',
      };
      B.playerMaxHP = 50;
      B.playerDisplayHP = 50;
    }

    // Begin intro animation
    B.phase = PHASE.INTRO;
    B.introTimer = 0;
    B.enemyAlpha  = 0;
    B.playerAlpha = 0;
    B.enemyScale  = 0.5;
    B.playerScale = 0.5;

    _lastTime = performance.now();
    _animFrameId = requestAnimationFrame(gameLoop);

    // Return a promise that resolves when the battle ends
    return new Promise(function (resolve) {
      _resolve = resolve;
    });
  }

  function endBattle() {
    _active = false;
    if (_animFrameId) {
      cancelAnimationFrame(_animFrameId);
      _animFrameId = null;
    }

    var result = {
      outcome:         B.outcome || 'run',
      xpGained:        B.xpGained,
      goldGained:      B.goldGained,
      caughtCreature:  B.caughtCreature,
    };

    // Boss badge reward
    if (B.type === 'boss' && B.outcome === 'win' && B.trainerData && B.trainerData.badge) {
      result.badge = B.trainerData.badge;
    }

    var resolver = _resolve;
    B = null;
    _resolve = null;

    if (resolver) resolver(result);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.Battle = {
    /**
     * Start a wild encounter battle.
     * @param {HTMLCanvasElement} canvas
     * @param {string} enemyCreatureId
     * @param {number} enemyLevel
     * @returns {Promise<{outcome:string, xpGained:number, goldGained:number, caughtCreature:object|null}>}
     */
    startWild: function (canvas, enemyCreatureId, enemyLevel) {
      return startBattle(canvas, 'wild', enemyCreatureId, enemyLevel, null);
    },

    /**
     * Start a trainer or boss battle.
     * @param {HTMLCanvasElement} canvas
     * @param {object} trainerData - { name, team:[{id,level}], goldReward, boss?:boolean, badge?, dialogue? }
     * @returns {Promise<{outcome:string, xpGained:number, goldGained:number, badge?:string}>}
     */
    startTrainer: function (canvas, trainerData) {
      var type = (trainerData.boss || trainerData.isBoss) ? 'boss' : 'trainer';
      return startBattle(canvas, type, null, null, trainerData);
    },

    /**
     * True while a battle is in progress.
     * @returns {boolean}
     */
    isActive: function () {
      return _active;
    },

    /**
     * Forward a mouse / touch click to the battle system.
     * The coordinates should be clientX / clientY from the event.
     * @param {number} x
     * @param {number} y
     */
    handleClick: function (x, y) {
      handleClick(x, y);
    },

    /**
     * Forward a keyboard event's key string to the battle system.
     * @param {string} key - e.g. 'ArrowUp', 'Enter', '1'
     */
    handleKey: function (key) {
      handleKey(key);
    },
  };
})();
