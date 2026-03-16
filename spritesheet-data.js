/**
 * Sprite Sheet Data - MathQuest
 *
 * PNG sprite sheet metadata for image-based creature sprites.
 *
 * Sheet 1 (sheet1.png) — 2976x1438, 4 creature rows × 7 columns
 *   Row 0: VOLCAN    (Fire dragon)   → flametail
 *   Row 1: VOLT-HOP  (Electric)      → sparkling
 *   Row 2: AQUADON   (Water)         → aquapup
 *   Row 3: GLACIRA   (Ice deer)      → glacira (future)
 *
 * Sheet 2 (sheet2.png) — 2976x1438, 3 creature rows × 7 columns
 *   Row 0: PHOENIZEL (Fire phoenix)  → blazefang
 *   Row 1: VOLTMONK  (Electric)      → voltpounce
 *   Row 2: LEAFBARA  (Grass capybara)→ leafbara
 *
 * Frame columns (left to right):
 *   0: FRONT idle 1
 *   1: FRONT idle 2 (alt pose / back)
 *   2: BACK
 *   3: RUN frame 1
 *   4: RUN frame 2
 *   5: ATTACK
 *   6: FAINT
 */
(function () {
  'use strict';

  var SHEET_W   = 2976;
  var SHEET_H   = 1438;
  var FRAME_W   = Math.round(SHEET_W / 7);   // ~425px per column

  var ROW_H_4   = Math.round(SHEET_H / 4);   // ~360px  — sheet1 (4 rows)
  var ROW_H_3   = Math.round(SHEET_H / 3);   // ~479px  — sheet2 (3 rows)

  function frame(col, row, rowH) {
    return { sx: col * FRAME_W, sy: row * rowH, sw: FRAME_W, sh: rowH };
  }

  function buildCreature(row, rowH) {
    return {
      idle:   frame(0, row, rowH),
      idle2:  frame(1, row, rowH),
      back:   frame(2, row, rowH),
      run:   [frame(3, row, rowH), frame(4, row, rowH)],
      attack: frame(5, row, rowH),
      faint:  frame(6, row, rowH),
    };
  }

  // ---------------------------------------------------------------------------
  // Sheet definitions
  // ---------------------------------------------------------------------------
  var sheet1 = {
    src: 'sprites/sheet1.png',
    creatures: {
      // Starters & wilds
      flametail:  buildCreature(0, ROW_H_4),   // VOLCAN
      sparkling:  buildCreature(1, ROW_H_4),   // VOLT-HOP
      aquapup:    buildCreature(2, ROW_H_4),   // AQUADON
      glacira:    buildCreature(3, ROW_H_4),   // GLACIRA (ice deer)
    },
  };

  var sheet2 = {
    src: 'sprites/sheet2.png',
    creatures: {
      blazefang:  buildCreature(0, ROW_H_3),   // PHOENIZEL (flametail evolution)
      voltpounce: buildCreature(1, ROW_H_3),   // VOLTMONK  (sparkling evolution)
      leafbara:   buildCreature(2, ROW_H_3),   // LEAFBARA  (grass starter)
    },
  };

  // ---------------------------------------------------------------------------
  // Image preloading
  // ---------------------------------------------------------------------------
  var _images = {};
  var _loadPromises = [];

  function preloadSheet(sheetDef) {
    if (_images[sheetDef.src]) return;
    var img = new Image();
    img.src = sheetDef.src;
    _images[sheetDef.src] = img;
    _loadPromises.push(new Promise(function (resolve) {
      img.onload = resolve;
      img.onerror = resolve;
    }));
  }

  function preloadAll() {
    preloadSheet(sheet1);
    preloadSheet(sheet2);
    return Promise.all(_loadPromises);
  }

  // ---------------------------------------------------------------------------
  // Flat lookup: spriteId → { sheetSrc, frames }
  // ---------------------------------------------------------------------------
  var _lookup = {};
  [sheet1, sheet2].forEach(function (sheet) {
    Object.keys(sheet.creatures).forEach(function (id) {
      _lookup[id] = { sheetSrc: sheet.src, frames: sheet.creatures[id] };
    });
  });

  function getSpriteSheetData(spriteId) {
    return _lookup[spriteId] || null;
  }

  function getImage(src) {
    return _images[src] || null;
  }

  window.SpriteSheetData = {
    preloadAll: preloadAll,
    getSpriteSheetData: getSpriteSheetData,
    getImage: getImage,
    FRAME_W: FRAME_W,
    ROW_H_4: ROW_H_4,
    ROW_H_3: ROW_H_3,
  };

}());
