// ---------------------------------------------------------------------------------------
// BOOT TITLE: the title and the pointer lock. The overlay and the pointer lock (what takes the mouse, what gives it back, Esc and the
// pause menu), the help pages, the title (THE FOOL'S PRECIPICE, drawn instead of the game until a choice is made) and its end, the
// resize rule (the overture's trailer is /overture's now). Whether play has begun and whether the tuning panel is open are `play`, which the tick reads.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootTitle(game, made) -> { overlayUp, play }
// ---------------------------------------------------------------------------------------
import { HelpMenu } from '../feedback/help/menu.js';
import { tuned } from '../debug/tuned.js';
import { sfx } from '../audio/sfx.js';
import courierB64 from '../assets/courier.glb?b64';
import gunB64 from '../assets/psygun.glb?b64';
import { installPlatform } from '../core/platform.js';
import { TitleScene } from '../title/scene.js';
import { TitleUI } from '../title/ui.js';

export async function bootTitle(game, made) {
  const { save, renderer, loader, bytes, clapG, clipPack, input, modalOpen, god, cursorFree, replays } = made;
  // --- overlay / pointer lock -----------------------------------------------
  const overlay = document.getElementById('overlay');
  const overlayUp = () => overlay.style.display !== 'none' && !window.__game?.manual;
  const play = { guiOpen: false, started: false }; // (the tuning panel is open; play has begun: the tick reads both, boot/frame.js)
  const start = () => {
    sfx.unlock();
    overlay.style.display = 'none';
    input.enabled = true; play.started = true;
    if (!cursorFree()) input.requestLock(); // (the hand's and the garden's cursor is free: GARDEN-SWEEP #10)
  };
  overlay.addEventListener('click', start);
  game.pause = () => { if (!play.started || overlay.style.display !== 'none' || game.title?.active) return; overlay.style.display = 'flex'; input.enabled = false; input.onBlur(); }; // (the touch bar's pause: no lock to lose on a phone, MOBILE.md 4)
  installPlatform(game); // (the phone's page: no zoom or scroll, the screen kept awake, which way it is turned: core/platform.js)
  game.help = new HelpMenu(document.getElementById('help'), () => overlay.style.display !== 'none' && !game.title?.active, save); // (the pause menu's pages: feedback/help/)
  // --- the title: THE FOOL'S PRECIPICE (title/): drawn instead of the game until a choice is made ---
  const [tCharG, tGunG] = await Promise.all([loader.parseAsync(bytes(courierB64), ''), loader.parseAsync(bytes(gunB64), '')]);
  const titleScene = new TitleScene(game, { charG: tCharG, gunG: tGunG, clipPack, clapG });
  game.vessel.dress(titleScene.ch); // (they wear on the hill what they wear in the world)
  const title = (game.title = { active: true, scene: titleScene, ui: null, mode: null });
  overlay.style.display = 'none';
  game.ui.want('title', true); // (the HUD steps out while the title is up: hideui.js)
  const endTitle = (quiet = false) => {
    if (!title.active) return;
    title.active = false; title.ui?.close(); game.ui.want('title', false); game.vessel.dressed.delete(titleScene.ch); titleScene.board?.release?.(); // (the title's chess pieces let go: title/board.js)
    if (!quiet) {
      // (from the dark of the dive into the world)
      const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#0b0614;z-index:12;pointer-events:none;transition:opacity .8s';
      document.body.appendChild(f); requestAnimationFrame(() => { f.style.opacity = '0'; }); setTimeout(() => f.remove(), 900);
      input.enabled = true; play.started = true;
      if (!god.active && !input.locked) input.requestLock();
      game.events.emit('title.enter', { mode: title.mode });
      { const { knobs } = tuned(); if (knobs.length) game.events.emit('tuning.tuned', { count: knobs.length, knobs, by: 'courier' }); } // (a tuned game is not a bug: debug/tuned.js)
    }
  };
  title.end = endTitle; // (tests and the profiler skip the title: tools/ and the scratch harness)
  title.ui = new TitleUI(game, {
    onStart: () => titleScene.go(),
    onChoose: (mode) => choose(mode),
  });
  // (a choice of the other mode reloads the page to put its save in place; the reload goes straight on into that mode, not through the
  // title again: on a phone the title twice was the boot twice, the owner's iPhone, v273)
  const watch = (at) => { try { window.__bootWatch?.moment?.(at); } catch { /* the page's own note */ } }; // (index.html's boot watch: the moment a killed tab was at)
  function choose(mode, resumed = false) {
    if (game.sealPicker?.isOpen || (title.ui?.chosen && title.ui.chosen !== mode)) return; // (one choice a load: the seal carving's typing once reached the menu behind it, and Enter picked STORY and reloaded, v300)
    if (title.ui) title.ui.chosen = mode; // (the menu takes no other pick, the resumed choice's too)
    if (mode !== save.mode && save.switchFresh(mode) && game.cloud) game.cloud.mode = mode; // (nothing to swap: taken up in place, the cloud's doc the new mode's)
    if (mode !== save.mode) { save.flush({ all: true }); save.stash('mode', mode); save.stash('titleChoice', mode); location.reload(); return; } // (the other mode's save: put in place at boot, before anything reads it)
    title.mode = mode; // (what DEBUG lends is the lend panel's: progress/lend.js; STORY lends nothing)
    if (mode === 'debug') game.pneuka.debugKit(); // (and the whole kit in the box: pneuka/box.js)
    game.mode = mode;
    game.iconWarm?.warmAll(); // (the Box's pictures made here, behind the title, not at its first opening: boot/iconwarm.js)
    const go = () => { input.requestLock(); watch('the dive into the world'); const into = () => { endTitle(); window.__bootWatch?.stage?.('first frame'); }; if (resumed) into(); else titleScene.dive(into); };
    if (!game.cradles.mine) { // (your seal, carved once: ui/sealpicker.js, HANKO.md 5)
      game.sealPicker.open(go); watch('the seal carving');
      const f = document.getElementById('sealpicker-name'); // (the phone's field: where a tab killed by iOS was, the next load says)
      f?.addEventListener('focus', () => watch('the seal carving, typing a name'));
      f?.addEventListener('blur', () => watch('the seal carving, the keyboard put away'));
      return;
    }
    go(); // (the lock within the click or the key: a browser only grants it to a gesture)
  }
  { const t = setInterval(() => { if (!window.__ready) return; clearInterval(t); if (title.active) watch('the title'); }, 250); } // (after boot's own 'ready')
  const resumed = save.unstash('titleChoice');
  if (resumed && resumed === save.mode && !replays.pending) { const wait = setInterval(() => { if (!window.__ready) return; clearInterval(wait); if (title.active) choose(resumed, true); }, 100); } // (once the boot is done: main.js sets __ready)
  titleScene.onMenu = () => title.ui.showMenu();
  if (replays.pending) { endTitle(true); overlay.style.display = 'none'; input.enabled = true; play.started = true; } // (a replay is played from the start of play: no title)
  // (the overture's trailer no longer plays on the title (the owner, 2026-10-25: it ran the world and mounted the Solar Skiff behind the title while
  // the game loaded); `/overture` loads and plays it: boot/chatcommands.js)
  let selfRelease = false; // (the next unlock is the game's own: see below)
  input.onLockChange = (locked, why) => {
    // (no lock under a window that frees the mouse: while the pointer is locked the browser keeps Esc for itself, so a window opened
    // over a lock taken by a stray click could not be closed with Esc: the owner's QAIS, 2026-10-06)
    if (locked && (modalOpen() || game.kilnUI?.open || game.dialogue?.open || (title.active && game.codex?.open))) { selfRelease = true; document.exitPointerLock?.(); return; }
    if (!locked && selfRelease) { selfRelease = false; return; } // (a release the game made itself is not you leaving: no pause, the kiln sweep's F and Esc spam)
    if (!locked && performance.now() - (input.escSpentAt ?? -1e9) < 500) return; // (an Esc a window spent closing itself is not you leaving either: casebook 125)
    if (!locked && why === 'refused') { game.log?.say('system', 'Click to take the mouse back.', { key: 'lock.refused', throttle: 5 }); return; } // (the browser would not give the mouse back after a window closed on Esc, which is no user action to it: that is not a pause, R12/T10 v133)
    if (title.active) return; // (the title owns the screen: no pause menu over it)
    if (input.lockFailed) {
      document.getElementById('lockwarn').style.display = 'block';
      return;
    }
    if (!locked && !play.guiOpen && !modalOpen() && !game.log?.busy && !cursorFree() && !game.reprogram?.open && !game.kilnUI?.open && !game.dialogue?.open && !game.lockheartCine?.active) { overlay.style.display = 'flex'; input.enabled = false; } // (a window that frees the mouse itself, the kiln's or a talk's, is not a pause: the owner's T10, v132)
  };
  // a talk frees the mouse as the kiln's window does (the game's own release, so no pause), and takes it back when it ends: a held lock
  // keeps Esc for the browser, and Esc mid-talk opened the pause menu with the talk still up (the owner's T136, v131; casebook)
  game.dialogue.onOpen = () => { if (input.locked) { selfRelease = true; document.exitPointerLock?.(); } };
  game.dialogue.onClose = () => { if (!input.locked && input.everLocked && input.enabled && !cursorFree() && !modalOpen() && !game.shopUI?.open && !game.kilnUI?.open) input.requestLock(); }; // (asked back whenever it is not held: a refusal while a window was up left the mouse loose with no card, T10)
  // Esc pauses: in play the pointer lock's own Esc does it (above); the God Hand has a free cursor, so there the key itself does (the art
  // wheel, if it is open, closes first)
  addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || e.repeat || !cursorFree() || !input.enabled || play.guiOpen || modalOpen() || game.dialogue?.open) return;
    e.preventDefault();
    if (game.realm?.press?.viewing) { game.realm.press.leave('esc'); return; } // (Esc leaves the press view, not to the pause menu: SOUL-ALCHEMY.md 4.3)
    if (game.realm?.bench?.viewing) { game.realm.bench.end(false, 'esc'); return; } // (and puts a dig off at the carving bench: world/garden/bench.js)
    if (god.arts.wheelOpen) { god.arts.closeWheel(false); return; }
    overlay.style.display = 'flex'; input.enabled = false; game.realm?.hand?.letGo(); // (what the garden's hand held is set down, not left hanging under the pause: GARDEN-SWEEP #14)
  });
  renderer.domElement.addEventListener('click', () => {
    if (input.enabled && !input.locked && !play.guiOpen && !modalOpen() && !game.log?.typing && !cursorFree() && !game.reprogram?.open && !game.kilnUI?.open) input.requestLock();
  });

  // (the render size and the camera's shape on a resize are the Presentation's: render/present.js)
  return { overlayUp, play };
}
