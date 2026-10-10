// ---------------------------------------------------------------------------------------
// THE SPARRING MIRROR: the long glass on the combat wing's west wall, beside Strawman's sparring circle, made a real mirror (the owner,
// 2026-10-10, so the Courier's poses are judged front-on while fighting; docs/plans/COMBAT-LAB.md section 7). A second render of the
// Throwing Room's zone alone into a small target, worn by the glass, only while the Courier is inside the bales.
//
//   HOW        The eye mirrored in the glass looks through the glass's own rectangle: an off-axis frustum whose near plane IS the glass
//              (a generalized perspective projection, the CAVE's and a portal's), so what stands behind the wall is clipped by the near
//              plane itself (three's Reflector clips with an oblique near plane to the same end), and the target's texels lie on the glass
//              as its own uv: no projective lookup and no shader of the mirror's own. Its 120 lines (a quarter of the 480) are all spent
//              on the glass, so the Courier's reflection gets about two thirds of the screen's density from the striker's place.
//   WHAT       The testroom zone (render/zones.js) and the Courier in it, never the Workshop's zone; bodies, not marks: every sprite (the
//              glyph pops, the parry mark's glints), the interact chevron, the lock-on reticle, the Figment attack telegraphs, the wire
//              compass with the vane's and the pendulum's marks, the paint reticle and the jet ring are drawn once, in the world, and never
//              again in the glass. The glass itself is hidden for it. No HUD is in the scene to leave out (it is HTML over the canvas).
//   WHEN       While the Courier is inside the bales (the ring's radius) and the glass is in the camera's view; every other frame while
//              frames come faster than 45 a second (the target keeps the last image, its eye one frame old). The shadow pass is not
//              repeated (the frame's own sun shadow map is sampled, as last drawn) and the scene's matrices are not walked again.
//   THE LOOK   The reflection is the glass's glow (its emissive map, a touch dimmer and cooler: the silvering's loss); over it the
//              stand-in's film, faint: its grey-blue and the cartoon mirror's glints lit by the hall's lamps, with their sheen, so it reads
//              as glass and not a hole in the wall. Outside the bales the pane wears the stand-in's dull glass again (vfx/combatwingkit.js).
//   THE HOOK   three's own Scene.onBeforeRender, which the frame's draw calls (render/glow.js draws the scene once a frame) after the
//              matrices are updated and before the shadow pass and the draw: nothing in render/ was edited, and every count stays true
//              (the mirror's render is a renderer.render of its own, counted beside the frame's by scripts/perf.mjs and the F3 panel).
//
// Prior art: three.js's Reflector (a camera mirrored in the plane, a render target the glass samples, the shadow map's autoUpdate held off
// for it), Kooima's "Generalized Perspective Projection" (2008: the frustum through a screen's corners), Source's and Unreal's planar
// reflections (the world drawn again from under the plane, clipped to it), Super Mario 64's mirror room (the room drawn twice, the room
// alone), and the dance studio's mirror wall.
//
//   mirrorPane(w, h) -> Mesh   (the glass, from world/testroom/combatwing.js: a thin box `w` long (local z), `h` high, its face to +x)
//   new SparringMirror(game)   .update(raw)   (from vfx/testroomkit.js's TestRoomDress)   .inside   .drawn (renders so far)   SPARRING_MIRROR
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TR } from '../world/testroom/layout.js';
import { mirrorGlass } from './combatwingkit.js';

export const SPARRING_MIRROR = {
  lines: 120,          // (the target's height: a quarter of the present's 480; its width follows the glass)
  glow: [0.86, 0.88, 0.9], // (the reflection's tint, in linear light: the silvering keeps a little under nine tenths, a touch cool)
  film: 0x5a646c,      // (the stand-in's face under it, lit: the faint film and its glints)
  fast: 1 / 45,        // (frames shorter than this: the mirror is drawn every other one)
  far: 40,             // (metres past the glass: the hall is 19 deep from it)
};
// the marks never drawn twice: by name, for those built without a handle on the game (vfx/brushmarks.js)
const MARK_NAMES = new Set(['paint-reticle', 'jet-ring']);
/** The world marks the game holds, each a top-level object or none. */
const marksOf = (g) => [g.interact?.chevron?.group, g.lock?.reticle?.mesh, g.figmentTelegraphs?.group, g.wireCompass?.tape, g.wireCompass?.wpTape,
  g.wireCompass?.wpWorld, g.vaneHud?.group, g.vaneHud?.res, g.crucibelleHud?.group, g.crucibelleHud?.ring];

let PANE = null; // (the one glass; the wing builds it before the game dresses it)

/** The glass: the stand-in's box (its dull glass kept for outside the bales), with the mirror's material and its target beside it. It wears
 *  the mirror's material until the first tick, so the boot's warm-up compiles that program with the rest (casebook rules 17 and 18). */
export function mirrorPane(w, h) {
  const pane = mirrorGlass(w, h), S = SPARRING_MIRROR;
  const target = new THREE.WebGLRenderTarget(Math.round((S.lines * w) / h), S.lines, { type: THREE.HalfFloatType, samples: 4 }); // (the frame's own kind: linear light, multisampled; filtered linearly, no mipmaps)
  target.texture.name = 'sparring-mirror'; target.texture.repeat.x = -1; target.texture.offset.x = 1; // (the box's +x face runs its u toward -z; the eye behind the glass sees +z to its right)
  const glass = new THREE.MeshStandardMaterial({ name: 'wing-mirror-reflection', color: S.film, map: pane.material.map, roughness: 0.18, emissive: new THREE.Color().setRGB(...S.glow), emissiveMap: target.texture }); // (setRGB takes the working space's linear values)
  pane.userData.mirror = { standIn: pane.material, glass, target, w, h };
  pane.material = glass;
  PANE = pane;
  return pane;
}

const _e = new THREE.Vector3(), _pm = new THREE.Matrix4(), _fr = new THREE.Frustum();

export class SparringMirror {
  constructor(game) {
    this.game = game; this.pane = PANE; this.inside = false; this.fast = false;
    this.tick = 0; this.drawnTick = -9; this.drawn = 0; this.busy = false; this.hidden = [];
    this.cam = new THREE.PerspectiveCamera(); this.cam.rotation.set(0, -Math.PI / 2, 0); // (looking down +x, its right +z: the hall seen from behind the glass)
    if (!this.pane) return;
    const M = this.pane.userData.mirror, p = this.pane.getWorldPosition(new THREE.Vector3());
    this.plane = { x: p.x + 0.02, y0: p.y - M.h / 2, y1: p.y + M.h / 2, z0: p.z - M.w / 2, z1: p.z + M.w / 2 }; // (the box's front face: the mirror's plane)
    this.box = new THREE.Box3(new THREE.Vector3(p.x - 0.02, this.plane.y0, this.plane.z0), new THREE.Vector3(this.plane.x, this.plane.y1, this.plane.z1));
    const scene = game.scene, before = scene.onBeforeRender;
    scene.onBeforeRender = (r, s, cam, rt) => { before.call(scene, r, s, cam, rt); this.render(r, cam); };
  }

  /** Is the Courier inside the bales: the pane wears the mirror or the stand-in's glass. (raw 0, the boot's own call: left as built.) */
  update(raw) {
    if (!this.pane || !raw) return;
    const C = TR.wing.circle, P = this.game.player.pos, M = this.pane.userData.mirror;
    this.inside = Math.hypot(P.x - C.x, P.z - C.z) < C.r && Math.abs(P.y) < 4;
    this.fast = raw < SPARRING_MIRROR.fast; this.tick++;
    const want = this.inside ? M.glass : M.standIn;
    if (this.pane.material !== want) this.pane.material = want;
  }

  /** The reflection drawn into the target, from the frame's draw (the scene's onBeforeRender), when it is wanted and due. */
  render(r, camera) {
    const g = this.game;
    if (this.busy || !this.inside || (camera !== g.camera && camera !== window.__debugCam)) return;
    if (this.tick === this.drawnTick || (this.fast && this.tick - this.drawnTick < 2)) return;
    const E = camera.getWorldPosition(_e), Pl = this.plane, n = E.x - Pl.x;
    if (n < 0.05) return; // (the eye in the glass or behind the wall)
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (!_fr.setFromProjectionMatrix(_pm).intersectsBox(this.box)) return;
    // the eye mirrored in the glass, its frustum through the glass's corners, its near plane on the glass
    const c = this.cam;
    c.position.set(Pl.x - n, E.y, E.z); c.updateMatrixWorld();
    c.projectionMatrix.makePerspective(Pl.z0 - E.z, Pl.z1 - E.z, Pl.y1 - E.y, Pl.y0 - E.y, n, n + SPARRING_MIRROR.far);
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
    // what the glass leaves out: itself, the marks, and any zone but the room's (the Workshop's, when its door is in the frame's view)
    const hide = this.hidden, Z = g.zones, others = !!Z?.enabled && Z.visible.size > 1;
    const off = (o) => { if (o?.visible) { o.visible = false; hide.push(o); } };
    off(this.pane);
    for (const o of marksOf(g)) off(o);
    for (const o of g.scene.children) {
      if (!o.visible) continue;
      if (o.isSprite || MARK_NAMES.has(o.name)) { off(o); continue; }
      if (others && o.userData.zoneInstalled) { const z = Z.place(o, false); if (z && z !== 'testroom') off(o); }
    }
    const sm = r.shadowMap, au = sm.autoUpdate, nu = sm.needsUpdate, S = g.scene, mw = S.matrixWorldAutoUpdate, prev = r.getRenderTarget(), ac = r.autoClear;
    this.busy = true;
    try {
      sm.autoUpdate = false; sm.needsUpdate = false; S.matrixWorldAutoUpdate = false; r.autoClear = true;
      r.setRenderTarget(this.pane.userData.mirror.target);
      r.render(S, c);
    } finally {
      r.setRenderTarget(prev); r.autoClear = ac; sm.autoUpdate = au; sm.needsUpdate = nu; S.matrixWorldAutoUpdate = mw;
      for (const o of hide) o.visible = true;
      hide.length = 0; this.busy = false;
    }
    this.drawnTick = this.tick; this.drawn++;
  }
}
