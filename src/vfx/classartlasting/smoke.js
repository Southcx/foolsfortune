// ---------------------------------------------------------------------------------------
// VANISH'S SMOKE COURIER: the decoy the Moon's art leaves (Petra's runtime, courier/classarts/lasting.js `veil`, raising the Crucibelle's
// mirage: tools/crucibelle/mirage.js, a decoy every mind's watch list reads) drawn as smoke in the Courier's shape, not a second body: the
// pose they vanished from (a print, vfx/classartlasting/ghost.js) filled with ink smoke drifting up through it and soft to nothing at its
// silhouette, a thin light of the Moon's suit at its edges, wisps and threads unravelling off it (the library's `art.mirageStep.smoke`).
// The mirage's own column is hidden while it stands (its decoy, its noise and its smoke are Petra's, kept); when the decoy is struck or
// its time is out, the smoke is let go where it stood: it unravels upward through its pattern and comes apart (`art.mirageStep.unravel`).
//
// Prior art: the house's mirage (a Courier of smoke the minds take for them), Naruto's substitution (the shape left behind goes up in
// smoke), Dishonored's Shadow Walk, the ink-wash figures of Okami and Sumi-e (a body in a few washes, its edges bleeding into the paper).
//
//   const S = new SmokeCourier(game, decoy, ctx)   S.update(dt, shown) -> false once it has come apart   S.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shapeMat } from './kit.js';
import { posePrint, ghostGeometries, ghostMesh, disposeGhost } from './ghost.js';

/** The smoke's numbers: how strong the ink and the edge light stand, how long it takes to come apart (real s). */
export const SMOKE = { ink: 0.8, edge: 0.55, apart: 0.9 };

export class SmokeCourier {
  constructor(game, decoy, ctx = {}) {
    this.game = game; this.decoy = decoy; this.ctx = ctx; this.k = 0; this.apart = -1; this.t = 0;
    const print = posePrint(game.character);
    this.origin = decoy.pos.clone();
    this.ink = shapeMat({ main: 'marble', tile: [3, 2.5], scroll: [0.03, 0.32], flow: 'noise', flowK: 0.14, flowTile: [2, 2], flowScroll: [0.02, 0.45], mask: 'noise', maskK: 0.55,
      maskTile: [2, 3], maskScroll: [-0.02, 0.6], ramp: 'ink', rim: -0.95, rimPow: 1.4, glow: 1, add: 0, soft: 0.18 }, ctx);
    this.edge = shapeMat({ main: 'streaks', tile: [7, 1.4], scroll: [0, 0.75], mask: 'noise', maskK: 0.6, maskTile: [3, 2], maskScroll: [0.04, 0.5], ramp: 'suit', rim: 1.1, rimPow: 2.4,
      glow: 1.6, add: 1, back: 0.2 }, ctx);
    this.geos = print ? ghostGeometries(print, this.origin) : [];
    this.group = ghostMesh(this.geos, [this.ink.mat, this.edge.mat]); this.group.position.copy(this.origin); game.scene.add(this.group);
    this.hidden = []; for (const m of decoy.grp?.children || []) if (m.visible) { m.visible = !this.geos.length; this.hidden.push(m); } // (the mirage's column, hidden while its smoke stands in its place: unless there is no pose to draw)
    this.wisps = game.vfx?.play?.('art.mirageStep.smoke', { ...ctx, pos: this.origin.clone(), dir: new THREE.Vector3(0, 0, 1), follow: (h) => { if (this.apart >= 0 || this.dead) return false; h.k = this.k * (this.shown ? 1 : 0); return true; } });
  }
  update(dt, shown) {
    this.t += dt; this.shown = shown;
    const d = this.decoy, standing = d.alive && d.t > 0;
    if (standing) {
      this.k = Math.min(1, Math.max(0.01, d.grp?.scale?.y ?? 1)); // (its own rise and fall, the mirage's)
      this.group.scale.set(1, this.k, 1);
    } else if (this.apart < 0) { this.apart = 0; this.game.vfx?.play?.('art.mirageStep.unravel', { ...this.ctx, pos: this.origin.clone(), dir: new THREE.Vector3(0, 0, 1) }); }
    let erode = 0.08 + 0.04 * Math.sin(this.t * 1.7), k = this.k;
    if (this.apart >= 0) {
      this.apart += dt; const u = Math.min(1, this.apart / SMOKE.apart);
      erode = 0.1 + 0.9 * u; k = 1 - u * u; this.group.scale.set(1 + 0.08 * u, 1 + 0.12 * u, 1 + 0.08 * u); this.group.position.y = this.origin.y + 0.25 * u;
      if (u >= 1) { this.dispose(); return false; }
    }
    this.ink.u.uK.value = SMOKE.ink * k; this.ink.u.uErode.value = erode;
    this.edge.u.uK.value = SMOKE.edge * k; this.edge.u.uErode.value = Math.min(1, erode + 0.1);
    this.group.visible = shown && k > 0.01 && this.geos.length > 0;
    return true;
  }
  dispose() {
    if (this.dead) return; this.dead = true;
    this.wisps?.stop?.(); disposeGhost(this.group); this.ink.mat.dispose(); this.edge.mat.dispose();
  }
}
