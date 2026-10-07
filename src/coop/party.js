// ---------------------------------------------------------------------------------------
// THE PARTY: the siblings called into your world (docs/plans/COOP.md C6; the glossary: sibling, the party). Five, one for each division,
// each fired in a placeholder glaze of its suit's colour until Calissa gives them their look: Petra (pentacles), Dovina (the trumps), Wanda (wands),
// Calissa (cups), Espada (swords). Called, a sibling's rig is made then (a copy of the Courier's model, parsed on demand: nothing is
// spent at boot) and it is set down in its slot behind you; it follows (`coop/follow.js`) or holds where it stands. Who may be called
// and when, what they may do, and what the divisions' sessions may tell them are Dovina's rulings to come (COOP.md); until then the
// party is called from the chat line (`/party`), and a sibling only moves.
// Events (each with `by`): party.call { sibling }, party.dismiss { sibling }, party.order { order }.
//
// Prior art: Kingdom Hearts' party (a slot each, warping back when left behind), Dragon Quest's wagon (the party called from a list).
//
//   game.party = new Party(game, { makeRig })   .call(id | 'all')   .dismiss(id | 'all')   .command(order)   .fixed(dt)   .update(dt, alpha)
//   .list [Sibling]   SIBLINGS [{ id, suit, color, glaze }]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../core/physics.js';
import { Sibling } from './sibling.js';

export const SIBLINGS = [
  { id: 'petra', suit: 'pentacles', color: 0xd4a83a, glaze: 'ash' },
  { id: 'dovina', suit: 'trumps', color: 0x9a6ae0, glaze: 'yohen' },
  { id: 'wanda', suit: 'wands', color: 0xe8603a, glaze: 'oxblood' },
  { id: 'calissa', suit: 'cups', color: 0x4a8ae0, glaze: 'ru' },
  { id: 'espada', suit: 'swords', color: 0xb8c8dc, glaze: 'guan' },
];
const ORDERS = ['follow', 'hold'];
const _o = new THREE.Vector3(), _n = new THREE.Vector3();

export class Party {
  constructor(game, { makeRig }) {
    this.game = game; this.makeRig = makeRig; this.list = []; this.coming = new Set();
    game.chat?.add('party', {
      help: 'call your siblings: /party call <name | all>, /party dismiss <name | all>, /party follow, /party hold',
      run: (args) => {
        const [what, who = 'all'] = args;
        if (what === 'call') this.call(who); else if (what === 'dismiss') this.dismiss(who); else if (ORDERS.includes(what)) this.command(what);
        else game.events.emit('party.list', { siblings: this.list.map((s) => s.id), by: 'courier' });
      },
    });
  }

  get(id) { return this.list.find((s) => s.id === id); }

  /** Call a sibling (or all five) into your world, set down behind you. */
  async call(id = 'all') {
    const ids = id === 'all' ? SIBLINGS.map((s) => s.id) : [id];
    for (const sid of ids) {
      const def = SIBLINGS.find((s) => s.id === sid);
      if (!def || this.get(sid) || this.coming.has(sid)) continue;
      this.coming.add(sid);
      const rig = await this.makeRig();
      this.coming.delete(sid);
      if (this.get(sid)) { rig.root.parent?.remove(rig.root); continue; }
      const S = new Sibling(this.game, { id: sid, color: def.color, glaze: def.glaze, rig });
      this.list.push(S); this.reslot();
      S.warp(this.game.player);
      this.game.events.emit('party.call', { sibling: sid, by: 'courier' });
    }
  }

  dismiss(id = 'all') {
    for (const S of [...this.list]) {
      if (id !== 'all' && S.id !== id) continue;
      S.dispose(); this.list.splice(this.list.indexOf(S), 1);
      this.game.events.emit('party.dismiss', { sibling: S.id, by: 'courier' });
    }
    this.reslot();
  }

  /** follow | hold: what you tell them all. */
  command(order) {
    if (!ORDERS.includes(order)) return;
    for (const S of this.list) S.order = order;
    this.game.events.emit('party.order', { order, by: 'courier' });
  }

  reslot() { this.list.forEach((S, i) => S.setSlot(i, this.list.length)); }

  /** What is in the way ahead of a sibling (the steering's whisker): the wall's normal, or null. */
  probe = (pos, dir, len) => {
    const hit = this.game.physics.raycast(_o.set(pos.x, pos.y + 0.6, pos.z), dir, len, null, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    return hit && Math.abs(hit.normal.y) < 0.6 ? _n.set(hit.normal.x, 0, hit.normal.z).normalize() : null;
  };

  fixed(dt) {
    if (!this.list.length) return;
    const leader = this.game.player;
    for (const S of this.list) S.fixed(dt, { leader, others: [leader, ...this.list.filter((x) => x !== S).map((x) => x.body)], probe: this.probe });
  }

  update(dt, alpha) { for (const S of this.list) S.update(dt, alpha); }
}
