// ---------------------------------------------------------------------------------------
// PLACES: every room and landmark by name, one registry the agents (agent/agent.js), the trailer and the map can all read
// (docs/plans/COOP.md, C3). A place is an id, a name, the zone it is in (render/zones.js), and where it is (a function: some places
// move, the folk stand where they were put). Getting there is `travel(id)`: into its zone the way the room index takes you (the dunes are
// entered, not just stood in), then set down beside it. Walking there is the agent's (`goto`).
//
// Prior art: the named locations of an MMO's /goto and a level editor's landmarks (the Source engine's info_landmark), and the
// "points of interest" a test harness keeps for scripted playthroughs (Unreal's Gauntlet, Rare's automated playtests of Sea of Thieves).
//
//   game.places.add(id, { name, at: () => Vector3, yaw, note, near })   .get(id)   .all() -> [{ id, name, zone, pos, note }]
//   .travel(id) -> { pos, yaw } | null   (set down a step from it, facing it)   .stand(pos, yaw) -> { pos, yaw } | null (a point, as it is)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf, wholeOf } from '../render/zones.js';
import { KILN_AT } from '../courier/moves/kiln.js';
import { TR } from './testroom/layout.js';

const r2 = (v) => +v.toFixed(2);

export class Places {
  constructor(game) {
    this.game = game;
    this.map = new Map();
  }

  add(id, { name = id, at, yaw = null, note = '', near = 1.6, stand = null, deck = false, via = null }) { this.map.set(id, { id, name, at, yaw, note, near, stand, deck, via }); return this; } // (stand: the exact spot to be set down, facing `at`; deck: set down at its own height, not on the sand under it)
  /** Not while a crossing is sailed: the Courier is the ship's (SWEEPS group 3: /goto mid-crossing left a full-size Courier on the sloop). */
  refuses() { return !!this.game.emocean?.stage.active; }
  get(id) { return this.map.get(id) || null; }
  pos(id) { const p = this.get(id); try { return p ? p.at() : null; } catch { return null; } }

  /** Every place, as data (what an agent reads first). */
  all() {
    const out = [];
    for (const p of this.map.values()) { const v = this.pos(p.id); if (v) out.push({ id: p.id, name: p.name, zone: zoneOf(v), pos: [r2(v.x), r2(v.y), r2(v.z)], ...(p.note ? { note: p.note } : {}) }); }
    return out;
  }

  /** Into the place's zone the way the game takes you there, and set down a step from it, facing it. */
  travel(id) {
    const g = this.game, p = this.get(id), at = this.pos(id);
    if (p?.via) return p.via() ? { pos: at, yaw: 0 } : null; // (a place reached its own way: a debug chest in the Spirit Garden, debug/debugchest.js)
    if (!p || !at || this.refuses()) return null;
    if (g.well?.active) g.well.end?.('abandon'); // (travelled out of a run: it is given up, nothing paid, nothing hauled: SWEEPS group 3)
    const zone = wholeOf(at);
    if (zone === 'dunes' && !g.dunes?.active) g.course.toDunes(); // (the sand sea is entered: its floor of the world, its sky)
    if (zone === 'well') return null; // (the Well is gone into from its mouth: travel to 'well.mouth' and interact)
    const off = new THREE.Vector3(0, 0, p.near); // (how far from it they are set down: within reach of what F does there)
    if (p.yaw != null) off.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
    const to = p.stand ? p.stand().clone() : at.clone().add(off);
    if (zone === 'dunes' && g.dunes?.heightAt && !p.deck) to.y = g.dunes.heightAt(to.x, to.z) + 0.05;
    if (p.deck) to.y = at.y + 0.05; // (on the planks, not the seabed under them: the jetty dropped them into the crude)
    const yaw = Math.atan2(at.x - to.x, at.z - to.z);
    if (g.player) g.player.killY = Math.min(g.player.killY ?? -100, to.y - 90); // (the floor under where they are set down, now: casebook 23)
    g.course.teleport(to, yaw);
    return { pos: to, yaw };
  }

  /** Stand at a point (a QAIS report's `stand` line, /goto x y z yaw): into its zone as travel() goes, then set down there. */
  stand(to, yaw = 0) {
    const g = this.game, zone = wholeOf(to);
    if (zone === 'well' || this.refuses()) return null;
    if (g.well?.active) g.well.end?.('abandon');
    if (zone === 'dunes' && !g.dunes?.active) g.course.toDunes();
    if (g.player) g.player.killY = Math.min(g.player.killY ?? -100, to.y - 90); // (the world's floor under where they are set down, now: a far dock is 418 m down, and last frame's floor would call it a fall)
    g.course.teleport(to.clone(), yaw);
    return { pos: to, yaw };
  }
}

/** The places the game knows today. A new room or landmark adds itself here (or calls game.places.add where it is built). */
export function installPlaces(game) {
  const P = new Places(game), V = (x, y, z) => new THREE.Vector3(x, y, z);
  P.add('workshop', { name: 'the workshop', at: () => game.player.spawn.clone(), note: 'where a new Courier wakes; the kiln and the folk' });
  P.add('kiln', { name: 'the kiln', at: () => KILN_AT.clone().setZ(KILN_AT.z + 1), stand: () => KILN_AT, note: 'F: the kiln window (glazes, mending)' }); // (in the kiln's light, facing its mouth: 2.5 m from Saggar, so F is the kiln's)
  P.add('strawman', { name: 'Strawman', at: () => TR.strawman.clone(), note: 'F: its mode; the bout is said in the log' });
  P.add('spraywall', { name: 'the spray wall', at: () => new THREE.Vector3(TR.wall.x, 0, TR.wall.z), yaw: -Math.PI / 2, near: 2.5, note: 'clay that keeps every dent' });
  P.add('throwing', { name: 'the Throwing Room', at: () => TR.mark.clone(), yaw: Math.PI / 2, note: 'on the firing mark; F at the Index\'s lectern: the drills' }); // (world/testroom/)
  if (game.course?.console) P.add('index', { name: 'the index console', at: () => V(game.course.console.x, -14, game.course.console.z), note: 'F: the room menu' });
  if (game.dunes) P.add('dunes', { name: 'the dunes', at: () => game.dunes.spawnPoint(), note: 'the sand sea; the Weir is its oasis' });
  if (game.course?.weirSpawn) P.add('weir', { name: 'the Weir', at: () => game.course.weirSpawn.v.clone(), note: 'the oasis: the pools, the pier, the treasury' });
  if (game.course?.siegeSpawn) P.add('siege', { name: 'the Siege', at: () => game.course.siegeSpawn.v.clone(), note: 'raids happen here' });
  if (game.course?.labSpawn) P.add('lab', { name: 'the movement lab', at: () => game.course.labSpawn.v.clone() });
  if (game.dunes?.beach) {
    const b = game.dunes.beach;
    P.add('shore', { name: 'the shore', at: () => b.landing().pos, note: 'where the sand meets the Emocean, due east of the oasis' });
    P.add('jetty', { name: 'the jetty\'s end', at: () => b.jetty.end.clone(), yaw: -Math.PI / 2, deck: true, note: 'over the crude; the sloop moors here' });
  }
  if (game.margarite) P.add('margarite', { name: "Margarite's dock", at: () => game.margarite.spot('landing').pos.clone().setX(game.margarite.spot('landing').pos.x - 6), yaw: -Math.PI / 2, note: 'the far end of the crossing: the Pearl Shrine, the Purser, Letty, the pier home' });
  if (game.well) P.add('well.mouth', { name: 'the mouth of the Great Dunemaw', at: () => game.well.mouthPos.clone(), near: 1, note: 'F: down into the Well' }); // (its reach is 2.4 m, and the sand round it slips)
  for (const n of game.folk?.list || []) P.add(`folk.${n.def?.id || n.id}`, { name: n.def?.name || n.name || 'one of the folk', at: () => n.pos.clone(), note: 'F: talk' });
  if (game.chests?.tithe) P.add('tithe', { name: 'the Tithe', at: () => game.chests.tithe.pos.clone(), stand: () => game.chests.tithe.mark, note: 'the treasury\'s chest' });
  game.places = P;
  return P;
}
