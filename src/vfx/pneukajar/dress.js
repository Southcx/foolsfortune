// ---------------------------------------------------------------------------------------
// THE JAR, FIRED IN THE VESSEL'S LOOKS (the owner, 2026-10-24: the Pneuka Jar "doesn't reflect the glazes used by the Courier model"):
// the materials of every form of the Pneuka Jar, each region of the vessel (courier/vessel/glazes.js REGIONS) on the Jar's part that is
// it: the BODY glaze on its swells, the TRIM on its bands (the foot, the waist's line, the neck's line, the lip), the MASK on its face,
// the STONES on its five gems (the gem and its mineral: vfx/stoneminerals.js), the HAIR on any cord (a pendant's, the basket's hoop),
// the SKIN and the soul colour as its inner light; a rare glaze's kiln pattern on the body as on the Courier, and the kintsugi's cracks
// and gold (courier/vessel/kintsugi.js) on the vessel's own uniforms, so a crack the Courier takes shows on the Jar and mends with it.
// What the Prince made is what the owner painted: a region in its starting glaze shows the owner's painting untouched.
//
// One program: every material here is the house's painted material (vfx/vessoulpaint.js vessoulPainted) with the vessel's finish
// (vfx/finish.js dressFinish, its kind a uniform) and the kintsugi chained on, skinned; a part with no painting carries a 1 x 1 white
// texture so its chain is the same, and a glaze on it is the glaze's colour whole (no painting's light and shade to keep).
//
// Prior art: the guest's Pneuka Jar (vfx/garden/guestjars.js: the owner's Jar fired in a body glaze, its light in the trim), the glaze
// test tile (one form, many glazes), FFXIV's dye channels (a colour per channel of one model), and the vessel's own dressing
// (courier/vessel/vessel.js dress: own look kept, painting as light and shade, the eye's and the dip's own light).
//
//   const M = new JarMaterials(paintingMap, kinU?, soul?)   M.m.body / trim / mask / partBody / partTrim / partMask / gold / cork /
//     stones / hair / seal   M.dress(look, glazeOf) (look: the vessel's; glazeOf: id -> glaze, the learned ones too)   M.flash(f)
//   M.inner (THREE.Color: the inner light, the skin's glow under the soul colour)   M.bodyColor (the body's colour, for a hop's dye)
//   M.forPart(name) -> the material a part asks for by name (vfx/pneukajar/parts.js)   M.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLAZES, DEFAULT_LOOK } from '../../courier/vessel/glazes.js';
import { dressFinish, ownLight, FIN_KIND } from '../finish.js';
import { dressStone } from '../stoneminerals.js';
import { vessoulPainted, PAINT_LIGHT } from '../vessoulpaint.js';
import { addKintsugi, kintsugiUniforms } from '../../courier/vessel/kintsugi.js';
import { PALETTE } from '../../core/config.js';

/** The owner's painting's own colours, for a part beside a region still in its starting glaze (measured off the painting). */
const PAINTED = { body: 0x6e1c1a, trim: 0xe6cfa6, mask: 0x7a2420 };
const GOLD = 0xd8a840, CORK = 0xa88458, SPAN = 1.2; // (the Jar's height: a kiln pattern at the Courier's scale on it)
const STONE_R = 0.035; // (a gem's radius on the Jar, model units: its mineral's scale)
let WHITE = null;
const white = () => {
  if (WHITE) return WHITE;
  WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); WHITE.colorSpace = THREE.SRGBColorSpace; WHITE.needsUpdate = true;
  return WHITE;
};

export class JarMaterials {
  constructor(painting, kinU = kintsugiUniforms(), soul = new THREE.Vector4()) {
    this.kinU = kinU; this.soul = soul; this.inner = new THREE.Color(PALETTE.glow); this.bodyColor = new THREE.Color(PAINTED.body);
    const mk = (map, name) => { const m = vessoulPainted(map, { roughness: 0.6 }); m.name = `PneukaJar_${name}`; dressFinish(m, 'glaze'); addKintsugi(m, kinU); return m; };
    this.m = {};
    for (const r of ['body', 'trim', 'mask']) this.m[r] = mk(painting, r);
    for (const n of ['partBody', 'partTrim', 'partMask', 'gold', 'cork', 'stones', 'hair', 'seal']) this.m[n] = mk(white(), n);
    this.flashK = 0;
  }
  /** The material a part asks for by name (parts.js). */
  forPart(name) { return { body: this.m.partBody, trim: this.m.partTrim, mask: this.m.partMask, gold: this.m.gold, cork: this.m.cork, stones: this.m.stones, hair: this.m.hair }[name] || this.m.partBody; }

  /** Fire the vessel's look on every material (`glazeOf`: the vessel's own resolver, so a learned glaze is found too). */
  dress(look = DEFAULT_LOOK, glazeOf = (id) => GLAZES[id]) {
    const G = (r, kinds) => { const g = glazeOf(look[r]); return g && kinds.includes(g.kind || 'glaze') ? g : GLAZES[DEFAULT_LOOK[r]]; };
    for (const r of ['body', 'trim', 'mask']) {
      const g = G(r, ['glaze']), own = g.keep || g.id === DEFAULT_LOOK[r];
      this.glaze(this.m[r], own ? null : g, { painted: true, part: r === 'trim' ? 1 : 0 });
      this.glaze(this.m[`part${r[0].toUpperCase()}${r.slice(1)}`], own ? { color: PAINTED[r], rough: 0.6, metal: 0 } : g, { part: r === 'trim' ? 1 : 0 });
      if (r === 'body') this.bodyColor.setHex(own ? PAINTED.body : g.color);
    }
    this.glaze(this.m.gold, { color: GOLD, rough: 0.22, metal: 0.85 }, {});
    this.glaze(this.m.cork, { color: CORK, rough: 0.9, metal: 0 }, {});
    this.glaze(this.m.seal, null, { painted: true });
    // the hair: a hair finish (its root, its tips, its sheen) or a glaze on a cord
    const h = G('hair', ['hair', 'glaze']), H = this.m.hair, U = H.userData.finish;
    if (h.kind === 'hair') {
      U.uFinOn.value = 1; U.uFinKind.value = FIN_KIND.hair; U.uFinA.value.setHex(h.color); U.uFinB.value.setHex(h.color2 ?? h.color);
      U.uFinP.value.set(h.p[0], 0.25, h.p[2], 0.48); H.color.setHex(0xffffff); H.roughness = h.rough; H.metalness = h.metal; rest(H, h.color, PAINT_LIGHT * 0.5);
    } else this.glaze(H, h, {});
    // the skin: the inner light's colour (its glow), the soul colour over it
    const s = G('skin', ['skin']); this.skinGlow = new THREE.Color(s.keep ? PALETTE.glow : (s.color2 ?? s.color)); this.skinRow = s;
    // the stones: the five gems, in the gem and its mineral; the Maker's keep the core's own light
    const st = G('stones', ['gem']), S = this.m.stones, SU = S.userData.finish;
    if (st.keep) {
      SU.uFinOn.value = 1; SU.uFinKind.value = FIN_KIND.skin; SU.uFinA.value.setHex(PALETTE.cream); SU.uFinB.value.copy(this.skinGlow); SU.uFinP.value.set(0.25, 0.35, s.p?.[2] ?? 0, 0);
      SU.uFinS.value = this.soul; S.roughness = 0.4; S.metalness = 0; S.color.setHex(0xffffff); this.gem = false;
    } else { SU.uFinKind.value = FIN_KIND.gem; dressStone(SU, S, st.id, { radius: STONE_R }); this.gem = true; }
    rest(S, 0xffffff, 0);
  }
  /** One material in a glaze (null: the painting as the owner painted it). */
  glaze(m, g, { painted = false, part = 0 } = {}) {
    const U = m.userData.finish; U.uFinKind.value = FIN_KIND.glaze; U.uFinPart.value = part;
    if (!g) { U.uFinOn.value = 0; m.color.setHex(0xffffff); m.roughness = 0.6; m.metalness = 0; rest(m, 0xffffff, PAINT_LIGHT); return; }
    U.uFinOn.value = 1; U.uFinA.value.setHex(g.color); U.uFinB.value.setHex(g.color2 ?? g.color);
    U.uFinP.value.set(painted ? 2.0 : 0, painted ? lumaMean(m) : 0.5, g.pattern || 0, 1 / SPAN);
    m.color.setHex(0xffffff); m.roughness = g.rough; m.metalness = g.metal;
    rest(m, ownLight(g.pattern) ? 0xffffff : g.color, painted ? PAINT_LIGHT : PAINT_LIGHT * 0.5 + (g.glow || 0));
  }
  /** The inner light this frame: the skin's glow, under the soul colour as strongly as the soul is saturated. */
  innerLight() { const S = this.soul; return this.inner.copy(this.skinGlow).lerp(_c.setRGB(S.x, S.y, S.z), Math.min(1, S.w * 1.25)); }
  /** A blow's flash (> 0, hot) or a mend's warmth (< 0) on every glazed material, from its rest (vessoulpaint.js paintFlash's own sums). */
  flash(f = 0) {
    const hot = Math.max(0, f), warm = Math.max(0, -f);
    for (const m of Object.values(this.m)) {
      if (m === this.m.stones) continue; const R = m.userData.rest;
      m.emissive.setHex(R.em); m.emissive.r *= 1; m.emissive.g *= 1 - 0.25 * hot; m.emissive.b *= 1 - 0.45 * hot;
      m.emissiveIntensity = R.emI * (1 + 2.2 * hot + 0.8 * warm);
    }
  }
  dispose() { for (const m of Object.values(this.m)) m.dispose(); }
}
const _c = new THREE.Color();
function rest(m, em, emI) { m.userData.rest = { em, emI }; m.emissive.setHex(em); m.emissiveIntensity = emI; }

/** The painting's mean lightness (a glaze keeps it as light and shade around it), measured once. */
function lumaMean(m) {
  if (m.userData.lumaMean != null) return m.userData.lumaMean;
  let v = 0.3;
  try {
    const img = m.map?.image; if (!img?.width) return v; // (not loaded yet: the default, measured again next time)
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data; let s = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8) { s += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255; n++; }
    if (n) v = s / n;
  } catch { return v; }
  return (m.userData.lumaMean = v);
}
