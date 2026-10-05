// ---------------------------------------------------------------------------------------
// REPLAYS IN THE GAME: the glue between the recorder (core/replay.js) and the game. Play is recorded from its first tick (the title
// gone), after the session's chance is reseeded and the save written whole, so the file names a state a fresh page can stand in again.
// `/replay save` gives the file; `/replay load` takes one: the save it names is put in place, the page is reloaded on it, the title is
// skipped, and its ticks are fed from the file until it ends (then the controls are the player's). `/record` begins a new recording
// here and now (not exact: the save and where the Courier stands come back, the world's loose state does not).
//
// Prior art: Doom's -playdemo / -record and Quake's `record` / `playdemo` console commands (a demo begun at a known state).
//
//   const replays = installReplay(game, { player, frame: () => n, time: { get, set } })   (game.replay: core/replay.js, built with the input)   dt = replays.tick(dt) (main.js, each tick)
//   replays.pending (a replay waits to be played on this page: skip the title)   replays.load(text) (game.replays: the test's way in)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BUILD } from '../core/progress.js';
import { zoneOf } from '../render/zones.js';

export function installReplay(game, { player, frame, time }) {
  const replay = game.replay, save = game.save, boot = game.seed; // (the seed the page was built from: a replay's page is built from it too)
  let pending = new URLSearchParams(location.search).has('replay') ? save.unstash('replay') : null;

  const record = (why) => {
    save.flush();
    const seed = (Math.imul(game.seed ^ 0x5bd1e995, frame() + 1) >>> 0) || 1;
    game.reseed(seed);
    replay.begin({ build: BUILD, boot, seed, why, exact: why === 'start' && frame() <= 1, // (exact: nothing had run before it, no trailer borrowed the world)
      save: save.export(), time: time.get(),
      at: { pos: [player.pos.x, player.pos.y, player.pos.z], yaw: player.yaw }, view: [innerWidth, innerHeight] });
  };

  const play = (text) => {
    const h = replay.play(text);
    game.reseed(h.seed); time.set(h.time);
    if (!h.exact) { // (begun mid-session: the Courier is set down where they stood)
      const at = new THREE.Vector3(...h.at.pos);
      if (zoneOf(at) === 'dunes' && !game.dunes?.active) game.course.toDunes();
      game.course.teleport(at, h.at.yaw);
    }
    game.events.emit('replay.play', { frames: replay.length, exact: !!h.exact, why: h.why });
  };
  replay.onEnd = (h) => game.events.emit('replay.end', { frames: replay.length, exact: !!h.exact });

  game.chat.add('replay', { help: 'replays: /replay save (this session, from the start of play, as a file), /replay load (play one)', run: ([what]) => {
    if (what === 'save') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([replay.text()], { type: 'application/json' }));
      a.download = `foolsfortune-${BUILD}-replay.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      game.events.emit('replay.save', { frames: replay.length, full: replay.full });
    } else if (what === 'load') {
      const f = document.createElement('input'); f.type = 'file'; f.accept = '.json,application/json';
      f.onchange = async () => { const file = f.files?.[0]; if (file) load(await file.text()); };
      f.click();
    } else game.log.say('system', 'Say /replay save or /replay load.', { throttle: 1 });
  } });
  game.chat.add('record', { help: 'begin a new replay from here (the save and where you stand come back, the loose world does not)', run: () => {
    record('record'); game.events.emit('replay.record', {});
  } });

  function load(text) {
    let r; try { r = JSON.parse(text); } catch { r = null; }
    if (!r?.frames) { game.log.say('system', 'That file is not a replay.', { throttle: 1 }); return; }
    if (r.build !== BUILD) { game.log.say('system', `That replay is of another build (${r.build}); this one is ${BUILD}.`, { throttle: 1 }); return; }
    save.hold('replay'); // (nothing written over what is put back, until the page is gone)
    if (window.__game) window.__game.manual = true; // (and the world stops: nothing else writes either)
    save.import(r.save, { replace: true });
    if (!save.stash('replay', text)) { game.log.say('system', 'That replay is too long to play here.', { throttle: 1 }); return; }
    location.search = `?seed=${r.boot}&replay`; // (the page is built from the seed it was built from: where the pots on the shelves stand)
  }

  // (play begins at the first tick with the title gone, or at the first deed, whichever is first)
  const starting = () => {
    if (replay.began || (game.title?.active && !window.__game?.manual)) return;
    if (pending) { const t = pending; pending = null; try { play(t); } catch (e) { console.warn(e); record('start'); } } else record('start');
  };
  replay.starting = starting;
  return {
    load, // (a replay's text, played on a page reloaded for it: what /replay load does with the file)
    get pending() { return !!pending; },
    /** Each tick, after the agent and before anything reads the input: the recording begun or played, and this tick's dt. */
    tick(dt) { starting(); return replay.frame(dt); },
  };
}
