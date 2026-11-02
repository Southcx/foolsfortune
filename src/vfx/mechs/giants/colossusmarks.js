// ---------------------------------------------------------------------------------------
// THE DUNE COLOSSUS'S MARKS AND TELLS (plain names; docs/plans/MECHS.md 11.2; the moves Dovina's, world/hangar/giantmoves.js): its moves'
// placeholders dressed over by name in the proving ground, and each windup told on its body before it lands, looks only:
//   THE TELLS   read from the giant's own windup (its move and how far through it is), on top of the eyes warming to an ember
//               (giants/colossus.js):
//     sweep     sand pouring off the right arm about to swing, from the fist and the shoulder guard
//     burrow    the head lowering as it sinks, sand drawn in round its feet
//     hurl      a clod of fired clay swelling in the right mitten, sand running off it
//     wave      both arms up, sand pouring off both and gathering round its feet
//   THE MARKS   her placeholders hidden, drawn as:
//     giant.burrow.ring   a vortex of sand sinking where it will erupt: a spiral of sand turning in toward a dark eye, an ember
//                         edge throbbing faster as the eruption nears (her ring's opacity read as its beat), sand drawn in round it
//     giant.clod          a lump of fired clay (lumpy, a crust of sand on it) trailing sand; where it ends, shards over her sand
//     giant.wave          a cone of sand risen like a breaking wave: a sheet swept across her cone's angle, rising to a crest that
//                         curls over at its front, travelling out and falling as her fan fades, spray thrown off its lip; drawn
//                         wet and dark (a damp sand body, low roughness) so it reads on the bright sand, its crest lit pale and the
//                         underside of its lip in shadow
// Prior art: Tremors' and Dune's worm (the sand rings before it erupts: here a sinking vortex, an antlion's pit), Hokusai's Great
// Wave (the curl of the crest), Shadow of the Colossus (a giant read from far off by its body), Monster Hunter's tells (an arm
// raised, sand pouring before a sweep), the island's sentinel's slam (vfx/sentinellook.js).
//
//   const M = new ColossusMarks(game)   M.update(dt, t, giant, dress, into)   M.clear()   MARKS_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CLOD } from '../../../world/hangar/giantmoves.js';

/** The marks' colours and timings: the ember edge, the sand, how often each spills (real s), the wave's crest (a share of its reach). */
export const MARKS_LOOK = { ember: 0xff6a20, sand: 0xd9b98a, sandDark: 0xa8845a, clay: 0xa85a36, pour: 0.11, trail: 0.05, draw: 0.16, crest: 0.42, held: 2.2 };
const ML = MARKS_LOOK, PI = Math.PI, _a = new THREE.Vector3(), _b = new THREE.Vector3();

function spiralTex() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), c = S / 2;
  const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(8,3,1,1)'); gr.addColorStop(0.3, 'rgba(60,34,16,1)'); gr.addColorStop(0.7, 'rgba(150,104,62,0.95)'); gr.addColorStop(0.92, 'rgba(200,160,110,0.8)'); gr.addColorStop(1, 'rgba(217,185,138,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let arm = 0; arm < 5; arm++) { // (the sand's streaks wound in to the eye)
    g.beginPath(); for (let k = 0; k <= 80; k++) { const t = k / 80, r = c * (0.08 + 0.9 * t), a = arm * (PI * 2 / 5) + t * 5.2; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
    g.strokeStyle = 'rgba(40,20,8,0.7)'; g.lineWidth = 16; g.stroke(); g.strokeStyle = 'rgba(240,218,176,0.5)'; g.lineWidth = 4; g.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function streakTex() {
  const W = 128, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(1, 'rgba(225,215,200,0.95)'); // (light: the sheet's own colours tint it)
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(${k % 2 ? '120,84,48' : '255,244,220'},0.25)`; g.fillRect((k * 37) % W, (k * 61) % H, 2, 20 + (k % 7) * 8); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/** A lump: an icosphere pushed in and out, a clod of the island's clay. */
function lump(r, seed = 1) {
  const g = new THREE.IcosahedronGeometry(r, 2), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { _a.fromBufferAttribute(P, i); const k = 1 + 0.18 * Math.sin(_a.x * 2.1 * seed + _a.y * 1.3) * Math.cos(_a.z * 1.7 - _a.y); P.setXYZ(i, _a.x * k, _a.y * k * 0.9, _a.z * k); }
  g.computeVertexNormals(); return g;
}
/** A row of the wave's profile coloured: wet dark sand rising to a damp face, the crest and the lip's top lit pale, under the lip in shadow. */
function waveTone(i) {
  if (i <= 5) { const f = i / 5; return [0.2 + 0.12 * f, 0.13 + 0.08 * f, 0.08 + 0.05 * f]; } // (wet sand, dark to the lip: the bright yard behind never washes it out)
  if (i <= 7) return i === 6 ? [1.15, 1.02, 0.8] : [1.0, 0.88, 0.68];
  return [0.2, 0.13, 0.08];
}
/** The wave's sheet: a profile (out along the cone, up) swept across `angle` either side of +z, its front curling over. */
function waveGeo(R, angle, H) {
  const prof = [[0, 0], [0.3, 0.06], [0.55, 0.2], [0.72, 0.42], [0.84, 0.66], [0.93, 0.86], [1, 1], [1.06, 1.02], [1.1, 0.92], [1.11, 0.78], [1.08, 0.66]];
  const N = prof.length, M = 28, pos = [], uv = [], col = [], idx = [];
  for (let j = 0; j <= M; j++) {
    const th = -angle + (2 * angle * j) / M;
    for (let i = 0; i < N; i++) { const [r, y] = prof[i]; pos.push(Math.sin(th) * r * R, y * H * (0.75 + 0.25 * Math.cos((th / angle) * PI * 0.5)), Math.cos(th) * r * R); uv.push(j / M * 6, i / (N - 1)); col.push(...waveTone(i)); }
  }
  for (let j = 0; j < M; j++) for (let i = 0; i < N - 1; i++) { const a = j * N + i, b = a + N; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export class ColossusMarks {
  constructor(game) {
    this.game = game; this.marks = new Map(); this.t = { pour: 0, trail: 0, draw: 0 }; this.held = null;
    this.hidden = new THREE.MeshBasicMaterial({ visible: false });
    const m = (o) => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
    this.mats = {
      vortex: new THREE.MeshBasicMaterial({ map: spiralTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }),
      band: new THREE.MeshBasicMaterial({ color: 0xc23a10, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 }),
      edge: new THREE.MeshBasicMaterial({ color: ML.ember, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }),
      clay: m({ color: ML.clay, flatShading: true }), crust: m({ color: ML.sand }),
      wave: new THREE.MeshStandardMaterial({ map: streakTex(), vertexColors: true, transparent: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.05, depthWrite: false }),
    };
    this.geos = { lump: lump(CLOD.size * 0.72), crust: lump(CLOD.size * 0.5, 2.3), held: lump(1, 1.7) };
  }
  play(n, ctx) { try { this.game.vfx?.play(n, ctx); } catch { /* (headless) */ } }

  update(dt, t, Gi, dress, into) {
    if (Gi && dress?.kind === 'sand') this.tells(dt, t, Gi, dress); else this.dropHeld();
    if (into) this.dressMarks(dt, t, into);
  }

  // ------------------------------------------------------------------ the tells
  tells(dt, t, Gi, dress) {
    const W = Gi.windup, k = W ? Math.max(0, Math.min(1, 1 - W.t / W.of)) : 0, mv = W?.kind === 'ring' ? 'burrow' : W?.move;
    const head = dress.head; if (head) { const want = mv === 'burrow' ? 0.55 * Math.min(1, k * 3) : 0; head.rotation.x += (want - head.rotation.x) * Math.min(1, dt * 5); }
    for (const key in this.t) this.t[key] -= dt;
    const fistOf = (i) => { const F = Gi.fore?.[i]; if (!F || F.visible === false) return null; F.updateMatrixWorld(true); return _a.set(0, -7.2, 0).applyMatrix4(F.matrixWorld).clone(); };
    if (W && !Gi.air && !Gi.under && this.t.pour <= 0 && (mv === 'sweep' || mv === 'wave' || mv === 'hurl')) {
      this.t.pour = ML.pour * (1.4 - k);
      const at = fistOf(0); if (at) this.play('giant.sand.pour', { pos: at, scale: 1 + k, floor: Gi.pos.y });
      if (mv === 'sweep') { const A = Gi.arms?.[0]; if (A?.visible !== false) { A.updateMatrixWorld(true); this.play('giant.sand.pour', { pos: _b.set(0, 0.8, 0).applyMatrix4(A.matrixWorld).clone(), scale: 1.3, floor: Gi.pos.y }); } }
      if (mv === 'wave') { const B = fistOf(1); if (B) this.play('giant.sand.pour', { pos: B, scale: 1 + k, floor: Gi.pos.y }); }
    }
    if (W && (mv === 'burrow' || mv === 'wave') && this.t.draw <= 0 && !Gi.stashed) { this.t.draw = ML.draw; this.play('giant.burrow.draw', { pos: _a.copy(Gi.pos).setY(Gi.pos.y + 0.5), scale: 9, floor: Gi.pos.y }); }
    // the hurl's clod swelling in the right mitten
    if (mv === 'hurl' && Gi.fore?.[0]) {
      if (!this.held) { this.held = new THREE.Mesh(this.geos.held, this.mats.clay); this.held.name = 'giant.dress.heldClod'; this.held.castShadow = true; }
      if (this.held.parent !== Gi.fore[0]) Gi.fore[0].add(this.held);
      this.held.position.set(0, -7.6, 2.4); this.held.scale.setScalar(ML.held * (0.4 + CLOD.size * 0.62 * k)); this.held.rotation.y = t * 0.6;
    } else this.dropHeld();
  }
  dropHeld() { this.held?.removeFromParent(); }

  // ------------------------------------------------------------------ the marks
  dressMarks(dt, t, into) {
    for (const o of into.children) {
      if (this.marks.has(o)) continue;
      if (o.name === 'giant.burrow.ring') this.ring(o, into);
      else if (o.name === 'giant.clod') this.clod(o);
      else if (o.name === 'giant.wave' && o.isMesh) this.wave(o, into);
    }
    for (const [o, M] of this.marks) {
      if (!o.parent) { M.end?.(); M.free?.(); M.own?.removeFromParent(); M.own?.traverse((x) => { if (x.geometry && x.userData.own) x.geometry.dispose(); }); this.marks.delete(o); continue; }
      M.step(dt, t);
    }
  }
  ring(o, into) {
    const child = o.children[0], R = child?.geometry?.parameters?.outerRadius ?? 12, mat = child?.material;
    for (const c of o.children) c.visible = false;
    const own = new THREE.Group(); own.name = 'giant.dress.burrow'; o.add(own);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R * 1.05, 48), this.mats.vortex); disc.rotation.x = -PI / 2; disc.position.y = -0.12; disc.userData.own = true; own.add(disc);
    const band = new THREE.Mesh(new THREE.RingGeometry(R - 0.7, R + 0.5, 64), this.mats.band); band.rotation.x = -PI / 2; band.position.y = -0.1; band.userData.own = true; own.add(band);
    const edge = new THREE.Mesh(new THREE.RingGeometry(R - 1.6, R + 1.2, 64), this.mats.edge.clone()); edge.rotation.x = -PI / 2; edge.position.y = -0.06; edge.userData.own = true; own.add(edge);
    let drawT = 0;
    this.marks.set(o, { own, step: (dt, tt) => {
      const k = mat ? THREE.MathUtils.clamp((mat.opacity - 0.25) / 0.55, 0, 1) : 0.5; // (her ring's beat: 0.25 .. 0.8)
      disc.rotation.z += dt * (0.6 + 2.4 * k); disc.scale.setScalar(0.9 + 0.1 * Math.sin(tt * 3));
      edge.material.opacity = 0.35 + 0.65 * k * (0.6 + 0.4 * Math.sin(tt * (6 + 14 * k))); edge.scale.setScalar(1 + 0.03 * k); this.mats.band.color.setHex(0xc23a10).multiplyScalar(0.8 + 0.8 * k);
      if ((drawT -= dt) <= 0) { drawT = ML.draw; this.play('giant.burrow.draw', { pos: _a.copy(o.position).setY(o.position.y + 0.4), scale: R * 0.9, floor: o.position.y - 0.25 }); }
    }, free: () => edge.material.dispose() });
    void into;
  }
  clod(o) {
    for (const c of o.children) c.visible = false;
    const own = new THREE.Group(); own.name = 'giant.dress.clod'; o.add(own);
    const a = new THREE.Mesh(this.geos.lump, this.mats.clay), b = new THREE.Mesh(this.geos.crust, this.mats.crust); a.castShadow = true;
    b.position.set(0.6, 0.9, 0.3); own.add(a, b);
    let trailT = 0; const last = o.position.clone();
    this.marks.set(o, { own, step: (dt) => {
      last.copy(o.position);
      if ((trailT -= dt) <= 0) { trailT = ML.trail; this.play('giant.clod.trail', { pos: o.position.clone(), scale: 1.2 }); }
    }, end: () => this.play('giant.clod.burst', { pos: last.clone(), floor: last.y - 0.5 }) });
  }
  wave(o, into) {
    const P = o.geometry?.parameters || {}, R = P.radius ?? 30, angle = (P.thetaLength ?? 1.4) / 2, mat = o.material, H = Math.max(5, R * ML.crest);
    o.userData.own ??= mat; o.material = this.hidden;
    const own = new THREE.Group(); own.name = 'giant.dress.wave'; own.position.copy(o.position).setY(o.position.y - 0.3); own.rotation.y = o.rotation.y; into.add(own);
    const sheet = new THREE.Mesh(waveGeo(R, angle, H), this.mats.wave.clone()); sheet.userData.own = true; own.add(sheet);
    const fwd = new THREE.Vector3(Math.sin(o.rotation.y), 0, Math.cos(o.rotation.y));
    let sprayed = 0;
    this.marks.set(o, { own, step: () => {
      const op = o.userData.own?.opacity ?? 0.3, p = THREE.MathUtils.clamp(1 - op / 0.6, 0, 1), e = 1 - (1 - p) * (1 - p);
      own.scale.set(0.3 + 0.7 * e, Math.sin(PI * Math.min(1, 0.15 + p * 1.05)) * 1.1, 0.3 + 0.7 * e);
      sheet.material.opacity = Math.min(1, op / 0.6 * 2.6); // (near solid while it stands: a translucent sheet vanished on the bright sand)
      if (sprayed < 3 && p >= sprayed * 0.25) { sprayed++; this.play('giant.wave.spray', { pos: _a.copy(own.position).addScaledVector(fwd, R * (0.35 + 0.65 * e)).setY(own.position.y + H * 0.5), dir: fwd.clone().setY(0.35).normalize(), scale: R / 10, floor: own.position.y }); }
    }, free: () => sheet.material.dispose() });
  }

  clear() {
    for (const [o, M] of this.marks) { M.own?.removeFromParent(); M.own?.traverse((x) => { if (x.geometry && x.userData.own) x.geometry.dispose(); }); M.free?.(); if (o.userData.own) { o.material = o.userData.own; delete o.userData.own; } }
    this.marks.clear(); this.dropHeld();
  }
  dispose() { this.clear(); for (const g of Object.values(this.geos)) g.dispose(); for (const m of Object.values(this.mats)) { m.map?.dispose(); m.dispose(); } this.hidden.dispose(); }
}
