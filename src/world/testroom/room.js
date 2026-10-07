// ---------------------------------------------------------------------------------------
// THE THROWING ROOM: a side room off the Workshop's east wall where aim and recoil are measured and Strawman stands (the owner, 2026-10-06:
// "pots should respawn only if in a designated testing area... move the target plates away from the Kiln to a side room, lump Strawman in
// there too... make it a whole thing with the calibration room/Index as a means of testing aim and recoil"). What it measures and counts
// is Dovina's (progress/combat/testroom.js: DRILLS, POTS, WALL, INDEX; Strawman's STRAWMAN and bout() in progress/combat/dunemaw.js); its
// look is Calissa's (the targets, the wall, Strawman's model: vfx/strawman.js); this is the place and its bodies.
//
// The room is 20 by 16 m through a door in the Workshop's east wall: the firing mark a few steps in, the spray wall of soft clay 10 m down
// the lane from it, the targets that came from beside the kiln on posts along the north side, Strawman on the south side, the twelve pots
// that come back on a shelf by the door, and the Index's console beside it (F: the room's page, feedback/indexmenu.js). It measures and
// never pays: its pots and Strawman are `training` (the ledger never hears them: tracking.js), and a drill run on a tuned game is said but
// not recorded (feedback/tracking/testroom.js).
//
// Prior art: Apex Legends' firing range and Valorant's range (one room for every test, set from a console in it), Counter-Strike's spray
// practice (a wall that keeps where every shot went), Aim Lab's drills (drills.js), a fighting game's training mode (Strawman).
//
//   buildTestRoom(level) -> the static room (called from level.build; its colliders merged with the Workshop's)   TR (the measures)
//   game.testroom = new TestRoom(game)   .update(dt, raw)   .inRoom(p)   .drills (drills.js)   .strawman (the creature)   .wall   .console (the Index's lectern, a group)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { POTS, WALL } from '../../progress/combat/testroom.js';
import { STRAWMAN, bout } from '../../progress/combat/dunemaw.js';
import { StrawmanModel } from '../../vfx/strawman.js';
import { Drills } from './drills.js';
import { TR } from './layout.js';
export { TR };


/** The static room: floor, walls, roof, beams, the lane and the mark, the clay wall, the shelf. Returns the wall's collider. */
export function buildTestRoom(level) {
  const C = PALETTE, { x0, x1, z0, z1, h } = TR, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  const shell = { outline: false, shadow: false };
  level.box([cx, -0.25, cz], [w, 0.5, d], C.floor, { outline: false }); // (a floor has no outline: the hull's top lay in the floor's own plane and fought it for the pixels, the owner's R45 report; the Workshop's slabs, basement.js groundFloor, are the same)
  level.box([cx, h + 0.25, cz], [w + 1, 0.5, d + 1], C.deep, shell);
  level.box([x1 + 0.25, h / 2, cz], [0.5, h, d + 1], C.wall, shell);
  level.box([cx, h / 2, z0 - 0.25], [w, h, 0.5], C.wall, shell);
  level.box([cx, h / 2, z1 + 0.25], [w, h, 0.5], C.wall, shell);
  // the floor's planks, a wainscot, beams across, and posts in the walls (so it reads as the Workshop's own wing, not a box)
  for (let z = z0 + 2; z < z1; z += 2) level.box([cx, 0.005, z], [w, 0.01, 0.06], C.deep, { outline: false, collide: false, shadow: false });
  for (const [x, z, sx, sz] of [[cx, z0 + 0.06, w, 0.12], [cx, z1 - 0.06, w, 0.12], [x1 - 0.06, cz, 0.12, d]]) level.box([x, 0.55, z], [sx, 1.1, sz], C.dark, { outline: false, collide: false, shadow: false });
  for (let x = x0 + 4; x < x1; x += 5) {
    level.box([x, h - 0.3, cz], [0.35, 0.4, d], C.dark, { shadow: false });
    for (const z of [z0 + 0.2, z1 - 0.2]) level.box([x, h / 2, z], [0.45, h, 0.4], C.dark, { shadow: false });
  }
  // the lane: a strip of darker floor from the mark to the wall, and the mark itself (a ring the shooter stands in)
  // (the lane stands 1.5 cm over the planks, the ring 1 cm over the lane: a plank lies right under the lane, and at 1 mm apart the two
  // fought for the same pixels seen from the door, 15 to 20 m off: the owner, R45)
  level.box([(TR.mark.x + TR.wall.x) / 2, 0.02, TR.mark.z], [TR.wall.x - TR.mark.x, 0.01, 0.9], C.deep, { outline: false, collide: false, shadow: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 24), new THREE.MeshBasicMaterial({ color: C.glow }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(TR.mark.x, 0.035, TR.mark.z); level.scene.add(ring);
  // the spray wall: a slab of soft clay on a timber frame, its face at TR.wall.x; a cross at the aim point (no numbers: docs/LOOK.md)
  const W = TR.wall, wallCol = level.box([W.x + 0.2, 0.3 + WALL.height / 2, W.z], [0.4, WALL.height, WALL.width], C.pale);
  level.box([W.x + 0.3, 0.15, W.z], [0.6, 0.3, WALL.width + 0.4], C.wood);
  for (const s of [-1, 1]) level.box([W.x + 0.3, (WALL.height + 0.6) / 2, W.z + s * (WALL.width / 2 + 0.12)], [0.24, WALL.height + 0.6, 0.24], C.wood);
  level.box([W.x - 0.004, W.y, W.z], [0.01, 0.04, 0.4], C.deep, { outline: false, collide: false, shadow: false });
  level.box([W.x - 0.004, W.y, W.z], [0.01, 0.4, 0.04], C.deep, { outline: false, collide: false, shadow: false });
  // the shelf for the twelve pots that come back, by the door on the north wall
  level.bench(14.4, z1 - 0.7, 6.4, 0.9, 0.9);
  // two lamps (plain PointLights: the light budget lends them a real light when they matter: render/lightbudget.js)
  for (const x of [16, 26]) { const L = new THREE.PointLight(0xffc89a, 14, 16, 1.5); L.position.set(x, h - 0.8, cz); level.scene.add(L); }
  return { wallCol };
}

/** The twelve pots' places: on the shelf and on the floor beside it. */
const POT_SPOTS = (() => {
  const out = [];
  for (let i = 0; i < 6; i++) out.push([11.8 + i * 1.04, 0.902, TR.z1 - 0.7]);
  for (let i = 0; i < 6; i++) out.push([11.6 + i * 1.1, 0.002, TR.z1 - 1.8]);
  return out.slice(0, POTS.count);
})();

export class TestRoom {
  constructor(game, built) {
    this.game = game;
    const g = game;
    // the pots that come back (and only these: breakables.js leaves every other broken pot broken)
    const kinds = ['jar', 'amphora', 'pitcher', 'melon'];
    POT_SPOTS.forEach(([x, y, z], i) => g.breakables?.spawn({ kind: kinds[i % kinds.length], pos: [x, y, z], color: i % 2 ? PALETTE.potLight : PALETTE.pot, respawn: POTS.respawn, training: true, baubles: POTS.baubles }));
    // the spray wall's collider, known for what it is (drills.js reads the dents from the shots that hit it)
    this.wall = { type: 'spraywall' };
    if (built?.wallCol) g.physics.register(built.wallCol, this.wall);
    this.strawman = this.makeStrawman();
    this.drills = new Drills(g, this);
    // F: the console opens the Index on its page; Strawman cycles its mode
    g.interact?.add('testroom.index', (P) => {
      const dd = Math.hypot(P.pos.x - TR.console.x, P.pos.z - TR.console.z);
      return dd < 1.8 && Math.abs(P.pos.y - TR.console.y) < 1.2 ? { pos: TR.console.clone().setY(1.75), d: dd } : null;
    });
    g.interact?.add('strawman', (P) => {
      const S = this.strawman, dd = Math.hypot(P.pos.x - S.pos.x, P.pos.z - S.pos.z) - 0.4;
      return dd < 1.6 && Math.abs(P.pos.y - S.pos.y) < 1.2 ? { pos: S.pos.clone().setY(S.height + 0.25), d: dd } : null;
    });
    this.buildConsole();
  }

  /** Is this point in the room (the drills end when the Courier leaves it)? */
  inRoom(p) { return p.x > TR.x0 && p.x < TR.x1 && p.z > TR.z0 && p.z < TR.z1 && p.y > -1 && p.y < TR.h; }

  /** The Index's console here: a lectern of dark wood with a glowing face (Calissa's to dress). */
  buildConsole() {
    const g = this.game, grp = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.85 });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.05, 0.3), wood); post.position.y = 0.525; grp.add(post);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), wood); top.position.y = 1.08; top.rotation.x = -0.35; grp.add(top);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.36), new THREE.MeshBasicMaterial({ color: PALETTE.glow }));
    face.position.set(0, 1.13, 0.02); face.rotation.x = -Math.PI / 2 - 0.35; grp.add(face); // (lying on the slanted top)
    grp.position.copy(TR.console); grp.rotation.y = Math.PI / 2; // (facing into the room: +x)
    g.scene.add(grp); this.console = grp; // (Calissa dresses it: vfx/testroomkit.js)
    const col = g.physics.world.createCollider(RAPIER.ColliderDesc.cuboid(0.3, 0.55, 0.3).setTranslation(TR.console.x, 0.55, TR.console.z).setCollisionGroups(GROUPS.static));
    this.consoleCol = col;
  }

  // ---------------------------------------------------------------- Strawman: a real creature that never falls
  makeStrawman() {
    const g = this.game, model = new StrawmanModel(), at = TR.strawman;
    model.group.position.copy(at); model.group.rotation.y = 0; // (facing +z: toward the lane and the mark)
    g.scene.add(model.group);
    const height = model.height || 2.45, radius = 0.45, hits = [];
    let clock = 0, lastHit = -1e9, mode = 'still', swingT = 0;
    const S = {
      type: 'creature', kind: 'strawman', name: 'Strawman', training: true,
      pos: at.clone(), radius, height, alive: true, yaw: 0, poise: 1, stunFor: 4, mindRest: 0,
      tags: new Set(['hurtable', 'programmable']),
      model, hits,
      get mode() { return mode; },
      center: (out = new THREE.Vector3()) => out.copy(at).setY(at.y + height * 0.55),
      head: () => at.clone().setY(at.y + height * 0.9),
      knock() {}, vanish() {},
      hurt(point, dir, power, cause, by, from, type) {
        // guard: a blow from in front is blocked (it still counts, at nothing); the sack shows every blow (no numbers: its body)
        const front = dir && -(dir.z) > 0.5; // (it faces +z: a blow travelling -z came from in front of it)
        const dmg = mode === 'guard' && front ? 0 : power;
        hits.push({ at: clock, dmg, type: mode === 'guard' && front ? 'blocked' : type || cause || 'shot' });
        lastHit = clock;
        model.hit?.(point || S.center(), dir || new THREE.Vector3(0, 0, -1), Math.min(2, 0.5 + power));
      },
      onStatus(name) { const h = hits[hits.length - 1]; if (h && clock - h.at < 0.2) h.status = name; else hits.push({ at: clock, dmg: 0, type: 'status', status: name }); lastHit = clock; },
      setMode(m) { mode = m; model.setMode?.(m); swingT = 0; g.events?.emit('strawman.mode', { mode: m }); },
      /** Once a frame, in real seconds: the bout's end said, the swing's slow sweep (harmless: STRAWMAN.swing.harm). */
      tick(raw) {
        clock += raw;
        model.update?.(raw);
        if (hits.length && clock - lastHit > STRAWMAN.boutGap) { const b = bout(hits); hits.length = 0; if (b) { this.last = b; g.events?.emit('strawman.bout', b); } }
        if (mode === 'swing' && (swingT += raw) > STRAWMAN.swing.every) { swingT = 0; model.swing?.(() => {}); }
      },
      last: null,
    };
    const col = g.physics.world.createCollider(RAPIER.ColliderDesc.capsule(height * 0.32, radius).setTranslation(at.x, height * 0.5, at.z).setCollisionGroups(GROUPS.static));
    g.physics.register(col, S);
    g.creatures?.add(S);
    return S;
  }

  update(dt, raw = dt) {
    const g = this.game, P = g.player;
    this.strawman.tick(raw);
    if (g.interact?.cur?.id === 'strawman' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      const M = STRAWMAN.modes, S = this.strawman;
      S.setMode(M[(M.indexOf(S.mode) + 1) % M.length]);
    }
    if (g.interact?.cur?.id === 'testroom.index' && P.peekLatch?.('KeyF')) { P.latch('KeyF'); g.course?.menu?.showPage?.('the Throwing Room', (im, el) => this.drills.page(im, el)); }
    this.drills.update(dt, raw);
  }
}
