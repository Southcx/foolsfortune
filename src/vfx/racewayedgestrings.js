// ---------------------------------------------------------------------------------------
// THE EDGE STRINGS (the owner, 2026-10-14, after the first race: "particle strings along the outsides of the racetrack to show where the
// path is"): each edge of the Raceway's running surface strung with beads of light on a faint thread, a metre over the sand, all the
// way round the lap (Dovina's data: `raceway.edgeLines(step)`). Three parts, three draw calls for the whole lap:
//   - THE BEADS: a soft gold dot every EDGE_STRINGS.step metres on both edges, still (one Points cloud; fog takes the far ones).
//   - THE THREAD: a 1-pixel line through them (one LineSegments, its colour a vertex's), dim behind the board and brighter ahead.
//   - THE RUN: small bright motes flowing along both strings the race's way, only round the board: they grow in from nothing a few
//     metres ahead, run brightest and twice as dense 20 to 30 m ahead (where the eye should be at speed), and shrink away before
//     the window's end, so none pops (one instanced mesh of about 150 motes, rewritten each frame).
// Their colour is the labradorite's play (the owner, v204: "the UI elements all read as too blue versus Lachryma labradorite"; it was
// the sun plates' gold): the beads a dark rim with the oil film's colours (violet, teal, gold, magenta) walking through their middles
// at a constant rate; the thread and the run the film's hue moving on along the string's length (vfx/oxidation.js featTint, SCHILLER),
// the run's motes walking it as they flow; at night all of it pales toward the stone's ultraviolet. Every material is stock and matches a program the
// boot already builds (measured on a primed boot: the additive mapped points of the title's and the garden's motes, the vertex-coloured
// lines of the debug overlays, the instanced unlit basic of the props; no program added).
//
// Prior art: the edge lights of an airport taxiway and of F-Zero's and Wipeout's tracks (a dotted line read at speed), the chase lights
// of a theatre marquee (light that runs the way to go), Mario Kart's Rainbow Road rails, and the house's own sun plates' gold.
//
// Round 3: a string per line. The cavern's branch has its own (vfx/racewaycavern.js: `line: 'cavern'`, not a loop, so the run stops at
// its end); only the line the Courier is on runs (`EDGE_LINE.lit`, set from raceway.line), the other's beads and thread stay still.
// Round 4, the park (SKIFF-RACING.md 10): every track strung, all of them in the same three draws (each line its `group`, the track's
// id; only the board's track runs and brightens); and the strings BROKEN where a point lies on the other line's road (edgeLines'
// `hide`: the cavern's fork and merge, where the owner saw them cut across it): no bead, no thread, no run there.
//
//   const S = new RacewayEdgeStrings({ parent, zone, line?, loop? })   S.build(edgeLines, step)   S.update(dt, { s, d, night, group })   S.dispose()
//   (built by vfx/racewaylooks.js dress(): s the board's place on its line, d its distance off it, night 0..1, group its track's id)   EDGE_LINE.lit
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { featTint, SCHILLER } from './oxidation.js';
import { LACHRYMA_SCHILLER } from './racewayeffects.js';

/** The numbers: metres between beads (what edgeLines is asked for); the beads' size (m, the dot's width up close) and brightness; the
 *  thread's brightness far off, right ahead and right behind, and how far (m) the window runs back and on; the run: motes' spacing (m),
 *  the window ahead (m from the board, where they grow in and shrink away), the bright band (m ahead), their speed along the string
 *  (m a real second), their radius (m) and brightness at ordinary and in the band; how far off the line (m) the run still shows; the
 *  night's colour and how far toward it (the film's colours themselves: vfx/oxidation.js). */
export const EDGE_STRINGS = {
  step: 1.75,
  bead: { size: 0.7, k: 1.15 },
  thread: { far: 0.28, ahead: 0.9, behind: 0.04, back: 30, fore: 60 },
  run: { spacing: 0.9, from: 2, to: 44, band: [20, 30], ramp: 8, speed: 2.4, r: 0.06, rBand: 0.13, k: 1.3, kBand: 3.4, film: 0.8 },
  near: 60,
  night: { colour: LACHRYMA_SCHILLER, mix: 0.45 },
};

/** Which line's run is lit: raceway.line ('main' | 'cavern'), set each frame by the cavern's look (vfx/racewaycavern.js). */
export const EDGE_LINE = { lit: 'main' };

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _c = new THREE.Color(), _night = new THREE.Color(EDGE_STRINGS.night.colour);
/** The film's colour at phase ph, paled toward the night's by n (0..1): into out. */
const filmAt = (ph, n, out) => featTint(ph, out, { bright: 1 }).lerp(_night, n);

let DOT = null; // (the bead's soft dot, one for the game)
function dotTexture() {
  if (DOT) return DOT;
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  // (a lit bead with a dark rim, drawn over the sand, not added to it: additive gold vanished on bright noon sand)
  for (const [t, v, a] of [[0, 255, 1], [0.38, 235, 1], [0.55, 60, 1], [0.72, 30, 0.85], [1, 30, 0]]) gr.addColorStop(t, `rgba(${v},${v},${v},${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  DOT = new THREE.CanvasTexture(c); DOT.colorSpace = THREE.SRGBColorSpace;
  return DOT;
}

export class RacewayEdgeStrings {
  constructor({ parent, zone = 'raceway', line = 'main', loop = true } = {}) { this.parent = parent; this.zone = zone; this.line = line; this.loop = loop; this.t = 0; this.sides = []; this.objects = []; this.lastI = -1; this.lastG = undefined; this.night = -1; }

  /** Strung on edgeLines ([{ side, pts, hide?, group? }], every `step` metres along each line from s = 0). Lines of several tracks may
   *  be strung at once, each with its `group` (the track's id): one set of draws for all, the run only on the group asked for. A point
   *  with `hide` 1 lies on another line's road: no bead there, no thread to or from it, no run across it. */
  build(lines, step = EDGE_STRINGS.step) {
    this.dispose();
    const E = EDGE_STRINGS, total = lines.reduce((a, L) => a + L.pts.length, 0); if (!total) return this;
    this.step = step;
    const pos = new Float32Array(total * 3), bead = [], index = [];
    let o = 0;
    for (const L of lines) {
      const n = L.pts.length, hide = L.hide || null, hid = (i) => !!hide?.[i];
      L.pts.forEach((p, i) => { p.toArray(pos, (o + i) * 3); if (!hid(i)) bead.push(p.x, p.y, p.z); });
      for (let i = 0; i < n - 1; i++) if (!hid(i) && !hid(i + 1)) index.push(o + i, o + i + 1);
      const loop = this.loop && n > 2 && L.pts[n - 1].distanceTo(L.pts[0]) < step * 3;
      if (loop && !hid(n - 1) && !hid(0)) index.push(o + n - 1, o); // (round the lap's seam)
      this.sides.push({ o, n, len: n * step, loop, pts: L.pts, hide, group: L.group ?? null });
      o += n;
    }
    // the beads (only those shown: their own positions)
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bead, 3)); bg.computeBoundingSphere();
    this.beadMat = new THREE.PointsMaterial({ name: 'edge-beads', map: dotTexture(), size: E.bead.size, transparent: true, depthWrite: false });
    this.beads = new THREE.Points(bg, this.beadMat); this.beads.name = 'raceway-edge-beads';
    // the thread
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setIndex(index);
    this.col = new Float32Array(pos.length); tg.setAttribute('color', new THREE.BufferAttribute(this.col, 3)); tg.computeBoundingSphere();
    this.threadMat = new THREE.LineBasicMaterial({ name: 'edge-thread', vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.thread = new THREE.LineSegments(tg, this.threadMat); this.thread.name = 'raceway-edge-thread';
    // the run: motes enough for the most strings one group has (its two edges)
    const R = E.run, lane = (from, to) => Math.max(1, Math.round((to - from) / R.spacing));
    this.lanes = [{ from: R.from, to: R.to, n: lane(R.from, R.to), phase: 0, band: false }, { from: R.band[0] - R.ramp, to: R.band[1] + R.ramp, n: lane(R.band[0] - R.ramp, R.band[1] + R.ramp), phase: 0.5, band: true }];
    const per = new Map(); for (const S of this.sides) per.set(S.group, (per.get(S.group) || 0) + 1);
    const count = Math.max(...per.values()) * (this.lanes[0].n + this.lanes[1].n);
    this.runMat = new THREE.MeshBasicMaterial({ name: 'edge-run', fog: false, toneMapped: false });
    const run = (this.run = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), this.runMat, count)); run.name = 'raceway-edge-run';
    for (let i = 0; i < count; i++) { run.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); run.setColorAt(i, _c.setRGB(1, 1, 1)); }
    run.frustumCulled = false; run.instanceMatrix.setUsage(THREE.DynamicDrawUsage); run.instanceColor.setUsage(THREE.DynamicDrawUsage);
    for (const o2 of (this.objects = [this.beads, this.thread, run])) { o2.userData.zone = this.zone; o2.renderOrder = 3; this.parent?.add(o2); }
    this.lastI = -1; this.lastG = undefined; this.night = -1;
    return this;
  }

  /** Side k's string at s (m along its line, wrapping a lap; an open string's held at its ends): the point into out; returns whether it
   *  is shown there (false where either bead of its stretch is hidden). */
  at(k, s, out) {
    const S = this.sides[k], n = S.n, f = S.loop ? (((s / this.step) % n) + n) % n : Math.max(0, Math.min(n - 1.001, s / this.step)), i = Math.floor(f), j = (i + 1) % n;
    out.copy(S.pts[i]).lerp(S.pts[j], f - i);
    return !(S.hide && (S.hide[i] || S.hide[j]));
  }

  /** Each frame: s the board's place on its line (null: no board), d its distance off it, night 0..1, group the board's track (that
   *  group's strings run and brighten ahead; the rest stay still at the far glow). */
  update(dt, { s = null, d = 0, night = 0, group = null } = {}) {
    if (!this.run) return;
    const E = EDGE_STRINGS, on = s != null && d < E.near && this.line === EDGE_LINE.lit;
    this.t += dt;
    // the colour of the hour (the thread redone only as it changes); the beads' middles walk the film at its constant rate
    const nk = night * E.night.mix;
    if (Math.abs(night - this.night) > 0.01) { this.night = night; this.lastI = -2; this.lastG = undefined; } // (the thread recoloured below)
    filmAt(this.t * SCHILLER.rate, nk, this.beadMat.color).multiplyScalar(E.bead.k);
    // the thread: dim behind the board, brighter ahead (the window rewritten as the board's place moves on a bead); the other groups'
    // strings written at the far glow only when the group changes
    const iNow = on ? Math.floor(s / this.step) : -1;
    if (iNow !== this.lastI || group !== this.lastG) {
      const all = group !== this.lastG || iNow === -1 || this.lastI === -2, T = E.thread, col = this.col;
      this.lastI = iNow; this.lastG = group;
      for (const S of this.sides) {
        const mine = on && S.group === group; if (!mine && !all) continue;
        for (let i = 0; i < S.n; i++) {
          let k = T.far;
          if (mine) {
            let dd = (i - iNow) * this.step; if (S.loop) dd = ((dd % S.len) + S.len * 1.5) % S.len - S.len / 2; // (signed, the short way round)
            if (dd >= 0) k = T.far + (T.ahead - T.far) * (1 - smooth(T.fore * 0.5, T.fore, dd));
            else k = T.behind + (T.far - T.behind) * smooth(0, T.back, -dd); // (darkest right behind, back to the far glow by T.back)
          }
          filmAt(i * this.step * SCHILLER.along, nk, _c).multiplyScalar(k).toArray(col, (S.o + i) * 3); // (the film's hue moving on along the string)
        }
      }
      this.thread.geometry.attributes.color.needsUpdate = true;
    }
    // the run: two lanes of motes per string of the board's group flowing the race's way, grown in and shrunk away at the window's
    // ends, none across a hidden stretch
    const run = this.run, M = run.instanceMatrix.array, C = run.instanceColor.array, R = E.run;
    let m = 0;
    if (on) for (let k = 0; k < this.sides.length; k++) {
      const S = this.sides[k]; if (S.group !== group) continue;
      for (const ln of this.lanes) {
        const span = ln.to - ln.from;
        for (let j = 0; j < ln.n && m < run.count; j++) {
          const o = m * 16, c = m * 3; m++;
          const ahead = ln.from + ((((j + ln.phase) * R.spacing + this.t * R.speed) % span) + span) % span;
          const band = smooth(R.band[0] - R.ramp, R.band[0], ahead) * (1 - smooth(R.band[1], R.band[1] + R.ramp, ahead));
          const env = ln.band ? band : smooth(R.from, R.from + 5, ahead) * (1 - smooth(R.to - 8, R.to, ahead));
          const end = S.loop ? 1 : 1 - smooth(S.len - 8, S.len - 1, s + ahead); // (an open string's run fades out before its end)
          const shown = this.at(k, s + ahead, _p);
          const r = shown ? (ln.band ? R.rBand : R.r + (R.rBand - R.r) * band) * env * end : 0;
          M[o] = M[o + 5] = M[o + 10] = r; M[o + 1] = M[o + 2] = M[o + 4] = M[o + 6] = M[o + 8] = M[o + 9] = 0; M[o + 15] = 1;
          M[o + 12] = _p.x; M[o + 13] = _p.y; M[o + 14] = _p.z;
          filmAt((s + ahead) * SCHILLER.along - this.t * SCHILLER.rate, nk, _c).multiplyScalar((R.k + (R.kBand - R.k) * band) * R.film).toArray(C, c); // (the film along the string, walking as the motes flow)
        }
      }
    }
    for (; m < run.count; m++) { const o = m * 16; M[o] = M[o + 5] = M[o + 10] = 0; } // (the motes no string took)
    run.instanceMatrix.needsUpdate = true; run.instanceColor.needsUpdate = true;
  }

  dispose() {
    for (const o of this.objects) { o.parent?.remove(o); o.geometry.dispose(); }
    this.beadMat?.dispose(); this.threadMat?.dispose(); this.runMat?.dispose(); this.run?.dispose();
    this.objects = []; this.sides = []; this.run = this.beads = this.thread = null;
  }
}
const _p = new THREE.Vector3();
