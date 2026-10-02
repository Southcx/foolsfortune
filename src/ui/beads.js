// ---------------------------------------------------------------------------------------
// CHARGE BEADS: an ability's charges as a row of the maker's beads (the bead-flash sheet, ui/pixel.js): a charge ready is a bead of
// Lachryma (the mind's palette, its first frame); a charge spent is an empty socket (the grey palette, dim) that fills from the bottom as
// it comes back; and a bead that has just come back glints (the sheet's flash, once). Drawn at 1x into one small canvas and scaled by a
// whole number, like everything of the kit.
//
// Prior art: the charge pips of the action game (Dishonored's Blink and Mana, Overwatch's Tracer's three Blinks shown as three pips,
// Hollow Knight's soul vessels), drawn as things of the world (a bead of the stuff it costs) rather than as numbers.
//
//   const b = new ChargeBeads(px, { k })   el.appendChild(b.el)   b.set(charges, max, refill 0..1)   b.update(dt)
// ---------------------------------------------------------------------------------------
const FW = 16, GAP = 2, FLASH = 14; // (frame width, the gap between beads, the glint's frames a second)

export class ChargeBeads {
  constructor(px, { k = 1, max = 3 } = {}) {
    this.px = px; this.k = k;
    this.c = document.createElement('canvas');
    this.el = px.show(this.c, { k });
    this.el.classList.add('beads');
    this.n = -1; this.max = 0; this.fill = 0; this.glint = []; this.dirty = true;
    this.resize(max);
  }
  resize(max) {
    if (max === this.max) return;
    this.max = max; this.c.width = Math.max(1, max * (FW + GAP) - GAP); this.c.height = 16;
    this.glint = new Array(max).fill(-1); this.dirty = true;
  }
  /** charges ready, how many there can be, and how far the next one has come back (0..1). */
  set(n, max, fill = 0) {
    this.resize(max);
    if (this.n >= 0 && n > this.n) for (let i = this.n; i < n; i++) this.glint[i] = 0; // (come back: it glints)
    const f = Math.round(fill * 16) / 16;
    if (n !== this.n || f !== this.fill) { this.n = n; this.fill = f; this.dirty = true; }
  }
  update(dt) {
    for (let i = 0; i < this.glint.length; i++) if (this.glint[i] >= 0) { this.glint[i] += dt; if (this.glint[i] * FLASH >= 7) this.glint[i] = -1; this.dirty = true; }
    if (!this.dirty) return;
    this.dirty = false;
    const g = this.c.getContext('2d'), px = this.px;
    g.clearRect(0, 0, this.c.width, 16);
    const lit = px.frames('bead', 'mind'), dim = px.frames('bead', 'grey');
    for (let i = 0; i < this.max; i++) {
      const x = i * (FW + GAP);
      if (i < this.n) {
        const fi = this.glint[i] >= 0 ? Math.min(6, Math.floor(this.glint[i] * FLASH)) : 0;
        g.drawImage(lit[fi], x, 0);
      } else {
        g.globalAlpha = 0.8; g.drawImage(dim[0], x, 0); g.globalAlpha = 1;
        if (i === this.n && this.fill > 0) { // (the one coming back: filling from the bottom)
          const h = Math.round(16 * this.fill);
          g.drawImage(lit[0], 0, 16 - h, FW, h, x, 16 - h, FW, h);
        }
      }
    }
    px.paint(this.el); // (the shown canvas takes the new picture, at the whole-number scale)
  }
}
