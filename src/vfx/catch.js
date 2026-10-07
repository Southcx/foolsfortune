// ---------------------------------------------------------------------------------------
// THE CATCH: a Figment drawn into a vessel (the owner, 2026-10-07: "something really fun about using the Pneuka Jar and Godhand form in
// battle to capture them when stunned"; docs/plans/SPIRIT-GARDEN.md 5a). One look for both ways of catching, because both are the same
// act: a mouth that drinks a mind. The mouth is the Pneuka Jar's (the god hand holding a stunned Figment over it) or the Lockheart's
// open summoning coffin (its catch wheel is `tools/lockheart/wheel.js`; this is what the coffin does while it spins).
//
//   THE TETHER   two strands of Lachryma twisting from the mouth to the Figment, thin at first, thicker and brighter as the catch
//                takes; the tug (how hard it fights at this instant) whips them
//   THE MOUTH    a slow vortex of light over the mouth, turning faster as the catch nears its end
//   THE PULL     motes drawn off the Figment, spiralling down the tether into the mouth
//   THE STRUGGLE the Figment strains: squashing and stretching against the pull in jerks (its scale only, restored after; the hand's
//                own tug on the cursor is Petra's)
//   TAKEN        take(): it is pulled in, shrinking down the tether into the mouth, and the mouth flashes and closes
//   FREED        free(): the tether snaps (its strands whip back and spark) and the Figment is itself again
//
// Prior art: Luigi's Mansion's Poltergust (the tug of war, the ghost stretched toward the nozzle), Pokemon's ball (the creature drawn in
// as light), Black & White's god hand, Okami's brush drawing ink into a pot, and the genie and the lamp.
//
//   const C = new CatchLook({ fx, color })   scene.add(C.group)   C.begin(target, mouth (Vector3, or a function giving one))
//   C.set({ k 0..1 (how far the catch is), tug 0..1 })   C.take(onDone)   C.free()   C.update(rawDt)   C.busy
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const SEG = 28, RAD = 5; // (each strand: its rings along the tether, and the points round each)

const MOUTH_F = /* glsl */`uniform float uT, uK, uA; uniform vec3 uC; varying vec2 vU;
void main() {
  vec2 p = vU * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;
  float a = atan(p.y, p.x), sw = sin(a * 3.0 + r * 9.0 - uT * (3.0 + 9.0 * uK));                  // (a vortex: three arms, winding in)
  float arms = smoothstep(0.4, 1.0, sw) * (1.0 - r);
  float core = 1.0 - smoothstep(0.0, 0.35, r);
  gl_FragColor = vec4(uC * (arms * 0.7 + core * (0.4 + 0.8 * uK)), uA * (arms * 0.6 + core * 0.8) * (1.0 - smoothstep(0.7, 1.0, r)));
}`;

export class CatchLook {
  constructor({ fx = null, color = 0xffc65c } = {}) {
    this.fx = fx; this.color = new THREE.Color(color); this.t = 0; this.k = 0; this.tug = 0; this.a = 0;
    this.group = new THREE.Group(); this.group.name = 'catch';
    this.strandMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.strands = [0, Math.PI].map((ph) => {
      const g = new THREE.BufferGeometry(), pos = new Float32Array((SEG + 1) * RAD * 3), idx = [];
      for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * RAD + j, b = i * RAD + ((j + 1) % RAD); idx.push(a, a + RAD, b, b, a + RAD, b + RAD); }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setIndex(idx);
      const m = new THREE.Mesh(g, this.strandMat); m.frustumCulled = false; this.group.add(m); return { m, ph };
    });
    this.mu = { uT: { value: 0 }, uK: { value: 0 }, uA: { value: 0 }, uC: { value: this.color.clone().multiplyScalar(0.6) } };
    this.mouthM = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ name: 'catch-mouth', uniforms: this.mu, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: MOUTH_F }));
    this.mouthM.frustumCulled = false; this.group.add(this.mouthM);
    this.group.visible = false; this.busy = false; this.state = 'idle';
    this._m = new THREE.Vector3(); this._t = new THREE.Vector3();
  }

  /** A catch begins: `target` the Figment's root, `mouth` where it is drawn in (a point, or a function giving one each frame). */
  begin(target, mouth) {
    if (this.busy) this.free(true);
    this.target = target; this.mouth = mouth; this.base = target.scale.clone(); this.k = 0; this.tug = 0; this.a = 0; this.t = 0;
    this.state = 'hold'; this.busy = true; this.group.visible = true;
  }
  set({ k = this.k, tug = this.tug } = {}) { this.k = THREE.MathUtils.clamp(k, 0, 1); this.tug = THREE.MathUtils.clamp(tug, 0, 1); }
  /** Held through: it is drawn in. `onDone` when it is gone (Petra binds it then: `spirit.bind`). */
  take(onDone = null) { if (this.state !== 'hold') return; this.state = 'take'; this.takeT = 0; this.onDone = onDone; this.from = this.target.getWorldPosition(new THREE.Vector3()); }
  /** It broke free (or the stun ran out): the tether snaps. */
  free(quiet = false) {
    if (!this.busy) return;
    if (this.target && this.base) this.target.scale.copy(this.base);
    if (!quiet) this.sparks(this.mouthAt(this._m), this.target.getWorldPosition(this._t), 18);
    this.state = 'snap'; this.snapT = 0;
  }

  mouthAt(out) { const m = typeof this.mouth === 'function' ? this.mouth() : this.mouth; return out.copy(m); }

  sparks(a, b, n) {
    const fx = this.fx; if (!fx?.add) return;
    for (let i = 0; i < n; i++) { const p = a.clone().lerp(b, Math.random()); fx.add.emit({ pos: p, vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5), life: 0.5, size: 0.07, sizeEnd: 0.01, color: this.color.clone(), alpha: 1, drag: 1.5, gravity: 6 }); }
  }

  update(raw = 1 / 60, camera = null) {
    if (!this.busy) return;
    this.t += raw; const t = this.t, M = this.mouthAt(this._m), T = this.target.getWorldPosition(this._t);
    let k = this.k, end = T, fade = 1;
    if (this.state === 'take') { // (it shrinks down the tether into the mouth)
      this.takeT += raw / 0.45; const e = Math.min(1, this.takeT), ee = e * e;
      end = this.from.clone().lerp(M, ee); this.target.position.add(_d.copy(end).sub(T).multiplyScalar(1)); this.target.updateMatrixWorld(true);
      this.target.scale.copy(this.base).multiplyScalar(Math.max(0.01, 1 - ee)); k = 1;
      if (e >= 1) { this.target.visible = false; this.target.scale.copy(this.base); this.flash(M); this.state = 'close'; this.closeT = 0; this.onDone?.(); }
    } else if (this.state === 'close') { this.closeT += raw / 0.35; fade = Math.max(0, 1 - this.closeT); end = M; if (this.closeT >= 1) return this.end(); }
    else if (this.state === 'snap') { this.snapT += raw / 0.3; fade = Math.max(0, 1 - this.snapT); if (this.snapT >= 1) return this.end(); }
    else { // the struggle: it strains against the pull in jerks
      const jerk = Math.sin(t * 17) * Math.sin(t * 5.3) * this.tug, s = 1 + 0.18 * jerk + 0.06 * Math.sin(t * 9);
      this.target.scale.set(this.base.x / Math.sqrt(s), this.base.y * s, this.base.z / Math.sqrt(s));
    }
    this.a += (fade - this.a) * Math.min(1, raw * 10);
    // the strands: a helix from the mouth to it, thicker and brighter as the catch takes; the tug whips it; the snap flings them loose
    const axis = _d.copy(end).sub(M), L = axis.length() || 1e-3; axis.divideScalar(L);
    const side = _s.crossVectors(axis, Math.abs(axis.y) > 0.9 ? _x : _y).normalize(), up = _u.crossVectors(side, axis).normalize();
    const w = 0.03 + 0.06 * k, amp = 0.12 + 0.1 * k, snap = this.state === 'snap' ? this.snapT : 0;
    for (const st of this.strands) {
      const P = st.m.geometry.attributes.position;
      for (let i = 0; i <= SEG; i++) {
        const f = i / SEG, env = Math.sin(f * Math.PI), ang = f * 9 + st.ph - t * (4 + 8 * k);
        const whip = this.tug * 0.35 * Math.sin(f * 7 - t * 23) * env + snap * 1.5 * f * f * Math.sin(st.ph + f * 5);
        const cx = M.x + axis.x * L * f * (1 - snap * 0.5), cy = M.y + axis.y * L * f * (1 - snap * 0.5), cz = M.z + axis.z * L * f * (1 - snap * 0.5);
        const ox = Math.cos(ang) * amp * env + whip, oy = Math.sin(ang) * amp * env;
        const px = cx + side.x * ox + up.x * oy, py = cy + side.y * ox + up.y * oy, pz = cz + side.z * ox + up.z * oy;
        const r = w * (0.4 + 0.6 * env);
        for (let j = 0; j < RAD; j++) { const b = (j / RAD) * Math.PI * 2, c = Math.cos(b) * r, s = Math.sin(b) * r; P.setXYZ(i * RAD + j, px + side.x * c + up.x * s, py + side.y * c + up.y * s, pz + side.z * c + up.z * s); }
      }
      P.needsUpdate = true;
    }
    this.strandMat.opacity = (0.35 + 0.5 * k) * this.a;
    // the mouth's vortex, laid across the tether's end, facing along it
    this.mouthM.position.copy(M); this.mouthM.quaternion.setFromUnitVectors(_z, axis); this.mouthM.scale.setScalar(0.9 + 0.7 * k);
    this.mu.uT.value = t; this.mu.uK.value = k; this.mu.uA.value = this.a;
    // motes drawn off it down into the mouth
    const fx = this.fx; if (fx?.add && this.state === 'hold') {
      this.moteAcc = (this.moteAcc || 0) + raw * (6 + 18 * k);
      while (this.moteAcc >= 1) { this.moteAcc -= 1; const from = T.clone().add(_r.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(0.6)), life = 0.5; fx.add.emit({ pos: from, vel: M.clone().sub(from).divideScalar(life), life, size: 0.06, sizeEnd: 0.02, color: this.color.clone(), alpha: 0.9, drag: 0, gravity: 0 }); }
    }
    void camera;
  }

  flash(at) { const fx = this.fx; if (!fx?.add) return; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; fx.add.emit({ pos: at.clone(), vel: new THREE.Vector3(Math.cos(a) * 3, 1.2, Math.sin(a) * 3), life: 0.45, size: 0.1, sizeEnd: 0.02, color: this.color.clone(), alpha: 1, drag: 3, gravity: 0 }); } }
  end() { this.busy = false; this.state = 'idle'; this.group.visible = false; if (this.target && this.base && this.target.visible) this.target.scale.copy(this.base); this.target = null; }
  dispose() { this.group.parent?.remove(this.group); for (const s of this.strands) s.m.geometry.dispose(); this.strandMat.dispose(); this.mouthM.geometry.dispose(); this.mouthM.material.dispose(); }
}
const _d = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(), _r = new THREE.Vector3(), _x = new THREE.Vector3(1, 0, 0), _y = new THREE.Vector3(0, 1, 0), _z = new THREE.Vector3(0, 0, 1);
