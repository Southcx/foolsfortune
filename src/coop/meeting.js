// ---------------------------------------------------------------------------------------
// MEETING THE SIBLINGS: each is met once, where its craft lives (Dovina's rulings, docs/plans/COOP.md C4), and is the owner's to call
// from then on. Until met, a sibling waits at its place, idle: Petra by the workshop's shelves, Calissa at the kiln, Wanda on Old
// Grog's pier, Espada at the Dunes' Gnomon (the nearest thing the Dunes have to a lighthouse), Dovina at Raku's table. Its rig is made
// only while you are near (within 30 m) and let go when you leave, so an unmet sibling costs nothing elsewhere. F beside it meets it
// (`party.meet`): it joins at once if the party has room. Its words at the meeting are Espada's to write (the log's line, a placeholder).
//
// Prior art: Dragon's Dogma's pawns met in the world before they are summoned at rift stones, and the party members of the old JRPGs
// found where they live (Final Fantasy VI's recruits each in their own town).
//
//   new Meetings(game, party, { makeRig })   .update(dt)   .offer() -> { pos, d, sibling } | null (the interact chevron: 'meet')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { KILN_AT } from '../courier/moves/kiln.js';
import { SIBLINGS, lookOf } from './party.js';

const NEAR = 30, REACH = 2.6;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const folkAt = (g, id, dx, dz) => { const n = g.folk?.list?.find((f) => (f.def?.id || f.id) === id); return n ? n.pos.clone().add(V(dx, 0, dz)) : null; };
/** Where each sibling waits to be met (and which way it faces), or null while its place is not built. */
const SPOTS = {
  petra: (g) => g.player.spawn.clone().add(V(-3.5, 0, 2.5)),
  calissa: () => KILN_AT.clone().add(V(4.2, 0, 2.6)), // (clear of the kiln's own F)
  wanda: (g) => folkAt(g, 'grog', 2.4, -1.6),
  espada: (g) => (g.dunes?.gnomon ? g.dunes.gnomon.clone().add(V(7, 0, 5)).setY(g.dunes.heightAt(g.dunes.gnomon.x + 7, g.dunes.gnomon.z + 5)) : null),
  dovina: (g) => folkAt(g, 'raku', -2, 1.4),
};

export class Meetings {
  constructor(game, party, { makeRig }) {
    this.game = game; this.party = party; this.makeRig = makeRig; this.waiting = new Map(); this.making = new Set();
    game.interact?.add('meet', () => (game.dialogue?.open ? null : this.offer()));
  }

  offer() {
    const P = this.game.player.pos; let best = null;
    for (const [id, W] of this.waiting) { const d = Math.hypot(P.x - W.pos.x, P.z - W.pos.z); if (d < REACH && Math.abs(P.y - W.pos.y) < 2 && (!best || d < best.d)) best = { pos: W.pos.clone().setY(W.pos.y + 2.2), d, sibling: id, ref: `meet.${id}` }; }
    return best;
  }

  update(dt) {
    const g = this.game, P = g.player.pos, party = this.party;
    // F beside one: met
    const it = g.interact?.cur;
    if (it?.id === 'meet' && g.player.peekLatch?.('KeyF') && !g.god?.controlling) { g.player.latch('KeyF'); this.meet(it.sibling); }
    for (const def of SIBLINGS) {
      const id = def.id, W = this.waiting.get(id);
      if (party.met.has(id)) { if (W) this.letGo(id); continue; }
      const at = SPOTS[id]?.(g), near = at && Math.hypot(P.x - at.x, P.z - at.z) < NEAR && Math.abs(P.y - at.y) < 20;
      if (!near) { if (W) this.letGo(id); continue; }
      if (!W && !this.making.has(id)) {
        this.making.add(id);
        this.makeRig().then((rig) => {
          this.making.delete(id); rig.gun.visible = false; rig.gunOff = true; rig.root.name = `Waiting-${id}`;
          g.vessel?.dress(rig, lookOf(id), { own: true });
          this.waiting.set(id, { rig, pos: at.clone(), yaw: 0 });
        });
      }
      if (W) { // (idle, turned toward you)
        W.pos.copy(at); W.yaw = Math.atan2(P.x - at.x, P.z - at.z);
        W.rig.animate(dt, { pos: W.pos, yaw: W.yaw, velocity: new THREE.Vector3(), vy: 0, turnRate: 0, airJump: false, ground: () => W.pos.y, grounded: true, groundN: null, groundVel: null, wall: 0, slide: 0, mantle: 0, mantleT: 1, dash: 0, crouch: 0, aimPitch: 0, aimYawOffset: 0, combat: 0, upper: 0, gunHand: 0, reload: -1, walkSpeed: T.movement.walkSpeed, sprintSpeed: T.movement.sprintSpeed, recoil: 0, adsT: 0, landed: 0, techs: null });
      }
    }
  }

  meet(id) {
    const W = this.waiting.get(id); if (!W || this.party.met.has(id)) return;
    this.party.meet(id, W.rig, W.pos); // (the rig that waited is the one that joins)
    this.waiting.delete(id);
  }

  letGo(id) {
    const W = this.waiting.get(id); this.waiting.delete(id); if (!W) return;
    W.rig.root.parent?.remove(W.rig.root); W.rig.root.traverse((o) => { if (o.isMesh) o.geometry?.dispose(); });
  }
}
