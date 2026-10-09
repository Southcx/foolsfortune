// ---------------------------------------------------------------------------------------
// THE NIGHT ALIVE: what drives the dome's night layer (vfx/sky.js NIGHT_GLSL; the owner, R46: "auroras on the horizon at night at The
// Shore" and "make the night sky feel more alive"). Nothing here is drawn: it sets the sky's uniforms once a frame.
//
//   THE WHEEL    the stars turn about their pole once a game day (the hour's own phase), too slowly to see except over a stay
//   METEORS      one every 25 to 70 real seconds of night, a short streak falling across 8 to 14 degrees of sky in 0.6 s
//   THE AURORA   at the Shore, by night: curtains low over the sea (the shore's bearing), easing in over 6 s as you come down to the
//                beach and out as you leave it; elsewhere the sea is out of sight and the sky keeps its stars
//   THE CLOUD    the cloud layer's own field (vfx/clouds.js: its noise, drift, cover and opacity) handed to the dome each frame, so the
//                stars, the meteor and the aurora sit behind it (the owner, R10); with no layer drawn, nothing hides them
//
// Prior art: the turning star fields of Ōkami and Outer Wilds (the sky a clock you can read), Breath of the Wild's shooting stars (a
// rare event the sky gives you), and the aurora as seen from a northern shore (low over the water, green at the hem, violet above).
//
//   game.nightSky = new NightSky(game, { seaBearing })   .update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class NightSky {
  constructor(game, { seaBearing = 0, half = 1.1 } = {}) {
    this.game = game; this.t = 0; this.aur = 0;
    this.next = 20 + Math.random() * 30; this.met = -1;
    this.bearing = seaBearing; this.half = half;
  }

  update(raw = 1 / 60) {
    const g = this.game, G = g.sky?.G; if (!G) return;
    this.t += raw; G.uNT.value = this.t;
    const night = G.uNight.value;
    const phase = g.weatherLook?.wx?.phase; if (phase != null) G.uWheel.value = phase * Math.PI * 2; // (one turn a game day)
    // the aurora: by night, at the Shore
    const atShore = g.zones?.current === 'beach';
    this.aur += ((atShore ? night : 0) - this.aur) * (1 - Math.exp(-raw / 6 * 3));
    G.uAur.value = this.aur < 1e-3 ? 0 : this.aur; G.uAurDir.value.set(this.bearing, this.half);
    // a meteor now and then, only by night
    if (this.met >= 0) { this.met += raw / 0.6; if (this.met > 1) this.met = -1; }
    else if (night > 0.5 && (this.next -= raw) <= 0) {
      this.next = 25 + Math.random() * 45; this.met = 0;
      const az = Math.random() * Math.PI * 2, el = (30 + Math.random() * 35) * (Math.PI / 180);
      const S = G.uMetS.value.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
      const len = (8 + Math.random() * 6) * (Math.PI / 180), side = Math.random() < 0.5 ? -1 : 1;
      const down = new THREE.Vector3(0, -1, 0).addScaledVector(S, S.y).normalize(); // (toward the horizon, along the sky)
      const across = new THREE.Vector3().crossVectors(S, down).multiplyScalar(side * 0.6);
      G.uMetE.value.copy(S).addScaledVector(down.add(across).normalize(), len).normalize();
    }
    G.uMetK.value = this.met;
    // the cloud the stars are behind: the layer's own uniforms, linked (it drifts and is graded where it lives)
    const CL = g.dunes?.clouds, CU = CL?.uniforms;
    if (CU) { G.uCloudNoise.value = CU.uNoise.value; G.uCloudOff.value = CU.uOff.value; G.uCloud.value.set(CU.uCover.value, CU.uOpacity.value, CL.visible ? 1 : 0, 1); }
    else G.uCloud.value.set(0.5, 0, 0, 0);
  }
}
