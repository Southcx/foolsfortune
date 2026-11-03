// ---------------------------------------------------------------------------------------
// THE SKIFF SETS' CARDS (docs/plans/GAPS.md G207, SKIFF-TUNING.md): the six skiff sets (vfx/skiffsets.js `SKIFF_SETS`) as choice cards
// for the race board's PAINT tab (world/raceway/raceboard.js, Dovina's page: she calls this as the GARAGE calls ui/garagesheet.js), each
// with a painted swatch of its livery under its line: the hull painting itself cropped into a hull's silhouette (the set's own colour
// while it loads), the sail cut as the set cuts it and dyed its dye with its pattern laid on, the pennant in its colour and shape at the
// masthead, the hull wrap over the hull, and the trail and ribbon streaming astern. A set is EQUIPPED when every slot it fills is worn as
// it fills it (`setWorn`), READY when Dovina's `game.skiffPaint.setOpen(id)` says so, else LOCKED with her `setWhy` (its pieces owned of
// how many, and the feat). Hovered, the set is shown whole on the board (`onHover`, her preview: `skiffPaintPreview` takes a slot map);
// picked, worn whole through the catalogue's own setter (`applySkiffSet`), said by `skiff.set` (tracking/race.js).
//
// Prior art: Destiny's and Monster Hunter's armour set screens (the whole look in one picture beside the set's name), Rocket League's
// bundle cards (the car drawn in the bundle's decal, wheels and boost), Splatoon's brand cards; the race board's own preview on hover.
//
//   skiffSetCards(parent, { game, onWear(id), onHover(id), onLeave() }) -> element   liverySwatch(game, id) -> canvas   SWATCH (the numbers)
// ---------------------------------------------------------------------------------------
import { ChoiceCard, cardList } from './choicecard.js';
import { SKIFF_SETS, setOf, setPicks, setWorn, applySkiffSet, skiffSetPreview } from '../vfx/skiffsets.js';
import { SKIFF_HULLS } from '../vfx/skiffhulls.js';
import { PAINT } from '../progress/skiffpaint.js';
import { COLOR } from '../progress/weather.js';

const hex = (n) => `#${(n >>> 0).toString(16).padStart(6, '0')}`;
/** The swatch's numbers: its size in CSS px, and the colours of what has no colour row of its own. */
export const SWATCH = {
  w: 300, h: 84,
  hull: { own: '#b8946a', urushi: '#1c0c0a', driftwood: '#a59a88', celadon: '#9cc4a8', teak: '#8a5a2e', obsidian: '#16131c', festival: '#c8341e' },
  cloth: '#efe4cc', gold: '#ffd36a', ink: '#1a1410',
  trail: { own: '#d8c09a', lachryma: '#b89aff', glaze: '#c9a882', petals: '#ffb3c8', embers: '#ff7a2a', ink: '#2a1e18', starlight: '#fff6c8', frost: '#dff4ff' },
};
const CSS = `
.ssc .cc { grid-template-columns: 1fr auto; }
.ssc .cc .cc-ic, .ssc .cc .cc-keys { display: none; }
.ssc .cc .cc-side { grid-column: 2; }
.ssc .cc .cc-opens { grid-column: 1 / -1; }
.ssc .cc .cc-media { grid-column: 1 / -1; margin-top: 5px; }
.ssc canvas.sw { display: block; width: 100%; height: auto; aspect-ratio: ${SWATCH.w} / ${SWATCH.h}; border-radius: 3px;
  background: linear-gradient(180deg, #2a3a52, #c9a882 70%, #b8946a); box-shadow: inset 0 0 0 1px rgba(255,230,200,.18), 0 0 0 1px #2a140c; }
.ssc .cc.locked canvas.sw { filter: saturate(.35) brightness(.8); }
`;
let installed = false;
function install() { if (installed || typeof document === 'undefined') return; installed = true; const s = document.createElement('style'); s.id = 'ssccss'; s.textContent = CSS; document.head.appendChild(s); }

const imgs = new Map(); // hull id -> Promise<HTMLImageElement | null>
function hullImage(id) {
  const row = SKIFF_HULLS[id]; if (!row) return Promise.resolve(null);
  if (!imgs.has(id)) imgs.set(id, row.load().then(({ default: b64 }) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = `data:image/webp;base64,${b64}`; })).catch(() => null));
  return imgs.get(id);
}
/** A row's colour (a dye's or a pennant's: a feeling's, a glaze of yours, gold), else null. */
function colourOf(game, kind, id) {
  if (!id) return null;
  if (kind === 'pennant' && id === 'gold') return SWATCH.gold;
  if (COLOR[id] != null) return hex(COLOR[id]);
  const rows = kind === 'dye' ? game?.skiffPaint?.dyes?.() ?? PAINT.dye : PAINT[kind] || [];
  const c = rows.find((r) => r.id === id)?.colour; return c != null ? hex(c) : null;
}

/** The hull's silhouette, bow to the right: a long low boat with a raised stern. */
function hullPath(c, W, H) { c.beginPath(); c.moveTo(W * 0.2, H * 0.7); c.lineTo(W * 0.86, H * 0.7); c.quadraticCurveTo(W * 0.8, H * 0.86, W * 0.66, H * 0.88); c.lineTo(W * 0.3, H * 0.88); c.quadraticCurveTo(W * 0.21, H * 0.84, W * 0.2, H * 0.7); c.closePath(); }
/** The sail's shape by its cut, the mast at x. */
function sailPath(c, cut, mx, top, foot, W) {
  c.beginPath();
  if (cut === 'lateen') { c.moveTo(mx - W * 0.16, foot); c.lineTo(mx + W * 0.14, top - 2); c.lineTo(mx + W * 0.15, foot); }
  else if (cut === 'crabclaw') { c.moveTo(mx, foot); c.quadraticCurveTo(mx - W * 0.12, top + 10, mx - W * 0.04, top); c.quadraticCurveTo(mx + W * 0.04, top + 22, mx + W * 0.18, top + 6); c.quadraticCurveTo(mx + W * 0.1, foot - 6, mx, foot); }
  else if (cut === 'junk') { c.moveTo(mx, top); c.lineTo(mx + W * 0.13, top + 4); c.lineTo(mx + W * 0.16, foot); c.lineTo(mx - W * 0.02, foot); }
  else { c.moveTo(mx, top); c.lineTo(mx + W * 0.16, foot); c.lineTo(mx, foot); }
  c.closePath();
}
/** The pattern laid over the sail (clipped to it). */
function pattern(c, id, x0, y0, x1, y1, dye) {
  const w = x1 - x0, h = y1 - y0; c.save(); c.lineWidth = 1.4;
  const dark = 'rgba(20,10,8,.45)', gold = SWATCH.gold;
  if (id === 'stripe') { c.fillStyle = dark; c.fillRect(x0, y0 + h * 0.48, w, h * 0.16); }
  else if (id === 'chevron') { c.fillStyle = dark; c.beginPath(); c.moveTo(x0, y0 + h * 0.3); c.lineTo(x0 + w * 0.5, y0 + h * 0.62); c.lineTo(x1, y0 + h * 0.3); c.lineTo(x1, y0 + h * 0.46); c.lineTo(x0 + w * 0.5, y0 + h * 0.78); c.lineTo(x0, y0 + h * 0.46); c.fill(); }
  else if (id === 'checker') { const s = 6; for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) if (((x - x0) / s + (y - y0) / s) % 2 < 1) { c.fillStyle = 'rgba(16,10,8,.75)'; c.fillRect(x, y, s, s); } }
  else if (id === 'waves') { c.strokeStyle = 'rgba(255,255,255,.55)'; for (let y = y0 + 6; y < y1 + 6; y += 7) for (let x = x0 + ((y / 7) % 2) * 5; x < x1 + 10; x += 10) { c.beginPath(); c.arc(x, y, 5, Math.PI, 0); c.stroke(); } }
  else if (id === 'motif') { c.fillStyle = 'rgba(255,255,255,.5)'; for (let y = y0 + 3; y < y1; y += 6) for (let x = x0 + ((y / 6) % 2) * 3; x < x1; x += 6) { c.beginPath(); c.arc(x, y, 1.1, 0, 7); c.fill(); } }
  else if (id === 'kintsugi' || id === 'kiln') { c.strokeStyle = gold; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + w * 0.1, y0 + h * 0.2); c.lineTo(x0 + w * 0.42, y0 + h * 0.45); c.lineTo(x0 + w * 0.3, y0 + h * 0.7); c.lineTo(x0 + w * 0.7, y1); c.moveTo(x0 + w * 0.42, y0 + h * 0.45); c.lineTo(x1, y0 + h * 0.5); c.stroke(); }
  else if (id === 'constellations') { const pts = [[0.2, 0.3], [0.4, 0.22], [0.55, 0.45], [0.35, 0.62], [0.7, 0.75], [0.5, 0.85]]; c.strokeStyle = 'rgba(255,246,200,.55)'; c.beginPath(); pts.forEach(([u, v], i) => (i ? c.lineTo : c.moveTo).call(c, x0 + u * w, y0 + v * h)); c.stroke(); c.fillStyle = '#fff6c8'; for (const [u, v] of pts) { c.beginPath(); c.arc(x0 + u * w, y0 + v * h, 1.6, 0, 7); c.fill(); } }
  void dye; c.restore();
}
/** The pennant at the masthead, in its colour and shape (its `length`). */
function pennant(c, len, col, x, y) {
  c.save(); c.fillStyle = col;
  if (len === 'prayer') { const F = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread']; c.strokeStyle = 'rgba(40,24,16,.7)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 46, y + 12); c.stroke(); F.forEach((f, i) => { c.fillStyle = hex(COLOR[f]); c.fillRect(x - 6 - i * 6.2, y + 1.5 + i * 1.6, 5, 6); }); }
  else if (len === 'carp') { c.beginPath(); c.ellipse(x - 13, y + 3, 12, 4, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 3, y + 2.5, 1.4, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(x - 24, y + 3); c.lineTo(x - 31, y - 2); c.lineTo(x - 31, y + 8); c.fill(); }
  else if (len === 'swallowtail') { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 22, y); c.lineTo(x - 15, y + 4); c.lineTo(x - 22, y + 8); c.lineTo(x, y + 8); c.fill(); }
  else { const L = len === 'long' ? 34 : 14; c.beginPath(); c.moveTo(x, y); c.lineTo(x - L, y + 3); c.lineTo(x, y + 7); c.fill(); }
  c.restore();
}
/** The wrap over the hull (clipped to it). */
function wrap(c, id, W, H) {
  c.save(); hullPath(c, W, H); c.clip();
  if (id === 'pinstripes') { c.strokeStyle = SWATCH.gold; c.lineWidth = 1; for (const v of [0.745, 0.775]) { c.beginPath(); c.moveTo(W * 0.18, H * v); c.lineTo(W * 0.88, H * v); c.stroke(); } }
  else if (id === 'roundel') { c.fillStyle = '#f6ead8'; c.beginPath(); c.arc(W * 0.42, H * 0.79, 6, 0, 7); c.fill(); c.fillStyle = SWATCH.ink; c.font = '700 8px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('0', W * 0.42, H * 0.795); }
  else if (id === 'flames') { c.fillStyle = '#ff9a2a'; for (let i = 0; i < 5; i++) { const x = W * (0.62 + i * 0.045); c.beginPath(); c.moveTo(x, H * 0.88); c.quadraticCurveTo(x - 6, H * 0.8, x - 14, H * 0.74); c.quadraticCurveTo(x - 3, H * 0.8, x + 4, H * 0.88); c.fill(); } }
  else if (id === 'kintsugi') { c.strokeStyle = SWATCH.gold; c.lineWidth = 1.4; c.beginPath(); c.moveTo(W * 0.3, H * 0.7); c.lineTo(W * 0.36, H * 0.8); c.lineTo(W * 0.33, H * 0.88); c.moveTo(W * 0.36, H * 0.8); c.lineTo(W * 0.5, H * 0.78); c.lineTo(W * 0.58, H * 0.88); c.stroke(); }
  c.restore();
}

/** The livery's swatch: a canvas drawn now with the set's colours, its hull painting laid in once decoded. */
export function liverySwatch(game, id) {
  const W = SWATCH.w, H = SWATCH.h, dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  const cv = document.createElement('canvas'); cv.className = 'sw'; cv.width = W * dpr; cv.height = H * dpr;
  const p = setPicks(game, id), set = setOf(id), hullId = p.hull || set?.slots.hull?.[0] || 'own';
  const draw = (img) => {
    const c = cv.getContext('2d'); if (!c) return; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    // the trail and the ribbon astern
    const tr = SWATCH.trail[p.trail] || SWATCH.trail.own;
    const g = c.createLinearGradient(0, 0, W * 0.24, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, tr);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, H * 0.86); c.lineTo(W * 0.24, H * 0.8); c.lineTo(W * 0.24, H * 0.9); c.lineTo(0, H * 0.96); c.fill();
    if (p.trail === 'starlight' || p.trail === 'petals' || p.trail === 'embers') { c.fillStyle = tr; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(W * (0.02 + i * 0.024), H * (0.8 - (i % 3) * 0.05), 1.3, 0, 7); c.fill(); } }
    if (p.ribbon && p.ribbon !== 'off') { c.strokeStyle = colourOf(game, 'dye', p.dye) || SWATCH.gold; c.globalAlpha = 0.7; c.lineWidth = 2; c.beginPath(); c.moveTo(W * 0.22, H * 0.62); c.bezierCurveTo(W * 0.15, H * 0.4, W * 0.08, H * 0.72, 0, H * 0.5); c.stroke(); if (p.ribbon === 'helix') { c.beginPath(); c.moveTo(W * 0.22, H * 0.62); c.bezierCurveTo(W * 0.15, H * 0.8, W * 0.08, H * 0.4, 0, H * 0.6); c.stroke(); } c.globalAlpha = 1; }
    // the hull: its painting cropped into the silhouette (its colour while it loads)
    c.save(); hullPath(c, W, H); c.clip(); c.fillStyle = SWATCH.hull[hullId] || SWATCH.hull.own; c.fillRect(0, 0, W, H);
    if (img) { const sw = img.width * 0.5, sh = img.height * 0.12; c.drawImage(img, img.width * 0.25, img.height * 0.44, sw, sh, W * 0.18, H * 0.68, W * 0.7, H * 0.22); }
    c.restore(); wrap(c, p.wrap, W, H);
    c.strokeStyle = 'rgba(20,10,8,.85)'; c.lineWidth = 1.2; hullPath(c, W, H); c.stroke();
    // the mast, the sail (cut, dye, pattern) and the pennant
    const mx = W * 0.5, top = H * 0.1, foot = H * 0.66;
    c.strokeStyle = '#3a2418'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, H * 0.72); c.lineTo(mx, top - 4); c.stroke();
    const dye = colourOf(game, 'dye', p.dye) || SWATCH.cloth;
    c.save(); sailPath(c, p.cut, mx, top, foot, W); c.fillStyle = dye; c.fill(); c.clip(); pattern(c, p.pattern, mx - W * 0.17, top - 4, mx + W * 0.19, foot, dye);
    if (p.cut === 'junk') { c.strokeStyle = 'rgba(20,10,8,.5)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { const y = top + (foot - top) * (k / 5); c.beginPath(); c.moveTo(mx - 4, y); c.lineTo(mx + W * 0.17, y); c.stroke(); } }
    c.restore(); c.strokeStyle = 'rgba(20,10,8,.6)'; c.lineWidth = 1; sailPath(c, p.cut, mx, top, foot, W); c.stroke();
    pennant(c, p.length, colourOf(game, 'pennant', p.pennant) || SWATCH.cloth, mx, top - 4);
  };
  draw(null);
  hullImage(hullId).then((img) => { if (img) draw(img); });
  return cv;
}

/** What each slot of a set is, in the catalogue's words (the card's detail). */
function piecesLine(game, id) {
  const p = setPicks(game, id), NAME = { hull: 'Hull', dye: 'Dye', pattern: 'Pattern', cut: 'Cut', trail: 'Trail', ribbon: 'Ribbon', pennant: 'Pennant', length: 'Shape', wrap: 'Wrap' };
  return Object.entries(p).map(([k, v]) => { const rows = k === 'dye' ? game?.skiffPaint?.dyes?.() ?? PAINT.dye : PAINT[k] || []; return `${NAME[k] || k}: ${rows.find((r) => r.id === v)?.label || v}`; }).join(' · ');
}

/** The six sets as choice cards, appended to `parent` (the race board's group). */
export function skiffSetCards(parent, { game, onWear = null, onHover = null, onLeave = null } = {}) {
  install();
  const S = game?.skiffPaint; if (!S || !parent) return null;
  const cards = SKIFF_SETS.map((set) => {
    const worn = setWorn(game, set.id), open = !!S.setOpen?.(set.id), [have, of] = S.setHave?.(set.id) || [0, 0];
    const row = { id: `skiffset.${set.id}`, name: set.label, does: set.line, detail: piecesLine(game, set.id), state: worn ? 'equipped' : open ? 'ready' : 'locked',
      opens: open ? '' : `${S.setWhy?.(set.id) || ''}`, key: null, media: () => liverySwatch(game, set.id) };
    if (!open && !worn && of) row.detail = `${have} of ${of} pieces owned. ${row.detail}`;
    const card = new ChoiceCard(row, { onPick: () => {
      const r = applySkiffSet(game, set.id); if (!r) return;
      game.events?.emit('skiff.set', { set: set.id, label: set.label, worn: r.worn.length, skipped: r.skipped, refused: r.refused, by: 'courier' });
      onWear?.(set.id);
    } });
    card.el.addEventListener('pointerenter', () => (onHover ? onHover(set.id) : skiffSetPreview(game, set.id)));
    card.el.addEventListener('pointerleave', () => (onLeave ? onLeave() : skiffSetPreview(game, null)));
    return card;
  });
  const box = cardList(cards, { cols: 3 }); box.classList.add('ssc'); parent.appendChild(box);
  return box;
}
