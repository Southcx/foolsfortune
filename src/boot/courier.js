// ---------------------------------------------------------------------------------------
// BOOT COURIER: the models parsed (the Courier, the psygun, the clapperjar, the god hand, the Pneuka Jar), the clapperjars spawned, the
// Courier's own clip suite, their body and the vessel they are (glazes and cracks, combat, the Lockheart's ultimate, death); the input
// and the drivers that press its keys (a phone's thumbs, a pad); and the Player.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootCourier(game, made) -> { loader, bytes, clapG, handG, jarG, clappers, clipPack, character, input, player }
// ---------------------------------------------------------------------------------------
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Character } from '../courier/character.js';
import { Input } from '../core/input.js';
import { Player } from '../courier/player.js';
import { Death } from '../courier/vessel/death.js';
import { Ultimate } from '../tools/lockheart/ultimate.js';
import { sfx } from '../audio/sfx.js';
import courierB64 from '../assets/courier.glb?b64';
import gunB64 from '../assets/psygun.glb?b64';
import handB64 from '../assets/godhand.glb?b64';
import jarB64 from '../assets/pneuka.glb?b64';
import clapperB64 from '../assets/clapperjar.glb?b64';
import animsB64 from '../assets/anims.bin?b64';
import cmuB64 from '../assets/anims_cmu.bin?b64';
import { loadClips } from '../courier/anim/suite.js';
import { Clappers } from '../creatures/clappers.js';
import { VesselDamage } from '../courier/vessel/damage.js';
import { Combat } from '../core/combat.js';
import { Vessel } from '../courier/vessel/vessel.js';
import { IDLES } from '../courier/anim/idlebreak.js';
import { CourierSquash } from '../courier/anim/squash.js';
import { Actions } from '../core/actions.js';
import { TouchDriver } from '../core/touchdriver.js';
import { PadDriver } from '../core/paddriver.js';
import { Replay } from '../core/replay.js';
import { base64Buffer } from '../core/base64.js';
import { surfaceUnder, stepSpeed } from '../courier/stepsurface.js';

export async function bootCourier(game, made) {
  const { mark, renderer, scene, camera, physics } = made;
  const loader = new GLTFLoader();
  const bytes = base64Buffer; // (one loop, not a function a byte: core/base64.js)
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
  if (!made.box) clappers.spawnAll(); // (none in the box room: boot/box.js)
  const clipPack = await loadClips({ packs: [animsB64, cmuB64] }); // (the Courier's own suite, fetched; the UAL and mocap packs widened to its bones: courier/anim/suite.js)
  mark('clappers+anims');
  game.clipPack = clipPack; // (its `social` resolves when the emotes, dances, flirts and taunts are in)
  const character = new Character(scene, charG, gunG, clipPack);
  mark('character');
  character.onFootstep = () => { const P = game.player; if (P) game.events?.emit('move.step', { surface: surfaceUnder(game, P.pos, P.collider), speed: stepSpeed(game), by: 'courier' }); }; // (heard on the bus: audio/cues.js, Wanda's)
  game.character = character;
  game.courierSquash = new CourierSquash(game, character, { carried: () => [character.gun, ...(game.belt?.tools || []).map((t) => t.model), game.player?.techs?.get('carry')?.item?.mesh] }); // (a hard landing's settle on the drawn body only: courier/anim/squash.js; the pot in the hands too, placed from them: CASEBOOK rule 212)
  // the idle chosen at the kiln (the owner's R21: courier/vessel/kilnui.js STANCE; Calissa's IDLES): kept with the player's progress
  game.save?.section('courierIdle', { scope: 'player', version: 1, dump: () => ({ stand: character.idles?.stand ?? IDLES.default }),
    load: (d) => { if (!character.idles?.choose(d?.stand)) character.idles?.choose(IDLES.default); }, reset: () => character.idles?.choose(IDLES.default) });
  // the vessel they are: its glazes and its kintsugi, on them (vessel/: fired at the kiln in the workshop, courier/moves/kiln.js)
  game.vessel = new Vessel(game);
  game.vessel.dress(character);
  game.vesselDamage = new VesselDamage(game, game.vessel); // (a blow cracks them where it lands; the cracks mend: courier/vessel/damage.js)
  game.combat = new Combat(game); // (are they fighting? one signal for the HUD ring and the rest: combat.js)
  game.ultimate = new Ultimate(game); // (the Lockheart opened with a key: the Courier's ultimate, tools/lockheart/ultimate.js)
  game.death = new Death(game); // (the vessel shatters, and is made whole in the workshop: courier/vessel/death.js)

  const input = new Input(renderer.domElement);
  game.actions = new Actions(game, input); // (an input action read whatever device gave it; a control resolved by the live context: core/actions.js, core/bindings.js)
  game.touch = new TouchDriver(game, input, game.actions, renderer.domElement); game.pad = new PadDriver(game, input, game.actions); // (a phone's thumbs and a pad, pressing the keys the game reads: MOBILE.md 10)
  input.onBlur = () => { game.touch.release(); game.pad.release(); game.actions.release(); };
  input.onDevice = (device) => game.events.emit('input.device', { device, by: 'courier' }); // (the device last touched: the touch bar, the help and the HUD follow it)
  document.addEventListener('visibilitychange', () => { if (document.hidden) input.onBlur(); });
  addEventListener('keydown', (e) => game.qais?.keysFirst?.(e), true); // (QAIS first, before every window's own key listener: F8 over any window, and its Esc its own, R7)
  game.replay = new Replay(input); // (what was pressed, kept to play again: core/replay.js; its commands are registered as the game is built)
  const player = new Player(physics, camera, input);
  game.player = player;
  player.game = game;
  return { loader, bytes, clapG, handG, jarG, clappers, clipPack, character, input, player };
}
