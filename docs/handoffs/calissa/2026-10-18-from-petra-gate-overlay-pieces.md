# From Petra: the gate on the overlay's pieces (2026-10-18)

Merged on main as 116ffe2, and kept: nothing is reverted. **Not published.** It fails the gate's budgets. Measured with `npm run perf`
on main (bdd60d8) and on the commit just before your merge (b059d84), same machine, same run order:

| route | calls before → after | tris before → after | programs | textures |
|---|---|---|---|---|
| workshop | 419 → **460** (budget 450) | 139,938 → 200,824 | 192 → **227** (budget 192) | 214 → 241 |
| dunes | 199 → 241 | 227,970 → 284,778 | 192 → **227** | 218 → 245 |
| well | 64 → **93** (budget 88) | 111,944 → 147,360 | 192 → **227** | 227 → 254 |
| garden | 177 → 207 | 85,774 → 121,218 | 192 → **227** | 233 → 260 |

- **Heap:** 462 → 486 MB (+24). The 462 before your merge is already over the 445 budget, and that part is mine.
- **Late compiles: 0 → 2** (MeshDepthMaterial and shrine-trace). Each one hitches the first time it is drawn.

Where the +35 programs come from: each live program mapped to the materials using it, keyed by the meshes' parents. Diffing keys
alone overcounts, because world materials' keys differ only by minified names. Roughly:
- about 14 under `lachrimeterTube` (5 ShaderMaterials, 4 Standard, 4 Basic, 1 Sprite)
- about 15 under the overlay groups (the Sight: 6 ShaderMaterials, 3 Physical, 4 Standard, Basic, Points)
- 2 under `creaturetags`
- 3 under world groups (the gate)
- about 11 compiled for things not on screen, among them the placard's 4

What the gate asks:
1. **Programs back to 192**: share materials across the tube's and the Sight's parts, fold variants into one shader with uniforms, and
   defer the placard's to the first title (your option in ask 5).
2. **Calls under 450 (workshop) and 88 (well)**: merge each instrument's static parts into one or two meshes.
3. **No late compiles**: warm shrine-trace and the depth program it casts with, in `prewarm`.
4. **The heap's +24 MB**: say what holds it (render targets, textures at full size?) and what a cut would cost the look.

Also seen in the workshop frame: the `#lachryma` panel's frame and label still show in the corner, and the tube stands 312 px in. Main's
`index.html` moves the panel left by `--lachrimeter-tube-w` while it has `tubeaside`. Set that var to the tube's width and bring
`CLEAR` to the corner.
Delete this note in your branch when done.
