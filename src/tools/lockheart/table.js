// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S LUCK: what can come out of a Lockheart, how likely each is, and what the Possibilikeys do to the odds. Data only: the
// tool (tools/lockheart/lockheart.js) spins it, the outcomes are done in tools/lockheart/outcomes.js, and the Codex and the box read it to say it.
//
// A LOCKHEART (the coffin on the chain; there are several, and the one fitted to the chain is the wheel) has a TABLE of outcomes with
// weights. A POSSIBILIKEY opens it, and is used up; up to three may be on the ring, and each, in the order they were put on, does its
// work to the table (INVERT turns it upside down: the likeliest becomes the rarest, by rank, so 99 to 1 becomes 1 to 99) or to what
// comes out (TWIN spins twice, WIDE reaches twice as far, ECHO happens again). How FULL the coffin was when it was opened is how hard it
// comes out (a full coffin is a big bet: power 1; one filled twice over, 2).
//
// Prior art: the gacha banner (a table of rates that is published, a pull that spends what you saved, pity), Slay the Spire's relics
// and Balatro's jokers (modifiers that stack, in order, on the same roll), and the loot boxes they all come from, made a weapon.
//
//   OUTCOMES[id]    HEARTS[id] = { name, table: { outcome: weight }, fill, examine }    KEYS[id] = { name, does, table?(t), mods?(m) }
//   oddsOf(heartId, keyIds) -> { table, mods }        rates(table) -> [{ id, p }]        spin(table) -> id
// ---------------------------------------------------------------------------------------

/** What can come out. `color` is its sector on the wheel; `rank` how good (0 a dud .. 4 a jackpot): the wheel is ordered by it. */
export const OUTCOMES = {
  dud:    { label: 'DUD', color: 0x5a4a62, rank: 0, does: 'Nothing. A moth flies out.' },
  bite:   { label: 'BITE', color: 0x8a2a3a, rank: 0, does: 'It bites back: it drinks from you instead.' },
  spill:  { label: 'SPILL', color: 0xe8d7b6, rank: 1, does: 'It spills what it held, and a little more.' },
  cubes:  { label: 'CUBES', color: 0x9fe6ff, rank: 1, does: 'A fountain of cubes.' },
  mend:   { label: 'MEND', color: 0xb8f2a6, rank: 2, does: 'Your Lachryma full, and quick to come back for a while.' },
  daze:   { label: 'DAZE', color: 0xffd76a, rank: 2, does: 'A ring of light: everything near is stunned.' },
  hush:   { label: 'HUSH', color: 0x9ab8ff, rank: 2, does: 'Everything near falls asleep.' },
  kin:    { label: 'KIN', color: 0xff9ad5, rank: 3, does: 'Everything near takes you for its own kind, for a while.' },
  spirit: { label: 'SPIRITS', color: 0xb49be6, rank: 3, does: 'Smoke spirits stand up out of it, on your side.' },
  chest:  { label: 'CHEST', color: 0xffb27a, rank: 3, does: 'A treasure chest falls out of the air.' },
  nuke:   { label: 'SLIP NUKE', color: 0xff5ad0, rank: 4, does: 'Everything near is drowned in slip and burst.' },
};

/** The coffins. The one on the chain is the wheel. */
export const HEARTS = {
  'heart.plain':   { name: 'THE PLAIN LOCKHEART', fill: 40, color: 0x6a4a3a, trim: 0xd9b48a, table: { spill: 40, cubes: 25, mend: 15, daze: 12, hush: 7, nuke: 1 },
    examine: 'A plain coffin of dark wood and brass. Mostly it gives back what you put in.' },
  'heart.gambler': { name: "THE GAMBLER'S LOCKHEART", fill: 30, color: 0x2a1a22, trim: 0xd94a5a, table: { dud: 99, nuke: 1 },
    examine: 'Lacquered black, an ace on the lid. Almost always nothing. Almost.' },
  'heart.shepherd': { name: "THE SHEPHERD'S LOCKHEART", fill: 50, color: 0x3a5a3a, trim: 0xe8d7b6, table: { kin: 35, spirit: 30, hush: 20, chest: 10, bite: 5 },
    examine: 'Green as a hillside, a crook on the lid. What comes out of it is for the flock.' },
};

/** The keys. `table(t)` changes the odds (a fresh copy is passed); `mods(m)` what comes out. */
export const KEYS = {
  'key.brass':  { name: 'BRASS KEY', color: 0xd9b048, does: 'Opens it. Nothing more.' },
  'key.invert': { name: 'INVERTED KEY', color: 0x8a90a8, does: 'Turns its odds upside down: the likeliest becomes the rarest.',
    table: (t) => { const w = Object.values(t), hi = Math.max(...w), lo = Math.min(...w); for (const k of Object.keys(t)) t[k] = hi + lo - t[k]; } },
  'key.even':   { name: 'EVEN KEY', color: 0xc8d2d8, does: 'Every outcome as likely as any other.', table: (t) => { for (const k of Object.keys(t)) t[k] = 1; } },
  'key.loaded': { name: 'LOADED KEY', color: 0xf2f2e6, does: 'The rarest outcome five times as likely.',
    table: (t) => { const lo = Math.min(...Object.values(t)); for (const k of Object.keys(t)) if (t[k] === lo) t[k] *= 5; } },
  'key.twin':   { name: 'TWIN KEY', color: 0xe8a0c8, does: 'It spins twice, and both happen.', mods: (m) => { m.spins += 1; } },
  'key.wide':   { name: 'WIDE KEY', color: 0x8ad0b0, does: 'Whatever comes out reaches twice as far.', mods: (m) => { m.reach *= 2; } },
  'key.echo':   { name: 'ECHO KEY', color: 0xb49be6, does: 'Whatever comes out happens again, a moment later.', mods: (m) => { m.echo += 1; } },
};
export const MAX_KEYS = 4;

/** The odds a heart has with these keys on the ring (in order), and what is done to what comes out. */
export function oddsOf(heartId, keyIds = []) {
  const H = HEARTS[heartId] || HEARTS['heart.plain'];
  const table = { ...H.table }, mods = { spins: 1, reach: 1, echo: 0 };
  for (const id of keyIds) { const K = KEYS[id]; K?.table?.(table); K?.mods?.(mods); }
  return { table, mods };
}
/** The table as chances (0..1), best last (the wheel's order). */
export function rates(table) {
  const sum = Object.values(table).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(table).map(([id, w]) => ({ id, p: w / sum })).sort((a, b) => (OUTCOMES[a.id]?.rank ?? 0) - (OUTCOMES[b.id]?.rank ?? 0));
}
export function spin(table, r = Math.random()) {
  const R = rates(table);
  for (const x of R) { if ((r -= x.p) <= 0) return x.id; }
  return R[R.length - 1].id;
}
