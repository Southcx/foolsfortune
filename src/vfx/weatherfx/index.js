// ---------------------------------------------------------------------------------------
// THE WEATHER'S SECONDARY LOOKS: what the emotional weather does besides falling (the owner, 2026-10-24), made and driven from the
// weather's look (vfx/weather.js, its one hook each in make() and update()): a weather's impacts on the ground (impacts.js: the
// splashes, the hail's chips, the ash, the skipping dust, the diamond dust's glints, and the ground's haze), the gusts that sweep
// through everything that falls (gusts.js), and the lens drops on the glass when you look up into the rain (lensdrops.js). Each part
// reads the same amounts the look draws by (`look.eff`, open places only), the strongest falling weather wins a piece, and an agate's
// second colours it (`look.tint`), lit by the hour as the hail is.
//
// Prior art: the look it hangs off (vfx/weather.js: one strongest weather a piece, its colour through the agate), and the seventh
// generation's weather systems split into a fall, its impacts and a screen layer (Uncharted 2's and The Last of Us's rain: streaks, a
// splash pass on a depth map round the camera, drops on the lens).
//
//   const fx = new WeatherFx(game, look, { occ, wet, shore, heavyOf })   (in WeatherLook.make(): its pieces go into look.group)
//   fx.update(dt, camera, open, dayK)   (each frame from WeatherLook.update, calm or not, so the lens dries)   fx.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { makeImpacts, impactsOf, impactsTo } from './impacts.js';
import { GUST_U, setGusts, gustAt } from './gusts.js';
import { LensDrops } from './lensdrops.js';

const ASPECTS = ['mirth', 'wonder', 'desire', 'grief', 'dread', 'gall', 'fury'];
const _c = new THREE.Color(), _rain = {};

export class WeatherFx {
  constructor(game, look, { occ, wet, shore, heavyOf }) {
    this.game = game; this.look = look; this.t = 0; this.heavyOf = heavyOf; // (the look's own: handed in, so nothing here imports it back)
    this.body = makeImpacts(4096, occ, wet, shore, GUST_U); // (1024 events: splashes, chips, ash, dust or glints, the strongest weather's)
    this.ground = makeImpacts(320, occ, wet, shore, GUST_U); // (the ground's haze: the same program, its own numbers)
    this.ground.u.uKind.value = 5;
    look.group.add(this.body.obj, this.ground.obj);
    this.lens = new LensDrops(game);
  }

  update(dt, camera, open, dayK = 1) {
    const L = this.look, cam = camera.position;
    this.t += dt;
    const wind = this.game.dunes?.wind?.dir || null;
    // the impacts: the strongest weather's, a piece each
    let bodyA = 0, groundA = 0;
    const lit = 0.18 + 0.82 * THREE.MathUtils.smoothstep(L.wx?.light ?? 0.5, 0.1, 0.6);
    for (const a of ASPECTS) {
      const k = open ? L.eff[a] : 0; _rain[a] = k; if (!k) continue;
      const I = impactsOf(a, k, this.heavyOf(k), dayK);
      if (I.body && I.body.a > bodyA) { bodyA = I.body.a; impactsTo(this.body, I.body, L.tint(_c, a, I.body.colour).multiplyScalar(I.body.kind === 4 ? 1 : lit)); }
      if (I.ground && I.ground.a > groundA) {
        groundA = I.ground.a; L.tint(_c, a, I.ground.colour).multiplyScalar(lit);
        const fc = this.game.scene?.fog?.color; if (fc) _c.lerp(fc, 0.5 * (1 - lit)); // (at night the night's own fog: never a dark stain)
        impactsTo(this.ground, I.ground, _c);
      }
    }
    setGusts(_rain, this.heavyOf, wind, dt); // (the gusts of what falls here: none under a roof)
    this.body.obj.visible = bodyA > 0.01 && L.group.visible; this.ground.obj.visible = groundA > 0.01 && L.group.visible;
    const px = 480 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    for (const P of [this.body, this.ground]) { P.u.uT.value = this.t; P.u.uCam.value.copy(cam); P.u.uPx.value = px; }
    // the lens: the rain's and the hail's (and Desire's grit) on the glass; under a roof, none lands
    const P = this.game.player, fp = this.game.god?.controlling || this.game.realm?.active ? 0 : P?.fpWeight ?? 0;
    this.lens.update(dt, camera, { rain: _rain, fp, gust: gustAt(cam.x, cam.z) * Math.min(1, GUST_U.uGust.value.z), wind, covered: this.roofed(cam) });
  }

  /** Is there a roof over the eye (the weather's own map of what stands over each spot, vfx/overhead.js)? */
  roofed(cam) {
    const O = this.look.over; if (!O) return false;
    const x = Math.floor(cam.x / O.cell), z = Math.floor(cam.z / O.cell), n = O.n, t = ((((z % n) + n) % n) * n + (((x % n) + n) % n)) * 4;
    return O.data[t + 1] === x && O.data[t + 2] === z && O.data[t] > cam.y + 0.2;
  }

  dispose() { this.lens.dispose(); }
}
