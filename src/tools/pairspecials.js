// ---------------------------------------------------------------------------------------
// A PAIR'S SPECIAL IN PLAY (TOOLS-TOGETHER.md 8; the rules and the opening Dovina's, progress/toolpairs.js PAIR_SPECIALS): the sub's lent
// verb fed through the main's own, one press doing both. A special plays only with its pair worn the named way round (PAIR_SPECIALS[n].main
// is the main) and once opened (`pairSpecialOpen`: 50 downs or 40 lends with the pair worn; in DEBUG the Tool Moves lend). Worn the other
// way round, or not yet opened, both tools do exactly what they do alone: each special is a modifier on a verb the tools already have,
// never a change to it (DESIGN.md 22).
//
// Built a wave of four at a time. Wave 1 (TOOLS-TOGETHER.md 4 K5's four):
//   19 The Mark       psygun main, Veritome sub: the lent Flash marks what it reaches; the psygun's rounds home on the mark
//   6  Rung Line      Sondelass main, Crucibelle sub: the lent toll, with the hook bitten in a creature, runs down the line and stuns it
//   17 Painted Lure   Dreamvane main, Soul Brush sub: the fork in flight lays a stream of paint under it, from the brush's load
//   3  Coffin's Mop   Lockheart main, Soul Brush sub: the hoover drinks paint off the ground into the brush's bottle (the Flick pours it back)
//
// Prior art: Zelda: Tears of the Kingdom's fuse (two things make a third), NieR: Automata's pod programs fed through the blade, Splatoon's
// ink trails off a thrown sub weapon (the Painted Lure), Luigi's Mansion 3's Poltergust drinking paint (the Coffin's Mop).
//
//   game.pairSpecials = new PairSpecials(game)   .update(rawDt) (boot/frame.js)   .live(n) -> bool   .homeShot(from, dir) -> dir | null
//   (the psygun's round asks: tools/psygun/weapon.js shoot)   event pair.special { pair, special, by }   pair.mark { kind, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { pairOf, pairSpecialOpen, PAIR_SPECIALS } from '../progress/toolpairs.js';
import { spendLoad, loadAspect } from './soulbrush/load.js';
import { HOOVER } from './lockheart/lockheart.js';

/** Wave 1's numbers (placeholders, Dovina's to tune): the mark's rounds and life (real s) and the cone it homes within (rad); the rung's
 *  stun and blow; the lure's paint (a stamp every `every` real s of flight, Lachryma a stamp from the load); the mop's sips. */
export const PAIR_PLAY = {
  mark: { n: 19, rounds: 6, life: 8, cone: 0.35, range: 40 },
  rung: { n: 6, stun: 1.1, power: 0.6 },
  lure: { n: 17, every: 0.06, r: 0.7, cost: 0.2, drop: 8 },
  mop: { n: 3, every: 0.15, r: 1, want: 0.5, toBottle: 1.5, reach: 5 },
};
/** The specials built so far, by pair (Dovina's PAIRS[n].special stays hers to set). */
export const BUILT = [19, 6, 17, 3];

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);

export class PairSpecials {
  constructor(game) {
    this.game = game;
    this.mark = null; // ({ c, rounds, until }: what the lent Flash marked)
    this.now = 0; this.lureT = 0; this.mopT = 0;
    const ev = game.events;
    ev?.on?.('flash.fire', (e) => this.onFlash(e));
    ev?.on?.('tool.lend', (e) => { if (e.by === 'courier' && e.tool === 'crucibelle') this.rung(); });
  }

  /** Pair `n`'s special plays now: its pair worn its way round, and opened (or lent in DEBUG). */
  live(n) {
    const g = this.game, b = g.belt, S = PAIR_SPECIALS[n];
    if (!b || !S || b.main !== S.main[0] || pairOf(b.main, b.sub)?.n !== n) return false;
    return !!g.lend?.has?.('moves') || pairSpecialOpen(n, g.ledger);
  }
  said(n) { this.game.events?.emit('pair.special', { pair: n, special: PAIR_SPECIALS[n].label, by: 'courier' }); }

  // ---- 19 The Mark ------------------------------------------------------------
  onFlash(e) {
    const M = PAIR_PLAY.mark; if (!this.live(M.n)) return;
    const g = this.game, P = g.player; let best = null, bd = Infinity;
    for (const c of g.flash?.seen || []) { if (!c.alive || c.type !== 'creature') continue; const d = c.pos.distanceToSquared(P.pos); if (d < bd) { bd = d; best = c; } }
    if (!best) return;
    this.mark = { c: best, rounds: M.rounds, until: this.now + M.life };
    const p = best.center(_a).clone(); p.y += 0.6;
    g.glyphs?.pop('star', p, { color: 0xfff4e6, size: 0.9, life: 0.8, ring: true }); // (placeholder: the mark's look is Calissa's, on pair.mark)
    g.events?.emit('pair.mark', { kind: best.kind, by: 'courier' });
    this.said(M.n);
  }
  /** A psygun round leaving `from` along `dir`: turned onto the mark if it lies within the cone and in sight; one round spent. */
  homeShot(from, dir) {
    const m = this.mark, M = PAIR_PLAY.mark; if (!m) return null;
    if (!m.c.alive || this.now > m.until || m.rounds <= 0 || !this.live(M.n)) { this.mark = null; return null; }
    const to = m.c.center(_b).sub(from), d = to.length(); if (d > M.range || d < 0.3) return null;
    to.normalize(); if (to.angleTo(dir) > M.cone) return null;
    const g = this.game, hit = g.physics?.raycast(from, to, d - 0.4, g.player.collider, undefined, (k) => !k.isSensor() && !g.physics.entityOf(k)?.type);
    if (hit) return null;
    if (--m.rounds <= 0) this.mark = null;
    return to.clone();
  }

  // ---- 6 Rung Line ------------------------------------------------------------
  rung() {
    const R = PAIR_PLAY.rung; if (!this.live(R.n)) return;
    const g = this.game, H = g.techs?.get?.('sondelass')?.hookshot, c = H?.phase === 'held' ? H.att?.ent : null;
    if (c?.type !== 'creature' || !c.alive || c.ally) return;
    const at = c.center(_a).clone(), from = g.player.pos.clone().setY(g.player.pos.y + 1.2);
    g.stun?.add(c, R.stun, { by: 'courier', cause: 'rung' });
    g.creatures?.strike(c, at.clone(), _d.copy(at).sub(from).normalize().clone(), R.power, 'rung', 'courier');
    for (let i = 1; i <= 4; i++) g.glyphs?.pop('note', _b.copy(from).lerp(at, i / 4).clone(), { color: 0xffd76a, size: 0.4, life: 0.5 }); // (placeholder: the ring down the line is Calissa's, on pair.special)
    this.said(R.n);
  }

  // ---- 17 Painted Lure and 3 Coffin's Mop: every frame -----------------------
  update(raw) {
    this.now += raw;
    const g = this.game, L = PAIR_PLAY.lure, M = PAIR_PLAY.mop;
    const F = g.techs?.get?.('dreamvane')?.fork;
    if (F?.state === 'fly' && this.live(L.n) && (this.lureT -= raw) <= 0) {
      this.lureT = L.every;
      const aspect = loadAspect(g), hit = aspect ? g.physics?.raycast(F.pos, DOWN, L.drop, g.player.collider, undefined, (k) => !k.isSensor()) : null;
      if (hit && spendLoad(g, L.cost, 'pairlure') > 0) {
        if (!this.lureSaid) { this.lureSaid = true; this.said(L.n); }
        g.paintmap?.stamp(hit.point.x, hit.point.y, hit.point.z, L.r, aspect, 0.9);
      }
    } else if (F?.state !== 'fly') this.lureSaid = false;
    const LH = g.techs?.get?.('lockheart');
    if (LH?.hoovering && LH.hooverW > 0.5 && this.live(M.n) && (this.mopT -= raw) <= 0) {
      this.mopT = M.every;
      const P = g.player, f = LH.aimFlat?.(_d) || _d.set(0, 0, -1), load = g.techs?.get?.('soulbrush')?.load;
      let got = 0;
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * HOOVER.cone * 0.6, r = 1.5 + (i % 2) * (M.reach - 1.5) * 0.5;
        _a.copy(f).applyAxisAngle(THREE.Object3D.DEFAULT_UP, a).multiplyScalar(r).add(P.pos);
        got += g.paintmap?.drink(_a.x, P.pos.y, _a.z, M.r, M.want) || 0;
      }
      if (got > 0) {
        if (load?.bottle) load.held += got * M.toBottle; else LH.feed?.(got * M.toBottle, 'hoover');
        if (!this.mopSaid) { this.mopSaid = true; this.said(M.n); }
      }
    } else if (!LH?.hoovering) this.mopSaid = false;
  }
}
