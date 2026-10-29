// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S SAFARI SOUNDS (docs/plans/OPEN-SEA.md 13 to 15; beside audio/opensea.js, the helm and the chart): what is found and
// caught off the lanes, the Egregores heard before they are seen, and a front's squall.
//   A HERD RECORDED   (sea.herd) a low horn of the herd's own answered by the harp up the open sea's chord: the board's fee earned
//   A HABIT CAUGHT    (sea.habit) two glass notes up a fifth; the first of a species' habits a third above them
//   A BEAST SUNK      (seabeast.down; the serpent's own is audio/seaserpent.js) its call falling away in its own register (the akhlut
//                     high, the umibozu and the kraken low and wet, Jormungandr below hearing) and the sea closing over it
//   A DRIFT BOTTLE    (sea.bottle) a cork drawn (a squeak and a pop) and the note unrolled (a dry rustle)
//   SALVAGE           (sea.salvage) the line's ratchet hauling, the crate breaking the surface and dripping, set down on the deck, its
//                     lid bursting and the find's bell by its tier (audio/opensea.js openSeaFind), timed to Calissa's haul
//   A SQUARE DONE     (sea.square.done) your seal pressed on the map (a soft press and a clack) and the open sea's tune head rising
//   THE CALLS         (the helm's loop, audio/opensea.js) the nearest herd heard from where it is, one call each few real seconds, by
//                     its myth: the selkie's moan, the corposants' crackle and glass, the hippocamps' whinny, the ningyo's wordless song,
//                     the akhlut's howl, the serpent's hiss, the umibozu's groan, the island whale's song, the Flying Dutchman's bell,
//                     the kraken's gurgle, Jormungandr's rumble
//   THE SQUALL        (the helm's loop) rain on the deck and the sails rising as the ship's square lies in a front (`frontAt`), now
//                     and then a roll of thunder far off
//
// Prior art: Pokemon Snap's professor's jingle (a picture paid), Zelda: The Wind Waker's salvage arm and its chest, Subnautica's and
// Sea of Thieves' creatures heard before seen, real cetacean and pinniped calls (the shapes of a humpback's sweep, a grey seal's moan),
// Sea of Thieves' storm on the deck.
//
//   sfx.seaHerd() .seaHabit(first) .seaBeastDown(id) .seaBottle() .seaSalvage(tier, part) .seaSquareDone(n, of)
//   sfx.egregoreCall(id)   seaEar(game) -> { herd: { id, pos } | null, squall: 0..1 } (what the helm's loop reads)
// ---------------------------------------------------------------------------------------
import { frontAt } from '../progress/opensea/seatrip.js';
import { now } from '../core/calendar.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** The open sea's chord (music/opensea.js keys to E): E B E G# B up the harp. */
const SEA_CHORD = [64, 71, 76, 80, 83];
/** metres: a herd heard at all (the calls), and where it is loudest. */
export const CALL_REACH = { far: 320, near: 40 };

/** What the helm's loop reads of the open sea: the nearest herd to the camera (its species and a body's place) and whether the ship's
 *  square lies in a front. Never throws: a sea half built reads as quiet. */
const EAR = { at: -1, v: null }; // (asked every 50 ms by the helm's loop; worked out twice a real second)
export function seaEar(g) {
  const ms = performance.now(); if (EAR.v && ms - EAR.at < 500) return EAR.v;
  EAR.at = ms; return (EAR.v = hearSea(g));
}
function hearSea(g) {
  const R = g?.opensea; if (!R) return { herd: null, squall: 0 };
  let squall = 0;
  try { squall = R.grid && R.voyage && frontAt(R.grid, R.seed, now() / 150000).has(R.voyage.at) ? 1 : 0; } catch { squall = 0; }
  let herd = null, best = CALL_REACH.far;
  const cam = g.camera?.position;
  if (cam) for (const H of R.herds?.list || []) {
    const p = H.bodies?.[0]?.group?.getWorldPosition?.(cam.clone()); if (!p) continue;
    const d = p.distanceTo(cam); if (d < best) { best = d; herd = { id: H.id, pos: p }; }
  }
  return { herd, squall };
}

export class SeaSafariSounds {
  /** A herd photographed (sea.herd): its fee earned at the next dock. */
  seaHerd() {
    if (!this.ok() || !this.allow('seaHerd', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.tone(t, 0.9, { f0: hz(52), f1: hz(52), type: 'triangle', gain: 0.18, dest: d }); // (the herd's horn)
    this.tone(t, 0.9, { f0: hz(59), type: 'sine', gain: 0.08, dest: d });
    SEA_CHORD.forEach((m, i) => this.tone(t + 0.35 + i * 0.07, 1.2 - i * 0.12, { f0: hz(m + 12), type: 'triangle', gain: 0.1, dest: d })); // (the harp up)
  }
  /** One of a species' habits caught on a plate (sea.habit); the first a species shows you, a third over it. */
  seaHabit(first = false) {
    if (!this.ok() || !this.allow('seaHabit', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.5);
    [[83, 0], [90, 0.09]].concat(first ? [[94, 0.2]] : []).forEach(([m, dt]) => { this.tone(t + dt, 0.8, { f0: hz(m), gain: 0.12, dest: d }); this.tone(t + dt, 0.3, { f0: hz(m) * 2.76, gain: 0.025, dest: d }); });
  }
  /** A sea beast sunk (seabeast.down { id }), the serpent's own aside (seaSerpentDown). */
  seaBeastDown(id = '') {
    if (!this.ok() || !this.allow('seaBeastDown', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.7);
    const B = { wolfWhale: [220, 130, 'sawtooth'], seaMonk: [70, 40, 'triangle'], bigSquid: [90, 45, 'triangle'], worldSerpent: [38, 24, 'sawtooth'] }[id] || [110, 60, 'sawtooth'];
    [1, 1.06].forEach((r) => this.tone(t, 3.2, { f0: B[0] * r, f1: B[1] * r, type: B[2], gain: 0.06, dest: d })); // (its call, falling away)
    if (id === 'bigSquid' || id === 'seaMonk') for (let i = 0; i < 9; i++) this.noise(t + 0.4 + i * 0.18 + Math.random() * 0.1, 0.06, { type: 'bandpass', f0: 300 + Math.random() * 500, q: 6, gain: 0.18, dest: d }); // (wet: bubbles)
    this.noise(t + 1.2, 2.4, { type: 'lowpass', f0: 1200, f1: 150, gain: 0.4, attack: 0.4, dest: d }); // (the sea closing over it)
  }
  /** A drift bottle opened (sea.bottle): the cork drawn, the note unrolled. */
  seaBottle() {
    if (!this.ok() || !this.allow('seaBottle', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.3);
    this.tone(t, 0.25, { f0: 900, f1: 1400, type: 'triangle', gain: 0.05, dest: d }); // (the cork's squeak)
    this.noise(t + 0.26, 0.03, { type: 'bandpass', f0: 1100, q: 2, gain: 0.5, dest: d }); this.tone(t + 0.26, 0.08, { f0: 600, f1: 300, gain: 0.2, dest: d }); // (the pop)
    this.noise(t + 0.5, 0.6, { type: 'highpass', f0: 2500, f1: 4000, gain: 0.07, attack: 0.1, dest: d }); // (the paper unrolled)
  }
  /** A crate hauled up from a wreck (sea.salvage { tier }): the line, the crate dripping, set down, its lid and its find's bell. */
  seaSalvage(tier = 1) {
    if (!this.ok() || !this.allow('seaSalvage', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.35);
    for (let i = 0; i < 10; i++) this.noise(t + i * 0.09, 0.012, { type: 'bandpass', f0: 2200, q: 6, gain: 0.25, dest: d }); // (the ratchet)
    this.noise(t + 0.9, 0.4, { type: 'bandpass', f0: 900, f1: 400, q: 1, gain: 0.3, dest: d }); // (breaking the surface)
    for (let i = 0; i < 7; i++) this.tone(t + 1.1 + i * 0.13 + Math.random() * 0.05, 0.05, { f0: 1500 + Math.random() * 900, f1: 700, gain: 0.05, dest: d }); // (dripping)
    this.tone(t + 1.9, 0.25, { f0: 140, f1: 80, type: 'triangle', gain: 0.35, dest: d }); this.noise(t + 1.9, 0.08, { type: 'lowpass', f0: 600, gain: 0.3, dest: d }); // (set on the deck)
    this.noise(t + 2.3, 0.06, { type: 'bandpass', f0: 1800, q: 2, gain: 0.35, dest: d }); // (the lid)
    setTimeout(() => this.openSeaFind?.(tier), 2350);
  }
  /** A square of the open sea completed (sea.square.done): your seal pressed on its map page, the tune's head rising. */
  seaSquareDone() {
    if (!this.ok() || !this.allow('seaSquareDone', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.noise(t, 0.12, { type: 'lowpass', f0: 500, gain: 0.35, attack: 0.03, dest: d }); this.noise(t + 0.12, 0.02, { type: 'bandpass', f0: 2600, q: 3, gain: 0.4, dest: d }); // (the press, the clack)
    [64, 66, 68, 71, 76].forEach((m, i) => this.tone(t + 0.3 + i * 0.11, 0.9, { f0: hz(m + 12), type: 'triangle', gain: 0.18, dest: d })); // (E Lydian's head up to the octave)
    this.tone(t + 0.85, 1.6, { f0: hz(64), gain: 0.07, dest: d });
  }
  /** One call of a safari species, by its myth (EGREGORES ids, progress/opensea/safari.js); played through voiceAt from where it is. */
  egregoreCall(id) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.8), w = (o) => this.godWobble?.(t, o.dur, { ...o, dest: d });
    switch (id) {
      case 'sealFolk': w({ dur: 1.4, f0: 520, f1: 340, rate: 5, depth: 25, type: 'triangle', gain: 0.12 }); break; // (a grey seal's moan)
      case 'seaLights': for (let i = 0; i < 8; i++) this.noise(t + Math.random() * 0.8, 0.01, { type: 'highpass', f0: 5000, gain: 0.15, dest: d });
        this.tone(t + 0.2, 1.2, { f0: hz(95), gain: 0.05, dest: d }); break; // (the corposants' crackle and glass)
      case 'horseHerd': w({ dur: 0.9, f0: 900, f1: 450, rate: 14, depth: 90, type: 'sawtooth', gain: 0.12 });
        for (let i = 0; i < 6; i++) this.noise(t + 0.6 + i * 0.11, 0.05, { type: 'bandpass', f0: 700, q: 2, gain: 0.15, dest: d }); break; // (a whinny, hooves on water)
      case 'fishPeople': [76, 79, 74].forEach((m, i) => this.godWobble?.(t + i * 0.45, 0.5, { f0: hz(m), rate: 5.5, depth: 6, gain: 0.12, dest: d })); break; // (the ningyo's wordless song)
      case 'wolfWhale': w({ dur: 1.8, f0: 300, f1: 520, rate: 4, depth: 20, type: 'sawtooth', gain: 0.11 }); break; // (the akhlut's howl)
      case 'seaSerpent': this.noise(t, 0.9, { type: 'highpass', f0: 3500, gain: 0.12, attack: 0.2, dest: d }); this.tone(t, 1.2, { f0: 70, f1: 55, type: 'sawtooth', gain: 0.04, dest: d }); break;
      case 'seaMonk': this.tone(t, 2.2, { f0: 55, f1: 45, type: 'sawtooth', gain: 0.06, dest: d }); this.tone(t, 2.2, { f0: 82, f1: 68, type: 'triangle', gain: 0.05, dest: d }); break; // (the umibozu's groan)
      case 'islandWhale': w({ dur: 3, f0: 160, f1: 420, rate: 0.6, depth: 70, gain: 0.1 }); break; // (a humpback's sweep)
      case 'ghostShip': this.godBell?.(t, 2.5, hz(57), 0.08, d); this.godBell?.(t + 1.1, 2.5, hz(57), 0.05, d);
        this.tone(t + 0.4, 2, { f0: hz(69), type: 'sine', gain: 0.03, dest: d }); break; // (a drowned bell, and its choir)
      case 'bigSquid': for (let i = 0; i < 7; i++) this.noise(t + i * 0.14 + Math.random() * 0.08, 0.07, { type: 'bandpass', f0: 250 + Math.random() * 400, q: 4, gain: 0.9, dest: d }); break; // (a gurgle)
      case 'worldSerpent': this.noise(t, 3, { type: 'lowpass', f0: 90, f1: 60, gain: 0.5, attack: 0.8, dest: d }); this.tone(t, 3, { f0: 33, f1: 29, type: 'sine', gain: 0.15, dest: d }); break;
    }
  }
}
