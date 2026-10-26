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
import { makeWaterMaterial, waterGeometry } from '../vfx/water.js';
import { SKY_GLSL } from '../vfx/sky.js';
import { causticTexture } from '../vfx/liquid.js';

/** The box's room: 20 m a side and 5 m high round the Courier's spawn, a pillar and a ledge to move against. */
export const BOX = { at: [0, 0, -11.5], w: 20, h: 5, wall: 0.4, floor: 0xb8875f, walls: 0xd9b48c, prop: 0x8a5a3c };
/** The water test (the owner's v289 field reports: the liquid library's code, vfx/liquid.js, was drawn for the first time 0.1 to 0.5 real
 *  s before each of the three losses). v291: the game's water lost with its `textureGrad` taps made plain and without; v292: lost reading
 *  noise made here, the liquid packs alone held (drawn black: the ImageBitmaps do not upload on the owner's phone, a matter of their
 *  own); v293: cut after its vertex shader, its normals or its sky it held, whole but its discard it was lost; v294: the water half alone
 *  held to its absorption, its caustics and its sun, and was lost whole (foam, film, tint). Every pool that held never read `vTint`, so the
 *  compiler dropped the vertex shader's `uTints[ti]`, a uniform array read at an index worked out in the shader (the crude sea, the other
 *  loss, reads `uW[i]`, `uC[i]`, `uAbove[i]` so; three.js unrolls its own). Now four pools, each the whole water half with one change:
 *  1 the tint line taken out; 2 the tint kept, its array read at constant indices (`ti == 0 ? uTints[0] : ...`, the same result); 3 the
 *  miasma's film taken out; 4 the foam taken out. Left to right as you face them, each shown a real second after its pad's moment is
 *  written to the field report. `at` is metres from the box's middle: the pool's centre, its pad 4 m nearer. */
const TINT_AT_CONSTANT = 'if (ti >= 0 && ti < 8) vTint = vec4(ti == 0 ? uTints[0] : ti == 1 ? uTints[1] : ti == 2 ? uTints[2] : ti == 3 ? uTints[3] : ti == 4 ? uTints[4] : ti == 5 ? uTints[5] : ti == 6 ? uTints[6] : uTints[7], s / 9.0);';
export const BOX_POOLS = [
  { id: '9', name: 'box-water-no-tint', at: [-7.5, -6.5], pad: 0xf2efe6, edits: [{ part: 'frag', from: '  col = mix(col, vTint.rgb', with: '' }] },
  { id: '10', name: 'box-water-tint-at-constant', at: [-2.5, -6.5], pad: 0xe9c94a, edits: [{ part: 'vert', from: 'if (ti >= 0 && ti < 8) vTint = vec4(uTints[ti], s / 9.0);', with: TINT_AT_CONSTANT }] },
  { id: '11', name: 'box-water-no-film', at: [2.5, -6.5], pad: 0xe08a3c, edits: [{ part: 'frag', from: "  if (uSour > 0.001) { // the miasma's film: a mottled skin", to: '  alpha = smoothstep(0.0, 0.3, vDepth)', with: '' }] },
  { id: '12', name: 'box-water-no-foam', at: [7.5, -6.5], pad: 0xc0392b, edits: [{ part: 'frag', from: 'float foam = liqFoam(', with: 'float foam = 0.0;' }] },
];
const FIXED = 1 / 60;
const CAP = 1000 / 30 - 3; // (a phone's frame at 30 a real second, as the game's: boot/frame.js)

/** The box, its floor and walls static geometry through the level's own `box` (one merge, simple colliders). */
function buildBox(level) {
  const [x, y, z] = BOX.at, { w, h, wall } = BOX, half = w / 2;
  level.box([x, y - 0.25, z], [w, 0.5, w], BOX.floor, { outline: false }); // (positions and sizes as arrays: the level's own form)
  for (const [dx, dz, sx, sz] of [[0, -half, w, wall], [0, half, w, wall], [-half, 0, wall, w], [half, 0, wall, w]]) level.box([x + dx, y + h / 2, z + dz], [sx, h, sz], BOX.walls);
  level.box([x + 4, y + 1.5, z + 4], [1.2, 3, 1.2], BOX.prop); // (a pillar: wallrun, latch)
  level.box([x - 5, y + 0.6, z + 5], [4, 1.2, 2], BOX.prop); // (a ledge: mantle, hang)
  for (const p of BOX_POOLS) level.box([x + p.at[0], y + 0.01, z + p.at[1] + 4], [1.4, 0.02, 1.4], p.pad, { outline: false, collide: false }); // (the pools' pads)
  level.finalizeStatic();
}

/** The sky the water reflects, in place of the game's painted one (drawn before the water in the game, so not what is tested): a small
 *  gradient with the sky's own `skyUv`. */
function skyStandIn() {
  const w = 4, h = 16, d = new Uint8Array(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j / (h - 1), o = (j * w + i) * 4; d[o] = 110 + 110 * k; d[o + 1] = 150 + 80 * k; d[o + 2] = 200 + 50 * k; d[o + 3] = 255; }
  const texture = new THREE.DataTexture(d, w, h); texture.magFilter = texture.minFilter = THREE.LinearFilter; texture.needsUpdate = true;
  return { texture, GLSL: SKY_GLSL };
}

/** A noise texture made here, as a pack is laid out (four channels of unrelated noise, repeat-wrapped, mipmapped, anisotropy 4): the
 *  pack's place in the shader without its ImageBitmap. */
function noiseTexture(seed) {
  const n = 256, d = new Uint8Array(n * n * 4); let h = seed >>> 0;
  for (let i = 0; i < d.length; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; d[i] = h & 255; }
  const t = new THREE.DataTexture(d, n, n); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

/** The game's water program (vfx/water.js) with its Lachryma half taken out: what comes before the colour (`head`), the water half's own
 *  body laid in place of the uniform branch, and what comes after (`tail`); null if the shader's text is not as it stood (2026-10-26). */
function waterHalf(fs) {
  const a = fs.indexOf('  vec3 col; float alpha;\n', fs.indexOf('void main() {')), e = fs.indexOf('  } else {\n  // WATER', a), tl = fs.indexOf('  col = mix(col, vTint', e);
  if (a < 0 || e < 0 || tl < 0) return null;
  return { head: fs.slice(0, a + 25), body: fs.slice(e + 11, fs.lastIndexOf('  }\n', tl)), tail: fs.slice(tl) };
}

/** One edit of a pool's shader: the text from `from` up to `to` (or the end of `from`'s line) replaced by `with`; the text unchanged and
 *  false if `from` (or `to` after it) is not found. */
function editShader(text, e) {
  const i = text.indexOf(e.from); if (i < 0) return [text, false];
  const j = e.to ? text.indexOf(e.to, i) : text.indexOf('\n', i); if (j < 0) return [text, false];
  return [text.slice(0, i) + e.with + text.slice(j), true];
}

/** One of BOX_POOLS made: the game's water material on a 3.6 by 3 m plane, 1.5 m deep to its painted floor, its packs swapped for
 *  noiseTexture (the ImageBitmaps draw black on the phone), its fragment shader the water half only (waterHalf) and whole, with the
 *  pool's `edits`. An edit not found is said in the field report and the pool drawn without it. */
function makePool(game, sky, p) {
  const [x, y, z] = BOX.at, cx = x + p.at[0], cz = z + p.at[1];
  const v = { x0: cx - 1.8, x1: cx + 1.8, z0: cz - 1.5, z1: cz + 1.5, surface: y + 0.03, bottom: y - 1.5 };
  const mat = makeWaterMaterial(sky, 'water'); mat.name = p.name;
  mat.uniforms.uLiq.value = noiseTexture(0x9e3779b9); mat.uniforms.uLiq2.value = noiseTexture(0x85ebca6b);
  const W = waterHalf(mat.fragmentShader);
  if (!W) game.fieldReport?.moment(`pool ${p.id}: the water half not found, drawn whole`);
  else mat.fragmentShader = `${W.head}${W.body}${W.tail}`;
  for (const e of p.edits || []) {
    const key = e.part === 'vert' ? 'vertexShader' : 'fragmentShader', [text, ok] = editShader(mat[key], e);
    if (ok) mat[key] = text; else game.fieldReport?.moment(`pool ${p.id}: its edit at "${e.from.slice(0, 30)}" not found`);
  }
  const obj = new THREE.Mesh(waterGeometry(v), mat); obj.position.set(cx, v.surface, cz); obj.renderOrder = 2;
  obj.name = p.name; game.scene.add(obj);
  game.fieldReport?.moment(`pool ${p.id} shown (${p.name})`);
  return obj;
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
  game.fieldReport.watching = true; // (first draws kept from the start: the box has no title's dive to begin them)
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
  const sky = skyStandIn(), pools = new Map(); // (BOX_POOLS shown so far, by id)
  causticTexture(); // (the caustics' cells baked now, as the game's world bakes them at boot: a pool's first draw finds them ready)
  const padAt = (p) => [BOX.at[0] + p.at[0], BOX.at[2] + p.at[1] + 4];
  // (a pad stood on: its moment written to the field report first, and the pool shown a real second after, so a loss cannot take the
  //  word of which one with it: v291's two losses wrote nothing after them)
  const showPool = (p) => {
    pools.set(p.id, null);
    game.fieldReport?.moment(`pad ${p.id} stood on: ${p.name} in 1 s`);
    Promise.resolve(game.fieldReport?.write(true)).catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1000))).then(() => pools.set(p.id, makePool(game, sky, p)));
  };
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
    for (const p of BOX_POOLS) { const [px, pz] = padAt(p); if (!pools.has(p.id) && player.grounded && Math.abs(player.pos.x - px) < 0.7 && Math.abs(player.pos.z - pz) < 0.7) showPool(p); }
    for (const m of pools.values()) { const u = m?.material?.uniforms?.uTime; if (u) u.value += dt; }
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
