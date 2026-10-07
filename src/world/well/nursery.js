// ---------------------------------------------------------------------------------------
// THE NURSERY: the slip jellies' clutches in the Great Dunemaw (docs/plans/DUNEMAW-SYSTEMS.md, section 2; the numbers are NURSERY in
// progress/combat/dunemaw.js). A CLUTCH is a nest of 3 to 6 eggs in the slip: one on the first floor as a hint, three on the second,
// eight round the FOE in the bowl. While a guard lives and the Courier is within 20 m it hatches a BROOD (a young jelly, two blows) every
// 20 sim seconds, no more than three out at once, and it always keeps two eggs back for the FOE's call (`call`). The jellies near it
// GUARD it (each held on a leash to it: creatures/jelly/mind.js reads `leash` and `homeR`). Three blows break it: an alarm goes up that
// carries 15 m, each egg left may leave SLIP ROE in the run's haul, and the FOE has two brood fewer to call. A clutch is part of the
// floor's seeded layout, so it is whole again with the next game day's Well, and never sooner (the run is a place in time).
//
// A clutch is a creature by the contract (creatures/creatures.js: hurtable, struck through creatures.strike, so every weapon's path finds
// it as it finds a jelly), with no mind and no statuses that mean anything to it (a nest is not stunned). Its look is a stand-in for
// Calissa's (eggs of wet sand in a dish of slip).
//
// Prior art: Monster Hunter's nests and Zelda's Gohma's eggs (a boss that is weaker for what was broken before it), the Alien queen's
// eggs and Pikmin's Emperor Bulblax's brood (a nest that hatches while you dither), and stealth games' guarded objectives.
//
//   const N = new Nursery(game, { floor, spots: [Vector3], guards: [jelly], haul })   N.update(dt)   N.call(n, near?) -> brood spawned
//   N.whole -> clutches still whole   N.clutches   N.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, G, groups } from '../../core/physics.js';
import { NURSERY, FOE } from '../../progress/combat/dunemaw.js';
import { tag } from '../../core/tags.js';
import { ITEMS } from '../../pneuka/items.js';
import { stream } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
const simRand = stream('world/well/nursery'); // (the simulation's chance: core/rng.js, the same twice)

/** Slip roe's item (Dovina's to name: docs/handoffs/dovina); a clutch leaves none until the item exists. */
export const ROE = 'roe.slip';
const BROOD_SCALE = 0.55, WAKE = 20; // (a brood is about half a jelly; the Courier within 20 m wakes a clutch's hatching)
let eggGeo = null;
/** A clutch's eggs (the warm-up compiles one like it: world/well/dunemaw.js prewarm). */
export const eggMaterial = () => new THREE.MeshStandardMaterial({ color: 0xd9c19a, roughness: 0.35, metalness: 0, emissive: 0x3a2350, emissiveIntensity: 0.4, name: 'clutch-egg' });

export class Nursery {
  constructor(game, { floor, spots, guards = [], haul = null }) {
    this.game = game; this.floor = floor; this.haul = haul;
    this.mat = eggMaterial();
    eggGeo ||= new THREE.SphereGeometry(0.22, 10, 8).scale(1, 1.3, 1);
    this.brood = [];
    this.clutches = spots.map((at, i) => this.lay(at, i));
    // the guards: each jelly within NURSERY.guard.radius of a clutch keeps to it (its home moved there, on a short leash)
    for (const c of guards) {
      const k = this.clutches.reduce((b, x) => (x.pos.distanceTo(c.pos) < (b?.pos.distanceTo(c.pos) ?? Infinity) ? x : b), null);
      if (!k || k.pos.distanceTo(c.pos) > NURSERY.guard.radius) continue;
      c.home.copy(k.pos); c.leash = NURSERY.guard.leash; c.homeR = 4; k.guards.push(c);
    }
  }

  get whole() { return this.clutches.filter((k) => k.alive).length; }

  /** A clutch on the slip at `at`: its eggs (seeded), a creature's contract and a collider for the blows to find. */
  lay(at, i) {
    const g = this.game, r = simRand, n = NURSERY.clutch.eggs[0] + Math.floor(r() * (NURSERY.clutch.eggs[1] - NURSERY.clutch.eggs[0] + 1));
    const root = new THREE.Group(); root.position.copy(at); root.name = `clutch-${i}`;
    const eggs = [];
    for (let e = 0; e < n; e++) {
      const a = (e / n) * Math.PI * 2 + r() * 0.5, d = n > 1 ? 0.3 + r() * 0.25 : 0;
      const m = new THREE.Mesh(eggGeo, this.mat); m.position.set(Math.cos(a) * d, 0.22, Math.sin(a) * d); m.rotation.set(r() * 0.4, r() * 6, r() * 0.4); m.castShadow = true;
      root.add(m); eggs.push(m);
    }
    const dish = new THREE.Mesh(new THREE.CircleGeometry(0.8, 14), this.game.bowl?.slipMat || this.mat); dish.rotation.x = -Math.PI / 2; dish.position.y = 0.03; root.add(dish);
    g.scene.add(root);
    const rb = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(at.x, at.y + 0.35, at.z));
    const col = g.physics.world.createCollider(RAPIER.ColliderDesc.ball(0.55).setCollisionGroups(groups(G.CRITTER, 0xffff)), rb);
    const k = {
      type: 'creature', kind: 'clutch', name: 'Clutch', i, pos: at.clone(), radius: 0.7, height: 0.6, alive: true, hp: NURSERY.clutch.hp,
      eggs, root, rb, col, guards: [], out: [], hatchT: NURSERY.clutch.hatchSeconds * (0.5 + 0.5 * r()), reserve: NURSERY.clutch.brood,
      poise: 99, stunFor: 0, ally: false, inert: true, // (a nest: never stunned, never anyone's mind to read)
      center: (out) => out.copy(k.pos).setY(k.pos.y + 0.3),
      head: () => k.pos.clone().setY(k.pos.y + 0.8),
      hurt: (p, dir, power, cause, by) => this.hurt(k, p, dir, power, cause, by),
      knock: () => {}, vanish: (by) => this.break(k, by || 'courier'),
    };
    tag(k, 'hurtable', 'creature');
    g.physics.register(col, k);
    g.creatures.add(k);
    return k;
  }

  /** A blow on a clutch: it shakes; the third breaks it (a blow is a blow: three, whatever their power). */
  hurt(k, p, dir, power, cause, by) {
    if (!k.alive) return;
    k.hp -= 1; k.shake = 0.3;
    this.game.slip?.addDisc(k.pos.clone(), new THREE.Vector3(0, 1, 0), 0.6, 10, 0.5);
    sfx.jellySquelch?.(this.game.listenerDistance(k.pos), 0.6);
    if (k.hp <= 0) this.break(k, by);
  }

  /** Broken: the alarm, the roe, and two brood the FOE will not call. */
  break(k, by = 'courier') {
    const g = this.game;
    if (!k.alive) return;
    k.alive = false; k.root.visible = false;
    g.physics.world.removeRigidBody(k.rb); k.rb = null;
    g.creatures.remove(k);
    const up = new THREE.Vector3(0, 1, 0);
    g.shells?.addSplat?.(k.pos.clone().setY(k.pos.y + 0.02), up, 2.2, true);
    g.slip?.addDisc(k.pos.clone(), up, 1.4, 18);
    if (g.fx?.alpha?.emit) for (let e = 0; e < 18; e++) g.fx.alpha.emit({ pos: k.pos.clone().setY(k.pos.y + 0.3), vel: new THREE.Vector3((simRand() - 0.5) * 4, 2 + simRand() * 4, (simRand() - 0.5) * 4), life: 0.9, size: 0.07, sizeEnd: 0.02, color: new THREE.Color(0xd9c19a), alpha: 0.9, drag: 0.5, gravity: 9 });
    sfx.jellyPop?.(g.listenerDistance(k.pos));
    g.ai?.stimuli.emit('alarm', k.pos, { radius: NURSERY.guard.alarm, strength: 1, by, source: k, about: by === 'courier' ? g.player : null, aboutPos: g.player.pos });
    let roe = 0;
    if (ITEMS[ROE] && this.haul) for (const _ of k.eggs) if (simRand() < NURSERY.roe) { this.haul.push({ id: ROE, data: null }); roe++; }
    g.events?.emit('clutch.break', { floor: this.floor, roe, by });
  }

  /** The FOE calls its brood: up to n, from the clutches still whole (each gives what it kept back), nearest to `near` first. */
  call(n, near = null) {
    const ks = this.clutches.filter((k) => k.alive && k.reserve > 0).sort((a, b) => (near ? a.pos.distanceTo(near) - b.pos.distanceTo(near) : 0));
    let made = 0;
    for (const k of ks) {
      while (made < n && k.reserve > 0) { k.reserve--; this.hatch(k, true); made++; }
      if (made >= n) break;
    }
    return made;
  }

  /** A brood out of a clutch: a young slip jelly, half the size, two blows (FOE.brood.hp), on the Courier's trail at once. */
  hatch(k, called = false) {
    const g = this.game, J = g.jellies; if (!J) return null;
    const a = simRand() * Math.PI * 2, at = k.pos.clone().add(new THREE.Vector3(Math.cos(a) * 1.1, 0.05, Math.sin(a) * 1.1));
    const c = J.spawn(at, { once: true });
    c.hp = FOE.brood.hp; c.brood = true; c.name = 'Slip Jelly Brood'; c.root.scale.setScalar(BROOD_SCALE); c.poise *= 0.5;
    c.home.copy(k.pos); c.leash = called ? 60 : NURSERY.guard.leash + 6; c.homeR = 4;
    c.mem?.hurt?.(g.player, 'courier', 0.3, g.player.pos); // (it knows who is in its nest)
    k.out.push(c); this.brood.push(c);
    if (k.eggs.length > NURSERY.clutch.brood) { const e = k.eggs.pop(); e.visible = false; }
    g.events?.emit('clutch.hatch', { floor: this.floor, called, by: 'creature' });
    return c;
  }

  update(dt) {
    const P = this.game.player;
    for (const k of this.clutches) {
      if (!k.alive) continue;
      if (k.shake > 0) { k.shake -= dt; k.root.rotation.z = 0.12 * Math.sin(k.shake * 60) * k.shake; }
      k.out = k.out.filter((c) => c.alive);
      const guarded = k.guards.some((c) => c.alive), near = P.pos.distanceTo(k.pos) < WAKE;
      // (it keeps NURSERY.clutch.brood eggs back for the FOE: what it hatches on its own comes from the rest)
      if (!guarded || !near || k.out.length >= NURSERY.clutch.cap || k.eggs.length <= NURSERY.clutch.brood) continue;
      if ((k.hatchT -= dt) <= 0) { k.hatchT = NURSERY.clutch.hatchSeconds; this.hatch(k); }
    }
  }

  dispose() {
    const g = this.game;
    for (const k of this.clutches) {
      if (k.rb) g.physics.world.removeRigidBody(k.rb);
      g.creatures.remove(k); g.scene.remove(k.root);
      k.root.traverse((o) => { if (o.geometry && o.geometry !== eggGeo) o.geometry.dispose(); });
    }
    for (const c of this.brood) g.jellies?.dispose(c);
    this.mat.dispose();
  }
}
