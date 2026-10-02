// ---------------------------------------------------------------------------------------
// STEERING: how a creature moves toward what it has chosen, on the ground (x and z; the ground decides y). Each behaviour turns a
// position and a goal into a DESIRED VELOCITY; a few are blended (each with a weight) into the one the creature eases toward. They are
// plain functions on plain vectors, so any creature (a jelly, a clapperjar, a fish, a bird one day) uses the same few lines.
//
//   seek(out, pos, goal, speed)            straight at it                  arrive(out, pos, goal, speed, slowR)   and slow to a stop on it
//   flee(out, pos, from, speed)            straight away                  pursue(out, pos, goal, goalVel, speed)  to where it will be
//   evade(out, pos, from, fromVel, speed)  away from where it will be     wander(out, state, heading, speed, dt)  an unhurried meander
//   orbit(out, pos, centre, r, dir, speed) round it at a distance (circling while it waits for its moment)
//   separate(out, pos, others, r)          out of the way of its kind     cohere(out, pos, others)  toward the middle of them
//   align(out, others)                     going the way they go          contain(out, pos, centre, r)  back inside its ground
//   avoid(out, pos, vel, probe, look)      round what is in the way (`probe(from, dir, len)` -> the normal of what it would hit, or null)
//   blend(out, [[v, w], ...], max)         the weighted sum, capped
//
// Prior art: Craig Reynolds, "Steering Behaviors for Autonomous Characters" (GDC 1999) and his boids (1987): seek, flee, arrive,
// pursuit and evasion, wander on a circle ahead, separation, cohesion and alignment, containment, whisker obstacle avoidance; blended
// by weight and truncated, as Mat Buckland's "Programming Game AI by Example" lays them out.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const flat = (v) => { v.y = 0; return v; };

export function seek(out, pos, goal, speed) {
  out.set(goal.x - pos.x, 0, goal.z - pos.z);
  const d = out.length();
  return d > 1e-4 ? out.multiplyScalar(speed / d) : out.set(0, 0, 0);
}
export function arrive(out, pos, goal, speed, slowR = 2) {
  out.set(goal.x - pos.x, 0, goal.z - pos.z);
  const d = out.length();
  if (d < 1e-3) return out.set(0, 0, 0);
  return out.multiplyScalar((speed * Math.min(1, d / slowR)) / d);
}
export function flee(out, pos, from, speed) {
  out.set(pos.x - from.x, 0, pos.z - from.z);
  const d = out.length();
  return d > 1e-4 ? out.multiplyScalar(speed / d) : out.set(speed, 0, 0);
}
export function pursue(out, pos, goal, goalVel, speed, maxLead = 1.2) {
  const d = Math.hypot(goal.x - pos.x, goal.z - pos.z), t = Math.min(maxLead, d / Math.max(0.1, speed));
  _a.set(goal.x + goalVel.x * t, 0, goal.z + goalVel.z * t);
  return seek(out, pos, _a, speed);
}
export function evade(out, pos, from, fromVel, speed, maxLead = 1) {
  const d = Math.hypot(from.x - pos.x, from.z - pos.z), t = Math.min(maxLead, d / Math.max(0.1, speed));
  _a.set(from.x + fromVel.x * t, 0, from.z + fromVel.z * t);
  return flee(out, pos, _a, speed);
}
/** state: { a } (the wander angle, kept between frames). The target drifts round a circle ahead of where it is heading. */
export function wander(out, state, heading, speed, dt, { jitter = 2.2, dist = 2, r = 1 } = {}) {
  state.a = (state.a ?? Math.random() * 6.28) + (Math.random() - 0.5) * jitter * dt * 6;
  const hx = Math.sin(heading), hz = Math.cos(heading);
  out.set(hx * dist + Math.sin(state.a) * r, 0, hz * dist + Math.cos(state.a) * r);
  const d = out.length();
  return d > 1e-4 ? out.multiplyScalar(speed / d) : out.set(0, 0, 0);
}
export function orbit(out, pos, centre, r, dir = 1, speed = 1) {
  _a.set(pos.x - centre.x, 0, pos.z - centre.z);
  const d = _a.length() || 1;
  // tangent, plus a pull to the ring
  out.set(-_a.z * dir, 0, _a.x * dir).multiplyScalar(1 / d).addScaledVector(_a, (r - d) / d * 0.8);
  const l = out.length();
  return l > 1e-4 ? out.multiplyScalar(speed / Math.max(1, l)) : out.set(0, 0, 0);
}
/** others: [{ pos }] (itself excluded by the caller, or skipped here when at its own place). */
export function separate(out, pos, others, r = 1.5) {
  out.set(0, 0, 0);
  for (const o of others) {
    const dx = pos.x - o.pos.x, dz = pos.z - o.pos.z, d = Math.hypot(dx, dz);
    if (d < 1e-3 || d > r) continue;
    const k = (r - d) / r / d; out.x += dx * k; out.z += dz * k;
  }
  return out;
}
export function cohere(out, pos, others, speed = 1) {
  if (!others.length) return out.set(0, 0, 0);
  _a.set(0, 0, 0); for (const o of others) _a.add(o.pos);
  _a.multiplyScalar(1 / others.length);
  return seek(out, pos, _a, speed);
}
export function align(out, others) {
  out.set(0, 0, 0);
  for (const o of others) if (o.vel) out.add(o.vel);
  return others.length ? flat(out.multiplyScalar(1 / others.length)) : out;
}
export function contain(out, pos, centre, r, strength = 1) {
  const dx = centre.x - pos.x, dz = centre.z - pos.z, d = Math.hypot(dx, dz);
  if (d <= r) return out.set(0, 0, 0);
  return out.set(dx / d, 0, dz / d).multiplyScalar(strength * Math.min(3, (d - r) * 0.5 + 0.5));
}
/** Whiskers: three rays ahead along its velocity; turn along the wall it would hit. */
export function avoid(out, pos, vel, probe, look = 2) {
  out.set(0, 0, 0);
  const sp = Math.hypot(vel.x, vel.z);
  if (sp < 0.05) return out;
  const hx = vel.x / sp, hz = vel.z / sp;
  for (const [ang, len] of [[0, look], [0.5, look * 0.7], [-0.5, look * 0.7]]) {
    const c = Math.cos(ang), s = Math.sin(ang);
    _b.set(hx * c - hz * s, 0, hx * s + hz * c);
    const n = probe(pos, _b, len);
    if (n) { out.x += n.x - _b.x * 0.3; out.z += n.z - _b.z * 0.3; }
  }
  return out.multiplyScalar(sp);
}
export function blend(out, parts, max) {
  out.set(0, 0, 0);
  for (const [v, w] of parts) if (v && w) out.addScaledVector(v, w);
  out.y = 0;
  const l = out.length();
  if (l > max) out.multiplyScalar(max / l);
  return out;
}
