// ---------------------------------------------------------------------------------------
// THE SKIFF ON WATER (the owner's notes on v198, Dovina's handoff 2026-10-14 item 2: "no wake or trail over water, nor a splash entering
// the Lachryma pool"): what the Solar Skiff leaves on water as it skims (the Raceway's lakes and fords, the cavern's pool, the oasis
// and the Weir's Well), heard on `skiff.water { on, speed }` and read off `techs.get('skiff').onWater`:
//   - THE SPLASH   onto the water: a crown of drops and a puff of mist off the keel (`skiff.water.enter`), in Lachryma's colour on
//                  Lachryma (`skiff.water.enter.lachryma`), and a deep dent in the ripple tank, so real rings run out from it; off
//                  the water, a few drops falling from the hull (`skiff.water.exit`)
//   - THE SPRAY    held while it skims: a fan of drops off either side of the keel, thrown out, up and back, more the faster
//                  (`skiff.water.spray`, `.lachryma`)
//   - THE V        the wake behind is the ripple tank's own (vfx/ripples.js): the keel and both flanks dented into it every frame, so the
//                  rings spread from the line the board ran and open into a V behind (the rings run faster while a board skims:
//                  vfx/waterfx.js); the sand's wake lines (world/ground/wake.js) give way to it on water (skiff.js passes the water as air)
// No mesh and no material of its own: the library's effects on the shared particle pools, and dents in the tank the water's shader
// already reads. Draw calls: none added (the pools draw as they do).
//
// Prior art: Wave Race 64's and Jet Moto's rooster tail and spray fan off a hull, Wind Waker's wake and splashes (the King of Red
// Lions' bow spray), Super Mario Sunshine's rings round what touches the water, a real planing hull's spray sheet off the chines.
//
//   game.waterFx.skiff = new SkiffWaterLook(game)   .update(rawDt)   (vfx/waterfx.js runs it)   .kind ('water' | 'lachryma' | null)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RW } from '../world/raceway/track.js';

/** The numbers: the speed (m/s) under which it neither sprays nor dents; the speed of a full spray; the stern and the flanks (m, the
 *  board's frame: aft of the centre, either side); a dent's strength at full speed, and the metres run between dents; the keel's height over the water for the spray. */
export const SKIFF_WATER = { from: 1.5, full: 22, stern: 1.2, flank: 0.55, dent: 0.75, every: 0.35, up: 0.05 };

const _f = new THREE.Vector3(), _r = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

export class SkiffWaterLook {
  constructor(game) {
    this.game = game; this.kind = null; this.sprayH = []; this.subbed = false; this.last = null;
  }
  skiff() { const S = this.game.player?.techs?.get?.('skiff'); return S?.active && S.skiff?.group ? S : null; }

  /** Which water is under (x, z) at the height y: the volume's kind (the oasis, the Weir's Well), or the Raceway's lake (a `.pool` is the
   *  cavern's Lachryma), or plain water. */
  kindAt(x, y, z) {
    const W = this.game.water, v = W?.at?.(x, y - 0.1, z); if (v) return v.kind || 'water';
    const R = this.game.raceway, lakes = R?.P?.lakes;
    if (lakes) {
      const lx = x - RW.x, lz = z - RW.z;
      for (const L of lakes) {
        const dx = lx - L.x, dz = lz - L.z, c = Math.cos(L.rot || 0), s = Math.sin(L.rot || 0), u = dx * c - dz * s, w = dx * s + dz * c; // (park.js lakeE)
        if (Math.hypot(u / L.rx, w / L.rz) < 1) return /\.pool$/.test(L.id) ? 'lachryma' : 'water';
      }
    }
    return 'water';
  }

  /** The board's frame on the water: forward, right, the stern's point at the surface. */
  frame(S, out) {
    const a = S.heading, G = S.skiff.group;
    _f.set(Math.sin(a), 0, Math.cos(a)); _r.set(-Math.cos(a), 0, Math.sin(a));
    out.copy(G.position).addScaledVector(_f, -SKIFF_WATER.stern);
    out.y = S.dunes?.rideHeight ? S.dunes.rideHeight(out.x, out.z) : G.position.y;
    return out;
  }

  /** On the water or off it (skiff.water): the splash, and a deep dent for its rings. */
  splash(e) {
    const S = this.skiff(), V = this.game.vfx; if (!S || !V) return;
    const p = this.frame(S, new THREE.Vector3()), k = Math.min(1, (e?.speed ?? S.speed ?? 0) / SKIFF_WATER.full);
    if (e?.on) {
      const kind = this.kindAt(p.x, p.y, p.z);
      V.play(kind === 'lachryma' ? 'skiff.water.enter.lachryma' : 'skiff.water.enter', { pos: p, dir: _f.clone().negate().setY(0.8).normalize(), vel: S.v, power: 0.6 + 0.6 * k, phase: (S.time || 0) * 0.3 });
      this.game.water?.disturb?.(p.x, p.z, 0.6 + 0.4 * k, 'skiffSplash', p.y);
    } else V.play('skiff.water.exit', { pos: p.setY(S.skiff.group.position.y), vel: S.v, power: 0.5 + 0.5 * k });
  }

  stopSpray() { for (const h of this.sprayH) h?.stop(); this.sprayH = []; this.kind = null; }

  update(raw) {
    const g = this.game;
    if (!this.subbed && g.events?.on) { this.subbed = true; g.events.on('skiff.water', (e) => this.splash(e)); }
    const S = this.skiff(), speed = S?.speed || 0;
    if (!S || S.phase !== 'ride' || !S.onWater || S.air || speed < SKIFF_WATER.from) { if (this.sprayH.length) this.stopSpray(); this.last = null; return; }
    const C = SKIFF_WATER, k = Math.min(1, speed / C.full), p = this.frame(S, new THREE.Vector3()), kind = this.kindAt(p.x, p.y, p.z);
    // the V: the keel and both flanks dented into the ripple tank where the board is now (its rings open behind it)
    const W = g.water, moved = this.last ? Math.hypot(p.x - this.last.x, p.z - this.last.z) : Infinity;
    if (W?.disturb && moved >= C.every) { // (a dent each `every` metres run: a line of them, never one heaped in place)
      this.last = { x: p.x, z: p.z };
      const s = C.dent * (0.35 + 0.65 * k);
      W.disturb(p.x, p.z, s, 'keel', p.y);
      for (const side of [-1, 1]) W.disturb(p.x + _r.x * side * C.flank, p.z + _r.z * side * C.flank, s * 0.7, 'keel', p.y);
    }
    // the spray: a fan off either side of the keel, out, up and back
    const V = g.vfx; if (!V) return;
    if (kind !== this.kind) this.stopSpray();
    if (!this.sprayH.length) {
      this.kind = kind;
      for (const side of [-1, 1]) {
        const follow = (h) => {
          const B = this.skiff(); if (!B || !B.onWater || B.air || B.phase !== 'ride' || (B.speed || 0) < C.from) return false;
          this.frame(B, h.pos); h.pos.addScaledVector(_f, 0.6).addScaledVector(_r, side * 0.3); h.pos.y += C.up;
          h.dir.copy(_r).multiplyScalar(side).addScaledVector(UP, 0.75).addScaledVector(_f, -0.9).normalize();
          h.k = Math.min(1, (B.speed || 0) / C.full); h.ctx.vel = B.v; h.ctx.phase = (B.time || 0) * 0.3; return true;
        };
        const h = V.play(kind === 'lachryma' ? 'skiff.water.spray.lachryma' : 'skiff.water.spray', { follow }); follow(h); this.sprayH.push(h);
      }
    }
  }
}
