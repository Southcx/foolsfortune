// ---------------------------------------------------------------------------------------
// THE BRACELET (working name; docs/plans/BRACELET.md, the owner's approval of 2026-10-13): the one ring the Vessoul wears in every form,
// and the CHARMS in its sockets that bend the god hand's powers. Seven sockets, one for each domain, each opening at level 30 of its
// domain; a charm there bends only that domain's powers (no slot for all of them: the owner, 2026-10-13). A charm is earned by an achievement (the count way or the feat way: `ACH_CHARMS` in progress/achievements.js), never bought, and every
// one has a cost, so a bracelet is a build. The numbers reach the powers through the ramp (progress/godpowers.js rampOf asks
// `game.bracelet.mod`), so no charm ever loosens the walls of GODHAND.md section 11. TWIN and ECHO repeat an act (godhand/powers.js).
// What is socketed is kept (the save's `bracelet` section). Its look is Calissa's (vfx/bracelet.js): she hears `bracelet.charm`.
//
// Prior art: Vagrant Story's gem slots; Final Fantasy VII's support materia (a slot that bends its neighbour); Hollow Knight's charms
// (few notches, a build); the house's Possibilikeys (tools/lockheart/table.js KEYS: TWIN, WIDE, ECHO), whose verbs these reuse.
//
//   CHARMS[id] = { label, does, mods: { family: x }, repeat?, delay?, cost }   SOCKET_AT   SOCKETS   FAMILY[key] -> family
//   game.bracelet = new Bracelet(game)   .owned(id)   .open(socket)   .charmAt(socket)   .set(socket, id|null)   .mod(domain, key)
//   .repeatOf(domain) -> [{ charm, delay }]   .costOf(domain) -> x   .gentle(domain) -> bool
// ---------------------------------------------------------------------------------------
import { DOMAIN_ORDER } from './godpowers.js';

/** A domain's socket opens at this level of it. */
export const SOCKET_AT = 30;
export const SOCKETS = DOMAIN_ORDER;

/** Which family a ramp's number belongs to (RAMP's keys), so a charm can name the family and not every key. */
export const FAMILY = { r: 'size', side: 'size', len: 'size', w: 'size', depth: 'size', carry: 'size', scale: 'size', size: 'size', power: 'size', steps: 'size',
  dur: 'time', hold: 'time', made: 'made', rate: 'rate', cost: 'lachryma' };

/** The charms. `mods` multiply a family of the ramp's numbers; `cost` multiplies the Lachryma every act of a power under it spends;
 *  `repeat` acts it again after `delay` real seconds (TWIN a beat apart, ECHO where it ended). Drafts, as BRACELET.md says. */
export const CHARMS = {
  twin: { label: 'TWIN', does: 'The power acts twice, a beat apart.', repeat: true, delay: 0.4, cost: 1.6, mods: {} },
  wide: { label: 'WIDE', does: 'Half again the reach and the size.', cost: 1.5, mods: { size: 1.5 } },
  echo: { label: 'ECHO', does: 'The act comes again where it ended, three real seconds on.', repeat: true, delay: 3, cost: 1.3, mods: {} },
  quiet: { label: 'QUIET', does: 'Half the dissonance.', cost: 1, mods: { size: 0.8 }, dissonance: 0.5 },
  thrift: { label: 'THRIFT', does: 'Matter made from nothing costs half.', cost: 1, mods: { made: 0.5, rate: 0.8 } },
  linger: { label: 'LINGER', does: 'Portals, wards, totems and the rest stand twice as long.', cost: 1.3, mods: { time: 2 } },
  gentle: { label: 'GENTLE', does: 'No harm to creatures: a blow becomes a push.', cost: 1, mods: {}, gentle: true },
};

export class Bracelet {
  constructor(game) {
    this.game = game;
    this.sockets = {};
    game.save?.section('bracelet', { scope: 'player', version: 1,
      dump: () => this.sockets,
      load: (d) => { this.sockets = d && typeof d === 'object' ? { ...d } : {}; },
      reset: () => { this.sockets = {}; } });
    // the ring's look (Calissa's vfx/bracelet.js, `game.bracelets`) is told what sits in each socket: now, and whenever it reads them again
    for (const n of ['god.enter', 'garden.enter', 'domain.level']) game.events?.on(n, () => this.sync());
  }

  /** Tell the ring's look what is socketed (its charm ids are the labels: TWIN, WIDE ...); a soft call, none if the look is not there. */
  sync() { const L = this.game.bracelets; if (!L?.setCharm) return; for (const s of SOCKETS) { const id = this.charmAt(s); L.setCharm(s, id ? CHARMS[id].label : null); } }

  /** Earned (its achievement done), or lent (DEBUG: the arts row). */
  owned(id) { const g = this.game; return !!CHARMS[id] && (!!g.system?.lendAll || !!g.lend?.has?.('arts') || !!g.achievements?.done?.(`charm.${id}`)); }
  /** A socket is open at its domain's level; a lend opens them all. */
  open(socket) {
    const g = this.game;
    if (g.system?.lendAll || g.lend?.has?.('arts')) return true;
    return (g.psyche?.level?.(socket) ?? 1) >= SOCKET_AT;
  }
  charmAt(socket) { const id = this.sockets[socket]; return id && this.open(socket) && this.owned(id) ? id : null; }
  /** Put a charm in a socket (null empties it). A charm is worn in one socket at a time. */
  set(socket, id) {
    if (!SOCKETS.includes(socket) || (id && (!this.owned(id) || !this.open(socket)))) return false;
    for (const s of SOCKETS) if (this.sockets[s] === id) delete this.sockets[s];
    if (id) this.sockets[socket] = id; else delete this.sockets[socket];
    this.game.save?.dirty('bracelet');
    this.game.events?.emit('bracelet.set', { socket, charm: id, by: 'courier' });
    this.sync();
    return true;
  }
  /** The charm bending a domain's powers: its socket's (as a list, for the callers' loops). */
  on(domain) { const id = this.charmAt(domain); return id ? [[id, CHARMS[id]]] : []; }
  /** What a ramp's number is multiplied by, for a power of this domain. */
  mod(domain, key) { const f = FAMILY[key]; if (!f) return 1; let k = 1; for (const [, C] of this.on(domain)) k *= C.mods[f] ?? 1; return k; }
  dissonance(domain) { let k = 1; for (const [, C] of this.on(domain)) k *= C.dissonance ?? 1; return k; }
  costOf(domain) { let k = 1; for (const [, C] of this.on(domain)) k *= C.cost ?? 1; return k; }
  gentle(domain) { return this.on(domain).some(([, C]) => C.gentle); }
  repeatOf(domain) { return this.on(domain).filter(([, C]) => C.repeat).map(([id, C]) => ({ charm: id, delay: C.delay })); }
}
