// ---------------------------------------------------------------------------------------
// BOOT CREATURES: the creatures and the folk. The creatures and their kit (the Throwing Room, stun, the zandatsu's dissolve, how a
// creature comes in, a blow's feel, a Figment's scatter), the slip jellies and the Lantern Wisps (their models parsed here) set round the
// Weir, mirages, spirits, the bound, the catch's look and the crystals; the clay folk with their dialogue box; the places and the agent;
// the glove on the windows.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootCreatures(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ThrowingRoom } from '../world/throwingroom/room.js';
import { ThrowingRoomDress } from '../vfx/throwingroomkit.js';
import { Folk } from '../npc/folk.js';
import { Creatures } from '../creatures/creatures.js';
import { Stun } from '../creatures/stun.js';
import { Agent } from '../agent/agent.js';
import { installPlaces } from '../world/places.js';
import { Dissolve } from '../vfx/dissolve.js';
import { FigmentScatter } from '../vfx/figmentscatter.js';
import { BlowFeel } from '../vfx/blowfeel.js';
import { SpawnLook } from '../vfx/spawnlook.js';
import { SlipJellies } from '../creatures/jelly/slipjelly.js';
import { WEIR_SPAWN } from '../tools/sondelass/angling/weir.js';
import { LanternWisps } from '../creatures/wisp/lanternwisp.js';
import jellyB64 from '../assets/slipjelly.glb?b64';
import { Dialogue } from '../npc/dialogue.js';
import { placePeople } from '../npc/people.js';
import { theme } from '../ui/theme.js';
import { Mirages } from '../tools/crucibelle/mirage.js';
import { Spirits } from '../creatures/spirits.js';
import { Bound } from '../creatures/bound.js';
import { CatchLook } from '../vfx/catch.js';
import { Crystals } from '../world/dunes/crystals.js';
import { DunesAreas } from '../world/dunes/areacut.js';
import { RareFinds } from '../world/dunes/rarefinds.js';
import { DunesDress } from '../vfx/dunes/index.js';
import { RacewayDress } from '../vfx/raceway/index.js';
import { JellyMountLook } from '../vfx/jellymount/look.js';

export async function bootCreatures(game, made) {
  const { scene, level, loader, bytes, clapG } = made;
  // the clay folk and their talk (npc/): placed now that the rooms they stand in are built
  // the creatures that fight back (creatures.js): for now the slip jellies on the flats past the Weir (creatures/jelly/slipjelly.js)
  game.creatures = new Creatures(game);
  game.throwingRoom = new ThrowingRoom(game, level.throwingRoom); // (the Throwing Room off the Workshop: its pots, Strawman, the drills; world/throwingroom/)
  (game.throwingRoomDress = new ThrowingRoomDress(game)).update(0); // (its stand-ins dressed: the drill targets as fired plates, the Index's lectern; vfx/throwingroomkit.js)
  game.stun = new Stun(game); // (a mind knocked out of itself, for anything that can be: stun.js)
  game.dissolve = new Dissolve(game); // (a zandatsu's pieces, come undone into Lachryma: vfx/dissolve.js)
  game.spawnLook = new SpawnLook(game); // (how a creature comes in: the island's own rise from the ground, an Egregore or a stray tears in from midair: vfx/spawnlook.js)
  game.blowFeel = new BlowFeel(game); // (a melee blow's weight, looks only: its sparks, ring, ribbon flare, camera kick, flinch: vfx/blowfeel.js)
  game.figmentScatter = new FigmentScatter(game); // (a Figment's death: snapped, its wire, motes into the air and the ground: vfx/figmentscatter.js)
  game.jellies = new SlipJellies(game, await loader.parseAsync(bytes(jellyB64), ''));
  // (their homes over 45 m from the busker's mat on Grog's pier, a slip jelly's leash and sight together: it was 32, the owner's R9)
  // (each set on the sand's own height; the ground ray that froze two of them is fixed in slipjelly.js `ground`: the owner, v170)
  for (const [dx, dz] of [[-12, -42], [4, -48], [18, -40]]) { const x = WEIR_SPAWN.pos[0] + dx, z = WEIR_SPAWN.pos[2] + dz; game.jellies.spawn(new THREE.Vector3(x, game.dunes?.heightAt?.(x, z) ?? WEIR_SPAWN.pos[1], z)); }
  // (the Lantern Wisps: the Dunes' second creature, on the owner's model (the owner, v170): three round the oasis, away from the jellies)
  game.wisps = new LanternWisps(game, await loader.parseAsync(bytes((await import('../assets/lantern_wisp.glb?b64')).default), ''));
  for (const [dx, dz] of [[-38, -72], [10, -86], [40, -60]]) { const x = WEIR_SPAWN.pos[0] + dx, z = WEIR_SPAWN.pos[2] + dz; game.wisps.spawn(new THREE.Vector3(x, game.dunes?.heightAt?.(x, z) ?? WEIR_SPAWN.pos[1], z)); }
  game.mirage = new Mirages(game); // (Couriers of smoke that minds take for them: the Crucibelle's mirage)
  game.spirits = new Spirits(game); // (smoke spirits on their side: the Crucibelle's and the Lockheart's: spirits.js)
  game.bound = new Bound(game); // (the Figments caught, waiting in the Jar for the garden: creatures/bound.js)
  game.catchLook = new CatchLook({ fx: game.fx }); scene.add(game.catchLook.group); // (Calissa's: one look for the hand's catch and the coffin's, vfx/catch.js)
  game.crystals = new Crystals(game); // (Lachryma set hard in the sand: the Dreamvane's: world/dunes/crystals.js)
  game.dunesAreas = new DunesAreas(game); // (the Dunes as five areas: the one you are in, said as you reach it: world/dunes/areacut.js)
  game.rareFinds = new RareFinds(game); // (an area's condition-bound find: the ridges' fulgurite, the ruins' Wisp: world/dunes/rarefinds.js)
  game.dunesDress = new DunesDress(game); game.racewayDress = new RacewayDress(game); // (the living dressing, looks only: the Dunes' dust devils, mirage, geodes and fulgurites; the Raceway's spectators, banners, lanterns and fireworks: vfx/dunes/, vfx/raceway/)
  game.jellyMountLook = new JellyMountLook(game); // (the slip jelly mount's body, its moments and the mounts' ring, over Petra's runtime: vfx/jellymount/)
  game.folk = new Folk(game, clapG);
  placePeople(game, game.folk);
  game.dialogue = new Dialogue(game);
  installPlaces(game); game.agent = new Agent(game); // (the game as an AI player sees and drives it: world/places.js, agent/agent.js; docs/plans/COOP.md)
  for (const id of ['codex', 'pneuka', 'indexmenu', 'mapui', 'dialogue']) theme.watch(document.getElementById(id));
  theme.watch(document.getElementById('overlay'), { sound: false, point: '.go .opt' }); // (the title: the glove waits at BEGIN)
  theme.aim(document.querySelector('#overlay .go .opt'));
  game.theme = theme;
}
