// ---------------------------------------------------------------------------------------
// THE STONES' DICE ON THE VESSEL (docs/plans/DICE.md 1, 2 and 7; Dovina's handoff of 2026-10-23; the owner, 2026-10-23: "merge the Pneuka
// stones with the stones"): the vessel's STONES region (the Courier_Stones the kiln sets: courier/vessel/glazes.js, vfx/finish.js's GEM)
// worn as what the stones are, seven dice of the worn mineral, the standard set, set into the body where the stones sat.
//
// WHERE THEY SIT (measured on courier.glb in its bind pose): the model's stones are three gems, one a setting: the brow (on the mask,
// the head's, 3 x 5 cm), the heart (the chest, spine.003's, 10 x 13 cm, the Eye Cup's pupil: vfx/eyecup.js) and the belt (a lozenge
// 7 x 15 cm at the waist, genitalroot's and the spine's). Seven dice do not fit three gems one to one, so the three settings hold them
// as the elements stand in Plato's Timaeus, read up the body as they rise (fire highest, earth lowest):
//   THE BROW   the d4 (fire, Wands), a face out and its point up: alchemy's triangle of fire, where a tilak is worn
//   THE HEART  the d20 (the Majors I to XX) the largest, in the gem's own place; the d8 (air, Swords) and the d12 (the aether, the zodiac)
//              either side of it, smaller, set into the plate
//   THE BELT   the d6 (earth, Pentacles: a cube is a coin), over the d10 (Cups) and the d% (the tens die beside it, DICE.md 2): the two
//              trapezohedra tip to tip, so the belt's lozenge is kept
// Each die is set as a cabochon is: a face out, sunk to a centimetre or so proud of the armour, a vertex of that face turned up (the
// d% turned down, so the percentile pair reads as one). The model's own gems are hidden while the dice are worn; the model is not
// changed (CLAUDE.md: the Courier is not to change; the dice are added to it).
//
// THE MINERAL  the dice are drawn with the stones region's own material (character.js regionMats.stones), so whatever the kiln lays on
//              the stones (vessel.js dress: the gem finish, its colour, fire, play and glow; a preview at the kiln too) is on the dice
//              at once, with nothing to keep in step. THE INK: each die's edges in its suit's colour (vfx/godhand/palmdie.js DIE_INK,
//              the palm die's own table): the d12's the film's schiller turning with the view, the d% none (its suit is open: a blank
//              left blank). The ink is drawn in the fragment from each face's barycentric edges (the polygon's, never the fan's
//              diagonals), eased over a pixel and gone when it would be under one, so a far body never sparkles with it (CLAUDE.md: no
//              aliasing crawl): it reads at the kiln's turntable and close, and the facets alone read further off.
// ONE DRAW     the seven are one skinned mesh on the Courier's skeleton (each die's vertices weighted as the model's stone nearest its
//              setting is, so it rides the body as the gem did), about 120 triangles, no shadow (centimetre pieces), no outline hull
//              (the gems had none; a 6 mm hull would black a 2 cm die out, render/outline.js T.visual.outline); the first-person hide
//              is the gem's (render/outline.js applyFpHide), the cracks' region tagged with the rest (courier/vessel/damage.js tagRegions).
//
// Prior art: Raku's dice set's solids and numbering (vfx/bazaarpieces.js dieFaces: every die of the game is cut from the one family),
// the palm die's ink (vfx/godhand/palmdie.js), the wireframe-by-barycentrics trick (Bærentzen et al., "Single-pass Wireframe Rendering",
// SIGGRAPH 2006: the edge's distance in the triangle's own coordinates, its width held in pixels by the derivative), a cabochon in its
// bezel, Plato's solids as the elements (Timaeus 53c to 56c), and the Eye Cup's placed marks (vfx/eyecup.js: measured on the bind pose).
//
//   installVesselDice(character) -> { mesh, sites }   (character.js calls it once its region materials are made)
//   VESSEL_DICE   the seven settings (bind space, metres; the Courier faces +z, their left is +x)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dieFaces } from './bazaarpieces.js';
import { DIE_INK } from './godhand/palmdie.js';

/** The seven settings: the die, where its face sits on the body (bind space), the way it faces out, its radius, how far proud of the
 *  surface its face stands, and its turn about its face (0: a vertex up). `sides` 100 is the d%. */
export const VESSEL_DICE = [
  { sides: 4, at: 'brow', p: [0, 1.697, 0.189], n: [0, 0.15, 1], r: 0.019, proud: 0.011 },
  { sides: 20, at: 'heart', p: [0, 1.27, 0.154], n: [0, 0, 1], r: 0.03, proud: 0.014 },
  { sides: 8, at: 'heart, their left', p: [0.052, 1.252, 0.143], n: [0.3, 0, 1], r: 0.0155, proud: 0.008 },
  { sides: 12, at: 'heart, their right', p: [-0.052, 1.252, 0.143], n: [-0.3, 0, 1], r: 0.0155, proud: 0.008 },
  { sides: 6, at: 'belt, top', p: [0, 0.912, 0.149], n: [0, 0, 1], r: 0.018, proud: 0.008 },
  { sides: 10, at: 'belt, middle', p: [0, 0.872, 0.153], n: [0, 0, 1], r: 0.017, proud: 0.008 },
  { sides: 100, at: 'belt, foot', p: [0, 0.831, 0.157], n: [0, -0.1, 1], r: 0.017, proud: 0.008, roll: Math.PI },
];
const INK_W = 0.075; // (the ink's width, in the face's barycentric units: about a fourteenth of a face's height)
// the ink's kind (dieInk.w): 0 none, 1 its colour, 2 the film's schiller (the d12: the zodiac lights any suit)
const inkOf = (sides) => (sides === 100 ? [0, 0, 0, 0] : sides === 12 ? [1, 1, 1, 2] : [...new THREE.Color().setHex(DIE_INK[sides] ?? 0xffffff).toArray(), 1]);

const INK_GLSL = `
  if (vDieInk.w > 0.5) {
    vec3 fw = max(fwidth(vDieBary), vec3(1e-5));
    vec3 e = 1.0 - smoothstep(vec3(${INK_W}) - fw, vec3(${INK_W}) + fw, vDieBary);   // (on an edge, eased over a pixel)
    vec3 keep = smoothstep(vec3(0.5), vec3(1.5), vec3(${INK_W}) / fw);               // (whole at a pixel wide or more, gone under half of one)
    float k = max(max(e.x * keep.x, e.y * keep.y), e.z * keep.z);
    vec3 ink = vDieInk.rgb;
    if (vDieInk.w > 1.5) ink = clamp(abs(fract(dot(normal, normalize(vViewPosition)) * 1.6 + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0) * 0.85 + 0.15;
    outgoingLight = mix(outgoingLight, ink, k * 0.85);
  }`;
/** The stones' material taught the dice's ink (once; its own program key, so the vessel's other parts keep theirs). */
function inkStones(m) {
  if (m.userData.diceInk) return;
  m.userData.diceInk = true;
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey?.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 dieBary; attribute vec4 dieInk; varying vec3 vDieBary; varying vec4 vDieInk;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDieBary = dieBary; vDieInk = dieInk;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDieBary; varying vec4 vDieInk;')
      .replace('#include <opaque_fragment>', `${INK_GLSL}\n#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-dice`;
  m.needsUpdate = true;
}

const _q = new THREE.Quaternion(), _qr = new THREE.Quaternion(), _n = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
/** One die's turn: its top face (the one numbered `sides`) out along n, the face's farthest vertex (a kite's apex) turned up, then `roll`. */
function seatTurn(F, n, roll = 0) {
  const f = F.find((x) => x.value === F.length) || F[0];
  _q.setFromUnitVectors(f.n, n);
  const far = f.poly.reduce((b, v) => (v.distanceToSquared(f.m) > b.distanceToSquared(f.m) ? v : b), f.poly[0]);
  _a.copy(far).sub(f.m).applyQuaternion(_q).addScaledVector(n, -_a.dot(n)).normalize(); // (the vertex, laid in the face's plane)
  _b.set(0, 1, 0).addScaledVector(n, -n.y).normalize();                                  // (up, laid in the same plane)
  const ang = Math.atan2(_c.crossVectors(_a, _b).dot(n), _a.dot(_b)) + roll;
  return new THREE.Quaternion().multiplyQuaternions(_qr.setFromAxisAngle(n, ang), _q);
}

/** Build the seven as one skinned mesh beside the model's stones, and hide the stones. */
export function installVesselDice(ch) {
  let stones = null;
  ch.model.traverse((o) => { if (o.isSkinnedMesh && o.name === 'Courier_Stones') stones = o; });
  const mat = ch.regionMats?.stones;
  if (!stones || !mat) return null;
  inkStones(mat);
  const sg = stones.geometry, SP = sg.attributes.position, SI = sg.attributes.skinIndex, SW = sg.attributes.skinWeight, SH = sg.attributes.fpHide;
  const pos = [], nrm = [], bary = [], ink = [], si = [], sw = [], hide = [];
  for (const site of VESSEL_DICE) {
    const sides = site.sides === 100 ? 10 : site.sides, F = dieFaces(sides);
    const p = new THREE.Vector3(...site.p), n = new THREE.Vector3(...site.n).normalize(), q = seatTurn(F, n, site.roll);
    const top = F.find((x) => x.value === F.length) || F[0], inr = top.m.dot(top.n) * site.r; // (the face's distance from the middle)
    const mid = p.clone().addScaledVector(n, site.proud - inr);
    // weighted as the model's stone nearest the setting is, so the die rides the body as the gem did
    let best = 0, bd = Infinity;
    for (let i = 0; i < SP.count; i++) { const d = _a.fromBufferAttribute(SP, i).distanceToSquared(p); if (d < bd) { bd = d; best = i; } }
    const sIdx = [0, 1, 2, 3].map((k) => SI.getComponent(best, k)), sWt = [0, 1, 2, 3].map((k) => SW.getComponent(best, k)), h = SH ? SH.getX(best) : 1, I = inkOf(site.sides);
    for (const f of F) {
      _n.copy(f.n).applyQuaternion(q);
      const P = f.poly.map((v) => v.clone().multiplyScalar(site.r).applyQuaternion(q).add(mid)), m = P.length - 2;
      for (let j = 0; j < m; j++) { // (a fan from the face's first corner; only the polygon's own edges are inked, never the fan's diagonals)
        const e1 = j === m - 1 ? 0 : 1, e2 = j === 0 ? 0 : 1;
        const B = [[1, e1, e2], [0, 1, e2], [0, e1, 1]];
        [P[0], P[j + 1], P[j + 2]].forEach((v, k) => { pos.push(v.x, v.y, v.z); nrm.push(_n.x, _n.y, _n.z); bary.push(...B[k]); ink.push(...I); si.push(...sIdx); sw.push(...sWt); hide.push(h); });
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('dieBary', new THREE.Float32BufferAttribute(bary, 3));
  g.setAttribute('dieInk', new THREE.Float32BufferAttribute(ink, 4));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.setAttribute('fpHide', new THREE.Float32BufferAttribute(hide, 1));
  const mesh = new THREE.SkinnedMesh(g, mat);
  mesh.name = 'Courier_StoneDice';
  mesh.bind(stones.skeleton, stones.bindMatrix); mesh.bindMode = stones.bindMode;
  stones.parent.add(mesh);
  mesh.position.copy(stones.position); mesh.quaternion.copy(stones.quaternion); mesh.scale.copy(stones.scale);
  mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false;
  stones.visible = false; // (the gems the dice replace: kept in the model, not drawn)
  return { mesh, sites: VESSEL_DICE };
}
