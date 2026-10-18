// ---------------------------------------------------------------------------------------
// THE SONDELASS'S GUARD: its quad batch (part of vfx/sondelassguard.js). Every flat mark the guard draws this frame (a bead, a notch, a
// line of the hoop, a ruler's tick, a ping's ring) is one quad into fixed arrays, rebuilt each frame it shows and drawn as one mesh in a
// kind of the overlay's one shader (vfx/lachrimetertube.js overlayKind: no program of its own). A quad picks a cell of the marks' atlas
// (sondelassguard/atlas.js) and wears a tint (sRGB, with its alpha); a line is a quad of the feathered bar stretched between two points.
// Only the quads written are uploaded and drawn (the draw range and the update range), and nothing is allocated per frame.
//
// Prior art: the sprite batcher (a quad a sprite, one buffer, one draw: SpriteBatch in XNA and libGDX, Dear ImGui's draw list, which
// builds lines and arcs out of quads the same way); the spiritual link's ribbon (vfx/spirituallink.js), rebuilt into fixed arrays.
//
//   const b = new QuadBatch(tex, max, { additive, order })   b.mesh (into a group)   b.begin()
//   b.quad(x, y, hw, hh, rot, cell, r, g, b, a)   b.seg(x0, y0, x1, y1, w, r, g, b, a)   b.arc(cx, cy, R, a0, a1, w, n, r, g, b, a)
//   b.end()   (uploads what was written; a quad past `max` is dropped)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayKind, overlayShader } from '../lachrimetertube.js';
import { guardAtlas } from './atlas.js';

const SPRITE = overlayKind('guard.sprite', {
  vdecl: 'attribute vec4 aTint;',
  vbody: 'vUv=uv;vW=aTint.rgb;vA=aTint.a;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);',
  fdecl: 'uniform sampler2D uSgAtlas;',
  fbody: 'vec4 c=texture2D(uSgAtlas,vUv);gl_FragColor=linearToOutputTexel(vec4(c.rgb*pow(max(vW,vec3(0.)),vec3(2.2)),c.a*vA));',
});

export class QuadBatch {
  constructor(tex, max, { additive = false, order = 10 } = {}) {
    this.max = max; this.n = 0;
    const g = new THREE.BufferGeometry();
    this.P = new Float32Array(max * 12); this.U = new Float32Array(max * 8); this.C = new Float32Array(max * 16);
    this.pos = new THREE.BufferAttribute(this.P, 3).setUsage(THREE.DynamicDrawUsage);
    this.uv = new THREE.BufferAttribute(this.U, 2).setUsage(THREE.DynamicDrawUsage);
    this.tint = new THREE.BufferAttribute(this.C, 4).setUsage(THREE.DynamicDrawUsage);
    const idx = new Uint16Array(max * 6);
    for (let i = 0; i < max; i++) { const a = i * 4, o = i * 6; idx[o] = a; idx[o + 1] = a + 1; idx[o + 2] = a + 2; idx[o + 3] = a + 2; idx[o + 4] = a + 1; idx[o + 5] = a + 3; }
    g.setAttribute('position', this.pos); g.setAttribute('uv', this.uv); g.setAttribute('aTint', this.tint); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(g, overlayShader(SPRITE, { uSgAtlas: { value: tex } }, { blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthTest: false, depthWrite: false }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = order;
    this.bar = guardAtlas().cell('bar');
  }

  begin() { this.n = 0; }

  /** A quad centred at x, y (dots), half sizes hw, hh, turned by rot (radians, counter-clockwise), showing `cell`, tinted r, g, b (sRGB 0..1), a. */
  quad(x, y, hw, hh, rot, cell, r, g, b, a) {
    if (this.n >= this.max || a <= 0.002) return;
    const i = this.n++, P = this.P, U = this.U, C = this.C, c = Math.cos(rot), s = Math.sin(rot);
    const ux = c * hw, uy = s * hw, vx = -s * hh, vy = c * hh, o = i * 12;
    P[o] = x - ux - vx; P[o + 1] = y - uy - vy; P[o + 2] = 0; // (bottom left)
    P[o + 3] = x + ux - vx; P[o + 4] = y + uy - vy; P[o + 5] = 0; // (bottom right)
    P[o + 6] = x - ux + vx; P[o + 7] = y - uy + vy; P[o + 8] = 0; // (top left)
    P[o + 9] = x + ux + vx; P[o + 10] = y + uy + vy; P[o + 11] = 0; // (top right)
    const q = i * 8; U[q] = cell[0]; U[q + 1] = cell[1]; U[q + 2] = cell[2]; U[q + 3] = cell[1]; U[q + 4] = cell[0]; U[q + 5] = cell[3]; U[q + 6] = cell[2]; U[q + 7] = cell[3];
    const k = i * 16; for (let j = 0; j < 4; j++) { C[k + j * 4] = r; C[k + j * 4 + 1] = g; C[k + j * 4 + 2] = b; C[k + j * 4 + 3] = a; }
  }

  /** A line from x0, y0 to x1, y1, w dots wide (the feathered bar; its ends squared). */
  seg(x0, y0, x1, y1, w, r, g, b, a) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (L < 1e-4) return;
    this.quad((x0 + x1) / 2, (y0 + y1) / 2, L / 2 + w * 0.25, w * 0.62, Math.atan2(dy, dx), this.bar, r, g, b, a); // (the bar's feather takes a fifth of its cell each side)
  }

  /** An arc of radius R round cx, cy from a0 to a1 (radians, counter-clockwise), in n lines. */
  arc(cx, cy, R, a0, a1, w, n, r, g, b, a) {
    let px = cx + Math.cos(a0) * R, py = cy + Math.sin(a0) * R;
    for (let i = 1; i <= n; i++) { const t = a0 + ((a1 - a0) * i) / n, qx = cx + Math.cos(t) * R, qy = cy + Math.sin(t) * R; this.seg(px, py, qx, qy, w, r, g, b, a); px = qx; py = qy; }
  }

  end() {
    const n = this.n, g = this.mesh.geometry;
    g.setDrawRange(0, n * 6);
    if (!n) return;
    this.pos.clearUpdateRanges(); this.pos.addUpdateRange(0, n * 12); this.pos.needsUpdate = true;
    this.uv.clearUpdateRanges(); this.uv.addUpdateRange(0, n * 8); this.uv.needsUpdate = true;
    this.tint.clearUpdateRanges(); this.tint.addUpdateRange(0, n * 16); this.tint.needsUpdate = true;
  }
}
