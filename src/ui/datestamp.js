// ---------------------------------------------------------------------------------------
// THE DATE STAMP: the Veritome's clock as a 90s point-and-shoot's orange LCD (the owner, 2026-10-06; docs/plans/OVERLAY.md). It glows in
// the corner of the lens and is burnt into the corner of every plate, as those cameras printed it on the film. It is the overlay's one
// number, and allowed for one reason: it is the DEVICE'S OWN DISPLAY (a camera's readout, and the mark it leaves on its prints), not a
// mark laid on the world, and it reports nothing; nothing else on the overlay or in the world takes a number from it (Calissa's ruling).
//
//   THE FORMAT  '67 18:40   the game day (its last two figures, where a camera put the year) and the game hour and minute
//   THE FACE    seven-segment figures in sodium orange with a soft bloom, the unlit segments faintly there (an LCD's ghost)
//
// Prior art: the date-back imprint of the 90s compact cameras (Canon, Pentax and Fuji's quartz-date backs: '97 10 6 in orange in the
// bottom right of the print), and the seven-segment display itself.
//
//   stampText(ms?) -> "'67 18:40"     drawStamp(ctx2d, text, x, y, height, { anchor: 'right' })
// ---------------------------------------------------------------------------------------
import { DAY_MS, now } from '../core/calendar.js';

/** The game clock (the arithmetic of the weather's clockAt, progress/weather.js on claude/dovina-design: use it once it is merged). */
function clock(ms = now()) {
  const day = Math.floor(ms / DAY_MS), into = (ms - day * DAY_MS) / (DAY_MS / 24);
  return { day, hour: Math.floor(into), minute: Math.floor((into % 1) * 60) };
}

export function stampText(ms) {
  const c = clock(ms), p2 = (n) => String(n).padStart(2, '0');
  return `'${p2(((c.day % 100) + 100) % 100)} ${p2(c.hour)}:${p2(c.minute)}`;
}

// segments a..g of each figure: a top, b top right, c bottom right, d bottom, e bottom left, f top left, g middle
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

/** Draw `text` (figures, a colon, an apostrophe, spaces) as seven-segment figures `h` pixels tall. */
export function drawStamp(g, text, x, y, h, { anchor = 'right' } = {}) {
  const w = h * 0.52, t = Math.max(1.5, h * 0.12), gap = h * 0.18;
  const adv = (ch) => (ch === ':' || ch === "'" ? w * 0.4 : ch === ' ' ? w * 0.6 : w) + gap;
  let width = 0; for (const ch of text) width += adv(ch);
  let cx = anchor === 'right' ? x - width : x;
  const seg = (k, ox, oy, on) => {
    g.fillStyle = on ? '#ff9a2e' : 'rgba(255,154,46,0.035)';
    const hh = h / 2;
    const R = { a: [ox + t, oy, w - 2 * t, t], d: [ox + t, oy + h - t, w - 2 * t, t], g: [ox + t, oy + hh - t / 2, w - 2 * t, t],
      f: [ox, oy + t, t, hh - t], e: [ox, oy + hh, t, hh - t], b: [ox + w - t, oy + t, t, hh - t], c: [ox + w - t, oy + hh, t, hh - t] }[k];
    g.fillRect(R[0], R[1], R[2], R[3]);
  };
  g.save();
  g.shadowColor = 'rgba(255,140,30,0.75)'; g.shadowBlur = h * 0.35; // (the LCD's bloom)
  for (const ch of text) {
    if (SEG[ch]) for (const k of 'abcdefg') seg(k, cx, y, SEG[ch].includes(k));
    else if (ch === ':') { g.fillStyle = '#ff9a2e'; g.fillRect(cx + w * 0.1, y + h * 0.28, t, t); g.fillRect(cx + w * 0.1, y + h * 0.68, t, t); }
    else if (ch === "'") { g.fillStyle = '#ff9a2e'; g.fillRect(cx + w * 0.1, y, t, h * 0.28); }
    cx += adv(ch);
  }
  g.restore();
}
