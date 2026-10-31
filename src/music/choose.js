// ---------------------------------------------------------------------------------------
// WHAT PLAYS WHERE: the one place that says which cue the game is in (main.js asks it every frame and hands the answer to
// MusicPlayer.follow). In order: the main theme over the title and the pause; nothing while a chest's rave, the God Hand or the rhythm
// mode has the floor; a puzzle duel's own cue; a hop's stage on the Emocean; the battle; a Well's floor; the battle while they are in a fight (game.combat: it starts on a notice and eases off after the last threat); the dive under the water (the Shallows, the Deep below a few metres or in the
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
import { stageCue } from './emocean.js';
import { tripCue, railHeat, HEAT, setEncounter, setFoeUnder, setTrip, setBoss } from './legs.js';
import { WELL_FLOORS } from './well.js';
import { GREAT_JELLY, setFight } from './greatjelly.js';
import { GARDEN, AWAKENING, setGarden } from './garden.js';
import { KILN, setKiln } from './kiln.js';
import { RACEWAY, hearRace } from './raceway.js';
import { CASINO, hearCasino } from './casino.js';
import { phaseAt } from '../progress/weather.js';
import { OPEN_SEA, setSea } from './opensea.js';
import { READING, setReading } from './reading.js';
import { DRAFTING } from './drafting.js';
import { DUEL, hearDuel } from './duel.js';
import { WINGS } from './wings.js';
import { seasonOf } from '../progress/seasons.js';

const DWELL_IN = 1.5, DWELL_OUT = 2.5; // (seconds under before the dive's music starts; seconds up before it stops)
const DEEP_IN = 4.5, DEEP_OUT = 3; // (metres below the surface: into the Deep, back to the Shallows)
const S = { under: 0, up: 0, diving: false, deep: false, last: 0, riding: false, shanty: -1, overtured: false };
const WORK_SONGS = [SHANTY, ROLL_THE_MOON]; // (the skiff's: a new one each time the sail goes up)

export function chooseMusic(game, { overlay = false } = {}) {
  if (overlay) return LACHRYMA;
  const U = game.ultimate; // (the Lockheart's Opening: its mode's cue while the wheel turns, its landing when it lands: music/lockheart.js)
  if (U?.active) { const mode = HEARTS[U.lh?.heart]?.mode || 'casting'; return U.phase === 'landed' || U.phase === 'back' ? LOCK_LANDED[mode] : LOCK_CUES[mode]; }
  if (game.laidSpread?.under) { const S = game.laidSpread.sums || {}; let top = null; for (const k of ['wands', 'cups', 'swords', 'pentacles']) if ((S[k] || 0) > (S[top] || 0)) top = k; setReading({ suit: top }); return READING; } // (the Box turned over, a spread laid: music/reading.js)
  if (game.trackEditor?.active) return DRAFTING; // (the track editor open at the Raceway: music/drafting.js)
  if (game.chests?.rave?.active || game.god?.active || game.rhythm?.active) return null; // (the rhythm mode plays its own: music/rhythm/)
  // a Firing at the Chimney (music/kiln.js): its ending (fired or cooled) plays out in the garden; a Firing cancelled by leaving stops at once
  const T = game.garden?.tribulation, A = game.music?.arr;
  if (T?.active || (T?.outcome && game.garden?.inside && A?.alive && A.score === KILN)) { setKiln(T); return KILN; }
  if (game.garden?.awakening) return AWAKENING; // (a fossil woken by the Crucibelle's song: once, then the garden again)
  if (game.garden?.inside) { setGarden({ phase: phaseAt(), draught: strongest(game.draught), season: seasonNow(), rain: game.realm?.waterworks?.rain?.() ?? 0, briar: game.harmony?.briarK?.() ?? 0 }); return GARDEN; } // (the Inner Realm: the day's phase, your draught, the season, its rain and the planetoid's briar, music/garden.js)
  if (game.duel?.active) { hearDuel(game); return DUEL; } // (a puzzle duel open: its own cue, the Line's sections and the chain's heat, practice held calm: music/duel.js)
  if (game.rail?.stage?.active && game.rail.stage.legs?.length) { hearRail(game); const st = game.rail.stage, enc = st.encounter || st.campfire; setEncounter(enc && !enc.chosen); setFoeUnder(st.foe?.under); const B = st.boss; setBoss(B ? (B.down ? 'down' : B.enraged && !B.fell ? 'enraged' : 'up') : null); // (a boss's peak holds until it falls: stage.boss { enraged, fell, down }, RAIL-FLOW.md 5; fallen, the enrage layer drops while the ship comes round)
    setTrip({ lowFuel: st.fuel != null && st.fuel < 0.25, adrift: st.adrift, figures: game.rail.figures }); return tripCue(game.rail.stage.legs); } // (the rollercoaster: a cue a leg, music/legs.js)
  if (game.rail?.stage?.active) return stageCue(game.rail.stage.seconds ?? 150, game.rail.stage.setPieces ?? game.rail.stage.setPiece); // (a hop's rail is paced to its cue, so the fight on it is the cue: music/emocean.js)
  if (game.well?.fight?.active) { setFight(game.well.fight); return GREAT_JELLY; } // (the Great Slip Jelly's fight: its phases, music/greatjelly.js)
  if (game.combat ? game.combat.engaged : game.jellies?.hunting(24)) return BATTLE;
  if (game.well?.active) return WELL_FLOORS[Math.max(0, Math.min(2, (game.well.floor || 1) - 1))]; // (a Well's floor: music/well.js) // (combat.js: from a notice to a few seconds after the last threat)
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
  if (game.strawmanWell?.here) return !game.strawmanWell.stage || game.strawmanWell.stage.id === 'wings' ? WINGS : null; // (Strawman's Well: the wings' soft-shoe, a stage left quiet: music/wings.js)
  if (game.bazaar?.here) { hearCasino(game); return CASINO; } // (Raku's bazaar: the floor's march, the table's lounge, music/casino.js)
  if (game.raceway?.active) { hearRace(game); return RACEWAY; } // (the Raceway: the place, the countdown, the race and its last lap, music/raceway.js)
  if (game.opensea?.active) { hearSea(game); return OPEN_SEA; } // (the open sea: its mode the square's law, its strangeness the rows off the lanes, music/opensea.js)
  const riding = !!game.techs?.get('skiff')?.riding;
  if (riding && !S.riding) S.shanty = (S.shanty + 1) % WORK_SONGS.length;
  S.riding = riding;
  if (riding) return WORK_SONGS[S.shanty];
  if (game.dunes?.active) return DUNES;
  if (game.zones?.whole === 'workshop') return WORKSHOP;
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

/** The draught's leading feeling: `game.draught` as { aspect: share } (progress/stones.js draughtOf) or an aspect's name. */
function strongest(d) {
  if (!d || typeof d === 'string') return d || null;
  let best = null, top = 0;
  for (const [a, v] of Object.entries(d)) if (v > top) { top = v; best = a; }
  return best;
}

/** Rez's layers: the rail's locks, downs and a boss's parts heat the crossing's cue (music/legs.js railHeat), heard once a game. */
function hearRail(game) {
  if (S.railHeard || !game.events?.on) return;
  S.railHeard = true;
  game.events.on('rail.lock', () => railHeat(HEAT.lock));
  game.events.on('rail.volley', () => railHeat(HEAT.volley));
  game.events.on('rail.down', (e) => railHeat(HEAT.down * (1 + (e?.cls || 0) / 2)));
  game.events.on('rail.part', () => railHeat(HEAT.part));
  game.events.on('rail.core', () => railHeat(HEAT.core));
}

/** What the open sea tells its cue (music/opensea.js): the square you are in (its law and rows off the lane), your doubt, what you are moored at. */
function hearSea(game) {
  const O = game.opensea, v = O.voyage;
  if (S.seaAt !== v?.at) { S.seaAt = v?.at; S.sea = O.grid?.squares?.find((q) => q.id === v?.at) || null; }
  const sq = S.sea;
  setSea({ law: sq?.law ?? 0, off: sq?.off ?? 0, doubt: v?.doubt ?? 0, moored: O.moored?.islet != null ? 'islet' : O.moored?.quay ? 'quay' : null,
    hunt: !!game.seaFight?.serpent?.brain?.action?.hunt, coiled: !!game.seaFight?.serpent?.coiled });
}

/** The garden's season now (progress/seasons.js), summer while the calendar is not up. */
function seasonNow() { try { return seasonOf().id; } catch { return 'summer'; } }
