// ---------------------------------------------------------------------------------------
// SELF-LIT: a surface that shows exactly the colour it is given. The frame is drawn light-linear and then put through the glow's
// composite (render/glow.js): the tone curve (ACES filmic at the renderer's exposure), the screen's colour space and the grade (the
// shadows toward indigo, the light toward the kiln's warmth). That is right for a lit world and wrong for a colour that must be read
// true, as the spirit press's glazes must (docs/plans/SOUL-ALCHEMY.md 4.3: the tiles, the seals' glaze, the soul bead, the ghost paths
// and the droplets are self-lit and unfogged, so neither the game hour nor the haze shifts a hue). `selfLit()` runs the composite
// backwards on the colour a shader wants seen (linear sRGB): the grade undone (two fixed-point steps; it is gentle), the sRGB curve,
// then ACES's output matrix, its fitted curve (a quadratic, solved) and its input matrix inverted. Where the glow is off (glow and grade
// both 0) the renderer tone-maps per material instead, and a self-lit material is drawn with `toneMapped: false` and given as it is.
// Nothing self-lit is brighter than 0.85 linear in any channel (sRGB 0.93): past that the inverse runs into light the glow would bloom,
// and a white porcelain tile seen small would wear a halo.
//
// Prior art: the inverse tone-mapping of UI and video planes composited into an HDR frame (a "paper white" overlay drawn so that it
// comes out of the tone curve as authored), and three.js's own ACES fit (tonemapping_pars_fragment), inverted term by term.
//
//   uniforms: { ...selfLitUniforms() }     fragment: SELF_LIT_GLSL above main(), then gl_FragColor = vec4( selfLit( want ), a );
//   #include <colorspace_fragment> last      each frame: syncSelfLit(uniforms) (reads T.visual: exposure, glow, grade)
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';

export const selfLitUniforms = () => ({ uExposure: { value: 1.2 }, uGrade: { value: 1 }, uPost: { value: 1 } });
/** The frame's settings, as the composite will use them this frame. */
export function syncSelfLit(u) {
  const V = T.visual || {};
  u.uExposure.value = V.exposure ?? 1.2; u.uGrade.value = V.grade ?? 0;
  u.uPost.value = (V.glow ?? 0) > 0 || (V.grade ?? 0) > 0 ? 1 : 0; // (render/glow.js: on while either is above nothing)
}

export const SELF_LIT_GLSL = /* glsl */`
uniform float uExposure, uGrade, uPost;
vec3 slEnc( vec3 c ) { c = max( c, 0.0 ); return mix( pow( c, vec3( 0.41666 ) ) * 1.055 - 0.055, c * 12.92, vec3( lessThanEqual( c, vec3( 0.0031308 ) ) ) ); }
vec3 slDec( vec3 c ) { c = max( c, 0.0 ); return mix( pow( ( c + 0.055 ) / 1.055, vec3( 2.4 ) ), c / 12.92, vec3( lessThanEqual( c, vec3( 0.04045 ) ) ) ); }
vec3 slUngrade( vec3 w ) {
  vec3 d = w;
  for ( int i = 0; i < 2; i++ ) {
    float l = dot( d, vec3( 0.299, 0.587, 0.114 ) );
    vec3 m = mix( vec3( 1.0 ), vec3( 1.035, 1.0, 0.95 ), uGrade * smoothstep( 0.45, 1.0, l ) );
    d = w / m - uGrade * ( 1.0 - l ) * ( 1.0 - l ) * vec3( -0.016, -0.006, 0.042 );
  }
  return clamp( d, 0.0, 1.0 );
}
vec3 slUnACES( vec3 y ) {
  const mat3 INV_OUT = mat3( vec3( 0.643038, 0.059269, 0.005962 ), vec3( 0.311187, 0.931436, 0.063929 ), vec3( 0.045775, 0.009295, 0.930118 ) );
  const mat3 INV_IN = mat3( vec3( 1.764741, -0.147028, -0.036337 ), vec3( -0.675778, 1.160252, -0.162436 ), vec3( -0.088963, -0.013224, 1.198773 ) );
  vec3 w = clamp( INV_OUT * y, 0.0, 0.995 );
  vec3 A = 1.0 - 0.983729 * w, B = 0.0245786 - 0.4329510 * w, C = -( 0.000090537 + 0.238081 * w );
  vec3 v = ( -B + sqrt( max( B * B - 4.0 * A * C, 0.0 ) ) ) / ( 2.0 * A );
  return max( INV_IN * v, 0.0 ) * ( 0.6 / max( uExposure, 1e-3 ) );
}
/** The light-linear colour that the composite turns into \`want\` (linear sRGB) on the screen. */
vec3 selfLit( vec3 want ) { want = min( want, vec3( 0.85 ) ); return uPost > 0.5 ? slUnACES( slDec( slUngrade( slEnc( want ) ) ) ) : want; } // (no channel past 0.85: brighter would be light past the glow's knee, and bloom)
`;
