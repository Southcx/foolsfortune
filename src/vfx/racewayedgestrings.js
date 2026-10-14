// ---------------------------------------------------------------------------------------
// THE EDGE STRINGS (the owner, 2026-10-14, after the first race: "particle strings along the outsides of the racetrack to show where the
// path is"): each edge of the Raceway's running surface strung with beads of light on a faint thread, a metre over the sand, all the
// way round the lap (Dovina's data: `raceway.edgeLines(step)`). Three parts, three draw calls for the whole lap:
//   - THE BEADS: a soft gold dot every EDGE_STRINGS.step metres on both edges, still (one Points cloud; fog takes the far ones).
//   - THE THREAD: a 1-pixel line through them (one LineSegments, its colour a vertex's), dim behind the board and brighter ahead.
//   - THE RUN: small bright motes flowing along both strings the race's way, only round the board: they grow in from nothing a few
//     metres ahead, run brightest and twice as dense 20 to 30 m ahead (where the eye should be at speed), and shrink away before
//     the window's end, so none pops (one instanced mesh of about 150 motes, rewritten each frame).
// The gold is the sun plates'; at night the strings cool toward a moonlit white-blue. Every material is stock and matches a program the
// boot already builds (measured on a primed boot: the additive mapped points of the title's and the garden's motes, the vertex-coloured
// lines of the debug overlays, the instanced unlit basic of the props; no program added).
//
// Prior art: the edge lights of an airport taxiway and of F-Zero's and Wipeout's tracks (a dotted line read at speed), the chase lights
// of a theatre marquee (light that runs the way to go), Mario Kart's Rainbow Road rails, and the house's own sun plates' gold.
//
//   const S = new RacewayEdgeStrings({ parent, zone })   S.build(edgeLines, step)   S.update(dt, { s, d, night })   S.dispose()
//   (built by vfx/racewaylooks.js dress(): s the board's place on the line, d its distance off it, night 0..1)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The numbers: metres between beads (what edgeLines is asked for); the beads' size (m, the dot's width up close) and brightness; the
 *  thread's brightness far off, right ahead and right behind, and how far (m) the window runs back and on; the run: motes' spacing (m),
 *  the window ahead (m from the board, where they grow in and shrink away), the bright band (m ahead), their speed along the string
 *  (m a real second), their radius (m) and brightness at ordinary and in the band; how far off the line (m) the run still shows; the
 *  night's colour and how far toward it. */
export const EDGE_STRINGS = {
  step: 1.75,
  bead: { size: 0.7, k: 1.5 },
  thread: { far: 0.28, ahead: 0.9, behind: 0.04, back: 30, fore: 60 },
  run: { spacing: 0.9, from: 2, to: 44, band: [20, 30], ramp: 8, speed: 2.4, r: 0.06, rBand: 0.13, k: 1.3, kBand: 3.4 },
  near: 60,
  colour: 0xffc45a, night: { colour: 0xcfe0ff, mix: 0.55 },
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _c = new THREE.Color(), _t = new THREE.Color(), _night = new THREE.Color(EDGE_STRINGS.night.colour), _gold = new THREE.Color(EDGE_STRINGS.colour);

let DOT = null; // (the bead's soft dot, one for the game)
function dotTexture() {
  if (DOT) return DOT;
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  for (const [t, a] of [[0, 1], [0.22, 0.9], [0.5, 0.28], [1, 0]]) gr.addColorStop(t, `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  DOT = new THREE.CanvasTexture(c); DOT.colorSpace = THREE.SRGBColorSpace;
  return DOT;
}

export class RacewayEdgeStrings {
  constructor({ parent, zone = 'raceway' } = {}) { this.parent = parent; this.zone = zone; this.t = 0; this.sides = []; this.objects = []; this.lastI = -1; this.night = -1; }

  /** Strung on edgeLines ([{ side, pts }], every `step` metres along the line from s = 0). */
  build(lines, step = EDGE_STRINGS.step) {
    this.dispose();
    const E = EDGE_STRINGS, n = lines[0]?.pts.length || 0; if (!n) return this;
    this.step = step; this.n = n; this.len = n * step;
    const pos = new Float32Array(lines.length * n * 3), index = [];
    lines.forEach((L, k) => {
      const o = k * n; L.pts.forEach((p, i) => p.toArray(pos, (o + i) * 3));
      for (let i = 0; i < n - 1; i++) index.push(o + i, o + i + 1);
      if (L.pts[n - 1].distanceTo(L.pts[0]) < step * 3) index.push(o + n - 1, o); // (round the lap's seam)
      this.sides.push({ o, pts: L.pts });
    });
    const P = new THREE.BufferAttribute(pos, 3);
    // the beads
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', P); bg.computeBoundingSphere();
    this.beadMat = new THREE.PointsMaterial({ name: 'edge-beads', map: dotTexture(), size: E.bead.size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.beads = new THREE.Points(bg, this.beadMat); this.beads.name = 'raceway-edge-beads';
    // the thread
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', P); tg.setIndex(index);
    this.col = new Float32Array(pos.length); tg.setAttribute('color', new THREE.BufferAttribute(this.col, 3)); tg.computeBoundingSphere();
    this.threadMat = new THREE.LineBasicMaterial({ name: 'edge-thread', vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.thread = new THREE.LineSegments(tg, this.threadMat); this.thread.name = 'raceway-edge-thread';
    // the run
    const R = E.run, lane = (from, to) => Math.max(1, Math.round((to - from) / R.spacing));
    this.lanes = [{ from: R.from, to: R.to, n: lane(R.from, R.to), phase: 0, band: false }, { from: R.band[0] - R.ramp, to: R.band[1] + R.ramp, n: lane(R.band[0] - R.ramp, R.band[1] + R.ramp), phase: 0.5, band: true }];
    const count = lines.length * (this.lanes[0].n + this.lanes[1].n);
    this.runMat = new THREE.MeshBasicMaterial({ name: 'edge-run', fog: false, toneMapped: false });
    const run = (this.run = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), this.runMat, count)); run.name = 'raceway-edge-run';
    for (let i = 0; i < count; i++) { run.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); run.setColorAt(i, _c.setRGB(1, 1, 1)); }
    run.frustumCulled = false; run.instanceMatrix.setUsage(THREE.DynamicDrawUsage); run.instanceColor.setUsage(THREE.DynamicDrawUsage);
    for (const o of (this.objects = [this.beads, this.thread, run])) { o.userData.zone = this.zone; o.renderOrder = 3; this.parent?.add(o); }
    this.lastI = -1; this.night = -1;
    return this;
  }

  /** A point on side k's string at s (m along the line, wrapping the lap), into out. */
  at(k, s, out) {
    const S = this.sides[k], n = this.n, f = (((s / this.step) % n) + n) % n, i = Math.floor(f), j = (i + 1) % n;
    return out.copy(S.pts[i]).lerp(S.pts[j], f - i);
  }

  /** Each frame: s the board's place on the line (null: no board), d its distance off it, night 0..1. */
  update(dt, { s = null, d = 0, night = 0 } = {}) {
    if (!this.run) return;
    const E = EDGE_STRINGS, on = s != null && d < E.near;
    this.t += dt;
    // the colour of the hour (redone only as it changes)
    if (Math.abs(night - this.night) > 0.01) {
      this.night = night; _t.copy(_gold).lerp(_night, night * E.night.mix);
      this.beadMat.color.copy(_t).multiplyScalar(E.bead.k); this.lastI = -2; // (the thread recoloured below)
    }
    // the thread: dim behind the board, brighter ahead (the window rewritten as the board's place moves on a bead)
    const iNow = on ? Math.floor(s / this.step) : -1;
    if (iNow !== this.lastI) {
      this.lastI = iNow; const T = E.thread, n = this.n, col = this.col;
      for (const S of this.sides) for (let i = 0; i < n; i++) {
        let k = T.far;
        if (on) {
          let dd = (i - iNow) * this.step; dd = ((dd % this.len) + this.len * 1.5) % this.len - this.len / 2; // (signed, the short way round)
          if (dd >= 0) k = T.far + (T.ahead - T.far) * (1 - smooth(T.fore * 0.5, T.fore, dd));
          else k = T.behind + (T.far - T.behind) * smooth(0, T.back, -dd); // (darkest right behind, back to the far glow by T.back)
        }
        _c.copy(_t).multiplyScalar(k).toArray(col, (S.o + i) * 3);
      }
      this.thread.geometry.attributes.color.needsUpdate = true;
    }
    // the run: two lanes of motes per string flowing the race's way, grown in and shrunk away at the window's ends
    const run = this.run, M = run.instanceMatrix.array, C = run.instanceColor.array, R = E.run;
    let m = 0;
    for (let k = 0; k < this.sides.length; k++) for (const ln of this.lanes) {
      const span = ln.to - ln.from;
      for (let j = 0; j < ln.n; j++) {
        const o = m * 16, c = m * 3; m++;
        if (!on) { M[o] = M[o + 5] = M[o + 10] = 0; continue; }
        const ahead = ln.from + ((((j + ln.phase) * R.spacing + this.t * R.speed) % span) + span) % span;
        const band = smooth(R.band[0] - R.ramp, R.band[0], ahead) * (1 - smooth(R.band[1], R.band[1] + R.ramp, ahead));
        const env = ln.band ? band : smooth(R.from, R.from + 5, ahead) * (1 - smooth(R.to - 8, R.to, ahead));
        const r = (ln.band ? R.rBand : R.r + (R.rBand - R.r) * band) * env;
        this.at(k, s + ahead, _p);
        M[o] = M[o + 5] = M[o + 10] = r; M[o + 1] = M[o + 2] = M[o + 4] = M[o + 6] = M[o + 8] = M[o + 9] = 0; M[o + 15] = 1;
        M[o + 12] = _p.x; M[o + 13] = _p.y; M[o + 14] = _p.z;
        _c.copy(_t).multiplyScalar(R.k + (R.kBand - R.k) * band).toArray(C, c);
      }
    }
    run.instanceMatrix.needsUpdate = true; run.instanceColor.needsUpdate = true;
  }

  dispose() {
    for (const o of this.objects) { o.parent?.remove(o); o.geometry.dispose(); }
    this.beadMat?.dispose(); this.threadMat?.dispose(); this.runMat?.dispose(); this.run?.dispose();
    this.objects = []; this.sides = []; this.run = this.beads = this.thread = null;
  }
}
const _p = new THREE.Vector3();
