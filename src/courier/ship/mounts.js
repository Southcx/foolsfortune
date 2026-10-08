// ---------------------------------------------------------------------------------------
// THE MOUNTS AT SEA: two of the tools the Courier wears, carried on the sloop and fired on 1 and 2 (docs/plans/RAIL.md section 6; what
// each one is at sea, its cost and its cooldown, is progress/rail/mounts.js MOUNTS, Dovina's; this is what each one does on the rail).
// No ship parts and no second inventory: the same tools in every layer (SLICE.md). Each acts on the waves' roll and the shots' pools
// through their own small doors (`waves.within`, `shots.plains`), so a mount never asks what a thing is beyond its role.
//
//   the wake brush (the Soul Brush)   held: a fan of your feeling ahead (50 degrees, 9 m) drinks shots of the ship's feeling and cuts
//                                     glints three to a stroke; 4 Lachryma a real second
//   the toll (the Crucibelle)         the bomb: every foe's shot within 10 m (14 on the beat) broken, the shoal scattered, a boarder
//                                     knocked off; three a crossing
//   the gulp (the Lockheart)          a cone ahead swallowed for a second (35 degrees, 8 m): shots and Guppy-class glints, 2 Lachryma each
//   the plate (the Veritome)          a photograph of what is in frame (a set piece in the Compendium), and its Flash holds every weak
//                                     point in frame open two bars (a gill, a gunport); 6 Lachryma
//   the hook (the Sondelass)          the nearest thing on the aim within 16 m: a boarder yanked into the sea, a cask reeled aboard
//   the vane (the Dreamvane)          passive: the Conductor is marked, every big blow's warning a bar ahead is marked over the ship
//
// Prior art: Kingdom Hearts' Gummi Ship (its weapon blocks), Einhander's gunpods (one at a time, its own ammunition), every shmup's
// bomb (few, and it clears the screen), Ikaruga's absorption, R-Type's Force (a tool that is also a shield).
//
//   const M = new Mounts(game, stage)   M.begin(loadout)   M.update(dt, { ship, waves, shots, bar })   M.toll()   M.list
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MOUNTS } from '../../progress/rail/mounts.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { sfx } from '../../audio/sfx.js';

const KEYS = ['Digit1', 'Digit2', 'Digit3']; // (a frigate carries three: mounts by hull, rail/mounts.js slotsOf)
const _d = new THREE.Vector3(), _a = new THREE.Vector3();
/** Is a point within a cone from `from` along unit `dir` (half-angle in degrees, reach in m)? */
const inCone = (p, from, dir, deg, reach) => { _d.copy(p).sub(from); const d = _d.length(); return d <= reach && d > 1e-3 && _d.dot(dir) / d >= Math.cos((deg * Math.PI) / 180); };

export class Mounts {
  constructor(game, stage) { this.game = game; this.stage = stage; this.list = []; this.cool = {}; this.held = {}; this.charges = {}; }

  /** The loadout as sailed (voyage.sailing.mounts: the tools chosen at the pier). */
  begin(loadout = []) {
    this.list = loadout.filter((t) => MOUNTS[t]);
    this.cool = {}; this.held = {}; this.gulpT = 0; this.vaneT = 0;
    this.charges = Object.fromEntries(this.list.map((t) => [t, MOUNTS[t].charges ?? Infinity]));
  }

  update(dt, ctx) {
    const I = this.game.input, raw = this.game.rawDt ?? dt;
    for (const k in this.cool) this.cool[k] = Math.max(0, this.cool[k] - raw);
    this.list.forEach((tool, i) => {
      const down = I?.down?.has(KEYS[i]), hit = I?.pressed?.has(KEYS[i]);
      if (tool === 'soulbrush') { if (down) this.brush(dt, ctx); }
      else if (hit) this.fire(tool, ctx);
    });
    if (this.gulpT > 0) { this.gulpT -= dt; this.gulp(ctx); }
    if (this.list.includes('dreamvane')) this.vane(dt, ctx);
  }

  /** A press: the mount's verb, if its cooldown and charges allow and the pool can pay. */
  fire(tool, ctx) {
    const M = MOUNTS[tool], pool = this.game.lachryma;
    if ((this.cool[tool] || 0) > 0 || (this.charges[tool] ?? 1) <= 0) { sfx.dryFire?.(); return false; }
    if (M.cost && pool && pool.spend(M.cost, `mount.${tool}`) === false) { sfx.dryFire?.(); return false; }
    if (M.cooldown) this.cool[tool] = M.cooldown * BAR_S;
    if (Number.isFinite(this.charges[tool])) this.charges[tool]--;
    const done = tool === 'crucibelle' ? this.toll(ctx) : tool === 'lockheart' ? (this.gulpT = 1, true) : tool === 'veritome' ? this.plate(ctx) : tool === 'sondelass' ? this.hook(ctx) : false;
    this.game.events?.emit('rail.mount', { tool, verb: M.verb, by: 'courier' });
    return done;
  }

  /** The wake brush: held, a fan ahead; 4 Lachryma a real second. */
  brush(dt, { ship, waves, shots }) {
    const pool = this.game.lachryma, cost = MOUNTS.soulbrush.cost * dt;
    if (pool && (pool.drain ? pool.drain(cost, 'mount.soulbrush') : pool.spend(cost)) === 0) return;
    for (const s of shots.plains) if (s.on && s.aspect === ship.aspect && inCone(s.p, ship.nose, ship.aim, 25, 9)) { s.on = false; ship.absorb(s); }
    this.stroke = (this.stroke || 0) + dt;
    if (this.stroke >= 0.25) { // (a stroke: three glints cut)
      this.stroke = 0; let n = 3;
      for (const f of waves.foes) if (n > 0 && f.alive && f.role === 'glint' && f.solid !== false && inCone(f.local, ship.nose, ship.aim, 25, 9)) { waves.strike(f, 1, { cause: 'slash' }); n--; }
    }
  }

  /** The toll: the bomb (14 m on the beat, 10 off it). */
  toll({ ship, waves, shots, bar }) {
    const onBeat = Math.abs(bar - Math.round(bar)) < 0.08 || Math.abs(bar * 4 - Math.round(bar * 4)) < 0.08, r = onBeat ? 14 : 10;
    for (const s of [...shots.plains, ...shots.outlines]) if (s.on && !s.back && s.p.distanceTo(ship.local) < r) { if (s.mesh) shots.endOutlined(s); else s.on = false; }
    for (const f of waves.within(ship.local, r)) if (f.role === 'boarder') waves.strike(f, 99, { cause: 'impact' });
    this.stage.piece?.scatter?.();
    this.game.vfx?.play?.('hit.blunt.crystal.kill', { pos: this.stage.rail.toWorld(ship.local, new THREE.Vector3()), power: 2.5 });
    sfx.gong?.(); this.stage.trauma = Math.min(1, this.stage.trauma + 0.25);
    this.game.events?.emit('rail.toll', { onBeat, by: 'courier' });
    return true;
  }

  /** The gulp: a cone ahead for a second; shots and Guppy glints swallowed, 2 Lachryma each. */
  gulp({ ship, waves, shots }) {
    let n = 0;
    for (const s of [...shots.plains, ...shots.outlines]) if (s.on && !s.back && inCone(s.p, ship.nose, ship.aim, 35, 8)) { if (s.mesh) shots.endOutlined(s); else s.on = false; n++; }
    for (const f of waves.foes) if (f.alive && f.role === 'glint' && f.cls === 0 && inCone(f.local, ship.nose, ship.aim, 35, 8)) { waves.strike(f, 99, { cause: 'gulp' }); n++; }
    if (n) { this.game.lachryma?.gain(2 * n, 'gulp'); sfx.gulp?.(0); }
  }

  /** The plate: a photograph of the set piece in frame, and its Flash holds the weak points in frame open two bars. */
  plate({ waves }) {
    const cam = this.game.camera, piece = this.stage.pieceId;
    let held = 0;
    for (const f of waves.foes) {
      if (!f.alive || !('open' in f)) continue;
      _a.copy(f.pos).project(cam); if (Math.abs(_a.x) > 1 || Math.abs(_a.y) > 1 || _a.z > 1) continue;
      f.flashT = 2 * BAR_S; held++;
    }
    this.game.flash?.burst?.(); sfx.shutter?.();
    this.game.events?.emit('rail.plate', { setPiece: piece || null, held, by: 'courier' });
    return true;
  }

  /** The hook: the nearest on the aim within 16 m: a boarder into the sea, a cask aboard. */
  hook({ ship, waves }) {
    let best = null, bd = 16;
    for (const f of waves.foes) if (f.alive && f.role === 'boarder' && inCone(f.local, ship.nose, ship.aim, 30, 16)) { const d = f.local.distanceTo(ship.local); if (d < bd) { bd = d; best = f; } }
    if (best) { waves.strike(best, 99, { cause: 'hook' }); sfx.ropeSnap?.(); return true; }
    const cask = this.stage.piece?.nearestCask?.(ship.local, 16);
    if (cask) { this.stage.piece.gather(cask); sfx.ropeSnap?.(); return true; }
    return false;
  }

  /** The vane: the Conductor marked, every warned blow marked over the ship. */
  vane(dt) {
    this.vaneT -= dt; if (this.vaneT > 0) return; this.vaneT = 2 * BAR_S;
    const c = this.stage.waves.foes.find((f) => f.role === 'caller' && f.alive);
    if (c) this.game.glyphs?.pop('ask', c.pos.clone().setY(c.pos.y + 2), { color: 0x9be36a, size: 0.8, follow: () => c.pos.clone().setY(c.pos.y + 2) });
  }
  /** A blow's warning (rail.warn): the vane marks it over the ship, a bar ahead. */
  warn() { if (this.list.includes('dreamvane')) { const P = this.game.player.pos; this.game.glyphs?.pop('bang1', P.clone().setY(P.y + 2.5), { color: 0xff7a4a, size: 0.8 }); } }
}
