// ---------------------------------------------------------------------------------------
// THE DEBUG CHESTS (docs/plans/DEBUG-CHESTS.md; the owner, 2026-10-08): a crate in the missing-texture checker (Calissa's look,
// vfx/debugchest.js) beside each feature sent for a test session, holding what its QAIS tests need (debug/kits.js, DEBUG_KITS). F tops
// each item up to its kit's count and the cubes up to its balance, never past, so a second F refills what the test spent; nothing it
// gives is counted (items `from: 'debug'`, cubes earned as 'debug': tracking.js and the cubes skip both). It says itself once in the
// log (`debug.chest`, a tracking rule); its place is `debug.<kit>` (/goto debug.press); the Index lists every one under DEBUG. A kit's chest comes out at the publish
// after its tests pass (Petra deletes the row).
// Two stand in the Spirit Garden (the press's and the shed's): there they are the realm's features (F through realm.use), and their
// places set the Pneuka Jar down beside them once you are inside.
//
// Prior art: the debug crates of studio test builds (Bethesda's QASmoke chest, Nintendo's debug rooms) and the Source engine's
// missing-texture checker as the mark of "this is not the game".
//
//   game.debugChests = new DebugChests(game)   .update()   .give(kit) -> what it gave   .go(kit)   .list [{ kit, pos, look }]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEBUG_KITS } from './kits.js';
import { debugChestModel } from '../vfx/debugchest.js';
import { makeMaterial } from '../progress/econ/materials.js';
import { itemOf } from '../pneuka/items.js';
import { MATS } from '../world/busk.js';
import { TR } from '../world/testroom/layout.js';
import { zoneOf } from '../render/zonemap.js';

/** Calissa's crate, casting no shadow (a debug crate is not the world's: and no depth program compiled in play for it). */
const crate = () => { const C = debugChestModel(); C.group.traverse((o) => { o.castShadow = false; }); return C; };

const REACH = 2.0, GARDEN = new Set(['athanor', 'shed']);
const _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

export class DebugChests {
  constructor(game) {
    this.game = game; this.list = []; this.said = new Set(); this.gardenDone = false;
    game.interact?.add('debug.chest', (P) => {
      if (game.dialogue?.open || game.god?.controlling || game.realm?.active) return null;
      let best = null;
      for (const c of this.list) { if (c.garden) continue; const d = Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z); if (d < REACH && Math.abs(c.pos.y - P.pos.y) < 1.8 && (!best || d < best.d)) best = { pos: c.pos.clone().setY(c.pos.y + 1.1), d, ref: c.kit }; }
      return best;
    });
    for (const kit of Object.keys(DEBUG_KITS)) { // (a garden chest's place goes by go(): travel() would set the Courier down in the garden's zone outside it)
      game.places?.add(`debug.${kit}`, { name: `the debug chest: ${kit}`, at: () => this.get(kit)?.pos.clone() ?? null, near: 1.4, note: `F: ${DEBUG_KITS[kit].for}`, via: GARDEN.has(DEBUG_KITS[kit].at) ? () => this.go(kit) : null });
    }
    // the Index: a DEBUG heading under the rooms (world/basement/basement.js goRoom sends 'debug' here)
    const rooms = game.course?.rooms;
    const order = Object.keys(DEBUG_KITS).sort((a, b) => GARDEN.has(DEBUG_KITS[a].at) - GARDEN.has(DEBUG_KITS[b].at)); // (the garden's last: they go in at a Shrine)
    if (rooms) order.forEach((kit, i) => rooms.push({ id: `debug.${kit}`, code: i < 8 ? `Digit${i + 2}` : undefined, tag: i < 8 ? String(i + 2) : 'DBG', name: `DEBUG CHEST: ${kit.toUpperCase()}`, blurb: DEBUG_KITS[kit].for, group: 'DEBUG', spawn: 'debug', kit }));
  }

  get(kit) { return this.list.find((c) => c.kit === kit) || null; }
  /** One crate parked under the world for the boot's warm-up, so its program is compiled with the rest (kept: casebook rules 17, 18). */
  parked() {
    if (!this.park) { this.park = crate(); this.park.group.position.set(0, -50, 0); this.park.group.userData.zoneFree = true; this.game.scene.add(this.park.group); }
    return [this.park.group];
  }

  /** Once a frame: each chest stands once its spot does; F at a world chest tops it up. */
  update(dt = 1 / 60) {
    const g = this.game;
    for (const [kit, K] of Object.entries(DEBUG_KITS)) if (!this.get(kit) && !GARDEN.has(K.at)) this.stand(kit, K);
    if (!this.gardenDone && g.realm?.site && g.realm?.press?.frame) this.garden();
    if (this.pending && g.realm?.active && g.realm.jarBody && !g.realm.entering) { const k = this.pending; this.pending = null; this.go(k); } // (gone in for a garden chest: set down by it)
    const it = g.interact?.cur, P = g.player;
    if (it?.id === 'debug.chest' && P?.peekLatch?.('KeyF')) { P.latch('KeyF'); this.give(it.ref); }
    for (const c of this.list) c.look.update(dt);
  }

  /** Where a world kit's chest stands: { pos, face } (null while its place is not built). */
  spot(at) {
    const g = this.game, sand = (x, z, y) => (g.dunes?.heightAt ? g.dunes.heightAt(x, z) : y);
    switch (at) {
      case 'sealed': { const R = g.ostraca?.room; if (!R) return null; const p = R.position, x = p.x + 2.6, z = p.z + 4.2; return { pos: new THREE.Vector3(x, sand(x, z, p.y), z), face: p.clone().setZ(p.z + 4.2) }; } // (outside its door, a step aside)
      case 'busk.weir': { const m = MATS.find((x) => x.id === 'weir')?.at(g); if (!m) return null; return { pos: m.pos.clone().setZ(m.pos.z - 1.8), face: m.pos.clone() }; }
      case 'well.mouth': { const M = g.well?.mouthPos; if (!M) return null; const x = M.x + 3.4, z = M.z + 1.4; return { pos: new THREE.Vector3(x, sand(x, z, M.y), z), face: M.clone() }; }
      case 'testroom.index': return g.testroom ? { pos: new THREE.Vector3(TR.console.x, 0, TR.console.z - 1.7), face: TR.console.clone() } : null;
      default: return null;
    }
  }

  stand(kit, K) {
    const s = this.spot(K.at); if (!s) return null;
    const look = crate(); look.group.name = `debug-chest-${kit}`;
    look.group.position.copy(s.pos); look.group.rotation.y = Math.atan2(s.face.x - s.pos.x, s.face.z - s.pos.z);
    look.group.userData.zone = zoneOf(s.pos) ?? undefined;
    this.game.scene.add(look.group);
    const c = { kit, pos: s.pos.clone(), look, garden: false }; this.list.push(c); return c;
  }

  /** The garden's two: beside the press's ware ring (west of the bath) and the Dantian's shed, as realm features. */
  garden() {
    const R = this.game.realm, F = R.press.frame, site = R.site; this.gardenDone = true;
    const shed = site.features.find((f) => f.kind === 'shed');
    const put = (kit, planet, near, face) => {
      const dir = near.clone().sub(planet.c).normalize(), pos = planet.c.clone().addScaledVector(dir, planet.radiusAt ? planet.radiusAt(dir) : planet.r);
      const look = crate(); look.group.name = `debug-chest-${kit}`;
      const fwd = face.clone().sub(pos).projectOnPlane(dir).normalize(), side = new THREE.Vector3().crossVectors(dir, fwd);
      look.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, dir, fwd)); look.group.position.copy(pos);
      site.group.add(look.group);
      const c = { kit, pos, look, garden: true, planet }; this.list.push(c);
      site.features.push({ kind: 'debugChest', kit, planet, pos, mesh: look.group });
    };
    if (DEBUG_KITS.press) put('press', F.planet, F.O.clone().addScaledVector(F.E, -(F.R + 2.2)), F.O);
    if (DEBUG_KITS.garden && shed) { const up = shed.pos.clone().sub(shed.planet.c).normalize(), t = _v.set(1, 0, 0).projectOnPlane(up).normalize(); put('garden', shed.planet, shed.pos.clone().addScaledVector(t, 3), shed.pos); }
  }

  /** F at a chest: every item topped up to its count, the cubes to the kit's balance; said once, then what it gave in one line. */
  give(kit) {
    const g = this.game, K = DEBUG_KITS[kit], box = g.pneuka; if (!K || !box) return null;
    const c = this.get(kit); c?.look.bump();
    const first = !this.said.has(kit); this.said.add(kit);
    const gave = [];
    for (const [id, count, data] of K.items || []) {
      const it = itemOf(id); if (!it) continue;
      let have;
      if (it.kind === 'tool') have = g.belt?.isWorn(it.tool) || box.held(id) ? count : 0;
      else if (data?.tier != null) have = box.slots.filter((s) => s?.id === id && s.data?.tier === data.tier).length;
      else have = box.held(id);
      for (let n = have; n < count; n++) {
        const d = data?.tier != null ? makeMaterial(id.slice(4), 101 + n, data.tier) : null;
        if (box.add(id, 'debug', 0, d) < 0) break; // (a full box: it stops, the rest at the feet as box.add does)
        gave.push(it.name || id);
      }
    }
    const short = Math.max(0, (K.cubes || 0) - (g.cubes?.balance ?? 0));
    const what = [...new Set(gave)].map((x) => `${x} x${gave.filter((y) => y === x).length}`);
    if (short > 0) { g.cubes?.earn(short, 'debug'); gave.push('cubes'); what.push(`${short} cubes`); }
    g.events?.emit('debug.chest', { kit, first, n: gave.length, what, by: 'courier' }); // (said by tracking.js; never counted)
    return gave;
  }

  /** The Index's DEBUG row, or /goto: to the chest (in the garden, the Pneuka Jar set down beside it once you are inside). */
  go(kit) {
    const g = this.game, K = DEBUG_KITS[kit]; if (!K) return false;
    if (GARDEN.has(K.at)) {
      const c = this.get(kit);
      if (!g.realm?.active || !c) { // (in at the last Shrine rested at, then set down beside it: update())
        if (g.realm?.active || !g.realm?.enter(g.shrines?.get?.(g.shrines.last) || null)) return false;
        this.pending = kit; return true;
      }
      const up = c.pos.clone().sub(c.planet.c).normalize(), t = _v.set(0, 0, 1).projectOnPlane(up).normalize();
      if (t.lengthSq() < 1e-4) t.copy(_up).projectOnPlane(up).normalize();
      g.realm.jarBody.pos.copy(c.pos).addScaledVector(t, 1.6).addScaledVector(up, 0.6); g.realm.jarBody.vel?.set(0, 0, 0);
      return true;
    }
    return !!g.places?.travel(`debug.${kit}`);
  }
}
