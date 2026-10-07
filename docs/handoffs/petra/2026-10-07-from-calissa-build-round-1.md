**2026-10-07, from Calissa: the full build, Round 1's looks (BUILD.md section 2; DUNEMAW-ARENA.md, DUNEMAW-SYSTEMS.md, SPIRIT-GARDEN.md 5a, SYSTEMS.md D5)**

Each piece is a look with a small interface. The fight's state, the bodies and the colliders are yours; these answer to your calls. Pass `fx: game.fx` where a constructor takes it, for the dust, splashes and motes.

**The bowl**
- **The sand** (`vfx/bowl.js`):
  - `bowlSand({ scale })` is the dish's material: the dunes' sand, laid in world space, with streaks combed toward a pool.
  - Each frame, set `mat.userData.u.uPool` (the world xz of the pool the FOE is in) and `.uSlide` (the slide's m/s: 0 at rest, 0.8, then 1.5), then call `bowlSandTick(mat, rawDt)`.
  - At rest the streaks lie still and faint. When the slide runs, they stream inward at its speed.
- **The pools** (`new PoolRing({ radius, fx })`, `vfx/bowl.js`):
  - Lay it on a pool's slip. Ease `ring(k)` from 0 to 1 over the 1.2 s before a surfacing: thin ripples quicken and a glow wells up from under the slip, with bubbles.
  - `surface()` gives the splash.
  - They are ripples, not a painted target (no floor markers: EXTREME.md).
- **Pillars** (`Pillar`, `vfx/cavekit.js`, now taking `fx`):
  - `crack(1)`: the glowing seams.
  - `fall(dir)`: the second ram fells it toward `dir`, the ram's way in the parent's frame. It is slow off the vertical, then all at once, with a bounce and dust, and lies as a log. Its height is the log's length (12 m in the bowl).
  - `rubble()`: the log rammed breaks to a heap where it lay.
  - `state`: `'whole' | 'cracked' | 'falling' | 'fallen' | 'rubble'`.
  - Call `update(t, dt)` each frame.
  - Your colliders follow the state: a cylinder standing, a cylinder lying along `dir`, then the heap.
- **Stalactites:** `shake()` was already the tell. New is `shatter()`, for a fallen one rammed or slammed on: shards and dust, and it is gone. Between the fall and the shatter its body and motion are yours.

**The nursery**
- **Clutches** (`Clutch({ eggs, fx })`, `vfx/cavekit.js`):
  - `hatch(i)`: the egg's cap lifts and tips off, and its brood is out. Spawn the body there.
  - `burst(i)`: broken, with a splash.
  - `alive`: the eggs left.
- **The brood:** call `dressBrood(root, { size: 0.5 })` on a slip jelly's root. It comes out half size, the eggshell still capping its head. It returns an undo.

**The crown** (`UrnCrown`): `tell(k)`, 0..1 through the ram's 1.0 s scrape and back to 0 when it charges. The broken edge and the cracks brighten and the urn trembles: the body is the telegraph. `crack` and `burst` are as before.

**The catch** (`new CatchLook({ fx, color })`, `vfx/catch.js`): one look for both ways of catching.
- Add `C.group` to the scene. `C.begin(figmentRoot, mouth)`: `mouth` is a point, or a function giving the Jar's mouth (or the open coffin's) each frame.
- Each frame: `C.set({ k, tug })`, then `C.update(rawDt)`.
  - `k` is the struggle's progress (a second a class).
  - `tug` is how hard it fights at this instant, if you have it: it whips the strands and jerks the Figment.
- `C.take(onDone)`: held through. It shrinks down the tether into the mouth, and `onDone` fires when it is in, which is where you emit `spirit.bind`.
- `C.free()`: the stun ran out or the Jar cracked. The strands snap and fling.
- **What it borrows from the Figment:**
  - its `scale` during the struggle (restored after);
  - its `position` during the 0.45 s take, moved in its parent's frame, so its parent should be unscaled;
  - it sets the Figment's `visible = false` when it is in.
- The Lockheart's wheel stays `tools/lockheart/wheel.js`: run the wheel and this look together while the coffin spins. Colour: pass the coffin's (the default is the Jar's Lachryma gold).

**The busker's mat** (`new BuskerMat({ env })`, `vfx/buskermat.js`): a rag rug on the planks, about 1.6 by 1.0 m, with a tip pot thrown like the Pneuka Jar.
- `tip(n)`: the cubes in the pot (twelve show at most).
- `set({ playing })`: a warm spot on the mat while the rhythm mode runs.
- One for Old Grog's pier and one for Margarite's dock. The F chevron is `interact.js`'s.

**Workbench:** "the Great Slip Jelly's bowl", "the catch", "a busker's mat", and the urn crown's loop now shows the tell.

**Cost:**
- The pillar's heap is one merged mesh. The catch is 3 draws while it runs. The mat is about 4 after its merge. The pool ring is 1 draw.
- The arena's 60-call budget is yours to measure with everything in.

**Verified headless, stills only:**
- The sand combed toward a pool (seamless after a fix).
- Pillars whole, cracked, fallen and broken to rubble.
- An egg hatched and a brood capped.
- The crown's tell; a pool ringing.
- The mat with seven tips.

**Verified in motion:** the catch, through held, drawn in and gone, then broken free.

**Not verified:**
- The pillar's fall in motion.
- Any of it in the real bowl.
- The particles in the workbench (it has no fx pool).
