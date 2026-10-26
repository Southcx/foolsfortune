// ---------------------------------------------------------------------------------------
// THE BOX ROOM: a plain box, the Courier and the touch controls, and nothing else built (the owner, 2026-10-26: "Can we maybe build an
// isolated test room that's just a plain box and the courier and use that for mobile debug mode for now?"). The owner's iPhone XR lost
// the graphics on turning the camera in the workshop and on reaching the Raceway; WebKit as the XR measured the whole build at 2.1 GB,
// where the phone's own page gave out near 1 GB. The box is the floor to measure up from: the same renderer, services, Courier and core
// movement as the game, built by the game's own classes (never copies), with the world, the creatures, the folk, the progress, the title
// and the warm-up's parked looks left out, and a frame of its own that runs only what is here. On a phone it is what loads (the world
// with `?world=1`); on a desk with `?box=1` (boot/entry.js chooses, before either's code is loaded). Its field report goes to the same
// store as the game's, so the phone's own numbers come back.
//
// Prior art: a test map (id Tech's and Source's dev maps: a box and the player, everything else off), and the composition root
// (main.js) cut down to the parts a test needs.
//
//   runBox()   (boot/entry.js, in place of main.js: the boot timings, the boot watch and the stages below)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { GROUPS } from '../core/physics.js';
import { bootSave } from './save.js';
import { bootRenderer, bootPresentation } from './renderer.js';
import { bootServices } from './services.js';
import { bootCourier } from './courier.js';
import { Level } from '../world/level.js';
import { PaintMap } from '../world/ground/paintmap.js';
import { Seam } from '../render/seam.js';
import { Movers } from '../world/props/movers.js';
import { Water, Ladders } from '../courier/moves/env.js';
import { Rigging } from '../courier/moves/rigging.js';
import { Lobbers } from '../creatures/lobber.js';
import { System } from '../progress/system.js';
import { Vfx } from '../vfx/vfx.js';
import { Weapon } from '../tools/psygun/weapon.js';
import { Techs } from '../courier/moves/techs.js';
import { Blink } from '../courier/moves/blink.js';
import { Hover, Rocket } from '../courier/moves/jets.js';
import { Slam } from '../courier/moves/slam.js';
import { Stomp } from '../courier/moves/stomp.js';
import { Roll } from '../courier/moves/roll.js';
import { Hang } from '../courier/moves/hang.js';
import { Latch } from '../courier/moves/latch.js';
import { Kick } from '../courier/moves/kick.js';
import { Recoil } from '../courier/moves/recoil.js';
import { Emote } from '../courier/moves/emote.js';
import { ToolBelt, psygunTool } from '../tools/belt.js';
import { ProneHolster } from '../tools/proneholster.js';
import { Parries } from '../courier/parries.js';
import { FieldReport } from '../debug/fieldreport.js';
import { installFirstDraws } from '../render/firstdraws.js';
import { installTouchControls } from '../ui/touch/index.js';
import { TouchShell } from '../feedback/touchshell.js';
import { HudLayout } from '../ui/hudlayout.js';
import { BUILD } from '../core/progress.js';

/** The box's room: 20 m a side and 5 m high round the Courier's spawn, a pillar and a ledge to move against. */
export const BOX = { at: [0, 0, -11.5], w: 20, h: 5, wall: 0.4, floor: 0xb8875f, walls: 0xd9b48c, prop: 0x8a5a3c };
const FIXED = 1 / 60;
const CAP = 1000 / 30 - 3; // (a phone's frame at 30 a real second, as the game's: boot/frame.js)

/** The box, its floor and walls static geometry through the level's own `box` (one merge, simple colliders). */
function buildBox(level) {
  const [x, y, z] = BOX.at, { w, h, wall } = BOX, half = w / 2;
  level.box([x, y - 0.25, z], [w, 0.5, w], BOX.floor, { outline: false }); // (positions and sizes as arrays: the level's own form)
  for (const [dx, dz, sx, sz] of [[0, -half, w, wall], [0, half, w, wall], [-half, 0, wall, w], [half, 0, wall, w]]) level.box([x + dx, y + h / 2, z + dz], [sx, h, sz], BOX.walls);
  level.box([x + 4, y + 1.5, z + 4], [1.2, 3, 1.2], BOX.prop); // (a pillar: wallrun, latch)
  level.box([x - 5, y + 0.6, z + 5], [4, 1.2, 2], BOX.prop); // (a ledge: mantle, hang)
  level.finalizeStatic();
}

/** The box's boot, as main.js's for the game: the timings (`window.__boot`), the boot watch's stages and its failure. */
export function runBox() {
  const BOOT = (window.__boot = []);
  const mark = (n) => { BOOT.push([n, Math.round(performance.now())]); window.__bootWatch?.stage?.(n); };
  if (window.__bootWatch) window.__bootWatch.build = BUILD;
  mark('main');
  return bootBox({ mark, BOOT, sim: { time: 0 }, clock: { frame: 0 } }).catch((e) => {
    console.error(e); window.__bootWatch?.fail?.(e);
    const l = document.getElementById('loading'); if (l) l.textContent = `Failed to start: ${e.message}`;
  });
}

async function bootBox(made) {
  const { mark } = made;
  const make = (out) => Object.assign(made, out);
  make(await bootSave(made));
  make(await bootRenderer(made));
  make(await bootServices(made));
  const { game, scene, physics, breakables, renderer, camera, cloud } = made;
  game.box = true; // (the box room is up: what asks can say so)
  // the room
  game.paintmap = new PaintMap();
  const level = new Level(scene, physics, breakables); level.paintmap = game.paintmap; game.level = level;
  game.seam = new Seam(game);
  const movers = new Movers(game);
  const env = { water: new Water(scene, null), ladders: new Ladders(scene), movers, rigging: new Rigging(scene, physics), lobbers: new Lobbers(scene, physics) };
  level.env = env;
  game.water = env.water; game.ladders = env.ladders; game.movers = movers; game.rigging = env.rigging; game.lobbers = env.lobbers;
  buildBox(level);
  scene.background = new THREE.Color(PALETTE.deep);
  mark('box');
  make({ level, movers, env, box: true });
  // the Courier, their psygun (held, not fired) and the core movement (the game's own classes; no other tool, no clapperjars spawned)
  make(await bootCourier(game, made));
  const { player, input } = made;
  game.system = new System(game);
  game.vfx = new Vfx(game);
  const weapon = (game.weapon = new Weapon(game));
  const techs = new Techs(player, game);
  for (const T0 of [Hang, Latch, Roll, Slam, Blink, Hover, Rocket, Stomp, Kick, Recoil, Emote]) techs.add(new T0(techs));
  env.lobbers.game = game;
  game.belt = new ToolBelt(game);
  game.belt.add(psygunTool(weapon));
  game.proneHolster = techs.add(new ProneHolster(techs));
  player.techs = techs; game.techs = techs;
  game.parries = new Parries(game);
  make({ weapon, techs, system: game.system });
  bootPresentation(game, made);
  player.spawn.set(...BOX.at); player.pos.copy(player.spawn); player.prevPos.copy(player.spawn);
  // the touch controls, the field report, the first draws paced
  game.hudLayout = new HudLayout(game); // (the thumbs' areas and the log's two-line ticker on touch, as in the game: boot/warmup.js)
  installTouchControls(game);
  game.touchShell = new TouchShell(game);
  game.fieldReport = new FieldReport(game, { renderer, cloud });
  game.firstDraws = installFirstDraws(game, renderer, { frameTarget: () => game.post.target });
  try { await renderer.compileAsync(scene, camera); } catch { /* compiled at the first frame instead */ }
  document.getElementById('loading')?.remove();
  const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none'; // (the page's start card is the title's to take down: the box has no title)
  made.input.enabled = true; game.zones.enabled = true; // (play begins at once: the title's endTitle does this in the game)
  mark('box ready');
  boxFrame(game, made);
}

/** The box's frame: the Courier's input, body, steps, camera, pose and the draw; nothing the box does not hold. */
function boxFrame(game, made) {
  const { mark, renderer, scene, camera, physics, input, player, character, weapon, techs, movers } = made;
  let acc = 0, last = performance.now(), lastHeading = null;
  const _gd = new THREE.Vector3(0, -1, 0), _v = new THREE.Vector3();
  const groundAt = (x, z, yTop) => { const hit = physics.raycast({ x, y: yTop, z }, _gd, 1.4, player.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic()); return hit && hit.normal.y > 0.6 ? hit.point.y : null; };
  const errors = new Set();
  const report = (e) => { const m = `${e?.message || e}`; if (errors.has(m)) return; errors.add(m); console.error(e); game.fieldReport?.error(m); };
  addEventListener('error', (ev) => report(ev.error || ev.message));
  const ads = 0; // (the psygun is never aimed in: its update is the game's, not run here)
  function tick(dt) {
    game.touch.update(); game.pad.update(dt);
    game.rawDt = dt;
    player.look(dt, ads);
    game.proneHolster.update();
    game.belt.keys(input); // (the psygun is held and posed, never fired: its rounds and shells are the game's, not built here)
    player.updateBody(dt, techs.stance);
    acc += dt;
    let steps = 0;
    while (acc >= FIXED && steps < 4) { movers.pre(FIXED); player.fixedUpdate(FIXED, { adsT: ads, wantsFire: false }); player.guard(); physics.step(FIXED); movers.post(FIXED); acc -= FIXED; steps++; }
    if (steps === 4) acc = 0;
    game.alpha = acc / FIXED;
    player.renderPos.lerpVectors(player.prevPos, player.pos, game.alpha);
    physics.sync();
    techs.tick(dt); game.parries.update(dt);
    player.updateCamera(dt, game.alpha, ads, player.collider);
    character.setFirstPerson(player.fpWeight > 0.5);
    character.setFade(player.fpWeight > 0.5 ? 1 : THREE.MathUtils.smoothstep(camera.position.distanceTo(character.bones.spine003.getWorldPosition(_v)), 0.45, 1.1));
    weapon.computeAimPoint(camera, player);
    const aimDir = weapon.aimPoint.clone().sub(camera.position).normalize();
    const heading = Math.atan2(player.vel.x, player.vel.z);
    const turnRate = dt > 0 && Math.hypot(player.vel.x, player.vel.z) > 1 ? Math.atan2(Math.sin(heading - (lastHeading ?? heading)), Math.cos(heading - (lastHeading ?? heading))) / dt : 0;
    lastHeading = heading;
    const held = weapon.held;
    character.animate(dt, {
      pos: player.renderPos, yaw: player.bodyYaw, velocity: player.vel, vy: player.vel.y, turnRate,
      airJump: player.airJumpPulse ? (player.airJumpPulse = false, true) : false, ground: groundAt, grounded: player.grounded,
      groundN: player.grounded ? player.groundNormal() : null, groundVel: player.groundVel, wall: player.wallBlend,
      slide: player.slideBlend, mantle: player.mantleBlend, mantleT: player.mantle ? player.mantle.t : 1,
      dash: player.dashBlend, crouch: player.crouchBlend, crawl: player.prone, prone: 1, posture: player.posture,
      aimPitch: Math.asin(THREE.MathUtils.clamp(aimDir.y, -1, 1)), aimYawOffset: player.aimYawOffset,
      combat: Math.max(weapon.combatBlend * held, player.fpWeight), upper: weapon.combatBlend * held, gunHand: 0,
      reload: weapon.reloading ? weapon.reloadT : -1, walkSpeed: T.movement.walkSpeed, sprintSpeed: T.movement.sprintSpeed,
      recoil: weapon.kick * held, gun: weapon, adsT: ads, landed: player.landedOut, techs: player.techs,
    });
    player.headRel = character.headRel;
    weapon.fpPose(dt, camera, player, character);
    game.fx.update(dt, camera); game.vfx.update(dt);
    game.seam.update(dt);
    game.fieldReport?.frame(dt);
    game.zones.update(dt); game.lights.update(dt); game.present.update(dt);
    game.courierSquash.press(dt, player);
    input.endFrame();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (game.graphics?.machine?.mobile && now - last < CAP) return;
    const raw = (now - last) / 1000, dt = THREE.MathUtils.clamp(raw, 0, 0.05);
    last = now;
    if (window.__game?.manual) return;
    try { tick(dt); game.graphics.update(raw); game.graphics.beforeDraw(); game.firstDraws?.beginFrame(); game.post.render(scene, camera); }
    catch (e) { report(e); }
  }
  requestAnimationFrame(frame);
  window.__game = { THREE, scene, camera, renderer, game, player, tick, draw: () => { game.graphics.beforeDraw(); game.firstDraws?.beginFrame(); game.post.render(scene, camera); }, manual: false };
  mark('ready');
  window.__ready = true;
}
