# Fool's Fortune

A third-person action game in clay, built to look and run like a PS2 or GameCube game. You play the Courier, a clay body with
**Lachryma** (liquid feeling) for blood. You carry seven psychic tools through a potter's workshop, the desert below it, a Well that
changes every game day, a sea crossed by ship, and a garden of small planets inside your own jar.

Built with **Three.js**, **Rapier** (physics) and **Vite**.

## Where it stands

A vertical slice, made by five Claude sessions (the divisions) and directed by the owner. Every build is published to the same page.
Progress (unlocks, the ledger, achievements) resets with each new build, while settings are kept.

What you can play now:
- the workshop and its basement (movement, the tools, the kiln);
- the Dunes (crystals, angling, the skiff, a Shrine);
- the Great Dunemaw (a Well, three floors and a boss);
- the Emocean (draft a route on the sea chart and sail it as a rail shooter);
- the Spirit Garden (planetoids you sculpt, plant and fill with caught spirits).

## Play it

```bash
npm install
npm run dev        # http://localhost:5173
```

The menu has **DEBUG** (the sandbox: everything unlocked, `/grant` gives cubes), **SETTINGS** and **SOUND TEST**.

| Key | Does |
| --- | --- |
| WASD, Shift, Space, C | move, sprint, jump, crouch or slide |
| Mouse, right button | look, aim |
| F | use what the chevron points at |
| V | kick, and parry at the right moment |
| X Q G J K U I | draw a tool (gun, blade, brush, camera-book, dowsing rod, bell, coffin) |
| ~ | the god hand |
| P, B, M | the inventory, the Codex, the map |
| Enter | the chat line (`/help` lists the commands) |
| Esc | pause and help |
| F8 | QAIS, for testing a build and reporting bugs |

All the keys are in [the wiki](docs/wiki/playing.md).

## The wiki: how the game works

[`docs/wiki/`](docs/wiki/index.md) explains each system in plain words: what it is, how to use it, and its numbers. Start at the
[index](docs/wiki/index.md).

## For the divisions (Claude sessions)

Read these first, in this order:
1. `CLAUDE.md`: the working rules and who owns what.
2. `docs/GLOSSARY.md`: the game's words, one meaning each (binding).
3. `docs/ARCHITECTURE.md`: the code layout, the module contract and the gate (binding).
4. `docs/CASEBOOK.md`: the rules learned from bugs. Read the rules for any area before building in it.
5. `docs/plans/CLARITY.md`: how anything the player sees must read.

The deeper documents:

| Document | What it holds |
| --- | --- |
| `docs/DESIGN.md` | the design bible: the loops, progression, laws of design |
| `docs/ECONOMY.md` | where cubes come from and go, by the minute |
| `docs/LORE.md` | the world, its people and its names |
| `docs/ART.md`, `docs/VFX.md` | what things look like and why (colour, materials, the precepts, motion); how effects are made |
| `docs/OST.md` | the soundtrack |
| `docs/AI.md` | how creature minds are built |
| `docs/plans/` | specs of systems being built |
| `docs/HANDOFFS.md`, `docs/handoffs/` | notes between divisions |
| `docs/CREDITS.md` | every asset's source and licence, and how to export them |

## Commands

```bash
npm run build      # the static bundle in dist/
npm run check      # the gate's static checks: imports, module rules, retired words
npm run perf       # frame cost against the last published build
npm run stress     # random input over the whole game (needs npm run dev)
node scripts/sweeps/run.mjs   # every room entered, worked and left headless (needs npm run dev)
```

- **The stress test** checks after every step that nothing is NaN, inside a wall, stuck or falling out of the world. `--pairs` runs
  every pair of moves together.
- **The sweeps** (`scripts/sweeps/`) play each room the way a person would, and the way a careless one would. They take a screenshot
  at each step and print a PASS or FAIL line for each check.
- **QAIS** (F8 in the game, `npm run qais` headless) holds the build's notes, the owner's tests and the bug reports.
- **The agent bridge** (`node scripts/agent.mjs serve`, then `look`, `act`, `step`) plays the game as JSON from the shell.
- **How a system works inside** is told in its module's header comment.
