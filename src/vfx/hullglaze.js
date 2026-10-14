// ---------------------------------------------------------------------------------------
// A HULL GLAZE (docs/plans/SKIFF-RACING.md section 12; Dovina's handoff of 2026-10-14, item 12; the owner took "skiff parts and hull
// glazes"): the Solar Skiff's hull fired with one of the vessel's glazes (courier/vessel/glazes.js GLAZES, the glaze kind only), at the
// kiln (courier/vessel/kilnui.js's HULL tab) and at the kiln's price. Kept by Dovina's save section (`skiffGlaze`, progress/skiffparts.js:
// `game.skiffParts.glaze()`, set with `setGlaze(id)`, which emits skiff.glaze { glaze }); the board's material takes it in boat.js.
// The hull is the house's painted material (vfx/vessoulpaint.js), so the glaze is laid on as a pot's is over its slip painting: the
// painting's colour multiplied toward the glaze's (HULL_GLAZE.tint), the glaze's own sheen (its roughness, its metal held under half: a
// hull is never a mirror), the painting's own glow left as it was, so its lines still read through the glaze. Only uniforms change: the
// same program. A kiln pattern (yohen's stars, guan's crackle) is the vessel's finish shader's and is not laid here: the hull takes the
// pattern's ground colour. Also the sibling riders' boards (vfx/racewayrivals.js: each in its division's body glaze).
//
// Prior art: the glaze over a painted slip (Mishima, slip-trailed ware: the painting shows through the glaze's colour), Mario Kart 8's
// kart colours and FFXIV's dyes (a look laid over the model's own texture, never a new model).
//
//   glazeHull(material, glaze | id | null)   (null: as the maker painted it)   HULL_GLAZE (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLAZES } from '../courier/vessel/glazes.js';

/** How far the painting's colour is taken toward the glaze's (0 none .. 1 all of it); the most metal a hull takes. */
export const HULL_GLAZE = { tint: 0.8, metal: 0.45 };

const _c = new THREE.Color();

/** Lay a glaze (a GLAZES entry, its id, or a learned one) on a hull's painted material, or take it off (null). */
export function glazeHull(m, glaze) {
  if (!m?.color) return;
  const base = (m.userData.unglazed ||= { color: m.color.getHex(), rough: m.roughness, metal: m.metalness });
  const g = typeof glaze === 'string' ? GLAZES[glaze] : glaze;
  if (!g || (g.kind && g.kind !== 'glaze')) { m.color.setHex(base.color); m.roughness = base.rough; m.metalness = base.metal; m.userData.hullGlaze = null; return; }
  m.color.setHex(base.color).lerp(_c.setHex(g.color), HULL_GLAZE.tint);
  m.roughness = g.rough ?? base.rough; m.metalness = Math.min(HULL_GLAZE.metal, g.metal ?? 0);
  m.userData.hullGlaze = g.id;
}
