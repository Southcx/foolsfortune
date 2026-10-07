// ---------------------------------------------------------------------------------------
// THE PIER: where a crossing begins (docs/plans/RAIL.md, section 11, R1; docs/plans/SLICE.md, E4). F at the end of a jetty opens its
// page, the node map as a list: every island, with what a crossing there costs (the fuel, from the purse) or why it cannot be made
// (the voyage says: progress/voyage.js canBoard). Choosing one boards (the fuel paid, the set piece drawn) and the stage begins
// (world/emocean/stage.js). The mounts are chosen here too once R2 builds them; until then the sloop carries none.
// Until R4 (Margarite's dock) every pier is Anagami's jetty: the voyage knows which island the Courier is at, and they board from it.
//
// Prior art: FTL's jump map (a list of where the fuel reaches, the rest named and greyed), Wind Waker's sea chart as the place you
// choose from, Sid Meier's Pirates! (the harbour's menu: where, and what it costs).
//
//   game.pier = new Pier(game)   .update()   .open()   (the interact chevron's id: 'pier')
// ---------------------------------------------------------------------------------------
import { NODES } from '../../progress/econ/emocean.js';

const REACH = 2.6; // (metres from the jetty's end)

export class Pier {
  constructor(game) {
    this.game = game;
    game.interact?.add('pier', () => {
      const j = game.dunes?.beach?.jetty, P = game.player;
      if (!j || game.emocean?.stage.active || game.dialogue?.open || this.menu?.open || game.god?.controlling) return null;
      const d = Math.hypot(j.end.x - P.pos.x, j.end.z - P.pos.z);
      if (d > REACH || Math.abs(j.top - P.pos.y) > 2) return null;
      return { pos: j.end.clone().setY(j.top + 1.4), d, ref: 'jetty' };
    });
  }

  get menu() { return this.game.indexMenu; } // (the index's window: feedback/indexmenu.js)

  /** Once a frame: F at the jetty's end opens the page. */
  update() {
    const g = this.game, P = g.player, it = g.interact?.cur;
    if (it?.id !== 'pier' || !P.peekLatch?.('KeyF') || g.god?.controlling) return;
    P.latch('KeyF');
    this.open();
  }

  open() {
    const g = this.game, V = g.voyage; if (!V) return;
    const at = V.at;
    this.menu?.showPage('pier', (im, el) => {
      const box = el('div', 'rooms');
      for (const id of Object.keys(NODES)) {
        if (id === at) continue;
        const N = NODES[id], c = V.canBoard(at, id, 'sloop'), open = V.isOpen(id);
        const sub = c.ok ? `cast off: ${c.hop.fuel} cubes of fuel` : c.why;
        const d = el('div', 'room', `<span class="n">${c.ok ? '⚓' : '·'}</span><span><b>${open ? N.name : 'Somewhere not yet found'}</b><s>${sub}</s></span>`);
        if (c.ok) d.onclick = () => this.sail(id); else d.style.opacity = '0.55';
        box.appendChild(d);
      }
      for (const e of [el('div', 'grp', `FROM ${(NODES[at]?.name || at).toUpperCase()}`), box]) im.appendChild(e);
    }, { title: 'THE PIER', sub: 'click to choose · F closes' });
  }

  /** Board and go: the voyage pays the fuel and draws the set piece; the stage takes the Courier aboard. */
  sail(to) {
    const g = this.game, r = g.voyage.board(g.voyage.at, to, 'sloop', []);
    if (!r.ok) { g.log?.say('warn', r.why, { key: 'pier', throttle: 1 }); return false; }
    this.menu?.close();
    g.emocean?.begin();
    return true;
  }
}
