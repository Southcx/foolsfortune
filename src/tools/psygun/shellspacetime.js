// ---------------------------------------------------------------------------------------
// THE SHELLS OF SPACE AND TIME (CASTER-SHELLS.md section 1: M5 the portal pair, M6 a local time scale in a zone, M10 the call from the
// sky, M12 made things; TYPE-15, 22, 26, 30, 39, 43, 44, 51, 52, 57, 58): a part of the shell runner (tools/psygun/shellrunner.js).
// A ZONE is a sphere where a rule about time holds while it lasts: in Stasis everything stops (creatures held, loose things and shots
// hanging in the air), in a Slow Field it moves at a quarter speed, in Stop-Motion it moves in steps on the beat (and a blow on the beat
// lands double). A CALL marks a spot and something falls on it after a beat (Meteor, Slag Rain). A MADE THING is static geometry
// spawned where the shell lands and taken away when its time is up or it breaks (Glassmaker's glass, Lodestone's magnet). A RIFT takes
// a creature out of the world and drops it from above; a PORTAL PAIR (Calissa's S5) passes the Courier and creatures through.
//
// Prior art: Ratchet & Clank's Rift Inducer and the portal gun's pair (Portal, Valve, 2007); Super Mario Galaxy's and Braid's local
// time (a bubble where time runs differently, not the global hold); Ratchet's Lava Gun to Meteor Gun (the call); Halo's Forge and
// Splatoon's sprinkler-and-wall (a thing made where a shot lands, gone when it breaks). Glassmaker teaches a real thing: sand and heat
// make glass.
//
//   SPACETIME (a runner part)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { Portal } from '../../vfx/caster/portal.js';
import { foesNear, blast } from './shellpayloads.js';
import { centerOf, isBoss, stash, unstash, moveCourier, shellRand, projPos, setProjVel } from './shellkit.js';
import { scaleFor } from './shellbodies.js';

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), _v = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion();
const solidOnly = (g) => (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type;
const aimPoint = (g, ray, range = 60) => g.physics.raycast(ray.origin, ray.dir, range, g.player.collider, undefined, (k) => !k.isSensor());
const groundAt = (g, at) => g.physics.raycast(_p.copy(at).addScaledVector(UP, 0.6), DOWN, 30, g.player.collider, undefined, solidOnly(g))?.point ?? at.clone();

/** A made thing: a fixed body with one collider, solid to the Courier and the world, and its mesh; `gone()` takes both away. */
function madeThing(g, desc, at, quat, mesh) {
  const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(at.x, at.y, at.z).setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }));
  const col = g.physics.world.createCollider(desc.setCollisionGroups(GROUPS.static), body);
  mesh.position.copy(at); mesh.quaternion.copy(quat); mesh.userData.zoneFree = true; g.scene.add(mesh);
  const ent = { type: 'made', body, mesh, hits: 0, alive: true };
  g.physics.register(col, ent);
  ent.gone = () => { if (!ent.alive) return; ent.alive = false; g.physics.removeBody(body); g.scene.remove(mesh); mesh.geometry.dispose(); };
  return ent;
}

/** A creature dropped back in from `h` m above where it went (a Rift's, a Leyline's), struck as it lands. */
export function dropBack(R, c, at, h, power = 1) {
  const g = R.game, gp = groundAt(g, at); let y = gp.y + h, vy = 0;
  if (c.root) { c.root.visible = true; c.root.position.set(gp.x, y, gp.z); }
  R.timed({ t: 4, every: 1 / 30, tick: (e) => {
    vy += 9.81 * e.every; y -= vy * e.every;
    if (y <= gp.y) { e.left = 0; return; }
    c.pos.set(gp.x, y, gp.z); c.root?.position.copy(c.pos);
  }, end: () => { unstash(g, c, gp); if (c.alive) g.creatures.strike(c, centerOf(c), DOWN.clone(), power, 'explosion', 'courier', null, 'impact'); g.fx?.shockwave?.(gp, 1.5); } });
}

/** A zone where time runs differently (M6), for `dur`: `mode` 'stop' (Stasis), 'slow' (a Slow Field) or 'step' (Stop-Motion). */
function zone(R, row, at, mode) {
  const g = R.game, n = row.n, r = n.r, held = new Map();
  const looks = mode === 'stop' ? [g.vfx?.play?.('shell.stasis', { pos: at, scale: r / 2.6 }), g.vfx?.play?.('caster.bubble.stasis', { pos: at, scale: r / 2 })]
    : mode === 'step' ? [g.vfx?.play?.('shell.stopMotion', { pos: at, scale: r / 4 })]
    : [g.vfx?.play?.('shell.stasis', { pos: at, scale: r / 2.6, power: 0.5 }), g.vfx?.play?.('caster.bubble.stasis', { pos: at, scale: r / 2 })];
  const period = 0.5;
  R.timed({ t: n.dur, every: 1 / 30, field: 'zone', tier: row.tier, tick: (e) => {
    const phase = (e.age % period) / period, still = mode === 'stop' || (mode === 'step' && phase < 0.8);
    for (const c of foesNear(g, at, r)) {
      if (mode === 'slow') g.creatures.apply(c, 'slow', 0.2, 1);
      else if (still) g.creatures.apply(c, 'halt', 0.2, 1);
      else { g.creatures.clearStatus?.(c, 'halt'); g.creatures.apply(c, 'soft', 0.1, 1); } // (Stop-Motion's step: a blow on the beat lands double)
    }
    g.physics.world.forEachRigidBody((b) => {
      if (!b.isDynamic()) return; const t = b.translation();
      const inside = _v.set(t.x - at.x, t.y - at.y, t.z - at.z).length() < r;
      if (inside && !held.has(b.handle)) { held.set(b.handle, b); }
      if (!inside && held.has(b.handle)) { held.delete(b.handle); b.setGravityScale(1, true); return; }
      if (!inside) return;
      if (mode === 'slow') { const v = b.linvel(); b.setLinvel({ x: v.x * 0.92, y: v.y * 0.92, z: v.z * 0.92 }, true); b.setGravityScale(0.25, true); }
      else if (still) { b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true); b.setGravityScale(0, true); }
      else b.setGravityScale(1, true);
    });
    for (const pr of g.projectiles || []) if (projPos(pr, _p).distanceTo(at) < r) {
      if (mode === 'slow') { pr.slowed ||= true; } else if (still) setProjVel(pr, _v.set(0, 0, 0));
    }
  }, end: () => { for (const b of held.values()) if (b.isValid?.() !== false) b.setGravityScale(1, true); looks.forEach((h) => h?.stop?.()); } });
}

/** A meteor's landing: its blast, its hot pool, the sound, the world's answer and its weight. */
function meteorLands(R, at, m, weight) {
  blast(R, at, m.r, m.power, 'explosion'); R.game.paintmap?.slick?.(at.x, at.y, at.z, m.r * 0.6, 1); sfx.explosion?.(R.game.listenerDistance?.(at)); R.game.onExplosion?.(at, m.r);
  R.weigh(at, weight); return true;
}

export const SPACETIME = {
  carrier: {
    meteor: { speed: 28, lift: 0, grav: 1, life: 4, r: 0.4 },
    mega: { speed: 40, lift: 0, grav: 1, life: 5, r: 0.4 }, // (the Meteor's mega meteor: its own kind, so its look is its own: Calissa's `kinds.mega`)
    slag: { speed: 10, lift: 0, grav: 1, life: 3, r: 0.12 },
  },
  hit: {
    meteor: (R, p, k) => meteorLands(R, k.at, p.row.n, 'meteor'),
    mega: (R, p, k) => meteorLands(R, k.at, p.mega, 'meteor.mega'), // (its own numbers: the row's `n.mega`, buffed as it fell)
    slag: (R, p, k) => { blast(R, k.at, 0.9, p.row.n.power, 'explosion'); return true; },
  },
  fires: {
    // Piercer: a rail through every creature and through walls up to `wall` m thick; the line hangs as a glass tube for `dur`
    piercer: (R, row, { ray, muzzle }) => {
      const g = R.game, n = row.n, dir = ray.dir.clone(); let from = ray.origin.clone(), left = 120, walls = 0;
      const struck = new Set();
      while (left > 0 && walls < 4) {
        const hit = g.physics.raycast(from, dir, left, g.player.collider, undefined, solidOnly(g));
        const len = hit ? hit.distance : left;
        for (let s = 0; s < len; s += 1.5) for (const c of foesNear(g, _v.copy(from).addScaledVector(dir, s), 1.6)) {
          if (struck.has(c)) continue; struck.add(c);
          g.creatures.strike(c, centerOf(c), dir.clone(), n.power, 'shot', 'courier', null, n.type);
        }
        if (!hit) { from.addScaledVector(dir, len); break; }
        // through the wall, if it is thin enough: the far face found from the far side
        const far = hit.point.clone().addScaledVector(dir, n.wall), back = g.physics.raycast(far, dir.clone().negate(), n.wall, g.player.collider, undefined, solidOnly(g));
        if (!back || back.distance < 0.02) { from = hit.point.clone(); break; }
        from = far.addScaledVector(dir, -back.distance).addScaledVector(dir, 0.05); left -= len + (n.wall - back.distance); walls++;
      }
      g.fx?.tracer?.(muzzle, from);
      g.vfx?.play?.('caster.heatHaze.tube', { pos: muzzle, from: muzzle.clone(), to: from.clone(), dir });
      if (struck.size) { sfx.shellHit?.(row.payloads, { tier: row.tier, type: n.type }); g.hud?.hitmarker?.(false); }
    },
    // Meteor: mark a spot; `count` molten meteors `size` times as big fall on it `delay` later and leave hot pools; then, `mega.delay` after
    // them, one mega meteor (the owner, 2026-10-13: the three 200% bigger, then a mega one 500%)
    meteor: (R, row, { ray }) => {
      const g = R.game, n = row.n, at = aimPoint(g, ray, 80)?.point ?? ray.origin.clone().addScaledVector(ray.dir, 30);
      g.vfx?.play?.('shell.land', { pos: at, scale: 3 }); sfx.shellFall?.(n.delay, row.tier);
      R.timed({ delay: n.delay, t: 0.05, every: 1, tick: () => {
        const size = n.size ?? 1, C = SPACETIME.carrier.meteor; // (drawn at `size` by its look; struck at it here)
        for (let i = 0; i < n.count; i++) { const o = new THREE.Vector3((shellRand() - 0.5) * 4 * size, 24 + i * 3 + 4 * size, (shellRand() - 0.5) * 4 * size); R.launch('meteor', row, at.clone().add(o), new THREE.Vector3(-o.x * 0.02, -1, -o.z * 0.02).normalize(), { scale: 4, col: 0xff7a2a, extra: { C: { ...C, r: C.r * size } } }); }
      } });
      if (!n.mega) return;
      const B = T.shells.buff, M = n.mega, mega = { r: M.r * B.reach, power: M.power * B.power };
      R.timed({ delay: n.delay + M.delay, t: 0.05, every: 1, tick: () => {
        const C = SPACETIME.carrier.mega;
        R.launch('mega', row, at.clone().setY(at.y + 40), DOWN.clone(), { scale: 4, col: 0xff5a1a, extra: { mega, C: { ...C, r: C.r * M.size } } });
        sfx.shellFall?.(1, row.tier);
      } });
    },
    // Slag Rain: hot drops thrown up fall for `dur` in a ring of r
    slagRain: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      const n = row.n;
      R2.timed({ t: n.dur, every: 0.12, field: 'cloud', tier: row.tier, tick: () => { const a = shellRand() * Math.PI * 2, r = n.r * Math.sqrt(shellRand()); R2.launch('slag', row, at.clone().add(_v.set(Math.cos(a) * r, 8, Math.sin(a) * r)), DOWN, { scale: 1.2, col: 0xff9a4a }); } });
    } } }),
    // Glassmaker: where it lands, the sand fuses into a ramp of glass that holds you; struck `breaks` times, it breaks
    glassmaker: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      const g = R2.game, n = row.n, gp = groundAt(g, at), away = gp.clone().sub(g.player.pos).setY(0).normalize();
      const tilt = 0.32, quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), away).multiply(_q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -tilt));
      const centre = gp.clone().addScaledVector(away, n.size * 0.45).setY(gp.y + Math.sin(tilt) * n.size * 0.5 - 0.05);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(n.size * 0.8, 0.12, n.size), new THREE.MeshStandardMaterial({ color: 0x7fc4a0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 }));
      const glass = madeThing(g, RAPIER.ColliderDesc.cuboid(n.size * 0.4, 0.06, n.size / 2), centre, quat, mesh);
      glass.breaks = n.breaks; (R2.made ||= []).push(glass);
      sfx.shellHit?.(['world'], { tier: row.tier });
      R2.timed({ t: 40, every: 40, end: () => glass.gone() });
    } } }),
    // Lodestone: a magnet set in mid-air or on a wall: a point the Sondelass's hook can bite, anywhere, for `dur`
    lodestone: (R, row, { ray, muzzle }) => {
      const g = R.game, n = row.n, hit = aimPoint(g, ray, 30);
      const at = hit ? hit.point.clone().addScaledVector(hit.normal, 0.6) : ray.origin.clone().addScaledVector(ray.dir, 20);
      g.fx?.tracer?.(muzzle, at);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), R.mat(0x5a5f6a));
      const mag = madeThing(g, RAPIER.ColliderDesc.ball(0.25), at, new THREE.Quaternion(), star);
      R.timed({ t: n.dur, every: 1 / 20, tick: () => { star.rotation.y += 0.08; }, end: () => mag.gone() });
    },
    // Portal: fire two: a linked pair of rifts that the Courier and creatures pass through, for `dur`
    portal: (R, row, { ray, muzzle }) => {
      const g = R.game, n = row.n, hit = aimPoint(g, ray, 80); if (!hit) return;
      g.fx?.tracer?.(muzzle, hit.point);
      const P = new Portal({ mode: 'portal', liveHz: 2, tint: 0xb49be6 }), at = hit.point.clone().addScaledVector(hit.normal, 0.05);
      P.object.position.copy(at); P.object.lookAt(at.clone().add(hit.normal)); P.object.userData.zoneFree = true; g.scene.add(P.object);
      const end = { P, at, normal: hit.normal.clone() };
      if (R.portals?.length === 2) { R.portals.forEach((x) => x.P.dispose()); R.portals = null; }
      if (R.portals?.length === 1) { R.portals.push(end); R.portals[0].P.link(P); R.portalLeft = n.dur; R.portals.forEach((x) => x.P.refresh(g.post?.r, g.scene)); }
      else { R.portals = [end]; R.portalLeft = n.dur; }
      R.portalCool = 0.5;
    },
  },
  lands: {
    // Rift: a rift opens under the nearest creature and takes it for `dur`, then drops it from `drop` m above
    rift: (R, row, at) => {
      const g = R.game, n = row.n, c = foesNear(g, at, 2.8)[0];
      g.vfx?.play?.('caster.rift', { pos: groundAt(g, at) });
      if (!c) return;
      if (isBoss(c)) { g.creatures.strike(c, centerOf(c), DOWN.clone(), 10, 'shot', 'courier', null, 'impact'); return; }
      const where = c.pos.clone(); stash(g, c);
      R.timed({ delay: n.dur, t: 0.05, every: 1, tick: () => dropBack(R, c, where, n.drop, 1.5) });
    },
    stasis: (R, row, at) => zone(R, row, at, 'stop'),
    slowField: (R, row, at) => zone(R, row, at, 'slow'),
    stopMotion: (R, row, at) => zone(R, row, at, 'step'),
    // Bloom: in r, a slip jelly becomes a small slipling (calm, half its size, for a while) and what was cast on it is lifted
    bloom: (R, row, at) => {
      const g = R.game, n = row.n;
      for (const c of foesNear(g, at, n.r)) {
        for (const s of ['doubt', 'charm', 'blind', 'confusion', 'stun']) g.creatures.clearStatus?.(c, s);
        if (isBoss(c)) continue;
        g.creatures.apply(c, 'calm', 20, 1); scaleFor(R, c, 0.55, 0.55, 30, { reach: true });
      }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.fx?.absorbSparkle?.(at.clone().add(_v.set(Math.cos(a) * n.r * 0.6, 0.3, Math.sin(a) * n.r * 0.6))); }
    },
  },
  tick: (R, dt) => {
    const g = R.game, pp = R.portals;
    if (pp && (R.portalLeft -= dt) <= 0) { pp.forEach((x) => x.P.dispose()); R.portals = null; return; }
    if (pp?.length !== 2) return;
    R.portalCool -= dt;
    const P = g.player;
    for (let i = 0; i < 2; i++) {
      const a = pp[i], b = pp[1 - i];
      if (R.portalCool <= 0 && P && P.pos.clone().setY(P.pos.y + 0.9).distanceTo(a.at) < 1.1) {
        const to = b.at.clone().addScaledVector(b.normal, 1.1); if (b.normal.y < 0.5) to.y = b.at.y - 1; else to.y = b.at.y + 0.1;
        moveCourier(g, to); R.portalCool = 1; sfx.shellHit?.(['space'], { tier: 3 }); break;
      }
      for (const c of foesNear(g, a.at, 1.4)) if (!isBoss(c) && !(c.portalCool > 0)) {
        c.portalCool = 2; const to = b.at.clone().addScaledVector(b.normal, 1.3).setY(b.normal.y < 0.5 ? b.at.y - 1 : b.at.y);
        if (g.jellies && c.kind === 'slipjelly') g.jellies.place(c, to); else c.pos.copy(to);
      }
    }
    for (const c of foesNear(g, pp[0].at, 60)) if (c.portalCool > 0) c.portalCool -= dt;
  },
  frame: (R, dt) => { for (const x of R.portals || []) x.P.update(dt, R.game.post?.r, R.game.scene); },
  // a made thing struck by a plain shot cracks; struck enough, it breaks
  onShot: (R, e) => {
    const m = e?.ent; if (m?.type !== 'made' || !m.alive || !m.breaks) return;
    if (++m.hits >= m.breaks) { m.gone(); R.game.fx?.impact?.(e.at, UP, { sparks: 10, dust: 8 }); sfx.shellHit?.(['world'], { tier: 2 }); }
  },
  clear: (R) => { for (const x of R.portals || []) x.P.dispose(); R.portals = null; for (const m of R.made || []) m.gone(); R.made = []; },
};
