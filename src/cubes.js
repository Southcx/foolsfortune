// ---------------------------------------------------------------------------------------
// LACHRYMA CUBES: what Lachryma becomes when it is condensed. Small black cubes with the sheen of oil on water: near-black, hard,
// rounded at the edges, and iridescent: a thin film on the surface turns whatever it reflects (the painted sky, here) through the
// colours at a glancing angle, so a cube in the hand is never one colour and never the same twice. They are the currency: chests are
// full of them, a zandatsu takes them out of a clapperjar, the Tithe is paid in them. The balance is the ledger's (`cube.earned` minus
// `cube.spent`): nothing here keeps a number of its own but the readout.
//
// They are physical: they fountain out of a chest, clack on the floor (a glass tick that rises with each you pick up in a row), bounce and
// settle; after a moment those within reach are drawn to the Courier and taken. Drawn as ONE instanced mesh (a hundred and fifty cubes
// is a prismatic chest), each cube a rigid body of its own. A cube's size follows its worth (a cube worth 40 is a fat one).
//
// Prior art: the loose currency of every looter (Diablo's gold, Borderlands' cash: it comes out of the thing you opened, it falls, you
// walk through it), the ascending chime of Mario's coin and Zelda's rupees when many are taken in a row, and the oil-slick sheen of
// Gaussian-thin-film iridescence (three.js's MeshPhysicalMaterial.iridescence, after Belcour & Barla's thin-film BRDF).
//
//   game.cubes.burst(pos, worth, { count, spread, up, stagger })     a fountain of cubes worth `worth` in all
//   game.cubes.balance   game.cubes.earn(n, why)   game.cubes.spend(n, why) -> true | false
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RAPIER, G, groups } from './physics.js';
import { sfx } from './audio.js';

const PICKUP = 32;
const CUBE_GROUPS = groups(PICKUP, G.STATIC | G.PROP | PICKUP); // (they pile against each other, and nothing else that is loose)
const MAX = 320, SIZE = 0.14;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Vector3();

const CSS = `
#cubes { position: absolute; right: 30px; bottom: calc(166px + var(--cine, 0vh)); display: flex; align-items: center; gap: 8px; opacity: 0; transform: translateY(6px); transition: opacity .3s, transform .3s; pointer-events: none; }
#cubes.on { opacity: 1; transform: none; }
#cubes i { display: block; width: 15px; height: 15px; background: linear-gradient(135deg, #100b18 0%, #2a1a3a 42%, #0c0812 100%); border: 1px solid transparent; border-radius: 3px;
  background-clip: padding-box; box-shadow: 0 0 0 1px rgba(160,120,255,.55), 0 0 8px rgba(120,220,255,.35), inset 0 0 6px rgba(255,120,220,.35); transform: rotate(45deg) scale(.82); }
#cubes b { font: 16px var(--f-sys); color: #fff1dc; text-shadow: 1px 1px 0 rgba(8,3,1,.8); }
#cubes.pop i { animation: cubepop .42s cubic-bezier(.2, 1.6, .4, 1); }
@keyframes cubepop { 0% { transform: rotate(45deg) scale(.82); } 22% { transform: rotate(45deg) scale(.6, 1.15); } 55% { transform: rotate(45deg) scale(1.3, .8); } 100% { transform: rotate(45deg) scale(.82); } }
`;

/**
 * The oil-slick stuff: black glass with a film on it. A near-black body, a clear coat, a dim reflection of the painted sky, and (in the
 * shader) a film whose colour follows the angle you look at it from and a per-instance offset (`aSeed`), so that no two cubes catch the
 * light the same way. One program serves everything made of it (the cubes, the prismatic chest, the orb).
 */
export function oilMaterial({ env = null, envIntensity = 0.22, color = 0x020203, uni = null } = {}) {
  uni = uni || { uOil: { value: 1.3 }, uOilPow: { value: 2.2 }, uHue: { value: 0 } };
  const mat = new THREE.MeshPhysicalMaterial({
    color, metalness: 0.0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04,
    envMap: env, envMapIntensity: envIntensity, emissive: 0x2a1450, emissiveIntensity: 0.0,
  });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSeed;\nvarying float vSeed;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeed = aSeed;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vSeed; uniform float uOil; uniform float uOilPow; uniform float uHue;
// the film: the slick's own run of colours (violet, teal, gold, magenta, and round again), walked by the angle of view and the cube's offset
vec3 oilFilm(float t) {
  t = fract(t) * 4.0;
  vec3 a = vec3(0.30, 0.06, 0.70), b = vec3(0.04, 0.55, 0.75), c = vec3(0.95, 0.72, 0.18), d = vec3(0.85, 0.10, 0.50);
  return t < 1.0 ? mix(a, b, smoothstep(0.0, 1.0, t)) : t < 2.0 ? mix(b, c, smoothstep(1.0, 2.0, t)) : t < 3.0 ? mix(c, d, smoothstep(2.0, 3.0, t)) : mix(d, a, smoothstep(3.0, 4.0, t));
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  float fres = pow(1.0 - ndv, uOilPow);
  vec3 film = oilFilm(fres * 0.8 + normal.y * 0.2 + vSeed + uHue);
  totalEmissiveRadiance += film * (0.03 + 1.5 * fres) * uOil;
}`);
  };
  mat.customProgramCacheKey = () => 'oil-slick';
  return { mat, uni };
}

export class Cubes {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.queue = [];
    this.combo = 0; this.comboT = 0; this.shown = -1; this.popT = 0;
    // (a cube left lying is a bright thing to anything that eats Lachryma: it may be swallowed, and carried until it bursts: ai/ecology.js)
    game.ai?.eco.provide('shiny', (pos, range) => this.list.filter((c) => c.state === 'loose' && c.age > 1.5 && c.pos.distanceTo(pos) < range).slice(0, 6)
      .map((c) => ({ pos: c.pos, ref: c, what: 'cube', alive: () => this.list.includes(c) && c.state === 'loose', take: (who) => { const w = this.steal(c); if (!w) return false; if (who) who.stash = (who.stash || 0) + w; return true; } })));
    this.geo = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 3, 0.02);
    this.seeds = new Float32Array(MAX);
    this.geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(this.seeds, 1).setUsage(THREE.DynamicDrawUsage));
    const oil = oilMaterial({ env: game.sky?.env ?? null });
    this.mat = oil.mat; this.uni = oil.uni;
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    game.scene.add(this.mesh);
    game.physics.collisionHandlers.push((h1, h2) => this.onCollision(h1, h2));
    // the readout
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div')); el.id = 'cubes';
    el.innerHTML = '<i></i><b>0</b>';
    (document.getElementById('hud') || document.body).appendChild(el);
    this.num = el.querySelector('b');
  }

  // ---------------------------------------------------------------- the currency (the ledger's numbers)
  get balance() { const L = this.game.ledger; return Math.max(0, Math.round(L.get('cube.earned') - L.get('cube.spent'))); }
  earn(n, why = 'pickup') { if (n > 0) this.game.ledger.inc('cube.earned', n); this.game.events?.emit('cube.earn', { n, why }); }
  spend(n, why = 'spend') {
    if (this.balance < n) return false;
    this.game.ledger.inc('cube.spent', n);
    this.game.events?.emit('cube.spend', { n, why });
    return true;
  }

  // ---------------------------------------------------------------- a fountain
  /** Cubes worth `worth` in all, out of `pos`. `stagger` (s) spreads them over time, as a chest lets them go. */
  burst(pos, worth, { count = null, spread = 1, up = 5, stagger = 0, spin = 6, from = 'spill' } = {}) {
    worth = Math.max(1, Math.round(worth));
    this.game.events?.emit('cube.spill', { n: worth, from });
    const n = Math.max(1, Math.min(count ?? Math.min(worth, 40), worth, 150));
    const each = Math.floor(worth / n); let extra = worth - each * n;
    for (let i = 0; i < n; i++) {
      const v = each + (i < extra ? 1 : 0);
      const a = Math.random() * Math.PI * 2, r = (0.4 + Math.random() * 1.7) * spread;
      const vel = new THREE.Vector3(Math.cos(a) * r, up * (0.75 + Math.random() * 0.6), Math.sin(a) * r);
      const at = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.1, (Math.random() - 0.5) * 0.2));
      if (stagger > 0) this.queue.push({ t: (i / n) * stagger, k: i / n, at, vel, v, spin });
      else this.spawnOne(at, vel, v, spin);
    }
  }

  spawnOne(pos, vel, worth, spin = 6) {
    if (this.list.length >= MAX) { this.absorbNow(this.list[0]); }
    const g = this.game, w = g.physics.world;
    const k = 0.9 + 0.16 * Math.cbrt(Math.max(1, worth));
    const h = SIZE * k / 2;
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setLinvel(vel.x, vel.y, vel.z)
      .setAngvel({ x: (Math.random() - 0.5) * spin * 2, y: (Math.random() - 0.5) * spin * 2, z: (Math.random() - 0.5) * spin * 2 })
      .setLinearDamping(0.2).setAngularDamping(1.4).setCcdEnabled(true));
    const col = w.createCollider(RAPIER.ColliderDesc.cuboid(h, h, h).setDensity(500).setRestitution(0.38).setFriction(0.55)
      .setCollisionGroups(CUBE_GROUPS).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    const c = { type: 'cube', body, col, k, worth, seed: Math.random(), age: 0, state: 'loose', pos: pos.clone(), quat: new THREE.Quaternion(), pop: 0, lastV: vel.length(), speed: 0 };
    g.physics.register(col, c);
    this.list.push(c);
    return c;
  }

  onCollision(h1, h2) {
    for (const h of [h1, h2]) {
      const c = this.game.physics.byCollider.get(h);
      if (c?.type !== 'cube' || c.state !== 'loose') continue;
      if (c.lastV > 1.4 && sfx.allow?.('cubeclack', 26)) sfx.cubeClack?.(c.lastV, this.game.listenerDistance(c.pos));
    }
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    const g = this.game, P = g.player;
    const chest = _c.copy(P.renderPos); chest.y += 1.0;
    // the ones let go a moment at a time
    for (let i = this.queue.length - 1; i >= 0; i--) { const q = this.queue[i]; q.t -= dt; if (q.t <= 0) { this.queue.splice(i, 1); this.spawnOne(q.at, q.vel, q.v, q.spin); sfx.cubePop?.(q.k); } }
    this.comboT -= dt;
    let n = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i];
      c.age += dt; c.pop = Math.min(1, c.pop + dt * 5);
      if (c.state === 'loose') {
        const t = c.body.translation(), r = c.body.rotation(), lv = c.body.linvel();
        c.pos.set(t.x, t.y, t.z); c.quat.set(r.x, r.y, r.z, r.w); c.lastV = Math.hypot(lv.x, lv.y, lv.z);
        if (t.y < -60 || c.age > 120) { this.drop(i); continue; }
        // once it has settled a moment, anything near enough is drawn to her
        const d = c.pos.distanceTo(chest);
        if (c.age > 0.9 && d < 7 && !g.chests?.locking) { c.state = 'absorb'; c.speed = 2.5; g.physics.removeBody(c.body); }
      } else {
        // drawn in: accelerating, and turning as it comes
        _p.subVectors(chest, c.pos);
        const d = _p.length();
        c.speed = Math.min(26, c.speed + dt * 48);
        const step = Math.min(d, c.speed * dt);
        if (d > 1e-3) c.pos.addScaledVector(_p.divideScalar(d), step);
        c.quat.multiply(_q.setFromAxisAngle(_s.set(0.4, 1, 0.2).normalize(), dt * 9));
        if (d < 0.3) { this.take(i); continue; }
      }
      // the pop: a cube appears with an overshoot (squash and stretch), and gets to size
      const u = c.pop, ov = u < 1 ? Math.sin(u * Math.PI * 0.5) * (1 + 0.5 * Math.sin(u * Math.PI)) : 1;
      const sq = c.state === 'absorb' ? 1 - Math.min(0.35, c.speed * 0.012) : 1; // (stretched along the way in)
      _s.set(c.k * ov / Math.sqrt(sq), c.k * ov * sq, c.k * ov / Math.sqrt(sq));
      _m.compose(c.pos, c.quat, _s);
      this.seeds[n] = c.seed;
      this.mesh.setMatrixAt(n++, _m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.geo.attributes.aSeed.needsUpdate = true;
    // the readout
    const b = this.balance;
    if (b !== this.shown) {
      const up = this.shown >= 0 && b > this.shown;
      this.shown = b; this.num.textContent = `${b}`;
      this.el.classList.toggle('on', b > 0);
      if (up) { this.el.classList.remove('pop'); void this.el.offsetWidth; this.el.classList.add('pop'); }
    }
  }

  take(i) {
    const c = this.list[i], g = this.game;
    this.earn(c.worth, 'pickup');
    this.combo = this.comboT > 0 ? this.combo + 1 : 0; this.comboT = 0.45;
    sfx.cubeGet?.(this.combo);
    g.fx.absorbSparkle?.(c.pos.clone());
    this.list.splice(i, 1);
  }
  /** Something else swallowed it (a jelly): gone from the floor, its worth with whatever took it. */
  steal(c) { const i = this.list.indexOf(c); if (i < 0 || c.state !== 'loose') return 0; this.game.physics.removeBody(c.body); this.list.splice(i, 1); return c.worth; }
  absorbNow(c) { const i = this.list.indexOf(c); if (i >= 0) { if (c.state === 'loose') this.game.physics.removeBody(c.body); this.earn(c.worth, 'overflow'); this.list.splice(i, 1); } }
  drop(i) { const c = this.list[i]; if (c.state === 'loose') this.game.physics.removeBody(c.body); this.earn(c.worth, 'recovered'); this.list.splice(i, 1); }
  /** Everything on the floor is taken (a reset must not cost anyone what a chest gave). */
  clear() {
    let n = 0;
    for (const c of this.list) { if (c.state === 'loose') this.game.physics.removeBody(c.body); n += c.worth; }
    for (const q of this.queue) n += q.v;
    this.list.length = 0; this.queue.length = 0; this.mesh.count = 0;
    if (n > 0) this.earn(n, 'recovered');
  }
  /** The sheen, for a show that wants the cubes to glow (the rave). */
  glow(color, k) { this.mat.emissive.set(color); this.mat.emissiveIntensity = k; }
}
