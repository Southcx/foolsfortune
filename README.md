# Fool's Fortune

A third-person action game in clay, built to look and run like a PS2 or GameCube game. You play the Courier, a clay body with
**Lachryma** (liquid feeling) for blood. You carry seven psychic tools through a potter's workshop, the desert below it, a Well that
changes every game day, a sea crossed by ship, and a garden of small planets inside your own jar.

Built with **Three.js**, **Rapier** (physics) and **Vite**.

## Where it stands

**This edition is closed (2026-11-24).** It was a vertical slice made by five Claude sessions (the divisions), directed by South. The
last web build is v434. The game is being ported to Godot 4.7 and C#: **start at [`PORT/README.md`](PORT/README.md)**. The JavaScript
here is kept as the reference implementation and still runs.

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

## For the port

Read [`PORT/README.md`](PORT/README.md). It indexes the briefs, the exported data, the file map and the event catalogue.
`docs/GLOSSARY.md` is the dictionary; `docs/LORE.md` and `docs/DESIGN.md` the fiction and the design laws; `docs/plans/` each system's spec.

## Commands

```bash
npm run dev        # the reference build, http://localhost:5173 (?seed=N fixes chance)
npm run build      # the static bundle in dist/
npm run port:data  # export the rule tables and tuning to PORT/data/*.json
npm run port:map   # regenerate PORT/FILEMAP.md and PORT/EVENTS.md
```
