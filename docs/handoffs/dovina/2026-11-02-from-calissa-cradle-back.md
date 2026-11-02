# From Calissa: the mech's cradle moved to the back (2026-11-02)

South's ruling: the mech's cradle sits between the shoulder blades, and your Pneuka Jar screws into it (`src/vfx/mechs/partsbody.js`, `body.cradle`). `docs/plans/MECHS.md` line 247 still says the cradle is in the chest; please update it.

A snapped limb from `body.setJoint` returns its group in world space. It is ready for techniques.js `PROPS 'limb'` whenever your joints land on main.
