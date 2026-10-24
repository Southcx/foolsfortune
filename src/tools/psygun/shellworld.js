// ---------------------------------------------------------------------------------------
// THE WORLD SHELLS (tier V, a runner part: docs/plans/CASTER-SHELLS.md section 7; Dovina's rules, progress/combat/worldshells.js). The
// Caster's own are paid by the self; these are paid by the PLACE. At the trigger the draw (tools/psygun/worlddraw.js, `game.worldDraw`)
// takes the ambient Lachryma round the aim point and sets k (drawn / need, 0.25 to 1.5); the row's numbers fly at k (`scaledN`) through
// the shell's own way, so the nine keep their handlers in their parts, wrapped here; and each changes the place for a while, then gives
// it back (base change bad, modifiers good: every alteration is timed and reverts):
//   Glassmaker  a bridge of fused sand, sized by the draw, that melts back to sand after a game hour
//   Volcano     a real cone of the island's matter (game.creations' voxels) that erupts, then crumbles back as a creation does
//   Thunderhead its cloud fed by the weather drawn; at the cap, a storm cell (two clouds)
//   Rift        takes its creature as before; the hole stays a SPRING of liquid Lachryma for a game hour (a source at the cap)
//   Upfall      the column lifts the ground's loose matter too (sand and the paint it drew, as drops)
//   Weather Away erosion over a place: things tagged `erodible` (core/tags.js) soften and let you through, closing after a game hour
//   Bloom       a thicket grows from the drawn Lachryma, and pots in reach are mended in gold
//   Golem       risen from the matter, its size by the draw
//   Calm        the weather drawn first; within the draw's reach it is fair for a game hour (a thin patch that takes it all)
// The looks are vfx/worldshells.js (`game.worldLooks`). A dry draw is the trigger's (shells.js asks `measure` first and keeps the round);
// if one reaches here dry, the round is given back.
//
// Prior art: FFXI's Geomancy, Zelda's Song of Storms (a place changed for a while, then back), From Dust (matter raised, then worn
// away), Monster Hunter's environment as a weapon.
//
//   WORLD (the part: fires, lands, tick, clear)   WORLD_IDS   worldRow(R, row, ctx) -> the row at its draw, or null (dry)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { registered } from '../../core/tags.js';
import { DRAW, scaledN } from '../../progress/combat/worldshells.js';
import { WorldDraw, GAME_HOUR } from './worlddraw.js';
import { LANDS } from './shellpayloads.js';
import { SPACETIME } from './shellspacetime.js';
import { DEPLOYABLES } from './shelldeployables.js';
import { SPLIT_CHAIN } from './shellsplitchain.js';
import { BODIES } from './shellbodies.js';
import { CASTERS_OWN } from './shellcastersown.js';
import { shellRand, moveCourier } from './shellkit.js';
import { foesNear } from './shellpayloads.js';

export const WORLD_IDS = ['glassmaker', 'volcano', 'thunderhead', 'rift', 'upfall', 'weatherAway', 'bloom', 'golem', 'calm'];
/** The handlers the nine had before this part wrapped them (taken at load, before the runner merges the parts' tables). */
const BASE_FIRES = { glassmaker: SPACETIME.fires.glassmaker, volcano: DEPLOYABLES.fires.volcano, golem: DEPLOYABLES.fires.golem, thunderhead: SPLIT_CHAIN.fires.thunderhead, calm: CASTERS_OWN.fires.calm };
const BASE_LANDS = { rift: SPACETIME.lands.rift, bloom: SPACETIME.lands.bloom, upfall: BODIES.lands.upfall, weatherAway: LANDS.weatherAway };

/** The World alterations' numbers: the glass bridge (its length a share of its size, its rise, its melt at the end, real s), the cone
 *  (radius and height at k 1), Weather Away's reach at k 1 (m), Bloom's mend reach, the storm cell's second cloud's offset (m). */
export const WORLD_ALTER = {
  glass: { long: 1.7, wide: 0.7, rise: 0.38, melt: 12, last: GAME_HOUR },
  cone: { r: 3.2, h: 3.4 },
  erode: { r: 3, last: GAME_HOUR, close: 3 },
  bloom: { mend: 6 },
  cell: { offset: 5 },
};

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), _p = new THREE.Vector3(), _q = new THREE.Quaternion();
const solidOnly = (g) => (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type;
const groundAt = (g, at) => g.physics.raycast(_p.copy(at).addScaledVector(UP, 0.6), DOWN, 30, g.player.collider, undefined, solidOnly(g))?.point ?? at.clone();
const drawOf = (g) => (g.worldDraw ||= new WorldDraw(g));

/** The row at its draw: taken at the trigger (`game.worldDraw.take`), its numbers scaled by k, `world` its k, feeling and point. Under
 *  DEBUG's shells lend: k 1, nothing taken. Dry: the round given back and null. */
export function worldRow(R, row, ctx) {
  if (row.tier !== 5) return row;
  const g = R.game, D = drawOf(g);
  if (g.lend?.has?.('shells')) return { ...row, world: { k: 1, feeling: null, at: D.aimOf(row, ctx), lent: true } };
  const w = D.take(row, ctx);
  if (w.dry) { if (R.shells?.counts) R.shells.counts[row.id] = (R.shells.counts[row.id] || 0) + 1; sfx.dryFire?.(); g.events?.emit('shell.dry', { id: row.id, by: 'courier' }); return null; }
  g.worldLooks?.draw?.(w, row);
  return { ...row, n: scaledN(row, w.k), world: { k: w.k, feeling: w.feeling, at: w.at } };
}

/** A made thing: a fixed body with one collider and its mesh (shellspacetime.js's, kept apart so the glass can melt). */
function madeThing(g, desc, at, quat, mesh) {
  const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(at.x, at.y, at.z).setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }));
  const col = g.physics.world.createCollider(desc.setCollisionGroups(GROUPS.static), body);
  mesh.position.copy(at); mesh.quaternion.copy(quat); mesh.userData.zoneFree = true; g.scene.add(mesh);
  const ent = { type: 'made', body, col, mesh, hits: 0, alive: true };
  g.physics.register(col, ent);
  ent.gone = () => { if (!ent.alive) return; ent.alive = false; g.physics.removeBody(body); g.scene.remove(mesh); mesh.geometry.dispose(); };
  return ent;
}

/** A cone of the island's matter stamped into the god hand's creations (it crumbles back as a creation does: godhand/creations.js). */
function raiseCone(g, at, r, h) {
  const C = g.creations; if (!C?.grid) return false;
  const sdf = (x, y, z) => { const d = Math.hypot(x - at.x, z - at.z), top = at.y + h * (1 - d / r); return Math.max(y - top, at.y - 0.6 - y, d - r); };
  C.grid.stamp(sdf, [at.x - r, at.y - 0.6, at.z - r, at.x + r, at.y + h, at.z + r]);
  for (const k of C.grid.takeDirty()) { C.queue.add(k); const c = C.grid.chunks.get(k); if (c) c.eaten = 0; }
  return true;
}

/** The cone as a body set down (under a roof, where the island's matter is not raised): clay, sinking back into the floor at its end. */
function coneBody(g, at, r, h) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14, 1, true).translate(0, h / 2, 0), new THREE.MeshStandardMaterial({ color: 0x8c4a33, roughness: 0.9, side: THREE.DoubleSide }));
  m.position.copy(at); m.userData.zoneFree = true; g.scene.add(m); return m;
}

/** Anything inside a closing box pushed out to its nearest free side (the rescue, counted: Player.guard's way). */
function pushOut(g, box) {
  const P = g.player, p = P?.pos; if (!p || !box.containsPoint(p)) return;
  const out = [['x', box.min.x - 0.6], ['x', box.max.x + 0.6], ['z', box.min.z - 0.6], ['z', box.max.z + 0.6]];
  const [ax, v] = out.reduce((a, b) => (Math.abs(p[b[0]] - b[1]) < Math.abs(p[a[0]] - a[1]) ? b : a));
  moveCourier(g, p.clone().setComponent(ax === 'x' ? 0 : 2, v), { stop: true });
  g.events?.emit('courier.rescue', { cause: 'erosion', by: 'environment' });
}

const FIRES = {
  // Glassmaker: a bridge of fused sand from where it lands, away from you, sized by the draw; it melts back to sand after a game hour
  glassmaker: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
    const g = R2.game, n = row.n, A = WORLD_ALTER.glass, gp = groundAt(g, at), away = gp.clone().sub(g.player.pos).setY(0).normalize();
    const L = n.size * A.long, W = n.size * A.wide, tilt = Math.atan2(A.rise * L, L) * 0.6;
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), away).multiply(_q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -tilt));
    const centre = gp.clone().addScaledVector(away, L * 0.48).setY(gp.y + Math.sin(tilt) * L * 0.5 - 0.04);
    const mesh = g.worldLooks?.glassBridge?.(W, L, row.world) ?? new THREE.Mesh(new THREE.BoxGeometry(W, 0.14, L), new THREE.MeshStandardMaterial({ color: 0x7fc4a0, roughness: 0.05, transparent: true, opacity: 0.6 }));
    const glass = madeThing(g, RAPIER.ColliderDesc.cuboid(W / 2, 0.07, L / 2), centre, quat, mesh);
    (R2.made ||= []).push(glass); sfx.shellHit?.(['world'], { tier: row.tier });
    R2.timed({ t: A.last, every: 0.1, tick: (e) => { const m = Math.max(0, 1 - e.left / A.melt); if (m > 0) g.worldLooks?.melt?.(mesh, m); }, end: () => { g.worldLooks?.sandAt?.(centre, W, L); glass.gone(); } });
  } } }),
  // Volcano: a real cone of the island's matter rises where it lands and erupts (the row's bombs, at the draw), then crumbles back
  volcano: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
    const g = R2.game, n = row.n, k = row.world?.k ?? 1, gp = groundAt(g, at), r = WORLD_ALTER.cone.r * Math.sqrt(k), h = WORLD_ALTER.cone.h * Math.sqrt(k);
    const open = (g.weather?.here?.(gp)?.exposure ?? 'open') === 'open'; // (the island's matter is raised only in the open: under a roof the cone is a body set down that sinks away)
    const raised = open && raiseCone(g, gp, r, h), body = raised ? null : coneBody(g, gp, r, h); g.fx?.shockwave?.(gp, r); R2.weigh(gp, 'volcano');
    const top = gp.clone().setY(gp.y + (raised ? h : 2.4)), haze = g.vfx?.play?.('caster.heatHaze', { pos: top });
    g.worldLooks?.vent?.(top, n.dur, row.world);
    R2.timed({ t: n.dur, every: n.every, field: 'pool', tier: row.tier, tick: () => {
      const c = foesNear(g, gp, 14)[0], dir = c ? _p.subVectors(c.pos, gp).setY(0) : _p.set(shellRand() - 0.5, 0, shellRand() - 0.5);
      const flat = dir.length(); dir.normalize();
      R2.launch('bomblet', row, top.clone().setY(top.y + 0.4), dir, { speed: Math.min(13, Math.max(2, flat * 0.9)), scale: 2.2 * Math.sqrt(k), col: 0xff7a2a });
    }, end: () => { haze?.stop?.(); if (body) R2.timed({ t: 4, every: 1 / 30, tick: (e) => { body.position.y = gp.y - h * (1 - e.left / 4); }, end: () => { body.removeFromParent(); body.geometry.dispose(); } }); } });
  } } }),
  // Golem: risen from the matter, its height and blow by the draw (the row's `h` and `power`, scaled); a ring of the ground thrown up
  golem: (R, row, ctx) => { BASE_FIRES.golem(R, row, ctx); },
  // Thunderhead: its strikes by the weather drawn; at the cap a storm cell, a second cloud working the fight
  thunderhead: (R, row, ctx) => {
    BASE_FIRES.thunderhead(R, row, ctx);
    if ((row.world?.k ?? 1) >= DRAW.cap - 0.05) R.timed({ delay: 0.75, t: 0.05, every: 1, tick: () => BASE_FIRES.thunderhead(R, row, ctx) });
    R.game.worldLooks?.storm?.(row.world?.at, row.n.dur, row.world);
  },
  // Calm: the dispel as before, and within the draw's reach the weather fair for a game hour
  calm: (R, row, ctx) => {
    BASE_FIRES.calm(R, row, ctx);
    const at = row.world?.at; if (!at) return;
    drawOf(R.game).fair(at, DRAW.r, GAME_HOUR); R.game.worldLooks?.fair?.(at, DRAW.r, GAME_HOUR);
  },
};

const LANDS_WORLD = {
  // Rift: takes its creature as before; then the hole stays a spring of liquid Lachryma for a game hour
  rift: (R, row, at, ...rest) => {
    BASE_LANDS.rift(R, row, at, ...rest);
    if (!row.world) return;
    const gp = groundAt(R.game, at), s = drawOf(R.game).spring(gp, GAME_HOUR);
    R.game.worldLooks?.spring?.(s);
  },
  // Upfall: as before, and the ground's loose matter rises with it (sand, and the paint it drew as drops)
  upfall: (R, row, at, ...rest) => { BASE_LANDS.upfall(R, row, at, ...rest); R.game.worldLooks?.lift?.(at, row.n.r, row.n.dur, row.world); },
  // Weather Away: as before on a body; and things tagged erodible within reach soften and let you through, closing after a game hour
  weatherAway: (R, row, at, ...rest) => {
    BASE_LANDS.weatherAway(R, row, at, ...rest);
    if (!row.world) return;
    const g = R.game, A = WORLD_ALTER.erode, reach = A.r * (row.world.k ?? 1);
    for (const ent of registered('erodible')) {
      const box = ent.box || (ent.mesh && new THREE.Box3().setFromObject(ent.mesh)); if (!box || ent.eroded) continue;
      if (box.distanceToPoint(at) > reach) continue;
      const cols = ent.colliders || (ent.collider ? [ent.collider] : []); ent.eroded = true;
      for (const c of cols) c.setSensor?.(true);
      g.worldLooks?.erode?.(ent, A.last);
      g.events?.emit('shell.erode', { at: [at.x, at.y, at.z], by: 'courier' });
      R.timed({ t: A.last, every: 1, end: () => { for (const c of cols) c.setSensor?.(false); pushOut(g, box); ent.eroded = false; g.worldLooks?.erode?.(ent, 0); } });
    }
  },
  // Bloom: as before on the creatures, and a thicket grows from the drawn Lachryma; pots in reach are mended in gold
  bloom: (R, row, at, ...rest) => {
    BASE_LANDS.bloom(R, row, at, ...rest);
    if (!row.world) return;
    const g = R.game; g.worldLooks?.thicket?.(groundAt(g, at), row.n.r, GAME_HOUR, row.world);
    const mended = g.breakables?.mend?.(at, WORLD_ALTER.bloom.mend, { gold: true, by: 'courier' }) ?? 0; // (a broken pot whole again, its joins gold)
    if (mended) g.events?.emit('shell.mend', { n: mended, by: 'courier' });
  },
};

/** The part (shellrunner.js PARTS): the nine's fires wrapped with their draw, and the four that land, with their alterations. */
export const WORLD = {
  fires: Object.fromEntries(WORLD_IDS.map((id) => [id, (R, row, ctx) => {
    const r2 = worldRow(R, row, ctx); if (!r2) return;
    const own = FIRES[id]; if (own) return own(R, r2, ctx);
    R.launch(['lob', 'deploy', 'call'].includes(r2.carrier) || r2.lob ? 'lob' : 'bolt', r2, ctx.muzzle, ctx.ray.dir); // (as the runner flies one)
  }])),
  lands: LANDS_WORLD,
  tick(R, dt) { drawOf(R.game).update(dt); },
  clear(R) { R.game.worldDraw?.clear(); },
};
