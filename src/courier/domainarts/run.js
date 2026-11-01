// ---------------------------------------------------------------------------------------
// A DOMAIN'S RUNGS IN PLAY (docs/plans/DOMAINS.md 16, 17; the rules Dovina's, progress/domainarts.js): the runtime of the seven first
// relations (each domain's at level 10).
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
//   events: domain.art.fire { art, ...what, by }, domain.art.end { art, why, by }, domain.art.refuse { art, why, by },
//   domain.makeup { kind, weak, first, by }
// The second relations (level 30, waves 2 and 3): Footholds (the action: a step of Lachrymite under your feet in the air or a stair
// ahead, three at once, never on a timed record), Recall (the action: back to where you stood 3 s ago, by the blink's own forced body), A Body's
// Make-up (a lock-on reads a kind's constitution, which Re-type then knows), A Vow (a thing sworn off for every cost x0.75, broken at a
// crack's stake). Prior art: Overwatch's Tracer (Recall), Outer Wilds (knowledge as progression), Hunter x Hunter's vows.
// Wave 4 (the three on Petra's hooks of 2026-11-01): The Catch (parry.js deflect asks `catch(pr)`: a shot parried with the parry still
// held is held before the chest up to 1.5 real s, then thrown where you aim through parry.js throwBack, x1.5 where it strikes), The Link
// (damage.js asks `share(k, region)`: half a crack struck on the last creature you reprogrammed instead, an Influence blow), Reactions
// (paintmap.js asks `react(was, aspect)` a cell: opposites wiped to bare ground and calm on what stands there, an agate flared as the
// old paint's blow; once a stamp). Prior art: Half-Life 2's gravity gun, Dishonored 2's Domino, Divinity: Original Sin 2's surfaces.
//   hooks: .catch(pr) -> bool   .share(k, region, ctx) -> k kept   .react(was, aspect, x?, z?) -> 'cancel' | aspect | undefined
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { liveMoment } from '../../core/livemoment.js';
import { DOMAIN_ARTS, RULE_WHEN, VOWS, VOW, shatterOf } from '../../progress/domainarts.js';
import { TRAITS, traitOpen, doesOf } from '../../progress/domainladder.js';
import { PRESSURE } from '../../progress/stones.js';
import { typeWeaknessOf } from '../../progress/combat/constitution.js';
import { familiarityOf } from '../../progress/familiarity.js';
import { TYPES } from '../../progress/combat/types.js';
import { EMO } from '../../progress/combat/emo.js';
import { REGIONS } from '../vessel/damage.js';
import { BREAK_AT } from '../../progress/combat/vessel.js'; // (the vessel's one rule's line: SUBSTRATE.md F1)
import { throwBack } from '../parry.js';
import { OPPOSITE, agateOf, TYPE_OF } from '../../progress/weather.js';

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** Ours: the Watch shows a head kept down WATCH_MIN real s or more (a shorter one is no time to move); Shatter's glow shows on at most
 *  SHATTER_SHOWN creatures within SHATTER_R m; Receptivity looks this far (m) while the Veritome is drawn; Postpone counts a parry only of
 *  a blow from a real foe (never Strawman's). */
const WATCH_MIN = 1, SHATTER_SHOWN = 3, SHATTER_R = 14, RECEPTIVE_R = 30;
const TYPE_ORDER = Object.keys(TYPES);
/** The parry's key (V), held past the parry for the Catch. */
const PARRY_KEY = 'KeyV';
let stepMat = null;
/** Recall's trail is sampled every TRAIL_EVERY real s (a blink lands within a body's length of where you stood). */
const TRAIL_EVERY = 0.1;

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
    this.trail = []; // (Recall: [t, x, y, z, pool] every TRAIL_EVERY real s, the last DOMAIN_ARTS.recall.does.back + a little)
    this.vowOn = null; this.vowWait = -99; this.vowKept = 0; this.readKinds = new Set(); this.lockRef = null;
    this.steps = []; // (Footholds: { body, mesh, h, until })
    this.caught = null; this.thrown = null; // (the Catch: the shot held { pr, until, h }, then the one let go { pr, from, until })
    this.boundTo = null; // (the Link: the last creature reprogrammed)
    this.reactAt = -99; this.reactions = null; // (Reactions: one a stamp, gathered in a microtask)
    const on = (n, fn) => game.events?.on?.(n, fn);
    on('move.parry', (e) => { if ((e.by ?? 'courier') === 'courier' && e.what === 'blow' && !e.training) this.parried(); });
    for (const [id, W] of Object.entries(RULE_WHEN)) if (W.event) on(W.event, (e) => { if (W.test(e)) this.rule(id); });
    for (const [id, V] of Object.entries(VOWS)) if (V.event) on(V.event, (e) => { if ((e.by ?? 'courier') === 'courier' && this.vowOn === id) this.breakVow(); });
    on('creature.struck', (e) => { if (this.vowOn && e.kill && !e.training && (e.by ?? 'courier') === 'courier') this.arts?.used('vow', 0.9); }); // (a down made under a vow)
    on('reprogram.run', (e) => { if (!e.refused) this.boundTo = game.reprogram?.c || this.boundTo; }); // (the Link's creature: the one just rewritten)
    on('photo.take', (e) => { if (e.candid === 'candid' && this.on('watch') && this.shown.size) this.arts?.used('watch', 0.9); }); // (the watch read, the plate taken unseen)
  }
  get arts() { return this.game.domainArts; }
  open(id) { return !!this.arts?.open?.(id); }
  /** Working now: a passive or reaction holding a notch, an action worn (domainArts.on). */
  on(id) { return !!this.arts?.on?.(id); }
  /** A rung's numbers, with its open traits laid over (progress/domainladder.js: a milestone's modifier, never the row changed). */
  does(id) { const g = this.game; return doesOf(id, g.ledger, g.psyche?.level ? (d) => g.psyche.level(d) : null) || DOMAIN_ARTS[id].does; }
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
    this.fire('postpone', { parried: true, left: this.does('postpone').parried });
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
    const ok = id === 'plating' ? this.platingGo() : id === 'retype' ? this.retypeGo() : id === 'recall' ? this.recallGo() : id === 'footholds' ? this.footholdGo() : false;
    if (!ok) { if (A.cost) g.lachryma?.gain?.(A.cost, 'refund'); return false; }
    if (id !== 'plating') (this.coolUntil ||= {})[id] = this.now + (A.cooldown || 0); // (Plating's cooldown runs from its end: unplate)
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
    const known = foe && (familiarityOf(L, foe.kind).level >= D.knows || L?.get?.(`domain.read.${foe.kind}`) > 0) ? typeWeaknessOf(foe) : null; // (knowing the kind is the skill: Divination's make-up, the Veritome's plates, the downs)
    const type = known || TYPE_ORDER[(TYPE_ORDER.indexOf(this.lastRetype) + 1) % TYPE_ORDER.length]; // (else the next type in turn: you learn the chart by the hits)
    this.lastRetype = type;
    this.retypeOn = { type, until: this.now + D.dur, n: 0, weak: 0, known: !!known };
    this.play('domain.alteration.cast', { pos: this.game.player.pos.clone().add(UP) });
    this.fire('retype', { type, kind: foe?.kind ?? null, known: !!known });
    return true;
  }

  /** Recall (Ouranurgy 30): the blink forced back along the line to where you stood `back` real s ago (the blink's own body: its
   *  collision, its look), and the pool as it was then if it was fuller (Tracer's Recall). Never past `max` m. */
  recallGo() {
    const g = this.game, P = g.player, D = this.does('recall'), T = this.trail, want = this.now - D.back;
    const then = T.find((x) => x[0] >= want) || T[0]; if (!then) return !this.refuse('recall', 'none');
    const to = new THREE.Vector3(then[1], then[2], then[3]), d = to.distanceTo(P.pos);
    if (d < 0.5) return !this.refuse('recall', 'here');
    const B = g.techs?.get?.('blink'); if (!B?.force) return !this.refuse('recall', 'none');
    const from = P.pos.clone(), pool = then[4];
    this.play('domain.ouranurgy.cast', { pos: from.clone() });
    B.force(to.clone().sub(P.pos), Math.min(d, D.max), () => { this.play('domain.ouranurgy.hit', { pos: g.player.pos.clone().add(UP) }); });
    const L = g.lachryma; if (L && pool > L.value) L.gain(pool - L.value, 'art');
    this.fire('recall', { dist: +d.toFixed(1) }); this.arts?.used('recall', Math.min(1, d / 12));
    return true;
  }

  /** Footholds (Manifestation 30): a step of Lachrymite, a fixed box in the static group (the core movement lands on it as on any ground:
   *  the class arts' Earth Wall's way, courier/classarts/body.js), under where the feet will be next in the air, a stair's rise ahead on
   *  the ground; the oldest goes when a fourth is set. Never in a race, a trial or Strawman's Well's frame (no record set by it). */
  footholdGo() {
    const g = this.game, P = g.player, W = g.physics?.world, D = this.does('footholds');
    const live = liveMoment(g); if (live === 'race' || live === 'trial' || g.strawmanWell?.frame?.on) return !this.refuse('footholds', 'record');
    if (!W || !g.scene) return false;
    const f = P.forward?.() || new THREE.Vector3(0, 0, -1), air = !P.grounded;
    const at = air ? new THREE.Vector3(P.pos.x + P.vel.x * 0.12, P.pos.y - 0.12, P.pos.z + P.vel.z * 0.12) : P.pos.clone().addScaledVector(f.setY(0).normalize(), 1.0).setY(P.pos.y + 0.45);
    const h = 0.18, s = D.size;
    const body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(at.x, at.y - h / 2, at.z));
    W.createCollider(RAPIER.ColliderDesc.cuboid(s / 2, h / 2, s / 2).setCollisionGroups(GROUPS.static), body);
    stepMat ||= new THREE.MeshStandardMaterial({ color: 0xcfeaff, emissive: 0x6fb8e8, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.05, transparent: true, opacity: 0.85 }); // (a placeholder: Lachrymite's look is Calissa's)
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), stepMat); mesh.position.set(at.x, at.y - h / 2, at.z); mesh.castShadow = mesh.receiveShadow = true; g.scene.add(mesh);
    this.steps.push({ body, mesh, until: this.now + D.dur });
    while (this.steps.length > D.at) this.dropStep(0);
    this.play('domain.manifestation.cast', { pos: at.clone(), scale: 0.4 });
    this.fire('footholds', { air, n: this.steps.length });
    this.arts?.used('footholds', air ? 0.8 : 0.4); // (a step set under you in the air is the art asked well; a stair, rote)
    return true;
  }
  dropStep(i) {
    const S = this.steps[i]; if (!S) return; this.steps.splice(i, 1);
    if (S.body) this.game.physics?.removeBody?.(S.body);
    this.game.scene?.remove(S.mesh); S.mesh.geometry.dispose();
    this.play('domain.manifestation.hit', { pos: S.mesh.position.clone(), scale: 0.3 });
  }

  // ---- A Vow (Spellscription 30) ------------------------------------------------
  /** The vow sworn (domainArts.vow) made the pool's modifier while its rung holds a notch; a state vow read each frame. */
  vowTick(dt) {
    const g = this.game, want = this.on('vow') ? this.arts?.vow ?? null : null;
    if (want !== this.vowOn) {
      if (this.vowOn) g.lachryma?.removeModifier?.('domain.vow');
      this.vowOn = want; this.vowKept = 0;
      if (want) g.lachryma?.addModifier?.('domain.vow', { costMult: { '*': this.does('vow').costMult ?? VOW.costMult }, source: 'A Vow' });
    }
    if (!this.vowOn) return;
    if (VOWS[this.vowOn]?.state?.(g)) return this.breakVow();
    this.vowKept += dt; if (this.vowKept >= VOW.keptEvery) { this.vowKept = 0; this.arts?.used('vow', 0.6); }
  }
  breakVow() {
    const g = this.game, id = this.vowOn; if (!id) return;
    g.lachryma?.removeModifier?.('domain.vow'); this.vowOn = null; this.vowWait = this.now + VOW.again;
    if (this.arts) { this.arts.vow = null; g.save?.dirty?.('domainArts'); }
    this.play('domain.spellscription.hit', { pos: g.player.pos.clone().add(UP) });
    g.vesselDamage?.release?.({ amount: PRESSURE.unit, why: 'vow', by: 'courier' }); // (the stake: one release's unit through the stones, a crack)
    g.events?.emit('domain.art.end', { art: 'vow', why: 'broken', vow: id, by: 'courier' });
  }

  // ---- A Body's Make-up (Divination 30) -----------------------------------------
  /** On a lock-on to a creature of a kind not read this session: its affinity and the type that bites it, said once; the kind is then
   *  known to Re-type (`domain.read.<kind>` in the ledger: a fact, kept). */
  makeupTick() {
    const g = this.game, c = g.lock?.target?.ref;
    if (c === this.lockRef) return; this.lockRef = c;
    if (!this.on('makeup') || !c?.kind || !c.alive || c.training || this.readKinds.has(c.kind)) return;
    const weak = typeWeaknessOf(c); if (!weak) return;
    this.readKinds.add(c.kind);
    const first = !(g.ledger?.get?.(`domain.read.${c.kind}`) > 0); g.ledger?.inc?.(`domain.read.${c.kind}`);
    if (c.pos) this.play('domain.divination.cast', { pos: c.pos.clone().add(UP), scale: 0.5 });
    g.events?.emit('domain.makeup', { kind: c.kind, weak, first, by: 'courier' });
    this.arts?.used('makeup', first ? 0.9 : 0.3);
  }

  // ---- the strike: Re-type's type, Shatter's break --------------------------
  onStrike(c, cause, type, power) {
    let out = null;
    const R = this.retypeOn;
    if (R && this.now < R.until && type !== R.type) {
      out = { type: R.type }; R.n++; if (typeWeaknessOf(c) === R.type) R.weak++;
      if (c.pos) this.play('domain.alteration.hit', { pos: c.pos.clone().add(UP) });
    }
    if (cause === 'parry') { // (a shot sent back: struck its thrower? the catch's feat; the catch's own throw strikes half again as hard)
      const T = this.thrown, mine = T && this.now < T.until && T.pr.pos && c.pos && T.pr.pos.distanceTo(c.pos) < (c.radius ?? 0.6) + 1.2;
      if (mine) { // (the catch's x1.5 on the blow's damage: creatures.strike reads `dmg`)
        out = { ...(out || {}), dmg: this.does('catch').mult }; this.thrown = null; // (once: the catch's blow is spent)
        this.arts?.used('catch', T.from === c ? 1 : 0.6);
      }
      if ((mine && T.from === c) || [...(this.game.projectiles || [])].some((q) => (q.reflected || q.parried) && q.from === c)) this.game.events?.emit('parry.return', { kind: c.kind, by: 'courier' });
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

  // ---- THE CATCH (Psychokinesis 30): parry.js deflect asks; held while the parry is, then thrown where you aim ----
  catch(pr) {
    if (!this.on('catch') || this.caught || !pr || !this.game.input?.down?.has?.(PARRY_KEY)) return false;
    pr.parried = true; pr.reflected = true; // (held, it is the Courier's: it strikes no one, and no parry takes it again)
    const D = this.does('catch'), P = this.game.player;
    this.caught = { pr, until: this.now + D.hold, h: this.play('domain.psychokinesis.hold', { pos: P.pos.clone().add(UP), scale: 0.4, follow: (hh) => { const at = this.caught?.at; if (at) hh.pos.copy(at); return !!this.caught; } }) };
    this.fire('catch', { kind: pr.from?.kind ?? null });
    return true;
  }
  holdCaught() {
    const C = this.caught; if (!C) return;
    const g = this.game, P = g.player, pr = C.pr;
    if (pr.gone || (pr.body && !pr.body.isValid?.())) { this.caught = null; return; }
    const d = g.aim?.dir?.(_b) ?? g.camera.getWorldDirection(_b);
    C.at = _a.copy(P.pos).setY(P.pos.y + 1.2).addScaledVector(d.setY(0).normalize(), 0.9).clone();
    if (pr.body) { pr.body.setTranslation(C.at, true); pr.body.setLinvel({ x: 0, y: 0, z: 0 }, true); } else { pr.pos.copy(C.at); pr.vel?.set?.(0, 0, 0); }
    if (typeof pr.t === 'number') pr.t = Math.min(pr.t, 0.2); // (its own clock held while held: a lifetime is not spent in the hand)
    if (!g.input?.down?.has?.(PARRY_KEY) || this.now >= C.until) this.letGo();
  }
  letGo() {
    const C = this.caught; if (!C) return; this.caught = null;
    const g = this.game, dir = (g.aim?.dir?.(new THREE.Vector3()) ?? g.camera.getWorldDirection(new THREE.Vector3())).normalize();
    throwBack(g, C.pr, dir, this.does('catch').mult);
    this.thrown = { pr: C.pr, from: C.pr.from ?? null, until: this.now + 3 };
    this.play('domain.psychokinesis.cast', { pos: C.pr.pos?.clone?.() ?? g.player.pos.clone().add(UP), dir });
    g.events?.emit('domain.art.end', { art: 'catch', why: 'thrown', by: 'courier' });
  }

  // ---- THE LINK (Possession 30): damage.js asks with a crack's share past the shield; half struck on the bound creature ----
  bound() {
    const c = this.boundTo, P = this.game.player;
    if (!c?.alive || c.training || !P || !c.pos || c.pos.distanceTo(P.pos) > this.does('link').reach) return null;
    return c;
  }
  share(k, region, ctx = {}) {
    if (!this.on('link') || !(k > 0) || (ctx.by && ctx.by !== 'creature')) return k;
    const c = this.bound(); if (!c) return k;
    const D = this.does('link'), moved = k * D.share, g = this.game;
    const dir = _a.copy(c.pos).sub(g.player.pos).setY(0); if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    g.creatures?.strike?.(c, c.pos.clone().add(UP), dir.normalize().clone(), moved * D.power, 'link', 'courier', null, 'influence');
    this.play('domain.possession.hit', { pos: c.pos.clone().add(UP) });
    this.fire('link', { kind: c.kind, region, k: +moved.toFixed(2), share: D.share });
    this.arts?.used('link', Math.min(1, 0.4 + moved));
    return k - moved;
  }

  // ---- REACTIONS (Alteration 30): paintmap.js asks a cell at a time; one reaction a stamp, gathered in a microtask ----
  react(was, aspect, x = null, z = null) {
    if (!this.on('reactions') || !was || !aspect || was === aspect) return undefined;
    const kind = OPPOSITE[was] === aspect ? 'cancel' : agateOf(was, aspect) ? 'flare' : null; if (!kind) return undefined;
    if (!this.reactions) { this.reactions = { kind, was, aspect, cells: 0, x: 0, z: 0, at: 0 }; queueMicrotask(() => this.reacted()); }
    const R = this.reactions; R.cells++; if (x != null) { R.x += x; R.z += z; R.at++; }
    return kind === 'cancel' ? 'cancel' : aspect; // (opposites: bare ground at once; an agate: the new paint takes it, flared)
  }
  reacted() {
    const R = this.reactions; this.reactions = null; if (!R || this.now - this.reactAt < this.does('reactions').every) return;
    this.reactAt = this.now;
    const g = this.game, D = this.does('reactions'), P = g.player;
    const at = R.at ? new THREE.Vector3(R.x / R.at, P.pos.y, R.z / R.at) : (g.paintReticle?.point?.clone?.() ?? P.pos.clone()); // (the stamp's middle, else where the brush points)
    for (const c of g.creatures?.near?.(at, D.radius) || []) {
      if (!c.alive || c.ally) continue;
      if (R.kind === 'cancel') g.creatures.apply?.(c, 'calm', D.calm, 1, 'courier');
      else g.creatures.strike(c, c.pos.clone().add(UP), _a.set(0, 1, 0).clone(), D.flare, 'reaction', 'courier', null, TYPE_OF[R.was] || 'impact');
    }
    this.play(R.kind === 'cancel' ? 'domain.alteration.cast' : 'domain.alteration.hit', { pos: at.clone().add(UP) });
    g.events?.emit('domain.react', { kind: R.kind, was: R.was, aspect: R.aspect, cells: R.cells, agate: agateOf(R.was, R.aspect), by: 'courier' });
    this.arts?.used('reactions', R.kind === 'flare' ? 0.8 : 0.6);
  }

  shatterNow() { return shatterOf(this.game.psyche?.level?.('psychokinesis') ?? 10); }
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

  /** Say each trait once, the first time it opens (its rung's numbers change from then: `does`). Kept in the rungs' told list. */
  teachTraits() {
    const g = this.game, A = this.arts, lv = g.psyche?.level ? (d) => g.psyche.level(d) : null; if (!A?.told) return;
    for (const [id, T] of Object.entries(TRAITS)) {
      const key = `trait.${id}`; if (A.told.includes(key) || !traitOpen(id, g.ledger, lv) || !this.open(T.of)) continue;
      if (g.lend?.has?.('summit')) continue; // (a lent level is not an achievement: said only when earned)
      A.told.push(key); g.save?.dirty?.('domainArts');
      g.events?.emit('domain.trait.learn', { trait: id, art: T.of, domain: T.domain, by: 'courier' });
    }
  }

  // ---- each frame ----------------------------------------------------------------
  update(dt) {
    this.now += dt;
    const g = this.game, P = g.player; if (!P || !this.arts) return;
    if (!this.traitAt || this.now - this.traitAt >= 1) { this.traitAt = this.now; this.teachTraits(); }
    if (this.held && this.now >= this.held.at) this.land();
    if (this.plateOn && this.now >= this.plateOn.until) this.unplate('melt');
    for (let i = this.steps.length - 1; i >= 0; i--) if (this.now >= this.steps[i].until) this.dropStep(i);
    if (this.retypeOn && this.now >= this.retypeOn.until) {
      const R = this.retypeOn; this.retypeOn = null;
      g.events?.emit('domain.art.end', { art: 'retype', why: 'time', by: 'courier' });
      this.arts.used('retype', R.n ? (R.known ? 0.5 : 0.4 + 0.6 * (R.weak / R.n)) : 0.2); // (a weakness found by trying pays most; one read off what you knew, middling)
    }
    if (!this.trailAt || this.now - this.trailAt >= TRAIL_EVERY) { // (Recall's trail: only while Recall is open, so nothing is kept for nothing)
      this.trailAt = this.now;
      if (this.open('recall')) { this.trail.push([this.now, P.pos.x, P.pos.y, P.pos.z, g.lachryma?.value ?? 0]); while (this.trail.length && this.trail[0][0] < this.now - this.does('recall').back - 0.5) this.trail.shift(); }
    }
    this.holdCaught();
    if (this.reactions) this.reacted(); // (a stamp's reaction, if its microtask has not run yet)
    if (this.thrown && this.now > this.thrown.until) this.thrown = null;
    this.vowTick(dt);
    this.makeupTick();
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
