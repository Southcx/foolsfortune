// ---------------------------------------------------------------------------------------
// THE SKILLS' LOOK (the one-gesture duel, PUZZLE-DUELS.md 22; South, 2026-10-27: "when transforming into the courier you get sucked
// into the board", ruled as the cast): a worn tool fired as a skill, drawn on the tsuitate.
//   THE REACH   while a skill is armed (the session's armSkill), the cells it would take under the finger: Shot the three rows through it,
//               Vein every gem of its colour on your half, Paint the 3 x 3, Grab the junk and embers in the 5 x 5, Tune the colour's gems;
//               each lit on the preview's keyline (pieces.js `prev`), the cells outlined (marks.js select)
//   THE CAST    on `skill`: the Pneuka Jar at your spot pours into the board at the skill's cell (formdive.js cast: the stream of the film,
//               the camera after it), then the skill's own beat
//   SHOT        `blast { at, rows }`: a beam swept along each row from the Line's side to the board's edge, sparks in the psygun's gold,
//               before its clears pop
//   VEIN        `vein { at, colour }`: a spark from the cell to every gem of the colour on your half, one after another (a dowser's
//               fork finding the vein), before its clears pop
// Prior art: Puzzle & Dragons' active skill (the portrait's flash and the board answering), Candy Crush's striped candy (the row's beam)
// and colour bomb (the bolts to every candy of a colour), Persona's All-Out cut-in (the moment the board waits for).
//
//   reachOf(state, tool, cell) -> [[x, y]]   castBeat(beats, e) / blastBeat(beats, e) / veinBeat(beats, e) -> a phase (beats.js's form)
//   SKILL_LOOK (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { hasTag } from '../../progress/duel/board.js';
import { cellLocal } from './layout.js';
import { gemColour } from './pieces.js';

/** cast: the pour before the skill lands (real s); blast: a row's sweep; vein: a spark's gap; colours a tool's sparks. */
export const SKILL_LOOK = { cast: 0.62, blast: 0.34, vein: 0.045, gold: 0xffd76a, film: 0x9fd8ff };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

/** The cells a skill would take at `cell` (the kernel's own reach: progress/duel/skills.js), on your half. */
export function reachOf(s, tool, cell) {
  const b = s?.board; if (!b || !cell) return [];
  const mine = (x, y) => b.in(x, y) && b.mine(0, x), gem = (x, y) => { const p = mine(x, y) && b.at(x, y); return p && hasTag(p, 'matches') ? p : null; };
  const out = [], { x, y } = cell; if (!mine(x, y)) return out;
  if (tool === 'psygun') { for (let dy = -1; dy <= 1; dy++) for (let i = 0; i < b.w; i++) if (mine(i, y + dy)) out.push([i, y + dy]); }
  else if (tool === 'dreamvane' || tool === 'crucibelle') { const g = gem(x, y); if (g) b.each((p, i, j) => { if (mine(i, j) && hasTag(p, 'matches') && p.colour === g.colour) out.push([i, j]); }); }
  else if (tool === 'soulbrush') { if (gem(x, y)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (gem(x + dx, y + dy)) out.push([x + dx, y + dy]); }
  else if (tool === 'sondelass') { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const p = mine(x + dx, y + dy) && b.at(x + dx, y + dy); if (p && (p.kind === 'junk' || p.kind === 'ember')) out.push([x + dx, y + dy]); } }
  return out;
}

/** `skill`: the cast. The Jar pours into the board at the cell (or the half's middle), the board answers with a ring there. */
export function castBeat(T, e) {
  const V = T.view, at = e.at || [Math.max(0, Math.floor((V.lineCol ?? 6) / 2) - 1), Math.floor((V.state?.board?.h ?? 9) / 2)];
  if (e.side === 0) V.dive?.cast?.(at);
  let rang = false;
  return { events: [e], dur: e.side === 0 ? SKILL_LOOK.cast : 0.2, step: (u) => {
    if (rang || u < 0.82) return; rang = true; cellLocal(at[0], at[1], V.board3, _a);
    V.bursts.burst(_a, SKILL_LOOK.film, 18, { speed: 1.4, life: 0.5, fall: 0, spread: 0.3 }); V.bursts.burst(_a, 0xffffff, 5, { speed: 0.4, life: 0.2, fall: 0, size: 0.05 });
  } };
}

/** `blast`: the Shot's beam along each row, outward from the Line, before the clears that follow pop. */
export function blastBeat(T, e) {
  const V = T.view, B = V.board3, rows = e.rows || [e.at?.[1]], L = Math.round(V.lineCol ?? B.w / 2), done = new Set();
  return { events: [e], dur: SKILL_LOOK.blast, step: (u) => {
    const reach = Math.floor(u * (L + 1));
    for (const y of rows) for (let x = L - 1; x >= Math.max(0, L - 1 - reach); x--) { const k = x + ',' + y; if (done.has(k)) continue; done.add(k);
      cellLocal(x, y, B, _a); V.bursts.burst(_a, SKILL_LOOK.gold, 3, { speed: 0.8, life: 0.3, fall: 0, spread: 0.15, size: 0.03 }); const v = V.pieces.at(x, y); if (v) v.flash = 0.8; }
  } };
}

/** `vein`: a spark to each gem of the colour on your half, one after another, before the clears pop. */
export function veinBeat(T, e) {
  const V = T.view, B = V.board3, s = V.state, b = s?.board, cells = [];
  const colour = e.colour; if (b) b.each((p, x, y) => { if (b.mine(0, x) && hasTag(p, 'matches') && p.colour === colour) cells.push([x, y]); });
  if (e.at) cells.sort((p, q) => Math.hypot(p[0] - e.at[0], p[1] - e.at[1]) - Math.hypot(q[0] - e.at[0], q[1] - e.at[1]));
  const hex = gemColour(colour || 'wonder', _c).getHex(); let i = 0;
  return { events: [e], dur: 0.12 + cells.length * SKILL_LOOK.vein, step: (u, age) => {
    while (i < cells.length && age >= 0.08 + i * SKILL_LOOK.vein) { const [x, y] = cells[i++]; cellLocal(x, y, B, _a);
      V.bursts.burst(_a, hex, 4, { speed: 0.9, life: 0.3, fall: 0, spread: 0.2, size: 0.03 }); if (e.at) { cellLocal(e.at[0], e.at[1], B, _b); V.bursts.spiral?.(_b, _a, hex, 0); }
      const v = V.pieces.at(x, y); if (v) v.flash = 1; }
  } };
}
