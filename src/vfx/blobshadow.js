// ---------------------------------------------------------------------------------------
// THE BLOB SHADOW: a soft dark disc straight down under the Courier on whatever is below (the ground, a box, a ledge, a moving
// platform), shrinking and fading with height, so a jump's landing spot is always read (the owner, 2026-10-20). It is drawn ALONGSIDE
// the sun's shadow (render/present.js's one sun shadow), never instead of it: in every place and move, the Solar Skiff's rider too;
// gone only where the Courier's body is (sealed in a cradle, the god hand, the Spirit Garden, the first person).
//
// How: one quad (a radial gradient, black to clear, drawn once on a canvas) laid on the hit of one ray cast down from the Courier's
// feet as drawn (the character's root), against the world's solid shapes: never the Courier's own capsule, a sensor or a creature (the
// casebook's rule 183: a mark that climbs a body). The Dunes' sand answers where no shape does (`dunes.heightAt`, as the Lantern
// Wisp's ground does). The quad is turned to the surface's normal and held 2 cm off it, polygon-offset so it never z-fights; it writes
// no depth. A MeshBasicMaterial with a map, transparent: the plain program the game's other basic marks already draw with, no new one.
//
// Prior art: Super Mario 64's blob shadow (Nintendo, 1996: a round shadow straight under Mario at every height, the platformer's
// depth cue in three dimensions), and every console platformer after it that kept one beside real shadows (Banjo-Kazooie, Jak and
// Daxter, Ratchet and Clank, Super Mario Odyssey's drop shadow).
//
//   game.blobShadow = new BlobShadow(game)   .update()   each frame, after the Courier is posed (main.js)   .mesh
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const BLOB = {
  r: 0.42,       // its radius on the ground, metres (about the Courier's shoulders)
  alpha: 0.62,   // its darkness on the ground (0.5 was lost under the sun's shadow mid-jump)
  shrink: 0.55,  // how much of its size it loses by `far` metres up
  far: 6,        // the height at which it is smallest and faintest
  reach: 12,     // the furthest down it is looked for, metres (beyond: no shadow)
  lift: 0.02,    // held off the surface, metres
};
const DOWN = new THREE.Vector3(0, -1, 0), Z = new THREE.Vector3(0, 0, 1), UP = new THREE.Vector3(0, 1, 0);
const _o = new THREE.Vector3(), _n = new THREE.Vector3(), _p = new THREE.Vector3();

function gradient() {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.8)'); g.addColorStop(0.8, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.name = 'blob-shadow';
  return t;
}

export class BlobShadow {
  constructor(game) {
    this.game = game;
    this.mat = new THREE.MeshBasicMaterial({ name: 'blob-shadow', map: gradient(), color: 0x000000, transparent: true, opacity: BLOB.alpha, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.mesh.name = 'blob-shadow'; this.mesh.castShadow = this.mesh.receiveShadow = false; this.mesh.renderOrder = 1;
    this.mesh.userData.zoneFree = true; // (it follows the Courier: never hidden by a zone)
    game.scene?.add(this.mesh);
  }

  /** Is the Courier's body drawn in the world now? */
  shown() {
    const g = this.game, ch = g.character, P = g.player;
    if (!ch?.root?.visible || ch.model?.visible === false || !P) return false;
    return !(P.fpWeight > 0.5 || g.god?.controlling || g.realm?.active || g.cradles?.sealed);
  }

  /** The surface under (x, feetY, z): { y, n } or null. */
  below(x, y, z) {
    const g = this.game, ph = g.physics, P = g.player;
    const hit = ph?.raycast?.(_o.set(x + 0.0013, y + 0.4, z + 0.0017), DOWN, BLOB.reach + 0.4, P?.collider, undefined,
      (c) => !c.isSensor() && ph.entityOf?.(c)?.type !== 'creature');
    if (hit) return { y: hit.point.y, n: _n.copy(hit.normal.y > 0.2 ? hit.normal : UP).normalize() };
    const sand = g.dunes?.heightAt?.(x, z);
    if (Number.isFinite(sand) && sand <= y + 0.4 && y - sand <= BLOB.reach) return { y: sand, n: _n.copy(UP) };
    return null;
  }

  update() {
    const m = this.mesh, ch = this.game.character;
    if (!this.shown()) { m.visible = false; return; }
    const feet = ch.root.getWorldPosition(_p), at = this.below(feet.x, feet.y, feet.z);
    if (!at) { m.visible = false; return; }
    const h = Math.max(0, feet.y - at.y), k = THREE.MathUtils.smoothstep(h, 0, BLOB.far);
    m.visible = true;
    m.position.set(feet.x, at.y, feet.z).addScaledVector(at.n, BLOB.lift);
    m.quaternion.setFromUnitVectors(Z, at.n);
    m.scale.setScalar(BLOB.r * (1 - BLOB.shrink * k));
    this.mat.opacity = BLOB.alpha * (1 - 0.6 * k);
  }
}
