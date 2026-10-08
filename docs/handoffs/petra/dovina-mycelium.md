# From Dovina (Design): the Mycelium's world side, built (2026-10-08)

Your split: I took the world side. It is in `src/world/garden/mycelium.js` (`game.gardenMycelium`, made in `main.js` after the realm)
and `src/feedback/codex/grimoire.js` (the Grimoire of Echoes, put on `game.codexPages.grimoire`).

**What it does:**
- **Myggdrasil's planetoid:** given at Sinter on `garden.enter`. It hangs at `GARDEN_AT + (0, -60, -160)`, with radius 26. It clears
  every planetoid by more than 10 m and the ring's slots by more than 26 m (the sweep measures both). It is added the way `orbit.js` adds
  a bought planetoid: `site.addPlanet`, then `realm.adopt(P, 6)`. Its tree is a stand-in, 48 m tall, until Calissa's.
  Its F place is `kind: 'myggdrasil'` in `site.features`.
- **Spore beds:** `sporebed` is a feature in `progress/realm.js` `FEATURES` (mine): small, Firing 1, on the PLACE page.
  - Placed, it is granted to `game.sporeBeds` with its plot's id. Placed in a feeling whose spores you hold, it takes that strain.
  - Each gets an F place (`kind: 'sporebed'`, `plot`) and a fairy ring on its plot's group.
  - Its neighbours' strains are read from `plots.neighbours`. `garden.move` carries its colony along.
- **Keepsake pots:** an `InstancedMesh` ring at the Chimney's foot (64 at most).
- **The pages:** the Index's window, as the shed's are (`garden.sporebed`, `garden.myggdrasil`).

**The hooks I need in your files, one line each:**
1. `world/garden/realm.js`, in `use(f)`'s `default:`:
   `if (this.game.gardenMycelium?.use(f)) return;`
2. `world/garden/realm.js`, in its update while active:
   `this.game.gardenMycelium?.update(raw);`
   This lights a bed's ring when it comes ready (checked once a real second).
3. `feedback/codex/codex.js`, a tab `['grimoire', 'GRIMOIRE']` whose render is `this.game.codexPages?.grimoire?.(this, cx)`, as the
   other shelves' are.
4. The realm's save loads clay before Myggdrasil's planetoid exists, so its sculpting is dropped on reload. A bought planetoid may hit
   the same thing. Either:
   - call `game.gardenMycelium.give()` before the clay loads; or
   - keep a planetoid's clay data until the planetoid comes.
   Your call; say which and I'll fit it.

Hooks 1 and 3 are what a player needs: until they land, F at a bed or at the roots does nothing. The garden sweep asks the mycelium
directly, as hook 1 will.

**Checked:** `node scripts/sweeps/garden.mjs`, section "mycelium". It covers:
- the planetoid's placing, size and clearances;
- a bed placed and paid, its strain taken, its page, set, made ready, harvested and moved;
- the tree fed and picked from its page, and its dawn;
- a pot on the Chimney's ground;
- the Grimoire.

Shots: `mycelium-sporebed-page` and `mycelium-myggdrasil`.

`spirit.release`'s `feeling`: thank you. The pots are tinted by it.
