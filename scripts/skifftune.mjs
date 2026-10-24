// ---------------------------------------------------------------------------------------
// THE SKIFF'S RULER, PRINTED (docs/plans/SKIFF-TUNING.md T3): each Raceway track's reference lap on the stock board, every part and every
// slider's ends costed in PI, the sheet's corners searched for the best on each track, and the medal times the reference implies.
// `node scripts/skifftune.mjs`. The model is progress/skiffruler.js; the sheet progress/skifftune.js; the parts progress/skiffparts.js.
// ---------------------------------------------------------------------------------------
import { park } from '../src/world/raceway/park.js';
import { refLap } from '../src/progress/skiffruler.js';
import { TUNE, tuneMult, piOf } from '../src/progress/skifftune.js';
import { PARTS } from '../src/progress/skiffparts.js';
const RACE = { medals: { gold: 255, silver: 285, bronze: 330 } }; // (world/raceway/race.js RACE.medals, the Sun Circuit's three laps: race.js loads the scene, so kept equal by hand)

const P = park(), tracks = P.tracks;
const fx = (n, d = 1) => n.toFixed(d), pad = (s, n) => String(s).padEnd(n);
const lapOf = (Tk, mult) => refLap(Tk, mult, { race: true }).seconds, flyOf = (Tk, mult) => refLap(Tk, mult).seconds;
const stock = Object.fromEntries(tracks.map((Tk) => [Tk.id, lapOf(Tk)]));

console.log('the reference (stock board, carving every bend, no flare): a flying lap, and a race (three laps, a standing start, knocks)\n');
for (const Tk of tracks) { const r = refLap(Tk); const race = refLap(Tk, undefined, { race: true }).seconds; const tr = r.trace; let lo = 99, hi = 0, sum = 0; for (const x of tr) { lo = Math.min(lo, x); hi = Math.max(hi, x); sum += x; } console.log(`${pad(Tk.name || Tk.id, 18)} ${fx(Tk.length, 0)} m   flying ${fx(r.seconds, 2)} s   race ${fx(race, 1)} s   speed ${fx(lo)} .. ${fx(hi)} m/s, mean ${fx(sum / tr.length)}`); }

const stockFly = Object.fromEntries(tracks.map((Tk) => [Tk.id, flyOf(Tk)]));
console.log('\nthe parts, in PI on each track (100 = stock): the race, and in brackets the flying lap');
console.log(pad('', 18) + tracks.map((Tk) => pad(Tk.id, 16)).join(''));
for (const [id, Pt] of Object.entries(PARTS)) { if (id.endsWith('.standard')) continue; const mk = (k) => Pt.mult[k] ?? 1; console.log(pad(id, 18) + tracks.map((Tk) => pad(`${fx(piOf(lapOf(Tk, mk), stock[Tk.id]))} (${fx(piOf(flyOf(Tk, mk), stockFly[Tk.id]))})`, 16)).join('')); }

console.log('\nthe sliders, each end alone, in PI');
for (const [id, S] of Object.entries(TUNE.sliders)) for (const v of [-TUNE.range, TUNE.range]) {
  const sheet = { [id]: v };
  const mk = (k) => tuneMult(sheet, k);
  console.log(pad(`${id} ${v > 0 ? '+' : ''}${v}`, 18) + tracks.map((Tk) => pad(`${fx(piOf(lapOf(Tk, mk), stock[Tk.id]))} (${fx(piOf(flyOf(Tk, mk), stockFly[Tk.id]))})`, 16)).join('') + `  ${v > 0 ? S.plus : S.minus}`);
}

// every corner of the sheet (each slider at -3, 0 or +3: 243 sheets), the best on each track
const ids = Object.keys(TUNE.sliders), corners = [];
for (let c = 0; c < 3 ** ids.length; c++) { const sheet = {}; let x = c; for (const id of ids) { sheet[id] = [-TUNE.range, 0, TUNE.range][x % 3]; x = Math.floor(x / 3); } corners.push(sheet); }
console.log('\nthe sheet\'s corners (243), the best PI on each track, and the best one sheet over all three (the mean)');
let bestAll = null;
const scored = corners.map((sheet) => { const pis = tracks.map((Tk) => piOf(lapOf(Tk, (k) => tuneMult(sheet, k)), stock[Tk.id])); const mean = pis.reduce((a, b) => a + b, 0) / pis.length; if (!bestAll || mean > bestAll.mean) bestAll = { sheet, pis, mean }; return { sheet, pis }; });
const show = (sh) => ids.map((id) => `${id.slice(0, 2)}${sh[id] > 0 ? '+' : sh[id] < 0 ? '-' : '0'}`).join(' ');
tracks.forEach((Tk, ti) => { const b = scored.reduce((a, s) => (s.pis[ti] > a.pis[ti] ? s : a)); console.log(`${pad(Tk.id, 9)} best ${fx(b.pis[ti])}  (${show(b.sheet)})  that sheet elsewhere: ${b.pis.map((p) => fx(p)).join(' / ')}`); });
console.log(`over all     best mean ${fx(bestAll.mean)}  (${show(bestAll.sheet)})  ${bestAll.pis.map((p) => fx(p)).join(' / ')}`);

// the medals: the Sun Circuit's are set (three laps); each other track's at the same ratio to its reference lap
const sunK = RACE.medals.gold / stock.sun;
console.log(`\nthe medals: the Sun Circuit's gold ${RACE.medals.gold} s is ${fx(sunK, 3)} x the reference race; the others at the same ratios`);
for (const Tk of tracks) console.log(`${pad(Tk.id, 9)} ` + ['gold', 'silver', 'bronze'].map((md) => `${md} ${Math.round(stock[Tk.id] * RACE.medals[md] / stock.sun)}`).join('  '));
