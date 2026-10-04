// ---------------------------------------------------------------------------------------
// WHAT PLAYS WHERE: the one place that says which cue the game is in (main.js asks it every frame and hands the answer to
// MusicPlayer.follow). In order: the main theme over the title and the pause; nothing while a chest's rave, the God Hand or the rhythm
// mode has the floor; the battle while they are in a fight (game.combat: it starts on a notice and eases off after the last threat); the dive under the water (the Shallows, the Deep below a few metres or in the
// Well's Lachryma); a shanty on the Solar Skiff (the next work song each time the sail goes up); the Dunes' theme in the dunes; the work song in the workshop.
// A dive waits a moment before it takes over (and before it lets go), so a duck under the surface does not cut the place's music.
//
// Prior art: the "music state" of adaptive scores (iMUSE's priorities, Wwise's State groups): a short list, highest first.
//
//   import { chooseMusic, chooseTitleMusic } from './music/choose.js'    game.music.follow(chooseMusic(game, { overlay }))
//   (on the title: game.music.follow(chooseTitleMusic(game)): the overture handing on to the title's loop, the Fool's Step on PRESS START, the Fall under the menu)
// ---------------------------------------------------------------------------------------
import { LACHRYMA } from './lachryma.js';
import { BATTLE } from './battle.js';
import { DUNES } from './dunes.js';
import { WORKSHOP } from './workshop.js';
import { SHANTY } from './shanty.js';
import { ROLL_THE_MOON } from './shanties.js';
import { SHALLOWS, DEEP } from './dive.js';
import { TITLE, THE_STEP, FALL } from './title.js';
import { OVERTURE } from './overture.js';
import { LOCK_CUES, LOCK_LANDED } from './lockheart.js';
import { HEARTS } from '../tools/lockheart/table.js';

const DWELL_IN = 1.5, DWELL_OUT = 2.5; // (seconds under before the dive's music starts; seconds up before it stops)
const DEEP_IN = 4.5, DEEP_OUT = 3; // (metres below the surface: into the Deep, back to the Shallows)
const S = { under: 0, up: 0, diving: false, deep: false, last: 0, riding: false, shanty: -1, overtured: false };
const WORK_SONGS = [SHANTY, ROLL_THE_MOON]; // (the skiff's: a new one each time the sail goes up)

export function chooseMusic(game, { overlay = false } = {}) {
  if (overlay) return LACHRYMA;
  const U = game.ultimate; // (the Lockheart's Opening: its mode's cue while the wheel turns, its landing when it lands: music/lockheart.js)
  if (U?.active) { const mode = HEARTS[U.lh?.heart]?.mode || 'casting'; return U.phase === 'landed' || U.phase === 'back' ? LOCK_LANDED[mode] : LOCK_CUES[mode]; }
  if (game.chests?.rave?.active || game.god?.active || game.rhythm?.active) return null; // (the rhythm mode plays its own: music/rhythm/)
  if (game.combat ? game.combat.engaged : game.jellies?.hunting(24)) return BATTLE; // (combat.js: from a notice to a few seconds after the last threat)
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
  const riding = !!game.techs?.get('skiff')?.riding;
  if (riding && !S.riding) S.shanty = (S.shanty + 1) % WORK_SONGS.length;
  S.riding = riding;
  if (riding) return WORK_SONGS[S.shanty];
  if (game.dunes?.active) return DUNES;
  if (game.zones?.current === 'workshop') return WORKSHOP;
  return null;
}

/** The title (music/title.js): the overture, then its loop while they sit on the edge, the Fool's Step once when they go, then the Fall under the menu. */
export function chooseTitleMusic(game) {
  const state = game.title?.scene?.state ?? 'idle';
  if (state === 'idle') { // (the overture first, once a session: it hands on to the title's loop by itself, music/overture.js)
    if (!S.overtured && game.music?.current === TITLE) S.overtured = true;
    return S.overtured ? TITLE : OVERTURE;
  }
  S.overtured = true;
  if (state === 'step') return THE_STEP;
  return game.music?.current === THE_STEP ? THE_STEP : FALL; // (the step plays to its end, then the fall)
}
