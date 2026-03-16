/**
 * Main Game Controller - MathQuest: Realm of Numbers
 *
 * Initializes all systems, manages game states (title, overworld, battle,
 * dialogue, menus), and coordinates the main game loop.
 *
 * @version 1.0.0
 */
(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // Game states
  // -------------------------------------------------------------------------

  const State = {
    LOADING: 'loading',
    TITLE: 'title',
    STARTER_SELECT: 'starterSelect',
    OVERWORLD: 'overworld',
    BATTLE: 'battle',
    DIALOGUE: 'dialogue',
    MENU: 'menu',
    TEAM_VIEW: 'teamView',
    BAG_VIEW: 'bagView',
    STATS_VIEW: 'statsView',
    SHOP: 'shop',
    TRANSITION: 'transition',
  };

  let _currentState = State.LOADING;
  let _previousState = null;
  let _canvas = null;
  let _ctx = null;
  let _initialized = false;

  // Level-up overlay queue
  let _levelUpQueue = [];
  let _levelUpDone = null;

  // Shop state
  let _shopNPC = null;

  // Creature picker state
  let _pickerItemId = null;
  let _pickerCallback = null;

  // Map display names
  const MAP_NAMES = {
    starterTown: 'Starter Town',
    route1:      'Route 1',
    emeraldForest: 'Emerald Forest',
    crystalCave: 'Crystal Cave',
  };

  // Loading tips
  const LOADING_TIPS = [
    'Tip: Answering quickly gives bonus damage!',
    'Tip: Super effective moves deal double damage!',
    'Tip: Use MathOrbs to catch wild creatures!',
    'Tip: Heal at the Healer in Starter Town!',
    'Tip: Your accuracy affects your catch rate!',
    'Tip: Solve problems correctly to boost your streak!',
    'Tip: Fire beats Grass, Water beats Fire, Grass beats Water!',
    'Tip: Boss battles need extra math power!',
    'Tip: Check your Bag to use Potions outside battle!',
    'Tip: Reach higher math tiers for more powerful moves!',
  ];

  // Dialogue queue
  let _dialogueQueue = [];
  let _dialogueCallback = null;
  let _dialogueCharIndex = 0;
  let _dialogueFullText = '';
  let _dialogueSpeaker = '';
  let _dialogueTyping = false;
  let _dialogueTimer = null;

  // -------------------------------------------------------------------------
  // DOM references
  // -------------------------------------------------------------------------

  const $ = (id) => document.getElementById(id);

  function hideAllOverlays() {
    const overlays = document.querySelectorAll('.overlay');
    overlays.forEach(o => { o.hidden = true; o.style.display = 'none'; });
  }

  function showOverlay(id) {
    const el = $(id);
    if (el) { el.hidden = false; el.style.display = ''; }
  }

  function hideOverlay(id) {
    const el = $(id);
    if (el) { el.hidden = true; el.style.display = 'none'; }
  }

  // -------------------------------------------------------------------------
  // Canvas setup
  // -------------------------------------------------------------------------

  const BASE_WIDTH = 320;
  const BASE_HEIGHT = 240;

  function setupCanvas() {
    _canvas = $('game-canvas');
    if (!_canvas) {
      console.error('Canvas element not found');
      return;
    }
    _ctx = _canvas.getContext('2d');

    // Set internal resolution
    _canvas.width = BASE_WIDTH * (window.Sprites ? window.Sprites.SCALE : 4);
    _canvas.height = BASE_HEIGHT * (window.Sprites ? window.Sprites.SCALE : 4);

    // Crisp pixel rendering
    _ctx.imageSmoothingEnabled = false;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!_canvas) return;
    const container = $('game-container') || _canvas.parentElement;
    if (!container) return;

    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    const ratio = 4 / 3;

    let w, h;
    if (maxW / maxH > ratio) {
      h = maxH;
      w = h * ratio;
    } else {
      w = maxW;
      h = w / ratio;
    }

    _canvas.style.width = Math.floor(w) + 'px';
    _canvas.style.height = Math.floor(h) + 'px';
  }

  // -------------------------------------------------------------------------
  // State management
  // -------------------------------------------------------------------------

  function setState(newState) {
    _previousState = _currentState;
    _currentState = newState;

    // Hide all overlays first
    hideAllOverlays();

    switch (newState) {
      case State.TITLE:
        showOverlay('title-screen');
        if (window.GameState && window.GameState.hasSave()) {
          const btn = $('btn-continue');
          if (btn) btn.style.display = '';
        } else {
          const btn = $('btn-continue');
          if (btn) btn.style.display = 'none';
        }
        if (window.SFX) window.SFX.playMusic('titleTheme');
        break;

      case State.STARTER_SELECT:
        showOverlay('starter-select');
        break;

      case State.OVERWORLD:
        if (window.Overworld) window.Overworld.resume();
        if (window.SFX) {
          const map = window.GameState ? window.GameState.currentMap : '';
          if (map === 'starterTown') {
            window.SFX.playMusic('townTheme');
          } else {
            window.SFX.playMusic('overworldTheme');
          }
        }
        updateOverworldHUD();
        break;

      case State.BATTLE:
        if (window.Overworld) window.Overworld.pause();
        break;

      case State.DIALOGUE:
        showOverlay('dialogue-box');
        break;

      case State.MENU:
        showOverlay('game-menu');
        if (window.Overworld) window.Overworld.pause();
        break;

      case State.TEAM_VIEW:
        showOverlay('team-view');
        renderTeamView();
        break;

      case State.BAG_VIEW:
        showOverlay('bag-view');
        renderBagView();
        break;

      case State.STATS_VIEW:
        showOverlay('stats-view');
        renderStatsView();
        break;

      case State.SHOP:
        showOverlay('shop-view');
        if (window.Overworld) window.Overworld.pause();
        renderShopView(_shopNPC);
        break;
    }

    // Overworld HUD visibility
    const hud = $('overworld-hud');
    if (hud) {
      if (newState === State.OVERWORLD) {
        hud.hidden = false;
      } else {
        hud.hidden = true;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Title screen
  // -------------------------------------------------------------------------

  function setupTitleScreen() {
    const btnNew = $('btn-new-game');
    const btnContinue = $('btn-continue');

    if (btnNew) {
      btnNew.addEventListener('click', () => {
        if (window.SFX) window.SFX.play('confirm');
        startNewGame();
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        if (window.SFX) window.SFX.play('confirm');
        continueGame();
      });
    }
  }

  function startNewGame() {
    if (window.GameState) window.GameState.newGame();
    if (window.MathEngine) window.MathEngine.init(null);
    if (window.SFX) window.SFX.stopMusic(500);

    // Show professor intro dialogue
    showDialogue([
      { speaker: 'Prof. Euclid', text: "Welcome to the world of MathQuest!" },
      { speaker: 'Prof. Euclid', text: "I'm Professor Euclid, and I study the magical creatures of this realm." },
      { speaker: 'Prof. Euclid', text: "In this world, math is the source of all power!" },
      { speaker: 'Prof. Euclid', text: "Every spell, every battle move, every magical ability... it all comes from solving math problems." },
      { speaker: 'Prof. Euclid', text: "The better you get at math, the stronger you'll become!" },
      { speaker: 'Prof. Euclid', text: "Now, let me introduce you to your first partner creature..." },
    ], () => {
      setState(State.STARTER_SELECT);
    });
  }

  function continueGame() {
    if (window.GameState && window.GameState.load()) {
      if (window.SFX) window.SFX.stopMusic(500);
      initOverworld();
      setState(State.OVERWORLD);
      if (window.GameState) window.GameState.startPlayTimer();
    }
  }

  // -------------------------------------------------------------------------
  // Starter selection
  // -------------------------------------------------------------------------

  function setupStarterSelect() {
    const cards = document.querySelectorAll('.starter-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (window.SFX) window.SFX.play('confirm');
        const creatureId = card.dataset.creature;
        selectStarter(creatureId);
      });
    });

    // Render creature sprites into starter card preview divs
    renderStarterSprites();
  }

  function renderStarterSprites() {
    const starters = ['flametail', 'aquapup', 'leafbara'];
    for (const id of starters) {
      const container = document.getElementById('sprite-' + id);
      if (!container) continue;

      // PNG sprite sheet path
      const ssd = window.SpriteSheetData && window.SpriteSheetData.getSpriteSheetData(id);
      if (ssd) {
        const img = window.SpriteSheetData.getImage(ssd.sheetSrc);
        const drawSheet = (imgEl) => {
          const canvas = document.createElement('canvas');
          const size = 80;
          canvas.width = size;
          canvas.height = size;
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.imageRendering = 'pixelated';
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          const fr = ssd.frames.idle;
          ctx.drawImage(imgEl, fr.sx, fr.sy, fr.sw, fr.sh, 0, 0, size, size);
          container.innerHTML = '';
          container.appendChild(canvas);
        };
        if (img && img.complete && img.naturalWidth > 0) {
          drawSheet(img);
        } else {
          const tmpImg = new Image();
          tmpImg.onload = () => drawSheet(tmpImg);
          tmpImg.src = ssd.sheetSrc;
        }
        continue;
      }

      // Pixel array fallback
      const canvas = document.createElement('canvas');
      const size = 80;
      canvas.width = size;
      canvas.height = size;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.imageRendering = 'pixelated';
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      if (window.Sprites && window.Sprites.creatures && window.Sprites.creatures[id]) {
        const spriteData = window.Sprites.creatures[id].front;
        if (spriteData && Array.isArray(spriteData)) {
          const spriteH = spriteData.length;
          const spriteW = spriteData[0] ? spriteData[0].length : 16;
          const scale = Math.floor(Math.min(size / spriteW, size / spriteH));
          const ox = Math.floor((size - spriteW * scale) / 2);
          const oy = Math.floor((size - spriteH * scale) / 2);
          for (let row = 0; row < spriteH; row++) {
            for (let col = 0; col < spriteW; col++) {
              const color = spriteData[row][col];
              if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(ox + col * scale, oy + row * scale, scale, scale);
              }
            }
          }
        }
      }

      container.innerHTML = '';
      container.appendChild(canvas);
    }
  }

  function selectStarter(creatureId) {
    if (!window.GameState || !window.GameData) return;

    const creature = window.GameState.createCreature(creatureId, 5);
    if (!creature) return;

    window.GameState.addToTeam(creature);
    window.GameState.setFlag('choseStarter', true);
    window.GameState.setFlag('starterChoice', creatureId);

    const name = creature.name;

    hideOverlay('starter-select');

    showDialogue([
      { speaker: 'Prof. Euclid', text: `Excellent choice! ${name} is a wonderful partner!` },
      { speaker: 'Prof. Euclid', text: `${name} will grow stronger every time you solve math problems correctly.` },
      { speaker: 'Prof. Euclid', text: "Go explore the world! Visit the tall grass to find wild creatures." },
      { speaker: 'Prof. Euclid', text: "And remember - practice makes perfect! The more problems you solve, the more powerful you become!" },
    ], () => {
      initOverworld();
      setState(State.OVERWORLD);
      if (window.GameState) window.GameState.startPlayTimer();
    });
  }

  // -------------------------------------------------------------------------
  // Overworld initialization & events
  // -------------------------------------------------------------------------

  function initOverworld() {
    if (!window.Overworld || !_canvas) return;

    window.Overworld.init(_canvas);

    const state = window.GameState ? window.GameState.player : null;
    if (state) {
      window.Overworld.loadMap(state.currentMap, state.x, state.y);
    } else {
      window.Overworld.loadMap('starterTown', 7, 10);
    }

    window.Overworld.start();
  }

  function setupOverworldEvents() {
    // Wild encounter
    window.addEventListener('wild-encounter', (e) => {
      const data = e.detail;
      if (!data || !window.Battle) return;

      if (window.SFX) {
        window.SFX.stopMusic(200);
        window.SFX.play('battleStart');
      }

      setState(State.BATTLE);

      setTimeout(() => {
        // Start battle music
        if (window.SFX) window.SFX.playMusic('battleTheme');

        const battlePromise = window.Battle.startWild(
          _canvas,
          data.creatureId,
          data.level
        );

        if (battlePromise && battlePromise.then) {
          battlePromise.then(handleBattleEnd);
        }
      }, 300);
    });

    // NPC interaction
    window.addEventListener('npc-interact', (e) => {
      const detail = e.detail;
      if (!detail) return;
      // Overworld dispatches { npc, isTrainer, dialogue, mapId }
      const npc = detail.npc || detail;
      if (!npc) return;

      if (window.SFX) window.SFX.play('npcChat');

      /**
       * Resolve the right dialogue lines from an NPC's dialogue data.
       * game-data uses objects like { default: [...], afterStarter: [...], revisit: [...] }
       * or for trainers: { before: [...], after: [...] }
       */
      function resolveDialogue(npc, forBattle) {
        const d = npc.dialogue;
        if (!d) return [{ speaker: npc.name, text: "Hello!" }];

        // If it's already an array of strings, use as-is
        if (Array.isArray(d)) {
          return d.map(t => typeof t === 'string' ? { speaker: npc.name, text: t } : t);
        }

        // Object-format dialogue — pick the right key based on game state
        let lines = null;
        if (forBattle && d.before) {
          lines = d.before;
        } else if (npc.givesStarter && !window.GameState.getFlag('choseStarter')) {
          lines = d.default || d.before || [];
        } else if (npc.givesStarter && window.GameState.getFlag('choseStarter')) {
          lines = d.afterStarter || d.revisit || d.default || [];
        } else if (npc.trainer && window.GameState.isTrainerDefeated(npc.id)) {
          lines = d.after || d.revisit || d.default || [];
        } else {
          lines = d.default || d.before || [];
        }

        if (!Array.isArray(lines)) lines = [lines];
        return lines.map(t => typeof t === 'string' ? { speaker: npc.name, text: t } : t);
      }

      // Check if trainer and not yet defeated
      if (npc.trainer && !window.GameState.isTrainerDefeated(npc.id)) {
        const dialogueItems = resolveDialogue(npc, true);
        showDialogue(dialogueItems, () => {
          startTrainerBattle(npc);
        });
      } else if (npc.isHealer || npc.healer) {
        // Heal station
        const healDialogue = resolveDialogue(npc, false);
        showDialogue(healDialogue, () => {
          if (window.GameState) window.GameState.healAll();
          if (window.SFX) window.SFX.play('healSound');
          showDialogue([
            { speaker: npc.name, text: "All your creatures are fully healed! Good luck out there!" },
          ], () => setState(State.OVERWORLD));
        });
      } else if (npc.isShop || npc.shop) {
        // Shop
        handleShopNPC(npc);
      } else if (npc.trainer && window.GameState.isTrainerDefeated(npc.id)) {
        // Already defeated trainer
        const dialogueItems = resolveDialogue(npc, false);
        showDialogue(dialogueItems, () => setState(State.OVERWORLD));
      } else if (npc.isDailyChallenge) {
        // Daily Challenge NPC — special math challenge
        const today = new Date().toDateString();
        const lastChallenge = window.GameState.getFlag('lastDailyChallenge');
        if (lastChallenge === today) {
          showDialogue([
            { speaker: npc.name, text: "You already completed today's challenge! Come back tomorrow for a new one." },
          ], () => setState(State.OVERWORLD));
        } else {
          const dialogueItems = resolveDialogue(npc, false);
          showDialogue(dialogueItems, () => {
            // Start a special daily challenge battle
            if (window.Battle) {
              window.GameState.setFlag('lastDailyChallenge', today);
              setState(State.BATTLE);
              setTimeout(() => {
                const creatures = ['flametail', 'aquapup', 'thornsprout', 'sparkling', 'geolem'];
                const pick = creatures[Math.floor(Math.random() * creatures.length)];
                const level = Math.max(5, (window.GameState.player.totalProblems || 0) > 30 ? 10 : 7);
                const bp = window.Battle.startWild(_canvas, pick, level);
                if (bp && bp.then) {
                  bp.then((result) => {
                    if (result && result.outcome === 'win') {
                      window.GameState.addGold(200);
                      window.GameState.addItem('mathOrb', 3);
                      showDialogue([
                        { speaker: npc.name, text: "Amazing work! Here's 200 gold and 3 MathOrbs as your daily reward!" },
                      ], () => setState(State.OVERWORLD));
                    } else {
                      handleBattleEnd(result);
                    }
                  });
                }
              }, 300);
            }
          });
        }
      } else if (npc.givesStarter && !window.GameState.getFlag('choseStarter')) {
        // Professor Euclid — trigger starter selection
        const dialogueItems = resolveDialogue(npc, false);
        showDialogue(dialogueItems, () => {
          setState(State.STARTER_SELECT);
        });
      } else {
        // Regular NPC dialogue
        const dialogueItems = resolveDialogue(npc, false);
        showDialogue(dialogueItems, () => setState(State.OVERWORLD));
      }
    });

    // Map blocked by progression gate
    window.addEventListener('map-blocked', (e) => {
      const data = e.detail;
      if (!data) return;
      showDialogue([
        { speaker: '', text: data.message || "You can't go here yet!" },
      ], () => setState(State.OVERWORLD));
    });

    // Map change
    window.addEventListener('map-change', (e) => {
      const data = e.detail;
      if (!data) return;

      // Check progression gates
      const targetMap = data.toMap || data.map;
      if (window.GameData && window.GameData.maps[targetMap]) {
        const mapData = window.GameData.maps[targetMap];
        if (mapData.requirement && !checkRequirement(mapData.requirement)) {
          // Block entry
          showDialogue([
            { speaker: '', text: mapData.requirement.message || "You can't go here yet!" },
          ], () => setState(State.OVERWORLD));
          return;
        }
      }

      if (window.SFX) window.SFX.play('newArea');

      // Update music based on map
      if (window.SFX) {
        if (targetMap === 'starterTown' || targetMap === 'professorLab' || targetMap === 'pennyShop' || targetMap === 'healStation') {
          window.SFX.playMusic('townTheme');
        } else {
          window.SFX.playMusic('overworldTheme');
        }
      }

      if (window.GameState) {
        window.GameState.setPosition(data.spawnX, data.spawnY, targetMap);
        // Auto-save on map transition
        window.GameState.save();
      }
      updateOverworldHUD();
    });

    // Hidden item found
    window.addEventListener('found-hidden-item', (e) => {
      const detail = e.detail;
      if (!detail || !detail.item) return;
      const item = detail.item;

      // Add item to inventory
      if (window.GameState) {
        window.GameState.addItem(item.itemId, item.quantity || 1);
      }

      showDialogue([
        { speaker: '', text: `Found ${item.quantity || 1}x ${item.name}!` },
      ], () => setState(State.OVERWORLD));
    });

    // Menu open
    window.addEventListener('open-menu', () => {
      if (_currentState === State.OVERWORLD) {
        if (window.SFX) window.SFX.play('menuOpen');
        setState(State.MENU);
      }
    });
  }

  function checkRequirement(req) {
    if (!req || !window.GameState) return true;

    // game-data uses { type: 'problemsSolved', count: 10 } format
    if (req.type === 'problemsSolved' && req.count) {
      if ((window.GameState.player.totalProblems || 0) < req.count) return false;
    }
    // Also support direct field format
    if (req.problemsSolved && (window.GameState.player.totalProblems || 0) < req.problemsSolved) {
      return false;
    }
    if (req.badge && !window.GameState.hasBadge(req.badge)) {
      return false;
    }
    if (req.type === 'badge' && req.badge && !window.GameState.hasBadge(req.badge)) {
      return false;
    }
    if (req.flag && !window.GameState.getFlag(req.flag)) {
      return false;
    }
    if (req.minAccuracy || req.accuracy) {
      const threshold = req.minAccuracy || req.accuracy;
      const acc = window.GameState.getMathAccuracy();
      if (acc < threshold) return false;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Battle management
  // -------------------------------------------------------------------------

  function startTrainerBattle(npc) {
    if (!window.Battle) return;

    if (window.SFX) {
      window.SFX.stopMusic(200);
      window.SFX.play('battleStart');
    }

    setState(State.BATTLE);

    setTimeout(() => {
      // Start battle music (boss gets boss theme)
      if (window.SFX) {
        window.SFX.playMusic((npc.isBoss || npc.boss) ? 'bossTheme' : 'battleTheme');
      }

      const battlePromise = window.Battle.startTrainer(_canvas, npc);
      if (battlePromise && battlePromise.then) {
        battlePromise.then((result) => {
          handleBattleEnd(result, npc);
        });
      }
    }, 300);
  }

  function handleBattleEnd(result, trainerNpc) {
    if (!result) {
      setState(State.OVERWORLD);
      return;
    }

    const events = [];

    if (result.outcome === 'win') {
      // Award XP to participating creature
      if (result.xpGained && window.GameState && window.GameState.team[0]) {
        const xpEvents = window.GameState.awardXP(window.GameState.team[0], result.xpGained);
        if (Array.isArray(xpEvents)) events.push(...xpEvents);
      }

      // Award gold
      if (result.goldGained && window.GameState) {
        window.GameState.addGold(result.goldGained);
      }

      // Mark trainer as defeated
      if (trainerNpc && trainerNpc.id) {
        window.GameState.defeatTrainer(trainerNpc.id);

        // Check for badge
        if (trainerNpc.badge) {
          window.GameState.addBadge(trainerNpc.badge);
          events.push({ type: 'badge', badge: trainerNpc.badge });
        }
      }
    } else if (result.outcome === 'caught' && result.caughtCreature) {
      window.GameState.addToTeam(result.caughtCreature);
    } else if (result.outcome === 'lose') {
      // Player blacked out - heal and return to town
      if (window.GameState) {
        window.GameState.healAll();
        window.GameState.setPosition(7, 10, 'starterTown');
      }
    }

    // Build post-battle dialogue (caught, blackout)
    const dialogues = [];

    if (result.outcome === 'lose') {
      dialogues.push({
        speaker: '',
        text: "You blacked out... Your creatures have been healed and you're back in town."
      });
    }

    if (result.outcome === 'caught' && result.caughtCreature) {
      dialogues.push({
        speaker: '',
        text: `You caught ${result.caughtCreature.name}! It's been added to your team!`
      });
    }

    // Chain: level-up overlay events → optional dialogue → overworld
    function finish() {
      if (dialogues.length > 0) {
        showDialogue(dialogues, returnToOverworld);
      } else {
        returnToOverworld();
      }
    }

    // Overlay events: levelUp, newMove, evolution, badge
    const overlayEvents = events.filter(e =>
      e.type === 'levelUp' || e.type === 'newMove' || e.type === 'evolution' || e.type === 'badge'
    );

    if (overlayEvents.length > 0) {
      showLevelUp(overlayEvents, finish);
    } else {
      finish();
    }
  }

  // -------------------------------------------------------------------------
  // Level-up overlay
  // -------------------------------------------------------------------------

  function showLevelUp(events, done) {
    _levelUpQueue = events.slice();
    _levelUpDone = done;
    advanceLevelUp();
  }

  function advanceLevelUp() {
    if (_levelUpQueue.length === 0) {
      hideOverlay('level-up');
      const cb = _levelUpDone;
      _levelUpDone = null;
      if (cb) cb();
      return;
    }

    const evt = _levelUpQueue.shift();
    const titleEl = document.querySelector('.level-up-text');
    const detailsEl = $('level-up-details');

    if (evt.type === 'levelUp') {
      // Absorb any immediately following newMove events into this card
      const learnedMoves = [];
      while (_levelUpQueue.length > 0 && _levelUpQueue[0].type === 'newMove') {
        learnedMoves.push(_levelUpQueue.shift());
      }

      if (titleEl) {
        titleEl.textContent = 'LEVEL UP!';
        titleEl.style.color = 'var(--gold)';
      }

      // Find the creature that leveled (first alive on team)
      const creature = window.GameState ? window.GameState.getFirstAlive() : null;
      const cName = creature ? creature.name : '';

      let details = `${cName} is now\nLevel ${evt.level}!`;
      if (learnedMoves.length > 0) {
        learnedMoves.forEach(m => {
          const moveName = window.GameData && window.GameData.moves[m.move]
            ? window.GameData.moves[m.move].name : m.move;
          details += `\n\nLearned ${moveName}!`;
        });
      }
      if (detailsEl) detailsEl.textContent = details;
      if (window.SFX) window.SFX.play('levelUp');

    } else if (evt.type === 'evolution') {
      if (titleEl) {
        titleEl.textContent = 'EVOLVED!';
        titleEl.style.color = 'var(--type-mystic)';
      }
      if (detailsEl) detailsEl.textContent = `${evt.from}\nevolved into\n${evt.newName}!`;
      if (window.SFX) window.SFX.play('evolve');

    } else if (evt.type === 'badge') {
      if (titleEl) {
        titleEl.textContent = 'BADGE!';
        titleEl.style.color = 'var(--gold)';
      }
      if (detailsEl) detailsEl.textContent = `You earned the\n${evt.badge} Badge!`;
      if (window.SFX) window.SFX.play('badge');

    } else if (evt.type === 'newMove') {
      // Standalone new move (shouldn't happen often due to absorption above)
      if (titleEl) {
        titleEl.textContent = 'NEW MOVE!';
        titleEl.style.color = 'var(--type-grass)';
      }
      const moveName = window.GameData && window.GameData.moves[evt.move]
        ? window.GameData.moves[evt.move].name : evt.move;
      const creature = window.GameState ? window.GameState.getFirstAlive() : null;
      if (detailsEl) detailsEl.textContent = `${creature ? creature.name : ''}\nlearned\n${moveName}!`;
      if (window.SFX) window.SFX.play('confirm');
    }

    showOverlay('level-up');
  }

  function returnToOverworld() {
    // Reload the map so NPCs and tiles are fresh after battle
    if (window.Overworld) {
      const state = window.GameState ? window.GameState.player : null;
      if (state && state.currentMap) {
        window.Overworld.loadMap(state.currentMap, state.x, state.y);
      }
    }
    updateOverworldHUD();
    // setState(OVERWORLD) handles resume() and music
    setState(State.OVERWORLD);
  }

  // -------------------------------------------------------------------------
  // Dialogue system
  // -------------------------------------------------------------------------

  function showDialogue(messages, callback) {
    _dialogueQueue = messages.slice();
    _dialogueCallback = callback;
    setState(State.DIALOGUE);
    advanceDialogue();
  }

  function advanceDialogue() {
    if (_dialogueTyping) {
      // Fast-forward current text
      _dialogueTyping = false;
      if (_dialogueTimer) clearInterval(_dialogueTimer);
      const textEl = document.querySelector('.dialogue-text');
      if (textEl) textEl.textContent = _dialogueFullText;
      return;
    }

    if (_dialogueQueue.length === 0) {
      // Done with all dialogue
      hideOverlay('dialogue-box');
      if (_dialogueCallback) {
        const cb = _dialogueCallback;
        _dialogueCallback = null;
        cb();
      } else {
        // No callback — return to overworld so game doesn't get stuck
        setState(State.OVERWORLD);
      }
      return;
    }

    const msg = _dialogueQueue.shift();
    _dialogueFullText = msg.text;
    _dialogueSpeaker = msg.speaker || '';
    _dialogueCharIndex = 0;
    _dialogueTyping = true;

    const speakerEl = document.querySelector('.dialogue-speaker');
    const textEl = document.querySelector('.dialogue-text');
    const continueEl = document.querySelector('.dialogue-continue');

    if (speakerEl) speakerEl.textContent = _dialogueSpeaker;
    if (textEl) textEl.textContent = '';
    if (continueEl) continueEl.style.visibility = 'hidden';

    // Typewriter effect
    _dialogueTimer = setInterval(() => {
      if (_dialogueCharIndex >= _dialogueFullText.length) {
        _dialogueTyping = false;
        clearInterval(_dialogueTimer);
        if (continueEl) continueEl.style.visibility = 'visible';
        return;
      }
      _dialogueCharIndex++;
      if (textEl) textEl.textContent = _dialogueFullText.substring(0, _dialogueCharIndex);
      if (window.SFX && _dialogueCharIndex % 2 === 0) window.SFX.play('text');
    }, 30);
  }

  // -------------------------------------------------------------------------
  // Shop system (simplified)
  // -------------------------------------------------------------------------

  function handleShopNPC(npc) {
    if (!window.GameData || !window.GameState) return;

    const welcomeLine = (npc.dialogue && npc.dialogue.default)
      ? npc.dialogue.default[0]
      : "Welcome to my shop! Take a look around!";

    showDialogue([
      { speaker: npc.name, text: typeof welcomeLine === 'string' ? welcomeLine : welcomeLine.text || "Welcome!" },
    ], () => {
      _shopNPC = npc;
      setState(State.SHOP);
    });
  }

  function renderShopView(npc) {
    if (!window.GameData || !window.GameState) return;

    const titleEl = $('shop-title');
    const goldEl = $('shop-gold-amount');
    const listEl = $('shop-item-list');
    if (!listEl) return;

    if (titleEl) titleEl.textContent = npc ? npc.name + "'s Shop" : 'Shop';
    if (goldEl) goldEl.textContent = window.GameState.gold;

    // Determine which items to sell
    let itemIds;
    if (npc && npc.shopInventory && npc.shopInventory.length > 0) {
      itemIds = npc.shopInventory;
    } else {
      // All items with a cost
      itemIds = Object.keys(window.GameData.items).filter(id => {
        const d = window.GameData.items[id];
        return d && d.cost > 0;
      });
    }

    listEl.innerHTML = '';

    // Feedback line
    const feedback = document.createElement('div');
    feedback.className = 'shop-feedback';
    feedback.id = 'shop-feedback';
    listEl.appendChild(feedback);

    itemIds.forEach(itemId => {
      const data = window.GameData.items[itemId];
      if (!data) return;

      const row = document.createElement('div');
      row.className = 'shop-item';

      const canAfford = window.GameState.gold >= data.cost;

      row.innerHTML = `
        <div class="shop-item-info">
          <span class="shop-item-name">${data.name}</span>
          <span class="shop-item-desc">${data.description || ''}</span>
        </div>
        <span class="shop-item-cost">&#9733;${data.cost}g</span>
        <button class="shop-buy-btn" data-item="${itemId}" ${canAfford ? '' : 'disabled'}>BUY</button>
      `;

      row.querySelector('.shop-buy-btn').addEventListener('click', () => {
        buyShopItem(itemId, data);
      });

      listEl.appendChild(row);
    });
  }

  function buyShopItem(itemId, data) {
    if (!window.GameState) return;
    if (window.GameState.gold < data.cost) return;

    if (!window.GameState.spendGold(data.cost)) return;

    window.GameState.addItem(itemId, 1);
    if (window.SFX) window.SFX.play('confirm');

    // Update gold display
    const goldEl = $('shop-gold-amount');
    if (goldEl) goldEl.textContent = window.GameState.gold;

    // Show feedback
    const fb = $('shop-feedback');
    if (fb) {
      fb.textContent = `Bought ${data.name}!`;
      setTimeout(() => { if (fb) fb.textContent = ''; }, 1500);
    }

    // Re-render to update disabled state of buy buttons
    renderShopView(_shopNPC);
  }

  // -------------------------------------------------------------------------
  // Menu system
  // -------------------------------------------------------------------------

  function setupMenus() {
    // Pause menu
    const btnTeam = $('btn-team');
    const btnBag = $('btn-bag');
    const btnStats = $('btn-stats');
    const btnSave = $('btn-save');
    const btnResume = $('btn-resume');

    if (btnTeam) btnTeam.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('select');
      setState(State.TEAM_VIEW);
    });

    if (btnBag) btnBag.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('select');
      setState(State.BAG_VIEW);
    });

    if (btnStats) btnStats.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('select');
      setState(State.STATS_VIEW);
    });

    if (btnSave) btnSave.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('save');
      if (window.GameState) {
        const ok = window.GameState.save();
        showDialogue([
          { speaker: '', text: ok ? 'Game saved!' : 'Save failed...' },
        ], () => setState(State.MENU));
      }
    });

    if (btnResume) btnResume.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('menuClose');
      setState(State.OVERWORLD);
    });

    // Back buttons
    const btnTeamBack = $('btn-team-back');
    const btnBagBack = $('btn-bag-back');
    const btnStatsBack = $('btn-stats-back');

    if (btnTeamBack) btnTeamBack.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('cancel');
      setState(State.MENU);
    });
    if (btnBagBack) btnBagBack.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('cancel');
      setState(State.MENU);
    });
    if (btnStatsBack) btnStatsBack.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('cancel');
      setState(State.MENU);
    });

    // Level-up OK
    const btnLevelOk = $('btn-level-ok');
    if (btnLevelOk) btnLevelOk.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('confirm');
      advanceLevelUp();
    });

    // Shop close
    const btnShopClose = $('btn-shop-close');
    if (btnShopClose) btnShopClose.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('menuClose');
      _shopNPC = null;
      setState(State.OVERWORLD);
    });

    // Creature picker cancel
    const btnPickerCancel = $('btn-picker-cancel');
    if (btnPickerCancel) btnPickerCancel.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('cancel');
      hideOverlay('creature-picker');
    });
  }

  // -------------------------------------------------------------------------
  // Render menu views
  // -------------------------------------------------------------------------

  function drawCreatureSprite(canvas, spriteKey) {
    if (!canvas || !window.Sprites) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const creatureSprites = window.Sprites.creatures || {};
    const sprite = creatureSprites[spriteKey];
    const data = sprite ? (sprite.front || sprite) : null;

    if (!data || !Array.isArray(data)) return;

    const rows = data.length;
    const cols = data[0] ? data[0].length : 16;
    const w = canvas.width;
    const h = canvas.height;
    const scale = Math.max(1, Math.floor(Math.min(w / cols, h / rows)));
    const ox = Math.floor((w - cols * scale) / 2);
    const oy = Math.floor((h - rows * scale) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = data[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
        }
      }
    }
  }

  function renderTeamView() {
    const list = $('team-list');
    if (!list || !window.GameState) return;

    const team = window.GameState.team;
    const storage = window.GameState.player.storage || [];
    list.innerHTML = '';

    if (team.length === 0) {
      list.innerHTML = '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--text-dim);text-align:center;padding:16px">No creatures yet!</div>';
      return;
    }

    // Active team
    team.forEach((c, i) => {
      const isFainted = c.status === 'fainted' || c.hp <= 0;
      const hpPct = Math.max(0, Math.round((c.hp / c.maxHp) * 100));
      const hpColor = hpPct > 50 ? 'var(--hp-green)' : hpPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';

      const card = document.createElement('div');
      card.className = 'creature-card' + (isFainted ? ' team-fainted' : '');

      // Sprite canvas
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 48;
      spriteCanvas.height = 48;
      spriteCanvas.className = 'creature-card-sprite';
      card.appendChild(spriteCanvas);

      // Info block
      const info = document.createElement('div');
      info.className = 'creature-card-info';
      const typeColor = `var(--type-${c.type}, var(--text-dim))`;

      const moveNames = c.moves.map(m => {
        const move = window.GameData && window.GameData.moves[m];
        return move ? move.name : m;
      }).join(', ');

      const xpPct = c.xpToNext > 0 ? Math.min(100, Math.round((c.xp / c.xpToNext) * 100)) : 100;

      info.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <span class="creature-card-name">${c.name}</span>
          <span class="creature-card-level">Lv.${c.level}</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:${typeColor}">${c.type}</span>
          ${isFainted ? '<span style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:var(--hp-red)">FAINTED</span>' : ''}
        </div>
        <div class="hp-bar-container">
          <div class="hp-label">HP</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
          <div class="hp-text">${c.hp}/${c.maxHp}</div>
        </div>
        <div class="xp-bar-container">
          <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--text-dim);line-height:1.8">
          ATK:${c.attack} DEF:${c.defense} SPD:${c.speed}
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--text-secondary);line-height:1.8">${moveNames}</div>
      `;
      card.appendChild(info);

      // Swap up/down buttons
      const swapDiv = document.createElement('div');
      swapDiv.className = 'team-swap-btns';

      const upBtn = document.createElement('button');
      upBtn.className = 'team-swap-btn';
      upBtn.textContent = '↑';
      upBtn.disabled = i === 0;
      upBtn.title = 'Move up';
      upBtn.addEventListener('click', () => {
        if (window.SFX) window.SFX.play('select');
        window.GameState.swapTeamOrder(i, i - 1);
        renderTeamView();
      });

      const downBtn = document.createElement('button');
      downBtn.className = 'team-swap-btn';
      downBtn.textContent = '↓';
      downBtn.disabled = i === team.length - 1;
      downBtn.title = 'Move down';
      downBtn.addEventListener('click', () => {
        if (window.SFX) window.SFX.play('select');
        window.GameState.swapTeamOrder(i, i + 1);
        renderTeamView();
      });

      swapDiv.appendChild(upBtn);
      swapDiv.appendChild(downBtn);
      card.appendChild(swapDiv);

      list.appendChild(card);

      // Draw sprite after card is in DOM
      requestAnimationFrame(() => drawCreatureSprite(spriteCanvas, c.spriteKey || c.speciesId));
    });

    // Storage section (if any)
    if (storage.length > 0) {
      const storageTitle = document.createElement('div');
      storageTitle.className = 'team-section-title';
      storageTitle.textContent = `Storage (${storage.length})`;
      list.appendChild(storageTitle);

      storage.forEach((c, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;background:var(--bg-panel-light);padding:8px 12px;box-shadow:inset -2px -2px 0 var(--border-dark),inset 2px 2px 0 var(--border-light)';

        const mini = document.createElement('canvas');
        mini.width = 32;
        mini.height = 32;
        mini.style.cssText = 'image-rendering:pixelated;background:var(--bg-dark);border:2px solid var(--border-mid);flex-shrink:0';
        row.appendChild(mini);

        const label = document.createElement('div');
        label.style.cssText = 'flex:1;font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--text-secondary)';
        label.textContent = `${c.name}  Lv.${c.level}`;
        row.appendChild(label);

        // Swap-with-team button (only if team has room)
        if (team.length < 4) {
          const addBtn = document.createElement('button');
          addBtn.style.cssText = 'font-family:\'Press Start 2P\',monospace;font-size:7px;background:var(--accent);color:#fff;border:none;padding:6px 8px;cursor:pointer;box-shadow:inset -2px -2px 0 #a12040,inset 2px 2px 0 #ff6b82';
          addBtn.textContent = 'ADD';
          addBtn.addEventListener('click', () => {
            if (window.SFX) window.SFX.play('confirm');
            const stored = window.GameState.player.storage.splice(idx, 1)[0];
            window.GameState.addToTeam(stored);
            renderTeamView();
          });
          row.appendChild(addBtn);
        }

        list.appendChild(row);
        requestAnimationFrame(() => drawCreatureSprite(mini, c.spriteKey || c.speciesId));
      });
    }
  }

  function renderBagView() {
    const list = $('bag-list');
    const goldEl = $('gold-amount');
    if (!list || !window.GameState) return;

    const inv = window.GameState.inventory;
    if (goldEl) goldEl.textContent = window.GameState.gold;

    list.innerHTML = '';

    const itemIds = Object.keys(inv).filter(id => inv[id] > 0);

    if (itemIds.length === 0) {
      list.innerHTML = '<div class="bag-empty">Your bag is empty!</div>';
      return;
    }

    itemIds.forEach(itemId => {
      const data = window.GameData && window.GameData.items[itemId];
      const name = data ? data.name : itemId;
      const desc = data ? data.description || '' : '';
      const canUse = data && data.usableOutside;

      const row = document.createElement('div');
      row.className = 'bag-item';

      const info = document.createElement('div');
      info.className = 'bag-item-info';
      info.innerHTML = `
        <span class="item-name">${name} <span class="item-count" style="color:var(--text-dim)">x${inv[itemId]}</span></span>
        <span class="item-desc" style="font-size:7px;color:var(--text-dim)">${desc}</span>
      `;
      row.appendChild(info);

      if (canUse) {
        const useBtn = document.createElement('button');
        useBtn.className = 'item-use-btn';
        useBtn.textContent = 'USE';
        useBtn.addEventListener('click', () => {
          openCreaturePicker(itemId);
        });
        row.appendChild(useBtn);
      }

      list.appendChild(row);
    });
  }

  function openCreaturePicker(itemId) {
    if (!window.GameState || !window.GameData) return;
    const data = window.GameData.items[itemId];
    if (!data) return;

    _pickerItemId = itemId;

    const titleEl = $('creature-picker-title');
    if (titleEl) titleEl.textContent = 'Use ' + data.name + ' on...';

    const listEl = $('creature-picker-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const team = window.GameState.team;
    if (!team || team.length === 0) {
      listEl.innerHTML = '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--text-dim);text-align:center">No creatures in your team!</div>';
    } else {
      team.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'picker-creature-btn';

        // Determine if this creature is a valid target
        let disabled = false;
        const effectType = data.effect ? data.effect.type : null;
        if (effectType === 'heal' || effectType === 'statBoost') {
          // Can't use heal on fainted creature; can't use statBoost on fainted
          if (c.status === 'fainted' || c.hp <= 0) disabled = true;
          // Can't use heal if already at full HP
          if ((effectType === 'heal') && c.hp >= c.maxHp) disabled = true;
        } else if (effectType === 'revive') {
          // Revive only works on fainted creatures
          if (c.status !== 'fainted' && c.hp > 0) disabled = true;
        }

        btn.disabled = disabled;

        const hpPct = Math.round((c.hp / c.maxHp) * 100);
        const statusText = (c.status === 'fainted' || c.hp <= 0) ? 'FAINTED' : `${c.hp}/${c.maxHp} HP`;

        btn.innerHTML = `
          <div style="flex:1">
            <div class="picker-creature-name">${c.name} <span style="color:var(--text-dim);font-size:7px">Lv.${c.level}</span></div>
            <div class="${(c.status === 'fainted' || c.hp <= 0) ? 'picker-creature-status' : 'picker-creature-hp'}">${statusText}</div>
          </div>
          <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--type-${c.type})">${c.type}</div>
        `;

        btn.addEventListener('click', () => {
          useItemOnCreature(itemId, idx);
        });

        listEl.appendChild(btn);
      });
    }

    showOverlay('creature-picker');
  }

  function useItemOnCreature(itemId, creatureIdx) {
    if (!window.GameState || !window.GameData) return;
    const data = window.GameData.items[itemId];
    const creature = window.GameState.team[creatureIdx];
    if (!data || !creature) return;

    const eff = data.effect;
    if (!eff) return;

    let message = '';

    if (eff.type === 'heal') {
      const healed = Math.min(eff.amount, creature.maxHp - creature.hp);
      creature.hp = Math.min(creature.maxHp, creature.hp + eff.amount);
      message = `${creature.name} recovered ${healed} HP!`;
      if (window.SFX) window.SFX.play('healSound');
    } else if (eff.type === 'revive') {
      creature.hp = Math.floor(creature.maxHp * (eff.hpPercent || 0.5));
      creature.status = 'ok';
      message = `${creature.name} was revived!`;
      if (window.SFX) window.SFX.play('healSound');
    } else if (eff.type === 'statBoost') {
      const stats = ['attack', 'defense', 'speed'];
      const stat = stats[Math.floor(Math.random() * stats.length)];
      creature[stat] = (creature[stat] || 0) + eff.amount;
      message = `${creature.name}'s ${stat} rose by ${eff.amount}!`;
      if (window.SFX) window.SFX.play('confirm');
    }

    window.GameState.removeItem(itemId, 1);
    hideOverlay('creature-picker');

    // Show feedback via dialogue and return to bag
    showDialogue([{ speaker: '', text: message }], () => {
      setState(State.BAG_VIEW);
    });
  }

  function renderStatsView() {
    const content = $('stats-content');
    if (!content) return;

    const mathStats = window.MathEngine ? window.MathEngine.getStats() : {};
    const gs = window.GameState;
    const totalProblems = gs ? gs.player.totalProblems : 0;
    const accuracy = gs ? Math.round(gs.getMathAccuracy() * 100) : 0;
    const playTime = gs ? gs.getPlayTime() : '0:00:00';
    const badges = gs ? gs.badges : [];
    const creaturesTotal = gs ? gs.team.length + (gs.player.storage ? gs.player.storage.length : 0) : 0;

    const mastery = mathStats.masteryByType || {};

    // Mastery bars HTML
    const masteryHtml = Object.keys(mastery).length > 0
      ? `<div class="stat-section-title">Mastery by Type</div>
         ${Object.keys(mastery).map(type => {
           const m = mastery[type];
           const pct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0;
           const barColor = type === 'multiplication' ? 'var(--type-grass)'
             : type === 'division' ? 'var(--type-electric)'
             : type === 'addition' ? 'var(--type-fire)'
             : 'var(--type-water)';
           return `
             <div class="stat-row">
               <div style="display:flex;align-items:center;gap:8px">
                 <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--text-secondary);min-width:90px">${type}:</span>
                 <div style="flex:1;height:10px;background:var(--border-dark);box-shadow:inset 2px 2px 0 rgba(0,0,0,0.3),0 0 0 2px var(--border-mid);min-width:80px">
                   <div style="height:100%;width:${pct}%;background:${barColor};transition:width 0.5s"></div>
                 </div>
                 <span class="stat-value">${pct}%</span>
               </div>
             </div>
           `;
         }).join('')}`
      : '';

    // Badges HTML
    const badgesHtml = badges.length > 0
      ? `<div class="badge-list">${badges.map(b => `<span class="badge-chip">&#127942; ${b}</span>`).join('')}</div>`
      : `<div class="badge-empty">No badges yet. Defeat area bosses!</div>`;

    content.innerHTML = `
      <div class="stat-row">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-secondary)">Math Level</span>
          <span class="stat-value">${mathStats.level || 1}</span>
        </div>
      </div>
      <div class="stat-row">
        <div style="display:flex;justify-content:space-between">
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-secondary)">Problems Solved</span>
          <span class="stat-value">${totalProblems}</span>
        </div>
      </div>
      <div class="stat-row">
        <div style="display:flex;justify-content:space-between">
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-secondary)">Accuracy</span>
          <span class="stat-value" style="color:${accuracy >= 80 ? 'var(--hp-green)' : accuracy >= 60 ? 'var(--hp-yellow)' : 'var(--hp-red)'}">${accuracy}%</span>
        </div>
      </div>
      <div class="stat-row">
        <div style="display:flex;justify-content:space-between">
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-secondary)">Best Streak</span>
          <span class="stat-value">${mathStats.bestStreak || 0}</span>
        </div>
      </div>
      <div class="stat-row">
        <div style="display:flex;justify-content:space-between">
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-secondary)">Creatures</span>
          <span class="stat-value">${creaturesTotal}</span>
        </div>
      </div>
      <div class="stat-row">
        <div style="display:flex;justify-content:space-between">
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-secondary)">Play Time</span>
          <span class="stat-value">${playTime}</span>
        </div>
      </div>
      <div class="stat-section-title">Badges (${badges.length})</div>
      ${badgesHtml}
      ${masteryHtml}
    `;
  }

  // -------------------------------------------------------------------------
  // Global input handling
  // -------------------------------------------------------------------------

  function setupInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      // Init audio on first input
      if (window.SFX && !window.SFX._initialized) {
        window.SFX.init();
        window.SFX._initialized = true;
      }

      // Global: advance level-up overlay with Enter/Space/Z
      const levelUpEl = $('level-up');
      if (levelUpEl && !levelUpEl.hidden) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
          e.preventDefault();
          if (window.SFX) window.SFX.play('confirm');
          advanceLevelUp();
          return;
        }
      }

      switch (_currentState) {
        case State.DIALOGUE:
          if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') {
            e.preventDefault();
            advanceDialogue();
          }
          break;

        case State.MENU:
          if (e.key === 'Escape') {
            e.preventDefault();
            if (window.SFX) window.SFX.play('menuClose');
            setState(State.OVERWORLD);
          }
          break;

        case State.TEAM_VIEW:
        case State.BAG_VIEW:
        case State.STATS_VIEW:
          if (e.key === 'Escape') {
            e.preventDefault();
            if (window.SFX) window.SFX.play('cancel');
            // Close creature picker if open
            const picker = $('creature-picker');
            if (picker && !picker.hidden) {
              hideOverlay('creature-picker');
            } else {
              setState(State.MENU);
            }
          }
          break;

        case State.SHOP:
          if (e.key === 'Escape') {
            e.preventDefault();
            if (window.SFX) window.SFX.play('menuClose');
            _shopNPC = null;
            setState(State.OVERWORLD);
          }
          break;

        case State.BATTLE:
          if (window.Battle && window.Battle.isActive()) {
            window.Battle.handleKey(e.key);
          }
          break;

        case State.OVERWORLD:
          if (e.key === 'Escape' || e.key === 'p') {
            e.preventDefault();
            if (window.SFX) window.SFX.play('menuOpen');
            setState(State.MENU);
          }
          break;
      }
    });

    // Mouse/touch for battle
    if (_canvas) {
      _canvas.addEventListener('click', (e) => {
        // Init audio on first input
        if (window.SFX && !window.SFX._initialized) {
          window.SFX.init();
          window.SFX._initialized = true;
        }

        if (_currentState === State.BATTLE && window.Battle && window.Battle.isActive()) {
          const rect = _canvas.getBoundingClientRect();
          const scaleX = _canvas.width / rect.width;
          const scaleY = _canvas.height / rect.height;
          const x = (e.clientX - rect.left) * scaleX;
          const y = (e.clientY - rect.top) * scaleY;
          window.Battle.handleClick(x, y);
        }
      });
    }

    // Dialogue box click
    const dialogueBox = $('dialogue-box');
    if (dialogueBox) {
      dialogueBox.addEventListener('click', () => {
        if (_currentState === State.DIALOGUE) {
          advanceDialogue();
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Overworld HUD
  // -------------------------------------------------------------------------

  function updateOverworldHUD() {
    const areaEl = $('hud-area-name');
    const goldEl = $('hud-gold');
    if (!areaEl || !goldEl) return;

    const mapId = window.GameState ? window.GameState.currentMap : '';
    areaEl.textContent = MAP_NAMES[mapId] || mapId || '';
    goldEl.textContent = window.GameState ? window.GameState.gold : '0';
  }

  // -------------------------------------------------------------------------
  // Loading & initialization
  // -------------------------------------------------------------------------

  function checkSystemsReady() {
    const systems = [
      'MathEngine',
      'Sprites',
      'GameData',
      'SFX',
      'GameState',
      'Overworld',
      'Battle',
    ];

    const ready = systems.filter(s => !!window[s]);
    const total = systems.length;

    // Update loading bar
    const fill = document.querySelector('.loading-fill');
    if (fill) {
      fill.style.width = Math.round((ready.length / total) * 100) + '%';
    }

    return ready.length === total;
  }

  function initialize() {
    if (_initialized) return;

    setupCanvas();
    setupTitleScreen();
    setupStarterSelect();
    setupMenus();
    setupInput();
    setupOverworldEvents();

    // Kick off PNG sprite sheet preloading (backgrounds, non-blocking)
    if (window.SpriteSheetData) {
      window.SpriteSheetData.preloadAll();
    }

    // Initialize MathEngine
    if (window.MathEngine) {
      window.MathEngine.init(null);
    }

    _initialized = true;

    // Hide loading, show title
    hideOverlay('loading-screen');
    setState(State.TITLE);
  }

  // Wait for DOM and all scripts
  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
      return;
    }

    // Pick a random loading tip
    const tipEl = $('loading-tip');
    if (tipEl) {
      tipEl.textContent = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
    }

    // Rotate tips every 2 seconds while loading
    let tipInterval = setInterval(() => {
      const el = $('loading-tip');
      if (el) el.textContent = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
    }, 2000);

    // Poll for systems to be ready (scripts may load async)
    const startTime = Date.now();
    const maxWait = 10000; // 10 seconds max

    function poll() {
      if (checkSystemsReady()) {
        clearInterval(tipInterval);
        initialize();
      } else if (Date.now() - startTime < maxWait) {
        setTimeout(poll, 100);
      } else {
        // Start anyway with what we have
        clearInterval(tipInterval);
        console.warn('Not all systems loaded, starting with available systems');
        initialize();
      }
    }

    poll();
  }

  // Auto-boot
  boot();

  // Export for debugging
  window.Game = {
    getState: () => _currentState,
    setState,
    State,
  };
})();
