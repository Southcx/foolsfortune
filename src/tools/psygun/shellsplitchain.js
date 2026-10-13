// ---------------------------------------------------------------------------------------
// THE SHELLS THAT SPLIT AND CHAIN, AND THE STORM (CASTER-SHELLS.md section 1: M1 split on impact, M2 chain targets; TYPE-13, 19, 23,
// 31 to 34, 36, 37, 40, 42): a part of the shell runner (tools/psygun/shellrunner.js), its carriers, hits, fires and lands merged into
// the runner's tables. A SPLIT is children launched where the parent lands, each with a carrier of its own; a CHAIN is a blow that jumps
// to the next nearest creature not yet struck, weaker each jump, a bolt of lightning drawn along each (Calissa's S3,
// `caster.lightning`); the Lightning Rod's creature takes any jump that passes near it, and a chain that starts in water reaches
// everything in that water.
//
// Prior art: Ratchet & Clank's Shock Cannon and Tesla Claw (the arc that hops target to target), the Plasma Coil's slow orb, the Flux
// and Splitter Rifles (a needle that fans at the wall), the Lava Gun's glob; Diablo's Chain Lightning (the falloff and no repeats);
// the Capacitor's charge and release, a plain one (the longer you hold it, the more it holds).
//
//   SPLIT_CHAIN (a runner part)   chain(R, row, from, first, { count, power, falloff, status, dur })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { foesNear, blast } from './shellpayloads.js';
import { spreadDir, centerOf, graze, shellRand } from './shellkit.js';

const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _w = new THREE.Vector3();
/** How far a chain's jump reaches (m), and how near the Lightning Rod's creature must be to take a jump (m). */
const JUMP = 8, ROD_PULL = 10;

/** A bolt of lightning between two points (Calissa's S3). */
export const zap = (g, from, to, tint) => g.vfx?.play?.('caster.lightning', { pos: from, from: from.clone(), to: to.clone(), tint });

/** A chain: `first` struck, then the next nearest not yet struck, `count` in all, each `falloff` of the last; the Rod's creature first
 *  when it is near. A chain begun in water reaches everything in that water. */
export function chain(R, row, from, first, { count = 4, power = 1, falloff = 0.8, status = null, dur = 2 } = {}) {
  const g = R.game, hit = new Set();
  let at = from.clone(), c = first, k = power;
  const pool = g.water?.at?.(first.pos.x, first.pos.y + 0.2, first.pos.z);
  const wet = pool ? foesNear(g, first.pos, 40).filter((x) => g.water.at(x.pos.x, x.pos.y + 0.2, x.pos.z) === pool) : null;
  for (let i = 0; c && i < (wet ? Math.max(count, wet.length) : count); i++) {
    hit.add(c);
    const to = centerOf(c);
    zap(g, at, to);
    g.creatures.strike(c, to.clone(), _v.subVectors(to, at).normalize().clone(), k, 'shot', 'courier', null, 'impact');
    if (status) g.creatures.apply(c, status, dur, 1);
    at = to; k *= falloff;
    const rod = R.rod?.c;
    if (wet) c = wet.find((x) => !hit.has(x)) || null;
    else if (rod?.alive && !hit.has(rod) && rod.pos.distanceTo(c.pos) < ROD_PULL) c = rod; // (the Lightning Rod takes the jump)
    else c = foesNear(g, c.pos, JUMP).find((x) => !hit.has(x)) || null;
  }
  if (hit.size) { sfx.shellHit?.(['chain'], { tier: row.tier, type: 'impact' }); g.hud?.hitmarker?.(false); }
  return hit;
}

/** A small body set down (a node, a cage's post, a cloud): a lit mesh in a colour, its own geometry. */
function body(R, geo, col, at) {
  const m = new THREE.Mesh(geo, R.mat(col)); m.position.copy(at); m.userData.zoneFree = true; R.game.scene.add(m);
  return m;
}
const ground = (g, at) => g.physics.raycast(at.clone().addScaledVector(UP, 0.5), new THREE.Vector3(0, -1, 0), 30, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic())?.point ?? at.clone();

export const SPLIT_CHAIN = {
  carrier: {
    needle: { speed: 70, lift: 0, grav: 0, life: 1.5, r: 0.12 },
    shard: { speed: 40, lift: 0, grav: 0, life: 1, r: 0.1 },
    petal: { speed: 3, lift: 0, grav: 0.25, life: 4, r: 0.15 },
    lava: { speed: 3, lift: 0, grav: 0, life: 10, r: 0.4, sight: 20 },
    lavaKid: { speed: 4, lift: 0, grav: 0, life: 5, r: 0.25, sight: 12 },
    orb: { speed: 2, lift: 0, grav: 0, life: 8, r: 0.3, sight: 14 },
  },
  hit: {
    // Splitter: through every creature in line; at the first wall, a fan of seven that ricochet once
    needle: (R, p, k, dir) => {
      if (k.target) { graze(R, p, k.target, k.at, dir, p.row.n.power, 99); return false; }
      const out = dir.clone().reflect(k.normal);
      for (let i = 0; i < p.row.n.count; i++) R.launch('shard', p.row, k.at.clone().addScaledVector(k.normal, 0.15), spreadDir(out, 50), { scale: 0.6 });
      sfx.shellHit?.(['split'], { tier: p.row.tier, type: 'impact' });
      return true;
    },
    shard: (R, p, k, dir) => {
      if (k.target) { graze(R, p, k.target, k.at, dir, p.row.n.power * 0.5, 99); return true; }
      p.vel.reflect(k.normal); return ++p.bounces > 1;
    },
    // Petal Rain: each petal a tiny hit
    petal: (R, p, k, dir) => { if (k.target) graze(R, p, k.target, k.at, dir, p.row.n.power, 99); return true; },
    // Lava Lamp: a hit bursts it, and it splits into three smaller that go on hunting
    lava: (R, p, k) => {
      blast(R, k.at, 1.6, p.row.n.power, 'explosion');
      R.game.paintmap?.slick?.(k.at.x, k.at.y, k.at.z, 1.2, 0.8);
      for (let i = 0; i < p.row.n.count; i++) R.launch('lavaKid', p.row, k.at.clone().addScaledVector(k.normal, 0.4), spreadDir(k.normal, 120), { scale: 2.2 });
      p.look?.stop?.(); return true;
    },
    lavaKid: (R, p, k) => { blast(R, k.at, 1, p.row.n.power * 0.4, 'explosion'); return true; },
    // Ball Lightning passes through creatures (it lashes them on its own clock) and turns off walls
    orb: (R, p, k) => { if (!k.target) p.vel.reflect(k.normal); return false; },
  },
  fly: {
    lava: (R, p, dt) => seek(R, p, dt, p.row.n.speed),
    lavaKid: (R, p, dt) => seek(R, p, dt, p.C.speed),
    // Ball Lightning: drifts after the nearest, and lashes everything within r on its own clock
    orb: (R, p, dt) => {
      seek(R, p, dt, p.row.n.speed);
      if ((p.lash = (p.lash ?? 0) - dt) > 0) return;
      p.lash = 0.5;
      for (const c of foesNear(R.game, p.pos, p.row.n.r)) { zap(R.game, p.pos, centerOf(c), 0xc49bff); R.game.creatures.strike(c, centerOf(c), _v.subVectors(c.pos, p.pos).normalize().clone(), p.row.n.power, 'shot', 'courier', null, 'impact'); }
    },
  },
  expire: { lava: (R, p) => p.look?.stop?.() },
  fires: {
    splitter: (R, row, { muzzle, ray }) => { R.launch('needle', row, muzzle, ray.dir, { scale: 0.8 }); },
    // Petal Rain: hangs at its apex, then blooms into forty petals in a ring
    petalRain: (R, row, { muzzle, ray }) => {
      R.launch('lobPart', row, muzzle, ray.dir, { extra: { hangAt: true, land: (R2, p, at) => {
        for (let i = 0; i < row.n.count; i++) {
          const a = (i / row.n.count) * Math.PI * 2 + shellRand() * 0.3, r = row.n.r * Math.sqrt(shellRand());
          R2.launch('petal', row, at.clone().add(_w.set(Math.cos(a) * r, 0.5 + shellRand() * 1.5, Math.sin(a) * r)), new THREE.Vector3((shellRand() - 0.5) * 0.4, -1, (shellRand() - 0.5) * 0.4).normalize(), { scale: 0.7, speed: 2 + shellRand() * 2 });
        }
      } } });
    },
    lavaLamp: (R, row, { muzzle, ray }) => {
      const p = R.launch('lava', row, muzzle, ray.dir, { scale: 3 });
      p.look = R.game.vfx?.play?.('shell.lavaLamp', { pos: p.pos, follow: (h) => !p.done && (h.pos.copy(p.pos), true) });
    },
    // Slingshot: a well that gathers for `dur`, then flings all it gathered the way you are aiming
    slingshot: (R, row, { muzzle, ray, camera }) => {
      R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
        const g = R2.game, n = row.n;
        R2.timed({ t: n.dur, every: 0.05, field: 'zone', tier: row.tier, tick: () => {
          for (const c of foesNear(g, at, n.r)) { _v.subVectors(at, c.pos).setY(0); const d = _v.length(); if (d > 0.6) c.knock?.(_v.multiplyScalar(1.6 / d)); }
          g.physics.world.forEachRigidBody((b) => {
            if (!b.isDynamic() || g.physics.links.has(b.handle) || b.mass() > 40) return;
            const t = b.translation(); _v.set(at.x - t.x, at.y + 1 - t.y, at.z - t.z); const d = _v.length();
            if (d > n.r || d < 0.3) return;
            g.physics.kick(b, { x: _v.x / d * 0.5 * b.mass(), y: (_v.y / d * 0.5 + 0.45) * b.mass(), z: _v.z / d * 0.5 * b.mass() });
          });
        }, end: () => {
          const aim = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize().setY(0.35).normalize();
          for (const c of foesNear(g, at, n.r)) { c.knock?.(aim.clone().multiplyScalar(n.fling)); g.creatures.strike(c, centerOf(c), aim.clone(), 1, 'explosion'); }
          g.physics.world.forEachRigidBody((b) => {
            if (!b.isDynamic() || g.physics.links.has(b.handle) || b.mass() > 40) return;
            const t = b.translation(); if (_v.set(t.x - at.x, t.y - at.y, t.z - at.z).length() > n.r) return;
            g.physics.kick(b, { x: aim.x * n.fling * b.mass(), y: aim.y * n.fling * b.mass(), z: aim.z * n.fling * b.mass() });
          });
          g.fx?.shockwave?.(at, n.r * 0.5); sfx.push?.(); R2.weigh(at, 'slingshot');
        } });
      } } });
    },
    // Tesla Node: lands and arcs to the nearest `count` every `every` for `dur`
    teslaNode: (R, row, { muzzle, ray }) => {
      R.launch('lobPart', row, muzzle, ray.dir, { extra: { land: (R2, p, at) => {
        const g = R2.game, n = row.n, node = body(R2, new THREE.CylinderGeometry(0.08, 0.16, 0.5, 6).translate(0, 0.25, 0), 0xe8e0d0, ground(g, at));
        const tip = node.position.clone().setY(node.position.y + 0.5);
        R2.timed({ t: n.dur, every: n.every, field: 'zone', tier: row.tier, tick: () => {
          for (const c of foesNear(g, tip, 8).slice(0, n.count)) { zap(g, tip, centerOf(c)); g.creatures.strike(c, centerOf(c), _v.subVectors(c.pos, tip).normalize().clone(), n.power, 'shot', 'courier', null, 'impact'); }
        }, end: () => g.scene.remove(node) });
      } } });
    },
    // Ball Lightning: a slow orb that drifts after the nearest and lashes everything within r
    ballLightning: (R, row, { muzzle, ray }) => { R.launch('orb', row, muzzle, ray.dir, { scale: 3, life: row.n.dur, col: 0xc49bff }); },
    // Thunderhead: a small storm cloud over the fight for `dur`, striking the most agitated creature (heavier in Fury weather)
    thunderhead: (R, row, { ray }) => {
      const g = R.game, n = row.n, P = g.player;
      const aim = g.physics.raycast(ray.origin, ray.dir, 60, P.collider, undefined, (k) => !k.isSensor())?.point ?? ray.origin.clone().addScaledVector(ray.dir, 20);
      const cloud = body(R, new THREE.SphereGeometry(1, 10, 6).scale(2.2, 0.6, 1.6), 0x2a2630, aim.clone().setY(aim.y + 7));
      const fury = g.weather?.here?.(P.pos)?.aspect === 'fury' ? 1.5 : 1;
      sfx.shellFall?.(1, row.tier);
      R.timed({ t: n.dur, every: n.every, field: 'cloud', tier: row.tier, tick: () => {
        const foes = foesNear(g, P.pos, 20); if (!foes.length) return;
        const c = foes.reduce((a, b) => ((b.emo ?? 0) > (a.emo ?? 0) ? b : a));
        cloud.position.set(c.pos.x, c.pos.y + 7, c.pos.z);
        zap(g, cloud.position, centerOf(c), 0xffffff);
        g.creatures.strike(c, centerOf(c), new THREE.Vector3(0, -1, 0), n.power * fury, 'shot', 'courier', null, 'impact'); R.weigh(centerOf(c), 'thunderhead');
      }, end: () => g.scene.remove(cloud) });
    },
    // Capacitor: it charges while it sits selected in its chamber; the longer, the bigger; full, a pillar of lightning
    capacitor: (R, row, { ray }) => {
      const g = R.game, n = row.n, k = Math.min(1, (R.capCharge ?? 0) / n.charge); R.capCharge = 0;
      const at = g.physics.raycast(ray.origin, ray.dir, 80, g.player.collider, undefined, (c) => !c.isSensor())?.point ?? ray.origin.clone().addScaledVector(ray.dir, 40);
      const power = n.power + (n.full - n.power) * k * k, r = 1.2 + 2 * k;
      zap(g, at.clone().setY(at.y + n.height * (0.4 + 0.6 * k)), at, 0xffffff);
      for (const c of foesNear(g, at, r)) g.creatures.strike(c, centerOf(c), new THREE.Vector3(0, -1, 0), power, 'shot', 'courier', null, 'impact');
      if (k >= 1) g.fx?.shockwave?.(at, r);
    },
  },
  lands: {
    // Chain Bolt: jumps to up to `count`, weaker each jump, a stun on each
    chainBolt: (R, row, at, normal, target) => { const first = target || foesNear(R.game, at, 2)[0]; if (first) chain(R, row, at, first, { count: row.n.count, power: row.n.power, falloff: row.n.falloff, status: row.n.status, dur: 1.5 }); },
    // Twelve: everything with a mind in r sleeps; anything that runs (a turret, a node, a lamp-mover) stops
    twelve: (R, row, at) => {
      const g = R.game, n = row.n;
      for (const c of foesNear(g, at, n.r)) { g.creatures.apply(c, n.status, n.dur, 1); for (const s of ['charm', 'confusion', 'doubt']) g.creatures.clearStatus?.(c, s); }
      for (const c of g.clappers?.list || []) if (c.alive && c.pos.distanceTo(at) < n.r) g.clappers.stun?.(c, n.dur, R.shells.glowOutline, R.shells.xray);
      g.pulse?.emit?.(at, n.r, 0x9cc8ff, { life: 0.9 });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; zap(g, at, at.clone().add(_w.set(Math.cos(a) * n.r, 0.3, Math.sin(a) * n.r))); }
    },
    // Faraday Cage: a cube of arcs: what is inside is held there; what crosses the bars is shocked
    faradayCage: (R, row, at) => {
      const g = R.game, n = row.n, c0 = ground(g, at), h = n.size / 2, inside = (p) => Math.abs(p.x - c0.x) < h && Math.abs(p.z - c0.z) < h && p.y > c0.y - 1 && p.y < c0.y + n.size;
      const posts = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, z]) => g.vfx?.play?.('caster.lightning.arc', { pos: c0, from: c0.clone().add(new THREE.Vector3(x, 0, z)), to: c0.clone().add(new THREE.Vector3(x, n.size, z)) }));
      const held = new Set(foesNear(g, c0, n.size).filter((c) => inside(c.pos)));
      R.timed({ t: n.dur, every: 0.25, field: 'wall', tier: row.tier, tick: () => {
        for (const c of foesNear(g, c0, n.size * 1.5)) {
          const isIn = inside(c.pos);
          if (held.has(c)) { g.creatures.apply(c, n.status, 0.5, 1); if (!isIn) { c.pos.x = THREE.MathUtils.clamp(c.pos.x, c0.x - h + 0.3, c0.x + h - 0.3); c.pos.z = THREE.MathUtils.clamp(c.pos.z, c0.z - h + 0.3, c0.z + h - 0.3); } }
          else if (isIn || Math.abs(Math.max(Math.abs(c.pos.x - c0.x), Math.abs(c.pos.z - c0.z)) - h) < c.radius + 0.2) { g.creatures.strike(c, centerOf(c), _v.subVectors(c.pos, c0).setY(0).normalize().clone(), n.power, 'shot', 'courier', null, 'impact'); c.knock?.(_v.multiplyScalar(4)); }
        }
      }, end: () => posts.forEach((x) => x?.stop?.()) });
    },
  },
  // the Capacitor charges while it sits selected
  tick: (R, dt) => { R.capCharge = R.shells.type?.id === 'capacitor' ? (R.capCharge ?? 0) + dt : 0; },
};

/** A seeker's steering: toward the nearest foe within its sight, at `speed`. */
function seek(R, p, dt, speed) {
  const c = foesNear(R.game, p.pos, p.C.sight ?? 15)[0];
  if (c) { _v.copy(centerOf(c)).sub(p.pos).normalize().multiplyScalar(speed); p.vel.lerp(_v, Math.min(1, dt * 2)); }
  else if (p.vel.lengthSq() > speed * speed) p.vel.setLength(speed);
}
