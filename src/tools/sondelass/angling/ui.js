// ---------------------------------------------------------------------------------------
// The angling strip: the lure tied on (- / = change it: lures.js) and the seven aspects of the Courier's mind a sounding pushes into it,
// in display order (Wonder, Mirth, Desire, Fury, Gall, Grief, Dread), on the tool strip beside the forms (keys 4 to 0; the wheel too,
// until the lure is in the water: then it sets the depth). An aspect not yet known (Gall and Fury, until that feeling is) shows LOCKED,
// never hidden: dimmed, its glyph grey, the gold padlock chip on it, as the Soul Brush's radial shows a feeling not yet drunk. That is all the
// angler has on the HUD. Everything else is in the world: the line is the colour of its load, the reticle sits on the fish, the ping is
// a shell of light, the bite is a mark over the lure.
// ---------------------------------------------------------------------------------------
import { ASPECTS, SHOWN } from './species.js';
import { iconEl } from '../../../ui/icons/icons.js';

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
/** The key each shown aspect answers to: 4 .. 9, then 0. */
const keyOf = (k) => String((k + 4) % 10);
let LOCK = null;
/** The padlock chip (ui/icons/chipart.js), at two CSS pixels an art pixel and whole device pixels, as an image the strip's HTML can carry;
 *  on the slot's lower corner, as the radial hangs it. */
function lockMark() {
  if (LOCK === null) {
    try { const c = iconEl('chip.lock', { pal: 'gold', px: 2 }); LOCK = `<img src="${c.toDataURL()}" alt="locked" style="position:absolute;right:-5px;bottom:-5px;width:${c.style.width};height:${c.style.height};image-rendering:pixelated">`; } catch { LOCK = ''; }
  }
  return LOCK;
}

/** `known` (species.js knownAspects): which aspects a lure may carry now; without it, all seven. */
export function aspectStrip(aspect, lure = null, known = null) {
  // (the lure tied on: - / = change it)
  const lu = lure ? `<div class="gap"></div><div class="slot lure" title="${lure.blurb || ''}" style="width:auto;min-width:46px;padding:0 6px"><i>${lure.glyph}</i><span>${lure.name.length > 14 ? `${lure.name.slice(0, 13)}…` : lure.name}</span><b>- =</b></div>` : '';
  return `${lu}<div class="gap"></div>${SHOWN.map((i, k) => {
    const a = ASPECTS[i], locked = known && !known[i];
    if (locked) return `<div class="slot asp" title="${a.name}: not yet known"><i style="color:#8c837d;opacity:.5">${a.glyph}</i><span style="opacity:.5">${a.name}</span><b style="opacity:.5">${keyOf(k)}</b>${lockMark()}</div>`;
    return `<div class="slot asp${i === aspect ? ' sel' : ''}" style="${i === aspect ? `border-color:${hex(a.color)}` : ''}"><i style="color:${hex(a.color)}">${a.glyph}</i><span>${a.name}</span><b>${keyOf(k)}</b></div>`;
  }).join('')}`;
}
