// ---------------------------------------------------------------------------------------
// THE RARE FINDS ON THE GROUND (docs/plans/AREAS.md 5; the rules Dovina's, progress/areas.js RARE_FINDS; FFXII's rare game): an area's
// condition-bound find, met only under its condition and counted once (`area.rare { area, find, by }`, the ledger's `area.<area>.rare`).
// THE RUINS' (built): an aberrant Lantern Wisp met at night (a duel opened with one in the ruins: its going wrong is world/duel/duelfoes.js).
// THE CRYSTAL RIDGES' FULGURITE: in Fury's weather at strength
// `when.k` or more, a bolt that comes down in the ridges leaves a fulgurite glowing for `hot` real s where it struck; struck with the
// Dreamvane's pick while it glows, it is dug out whole, the curio `give.curio` (its tier `give.tier`): Fury teaches what lightning does to
// sand. The glass on the sand is Calissa's look (vfx/dunes/fulgurites.js lays one at every strike), and its glow while it can be dug hers
// too (vfx/dunes/hotfulgurite.js reads `.hot`; dug, on `area.rare`).
//
// Prior art: Final Fantasy XII's rare game (a monster met only under its condition), real fulgurites dug out of desert sand after a storm,
// Minecraft's lightning-struck sand; the house's struckable things (tools/melee.js `registered('struckable')`: a crystal is one).
//
//   game.rareFinds = new RareFinds(game)   (boot/world.js)   .update(raw) (boot/frame.js)   .hot (the fulgurite glowing now, or null)
//   (a second fulgurite, past what the Pneuka Box may hold, condenses into cubes: the chest's way, world/treasure/ceremony.js)
//   events rare.hot { area, find, at, by: 'environment' }, area.rare { area, find, by }, curio.get { id, tier, dupe, from: 'dug' }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RARE_FINDS, areaAt } from '../../progress/areas.js';
import { phaseAt } from '../../progress/weather.js';
import { ECON } from '../../progress/econ/table.js';
import { tag, register, unregister } from '../../core/tags.js';
import { CURIO_BY_ID, CURIO_LIMIT } from '../treasure/treasure.js';
import { DUNE } from './dunes.js';

export class RareFinds {
  constructor(game) {
    this.game = game; this.hot = null; this.seen = -1;
    game.events?.on?.('duel.open', (e) => { // (the ruins' find: an aberrant Lantern Wisp, at night, in the ruins)
      const P = game.player; if (e.kind !== 'wisp' || phaseAt() !== RARE_FINDS.ruins.when.phase || !P) return;
      if (areaAt(P.pos.x - DUNE.x, P.pos.z - DUNE.z) === 'ruins' && game.dunes?.active) game.events.emit('area.rare', { area: 'ruins', find: RARE_FINDS.ruins.find, by: 'courier' });
    });
  }

  update(raw) {
    const g = this.game, R = RARE_FINDS.ridges, D = g.dunes;
    if (this.hot && (this.hot.left -= raw) <= 0) this.cool();
    const S = g.weatherLook?.strike; if (!S || S.n === this.seen) return;
    const fresh = this.seen >= 0; this.seen = S.n;
    if (!fresh || !D?.active || this.hot) return;
    const b = g.weatherLook.bolts?.[S.n % g.weatherLook.bolts.length]; if (!b) return;
    const x = b.mesh.position.x, z = b.mesh.position.z;
    if (areaAt(x - DUNE.x, z - DUNE.z) !== 'ridges') return;
    const at = new THREE.Vector3(x, D.heightAt(x, z), z), w = g.weather?.here?.(at);
    if (w?.aspect !== R.when.aspect || (w.strength || 0) < R.when.k) return;
    this.lay(at);
  }

  /** A fulgurite glowing where the bolt came down, struckable until it cools. */
  lay(at) {
    const g = this.game, R = RARE_FINDS.ridges;
    const ent = tag({ type: 'fulgurite', kind: 'fulgurite', pos: at.clone().setY(at.y + 0.3), r: 0.8, struck: (p, dir, power, by, tool) => this.dig(ent, by, tool) }, 'struckable');
    register(ent);
    this.hot = { ent, at: at.clone(), left: R.hot };
    g.events?.emit('rare.hot', { area: 'ridges', find: 'fulgurite', at: [+at.x.toFixed(1), +at.y.toFixed(1), +at.z.toFixed(1)], by: 'environment' });
  }

  /** Struck with the Dreamvane's pick while it glows: dug out whole. */
  dig(ent, by, tool) {
    const g = this.game, R = RARE_FINDS.ridges, H = this.hot;
    if (!H || H.ent !== ent || by !== 'courier' || tool !== 'dreamvane') return;
    this.cool();
    const id = R.give.curio, c = CURIO_BY_ID[id], box = g.pneuka, lim = CURIO_LIMIT[c?.tier ?? R.give.tier] ?? 1;
    const dupe = !!c && (box ? box.held(`curio.${id}`) >= lim : (g.ledger?.get?.(`curio.${id}`) || 0) > 0);
    if (c && !dupe) { g.ledger?.inc?.(`curio.${id}`); box?.add?.(`curio.${id}`, 'dug'); }
    if (c) g.events?.emit('curio.get', { id, tier: c.tier, dupe, from: 'dug' });
    if (c && dupe) g.cubes?.burst?.(H.at.clone().setY(H.at.y + 0.5), ECON.curio?.[c.tier] || 0, { count: 8, up: 4, from: 'curio' }); // (condensed, as a chest's would be)
    g.events?.emit('area.rare', { area: 'ridges', find: 'fulgurite', by: 'courier' });
  }

  cool() { if (!this.hot) return; unregister(this.hot.ent); this.hot = null; }
}
