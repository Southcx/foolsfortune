// ---------------------------------------------------------------------------------------
// THE ABERRANT INVERSION (a placeholder until an aberrant's own look; PUZZLE-DUELS.md 16.4, the owner, 2026-10-20: "an aberrant looks
// wrong at a glance"): an aberrant Figment drawn in its colours inverted, 1 minus each channel, beside its data bug (vfx/databug.js,
// which finds the aberrants and calls this). One job: give the body's meshes inverted copies of their materials and take them back.
//
// How, and why this way (the casebook's rule 242: a shared material is never changed by one of its users):
//   - Nothing the body owns is touched. Each of its meshes is given a CLONE of its material for as long as it is aberrant and alive; the
//     original stays where the body (and its look: the Lantern Wisp's flash, the slip jelly's colour each frame) keeps writing it, and
//     each frame the clone is synced from it: its colour inverted, its emissive, opacity and wireframe copied as they are (an emissive
//     inverted would light the body white; its flashes stay its own).
//   - A material with a map: the map is inverted instead, and the colour (its tint) copied; the inverted map is drawn once on a canvas
//     (a difference with white, the alpha kept) and cached by its texture, so every aberrant of a kind shares one.
//   - The clone keeps the original's parameters and its onBeforeCompile (the jelly's deformer, its uniforms the body's own), so it is
//     drawn by the program the original already has: NO new program, against a shader-side inversion (one onBeforeCompile on every
//     inverted material), which would compile a program for each material kind it met.
//   - Not inverted (said, not hidden): a material whose colour is in its vertices (the colour lives in the geometry) and a map that
//     cannot be drawn on a canvas (a compressed texture): those keep their own look.
// Back on `release(c)`: when it is mended, stops being aberrant, dies (before its scatter, which plays on the originals), or is gone.
//
// Prior art: the photographic negative, and the 8- and 16-bit games' palette swap to the opposite colours for a thing gone wrong
// (the same sprite, every colour turned to its opposite): legible at a glance, at no cost but a copy.
//
//   const I = new AberrantInversion()   I.hold(c)   I.release(c)   I.update()   I.has(c)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const INVERTED = new WeakMap(); // (a texture -> its inverted copy, shared by every user of it)

/** A texture's colours inverted (1 minus each channel, its alpha kept), drawn once on a canvas; null if it cannot be drawn. */
function invertedMap(tex) {
  if (INVERTED.has(tex)) return INVERTED.get(tex);
  let out = null;
  const img = tex.image, w = img?.width | 0, h = img?.height | 0;
  if (w > 0 && h > 0 && !tex.isCompressedTexture && !tex.isDataTexture && typeof document !== 'undefined') {
    try {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0); // (its alpha back as it was)
      out = new THREE.CanvasTexture(cv);
      for (const k of ['colorSpace', 'flipY', 'wrapS', 'wrapT', 'magFilter', 'minFilter', 'anisotropy', 'generateMipmaps', 'channel', 'rotation', 'premultiplyAlpha']) out[k] = tex[k];
      out.repeat.copy(tex.repeat); out.offset.copy(tex.offset); out.center.copy(tex.center);
      out.name = (tex.name || 'map') + '-inverted';
    } catch { out = null; } // (a tainted or undrawable image: the map is left as it is)
  }
  INVERTED.set(tex, out);
  return out;
}

/** The inverted copy of one material, or null where it cannot be (its colour in its vertices, no colour at all). */
function invertedCopy(m) {
  if (!m?.color || m.vertexColors) return null;
  const inv = m.map ? invertedMap(m.map) : null;
  if (m.map && !inv) return null;
  const k = m.clone();
  k.onBeforeCompile = m.onBeforeCompile; k.customProgramCacheKey = m.customProgramCacheKey; // (the same program: the deformer's injection and its key)
  if (inv) k.map = inv;
  k.name = (m.name || 'material') + '-inverted'; k.userData = { ...m.userData, inverted: true, shared: false };
  return { k, mapped: !!inv };
}

export class AberrantInversion {
  constructor() { this.held = new Map(); } // (creature -> [{ o, slot, m, k, mapped }])

  has(c) { return this.held.has(c); }

  /** The creature's meshes given their inverted copies. */
  hold(c) {
    if (this.held.has(c)) return;
    const list = [];
    (c.root || c.body)?.traverse?.((o) => {
      if (!o.isMesh || !o.material || o.name?.startsWith?.('databug')) return; // (its own veins and glints stay what they are)
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m, slot) => {
        const r = invertedCopy(m); if (!r) return;
        list.push({ o, slot: Array.isArray(o.material) ? slot : -1, m, k: r.k, mapped: r.mapped });
        if (Array.isArray(o.material)) { o.material = o.material.slice(); o.material[slot] = r.k; } else o.material = r.k;
      });
    });
    this.held.set(c, list);
    this.sync(list);
  }

  /** The originals given back, the copies disposed (the inverted maps stay cached for the next one). */
  release(c) {
    const list = this.held.get(c); if (!list) return;
    for (const e of list) {
      if (e.slot >= 0 && Array.isArray(e.o.material) && e.o.material[e.slot] === e.k) { e.o.material = e.o.material.slice(); e.o.material[e.slot] = e.m; }
      else if (e.o.material === e.k) e.o.material = e.m;
      e.k.dispose();
    }
    this.held.delete(c);
  }

  /** Each copy synced from its original, as the body wrote it this frame. */
  sync(list) {
    for (const { m, k, mapped } of list) {
      if (mapped) k.color.copy(m.color); else k.color.setRGB(1 - m.color.r, 1 - m.color.g, 1 - m.color.b);
      if (m.emissive && k.emissive) k.emissive.copy(m.emissive);
      if (m.emissiveIntensity !== undefined) k.emissiveIntensity = m.emissiveIntensity;
      k.opacity = m.opacity; k.wireframe = m.wireframe; k.visible = m.visible;
    }
  }

  update() { for (const list of this.held.values()) this.sync(list); }
}
