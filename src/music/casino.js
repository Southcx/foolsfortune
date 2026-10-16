// ---------------------------------------------------------------------------------------
// THE BAZAAR'S CUE (Raku's casino, zone `bazaar`: world/bazaar/, Dovina's; docs/plans/CASINO.md; the owner: "Gold Saucer all the way").
// Who it is for: the Courier walking into a carnival under a dome, lights and money and Raku grinning behind his cage. One score, two
// rooms of it, in F major at 152 bpm:
//   FLOOR   the hall: a circus march (an oom-pah under it: the upright on the beat, a brass stab off it), a calliope's tune on the celesta and
//           the concertina doubling it, a glockenspiel answer, a snare roll into every fourth bar (the Gold Saucer's welcome)
//   TABLE   sat at a game (casino.sit, until casino.result): the march drops away to a lounge in the same key, half the drive: the Rhodes'
//           comping, the upright walking, brushes; the calliope's tune slowed on the vibes, so the table is the floor heard through a door
//   A WIN   casino.result { won }: back to the floor on the next bar line with its fanfare first (two bars of brass), a loss just back
// Prior art: Final Fantasy VII's Gold Saucer (the carnival march), the casino lounges of Yakuza and of Bond (the table's hush), the
// fairground calliope (its tune on a bright, breathy organ: here the celesta and concertina together).
//
//   import { CASINO, hearCasino } from './casino.js'   hearCasino(game) (once)   CASINO (a score, family 'casino')
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });
const S = { seated: false, fanfare: false, heard: false };

// F C Dm Bb, F Gm C F: the march's turnaround
const CH = [[53, [0, 4, 7]], [48, [0, 4, 7]], [50, [0, 3, 7]], [46, [0, 4, 7]], [53, [0, 4, 7]], [55, [0, 3, 7]], [48, [0, 4, 7, 10]], [53, [0, 4, 7]]];
// the calliope's tune, a bar a row: [beat, beats, note]
const TUNE = [[[0, 0.5, 77], [0.5, 0.5, 81], [1, 1, 84], [2, 0.5, 81], [2.5, 0.5, 77], [3, 1, 72]], [[0, 1.5, 76], [1.5, 0.5, 79], [2, 2, 72]],
  [[0, 0.5, 74], [0.5, 0.5, 77], [1, 1, 81], [2, 1, 77], [3, 1, 74]], [[0, 1.5, 70], [1.5, 0.5, 74], [2, 1, 77], [3, 1, 82]],
  [[0, 0.5, 81], [0.5, 0.5, 84], [1, 1, 89], [2, 0.5, 84], [2.5, 0.5, 81], [3, 1, 77]], [[0, 1, 79], [1, 1, 82], [2, 1, 86], [3, 1, 82]],
  [[0, 0.5, 79], [0.5, 0.5, 76], [1, 0.5, 72], [1.5, 0.5, 76], [2, 2, 79]], [[0, 2, 77], [2, 1, 72], [3, 1, 77]]];
const tri = (i, up = 12) => CH[i % 8][1].map((x) => CH[i % 8][0] + up + x);

const SECTIONS = [
  { id: 'floor', bars: 8, gain: 2.3, bar: (i) => [
    E('upright', 0, 1, CH[i][0] - 12, 0.4), E('upright', 2, 1, CH[i][0] - 5, 0.36), // (the oom)
    ...[1, 3].flatMap((b) => tri(i).map((n) => E('brass', b, 0.4, n, 0.08, { stab: true }))), // (the pah)
    ...TUNE[i].flatMap(([b, d, n]) => [E('celesta', b, d, n, 0.32), E('concertina', b, d, n - 12, 0.12)]),
    ...(i % 2 ? [E('bell', 3.5, 1, TUNE[i][0][2] + 12, 0.1)] : []), // (the glockenspiel's answer)
    E('kick', 0, 1, null, 0.4), E('kick', 2, 1, null, 0.35), ...[1, 3].map((b) => E('snare', b, 1, null, 0.3)), ...[0.5, 1.5, 2.5, 3.5].map((b) => E('hat', b, 0.5, null, 0.1)),
    ...(i % 4 === 3 ? [0, 0.25, 0.5, 0.75].map((d) => E('snare', 3 + d, 0.25, null, 0.18)) : []), // (the roll into the next phrase)
  ] },
  { id: 'table', bars: 8, gain: 2.6, bar: (i) => [
    ...tri(i, 12).flatMap((n) => [E('rhodes', 0, 1.5, n, 0.12), E('rhodes', 2.5, 1, n, 0.09)]),
    ...[0, 1, 2, 3].map((b) => E('upright', b, 1, CH[i][0] - 12 + [0, 4, 7, 5][b], 0.3)), // (walking)
    ...[0, 1, 2, 3].map((b) => E('brush', b, 1, null, 0.15)),
    ...(i % 2 === 0 ? TUNE[i].filter((_, k) => k % 2 === 0).map(([b, d, n]) => E('vibes', b, d * 1.5, n - 12, 0.2)) : []), // (the tune through a door)
  ] },
  { id: 'fanfare', bars: 2, gain: 2.4, bar: (i) => (i === 0 ? [E('crash', 0, 1, null, 0.45), ...[65, 69, 72, 77].map((n, k) => E('brass', k * 0.25, 3 - k * 0.25, n, 0.24)), E('upright', 0, 2, 41, 0.4)]
    : [...[77, 81, 84, 89].map((n, k) => E('bell', k * 0.25, 1, n, 0.16)), ...[65, 69, 72, 77].map((n) => E('brass', 0, 3, n, 0.1)), E('kick', 0, 1, null, 0.5)]) },
];
const AT = Object.fromEntries(SECTIONS.map((s, k) => [s.id, k]));

function jump(section, bar) {
  const id = SECTIONS[section].id, last = bar >= SECTIONS[section].bars - 1;
  if (S.fanfare && id !== 'fanfare') return AT.fanfare;
  if (id === 'fanfare') { if (!last) return null; S.fanfare = false; return AT.floor; }
  const want = S.seated ? AT.table : AT.floor;
  return want !== section ? want : last ? section : null;
}

export const CASINO = { title: "Raku's Bazaar", family: 'casino', root: 65, bpm: 152, arrange: true, loopFrom: 0, moodless: true, tail: 3, scale: [0, 2, 4, 7, 9], sections: SECTIONS, jump };

/** Listen for the tables once (world/bazaar/session.js's events): sat down, the game's end (a win's fanfare), the room left. */
export function hearCasino(game) {
  if (S.heard || !game.events) return; S.heard = true;
  game.events.on('casino.sit', () => { S.seated = true; });
  game.events.on('casino.result', (e) => { S.seated = false; if (e.won) S.fanfare = true; });
  game.events.on('bazaar.leave', () => { S.seated = false; S.fanfare = false; });
}

/** The sound test's tour: the floor, a game sat down at, won. */
export const CASINO_TOUR = { ...CASINO, title: "Raku's Bazaar (a game won)", jump: (section, bar) => {
  const id = SECTIONS[section].id;
  if (id === 'floor' && bar >= 7) return AT.table;
  if (id === 'table' && bar >= 3) return AT.fanfare;
  if (id === 'fanfare' && bar >= 1) return -1;
  return null;
} };
