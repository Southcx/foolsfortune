// ---------------------------------------------------------------------------------------
// A SQUARE'S SEAL (docs/plans/OPEN-SEA.md 15.5; Dovina's rule, progress/opensea/squares.js): each square of the open sea done (charted,
// its features found, its secrets taken, its wrecks salvaged) stamped with your seal on the open sea's page of the map, in vermilion
// ink pressed into the washi: the seal face (vfx/sealface.js, your seal from world/cradles.js `mine`) at a little under the square's
// side, each turned a few degrees by its id as a hand would press it, its ink a touch uneven. THE STAMP: on `sea.square.done` with the
// page open (else the next time it opens), the seal comes down over the square (its shadow closing under it), strikes, a ring of ink
// bleeds out once, and it lifts off leaving the impression; about 0.8 real s, then the page is still again. No words.
// The page stays pure (ui/mapdress/areapage.js asks `sealsOnPage` once a draw); this holds which squares are stamped and which are
// still to be, and asks the map's engine for a frame while a stamp plays (game.cartography.screen.drawMap(true)).
//
// Prior art: the goshuin (a temple's vermilion seal stamped in your book when you have been: HANKO.md's Seal Book), The Wind Waker's
// sea chart filling square by square, Ubisoft's synchronised map sections; a hanko pressed on paper (the ink's ring at the rim, the
// field mottled where the paste was thin).
//
//   game.seaSeals = new SeaSeals(game)   (listens to `sea.square.done`; registers the page's source)
//   sealsOnPage(ctx, page, sx, sy, scale)   (areapage.js: draws the open sea page's seals; nothing on any other page)
//   SEA_SEAL (the numbers)
// ---------------------------------------------------------------------------------------
import { drawSealFace } from '../../vfx/sealface.js';
import { squareCentre, SEA } from '../../world/opensea/seaprops.js';
import { INK } from './ink.js';

/** A seal's side against its square's (0..1), its least and most size on the page (CSS px), the stamp's length (real s) and its parts
 *  (the fall's share, the bleed's share), how much it is turned (radians at most), the impression's ink, the face's raster (px). */
export const SEA_SEAL = { k: 0.62, min: 14, max: 120, stamp: 0.8, fall: 0.35, bleed: 0.45, turn: 0.16, alpha: 0.86, face: 192, ink: INK.vermilion };

let source = null; // (the installed SeaSeals' list: one game a page)
const hashOf = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10000) / 10000; };
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

let face = null; // { key, canvas } (your seal's face, rastered once a seal)
function faceOf(seal) {
  const key = seal ? `${seal.name}|${seal.outline}|${seal.carving}` : '-';
  if (face?.key === key) return face.canvas;
  const c = face?.canvas || document.createElement('canvas'); c.width = c.height = SEA_SEAL.face;
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  drawSealFace(g, seal, { size: SEA_SEAL.face, ink: SEA_SEAL.ink });
  g.globalCompositeOperation = 'destination-out'; // (the paste thin in places: a mottle taken out of the ink)
  for (let i = 0; i < 70; i++) { const u = hashOf(`${key}${i}`), v = hashOf(`${i}${key}`), r = 1 + 5 * hashOf(`r${i}`); g.globalAlpha = 0.18 + 0.3 * hashOf(`a${i}`); g.beginPath(); g.arc(u * c.width, v * c.height, r, 0, Math.PI * 2); g.fill(); }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  face = { key, canvas: c };
  return c;
}

/** The open sea page's seals drawn into `ctx` (the page's own transform, after the sketch): an impression a done square, a stamp
 *  playing where one is still coming down. */
export function sealsOnPage(ctx, page, sx, sy, scale) {
  const list = page?.area === 'opensea' ? source?.() : null; if (!list?.length) return;
  const img = faceOf(list.seal), side = Math.min(SEA_SEAL.max, Math.max(SEA_SEAL.min, SEA.square * SEA_SEAL.k * scale));
  for (const q of list) {
    const x = sx(q.x), y = sy(q.z), k = q.k ?? 1, F = SEA_SEAL.fall, a = (hashOf(q.id) - 0.5) * 2 * SEA_SEAL.turn;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    if (k < F) {
      const f = k / F, lift = 1 + 0.6 * (1 - f) * (1 - f); // (coming down: big and faint over its own closing shadow)
      ctx.fillStyle = `rgba(42,24,16,${0.08 + 0.22 * f})`; ctx.beginPath(); ctx.arc(side * 0.06 * (1 - f), side * 0.1 * (1 - f), side * 0.5 * (0.7 + 0.3 * f), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.25 + 0.5 * f; ctx.drawImage(img, -side * lift / 2, -side * lift / 2, side * lift, side * lift);
    } else {
      const s = (k - F) / (1 - F), strike = k < F + 0.08 ? 1.04 : 1; // (struck: pressed a hair wide, then the impression)
      if (s < SEA_SEAL.bleed / (1 - F) + 0.3) { const b = Math.min(1, s / (SEA_SEAL.bleed / (1 - F))); ctx.strokeStyle = SEA_SEAL.ink; ctx.globalAlpha = 0.45 * (1 - b); ctx.lineWidth = 1 + side * 0.04 * (1 - b); ctx.beginPath(); ctx.arc(0, 0, side * (0.5 + 0.22 * b), 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = SEA_SEAL.alpha * (k < 1 ? 0.75 + 0.25 * s : 1); ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(img, -side * strike / 2, -side * strike / 2, side * strike, side * strike);
    }
    ctx.restore();
  }
}

export class SeaSeals {
  constructor(game) {
    this.game = game; this.pending = new Set(); this.start = new Map(); this.raf = 0;
    game.events?.on?.('sea.square.done', (e) => { if (!e?.square) return; this.pending.add(e.square); this.kick(); });
    source = () => this.list();
  }
  get screen() { return this.game.cartography?.screen; }
  /** The done squares as the page draws them: { id, x, z, k (the stamp, 1 pressed) }; a pending one starts its stamp the first draw it is seen. */
  list() {
    const room = this.game.opensea, done = room?.squaresDone; if (!done?.size) return null;
    const t = now(), out = [];
    for (const id of done) {
      const [c, r] = String(id).split(',').map(Number); if (!Number.isFinite(c) || !Number.isFinite(r)) continue;
      let k = 1;
      if (this.pending.has(id)) { if (!this.start.has(id)) this.start.set(id, t); k = (t - this.start.get(id)) / SEA_SEAL.stamp; if (k >= 1) { k = 1; this.pending.delete(id); this.start.delete(id); } else this.kick(); }
      const p = squareCentre(c, r); out.push({ id, x: p.x, z: p.z, k });
    }
    out.seal = this.game.cradles?.mine ?? null;
    return out;
  }
  /** A frame of the map asked for while a stamp plays (the engine draws only on a change it can see). */
  kick() {
    if (this.raf || typeof requestAnimationFrame !== 'function') return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; const S = this.screen; if (S?.open && this.pending.size) S.drawMap?.(true); });
  }
}
