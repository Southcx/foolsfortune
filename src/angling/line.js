// The fishing line: a thin polyline from the rod's tip to whatever is on the other end, hanging in a curve when it is slack and
// pulling straight (with a tremble) when it is loaded. Drawn as a Line (the width of a hair on purpose), tinted toward the
// aspect's colour when taut.
import * as THREE from 'three';

const N = 30;
const _c = new THREE.Color();

export class FishingLine {
  constructor(scene) {
    this.pts = Array.from({ length: N }, () => new THREE.Vector3());
    this.geo = new THREE.BufferGeometry().setFromPoints(this.pts);
    this.mat = new THREE.LineBasicMaterial({ color: 0xf3e6d2, transparent: true, opacity: 0.9 });
    this.line = new THREE.Line(this.geo, this.mat);
    this.line.frustumCulled = false; this.line.visible = false; this.line.renderOrder = 5;
    scene.add(this.line);
    this.slack = 0.3;
  }
  hide() { this.line.visible = false; }
  /** tension 0..1, the sag follows what is left over. `air` lines arc lightly. */
  set(tip, end, tension, time, color = null) {
    this.line.visible = true;
    const len = tip.distanceTo(end);
    const sag = THREE.MathUtils.clamp((1 - tension) * (0.05 + len * 0.045), 0.02, 3.2);
    this.slack = THREE.MathUtils.damp(this.slack, sag, 8, 1 / 60);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const p = this.pts[i].lerpVectors(tip, end, t);
      p.y -= this.slack * 4 * t * (1 - t);
      if (tension > 0.55) { // a taut line hums
        const k = Math.sin(t * Math.PI) * (tension - 0.55) * 0.05;
        p.x += Math.sin(time * 60 + t * 9) * k; p.y += Math.cos(time * 53 + t * 7) * k;
      }
    }
    const pos = this.geo.attributes.position;
    for (let i = 0; i < N; i++) pos.setXYZ(i, this.pts[i].x, this.pts[i].y, this.pts[i].z);
    pos.needsUpdate = true;
    this.geo.computeBoundingSphere();
    if (color != null) this.mat.color.setHex(0xf3e6d2).lerp(_c.setHex(color), Math.max(0, tension - 0.5));
    else this.mat.color.setHex(0xf3e6d2);
  }
}
