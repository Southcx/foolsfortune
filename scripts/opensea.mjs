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

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const seed0 = +opt('seed', 1), n = +opt('n', 10), hours = +opt('hours', 6), ship = opt('ship', 'sloop'), skill = +opt('skill', 0.5), sloppy = args.includes('--sloppy');
const O = ECON.openSea, AIM = ECON.perMinute * 60, ASPECTS = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread', null, null, null];
const HUNT = 0.25; // (a fight's spoils, its material, as a share of its class's hunt: the hunt's own worth includes finding it, and out here it finds you)
const T = { square: O.squareS, photo: 20, land: 90, look: 15, fix: 10, fight: 120, dock: 60 };
const phaseOf = (h) => { h %= 24; return h < 5 || h >= 19 ? 'night' : h < 7 ? 'dawn' : h < 17 ? 'day' : 'dusk'; };
const cheb = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));

const totals = { perHour: Array(hours).fill(0), fuelPerHour: Array(hours).fill(0), charted: [], found: 0, of: 0, tows: 0, fights: 0, lost: 0, plates: 0, drifts: 0, islets: 0, sea: 0, chartedAt: {} };
for (let seed = seed0; seed < seed0 + n; seed++) {
  const grid = seaGrid(seed), r = seeded(seed * 7919), v = newVoyage({ grid, ship, port: 'anagami' });
  const ports = Object.entries(grid.ports).filter(([id]) => id !== 'entra').map(([, sq]) => squareAt(grid, ...sq.split(',').map(Number)));
  const best = {}, of = grid.squares.reduce((k, s) => k + s.features.length, 0);
  let t = 0, earned = 0, spentBefore = 0, justDocked = false; totals.of += of; totals.sea += seaTotal(grid);
  const book = (cubes) => { const h = Math.min(hours - 1, Math.floor(t / 3600)); totals.perHour[h] += cubes; earned += cubes; };
  const here = () => squareAt(grid, ...v.at.split(',').map(Number));
  const nearestPort = (sq) => ports.reduce((a, p) => (cheb(sq, p) < cheb(sq, a) ? p : a), ports[0]);
  const ctx = () => { const gh = t / 150; return { phase: phaseOf(gh), weather: ASPECTS[Math.floor(gh / 3 + seed) % ASPECTS.length], front: frontAt(grid, seed, gh).has(v.at) }; };
  const step = (target) => {
    const c = ctx(), before = v.at, ev = sailTo(v, target, { r, phase: c.phase, weather: c.weather, gameDay: Math.floor(t / 3600) });
    t += T.square; if (ev.some((e) => e.type === 'sea.tow')) { totals.tows++; t += 300; }
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
console.log(`  fuel and tows an hour: ${totals.fuelPerHour.map((c) => f(c)).join(', ')}; tows ${(totals.tows / n).toFixed(1)}; drifts ${(totals.drifts / n).toFixed(1)}`);
console.log(`  found ${(totals.found / n).toFixed(1)} of ${(totals.of / n).toFixed(1)} features (islets landed ${(totals.islets / n).toFixed(1)}); plates paid ${(totals.plates / n).toFixed(1)}; fights ${(totals.fights / n).toFixed(1)} (${(totals.lost / n).toFixed(1)} broke off)`);
console.log(`  charted (squares, of): ${totals.charted.slice(0, 5).map((c) => c.slice(0, 2).join('/')).join('  ')}; the whole sea charted at ${Object.values(totals.chartedAt).map((h) => h.toFixed(1)).join(', ')} h`);
