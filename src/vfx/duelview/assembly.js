// ---------------------------------------------------------------------------------------
// THE TSUITATE'S ASSEMBLY (plain name; South, 2026-10-30: "the tsuitate itself should have a 'build' animation as it assembles itself for
// the initiation of the duel. This happens before the gems are seeded"): a puzzle duel's board not stood at once but built in front of
// you, a stage set raised in view, before the seeding deals its pieces in (seeding.js):
//   THE POSTS   the two clay posts rise out of the ground, overshooting a hair, the back plate rising behind them
//   THE RAILS   slid in along the posts as a sash is: the top rail (its ash run with it) dropped down onto them, the foot rail pushed up
//               from the ground between them, each stopping dead with a clack: clay chips and brass sparks off the corners, the bosses
//               popped in at the second (along the posts, never across the fighters beside them)
//   THE FEET    the feet drop out of the frame like a flat's braces and plant; the frame settles the last hand's breadth onto them, dust
//               thrown off the ground, and the frame's dress (framedress.js) is on it
//   THE PANES   the Lachrymite grows in from the frame as crystal: a front of crystallisation sweeping across each half from its outer
//               post to the Line, ragged with dendrites, the liquid before it dark and clear, the fresh crystal flashing in the film and
//               calming behind the front (the slab's program, domains.js `setBuild`); motes thrown off the fronts
//   THE GRID    the cells scribed in line by line in the film, the rows left to right, then the columns down, each line cooling behind its
//               point to the quiet checker
//   THE LINE    its seam lit last, a fuse running up from the foot; its brass beads popped in, both halves flashed, and the kintsugi seam,
//               the odds plate, the countdowns, the counts and the skill troughs come on with it
// About 1.9 real s. A PvE duel's begins as the VS open's bands leave (duelshow.js `go`, SHOW.vs.build), so the camera pulls out onto it;
// any other begins as the view opens (ASSEMBLY.open), the arena held for it (the stage's intro). Held unbuilt while the encounter's wipe
// covers the screen, and never past ASSEMBLY.wait; every open plays it once, and a resync, a skipped turn or the close ends it at once
// (seeding.js clear). When it is done the seeding deals the board in.
// Programs: none of its own (the members are the clay's; the panes, the grid and the Line the slab's; the chips, sparks and dust the duel's
// bursts).
// Prior art: Tetris Effect's playfield assembling out of particles at a stage's start, Puzzle Fighter's wells dropping in under the
// fighters' intro, Lumines' skin change rebuilding the board, the kurogo raising a kabuki set in full view of the house, Tron's grid
// scribed in light, and the hot-ice demonstration (a seed touched to supersaturated sodium acetate, the crystal front running out from it).
//
//   const A = new DuelAssembly(view)   A.open() (the view's open, after the show's)   A.go(delay)   A.update(dt) (after the gauges, the
//   dress and the odds plate)   A.clear() (done at once)   A.busy   ASSEMBLY (the knobs)
// Sounds (Wanda's, optional): sfx.duelAssemble(beat, i) at 'post' (i 0 yours, 1 the foe's), 'clack' (0 the top rail, 1 the foot), 'feet',
// 'crystal', 'etch', 'line', and 'done' (the seeding ASSEMBLY.seed real s after).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { DUEL_VIEW, sm, clamp01, ease } from './layout.js';

/** Each beat's span (real s from its start); postLag: the foe's post after yours; railFrom: how far over its place the top rail starts (m); drop:
 *  the frame's height over its feet before it settles (m); dur: its length; open: real s after a duel without the VS open before it begins;
 *  intro: the arena held that much longer for it (the stage's); seed: real s from its end to the seeding's deal; wait: the longest it is
 *  held before it begins (real s, the wipe's cover not counted); motes: real s between the fronts' motes. */
export const ASSEMBLY = {
  posts: [0, 0.4], postLag: 0.06, back: [0.1, 0.46], rails: [[0.32, 0.64], [0.4, 0.72]], railFrom: 1.3,
  feet: [0.7, 0.86], settle: [0.84, 1.0], drop: 0.12, panes: [0.92, 1.42], etch: [1.2, 1.68], line: [1.56, 1.84],
  dur: 1.9, open: 0.2, intro: 1.6, seed: 0.05, wait: 6, motes: 0.045,
};
const CLAY = 0x94603e, BRASS = 0xffd36a, DUST = 0xcfc3b0, FILM = 0x9ee6ff, _p = new THREE.Vector3();

export class DuelAssembly {
  constructor(view) { this.view = view; this.on = false; this.t = 0; this.start = Infinity; this.fired = new Set(); this.moteT = 0; this.hid = []; }
  get busy() { return this.on; }

  /** At the view's open: the frame taken down to nothing; a duel without the VS open begins it at once (and holds the arena for it). */
  open() {
    const V = this.view; if (!V.board?.parts) return;
    this.on = true; this.t = 0; this.start = Infinity; this.fired.clear(); this.hid.length = 0; this.pose(-1);
    if (!V.show?.on) { this.go(ASSEMBLY.open); if (V.stage) V.stage.introT = ASSEMBLY.open + ASSEMBLY.intro; }
  }

  /** It begins `delay` real s from now (once). */
  go(delay = 0) { if (this.on && this.start === Infinity) this.start = this.t + Math.max(0, delay); }

  update(dt) {
    if (!this.on) return; const W = this.view.game.aberrantWipe;
    if (!(this.t >= this.start) && W?.active && W.covered) { this.pose(-1); if (!this.view.show?.on && this.view.stage) this.view.stage.introT = this.view.stage.t + ASSEMBLY.open + ASSEMBLY.intro; return; } // (the encounter's wipe over the screen: nothing built yet, the arena's hold kept for it)
    this.t += dt; if (this.start === Infinity && this.t > ASSEMBLY.wait) this.start = this.t;
    const a = this.t - this.start; this.pose(a, dt);
    if (a >= ASSEMBLY.dur) this.finish();
  }

  /** The frame `a` real s into its building (below nought: nothing of it). */
  pose(a, dt = 0) {
    const V = this.view, B = V.board, P = B.parts, A = ASSEMBLY; if (!P) return;
    const k = (r, lag = 0) => clamp01((a - r[0] - lag) / (r[1] - r[0])), raw = (r) => Math.max(0, (a - r[0]) / (r[1] - r[0]));
    const { base, border: b } = DUEL_VIEW, W = B.W, H = B.H, top = base + H;
    // the posts and the back plate, risen out of the ground
    [[P.postL, 0], [P.postR, A.postLag]].forEach(([m, lag], i) => { const p = k(A.posts, lag), r = m.userData.rest;
      m.visible = p > 0; m.position.set(r.x, r.y * sm(p), r.z); m.scale.set(1, Math.max(1e-3, ease(p, 1.6)), 1);
      if (p > 0) this.once(`post${i}`, () => { this.burst(r.x, 0.03 - B.group.position.y, 0, DUST, 8, { speed: 0.7, life: 0.5, fall: -0.4, spread: 0.12, size: 0.022 }); sfx.duelAssemble?.('post', i); }); });
    const pb = k(A.back); P.back.visible = pb > 0; P.back.scale.set(1, Math.max(1e-3, sm(pb)), 1);
    // the rails, slid in along the posts (the top one down, the foot one up from the ground), stopped dead with a clack; the bosses at the second
    [[P.railTop, A.railFrom, top + b / 2], [P.railFoot, -(base - b / 2), base - b / 2]].forEach(([m, from, y], i) => { const p = k(A.rails[i]), r = m.userData.rest;
      m.visible = p > 0; m.position.set(r.x, r.y + from * (1 - p * p), r.z); // (gathering speed and stopped dead)
      if (p >= 1) this.once(`clack${i}`, () => { for (const s of [-1, 1]) { const x = s * (W / 2 + b / 2); this.burst(x, y, 0.05, CLAY, 7, { speed: 1.1, life: 0.45, fall: 3, spread: 0.06, size: 0.02 }); this.burst(x, y, 0.08, BRASS, 6, { speed: 1.6, life: 0.3, fall: 1, spread: 0.04, size: 0.012 }); }
        V.stage?.jolt?.(0.16 + 0.06 * i); sfx.duelAssemble?.('clack', i); }); });
    const pc = clamp01((a - A.rails[1][1]) / 0.16); P.boss.visible = pc > 0; P.boss.scale.setScalar(Math.max(1e-3, ease(pc, 2.2)));
    // the feet, dropped out of the frame; the frame settling onto them
    const pf = k(A.feet), ps = k(A.settle), land = a - A.settle[1];
    for (const m of P.feet) { m.visible = pf > 0; m.scale.set(1, Math.max(1e-3, sm(pf) * (land > 0 ? 1 - 0.08 * Math.exp(-land * 10) * Math.cos(land * 25) : 1)), 1); }
    B.group.position.y = A.drop * (1 - ps * ps);
    if (ps >= 1) this.once('feet', () => { for (const m of P.feet) { this.burst(m.position.x - 0.25, 0.03, 0, DUST, 9, { speed: 0.9, life: 0.6, fall: -0.3, spread: 0.1, size: 0.026 }); this.burst(m.position.x + 0.25, 0.03, 0, DUST, 9, { speed: 0.9, life: 0.6, fall: -0.3, spread: 0.1, size: 0.026 }); }
      V.stage?.jolt?.(0.3); sfx.duelAssemble?.('feet'); });
    // the panes, the grid and the Line on the slab (passed on past 1 so the crystal's flash and the lines' glow cool before it ends)
    const pp = raw(A.panes), pe = raw(A.etch), pl = k(A.line);
    V.clash.setBuild(pp, pe, pl, true);
    if (pp > 0 && pp < 1) { this.once('crystal', () => sfx.duelAssemble?.('crystal')); this.fronts(pp, dt); }
    if (pe > 0) this.once('etch', () => sfx.duelAssemble?.('etch'));
    for (const m of [B.head, B.foot]) m.scale.setScalar(Math.max(1e-3, ease(clamp01((a - A.line[1]) / 0.14), 2.4)));
    if (pl >= 1) this.once('line', () => { V.clash.flash(0, 0.45); V.clash.flash(1, 0.45); V.stage?.jolt?.(0.25); sfx.duelAssemble?.('line');
      for (const m of [B.head, B.foot]) { this.burst(m.position.x, m.position.y, 0.06, FILM, 10, { speed: 1.2, life: 0.5, fall: 0, spread: 0.05, size: 0.018 }); this.burst(m.position.x, m.position.y, 0.06, BRASS, 6, { speed: 0.8, life: 0.4, fall: 1, size: 0.014 }); } });
    // what stands on the frame waits for it: the kintsugi, the beads, the EmO columns and the floor lips; the dress (from the settle), the
    // figurines (from the panes), and the odds plate, the countdowns, the counts and the troughs (from the Line)
    const built = pl >= 1;
    P.kin.visible = built; B.beads.visible = built; for (const m of B.emoBars) m.visible = built; for (const m of B.lips) if (!built) m.visible = false;
    this.show(V.dress?.group, ps >= 1); this.show(V.marks?.group, built); this.show(V.foeCast?.group, built);
    if (!built) { if (V.gauges?.group) V.gauges.group.visible = false; if (V.flee?.oddsP?.mesh) V.flee.oddsP.mesh.visible = false; }
    for (const v of V.pieces.list) { if (v.kind === 'body') { if (pp < 1 && !v.hidden) { v.hidden = true; this.hid.push(v); } } else if (!built) v.hidden = true; } // (a classic duel's figurines stand once their cells are crystal; the gems wait for the deal)
    if (pp >= 1 && this.hid.length) { for (const v of this.hid) v.hidden = false; this.hid.length = 0; }
  }

  /** Motes thrown off the two crystal fronts as they sweep (the film's), every ASSEMBLY.motes real s. */
  fronts(p, dt) {
    if ((this.moteT -= dt) > 0) return; this.moteT = ASSEMBLY.motes;
    const V = this.view, B = V.board, { cs, base } = DUEL_VIEW, W = B.W, lx = ((V.lineCol ?? B.w / 2) - B.w / 2) * cs, f = clamp01(p * 1.45 - 0.19); // (where the slab's front runs: domains.js)
    for (const x of [-W / 2 + f * (lx + W / 2), W / 2 - f * (W / 2 - lx)]) this.burst(x, base + Math.random() * B.H, 0.05, FILM, 2, { speed: 0.5, life: 0.5, fall: -0.4, spread: 0.02, size: 0.014 });
  }

  burst(x, y, z, hex, n, o) { const V = this.view; if (V.bursts) V.bursts.burst(_p.set(x, y + V.board.group.position.y, z), hex, n, o); } // (the board's frame; the bursts copy it)
  once(key, fn) { if (this.fired.has(key)) return; this.fired.add(key); fn(); }
  show(g, on) { if (g) g.visible = on; }

  /** Its last beat: the frame at rest, all on, and the deal begun (a deal laid for pieces stood again meanwhile laid afresh). */
  finish() {
    const V = this.view, S = V.seeding; this.clear(); sfx.duelAssemble?.('done');
    if (S?.list?.length && !V.pieces.list.includes(S.list[0].v)) S.hold();
    S?.go?.(ASSEMBLY.seed);
  }

  /** Done at once: every member where it stands, everything on it shown, the slab built. */
  clear() {
    const V = this.view, B = V.board, P = B?.parts; this.on = false; this.start = Infinity;
    if (!P) return;
    for (const m of [P.postL, P.postR, P.railTop, P.railFoot, P.back, ...P.feet]) { m.visible = true; m.position.copy(m.userData.rest); m.scale.set(1, 1, 1); }
    P.boss.visible = true; P.boss.scale.setScalar(1); P.kin.visible = true; B.head.scale.setScalar(1); B.foot.scale.setScalar(1); B.group.position.y = 0;
    B.beads.visible = true; for (const m of B.emoBars) m.visible = true; B.placeLips?.();
    V.clash.setBuild(0, 0, 0, false);
    for (const g of [V.dress?.group, V.marks?.group, V.foeCast?.group]) this.show(g, true);
    for (const v of this.hid) v.hidden = false; this.hid.length = 0;
  }
}
