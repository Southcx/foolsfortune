// ---------------------------------------------------------------------------------------
// THE SLIP PUDDLES: the slip jelly mount's body as a puddle on the ground (vfx/jellymount/look.js asks): spread under the Courier as it
// wells up at the call, under it as it slumps back, and flung out where it bursts; each then soaks into the ground and is gone. A look
// only: nothing here touches the paint map, a blot or a slick (the ground's rules), so a puddle can never be dived into or drunk.
//
//   ITS SHAPE   one metaball blob drawn once (soft circles summed and cut, the spatter's way: tools/psygun/spatter.js), with a clear
//               margin so the texture's clamped edge is empty; a puddle grows by its UVs alone (its mesh never moves), so the blob
//               opens out from the middle, turned a fresh way each time
//   ON THE GROUND  a 9 x 9 grid laid on the ground once where it is spawned (a ray down at each vertex onto the fixed world), 2 cm over
//               it (casebook rules 1 and 90: never a flat card through a dune's slope, never in the ground's plane), its mesh placed
//               where it lies so the zones draw it with its ground
//   ITS LOOK    lit as the ground is (a Standard material: it darkens at night with the sand), wet and glossy, the body's own wet sand
//               in the tint it wears now (a paint's feeling, look.js hands it); soaking, it darkens a little as the sand drinks it and
//               fades. Four at most, the oldest given back for a fifth; one program for all four, warmed at boot (`prewarm`)
//
// Prior art: the spatter's pools and its metaball splats (tools/psygun/spatter.js), the wild slip jelly's puddle at its burst
// (creatures/jelly/slipjelly.js pop), Super Mario Sunshine's goop that soaks away, and the sixth generation's decals that fade rather
// than vanish (the comfort rule: nothing pops out).
//
//   const P = new SlipPuddles(game)   P.spawn(at, { r, spread, hold, soak, color }) -> a puddle (p.soak(secs) begins its soak; hold
//   Infinity waits for it)   P.update(rawDt)   P.prewarm() -> undo (one shown 50 m down for the compile)   P.active (how many show)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const N = 9, MAX = 4, LIFT = 0.02, CAP = 0.9;
const DOWN = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3(), _c = new THREE.Color();
/** What a puddle lies on: the fixed world, never a body that moves nor a sensor (the toll's reach's test: vfx/tollreach.js). */
const GROUND = (c) => !c.isSensor() && !c.parent()?.isDynamic() && !c.parent()?.isKinematic();
const ease = (t) => 1 - (1 - t) * (1 - t);

/** The blob: soft circles summed and cut at a threshold, white, its alpha the shape; clear for 14 px round its edge. */
function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d', { willReadFrequently: true });
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.globalCompositeOperation = 'lighter';
  const ball = (x, y, r) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.5);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
  };
  ball(64, 64, 30);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + rnd() * 0.4, r = 20 + rnd() * 16, rr = 7 + rnd() * 7; ball(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, rr); }
  const d = g.getImageData(0, 0, 128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const p = i / 4, x = (p % 128) - 63.5, y = Math.floor(p / 128) - 63.5, edge = 1 - THREE.MathUtils.smoothstep(Math.hypot(x, y), 46, 50);
    d.data[i + 3] = Math.round(255 * THREE.MathUtils.smoothstep(d.data[i] / 255, 0.3, 0.62) * edge);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
  }
  g.globalCompositeOperation = 'source-over'; g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  return t;
}

export class SlipPuddles {
  constructor(game) {
    this.game = game; this.list = []; this.tex = null;
  }
  get active() { return this.list.filter((p) => p.live).length; }

  /** One puddle's mesh: a grid of N x N, its uvs its own (rewritten as it grows). */
  make() {
    this.tex ||= blobTexture();
    const geo = new THREE.PlaneGeometry(1, 1, N - 1, N - 1).rotateX(-Math.PI / 2);
    geo.attributes.position.setUsage(THREE.DynamicDrawUsage); geo.attributes.uv.setUsage(THREE.DynamicDrawUsage);
    const mat = new THREE.MeshStandardMaterial({ map: this.tex, color: 0xffffff, roughness: 0.2, metalness: 0, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'slip-puddle'; mesh.visible = false; mesh.receiveShadow = true; mesh.renderOrder = 3; // (placed where it lies, so the zones draw it with its ground: render/zones.js)
    this.game.scene?.add(mesh);
    const p = { live: false, mesh, geo, mat, local: new Float32Array(N * N * 2), at: new THREE.Vector3(), r: 1, spin: 0, t: 0, spread: 0.3, hold: 0, soakT: 0, soakFor: 1, soaking: false, base: new THREE.Color(), alpha: CAP };
    p.soak = (secs = 1) => { if (!p.soaking) { p.soaking = true; p.soakT = 0; p.soakFor = Math.max(0.1, secs); } return p; };
    this.list.push(p);
    return p;
  }

  /** A puddle at `at` (on the ground), `r` metres at its widest, spread in `spread` real s, held `hold` (Infinity: until p.soak()),
   *  soaked away over `soak`; `color` its wet colour (a THREE.Color or hex: the body's, tinted). */
  spawn(at, { r = 1, spread = 0.3, hold = 0, soak = 1, color = 0x5c432b } = {}) {
    let p = this.list.find((x) => !x.live);
    if (!p) p = this.list.length < MAX ? this.make() : this.list.reduce((a, b) => (a.t > b.t ? a : b));
    p.at.copy(at); p.r = r; p.spread = Math.max(0.02, spread); p.hold = hold; p.soakFor = Math.max(0.1, soak); p.soaking = false; p.soakT = 0; p.t = 0;
    p.spin = Math.random() * Math.PI * 2; p.base.set(color);
    this.lay(p);
    p.live = p.mesh.visible = true;
    this.paint(p, 0);
    return p;
  }

  /** Laid on the ground: each vertex dropped onto the fixed world under it (once), 2 cm over it; its xz kept for the uvs. */
  lay(p) {
    const g = this.game, pos = p.geo.attributes.position, S = p.r * 2, ph = g.physics, P = g.player;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, x = (i / (N - 1) - 0.5) * S, z = (j / (N - 1) - 0.5) * S;
      const hit = ph?.raycast?.(_o.set(p.at.x + x, p.at.y + 0.8, p.at.z + z), DOWN, 2, P?.collider, undefined, GROUND);
      pos.setXYZ(k, x, (hit ? hit.point.y - p.at.y : 0) + LIFT, z);
      p.local[k * 2] = x; p.local[k * 2 + 1] = z;
    }
    pos.needsUpdate = true; p.geo.computeBoundingSphere();
    p.mesh.position.copy(p.at);
  }

  /** Its size now (the uvs opened out from the middle to radius `rad`) and its colour and alpha. */
  paint(p, rad) {
    const uv = p.geo.attributes.uv, c = Math.cos(p.spin), s = Math.sin(p.spin), k = 0.5 / Math.max(0.02, rad);
    for (let i = 0; i < N * N; i++) {
      const x = p.local[i * 2], z = p.local[i * 2 + 1];
      uv.setXY(i, 0.5 + (x * c - z * s) * k * 0.78, 0.5 + (x * s + z * c) * k * 0.78);
    }
    uv.needsUpdate = true;
  }

  update(raw) {
    for (const p of this.list) {
      if (!p.live) continue; // (its own state: the zones fold theirs into `visible`, render/zones.js)
      p.t += raw;
      if (!p.soaking && p.t >= p.spread + p.hold) p.soak(p.soakFor);
      const grow = ease(Math.min(1, p.t / p.spread));
      let rad = p.r * (0.25 + 0.75 * grow), a = CAP, dark = 0;
      if (p.soaking) {
        p.soakT += raw; const u = Math.min(1, p.soakT / p.soakFor);
        rad *= 1 + 0.12 * u; a = CAP * (1 - u * u); dark = 0.35 * Math.sqrt(u);
        if (u >= 1) { p.live = p.mesh.visible = false; continue; }
      }
      this.paint(p, rad);
      p.mat.opacity = a;
      p.mat.color.copy(p.base).multiplyScalar(1 - dark);
      p.mat.roughness = 0.2 + 0.55 * dark;
    }
  }

  /** One shown 50 m down for the boot's compile (its program: Standard, mapped, transparent), then hidden and put back. */
  prewarm() {
    const p = this.list[0] || this.make();
    p.at.set(0, -50, 0); p.r = 0.5; p.spin = 0; p.local.fill(0); this.paint(p, 0.5);
    const pos = p.geo.attributes.position; for (let i = 0; i < N * N; i++) pos.setXYZ(i, (i % N) * 0.1, 0, Math.floor(i / N) * 0.1);
    pos.needsUpdate = true; p.geo.computeBoundingSphere(); p.mesh.position.copy(p.at); p.mesh.visible = true;
    return () => { p.mesh.visible = false; };
  }

  /** The body's wet sand in the tint it wears (`tint` a THREE.Color: the material's colour, white when it wears none). */
  static wetOf(tint, out = _c) { return out.setRGB(0.36, 0.26, 0.16).multiply(tint); }
}
