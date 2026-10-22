// ---------------------------------------------------------------------------------------
// THE DECOR PIECES: a model for each of the 47 pieces of progress/decor.js (GARDEN-COZY.md D; the pieces are Calissa's, the catalogue and
// the layer under them Dovina's and Petra's). Soft, chunky, rounded toy forms in the cave abode's vocabulary of vfx/garden/features.js,
// low poly, readable from the hand's overhead view at about 50 degrees, sized to the piece's cells (a metre a cell) and standing on its
// origin, +Y up, front +Z. Each geometry carries a vertex colour (the BODY white, so the instance's set colour x tint paints it; the fixed
// accents their own: stone, wood, paper, moss, a lamp's warm yellow), `tintk` (how much of the instance colour a vertex takes: the body 1,
// an accent 0, so a gold ghost or a tint never turns a stone grey) and `glowk` (a lamp's face, lit by the hour). The pieces are built by
// set in decorpieces/ (kit.js is the builder). ONE material still serves all: decorMaterial() patches it in place, no second program.
//
// Prior art: Animal Crossing: New Horizons' furniture (a body that takes a variant's colour, fixed trim), the Chao Garden's toy forms,
// the Japanese garden's vocabulary (toro, tsukubai, chashitsu, yatsuhashi), three.js's onBeforeCompile for per-vertex tint and glow.
//
//   decorGeometry(id) -> BufferGeometry (built once, cached)   DECOR_PIECE_IDS   decorMaterial(mat, game) (vertexColors, tint and lamp glow)
//   decorTriangles() -> { id: triangles }
// ---------------------------------------------------------------------------------------
import { Piece } from './decorpieces/kit.js';
import { PLAIN } from './decorpieces/plain.js';
import { WARM } from './decorpieces/warm.js';
import { COOL } from './decorpieces/cool.js';
import { SEASONS } from './decorpieces/seasons.js';

const BUILD = { ...PLAIN, ...WARM, ...COOL, ...SEASONS };
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
 *  The same material, patched before its first compile; every geometry on it must carry color, tintk and glowk (mergeParts does). */
export function decorMaterial(mat, game) {
  const lamps = { value: 0 }, ghost = { value: -1 };
  mat.vertexColors = true; mat.userData.lamps = lamps;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLamps = lamps; sh.uniforms.uGhost = ghost;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float tintk; attribute float glowk; varying float vGlow; uniform float uGhost;')
      .replace('#include <color_vertex>', `vColor = color;
#ifdef USE_BATCHING_COLOR
  float isGhost = 1.0 - step( 0.5, abs( float( getIndirectIndex( gl_DrawID ) ) - uGhost ) ); // (the ghost takes its gold or red on every part, stone too)
  vColor *= mix( vec3( 1.0 ), getBatchingColor( getIndirectIndex( gl_DrawID ) ).xyz, max( tintk, isGhost ) );
#endif
  vGlow = glowk;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow; uniform float uLamps;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3( 1.0, 0.72, 0.34 ) * vGlow * uLamps;');
  };
  mat.onBeforeRender = (r, sc, cam, geo, obj) => { lamps.value = game?.gardenMood?.now?.lamps ?? 0; ghost.value = obj === game?.decorLayer?.batch ? (game.decorLayer.ghostId ?? -1) : -1; }; // (the lamps by the hour; a BatchedMesh keeps its own onBeforeRender, so the material's)
  mat.customProgramCacheKey = () => 'garden-decor-pieces';
  return { lamps };
}
