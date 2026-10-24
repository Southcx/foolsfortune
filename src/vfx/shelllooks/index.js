// ---------------------------------------------------------------------------------------
// THE CASTER SHELLS' LOOKS, BATCHES 2 TO 4, GATHERED: each family's rows (for the look table, vfx/shelllooks.js) and its effects as data
// (for the effect library, vfx/library.js) merged into one of each, so the two files that read them take one import. A family is a
// module beside this one (edge, ember, storm, pull, clock, will, company, feelings, caster: docs/plans/CASTER-SHELLS.md section 3).
//
// Prior art: the library's own parts merged into one table (an effect is data, found by name), as Niagara's systems gather emitters.
//
//   SHELL_LOOK_ROWS (by shell id)   SHELL_EFFECTS (`shell.<id>.<moment>`, and `shell.ghost`)
// ---------------------------------------------------------------------------------------
import * as edge from './edge.js';
import * as ember from './ember.js';
import * as storm from './storm.js';
import * as pull from './pull.js';
import * as clock from './clock.js';
import * as will from './will.js';
import * as company from './company.js';
import * as feelings from './feelings.js';
import * as caster from './caster.js';
import * as tiers from './tiers.js'; // (a shell's tier ladder: the extras each tier wears, `shell.tier.<n>.<part>`)

const FAMILIES = [edge, ember, storm, pull, clock, will, company, feelings, caster];

export const SHELL_LOOK_ROWS = Object.assign({}, ...FAMILIES.map((f) => f.LOOKS));
export const SHELL_EFFECTS = Object.assign({
  // (what keeps the shells' afterimages ticking while any shows: shelllooks/kit.js leaveGhost; it draws nothing of its own)
  'shell.ghost': { layers: [{ type: 'sprites', rate: 1e-6, dur: Infinity, shape: 'soft', size: 0.01, life: 0.01 }] },
}, ...FAMILIES.map((f) => f.EFFECTS), tiers.EFFECTS);
