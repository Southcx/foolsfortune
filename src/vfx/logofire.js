// ---------------------------------------------------------------------------------------
// THE LOGO, FIRED: the title's words made a slab of clay and fired in front of the eye, the last beat of the overture (docs/boards/
// OVERTURE.md: the kiln intro and THE STRIKE). Raw clay in the dark, then the chest's own climb (vfx/chestglaze.js: celadon, crazing, raku), and on
// the strike every crack floods with kintsugi gold in one frame; then it gives way to the title's own logo (title/ui.js), which is
// where the eye already is.
//
// The slab is the logo's letters drawn once to a canvas (the title's own face and words) and used as the cut-out of a thin box, so it
// takes light like a fired tile; the glaze is the chest's, so the trailer ends on the same firing the chests make (one look, reused).
//
// Prior art: the logo slam of the anime opening (Persona 5's, Tales of Vesperia's: the title struck on the last hit), a kiln's spyhole
// (the glaze seen changing in the heat), and kintsugi, the repair shown.
//
//   const L = new LogoFire(scene)   L.place(camera)   L.set(stage 0..4, opacity 0..1, flare 0..1)   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dressChestGlaze } from './chestglaze.js';
import { FONT } from '../ui/theme.js';

const W = 2048, H = 512;

function letters(text, sub) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 230px ${FONT.deco}`; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#fff'; g.strokeText(text, W / 2, H * 0.42); g.fillText(text, W / 2, H * 0.42); // (a stroke: letters with body enough for the glaze to craze)
  g.font = `italic 64px ${FONT.lore}`; g.fillText(sub, W / 2, H * 0.84);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  return t;
}

export class LogoFire {
  constructor(scene, { text = "Fool's Fortune", sub = 'the fortune is in the leap' } = {}) {
    this.scene = scene;
    this.cut = letters(text, sub);
    // (a clay tile: the letters cut out by the alpha test, lit like the world; the glaze is the chest's)
    this.mat = new THREE.MeshStandardMaterial({ color: 0x9a6a4e, roughness: 0.9, metalness: 0, alphaMap: this.cut, alphaTest: 0.5, transparent: false });
    this.glaze = dressChestGlaze(this.mat);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), this.mat);
    this.mesh.renderOrder = 50; this.mesh.visible = false; this.mesh.frustumCulled = false;
    // a warm light of its own from below, the kiln's mouth (an emissive glow would flatten it; this lights the crazing)
    this.light = new THREE.PointLight(0xffa860, 0, 6, 2);
    scene.add(this.mesh, this.light);
    this.opacity = 0;
  }

  /** Stand it in front of a camera, centred a little above the middle of the frame (where the title's own logo sits). */
  place(cam, dist = 3.2) {
    const f = cam.getWorldDirection(new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    this.mesh.position.copy(cam.position).addScaledVector(f, dist).addScaledVector(up, dist * 0.2);
    this.mesh.quaternion.copy(cam.quaternion);
    const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2), w = h * cam.aspect;
    this.mesh.scale.setScalar(Math.min(w * 0.72 / 4, h * 0.32));
    this.light.position.copy(this.mesh.position).addScaledVector(up, -0.9).addScaledVector(f, -0.6);
  }

  /** How far it is fired (the chest's stages: 0 raw clay .. 4 every seam gold), and how much of it shows. */
  set(stage, opacity = 1, flare = 0) {
    this.glaze.uGlaze.value = Math.max(0, stage);
    this.opacity = opacity;
    this.mesh.visible = opacity > 0.01;
    this.mat.color.set(0x9a6a4e).multiplyScalar(opacity); // (it comes up out of the dark: the clay's colour, the glaze's over it once fired)
    this.light.intensity = this.mesh.visible ? (2 + 6 * Math.min(1, stage / 3) + 40 * flare) * opacity : 0; // (flare: the kiln's door thrown open on the strike)
  }

  dispose() { this.scene.remove(this.mesh, this.light); this.mesh.geometry.dispose(); this.mat.dispose(); this.cut.dispose(); }
}
