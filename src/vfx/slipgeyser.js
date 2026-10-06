// ---------------------------------------------------------------------------------------
// A SLIP GEYSER: where Lachryma runs under the Dunes it erupts, a column of sand and slip (the owner, 2026-10-06: "keep the sandspouts on
// deck, those could be a really fun mechanic as slip geysers in the Dunes"; docs/plans/DUNES.md). The look and its cycle; the launch
// (what it does to the Courier and the skiff) is Petra's physics, which reads `.state` and `.launching`.
//
//   DORMANT  a ring of darker, damp sand with a faint shimmer of the labradorite in it (20 to 40 sim seconds, seeded)
//   RUMBLE   the sand in the ring jumps and the shimmer brightens (2 sim seconds: the tell)
//   ERUPT    the column stands up out of the ring (the spout's: vfx/dunemaw.js DunemawSpout), 20 to 40 m (3 sim seconds)
//   FALL     it pours back down round itself, the sandfall skirt, and sinks (2 sim seconds)
//
// On the sim clock (dt summed), so a replay and the trial see the same eruptions. Prior art: Old Faithful (an eruption on a cycle you can
// learn), Sonic's and Mario's springs and geysers as launch pads (Super Mario Sunshine's), Journey's sand that flows like water, and
// the Dunemaw's own first spout (the owner sent it here).
//
//   const G = new SlipGeyser({ height, seed })   scene.add(G.group)   G.update(simDt)   G.state ('dormant' | 'rumble' | 'erupt' | 'fall')
//   G.launching (true while the column stands)   G.k (0..1 how much of the column stands)   G.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DunemawSpout } from './dunemaw.js';
import { LAB_GLSL, mindTime } from './labradorite.js';

const RING_F = `varying vec2 vP; varying vec3 vW; uniform float uT, uHot; uniform vec3 uSand;
${LAB_GLSL}
void main() {
  float r = length(vP); if (r > 1.0) discard;
  float wet = 1.0 - smoothstep(0.55, 1.0, r); // (damp sand, darker toward the vent)
  float ring = smoothstep(0.35, 0.55, r) * (1.0 - smoothstep(0.75, 1.0, r));
  float shim = (0.5 + 0.5 * sin(atan(vP.y, vP.x) * 9.0 + uT * 2.0 + r * 12.0)) * ring;
  vec3 col = uSand * (1.0 - 0.45 * wet) + labradorite(labPhase(vW, vec3(0.0, -1.0, 0.0)) + r) * shim * (0.12 + 0.6 * uHot);
  gl_FragColor = vec4(col, wet * 0.85 + shim * 0.3 * uHot);
  #include <colorspace_fragment>
}`;

export class SlipGeyser {
  constructor({ height = 30, radius = 4, seed = 1, dormant = [20, 40] } = {}) {
    let s = seed * 9301 + 49297; this.rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    this.spec = { dormant, rumble: 2, erupt: 3, fall: 2 };
    this.state = 'dormant'; this.left = dormant[0] + this.rnd() * (dormant[1] - dormant[0]); this.t = 0; this.k = 0;
    this.group = new THREE.Group(); this.group.name = 'slip-geyser';
    this.spout = new DunemawSpout({ height }); this.spout.group.scale.set(radius / 9, 0, radius / 9); // (the spout's column, narrowed to a vent, its height grown by the eruption)
    this.group.add(this.spout.group);
    this.u = { uT: { value: 0 }, uHot: { value: 0 }, uSand: { value: new THREE.Color(0xd8a868) }, uMindT: mindTime };
    const g = new THREE.CircleGeometry(radius, 40); g.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'slip-geyser-ring', uniforms: this.u, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: `varying vec2 vP; varying vec3 vW; uniform float uRad; void main() { vP = position.xz / ${radius.toFixed(2)}; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: RING_F }));
    this.ring.position.y = 0.04; this.group.add(this.ring);
  }

  get launching() { return this.state === 'erupt' && this.k > 0.4; }

  update(dt) {
    this.t += dt; this.left -= dt;
    if (this.left <= 0) {
      const next = { dormant: 'rumble', rumble: 'erupt', erupt: 'fall', fall: 'dormant' }[this.state];
      this.state = next;
      const S = this.spec; this.left = next === 'dormant' ? S.dormant[0] + this.rnd() * (S.dormant[1] - S.dormant[0]) : S[next];
    }
    const target = this.state === 'erupt' ? 1 : this.state === 'fall' ? 0.25 : 0;
    this.k += (target - this.k) * (1 - Math.exp(-dt * (this.state === 'erupt' ? 7 : 2.5)));
    const col = this.spout.group; col.scale.y = Math.max(0.0001, this.k); col.visible = this.k > 0.01;
    this.spout.fall.visible = this.state === 'fall' || (this.state === 'erupt' && this.k > 0.85);
    this.spout.update(this.t);
    this.u.uT.value = this.t; this.u.uHot.value = this.state === 'rumble' ? 1 : this.state === 'erupt' ? 0.6 : 0;
    this.ring.position.y = 0.04 + (this.state === 'rumble' ? 0.06 * Math.abs(Math.sin(this.t * 31)) : 0); // (the sand in the ring jumps)
  }

  dispose() { this.group.parent?.remove(this.group); this.spout.dispose(); this.ring.geometry.dispose(); this.ring.material.dispose(); }
}
