// ---------------------------------------------------------------------------------------
// THE HANGAR'S DRESS / THE PROVING GROUND'S DRESS (plain names; docs/plans/MECHS.md 5.1, 5.2; South, 2026-11-02): the mechs' two rooms
// dressed over their placeholder boxes, one job: build the dressing with the hangar's area and take it down with it, and let the hall
// answer the mount. Looks only: the rooms, their colliders, lamps, labels, the mech, the toy city, the giant, the ring and the props
// are the runtime's and Dovina's, untouched (the few placeholder meshes a piece stands in for exactly are hidden, and shown again).
//   the hall      vfx/mechs/hangardress/hall.js: a kiln-cathedral (the floor's paint, firebrick pilasters, the climbing kiln and the
//                 north wall's kiln mouths, the lift's shaft and its light and motes, the racks of spare parts)
//   the gantry    vfx/mechs/hangardress/gantry.js: brick piers, the torii beam and its shimenawa, clamps, the ashiba, the lacquered
//                 walkway and its lanterns, the deck's grate
//   the yard      vfx/mechs/hangardress/yard.js: the paving and its range rings, the ishigaki wall, the blocks, the sockets' pylons,
//                 the launch pad, the floodlight towers, the dusk sky and the far hills
// THE MOUNT (vfx/mechs/mount.js, `mech.mount { beat }`): each beat flares the lanterns gold and gusts the shide; 'turn' and 'lock' light
// the clamps' bolts; while the Jar is sealed in the frame the bolts stay lit and the kiln's mouths and lamps burn brighter.
// Built by the hangar (world/hangar/hangar.js build() and teardown(): one line each); stepped as a 'looks' system while built.
//
// Prior art: the Sandbox's look and the Touchstone's (vfx/sandbox/look.js, vfx/touchstonelook.js: a room's dress built and taken down
// with her area); the modules' own (their headers).
//
//   installHangarDress(game) -> game.hangarDress   .build(hangar)   .teardown()   .update(dt)   .built   HANGAR_DRESS
// ---------------------------------------------------------------------------------------
import { Dress } from './kit.js';
import { buildHall } from './hall.js';
import { buildGantry } from './gantry.js';
import { buildYard } from './yard.js';
import { HANGAR } from '../../../world/hangar/layout.js';

/** The mount's answer: a flare's size and how fast it fades (real s), the shide's gust, the sealed kiln's brightness. */
export const HANGAR_DRESS = { flare: 2.4, fade: 1.6, gust: 1.0, breeze: 0.06, sealedKiln: 1.6, boltRest: 0.35, boltSealed: 1.0, boltFlash: 2.2 };
const HD = HANGAR_DRESS;
/** The placeholder's colours in the hall that the dress stands in for exactly (world/hangar/hangar.js C): the gantry's iron, the walk. */
const HERS = { iron: 0x4c4a48, walk: 0x6b5a4a };

export class HangarDress {
  constructor(game) {
    this.game = game; this.built = false; this.hall = null; this.yard = null; this.t = 0; this.flare = 0; this.bolt = 0; this.gust = 0; this.kilnK = 1;
    game.events?.on?.('mech.mount', (e) => this.beat(e?.beat));
  }

  build(hangar) {
    if (this.built) this.teardown();
    if (!hangar?.room) return;
    const g = this.game; this.hangar = hangar;
    try {
      const H = this.hall = new Dress(g, 'hangar');
      const found = H.find(hangar.room, HERS); for (const k of Object.keys(found)) for (const m of found[k]) H.hide(m);
      this.parts = { ...buildHall(H, hangar), ...buildGantry(H, hangar) };
      if (hangar.field?.group) { this.yard = new Dress(g, 'provingground'); this.yardParts = buildYard(this.yard, hangar); }
      this.built = true;
    } catch (e) { console.warn('hangar dress: not built', e); this.teardown(); }
  }

  teardown() {
    this.hall?.teardown(); this.yard?.teardown();
    this.hall = null; this.yard = null; this.parts = null; this.yardParts = null; this.hangar = null; this.built = false;
  }

  /** A mount's beat: the lanterns flare, the shide gust; the bolts flash on the screw's turns and the lock. */
  beat(b) {
    if (!this.built) return;
    this.flare = Math.max(this.flare, b === 'power' || b === 'wake' ? 1 : 0.6); this.gust = Math.max(this.gust, b === 'turn' ? 0.5 : 1);
    if (b === 'turn' || b === 'lock' || b === 'power') this.bolt = 1;
  }

  update(dt) {
    if (!this.built) return;
    const g = this.game, P = this.parts, h = this.hangar, d = Math.min(0.1, dt || 0); this.t += d;
    const sealed = !!h?.cradle && g.cradles?.sealed === h.cradle;
    this.flare = Math.max(0, this.flare - d / HD.fade); this.bolt = Math.max(0, this.bolt - d / HD.fade); this.gust = Math.max(0, this.gust - d / HD.fade);
    this.kilnK += ((sealed ? HD.sealedKiln : 1) - this.kilnK) * Math.min(1, d * 1.5);
    const fl = 1 + this.flare * HD.flare * (0.85 + 0.15 * Math.sin(this.t * 30));
    P.lanterns?.material.color.setRGB(fl, fl * (1 - this.flare * 0.12), fl * (1 - this.flare * 0.3));
    const bk = (sealed ? HD.boltSealed : HD.boltRest) + this.bolt * HD.boltFlash; P.bolts?.material.color.setScalar(bk);
    const flick = this.kilnK * (0.93 + 0.05 * Math.sin(this.t * 7.3) + 0.03 * Math.sin(this.t * 17.1));
    P.kiln?.material.color.setScalar(flick);
    for (const l of P.lamps?.kiln || []) l.intensity = l.userData.base * flick;
    if (P.lamp) P.lamp.intensity = P.lamp.userData.base * fl;
    // the shide: each strip's lower part swung by the breeze and the gust (its rest kept; a dozen quads, on the CPU)
    const S = P.shide; if (S?.mesh) {
      const pos = S.mesh.geometry.attributes.position, a = HD.breeze + this.gust * HD.gust, r = S.rest, k = S.k;
      for (let i = 0; i < pos.count; i++) {
        const sw = a * k[i] * k[i], ph = this.t * 2.3 + r[i * 3] * 0.7;
        pos.setXYZ(i, r[i * 3] + Math.sin(ph) * sw * 0.5, r[i * 3 + 1] + Math.abs(Math.sin(ph)) * sw * 0.15, r[i * 3 + 2] + Math.sin(ph * 0.8 + 1) * sw);
      }
      pos.needsUpdate = true;
    }
    // the motes drifting in the shaft's light (wrapped round its column)
    const M = P.motes; if (M?.points && g.zones?.current === 'hangar') {
      const pos = M.points.geometry.attributes.position, floor = HANGAR.at.y + 0.5;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - d * (0.15 + 0.1 * Math.sin(i)), x = pos.getX(i) + Math.sin(this.t * 0.3 + i) * d * 0.12;
        if (y < floor) y += M.top - 1;
        pos.setXY(i, x, y);
      }
      pos.needsUpdate = true;
    }
    // the dusk sky kept round the camera
    const dome = this.yardParts?.dome; if (dome) dome.position.copy(g.camera.position);
  }
}

export function installHangarDress(game) {
  const hd = new HangarDress(game); game.hangarDress = hd;
  game.systems?.add?.('looks', hd, { clock: 'raw', name: 'hangarDress', when: () => hd.built });
  return hd;
}
