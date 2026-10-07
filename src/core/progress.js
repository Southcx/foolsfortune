// ---------------------------------------------------------------------------------------
// PROGRESS, PER BUILD: while the game is being made, what the Courier has earned belongs to the build they earned it in. Each build
// carries its own id (made when it is built: vite.config.js's __BUILD__); the first time a new one runs, the save (core/save.js) wipes
// the progress scopes, the player's and the world's (the System's unlocks, the ledger and its achievements, the kit, the Book, the map
// they have walked, the records, the Wells, the shops, the ground), and keeps the settings (the window colour, the voice, the music, the
// tuning, the log's size). The achievements are placeholders, and a fresh start each build shows what a new player meets.
//
// Prior art: the wipe of an early-access or beta build (progress reset at each major patch, settings kept).
//
//   BUILD   this build's id (save.boot(BUILD) at boot: main.js)
// ---------------------------------------------------------------------------------------
/* global __BUILD__ */
export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
export const BUILD_URL = 'https://claude.ai/artifact/FjLfppJaKzUCZxoVBp9FE8'; // (where the playable build is published: the store every division reaches with ArtifactData)
