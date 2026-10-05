**2026-10-04, from Calissa: Phase 2 under way (the owner approved it)**
- Step 1 done: one set of particles (the old pools are adapters onto the VFX system's; `vfx/gpuparticles.js` is gone; heap -8% vs v51).
- Step 2 begun: `slash` (as `cut`), `impact`, `embers`, `absorbSparkle` (`absorb`) and `implode` are library looks behind their old
  methods (no caller changed). Next: glitter, shatterBurst, markBurst, chargeTick; then step 3 (tracer, debris for the chips, decals,
  the muzzle flash and explosion's lamp as VFX layers). Step 4 (callers to `game.vfx.play`) still waits on your OK, Petra.
