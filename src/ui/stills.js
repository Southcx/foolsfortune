// ---------------------------------------------------------------------------------------
// STILLS: the frame just drawn, held as a photograph (the overture's stop-time BREAK: docs/boards/OVERTURE.md). Each hit of the band
// freezes the picture into a still, sepia, in a cream border, a little askew, laid over the last; the drum fill riffles them like a
// deck being shuffled; then they are swept away. No words on them: a mark, not a caption. (Not a plate: nothing is taken, nothing kept.)
//
// It copies the canvas in the same frame it was drawn (call `take` right after the render, as the Veritome's own camera does), so
// it needs no preserved drawing buffer.
//
// Prior art: Cowboy Bebop's opening ("Tank!": the freeze frames on the stop-time hits), the photo mode stills of every trailer, the
// Polaroid's border (a white frame with a deeper bottom) and the toned print's sepia.
//
//   const S = new Stills()   S.take(canvas)   S.riffle(k 0..1)   S.clear()   S.visible
// ---------------------------------------------------------------------------------------

const CSS = `
#stills { position: fixed; inset: 0; z-index: 13; pointer-events: none; display: none; background: rgba(12, 6, 4, .92); }
#stills .p { position: absolute; left: 50%; top: 50%; width: 62vmin; padding: 1.6vmin 1.6vmin 7vmin; background: #efe4cf;
  box-shadow: 0 1.2vmin 3vmin rgba(0,0,0,.55); transform-origin: 50% 60%; }
#stills .p canvas { display: block; width: 100%; height: auto; filter: sepia(.85) contrast(1.08) brightness(.96); image-rendering: auto; }
`;

export class Stills {
  constructor() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'stills'; document.body.appendChild(this.el);
    this.list = [];
  }
  get visible() { return this.list.length > 0; }

  /** Hold the frame just drawn as a still, laid over the others. */
  take(src) {
    const w = 480, h = Math.round(w * (src.height / src.width || 0.5625));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    try { c.getContext('2d').drawImage(src, 0, 0, w, h); } catch { /* a canvas that cannot be read: an empty still */ }
    const p = document.createElement('div'); p.className = 'p'; p.appendChild(c);
    const i = this.list.length, rot = [-4, 3, -2, 5, -6][i % 5], dx = [-6, 5, -3, 7, -1][i % 5], dy = [-2, 3, -4, 1, 2][i % 5];
    p.dataset.rot = rot; p.dataset.dx = dx; p.dataset.dy = dy;
    p.style.transform = `translate(calc(-50% + ${dx}vmin), calc(-50% + ${dy}vmin)) rotate(${rot}deg)`;
    this.el.appendChild(p); this.list.push(p);
    this.el.style.display = 'block';
  }

  /** The drum fill: the stills riffle, each flicked off in turn as k runs 0 to 1 (a deck shuffled), the last held. */
  riffle(k) {
    const n = this.list.length;
    this.list.forEach((p, i) => {
      const u = Math.min(1, Math.max(0, k * n - i));
      const out = i < n - 1 ? u : 0, { rot, dx, dy } = p.dataset;
      p.style.transform = `translate(calc(-50% + ${+dx + out * 120}vmin), calc(-50% + ${+dy - out * 20}vmin)) rotate(${+rot + out * 40}deg)`;
    });
  }

  clear() { for (const p of this.list) p.remove(); this.list = []; this.el.style.display = 'none'; }
}
