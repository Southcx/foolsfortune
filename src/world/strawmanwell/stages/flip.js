// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE FLIP (docs/plans/STRAWMANS-WELL.md 3.9): VVVVVV's corridor, where Space turns gravity over in place of a jump. The
// core movement is untouched and its gravity never changes: the stage is built twice, once upright and once as its image turned half
// round about a line under it (FLIP.axis, along the run), and a flip moves the Courier to the same place in the image with its speed
// turned with it, so they always stand on a real floor. The camera turned the same half round sees the image exactly as the upright,
// with the Courier now upside down in it: gravity flipped, on screen.
//   the flip       Space on a floor or a ceiling, never in the air (no jump here: the press is the flip's)
//   a flip line    a thread across a pit: crossing it flips you, your speed across it held to FLIP.line, so you bob along it
//   flick rooms    four rooms of FLIP.room m, the camera held still in each (VVVVVV's screens), a checkpoint a room, kept with which way
//                  gravity was
//   the portals    a pair: fall into the floor's and you leave the wall's across the room with the speed you fell at (Portal's law)
//   spikes         pins on floors and ceilings (the Pit's kit): a touch is a death, PIT.retry real s, back at the room's checkpoint
// A fall is held to FLIP.fall m/s (VVVVVV's terminal speed: a modifier of the flipped stage's, like the Run's ice). Placeholder looks;
// Calissa dresses them. Words placeholders, Espada's.
//
// Prior art: VVVVVV (the flip for a jump, the gravity lines, the screens and their checkpoints, the spikes), Portal and Portal Flash
// (speed kept through a pair), Gravity Rush; Super Mario Galaxy's turned camera.
//
//   default export: a stage module (stagemods.js's contract)   FLIP   mirrorY(y)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR, DEPTH, BACK } from '../stagekit.js';
import { AT } from '../layout.js';
import { goalFlag, sign } from '../stages.js';
import { SpikeBatch, Retry } from './pitkit.js';

/** The image's axis (lane y), the corridor's height (m), a room's width and the first room's start (m), the camera's height in a room,
 *  its distance and field of view, the terminal speed (m/s), a flip line's held speed (m/s), the portals' speed cap (m/s). */
export const FLIP = { axis: -10, H: 8, room: 22, x0: 1, rooms: 4, camY: 4, dist: 14, fov: 52, fall: 11, line: 6 };
export const mirrorY = (y) => 2 * FLIP.axis - y;
const SPIKES = { floor: [[9, 13], [27, 41], [53.6, 59.5], [70, 74]], ceil: [[15, 19], [27, 41], [76, 80]] };
/** A flip line reaches past its pit's spikes, so a flip anywhere over them meets it. */
const LINES = [{ x0: 25.5, x1: 42.5, y: 4 }];
/** The portals, logical: A in the floor of the room's near half (its mouth up), B high on the far face of the wall that splits the room
 *  (its mouth to +x), over a run of spikes only the speed it gives clears: you leave it in the air, where no flip is. */
const PORTALS = { A: { x0: 47.5, x1: 49.5, y: 0 }, B: { x: 52.6, y0: 6, y1: 7.8 }, wall: [52, 52.6] };
/** Each room's checkpoint: where, and on which side of the corridor. */
const CHECKS = [[3, 'floor'], [25, 'floor'], [47, 'floor'], [69, 'floor']];
const _m = new THREE.Matrix4(), _e = new THREE.Vector3(), _t = new THREE.Vector3(), _u = new THREE.Vector3();

export default {
  id: 'flip',
  build(well, S) {
    const len = S.lane.len, H = FLIP.H, z = S.z;
    const st = (this.st = { well, S, mirror: false, room: 0, seen: 0, space: false, mid: null, portalCd: 0, offs: [] });
    /** A box and its image (the depth turned with it). */
    const both = (x0, x1, y0, y1, color, o = {}) => { S.box(x0, x1, y0, y1, color, o); S.box(x0, x1, mirrorY(y1), mirrorY(y0), color, { ...o, dz: -(o.dz ?? 0) }); };
    const signs = (text, x, y, sub) => { sign(S, text, x, y, sub); const m = S.label(text, x, mirrorY(y), { dz: BACK - 0.13, width: 2.6, sub }); m.rotation.set(Math.PI, 0, 0); };
    // the corridor and its image: the back flats, the floor, the ceiling, the ends, the unseen fronts
    both(-16, len + 16, -4, H + 4, COLOR.flat, { dz: -BACK, d: 0.2, outline: false });
    both(-16, len + 16, -4, H + 4, 0, { dz: DEPTH / 2 + 0.1, d: 0.2, hidden: true });
    both(-1, len + 1, -2, 0, COLOR.boards); both(-1, len + 1, H, H + 2, COLOR.boards);
    both(-1, FLIP.x0, 0, H, COLOR.wing); both(FLIP.x0 + FLIP.rooms * FLIP.room, len + 1, 0, H, COLOR.wing);
    for (let i = 1; i < FLIP.rooms; i++) { const x = FLIP.x0 + i * FLIP.room; both(x - 0.05, x + 0.05, 0, H, COLOR.mark, { dz: -BACK + 0.2, d: 0.05, collide: false, outline: false }); }
    for (let i = 0; i < FLIP.rooms; i++) {
      const x = FLIP.x0 + (i + 0.5) * FLIP.room;
      well.kit.lamp(AT.x + x, AT.y + 6, z + 3, 0.8, S.group); well.kit.lamp(AT.x + x, AT.y + mirrorY(6), z - 3, 0.8, S.group);
    }
    // spikes, both copies (a floor's in the image hangs from its ceiling)
    const K = new SpikeBatch();
    st.kills = [];
    for (const [a, b] of SPIKES.floor) { K.row(AT.x + a, AT.x + b, AT.y, 1, z); K.row(AT.x + a, AT.x + b, AT.y + mirrorY(0), -1, z); st.kills.push({ x0: a, x1: b, y0: 0, y1: 0.5 }); }
    for (const [a, b] of SPIKES.ceil) { K.row(AT.x + a, AT.x + b, AT.y + H, -1, z); K.row(AT.x + a, AT.x + b, AT.y + mirrorY(H), 1, z); st.kills.push({ x0: a, x1: b, y0: H - 0.5, y1: H }); }
    K.build(S);
    // the flip lines, the portals and their slab
    for (const L of LINES) both(L.x0, L.x1, L.y - 0.04, L.y + 0.04, COLOR.thread, { collide: false, outline: false, d: DEPTH - 0.2 });
    both(PORTALS.wall[0], PORTALS.wall[1], 0, H, COLOR.wing);
    both(PORTALS.A.x0, PORTALS.A.x1, 0, 0.05, COLOR.felt, { collide: false, outline: false, d: DEPTH - 0.4 });
    both(PORTALS.B.x, PORTALS.B.x + 0.06, PORTALS.B.y0, PORTALS.B.y1, COLOR.spring, { collide: false, outline: false, d: DEPTH - 0.4 });
    // the words: each sign in both copies
    signs('FLIP', 4.5, 4.6, 'Space turns gravity over; no jumping here');
    signs('FLIP LINE', 25.5, 6.6, 'cross the thread and it turns you back');
    signs('PORTALS', 49.5, 4.6, 'fall into the floor\'s, leave by the wall\'s: speed kept');
    signs('ALL OF IT', 69, 4.6, null);
    goalFlag(S, 85, 0);
    st.offs.push(well.game.events?.on('zone.acoustic', () => { if (!well.here) this.leave(well); }));
    st.death = new Retry(well, 'flip', () => this.respawn());
    return { goal: [85, 0], door: [87.5, 0], checks: CHECKS.map(([x]) => [x, 0]), noRetry: true, noWallKick: true };
  },

  // ---------------------------------------------------------------- the logical body (in the upright's lane metres, whichever copy)
  /** { x, y0, y1, vx, vy }: the Courier as the upright stage sees them. */
  logical(out = {}) {
    const P = this.st.well.game.player, h = P.height, x = P.pos.x - AT.x, y = P.pos.y - AT.y;
    out.x = x; out.vx = P.vel.x;
    if (this.st.mirror) { out.y0 = mirrorY(y + h); out.y1 = mirrorY(y); out.vy = -P.vel.y; } else { out.y0 = y; out.y1 = y + h; out.vy = P.vel.y; }
    return out;
  },
  /** The Courier set at a logical place and speed (feet at y0 as the upright sees it: the bottom of the body). */
  place(x, y0, vx, vy) {
    const st = this.st, P = st.well.game.player, h = P.height;
    const wy = st.mirror ? mirrorY(y0 + h) : y0, wvy = st.mirror ? -vy : vy;
    P.endCore?.(); P.moveTo(_t.set(AT.x + x, AT.y + wy, st.S.z), _u.set(vx, wvy, 0)); P.grounded = false;
  },
  /** Gravity turned over: the same place in the other copy, the speed turned with it. */
  flip(capV = Infinity) {
    const st = this.st, L = this.logical(); st.mirror = !st.mirror;
    this.place(L.x, L.y0, L.vx, Math.sign(L.vy) * Math.min(Math.abs(L.vy), capV));
    st.well.verb('flip');
  },
  respawn() {
    const st = this.st, [x, side] = CHECKS[st.room] || CHECKS[0], P = st.well.game.player;
    st.mirror = side === 'ceil';
    this.place(x, side === 'ceil' ? FLIP.H - P.height - 0.05 : 0.05, 0, 0);
    st.well.frame.face = 1; st.mid = null;
  },

  enter() {
    const st = this.st; if (!st) return;
    st.mirror = false; st.room = 0; st.mid = null; st.portalCd = 0; st.death.cancel();
  },
  leave() { const st = this.st; if (!st) return; st.death.cancel(); st.mirror = false; },

  /** Before the step: Space is the flip's (on a floor or a ceiling), never a jump. */
  pre(well) {
    const st = this.st; if (!st || well.stage?.id !== 'flip') return;
    const R = well.frame.realInput, P = well.game.player, sp = !!R?.isDown('Space'), fresh = (sp && !st.space) || P.peekLatch?.('Space'); st.space = sp;
    if (!fresh) return;
    P.latch?.('Space'); // (a press shorter than a step is still the flip's: the latch keeps it for the fixed step)
    well.frame.suppressJump();
    if (P.grounded && !st.death.dead && !P.mantle) this.flip();
  },
  /** After the step: the fall held, the portals, the lines, the spikes, the room. */
  post(well, dt) {
    const st = this.st; if (!st || well.stage?.id !== 'flip') return;
    const P = well.game.player;
    if (st.death.dead) { st.death.post(dt); return; }
    if (Math.abs(P.vel.y) > FLIP.fall) P.vel.y = Math.sign(P.vel.y) * FLIP.fall;
    st.portalCd -= dt;
    let L = this.logical();
    // the portals (both ways)
    if (st.portalCd <= 0) {
      const A = PORTALS.A, B = PORTALS.B, h = L.y1 - L.y0;
      if (L.vy < -1 && L.y0 < A.y + 0.2 && L.x > A.x0 && L.x < A.x1) { const s = Math.min(-L.vy, FLIP.fall); this.place(B.x + 0.45, (B.y0 + B.y1) / 2 - h / 2, s, 0); this.portal(); L = this.logical(); }
      else if (L.vx < -1 && L.x - 0.3 < B.x + 0.15 && L.x > B.x - 0.2 && L.y0 > B.y0 - 0.6 && L.y1 < B.y1 + 0.6) { const s = Math.min(-L.vx, FLIP.fall); this.place((A.x0 + A.x1) / 2, A.y + 0.3, 0, s); this.portal(); L = this.logical(); }
    }
    // a flip line crossed
    const mid = (L.y0 + L.y1) / 2;
    if (st.mid != null) for (const Ln of LINES) if (L.x > Ln.x0 && L.x < Ln.x1 && (st.mid - Ln.y) * (mid - Ln.y) < 0) { this.flip(FLIP.line); L = this.logical(); break; }
    st.mid = (L.y0 + L.y1) / 2;
    // spikes
    for (const k of st.kills) if (L.x + 0.28 > k.x0 + 0.08 && L.x - 0.28 < k.x1 - 0.08 && L.y1 > k.y0 + 0.08 && L.y0 < k.y1 - 0.08) { st.death.kill('spike'); return; }
    // the room: a flick, its checkpoint
    const room = THREE.MathUtils.clamp(Math.floor((L.x - FLIP.x0) / FLIP.room), 0, FLIP.rooms - 1);
    if (room !== st.room) { if (room > st.room) st.room = room; if (room > 0) well.verb('flick'); }
  },
  portal() { const st = this.st; st.portalCd = 0.3; st.mid = null; st.well.verb('portal'); st.well.game.fx?.impact?.(st.well.game.player.pos.clone().setY(st.well.game.player.pos.y + 0.9), _u.set(0, 1, 0), { sparks: 10, dust: 2 }); },

  /** The camera: held in the room you are in, turned half round in the image. */
  camera(well) {
    const st = this.st; if (!st || well.stage?.id !== 'flip') return;
    const g = well.game, cam = g.camera, L = this.logical();
    const room = THREE.MathUtils.clamp(Math.floor((L.x - FLIP.x0) / FLIP.room), 0, FLIP.rooms - 1);
    const cx = AT.x + FLIP.x0 + (room + 0.5) * FLIP.room, up = st.mirror ? -1 : 1, cy = AT.y + (st.mirror ? mirrorY(FLIP.camY) : FLIP.camY), z = st.S.z;
    cam.position.set(cx, cy, z + up * FLIP.dist);
    _m.lookAt(cam.position, _e.set(cx, cy, z), _u.set(0, up, 0)); cam.quaternion.setFromRotationMatrix(_m);
    cam.fov = FLIP.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  },

  update(well) { const st = this.st; if (st && well.stage?.id !== 'flip' && (st.mirror || st.death.dead)) this.leave(well); },
  clear(well) { const st = this.st; if (!st) return; this.leave(well); for (const off of st.offs) off?.(); this.st = null; },
};
