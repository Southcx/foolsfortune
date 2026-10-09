// ---------------------------------------------------------------------------------------
// MELEE: what a swing hits, read from the swing itself. Shared by every tool that is swung (the Sondelass's cutlass, the Soul Brush's
// club, the tools to come).
//
// A swing's clip is MEASURED once, the first time it is used: posed frame by frame (120 a second) on the Courier standing at the origin,
// the tip of what is in their right hand followed round their body. That gives, for every moment of the clip, the ANGLE of the tip about them
// (0 straight ahead), its height and its reach, and its speed; the STRIKE is the stretch around the fastest moment (the part of a swing
// that is a swing, and not its wind-up or its follow-through). While a stroke plays, everything inside the SECTOR the tip has swept since
// the last frame (between last frame's angle and this frame's, out to the weapon's reach) is struck, once a stroke. A sector, not a
// segment: a blade that crosses two hundred degrees in a tenth of a second (Sword_Regular_A does) jumps sixty degrees between two frames,
// and a test of where the blade IS would miss everything in between. Height is forgiving (a pot at their feet and a jelly at their shoulder are
// both in reach of a horizontal cut), as it is in every action game whose players are not measuring.
//
// MAGNETISM: a stroke started near something worth striking turns them to it and steps them in, to a blade's length from it (the soft lock of
// God of War's and Arkham's combat: the player chooses roughly, the game makes it land). The lock (lockon.js), if it is on, wins.
//
// Prior art: Monster Hunter's and Dark Souls' hit windows (a slice of the clip, not all of it), the swept volumes of the fighting games
// (a hitbox interpolated between frames so that speed does not tunnel), God of War's (2018) and Batman Arkham's attack magnetism, and the
// "measure the animation, do not hand-type the numbers" habit of data-driven combat (Naughty Dog's and Guerrilla's animation-event tools).
//
//   const tr = measureSwing(character, 'swordA', { tip, limb })   tr.strike [t0, t1]   tr.at(t) -> { ang, reach, y }
//   (limb: 'R' the right hand, the default; 'L', 'footR', 'footL'; 'auto' whichever moves fastest: a kick, a left hook)
//   sweep(game, P, yaw, tr, tPrev, t, { reach, hit(kind, ent, point) })   (once a frame while the stroke plays)
//   const m = magnet(game, P, dir, { range, cone })  -> { pos, kind, ent, dist } | null
//   targets(game, centre, R) -> [{ kind: 'pot'|'clapper'|'creature'|'thing', ent, pos, r }]   ('thing': anything registered 'struckable',
//   tags.js, which has `struck(point, dir, power, by, tool)`: a crystal; a tool that strikes calls it and need know nothing more)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { registered } from '../core/tags.js';

const FPS = 120;
const _h = new THREE.Vector3(), _f = new THREE.Vector3(), _t = new THREE.Vector3(), _p = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const cache = new Map();
const LIMBS = { R: ['handR', 'forearmR'], L: ['handL', 'forearmL'], footR: ['footR', 'shinR'], footL: ['footL', 'shinL'] }; // (the tip: past the end bone, along the bone before it)

/** The track of a swing clip: per-frame angle (unwrapped, radians, 0 ahead, + toward their left... the +x side), reach, height, speed. */
export function measureSwing(character, clip, { tip = 0.9, limb = 'R' } = {}) {
  if (limb === 'auto') return fastest(character, clip, tip);
  const key = `${clip}|${tip}|${limb}`;
  if (cache.has(key)) return cache.get(key);
  const C = character.clips, c = C.clips[clip];
  if (!c) return null;
  const B = character.bones, p = character.P.tmp;
  const root = character.root, save = { p: root.position.clone(), q: root.quaternion.clone() };
  const dur = (c.n - 1) / C.fps;
  const n = Math.max(2, Math.round(dur * FPS) + 1);
  const ang = new Float32Array(n), reach = new Float32Array(n), y = new Float32Array(n), speed = new Float32Array(n);
  let prev = null, last = 0;
  root.position.set(0, 0, 0); root.rotation.set(0, 0, 0);
  for (let i = 0; i < n; i++) {
    character.applyPose(C.sample(clip, i / FPS, p, false));
    root.updateMatrixWorld(true);
    const [end, mid] = LIMBS[limb] || LIMBS.R; B[end].getWorldPosition(_h); B[mid].getWorldPosition(_f);
    _t.copy(_h).sub(_f).normalize().multiplyScalar(tip).add(_h);
    let a = Math.atan2(_t.x, _t.z);
    if (i) a = last + wrap(a - last); // (unwrapped: a swing round them back keeps counting)
    last = a;
    ang[i] = a; reach[i] = Math.hypot(_t.x, _t.z); y[i] = _t.y;
    speed[i] = prev ? _t.distanceTo(prev) * FPS : 0;
    prev = (prev || new THREE.Vector3()).copy(_t);
  }
  root.position.copy(save.p); root.quaternion.copy(save.q); root.updateMatrixWorld(true);
  // the strike: around the fastest moment, while the tip moves at a third of that or more
  let im = 0; for (let i = 1; i < n; i++) if (speed[i] > speed[im]) im = i;
  let i0 = im, i1 = im;
  while (i0 > 1 && speed[i0 - 1] > speed[im] * 0.33) i0--;
  while (i1 < n - 1 && speed[i1 + 1] > speed[im] * 0.33) i1++;
  const tr = {
    clip, limb, dur, ang, reach, y, speed, peak: speed[im],
    strike: [Math.max(0, (i0 - 1) / FPS), (i1 + 1) / FPS],
    at(t) {
      const f = THREE.MathUtils.clamp(t * FPS, 0, n - 1), i = Math.floor(f), k = f - i, j = Math.min(n - 1, i + 1);
      return { ang: ang[i] + (ang[j] - ang[i]) * k, reach: reach[i] + (reach[j] - reach[i]) * k, y: y[i] + (y[j] - y[i]) * k };
    },
  };
  cache.set(key, tr);
  return tr;
}

/** The swing of whichever limb moves fastest in the clip (a kick's foot, a left hook's hand): its track. */
function fastest(character, clip, tip) {
  let best = null;
  for (const limb of Object.keys(LIMBS)) { const tr = measureSwing(character, clip, { tip: limb.startsWith('foot') ? tip * 0.25 : tip, limb }); if (tr && (!best || tr.peak > best.peak)) best = tr; }
  return best;
}

/** Everything near `centre` a swing can strike: pots, clapperjars, creatures (and their radius). */
export function targets(g, centre, R) {
  const out = [], R2 = R * R;
  const B = g.breakables || window.__game?.breakables;
  for (const ent of B?.items || []) {
    if (!ent.alive || ent.def?.trial) continue;
    const t = ent.body.translation();
    if ((t.x - centre.x) ** 2 + (t.z - centre.z) ** 2 > R2) continue;
    out.push({ kind: 'pot', ent, pos: new THREE.Vector3(t.x, t.y + ent.P.height * 0.45, t.z), r: ent.P.rMax * 0.9 + 0.1 });
  }
  for (const c of g.clappers?.list || []) {
    if (!c.alive || c.pos.distanceToSquared(centre) > R2 + 4) continue;
    out.push({ kind: 'clapper', ent: c, pos: c.pos.clone().setY(c.pos.y + 0.35), r: 0.4 });
  }
  for (const ent of registered('struckable')) { const p = ent.pos; if ((p.x - centre.x) ** 2 + (p.z - centre.z) ** 2 < R2) out.push({ kind: 'thing', ent, pos: p, r: ent.r || 0.5 }); } // (a crystal: world/dunes/crystals.js)
  for (const c of g.creatures?.near(centre, R) || []) if (!c.ally) out.push({ kind: 'creature', ent: c, pos: c.center(new THREE.Vector3()), r: c.radius || 0.5 });
  for (const c of g.creatures?.friends || []) if (c.alive && c.pos.distanceToSquared(centre) < (R + c.radius) ** 2) out.push({ kind: 'creature', ent: c, pos: c.center(new THREE.Vector3()), r: c.radius }); // (a sibling: friendly fire)
  return out;
}

/**
 * Strike what the tip swept between clip times tPrev and t: the sector between the two angles (about them, facing `yaw`), out to the tip's
 * reach plus `reach` (the weapon's own length beyond the measured tip, and forgiveness), from their feet to above their head.
 * Only inside the strike (padded a little each side). `hit(kind, ent, point, dir)` is called once per thing per stroke (`seen`).
 */
export function sweep(g, P, yaw, tr, tPrev, t, { reach = 0.5, pad = 0.012, padAng = 0.18, seen, hit }) {
  if (!tr || t < tr.strike[0] - pad || tPrev > tr.strike[1] + pad) return 0;
  const a = tr.at(Math.max(tPrev, tr.strike[0] - pad)), b = tr.at(Math.min(t, tr.strike[1] + pad));
  const lo = Math.min(a.ang, b.ang) - padAng, hi = Math.max(a.ang, b.ang) + padAng;
  const R = Math.max(a.reach, b.reach, 1.2) + reach;
  const mid = (lo + hi) / 2, half = (hi - lo) / 2;
  let n = 0;
  for (const tg of targets(g, P.pos, R + 1)) {
    if (seen?.has(tg.ent)) continue;
    const dx = tg.pos.x - P.pos.x, dz = tg.pos.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d > R + tg.r) continue;
    // height: forgiving, but it follows the tip (an overhead coming over their head from behind does not reach the floor behind them)
    const dy = tg.pos.y - P.pos.y, yLo = Math.min(a.y, b.y), yHi = Math.max(a.y, b.y);
    if (dy + tg.r < yLo - 1.2 || dy - tg.r > yHi + 0.7) continue;
    // its angle about them, relative to where they face; and its angular half-width at that distance
    const rel = wrap(Math.atan2(dx, dz) - yaw), w = d > 1e-3 ? Math.asin(Math.min(1, tg.r / d)) : Math.PI;
    if (d > 0.45 && Math.abs(wrap(rel - mid)) > half + w) continue; // (right up against them: always)
    seen?.add(tg.ent);
    // the cut's direction: along the swing, at the thing
    const dir = _p.set(Math.cos(rel + yaw), 0, -Math.sin(rel + yaw)).multiplyScalar(Math.sign(b.ang - a.ang) || 1);
    hit(tg.kind, tg.ent, tg.pos.clone(), dir.clone());
    n++;
  }
  return n;
}

/** The thing a stroke started now should go to: in front of them within `range`, within `cone` of `dir`, creatures first. */
export function magnet(g, P, dir, { range = 4.2, cone = 1.0 } = {}) {
  let best = null, bs = -Infinity;
  const yaw = Math.atan2(dir.x, dir.z);
  for (const tg of targets(g, P.pos, range + 0.5)) {
    const dx = tg.pos.x - P.pos.x, dz = tg.pos.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d > range || Math.abs(tg.pos.y - P.pos.y) > 2.2) continue;
    const off = Math.abs(wrap(Math.atan2(dx, dz) - yaw));
    if (off > cone) continue;
    const prio = tg.kind === 'creature' ? 2.2 : tg.kind === 'clapper' ? 1.4 : 1;
    const s = prio * 2 - d * 0.35 - off * 1.6;
    if (s > bs) { bs = s; best = { pos: tg.pos, kind: tg.kind, ent: tg.ent, dist: d, r: tg.r }; }
  }
  return best;
}
