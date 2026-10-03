// ---------------------------------------------------------------------------------------
// PROGRESS, PER BUILD: while the game is being made, what the Courier has earned belongs to the build they earned it in. Each build
// carries its own id (made when it is built: vite.config.js's __BUILD__); the first time a new one runs, everything that is progress
// (the System's unlocks, the ledger and its achievements, the Veritome's film and Book, the Pneuka Box, the map they have walked, the
// records of the circuits and the trial) is cleared, and the settings (the window colour, the voice, the music, the tuning, the log's
// size) are kept. The achievements are placeholders, and a fresh start each build shows what a new player meets.
//
// Prior art: the wipe of an early-access or beta build (progress reset at each major patch, settings kept).
//
//   const fresh = resetOnNewBuild()   (before anything reads its save; true when this build is new here)
// ---------------------------------------------------------------------------------------
/* global __BUILD__ */
export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
const KEY = 'foolsfortune.build';
// what is progress (cleared), by key prefix; anything else (settings) is kept
const PROGRESS = ['foolsfortune.system', 'foolsfortune.stats', 'foolsfortune.veritome', 'foolsfortune.pneuka', 'foolsfortune.map', 'foolsfortune.ground',
  'foolsfortune.course', 'foolsfortune.circuits', 'foolsfortune.trial', 'foolsfortune.flash', 'foolsfortune.shops', 'foolsfortune.vessel', 'foolsfortune.psygun'];

export function resetOnNewBuild() {
  try {
    const was = localStorage.getItem(KEY);
    if (was === BUILD) return false;
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && PROGRESS.some((p) => k.startsWith(p))) localStorage.removeItem(k); }
    localStorage.setItem(KEY, BUILD);
    return !!was; // (a first visit has nothing to clear, and is not told it was cleared)
  } catch { return false; }
}
