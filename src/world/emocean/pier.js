// ---------------------------------------------------------------------------------------
// THE PIER: where a crossing begins (docs/plans/RAIL.md, section 11; docs/plans/SLICE.md, E4). F at the end of a jetty opens its page:
// the node map as a list, every island with what a crossing there costs (the fuel, from the purse) or why it cannot be made (the voyage
// says: progress/voyage.js canBoard), and the MOUNTS: two of the tools you wear, carried on the sloop and fired on 1 and 2
// (progress/rail/mounts.js; courier/ship/mounts.js). Choosing an island boards (the fuel paid, the set pieces drawn) and the stage
// begins (world/emocean/stage.js). Each island's pier is registered here with the island it stands on: Anagami's jetty on the shore
// (world/dunes/beach.js), Margarite's at its dock (world/emocean/margarite.js); a crossing makes port at the pier of the island it sails to.
//
// Prior art: FTL's jump map (a list of where the fuel reaches, the rest named and greyed), Wind Waker's sea chart as the place you
// choose from, Sid Meier's Pirates! (the harbour's menu: where, and what it costs), Kingdom Hearts' Gummi garage (what you fly with,
// chosen before you go).
//
//   game.pier = new Pier(game)   .add(island, () => ({ end, top, yaw }))   .update()   .open(island)   .landing(island) -> { pos, yaw }
//   (the interact chevron's id: 'pier')
// ---------------------------------------------------------------------------------------
import { NODES } from '../../progress/econ/emocean.js';
import { MOUNTS, slotsOf, mountable } from '../../progress/rail/mounts.js';
import { SHIPS, canSail } from '../../progress/rail/ships.js';
import { today } from '../../core/calendar.js';
import { SeaChart } from './seachart.js';

const REACH = 2.6; // (metres from a jetty's end)

/** The refusal for a heavy hull with no rutter of the route (placeholder words for Espada's; `uncharted`, ships.js). */
const UNCHARTED = (ship) => `Uncharted: a ${ship} sails only a passage charted in a rutter.`;

export class Pier {
  constructor(game) {
    this.game = game; this.ship = 'sloop'; this.chart = new SeaChart(game, this); this.piers = new Map(); this.chosen = null;
    game.interact?.add('pier', () => {
      const P = game.player;
      if (game.emocean?.stage.active || game.dialogue?.open || this.menu?.open || game.god?.controlling) return null;
      for (const [island, at] of this.piers) {
        const j = at(); if (!j) continue;
        const d = Math.hypot(j.end.x - P.pos.x, j.end.z - P.pos.z);
        if (d <= REACH && Math.abs(j.top - P.pos.y) < 2) return { pos: j.end.clone().setY(j.top + 1.4), d, ref: island };
      }
      return null;
    });
  }

  get menu() { return this.game.indexMenu; } // (the index's window: feedback/indexmenu.js)
  /** An island's pier: where its end is (the page opens there; a crossing to the island makes port there). */
  add(island, at) { this.piers.set(island, at); return this; }
  /** Where a crossing to `island` sets the Courier down: on its pier's end, facing the land. */
  landing(island) {
    const at = this.piers.get(island)?.(); if (!at) return null;
    return { pos: at.end.clone().setY(at.top + 0.05), yaw: at.yaw ?? 0 };
  }

  /** Once a frame: F at a pier's end opens its page. */
  update() {
    const g = this.game, P = g.player, it = g.interact?.cur;
    if (it?.id !== 'pier' || !P.peekLatch?.('KeyF') || g.god?.controlling) return;
    P.latch('KeyF');
    this.open(it.ref);
  }

  /** The worn tools that can go to sea, and the two chosen (the first two, until the Courier picks). */
  mounts() {
    const worn = (this.game.belt?.tools || []).map((t) => t.id).filter((id) => this.game.belt.isWorn(id)), can = mountable(worn), n = slotsOf(this.ship);
    this.chosen = (this.chosen || can.slice(0, n)).filter((t) => can.includes(t)).slice(0, n); // (the mounts by hull: the owner's ruling, mounts.js slotsOf)
    return { can, chosen: this.chosen };
  }

  open(island) {
    const g = this.game, V = g.voyage; if (!V) return;
    const at = island || V.at;
    if (V.at !== at && !V.sailing) { if (V.arrive) V.arrive(at); else { V.s.at = at; V.dirty(); } } // (they stand at this pier: they may have come by a Shrine)
    this.menu?.showPage('pier', (im, el) => {
      const box = el('div', 'rooms');
      for (const id of Object.keys(NODES)) {
        if (id === at) continue;
        const N = NODES[id], b = V.canBoard(at, id, this.ship), s = canSail(this.ship, { route: `${at}>${id}`, day: today(), rutter: this.rutter(at, id) }), c = b.ok && !s.ok ? { ok: false, why: UNCHARTED(this.ship) } : b, open = V.isOpen(id), ok = c.ok;
        const sub = c.ok ? `fuel: ${c.hop.fuel} cubes` : c.why;
        const d = el('div', 'room', `<span class="n">${ok ? '⚓' : '·'}</span><span><b>${open ? N.name : 'Not yet found'}</b><s>${sub}</s></span>`);
        if (ok) d.onclick = () => this.sail(at, id); else d.style.opacity = '0.55';
        box.appendChild(d);
        if (ok) { // (the sea chart: draft the passage, read the sea, then cast off: world/emocean/seachart.js)
          const ch = el('div', 'room', `<span class="n">⌖</span><span><b>THE SEA CHART: ${N.name}</b><s>draft your passage and read the sea before you sail</s></span>`);
          ch.onclick = () => this.chart.open(at, id); box.appendChild(ch);
        }
      }
      // the ship: a trade (the owner, PASSAGE.md 11): the agile ones sail any lane, the heavy ones only a charted passage
      const sb = el('div', 'rooms');
      for (const [id, H] of Object.entries(SHIPS)) {
        const on = id === this.ship, d = el('div', 'room', `<span class="n">${on ? '⚓' : '·'}</span><span><b>${id.toUpperCase()}</b><s>bears ${H.bears} · ${H.mounts} mount${H.mounts > 1 ? 's' : ''}${H.sails === 'charted' ? ' · a charted passage only' : ''}${H.dive ? '' : ' · cannot dive'}</s></span>`);
        d.onclick = () => { this.ship = id; this.open(at); };
        sb.appendChild(d);
      }
      // the mounts: the hull's worth of worn tools aboard (click to take one aboard or ashore)
      const { can, chosen } = this.mounts(), mb = el('div', 'rooms'), n = slotsOf(this.ship);
      for (const t of can) {
        const on = chosen.includes(t), M = MOUNTS[t];
        const d = el('div', 'room', `<span class="n">${on ? `${chosen.indexOf(t) + 1}` : '·'}</span><span><b>${M.name}</b><s>${on ? 'aboard' : 'ashore'}: ${M.does}</s></span>`);
        d.onclick = () => { this.chosen = on ? chosen.filter((x) => x !== t) : [...chosen, t].slice(-n); this.open(at); };
        mb.appendChild(d);
      }
      const out = [el('div', 'grp', `FROM ${(NODES[at]?.name || at).toUpperCase()}`), box, el('div', 'grp', 'THE SHIP'), sb, el('div', 'grp', can.length ? `MOUNTS: ${n === 1 ? 'KEY 1' : `KEYS 1 TO ${n}`} AT SEA` : 'WEAR A TOOL TO MOUNT IT'), mb];
      for (const e of out) im.appendChild(e);
    }, { title: 'THE PIER', sub: 'click to choose · F closes' });
  }

  /** A rutter of this route and game day in the Pneuka Box (the charted passage a heavy hull sails; none exist until the rutter item
   *  lands: then a tanker is refused as uncharted, the owner's rule). */
  rutter(from, to) {
    const r = this.game.pneuka?.slots.find((s) => s?.id === 'rutter' && s.data?.route === `${from}>${to}` && s.data?.day === today());
    return r ? r.data : null;
  }

  /** Cast off on the drafted passage (the sea chart's): its threats are the crossing's legs, and a passage sailed to its end makes a
   *  rutter (voyage.stageResult). */
  castOff(from, to) {
    const C = this.chart; if (!C.done()) return false;
    return this.sail(from, to, { ids: [...C.path], legs: C.path.map((id) => C.chart.waypoints[id].type), pieces: C.legs(), route: `${from}>${to}`, read: +this.game.voyage.reckoning(from, to).toFixed(2) });
  }

  /** Board and go: the voyage pays the fuel and draws the set pieces; the stage takes the Courier aboard. */
  sail(from, to, passage = null) {
    const g = this.game, V = g.voyage;
    const s = canSail(this.ship, { route: `${from}>${to}`, day: today(), rutter: this.rutter(from, to) });
    if (!s.ok) { g.log?.say('warn', UNCHARTED(this.ship), { key: 'pier', throttle: 1 }); return false; }
    const r = V.board(from, to, this.ship, this.mounts().chosen, passage);
    if (!r.ok) { g.log?.say('warn', r.why, { key: 'pier', throttle: 1 }); return false; }
    this.menu?.close();
    g.emocean?.begin();
    return true;
  }
}
