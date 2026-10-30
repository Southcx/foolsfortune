// ---------------------------------------------------------------------------------------
// THE DECOR PIECES: a model for each of the pieces of progress/decor.js (47, and the 24 of three sets proposed to Dovina, 2026-10-24) (GARDEN-COZY.md D; the pieces are Calissa's, the catalogue and
// the layer under them Dovina's and Petra's). Soft, chunky, rounded toy forms in the cave abode's vocabulary of vfx/garden/features.js,
// low poly, readable from the hand's overhead view at about 50 degrees, sized to the piece's cells (a metre a cell) and standing on its
// origin, +Y up, front +Z. Each geometry carries a vertex colour (the BODY white, so the instance's set colour x tint paints it; the fixed
// accents their own: stone, wood, paper, moss, a lamp's warm yellow), `tintk` (how much of the instance colour a vertex takes: the body 1,
// an accent 0, so a gold ghost or a tint never turns a stone grey) and `glowk` (a lamp's face, lit by the hour). The pieces are built by
// set in decorpieces/ (kit.js is the builder). ONE material still serves all: decorMaterial() patches it in place, no second program.
// A part that moves (a wheel's head, a deer scarer's tip, an armillary's rings) or a fire that wavers carries `motion` (kit.js MOTION),
// turned in the vertex shader about its pivot by the real clock and the instance's index (so two copies never move in step).
//
// Prior art: Animal Crossing: New Horizons' furniture (a body that takes a variant's colour, fixed trim), the Chao Garden's toy forms,
// the Japanese garden's vocabulary (toro, tsukubai, chashitsu, yatsuhashi), three.js's onBeforeCompile for per-vertex tint and glow,
// and the vertex-animation texture-less trick of games' foliage and props (a pivot and a kind a vertex, moved in the shader: Unreal's
// pivot painter, much reduced).
//
//   decorGeometry(id) -> BufferGeometry (built once, cached)   DECOR_PIECE_IDS   decorMaterial(mat, game) (vertexColors, tint and lamp glow)
//   decorTriangles() -> { id: triangles }
// ---------------------------------------------------------------------------------------
import { Piece } from './decorpieces/kit.js';
import { PLAIN } from './decorpieces/plain.js';
import { WARM } from './decorpieces/warm.js';
import { COOL } from './decorpieces/cool.js';
import { SEASONS } from './decorpieces/seasons.js';
import { TEAPATH } from './decorpieces/teapath.js';
import { KILNYARD } from './decorpieces/kilnyard.js';
import { STARGAZER } from './decorpieces/stargazer.js';

const BUILD = { ...PLAIN, ...WARM, ...COOL, ...SEASONS, ...TEAPATH, ...KILNYARD, ...STARGAZER };
export const DECOR_PIECE_IDS = Object.keys(BUILD);
const cache = {};

/** The model of one piece by id (built on first ask, then shared). */
export function decorGeometry(id) {
  if (!cache[id]) { const build = BUILD[id] || BUILD.rock, p = new Piece(); build(p); cache[id] = p.done(); }
  return cache[id];
}

/** Triangles a piece. */
export const decorTriangles = () => Object.fromEntries(DECOR_PIECE_IDS.map((id) => [id, decorGeometry(id).attributes.position.count / 3]));

/** The decor material taught the pieces' attributes: vertex colour (mixed with the instance colour by `tintk`) and lamp glow by the hour.
 *  The same material, patched before its first compile; every geometry on it must carry color, tintk and glowk (mergeParts does); `motion` is optional (missing, it reads 0: still). */
/** The camera's near fade on every garden piece and facility (metres: wholly gone at the first, whole at the second). */
export const DECOR_NEAR = [2.5, 6];

export function decorMaterial(mat, game) {
  const lamps = { value: 0 }, ghost = { value: -1 }, time = { value: 0 };
  mat.vertexColors = true; mat.userData.lamps = lamps;
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = `#define DECOR_NEAR vec2( ${DECOR_NEAR[0].toFixed(2)}, ${DECOR_NEAR[1].toFixed(2)} )\n` + sh.fragmentShader;
    sh.uniforms.uLamps = lamps; sh.uniforms.uGhost = ghost; sh.uniforms.uTime = time;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute float tintk; attribute float glowk; attribute vec4 motion; varying float vGlow; uniform float uGhost; uniform float uTime;
vec3 decorMove( vec3 v, vec4 m, float ph ) { // (a part's motion about the origin: the pivot is taken off and put back by the caller)
  float t = uTime + ph;
  if ( m.x < 0.5 || m.x > 3.5 ) return v;
  vec3 n = vec3( 0.0, 1.0, 0.0 ); float a = t * 2.2; // (TURN: a potter's wheel's head)
  if ( m.x > 2.5 ) { n = vec3( 0.0, 0.766, 0.643 ); a = t * 0.35; } // (POLAR: the axis 40 degrees off +Y toward +Z, slow)
  else if ( m.x > 1.5 ) { n = vec3( 1.0, 0.0, 0.0 ); float u = fract( t / 6.0 ); // (TIP: filling, the pour, the knock back, the rest)
    a = u < 0.8 ? 0.16 * smoothstep( 0.0, 0.8, u ) : u < 0.86 ? mix( 0.16, 0.62, smoothstep( 0.8, 0.86, u ) ) : u < 0.92 ? mix( 0.62, -0.06, smoothstep( 0.86, 0.92, u ) ) : mix( -0.06, 0.0, smoothstep( 0.92, 1.0, u ) ); }
  float c = cos( a ), s = sin( a );
  return v * c + cross( n, v ) * s + n * dot( n, v ) * ( 1.0 - c );
}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  objectNormal = decorMove( objectNormal, motion, decorPh );`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed = decorMove( transformed - motion.yzw, motion, decorPh ) + motion.yzw;')
      .replace('#include <color_vertex>', `vColor = color;
  float decorPh = 0.0; // (the instance's phase: two copies of a moving piece never move in step; color_vertex comes first in main)
#ifdef USE_BATCHING
  decorPh = float( getIndirectIndex( gl_DrawID ) ) * 1.618;
#endif
#ifdef USE_BATCHING_COLOR
  float isGhost = 1.0 - step( 0.5, abs( float( getIndirectIndex( gl_DrawID ) ) - uGhost ) ); // (the ghost takes its gold or red on every part, stone too)
  vColor *= mix( vec3( 1.0 ), getBatchingColor( getIndirectIndex( gl_DrawID ) ).xyz, max( tintk, isGhost ) );
#endif
  vGlow = glowk;
  if ( motion.x > 3.5 ) { float ft = uTime * 1.0 + decorPh; vGlow *= 0.72 + 0.18 * sin( ft * 7.3 ) + 0.1 * sin( ft * 13.1 + 1.7 ); } // (FLICKER: a fire's waver)`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow; uniform float uLamps;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  // (the camera's near: a piece the view is inside or nearly so is dithered away, 2.5 to 6 m, so the Jar's camera never looks through a roof)
  if ( smoothstep( DECOR_NEAR.x, DECOR_NEAR.y, length( vViewPosition ) ) < fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) ) ) discard;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3( 1.0, 0.72, 0.34 ) * vGlow * uLamps;');
  };
  mat.onBeforeRender = (r, sc, cam, geo, obj) => { time.value = (performance.now() / 1000) % 3600; lamps.value = game?.gardenMood?.now?.lamps ?? 0; ghost.value = obj === game?.decorLayer?.batch ? (game.decorLayer.ghostId ?? -1) : -1; }; // (the lamps by the hour; a BatchedMesh keeps its own onBeforeRender, so the material's)
  mat.customProgramCacheKey = () => 'garden-decor-pieces';
  return { lamps };
}
