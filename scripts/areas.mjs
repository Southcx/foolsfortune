// ---------------------------------------------------------------------------------------
// THE AREAS' MEASURE (docs/plans/AREAS.md; the rules: src/progress/areas.js): the game opened headless (the sweeps' harness), the
// Dunes' things read where they really stand, and each laid in its area by `areaAt`. What it prints:
//   - each area's things by kind (the checklist's totals, as the ground holds them today);
//   - A2's density: the share of each area's ground more than 40 m from any thing worth stopping for (sampled every 10 m);
//   - the fits: the Solar Skiffing trial's loop (each ring's area: it must lie wholly in the Gnomon flats), the Gnomon, the Great
//     Dunemaw's mouth and its Lamp Shrine.
// It measures; it never fails the gate (the areas are a plan). Exits 0 unless the page cannot be read.
//
//   npm run dev &   then   node scripts/areas.mjs [--json]      (or URL=http://host:port/ for a build under `vite preview`)
//
// Prior art: scripts/economy.mjs and scripts/spreads.mjs (a plan's numbers measured before anyone builds on them), the sweeps'
// harness (the page opened the same way, manual mode, the clock pinned).
// ---------------------------------------------------------------------------------------
import { open, args } from './sweeps/harness.mjs';
import { DUNES_AREAS, DUNES_FRAME, areaAt } from '../src/progress/areas.js';

const NEAR = 40, STEP = 10; // (A2: metres from a thing worth stopping for; the sampling grid's step)

const S = await open('areas');
await S.go?.('dunes');
const seen = await S.page.evaluate(() => {
  const g = __game.game, D = g.dunes, o = D?.center ?? { x: 2000, z: 0 };
  const L = (p) => (!p ? null : Array.isArray(p) ? [p[0] - o.x, p[2] - o.z] : [p.x - o.x, p.z - o.z]), out = []; // (a place's pos is [x, y, z]; the rest are Vector3s)
  const add = (kind, id, p) => { const q = L(p); if (q) out.push({ kind, id, x: q[0], z: q[1] }); };
  (g.crystals?.list || []).forEach((e, i) => add('crystal', `crystal.${i}`, e.pos));
  (g.geysers?.list || []).forEach((e, i) => add('geyser', `geyser.${i}`, e.pos));
  for (const k of ['buried', 'loose', 'stelae']) (g.ostraca?.[k] || []).forEach((s, i) => { if (!s.place || s.place === 'dunes' || s.place === 'ruins') add('ostracon', `${k}.${i}`, s.pos ?? s.at); });
  (D?.columns || []).forEach((p, i) => add('column', `column.${i}`, p));
  for (const p of g.places?.all?.() || []) if (p.zone === 'dunes' || p.zone === 'beach') add(p.id.startsWith('vantage.') ? 'vantage' : 'place', p.id, p.pos);
  for (const s of g.shrines?.list || []) if (s.pos && (s.id === 'lamp' || s.id === 'float')) add('shrine', s.id, s.pos);
  if (D?.gnomon) add('gnomon', 'gnomon', D.gnomon);
  const m = g.well?.mouthSpot?.(); if (m) add('mouth', 'well.mouth', m.pos);
  const loop = (g.solar?.course?.() || []).map((r) => L(r.pos ?? r)); // (each ring is { pos, dir })
  return { centre: [o.x, o.z], things: out, loop };
});
const things = seen.things, by = {};
for (const t of things) { t.area = areaAt(t.x, t.z); ((by[t.area ?? 'outside'] ||= {})[t.kind] ||= 0); by[t.area ?? 'outside'][t.kind]++; }

// A2: the share of each area's ground more than NEAR from any thing (the columns stand for the ruins' pieces)
const empty = {}, cells = {};
for (let x = -DUNES_FRAME.barrier; x <= DUNES_FRAME.barrier; x += STEP) for (let z = -DUNES_FRAME.barrier; z <= DUNES_FRAME.barrier; z += STEP) {
  const a = areaAt(x, z); if (!a) continue;
  cells[a] = (cells[a] || 0) + 1;
  if (!things.some((t) => Math.hypot(t.x - x, t.z - z) < NEAR)) empty[a] = (empty[a] || 0) + 1;
}

const loopAreas = {};
for (const [x, z] of seen.loop) { const a = areaAt(x, z) ?? 'outside'; loopAreas[a] = (loopAreas[a] || 0) + 1; }
const fits = Object.keys(loopAreas).length === 1 && loopAreas.flats === seen.loop.length;

if (args.json) { console.log(JSON.stringify({ by, empty, cells, loopAreas, things }, null, 1)); await S.done(); }

console.log(`The Dunes' things by area (the oasis at ${seen.centre.join(', ')}; ${things.length} things read)`);
for (const id of [...Object.keys(DUNES_AREAS), 'outside']) {
  if (!by[id] && !cells[id]) continue;
  const kinds = Object.entries(by[id] || {}).map(([k, n]) => `${k} ${n}`).join(', ') || 'nothing';
  const share = cells[id] ? `${Math.round(100 * (empty[id] || 0) / cells[id])}% of its ground over ${NEAR} m from a thing` : '';
  console.log(`  ${(DUNES_AREAS[id]?.name ?? id).padEnd(20)} ${kinds}${share ? `  |  ${share}` : ''}`);
}
console.log(`The Solar Skiffing trial's loop: ${seen.loop.length} rings, ${Object.entries(loopAreas).map(([a, n]) => `${n} in ${DUNES_AREAS[a]?.name ?? a}`).join(', ')}: ${fits ? 'fits the Gnomon flats' : 'does NOT lie wholly in the Gnomon flats'}`);
for (const t of things.filter((t) => ['gnomon', 'mouth', 'shrine'].includes(t.kind))) console.log(`  ${t.id} at ${t.x.toFixed(0)}, ${t.z.toFixed(0)}: ${DUNES_AREAS[t.area]?.name ?? t.area}`);
await S.done(); // (the harness closes the browser and exits: 0, since nothing here is a check)
