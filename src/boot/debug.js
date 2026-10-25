// ---------------------------------------------------------------------------------------
// BOOT DEBUG: the debug tools, in two stages. `bootTuning`: the diagnostics overlay (F3), the room reset, the knobs (what the move of a
// knob or a setting does) with the settings and their window, and the tuning panel (Tab). `bootDebug` comes later: the replay recorder,
// `/goto` and QAIS (F8, the owner's testing window), which a public build is made without.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootTuning(game, made) -> { diag, resetRoom, gui }
//   bootDebug(game, made) -> { replays }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { buildTuningPanel } from '../debug/tuning.js';
import { setOutlineThickness } from '../render/outline.js';
import { sfx } from '../audio/sfx.js';
import { installReplay } from '../debug/replay.js';
import { TIER_KEYS } from '../render/graphics.js';
import { setToon } from '../render/toon.js';
import { Diag } from '../debug/diag.js';
import { Qais } from '../debug/qais/qais.js';
import { installReportButton } from '../debug/qais/reportbutton.js';
import { Settings } from '../core/settings.js';
import { SettingsWindow } from '../ui/settingswindow.js';
import { installLayoutKeep } from '../core/layoutkeep.js';

const QAIS_ON = import.meta.env.VITE_PUBLIC !== '1'; // (a public build is made without QAIS: `VITE_PUBLIC=1 npm run build`; its window and store are not bundled then)

export function bootTuning(game, made) {
  const { renderer, scene, sun, physics, fx, events, level, spawnRoom, character, player, weapon, lachryma } = made;
  // diagnostics (F3: the perf panel; again: with the physics lines near them and the creatures' minds; F4 copies a report): debug/diag.js
  const diag = (game.diag = new Diag(game, renderer));

  const resetRoom = () => {
    game.trial?.abort();
    game.god?.onReset(); // (let go of what the hand holds)
    game.techs?.get('carry')?.reset(); // (put down what's in your hands before the props are cleared)
    fx.timed.length = 0;
    level.clearDynamic();
    weapon.clearDebris();
    spawnRoom();
    game.clappers?.clear();
    game.clappers?.spawnAll();
    game.baubles?.clear();
    game.lobbers?.clear();
    game.cubes?.clear();
    game.chests?.reset();
    game.shells?.clear();
    if (game.shells) for (const k of Object.keys(game.shells.counts)) game.shells.counts[k] = T.shells.start;
    game.lachryma?.reset();
    events.emit('room.reset', {});
  };

  const knobChanged = (group, key) => { // (a knob or a setting moved, on the panel or in the settings window: core/settings.js)
    if (group === 'physics' || group === '*') physics.setGravity(T.physics.gravity);
    if (group === 'movement' || group === '*') { player.applyTuning(); game.course?.refreshBoard(); }
    if (key === 'gunScale' || group === '*') character.setGunScale(T.weapon.gunScale);
    if (group === 'weapon') character.holsterLocal = null; // holster sliders

    if (key === 'outline' || group === '*') setOutlineThickness(T.visual.outline);
    if (key === 'exposure' || group === '*') renderer.toneMappingExposure = T.visual.exposure;
    if (key === 'toon' || group === '*') setToon(T.visual.toon ?? 1, scene);
    if (key === 'fog' || group === '*') scene.fog.density = T.visual.fog;
    if (key === 'shadows' || group === '*') { sun.castShadow = T.visual.shadows; }
    if (['resolution', 'upscale', 'smooth', 'shadowRes'].includes(key) || group === '*') game.present?.apply();
    if (key === 'shadowEvery') game.graphics?.applyShadowRate();
    if (key === 'graphics') { if (game.graphics?.setTier(T.visual.graphics)) game.events.emit('graphics.restart', { tier: T.visual.graphics, by: 'courier' }); } // (what changes now changes; the rest at the next start)
    else if (group === 'visual' && TIER_KEYS.includes(key) && T.visual.graphics !== 'custom') T.visual.graphics = 'custom'; // (a knob the tier owns moved by hand: the preset is Custom, as on any PC)
    if (key === 'volume' || group === '*') sfx.setVolume(T.audio.volume);
    if (group === 'lachryma' || group === '*') { lachryma.baseMax = T.lachryma.max; lachryma.regenRate = T.lachryma.regenRate; lachryma.regenDelay = T.lachryma.regenDelay; }
  };
  game.knobChanged = knobChanged; game.settings = new Settings(game); game.touchLayoutKeep = installLayoutKeep(game); // (the settings window's rows: core/settings.js; the touch layout the layout editor makes, kept in the settings scope: core/layoutkeep.js)
  game.settingsWindow = new SettingsWindow(game); // (the settings window: its dress, ui/settingswindow.js)
  const gui = buildTuningPanel(knobChanged, {
    copyJSON: () => navigator.clipboard?.writeText(JSON.stringify(T, null, 2)).then(() => game.log.say('system', 'Settings copied to the clipboard.', { key: 'settings.copy', throttle: 1 })),
    resetRoom,
    respawn: () => game.course?.respawnHere?.(), // (was R in the basement)
    toHub: () => game.course?.toHub(), // (was H)
  });
  setOutlineThickness(T.visual.outline);
  game.resetRoom = resetRoom;
  return { diag, resetRoom, gui };
}

export function bootDebug(game, made) {
  const { renderer, scene, camera, events, input, player, cursorFree, clock, sim } = made;
  const replays = (game.replays = installReplay(game, { player, frame: () => clock.frame, time: { get: () => sim.time, set: (v) => { sim.time = v; events.time = v; } } })); // (recording from the start of play, /replay, /record: debug/replay.js)
  game.chat.add('goto', { debug: true, help: 'stand at a place (/goto well.mouth) or a point (/goto x y z yaw: the stand line of a QAIS report)', run: (a) => {
    const n = a.map(Number), point = a.length >= 3 && n.slice(0, 3).every(Number.isFinite);
    const ok = point ? game.places.stand(new THREE.Vector3(n[0], n[1], n[2]), n[3] || 0) : a[0] ? game.places.travel(a[0]) : null;
    game.events.emit('courier.goto', { to: a.join(' ') || '(nowhere)', ok: !!ok, by: 'courier' });
  } });
  // QAIS (F8): the owner's testing window, in every build but a public one (debug/qais/, docs/plans/QAIS.md)
  game.qais = QAIS_ON ? new Qais(game, { renderer, scene, camera }) : null;
  if (QAIS_ON) installReportButton(game); // (a phone's F8: REPORT in the corner while touch play is on)
  if (game.qais) game.qais.onClose = () => { if (input.enabled && !cursorFree()) input.requestLock(); };
  return { replays };
}
