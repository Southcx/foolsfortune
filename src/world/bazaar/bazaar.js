// ---------------------------------------------------------------------------------------
// RAKU'S BAZAAR (working name, Espada's to rule; docs/plans/CASINO.md section 9; the owner, 2026-10-15: "split off the Treasury section of
// The Weir and give Raku his own bizarre bazaar casino area", "Gold Saucer all the way"): Raku's casino, a round hall under a dome, a
// zone of its own far south of the workshop (Petra's place for it: BAZAAR). An area of its own (render/areas.js, stage 2: docs/plans/AREAS.md
// A1): the hall is built when the camera comes to it (`build`) and torn down whole a few real seconds after it leaves (`teardown`): its
// geometry merged by colour in its own group, its own materials, its colliders, its lamps; only the Weir's gate in the Dunes, the save's
// preference and the module itself stay, and a query while it is down answers nothing. In it: Raku's cage (chips for cubes and back: progress/casino/chips.js), a table for each game of the casino (F at one sits
// you down: world/bazaar/session.js), the Treasury's slot on the north side (Petra moves the Weir's Treasury here at the merge), and a gate
// on the south wall back to the Weir, whose twin stands where the Treasury stood. Two ways in: the Index's row, and that gate.
// The look is a placeholder: the Gold Saucer's dome, neon and lanterns are Calissa's to make (docs/handoffs/calissa/).
//
// Prior art: Final Fantasy VII's Gold Saucer (a casino and carnival under a dome, a hub of minigames), Like a Dragon's and Yakuza's
// casinos (a table walked up to is a game sat down at), FFXII's areas (built on entry, gone on leaving: AREAS.md).
//
//   BAZAAR (where it stands; its tables, cage, gate and the Treasury's slot)   game.bazaar = new Bazaar(game)   .here   .arrive()
//   .update(dt)   .spot(id) -> { pos, yaw }   .build()   .teardown()   .built (render/areas.js: boot/services.js registers the pair)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { dress } from '../../vfx/surfaces.js';
import { addOutline } from '../../render/outline.js';
import { zoneOf } from '../../render/zonemap.js';
import { TableSession, TABLES } from './session.js';
import { OX, OY, OZ, NORTH_BEACH } from '../../tools/sondelass/angling/weir.js';

/** Where it stands (Petra's place, 2026-10-15: empty ground south of the basement, out of every sky), the hall's radius and height, and
 *  where things are on its floor (local metres: x east, z north is -z). The Treasury's slot: flat floor 34 m by 8 m, for Petra's
 *  `buildTreasury(game, at)`. */
export const BAZAAR = {
  x: 0, y: 200, z: -3000, r: 58, wall: 16, dome: 46,
  arrive: { x: 0, z: 44, yaw: Math.PI }, gate: { x: 0, z: 54 }, cage: { x: 0, z: -24 },
  treasury: { x: 0, z: -3042, yaw: 0 }, // (world x, z: Petra's slot; the plinths face south, into the hall)
  weirGate: { x: 14, z: NORTH_BEACH.z }, // (the twin on the Weir's north beach, east of where the Treasury stood: metres from the oasis's origin)
};
/** The hall's air (Calissa's, 2026-10-15: a warm night carnival): the fog's colour (the dome's violet warmed by the lanterns) and density
 *  (exp2: the far wall at 110 m still half seen). */
export const AIR = { fog: 0x2a1530, density: 0.0072 };
const C = { floor: 0x3a2030, inlay: 0xd9a441, wall: 0x2a1426, trim: 0xf2c14e, cloth: 0x1f6b4a, cage: 0x6b2a2a, gate: 0xd9a441, neon: [0xff4fa3, 0x4fe0ff, 0xffd84f, 0x9b6bff] };

export class Bazaar {
  constructor(game) {
    this.game = game; this.built = false; this.neon = []; this.lamps = [];
    const B = BAZAAR, L = game.level;
    // its twin gate on the Weir's north beach, beside the Treasury: through it, the bazaar (the Dunes' ground, built with them at boot)
    const wx = OX + B.weirGate.x, wz = OZ + B.weirGate.z;
    for (const s of [-1, 1]) L.box([wx + s * 2.4, OY + 2.8, wz], [0.7, 5.6, 0.7], C.gate);
    L.box([wx, OY + 5.9, wz], [5.5, 0.6, 0.7], C.gate);
    this.weirGate = new THREE.Vector3(wx, OY, wz);
    this.sessions = new Map(); // (one game a table at a time)
    // the tables' own preference (the bots' pace: session.js SPEEDS), kept with the settings, not the progress
    this.prefs = { speed: 'normal' };
    game.save?.section('casinoPrefs', { scope: 'settings', version: 1, dump: () => ({ ...this.prefs }), load: (d) => Object.assign(this.prefs, d || {}), reset: () => { this.prefs.speed = 'normal'; } });
  }

  /** The hall built (render/areas.js calls it as the camera comes to it, or a teleport lands in it): every piece in one group of its own,
   *  the boxes and cylinders merged by colour (as the level's static batches are), their colliders kept to be taken out again. */
  build() {
    if (this.built) return;
    const g = this.game, B = BAZAAR, y = B.y, X = (x) => B.x + x, Z = (z) => B.z + z, phys = g.physics;
    const hall = this.hall = new THREE.Group(); hall.name = 'bazaarHall'; hall.userData.zone = 'bazaar';
    const geos = new Map(), cols = this.colliders = [], body = g.level?.fixedBody;
    const put = (geo, color, { outline = true, shadow = true } = {}) => { const k = `${color}_${outline}_${shadow}`; if (!geos.has(k)) geos.set(k, { color, outline, shadow, list: [] }); geos.get(k).list.push(geo.index ? geo.toNonIndexed() : geo); };
    const collide = (cd) => { if (phys && body) cols.push(phys.world.createCollider(cd.setCollisionGroups(GROUPS.static).setFriction(0.9), body)); };
    const box = (pos, size, color, { rotY = 0, collide: c = true, outline = true } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)), geo = new THREE.BoxGeometry(...size);
      geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1))); put(geo, color, { outline });
      if (c) collide(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setTranslation(...pos).setRotation(q));
    };
    const cylinder = (pos, r, h, color, segs = 10, outline = true) => { const geo = new THREE.CylinderGeometry(r, r, h, segs); geo.translate(...pos); put(geo, color, { outline }); collide(RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(...pos)); };
    // the floor: one slab, an inlaid ring of gold round the middle (a placeholder for the Gold Saucer's tiles)
    box([X(0), y - 0.5, Z(0)], [B.r * 2 + 4, 1, B.r * 2 + 4], C.floor);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; box([X(Math.cos(a) * 18), y + 0.01, Z(Math.sin(a) * 18)], [4.6, 0.02, 0.5], C.inlay, { collide: false, outline: false, rotY: -a + Math.PI / 2 }); }
    // the wall: sixteen panels round the hall, a gap at the south for the gate
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, cx = Math.cos(a) * B.r, cz = Math.sin(a) * B.r; if (cz > B.r * 0.9) continue; // (the gate's gap, south)
      box([X(cx), y + B.wall / 2, Z(cz)], [2 * B.r * Math.tan(Math.PI / 16) + 0.4, B.wall, 1.2], C.wall, { rotY: -a + Math.PI / 2 });
      box([X(cx * 0.985), y + B.wall - 0.6, Z(cz * 0.985)], [2 * B.r * Math.tan(Math.PI / 16), 0.5, 0.4], C.trim, { collide: false, rotY: -a + Math.PI / 2 });
    }
    for (const s of [-1, 1]) box([X(s * 9), y + B.wall / 2, Z(B.r - 1)], [8, B.wall, 1.2], C.wall); // (either side of the gate)
    // Raku's cage: chips for cubes, and back
    box([X(B.cage.x), y + 0.55, Z(B.cage.z)], [7, 1.1, 1.4], C.cage);
    box([X(B.cage.x), y + 2.6, Z(B.cage.z - 0.6)], [7, 3, 0.2], C.trim, { collide: false });
    // the tables (session.js TABLES: where each stands), a round cloth on a plinth
    for (const T of TABLES) { cylinder([X(T.at.x), y + 0.45, Z(T.at.z)], T.r, 0.9, C.cage); cylinder([X(T.at.x), y + 0.92, Z(T.at.z)], T.r - 0.15, 0.06, C.cloth, 24, false); }
    // the gate back to the Weir: an arch in the south wall's gap
    for (const s of [-1, 1]) box([X(B.gate.x + s * 3.2), y + 3.5, Z(B.gate.z)], [0.9, 7, 0.9], C.gate);
    box([X(B.gate.x), y + 7.4, Z(B.gate.z)], [7.3, 0.8, 0.9], C.gate);
    for (const { color, outline, shadow, list } of geos.values()) {
      const merged = mergeGeometries(list.map((q) => { q.deleteAttribute('uv'); return q; }), false); for (const q of list) q.dispose();
      const m = new THREE.Mesh(merged, dress(new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true }), color));
      m.receiveShadow = true; m.castShadow = shadow; if (outline) addOutline(m); hall.add(m);
    }
    // the dome: drawn only, a sky of its own (a placeholder: Calissa's Gold Saucer)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(B.r + 2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x140a24, side: THREE.BackSide }));
    dome.scale.y = B.dome / (B.r + 2); dome.position.set(X(0), y + B.wall - 2, Z(0)); hall.add(dome); this.dome = dome;
    // neon bands round the wall's top, and lamps of the light budget among the tables (render/lightbudget.js adopts them from the scene)
    for (let k = 0; k < 4; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(B.r - 1.5 - k * 0.4, 0.12, 6, 64), new THREE.MeshBasicMaterial({ color: C.neon[k] }));
      ring.rotation.x = Math.PI / 2; ring.position.set(X(0), y + B.wall - 2.5 - k * 0.7, Z(0)); hall.add(ring); this.neon.push(ring);
    }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3, l = new THREE.PointLight(C.neon[k % 4], 22, 34, 1.4); l.position.set(X(Math.cos(a) * 30), y + 9, Z(Math.sin(a) * 30)); hall.add(l); this.lamps.push(l); }
    g.scene.add(hall);
    this.built = true;
  }

  /** The hall torn down (render/areas.js, a few real seconds after the camera and its neighbours leave): the group out of the scene, its
   *  geometry and its own materials disposed (the dressing's shared textures are the room glaze atlas's, kept), its colliders taken out.
   *  A seat at a table is closed first. The module stays, answering as a hall with nothing in it. */
  teardown() {
    if (!this.built) return;
    const g = this.game, phys = g.physics;
    this.close();
    if (this.hall) {
      g.scene.remove(this.hall);
      this.hall.traverse((o) => { if (o.geometry && !o.userData.isOutline) o.geometry.dispose(); if (o.material && !o.userData.isOutline) for (const m of [].concat(o.material)) m.dispose(); });
    }
    for (const c of this.colliders || []) phys?.world?.removeCollider(c, false);
    this.hall = null; this.dome = null; this.neon = []; this.lamps = []; this.colliders = []; this.built = false;
  }

  /** Is the Courier in the hall (its zone)? */
  get here() { return zoneOf(this.game.player.pos) === 'bazaar'; }
  /** A place in the hall, in the world: the arrival, the gate, the cage, a table by its id. */
  spot(id) {
    const B = BAZAAR, T = TABLES.find((t) => t.id === id), at = T ? T.at : B[id];
    return at ? { pos: new THREE.Vector3(B.x + at.x, B.y, B.z + at.z), yaw: at.yaw ?? 0 } : null;
  }

  /** Into the hall, set down inside its gate (from the Index, or the Weir's gate). */
  arrive() {
    const g = this.game, B = BAZAAR, to = new THREE.Vector3(B.x + B.arrive.x, B.y + 0.05, B.z + B.arrive.z);
    g.player.killY = B.y - 60; g.course?.teleport(to, B.arrive.yaw);
    g.events?.emit('bazaar.enter', { by: 'courier' });
  }
  /** Out through the gate to the Weir's north beach, under the seam's cover. */
  leave() { const g = this.game; this.close(); g.seam?.cross(() => g.course?.toWeir?.()) || g.course?.toWeir?.(); g.events?.emit('bazaar.leave', { by: 'courier' }); }

  /** F at the cage, a table or the gate. Wired on the first frame (the hall is built before the interact chevron exists). */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('bazaar', () => {
      if (g.dialogue?.open || this.session?.open || g.god?.controlling) return null;
      const P = g.player.pos, B = BAZAAR; let best = null;
      if (!this.here || !this.built) { if (this.here) return null; const d = Math.hypot(P.x - this.weirGate.x, P.z - this.weirGate.z); return d < 3.2 && Math.abs(P.y - this.weirGate.y) < 4 ? { pos: this.weirGate.clone().setY(this.weirGate.y + 4.5), d, ref: 'weirgate' } : null; } // (the Weir's gate in)
      const near = (ref, x, z, reach, h) => { const d = Math.hypot(P.x - (B.x + x), P.z - (B.z + z)); if (d < reach && (!best || d < best.d)) best = { pos: new THREE.Vector3(B.x + x, B.y + h, B.z + z), d, ref }; };
      near('cage', B.cage.x, B.cage.z + 1.2, 2.6, 3);
      near('gate', B.gate.x, B.gate.z - 1, 3.2, 4);
      for (const T of TABLES) near(T.id, T.at.x, T.at.z, T.r + 1.6, 2.2);
      return best;
    });
  }
  /** Raku's cage: the chips bought and cashed, on a page set aside (indexmenu.js). */
  openCage() {
    const g = this.game, menu = g.indexMenu || g.course?.menu, C2 = g.chips; if (!menu?.showPage || !C2) return;
    menu.showPage('bazaar.cage', (im, el) => {
      const rows = el('div', 'rooms'), row = (t, s, go) => { const d = el('div', 'room', `<span><b>${t}</b><s>${s}</s></span>`); d.onclick = () => { go(); this.openCage(); }; rows.appendChild(d); };
      im.appendChild(el('div', 'grp', `YOUR CHIPS: ${C2.balance} · CUBES: ${g.cubes?.balance ?? 0} · CASHABLE NOW: ${Math.min(C2.balance, C2.room)}`));
      for (const n of [50, 100, 250]) row(`Buy ${n} Raku chips`, `${n} cubes`, () => C2.buy(n));
      row('Cash out', 'chips back to cubes, your winnings up to the day\'s cap', () => C2.cash());
      im.appendChild(rows);
    }, { title: "RAKU'S CAGE", sub: 'one cube a chip · F closes', aside: 'right' });
  }
  close() { this.session?.close(); this.session = null; }

  /** The hall's own air (main.js calls it after the room's fog is graded each frame, so nothing is put back): a thin violet haze under
   *  the dome while the camera is in the hall, instead of the workshop's close brown (which hid the far tables at 40 m). */
  light() {
    const g = this.game, F = g.scene.fog; if (!F || zoneOf(g.camera.position) !== 'bazaar') return;
    F.color.setHex(AIR.fog); F.density = AIR.density;
  }

  /** While a window holds the world (the table's own page is one: main.js returns before update), the seat's clock still runs, so the
   *  folk take their turns under it (CASEBOOK, 233). */
  tickModal(dt) { if (this.session?.open) this.session.update(dt); }

  /** `/howto`: the how-to of the table you sit at (the chat line exists only after boot: asked here, the first frame it does). */
  commands() {
    const g = this.game; if (this.cmds || !g.chat?.add) return; this.cmds = true;
    g.chat.add('howto', { help: "how to play the game at the table you're sitting at (Raku's Bazaar)", run: () => {
      if (this.session?.open) this.session.showHowto(); else g.log?.say('info', "Sit at one of Raku's tables first: F at a table.", { key: 'howto', throttle: 1 });
    } });
  }

  update(dt) {
    this.commands();
    this.wire();
    const g = this.game, it = g.interact?.cur, P = g.player;
    const t = (this.t = (this.t || 0) + dt); this.neon.forEach((n, k) => { n.material.color.setHSL(((t * 0.05 + k * 0.25) % 1), 0.9, 0.6); }); // (the neon cycles: a placeholder's flicker of the Gold Saucer)
    if (it?.id === 'bazaar' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      if (it.ref === 'cage') this.openCage();
      else if (it.ref === 'gate') this.leave();
      else if (it.ref === 'weirgate') { g.seam?.cross(() => this.arrive()) || this.arrive(); }
      else { const T = TABLES.find((x) => x.id === it.ref); if (T) { this.session = new TableSession(g, T); this.session.start(); } }
    }
    if (this.session) { this.session.update(g.rawDt ?? dt); if (!this.session.open && this.session.done) this.session = null; }
    if (this.session && !this.here) this.close();
  }
}
