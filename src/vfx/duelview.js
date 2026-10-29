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
// foe's forecast (intent.js) and its foresight (foresight.js), the move's worth (worth.js), the glows on the pieces (glows.js: a Tune's
// hum, Paint's reach, the lesson's asked verb), the bursts (bursts.js), the big plays (juice.js: ONE MORE, ALL CLEAR, WEAK, the trickle, undo), and the beats that play the kernel's events (beats.js, the tools' in toolbeats.js and toolbeats2.js).
// This module is the interface and the wiring: where the board stands, which half is whose colour, the counts and points it shows, the
// spiritual link's far end while the duel is open (the board's Courier, or the god hand over its half), and the foe's stars in the world.
//
// Prior art (the mock's museum labels): Super Puzzle Fighter II Turbo (the two fighters beside their wells, gems as cut stones), Puyo
// Puyo (the chain voice, nuisance thrown in), Panel de Pon (the chain counter on the panels), Meteos (each place's gravity read from
// motion), Into the Breach (the foe's next move on the board), Noon (the shared field and its territories), and the tsuitate (衝立).
//
//   game.duelView = new DuelView(game)   (main.js; prewarmed at boot: DuelView.prewarm() -> park)
// DREAD'S FOG (dread.js, the aberrant Lantern Wisp's): the fogged side's half hidden but within its lantern's light, asked per cell of
// `visibleTo(state, 0, x, y)` against the board as the view shows it (the Line and the body where they are drawn), eased cell by cell.
//
//   open({ state, foe, at, facing })   state: a kernel duel (newDuel); foe: the creature (its feeling: foe.grade, else the ruleset's,
//                                      else Fury); at: a Vector3 on the ground; facing: a Vector3 from the board toward the Courier,
//                                      or a yaw whose forward (sin yaw, 0, cos yaw) points at the Courier. The board's face looks along
//                                      `face` (world): stand the camera on that side to read the Courier's half on the left
//   play(events) -> Promise            the kernel's events, in order (act's, endTurn's, bot.play's), resolved once shown; queued
//   intent(plan | intent | null)       the foe's live forecast: bot.plan's actions (its first step bold), or with `intentWhole` the
//                                      kernel's intentOf { actions, junk, cells, hits } (foresight.js: its clears, hits and junk too)
//   pendingAction(action | null)       the action under the finger before it is chosen: the move's worth (worth.js); armPaint(on)
//   select(cells)                      one cell: picked (lifted, its ring, a tick into each neighbour); more: the drag's rims
//   cellAt(ray) -> { x, y } | null     the cell a ray meets on the slab's face (the god hand's pick): a THREE.Ray, or { origin, dir }
//   frameShot() -> { pos, look }       the camera that reads the board (from the `face` side, a cell at least 12 dots of the 480 lines,
//                                      both halves and both bodies in view): for game.cinema.shot
//   pointOf(cell) -> Vector3           a cell's centre on the slab's face, in the world (the god hand's cursorAt; its normal: `face`)
//   refuse(action)                     an illegal action: the cell's rim shaken in the dry ink, no words (marks.js)
//   resync(state)                      the board and pieces stood again from a restored state (undo), the clash kept: juice.js rewind
//   armSkill(tool | null)              the one-gesture duel's armed skill: its reach under the finger (skillcast.js), the cast on `skill`
//   death({ how, secret, foe }) -> Promise (how 'line' | 'secret' | 'finisher')   an aberrant's own death played (duelview/aberrants/), resolved when done
//   armPower(id | null)   powerReach(action, cells, ok)   the PvE duel's armed power and its reach as the session reads the gesture; casts: powercast.js
//   skip(state)                        the foe's turn skipped: its queued beats dropped, the board stood as the state is
//   hint(h | null)                     the idle hint (bot.js hintOf): its move's piece nudging its way, its clears pulsing; any play lets it go
//   stage (stage.js: the zoom from the arena to the board view, the director's camera; the session asks stage.eatTap(cell) before a
//   tap acts)   dive (formdive.js: the Pneuka Jar at your spot in the hand's form, the pour into the board and out of it)
//   hover(cell | null)   select(cells)   close()   update(rawDt) (main.js)   .isOpen .busy .face .root .state
// THE FLEE (Dovina's, PUZZLE-DUELS.md 15; drawn by duelview/flee.js): the odds plate on the frame while you may flee, the 'flee' event's
// d20 and its reasons, and 'duel.fled': the clash folding with no winner and the tsuitate folded away.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../progress/weather.js';
import { sfx } from '../audio/sfx.js';
import { newDuel } from '../progress/duel/duel.js';
import { RULESETS, KIND_RULESETS, rulesetOf } from '../progress/duel/rulesets.js';
import { visibleTo } from '../progress/duel/dread.js';
import { filmColour } from './oxidation.js';
import { DUEL_VIEW, cellLocal, feelColour } from './duelview/layout.js';
import { DomainClash } from './duelview/domains.js';
import { DuelBoard } from './duelview/board.js';
import { DuelPieces } from './duelview/pieces.js';
import { DuelMarks } from './duelview/marks.js';
import { DuelIntent } from './duelview/intent.js';
import { DuelBursts } from './duelview/bursts.js';
import { DuelBeats } from './duelview/beats.js';
import { DuelFlee } from './duelview/flee.js';
import { DuelGlows } from './duelview/glows.js';
import { DuelWorth } from './duelview/worth.js';
import { DuelForesight } from './duelview/foresight.js';
import { DuelJuice } from './duelview/juice.js';
import { DuelStage } from './duelview/stage.js';
import { FormDive } from './duelview/formdive.js';
import { reachOf } from './duelview/skillcast.js';
import { FoeCast } from './duelview/foecast.js';
import { FoeCutIn } from './duelview/cutin.js';
import { WispElite } from './duelview/aberrants/wisp.js';
import { JellyElite } from './duelview/aberrants/jelly.js';
import { FrameDress } from './duelview/framedress.js';
import { DuelSpoils } from './duelview/spoils.js';
import { DuelStamps } from './duelview/stamps.js';
import { DuelShow } from './duelview/duelshow.js';
import { GardenGround } from './duelview/gardenground.js';
import { SkillGauges } from './duelview/skillgauges.js';

const TEAR = 0x7fdcff, COURIER_HEX = '#9fd8ff', UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color(), _r = new THREE.Ray(), _inv = new THREE.Matrix4();

export class DuelView {
  constructor(game) {
    this.game = game; this.isOpen = false; this.closing = false; this.state = null; this.foe = null; this.aspect = 'fury';
    const root = (this.root = new THREE.Group()); root.name = 'duelView'; root.visible = false; root.userData.zoneFree = true; // (it stands in the room it is opened in, and only while open)
    this.frame = new THREE.Group(); root.add(this.frame);
    this.clash = new DomainClash(); root.add(this.clash.dome, this.clash.ground);
    this.board = new DuelBoard(this.frame, this.clash); this.pieces = new DuelPieces(this.frame); this.marks = new DuelMarks(this.frame);
    this.intentDraw = new DuelIntent(this.frame, this.marks); this.bursts = new DuelBursts(this.frame); this.beats = new DuelBeats(this);
    this.flee = new DuelFlee(this); this.folded = false;
    this.glows = new DuelGlows(this); this.worth = new DuelWorth(this); this.foresight = new DuelForesight(this); this.juice = new DuelJuice(this); this.stage = new DuelStage(this); this.dive = new FormDive(this); this.gauges = new SkillGauges(this); this.foeCast = new FoeCast(this); this.cutIn = new FoeCutIn(this); this.jarCut = new FoeCutIn(this, { subject: 'jar' }); this.stamps = new DuelStamps(this); this.show = new DuelShow(this); this.elites = [new WispElite(this), new JellyElite(this)]; this.elite = this.elites[0]; this.garden = new GardenGround(this); this.dress = new FrameDress(this); this.spoils = new DuelSpoils(this); this.tune = [null, null]; this.pendingKind = null;
    this.intentWhole = true; // (the session hands intent() bot.js intentOf's whole: { actions, junk, cells, hits })
    this.u = new THREE.Vector3(1, 0, 0); this.face = new THREE.Vector3(0, 0, 1); this.centre = new THREE.Vector3();
    this.sent = [0, 0]; this.pending = [0, 0]; this.depth = [0, 0]; this.apShown = [5, 5]; this.restCuts = 0; this.forms = ['hand', 'hand']; this.lineCol = 10;
    this.linkEnd = (out) => this.linkAt(out);
    game.scene?.add(root);
  }

  get busy() { return this.beats.busy; }
  get board3() { const b = this.state?.board; return { w: b?.w ?? 20, h: b?.h ?? 20, line: this.lineCol }; }

  /** Stand the board and unfold the domains. */
  open({ state, foe = null, at, facing = null } = {}) {
    if (!state) return;
    this.close(true);
    this.state = state; this.foe = foe; this.isOpen = true; this.closing = false; this.finisherDone = false;
    const asp = (KIND_RULESETS[foe?.kind] && rulesetOf(foe).feeling) || foe?.grade || foe?.feeling || state.rs?.feeling; // (a kind's own ruleset first: the aberrant Lantern Wisp's is Dread's)
    this.aspect = asp && COLOR[asp] !== undefined ? asp : 'fury';
    // where it stands: +X of its frame from the Courier's end to the foe's, its face along u x up
    const toward = typeof facing === 'number' ? _v.set(Math.sin(facing), 0, Math.cos(facing)) : facing?.isVector3 ? _v.copy(facing).setY(0) : foe?.pos ? _v.copy(at).sub(foe.pos).setY(0) : _v.set(-1, 0, 0);
    if (toward.lengthSq() < 1e-6) toward.set(-1, 0, 0);
    this.u.copy(toward).normalize().negate(); this.face.crossVectors(this.u, UP).normalize();
    this.root.position.copy(at); this.root.rotation.set(0, Math.atan2(-this.u.z, this.u.x), 0); this.root.visible = true;
    this.frame.rotation.set(0, 0, 0); this.frame.position.set(0, 0, 0); this.frame.scale.setScalar(1); this.folded = false; // (a fled duel's fold undone)
    this.root.updateMatrixWorld(true); this.centre.copy(at);
    const B = state.board;
    this.board.build(B, this.aspect); this.pieces.build(B, this.aspect); this.marks.layout(B); this.clash.setFoe(this.aspect); this.flee.clear(); this.flee.layout(B);
    this.forms = state.sides.map((S) => S.form); this.tune = state.sides.map((S) => S.tune || null); this.glows.clear(); this.worth.clear(); this.foresight.clear(); this.pendingKind = null;
    this.gravLine = B.line; this.setLine(B.line); this.fogCur = null; this.stepFog(0); // (the fog as it stands at once: nothing hidden shows for a frame)
    this.board.won(0); this.readCounts(); this.readPoints(); this.readFight();
    const half = (B.w * DUEL_VIEW.cs) / 2 + 2, oc = _w.copy(at).addScaledVector(this.u, -half), of = foe?.pos ? foe.pos.clone() : at.clone().addScaledVector(this.u, half);
    this.clash.groundTo(Math.max(oc.distanceTo(at), of.distanceTo(at)) + 3); // (the ground past both bodies: domains.js)
    oc.y += 1; of.y += 1; this.clash.unfold(oc, of);
    this.game.spiritualLink?.attach(this, this.linkEnd);
    this.gauges.layout(this.board3); this.stage.open(); this.dive.open(); this.cutIn.warm(); this.jarCut.warm(); this.stamps.warm(); this.show.open(state, foe); this.elite = this.elites.find((E) => E.constructor.fits(state, foe)) || this.elites[0]; this.elite.open(state, foe); this.garden.open(at.clone().addScaledVector(this.u, -((B.w * DUEL_VIEW.cs) / 2 + 2)), this.u); this.dress.open(state, foe); this.spoils.open(state, foe); // (your half as your Spirit Garden: gardenground.js; the aberrant's own layers: its ground, its lantern, its deaths: duelview/aberrants/) // (the gauges: skillgauges.js; the arena first, the Jar at your spot: stage.js, formdive.js)
  }

  /** Fold the domains away and take the board down (at once, with `now`). */
  close(now = false) {
    if (!this.isOpen && !this.closing) return;
    this.isOpen = false; this.beats.clear(); this.intentDraw.clear(); this.foresight.clear(); this.worth.clear(); this.glows.clear(); this.tune = [null, null]; this.marks.hover(null); this.marks.select([]); this.marks.stars(0, 0); this.marks.stars(1, 0);
    this.game.spiritualLink?.detach(this); this.clash.collapse(); this.closing = !now;
    this.flee.clear(); this.marks.refuse(null); this.juice.clear(); this.stage.close(); this.dive.close(); this.gauges.clear(); this.foeCast.clear(); this.cutIn.clear(); this.jarCut.clear(); this.stamps.clear(); this.elite.close(); this.show.close(); this.garden.close(); this.dress.close(); if (this.deathJob) { this.deathJob.res(); this.deathJob = null; } this.armed = null; this.armedPower = null;
    this.clash.dome.scale.setScalar(DUEL_VIEW.radius); this.clash.U.uRadius.value = DUEL_VIEW.radius;
    if (now) { this.clash.open = [0, 0]; this.clash.update(0); this.root.visible = false; this.bursts.clear(); }
  }

  play(events) { this.hint(null); return this.isOpen ? this.beats.play(events) : Promise.resolve(); }

  /** The idle hint (bot.js hintOf { action, junk, cells }, lit by the session after HINT.idle with no touch): the move's piece leaning
   *  its way and every cell it would clear pulsing softly, never words (Candy Crush's, Bejeweled's); null lets it go. */
  hint(h) {
    for (const v of this.pieces.list) { v.hint = 0; v.hintDir = null; }
    if (!this.isOpen || !h?.action) return;
    sfx.duelEvent?.({ type: 'hint' }); // (Wanda's breath of the key's fifth, at most once in 10 real s)
    const P = this.pieces, a = h.action, DV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }, at = (c) => (c ? P.at(c[0], c[1]) : null);
    for (const c of h.cells || []) { const v = at(c); if (v) v.hint = 1; }
    if (a.kind === 'swap' && a.at) { const d = DV[a.dir] || [1, 0], v = at(a.at), w = at([a.at[0] + d[0], a.at[1] + d[1]]); if (v) { v.hint = 1; v.hintDir = d; } if (w) { w.hint = 1; w.hintDir = [-d[0], -d[1]]; } }
    else if (a.path?.length > 1) { const [p0, p1] = a.path, v = at(p0); if (v) { v.hint = 1; v.hintDir = [Math.sign(p1[0] - p0[0]), Math.sign(p1[1] - p0[1])]; } for (const c of a.path.slice(1)) { const w = at(c); if (w) w.hint = Math.max(w.hint, 0.6); } }
    else if (a.at) { const v = at(a.at); if (v) v.hint = 1; }
  }

  intent(plan) {
    if (!plan || !this.isOpen) { this.intentDraw.clear(); this.foresight.clear(); return; }
    if (!Array.isArray(plan) && plan.actions) { this.intentDraw.show(this.state, this.game.hudLayout?.touch ? plan.actions.slice(0, 1) : plan.actions, 1, this.aspect, { whole: true }); // (a phone shows its next step only: five numbered steps buried the foe's half, South's phone 2026-10-27)
       this.foresight.show(this.state, plan, this.aspect); return; } // (the whole: foresight.js)
    this.foresight.clear(); this.intentDraw.show(this.state, plan, 1, this.aspect); // (the foe's side: the Figment's is side 1)
  }
  /** The action under the finger before it is chosen (the session's): its worth shown (worth.js); a Paint arms the reach (glows.js). */
  pendingAction(a) { if (!this.isOpen) return; this.pendingKind = a?.kind || null; this.worth.show(this.state, a || null); }
  armPaint(on) { this.glows.armPaint(on); }

  /** The cell a ray (world) meets on the slab's face, or null. */
  cellAt(ray) {
    if (!this.isOpen || !ray?.origin) return null;
    _r.origin.copy(ray.origin); _r.direction.copy(ray.direction || ray.dir); _r.applyMatrix4(_inv.copy(this.frame.matrixWorld).invert());
    const dz = _r.direction.z; if (Math.abs(dz) < 1e-6) return null;
    const t = -_r.origin.z / dz; if (t < 0) return null;
    _r.at(t, _v);
    const { cs, base } = DUEL_VIEW, B = this.state.board, x = Math.floor(_v.x / cs + B.w / 2), y = Math.floor(B.h - (_v.y - base) / cs);
    return x >= 0 && y >= 0 && x < B.w && y < B.h ? { x, y } : null;
  }
  hover(cell) { this.marks.hover(this.isOpen ? cell : null); if (this.armed) this.showReach(cell); }
  /** A skill armed (the session's armSkill, the one-gesture duel): its reach under the finger as it moves (skillcast.js reachOf); null
   *  lets it go. */
  armSkill(tool) { this.armed = this.isOpen ? tool || null : null; this.armedPower = null; this.showReach(this.armed ? this.marks.hovered : null); }
  /** A power armed (the PvE duel's: progress/duel/powers.js), with what its action carries beyond the cell (`dir`, `by`, `colour`, `to`):
   *  the cells it would touch under the finger (powerReach); null lets it go. */
  armPower(id) { this.armedPower = this.isOpen && id ? id : null; this.armed = null; this.powerReach(null, [], false); }
  /** The armed power's reach as the session reads the gesture (once a change under the finger): its cells lit on the preview's keyline,
   *  the pieces lifted only when the kernel would take it (`ok`). */
  powerReach(action, cells = [], ok = false) {
    for (const v of this.pieces.list) v.prev = 0;
    if (ok) for (const [x, y] of cells) { const v = this.pieces.at(x, y); if (v) v.prev = 1; }
    this.marks.select(cells.map(([x, y]) => ({ x, y })));
  }
  showReach(cell) {
    for (const v of this.pieces.list) v.prev = 0;
    const cells = this.armed && cell ? reachOf(this.state, this.armed, cell) : [];
    for (const [x, y] of cells) { const v = this.pieces.at(x, y); if (v) v.prev = 1; }
    this.marks.select(cells.map(([x, y]) => ({ x, y })));
  }

  /** The camera that reads the board: square to its face on the `face` side (the Courier's half on the left), a little above its middle
   *  and looking a hair down, as near as a cell of about 14 dots of the 480 lines (never under 12), far enough for the frame, the odds
   *  plate and both bodies in the world. On touch, the duel's phone screen's (touchShot). */
  frameShot() {
    if (!this.isOpen) return null;
    const cam = this.game.camera, B = this.state.board, { cs, base, border } = DUEL_VIEW, top = base + B.h * cs + border + 0.45;
    const tan = Math.tan(((cam?.fov ?? 70) * Math.PI) / 360), asp = cam?.aspect || 16 / 9, lines = 480;
    const fit = this.game.hudLayout?.touch ? this.touchShot(B, tan) : null; if (fit) return fit; // (a phone: the board as large as the room the controls leave)
    const far = (cs * lines) / (2 * 12 * tan), want = (cs * lines) / (2 * 14 * tan); // (a cell 12 dots at most this far; 14 here)
    const reach = this.foe?.pos ? _w.copy(this.foe.pos).sub(this.centre).setY(0).length() : 0, halfW = Math.max((B.w * cs) / 2 + border + 0.2, reach + 0.5);
    const near = Math.max((top / 2 + 0.15) / tan, halfW / (tan * asp));
    const d = Math.min(far, Math.max(want, near)), look = this.centre.clone().setY(this.centre.y + top / 2);
    return { pos: look.clone().addScaledVector(this.face, d).setY(look.y + 0.35), look };
  }
  /** On touch (South, 2026-10-27: "the board needs to be the largest thing on screen ... with enough padding to feature the courier and
   *  Aberrant"): the duel's phone screen (ui/hudlayout.js duelLayout): the whole tsuitate, its feet on the ground to its ash run, filling
   *  the board's rect (the safe height, centred on the screen), square to its face; the two bodies stand in the flanks either side and
   *  the controls over their lower halves. */
  touchShot(B, tan) {
    const L = this.game.hudLayout, V = L.view, R = L.duelLayout?.(B)?.board; if (!V?.w || !V?.h || !R?.h) return null;
    const { cs, base, border } = DUEL_VIEW, Hm = R.m?.h ?? B.h * cs + border, k = R.h / Hm, d = V.h / (2 * k * tan); // (k: CSS px a metre at d; the slab and its border fill the height, the clay feet run off below: a phone has no room for legs, South, 2026-10-27)
    const right = _w.crossVectors(this.face, UP).negate().normalize(), dx = (R.x + R.w / 2 - V.w / 2) / k, dy = (R.y + R.h / 2 - V.h / 2) / k;
    const look = this.centre.clone().setY(this.centre.y + base + (B.h * cs) / 2).addScaledVector(right, -dx).addScaledVector(UP, dy);
    return { pos: look.clone().addScaledVector(this.face, d), look };
  }
  /** A cell's centre on the slab's face, in the world (the session's cursorAt asks here; on touch it shows no hand). */
  pointOf(cell) {
    if (!this.isOpen || !cell) return null;
    const x = cell.x ?? cell[0], y = cell.y ?? cell[1]; return this.frame.localToWorld(cellLocal(x, y, this.board3, new THREE.Vector3()).setZ(0));
  }
  /** An illegal action's look: its cell's rim (the action's cell, the Courier's figurine's for its moves, else the hovered one) shaken
   *  in the dry ink, and the spiritual link slack. No words. */
  refuse(a = {}) {
    if (!this.isOpen) return;
    const body = this.pieces.bodyAt(0), c = a.at || a.path?.[0] || (body && !a.at && ['push', 'kick', 'run', 'shoot', 'grab', 'drill', 'paint', 'tune', 'read', 'delay', 'hold', 'send', 'flee'].includes(a.kind) ? [body.cx, body.cy] : null) || this.marks.hovered;
    if (c) this.marks.refuse({ x: c.x ?? c[0], y: c.y ?? c[1] });
    this.game.spiritualLink?.slack?.();
  }
  select(cells) {
    cells = this.isOpen ? cells || [] : []; this.marks.select(cells);
    for (const v of this.pieces.list) v.pick = 0; // (one cell picked: its piece lifted, marks.js the ring)
    if (cells.length === 1) { const c = cells[0], v = this.pieces.at(c.x ?? c[0], c.y ?? c[1]); if (v && v.kind !== 'body') v.pick = 1; }
  }

  // ---- what the beats ask of the view
  setLine(col) {
    this.lineCol = col; this.board.setLine(col); this.marks.setLine(col);
    const rs = this.state?.rs, L = Math.round(col);
    if (rs?.gravity && L !== this.gravLine && this.state) { // (a map that follows the sides, as the kernel's moveLine sets it)
      this.gravLine = L; const b = this.state.board, px = { w: b.w, h: b.h, line: L, sideOf: (x) => (x < L ? 0 : 1) }; px.grav = (x, y) => rs.gravity(x, y, px) || [0, 0];
      this.board.setGravity(px);
    }
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
  drink(e) { if (e.side !== 0) return; this.game.spiritualLink?.bead({ amount: 8, colour: TEAR, rev: true, dur: 0.45 }); if (e.from === 'regen') this.spoils.regen(e); } // (your turn's regen said at the bulb: spoils.js)
  form(side, to) { this.forms[side] = to; }
  headOf(side, out) { const v = this.pieces.bodyAt(side); return v ? cellLocal(v.x, v.y - 0.55, this.board3, out).setZ(DUEL_VIEW.front + 0.05) : out.set(0, -99, 0); }
  /** Where the god hand stands over a side's half (the board's frame): the finisher's cubes go up into it. */
  handPoint(side, out) { const B = this.board3, cs = DUEL_VIEW.cs, x = side === 1 ? (this.lineCol + B.w) / 2 : this.lineCol / 2; return out.set((x - B.w / 2) * cs, DUEL_VIEW.base + B.h * cs + 0.5, 0.35); }
  /** An aberrant's death as its own cinematic ('line' when the Line reached its wall, 'secret' when its secret was done): its look played
   *  (duelview/aberrants/), resolved once it has; the session times it before the board folds. An aberrant with no death of its own: at once. */
  death(arg) {
    const how = typeof arg === 'string' ? arg : arg?.how, kind = how === 'secret' || arg?.secret ? 'secret' : how === 'line' ? 'line' : null; // (the session's { how, secret, foe }; a finisher has its own: the data drain)
    const d = this.isOpen && this.elite.on && kind ? this.elite.death(kind) : null; if (!d) return Promise.resolve();
    this.stage.pref = 0; // (the arena: the foe in frame for its end, even from the phone's board view, Petra 2026-10-28)
    const job = { ...d, age: 0 };
    if (this.show.on) { // (circled low round it as it goes, then the hero shot on the Jar: duelshow.js)
      this.stage.cutAway('death', d.dur); const base = d.dur; let ended = false;
      job.step = (age) => { if (age < base) { d.step?.(age); return; } if (!ended) { ended = true; d.end?.(); job.dur = base + this.show.victory(); } };
      job.end = () => { if (!ended) { ended = true; d.end?.(); } };
    }
    return new Promise((res) => { if (this.deathJob) this.deathJob.res(); job.res = res; this.deathJob = job; });
  }
  /** The PvE duel's drag timer (the session's: 1 full .. 0 out, null hidden), a bar under your half (foecast.js). */
  dragClock(k) { this.foeCast.timer(k); }

  /** What of mine draws during a duel but stood in the scene before it opened (South, 2026-10-27: the duel is its own instance,
   *  render/duelinstance.js): the data drain and its crackle break at the finisher, the foe's stun stars. For the session's keep list. */
  instanceKeep() {
    const g = this.game, out = [g.dataDrain?.group, g.dataDrain?.crackle?.bubble?.object, g.dataDrain?.crackle?.shards];
    const ring = this.foe && g.stun?.dizzy?.rings?.get?.(this.foe); if (ring) out.push(ring.g);
    return out.filter(Boolean);
  }

  /** The finisher's drain on the foe in the world (the crackle break, the beats, its data bug mended: vfx/datadrain.js). */
  drainFoe() { const f = this.foe; if (f?.pos && this.game.dataDrain) { this.frame.localToWorld(this.handPoint(1, _w)); this.game.dataDrain.play(f, _w.clone()); } this.depth[1] = 0; }

  readCounts() { const S = this.state.sides; this.sent = [S[0].sent || 0, S[1].sent || 0]; this.pending = [S[0].pending || 0, S[1].pending || 0]; this.showCounts(); }
  readPoints() { const s = this.state; this.board.meter = s.style === 'pve'; if (this.board.meter) return this.readPush(); for (const side of [0, 1]) { const S = s.sides[side], left = side === s.toMove ? s.apLeft : S.ap, lost = side === s.toMove ? this.board.ap[side][2] : 0; this.apShown[side] = left; this.board.setAP(side, left, S.ap, Math.min(lost, S.ap - left)); } }
  /** The PvE duel's foot (South, 2026-10-28: no action points): the same beads as two meters of one column each (`perColumn`), the
   *  Courier's end your clears banked toward the Line's next step into the aberrant (`push`), the foe's end the junk landed on you toward
   *  its step back (`landed`); a bead lit since the last read lights with a puff of its colour (`fx`). */
  readPush(fx) {
    const s = this.state; if (!s) return; const n = s.perColumn || 3, S = s.sides[0], v = [Math.min(n, S.push || 0), Math.min(n, S.landed || 0)];
    for (const side of [0, 1]) { const was = this.board.ap[side][0];
      if (fx) for (let k = was; k < v[side]; k++) { this.board.apAt(side, k, _w); this.bursts.burst(_w, side ? feelColour(this.board.foe, _c).getHex() : 0x7fdcff, 4, { speed: 0.5, life: 0.4, fall: -1, size: 0.016 }); }
      this.apShown[side] = v[side]; this.board.setAP(side, v[side], n, 0); }
  }
  readFight() { const s = this.state; for (const side of [0, 1]) { const S = s.sides[side]; this.board.setEmo(side, S.emo); this.depth[side] = S.depth || 0; this.marks.stars(side, this.depth[side], this.headOf(side, _w)); } }

  /** The duel stood again from a state the kernel restored (the session's undo, before its `undo` event plays): the board and pieces
   *  rebuilt, the clash left standing; each piece kept where it was drawn until the undo beat slides it home (juice.js rewind). */
  resync(state) {
    if (!this.isOpen || !state) return; this.state = state;
    this.intentDraw.clear(); this.foresight.clear(); this.worth.clear(); this.marks.select([]); this.juice.rewind(state);
  }

  /** The foe's turn skipped by a tap (the session's, Dovina's 21.1): the queued beats dropped and the board stood as the state is, at
   *  once, with a short shake so the jump reads as the turn landing. */
  skip(state) {
    if (!this.isOpen || !state) return;
    this.beats.clear(); this.juice.clear(); this.worth.clear(); this.state = state; this.settleUp(); this.stage.jolt(0.2);
  }

  /** The play queue ran dry: the view is made to agree with the duel as it stands (anything the beats did not follow is put right). */
  settleUp() {
    const s = this.state; if (!s || !this.isOpen) return;
    const was = new Map(this.pieces.list.filter((v) => v.kind === 'ember').map((v) => [v.id, v.count]));
    this.pieces.build(s.board, this.aspect); this.gravLine = s.board.line; this.board.setGravity(s.board);
    for (const v of this.pieces.list) if (v.kind === 'ember' && was.has(v.id) && v.count < was.get(v.id)) { // (an ember burnt down a turn: a puff, its glaze a step dimmer)
      v.cool = 1; cellLocal(v.x, v.y, this.board3, _w); this.bursts.burst(_w, 0x2e1810, 4, { speed: 0.4, life: 0.4, fall: -1, size: 0.018 }); }
    if (this.finisherDone) { for (const v of [...this.pieces.list]) if (v.cx >= this.lineCol) this.pieces.remove(v); }
    else this.setLine(s.board.line);
    this.forms = s.sides.map((S) => S.form); this.tune = s.sides.map((S) => S.tune || null); this.readCounts(); this.readPoints(); this.readFight();
    if (s.winner === 0) this.board.won(1);
    this.flee.odds(s);
  }

  /** The Lachrimeter's bulb on the screen as a point in the board's frame, at the board's depth (the trickle's motes fly into it, juice.js),
   *  or null while the tube is not shown. */
  tubeAt(out) {
    const cam = this.game.camera, b = this.game.lachrimeterTube?.bulbAt?.(this._bulb ||= {}); if (!this.isOpen || !cam || !b) return null;
    _v.set(0, DUEL_VIEW.base, DUEL_VIEW.lip); this.frame.localToWorld(_v).project(cam);
    _v.set(b.x / innerWidth * 2 - 1, 1 + 2 * b.y / innerHeight, _v.z).unproject(cam); // (the overlay's px, y up from the top: linkAt's inverse)
    return this.frame.worldToLocal(out.copy(_v));
  }

  /** The far end of the spiritual link while open: the board's Courier in its form, or the god hand over its half (overlay px, y up). */
  linkAt(out) {
    const cam = this.game.camera; if (!this.isOpen || !cam) return null;
    const B = this.state.board, { cs, base, border, lip } = DUEL_VIEW; // (the frame's lower corner on the bulb's side: the thread lands on the clay, never across a cell; the owner, 2026-10-27)
    const sx = this.game.hudLayout?.duelR ? -1 : 1; // (the duel's phone screen: the tube stands in the left flank, so the thread lands on the left foot)
    _v.set(sx * ((B.w * cs) / 2 + border * 0.5), base - border * 0.5, lip);
    this.frame.localToWorld(_v).project(cam); if (_v.z > 1 || _v.z < -1) return null;
    return out.set((_v.x + 1) / 2 * innerWidth, -((1 - _v.y) / 2) * innerHeight, 0);
  }

  update(dt) {
    if (!this.isOpen && !this.closing) return;
    dt = Math.min(dt || 0, 0.1);
    this.beats.update(dt); this.stepFog(dt); this.glows.update(dt); this.worth.update(dt); this.foresight.update(dt);
    const held = this.juice.scale(dt), shown = this.clash.update(held); // (a big play's held beat: the board's motion all but stops, the beats run on: juice.js)
    this.board.update(held); this.pieces.update(held); this.marks.update(held); this.bursts.update(held); this.flee.update(dt); this.juice.update(dt);
    if (this.isOpen && !this.beats.busy) this.flee.odds(this.state);
    const st = this.isOpen && !this.closing ? this.stage.update(dt) : this.lastStage || { scale: 1, lift: 0, tilt: 0 }; this.lastStage = st; this.dive.update(dt); if (this.isOpen) this.gauges.update(dt, this.state); this.foeCast.update(dt); this.elite.update(dt); this.garden.update(dt); this.dress.update(dt); if (this.isOpen) this.show.update(dt); // (the zoom and the director: stage.js; who stands where: formdive.js)
    const J = this.deathJob; if (J) { J.age += dt; J.step?.(J.age); if (J.age >= J.dur) { J.end?.(); this.deathJob = null; J.res(); } }
    for (const side of [0, 1]) if (this.depth[side]) this.marks.stars(side, this.depth[side], this.headOf(side, _w));
    const f = this.foe; if (this.isOpen && this.depth[1] > 0 && f?.alive !== false && f?.pos) this.game.stun?.dizzy?.set(f, f.head?.() || _w.copy(f.pos).setY(f.pos.y + 2), { stunned: true }); // (the same gold stars on the Figment in the world)
    if (this.closing && !shown) { this.closing = false; this.root.visible = false; this.bursts.clear(); }
    else if (this.folded) this.frame.scale.setScalar(0.001); // (a fled duel: the tsuitate folded away, flee.js)
    else if (this.closing) { const k = Math.max(this.clash.open[0], this.clash.open[1]); this.frame.scale.setScalar(Math.max(0.001, k * st.scale)); }
    else if (!this.flee.folding) { // (the stage's tsuitate: drawn in, lifted and leaning back in the arena; full and square in the board view)
      const bob = st.lift ? Math.sin(this.stage.t * 1.4) * 0.025 * (st.lift / 0.32) : 0;
      this.frame.scale.setScalar(st.scale); this.frame.position.set(0, st.lift + bob, 0); this.frame.rotation.set(-st.tilt, 0, 0);
      if (st.dome) { this.clash.dome.scale.setScalar(st.dome); this.clash.U.uRadius.value = st.dome; }
    }
  }

  /** Dread's fog, cell by cell (0 seen .. 1 hidden), and the lantern's light, eased toward what visibleTo says now. */
  stepFog(dt) {
    const s = this.state, F = s?.rs?.fog, B = s?.board; if (!B) return;
    const n = B.w * B.h; if (this.fogCur?.length !== n) { this.fogCur = new Float32Array(n); this.lampCur = new Float32Array(n); this.fogDirty = true; }
    if (!F) { if (this.fogDirty) { this.fogCur.fill(0); this.lampCur.fill(0); this.board.setFog(this.fogCur, this.lampCur); this.fogDirty = false; } this.pieces.fogAt = null; return; }
    const body = this.pieces.bodyAt(F.side), at = body ? [Math.round(body.x), Math.round(body.y)] : s.sides[F.side].at, L = this.lineCol;
    const px = { rs: s.rs, board: { sideOf: (x) => (x < L ? 0 : 1) }, sides: s.sides.map((S, i) => (i === F.side ? { at } : S)) }, light = F.light ?? 3;
    let moved = false; const k = Math.min(1, dt * 6);
    for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
      const i = y * B.w + x, want = visibleTo(px, 0, x, y) ? 0 : 1, d = at ? Math.abs(x - at[0]) + Math.abs(y - at[1]) : 99;
      const lamp = x >= L && d <= light + 1 ? Math.max(0, 1 - d / (light + 1.5)) : 0;
      const f = this.fogCur[i] + (want - this.fogCur[i]) * (dt ? k : 1), l = this.lampCur[i] + (lamp - this.lampCur[i]) * (dt ? k : 1);
      if (Math.abs(f - this.fogCur[i]) > 1e-3 || Math.abs(l - this.lampCur[i]) > 1e-3) moved = true; this.fogCur[i] = f; this.lampCur[i] = l;
    }
    if (moved || this.fogDirty) { this.board.setFog(this.fogCur, this.lampCur); this.fogDirty = false; }
    this.pieces.fogAt = (x, y) => (x >= 0 && y >= 0 && x < B.w && y < B.h ? this.fogCur[y * B.w + x] : 0);
  }

  /** For the boot's warm-up (main.js): a duel stood 50 m under the world with every part shown, so its programs compile with the rest. */
  prewarm() {
    const state = newDuel({ ruleset: RULESETS.fury, seed: 1 });
    this.open({ state, at: new THREE.Vector3(0, -50, 0), facing: new THREE.Vector3(-1, 0, 0) });
    this.clash.open = [1, 1]; this.clash.update(0);
    this.marks.numeral('3', new THREE.Vector3(0, 1, 0.1), '#ffffff'); this.marks.hover({ x: 2, y: 18 }); this.marks.stars(1, 2, new THREE.Vector3(0, 1, 0));
    this.bursts.burst(new THREE.Vector3(0, 1, 0), 0xffffff, 4);
    this.intentDraw.show(state, [{ kind: 'swap', at: [12, 18], dir: 'E' }, { kind: 'rotate', at: [12, 16] }], 1, this.aspect);
    this.foresight.show(state, { actions: [], junk: 3, cells: [[12, 18], [13, 18]], hits: [[12, 18]] }, this.aspect); this.marks.pick({ x: 3, y: 3 }); this.glows.buildReach(4, 10, 4, 10);
    for (const side of [0, 1]) this.pieces.bodyAt(side); this.pieces.add('orb', { side: 0 }, 3, 3); this.pieces.add('stone', {}, 4, 3); this.pieces.add('bomb', {}, 5, 3);
    const coal = this.pieces.add('ember', { count: 2 }, 6, 3); coal.craze = 0.8; this.marks.refuse({ x: 7, y: 3 }); // (the crazing's quads, the dry rim)
    this.juice.prewarm(); this.foeCast.fling(_w.set(0, 1, 0.1), new THREE.Vector3(1, 1, 0.1), 0x4a3326); this.update(0.016); this.flee.prewarm(); this.flee.odds(state);
    this.dive.from.set(0, -50, 0); this.dive.to.set(1, -49, 0); this.dive.mid.set(0.5, -48, 0); this.dive.draw(0.6, 0); // (the stream's program)
    return () => { this.close(true); this.frame.scale.setScalar(1); this.frame.position.set(0, 0, 0); this.frame.rotation.set(0, 0, 0); this.dive.beads.visible = false; };
  }
}
