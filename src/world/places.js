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

  add(id, { name = id, at, yaw = null, note = '', near = 1.6 }) { this.map.set(id, { id, name, at, yaw, note, near }); return this; }
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
    if (!p || !at) return null;
    if (g.well?.active) g.well.end?.(false);
    const zone = wholeOf(at);
    if (zone === 'dunes' && !g.dunes?.active) g.course.toDunes(); // (the sand sea is entered: its floor of the world, its sky)
    if (zone === 'well') return null; // (the Well is gone into from its mouth: travel to 'well.mouth' and interact)
    const off = new THREE.Vector3(0, 0, p.near); // (how far from it they are set down: within reach of what F does there)
    if (p.yaw != null) off.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
    const to = at.clone().add(off);
    if (zone === 'dunes' && g.dunes?.heightAt) to.y = g.dunes.heightAt(to.x, to.z) + 0.05;
    const yaw = Math.atan2(at.x - to.x, at.z - to.z);
    g.course.teleport(to, yaw);
    return { pos: to, yaw };
  }

  /** Stand at a point (a QAIS report's `stand` line, /goto x y z yaw): into its zone as travel() goes, then set down there. */
  stand(to, yaw = 0) {
    const g = this.game, zone = wholeOf(to);
    if (zone === 'well') return null;
    if (g.well?.active) g.well.end?.(false);
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
  P.add('kiln', { name: 'the kiln', at: () => KILN_AT.clone(), yaw: Math.PI, note: 'F: the kiln window (glazes, mending)' });
  P.add('throwing', { name: 'the Throwing Room', at: () => TR.mark.clone(), yaw: Math.PI / 2, note: 'on the firing mark; F at the Index\'s lectern: the drills' }); // (world/testroom/)
  if (game.course?.console) P.add('index', { name: 'the index console', at: () => V(game.course.console.x, -14, game.course.console.z), note: 'F: the room menu' });
  if (game.dunes) P.add('dunes', { name: 'the dunes', at: () => game.dunes.spawnPoint(), note: 'the sand sea; the Weir is its oasis' });
  if (game.course?.weirSpawn) P.add('weir', { name: 'the Weir', at: () => game.course.weirSpawn.v.clone(), note: 'the oasis: the pools, the pier, the treasury' });
  if (game.course?.siegeSpawn) P.add('siege', { name: 'the Siege', at: () => game.course.siegeSpawn.v.clone(), note: 'raids happen here' });
  if (game.course?.labSpawn) P.add('lab', { name: 'the movement lab', at: () => game.course.labSpawn.v.clone() });
  if (game.dunes?.beach) {
    const b = game.dunes.beach;
    P.add('shore', { name: 'the shore', at: () => b.landing().pos, note: 'where the sand meets the Emocean, due east of the oasis' });
    P.add('jetty', { name: 'the jetty\'s end', at: () => b.jetty.end.clone(), note: 'over the crude; the sloop moors here' });
  }
  if (game.well) P.add('well.mouth', { name: 'the mouth of the Great Dunemaw', at: () => game.well.mouthPos.clone(), near: 1, note: 'F: down into the Well' }); // (its reach is 2.4 m, and the sand round it slips)
  for (const n of game.folk?.list || []) P.add(`folk.${n.def?.id || n.id}`, { name: n.def?.name || n.name || 'one of the folk', at: () => n.pos.clone(), note: 'F: talk' });
  if (game.chests?.tithe) P.add('tithe', { name: 'the Tithe', at: () => game.chests.tithe.pos.clone(), note: 'the treasury\'s chest' });
  game.places = P;
  return P;
}
