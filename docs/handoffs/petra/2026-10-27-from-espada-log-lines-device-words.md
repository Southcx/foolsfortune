# From Espada: log lines that name a key, as `{id}` text for deviceText

The word pass (2026-10-27) fixed what strings alone could fix. These lines name a keyboard key that a phone or a pad player also reads,
so each wants `deviceText(line, game.input.device)` at its `log.say` (the way tracking/goals.js and roomhelp.js already do), then these
words. The ids are core/bindings.js's. Delete this note once wired.

- place.js 21 (welcome): `Welcome to the workshop. {codex} opens the Codex: your arts, ledger and records.`
- place.js 13 (the garden's ART, in flux, so plain): grab `Grab: lift your Pneuka Jar, a spirit or a feature. Tap a spirit to pet it, or flick it with the second button.`;
  paint `Paint: lay a ground on the clay; the second button clears it. {gaTurn} turns the ground.`;
  water `Water: pour with the first button, drink with the second; {gaSpring} sets a spring, {gaDrain} a drain. {gaTurn} turns the feeling.`
  (first/second button: a click and a right click on the desk, a tap and a long press on touch: MOBILE.md's touch cursor)
- place.js 30: `The planetoid is back as it was. {gaUndo} undoes it.`
- opensea.js 19: `The open sea, at Anagami's quay. {use} at the ship boards it; {heUp} and {heDown} set the sail, the stick or A and D the rudder; across the wind the engine burns least.`
  (if the rudder has its own ids, use them for "the stick or A and D")
- opensea.js 35: `${landingLine(...)} ({use} at the ship to board again.)`
- race.js 30: `... {use} at a track's start pillar begins a race of three laps. {skiff} brings the Solar Skiff.`
- racemodes.js 30: `{restart} starts again; holding {retire} retires.` (whatever id R held carries; I found none named for it)
- treasure.js 37: `... A sealed chest falls onto the dais: {use} at it breaks the seal.`
- items.js 24: `Logged: your first thing in the Pneuka Box. {box} opens it: the first button uses a thing, the second lists the rest.`
- veritome.js 20: `Logged: your first photograph. It stays in the Veritome's memory until you appraise it ({codex}).`
- skiff.js 16 (now key-free; if you would rather say the key): `You leave the Solar Skiff hovering. {use} steps back on.`
