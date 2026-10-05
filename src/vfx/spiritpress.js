// ---------------------------------------------------------------------------------------
// THE SPIRIT PRESS: Soul Alchemy's station in the Shrine Garden (docs/DESIGN.md, section 16; progress/alchemy.js). Three parts, the
// owner's: a HOPPER the materials go into (in order: the order is the craft), an IGNITER that fires it, and a CRUCIBLE where they are
// pressed into the soul. It is a potter's machine, the vessel's own trade turned on the soul:
//
//   THE PLINTH     an octagon of stone with the HUE RING set round its rim: seven enamel tiles, each at an attribute's hue (at the
//                  targets' saturation), laid out round the press as they go round the colour wheel; the one the soul colour is inside
//                  is lit (`near`). The colour wheel is shown, never written
//   THE FIREBOX    a squat terracotta kiln drum with an arched mouth; its embers and a flame that rise with `fire`
//   THE CRUCIBLE   celadon, crazed (guan's crackle: the chest's glaze fired to its second stage, vfx/chestglaze.js; raku's black net
//                  and gold were tried and fought the bath), in a bronze cradle over the firebox; in it the BATH (a crucible's molten
//                  bath), the soul colour itself (`soul`), turning slowly (a liquid stirred: real
//                  movement, low in frequency), brighter as it is fired; grey when the soul is
//   THE SCREW      a bronze press screw through an oak beam on two posts, a capstan on top; `press` (0..1) turns it down and sinks
//                  the platen into the crucible
//   THE HOPPER     a copper funnel on the left post with a chute into the crucible; `queue` (hues, in order) shows the materials
//                  waiting in it, a lump each in its own colour, the first at the bottom
//   THE IGNITER    a bronze lever and flint wheel on the firebox's right, its knob red enamel; `pull` (0..1) swings it
// The press's screen (the map: the trail across the colour wheel) is the window's; this is the thing in the garden it belongs to.
//
// Prior art: the alchemist's ATHANOR (the furnace with a tower that fed it, "piger Henricus", the slow Henry: the hopper's ancestor)
// and the crucible on it, the screw press (the olive and wine press, Gutenberg's), Potion Craft's cauldron and its map (the colour as a
// place you steer to), Atelier's cauldron, and the painter's colour wheel round the rim.
//
//   const P = new SpiritPress({ env, hues })   scene.add(P.group)   P.parts (hopper, igniter, lever, crucible, bath, screw, hues)
//   P.set({ soul: { h, s }, fill, fire, press, pull, near, queue: [hue, ...] })   P.update(t)   (about 2.6 m tall; +Z its front)
//   hues: the seven attributes' hues, in order (progress/alchemy.js ATTRIBUTES; by default the same seventh-of-the-colour-wheel spacing)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../render/outline.js';
import { dressChestGlaze, chestGlazeUniforms } from './chestglaze.js';

const SEVEN = Array.from({ length: 7 }, (_, i) => Math.round(i * 360 / 7 + 20));
const SAT = 0.65; // (the targets' saturation: ECON.alchemy.sat)
const C = { stone: 0x6f6a64, clay: 0x8a4a30, bronze: 0xb08d57, copper: 0xb0683a, oak: 0x4a3426, body: 0xe8e0d0, red: 0xa8281c, dark: 0x120c0a };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function part(parent, geo, mat, x = 0, y = 0, z = 0, outline = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); if (outline) addOutline(m); return m;
}
/** The soul colour as the bath's colour: its hue, as saturated as the soul is; the grey soul a pale Lachryma silver. */
const soulColour = (c, out) => out.setHSL((((c.h % 360) + 360) % 360) / 360, Math.min(1, c.s * 1.3), 0.6 - 0.12 * Math.min(1, c.s));

export class SpiritPress {
  constructor({ env = null, hues = SEVEN } = {}) {
    const group = this.group = new THREE.Group(); group.name = 'spirit press';
    const P = this.parts = {};
    const stone = std(C.stone, { roughness: 0.9 }), clay = std(C.clay, { roughness: 0.95 }), oak = std(C.oak, { roughness: 0.8 });
    const bronze = std(C.bronze, { metalness: 0.8, roughness: 0.35, envMap: env }), copper = std(C.copper, { metalness: 0.75, roughness: 0.4, envMap: env, side: THREE.DoubleSide });
    const dark = std(C.dark, { roughness: 1 });

    // the plinth, and the hue ring round its rim
    part(group, new THREE.CylinderGeometry(0.95, 1.02, 0.16, 8), stone, 0, 0.08, 0);
    P.hues = hues.map((h) => {
      const col = new THREE.Color().setHSL(h / 360, SAT, 0.4);
      const m = std(col, { roughness: 0.25, metalness: 0.05, emissive: col.clone(), emissiveIntensity: 0.06 });
      const a = (h / 360) * Math.PI * 2, t = part(group, new THREE.BoxGeometry(0.2, 0.035, 0.11), m, Math.sin(a) * 0.84, 0.175, Math.cos(a) * 0.84, false);
      t.rotation.y = a; return t;
    });

    // the firebox: a kiln drum, its arched mouth to the front, embers and a flame in it
    part(group, new THREE.CylinderGeometry(0.5, 0.55, 0.62, 16), clay, 0, 0.47, 0);
    part(group, new THREE.TorusGeometry(0.52, 0.03, 6, 20), clay, 0, 0.78, 0).rotation.x = Math.PI / 2;
    const mouth = new THREE.Group(); mouth.position.set(0, 0.2, 0.545); group.add(mouth);
    const arch = new THREE.Shape(); arch.moveTo(-0.16, 0); arch.lineTo(0.16, 0); arch.lineTo(0.16, 0.12); arch.absarc(0, 0.12, 0.16, 0, Math.PI, false); arch.lineTo(-0.16, 0);
    part(mouth, new THREE.ShapeGeometry(arch, 8), dark, 0, 0, 0, false);
    part(mouth, new THREE.TorusGeometry(0.17, 0.022, 4, 14, Math.PI), clay, 0, 0.12, 0); // (the arch's brick lip)
    this.emberMat = std(0x2a120a, { emissive: new THREE.Color(0xff6a20), emissiveIntensity: 0.15, roughness: 1 });
    part(mouth, new THREE.BoxGeometry(0.28, 0.05, 0.02), this.emberMat, 0, 0.03, 0.005, false);
    this.flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    P.flame = part(mouth, new THREE.ConeGeometry(0.08, 0.22, 10, 1, true), this.flameMat, 0, 0.14, 0.01, false); P.flame.castShadow = false;

    // the crucible in its cradle: celadon, crazed; the bath in it
    const cru = P.crucible = new THREE.Group(); cru.position.y = 0.8; group.add(cru);
    part(cru, new THREE.TorusGeometry(0.4, 0.035, 6, 18), bronze, 0, 0.02, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; part(cru, new THREE.BoxGeometry(0.05, 0.16, 0.05), bronze, Math.sin(a) * 0.42, -0.04, Math.cos(a) * 0.42); }
    const prof = [[0, -0.1], [0.22, -0.1], [0.35, 0.02], [0.42, 0.18], [0.44, 0.32], [0.47, 0.37], [0.41, 0.38], [0.37, 0.31], [0.34, 0.13], [0.22, 0.02], [0, 0.02]].map(([x, y]) => new THREE.Vector2(x, y));
    const cruM = std(C.body, { roughness: 0.5 });
    const gU = this.glazeU = chestGlazeUniforms(0.8); gU.uGlaze.value = 1.5; dressChestGlaze(cruM, gU);
    part(cru, new THREE.LatheGeometry(prof, 24), cruM, 0, 0, 0);
    this.bathU = { uT: { value: 0 }, uSoul: { value: new THREE.Color(0.75, 0.78, 0.82) }, uHeat: { value: 0 } };
    const bath = this.bathMat = std(0x0c0a10, { roughness: 0.15, metalness: 0.2, envMap: env });
    bath.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.bathU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vBathP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBathP = position.xy;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uT, uHeat; uniform vec3 uSoul; varying vec2 vBathP;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec2 q = vBathP; float r = length(q), a = atan(q.y, q.x);
  float swirl = 0.5 + 0.5 * sin(a * 3.0 + r * 7.0 - uT * 0.7) * (1.0 - 0.5 * r); // (stirred: three slow arms turning, a liquid's own movement)
  totalEmissiveRadiance += uSoul * (0.35 + 0.65 * uHeat) * (0.55 + 0.45 * swirl) + vec3(1.0, 0.95, 0.85) * uHeat * uHeat * (1.0 - smoothstep(0.0, 0.5, r)) * 0.35; }`);
    };
    bath.customProgramCacheKey = () => 'spirit-bath';
    P.bath = part(cru, new THREE.CircleGeometry(1, 24), bath, 0, 0.1, 0, false); P.bath.rotation.x = -Math.PI / 2;

    // the frame: two oak posts capped in bronze, a beam; the screw through it, a capstan on top, the platen under it
    for (const s of [-1, 1]) {
      part(group, new THREE.BoxGeometry(0.14, 2.14, 0.14), oak, s * 0.72, 1.23, 0);
      part(group, new THREE.BoxGeometry(0.18, 0.06, 0.18), bronze, s * 0.72, 2.4, 0);
    }
    part(group, new THREE.BoxGeometry(1.7, 0.18, 0.2), oak, 0, 2.28, 0);
    const screw = P.screw = new THREE.Group(); group.add(screw);
    part(screw, new THREE.CylinderGeometry(0.055, 0.055, 1.3, 10), bronze, 0, 2.0, 0);
    const helix = []; for (let i = 0; i <= 160; i++) { const u = i / 160, a = u * Math.PI * 2 * 9; helix.push(new THREE.Vector3(Math.cos(a) * 0.07, 1.42 + u * 1.12, Math.sin(a) * 0.07)); }
    part(screw, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 320, 0.018, 5), bronze, 0, 0, 0, false);
    part(screw, new THREE.CylinderGeometry(0.29, 0.29, 0.06, 18), bronze, 0, 1.36, 0); // (the platen)
    const cap = P.capstan = new THREE.Group(); cap.position.y = 2.68; screw.add(cap);
    part(cap, new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10), bronze, 0, 0, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2, sp = part(cap, new THREE.CylinderGeometry(0.022, 0.022, 0.5, 6), oak, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3);
      sp.rotation.set(0, -a, Math.PI / 2);
      part(cap, new THREE.SphereGeometry(0.045, 8, 6), bronze, Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56);
    }

    // the hopper: a copper funnel bracketed to the left post, a chute into the crucible, the materials waiting in it
    const hop = P.hopper = new THREE.Group(); hop.position.set(-0.44, 1.62, 0.12); group.add(hop);
    const fun = part(hop, new THREE.CylinderGeometry(0.28, 0.06, 0.42, 4, 1, true), copper, 0, 0.21, 0); fun.rotation.y = Math.PI / 4;
    part(hop, new THREE.TorusGeometry(0.2, 0.02, 4, 4), bronze, 0, 0.42, 0).rotation.set(Math.PI / 2, 0, Math.PI / 4);
    part(hop, new THREE.BoxGeometry(0.24, 0.05, 0.05), bronze, -0.16, 0.2, -0.08); // (the bracket to the post)
    const chute = part(hop, new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10, 1, true, Math.PI, Math.PI), copper, 0.12, -0.21, 0); // (open to the sky)
    chute.rotation.z = 0.52; // (from the funnel's foot down to the crucible's lip)
    this.lumps = []; P.queue = new THREE.Group(); hop.add(P.queue);
    const lumpG = new THREE.DodecahedronGeometry(0.045);
    for (let i = 0; i < 6; i++) {
      const m = std(0xffffff, { roughness: 0.45, emissive: new THREE.Color(0), emissiveIntensity: 0.25 });
      const l = part(P.queue, lumpG, m, ((i * 37) % 5 - 2) * 0.03, 0.07 + i * 0.055, ((i * 23) % 5 - 2) * 0.025, false);
      l.rotation.set(i * 1.3, i * 2.1, 0); l.visible = false; this.lumps.push(l);
    }

    // the igniter: a feed pipe into the firebox, a flint wheel, a lever with a red knob
    const ig = P.igniter = new THREE.Group(); ig.position.set(0.6, 0.42, 0.18); group.add(ig);
    part(ig, new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), bronze, -0.06, 0, 0).rotation.z = Math.PI / 2;
    part(ig, new THREE.CylinderGeometry(0.07, 0.07, 0.03, 14), bronze, 0.03, 0, 0).rotation.z = Math.PI / 2;
    const lever = P.lever = new THREE.Group(); lever.position.x = 0.06; ig.add(lever);
    part(lever, new THREE.BoxGeometry(0.035, 0.4, 0.035), bronze, 0, 0.2, 0);
    part(lever, new THREE.SphereGeometry(0.05, 10, 8), std(C.red, { roughness: 0.3 }), 0, 0.42, 0);

    this.k = { soul: { h: 0, s: 0 }, fill: 0.6, fire: 0, press: 0, pull: 0, near: -1, queue: [] };
    this.set();
  }

  /** The press's state: the soul colour in the bath, how full the crucible is, the fire, the screw, the igniter, the lit tile, the hopper. */
  set({ soul, fill, fire, press, pull, near, queue } = {}) {
    const k = this.k, P = this.parts;
    if (soul) k.soul = { h: soul.h, s: soul.s };
    if (fill !== undefined) k.fill = THREE.MathUtils.clamp(fill, 0, 1);
    if (fire !== undefined) k.fire = THREE.MathUtils.clamp(fire, 0, 1);
    if (press !== undefined) k.press = THREE.MathUtils.clamp(press, 0, 1);
    if (pull !== undefined) k.pull = THREE.MathUtils.clamp(pull, 0, 1);
    if (near !== undefined) k.near = near;
    if (queue) k.queue = queue.slice(0, this.lumps.length);
    soulColour(k.soul, this.bathU.uSoul.value);
    this.bathU.uHeat.value = k.fire;
    const lv = 0.04 + k.fill * 0.24, r = 0.24 + (0.36 - 0.24) * ((lv - 0.02) / 0.29); // (the bath's level, and its width there: the crucible's inner wall)
    P.bath.position.y = lv; P.bath.scale.setScalar(r);
    P.screw.position.y = -k.press * 0.3; P.capstan.rotation.y = k.press * Math.PI * 3;
    P.lever.rotation.x = -k.pull * 0.9;
    this.emberMat.emissiveIntensity = 0.15 + 1.6 * k.fire;
    this.flameMat.opacity = 0.85 * k.fire; P.flame.scale.set(0.6 + 0.5 * k.fire, 0.3 + 0.9 * k.fire, 0.6 + 0.5 * k.fire);
    P.hues.forEach((t, i) => { t.material.emissiveIntensity = i === k.near ? 1.2 : 0.06; t.position.y = i === k.near ? 0.19 : 0.175; }); // (lit, and raised a little: a key pressed up)
    this.lumps.forEach((l, i) => {
      const h = k.queue[i]; l.visible = h !== undefined;
      if (l.visible) { l.material.color.setHSL(h / 360, SAT, 0.5); l.material.emissive.setHSL(h / 360, SAT, 0.3); }
    });
  }

  /** Per frame: the bath turns, and the flame breathes a little with the fire under it. */
  update(t) {
    this.bathU.uT.value = t;
    if (this.k.fire > 0) this.parts.flame.scale.y = (0.3 + 0.9 * this.k.fire) * (1 + 0.06 * Math.sin(t * 5.0));
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); } });
  }
}
