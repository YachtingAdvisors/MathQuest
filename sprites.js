// ============================================================================
// MathQuest Sprite System - Pokemon FireRed Style Pixel Art
// Each sprite is a 2D array of hex color strings (null = transparent)
// Each "pixel" renders as SCALE x SCALE actual screen pixels
// ============================================================================

(function () {
  "use strict";

  const SCALE = 4;
  const _ = null; // transparent shorthand

  // -------------------------------------------------------------------------
  // COLOR PALETTE - Centralized for consistency
  // -------------------------------------------------------------------------
  const C = {
    // Skin / general
    skin: "#FFDCB0", skinShade: "#E8B888", skinHi: "#FFF0D8",
    outline: "#282828", outlineLight: "#484848",
    white: "#FFFFFF", black: "#000000",
    // Fire
    fOrange: "#F08030", fRed: "#E04028", fYellow: "#F8D048", fCream: "#FFF0C8",
    // Water
    wBlue: "#3890F8", wLight: "#78C8F8", wWhite: "#E0F0FF", wDark: "#2060A8",
    // Grass
    gGreen: "#48B848", gLime: "#88D840", gDark: "#287828", gBrown: "#886830",
    // Electric
    eYellow: "#F8D030", eGold: "#C8A008", eBrown: "#A07820", ePale: "#FFF8B8",
    // Rock
    rGray: "#A0A0A0", rBrown: "#887060", rDark: "#585858", rLight: "#C8C0B8",
    // Ghost
    pPurple: "#9060C8", pLav: "#C8A0F0", pWhite: "#E8D8F8", pDark: "#583888",
    // Flying
    fBlue: "#5090D0", fWhite: "#E8F0F8", fGold: "#D8B030",
    // Math (Numbit)
    mPink: "#F890A8", mWhite: "#FFF0F0", mGold: "#F0C830",
    // Tiles
    tGrassA: "#58A840", tGrassB: "#68B848", tGrassC: "#489038",
    tDirt: "#C8A868", tDirtDark: "#A88848", tDirtLight: "#D8C088",
    tWater: "#3888D8", tWaterLight: "#60A8F0", tWaterDark: "#2868A0",
    tWood: "#A07840", tWoodDark: "#785828", tWoodLight: "#C09860",
    tStone: "#989898", tStoneDark: "#707070", tStoneLight: "#B8B8B8",
    tRoof: "#C83830", tRoofDark: "#A02820", tWall: "#E8D8C0", tWallDark: "#C8B8A0",
    tFlower1: "#F04080", tFlower2: "#F0D040", tFlower3: "#8060D0",
    // UI
    hpGreen: "#40C840", hpYellow: "#F0C030", hpRed: "#E04040",
    uiDark: "#383838", uiMid: "#686868", uiLight: "#D0D0D0",
    orbRed: "#E04848", orbWhite: "#F0F0F0", orbBlack: "#282828",
    potionPurple: "#A048D0", potionBlue: "#4088E0",
  };

  // -------------------------------------------------------------------------
  // HELPER: Draw a sprite from a 2D color array
  // -------------------------------------------------------------------------
  function drawSprite(ctx, spriteData, x, y, scale) {
    const s = scale || SCALE;
    for (let row = 0; row < spriteData.length; row++) {
      for (let col = 0; col < spriteData[row].length; col++) {
        const color = spriteData[row][col];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * s, y + row * s, s, s);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // HELPER: Flip sprite horizontally (for left/right mirroring)
  // -------------------------------------------------------------------------
  function flipH(sprite) {
    return sprite.map(function (row) { return row.slice().reverse(); });
  }

  // -------------------------------------------------------------------------
  // SECTION 1: PLAYER CHARACTER (16x16, young wizard kid)
  // -------------------------------------------------------------------------
  const O = C.outline, S = C.skin, Sd = C.skinShade, Sh = C.skinHi;
  const hat = "#6040C0", hatL = "#7858D8", cape = "#5038A0";
  const shirt = "#E84040", shirtD = "#C03030";
  const pants = "#4070D0", pantsD = "#3058A8";
  const hair = "#804020", hairD = "#603010";
  const boot = "#483018";

  const playerDown = [
    [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_],
    [_,_,_,_,O,hat,hat,hatL,hatL,hat,hat,O,_,_,_,_],
    [_,_,_,O,hat,hat,hatL,hatL,hatL,hatL,hat,O,_,_,_,_],
    [_,_,_,O,hat,hatL,"#F8D030","#F8D030","#F8D030",hatL,hat,O,_,_,_,_],
    [_,_,_,O,O,O,O,O,O,O,O,O,_,_,_,_],
    [_,_,O,hair,hair,O,S,S,S,O,hair,hair,O,_,_,_],
    [_,_,O,hair,O,S,S,S,S,S,O,hair,O,_,_,_],
    [_,_,O,O,S,S,"#282828",S,S,"#282828",S,O,O,_,_,_],
    [_,_,_,O,S,S,S,S,S,S,S,S,O,_,_,_],
    [_,_,_,O,S,Sd,"#E06060",Sd,Sd,"#E06060",Sd,S,O,_,_,_],
    [_,_,_,_,O,S,S,Sd,Sd,S,S,O,_,_,_,_],
    [_,_,_,O,O,shirt,shirt,shirt,shirt,shirt,shirt,O,O,_,_,_],
    [_,_,O,cape,O,shirt,shirtD,shirt,shirt,shirtD,shirt,O,cape,O,_,_],
    [_,_,O,cape,O,O,pants,pants,pants,pants,O,O,cape,O,_,_],
    [_,_,_,O,_,O,pants,pantsD,pantsD,pants,O,_,O,_,_,_],
    [_,_,_,_,_,O,boot,boot,boot,boot,O,_,_,_,_,_],
  ];

  const playerUp = [
    [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_],
    [_,_,_,_,O,hat,hat,hatL,hatL,hat,hat,O,_,_,_,_],
    [_,_,_,O,hat,hat,hatL,hatL,hatL,hatL,hat,O,_,_,_,_],
    [_,_,_,O,hat,hat,hat,hat,hat,hat,hat,O,_,_,_,_],
    [_,_,_,O,O,O,O,O,O,O,O,O,_,_,_,_],
    [_,_,O,hair,hair,hair,hair,hair,hair,hair,hair,hair,O,_,_,_],
    [_,_,O,hair,hair,hair,hair,hair,hair,hair,hair,hair,O,_,_,_],
    [_,_,O,O,hair,hair,hair,hair,hair,hair,hair,O,O,_,_,_],
    [_,_,_,O,S,hair,hair,hair,hair,hair,S,O,_,_,_,_],
    [_,_,_,O,S,S,S,S,S,S,S,S,O,_,_,_],
    [_,_,_,_,O,S,S,S,S,S,S,O,_,_,_,_],
    [_,_,_,O,O,shirt,shirt,shirt,shirt,shirt,shirt,O,O,_,_,_],
    [_,_,O,cape,O,shirt,shirtD,shirt,shirt,shirtD,shirt,O,cape,O,_,_],
    [_,_,O,cape,O,O,pants,pants,pants,pants,O,O,cape,O,_,_],
    [_,_,_,O,_,O,pants,pantsD,pantsD,pants,O,_,O,_,_,_],
    [_,_,_,_,_,O,boot,boot,boot,boot,O,_,_,_,_,_],
  ];

  const playerRight = [
    [_,_,_,_,_,O,O,O,O,O,_,_,_,_,_,_],
    [_,_,_,_,O,hat,hatL,hatL,hat,hat,O,_,_,_,_,_],
    [_,_,_,O,hat,hatL,hatL,hatL,hat,hat,O,_,_,_,_,_],
    [_,_,_,O,hat,hatL,"#F8D030",hatL,hat,hat,O,_,_,_,_,_],
    [_,_,_,O,O,O,O,O,O,O,O,_,_,_,_,_],
    [_,_,_,O,hair,hair,S,S,S,O,_,_,_,_,_,_],
    [_,_,_,O,hair,S,S,S,S,S,O,_,_,_,_,_],
    [_,_,_,O,S,S,S,"#282828",S,S,O,_,_,_,_,_],
    [_,_,_,O,S,S,S,S,S,S,O,_,_,_,_,_],
    [_,_,_,O,S,S,Sd,"#E06060",Sd,O,_,_,_,_,_,_],
    [_,_,_,_,O,S,S,Sd,S,O,_,_,_,_,_,_],
    [_,_,_,O,shirt,shirt,shirt,shirt,shirt,O,_,_,_,_,_,_],
    [_,_,O,cape,O,shirt,shirtD,shirt,shirt,O,S,O,_,_,_,_],
    [_,_,O,cape,O,O,pants,pants,pants,O,O,_,_,_,_,_],
    [_,_,_,O,_,_,O,pants,pantsD,O,_,_,_,_,_,_],
    [_,_,_,_,_,_,O,boot,boot,O,_,_,_,_,_,_],
  ];

  const playerLeft = flipH(playerRight);

  // Walk frames - slight leg offset
  const playerWalkDown1 = playerDown.map(function (r, i) {
    if (i === 14) return [_,_,_,O,_,_,O,pants,pantsD,pants,O,_,_,O,_,_];
    if (i === 15) return [_,_,_,_,_,O,boot,boot,_,boot,boot,O,_,_,_,_];
    return r;
  });
  const playerWalkDown2 = playerDown.map(function (r, i) {
    if (i === 14) return [_,_,O,_,_,O,pantsD,pants,pants,pantsD,O,_,_,O,_,_];
    if (i === 15) return [_,_,_,_,O,boot,boot,_,_,boot,boot,O,_,_,_,_];
    return r;
  });
  const playerWalkUp1 = playerUp.map(function (r, i) {
    if (i === 14) return [_,_,_,O,_,_,O,pants,pantsD,pants,O,_,_,O,_,_];
    if (i === 15) return [_,_,_,_,_,O,boot,boot,_,boot,boot,O,_,_,_,_];
    return r;
  });
  const playerWalkUp2 = playerUp.map(function (r, i) {
    if (i === 14) return [_,_,O,_,_,O,pantsD,pants,pants,pantsD,O,_,_,O,_,_];
    if (i === 15) return [_,_,_,_,O,boot,boot,_,_,boot,boot,O,_,_,_,_];
    return r;
  });
  const playerWalkRight1 = playerRight.map(function (r, i) {
    if (i === 14) return [_,_,_,_,_,_,O,pants,_,pantsD,O,_,_,_,_,_];
    if (i === 15) return [_,_,_,_,_,O,boot,_,_,boot,boot,O,_,_,_,_];
    return r;
  });
  const playerWalkRight2 = playerRight.map(function (r, i) {
    if (i === 14) return [_,_,_,_,_,O,pantsD,_,pants,O,_,_,_,_,_,_];
    if (i === 15) return [_,_,_,_,O,boot,boot,_,_,boot,O,_,_,_,_,_];
    return r;
  });
  const playerWalkLeft1 = flipH(playerWalkRight1);
  const playerWalkLeft2 = flipH(playerWalkRight2);

  // -------------------------------------------------------------------------
  // SECTION 2: CREATURES - Battle sprites (32x32) and overworld (16x16)
  // -------------------------------------------------------------------------

  // === FLAMETAIL (Fire starter - fox with flaming tail) ===
  var flametailFront = buildGrid(32, 32);
  // Body outline and fill - cute fox sitting
  fillRect(flametailFront, 12, 4, 8, 4, C.fOrange);   // head
  fillRect(flametailFront, 13, 5, 6, 2, C.fCream);     // face highlight
  setPixel(flametailFront, 14, 5, O); setPixel(flametailFront, 18, 5, O); // eyes
  setPixel(flametailFront, 16, 7, O); // nose
  // Ears
  setPixel(flametailFront, 11, 2, C.fOrange); setPixel(flametailFront, 12, 3, C.fOrange);
  setPixel(flametailFront, 11, 3, C.fOrange);
  setPixel(flametailFront, 20, 2, C.fOrange); setPixel(flametailFront, 19, 3, C.fOrange);
  setPixel(flametailFront, 20, 3, C.fOrange);
  setPixel(flametailFront, 11, 2, C.fRed); setPixel(flametailFront, 20, 2, C.fRed); // ear tips
  // Body
  fillRect(flametailFront, 11, 8, 10, 8, C.fOrange);
  fillRect(flametailFront, 13, 9, 6, 5, C.fCream);     // belly
  // Legs
  fillRect(flametailFront, 11, 16, 3, 4, C.fOrange);
  fillRect(flametailFront, 18, 16, 3, 4, C.fOrange);
  fillRect(flametailFront, 11, 19, 3, 1, C.fCream); // paws
  fillRect(flametailFront, 18, 19, 3, 1, C.fCream);
  // Tail with flame
  fillRect(flametailFront, 22, 8, 2, 5, C.fOrange);
  fillRect(flametailFront, 24, 6, 2, 4, C.fOrange);
  fillRect(flametailFront, 25, 4, 2, 3, C.fRed);
  fillRect(flametailFront, 26, 2, 2, 3, C.fYellow);
  setPixel(flametailFront, 27, 1, C.fYellow);
  // Outline
  outlineSprite(flametailFront, O);
  // Mouth
  setPixel(flametailFront, 15, 7, O); setPixel(flametailFront, 16, 8, O); setPixel(flametailFront, 17, 7, O);

  var flametailOW = buildGrid(16, 16);
  fillRect(flametailOW, 5, 2, 6, 4, C.fOrange);
  fillRect(flametailOW, 6, 3, 4, 2, C.fCream);
  setPixel(flametailOW, 7, 3, O); setPixel(flametailOW, 9, 3, O);
  fillRect(flametailOW, 5, 6, 6, 5, C.fOrange);
  fillRect(flametailOW, 6, 7, 4, 3, C.fCream);
  fillRect(flametailOW, 5, 11, 2, 2, C.fOrange);
  fillRect(flametailOW, 9, 11, 2, 2, C.fOrange);
  fillRect(flametailOW, 11, 5, 2, 3, C.fOrange);
  fillRect(flametailOW, 13, 3, 1, 3, C.fRed);
  setPixel(flametailOW, 13, 2, C.fYellow);
  outlineSprite(flametailOW, O);

  // === BLAZEFANG (Flametail evolution) ===
  var blazefangFront = buildGrid(32, 32);
  fillRect(blazefangFront, 10, 2, 12, 6, C.fOrange);
  fillRect(blazefangFront, 12, 3, 8, 4, C.fCream);
  setPixel(blazefangFront, 13, 4, O); setPixel(blazefangFront, 18, 4, O);
  setPixel(blazefangFront, 15, 6, O); setPixel(blazefangFront, 16, 6, O);
  // Ears with flames
  setPixel(blazefangFront, 9, 0, C.fRed); setPixel(blazefangFront, 10, 1, C.fOrange);
  setPixel(blazefangFront, 22, 0, C.fRed); setPixel(blazefangFront, 21, 1, C.fOrange);
  // Bigger body
  fillRect(blazefangFront, 8, 8, 16, 10, C.fOrange);
  fillRect(blazefangFront, 11, 9, 10, 7, C.fCream);
  // Legs
  fillRect(blazefangFront, 9, 18, 4, 6, C.fOrange);
  fillRect(blazefangFront, 19, 18, 4, 6, C.fOrange);
  fillRect(blazefangFront, 9, 23, 4, 1, C.fCream);
  fillRect(blazefangFront, 19, 23, 4, 1, C.fCream);
  // Big flame tail
  fillRect(blazefangFront, 24, 6, 3, 6, C.fOrange);
  fillRect(blazefangFront, 26, 3, 3, 5, C.fRed);
  fillRect(blazefangFront, 28, 1, 2, 4, C.fYellow);
  setPixel(blazefangFront, 29, 0, C.fYellow);
  // Fangs
  setPixel(blazefangFront, 14, 7, C.white); setPixel(blazefangFront, 17, 7, C.white);
  outlineSprite(blazefangFront, O);

  var blazefangOW = buildGrid(16, 16);
  fillRect(blazefangOW, 4, 1, 8, 5, C.fOrange);
  fillRect(blazefangOW, 5, 2, 6, 3, C.fCream);
  setPixel(blazefangOW, 6, 3, O); setPixel(blazefangOW, 9, 3, O);
  fillRect(blazefangOW, 4, 6, 8, 5, C.fOrange);
  fillRect(blazefangOW, 4, 11, 3, 3, C.fOrange);
  fillRect(blazefangOW, 9, 11, 3, 3, C.fOrange);
  fillRect(blazefangOW, 12, 3, 2, 4, C.fRed);
  setPixel(blazefangOW, 13, 2, C.fYellow); setPixel(blazefangOW, 14, 1, C.fYellow);
  outlineSprite(blazefangOW, O);

  // === AQUAPUP (Water starter - otter puppy) ===
  var aquapupFront = buildGrid(32, 32);
  // Head - round otter face
  fillRect(aquapupFront, 11, 4, 10, 8, C.wBlue);
  fillRect(aquapupFront, 13, 5, 6, 5, C.wWhite); // face
  setPixel(aquapupFront, 14, 6, O); setPixel(aquapupFront, 18, 6, O); // eyes
  setPixel(aquapupFront, 16, 8, "#403030"); // nose
  setPixel(aquapupFront, 15, 9, O); setPixel(aquapupFront, 17, 9, O); // mouth
  // Ears
  fillRect(aquapupFront, 10, 3, 2, 2, C.wBlue);
  fillRect(aquapupFront, 20, 3, 2, 2, C.wBlue);
  setPixel(aquapupFront, 10, 3, C.wLight); setPixel(aquapupFront, 21, 3, C.wLight);
  // Body
  fillRect(aquapupFront, 10, 12, 12, 8, C.wBlue);
  fillRect(aquapupFront, 12, 13, 8, 5, C.wWhite); // belly
  // Arms/flippers
  fillRect(aquapupFront, 8, 13, 2, 5, C.wBlue);
  fillRect(aquapupFront, 22, 13, 2, 5, C.wBlue);
  setPixel(aquapupFront, 8, 17, C.wLight); setPixel(aquapupFront, 23, 17, C.wLight);
  // Legs
  fillRect(aquapupFront, 11, 20, 3, 3, C.wBlue);
  fillRect(aquapupFront, 18, 20, 3, 3, C.wBlue);
  fillRect(aquapupFront, 11, 22, 3, 1, C.wLight);
  fillRect(aquapupFront, 18, 22, 3, 1, C.wLight);
  // Tail
  fillRect(aquapupFront, 22, 16, 4, 2, C.wBlue);
  fillRect(aquapupFront, 25, 14, 2, 3, C.wLight);
  outlineSprite(aquapupFront, O);

  var aquapupOW = buildGrid(16, 16);
  fillRect(aquapupOW, 5, 2, 6, 5, C.wBlue);
  fillRect(aquapupOW, 6, 3, 4, 3, C.wWhite);
  setPixel(aquapupOW, 7, 4, O); setPixel(aquapupOW, 9, 4, O);
  fillRect(aquapupOW, 5, 7, 6, 5, C.wBlue);
  fillRect(aquapupOW, 6, 8, 4, 3, C.wWhite);
  fillRect(aquapupOW, 5, 12, 2, 2, C.wBlue);
  fillRect(aquapupOW, 9, 12, 2, 2, C.wBlue);
  outlineSprite(aquapupOW, O);

  // === TIDALFANG (Aquapup evolution) ===
  var tidalfangFront = buildGrid(32, 32);
  fillRect(tidalfangFront, 9, 2, 14, 8, C.wBlue);
  fillRect(tidalfangFront, 12, 3, 8, 5, C.wWhite);
  setPixel(tidalfangFront, 13, 5, O); setPixel(tidalfangFront, 18, 5, O);
  setPixel(tidalfangFront, 15, 7, "#403030"); setPixel(tidalfangFront, 16, 7, "#403030");
  // Crest
  fillRect(tidalfangFront, 14, 0, 4, 3, C.wLight);
  setPixel(tidalfangFront, 15, 0, C.wBlue); setPixel(tidalfangFront, 16, 0, C.wBlue);
  // Body larger
  fillRect(tidalfangFront, 7, 10, 18, 10, C.wBlue);
  fillRect(tidalfangFront, 10, 11, 12, 7, C.wWhite);
  // Arms with fins
  fillRect(tidalfangFront, 5, 11, 2, 7, C.wBlue);
  fillRect(tidalfangFront, 25, 11, 2, 7, C.wBlue);
  fillRect(tidalfangFront, 4, 14, 1, 3, C.wLight);
  fillRect(tidalfangFront, 27, 14, 1, 3, C.wLight);
  // Legs
  fillRect(tidalfangFront, 9, 20, 4, 5, C.wBlue);
  fillRect(tidalfangFront, 19, 20, 4, 5, C.wBlue);
  fillRect(tidalfangFront, 9, 24, 4, 1, C.wLight);
  fillRect(tidalfangFront, 19, 24, 4, 1, C.wLight);
  // Fangs
  setPixel(tidalfangFront, 14, 8, C.white); setPixel(tidalfangFront, 17, 8, C.white);
  outlineSprite(tidalfangFront, O);

  var tidalfangOW = buildGrid(16, 16);
  fillRect(tidalfangOW, 4, 1, 8, 5, C.wBlue);
  fillRect(tidalfangOW, 5, 2, 6, 3, C.wWhite);
  setPixel(tidalfangOW, 6, 3, O); setPixel(tidalfangOW, 9, 3, O);
  fillRect(tidalfangOW, 3, 6, 10, 5, C.wBlue);
  fillRect(tidalfangOW, 5, 7, 6, 3, C.wWhite);
  fillRect(tidalfangOW, 4, 11, 3, 3, C.wBlue);
  fillRect(tidalfangOW, 9, 11, 3, 3, C.wBlue);
  fillRect(tidalfangOW, 6, 0, 4, 2, C.wLight);
  outlineSprite(tidalfangOW, O);

  // === THORNSPROUT (Grass starter - plant dino) ===
  var thornsproutFront = buildGrid(32, 32);
  // Head
  fillRect(thornsproutFront, 11, 6, 10, 7, C.gGreen);
  fillRect(thornsproutFront, 13, 7, 6, 4, C.gLime); // face
  setPixel(thornsproutFront, 14, 8, O); setPixel(thornsproutFront, 18, 8, O);
  setPixel(thornsproutFront, 16, 10, O); // nose
  setPixel(thornsproutFront, 15, 11, O); setPixel(thornsproutFront, 17, 11, O);
  // Leaf on head
  fillRect(thornsproutFront, 14, 3, 4, 3, C.gLime);
  fillRect(thornsproutFront, 15, 2, 2, 2, C.gGreen);
  setPixel(thornsproutFront, 16, 1, C.gDark);
  // Body
  fillRect(thornsproutFront, 10, 13, 12, 7, C.gGreen);
  fillRect(thornsproutFront, 12, 14, 8, 4, C.gLime);
  // Spots on back
  setPixel(thornsproutFront, 11, 14, C.gDark); setPixel(thornsproutFront, 20, 15, C.gDark);
  setPixel(thornsproutFront, 12, 17, C.gDark);
  // Legs
  fillRect(thornsproutFront, 10, 20, 3, 4, C.gGreen);
  fillRect(thornsproutFront, 19, 20, 3, 4, C.gGreen);
  fillRect(thornsproutFront, 10, 23, 3, 1, C.gBrown);
  fillRect(thornsproutFront, 19, 23, 3, 1, C.gBrown);
  // Tail with leaf
  fillRect(thornsproutFront, 22, 15, 3, 2, C.gGreen);
  fillRect(thornsproutFront, 24, 13, 3, 3, C.gLime);
  setPixel(thornsproutFront, 26, 12, C.gDark);
  outlineSprite(thornsproutFront, O);

  var thornsproutOW = buildGrid(16, 16);
  fillRect(thornsproutOW, 5, 3, 6, 4, C.gGreen);
  fillRect(thornsproutOW, 6, 4, 4, 2, C.gLime);
  setPixel(thornsproutOW, 7, 4, O); setPixel(thornsproutOW, 9, 4, O);
  fillRect(thornsproutOW, 7, 1, 2, 2, C.gLime); // leaf
  setPixel(thornsproutOW, 8, 0, C.gDark);
  fillRect(thornsproutOW, 5, 7, 6, 5, C.gGreen);
  fillRect(thornsproutOW, 6, 8, 4, 3, C.gLime);
  fillRect(thornsproutOW, 5, 12, 2, 2, C.gGreen);
  fillRect(thornsproutOW, 9, 12, 2, 2, C.gGreen);
  outlineSprite(thornsproutOW, O);

  // === THORNRAPTOR (Thornsprout evolution) ===
  var thornraptorFront = buildGrid(32, 32);
  fillRect(thornraptorFront, 9, 3, 12, 7, C.gGreen);
  fillRect(thornraptorFront, 11, 4, 8, 5, C.gLime);
  setPixel(thornraptorFront, 13, 5, O); setPixel(thornraptorFront, 18, 5, O);
  setPixel(thornraptorFront, 15, 7, O); setPixel(thornraptorFront, 16, 7, O);
  // Head crest leaves
  fillRect(thornraptorFront, 12, 0, 3, 4, C.gLime);
  fillRect(thornraptorFront, 16, 0, 3, 4, C.gLime);
  setPixel(thornraptorFront, 13, 0, C.gDark); setPixel(thornraptorFront, 17, 0, C.gDark);
  // Body
  fillRect(thornraptorFront, 8, 10, 16, 10, C.gGreen);
  fillRect(thornraptorFront, 11, 11, 10, 7, C.gLime);
  // Claws
  fillRect(thornraptorFront, 6, 11, 2, 6, C.gGreen);
  fillRect(thornraptorFront, 24, 11, 2, 6, C.gGreen);
  setPixel(thornraptorFront, 5, 16, C.gBrown); setPixel(thornraptorFront, 26, 16, C.gBrown);
  // Legs
  fillRect(thornraptorFront, 9, 20, 4, 5, C.gGreen);
  fillRect(thornraptorFront, 19, 20, 4, 5, C.gGreen);
  fillRect(thornraptorFront, 9, 24, 4, 1, C.gBrown);
  fillRect(thornraptorFront, 19, 24, 4, 1, C.gBrown);
  // Leaf tail
  fillRect(thornraptorFront, 24, 13, 4, 2, C.gGreen);
  fillRect(thornraptorFront, 27, 11, 3, 4, C.gLime);
  outlineSprite(thornraptorFront, O);

  var thornraptorOW = buildGrid(16, 16);
  fillRect(thornraptorOW, 4, 1, 8, 5, C.gGreen);
  fillRect(thornraptorOW, 5, 2, 6, 3, C.gLime);
  setPixel(thornraptorOW, 6, 3, O); setPixel(thornraptorOW, 9, 3, O);
  fillRect(thornraptorOW, 6, 0, 2, 2, C.gLime); fillRect(thornraptorOW, 9, 0, 2, 2, C.gLime);
  fillRect(thornraptorOW, 3, 6, 10, 5, C.gGreen);
  fillRect(thornraptorOW, 5, 7, 6, 3, C.gLime);
  fillRect(thornraptorOW, 4, 11, 3, 3, C.gGreen);
  fillRect(thornraptorOW, 9, 11, 3, 3, C.gGreen);
  outlineSprite(thornraptorOW, O);

  // === SPARKLING (Electric - sparkly mouse) ===
  var sparklingFront = buildGrid(32, 32);
  // Big ears
  fillRect(sparklingFront, 8, 2, 4, 5, C.eYellow);
  fillRect(sparklingFront, 20, 2, 4, 5, C.eYellow);
  setPixel(sparklingFront, 9, 3, C.black); setPixel(sparklingFront, 22, 3, C.black); // ear tips
  // Head
  fillRect(sparklingFront, 10, 6, 12, 8, C.eYellow);
  fillRect(sparklingFront, 12, 7, 8, 5, C.ePale);
  setPixel(sparklingFront, 13, 8, O); setPixel(sparklingFront, 18, 8, O); // eyes
  // Rosy cheeks
  fillRect(sparklingFront, 11, 10, 2, 2, C.fOrange);
  fillRect(sparklingFront, 19, 10, 2, 2, C.fOrange);
  setPixel(sparklingFront, 15, 10, O); setPixel(sparklingFront, 16, 10, O); // nose
  // Body
  fillRect(sparklingFront, 11, 14, 10, 7, C.eYellow);
  fillRect(sparklingFront, 13, 15, 6, 4, C.ePale);
  // Arms
  fillRect(sparklingFront, 9, 15, 2, 4, C.eYellow);
  fillRect(sparklingFront, 21, 15, 2, 4, C.eYellow);
  // Feet
  fillRect(sparklingFront, 11, 21, 3, 2, C.eYellow);
  fillRect(sparklingFront, 18, 21, 3, 2, C.eYellow);
  // Lightning bolt tail
  fillRect(sparklingFront, 22, 14, 2, 2, C.eGold);
  fillRect(sparklingFront, 24, 12, 2, 3, C.eGold);
  fillRect(sparklingFront, 26, 10, 2, 3, C.eGold);
  fillRect(sparklingFront, 24, 9, 2, 2, C.eGold);
  outlineSprite(sparklingFront, O);

  var sparklingOW = buildGrid(16, 16);
  fillRect(sparklingOW, 3, 1, 3, 3, C.eYellow); fillRect(sparklingOW, 10, 1, 3, 3, C.eYellow);
  fillRect(sparklingOW, 5, 3, 6, 5, C.eYellow);
  fillRect(sparklingOW, 6, 4, 4, 3, C.ePale);
  setPixel(sparklingOW, 7, 5, O); setPixel(sparklingOW, 9, 5, O);
  fillRect(sparklingOW, 5, 8, 6, 4, C.eYellow);
  fillRect(sparklingOW, 5, 12, 2, 2, C.eYellow);
  fillRect(sparklingOW, 9, 12, 2, 2, C.eYellow);
  fillRect(sparklingOW, 11, 7, 2, 2, C.eGold); setPixel(sparklingOW, 13, 6, C.eGold);
  outlineSprite(sparklingOW, O);

  // === VOLTPOUNCE (Sparkling evolution) ===
  var voltpounceFront = buildGrid(32, 32);
  fillRect(voltpounceFront, 7, 1, 4, 6, C.eYellow);
  fillRect(voltpounceFront, 21, 1, 4, 6, C.eYellow);
  setPixel(voltpounceFront, 8, 1, C.black); setPixel(voltpounceFront, 23, 1, C.black);
  fillRect(voltpounceFront, 9, 5, 14, 9, C.eYellow);
  fillRect(voltpounceFront, 11, 6, 10, 6, C.ePale);
  setPixel(voltpounceFront, 13, 8, O); setPixel(voltpounceFront, 19, 8, O);
  fillRect(voltpounceFront, 10, 10, 2, 2, C.fOrange); fillRect(voltpounceFront, 20, 10, 2, 2, C.fOrange);
  setPixel(voltpounceFront, 15, 10, O); setPixel(voltpounceFront, 16, 10, O);
  fillRect(voltpounceFront, 9, 14, 14, 9, C.eYellow);
  fillRect(voltpounceFront, 12, 15, 8, 6, C.ePale);
  fillRect(voltpounceFront, 7, 15, 2, 5, C.eYellow); fillRect(voltpounceFront, 23, 15, 2, 5, C.eYellow);
  fillRect(voltpounceFront, 10, 23, 4, 4, C.eYellow); fillRect(voltpounceFront, 18, 23, 4, 4, C.eYellow);
  // Bigger lightning tail
  fillRect(voltpounceFront, 24, 12, 3, 2, C.eGold);
  fillRect(voltpounceFront, 26, 9, 3, 4, C.eGold);
  fillRect(voltpounceFront, 25, 7, 3, 3, C.eGold);
  outlineSprite(voltpounceFront, O);

  var voltpounceOW = buildGrid(16, 16);
  fillRect(voltpounceOW, 2, 0, 3, 4, C.eYellow); fillRect(voltpounceOW, 11, 0, 3, 4, C.eYellow);
  fillRect(voltpounceOW, 4, 2, 8, 5, C.eYellow);
  fillRect(voltpounceOW, 5, 3, 6, 3, C.ePale);
  setPixel(voltpounceOW, 6, 4, O); setPixel(voltpounceOW, 9, 4, O);
  fillRect(voltpounceOW, 3, 7, 10, 5, C.eYellow);
  fillRect(voltpounceOW, 4, 12, 3, 2, C.eYellow); fillRect(voltpounceOW, 9, 12, 3, 2, C.eYellow);
  fillRect(voltpounceOW, 12, 5, 2, 3, C.eGold); setPixel(voltpounceOW, 14, 4, C.eGold);
  outlineSprite(voltpounceOW, O);

  // === GEOLEM (Rock) ===
  var geolemFront = buildGrid(32, 32);
  fillRect(geolemFront, 10, 4, 12, 9, C.rGray);
  fillRect(geolemFront, 12, 5, 8, 6, C.rLight);
  setPixel(geolemFront, 13, 7, O); setPixel(geolemFront, 18, 7, O);
  setPixel(geolemFront, 15, 9, O); setPixel(geolemFront, 16, 9, O);
  // Rocky texture
  setPixel(geolemFront, 11, 5, C.rDark); setPixel(geolemFront, 20, 6, C.rDark);
  setPixel(geolemFront, 10, 8, C.rBrown); setPixel(geolemFront, 21, 9, C.rBrown);
  // Body - massive
  fillRect(geolemFront, 7, 13, 18, 10, C.rGray);
  fillRect(geolemFront, 10, 14, 12, 7, C.rLight);
  setPixel(geolemFront, 8, 14, C.rDark); setPixel(geolemFront, 23, 16, C.rDark);
  setPixel(geolemFront, 12, 18, C.rBrown); setPixel(geolemFront, 20, 15, C.rBrown);
  // Arms
  fillRect(geolemFront, 4, 14, 3, 7, C.rGray);
  fillRect(geolemFront, 25, 14, 3, 7, C.rGray);
  // Legs
  fillRect(geolemFront, 9, 23, 5, 4, C.rGray);
  fillRect(geolemFront, 18, 23, 5, 4, C.rGray);
  fillRect(geolemFront, 9, 26, 5, 1, C.rDark);
  fillRect(geolemFront, 18, 26, 5, 1, C.rDark);
  outlineSprite(geolemFront, O);

  var geolemOW = buildGrid(16, 16);
  fillRect(geolemOW, 4, 2, 8, 5, C.rGray);
  fillRect(geolemOW, 5, 3, 6, 3, C.rLight);
  setPixel(geolemOW, 6, 4, O); setPixel(geolemOW, 9, 4, O);
  fillRect(geolemOW, 3, 7, 10, 5, C.rGray);
  fillRect(geolemOW, 5, 8, 6, 3, C.rLight);
  fillRect(geolemOW, 4, 12, 3, 2, C.rGray); fillRect(geolemOW, 9, 12, 3, 2, C.rGray);
  outlineSprite(geolemOW, O);

  // === MISTWISP (Ghost) ===
  var mistwispFront = buildGrid(32, 32);
  // Ghostly body - teardrop shape
  fillRect(mistwispFront, 11, 4, 10, 6, C.pLav);
  fillRect(mistwispFront, 10, 8, 12, 8, C.pLav);
  fillRect(mistwispFront, 13, 5, 6, 4, C.pWhite);
  // Eyes - big and cute
  fillRect(mistwispFront, 13, 7, 2, 2, C.pPurple); fillRect(mistwispFront, 18, 7, 2, 2, C.pPurple);
  setPixel(mistwispFront, 13, 7, C.white); setPixel(mistwispFront, 18, 7, C.white);
  // Mouth
  setPixel(mistwispFront, 15, 10, C.pDark); setPixel(mistwispFront, 16, 10, C.pDark);
  setPixel(mistwispFront, 16, 11, C.pDark);
  // Wispy bottom tendrils
  fillRect(mistwispFront, 10, 16, 3, 4, C.pLav);
  fillRect(mistwispFront, 14, 16, 4, 5, C.pLav);
  fillRect(mistwispFront, 19, 16, 3, 4, C.pLav);
  setPixel(mistwispFront, 11, 20, C.pLav); setPixel(mistwispFront, 15, 21, C.pLav);
  setPixel(mistwispFront, 16, 22, C.pLav); setPixel(mistwispFront, 20, 20, C.pLav);
  // Glow effect
  setPixel(mistwispFront, 9, 6, C.pWhite); setPixel(mistwispFront, 22, 6, C.pWhite);
  setPixel(mistwispFront, 8, 10, C.pWhite); setPixel(mistwispFront, 23, 10, C.pWhite);
  outlineSprite(mistwispFront, O);

  var mistwispOW = buildGrid(16, 16);
  fillRect(mistwispOW, 5, 2, 6, 5, C.pLav);
  fillRect(mistwispOW, 6, 3, 4, 3, C.pWhite);
  setPixel(mistwispOW, 6, 4, C.pPurple); setPixel(mistwispOW, 9, 4, C.pPurple);
  fillRect(mistwispOW, 5, 7, 6, 4, C.pLav);
  fillRect(mistwispOW, 5, 11, 2, 2, C.pLav);
  fillRect(mistwispOW, 7, 11, 2, 3, C.pLav);
  fillRect(mistwispOW, 10, 11, 2, 2, C.pLav);
  outlineSprite(mistwispOW, O);

  // === SKYCLAW (Flying - eagle bird) ===
  var skyclawFront = buildGrid(32, 32);
  // Head
  fillRect(skyclawFront, 12, 4, 8, 6, C.fBlue);
  fillRect(skyclawFront, 13, 5, 6, 4, C.fWhite);
  setPixel(skyclawFront, 14, 6, O); setPixel(skyclawFront, 18, 6, O);
  // Beak
  fillRect(skyclawFront, 15, 8, 2, 2, C.fGold);
  setPixel(skyclawFront, 16, 9, C.eGold);
  // Crown feathers
  setPixel(skyclawFront, 14, 3, C.fBlue); setPixel(skyclawFront, 16, 2, C.fBlue); setPixel(skyclawFront, 18, 3, C.fBlue);
  // Body
  fillRect(skyclawFront, 11, 10, 10, 8, C.fBlue);
  fillRect(skyclawFront, 13, 11, 6, 5, C.fWhite);
  // Wings spread
  fillRect(skyclawFront, 4, 10, 7, 3, C.fBlue);
  fillRect(skyclawFront, 21, 10, 7, 3, C.fBlue);
  fillRect(skyclawFront, 2, 11, 3, 2, C.fGold);
  fillRect(skyclawFront, 27, 11, 3, 2, C.fGold);
  fillRect(skyclawFront, 5, 13, 6, 2, C.fWhite);
  fillRect(skyclawFront, 21, 13, 6, 2, C.fWhite);
  // Talons
  fillRect(skyclawFront, 12, 18, 3, 4, C.fBlue);
  fillRect(skyclawFront, 17, 18, 3, 4, C.fBlue);
  fillRect(skyclawFront, 12, 21, 3, 1, C.fGold);
  fillRect(skyclawFront, 17, 21, 3, 1, C.fGold);
  // Tail
  fillRect(skyclawFront, 14, 18, 4, 3, C.fBlue);
  fillRect(skyclawFront, 13, 20, 6, 2, C.fGold);
  outlineSprite(skyclawFront, O);

  var skyclawOW = buildGrid(16, 16);
  fillRect(skyclawOW, 5, 2, 6, 4, C.fBlue);
  fillRect(skyclawOW, 6, 3, 4, 2, C.fWhite);
  setPixel(skyclawOW, 7, 3, O); setPixel(skyclawOW, 9, 3, O);
  setPixel(skyclawOW, 7, 5, C.fGold); setPixel(skyclawOW, 8, 5, C.fGold);
  fillRect(skyclawOW, 3, 6, 10, 4, C.fBlue);
  fillRect(skyclawOW, 5, 7, 6, 2, C.fWhite);
  fillRect(skyclawOW, 5, 10, 2, 3, C.fBlue); fillRect(skyclawOW, 9, 10, 2, 3, C.fBlue);
  fillRect(skyclawOW, 5, 12, 2, 1, C.fGold); fillRect(skyclawOW, 9, 12, 2, 1, C.fGold);
  outlineSprite(skyclawOW, O);

  // === NUMBIT (Special math creature - number rabbit) ===
  var numbitFront = buildGrid(32, 32);
  // Long ears
  fillRect(numbitFront, 10, 0, 3, 7, C.mPink);
  fillRect(numbitFront, 19, 0, 3, 7, C.mPink);
  fillRect(numbitFront, 11, 1, 1, 5, C.mWhite);
  fillRect(numbitFront, 20, 1, 1, 5, C.mWhite);
  // Head
  fillRect(numbitFront, 10, 6, 12, 8, C.mPink);
  fillRect(numbitFront, 12, 7, 8, 5, C.mWhite);
  setPixel(numbitFront, 13, 8, O); setPixel(numbitFront, 18, 8, O); // eyes
  setPixel(numbitFront, 16, 10, C.mPink); // nose
  setPixel(numbitFront, 15, 11, O); setPixel(numbitFront, 17, 11, O);
  // Math symbol on forehead
  setPixel(numbitFront, 15, 7, C.mGold); setPixel(numbitFront, 16, 7, C.mGold);
  setPixel(numbitFront, 14, 7, C.mGold); setPixel(numbitFront, 17, 7, C.mGold); // plus/star
  // Body
  fillRect(numbitFront, 11, 14, 10, 7, C.mPink);
  fillRect(numbitFront, 13, 15, 6, 4, C.mWhite);
  // Gold number "7" on belly
  setPixel(numbitFront, 14, 16, C.mGold); setPixel(numbitFront, 15, 16, C.mGold);
  setPixel(numbitFront, 16, 16, C.mGold); setPixel(numbitFront, 16, 17, C.mGold);
  setPixel(numbitFront, 15, 18, C.mGold);
  // Arms
  fillRect(numbitFront, 9, 15, 2, 4, C.mPink);
  fillRect(numbitFront, 21, 15, 2, 4, C.mPink);
  // Legs
  fillRect(numbitFront, 11, 21, 3, 3, C.mPink);
  fillRect(numbitFront, 18, 21, 3, 3, C.mPink);
  fillRect(numbitFront, 11, 23, 3, 1, C.mWhite);
  fillRect(numbitFront, 18, 23, 3, 1, C.mWhite);
  // Puffy tail (visible from front)
  fillRect(numbitFront, 21, 17, 3, 3, C.mWhite);
  outlineSprite(numbitFront, O);

  var numbitOW = buildGrid(16, 16);
  fillRect(numbitOW, 4, 0, 2, 4, C.mPink); fillRect(numbitOW, 10, 0, 2, 4, C.mPink);
  fillRect(numbitOW, 5, 3, 6, 5, C.mPink);
  fillRect(numbitOW, 6, 4, 4, 3, C.mWhite);
  setPixel(numbitOW, 7, 5, O); setPixel(numbitOW, 9, 5, O);
  setPixel(numbitOW, 7, 4, C.mGold); setPixel(numbitOW, 8, 4, C.mGold);
  fillRect(numbitOW, 5, 8, 6, 4, C.mPink);
  fillRect(numbitOW, 6, 9, 4, 2, C.mWhite);
  fillRect(numbitOW, 5, 12, 2, 2, C.mPink); fillRect(numbitOW, 9, 12, 2, 2, C.mPink);
  outlineSprite(numbitOW, O);

  // -------------------------------------------------------------------------
  // SECTION 3: NPCs (16x16)
  // -------------------------------------------------------------------------

  // Professor (old wizard)
  var professorDown = [
    [_,_,_,_,O,O,O,O,O,O,O,O,_,_,_,_],
    [_,_,_,O,"#D0D0E0","#D0D0E0","#E0E0F0","#E0E0F0","#E0E0F0","#D0D0E0","#D0D0E0",O,_,_,_,_],
    [_,_,O,"#D0D0E0","#E0E0F0","#E0E0F0","#F0F0FF","#F8D030","#F0F0FF","#E0E0F0","#E0E0F0",O,_,_,_,_],
    [_,_,O,O,O,O,O,O,O,O,O,O,O,_,_,_],
    [_,_,O,"#D8D8D8","#D8D8D8",O,S,S,S,O,"#D8D8D8","#D8D8D8",O,_,_,_],
    [_,_,O,"#D8D8D8",O,S,S,S,S,S,O,"#D8D8D8",O,_,_,_],
    [_,_,_,O,S,S,O,S,S,O,S,S,O,_,_,_],
    [_,_,_,O,S,S,S,Sd,Sd,S,S,S,O,_,_,_],
    [_,_,_,O,Sd,Sd,"#E06060",Sd,Sd,"#E06060",Sd,Sd,O,_,_,_],
    [_,_,_,_,O,"#D8D8D8","#D8D8D8","#D8D8D8","#D8D8D8","#D8D8D8","#D8D8D8",O,_,_,_,_],
    [_,_,_,O,"#5040A0","#5040A0","#6050B0","#6050B0","#6050B0","#5040A0","#5040A0",O,_,_,_,_],
    [_,_,O,"#5040A0","#6050B0","#6050B0","#6050B0","#6050B0","#6050B0","#6050B0","#5040A0",O,_,_,_,_],
    [_,_,O,"#5040A0","#6050B0","#6050B0","#6050B0","#6050B0","#6050B0","#6050B0","#5040A0",O,_,_,_,_],
    [_,_,_,O,O,"#5040A0","#5040A0","#5040A0","#5040A0","#5040A0",O,O,_,_,_,_],
    [_,_,_,_,_,O,"#5040A0","#403080","#5040A0",O,_,_,_,_,_,_],
    [_,_,_,_,_,O,"#403018","#403018","#403018",O,_,_,_,_,_,_],
  ];

  // Shopkeeper
  var shopkeeperDown = [
    [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_],
    [_,_,_,_,O,"#40A040","#40A040","#40A040","#40A040","#40A040","#40A040",O,_,_,_,_],
    [_,_,_,O,"#40A040","#40A040","#50B050","#50B050","#50B050","#40A040","#40A040",O,_,_,_,_],
    [_,_,_,O,O,O,O,O,O,O,O,O,_,_,_,_],
    [_,_,_,O,"#805020","#805020",S,S,S,"#805020","#805020",O,_,_,_,_],
    [_,_,_,O,"#805020",S,S,S,S,S,"#805020",O,_,_,_,_],
    [_,_,_,O,S,S,O,S,S,O,S,S,O,_,_,_],
    [_,_,_,O,S,S,S,S,S,S,S,S,O,_,_,_],
    [_,_,_,_,O,S,S,Sd,Sd,S,S,O,_,_,_,_],
    [_,_,_,_,_,O,Sd,Sd,Sd,O,_,_,_,_,_,_],
    [_,_,_,O,"#E8D090","#E8D090","#F0D8A0","#F0D8A0","#F0D8A0","#E8D090","#E8D090",O,_,_,_,_],
    [_,_,O,S,O,"#E8D090","#F0D8A0","#F0D8A0","#F0D8A0","#E8D090",O,S,O,_,_,_],
    [_,_,_,O,O,"#E8D090","#E8D090","#E8D090","#E8D090","#E8D090",O,O,_,_,_,_],
    [_,_,_,_,O,"#604830","#604830","#604830","#604830","#604830",O,_,_,_,_,_],
    [_,_,_,_,O,"#604830","#503820","#503820","#604830",O,_,_,_,_,_,_],
    [_,_,_,_,O,"#403018","#403018","#403018","#403018",O,_,_,_,_,_,_],
  ];

  // Trainer
  var trainerDown = [
    [_,_,_,_,_,O,O,O,O,O,_,_,_,_,_,_],
    [_,_,_,O,O,"#E04040","#E04040","#E04040","#E04040","#E04040",O,O,_,_,_,_],
    [_,_,O,C.white,O,"#E04040","#E04040","#E04040","#E04040",O,C.white,O,_,_,_,_],
    [_,_,_,O,O,O,O,O,O,O,O,O,_,_,_,_],
    [_,_,_,O,hair,hair,S,S,S,hair,hair,O,_,_,_,_],
    [_,_,_,O,hair,S,S,S,S,S,hair,O,_,_,_,_],
    [_,_,_,O,S,S,O,S,S,O,S,S,O,_,_,_],
    [_,_,_,O,S,S,S,S,S,S,S,S,O,_,_,_],
    [_,_,_,_,O,S,S,Sd,Sd,S,S,O,_,_,_,_],
    [_,_,_,_,_,O,S,S,S,O,_,_,_,_,_,_],
    [_,_,_,O,"#3060C0","#3060C0","#4070D0","#4070D0","#4070D0","#3060C0",O,_,_,_,_,_],
    [_,_,O,S,O,"#3060C0","#4070D0","#4070D0","#4070D0",O,S,O,_,_,_,_],
    [_,_,_,O,O,"#3060C0","#3060C0","#3060C0","#3060C0",O,O,_,_,_,_,_],
    [_,_,_,_,O,"#303060","#303060","#303060","#303060",O,_,_,_,_,_,_],
    [_,_,_,_,O,"#303060","#282848","#282848","#303060",O,_,_,_,_,_,_],
    [_,_,_,_,O,"#483018","#483018","#483018","#483018",O,_,_,_,_,_,_],
  ];

  // Healer
  var healerDown = [
    [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_],
    [_,_,_,_,O,"#F8A0B0","#F8A0B0","#F8A0B0","#F8A0B0","#F8A0B0","#F8A0B0",O,_,_,_,_],
    [_,_,_,O,"#F8A0B0","#F8C0D0","#F8C0D0","#F8C0D0","#F8C0D0","#F8C0D0","#F8A0B0",O,_,_,_,_],
    [_,_,_,O,O,O,O,O,O,O,O,O,_,_,_,_],
    [_,_,O,"#F0D070","#F0D070",O,S,S,S,O,"#F0D070","#F0D070",O,_,_,_],
    [_,_,O,"#F0D070",O,S,S,S,S,S,O,"#F0D070",O,_,_,_],
    [_,_,_,O,S,S,O,S,S,O,S,S,O,_,_,_],
    [_,_,_,O,S,S,S,S,S,S,S,S,O,_,_,_],
    [_,_,_,_,O,S,"#E06060",S,S,"#E06060",S,O,_,_,_,_],
    [_,_,_,_,_,O,S,S,S,O,_,_,_,_,_,_],
    [_,_,_,O,C.white,C.white,C.white,C.white,C.white,C.white,C.white,O,_,_,_,_],
    [_,_,O,S,O,C.white,C.white,"#E04040",C.white,C.white,O,S,O,_,_,_],
    [_,_,_,O,O,C.white,"#E04040","#E04040","#E04040",C.white,O,O,_,_,_,_],
    [_,_,_,_,O,C.white,C.white,"#E04040",C.white,C.white,O,_,_,_,_,_],
    [_,_,_,_,O,"#F8A0B0","#E08898","#E08898","#F8A0B0",O,_,_,_,_,_,_],
    [_,_,_,_,O,"#F8A0B0","#F8A0B0","#F8A0B0","#F8A0B0",O,_,_,_,_,_,_],
  ];

  // -------------------------------------------------------------------------
  // SECTION 4: TILE SET (16x16 each)
  // -------------------------------------------------------------------------

  var tileGrass1 = buildGrid(16, 16);
  fillRect(tileGrass1, 0, 0, 16, 16, C.tGrassA);
  setPixel(tileGrass1, 2, 3, C.tGrassB); setPixel(tileGrass1, 7, 1, C.tGrassC);
  setPixel(tileGrass1, 11, 5, C.tGrassB); setPixel(tileGrass1, 4, 9, C.tGrassC);
  setPixel(tileGrass1, 13, 11, C.tGrassB); setPixel(tileGrass1, 1, 13, C.tGrassC);
  setPixel(tileGrass1, 8, 14, C.tGrassB); setPixel(tileGrass1, 14, 7, C.tGrassC);

  var tileGrass2 = buildGrid(16, 16);
  fillRect(tileGrass2, 0, 0, 16, 16, C.tGrassB);
  setPixel(tileGrass2, 5, 2, C.tGrassA); setPixel(tileGrass2, 10, 4, C.tGrassC);
  setPixel(tileGrass2, 3, 8, C.tGrassA); setPixel(tileGrass2, 12, 10, C.tGrassC);
  setPixel(tileGrass2, 1, 14, C.tGrassA); setPixel(tileGrass2, 9, 12, C.tGrassC);
  setPixel(tileGrass2, 7, 6, C.tGrassA);

  var tileTallGrass = buildGrid(16, 16);
  fillRect(tileTallGrass, 0, 0, 16, 16, C.tGrassA);
  // Tall grass blades
  var bladeColor = "#30A020";
  var bladeLight = "#60C040";
  for (var tx = 0; tx < 16; tx += 3) {
    for (var ty = 0; ty < 16; ty += 4) {
      setPixel(tileTallGrass, tx, ty, bladeColor);
      if (ty > 0) setPixel(tileTallGrass, tx, ty - 1, bladeLight);
      if (tx + 1 < 16) setPixel(tileTallGrass, tx + 1, ty, bladeLight);
    }
  }

  var tilePath = buildGrid(16, 16);
  fillRect(tilePath, 0, 0, 16, 16, C.tDirt);
  setPixel(tilePath, 3, 2, C.tDirtDark); setPixel(tilePath, 10, 5, C.tDirtLight);
  setPixel(tilePath, 7, 9, C.tDirtDark); setPixel(tilePath, 13, 13, C.tDirtLight);
  setPixel(tilePath, 1, 12, C.tDirtDark); setPixel(tilePath, 5, 14, C.tDirtLight);

  var tileWater = buildGrid(16, 16);
  fillRect(tileWater, 0, 0, 16, 16, C.tWater);
  // Water ripple highlights
  fillRect(tileWater, 2, 3, 3, 1, C.tWaterLight);
  fillRect(tileWater, 9, 7, 4, 1, C.tWaterLight);
  fillRect(tileWater, 4, 12, 3, 1, C.tWaterLight);
  setPixel(tileWater, 12, 2, C.tWaterDark); setPixel(tileWater, 1, 8, C.tWaterDark);

  var tileTree = buildGrid(16, 16);
  // Trunk
  fillRect(tileTree, 6, 10, 4, 6, C.tWood);
  fillRect(tileTree, 7, 10, 2, 6, C.tWoodLight);
  // Canopy
  fillRect(tileTree, 2, 1, 12, 9, C.gGreen);
  fillRect(tileTree, 3, 2, 10, 7, C.gLime);
  fillRect(tileTree, 4, 0, 8, 2, C.gGreen);
  setPixel(tileTree, 5, 3, C.gDark); setPixel(tileTree, 10, 5, C.gDark);
  setPixel(tileTree, 7, 7, C.gDark);
  outlineSprite(tileTree, O);

  var tileWall = buildGrid(16, 16);
  fillRect(tileWall, 0, 0, 16, 16, C.tWall);
  // Brick lines
  for (var by = 0; by < 16; by += 4) {
    fillRect(tileWall, 0, by, 16, 1, C.tWallDark);
  }
  var brickOff = 0;
  for (var by2 = 0; by2 < 16; by2 += 4) {
    setPixel(tileWall, (8 + brickOff) % 16, by2 + 1, C.tWallDark);
    setPixel(tileWall, (8 + brickOff) % 16, by2 + 2, C.tWallDark);
    setPixel(tileWall, (8 + brickOff) % 16, by2 + 3, C.tWallDark);
    brickOff = (brickOff + 4) % 16;
  }

  var tileDoor = buildGrid(16, 16);
  fillRect(tileDoor, 2, 0, 12, 16, C.tWood);
  fillRect(tileDoor, 3, 1, 10, 14, C.tWoodLight);
  fillRect(tileDoor, 3, 0, 10, 1, C.tWoodDark); // top frame
  fillRect(tileDoor, 2, 0, 1, 16, C.tWoodDark); // left frame
  fillRect(tileDoor, 13, 0, 1, 16, C.tWoodDark); // right frame
  // Door handle
  setPixel(tileDoor, 10, 8, C.eGold); setPixel(tileDoor, 10, 9, C.eGold);
  // Panels
  fillRect(tileDoor, 4, 2, 4, 5, C.tWood);
  fillRect(tileDoor, 9, 2, 4, 5, C.tWood);
  fillRect(tileDoor, 4, 9, 4, 5, C.tWood);
  fillRect(tileDoor, 9, 9, 4, 5, C.tWood);

  var tileRock = buildGrid(16, 16);
  fillRect(tileRock, 0, 0, 16, 16, C.tGrassA); // base grass
  fillRect(tileRock, 2, 3, 12, 10, C.rGray);
  fillRect(tileRock, 3, 4, 10, 8, C.rLight);
  setPixel(tileRock, 5, 5, C.rDark); setPixel(tileRock, 9, 7, C.rDark);
  setPixel(tileRock, 4, 9, C.rDark);
  outlineSprite(tileRock, O);
  // Re-fill grass corners that outline hit
  fillRect(tileRock, 0, 0, 2, 3, C.tGrassA);
  fillRect(tileRock, 14, 0, 2, 3, C.tGrassA);
  fillRect(tileRock, 0, 13, 2, 3, C.tGrassA);
  fillRect(tileRock, 14, 13, 2, 3, C.tGrassA);

  var tileBridge = buildGrid(16, 16);
  fillRect(tileBridge, 0, 0, 16, 16, C.tWater); // water underneath
  fillRect(tileBridge, 0, 2, 16, 12, C.tWood);
  fillRect(tileBridge, 1, 3, 14, 10, C.tWoodLight);
  // Planks
  for (var bp = 0; bp < 16; bp += 4) {
    fillRect(tileBridge, bp, 2, 1, 12, C.tWoodDark);
  }
  // Rails
  fillRect(tileBridge, 0, 2, 16, 1, C.tWoodDark);
  fillRect(tileBridge, 0, 13, 16, 1, C.tWoodDark);

  var tileFlowers = buildGrid(16, 16);
  fillRect(tileFlowers, 0, 0, 16, 16, C.tGrassA);
  // Scatter flowers
  setPixel(tileFlowers, 2, 3, C.tFlower1); setPixel(tileFlowers, 3, 2, C.tFlower1);
  setPixel(tileFlowers, 8, 5, C.tFlower2); setPixel(tileFlowers, 9, 4, C.tFlower2);
  setPixel(tileFlowers, 5, 10, C.tFlower3); setPixel(tileFlowers, 4, 11, C.tFlower3);
  setPixel(tileFlowers, 12, 8, C.tFlower1); setPixel(tileFlowers, 13, 9, C.tFlower1);
  setPixel(tileFlowers, 10, 13, C.tFlower2); setPixel(tileFlowers, 1, 7, C.tFlower3);
  setPixel(tileFlowers, 14, 3, C.tFlower2); setPixel(tileFlowers, 7, 14, C.tFlower1);
  // Stems
  setPixel(tileFlowers, 2, 4, C.gDark); setPixel(tileFlowers, 8, 6, C.gDark);
  setPixel(tileFlowers, 5, 11, C.gDark); setPixel(tileFlowers, 12, 9, C.gDark);

  // Indoor tiles
  var tileFloor = buildGrid(16, 16);
  fillRect(tileFloor, 0, 0, 16, 16, "#D8C8A8");
  fillRect(tileFloor, 0, 0, 8, 8, "#E0D0B0");
  fillRect(tileFloor, 8, 8, 8, 8, "#E0D0B0");
  setPixel(tileFloor, 0, 0, "#C8B898"); setPixel(tileFloor, 8, 0, "#C8B898");
  setPixel(tileFloor, 0, 8, "#C8B898"); setPixel(tileFloor, 8, 8, "#C8B898");

  var tileCounter = buildGrid(16, 16);
  fillRect(tileCounter, 0, 0, 16, 16, C.tWood);
  fillRect(tileCounter, 0, 0, 16, 2, C.tWoodDark);
  fillRect(tileCounter, 1, 2, 14, 4, C.tWoodLight);
  fillRect(tileCounter, 0, 6, 16, 1, C.tWoodDark);
  fillRect(tileCounter, 1, 7, 14, 8, C.tWood);
  fillRect(tileCounter, 0, 15, 16, 1, C.tWoodDark);

  var tileBookshelf = buildGrid(16, 16);
  fillRect(tileBookshelf, 0, 0, 16, 16, C.tWood);
  // Shelves
  fillRect(tileBookshelf, 0, 7, 16, 1, C.tWoodDark);
  fillRect(tileBookshelf, 0, 15, 16, 1, C.tWoodDark);
  // Books top row
  fillRect(tileBookshelf, 1, 1, 2, 6, "#D04040"); fillRect(tileBookshelf, 3, 2, 2, 5, "#4060C0");
  fillRect(tileBookshelf, 5, 1, 2, 6, "#40A040"); fillRect(tileBookshelf, 7, 2, 2, 5, "#D0A030");
  fillRect(tileBookshelf, 9, 1, 3, 6, "#8040A0"); fillRect(tileBookshelf, 12, 2, 3, 5, "#C06030");
  // Books bottom row
  fillRect(tileBookshelf, 1, 8, 3, 7, "#3080C0"); fillRect(tileBookshelf, 4, 9, 2, 6, "#C04060");
  fillRect(tileBookshelf, 6, 8, 2, 7, "#40B040"); fillRect(tileBookshelf, 8, 9, 3, 6, "#D0B030");
  fillRect(tileBookshelf, 11, 8, 2, 7, "#A03060"); fillRect(tileBookshelf, 13, 9, 2, 6, "#5070C0");

  var tileSign = buildGrid(16, 16);
  fillRect(tileSign, 0, 0, 16, 16, C.tGrassA); // base grass
  // Sign post
  fillRect(tileSign, 7, 8, 2, 8, C.tWood);
  // Sign board
  fillRect(tileSign, 2, 2, 12, 7, C.tWoodLight);
  fillRect(tileSign, 2, 2, 12, 1, C.tWoodDark);
  fillRect(tileSign, 2, 2, 1, 7, C.tWoodDark);
  fillRect(tileSign, 13, 2, 1, 7, C.tWoodDark);
  fillRect(tileSign, 2, 8, 12, 1, C.tWoodDark);
  // Text lines
  fillRect(tileSign, 4, 4, 8, 1, "#604020");
  fillRect(tileSign, 5, 6, 6, 1, "#604020");

  // -------------------------------------------------------------------------
  // SECTION 5: ITEM SPRITES (16x16)
  // -------------------------------------------------------------------------

  var itemPotion = buildGrid(16, 16);
  fillRect(itemPotion, 6, 2, 4, 3, "#C0C0C0"); // cap
  fillRect(itemPotion, 7, 2, 2, 1, "#E0E0E0");
  fillRect(itemPotion, 5, 5, 6, 8, C.potionPurple);
  fillRect(itemPotion, 6, 6, 4, 5, "#B860E0");
  fillRect(itemPotion, 7, 7, 1, 2, "#D090F0"); // highlight
  fillRect(itemPotion, 5, 13, 6, 1, "#8030A0");
  outlineSprite(itemPotion, O);

  var itemSuperPotion = buildGrid(16, 16);
  fillRect(itemSuperPotion, 6, 1, 4, 3, "#D0D0D0");
  fillRect(itemSuperPotion, 7, 1, 2, 1, "#E8E8E8");
  fillRect(itemSuperPotion, 4, 4, 8, 9, C.potionBlue);
  fillRect(itemSuperPotion, 5, 5, 6, 6, "#60A8F0");
  fillRect(itemSuperPotion, 6, 6, 1, 3, "#90C8F8"); // highlight
  fillRect(itemSuperPotion, 4, 13, 8, 1, "#2868A0");
  // Star
  setPixel(itemSuperPotion, 8, 7, C.eYellow); setPixel(itemSuperPotion, 9, 7, C.eYellow);
  setPixel(itemSuperPotion, 7, 8, C.eYellow); setPixel(itemSuperPotion, 10, 8, C.eYellow);
  setPixel(itemSuperPotion, 8, 8, C.white); setPixel(itemSuperPotion, 9, 8, C.white);
  setPixel(itemSuperPotion, 8, 9, C.eYellow); setPixel(itemSuperPotion, 9, 9, C.eYellow);
  outlineSprite(itemSuperPotion, O);

  var itemMathOrb = buildGrid(16, 16);
  // Top half - red
  fillRect(itemMathOrb, 4, 2, 8, 6, C.orbRed);
  fillRect(itemMathOrb, 3, 3, 10, 4, C.orbRed);
  fillRect(itemMathOrb, 5, 3, 3, 2, "#F07070"); // highlight
  // Middle band
  fillRect(itemMathOrb, 3, 7, 10, 2, O);
  fillRect(itemMathOrb, 4, 7, 8, 2, "#484848");
  // Center button
  fillRect(itemMathOrb, 6, 7, 4, 2, C.white);
  setPixel(itemMathOrb, 7, 7, C.eYellow); setPixel(itemMathOrb, 8, 7, C.eYellow);
  // Bottom half - white
  fillRect(itemMathOrb, 3, 9, 10, 4, C.orbWhite);
  fillRect(itemMathOrb, 4, 13, 8, 1, C.orbWhite);
  fillRect(itemMathOrb, 5, 10, 3, 2, "#F8F8F8"); // highlight
  // Math symbol "+" on top half
  setPixel(itemMathOrb, 7, 4, C.white); setPixel(itemMathOrb, 8, 4, C.white);
  setPixel(itemMathOrb, 6, 5, C.white); setPixel(itemMathOrb, 7, 5, C.white);
  setPixel(itemMathOrb, 8, 5, C.white); setPixel(itemMathOrb, 9, 5, C.white);
  outlineSprite(itemMathOrb, O);

  var itemKey = buildGrid(16, 16);
  // Key ring
  fillRect(itemKey, 3, 3, 5, 5, C.eGold);
  fillRect(itemKey, 4, 4, 3, 3, C.eYellow);
  setPixel(itemKey, 5, 5, C.eGold); // hole
  // Shaft
  fillRect(itemKey, 8, 5, 5, 2, C.eGold);
  fillRect(itemKey, 8, 5, 5, 1, C.eYellow);
  // Teeth
  fillRect(itemKey, 12, 5, 1, 4, C.eGold);
  fillRect(itemKey, 10, 7, 1, 2, C.eGold);
  outlineSprite(itemKey, O);

  // -------------------------------------------------------------------------
  // SECTION 6: UI ELEMENTS
  // -------------------------------------------------------------------------

  var hpBar = {
    bgColor: "#383838",
    borderColor: "#282828",
    greenColor: "#40C840",
    yellowColor: "#F0C030",
    redColor: "#E04040",
    height: 6,
    getColor: function (ratio) {
      if (ratio > 0.5) return this.greenColor;
      if (ratio > 0.2) return this.yellowColor;
      return this.redColor;
    }
  };

  // -------------------------------------------------------------------------
  // SECTION 7: BATTLE BACKGROUNDS + PLATFORMS
  // -------------------------------------------------------------------------

  function drawBattleBg(ctx, type, width, height) {
    switch (type) {
      case "grass":
        // Sky gradient
        ctx.fillStyle = "#88C8F8";
        ctx.fillRect(0, 0, width, height * 0.5);
        ctx.fillStyle = "#A0D8F8";
        ctx.fillRect(0, height * 0.3, width, height * 0.2);
        // Ground
        ctx.fillStyle = "#68B848";
        ctx.fillRect(0, height * 0.5, width, height * 0.5);
        ctx.fillStyle = "#58A840";
        ctx.fillRect(0, height * 0.55, width, height * 0.45);
        // Grass detail
        ctx.fillStyle = "#78C858";
        for (var gx = 0; gx < width; gx += 20) {
          ctx.fillRect(gx, height * 0.5 + 4, 8, 4);
          ctx.fillRect(gx + 10, height * 0.6, 6, 3);
        }
        // Distant trees
        ctx.fillStyle = "#408030";
        for (var dtx = 0; dtx < width; dtx += 40) {
          ctx.beginPath();
          ctx.arc(dtx + 20, height * 0.5, 18, Math.PI, 0);
          ctx.fill();
        }
        break;

      case "cave":
        ctx.fillStyle = "#383028";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#484038";
        ctx.fillRect(0, height * 0.5, width, height * 0.5);
        // Rock details
        ctx.fillStyle = "#302820";
        for (var cx = 0; cx < width; cx += 30) {
          ctx.fillRect(cx, 0, 12, height * 0.3);
          ctx.fillRect(cx + 15, height * 0.7, 10, height * 0.3);
        }
        // Dim light source
        var lg = ctx.createRadialGradient(width / 2, height * 0.4, 10, width / 2, height * 0.4, width * 0.4);
        lg.addColorStop(0, "rgba(200,180,120,0.15)");
        lg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, width, height);
        break;

      case "water":
        ctx.fillStyle = "#88C8F8";
        ctx.fillRect(0, 0, width, height * 0.45);
        ctx.fillStyle = "#3888D8";
        ctx.fillRect(0, height * 0.45, width, height * 0.55);
        ctx.fillStyle = "#60A8F0";
        for (var wx = 0; wx < width; wx += 24) {
          ctx.fillRect(wx, height * 0.45 + 8, 14, 3);
          ctx.fillRect(wx + 12, height * 0.55, 10, 2);
          ctx.fillRect(wx + 4, height * 0.7, 12, 2);
        }
        // Sandy shore line
        ctx.fillStyle = "#D8C080";
        ctx.fillRect(0, height * 0.43, width, height * 0.04);
        break;

      case "boss":
        // Dark dramatic background
        ctx.fillStyle = "#200828";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#301040";
        ctx.fillRect(0, height * 0.5, width, height * 0.5);
        // Energy effects
        ctx.fillStyle = "#582080";
        for (var bx = 0; bx < width; bx += 16) {
          var bh = Math.abs(Math.sin(bx * 0.05)) * height * 0.2;
          ctx.fillRect(bx, height * 0.5 - bh / 2, 8, bh);
        }
        // Glow
        var bg = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.5);
        bg.addColorStop(0, "rgba(160,80,220,0.2)");
        bg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        // Stars/sparkles
        ctx.fillStyle = "#C090F0";
        for (var sx = 0; sx < 15; sx++) {
          var starX = (sx * 67 + 13) % width;
          var starY = (sx * 43 + 7) % (height * 0.5);
          ctx.fillRect(starX, starY, 2, 2);
        }
        break;

      default:
        // Fallback to grass
        drawBattleBg(ctx, "grass", width, height);
    }
  }

  function drawPlatform(ctx, x, y, isEnemy) {
    var w = isEnemy ? 80 : 96;
    var h = isEnemy ? 16 : 20;
    var baseColor = isEnemy ? "#88A868" : "#A8C888";
    var darkColor = isEnemy ? "#688848" : "#88A868";
    var lightColor = isEnemy ? "#A8C888" : "#C8E0A8";

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, w / 2, h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.ellipse(x, y - 4, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI);
    ctx.fill();
  }

  // -------------------------------------------------------------------------
  // GRID BUILDING HELPERS (used above)
  // -------------------------------------------------------------------------

  function buildGrid(w, h) {
    var grid = [];
    for (var r = 0; r < h; r++) {
      var row = [];
      for (var c = 0; c < w; c++) row.push(null);
      grid.push(row);
    }
    return grid;
  }

  function fillRect(grid, x, y, w, h, color) {
    for (var r = y; r < y + h && r < grid.length; r++) {
      for (var c = x; c < x + w && c < grid[r].length; c++) {
        if (r >= 0 && c >= 0) grid[r][c] = color;
      }
    }
  }

  function setPixel(grid, x, y, color) {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[y].length) {
      grid[y][x] = color;
    }
  }

  function outlineSprite(grid, color) {
    var h = grid.length;
    var w = grid[0].length;
    var marks = [];
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (grid[r][c] && grid[r][c] !== color) {
          // Check all 4 neighbors
          var neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
          ];
          for (var n = 0; n < neighbors.length; n++) {
            var nr = neighbors[n][0], nc = neighbors[n][1];
            if (nr >= 0 && nr < h && nc >= 0 && nc < w && !grid[nr][nc]) {
              marks.push([nr, nc]);
            }
          }
        }
      }
    }
    for (var m = 0; m < marks.length; m++) {
      grid[marks[m][0]][marks[m][1]] = color;
    }
  }

  // -------------------------------------------------------------------------
  // EXPORT: window.Sprites
  // -------------------------------------------------------------------------

  window.Sprites = {
    SCALE: SCALE,
    colors: C,

    drawSprite: drawSprite,
    flipH: flipH,

    player: {
      down: playerDown,
      up: playerUp,
      left: playerLeft,
      right: playerRight,
      walkDown: [playerWalkDown1, playerWalkDown2],
      walkUp: [playerWalkUp1, playerWalkUp2],
      walkLeft: [playerWalkLeft1, playerWalkLeft2],
      walkRight: [playerWalkRight1, playerWalkRight2],
    },

    creatures: {
      flametail:    { front: flametailFront,    overworld: flametailOW },
      blazefang:    { front: blazefangFront,    overworld: blazefangOW },
      aquapup:      { front: aquapupFront,      overworld: aquapupOW },
      tidalfang:    { front: tidalfangFront,    overworld: tidalfangOW },
      thornsprout:  { front: thornsproutFront,  overworld: thornsproutOW },
      thornraptor:  { front: thornraptorFront,  overworld: thornraptorOW },
      sparkling:    { front: sparklingFront,    overworld: sparklingOW },
      voltpounce:   { front: voltpounceFront,   overworld: voltpounceOW },
      geolem:       { front: geolemFront,       overworld: geolemOW },
      mistwisp:     { front: mistwispFront,     overworld: mistwispOW },
      skyclaw:      { front: skyclawFront,      overworld: skyclawOW },
      numbit:       { front: numbitFront,       overworld: numbitOW },
    },

    npcs: {
      professor:  professorDown,
      shopkeeper: shopkeeperDown,
      trainer:    trainerDown,
      healer:     healerDown,
    },

    tiles: {
      grass1:    tileGrass1,
      grass2:    tileGrass2,
      tallGrass: tileTallGrass,
      path:      tilePath,
      water:     tileWater,
      tree:      tileTree,
      wall:      tileWall,
      door:      tileDoor,
      rock:      tileRock,
      bridge:    tileBridge,
      flowers:   tileFlowers,
      floor:     tileFloor,
      counter:   tileCounter,
      bookshelf: tileBookshelf,
      sign:      tileSign,
    },

    items: {
      potion:      itemPotion,
      superPotion: itemSuperPotion,
      mathOrb:     itemMathOrb,
      key:         itemKey,
    },

    ui: {
      hpBar: hpBar,
    },

    drawBattleBg: drawBattleBg,
    drawPlatform: drawPlatform,

    // Convenience: draw a creature in battle position
    drawBattleCreature: function (ctx, creatureName, x, y, isEnemy) {
      var creature = this.creatures[creatureName];
      if (!creature) return;
      var sprite = creature.front;
      var scale = isEnemy ? SCALE - 1 : SCALE;
      drawSprite(ctx, sprite, x, y, scale);
    },

    // Convenience: draw a creature on the overworld
    drawOverworldCreature: function (ctx, creatureName, x, y) {
      var creature = this.creatures[creatureName];
      if (!creature) return;
      drawSprite(ctx, creature.overworld, x, y, SCALE);
    },

    // Draw an animated player frame
    drawPlayer: function (ctx, direction, x, y, frame) {
      var sprite;
      if (typeof frame === "number" && frame >= 0) {
        var walkKey = "walk" + direction.charAt(0).toUpperCase() + direction.slice(1);
        var walkFrames = this.player[walkKey];
        if (walkFrames) {
          sprite = walkFrames[frame % walkFrames.length];
        }
      }
      if (!sprite) {
        sprite = this.player[direction] || this.player.down;
      }
      drawSprite(ctx, sprite, x, y, SCALE);
    },

    // Draw a tile at a grid position
    drawTile: function (ctx, tileName, gridX, gridY) {
      var tile = this.tiles[tileName];
      if (!tile) return;
      drawSprite(ctx, tile, gridX * 16 * SCALE, gridY * 16 * SCALE, SCALE);
    },

    // Draw an NPC
    drawNPC: function (ctx, npcName, x, y) {
      var sprite = this.npcs[npcName];
      if (!sprite) return;
      drawSprite(ctx, sprite, x, y, SCALE);
    },

    // Draw an item
    drawItem: function (ctx, itemName, x, y, scale) {
      var sprite = this.items[itemName];
      if (!sprite) return;
      drawSprite(ctx, sprite, x, y, scale || SCALE);
    },

    // Draw HP bar at position
    drawHPBar: function (ctx, x, y, width, currentHP, maxHP) {
      var ratio = Math.max(0, Math.min(1, currentHP / maxHP));
      var barH = hpBar.height;
      // Background
      ctx.fillStyle = hpBar.borderColor;
      ctx.fillRect(x - 1, y - 1, width + 2, barH + 2);
      ctx.fillStyle = hpBar.bgColor;
      ctx.fillRect(x, y, width, barH);
      // Fill
      ctx.fillStyle = hpBar.getColor(ratio);
      ctx.fillRect(x, y, Math.floor(width * ratio), barH);
    },
  };
})();
