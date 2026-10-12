// ---------------------------------------------------------------------------------------
// THE CASTER SHELLS' LOOKS (batch 1 of docs/plans/CASTER-SHELLS.md: the look column, shell by shell). The shell runner (Petra's,
// tools/psygun/shellrunner.js and shellpayloads.js) says what happened and to which shell, at five moments, and this module answers
// from one table: a round's BODY and its tail while it FLIES, a mark at each TOUCH (a bounce), what it leaves where it LANDS, what
// happens at the muzzle as it is FIRED, and the look of a thing SET down (the Taunt Doll, the Detonator's charge). The looks are effects
// in the library (vfx/library.js, `shell.<id>.<moment>`: data, tuned there); a held one is followed here (vfx.js's `follow`) and let
// go at the shell's own time (`dur`). Bodies are a few small shared meshes: plain lit materials, no program of their own.
//
// The look (docs/ART.md): every round is a made thing of the workshop's: a fired-clay throwing wheel with a gold rim, a flat
// Lachrymite stone, a chrome ball, a putty lump with a glaze bead, a painted doll, a little clapper with a fuse; the rest a glaze bead
// in its family's colour (a Feelings shell in its feeling's). No words or numbers anywhere: a question mark or a note is a glyph pop.
//
// Prior art: Ratchet & Clank's arsenal, where every gun's round is its own object (the Disc Blade's wheel, the Bouncer's bomblets,
// the Agents' little runners, the Taunter's doll), the shot's look kept apart from its rules as Final Fantasy XIV's .avfx and Unreal's
// Niagara keep it (an effect named by its use, played by name), and Noita's projectiles (a body, a trail, a hit, each a part).
//
//   shellLook(game, moment, row, ctx)   moment: 'fly' { mesh, p, kind } | 'touch' { p, at, normal, target, ent } | 'land' { at, normal,
//                                       target, dir, ent } | 'fire' { muzzle, ray, camera, character } | 'set' { obj }
//   SHELL_LOOKS (by shell id: body, the moments it has, how long a held one stays)   SHELL_FAMILY_TINT   shellTint(row)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../progress/weather.js';

/** A family's colour: its rounds' glaze bead and tail (the runner's FAMILY_COLOR was the placeholder). */
export const SHELL_FAMILY_TINT = { edge: 0xe6dccb, ember: 0xff7a2a, storm: 0x9fd0ff, pull: 0x8a7aff, clock: 0xe8d080, will: 0xc890d8, company: 0xc46a45, feelings: 0xffffff };
export const shellTint = (row) => (row?.n?.feeling ? COLOR[row.n.feeling] : SHELL_FAMILY_TINT[row?.family]) ?? 0xffffff;

// (how long a held look stays: the shell's `dur`, or its own)
const DUR = (row) => row.n.dur ?? 3;
/** Each shell's look. body: a round's (BODIES); fly / touch / fire / set: it has that moment's effect; land: where its landing look sits
 *  ('point', 'target' its creature, 'foes' every creature in its reach); hold: how long a held one stays (real s); r: its reach for the
 *  effect's spread. */
export const SHELL_LOOKS = {
  ricochetSaw: { body: 'wheel', fly: true, touch: true, land: false },
  skipstone: { body: 'stone', fly: true, touch: true, land: false },
  hailstorm: { fire: true },
  mallet: { body: 'mallet', fly: true, land: 'point' },
  pinball: { body: 'ball', fly: true, touch: true },
  flamer: { fire: 'muzzle', hold: DUR },
  napalm: { body: 'bead', land: 'point', hold: (row) => row.n.delay + row.n.dur, r: (row) => row.n.r * 0.8 },
  detonator: { body: 'putty', fly: true, set: 'putty', land: false },
  cinder: { body: 'ember', fly: true },
  lightningRod: { land: 'target', hold: DUR },
  staticCling: { land: 'target', hold: DUR },
  inhaler: { fire: 'muzzle', hold: () => 1.2 },
  clod: { body: 'clod', fly: true },
  balloon: { land: 'target', hold: DUR },
  leadweight: { land: 'target', hold: DUR },
  weatherAway: { land: 'target', hold: DUR, mesh: true },
  infector: { land: 'target', hold: DUR },
  tauntDoll: { body: 'doll', fly: true, set: 'doll', hold: DUR },
  pottify: { land: 'point' },
  stageFright: { land: 'foes', hold: DUR },
  paranoia: { land: 'target', hold: DUR },
  lullaby: { land: 'point', hold: DUR, r: (row) => row.n.r * 0.6 },
  forgetMe: { land: 'target', courier: true, hold: DUR },
  agents: { body: 'clapper', fly: true },
  overdrive: { fire: 'courier', hold: DUR },
  wonder: { land: 'point', hold: DUR },
  mirth: { land: 'point' },
  desire: { land: 'point', hold: DUR, r: (row) => Math.min(8, row.n.r * 0.5) },
  fury: { land: 'target', hold: DUR },
  gall: { land: 'point', hold: DUR, r: (row) => row.n.r * 0.6 },
  grief: { land: 'target', hold: DUR, over: true },
  dread: { land: 'point' },
};

// ---------------------------------------------------------------- the bodies (module-wide, never disposed: the casebook's rules 17, 18)
const CACHE = {};
const once = (k, make) => (CACHE[k] ||= make());
const lit = (color, o = {}) => once(`m${color}${JSON.stringify(o)}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o }));
const MAT = {
  clay: () => lit(0xb4603f, { roughness: 0.85 }),
  gold: () => lit(0xffd76a, { metalness: 0.8, roughness: 0.3, emissive: 0x4a3200 }),
  stone: () => lit(0x8a6ad0, { roughness: 0.2, metalness: 0.15, emissive: 0x24164a }),
  chrome: () => lit(0xe8eef4, { metalness: 0.85, roughness: 0.12, emissive: 0x30343a }),
  putty: () => lit(0xd8d0c0, { roughness: 0.95 }),
  wood: () => lit(0x7a5a3a, { roughness: 0.8 }),
  red: () => lit(0xc8402a, { roughness: 0.35 }),
  white: () => lit(0xf3efe6, { roughness: 0.35 }),
  bead: () => lit(0x401008, { emissive: 0xff3a2a, emissiveIntensity: 1.6 }), // (lit, glowing: the plain lit program, nothing compiled)
  ember: () => lit(0x402010, { emissive: 0xffb060, emissiveIntensity: 2 }),
  glaze: (c) => lit(c, { roughness: 0.3, emissive: c, emissiveIntensity: 0.35 }),
};
const GEO = {
  wheel: () => once('gWheel', () => new THREE.CylinderGeometry(0.085, 0.085, 0.1, 18)),
  rim: () => once('gRim', () => new THREE.TorusGeometry(0.085, 0.014, 6, 24).rotateX(Math.PI / 2)),
  stone: () => once('gStone', () => new THREE.IcosahedronGeometry(0.075, 1).scale(1, 0.35, 1)),
  ball: () => once('gBall', () => new THREE.SphereGeometry(0.1, 16, 12)),
  putty: () => once('gPutty', () => new THREE.DodecahedronGeometry(0.08, 0).scale(1, 0.75, 1)),
  dot: () => once('gDot', () => new THREE.SphereGeometry(0.03, 8, 6)),
  ember: () => once('gEmber', () => new THREE.IcosahedronGeometry(0.035, 0)),
  head: () => once('gHead', () => new THREE.CylinderGeometry(0.22, 0.22, 0.48, 14).rotateZ(Math.PI / 2)),
  handle: () => once('gHandle', () => new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6).translate(0, -0.3, 0)),
  pot: () => once('gPot', () => new THREE.CylinderGeometry(0.045, 0.065, 0.11, 10)),
  doll: () => once('gDoll', () => new THREE.CylinderGeometry(0.06, 0.09, 0.22, 10)),
  dollHead: () => once('gDollHead', () => new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.17, 0)),
  bead: () => once('gBead', () => new THREE.IcosahedronGeometry(0.08, 1)),
};
const part = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.userData.zoneFree = true; return m; };
/** Dress a round's mesh as its body (its geometry and material swapped for shared ones, parts added). Returns what turns it in flight. */
const BODIES = {
  wheel: (m) => { m.geometry = GEO.wheel(); m.material = MAT.clay(); m.add(part(GEO.rim(), MAT.gold())); return (raw) => { m.rotation.y += raw * 32; }; },
  stone: (m) => { m.geometry = GEO.stone(); m.material = MAT.stone(); return (raw) => { m.rotation.y += raw * 18; }; },
  ball: (m) => { m.geometry = GEO.ball(); m.material = MAT.chrome(); m.scale.setScalar(1); },
  putty: (m) => { m.geometry = GEO.putty(); m.material = MAT.putty(); m.scale.setScalar(1); m.add(part(GEO.dot(), MAT.bead(), 0.06)); },
  ember: (m) => { m.geometry = GEO.ember(); m.material = MAT.ember(); m.scale.setScalar(1); },
  clod: (m) => { m.geometry = GEO.putty(); m.material = MAT.clay(); m.scale.setScalar(1.2); return (raw) => { m.rotation.x += raw * 9; }; },
  clapper: (m) => { m.geometry = GEO.pot(); m.material = MAT.clay(); m.scale.setScalar(1.3); m.add(part(GEO.dot(), MAT.ember(), 0.09)); },
  doll: (m) => { m.geometry = GEO.doll(); m.material = MAT.red(); m.scale.setScalar(1); m.add(part(GEO.dollHead(), MAT.white())); return (raw) => { m.rotation.y += raw * 10; }; },
  // the Mallet: a round that blooms in flight into the clay head, tumbling
  mallet: (m) => {
    m.geometry = GEO.head(); m.material = MAT.clay(); m.add(part(GEO.handle(), MAT.wood())); m.scale.setScalar(0.15);
    let age = 0;
    return (raw) => { age += raw; m.scale.setScalar(0.15 + 0.85 * Math.min(1, age / 0.35) ** 2); m.rotation.x += raw * 7; };
  },
  bead: (m, row) => { m.geometry = GEO.bead(); m.material = MAT.glaze(shellTint(row)); m.scale.setScalar(1); },
};

// ---------------------------------------------------------------- the moments
const _v = new THREE.Vector3();
const PINK = new THREE.Color(0xff3020), _c = new THREE.Color();
/** A creature's body as one mesh, for a look worn on it (S4's craze): its own `body`, or the first mesh under it. */
function bodyMesh(c) {
  if (c?.body?.isMesh) return c.body;
  let hit = null;
  (c?.root || c?.group || c?.mesh)?.traverse?.((o) => { if (!hit && o.isMesh) hit = o; });
  return hit;
}
const centre = (c, out) => out.set(c.pos.x, c.pos.y + (c.height || 1) * 0.5, c.pos.z);
/** Play `name` held on a creature (at its middle, or over its head) until it falls or `t` real seconds pass. */
function onCreature(g, name, c, t, ctx = {}, over = false) {
  return g.vfx.play(name, { ...ctx, pos: centre(c, _v), follow: (h) => {
    if (!c.alive || h.t > t) return false;
    centre(c, h.pos); if (over) h.pos.y = c.pos.y + (c.height || 1) + 0.4;
    return true;
  } });
}
/** Play `name` at a place, let go after `t` real seconds (Infinity: it ends on its own). */
const atPlace = (g, name, pos, t, ctx = {}) => g.vfx.play(name, { ...ctx, pos, follow: (h) => h.t <= t });

const MOMENTS = {
  fly(g, row, L, { mesh, p, kind }) {
    const id = kind === 'clod' ? 'clod' : row.id, look = SHELL_LOOKS[id] || L;
    const turn = BODIES[look?.body || 'bead']?.(mesh, row);
    const name = look?.fly ? `shell.${id}.fly` : 'shell.trail', tint = shellTint(row);
    g.vfx.play(name, { pos: mesh.position, tint, follow: (h, raw) => {
      if (!mesh.parent) return false;
      h.pos.copy(mesh.position); turn?.(raw);
      if (id === 'pinball' && p?.vel) h.ctx.tint = _c.setHex(0xffffff).lerp(PINK, THREE.MathUtils.clamp((p.vel.length() - 16) / 32, 0, 1)).getHex();
      return true;
    } });
  },
  touch(g, row, L, { at, normal, ent }) {
    if (!L?.touch || !at) return;
    const crude = row.id === 'skipstone' && g.paintmap?.at?.(at.x, at.y, at.z)?.crude;
    g.vfx.play(`shell.${row.id}.touch${crude ? '.crude' : ''}`, { pos: at, normal, dir: normal, tint: row.id === 'skipstone' ? 0xb49be6 : 0xffd76a, floor: at.y - 0.05, ent });
  },
  land(g, row, L, { at, normal, target, dir }) {
    if (L?.land === false || !at) return;
    const tint = shellTint(row), t = L?.hold?.(row) ?? Infinity, r = L?.r?.(row) ?? 1, name = L?.land ? `shell.${row.id}.land` : 'shell.land';
    const ctx = { normal, dir, tint, r, floor: at.y - 0.05 };
    if (L?.land === 'target') {
      if (!target) return atPlace(g, 'shell.land', at, Infinity, ctx);
      onCreature(g, name, target, t, { ...ctx, target: L.mesh ? bodyMesh(target) : undefined, scale: 1 }, L.over);
      if (L.courier && g.player) g.vfx.play(`shell.${row.id}.courier`, { pos: g.player.pos, follow: (h) => h.t <= t && (h.pos.copy(g.player.pos), true) });
      return;
    }
    if (L?.land === 'foes') { for (const c of (g.creatures?.near?.(at, row.n.r) || []).filter((c) => c.alive && !c.ally)) onCreature(g, name, c, t, ctx); return; }
    atPlace(g, name, at, t, ctx);
  },
  fire(g, row, L, { muzzle, ray, camera, character }) {
    if (!L?.fire) return;
    if (row.id === 'inhaler' && g.shells?.runner?.stored > 0) return; // (it spits what it holds: the clods' own look)
    const name = `shell.${row.id}.fire`, t = L.hold?.(row) ?? Infinity, P = g.player;
    if (L.fire === 'courier') return g.vfx.play(name, { pos: P.pos, follow: (h) => h.t <= t && (h.pos.copy(P.pos), true) });
    if (L.fire === 'muzzle') return g.vfx.play(name, { pos: muzzle, dir: ray?.dir, follow: (h) => {
      if (h.t > t) return false;
      character?.gunPoint?.('muzzle', h.pos); if (camera) h.dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
      return true;
    } });
    g.vfx.play(name, { pos: muzzle, dir: ray?.dir });
  },
  set(g, row, L, { obj }) {
    if (!obj) return;
    if (L?.set === 'putty') { obj.geometry = GEO.putty(); obj.material = MAT.putty(); obj.scale.setScalar(1.2); obj.add(part(GEO.dot(), MAT.bead(), 0.06)); return; }
    if (L?.set !== 'doll') return;
    // the Taunt Doll set down (the runner's figure, painted): a red glazed body, a white head, a gold bell (its own sphere: the runner
    // disposes the figure's geometry when the doll goes)
    const [body, head] = obj.children;
    if (body) body.material = MAT.red();
    if (head) head.material = MAT.white();
    obj.add(part(new THREE.SphereGeometry(0.05, 8, 6).translate(0.16, 0.55, 0), MAT.gold()));
    const t = L.hold?.(row) ?? 6;
    g.vfx.play('shell.tauntDoll.set', { pos: obj.position, follow: (h) => !!obj.parent && h.t <= t + 0.5 && (h.pos.copy(obj.position), true) });
  },
};

/** The one call the runner makes, by shell id: what this moment of this shell looks like. Never throws into the runner. */
export function shellLook(game, moment, row, ctx = {}) {
  if (!game?.vfx || !row) return;
  try { MOMENTS[moment]?.(game, row, SHELL_LOOKS[row.id], ctx); } catch (e) { console.warn('shell look', row.id, moment, e); }
}
