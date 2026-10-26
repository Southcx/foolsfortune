// ---------------------------------------------------------------------------------------
// THE PAGE'S ENTRY: which build of the page runs, chosen before any of its code is loaded: the box room on a phone (boot/box.js), the
// game everywhere else (main.js). The owner's iPhone XR lost the graphics in the game; WebKit as the XR measured the game's code alone,
// parsed and run, at some 260 MB before anything was built, so the box is its own chunk and a phone never loads the game's
// (the owner, 2026-10-26: "an isolated test room that's just a plain box and the courier ... for mobile debug mode for now").
// `?box=1` asks for the box anywhere, `?world=1` (or `?box=0`) for the game on a phone; a browser driven by a test (Playwright's
// `navigator.webdriver`) gets the game unless it asks for the box, so the sweeps and probes that play the game as a phone still do.
// The page's loader (index.html) fetches the chosen path's base64 assets at once (`__ffPrefetch`, vite.config.js), the other's never.
//
// Prior art: a launcher stub (id Tech's and Source's `-game` switch: one small executable choosing which module to load) and the
// code-split route (a dynamic import a route, Rollup's chunks shared between them).
//
//   index.html's loader imports this module; it imports boot/box.js or main.js
// ---------------------------------------------------------------------------------------
import { phoneByPage } from '../render/graphics.js';

/** Whether this load is the box room: `?box=1` anywhere; a phone unless `?world=1` (or `?box=0`) asks for the game or a test drives it. */
export function boxWanted(phone) {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  if (q.get('box') === '1') return true;
  if (q.get('world') === '1' || q.get('box') === '0') return false;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  return !!phone;
}

const box = boxWanted(phoneByPage());
globalThis.__ffPrefetch?.(box ? 'box' : 'main');
if (box) import('./box.js').then((m) => m.runBox());
else import('../main.js');
