// ---------------------------------------------------------------------------------------
// THE ENTROPY ROOM (plain name; South, 2026-11-06: "it doesn't belong in Raku's bazaar, it should be compartmentalized into its own zone";
// docs/plans/ENTROPY-TACTICS.md section 9): Entropy Tactics' own zone, "like playing on an oasis in high-entropy space". A small island
// of ground hung in a void (its zone `entropy`, out of every sky), a seat stone at its north edge, and the 7 x 7 board floating out over
// the void beyond it as 49 separate tiles, one mesh a cell, so the board can be laid in a ripple and a tile turned over on its own (South:
// "individual tile meshes floating in space, so we can do cool cascading ripple effects for board setup and tile-flipping mechanics").
// F at the seat sits you down (world/bazaar/session.js TableSession, the house's seat, its lobby, how-to, practice and stakes); F at the
// door on the south rim goes back to the hub. Two ways in: the Index's row, and that door. An area of its own (render/areas.js stage 2):
// built when the camera comes to it, torn down whole after it leaves.
// The look is a placeholder and must not anchor anyone (South: "cosmic-themed, abstract, eldritch and avant-garde", never the Clay
// dress): grey slabs for tiles, a dark disc for the oasis. The board's camera (Hearthstone's and Magic Arena's: the board from your side,
// tipped away, a tilt-shift falloff into the far rows) is data here, CAMERA, for Petra's rig and Calissa's pass.
// The board's moments for the look: entropy.board { phase: 'setup' } as you sit (the tiles' placeholder ripple plays here), and the
// table's own casino.play events after.
// YOUR ARCANA (version 2.1, 8.12): `/arcana <fool | chariot | empress | hermit | tower>` picks the class you sit as (event entropy.class);
// Dovina takes each of the others in turn, game by game, so every match-up comes round.
//
// Prior art: Hearthstone's and Magic: The Gathering Arena's boards (a table seen from your own side, tilted away, the far edge falling off
// in focus), Monument Valley's and Manifold Garden's floating tiles in an empty sky, the Touchstone (world/touchstone/touchstone.js: the
// same build, teardown, arrival and F wiring).
//
//   ENTROPY_ROOM (where it stands; its oasis, seat, door, board)   BOARD   CAMERA   ENTROPY_SEAT (the table row)   tileAt(x, z) -> world pos
//   game.entropyRoom = new EntropyRoom(game)   .here   .arrive()   .leave()   .build()   .teardown()   .built   .tiles   .update(dt)
//   .tickModal(dt)   .light()   events entropy.enter, entropy.leave, entropy.board { phase }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { zoneOf as zoneAt } from '../../render/zonemap.js';
import { TableSession } from '../bazaar/session.js';
import { ENTROPY, startOwner as boardSide } from '../../progress/casino/entropy/rules.js';
import { entropyBot } from '../../progress/casino/entropy/bot.js';
import { seatOf } from '../../progress/casino/folk.js';
import { CLASSES, CLASS_IDS } from '../../progress/casino/entropy/classes.js';

/** Where it stands (empty space west of the bazaar's row, at the rooms' height: nothing else drawn from it), the oasis's radius, and
 *  where things are on it (local metres; north is -z: the board lies north of the seat, your rows nearest). */
export const ENTROPY_ROOM = {
  x: -1500, y: 200, z: -3000, oasis: 9, seat: { x: 0, z: -3 }, door: { x: 0, z: 7.5 }, arrive: { x: 0, z: 4, yaw: Math.PI },
  killDrop: 60, // (m below the oasis: a fall into the void sets you back on it, the player's own killY)
};
/** The board: 7 x 7 cells, each its own tile floating `lift` m over the oasis's height, `tile` m across with `gap` between (so each reads
 *  as a thing alone); row 0 the far one (the other seat's back rank at the start, progress/casino/entropy/rules.js startOwner), row 6 yours. `ripple`:
 *  the placeholder setup, a tile rising from `from` m below, `per` real s later for each metre from the board's heart, `rise` real s. */
export const BOARD = { size: 7, tile: 1.6, gap: 0.35, lift: 0.6, near: -5.2, ripple: { from: 6, per: 0.06, rise: 0.7 } };
/** The board's camera (Petra's rig; Calissa's tilt-shift): from behind your seat, high and tipped down across the board, the far rows
 *  falling out of focus (`focus` the board row held sharp, `band` the sharp share of the screen's height). Numbers as a first guess. */
export const CAMERA = { back: 6.5, up: 9, pitch: -0.95, fov: 34, focus: 4.5, band: 0.32 };
/** Its air: a near-black violet void (Calissa's to make cosmic). */
export const AIR = { fog: 0x0a0612, density: 0.004 };
/** Your class, and how many games Dovina has sat (her class the next of the others each game). Not kept: progress resets every build. */
export const ENTROPY_PICK = { you: 'fool', games: 0 };
const rivalOf = (you, n) => { const rest = CLASS_IDS.filter((c) => c !== you); return rest[n % rest.length]; };
/** The seat's table row (the house's TableSession reads it): two seats, you and Dovina's style (progress/casino/folk.js), a pot stake. */
export const ENTROPY_SEAT = {
  id: 'entropy', game: ENTROPY, seats: 2, names: ['you', 'Dovina'], bots: [null, seatOf('Dovina', 'entropy', entropyBot)],
  stake: 25, rake: 0.1, settle: 'pot', opts: (first) => ({ first, classes: [ENTROPY_PICK.you, rivalOf(ENTROPY_PICK.you, ENTROPY_PICK.games++)] }), label: 'Entropy Tactics',
  line: 'Two Major Arcana and a Grand Bomb on a 7 x 7 board: make a tile\'s sum exactly 21 to turn it yours, march court cards as tokens, carve your deck, and have the bomb go off on their tile. Choose your Major Arcana with /arcana.',
};
const span = BOARD.tile + BOARD.gap;
/** A cell's world position (its tile's top centre). */
export function tileAt(x, z) {
  const R = ENTROPY_ROOM, B = BOARD, h = (B.size - 1) / 2;
  return new THREE.Vector3(R.x + (x - h) * span, R.y + B.lift, R.z + B.near - (B.size - 1 - z) * span);
}
const C = { oasis: 0x1c1626, seat: 0x3a3048, door: 0x2a2236, side: [0x34405a, 0x5a3434], neutral: 0x44404c };

export class EntropyRoom {
  constructor(game) { this.game = game; this.built = false; this.tiles = []; this.lamps = []; this.session = null; this.t = 0; this.setupAt = -1; }
  build() {
    if (this.built) return;
    const g = this.game, R = ENTROPY_ROOM, phys = g.physics, body = g.level?.fixedBody;
    const room = this.room = new THREE.Group(); room.name = 'entropy'; room.userData.zone = 'entropy';
    this.colliders = [];
    const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true });
    // the oasis: a disc of ground hung in the void, its collider a cylinder
    const oasis = new THREE.Mesh(new THREE.CylinderGeometry(R.oasis, R.oasis * 0.7, 1.2, 32), mat(C.oasis)); oasis.position.set(R.x, R.y - 0.6, R.z + 2); oasis.receiveShadow = true; room.add(oasis);
    if (phys && body) this.colliders.push(phys.world.createCollider(RAPIER.ColliderDesc.cylinder(0.6, R.oasis).setTranslation(R.x, R.y - 0.6, R.z + 2).setCollisionGroups(GROUPS.static).setFriction(0.9), body));
    const stone = (at, size, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color)); m.position.set(R.x + at.x, R.y + size[1] / 2, R.z + at.z); m.castShadow = true; room.add(m); return m; };
    stone(R.seat, [1.4, 0.9, 0.9], C.seat); // (the seat stone: F sits you down)
    stone(R.door, [2.2, 3, 0.4], C.door); // (the door home)
    // the board: one mesh a cell (never merged: each is turned, raised or rippled alone)
    const geo = new THREE.BoxGeometry(BOARD.tile, 0.25, BOARD.tile);
    this.tiles = [];
    for (let z = 0; z < BOARD.size; z++) for (let x = 0; x < BOARD.size; x++) {
      const side = boardSide(z), m = new THREE.Mesh(geo, mat(side < 0 ? C.neutral : C.side[side]));
      const at = tileAt(x, z); m.position.copy(at); m.castShadow = true; m.receiveShadow = true;
      m.userData.cell = { x, z, side, home: at.clone() }; room.add(m); this.tiles.push(m);
    }
    this.tileGeo = geo;
    const lamp = new THREE.PointLight(0xc8b8ff, 10, 30, 1.4); lamp.position.set(R.x, R.y + 9, R.z - 4); room.add(lamp); this.lamps.push(lamp);
    g.lights?.adoptIn?.(room);
    g.scene.add(room);
    this.built = true;
  }
  teardown() {
    if (!this.built) return;
    const g = this.game, phys = g.physics;
    this.close();
    if (this.room) { g.scene.remove(this.room); this.room.traverse((o) => { if (o.geometry && o.geometry !== this.tileGeo) o.geometry.dispose(); if (o.material) for (const m of [].concat(o.material)) m.dispose(); }); }
    this.tileGeo?.dispose();
    for (const c of this.colliders || []) phys?.world?.removeCollider(c, false);
    this.room = null; this.colliders = []; this.lamps = []; this.tiles = []; this.tileGeo = null; this.built = false;
  }
  get here() { return zoneAt(this.game.player.pos) === 'entropy'; }
  arrive() {
    const g = this.game, R = ENTROPY_ROOM;
    g.player.killY = R.y - R.killDrop; g.course?.teleport(new THREE.Vector3(R.x + R.arrive.x, R.y + 0.05, R.z + R.arrive.z), R.arrive.yaw);
    g.events?.emit('entropy.enter', { by: 'courier' });
  }
  leave() {
    const g = this.game, C2 = g.course; this.close();
    const home = () => C2?.teleport(C2.hubSpawn.v, C2.hubSpawn.yaw);
    g.seam?.cross(home, { to: 'hub' }) || home();
    g.events?.emit('entropy.leave', { by: 'courier' });
  }
  /** F at the seat or the door (wired on the first frame: the chevron exists after boot). */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('entropy', () => {
      if (!this.built || !this.here || this.session?.open || g.dialogue?.open || g.god?.controlling) return null;
      const P = g.player.pos, R = ENTROPY_ROOM; let best = null;
      const near = (ref, at, reach, h) => { const d = Math.hypot(P.x - (R.x + at.x), P.z - (R.z + at.z)); if (d < reach && (!best || d < best.d)) best = { pos: new THREE.Vector3(R.x + at.x, R.y + h, R.z + at.z), d, ref }; };
      near('seat', R.seat, 2.2, 1.4); near('door', R.door, 2.4, 3.2);
      return best;
    });
  }
  sit() {
    const g = this.game; if (this.session?.open) return;
    this.session = new TableSession(g, ENTROPY_SEAT); this.session.start();
    this.setupAt = this.t; g.events?.emit('entropy.board', { phase: 'setup', by: 'courier' });
  }
  close() { if (this.session) { this.session.close(); this.session = null; } }
  /** Its own air (after the room's fog is graded each frame, as the bazaar's and the Touchstone's). */
  light() {
    const g = this.game, F = g.scene.fog; if (!F || zoneAt(g.camera.position) !== 'entropy') return;
    F.color.setHex(AIR.fog); F.density = AIR.density;
  }
  /** The seat's page ticks while it holds the game (the bazaar's tickModal calls this too). */
  tickModal(dt) { if (this.session?.open) this.session.update(dt); this.game.entropyLook?.tick(dt); } // (the look ticks under the seat's page too: vfx/entropy/)
  /** The tiles' placeholder life: a slow bob, and the setup's ripple out from the board's heart (Calissa's look replaces both). */
  animate() {
    const B = BOARD, h = (B.size - 1) / 2, rp = B.ripple;
    for (const m of this.tiles) {
      const c = m.userData.cell, d = Math.hypot(c.x - h, c.z - h) * span;
      let k = 1; if (this.setupAt >= 0) k = Math.min(1, Math.max(0, (this.t - this.setupAt - d * rp.per) / rp.rise));
      const ease = 1 - (1 - k) ** 3;
      m.position.y = c.home.y - rp.from * (1 - ease) + Math.sin(this.t * 0.8 + c.x * 0.7 + c.z * 0.5) * 0.05;
    }
  }
  /** `/arcana [class]`: the class you sit as. */
  commands() {
    const g = this.game; if (this.cmds || !g.chat?.add) return; this.cmds = true;
    g.chat.add('arcana', { help: `your Major Arcana at Entropy Tactics: ${CLASS_IDS.join(', ')}`, run: (a) => {
      const id = String(a?.[0] || '').toLowerCase();
      if (!CLASSES[id]) { g.log?.say('info', `Choose one: ${CLASS_IDS.map((c) => `${c} (${CLASSES[c].label})`).join(', ')}.`, { key: 'arcana', throttle: 1 }); return; }
      ENTROPY_PICK.you = id; g.events?.emit('entropy.class', { cls: id, label: CLASSES[id].label, passive: CLASSES[id].passive, does: CLASSES[id].does, by: 'courier' });
    } });
  }
  update(dt) {
    this.commands();
    this.wire();
    const g = this.game, it = g.interact?.cur, P = g.player;
    this.t += g.rawDt ?? dt;
    if (this.built && !g.entropyLook?.owns) this.animate(); // (the placeholder life, until Calissa's tiles move them: vfx/entropy/tiles.js)
    if (it?.id === 'entropy' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      if (it.ref === 'door') this.leave(); else this.sit();
    }
    if (this.session) { this.session.update(g.rawDt ?? dt); if (!this.session.open) this.session = null; }
    if (this.session && !this.here) this.close();
    g.entropyLook?.tick(g.rawDt ?? dt); // (its look: the void, the tiles, the board view: vfx/entropy/)
  }
}
