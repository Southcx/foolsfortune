// ---------------------------------------------------------------------------------------
// THE FINDS: what lies on a floor of the Great Dunemaw besides its creatures (docs/plans/DUNEMAW-SYSTEMS.md, section 3; the numbers are
// FINDS in progress/combat/dunemaw.js). POTS stand about the rooms (12, 16, 20 a floor); a quarter hold a find, spilled as cubes where
// the pot breaks (about a minute of play, more by depth), the rest are only the satisfying break. ARTIFACTS glint in the walls (2, 3,
// 4 a floor), F to take: four minutes of play each, paid with the run's haul up the way up (lost if the Courier shatters). One a floor
// lies in a WARPED pocket and is worth three, and taking it SHIFTS THE FLOOR: the way down moves to another room, every sandfall turns
// half its cycle, and two brood wake beside the Courier. It is a risk that pays, never a trick: the Dreamvane hears the warp before it is
// taken (a signature of kind 'warp', core/signatures.js), and a shifted floor's Cogitomap says so.
//
// Prior art: Spelunky's pots and its idols (the golden idol that sets off the boulder: a treasure that changes the room, read before it is
// taken), Zelda's pots, Indiana Jones's idol on its plate, and Hades' chamber rewards (shown before you choose the door).
//
//   const F = new Finds(game, { floor, cur (the floor: wellkit.js), run, seed, onShift })   F.update()   F.near(P) (the interact source)
//   F.take(artifact)   F.dispose()      (the interact chevron's id: 'find')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FINDS, findWorth } from '../../progress/combat/dunemaw.js';
import { ECON } from '../../progress/econ/table.js';
import { seeded } from '../../core/rng.js';
import { SANDFALL } from './wellshift.js';

const POTS = ['jar', 'amphora', 'urn', 'pitcher', 'vase'], REACH = 2.2;
/** An artifact's glint (the warm-up compiles one like it: world/well/dunemaw.js prewarm). */
export const artifactMaterial = (warped) => new THREE.MeshStandardMaterial({ color: warped ? 0x9a6bff : 0xe8c37a, metalness: 0.6, roughness: 0.25, emissive: warped ? 0x5a2a9a : 0x6a4a1a, emissiveIntensity: 0.8, name: 'well-artifact' });

export class Finds {
  constructor(game, { floor, cur, run, seed, onShift = null }) {
    this.game = game; this.floor = floor; this.cur = cur; this.run = run; this.onShift = onShift;
    const r = this.r = seeded((seed ^ Math.imul(floor + 31, 0x9e3779b1)) >>> 0);
    const rooms = cur.cells.filter((c) => c.role !== 'start' && !c.slope);
    this.pots = []; this.arts = [];
    // the pots: about the rooms, against the walls' feet, a quarter with a find in them
    for (let i = 0; i < FINDS.pots[floor - 1] && rooms.length; i++) {
      const c = rooms[r.int(rooms.length)], side = r.int(4), along = (r() - 0.5) * 10, off = 6.6;
      const lx = side === 0 ? off : side === 1 ? -off : along, lz = side === 2 ? off : side === 3 ? -off : along;
      const p = cur.onSand(c.c, c.r, lx, lz);
      const find = r() < FINDS.holds;
      const ent = game.breakables?.spawn({ kind: POTS[r.int(POTS.length)], pos: [p.x, p.y + 0.02, p.z], scale: 1.6 + r() * 0.8, yaw: r() * 6.28, find,
        onBreak: (e, at, by) => this.broke(e, at, by) });
      if (ent) this.pots.push(ent);
    }
    // the artifacts: in the dead ends' find spots first, then glinting from a room's wall; the last of them warped
    const spots = rooms.flatMap((c) => (c.spots || []).filter((s) => s.kind === 'find').map((s) => s.pos.clone()));
    const n = FINDS.artifacts[floor - 1];
    for (let i = 0; i < n; i++) {
      let at = spots.length ? spots.splice(r.int(spots.length), 1)[0] : null;
      if (!at) { const c = rooms[r.int(rooms.length)], s = r() < 0.5 ? 1 : -1; at = cur.onSand(c.c, c.r, r() < 0.5 ? s * 7.4 : (r() - 0.5) * 8, r() < 0.5 ? (r() - 0.5) * 8 : s * 7.4); }
      this.arts.push(this.place(at, i === n - 1 && FINDS.warped.perFloor > 0));
    }
  }

  /** An artifact at `at`: a shard of glazed something in the sand, glinting (Calissa's to dress); warped, with the warp round it. */
  place(at, warped) {
    const g = this.game, grp = new THREE.Group(); grp.position.copy(at); grp.name = warped ? 'artifact-warped' : 'artifact';
    const mat = artifactMaterial(warped);
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat); m.position.y = 0.45; m.scale.set(1, 1.5, 1); m.castShadow = true; grp.add(m);
    g.scene.add(grp);
    const a = { pos: at.clone(), warped, grp, m, mat, taken: false };
    a.sig = g.signatures?.add({ pos: at.clone().setY(at.y + 0.5), strength: warped ? 9 : 5, kind: warped ? 'warp' : 'artifact', ref: a, alive: () => !a.taken });
    return a;
  }

  /** A pot broke: a find spills from it as cubes where it stood (whoever broke it: the log says who). */
  broke(ent, at, by) {
    if (!ent.def.find) return;
    const g = this.game, worth = findWorth('pot', this.floor, false, ECON.well.deeper) * ECON.perMinute;
    g.cubes?.burst?.(at.clone(), worth, { count: 5, up: 4, from: 'well' });
    g.events?.emit('find.take', { kind: 'pot', warped: false, floor: this.floor, by: by || 'courier' });
  }

  /** The nearest artifact in reach, for the interact chevron. */
  near(P) {
    let best = null;
    for (const a of this.arts) {
      if (a.taken) continue;
      const d = Math.hypot(a.pos.x - P.pos.x, a.pos.z - P.pos.z);
      if (d < REACH && Math.abs(a.pos.y - P.pos.y) < 2 && (!best || d < best.d)) best = { pos: a.pos.clone().setY(a.pos.y + 1.1), d, ref: a };
    }
    return best;
  }

  /** Taken: its worth goes with the haul; a warped one is worth three, and the floor shifts round the pocket. */
  take(a) {
    const g = this.game, R = this.run;
    if (!a || a.taken || !R) return;
    a.taken = true; a.grp.visible = false;
    if (a.sig) g.signatures?.remove(a.sig);
    R.finds = (R.finds || 0) + Math.round(findWorth('artifact', this.floor, a.warped, ECON.well.deeper) * ECON.perMinute);
    g.fx?.absorbSparkle?.(a.pos.clone().setY(a.pos.y + 0.5));
    g.events?.emit('find.take', { kind: 'artifact', warped: a.warped, floor: this.floor, by: 'courier' });
    if (a.warped) this.shift(a);
  }

  /** The floor shifts round the warped pocket: the way down moves, the sandfalls turn, and two brood wake beside the Courier. */
  shift(a) {
    const g = this.game, cur = this.cur, R = this.run, P = g.player;
    if (cur.down && cur.moveDown) {
      const far = cur.cells.filter((c) => c.role !== 'start' && !c.slope && Math.hypot(c.x - cur.down.pos.x, c.z - cur.down.pos.z) > 20);
      if (far.length) cur.moveDown(far[this.r.int(far.length)]);
    }
    for (const s of cur.sandfalls || []) s.phase += (SANDFALL.open + SANDFALL.falling) / 2; // (half a sandfall's cycle: what was open falls, what fell opens)
    for (let i = 0; i < FINDS.warped.brood; i++) {
      const ang = (i / FINDS.warped.brood) * Math.PI * 2 + 0.7, p = P.pos.clone().add(new THREE.Vector3(Math.cos(ang) * 3.5, 0.1, Math.sin(ang) * 3.5));
      this.onShift?.(p);
    }
    (R.shifted ||= []).push(this.floor);
    g.events?.emit('floor.shift', { floor: this.floor, by: 'courier' });
  }

  update(dt) { for (const a of this.arts) if (!a.taken) a.m.rotation.y += dt * (a.warped ? 2.4 : 0.8); }

  dispose() {
    const g = this.game;
    for (const e of this.pots) g.breakables?.removeQuiet(e);
    for (const a of this.arts) { if (a.sig && !a.taken) g.signatures?.remove(a.sig); g.scene.remove(a.grp); a.m.geometry.dispose(); a.mat.dispose(); }
  }
}
