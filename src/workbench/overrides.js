// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S KEPT EDITS, the part of the studio the game needs at boot. An effect edited in the workbench (workbench.js, EFFECTS:
// Apply) is kept in this browser and put back into the effects library (vfx/library.js) as the game starts, so the world plays it
// without the workbench ever being opened. The workbench itself ships as a chunk of its own, fetched the first time it opens
// (debug/workbenchloader.js); this small module is what stays in the startup bundle, and it imports nothing of the studio.
// The cinema's kept edits are the same idea in cine/sequence.js (`applyCineOverrides`).
//
// `pristineLibrary()` is the library as shipped, before any kept edit went in: the workbench's REVERT puts an effect back from it. It
// was taken in workbench.js while that was imported at start; the workbench now evaluates on its first open, after the edits are in,
// so it is taken here, once, at the start (`applyVfxOverrides` takes it before changing anything).
//
// Prior art: the engine editors' per-user override layers (Unreal's saved config over the shipped one, Unity's EditorPrefs): the shipped
// data is never edited, a kept layer is put over it at start, and revert drops the layer. `applyVfxOverrides` and `STORE` moved here out of workbench.js as they were.
//
//   applyVfxOverrides()   (main.js, before the Vfx is built)    STORE (the localStorage key)    pristineLibrary() -> a deep copy, as shipped
// ---------------------------------------------------------------------------------------
import { LIBRARY } from '../vfx/library.js';

export const STORE = 'ff.vfx.overrides';
let shipped = null;

/** The effects library as shipped (a deep copy, taken the first time it is asked for). */
export function pristineLibrary() { return shipped || (shipped = JSON.parse(JSON.stringify(LIBRARY))); }

/** Edits made in the workbench, kept in this browser: put into the library at boot, so the world plays them too. */
export function applyVfxOverrides() {
  pristineLibrary(); // (before any edit goes in)
  try { const o = JSON.parse(localStorage.getItem(STORE) || '{}'); for (const [k, v] of Object.entries(o)) LIBRARY[k] = v; } catch { /* none */ }
}
