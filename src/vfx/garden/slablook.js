// ---------------------------------------------------------------------------------------
// CARVING A SLAB, ITS LOOK (docs/plans/SEEDS-SLABS-SCANS.md 2; Petra's bench and its stand-ins, world/garden/bench.js; Dovina's kernel,
// progress/slabs.js; Calissa's concept sheet of six slabs, 2026-10-30, the strata slab its brief). Only looks: every rule, every number and
// every use stay the bench's. This draws over it, in the matter look's one program (vfx/godhand/matterlook.js) and the effect library's:
//
//   THE BENCH        a fossil-preparation bench in place of the grey table (vfx/garden/benchmodel.js): its tray, its mat, its tools racked
//                    behind the slab in the keys' order, its magnifier lamp
//   THE SLAB         carved stone (vfx/garden/slabmesh.js): the strata in the island's matter, chipped at its edges, meshed again after
//                    each use (a cleared cell gone, a struck one pared back and paler); THE FOSSIL in Lachrymite, the labradorite's
//                    flash on it, the creature's feeling faint in it, its cracks drawn darker, a broken cell in shards
//   THE CHISEL'S MARK  on the cell under the cursor: gold brackets on the face it would be struck through and the chisel standing off that
//                    face, its point on the cell; dashed, what the verb up would reach (the cell behind for the pick, a ring of 1.8 cells
//                    for the blast, 1.2 for the hoover, the whole layer round the slab for the slice)
//   THE TOLL         the fossil's rim drawn through the stone in the film for 1.5 real s, ringing three times (the matter look's 'toll')
//   THE SILHOUETTE   once the plate has been held to it, the fossil's footprint as a faint line of the film on the stone that faces up
//   EACH USE         its verb's moment where it struck (vfx/library/slabs.js: `slab.<verb>`, in the stratum's colour), and a crack star at
//                    each fossil cell it cracked
//   THE END          on `slab.carve`: the fossil lifts off its bed glowing, the stone left falls away, and the spirit wakes out of the
//                    fossil (its body, the garden's spirit, rising and going off to the Grove); a flawless dig's wears the shiny inversion
//                    and a ring of stars (`slab.wake.rare`)
//
// Petra's stand-ins (the cubes, the see-through cubes, the flat outline, the wire cube, the grey table) are hidden here, never touched:
// docs/handoffs/petra/2026-10-30-from-calissa-bench-look.md asks for them to go.
//
// Prior art: Spectrobes: Origins' excavation (the tool at the cursor, the fossil showing a little at a time, the creature rising out of
// it), Fossil Fighters' cleaning (the X-ray's outline through the rock, the bone's crack flash, the revival), Pokemon Diamond's
// Underground, a stonemason's banker mark; the bracket reticles of every action game's lock-on, turned to a chisel's.
//
//   game.slabLook = new SlabLook(game)   .update(rawDt)   (dresses the bench on the garden's first entry; follows `realm.bench`)
//   SLAB_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { matterMaterial } from '../godhand/matterlook.js';
import { mindTick } from '../labradorite.js';
import { slabGeometry, footprint, ghostBox, SLAB_MESH, STRATA_LOOK } from './slabmesh.js';
import { benchGeometry } from './benchmodel.js';
import { AberrantInversion } from '../aberrantinvert.js';
import { COLOR } from '../../progress/weather.js';
import { STATS } from '../../progress/spirits.js';

/** Its numbers (metres, real seconds): the end's lift and its beats, the spirit's size and climb; the toll's length; the mark's. */
export const SLAB_LOOK = {
  cell: 0.05, top: 0.55,
  end: { lift: 0.13, liftT: 0.9, crumble: 0.95, wake: 1.3, gone: 3.3, spirit: 0.3, climb: 0.28, away: 2.6 },
  toll: { t: 1.5, beats: [0, 0.45, 0.9] }, ghostIn: 0.5,
  mark: { bracket: 0.32, chisel: 0.8, blade: 0.35, dash: 0.6, gold: 0xffd36a },
};
const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3();

export class SlabLook {
  constructor(game) {
    this.game = game; this.B = null; this.g = null; this.S = null; this.end = null; this.tollT = 0; this.ghostK = 0;
    this.inversion = new AberrantInversion();
    game.events?.on('garden.enter', () => this.dress());
    game.events?.on('slab.use', (e) => this.used(e));
    game.events?.on('slab.carve', (e) => this.carved(e));
    game.events?.on('garden.leave', () => { this.finish(); this.drop(); });
  }

  // ------------------------------------------------------------------ the bench dressed (once)
  dress() {
    const B = this.game.realm?.bench; if (!B || this.B === B) return;
    this.B = B;
    for (const m of [B.stone, B.mat, B.ghostMat, B.ringMat, B.cursor?.material]) if (m) m.visible = false; // (Petra's stand-ins, hidden: never drawn, never compiled)
    const K = SLAB_MESH.grain, g = (this.g = new THREE.Group()); g.name = 'slab-look'; g.scale.setScalar(1 / K); B.group.add(g);
    this.mats = { slab: matterMaterial('slab'), toll: matterMaterial('toll'), bench: matterMaterial('bench') };
    this.mats.toll.depthTest = false; this.mats.toll.depthWrite = false;
    this.U = this.mats.slab.userData.matterUniforms; this.TU = this.mats.toll.userData.matterUniforms;
    this.TU.mlToll.value = 0;
    const bench = new THREE.Mesh(benchGeometry(), this.mats.bench); bench.name = 'carving-bench-look'; bench.castShadow = bench.receiveShadow = true; g.add(bench);
    // the chisel's mark (in metres, on the bench's own frame: a child of Petra's group, as her cursor was)
    const L = SLAB_LOOK.mark;
    this.mark = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: L.gold, transparent: true, depthTest: false }));
    this.mark.name = 'slab-chisel-mark'; this.mark.renderOrder = 4; this.mark.frustumCulled = false; this.mark.visible = false; B.group.add(this.mark);
  }

  // ------------------------------------------------------------------ every frame
  update(raw = 1 / 60) {
    const R = this.game.realm; if (!R?.active) return;
    if (!this.g) this.dress(); if (!this.g) return;
    mindTick();
    const B = this.B, S = B.slab;
    if (S && S !== this.S) this.begin(S);
    else if (!S && this.S && !this.end) this.drop();
    if (S) {
      if (S.uses !== this.uses || S.cracks !== this.cracks) this.remesh();
      this.ghostK = Math.min(1, this.ghostK + (S.seen ? raw / SLAB_LOOK.ghostIn : 0)); this.U.mlGhost.value = this.ghostK;
      this.drawMark(B.hover, B.verb);
    } else this.mark.visible = false;
    this.tollT = Math.max(0, this.tollT - raw); this.tolling(this.tollT);
    if (this.end) this.ending(raw);
    this.inversion.update();
  }

  // ------------------------------------------------------------------ a slab on the bench
  begin(S) {
    this.finish(); this.drop();
    const B = this.B, D = B.data || {}, F = Object.keys(STATS), cls = Math.min(4, Math.max(0, (S.stars || 1) - 1));
    this.S = S; this.orig = B.orig; this.seed = (D.seed | 0) || 1; this.uses = -1; this.cracks = -1; this.ghostK = 0; this.tollT = 0;
    this.feeling = D.feeling || F[(S.kind.length + cls) % F.length];
    this.U.mlTint.value.setHex(COLOR[this.feeling] ?? 0x9fd8e0); this.TU.mlTint.value.copy(this.U.mlTint.value);
    this.U.mlGlow.value = 0; this.U.mlGhost.value = 0;
    this.ghostTex = footprint(S, this.orig, this.ghostTex); this.U.mlGhostMap.value = this.ghostTex; this.U.mlGhostBox.value.set(...ghostBox(S, SLAB_LOOK.cell));
    this.stone = new THREE.Mesh(new THREE.BufferGeometry(), this.mats.slab); this.stone.name = 'slab-stone'; this.stone.castShadow = this.stone.receiveShadow = true;
    this.bone = new THREE.Mesh(new THREE.BufferGeometry(), this.mats.slab); this.bone.name = 'slab-fossil';
    this.ring = new THREE.Mesh(new THREE.BufferGeometry(), this.mats.toll); this.ring.name = 'slab-toll'; this.ring.renderOrder = 5; this.ring.visible = false;
    this.g.add(this.stone, this.bone, this.ring);
    this.boneWas = S.bone.slice();
    this.remesh();
  }
  /** The slab's stone and fossil meshed again (after a use: a cleared cell gone, a crack drawn); a crack star at each fossil cell newly cracked. */
  remesh() {
    const S = this.S, { stone, bone } = slabGeometry(S, this.orig, { cell: SLAB_LOOK.cell, top: SLAB_LOOK.top, seed: this.seed });
    this.stone.geometry.dispose(); this.stone.geometry = stone; this.bone.geometry.dispose(); this.bone.geometry = bone; this.ring.geometry = bone;
    this.uses = S.uses; this.cracks = S.cracks;
    let n = 0;
    for (let i = 0; i < S.bone.length && n < 3; i++) if (S.bone[i] < this.boneWas[i]) { n++; this.play('slab.crack', this.cellWorld(i % S.w + 0.5, Math.floor(i / S.w) % S.h + 0.5, Math.floor(i / (S.w * S.h)) + 0.5, _v), { normal: this.upWorld(new THREE.Vector3()), dir: this.upWorld(new THREE.Vector3()) }); }
    this.boneWas = S.bone.slice();
  }
  /** The dig put off (or the garden left): its meshes gone. */
  drop() {
    if (!this.S) return;
    for (const m of [this.stone, this.bone, this.ring]) if (m) { this.g.remove(m); if (m !== this.ring) m.geometry.dispose(); }
    this.stone = this.bone = this.ring = null; this.S = null; this.mark.visible = false; this.U.mlGhost.value = 0; this.ghostK = 0;
  }

  // ------------------------------------------------------------------ the grid in the world
  /** A grid point (x right, y down from the slab's top, z north; a cell a unit) in the bench's frame, metres. */
  local(gx, gy, gz, out, S = this.S || this.end?.S) { const c = SLAB_LOOK.cell; return out.set((gx - S.w / 2) * c, SLAB_LOOK.top + (S.h - gy) * c, (gz - S.d / 2) * c); }
  cellWorld(gx, gy, gz, out) { return this.local(gx, gy, gz, out).applyMatrix4(this.B.group.matrixWorld); }
  /** A grid direction (y down) in the world. */
  dirWorld(d, out) { return out.set(d.x, -d.y, d.z).transformDirection(this.B.group.matrixWorld); }
  upWorld(out) { return out.copy(UP).transformDirection(this.B.group.matrixWorld); }
  play(name, pos, ctx = {}) { return this.game.vfx?.play(name, { pos: pos.clone(), ...ctx }); }

  // ------------------------------------------------------------------ a use's moment
  used(e) {
    const B = this.B, S = B?.slab; if (!S || !this.g) return;
    if (S !== this.S) this.begin(S);
    const h = B.hover, verb = e.verb, up = this.upWorld(new THREE.Vector3()), top = this.cellWorld(S.w / 2, 0, S.d / 2, new THREE.Vector3());
    const tint = e.stratum ? (STRATA_LOOK[e.stratum] || STRATA_LOOK[3])[0] : STRATA_LOOK.bone[2];
    if (verb === 'toll') { if (B.tollT > 0) { this.tollT = SLAB_LOOK.toll.t; this.play('slab.toll', top, { dir: up, normal: up }); } return; }
    if (verb === 'silhouette') { this.play('slab.silhouette', top, { dir: up, normal: up, feeling: this.feeling }); return; }
    if (!h) return;
    const out = this.dirWorld({ x: -h.dir.x, y: -h.dir.y, z: -h.dir.z }, new THREE.Vector3()), at = this.cellWorld(h.x + 0.5 - h.dir.x * 0.5, h.y + 0.5 - h.dir.y * 0.5, h.z + 0.5 - h.dir.z * 0.5, new THREE.Vector3());
    const ctx = { normal: out, dir: out, tint, power: 1 + Math.min(1.5, (e.broke || 0) * 0.12), feeling: this.feeling };
    if (verb === 'slice') { ctx.from = this.cellWorld(0, h.y, 0, new THREE.Vector3()); ctx.to = this.cellWorld(S.w, h.y, 0, new THREE.Vector3()); ctx.normal = this.dirWorld({ x: 0, y: 0, z: -1 }, new THREE.Vector3()); }
    this.play(`slab.${verb}`, at, ctx);
  }

  // ------------------------------------------------------------------ the chisel's mark
  drawMark(h, verb) {
    const key = h ? `${h.x},${h.y},${h.z},${h.dir.x},${h.dir.y},${h.dir.z},${verb}` : '';
    this.mark.visible = !!h; if (!h || key === this.markKey) return;
    this.markKey = key;
    const S = this.S, M = SLAB_LOOK.mark, P = [], seg = (a, b) => P.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const g = (x, y, z) => this.local(x, y, z, new THREE.Vector3());
    const ax = h.dir.x ? 'x' : h.dir.y ? 'y' : 'z', o = { x: h.x + 0.5, y: h.y + 0.5, z: h.z + 0.5 }, s = -(h.dir[ax] || 1);
    const [u, v] = ['x', 'y', 'z'].filter((k) => k !== ax);
    const face = (c, scale = 1) => { // (a face's four corners on the plane ax = c[ax] + s/2, as brackets)
      const C = (du, dv) => { const p = { ...c }; p[ax] += s * 0.5; p[u] += du * 0.5 * scale; p[v] += dv * 0.5 * scale; return g(p.x, p.y, p.z); };
      for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const k = C(du, dv); seg(k, k.clone().lerp(C(-du, dv), M.bracket)); seg(k, k.clone().lerp(C(du, -dv), M.bracket)); }
    };
    face(o);
    // the chisel: standing off the face along its normal, its blade's edge across it, its point on the cell
    const f = { ...o }; f[ax] += s * 0.5; const tip = g(f.x, f.y, f.z), end = { ...f }; end[ax] += s * M.chisel; const butt = g(end.x, end.y, end.z);
    seg(tip.clone().lerp(butt, 0.15), butt);
    const e0 = { ...end }, e1 = { ...end }; e0[u] -= M.blade / 2; e1[u] += M.blade / 2; seg(g(e0.x, e0.y, e0.z), g(e1.x, e1.y, e1.z));
    const b0 = { ...f }, b1 = { ...f }; b0[ax] += s * 0.15; b1[ax] += s * 0.15; b0[u] -= 0.12; b1[u] += 0.12; seg(g(b0.x, b0.y, b0.z), tip); seg(tip, g(b1.x, b1.y, b1.z));
    // what the verb up would reach, dashed
    const dash = (pts) => { for (let i = 0; i + 1 < pts.length; i += 2) seg(pts[i], pts[i + 1]); };
    if (verb === 'pick') { const c = { ...o }; c[ax] -= s; face(c, 0.8); }
    else if (verb === 'blast' || verb === 'hoover') {
      const r = verb === 'blast' ? 1.8 : 1.2, n = 28, pts = [];
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, p = { ...f }; p[u] += Math.cos(a) * r; p[v] += Math.sin(a) * r; pts.push(g(p.x, p.y, p.z)); }
      dash(pts);
    } else if (verb === 'slice') {
      const y = h.y + 0.02, m = 0.15, C = [[-m, -m], [S.w + m, -m], [S.w + m, S.d + m], [-m, S.d + m]], pts = [];
      for (let k = 0; k < 4; k++) { const [x0, z0] = C[k], [x1, z1] = C[(k + 1) % 4]; for (let i = 0; i < 10; i++) pts.push(g(x0 + (x1 - x0) * i / 10, y, z0 + (z1 - z0) * i / 10)); }
      dash(pts);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    this.mark.geometry.dispose(); this.mark.geometry = geo;
  }

  // ------------------------------------------------------------------ the toll
  tolling(t) {
    if (!this.ring) { this.TU.mlToll.value = 0; return; }
    this.ring.visible = t > 0;
    if (t <= 0) { this.TU.mlToll.value = 0; return; }
    const T = SLAB_LOOK.toll, age = T.t - t; let p = 0;
    for (const b of T.beats) { const d = age - b; if (d >= 0) p = Math.max(p, Math.exp(-d * 5)); }
    this.TU.mlToll.value = Math.min(1, (0.45 + 0.55 * p) * Math.min(1, t / 0.35));
  }

  // ------------------------------------------------------------------ the carving's end
  carved(e) {
    const B = this.B, S = B?.slab; if (!S || !this.g || S !== this.S) return;
    this.end = { t: 0, S, flawless: !!e.flawless, stone: this.stone, bone: this.bone, feeling: this.feeling, crumbled: false, woke: false, spirit: null };
    this.ring.visible = false; this.g.remove(this.ring); this.ring = null; this.mark.visible = false;
    this.stone = this.bone = null; this.S = null; this.tollT = 0;
    this.U.mlGhost.value = 0; this.ghostK = 0;
    const up = this.upWorld(new THREE.Vector3());
    this.play('slab.lift', this.cellWorld(S.w / 2, S.h / 2, S.d / 2, new THREE.Vector3()), { dir: up, normal: up, tint: STRATA_LOOK[1][0], feeling: this.feeling });
  }
  ending(raw) {
    const E = this.end, T = SLAB_LOOK.end, R = this.game.realm; E.t += raw;
    const lift = Math.min(1, E.t / T.liftT), ease = lift * lift * (3 - 2 * lift), K = SLAB_MESH.grain;
    if (E.bone) { E.bone.position.y = T.lift * ease * K; E.bone.rotation.y = 0.35 * ease; this.U.mlGlow.value = Math.min(1, E.t / T.liftT) * (E.woke ? 0 : 1); }
    const S = E.S, up = this.upWorld(new THREE.Vector3()), heart = this.cellWorld(S.w / 2, S.h / 2 - T.lift / SLAB_LOOK.cell, S.d / 2, new THREE.Vector3());
    if (!E.crumbled && E.t >= T.crumble) {
      E.crumbled = true; if (E.stone) { this.g.remove(E.stone); E.stone.geometry.dispose(); E.stone = null; }
      this.play('slab.crumble', this.cellWorld(S.w / 2, S.h / 2, S.d / 2, new THREE.Vector3()), { dir: up, normal: up });
    }
    if (!E.woke && E.t >= T.wake) {
      E.woke = true; this.U.mlGlow.value = 0;
      if (E.bone) { this.g.remove(E.bone); E.bone.geometry.dispose(); E.bone = null; }
      this.play(E.flawless ? 'slab.wake.rare' : 'slab.wake', heart, { dir: up, normal: up, feeling: E.feeling });
      if (R?.spiritGeo && R.spiritMat) { // (the spirit's own body, the garden's: R.spiritGeo and its material; a flawless dig's inverted, the shiny's)
        const m = new THREE.Mesh(R.spiritGeo, R.spiritMat); m.name = 'slab-spirit'; m.castShadow = true; m.scale.setScalar(0.01);
        this.B.group.add(m); E.spirit = m; E.ent = { root: m };
        if (E.flawless) this.inversion.hold(E.ent);
      }
    }
    if (E.spirit) {
      const k = (E.t - T.wake) / (T.gone - T.wake), grow = Math.min(1, k * 4), away = Math.max(0, (E.t - T.away) / (T.gone - T.away));
      const s = T.spirit * (grow * (2 - grow)) * (1 - away * away);
      E.spirit.scale.setScalar(Math.max(0.001, s));
      this.local(S.w / 2, -T.climb / SLAB_LOOK.cell * Math.min(1, k * 2) - away * 8, S.d / 2, E.spirit.position);
      E.spirit.position.y += 0.03 * Math.sin(E.t * 5);
    }
    if (E.t >= T.gone) this.finish();
  }
  /** The end's leftovers gone (its time out, or the garden left). */
  finish() {
    const E = this.end; if (!E) return;
    for (const m of [E.stone, E.bone]) if (m) { this.g.remove(m); m.geometry.dispose(); }
    if (E.spirit) { if (E.ent) this.inversion.release(E.ent); this.B.group.remove(E.spirit); }
    this.U.mlGlow.value = 0; this.end = null;
  }
}
