/**
 * ============================================================================
 * OVERWORLD ENGINE — Pokemon FireRed-style tile-based RPG overworld
 * ============================================================================
 *
 * Renders an HTML5 Canvas overworld with grid-based player movement, NPC
 * interaction, map transitions, random encounters, and screen effects.
 *
 * Exported as:  window.Overworld
 *
 * Dependencies (globals):
 *   window.Sprites   – drawSprite(ctx, spriteData, x, y, scale), .tiles, .player, .npcs
 *   window.GameData  – .maps  (tile grids, collision, NPCs, encounters, connections)
 *   window.GameState – .player {x, y, currentMap, direction, walking}, update helpers
 *   window.SFX       – .play(soundName)
 */
(function () {
  'use strict';

  // ==========================================================================
  //  CONSTANTS
  // ==========================================================================

  const TILE              = 16;          // native tile size (virtual px)
  const VIEW_COLS         = 20;          // viewport width  in tiles
  const VIEW_ROWS         = 15;          // viewport height in tiles
  const VIEW_W            = VIEW_COLS * TILE; // 320
  const VIEW_H            = VIEW_ROWS * TILE; // 240
  const WALK_MS           = 200;         // time to slide one tile
  const WATER_CYCLE_MS    = 500;         // water frame toggle
  const GRASS_SWAY_MS     = 800;         // tall-grass sway period
  const ENCOUNTER_COOLDOWN = 3;          // min steps between encounters
  const FADE_MS           = 300;         // default fade duration

  /** Map game-data tile codes to sprites.js tile keys. */
  const TILE_SPRITE_MAP = {
    'G':  'grass1',
    'TG': 'tallGrass',
    'P':  'path',
    'W':  'water',
    'T':  'tree',
    'D':  'door',
    'R':  'rock',
    'BR': 'bridge',
    'FL': 'flowers',
    'F':  'floor',
    'SG': 'sign',
    'H':  'wall',
    'RF': 'wall',
    'CW': 'wall',
    'C':  'floor',
    'CR': 'rock',
    'FN': 'wall',
    'S':  'grass2',
  };

  /** Map game-data NPC sprite names to sprites.js NPC keys. */
  const NPC_SPRITE_MAP = {
    'npc_professor':    'professor',
    'npc_shopkeeper':   'shopkeeper',
    'npc_trainer_boy':  'trainer',
    'npc_trainer_girl': 'trainer',
    'npc_healer':       'healer',
    'npc_mom':          'professor',   // fallback
    'npc_hiker':        'trainer',     // fallback
    'npc_boss':         'trainer',     // fallback
    'npc_girl':         'healer',      // fallback
    'sign':             null,          // signs don't have NPC sprites
  };

  /** Cardinal direction unit vectors. */
  const DIR_VEC = {
    up:    { x:  0, y: -1 },
    down:  { x:  0, y:  1 },
    left:  { x: -1, y:  0 },
    right: { x:  1, y:  0 },
  };

  // ==========================================================================
  //  INTERNAL STATE
  // ==========================================================================

  let canvas  = null;
  let ctx     = null;
  let running = false;
  let paused  = false;
  let inputEnabled   = true;
  let lastTimestamp   = 0;

  // ── Current map ──
  let mapId   = null;
  let map     = null;   // reference into GameData.maps[mapId]

  // ── Player walking ──
  let walking       = false;
  let walkT         = 0;        // 0 → 1 progress
  let walkFromX     = 0;
  let walkFromY     = 0;
  let walkToX       = 0;
  let walkToY       = 0;
  let walkFrame     = 0;        // toggles 0/1 each step
  let stepsSinceEnc = ENCOUNTER_COOLDOWN;

  // ── Animation clocks ──
  let waterFrame    = 0;
  let waterClock    = 0;
  let grassPhase    = 0;
  let grassClock    = 0;

  // ── Screen-effect state ──
  let fadeAlpha     = 0;        // 0 = clear, 1 = opaque
  let fadeGoal      = 0;
  let fadeDur       = 0;
  let fadeElapsed   = 0;
  let fadeCol       = 'black';
  let fadeResolve   = null;

  let flashAlpha    = 0;
  let flashDur      = 0;
  let flashClock    = 0;
  let flashCol      = 'white';
  let flashResolve  = null;

  let shakeClock    = 0;
  let shakeDur      = 0;
  let shakeAmp      = 0;

  // ── Grass rustle particles ──
  let rustles = [];             // { x, y, age, life }

  // ── NPC patrol timers ──
  let patrolState = new Map();  // npcKey → { elapsed, idx }

  // ── Run mode ──
  let isRunning = false;        // Shift held = run at double speed
  const WALK_MS_RUN = 100;      // run speed (half of walk)

  // ── Hidden items (persisted via GameState flags) ──
  function isItemCollected(uid) {
    return window.GameState && window.GameState.getFlag('item_' + uid);
  }
  function markItemCollected(uid) {
    if (window.GameState) window.GameState.setFlag('item_' + uid, true);
  }

  // ==========================================================================
  //  INPUT
  // ==========================================================================

  const held     = new Set();   // directions currently held
  const pressed  = [];          // order of presses (last wins)

  /** Map raw key names to direction strings. */
  const KEY_DIR = {
    ArrowUp: 'up',    w: 'up',    W: 'up',
    ArrowDown: 'down', s: 'down',  S: 'down',
    ArrowLeft: 'left', a: 'left',  A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  };

  function onKeyDown(e) {
    if (!inputEnabled) return;

    // Run mode (Shift held)
    if (e.key === 'Shift') { isRunning = true; return; }

    const dir = KEY_DIR[e.key];
    if (dir) {
      e.preventDefault();
      if (!held.has(dir)) {
        held.add(dir);
        pressed.push(dir);
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      attemptInteract();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('open-menu'));
    }
  }

  function onKeyUp(e) {
    if (e.key === 'Shift') { isRunning = false; return; }
    const dir = KEY_DIR[e.key];
    if (dir) {
      e.preventDefault();
      held.delete(dir);
      const i = pressed.lastIndexOf(dir);
      if (i !== -1) pressed.splice(i, 1);
    }
  }

  /** Return the single direction to move (last-pressed wins), or null. */
  function pollDirection() {
    for (let i = pressed.length - 1; i >= 0; i--) {
      if (held.has(pressed[i])) return pressed[i];
    }
    return null;
  }

  // ==========================================================================
  //  MAP HELPERS
  // ==========================================================================

  function mapW() {
    return (map && map.tiles && map.tiles[0]) ? map.tiles[0].length : 0;
  }
  function mapH() {
    return (map && map.tiles) ? map.tiles.length : 0;
  }

  function tileAt(layer, tx, ty) {
    if (!map || !map[layer]) return 0;
    const row = map[layer][ty];
    return (row && row[tx] != null) ? row[tx] : 0;
  }

  function inBounds(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < mapW() && ty < mapH();
  }

  function isCollision(tx, ty) {
    return map && map.collision && map.collision[ty] && !!map.collision[ty][tx];
  }

  function npcAt(tx, ty) {
    if (!map || !map.npcs) return null;
    for (const npc of map.npcs) {
      const nx = npc._px != null ? npc._px : npc.x;
      const ny = npc._py != null ? npc._py : npc.y;
      if (nx === tx && ny === ty) return npc;
    }
    return null;
  }

  function isTallGrass(tx, ty) {
    const id = tileAt('tiles', tx, ty);
    if (map && map.grassTiles) return map.grassTiles.includes(id);
    return id === 'TG' || id === 2 || id === 'grass' || id === 'tall_grass' || id === 'tallGrass';
  }

  function isEncounterTile(tx, ty) {
    const id = tileAt('tiles', tx, ty);
    if (window.GameData && window.GameData.ENCOUNTER_TILES) {
      return window.GameData.ENCOUNTER_TILES.indexOf(id) !== -1;
    }
    return isTallGrass(tx, ty);
  }

  function isWater(tx, ty) {
    const id = tileAt('tiles', tx, ty);
    if (map && map.waterTiles) return map.waterTiles.includes(id);
    return id === 'W' || id === 4 || id === 'water';
  }

  // ── Connections / edges ──

  function connectionAt(tx, ty) {
    if (!map || !map.connections) return null;

    // game-data defines connections as an object: { north: { map, spawnX, spawnY }, ... }
    const conns = map.connections;

    // Check edge transitions based on which direction the player is walking off
    if (ty < 0 && conns.north) {
      return { targetMap: conns.north.map, spawnX: conns.north.spawnX, spawnY: conns.north.spawnY };
    }
    if (ty >= mapH() && conns.south) {
      return { targetMap: conns.south.map, spawnX: conns.south.spawnX, spawnY: conns.south.spawnY };
    }
    if (tx < 0 && conns.west) {
      return { targetMap: conns.west.map, spawnX: conns.west.spawnX, spawnY: conns.west.spawnY };
    }
    if (tx >= mapW() && conns.east) {
      return { targetMap: conns.east.map, spawnX: conns.east.spawnX, spawnY: conns.east.spawnY };
    }

    // Also support tile-based warps if connections has specific tile entries (doors, stairs)
    if (Array.isArray(conns)) {
      for (const c of conns) {
        if (c.x === tx && c.y === ty) return { targetMap: c.map || c.targetMap, spawnX: c.spawnX, spawnY: c.spawnY };
      }
    }

    return null;
  }

  function hasConnection(tx, ty) {
    return connectionAt(tx, ty) !== null;
  }

  // ── Warp tiles (indoor map doors) ──

  function warpAt(tx, ty) {
    if (!map || !map.warps) return null;
    for (const w of map.warps) {
      if (w.x === tx && w.y === ty) {
        return { targetMap: w.targetMap, spawnX: w.spawnX, spawnY: w.spawnY };
      }
    }
    return null;
  }

  // ── Hidden items ──

  function hiddenItemAt(tx, ty) {
    if (!map || !map.hiddenItems) return null;
    for (const item of map.hiddenItems) {
      const uid = mapId + '_' + item.x + '_' + item.y;
      if (item.x === tx && item.y === ty && !isItemCollected(uid)) {
        return item;
      }
    }
    return null;
  }

  // ── Walkability ──

  function canWalk(tx, ty) {
    if (inBounds(tx, ty)) {
      if (isCollision(tx, ty)) return false;
      if (npcAt(tx, ty))       return false;
      return true;
    }
    return hasConnection(tx, ty);
  }

  // ==========================================================================
  //  NPC INTERACTION
  // ==========================================================================

  function attemptInteract() {
    if (walking || !inputEnabled) return;
    const p = window.GameState.player;
    const v = DIR_VEC[p.direction];
    if (!v) return;

    // Check for hidden item at the tile we're facing
    const hItem = hiddenItemAt(p.x + v.x, p.y + v.y);
    if (hItem) {
      const uid = mapId + '_' + hItem.x + '_' + hItem.y;
      markItemCollected(uid);
      sfx('goldGet');
      window.dispatchEvent(new CustomEvent('found-hidden-item', {
        detail: { item: hItem, mapId },
      }));
      return;
    }

    const npc = npcAt(p.x + v.x, p.y + v.y);
    if (!npc) return;

    // NPC turns to face the player
    faceToward(npc, p.x, p.y);

    sfx('select');

    window.dispatchEvent(new CustomEvent('npc-interact', {
      detail: {
        npc,
        isTrainer: !!npc.trainer,
        dialogue:  npc.dialogue || [],
        mapId,
      },
    }));
  }

  function faceToward(npc, tx, ty) {
    const nx = npc._px != null ? npc._px : npc.x;
    const ny = npc._py != null ? npc._py : npc.y;
    const dx = tx - nx;
    const dy = ty - ny;
    if (Math.abs(dx) >= Math.abs(dy)) {
      npc.direction = dx > 0 ? 'right' : 'left';
    } else {
      npc.direction = dy > 0 ? 'down' : 'up';
    }
  }

  // ==========================================================================
  //  NPC PATROL
  // ==========================================================================

  function updatePatrols(dt) {
    if (!map || !map.npcs) return;
    for (const npc of map.npcs) {
      if (!npc.patrol || npc.patrol.length === 0) continue;

      const key = npc.id || npc.name || `${npc.x}_${npc.y}`;
      if (!patrolState.has(key)) {
        patrolState.set(key, { elapsed: 0, idx: 0 });
        npc._px = npc.x;
        npc._py = npc.y;
      }

      const st   = patrolState.get(key);
      const step = npc.patrol[st.idx];
      st.elapsed += dt;

      if (st.elapsed >= (step.wait || 2000)) {
        st.elapsed = 0;
        st.idx = (st.idx + 1) % npc.patrol.length;
        const next = npc.patrol[st.idx];
        if (next.x != null) npc._px = next.x;
        if (next.y != null) npc._py = next.y;
        if (next.dir)       npc.direction = next.dir;
      }
    }
  }

  // ==========================================================================
  //  PLAYER MOVEMENT
  // ==========================================================================

  function beginWalk(dir) {
    const p   = window.GameState.player;
    const vec = DIR_VEC[dir];
    const tx  = p.x + vec.x;
    const ty  = p.y + vec.y;

    // Always face the pressed direction
    p.direction = dir;

    if (!canWalk(tx, ty)) {
      sfx('bump');
      return;
    }

    // If walking off the map, handle transition instead
    if (!inBounds(tx, ty)) {
      const conn = connectionAt(tx, ty);
      if (conn) { doMapTransition(conn); return; }
      return;
    }

    walking    = true;
    p.walking  = true;
    walkT      = 0;
    walkFromX  = p.x;
    walkFromY  = p.y;
    walkToX    = tx;
    walkToY    = ty;
    walkFrame  = (walkFrame + 1) % 2;

    sfx('step');
  }

  function tickWalk(dt) {
    if (!walking) return;
    const speed = isRunning ? WALK_MS_RUN : WALK_MS;
    walkT += dt / speed;
    if (walkT >= 1) {
      walkT = 1;
      endWalk();
    }
  }

  function endWalk() {
    const p   = window.GameState.player;
    p.x       = walkToX;
    p.y       = walkToY;
    p.walking = false;
    walking   = false;
    walkT     = 0;

    window.GameState.setPosition(p.x, p.y);

    // Tile-based warp (door, staircase, etc.) from connections
    const conn = connectionAt(p.x, p.y);
    if (conn) {
      doMapTransition(conn);
      return;
    }

    // Warps array (indoor map doors)
    const warp = warpAt(p.x, p.y);
    if (warp) {
      doMapTransition(warp);
      return;
    }

    // Encounter logic (tall grass + cave floor)
    stepsSinceEnc++;
    if (isTallGrass(p.x, p.y)) {
      addRustle(p.x, p.y);
    }
    if (isEncounterTile(p.x, p.y)) {
      rollEncounter();
    }
  }

  // ==========================================================================
  //  MAP TRANSITIONS
  // ==========================================================================

  async function doMapTransition(conn) {
    // Check progression gate BEFORE loading the map
    if (window.GameData && window.GameData.maps[conn.targetMap]) {
      const targetMapData = window.GameData.maps[conn.targetMap];
      if (targetMapData.requirement) {
        const req = targetMapData.requirement;
        let blocked = false;
        if (req.type === 'problemsSolved' && req.count) {
          blocked = (window.GameState.player.totalProblems || 0) < req.count;
        }
        if (req.type === 'badge' && req.badge) {
          blocked = !window.GameState.hasBadge(req.badge);
        }
        if (req.minAccuracy) {
          blocked = blocked || (window.GameState.getMathAccuracy() < req.minAccuracy);
        }
        if (blocked) {
          window.dispatchEvent(new CustomEvent('map-blocked', {
            detail: { map: conn.targetMap, message: req.message || "You can't go here yet!" },
          }));
          inputEnabled = true;
          return;
        }
      }
    }

    inputEnabled = false;
    walking = false;
    window.GameState.player.walking = false;

    sfx('door');

    await promiseFade(1, FADE_MS, 'black');

    const fromMap = mapId;
    internalLoadMap(conn.targetMap, conn.spawnX, conn.spawnY);

    window.dispatchEvent(new CustomEvent('map-change', {
      detail: { fromMap, toMap: conn.targetMap, spawnX: conn.spawnX, spawnY: conn.spawnY },
    }));

    // Auto-save on map transition
    if (window.GameState && window.GameState.save) {
      try { window.GameState.save(); } catch (e) { /* silent */ }
    }

    await promiseFade(0, FADE_MS, 'black');

    inputEnabled = true;
  }

  function internalLoadMap(id, sx, sy) {
    if (!window.GameData || !window.GameData.maps || !window.GameData.maps[id]) {
      console.warn('[Overworld] map "' + id + '" not found in GameData.maps');
      return;
    }

    mapId = id;
    map   = window.GameData.maps[id];

    const p = window.GameState.player;
    p.x          = sx != null ? sx : 0;
    p.y          = sy != null ? sy : 0;
    p.currentMap = id;

    window.GameState.setPosition(p.x, p.y);

    // Reset per-map transient state
    patrolState.clear();
    rustles.length = 0;

    if (map.npcs) {
      console.log('[Overworld] Map "' + id + '" loaded with ' + map.npcs.length + ' NPCs:',
        map.npcs.map(n => n.id + ' @ (' + n.x + ',' + n.y + ')').join(', '));
      for (const npc of map.npcs) {
        npc._px = npc.x;
        npc._py = npc.y;
        if (!npc.direction) npc.direction = npc.facing || 'down';
      }
    } else {
      console.warn('[Overworld] Map "' + id + '" has no NPCs array!');
    }
  }

  // ==========================================================================
  //  RANDOM ENCOUNTERS
  // ==========================================================================

  function rollEncounter() {
    if (stepsSinceEnc < ENCOUNTER_COOLDOWN) return;
    if (!map || !map.encounters || map.encounters.length === 0) return;

    const rate = map.encounterRate || 0.1;
    if (Math.random() > rate) return;

    stepsSinceEnc = 0;

    // Weighted random pick
    const creature = weightedPick(map.encounters);
    if (!creature) return;

    const lvl = randInt(creature.minLevel || 1, creature.maxLevel || 5);
    encounterSequence(creature, lvl);
  }

  function weightedPick(list) {
    let total = 0;
    for (const e of list) total += (e.weight || 1);
    let r = Math.random() * total;
    for (const e of list) {
      r -= (e.weight || 1);
      if (r <= 0) return e;
    }
    return list[list.length - 1];
  }

  async function encounterSequence(creature, level) {
    inputEnabled = false;
    walking = false;
    window.GameState.player.walking = false;

    sfx('battleStart');

    // Three quick white flashes (FireRed style)
    for (let i = 0; i < 3; i++) {
      await promiseFlash('white', 80);
      await sleep(60);
    }

    await promiseFade(1, 200, 'black');

    window.dispatchEvent(new CustomEvent('wild-encounter', {
      detail: { creatureId: creature.creatureId || creature.id || creature.name, level, mapId },
    }));
    // Battle system should call Overworld.resume() + Overworld.fadeIn() when done.
  }

  // ==========================================================================
  //  SCREEN EFFECTS
  // ==========================================================================

  // ── Fade ──

  function promiseFade(goal, dur, color) {
    return new Promise(resolve => {
      if (fadeResolve) fadeResolve();   // resolve any in-flight fade
      fadeGoal    = goal;
      fadeDur     = dur || FADE_MS;
      fadeElapsed = 0;
      fadeCol     = color || 'black';
      fadeResolve = resolve;
    });
  }

  function tickFade(dt) {
    if (!fadeResolve) return;
    fadeElapsed += dt;
    const t     = clamp01(fadeElapsed / fadeDur);
    const from  = fadeGoal === 1 ? 0 : 1;
    fadeAlpha   = from + (fadeGoal - from) * ease(t);
    if (t >= 1) {
      fadeAlpha = fadeGoal;
      const fn  = fadeResolve;
      fadeResolve = null;
      fn();
    }
  }

  // ── Flash ──

  function promiseFlash(color, dur) {
    return new Promise(resolve => {
      if (flashResolve) flashResolve();
      flashCol     = color || 'white';
      flashDur     = dur || 100;
      flashClock   = 0;
      flashAlpha   = 1;
      flashResolve = resolve;
    });
  }

  function tickFlash(dt) {
    if (flashAlpha <= 0) return;
    flashClock += dt;
    flashAlpha  = Math.max(0, 1 - flashClock / flashDur);
    if (flashAlpha <= 0) {
      flashAlpha = 0;
      if (flashResolve) {
        const fn = flashResolve;
        flashResolve = null;
        fn();
      }
    }
  }

  // ── Shake ──

  function tickShake(dt) {
    if (shakeClock >= shakeDur) return;
    shakeClock = Math.min(shakeClock + dt, shakeDur);
  }

  function shakeOffset() {
    if (shakeDur === 0 || shakeClock >= shakeDur) return { x: 0, y: 0 };
    const decay = 1 - shakeClock / shakeDur;
    return {
      x: Math.round((Math.random() * 2 - 1) * shakeAmp * decay),
      y: Math.round((Math.random() * 2 - 1) * shakeAmp * decay),
    };
  }

  // ── Grass rustles ──

  function addRustle(tx, ty) {
    rustles.push({ x: tx, y: ty, age: 0, life: 400 });
    if (rustles.length > 12) rustles.shift();
  }

  function tickRustles(dt) {
    for (let i = rustles.length - 1; i >= 0; i--) {
      rustles[i].age += dt;
      if (rustles[i].age >= rustles[i].life) rustles.splice(i, 1);
    }
  }

  // ==========================================================================
  //  RENDERING
  // ==========================================================================

  function render() {
    if (!ctx || !map) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Scale viewport to fill canvas while keeping aspect ratio
    const sx = cw / VIEW_W;
    const sy = ch / VIEW_H;
    const sc = Math.min(sx, sy);

    // Center in canvas (letterbox)
    const ox = Math.floor((cw - VIEW_W * sc) / 2);
    const oy = Math.floor((ch - VIEW_H * sc) / 2);

    ctx.imageSmoothingEnabled = false;

    // Black background (letterbox bars)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(sc, sc);

    // Screen shake
    const sk = shakeOffset();
    ctx.translate(sk.x, sk.y);

    // Camera centered on player
    const cam = camera();

    // Visible tile range (with buffer)
    const tx0 = Math.floor(cam.x / TILE) - 1;
    const ty0 = Math.floor(cam.y / TILE) - 1;
    const tx1 = tx0 + VIEW_COLS + 3;
    const ty1 = ty0 + VIEW_ROWS + 3;

    // ── Ground layer ──
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const id = tileAt('tiles', tx, ty);
        if (!id) continue;
        renderTile(id, tx, ty, cam);
      }
    }

    // ── Grass rustle particles (below entities) ──
    renderRustles(cam);

    // ── Hidden item sparkles ──
    renderHiddenItems(cam);

    // ── Entities sorted by Y for depth ──
    const ents = [];
    pushPlayerEntity(ents, cam);
    pushNPCEntities(ents, cam);
    ents.sort((a, b) => a.sortY - b.sortY);
    for (const e of ents) e.draw();

    // ── Overlay layer (tree canopies, rooftops) ──
    if (map.overlay) {
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          const id = tileAt('overlay', tx, ty);
          if (!id) continue;
          renderTile(id, tx, ty, cam);
        }
      }
    }

    // ── Tall-grass over-player fringe ──
    renderGrassFringe(cam);

    ctx.restore();

    // ── Control hints (fade out after first few seconds) ──
    if (typeof window._owHintTimer === 'undefined') window._owHintTimer = 5;
    if (window._owHintTimer > 0) {
      var hAlpha = Math.min(1, window._owHintTimer) * 0.8;
      ctx.save();
      ctx.globalAlpha = hAlpha;
      var hx = Math.floor(cw / 2);
      var hy = ch - 30;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      var tw = 320;
      ctx.fillRect(hx - tw / 2, hy - 10, tw, 24);
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#F1F5F9';
      ctx.textAlign = 'center';
      ctx.fillText('\u2190\u2191\u2193\u2192 Move   Space = Talk   Esc = Menu', hx, hy + 6);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // ── Full-screen effects (at canvas resolution) ──
    if (flashAlpha > 0) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle   = flashCol;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalAlpha = 1;
    }
    if (fadeAlpha > 0) {
      ctx.globalAlpha = fadeAlpha;
      ctx.fillStyle   = fadeCol;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalAlpha = 1;
    }
  }

  // ── Camera ──

  function camera() {
    const p = window.GameState.player;
    let px, py;
    if (walking) {
      const t = ease(walkT);
      px = walkFromX + (walkToX - walkFromX) * t;
      py = walkFromY + (walkToY - walkFromY) * t;
    } else {
      px = p.x;
      py = p.y;
    }
    return {
      x: px * TILE + TILE / 2 - VIEW_W / 2,
      y: py * TILE + TILE / 2 - VIEW_H / 2,
    };
  }

  // ── Tile rendering ──

  function renderTile(id, tx, ty, cam) {
    const sx = Math.floor(tx * TILE - cam.x);
    const sy = Math.floor(ty * TILE - cam.y);

    // Try Sprites system first
    const spriteKey = TILE_SPRITE_MAP[id] || id;
    if (window.Sprites && window.Sprites.tiles) {
      // Water: pick animated frame variant
      if (isWater(tx, ty)) {
        const key = spriteKey + '_' + waterFrame;
        const sd  = window.Sprites.tiles[key] || window.Sprites.tiles[spriteKey];
        if (sd) { window.Sprites.drawSprite(ctx, sd, sx, sy, 1); return; }
      }
      const sd = window.Sprites.tiles[spriteKey];
      if (sd) { window.Sprites.drawSprite(ctx, sd, sx, sy, 1); return; }
    }

    // ── Fallback procedural rendering ──
    if (isWater(tx, ty)) {
      drawWaterFallback(sx, sy, tx, ty);
      return;
    }
    if (isTallGrass(tx, ty)) {
      drawGrassFallback(sx, sy, tx, ty);
      return;
    }

    const COLORS = {
      'G':  '#88c070',   // short grass
      'TG': '#58a830',   // tall grass
      'P':  '#c0a868',   // dirt / path
      'W':  '#3890e8',   // water
      'H':  '#f8f8f8',   // wall
      'RF': '#a04020',   // roof
      'R':  '#686868',   // rock
      'S':  '#f8d878',   // sand
      'T':  '#305830',   // tree
      'D':  '#a06020',   // door
      'FL': '#88c070',   // flowers (base grass)
      'SG': '#c0a868',   // sign (path base)
      'F':  '#d8c8a0',   // floor
      'C':  '#808090',   // cave floor
      'CW': '#404050',   // cave wall
      'CR': '#9060c0',   // crystal
      'BR': '#a08060',   // bridge
      'FN': '#a08060',   // fence
    };
    ctx.fillStyle = COLORS[id] || '#b0b0b0';
    ctx.fillRect(sx, sy, TILE, TILE);
  }

  function drawWaterFallback(sx, sy, tx, ty) {
    ctx.fillStyle = waterFrame === 0 ? '#3890e8' : '#2080d0';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.strokeStyle = waterFrame === 0 ? '#60b0f8' : '#4898e0';
    ctx.lineWidth = 1;
    const wo = waterFrame * 3;
    ctx.beginPath();
    ctx.moveTo(sx + wo, sy + 5);
    ctx.lineTo(sx + 8 + wo, sy + 3);
    ctx.lineTo(sx + TILE, sy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, sy + 11);
    ctx.lineTo(sx + 6 + wo, sy + 9);
    ctx.lineTo(sx + 14, sy + 11);
    ctx.stroke();
  }

  function drawGrassFallback(sx, sy, tx, ty) {
    ctx.fillStyle = '#58a830';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#408020';
    const sway = Math.sin(grassPhase + tx * 0.7 + ty * 0.5) * 1.5;
    for (let i = 0; i < 5; i++) {
      const bx = sx + 2 + i * 3;
      const by = sy + 4 + (i & 1) * 3;
      ctx.fillRect(bx + sway, by, 2, 8);
    }
  }

  // ── Grass overlay on player ──

  function renderGrassFringe(cam) {
    const p = window.GameState.player;
    const ptx = walking ? Math.round(walkFromX + (walkToX - walkFromX) * walkT) : p.x;
    const pty = walking ? Math.round(walkFromY + (walkToY - walkFromY) * walkT) : p.y;
    if (!isTallGrass(ptx, pty)) return;

    const sx = Math.floor(ptx * TILE - cam.x);
    const sy = Math.floor(pty * TILE - cam.y);
    const sway = Math.sin(grassPhase) * 1;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#58a830';
    ctx.fillRect(sx + sway, sy + 8, TILE, 8);
    ctx.fillStyle = '#408020';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(sx + 1 + i * 4 + sway, sy + 6, 2, 6);
    }
    ctx.globalAlpha = 1;
  }

  // ── Rustle particles ──

  function renderRustles(cam) {
    for (const r of rustles) {
      const sx = Math.floor(r.x * TILE - cam.x);
      const sy = Math.floor(r.y * TILE - cam.y);
      const a  = 1 - r.age / r.life;
      const spread = (r.age / r.life) * 6;
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = '#4a8';
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + r.age * 0.005;
        const dx = Math.cos(angle) * spread;
        const dy = Math.sin(angle) * spread - r.age * 0.005;
        ctx.fillRect(sx + 6 + dx, sy + 10 + dy, 3, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── Hidden item sparkles ──

  function renderHiddenItems(cam) {
    if (!map || !map.hiddenItems) return;
    for (const item of map.hiddenItems) {
      const uid = mapId + '_' + item.x + '_' + item.y;
      if (isItemCollected(uid)) continue;
      const sx = Math.floor(item.x * TILE - cam.x);
      const sy = Math.floor(item.y * TILE - cam.y);
      // Subtle sparkle animation
      const t = (Date.now() % 2000) / 2000;
      const sparkle = Math.sin(t * Math.PI * 2) * 0.3 + 0.4;
      ctx.globalAlpha = sparkle;
      ctx.fillStyle = '#fff8a0';
      ctx.fillRect(sx + 7, sy + 3, 2, 2);
      ctx.fillRect(sx + 3, sy + 7, 2, 2);
      ctx.fillRect(sx + 11, sy + 7, 2, 2);
      ctx.fillRect(sx + 7, sy + 11, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  // ── Player ──

  function pushPlayerEntity(ents, cam) {
    const p = window.GameState.player;
    let px, py, sortY;
    if (walking) {
      const t = ease(walkT);
      px    = walkFromX + (walkToX - walkFromX) * t;
      py    = walkFromY + (walkToY - walkFromY) * t;
      sortY = py;
    } else {
      px = p.x; py = p.y; sortY = py;
    }
    const sx = Math.floor(px * TILE - cam.x);
    const sy = Math.floor(py * TILE - cam.y);

    ents.push({
      sortY,
      draw() { drawPlayer(sx, sy); },
    });
  }

  function drawPlayer(sx, sy) {
    const p   = window.GameState.player;
    const dir = p.direction || 'down';
    const frm = walking ? walkFrame : 0;

    // Try Sprites system
    if (window.Sprites && window.Sprites.player) {
      let sd = null;
      if (walking) {
        // Walk animations: sprites.player.walkDown = [frame1, frame2], etc.
        const walkKey = 'walk' + dir.charAt(0).toUpperCase() + dir.slice(1);
        const walkFrames = window.Sprites.player[walkKey];
        if (walkFrames && walkFrames[frm]) {
          sd = walkFrames[frm];
        }
      }
      // Fallback to standing sprite
      if (!sd) sd = window.Sprites.player[dir];
      if (sd) { window.Sprites.drawSprite(ctx, sd, sx, sy, 1); return; }
    }

    // Fallback character
    drawCharFallback(sx, sy, dir, frm, '#e04040');
  }

  // ── NPCs ──

  function pushNPCEntities(ents, cam) {
    if (!map || !map.npcs) return;
    for (const npc of map.npcs) {
      const nx = npc._px != null ? npc._px : npc.x;
      const ny = npc._py != null ? npc._py : npc.y;
      const sx = Math.floor(nx * TILE - cam.x);
      const sy = Math.floor(ny * TILE - cam.y);
      ents.push({
        sortY: ny,
        draw() { drawNPC(npc, sx, sy); },
      });
    }
  }

  function drawNPC(npc, sx, sy) {
    const dir = npc.direction || 'down';
    const rawSid = npc.spriteId || npc.sprite || npc.name;

    // Signs are drawn as tiles, not NPC sprites
    if (rawSid === 'sign') {
      if (window.Sprites && window.Sprites.tiles && window.Sprites.tiles.sign) {
        window.Sprites.drawSprite(ctx, window.Sprites.tiles.sign, sx, sy, 1);
      } else {
        ctx.fillStyle = '#a08060';
        ctx.fillRect(sx + 3, sy + 2, 10, 10);
        ctx.fillStyle = '#604020';
        ctx.fillRect(sx + 6, sy + 12, 4, 4);
      }
      // Draw sign label
      if (npc.name && npc.name !== 'Sign') {
        ctx.fillStyle = '#fff';
        ctx.font = '4px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, sx + 8, sy - 1);
        ctx.textAlign = 'left';
      }
      return;
    }

    // Map game-data sprite names to sprites.js keys
    const sid = NPC_SPRITE_MAP[rawSid] || rawSid;

    let spriteDrawn = false;
    try {
      if (window.Sprites && window.Sprites.npcs && sid) {
        const sd = window.Sprites.npcs[sid + '_' + dir] || window.Sprites.npcs[sid];
        if (sd && Array.isArray(sd) && sd.length > 0) {
          window.Sprites.drawSprite(ctx, sd, sx, sy, 1);
          spriteDrawn = true;
        }
      }
    } catch (e) {
      console.warn('[Overworld] NPC sprite error for', npc.id, rawSid, sid, e);
    }

    // Fallback if sprite didn't draw
    if (!spriteDrawn) {
      const col = npc.trainer ? '#d84040' : '#4080d8';
      drawCharFallback(sx, sy, dir, 0, col);
    }

    // Trainer icon
    if (npc.trainer) {
      ctx.fillStyle = '#f8d830';
      ctx.fillRect(sx + 6, sy - 3, 4, 4);
    }

    // NPC name label above sprite (always visible)
    if (npc.name) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const labelW = Math.max(npc.name.length * 3, 16);
      ctx.fillRect(sx + 8 - labelW / 2, sy - 6, labelW, 5);
      ctx.fillStyle = '#ffffff';
      ctx.font = '4px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, sx + 8, sy - 2);
      ctx.textAlign = 'left';
    }
  }

  // ── Fallback character sprite (no asset needed) ──

  function drawCharFallback(sx, sy, dir, frame, bodyCol) {
    // Body
    ctx.fillStyle = bodyCol;
    ctx.fillRect(sx + 3, sy + 4, 10, 8);
    // Head
    ctx.fillStyle = '#f8d0a0';
    ctx.fillRect(sx + 4, sy, 8, 6);
    // Eyes
    ctx.fillStyle = '#000';
    switch (dir) {
      case 'down':
        ctx.fillRect(sx + 5, sy + 2, 2, 2);
        ctx.fillRect(sx + 9, sy + 2, 2, 2);
        break;
      case 'up':
        ctx.fillStyle = '#a07040';
        ctx.fillRect(sx + 4, sy, 8, 3);
        break;
      case 'left':
        ctx.fillRect(sx + 4, sy + 2, 2, 2);
        break;
      case 'right':
        ctx.fillRect(sx + 10, sy + 2, 2, 2);
        break;
    }
    // Legs (walk offset)
    ctx.fillStyle = '#3040a0';
    const lo = frame === 1 ? 2 : 0;
    ctx.fillRect(sx + 4 - lo, sy + 12, 4, 4);
    ctx.fillRect(sx + 8 + lo, sy + 12, 4, 4);
  }

  // ==========================================================================
  //  CANVAS RESIZE
  // ==========================================================================

  function onResize() {
    if (!canvas) return;
    const parent = canvas.parentElement || document.body;
    const rect   = parent.getBoundingClientRect();
    canvas.width  = rect.width  || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  // ==========================================================================
  //  MAIN LOOP
  // ==========================================================================

  function loop(ts) {
    if (!running) return;

    const dt = lastTimestamp === 0
      ? 16.67
      : Math.min(ts - lastTimestamp, 50);   // cap to avoid spiral of death
    lastTimestamp = ts;

    if (!paused) update(dt);
    render();

    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Animation clocks
    waterClock += dt;
    if (waterClock >= WATER_CYCLE_MS) {
      waterClock -= WATER_CYCLE_MS;
      waterFrame  = (waterFrame + 1) % 2;
    }
    grassClock += dt;
    grassPhase  = (grassClock / GRASS_SWAY_MS) * Math.PI * 2;

    // Effects
    tickFade(dt);
    tickFlash(dt);
    tickShake(dt);
    tickRustles(dt);
    updatePatrols(dt);

    // Movement
    if (walking) {
      tickWalk(dt);
    } else if (inputEnabled) {
      const dir = pollDirection();
      if (dir) beginWalk(dir);
    }

    // Fade control hints
    if (window._owHintTimer > 0) {
      window._owHintTimer -= dt / 1000;
    }
  }

  // ==========================================================================
  //  UTILITIES
  // ==========================================================================

  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function randInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function sfx(name) { if (window.SFX) window.SFX.play(name); }

  // ==========================================================================
  //  PUBLIC API
  // ==========================================================================

  window.Overworld = {

    /**
     * Initialize the overworld engine.
     * @param {HTMLCanvasElement} [canvasEl] - canvas element, or auto-finds #game-canvas
     */
    init(canvasEl) {
      canvas = canvasEl || document.getElementById('game-canvas');
      if (!canvas) {
        console.error('[Overworld] No canvas element found (#game-canvas)');
        return;
      }
      ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      onResize();
      window.addEventListener('resize',  onResize);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup',   onKeyUp);

      // Auto-load the map that GameState already references
      const p = window.GameState && window.GameState.player;
      if (p && p.currentMap) {
        internalLoadMap(p.currentMap, p.x, p.y);
      }
    },

    /** Start the game loop (60 fps via requestAnimationFrame). */
    start() {
      if (running) return;
      running       = true;
      paused        = false;
      lastTimestamp  = 0;
      requestAnimationFrame(loop);
    },

    /** Pause update logic (rendering continues; use for battles / menus). */
    pause() {
      paused       = true;
      inputEnabled = false;
    },

    /** Resume from pause. */
    resume() {
      paused       = false;
      inputEnabled = true;
      lastTimestamp = 0;          // avoid a big delta spike
    },

    /**
     * Load a map and place the player.
     * @param {string} id     – key in GameData.maps
     * @param {number} spawnX – tile column
     * @param {number} spawnY – tile row
     */
    loadMap(id, spawnX, spawnY) {
      internalLoadMap(id, spawnX, spawnY);
    },

    /**
     * Get the player's current tile position.
     * @returns {{ x: number, y: number, map: string }}
     */
    getPlayerPos() {
      const p = window.GameState.player;
      return { x: p.x, y: p.y, map: p.currentMap || mapId };
    },

    /**
     * Instantly move the player to a tile (warps, story events).
     * @param {number} x
     * @param {number} y
     */
    teleportPlayer(x, y) {
      const p = window.GameState.player;
      p.x = x;
      p.y = y;
      walking   = false;
      p.walking = false;
      if (window.GameState.setPosition) {
        window.GameState.setPosition(x, y);
      }
    },

    /**
     * Fade screen to opaque.
     * @param {number} [duration=300]
     * @returns {Promise<void>}
     */
    fadeOut(duration) {
      return promiseFade(1, duration || FADE_MS, 'black');
    },

    /**
     * Fade screen back to clear.
     * @param {number} [duration=300]
     * @returns {Promise<void>}
     */
    fadeIn(duration) {
      return promiseFade(0, duration || FADE_MS, 'black');
    },

    /**
     * Shake the screen.
     * @param {number} [duration=300]
     * @param {number} [intensity=4]
     */
    screenShake(duration, intensity) {
      shakeDur   = duration  || 300;
      shakeAmp   = intensity || 4;
      shakeClock = 0;
    },

    /**
     * Flash the screen a solid colour then fade.
     * @param {string}  [color='white']
     * @param {number}  [duration=100]
     * @returns {Promise<void>}
     */
    flash(color, duration) {
      return promiseFlash(color || 'white', duration || 100);
    },

    /**
     * Set the player's facing direction.
     * @param {'up'|'down'|'left'|'right'} dir
     */
    setPlayerDirection(dir) {
      if (DIR_VEC[dir]) window.GameState.player.direction = dir;
    },

    /**
     * Query whether a tile can be walked on.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isTileWalkable(x, y) {
      return canWalk(x, y);
    },

    /**
     * Enable or disable all player input.
     * @param {boolean} enabled
     */
    setInputEnabled(enabled) {
      inputEnabled = !!enabled;
    },

    /** Tear down listeners and stop the loop. */
    destroy() {
      running = false;
      window.removeEventListener('resize',  onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    },
  };
})();
