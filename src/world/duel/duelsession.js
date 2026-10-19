// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL IN THE WORLD (docs/plans/PUZZLE-DUELS.md section 8, Petra's half): the session that plays the kernel (progress/duel/,
// Dovina's) against an aberrant Figment where it was met. The first blow on it (world/duel/duelfoes.js), the aberrant wipe (the seam's kind
// 'aberrant', vfx/aberrantwipe.js), and the board stands between you, the camera
// framing it; your turns are your input, its turns its bot's (a beat apart, so you can follow them); every action's events are played
// by the view (game.duelView, Calissa's: the board, the pieces, the domains' clash) before the next is taken. The duel ends on the Line,
// a full side, the coup or the turn cap; losing is a shatter (the owner, 2026-10-19), winning drains the Figment and mends it, and a flee
// that gets away (flee.js, section 15) leaves you both whole.
//
// The controls (the forms: PUZZLE-DUELS.md 4 and 11; the god hand is the cursor, the owner on board v11):
//   the god hand      LMB on a piece and onto a neighbour: SWAP; held across three or more cells: DRAG; R: ROTATE the 2x2 under the
//                     hand (its top-left); RMB on an empty cell: DROP the next queued piece; F: the COUP on a buckled foe
//   the Courier       LMB on a cell up to four away: GLEAN there; W A S D: PUSH that way, with Shift: PUNT; each worn tool on its own
//                     key: X shoot (the psygun), Q hook (the Sondelass), K drill the way last faced (the Dreamvane), G paint in the Soul
//                     Brush's feeling (its pick), U toll (the Crucibelle), I hoover, Shift+I flail (the Lockheart)
//   both              ~ switches form (1 point), E flees (a d20 against 15, 3 points a failed try), Space ends the turn, Backspace
//                     held 1.5 real s yields (a loss: the shatter)
// While it runs the Courier is held as the crossing holds them (main.js `aboard`), and every key it reads is spent so no tool sees it.
//
// Prior art: the RPG battle transition (the encounter dips to its own stage, Persona and Final Fantasy), Puyo Puyo Tetris's versus
// screen, Raku's tables here (world/bazaar/session.js: the bots' turns a beat apart, the view awaited), Into the Breach (the foe's
// intent drawn while you plan).
//
//   game.duel = new DuelSession(game)   .begin(creature)   .update(raw, input)   .active   .state   .close(outcome)
//   Events (with `by`): duel.open { kind, feeling }, duel.buckle { kind, depth }, duel.flee { roll, need, ok }, duel.end { kind, won, how,
//   turns } (how 'fled': away, both whole; tracking.js says each)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { newDuel, act, endTurn, legalActions } from '../../progress/duel/duel.js';
import { luckOf } from '../../progress/luck.js';
import { plan as botPlan, play as botPlay } from '../../progress/duel/bot.js';
import { rulesetOf } from '../../progress/duel/rulesets.js';
import { DUEL_VIEW, cellLocal } from '../../vfx/duelview/layout.js';
import { stream } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
const duelRand = stream('world/duel/duelsession'); // (the duel's seed: the session's own draw, the same twice)

export const DUEL_ROOM = { beat: 0.55, yieldHold: 1.5, apart: 5, standOff: 5 }; // (the bot's beat, real s; the yield's hold; the two set this far apart under the seam, m; the camera off the board's face, m)
const KEYS_KEPT = /^(Escape|Tab|F\d+|KeyB)$/; // (what a duel leaves to the rest of the game: the pause, the tuning panel, QAIS, the Codex)
const TOOL_KEYS = { KeyX: 'shoot', KeyQ: 'hook', KeyK: 'drill', KeyG: 'paint', KeyU: 'toll', KeyI: 'hoover' };
const WALK = { KeyW: 'N', KeyS: 'S', KeyA: 'W', KeyD: 'E' };
const _v = new THREE.Vector3(), _ndc = new THREE.Vector3();

export class DuelSession {
  constructor(game) {
    this.game = game; this.active = false; this.state = null; this.foe = null; this.busy = false; this.botT = -1;
    this.press = null; this.path = []; this.yieldT = 0; this.face = 'E'; this.hover = null;
  }
  get view() { return this.game.duelView || null; }
  /** Your side's mover (side 0) while it is your turn. */
  get mine() { return this.state && this.state.toMove === 0 && this.state.winner === null; }

  /** The first blow on an aberrant (world/duel/duelfoes.js): the seam (Calissa's aberrant wipe), then the board between you. */
  begin(c) {
    const g = this.game; if (this.active || this.pending || !c?.alive) return false;
    const ruleset = rulesetOf(c), feeling = c.grade ?? ruleset.feeling ?? 'fury';
    this.pending = true;
    const go = () => { this.pending = false; this.open(c, feeling, ruleset); };
    if (!g.seam?.cross(go, { kind: 'aberrant', foe: c })) go();
    return true;
  }
  open(c, feeling, ruleset) {
    const g = this.game, P = g.player, pool = g.lachryma;
    const tools = (g.belt?.tools || []).filter((t) => g.belt.isWorn(t.id)).map((t) => t.id);
    this.startPool = Math.round(Math.min(100, pool?.available ?? 30));
    this.state = newDuel({ ruleset, seed: Math.floor(duelRand() * 2 ** 31), forms: ['hand', 'courier'], pool: [this.startPool, 30], tools: [tools, []],
      luck: [g.ledger ? Math.min(2, Math.floor(luckOf(g.ledger).level / 10)) : 0, 0] }); // (Luck's sway on a flee, 0..2: a tenth of its level, Petra's placeholder until Dovina rules)
    this.foe = c; this.feeling = feeling; this.active = true; this.busy = false; this.botT = -1; this.press = null; this.path = []; this.yieldT = 0;
    for (const t of g.belt?.tools || []) if (t.wants || t.drawT > 0) t.stow(); // (nothing in the hands: the board is the fight)
    g.techs?.get('carry')?.drop?.();
    P.vel.set(0, 0, 0);
    this.pin(c); // (it is in the duel, not the world, until it ends: its casts stopped, its mind held)
    // under the seam the two are set apart along the line between them, and the board stands broadside between, your half nearest you
    const facing = P.pos.clone().sub(c.pos).setY(0); if (facing.lengthSq() < 1e-4) facing.set(0, 0, 1); facing.normalize();
    c.pos.copy(P.pos).addScaledVector(facing, -DUEL_ROOM.apart).setY(c.pos.y + (P.pos.y - c.pos.y) * 0.5); c.rb?.setNextKinematicTranslation?.(c.pos);
    const at = P.pos.clone().lerp(c.pos, 0.5).setY(P.pos.y);
    this.at = at; this.facing = facing;
    this.view?.open?.({ state: this.state, foe: c, at, facing });
    // the camera on the board's face (the view's `face`: your half on the left), at its middle's height, far enough to hold both ends
    const face = this.view?.face || new THREE.Vector3().crossVectors(facing.clone().negate(), _v.set(0, 1, 0)).normalize();
    const mid = DUEL_VIEW.base + (this.state.board.h * DUEL_VIEW.cs) / 2;
    g.cinema?.shot('duel', { pos: at.clone().addScaledVector(face, DUEL_ROOM.standOff).setY(at.y + mid + 0.4), look: at.clone().setY(at.y + mid), bars: 0, ease: 4 });
    document.exitPointerLock?.(); document.body.classList.add('duel'); // (the cursor is the hand: index.html hides the pointer over the canvas)
    this.intent();
    g.events?.emit('duel.open', { kind: c.kind, feeling, by: 'courier' });
  }

  // ---------------------------------------------------------------- each frame
  update(raw, input) {
    if (!this.active) return;
    const s = this.state, g = this.game;
    this.pointer(input);
    if (!this.busy && s.winner === null) {
      if (this.mine) this.controls(raw, input);
      else if (this.botT < 0) this.botT = DUEL_ROOM.beat;
      else if ((this.botT -= raw) <= 0) { this.botT = -1; this.run(botPlay(s)); }
    }
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
    if (input.wasPressed('Backquote')) return this.take({ kind: 'form', to: S.form === 'hand' ? 'courier' : 'hand' });
    if (input.wasPressed('Space')) return this.endMine();
    if (input.wasPressed('KeyE')) return this.take({ kind: 'flee' });
    if (input.isDown('Backspace')) { if ((this.yieldT += raw) >= DUEL_ROOM.yieldHold) return this.yield(); } else this.yieldT = 0;
    if (S.form === 'hand') {
      if (input.wasPressed('Mouse0') && cell) { this.press = cell; this.path = [cell]; this.view?.select?.(this.path); }
      if (this.press && input.isDown('Mouse0') && cell) {
        const last = this.path[this.path.length - 1];
        if (!sameCell(cell, last) && Math.abs(cell.x - last.x) + Math.abs(cell.y - last.y) === 1) { this.path.push(cell); this.view?.select?.(this.path); }
      }
      if (this.press && !input.isDown('Mouse0')) {
        const P = this.path; this.press = null; this.path = []; this.view?.select?.([]);
        if (P.length === 2) return this.take({ kind: 'swap', at: [P[0].x, P[0].y], dir: dirOf(P[0], P[1]) });
        if (P.length > 2) return this.take({ kind: 'drag', path: P.map((c) => [c.x, c.y]) });
      }
      if (input.wasPressed('KeyR') && cell) return this.take({ kind: 'rotate', at: [cell.x, cell.y] });
      if (input.wasPressed('Mouse2') && cell) return this.take({ kind: 'drop', at: [cell.x, cell.y] });
      if (input.wasPressed('KeyF')) return this.take({ kind: 'coup' });
      return;
    }
    // the Courier
    const shift = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    for (const [k, dir] of Object.entries(WALK)) if (input.wasPressed(k)) { this.face = dir; return this.take({ kind: shift ? 'punt' : 'push', dir }); }
    if (input.wasPressed('Mouse0') && cell) { const path = this.gleanTo(cell); if (path) return this.take({ kind: 'glean', path }); }
    for (const [k, kind] of Object.entries(TOOL_KEYS)) if (input.wasPressed(k)) {
      if (kind === 'drill') return this.take({ kind, dir: this.face });
      if (kind === 'paint') return this.take({ kind, colour: this.game.player?.techs?.get?.('soulbrush')?.load?.aspect || 'wonder' });
      if (kind === 'hoover' && shift) return this.take({ kind: 'flail' });
      return this.take({ kind });
    }
  }
  /** A glean's path to `cell` (the kernel's own: up to four cells from where you stand). */
  gleanTo(cell) {
    const paths = legalActions(this.state, 0).filter((a) => a.kind === 'glean');
    const hit = paths.filter((a) => { const e = a.path[a.path.length - 1]; return e[0] === cell.x && e[1] === cell.y; }).sort((a, b) => a.path.length - b.path.length)[0];
    return hit?.path || null;
  }

  /** One of your actions: refused (a dry tick) or played, then the forecast drawn again. */
  take(a) {
    const ev = act(this.state, a);
    if (!ev) { sfx.dryFire?.(); this.view?.refuse?.(a); return; }
    this.run(ev);
  }
  endMine() { this.run(endTurn(this.state)); }
  /** Events played by the view (awaited: nothing is taken meanwhile), then the forecast and the end. */
  run(events) {
    this.busy = true;
    if (events.some((e) => e.type === 'duel.coup')) this.drainCamera(); // (the coup is the data drain: its own camera, cine/sequences.js)
    for (const e of events) {
      if (e.type === 'buckle') this.game.events?.emit('duel.buckle', { kind: this.foe?.kind, depth: e.depth, by: e.side === 1 ? 'courier' : 'creature' }); // (the room maps a side to `by`: PUZZLE-DUELS.md 13.1)
      if (e.type === 'flee') this.game.events?.emit('duel.flee', { roll: e.roll, need: e.need, ok: e.ok, by: e.side === 0 ? 'courier' : 'creature' });
    }
    const done = () => { this.busy = false; if (!this.active) return; if (this.state.winner !== null) this.finish(); else this.intent(); };
    const p = this.view?.play?.(events);
    if (p?.then) p.then(done, done); else done();
  }
  drainCamera() {
    const g = this.game, c = this.foe, P = g.player; if (!g.cine || !c) return;
    g.cine.play('reprogram.drain', { id: 'duel.drain', yaw: Math.atan2(c.pos.x - P.pos.x, c.pos.z - P.pos.z), anchors: { courier: () => P.pos, veritome: () => P.pos.clone().setY(P.pos.y + 1.2), creature: () => c.pos } });
  }
  intent() { if (this.state.toMove === 0 && this.state.winner === null) this.view?.intent?.(botPlan(this.state, 1)); }

  /** The god hand over the board: shown in the hand form, at the hovered cell, palm to the board (godhand.js cursorAt). */
  cursorHand(raw) {
    const g = this.game, H = g.god, s = this.state, hand = s && s.sides[0].form === 'hand' && s.toMove === 0;
    if (!H?.cursorAt) return;
    const at = hand && this.hover && this.pointOf(this.hover);
    if (at) H.cursorAt(at, this.view.face, raw, { press: this.press ? 1 : 0 }); else H.hideCursor?.();
  }
  /** A cell's centre on the board's face, in the world (the view's own layout: vfx/duelview/layout.js). */
  pointOf(cell) {
    const V = this.view; if (!V?.frame || !V.isOpen) return null;
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
    const s = this.state, won = s.winner === 0, log = s.log, last = [...log].reverse().find((e) => /^duel\.(line|full|cap|coup)$/.test(e.type));
    const how = this.how || (s.fled != null ? 'fled' : last ? last.type.slice(5) : 'line');
    this.close({ won, how });
  }
  /** Down with the board, back to the world: the pool as it stands, the Figment drained (you won) or calmed (it did); a loss shatters. */
  close({ won = false, how = 'yield' } = {}) {
    const g = this.game, c = this.foe, s = this.state; if (!this.active) return;
    this.active = false; this.busy = false; this.how = null;
    this.view?.close?.(); g.god?.hideCursor?.();
    g.cinema?.unshot('duel'); document.body.classList.remove('duel');
    if (g.input?.enabled) g.input.requestLock?.();
    const pool = g.lachryma, d = Math.round((s?.sides[0].pool ?? this.startPool) - this.startPool);
    if (pool && d > 0) pool.gain(d, 'duel'); else if (pool && d < 0) pool.spend(-d, 'duel');
    this.unpin(c);
    g.events?.emit('duel.end', { kind: c?.kind, won, how, turns: s ? Math.ceil(s.ply / 2) : 0, by: won || how === 'fled' ? 'courier' : 'creature' });
    if (won && c?.alive) { c.dataBugMended = true; c.aberrant = false; g.creatures.strike(c, c.pos.clone().setY(c.pos.y + (c.height ?? 1)), _v.set(0, 1, 0), 999, 'drain', 'courier'); }
    else if (how === 'fled') { if (c) c.emo = 0; } // (away: both whole, no reward; it keeps its aberrance, calm, and drifts off)
    else if (!won) { if (c) c.emo = 0; g.death?.begin?.({ why: 'duel', by: 'creature' }); }
    this.state = null; this.foe = null;
  }
}

const sameCell = (a, b) => (!a && !b) || (!!a && !!b && a.x === b.x && a.y === b.y);
const dirOf = (a, b) => (b.x > a.x ? 'E' : b.x < a.x ? 'W' : b.y > a.y ? 'S' : 'N');
