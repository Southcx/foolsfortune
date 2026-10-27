// ---------------------------------------------------------------------------------------
// BOOT ROOMS: the rooms beyond the workshop and what F acts on. The sources the interact chevron points at (a pot to carry, an item on
// the ground, a chest, one of the folk, a Well, the garden's places, a find in a Well's wall, an ostracon, the kiln, a thing to push) and
// the rooms they lead to: the Solar Skiffing trial, the slip geysers, the open sea with its looks and its fight, the Raceway and its
// race, the Shrines, the Emocean's crossing with its pier and its mooring.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootRooms(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Shrines } from '../world/shrines.js';
import { Emocean } from '../world/emocean/stage.js';
import { Pier } from '../world/emocean/pier.js';
import { Mooring } from '../vfx/mooring.js';
import { EncounterFilm } from '../vfx/encounters/film.js';
import { KILN_AT } from '../courier/moves/kiln.js';
import { SolarTrial } from '../world/dunes/solar.js';
import { Geysers } from '../world/dunes/geysers.js';
import { Raceway } from '../world/raceway/raceway.js';
import { OpenSea } from '../world/opensea/opensea.js';
import { SeaFight } from '../world/opensea/seafight.js';
import { SeaSerpentBody } from '../vfx/opensea/seaserpentbody.js';
import { SeaLooks } from '../vfx/opensea/isletlooks.js';
import { PuzzleLooks } from '../vfx/opensea/puzzlelooks.js';
import { BottleLooks } from '../vfx/opensea/bottlelooks.js';
import { SalvageLooks } from '../vfx/opensea/salvagelooks.js';
import { ShipPartWear } from '../vfx/shipkit/partlooks.js';
import { SquallLine } from '../vfx/opensea/squallline.js';
import { egregoreBody } from '../vfx/opensea/egregorebodies.js';
import { SeaFightLook } from '../vfx/opensea/seafightlook.js';
import { SeaHull } from '../ui/seahull.js';
import { Race } from '../world/raceway/race.js';
import { EgregoreHerd } from '../vfx/opensea/egregoreherd.js';
import { cardBackOpen } from '../progress/cardbacks.js';
import { cosmeticOpen } from '../progress/cosmetics.js';

export function bootRooms(game, made) {
  const { player, techs } = made;
  {
    const carry = techs.get('carry'), push = techs.get('push');
    const spot = (e) => { const t = e.body.translation(); return new THREE.Vector3(t.x, t.y + (carry.size(e) * 0.5 + 0.5), t.z).setX(t.x); };
    const idle = () => !techs.active && player.grounded && !player.mantle && !player.sliding && !game.god?.controlling;
    game.interact.add('carry', () => {
      if (!carry?.usable() || carry.item || carry.state !== 'idle' || !idle()) return null;
      const e = carry.find(); if (!e) return null;
      const p = spot(e); return { pos: p, d: p.distanceTo(player.pos), ref: e };
    });
    // (where the grapnel would bite is the hook's own mark, not the chevron: vfx/hookmark.js)
    game.interact.add('item', () => (game.god?.controlling ? null : game.ground.nearest(player))); // (what lies on the ground: F picks it up)
    game.interact.add('chest', () => { const t = game.chests.find(); return t ? { pos: t.pos, d: t.d, ref: t.chest || t.kind } : null; });
    // the clay folk: F to talk (npc/folk.js, npc/dialogue.js)
    game.interact.add('npc', () => {
      if (!game.folk || game.dialogue?.open || !idle()) return null;
      const n = game.folk.near(player); if (!n) return null;
      const p = game.folk.head(n).add(new THREE.Vector3(0, 0.55 * n.scale, 0));
      return { pos: p, d: Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z) - 0.3, ref: n.id };
    });
    // a Well: F at its mouth in the Dunes, and at the pools inside (the way up, the way down: world/well/dunemaw.js)
    game.interact.add('well', () => (game.dialogue?.open || !idle() ? null : game.well.nearest(player)));
    game.interact.add('garden', () => game.realm?.offer() ?? null); // (a place in the garden the Jar stands at: world/garden/realm.js)
    game.solar = new SolarTrial(game); // (the Solar Skiffing trial, begun at the Gnomon's foot: world/dunes/solar.js)
    game.geysers = new Geysers(game); // (slip geysers: launch pads on a cycle, world/dunes/geysers.js)
    game.makeSeaSerpent = (o) => new SeaSerpentBody(game, o); // (the sea serpent's body for its mind to drive: vfx/opensea/seaserpentbody.js, drive/update/hit/down)
    game.cardBackOpen = (id) => cardBackOpen(id, game.ledger); // (what opens each of Calissa's card backs, for her picker's OPEN_WHEN: progress/cardbacks.js)
    game.cosmeticOpen = (kind, id) => cosmeticOpen(kind, id, game.ledger); // (what opens each of Calissa's tool skins, Jar parts, flourishes and instrument housings, for her OPEN_WHENs: progress/cosmetics.js)
    game.makeEgregore = (species, o) => egregoreBody(species, o); // (a safari Egregore's body, alive, for whatever lays a sighting on the water: update(dt, { speed, bend }), habit(name), dive(on); vfx/opensea/egregorebodies.js; nothing places them yet)
    game.makeEgregoreHerd = (o) => new EgregoreHerd(o); // (a herd of them in its square, scattering and regrouping round the ship: update(dt, { ship }); vfx/opensea/egregoreherd.js)
    game.seaLooks = new SeaLooks(game); // (the open sea's islets dressed over Dovina's placeholders: vfx/opensea/isletlooks.js)
    game.puzzleLooks = new PuzzleLooks(game); game.squallLine = new SquallLine(game); // (the islets' puzzles dressed, the dig's moment; a front's squall line: vfx/opensea/puzzlelooks.js, squallline.js)
    game.bottleLooks = new BottleLooks(game); game.salvageLooks = new SalvageLooks(game); game.shipPartWear = new ShipPartWear(game); // (the drift bottles, the wrecks and the haul, the ship's parts worn at the free helm: vfx/opensea/bottlelooks.js, salvagelooks.js, vfx/shipkit/partlooks.js)
    game.opensea = new OpenSea(game); // (the Emocean off the lanes, built the first time it is entered: world/opensea/, docs/plans/OPEN-SEA.md)
    game.seaFightLook = new SeaFightLook(game); game.seaHull = new SeaHull(game); // (the fight's needles, globs, splashes and the hull's pips: vfx/opensea/seafightlook.js, ui/seahull.js)
    game.seaFight = new SeaFight(game); // (what fights at the free helm: the gun, the parry, the hull, the sea serpent: world/opensea/seafight.js)
    game.raceway = new Raceway(game); game.race = new Race(game); // (the Solar Skiff's test circuit and its time trial, built the first time it is entered: world/raceway/, docs/plans/SKIFF-RACING.md)
    game.interact.add('find', () => (game.dialogue?.open || !idle() ? null : game.well.finds?.near(player) ?? null)); // (an artifact in a Well's wall: world/well/finds.js)
    game.interact.add('ostracon', () => (game.dialogue?.open || !idle() ? null : game.ostraca?.near(player) ?? null)); // (a sherd with a word on it, a stele: world/ostraca.js)
    // the kiln station: F at the kiln's mouth (courier/moves/kiln.js)
    game.interact.add('kiln', () => {
      if (game.dialogue?.open || game.kilnUI?.open || !idle()) return null;
      const d = Math.hypot(KILN_AT.x - player.pos.x, KILN_AT.z - player.pos.z);
      return d < 2.4 && Math.abs(player.pos.y - KILN_AT.y) < 1.5 ? { pos: KILN_AT.clone().setY(KILN_AT.y + 1.7), d } : null;
    });
    game.shrines = new Shrines(game); // (rest, travel, made whole, the Spirit Garden's door: world/shrines.js; it adds its own interact source)
    game.emocean = new Emocean(game); game.pier = new Pier(game); // (the crossing: F at a jetty's end, the rail shooter; world/emocean/)
    game.mooring = new Mooring(game); game.encounterFilm = new EncounterFilm(game); // (the chosen hull alongside the pier: vfx/mooring.js; the encounters at sea filmed: vfx/encounters/film.js)
    if (game.dunes?.beach) game.pier.add('anagami', () => { const j = game.dunes.beach.jetty; return j && { end: j.end, top: j.top, yaw: -Math.PI / 2 }; });
    game.pier.add('margarite', () => game.margarite.pier);
    game.interact.add('push', () => {
      if (!push?.usable() || push.cool > 0 || carry?.item || !idle()) return null;
      const e = push.canGrab(); if (!e) return null;
      const p = spot(e); return { pos: p, d: p.distanceTo(player.pos), ref: e };
    });
  }
}
