// ---------------------------------------------------------------------------------------
// THE OPEN SEA, THE ROOM (docs/plans/OPEN-SEA.md; the owner, 2026-10-20: "let's start building the open Emocean"): the Emocean off the
// lanes, sailed at a free helm, a safari. Dovina's room, as the Raceway and the bazaar are. It is the grid of progress/opensea/seagrid.js
// laid on the water far east of the Raceway (seaprops.js: SEA), its features as placeholders, its three ports' quays on the lanes, and the
// ship you sail (helm.js). The rules are the voyage's (progress/opensea/seatrip.js): every square you sail into burns fuel and is charted,
// what is in it is found (a phenomenon only at its hour), a dock takes your reports for their fees and fills the tank, a dry tank is towed
// to the lane. Lost (doubt), the current pushes you off your line; a charted landmark in sight or the sky read (R) fixes you.
// LANDING (the owner: in the first pass): sail near an islet and press F: the ship moors and you step off onto it, walk it, take its one
// secret (F at it); F at the ship's side boards again. At a quay F docks: the reports are paid, the tank is filled and paid for, and you
// can step ashore; F at the quay's post goes home (the workshop).
// The sea and the sky are the Emocean's (render/zonemap.js openSea: the crude sea shown and followed; the dunes' sky and far plane).
//
// Prior art: The Legend of Zelda: The Wind Waker (the Great Sea charted square by square, an islet a square, the King of Red Lions
// moored at its shore); Sunless Sea (fuel and the dark, port reports); Sea of Thieves (the sloop moored, the crew stepping off).
//
//   game.opensea = new OpenSea(game)   .active   .sailing   .arrive(island = 'anagami')   .respawn()   .update(dt)   .grid   .voyage   .helm   .seed
//   events (each with `by`): opensea.enter, opensea.board, opensea.moor { islet? quay? }, sea.* (seatrip.js), sea.secret { kind }, sea.fuel.low,
//   sea.stele { islet, words, line }, seaserpent.paid { cubes, hull, of }  (a serpent sunk: progress/opensea/seaserpent.js serpentPay); the islets' puzzles and caches: puzzlepieces.js (`.pieces`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf } from '../../render/zonemap.js';
import { ECON } from '../../progress/econ/table.js';
import { seaGrid, squareAt } from '../../progress/opensea/seagrid.js';
import { noticed } from '../../progress/opensea/discoveries.js';
import { newVoyage, sailTo, takeFix, dock, tow, burnOf, frontAt } from '../../progress/opensea/seatrip.js';
import { SHIPS } from '../../progress/rail/ships.js';
import { serpentPay } from '../../progress/opensea/seaserpent.js';
import { phaseAt } from '../../progress/weather.js';
import { today, now } from '../../core/calendar.js';
import { stream } from '../../core/rng.js';
import { buildSeaProps, squareCentre, SEA } from './seaprops.js';
import { Helm } from './helm.js';
import { SeaHud } from './seahud.js';
import { PuzzlePieces } from './puzzlepieces.js';
import { steleWords } from '../../progress/opensea/isletpuzzles.js';
import { WORD_SPLIT } from '../../progress/ostraca.js';
import { FUNCTIONS } from '../../tools/veritome/mind/functions.js';

const G = ECON.openSea.grid, seedRand = stream('opensea/seed');
/** reach: how near (m) to the ship's side F boards it; moor: how near an islet's shore the ship may moor; quay: how near a quay F docks;
 *  secret: how near an islet's secret F takes it; current: m a real s the current pushes a square of doubt; edge: m past the grid the sea pushes back. */
export const ROOM = { reach: 8, moor: 22, quay: 40, secret: 2.6, current: 0.5, edge: 120, lowFuel: 3 };
const _v = new THREE.Vector3();
const freshPuzzle = (d = {}) => ({ seen: new Set(d.seen || []), solved: new Set(d.solved || []), heard: new Set(d.heard || []), dug: new Set(d.dug || []) });

export class OpenSea {
  constructor(game) {
    this.game = game; this.built = false; this.sailing = false; this.moored = null; this.claimed = new Set(); this.lowSaid = false; this.puzzle = freshPuzzle();
    this.seed = 1 + Math.floor(seedRand() * 1e9);
    game.save?.section('openSeaSeed', { scope: 'world', version: 1, dump: () => ({ seed: this.seed }), load: (d) => { if (d?.seed) this.seed = d.seed; }, reset: () => {} });
    this.grid = seaGrid(this.seed);
    this.voyage = newVoyage({ grid: this.grid, port: 'anagami' });
    game.save?.section('openSea', { scope: 'player', version: 1, dump: () => this.dump(), load: (d) => this.load(d), reset: () => this.load(null) });
    // a serpent the Courier sank pays by the hull kept (seaserpent.js serpentPay; Petra's fight: world/opensea/seafight.js)
    game.events?.on?.('seaserpent.down', (e) => {
      if (e.by !== 'courier') return;
      const of = SHIPS[this.helm?.ship || 'sloop']?.bears ?? 6, hull = game.seaFight?.hull ?? of, cubes = serpentPay(hull, of);
      game.cubes?.earn(cubes, 'serpent'); game.events?.emit('seaserpent.paid', { cubes, hull, of, by: 'courier' });
    });
  }
  get active() { return this.sailing || zoneOf(this.game.player.pos) === 'opensea'; }

  dump() {
    const v = this.voyage;
    return { at: v.at, fuel: v.fuel, doubt: v.doubt, charted: [...v.charted], found: [...v.found], reported: [...v.reported], claimed: [...this.claimed],
      puzzle: Object.fromEntries(Object.entries(this.puzzle).map(([k, set]) => [k, [...set]])) };
  }
  load(d) {
    this.voyage = newVoyage({ grid: this.grid, port: 'anagami' });
    this.claimed = new Set(d?.claimed || []); this.puzzle = freshPuzzle(d?.puzzle); this.pieces?.sync();
    if (!d) return;
    const v = this.voyage; v.at = d.at || v.at; v.fuel = d.fuel ?? v.fuel; v.doubt = d.doubt ?? 0;
    v.charted = new Set(d.charted || [v.at]); v.found = new Map(d.found || []); v.reported = new Set(d.reported || []);
  }
  dirty() { this.game.save?.dirty?.('openSea'); }

  build() {
    if (this.built) return; this.built = true;
    this.props = buildSeaProps(this);
    this.helm = new Helm(this, 'sloop');
    this.hud = new SeaHud(this);
    this.pieces = new PuzzlePieces(this); // (the islets' puzzles and the buried caches: puzzlepieces.js)
    const q = this.props.quays.anagami; this.helm.placeAt(q.pos.clone().setY(SEA.y).add(_v.set(0, 0, 16)), Math.PI / 2);
  }

  /** From the Index, a pier (Petra's: world/emocean/pier.js) or the respawn: onto that island's quay (Anagami's if it has none on this
   *  sea), the ship moored beside it, the voyage standing in its square. */
  arrive(island = 'anagami') {
    const g = this.game; this.build();
    if (this.sailing) this.unseal();
    if (!this.props.quays[island]) island = 'anagami';
    const q = this.props.quays[island];
    if (q.square) { this.voyage.at = q.square; this.voyage.charted.add(q.square); this.dirty(); }
    this.helm.placeAt(q.pos.clone().setY(SEA.y).add(_v.set(0, 0, 16)), Math.PI / 2); // (moored off the quay's seaward side)
    this.moored = { quay: island };
    g.player.killY = SEA.y - 90;
    g.course?.teleport(q.pos.clone().add(_v.set(0, 0.05, 5)), 0); // (at the quay's edge, the ship before you)
    g.events?.emit('opensea.enter', { by: 'courier' });
  }
  respawn() { this.arrive(); }

  // ---------------------------------------------------------------- sealing in and stepping off
  board() {
    const g = this.game; this.sailing = true; this.moored = null;
    g.character?.setHidden(true);
    for (const t of g.belt?.tools || []) if (t.wants || t.drawT > 0) t.stow();
    g.events?.emit('opensea.board', { by: 'courier' });
  }
  unseal() {
    const g = this.game; this.sailing = false; g.cinema?.cut('opensea'); g.character?.setHidden(false); this.helm.speed = 0; this.helm.throttle = 0;
  }
  /** Moor beside an islet or a quay and step off onto it. */
  stepOff(onto, pos, yaw) {
    const g = this.game; this.unseal(); this.moored = onto;
    g.player.killY = SEA.y - 90;
    g.course?.teleport(pos, yaw, { keepPool: true });
    g.events?.emit('opensea.moor', { ...onto, by: 'courier' });
  }

  // ---------------------------------------------------------------- each frame
  update(dt) {
    if (!this.built || !this.active) { this.hud?.show(false); return; }
    const g = this.game, I = g.input, P = g.player;
    this.hud.show(true);
    if (this.sailing) this.sail(dt, I, P); else this.walk(I, P);
    this.phenomena(dt);
    this.pieces.update(dt);
    this.hud.update(dt);
  }

  sail(dt, I, P) {
    const g = this.game, v = this.voyage, H = this.helm;
    const sq = this.squareAt(H.pos), cur = sq ? this.currentAt(sq) : null;
    H.update(dt, I, cur);
    this.keepIn(H);
    this.bump(H);
    H.camera(dt, I); H.hold(P);
    const now2 = this.squareAt(H.pos);
    if (now2 && now2.id !== v.at) this.enter(now2, H.full);
    if (I.wasPressed('KeyR')) this.emit(takeFix(v, 'sky', { front: frontAt(this.grid, this.seed, now() / 150000).has(v.at) })), this.dirty();
    if (I.wasPressed('KeyF')) {
      const isl = this.nearIslet(H.pos, ROOM.moor);
      const quay = Object.entries(this.props.quays).find(([, q]) => q.pos.distanceTo(_v.copy(H.pos).setY(q.top)) < ROOM.quay);
      if (quay) this.dockAt(quay[0], quay[1]);
      else if (isl) { const d = _v.copy(H.pos).sub(isl.pos).setY(0).normalize(); H.pos.copy(isl.pos).addScaledVector(d, isl.r + 5).setY(SEA.y); H.pose(0); this.stepOff({ islet: isl.feature.id, kit: isl.islet?.kit }, isl.pos.clone().addScaledVector(d, isl.r - 1.5).setY(isl.top + 0.05), Math.atan2(-d.x, -d.z)); }
      else g.log?.say?.('info', 'Nothing to moor to here.', { key: 'sea.moor', throttle: 3 });
    }
  }

  walk(I, P) {
    const g = this.game, H = this.helm;
    H.pose(0);
    if (!P.latch?.('KeyF') && !I.wasPressed('KeyF')) return;
    if (this.pieces.interact(P)) return; // (the Dreamvane in hand, on a buried cache: dig)
    if (P.pos.distanceTo(_v.copy(H.pos).setY(P.pos.y)) < ROOM.reach + (H.look.length ?? 7) / 2) return this.board();
    const isl = this.props.islets.find((i) => i.secret.pos.distanceTo(_v.copy(P.pos).setY(i.top)) < ROOM.secret);
    if (isl) return this.claim(isl);
    const home = Object.entries(this.props.quays).find(([, q]) => q.open && q.post.distanceTo(_v.copy(P.pos).setY(q.post.y)) < 3);
    if (home) { const go = () => g.places?.travel?.('workshop'); g.seam?.cross(go) || go(); }
  }

  /** Into a new square: the voyage's step (fuel, charting, finds), with no teleporting drift: here the current is the drift. */
  enter(sq, full) {
    const v = this.voyage, ev = sailTo(v, sq, { full, r: () => 1, phase: phaseAt(), gameDay: today() });
    const t = ev.find((e) => e.type === 'sea.tow'); if (t) { this.game.cubes?.spend(Math.min(t.fee, this.game.cubes.balance ?? 0), 'tow'); this.emit(ev); return this.towed(); }
    this.emit(ev); this.dirty();
    if (v.fuel < burnOf(this.helm.ship) * ROOM.lowFuel && !this.lowSaid) { this.lowSaid = true; this.game.events?.emit('sea.fuel.low', { fuel: v.fuel, by: 'courier' }); }
  }
  towed() {
    const g = this.game, v = this.voyage, [c, r] = v.at.split(',').map(Number);
    const go = () => { this.helm.placeAt(squareCentre(c, r), this.helm.yaw); };
    g.seam?.cross(go, { kind: 'sea' }) || go();
  }
  dockAt(island, q) {
    const g = this.game, v = this.voyage;
    if (!q.open) return g.log?.say?.('warn', 'The harbour is closed.', { key: 'sea.closed', throttle: 3 });
    const fuelBefore = v.fuel, ev = dock(v, island, today()), d = ev.find((e) => e.type === 'sea.dock');
    if (d.paid > 0) g.cubes?.earn(d.paid, 'report');
    if (d.fuelCost > 0 && !g.cubes?.spend(d.fuelCost, 'fuel')) { // (short of cubes: as many measures as you can pay for)
      const per = ECON.openSea.measureMin * ECON.perMinute, can = Math.floor((g.cubes?.balance ?? 0) / per);
      v.fuel = Math.min(SHIPS[this.helm.ship].tank, fuelBefore + can); if (can > 0) g.cubes?.spend(Math.round(can * per), 'fuel');
      d.fuelCost = Math.round(can * per); d.short = true;
    }
    this.lowSaid = false; this.emit(ev); this.dirty();
    this.helm.placeAt(q.pos.clone().setY(SEA.y).add(_v.set(0, 0, 16)), this.helm.yaw);
    this.stepOff({ quay: island }, q.pos.clone().add(_v.set(0, 0.05, 5)), 0);
  }
  claim(isl) {
    const g = this.game, id = isl.feature.id;
    if (isl.secret.kind === 'stele') return this.readStele(isl);
    if (this.claimed.has(id)) return g.log?.say?.('info', 'You already took what was here.', { key: 'sea.secret', throttle: 2 });
    this.claimed.add(id); isl.secret.mesh.visible = false;
    if (isl.secret.kind === 'chest') g.cubes?.earn(3 * ECON.perMinute, 'chest');
    if (isl.secret.kind === 'fuel') this.voyage.fuel = Math.min(SHIPS[this.helm.ship].tank, this.voyage.fuel + 3);
    g.events?.emit('sea.secret', { kind: isl.secret.kind, islet: id, by: 'courier' }); this.dirty();
  }

  /** A sea stele: three of the ostraca's words in a line, glossed as far as you know them (read again as often as you like). */
  readStele(isl) {
    const g = this.game, id = isl.feature.id, words = steleWords(id, this.seed, WORD_SPLIT(FUNCTIONS).ostraca);
    if (!this.claimed.has(id)) { this.claimed.add(id); g.events?.emit('sea.secret', { kind: 'stele', islet: id, by: 'courier' }); this.dirty(); }
    g.events?.emit('sea.stele', { islet: id, words, line: g.ostraca?.glossLine?.(words) ?? words.join(' ').toUpperCase(), by: 'courier' });
  }

  // ---------------------------------------------------------------- the sea's own rules
  squareAt(p) {
    const c = Math.round((p.x - SEA.x) / SEA.square + (G.cols - 1) / 2), r = Math.round((p.z - SEA.z) / SEA.square + G.lane);
    return squareAt(this.grid, c, r);
  }
  /** The current where you are lost: a square's own direction, as strong as your doubt. */
  currentAt(sq) {
    const d = this.voyage.doubt; if (d <= 0) return null;
    const a = ((sq.col * 92821) ^ (sq.row * 68917) ^ this.seed) % 628 / 100;
    return _v.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(ROOM.current * d).clone();
  }
  /** The sea's edge: past the grid the swell turns you back. */
  keepIn(H) {
    const hx = (G.cols / 2) * SEA.square + ROOM.edge, hz = (G.rows / 2) * SEA.square + ROOM.edge;
    const dx = H.pos.x - SEA.x, dz = H.pos.z - SEA.z;
    if (Math.abs(dx) > hx || Math.abs(dz) > hz) { H.pos.x = SEA.x + Math.max(-hx, Math.min(hx, dx)); H.pos.z = SEA.z + Math.max(-hz, Math.min(hz, dz)); H.speed *= 0.5; this.game.log?.say?.('info', 'The swell turns you back.', { key: 'sea.edge', throttle: 6 }); }
  }
  /** A hull on an islet's shore or a quay stops short: no sailing through land. */
  bump(H) {
    const hit = (c, r) => { const d = _v.copy(H.pos).sub(c).setY(0), n = d.length(); if (n < r) { d.multiplyScalar((r - n) / Math.max(n, 1e-3)); H.pos.add(d); H.speed *= 0.2; return true; } return false; };
    for (const i of this.props.islets) hit(i.pos, i.r + 4);
    for (const q of Object.values(this.props.quays)) hit(q.pos, 15);
  }
  nearIslet(p, reach) { let best = null, bd = Infinity; for (const i of this.props.islets) { const d = Math.hypot(p.x - i.pos.x, p.z - i.pos.z) - i.r; if (d < reach && d < bd) { bd = d; best = i; } } return best; }
  phenomena(dt) {
    if ((this.phT = (this.phT || 0) - dt) > 0) return; this.phT = 2;
    const phase = phaseAt();
    for (const m of this.props.marks) if (m.when) m.mesh.visible = noticed(m.feature, { phase });
  }
  emit(events) { for (const e of events) { const { type, ...rest } = e; this.game.events?.emit(type, rest); } }
}
