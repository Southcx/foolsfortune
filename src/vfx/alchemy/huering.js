// ---------------------------------------------------------------------------------------
// THE HUE RING (docs/plans/SOUL-ALCHEMY.md 4.6 and 4.13; the glossary: the spirit press's seven lights, one per attribute at its hue,
// drawn by wheelColour): the concept's floating lights round the spirit press, and what they do at the bath. They answer the soul
// bead and never move otherwise:
//   ORBIT     away from the press view they circle the press, bobbing; the one the soul colour is inside comes close and burns
//   SETTLE    as the press view opens, they drop out of their orbit one at a time, clockwise from Willpower, 0.08 real seconds apart,
//             each into its seal on the kerb, where it lights the carving from within (the seal's light is `seated[i]`)
//   LIFT      the bead enters a spread: that light lifts out of its seal (0.5 s) and hangs over its tile, leaning in toward the bead;
//             its seal stays lit as an ember (`lifted[i]`); in a tile's heart it stops bobbing and its halo tightens (0.3 s)
//   DIVE      at a firing it comes down into the tile and burns where it hangs (a true firing: all the way into the heart)
//   UNLIT     over a finished tile it hangs unlit
//   HOME      the bead leaves the spread: it goes back to its seal; the press view closes: they rise back into their orbit (0.5 s)
// Nothing here is a lamp: each light is an emissive core and a halo (4.22: no new PointLights).
//
// Prior art: the owner's concept (the floating lights round the press), Okami's and Ghibli's forest spirits (lights that attend a
// living shrine), the potter's chop pressed into the foot (the seal it rests in), and Hades' held beat (the burn on a firing).
//
//   const H = new HueRing(parent, hues)   H.seat({ seals, tiles, up })   (the bath's places in the press's own frame)
//   H.update(dt, t, { view, near, heart, unlit, bead, dive: { k, burn, deep } })   H.seated[i]   H.lifted[i]   H.lights[i] (meshes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { wheelColour } from '../wheelcolour.js';

const SAT = 0.65; // (the tiles' saturation: ECON.alchemy.sat)
const T = { stagger: 0.08, land: 0.35, home: 0.5, lift: 0.5, heart: 0.3 }; // (real seconds: 4.3, 4.6, 4.18)
const AT = { seal: 0.05, hover: 0.62, lean: 0.25, tile: 0.2, heart: 0.04 }; // (metres over the seal, over the tile; the lean toward the bead; how far down a dive comes)
const smooth = (x) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const toward = (v, to, rate) => (v < to ? Math.min(to, v + rate) : Math.max(to, v - rate));
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

export class HueRing {
  constructor(parent, hues) {
    this.hues = hues; this.places = null; this.viewT = -1; this.t = 0;
    this.seated = new Array(hues.length).fill(0); this.lifted = new Array(hues.length).fill(0);
    this.still = new Array(hues.length).fill(0); this.dim = new Array(hues.length).fill(0);
    this.lights = hues.map((h, i) => {
      const col = wheelColour(h, SAT, new THREE.Color()).multiplyScalar(1.35); // (a light: its glaze's colour, run a little hotter)
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), new THREE.MeshBasicMaterial({ color: col.clone() }));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: col.clone(), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
      w.add(halo); w.castShadow = false; parent.add(w);
      w.userData = { a: (i / hues.length) * Math.PI * 2, y: 1.2 + 1.3 * ((i * 3) % 7) / 7, halo, col };
      return w;
    });
  }

  /** Where the bath is, in the press's own frame: each seal's carving and each tile's centre, and the bath's up. */
  seat({ seals, tiles, up }) { this.places = { seals, tiles, up: up.clone().normalize() }; }

  update(dt, t, { view = false, near = -1, heart = false, unlit = false, bead = null, dive = null } = {}) {
    this.t = t; const P = this.places, at = !!P && view;
    if (at && this.viewT < 0) this.viewT = 0; else if (!at) this.viewT = -1;
    if (this.viewT >= 0) this.viewT += dt;
    this.lights.forEach((w, i) => {
      const u = w.userData;
      // the seat: each in turn as the view opens (clockwise from Willpower), all together as it closes
      this.seated[i] = at ? Math.min(1, Math.max(this.seated[i], (this.viewT - i * T.stagger) / T.land)) : Math.max(0, this.seated[i] - dt / T.home);
      const lift = near === i && this.seated[i] > 0.9;
      this.lifted[i] = toward(this.lifted[i], lift ? 1 : 0, dt / T.lift);
      this.still[i] = toward(this.still[i], lift && heart ? 1 : 0, dt / T.heart);
      this.dim[i] = toward(this.dim[i], lift && unlit ? 1 : 0, dt / T.heart);
      const s = smooth(this.seated[i]), l = smooth(this.lifted[i]), d = near === i && dive ? smooth(dive.k) : 0, burn = near === i && dive ? dive.burn : 0;
      // the orbit (and, away from the press view, the light the soul is inside comes close)
      const a = u.a + t * 0.12, close = !view && near === i, r = close ? 0.95 : 1.25;
      w.position.set(Math.sin(a) * r, u.y + 0.08 * Math.sin(t * 0.6 + i), Math.cos(a) * r);
      if (P && s > 0) w.position.lerp(_a.copy(P.seals[i]).addScaledVector(P.up, AT.seal + 0.01 * Math.sin(t * 1.3 + i)), s);
      if (P && l > 0) {
        _a.copy(P.tiles[i]).addScaledVector(P.up, AT.hover + 0.03 * Math.sin(t * 1.1 + i) * (1 - this.still[i]));
        if (bead) _a.add(_b.copy(bead).sub(P.tiles[i]).projectOnPlane(P.up).multiplyScalar(AT.lean)); // (leaning in toward the bead)
        w.position.lerp(_a, l);
      }
      if (P && d > 0) w.position.lerp(_a.copy(dive.deep && bead ? bead : P.tiles[i]).addScaledVector(P.up, dive.deep ? AT.heart : AT.tile), d);
      // its size and halo: small in its carving, full over its tile, tight in a tile's heart, bright as it burns, dark when unlit
      const sc = (close ? 1.8 : 1) * (1 - 0.45 * s * (1 - l)) * (1 + 1.1 * l) * (1 + 1.3 * burn); // (over its tile it is seen from the press view's 12.6 m: twice the size)
      w.scale.setScalar(sc);
      const k = 1 - 0.8 * this.dim[i];
      w.material.color.copy(u.col).multiplyScalar(k * (1 + 0.8 * burn));
      u.halo.material.color.copy(u.col).multiplyScalar(k);
      u.halo.scale.setScalar(1 - 0.35 * this.still[i] + 0.6 * burn);
      u.halo.material.opacity = (close ? 0.55 : 0.22 * (1 - 0.5 * s) + 0.12 * l + 0.2 * this.still[i]) * k + 0.6 * burn;
    });
  }

  /** A light's colour (its glaze's, as drawn), for the burning glass and the seal's gold. */
  colourOf(i, out = _c) { return out.copy(this.lights[i].userData.col); }
  dispose() { for (const w of this.lights) { w.removeFromParent(); w.geometry.dispose(); w.material.dispose(); w.userData.halo.geometry.dispose(); w.userData.halo.material.dispose(); } }
}
