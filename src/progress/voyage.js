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
//   .canBoard(from, to, ship) -> { ok, why?, hop? }   .board(from, to, ship, mounts?) -> { ok, why? } (mounts: two worn tools, progress/rail/mounts.js)   .stageResult(r) -> { lost, spilled }
//   .crossing() -> the crossing's script (progress/rail/crossing.js) while at sea   .continueCost(share) -> cubes   .continueRun(share) -> { ok, why?, cost? }
//   .reckon(from, to, share, q) -> share today   .reckoning(from, to) -> 0..1   .isOpen(node) -> bool
//   .bestOf(chart) -> { key, score, rank } | null (the day's best on this sea chart)   .recordBest(chart, score, rank) -> bool (PASSAGE.md 14.3)
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { NODES, hop, routeId, opensNode } from './econ/emocean.js';
import { spillChance } from './econ/islands.js';
import { script, continueCost, SHRINE_ISLAND, CONTINUE } from './rail/crossing.js';
import { LEVIATHAN, leviathanDeck, lootGrade } from './rail/setpieces.js';
import { rankOf, medalOf } from './rail/score.js';
import { loadout } from './rail/mounts.js';
import { boardKey, better } from './rail/trip.js';
import { deckDraw } from './econ/deck.js';
import { stageWx } from './weather.js';
import { crudeGrade } from './shop/catalogue.js';
import { today } from '../core/calendar.js';
import { stream } from '../core/rng.js';

const simRand = stream('progress/voyage'); // (a spill's chance: core/rng.js, the same twice)
const GRADES = Object.keys(ECON.crude.grades);
const fresh = () => ({ at: 'anagami', sailing: null, manifest: {}, reckon: {}, opened: {}, best: {} });

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
  board(from = this.s.at, to, ship = 'sloop', mounts = []) {
    const c = this.canBoard(from, to, ship);
    if (!c.ok) return c;
    if (!this.game.cubes.spend(c.hop.fuel, 'fuel')) return { ok: false, why: `The crossing burns ${c.hop.fuel} cubes of fuel.` };
    // the crossing's set piece is settled at the pier (progress/rail/crossing.js): the Leviathan's deck is drawn here, once a crossing,
    // so it comes within its count; the pirates read the casks aboard as they cast off; the weather of the island left behind is kept
    const wx = stageWx(from), aspect = this.game.weather?.at?.(from)?.aspect || null;
    const leviathan = this.game.ledger ? deckDraw(this.game.ledger, 'emocean.leviathan', leviathanDeck(c.hop.danger + wx.danger, aspect)) : false;
    const worn = (this.game.belt?.tools || []).map((t) => t.id).filter((id) => this.game.belt.isWorn(id)); // (the tools that can be mounted: the ones worn)
    this.s.sailing = { from, to, ship, day: today(), casks: this.casks(), leviathan, wx, mounts: loadout(mounts, worn) };
    const plan = this.crossing();
    this.s.sailing.setPiece = plan?.setPiece || 'shoal'; this.s.sailing.setPieces = plan?.setPieces || ['shoal'];
    this.dirty();
    this.game.events.emit('emocean.hop', { from, to, ship, fuel: c.hop.fuel, mounts: this.s.sailing.mounts, by: 'courier' });
    this.game.events.emit('emocean.setpiece', { from, to, setPiece: this.s.sailing.setPiece, setPieces: this.s.sailing.setPieces, by: 'environment' });
    return { ok: true, hop: c.hop };
  }
  /** THE CONTINUE (progress/rail/crossing.js): what a coin costs now, the ship `share` (0..1) of the way across, priced by the way back
   *  to the island of the last Shrine rested at; and paying it (refused, with the reason, when the purse is short). */
  continueCost(share = 0) {
    const V = this.s.sailing;
    return V ? continueCost(V.from, V.to, share, this.game.shrines?.last || 'bisque', V.continues || 0) : 0;
  }
  continueRun(share = 0) {
    const V = this.s.sailing, cost = this.continueCost(share);
    if (!V) return { ok: false, why: 'You are not at sea.' };
    if (!this.game.cubes?.spend(cost, 'continue')) return { ok: false, why: `A continue costs ${cost} cubes.` };
    V.continues = (V.continues || 0) + 1; this.dirty();
    this.game.events.emit('emocean.continue', { cost, continues: V.continues, share: +share.toFixed(2), by: 'courier' });
    return { ok: true, cost };
  }
  /** The crossing as it will play (Petra's rail reads this: its acts, views, swings, beats and waves): progress/rail/crossing.js script. */
  crossing() {
    const V = this.s.sailing;
    return V ? script(V.from, V.to, V.day, { casks: V.casks, leviathan: V.leviathan, wx: V.wx, open: (id) => this.isOpen(id) }) : null;
  }

  /** The stage is over (Petra's rail calls this with the run): a failed one costs cargo and may spill; either way the ship makes port.
   *  The run: { passed, hits, bears, downed, spawned, score, chainBest, volleyBest, parried, absorbed, rolls, pointBlank, end, won, stolen }
   *  (end: the set piece's: 'scattered' | 'sunk' | 'struck' | 'limped' | 'driven' | 'felled'; won: casks gathered from the pirates' loot;
   *  stolen: casks the boarders took). The rank and the medal are worked out here (progress/rail/score.js). */
  stageResult({ passed = true, hits = 0, bears = 6, downed = 0, spawned = 0, score = 0, chainBest = 0, volleyBest = 0, parried = 0, absorbed = 0, rolls = 0, pointBlank = 0, end = null, won = 0, stolen = 0 } = {}) {
    const V = this.s.sailing;
    if (!V) return { lost: 0, spilled: false };
    let lost = 0, spilled = false;
    // the pirates: what the boarders took goes first (the dearest grade: a thief knows the cargo), then what was gathered of their loot
    const took = stolen;
    if (stolen > 0) for (const g of [...GRADES].sort((a, b) => ECON.crude.grades[b].worth - ECON.crude.grades[a].worth)) { const n = Math.min(stolen, this.cargo()[g] || 0); if (n) { this.lose(g, n); stolen -= n; lost += n; } }
    const lootG = won > 0 ? lootGrade(V.from, routeId(V.from, V.to), V.day) : null;
    for (let i = 0; i < won; i++) if ((this.game.pneuka?.add(`cask.${lootG}`, 'loot') ?? -1) >= 0) (this.s.manifest[lootG] ||= []).push({ from: 'pirates', paid: 0 });
    // the Leviathan: a shard of Lachrymite driven off, three felled
    const shards = end === 'felled' ? LEVIATHAN.pay.felled : end === 'driven' ? LEVIATHAN.pay.driven : 0;
    for (let i = 0; i < shards; i++) this.game.pneuka?.add('mat.shard', 'loot');
    if (!passed) {
      const S = ECON.ships[V.ship] || {};
      for (const [g, n] of Object.entries(this.cargo())) {
        let gone = Math.floor(n * ECON.emocean.lose);
        if (simRand() < spillChance(g, n - gone, S.hull ?? 1)) { gone = n; spilled = true; }
        if (gone) { this.lose(g, gone); lost += gone; }
      }
    }
    // a crossing failed (no continue taken) breaks the ship up: you are made whole at your last Shrine, on its island (the shatter's
    // rule: courier/vessel/death.js), not at the far port
    const home = SHRINE_ISLAND[this.game.shrines?.last] || 'anagami';
    this.s.at = passed ? V.to : home; this.s.sailing = null;
    this.dirty();
    const continues = V.continues || 0, setPieces = V.setPieces || [V.setPiece || 'shoal'], setPiece = setPieces[setPieces.length - 1];
    const ranked = rankOf(score, setPiece), rank = continues && 'SAB'.includes(ranked) ? CONTINUE.rankCap : ranked; // (a coin-fed run tops out at C)
    const medal = !continues && medalOf({ passed, downed, spawned });
    this.game.events.emit('emocean.stage', { from: V.from, to: V.to, passed, hits, bears, downed, spawned, lost, spilled, setPiece, setPieces, continues, at: this.s.at, end, score, rank, medal,
      chainBest, volleyBest, parried, absorbed, rolls, pointBlank, won, stolen: took, shards, by: 'courier' });
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

  // ---------------------------------------------------------------- the day's best (PASSAGE.md 14.3: one sea chart a route a game day)
  /** The best run on this sea chart (its route and game day), or null: what the Glass races, what a rutter's score is weighed against. */
  bestOf(chart) { const b = this.s.best[chart.route]; return b && b.key === boardKey(chart) ? b : null; }
  /** A passage sailed to its end: kept when it is the first on this sea chart or beats the one kept (another game day's is replaced). */
  recordBest(chart, score, rank = null) {
    if (!better(this.s.best[chart.route], chart, score)) return false;
    const was = this.bestOf(chart);
    this.s.best[chart.route] = { key: boardKey(chart), score, rank };
    this.dirty();
    this.game.events.emit('passage.best', { route: chart.route, day: chart.day, score, rank, beat: was?.score ?? null, by: 'courier' });
    return true;
  }
}
