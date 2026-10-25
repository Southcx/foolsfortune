// ---------------------------------------------------------------------------------------
// BOOT WARM-UP: every shader of every room compiled behind the loading screen, and everything drawn once into a postage stamp, so that
// nothing compiles in play: the zones off for it, an empty frame first for the clipping state, the pieces made on first need made now and
// parked 50 m down, the programs linked in parallel, the overlay's and the glow's own passes, a prime draw; then everything put back and
// the loading screen removed.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootWarmup(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LachrymatoBottle } from '../vfx/bottle.js';
import { crackPrewarm } from '../vfx/crackskin.js';
import { prewarm as prewarmMatterLook } from '../vfx/godhand/matterlook.js';
import { prewarmCasterShadersS1toS5 } from '../vfx/caster/warmups1tos5.js';
import { prewarmShellLooks } from '../vfx/shelllooks/warmup.js';
import { prewarmSandfall } from '../vfx/racewaysandfall.js';
import { LachrimeterTube } from '../vfx/lachrimetertube.js';
import { SpiritualLink } from '../vfx/spirituallink.js';
import { PsygunCylinder } from '../vfx/psyguncylinder.js';
import { SondelassGuard } from '../vfx/sondelassguard.js';
import { SightLook } from '../vfx/sight.js';
import { InstrumentSkins, INSTRUMENT_SKIN_ORDER } from '../vfx/instrumentskins.js';
import { CreatureTags } from '../vfx/creaturetags.js';
import { TitlePlacard } from '../vfx/titleplacard.js';
import { SealImprints } from '../vfx/sealimprint.js';
import { SealPicker } from '../ui/sealpicker.js';
import { RailReadout } from '../ui/railreadout.js';
import { GoalsWindow } from '../ui/goalswindow.js';
import { HudLayout } from '../ui/hudlayout.js';
import { RailResults } from '../ui/railresults.js'; // (round 6's overlay pieces: OVERLAY.md 10.5c)
import { prewarmFish } from '../tools/sondelass/angling/fishmesh.js';
import { WireCompass } from '../vfx/wirecompass.js';
import { VaneHud } from '../vfx/vanehud.js';
import { CrucibelleHud } from '../vfx/crucibellehud.js';
import { LockheartReliquary } from '../vfx/lockheartreliquary.js';
import { SoulBrushDesk } from '../vfx/soulbrushdesk.js';
import { PsygunReticle } from '../vfx/psygunreticle.js'; // (the psygun variants' looks: OVERLAY.md 19)
import { PsygunScope } from '../vfx/psygunscope.js'; // (the psygun variants' looks: OVERLAY.md 19)
import { TouchShell } from '../feedback/touchshell.js';
import { trimShadows } from '../render/shadowtrim.js';
import { installTouchControls } from '../ui/touch/index.js';
import { prewarmEgregores } from '../vfx/opensea/egregorebodies.js';

const CASTER_SHADERS = import.meta.glob('../vfx/caster/*.js', { eager: true }); // (the caster shaders: each module's prewarm(game), compiled in the warm-up)

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

export async function bootWarmup(game, made) {
  const { mark, renderer, scene, camera, breakables, god } = made;
  // warm the shaders while the loading screen is still up: every room's materials at once (zones off for it), so the first frame and
  // the first teleport do not stall on the driver compiling them (KHR_parallel_shader_compile lets the browser do it off the main thread)
  for (let i = 0; i < 22; i++) breakables.update(0); // (the pots at rest go into their batches first: those are shaders too)
  game.zones.enabled = false; game.zones.update(1);
  window.__shadowTrim = trimShadows(scene, 0.06); // (casters smaller than a texel of the sun's shadow: render/shadowtrim.js)
  game.post.resize(); renderer.setRenderTarget(game.post.target); // (compiled for the buffer the frame is drawn into)
  // (an empty frame first: compile() reads the clipping state the last render left, and the God Hand's cutaway plane is always installed,
  // so without it every program was compiled for no planes here and again, for one, on the first real frame)
  game.dunes?.trail?.update(0, 0, 0); // (the Dunes' trail map draws a scene of its own: its program compiled here, before the empty frame resets the clipping state; Calissa's)
  renderer.render(new THREE.Scene(), camera);
  const parkWell = game.well?.prewarm?.(); // (a Well's floor is built on entry: one stand-in floor is compiled with the rest, world/well/dunemaw.js)
  // the pieces made on first need are made now and compiled with the rest: the maw wipe (it covers the way into a Well, so it must not
  // open with a compile of its own) and the shore's crude sea and swash (else built on the first view of the Dunes)
  game.mawWipe.make?.(); const wipe = game.mawWipe.mesh; if (wipe) wipe.visible = true;
  if (game.dunes?.beach && !game.shore.built) game.shore.build(game.dunes.beach);
  const parkSpawnLook = game.spawnLook.prewarm(); // (a creature's rise and tear: the slit, the crust plates, the blocks)
  const parkDrain = game.dataDrain.prewarm(); // (the data drain's cubes, beam and bracelet)
  const parkDuel = game.duelView.prewarm(); // (a puzzle duel's board, pieces, marks and the domains' clash, 50 m down: its one program)
  const parkCracks = crackPrewarm(scene, god.jar.jarBody); // (the Pneuka Jar's skinned crack and gold seam: vfx/crackskin.js)
  const parkWeather = game.weatherLook?.prewarm?.(); // (the weather's rain, motes, rings, aurora and bolt: made now, not on the first weather)
  // (a Lachrymato Bottle and the jets' ring, made now and parked hidden, never disposed: their programs live while one exists; the casebook's
  // rules 17 and 18. The stain that stood beside them is gone: the paint map draws the blots, the ribbons' program the slicks, docs/CASEBOOK-CASES.md 2026-10-10)
  const finLook = prewarmFish(); // (a Weir fish's body, its one program: every species is drawn with it, vfx/fishlook.js; the fish are made only near the Weir)
  const brushLooks = [new LachrymatoBottle({ size: 'small' }).group, game.loadGauge.ring.mesh, finLook]; // (the jet ring: the ribbons' one program, the brush's marks' and every slick's, vfx/brushmarks.js, vfx/slicks.js)
  for (const o of brushLooks) { o.position.set(0, -50, 0); o.userData.zoneFree = true; o.visible = true; scene.add(o); }
  game.parryMark.mark(brushLooks[0]); // (and the parry mark on the parked bottle, never cleared: its program lives while one mark does)
  const rare = !game.graphics?.machine?.mobile; // (a phone compiles the caster shells' looks on first sight, not at boot: seldom seen, each a program held and seconds of a phone's boot; Calissa's program audit, 2026-10-25)
  const parkCasterS1toS5 = rare ? prewarmCasterShadersS1toS5(scene) : () => {}; // (the caster shells' shaders S1 to S5, one copy each 50 m down: their six programs, vfx/caster/)
  const parkCaster = Object.values(CASTER_SHADERS).filter((m) => rare && m.layer).map((m) => m.prewarm?.(game)).filter(Boolean); // (S6 to S10, the caster shaders' programs, their screen passes in the glow's chain: vfx/caster/)
  const seaFightAt = (game.seaFightLook?.parked() || []).map((o) => { o.visible = true; return o; }); // (the fight's shots: the rail's program, warmed with it)
  const parkIslets = game.seaLooks?.prewarm?.() ?? (() => {}); // (the islets' and the shallows' programs, 50 m down: vfx/opensea/isletlooks.js)
  const parkSquall = game.squallLine?.prewarm?.() ?? (() => {}); // (the squall line's program, and the rain's: vfx/opensea/squallline.js)
  const parkDress = [game.dunesDress.prewarm(), game.racewayDress.prewarm()]; // (the dust devils' and the Dunes' mirage's two programs, and the dressing's materials: vfx/dunes/, vfx/raceway/)
  const parkEgregores = prewarmEgregores(scene); // (the safari Egregores' one program, every species: vfx/opensea/egregorekit.js)
  const parkSandfall = prewarmSandfall(scene); // (the Raceway's sandfall, one copy 50 m down: its one program, vfx/racewaysandfall.js)
  const parkMatterLook = prewarmMatterLook(scene); // (the god hand's matter, ball and creations: one program, vfx/godhand/matterlook.js)
  const parkJarLook = game.pneukaJarLook.prewarm(); // (the Jar's look's one program, the Jar shown 50 m down for the compile: vfx/pneukajar/look.js)
  const parkBracelet = game.bracelets.prewarm(); // (the bracelet's glazes, charms, flash and aura, 50 m down: vfx/braceletwear.js)
  const parkPalmDie = game.palmDieLook?.prewarm?.() ?? (() => {}); // (the palm die in its finish, 50 m down: vfx/godhand/palmdie.js; Calissa's, 2026-10-25)
  game.present.shade(true); try { await renderer.compileAsync(scene, camera); } catch (e) { console.warn('shader warm-up', e); } // (the scene's programs linked in parallel first: the shell looks' Portal draw below draws the whole scene, which linked them one at a time, 72 of 182, the render inventory 2026-10-19)
  const parkShellLooks = rare ? await prewarmShellLooks(game) : () => {}; // (what the caster shells show in play, kept alive so it is never compiled twice: vfx/shelllooks/warmup.js)
  const parkFigmentTelegraphs = game.figmentTelegraphs.prewarm(); // (one Figment attack telegraph and one of its glyphs, 50 m under the world: their one program)
  const gardenLooks = [...(game.realm?.parked() || []), ...(game.gardenMycelium?.parked() || []), ...(game.solar?.parked() || []), ...(game.geysers?.parked() || []), ...(game.ostraca?.parked() || []), ...(game.debugChests?.parked() || [])]; for (const o of gardenLooks) o.visible = true; // (the garden's planetoids and a spirit, compiled with the rest)
  game.emocean?.build(); const seaLooks = game.emocean ? game.emocean.parked() : []; // (the crossing's sea, ship, foes and set pieces, parked: world/emocean/stage.js)
  const seaAt = seaLooks.map((o) => o.position.clone()); // (put back after the warm-up: the shoal's look and the wake draw in the world's own frame, and parked 50 m down they stayed under the crude: docs/CASEBOOK-CASES.md 2026-10-08)
  for (const o of seaLooks) { o.visible = true; o.position.set(0, -50, 0); }
  // the compass and its tools' marks (the Dreamvane's vane, the Crucibelle's pendulum), made now and shown for the compile, else made on
  // the first tick after the warm-up and compiled in play (3 programs, measured; casebook rules 17 and 18); their own update hides them after
  game.wireCompass ||= new WireCompass(game); game.vaneHud ||= new VaneHud(game, game.wireCompass); game.crucibelleHud ||= new CrucibelleHud(game, game.wireCompass);
  for (const o of [game.wireCompass.tape, game.wireCompass.wpTape, game.wireCompass.wpWorld, game.vaneHud.group, game.vaneHud.res, game.crucibelleHud.group, game.crucibelleHud.ring]) if (o) o.visible = true;
  game.present.shade(true); // (shaded as they will be drawn: compiled flat, then turned smooth by the pass a second later, every program was built twice)
  try { await renderer.compileAsync(scene, camera); } catch (e) { console.warn('shader warm-up', e); }
  game.hudLayout = new HudLayout(game); // (where the instruments stand on touch, the thumbs' areas, the log's ticker and the turn card: ui/hudlayout.js)
  game.lachrimeterTube = new LachrimeterTube(game); game.spiritualLink = new SpiritualLink(game); game.psygunCylinder = new PsygunCylinder(game); game.psygunReticle = new PsygunReticle(game); game.psygunScope = new PsygunScope(game); // (each psygun's crosshair, the Carbine's lens: vfx/psygunreticle.js, vfx/psygunscope.js) // (the tool UIs' thread to its bulb: vfx/spirituallink.js; the psygun's cylinder on it: vfx/psyguncylinder.js)
  game.sondelassGuard = new SondelassGuard(game); // (the Sondelass's own UI, board v9)
  game.lockheartReliquary = new LockheartReliquary(game); // (the Lockheart's own UI, board v10 in its B orientation: vfx/lockheartreliquary.js)
  game.soulBrushDesk = new SoulBrushDesk(game); // (the Soul Brush's own UI, board v11: the scholar's desk, vfx/soulbrushdesk.js)
  game.sightLook = new SightLook(game); game.creatureTags = new CreatureTags(game); game.titlePlacard = new TitlePlacard(game); game.sealImprints = new SealImprints(game); game.sealPicker = new SealPicker(game); // (the overlay's instruments, tags, placard and seal: OVERLAY.md 10.5c, HANKO.md)
  game.instrumentSkins = new InstrumentSkins(game); // (the instruments' housing as one set, a preference kept in the settings: vfx/instrumentskins.js)
  game.chat.add('instruments', { debug: true, help: `the instruments' skin: /instruments ${INSTRUMENT_SKIN_ORDER.join(' | ')}; /instruments alone lists them`, run: ([id]) => {
    if (id && game.instrumentSkins.set(id)) return;
    game.log.say('info', `${id ? `No skin "${id}". ` : ''}Instrument skins: ${INSTRUMENT_SKIN_ORDER.map((k) => `${k}${k === game.instrumentSkins.id ? ' (on)' : ''}`).join(', ')}.`, { key: 'instruments', throttle: 0.5 });
  } });
  game.railReadout = new RailReadout(game); game.railResults = new RailResults(game); // (the crossing's score aboard and the trip's results window, built on first use: ui/railreadout.js, ui/railresults.js; RAIL-STANDARDS.md 6)
  game.goalsWindow = new GoalsWindow(game); // (the game day's three goals as a System window, on /goals and a beat at goals.set and goal.done: ui/goalswindow.js)
  installTouchControls(game); // (touch play's controls, their look: built only once touch is on, ui/touch/index.js)
  game.touchShell = new TouchShell(game); // (what those controls do: a tile pressed through the bindings, the top bar's windows by their keys: feedback/touchshell.js)
  game.overlayScene.compile(); // (the overlay's meshes, against the canvas they are drawn into)
  game.post.compile(); // (the glow's own passes: a scene of their own, which compileAsync(scene) does not see)
  // (a test harness may skip it: it is a long frame on a software GL. A phone skips it too: it uploads every area's geometry and textures
  // at once, about 250 MB before the areas let the far ones go, and an iPhone took the graphics back 12 real s after it, v272, the
  // owner's screenshot. The programs are still all built above; a phone uploads an area's pieces when they are first drawn, behind
  // the seam: render/areas.js)
  if (!window.__noPrime && !game.graphics?.machine?.mobile) primeDraw(renderer, scene, camera, game.post.target);
  parkWell?.(); // (after the prime: drawn once, so the driver has finished with its programs too)
  if (wipe) wipe.visible = false;
  parkWeather?.(); parkDrain(); parkDuel(); parkSpawnLook(); parkCracks(); parkFigmentTelegraphs(); parkCasterS1toS5(); parkCaster.forEach((f) => f()); parkShellLooks(); parkBracelet(); parkPalmDie(); parkJarLook(); parkMatterLook(); parkSandfall(); parkDress.forEach((f) => f()); parkIslets(); parkSquall(); parkEgregores(); seaFightAt.forEach((o) => (o.visible = false));
  for (const o of brushLooks) o.visible = false;
  seaLooks.forEach((o, i) => { o.visible = false; o.position.copy(seaAt[i]); });
  for (const o of gardenLooks) o.visible = false;
  renderer.setRenderTarget(null);
  game.zones.enabled = true; game.zones.t = 0;
  game.iconWarm?.warmAll(); // (the tools' and a kept save's pictures, under the loading screen: boot/iconwarm.js)
  game.zones.update(0); game.areas.settle(); // (the areas the warm-up drew and the camera is not in or beside let go again: render/areas.js)
  mark('shaders');
  document.getElementById('loading').remove();
}
