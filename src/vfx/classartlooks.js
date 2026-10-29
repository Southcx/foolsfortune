// ---------------------------------------------------------------------------------------
// THE CLASS ARTS' LOOKS: Petra's class arts in play (courier/classarts/body.js; Dovina's rules, progress/classarts.js) played as the
// library's effects (vfx/library/classarts/: each art its domain's grammar in its suit's colour, weighed by its rank; docs/plans/art/
// VFX-LIBRARY.md 4). It builds nothing of its own: it says which effect, where, and for how long.
//   art.use { art }      `art.<id>.use` at the act; an art that lasts also `art.<id>.hold`, held while it does (its `does.dur`, Payback's
//                        `within`, or the runtime's own state: Bulwark's brace, Water Walk's time) and let go with an eased fade on
//                        `art.end` or when its time is out; an art with a second place also `art.<id>.mark` there (Prospect, Veil)
//   art.fire { art }     `art.<id>.fire`, riding the body it fired on (every reaction on `art.react`; Beginner's Luck spent; Payback's return)
//   the armed reactions  `art.<id>.armed` while the runtime holds them ready (game.classArtsRun: Momentum's `momentum`, Steadfast's
//                        `steady`, Running on Empty's `freeUntil`, Beginner's Luck's `luckUntil`), let go with the same fade
// Where: on the event's `target` (a creature: its feet, its dir from the Courier to it) or at its `at` (a point), else at the Courier facing
// their heading; `from` and `to` (the Courier's chest to the place, or along their heading at the art's reach) are the line its motes run.
// The context: { suit (the art's class's: a court's from its id, a Major's progress/spreads.js MAJOR_SUIT), domain, tint, power and scale
// (an accented art a little bigger, its reach x ACCENT.k) }. Steadfast's turned blow (`vessel.ward`) is its `art.steadfast.fire`, one look.
// Looks only, no words (world marks: CLAUDE.md, Feedback); hidden in the god hand, the Spirit Garden and a puzzle duel.
//
// Prior art: Final Fantasy Tactics' action and reaction abilities (Square, 1997: a reaction announces itself), FFXIV's status loops (a held
// buff's look runs while the status lasts and eases out at its end), Unreal's Niagara component lifetimes (a system attached to its owner,
// deactivated to let its particles finish).
//
//   game.classArtLooks = new ClassArtLooks(game)   (boot/pneuka.js)   .update(dt) each frame (boot/frame.js)   artSuit(id) -> a suit or 'wild'
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CLASS_ARTS, ACCENT } from '../progress/classarts.js';
import { MAJOR_SUIT } from '../progress/spreads.js';
import { SUIT_LOOK } from './readingview.js';
import { ART_DOMAIN } from './library/classarts/index.js';

/** An art's suit: a court's from its class id (page.wands), a Major's from MAJOR_SUIT (a wild one the film's 'wild'). */
export const artSuit = (id) => { const [a, b] = (CLASS_ARTS[id]?.cls ?? 'arcana.fool').split('.'); return a === 'arcana' ? MAJOR_SUIT[b] ?? 'wild' : b; };

/** The reactions the runtime holds ready, read from game.classArtsRun each frame. */
const ARMED = {
  momentum: (run) => !!run.momentum,
  steadfast: (run) => !!run.steady,
  zero: (run) => run.freeUntil >= 0 && run.now < run.freeUntil,
  beginnersLuck: (run) => run.luckUntil >= 0 && run.now <= run.luckUntil,
};
/** The held actions whose time the runtime keeps itself (the rest are held for their numbers' `dur`). */
const HELD_STATE = {
  bulwark: (run) => run.now < run.braceUntil,
  wade: (run) => (run.mgr?.get?.('waterwalk')?.left ?? 0) > 0,
};
const FADE = 0.35;   // a held effect's eased fade (real s)
const CHEST = 1.1;   // the height a line runs at (m)
const SIZED = ['reach', 'dist', 'width'];
const smooth = (u) => u * u * (3 - 2 * u);

export class ClassArtLooks {
  constructor(game) {
    this.game = game; this.t = 0;
    this.holds = new Map(); this.armed = new Map(); // (art id -> { id, h, until, anchor, aim, fading, map })
    const E = game.events, mine = (e) => (e?.by ?? 'courier') === 'courier';
    E?.on?.('art.use', (e) => { if (mine(e)) this.use(e); });
    E?.on?.('art.fire', (e) => { if (mine(e)) this.fire(e); });
    E?.on?.('art.end', (e) => { this.let(this.holds.get(e?.art)); this.let(this.armed.get(e?.art)); });
  }

  shown() { const g = this.game; return !!g.player && !g.god?.controlling && !g.realm?.active && !g.duel?.active; }
  has(name) { return !!this.game.vfx?.lib?.[name]; }
  /** An art's numbers as the runtime reads them (the worn one's accented for the class read now), else its row. */
  numbers(id) {
    for (const slot of ['action', 'reaction']) { const n = this.game.classArts?.numbers?.(slot); if (n?.id === id) return n; }
    const R = CLASS_ARTS[id]; return R ? { id, ...R, accented: false } : null;
  }

  /** Where an art plays: on its target's body or at its point (`here: true` keeps it at the Courier, facing the place), else at the Courier;
   *  its dir from the Courier toward the place, or their heading; the line its motes run, chest to chest. `anchor()` says where it is now. */
  place(e, R, here = false) {
    const P = this.game.player, me = P.renderPos ?? P.pos, tgt = e?.target?.pos ? e.target : null, at = tgt ? tgt.pos : e?.at ?? null;
    const dir = new THREE.Vector3();
    if (at) dir.set(at.x - me.x, 0, at.z - me.z);
    if (dir.lengthSq() < 1e-4) P.forward?.(dir);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize();
    const reach = R?.does?.dist ?? R?.does?.reach ?? 3, from = new THREE.Vector3(me.x, me.y + CHEST, me.z);
    const to = tgt ? new THREE.Vector3(tgt.pos.x, tgt.pos.y + (tgt.height ?? 1.6) * 0.6, tgt.pos.z) : at ? new THREE.Vector3(at.x, at.y + CHEST, at.z) : from.clone().addScaledVector(dir, reach);
    const onCourier = here || !at, pos = onCourier ? new THREE.Vector3(me.x, me.y, me.z) : new THREE.Vector3(at.x, at.y, at.z);
    const anchor = onCourier ? () => P.renderPos ?? P.pos : tgt ? () => (tgt.alive === false ? null : tgt.pos) : null;
    return { pos, dir, from, to, anchor, tgt, at };
  }
  /** The context an art's effect is played with. */
  ctx(id, R, pl, accented) {
    const suit = artSuit(id), sized = accented && SIZED.some((k) => R?.does?.[k] != null);
    return { pos: pl.pos, dir: pl.dir, normal: new THREE.Vector3(0, 1, 0), from: pl.from, to: pl.to, floor: pl.pos.y, suit, domain: ART_DOMAIN[id], tint: SUIT_LOOK[suit] ?? 0xd8c8ff,
      power: accented ? 1.2 : 1, scale: sized ? ACCENT.k : 1 };
  }
  /** Each frame: the effect kept on its anchor and turned (a Courier's to their heading, a target's from the Courier to it), and its fade. */
  follow(rec, h, raw) {
    if (rec.fading >= 0) { rec.fading += raw; const u = Math.min(1, rec.fading / FADE); h.k = 1 - smooth(u); if (u >= 1) { if (rec.map?.get(rec.id) === rec) rec.map.delete(rec.id); return false; } }
    if (!rec.anchor) return true;
    const p = rec.anchor(); if (!p) { this.let(rec); return true; }
    h.pos.set(p.x, p.y, p.z);
    const P = this.game.player;
    if (rec.aim && P) { const me = P.renderPos ?? P.pos; h.dir.set(p.x - me.x, 0, p.z - me.z); if (h.dir.lengthSq() > 1e-4) h.dir.normalize(); else P.forward?.(h.dir); }
    else P?.forward?.(h.dir);
    return true;
  }
  /** Play an effect; `rec` (a held one's) keeps it on its anchor and fades it out when let go. */
  play(name, ctx, rec = null) {
    if (!this.has(name)) return null;
    if (rec) return this.game.vfx.play(name, { ...ctx, follow: (h, raw) => this.follow(rec, h, raw) });
    return this.game.vfx.play(name, ctx);
  }
  /** Hold an effect (`map` the holds or the armed), the one it replaces let go. */
  hold(map, id, name, ctx, pl, until) {
    this.let(map.get(id));
    const rec = { id, until, anchor: pl.anchor, aim: !!pl.tgt, fading: -1, map };
    rec.h = this.play(name, ctx, rec);
    if (rec.h) map.set(id, rec);
    return rec;
  }
  /** Let a held effect go: its eased fade, then its stop. */
  let(rec) { if (rec && rec.fading < 0) rec.fading = 0; }

  use(e) {
    const id = e.art; if (!CLASS_ARTS[id] || !this.shown()) return;
    const R = this.numbers(id), marked = this.has(`art.${id}.mark`) && !!(e.target?.pos || e.at), pl = this.place(e, R, marked), ctx = this.ctx(id, R, pl, !!(e.accented ?? R?.accented));
    this.play(`art.${id}.use`, ctx);
    if (marked) { const at = this.place(e, R); this.play(`art.${id}.mark`, { ...ctx, pos: at.pos, floor: at.pos.y }); }
    if (this.has(`art.${id}.hold`)) this.hold(this.holds, id, `art.${id}.hold`, ctx, pl, this.t + (R?.does?.dur ?? R?.does?.within ?? 3));
  }
  fire(e) {
    const id = e.art; if (!CLASS_ARTS[id] || !this.shown()) return;
    const R = this.numbers(id), pl = this.place(e, R), ctx = this.ctx(id, R, pl, !!(e.accented ?? R?.accented));
    this.play(`art.${id}.fire`, ctx, { id, anchor: pl.anchor, aim: !!pl.tgt, fading: -1 }); // (riding its body for its life)
  }

  update(dt) {
    dt = Math.min(0.1, dt || 0); this.t += dt;
    const run = this.game.classArtsRun, shown = this.shown();
    for (const rec of this.holds.values()) { const st = HELD_STATE[rec.id]; if (!shown || !(st && run ? st(run) : this.t < rec.until)) this.let(rec); }
    for (const [id, test] of Object.entries(ARMED)) {
      const on = shown && !!run && test(run), rec = this.armed.get(id);
      if (on && (!rec || rec.fading >= 0)) { const R = this.numbers(id), pl = this.place(null, R); this.hold(this.armed, id, `art.${id}.armed`, this.ctx(id, R, pl, !!R?.accented), pl, Infinity); }
      else if (!on && rec) this.let(rec);
    }
  }
}
