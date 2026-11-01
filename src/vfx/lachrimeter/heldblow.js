// ---------------------------------------------------------------------------------------
// THE HELD BLOW'S FUSE (a part of the Lachrimeter's tube, vfx/lachrimetertube.js; Dovina, 2026-11-01: Postpone's debt shown on the
// Lachrimeter, "the critic's point: WoW's Stagger is hard to read without its bar"): while Postpone holds a blow
// (game.domainArtsRun.held: { at, blow: { k }, parried }, courier/domainarts/run.js), a ring of clay segments stands round the bulb's
// glass, and an ember burns along it from the top, clockwise, as the delay runs out: the ring full of ember is the blow landing. Its
// thickness is the blow's weight (blow.k). Parried, the far half of the ring cracks off grey: half the blow is owed. When it lands the
// ring flashes white and is gone; the tube is held up while it burns (the pool may be full). No words: the tube's own count is the pool's.
//
// Prior art: World of Warcraft's Stagger bar (damage owed, draining as it ticks in), FFXIV's Doom (a debuff whose timer is the threat),
// a fuse burning down to the charge; the Blink's pearls beside it (vfx/lachrimeter/blinkpearls.js: a part of the tube in its own units,
// drawn with the tube's flat material, nothing allocated a frame).
//
//   const F = new HeldBlowFuse({ add, basic })     the tube's own builders (its `add` and `basic`, lachrimetertube.js build())
//   F.update(dt, run, delay)                       run: game.domainArtsRun (or null); delay: Postpone's real s (DOMAIN_ARTS.postpone)
//   F.busy                                         true while a blow is held or its flash is still showing (the tube stays up)
//   HELD_BLOW_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const HELD_BLOW_LOOK = {
  n: 20, r: 0.6, z: 0.12, // (segments; the ring's radius round the bulb at the origin, its depth toward the eye: the bulb's glass is 0.42)
  len: 0.15, thick: [0.04, 0.09], // (a segment's length, its thickness from a light blow to a full one)
  lit: 0xff8a3a, hot: 0xfff0c8, cold: 0x3a2a24, broken: 0x6a6460, // (the ember, its tip, the clay unburnt, the parried half)
  flash: 0.35, // (the landing's flash, real s)
};
const L = HELD_BLOW_LOOK;

export class HeldBlowFuse {
  constructor({ add, basic }) {
    this.mats = { lit: basic(L.lit), hot: basic(L.hot), cold: basic(L.cold), broken: basic(L.broken, { transparent: true, opacity: 0.55 }) };
    const geo = new THREE.BoxGeometry(L.len, 1, 0.05);
    this.segs = [];
    for (let i = 0; i < L.n; i++) {
      const a = Math.PI / 2 - (i + 0.5) / L.n * Math.PI * 2; // (from the top, clockwise as the eye sees it)
      const m = add(geo, this.mats.cold, 6);
      m.position.set(Math.cos(a) * L.r, Math.sin(a) * L.r, L.z); m.rotation.z = a + Math.PI / 2; m.visible = false;
      this.segs.push(m);
    }
    this.flashT = 0; this.wasHeld = false; this.busy = false;
  }

  update(dt, run, delay = 4) {
    const H = run?.held || null;
    if (!H && this.wasHeld) this.flashT = L.flash; // (it landed: the flash)
    this.wasHeld = !!H;
    this.flashT = Math.max(0, this.flashT - dt);
    this.busy = !!H || this.flashT > 0;
    const show = this.busy;
    for (const m of this.segs) m.visible = show;
    if (!show) return;
    if (!H) { for (const m of this.segs) { m.material = this.mats.hot; m.scale.y = L.thick[1] * (0.5 + this.flashT / L.flash); } return; }
    const left = Math.max(0, H.at - (run.now ?? 0)), burnt = 1 - Math.min(1, left / Math.max(0.01, delay));
    const k = Math.min(1, Math.max(0, H.blow?.k ?? 0.5)), th = L.thick[0] + (L.thick[1] - L.thick[0]) * k;
    const lit = burnt * L.n, owed = H.parried ? L.n / 2 : L.n;
    this.segs.forEach((m, i) => {
      m.scale.y = th;
      if (i >= owed) { m.material = this.mats.broken; m.scale.y = th * 0.6; return; } // (the parried half, cracked off)
      m.material = i < Math.floor(lit) ? this.mats.lit : i < lit + 0.999 ? this.mats.hot : this.mats.cold;
    });
  }
}
