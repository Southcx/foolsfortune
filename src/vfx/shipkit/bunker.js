// ---------------------------------------------------------------------------------------
// THE SHIP'S BUNKER ON DECK (docs/plans/PASSAGE.md 14.2 and 14.8, Calissa's "the bunker is a Lachrymato Bottle"; GAPS.md G181): the
// ship's tank shown as a gauge on the model, never a number: a large Lachrymato Bottle (vfx/bottle.js, its liquid the house's ink and oil
// film, its surface sprung against the ship's motion) stood on the main deck of whichever class is sailed, aft of amidships on the
// starboard side, its height a share of the hull's length so it reads from the chase camera on the 35 m sloop and the tanker alike. Its
// fill is the share of the tank left. It follows the look it is given: a crossing that changes the hull, or the free helm's ship, takes
// it over to the new deck.
//   on the crossing    vfx/crossinglook.js (`stage.fuel`, 0..1, null when no trip is sailed)
//   at the free helm   `HelmBunker` (installed beside the open sea's looks, boot/rooms.js): the voyage's fuel over the class's tank
//                      (world/opensea/opensea.js `voyage.fuel`, progress/rail/ships.js SHIPS[ship].tank)
//
// Prior art: FTL's fuel read off the ship, Splatoon's ink tank worn as a gauge, the deck cargo of a tramp steamer (a tank lashed aft).
//
//   const B = new ShipBunker()   B.follow(look) (a ShipLook, or null to take it off)   B.set(fill 0..1 | null hides)   B.update(raw, accelWorld?)
//   game.helmBunker = new HelmBunker(game)   .update(dt)   BUNKER (where and how big)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LachrymatoBottle, BOTTLE_SHAPES } from '../bottle.js';
import { SHIPS } from '../../progress/rail/ships.js';

/** Where it stands in the ship's frame (+Z the bow): `z` and `x` as shares of the length and beam, its height `h` of the length (the
 *  sloop's 35 m: a bottle 2.8 m tall, lashed beside the mainmast's foot), turned `yaw` so its broad face is seen from abaft the beam. */
export const BUNKER = { z: -0.16, x: 0.24, h: 0.08, yaw: 0.6 };
const H = BOTTLE_SHAPES.large.h;
const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3();

export class ShipBunker {
  constructor() {
    this.bottle = new LachrymatoBottle({ size: 'large' });
    this.group = this.bottle.group; this.group.name = 'ship-bunker'; this.group.visible = false; this.look = null; this.fill = null;
  }
  /** Stand it on this look's deck (or take it off, given null). */
  follow(look) {
    if (look === this.look) return;
    this.group.removeFromParent(); this.look = look || null;
    if (!look?.body) return;
    const L = look.length ?? 7, z = BUNKER.z * L, y = look.deckHeight ? look.deckHeight(z) : look.deckY ?? 0;
    this.group.position.set(BUNKER.x * (look.beam ?? 2.4), y, z); this.group.rotation.set(0, BUNKER.yaw, 0);
    this.group.scale.setScalar((BUNKER.h * L) / H);
    look.body.add(this.group);
  }
  /** How full the tank is (0..1); null hides it (no tank to show: no trip, a ship not sailed). */
  set(fill) {
    this.fill = fill; this.group.visible = fill != null && !!this.look;
    if (this.group.visible) this.bottle.set({ fill });
  }
  update(raw, accelWorld = null) { if (this.group.visible) this.bottle.update(raw, accelWorld); }
  dispose() { this.group.removeFromParent(); this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
}

/** The free helm's bunker: the open sea's ship, while it is sailed or moored, its voyage's tank on its deck. */
export class HelmBunker {
  constructor(game) { this.game = game; this.bunker = null; this.prev = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.has = false; }
  update(dt) {
    const R = this.game.opensea, helm = R?.built ? R.helm : null, look = helm?.look;
    if (!look || !R.voyage) { if (this.bunker) { this.bunker.follow(null); this.bunker.set(null); } this.has = false; return; }
    const B = (this.bunker ||= new ShipBunker());
    B.follow(look);
    const tank = SHIPS[helm.ship ?? R.voyage.ship]?.tank ?? SHIPS.sloop.tank;
    B.set(look.group.visible ? THREE.MathUtils.clamp(R.voyage.fuel / tank, 0, 1) : null);
    // the slosh: the hull's own pushes (its velocity's change, world frame)
    look.group.getWorldPosition(_p);
    if (this.has && dt > 0) { _v.copy(_p).sub(this.prev).divideScalar(dt); _a.copy(_v).sub(this.vel).divideScalar(dt); this.vel.copy(_v); } else _a.set(0, 0, 0);
    this.prev.copy(_p); this.has = true;
    B.update(dt, _a.clampLength(0, 30));
  }
}
