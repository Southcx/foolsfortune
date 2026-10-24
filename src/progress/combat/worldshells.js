// ---------------------------------------------------------------------------------------
// THE WORLD SHELLS' RULES (docs/plans/CASTER-SHELLS.md section 7; the owner, 2026-10-24, through Calissa: a fifth tier, IV's
// complement). A tier IV is paid by the self (the toll: a cracked region); a tier V, World, is paid by the PLACE: firing one draws the
// Lachryma lying round the aim point (paint and crude on the paint map, blots, slicks, loose baubles, the weather falling there, a body
// of liquid Lachryma), and what it drew sets its power, from a quarter of its row's numbers to half again. The place is left drawn thin
// for a game hour. Nothing comes from the pool or the vessel. It teaches without saying it: Lachryma is everywhere, and it is finite;
// paint the ground with the Soul Brush first and the shell is full.
//
// Data and pure functions; the draw itself (reading the paint map, the blots, the weather; wiping what was taken; the thin modifier and
// every alteration's revert) is Calissa's module, and the runner's dry click Petra's (shells.js). One thing here touches the game:
// WorldShellFinds, which gives a World shell for every DUE_EVERY-th full-grown blot you mop up (a sure count, never a roll: Nook Miles'
// stamp card, the house's pity made plain), the one of the nine you have found fewest of.
//
// Prior art: Final Fantasy XI's Geomancy (a spell's strength from the ground it is cast on) and FFX's Overdrive's ambient charge; Zelda's
// Ocarina weather songs (a place changed for a while, then back); Monster Hunter's environmental hazards used as weapons; Okami's
// celestial brush drawing on the world (the Soul Brush's synergy); Machinations' pool-and-drain (a source that empties as it is used,
// refilling at its own rate: the thin modifier's game hour).
//
//   DRAW { r, cap, floor, units, thinFor, scales }   drawOf(need, sources, { prefer }) -> { drawn, k, dry, take: [{ i, amount }], feeling }
//   scaledN(row, k) -> the row's numbers at k   WORLD_SHELLS (the nine rows)   DUE_EVERY   nextFind(L) -> id   worldDue(L) -> n
//   new WorldShellFinds(game) -> game.worldShellFinds   events: shell.found { id, tier: 5, from: 'blot', by }
// ---------------------------------------------------------------------------------------
import { CASTER_SHELLS } from './castershells.js';

/** The draw. r: metres round the aim point it reaches (Calissa's 12). cap: drawn / need at most (a downpour's 1.5: half again the row);
 *  floor: under a quarter of need the trigger dry-clicks and the round is kept. units: what a source is worth in draw units, 1 unit is
 *  a full need-1 shell: paint or crude a m² at full (4 m² of full paint, Calissa's default), a full-grown blot (a younger one by its
 *  stage), a slick, a loose bauble, the weather a strength (a strength-0.5 weather is 1 unit, in the open only: where its look falls), and
 *  liquid Lachryma (the Weir's pools, the shore of the Emocean, a Rift's spring) fills any shell to its cap and is never drawn down.
 *  thinFor: game hours the place stays drawn thin (its paint and blots gone; the weather there weakened by the fraction taken, easing
 *  back over its last quarter). scales: the row's numbers drawn power scales (a duration never: a Glassmaker's sheet lasts as long thin). */
export const DRAW = {
  r: 12, cap: 1.5, floor: 0.25, thinFor: 1,
  units: { paint: 0.25, crude: 0.25, blot: 1.5, slick: 0.25, bauble: 0.1, weather: 2, liquid: Infinity },
  scales: ['power', 'r', 'size', 'h', 'count', 'drop'],
};

/** What a World shell of need `need` draws from `sources` ([{ kind, amount, feeling? }]: paint and crude in m² at full, a blot by its
 *  growth 0..1, slicks and baubles a count, the weather by its strength (0 indoors), liquid any amount). Takes `prefer`'s kinds first
 *  (Calm the weather), then the rest in equal shares, never more than cap x need in all. Returns the units drawn, k (drawn / need, to the
 *  cap), dry (under the floor: nothing is taken), each source's amount taken (in its own measure), and the feeling drawn most. */
export function drawOf(need, sources, { prefer = [] } = {}) {
  const want = need * DRAW.cap, unitsOf = (s) => (DRAW.units[s.kind] ?? 0) * Math.max(0, s.amount || 0);
  const take = [], have = sources.map(unitsOf);
  if (sources.some((s, i) => s.kind === 'liquid' && have[i] > 0)) {
    const i = sources.findIndex((s) => s.kind === 'liquid');
    return { drawn: want, k: DRAW.cap, dry: false, take: [{ i, amount: 0 }], feeling: sources[i].feeling || null };
  }
  let left = want; const got = new Array(sources.length).fill(0);
  const pour = (idx) => { // (equal fractions of each, until left is spent)
    const sum = idx.reduce((a, i) => a + have[i] - got[i], 0); if (sum <= 0 || left <= 0) return;
    const f = Math.min(1, left / sum); for (const i of idx) { const u = (have[i] - got[i]) * f; got[i] += u; left -= u; }
  };
  const all = sources.map((_, i) => i);
  pour(all.filter((i) => prefer.includes(sources[i].kind)));
  pour(all);
  const drawn = want - left, k = Math.min(DRAW.cap, drawn / need), dry = k < DRAW.floor;
  const by = {}; let feeling = null;
  for (const i of all) if (got[i] > 0) {
    take.push({ i, amount: got[i] / DRAW.units[sources[i].kind] });
    const f = sources[i].feeling; if (f) { by[f] = (by[f] || 0) + got[i]; if (!feeling || by[f] > by[feeling]) feeling = f; }
  }
  return dry ? { drawn, k, dry, take: [], feeling: null } : { drawn, k, dry, take, feeling };
}

/** A row's numbers at draw k (DRAW.scales by k, counts kept whole and at least one; `need` and durations as they are). */
export function scaledN(row, k) {
  const n = { ...row.n };
  for (const key of DRAW.scales) if (typeof n[key] === 'number') n[key] = key === 'count' ? Math.max(1, Math.round(n[key] * k)) : n[key] * k;
  return n;
}

export const WORLD_SHELLS = CASTER_SHELLS.filter((r) => r.tier === 5);
/** Full-grown blots mopped up for each World shell found (ledger `stain.wash.grown`). Twelve: about one a real hour and a half of play
 *  that hunts blots, a guess until the blots' rate is measured (CASTER-SHELLS.md 7.4). */
export const DUE_EVERY = 12;
/** World shells owed by the ledger and not yet given. */
export const worldDue = (L) => Math.floor((L.get('stain.wash.grown') || 0) / DUE_EVERY) - (L.get('shell.world.found') || 0);
/** The World shell given next: the one found fewest times, the lowest number first. */
export const nextFind = (L) => WORLD_SHELLS.reduce((a, r) => ((L.get(`shell.world.found.${r.id}`) || 0) < (L.get(`shell.world.found.${a.id}`) || 0) ? r : a)).id;

/** Gives what the ledger owes: after a full-grown blot is mopped (the ledger counts it first: tracking/brush.js), each World shell due goes
 *  into the Pneuka Box. The ledger's `shell.world.found` is what has been given, so a reload never gives twice. */
export class WorldShellFinds {
  constructor(game) {
    this.game = game;
    game.events?.on('stain.wash', (e) => { if ((e.by ?? 'courier') === 'courier') queueMicrotask(() => this.pay()); });
  }
  pay() {
    const g = this.game, L = g.ledger; if (!L || !g.pneuka) return;
    for (let n = worldDue(L); n > 0; n--) {
      const id = nextFind(L);
      g.pneuka.add(`shell.${id}`, 'blot');
      g.events.emit('shell.found', { id, tier: 5, from: 'blot', by: 'courier' });
    }
  }
}
