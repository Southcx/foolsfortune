// ---------------------------------------------------------------------------------------
// THE AUDIO'S HEALTH: a watch on the mixer from the outside, for a phone nobody at the desk can hear (the owner, 2026-10-26, on the
// iPhone: "audio processing breaks down after combat is initiated and the ship's gun starts firing"). Every WATCH.every real seconds it
// compares the audio clock with the wall clock: a context whose audio thread cannot keep up renders fewer frames than real time asks
// for, and its clock falls behind; a context the browser took (an interruption, a call) stops. Either is written into this load's field
// report (debug/fieldreport.js, `moments`) with what was sounding: the sounds begun and the music's notes made in the window, the zone,
// the cue and its section, and the live moment. A few a load, spaced, so the report's other moments keep their room.
// A desk whose clock falls behind WATCH.lean windows running is put on the lean mixer (audio/core.js setLean: the phone's limits, its
// short rooms, its burst cap), once a load, and the field report says so; a desk that keeps up keeps its sound as it is.
// Prior art: the Web Audio "glitch" counters Chrome exposes in its media internals (frames rendered against frames asked for), and an
// audio callback's underrun count (Core Audio, AAudio) logged by a game's telemetry.
//
//   installAudioHealth(game, sfx)   (audio/cues.js hearEvents)   game.audioHealth -> the last window { k, state, sounds, notes }
// ---------------------------------------------------------------------------------------

/** every: real s a window; behind: the clock's share of real time below which the window is told; most: moments a load; gap: real s
 *  between two told. */
export const WATCH = { every: 2, behind: 0.95, most: 8, gap: 10, lean: 2 }; // (lean: windows behind in a row that put a desk on the lean mixer)

export function installAudioHealth(game, sfx) {
  if (typeof setInterval === 'undefined' || typeof document === 'undefined') return;
  let at = null, told = 0, toldAt = -1e9, lastState = null, behindRun = 0;
  setInterval(() => {
    const c = sfx.ctx; if (!c || document.hidden) { at = null; return; }
    const real = performance.now() / 1000, A = game.music?.arr;
    const now = { real, ct: c.currentTime, sounds: sfx.begun || 0, notes: A?.made || 0 };
    if (at && c.state === 'running' && lastState === 'running') {
      const dr = real - at.real, k = (now.ct - at.ct) / dr, win = { k: +k.toFixed(3), state: c.state, sounds: now.sounds - at.sounds, notes: now.notes - at.notes };
      game.audioHealth = win;
      const behind = k < WATCH.behind && dr < WATCH.every * 3;
      if (behind) tell(`audio behind: the clock ran ${(now.ct - at.ct).toFixed(2)} s in ${dr.toFixed(2)} s (${win.sounds} sounds, ${win.notes} notes)`);
      behindRun = behind ? behindRun + 1 : 0;
      if (behindRun >= WATCH.lean && !sfx.phone && !sfx.lean && sfx.setLean) { sfx.setLean(true); toldAt = -1e9; tell('audio lean: the desk put on the phone mixer\'s limits (short rooms, a burst cap)'); }
    }
    if (c.state !== lastState && lastState != null) tell(`audio ${lastState} -> ${c.state}`);
    lastState = c.state; at = now;
  }, WATCH.every * 1000);

  function tell(what) {
    const F = game.fieldReport, real = performance.now() / 1000;
    if (!F?.moment || told >= WATCH.most || real - toldAt < WATCH.gap) return;
    told++; toldAt = real;
    const A = game.music?.arr, sec = A?.score?.sections?.[A.section]?.id;
    F.moment(`${what}; in ${game.zones?.current || '?'}, cue ${A?.score?.title || 'none'}${sec ? ` (${sec})` : ''}${game.liveMoment?.() ? `, ${game.liveMoment()}` : ''}${sfx.phone ? ', the phone mixer' : sfx.lean ? ', the lean mixer' : ''}`);
  }
}
