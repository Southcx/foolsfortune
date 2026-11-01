// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE TROUPE (docs/plans/STRAWMANS-WELL.md 3.10): Lemmings with Strawman's dummies. TROUPE.count of them drop one by one
// from a hatch and walk on and on (troupewalkers.js, each with a mind of its own: troupemind.js); TROUPE.need of them must reach the
// exit hut. Keys 1 to 6 give a job to the dummy under the cursor (where the pointer is free) or else the one nearest you: 1 BLOCK,
// 2 DIG, 3 BUILD, 4 CLIMB, 5 FLOAT, 6 BOMB, each of a few (JOBS_GIVEN). The boards, a job a beat:
//   1. a wall of soft burlap bales too tall for them, or for you: a BOMBER bursts a way through (and is spent)
//   2. a pit of pins: a BUILDER's stair over it, a BLOCKER holding the rest back while it builds
//   3. a wall to the loft and soft clay under the floor before it: a DIGGER takes you all down into the cellar beneath
//   4. a wall in the cellar too tall to walk: CLIMBERS go up it (a thin ledge there is yours, the Courier's)
//   5. a drop of more than they can fall: FLOATERS drift down to the exit hut
// You walk among them (they have no body to bump), and the stage clears the moment enough are home. F at a lectern (at the start
// and by the exit) puts the troupe back at the hatch. A fall of yours is the stage's own retry (it is deeper than the room's).
// Placeholder looks; the job words over the dummies and the counts are the overlay's tags (placeholder sprites); the words are Espada's.
//
// Prior art: Lemmings (DMA Design, 1991: the hatch, the exit, the eight skills and their counts, "save 5 of 8"), Pikmin, LittleBigPlanet's
// creatinator (a mind given a job).
//
//   default export: a stage module (stagemods.js's contract)   TROUPE   JOBS_GIVEN (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { scaffold, goalFlag, sign } from '../stages.js';
import { FONT } from '../../../ui/theme.js';
import { StageRetry } from './depthlanes.js';
import { Walkers } from './troupewalkers.js';
import { JOBS } from './troupemind.js';

/** The troupe: how many drop, how many must be saved, the hatch's beat (real s between them, and before the first), where it stands, the
 *  exit, how near the Courier a dummy is picked (m), and how near the cursor. */
export const TROUPE = { count: 8, need: 5, every: 2.4, first: 2, hatch: [4, 3.3], exit: [64, -7], pick: 5, cursor: 1.1 };
/** How many of each job there are to give. */
export const JOBS_GIVEN = { block: 2, dig: 2, build: 3, climb: 8, float: 8, bomb: 2 };
const KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
const CHECKS = [[2, 0], [24, 0.8], [34, -3.2], [52, -0.7], [58, -7]];
const CLAY = 0xa0703f, BALE = 0xc9a45a;

export default {
  id: 'troupe',
  build(well, S) {
    const len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y;
    scaffold(S, len, { top: 22 });
    // the boards (see the header's beats)
    S.box(-1, 20, -4, 0, COLOR.boards);
    S.box(11, 12, 3, 12, COLOR.wing); // (the bales' wall above the bomber's reach: solid)
    S.box(20, 23.2, -6, -2, COLOR.wing); // (the pit's floor, its pins on it)
    for (let x = 20.15; x < 23.1; x += 0.35) S.box(x, x + 0.18, -2, -1.5, COLOR.pin, { collide: false, outline: false });
    S.box(23.2, 33, -3.2, 0.8, COLOR.boards);
    S.box(38, 40, -1.2, 9, COLOR.wing); // (the wall to the loft)
    S.box(33, 50, -7.2, -3.2, COLOR.slope); // (the cellar's floor)
    S.box(50, 51, -7.2, -0.7, COLOR.wing); S.box(51, 56, -4.7, -0.7, COLOR.slope); // (the climb, and the shelf over the drop)
    const thin = S.box(46.4, 48, -1.78, -1.6, COLOR.thin, { d: 2.6 }); well.mech.thin(thin.collider, X(46.4), X(48), Y(-1.6)); // (yours, not theirs: clear of the climbers' wall, so none bonks it)
    S.box(56, 71, -11, -7, COLOR.boards); S.box(70, 71, -7, -5.5, COLOR.wing, { outline: false }); // (the far end closed under the scaffold's)
    // the hatch, the exit hut, the lecterns
    S.box(2.9, 5.1, 3.9, 4.3, COLOR.door, { collide: false }); S.box(2.9, 3.1, 3.5, 3.9, COLOR.door, { collide: false }); S.box(4.9, 5.1, 3.5, 3.9, COLOR.door, { collide: false });
    const [ex, ey] = TROUPE.exit;
    S.box(ex - 0.8, ex - 0.6, ey, ey + 2, COLOR.spool, { collide: false, dz: -0.6, d: 0.3 }); S.box(ex + 0.6, ex + 0.8, ey, ey + 2, COLOR.spool, { collide: false, dz: -0.6, d: 0.3 });
    S.box(ex - 1.1, ex + 1.1, ey + 2, ey + 2.4, COLOR.mark, { collide: false, dz: -0.6, d: 1.2 });
    goalFlag(S, ex + 1.6, ey);
    for (const x of [1, 66.6]) S.box(x - 0.3, x + 0.3, x < 30 ? 0 : -7, (x < 30 ? 0 : -7) + 1.1, COLOR.felt, { collide: false, dz: -0.8, d: 0.5 });
    // the soft clay (dug), the bales (burst): cells of their own, put back on a restart
    this.soft = []; this.breakable = []; this.planks = [];
    for (let x = 33; x < 37.99; x += 1) for (let y = -1.2; y < 0.79; y += 0.5) {
      const r = S.box(x, x + 1, y, y + 0.5, CLAY, { own: true, outline: false });
      this.soft.push({ ...r, x0: X(x), x1: X(x + 1), top: Y(y + 0.5), on: true });
    }
    for (let x = 11; x < 11.99; x += 0.5) for (let y = 0; y < 2.99; y += 0.5) {
      const r = S.box(x, x + 0.5, y, y + 0.5, BALE, { own: true, outline: false });
      this.breakable.push({ ...r, cx: X(x + 0.25), cy: Y(y + 0.25), on: true });
    }
    sign(S, 'THE TROUPE', 7, 6.6, `get ${TROUPE.need} of ${TROUPE.count} to the hut`);
    sign(S, 'JOBS', 15, 4.6, '1 BLOCK 2 DIG 3 BUILD 4 CLIMB 5 FLOAT 6 BOMB'); sign(S, 'BOMB', 9, 3.2, 'the bales burst');
    sign(S, 'BUILD', 21.6, 2.6, 'a stair over the pins'); sign(S, 'DIG', 35.5, 3.4, 'down through the clay'); sign(S, 'CLIMB', 47, 1.4, 'up the wall');
    sign(S, 'FLOAT', 58, -2.6, 'too far to fall');
    // the counts: the overlay's tags, pinned to the hatch (the jobs left) and the hut (saved of needed)
    this.jobsTag = this.readout(S, X(5), Y(5.2), 7.2, 1024); this.savedTag = this.readout(S, X(ex), Y(ey + 3.1), 3.2);
    this.marker = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), new THREE.MeshBasicMaterial({ color: COLOR.gold })); this.marker.rotation.x = Math.PI; this.marker.visible = false; S.add(this.marker);
    this.S = S; this.well = well; this.retry = new StageRetry(well, 'troupe'); this.check = 0;
    this.troupe = null; this.state = { dropped: 0, saved: 0, lost: 0, left: { ...JOBS_GIVEN }, t: 0 };
    return { goal: null, door: [69.2, -7], checks: CHECKS, noRetry: true };
  },

  readout(S, x, y, w, px = 512) {
    const cv = document.createElement('canvas'); cv.width = px; cv.height = 48;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(w, w * 48 / px, 1); s.position.set(x, y, S.z + 0.4); s.renderOrder = 3;
    S.add(s); return { s, cv, tex, said: null };
  },
  say(T, text) {
    if (T.said === text) return; T.said = text;
    const x = T.cv.getContext('2d'), W = T.cv.width; x.clearRect(0, 0, W, 48);
    x.font = `bold 30px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 6; x.strokeStyle = 'rgba(20,10,6,0.85)'; x.strokeText(text, W / 2, 25); x.fillStyle = '#fff0d8'; x.fillText(text, W / 2, 25);
    T.tex.needsUpdate = true;
  },

  /** The troupe put back at the hatch: the dummies gone, the clay and the bales whole, the planks taken up, the jobs counted again. */
  restart() {
    this.troupe?.clear();
    this.troupe = new Walkers({
      well: this.well, group: this.S.group, z: this.S.lane.z, soft: this.soft, breakable: this.breakable, floor: AT.y - 12,
      spikes: [[AT.x + 20, AT.x + 23.2, AT.y - 2]], exit: { x: AT.x + TROUPE.exit[0], y: AT.y + TROUPE.exit[1] },
      plank: (x0, x1, top) => this.plank(x0, x1, top), lost: () => { this.state.lost++; }, saved: () => this.onSaved(),
    });
    for (const s of [...this.soft, ...this.breakable]) { s.on = true; s.collider?.setEnabled(true); if (s.mesh) s.mesh.visible = true; }
    for (const p of this.planks) this.dropPlank(p);
    this.planks = [];
    this.state = { dropped: 0, saved: 0, lost: 0, left: { ...JOBS_GIVEN }, t: TROUPE.every - TROUPE.first };
  },
  plank(x0, x1, top) {
    const g = this.well.game, mid = new THREE.Vector3((x0 + x1) / 2, top - 0.09, this.S.lane.z);
    const r = this.well.kit.box([mid.x, mid.y, mid.z], [x1 - x0, 0.18, 2.4], COLOR.spool, { own: true, outline: false, lane: 'troupe' });
    this.planks.push(r); g.events && (r.at = g.events.time);
    return r;
  },
  dropPlank(r) {
    const K = this.well.kit; if (!K) return;
    if (r.collider) { try { this.well.game.physics.world.removeCollider(r.collider, false); } catch { /* (gone already) */ } const i = K.colliders.indexOf(r.collider); if (i >= 0) K.colliders.splice(i, 1); }
    if (r.mesh) { r.mesh.removeFromParent(); r.mesh.geometry.dispose(); r.mesh.material.dispose(); const j = K.owned.indexOf(r.mesh); if (j >= 0) K.owned.splice(j, 1); }
  },
  onSaved() {
    const W = this.well; this.state.saved++;
    if (this.state.saved >= TROUPE.need && W.stage?.id === 'troupe' && !W.stage.cleared) W.clear();
  },

  enter() { this.retry.cancel(); this.check = 0; this.restart(); },
  leave() { this.troupe?.clear(); this.troupe = null; this.retry?.cancel(); if (this.marker) this.marker.visible = false; },
  spots() {
    if (!this.S) return [];
    return [[1, 0], [66.6, -7]].map(([x, y]) => ({ ref: 'troupe.restart', pos: this.S.at(x, y + 1.6, -0.8), x: AT.x + x, y: AT.y + y }));
  },
  use(well, ref) { if (ref !== 'troupe.restart') return false; this.restart(); return true; },

  update(well, dt) {
    if (!this.S) return;
    if (well.stage?.id !== 'troupe' || !this.troupe) { if (this.troupe && well.stage?.id !== 'troupe') this.leave(); return; }
    const g = well.game, P = g.player, St = this.state, ax = P.pos.x - AT.x, ay = P.pos.y - AT.y;
    // the hatch
    if (St.dropped < TROUPE.count && (St.t += dt) >= TROUPE.every) { St.t = 0; St.dropped++; this.troupe.spawn(this.S.at(TROUPE.hatch[0], TROUPE.hatch[1])); }
    this.troupe.update(dt);
    // a job given: keys 1 to 6, to the dummy picked
    const pick = this.pick(well);
    this.marker.visible = !!pick; if (pick) this.marker.position.set(pick.pos.x, pick.pos.y + 1.85, pick.pos.z ?? this.S.lane.z);
    const inp = g.input;
    KEYS.forEach((k, i) => {
      if (!inp.wasPressed(k) || !pick) return;
      const job = JOBS[i]; if (St.left[job] <= 0 && !(job === 'block' && pick.job === 'block')) return;
      const was = pick.job;
      if (this.troupe.give(pick, job)) { if (!(job === 'block' && was === 'block')) St.left[job]--; well.verb('jobs'); }
    });
    const home = St.saved, out = St.lost, alive = TROUPE.count - home - out;
    this.say(this.jobsTag, JOBS.map((j, i) => `${i + 1} ${j.toUpperCase()} ${St.left[j]}`).join('  '));
    this.say(this.savedTag, alive + home < TROUPE.need && home < TROUPE.need ? `SAVED ${home} / ${TROUPE.need}  F: AGAIN` : `SAVED ${home} / ${TROUPE.need}`);
    // your own falls and the pins
    this.retry.update(dt);
    if (this.retry.busy) return;
    if (P.grounded) CHECKS.forEach(([x, y], i) => { if (i > this.check && ax >= x - 0.5 && Math.abs(ay - y) < 1.5) this.check = i; });
    const back = () => { const [x, y] = CHECKS[this.check]; return [x, y, this.S.lane.z]; };
    if (ax > 20 && ax < 23.2 && ay < -1.3) { well.hit(); this.retry.fall(back(), 'spikes'); }
    else if (ay < -12) this.retry.fall(back(), 'fall');
  },

  /** The dummy a key would give its job to: under the cursor (the pointer free), or the nearest the Courier within reach. */
  pick(well) {
    const g = well.game, P = g.player, inp = g.input, list = this.troupe?.list.filter((c) => !c.out) || [];
    if (!list.length) return null;
    if (!inp.locked && inp.mx >= 0) {
      const v = new THREE.Vector3((inp.mx / innerWidth) * 2 - 1, -(inp.my / innerHeight) * 2 + 1, 0.5).unproject(g.camera), o = g.camera.position, d = v.sub(o).normalize();
      if (Math.abs(d.z) > 1e-3) {
        const t = (this.S.lane.z - o.z) / d.z, hx = o.x + d.x * t, hy = o.y + d.y * t;
        let best = null, bd = TROUPE.cursor;
        for (const c of list) { const dd = Math.hypot(c.pos.x - hx, c.pos.y + 0.5 - hy); if (dd < bd) { bd = dd; best = c; } }
        if (best) return best;
      }
    }
    let best = null, bd = TROUPE.pick;
    for (const c of list) { const dd = Math.hypot(c.pos.x - P.pos.x, (c.pos.y - P.pos.y) * 1.5); if (dd < bd) { bd = dd; best = c; } }
    return best;
  },

  clear() { this.troupe?.clear(); this.troupe = null; for (const T of [this.jobsTag, this.savedTag]) { T?.tex.dispose(); T?.s.material.dispose(); } this.S = null; this.planks = []; },
};
