// ---------------------------------------------------------------------------------------
// THE MOUNTS AT THE FREE HELM (docs/plans/OPEN-SEA.md 14.2; South, 2026-10-27: "the ship combat feels shallow"): the worn tools fired from
// the open sea's ship, each by its ARC (Dovina's SEA_MOUNTS, progress/rail/mounts.js), so the fight is where you put the ship. Keys 1 and
// 2 fire the main's and the sub's mount (the belt's: the psygun is always the bow gun, seafight.js). Run by seafight.js while sailing.
//   the harpoon (Sondelass)   across the beam: a beast tethered (`c.tether`, real s) cannot dive and its ram is blunted; with no beast in
//                             the arc, a wreck within reach is hooked and its crate reeled aboard (the room's salvage)
//   the toll (Crucibelle)     a ring round the hull: every windup inside it broken, its beast stunned 2 s; three charges, filled at a dock
//   the gulp (Lockheart)      off the bow: a spit drunk; the next bow-gun shot carries it back (x3: `gulped`)
//   sonar (Dreamvane)         passive: a ping each `cooldown` real s naming every beast under the water within reach (`sea.sonar`)
//   flash (Veritome)          off the bow: a beast's weak point held open (`c.open`, real s: its blows x1.5, seaserpent.js)
//   a slick (Soul Brush)      astern: a slick laid for `hold` real s; a beast swimming through it is slowed (the `slow` status) 3 s
// A mount's arc on the hull: bow (within angle/2 of the heading), stern (of its reverse), beam (of either side), ring (all round); reach
// from the hull's footprint (helm.hullDist). Its cost is from the pool; its cooldown and charges are kept here.
// Events (`by` courier): sea.mount { tool, ok, why? }, sea.sonar { beasts: [{ at, under }] }, sea.slick { at, r, life }.
// Prior art: Sea of Thieves' harpoon and its broadsides, Assassin's Creed IV's chase and mortar arcs, the rail's mounts (the same tools).
//
//   new SeaMounts(fight)   .update(dt, input, helm)   .worn -> [tool]   .takeGulp() -> bool   .refill()   .slicks   .clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SEA_MOUNTS, MOUNTS } from '../../progress/rail/mounts.js';

const KEYS = ['Digit1', 'Digit2'];
/** slick: a slick's radius (m), how far astern of the stern it is laid (m), the slow it puts on (real s); toll: the stun (real s);
 *  gulp: the bow shot's multiplier carried back; flash: the weak point's multiplier while open (read by seaserpent.js). */
export const MOUNTING = { slick: { r: 10, astern: 6, slow: 3 }, toll: { stun: 2 }, gulp: { k: 3 }, flash: { k: 1.5 } };
const _a = new THREE.Vector3();

export class SeaMounts {
  constructor(fight) { this.fight = fight; this.game = fight.game; this.cd = {}; this.used = {}; this.gulped = 0; this.pingT = 0; this.slicks = []; }
  /** The worn tools that have a mount at sea, main first (the psygun is the bow gun). */
  get worn() { const B = this.game.belt; return [B?.main, B?.sub].filter((t, i, a) => t && t !== 'psygun' && SEA_MOUNTS[t] && a.indexOf(t) === i); }
  refill() { this.used = {}; } // (at a dock: the toll's charges)
  clear() { this.slicks.length = 0; this.gulped = 0; }
  takeGulp() { if (this.gulped <= 0) return false; this.gulped--; return true; }

  update(dt, I, H) {
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);
    const W = this.worn;
    W.forEach((t, i) => { if (!SEA_MOUNTS[t].passive && I.wasPressed(KEYS[i])) this.fire(t, H); });
    if ((W.includes('dreamvane') || this.fight.crew.has('calissa')) && (this.pingT -= dt) <= 0) // (Calissa's hand reads the water as the vane does)
      { this.pingT = SEA_MOUNTS.dreamvane.cooldown; this.sonar(H); }
    this.tend(dt);
  }

  /** Whether `p` lies in mount M's arc off the hull, within its reach of the footprint. */
  inArc(M, H, p) {
    if (H.hullDist(p) > M.reach) return false;
    if (M.arc === 'ring') return true;
    let rel = Math.atan2(p.x - H.pos.x, p.z - H.pos.z) - H.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    const half = ((M.angle ?? 90) * Math.PI) / 360, a = Math.abs(rel);
    return M.arc === 'bow' ? a <= half : M.arc === 'stern' ? Math.PI - a <= half : Math.abs(a - Math.PI / 2) <= half;
  }
  /** The nearest live beast with a part in the arc (its head first). */
  target(M, H) {
    const S = this.fight.serpents; let best = null, bd = Infinity;
    for (const c of S.list) {
      if (!c.alive) continue;
      for (let i = 0; i < c.spine.length; i += i ? 3 : 1) { const p = S.at(c, i), d = H.hullDist(p); if (d < bd && this.inArc(M, H, p)) { bd = d; best = c; } }
    }
    return best;
  }
  /** Paid and ready: its cooldown run out, a charge left, the pool's cost paid. Refused at the point of use (log, throttled). */
  ready(t) {
    const M = SEA_MOUNTS[t], g = this.game, name = MOUNTS[t]?.name || t;
    const why = this.cd[t] > 0 ? 'cooldown' : M.charges && (this.used[t] || 0) >= M.charges ? 'charges' : null;
    if (why) { g.events?.emit('sea.mount', { tool: t, ok: false, why, by: 'courier' }); g.log?.say?.('warn', why === 'charges' ? `${name}: no charges left until a dock.` : `${name} is not ready.`, { key: 'sea.mount.' + t, throttle: 1.5 }); return false; }
    if (M.cost && g.lachryma && !g.lachryma.spend(M.cost, 'mount')) { g.events?.emit('sea.mount', { tool: t, ok: false, why: 'pool', by: 'courier' }); return false; }
    return true;
  }
  done(t, extra = {}) {
    const M = SEA_MOUNTS[t]; if (M.cooldown) this.cd[t] = M.cooldown; if (M.charges) this.used[t] = (this.used[t] || 0) + 1;
    this.game.events?.emit('sea.mount', { tool: t, ok: true, ...extra, by: 'courier' });
  }

  fire(t, H) {
    const M = SEA_MOUNTS[t], g = this.game, C = g.creatures, F = this.fight;
    if (!this.ready(t)) return;
    if (t === 'sondelass') {
      const c = this.target(M, H);
      if (c) { c.tether = M.hold; return this.done(t, { hit: 'beast' }); }
      const R = g.opensea, wreck = R?.props?.marks?.find((m) => m.feature.kind === 'wreck' && this.inArc(M, H, m.mesh.position));
      if (wreck) { R.salvage(wreck); return this.done(t, { hit: 'crate' }); }
      return this.done(t, { hit: null });
    }
    if (t === 'crucibelle') {
      let n = 0;
      for (const c of F.serpents.list) if (c.alive && c.attack && this.inArc(M, H, c.pos)) { c.attack = null; C?.unwind(c, 'parry'); C?.apply?.(c, 'stun', MOUNTING.toll.stun); n++; }
      return this.done(t, { broke: n });
    }
    if (t === 'lockheart') {
      let n = 0;
      for (let i = F.globs.length - 1; i >= 0; i--) { const b = F.globs[i]; if (!b.back && this.inArc(M, H, b.pos)) { F.dropGlob(b); F.globs.splice(i, 1); n++; } }
      this.gulped += n; return this.done(t, { drunk: n });
    }
    if (t === 'veritome') {
      const c = this.target(M, H); if (c) c.open = M.hold;
      return this.done(t, { hit: c ? 'beast' : null });
    }
    if (t === 'soulbrush') {
      const L = H.look?.length ?? 7, s = { at: H.pos.clone().addScaledVector(_a.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)), -(L / 2 + MOUNTING.slick.astern)), r: MOUNTING.slick.r, t: M.hold };
      this.slicks.push(s); g.events?.emit('sea.slick', { at: s.at, r: s.r, life: s.t, by: 'courier' });
      return this.done(t);
    }
  }

  sonar(H) {
    const S = this.fight.serpents, M = SEA_MOUNTS.dreamvane, beasts = [];
    for (const c of S.list) if (c.alive && (c.under ?? 0) > 0.5 && H.hullDist(c.pos) <= M.reach) beasts.push({ at: c.pos.clone(), under: +c.under.toFixed(2) });
    this.game.events?.emit('sea.sonar', { beasts, by: 'courier' });
  }

  /** Each frame: tethers and open weak points run down, a tethered beast kept up, the slicks age and slow what swims through. */
  tend(dt) {
    const S = this.fight.serpents, C = this.game.creatures;
    for (const c of S.list) {
      if (c.tether > 0) { c.tether = Math.max(0, c.tether - dt); c.goUnder = 0; }
      if (c.open > 0) c.open = Math.max(0, c.open - dt);
    }
    for (let i = this.slicks.length - 1; i >= 0; i--) {
      const s = this.slicks[i]; if ((s.t -= dt) <= 0) { this.slicks.splice(i, 1); continue; }
      for (const c of S.list) if (c.alive && Math.hypot(c.pos.x - s.at.x, c.pos.z - s.at.z) < s.r) C?.apply?.(c, 'slow', MOUNTING.slick.slow);
    }
  }
}
