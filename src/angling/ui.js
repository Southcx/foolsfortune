// ---------------------------------------------------------------------------------------
// The angling strip: the five aspects of the Courier's mind, on the tool strip beside the forms (keys 4 to 8; the wheel too, until
// the lure is in the water: then it sets the depth). That is all the angler has on the HUD. Everything else is in the world: the
// line is the colour of its load, the reticle sits on the fish, the ping is a shell of light, the bite is a mark over the lure.
// ---------------------------------------------------------------------------------------
import { ASPECTS } from './species.js';

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

export function aspectStrip(aspect) {
  return `<div class="gap"></div>${ASPECTS.map((a, i) => `<div class="slot asp${i === aspect ? ' sel' : ''}" style="${i === aspect ? `border-color:${hex(a.color)}` : ''}"><i style="color:${hex(a.color)}">${a.glyph}</i><span>${a.name}</span><b>${i + 4}</b></div>`).join('')}`;
}
