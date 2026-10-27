// ---------------------------------------------------------------------------------------
// THE PIER: where a crossing begins (docs/plans/RAIL.md, section 11; docs/plans/SLICE.md, E4). F at the end of a jetty opens its page:
// the node map as a list, every island with what a crossing there costs (the fuel, from the purse) or why it cannot be made (the voyage
// says: progress/voyage.js canBoard), and the MOUNTS: two of the tools you wear, carried on the sloop and fired on 1 and 2
// (progress/rail/mounts.js; courier/ship/mounts.js). Choosing an island boards (the fuel paid, the set pieces drawn) and the stage
// begins (world/emocean/stage.js). Each island's pier is registered here with the island it stands on: Anagami's jetty on the shore
// (world/dunes/beach.js), Margarite's at its dock (world/emocean/margarite.js); a crossing makes port at the pier of the island it sails to.
// THE HELM'S CRADLE (docs/plans/HANKO.md 6.2, the owner: every crossing begins by sealing into the helm at the pier, the sloop too; the
// helm's cradle opens the pier's page): the moored hull's helm (vfx/mooring.js, its cradle Calissa's: shipkit/shiplook.js helmCradles)
// is a body cradle (world/cradles.js), reached from the jetty's end where the pier's F was. F folds you into the Pneuka Jar, it drops into
// the helm, and the page opens while you stay sealed; F unseals, and casting off (a crossing, the open sea, practice, the showcase) takes
// the Jar out at once, under the crossing's own cover. One cradle a pier and hull (each hull keeps its own imprint), one Seal Book page a
// pier (`book: 'pier.<island>'`). The seat rides the hull's bob, and the Jar with it, the page's pause too (main.js's modal branch).
// The galleon's second helm (a guest's or a sibling's seal beside yours, HANKO.md 4) is not registered yet.
//
// Prior art: FTL's jump map (a list of where the fuel reaches, the rest named and greyed), Wind Waker's sea chart as the place you
// choose from, Sid Meier's Pirates! (the harbour's menu: where, and what it costs), Kingdom Hearts' Gummi garage (what you fly with,
// chosen before you go).
//
//   game.pier = new Pier(game)   .add(island, () => ({ end, top, yaw }))   .update()   .open(island)   .landing(island) -> { pos, yaw }
//   .helm (the moored helm's cradle, or null)   .helmTick() (each frame, and under the page's pause)
//   (in the DEBUG save its page also offers THE SHOWCASE CROSSING: progress/rail/showcase.js, sailed by world/emocean/stage.js)
//   (and in either save PRACTICE: a row a leg's type sailed before, legs.js practiceOf, sailed alone at strength 1 to 4 by stage.js sailPractice)
//   (and THE OPEN SEA: SET SAIL is a crossing on the lanes, to an island; the open sea is the Emocean off them, sailed at the free helm:
//   world/opensea/, OPEN-SEA.md 8; the row goes there under the seam, to this island's quay, or Anagami's where its sea has none)
//   (the interact chevron's id: 'pier')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { NODES } from '../../progress/econ/emocean.js';
import { slotsOf, mountable } from '../../progress/rail/mounts.js';
import { ChoiceCard, cardList, slotRow } from '../../ui/choicecard.js';
import { SHIP_PARTS, PART_SLOTS } from '../../progress/opensea/salvage.js';
import { mountRow, mountRows } from '../../ui/mountcards.js';
import { SHIPS, canSail } from '../../progress/rail/ships.js';
import { today } from '../../core/calendar.js';
import { SeaChart } from './seachart.js';
import { showcasePassage } from '../../progress/rail/showcase.js';
import { practiceOf, LEGS } from '../../progress/rail/legs.js';
import { practiceCards } from '../../ui/practicecards.js';
import { sfx } from '../../audio/sfx.js';

const REACH = 2.6; // (metres from a jetty's end: the pier's F, and the helm's cradle reached from there)
const _end = new THREE.Vector3();
const MOORED = 160; // (metres: the hull is moored at the nearest pier inside this, as vfx/mooring.js shows it)

/** The refusal for a heavy hull with no rutter of the route (placeholder words for Espada's; `uncharted`, ships.js). */
const UNCHARTED = (ship) => `Your ${ship} sails only a route from a route map.`;

export class Pier {
  constructor(game) {
    this.game = game; this.ship = 'sloop'; this.chart = new SeaChart(game, this); this.piers = new Map(); this.chosen = null; this.helm = null; this.helmLook = null;
    game.interact?.add('pier', () => {
      const P = game.player;
      if (game.emocean?.stage.active || game.dialogue?.open || this.menu?.open || game.god?.controlling) return null;
      for (const [island, at] of this.piers) {
        if (this.helm?.island === island) continue; // (a hull moored there: its helm's cradle is the way to the page)
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

  /** The pier the hull is moored at: the nearest end inside MOORED (vfx/mooring.js's choice), or null. */
  nearest() {
    const me = this.game.player?.pos; if (!me) return null;
    let best = null, bd = MOORED;
    for (const [island, at] of this.piers) { const j = at(); if (!j) continue; const d = Math.hypot(j.end.x - me.x, j.end.z - me.z); if (d < bd) { bd = d; best = { island, j }; } }
    return best;
  }

  /** The moored helm as a cradle: added where a hull lies alongside, moved with its bob, taken away when it is not (unless sealed). */
  helmTick() {
    const g = this.game, C = g.cradles, M = g.mooring; if (!C) return;
    const look = M?.cur?.group.visible && !g.emocean?.stage.active ? M.cur : null, at = look ? this.nearest() : null;
    const spot = at ? look.helmCradleSpots?.()?.[0] : null, key = spot ? `${at.island}.${this.ship}` : null, c = this.helm, sealed = !!c && C.sealed === c;
    if (c && c.key !== key && !sealed) { C.remove(c); this.helm = null; }
    if (look !== this.helmLook) { if (sealed) { this.helmLook?.helmWake?.(false); look?.helmWake?.(true); } this.helmLook = look; } // (the hull changed on the page while sealed: the new one's helm wakes)
    if (!key) return;
    const end = _end.copy(at.j.end).setY(at.j.top); // (a scratch: add() copies, and the frame's copy below)
    if (!this.helm) {
      const island = at.island;
      this.helm = C.add({ id: `pier.${key}`, kind: 'body', book: `pier.${island}`, pos: spot, at: end, yaw: at.j.yaw ?? 0, reach: REACH, hold: true,
        page: () => !!this.menu?.open, // (the pier's page, or the sea chart it opens)
        onSeal: () => { this.helmLook?.helmWake?.(true); this.open(island); },
        onUnseal: () => { this.helmLook?.helmWake?.(false); const n = this.menu?.open ? this.menu.page?.name : null; if (n === 'pier' || n === 'seachart') this.menu.close(); } });
      Object.assign(this.helm, { key, island });
    }
    const H = this.helm; H.pos.copy(spot); H.at.copy(end); H.anchor = look.helmCradles?.[0]?.group ?? null; // (`anchor`: what an imprint rides, vfx/sealimprint.js)
    const J = g.god?.jar; if (sealed && J) { J.pos.copy(spot); J.group.position.copy(spot); } // (the Jar seated as the hull bobs)
  }
  /** Out of the helm at once for a cast-off: the crossing's own cover (its seam, the stage taking you aboard) sets you down. */
  castOff_() { const C = this.game.cradles; if (this.helm && C?.sealed === this.helm) C.unseal('sail', 'courier', { now: true }); }

  /** Once a frame: F at a pier's end opens its page (where no hull is moored: else the helm's cradle does). */
  update() {
    const g = this.game, P = g.player, it = g.interact?.cur;
    this.helmTick();
    if (this.chart.sounding && !(this.menu?.open && this.menu.page?.name === 'seachart')) { this.chart.sounding = false; sfx.seaChart?.(false); } // (the chart shut)
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
    const was = this.menu?.open && this.menu.page?.name === 'pier' ? this.menu.root?.querySelector('.im') : null, y = was?.scrollTop || 0; // (a pick draws the page again: it stays where it was scrolled)
    this.menu?.showPage('pier', (im, el) => {
      const box = el('div', 'rooms');
      for (const id of Object.keys(NODES)) {
        if (id === at) continue;
        const N = NODES[id], b = V.canBoard(at, id, this.ship), s = canSail(this.ship, { route: `${at}>${id}`, day: today(), rutter: this.rutter(at, id) }), c = b.ok && !s.ok ? { ok: false, why: UNCHARTED(this.ship) } : b, open = V.isOpen(id), ok = c.ok;
        // one row an island: a way open goes by its sea chart (draft the passage, read the sea, then cast off: world/emocean/seachart.js);
        // the direct hop is retired (the owner's passage, PASSAGE.md 2): pier.sail(from, to) stays the handle for the scripted crossings
        const d = ok ? el('div', 'room', `<span class="n">⌖</span><span><b>THE SEA CHART: ${N.name}</b><s>fuel: ${c.hop.fuel} cubes · plan your route, and scout it, before you sail</s></span>`)
          : el('div', 'room', `<span class="n">·</span><span><b>${open ? N.name : 'Not yet found'}</b><s>${c.why}</s></span>`);
        if (ok) d.onclick = () => this.chart.open(at, id); else d.style.opacity = '0.55';
        box.appendChild(d);
      }
      // the open sea (OPEN-SEA.md 8): off the lanes, at the free helm; from a pier to its own island's quay there (world/opensea/opensea.js arrive)
      const sea = g.opensea && !V.sailing ? el('div', 'room', `<span class="n">≈</span><span><b>THE OPEN SEA</b><s>off the lanes, at the helm: W and S the sail, A and D the rudder · chart the squares · what lives out there</s></span>`) : null;
      if (sea) sea.onclick = () => { this.menu?.close(); const go = () => { this.castOff_(); g.opensea.arrive(at); }; g.seam?.cross(go, { kind: 'sea' }) || go(); }; // (to this island's quay on the open sea, or Anagami's: opensea.js arrive)
      // the showcase crossing (DEBUG only: progress/rail/showcase.js): what is new on the rail in one run, back to this pier, nothing counted
      const SC = g.mode === 'debug' && g.emocean?.sailShowcase && !V.sailing ? showcasePassage().waypoints : [], show = SC.length ? el('div', 'room', `<span class="n">▣</span><span><b>THE SHOWCASE CROSSING</b><s>${SC.length} legs, a hull each (${SC.map((w) => w.hull).join(', ')}) · back to this pier · your pool kept full · nothing counted</s></span>`) : null;
      if (show) show.onclick = () => { this.menu?.close(); this.castOff_(); g.emocean.sailShowcase(at, this.mounts().chosen); };
      // practice (RAIL-STANDARDS.md 5; Star Fox 64's Training): a leg's type sailed once, again alone at a strength you pick, back to this
      // pier in the hull and mounts chosen below, nothing counted (the cards: ui/practicecards.js, Calissa's; their words placeholders)
      const PR = g.emocean?.sailPractice && !V.sailing ? practiceOf(g.ledger) : [];
      const prb = practiceCards(PR, { legs: LEGS, onSail: (type, n) => { this.menu?.close(); this.castOff_(); g.emocean.sailPractice(at, type, n, this.ship, this.mounts().chosen); } });
      // the ship: a trade (the owner, PASSAGE.md 11): the agile ones sail any lane, the heavy ones only a charted passage
      const sb = el('div', 'rooms');
      for (const [id, H] of Object.entries(SHIPS)) {
        const on = id === this.ship, d = el('div', 'room', `<span class="n">${on ? '⚓' : '·'}</span><span><b>${id.toUpperCase()}</b><s>hull ${H.bears} · ${H.mounts} mount${H.mounts > 1 ? 's' : ''}${H.sails === 'charted' ? ' · mapped routes only' : ''}${H.dive ? '' : ' · cannot dive'}</s></span>`);
        d.onclick = () => { this.ship = id; this.open(at); };
        sb.appendChild(d);
      }
      // the ship's parts (Dovina's: progress/opensea/salvage.js, OPEN-SEA.md 14.4): a sail, a keel and a hull fitting, each a trade, worn at a
      // dock; a choice card a part, the one worn EQUIPPED, one not yet found LOCKED (found in salvage); click one owned to wear it
      const SP = g.shipParts, pb = SP ? el('div') : null;
      if (SP) for (const slot of PART_SLOTS) {
        const rows = Object.entries(SHIP_PARTS[slot]).map(([id, P]) => ({ id, name: P.name, does: P.does, state: SP.worn[slot] === id ? 'equipped' : SP.has(id) ? 'ready' : 'locked', opens: SP.has(id) ? undefined : 'Found in salvage at sea.' }));
        pb.append(cardList(rows.map((row) => new ChoiceCard(row, { onPick: () => { if (row.state === 'ready' && SP.wear(slot, row.id)) this.open(at); } }))));
      }
      // the mounts: the hull's worth of worn tools aboard, as the slot row and a choice card each (click one to take it aboard or ashore: ui/choicecard.js)
      const { can, chosen } = this.mounts(), mb = el('div'), n = slotsOf(this.ship);
      const take = (t) => { this.chosen = chosen.includes(t) ? chosen.filter((x) => x !== t) : [...chosen, t].slice(-n); this.open(at); };
      const back = () => g.mooring?.preview(this.chosen?.at(-1) ?? null); // (the one last taken aboard, until another is hovered or focused)
      const cards = mountRows(can, chosen, { ship: this.ship, feel: g.mooring?.feel }).map((r) => new ChoiceCard(r, { onPick: () => take(r.id) }));
      for (const c of cards) { const show = () => g.mooring?.preview(c.row.id); c.el.addEventListener('mouseenter', show); c.el.addEventListener('focus', show); c.el.addEventListener('mouseleave', back); c.el.addEventListener('blur', back); } // (a mount's preview on the moored hull: vfx/mountpreview.js)
      mb.append(slotRow({ slots: n, filled: chosen.map((t, i) => mountRow(t, { slot: i + 1 })), always: mountRow('psygun'), onPick: (i) => take(chosen[i]) }), cardList(cards));
      mb.firstChild.style.marginBottom = '6px';
      g.mooring?.preview(chosen.at(-1) ?? null);
      const out = [el('div', 'grp', `SET SAIL FROM ${(NODES[at]?.name || at).toUpperCase()}: A CROSSING`), box, ...(sea ? [el('div', 'grp', 'OR SAIL FREE'), sea] : []), ...(show ? [el('div', 'grp', 'SHOWCASE (DEBUG)'), show] : []), ...(prb ? [el('div', 'grp', 'PRACTICE'), prb] : []), el('div', 'grp', 'THE SHIP'), sb, ...(pb ? [el('div', 'grp', "THE SHIP'S PARTS: WORN FROM THIS DOCK"), pb] : []), el('div', 'grp', can.length ? `MOUNTS: ${n === 1 ? 'KEY 1' : `KEYS 1 TO ${n}`} AT SEA` : 'WEAR A TOOL TO MOUNT IT'), mb];
      for (const e of out) im.appendChild(e);
    }, { title: 'THE PIER', sub: 'click to choose · F closes', aside: { left: 'right', right: 'left' }[g.mooring?.side()] }); // (the page set to the side away from the moored hull, not over it: a mount's preview is seen as it is chosen)
    if (y) { const im = this.menu?.root?.querySelector('.im'); if (im) im.scrollTop = y; }
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
    return this.sail(from, to, { ids: [...C.path], legs: C.path.map((id) => C.chart.waypoints[id].type), waypoints: C.path.map((id) => ({ ...C.chart.waypoints[id] })), chart: C.chart, pieces: C.legs(), route: `${from}>${to}`, read: +this.game.voyage.reckoning(from, to).toFixed(2) });
  }

  /** Board and go: the voyage pays the fuel and draws the set pieces; the stage takes the Courier aboard. */
  sail(from, to, passage = null) {
    const g = this.game, V = g.voyage;
    const s = canSail(this.ship, { route: `${from}>${to}`, day: today(), rutter: this.rutter(from, to) });
    if (!s.ok) { g.log?.say('warn', UNCHARTED(this.ship), { key: 'pier', throttle: 1 }); return false; }
    const r = V.board(from, to, this.ship, this.mounts().chosen, passage);
    if (!r.ok) { g.log?.say('warn', r.why, { key: 'pier', throttle: 1 }); return false; }
    this.menu?.close(); this.castOff_();
    g.emocean?.begin();
    return true;
  }
}
