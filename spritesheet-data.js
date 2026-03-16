/**
 * Sprite Sheet Data - MathQuest
 *
 * Defines PNG sprite sheet metadata for image-based creature sprites.
 * Each sheet is 2976x1438 with 3 creature rows (~479px each) and
 * 7 animation columns (~425px each).
 *
 * Frame layout per creature row (left to right):
 *   0: FRONT idle 1
 *   1: FRONT idle 2 (alt pose)
 *   2: BACK
 *   3: RUN frame 1
 *   4: RUN frame 2
 *   5: ATTACK
 *   6: FAINT
 */
(function () {
  'use strict';

  // Sheet dimensions
  var SHEET_W = 2976;
  var SHEET_H = 1438;
  var FRAME_W = Math.round(SHEET_W / 7);   // ~425px
  var ROW_H   = Math.round(SHEET_H / 3);   // ~479px

  // Animation frame indices
  var F = {
    IDLE:    0,
    IDLE2:   1,
    BACK:    2,
    RUN1:    3,
    RUN2:    4,
    ATTACK:  5,
    FAINT:   6,
  };

  /**
   * Build a frame descriptor: { sx, sy, sw, sh }
   * col = 0-6 (animation frame index)
   * row = 0-2 (creature row in sheet)
   */
  function frame(col, row) {
    return {
      sx: col * FRAME_W,
      sy: row * ROW_H,
      sw: FRAME_W,
      sh: ROW_H,
    };
  }

  // ---------------------------------------------------------------------------
  // Sheet 1: sheet1.png
  //   Row 0 - VOLCAN      (Fire dragon)
  //   Row 1 - VOLT-HOP    (Electric rabbit)
  //   Row 2 - AQUADON     (Water whale)  / GLACIRA (Ice deer)
  // ---------------------------------------------------------------------------
  var sheet1 = {
    src: 'sprites/sheet1.png',
    creatures: {
      volcan: {
        idle:   frame(F.IDLE,   0),
        idle2:  frame(F.IDLE2,  0),
        back:   frame(F.BACK,   0),
        run:   [frame(F.RUN1,   0), frame(F.RUN2, 0)],
        attack: frame(F.ATTACK, 0),
        faint:  frame(F.FAINT,  0),
      },
      volthop: {
        idle:   frame(F.IDLE,   1),
        idle2:  frame(F.IDLE2,  1),
        back:   frame(F.BACK,   1),
        run:   [frame(F.RUN1,   1), frame(F.RUN2, 1)],
        attack: frame(F.ATTACK, 1),
        faint:  frame(F.FAINT,  1),
      },
      aquadon: {
        idle:   frame(F.IDLE,   2),
        idle2:  frame(F.IDLE2,  2),
        back:   frame(F.BACK,   2),
        run:   [frame(F.RUN1,   2), frame(F.RUN2, 2)],
        attack: frame(F.ATTACK, 2),
        faint:  frame(F.FAINT,  2),
      },
    },
  };

  // ---------------------------------------------------------------------------
  // Sheet 2: sheet2.png
  //   Row 0 - PHOENIZEL   (Fire phoenix)
  //   Row 1 - VOLTMONK    (Electric monkey)
  //   Row 2 - LEAFBARA    (Grass capybara) ← the green starter
  // ---------------------------------------------------------------------------
  var sheet2 = {
    src: 'sprites/sheet2.png',
    creatures: {
      phoenizel: {
        idle:   frame(F.IDLE,   0),
        idle2:  frame(F.IDLE2,  0),
        back:   frame(F.BACK,   0),
        run:   [frame(F.RUN1,   0), frame(F.RUN2, 0)],
        attack: frame(F.ATTACK, 0),
        faint:  frame(F.FAINT,  0),
      },
      voltmonk: {
        idle:   frame(F.IDLE,   1),
        idle2:  frame(F.IDLE2,  1),
        back:   frame(F.BACK,   1),
        run:   [frame(F.RUN1,   1), frame(F.RUN2, 1)],
        attack: frame(F.ATTACK, 1),
        faint:  frame(F.FAINT,  1),
      },
      leafbara: {
        idle:   frame(F.IDLE,   2),
        idle2:  frame(F.IDLE2,  2),
        back:   frame(F.BACK,   2),
        run:   [frame(F.RUN1,   2), frame(F.RUN2, 2)],
        attack: frame(F.ATTACK, 2),
        faint:  frame(F.FAINT,  2),
      },
    },
  };

  // ---------------------------------------------------------------------------
  // Preloaded image cache
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
      img.onerror = resolve; // don't block on error
    }));
  }

  function preloadAll() {
    preloadSheet(sheet1);
    preloadSheet(sheet2);
    return Promise.all(_loadPromises);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  // Flat lookup: spriteId → { sheetSrc, frames }
  var _lookup = {};
  [sheet1, sheet2].forEach(function (sheet) {
    Object.keys(sheet.creatures).forEach(function (id) {
      _lookup[id] = {
        sheetSrc: sheet.src,
        frames: sheet.creatures[id],
      };
    });
  });

  /**
   * Returns sprite sheet frame data for a given spriteId, or null if not found.
   * @param {string} spriteId
   * @returns {{ sheetSrc: string, frames: object }|null}
   */
  function getSpriteSheetData(spriteId) {
    return _lookup[spriteId] || null;
  }

  /**
   * Returns a preloaded HTMLImageElement for a sheet src, or null.
   * @param {string} src
   * @returns {HTMLImageElement|null}
   */
  function getImage(src) {
    return _images[src] || null;
  }

  // Export
  window.SpriteSheetData = {
    preloadAll: preloadAll,
    getSpriteSheetData: getSpriteSheetData,
    getImage: getImage,
    FRAME_W: FRAME_W,
    ROW_H: ROW_H,
  };

}());
