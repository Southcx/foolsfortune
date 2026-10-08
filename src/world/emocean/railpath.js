// ---------------------------------------------------------------------------------------
// THE RAIL AS A SPLINE: the crossing's line laid as a path with a turning frame (docs/plans/RAIL-OVERHAUL.md section 5, "The
// non-linear sea"; Petra's). The legs are sailed straight and level, so the fight reads; each TURN OF THE RAIL (the four bars between
// two legs, music/legs.js tripLayout's `turns`) is a FIGURE the frame flies, carrying everything that fights with it (the stage keeps
// them in the rail's frame): a WEAVE (out and back across the sea, banked into each bend), a CREST (up over a rise and down), a
// CORKSCREW (the frame rolled once about the line: the sea overhead at its middle), a VERTICAL LOOP (the frame pitched once round:
// up, over on its back, and down onto the line again). Every figure ends level and on the heading it began, so the zone's bounds hold.
//
// How: the frame's heading, pitch and roll are functions of the distance along (each figure a profile of the three over its own
// length); the path is that frame's forward integrated every half metre and kept as samples (a point and a quaternion), read between
// them. A pure module: no scene, no game.
//
// Prior art: the rollercoaster's track as a spline with a banked frame (No Limits' heartline: the rider's frame is the track's, the
// world turns round them), Panzer Dragoon's and Rez's rails (the fight carried in the rail's frame), Star Fox 64's loops and corkscrews
// on the rail between set pieces, No Limits' heartline (the figures turn about the rider, not the track), the Frenet frame's flip avoided by carrying the frame's angles, not deriving it from curvature.
//
//   const P = new RailPath()   P.lay({ turns: [{ at: s0, len, figure, sign }], length, start, heart })   P.at(s, outPos, outQuat)
//   FIGURES (and `arena`, a maelstrom's peak: arenaLaps, arenaCentre)   figureFor(next, rng) -> 'weave' | 'crest' | 'corkscrew' | 'verticalLoop'   (toWorld and the rest live on the stage's rail)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const STEP = 0.5; // (metres between samples: a frame at 26 m/s moves under a metre, read between two)
const TAU = Math.PI * 2;
const ease = (k) => k * k * (3 - 2 * k);

/** Each figure's heading, pitch and roll (radians) at k, 0..1 along its length, and the sign it is flown with (+1 or -1: the weave's
 *  side, the corkscrew's hand). Each starts and ends at 0 (or a whole turn), so the line goes on level, on its heading. */
export const FIGURES = {
  /** Out across the sea and back, banked into each bend: heading out to near a twelfth of a turn (0.5 rad), then back (the lateral shift returns). */
  weave: (k, s) => { const h = 0.5 * Math.sin(TAU * k); return { yaw: s * h, pitch: 0, roll: -s * 0.55 * Math.cos(TAU * k) * Math.sin(Math.PI * k) }; },
  /** Up over a rise and down to the line again (a wave's back, ridden): pitch up, over, and down. */
  crest: (k) => ({ yaw: 0, pitch: 0.42 * Math.sin(TAU * k), roll: 0 }),
  /** The frame rolled once about the line, eased in and out: the sea overhead at its middle. */
  corkscrew: (k, s) => ({ yaw: 0, pitch: 0, roll: s * TAU * ease(k) }),
  /** The frame pitched once round over the middle three quarters, straight in and out: up, over on its back, down onto the line. */
  verticalLoop: (k) => { const m = Math.min(1, Math.max(0, (k - 0.125) / 0.75)); return { yaw: 0, pitch: TAU * ease(m), roll: 0 }; },
  /** The maelstrom's arena (not a turn of the rail: a leg's peak): the line leaves straight and circles the whirlpool whole laps
   *  (`t.laps`), its turn eased in and out over ARENA.ease of its length and banked inward, and goes on on its heading. Its centre,
   *  in the middle, is ARENA.radius(t) across the frame on the turning side (`arenaCentre`). */
  arena: (k, s, t) => ({ yaw: s * TAU * (t?.laps ?? 1) * turnShare(k), pitch: 0, roll: -s * ARENA.bank * turnRate(k) }),
};

/** The arena's shape: the share of its length eased in and out, the bank at full turn, and the radius it is laid for (laps chosen so the
 *  circle is near it: arenaLaps). */
export const ARENA = { ease: 0.1, bank: 0.35, radius: 40 };
const turnRate = (k) => (k < ARENA.ease ? k / ARENA.ease : k > 1 - ARENA.ease ? (1 - k) / ARENA.ease : 1);
const turnShare = (k) => { const e = ARENA.ease, A = k < e ? (k * k) / (2 * e) : k > 1 - e ? 1 - e - ((1 - k) * (1 - k)) / (2 * e) : e / 2 + (k - e); return A / (1 - e); };
/** Whole laps for an arena `len` metres long, so its circle's radius is nearest ARENA.radius (one at the least). */
export const arenaLaps = (len) => Math.max(1, Math.round((len * (1 - ARENA.ease)) / (TAU * ARENA.radius)));
/** The arena's radius as laid (metres), and its centre in the rail's frame through its middle: across, on the turning side. */
export const arenaRadius = (t) => (t.len * (1 - ARENA.ease)) / (TAU * (t.laps ?? 1));
export const arenaCentre = (t, out) => out.set(-(t.sign ?? 1) * arenaRadius(t), 0, 0); // (local x is the chase view's screen right: a heading turned + turns left)

/** Which figure a turn flies: the eyewall's tunnel corkscrews into it, the maelstrom is entered by a vertical loop, the rest by the draw. */
export function figureFor(next, rng) {
  if (next === 'eyewall') return 'corkscrew';
  if (next === 'maelstrom') return 'verticalLoop';
  const r = rng();
  return r < 0.3 ? 'weave' : r < 0.55 ? 'crest' : r < 0.8 ? 'corkscrew' : 'verticalLoop';
}

const _q = new THREE.Quaternion(), _qf = new THREE.Quaternion(), _qy = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qr = new THREE.Quaternion();
const _f = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);

/** The frame from its three angles: heading about the world's up, then pitch about its across (nose up is +), then roll about its line. */
export function frameOf(yaw, pitch, roll, out = new THREE.Quaternion()) {
  _qy.setFromAxisAngle(Y, yaw); _qp.setFromAxisAngle(X, -pitch); _qr.setFromAxisAngle(Z, roll);
  return out.copy(_qy).multiply(_qp).multiply(_qr);
}

export class RailPath {
  constructor() { this.n = 0; this.pos = new Float32Array(0); this.quat = new Float32Array(0); this.turns = []; }

  /** The line laid from `start` along +Z for `length` metres, each turn ({ at: metres, len: metres, figure, sign }) flown in its place.
   *  The figures turn about the HEARTLINE, `heart` metres up the frame (the ship's cruise height: views.js CRUISE), not about the rail
   *  point: a corkscrew rolled about the rail at the sea's level would take the ship under the surface at its middle. */
  lay({ start, length, turns = [], heart = 0 }) {
    this.turns = turns.slice().sort((a, b) => a.at - b.at);
    const n = this.n = Math.ceil(length / STEP) + 2;
    this.pos = new Float32Array(n * 3); this.quat = new Float32Array(n * 4);
    const p = new THREE.Vector3().copy(start).addScaledVector(Y, heart), at = new THREE.Vector3(); // (p: the heartline)
    for (let i = 0; i < n; i++) {
      const s = i * STEP, a = this.angles(s);
      frameOf(a.yaw, a.pitch, a.roll, _q);
      at.copy(Y).applyQuaternion(_q).multiplyScalar(-heart).add(p); // (the rail point: the heartline less the frame's up)
      at.toArray(this.pos, i * 3); _q.toArray(this.quat, i * 4);
      // the next sample: forward along the frame's heading and pitch (the roll does not move the line)
      frameOf(a.yaw, a.pitch, 0, _qf); _f.copy(Z).applyQuaternion(_qf);
      p.addScaledVector(_f, STEP);
    }
    return this;
  }

  /** The three angles at s: a turn's figure where one is flown, level and straight elsewhere. */
  angles(s) {
    for (const t of this.turns) if (s >= t.at && s < t.at + t.len) return FIGURES[t.figure]?.((s - t.at) / t.len, t.sign ?? 1, t) || ZERO;
    return ZERO;
  }

  /** The rail point and its frame at s metres along (read between the two samples either side). */
  at(s, outPos, outQuat) {
    const x = Math.max(0, Math.min(this.n - 1.001, s / STEP)), i = Math.floor(x), k = x - i;
    if (!this.n) { outPos.set(0, 0, 0); outQuat.identity(); return; }
    outPos.fromArray(this.pos, i * 3); _f.fromArray(this.pos, (i + 1) * 3); outPos.lerp(_f, k);
    outQuat.fromArray(this.quat, i * 4); _q.fromArray(this.quat, (i + 1) * 4); outQuat.slerp(_q, k);
  }

  /** Whether s lies in a turn (the stage keeps its fire quiet there: nothing enters during a turn, as nothing enters a swing). */
  turning(s) { return this.turns.some((t) => s >= t.at && s < t.at + t.len); }
}
const ZERO = Object.freeze({ yaw: 0, pitch: 0, roll: 0 });
