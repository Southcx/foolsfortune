// ---------------------------------------------------------------------------------------
// BOOT FRAME: the frame and the tick. The errors shown on screen once each instead of a silent freeze, the frame (the workbench instead
// of the world, the title instead of the game, else the tick and the draw), the tick (the fixed 1/60 s steps, the world's updates, the
// camera, the animation, the effects) and the test harness's handles (`window.__game`, `window.__hideUI`, `window.__ready`).
//
// Prior art: the game loop with a fixed simulation step and an interpolated render (Glenn Fiedler, "Fix Your Timestep!"); the staged
// start of an engine for the stage itself (see boot/save.js).
//
//   bootFrame(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { RAPIER, GROUPS } from '../core/physics.js';
import { DUNE } from '../world/dunes/dunes.js';
import { ROOFED } from '../render/zonemap.js';
import { LACHRYMA } from '../music/lachryma.js';
import { chooseMusic, chooseTitleMusic } from '../music/choose.js';
import { ChestFx } from '../vfx/chestfx.js';
import { WireCompass } from '../vfx/wirecompass.js';
import { VaneHud } from '../vfx/vanehud.js';
import { CrucibelleHud } from '../vfx/crucibellehud.js';
import { VeritomeFrame } from '../vfx/veritomeframe.js';
import { TollReach } from '../vfx/tollreach.js';

const FIXED = 1 / 60;

export function bootFrame(game, made) {
  const { BOOT, mark, save, cloud, renderer, scene, camera, sun, physics, fx, hud, stats, events, breakables, level, movers, env,
    clappers, character, input, player, system, weapon, techs, codex, modalOpen, windowOpen, lachryma, baubles, shells, god, cursorFree,
    diag, resetRoom, gui, trial, course, replays, overlayUp, play, sim } = made;
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
  const clock = (game.clock = made.clock); // (the frame count, on the game for what must step once a frame however many call it: world/bazaar/session.js)
  const CAP = 1000 / 30 - 3; // (a phone's frame at 30 a real second: half the work and the heat, the PS2 era's own rate; the owner, 2026-10-25)
  function frame(now) {
    requestAnimationFrame(frame);
    if (game.graphics?.machine?.mobile && now - last < CAP) return; // (a display at 60 or 120: every other refresh skipped whole)
    // (the first rAF timestamp can be earlier than the performance.now() taken at startup)
    const rawFrame = (now - last) / 1000, dt = THREE.MathUtils.clamp(rawFrame, 0, 0.05); // (the raw interval for dynamic resolution: render/graphics.js)
    last = now;
    if (window.__game?.manual) return;
    try {
      diag.frameStart();
      if (game.workbench?.open) { game.workbench.frame(dt); input.endFrame(); diag.frameEnd(); return; } // (the workbench instead of the world: workbench/)
      const O = game.overture;
      if (game.title?.active && O?.world) { // (the trailer: the world run behind the title for it, the title's music kept)
        O.update(dt); tick(dt); game.music.follow(chooseTitleMusic(game));
        game.post.render(scene, camera); O.afterRender(renderer.domElement);
        input.endFrame(); diag.frameEnd();
        return;
      }
      if (game.title?.active) { // (the title instead of the game: the world waits, built, behind it)
        game.title.scene.update(dt); game.music.follow(chooseTitleMusic(game)); // (music/choose.js, music/title.js)
        O?.update(dt); O?.titleFrame(game.title.scene); // (the overture's last bars: the crane and the logo fired)
        if (game.title.scene.state === 'dive') game.title.ui.fade((game.title.scene.st - 0.5) / 0.6);
        game.title.scene.render(); game.graphics.observe(rawFrame); game.fieldReport?.frame(rawFrame); input.endFrame(); diag.frameEnd(); // (the title's cheap frames: the display's refresh, render/graphics.js)
        return;
      }
      if (O?.active) O.update(dt); // (`/overture` in the world: its trailer on a clock of its own)
      diag.begin('sim'); tick(dt); diag.end('sim');
      game.graphics.update(rawFrame); game.graphics.beforeDraw();
      diag.begin('draw'); // (the PS2 glow and the grade over the frame: render/glow.js; the reading instead of the world while the Box is turned over)
      game.firstDraws?.beginFrame(); // (a phone's first draws, a few a frame: render/firstdraws.js)
      if (game.readingScene?.active) game.readingScene.render(); else if (!game.seam?.covering || game.firstDraws?.on) { if (game.duelInstance?.active) game.duelInstance.render(scene, window.__debugCam || camera); else game.post.render(scene, window.__debugCam || camera); } // (under the shut cover while an arrival is staged nothing is drawn, render/seam.js; but with the phone's budget it is, paced, so the place is drawn behind the cover)
      diag.end('draw');
      if (O?.active) O.afterRender(renderer.domElement);
      game.veritome?.afterRender(renderer.domElement); // (a photograph is the frame just drawn)
      game.finishPlate?.afterRender(renderer.domElement); // (and a photo finish's plate, the frame at the line)
      if (BOOT.length && BOOT[BOOT.length - 1][0] === 'ready') mark('first frame');
      game.portrait.render();
      diag.frameEnd();
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

  // One simulation + animation frame. Split out so tests can drive exact frame rates.
  function tick(dt) {
    clock.frame++;
    game.touch.update(); game.pad.update(game.rawDt || dt); // (the thumbs' and the pad's state as this tick's keys, before anything reads them)
    game.agent?.update(dt); // (an AI player's intent becomes this tick's input, before anything reads it: agent/agent.js)
    dt = replays.tick(dt); // (recorded, or fed from a replay: the input and the dt this tick runs on)
    game.rawDt = dt;
    dt *= game.time.update(dt); // (everything below runs in game time; the player's own blade is read in real seconds)
    sim.time += dt;
    const now = sim.time * 1000;

    if (input.wasPressed('Tab')) {
      play.guiOpen = !play.guiOpen;
      if (play.guiOpen) { gui.show(); gui.open(); document.exitPointerLock?.(); }
      else { gui.hide(); if (input.enabled && !cursorFree()) input.requestLock(); }
    }
    if (input.wasPressed('KeyB') && input.enabled && (game.codex.open || !windowOpen())) game.codex.toggle();
    if (input.wasPressed('KeyP') && input.enabled && !game.duel.active && (game.pneukaUI.open || (!windowOpen() && !god.controlling))) game.pneukaUI.toggle();
    // (the survey is the Dreamvane's now, MMB with it drawn: tools/dreamvane/dreamvane.js; N stays the god hand's, which has no tools)
    if (input.wasPressed('KeyN') && input.enabled && !play.guiOpen && !modalOpen() && god.controlling) game.cartography.survey(true);
    if (input.wasPressed('Backquote') && input.enabled && !play.guiOpen && !modalOpen() && !game.rail?.stage.active && !game.duel.active) { if (game.realm?.active) game.realm.camera.toggleOverhead(); else god.toggle(); } // (in the garden the god hand's view is straight down on the Jar: world/garden/gardencam.js)
    game.bazaarTable?.tick(game.rawDt ?? dt); // (a seat at Raku's tables: its cloth, cards and dice, its clock is the bazaar's own tickModal: vfx/bazaartable.js)
    if (modalOpen()) { game.seam.update(game.rawDt); game.cartography.tickModal(); game.bazaar?.tickModal(game.rawDt); game.mooring?.update(game.rawDt); game.pier?.helmTick(); game.laidSpread?.update(game.rawDt); game.readingScene?.update(game.rawDt); game.scanner?.update(game.rawDt); input.dx = 0; input.dy = 0; input.endFrame(); return; } // (the Codex and the index pause the game; a seam under way still comes back up: GARDEN-SWEEP #1; the Box's window still recounts its spread and draws its reading)
    if (play.started && overlayUp()) { game.seam.update(game.rawDt); if (!game.rail?.stage.active) game.music.follow(LACHRYMA); input.dx = 0; input.dy = 0; input.endFrame(); return; } // (and so does the pause menu)
    game.duel.update(game.rawDt ?? dt, input); // (a puzzle duel takes the keys it reads, before anything below sees them: world/duel/duelsession.js)
    game.mood.begin(); // (what the last frame's dimming changed, put back before anything sets its own values)
    game.courierSquash.lift(); // (and the Courier's true shape, before anything reads the body: courier/anim/squash.js)
    // (setting the room again, the last checkpoint and the hub are the Tab panel's: tuning.js actions)
    if (input.wasPressed('F3')) diag.cycle();
    if (input.wasPressed('F2')) game.ui.cycle();
    if (play.guiOpen) { input.dx = 0; input.dy = 0; }

    trial.update(dt);
    game.throwingRoom?.update(dt, game.rawDt ?? dt);
    const godOn = god.controlling; // (the hand: the Courier is a jar, and none of their machinery runs)
    const aboard = !!game.rail?.stage.active || !!game.realm?.active || game.duel.active || !!game.opensea?.sailing || !!game.trackEditor?.active || !!game.haunt?.on; // (the track editor and the haunt: the Courier held at the lot) // (a crossing: the Courier is aboard the ship, held there; in the garden they are the Jar: theirs does not run either)
    const worldAsleep = !!game.realm?.active; // (in the Spirit Garden the island's own bodies hold still: its jellies, wisps, pots, clapperjars, fish and chests, 1.8 of the garden's 4.2 ms a tick, the deep clean's profile; the minds and statuses run on, the garden's spirits are among them)
    game.matter?.update(dt); // (the island's matter runs and mends whether or not the hand is out)
    game.creations?.update(dt);
    game.god?.arts?.powers?.update(dt); // (what the hand's powers leave lasting: rifts, wards, totems, workers: godhand/powers.js)
    game.rejection?.update(dt);
    if (godOn) god.update(dt);
    else if (!aboard) {
      player.look(dt, weapon.adsEase || 0);
      player.chargeLevel = weapon.charge;
      game.reprogram.claim(input); // (the middle button near a stunned mind is the Veritome's, not a shell: tools/veritome/reprogram.js)
      game.proneHolster.update(); // (before the psygun and the tools read their keys)
      game.belt.keys(input); // (X the main, R the sub's verb: tools/belt.js)
      weapon.update(dt, input, player);
      player.updateBody(dt, weapon.adsT > 0 || weapon.wantsFire || weapon.cooldown > 0 || weapon.charge > 0 || weapon.holding || techs.stance);
    }

    acc += dt;
    let steps = 0;
    events.time = sim.time;
    while (acc >= FIXED && steps < 4) {
      movers.pre(FIXED);
      god.arts.fixed(FIXED);
      if (godOn) god.fixed(FIXED);
      else if (!aboard) {
        player.fixedUpdate(FIXED, { adsT: weapon.adsEase, wantsFire: weapon.wantsFire });
        player.guard();
      }
      game.realm?.fixed(FIXED); // (the Jar and the spirits on their planetoids)
      game.party.fixed(FIXED); // (the siblings: coop/party.js)
      if (!worldAsleep) clappers.fixedUpdate(FIXED);
      shells.fixedUpdate(FIXED);
      if (!worldAsleep) breakables.preStep();
      diag.begin('physics'); physics.step(FIXED); diag.end('physics');
      movers.post(FIXED);
      acc -= FIXED;
      steps++;
    }
    if (steps === 4) acc = 0;
    game.alpha = acc / FIXED; // (how far between the last step and the next this frame is: what the visuals interpolate by)
    if (!godOn) player.renderPos.lerpVectors(player.prevPos, player.pos, game.alpha); // (before the techs place their meshes: the camera's own lerp comes later in the frame)
    physics.sync();
    movers.render(acc / FIXED);
    movers.tick(dt);
    system.tick(dt);
    game.ledger.tick(dt);
    save.flush(); // (whatever changed this frame, written whole: core/save.js)
    cloud.update(game.rawDt || dt); // (and what changed sent to the cloud, at most once a real minute: core/cloudsave.js)
    game.fieldReport?.frame(game.rawDt || dt); // (this load's field report: debug/fieldreport.js)
    game.tracking.update(dt);
    game.achievements.tick(dt);
    game.log.tick(dt);
    game.cartography.update(dt);
    game.cinema.update(game.rawDt); // (the frame and the vignette ease in real seconds, so a slowed world keeps its bars)
    game.folk?.update(dt); game.dialogue?.update(game.rawDt); game.shops?.update(dt); game.weather?.update(dt); game.vessel?.update(game.rawDt); game.toolSkins?.update(game.rawDt); game.vesselDamage?.update(dt); game.death?.update(game.rawDt); game.ultimate?.update(game.rawDt); game.combat?.update(dt);
    diag.begin('minds'); game.ai.update(dt); game.creatures.update(dt); if (!worldAsleep) { game.jellies.update(dt); game.wisps?.update(dt); } game.stun.update(dt); game.dissolve.update(dt); game.figmentScatter.update(dt); game.flash.update(game.rawDt); game.pairSpecials?.update(game.rawDt); game.reprogram.update(game.rawDt); diag.end('minds');
    game.pulse.update(dt);
    game.portrait.update(game.rawDt, game.angler?.fightView?.());
    game.interact.update(game.rawDt);
    game.cradles.update(dt); // (sealing and unsealing; an engine's draw; a body's hull)
    game.seam.update(game.rawDt); // (a cover over a change of place: render/seam.js)
    game.ground.update(dt); // (things on the floor turn; F picks up the one the chevron is on)
    game.belt.tick(); // (what is not worn stays put away: tools/belt.js)
    if ((game.mindWatch = (game.mindWatch || 0) + game.rawDt) > 1) { game.mindWatch = 0; game.macros.watch(game); } // (a Function newly learned: tools/veritome/mind/macros.js)
    // the music: what the place calls for (the title, a fight, a dive, the skiff, the dunes, the workshop: music/choose.js); a
    // sound-test pick plays over any of it
    if (!game.overture?.active) game.music.follow(chooseMusic(game, { overlay: overlayUp() })); // (the overture's trailer keeps the title's music)

    if (!godOn && !aboard) { game.lock.update(game.rawDt); techs.tick(dt); game.parries.update(dt); } // (the lock's camera runs in real seconds: a hit-stop does not stall it)
    game.rail?.update(dt); // (the crossing: before the camera, which rides its shot)
    game.opensea?.update(dt); // (the free helm: before the camera, which rides its shot)
    game.seaLooks?.update(dt); // (dresses the islets once, the first frame game.opensea.props exists)
    game.puzzleLooks?.update(dt); // (dresses the islets' puzzles once they exist, and plays a dig)
    game.bottleLooks?.update(dt); game.salvageLooks?.update(dt); game.shipPartWear?.update(); // (the drift bottles bobbing and read, the wrecks and the haul, the parts worn)
    game.seaFight?.update(dt); // (the ship's gun, the serpent's mind and body, the hull)
    game.seaHull?.update(game.rawDt);
    game.jarPlate?.update(game.rawDt ?? dt); // (the Pneuka Jar's plate while the god hand is taken: ui/jarplate.js)
    game.realm?.update(dt); // (the garden: the Jar, the hand and its own camera)
    game.guestJars?.update(game.rawDt);
    game.launchLotuses?.update(game.rawDt); game.facilityLooks?.update(game.rawDt); game.seedLooks?.update(game.rawDt); // (the garden's lotuses opening and flinging, the gate's veil, the seeds' looks and the pour: vfx/garden/)
    game.scanner?.update(game.rawDt); // (the scanner's camera looking for a code while its page is open: world/scanner.js)
    game.slabLook?.update(game.rawDt); game.rareSpirits?.update(game.rawDt); game.benchLook?.update(); // (carving a slab drawn over the bench, a rare spirit's inversion: vfx/garden/; the bench's window: ui/benchlook.js)
    env.water.update(dt);
    game.paintTrack.update(dt); game.paintmap.update(dt, camera.position.x, camera.position.z); game.stains?.update(dt); game.stains?.tick(game.rawDt); game.loadGauge?.update(game.rawDt);
    env.rigging.update(dt);
    env.lobbers.update(dt);
    if (!godOn && !game.realm?.active) {
      player.updateCamera(dt, acc / FIXED, weapon.adsEase, player.collider);
      game.rail?.reaim?.(); // (the crossing's reticle through this frame's camera, now placed: world/emocean/stage.js)
      character.setFirstPerson(player.fpWeight > 0.5);
      // fade the courier out when the 3rd-person camera is pressed up against them (never in a cinema shot: a framed close-up is meant)
      const near = camera.position.distanceTo(character.bones.spine003.getWorldPosition(new THREE.Vector3()));
      character.setFade(player.fpWeight > 0.5 || game.cinema?.shots?.size ? 1 : THREE.MathUtils.smoothstep(near, 0.45, 1.1));
      weapon.computeAimPoint(camera, player);
      const aimDir = weapon.aimPoint.clone().sub(camera.position).normalize();
      // heading change rate (the slide leans into turns)
      const heading = Math.atan2(player.vel.x, player.vel.z);
      const turnRate = dt > 0 && Math.hypot(player.vel.x, player.vel.z) > 1 ? Math.atan2(Math.sin(heading - (lastHeading ?? heading)), Math.cos(heading - (lastHeading ?? heading))) / dt : 0;
      lastHeading = heading;
      const held = weapon.held;
      diag.begin('anim');
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
        dash: player.dashBlend, crouch: player.crouchBlend, crawl: player.prone, prone: 1, posture: player.posture, // (prone is the belly crawl: courier/anim/crawl.js)
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
        gun: weapon, // (the psygun's moves and the suite's Gun_* over the aim: tools/psygun/gunmoves.js)
        adsT: weapon.adsEase,
        landed: player.landedOut,
        techs: player.techs,
      });
      player.headRel = character.headRel;
      weapon.fpPose(dt, camera, player, character);
      character.poseHands(handContext());
      game.lentModels.update(game.rawDt); // (the sub's verb's tool at the hand for its window, over where it hangs: tools/lend.js)
      game.party.update(dt, acc / FIXED);
      game.guests.update(dt);
      game.meetings.update(dt);
      diag.end('anim');
      weapon.tryFire(camera, player, character);
      if (weapon.charge > 0) fx.chargeTick(character.gunPoint('muzzle', new THREE.Vector3()), weapon.charge, dt);
    } else player.renderPos.copy(player.pos);
    god.applyCamera(dt);
    god.jar.clips?.update(dt); // (the Pneuka Jar's own clips, chosen by whichever mode draws it: godhand/pneukajarclips.js)
    weapon.updateDebris(dt);

    diag.begin('props'); if (!worldAsleep) breakables.update(dt); diag.end('props');
    if (!worldAsleep) clappers.update(dt, acc / FIXED);
    shells.update(dt);
    baubles.update(dt);
    baubles.tick(dt);
    lachryma.update(dt); game.courierMind?.update(dt); game.palmDie?.update(); game.handPose?.update(game.rawDt ?? dt);
    level.updateFeatures?.(dt, game);
    course.update(dt);
    game.circuits.update(dt);
    game.cubes.update(dt);
    if (!worldAsleep) { game.chests.update(dt); game.weir.update(dt); }
    game.well.update(dt); game.ostraca?.update(); game.debugChests?.update(game.rawDt ?? dt); game.knacks?.update(game.rawDt ?? dt); game.goals?.update(game.rawDt ?? dt); game.quests?.update(game.rawDt ?? dt); game.recap?.update(game.rawDt ?? dt); game.laidSpread?.update(game.rawDt ?? dt); game.readingScene?.update(game.rawDt ?? dt); game.harmony?.update(game.rawDt ?? dt); game.spiritLife?.update(game.rawDt ?? dt); game.feelings?.update(game.rawDt ?? dt); game.vantages?.update(game.rawDt ?? dt); game.vantageFrames?.update(game.rawDt ?? dt); game.awakening?.update(game.rawDt ?? dt); game.solar?.update(dt); game.mimicry?.update(dt); game.sandbox?.update(dt); game.strawmanWell?.update(dt); game.impacts?.update(dt); game.geysers?.update(dt); game.raceway?.update(dt); game.race?.update(dt); game.trackEditor?.update(game.rawDt ?? dt); game.haunt?.update(dt); game.shrines?.update(); game.pier?.update(); game.mooring?.update(game.rawDt ?? dt); game.encounterFilm?.update(game.rawDt ?? dt); game.margarite?.update(dt); game.bazaar?.update(dt); game.touchstone?.update(dt); game.duelFoes.update(); game.busk?.update(); game.catchLook?.update(game.rawDt ?? dt, camera);
    // underground: no sun through the ground (it would light the basement outside its shadow
    // frustum), thinner fog so the long rooms read end to end, no shadow-map updates
    game.daylight.update(dt); // (the open ground's light graded by the hour and the weather, before the dunes blend it in)
    game.dunes.update(dt);
    game.crystals?.update(dt);
    game.dunesAreas?.update(game.rawDt ?? dt); game.rareFinds?.update(game.rawDt ?? dt); // (the area you are in, and its rare find: world/dunes/areacut.js, rarefinds.js)
    const dm = game.dunes.mix; // (in the dunes the sun is a real one)
    const under = Math.max(ROOFED.has(game.zones?.current) ? 1 : 0, THREE.MathUtils.clamp((-camera.position.y - 1) / 3, 0, 1)) * (1 - dm); // (under the ground, or under a roof the sun's shadow never reaches: render/zonemap.js ROOFED)
    sun.intensity = THREE.MathUtils.lerp(T.visual.sun * (1 - under), game.dunes.sunIntensity ?? 0, dm);
    scene.fog.density = THREE.MathUtils.lerp(T.visual.fog * (1 - 0.6 * under), scene.fog.density, dm);
    player.killY = game.well.active ? game.well.killY : game.dunes.active || game.raceway?.active || game.margarite?.here || game.rail?.stage.active || game.opensea?.active ? DUNE.y - 90 : -100; // (a far dock is at the dunes' layer)
    // under the water: close teal murk
    const wv = env.water.at(camera.position.x, camera.position.y, camera.position.z);
    if (wv && camera.position.y < wv.surface) { scene.fog.color.setHex(0x24515a); scene.fog.density = 0.16; }
    else if (dm < 0.01) scene.fog.color.setHex(PALETTE.deep);
    game.graphics.shadowsWanted = under < 1; renderer.shadowMap.autoUpdate = under < 1 && (T.visual.shadowEvery | 0) <= 1; // (every frame, or on the graphics tier's own turns: render/graphics.js beforeDraw)
    game.bazaar?.light(); // (the bazaar's own air under its dome: world/bazaar/bazaar.js)
    game.sandbox?.light(); game.strawmanWell?.light(); game.touchstone?.light(); // (the Touchstone's dark: world/touchstone/touchstone.js)
    game.bazaarHall?.update(game.rawDt ?? dt); // (the dome's turn, the wheel's and the carousel's spin, the neon's film walk: vfx/bazaarhall.js)
    game.touchstoneLook?.update(game.rawDt ?? dt); // (the plinth you stand at lit, the stone's sign of the trial running, a run's streak rubbed in: vfx/touchstonelook.js)
    game.mimicryLooks?.update(game.rawDt ?? dt); game.sandboxLook?.update(game.rawDt ?? dt); game.panicMarks?.update(); // (the puzzle stones and the ghost, the Sandbox's ball, net and shadow, panic's marks let go: vfx/mimicry/, vfx/sandbox/, vfx/panic.js)
    game.realm?.light(); // (the garden's sky over the world's, while you are in it)
    diag.begin('fx'); fx.update(dt, camera); game.filigree?.update(dt); game.awakeningLook.update(game.rawDt ?? dt, camera); game.godhandLooks.update(game.rawDt ?? dt, camera); game.palmDieLook.update(game.rawDt ?? dt); game.weatherLook.update(dt, camera); game.nightSky.update(game.rawDt ?? dt, camera); game.waterFx.update(game.rawDt ?? dt, camera); game.parryMark.update(game.rawDt ?? dt, camera); game.blobShadow.update(); game.classArtLooks?.update(game.rawDt ?? dt); game.pairSpecialLooks?.update(game.rawDt ?? dt);game.domainLooks?.update(game.rawDt ?? dt); game.flourishes.update(game.rawDt ?? dt); game.figmentTelegraphs.update(dt, camera); game.siblingShatter.update(dt); game.shore.update(game.dunes.t ?? 0, camera); game.mawWipe.update(game.rawDt ?? dt); game.areaWipe.update(game.rawDt ?? dt); game.aberrantWipe.update(game.rawDt ?? dt, camera); game.gateRing.update(game.rawDt ?? dt); game.glitch.update(game.rawDt ?? dt, camera); game.squallLine?.update(game.rawDt ?? dt, camera); game.stormWarp.update(game.rawDt ?? dt, camera); game.umbral.update(game.rawDt ?? dt, camera); game.dataDrain.update(game.rawDt ?? dt); game.duelView.update(game.rawDt ?? dt); game.spawnLook.update(game.rawDt ?? dt, camera); game.dunemawMood.update(game.rawDt ?? dt); game.flythrough.update(game.rawDt ?? dt); game.daturas?.update(game.rawDt ?? dt); game.wellDress.update(game.rawDt ?? dt); game.throwingRoomDress.update(game.rawDt ?? dt); diag.end('fx');
    game.glyphs.update(dt); // (after everything that pops one this frame: a mark made before its first update was drawn at the origin)
    level.kilnLight.intensity = 26 + Math.sin(now * 0.004) * 3 + Math.sin(now * 0.011) * 2;

    diag.update(game.rawDt);
    game.startAt.update(game.rawDt); // (?at=godhand waits here for solid ground)

    hud.update(dt, {
      speed: Math.hypot(player.vel.x, player.vel.z),
      move: (techs.label() || (player.wallrun ? 'WALLRUN' : player.sliding ? 'SLIDE' : player.mantle ? 'MANTLE' : player.dashT > 0 ? 'DASH' : player.crouching ? 'CROUCH' : player.sprinting ? 'SPRINT' : player.walking ? 'WALK' : !player.grounded ? 'AIR' : ''))
      , debug: diag.mode > 0,
    });
    game.auras.update();
    game.temper.update();
    game.vfx.update(game.rawDt || dt);
    game.racewayLooks.update(game.rawDt || dt);
    game.dunesDress.update(game.rawDt || dt); game.racewayDress.update(game.rawDt || dt); // (vfx/dunes/, vfx/raceway/)
    game.skiffSlipArc.update(game.rawDt || dt);
    game.jellyMountLook?.update(game.rawDt || dt); // (the slip jelly mount's body, puddles and the mounts' ring, after the techs' tick: vfx/jellymount/look.js)
    game.worldLooks.update(dt);
    game.racewayCavern.update(game.rawDt || dt); game.racewayFog.update(game.rawDt || dt); game.racewayProps.update(game.rawDt || dt); game.racewayPark.update(); game.racewaySiphons.update(game.rawDt || dt); game.racewayMade.update(); game.trackEditorMarks.update(game.rawDt || dt); // (the vein lanes, the pots, the antlion chaser, the patches: vfx/racewayprops.js)
    game.cine.update(game.rawDt || dt);
    (game.chestFx ||= new ChestFx(game)).update(dt); // (the chest's opening: Mesh Create's effect meshes, vfx/chestfx.js)
    game.releaseCrack.update(game.rawDt ?? dt); // (after the vessel's cracks are set: it holds a release's back for its pressure beat)
    game.hudRing.update(dt); // (the 3D HUD, the Mind's layer in the world: docs/plans/OVERLAY.md)
    (game.wireCompass ||= new WireCompass(game)).visible = !!game.belt?.isWorn('dreamvane') || !!game.crucibelle?.held; // (the compass is the Dreamvane's: worn, it shows; and the Crucibelle's in the hands, for its pendulum)
    game.wireCompass.update(dt);
    (game.vaneHud ||= new VaneHud(game, game.wireCompass)).update(dt); // (the Dreamvane's own marks on the compass: vfx/vanehud.js)
    (game.crucibelleHud ||= new CrucibelleHud(game, game.wireCompass)).update(dt); // (the Crucibelle's pendulum on the compass, the beat for the eye: vfx/crucibellehud.js)
    game.hookMark.update(game.rawDt ?? dt); // (the hook's mark, while the hook form is in the hands)
    (game.veritomeFrame ||= new VeritomeFrame(game)).update(game.rawDt || dt); // (the lens's frame: what a plate would hold, in the third person while the Veritome is drawn: vfx/veritomeframe.js)
    (game.tollReach ||= new TollReach(game)).update(game.rawDt ?? dt); // (the Crucibelle's toll's reach at the feet, lit on the beat: vfx/tollreach.js)
    game.bracelets.update(game.rawDt ?? dt); // (the bracelet's glow: vfx/braceletwear.js)
    game.pneukaJarLook.update(game.rawDt ?? dt); // (the Jar in the vessel's looks, live; its pendant's swing)
    game.lockheartReach.update(game.rawDt ?? dt); game.carryThrowMark.update(game.rawDt ?? dt); game.lobArcMark.update(game.rawDt ?? dt); game.flareReveal.update(); // (each tool its own marks: the Lockheart's, and empty hands' throw)

    game.mood.end(game.rawDt); // (and the room's lights borrowed again, just before the draw)
    game.zones.update(game.rawDt); // (what is drawn: the zone the camera is in, and what can be seen from it)
    game.areas.update(game.rawDt); // (and what is held on the GPU: the area the camera is in, and its neighbours)
    game.lights.update(game.rawDt); // (and the lamps that light it: after everything has set its own)
    game.present.update(game.rawDt); // (new things shaded to match)
    game.courierSquash.press(dt, player); // (last: the drawn body's settle after a hard landing, laid on once everything has read the pose)
    input.endFrame();
  }
  requestAnimationFrame(frame);

  // handle for automated tests / console tinkering
  window.__hideUI = (level) => game.ui.set(level);
  window.__game = { THREE, RAPIER, T, scene, camera, renderer, post: game.post, draw: () => { game.graphics.beforeDraw(); game.firstDraws?.beginFrame(); if (game.readingScene?.active) game.readingScene.render(); else if (game.duelInstance?.active) game.duelInstance.render(scene, camera); else game.post.render(scene, camera); }, physics, player, weapon, character, breakables, level, input, fx, hud, resetRoom, stats, clock, tick, clappers, lachryma, baubles, shells, trial, course, techs, game, events, movers, system, codex, pneuka: game.pneuka, ledger: game.ledger, log: game.log, manual: false, hideUI: (level) => game.ui.set(level), zones: game.zones, lights: game.lights };
  mark('ready');
  if (window.__game.manual && game.title?.active) { game.title.active = false; game.mode ||= save.mode || 'debug'; if (game.mode === 'debug') game.pneuka.debugKit(); game.title.ui.close(); game.ui.want('title', false); game.startAt.apply(); } // (a test drive goes straight to the world; ?at= is its start)
  window.__ready = true;
}
