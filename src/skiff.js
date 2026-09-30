import * as THREE from 'three';
import { PALETTE } from './config.js';
import { addOutline } from './outline.js';

// ---------------------------------------------------------------------------------------
// THE SKIFF: the Solar Skiff's body. A small hovering boat with a lug sail, after the King of Red
// Lions in The Wind Waker: a hull with a raised, curled prow and a figurehead, one mast, a yellow
// boom that swings out to leeward of the wind, a single billowing cel-cream sail with a painted
// emblem, and a yellow arrow floating by the stern that shows which way the wind goes. The rider
// holds a sheet (a rope) from the boom's end, so the hands never have to follow a moving boom.
//
// What was taken from Wind Waker's boat, from its screenshots and write-ups: the sail is opaque cloth
// with one crease and a belly, not a glowing sheet; the boom's angle is set by the wind against the
// heading (out wide running before it, close in on the wind); when the sail is up it billows and when
// it is not it is a small bundle on the boom; the wind arrow is in the world, beside the boat.
//
// Built as one Group in its own frame (+Z bow, +X to the left, Y up, origin at the deck), so the
// whole skiff, and the rider standing on it, are moved and turned with one quaternion.
//   const skiff = new Skiff(scene);
//   skiff.set({ sail, side, fill, boom, glow, t })      // per frame: what the sail is doing
//   skiff.group.position / .quaternion                  // where it is
// ---------------------------------------------------------------------------------------
export const SKIFF = {
  half: 1.3, beam: 0.46, deck: 0.04, // half length, half width, height of the deck surface over the origin
  mast: { z: 0.45, h: 4.4 },
  boom: { y: 2.05, len: 2.05 },
  sailH: 2.15,
  rider: { z: -0.42 }, // where the rider's feet are on the deck (along the boat)
};
const SW = 14, SH = 12;
const C = { hull: 0xb5532d, deck: 0xf1d9b6, gold: 0xf2c14e, dark: 0x4a2a1e, sail: 0xf6e6c8, rope: 0xe9d4a4 };

function emblemTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f6e6c8'; g.fillRect(0, 0, 256, 256);
  // stitched panels: a few darker seams up the cloth
  g.fillStyle = 'rgba(160,120,80,0.16)';
  for (const x of [60, 122, 190]) g.fillRect(x, 0, 2, 256);
  // the emblem: a sun that curls into a wave (terracotta, thick, rounded)
  g.strokeStyle = '#c2432b'; g.lineCap = 'round'; g.lineWidth = 20;
  g.beginPath();
  for (let a = 0; a < Math.PI * 3.1; a += 0.05) { const r = 12 + a * 15; const x = 138 + Math.cos(a - 1) * r * 0.9, y = 128 + Math.sin(a - 1) * r * 0.9; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  g.fillStyle = '#e8a23a'; g.beginPath(); g.arc(138, 128, 9, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class Skiff {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'SolarSkiff';
    this.buildHull();
    this.buildRig();
    this.buildRope();
    this.buildArrow(scene);
    this.group.visible = false;
    scene.add(this.group);
    this.side = 1; this.boomAngle = 0.5;
  }

  set visible(v) { this.group.visible = v; this.arrow.visible = v; this.rope.visible = v; }

  // ------------------------------------------------------------------ the hull
  buildHull() {
    const { half, beam } = SKIFF;
    // (a lens with a pointed bow (+Z) and a blunter stern; the shape's y is -z after the turn)
    const shape = new THREE.Shape();
    shape.moveTo(0, -half);
    shape.bezierCurveTo(beam * 0.9, -half * 0.55, beam * 1.05, half * 0.35, beam * 0.72, half);
    shape.lineTo(-beam * 0.72, half);
    shape.bezierCurveTo(-beam * 1.05, half * 0.35, -beam * 0.9, -half * 0.55, 0, -half);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 16 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -0.26, 0);
    const hull = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: C.hull, roughness: 0.62, flatShading: true }));
    hull.castShadow = true;
    addOutline(hull);
    this.group.add(hull);
    // the deck: a slightly smaller cream plank on top
    const dshape = new THREE.Shape();
    const s = 0.86;
    dshape.moveTo(0, -half * s);
    dshape.bezierCurveTo(beam * 0.9 * s, -half * 0.55 * s, beam * 1.05 * s, half * 0.35 * s, beam * 0.72 * s, half * s);
    dshape.lineTo(-beam * 0.72 * s, half * s);
    dshape.bezierCurveTo(-beam * 1.05 * s, half * 0.35 * s, -beam * 0.9 * s, -half * 0.55 * s, 0, -half * s);
    const dg = new THREE.ExtrudeGeometry(dshape, { depth: 0.02, bevelEnabled: false, curveSegments: 16 });
    dg.rotateX(-Math.PI / 2);
    dg.translate(0, 0.02, 0);
    const deck = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ color: C.deck, roughness: 0.8, flatShading: true }));
    deck.receiveShadow = true;
    this.group.add(deck);
    // the prow: a horn that rises and curls back over the bow, ending in a gold head
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, half - 0.02), new THREE.Vector3(0, 0.16, half + 0.24), new THREE.Vector3(0, 0.46, half + 0.3),
      new THREE.Vector3(0, 0.68, half + 0.14), new THREE.Vector3(0, 0.72, half - 0.06),
    ]);
    const prow = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.065, 6), new THREE.MeshStandardMaterial({ color: C.hull, roughness: 0.6, flatShading: true }));
    prow.castShadow = true; addOutline(prow);
    this.group.add(prow);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.5, flatShading: true, emissive: 0x4a3200, emissiveIntensity: 0.4 }));
    head.position.set(0, 0.74, half - 0.1);
    addOutline(head);
    this.group.add(head);
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.24, 5), new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.5, flatShading: true }));
      horn.position.set(sx * 0.09, 0.9, half - 0.14);
      horn.rotation.set(-0.5, 0, -sx * 0.5);
      this.group.add(horn);
    }
    // the stern block, and a low rail of gold along each side
    const stern = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.12), new THREE.MeshStandardMaterial({ color: C.hull, roughness: 0.6, flatShading: true }));
    stern.position.set(0, 0.1, -half + 0.12);
    addOutline(stern);
    this.group.add(stern);
    // the hover glow under the hull: steady, warm, no flicker
    const emitMat = new THREE.MeshBasicMaterial({ color: 0xffc65c, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const emit = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), emitMat);
    emit.rotation.x = -Math.PI / 2; emit.position.y = -0.34; emit.scale.set(0.85, 1.9, 1);
    this.group.add(emit);
    this.emit = emit;
  }

  // ------------------------------------------------------------------ mast, boom, sail
  buildRig() {
    const { mast, boom, sailH } = SKIFF;
    const dark = new THREE.MeshStandardMaterial({ color: 0x3f7a58, roughness: 0.6, flatShading: true }); // (a green mast, as on the Red Lions)
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, mast.h, 6), dark);
    m.position.set(0, mast.h / 2 + 0.04, mast.z);
    m.castShadow = true; addOutline(m);
    this.group.add(m);
    // the rig turns about the mast: the boom, and the cloth hung between the mast and the boom's end
    this.rig = new THREE.Group();
    this.rig.position.set(0, 0, mast.z);
    const gold = new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.5, flatShading: true });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, boom.len, 6), gold);
    b.rotation.x = Math.PI / 2; b.position.set(0, boom.y, -boom.len / 2);
    b.castShadow = true; addOutline(b);
    this.rig.add(b);
    const geo = new THREE.PlaneGeometry(1, 1, SW, SH);
    this.tex = emblemTexture();
    this.sailMat = new THREE.MeshStandardMaterial({ map: this.tex, side: THREE.DoubleSide, roughness: 0.9, emissive: 0xffb45a, emissiveIntensity: 0, flatShading: false });
    this.sail = new THREE.Mesh(geo, this.sailMat);
    this.sail.frustumCulled = false;
    this.sail.castShadow = true;
    this.rig.add(this.sail);
    this.sailPos = geo.attributes.position;
    this.group.add(this.rig);
    this.tip = new THREE.Vector3(); // the boom's end, in world space (for the sheet)
  }

  /**
   * Shape the cloth. `sail` is how far it is hoisted (0 a bundle on the boom, 1 full), `side` which way it
   * bellies (+1 to the boat's left), `fill` how full of wind it is 0..1 (a sail pointing into the wind
   * luffs), `t` for the little flutter of a luffing sail.
   */
  shapeSail(sail, side, fill, t) {
    const { boom, sailH } = SKIFF;
    const P = this.sailPos;
    const hv = 0.16 + 0.84 * sail;
    const belly = 0.62 * fill * (0.25 + 0.75 * sail);
    const flap = (1 - fill) * 0.06 * sail;
    let i = 0;
    for (let jy = 0; jy <= SH; jy++) {
      const v = jy / SH;
      const chord = boom.len * (1 - 0.3 * v) * (0.4 + 0.6 * sail);
      const y = boom.y + v * sailH * hv;
      for (let ix = 0; ix <= SW; ix++, i++) {
        const u = ix / SW;
        const z = -u * chord - 0.02;
        // one crease down the middle third, as the Red Lions' sail has, and a belly that fills toward the head
        const crease = -0.05 * Math.exp(-Math.pow((u - 0.55) * 5, 2)) * side * sail;
        const bul = belly * Math.sin(Math.PI * u) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, 0.2 + v * 0.85)));
        const fl = flap * Math.sin(t * 3.2 + u * 6 + v * 4) * u;
        P.setXYZ(i, side * bul + crease + fl, y, z);
      }
    }
    P.needsUpdate = true;
    this.sail.geometry.computeVertexNormals();
  }

  // ------------------------------------------------------------------ the sheet (a rope to the rider's hands)
  buildRope() {
    const pts = new Float32Array(3 * 14);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.rope = new THREE.Line(g, new THREE.LineBasicMaterial({ color: C.rope }));
    this.rope.frustumCulled = false;
    this.rope.visible = false;
    this.ropeGeo = g;
    this.group.parent?.add(this.rope);
  }

  /** Draw the sheet from the boom's end to a hand (both in world space), with a little sag. */
  drawRope(scene, hand) {
    if (!this.rope.parent) scene.add(this.rope);
    this.rig.updateMatrixWorld(true);
    this.tip.set(0, SKIFF.boom.y, -SKIFF.boom.len * 0.92).applyMatrix4(this.rig.matrixWorld);
    const P = this.ropeGeo.attributes.position;
    const n = 14, sag = 0.12;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      P.setXYZ(i, this.tip.x + (hand.x - this.tip.x) * k, this.tip.y + (hand.y - this.tip.y) * k - Math.sin(Math.PI * k) * sag, this.tip.z + (hand.z - this.tip.z) * k);
    }
    P.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the wind arrow
  buildArrow(scene) {
    const s = new THREE.Shape();
    s.moveTo(0.55, 0); s.lineTo(0.12, 0.3); s.lineTo(0.12, 0.11); s.lineTo(-0.5, 0.11); s.lineTo(-0.5, -0.11); s.lineTo(0.12, -0.11); s.lineTo(0.12, -0.3); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // (lies flat, pointing along +X)
    g.translate(0, -0.025, 0);
    this.arrow = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffa800, emissiveIntensity: 0.55, roughness: 0.5, flatShading: true }));
    addOutline(this.arrow);
    this.arrow.visible = false;
    scene.add(this.arrow);
  }

  /** Place the arrow beside the stern, pointing where the wind goes (dir: unit vector in x, z), bobbing a little. */
  placeArrow(pos, dir, strength, t) {
    this.arrow.position.copy(pos);
    this.arrow.position.y += Math.sin(t * 1.8) * 0.05;
    this.arrow.rotation.set(0, Math.atan2(-dir.y, dir.x), 0); // (dir.y is z)
    const k = 0.75 + 0.5 * strength;
    this.arrow.scale.set(k, 1, k);
  }

  // ------------------------------------------------------------------ per frame
  /** sail 0..1 hoisted; side +-1; fill 0..1; boom = the boom's angle from dead aft (radians, + to the boat's right); glow 0..1 (a flare); t seconds. */
  set({ sail, side, fill, boom, glow, t, speed }) {
    this.rig.rotation.y = boom;
    this.shapeSail(sail, side, fill, t);
    this.sailMat.emissiveIntensity = 0.12 + 0.7 * glow;
    this.emit.material.opacity = 0.38 + 0.22 * Math.min(1, speed / 24) + 0.3 * glow;
  }
}
