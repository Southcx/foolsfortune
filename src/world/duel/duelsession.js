// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL IN THE WORLD (docs/plans/PUZZLE-DUELS.md section 8, Petra's half): the session that plays the kernel (progress/duel/,
// Dovina's) against an aberrant Figment where it was met. Its pull filled (world/duel/duelfoes.js), the pocket closed (nothing outside
// enters: `pocket`, PUZZLE-DUELS.md 16.1), the aberrant wipe (the seam's kind
// 'aberrant', vfx/aberrantwipe.js), and the duel is drawn as its own instance (render/duelinstance.js, South 2026-10-27: only the
// board, the Pneuka Jar and the foe, the world not drawn): the board square to the camera, you beyond its left end and the foe beyond
// its right, each clear of the slab and a step behind its face, the foe put back where it stood at the end; your turns are your input, its turns its bot's (a beat apart, so you can follow them); every action's events are played
// by the view (game.duelView, Calissa's: the board, the pieces, the domains' clash) before the next is taken. The duel ends on the Line,
// a full side, the finisher or the turn cap; losing is a shatter (the owner, 2026-10-19), winning drains the Figment and mends it, and a flee
// that gets away (flee.js, section 15) leaves you both whole.
// A PRACTICE foe (`c.practice`: Strawman made aberrant at the sparring circle's lectern, South 2026-10-27) opens the same duel, counting
// nothing: every duel.* event carries `practice: true` (tracking skips it), no pool is gained or spent, a loss shatters no one and a win
// drains nothing; a fixture (`c.rooted`, or any practice foe) has its body moved into the layout with it and put back.
// After any duel its foe pulls again only once you have stepped past the pull's far edge (duelfoes.js `rearm`).
//
// The PvE duel (DUEL.style 'pve', PUZZLE-DUELS.md 23, 24): one drag a turn on a 5 real s clock; before it, one of the god hand's seven
// powers (powers.js) armed by keys 1 to 7 or a power tile (`armPower`) and aimed by one gesture (powerInput); a tap on the aberrant's
// countdown badge goes to the view (`foeCast.tap`), whose tooltip asks game.foeSeen. Its moments: duel.power { power, domain, cost, cleared }, duel.foe, duel.desperate, duel.stagger, duel.secret { id, k, half?, done? } (an aberrant's secret win, ABERRANTS.md); its ends 'line' and 'secret' wait on the view's `death` before the board folds.
// The one-gesture duel (DUEL.style 'drag', the default since 2026-10-27, PUZZLE-DUELS.md 22; South: "anything and everything that would
// improve this module"): the hand's DRAG is the only board verb (a press onto a neighbour is a drag of one step), there are no forms and
// the Courier stands off the board; the worn pair are two skills (1 and 2, or a tool's own key below), charged by your clears and fired
// as a free action, at the cell clicked when it asks one (RMB lets an armed skill go); a tap skips the foe's beats; idle a while, the
// hint lights the best drag (view.hint). Its moments go on the bus: duel.chain, duel.skill, duel.charge, duel.land, duel.allclear.
// The classic controls below hold for a ruleset that asks `style: 'classic'`.
// The controls (the forms: PUZZLE-DUELS.md 4 and 11; the god hand is the cursor, the owner on board v11):
//   the god hand      LMB on a piece and onto a neighbour: SWAP; held across three or more cells: DRAG; R: ROTATE the 2x2 under the
//                     hand (its top-left); RMB on an empty cell: DROP the next queued piece; F: the FINISHER on a broken foe
//   the Courier       LMB on a cell up to four away: RUN there; W A S D: PUSH that way, with Shift: KICK (or a drag from the Courier
//                     its way, from RMB held there a KICK: a finger's swipe on touch, MOBILE.md 8.5); each worn tool on its own
//                     key: X Shoot (the psygun), Q Grab (the Sondelass), K Drill the way last faced (the Dreamvane), G Paint in the Soul
//                     Brush's feeling (its pick; the colour under the pointer repainted, else the nearest), U Delay and T Tune (the
//                     Crucibelle: the colour under the pointer), I Hold, Shift+I Send (the Lockheart), V Read (the Veritome); X shoots
//                     down the row or column the pointer is on, else toward the foe (PUZZLE-DUELS 18.1)
//   both              ~ switches form (1 point), E flees (a d20 against 15, 3 points a failed try), Space ends the turn, Backspace
//                     held 1.5 real s yields (a loss: the shatter)
// While it runs the Courier is held as the crossing holds them (main.js `aboard`), and every key it reads is spent so no tool sees it.
//
// Prior art: the RPG battle transition (the encounter dips to its own stage, Persona and Final Fantasy), Puyo Puyo Tetris's versus
// screen, Raku's tables here (world/bazaar/session.js: the bots' turns a beat apart, the view awaited), Into the Breach (the foe's
// intent drawn while you plan).
//
//   game.duel = new DuelSession(game)   .begin(creature)   .update(raw, input)   .active   .state   .close(outcome)
//   The view is told: view.pendingAction(action | null), the action under the finger before it is chosen (a swap or drag as the press
//   builds, a run on hover), and view.armPaint(on) while a Paint is held (G, du.paint). The board's size is the ruleset's own (`board`,
//   rulesets.js: every device the same).
//   Events (with `by`): duel.open { kind, feeling }, duel.break { kind, depth }, duel.flee { roll, reroll, need, ok }, duel.end { kind, won, how, shiny,
//   turns }, duel.undo { left } (how 'fled': away, both whole; tracking.js says each)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { newDuel, act, endTurn, legalActions, undo, PVE, oneGesture } from '../../progress/duel/duel.js';
import { luckOf } from '../../progress/luck.js';
import { intentOf, hintOf, HINT, play as botPlay } from '../../progress/duel/bot.js';
import { SKILLS, skillsOf, canAct } from '../../progress/duel/skills.js';
import { DUEL_POWERS, POWER_IDS, POWER_ACTION, powersOf, powerReach } from '../../progress/duel/powers.js';
import { DOMAINS } from '../../progress/domains.js';
import { notAwakened } from '../../progress/feelings.js';
import { learnedOf } from '../../progress/duel/learned.js';
import { lessonDue } from '../../progress/duel/lesson.js';
import { rulesetOf, KIND_RULESETS } from '../../progress/duel/rulesets.js';
import { DUEL_VIEW, cellLocal } from '../../vfx/duelview/layout.js';
import { stream } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
const duelRand = stream('world/duel/duelsession'); // (the duel's seed: the session's own draw, the same twice)

export const DUEL_ROOM = { beat: 0.55, beatTouch: 0.35, slop: 8, yieldHold: 1.5, standOff: 5, bodyTap: 70, spent: 0.6, gap: 0.25, back: 0.6, dragTime: 5 }; // (the bot's beat, real s; the yield's hold; the camera off the board's face, m; a tap this near the Courier's body on screen switches the form, px; a spent turn's wait before it ends itself, real s; the PvE duel's drag clock from its first step, real s (Puzzle & Dragons' 4 to 6); in the instance, a body's clearance off the slab's edge and how far it stands behind its face, m)
const KEYS_KEPT = /^(Escape|Tab|F\d+|KeyB)$/; // (what a duel leaves to the rest of the game: the pause, the tuning panel, QAIS, the Codex)
const TOOL_KEYS = { KeyX: 'shoot', KeyQ: 'grab', KeyK: 'drill', KeyG: 'paint', KeyU: 'delay', KeyI: 'hold', KeyT: 'tune', KeyV: 'read' };
const WALK = { KeyW: 'N', KeyS: 'S', KeyA: 'W', KeyD: 'E' };
/** In the one-gesture duel (PUZZLE-DUELS.md 22) a tool's key or tile arms its skill: each move's key names the tool that owns it. */
const MOVE_TOOL = { shoot: 'psygun', grab: 'sondelass', drill: 'dreamvane', paint: 'soulbrush', delay: 'crucibelle', tune: 'crucibelle', hold: 'lockheart', send: 'lockheart', read: 'veritome' };
const _v = new THREE.Vector3(), _ndc = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), _box = new THREE.Box3(), _size = new THREE.Vector3();
/** A body's reach on the ground (half its wider side, m), measured from its meshes; `fallback` when it has none. */
const radiusOf = (o, fallback) => { if (!o) return fallback; _box.setFromObject(o); if (_box.isEmpty()) return fallback; _box.getSize(_size); return THREE.MathUtils.clamp(Math.max(_size.x, _size.z) / 2, 0.25, 1.6); };

export class DuelSession {
  constructor(game) {
    this.game = game; this.active = false; this.state = null; this.foe = null; this.busy = false; this.botT = -1;
    this.press = null; this.path = []; this.yieldT = 0; this.face = 'E'; this.hover = null; this.swipe = null;
  }
  get view() { return this.game.duelView || null; }
  /** A duel.* event on the bus, `practice` on it in a practice duel (tracking skips those: Strawman never counts). */
  emit(name, p) { this.game.events?.emit(name, this.practice ? { ...p, practice: true } : p); }
  /** Your side's mover (side 0) while it is your turn. */
  get mine() { return this.state && this.state.toMove === 0 && this.state.winner === null; }

  /** The pull filled (world/duel/duelfoes.js): the pocket closes round the two of you, the seam (Calissa's aberrant wipe), then the
   *  board between you. */
  begin(c) {
    const g = this.game; if (this.active || this.pending || !c?.alive) return false;
    const ruleset = rulesetOf(c, c.practice ? (c.practicePick || 'plain') : null), feeling = (KIND_RULESETS[c.kind] && ruleset.feeling) || c.grade || ruleset.feeling || 'fury'; // (a kind with its own board is drawn in its board's feeling: a blotling's weather is its grade, its board Gall's)
    this.pending = true; this.pendingFoe = c; this.pocket(c);
    const go = () => { this.pending = false; this.pendingFoe = null; this.open(c, feeling, ruleset); };
    if (!g.seam?.cross(go, { kind: 'aberrant', foe: c })) go();
    return true;
  }
  open(c, feeling, ruleset) {
    const g = this.game, P = g.player, pool = g.lachryma;
    const tools = (g.belt?.tools || []).filter((t) => g.belt.isWorn(t.id)).map((t) => t.id);
    this.startPool = Math.round(Math.min(100, pool?.available ?? 30));
    this.state = newDuel({ ruleset, seed: Math.floor(duelRand() * 2 ** 31), forms: ['hand', 'courier'], pool: [this.startPool, 30], tools: [tools, []],
      luck: [g.ledger ? Math.min(2, Math.floor(luckOf(g.ledger).level / 10)) : 0, 0], // (Luck's sway on a flee, 0..2: a tenth of its level, as ruled)
      rerolls: [g.rerolls?.left() ?? 0, 0], lesson: lessonDue(g.ledger), dim: g.lend?.has?.('feelings') ? [] : notAwakened(g.ledger), learned: learnedOf(g.ledger), // (a feeling not yet awakened gives half a gem's pool: PUZZLE-DUELS.md 26; an aberrant's skill learned: its secret found, or enough won, learned.js)
      levels: Object.fromEntries(Object.keys(DOMAINS).map((d) => [d, g.psyche?.level?.(d) ?? 1])) }); // (the PvE duel's powers cost less with their domain's level: powers.js powerCost) // (the first duel a lesson until one is won: lesson.js, PUZZLE-DUELS 18.3) // (Luck's re-rolls left this game day: a failed Flee is thrown again, progress/duel/flee.js)
    this.practice = !!c.practice; // (a practice foe, Strawman's: every duel.* event says so and counts nothing; no pool, no shatter, no drain)
    this.foe = c; this.feeling = feeling; this.active = true; this.busy = false; this.botT = -1; this.press = null; this.path = []; this.yieldT = 0; this.swipe = null; this.shown = null; this.picked = null; this.hinted = null; this.idleT = 0; this.spentT = 0;
    for (const t of g.belt?.tools || []) if (t.wants || t.drawT > 0) t.stow(); // (nothing in the hands: the board is the fight)
    g.techs?.get('carry')?.drop?.();
    P.vel.set(0, 0, 0);
    this.pin(c); // (it is in the duel, not the world, until it ends: its casts stopped, its mind held)
    // under the seam the duel's instance (render/duelinstance.js, South 2026-10-27): only its actors drawn, laid out for the board. The
    // tsuitate stands square to the camera with you on its left end and the foe on its right, each clear of the slab by its own size
    // (on a phone, in the middle of the flank the screen leaves beside it) and a step behind its face, so no body ever covers the board
    const facing = P.pos.clone().sub(c.pos).setY(0); if (facing.lengthSq() < 1e-4) facing.set(0, 0, 1); facing.normalize();
    const u = facing.clone().negate(), face = new THREE.Vector3().crossVectors(u, UP).normalize(), B = this.state.board;
    const half = (B.w * DUEL_VIEW.cs) / 2 + DUEL_VIEW.border, flank = this.flankRoom(B), root = c.root || c.model?.group || null;
    const off = (r) => half + Math.max(r + DUEL_ROOM.gap, flank / 2);
    const at = P.pos.clone().addScaledVector(u, off(radiusOf(g.god?.jar?.group, 0.45))).addScaledVector(face, DUEL_ROOM.back).setY(P.pos.y);
    this.home = { c, pos: c.pos.clone(), yaw: c.yaw, root: root ? { o: root, pos: root.position.clone(), yaw: root.rotation.y } : null }; // (put back at the end)
    const to = at.clone().addScaledVector(u, off(radiusOf(root, c.radius ?? 0.5))).addScaledVector(face, -DUEL_ROOM.back);
    to.y = c.rooted || c.practice ? P.pos.y : c.pos.y + (P.pos.y - c.pos.y) * 0.5; // (a fixture on your floor; a flier halfway down to it)
    if (root && (c.rooted || c.practice)) root.position.add(_v.copy(to).sub(c.pos)); // (a fixture does not place its own body: Strawman's group moved with it)
    c.pos.copy(to); c.rb?.setNextKinematicTranslation?.(c.pos);
    if (typeof c.yaw === 'number') { c.yaw = Math.atan2(facing.x, facing.z); c.vel?.set?.(0, 0, 0); if (c.root) c.root.rotation.y = c.yaw; } // (turned to face you)
    const shards = g.scene.getObjectByName('aberrant-shards'), keep = [this.view?.root, this.view?.dive?.beads, g.god?.jar?.group, root, c.root, shards];
    g.duelInstance?.open(() => [...keep, ...(this.view?.instanceKeep?.() || [])]);
    this.at = at; this.facing = facing;
    this.view?.open?.({ state: this.state, foe: c, at, facing });
    // the camera on the board's face (your half on the left), at its middle's height, far enough to hold both ends
    const mid = DUEL_VIEW.base + (this.state.board.h * DUEL_VIEW.cs) / 2;
    const shot = this.view?.frameShot?.() || { pos: at.clone().addScaledVector(face, DUEL_ROOM.standOff).setY(at.y + mid + 0.4), look: at.clone().setY(at.y + mid) }; // (the view's own framing, a cell 12 dots or more)
    g.cinema?.shot('duel', { pos: shot.pos, look: shot.look, bars: 0, ease: 4 });
    document.exitPointerLock?.(); document.body.classList.add('duel'); // (the cursor is the hand: index.html hides the pointer over the canvas)
    this.intent();
    this.emit('duel.open', { kind: c.kind, feeling, by: 'courier' });
  }

  /** The pocket (the owner, 2026-10-20; PUZZLE-DUELS.md 16.1: "a special pocket dimension, a one-enemy Well"): nothing outside enters.
   *  Every other creature is held (a halt, its blow called off) until the end, any that comes later too; every foe's projectile in flight
   *  is gone (its own `vanish`); and a blow on the Courier from outside is refused at the vessel (courier/vessel/damage.js). */
  pocket(foe) {
    const g = this.game, C = g.creatures; this.held ||= new Set();
    g.lock?.release?.('duel'); // (a lock held into the duel let go: its tag and reticle off the board; South, 2026-10-29)
    for (const c of C?.list || []) if (c !== foe && c.alive && !c.ally && !this.held.has(c)) { C.apply(c, 'halt', 600, 1, 'environment'); c.attack = null; c.windup = null; this.held.add(c); }
    for (const pr of g.projectiles || []) if (pr.vanish) pr.vanish(); else g.projectiles.delete(pr);
  }
  /** The pocket opened again: the held let go. */
  release() {
    const C = this.game.creatures;
    for (const c of this.held || []) if (c !== this.foe) C?.clearStatus?.(c, 'halt');
    this.held?.clear();
  }

  // ---------------------------------------------------------------- each frame
  update(raw, input) {
    if (this.active || this.pending) this.pocket(this.foe || this.pendingFoe);
    if (!this.active) return;
    const s = this.state, g = this.game;
    this.pointer(input);
    if (!this.busy && s.winner === null) {
      if (this.mine) { this.idle(raw, input); this.controls(raw, input);
        // a spent turn (no AP, no skill with a target) ends itself a beat after the finger lifts (Puzzle & Dragons ends on release)
        if (!this.busy && this.mine && !this.press && !canAct(s, 0)) { if ((this.spentT += raw) >= DUEL_ROOM.spent) { this.spentT = 0; this.endMine(); } } else this.spentT = 0; }
      else if (this.hinted) { this.hinted = null; this.idleT = 0; this.view?.hint?.(null); }
      else if (this.botT < 0) this.botT = this.flanks ? DUEL_ROOM.beatTouch : DUEL_ROOM.beat;
      else if ((this.botT -= raw) <= 0) { this.botT = -1; this.botRun = true; this.run(botPlay(s)); }
    }
    else if (this.busy && this.botRun && input.wasPressed('Mouse0')) this.skip(); // (a tap in the foe's turn plays the rest at once)
    this.cursorHand(raw);
    for (const c of [...input.pressed]) if (!KEYS_KEPT.test(c)) input.spend(c); // (no tool, form or menu below sees what the duel took)
    if (g.player) g.player.vel.set(0, 0, 0);
  }

  /** The cell under the mouse (the view's pick along the camera's ray through it). */
  pointer(input) {
    const cam = this.game.camera; if (!cam || input.mx < 0) { this.hover = null; return; }
    _ndc.set((input.mx / innerWidth) * 2 - 1, -(input.my / innerHeight) * 2 + 1, 0.5).unproject(cam);
    const ray = (this.ray ||= new THREE.Ray()); ray.origin.copy(cam.position); ray.direction.copy(_ndc.sub(cam.position).normalize());
    const cell = this.view?.cellAt?.(ray) || null;
    if (!sameCell(cell, this.hover)) { this.hover = cell; this.view?.hover?.(cell); }
  }

  /** Your input this frame, as the kernel's actions. */
  controls(raw, input) {
    const s = this.state, S = s.sides[0], cell = this.hover;
    if ((input.touchDrag?.fingers ?? 0) >= 2) { // (two fingers are the stage's pinch, never a swap: the press and path let go)
      if (this.press || this.path.length) { this.press = null; this.path = []; this.view?.select?.([]); this.show(null); }
      this.swipe = null; return;
    }
    if (cell && input.wasPressed('Mouse0') && this.view?.stage?.eatTap?.(cell)) return; // (in the arena a tap on the board zooms in, not acts: Calissa's duel stage)
    if (input.wasPressed('Backquote') || (!cell && input.wasPressed('Mouse0') && this.onBody(input))) return this.take({ kind: 'form', to: S.form === 'hand' ? 'courier' : 'hand' }); // (on touch a tap on the Courier's body does as du.form)
    if (input.wasPressed('Space')) return this.endMine();
    if (input.wasPressed('KeyZ') && (input.isDown('ControlLeft') || input.isDown('ControlRight'))) return this.takeBack();
    if (input.wasPressed('KeyE')) return this.take({ kind: 'flee' });
    if (input.isDown('Backspace')) { if ((this.yieldT += raw) >= DUEL_ROOM.yieldHold) return this.yield(); } else this.yieldT = 0;
    this.arm(S.form !== 'hand' && input.isDown('KeyG')); // (Paint armed while G or du.paint is held: its reach and greying, the view's glows)
    if (input.wasPressed('Mouse0') && this.view?.foeCast?.tap?.(input.mx, input.my)) return; // (a tap on the aberrant's countdown badge: its tooltip, if seen; the view's)
    if (s.style === 'pve' && this.powerInput(input, cell)) return; // (the god hand's seven: powers.js)
    if (oneGesture(s)) { const k = this.skillInput(input, cell); if (k) return; }
    if (S.form === 'hand') {
      if (input.wasPressed('Mouse0') && cell) { this.press = cell; this.path = [cell]; this.pressAt = [input.mx, input.my]; this.view?.select?.(this.path); }
      if (this.press && this.pressAt && Math.hypot(input.mx - this.pressAt[0], input.my - this.pressAt[1]) >= DUEL_ROOM.slop) this.pressAt = null; // (a tap never drags a gem by a hair: DUEL_ROOM.slop px first)
      if (this.press && !this.pressAt && input.isDown('Mouse0') && cell) {
        const last = this.path[this.path.length - 1];
        if (!sameCell(cell, last) && Math.abs(cell.x - last.x) + Math.abs(cell.y - last.y) === 1 && !(s.style === 'pve' && this.path.length > PVE.maxPath)) {
          this.path.push(cell); this.view?.select?.(this.path);
          if (s.style === 'pve' && this.dragLeft == null) this.dragLeft = DUEL_ROOM.dragTime; // (the PvE duel's clock starts on the first step, not the press)
        }
      }
      const timeUp = !!this.press && this.dragLeft != null && (this.dragLeft -= raw) <= 0; // (out of time: the drag is committed where the finger is)
      this.dragClock(this.press && this.dragLeft != null ? Math.max(0, this.dragLeft) / DUEL_ROOM.dragTime : null);
      this.show(this.press ? actionOfPath(this.path) : (this.hinted !== true && !this.view?.hint && this.hinted?.action) || null); // (the idle hint, where the view has no `hint` of its own, rides the preview)
      if (this.press && (!input.isDown('Mouse0') || timeUp)) {
        const P = this.path; this.press = null; this.dragLeft = null; this.dragClock(null); this.path = []; this.view?.select?.([]); this.show(null);
        const a = actionOfPath(P); if (a) { this.picked = null; return this.take(a); }
        if (this.touch && P.length === 1) return this.pickTap(P[0]); // (a tap, on touch: pick, then place)
      }
      const at = this.picked || cell; // (on touch the picked cell, else the one under the pointer)
      if (input.wasPressed('KeyR') && at) return this.take({ kind: 'rotate', at: [at.x, at.y] });
      if (input.wasPressed('Mouse2') && cell) return this.take({ kind: 'drop', at: [cell.x, cell.y] });
      if (input.wasPressed('KeyF')) return this.take({ kind: 'finisher' });
      return;
    }
    // the Courier
    const shift = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    for (const [k, dir] of Object.entries(WALK)) if (input.wasPressed(k)) { this.face = dir; return this.take({ kind: shift ? 'kick' : 'push', dir }); }
    // a swipe that starts on the Courier steps them its way; a long press there first (RMB), then the swipe, kicks (MOBILE.md 8.5: a
    // finger's, core/touchcursor.js; a mouse dragged from the Courier does the same)
    const onMe = !!(cell && S.at && cell.x === S.at[0] && cell.y === S.at[1]);
    if (onMe && (input.wasPressed('Mouse0') || input.wasPressed('Mouse2'))) { this.swipe = { from: cell, kick: input.wasPressed('Mouse2') }; return; }
    if (this.swipe) {
      const W = this.swipe;
      if (!input.isDown('Mouse0') && !input.isDown('Mouse2')) this.swipe = null;
      else if (cell && !sameCell(cell, W.from)) {
        this.swipe = null;
        const dx = cell.x - W.from.x, dy = cell.y - W.from.y, dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N';
        this.face = dir; return this.take({ kind: W.kick ? 'kick' : 'push', dir });
      }
      return;
    }
    if (!sameCell(cell, this.shownAt)) { this.shownAt = cell; const path = cell && !onMe ? this.runTo(cell) : null; this.show(path ? { kind: 'run', path } : null); } // (the run under the pointer, before it is chosen)
    if (input.wasPressed('Mouse0') && cell) {
      const path = this.runTo(cell);
      if (path && this.touch && !sameCell(cell, this.picked)) { this.picked = cell; this.shownAt = cell; this.view?.select?.([cell]); this.show({ kind: 'run', path }); return; } // (a tap marks the run; a second on it goes)
      if (path) { this.picked = null; this.view?.select?.([]); this.show(null); this.shownAt = null; return this.take({ kind: 'run', path }); }
    }
    for (const [k, kind] of Object.entries(TOOL_KEYS)) if (input.wasPressed(k)) {
      if (kind === 'drill') return this.take({ kind, dir: this.face });
      const under = cell && s.board.at(cell.x, cell.y)?.colour; // (the colour under the pointer, when it is on a gem)
      if (kind === 'shoot') { const d = this.lineTo(cell); return this.take(d ? { kind, dir: d } : { kind }); } // (down the row or column the pointer is on; else toward the foe)
      if (kind === 'paint') { // (the brush's colour over the colour under the pointer; else a legal repaint into it, else any)
        const colour = this.game.player?.techs?.get?.('soulbrush')?.load?.aspect || 'wonder', P = legalActions(s, 0).filter((a) => a.kind === 'paint');
        return this.take(P.find((a) => a.from === under && a.colour === colour) || P.find((a) => a.colour === colour) || P.find((a) => a.from === under) || P[0] || { kind, colour });
      }
      if (kind === 'tune') { const colour = under || legalActions(s, 0).find((a) => a.kind === 'tune')?.colour; return colour ? this.take({ kind, colour }) : undefined; }
      if (kind === 'hold' && shift) return this.take({ kind: 'send' });
      return this.take({ kind });
    }
  }
  /** The one-gesture duel's skills (PUZZLE-DUELS.md 22): 1 and 2 (or a tool's own key, or its tile on touch) arm the worn pair's first
   *  or second; a skill that takes no cell fires at once, one that takes a cell fires at the next tap on your half; the same key again lets
   *  it go. Not charged: a dry tick. True when the input was the skill's. */
  skillInput(input, cell) {
    const s = this.state, K = skillsOf(s, 0); let tool = null;
    if (input.wasPressed('Digit1')) tool = K[0]?.tool; else if (input.wasPressed('Digit2')) tool = K[1]?.tool;
    for (const [k, kind] of Object.entries(TOOL_KEYS)) if (input.wasPressed(k)) tool = MOVE_TOOL[kind];
    if (tool) {
      const k = K.find((x) => x.tool === tool);
      if (!k || !k.ready) { sfx.dryFire?.(); this.armSkill(null); return true; }
      if (this.armedSkill === tool) { this.armSkill(null); return true; }
      if (SKILLS[tool].target !== 'cell') { this.armSkill(null); this.take({ kind: 'skill', tool }); return true; }
      this.armSkill(tool); return true;
    }
    if (this.armedSkill && input.wasPressed('Mouse0') && cell) { const t = this.armedSkill; this.armSkill(null); this.take({ kind: 'skill', tool: t, at: [cell.x, cell.y] }); return true; }
    if (this.armedSkill && input.wasPressed('Mouse2')) { this.armSkill(null); return true; }
    return !!this.armedSkill; // (armed: the board's other input waits for the target)
  }
  /** The PvE duel's powers (powers.js, PUZZLE-DUELS.md 24): keys 1 to 7 or a power tile (`armPower`) arm one; a power with no target
   *  fires at once. Armed, one gesture targets it: a press on a cell and a release (a tap the same cell): Manifest, Transmute and Miracle
   *  the cell pressed; Lift the row or column dragged along, by the cells dragged (a tap: east by one); Herd and Kindle the row (H) or
   *  column (V) the drag runs; Swap the 2 x 2 patch pressed and the one released on. Its reach is drawn under the finger; RMB lets it go. */
  powerInput(input, cell) {
    for (let i = 0; i < POWER_IDS.length; i++) if (input.wasPressed('Digit' + (i + 1))) { this.armPower(this.armedPower === POWER_IDS[i] ? null : POWER_IDS[i]); return true; }
    const id = this.armedPower; if (!id) return false;
    if (input.wasPressed('Mouse2')) { this.armPower(null); return true; }
    if (input.wasPressed('Mouse0') && cell) this.powerFrom = cell;
    const from = this.powerFrom, a = from ? this.powerAction(id, from, cell || from) : cell ? this.powerAction(id, cell, cell) : null;
    this.powerShow(a);
    if (from && !input.isDown('Mouse0')) { this.powerFrom = null; this.armPower(null); if (a) this.take(a); }
    return true;
  }
  /** A power armed (its tile gold: the view's `armPower`), or null; the power tiles call it. One with no target fires at once; one not
   *  ready (resting, too dear, one already cast this turn) refuses dry. */
  armPower(id) {
    id ||= null;
    if (id && this.mine && !this.busy) {
      const P = powersOf(this.state, 0).find((p) => p.id === id);
      if (!P?.ready) { sfx.dryFire?.(); id = null; }
      else if (!DUEL_POWERS[id].target) { this.armPower(null); this.take({ kind: 'power', power: id }); return; }
    } else id = null;
    if (id === this.armedPower) return;
    this.armedPower = id; this.powerFrom = null; this.powerShow(null);
    const V = this.view; if (typeof V?.armPower === 'function') V.armPower(id);
  }
  /** The kernel's action for a power pressed at cell A and let go at B. */
  powerAction(id, A, B) {
    const dx = B.x - A.x, dy = B.y - A.y, a = { kind: 'power', power: id, at: [A.x, A.y] };
    if (id === 'swap') return { ...a, at: this.patchAt(A), to: this.patchAt(B) };
    if (id === 'lift') return dx || dy ? { ...a, dir: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N', by: Math.max(Math.abs(dx), Math.abs(dy)) } : { ...a, dir: 'E', by: 1 };
    if (id === 'herd' || id === 'kindle') return { ...a, dir: Math.abs(dy) > Math.abs(dx) ? 'V' : 'H' };
    return a;
  }
  /** A Swap patch's top-left for a cell: moved in so the patch stays on your half. */
  patchAt(c) {
    const b = this.state.board, n = DUEL_POWERS.swap.size; let last = 0; for (let x = 0; x < b.w; x++) if (b.mine(0, x)) last = x;
    return [Math.max(0, Math.min(c.x, last - n + 1)), Math.max(0, Math.min(c.y, b.h - n))];
  }
  /** The power under the finger told to the view once a change: its action, the cells it would touch and whether the kernel takes it
   *  (the view's `powerReach`; without one, the cells selected). */
  powerShow(a) {
    const key = a ? JSON.stringify(a) : null; if (key === this.powerShown) return; this.powerShown = key;
    const cells = a ? powerReach(this.state, 0, a) : [], ok = !!a && POWER_ACTION.legal(this.state, 0, a), V = this.view;
    if (typeof V?.powerReach === 'function') V.powerReach(a, cells, ok); else V?.select?.(cells.map(([x, y]) => ({ x, y })));
  }
  /** The skill armed (its tile gold, its reach drawn: the view's `armSkill`), or null. */
  armSkill(tool) { if (tool === this.armedSkill) return; this.armedSkill = tool || null; const V = this.view; if (typeof V?.armSkill === 'function') V.armSkill(this.armedSkill); }
  /** The view told once a change whether a Paint is armed. */
  arm(on) { if (on === !!this.armed) return; this.armed = on; const V = this.view; if (typeof V?.armPaint === 'function') V.armPaint(on); }
  /** On touch a cell is picked, then placed (a thumb covers a 15 px cell): the first tap rings it, a tap on a neighbour swaps with it, a
   *  tap on it again lets it go, a tap elsewhere picks that one instead. */
  pickTap(cell) {
    const p = this.picked;
    if (p && Math.abs(cell.x - p.x) + Math.abs(cell.y - p.y) === 1) { this.picked = null; this.view?.select?.([]); this.show(null); return this.take({ kind: 'swap', at: [p.x, p.y], dir: dirOf(p, cell) }); }
    this.picked = p && sameCell(p, cell) ? null : cell;
    this.view?.select?.(this.picked ? [this.picked] : []);
  }
  get touch() { return this.game.input?.device === 'touch'; }
  /** The phone's layout (the duel screen's flanks, ui/touch/duelscreen.js): the bot's beat quicker, the hand's cursor hidden. */
  get flanks() { return !!this.game.hudLayout?.touch; }
  /** A tap on the Courier's body, off the board: the body's middle projected to the screen, within DUEL_ROOM.bodyTap px. */
  onBody(input) {
    const P = this.game.player, cam = this.game.camera; if (!this.touch || !P || !cam || input.mx < 0) return false;
    _ndc.copy(P.pos).setY(P.pos.y + 0.9).project(cam); if (_ndc.z > 1) return false;
    const x = (_ndc.x + 1) / 2 * innerWidth, y = (1 - _ndc.y) / 2 * innerHeight;
    return Math.abs(input.mx - x) < DUEL_ROOM.bodyTap && Math.abs(input.my - y) < DUEL_ROOM.bodyTap * 1.6;
  }
  /** The way from the Courier to `cell` when it is on the Courier's row or column, else null. */
  lineTo(cell) {
    const at = this.state.sides[0].at; if (!cell || !at || (cell.x === at[0] && cell.y === at[1])) return null;
    if (cell.y === at[1]) return cell.x > at[0] ? 'E' : 'W';
    if (cell.x === at[0]) return cell.y > at[1] ? 'S' : 'N';
    return null;
  }
  /** A run's path to `cell` (the kernel's own: up to four cells from where you stand). */
  runTo(cell) {
    const paths = legalActions(this.state, 0).filter((a) => a.kind === 'run');
    const hit = paths.filter((a) => { const e = a.path[a.path.length - 1]; return e[0] === cell.x && e[1] === cell.y; }).sort((a, b) => a.path.length - b.path.length)[0];
    return hit?.path || null;
  }

  /** One of your actions: refused (a dry tick) or played, then the forecast drawn again. */
  take(a) {
    this.picked = null;
    const S = this.state, A = this.game.classArtsRun, lucky = a.kind === 'flee' && S?.rerolls && !this.practice && (A?.lucky?.() || A?.secondChance?.('flee')); // (Beginner's Luck, Second Chance: the throw thrown again if it fails, courier/classarts/body.js)
    if (lucky) S.rerolls[0]++;
    this.luckyFlee = !!lucky; // (the art's throw is spent first: duel.flee says lucky, and the game day's re-roll is kept, progress/dice.js)
    const ev = act(S, a);
    if (!ev) { sfx.dryFire?.(); this.view?.refuse?.(a); return; }
    this.run(ev);
  }
  /** The action under the finger or the pointer, before it is chosen (a swap or drag as the press builds, a run on hover), told to the view
   *  once a change, null when let go: the view draws what it would bring from Dovina's preview (duel.js). */
  /** The idle hint (Dovina's hintOf, PUZZLE-DUELS.md 21): after HINT.idle real s of your turn with no press, the move that sends most
   *  junk is lit (the view's `hint`, else its preview); the next press drops it. Asked once a wait, on quiet copies (4 ms). */
  idle(raw, input) {
    if (input.pressed.size || (input.touchDrag?.fingers ?? 0) > 0 || this.press) { this.idleT = 0; if (this.hinted) { this.hinted = null; const V = this.view; if (V?.hint) V.hint(null); else this.show(null); } return; }
    if (this.hinted || (this.idleT = (this.idleT || 0) + raw) < HINT.idle) return;
    const a = hintOf(this.state, 0); this.hinted = a || true; if (!a) return;
    const V = this.view; if (V?.hint) V.hint(a); else this.show(a.action); // (hintOf's { action, junk, cells }: the view's hint takes the whole)
  }
  /** The foe's turn played out at once: its events dropped from the view's queue and the board stood again from the state (the kernel
   *  already played the whole turn: bot.js play). The view's own `skip` where it has one. */
  skip() {
    const V = this.view; if (!V?.isOpen) return;
    if (typeof V.skip === 'function') return V.skip(this.state);
    V.beats?.clear?.(); if (typeof V.resync === 'function') V.resync(this.state);
  }
  /** The PvE duel's drag clock, 1 full .. 0 out, null gone: drawn by the view (`dragClock`, Calissa's). */
  dragClock(k) { if (k === this.clockShown) return; this.clockShown = k; this.view?.dragClock?.(k); }
  show(a) {
    const key = a ? JSON.stringify(a) : null; if (key === this.shown) return;
    this.shown = key; const V = this.view; if (typeof V?.pendingAction === 'function') V.pendingAction(a); // (not `pending`: the view keeps its junk counts by that name)
  }
  endMine() { this.run(endTurn(this.state)); }
  /** The last action this turn taken back (free; none after the turn ends or a die is thrown). The view is stood again from the state
   *  as it was (its own `resync` where it has one, else opened afresh where it stands), then the `undo` event played. */
  takeBack() {
    this.picked = null; this.show(null);
    const ev = undo(this.state);
    if (!ev) { sfx.dryFire?.(); return; }
    const V = this.view;
    if (typeof V?.resync === 'function') V.resync(this.state); else V?.open?.({ state: this.state, foe: this.foe, at: this.at, facing: this.facing });
    this.emit('duel.undo', { left: ev[0].left, by: 'courier' });
    this.run(ev);
  }
  /** Events played by the view (awaited: nothing is taken meanwhile), then the forecast and the end. */
  run(events) {
    this.busy = true;
    if (events.some((e) => e.type === 'duel.finisher')) this.drainCamera(); // (the finisher is the data drain: its own camera, cine/sequences.js)
    for (const e of events) {
      if (e.type === 'duelBreak') this.emit('duel.break', { kind: this.foe?.kind, depth: e.depth, by: e.side === 1 ? 'courier' : 'creature' }); // (the room maps a side to `by`: PUZZLE-DUELS.md 13.1)
      if (e.type === 'flee' && e.ok && e.roll === 20) this.atOnce = true; // (a natural 20: the log says "You flee at once." instead)
      // the one-gesture duel's big moments on the bus (PUZZLE-DUELS.md 22.4): the haptics and the sound hear them (audio/haptics.js,
      // Wanda's), the ledger counts them (tracking/duel.js)
      if (e.side === 0 && e.type === 'chain' && e.step >= 2) this.emit('duel.chain', { step: e.step, weak: !!e.weak, by: 'courier' });
      if (e.side === 0 && e.type === 'skill') this.emit('duel.skill', { tool: e.tool, by: 'courier' });
      if (e.side === 0 && e.type === 'charge' && e.ready) this.emit('duel.charge', { tool: e.tool, by: 'courier' });
      if (e.side === 0 && e.type === 'land' && e.n) this.emit('duel.land', { n: e.n, kind: e.kind, by: 'creature' });
      if (e.side === 0 && e.type === 'lesson.done') this.emit('duel.lesson', { by: 'courier' }); // (counted even in practice: lessonDue reads it)
      if (e.side === 0 && e.type === 'allclear') this.emit('duel.allclear', { n: e.n, by: 'courier' });
      if (e.type === 'power') { const sc = events.find((x) => x.type === 'scan' && x.side === e.side); this.emit('duel.power', { power: e.power, domain: e.domain, cost: e.cost, cleared: e.cleared ?? 0, ...(sc ? { skill: sc.skill } : {}), by: e.side === 0 ? 'courier' : 'creature' }); } // (tracking/duel.js counts it; game.foeSeen marks a scanned skill seen)
      if (e.type === 'foe.skill') this.emit('duel.foe', { skill: e.skill, n: e.n ?? e.lost ?? 0, by: 'creature' }); // (the PvE duel's foe skills and your stagger: tracking/duel.js)
      if (e.type === 'foe.stagger') this.emit('duel.stagger', { by: 'courier' });
      if (e.type === 'secret.step') this.emit('duel.secret', { id: e.id, k: e.k, by: 'courier' }); // (an aberrant's secret win, secrets.js: its steps, its half, its end; tracking/duel.js and game.foeSeen hear them)
      if (e.type === 'secret.half') this.emit('duel.secret', { id: e.id, half: true, by: 'courier' });
      if (e.type === 'duel.secret') this.emit('duel.secret', { id: e.id, done: true, by: 'courier' });
      if (e.type === 'foe.desperate') this.emit('duel.desperate', { by: 'creature' });
      if (e.type === 'flee') { const lucky = e.side === 0 && this.luckyFlee && e.reroll != null; this.luckyFlee = false; this.emit('duel.flee', { roll: e.roll, reroll: e.reroll ?? null, need: e.need, ok: e.ok, ...(lucky ? { lucky: true } : {}), by: e.side === 0 ? 'courier' : 'creature' }); }
    }
    const done = () => { this.busy = false; this.botRun = false; if (this.armedPower && !this.mine) this.armPower(null); if (!this.active) return; if (this.state.winner !== null) this.finish(); else this.intent(); };
    const p = this.view?.play?.(events);
    if (p?.then) p.then(done, done); else done();
  }
  drainCamera() {
    const g = this.game, c = this.foe, P = g.player; if (!g.cine || !c) return;
    g.cine.play('reprogram.drain', { id: 'duel.drain', yaw: Math.atan2(c.pos.x - P.pos.x, c.pos.z - P.pos.z), anchors: { courier: () => P.pos, veritome: () => P.pos.clone().setY(P.pos.y + 1.2), creature: () => c.pos } });
  }
  /** The foe's forecast after each of your actions (bot.js intentOf: { actions, junk, cells, hits }, one plan, ~40 real ms on the Wisp's
   *  board: never a frame). Kept as `foresight` for the view; its `intent` is handed the actions until it takes the whole. */
  intent() {
    if (this.state.toMove !== 0 || this.state.winner !== null) return;
    const I = this.foresight = intentOf(this.state, 1), V = this.view;
    if (this.state.style === 'pve') { V?.intent?.(null); return; } // (the PvE duel's aberrant never matches: its intent is its countdown badges, foecast.js; the old forecast drew a stray step "1")
    V?.intent?.(V.intentWhole ? I : I.actions);
  }

  /** The god hand over the board: shown in the hand form, at the hovered cell, palm to the board (godhand.js cursorAt). */
  cursorHand(raw) {
    const g = this.game, H = g.god, s = this.state, hand = s && s.sides[0].form === 'hand' && s.toMove === 0;
    if (!H?.cursorAt) return;
    const at = hand && !this.flanks && this.hover && this.pointOf(this.hover); // (on a phone no cursor: pick-then-place needs none, and it hid a third of the foe's half)
    if (at) H.cursorAt(at, this.view.face, raw, { press: this.press ? 1 : 0 }); else H.hideCursor?.();
  }
  /** A cell's centre on the board's face, in the world (the view's own layout: vfx/duelview/layout.js). */
  pointOf(cell) {
    const V = this.view; if (!V?.isOpen) return null;
    if (V.pointOf) return V.pointOf(cell);
    if (!V.frame) return null;
    return V.frame.localToWorld(cellLocal(cell.x, cell.y, V.board3, new THREE.Vector3()));
  }
  /** The foe held for the duel: its casts called off, a halt on it, its mind not to act (the creature decides what a halt means). */
  pin(c) {
    const g = this.game;
    g.creatures?.apply?.(c, 'halt', 600, 1);
    c.attack = null; c.windup = null; c.dueling = true;
  }
  unpin(c) {
    const g = this.game; if (!c) return;
    c.dueling = false; g.creatures?.clearStatus?.(c, 'halt');
  }

  // ---------------------------------------------------------------- the end
  yield() { this.state.winner = 1; this.how = 'yield'; this.finish(); }
  finish() {
    const s = this.state, won = s.winner === 0, log = s.log, last = [...log].reverse().find((e) => /^duel\.(line|full|cap|finisher|secret)$/.test(e.type));
    const how = this.how || (s.fled != null ? 'fled' : last ? last.type.slice(5) : 'line'), secret = how === 'secret' ? last.id : null;
    // each aberrant's two deaths (ABERRANTS.md: one on the Line, one on its secret) played before the board folds: the view's `death`
    // where it has one (Calissa's timeline, Wanda's sound), awaited; a fled or yielded duel has none
    const p = (how === 'line' || how === 'secret' || how === 'finisher') && won ? this.view?.death?.({ how, secret, foe: this.foe }) : null;
    if (p?.then) { this.busy = true; const go = () => { if (this.active) this.close({ won, how }); }; p.then(go, go); } else this.close({ won, how });
  }
  /** The foe put back where the duel found it (its body too when it is a fixture), its yaw as it was. */
  putBack(H) {
    if (!H?.c) return; const c = H.c;
    c.pos.copy(H.pos); c.rb?.setNextKinematicTranslation?.(c.pos); if (typeof H.yaw === 'number') c.yaw = H.yaw;
    if (H.root) { H.root.o.position.copy(H.root.pos); H.root.o.rotation.y = H.root.yaw; }
  }
  /** On a phone, the metres of the narrower flank the duel's screen leaves beside the board (ui/hudlayout.js duelLayout, at the scale
   *  the view's touchShot frames it); on the desk 0 (its camera backs off to hold both bodies: vfx/duelview.js frameShot). */
  flankRoom(B) {
    const L = this.game.hudLayout, V = L?.view, R = L?.touch ? L.duelLayout?.(B)?.board : null; if (!R?.h || !V?.w) return 0;
    const k = R.h / (R.m?.h ?? B.h * DUEL_VIEW.cs + DUEL_VIEW.border); return Math.max(0, Math.min(R.x, V.w - R.x - R.w)) / k;
  }
  /** Down with the board, back to the world: the pool as it stands, the Figment drained (you won) or calmed (it did); a loss shatters. */
  close({ won = false, how = 'yield' } = {}) {
    const g = this.game, c = this.foe, s = this.state; if (!this.active) return;
    this.active = false; this.busy = false; this.how = null; this.armed = false;
    this.view?.close?.(); g.god?.hideCursor?.();
    g.cinema?.unshot('duel'); document.body.classList.remove('duel');
    if (g.input?.enabled) g.input.requestLock?.();
    const pool = g.lachryma, d = this.practice ? 0 : Math.round((s?.sides[0].pool ?? this.startPool) - this.startPool);
    if (pool && d > 0) pool.gain(d, 'duel'); else if (pool && d < 0) pool.spend(-d, 'duel');
    this.dragLeft = null; this.dragClock(null); this.armPower(null); this.clockShown = undefined;
    const V = this.view, home = this.home; this.home = null; // (the instance held while the tsuitate folds away, then the world again and the foe where it stood)
    if (g.duelInstance?.active) g.duelInstance.close(() => !V || (!V.closing && !V.root?.visible) || V.isOpen, () => this.putBack(home)); else this.putBack(home);
    this.unpin(c); this.release();
    const atOnce = how === 'fled' && this.atOnce; this.atOnce = false;
    this.emit('duel.end', { kind: c?.kind, won, how, shiny: !!c?.shiny, turns: s ? Math.ceil(s.ply / 2) : 0, ...(atOnce ? { atOnce } : {}), by: won || how === 'fled' ? 'courier' : 'creature' });
    if (g.duelFoes && c) g.duelFoes.rearm = c; // (no pull from it again until you have stepped past the pull's far edge)
    if (this.practice) { if (c) c.emo = 0; } // (practice: both whole, nothing taken, it stands as it was)
    else if (won && c?.alive) { c.dataBugMended = true; c.aberrant = false; g.creatures.strike(c, c.pos.clone().setY(c.pos.y + (c.height ?? 1)), _v.set(0, 1, 0), 999, 'drain', 'courier'); }
    else if (how === 'fled') { if (c) c.emo = 0; } // (away: both whole, no reward; it keeps its aberrance, calm, and drifts off)
    else if (!won && how !== 'yield' && g.classArtsRun?.secondChance?.('duel')) { if (c) c.emo = 0; if (g.duelFoes) g.duelFoes.rearm = null; } // (Second Chance, a class's art: spared the shatter, its pull open again at once to try again)
    else if (!won) { if (c) c.emo = 0; g.death?.begin?.({ why: 'duel', by: 'creature' }); }
    this.state = null; this.foe = null; this.practice = false;
  }
}

const sameCell = (a, b) => (!a && !b) || (!!a && !!b && a.x === b.x && a.y === b.y);
const dirOf = (a, b) => (b.x > a.x ? 'E' : b.x < a.x ? 'W' : b.y > a.y ? 'S' : 'N');
/** A press's path as the kernel's action: two cells a swap, more a drag, one nothing yet. */
const actionOfPath = (P) => (P.length === 2 ? { kind: 'swap', at: [P[0].x, P[0].y], dir: dirOf(P[0], P[1]) } : P.length > 2 ? { kind: 'drag', path: P.map((c) => [c.x, c.y]) } : null);
