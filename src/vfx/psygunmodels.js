// ---------------------------------------------------------------------------------------
// THE PSYGUN'S MODELS: the psygun the Courier carries drawn as its own variant (tools/psygun/kinds.js PSYGUNS; the owner's four, 2026-10-18).
// THE PSYGUN and the Pentagun are the owner's model (assets/psygun.glb); the Bombardier a flare gun, the Carbine a rifle, the Pepperbox a
// shotgun (assets/psygun_<variant>.glb, built on the owner's model by scripts/export_psyguns.py, each cylinder its chamber count's shape:
// docs/plans/OVERLAY.md 18). A variant's glb is loaded the first time it is carried (a dynamic import, as the Solar Skiff's is), and its two
// geometries take the place of the reference's under character.gunModel: the same meshes, so the gun's materials stay (the fade and
// dissolve, withFade; the charge's glow, character.gunGlowMats), and the outline's mesh shares the new geometry. The variant's muzzle is
// set on GUN_POINTS (character.js's exported points; the grips are the reference's on every variant, so the hands fit as they do) and the
// iron sights' front post moves to its barrel.
//
// Reads: `psygun.change` { gun } (tools/psygun/shells.js setGun), and game.shells.gun at boot (the gun kept from the last session).
// To try it (DEBUG): /psygun bombardier | carbine | pentagun | pepperbox | first (progress/econ/economy.js).
//
// Prior art: swapping a weapon's mesh under one socket and keeping its rig and materials (a weapon skin in most shooters, Destiny's
// ornaments); the lazy load is boat.js's.
//
//   game.psygunModels = new PsygunModels(game)   .show(gunId)   .shown (the variant drawn: 'reference' | 'bombardier' | ...)
// ---------------------------------------------------------------------------------------
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUN_POINTS } from '../courier/character.js';
import { ensureSmoothNormals } from '../render/outline.js';

/** Each variant's glb (lazily), its muzzle and its front sight's post (gun-model units, +X barrel, +Y up: export_psyguns.py's points). */
const VARIANTS = {
  'psygun.bombardier': { key: 'bombardier', load: () => import('../assets/psygun_bombardier.glb?b64'), muzzle: [0.31, 0.005, 0], front: [0.24, 0.081] },
  'psygun.carbine': { key: 'carbine', load: () => import('../assets/psygun_carbine.glb?b64'), muzzle: [0.655, 0.03, 0], front: [0.575, 0.069] },
  'psygun.pepperbox': { key: 'pepperbox', load: () => import('../assets/psygun_pepperbox.glb?b64'), muzzle: [0.376, -0.004, 0], front: [0.34, 0.105] },
};
const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

export class PsygunModels {
  constructor(game) {
    this.game = game;
    const ch = game.character, glow = new Set(ch.gunGlowMats);
    // the reference's two meshes (the body, the glow) and the iron sights character.js hung on the model (two rear, the front post, its dot)
    const meshes = [], sights = [];
    ch.gunModel.traverse((o) => { if (o.isMesh && !o.userData.isOutline) (o.parent === ch.gunModel ? sights : meshes).push(o); });
    this.body = meshes.find((o) => !glow.has(o.material)); this.glow = meshes.find((o) => glow.has(o.material));
    this.front = sights.slice(2, 4);
    this.ref = { body: this.body?.geometry, glow: this.glow?.geometry, muzzle: GUN_POINTS.muzzle.clone(), front: this.front.map((o) => o.position.clone()) };
    this.cache = new Map(); // variant key -> Promise<{ body, glow }>
    this.shown = 'reference'; this.want = null;
    game.events.on('psygun.change', (e) => this.show(e.gun));
    this.show(game.shells?.gun?.id);
  }

  /** Draw the psygun of this id (PSYGUNS' ids); THE PSYGUN, the Pentagun and anything unknown are the reference. */
  show(gunId) {
    const V = VARIANTS[gunId]; this.want = V?.key || 'reference';
    if (!this.body || !this.glow) return; // (a rig without the gun's two meshes: nothing to swap)
    if (!V) { this.apply('reference', this.ref, this.ref.muzzle, null); return; }
    if (!this.cache.has(V.key)) this.cache.set(V.key, V.load().then((m) => new GLTFLoader().parseAsync(bytes(m.default), '')).then((g) => this.split(g)));
    this.cache.get(V.key).then((geo) => { if (this.want === V.key && geo) this.apply(V.key, geo, V.muzzle, V.front); })
      .catch((err) => { console.warn('psygun model', V.key, err); this.cache.delete(V.key); });
  }

  /** A variant's glb as its two geometries, by the reference's material names. */
  split(gltf) {
    const out = {};
    gltf.scene.traverse((o) => { if (o.isMesh) out[o.material?.name === 'CourierEnergyShell' ? 'glow' : 'body'] = o.geometry; });
    for (const g of [out.body, out.glow]) if (g) ensureSmoothNormals(g); // (the outline's push: render/outline.js)
    return out.body && out.glow ? out : null;
  }

  apply(key, geo, muzzle, front) {
    for (const [mesh, g] of [[this.body, geo.body], [this.glow, geo.glow]]) {
      mesh.geometry = g;
      if (mesh.userData.outline) mesh.userData.outline.geometry = g;
    }
    if (Array.isArray(muzzle)) GUN_POINTS.muzzle.fromArray(muzzle); else GUN_POINTS.muzzle.copy(muzzle);
    // the front post and its dot (character.js: the post at sightY - 0.016, the dot 0.008 ahead of it and 0.012 above)
    const [post, dot] = this.front;
    if (post && dot) {
      if (front) { post.position.set(front[0], front[1] - 0.016, 0); dot.position.set(front[0] - 0.008, front[1] - 0.004, 0); }
      else { post.position.copy(this.ref.front[0]); dot.position.copy(this.ref.front[1]); }
    }
    this.shown = key;
  }
}
