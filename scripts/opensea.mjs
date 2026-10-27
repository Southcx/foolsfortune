// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S SIMULATOR (docs/plans/OPEN-SEA.md section 9): a bot sails the open sea from Anagami's port, charting the nearest
// square it can reach and still get home, photographing what it meets, landing on islets and fighting what hunts it, docking to report
// and refuel when the tank says so, until the sea is charted or the hours run out. It says what the open sea pays an hour against the
// aim (ECON.perMinute x 60), hour by hour (exploration is meant to be front-loaded and then to settle), what fuel and tows cost, and how
// much of the sea is found when (the phenomena keep their hours).
//
//   node scripts/opensea.mjs [--seed s] [--n voyages] [--hours h] [--ship sloop] [--skill 0..1] [--sloppy] (sloppy: never takes a fix)
// ---------------------------------------------------------------------------------------
import { ECON } from '../src/progress/econ/table.js';
import { seaGrid, squareAt, neighbours } from '../src/progress/opensea/seagrid.js';
import { seaTotal } from '../src/progress/opensea/discoveries.js';
import { sightings, platePay, EGREGORES } from '../src/progress/opensea/safari.js';
import { isletOf } from '../src/progress/opensea/islets.js';
import { newVoyage, sailTo, takeFix, dock, burnOf, frontAt } from '../src/progress/opensea/seatrip.js';
import { seeded } from '../src/core/rng.js';
import { herdsOf, herdFee, MIGRATION } from '../src/progress/opensea/migrations.js';
import { windAt, sailOf } from '../src/progress/opensea/wind.js';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const seed0 = +opt('seed', 1), n = +opt('n', 10), hours = +opt('hours', 6), ship = opt('ship', 'sloop'), skill = +opt('skill', 0.5), sloppy = args.includes('--sloppy');
const O = ECON.openSea, AIM = ECON.perMinute * 60, ASPECTS = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread', null, null, null];
const HUNT = 0.25; // (a fight's spoils, its material, as a share of its class's hunt: the hunt's own worth includes finding it, and out here it finds you)
const T = { square: O.squareS, photo: 20, land: 90, look: 15, fix: 10, fight: 120, dock: 60 };
const phaseOf = (h) => { h %= 24; return h < 5 || h >= 19 ? 'night' : h < 7 ? 'dawn' : h < 17 ? 'day' : 'dusk'; };
// A sailor who minds the wind (skill 0.5 and up): head to wind, two tacks 50 degrees either side, each leg 1/cos(50) as long (OPEN-SEA.md 14).
const wise = skill >= 0.5;
function tacked(yaw, hour, front) { let best = Infinity; for (const s of [-1, 1]) best = Math.min(best, sailOf(yaw + s * 0.87, windAt(seedNow, hour, { front })).burnK / Math.cos(0.87)); return best; }
let seedNow = 1;
const cheb = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));

const totals = { burnK: 0, steps: 0, perHour: Array(hours).fill(0), fuelPerHour: Array(hours).fill(0), charted: [], found: 0, of: 0, tows: 0, fights: 0, lost: 0, plates: 0, drifts: 0, islets: 0, sea: 0, chartedAt: {} };
for (let seed = seed0; seed < seed0 + n; seed++) {
  seedNow = seed;
  const grid = seaGrid(seed), r = seeded(seed * 7919), v = newVoyage({ grid, ship, port: 'anagami' });
  const ports = Object.entries(grid.ports).filter(([id]) => id !== 'entra').map(([, sq]) => squareAt(grid, ...sq.split(',').map(Number)));
  const best = {}, of = grid.squares.reduce((k, s) => k + s.features.length, 0);
  let t = 0, earned = 0, spentBefore = 0, justDocked = false; totals.of += of; totals.sea += seaTotal(grid);
  const book = (cubes) => { const h = Math.min(hours - 1, Math.floor(t / 3600)); totals.perHour[h] += cubes; earned += cubes; };
  const here = () => squareAt(grid, ...v.at.split(',').map(Number));
  const nearestPort = (sq) => ports.reduce((a, p) => (cheb(sq, p) < cheb(sq, a) ? p : a), ports[0]);
  const ctx = () => { const gh = t / 150; return { phase: phaseOf(gh), weather: ASPECTS[Math.floor(gh / 3 + seed) % ASPECTS.length], front: frontAt(grid, seed, gh).has(v.at) }; };
  const step = (target) => {
    const c = ctx(), before = v.at, from = here(), yaw = Math.atan2(target.col - from.col, target.row - from.row); // (the heading: columns along x, rows along z)
    const sail = sailOf(yaw, windAt(seed, t / 150, { front: c.front })), k = wise ? Math.min(sail.burnK, tacked(yaw, t / 150, c.front)) : sail.burnK; // (the wind: OPEN-SEA.md 14)
    const ev = sailTo(v, target, { r, phase: c.phase, weather: c.weather, gameDay: Math.floor(t / 3600), burnK: k });
    totals.burnK += k; totals.steps++;
    t += T.square / sail.speedK; if (ev.some((e) => e.type === 'sea.tow')) { totals.tows++; t += 300; }
    if (ev.some((e) => e.type === 'sea.drift')) totals.drifts++;
    const sq = here(), fresh = ev.some((e) => e.type === 'sea.chart');
    for (const e of ev) if (e.type === 'sea.find') { totals.found++; if (e.kind === 'islet') { const I = isletOf(sq.features.find((f) => f.id === e.id), seed); totals.islets++; t += T.land; book(I.secret === 'chest' ? 3 * ECON.perMinute : I.secret === 'nest' ? 2 * ECON.perMinute : ECON.perMinute); } else t += T.look; }
    if (fresh || r() < 0.3) for (const s of sightings(sq, c)) {
      if (r() > s.weight * 0.12) continue;
      const E = EGREGORES[s.id];
      if (E.disposition === 'hostile' || (E.disposition === 'territorial' && r() < 0.4)) { totals.fights++; t += T.fight * (1 + E.cls * 0.3); if (r() < 0.25 + 0.6 * skill - E.cls * 0.08) book(Math.round(ECON.hunt.minutes[E.cls] * ECON.perMinute * HUNT)); else { totals.lost++; t += 120; } }
      const stars = Math.max(1, Math.min(4, Math.round(1 + 3 * skill * r() + (r() < skill ? 1 : 0))));
      const pay = platePay(s.id, stars, best[s.id] || 0); if (pay) { best[s.id] = stars; book(pay); totals.plates++; }
      t += T.photo;
    }
    if (!sloppy && v.doubt >= 1 && !ctx().front) { takeFix(v, 'sky', { weather: ctx().weather }); t += T.fix; }
    return before !== v.at;
  };
  while (t < hours * 3600) {
    const sq = here(), home = nearestPort(sq), reserve = burnOf(ship) * (cheb(sq, home) + 2);
    const all = v.charted.size >= grid.squares.length; // (charted: the voyage turns to safari, wandering the wild squares for plates and hunts)
    if (all && !totals.chartedAt[seed]) totals.chartedAt[seed] = t / 3600;
    const targets = grid.squares.filter((s) => (all ? s.off >= 2 && s.id !== v.at && r() < 0.15 : !v.charted.has(s.id))).map((s) => ({ s, d: cheb(sq, s) })).filter(({ s, d }) => v.fuel - burnOf(ship) * (d + cheb(s, nearestPort(s)) + 2) >= 0).sort((a, b) => a.d - b.d || a.s.danger - b.s.danger);
    if (!targets.length || v.fuel < reserve) { // (home: walk to the port, report, refuel)
      while (here() !== home && t < hours * 3600) { const h = here(); step(neighbours(grid, h).reduce((a, b) => (cheb(b, home) < cheb(a, home) ? b : a))); }
      const ev = dock(v, home.port, Math.floor(t / 3600)); t += T.dock;
      const d = ev.find((e) => e.type === 'sea.dock'); book(d.paid);
      const hh = Math.min(hours - 1, Math.floor(t / 3600)); totals.fuelPerHour[hh] += v.spent - spentBefore; spentBefore = v.spent;
      if (!targets.length && justDocked) break; // (a full tank reaches nothing more: the sea is charted as far as this ship goes)
      justDocked = true; continue;
    }
    justDocked = false;
    const goal = targets[0].s, h = here();
    step(neighbours(grid, h).reduce((a, b) => (cheb(b, goal) < cheb(a, goal) ? b : a)));
  }
  totals.charted.push([v.charted.size, grid.squares.length, (t / 3600).toFixed(1)]);
}
const f = (x) => (x / n).toFixed(0);
console.log(`OPEN SEA x${n} (${ship}, skill ${skill}${sloppy ? ', no fixes' : ''}): the sea's finds worth ${f(totals.sea)} cubes (${(totals.sea / n / AIM).toFixed(1)} h of the aim)`);
console.log(`  pay an hour: ${totals.perHour.map((c, i) => `h${i + 1} ${f(c)} (${(c / n / AIM).toFixed(2)}x)`).join(', ')}`);
console.log(`  the wind: a square's burn ${(totals.burnK / totals.steps).toFixed(2)} of a no-sail square's (${wise ? 'tacking when it pays' : 'heedless'})`);
console.log(`  fuel and tows an hour: ${totals.fuelPerHour.map((c) => f(c)).join(', ')}; tows ${(totals.tows / n).toFixed(1)}; drifts ${(totals.drifts / n).toFixed(1)}`);
console.log(`  found ${(totals.found / n).toFixed(1)} of ${(totals.of / n).toFixed(1)} features (islets landed ${(totals.islets / n).toFixed(1)}); plates paid ${(totals.plates / n).toFixed(1)}; fights ${(totals.fights / n).toFixed(1)} (${(totals.lost / n).toFixed(1)} broke off)`);
console.log(`  charted (squares, of): ${totals.charted.slice(0, 5).map((c) => c.slice(0, 2).join('/')).join('  ')}; the whole sea charted at ${Object.values(totals.chartedAt).map((h) => h.toFixed(1)).join(', ')} h`);

// the migrations (OPEN-SEA.md 13): after the sea is charted, a sailor who works the dock's board, a game day (a real hour) at a time:
// from the nearest port to each herd, nearest first, a square at a time, and the time to photograph it. Herds' fees against the aim.
{ const S = ECON.openSea, G0 = seaGrid(1), port = G0.squares.find((q) => q.lane) || G0.squares[0], hourAim = ECON.perMinute * 60;
  let pay = 0, mins = 0, fuel = 0, n = 0, days = 200;
  for (let d = 0; d < days; d++) {
    let at = port, left = herdsOf(G0, d, 1).map((h) => ({ ...h, sq: G0.squares.find((q) => q.id === h.square) }));
    while (left.length) {
      left.sort((a, b) => Math.hypot(a.sq.col - at.col, a.sq.row - at.row) - Math.hypot(b.sq.col - at.col, b.sq.row - at.row));
      const h = left.shift(), steps = Math.abs(h.sq.col - at.col) + Math.abs(h.sq.row - at.row);
      mins += steps * S.squareS / 60 + 2; fuel += steps * S.burn * ECON.perMinute; pay += herdFee(h.cls); n++; at = h.sq; // (2 real minutes to come in slow and take the plate)
    }
    const back = Math.abs(port.col - at.col) + Math.abs(port.row - at.row); mins += back * S.squareS / 60; fuel += back * S.burn * ECON.perMinute;
  }
  const perHour = (pay - fuel) / (mins / 60);
  console.log(`\nMIGRATIONS (${MIGRATION.herds} herds a game day, share ${MIGRATION.share} of a hunt): a day's tour takes ${(mins / days).toFixed(1)} real min, pays ${Math.round(pay / days)} cubes, burns ${Math.round(fuel / days)} in fuel`);
  console.log(`  MEASURE migrations.net: ${Math.round(perHour)} cubes a real hour while touring = ${(perHour / hourAim).toFixed(2)}x the aim; a game day's herds ${Math.round((pay - fuel) / days)} net (${((pay - fuel) / days / hourAim).toFixed(2)}x an hour's aim), the want: about 0.4x an hour's aim a game day, less than fishing`); }

