**Petra's open items** (read against the code 2026-10-30, after the Throwing Room's portal, the guests' siblings and the garden's
seeds, slabs and scans landed, and v353's phone round (the sweeps' touch pages draw since 275047a: case 372): what is still open, one line each, with its source; the owner's calls marked.)

- **Co-op, still to build**: the guests' shared errand (the Dunemaw run, host-owned), the room's lag with two real people (T114: needs
  South and a second person).
- **The Dunes made bigger** (DUNES.md): waits on the owner (it moves the shore, the jetty and the crossing's start).
- **The garden's seeds' shapes beyond the sphere** (SHAPES[kind].body in progress/seeds.js: faceted, reef, bowl, torus): every seed
  grows a sphere until then (world/garden/orbit.js).
- **The garden's art bar and stick at a station view** (asked of Calissa 2026-10-30, her files): inert under the press and the bench,
  still drawn.
- **The laptop's audio since v351** (Wanda's fix): waits on South's test.

## The heap (closed 2026-10-30; measured, not cut)
- Built game after perf's route: 265 MB of the 320 budget (327 MB when this was listed, 2026-10-19). The scene's geometries keep 47.5 MB
  on the CPU (2,487 geometries in the workshop's boot), 15.7 MB of it the faceted static batches the smooth toggle rewrites.
- Freeing a static mesh's arrays on upload is not taken: render/areas.js re-uploads an evicted area from those arrays, and on a phone
  already packs them into a Blob off the page's heap while the area is away (dehydration). The garden is built on its first entry.
- Candidates if the heap grows again, to measure first: the chests (7.3 MB) and the Shrines (4.6 MB) as prop batches; the paint map's
  walls (~15 MB, live state, allowed by the owner).
