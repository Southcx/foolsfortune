// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE PIT (docs/plans/STRAWMANS-WELL.md 3.12): the precision gauntlet. Everything here kills, and a death costs only
// PIT.retry real s (Super Meat Boy's): said as `well.pit.death` { stage: 'pit', cause }, the Courier held a beat, then back at the last
// save, every trap set again. The room's own fall retry is off (`noRetry`): a fall is one more death here, with the rest.
//   spikes and saws        pins on the boards; pinking wheels on a beat, up and down, and along the floor (the Pit's kit, pitkit.js)
//   falling ceilings       a block that drops when you come near it, rests, and rises slowly: wait for it, then run under it on its way up
//   the save               a shrine you shoot to save at (I Wanna Be the Guy's): the psygun is lent for the stage, aimed eight ways
//                          (arsenalaim.js); walking past one saves nothing
//   troll traps            the apple among the spikes that falls up as you come to jump them; a stretch of boards that is not there; the
//                          goal's flag that runs away the first time you reach for it (each said once as the verb)
//   the ghosts             every attempt's path kept; at the clear, all of them run again at once, each bursting where it died, the
//                          camera following the middle of them (Super Meat Boy's replay)
// Placeholder looks; Calissa dresses them. Words placeholders, Espada's.
//
// Prior art: Super Meat Boy (instant retry, the saws, the replay of every death), I Wanna Be the Guy (the Delicious Fruit that falls up,
// the save shot to set, the floor that is not there, the death count), Super Mario Bros.' Thwomp (the falling ceiling).
//
//   default export: a stage module (stagemods.js's contract)   PITS (its traps' numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PIT } from '../../../progress/strawmanwell.js';
import { scaffold, floor, goalFlag, sign } from '../stages.js';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { SIDE_CAM } from '../wellframe.js';
import { PlaneAim, lendTool } from './arsenalaim.js';
import { SpikeBatch, saw, Retry, Ghosts, hitsRect, hitsCircle } from './pitkit.js';

/** A falling ceiling (its width, rest height, fall acceleration m/s^2, time on the boards and rise m/s, how near sets it off m), the apple
 *  (its radius, its fall upward m/s^2, and the lane x past which it goes). */
export const PITS = { crush: { w: 2, h: 2, top: 5, accel: 40, rest: 0.8, rise: 3, near: 1 }, apple: { r: 0.26, up: 20, at: 61.2 } };
const SAWS = [ // (x(t), y(t) in lane metres, r)
  { r: 0.55, at: (t) => [24, 2.05 + 1.35 * Math.sin(t * 2 * Math.PI / 2.4)] },
  { r: 0.55, at: (t) => [29, 2.05 - 1.35 * Math.sin(t * 2 * Math.PI / 2.4)] },
  { r: 0.4, at: (t) => [91 + 3 * Math.sin(t * 2 * Math.PI / 3), 0.4] },
  { r: 0.45, at: (t) => [101 + 2 * Math.sin(t * 2 * Math.PI / 2.6), 3] },
];
const _v = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const inside = (p, r, pad = 0.15) => p.x > r.x0 - pad && p.x < r.x1 + pad && p.y > r.y0 - pad && p.y < r.y1 + pad;

export default {
  id: 'pit',
  build(well, S) {
    const len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y, z = S.z;
    const st = (this.st = { well, S, offs: [], save: 0, t: 0, played: false });
    scaffold(S, len);
    floor(S, -1, 68); floor(S, 70.2, len + 1); S.box(68, 70.2, -6, -2.5, COLOR.boards); // (the false boards' pit: spikes at its foot)
    const K = new SpikeBatch(), kills = (st.kills = []);
    for (const [a, b, y] of [[9, 10.5, 0], [14, 15.6, 0], [62, 63.5, 0], [68, 70.2, -2.5], [100, 101.6, 0]]) kills.push(K.row(X(a), X(b), Y(y), 1, z));
    K.build(S);
    for (const r of kills) well.verbs.surface({ x0: r.x0, x1: r.x1, y1: r.y1 }, 'spike'); // (a downward blow over spikes is a pogo: verbs.js)
    sign(S, 'THE PIT', 4, 4.4, 'a death costs 0.4 s; Shift runs');
    // saws on a beat
    st.saws = SAWS.map((s) => ({ ...saw(S, s.r, z), path: s.at }));
    S.box(23.9, 24.1, 0, 4, COLOR.thread, { collide: false, d: 0.05, dz: -0.6, outline: false }); S.box(28.9, 29.1, 0, 4, COLOR.thread, { collide: false, d: 0.05, dz: -0.6, outline: false });
    sign(S, 'SAWS', 26.5, 5.6, 'under them on their way up');
    // the save shrines: shot to save
    st.saves = [[2, 0, null]];
    for (const x of [36, 82]) {
      const b = S.box(x - 0.3, x + 0.3, 3.3, 3.9, COLOR.gold, { own: true, d: 0.6 });
      st.saves.push([x, 0, { ...b, rect: { x0: X(x - 0.3), x1: X(x + 0.3), y0: Y(3.3), y1: Y(3.9) } }]);
    }
    sign(S, 'SAVE', 34, 5.6, 'shoot it to save here (W aims up)');
    // falling ceilings
    const C = PITS.crush;
    st.crushers = [41, 46, 51, 110].map((x) => {
      const b = S.box(x - C.w / 2, x + C.w / 2, C.top, C.top + C.h, COLOR.mark, { own: true, collide: false });
      return { x, mesh: b.mesh, bottom: C.top, state: 'up', t: 0, v: 0, y0: b.mesh.position.y };
    });
    sign(S, 'FALLING CEILINGS', 46, 8.4, 'let one fall, then run under it as it rises');
    // the trolls: the apple that falls up, the boards that are not there, the flag that runs
    st.apple = { mesh: new THREE.Mesh(new THREE.SphereGeometry(PITS.apple.r, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.4 })), home: S.at(63, 0.5 + PITS.apple.r) };
    S.add(st.apple.mesh);
    { const b = S.box(68, 70.2, -0.4, 0, COLOR.boards, { own: true }); st.falseBoards = { ...b, y0: b.mesh.position.y, x0: X(68), x1: X(70.2) }; }
    sign(S, 'JUMP IT', 62.7, 3.6, 'nothing here can hurt you');
    st.goal = [120, 0]; st.flag = goalFlag(S, 120, 0); st.flagX = { post: st.flag.post.position.x, flag: st.flag.flag.position.x, k: 0, ran: false };
    sign(S, 'THE LAST OF IT', 94, 5.6, null);
    st.death = new Retry(well, 'pit', () => this.respawn());
    st.ghosts = new Ghosts(S, PIT.ghosts);
    st.aim = new PlaneAim(well, ['pit']);
    st.offs.push(
      well.game.events?.on('shot.fire', (e) => this.shot(e)),
      well.game.events?.on('zone.acoustic', () => { if (!well.here) this.leave(well); }),
    );
    this.reset();
    return { goal: st.goal, door: [127.5, 0], checks: st.saves.map(([x, y]) => [x, y]), noRetry: true };
  },

  /** Every trap set again (each attempt meets them fresh). */
  reset() {
    const st = this.st;
    for (const c of st.crushers) { c.state = 'up'; c.bottom = PITS.crush.top; c.t = 0; c.v = 0; c.mesh.position.y = c.y0; }
    st.apple.state = 'rest'; st.apple.v = 0; st.apple.mesh.position.copy(st.apple.home); st.apple.mesh.visible = true;
    const F = st.falseBoards; F.state = 'there'; F.collider?.setEnabled(true); F.mesh.position.y = F.y0; F.mesh.visible = true;
  },
  troll() { this.st.well.verb('troll'); },
  respawn() {
    const st = this.st, [x, y] = st.saves[st.save], P = st.well.game.player;
    P.moveTo(_v.set(AT.x + x, AT.y + y + 0.05, st.S.z), new THREE.Vector3()); st.well.frame.face = 1;
    this.reset(); st.ghosts.begin();
  },
  shot(e) {
    const st = this.st, W = st?.well; if (!st || W.stage?.id !== 'pit' || !e?.at) return;
    st.saves.forEach(([, , b], i) => {
      if (!b || !inside(e.at, b.rect)) return;
      if (i > st.save) st.save = i; // (a save behind you never takes you back)
      b.mesh.material.color.setHex(COLOR.felt); b.lit = 0.4;
      W.game.fx?.impact?.(b.mesh.position.clone(), UP, { sparks: 12, dust: 2 });
      W.verb('shootSave');
    });
  },

  enter(well) {
    const st = this.st; if (!st) return;
    st.lend?.restore(); st.lend = lendTool(well, 'psygun', { draw: false }); st.aim.on();
    st.save = 0; st.played = false; st.death.cancel(); this.reset();
    const R = st.flagX; R.ran = false; R.k = 0; st.goal[0] = 120; st.flag.post.position.x = R.post; st.flag.flag.position.x = R.flag;
    for (const [, , b] of st.saves) b?.mesh.material.color.setHex(COLOR.gold);
    st.ghosts.dispose(); st.ghosts.begin();
  },
  leave() {
    const st = this.st; if (!st) return;
    st.aim?.off(); st.lend?.restore(); st.lend = null; st.death.cancel(); st.ghosts.end(false);
  },

  /** After each fixed step: the traps move, what touches you kills, the path is kept. */
  post(well, dt) {
    const st = this.st; if (!st || well.stage?.id !== 'pit') return;
    const P = well.game.player, X = (x) => AT.x + x, Y = (y) => AT.y + y;
    st.t += dt;
    for (const s of st.saws) { const [x, y] = s.path(st.t); s.place(X(x), Y(y), dt); }
    // the falling ceilings
    const C = PITS.crush;
    for (const c of st.crushers) {
      if (c.state === 'up' && Math.abs(P.pos.x - X(c.x)) < C.w / 2 + C.near && !st.death.dead) { c.state = 'fall'; c.v = 0; }
      else if (c.state === 'fall') { c.v += C.accel * dt; c.bottom -= c.v * dt; if (c.bottom <= 0) { c.bottom = 0; c.state = 'rest'; c.t = C.rest; well.game.fx?.impact?.(_v.set(X(c.x), Y(0.1), st.S.z + 0.8), UP, { sparks: 2, dust: 10 }); } }
      else if (c.state === 'rest' && (c.t -= dt) <= 0) c.state = 'rise';
      else if (c.state === 'rise') { c.bottom += C.rise * dt; if (c.bottom >= C.top) { c.bottom = C.top; c.state = 'up'; } }
      c.mesh.position.y = c.y0 - (C.top - c.bottom);
    }
    // the apple that falls up
    const A = st.apple;
    if (A.state === 'rest' && P.pos.x > X(PITS.apple.at) && !st.death.dead) { A.state = 'up'; this.troll(); }
    if (A.state === 'up') { A.v += PITS.apple.up * dt; A.mesh.position.y += A.v * dt; if (A.mesh.position.y > Y(16)) { A.state = 'gone'; A.mesh.visible = false; } }
    // the boards that are not there
    const F = st.falseBoards;
    if (F.state === 'there' && P.grounded && P.pos.x > F.x0 - 0.2 && P.pos.x < F.x1 + 0.2 && Math.abs(P.pos.y - Y(0)) < 0.15) { F.state = 'gone'; F.collider?.setEnabled(false); F.v = 0; this.troll(); }
    if (F.state === 'gone') { F.v = (F.v || 0) + 20 * dt; F.mesh.position.y -= F.v * dt; if (F.mesh.position.y < F.y0 - 8) F.mesh.visible = false; }
    if (st.death.dead) { st.death.post(dt); return; }
    st.ghosts.sample(P.pos.x, P.pos.y, dt);
    if (well.stage.cleared) return;
    // what kills
    let cause = null;
    if (st.kills.some((r) => hitsRect(P, r))) cause = 'spike';
    else if (st.saws.some((s) => hitsCircle(P, s.x, s.y, s.r))) cause = 'saw';
    else if (st.crushers.some((c) => c.bottom < C.top && hitsRect(P, { x0: X(c.x - C.w / 2), x1: X(c.x + C.w / 2), y0: Y(c.bottom), y1: Y(c.bottom + C.h) }, 0.05))) cause = 'crush';
    else if (A.state === 'up' && hitsCircle(P, A.mesh.position.x, A.mesh.position.y, PITS.apple.r + 0.1)) cause = 'troll';
    else if (P.pos.y < Y(-6)) cause = 'fall';
    if (cause) { st.ghosts.end(true); st.death.kill(cause); }
  },

  update(well, dt) {
    const st = this.st; if (!st) return;
    if (well.stage?.id !== 'pit') { if (st.lend) this.leave(well); return; }
    const g = well.game, P = g.player, raw = g.rawDt ?? dt;
    // the flag that runs, the first time it is reached for
    const R = st.flagX;
    if (!R.ran && P.pos.x > AT.x + st.goal[0] - 3) { R.ran = true; st.goal[0] += 4; this.troll(); }
    if (R.ran && R.k < 1) { R.k = Math.min(1, R.k + raw * 3); st.flag.post.position.x = R.post + 4 * R.k; st.flag.flag.position.x = R.flag + 4 * R.k; }
    // the ghosts, once the stage is cleared
    if (well.stage.cleared && !st.played) { st.played = true; if (st.ghosts.play()) well.verb('ghosts'); }
    st.ghosts.update(raw, g.fx);
  },

  /** While the ghosts run, the camera follows the middle of them (the frame's seat and height band), then gives the Courier back. */
  camera(well, dt) {
    const st = this.st, G = st?.ghosts; if (!G?.playing || well.stage?.id !== 'pit' || !G.runs.length) { if (st) st.gx = null; return; }
    const cam = well.game.camera, F = well.frame.spec, k = Math.floor(G.t / G.step);
    let sx = 0, sy = 0, n = 0;
    for (const r of G.runs) { const m = r.xy.length / 2; if (k >= m) continue; sx += r.xy[2 * k]; sy += r.xy[2 * k + 1]; n++; }
    if (!n) return;
    const x = THREE.MathUtils.clamp(sx / n, F.x0 + SIDE_CAM.edge, F.x1 - SIDE_CAM.edge), y = THREE.MathUtils.clamp(sy / n + SIDE_CAM.lift, F.band[0], F.band[1]);
    st.gx = st.gx == null ? x : st.gx + (x - st.gx) * (1 - Math.exp(-SIDE_CAM.ease * dt));
    cam.position.set(st.gx, y, F.z + SIDE_CAM.dist); cam.lookAt(st.gx, y - SIDE_CAM.look, F.z); cam.updateMatrixWorld();
  },

  clear(well) {
    const st = this.st; if (!st) return;
    this.leave(well);
    for (const off of st.offs) off?.();
    st.ghosts.dispose();
    this.st = null;
  },
};
