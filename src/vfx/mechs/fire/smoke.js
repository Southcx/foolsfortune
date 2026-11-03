// ---------------------------------------------------------------------------------------
// A SMOKE COLUMN and THE EMBERS (plain names; the city's fire's look, vfx/mechs/fire/): what rises off a burning building, emitted
// straight into the shared sprite pools (vfx/sprites.js, game.vfx.alpha and game.vfx.add) on the real clock, drawn as a cartoon's:
// the smoke as the atlas's cel clouds (three flat tones, keylined, lit from above), born lit by the fire in Fury's orange, rolling up
// and swelling downwind as a column, grey while it catches and black as it chars, held whole and eroded from its edge as it goes
// (never a see-through fade); the embers as Fury's little four-point stars lifted off the flames, twinkling; a cell burning away
// throws its sparks as stretched stars. The counts a real second are the table's (FIRE_LOOK.smoke, .embers), a phone's a share
// (FIRE_LOOK.phone). No allocation a frame: one emit record, reused.
// Prior art: The Wind Waker's smoke balls (rolling cel clouds, keylined), the Godzilla films' miniature city fires (one great soft column a block, its foot lit), Far Cry 2's smoke a fire
// (grey to black with what burns), the stateless GPU particle the pools already are (vfx/sprites.js).
//
//   const S = new FireSmoke(game)   S.step(dt, T, k) (T a burning building's track: samples, nS, n, charK; k the phone's share)
//   S.sparks(x, y, z, n)   S.pools() -> { add, alpha } | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FIRE_LOOK } from './table.js';
import { furyHex } from './flames.js';

const SM = FIRE_LOOK.smoke, EM = FIRE_LOOK.embers, W = FIRE_LOOK.wind;
const _c = new THREE.Color(), _d = new THREE.Color(), _l = new THREE.Color(), _f = new THREE.Color(furyHex(SM.litAt));
const EMBER = EM.at.map(furyHex), EMBER_END = furyHex(EM.endAt), SPARK = furyHex(0.95), SPARK_END = furyHex(0.7);
const rnd = (a) => a[0] + Math.random() * (a[1] - a[0]);
const E = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 1, size: 1, sizeEnd: 1, color: 0, colorEnd: 0, alpha: 1, alphaEnd: 0, shape: 'puff', rot: undefined, spin: 0, stretch: 0, drag: 0, gravity: 0, twinkle: 0, grow: 0 };
const reset = () => { E.rot = undefined; E.spin = 0; E.stretch = 0; E.drag = 0; E.gravity = 0; E.twinkle = 0; E.grow = 0; E.alphaEnd = 0; };

export class FireSmoke {
  constructor(game) { this.game = game; }
  pools() { const v = this.game.vfx; return v?.add && v?.alpha ? v : null; }

  /** One building's smoke and embers for dt real s. */
  step(dt, T, k = 1) {
    const P = this.pools(); if (!P || !T.nS || !(T.n > 0)) return;
    T.smokeAcc += dt * Math.min(SM.max, SM.base + SM.perCell * T.n) * k;
    T.emberAcc += dt * Math.min(EM.max, EM.perCell * T.n) * k;
    const S = T.samples;
    _d.setHex(SM.light).lerp(_l.setHex(SM.dark), Math.min(1, 0.25 + 0.85 * T.charK));
    while (T.smokeAcc >= 1) {
      T.smokeAcc -= 1; reset();
      const j = ((Math.random() * T.nS) | 0) * 3, rise = rnd(SM.rise);
      E.pos.set(S[j] + (Math.random() - 0.5) * 1.6, S[j + 1] + 1.6 + Math.random() * 1.4, S[j + 2] + (Math.random() - 0.5) * 1.6);
      E.vel.set(W[0] * SM.drift + (Math.random() - 0.5) * 0.8, rise, W[2] * SM.drift + (Math.random() - 0.5) * 0.8);
      E.life = rnd(SM.life); E.size = rnd(SM.size); E.sizeEnd = rnd(SM.sizeEnd); E.shape = 'cloud'; E.drag = SM.drag; E.gravity = -0.15;
      _c.copy(_d).multiplyScalar(0.85 + Math.random() * 0.3); E.colorEnd = _c.getHex(); E.color = _c.lerp(_f, SM.lit).getHex();
      E.alpha = SM.hold; E.rot = (Math.random() - 0.5) * 2 * SM.tilt; E.spin = (Math.random() - 0.5) * 2 * SM.spin; E.grow = 2;
      P.alpha.emit(E);
    }
    while (T.emberAcc >= 1) {
      T.emberAcc -= 1; reset();
      const j = ((Math.random() * T.nS) | 0) * 3;
      E.pos.set(S[j] + (Math.random() - 0.5), S[j + 1] + 0.6 + Math.random() * 1.6, S[j + 2] + (Math.random() - 0.5));
      E.vel.set(W[0] * 0.8 + (Math.random() - 0.5) * 2.2, rnd(EM.rise), W[2] * 0.8 + (Math.random() - 0.5) * 2.2);
      E.life = rnd(EM.life); E.size = rnd(EM.size); E.sizeEnd = 0; E.shape = 'star4'; E.drag = 0.6; E.gravity = -0.4; E.twinkle = 6; E.spin = (Math.random() - 0.5) * 4;
      E.color = EMBER[(Math.random() * EMBER.length) | 0]; E.colorEnd = EMBER_END; E.alpha = 1;
      P.add.emit(E);
    }
  }

  /** A cell burning away: its sparks thrown up and out. */
  sparks(x, y, z, n) {
    const P = this.pools(); if (!P) return;
    for (let i = 0; i < n; i++) {
      reset();
      E.pos.set(x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.8, z + (Math.random() - 0.5) * 0.8);
      E.vel.set((Math.random() - 0.5) * 7, 2 + Math.random() * 6, (Math.random() - 0.5) * 7);
      E.life = 0.5 + Math.random() * 0.6; E.size = 0.3 + Math.random() * 0.2; E.sizeEnd = 0.04; E.shape = 'star4'; E.stretch = 1.4; E.gravity = 9; E.drag = 0.4;
      E.color = SPARK; E.colorEnd = SPARK_END; E.alpha = 1;
      P.add.emit(E);
    }
  }
}
