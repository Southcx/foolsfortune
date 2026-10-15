// ---------------------------------------------------------------------------------------
// THE TABLE HUD: a DOM layer pinned over the canvas only while a table view is open, holding the seat plates and the goal bar at screen
// points the table view projects for it (docs/handoffs/dovina/casino-clarity-art-brief.md 2b). Words and numbers show here by the owner's
// exception (2026-10-15) and nowhere else; the DOM keeps them crisp over the 480-line scene and costs no shader program.
// Prior art: poker clients' seat overlays, Balatro's HUD plates. Takes plain data as arguments and reads no game state.
// Interface:
//   const hud = new TableHud().mount(host)               // host: the canvas's parent (position: relative)
//   hud.setSeats([{ seat, colour, name, stats:[{label,value,kind}], state }])   // kind: score | money | lives | count
//   hud.setGoal({ label, line, target, tracks:[{seat,colour,value}], marks:[{at,label}] })
//   hud.place('seat:<n>' | 'goal', x, y)                 // screen px in the host (null hides), the projected anchor, each frame
//   hud.show() / hud.hide() / hud.unmount()
// ---------------------------------------------------------------------------------------
import { injectTableHudCss } from './tablehud.css.js';
import { seatPlate } from './seatplate.js';
import { goalBar } from './goalbar.js';

export class TableHud {
  constructor() { this.root = null; this.plates = new Map(); this.bar = null; this.anchors = new Map(); }

  mount(host) {
    injectTableHudCss();
    this.root = document.createElement('div');
    this.root.className = 'th-root';
    this.root.hidden = true;
    host.appendChild(this.root);
    return this;
  }

  _anchor(id, el) {
    const a = document.createElement('div');
    a.className = 'th-anchor'; a.appendChild(el);
    this.root.appendChild(a); this.anchors.set(id, a);
  }

  /** Create or update one plate per seat; a seat gone from the list is removed. */
  setSeats(seats) {
    const keep = new Set(seats.map((s) => s.seat));
    for (const s of seats) {
      const had = this.plates.get(s.seat);
      if (had) { had.plate.set({ stats: s.stats, state: s.state }); continue; }
      const el = seatPlate(s);
      this.plates.set(s.seat, el); this._anchor(`seat:${s.seat}`, el);
    }
    for (const n of [...this.plates.keys()]) {
      if (keep.has(n)) continue;
      this.anchors.get(`seat:${n}`)?.remove(); this.anchors.delete(`seat:${n}`); this.plates.delete(n);
    }
  }

  /** Create or update the goal bar. */
  setGoal(g) {
    if (!this.bar) { this.bar = goalBar(g); this._anchor('goal', this.bar); return; }
    this.bar.bar.setGoal(g); this.bar.bar.set(g.tracks || []);
  }

  /** Put an anchor at a screen point (px from the host's top left); null hides it. */
  place(id, x, y) {
    const a = this.anchors.get(id); if (!a) return;
    if (x == null) { a.style.display = 'none'; return; }
    a.style.display = ''; a.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  show() { if (this.root) this.root.hidden = false; }
  hide() { if (this.root) this.root.hidden = true; }
  unmount() { this.root?.remove(); this.root = null; this.plates.clear(); this.anchors.clear(); this.bar = null; }
}
