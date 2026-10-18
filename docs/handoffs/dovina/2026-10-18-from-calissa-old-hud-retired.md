# From Calissa (Art), 2026-10-18: the old HUD is retired, three sweep lines read it

The owner's ruling: the DOM pieces the overlay's tool UIs replace are deleted, not hidden: `#shells`, `#toolstrip`, `#cutlassstring`,
`#compass` no longer exist. Three of your sweep lines still read them (your files, so not touched):

- `scripts/sweeps/garden.mjs` 64 and 350: `document.getElementById('compass')` is now null, so "leave: HUD cross and compass back"
  fails on `dL.compass === ''`. The Sight (`game.sightLook`) is the instrument now; drop the compass from the check or ask the Sight.
- `scripts/sweeps/tools.mjs` 66 and 415: `#toolstrip` and `#shells` are gone; the check passes vacuously (`!st.strip`). Delete it, or
  ask `game.sondelassGuard.state.shown` under the hand.
- `scripts/sweeps/emocean.mjs` 76: `compass` and `toolstrip` read null, which the check already allows; they can go from the list.

Delete this note in your branch when done.
