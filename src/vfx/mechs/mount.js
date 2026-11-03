// ---------------------------------------------------------------------------------------
// THE MECH'S MOUNT / THE WAKING TRACES (plain names; South, 2026-11-02: "build your mech cradles with the proper accommodations ... make
// the mounting animation cinematic, with the pneuka jar installing itself into the mech shell like a screw between the mech's
// shoulderblades then powering up in neuralese circuit patterns across the UV surfaces of the mech, also charging up very much in the
// same manner as the Shrine Gates"). A look laid over Petra's seal (world/cradles.js kind `body`, the hangar's cradle, world/hangar/):
//   THE FLIGHT     the Courier folded into your Pneuka Jar on the walkway (the cradle's own 'in'); the Jar lifts off it and arcs over
//                  the frame's shoulder to hang over the well between its shoulder blades, turning to the well's axis, base first
//   THE SCREW      it drops into the well turning its two turns down the thread (a click each half turn), the collar's tines closing,
//                  a stamp of Spellscription's seal at the lock: the Jar left standing in the back, its face over the shoulders
//   THE WAKE       the Shrine Gate's way (vfx/shrine.js: dead traces carved, lit along their length from the cradle out): neuralese
//                  in its running hand (ui/runninghand.js, the script modelled on a circuit's traces and vias) laid over every
//                  porcelain plate, dark until the wave passes; it runs out from the cradle over the back, down the arms and legs,
//                  in the film's colours by its distance, a bright front ahead of it; the eyes last, a flash, and the traces settle
//                  to a slow breath while the Jar stays sealed, going dark when it leaves
//                  FROM BEHIND (South, 2026-11-03: "the platform should surround the mecha so we can enter from behind as opposed to
//                  doing a flip from the front"): folded behind the frame (a walkway round its back), the Jar lifts a little, glides
//                  straight to the hover over the well and turns to its axis: no arc over the shoulder (that kept for a fold in front)
//   THE CAMERA     a shot of its own, every beat in the frame's horizontal basis (its side, world up, its forward) from the cradle:
//                  beside the walkway on the Jar's flight (behind and beside it, folded behind), over the shoulder on the screw, a
//                  high three-quarter rear for the wake running out over the back, a cut to the three-quarter front as the eyes
//                  light, then eased onto the pilot's own shot. Every position is kept inside the room it is in (`keepInRoom`: the
//                  hangar's box 2 m off its walls and roof, out of the gantry's piers, scaffold, beam, clamps and walkways; the proving
//                  ground's square): a beat change whose line would pass through any of them, or the frame, is a cut, never a sweep
//                  through it (CASEBOOK NEW:shot-kept-in-room). A second seal on the same visit runs at twice the speed.
// The traces are one onBeforeCompile on the parts body's shared porcelain (vfx/mechs/partsbody.js `mats.porcelain`): the running hand
// baked once into a tile, sampled triplanar in each plate's own space (so the writing rides the plate it is on), revealed by the
// world distance from the cradle; the same traces carry the filigree's three channels (vfx/mechs/hydraulics.js). Looks only: the seal, the lift and the drive are Petra's. Events said for the ear: `mech.mount
// { beat: 'lift' | 'turn' | 'lock' | 'wake' | 'power' }` (Wanda's).
// Prior art: Evangelion's entry plug (inserted at the nape, the LCL and the A10 nerve's connection: the unit's eyes lit last),
// the Shrine Gate (Calissa's round six: carved dead, lit along its length, the far end last), Tron's circuitry lit along its runs,
// the Stargate's chevrons, Zone of the Enders' frames, the Jar's own seal (world/cradles.js: a quarter turn and a stamp); the shot kept
// in its room: a third-person camera's collision (Unreal's spring arm, the pilot's clearCity) done once for a scripted shot, and the
// film editor's rule that a move which would pass through the set is a cut.
//
//   installMechMount(game)   game.mechMount { active, wake (0..1), playing, rear (folded behind) }   MECH_MOUNT (the timings and the look)
//   keepInRoom(p, at?, margin?) -> p (a world point kept in the room `at` stands in: the hangar's box, out of the gantry; the proving ground)
//   lineBlocked(a, b, frame?, hall?) (does a camera's move from a to b pass through a solid or the frame: then it is a cut)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { runningHand } from '../../ui/runninghand.js';
import { cellsOf } from '../../npc/neuralesespelling.js';
import { ROOTS } from '../../npc/neuraleseroots.js';
import { dressMech, MECH_BLANK } from './mechglaze.js';
import { HANGAR, PROVING, clampProving, inProving } from '../../world/hangar/layout.js';

/** The timings (real s, the full mount; a second seal on the visit at `quick` of them) and the look. */
export const MECH_MOUNT = {
  hold: 0.55, fly: 1.25, hover: 0.25, screw: 1.25, wake: 1.9, power: 0.6, quick: 0.5,
  over: 2.4, hoverUp: 1.1, reach: 1.25, front: 0.45, rest: 0.09, breath: 0.6, tile: 4.2, unpaint: 1.6,
  rearLift: 0.7, rearSpin: 0.5, behind: 0.5, foldReach: 12, // (folded behind: the hop up before the glide (m), the turns spun on the way, how far behind the well counts as behind (m), how near the seat the Courier's own fold point is believed (m))
  // the beats [side, up, forward] in metres at a 15 m frame (scaled by its height) from the cradle; `power` starts `powerLead` real s before the eyes light
  cam: { side: [9, 7, 11], rear: [4, 5.5, -9.5], screw: [3.6, 1.6, -7.5], wake: [10, 9, -8.5], power: [5, 5, 15] }, // (rear over the lanterns of a ring's back run; power inside the piers, so neither stands in the view)
  powerLead: 0.25, handoff: 0.8, ease: 3.2,
};
/** The hangar's solids a shot must stay out of (local metres from HANGAR.at, [x0, x1, y0, y1, z0, z1]; `gz` the gantry's z), from the
 *  boxes and their dress (world/hangar/hangar.js, hangardress/gantry.js GANTRY_LOOK): the piers with their scaffold, the beam and its
 *  kasagi, the clamps, and the walkways with their rails and lanterns. The hall's walls are HANGAR's own, kept `wall` m off; the roof `roof` m under. */
export const MOUNT_ROOM = {
  wall: 2, roof: 2, floor: 1.5, near: 0.6,
  solids: (gz) => [
    [7.2, 12.8, 0, 25, gz - 2.3, gz + 2.3], [-12.8, -7.2, 0, 25, gz - 2.3, gz + 2.3], // (a pier and its ashiba, each side)
    [-11.6, 11.6, 21.6, 25.6, gz - 1.6, gz + 1.6], // (the beam, the kasagi, the shimenawa)
    [4.3, 9.4, 10.8, 13.2, gz - 3.9, gz - 0.9], [-9.4, -4.3, 10.8, 13.2, gz - 3.9, gz - 0.9], // (the clamps)
  ],
};
const M = MECH_MOUNT, PI = Math.PI;
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const out3 = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;

// ------------------------------------------------------------------ the running hand baked into a tile
let TILE = null;
function circuitTile() {
  if (TILE || typeof document === 'undefined') return TILE;
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
  const words = Object.keys(ROOTS); let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let row = 0, y = 90; y < S; row++, y += 170) {
    let x = 18 - (row % 2) * 90;
    while (x < S) {
      if (rnd() < 0.3) { x += 120 + rnd() * 160; continue; } // (a gap in the run: the traces read as circuits, not as wallpaper)
      const line = []; for (let i = 0, n = 2 + Math.floor(rnd() * 3); i < n; i++) line.push({ cells: cellsOf(words[Math.floor(rnd() * words.length)]), mod: i > 0 && rnd() < 0.35 });
      if (rnd() < 0.15) line.push({ num: Math.floor(rnd() * 99), mod: true });
      const r = runningHand(ctx, line, { x, y, scale: 6, ink: '#fff', lw: 4, end: rnd() < 0.3 });
      x += (r?.width || 200) + 40 + rnd() * 40;
    }
    // (the long bus between lines: a trace running the row, a via at each end, as the gate's carved runs)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y + 64); ctx.lineTo(S, y + 64); ctx.stroke();
  }
  TILE = new THREE.CanvasTexture(cv); TILE.wrapS = TILE.wrapT = THREE.RepeatWrapping; TILE.colorSpace = THREE.NoColorSpace; TILE.anisotropy = 4;
  return TILE;
}

// ------------------------------------------------------------------ the traces and the paint, on the shell's three materials
/** The uniforms every dressed material of a body shares (one wave): uCharge 0..1 the front, uGlow the traces' brightness, uPaint the
 *  share of the Courier's colours held everywhere (0 the blank frame, 1 fired), uOrigin the cradle, uReach how far the wave runs (m). */
function wakeUniforms() {
  return { uTrace: { value: circuitTile() }, uCharge: { value: 0 }, uGlow: { value: 0 }, uPaint: { value: 0 }, uOrigin: { value: new THREE.Vector3() },
    uReach: { value: 18 }, uFront: { value: M.front * 4 }, uTile: { value: 1 / M.tile }, uTime: { value: 0 },
    uAbsorb: { value: 0 }, uChannel: { value: 0 }, uHurt: { value: 0 } }; // (the filigree's three channels, vfx/mechs/hydraulics.js)
}
/** The waking traces and the blank laid into one material (once), after its finish (vfx/finish.js, so the Courier's colours are what
 *  the wave paints): `blank` the frame's colour before it is fired, `traces` whether the running hand is written on it. */
function wakeTraces(mat, U, blank, traces = true) {
  if (mat.userData.mountU) return mat.userData.mountU;
  const own = { uBlank: { value: new THREE.Color(blank) }, uTraced: { value: traces ? 1 : 0 } };
  const prev = mat.onBeforeCompile?.bind(mat), prevKey = mat.customProgramCacheKey?.bind(mat);
  mat.onBeforeCompile = (sh, r) => {
    prev?.(sh, r);
    Object.assign(sh.uniforms, U, own);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMtLP; varying vec3 vMtLN; varying vec3 vMtWP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMtLP = position; vMtLN = normal; vMtWP = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vMtLP; varying vec3 vMtLN; varying vec3 vMtWP;
uniform sampler2D uTrace; uniform float uCharge, uGlow, uPaint, uReach, uFront, uTile, uTime, uTraced, uAbsorb, uChannel, uHurt; uniform vec3 uOrigin, uBlank;
vec3 mtFilm(float t) { t = fract(t) * 4.0; // (the film's four: violet, teal, gold, rose, vfx/oxidation.js FILM)
  vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, t) : t < 2.0 ? mix(b, c, t - 1.0) : t < 3.0 ? mix(c, d, t - 2.0) : mix(d, a, t - 3.0); }`)
      .replace('#include <lights_physical_fragment>', `{
  float mtD = distance(vMtWP, uOrigin), mtF = uCharge * uReach;
  float mtLit = (1.0 - smoothstep(mtF - uFront, mtF, mtD)) * step(0.001, uCharge);
  float mtEdge = exp(-pow((mtD - mtF) / uFront, 2.0)) * step(0.001, uCharge) * step(uCharge, 0.999);
  float mtK = max(uPaint, mtLit); // (the Courier's colours where the wave has passed, the blank frame ahead of it)
  float mtL = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(uBlank * (0.75 + 0.5 * mtL), diffuseColor.rgb, mtK);
  totalEmissiveRadiance *= mtK;
  float mtFil = uAbsorb + uChannel + uHurt;
  if (uTraced > 0.5 && (uGlow > 0.001 || mtEdge > 0.001 || mtFil > 0.002)) {
    vec3 w = pow(abs(normalize(vMtLN)), vec3(4.0)); w /= (w.x + w.y + w.z);
    vec3 p = vMtLP * uTile;
    float tr = texture2D(uTrace, p.zy).r * w.x + texture2D(uTrace, p.xz).r * w.y + texture2D(uTrace, p.xy).r * w.z;
    vec3 col = mtFilm(mtD * 0.045 + uTime * 0.05);
    totalEmissiveRadiance += col * tr * (mtLit * uGlow + mtEdge * 2.6) + vec3(1.0) * tr * mtEdge * 0.8;
    if (mtFil > 0.002) { // (the filigree's channels: the cable's pulses running in to the cradle, the spend's running out, a blow's flash)
      float pIn = pow(fract(mtD * 0.16 + uTime * 1.3), 7.0), pOut = pow(fract(mtD * 0.16 - uTime * 1.8), 5.0);
      totalEmissiveRadiance += tr * mtK * (col * (uAbsorb * pIn * 2.0 + uChannel * (0.35 + pOut * 2.4)) + vec3(1.0, 0.86, 0.72) * uHurt * 2.2);
    }
  }
  totalEmissiveRadiance += mtFilm(mtD * 0.045 + uTime * 0.05) * mtEdge * 0.35; // (the front itself, a seam of the film running over the shell)
}
#include <lights_physical_fragment>`);
  };
  mat.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-mechwake`;
  mat.needsUpdate = true;
  return (mat.userData.mountU = own);
}

/** A body's shell dressed once (the Courier's finishes on its plates, trim and core: vfx/mechs/mechglaze.js) and the wave laid on;
 *  its shared uniforms kept on the body. */
function wakeBody(body, game) {
  if (body.userData?.wakeU) return body.userData.wakeU;
  dressMech(body, game);
  const U = wakeUniforms(), m = body.mats || {};
  for (const [mat, blank, traced] of [[m.porcelain, MECH_BLANK.bisque, true], [m.trim, MECH_BLANK.trim, true], [m.core, MECH_BLANK.core, false]]) if (mat) wakeTraces(mat, U, blank, traced);
  (body.userData ||= {}).wakeU = U;
  return U;
}

// ------------------------------------------------------------------ the room a shot is kept in
const walksOf = () => HANGAR.walks;
/** The hangar's solids as world boxes [x0, x1, y0, y1, z0, z1] (the walkways' slabs and rails with them), grown by `m`. */
function solidsOf(m) {
  const A = HANGAR.at, out = [];
  for (const b of MOUNT_ROOM.solids(HANGAR.gantry.z)) out.push([b[0], b[1], b[2], b[3], b[4], b[5]]);
  for (const w of walksOf()) out.push([w.x0 - 0.5, w.x1 + 0.5, HANGAR.walkY - 0.6, HANGAR.walkY + 3.4, w.z0 - 0.5, w.z1 + 0.5]); // (and what stands on them: rails, lanterns on 3 m posts)
  return out.map((b) => [A.x + b[0] - m, A.x + b[1] + m, A.y + b[2] - m, A.y + b[3] + m, A.z + b[4] - m, A.z + b[5] + m]);
}
const inBox = (p, b) => p.x > b[0] && p.x < b[1] && p.y > b[2] && p.y < b[3] && p.z > b[4] && p.z < b[5];
/** Is a world point inside the hangar's hall (its walls, floor and roof)? */
export const inHangar = (p) => { const A = HANGAR.at; return Math.abs(p.x - A.x) < HANGAR.w / 2 && Math.abs(p.z - A.z) < HANGAR.d / 2 && p.y > A.y - 1 && p.y < A.y + HANGAR.h; };
/** A world point kept in the room `at` (the frame) stands in (mutates and returns p): the hangar's box `wall` m off its walls, `roof` under its roof and
 *  `floor` over its floor, and pushed out of each solid by its nearest face; the proving ground's square (clampProving) over its floor.
 *  `near` grows every solid by the camera's near reach, so its frustum never cuts one either. */
export function keepInRoom(p, at = p, margin = MOUNT_ROOM.near) {
  const R = MOUNT_ROOM, A = HANGAR.at;
  if (!inHangar(at)) { if (inProving(at)) { clampProving(p, R.wall); p.y = Math.max(PROVING.at.y + R.floor, p.y); } return p; } // (the yard: open but walled; anywhere else, as asked)
  const hx = HANGAR.w / 2 - R.wall, hz = HANGAR.d / 2 - R.wall;
  p.x = Math.max(A.x - hx, Math.min(A.x + hx, p.x)); p.z = Math.max(A.z - hz, Math.min(A.z + hz, p.z));
  p.y = Math.max(A.y + R.floor, Math.min(A.y + HANGAR.h - R.roof, p.y));
  for (const b of solidsOf(margin)) {
    if (!inBox(p, b)) continue;
    const d = [p.x - b[0], b[1] - p.x, p.y - b[2], b[3] - p.y, p.z - b[4], b[5] - p.z]; let k = 0; for (let i = 1; i < 6; i++) if (d[i] < d[k]) k = i;
    if (k === 2) k = 3; // (never pushed down under a solid: up over it)
    const e = 0.01; if (k === 0) p.x = b[0] - e; else if (k === 1) p.x = b[1] + e; else if (k === 3) p.y = b[3] + e; else if (k === 4) p.z = b[4] - e; else p.z = b[5] + e;
  }
  return p;
}
/** Does the line a to b pass through a solid, the hall's walls, or the frame's own box (`frame`: [x0, x1, y0, y1, z0, z1] in world)? */
export function lineBlocked(a, b, frame = null, hall = inHangar(a) || inHangar(b)) {
  const boxes = hall ? solidsOf(0.2) : [];
  if (frame) boxes.push(frame);
  for (const B of boxes) { // (the slab test)
    let t0 = 0, t1 = 1, ok = true;
    for (const [o, d, lo, hi] of [[a.x, b.x - a.x, B[0], B[1]], [a.y, b.y - a.y, B[2], B[3]], [a.z, b.z - a.z, B[4], B[5]]]) {
      if (Math.abs(d) < 1e-6) { if (o <= lo || o >= hi) { ok = false; break; } continue; }
      let u0 = (lo - o) / d, u1 = (hi - o) / d; if (u0 > u1) [u0, u1] = [u1, u0];
      t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 >= t1) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

/** The frame's height over its feet (m), measured once a mount: `body.height` is a world box's top (partsbody.js), right only for a
 *  body built where its group stands at y 0 (a form rebuilt in the gantry read 213 m for a 13 m doll), so it is read here as the shown
 *  meshes' top less the group's own height. */
function heightOf(body) {
  if (!body?.body || !body.group) return body?.height || 15;
  body.group.updateMatrixWorld(true);
  const box = new THREE.Box3(), b = new THREE.Box3(); // (what is shown only: the barrier's sphere hangs hidden round it)
  body.body.traverseVisible((o) => { if (!o.isMesh || !o.geometry?.attributes?.position) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); });
  const y = new THREE.Vector3().setFromMatrixPosition(body.group.matrixWorld).y, h = box.max.y - y;
  return Number.isFinite(h) && h > 2 && h < 60 ? h : 15;
}

// ------------------------------------------------------------------ the mount
export class MechMount {
  constructor(game) {
    this.game = game; this.active = false; this.playing = false; this.wake = 0; this.t = 0; this.visit = 0; this.seen = -1;
    this.from = new THREE.Vector3(); this.cam = new THREE.Vector3(); this.look = new THREE.Vector3(); this.camOn = false;
    this.beats = new Set(); this.turnsSaid = 0;
    game.events?.on?.('hangar.enter', () => { this.visit++; });
    game.events?.on?.('vessel.fire', () => { const B = this.body; if (B?.mats) dressMech(B, game); }); // (a firing at the kiln worn by the frame too)
  }
  get body() { return this.game.hangar?.pilot?.mech || null; }

  update(dt) {
    const g = this.game, H = g.hangar, C = g.cradles, body = this.body, raw = g.rawDt ?? dt;
    if (body?.mats) { this.U = wakeBody(body, g); this.U.uTime.value += raw; } // (every frame the hangar builds starts blank: no Jar in it)
    const mine = !!H && !!C?.sealed && C.sealed === H.cradle && !!body?.cradle?.frame;
    if (mine && !this.active) this.begin(body);
    if (!mine && this.active) this.end();
    if (!this.active) { if (this.U) { this.U.uPaint.value = Math.max(0, this.U.uPaint.value - raw / M.unpaint); this.U.uGlow.value = Math.max(0, this.U.uGlow.value - raw); } return; } // (the Courier gone, its colours drain out of the shell)
    this.t += raw / this.k;
    this.play(body);
  }

  begin(body) {
    const g = this.game, c = g.cradles.sealed;
    this.active = true; this.playing = true; this.t = 0; this.beats.clear(); this.turnsSaid = 0;
    this.k = this.seen === this.visit ? M.quick : 1; this.seen = this.visit;
    this.U = wakeBody(body, g); dressMech(body, g); this.U.uCharge.value = 0; this.U.uGlow.value = 0; this.U.uPaint.value = 0; // (the look as fired now: a firing since is worn)
    const P = g.player?.pos; // (the Jar starts where the Courier folded into it, on the walkway: where they stood, else the cradle's ground point)
    this.from.copy(P && P.distanceTo(c.pos) < M.foldReach ? P : c.at);
    const Fr = this.frame(body), H = this.flat(body);
    this.rear = (this._d ||= new THREE.Vector3()).subVectors(this.from, Fr.at).dot(H.fwd) < -M.behind; // (folded behind the frame: in straight, no arc over the shoulder)
    this.camOn = false; this.beat = null; this.handFrom = null; this.h = heightOf(body);
  }
  end() {
    this.active = false; this.playing = false; this.wake = 0;
    if (this.U) this.U.uCharge.value = 0;
    this.game.cinema?.unshot('mechMount');
  }
  say(beat) { if (this.beats.has(beat)) return; this.beats.add(beat); this.game.events?.emit('mech.mount', { beat, by: 'courier' }); }

  /** The well's frame in the world: its floor (`at`), its axis out of the back (`up`), the frame's forward (`fwd`), its side. */
  frame(body) {
    const F = body.cradle.frame; F.updateWorldMatrix(true, false);
    const at = (this._at ||= new THREE.Vector3()).setFromMatrixPosition(F.matrixWorld);
    const up = (this._up ||= new THREE.Vector3()).set(0, 1, 0).transformDirection(F.matrixWorld);
    const fwd = (this._fw ||= new THREE.Vector3()).set(0, 0, 1).transformDirection(body.group.matrixWorld); fwd.addScaledVector(up, -fwd.dot(up)).normalize();
    const side = (this._sd ||= new THREE.Vector3()).crossVectors(up, fwd).normalize();
    const q = (this._q ||= new THREE.Quaternion()).setFromRotationMatrix((this._m ||= new THREE.Matrix4()).makeBasis(side, up, fwd));
    return { at, up, fwd, side, q };
  }
  /** The frame's horizontal basis (the camera's beats are laid in it): its forward on the floor, its side, world up. */
  flat(body) {
    const fwd = (this._hf ||= new THREE.Vector3()).set(0, 0, 1).transformDirection(body.group.matrixWorld).setY(0);
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1); fwd.normalize();
    const side = (this._hs ||= new THREE.Vector3()).set(fwd.z, 0, -fwd.x);
    return { fwd, side };
  }

  play(body) {
    const g = this.game, J = g.god?.jar, U = this.U, t = this.t, Fr = this.frame(body), depth = body.cradle.depth ?? 0.82, turns = body.cradle.turns ?? 2;
    const t1 = M.hold, t2 = t1 + M.fly, t3 = t2 + M.hover, t4 = t3 + M.screw, t5 = t4 + M.wake, t6 = t5 + M.power;
    const top = (this._tp ||= new THREE.Vector3()).copy(Fr.at).addScaledVector(Fr.up, depth); // (where the screw begins: the foot at the well's lip)
    const hover = (this._hv ||= new THREE.Vector3()).copy(top).addScaledVector(Fr.up, M.hoverUp);
    const pos = (this._ps ||= new THREE.Vector3()), q = (this._qq ||= new THREE.Quaternion()), spin = (this._sp ||= new THREE.Quaternion());
    const upright = (this._ur ||= new THREE.Quaternion()).setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(Fr.fwd.x, Fr.fwd.z));
    if (t < t1) { pos.copy(this.from); q.copy(upright); }
    else if (t < t3 && this.rear) { // the flight from behind: a short hop up, then straight in to the hover over the well, turning to its axis
      const u = ease((t - t1) / M.fly), v = ease(Math.min(1, ((t - t1) / M.fly) * 1.8)); this.say('lift');
      pos.lerpVectors(this.from, hover, u); pos.y = THREE.MathUtils.lerp(this.from.y, hover.y, v) + Math.sin(PI * v) * M.rearLift;
      q.slerpQuaternions(upright, Fr.q, ease((t - t1) / (M.fly + M.hover)));
      spin.setFromAxisAngle(Fr.up, -(1 - u) * PI * 2 * M.rearSpin); q.premultiply(spin);
    } else if (t < t3) { // the flight from in front: an arc over the shoulder to the hover, turning to the axis, spinning up
      const u = ease((t - t1) / M.fly); this.say('lift');
      pos.lerpVectors(this.from, hover, u); pos.y += Math.sin(PI * u) * M.over;
      q.slerpQuaternions(upright, Fr.q, ease((t - t1) / (M.fly + M.hover)));
      spin.setFromAxisAngle(Fr.up, -(1 - u) * PI * 1.5); q.premultiply(spin);
    } else if (t < t4) { // the screw: two turns down the thread, slowing into the lock
      const u = out3((t - t3) / M.screw), lead = ease(Math.min(1, (t - t3) / 0.18));
      pos.lerpVectors(hover, top, lead).lerp(Fr.at, u * lead);
      spin.setFromAxisAngle(Fr.up, -turns * PI * 2 * (1 - u)); q.copy(Fr.q).premultiply(spin);
      const half = Math.floor(u * turns * 2); if (half > this.turnsSaid && half < turns * 2) { this.turnsSaid = half; g.events?.emit('mech.mount', { beat: 'turn', n: half, by: 'courier' }); }
    } else { pos.copy(Fr.at); q.copy(Fr.q); }
    if (t >= t4 && !this.beats.has('lock')) { this.say('lock'); body.jiggle?.(1.2); if (typeof g.fx?.impact === 'function') g.fx.impact(top.clone(), Fr.up.clone(), { sparks: 14, dust: 4 }); g.vfx?.play?.('domain.spellscription.hit', { pos: top.clone(), normal: Fr.up.clone(), scale: 1.6 }); }
    if (J) { J.group.position.copy(pos); J.group.quaternion.copy(q); J.group.visible = true; }
    // the wake: the gate's way, out from the cradle, the eyes last
    U.uOrigin.value.copy(Fr.at); U.uReach.value = (this.h || 15) * 1.25;
    if (t < t4) { U.uCharge.value = 0; U.uGlow.value = 0; }
    else if (t < t5) { this.say('wake'); U.uCharge.value = ease((t - t4) / M.wake); U.uGlow.value = 1; }
    else { U.uCharge.value = 1; U.uPaint.value = 1; const u = Math.min(1, (t - t5) / M.power);
      if (!this.beats.has('power')) { this.say('power'); const h = body.joints?.head || body.joints?.neck; const at = h ? h.getWorldPosition(new THREE.Vector3()) : Fr.at.clone();
        g.vfx?.play?.('domain.spellscription.level', { pos: at, scale: 2.4 }); }
      U.uGlow.value = THREE.MathUtils.lerp(1.6, M.rest, u) + (u >= 1 ? Math.sin(U.uTime.value * PI * 2 * M.breath * 0.4) * M.rest * 0.5 : 0); }
    this.wake = U.uCharge.value; this.playing = t < t6 + 0.3;
    this.camera(body, Fr, pos, t, t2, t4, t5, t6);
  }

  /** The mount's camera: beside the walkway on the flight (behind and beside it, folded behind), over the shoulder on the screw, the
   *  high three-quarter rear on the wake, a cut to the three-quarter front as the eyes light, then eased onto the pilot's shot. Every
   *  position kept in the room (keepInRoom); a beat whose line passes through a solid or the frame cuts. */
  camera(body, Fr, jarAt, t, t2, t4, t5, t6) {
    const g = this.game, Ci = g.cinema; if (!Ci) return;
    const end = t6 + 0.2, raw = g.rawDt ?? 0.016;
    const base = (this._bs ||= new THREE.Vector3()).setFromMatrixPosition(body.group.matrixWorld), h = this.h || 15, s = h / 15, H = this.flat(body);
    const beat = t < t2 ? (this.rear ? 'rear' : 'side') : t < t4 ? 'screw' : t < t5 - M.powerLead ? 'wake' : 'power';
    const pick = M.cam[beat];
    const want = (this._wn ||= new THREE.Vector3()).copy(Fr.at).addScaledVector(H.side, pick[0] * s).addScaledVector(THREE.Object3D.DEFAULT_UP, pick[1] * s).addScaledVector(H.fwd, pick[2] * s);
    keepInRoom(want, base);
    const lookAt = (this._lk ||= new THREE.Vector3());
    if (t < t4) lookAt.copy(jarAt); else lookAt.copy(base).setY(base.y + h * (beat === 'power' ? 0.7 : 0.55));
    if (t > end) { // the hand-off: eased from where the mount's shot stands onto the pilot's own, then let go
      const P = Ci.shots.get('mech');
      if (!this.handFrom) this.handFrom = { pos: this.cam.clone(), look: this.look.clone(), cut: !P || lineBlocked(this.cam, P.pos, null, inHangar(base)) };
      const u = ease((t - end) / M.handoff), F = this.handFrom;
      if (!P || F.cut || u >= 1) { if (this.camOn) { Ci.unshot('mechMount'); this.camOn = false; } return; }
      this.cam.lerpVectors(F.pos, P.pos, u); this.look.lerpVectors(F.look, P.look, u); keepInRoom(this.cam, base);
      Ci.unshot('mechMount'); Ci.shot('mechMount', { pos: this.cam, look: this.look, bars: 1 - u, ease: 4, fov: -4 * (1 - u) });
      return;
    }
    // a new beat: a cut where the move would pass through the set or the frame (its box round its feet to its head), else an ease
    if (beat !== this.beat) {
      const r = 3.6 * s, frame = [base.x - r, base.x + r, base.y, base.y + h, base.z - r, base.z + r];
      this.cutNow = !this.camOn || lineBlocked(this.cam, want, frame, inHangar(base)); this.beat = beat;
      if (!this.camOn) this.inEase = lineBlocked(g.camera.position, want, frame, inHangar(base)) ? 60 : 4; // (the cinema's blend in from the Courier's own view: a cut too where it would pass through)
    }
    const k = this.cutNow ? 1 : 1 - Math.exp(-raw * M.ease); this.cutNow = false;
    this.cam.lerp(want, k); this.look.lerp(lookAt, k);
    keepInRoom(this.cam, base); // (the eased path kept in too)
    Ci.unshot('mechMount'); Ci.shot('mechMount', { pos: this.cam, look: this.look, bars: 1, ease: this.inEase ?? 4, fov: -4 }); // (asked last each frame, so it holds over the pilot's)
    this.camOn = true;
  }
}

export function installMechMount(game) {
  const m = new MechMount(game); game.mechMount = m;
  game.systems?.add?.('marks', m, { clock: 'raw', name: 'mechMount' });
  return m;
}
