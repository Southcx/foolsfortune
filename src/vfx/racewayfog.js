// ---------------------------------------------------------------------------------------
// DREAD'S FOG ON THE RACEWAY (docs/plans/SKIFF-RACING.md section 9, Conditions; Dovina's handoff of 2026-10-14, item 8): when the pall
// lies over the Raceway (`raceway.condition.fog`, 0..1: Dread's strength, world/raceway/conditions.js), a low fog creeps along the
// course in Dread's colours (vfx/weather.js LOOK.dread: its green toward the violet its cloud glows): three thin sheets laid
// along the running surface and out past its berms, each following the sand a little higher than the last (0.35, 0.9 and 1.6 m), a
// soft noise of cloud in them drifting the race's way, thickest low. The board cuts through it; the far course sinks into the scene's
// own fog (render/daylight.js thickens that by the weather: Petra's).
// The sheets are unlit, so their colour follows the hour and the pall's dimmed sky (vfx/weather.js lightOf); they lie on the circuit
// only, not under the cavern's roof (there they lit its dark). All three are one mesh and one draw, in the additive mapped basic's program
// (vfx/racewaylooks.js `raceway-glow`) with ordinary blending: no program added. Built the first time the fog comes, hidden without it.
//
// Prior art: the sixth generation's layered fog planes (Silent Hill 2's town and its low sheets, Ico's and Shadow of the Colossus's
// ground mist as stacked translucent cards), Wave Race 64's Drake Lake in the fog (a course learned again under a condition), valley
// fog's flat top (the cold air pooling, thickest low), and the weather's own miasma lenses (vfx/weather.js: fog sat on the ground).
//
//   const F = new RacewayFog(game, o?)   F.update(dt)   (built along game.raceway once fog comes; o: parent, raceway (() => R), fog (() => 0..1))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LOOK, lightOf } from './weather.js';

/** The numbers: the sheets' heights over the sand (m), how far past the running surface's edge they
 *  reach (m), metres between rows along the line and samples across it, a texture tile's length along (m), the creep (tiles a real
 *  second), the most opacity at full fog, how fast the fog comes and goes (a real second's share), the colour. */
export const RACEWAY_FOG = {
  layers: [0.35, 0.9, 1.6], past: 16, step: 5, across: 9, tile: 11, creep: 0.06, alpha: 0.6, rate: 0.6,
  colour: () => LOOK.dread.colour.clone().lerp(LOOK.dread.bolts.glow, 0.3).multiplyScalar(1.3), // (Dread's green toward the violet its cloud glows: a bruise)
};

let CLOUD = null; // (the sheets' cloud: soft blobs, tiling along (u), fading out at both edges (v); one for the game)
function cloudTexture() {
  if (CLOUD) return CLOUD;
  const W = 256, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H), a = new Float32Array(W * H);
  let s = 90210; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 140; k++) { // (soft blobs, wrapped round along u so the strip tiles)
    const cx = rnd() * W, cy = 6 + rnd() * (H - 12), r = 4 + rnd() * 12, k2 = 0.3 + rnd() * 0.5;
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(H, Math.ceil(cy + r)); y++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      const d2 = (dx * dx + (y - cy) * (y - cy)) / (r * r); if (d2 >= 1) continue;
      const x = (((Math.round(cx) + dx) % W) + W) % W; a[y * W + x] += k2 * (1 - d2) * (1 - d2);
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y + 0.5) / H, edge = Math.sin(Math.PI * v) ** 1.5, o = (y * W + x) * 4, k = Math.min(1, 0.08 + a[y * W + x]) * edge;
    const l = Math.round(170 + 85 * Math.min(1, a[y * W + x])); img.data[o] = img.data[o + 1] = img.data[o + 2] = l; img.data[o + 3] = Math.round(255 * k);
  }
  g.putImageData(img, 0, 0);
  CLOUD = new THREE.CanvasTexture(c); CLOUD.colorSpace = THREE.SRGBColorSpace; CLOUD.wrapS = THREE.RepeatWrapping;
  return CLOUD;
}

export class RacewayFog {
  constructor(game, o = {}) {
    this.game = game; this.parent = o.parent || null;
    this.rOf = o.raceway || (() => game.raceway);
    this.fogOf = o.fog || ((R) => R?.condition?.fog || 0);
    this.lightOf = o.light || ((R) => { const C = R?.condition; return C ? Math.min(1, (C.light ?? 1) / 0.6) * lightOf('dread', C.strength || 0) : 1; }); // (the sheets are unlit: dimmed with the hour and the pall's sky)
    this.k = 0; this.mesh = null; this.R = null;
  }

  /** The sheets along a Raceway: every line it has (the circuit, the cavern's branch), each layer a strip over the sand. */
  build(R) {
    this.dispose();
    const F = RACEWAY_FOG, pos = [], uv = [], index = [];
    const lines = [{ len: R.T.length, frame: (s) => R.T.frame(s), loop: true }]; // (the circuit only: under the cavern's roof the unlit sheets lit up its dark, measured)
    for (const L of lines) {
      const rows = Math.ceil(L.len / F.step) + (L.loop ? 1 : 0);
      F.layers.forEach((h, li) => {
        const base = pos.length / 3, n = F.across;
        for (let r = 0; r < rows; r++) {
          const s = Math.min(L.len, r * F.step), f = L.frame(L.loop ? s % L.len : s), W = f.w + F.past;
          for (let k = 0; k < n; k++) {
            const t = k / (n - 1), lat = (t * 2 - 1) * W, p = R.local(f.x - f.fz * lat, f.z + f.fx * lat);
            pos.push(p.x, p.y + h, p.z); uv.push(s / (F.tile * (1 + li * 0.35)) + li * 0.37, li % 2 ? 1 - t : t); // (each layer its own scale and phase)
          }
          if (r) for (let k = 0; k < n - 1; k++) { const a = base + (r - 1) * n + k, b = a + 1, c = a + n, d = c + 1; index.push(a, b, c, b, d, c); }
        }
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(index);
    g.computeBoundingSphere();
    this.colour = F.colour();
    this.mat = new THREE.MeshBasicMaterial({ name: 'raceway-fog', map: cloudTexture(), color: this.colour.clone(), transparent: true, opacity: 0, depthWrite: false });
    const mesh = (this.mesh = new THREE.Mesh(g, this.mat)); mesh.name = 'raceway-fog'; mesh.userData.zone = 'raceway'; mesh.renderOrder = 2; mesh.visible = false;
    (this.parent || this.game.scene).add(mesh);
    this.R = R;
    return this;
  }

  update(dt) {
    this.hookRelease(this.rOf());
    const R = this.rOf(), want = R?.built !== false && R?.T && R.active !== false ? this.fogOf(R) : 0;
    this.k += (want - this.k) * Math.min(1, dt * RACEWAY_FOG.rate);
    if (this.k < 0.005) { if (this.mesh) this.mesh.visible = false; return; }
    if (!this.mesh || this.R !== R) this.build(R);
    this.mesh.visible = true;
    this.mat.opacity = RACEWAY_FOG.alpha * Math.min(1, this.k);
    this.mat.color.copy(this.colour).multiplyScalar(0.15 + 0.85 * this.lightOf(R));
    this.mat.map.offset.x -= dt * RACEWAY_FOG.creep; // (the cloud creeps the race's way)
  }

  /** Told when the park's ground is given back (raceway.onRelease): the dressing goes with it, dressed again on its next active frame. */
  hookRelease(R) { if (R?.onRelease && this.hooked !== R) { this.hooked = R; R.onRelease(() => this.releaseDress()); } }
  releaseDress() { this.dispose(); }
  dispose() { if (!this.mesh) return; this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); this.mesh = null; this.R = null; }
}
