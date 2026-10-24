// ---------------------------------------------------------------------------------------
// THE TOUCH LAYOUT, KEPT (docs/plans/MOBILE.md 9, M5: "Calissa: a layout editor. Petra keeps the layout in the settings section"): the
// layout her editor makes (where the cluster's tiles stand and how big, the stick's area: Call of Duty Mobile's and PUBG's custom layouts)
// kept in one save section of the settings scope, so it stays on this device across builds and is never a save's progress. The save
// holds it as it is handed over (its shape is the editor's, opaque here) and gives back a copy, never the live object (CASEBOOK rule 7).
// "Reset the touch layout" (the settings' `layout` row) clears it, and the HUD lays itself out from its own rule again.
//
// Prior art: every mobile shooter's saved custom HUD (kept per device, never synced with the account's progress); our own settings
// scope (core/save.js: kept across builds, never shelved with a mode's progress).
//
//   game.touchLayoutKeep = installLayoutKeep(game)   .get() -> a copy or null   .put(layout)   .clear()   Events: touch.layout { set, by }
// ---------------------------------------------------------------------------------------

const copy = (v) => (v == null ? null : JSON.parse(JSON.stringify(v)));

export function installLayoutKeep(game) {
  let layout = null;
  game.save?.section('touchLayout', { scope: 'settings', dump: () => copy(layout), load: (d) => { layout = copy(d); }, reset: () => { layout = null; } });
  const keep = {
    /** The layout kept, as a copy (null: none, the HUD's own rule lays it out). */
    get: () => copy(layout),
    /** The editor's layout kept as it is now. */
    put: (next) => { layout = copy(next); game.save?.dirty('touchLayout'); game.events?.emit('touch.layout', { set: layout != null, by: 'courier' }); },
    /** Forgotten: the HUD lays itself out again (the settings' reset). */
    clear: () => { if (layout == null) return; layout = null; game.save?.dirty('touchLayout'); game.events?.emit('touch.layout', { set: false, by: 'courier' }); },
  };
  return keep;
}
