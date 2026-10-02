// ---------------------------------------------------------------------------------------
// WHAT PLAYS WHERE: the one place that says which cue the game is in (main.js asks it every frame and hands the answer to
// MusicPlayer.follow). In order: the main theme over the title and the pause; nothing while a chest's rave or the God Hand has the
// floor; the battle while something is after her; the dive under the water (the Shallows, the Deep below a few metres or in the
// Well's Lachryma); the shanty on the Solar Skiff; the Dunes' theme in the dunes; the work song in the workshop.
// A dive waits a moment before it takes over (and before it lets go), so a duck under the surface does not cut the place's music.
//
// Prior art: the "music state" of adaptive scores (iMUSE's priorities, Wwise's State groups): a short list, highest first.
//
//   import { chooseMusic } from './music/choose.js'    game.music.follow(chooseMusic(game, { overlay }))
// ---------------------------------------------------------------------------------------
import { LACHRYMA } from './lachryma.js';
import { BATTLE } from './battle.js';
import { DUNES } from './dunes.js';
import { WORKSHOP } from './workshop.js';
import { SHANTY } from './shanty.js';
import { SHALLOWS, DEEP } from './dive.js';

const DWELL_IN = 1.5, DWELL_OUT = 2.5; // (seconds under before the dive's music starts; seconds up before it stops)
const DEEP_IN = 4.5, DEEP_OUT = 3; // (metres below the surface: into the Deep, back to the Shallows)
const S = { under: 0, up: 0, diving: false, deep: false, last: 0 };

export function chooseMusic(game, { overlay = false } = {}) {
  if (overlay) return LACHRYMA;
  if (game.chests?.rave?.active || game.god?.active) return null;
  if (game.jellies?.hunting(24)) return BATTLE;
  // the dive (with a dwell either way)
  const now = performance.now() / 1000, dt = Math.min(0.25, now - (S.last || now)); S.last = now;
  const swim = game.techs?.get('swim'), under = !!(swim?.active && swim.under);
  if (under) { S.under += dt; S.up = 0; } else { S.up += dt; S.under = 0; }
  if (!S.diving && S.under > DWELL_IN) S.diving = true;
  if (S.diving && S.up > DWELL_OUT) { S.diving = false; S.deep = false; }
  if (S.diving) {
    const v = swim?.vol, depth = v && swim.P ? v.surface - swim.P.pos.y : 0;
    S.deep = v?.kind === 'lachryma' || (S.deep ? depth > DEEP_OUT : depth > DEEP_IN);
    return S.deep ? DEEP : SHALLOWS;
  }
  if (game.techs?.get('surfer')?.riding) return SHANTY;
  if (game.dunes?.active) return DUNES;
  if (game.zones?.current === 'workshop') return WORKSHOP;
  return null;
}
