// ---------------------------------------------------------------------------------------
// THE WIND ON THE OPEN SEA (docs/plans/OPEN-SEA.md section 14; the owner, 2026-10-27: "the module itself feels underwhelming/underbaked"):
// sailing's one real decision, the heading against the wind. The sea has a wind each game hour, blowing from somewhere and so strong; a
// ship's sail gives its way by its POINT OF SAIL, the angle off the wind (a polar diagram): nothing head to wind (in irons), most on a
// beam or broad reach, a little less running dead before it. What the sail does not give, the Lachryma engine makes up, from the tank:
// so the fuel a square costs is the share the wind did not carry, and a heading picked well is fuel kept (skill skips grind: a sailor who
// ignores the wind pays the burn of old, one who tacks pays a fraction). The mechanic is the lesson (DESIGN.md 22): the points of sail,
// tacking toward the wind, running before it, as any dinghy teaches them.
//
// Prior art: a real sailboat's polar diagram (speed by true wind angle); The Legend of Zelda: The Wind Waker (the wind's direction the
// one thing a sail cares about, shown on the sail and the vane); Sea of Thieves (the sails' angle to the wind, a ship slowed head to
// it); Sid Meier's Pirates! (the wind's strength and a ship's best point of sail); Sunless Sea (fuel as the voyage's clock).
//
//   WIND (its numbers)   windAt(seed, gameHour, { front }) -> { to, from, k }   offWind(heading, wind) -> rad 0..PI
//   polar(off, rig?) -> 0..1   pointOf(off) -> 'irons' | 'closeHauled' | 'beamReach' | 'broadReach' | 'running'   sailOf(heading, wind, rig?) ->
//   { off, point, share, speedK, burnK }   meanBurnK() -> the burn's share a sailor who never minds the wind pays (for the base burn)
//   GUST, gustsNear(seed, x, z, t, wind, reach) -> [{ x, z, r, k }], gustAt(gusts, x, z) -> 0..1, gusted(wind, g)   RIP, ripsOf(grid, seed) -> Map,
//   ripPush(rip, dx, dz) -> { x, z } | null (a gust: a cat's paw, the wind harder for a beat; a rip: a current along a band in its square)
//   Headings and the wind's `to` are yaws as the helm keeps them: forward is (sin yaw, cos yaw). `from` is where it blows from.
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';

/** prevail: the yaw the trade wind blows toward (+x: the columns' way, from the Law end to the Chaos end); veer: how far an hour's wind
 *  wanders from it at most (rad); k: its strength a game hour, between lo and hi, a front's `front`; irons: the angle off the wind under
 *  which a sail gives nothing (rad, 40 degrees), best: where it gives most (110 degrees), run: what running dead before it gives; speed:
 *  the way's share at no sail and at full (the engine alone keeps 0.85 of cruise: the wind is a gift, never a wall); save: the most of a
 *  square's burn a full sail spares (0.8: the engine always ticks over). */
export const WIND = {
  prevail: Math.PI / 2, veer: 1.1, k: { lo: 0.3, hi: 0.9, front: 1 },
  irons: (40 * Math.PI) / 180, best: (110 * Math.PI) / 180, run: 0.75,
  speed: { lo: 0.85, hi: 1.25 }, save: 0.8,
};

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** The wind of a game hour: the trade wind wandered by a walk of the hours (the same sea, the same wind, for everyone), and its strength;
 *  inside a front, a gale. */
export function windAt(seed = 1, gameHour = 0, { front = false } = {}) {
  const h = Math.floor(gameHour), f = gameHour - h, at = (n) => { const r = seeded((seed * 7919 + n * 104729) >>> 0); return [r() * 2 - 1, r()]; };
  const [a0, k0] = at(h), [a1, k1] = at(h + 1), e = f * f * (3 - 2 * f); // (eased hour to hour: a wind veers, it never jumps)
  const to = wrap(WIND.prevail + WIND.veer * (a0 + (a1 - a0) * e));
  const k = front ? WIND.k.front : WIND.k.lo + (WIND.k.hi - WIND.k.lo) * (k0 + (k1 - k0) * e);
  return { to, from: wrap(to + Math.PI), k };
}

/** The angle between a heading and the wind's eye: 0 head to wind, PI running dead before it. */
export const offWind = (heading, wind) => Math.abs(wrap(heading - wind.from));

/** What a sail gives at an angle off the wind, 0..1 (a polar diagram's shape: nothing in irons, rising to the reach, a little less dead
 *  downwind). */
export function polar(off, rig = null) {
  const irons = rig?.irons ?? WIND.irons, best = rig?.best ?? WIND.best, run = rig?.run ?? WIND.run; // (a sail part's own polar: salvage.js SHIP_PARTS)
  if (off <= irons) return 0;
  if (off <= best) { const u = (off - irons) / (best - irons); return Math.sin((u * Math.PI) / 2); }
  const u = (off - best) / (Math.PI - best); return 1 - (1 - run) * u * u;
}

/** The point of sail's name (the view's and the log's, plain sailing words). */
export function pointOf(off) {
  const d = (off * 180) / Math.PI;
  return d < 40 ? 'irons' : d < 70 ? 'closeHauled' : d < 115 ? 'beamReach' : d < 155 ? 'broadReach' : 'running';
}

/** A heading in a wind: its angle off, its point of sail, the sail's share of the way (its polar by the wind's strength), what that does
 *  to the speed and to a square's burn. */
export function sailOf(heading, wind, rig = null) {
  const off = offWind(heading, wind), k = rig?.lo != null ? wind.k * (rig.lo + (rig.hi - rig.lo) * wind.k) : wind.k, p = polar(off, rig), share = Math.min(1, p * k);
  const named = pointOf(off), point = p === 0 ? 'irons' : named === 'irons' ? 'closeHauled' : named; // (in irons is where this sail gives nothing: a lateen points higher)
  return { off, point, share, speedK: WIND.speed.lo + (WIND.speed.hi - WIND.speed.lo) * share, burnK: 1 - WIND.save * share };
}

/** The burn's share paid by a sailor who never minds the wind (every heading alike, an hour's ordinary wind): what the base burn is
 *  divided by so that sailor pays what the sea cost before the wind (seatrip.js). */
export function meanBurnK() {
  let sum = 0, n = 0; const k = (WIND.k.lo + WIND.k.hi) / 2;
  for (let i = 0; i < 360; i++) { sum += 1 - WIND.save * polar((Math.abs(i - 180) * Math.PI) / 180) * k; n++; }
  return sum / n;
}

// ---- gusts: a cat's paw, a dark patch on the water where the wind blows harder, drifting downwind (sail into one for a burst)
/** cell: the gusts' grid (m); chance: a cell's share holding one a life; r: its radius (m); life: real s from rising to gone; k: the
 *  wind's strength it adds at its heart; drift: its way downwind (m a real s). */
export const GUST = { cell: 160, chance: 0.22, r: [35, 70], life: 50, k: 0.5, drift: 6 };

/** The gusts within `reach` m of (x, z) at real second `t` under a wind: { x, z, r, k } each, k its strength now (rising and fading over
 *  its life). The same sea, the same gusts: a gust is the seed's, never chance at the frame. */
export function gustsNear(seed, x, z, t, wind, reach = 400) {
  const G = GUST, out = [], vx = Math.sin(wind.to) * G.drift, vz = Math.cos(wind.to) * G.drift, pad = reach + G.drift * G.life;
  const i0 = Math.floor((x - pad) / G.cell), i1 = Math.floor((x + pad) / G.cell), j0 = Math.floor((z - pad) / G.cell), j1 = Math.floor((z + pad) / G.cell);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const ph = seeded((seed * 31 + i * 73856093 + j * 19349663) >>> 0)() * G.life, u = (t + ph) / G.life, epoch = Math.floor(u), life = u - epoch;
    const r = seeded((seed * 131 + i * 83492791 + j * 2654435761 + epoch * 97) >>> 0); if (r() > G.chance) continue;
    const gx = (i + r()) * G.cell + vx * life * G.life, gz = (j + r()) * G.cell + vz * life * G.life, rad = G.r[0] + (G.r[1] - G.r[0]) * r();
    if (Math.hypot(gx - x, gz - z) > reach + rad) continue;
    out.push({ x: gx, z: gz, r: rad, k: Math.sin(Math.PI * life) });
  }
  return out;
}

/** How much of a gust is at (x, z), 0..1 (its strength there, soft at its edge). */
export function gustAt(gusts, x, z) {
  let g = 0; for (const q of gusts) { const d = Math.hypot(q.x - x, q.z - z) / q.r; if (d < 1) g = Math.max(g, q.k * (1 - d * d)); }
  return g;
}

/** The wind as a ship in a gust feels it: stronger by the gust (never past a gale). */
export const gusted = (wind, g) => (g > 0 ? { ...wind, k: Math.min(1, wind.k + GUST.k * g) } : wind);

// ---- rips: a current in one square, a band you can ride one way and must fight the other (the sea's roads off the lanes)
/** share: the off-lane squares holding one; width and length (m) of its band; speed: its push (m a real s, against a cruise of 10). */
export const RIP = { share: 0.2, width: 70, length: 380, speed: 4 };

/** The rips of a sea (the save's, as the grid is): { square, yaw, off } each, its band through its square's middle along `yaw`, `off` m
 *  to the side of the middle. */
export function ripsOf(grid, seed = 1) {
  const r = seeded((seed * 6151) >>> 0), out = new Map();
  for (const s of grid.squares) { if (s.lane || r() > RIP.share) continue; out.set(s.id, { square: s.id, yaw: r() * Math.PI * 2, off: (r() - 0.5) * 160 }); }
  return out;
}

/** A rip's push at a point (dx, dz m from its square's middle): along the band's yaw, full in its middle, nothing past its edge. */
export function ripPush(rip, dx, dz) {
  const ax = Math.sin(rip.yaw), az = Math.cos(rip.yaw), across = dx * az - dz * ax - rip.off, along = dx * ax + dz * az;
  if (Math.abs(across) > RIP.width / 2 || Math.abs(along) > RIP.length / 2) return null;
  const k = RIP.speed * (1 - (2 * across / RIP.width) ** 2) * Math.min(1, (RIP.length / 2 - Math.abs(along)) / 40);
  return { x: ax * k, z: az * k };
}
