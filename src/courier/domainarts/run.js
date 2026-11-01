// ---------------------------------------------------------------------------------------
// A DOMAIN'S RUNGS IN PLAY (docs/plans/DOMAINS.md 16, 17; the rules Dovina's, progress/domainarts.js): the runtime of the seven first
// relations (each domain's at level 15).
// Each rung is a modifier with a source you can see (DESIGN.md 22), drawn in its domain's own grammar from the library
// (vfx/library/domains.js, Calissa's: Ouranurgy falls from above, Manifestation grows up and crystallises, Divination sweeps flat,
// Psychokinesis throws out, Possession draws in, Alteration sweeps a band, Spellscription writes), so a rung reads as its domain at a
// glance. A passive or reaction works only while it holds one of the psyche's notches (domainArts.on); with none on, this does nothing.
//   Postpone          a blow past the shield is held DELAY real s (the turning hoops over you), then lands on the clay at the region it
//                     was bound for, past every gate; a blow parried (a real foe's) inside halves it
//   Plating           the action: 20 of the pool set solid over the region facing the nearest foe (its max held off: the tube shows
//                     it), taking 0.85 of that region's next crack, never a crack that would shatter; melts back at 15 after 30 real s
//   The Watch         a Figment within reach whose head is down shows the iris over it while it stays down a beat or more, a ping as
//                     its head comes up (its bouts: progress/stealth.js vigilAt, which never lies)
//   Shatter           a Figment whose stun is past (1 - shatter) of full glows (the shockwave's rim over it); a Courier's blow of
//                     power 2 or more on it then breaks it at once (the stun filled: SUBSTRATE.md F5b, Sekiro's deathblow)
//   Receptivity       with the Veritome in the hands, a mind in its best band of agitation shows open (the tethers drawn round it);
//                     reprogramming may start on it without a stun (mayReprogram)
//   Re-type           the action: 20 real s of blows as the nearest creature's weakness if you know its kind, else the next type in turn
//   A standing rule   when (you parry / stun / down / blink), then (your sub's verb / main and sub swapped), for 5 of the pool, at
//                     most once in 3 real s
// The hooks the vessel, the strike, the art key and reprogramming ask (each a line in its own file, Petra's: docs/handoffs/petra/
// 2026-11-01-from-dovina-domain-hooks.md) are the methods below; what needs no hook (the crack to come, Receptivity's mark, the rule,
// Postpone's parry and landing, the plate's melt) runs from update().
//
// Prior art: FFXIV's Doom (a debt that lands late and can be answered: Postpone), Hollow Knight's Baldur Shell (a shell that takes the
// blows meant for you: Plating), Metal Gear Solid's vision cones and Hitman's instinct (the Watch), Sekiro's deathblow and Smash's KO power (Shatter), Shin Megami Tensei's
// negotiation (an open mind), Pokemon's Soak (Re-type), Final Fantasy XII's Gambits (a standing rule); the class arts' runtime
// (courier/classarts/body.js, Petra's: the same hook points, so the two never fight).
//
//   game.domainArtsRun = new DomainArtsRun(game)   .update(dt)
//   hooks: .defer({ point, from, dir, k, why, by }) -> bool (Postpone: true, the blow is held)   .plate(region, k) -> k left (0: plated)
//          .onStrike(c, cause, type, power) -> { type? } | null   .press(R) (a domain's worn action on the art key)
//          .mayReprogram(c) -> bool (Receptivity: an open mind, no stun needed)   .openMind(c) -> bool
//   events: domain.art.fire { art, ...what, by }, domain.art.end { art, why, by }, domain.art.refuse { art, why, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DOMAIN_ARTS, RULE_WHEN, shatterOf } from '../../progress/domainarts.js';
import { typeWeaknessOf } from '../../progress/combat/constitution.js';
import { familiarityOf } from '../../progress/familiarity.js';
import { TYPES } from '../../progress/combat/types.js';
import { EMO } from '../../progress/combat/emo.js';
import { REGIONS } from '../vessel/damage.js';
import { BREAK_AT } from '../../progress/combat/vessel.js'; // (the vessel's one rule's line: SUBSTRATE.md F1)

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** Ours: the Watch shows a head kept down WATCH_MIN real s or more (a shorter one is no time to move); Shatter's glow shows on at most
 *  SHATTER_SHOWN creatures within SHATTER_R m; Receptivity looks this far (m) while the Veritome is drawn; Postpone counts a parry only of
 *  a blow from a real foe (never Strawman's). */
const WATCH_MIN = 1, SHATTER_SHOWN = 3, SHATTER_R = 14, RECEPTIVE_R = 30;
const TYPE_ORDER = Object.keys(TYPES);

export class DomainArtsRun {
  constructor(game) {
    this.game = game; this.now = 0;
    this.held = null; // (Postpone's blow: { blow, at, parried, h })
    this.plateOn = null; // (Plating: { region, until, h })
    this.retypeOn = null; // (Re-type: { type, until, n, weak })
    this.shown = new Map(); // (the Watch: creature -> h)
    this.near = new Map(); // (Shatter's glow: creature -> h)
    this.marked = new Map(); // (Receptivity: creature -> h)
    this.saidShatter = new WeakMap(); this.ruleAt = -99; this.wasLow = false;
    const on = (n, fn) => game.events?.on?.(n, fn);
    on('move.parry', (e) => { if ((e.by ?? 'courier') === 'courier' && e.what === 'blow' && !e.training) this.parried(); });
    for (const [id, W] of Object.entries(RULE_WHEN)) if (W.event) on(W.event, (e) => { if (W.test(e)) this.rule(id); });
    on('photo.take', (e) => { if (e.candid === 'candid' && this.on('watch') && this.shown.size) this.arts?.used('watch', 0.9); }); // (the watch read, the plate taken unseen)
  }
  get arts() { return this.game.domainArts; }
  open(id) { return !!this.arts?.open?.(id); }
  /** Working now: a passive or reaction holding a notch, an action worn (domainArts.on). */
  on(id) { return !!this.arts?.on?.(id); }
  does(id) { return DOMAIN_ARTS[id].does; }
  fire(art, more = {}) { this.game.events?.emit('domain.art.fire', { art, ...more, by: 'courier' }); }
  play(name, ctx) { return this.game.vfx?.play?.(name, ctx) || null; }
  /** Where a region of the vessel is in the world now (its first capsule's middle), for a look to sit on. */
  regionAt(region, out) {
    const B = this.game.vesselDamage?.boxes, P = this.game.player;
    const c = B?.refresh?.()?.caps?.find((x) => x.region === region);
    return c ? out.copy(c.p0).lerp(c.p1, 0.5) : out.set(P.pos.x, P.pos.y + 1.1, P.pos.z);
  }
  /** The region a blow from `from` would land on (the vessel's own raycast: damage.js hit's, so the mark and the blow never disagree). */
  regionFrom(from) {
    const B = this.game.vesselDamage?.boxes, P = this.game.player; if (!B || !from) return 1;
    const mid = _a.set(P.pos.x, P.pos.y + 1.0, P.pos.z), o = _b.copy(from).setY(Math.max(from.y + 0.4, P.pos.y + 0.3));
    return B.raycast(o, mid.clone().sub(o).normalize()).region;
  }
  nearestFoe(r = 20) {
    const P = this.game.player; let best = null, bd = r;
    for (const c of this.game.creatures?.list || []) { if (!c.alive || c.ally || c.training) continue; const d = c.pos.distanceTo(P.pos); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  // ---- Postpone (Ouranurgy 15) ------------------------------------------------
  defer(blow) {
    if (!this.on('postpone') || blow?.postponed || (blow?.by ?? 'creature') === 'courier' || this.held || this.game.death?.active) return false;
    const P = this.game.player, D = this.does('postpone');
    const B = this.game.vesselDamage?.boxes, region = blow.point && B ? B.nearest(blow.point).region : this.regionFrom(blow.from); // (bound for: it lands there)
    const h = this.play('domain.ouranurgy.hold', { pos: P.pos.clone().add(UP), follow: (hh) => { hh.pos.set(P.pos.x, P.pos.y + 1.0, P.pos.z); return true; } });
    this.held = { blow: { ...blow, region }, at: this.now + D.delay, parried: false, h, real: (blow.k || 0) >= 0.4 };
    this.fire('postpone', { k: +(blow.k || 0).toFixed(2), delay: D.delay });
    return true;
  }
  parried() {
    const H = this.held; if (!H || H.parried) return;
    H.parried = true; H.blow.k *= this.does('postpone').parried;
    this.play('domain.ouranurgy.hit', { pos: this.game.player.pos.clone().add(UP) });
    this.fire('postpone', { parried: true });
  }
  land() {
    const H = this.held; this.held = null; H.h?.stop?.();
    this.play('domain.ouranurgy.hit', { pos: this.game.player.pos.clone().add(UP) });
    this.game.vesselDamage?.hit?.({ ...H.blow, postponed: true, past: true }); // (past the shield already: it lands on the clay at its region, past every gate: the hook's `past`)
    this.game.events?.emit('domain.art.end', { art: 'postpone', why: H.parried ? 'parried' : 'landed', by: 'courier' });
    if (H.real) this.arts?.used('postpone', H.parried ? 1 : 0.4); // (a graze held pays nothing: the critic's farm)
  }

  // ---- the art key: Plating (Manifestation 15), Re-type (Alteration 15) -------
  press(R) {
    const id = R?.id, g = this.game;
    if (!DOMAIN_ARTS[id] || !this.open(id)) return this.refuse(id, 'closed');
    if ((this.coolUntil?.[id] ?? 0) > this.now) return this.refuse(id, 'cool');
    const A = DOMAIN_ARTS[id];
    if (A.cost && !g.lachryma?.spend?.(A.cost, 'art')) return this.refuse(id, 'pool');
    const ok = id === 'plating' ? this.platingGo() : id === 'retype' ? this.retypeGo() : false;
    if (!ok) { if (A.cost) g.lachryma?.gain?.(A.cost, 'refund'); return false; }
    if (id !== 'plating') (this.coolUntil ||= {})[id] = this.now + (A.cooldown || 0); // (Plating's cooldown runs from its end: unplate)
    g.events?.emit('art.use', { art: id, kind: 'action', domain: A.domain, accented: false, by: 'courier' });
    return true;
  }
  refuse(art, why) { this.game.events?.emit('domain.art.refuse', { art, why, by: 'courier' }); return false; }

  platingGo() {
    const g = this.game, L = g.lachryma, D = this.does('plating');
    if (this.plateOn) { this.unplate('melt'); return true; } // (pressed again: melted back by choice)
    if (!L || L.value < D.held) return !this.refuse('plating', 'pool');
    L.drain?.(D.held, 'art'); // (the pool's liquid set solid: it leaves the pool and holds its room in the bore)
    const mk = L.baseMax ? L.max / L.baseMax : 1; // (the max's own multiplier, Willpower's: the bonus is taken before it, so 20 held reads 20)
    L.addModifier?.('domain.plating', { maxBonus: -D.held / Math.max(0.01, mk), source: 'Plating' });
    const foe = this.nearestFoe(), region = foe ? this.regionFrom(foe.pos) : 1, at = this.regionAt(region, new THREE.Vector3());
    this.play('domain.manifestation.cast', { pos: at.clone() });
    const h = this.play('domain.manifestation.hold', { pos: at.clone(), scale: 0.5, follow: (hh) => { this.regionAt(region, hh.pos); return true; } });
    this.plateOn = { region, until: this.now + D.dur, h };
    this.fire('plating', { region: REGIONS[region] });
    return true;
  }
  plate(region, k) {
    const P = this.plateOn, V = this.game.vesselDamage; if (!P || P.region !== region || !(k > 0)) return k;
    const crack = V?.crack, sum = crack ? Array.from(crack).reduce((a, x) => a + x, 0) : 0;
    if (crack && (crack[region] >= 0.95 || sum + k * 0.65 >= BREAK_AT)) return k; // (never a crack that would shatter: that is Rebirth's, a class's art)
    this.play('domain.manifestation.hit', { pos: this.regionAt(region, new THREE.Vector3()) });
    this.unplate('struck');
    return k * (1 - this.does('plating').takes);
  }
  unplate(why) {
    const P = this.plateOn, L = this.game.lachryma, D = this.does('plating'); if (!P) return;
    this.plateOn = null; P.h?.stop?.(); L?.removeModifier?.('domain.plating');
    if (why !== 'struck') L?.gain?.(D.back, 'art'); // (melted back: the liquid returns, less the change of state)
    this.game.events?.emit('domain.art.end', { art: 'plating', why, region: REGIONS[P.region], by: 'courier' });
    (this.coolUntil ||= {}).plating = this.now + (DOMAIN_ARTS.plating.cooldown || 0); // (from its end: never armour kept up)
    this.arts?.used('plating', why === 'struck' ? 1 : 0.3);
  }

  retypeGo() {
    const D = this.does('retype'), foe = this.nearestFoe(D.reach), L = this.game.ledger;
    const known = foe && familiarityOf(L, foe.kind).level >= D.knows ? typeWeaknessOf(foe.kind) : null; // (knowing the kind is the skill: Divination's and the Veritome's)
    const type = known || TYPE_ORDER[(TYPE_ORDER.indexOf(this.lastRetype) + 1) % TYPE_ORDER.length]; // (else the next type in turn: you learn the chart by the hits)
    this.lastRetype = type;
    this.retypeOn = { type, until: this.now + D.dur, n: 0, weak: 0, known: !!known };
    this.play('domain.alteration.cast', { pos: this.game.player.pos.clone().add(UP) });
    this.fire('retype', { type, kind: foe?.kind ?? null, known: !!known });
    return true;
  }

  // ---- the strike: Re-type's type, Shatter's break --------------------------
  onStrike(c, cause, type, power) {
    let out = null;
    const R = this.retypeOn;
    if (R && this.now < R.until && type !== R.type) {
      out = { type: R.type }; R.n++; if (typeWeaknessOf(c.kind) === R.type) R.weak++;
      if (c.pos) this.play('domain.alteration.hit', { pos: c.pos.clone().add(UP) });
    }
    const S = DOMAIN_ARTS.shatter, st = this.game.stun;
    if (this.on('shatter') && power >= S.does.minPower && st && !c.training && this.inRange(c)) {
      const sh = this.shatterNow(), poise = c.poise ?? 1, left = (1 - st.meter(c)) * poise;
      queueMicrotask(() => { if (c.alive && !st.stunned(c)) st.add(c, left + 0.01, { by: 'courier', cause: 'shatter' }); }); // (after the blow's own build: the shell broken at once)
      if (c.pos) this.play('domain.psychokinesis.hit', { pos: c.pos.clone().add(UP), power: 2 });
      this.fire('shatter', { kind: c.kind, shatter: +sh.toFixed(2) });
      this.arts?.used('shatter', Math.min(1, power / 4));
    }
    return out;
  }

  shatterNow() { return shatterOf(this.game.psyche?.level?.('psychokinesis') ?? 15); }
  /** A shell near breaking: its stun past (1 - shatter) of full, not already down. */
  inRange(c) { const st = this.game.stun; return !!st && c?.alive && !st.stunned(c) && st.meter(c) >= 1 - this.shatterNow(); }

  // ---- Receptivity (Possession 15) --------------------------------------------
  /** Open: its agitation in the band where its Lachryma yields most (combat/emo.js EMO.optimal), never merely stunned. */
  openMind(c) { const e = c?.emo ?? 0; return !!c?.alive && e >= EMO.optimal[0] && e <= EMO.optimal[1]; }
  /** May reprogramming begin on it without a stun (reprogram.js asks beside its stunned test): Receptivity on and the mind open. */
  mayReprogram(c) { const ok = this.on('receptivity') && this.openMind(c) && !this.game.stun?.stunned?.(c); if (ok) this.arts?.used('receptivity', 0.9); return ok; }

  // ---- A standing rule (Spellscription 15) --------------------------------------
  rule(when) {
    const A = this.arts, D = this.does('standingRule'); if (!this.on('standingRule') || A?.rule?.when !== when) return;
    if (this.now - this.ruleAt < D.every) return;
    const g = this.game, B = g.belt; let did = false;
    if (!g.lachryma?.spend?.(D.cost, 'art')) return; // (a rule costs: written conditions are never free)
    if (A.rule.then === 'lend') { const t = B?.get?.(B.sub); did = !!t?.lend?.(); if (did) g.events?.emit('tool.lend', { tool: t.id, main: B.main, by: 'courier', rule: true }); }
    else if (A.rule.then === 'swap') { if (B?.swap) { B.swap(); did = true; } }
    if (!did) { g.lachryma?.gain?.(D.cost, 'refund'); return; }
    this.ruleAt = this.now;
    this.play('domain.spellscription.cast', { pos: g.player.pos.clone(), scale: 0.6 });
    this.fire('standingRule', { when, then: A.rule.then });
    A.used('standingRule', 0.7);
  }

  // ---- each frame ----------------------------------------------------------------
  update(dt) {
    this.now += dt;
    const g = this.game, P = g.player; if (!P || !this.arts) return;
    if (this.held && this.now >= this.held.at) this.land();
    if (this.plateOn && this.now >= this.plateOn.until) this.unplate('melt');
    if (this.retypeOn && this.now >= this.retypeOn.until) {
      const R = this.retypeOn; this.retypeOn = null;
      g.events?.emit('domain.art.end', { art: 'retype', why: 'time', by: 'courier' });
      this.arts.used('retype', R.n ? (R.known ? 0.5 : 0.4 + 0.6 * (R.weak / R.n)) : 0.2); // (a weakness found by trying pays most; one read off what you knew, middling)
    }
    this.watch();
    this.shatterGlow();
    this.receptivity();
  }

  /** The Watch: the iris over each Figment within reach whose head is down for WATCH_MIN real s or more; a ping as it comes up. */
  watch() {
    const g = this.game, P = g.player, keep = new Set();
    if (this.on('watch') && !g.god?.active) {
      for (const c of g.creatures?.near?.(P.pos, this.does('watch').reach) || []) {
        const V = c.vigil; if (!V || !c.alive || c.ally || c.training) continue;
        const down = !V.up && (V.left ?? 0) >= WATCH_MIN;
        if (down) { if (!this.shown.has(c)) this.shown.set(c, this.play('domain.divination.hold', { pos: c.pos.clone().add(UP), scale: 0.35, follow: (hh) => { hh.pos.set(c.pos.x, c.pos.y + 1.4, c.pos.z); return c.alive; } })); keep.add(c); }
        else if (V.up && this.shown.has(c)) this.play('domain.divination.hit', { pos: c.pos.clone().add(UP), scale: 0.5 }); // (its head up: the ping)
      }
    }
    for (const [c, h] of this.shown) if (!keep.has(c)) { h?.stop?.(); this.shown.delete(c); }
  }

  /** Shatter's glow: the nearest few shells near breaking wear the shockwave's rim until they break or ease. */
  shatterGlow() {
    const g = this.game, P = g.player, keep = new Set();
    if (this.on('shatter')) {
      let n = 0;
      for (const c of g.creatures?.near?.(P.pos, SHATTER_R) || []) {
        if (n >= SHATTER_SHOWN || c.ally || c.training || !this.inRange(c)) continue;
        n++; keep.add(c);
        if (!this.near.has(c)) this.near.set(c, this.play('domain.psychokinesis.hold', { pos: c.pos.clone().add(UP), scale: 0.45, follow: (hh) => { hh.pos.set(c.pos.x, c.pos.y + 0.8, c.pos.z); return c.alive; } }));
      }
    }
    for (const [c, h] of this.near) if (!keep.has(c)) { h?.stop?.(); this.near.delete(c); }
  }

  receptivity() {
    const g = this.game, P = g.player, keep = new Set();
    if (this.on('receptivity') && g.belt?.inHand?.id === 'veritome') {
      for (const c of g.creatures?.list || []) {
        if (!c.alive || c.ally || c.pos.distanceTo(P.pos) > RECEPTIVE_R || !this.openMind(c)) continue;
        if (!this.marked.has(c)) this.marked.set(c, this.play('domain.possession.hold', { pos: c.pos.clone().add(UP), scale: 0.5, follow: (hh) => { hh.pos.set(c.pos.x, c.pos.y + 1, c.pos.z); return c.alive; } }));
        keep.add(c);
      }
    }
    for (const [c, h] of this.marked) if (!keep.has(c)) { h?.stop?.(); this.marked.delete(c); }
  }
}
