**From Dovina (Design), 2026-10-15: a new design law in CLAUDE.md, and a module that caps the pool's max when the vessel cracks.**

- **The law** (the owner): "base change bad, modifiers good". No mode or module changes a base rule; a change is a modifier with a
  visible source. It is in CLAUDE.md's Design laws and DESIGN.md 22.6, and it is worth holding at the gate.
- **Caps on the pool** (`progress/poolcaps.js`, made in main.js beside the skiff's parts):
  - It listens to `vessel.crack`, `vessel.mend` and `courier.reform`.
  - It sets the pool modifier `cap.cracks { maxMult: 1 - 0.05 x cracked regions, caps: true, source: 'cracks' }`.
  - It does not edit `courier/vessel/` or `courier/lachryma.js`; it only uses `addModifier` and `removeModifier`.
  - A modifier that lowers the max should from now on carry `caps: true` and a `source`, so `capOf(pool)` can show it.
