// ---------------------------------------------------------------------------------------
// INSCRIPTIONS: what the Soul Brush is for. A drawing over a thing writes a PROPERTY onto it for a while, and the world treats it
// accordingly: physics (the body's type, mass, gravity, bounce) and the tags every tool asks (src/tags.js). When the writing fades the
// thing is exactly what it was. Nothing here hurts anything; it changes what a thing is, and what follows is the world's doing (a pot
// made HEAVY and dropped breaks itself; one made STILL in mid-air is a step; an EMBER one is a bomb waiting for a blow).
//
//   still    held where it is (the body is made kinematic); it is static, and no longer pushable or liftable. A step in the air.
//   heavy    five times the mass and twice the gravity: it drops, it won't be shoved, it lands hard
//   light    a tenth of the gravity and a soft drag: it drifts up when struck and floats down
//   bounce   it springs back from whatever it meets, more than it came in with
//   ember    it is an ember pot now: when it breaks, it bursts (breakables.js asks `ent.ember`)
//
// Each wears a SEAL while it lasts: a small brushed mark in the property's colour that rides on the thing (a shape, not a word), and
// fades as the writing does.
//
// Prior art: Okami's brush that changes the world rather than striking it (Rejuvenation, Bloom, Veil of Mist), Scribblenauts' adjectives
// (write "heavy" on a thing and it is heavy), and Breath of the Wild's Stasis and Magnesis (a rune that alters a thing's physics for a
// few seconds, with a visible mark and a countdown in its colour).
//
//   inscribe(game, ent, 'still' | 'heavy' | 'light' | 'bounce' | 'ember', seconds) -> bool     inscribed(ent) -> [props]    tickInscriptions(game, dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER } from '../physics.js';
import { tag, untag } from '../tags.js';

export const PROPS = {
  still: { color: 0xbfe6ff, dur: 12, mark: [[0.18, 0.4, 0.82, 0.4], [0.18, 0.62, 0.82, 0.62]] },
  heavy: { color: 0x8a5cc8, dur: 14, mark: [[0.2, 0.25, 0.5, 0.8, 0.8, 0.25]] },
  light: { color: 0xfff1c0, dur: 14, mark: [[0.2, 0.75, 0.5, 0.2, 0.8, 0.75]] },
  bounce: { color: 0x9fe8a0, dur: 18, mark: [[0.5, 0.15, 0.5, 0.85]] },
  ember: { color: 0xff8a4a, dur: 30, mark: [[0.5, 0.5, 0.5, 0.5]], ring: true },
};

const live = []; // { ent, prop, t, dur, undo, seal }
const TEX = {};
function sealTexture(prop) {
  if (TEX[prop]) return TEX[prop];
  const S = 96, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), P = PROPS[prop];
  g.lineCap = 'round'; g.lineJoin = 'round';
  const col = '#' + new THREE.Color(P.color).getHexString();
  // a brushed ring, open at the top like an ensō, and the property's mark inside it
  for (const [w, st] of [[S * 0.13, 'rgba(14,10,12,0.85)'], [S * 0.065, col]]) {
    g.strokeStyle = st; g.lineWidth = w;
    g.beginPath(); g.arc(S / 2, S / 2, S * 0.36, -Math.PI * 0.38, Math.PI * 1.32); g.stroke();
    for (const m of P.mark) {
      g.beginPath(); g.moveTo(m[0] * S, m[1] * S);
      if (m.length === 4 && m[0] === m[2] && m[1] === m[3]) { g.arc(m[0] * S, m[1] * S, S * 0.09, 0, Math.PI * 2); g.stroke(); continue; }
      for (let i = 2; i < m.length; i += 2) g.lineTo(m[i] * S, m[i + 1] * S);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (TEX[prop] = t);
}

const bodyOf = (ent) => (ent?.body?.isValid?.() ? ent.body : null);
const collidersOf = (body) => { const out = []; for (let i = 0; i < body.numColliders(); i++) out.push(body.collider(i)); return out; };

/** Write a property onto a thing (a pot, a piece, a loose prop) for `dur` seconds. False if it cannot take it. */
export function inscribe(game, ent, prop, dur = PROPS[prop]?.dur ?? 12) {
  const body = bodyOf(ent);
  if (!body || !PROPS[prop]) return false;
  if (!body.isDynamic() && !(prop === 'still' && live.some((q) => q.ent === ent && q.prop === 'still'))) return false;
  // the same property again: it lasts longer; a contrary one replaces it
  const same = live.find((q) => q.ent === ent && q.prop === prop);
  if (same) { same.dur = Math.max(same.dur - same.t, dur) + same.t; return true; }
  const contrary = { heavy: 'light', light: 'heavy', still: null };
  for (const q of live.filter((q) => q.ent === ent && (q.prop === contrary[prop] || (prop === 'still' && q.prop !== 'ember') || (q.prop === 'still' && prop !== 'ember')))) expire(game, q);
  const undo = [];
  const cols = collidersOf(body);
  if (prop === 'still') {
    body.setLinvel({ x: 0, y: 0, z: 0 }, false); body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    const had = { pushable: !ent.untags?.has('pushable'), liftable: !ent.untags?.has('liftable'), stat: !!ent.tags?.has('static') };
    tag(ent, 'static'); untag(ent, 'pushable', 'liftable');
    undo.push(() => {
      if (body.isValid()) { body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); body.wakeUp(); }
      if (!had.stat) untag(ent, 'static');
      if (had.pushable) tag(ent, 'pushable');
      if (had.liftable) tag(ent, 'liftable');
      ent.untags?.delete('static'); // (untag left a mark: what it had by default comes back)
    });
  } else if (prop === 'heavy') {
    const d = cols.map((c) => c.density()), gs = body.gravityScale();
    cols.forEach((c, i) => c.setDensity(d[i] * 5)); body.setGravityScale(gs * 2.2, true);
    body.applyImpulse({ x: 0, y: -2 * body.mass(), z: 0 }, true);
    untag(ent, 'liftable');
    undo.push(() => { if (body.isValid()) { cols.forEach((c, i) => c.isValid?.() !== false && c.setDensity(d[i])); body.setGravityScale(gs, true); } ent.untags?.delete('liftable'); });
  } else if (prop === 'light') {
    const gs = body.gravityScale(), ld = body.linearDamping();
    body.setGravityScale(gs * 0.1, true); body.setLinearDamping(Math.max(ld, 0.9));
    body.applyImpulse({ x: 0, y: 2.5 * body.mass(), z: 0 }, true);
    undo.push(() => { if (body.isValid()) { body.setGravityScale(gs, true); body.setLinearDamping(ld); } });
  } else if (prop === 'bounce') {
    const r = cols.map((c) => [c.restitution(), c.restitutionCombineRule?.()]);
    cols.forEach((c) => { c.setRestitution(1.05); c.setRestitutionCombineRule?.(RAPIER.CoefficientCombineRule.Max); });
    body.wakeUp();
    tag(ent, 'bouncy');
    undo.push(() => { if (body.isValid()) cols.forEach((c, i) => { c.setRestitution(r[i][0]); if (r[i][1] != null) c.setRestitutionCombineRule?.(r[i][1]); }); untag(ent, 'bouncy'); ent.untags?.delete('bouncy'); });
  } else if (prop === 'ember') {
    if (ent.type !== 'breakable' || ent.def?.ember || ent.ember) return false;
    ent.ember = true; tag(ent, 'ember');
    undo.push(() => { ent.ember = false; untag(ent, 'ember'); ent.untags?.delete('ember'); });
  }
  const seal = new THREE.Sprite(new THREE.SpriteMaterial({ map: sealTexture(prop), transparent: true, depthWrite: false, fog: false }));
  seal.renderOrder = 25;
  game.scene.add(seal);
  live.push({ ent, prop, t: 0, dur, undo, seal, off: live.filter((q) => q.ent === ent).length });
  game.events?.emit('inscribe', { prop, what: ent.type === 'breakable' ? 'pot' : 'piece' });
  return true;
}

function expire(game, q) {
  const i = live.indexOf(q);
  if (i >= 0) live.splice(i, 1);
  for (const u of q.undo) try { u(); } catch { /* the thing is gone */ }
  game.scene.remove(q.seal); q.seal.material.dispose();
}

export const inscribed = (ent) => live.filter((q) => q.ent === ent).map((q) => q.prop);
/** Undo every writing on a thing at once (the Veritome's truth). */
export function unwrite(game, ent) { let n = 0; for (const q of live.filter((x) => x.ent === ent)) { expire(game, q); n++; } return n; }
export function inscriptions() { return live; }

/** Every frame: the seals ride their things and fade with the writing; the expired are undone. */
export function tickInscriptions(game, dt) {
  for (let i = live.length - 1; i >= 0; i--) {
    const q = live[i];
    q.t += dt;
    const body = bodyOf(q.ent);
    const gone = !body || q.ent.alive === false;
    if (gone || q.t >= q.dur) { expire(game, q); continue; }
    const m = q.ent.mesh;
    if (m) { m.updateMatrixWorld(); q.seal.position.setFromMatrixPosition(m.matrixWorld); } else { const t = body.translation(); q.seal.position.set(t.x, t.y, t.z); }
    const h = q.ent.P?.fullHeight ?? q.ent.P?.height ?? 0.6;
    q.seal.position.y += h + 0.25 + q.off * 0.34 + Math.sin(q.t * 2 + q.off) * 0.03;
    const left = q.dur - q.t;
    const fade = Math.min(1, left / 2, q.t / 0.25);
    q.seal.material.opacity = fade * (left < 3 ? 0.6 + 0.4 * Math.cos(q.t * 9) : 1); // (it wavers as it is about to go)
    q.seal.scale.setScalar(0.34 * (0.6 + 0.4 * Math.min(1, q.t / 0.25)));
  }
}

export function clearInscriptions(game) { for (const q of [...live]) expire(game, q); }
