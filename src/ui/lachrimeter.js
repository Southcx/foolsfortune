// ---------------------------------------------------------------------------------------
// THE LACHRIMETER: the Courier's Lachryma, as a tube of it. The maker's end piece (a clamp round the mouth of a glass pipe, 32 x 32,
// greyscale: ui/pixel.js) at the left, the pipe drawn on from its last column of pixels, the same end piece turned round at the right;
// the liquid Lachryma inside, near-black with the oil-film sheen it has in the Well and on the cubes (a band of slick colour along its
// top), seen through the pipe's window. What is reserved for a charge sits after it, paler. When Lachryma comes in, a bead flashes at the
// liquid's leading edge (the maker's bead-flash sheet, seven frames). All drawn at 1x into one small canvas and scaled by a whole number.
//
// Prior art: the tube gauges of the JRPG and the action RPG (Kingdom Hearts' MP bar, Okami's ink pots, Dark Cloud's thirst meter: a
// liquid you can see the level of), and pixel art's rule that a gauge is the drawing with its fill showing through.
//
//   const m = new Lachrimeter(px, { width: 220 })   el.appendChild(m.el)   m.set(available, reserved, max)   m.bead()   m.update(dt)
// ---------------------------------------------------------------------------------------

const WIN = { y0: 11, y1: 17, x0: 15 }; // (the pipe's window, in the end piece's pixels: where the liquid shows through)
// the oil film along the liquid's top (the cubes' run of colours: violet, teal, gold, magenta), and its body
const FILM = ['#4d1a8a', '#2a6fa0', '#0b8c9c', '#3aa077', '#c99a2e', '#c2426f', '#7a2c9a'];
const BODY = ['#120a1c', '#0b0611', '#07040b', '#0b0611', '#160c22'];
const RES = ['#6b4a88', '#56396f', '#4a3061', '#56396f', '#6b4a88'];

export class Lachrimeter {
  constructor(px, { width = 220, k = 1 } = {}) {
    this.px = px;
    this.W = Math.max(96, width);
    this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = 32;
    this.el = px.show(this.c, { k });
    this.el.classList.add('lachrimeter');
    this.v = -1; this.r = -1; this.beadT = -1; this.dirty = true;
  }

  set(avail, reserved, max) {
    const W = this.W, span = W - 2 * WIN.x0;
    const v = Math.round((Math.max(0, avail) / max) * span), r = Math.round((Math.max(0, reserved) / max) * span);
    if (v !== this.v || r !== this.r) { this.v = v; this.r = r; this.dirty = true; }
  }
  /** A bead flashes at the liquid's edge (Lachryma came in). */
  bead() { this.beadT = 0; this.dirty = true; }

  update(dt) {
    if (this.beadT >= 0) { this.beadT += dt; if (this.beadT > 7 / 14) this.beadT = -1; this.dirty = true; }
    if (!this.dirty) return;
    this.dirty = false;
    this.draw();
    this.px.paint(this.el);
  }

  draw() {
    const px = this.px, W = this.W, g = this.c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, 32);
    const end = px.art('endpiece', 'clay');
    // the liquid first (the drawing goes over it: the liquid shows only through the window)
    const x0 = WIN.x0, rows = WIN.y1 - WIN.y0;
    for (let i = 0; i < this.v; i++) {
      const x = x0 + i;
      g.fillStyle = FILM[Math.floor((x / 9) % FILM.length)]; g.fillRect(x, WIN.y0, 1, 1); // (the film along its top)
      for (let y = 1; y < rows; y++) { g.fillStyle = BODY[(y - 1) % BODY.length]; g.fillRect(x, WIN.y0 + y, 1, 1); }
    }
    if (this.v > 0) { g.fillStyle = '#d2c3f4'; g.fillRect(x0 + this.v - 1, WIN.y0 + 1, 1, rows - 2); } // (the meniscus: its leading edge catches the light)
    for (let i = 0; i < this.r; i++) for (let y = 0; y < rows; y++) { g.fillStyle = (i + y) % 3 ? RES[y % RES.length] : '#8c6aa8'; g.fillRect(x0 + this.v + i, WIN.y0 + y, 1, 1); }
    // the pipe: the end piece, its last column drawn on to the other end, and the end piece turned round
    const mid = end.width - 1;
    for (let x = end.width; x < W - end.width; x++) g.drawImage(end, mid, 0, 1, 32, x, 0, 1, 32);
    g.drawImage(end, 0, 0);
    g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(end, 0, 0); g.restore();
    // and the bead, flashing at the edge
    if (this.beadT >= 0) {
      const f = px.frames('bead', 'mind'), i = Math.min(f.length - 1, Math.floor(this.beadT * 14));
      g.drawImage(f[i], Math.max(x0, x0 + this.v - 8), WIN.y0 + (rows - 16) / 2);
    }
  }
}
