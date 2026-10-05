// ---------------------------------------------------------------------------------------
// THE GROUND: things lying where they were dropped, or where they fell when the Pneuka Box had no room. Each is its own model (the
// curio itself, at the size it is held), turning slowly a hand above the floor with a soft halo under it, so it is seen from across a
// room; the chevron marks the nearest within reach and F picks it up into the box. They are kept with the box, so a thing left on the
// floor is still there next time.
//
// Prior art: Old School RuneScape's ground items (a full inventory drops the loot at your feet; you pick it up when you have room),
// and the turning pickups of Zelda and Kingdom Hearts that say "this is a thing" without a word.
//
//   const gi = new GroundItems(game)   gi.drop(id, pos, { uses, data })   gi.update(dt)   gi.nearest(P) -> { pos, d, ref } | null   gi.pick(ref)   gi.count(id)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { buildCurio } from '../world/treasure/curiomodel.js';
import { itemOf } from './items.js';
import { sfx } from '../audio/sfx.js';
import { stream } from '../core/rng.js';
const simRand = stream('pneuka/ground'); // (where a dropped thing lands: the simulation's chance, core/rng.js)

const REACH = 1.6, SCALE = 0.62;

export class GroundItems {
  constructor(game) {
    this.game = game;
    this.list = []; // { id, pos, model, halo, t }
    this.loaded = false; this.kept = [];
    // what lies on the ground belongs to the world (core/save.js); laid out on the first update, when the models can be built
    game.save?.section('ground', {
      scope: 'world', version: 1,
      dump: () => this.list.map((e) => ({ id: e.id, p: [+e.pos.x.toFixed(2), +e.pos.y.toFixed(2), +e.pos.z.toFixed(2)], ...(e.uses ? { uses: e.uses } : {}), ...(e.data ? { data: e.data } : {}) })),
      load: (d) => { this.kept = Array.isArray(d) ? d : []; if (this.loaded) { this.clear(); this.loaded = false; } }, // (again, after a borrow: laid out anew)
      reset: () => { this.kept = []; if (this.loaded) this.clear(); },
    });
  }
  count(id) { return this.list.filter((g) => g.id === id).length; }

  drop(id, pos, { save = true, scatter = true, uses = 0, data = null } = {}) {
    const it = itemOf(id), g = this.game;
    if (!it) return null;
    // (a little scatter, so a pile is a pile)
    const p = scatter ? pos.clone().add(new THREE.Vector3((simRand() - 0.5) * 0.5, 0, (simRand() - 0.5) * 0.5)) : pos.clone();
    const e = { id, pos: p, t: simRand() * 6, model: null, halo: null, uses, data }; // (uses: a Possibilikey's; data: a Cogitomap's, a material's: kept)
    if (it.kind === 'curio') { e.model = buildCurio(it.key, { sky: g.sky?.env }); e.model.group.scale.setScalar(SCALE); g.scene.add(e.model.group); }
    e.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx?.haloTexture, color: it.color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5 }));
    e.halo.scale.setScalar(0.7); e.halo.renderOrder = 6; g.scene.add(e.halo);
    this.list.push(e);
    if (save) this.save();
    return e;
  }

  update(dt) {
    if (!this.loaded) { this.loaded = true; this.load(); }
    for (const e of this.list) {
      e.t += dt;
      const y = e.pos.y + 0.28 + Math.sin(e.t * 1.6) * 0.04;
      if (e.model) { e.model.group.position.set(e.pos.x, y, e.pos.z); e.model.group.rotation.y = e.t * 0.8; e.model.update?.(e.t, dt); }
      e.halo.position.set(e.pos.x, e.pos.y + 0.1, e.pos.z);
    }
    // F picks up what the chevron is on
    const P = this.game.player, cur = this.game.interact?.cur;
    if (cur?.id === 'item' && P.peekLatch?.('KeyF') && !this.game.god?.controlling) { P.latch('KeyF'); this.pick(cur.ref); }
  }

  /** The nearest thing within reach (the interact source). */
  nearest(P) {
    let best = null, bd = REACH;
    for (const e of this.list) { const d = e.pos.distanceTo(P.pos); if (d < bd && Math.abs(e.pos.y - P.pos.y) < 1.2) { bd = d; best = e; } }
    return best ? { pos: best.pos.clone().setY(best.pos.y + 0.75), d: bd, ref: best } : null;
  }

  pick(e) {
    const box = this.game.pneuka, i = this.list.indexOf(e);
    if (!box || i < 0) return false;
    if (!box.room(e.id, e.uses, e.data)) { box.refuse('Your Pneuka Box is full.', 'boxfull'); return false; }
    this.remove(i);
    box.add(e.id, 'ground', e.uses, e.data);
    sfx.cubeGet?.(6);
    return true;
  }
  remove(i) {
    const e = this.list[i];
    e.model?.dispose(); this.game.scene.remove(e.halo); e.halo.material.dispose();
    this.list.splice(i, 1);
    this.save();
  }

  save() { this.game.save?.dirty('ground'); }
  load() {
    for (const s of this.kept) if (itemOf(s.id) && Array.isArray(s.p)) this.drop(s.id, new THREE.Vector3(...s.p), { save: false, scatter: false, uses: s.uses | 0, data: s.data || null });
  }
  clear() { while (this.list.length) this.remove(0); }
}
