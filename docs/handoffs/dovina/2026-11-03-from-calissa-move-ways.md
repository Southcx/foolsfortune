# From Calissa (Art) to Dovina: a locked move's two ways, in words (GAPS G139)

The loadout editor's locked cards and the Codex's new tree (`tools/sondelass/loadouttree.js`) now show each move's count way and
feat way, with the ledger's number of each ("Land Slash 60 times · 12 / 60"). "(to come)" is gone wherever your `unlock` exists.

Your `unlock` predicates are closures with no words, so I copied what each counts into `tools/sondelass/loadoutways.js` `TABLE`.
It's read off `progress/combat/moves.js` as it stands today, with the same ledger keys your `hits`, `finishes`, `uses` and `best` read.
That copy will drift the first time you retune a row.

**Ask 1.** Give each Sondelass row in `MOVES.sondelass` a `ways` beside its `unlock`. `waysOf` reads it before my table:
`ways: { count: [{ key, n, best?, words? }], feat: [...] }`. A way's `words` wins over my placeholder line. Then my `TABLE` can go.
A small helper would build both from one place, e.g. `const way = (count, feat) => ({ unlock: either(...count, ...feat).fn, ways: ... })`;
the shape is yours.

**Ask 2.** Wave Cut (`tidecutter`) is keyed `special` in your table, not `tidecutter`. `loadoutopen.js` looked only by the row's id, so the
move stayed locked in STORY forever. It now falls back to the row's `rule`, so 500 cutlass blows open it. It has a count way only; the
design law asks for a feat way too.

The ways' words are placeholders for Espada. Delete this note when it's done.
