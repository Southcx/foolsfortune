// ---------------------------------------------------------------------------------------
// SHRINES: where the Courier is made whole, rests, travels, and goes into the Spirit Garden (the owner, 2026-10-06; docs/plans/SHRINES.md,
// Dovina's). F at a Shrine finds it (once), rests there (the pool full, the mind settled to Balanced) and opens its page: travel to any
// Shrine found, free, and the Spirit Garden's door (the garden's page: its slots, its beds). A shatter makes you whole at the last Shrine
// rested at (courier/vessel/death.js asks `reformAt`). None in the Wells: a Well is a run, and its risk is losing it.
// It is NOT a save point: the game keeps everything the moment it happens (core/save.js), and the log never says "saved".
//
// Prior art: Hollow Knight's benches (rest, and come back here), Dark Souls' bonfires (travel between the ones lit; their world reset
// is not taken: the world here turns by the game day), Okami's origin mirrors (travel is a convenience, never a cost), and Resident
// Evil's save rooms (the item box beside the typewriter: the Pneuka Box is the garden's shed, reachable anywhere on P).
//
//   game.shrines = new Shrines(game)   .update(dt)   .list (SHRINES with their places)   .found (Set of ids)   .last (id)
//   .near(pos) -> shrine within reach | null   .rest(id)   .travel(id)   .reformAt() -> { pos, yaw }   .garden()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { ShrineModel } from '../vfx/shrine.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { GROUPS } from '../core/physics.js';
import { WEIR_SPAWN } from '../tools/sondelass/angling/weir.js';

const REACH = 2.2; // (metres from the stone: F reaches it)
const _o = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
/** The static ground under (x, z) near height y. */
const ground = (g, x, y, z) => g.physics?.raycast(_o.set(x, y + 1.5, z), _down, 5, undefined, undefined, (c) => !c.parent() || c.parent().isFixed())?.point.y ?? y;

/** The Shrines (Espada's names: docs/GLOSSARY.md). `at(game)`: where the stone stands and which way it faces, or null while its place
 *  is not built (Margarite's dock waits on the slice's dock). The first is found from the start. */
export const SHRINES = [
  { id: 'workshop', name: 'the Bisque Shrine', start: true, ground: 'clay_floor', at: (g) => { const s = g.player.spawn, x = s.x + 2.2, z = s.z - 1.5; return { pos: new THREE.Vector3(x, ground(g, x, s.y, z), z), yaw: 0 }; } },
  { id: 'dunemaw', name: 'the Lamp Shrine', at: (g) => { const s = g.well?.mouthSpot?.(); if (!s) return null; const a = s.yaw + Math.PI / 2, x = s.pos.x + Math.sin(a) * 3, z = s.pos.z + Math.cos(a) * 3; return { pos: new THREE.Vector3(x, g.dunes.heightAt(x, z), z), yaw: s.yaw }; } },
  { id: 'pier', name: 'the Float Shrine', ground: 'stone_flags', at: (g) => { const [x, y, z] = WEIR_SPAWN.pos; return { pos: new THREE.Vector3(x + 6.5, ground(g, x + 6.5, y, z + 1), z + 1), yaw: -Math.PI / 2 }; } }, // (beside Old Grog: npc/people.js)
  { id: 'margarite', name: 'the Pearl Shrine', at: (g) => g.margarite?.spot('shrine') ?? null }, // (Margarite's dock: world/emocean/margarite.js)
];

export class Shrines {
  constructor(game) {
    this.game = game;
    this.found = new Set(SHRINES.filter((s) => s.start).map((s) => s.id)); this.last = 'workshop';
    this.list = []; this.built = false;
    game.save?.section('shrines', {
      scope: 'player', version: 1,
      dump: () => ({ found: [...this.found], last: this.last }),
      load: (d) => { this.found = new Set([...SHRINES.filter((s) => s.start).map((s) => s.id), ...(d.found || []).filter((id) => SHRINES.some((s) => s.id === id))]); this.last = this.found.has(d.last) ? d.last : 'workshop'; },
      reset: () => { this.found = new Set(SHRINES.filter((s) => s.start).map((s) => s.id)); this.last = 'workshop'; },
    });
    game.interact?.add('shrine', () => {
      if (game.dialogue?.open || this.menu?.open || game.god?.controlling) return null;
      const s = this.near(game.player.pos); if (!s) return null;
      return { pos: s.pos.clone().setY(s.pos.y + 1.6), d: Math.hypot(s.pos.x - game.player.pos.x, s.pos.z - game.player.pos.z), ref: s.id };
    });
  }

  /** The Shrines, placed once their places stand (the Dunes and the shore are built after the workshop): Calissa's cradle for the jar
   *  (vfx/shrine.js), its front toward +z, on the ground its place is made of. */
  build() {
    const g = this.game;
    for (const S of SHRINES) {
      const at = S.at(g); if (!at) continue;
      const model = new ShrineModel({ ground: S.ground || 'sand' });
      model.group.position.copy(at.pos); model.group.rotation.y = at.yaw;
      g.scene.add(model.group);
      // (the arch's two pillars are solid: its opening is the garden's door, seen, not walked through: vfx/shrine.js W 1.5, H 2.3, T 0.38)
      const W = g.physics?.world, body = W?.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      if (body) for (const sx of [-1, 1]) {
        const x = at.pos.x + Math.cos(at.yaw) * sx * 0.94, z = at.pos.z - Math.sin(at.yaw) * sx * 0.94;
        W.createCollider(RAPIER.ColliderDesc.cuboid(0.19, 1.15, 0.19).setTranslation(x, at.pos.y + 1.15, z).setCollisionGroups(GROUPS.static), body);
      }
      this.list.push({ ...S, pos: at.pos.clone(), yaw: at.yaw, model });
    }
    this.built = true;
  }

  get menu() { return this.game.indexMenu; } // (the index's window: feedback/indexmenu.js, made with the basement)

  near(pos) {
    let best = null, bd = REACH;
    for (const s of this.list) { const d = Math.hypot(s.pos.x - pos.x, s.pos.z - pos.z); if (d < bd && Math.abs(s.pos.y - pos.y) < 2) { bd = d; best = s; } }
    return best;
  }
  get(id) { return this.list.find((s) => s.id === id) || null; }

  /** Once a frame: F at a Shrine finds it, rests there and opens its page. */
  update() {
    const g = this.game, P = g.player;
    if (!this.built && g.dunes?.beach && g.well) this.build();
    const open = this.menu?.open && this.page;
    for (const s of this.list) { s.model.set({ found: this.found.has(s.id), resting: this.last === s.id && s.model.group.position.distanceTo(P.pos) < 3, open: open === s.id || open === `garden.${s.id}` }); s.model.update(g.rawDt ?? 1 / 60); }
    const it = g.interact?.cur;
    if (it?.id !== 'shrine' || !P.peekLatch?.('KeyF') || g.god?.controlling) return;
    P.latch('KeyF');
    const s = this.get(it.ref); if (!s) return;
    if (!this.found.has(s.id)) { this.found.add(s.id); g.events?.emit('shrine.find', { shrine: s.id, by: 'courier' }); }
    this.rest(s.id);
    this.open(s);
  }

  /** A rest: the pool full, the mind settled; this Shrine is where a shatter makes them whole. Nothing else (the world is not reset). */
  rest(id) {
    const g = this.game;
    g.lachryma?.reset?.(); // (the spec's "mind settled to Balanced" waits on the Courier having a mental state: only creatures do yet)
    this.last = id; g.save?.dirty('shrines');
    sfx.rest?.(); // (a placeholder: Wanda's)
    g.events?.emit('shrine.rest', { shrine: id, by: 'courier' });
  }

  /** Free travel to a Shrine found, set down before its stone. */
  travel(id) {
    const g = this.game, s = this.get(id), from = this.last;
    if (!s || !this.found.has(id)) return false;
    const go = () => { const f = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)); const to = s.pos.clone().addScaledVector(f, 1.4).setY(s.pos.y + 0.05); if (!g.places?.stand(to, s.yaw + Math.PI)) g.course.teleport(to, s.yaw + Math.PI); }; // (into its zone first: world/places.js)
    this.menu?.close();
    if (g.seam) g.seam.cross(go, { kind: 'shrine' }); else go(); // (under a cover: render/seam.js)
    this.last = id; g.save?.dirty('shrines');
    g.events?.emit('shrine.travel', { from, to: id, by: 'courier' });
    return true;
  }

  /** Where a shatter makes them whole: before the last Shrine rested at (the workshop's until another). */
  reformAt() {
    const s = this.get(this.last) || this.get('workshop'); if (!s) return null;
    const f = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw));
    return { pos: s.pos.clone().addScaledVector(f, 1.4).setY(s.pos.y + 0.05), yaw: s.yaw + Math.PI };
  }

  // ---------------------------------------------------------------- the Shrine's page (the index menu's window: feedback/indexmenu.js)
  open(s) {
    const g = this.game;
    this.page = s.id;
    this.menu?.showPage(s.id, (im, el) => {
      const box = el('div', 'rooms');
      const btn = (title, sub, run) => { const d = el('div', 'room', `<span class="n">◇</span><span><b>${title}</b><s>${sub}</s></span>`); d.onclick = run; box.appendChild(d); };
      btn('The Spirit Garden', 'go in, as your Pneuka Jar', () => this.garden(s));
      for (const t of this.list) if (t.id !== s.id && this.found.has(t.id)) btn(t.name, 'travel there', () => this.travel(t.id));
      const unfound = SHRINES.filter((t) => !this.found.has(t.id)).length;
      for (const e of [el('div', 'grp', 'YOU REST HERE'), box, el('div', 'grp', unfound ? `${unfound} NOT YET FOUND` : 'EVERY SHRINE FOUND')]) im.appendChild(e);
    }, { title: s.name.toUpperCase(), sub: 'click to choose · F closes' });
  }

  /** The Spirit Garden, entered at a Shrine and nowhere else (progress/garden.js: its slots and beds; the look is Calissa's to come). */
  garden(s) {
    const g = this.game, G = g.garden;
    if (g.realm) { this.menu?.close(); g.realm.enter(s); return; } // (the garden as a place: world/garden/realm.js; the page below is its stand-in where there is none)
    g.events?.emit('garden.enter', { shrine: s.id, by: 'courier' });
    this.page = `garden.${s.id}`;
    this.menu?.showPage('garden', (im, el) => {
      const out = [];
      const rows = el('div', 'rooms');
      const btn = (title, sub, run) => { const d = el('div', 'room', `<span class="n">❀</span><span><b>${title}</b><s>${sub}</s></span>`); if (run) d.onclick = () => { run(); this.garden(s); }; rows.appendChild(d); };
      (G?.slots || []).forEach((sl, i) => btn(`Slot ${i + 1}`, sl?.enc ? `${sl.enc}: ${G.accrued(i)} cubes waiting` : 'empty', sl?.enc && G.accrued(i) > 0 ? () => G.collect(i) : null));
      (G?.beds || []).forEach((b, i) => btn(`Bed ${i + 1}`, b ? (G.ripe(i) ? `${b.kind}: ripe` : `${b.kind}: growing`) : 'empty: plant a material from the box', b && G.ripe(i) ? () => G.harvest(i) : !b ? () => { const k = g.pneuka?.slots.findIndex((x) => x?.id?.startsWith('mat.') && x.id !== 'mat.shard'); if (k >= 0) G.plant(i, k); } : null));
      out.push(el('div', 'grp', 'THE GARDEN'), rows);
      const back = el('div', 'room', '<span class="n">◇</span><span><b>Back to the Shrine</b></span>'); back.onclick = () => this.open(s);
      out.push(back);
      for (const e of out) im.appendChild(e);
    }, { title: 'THE SPIRIT GARDEN', sub: 'entered at a Shrine · F closes' });
  }
}
