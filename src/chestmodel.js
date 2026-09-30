// ---------------------------------------------------------------------------------------
// CHEST MODEL: the five chests, built from primitives (nothing is loaded), and the little machine that moves them. A chest is a hollow
// box with a half-round lid on a hinge at the back, a lock, straps, and, by tier, a great deal more: green paint and brass; blue lacquer
// and a gem; black-violet and gold with a crest and shards that circle it; and the prismatic one, black glass with a film of oil on it,
// bands that run through the colours of a spectrum, two rings that turn about it and a ring of cubes.
//
// It is a rig, not a mesh. Three springs make it feel alive: a SQUASH spring on the whole body (volume-preserving: when it is short it is
// fat, the classic squash and stretch), a HOP (a vertical velocity under gravity that lands with a squash of its own), and the LID (its
// own angle, velocity and a rest angle; it can rattle shut, be thrown open and bounce off its hinge stop). Everything that is done to a
// chest is an impulse to one of these, so a knock, a call, a landing and a burst are all the same few lines with different numbers.
//
// Prior art: animation's squash-and-stretch (Disney's first principle; "The Illusion of Life"), the treasure chests of Zelda, Dark Souls'
// mimics and Overwatch's loot boxes (each box is a character before it is a container), and the tier dress of Borderlands and Genshin
// (rarity is legible from the silhouette and the light before the colour is: more parts, more glow, something that moves around it).
//
//   const rig = new ChestRig(tier, { sky, halo });   scene.add(rig.root);
//   rig.poke({ squash: -6, hop: 3.4, lid: 4 });   rig.setOpen(true);   rig.update(dt, time, near);   rig.dispose();
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addOutline } from './outline.js';
import { TIERS } from './treasure.js';
import { oilMaterial } from './cubes.js';
import { Beam } from './vfx/beam.js';

export const CHEST = { W: 1.0, D: 0.64, H: 0.42, R: 0.32, SCALE: [0.86, 0.95, 1.05, 1.15, 1.26], OPEN: 1.95, STOP: 2.3 };

// what each tier is made of
const LOOK = [
  { wood: 0x8a5a3a, band: 0x54545c, trim: 0x6a6a72 },
  { wood: 0x2f7a68, band: 0xd9a441, trim: 0xe8c060 },
  { wood: 0x1d3f96, band: 0xc8d6ea, trim: 0xe6eefc },
  { wood: 0x261340, band: 0xf0c040, trim: 0xffdc70 },
  { wood: 0x040306, band: 0xffffff, trim: 0xffffff },
];

// the Tithe's sealed chest: no colour of any tier, so that nothing about it says what it is
const SEALED = { wood: 0x24242e, band: 0xe6e6f0, trim: 0xffffff, glow: 0xe8e8ff };

const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, r);

export class ChestRig {
  constructor(tier, { sky = null, halo = null, sealed = false } = {}) {
    const { W, D, H, R } = CHEST, T = sealed ? { ...TIERS[0], glow: SEALED.glow } : TIERS[tier], L = sealed ? SEALED : LOOK[tier];
    this.tier = tier; this.sealed = sealed; this.glowColor = T.glow;
    this.root = new THREE.Group();
    this.scale = sealed ? 1.0 : CHEST.SCALE[tier];
    this.root.scale.setScalar(this.scale);
    this.body = new THREE.Group(); this.root.add(this.body);
    this.geos = []; this.mats = [];
    this.prism = []; // (materials that run through the spectrum)
    this.orbit = null; this.rings = []; this.pulse = []; // (things that move on their own: see update)

    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const std = (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, ...(o.metalness > 0.3 ? { envMap: sky, envMapIntensity: 0.9 } : {}), ...o }));
    const glowMat = (o = {}) => track(new THREE.MeshBasicMaterial({ color: T.glow, ...o }));
    this.oil = tier === 4 ? oilMaterial({ env: sky, envIntensity: 0.3, uni: { uOil: { value: 0.55 }, uOilPow: { value: 3.2 }, uHue: { value: 0 } } }) : null;
    if (this.oil) this.mats.push(this.oil.mat);
    const wood = this.oil ? this.oil.mat : std(L.wood, { roughness: 0.78 });
    const lidMat = this.oil ? this.oil.mat : std(L.wood, { roughness: 0.78, side: THREE.DoubleSide });
    const metal = tier === 4 ? null : std(L.band, { roughness: 0.36, metalness: 0.75, side: THREE.DoubleSide });
    const bandMat = () => { if (tier !== 4) return metal; const m = track(new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); this.prism.push(m); return m; };
    const add = (parent, geo, mat, x = 0, y = 0, z = 0, outline = true) => {
      track(geo);
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      parent.add(m); if (outline) addOutline(m);
      return m;
    };

    // ---- the hollow base: floor, four walls
    const wall = 0.06, fl = 0.08;
    add(this.body, rbox(W, fl, D), wood, 0, fl / 2, 0);
    add(this.body, rbox(W, H - fl, wall), wood, 0, fl + (H - fl) / 2, D / 2 - wall / 2);
    add(this.body, rbox(W, H - fl, wall), wood, 0, fl + (H - fl) / 2, -D / 2 + wall / 2);
    for (const s of [-1, 1]) add(this.body, rbox(wall, H - fl, D - 2 * wall), wood, s * (W / 2 - wall / 2), fl + (H - fl) / 2, 0);
    // planks on the front (two thin grooves) for a little grain
    if (tier < 4) for (const x of [-0.17, 0.17]) add(this.body, new THREE.BoxGeometry(0.012, H - 0.12, 0.004), std(0x000000, { transparent: true, opacity: 0.35 }), x, 0.25, D / 2 + 0.002, false);
    // straps around the base, corner posts, a lock
    for (const x of [-0.28, 0.28]) add(this.body, rbox(0.1, H - 0.05, D + 0.035, 0.012), bandMat(), x, (H - 0.05) / 2 + 0.03, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(this.body, rbox(0.075, H + 0.01, 0.075, 0.015), tier === 4 ? bandMat() : std(L.trim, { roughness: 0.4, metalness: 0.7 }), sx * (W / 2 - 0.02), (H + 0.01) / 2, sz * (D / 2 - 0.02));
    const lockMat = tier === 4 ? bandMat() : std(L.trim, { roughness: 0.35, metalness: 0.8 });
    add(this.body, rbox(0.17, 0.2, 0.05, 0.015), lockMat, 0, H - 0.05, D / 2 + 0.03);
    this.keyhole = add(this.body, new THREE.BoxGeometry(0.028, 0.06, 0.012), glowMat(), 0, H - 0.06, D / 2 + 0.058, false);
    // ---- the inside: a lit floor, and what is on it
    this.floorGlow = add(this.body, new THREE.PlaneGeometry(W - 2 * wall, D - 2 * wall), glowMat({ transparent: true, opacity: 0 }), 0, fl + 0.005, 0, false);
    this.floorGlow.rotation.x = -Math.PI / 2;
    this.mound = this.buildMound(tier, sky, add);
    // ---- the lid: a half cylinder on the hinge at the back
    this.lid = new THREE.Group(); this.lid.position.set(0, H, -D / 2); this.body.add(this.lid);
    const shell = new THREE.CylinderGeometry(R, R, W, 20, 1, false, 0, Math.PI); shell.rotateZ(Math.PI / 2);
    add(this.lid, shell, lidMat, 0, 0, D / 2);
    for (const s of [-1, 1]) {
      const cap = new THREE.CircleGeometry(R, 20, 0, Math.PI); cap.rotateY(s * Math.PI / 2);
      add(this.lid, cap, lidMat, s * W / 2, 0, D / 2, false);
    }
    for (const x of [-0.28, 0.28]) {
      const strap = new THREE.CylinderGeometry(R + 0.014, R + 0.014, 0.1, 20, 1, true, 0, Math.PI); strap.rotateZ(Math.PI / 2);
      add(this.lid, strap, bandMat(), x, 0, D / 2, false);
    }
    add(this.lid, rbox(0.13, 0.13, 0.05, 0.012), lockMat, 0, 0.05, D + 0.008); // (the hasp)
    add(this.lid, new THREE.PlaneGeometry(W - 0.02, D - 0.02), std(0x120806, { side: THREE.DoubleSide }), 0, 0.004, D / 2, false).rotation.x = Math.PI / 2; // (the underside)
    // ---- the seam: light that leaks out around the lid before it opens
    this.seamMat = glowMat({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const [w, d, x, z] of [[W + 0.03, 0.035, 0, D / 2], [W + 0.03, 0.035, 0, -D / 2], [0.035, D + 0.03, W / 2, 0], [0.035, D + 0.03, -W / 2, 0]]) add(this.body, new THREE.BoxGeometry(w, 0.02, d), this.seamMat, x, H + 0.004, z, false);
    // ---- what the tier adds
    this.gem = null;
    if (tier >= 1) {
      for (let i = 0; i < 8; i++) add(this.body, new THREE.SphereGeometry(0.018, 6, 4), tier === 4 ? bandMat() : std(L.trim, { metalness: 0.8, roughness: 0.3 }), (i % 4 - 1.5) * 0.19, i < 4 ? 0.06 : H - 0.03, D / 2 + 0.024, false);
      this.gem = add(this.lid, new THREE.OctahedronGeometry(tier === 1 ? 0.05 : tier === 2 ? 0.075 : 0.095), glowMat(), 0, R + 0.03, D / 2, false);
      this.gem.scale.y = 1.35; this.pulse.push(this.gem.material);
    }
    if (tier >= 2) for (const s of [-1, 1]) { const ear = add(this.lid, new THREE.ConeGeometry(0.05, 0.16, 5), tier === 4 ? bandMat() : std(L.trim, { metalness: 0.7, roughness: 0.3 }), s * (W / 2 + 0.03), R * 0.55, D / 2); ear.rotation.z = -s * 1.1; }
    if (tier >= 3) {
      for (let i = -3; i <= 3; i++) { const sp = add(this.lid, new THREE.ConeGeometry(0.03, 0.15 - Math.abs(i) * 0.012, 4), tier === 4 ? bandMat() : glowMat(), i * 0.11, R + 0.02, D / 2, false); if (tier === 3) this.pulse.push(sp.material); }
      this.orbit = new THREE.Group(); this.orbit.position.y = 0.95; this.root.add(this.orbit);
      const n = tier === 3 ? 4 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const geo = tier === 3 ? new THREE.OctahedronGeometry(0.07) : rbox(0.09, 0.09, 0.09, 0.02);
        const m = add(this.orbit, geo, tier === 3 ? glowMat() : this.oil.mat, Math.cos(a) * 0.92, Math.sin(i * 2.1) * 0.12, Math.sin(a) * 0.92, false);
        m.userData.a = a; m.userData.p = i; if (tier === 3) { m.scale.y = 1.7; this.pulse.push(m.material); }
      }
    }
    if (tier === 4) {
      for (let i = 0; i < 2; i++) {
        const r = add(this.root, new THREE.TorusGeometry(1.1 - i * 0.16, 0.012, 6, 80), (() => { const m = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); this.prism.push(m); return m; })(), 0, 0.72, 0, false);
        r.rotation.set(Math.PI / 2 + (i ? 0.7 : -0.5), 0, i ? 0.4 : -0.3); r.userData.spin = i ? -0.5 : 0.7; this.rings.push(r);
      }
    }
    // ---- light: a soft pool on the floor, an aura, and (for the upper tiers) a pillar
    this.halo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: halo, color: T.glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })));
    this.halo.position.y = 0.5; this.halo.scale.setScalar(2.6 + tier * 0.7); this.halo.renderOrder = 4; this.root.add(this.halo);
    this.pool = new THREE.Mesh(track(new THREE.CircleGeometry(1.35, 32)), glowMat({ map: halo, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.pool.rotation.x = -Math.PI / 2; this.pool.position.y = 0.025; this.pool.renderOrder = 2; this.root.add(this.pool);
    this.pillar = tier >= 3 ? new Beam(this.root, { radius: 0.45, height: 7, color: T.glow, foot: 1.3 }) : null;

    // ---- the state of the machine
    this.baseOpacity = [0, 0.11, 0.17, 0.26, 0.3][tier];
    this.lidA = 0; this.lidV = 0; this.hold = 0; // (the lid: angle, velocity, and the angle it rests at)
    this.sy = 1; this.sv = 0;                   // (squash: the body's height scale and how fast it is changing)
    this.hy = 0; this.hv = 0;                   // (the hop)
    this.glow = 0; this.lit = 0;               // (how lit: the seam, the floor, the keyhole; and the extra light of an open chest)
    this.open = false; this.callT = 3 + Math.random() * 5; this.later = [];
    this.hue = Math.random();
    this.onLand = null; this.onClack = null;
    this.setGlow(0);
    this.apply();
  }

  /** The heap of cubes inside, and a few of the tier's own gems in it. */
  buildMound(tier, sky, add) {
    const n = [4, 8, 14, 22, 34][tier], { W, D } = CHEST;
    const g = new THREE.Group(); this.body.add(g);
    const mat = this.oil ? this.oil.mat : oilMaterial({ env: sky }).mat;
    if (!this.oil) this.mats.push(mat);
    const geo = rbox(0.1, 0.1, 0.1, 0.022); this.geos.push(geo);
    const im = new THREE.InstancedMesh(geo, mat, n); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 0.7), a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r * (W / 2 - 0.13), z = Math.sin(a) * r * (D / 2 - 0.13);
      const y = 0.13 + (1 - r) * 0.13 + Math.random() * 0.03;
      q.setFromEuler(new THREE.Euler(Math.random() * 2, Math.random() * 6, Math.random() * 2));
      s.setScalar(0.85 + Math.random() * 0.4);
      im.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, s));
    }
    im.castShadow = false; g.add(im);
    return g;
  }

  // ---------------------------------------------------------------- what can be done to it
  /** Impulses: `squash` (negative squashes it down), `hop` (m/s up), `lid` (rad/s, positive opens). */
  poke({ squash = 0, hop = 0, lid = 0 } = {}) { this.sv += squash; if (hop) this.hv = Math.max(this.hv, hop); this.lidV += lid; }
  setOpen(open) { this.open = open; this.hold = open ? CHEST.OPEN : 0; }
  /** 0-1: how much the seam, the pool, the keyhole and the inside are lit. */
  setGlow(k) {
    this.glow = k;
    this.floorGlow.material.opacity = Math.min(0.8, k);
    this.pool.material.opacity = k * 0.4;
    this.keyhole.material.color.setHex(this.glowColor).multiplyScalar(0.5 + k * 1.6);
  }
  /** The colour of the glow (the roulette walks it through the tiers; a tier's own is the default). */
  setColor(c) {
    for (const m of [this.seamMat, this.floorGlow.material, this.pool.material]) m.color.set(c);
    this.halo.material.color.set(c);
    this.keyhole.material.color.set(c);
  }

  apply() {
    const s = Math.max(0.3, this.sy), w = 1 / Math.sqrt(s);
    this.body.scale.set(w, s, w);
    this.body.position.y = this.hy;
    this.lid.rotation.x = -this.lidA;
    if (this.orbit) this.orbit.position.y = 0.95 + this.hy;
  }

  // ---------------------------------------------------------------- per frame
  update(dt, t, near = true, camDist = 99) {
    for (let i = this.later.length - 1; i >= 0; i--) { const q = this.later[i]; q.t -= dt; if (q.t <= 0) { this.later.splice(i, 1); q.fn(); } }
    // the springs
    this.sv += ((1 - this.sy) * 240 - this.sv * 13) * dt; this.sy += this.sv * dt;
    if (this.hy > 0 || this.hv > 0) {
      this.hv -= 22 * dt; this.hy += this.hv * dt;
      if (this.hy <= 0) { const v = -this.hv; this.hy = 0; this.hv = 0; this.sv -= v * 1.5; this.onLand?.(v); }
    }
    // the lid: a spring to where it rests, with a hinge stop it bounces off and a floor it clacks on
    this.lidV += ((this.hold - this.lidA) * 70 - this.lidV * (this.hold ? 6 : 9)) * dt; this.lidA += this.lidV * dt;
    if (this.lidA > CHEST.STOP) { this.lidA = CHEST.STOP; if (this.lidV > 1) this.onClack?.(this.lidV, true); this.lidV *= -0.38; }
    if (this.lidA < 0) { this.lidA = 0; if (this.lidV < -0.8) this.onClack?.(-this.lidV, false); this.lidV *= -0.3; }
    this.seamMat.opacity = Math.min(1, this.glow * 1.2) * (1 - Math.min(1, this.lidA * 3));
    this.apply();
    if (!near) return;
    // the tier's own life
    const L = { glow: this.glowColor };
    const breathe = 0.78 + 0.22 * Math.sin(t * 1.5 + this.hue * 6);
    // (the aura is a sprite: a camera close to it would be looking through a fog, so it thins as the eye comes in)
    const shy = THREE.MathUtils.smoothstep(camDist, 0.9, 3.2);
    this.halo.material.opacity = Math.min(0.5, (this.baseOpacity * (this.open ? 0.5 : 1) + this.lit * 0.4 + this.glow * 0.3) * breathe) * shy;
    if (this.pillar) this.pillar.set(this.prism.length ? null : L.glow, this.open ? 0.05 : 0.1 + this.glow * 0.5, 1 + this.glow * 0.6);
    for (const m of this.pulse) m.color.setHex(L.glow).multiplyScalar(0.75 + 0.5 * Math.abs(Math.sin(t * 1.3 + this.hue * 5)));
    if (this.orbit) {
      this.orbit.rotation.y += dt * (0.5 + this.glow * 3);
      for (const c of this.orbit.children) c.position.y = Math.sin(t * 1.2 + c.userData.p * 1.7) * 0.14;
    }
    for (const r of this.rings) r.rotation.z += dt * r.userData.spin * (1 + this.glow * 4);
    if (this.prism.length) {
      this.hue = (this.hue + dt * 0.06) % 1;
      this.prism.forEach((m, i) => m.color.setHSL((this.hue + i * 0.09) % 1, 0.85, 0.6));
      this.halo.material.color.setHSL((this.hue + 0.3) % 1, 0.8, 0.6);
      if (this.pillar) this.pillar.uniforms.uColor.value.setHSL((this.hue + 0.3) % 1, 0.8, 0.6);
      if (this.oil) this.oil.uni.uHue.value = this.hue;
    }
    // a chest that is waiting calls to you now and then: a crouch, a hop, a wobble of the lid
    if (!this.open && !this.busy) {
      this.callT -= dt;
      if (this.callT <= 0) { this.callT = [11, 9, 7, 5.5, 4.5][this.tier] + Math.random() * 4; this.call(); }
    }
  }

  /** The chest calling for attention: a crouch, a leap, a rattle on the way down. */
  call() { this.poke({ squash: -7, lid: 1.2 }); this.later.push({ t: 0.15, fn: () => this.poke({ hop: 3.2 + this.tier * 0.35, squash: 6, lid: 5 }) }); }

  dispose() {
    this.root.parent?.remove(this.root);
    this.pillar?.dispose?.();
    for (const g of this.geos) g.dispose?.();
    for (const m of this.mats) m.dispose?.();
  }
}
