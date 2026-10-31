// ---------------------------------------------------------------------------------------
// STRAWMAN'S GRID CHECK: Strawman's Well's falling-sand grid (src/world/strawmanwell/grid.js) stepped headless in Node, one PASS / FAIL line
// a claim, exit 1 on any fail. Only the pure simulation: the look and the colliders need the game.
//
//   node scripts/strawmangrid.mjs
// ---------------------------------------------------------------------------------------
import { SandGrid, cellToWorld, worldToCell } from '../src/world/strawmanwell/grid.js';
import { GRID, CELL } from '../src/progress/strawmanwell.js';

let fails = 0;
const claim = (ok, what, more = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${more ? `  (${more})` : ''}`); };
const run = (g, n) => { for (let i = 0; i < n; i++) g.step(); };
const box = (w, h) => { const g = new SandGrid({ w, h, seed: 7 }); g.fill(0, 0, w - 1, 0, CELL.stone); g.fill(0, 0, 0, h - 1, CELL.stone); g.fill(w - 1, 0, w - 1, h - 1, CELL.stone); return g; };

// 1. sand poured on stone heaps and stops
{
  const g = box(60, 40);
  let poured = 0; for (let k = 0; k < 40; k++) { poured += g.pour(30, 34, CELL.sand, 1.5); run(g, 8); }
  run(g, 600);
  const before = g.dump(); run(g, 40); const still = g.dump() === before;
  const top = g.surfaceAt(30), edge = g.surfaceAt(12);
  claim(g.count(CELL.sand) === poured && still && top > edge && top >= 4, 'sand poured on stone heaps and stops', `${poured} cells, peak row ${top}, row ${edge} at 18 off, at rest ${still}`);
}
// 2. Lachryma poured into a basin finds a flat level
{
  const g = box(60, 40);
  let poured = 0; for (let k = 0; k < 30; k++) { poured += g.pour(8, 34, CELL.lachryma, 2); run(g, 4); }
  let steps = 0, spread = Infinity;
  for (; steps < 3000; steps += 20) {
    run(g, 20);
    let lo = Infinity, hi = -Infinity;
    for (let x = 1; x < 59; x++) { const l = g.levelAt(x); lo = Math.min(lo, l); hi = Math.max(hi, l); }
    spread = hi - lo; if (spread <= 1 && lo >= 1) break;
  }
  claim(spread <= 1 && g.count(CELL.lachryma) === poured, 'Lachryma poured in a basin finds a flat level', `${poured} cells, level within ${spread} row in ${steps + 20} steps after pouring`);
}
// 3. sand sinks through Lachryma; Lachryma sinks under crude
{
  const g = box(20, 30);
  g.fill(1, 1, 18, 10, CELL.lachryma); g.fill(1, 11, 18, 14, CELL.crude); g.fill(8, 20, 11, 22, CELL.sand);
  run(g, 800);
  let sandLow = true; for (let x = 1; x < 19; x++) for (let y = 1; y < 30; y++) if (g.get(x, y) === CELL.sand && y > 5) sandLow = false;
  let crudeTop = true; for (let x = 1; x < 19; x++) for (let y = 1; y < 30; y++) if (g.get(x, y) === CELL.crude && y < g.levelAt(x, CELL.lachryma)) crudeTop = false;
  claim(sandLow && g.count(CELL.sand) === 12, 'sand sinks through Lachryma to the floor', `sand ${g.count(CELL.sand)}`);
  claim(crudeTop && g.count(CELL.crude) === 72, 'crude floats on Lachryma', `crude ${g.count(CELL.crude)}`);
  const h = box(20, 30); h.fill(1, 1, 18, 4, CELL.crude); h.pour(10, 20, CELL.lachryma, 2.5); const lach = h.count(CELL.lachryma); run(h, 1200);
  let under = 0; for (let x = 1; x < 19; x++) if (h.get(x, 1) === CELL.lachryma) under++;
  claim(under >= 8, 'Lachryma poured on crude sinks under it', `${lach} cells, ${under} of 18 floor cells Lachryma`);
}
// 4. carve empties (and never stone)
{
  const g = box(20, 20); g.fill(1, 1, 18, 8, CELL.clay);
  const n = g.carve(10, 5, 3);
  claim(n > 20 && g.get(10, 5) === CELL.empty && g.get(10, 0) === CELL.stone, 'carve empties a disc and leaves stone', `${n} cells`);
}
// 5. freeze / melt round-trip
{
  const g = box(20, 20); g.fill(1, 1, 18, 5, CELL.lachryma);
  const f = g.freeze(10, 3, 2.5), ice = g.count(CELL.ice); run(g, 50);
  const iceHeld = g.count(CELL.ice) === ice;
  const m = g.melt(10, 3, 2.5);
  claim(f > 0 && f === m && iceHeld && g.count(CELL.ice) === 0 && g.count(CELL.lachryma) === 90, 'freeze and melt round-trip', `${f} frozen, ${m} melted, ice stood ${iceHeld}`);
}
// 6. a crude pool ignited burns away
{
  const g = box(40, 20); g.fill(1, 1, 38, 4, CELL.crude); g.fill(1, 5, 38, 5, CELL.lachryma);
  const start = g.count(CELL.crude); g.ignite(20, 4, 1.5);
  let steps = 0; for (; steps < 6000 && g.count(CELL.crude) > 0; steps += 10) run(g, 10);
  claim(g.count(CELL.crude) === 0 && g.count(CELL.lachryma) === 38, 'a crude pool ignited burns away (Lachryma untouched)', `${start} cells gone in ${steps} steps, ${(steps / GRID.rate).toFixed(1)} real s at ${GRID.rate} a real second`);
}
// 7. a busy 160 x 90 grid steps in under a millisecond
{
  const g = new SandGrid({ w: GRID.w, h: GRID.h, seed: 3 });
  g.fill(0, 0, GRID.w - 1, 2, CELL.stone);
  for (let x = 10; x < GRID.w; x += 30) g.fill(x, 3, x + 2, 30, CELL.stone);
  g.fill(1, 3, GRID.w - 2, 20, CELL.lachryma); g.fill(1, 21, GRID.w - 2, 30, CELL.crude); g.fill(1, 40, GRID.w - 2, 70, CELL.sand);
  run(g, 200); // (warm: the JIT)
  let worst = 0; const N = 200, t0 = performance.now();
  for (let i = 0; i < N; i++) { const a = performance.now(); g.step(); if (i % 15 === 0) g.pour(20 + (i * 7) % 120, 80, CELL.lachryma, 3); worst = Math.max(worst, performance.now() - a); }
  const avg = (performance.now() - t0) / N;
  claim(avg < 1, 'a busy 160 x 90 grid steps under 1 ms on average', `${avg.toFixed(3)} ms a step, worst ${worst.toFixed(3)} ms, ${N} steps`);
}
// 8. dump / load round-trips; cellToWorld and worldToCell agree
{
  const g = box(40, 30); g.fill(1, 1, 38, 6, CELL.sand); g.pour(20, 20, CELL.lachryma, 4); g.fill(5, 10, 9, 12, CELL.ice); run(g, 37);
  const d = g.dump(), h = new SandGrid({ w: 40, h: 30 }); const ok = h.load(d);
  let same = ok; for (let i = 0; i < g.cells.length; i++) if (g.cells[i] !== h.cells[i]) { same = false; break; }
  claim(same && h.dump() === d && !h.load('xx'), 'dump and load round-trip (and a wrong size is refused)', `${d.length} chars`);
  const o = { x: -20, y: 3, z: -7 }, w = cellToWorld(o, 17, 42), c = worldToCell(o, w.x, w.y);
  claim(c.x === 17 && c.y === 42 && w.z === -7 && Math.abs(w.y - (3 + 42.5 * GRID.size)) < 1e-9, 'cellToWorld and worldToCell agree (row 0 at the foot, y up)');
}
// 9. dirty columns: the room's set and a reader's own
{
  const g = box(30, 20); g.takeDirty(); const seen = new Uint32Array(30); g.takeChanged(seen);
  g.set(12, 15, CELL.sand); g.set(20, 15, CELL.sand); const d = g.takeDirty().sort((a, b) => a - b), c = g.takeChanged(seen);
  claim(d.join() === '12,20' && c.join() === '12,20' && g.takeDirty().length === 0 && g.takeChanged(seen).length === 0, 'dirty columns are reported once to each reader');
}
process.exit(fails ? 1 : 0);
