// ---------------------------------------------------------------------------------------
// THE BOARD'S RULES (docs/plans/SKIFF-RACING.md section 12; the owner, 2026-10-14: "build everything"): what the Solar Skiff answers to
// beside its sailing (skiff.js keeps the sailing; this keeps the stakes), at the Raceway.
//   - THE POOL IS THE HULL (F-Zero's energy, and the ARPG's shield: the owner's "chef's kiss"): the Courier's own pool, the very same one,
//     with its own regen untouched (the owner, 2026-10-14: "the literal same pool"). A bump, a wall, a hard landing and a bail each drain
//     it; Shift's flare drains it as ever; with the pool empty the next real hit WRECKS the board. The vein lanes refill it faster than
//     its regen (a long strip of Lachrymite beside the line: F-Zero's pit, chosen, off the line's best). Events: skiff.hull { kind, damage, left }, skiff.wreck { kind }, skiff.refill { fresh, share } (every 0.2 real s on a lane).
//   - THE SCORCH (Excitebike's overheat): a flare held too long scorches the sail; full, the sail luffs for a beat (no flare, slower).
//     Events: skiff.scorch.
//   - THE MANUAL (Tony Hawk's): W and S held together on the sand with a combo live balances the board on its tail: the combo's link
//     holds while you keep the balance (A and D, as the grind), and a fall banks it. Event: skiff.manual { seconds, fell }.
//   - SNAKING: a carve begun the other way within a moment of letting one go loads faster, more for each in the chain.
//   - THE SHOULDER (F-Zero GX's side attack): Q or E tapped twice slams the board sideways; a rival beside it there is hit as by a takedown.
//     Event: skiff.shoulder { side }.
//   - AFTERTOUCH (Burnout 3's): thrown in a bail, W A S D steer the tumbling body a little; land it on a rival and it is taken down.
//   - THE NEAR MISS (Burnout's): at speed, past a rival, a pillar or a column within a hand's breadth without touching it: a trick.
//     Event: skiff.nearmiss { what }.
// The board's numbers also answer to the garage's parts (progress/skiffparts.js `mult`), the City Trial's patches (world/raceway/
// citytrial.js) and the buoys' power (world/raceway/buoys.js).
//
// Prior art: F-Zero X / GX (energy as both health and boost, the pit strip, the side attack), Excitebike (the overheat), Tony Hawk's Pro
// Skater 2 (the manual), Mario Kart Wii (snaking), Burnout 3 (aftertouch, near misses, takedowns).
//
//   const B = new BoardRules(skiff)   B.step(dt)   B.mult(key)   B.hit(kind, size) -> wrecked   B.flare(dt, want) -> allowed   B.luffing
//   B.manual(dt, inp, onSand, steer) -> on   B.carveStart(dir) -> rate   B.carveRelease(dir)   B.shoulder(dt, inp)   B.aftertouch(dt, inp)
//   B.nearMiss(dt)   B.refill(dt, plate, fresh)   HULL, SCORCH, MANUAL, SNAKE, SHOULDER, AFTER, NEAR (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The hull: the pool drained for each m/s of a bump's closing speed, each m/s lost into a wall past `wallFree`, each m/s of a hard
 *  landing past the hard line, a bail's flat cost; the size of hit (m/s) that wrecks a board with the pool empty; the vein lane's refill
 *  (a real second). */
export const HULL = { bump: 0.9, wall: 1.4, wallFree: 4, land: 0.6, bail: 12, wreck: 3, refill: 40, empty: 0.5 };
/** The scorch: built a real second of flare, cooled a real second without; the luff's length (real s) and its pace. */
/** Grip by surface (SKIFF-TUNING.md 2.2; the owner, 2026-10-22: "I agree with all your skiff plans"): the sand as it was, water looser,
 *  Lachrymite (a vein lane) keener. A modifier with a source you can see: the ground under the board. */
export const SURFACE = { sand: 1, water: 0.85, vein: 1.1 };
export const SCORCH = { build: 0.14, cool: 0.35, luff: 2, pace: 0.6 }; // (v204, the owner: "time to scorch way too short": 0.4 scorched in 2.5 real s of flare; now about 7)
/** The manual: its drift, A / D's answer, points a real second (counted when it ends). */
export const MANUAL = { drift: 0.45, answer: 1.6, points: 30 };
/** Snaking: real seconds after a carve's release the next (the other way) chains; each link's rate, the most. */
export const SNAKE = { window: 1.2, step: 0.25, max: 2 };
/** The shoulder: real seconds between the taps; its push (m/s across), its reach to a rival (m), real seconds before another. */
export const SHOULDER = { tap: 0.25, push: 7, reach: 3.5, cool: 1 };
/** Aftertouch: its push on the tumbling body (m/s a real second), for how long into the bail (real s), its reach to a rival (m). */
export const AFTER = { push: 9, dur: 1.4, reach: 2.6 };
/** The near miss: within `r` metres of a thing's side, from `speed` m/s, its points, real seconds before the same thing counts again. */
/** A made track's Thirst rule: Lachryma a real second the pool gives up while racing it. */
export const THIRST = 3;
export const NEAR = { r: 1.3, speed: 18, points: 40, again: 2 };

const _v = new THREE.Vector3();

export class BoardRules {
  constructor(S) { this.S = S; this.scorch = 0; this.luffT = 0; this.manualOn = false; this.mLean = 0; this.mT = 0; this.snake = 0; this.last = { dir: 0, t: -9 }; this.taps = {}; this.shoulderT = 0; this.near = new Map(); }
  get game() { return this.S.game; }
  get here() { return !!this.game.raceway?.active; }
  get racing() { return !!this.game.race?.running && this.here; }
  /** The garage's multiplier for one of the board's numbers: top, accel, grip, coast, turn, carveRate, hover, follow, wobble (skiff.js), the
   *  grind's answer and drift (grind.js), mass (a bump). 1 for each a source leaves alone: the stock board (SKIFF-TUNING.md 2.2). */
  mult(key) { const g = this.game; return (g.skiffParts?.mult(key) ?? 1) * (g.cityTrial?.mult(key) ?? 1) * (this.here ? g.raceway.buoys?.mult(key) ?? 1 : 1); } // (the parts, the City Trial's patches, the buoys' power)

  /** The ground's grip under the board: water, a vein lane's Lachrymite, or the sand. */
  surfaceGrip(onWater) {
    const R = this.here ? this.game.raceway : null, p = this.S.P?.pos, onMade = R?.track && R.track === R.made?.T;
    const k = (p && R?.traps?.gripAt(p.x, p.z)) ?? 1, rule = onMade && R.made.rule('slick') ? 0.67 : 1; // (a gusher's slick; a made track's Slick sand rule: TRACK-EDITOR.md 4, 5)
    return (onWater ? SURFACE.water : this.veinT > 0 ? SURFACE.vein : SURFACE.sand) * k * rule;
  }
  /** Each ride step: the cooldowns run down. (The pool keeps its own regen, race or not: the owner, 2026-10-14.) */
  step(dt) {
    this.shoulderT = Math.max(0, this.shoulderT - dt); this.veinT = Math.max(0, (this.veinT || 0) - dt);
    if (this.racing && this.madeRule('thirst')) this.game.lachryma?.drain?.(THIRST * dt, 'thirst'); // (Thirst: the made track's rule)
    for (const [k, t] of this.near) if ((t - dt) <= 0) this.near.delete(k); else this.near.set(k, t - dt);
  }

  /** A hit on the hull (kind: bump, wall, land, bail; size in its own units): the pool drained; empty, a real hit wrecks. True if wrecked. */
  hit(kind, size) {
    const g = this.game, L = g.lachryma; if (!L || !this.here || size <= 0) return false;
    if (kind !== 'bail' && L.value <= HULL.empty && size >= HULL.wreck && this.S.phase === 'ride') {
      g.events?.emit('skiff.wreck', { kind, by: 'courier' }); this.S.bail('wrecked'); return true;
    }
    const damage = (kind === 'bail' ? HULL.bail : size * HULL[kind]) * (g.classArtsRun?.reinsK?.() ?? 1); // (Reins, a class's art: a hit takes less)
    const took = L.drain(damage, 'hull');
    g.events?.emit('skiff.hull', { kind, damage: +took.toFixed(1), left: +L.value.toFixed(1), by: 'courier' });
    return false;
  }
  /** On a vein lane: the pool refilled (a real second's share). */
  refill(dt, plate, fresh) { // (said every fifth of a real second while on the lane: Wanda's shimmer holds while they come; `fresh` on entering it)
    this.veinT = 0.3; // (on a vein lane this fifth of a real second: its grip, SURFACE)
    const L = this.game.lachryma; if (!L) return; L.gain(HULL.refill * dt, 'vein');
    this.refillT = fresh ? 0 : (this.refillT || 0) - dt; if (this.refillT > 0) return; this.refillT = 0.2;
    this.game.events?.emit('skiff.refill', { fresh: !!fresh, share: +(L.value / L.max).toFixed(2), by: 'courier' });
  }

  /** The flare asked for this step: allowed unless the sail is luffing from a scorch; the scorch built while flaring, cooled while not. */
  /** On a made track whose rule this is (trackdef.js RULES: the stele at its start says so). */
  madeRule(id) { const R = this.here ? this.game.raceway : null; return !!R?.track && R.track === R.made?.T && R.made.rule(id); }
  flare(dt, want) {
    if (want && this.madeRule('noflare')) return false; // (No flares: the made track's rule)
    if (this.luffT > 0) { this.luffT -= dt; this.scorch = Math.max(0, this.scorch - SCORCH.cool * dt); return false; }
    if (!want) { this.scorch = Math.max(0, this.scorch - SCORCH.cool * dt); return false; }
    this.scorch += SCORCH.build * dt;
    if (this.scorch >= 1) { this.scorch = 0.6; this.luffT = SCORCH.luff; this.game.events?.emit('skiff.scorch', { by: 'courier' }); return false; }
    return true;
  }
  get luffing() { return this.luffT > 0; }

  /** The manual: W and S held together on the sand while a combo is live. True while it holds (the combo's link lives). */
  manual(dt, inp, onSand, steer) {
    const S = this.S, want = onSand && inp.isDown('KeyW') && inp.isDown('KeyS') && S.combo.n > 0;
    if (want && !this.manualOn) { this.manualOn = true; this.mLean = 0; this.mT = 0; }
    if (!this.manualOn) return false;
    if (want) {
      this.mT += dt;
      const drift = (Math.sin(this.mT * 2.1) * 0.6 + Math.sin(this.mT * 3.7 + 1) * 0.4) * (MANUAL.drift + 0.05 * this.mT);
      this.mLean += (drift + steer * MANUAL.answer * 0.5 * (this.game.skiffSettings?.invert ? -1 : 1)) * dt * 2;
      S.manualLean = this.mLean;
      if (Math.abs(this.mLean) <= 1) return true;
    }
    const fell = want; this.manualOn = false; S.manualLean = 0;
    this.game.events?.emit('skiff.manual', { seconds: +this.mT.toFixed(2), fell, by: 'courier' });
    if (fell) { S.v.multiplyScalar(0.8); S.combo.bank(); } else if (this.mT > 0.4) S.combo.add('manual', MANUAL.points * this.mT);
    return false;
  }

  /** A carve begun: its loading rate, more if it snakes (the other way, soon after the last let go). */
  carveStart(dir) {
    const t = this.S.rideT || 0;
    this.snake = dir === -this.last.dir && t - this.last.t < SNAKE.window ? Math.min(SNAKE.max / SNAKE.step, this.snake + 1) : 0;
    return 1 + Math.min(SNAKE.max - 1, SNAKE.step * this.snake);
  }
  carveRelease(dir) { this.last = { dir, t: this.S.rideT || 0 }; }

  /** Q or E tapped twice on the sand: the shoulder, a slam sideways; a rival there is taken down. */
  shoulder(dt, inp) {
    const S = this.S, g = this.game; if (S.air || S.grind.on) return;
    for (const [code, side] of [['KeyQ', -1], ['KeyE', 1]]) {
      const down = inp.isDown(code), T = (this.taps[code] ||= { was: false, at: -9 }); if (!down || T.was) { T.was = down; continue; }
      T.was = true; const t = S.rideT || 0;
      if (t - T.at < SHOULDER.tap && this.shoulderT <= 0) {
        T.at = -9; this.shoulderT = SHOULDER.cool;
        const r = _v.set(-Math.cos(S.heading), 0, Math.sin(S.heading)).multiplyScalar(side); // (the board's right, by the side tapped)
        S.v.addScaledVector(r, SHOULDER.push);
        g.events?.emit('skiff.shoulder', { side: side > 0 ? 'right' : 'left', by: 'courier' });
        const V = g.race?.rivals; if (V?.on) for (const R of V.list) { const dx = R.group.position.x - g.player.pos.x, dz = R.group.position.z - g.player.pos.z; if (Math.hypot(dx, dz) < SHOULDER.reach && dx * r.x + dz * r.z > 0) V.takedown(R, 'shoulder'); }
      } else T.at = t;
    }
  }

  /** In a bail: W A S D steer the thrown body (relative to the camera's way), and a rival under it is taken down. */
  aftertouch(dt, inp) {
    const S = this.S, g = this.game, rag = S.rag; if (!rag?.active || S.phaseT > AFTER.dur) return;
    const yaw = g.player.yaw, fwd = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0), side = (inp.isDown('KeyD') ? 1 : 0) - (inp.isDown('KeyA') ? 1 : 0);
    if (fwd || side) {
      const ax = (Math.sin(yaw) * fwd - Math.cos(yaw) * side) * AFTER.push * dt, az = (Math.cos(yaw) * fwd + Math.sin(yaw) * side) * AFTER.push * dt;
      for (const p of rag.parts || []) { const v = p.body?.linvel?.(); if (v) p.body.setLinvel({ x: v.x + ax, y: v.y, z: v.z + az }, true); }
    }
    const V = g.race?.rivals, h = rag.hips; if (!V?.on || !h) return;
    for (const R of V.list) if (R.wreck <= 0 && h.distanceTo(R.group.position) < AFTER.reach) V.takedown(R, 'aftertouch');
  }

  /** A near miss: at speed, a rival, a pillar or a column passed within a hand's breadth (each counts again after a beat). */
  nearMiss() {
    const S = this.S, g = this.game, P = g.player.pos; if (!this.here || S.speed < NEAR.speed) return;
    const things = g.raceway?.nearThings?.(P) || [];
    const V = g.race?.rivals; if (V?.on) for (const R of V.list) things.push({ key: `rival${R.i}`, x: R.group.position.x, y: R.group.position.y, z: R.group.position.z, r: 0.9, what: 'rival' });
    for (const T of things) {
      if (this.near.has(T.key) || Math.abs(P.y - T.y) > 4) continue;
      const gap = Math.hypot(P.x - T.x, P.z - T.z) - T.r - 0.6; // (the board's half-width)
      if (gap > 0.05 && gap < NEAR.r) { this.near.set(T.key, NEAR.again); S.combo.add('nearmiss', NEAR.points); g.events?.emit('skiff.nearmiss', { what: T.what, by: 'courier' }); }
    }
  }
}
