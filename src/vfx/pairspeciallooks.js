// ---------------------------------------------------------------------------------------
// A PAIR SPECIAL'S LOOK: Petra's pair specials in play (tools/pairspecials.js, `game.pairSpecials`; Dovina's rules, progress/toolpairs.js
// PAIR_SPECIALS) played as the library's effects (vfx/library/pairspecials/: the main tool's grammar braided with the sub's, in their two
// suits' colours, at a King's weight). It builds nothing of its own: it says which effect, where, and for how long.
//   pair.special { pair }   `pair.<n>.use` at the act; a special that lasts also `pair.<n>.hold`, held while it does (its `dur`, the
//                           plan's below, or the runtime's own state) and let go with an eased fade; a special whose landing is its act
//                           (`land`) also `pair.<n>.hit` there
//   pair.hit { pair }       `pair.<n>.hit` where it lands      pair.mark { pair }  `pair.<n>.mark` on its thing (held while it is shown)
//   pair.end { pair }       its holds and marks let go
// Where: on the event's `target` (a creature: its feet, its dir from the Courier to it) or at its `at` (a point), else at the Courier facing
// their heading; `from` and `to` (the Courier's chest to the place, or the event's own) are the line its streaks run; `other` a second
// creature (Chain Shot's), `feeling` the paint's or the weather's, `power` its strength, `dur` how long it holds. The context: { suit (the
// main's), tint (the sub's colour), feeling, power }.
// Wave 1, read from the runtime's own state (its events carry no place yet):
//   XIX The Mark      .use on the creature the lent Flash marked (pairSpecials.mark), .mark held on it while the mark holds (its strength
//                     the rounds left), .hit on `shot.fire` when a round was turned onto it (the rounds fell), its line from the muzzle
//   VI Rung Line      .use the toll's ring run down the hook's line (from the hook's tip to its bite, RUN real s), .hit at its end
//   XVII Painted Lure .use at the fork, .hold riding it while it flies and paints (its floor under it), .mark a stamp's splash where the
//                     paint lands every STAMP real s
//   III Coffin's Mop  .use at the receiver (the coffin's mouth, or the Lachrymato Bottle when the brush wears one), .hold the paint drawn
//                     up into it from the ground being drunk, .mark held on that ground; strong while there is paint there
// Looks only, no words (world marks: CLAUDE.md, Feedback); hidden in the god hand, the Spirit Garden and a puzzle duel.
//
// Prior art: vfx/classartlooks.js (the same placement and the held fade); FFXIV's status loops (a held look runs while its state lasts and
// eases out at its end); Unreal's Niagara component lifetimes (a system attached to its owner, deactivated to let its particles finish).
//
//   game.pairSpecialLooks = new PairSpecialLooks(game)   (boot/pneuka.js)   .update(dt) each frame (boot/frame.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { specialVerbs } from '../progress/toolpairs.js';
import { TOOL_SUIT } from '../progress/spreads.js';
import { SUIT_LOOK } from './readingview.js';

const CHEST = 1.1;   // the height a line runs at (m)
const FADE = 0.35;   // a held look's eased fade (real s)
const RUN = 0.24;    // the Rung Line's ring, from the hand to the bite (real s)
const STAMP = 0.14;  // a Painted Lure stamp's splash, one every (real s: about every other stamp of the runtime's 0.06)
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const smooth = (u) => u * u * (3 - 2 * u);
const _a = new THREE.Vector3(), _f = new THREE.Vector3();

/** Each special's places and lives, for the waves still to come (the runtime's `dur` wins): `use` where its act plays ('target' on the
 *  event's target or point, 'coffin' at the coffin's mouth; else at the Courier), `holdOn` where its hold rides ('target'; else the
 *  Courier), `hold` its life (real s), `mark` a mark's life, `through` its marks seen through walls, `land` its landing played with its act
 *  ('target' or 'courier', `landAt` real s after). */
export const PLAN = {
  1: { holdOn: 'target', hold: 0.8 },   // the haul's wake, while it is dragged
  2: { mark: 4, through: true },        // a hidden signature shown and tagged
  4: { hold: 3.2 },                     // the beat kept while the six go
  7: { hold: 0.9 },                     // flung through the air
  9: { land: 'target' },                // the sigil written as it is photographed
  10: { land: 'courier', landAt: 0.6 }, // the weather turned as the wheel lands
  12: { holdOn: 'target', hold: 1.5 },  // held still in time
  13: { use: 'coffin', land: 'target' },// drunk into the coffin from what it downed
  14: { use: 'target' },                // at the paint laid on the beat
  15: { holdOn: 'target', hold: 4 },    // the chain between two
  16: { mark: 0.6 },                    // the bolt gathering on the fork
  18: { holdOn: 'target', hold: 6 },    // the singing decoy
};

/** A special's colours for its context: its main's suit, and the sub's colour (a sprite's 'tint'). */
function sidesOf(n) {
  const v = specialVerbs(n); if (!v) return { suit: 'wands', tint: 0xd8c8ff };
  return { suit: TOOL_SUIT[v.main[0]], tint: SUIT_LOOK[TOOL_SUIT[v.sub[0]]] ?? 0xd8c8ff };
}

export class PairSpecialLooks {
  constructor(game) {
    this.game = game; this.t = 0; this.n = 0;
    this.holds = new Map(); this.later = [];
    const E = game.events, mine = (e) => (e?.by ?? 'courier') === 'courier';
    E?.on?.('pair.special', (e) => { if (mine(e)) this.special(e); });
    E?.on?.('pair.hit', (e) => { if (mine(e)) this.hit(e); });
    E?.on?.('pair.mark', (e) => { if (mine(e) && e.pair != null) this.mark(e); });
    E?.on?.('pair.end', (e) => { for (const rec of this.holds.values()) if (rec.n === e?.pair) this.let(rec); });
    E?.on?.('shot.fire', (e) => this.homed(e));
  }

  shown() { const g = this.game; return !!g.player && !g.god?.controlling && !g.realm?.active && !g.duel?.active; }
  has(name) { return !!this.game.vfx?.lib?.[name]; }
  get me() { const P = this.game.player; return P.renderPos ?? P.pos; }
  chest(out = new THREE.Vector3()) { const m = this.me; return out.set(m.x, m.y + CHEST, m.z); }
  feeling(e) { const g = this.game; return e?.feeling ?? g.techs?.get?.('soulbrush')?.load?.aspect ?? g.weather?.here?.(this.me)?.aspect ?? 'wonder'; }

  /** Where a look plays: on the event's target (its feet) or at its point, or at the Courier (`on` 'courier', or no place given); its dir
   *  from the Courier toward the place, or their heading; the line its streaks run, chest to chest (or the event's own `from`, `to`). */
  place(e, on = 'target') {
    const P = this.game.player, me = this.me, tgt = e?.target?.pos ? e.target : null, at = tgt ? tgt.pos : e?.at ?? null;
    const dir = new THREE.Vector3();
    if (at) dir.set(at.x - me.x, 0, at.z - me.z);
    if (dir.lengthSq() < 1e-4) P.forward?.(dir);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize();
    const from = e?.from?.isVector3 ? e.from.clone() : this.chest();
    const to = e?.to?.isVector3 ? e.to.clone() : tgt ? new THREE.Vector3(tgt.pos.x, tgt.pos.y + (tgt.height ?? 1.6) * 0.6, tgt.pos.z)
      : at ? new THREE.Vector3(at.x, at.y + CHEST, at.z) : from.clone().addScaledVector(dir, 4);
    const onCourier = on === 'courier' || !at, pos = onCourier ? me.clone() : new THREE.Vector3(at.x, at.y, at.z);
    const anchor = onCourier ? () => this.me : tgt ? () => (tgt.alive === false ? null : tgt.pos) : null;
    return { pos, dir, from, to, anchor, tgt, aim: !onCourier && !!tgt };
  }
  /** The context a special's effect is played with. */
  ctx(n, pl, e = null) {
    const S = sidesOf(n);
    return { pos: pl.pos, dir: pl.dir, normal: UP.clone(), from: pl.from, to: pl.to, floor: pl.pos.y, suit: S.suit, tint: S.tint, feeling: this.feeling(e), power: e?.power ?? 1 };
  }

  /** Each frame a held look rides its anchor (a creature's turned from the Courier to it, the Courier's to their heading, or its own `dir`),
   *  is weighed by its `k`, ticks its own extra, and fades out once let go. */
  follow(rec, h, raw) {
    let k = 1;
    if (rec.fading >= 0) { rec.fading += raw; const u = Math.min(1, rec.fading / FADE); k = 1 - smooth(u); if (u >= 1) { if (this.holds.get(rec.key) === rec) this.holds.delete(rec.key); return false; } }
    if (rec.anchor) {
      const p = rec.anchor();
      if (!p) { this.let(rec); return true; }
      h.pos.set(p.x, p.y, p.z);
      const P = this.game.player;
      if (rec.dir) rec.dir(h.dir);
      else if (rec.aim && P) { const me = this.me; h.dir.set(p.x - me.x, 0, p.z - me.z); if (h.dir.lengthSq() > 1e-4) h.dir.normalize(); else P.forward?.(h.dir); }
      else P?.forward?.(h.dir);
    }
    rec.tick?.(h, raw);
    h.k = k * (rec.k ? rec.k() : 1);
    return true;
  }
  play(name, ctx) { return this.has(name) ? this.game.vfx.play(name, ctx) : null; }
  /** Hold a look under `key` (the one it replaces let go): riding `o.anchor`, let go when `o.test` fails or `o.until` passes. */
  hold(key, n, name, ctx, o = {}) {
    if (!this.has(name)) return null;
    this.let(this.holds.get(key));
    const rec = { key, n, until: o.until ?? Infinity, anchor: o.anchor ?? null, aim: !!o.aim, dir: o.dir ?? null, test: o.test ?? null, k: o.k ?? null, tick: o.tick ?? null, fading: -1 };
    rec.h = this.game.vfx.play(name, { ...ctx, follow: (h, raw) => this.follow(rec, h, raw) });
    if (rec.h) this.holds.set(key, rec);
    return rec;
  }
  let(rec) { if (rec && rec.fading < 0) rec.fading = 0; }
  soon(dt, fn) { if (dt > 0) this.later.push({ at: this.t + dt, fn }); else fn(); }

  // ---- the events ---------------------------------------------------------------------------------------------------------------
  special(e) {
    const n = e?.pair; if (!this.shown() || !specialVerbs(n)) return;
    if (n === 19) return this.mark19();
    if (n === 6) return this.rung();
    if (n === 17) return this.lure();
    if (n === 3) return this.mop();
    const plan = PLAN[n] ?? {};
    const useAt = plan.use === 'coffin' ? this.coffinPlace(e) : this.place(e, plan.use === 'target' ? 'target' : 'courier');
    this.play(`pair.${n}.use`, this.ctx(n, useAt, e));
    if (this.has(`pair.${n}.hold`)) {
      const pl = this.place(e, plan.holdOn === 'target' ? 'target' : 'courier'), ctx = this.ctx(n, pl, e), other = e.other?.pos ? e.other : null;
      const P = this.game.player, flung = n === 7;
      this.hold(`${n}:hold`, n, `pair.${n}.hold`, ctx, {
        anchor: pl.anchor, aim: pl.aim, until: this.t + (e.dur ?? plan.hold ?? 3),
        dir: flung ? (d) => { d.copy(P.vel ?? d); if (d.lengthSq() > 1e-4) d.normalize(); else P.forward?.(d); } : null, // (Slingshot's: the way they fly)
        tick: other ? (h) => { if (pl.tgt) h.ctx.from.set(pl.tgt.pos.x, pl.tgt.pos.y + (pl.tgt.height ?? 1.6) * 0.6, pl.tgt.pos.z); h.ctx.to.set(other.pos.x, other.pos.y + (other.height ?? 1.6) * 0.6, other.pos.z); } : null,
      });
    }
    if (plan.land) this.soon(plan.landAt ?? 0, () => { if (this.shown()) this.play(`pair.${n}.hit`, this.ctx(n, this.place(e, plan.land), e)); });
  }
  hit(e) { const n = e?.pair; if (this.shown() && specialVerbs(n)) this.play(`pair.${n}.hit`, this.ctx(n, this.place(e), e)); }
  mark(e) {
    const n = e.pair, name = `pair.${n}.mark`; if (!this.shown() || !this.has(name)) return;
    const pl = this.place(e), ctx = { ...this.ctx(n, pl, e), ...(PLAN[n]?.through ? { throughWalls: true } : {}) }, held = this.game.vfx.lib[name].layers.some((L) => L.dur === Infinity);
    if (!held) { this.play(name, ctx); return; }
    this.hold(`${n}:mark:${e.target?.id ?? ++this.n}`, n, name, ctx, { anchor: pl.anchor, until: this.t + (e.dur ?? PLAN[n]?.mark ?? 3) });
  }

  // ---- XIX The Mark --------------------------------------------------------------------------------------------------------------
  /** The lent Flash marked a creature: its look there, and the mark held on it while the runtime keeps it (its strength the rounds left). */
  mark19() {
    const ps = this.game.pairSpecials, m = ps?.mark, c = m?.c; if (!c?.pos) return;
    const pl = this.place({ target: c }), ctx = this.ctx(19, pl);
    this.play('pair.19.use', ctx);
    const max = Math.max(1, m.rounds), left = () => (ps.mark?.c === c ? ps.mark.rounds : 0);
    const rec = this.hold('19:mark', 19, 'pair.19.mark', ctx, {
      anchor: pl.anchor, aim: true, test: () => ps.mark?.c === c && ps.now <= ps.mark.until, k: () => 0.45 + (0.55 * left()) / max,
    });
    if (rec) { rec.c = c; rec.rounds = m.rounds; }
  }
  /** A psygun round: if the mark's rounds fell, it was turned onto the mark: its landing there, its line from the muzzle. */
  homed(e) {
    const rec = this.holds.get('19:mark'); if (!rec || rec.fading >= 0 || !this.shown()) return;
    const m = this.game.pairSpecials?.mark, left = m && m.c === rec.c ? m.rounds : 0;
    if (left >= rec.rounds) return;
    rec.rounds = left;
    const g = this.game, pl = this.place({ target: rec.c }), from = g.character?.gunPoint?.('muzzle', new THREE.Vector3()) ?? this.chest();
    this.play('pair.19.hit', { ...this.ctx(19, pl), from, to: e?.at?.isVector3 ? e.at.clone() : pl.to, dir: e?.dir?.isVector3 ? e.dir.clone() : pl.dir });
    if (left <= 0) this.let(rec);
  }

  // ---- VI Rung Line ---------------------------------------------------------------------------------------------------------------
  /** The lent toll with the hook bitten: the ring run down the line from the hook's tip to its bite (both ends live while it holds),
   *  and the blow where it arrives. */
  rung() {
    const H = this.game.techs?.get?.('sondelass')?.hookshot, c = H?.att?.ent;
    const pl = this.place(c?.pos ? { target: c } : null), ctx = this.ctx(6, pl);
    const tip = () => (H?.from ? H.from(new THREE.Vector3()) : this.chest()), bite = () => (H?.att && H.attachPoint ? H.attachPoint(new THREE.Vector3()) : pl.to.clone());
    const a0 = tip(), b0 = bite();
    let t = 0;
    this.play('pair.6.use', { ...ctx, pos: a0.clone(), from: a0, to: b0, dir: b0.clone().sub(a0).normalize(), follow: (h, raw) => {
      t += raw; const u = Math.min(1, t / RUN), a = H?.att ? tip() : a0, b = H?.att ? bite() : b0;
      h.pos.lerpVectors(a, b, u * Math.sqrt(u)); // (gathering speed down the line)
      h.dir.subVectors(b, a); if (h.dir.lengthSq() > 1e-6) h.dir.normalize();
      if (u < 1) return true;
      if (this.shown()) this.play('pair.6.hit', this.ctx(6, this.place(c?.pos && c.alive !== false ? { target: c } : { at: b.clone().setY(b.y - CHEST) })));
      return false;
    } });
  }

  // ---- XVII Painted Lure ---------------------------------------------------------------------------------------------------------
  /** The fork painting in flight: the paint let go there, its stream riding the fork while it flies, a splash where the paint lands. */
  lure() {
    const g = this.game, F = g.techs?.get?.('dreamvane')?.fork, ps = g.pairSpecials; if (!F?.pos) return;
    const pl = this.place({ at: F.pos }), ctx = this.ctx(17, pl);
    this.play('pair.17.use', ctx);
    let stampT = 0;
    this.hold('17:hold', 17, 'pair.17.hold', ctx, {
      anchor: () => F.pos, test: () => F.state === 'fly' && !!ps?.lureSaid,
      tick: (h, raw) => { // (the floor under the fork, so its drops land there, and a stamp's splash every STAMP real s)
        const hit = g.physics?.raycast?.(F.pos, DOWN, 8, g.player.collider, undefined, (k) => !k.isSensor());
        h.ctx.floor = hit ? hit.point.y : F.pos.y - 8;
        if (hit && (stampT -= raw) <= 0) { stampT = STAMP; this.play('pair.17.mark', { ...h.ctx, pos: new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z), floor: hit.point.y, follow: null }); }
      },
    });
  }

  // ---- III Coffin's Mop -------------------------------------------------------------------------------------------------------------
  /** Where the hoover's draw is drunk to now: the Lachrymato Bottle at the upper back when the brush wears one, else the coffin's mouth. */
  receiver(out) {
    const g = this.game, LH = g.techs?.get?.('lockheart'), P = g.player, me = this.me;
    if (g.techs?.get?.('soulbrush')?.load?.bottle) return out.copy(me).addScaledVector(P.forward(_f), -0.22).setY(me.y + 1.45);
    if (LH?.mouthAt) return out.copy(LH.mouthAt);
    if (LH?.cof?.group?.parent) return LH.cof.group.getWorldPosition(out);
    return this.chest(out);
  }
  /** The coffin's mouth (Reaper's Draw's drink), its line from what it drinks. */
  coffinPlace(e) {
    const pl = this.place(e, 'courier'), LH = this.game.techs?.get?.('lockheart');
    const mouth = LH?.cof?.group?.parent ? LH.cof.group.getWorldPosition(new THREE.Vector3()) : this.chest();
    return { ...pl, pos: mouth, from: pl.to, to: mouth.clone(), anchor: null };
  }
  /** The hoover drinking paint: the gulp at the receiver, the paint drawn up its line, the ground being drunk; strong while paint is there. */
  mop() {
    const g = this.game, LH = g.techs?.get?.('lockheart'), ps = g.pairSpecials, P = g.player; if (!LH) return;
    const ground = (out) => { const f = LH.aimFlat?.(_f) || P.forward(_f); return out.copy(this.me).addScaledVector(f, 2.4).setY(this.me.y + 0.02); };
    const recv = new THREE.Vector3(), spot = new THREE.Vector3(), mid = new THREE.Vector3();
    let wet = 1, crude = false, aspect = null;
    const read = () => { // (the paint where the hoover drinks: its feeling, crude's film, how much)
      ground(spot); const near = _a.copy(this.me).addScaledVector(_f, 1.5);
      const A = g.paintmap?.at?.(spot.x, spot.y, spot.z), B = g.paintmap?.at?.(near.x, near.y, near.z), C = (A?.k ?? 0) >= (B?.k ?? 0) ? A : B;
      if (C?.k > 0) { aspect = C.aspect ?? aspect; crude = !!C.crude; }
      return Math.min(1, Math.max(A?.k ?? 0, B?.k ?? 0) * 2);
    };
    wet = read();
    const tint = () => (crude ? 0xb49be6 : sidesOf(3).tint);
    const ctx = { ...this.ctx(3, this.place(null, 'courier')), feeling: crude ? undefined : aspect ?? this.feeling(null), tint: tint() };
    const live = () => LH.hoovering && LH.hooverW > 0.5 && !!ps?.mopSaid;
    const k = () => 0.25 + 0.75 * wet, skin = (h) => { h.ctx.feeling = crude ? undefined : aspect ?? h.ctx.feeling; h.ctx.tint = tint(); };
    this.play('pair.3.use', { ...ctx, pos: this.receiver(recv).clone() });
    this.hold('3:hold', 3, 'pair.3.hold', { ...ctx, from: ground(new THREE.Vector3()), to: new THREE.Vector3(), floor: this.me.y }, {
      anchor: () => this.receiver(recv), test: live, k,
      tick: (h, raw) => { // (its line from the ground being drunk, its far share only, so the streaks reach the mouth in their life)
        wet = THREE.MathUtils.damp(wet, read(), 6, raw); skin(h);
        h.ctx.from.copy(spot); h.ctx.to.copy(mid.lerpVectors(spot, recv, 0.45)); h.ctx.floor = this.me.y;
      },
    });
    this.hold('3:mark', 3, 'pair.3.mark', ctx, { anchor: () => ground(spot), test: live, k, tick: skin });
  }

  update(dt) {
    dt = Math.min(0.1, dt || 0); this.t += dt;
    if (this.later.length) { const due = this.later.filter((x) => x.at <= this.t); this.later = this.later.filter((x) => x.at > this.t); for (const x of due) x.fn(); }
    const shown = this.shown();
    for (const rec of this.holds.values()) if (rec.fading < 0 && (!shown || this.t > rec.until || (rec.test && !rec.test()))) this.let(rec);
  }
}
