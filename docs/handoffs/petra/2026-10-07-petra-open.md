**Petra's open items** (read against the code 2026-10-30: the Crucibelle's scale, the weather's readers, Wanda's two asks, the renames,
the slip jelly mount, the belt's draws, the pier's keyboard, the parry's one window, the photo finish, the siblings' tools and the log as
the System's terminal are done and gone from here. What is still open, one line each, with its source; the owner's calls marked.)

- **The Throwing Room over 450 calls** where the Workshop's door is in view (455 to 497 measured by Calissa, 2026-10-10): measure it
  again since the wing's later rounds; if still over, an occlusion test through the doorway or a portal backdrop.
- **Co-op, still to build**: siblings a guest can see (presence carries the party; a guest draws them dressed in `lookOf`), the guests'
  shared errand (the Dunemaw run, host-owned), the room's lag with two real people (T114: needs South and a second person).
- **The Dunes made bigger** (DUNES.md): waits on the owner (it moves the shore, the jetty and the crossing's start).
- **The garden's seeds, slabs and scans, the world side** (Dovina's handoff, 2026-10-30): the ring takes seeds, the carving bench, the
  scanner.

## The heap, for the deep clean (measured 2026-10-19, built game after perf's route: 327 MB, of it 171 MB typed arrays reachable from the game)
- The level's merged static meshes keep their CPU arrays (~2.4 MB a batch, about 20 batches): not freeable as is, since their materials
  are flatShading and `visual.smooth` rewrites their normals from positions in play (render/present.js creaseNormals). A cut: bake both
  normal sets once, or drop the toggle's live rewrite, then free the arrays on upload (bounds computed first).
- The paint map's walls: ~15 MB in five per-cell arrays (k and hData Float32). Live state (k fades by dt); the owner allowed its heap.
- The chests (7.3 MB), the Shrines (4.6 MB), the Dunes' chunks and batches (~9 MB), the Spirit Garden's brush and planetoids (~7 MB,
  held before the garden is entered: a case for 234).
