// ---------------------------------------------------------------------------------------
// THE PAGE'S ENTRY: which build of the page runs, chosen before any of its code is loaded: the game (main.js), or the box room
// (boot/box.js) when `?box=1` asks for it. The box was a phone's default while the owner's iPhone XR lost the graphics in the game (the
// owner, 2026-10-26: "an isolated test room that's just a plain box and the courier ... for mobile debug mode for now"); with the cause
// found (render/constantindex.js) the owner turned it off the same day, and every device loads the game again. The box stays its own
// chunk, so a load of the game never fetches it; BOX_ON_PHONE brings the old default back.
// The page's loader (index.html) fetches the chosen path's base64 assets at once (`__ffPrefetch`, vite.config.js), the other's never.
//
// Prior art: a launcher stub (id Tech's and Source's `-game` switch: one small executable choosing which module to load) and the
// code-split route (a dynamic import a route, Rollup's chunks shared between them).
//
//   index.html's loader imports this module; it imports boot/box.js or main.js
// ---------------------------------------------------------------------------------------
import { phoneByPage } from '../render/graphics.js';

/** Whether this load is the box room: `?box=1` only, unless the box's gold pad asked for the game once (`ff.world` in session storage,
 *  cleared as it is read). `phone` is kept for a default that may come back (BOX_ON_PHONE). */
export const BOX_ON_PHONE = false;
export function boxWanted(phone) {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  try { if (sessionStorage.getItem('ff.world') === '1') { sessionStorage.removeItem('ff.world'); return false; } } catch { /* no session storage */ } // (the box room's gold pad: the whole game, this load only)
  if (q.get('box') === '1') return true;
  if (q.get('world') === '1' || q.get('box') === '0') return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  return BOX_ON_PHONE && !!phone;
}

const box = boxWanted(phoneByPage());
globalThis.__ffPrefetch?.(box ? 'box' : 'main');
if (box) import('./box.js').then((m) => m.runBox());
else import('../main.js');
