// ---------------------------------------------------------------------------------------
// MAIN: the composition root. It runs the boot stages (boot/*.js) in order, each building one part of the game onto `game` (physics, the
// level, the Courier, the tools on the belt, the creatures, the places, the feedback), then the warm-up that compiles every shader
// (nothing may compile in play), and the last stage runs the frame: input, the fixed 1/60 s steps (the body, physics, movers), then the
// world's updates, the camera, the animation and the draw at 480 lines. A hub: each division adds a line here for what it builds
// (CLAUDE.md, Threads), to the stage it belongs with, one `game.x = new X(game)` line a system; the services are documented in their own
// headers.
//
// The stages share `made`, one object: each stage returns the locals the stages after it read (player, weapon, renderer, scene, ...) and
// main() merges that into `made`; a stage reads what it needs from `made` at its top. The frame's `clock` and the sim time are made up
// front, because the replay recorder (built in boot/debug.js) reads them before the frame is.
//
// Prior art: the composition root (Mark Seemann, "Dependency Injection": the one place that builds the object graph) and the staged start
// of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start); the game loop with a fixed simulation step is in
// boot/frame.js.
//
//   window.__game (the test harness's handle: tick(dt), draw(), game)   window.__boot (ms at each stage of loading)
// ---------------------------------------------------------------------------------------
import './render/threefixes.js'; // (first: shims for the pinned three, in place before any module builds a geometry)
import { BUILD } from './core/progress.js';
import { bootSave, bootSaveKeeping } from './boot/save.js';
import { bootRenderer, bootPresentation } from './boot/renderer.js';
import { bootServices } from './boot/services.js';
import { bootWorld } from './boot/world.js';
import { bootCourier } from './boot/courier.js';
import { bootTools } from './boot/tools.js';
import { bootPneuka } from './boot/pneuka.js';
import { bootGodHand } from './boot/godhand.js';
import { bootRooms } from './boot/rooms.js';
import { bootTuning, bootDebug } from './boot/debug.js';
import { bootCourse } from './boot/course.js';
import { bootCreatures } from './boot/creatures.js';
import { bootChat } from './boot/chat.js';
import { bootCoop } from './boot/coop.js';
import { bootProgress } from './boot/progress.js';
import { bootChatCommands, bootMoreChatCommands } from './boot/chatcommands.js';
import { bootTitle } from './boot/title.js';
import { bootWarmup } from './boot/warmup.js';
import { bootFrame } from './boot/frame.js';

// boot timings: window.__boot (ms at each stage since the page began), for profiling the load
const BOOT = (window.__boot = []);
const mark = (n) => { BOOT.push([n, Math.round(performance.now())]); window.__bootWatch?.stage?.(n); }; // (and said under the loading line, kept as the tab's breadcrumb: index.html's boot watch)

async function main() {
  if (window.__bootWatch) window.__bootWatch.build = BUILD; // (named in the breadcrumb: which build stopped)
  mark('main');
  const made = { mark, BOOT, sim: { time: 0 }, clock: { frame: 0 } }; // (what the stages make, for the stages after them; `sim` and `clock` are the frame's, made up front for the replay recorder)
  const make = (out) => Object.assign(made, out); // (a stage's return joins `made`)
  make(await bootSave(made));                  // (the seed, the save and the cloud save, the tuning kept: boot/save.js)
  make(await bootRenderer(made));              // (the machine's tier, the theme, the renderer, the scene, the camera, the sun: boot/renderer.js)
  make(await bootServices(made));              // (physics, the effects, the HUD, `game` and its first services, the breakables: boot/services.js)
  const { game } = made;
  make(await bootWorld(game, made));           // (the sky, the level and the places that add static geometry to it, the environment: boot/world.js)
  make(await bootCourier(game, made));         // (the models, the clip suite, the Courier's body and vessel, the input, the Player: boot/courier.js)
  make(bootTools(game, made));                 // (the System, the effects, the weapon, the techs and the tools on the belt, the parries: boot/tools.js)
  make(bootPneuka(game, made));                // (the Pneuka Box, the shops, the sound, the Codex, the window rules, the pool and its marks: boot/pneuka.js)
  make(bootGodHand(game, made));               // (the god hand, the Inner Realm, the lock-on, the interact chevron, the Sight: boot/godhand.js)
  bootRooms(game, made);                       // (what F acts on, and the rooms beyond the workshop: boot/rooms.js)
  make(bootTuning(game, made));                // (the F3 panel, the room reset, the knobs and the settings, the tuning panel: boot/debug.js)
  make(bootCourse(game, made));                // (the trial, the course and the map's places, the Weir, the chests, the Tracking rules, the achievements: boot/course.js)
  bootPresentation(game, made);                // (the light budget, the 480-line presentation, the graphics tier: boot/renderer.js)
  await bootCreatures(game, made);             // (the creatures, the folk, the dialogue box, the places, the agent: boot/creatures.js)
  bootChat(game, made);                        // (the chat line and what speaks on it: boot/chat.js)
  bootCoop(game, made);                        // (the party, the guests, the answers, the letters, the chatroom: boot/coop.js)
  bootProgress(game, made);                    // (the systems of progress: boot/progress.js)
  bootChatCommands(game, made);                // (the first chat commands: boot/chatcommands.js)
  bootSaveKeeping(game, made);                 // (the save's writers, the page watch, the cloud save attached: boot/save.js)
  make(bootDebug(game, made));                 // (the replay recorder, /goto, QAIS: boot/debug.js)
  bootMoreChatCommands(game, made);            // (the rest of the chat commands, the rhythm mode, the debug chests, the busker's mats: boot/chatcommands.js)
  make(await bootTitle(game, made));           // (the overlay, the pointer lock, the pause menu, the title: boot/title.js)
  await bootWarmup(game, made);                // (every shader compiled behind the loading screen, the loading screen removed: boot/warmup.js)
  bootFrame(game, made);                       // (the errors, the frame, the tick, the test harness's handles: boot/frame.js)
}

main().catch((e) => {
  console.error(e); window.__bootWatch?.fail?.(e);
  const l = document.getElementById('loading');
  if (l) l.textContent = `Failed to start: ${e.message}`;
});
