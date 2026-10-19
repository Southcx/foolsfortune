// ---------------------------------------------------------------------------------------
// THE DUEL'S VIEW (board v11, signed off by the owner 2026-10-19: "blowing my mind ... please go forwards with ingame implementation"):
// a puzzle duel (Dovina's rules, progress/duel/) drawn in the world, for the duel's session (Petra's: the room, the seam, the camera,
// the controls, the turn loop) to drive. The look is the tsuitate (the owner's pick A): a standing screen of Lachrymite 20 x 20 in
// Anagami's clay frame, broadside between the Courier and the foe, the Courier's half nearest them, down the world's down, a real
// object in the world so the god hand hovers over the real board; and behind it the domains' clash, the two minds' grounds unfolding
// round the arena and meeting at the Line (the owner: "two Domain Expansions in Jujutsu Kaisen meeting").
//
// Its parts (src/vfx/duelview/): the layout's numbers (layout.js), the tsuitate (board.js), the pieces as instances (pieces.js, modelled
// in piecemodels.js), the domains' clash (domains.js: the view's one program, the slab's too), the marks over the board (marks.js), the
// foe's forecast (intent.js), the bursts (bursts.js), and the beats that play the kernel's events (beats.js, the tools' in toolbeats.js).
// This module is the interface and the wiring: where the board stands, which half is whose colour, the counts and points it shows, the
// spiritual link's far end while the duel is open (the board's Courier, or the god hand over its half), and the foe's stars in the world.
//
// Prior art (the mock's museum labels): Super Puzzle Fighter II Turbo (the two fighters beside their wells, gems as cut stones), Puyo
// Puyo (the chain voice, nuisance thrown in), Panel de Pon (the chain counter on the panels), Meteos (each place's gravity read from
// motion), Into the Breach (the foe's next move on the board), Noon (the shared field and its territories), and the tsuitate (衝立).
//
//   game.duelView = new DuelView(game)   (main.js; prewarmed at boot: DuelView.prewarm() -> park)
//   open({ state, foe, at, facing })   state: a kernel duel (newDuel); foe: the creature (its feeling: foe.grade, else the ruleset's,
//                                      else Fury); at: a Vector3 on the ground; facing: a Vector3 from the board toward the Courier,
//                                      or a yaw whose forward (sin yaw, 0, cos yaw) points at the Courier. The board's face looks along
//                                      `face` (world): stand the camera on that side to read the Courier's half on the left
//   play(events) -> Promise            the kernel's events, in order (act's, endTurn's, bot.play's), resolved once shown; queued
//   intent(plan | null)                the foe's live forecast (bot.plan(state, 1)), its first step bold; null clears it
//   cellAt(ray) -> { x, y } | null     the cell a THREE.Ray meets on the slab's face (the god hand's pick)
//   hover(cell | null)   select(cells)   close()   update(rawDt) (main.js)   .isOpen .busy .face .root .state
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../progress/weather.js';
import { newDuel } from '../progress/duel/duel.js';
import { RULESETS } from '../progress/duel/rulesets.js';
import { filmColour } from './oxidation.js';
import { DUEL_VIEW, cellLocal } from './duelview/layout.js';
import { DomainClash } from './duelview/domains.js';
import { DuelBoard } from './duelview/board.js';
import { DuelPieces } from './duelview/pieces.js';
import { DuelMarks } from './duelview/marks.js';
import { DuelIntent } from './duelview/intent.js';
import { DuelBursts } from './duelview/bursts.js';
import { DuelBeats } from './duelview/beats.js';

const TEAR = 0x7fdcff, COURIER_HEX = '#9fd8ff', UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color(), _r = new THREE.Ray(), _inv = new THREE.Matrix4();

export class DuelView {
  constructor(game) {
    this.game = game; this.isOpen = false; this.closing = false; this.state = null; this.foe = null; this.aspect = 'fury';
    const root = (this.root = new THREE.Group()); root.name = 'duelView'; root.visible = false; root.userData.zoneFree = true; // (it stands in the room it is opened in, and only while open)
    this.frame = new THREE.Group(); root.add(this.frame);
    this.clash = new DomainClash(); root.add(this.clash.dome);
    this.board = new DuelBoard(this.frame, this.clash); this.pieces = new DuelPieces(this.frame); this.marks = new DuelMarks(this.frame);
    this.intentDraw = new DuelIntent(this.frame, this.marks); this.bursts = new DuelBursts(this.frame); this.beats = new DuelBeats(this);
    this.u = new THREE.Vector3(1, 0, 0); this.face = new THREE.Vector3(0, 0, 1); this.centre = new THREE.Vector3();
    this.sent = [0, 0]; this.pending = [0, 0]; this.depth = [0, 0]; this.apShown = [5, 5]; this.forms = ['hand', 'hand']; this.lineCol = 10;
    this.linkEnd = (out) => this.linkAt(out);
    game.scene?.add(root);
  }

  get busy() { return this.beats.busy; }
  get board3() { const b = this.state?.board; return { w: b?.w ?? 20, h: b?.h ?? 20, line: this.lineCol }; }

  /** Stand the board and unfold the domains. */
  open({ state, foe = null, at, facing = null } = {}) {
    if (!state) return;
    this.close(true);
    this.state = state; this.foe = foe; this.isOpen = true; this.closing = false; this.coupDone = false;
    const asp = foe?.grade || foe?.feeling || state.rs?.feeling;
    this.aspect = asp && COLOR[asp] !== undefined ? asp : 'fury';
    // where it stands: +X of its frame from the Courier's end to the foe's, its face along u x up
    const toward = typeof facing === 'number' ? _v.set(Math.sin(facing), 0, Math.cos(facing)) : facing?.isVector3 ? _v.copy(facing).setY(0) : foe?.pos ? _v.copy(at).sub(foe.pos).setY(0) : _v.set(-1, 0, 0);
    if (toward.lengthSq() < 1e-6) toward.set(-1, 0, 0);
    this.u.copy(toward).normalize().negate(); this.face.crossVectors(this.u, UP).normalize();
    this.root.position.copy(at); this.root.rotation.set(0, Math.atan2(-this.u.z, this.u.x), 0); this.root.visible = true;
    this.root.updateMatrixWorld(true); this.centre.copy(at);
    const B = state.board;
    this.board.build(B, this.aspect); this.pieces.build(B, this.aspect); this.marks.layout(B); this.clash.setFoe(this.aspect);
    this.forms = state.sides.map((S) => S.form);
    this.setLine(B.line);
    this.board.won(0); this.readCounts(); this.readPoints(); this.readFight();
    const half = (B.w * DUEL_VIEW.cs) / 2 + 2, oc = _w.copy(at).addScaledVector(this.u, -half), of = foe?.pos ? foe.pos.clone() : at.clone().addScaledVector(this.u, half);
    oc.y += 1; of.y += 1; this.clash.unfold(oc, of);
    this.game.spiritualLink?.attach(this, this.linkEnd);
  }

  /** Fold the domains away and take the board down (at once, with `now`). */
  close(now = false) {
    if (!this.isOpen && !this.closing) return;
    this.isOpen = false; this.beats.clear(); this.intentDraw.clear(); this.marks.hover(null); this.marks.select([]); this.marks.stars(0, 0); this.marks.stars(1, 0);
    this.game.spiritualLink?.detach(this); this.clash.collapse(); this.closing = !now;
    if (now) { this.clash.open = [0, 0]; this.clash.update(0); this.root.visible = false; this.bursts.clear(); }
  }

  play(events) { return this.isOpen ? this.beats.play(events) : Promise.resolve(); }

  intent(plan) {
    if (!plan || !this.isOpen) { this.intentDraw.clear(); return; }
    this.intentDraw.show(this.state, plan, 1, this.aspect); // (the foe's side: the Figment's is side 1)
  }

  /** The cell a ray (world) meets on the slab's face, or null. */
  cellAt(ray) {
    if (!this.isOpen || !ray) return null;
    _r.copy(ray).applyMatrix4(_inv.copy(this.frame.matrixWorld).invert());
    const dz = _r.direction.z; if (Math.abs(dz) < 1e-6) return null;
    const t = -_r.origin.z / dz; if (t < 0) return null;
    _r.at(t, _v);
    const { cs, base } = DUEL_VIEW, B = this.state.board, x = Math.floor(_v.x / cs + B.w / 2), y = Math.floor(B.h - (_v.y - base) / cs);
    return x >= 0 && y >= 0 && x < B.w && y < B.h ? { x, y } : null;
  }
  hover(cell) { this.marks.hover(this.isOpen ? cell : null); }
  select(cells) { this.marks.select(this.isOpen ? cells : []); }

  // ---- what the beats ask of the view
  setLine(col) {
    this.lineCol = col; this.board.setLine(col); this.marks.setLine(col);
    const B = this.state?.board; if (!B) return;
    this.frame.localToWorld(_w.set((col - B.w / 2) * DUEL_VIEW.cs, 0, 0));
    this.clash.setPlane(_w, this.u, this.centre); this.showCounts();
  }
  sideHex(side) { return side === 0 ? COURIER_HEX : '#' + new THREE.Color(COLOR[this.aspect]).getHexString(); } // (the Courier's numbers in the film's teal-violet, one colour: the glyphs' materials are kept per colour)
  filmHex(t) { return filmColour(t + this.clash.t * 0.05, _c).getHex(); }
  known(id) { let k = null; this.state?.board?.each((p) => { if (p.id === id) k = p; }); for (const S of this.state?.sides || []) for (const p of S.queue) if (p.id === id) k = p; return k; }
  showCounts() { this.marks.counts(this.pending[0] + this.sent[1], this.pending[1] + this.sent[0], this.sideHex(0), this.sideHex(1)); }
  count(e) {
    if (e.type === 'offset') { this.sent[e.side] = Math.max(0, this.sent[e.side] - e.n); this.pending[e.side] = Math.max(0, this.pending[e.side] - e.n); }
    else { this.pending[1 - e.side] += e.n; this.sent[e.side] = Math.max(0, this.sent[e.side] - e.n); }
    this.showCounts();
  }
  /** An action's points spent (and, for the Courier's side, its pool's spend as a bead down the link). */
  spend(side, cost, e, price = 0) {
    this.apShown[side] = Math.max(0, this.apShown[side] - (cost || 0));
    const [, max, lost] = this.board.ap[side]; this.board.setAP(side, this.apShown[side], max, lost);
    const amount = e?.spent ?? price; if (side === 0 && amount > 0) this.game.spiritualLink?.bead({ amount });
  }
  drink(e) { if (e.side === 0) this.game.spiritualLink?.bead({ amount: 8, colour: TEAR, rev: true, dur: 0.45 }); }
  form(side, to) { this.forms[side] = to; }
  headOf(side, out) { const v = this.pieces.bodyAt(side); return v ? cellLocal(v.x, v.y - 0.55, this.board3, out).setZ(DUEL_VIEW.front + 0.05) : out.set(0, -99, 0); }
  /** Where the god hand stands over a side's half (the board's frame): the coup's cubes go up into it. */
  handPoint(side, out) { const B = this.board3, cs = DUEL_VIEW.cs, x = side === 1 ? (this.lineCol + B.w) / 2 : this.lineCol / 2; return out.set((x - B.w / 2) * cs, DUEL_VIEW.base + B.h * cs + 0.5, 0.35); }
  /** The coup's drain on the foe in the world (the crackle break, the beats, its data bug mended: vfx/datadrain.js). */
  drainFoe() { const f = this.foe; if (f?.pos && this.game.dataDrain) { this.frame.localToWorld(this.handPoint(1, _w)); this.game.dataDrain.play(f, _w.clone()); } this.depth[1] = 0; }

  readCounts() { const S = this.state.sides; this.sent = [S[0].sent || 0, S[1].sent || 0]; this.pending = [S[0].pending || 0, S[1].pending || 0]; this.showCounts(); }
  readPoints() { const s = this.state; for (const side of [0, 1]) { const S = s.sides[side], left = side === s.toMove ? s.apLeft : S.ap, lost = side === s.toMove ? this.board.ap[side][2] : 0; this.apShown[side] = left; this.board.setAP(side, left, S.ap, Math.min(lost, S.ap - left)); } }
  readFight() { const s = this.state; for (const side of [0, 1]) { const S = s.sides[side]; this.board.setEmo(side, S.emo); this.depth[side] = S.depth || 0; this.marks.stars(side, this.depth[side], this.headOf(side, _w)); } }

  /** The play queue ran dry: the view is made to agree with the duel as it stands (anything the beats did not follow is put right). */
  settleUp() {
    const s = this.state; if (!s || !this.isOpen) return;
    this.pieces.build(s.board, this.aspect); this.board.setGravity(s.board);
    if (this.coupDone) { for (const v of [...this.pieces.list]) if (v.cx >= this.lineCol) this.pieces.remove(v); }
    else this.setLine(s.board.line);
    this.forms = s.sides.map((S) => S.form); this.readCounts(); this.readPoints(); this.readFight();
    if (s.winner === 0) this.board.won(1);
  }

  /** The far end of the spiritual link while open: the board's Courier in its form, or the god hand over its half (overlay px, y up). */
  linkAt(out) {
    const cam = this.game.camera; if (!this.isOpen || !cam) return null;
    if (this.forms[0] === 'courier' && this.pieces.bodyAt(0)) this.headOf(0, _v); else this.handPoint(0, _v);
    this.frame.localToWorld(_v).project(cam); if (_v.z > 1 || _v.z < -1) return null;
    return out.set((_v.x + 1) / 2 * innerWidth, -((1 - _v.y) / 2) * innerHeight, 0);
  }

  update(dt) {
    if (!this.isOpen && !this.closing) return;
    dt = Math.min(dt || 0, 0.1);
    this.beats.update(dt);
    const shown = this.clash.update(dt);
    this.board.update(dt); this.pieces.update(dt); this.marks.update(dt); this.bursts.update(dt);
    for (const side of [0, 1]) if (this.depth[side]) this.marks.stars(side, this.depth[side], this.headOf(side, _w));
    const f = this.foe; if (this.isOpen && this.depth[1] > 0 && f?.alive !== false && f?.pos) this.game.stun?.dizzy?.set(f, f.head?.() || _w.copy(f.pos).setY(f.pos.y + 2), { stunned: true }); // (the same gold stars on the Figment in the world)
    if (this.closing && !shown) { this.closing = false; this.root.visible = false; this.bursts.clear(); }
    else if (this.closing) { const k = Math.max(this.clash.open[0], this.clash.open[1]); this.frame.scale.setScalar(Math.max(0.001, k)); }
    else this.frame.scale.setScalar(1);
  }

  /** For the boot's warm-up (main.js): a duel stood 50 m under the world with every part shown, so its programs compile with the rest. */
  prewarm() {
    const state = newDuel({ ruleset: RULESETS.fury, seed: 1 });
    this.open({ state, at: new THREE.Vector3(0, -50, 0), facing: new THREE.Vector3(-1, 0, 0) });
    this.clash.open = [1, 1]; this.clash.update(0);
    this.marks.numeral('3', new THREE.Vector3(0, 1, 0.1), '#ffffff'); this.marks.hover({ x: 2, y: 18 }); this.marks.stars(1, 2, new THREE.Vector3(0, 1, 0));
    this.bursts.burst(new THREE.Vector3(0, 1, 0), 0xffffff, 4);
    this.intentDraw.show(state, [{ kind: 'swap', at: [12, 18], dir: 'E' }, { kind: 'rotate', at: [12, 16] }], 1, this.aspect);
    for (const side of [0, 1]) this.pieces.bodyAt(side); this.pieces.add('teardrop', { side: 0 }, 3, 3); this.pieces.add('stone', {}, 4, 3); this.pieces.add('bomb', {}, 5, 3);
    this.update(0.016);
    return () => { this.close(true); this.frame.scale.setScalar(1); };
  }
}
