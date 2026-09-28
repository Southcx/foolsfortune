import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { T, PALETTE, loadTuning } from './config.js';
import { Physics } from './physics.js';
import { FX } from './fx.js';
import { Breakables } from './breakables.js';
import { Level } from './level.js';
import { Character } from './character.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Weapon } from './weapon.js';
import { Hud } from './hud.js';
import { buildTuningPanel } from './tuning.js';
import { setOutlineThickness } from './outline.js';
import { sfx } from './audio.js';
import courierB64 from './assets/courier.glb?b64';
import gunB64 from './assets/psygun.glb?b64';
import clapperB64 from './assets/clapperjar.glb?b64';
import { Clappers } from './clappers.js';
import { LachrymaPool, Baubles } from './lachryma.js';
import { Shells, SHELL_TYPES } from './shells.js';

const FIXED = 1 / 60;

async function main() {
  loadTuning();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = T.visual.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = T.visual.exposure;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.deep);
  scene.fog = new THREE.FogExp2(PALETTE.deep, T.visual.fog);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.03, 200);

  scene.add(new THREE.HemisphereLight(0xffe4cc, 0x6f3726, 2.3));
  scene.add(new THREE.AmbientLight(0xffd0b0, 0.35));
  const sun = new THREE.DirectionalLight(0xffe8d2, 3.2);
  // steep sun through the skylights: lights the upper floor and drops a shaft
  // down the atrium onto the ground floor
  sun.position.set(4, 30, -5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 5; sc.far = 50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const physics = new Physics();
  await physics.init();
  const fx = new FX(scene);
  fx.pixelRatio = renderer.getPixelRatio();
  const hud = new Hud();

  const stats = { broken: 0, total: 0 };
  const game = {
    scene, physics, fx, hud, camera,
    listenerDistance: (p) => camera.position.distanceTo(p),
    onBroken(ent) {
      if (ent.def.target) { hud.onBroken(stats.broken, 0); return; }
      stats.broken++;
      hud.onBroken(stats.broken);
      if (stats.broken === stats.total) hud.popup('WORKSHOP CLEARED · T TO RESET');
    },
    onClapper(c, text = 'CLAPPED') {
      stats.clappers = (stats.clappers || 0) + 1;
      hud.popup(stats.clappers % 5 === 0 ? `${stats.clappers} CLAPPERS` : text);
    },
    onExplosion(center, R) {
      const pc = player.pos.clone(); pc.y += 0.9;
      const d = pc.distanceTo(center);
      const reach = R * 1.3;
      if (d < reach) {
        const dir = pc.sub(center).normalize();
        const k = T.explosion.playerKnock * (1 - d / reach);
        player.vel.addScaledVector(dir, k);
        player.vel.y += k * 0.5;
        player.grounded = false;
      }
      player.shake = Math.max(player.shake, T.explosion.shake * Math.max(0, 1 - d / (R * 3.5)));
    },
  };

  const breakables = new Breakables(scene, physics, fx, game);
  const level = new Level(scene, physics, breakables);
  game.level = level;
  level.build();
  const spawnRoom = () => {
    level.spawnDynamic();
    stats.broken = 0;
    stats.total = [...breakables.items].filter((e) => !e.def.target).length;
    hud.broken = 0;
  };
  spawnRoom();
  game.breakables = breakables;

  const loader = new GLTFLoader();
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
  const [charG, gunG, clapG] = await Promise.all([
    loader.parseAsync(bytes(courierB64), ''),
    loader.parseAsync(bytes(gunB64), ''),
    loader.parseAsync(bytes(clapperB64), ''),
  ]);
  const clappers = new Clappers(game, clapG);
  game.clappers = clappers;
  clappers.spawnAll();
  const character = new Character(scene, charG, gunG);
  character.onFootstep = () => sfx.footstep();
  game.character = character;

  const input = new Input(renderer.domElement);
  const player = new Player(physics, camera, input);
  game.player = player;
  const weapon = new Weapon(game);
  game.weapon = weapon;
  const lachryma = new LachrymaPool({ max: T.lachryma.max, regenRate: T.lachryma.regenRate, regenDelay: T.lachryma.regenDelay });
  game.lachryma = lachryma;
  const baubles = new Baubles(game);
  game.baubles = baubles;
  const shells = new Shells(game);
  game.shells = shells;
  hud.buildShells(SHELL_TYPES);

  // physics debug lines (F3)
  const dbgGeo = new THREE.BufferGeometry();
  const dbg = new THREE.LineSegments(dbgGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
  dbg.frustumCulled = false;
  dbg.visible = false;
  scene.add(dbg);

  const resetRoom = () => {
    fx.timed.length = 0;
    level.clearDynamic();
    weapon.clearDebris();
    spawnRoom();
    game.clappers?.clear();
    game.clappers?.spawnAll();
    game.baubles?.clear();
    game.shells?.clear();
    if (game.shells) for (const k of Object.keys(game.shells.counts)) game.shells.counts[k] = T.shells.start;
    game.lachryma?.reset();
  };

  const gui = buildTuningPanel((group, key) => {
    if (group === 'physics' || group === '*') physics.setGravity(T.physics.gravity);
    if (group === 'movement' || group === '*') player.applyTuning();
    if (key === 'gunScale' || group === '*') character.setGunScale(T.weapon.gunScale);
    if (key === 'outline' || group === '*') setOutlineThickness(T.visual.outline);
    if (key === 'exposure' || group === '*') renderer.toneMappingExposure = T.visual.exposure;
    if (key === 'fog' || group === '*') scene.fog.density = T.visual.fog;
    if (key === 'shadows' || group === '*') { sun.castShadow = T.visual.shadows; }
    if (key === 'volume' || group === '*') sfx.setVolume(T.audio.volume);
    if (group === 'lachryma' || group === '*') { lachryma.baseMax = T.lachryma.max; lachryma.regenRate = T.lachryma.regenRate; lachryma.regenDelay = T.lachryma.regenDelay; }
  }, {
    copyJSON: () => navigator.clipboard?.writeText(JSON.stringify(T, null, 2)).then(() => hud.popup('SETTINGS COPIED')),
    resetRoom,
  });
  setOutlineThickness(T.visual.outline);

  // --- overlay / pointer lock -----------------------------------------------
  const overlay = document.getElementById('overlay');
  let guiOpen = false;
  const start = () => {
    sfx.unlock();
    overlay.style.display = 'none';
    input.enabled = true;
    input.requestLock();
  };
  overlay.addEventListener('click', start);
  input.onLockChange = (locked) => {
    if (input.lockFailed) {
      document.getElementById('lockwarn').style.display = 'block';
      return;
    }
    if (!locked && !guiOpen) { overlay.style.display = 'flex'; input.enabled = false; }
  };
  renderer.domElement.addEventListener('click', () => {
    if (input.enabled && !input.locked && !input.lockFailed && !guiOpen) input.requestLock();
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  document.getElementById('loading').remove();

  // --- loop -------------------------------------------------------------------
  let acc = 0;
  let last = performance.now();
  const clock = { frame: 0 };
  let simTime = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!window.__game?.manual) { tick(dt); renderer.render(scene, window.__debugCam || camera); }
    requestAnimationFrame(frame);
  }

  // One simulation + animation frame. Split out so tests can drive exact frame rates.
  function tick(dt) {
    clock.frame++;
    simTime += dt;
    const now = simTime * 1000;

    if (input.wasPressed('Tab')) {
      guiOpen = !guiOpen;
      if (guiOpen) { gui.show(); gui.open(); document.exitPointerLock?.(); }
      else { gui.hide(); if (input.enabled && !input.lockFailed) input.requestLock(); }
    }
    if (input.wasPressed('KeyT')) resetRoom();
    if (input.wasPressed('F3')) dbg.visible = !dbg.visible;
    if (guiOpen) { input.dx = 0; input.dy = 0; }

    player.look(dt, weapon.adsEase || 0);
    player.chargeLevel = weapon.charge;
    weapon.update(dt, input, player);
    player.updateBody(dt, weapon.adsT > 0 || weapon.wantsFire || weapon.cooldown > 0);

    acc += dt;
    let steps = 0;
    while (acc >= FIXED && steps < 4) {
      player.fixedUpdate(FIXED, { adsT: weapon.adsEase, wantsFire: weapon.wantsFire });
      clappers.fixedUpdate(FIXED);
      shells.fixedUpdate(FIXED);
      breakables.preStep();
      physics.step(FIXED);
      acc -= FIXED;
      steps++;
    }
    if (steps === 4) acc = 0;
    physics.sync();

    player.updateCamera(dt, acc / FIXED, weapon.adsEase, player.collider);
    character.setFirstPerson(player.fpWeight > 0.5);
    // fade the courier out when the 3rd-person camera is pressed up against her
    const near = camera.position.distanceTo(character.bones.spine003.getWorldPosition(new THREE.Vector3()));
    character.setFade(player.fpWeight > 0.5 ? 1 : THREE.MathUtils.smoothstep(near, 0.45, 1.1));
    weapon.computeAimPoint(camera, player);
    const aimDir = weapon.aimPoint.clone().sub(camera.position).normalize();
    character.poseBody(dt, {
      pos: player.renderPos,
      yaw: player.bodyYaw,
      velocity: player.vel,
      grounded: player.grounded,
      aimPitch: Math.asin(THREE.MathUtils.clamp(aimDir.y, -1, 1)),
      aimYawOffset: player.aimYawOffset,
      combat: Math.max(weapon.combatBlend, player.fpWeight),
      walkSpeed: T.movement.walkSpeed,
      sprintSpeed: T.movement.sprintSpeed,
      recoil: weapon.kick,
      adsT: weapon.adsEase,
      landed: player.landedOut,
    });
    weapon.poseGun(dt, camera, player, character);
    character.poseArms(weapon.leftOverride, weapon.leftBlend);
    weapon.tryFire(camera, player, character);
    if (weapon.charge > 0) fx.chargeTick(character.gunPoint('muzzle', new THREE.Vector3()), weapon.charge, dt);
    weapon.updateDebris(dt);

    breakables.update(dt);
    clappers.update(dt, acc / FIXED);
    shells.update(dt);
    baubles.update(dt);
    baubles.tick(dt);
    lachryma.update(dt);
    level.updateFeatures?.(dt, game);
    fx.update(dt, camera);
    level.kilnLight.intensity = 26 + Math.sin(now * 0.004) * 3 + Math.sin(now * 0.011) * 2;

    if (dbg.visible) {
      const { vertices, colors } = physics.world.debugRender();
      dbgGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      dbgGeo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    }

    hud.update(dt, {
      spreadDeg: weapon.spreadDeg(player), fov: camera.fov, pool: lachryma, shells: { types: SHELL_TYPES, selected: shells.selected, counts: shells.counts },
      reloadT: weapon.reloadT, fp: player.fpWeight > 0.5, ads: weapon.adsEase,
      shots: weapon.shots, hits: weapon.hits, total: stats.total, charge: weapon.charge,
    });

    input.endFrame();
  }
  requestAnimationFrame(frame);

  // handle for automated tests / console tinkering
  window.__game = { THREE, T, scene, camera, renderer, physics, player, weapon, character, breakables, level, input, fx, hud, resetRoom, stats, clock, tick, clappers, lachryma, baubles, shells, manual: false };
  window.__ready = true;
}

main().catch((e) => {
  console.error(e);
  const l = document.getElementById('loading');
  if (l) l.textContent = `Failed to start: ${e.message}`;
});
