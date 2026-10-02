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
import handB64 from './assets/godhand.glb?b64';
import jarB64 from './assets/pneuka.glb?b64';
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
import { Surfer } from './moves/surfer.js';
import { Sondelass } from './moves/sondelass.js';
import { SoulBrush } from './moves/soulbrush.js';
import { Veritome } from './moves/veritome.js';
import { Grapple } from './moves/grapple.js';
import { Launch } from './moves/launch.js';
import { Circuits } from './circuits.js';
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
import { GodMode } from './godmode.js';
import { Cartography } from './cartography.js';
import { Dunes, DUNE } from './dunes.js';
import { Water, Ladders, SlipField } from './moves/env.js';
import { Events } from './events.js';
import { Movers } from './movers.js';
import { System } from './system/system.js';
import { Codex } from './system/codex.js';
import { PneukaBox } from './pneuka/box.js';
import { Vessel } from './vessel/vessel.js';
import { KilnUI } from './vessel/kilnui.js';
import { Kiln, KILN_AT } from './moves/kiln.js';
import { Shops } from './shop/shops.js';
import { ShopUI } from './shop/ui.js';
import { PneukaUI } from './pneuka/ui.js';
import { GroundItems } from './pneuka/ground.js';
import { SystemVoice } from './system/voice.js';
import { MusicPlayer } from './music/player.js';
import { DUNES } from './music/dunes.js';
import { LACHRYMA } from './music/lachryma.js';
import { BATTLE } from './music/battle.js';
import { WORKSHOP } from './music/workshop.js';
import { GameLog } from './gamelog.js';
import { Stats } from './stats.js';
import { Tracking } from './tracking.js';
import { Achievements } from './achievements.js';
import { Weir, stockTreasury } from './angling/weir.js';
import { TimeScale } from './timescale.js';
import { Sky } from './sky.js';
import { Interact } from './interact.js';
import { LockOn } from './lockon.js';
import { HideUI } from './hideui.js';
import { Glyphs } from './vfx/glyphs.js';
import { Cinema } from './vfx/cinema.js';
import { Portrait } from './vfx/portrait.js';
import { PsychicPulse } from './vfx/pulse.js';
import { Cubes } from './cubes.js';
import { Mood } from './mood.js';
import { Chests, ChestTech } from './chests.js';
import { Emote } from './moves/emote.js';
import { Chat } from './chat.js';
import { Talk } from './moves/talk.js';
import { Folk } from './npc/folk.js';
import { Creatures } from './creatures.js';
import { AI } from './ai/index.js';
import { Stun } from './stun.js';
import { resetOnNewBuild } from './progress.js';
import { Dissolve } from './vfx/dissolve.js';
import { Flash } from './veritome/flash.js';
import { Reprogram } from './veritome/reprogram.js';
import { SlipJellies } from './jelly/slipjelly.js';
import { WEIR_SPAWN } from './angling/weir.js';
import jellyB64 from './assets/slipjelly.glb?b64';
import { Dialogue } from './npc/dialogue.js';
import { placePeople } from './npc/people.js';
import { Rave } from './vfx/rave.js';
import { Zones } from './render/zones.js';
import { LightBudget } from './render/lightbudget.js';
import { Presentation } from './render/present.js';
import { installTheme, fontsReady, theme } from './ui/theme.js';
import { px, PX_CSS } from './ui/pixel.js';
import { installToon, setToon } from './render/toon.js';
import { Glow } from './render/glow.js';
import { ToolBelt, psygunTool, sondelassTool, soulBrushTool, veritomeTool, heldTool } from './tools/belt.js';
import { Dreamvane } from './moves/dreamvane.js';
import { Crucibelle } from './moves/crucibelle.js';
import { Lockheart } from './moves/lockheart.js';
import { Mirages } from './crucibelle/mirage.js';
import { Signatures, standardSignatures } from './signatures.js';
import { Spirits } from './spirits.js';
import { Crystals } from './lachryma/crystals.js';
import { installEconomy } from './econ/economy.js';
import { TitleScene } from './title/scene.js';
import { TitleUI } from './title/ui.js';
import { Diag } from './debug/diag.js';
import { MacroBook } from './mind/macros.js';
import { trimShadows } from './render/shadowtrim.js';

const FIXED = 1 / 60;

/** Draw everything once, everywhere, into a postage stamp, before the first frame. Compiling a shader is not the whole of a first draw:
 *  three.js uploads a geometry's buffers and a texture the first time something using them is drawn, and the browser's GL layer
 *  (ANGLE over D3D or Metal) builds its pipeline for each new mix of program, vertex layout and target then too. Left to the game,
 *  that happens the first time a thing comes into view: a hitch every time the camera swings round onto something new (the dunes, the
 *  Weir). Drawn here with culling off, into a 16-pixel target of the same format as the frame, it costs one long frame behind the
 *  loading screen instead. */
function primeDraw(renderer, scene, camera, like) {
  const t0 = performance.now(), culled = [], shown = [];
  scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.frustumCulled) { o.frustumCulled = false; culled.push(o); } });
  // (and what waits hidden for its moment: the God Hand, its jar and veil, a tool in its holster. Not a zone's objects (their `visible`
  // is a combination: render/zones.js) nor a light (the budget's proxies say false whatever they are told))
  scene.traverse((o) => { if (!o.visible && !o.isLight && !o.isScene && !o.userData.zoneInstalled) shown.push(o); });
  for (const o of shown) o.visible = true;
  const rt = like.clone(); rt.setSize(16, 16);
  renderer.shadowMap.needsUpdate = true; // (the casters too, through the sun's shadow pass)
  try { renderer.setRenderTarget(rt); renderer.render(scene, camera); } catch (e) { console.warn('prime draw', e); }
  for (const o of culled) o.frustumCulled = true;
  for (const o of shown) o.visible = false;
  rt.dispose();
  window.__primeMs = Math.round(performance.now() - t0);
}

// boot timings: window.__boot (ms at each stage since the page began), for profiling the load
const BOOT = (window.__boot = []);
const mark = (n) => BOOT.push([n, Math.round(performance.now())]);

async function main() {
  mark('main');
  const freshBuild = resetOnNewBuild(); // (a new build starts its progress afresh: progress.js)
  loadTuning();
  installTheme(); // (the windows' look, the faces, the glove: ui/theme.js)
  installToon(T.visual.toon ?? 1); // (the soft cel ramp on every lit material, before anything compiles: render/toon.js)
  await fontsReady();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = T.visual.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap; // (filtered, not softened: a console's one shadow; see render/present.js)
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = T.visual.exposure;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.deep);
  scene.fog = new THREE.FogExp2(PALETTE.deep, T.visual.fog);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.03, 200);

  const hemi = new THREE.HemisphereLight(0xffe4cc, 0x6f3726, 2.3);
  const amb = new THREE.AmbientLight(0xffd0b0, 0.35);
  scene.add(hemi, amb);
  const sun = new THREE.DirectionalLight(0xffe8d2, T.visual.sun);
  // steep sun through the skylights: lights the upper floor and drops a shaft
  // down the atrium onto the ground floor
  sun.position.set(4, 30, -5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(T.visual.shadowRes || 1024, T.visual.shadowRes || 1024);
  const sc = sun.shadow.camera;
  sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 5; sc.far = 50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const physics = new Physics();
  await physics.init();
  mark('physics');
  const fx = new FX(scene);
  fx.pixelRatio = renderer.getPixelRatio();
  const hud = new Hud();
  // the maker's pixel art (ui/pixel.js): drawn at 1x, recoloured, scaled by a whole number: the gloves, the Lachrimeter, the windows' buttons
  { const st = document.createElement('style'); st.textContent = PX_CSS; document.head.appendChild(st); }
  await px.load();
  theme.pixelGloves(px);
  hud.pixelate(px);

  const stats = { broken: 0, total: 0 };
  const events = new Events();
  const game = {
    scene, physics, fx, hud, camera, renderer, stats, events,
    ledger: new Stats(), // (the quiet ledger: everything counted; see stats.js)
    listenerDistance: (p) => camera.position.distanceTo(p),
    onBroken(ent, cause, by = 'courier') {
      if (ent.def?.proxy) return; // (the clay of a clapperjar cut into chunks: it has already been counted as the clapper)
      events.emit('break', { kind: ent.kind, target: !!ent.def.target, cause, by });
      if (ent.def.trial) { game.trial?.onTarget(ent); return; }
      if (ent.def.target) return;
      stats.broken++;
      if (stats.broken === stats.total) events.emit('room.cleared', { total: stats.total });
    },
    onClapper(c, cause = 'shot') {
      stats.clappers = (stats.clappers || 0) + 1;
      events.emit('clapper.down', { cause, ally: !!c.ally, raider: !!c.raider });
    },
    onRepaired() {
      stats.total++;
    },
    onExplosion(center, R) {
      game.god?.explosion(center, R);
      game.ai?.stimuli.emit('noise', center, { radius: 18 + R * 6, strength: 1.5, by: 'courier' }); // (a blast is heard far off: ai/stimuli.js)
      game.ai?.stimuli.emit('light', center, { radius: 10 + R * 3, strength: 1, by: 'courier' });
      if (game.god?.active) return; // (the Courier is a jar just now)
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

  game.zones = new Zones(game); // (only the place you are in, and what can be seen from it, is drawn: render/zones.js)
  game.time = new TimeScale(game); // (who slows the world, and by how much: see timescale.js)
  game.log = new GameLog(game); // (the one place for text feedback; see gamelog.js)
  game.post = new Glow(renderer);
  game.ui = new HideUI(game); // (F2: the interface off the screen, for a clean shot)
  game.glyphs = new Glyphs(game); // (the !!! over a bite: marks in the world, on the thing they are about)
  game.ai = new AI(game); // (what creatures notice and what the world offers them: ai/, docs/AI.md)
  game.signatures = new Signatures(game); standardSignatures(game); // (where Lachryma is, for whatever senses it: signatures.js)
  game.px = px; // (the maker's pixel art, for any window that wants it: ui/pixel.js)
  game.cinema = new Cinema(game); // (bars, a composition for the camera, a vignette)
  game.portrait = new Portrait(game); // (the cut-in window of a fish on the line)
  game.pulse = new PsychicPulse(game); // (a sounding: a sphere of light from a point)
  const breakables = new Breakables(scene, physics, fx, game);
  mark('services');
  game.sky = await new Sky(game).load(); // (the painted sky: the dunes' dome, the water's reflection, the gloss on the cubes)
  game.cubes = new Cubes(game); // (condensed Lachryma: the currency; loose ones are real bodies)
  game.mood = new Mood(game); // (the room's lights, borrowed by a ceremony: see mood.js)
  game.chests = new Chests(game); // (treasure chests, the Tithe and how they open: see chests.js)
  game.chests.rave = new Rave(game); // (what a prismatic chest does to the room: vfx/rave.js)
  game.chests.rave.warm(renderer, camera);
  mark('sky');
  game.dunes = new Dunes(game, { sun, hemi, amb }); // the sand sea far below
  mark('dunes');
  const level = new Level(scene, physics, breakables);
  game.level = level;
  // what the environmental movement techs read: water, ladders, slip (built with the level)
  const movers = new Movers(game);
  const env = { water: new Water(scene, game.sky), ladders: new Ladders(scene), slip: new SlipField(scene, game), movers, rigging: new Rigging(scene, physics), lobbers: new Lobbers(scene, physics) };
  level.env = env;
  game.water = env.water; game.ladders = env.ladders; game.slip = env.slip; game.movers = movers; game.rigging = env.rigging; game.lobbers = env.lobbers;
  level.build();
  mark('level');
  const spawnRoom = () => {
    level.spawnDynamic();
    stats.broken = 0;
    stats.total = [...breakables.items].filter((e) => !e.def.target).length;
  };
  spawnRoom();
  game.breakables = breakables;

  mark('spawn');
  const loader = new GLTFLoader();
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
  const [charG, gunG, clapG, handG, jarG] = await Promise.all([
    loader.parseAsync(bytes(courierB64), ''),
    loader.parseAsync(bytes(gunB64), ''),
    loader.parseAsync(bytes(clapperB64), ''),
    loader.parseAsync(bytes(handB64), ''),
    loader.parseAsync(bytes(jarB64), ''),
  ]);
  mark('gltf');
  const clappers = new Clappers(game, clapG);
  game.clappers = clappers;
  clappers.spawnAll();
  const clipPack = decodeAnims(animsB64);
  Object.assign(clipPack.clips, decodeAnims(cmuB64).clips); // (mocap: the soccer kick)
  mark('clappers+anims');
  const character = new Character(scene, charG, gunG, clipPack);
  mark('character');
  character.onFootstep = () => sfx.footstep();
  game.character = character;
  // the vessel she is: its glazes and its kintsugi, on her (vessel/: fired at the kiln in the workshop, moves/kiln.js)
  game.vessel = new Vessel(game);
  game.vessel.dress(character);

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
  for (const T0 of [Swim, Ladder, Pole, Grate, Hang, Latch, ChestTech, Talk, Kiln, Emote, Push, SlipDive, Roll, Slam, Blink, Stomp, Balance, Carry, Kick, Recoil, Surfer, Grapple, Launch, Sondelass, SoulBrush, Veritome, Dreamvane, Crucibelle, Lockheart]) techs.add(new T0(techs));
  env.lobbers.game = game;
  // the psychic tools: one in the hands at a time, and one set of rules for what that means (tools/belt.js)
  game.belt = new ToolBelt(game);
  game.belt.add(psygunTool(weapon));
  game.belt.add(sondelassTool(techs.get('sondelass')));
  game.belt.add(soulBrushTool(techs.get('soulbrush')));
  game.belt.add(veritomeTool(techs.get('veritome')));
  game.belt.add(heldTool(techs.get('dreamvane'), 'THE DREAMVANE', 'back'));
  game.belt.add(heldTool(techs.get('crucibelle'), 'THE CRUCIBELLE', 'hip'));
  game.belt.add(heldTool(techs.get('lockheart'), 'THE LOCKHEART', 'neck', true));
  player.techs = techs;
  game.techs = techs;
  // the Pneuka Box: what she carries (P), what lies on the ground, and the window; the Veritome is its bank (pneuka/)
  game.ground = new GroundItems(game);
  game.pneuka = new PneukaBox(game);
  if (game.veritome) game.pneuka.migrate(game.veritome.book);
  game.belt.tick(); game.pneuka.seed(); // (a new Courier: the four tools worn, the rest and the made lures in the box)
  game.pneukaUI = new PneukaUI(game);
  game.pneukaUI.onClose = () => { if (input.enabled && !game.god?.active) input.requestLock(); };
  // the folk's counters (shop/: Raku's treasury and Old Grog's pier, opened from their talk)
  game.shops = new Shops(game);
  game.shopUI = new ShopUI(game);
  game.shopUI.onClose = () => { if (input.enabled && !game.god?.active && !game.dialogue?.open) input.requestLock(); };
  game.kilnUI = new KilnUI(game);
  game.kilnUI.onClose = () => { if (input.enabled && !game.god?.active) input.requestLock(); };
  // the System's voice: the few things that matter, said aloud (system/voice.js)
  game.voice = new SystemVoice(game);
  // the music: a theme where there is one (music/: the Dunes for now), under everything, paused for the rave
  game.music = new MusicPlayer(sfx);
  const codex = new Codex(game);
  game.codex = codex;
  codex.onClose = () => { if (input.enabled && !game.god?.active) input.requestLock(); };
  const modalOpen = () => !!(game.codex?.open || game.indexMenu?.open || game.cartography?.open || game.pneukaUI?.open || game.shopUI?.open || game.log?.busy);
  const lachryma = new LachrymaPool({ max: T.lachryma.max, regenRate: T.lachryma.regenRate, regenDelay: T.lachryma.regenDelay });
  game.lachryma = lachryma;
  const baubles = new Baubles(game);
  game.baubles = baubles;
  const shells = new Shells(game);
  game.shells = shells;
  hud.buildShells(SHELL_TYPES);
  game.input = input;
  game.cartography = new Cartography(game); // (before the hand: it reads the Zone of Influence)
  mark('techs+ui');
  const god = new GodMode(game, renderer, handG, jarG);
  mark('god');
  game.god = god;
  game.lock = new LockOn(game); // (Z-targeting: the camera and the blade hold one thing)
  // what the chevron points at: anything F would act on from here
  game.interact = new Interact(game);
  {
    const carry = techs.get('carry'), push = techs.get('push');
    const spot = (e) => { const t = e.body.translation(); return new THREE.Vector3(t.x, t.y + (carry.size(e) * 0.5 + 0.5), t.z).setX(t.x); };
    const idle = () => !techs.active && player.grounded && !player.mantle && !player.sliding && !game.god?.controlling;
    game.interact.add('carry', () => {
      if (!carry?.usable() || carry.item || carry.state !== 'idle' || !idle()) return null;
      const e = carry.find(); if (!e) return null;
      const p = spot(e); return { pos: p, d: p.distanceTo(player.pos), ref: e };
    });
    // where the grapnel would bite, while the hook is out and nothing is on the line
    game.interact.add('grapple', () => {
      const tool = techs.get('sondelass');
      if (!tool?.held || tool.form !== 'hook' || tool.hookshot.busy) return null;
      const r = tool.hookshot.probe();
      return r ? { pos: r.point.clone().addScaledVector(r.normal, 0.45), d: 99 } : null;
    });
    game.interact.add('item', () => (game.god?.controlling ? null : game.ground.nearest(player))); // (what lies on the ground: F picks it up)
    game.interact.add('chest', () => { const t = game.chests.find(); return t ? { pos: t.pos, d: t.d, ref: t.chest || t.kind } : null; });
    // the clay folk: F to talk (npc/folk.js, npc/dialogue.js)
    game.interact.add('npc', () => {
      if (!game.folk || game.dialogue?.open || !idle()) return null;
      const n = game.folk.near(player); if (!n) return null;
      const p = game.folk.head(n).add(new THREE.Vector3(0, 0.55 * n.scale, 0));
      return { pos: p, d: Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z) - 0.3, ref: n.id };
    });
    // the kiln station: F at the kiln's mouth (moves/kiln.js)
    game.interact.add('kiln', () => {
      if (game.dialogue?.open || game.kilnUI?.open || !idle()) return null;
      const d = Math.hypot(KILN_AT.x - player.pos.x, KILN_AT.z - player.pos.z);
      return d < 2.4 && Math.abs(player.pos.y - KILN_AT.y) < 1.5 ? { pos: KILN_AT.clone().setY(KILN_AT.y + 1.7), d } : null;
    });
    game.interact.add('push', () => {
      if (!push?.usable() || push.cool > 0 || carry?.item || !idle()) return null;
      const e = push.canGrab(); if (!e) return null;
      const p = spot(e); return { pos: p, d: p.distanceTo(player.pos), ref: e };
    });
  }

  // diagnostics (F3: the perf panel; again: with the physics lines near her and the creatures' minds; F4 copies a report): debug/diag.js
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

  const gui = buildTuningPanel((group, key) => {
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
    if (key === 'volume' || group === '*') sfx.setVolume(T.audio.volume);
    if (group === 'lachryma' || group === '*') { lachryma.baseMax = T.lachryma.max; lachryma.regenRate = T.lachryma.regenRate; lachryma.regenDelay = T.lachryma.regenDelay; }
  }, {
    copyJSON: () => navigator.clipboard?.writeText(JSON.stringify(T, null, 2)).then(() => game.log.say('system', 'Settings copied to the clipboard.')),
    resetRoom,
  });
  setOutlineThickness(T.visual.outline);
  game.resetRoom = resetRoom;
  const trial = new Trial(game);
  game.trial = trial;
  mark('misc');
  const course = new Course(game);
  mark('course');
  game.course = course;
  game.circuits = new Circuits(game); // (timed laps through the gymnasium's pieces)
  course.menu.onClose = () => { if (input.enabled && !game.god?.active) input.requestLock(); };
  // Mind Mapping: the map and compass, and the named places in them
  const carto = game.cartography;
  carto.onClose = () => { if (input.enabled && !game.god?.active) input.requestLock(); };
  {
    const v = (a) => new THREE.Vector3(...a);
    carto.addAnchor('WORKSHOP', 'workshop', v([0, 0, 0]), 'ground');
    carto.addAnchor('GALLERY', 'gallery', v([0, clappers.floors[1]?.y ?? 4.6, 0]), 'upper');
    carto.addAnchor('THE HUB', 'hub', course.hubSpawn.v);
    for (const r of course.rooms) {
      const at = r.spawn === 'lab' ? course.labSpawn.v : r.spawn === 'mill' ? course.millSpawn.v : r.spawn === 'dunes' ? game.dunes.spawnPoint() : r.spawn === 'siege' ? course.siegeSpawn.v : r.spawn === 'weir' ? course.weirSpawn.v : course.cps[r.cp]?.v;
      if (at) carto.addAnchor(r.name, r.id, at);
    }
    carto.addAnchor('THE SPIRE', 'spire', game.dunes.spire.clone().setY(game.dunes.heightAt(game.dunes.spire.x, game.dunes.spire.z) + 1));
    carto.restoreAnchors();
  }
  // what is counted and what is said about it, then the achievements over the counts
  mark('circuits+carto');
  game.weir = new Weir(game); // (the Sondelass's own room: the tide and the shoals)
  stockTreasury(game); // (a chest of each tier on the Weir's plinths, and the Tithe's console)
  {
    // a common chest in the hub, off to one side of where you arrive, on whatever floor is there; a rare one on a dune, half in the sand
    // (the hub's floor is flat; a ray here would see nothing yet, the physics world has not stepped)
    const hub = course.hubSpawn.v;
    game.chests.spawn(0, new THREE.Vector3(hub.x + 5, hub.y, hub.z + 3), { yaw: Math.atan2(-5, -3), id: 'hub.1' });
    const dn = game.dunes.spawnPoint();
    const cx = dn.x + 66, cz = dn.z - 40; // (out past the oasis, on the first of the dunes)
    game.chests.spawn(2, new THREE.Vector3(cx, game.dunes.heightAt(cx, cz) - 0.12, cz), { yaw: Math.atan2(dn.x - cx, dn.z - cz), id: 'dunes.1' });
  }
  game.tracking = new Tracking(game);
  game.achievements = new Achievements(game);
  mark('weir+treasure+ach');
  game.lights = new LightBudget(game, { slots: T.visual.lightSlots ?? 8 }); // (every lamp in the world, lit eight at a time: render/lightbudget.js)
  game.present = new Presentation(game, { renderer, sun }); // (480 lines, scaled up; smooth shading; one shadow: render/present.js)
  game.present.apply();
  // the clay folk and their talk (npc/): placed now that the rooms they stand in are built
  // the creatures that fight back (creatures.js): for now the slip jellies on the flats past the Weir (jelly/slipjelly.js)
  game.creatures = new Creatures(game);
  game.stun = new Stun(game); // (a mind knocked out of itself, for anything that can be: stun.js)
  game.dissolve = new Dissolve(game); // (a zandatsu's pieces, come undone into Lachryma: vfx/dissolve.js)
  game.jellies = new SlipJellies(game, await loader.parseAsync(bytes(jellyB64), ''));
  for (const [dx, dz] of [[-9, -26], [4, -31], [13, -22]]) game.jellies.spawn(new THREE.Vector3(WEIR_SPAWN.pos[0] + dx, WEIR_SPAWN.pos[1], WEIR_SPAWN.pos[2] + dz));
  game.mirage = new Mirages(game); // (Couriers of smoke that minds take for her: the Crucibelle's mirage)
  game.spirits = new Spirits(game); // (smoke spirits on her side: the Crucibelle's and the Lockheart's: spirits.js)
  game.crystals = new Crystals(game); // (Lachryma set hard in the sand: the Dreamvane's: lachryma/crystals.js)
  game.folk = new Folk(game, clapG);
  placePeople(game, game.folk);
  game.dialogue = new Dialogue(game);
  for (const id of ['codex', 'pneuka', 'indexmenu', 'mapui', 'dialogue']) theme.watch(document.getElementById(id));
  theme.watch(document.getElementById('overlay'), { sound: false, point: '.go .opt' }); // (the title: the glove waits at BEGIN)
  theme.aim(document.querySelector('#overlay .go .opt'));
  game.theme = theme;
  // the chat line in the log: words said aloud, /commands, emotes (chat.js, emotes.js)
  game.chat = new Chat(game);
  installEconomy(game); // (/grant, for the DEBUG profile)
  game.macros = new MacroBook(); // (what she has composed for minds: mind/macros.js, the Codex's VERITOME, THE MIND)
  game.flash = new Flash(game); // (the Veritome's flash: 1 with the book out; it dazzles and stuns: veritome/flash.js)
  game.reprogram = new Reprogram(game); // (a stunned mind, opened with the middle button and rewritten: veritome/reprogram.js)
  game.log.onSend = (t) => game.chat.run(t);
  game.log.canOpen = () => !modalOpen() && !god.controlling && !game.dialogue?.open;
  game.log.say('system', 'Welcome to the workshop. Press B for the Codex: arts, ledger and records.');
  if (freshBuild) game.log.say('system', 'A new build of the game: your arts, ledger, records and Codex start afresh. (Settings are kept.)');

  // --- overlay / pointer lock -----------------------------------------------
  const overlay = document.getElementById('overlay');
  const overlayUp = () => overlay.style.display !== 'none' && !window.__game?.manual;
  let guiOpen = false, started = false;
  const start = () => {
    sfx.unlock();
    overlay.style.display = 'none';
    input.enabled = true; started = true;
    if (!god.active) input.requestLock(); // (the hand has a free cursor)
  };
  overlay.addEventListener('click', start);
  // --- the title: THE FOOL'S PRECIPICE (title/): drawn instead of the game until a choice is made (docs/PLAN.md) ---
  const [tCharG, tGunG] = await Promise.all([loader.parseAsync(bytes(courierB64), ''), loader.parseAsync(bytes(gunB64), '')]);
  const titleScene = new TitleScene(game, { charG: tCharG, gunG: tGunG, clipPack, clapG });
  game.vessel.dress(titleScene.ch); // (she wears on the hill what she wears in the world)
  const title = (game.title = { active: true, scene: titleScene, ui: null, mode: null });
  overlay.style.display = 'none';
  game.ui.want('title', true); // (the HUD steps out while the title is up: hideui.js)
  const endTitle = (quiet = false) => {
    if (!title.active) return;
    title.active = false; title.ui?.close(); game.ui.want('title', false); game.vessel.dressed.delete(titleScene.ch);
    if (!quiet) {
      // (from the dark of the dive into the world)
      const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#0b0614;z-index:12;pointer-events:none;transition:opacity .8s';
      document.body.appendChild(f); requestAnimationFrame(() => { f.style.opacity = '0'; }); setTimeout(() => f.remove(), 900);
      input.enabled = true; started = true;
      if (!god.active && !input.locked) input.requestLock();
      game.events.emit('title.enter', { mode: title.mode });
    }
  };
  title.ui = new TitleUI(game, {
    onStart: () => titleScene.go(),
    onChoose: (mode) => {
      title.mode = mode;
      system.setLab(mode === 'debug'); // (DEBUG is the sandbox: every art in the lab; STORY learns them by doing)
      game.mode = mode;
      input.requestLock(); // (within the click or the key: a browser only grants the lock to a gesture)
      titleScene.dive(() => endTitle());
    },
  });
  titleScene.onMenu = () => title.ui.showMenu();
  input.onLockChange = (locked) => {
    if (title.active) return; // (the title owns the screen: no pause card over it)
    if (input.lockFailed) {
      document.getElementById('lockwarn').style.display = 'block';
      return;
    }
    if (!locked && !guiOpen && !modalOpen() && !god.active && !game.reprogram?.open) { overlay.style.display = 'flex'; input.enabled = false; }
  };
  // Esc pauses: in play the pointer lock's own Esc does it (above); the God Hand has a free cursor, so there the key itself does (the art
  // wheel, if it is open, closes first)
  addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || e.repeat || !god.active || !input.enabled || guiOpen || modalOpen() || game.dialogue?.open) return;
    e.preventDefault();
    if (god.arts.wheelOpen) { god.arts.closeWheel(false); return; }
    overlay.style.display = 'flex'; input.enabled = false;
  });
  renderer.domElement.addEventListener('click', () => {
    if (input.enabled && !input.locked && !guiOpen && !modalOpen() && !god.active && !game.reprogram?.open) input.requestLock();
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }); // (the render size itself is the Presentation's: render/present.js)

  // warm the shaders while the loading screen is still up: every room's materials at once (zones off for it), so the first frame and
  // the first teleport do not stall on the driver compiling them (KHR_parallel_shader_compile lets the browser do it off the main thread)
  for (let i = 0; i < 22; i++) breakables.update(0); // (the pots at rest go into their batches first: those are shaders too)
  game.zones.enabled = false; game.zones.update(1);
  window.__shadowTrim = trimShadows(scene, 0.06); // (casters smaller than a texel of the sun's shadow: render/shadowtrim.js)
  game.post.resize(); renderer.setRenderTarget(game.post.target); // (compiled for the buffer the frame is drawn into)
  // (an empty frame first: compile() reads the clipping state the last render left, and the God Hand's cutaway plane is always installed,
  // so without it every program was compiled for no planes here and again, for one, on the first real frame)
  renderer.render(new THREE.Scene(), camera);
  try { await renderer.compileAsync(scene, camera); } catch (e) { console.warn('shader warm-up', e); }
  if (!window.__noPrime) primeDraw(renderer, scene, camera, game.post.target); // (a test harness may skip it: it is a long frame on a software GL)
  renderer.setRenderTarget(null);
  game.zones.enabled = true; game.zones.t = 0;
  mark('shaders');
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
      diag.frameStart();
      if (game.title?.active) { // (the title instead of the game: the world waits, built, behind it)
        game.title.scene.update(dt); game.music.follow(LACHRYMA);
        if (game.title.scene.state === 'dive') game.title.ui.fade((game.title.scene.st - 0.5) / 0.6);
        game.title.scene.render(); input.endFrame(); diag.frameEnd();
        return;
      }
      diag.begin('sim'); tick(dt); diag.end('sim');
      diag.begin('draw'); game.post.render(scene, window.__debugCam || camera); diag.end('draw'); // (the PS2 glow and the grade over the frame: render/glow.js)
      game.veritome?.afterRender(renderer.domElement); // (a photograph is the frame just drawn)
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

  // the Blink's charges for the HUD's beads (ui/beads.js): how many, of how many, and how far the next has come back
  const blinkState = () => {
    const b = techs.get('blink');
    if (!b?.enabled) return null;
    return { n: b.charges, max: b.cfg.charges, fill: b.charges < b.cfg.charges ? THREE.MathUtils.clamp(b.recharge / b.cfg.recharge, 0, 1) : 0 };
  };

  // One simulation + animation frame. Split out so tests can drive exact frame rates.
  function tick(dt) {
    clock.frame++;
    game.rawDt = dt;
    dt *= game.time.update(dt); // (everything below runs in game time; the player's own blade is read in real seconds)
    simTime += dt;
    const now = simTime * 1000;

    if (input.wasPressed('Tab')) {
      guiOpen = !guiOpen;
      if (guiOpen) { gui.show(); gui.open(); document.exitPointerLock?.(); }
      else { gui.hide(); if (input.enabled && !game.god?.active) input.requestLock(); }
    }
    if (input.wasPressed('KeyB') && input.enabled && !game.pneukaUI.open) game.codex.toggle();
    if (input.wasPressed('KeyP') && input.enabled && !game.codex.open && !game.indexMenu?.open && !game.cartography?.open && !god.controlling) game.pneukaUI.toggle();
    if (input.wasPressed('KeyN') && input.enabled && !guiOpen && !modalOpen()) game.cartography.survey(god.controlling);
    if (input.wasPressed('Backquote') && input.enabled && !guiOpen && !modalOpen()) god.toggle();
    if (modalOpen()) { game.cartography.tickModal(); input.dx = 0; input.dy = 0; input.endFrame(); return; } // (the Codex and the index pause the game)
    if (started && overlayUp()) { game.music.follow(LACHRYMA); input.dx = 0; input.dy = 0; input.endFrame(); return; } // (and so does the pause card)
    game.mood.begin(); // (what the last frame's dimming changed, put back before anything sets its own values)
    if (input.wasPressed('KeyT')) resetRoom();
    if (input.wasPressed('F3')) diag.cycle();
    if (input.wasPressed('F2')) game.ui.cycle();
    if (guiOpen) { input.dx = 0; input.dy = 0; }

    trial.update(dt);
    const godOn = god.controlling; // (the hand: the Courier is a jar, and none of her machinery runs)
    if (godOn) god.update(dt);
    else {
      player.look(dt, weapon.adsEase || 0);
      player.chargeLevel = weapon.charge;
      game.reprogram.claim(input); // (the middle button near a stunned mind is the Veritome's, not a shell: veritome/reprogram.js)
      weapon.update(dt, input, player);
      player.updateBody(dt, weapon.adsT > 0 || weapon.wantsFire || weapon.cooldown > 0 || weapon.charge > 0 || weapon.holding || techs.stance);
    }

    acc += dt;
    let steps = 0;
    events.time = simTime;
    while (acc >= FIXED && steps < 4) {
      movers.pre(FIXED);
      god.arts.fixed(FIXED);
      if (godOn) god.fixed(FIXED);
      else {
        player.fixedUpdate(FIXED, { adsT: weapon.adsEase, wantsFire: weapon.wantsFire });
        player.guard();
      }
      clappers.fixedUpdate(FIXED);
      shells.fixedUpdate(FIXED);
      breakables.preStep();
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
    game.tracking.update(dt);
    game.achievements.tick(dt);
    game.log.tick(dt);
    game.cartography.update(dt);
    game.cinema.update(game.rawDt); // (the frame and the vignette ease in real seconds, so a slowed world keeps its bars)
    game.glyphs.update(dt);
    game.folk?.update(dt); game.dialogue?.update(game.rawDt); game.shops?.update(dt); game.vessel?.update(game.rawDt);
    diag.begin('minds'); game.ai.update(dt); game.creatures.update(dt); game.jellies.update(dt); game.stun.update(dt); game.dissolve.update(dt); game.flash.update(game.rawDt); game.reprogram.update(game.rawDt); diag.end('minds');
    game.pulse.update(dt);
    game.portrait.update(game.rawDt, game.angler?.fightView?.());
    game.interact.update(game.rawDt);
    game.ground.update(dt); // (things on the floor turn; F picks up the one the chevron is on)
    game.belt.tick(); // (what is not worn stays put away: tools/belt.js)
    if ((game.mindWatch = (game.mindWatch || 0) + game.rawDt) > 1) { game.mindWatch = 0; game.macros.watch(game); } // (a Function newly learned: mind/macros.js)
    // the music: the main theme on the title (and the pause), the Dunes' theme in the dunes, a sound-test pick over either
    // the music: the main theme on the title (and the pause); the battle while something is after her; the Dunes' theme in the
    // dunes, the work song in the workshop; a sound-test pick over any of them
    const fighting = !overlayUp() && !!game.jellies?.hunting(24);
    game.music.follow(overlayUp() ? LACHRYMA : game.chests?.rave?.active || game.god?.active ? null : fighting ? BATTLE : game.dunes?.active ? DUNES : game.zones?.current === 'workshop' ? WORKSHOP : null);

    if (!godOn) { game.lock.update(game.rawDt); techs.tick(dt); } // (the lock's camera runs in real seconds: a hit-stop does not stall it)
    env.water.update(dt);
    env.rigging.update(dt);
    env.lobbers.update(dt);
    env.slip.update(dt);
    if (!godOn) {
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
      diag.end('anim');
      weapon.tryFire(camera, player, character);
      if (weapon.charge > 0) fx.chargeTick(character.gunPoint('muzzle', new THREE.Vector3()), weapon.charge, dt);
    } else player.renderPos.copy(player.pos);
    god.applyCamera(dt);
    weapon.updateDebris(dt);

    diag.begin('props'); breakables.update(dt); diag.end('props');
    clappers.update(dt, acc / FIXED);
    shells.update(dt);
    baubles.update(dt);
    baubles.tick(dt);
    lachryma.update(dt);
    level.updateFeatures?.(dt, game);
    course.update(dt);
    game.circuits.update(dt);
    game.cubes.update(dt);
    game.chests.update(dt);
    game.weir.update(dt);
    // underground: no sun through the ground (it would light the lab outside its shadow
    // frustum), thinner fog so the long rooms read end to end, no shadow-map updates
    game.dunes.update(dt);
    game.crystals?.update(dt);
    const dm = game.dunes.mix; // (in the dunes the sun is a real one)
    const under = THREE.MathUtils.clamp((-camera.position.y - 1) / 3, 0, 1) * (1 - dm);
    sun.intensity = THREE.MathUtils.lerp(T.visual.sun * (1 - under), game.dunes.sunIntensity ?? 0, dm);
    scene.fog.density = THREE.MathUtils.lerp(T.visual.fog * (1 - 0.6 * under), scene.fog.density, dm);
    player.killY = game.dunes.active ? DUNE.y - 90 : -100;
    // under the water: close teal murk
    const wv = env.water.at(camera.position.x, camera.position.y, camera.position.z);
    if (wv && camera.position.y < wv.surface) { scene.fog.color.setHex(0x24515a); scene.fog.density = 0.16; }
    else if (dm < 0.01) scene.fog.color.setHex(PALETTE.deep);
    renderer.shadowMap.autoUpdate = under < 1;
    diag.begin('fx'); fx.update(dt, camera); diag.end('fx');
    level.kilnLight.intensity = 26 + Math.sin(now * 0.004) * 3 + Math.sin(now * 0.011) * 2;

    diag.update(game.rawDt);

    hud.update(dt, {
      spreadDeg: weapon.spreadDeg(player), fov: camera.fov, pool: lachryma, shells: { types: SHELL_TYPES, selected: shells.selected, counts: shells.counts },
      reloadT: weapon.reloadT, fp: player.fpWeight > 0.5, ads: weapon.adsEase,
      charge: weapon.charge, gunOut: weapon.drawT > 0.05 || !!weapon.wantShell, // (a boolean: undefined would read as the HUD's default, out)
      speed: Math.hypot(player.vel.x, player.vel.z),
      move: (techs.label() || (player.wallrun ? 'WALLRUN' : player.sliding ? 'SLIDE' : player.mantle ? 'MANTLE' : player.dashT > 0 ? 'DASH' : player.crouching ? 'CROUCH' : player.sprinting ? 'SPRINT' : player.walking ? 'WALK' : !player.grounded ? 'AIR' : ''))
      , blink: blinkState(),
    });

    game.mood.end(game.rawDt); // (and the room's lights borrowed again, just before the draw)
    game.zones.update(game.rawDt); // (what is drawn: the zone the camera is in, and what can be seen from it)
    game.lights.update(game.rawDt); // (and the lamps that light it: after everything has set its own)
    game.present.update(game.rawDt); // (new things shaded to match)
    input.endFrame();
  }
  requestAnimationFrame(frame);

  // handle for automated tests / console tinkering
  window.__hideUI = (level) => game.ui.set(level);
  window.__game = { THREE, RAPIER, T, scene, camera, renderer, post: game.post, draw: () => game.post.render(scene, camera), physics, player, weapon, character, breakables, level, input, fx, hud, resetRoom, stats, clock, tick, clappers, lachryma, baubles, shells, trial, course, techs, game, events, movers, system, codex, pneuka: game.pneuka, ledger: game.ledger, log: game.log, manual: false, hideUI: (level) => game.ui.set(level), zones: game.zones, lights: game.lights };
  mark('ready');
  if (window.__game.manual && game.title?.active) { game.title.active = false; game.mode ||= 'debug'; game.title.ui.close(); game.ui.want('title', false); } // (a test drive goes straight to the world)
  window.__ready = true;
}

main().catch((e) => {
  console.error(e);
  const l = document.getElementById('loading');
  if (l) l.textContent = `Failed to start: ${e.message}`;
});
