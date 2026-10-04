// ---------------------------------------------------------------------------------------
// SIGNATURES: where Lachryma is, and how loudly it is there. Everything in the world made of it or holding it gives off a SIGNATURE: a
// place, a strength, and a kind: a bauble lying loose, a cube, a chest still shut, a clapperjar (it is full of it), a slip jelly with
// some swallowed, a crystal formation in the sand (world/dunes/crystals.js), a summoned spirit (the smoke has some in it). The tools that
// sense Lachryma ask here and never know what any of these things are: the Dreamvane leans toward the strongest it is pointed near, the
// Lockheart drinks what is loose close by, the Crucibelle's Reveal song lights them up.
//
// A source is either standing (`add`: a crystal, which does not move) or found when asked (`provide(fn)`: the lists that change all
// the time, read on the spot). Liquid Lachryma (a bauble that has turned dark) is louder than fresh: it is what has been let go of.
//
// Prior art: Skyward Sword's dowsing (one sense, many kinds of target, the strongest within the cone wins, and it beeps faster as you
// face it), Death Stranding's Odradek (a scan that finds what the land hides), and the ecology's offers and providers (creatures/ai/ecology.js):
// the place says what it has, the asker never keeps its own list.
//
//   game.signatures.add({ pos, strength, kind, ref, alive?, hidden? }) -> src     .remove(src)     .provide(fn(pos, range) -> [src])
//   .around(pos, range) -> [{ pos, strength, kind, ref, d }]       .strongest(pos, range, { dir, cone, kinds }) -> src (with `pull`) | null
//   .loudness(src, d) (what a sense hears of it from d away)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _d = new THREE.Vector3();

export class Signatures {
  constructor(game) {
    this.game = game;
    this.sources = [];
    this.providers = [];
  }
  add(src) { src.alive ??= () => true; this.sources.push(src); return src; }
  remove(src) { const i = this.sources.indexOf(src); if (i >= 0) this.sources.splice(i, 1); }
  provide(fn) { this.providers.push(fn); }

  /** Every signature within `range` of `pos`, with its distance (`d`). */
  around(pos, range) {
    const out = [], r2 = range * range;
    const take = (s) => { const dx = s.pos.x - pos.x, dy = s.pos.y - pos.y, dz = s.pos.z - pos.z, d2 = dx * dx + dy * dy * 0.5 + dz * dz; if (d2 < r2) { s.d = Math.sqrt(d2); out.push(s); } };
    for (const s of this.sources) if (s.alive()) take(s);
    for (const fn of this.providers) { try { for (const s of fn(pos, range) || []) take(s); } catch { /* a provider that failed gives nothing */ } }
    return out;
  }
  /** What a sense hears of a source from `d` away: its strength, falling off with distance (gently: Lachryma carries). */
  loudness(s, d = s.d) { return s.strength / (1 + d * d * 0.004 + d * 0.04); }
  /** The loudest within `range` (and within `cone` radians of `dir`, if given): what a dowsing rod leans toward. `pull` is its loudness,
   *  `off` how far off the line it lies (radians). */
  strongest(pos, range, { dir = null, cone = Math.PI, kinds = null, filter = null } = {}) {
    let best = null, bs = 0;
    for (const s of this.around(pos, range)) {
      if (kinds && !kinds.includes(s.kind)) continue;
      if (filter && !filter(s)) continue;
      let off = 0;
      if (dir) { _d.set(s.pos.x - pos.x, 0, s.pos.z - pos.z); off = _d.lengthSq() > 1e-4 ? _d.normalize().angleTo(_d.clone().set(dir.x, 0, dir.z).normalize()) : 0; if (off > cone) continue; }
      const l = this.loudness(s) * (dir ? 1 - 0.5 * off / Math.max(0.01, cone) : 1);
      if (l > bs) { bs = l; best = s; best.pull = l; best.off = off; }
    }
    return best;
  }
}

/** The standing providers: the lists the world already keeps, read when asked. (A new thing that holds Lachryma adds one line here, or
 *  adds itself with `add`.) */
export function standardSignatures(game) {
  const S = game.signatures, g = game;
  // a loose bauble (darker = liquid, louder), a loose cube
  S.provide((p, r) => (g.baubles?.near(p, r) || []).map((b) => ({ pos: b.root.position, strength: 0.6 + 1.6 * b.ox, kind: b.ox > 0.6 ? 'liquid' : 'bauble', ref: b })));
  S.provide(() => (g.cubes?.list || []).filter((c) => c.state === 'loose').map((c) => ({ pos: c.pos, strength: 0.4 + 0.05 * c.worth, kind: 'cube', ref: c })));
  // a chest still shut (louder with its tier)
  S.provide(() => (g.chests?.list || []).filter((c) => c.state === 'closed' && c.rig?.root?.visible !== false).map((c) => ({ pos: c.rig.root.position, strength: 3 + 2.5 * (c.tier || 0), kind: 'chest', ref: c })));
  // the Lachryma in clay and in jelly
  S.provide(() => (g.clappers?.list || []).filter((c) => c.alive).map((c) => ({ pos: c.pos, strength: 1.2 + 0.4 * (c.baubles || 0), kind: 'clapper', ref: c })));
  S.provide(() => (g.creatures?.list || []).filter((c) => c.alive).map((c) => ({ pos: c.pos, strength: c.spirit ? 1.5 : 1 + 0.3 * (c.stash || 0), kind: c.spirit ? 'spirit' : 'creature', ref: c })));
}
