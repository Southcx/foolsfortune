// ---------------------------------------------------------------------------------------
// THE GREY TINT: a texture painted in greys and coloured by its material's colour, so one painting serves every colour the game gives
// the thing (the clapperjar's: the owner's grey texture, source_assets/clapperjar_base.png, under the Courier's terracotta, the kiln's
// white heat, a raider's red, a turned jar's cream). The painting's REFERENCE grey (the body's own) is the colour exactly; darker greys
// darken it toward black (a multiply), lighter greys lift it toward white (a screen), so a colour set on the material reads as itself
// and the painting's lights and darks read on any colour. A plain multiply (three.js's map) would put every colour at the grey's
// share of itself: the clapperjar's body grey (102 of 255) is 13% in linear light, and the jar went near black.
//
// Prior art: Photoshop's Overlay blend (multiply under mid grey, screen over it) and its Colorize; Team Fortress 2's paintable items
// (a grey base texture under the paint colour, $color2 with $blendtintbybasealpha: Valve's developer wiki); here, finish.js's GLAZE
// (the maker's painting kept as light and shade under a glaze colour) for a shader chained onto a three.js material.
//
//   const map = greyTexture(b64)                     the texture: sRGB, glTF's UVs (flipY false), mipmapped, Nearest only up close
//   const m = greyTint(material, map, 102 / 255)     the material's colour now tints the painting (the reference: the body's grey)
//   const each = cloneTinted(m)                      a copy for one thing (its own colour to change), the tint and the rim kept
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The painting: a PNG's base64 as a texture. The Nearest close up keeps a pixel painting's edges crisp (the owner's .blend draws it
 *  with "Closest"); the mipmaps keep it from crawling far off. */
export function greyTexture(b64) {
  const t = new THREE.TextureLoader().load(`data:image/png;base64,${b64}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // (glTF's UV convention)
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 4;
  return t;
}

// the map's sample, read as a grey against the reference (both in linear light: the texture is decoded from sRGB as it is sampled)
const CHUNK = `
#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	float greyK = sampledDiffuseColor.g;
	diffuseColor.rgb = greyK <= GREY_REF
		? diffuseColor.rgb * ( greyK / GREY_REF )
		: mix( diffuseColor.rgb, vec3( 1.0 ), ( greyK - GREY_REF ) / ( 1.0 - GREY_REF ) );
#endif
`;
// (one function and one key for every tinted material, so every copy shares one program)
const patch = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', CHUNK); };
const key = () => 'greytint';
const linear = (c) => (c < 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); // (sRGB's transfer, as three.js decodes the texture)

/** The material's colour tints `map` about `ref`, the painting's own grey for "the colour exactly" (0..1 as painted, in sRGB). */
export function greyTint(m, map, ref = 0.5) {
  m.map = map;
  m.defines = { ...(m.defines || {}), GREY_REF: linear(ref).toFixed(4) };
  m.onBeforeCompile = patch;
  m.customProgramCacheKey = key;
  m.needsUpdate = true;
  return m;
}

/** A copy that keeps what three.js's Material.copy drops: the defines (a Standard material's are reset to STANDARD alone, which took the
 *  rim off every cloned clapperjar: render/toon.js addRim) and the shader hook. */
export function cloneTinted(m) {
  const c = m.clone();
  c.defines = { ...m.defines };
  c.onBeforeCompile = m.onBeforeCompile;
  c.customProgramCacheKey = m.customProgramCacheKey;
  return c;
}
