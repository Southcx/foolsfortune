// ---------------------------------------------------------------------------------------
// The angling strip: the lure tied on (9 / 0 change it: lures.js) and the five aspects of the Courier's mind a sounding pushes into it,
// on the tool strip beside the forms (keys 4 to 8; the wheel too, until the lure is in the water: then it sets the depth). That is all the angler has on the HUD. Everything else is in the world: the
// line is the colour of its load, the reticle sits on the fish, the ping is a shell of light, the bite is a mark over the lure.
// ---------------------------------------------------------------------------------------
import { ASPECTS } from './species.js';

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

export function aspectStrip(aspect, lure = null) {
  // (the lure tied on: 9 / 0 change it)
  const lu = lure ? `<div class="gap"></div><div class="slot lure" title="${lure.blurb || ''}" style="width:auto;min-width:46px;padding:0 6px"><i>${lure.glyph}</i><span>${lure.name.length > 14 ? `${lure.name.slice(0, 13)}…` : lure.name}</span><b>9 0</b></div>` : '';
  return `${lu}<div class="gap"></div>${ASPECTS.map((a, i) => `<div class="slot asp${i === aspect ? ' sel' : ''}" style="${i === aspect ? `border-color:${hex(a.color)}` : ''}"><i style="color:${hex(a.color)}">${a.glyph}</i><span>${a.name}</span><b>${i + 4}</b></div>`).join('')}`;
}
