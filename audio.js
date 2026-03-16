/**
 * MathQuest RPG - Procedural Audio System
 * ========================================
 * Generates all sound effects and music using the Web Audio API.
 * No external audio files needed. 8-bit chiptune style.
 *
 * Usage:
 *   window.SFX.init();              // Call after first user interaction
 *   window.SFX.play('correct');     // Play a one-shot sound
 *   window.SFX.playMusic('battleTheme');
 *   window.SFX.stopMusic(500);
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------
  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;

  let masterVol = 0.7;
  let sfxVol = 0.8;
  let musicVol = 0.5;
  let muted = false;
  let previousMasterVol = 0.7;

  let currentMusic = null;
  let musicPlaying = false;
  let musicPaused = false;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVol;
      masterGain.connect(ctx.destination);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = sfxVol;
      sfxGain.connect(masterGain);

      musicGain = ctx.createGain();
      musicGain.gain.value = musicVol;
      musicGain.connect(masterGain);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function now() {
    return ctx.currentTime;
  }

  /**
   * Create an oscillator connected through a gain node.
   * Returns { osc, gain } for further parameter scheduling.
   */
  function voice(type, freq, startTime, duration, volume, dest) {
    const osc = ctx.createOscillator();
    const gn = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gn.gain.setValueAtTime(0, startTime);
    osc.connect(gn);
    gn.connect(dest || sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    return { osc: osc, gain: gn };
  }

  /** ADSR envelope helper. */
  function adsr(gainNode, startTime, a, d, s, r, peak) {
    peak = peak !== undefined ? peak : 1;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + a);
    gainNode.gain.linearRampToValueAtTime(peak * s, startTime + a + d);
    gainNode.gain.setValueAtTime(peak * s, startTime + a + d + 0.001);
    gainNode.gain.linearRampToValueAtTime(0, startTime + a + d + r);
  }

  /** Play a chiptune note with automatic ADSR shaping. */
  function chipNote(type, freq, start, dur, vol, dest) {
    const v = voice(type, freq, start, dur, vol, dest || sfxGain);
    const attack = Math.min(0.01, dur * 0.1);
    const decay = dur * 0.1;
    const sustain = 0.6;
    const release = Math.min(0.08, dur * 0.3);
    adsr(v.gain, start, attack, decay, sustain, release, vol || 0.3);
    return v;
  }

  /** Create a white-noise buffer source. */
  function noiseSource(startTime, duration, dest) {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, startTime);
    src.connect(gn);
    gn.connect(dest || sfxGain);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
    return { src: src, gain: gn };
  }

  // ---------------------------------------------------------------------------
  // Note-name to frequency lookup table
  // ---------------------------------------------------------------------------
  const NOTE_FREQ = {};
  (function buildNoteTable() {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let oct = 0; oct <= 8; oct++) {
      for (let i = 0; i < 12; i++) {
        const noteNum = (oct + 1) * 12 + i;
        const freq = 440 * Math.pow(2, (noteNum - 69) / 12);
        NOTE_FREQ[names[i] + oct] = freq;
      }
    }
  })();

  function n(name) {
    return NOTE_FREQ[name] || 440;
  }

  // ---------------------------------------------------------------------------
  // Sound Effect Definitions
  // ---------------------------------------------------------------------------
  const sounds = {};

  // ======================== UI SOUNDS ========================================

  sounds.select = function () {
    const t = now();
    chipNote('square', 1200, t, 0.06, 0.2);
    chipNote('square', 1600, t + 0.03, 0.06, 0.15);
  };

  sounds.confirm = function () {
    const t = now();
    chipNote('square', 800, t, 0.06, 0.25);
    chipNote('square', 1000, t + 0.05, 0.08, 0.2);
  };

  sounds.cancel = function () {
    const t = now();
    chipNote('square', 600, t, 0.08, 0.2);
    chipNote('square', 400, t + 0.06, 0.1, 0.2);
  };

  sounds.text = function () {
    const t = now();
    chipNote('square', 1400 + Math.random() * 200, t, 0.03, 0.08);
  };

  sounds.menuOpen = function () {
    const t = now();
    const freqs = [523, 659, 784, 1047]; // C5 E5 G5 C6
    freqs.forEach(function (f, i) {
      chipNote('square', f, t + i * 0.04, 0.06, 0.2);
    });
  };

  sounds.menuClose = function () {
    const t = now();
    const freqs = [1047, 784, 659, 523];
    freqs.forEach(function (f, i) {
      chipNote('square', f, t + i * 0.04, 0.06, 0.18);
    });
  };

  // ======================== BATTLE SOUNDS ====================================

  sounds.battleStart = function () {
    const t = now();
    // Dramatic 4-note ascending: da-da-da-DUM!
    chipNote('square', n('E4'), t, 0.12, 0.35);
    chipNote('square', n('E4'), t + 0.15, 0.12, 0.35);
    chipNote('square', n('E4'), t + 0.30, 0.12, 0.35);
    chipNote('square', n('A4'), t + 0.45, 0.35, 0.4);
    chipNote('square', n('E5'), t + 0.45, 0.35, 0.25);
    // Bass accent
    chipNote('sawtooth', n('A2'), t + 0.45, 0.35, 0.2);
    // Noise sweep for drama
    const ns = noiseSource(t, 0.08, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.setValueAtTime(3000, t);
    filt.frequency.linearRampToValueAtTime(8000, t + 0.05);
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0.15, t);
    ns.gain.gain.linearRampToValueAtTime(0, t + 0.08);
  };

  sounds.hit = function () {
    const t = now();
    // Noise burst for impact
    const ns = noiseSource(t, 0.12, sfxGain);
    ns.gain.gain.setValueAtTime(0.35, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    // Low thud
    const v = voice('sine', 150, t, 0.15, 0.3, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    v.gain.gain.setValueAtTime(0.3, t);
    v.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
  };

  sounds.hitSuper = function () {
    const t = now();
    // Strong noise impact
    const ns = noiseSource(t, 0.18, sfxGain);
    ns.gain.gain.setValueAtTime(0.4, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    // Heavy impact body
    const v = voice('sine', 200, t, 0.2, 0.35, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    v.gain.gain.setValueAtTime(0.35, t);
    v.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    // High pitch accent flashes
    chipNote('square', 2400, t + 0.02, 0.1, 0.25);
    chipNote('square', 3200, t + 0.06, 0.1, 0.2);
  };

  sounds.hitWeak = function () {
    const t = now();
    // Dull thud
    const v = voice('sine', 100, t, 0.15, 0.2, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
    v.gain.gain.setValueAtTime(0.2, t);
    v.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    // Muffled noise
    const ns = noiseSource(t, 0.08, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 600;
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0.15, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
  };

  sounds.miss = function () {
    const t = now();
    // Whoosh: filtered noise sweep
    const ns = noiseSource(t, 0.25, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 2;
    filt.frequency.setValueAtTime(2000, t);
    filt.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0, t);
    ns.gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    ns.gain.gain.linearRampToValueAtTime(0, t + 0.25);
  };

  sounds.critical = function () {
    const t = now();
    // Initial flash noise
    const ns = noiseSource(t, 0.06, sfxGain);
    ns.gain.gain.setValueAtTime(0.45, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    // Heavy sine impact
    const v = voice('sine', 250, t, 0.15, 0.35, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    v.gain.gain.setValueAtTime(0.35, t);
    v.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    // High accent pair
    chipNote('square', 2800, t + 0.01, 0.08, 0.3);
    chipNote('square', 3600, t + 0.04, 0.12, 0.25);
    // Second impact
    const ns2 = noiseSource(t + 0.08, 0.1, sfxGain);
    ns2.gain.gain.setValueAtTime(0.3, t + 0.08);
    ns2.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
  };

  sounds.faint = function () {
    const t = now();
    // Sad descending pitch slide
    const v = voice('square', 600, t, 0.8, 0.25, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(80, t + 0.8);
    v.gain.gain.setValueAtTime(0.25, t);
    v.gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
    v.gain.gain.linearRampToValueAtTime(0, t + 0.8);
    // Subtle second voice trailing behind
    const v2 = voice('triangle', 400, t + 0.1, 0.6, 0.15, sfxGain);
    v2.osc.frequency.exponentialRampToValueAtTime(60, t + 0.7);
    v2.gain.gain.setValueAtTime(0.15, t + 0.1);
    v2.gain.gain.linearRampToValueAtTime(0, t + 0.7);
  };

  sounds.catch = function () {
    const t = now();
    // Metallic wobble with LFO vibrato
    const v = voice('square', 800, t, 0.3, 0.2, sfxGain);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 20;
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(v.osc.frequency);
    lfo.start(t);
    lfo.stop(t + 0.3);
    v.gain.gain.setValueAtTime(0.2, t);
    v.gain.gain.linearRampToValueAtTime(0.15, t + 0.15);
    v.gain.gain.linearRampToValueAtTime(0, t + 0.3);
    // Click accent at start
    chipNote('square', 2000, t, 0.02, 0.2);
  };

  sounds.catchSuccess = function () {
    const t = now();
    // Cheerful ascending jingle
    const notes = [n('C5'), n('E5'), n('G5'), n('C6'), n('E6')];
    notes.forEach(function (f, i) {
      chipNote('square', f, t + i * 0.1, 0.12, 0.25);
    });
    // Warm harmony pad
    chipNote('triangle', n('C4'), t, 0.5, 0.15);
    chipNote('triangle', n('G4'), t + 0.2, 0.4, 0.15);
    // Sparkle noise at the end
    const ns = noiseSource(t + 0.35, 0.2, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 6000;
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0.08, t + 0.35);
    ns.gain.gain.linearRampToValueAtTime(0, t + 0.55);
  };

  sounds.catchFail = function () {
    const t = now();
    // Breaking pop noise
    const ns = noiseSource(t, 0.15, sfxGain);
    ns.gain.gain.setValueAtTime(0.3, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    // Descending pitch blip
    const v = voice('square', 1200, t, 0.2, 0.2, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    v.gain.gain.setValueAtTime(0.2, t);
    v.gain.gain.linearRampToValueAtTime(0, t + 0.2);
  };

  sounds.healSound = function () {
    const t = now();
    // Gentle ascending chime with triangle waves
    const notes = [n('C5'), n('E5'), n('G5'), n('B5'), n('C6')];
    notes.forEach(function (f, i) {
      chipNote('triangle', f, t + i * 0.08, 0.15, 0.2);
    });
    // Soft shimmer at the peak
    chipNote('sine', n('E6'), t + 0.35, 0.3, 0.1);
    chipNote('sine', n('G6'), t + 0.4, 0.25, 0.08);
  };

  sounds.run = function () {
    const t = now();
    // Quick descending footstep-like sounds
    for (let i = 0; i < 5; i++) {
      const ns = noiseSource(t + i * 0.07, 0.04, sfxGain);
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 1500 - i * 200;
      ns.src.disconnect();
      ns.src.connect(filt);
      filt.connect(ns.gain);
      ns.gain.gain.setValueAtTime(0.15, t + i * 0.07);
      ns.gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.07 + 0.04);
      chipNote('square', 500 - i * 60, t + i * 0.07, 0.03, 0.1);
    }
  };

  // ======================== MATH PROBLEM SOUNDS ==============================

  sounds.correct = function () {
    const t = now();
    // Bright, satisfying two-note chime (Mario coin inspired)
    chipNote('square', n('E5'), t, 0.08, 0.3);
    chipNote('square', n('E6'), t + 0.08, 0.25, 0.3);
    // Harmonic shimmer
    chipNote('square', n('B5'), t + 0.08, 0.2, 0.15);
    chipNote('triangle', n('E6'), t + 0.1, 0.2, 0.1);
  };

  sounds.wrong = function () {
    const t = now();
    // Gentle buzzer - soft triangle waves, not harsh at all
    chipNote('triangle', n('E3'), t, 0.2, 0.12);
    chipNote('triangle', n('D#3'), t + 0.12, 0.25, 0.1);
    // Very soft low hum underneath
    const v = voice('sine', 120, t, 0.3, 0.08, sfxGain);
    v.gain.gain.setValueAtTime(0.08, t);
    v.gain.gain.linearRampToValueAtTime(0, t + 0.3);
  };

  sounds.timerTick = function () {
    const t = now();
    chipNote('square', 1200, t, 0.02, 0.1);
  };

  sounds.timerWarning = function () {
    const t = now();
    chipNote('square', 1800, t, 0.06, 0.2);
    chipNote('square', 1800, t + 0.12, 0.06, 0.2);
  };

  sounds.streak3 = function () {
    const t = now();
    // Short "nice!" jingle
    chipNote('square', n('C5'), t, 0.08, 0.25);
    chipNote('square', n('E5'), t + 0.08, 0.08, 0.25);
    chipNote('square', n('G5'), t + 0.16, 0.15, 0.25);
  };

  sounds.streak5 = function () {
    const t = now();
    // More exciting jingle
    chipNote('square', n('C5'), t, 0.07, 0.28);
    chipNote('square', n('E5'), t + 0.07, 0.07, 0.28);
    chipNote('square', n('G5'), t + 0.14, 0.07, 0.28);
    chipNote('square', n('C6'), t + 0.21, 0.2, 0.3);
    chipNote('triangle', n('C4'), t + 0.14, 0.25, 0.15);
  };

  sounds.streak10 = function () {
    const t = now();
    // Epic short fanfare
    chipNote('square', n('C5'), t, 0.06, 0.3);
    chipNote('square', n('E5'), t + 0.06, 0.06, 0.3);
    chipNote('square', n('G5'), t + 0.12, 0.06, 0.3);
    chipNote('square', n('C6'), t + 0.18, 0.06, 0.3);
    chipNote('square', n('E6'), t + 0.24, 0.3, 0.35);
    // Harmony layer
    chipNote('square', n('G5'), t + 0.24, 0.3, 0.2);
    chipNote('triangle', n('C4'), t + 0.18, 0.35, 0.15);
    chipNote('sawtooth', n('C3'), t + 0.18, 0.35, 0.12);
    // Sparkle noise tail
    const ns = noiseSource(t + 0.3, 0.25, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 7000;
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0.06, t + 0.3);
    ns.gain.gain.linearRampToValueAtTime(0, t + 0.55);
  };

  sounds.hintUsed = function () {
    const t = now();
    // Mysterious descending chime
    chipNote('triangle', n('B5'), t, 0.12, 0.2);
    chipNote('triangle', n('G5'), t + 0.1, 0.12, 0.2);
    chipNote('triangle', n('E5'), t + 0.2, 0.12, 0.18);
    chipNote('triangle', n('C5'), t + 0.3, 0.2, 0.15);
  };

  // ======================== OVERWORLD SOUNDS =================================

  sounds.step = function () {
    const t = now();
    // Soft grass thump
    const ns = noiseSource(t, 0.06, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 800;
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0.08, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
  };

  sounds.bump = function () {
    const t = now();
    // Dull bonk
    const v = voice('sine', 200, t, 0.1, 0.2, sfxGain);
    v.osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    v.gain.gain.setValueAtTime(0.2, t);
    v.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    // Muffled noise thud
    const ns = noiseSource(t, 0.06, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 500;
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0.2, t);
    ns.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
  };

  sounds.door = function () {
    const t = now();
    // Creak: swept sawtooth oscillator
    const v = voice('sawtooth', 300, t, 0.3, 0.15, sfxGain);
    v.osc.frequency.setValueAtTime(300, t);
    v.osc.frequency.linearRampToValueAtTime(500, t + 0.15);
    v.osc.frequency.linearRampToValueAtTime(350, t + 0.3);
    v.gain.gain.setValueAtTime(0, t);
    v.gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    v.gain.gain.linearRampToValueAtTime(0.1, t + 0.15);
    v.gain.gain.linearRampToValueAtTime(0, t + 0.3);
    // Filtered noise for creak texture
    const ns = noiseSource(t, 0.3, sfxGain);
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 400;
    filt.Q.value = 5;
    ns.src.disconnect();
    ns.src.connect(filt);
    filt.connect(ns.gain);
    ns.gain.gain.setValueAtTime(0, t);
    ns.gain.gain.linearRampToValueAtTime(0.06, t + 0.05);
    ns.gain.gain.linearRampToValueAtTime(0, t + 0.3);
  };

  sounds.npcChat = function () {
    const t = now();
    // Attention-getting two-tone blip
    chipNote('square', n('A5'), t, 0.06, 0.22);
    chipNote('square', n('E6'), t + 0.06, 0.1, 0.22);
  };

  // ======================== PROGRESSION SOUNDS ===============================

  sounds.levelUp = function () {
    const t = now();
    // Triumphant ascending arpeggio (~1.5 seconds)
    const melody = [n('C4'), n('E4'), n('G4'), n('C5'), n('E5'), n('G5'), n('C6')];
    melody.forEach(function (f, i) {
      chipNote('square', f, t + i * 0.12, 0.14, 0.25);
    });
    // Sustained major chord at top
    chipNote('square', n('C6'), t + 0.84, 0.5, 0.3);
    chipNote('square', n('E6'), t + 0.84, 0.5, 0.2);
    chipNote('square', n('G5'), t + 0.84, 0.5, 0.15);
    // Bass foundation
    chipNote('sawtooth', n('C3'), t + 0.6, 0.7, 0.15);
    chipNote('triangle', n('G3'), t + 0.72, 0.6, 0.12);
  };

  sounds.evolve = function () {
    const t = now();
    // Dramatic sustained build + resolution (~2 seconds)
    // Rapid arpeggios building intensity
    const buildNotes = [n('C4'), n('E4'), n('G4'), n('C5'), n('E5'), n('G5')];
    for (let rep = 0; rep < 3; rep++) {
      buildNotes.forEach(function (f, i) {
        chipNote('square', f, t + rep * 0.3 + i * 0.05, 0.06, 0.15 + rep * 0.05);
      });
    }
    // Grand resolution chord
    chipNote('square', n('C6'), t + 1.2, 0.6, 0.35);
    chipNote('square', n('E6'), t + 1.2, 0.6, 0.25);
    chipNote('square', n('G6'), t + 1.3, 0.5, 0.2);
    chipNote('triangle', n('C5'), t + 1.2, 0.7, 0.2);
    chipNote('sawtooth', n('C3'), t + 1.2, 0.7, 0.15);
    // Sparkle at the end
    const sparkle = [n('G6'), n('E7'), n('C7'), n('G7')];
    sparkle.forEach(function (f, i) {
      chipNote('square', f, t + 1.5 + i * 0.08, 0.1, 0.12);
    });
  };

  sounds.badge = function () {
    const t = now();
    // Triumphant fanfare like getting a gym badge
    chipNote('square', n('G4'), t, 0.15, 0.25);
    chipNote('square', n('G4'), t + 0.15, 0.1, 0.25);
    chipNote('square', n('G4'), t + 0.25, 0.1, 0.25);
    chipNote('square', n('E5'), t + 0.4, 0.3, 0.3);
    // Harmony underneath
    chipNote('square', n('C5'), t + 0.4, 0.3, 0.2);
    chipNote('triangle', n('G3'), t + 0.4, 0.4, 0.15);
    // Final triumphant chord
    chipNote('square', n('C5'), t + 0.75, 0.4, 0.3);
    chipNote('square', n('E5'), t + 0.75, 0.4, 0.25);
    chipNote('square', n('G5'), t + 0.75, 0.4, 0.2);
    chipNote('sawtooth', n('C3'), t + 0.75, 0.5, 0.15);
  };

  sounds.xpTick = function () {
    const t = now();
    // Rapid ascending tick for XP bar filling
    chipNote('square', 2000 + Math.random() * 500, t, 0.025, 0.1);
  };

  sounds.goldGet = function () {
    const t = now();
    // Classic coin collection sound
    chipNote('square', n('B5'), t, 0.06, 0.25);
    chipNote('square', n('E6'), t + 0.06, 0.15, 0.25);
  };

  sounds.newArea = function () {
    const t = now();
    // Majestic short chord
    chipNote('square', n('C5'), t, 0.5, 0.2);
    chipNote('square', n('E5'), t, 0.5, 0.18);
    chipNote('square', n('G5'), t, 0.5, 0.16);
    chipNote('triangle', n('C4'), t, 0.6, 0.15);
    chipNote('sawtooth', n('C3'), t, 0.6, 0.1);
    // Trailing shimmer
    chipNote('triangle', n('G5'), t + 0.2, 0.4, 0.1);
    chipNote('triangle', n('E6'), t + 0.3, 0.3, 0.08);
  };

  sounds.save = function () {
    const t = now();
    // Classic save jingle
    chipNote('square', n('D5'), t, 0.1, 0.22);
    chipNote('square', n('A5'), t + 0.1, 0.1, 0.22);
    chipNote('square', n('D6'), t + 0.2, 0.1, 0.25);
    chipNote('square', n('A5'), t + 0.3, 0.1, 0.22);
    chipNote('square', n('F#5'), t + 0.4, 0.2, 0.25);
    chipNote('triangle', n('D4'), t + 0.3, 0.3, 0.15);
  };

  // ---------------------------------------------------------------------------
  // Music Sequencer
  // ---------------------------------------------------------------------------

  /**
   * Generic looping music sequencer.
   * Takes a BPM and an array of voice definitions, each containing a wave type
   * and an array of { note, dur, vol } events. Loops seamlessly.
   * Returns { stop() }.
   */
  function sequenceMusic(bpm, voices) {
    const beatDur = 60 / bpm;
    let running = true;
    let timers = [];

    function scheduleVoice(vDef) {
      if (!running) return;
      const time = now() + 0.05;
      let totalBeats = 0;

      vDef.notes.forEach(function (ev) {
        if (!running) return;
        const noteStart = time + totalBeats * beatDur;
        const noteDur = ev.dur * beatDur;

        if (ev.note === 0 || ev.note === null) {
          totalBeats += ev.dur;
          return;
        }

        const freq = typeof ev.note === 'string' ? n(ev.note) : ev.note;
        const vol = ev.vol !== undefined ? ev.vol : 0.18;
        chipNote(vDef.type || 'square', freq, noteStart, noteDur * 0.9, vol, musicGain);
        totalBeats += ev.dur;
      });

      // Schedule the next loop iteration slightly early for seamless looping
      const loopDurationMs = totalBeats * beatDur * 1000;
      const timer = setTimeout(function () {
        if (running) scheduleVoice(vDef);
      }, loopDurationMs - 100);
      timers.push(timer);
    }

    voices.forEach(function (v) {
      scheduleVoice(v);
    });

    return {
      stop: function () {
        running = false;
        timers.forEach(clearTimeout);
        timers = [];
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Music Track Definitions
  // ---------------------------------------------------------------------------
  const musicTracks = {};

  // --- Title Theme: C major, 120 BPM, adventurous and inviting ---
  musicTracks.titleTheme = function () {
    return sequenceMusic(120, [
      // Melody (square wave)
      {
        type: 'square',
        notes: [
          // Bar 1
          { note: 'C5', dur: 1, vol: 0.18 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'G5', dur: 0.5, vol: 0.16 },
          { note: 'A5', dur: 1, vol: 0.18 },
          { note: 'G5', dur: 1, vol: 0.16 },
          // Bar 2
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'F5', dur: 0.5, vol: 0.16 },
          { note: 'G5', dur: 1, vol: 0.18 },
          { note: 'E5', dur: 1, vol: 0.16 },
          { note: 'C5', dur: 1, vol: 0.18 },
          // Bar 3
          { note: 'D5', dur: 0.5, vol: 0.16 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'F5', dur: 1, vol: 0.18 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 0.5, vol: 0.16 },
          { note: 'C5', dur: 1, vol: 0.16 },
          // Bar 4
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'G5', dur: 0.5, vol: 0.16 },
          { note: 'C6', dur: 1.5, vol: 0.2 },
          { note: 'B5', dur: 0.5, vol: 0.16 },
          { note: 'A5', dur: 0.5, vol: 0.16 },
          { note: 'G5', dur: 0.5, vol: 0.16 },
          // Bar 5
          { note: 'A5', dur: 1, vol: 0.18 },
          { note: 'G5', dur: 0.5, vol: 0.16 },
          { note: 'F5', dur: 0.5, vol: 0.16 },
          { note: 'E5', dur: 1, vol: 0.18 },
          { note: 'D5', dur: 1, vol: 0.16 },
          // Bar 6
          { note: 'C5', dur: 1, vol: 0.18 },
          { note: 'D5', dur: 0.5, vol: 0.16 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'G5', dur: 1, vol: 0.18 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'C5', dur: 0.5, vol: 0.16 },
          // Bar 7
          { note: 'D5', dur: 1, vol: 0.16 },
          { note: 'F5', dur: 1, vol: 0.18 },
          { note: 'E5', dur: 1, vol: 0.18 },
          { note: 'D5', dur: 1, vol: 0.16 },
          // Bar 8
          { note: 'C5', dur: 2, vol: 0.2 },
          { note: null, dur: 1, vol: 0 },
          { note: 'G4', dur: 0.5, vol: 0.14 },
          { note: 'B4', dur: 0.5, vol: 0.14 },
        ]
      },
      // Bass line (triangle wave)
      {
        type: 'triangle',
        notes: [
          { note: 'C3', dur: 2, vol: 0.2 },
          { note: 'G2', dur: 2, vol: 0.18 },
          { note: 'A2', dur: 2, vol: 0.18 },
          { note: 'E2', dur: 2, vol: 0.18 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'G2', dur: 2, vol: 0.18 },
          { note: 'C3', dur: 2, vol: 0.2 },
          { note: 'G2', dur: 2, vol: 0.18 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'C3', dur: 2, vol: 0.2 },
          { note: 'A2', dur: 2, vol: 0.18 },
          { note: 'E2', dur: 2, vol: 0.18 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'G2', dur: 2, vol: 0.2 },
          { note: 'C3', dur: 3, vol: 0.2 },
          { note: null, dur: 1, vol: 0 },
        ]
      }
    ]);
  };

  // --- Overworld Theme: G major, 110 BPM, curious and upbeat ---
  musicTracks.overworldTheme = function () {
    return sequenceMusic(110, [
      {
        type: 'square',
        notes: [
          // Bar 1
          { note: 'G4', dur: 0.5, vol: 0.16 },
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'B4', dur: 1, vol: 0.18 },
          { note: 'D5', dur: 0.5, vol: 0.16 },
          { note: 'B4', dur: 0.5, vol: 0.16 },
          { note: 'A4', dur: 1, vol: 0.16 },
          // Bar 2
          { note: 'G4', dur: 0.5, vol: 0.16 },
          { note: 'B4', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 0.5, vol: 0.18 },
          { note: 'E5', dur: 0.5, vol: 0.18 },
          { note: 'D5', dur: 1, vol: 0.18 },
          { note: 'B4', dur: 1, vol: 0.16 },
          // Bar 3
          { note: 'C5', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 0.5, vol: 0.16 },
          { note: 'E5', dur: 1, vol: 0.18 },
          { note: 'D5', dur: 0.5, vol: 0.16 },
          { note: 'C5', dur: 0.5, vol: 0.16 },
          { note: 'B4', dur: 1, vol: 0.16 },
          // Bar 4
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'B4', dur: 0.5, vol: 0.16 },
          { note: 'G4', dur: 1.5, vol: 0.18 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'F#4', dur: 0.5, vol: 0.14 },
          { note: 'G4', dur: 0.5, vol: 0.14 },
          // Bar 5
          { note: 'B4', dur: 1, vol: 0.18 },
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'G4', dur: 0.5, vol: 0.16 },
          { note: 'E5', dur: 1, vol: 0.18 },
          { note: 'D5', dur: 1, vol: 0.16 },
          // Bar 6
          { note: 'C5', dur: 0.5, vol: 0.16 },
          { note: 'B4', dur: 0.5, vol: 0.16 },
          { note: 'A4', dur: 1, vol: 0.18 },
          { note: 'B4', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 0.5, vol: 0.18 },
          { note: 'G5', dur: 1, vol: 0.2 },
          // Bar 7
          { note: 'F#5', dur: 0.5, vol: 0.16 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 1, vol: 0.18 },
          { note: 'B4', dur: 1, vol: 0.16 },
          { note: 'A4', dur: 1, vol: 0.16 },
          // Bar 8
          { note: 'G4', dur: 2, vol: 0.2 },
          { note: null, dur: 1, vol: 0 },
          { note: 'D4', dur: 0.5, vol: 0.14 },
          { note: 'F#4', dur: 0.5, vol: 0.14 },
        ]
      },
      {
        type: 'triangle',
        notes: [
          { note: 'G2', dur: 2, vol: 0.2 },
          { note: 'D2', dur: 2, vol: 0.18 },
          { note: 'G2', dur: 2, vol: 0.2 },
          { note: 'E2', dur: 2, vol: 0.18 },
          { note: 'C3', dur: 2, vol: 0.18 },
          { note: 'D3', dur: 2, vol: 0.18 },
          { note: 'G2', dur: 2, vol: 0.2 },
          { note: 'D2', dur: 2, vol: 0.18 },
          { note: 'G2', dur: 2, vol: 0.2 },
          { note: 'C3', dur: 2, vol: 0.18 },
          { note: 'A2', dur: 2, vol: 0.18 },
          { note: 'D3', dur: 2, vol: 0.2 },
          { note: 'D3', dur: 2, vol: 0.2 },
          { note: 'G2', dur: 3, vol: 0.2 },
          { note: null, dur: 1, vol: 0 },
        ]
      }
    ]);
  };

  // --- Battle Theme: A minor, 140 BPM, intense and exciting ---
  musicTracks.battleTheme = function () {
    return sequenceMusic(140, [
      // Lead melody
      {
        type: 'square',
        notes: [
          // Bar 1
          { note: 'A4', dur: 0.5, vol: 0.2 },
          { note: 'C5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'A5', dur: 0.5, vol: 0.22 },
          { note: 'G5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.2 },
          { note: 'F5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.2 },
          // Bar 2
          { note: 'D5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.2 },
          { note: 'F5', dur: 0.5, vol: 0.22 },
          { note: 'E5', dur: 0.5, vol: 0.2 },
          { note: 'D5', dur: 0.5, vol: 0.2 },
          { note: 'C5', dur: 0.5, vol: 0.2 },
          { note: 'B4', dur: 0.5, vol: 0.2 },
          { note: 'C5', dur: 0.5, vol: 0.2 },
          // Bar 3
          { note: 'A4', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'A5', dur: 1, vol: 0.24 },
          { note: 'G5', dur: 0.5, vol: 0.2 },
          { note: 'F5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 1, vol: 0.22 },
          // Bar 4
          { note: 'D5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.2 },
          { note: 'F5', dur: 1, vol: 0.22 },
          { note: 'E5', dur: 1, vol: 0.22 },
          { note: 'C5', dur: 0.5, vol: 0.2 },
          { note: 'A4', dur: 0.5, vol: 0.18 },
        ]
      },
      // Driving bass line (sawtooth for edge)
      {
        type: 'sawtooth',
        notes: [
          // Bar 1
          { note: 'A2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'A2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'A2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'G2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          // Bar 2
          { note: 'F2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'F2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'E2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'E2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          // Bar 3
          { note: 'A2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'A2', dur: 0.5, vol: 0.14 },
          { note: 'C3', dur: 0.5, vol: 0.14 },
          { note: 'G2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'F2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          // Bar 4
          { note: 'D2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'F2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'E2', dur: 1, vol: 0.16 },
          { note: 'A2', dur: 0.5, vol: 0.14 },
          { note: null, dur: 0.5, vol: 0 },
        ]
      },
      // Arpeggio accompaniment (triangle, quieter)
      {
        type: 'triangle',
        notes: [
          { note: 'E4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'C5', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'E4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'C5', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },

          { note: 'E4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'C5', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'D4', dur: 0.25, vol: 0.1 },
          { note: 'G4', dur: 0.25, vol: 0.1 },
          { note: 'B4', dur: 0.25, vol: 0.1 },
          { note: 'G4', dur: 0.25, vol: 0.1 },

          { note: 'F4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'C5', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'E4', dur: 0.25, vol: 0.1 },
          { note: 'G4', dur: 0.25, vol: 0.1 },
          { note: 'B4', dur: 0.25, vol: 0.1 },
          { note: 'G4', dur: 0.25, vol: 0.1 },

          { note: 'D4', dur: 0.25, vol: 0.1 },
          { note: 'F4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'F4', dur: 0.25, vol: 0.1 },
          { note: 'E4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
          { note: 'E4', dur: 0.25, vol: 0.1 },
          { note: 'A4', dur: 0.25, vol: 0.1 },
        ]
      }
    ]);
  };

  // --- Boss Theme: D minor, 150 BPM, dramatic with heavy bass ---
  musicTracks.bossTheme = function () {
    return sequenceMusic(150, [
      // Aggressive melody
      {
        type: 'square',
        notes: [
          // Bar 1
          { note: 'D5', dur: 0.5, vol: 0.22 },
          { note: 'F5', dur: 0.25, vol: 0.2 },
          { note: 'D5', dur: 0.25, vol: 0.2 },
          { note: 'A5', dur: 0.5, vol: 0.24 },
          { note: 'G5', dur: 0.5, vol: 0.22 },
          { note: 'F5', dur: 0.25, vol: 0.2 },
          { note: 'E5', dur: 0.25, vol: 0.2 },
          { note: 'D5', dur: 0.5, vol: 0.22 },
          { note: 'C5', dur: 0.25, vol: 0.2 },
          { note: 'D5', dur: 0.25, vol: 0.2 },
          // Bar 2
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'F5', dur: 0.5, vol: 0.22 },
          { note: 'G5', dur: 0.5, vol: 0.22 },
          { note: 'A5', dur: 0.5, vol: 0.24 },
          { note: 'A#5', dur: 0.5, vol: 0.24 },
          { note: 'A5', dur: 0.5, vol: 0.22 },
          { note: 'G5', dur: 0.25, vol: 0.2 },
          { note: 'F5', dur: 0.25, vol: 0.2 },
          // Bar 3
          { note: 'D5', dur: 0.5, vol: 0.22 },
          { note: 'A5', dur: 1, vol: 0.24 },
          { note: 'G5', dur: 0.5, vol: 0.22 },
          { note: 'F5', dur: 0.5, vol: 0.22 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'D5', dur: 0.5, vol: 0.2 },
          // Bar 4
          { note: 'C5', dur: 0.5, vol: 0.2 },
          { note: 'D5', dur: 0.5, vol: 0.22 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'F5', dur: 0.5, vol: 0.22 },
          { note: 'D5', dur: 1, vol: 0.24 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'A4', dur: 0.5, vol: 0.18 },
        ]
      },
      // Heavy pulsing bass (sawtooth)
      {
        type: 'sawtooth',
        notes: [
          { note: 'D2', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'D2', dur: 0.25, vol: 0.16 },
          { note: 'D2', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'D2', dur: 0.25, vol: 0.16 },
          { note: 'D2', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'C2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'A#1', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },

          { note: 'A1', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'A1', dur: 0.25, vol: 0.16 },
          { note: 'A1', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'G1', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'F1', dur: 0.25, vol: 0.18 },
          { note: 'D2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'E2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },

          { note: 'D2', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'D2', dur: 0.25, vol: 0.16 },
          { note: 'D2', dur: 0.25, vol: 0.18 },
          { note: 'F2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'G2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'A2', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'D2', dur: 0.25, vol: 0.18 },
          { note: null, dur: 0.25, vol: 0 },

          { note: 'C2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'D2', dur: 0.5, vol: 0.18 },
          { note: 'F2', dur: 0.25, vol: 0.16 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'D2', dur: 0.5, vol: 0.2 },
          { note: null, dur: 0.5, vol: 0 },
          { note: 'A1', dur: 0.5, vol: 0.16 },
        ]
      }
    ]);
  };

  // --- Victory Theme: C major, 130 BPM, triumphant fanfare ---
  musicTracks.victoryTheme = function () {
    return sequenceMusic(130, [
      {
        type: 'square',
        notes: [
          // Triumphant fanfare
          { note: 'C5', dur: 0.5, vol: 0.22 },
          { note: 'C5', dur: 0.25, vol: 0.2 },
          { note: 'C5', dur: 0.25, vol: 0.2 },
          { note: 'C5', dur: 0.5, vol: 0.22 },
          { note: 'G#4', dur: 0.5, vol: 0.2 },
          { note: 'A#4', dur: 0.5, vol: 0.2 },
          { note: 'C5', dur: 0.5, vol: 0.22 },
          { note: null, dur: 0.25, vol: 0 },
          { note: 'A#4', dur: 0.25, vol: 0.18 },
          { note: 'C5', dur: 1.5, vol: 0.25 },
          // Second phrase
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'E5', dur: 0.25, vol: 0.2 },
          { note: 'E5', dur: 0.25, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'D5', dur: 0.5, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'F5', dur: 0.5, vol: 0.22 },
          { note: 'E5', dur: 0.5, vol: 0.22 },
          { note: 'D5', dur: 0.5, vol: 0.2 },
          { note: 'C5', dur: 1.5, vol: 0.25 },
          // Pickup
          { note: null, dur: 0.5, vol: 0 },
          { note: 'G4', dur: 0.5, vol: 0.18 },
        ]
      },
      {
        type: 'triangle',
        notes: [
          { note: 'C3', dur: 2, vol: 0.2 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'C3', dur: 1.5, vol: 0.2 },
          { note: 'G2', dur: 1.5, vol: 0.18 },
          { note: 'C3', dur: 2, vol: 0.2 },
          { note: 'G2', dur: 2, vol: 0.18 },
          { note: 'F2', dur: 1, vol: 0.18 },
          { note: 'G2', dur: 1, vol: 0.18 },
          { note: 'C3', dur: 2, vol: 0.2 },
          { note: null, dur: 1, vol: 0 },
        ]
      }
    ]);
  };

  // --- Town Theme: F major, 90 BPM, peaceful and warm ---
  musicTracks.townTheme = function () {
    return sequenceMusic(90, [
      // Soft triangle lead for peaceful feel
      {
        type: 'triangle',
        notes: [
          // Bar 1
          { note: 'F4', dur: 1, vol: 0.18 },
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'C5', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 1, vol: 0.18 },
          { note: 'C5', dur: 1, vol: 0.16 },
          // Bar 2
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'G4', dur: 0.5, vol: 0.16 },
          { note: 'F4', dur: 1, vol: 0.18 },
          { note: 'A4', dur: 1, vol: 0.16 },
          { note: 'G4', dur: 1, vol: 0.16 },
          // Bar 3
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'C5', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 1, vol: 0.18 },
          { note: 'F5', dur: 1, vol: 0.2 },
          { note: 'E5', dur: 0.5, vol: 0.16 },
          { note: 'D5', dur: 0.5, vol: 0.16 },
          // Bar 4
          { note: 'C5', dur: 1, vol: 0.18 },
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'G4', dur: 0.5, vol: 0.14 },
          { note: 'F4', dur: 1.5, vol: 0.18 },
          { note: null, dur: 0.5, vol: 0 },
          // Bar 5
          { note: 'G4', dur: 1, vol: 0.16 },
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'A#4', dur: 0.5, vol: 0.16 },
          { note: 'C5', dur: 1, vol: 0.18 },
          { note: 'A4', dur: 1, vol: 0.16 },
          // Bar 6
          { note: 'G4', dur: 0.5, vol: 0.16 },
          { note: 'F4', dur: 0.5, vol: 0.16 },
          { note: 'E4', dur: 1, vol: 0.16 },
          { note: 'F4', dur: 1, vol: 0.18 },
          { note: 'A4', dur: 1, vol: 0.16 },
          // Bar 7
          { note: 'C5', dur: 1, vol: 0.18 },
          { note: 'A#4', dur: 0.5, vol: 0.16 },
          { note: 'A4', dur: 0.5, vol: 0.16 },
          { note: 'G4', dur: 1, vol: 0.16 },
          { note: 'A4', dur: 1, vol: 0.16 },
          // Bar 8
          { note: 'F4', dur: 2, vol: 0.18 },
          { note: null, dur: 1, vol: 0 },
          { note: 'C4', dur: 0.5, vol: 0.12 },
          { note: 'E4', dur: 0.5, vol: 0.12 },
        ]
      },
      // Bass (triangle, very soft)
      {
        type: 'triangle',
        notes: [
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'A2', dur: 2, vol: 0.16 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'C2', dur: 2, vol: 0.16 },
          { note: 'D2', dur: 2, vol: 0.16 },
          { note: 'A#1', dur: 2, vol: 0.16 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'C2', dur: 2, vol: 0.16 },
          { note: 'A#1', dur: 2, vol: 0.16 },
          { note: 'C2', dur: 2, vol: 0.16 },
          { note: 'F2', dur: 2, vol: 0.18 },
          { note: 'C2', dur: 2, vol: 0.16 },
          { note: 'A#1', dur: 2, vol: 0.16 },
          { note: 'C2', dur: 2, vol: 0.16 },
          { note: 'F2', dur: 3, vol: 0.18 },
          { note: null, dur: 1, vol: 0 },
        ]
      }
    ]);
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.SFX = {

    /**
     * Initialize the audio system.
     * Call after the first user interaction (click / tap) to satisfy
     * browser autoplay policies.
     */
    init: function () {
      ensureCtx();
      document.addEventListener('visibilitychange', function () {
        if (!ctx) return;
        if (document.hidden) {
          ctx.suspend();
        } else {
          ctx.resume();
        }
      });
    },

    /**
     * Play a one-shot sound effect.
     * @param {string} soundName - e.g. 'correct', 'hit', 'levelUp'
     */
    play: function (soundName) {
      ensureCtx();
      if (muted) return;
      if (sounds[soundName]) {
        try {
          sounds[soundName]();
        } catch (e) {
          console.warn('[SFX] Error playing "' + soundName + '":', e);
        }
      } else {
        console.warn('[SFX] Unknown sound: ' + soundName);
      }
    },

    /**
     * Start playing a looping music track.
     * Stops any currently playing music first.
     * @param {string} trackName - e.g. 'titleTheme', 'battleTheme'
     */
    playMusic: function (trackName) {
      ensureCtx();
      if (currentMusic) {
        currentMusic.stopFn();
        currentMusic = null;
      }
      if (!musicTracks[trackName]) {
        console.warn('[SFX] Unknown music track: ' + trackName);
        return;
      }
      const handle = musicTracks[trackName]();
      currentMusic = {
        name: trackName,
        stopFn: handle.stop
      };
      musicPlaying = true;
      musicPaused = false;
    },

    /**
     * Stop the current music track.
     * @param {number} [fadeMs=0] - Optional fade-out duration in milliseconds.
     */
    stopMusic: function (fadeMs) {
      if (!currentMusic) return;
      ensureCtx();
      if (fadeMs && fadeMs > 0) {
        const originalVol = musicGain.gain.value;
        musicGain.gain.setValueAtTime(originalVol, now());
        musicGain.gain.linearRampToValueAtTime(0, now() + fadeMs / 1000);
        const stopFn = currentMusic.stopFn;
        setTimeout(function () {
          stopFn();
          if (ctx) {
            musicGain.gain.setValueAtTime(originalVol, ctx.currentTime);
          }
        }, fadeMs);
      } else {
        currentMusic.stopFn();
      }
      currentMusic = null;
      musicPlaying = false;
      musicPaused = false;
    },

    /** Pause the currently playing music. */
    pauseMusic: function () {
      if (!musicPlaying || musicPaused || !currentMusic) return;
      currentMusic.stopFn();
      musicPaused = true;
    },

    /** Resume paused music from the beginning of the loop. */
    resumeMusic: function () {
      if (!musicPaused || !currentMusic) return;
      ensureCtx();
      const trackName = currentMusic.name;
      const handle = musicTracks[trackName]();
      currentMusic = {
        name: trackName,
        stopFn: handle.stop
      };
      musicPaused = false;
    },

    /**
     * Set the master volume (affects everything).
     * @param {number} vol - 0 to 1
     */
    setMasterVolume: function (vol) {
      masterVol = Math.max(0, Math.min(1, vol));
      if (masterGain) {
        masterGain.gain.setValueAtTime(masterVol, ctx.currentTime);
      }
    },

    /**
     * Set the sound effects volume.
     * @param {number} vol - 0 to 1
     */
    setSfxVolume: function (vol) {
      sfxVol = Math.max(0, Math.min(1, vol));
      if (sfxGain) {
        sfxGain.gain.setValueAtTime(sfxVol, ctx.currentTime);
      }
    },

    /**
     * Set the music volume.
     * @param {number} vol - 0 to 1
     */
    setMusicVolume: function (vol) {
      musicVol = Math.max(0, Math.min(1, vol));
      if (musicGain) {
        musicGain.gain.setValueAtTime(musicVol, ctx.currentTime);
      }
    },

    /**
     * Toggle mute on/off.
     * @returns {boolean} The new muted state.
     */
    toggleMute: function () {
      muted = !muted;
      if (masterGain) {
        if (muted) {
          previousMasterVol = masterGain.gain.value;
          masterGain.gain.setValueAtTime(0, ctx.currentTime);
        } else {
          masterGain.gain.setValueAtTime(previousMasterVol, ctx.currentTime);
        }
      }
      return muted;
    },

    /**
     * Check whether audio is currently muted.
     * @returns {boolean}
     */
    isMuted: function () {
      return muted;
    }
  };

})();
