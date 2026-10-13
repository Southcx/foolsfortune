// ---------------------------------------------------------------------------------------
// THE SHELLS THAT SET THINGS DOWN, AND THE COMPANY (CASTER-SHELLS.md section 1: M4 deployables with a lifetime; TYPE-29, 48, 63, 71,
// 73, 74, 76 to 79): a part of the shell runner (tools/psygun/shellrunner.js). Each is a body set down where its round lands (or round
// the Courier) that does its one thing on a clock and is gone when its time is up: a volcano throwing bombs, a turret, a wall of hard
// light that throws back what it can parry, a dome, a ring of mines, a hologram that runs, little clay servants and a golem that march
// on the nearest creature (never a sibling or a spirit: the owner, 2026-10-12), drones round the Courier, a moon that catches shots.
//
// Prior art: Ratchet & Clank's Mini-Turret Glove, Holoshield Glove, Mine Glove, Decoy Glove, Drone Device, Synthenoids, the Lava Gun's
// ground; Destiny's Titan barricade (a wall that holds a while); Mega Man's Leaf Shield (the orbit that catches); the shabti of Egypt,
// little clay servants that answer for you.
//
//   DEPLOYABLES (a runner part)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { foesNear, blast } from './shellpayloads.js';
import { centerOf, shellRand, projPos, projVel, setProjVel, takeProj } from './shellkit.js';

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _p = new THREE.Vector3();

/** The ground under a point (the world's static shapes only), or the point. */
const groundAt = (g, at, up = 0.6, down = 6) => g.physics.raycast(_p.copy(at).addScaledVector(UP, up), DOWN, up + down, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type)?.point ?? null;
/** A body set down: lit meshes in a group, in the scene. */
function setDown(R, parts, at) {
  const grp = new THREE.Group(); for (const p of parts) grp.add(p);
  grp.position.copy(at); grp.userData.zoneFree = true; R.game.scene.add(grp);
  return grp;
}
const mesh = (R, geo, col) => new THREE.Mesh(geo, R.mat(col));
/** A line of sight from a point to a creature (nothing static between). */
const sees = (g, from, c) => { const to = centerOf(c, _w), d = to.distanceTo(from); return !g.physics.raycast(from, to.clone().sub(from).normalize(), d - c.radius, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type); };
/** A shot from a thing set down at a creature: its tracer and its blow. */
function shoot(R, from, c, power) {
  const g = R.game, to = centerOf(c);
  g.fx?.tracer?.(from, to);
  g.creatures.strike(c, to, to.clone().sub(from).normalize(), power, 'shot', 'courier', null, 'impact');
}

/** A marcher: a little body that walks on the ground at the nearest creature and strikes it (Shabti, Golem). */
function march(R, row, at, { scale = 1, col = 0x2a6fb0, power = 1, speed = 3, reach = 1.2, life = 20, every = 1 } = {}) {
  const g = R.game, body = mesh(R, new THREE.CylinderGeometry(0.14, 0.18, 0.5, 6).translate(0, 0.25, 0), col), head = mesh(R, new THREE.SphereGeometry(0.13, 8, 6).translate(0, 0.62, 0), col);
  const grp = setDown(R, [body, head], at); grp.scale.setScalar(scale);
  const m = { grp, cool: 0 };
  R.timed({ t: life, every: 1 / 30, tick: (e) => {
    const dt = e.every; m.cool -= dt;
    const foe = foesNear(g, grp.position, 22)[0];
    const to = foe ? foe.pos : g.player.pos;
    _v.subVectors(to, grp.position).setY(0); const d = _v.length(), stop = foe ? foe.radius + reach * scale * 0.6 : 2.5;
    if (d > stop) { grp.position.addScaledVector(_v.normalize(), Math.min(d - stop, speed * dt)); grp.rotation.y = Math.atan2(_v.x, _v.z); }
    const gy = groundAt(g, grp.position, 0.8, 3); if (gy) grp.position.y = gy.y;
    grp.position.y += Math.abs(Math.sin(e.age * 12)) * 0.04 * scale; // (a waddle)
    if (foe && d <= stop + 0.3 && m.cool <= 0) { m.cool = every; g.creatures.strike(foe, centerOf(foe), _w.subVectors(foe.pos, grp.position).setY(0.3).normalize().clone(), power, 'blow', 'courier'); if (scale > 2) foe.knock?.(_w.multiplyScalar(4)); }
  }, end: () => g.scene.remove(grp) });
}

export const DEPLOYABLES = {
  carrier: { bomblet: { speed: 9, lift: 7, grav: 1, life: 3, r: 0.2 } },
  hit: { bomblet: (R, p, k) => { blast(R, k.at, 2, p.row.n.power, 'explosion'); R.game.paintmap?.slick?.(k.at.x, k.at.y, k.at.z, 1, 0.6); if (p.row.id === 'volcano') R.weigh(k.at, 'volcano.bomb'); return true; } },
  expire: { bomblet: (R, p) => blast(R, p.pos, 2, p.row.n.power, 'explosion') },
  fires: {
    // Volcano: a cone of clay rises where it lands and throws a molten bomb every second for `dur`
    volcano: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      const g = R2.game, n = row.n, gp = groundAt(g, at) ?? at;
      const cone = setDown(R2, [mesh(R2, new THREE.ConeGeometry(2.2, 2.4, 9, 1, true).translate(0, 1.2, 0), 0x8c4a33)], gp);
      const haze = g.vfx?.play?.('caster.heatHaze', { pos: gp.clone().setY(gp.y + 2.4) }); R2.weigh(gp, 'volcano');
      R2.timed({ t: n.dur, every: n.every, field: 'pool', tier: row.tier, tick: () => {
        const c = foesNear(g, gp, 12)[0];
        const dir = c ? _v.subVectors(c.pos, gp).setY(0) : _v.set(shellRand() - 0.5, 0, shellRand() - 0.5);
        const flat = dir.length(); dir.normalize();
        R2.launch('bomblet', row, gp.clone().setY(gp.y + 2.5), dir, { speed: Math.min(12, Math.max(2, flat * 0.9)), scale: 2, col: 0xff7a2a });
        cone.scale.y = 1.15;
      }, end: () => { g.scene.remove(cone); haze?.stop?.(); } });
      R2.timed({ t: n.dur, every: 1 / 20, tick: () => { cone.scale.y += (1 - cone.scale.y) * 0.2; } });
    } } }),
    // Turret: a squat terracotta turret that shoots the nearest creature it can see for `dur`
    turret: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      const g = R2.game, n = row.n, gp = groundAt(g, at) ?? at;
      const t = setDown(R2, [mesh(R2, new THREE.CylinderGeometry(0.3, 0.4, 0.55, 8).translate(0, 0.27, 0), 0xb4603f), mesh(R2, new THREE.SphereGeometry(0.24, 8, 6).translate(0, 0.62, 0), 0xc46a45)], gp);
      const eye = gp.clone().setY(gp.y + 0.7);
      R2.timed({ t: n.dur, every: n.every, tick: () => {
        const c = foesNear(g, eye, 18).find((x) => sees(g, eye, x)); if (!c) return;
        t.rotation.y = Math.atan2(c.pos.x - eye.x, c.pos.z - eye.z);
        shoot(R2, eye, c, n.power); sfx.gunshot?.();
      }, end: () => g.scene.remove(t) });
    } } }),
    // Holowall: a wall of hard light across the aim; it throws back any projectile that reaches it
    holowall: (R, row, { ray }) => {
      const g = R.game, n = row.n, P = g.player;
      const flat = ray.dir.clone().setY(0).normalize(), at = P.pos.clone().addScaledVector(flat, 3);
      const gp = groundAt(g, at, 1.5, 4) ?? at;
      const look = g.vfx?.play?.('shell.holowall', { pos: gp.clone().setY(gp.y + n.h / 2), dir: flat, normal: flat, scale: n.w / 4 });
      const bub = g.vfx?.play?.('caster.bubble.wall', { pos: gp.clone().setY(gp.y + n.h / 2), dir: flat, normal: flat, tint: 0x9fd8ff });
      const side = new THREE.Vector3(flat.z, 0, -flat.x);
      R.timed({ t: n.dur, every: 1 / 30, field: 'wall', tier: row.tier, tick: () => {
        for (const pr of [...(g.projectiles || [])]) {
          const q = projPos(pr, _p).sub(gp), along = q.dot(side), across = q.dot(flat);
          if (Math.abs(along) > n.w / 2 || q.y < 0 || q.y > n.h || Math.abs(across) > 0.5) continue;
          const v = projVel(pr, _v); if (v.dot(flat) > 0) continue; // (only what comes at the wall from the far side)
          setProjVel(pr, v.reflect(flat).multiplyScalar(1.2)); pr.reflected = true; pr.parried = true; pr.mark?.clear?.(); pr.mark = null;
          sfx.parry?.();
        }
      }, end: () => { look?.stop?.(); bub?.stop?.(); } });
    },
    // Barrier: a dome round the Courier for `dur`: nothing gets through it, and what touches it is shocked
    barrier: (R, row) => {
      const g = R.game, n = row.n, P = g.player;
      const dome = g.vfx?.play?.('caster.bubble.barrier', { pos: P.pos, follow: (h) => (h.pos.copy(P.pos), true) });
      R.timed({ t: n.dur, every: 1 / 20, field: 'dome', tier: row.tier, tick: (e) => {
        P.invuln = Math.max(P.invuln || 0, 0.1);
        for (const pr of [...(g.projectiles || [])]) if (projPos(pr, _p).distanceTo(P.pos) < n.r + 0.3) takeProj(g, pr);
        if (Math.round(e.age * 20) % 10) return;
        for (const c of foesNear(g, P.pos, n.r + 0.6)) { const out = _v.subVectors(c.pos, P.pos).setY(0).normalize(); g.creatures.strike(c, centerOf(c), out.clone(), n.power, 'shot', 'courier', null, 'impact'); c.knock?.(out.multiplyScalar(5)); }
      }, end: () => dome?.stop?.() });
    },
    // Minefield: six mines in a ring; each arms after `arm` and bursts when a creature comes within r
    minefield: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      const g = R2.game, n = row.n, mines = [];
      for (let i = 0; i < n.count; i++) {
        const a = (i / n.count) * Math.PI * 2, gp = groundAt(g, _w.set(at.x + Math.cos(a) * 2.5, at.y, at.z + Math.sin(a) * 2.5)) ?? at.clone();
        mines.push({ m: setDown(R2, [mesh(R2, new THREE.SphereGeometry(0.16, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0xd9b048)], gp), live: true });
      }
      R2.timed({ t: n.dur, every: 0.1, tick: (e) => {
        for (const M of mines) {
          if (!M.live) continue;
          const near = foesNear(g, M.m.position, n.r)[0];
          M.m.visible = e.age < n.arm || Math.sin(e.age * (near ? 40 : 8)) > -0.2;
          if (e.age >= n.arm && near) { M.live = false; g.scene.remove(M.m); blast(R2, M.m.position.clone().setY(M.m.position.y + 0.3), 2, n.power, 'explosion'); sfx.explosion?.(g.listenerDistance?.(M.m.position)); }
        }
      }, end: () => mines.forEach((M) => g.scene.remove(M.m)) });
    } } }),
    // Double: a hologram of the Courier that runs and ducks; creatures take it for them (game.ai.decoys)
    double: (R, row, { ray }) => {
      const g = R.game, n = row.n, P = g.player;
      const grp = setDown(R, [mesh(R, new THREE.CapsuleGeometry(0.28, 0.9, 4, 8).translate(0, 0.75, 0), 0x8fd0ff)], P.pos.clone().addScaledVector(ray.dir.clone().setY(0).normalize(), 1.5));
      const d = { type: 'player', kind: 'courier', decoy: true, pos: grp.position, vel: new THREE.Vector3(), alive: true, loud: 1.6, height: 1.7, struck: () => { d.alive = false; } };
      g.ai?.decoys.push(d);
      let run = new THREE.Vector3(), turn = 0;
      R.timed({ t: n.dur, every: 1 / 30, tick: (e) => {
        if (!d.alive) { e.left = 0; return; }
        if ((turn -= e.every) <= 0) { turn = 1.2; const a = shellRand() * Math.PI * 2; run.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(4); }
        grp.position.addScaledVector(run, e.every); const gy = groundAt(g, grp.position, 1, 3); if (gy) grp.position.y = gy.y;
        grp.rotation.y = Math.atan2(run.x, run.z); grp.visible = Math.sin(e.age * 50) > -0.85; // (a flicker as it turns)
        d.vel.copy(run);
      }, end: () => { d.alive = false; g.scene.remove(grp); const j = g.ai?.decoys.indexOf(d); if (j >= 0) g.ai.decoys.splice(j, 1); } });
    },
    // Shabti: three little clay servants climb out and fight for `dur`
    shabti: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      for (let i = 0; i < row.n.count; i++) { const a = (i / row.n.count) * Math.PI * 2; march(R2, row, (groundAt(R2.game, at) ?? at).clone().add(_w.set(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6)), { power: row.n.power, life: row.n.dur, col: 0x2a6fb0 }); }
    } } }),
    // Golem: a 3 m golem rises from the ground and fights for `dur`
    golem: (R, row, { muzzle, ray }) => R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
      march(R2, row, groundAt(R2.game, at) ?? at, { scale: row.n.h / 0.75, power: row.n.power, speed: 2.2, reach: 1.2, life: row.n.dur, every: 1.4, col: 0x8c4a33 });
      R2.game.fx?.shockwave?.(at, 2);
    } } }),
    // Drone Halo: three drones orbit the Courier and shoot what they aim at (the foe nearest the aim) for `dur`
    droneHalo: (R, row, { camera }) => {
      const g = R.game, n = row.n, P = g.player, drones = [];
      for (let i = 0; i < n.count; i++) drones.push(setDown(R, [mesh(R, new THREE.SphereGeometry(0.16, 8, 6), 0xc46a45), mesh(R, new THREE.CircleGeometry(0.08, 8).translate(0, 0, 0.161), 0xffb27a)], P.pos));
      let cool = 0;
      R.timed({ t: n.dur, every: 1 / 30, tick: (e) => {
        drones.forEach((d, i) => { const a = e.age * 2 + (i / n.count) * Math.PI * 2; d.position.set(P.pos.x + Math.cos(a) * 1.1, P.pos.y + 2 + Math.sin(e.age * 3 + i) * 0.1, P.pos.z + Math.sin(a) * 1.1); });
        if ((cool -= e.every) > 0) return; cool = 0.6;
        const aim = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const foes = foesNear(g, P.pos, 25).filter((c) => _v.subVectors(c.pos, P.pos).normalize().dot(aim) > 0.85);
        const c = foes[0] || foesNear(g, P.pos, 12)[0]; if (!c) return;
        for (const d of drones) { d.lookAt(centerOf(c, _w)); if (sees(g, d.position, c)) shoot(R, d.position.clone(), c, n.power); }
      }, end: () => drones.forEach((d) => g.scene.remove(d)) });
    },
    // Moonlet: a little moon orbits the Courier; projectiles that come near are caught, and thrown back with the next shot
    moonlet: (R, row) => {
      const g = R.game, n = row.n, P = g.player;
      const moon = setDown(R, [mesh(R, new THREE.IcosahedronGeometry(0.32, 1), 0x9a948a)], P.pos);
      R.moonlet = { caught: 0, max: n.holds };
      R.timed({ t: n.dur, every: 1 / 30, tick: (e) => {
        const a = e.age * 2.4; moon.position.set(P.pos.x + Math.cos(a) * n.r, P.pos.y + 1.4, P.pos.z + Math.sin(a) * n.r); moon.rotation.y += 0.05;
        for (const pr of [...(g.projectiles || [])]) if (R.moonlet.caught < n.holds && projPos(pr, _p).distanceTo(moon.position) < 1.2) { takeProj(g, pr); R.moonlet.caught++; sfx.gulp?.(0); }
      }, end: () => { g.scene.remove(moon); R.moonlet = null; } });
    },
  },
  // the Moonlet's catch, thrown back with the next plain shot: at what it hit, or the foe nearest where it went
  onShot: (R, e) => {
    const M = R.moonlet; if (!M?.caught || !e?.at) return;
    const g = R.game, c = (e.ent && e.ent.alive && !e.ent.ally && e.ent.type === 'creature') ? e.ent : foesNear(g, e.at, 4)[0];
    if (!c) return;
    for (let i = 0; i < M.caught; i++) g.creatures.strike(c, centerOf(c), e.dir.clone(), 1.5, 'shot', 'courier', null, 'impact');
    g.fx?.tracer?.(g.player.pos.clone().setY(g.player.pos.y + 1.4), centerOf(c));
    M.caught = 0;
  },
};
