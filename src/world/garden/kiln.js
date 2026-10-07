// ---------------------------------------------------------------------------------------
// THE HEAVENLY KILN: the tribulation at the Chimney that crosses a Firing (docs/plans/SPIRIT-GARDEN.md section 6; the pace is Dovina's,
// progress/realm.js strikesOf; the Firings are read from the attributes' ranks, progress/spirits.js firingOf; Espada's words, Wanda's
// cue while `game.garden.tribulation.active`). The Jar stands on the mat at the needle's foot; the sky darkens; lightning falls on it,
// strike after strike, each OUTLINED on the ground where it will land before it lands (PARRY.md: the skill is reading, never luck). Hop
// out of the ring, or flick the bolt back with the hand (the right button on the ring in its last moment). More than `may` hits and the
// kiln closes: failing costs nothing but the try. All struck through, the Firing is crossed (the log says its name). A Firing opens
// places and verbs, never numbers on the Courier.
// Events (each with `by`): cultivation.kiln { firing } (it opens), cultivation.tribulation { firing, passed, hits, parried }.
//
// Prior art: xianxia's heavenly tribulation (lightning that grows with the stage being crossed), Zelda's Ganon tennis (a bolt sent back),
// Bayonetta's Witch Time ring read before the blow, and the kiln's firing itself (the heat that makes clay into stoneware).
// The look is Calissa's (vfx/garden/tribulation.js): the storm over the Chimney with the kiln's fire in its eye (hotter the higher the
// Firing), each bolt traced then striking, its ring closing on the mat and gold in the flick's window.
//
//   const K = new Kiln(game, realm)   K.open() -> n | null (the Firing open to try)   K.begin()   K.flick(point)   K.update(dt)   K.cancel()   K.active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { strikesOf } from '../../progress/realm.js';
import { firingOf, ranksOf, FIRINGS } from '../../progress/spirits.js';
import { HeavenlyKiln } from '../../vfx/garden/tribulation.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/garden/kiln'); // (where a bolt lands about the Jar: core/rng.js, the same twice)

const RING = { r: 1.5, warn: 0.9, flick: 0.45, spread: 1.2, mat: 3.2 }; // (a bolt's ring 1.5 m; outlined 0.9 s before it lands; flicked in its last 0.45 s; landing within 1.2 m of the Jar; the mat 3.2 m round)
const UP = new THREE.Vector3(0, 1, 0);

export class Kiln {
  constructor(game, realm) {
    this.game = game; this.realm = realm; this.active = false; this.strikes = [];
    const M = this.mat; // (the sky stands over the mat, on the Chimney's own up)
    this.look = new HeavenlyKiln({ height: 40, radius: 60 }); this.look.group.position.copy(M.pos); this.look.group.quaternion.setFromUnitVectors(UP, M.pos.clone().sub(M.planet.c).normalize());
    realm.place.group.add(this.look.group);
  }

  /** The Firing open to try (the next past the last crossed, if the attributes' ranks have opened it), or null. */
  open() {
    const L = this.game.ledger, crossed = Math.max(1, L?.best?.('firing') || 0), opened = firingOf(L ? ranksOf(L) : 0); // (the first Firing is had from the start: progress/spirits.js FIRINGS)
    return opened > crossed ? crossed + 1 : null;
  }
  get mat() { return this.realm.place.features.find((f) => f.kind === 'peak'); }
  onMat() { const M = this.mat; return !!M && this.realm.jar?.pos.distanceTo(M.pos) < RING.mat + 1.5; }

  begin() {
    const g = this.game, n = this.open();
    if (this.active || n == null) return false;
    const S = strikesOf(n);
    this.active = true; this.firing = n; this.left = S.strikes; this.every = S.every; this.may = S.may; this.next = 1.6; this.hits = 0; this.parried = 0; this.endT = 0;
    this.look.open(0.35 + 0.65 * Math.min(1, (n - 1) / (FIRINGS.length - 1))); // (the eye's fire: red at the second Firing, the white of the hottest at the sixth)
    if (g.garden) g.garden.tribulation = { active: true, tier: n, outcome: null };
    g.events?.emit('cultivation.kiln', { firing: n, by: 'courier' });
    return true;
  }

  /** The hand's flick at a point: a bolt about to land there is sent back. */
  flick(point) {
    for (const s of this.strikes) if (!s.done && s.t <= RING.flick && s.at.distanceTo(point) < RING.r * 1.4) { s.done = 'parried'; this.parried++; s.B.eta = s.B.t; this.fx(s, true); sfx.parry?.(); return true; } // (it strikes now, short of the Jar)
    return false;
  }

  /** Left mid-tribulation (out by the gate, or put away): it ends unjudged, neither passed nor failed, its music and storm with it. */
  cancel() {
    if (!this.active) return;
    const g = this.game; this.active = false; this.left = 0; this.endT = 0; this.look.open(0);
    if (g.garden) g.garden.tribulation = { active: false, tier: this.firing, outcome: g.garden.tribulation?.outcome || null };
  }

  update(dt) {
    this.look.update(dt); // (the eye closes over a few seconds after the end)
    if (!this.active) return;
    const g = this.game, J = this.realm.jar;
    // the end: the music's ending on its bar line, then the kiln closes
    if (this.endT > 0) { if ((this.endT -= dt) <= 0) { this.look.open(0); this.active = false; if (g.garden) g.garden.tribulation = { active: false, tier: this.firing, outcome: g.garden.tribulation?.outcome || null }; } return; }
    // a new bolt, outlined where it will land (about the Jar, never far)
    if (this.left > 0 && (this.next -= dt) <= 0) {
      this.next = this.every; this.left--;
      const up = J.up.clone(), side = new THREE.Vector3(1, 0, 0).cross(up).normalize(), fwd = up.clone().cross(side);
      const a = simRand() * Math.PI * 2, r = simRand() * RING.spread, at = J.pos.clone().addScaledVector(side, Math.cos(a) * r).addScaledVector(fwd, Math.sin(a) * r).addScaledVector(up, -J.radius + 0.05);
      this.strikes.push({ at, up, t: RING.warn, done: null, B: this.look.bolt(at, RING.warn, { r: RING.r, flick: RING.flick, up }) });
    }
    for (const s of this.strikes) {
      if (s.done) continue;
      if ((s.t -= dt) > 0) continue;
      s.done = 'landed'; this.fx(s, false);
      if (J.pos.distanceTo(s.at) < RING.r + J.radius * 0.5 && !J.flight) { this.hits++; J.vel.addScaledVector(s.up, 6); J.grounded = false; this.realm.game.player.shake = 0.5; }
    }
    this.strikes = this.strikes.filter((s) => !s.done); // (the look lets its bolts fade by themselves)
    // through, or failed: the log says which (tracking/garden.js), the music turns to its ending
    const failed = this.hits > this.may, through = this.left <= 0 && !this.strikes.some((s) => !s.done);
    if (failed || through) {
      const passed = !failed;
      if (g.garden?.tribulation) g.garden.tribulation.outcome = passed ? 'passed' : 'failed';
      g.events?.emit('cultivation.tribulation', { firing: this.firing, passed, hits: this.hits, parried: this.parried, by: 'courier' });
      this.strikes = []; this.left = 0; this.endT = 2;
    }
  }

  /** The strike's flash and thunder (the bolt itself is the look's; sent back, the flash is gold). */
  fx(s, back) {
    this.game.fx?.toneBurst?.(s.at.clone(), back ? 0xffe9a0 : 0xbfe6ff, 1, 2.5);
    if (sfx.thunder) sfx.thunder(1); else sfx.slam?.(0.8); // (a placeholder until Wanda's thunder: her cue already falls with the bars)
  }
}
