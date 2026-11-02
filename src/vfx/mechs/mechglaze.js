// ---------------------------------------------------------------------------------------
// THE MECH IN THE COURIER'S GLAZES (plain name; South, 2026-11-02: "lets copy the courier's materials as part of the Pneuka Jar 'install'
// process, transitioning from a 'blank' mech into the courier's own colors ... the mechs utilize the same material as the courier's glaze
// and interstitial material the same as the courier skin"): a mech's shell worn as the vessel is, its three materials (the parts body's
// `mats`, vfx/mechs/partsbody.js) each given the vessel region's finish (vfx/finish.js, the same program the Courier wears):
//   the plates (`porcelain`)    the BODY glaze, the plates' own vertex tones kept as light and shade (as a glaze keeps a painting's)
//   the accents (`trim`)        the TRIM glaze: the pauldrons, the bands, the crests
//   the core (`core`)           the SKIN: the Lachryma under the shell, its glow, its pattern and the soul colour over it
// A rare glaze's kiln pattern rides the plates at the frame's scale. The blank the frame wears before a Jar is in it (`MECH_BLANK`), and
// the wave that paints the Courier's colours on, are the mount's (vfx/mechs/mount.js); this only lays the finishes. Looks only.
// Prior art: the vessel's own dresser (courier/vessel/vessel.js `dress`: the glaze, the skin and the soul by region), the Pneuka Jar
// fired in the vessel's looks (vfx/pneukajar/dress.js), Evangelion's units in their pilots' colours, Medabots' medal in a tinpet.
//
//   dressMech(body, game)   MECH_BLANK (the frame's blank colours)   MECH_GLAZE (how much of the plates' tones a glaze keeps)
// ---------------------------------------------------------------------------------------
import { dressFinish } from '../finish.js';
import { dressSkin } from '../skinpatterns.js';
import { GLAZES, DEFAULT_LOOK } from '../../courier/vessel/glazes.js';
import { PALETTE } from '../../core/config.js';

/** The frame before a Jar is in it: the plates and the trim fired bisque (biscuit, unglazed), the core a dull grey stone with no light. */
export const MECH_BLANK = { bisque: 0xe8dcc6, trim: 0xcdb99a, core: 0x4a4644 };
/** A glaze on the plates keeps their vertex tones as light and shade (vessel.js: a painted part's 2.0 against its mean lightness). */
export const MECH_GLAZE = { shade: 1.4, mean: 0.62, span: 1 / 14 };

/** The vessel's look (the one fired now) laid on the body's plates, trim and core. */
export function dressMech(body, game) {
  const m = body?.mats; if (!m) return;
  const V = game?.vessel, look = V?.look || DEFAULT_LOOK, glazeOf = (id) => V?.glaze?.(id) ?? GLAZES[id];
  const pick = (r, kinds) => { const g = glazeOf(look[r]); return g && kinds.includes(g.kind || 'glaze') ? g : GLAZES[DEFAULT_LOOK[r]]; };
  for (const [mat, region, part] of [[m.porcelain, 'body', 0], [m.trim, 'trim', 1]]) {
    if (!mat) continue;
    const g = pick(region, ['glaze']), U = dressFinish(mat, 'glaze');
    U.uFinOn.value = 1; U.uFinA.value.setHex(g.color); U.uFinB.value.setHex(g.color2 ?? g.color);
    U.uFinP.value.set(MECH_GLAZE.shade, MECH_GLAZE.mean, g.pattern || 0, MECH_GLAZE.span); U.uFinPart.value = part;
    mat.color.setHex(0xffffff); mat.roughness = g.rough; mat.metalness = g.metal;
    mat.emissive?.setHex(g.glow ? PALETTE.glow : 0x000000); mat.emissiveIntensity = g.glow || 0;
  }
  if (m.core) {
    const g = pick('skin', ['skin']), U = dressFinish(m.core, 'skin');
    U.uFinOn.value = 1; U.uFinA.value.setHex(g.color); U.uFinB.value.setHex(g.color2 ?? g.color);
    U.uFinP.value.set(...(g.p || [0, 0, 0, 0])); dressSkin(U, g.look, 14);
    if (V?.soul) U.uFinS.value = V.soul; // (the soul colour over it, as on the Courier)
    m.core.color.setHex(0xffffff); m.core.roughness = g.rough ?? 0.5; m.core.metalness = g.metal ?? 0;
    m.core.emissive?.setHex(g.glow ? PALETTE.glow : 0x000000); m.core.emissiveIntensity = g.glow || 0;
  }
}
