// ---------------------------------------------------------------------------------------
// THE FIGMENT ATTACK TELEGRAPHS' GLYPH ATLAS: every glyph a Figment attack telegraph wears (ui/icons/figmenttelegraphart.js: the answers,
// the marks, the statuses), painted in the icons' hand (ui/icons/hand.js: bevelled, keylined) as greys into one texture, each at three
// times its pixels in a 64 px cell with an 8 px gutter, so its mips never bleed into a neighbour down to an 8 px cell. The program colours
// it (the tone is the grey; tone 0, the keyline, stays ink): one drawing, every tint, as the HUD's icons are one drawing and many palettes
// (ui/icons/icons.js). Mipmapped and filtered (LinearMipmapLinear, anisotropic): a glyph seen far or at a slant is smoothed, never
// crawling.
//
// Prior art: the sprite atlas of every console (one texture, a cell a sprite), the pixel kit's whole-number scaling (ui/pixel.js), and
// the padded atlas of texture streaming (a gutter so a mip never reads its neighbour).
//
//   figmentTelegraphAtlas() -> THREE.Texture (made once)      cellOf(id) -> index ('answer.out', 'figmentMark.eye', 'status.stun' ...)
//   ATLAS = { cols: 8, rows: 4, inset: 0.125 }          ATLAS_IDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { toneGrid } from '../../ui/icons/hand.js';
import { ANSWER_ART, STATUS_ART, FIGMENT_MARK_ART } from '../../ui/icons/figmenttelegraphart.js';

export const ATLAS = { cols: 8, rows: 4, cell: 64, scale: 3, inset: 0.125 };
export const ATLAS_IDS = [
  ...Object.keys(ANSWER_ART).map((k) => `answer.${k}`), ...Object.keys(FIGMENT_MARK_ART).map((k) => `figmentMark.${k}`), ...Object.keys(STATUS_ART).map((k) => `status.${k}`),
];
const ART = { ...Object.fromEntries(Object.entries(ANSWER_ART).map(([k, v]) => [`answer.${k}`, v])), ...Object.fromEntries(Object.entries(FIGMENT_MARK_ART).map(([k, v]) => [`figmentMark.${k}`, v])), ...Object.fromEntries(Object.entries(STATUS_ART).map(([k, v]) => [`status.${k}`, v])) };
export const cellOf = (id) => Math.max(0, ATLAS_IDS.indexOf(id));

let tex = null;
/** The atlas, painted on first use and kept (a canvas texture: one upload). */
export function figmentTelegraphAtlas() {
  if (tex) return tex;
  const { cols, rows, cell, scale } = ATLAS, c = document.createElement('canvas');
  c.width = cols * cell; c.height = rows * cell;
  const g = c.getContext('2d'), img = g.createImageData(c.width, c.height);
  ATLAS_IDS.forEach((id, n) => {
    const { w, h, tones } = toneGrid(ART[id]), ox = (n % cols) * cell + (cell - w * scale) / 2, oy = Math.floor(n / cols) * cell + (cell - h * scale) / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = tones[y * w + x]; if (t < 0) continue;
      const v = Math.round((t / 11) * 255);
      for (let j = 0; j < scale; j++) for (let i = 0; i < scale; i++) { const o = ((oy + y * scale + j) * c.width + ox + x * scale + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255; }
    }
  });
  g.putImageData(img, 0, 0);
  tex = new THREE.CanvasTexture(c);
  tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; // (greys read as numbers: the program colours them)
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.generateMipmaps = true;
  tex.userData.shared = true;
  return tex;
}
