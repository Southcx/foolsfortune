// ---------------------------------------------------------------------------------------
// A VOYAGE ON THE OPEN SEA (docs/plans/OPEN-SEA.md section 3): the state of a ship off the lanes and the pressures on it, as pure
// functions the free helm (Petra's), the map and the simulator all call. Three things make it a voyage and not a drive:
//   FUEL is the clock: every square burns the ship's measures (more at full sail); a dry tank is towed to the nearest lane for a fee.
//   DOUBT is getting lost: a square sailed with no fix adds doubt (dead reckoning); with doubt, a step may end a square off (the current),
//     and the map shows you only to within it. A landmark you have charted (an islet, a monument, a port) fixes you on sight; reading
//     the sky (the Dreamvane) fixes you under a clear one. The skill taught is real: dead reckoning and taking a fix.
//   FRONTS are the weather out here: a squall line walks the sea a column a game hour; inside it the sea is a class wilder and the sky
//     cannot be read (LORE.md: Figments come out of a front a class bigger).
// The safari (safari.js) and the finds (discoveries.js) are what a voyage is for; a dock (an island's port) takes the reports and
// sells fuel.
//
// Prior art: Sunless Sea (fuel and the dark as the clock, port reports); FTL's fuel; The Legend of Zelda: The Wind Waker (the sea chart
// filled square by square); real dead reckoning (a position carried forward from the last fix, its doubt growing with the distance).
//
//   newVoyage({ grid, ship, port, fuel? }) -> voyage   burnOf(ship, full) -> measures a square at no sail   sailTo(v, square, { full, r, burnK }) -> events
//   takeFix(v, how) -> events ('landmark' | 'sky')   dock(v, island, gameDay) -> events (reports paid, the tank filled and paid for)
//   tow(v) -> events   frontAt(grid, seed, gameHour) -> Set(square ids)   v = { at, fuel, doubt, charted, found, reported, cubes, spent }
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { SHIPS } from '../rail/ships.js';
import { neighbours, squareAt } from './seagrid.js';
import { discoveryFee, noticed } from './discoveries.js';
import { stream } from '../../core/rng.js';

const seaRand = stream('opensea/voyage');

const O = ECON.openSea;
const measure = () => O.measureMin * ECON.perMinute;

export const burnOf = (ship = 'sloop', full = false) => O.burn * (SHIPS[ship]?.burn ?? 1) * (full ? O.full : 1);

/** A voyage cast off from an island's port with a full tank (or `fuel` measures). */
export function newVoyage({ grid, ship = 'sloop', port = 'anagami', fuel = null }) {
  const at = grid.ports[port];
  return { grid, ship, at, fuel: fuel ?? SHIPS[ship].tank, doubt: 0, charted: new Set([at]), found: new Map(), reported: new Set(), cubes: 0, spent: 0, squares: 0 };
}

/** One step to a neighbouring square: the fuel burnt, the current's say if you are unsure where you are, the square charted. */
export function sailTo(v, target, { full = false, r = seaRand, phase = 'day', weather = null, gameDay = 0, burnK = 1 } = {}) {
  const events = [], from = squareAt(v.grid, ...v.at.split(',').map(Number));
  const b = burnOf(v.ship, full) * burnK; // (burnK: the share of the square the wind did not carry, wind.js sailOf)
  if (v.fuel < b) return tow(v);
  v.fuel -= b; v.squares++;
  let to = target;
  if (v.doubt >= 1 && r() < Math.min(0.5, v.doubt * 0.25)) { const near = neighbours(v.grid, target).filter((s) => s !== from); to = near[Math.floor(r() * near.length)] || target; events.push({ type: 'sea.drift', from: target.id, to: to.id, by: 'environment' }); }
  v.at = to.id;
  const fresh = !v.charted.has(to.id);
  v.charted.add(to.id);
  if (fresh) events.push({ type: 'sea.chart', square: to.id, by: 'courier' });
  for (const f of to.features) if (!v.found.has(f.id) && !v.reported.has(f.id) && noticed(f, { phase, weather })) { v.found.set(f.id, { tier: f.tier, kind: f.kind, gameDay }); events.push({ type: 'sea.find', id: f.id, kind: f.kind, tier: f.tier, by: 'courier' }); }
  const landmark = to.port || to.features.some((f) => f.kind === 'islet' || f.kind === 'monument');
  if (landmark && !fresh) events.push(...takeFix(v, 'landmark'));
  else v.doubt = Math.min(O.fix.max, v.doubt + O.fix.drift);
  return [{ type: 'sea.sail', from: from.id, to: to.id, fuel: v.fuel, full, by: 'courier' }, ...events];
}

/** A fix: a charted landmark in sight, or the sky read (not inside a front, not under grief or dread's overcast). Doubt goes to nothing. */
export function takeFix(v, how = 'sky', { front = false, weather = null } = {}) {
  if (how === 'sky' && (front || weather === 'grief' || weather === 'dread')) return [{ type: 'sea.fix', ok: false, how, by: 'courier' }];
  v.doubt = 0;
  return [{ type: 'sea.fix', ok: true, how, by: 'courier' }];
}

/** Into an island's port: every find reported for its fee (less for the game days it waited), the tank filled and paid for. */
export function dock(v, island, gameDay = 0) {
  const events = [];
  let paid = 0;
  for (const [id, f] of v.found) { const fee = discoveryFee(f.tier, gameDay - f.gameDay); paid += fee; v.reported.add(id); events.push({ type: 'sea.report', id, tier: f.tier, fee, by: 'courier' }); }
  v.found.clear();
  const need = SHIPS[v.ship].tank - v.fuel, cost = Math.round(need * measure());
  v.fuel = SHIPS[v.ship].tank; v.cubes += paid; v.spent += cost; v.doubt = 0;
  v.at = v.grid.ports[island] ?? v.at;
  events.push({ type: 'sea.dock', island, paid, fuelCost: cost, by: 'courier' });
  return events;
}

/** Dry: the current and a passing tug take the ship to the nearest lane square, for a fee (a drain, never a shatter). */
export function tow(v) {
  const [c] = v.at.split(',').map(Number), lane = squareAt(v.grid, c, v.grid.lane);
  const fee = Math.round(O.towMin * ECON.perMinute);
  v.at = lane.id; v.spent += fee; v.fuel = Math.max(v.fuel, burnOf(v.ship) * 2); v.doubt = 0;
  return [{ type: 'sea.tow', to: lane.id, fee, by: 'environment' }];
}

/** The squall line at a game hour: a band two columns wide walking from the Chaos edge to the Law edge and round again, off the lanes. */
export function frontAt(grid, seed = 1, gameHour = 0) {
  const span = grid.cols + 2, head = (grid.cols - 1) - ((Math.floor(gameHour) + (seed % span)) % span), out = new Set();
  for (const s of grid.squares) if (!s.lane && (s.col === head || s.col === head + 1)) out.add(s.id);
  return out;
}
