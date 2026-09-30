// ---------------------------------------------------------------------------------------
// MOOD: the room's lighting, borrowed for a moment. A ceremony that wants the room dark (a chest that is about to open, a rave under a
// black light) asks here for a dimming and a tint, by name, and gives it back when it is done; the lowest light wins and everything
// eases. Nothing here knows about any one room: every light in the scene is scaled (the hemisphere and the ambient, the sun, each
// lamp) and the fog and the backdrop are pulled toward the same colour. Lights that belong to the show itself are marked
// `userData.moodExempt` and are left alone.
//
// It works around the fact that other code sets a light's intensity when and how it likes (a lamp that breathes, a sun that
// follows the depth): `begin()` puts back what was there before the last frame's dimming, the world runs and sets what it sets, and
// `end()` scales the result just before it is drawn. Nothing is ever added to or taken from the scene, so no shader is rebuilt.
//
// Prior art: the "blackout" of every heist game's lights-out and the dimmer of a stage (a master fader over the whole rig, with the
// effects on their own channels), and the way Wind Waker and Zelda's dungeons dim the world for a cutscene while the lit thing stays
// lit.
//
//   game.mood.set('rave', { dim: 0.94, tint: 0x3a1a7a, tintK: 0.7, ease: 6 })         the room goes dark and violet
//   game.mood.free('rave')                                                              and comes back
//   game.mood.begin()  (start of a frame)     game.mood.end(rawDt)  (just before the draw)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class Mood {
  constructor(game) {
    this.game = game;
    this.reqs = new Map();
    this.k = 0; this.tk = 0; this.fk = 0; this.peak = 0.001;
    this.lights = [];
    this.applied = false;
    this.tint = new THREE.Color(0x000000);
    this.saved = { bg: null, fog: null, density: 0 };
  }

  set(id, spec) {
    if (!this.reqs.size && this.k < 0.002) this.collect();
    this.reqs.delete(id);
    this.reqs.set(id, { dim: 0.9, tint: null, tintK: 0, fog: 1, ease: 4, ...spec });
  }
  free(id) { this.reqs.delete(id); }
  get active() { return this.reqs.size > 0 || this.k > 0.002; }

  /** Every light in the scene (once, when a mood starts). */
  collect() {
    this.lights.length = 0;
    this.game.scene.traverse((o) => {
      if (o.isLight && !o.userData.moodExempt) this.lights.push({ l: o, base: o.intensity, color: o.color.clone(), ground: o.groundColor ? o.groundColor.clone() : null });
    });
  }

  /** Put back what the last frame's dimming changed, before anything sets its own values. */
  begin() {
    if (!this.applied) return;
    for (const e of this.lights) { e.l.intensity = e.base; e.l.color.copy(e.color); if (e.ground) e.l.groundColor.copy(e.ground); }
    const s = this.game.scene, sv = this.saved;
    if (sv.bg && s.background?.isColor) s.background.copy(sv.bg);
    if (sv.fog && s.fog) { s.fog.color.copy(sv.fog); s.fog.density = sv.density; }
    this.applied = false;
  }

  /** Scale what the frame has set, just before it is drawn. */
  end(dt) {
    let dim = 0, tintK = 0, fog = 0, ease = 4, tint = null;
    for (const r of this.reqs.values()) { dim = Math.max(dim, r.dim); tintK = Math.max(tintK, r.tintK); fog = Math.max(fog, r.fog); ease = r.ease; if (r.tint != null) tint = r.tint; }
    const D = THREE.MathUtils.damp;
    if (dim > 0) this.peak = dim;
    this.k = D(this.k, dim, ease, dt); this.tk = D(this.tk, tintK, ease, dt); this.fk = D(this.fk, fog, ease, dt);
    if (tint != null) this.tint.set(tint);
    if (this.k < 0.002 && this.tk < 0.002 && !this.reqs.size) { this.k = this.tk = this.fk = 0; return; }
    const scale = 1 - this.k, pull = this.fk * Math.min(1, this.k / this.peak);
    for (const e of this.lights) {
      const l = e.l;
      e.base = l.intensity; e.color.copy(l.color); if (e.ground) e.ground.copy(l.groundColor);
      l.intensity = e.base * scale;
      if (this.tk > 0.002 && (l.isHemisphereLight || l.isAmbientLight || l.isDirectionalLight)) {
        l.color.lerp(this.tint, this.tk);
        if (l.groundColor) l.groundColor.lerp(this.tint, this.tk);
      }
    }
    const s = this.game.scene, sv = this.saved;
    if (s.background?.isColor) { sv.bg = (sv.bg || new THREE.Color()).copy(s.background); s.background.lerp(_dark.copy(this.tint).multiplyScalar(0.12), pull); }
    if (s.fog) { sv.fog = (sv.fog || new THREE.Color()).copy(s.fog.color); sv.density = s.fog.density; s.fog.color.lerp(_dark.copy(this.tint).multiplyScalar(0.12), pull); }
    this.applied = true;
  }
}

const _dark = new THREE.Color();
