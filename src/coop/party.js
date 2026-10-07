// ---------------------------------------------------------------------------------------
// THE PARTY: the siblings called into your world (Dovina's rulings, docs/plans/COOP.md C4 and C6; the glossary: sibling, the party).
// Five, one for each division, each in its division's look (Calissa's, vfx/siblinglooks.js; `lookOf`), else its suit's glaze alone: Petra
// (pentacles), Dovina (the trumps), Wanda (wands), Calissa (cups), Espada (swords). A sibling is met once where its craft lives
// (coop/meeting.js) and is yours from then on: called or dismissed at any Shrine (world/shrines.js) or from the chat line. Two are out
// at once (`CAP`: a sibling costs about 12 draw calls in view; a third when the zone can bear it), and a party is four players at most,
// guests included. Called, a sibling's rig is made then (a copy of the Courier's model, parsed on demand: nothing is spent at boot) and
// it is set down beside you. What you tell them, on the wheel (T held: Come, Go, Help, Wait) or the chat line: follow, hold, go <place>,
// fight, back, warp (set down beside you at once: the way out of anything a sibling is stuck in), and, from a division's session,
// scout, guard, free (coop/channel.js). A place in another region (the Dunes from the workshop) is not walked to: you travel, they come. Who is met and who is out are kept (`party`, the player's); those out are called again after a reload.
// Events (each with `by`): party.meet { sibling }, party.call { sibling }, party.dismiss { sibling }, party.order { order, sibling? },
// party.refuse { sibling, why: 'unmet' | 'full' | 'far', place? }.
//
// Prior art: Dragon's Dogma's pawns (met, then summoned at rift stones, given short orders), Monster Hunter's party of four, Kingdom
// Hearts' party (a slot each, warping back when left behind).
//
//   game.party = new Party(game, { makeRig })   .meet(id, rig?, at?)   .call(id | 'all')   .dismiss(id | 'all')   .command(order, who, arg)
//   .fixed(dt)   .update(dt, alpha) (and the wheel: T held)   .list [Sibling]   .met (Set)   .cap   SIBLINGS [{ id, name, suit, color, glaze }]   lookOf(id)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS } from '../core/physics.js';
import { Sibling } from './sibling.js';
import { RadialWheel } from '../feedback/wheel.js';
import { wholeOf } from '../render/zones.js';
import { DEFAULT_LOOK } from '../courier/vessel/glazes.js';
import { SIBLING_LOOKS } from '../vfx/siblinglooks.js';

export const SIBLINGS = [
  { id: 'petra', name: 'Petra', suit: 'pentacles', color: 0xd4a83a, glaze: 'ash' },
  { id: 'dovina', name: 'Dovina', suit: 'trumps', color: 0x9a6ae0, glaze: 'yohen' },
  { id: 'wanda', name: 'Wanda', suit: 'wands', color: 0xe8603a, glaze: 'oxblood' },
  { id: 'calissa', name: 'Calissa', suit: 'cups', color: 0x4a8ae0, glaze: 'ru' },
  { id: 'espada', name: 'Espada', suit: 'swords', color: 0xb8c8dc, glaze: 'guan' },
];
/** A sibling's look: its division's (Calissa's), else the Courier's with its suit's glaze. */
export const lookOf = (id) => { const g = SIBLINGS.find((s) => s.id === id)?.glaze; return SIBLING_LOOKS[id] ?? { ...DEFAULT_LOOK, body: g, mask: g }; };
export const CAP = 2, PLAYERS = 4; // (two siblings out at once; four players at most, guests included: COOP.md C4)
export const ORDERS = ['follow', 'hold', 'go', 'fight', 'back', 'warp', 'scout', 'guard', 'free'];
const WHEEL = [{ order: 'follow', label: 'COME', sub: 'follow me' }, { order: 'go', label: 'GO', sub: 'where I look' }, { order: 'fight', label: 'HELP', sub: 'fight with me' }, { order: 'hold', label: 'WAIT', sub: 'hold here' }]; // (T held: Dragon's Dogma's four)
const WHEEL_KEY = 'KeyT';
const _o = new THREE.Vector3(), _n = new THREE.Vector3();

export class Party {
  constructor(game, { makeRig }) {
    this.game = game; this.makeRig = makeRig; this.list = []; this.coming = new Set(); this.met = new Set(); this.cap = CAP; this.restore = []; this.seen = new WeakSet(); // (seen: what a sibling has pointed at, once for the party)
    game.save?.section('party', { scope: 'player', version: 1,
      dump: () => ({ met: [...this.met], out: this.list.map((s) => s.id) }),
      load: (d) => { this.met = new Set(d?.met || []); this.restore = (d?.out || []).filter((id) => this.met.has(id)); },
      reset: () => { this.met = new Set(); this.restore = []; } });
    game.chat?.add('sib', {
      help: 'your siblings: /sib <name | all> follow | hold | go <place> | fight | back | warp | call | dismiss (a name alone: who is with you)',
      aliases: ['party'],
      run: (args) => {
        const [who = 'all', what, ...rest] = args.map((a) => a.toLowerCase());
        if (!what) { game.events.emit('party.list', { siblings: this.list.map((s) => s.id), met: [...this.met], by: 'courier' }); return; }
        if (what === 'call') this.call(who); else if (what === 'dismiss') this.dismiss(who); else this.command(what, who, rest.join(' '));
      },
    });
  }

  get(id) { return this.list.find((s) => s.id === id); }
  dirty() { this.game.save?.dirty('party'); }
  /** Room for one more: two siblings out, four players at most (guests count). */
  room() { return this.list.length + this.coming.size < this.cap && 1 + this.list.length + this.coming.size + (this.game.guests?.list.length || 0) < PLAYERS; }
  may(id) { return this.met.has(id) || this.game.mode === 'debug'; } // (the sandbox meets everyone)

  /** Met where its craft lives (coop/meeting.js): it joins at once if there is room, the rig that waited joining with it. */
  meet(id, rig = null, at = null) {
    if (this.met.has(id)) return;
    this.met.add(id); this.dirty();
    this.game.events.emit('party.meet', { sibling: id, by: 'courier' });
    if (this.room()) this.add(id, rig, at);
    else if (rig) rig.root.parent?.remove(rig.root);
  }

  /** Call one (or every one met, up to the room there is) into your world, set down beside you. */
  async call(id = 'all') {
    const ids = id === 'all' ? SIBLINGS.map((s) => s.id) : [id];
    for (const sid of ids) {
      if (!SIBLINGS.some((s) => s.id === sid) || this.get(sid) || this.coming.has(sid)) continue;
      if (!this.may(sid)) { if (id !== 'all') this.game.events.emit('party.refuse', { sibling: sid, why: 'unmet', by: 'courier' }); continue; }
      if (!this.room()) { this.game.events.emit('party.refuse', { sibling: sid, why: 'full', by: 'courier' }); break; }
      this.coming.add(sid);
      const rig = await this.makeRig();
      this.coming.delete(sid);
      if (this.get(sid)) { rig.root.parent?.remove(rig.root); continue; }
      this.add(sid, rig, null);
    }
  }

  add(id, rig, at) {
    const def = SIBLINGS.find((s) => s.id === id);
    const S = new Sibling(this.game, { id, color: def.color, look: lookOf(id), rig, seen: this.seen });
    this.list.push(S); this.reslot(); this.dirty();
    if (at) { S.body.pos.copy(at); S.body.prevPos.copy(at); S.body.renderPos.copy(at); S.body.place(); S.body.markSafe(); } else S.warp(this.game.player);
    this.game.events.emit('party.call', { sibling: id, by: 'courier' });
    return S;
  }

  dismiss(id = 'all') {
    for (const S of [...this.list]) {
      if (id !== 'all' && S.id !== id) continue;
      S.dispose(); this.list.splice(this.list.indexOf(S), 1);
      this.game.events.emit('party.dismiss', { sibling: S.id, by: 'courier' });
    }
    this.reslot(); this.dirty();
  }

  /** What you tell them (one, or all): follow, hold, go <place>, fight, back; scout, guard, free from a session (coop/channel.js). */
  command(order, who = 'all', arg = '') {
    if (!ORDERS.includes(order)) return false;
    let to = null;
    const P = this.game.player;
    if (order === 'go') {
      const place = arg && this.game.places?.get?.(arg);
      to = place?.at ? place.at() : new THREE.Vector3(P.pos.x + Math.sin(P.yaw) * 12, P.pos.y, P.pos.z + Math.cos(P.yaw) * 12); // (a place by name, or where you look)
      if (place && wholeOf(to) !== wholeOf(P.pos)) { this.game.events.emit('party.refuse', { sibling: who === 'all' ? null : who, why: 'far', place: place.name || arg, by: 'courier' }); return false; } // (another region: travel there, and they come)
    }
    for (const S of this.list) if (who === 'all' || S.id === who) {
      if (order === 'warp') { S.warp(P); S.order = 'follow'; S.to = null; continue; } // (set down beside you, following)
      S.order = order; S.to = to;
    }
    this.game.events.emit('party.order', { order, sibling: who === 'all' ? null : who, by: 'courier' });
    return true;
  }

  reslot() { this.list.forEach((S, i) => S.setSlot(i, this.list.length)); }

  /** What is in the way ahead of a sibling (the steering's whisker): the wall's normal, or null. */
  probe = (pos, dir, len) => {
    const hit = this.game.physics.raycast(_o.set(pos.x, pos.y + 0.6, pos.z), dir, len, null, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    return hit && Math.abs(hit.normal.y) < 0.6 ? _n.set(hit.normal.x, 0, hit.normal.z).normalize() : null;
  };

  fixed(dt) {
    if (this.restore.length && this.game.player) { const r = this.restore; this.restore = []; for (const id of r) this.call(id); } // (who was out, back after a reload)
    if (!this.list.length) return;
    const leader = this.game.player;
    for (const S of this.list) S.fixed(dt, { leader, others: [leader, ...this.list.filter((x) => x !== S).map((x) => x.body)], probe: this.probe });
  }

  update(dt, alpha) {
    for (const S of this.list) S.update(dt, alpha);
    // the wheel: T held, the mouse flicked toward an order, let go (feedback/wheel.js); the camera holds still while it is open
    const g = this.game, I = g.input, P = g.player, free = !g.log?.typing && !g.dialogue?.open && !g.indexMenu?.open && !g.god?.controlling;
    if (this.list.length && free && I?.isDown(WHEEL_KEY)) { const W = (this.wheel ||= new RadialWheel({ id: 'partywheel', items: WHEEL })); if (!W.isOpen) { W.open(); P.lookScale.wheel = 0; } W.steer(I.dx || 0, I.dy || 0); }
    else if (this.wheel?.isOpen) { const i = this.wheel.close(); P.lookScale.wheel = 1; if (i >= 0) this.command(WHEEL[i].order); }
  }
}
