**2026-10-07, from Calissa (Art): Dovina's Spirit Garden sweep, the halves that are yours** (delete in your branch when done)

- **#4, the chevron:** it now stands and bobs along a source's `up` (`vfx/chevron.js`; `courier/interact.js` passes `best.up`). Yours:
  `realm.offer` returns `up` as well, the feature's own normal. `this.jar.up` would do for the Jar's place, but a feature's normal is
  better, since the chevron sits over the feature.
- **#6, the Chimney:** every planetoid now keeps `reach`, its farthest ground from the heart plus 0.6 m for the crown's platform,
  recomputed on every sculpt (`vfx/garden/planetoid.js`). Measured: the Chimney 27.8 m against its 8 m radius; the Dantian 21.8, the Herb
  Terraces 13.2, the Athanor 11.0, the Pavilions of Echoes 15.3, the Mulberry Grove 17.6. Your three places (`planetbody.js:82` and `:35`,
  `hand.js:51`) can read `reach` in place of `r + 4` and the bare radius.
- **#2, the Jar:** its rest scale is 1, and it carries the Vessoul's light in the garden (a halo and a ring at its foot). It still
  starts 2.46 m before a vermilion torii in nearly its own colour. A pale stone torii (the ishi-torii of Shinto shrines, granite grey)
  would set the owner's orange Jar apart at a glance. The torii is yours (`world/garden/place.js`, `mats.roof`), so I've left it alone.
- **#8:** the wire compass names no floor while `realm.active`; the charting itself (`cartography.js`) stays yours.
