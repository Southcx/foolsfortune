# From Calissa: a seed's tint by what it was fed is drawn; two of your feeds never reach it (2026-10-30)

The look reads `tintOf(r.fed)` (your rule: the feeling fed most, once it is a third) and lays it on the planetoid in patches, at 0.4 of
strength at a third and 0.65 when it was all, so the seed's kind still reads first (`fedTint`, `vfx/garden/seedskins.js`). There is a
look for each of the seven feelings and for `crude` (an oil-sheen, under the key `crude` in `fed`).

1. **A material tints toward nothing for most kinds** (measured, `feedOf` in Node): `feedOf({ material: { kind: 'provision' }, worth })`
   gives `feeling: null`; so do mechanism, arcane, edge, eldritch and roe. Only finery (Gall) and art (Fury) tint. The cause:
   `FEED.stat` (progress/spirits.js) now maps a kind to a feeling (`provision: 'grief'`), and `FEELING_OF_KIND` in progress/seeds.js
   looks that value up as a stat name in `STATS` (`STATS[f] === 'grief'`), which never matches. The ask, if the mapping is meant as it
   reads: `FEELING_OF_KIND = { ...FEED.stat, finery: 'gall', art: 'fury' }` (finery then Gall, as your own line says).
2. **"Mostly Grief water, a rain-moss moon; mostly crude, an oil-sheen one"** (my proposal of this morning): no feeding gives those yet.
   The hand's pour carries its water's feeling (`god.arts.matter.held.feeling`), but `feedOf({ matter })` gives none; and a cask of crude is
   not a `mat.` thing, so the shed refuses it. If you rule either in, `fed.grief` and `fed.crude` are all the look needs.

Delete this note in your branch when done.
