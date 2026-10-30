// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES' LOOKS (plain names; Dovina's rules, progress/mimicry.js, and the runtime, world/mimicry/mimicry.js, untouched;
// docs/plans/MIMICRY.md 7): what the puzzles look like, over the runtime's placeholders, which are hidden while these stand in for them.
//   the puzzle stones   vfx/mimicry/stones.js: lydite menhirs, their mark, their rung's number, their stars and their ogham edge
//   the ghost           vfx/mimicry/ghost.js: the target as a topographic hologram over the patch, gold where the copy already matches
//   a step's mark       during the System's demonstration (`mimic.step`), the step's domain's own effect where it lands on the patch
//                       (vfx/library/domains.js `domain.<domain>.hit`: Shape's and Carve's Alteration, Scoop's Psychokinesis ...), at
//                       every point the step names (a raise's middle, a carve's two ends, a move's from and to), so the steps can be
//                       followed and the order of things seen
//   the solve's beat    `mimic.solve { stars }`: the ghost's gold ring sweeping the patch, and the stone's stars struck in one by one,
//                       each with a gold star popped off its socket (vfx/glyphs.js 'star'); the stone holds them a few real seconds,
//                       then shows the rung it sets next
// The placeholders it hides: the runtime's stones (`game.mimicry.group`: the clay cylinders and gold bands) and its gold wire ghost
// (`game.mimicry.wire`). Asked of Dovina to remove: docs/handoffs/dovina/2026-10-30-from-calissa-mimicry-sandbox-looks.md.
// It reads the open puzzle from `game.mimicry.S` (its patch, its field, its frames): a read only.
//
// Prior art: Simon's lit pads (each step shown where it happens, in its own colour), the golf scorecard and the puzzle game's three
// stars struck one at a time (Angry Birds' results), and the stones and ghost's own (their modules' headers).
//
//   game.mimicryLooks = new MimicryLooks(game)   (boot/rooms.js, after game.mimicry)   .update(raw) (boot/frame.js)   .prewarm() -> park
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PuzzleStones } from './stones.js';
import { MimicryGhost, prewarmGhost } from './ghost.js';
import { MIMIC_OPS } from '../../progress/mimicry.js';
import { GOD_POWERS } from '../../progress/godpowers.js';

/** The beat's numbers: when each star is struck after the solve (real s), how long the stone holds them, the stars' glyph. */
export const MIMIC_BEAT = { star: [0.55, 0.9, 1.25], hold: 7, glyph: { color: 0xffd36a, size: 0.32, life: 1.0, float: 0.35, burst: true } };

export class MimicryLooks {
  constructor(game) {
    this.game = game; this.beats = []; this.open = null;
    const M = game.mimicry;
    this.stones = M?.stones?.length ? new PuzzleStones(game, M.stones) : null;
    this.ghost = new MimicryGhost(game);
    this.hide();
    const E = game.events;
    E?.on?.('mimic.open', () => this.opened());
    E?.on?.('mimic.turn', () => this.ghost.turn());
    E?.on?.('mimic.step', (e) => this.step(e));
    E?.on?.('mimic.solve', (e) => this.solved(e));
    E?.on?.('mimic.leave', () => { this.ghost.leave(); this.open = null; });
  }

  /** The runtime's placeholders hidden where these stand in for them (its stones always; its wire ghost whenever it is up). */
  hide() {
    const M = this.game.mimicry;
    if (this.stones && M?.group) M.group.visible = false;
    if (M?.wire && !this.ghost.done) M.wire.visible = false;
  }

  opened() {
    const S = this.game.mimicry?.S; if (!S) return;
    this.open = { st: S.st, at: S.at, F: S.F, P: S.P };
    this.ghost.open(S);
    this.hide();
  }

  /** A step of the System's demonstration: its domain's effect at each point it names, on the ground there. */
  step(e) {
    const O = this.open, g = this.game; if (!O || !g.vfx) return;
    const s = O.P?.steps?.[e?.i]; if (!s) return;
    const domain = GOD_POWERS[MIMIC_OPS[s.op]]?.domain; if (!domain) return;
    for (const p of [s.at, s.a, s.b, s.from, s.to]) {
      if (!p) continue;
      const x = O.at.x + p[0], z = O.at.z + p[1], y = O.F?.groundAt?.(x, z);
      g.vfx.play(`domain.${domain}.hit`, { pos: new THREE.Vector3(x, Number.isFinite(y) ? y + 0.05 : O.at.y, z), normal: new THREE.Vector3(0, 1, 0), domain, scale: 0.8 });
    }
  }

  /** A puzzle solved: the ghost's ring, then the stone's stars struck one at a time. */
  solved(e) {
    this.ghost.solve();
    const st = this.open?.st, i = st ? this.stones?.indexOf(st.site.id) ?? -1 : -1;
    this.open = null;
    if (i < 0) return;
    const n = Math.max(1, Math.min(3, e?.stars | 0));
    this.beats = this.beats.filter((b) => b.i !== i);
    this.beats.push({ i, puzzle: e?.puzzle, stars: n, lit: 0, t: 0 });
    this.stones.strike(i, { puzzle: e?.puzzle, stars: 0 });
  }

  update(raw) {
    const g = this.game;
    this.stones?.update(raw);
    this.ghost.update(raw, g.mimicry?.S?.F ?? null);
    if (this.open && g.mimicry?.S) this.ghost.demo(!!g.mimicry.S.demo);
    this.hide();
    for (let j = this.beats.length - 1; j >= 0; j--) {
      const b = this.beats[j]; b.t += raw;
      while (b.lit < b.stars && b.t >= MIMIC_BEAT.star[b.lit]) {
        const at = this.stones.starAt(b.i, b.lit); b.lit++;
        this.stones.strike(b.i, { puzzle: b.puzzle, stars: b.lit });
        if (at) g.glyphs?.pop('star', at, MIMIC_BEAT.glyph);
      }
      if (b.t >= MIMIC_BEAT.hold) { this.stones.release(b.i); this.beats.splice(j, 1); }
    }
  }

  /** The ghost's program, compiled at boot (boot/warmup.js): returns what takes the parked copy away. */
  prewarm() { return prewarmGhost(this.game.scene); }
}
