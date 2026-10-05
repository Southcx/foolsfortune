// ---------------------------------------------------------------------------------------
// THE VOYAGE: the Emocean hop's systems (docs/plans/SLICE.md, E4; Dovina's half; the pier, the rail and the dock are Petra's). Where the
// Courier is on the node map, what the ship carries, what a crossing costs, what a stage failed takes, and what the sea has been
// reckoned to be. One Courier, one purse, one ledger: the fuel is spent from game.cubes, the cargo is casks in the Pneuka Box (a ship's
// hold is a limit on how many may cross, never a second inventory), the trade is the shops' (a shop on an island prices by its
// demand: catalogue.js), and every outcome is an event with `by` for tracking.js to count.
//
// The flow: buy casks at the pier (Grog: Anagami's grades) -> board(from, to, ship) at the pier (refused, with the reason, when the hold
// is over or the purse short; fuel paid) -> the rail is sailed (Petra's) -> stageResult({ passed, hits, bears, downed, spawned }) (a
// failed stage loses ECON.emocean.lose of each grade's casks, and each grade still aboard may spill whole: spillChance) -> arrived ->
// sell at the dock (the Purser). The MANIFEST remembers, cask by cask in the order bought, where each came from and what it cost, so a
// sale knows its route (Entropolis to Margarite: the toxic symbiosis) and its profit.
//
// THE RECKONING (emocean.js): a route's share divined today; reckon() keeps the best of the day, and a locked node opens for good once
// a route to it from an open node is reckoned to RECKON.open at the pier.
//
// Prior art: Sid Meier's Pirates! and Elite (buy low at one port, carry, sell high at another, under risk), FTL (fuel per jump, the
// sector map, a node found by scanning), Sunless Sea (a port found by sailing to it; a hold lost to the zee), and the manifest every
// merchant ship keeps (first in, first out).
//
//   game.voyage = new Voyage(game)
//   .at (the island the Courier is on)   .sailing ({ from, to, ship } | null)   .cargo() -> { grade: casks }   .casks() -> n
//   .canBoard(from, to, ship) -> { ok, why?, hop? }   .board(from, to, ship) -> { ok, why? }   .stageResult(r) -> { lost, spilled }
//   .reckon(from, to, share, q) -> share today   .reckoning(from, to) -> 0..1   .isOpen(node) -> bool
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { NODES, hop, routeId, opensNode } from './econ/emocean.js';
import { spillChance } from './econ/islands.js';
import { crudeGrade } from './shop/catalogue.js';
import { today } from '../core/calendar.js';
import { stream } from '../core/rng.js';

const simRand = stream('progress/voyage'); // (a spill's chance: core/rng.js, the same twice)
const GRADES = Object.keys(ECON.crude.grades);
const fresh = () => ({ at: 'anagami', sailing: null, manifest: {}, reckon: {}, opened: {} });

export class Voyage {
  constructor(game) {
    this.game = game;
    this.s = fresh();
    game.save?.section('voyage', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    const E = game.events;
    // the manifest: every cask bought is remembered with where and for how much; every one sold or lost leaves it first in, first out
    E?.on('shop.buy', (e) => {
      const g = crudeGrade(e.item);
      if (!g || e.by !== 'courier') return;
      (this.s.manifest[g] ||= []).push({ from: e.island || this.s.at, paid: e.price });
      E.emit('crude.buy', { island: e.island || this.s.at, grade: g, units: 1, price: e.price, by: 'courier' });
      this.dirty();
    });
    E?.on('shop.sell', (e) => {
      if (e.by !== 'courier') return;
      const g = crudeGrade(e.item);
      if (g) {
        this.agree(1); // (the cask just sold has left the box already: the manifest keeps one more until it is shifted below)
        const c = (this.s.manifest[g] || []).shift() || { from: e.island || this.s.at, paid: 0 };
        E.emit('crude.sell', { island: e.island || this.s.at, grade: g, units: 1, price: e.price, from: c.from, profit: e.price - c.paid, by: 'courier' });
        this.dirty();
      } else if (e.item === 'cogitomap') {
        E.emit('cogitomap.sell', { island: e.island || this.s.at, well: e.data?.well || null, worth: e.worth, price: e.price, by: 'courier' });
      }
    });
  }

  dirty() { this.game.save?.dirty('voyage'); }
  /** The Pneuka Box is the truth (the casks are its, the kit section); the manifest is only a memo of where and for how much. Two
   *  sections that must agree, so the memo is trimmed to the box, oldest first, whenever it is read (a cask lost some other way). */
  agree(pending = 0) {
    const box = this.game.pneuka;
    if (!box) return;
    for (const g of GRADES) { const m = this.s.manifest[g]; if (!m) continue; const keep = (box.count(`cask.${g}`) || 0) + pending; if (m.length > keep) { m.splice(0, m.length - keep); this.dirty(); } }
  }
  get at() { return this.s.at; }
  get sailing() { return this.s.sailing; }

  // ---------------------------------------------------------------- the hold
  /** Casks aboard (in the Pneuka Box), by grade. */
  cargo() { this.agree(); const box = this.game.pneuka, out = {}; for (const g of GRADES) { const n = box?.count(`cask.${g}`) || 0; if (n) out[g] = n; } return out; }
  casks() { return Object.values(this.cargo()).reduce((a, n) => a + n, 0); }

  // ---------------------------------------------------------------- the node map
  /** A node the Courier can sail to: open on the map, or found by a reckoning. */
  isOpen(id) { return !!NODES[id] && (!NODES[id].locked || !!this.s.opened[id]); }

  /** Whether this crossing can be made now, and if not, why (the pier says so). */
  canBoard(from = this.s.at, to, ship = 'sloop') {
    if (this.s.sailing) return { ok: false, why: 'You are already at sea.' };
    if (from !== this.s.at) return { ok: false, why: 'You are not at that pier.' };
    const S = ECON.ships[ship];
    if (!S) return { ok: false, why: 'There is no such ship.' };
    const h = hop(from, to, ship, (id) => this.isOpen(id));
    if (!h) return { ok: false, why: NODES[to] && !this.isOpen(to) ? 'No one has found the way there yet.' : 'There is no crossing there.' };
    const n = this.casks();
    if (n && !S.carries.includes('crude')) return { ok: false, why: `A ${ship} does not carry crude.` };
    if (n > S.hold) return { ok: false, why: `A ${ship} holds ${S.hold} casks; you have ${n}.` };
    if ((this.game.cubes?.balance ?? 0) < h.fuel) return { ok: false, why: `The crossing burns ${h.fuel} cubes of fuel.` };
    return { ok: true, hop: h };
  }

  /** Cast off: the fuel is paid, and the ship is at sea until the stage is sailed. */
  board(from = this.s.at, to, ship = 'sloop') {
    const c = this.canBoard(from, to, ship);
    if (!c.ok) return c;
    if (!this.game.cubes.spend(c.hop.fuel, 'fuel')) return { ok: false, why: `The crossing burns ${c.hop.fuel} cubes of fuel.` };
    this.s.sailing = { from, to, ship, day: today() };
    this.dirty();
    this.game.events.emit('emocean.hop', { from, to, ship, fuel: c.hop.fuel, by: 'courier' });
    return { ok: true, hop: c.hop };
  }

  /** The stage is over (Petra's rail calls this): a failed one costs cargo and may spill; either way the ship makes port. */
  stageResult({ passed = true, hits = 0, bears = 6, downed = 0, spawned = 0 } = {}) {
    const V = this.s.sailing;
    if (!V) return { lost: 0, spilled: false };
    let lost = 0, spilled = false;
    if (!passed) {
      const S = ECON.ships[V.ship] || {};
      for (const [g, n] of Object.entries(this.cargo())) {
        let gone = Math.floor(n * ECON.emocean.lose);
        if (simRand() < spillChance(g, n - gone, S.hull ?? 1)) { gone = n; spilled = true; }
        if (gone) { this.lose(g, gone); lost += gone; }
      }
    }
    this.s.at = V.to; this.s.sailing = null;
    this.dirty();
    this.game.events.emit('emocean.stage', { from: V.from, to: V.to, passed, hits, bears, downed, spawned, lost, spilled, by: 'courier' });
    return { lost, spilled };
  }
  lose(grade, n) {
    const box = this.game.pneuka, id = `cask.${grade}`;
    for (let i = 0; i < box.slots.length && n > 0; i++) while (n > 0 && box.slots[i]?.id === id) { box.take(i); n--; (this.s.manifest[grade] || []).shift(); }
  }

  // ---------------------------------------------------------------- the reckoning (Divination charts the course)
  reckoning(from, to) { return this.s.reckon[`${routeId(from, to)}@${today()}`] || 0; }
  /** A survey of the sea (Petra's verb, at the pier or under way) divined `share` of this crossing, `q` how well: the best of the day is
   *  kept, and a node not yet found opens for good once a route to it is reckoned far enough from an open node. */
  reckon(from, to, share = 0, q = null) {
    const key = `${routeId(from, to)}@${today()}`, r = Math.max(this.s.reckon[key] || 0, Math.max(0, Math.min(1, share)));
    this.s.reckon = Object.fromEntries(Object.entries(this.s.reckon).filter(([k]) => k.endsWith(`@${today()}`))); // (yesterday's sea is gone)
    this.s.reckon[key] = r;
    for (const [a, b] of [[from, to], [to, from]]) if (this.isOpen(a) && !this.isOpen(b) && opensNode(r)) { this.s.opened[b] = true; this.game.events.emit('emocean.found', { node: b, from: a, by: 'courier' }); }
    this.dirty();
    this.game.events.emit('emocean.reckon', { from, to, day: today(), reckoning: +r.toFixed(2), q, by: 'courier' });
    return r;
  }
}
