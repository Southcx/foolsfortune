// ---------------------------------------------------------------------------------------
// A MADE TRACK'S DRESS (docs/plans/TRACK-EDITOR.md 3, 12; Dovina's handoff of 2026-10-24): a made track (world/raceway/madetrack.js,
// `track: 'made'` in the Raceway's lists) is built by the park's own builders after the park's dress has run, and again on every edit, so
// its things are dressed here, for the one track, and taken down with it:
//   - ITS SUN PLATES as the park's (vfx/racewaylooks.js platePose / plateMeshes: the same glyph, glow and shared materials, so they
//     shimmer with the rest and dim with the sun); a plate ridden flashes as any (`madeAt`, read by racewayLooks.plateHit)
//   - ITS GRIND RAILS glazed as the park's (racewayLooks.glazeRails on the made track's own rail mesh: the park's mesh never sees them)
//   - ITS START ARCH'S LAMPS, ITS GATES' MARKS AND ITS START PILLAR'S GLYPH, laid with the park's in the one instanced mesh
//     (racewayLooks.layMarks over marksTracks), so a made race counts down and lights its next gate as the park's do
//   - ITS LONE COLUMNS, WALLS AND ARCHES in the park's glazed stone and gold (vfx/racewaykitdress.js)
//   - ITS LINE ON THE LOT: the editor reads the line from 130 m, so her guide's ribbons are dressed as the house draws a line: each edge
//     a kintsugi gold thread between two ink keylines, the centre a run of dark clay dashes with a gold chevron every CHEVRON metres
//     pointing the way the race runs (no fog, as hers: the lot must read at the top of the editor's zoom)
// Its sun rings and slip geysers are the house's already (vfx/solarring.js, vfx/slipgeyser.js), its traps vfx/racewaytraps.js's.
// Dressed when MadeTrack.set calls `dress` (no frame of the placeholder between an edit and its dress) and checked every frame (a track
// taken down, the park released or built again). Materials: the park's shared plate materials, the kit's vertex-coloured standard and
// her line's basic (no fog): no program added.
//
// Prior art: Trackmania's editor line (the road's edges and its centre arrow drawn over the block as you lay it), the race-line chevrons
// of every racer's minimap, kintsugi's gold seam (the line laid on the land as a join), the house's own park dress.
//
//   game.racewayMade = new RacewayMade(game)   .dress(R, T)   .undress()   .update(dt)   RACEWAY_MADE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from '../world/raceway/track.js';
import { Tris } from './racewaypark.js';
import { kitDress, hasKitDress } from './racewaykitdress.js';
import { addOutline } from '../render/outline.js';

/** The numbers: the line's ribbons (the gold thread's and each ink keyline's width, m; the centre's dash and gap, its width; a chevron
 *  every `chevron` m, its size; the lift over the ground, m; the sampling, m), its colours. */
export const RACEWAY_MADE = {
  line: { gold: 0.7, ink: 0.35, dash: 3, gap: 3, centre: 0.45, chevron: 30, chev: [2.6, 1.6, 0.45], lift: 0.08, step: 2 },
  colour: { gold: 0xffd36a, ink: 0x2a1208, centre: 0x5a2c16, chevron: 0xffd36a }, // (the centre's dashes in the kiln's dark: pale bisque on the pale sand read as nothing, the headless look 2026-10-29)
};
const LN = RACEWAY_MADE.line, CL = RACEWAY_MADE.colour;
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const line = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false }); // (her line's: its program)
  MATS = { stone: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, flatShading: true }), gold: line(CL.gold, 0.95), ink: line(CL.ink, 0.85), centre: line(CL.centre, 0.9) };
  for (const m of Object.values(MATS)) m.userData.shared = true;
  return MATS;
}

export class RacewayMade {
  constructor(game) { this.game = game; this.R = null; this.T = null; this.group = null; }
  get looks() { return this.game.racewayLooks; }

  /** Dress the made track T (built on the Raceway R): its plates, rails, marks, kit and line. Its old dress goes first. */
  dress(R = this.game.raceway, T = R?.made?.T) {
    this.undress(); if (!R || !T) return this;
    this.R = R; this.T = T;
    const g = this.game, L = this.looks, group = (this.group = new THREE.Group()); group.name = 'raceway-made-dress'; group.userData.zone = 'raceway'; g.scene.add(group);
    const H = R.made?.group;
    // her guide's ribbons out of sight (the basic, fogless strips: madetrack.js drawLine), ours in their place
    H?.children.forEach((o) => { if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.fog === false) o.visible = false; });
    this.line(R, T, group);
    // the plates: the park's poses and batch, its shared materials
    const plates = (R.plates || []).filter((p) => p.track === 'made' && !p.vein);
    if (L?.platePose && plates.length) {
      const poses = plates.map((p) => L.platePose(R, p)), B = L.plateMeshes(poses);
      group.add(B.glyph, B.glow); this.plates = B;
      L.madeAt = new Map(plates.map((p, i) => [p.index, poses[i]]));
    }
    // the rails: her made rail mesh is the first thing in her group (madetrack.js set: rails first)
    const rails = (R.rails || []).filter((r) => r.track === 'made'), rm = H?.children[0];
    if (L?.glazeRails && rails.length && rm?.isMesh && !rm.userData.glazed) L.glazeRails(R, rm, rails);
    // the kit's columns, walls and arches
    if (hasKitDress(T)) {
      const out = new Tris(); kitDress(R, T, out);
      const m = new THREE.Mesh(out.geometry(), mats().stone); m.castShadow = m.receiveShadow = true; m.name = 'raceway-made-kit'; group.add(m); addOutline(m);
    }
    this.relay(R);
    return this;
  }
  /** The park's marks laid again with (or without) the made track's arch, gates and start pillar. */
  relay(R) { const L = this.looks; if (L?.layMarks && L.markList && !L.released && !L.dressing) L.layMarks(R, L.marksTracks(R)); }
  undress() {
    const had = !!this.T, R = this.R;
    if (this.group) { this.group.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); }); this.group.removeFromParent(); this.group = null; } // (the materials shared: the park's plates', the kit's, the line's)
    this.plates = null; if (this.looks) this.looks.madeAt = null;
    this.T = null; this.R = null;
    if (had && R?.built) this.relay(R);
  }

  /** The line's ribbons: each edge a gold thread between two ink keylines, the centre's dashes, and a chevron every so often. */
  line(R, T, group) {
    const M = mats(), at = (F, lat) => { const lx = F.x - F.fz * lat, lz = F.z + F.fx * lat; return [RW.x + lx, R.heightAt(RW.x + lx, RW.z + lz) + LN.lift, RW.z + lz]; };
    const strip = (lat0, lat1, keep = () => true) => { // (a strip between two offsets from the line, its pieces where keep(s) says)
      const pos = [], idx = []; let k = 0, open = false;
      for (let s = 0; s <= T.length + 0.01; s += LN.step) {
        const F = T.frame(s % T.length), on = keep(s);
        if (on) { pos.push(...at(F, lat0(F)), ...at(F, lat1(F))); if (open) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++; }
        open = on;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); return geo;
    };
    const g2 = LN.gold / 2, ink = LN.ink, mk = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; m.frustumCulled = false; group.add(m); return m; };
    for (const sg of [-1, 1]) {
      mk(strip((F) => sg * F.w - g2, (F) => sg * F.w + g2), M.gold, 4);
      mk(strip((F) => sg * F.w - g2 - ink, (F) => sg * F.w - g2), M.ink, 3);
      mk(strip((F) => sg * F.w + g2, (F) => sg * F.w + g2 + ink), M.ink, 3);
    }
    const period = LN.dash + LN.gap, nearChev = (s) => { const c = ((s % LN.chevron) + LN.chevron) % LN.chevron; return c < LN.chev[0] + 1.5 || c > LN.chevron - 1.5; };
    mk(strip(() => -LN.centre / 2, () => LN.centre / 2, (s) => (s % period) < LN.dash && !nearChev(s)), M.centre, 4);
    // the chevrons: two arms meeting ahead, pointing the race's way
    const pos = [], [len, half, thick] = LN.chev;
    for (let s = LN.chevron; s < T.length - 1; s += LN.chevron) {
      const F = T.frame(s), tip = at(F, 0); tip[0] += F.fx * len; tip[2] += F.fz * len;
      for (const sg of [-1, 1]) {
        const o = at(F, sg * half), oi = at(F, sg * (half - thick * 1.6)), ti = [tip[0] - F.fx * thick * 1.6, tip[1], tip[2] - F.fz * thick * 1.6];
        for (const v of [o, tip, ti, o, ti, oi, o, ti, tip, o, oi, ti]) pos.push(...v); // (both windings: seen from any side, one program)
      }
    }
    if (pos.length) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mk(geo, M.gold, 5); }
  }

  /** Per frame: dressed when a made track stands and is not yet, taken down when it goes (or the park is let go). */
  update() {
    const R = this.game.raceway, T = R?.built ? R.made?.T || null : null;
    if (T !== this.T) { if (T) this.dress(R, T); else this.undress(); }
  }
}
