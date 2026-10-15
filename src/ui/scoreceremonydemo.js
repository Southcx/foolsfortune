// ---------------------------------------------------------------------------------------
// THE CEREMONY'S DEMO: the coach's own ceremony steps for a few outcomes, made with the rules modules, and a mount, so the score ceremony,
// the rolling number and the reel can be shown alone. Not wired into the game.
//   demoCeremony(kind = 'top' | 'plain' | 'dice' | 'reveal')   mountDemo(root, { speed, onBeat, events }) -> { ceremony, play(kind) }
// ---------------------------------------------------------------------------------------
import { ScoreCeremony } from './scoreceremony.js';
import { best } from '../progress/casino/querent/score.js';
import { ceremonyOf } from '../progress/casino/coach/ceremony.js';

const c = (r, s) => ({ r, s });
const run = (lo, s) => [lo, lo + 1, lo + 2].map((r) => c(r, s));
const CTX = { seatSuit: 0, stole: false, arcana: [1, 8, 21], board: [1, 8, 21], firstDraw: true, fate: { first: true }, nextTurn: false, stealsLeft: 0, steals: 0 };

/** A ceremony in the coach's shape: { steps, total, scale, tier, at }. */
export function demoCeremony(kind = 'top') {
  if (kind === 'dice') return { ...ceremonyOf('supernova', { react: 21, faces: [6, 3, 5, 4, 3], born: 2, decayed: 1, lost: 0 }), at: 0 };
  if (kind === 'reveal') return { ...ceremonyOf('nebula', { callout: 1, bluff: true, claim: 30, worth: 41, shown: [{ face: 6, sides: 6 }, { face: 20, sides: 20 }, { face: 9, sides: 12 }, { face: 4, sides: 8 }] }), at: 0 };
  const top = kind === 'top', cards = top ? [...run(1, 0), ...run(4, 0), ...run(7, 0)] : [...run(1, 0), ...run(4, 1), ...run(7, 2)];
  const b = best({ cards, quads: [] }, top ? CTX : { ...CTX, arcana: [], fate: null, firstDraw: false, stole: true });
  return { ...ceremonyOf('querent', b), at: 0 };
}

export function mountDemo(root, { speed = 1, onBeat = null, events = null } = {}) {
  const ceremony = new ScoreCeremony({ root, events, speed, onBeat });
  return { ceremony, play: (kind) => ceremony.play(demoCeremony(kind), { speed }) };
}
