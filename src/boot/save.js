// ---------------------------------------------------------------------------------------
// BOOT SAVE: what the game keeps, in two stages of the boot. `bootSave` runs first, before anything is built: the console ring (a QAIS
// report reads the last warnings and errors), the session's seed (`?seed=N`), the save and the build's progress (a new build starts
// afresh; the save is the mode's, chosen on the title), the cloud save (1.5 real seconds at most) and the tuning kept. `bootSaveKeeping`
// runs near the end of the build: the modules that still write their own keys get a writer, a hidden or closed page writes everything
// now, a write the browser refused is said once, the cloud save is attached and a lost graphics context is given back.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootSave(made) -> { save, freshBuild, cloud }
//   bootSaveKeeping(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import { loadTuning } from '../core/config.js';
import { BUILD } from '../core/progress.js';
import { Save } from '../core/save.js';
import { CloudSave } from '../core/cloudsave.js';
import { installContextLoss } from '../render/contextloss.js';
import { reseed } from '../core/rng.js';
import { installConsoleRing } from '../debug/qais/attach.js';

const QAIS_ON = import.meta.env.VITE_PUBLIC !== '1'; // (a public build is made without QAIS: `VITE_PUBLIC=1 npm run build`; its window and store are not bundled then)

export async function bootSave() {
  if (QAIS_ON) installConsoleRing(); // (the last warnings and errors, for a QAIS report: debug/qais/attach.js)
  const seedArg = new URLSearchParams(location.search).get('seed'); // (?seed=N: a page that must play the same twice, the stress test's)
  reseed(seedArg != null ? +seedArg >>> 0 : (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0); // (the session's seed: every chance the simulation takes follows from it: core/rng.js)
  const save = new Save(); // (everything the game keeps, in one place: core/save.js)
  const freshBuild = save.boot(BUILD, save.unstash('mode') || save.lastMode()); // (a new build starts its progress afresh: the player's and the world's; and the save is the mode's chosen on the title, DEBUG or STORY: DEBUG-MODE.md section 2)
  const cloud = new CloudSave(save, { build: BUILD, mode: save.mode }); await cloud.boot(); // (the same save on every device: the published page's private store, 1.5 real s at most before anything loads: core/cloudsave.js)
  loadTuning(save); // (the tuning kept under its own key, through the save: core/config.js)
  return { save, freshBuild, cloud };
}

export function bootSaveKeeping(game, made) {
  const { save, cloud, renderer, events, system } = made;
  for (const m of [game.ledger, system, game.veritome?.book, game.cartography]) if (m?.save) save.writer(() => m.save()); // (they write their own keys on timers of their own, until each has a section: core/save.js)
  save.watchPage(() => cloud.flushNow()); // (a hidden or closed page writes everything now: a phone may never come back to the tab, MOBILE.md 10)
  { let said = false; save.onFail = (key, why) => { if (!said) { said = true; events.emit('save.fail', { key, why, by: 'environment' }); } }; } // (a write the browser refused: said once)
  cloud.attach(game); installContextLoss(renderer, game); // (the cloud's word at boot said now; the graphics context lost and given back: render/contextloss.js)
}
