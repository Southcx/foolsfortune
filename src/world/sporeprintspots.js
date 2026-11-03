// ---------------------------------------------------------------------------------------
// WILD SPORE PRINTS ON THE GROUND (docs/plans/MYCELIUM.md 3; GAPS.md G155; the rules Dovina's, progress/sporeprints.js): the game day's
// prints stood where they grow, one a print: in the Dunes' area it names (the ridges, the Weir, the ruins) at a spot seeded by the game
// day and the print, the same for everyone; on the Great Dunemaw's damp floors in a room of the floor seeded by the run. F (USE on touch)
// takes it (`game.sporePrints.take`); taken, it is gone for the game day. The look here is a placeholder (three caps in the strain's
// colour), Calissa's to dress (`spots`, each { id, strain, pos, group }).
// Prior art: Stardew Valley's forage, Monster Hunter's gathering points, the house's rare finds (world/dunes/rarefinds.js).
//
//   game.sporePrintSpots = new SporePrintSpots(game)   (boot/creatures.js; the world phase)   .spots   events (the rules'): spore.print
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WILD_PRINTS } from '../progress/sporeprints.js';
import { COLOR } from '../progress/weather.js';
import { today } from '../core/calendar.js';
import { seeded } from '../core/rng.js';
import { spotIn } from './dunes/areacut.js';
import { DUNE } from './dunes/dunes.js';

const REACH = 1.8;
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export class SporePrintSpots {
  constructor(game) {
    this.game = game; this.spots = []; this.key = null; this.t = 0; this.mats = {};
    game.interact?.add('sporeprint', (P) => {
      if (game.god?.controlling || game.dialogue?.open) return null;
      let best = null;
      for (const s of this.spots) { const d = s.pos.distanceTo(P.pos); if (d < REACH && (!best || d < best.d)) best = { pos: s.pos.clone().setY(s.pos.y + 0.6), d, ref: s }; }
      return best;
    });
  }

  /** Where the Courier is, as the prints name it: { where, floor, key } or null. */
  here() {
    const g = this.game, W = g.well;
    if (W?.active && W.cur && W.floor) return { where: 'well', floor: W.floor, key: `well:${W.floor}:${W.run?.seed ?? 0}:${today()}` };
    const a = g.dunes?.active ? g.dunesAreas?.here : null;
    return a ? { where: a, floor: null, key: `dunes:${a}:${today()}` } : null;
  }

  update(raw) {
    const g = this.game, P = g.player;
    const it = g.interact?.cur;
    if (it?.id === 'sporeprint' && P?.peekLatch?.('KeyF')) { P.latch('KeyF'); this.take(it.ref); }
    if ((this.t -= raw) > 0) return; this.t = 1; // (once a real second: an area or a floor changes slowly)
    const h = this.here(), key = h ? `${h.key}:${(g.sporePrints?.out?.(h) || []).join(',')}` : null;
    if (key === this.key) return;
    this.key = key; this.clear();
    if (h && g.sporePrints) for (const id of g.sporePrints.out(h)) { const pos = this.spotOf(id, h); if (pos) this.stand(id, pos); }
  }

  /** A print's place: in its Dunes area, seeded by the game day; on a Well floor, in a room of the floor seeded by the run. */
  spotOf(id, h) {
    const g = this.game, r = seeded(hash(`${id}:${h.key}`));
    if (h.where === 'well') {
      const F = g.well.cur, rooms = (F?.cells || []).filter((c) => c.role !== 'start'); if (!rooms.length || !F.onSand) return null;
      const c = rooms[Math.floor(r() * rooms.length)]; return F.onSand(c.c, c.r, 0.9, 2.0).clone(); // (off the room's middle, where its jellies and clutch stand)
    }
    const D = g.dunes; if (!D?.heightAt) return null;
    const s = spotIn(h.where, () => r(), { inner: 30, outer: 380 }); if (!s) return null;
    const x = DUNE.x + s.lx, z = DUNE.z + s.lz; return new THREE.Vector3(x, D.heightAt(x, z), z);
  }

  /** The placeholder: three caps of the strain's colour on short stems. */
  stand(id, pos) {
    const P = WILD_PRINTS[id], g = this.game, mat = this.mats[P.strain] ||= new THREE.MeshStandardMaterial({ color: COLOR[P.strain] ?? 0xcccccc, roughness: 0.7, emissive: COLOR[P.strain] ?? 0, emissiveIntensity: 0.35 });
    const group = new THREE.Group(); group.name = `sporeprint-${id}`;
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1, r = 0.12 + 0.1 * i, s = 0.6 + 0.25 * i;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat); cap.position.set(Math.cos(a) * r, 0.14 * s, Math.sin(a) * r);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.14 * s, 6), mat); stem.position.set(cap.position.x, 0.07 * s, cap.position.z);
      group.add(cap, stem);
    }
    group.position.copy(pos); (g.well?.active && g.well.cur?.group ? g.well.cur.group : g.scene).add(group); // (on a floor, the floor's: gone with it)
    this.spots.push({ id, strain: P.strain, pos: pos.clone(), group });
  }

  take(s) {
    const h = this.here(), r = this.game.sporePrints?.take?.(s.id, h);
    if (!r?.ok) { this.game.log?.say?.('info', r?.why || 'There is nothing to take there.', { key: 'sporeprint', throttle: 1 }); return; }
    this.drop(s); this.key = null; // (the next look stands what is left)
  }
  drop(s) { s.group.parent?.remove(s.group); s.group.traverse((o) => o.geometry?.dispose?.()); this.spots = this.spots.filter((x) => x !== s); }
  clear() { for (const s of [...this.spots]) this.drop(s); }
}
