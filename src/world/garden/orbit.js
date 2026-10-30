// ---------------------------------------------------------------------------------------
// THE GARDEN'S RING, GROWN FROM SEEDS (docs/plans/SEEDS-SLABS-SCANS.md section 1; Dovina's rules in progress/seeds.js: SEEDS, SIZES,
// feedOf, sizeOf, tintOf, MATTER_FEED; the ring's slots ORBIT and orbitSlot in progress/realm.js): the planetoids beyond the first six
// are grown, never bought. A SEED is earned by an act, once (tracking writes `seed.earn.<id>`: feedback/tracking/gardengrowth.js). A
// seed of the ring waits in the shed until taken: the god hand carries it up into the sky and lets go (the left button, over no
// planetoid), and it takes the free slot of the ring nearest where it was let go, ORBIT.radius metres round the Dantian, as a MOONLET
// (SIZES[0]), linked by lotuses and a spirit vein to its two nearest of the first six. FED (cubes or a material at the shed; the
// island's matter the god hand carries, poured on it with GRAB held over it, so much a game day: MATTER_FEED), it GROWS a size at a
// time in place: its look made again at the new radius, its clay's hills scaled with it, more plots laid round those it has, its
// lotuses and veins moved out to its new ground (realm.regrow). Its colour leans to the feeling it was fed most (tintOf, in its look). Past medium
// it keeps a moonlet of its own in close orbit, so its size reads at a glance. The seven feelings' moonlets stand on the inner ring
// round the Dantian's waist (place.js MOONLET_RING), set there as they are earned, a jump from its ground, never fed.
// Every seed's planetoid is a sphere for now (SHAPES[kind].body: the faceted, reef, bowl and torus bodies to come), drawn by its kind
// (`look: kind`): its colours, its feeling and the tint of what it was fed are Calissa's looks (vfx/garden/seedlooks.js, read from
// `planted`). Kept in the realm's save: each seed's slot, size and what it was fed, and the game day's matter.
// Events: seed.plant { seed, slot, inner }, seed.grow { seed, size }, seed.feed { seed, minutes, from }, each with `by`.
//
// Prior art: Super Mario Galaxy (the Comet Observatory's domes opened by Grand Stars; a Hungry Luma fed Star Bits becomes a planet; the
// tiny planetoids a jump apart), Katamari Damacy's growth by what is taken in, Spore's solar system, Animal Crossing's house grown a
// room at a time.
//
//   realm.orbit = new Orbit(realm)   .seeds (true: the ring takes seeds; tracking says a seed earned only then)   .earned() -> [id]
//   .waiting() -> [id] (the ring's seeds not yet in the sky)   .take(id) -> why | null (into the hand)   .release(id, point) -> bool
//   .sync() (the inner ring's moonlets set as earned)   .feed(id, item) -> { minutes, grew } | { why } (item: { cubes } | { slot } | { matter })
//   .pour(P, dt) / .pourEnd() (the hand's matter on a seed's planetoid)   .of(id) -> record   .slotPos(n)   .slots()   .update(raw)   .dump() / .load(d)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ORBIT, orbitSlot } from '../../progress/realm.js';
import { SEEDS, SIZES, sizeOf, feedOf, MATTER_FEED } from '../../progress/seeds.js';
import { worthOf } from '../../progress/shop/catalogue.js';
import { today } from '../../core/calendar.js';
import { VERBS } from '../../godhand/matterarts.js';
import { Planetoid } from '../../vfx/garden/planetoid.js';
import { MOONLET_RING, moonletBerth, GARDEN_AT } from './place.js';

/** The look a seed's kind wears until Calissa's own: the bought planetoids' three that fit (vfx/garden/boughtplanetoids.js), else the
 *  plain ground in a palette of its kind's (top, low, rock). */
/** The moon a large planetoid keeps: its radius and its orbit (metres past the surface, real seconds a turn). */
const OWN_MOON = { r: 2, gap: 6, secs: 40 };
const cap = (s = '') => s[0].toUpperCase() + s.slice(1);
const _v = new THREE.Vector3();

export class Orbit {
  constructor(realm) {
    this.R = realm; this.game = realm.game;
    this.seeds = true; // (the ring takes seeds: tracking says a seed earned from now on, feedback/tracking/gardengrowth.js)
    this.planted = new Map(); // (seed id -> { seed, slot, size, minutes, fed, planet })
    this.day = { d: -1, m: 0 }; // (the game day's minutes fed by the island's matter: MATTER_FEED.dayCap)
    this.pouring = null; this.syncT = 0;
  }
  get L() { return this.game.ledger; }

  // ------------------------------------------------------------------ the seeds
  /** The seeds the ledger has given (once each, written by tracking). */
  earned() { return Object.keys(SEEDS).filter((id) => (this.L?.get?.(`seed.earn.${id}`) || 0) > 0); }
  /** The ring's seeds earned and not yet in the sky (in the shed). */
  waiting() { return this.earned().filter((id) => !SEEDS[id].inner && !this.planted.has(id) && this.R.hand?.seed?.id !== id); }
  of(id) { return this.planted.get(id) || null; }
  nameOf(id) { const S = SEEDS[id]; return S?.inner ? `the moonlet of ${cap(S.feeling)}` : `the ${S?.kind || id} planetoid`; }

  /** Where slot n stands: round the Dantian's heart, at ORBIT's radius, tilted above or below by turn. */
  slotPos(n) {
    const s = orbitSlot(n), D = this.R.site.by.dantian, a = (s.angle * Math.PI) / 180, t = (s.tilt * Math.PI) / 180;
    return D.c.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(t), Math.sin(t), Math.cos(a) * Math.cos(t)).multiplyScalar(s.radius));
  }
  /** The ring's slots, and which are free (a slot is taken by a seed's planetoid, or by one of the first six standing too near it). */
  slots() {
    const out = [], taken = new Set([...this.planted.values()].filter((r) => !SEEDS[r.seed].inner).map((r) => r.slot));
    for (let n = 0; n < ORBIT.slots; n++) {
      const pos = this.slotPos(n), free = !taken.has(n) && !this.R.site.planets.some((P) => !P.seed && P.c.distanceTo(pos) < P.rMax + 18);
      out.push({ n, pos, free });
    }
    return out;
  }

  /** From the shed: the seed put in the god hand. A reason why not, else null. */
  take(id) {
    const S = SEEDS[id];
    if (!S || S.inner) return 'That seed is not one for the ring.';
    if (!this.earned().includes(id)) return 'That seed is not yours yet.';
    if (this.planted.has(id)) return 'That seed is already in the sky.';
    if (this.R.hand.seed) return 'Your hand already carries a seed.';
    if (!this.slots().some((s) => s.free)) return 'The ring has no free place.';
    this.R.hand.carrySeed(id);
    return null;
  }
  /** The hand let the seed go at a point in the sky: it takes the nearest free slot. */
  release(id, point) {
    const free = this.slots().filter((s) => s.free); if (!free.length) return false;
    const s = free.reduce((b, x) => (x.pos.distanceTo(point) < b.pos.distanceTo(point) ? x : b));
    if (!this.plant(id, s.n)) return false;
    this.game.events?.emit('seed.plant', { seed: id, slot: s.n, inner: false, by: 'courier' });
    this.game.save?.dirty('realm');
    return true;
  }
  /** The inner ring's moonlets set as they are earned (on entering, and each real second inside). */
  sync() {
    if (!this.R.built) return;
    for (const id of this.earned()) {
      const S = SEEDS[id]; if (!S.inner || this.planted.has(id)) continue;
      const i = MOONLET_RING.order.indexOf(S.feeling); if (i < 0 || !this.plant(id, i)) continue;
      this.game.events?.emit('seed.plant', { seed: id, slot: i, inner: true, by: 'courier' });
      this.game.save?.dirty('realm');
    }
  }

  /** A seed's planetoid made at its slot (or its berth on the inner ring), at the size it has: the site's planetoid and its look, its
   *  clay, its plots, its lotuses and vein (none for a moonlet of the inner ring: it is a jump from the Dantian). */
  plant(id, slot, was = {}) {
    const S = SEEDS[id], site = this.R.site; if (!S || this.planted.has(id)) return null;
    const r = { seed: id, slot, size: Math.min(SIZES.length - 1, was.size | 0), minutes: +was.minutes || 0, fed: { ...(was.fed || {}) }, planet: null };
    const Z = SIZES[r.size];
    const P = site.addPlanet({ id: `seed.${id}`, r: Z.r, c: S.inner ? site.by.dantian.c : this.slotPos(slot), name: this.nameOf(id), look: S.kind });
    P.seed = id; r.planet = P;
    if (S.inner) { // (on its berth: the gap measured from the Dantian's ground to its own, along the line of their hearts)
      const D = site.by.dantian, d = moonletBerth(slot), c = D.c.clone().addScaledVector(d, D.radiusAt(d) + MOONLET_RING.gap + P.base(_v.copy(d).negate()));
      P.c.copy(c); P.at = c.clone().sub(GARDEN_AT).toArray(); P.look.group.position.copy(c);
    }
    this.R.adopt(P, Z.plots, { links: S.inner ? 0 : 2 });
    this.game.present?.shade?.(); // (its stone's flat shading made smooth now, not a second later: one program, never two in play)
    this.planted.set(id, r);
    if (Z.moon) this.ownMoon(r);
    return P;
  }

  // ------------------------------------------------------------------ feeding
  /** One feeding of a ring seed's planetoid: `{ cubes }` paid, `{ slot }` a material from the Pneuka Box, `{ matter }` m³ of the island's
   *  (capped a game day). It grows through every size its minutes pass (a seed.grow a size). `{ why }` when refused. */
  feed(id, item = {}) {
    const g = this.game, r = this.planted.get(id), S = SEEDS[id];
    if (!r || S.inner) return { why: 'Only a planetoid of the ring is fed.' };
    if (r.size >= SIZES.length - 1) return { why: 'It is as large as a planetoid grows.' };
    let F, from;
    if (item.cubes) {
      const n = Math.max(1, Math.round(item.cubes)); if (!g.cubes?.spend(n, 'garden')) return { why: `It takes ${n} cubes.` };
      F = feedOf({ cubes: n }); from = 'cubes';
    } else if (item.slot != null) {
      const box = g.pneuka, sl = box?.slots[item.slot];
      if (!sl?.id?.startsWith('mat.') || !sl.data?.kind) return { why: 'That is not a material.' };
      F = feedOf({ material: { kind: sl.data.kind, tier: sl.data.tier }, worth: worthOf(sl.id, sl.data) }); box.take(item.slot); from = 'material';
    } else if (item.matter > 0) {
      const left = this.matterLeft(); if (left <= 0) return { why: 'Your seeds take no more of the island\'s matter this game day.' };
      F = feedOf({ matter: item.matter }); F.minutes = Math.min(F.minutes, left); this.day.m += F.minutes; from = 'matter';
    } else return { why: 'Nothing to feed it.' };
    r.minutes += F.minutes; const k = F.feeling || 'none'; r.fed[k] = (r.fed[k] || 0) + F.minutes;
    g.events?.emit('seed.feed', { seed: id, minutes: +F.minutes.toFixed(2), from, feeling: F.feeling || undefined, by: 'courier' });
    const z = sizeOf(r.minutes).i, P = r.planet, was = r.size;
    if (z > was) {
      r.size = z;
      this.R.regrow(P, SIZES[z].r, SIZES[z].plots);
      for (let s = was + 1; s <= z; s++) g.events?.emit('seed.grow', { seed: id, size: SIZES[s].id, by: 'courier' }); // (a size passed, each said)
      if (SIZES[z].moon) this.ownMoon(r);
    } // (the tint of what it was fed is its look's: Calissa's seedlooks.js reads `planted` on seed.feed)
    g.save?.dirty('realm');
    return { minutes: F.minutes, grew: z > was };
  }
  /** The minutes the island's matter may still feed this game day. */
  matterLeft() { const d = today(); if (this.day.d !== d) this.day = { d, m: 0 }; return Math.max(0, MATTER_FEED.dayCap - this.day.m); }
  /** The hand's pour (GRAB held over a ring seed's planetoid while the god hand carries the island's matter, world/garden/hand.js): the
   *  matter leaves the hand at the god hand's own rate, the feeding made when the pour ends. True while it pours. */
  pour(P, dt) {
    const id = P?.seed, r = id && this.planted.get(id), M = this.game.god?.arts?.matter, total = M?.carried || 0;
    if (!r || SEEDS[id].inner || r.size >= SIZES.length - 1 || total <= 0.05) { this.pourEnd(); return false; }
    const room = this.matterLeft() / MATTER_FEED.perM3 - (this.pouring?.id === id ? this.pouring.m3 : 0);
    if (room <= 1e-3) { this.pourEnd(); this.game.log?.say('warn', 'Your seeds take no more of the island\'s matter this game day.', { key: 'seed.matter', throttle: 2 }); return false; }
    if (this.pouring && this.pouring.id !== id) this.pourEnd();
    const v = Math.min(total, VERBS.pourRate * dt, room), H = M.held, k = v / total;
    H.water -= H.water * k; H.loose -= H.loose * k; H.firm -= H.firm * k;
    (this.pouring ||= { id, m3: 0 }).m3 += v;
    return true;
  }
  pourEnd() { const p = this.pouring; this.pouring = null; if (p?.m3 > 1e-3) this.feed(p.id, { matter: p.m3 }); }

  /** A large planetoid's own moonlet: a small planetoid of its parent's kind, dressed by Calissa's seed looks, not walked on. */
  ownMoon(r) {
    if (r.moon) return;
    const P = r.planet, M = new Planetoid({ kind: SEEDS[r.seed].kind, radius: OWN_MOON.r, seed: 7, detail: 6 });
    M.group.name = 'seed-own-moon'; this.R.site.group.add(M.group); r.moon = M;
    this.game.present?.shade?.();
    this.place(r, 0); return M;
  }
  place(r, t) { const P = r.planet, a = (t / OWN_MOON.secs) * Math.PI * 2, d = P.r * 1.05 + OWN_MOON.gap; r.moon.group.position.copy(P.c).add(_v.set(Math.cos(a) * d, Math.sin(a * 0.5) * d * 0.25, Math.sin(a) * d)); }

  // ------------------------------------------------------------------ each frame, and the save
  update(raw) {
    if ((this.syncT -= raw) <= 0) { this.syncT = 1; this.sync(); }
    this.t = (this.t || 0) + raw;
    for (const r of this.planted.values()) if (r.moon) { this.place(r, this.t); r.moon.update(raw); }
  }
  dump() { return { v: 2, planted: [...this.planted.values()].map((r) => ({ seed: r.seed, slot: r.slot, size: r.size, minutes: +r.minutes.toFixed(3), fed: Object.fromEntries(Object.entries(r.fed).map(([f, m]) => [f, +m.toFixed(3)])) })), day: [this.day.d, +this.day.m.toFixed(3)] }; }
  /** The save's seeds made what is in the sky: one it lacks taken out, one at another slot or size made again (its clay, plots and
   *  water load after it: realm.loadAll), the rest kept. The bought planetoids' list from before the seeds (2026-10-30) holds none. */
  load(d) {
    const want = new Map((d?.v === 2 ? d.planted || [] : []).filter((w) => SEEDS[w.seed]).map((w) => [w.seed, w]));
    for (const [id, r] of [...this.planted]) { const w = want.get(id); if (!w || (w.slot | 0) !== r.slot || Math.min(SIZES.length - 1, w.size | 0) !== r.size) this.unplant(id); }
    for (const [id, w] of want) { const r = this.planted.get(id); if (!r) this.plant(id, w.slot | 0, w); else { r.minutes = +w.minutes || 0; r.fed = { ...(w.fed || {}) }; } }
    this.day = Array.isArray(d?.day) ? { d: d.day[0] | 0, m: +d.day[1] || 0 } : { d: -1, m: 0 };
  }
  /** A seed's planetoid taken out of the sky (a save without it loaded), and its own moon. */
  unplant(id) { const r = this.planted.get(id); if (!r) return; if (r.moon) { r.moon.dispose(); r.moon = null; } this.R.removePlanet(r.planet); this.planted.delete(id); }
}
