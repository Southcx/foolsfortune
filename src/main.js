import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { T, PALETTE, loadTuning } from './config.js';
import { Physics, RAPIER, GROUPS } from './physics.js';
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
import animsB64 from './assets/anims.bin?b64';
import cmuB64 from './assets/anims_cmu.bin?b64';
import { decodeAnims } from './anims.js';
import { Clappers } from './clappers.js';
import { LachrymaPool, Baubles } from './lachryma.js';
import { Shells, SHELL_TYPES } from './shells.js';
import { Trial } from './trial.js';
import { Course } from './basement.js';
import { Techs } from './moves/techs.js';
import { Blink } from './moves/blink.js';
import { Slam } from './moves/slam.js';
import { Stomp } from './moves/stomp.js';
import { Roll } from './moves/roll.js';
import { Swim } from './moves/swim.js';
import { Ladder } from './moves/ladder.js';
import { SlipDive } from './moves/slip.js';
import { Hang } from './moves/hang.js';
import { Latch } from './moves/latch.js';
import { Pole } from './moves/pole.js';
import { Grate } from './moves/grate.js';
import { Balance } from './moves/balance.js';
import { Push } from './moves/push.js';
import { Carry } from './moves/carry.js';
import { Kick } from './moves/kick.js';
import { Recoil } from './moves/recoil.js';
import { Rigging } from './moves/rigging.js';
import { Lobbers } from './lobber.js';
import { Water, Ladders, SlipField } from './moves/env.js';
import { Events } from './events.js';
import { Movers } from './movers.js';
import { System } from './system/system.js';
import { Codex } from './system/codex.js';

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
  const sun = new THREE.DirectionalLight(0xffe8d2, T.visual.sun);
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
  const events = new Events();
  const game = {
    scene, physics, fx, hud, camera, stats, events,
    listenerDistance: (p) => camera.position.distanceTo(p),
    onBroken(ent) {
      events.emit('break', { kind: ent.kind, target: !!ent.def.target });
      if (ent.def.trial) { game.trial?.onTarget(ent); return; }
      if (ent.def.target) { hud.onBroken(stats.broken, 0); return; }
      stats.broken++;
      hud.onBroken(stats.broken);
      if (stats.broken === stats.total) hud.popup('WORKSHOP CLEARED · T TO RESET');
    },
    onClapper(c, text = 'CLAPPED') {
      stats.clappers = (stats.clappers || 0) + 1;
      hud.popup(stats.clappers % 5 === 0 ? `${stats.clappers} CLAPPERS` : text);
    },
    onRepaired() {
      stats.total++;
    },
    onExplosion(center, R) {
      const pc = player.pos.clone(); pc.y += 0.9;
      const d = pc.distanceTo(center);
      const reach = R * 1.3;
      if (d < reach) {
        const dir = pc.sub(center).normalize();
        const k = T.explosion.playerKnock * (1 - d / reach);
        player.impulse(dir.multiplyScalar(k).setY(dir.y * k + k * 0.5), 'explosion');
        player.grounded = false;
      }
      player.shake = Math.max(player.shake, T.explosion.shake * Math.max(0, 1 - d / (R * 3.5)));
    },
  };

  const breakables = new Breakables(scene, physics, fx, game);
  const level = new Level(scene, physics, breakables);
  game.level = level;
  // what the environmental movement techs read: water, ladders, slip (built with the level)
  const movers = new Movers(game);
  const env = { water: new Water(scene), ladders: new Ladders(scene), slip: new SlipField(scene), movers, rigging: new Rigging(scene, physics), lobbers: new Lobbers(scene, physics) };
  level.env = env;
  game.water = env.water; game.ladders = env.ladders; game.slip = env.slip; game.movers = movers; game.rigging = env.rigging; game.lobbers = env.lobbers;
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
  const clipPack = decodeAnims(animsB64);
  Object.assign(clipPack.clips, decodeAnims(cmuB64).clips); // (mocap: the soccer kick)
  const character = new Character(scene, charG, gunG, clipPack);
  character.onFootstep = () => sfx.footstep();
  game.character = character;

  const input = new Input(renderer.domElement);
  const player = new Player(physics, camera, input);
  game.player = player;
  player.game = game;
  // the System (what you've learned) is up before the techs, which ask it whether they may start
  const system = new System(game);
  game.system = system;
  const weapon = new Weapon(game);
  game.weapon = weapon;
  // movement techs (priority order: the first that wants the step gets it)
  const techs = new Techs(player, game);
  for (const T0 of [Swim, Ladder, Pole, Grate, Hang, Latch, Push, SlipDive, Roll, Slam, Blink, Stomp, Balance, Carry, Kick, Recoil]) techs.add(new T0(techs));
  env.lobbers.game = game;
  player.techs = techs;
  game.techs = techs;
  const codex = new Codex(game);
  game.codex = codex;
  codex.onClose = () => { if (input.enabled) input.requestLock(); };
  const modalOpen = () => !!(game.codex?.open || game.indexMenu?.open);
  const lachryma = new LachrymaPool({ max: T.lachryma.max, regenRate: T.lachryma.regenRate, regenDelay: T.lachryma.regenDelay });
  game.lachryma = lachryma;
  const baubles = new Baubles(game);
  game.baubles = baubles;
  const shells = new Shells(game);
  game.shells = shells;
  hud.buildShells(SHELL_TYPES);
  game.input = input;

  // physics debug lines (F3)
  const dbgGeo = new THREE.BufferGeometry();
  const dbg = new THREE.LineSegments(dbgGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
  dbg.frustumCulled = false;
  dbg.visible = false;
  scene.add(dbg);

  const resetRoom = () => {
    game.trial?.abort();
    game.techs?.get('carry')?.reset(); // (put down what's in your hands before the props are cleared)
    fx.timed.length = 0;
    level.clearDynamic();
    weapon.clearDebris();
    spawnRoom();
    game.clappers?.clear();
    game.clappers?.spawnAll();
    game.baubles?.clear();
    game.lobbers?.clear();
    game.shells?.clear();
    if (game.shells) for (const k of Object.keys(game.shells.counts)) game.shells.counts[k] = T.shells.start;
    game.lachryma?.reset();
  };

  const gui = buildTuningPanel((group, key) => {
    if (group === 'physics' || group === '*') physics.setGravity(T.physics.gravity);
    if (group === 'movement' || group === '*') { player.applyTuning(); game.course?.refreshBoard(); }
    if (key === 'gunScale' || group === '*') character.setGunScale(T.weapon.gunScale);
    if (group === 'weapon') character.holsterLocal = null; // holster sliders

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
  game.resetRoom = resetRoom;
  const trial = new Trial(game);
  game.trial = trial;
  const course = new Course(game);
  game.course = course;
  course.menu.onClose = () => { if (input.enabled) input.requestLock(); };

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
    if (!locked && !guiOpen && !modalOpen()) { overlay.style.display = 'flex'; input.enabled = false; }
  };
  renderer.domElement.addEventListener('click', () => {
    if (input.enabled && !input.locked && !guiOpen && !modalOpen()) input.requestLock();
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  document.getElementById('loading').remove();

  // --- errors: shown on screen (once each) instead of a silent freeze ------------
  const seenErrors = new Set();
  function reportError(e) {
    const msg = `${e?.message || e}`;
    if (seenErrors.has(msg)) return;
    seenErrors.add(msg);
    console.error(e);
    let box = document.getElementById('errbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'errbox';
      box.style.cssText = 'position:fixed;left:12px;top:12px;max-width:60%;z-index:30;background:rgba(28,13,8,.9);color:#ffb27a;'
        + 'border:1px solid #ff7a4a;padding:8px 10px;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none';
      document.body.appendChild(box);
    }
    box.textContent += `${box.textContent ? '\n' : 'Something broke (the game keeps running):\n'}${msg}\n${(e?.stack || '').split('\n').slice(1, 3).join('\n')}`;
  }
  addEventListener('error', (ev) => reportError(ev.error || ev.message));
  addEventListener('unhandledrejection', (ev) => reportError(ev.reason));

  // --- loop -------------------------------------------------------------------
  let acc = 0;
  let last = performance.now();
  const clock = { frame: 0 };
  let simTime = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    // (the first rAF timestamp can be earlier than the performance.now() taken at startup)
    const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05);
    last = now;
    if (window.__game?.manual) return;
    try {
      tick(dt);
      renderer.render(scene, window.__debugCam || camera);
    } catch (e) {
      reportError(e); // keep the loop alive and say what broke instead of freezing
    }
  }

  // ---- animation helpers ----
  let lastHeading = null;
  const _gd = new THREE.Vector3(0, -1, 0);
  const groundAt = (x, z, yTop) => {
    const hit = physics.raycast({ x, y: yTop, z }, _gd, 1.4, player.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    return hit && hit.normal.y > 0.6 ? hit.point.y : null;
  };
  // where the hands go besides the gun: a wall, a ledge
  const handContext = () => {
    const o = {
      drawT: weapon.drawT, upper: weapon.combatBlend * weapon.held, fw: player.fpWeight,
      fpPos: weapon.fpPos, fpQ: weapon.fpQ, camera, aimPoint: weapon.aimPoint, reloading: weapon.reloading,
      leftOverride: weapon.leftOverride, leftBlend: weapon.leftBlend, mantleT: player.mantle ? player.mantle.t : 1,
      techs: player.techs,
      aimTurn: player.techs.aimProfile()?.turn ?? 1, aimArm: player.techs.aimProfile()?.arm || null,
    };
    const w = player.wallrun;
    if (w) {
      // the wall-side hand reaches a little ahead along the run
      const sh = character.shoulder(w.side > 0 ? 'R' : 'L', new THREE.Vector3()).addScaledVector(w.dir, 0.3);
      const hit = physics.raycast(sh, w.n.clone().negate(), 1.3, player.collider, GROUPS.controllerQuery);
      if (hit) { o.wallPoint = hit.point; o.wallNormal = w.n; o.wallSide = w.side; lastWall = o; }
    } else if (player.wallBlend > 0.05 && lastWall) Object.assign(o, { wallPoint: lastWall.wallPoint, wallNormal: lastWall.wallNormal, wallSide: lastWall.wallSide });
    if (player.mantle) o.ledge = { point: player.mantle.edge, right: player.mantle.right };
    else if (player.mantleBlend > 0.05 && lastLedge) o.ledge = lastLedge;
    if (o.ledge) lastLedge = o.ledge;
    return o;
  };
  let lastWall = null;
  let lastLedge = null;

  // blink charges on the movement readout (while any are spent)
  const blinkPips = () => {
    const b = techs.get('blink');
    if (!b?.enabled || b.charges >= b.cfg.charges) return '';
    return ` · E ${'●'.repeat(b.charges)}${'○'.repeat(Math.max(0, b.cfg.charges - b.charges))}`;
  };

  // One simulation + animation frame. Split out so tests can drive exact frame rates.
  function tick(dt) {
    clock.frame++;
    simTime += dt;
    const now = simTime * 1000;

    if (input.wasPressed('Tab')) {
      guiOpen = !guiOpen;
      if (guiOpen) { gui.show(); gui.open(); document.exitPointerLock?.(); }
      else { gui.hide(); if (input.enabled) input.requestLock(); }
    }
    if (input.wasPressed('KeyB') && input.enabled) game.codex.toggle();
    if (modalOpen()) { input.dx = 0; input.dy = 0; input.endFrame(); return; } // (the Codex and the index pause the game)
    if (input.wasPressed('KeyT')) resetRoom();
    if (input.wasPressed('F3')) dbg.visible = !dbg.visible;
    if (guiOpen) { input.dx = 0; input.dy = 0; }

    trial.update(dt);
    player.look(dt, weapon.adsEase || 0);
    player.chargeLevel = weapon.charge;
    weapon.update(dt, input, player);
    player.updateBody(dt, weapon.adsT > 0 || weapon.wantsFire || weapon.cooldown > 0 || weapon.charge > 0 || weapon.holding);

    acc += dt;
    let steps = 0;
    events.time = simTime;
    while (acc >= FIXED && steps < 4) {
      movers.pre(FIXED);
      player.fixedUpdate(FIXED, { adsT: weapon.adsEase, wantsFire: weapon.wantsFire });
      player.guard();
      clappers.fixedUpdate(FIXED);
      shells.fixedUpdate(FIXED);
      breakables.preStep();
      physics.step(FIXED);
      movers.post(FIXED);
      acc -= FIXED;
      steps++;
    }
    if (steps === 4) acc = 0;
    physics.sync();
    movers.render(acc / FIXED);
    movers.tick(dt);
    system.tick(dt);

    techs.tick(dt);
    env.water.update(dt);
    env.rigging.update(dt);
    env.lobbers.update(dt);
    env.slip.update(dt);
    player.updateCamera(dt, acc / FIXED, weapon.adsEase, player.collider);
    character.setFirstPerson(player.fpWeight > 0.5);
    // fade the courier out when the 3rd-person camera is pressed up against her
    const near = camera.position.distanceTo(character.bones.spine003.getWorldPosition(new THREE.Vector3()));
    character.setFade(player.fpWeight > 0.5 ? 1 : THREE.MathUtils.smoothstep(near, 0.45, 1.1));
    weapon.computeAimPoint(camera, player);
    const aimDir = weapon.aimPoint.clone().sub(camera.position).normalize();
    // heading change rate (the slide leans into turns)
    const heading = Math.atan2(player.vel.x, player.vel.z);
    const turnRate = dt > 0 && Math.hypot(player.vel.x, player.vel.z) > 1 ? Math.atan2(Math.sin(heading - (lastHeading ?? heading)), Math.cos(heading - (lastHeading ?? heading))) / dt : 0;
    lastHeading = heading;
    const held = weapon.held;
    character.animate(dt, {
      pos: player.renderPos,
      yaw: player.bodyYaw,
      velocity: player.vel,
      vy: player.vel.y,
      turnRate,
      airJump: player.airJumpPulse ? (player.airJumpPulse = false, true) : false,
      ground: groundAt,
      grounded: player.grounded,
      groundN: player.grounded ? player.groundNormal() : null,
      groundVel: player.groundVel,
      wall: player.wallBlend,
      slide: player.slideBlend, mantle: player.mantleBlend, mantleT: player.mantle ? player.mantle.t : 1,
      dash: player.dashBlend, crouch: player.crouchBlend,
      aimPitch: Math.asin(THREE.MathUtils.clamp(aimDir.y, -1, 1)),
      aimYawOffset: player.aimYawOffset,
      combat: Math.max(weapon.combatBlend * held, player.fpWeight),
      upper: weapon.combatBlend * held,
      // right-side wallrun: the gun goes to the left hand so the right can take the wall
      gunHand: T.weapon.swapOnWallrun && weapon.drawn && player.wallrun && player.wallrun.side > 0 ? 1 : 0,
      reload: weapon.reloading ? weapon.reloadT : -1,
      walkSpeed: T.movement.walkSpeed,
      sprintSpeed: T.movement.sprintSpeed,
      recoil: weapon.kick * held,
      adsT: weapon.adsEase,
      landed: player.landedOut,
      techs: player.techs,
    });
    player.headRel = character.headRel;
    weapon.fpPose(dt, camera, player, character);
    character.poseHands(handContext());
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
    course.update(dt);
    // underground: no sun through the ground (it would light the lab outside its shadow
    // frustum), thinner fog so the long rooms read end to end, no shadow-map updates
    const under = THREE.MathUtils.clamp((-camera.position.y - 1) / 3, 0, 1);
    sun.intensity = T.visual.sun * (1 - under);
    scene.fog.density = T.visual.fog * (1 - 0.6 * under);
    // under the water: close teal murk
    const wv = env.water.at(camera.position.x, camera.position.y, camera.position.z);
    if (wv && camera.position.y < wv.surface) { scene.fog.color.setHex(0x24515a); scene.fog.density = 0.16; }
    else scene.fog.color.setHex(PALETTE.deep);
    renderer.shadowMap.autoUpdate = under < 1;
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
      speed: Math.hypot(player.vel.x, player.vel.z),
      move: (techs.label() || (player.wallrun ? 'WALLRUN' : player.sliding ? 'SLIDE' : player.mantle ? 'MANTLE' : player.dashT > 0 ? 'DASH' : player.crouching ? 'CROUCH' : player.sprinting ? 'SPRINT' : player.walking ? 'WALK' : !player.grounded ? 'AIR' : ''))
        + blinkPips(),
    });

    input.endFrame();
  }
  requestAnimationFrame(frame);

  // handle for automated tests / console tinkering
  window.__game = { THREE, RAPIER, T, scene, camera, renderer, physics, player, weapon, character, breakables, level, input, fx, hud, resetRoom, stats, clock, tick, clappers, lachryma, baubles, shells, trial, course, techs, game, events, movers, system, codex, manual: false };
  window.__ready = true;
}

main().catch((e) => {
  console.error(e);
  const l = document.getElementById('loading');
  if (l) l.textContent = `Failed to start: ${e.message}`;
});
