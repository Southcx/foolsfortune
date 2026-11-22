// ---------------------------------------------------------------------------------------
// THE HARPOON (plain name; South, 2026-11-22: "make the sondelass grapple hook a harpoon underwater, we're not doing breath meters"): the
// Sondelass's hook form under water. The swim stows whatever is in the hands (courier/moves/swim.js handsBusy), so the harpoon is fired
// from the belt: with the Sondelass worn (main or sub) and the Courier under the surface, LMB (main) or R (sub) throws a barbed spear on
// a line along the camera's aim. It flies 34 m/s for 18 m and:
//   - a creature it meets is struck hard (power 2.4, cause 'harpoon', an Impact blow) and staggered;
//   - a fish it passes within reach of (the Weir's and the blue hole's pools, angling/weir.js) is speared: carried back on the line,
//     landed as a catch with its own quality ('spear': angle.catch, so the ledger, the log and the records count it as any catch), and
//     kept in the Pneuka Box as a fish is kept (catchlift.js's keep);
//   - nothing: the line is drawn back.
// No cost in Lachryma under water and no breath: the dive is free (South). A miss's cooldown is short, a hit's a beat longer.
// Events: harpoon.fire { by }, harpoon.hit { what: 'creature' | 'fish' | 'miss', species?, by }.
//
// Prior art: Dave the Diver's harpoon gun (aim, fire, the fish speared and reeled back to you), Subnautica's propulsion of a spear,
// Zelda's Hookshot under water (Ocarina's Water Temple); the hook form's own line (angling/line.js FishingLine) drawn for its rope.
//
//   new Harpoon(game)   .update(dt)   .armed (the swim is under and the Sondelass worn)   HARPOON (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { G, groups } from '../../core/physics.js';
import { FishingLine } from './angling/line.js';
import { TIDES, ASPECTS } from './angling/species.js';
import { sfx } from '../../audio/sfx.js';

export const HARPOON = { speed: 34, range: 18, reach: 0.9, power: 2.4, back: 26, cool: 0.35, coolHit: 0.7, spear: [0.05, 1.3] };
const HITS = groups(0xffff, G.STATIC | G.CRITTER);
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _p = new THREE.Vector3(), _x = new THREE.Vector3(1, 0, 0);

export class Harpoon {
  constructor(game) {
    this.game = game; this.state = 'idle'; this.cool = 0;
    this.pos = new THREE.Vector3(); this.dir = new THREE.Vector3(); this.travel = 0; this.fish = null; this.hit = null;
    const g = new THREE.Group(), [r, len] = HARPOON.spear, steel = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.8, roughness: 0.3 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, len, 6), steel); shaft.rotation.z = Math.PI / 2; g.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.2, 0.28, 6), steel); head.rotation.z = -Math.PI / 2; head.position.x = len / 2 + 0.12; g.add(head);
    for (const s of [1, -1]) { const barb = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, 0.16, 4), steel); barb.rotation.z = Math.PI / 2 + s * 0.6; barb.position.set(len / 2 - 0.05, s * 0.06, 0); g.add(barb); }
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb27a })); glow.position.x = -len / 2; g.add(glow);
    g.visible = false; game.scene.add(g); this.spear = g;
    this.line = new FishingLine(game.scene);
  }

  /** The Sondelass worn and the swim under the surface. */
  get armed() {
    const g = this.game, S = g.techs?.active;
    return S?.id === 'swim' && !!S.under && (g.belt?.main === 'sondelass' || g.belt?.sub === 'sondelass');
  }
  /** Its key: LMB with the Sondelass as the main, R as the sub. */
  key() { return this.game.belt?.main === 'sondelass' ? 'Mouse0' : 'KeyR'; }
  hand(out) { const P = this.game.player; return out.set(P.pos.x, P.pos.y + 1.0, P.pos.z); }

  update(dt) {
    const g = this.game, inp = g.input; this.cool -= dt;
    if (this.state === 'idle') {
      if (this.armed && this.cool <= 0 && inp?.wasPressed?.(this.key())) { inp.spend?.(this.key()); this.fire(); }
      return;
    }
    this.hand(_a);
    if (this.state === 'out') {
      const step = HARPOON.speed * dt; this.travel += step;
      const hit = g.physics?.raycast(this.pos, this.dir, step, g.player?.collider, HITS, (c) => !c.isSensor());
      const fish = this.spearFish(this.pos, step);
      if (fish) { this.fish = fish; this.landFish(fish); this.state = 'back'; }
      else if (hit) {
        this.pos.copy(hit.point);
        const ent = hit.entity;
        if (ent?.type === 'creature' && ent.alive) {
          g.creatures.strike(ent, hit.point.clone(), this.dir.clone(), HARPOON.power, 'harpoon', 'courier');
          g.stun?.add(ent, 0.45, { by: 'courier', cause: 'harpoon' });
          g.events?.emit('harpoon.hit', { what: 'creature', kind: ent.kind, by: 'courier' }); this.cool = HARPOON.coolHit;
        } else g.events?.emit('harpoon.hit', { what: 'miss', by: 'courier' });
        g.fx?.impact?.(hit.point, hit.normal, { sparks: 6, dust: 4 });
        this.state = 'back';
      } else { this.pos.addScaledVector(this.dir, step); if (this.travel >= HARPOON.range) { g.events?.emit('harpoon.hit', { what: 'miss', by: 'courier' }); this.state = 'back'; } }
    } else if (this.state === 'back') {
      _d.copy(_a).sub(this.pos); const d = _d.length(), step = HARPOON.back * dt;
      if (d <= step + 0.4) { this.done(); return; }
      this.pos.addScaledVector(_d.multiplyScalar(1 / d), step);
      if (this.fish) this.fish.pos.copy(this.pos);
    }
    this.draw(_a, dt);
  }

  fire() {
    const g = this.game, C = g.aim?.camera?.() || g.camera;
    C.getWorldDirection(this.dir);
    this.hand(this.pos); this.travel = 0; this.fish = null; this.state = 'out';
    this.spear.visible = true; this.line.rope.reset(this.pos, this.pos);
    sfx.hookFire?.(); g.events?.emit('harpoon.fire', { by: 'courier' });
    this.cool = HARPOON.cool;
  }

  /** The nearest live fish within reach of this step's stretch of the spear's path, or null. */
  spearFish(from, step) {
    const W = this.game.weir; if (!W?.fish?.length) return null;
    let best = null, bd = HARPOON.reach;
    for (const f of W.fish) {
      if (f.dying || f.state === 'hooked' || f.state === 'landed') continue;
      _p.copy(f.pos).sub(from); const t = THREE.MathUtils.clamp(_p.dot(this.dir), 0, step);
      const d = _o.copy(from).addScaledVector(this.dir, t).distanceTo(f.pos);
      if (d < bd + (f.length || 0) * 0.3) { bd = d; best = f; }
    }
    return best;
  }

  /** A speared fish counted as a catch, its quality 'spear', and kept (catchlift.js's keep). */
  landFish(f) {
    const g = this.game, W = g.weir, sp = f.sp, L = g.ledger;
    f.state = 'landed';
    const first = (L?.get?.(`fish.sp.${sp.id}`) ?? 0) === 0, rec = L?.best?.(`fish.cm.${sp.id}`);
    const aspect = ASPECTS[sp.aff.indexOf(Math.max(...sp.aff))]?.id ?? null;
    g.events?.emit('angle.catch', { species: sp.id, cm: f.cm, kg: f.kg, cls: f.cls, dur: 0, peak: 0, thrashes: 0, quality: 'spear', aspect, tide: TIDES[W?.tide ?? 1]?.id,
      brace: false, gave: 0, slackMax: 0, first, ans: 1, record: rec === undefined ? false : f.cm > rec, depth: f.pool ? f.pool.surface - f.pos.y : 0, legend: !!sp.legend, pumps: 0, by: 'courier' });
    g.events?.emit('harpoon.hit', { what: 'fish', species: sp.id, by: 'courier' });
    this.cool = HARPOON.coolHit;
  }

  draw(hand, dt) {
    const g = this.game, cam = g.camera;
    _d.copy(this.pos).sub(hand); if (_d.lengthSq() > 1e-6) this.spear.quaternion.setFromUnitVectors(_x, this.state === 'out' ? this.dir : _d.normalize().negate());
    this.spear.position.copy(this.pos);
    this.line.set(hand, this.pos, { tension: this.state === 'out' ? 0.7 : 0.3, aspect: 0xffb27a, helix: 0, cam: cam.position, fov: cam.fov, lines: g.renderer?.domElement?.height, dt, time: performance.now() / 1000 });
  }

  done() {
    const g = this.game;
    if (this.fish) { g.pneuka?.add?.(`fish.${this.fish.sp.id}`, 'catch'); g.events?.emit('angle.keep', { species: this.fish.sp.id, tier: this.fish.sp.tier, by: 'courier' }); g.weir?.remove(this.fish); this.fish = null; }
    this.state = 'idle'; this.spear.visible = false; this.line.hide();
  }
}
