// ---------------------------------------------------------------------------------------
// A TOOL'S SKIN, WORN: the runtime of the look table (vfx/toolskins.js TOOL_SKINS). Every model of a tool (the one in the hands, a copy
// for the Pneuka Box's picture, the tool's own UI where it draws the tool) says which of its materials play which ROLE (`wearSkin`), and
// the skin chosen for that tool is laid on them at once and again whenever it changes. A role's finish is the finish program's GLAZE kind
// (vfx/finish.js dressFinish, told it is a tool's part: vfx/toolpatterns.js), so a skin adds no shader program of its own: a material
// takes the program's `-fin` variant the first time a patterned skin is laid on it (lazily: a tool never skinned compiles nothing new),
// and a plain role (no pattern) only sets the material's colour, metal and gloss. Back to stock, every material is as it was made.
//
// What stays the tool's own: its shape (the psygun's variants, the coffins' emblems), its live looks (the charge's glow, the brush's ink,
// the vents' notes, the bead's dowsing light: the models go on setting them), and everything it does. A pattern is laid in a part's own
// space; a tool resting on the back is drawn as its rest bake (render/restbake.js), in the model's frame, so its grain may sit a little
// differently there than in the hands: a look the eye takes as the same wood.
//
// Two live inputs (vfx/toolpatterns.js uFinS): a clock for the skins that move (molten, the circuit, the glitch), and the tool's own
// state where a skin shows it: the Lockheart's fill in the glass reliquary (charge over twice its measure, as the reliquary's window shows it), the Crucibelle's last note in the
// glass bell (its vents' colours, as lit).
//
// Kept in the save as section `toolSkins`, scope `player` (a look the Courier has earned follows the Courier, as the vessel's glazes and
// the Solar Skiff's paint do: core/save.js; wiped on a new build with the rest of progress). Said by `toolskin.set` { tool, skin, by }
// (feedback/tracking/toolskins.js). DEBUG: `/toolskin` lists, `/toolskin <tool> <skin>` wears one. Which skins are open in STORY is
// Dovina's to rule (docs/handoffs/dovina/2026-10-24-from-calissa-tool-skins.md): until then a STORY save wears stock.
//
// Prior art: a weapon skin laid over one rig's materials (Counter-Strike's finishes, Destiny's shaders), and the house's own vessel
// dresser (courier/vessel/vessel.js dress: the same program, uniforms set from a finish).
//
//   wearSkin(tool, roles, { scale, zone, kind }) -> w   roles { role: material | [materials] }; scale: a multiplier on the patterns'
//     scale (a UI drawn in its own units); zone { role, y, x, stock } (a second finish on one mesh: the psygun's grip); kind 'sg' for
//     the Sondelass's guard (its overlay shader's uSgCol and uSgMet, colour only)
//   unwear(w)   skinNow(tool) -> id   skinPalette(tool) -> { role: '#rrggbb' } | null (stock)   (for a UI drawn on a canvas)
//   game.toolSkins = new ToolSkins(game)   .set(tool, id, { by })   .of(tool)   .update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dressFinish } from './finish.js';
import { TOOL_PATTERN } from './toolpatterns.js';
import { TOOL_SKINS, TOOL_LABEL, skinOf, skinIds } from './toolskins.js';

const WEARERS = new Set(); // (every model wearing a tool's look, by its roles)
const NOW = {};            // tool -> the skin worn (none: stock)
const _c = new THREE.Color();

/** The skin worn on this tool now. */
export const skinNow = (tool) => NOW[tool] || 'stock';

/** The skin's colours by role, as css hex, for a tool's UI drawn on a canvas (the Soul Brush's desk, the Lockheart's reliquary); null at stock. */
export function skinPalette(tool) {
  const s = skinOf(tool, NOW[tool]); if (!s.roles) return null;
  const out = {}; for (const [r, d] of Object.entries(s.roles)) out[r] = '#' + (d.c >>> 0).toString(16).padStart(6, '0');
  return out;
}

/** A model's materials, by role, wearing the tool's skin from now on (laid at once). */
export function wearSkin(tool, roles, { scale = 1, zone = null, kind = 'mat' } = {}) {
  const w = { tool, roles, scale, zone, kind };
  WEARERS.add(w); lay(w);
  return w;
}
export function unwear(w) { if (w) WEARERS.delete(w); }

const listOf = (m) => (Array.isArray(m) ? m : [m]).filter(Boolean);
function lay(w) {
  const skin = skinOf(w.tool, NOW[w.tool]);
  for (const [role, mats] of Object.entries(w.roles)) for (const m of listOf(mats)) put(m, skin.roles?.[role] || null, w, skin);
}

/** What a material was before any skin touched it. */
function was(m) {
  return (m.userData.skinWas ||= {
    color: m.color?.clone(), emissive: m.emissive?.clone(), ei: m.emissiveIntensity, metal: m.metalness, rough: m.roughness,
    sgCol: m.uniforms?.uSgCol?.value.clone(), sgMet: m.uniforms?.uSgMet?.value,
  });
}

function put(m, d, w, skin) {
  const o = was(m);
  if (w.kind === 'sg') { // the Sondelass's guard (vfx/sondelassguard/forms.js metal): its colour and how metal
    const U = m.uniforms; if (!U?.uSgCol) return;
    if (d) { U.uSgCol.value.setHex(d.c); U.uSgMet.value = d.metal ?? o.sgMet; } else { U.uSgCol.value.copy(o.sgCol); U.uSgMet.value = o.sgMet; }
    return;
  }
  const fin = m.userData.toolSkinned ? m.userData.finish : null;
  if (!d) { // back to stock
    if (o.color) m.color.copy(o.color);
    if (o.emissive) { m.emissive.copy(o.emissive); m.emissiveIntensity = o.ei; }
    if (o.metal !== undefined) { m.metalness = o.metal; m.roughness = o.rough; }
    if (fin) fin.uFinOn.value = 0;
    return;
  }
  if (!m.isMeshStandardMaterial) { if (m.color) m.color.setHex(d.c); return; } // (a basic material: the web, a thread: its colour only)
  m.metalness = d.metal ?? o.metal; m.roughness = d.rough ?? o.rough;
  if (d.e !== undefined && m.emissive) { m.emissive.setHex(d.e); if (d.ei !== undefined) m.emissiveIntensity = d.ei; }
  else if (o.emissive) { m.emissive.copy(o.emissive); m.emissiveIntensity = o.ei; }
  const z = w.zone ? skin.roles?.[w.zone.role] : null, pat = TOOL_PATTERN[d.p] || 0;
  if (!pat && !z && !d.keep) { m.color.setHex(d.c); if (fin) fin.uFinOn.value = 0; return; } // (plain: the material's own colour, no program change)
  m.color.copy(o.color); // (the glaze keeps the painting's light and shade by `keep`: read from the material as made)
  const u = dressFinish(m, 'glaze'); m.userData.toolSkinned = true;
  u.uFinOn.value = 1; u.uFinPart.value = 3; // (a tool's part: vfx/toolpatterns.js)
  u.uFinA.value.setHex(d.c); u.uFinB.value.setHex(d.b ?? d.c);
  u.uFinP.value.set(d.keep ?? 0, d.mid ?? 0.5, pat, (d.s ?? 10) * w.scale);
  if (z) { u.uFinM.value.set(1, w.zone.y, w.zone.x, w.zone.stock ?? -1e9); u.uFinC.value.setHex(z.c); u.uFinS.value.set(TOOL_PATTERN[z.p] || 0, (z.s ?? 10) * w.scale, 0, 0); }
  else { u.uFinM.value.set(0, 1, 0, 0); u.uFinC.value.set(1, 1, 1); u.uFinS.value.set(0, 0, 0, 0); }
}

export class ToolSkins {
  constructor(game) {
    this.game = game; this.t = 0;
    game.save?.section('toolSkins', { scope: 'player', version: 1,
      dump: () => ({ ...NOW }),
      load: (d) => { for (const k of Object.keys(NOW)) delete NOW[k]; for (const [tool, id] of Object.entries(d || {})) if (TOOL_SKINS[tool]?.[id] && id !== 'stock') NOW[tool] = id; this.relay(); },
      reset: () => { for (const k of Object.keys(NOW)) delete NOW[k]; this.relay(); } });
    game.chat?.add('toolskin', { debug: true, aliases: ['toolskins'],
      help: 'a tool\'s skin, looks only (DEBUG): /toolskin lists them; /toolskin soulbrush peacock; /toolskin psygun stock',
      run: ([tool, id]) => this.command(tool, id) });
  }

  /** Every wearer laid again (after a load). */
  relay() { for (const w of WEARERS) lay(w); }

  of(tool) { return skinNow(tool); }

  /** Wear skin `id` on `tool` (stock to take it off); false for an unknown tool or skin. */
  set(tool, id, { by = 'courier' } = {}) {
    if (!TOOL_SKINS[tool]?.[id]) return false;
    if (id === 'stock') delete NOW[tool]; else NOW[tool] = id;
    for (const w of WEARERS) if (w.tool === tool) lay(w);
    this.game.save?.dirty('toolSkins');
    this.game.events?.emit('toolskin.set', { tool, skin: id, by });
    return true;
  }

  command(tool, id) {
    const log = this.game.log;
    if (!tool || !TOOL_SKINS[tool]) {
      log?.say('system', `Tool skins: ${Object.keys(TOOL_SKINS).map((t) => `${t} (${skinIds(t).join(', ')})`).join('; ')}.`, { key: 'toolskin.list', throttle: 0.5 });
      return;
    }
    if (!id) { log?.say('system', `Your ${TOOL_LABEL[tool]}'s skins: ${skinIds(tool).join(', ')} (wearing ${skinNow(tool)}).`, { key: 'toolskin.list', throttle: 0.5 }); return; }
    if (!this.set(tool, id)) log?.say('warn', `The ${TOOL_LABEL[tool]} has no skin "${id}".`, { key: 'toolskin.none', throttle: 0.5 });
  }

  /** The skins that move: their clock, and the tool's own state where a skin shows it. */
  update(dt) {
    this.t += dt;
    const g = this.game, lh = g.lockheart, cr = g.crucibelle?.model;
    let note = 0; _c.setRGB(0, 0, 0);
    if (cr?.vents && NOW.crucibelle) { let sum = 0; for (const v of cr.vents) { note = Math.max(note, v.k); sum += v.k; _c.r += v.color.r * v.k; _c.g += v.color.g * v.k; _c.b += v.color.b * v.k; } if (sum > 0) _c.multiplyScalar(1 / sum); }
    const fill = lh ? Math.min(1, (lh.charge || 0) / (2 * Math.max(1, lh.fill || 1))) : 0; // (to twice its measure, as the reliquary's window fills)
    for (const w of WEARERS) {
      if (!NOW[w.tool] || w.kind !== 'mat') continue;
      for (const mats of Object.values(w.roles)) for (const m of listOf(mats)) {
        const u = m.userData.toolSkinned && m.userData.finish; if (!u || !u.uFinOn.value) continue;
        u.uFinS.value.w = this.t;
        if (w.tool === 'lockheart') u.uFinS.value.z = fill;
        else if (w.tool === 'crucibelle' && !u.uFinM.value.x) { u.uFinS.value.z = note; u.uFinC.value.copy(_c); }
      }
    }
  }
}
