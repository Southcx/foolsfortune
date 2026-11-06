// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S SPRAY (docs/ref/WAVE-RIDING.md 5): what the wave throws into the air, played from the library (vfx/waves/effects.js)
// on the shared particle pools, placed from the pool's own function (world/raceway/surf/wavepool.js) so it leaves the water where the
// water is drawn:
//   THE LIP'S SHEET    stretches of the pitching edge (the lip's tip, `lipTip`, the GLSL's twin) throwing their spray forward and up,
//                      a few bursts a real second along the tube while a pass runs and the eye is near
//   THE FOAM BALL      held at the tube's end where the lip lands and collapses into the whitewater, churning, its size the wave's
//   THE RAIL           held off the Solar Skiff's rail while it rides the pool's water at speed, by its speed and its slip, thrown out of
//                      the turn and back
//   THE SPIT           on `skiff.tube.exit` (the surf ride's: out of the mouth with the spit): a cone burst out of the barrel's mouth
//                      along the crest, drops thrown on the lens (the weather's lens drops, vfx/weatherfx/lensdrops.js, when they are
//                      there) and the barrel screen's burst (vfx/waves/barrelscreen.js)
//   THE SLOPE'S SAND   on `skiff.edge.skid { k }` (the slope ride's: the edge let go), sand fanned off the board's edge, a few a real
//                      second at most
// The surf ride's fields are read where they may not be yet (`skiff.surf`, `raceway.surf`): nothing here is required of them. No mesh,
// no material: draw calls none added (the pools draw as they do).
//
// Prior art: Breath of the Wild's and Sonic Riders' water (opaque blobs that shrink out), Wave Race 64's rooster tail, a real barrel's
// spit, the house's own board on water (vfx/skiffwaterlook.js), whose frame and gating these follow.
//
//   const S = new WaveSpray(game, look)   S.update(raw, pool, t, lean)   S.spit()   S.dispose()   lipTip(pool, t, s, a, out) -> out | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from '../../world/raceway/track.js';
import { lipCurve } from '../../world/raceway/surf/wavepool.js';
import { LIP_END } from './waveglsl.js';

/** The rates (bursts a real second, desk and lean), the reach from the eye inside which the spray plays (m), the board's speed under
 *  which its rail throws none, the lens drops at a spit, and the skid's throttle (real s). */
export const WAVE_SPRAY = { lip: [34, 12], bore: [14, 5], near: 320, railFrom: 4, railFull: 24, drops: 14, skidEvery: 0.12 };
/** The spit's drops on the lens: big, running, drying in a second and a half (vfx/weatherfx/lensdrops.js LENS's form). */
const SPIT_DROPS = { kind: 0, r: [0.012, 0.045], run: 0.45, dry: 1.6 };

const sstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const UP = new THREE.Vector3(0, 1, 0);

/** The lip at s along the crest and a across it (0 the crest, 1 the tip), in the world: the twin of waveglsl.js `wpLipAt` (the same
 *  feather, shrink and fall). null where no wave stands. `out.tau`, `out.gone`, `out.H`, `out.F` alongside. */
export function lipTip(S, t, s, a, out = new THREE.Vector3()) {
  const st = S.state(t), P = S.POOL, ax = S.axes; if (!st.env) return null;
  const u = st.ub + s * st.tu, v = P.vb + s * st.tv, du = u - P.L / 2, dv = v - P.W / 2;
  const x = P.x + du * ax.ux + dv * ax.vx, z = P.z + du * ax.uz + dv * ax.vz, f = S.frameAt(x, z, t);
  if (!f || f.H < 0.8) return null;
  const W = S.WAVE, tl = W.throwLen, tube = W.tube;
  const tau = sstep(-W.lead, tl, -s); // (as waveglsl.js: rising from WAVE.lead ahead of the break)
  const gone = sstep(-tube * LIP_END[0], -tube * LIP_END[1], s), c = lipCurve(f.H, f.F, tau, a, 1 - gone); // (the pool's own curve: the GLSL's twin)
  const dd = c.d, hh = c.h - gone * f.H * 0.35 * a;
  const tx = st.nu * ax.ux + st.nv * ax.vx, tz = st.nu * ax.uz + st.nv * ax.vz, px = x + dd * tx, pz = z + dd * tz;
  const base = (S.surfaceY(x, z, t) ?? P.y) - f.h; // (the still water and the swell under the crest)
  out.set(RW.x + px, RW.y + base + hh, RW.z + pz);
  out.tau = tau; out.gone = gone; out.H = f.H; out.F = f.F; out.travel = [tx, tz]; out.crest = [f.crest.x, f.crest.z];
  return out;
}

/** The bore's top at s along the crest (behind the tube), in the world: its crest's height on the water there, or null. */
function boreTop(S, t, s, out) {
  const st = S.state(t), P = S.POOL, ax = S.axes; if (!st.env) return null;
  const u = st.ub + s * st.tu, v = P.vb + s * st.tv, du = u - P.L / 2, dv = v - P.W / 2;
  const x = P.x + du * ax.ux + dv * ax.vx, z = P.z + du * ax.uz + dv * ax.vz, f = S.frameAt(x, z, t), y = S.surfaceY(x, z, t);
  if (!f || y == null || f.H < 1.5) return null;
  out.set(RW.x + x, RW.y + y, RW.z + z); out.H = f.H; out.travel = [f.travel.x, f.travel.z]; out.crest = [f.crest.x, f.crest.z];
  return out;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3();

export class WaveSpray {
  constructor(game, look) {
    this.game = game; this.look = look; this.acc = 0; this.ball = null; this.rail = null; this.skidT = 0;
    this.vel = new THREE.Vector3(); this.from = new THREE.Vector3(); this.to = new THREE.Vector3();
    const E = game.events;
    this.offs = E ? [
      E.on('skiff.tube.exit', (e) => { if (e?.made !== false && e?.ok !== false) this.spit(); }),
      E.on('skiff.edge.skid', (e) => this.skid(e)),
    ] : [];
  }
  V() { return this.game.vfx; }
  skiff() { const S = this.game.player?.techs?.get?.('skiff'); return S?.active && S.skiff?.group ? S : null; }

  update(raw, S, t, lean) {
    const V = this.V(), cam = this.game.camera; if (!V || !cam || !S) return;
    const st = S.state(t), W = S.WAVE, near = this.look.nearBreak(cam.position) < WAVE_SPRAY.near, live = st.env > 0.2 && near;
    // the lip's sheet: a few bursts along the pitching edge
    if (live) {
      this.acc += raw * WAVE_SPRAY.lip[lean ? 1 : 0] * st.env;
      while (this.acc >= 1) {
        this.acc -= 1;
        const s = -1 - Math.random() * (W.tube * 0.82), a = lipTip(S, t, s, 1, this.from), b = a && lipTip(S, t, s - 1.6, 1, this.to); // (off the fingers at the lip's tip: Hokusai's spray as dots)
        if (!a || !b || a.tau < 0.3) continue;
        _d.set(a.travel[0], 0.75, a.travel[1]).normalize();
        V.play('wave.lip.spray', { pos: _p.copy(a).lerp(b, 0.5), from: this.from.clone(), to: this.to.clone(), dir: _d.clone(), power: lean ? 0.7 : 1 });
      }
    } else this.acc = 0;
    // the bore behind the tube: spray and mist kicked up off its tumbling top, a few bursts a real second along it
    if (live) {
      this.boreAcc = (this.boreAcc || 0) + raw * WAVE_SPRAY.bore[lean ? 1 : 0] * st.env;
      while (this.boreAcc >= 1) {
        this.boreAcc -= 1;
        const top = boreTop(S, t, -W.tube - 4 - Math.random() * 70, _b); if (!top) continue;
        _d.set(top.travel[0] * 0.6, 1, top.travel[1] * 0.6).normalize();
        V.play('wave.lip.spray', { pos: top.clone(), from: top.clone(), to: top.clone().addScaledVector(_r.set(top.crest[0], 0, top.crest[1]), 3), dir: _d.clone(), power: (lean ? 0.4 : 0.6) * Math.min(1, top.H / 5) });
      }
    } else this.boreAcc = 0;
    // the foam ball at the tube's end
    const fb = live ? lipTip(S, t, -W.tube * 0.93, 0.55, _a) : null;
    if (fb) {
      if (!this.ball) this.ball = V.play('wave.foamball', { pos: fb.clone(), dir: UP.clone(), power: lean ? 0.6 : 1 });
      this.ball.pos.copy(fb); this.ball.k = Math.min(1, fb.H / W.H) * (lean ? 0.5 : 1);
    } else if (this.ball) { this.ball.stop?.(); this.ball = null; }
    this.railSpray(S, t, lean);
    this.skidT = Math.max(0, this.skidT - raw);
  }

  /** The board's rail on the pool's water: held while it rides at speed, out of the turn and back. */
  railSpray(S, t, lean) {
    const sk = this.skiff(), V = this.V();
    let on = false;
    if (sk && !sk.air) {
      const G = sk.skiff.group.position, lx = G.x - RW.x, lz = G.z - RW.z, y = S.inPool(lx, lz) ? S.surfaceY(lx, lz, t) : null;
      const v = sk.v, speed = v?.length ? Math.hypot(v.x, v.z) : sk.speed || 0;
      if (y != null && Math.abs(G.y - RW.y - y) < 1.2 && speed > WAVE_SPRAY.railFrom) {
        on = true;
        const a = sk.heading || 0; _f.set(Math.sin(a), 0, Math.cos(a)); _r.set(-Math.cos(a), 0, Math.sin(a));
        const lat = v ? (v.x * _r.x + v.z * _r.z) : 0, slip = Math.min(1, Math.abs(lat) / Math.max(4, speed));
        const side = lat > 0 ? -1 : 1; // (thrown out of the turn: away from the way it slides)
        _b.copy(G).addScaledVector(_f, -1.1).addScaledVector(_r, side * 0.4); _b.y = RW.y + y + 0.05;
        _d.copy(_r).multiplyScalar(side).addScaledVector(_f, -0.8).addScaledVector(UP, 0.7).normalize();
        if (v) this.vel.set(v.x, 0, v.z);
        if (!this.rail) this.rail = V.play('wave.rail.spray', { pos: _b.clone(), dir: _d.clone(), vel: this.vel });
        this.rail.pos.copy(_b); this.rail.dir?.copy?.(_d);
        this.rail.k = sstep(WAVE_SPRAY.railFrom, WAVE_SPRAY.railFull, speed) * (0.35 + 1.1 * slip) * (lean ? 0.5 : 1);
      }
    }
    if (!on && this.rail) { this.rail.stop?.(); this.rail = null; }
  }

  /** The spit out of the barrel's mouth: the cone, the lens drops, the screen's burst. */
  spit() {
    const look = this.look, S = look.S, t = look.t, V = this.V(); if (!S || !V) return;
    const m = lipTip(S, t, 1.5, 0, _a); if (!m) return;
    const sk = this.skiff(), at = sk ? _p.copy(sk.skiff.group.position).add(_b.set(0, 1, 0)) : _p.copy(m).add(_b.set(m.travel[0] * m.F * 0.45, -m.H * 0.5, m.travel[1] * m.F * 0.45));
    _d.set(m.crest[0], 0.18, m.crest[1]).normalize();
    V.play('wave.spit', { pos: at.clone(), dir: _d.clone() });
    look.screen?.spitBurst();
    const lens = this.game.weatherLook?.fx?.lens, cam = this.game.camera;
    if (lens?.spawn && cam && cam.position.distanceTo(at) < 14) for (let i = 0; i < WAVE_SPRAY.drops; i++) lens.spawn(SPIT_DROPS, cam);
  }

  /** The slope ride's edge let go: sand off the board's edge. */
  skid(e) {
    if (this.skidT > 0) return; const sk = this.skiff(), V = this.V(); if (!sk || !V) return;
    this.skidT = WAVE_SPRAY.skidEvery;
    const a = sk.heading || 0, G = sk.skiff.group.position; _f.set(Math.sin(a), 0, Math.cos(a)); _r.set(-Math.cos(a), 0, Math.sin(a));
    const v = sk.v, lat = v ? v.x * _r.x + v.z * _r.z : 0, side = lat > 0 ? 1 : -1;
    _d.copy(_r).multiplyScalar(side).addScaledVector(_f, -0.6).addScaledVector(UP, 0.6).normalize();
    if (v) this.vel.set(v.x, 0, v.z);
    V.play('wave.skid.sand', { pos: _p.copy(G).addScaledVector(_r, side * 0.35), dir: _d.clone(), vel: this.vel.clone(), power: 0.5 + Math.min(1, e?.k ?? 0.6) });
  }

  dispose() { for (const off of this.offs) off?.(); this.offs = []; this.ball?.stop?.(); this.rail?.stop?.(); this.ball = this.rail = null; }
}
