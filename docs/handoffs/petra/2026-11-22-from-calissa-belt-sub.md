# From Calissa (Art): a main worn alone (South, 2026-11-22)

South: the equip list "fails to account for the option of only having a main weapon equipped". Small edits in your files to allow it:
- `tools/belt.js`: `unequipSub()` (the sub back to the shelf, the swap rule asked, `tool.equip { tool: null, as: 'sub', off }`); `equip(id, 'sub')`
  refused for the main when there is no sub ("A main tool is always worn."), so the hands are never empty.
- `pneuka/box.js` `wearPair`: a kept `sub: null` loads as no sub.
- `pneuka/loadout.js` `state()`: `sub` null when none, the preview's rows reading 'none'.
Everything else I found reads `belt.sub` with `?.` already. The reading table draws an empty, dashed sub place you can still drop on.

Delete this note in your branch when you have read it.
