// ---------------------------------------------------------------------------------------
// THE FIRING AND THE REFUSALS, AS THEY ARE SEEN (docs/plans/SOUL-ALCHEMY.md 4.13 and 4.18): timelines played at the spirit press when
// the lever's ball comes down, read each frame by the press's look (vfx/alchemy/presslook.js), which lays them on the press, the bath,
// the seals, the hue ring and the frame. Nothing here decides anything: progress/alchemy.js fires or refuses, and says so on the bus.
//
// A FIRING (the bead inside a spread), about 1.6 real seconds, overlapping:
//   0.00  the HIT-STOP (0.1 s): the look's clock holds, the knuckles squash round the ball (the hand's fistClench)
//   0.10  the BURNING GLASS (0.3 s): the eye flares and lays a pinpoint of light on the bead
//   0.35  the DIP (0.25 s): the bead dips into the tile, a ring spreading from it
//   0.55  the glaze SETS (0.75 s): a white kiln heat runs out from the bead across the tile and cools back to its glaze, crazing spreading
//   0.40  the attribute's light, over the tile, comes down into it and BURNS where it hangs
//   0.90  the SPREAD draws back into the tile, its seasoning spent (0.4 s)
//   1.00  the tile SHRINKS a step round the bead (0.8 s); its clay body steps up the ladder at 1.4 when the rank enters the next band
//   1.50  the bead surfaces where it was (a firing never moves the soul colour)
// A TRUE FIRING (the glint inside a tile's heart), about 2.2 s: all that, and the bead's edge lost in the heart (its meniscus fades
// out), the light down all the way into the heart with frame accumulation, its seal warming to gold for a beat and cooling (a warmth,
// never a blink), and a YOHEN STAR left on the tile's face at 1.25.
// The REFUSALS (0.35 s): `outside`: the ball sticks a third of the way and springs back up, the bead CRAWLS (beads up tight, a ring of
// bared clay round it) and the nearest spread's break GLINTS once on the side facing the bead; `poor`: the ball goes down, the lantern
// GUTTERS out in a thread of smoke, the eye lights faintly and dies, nothing sets; `full` and `spent` move nothing (the ball would not).
// Any firing is skipped with a click after its first 0.6 s.
//
// Prior art: Hades' hit-stop and held beat on a reward, the burning glass (a lens laying the sun on one point), glaze as it really
// fires (Ian Currie: crazing as fresh glaze cools, crawling, the clay shrinking in the kiln), yohen tenmoku's stars, Townscaper's
// small physical answer in place of an error, and the PS2's frame feedback for the dive (render/glow.js accum).
//
//   const F = new Firing()   F.fire({ i, prev, next, deep, at })   F.refuse(why, { i?, glint? })   F.skip()   F.update(dt) -> the frame's pose
//   F.tiles(list)   F.busy   F.t   (pose: { hold, pull, flare, beam, glow, eye, dive, flame, smoke, bead, ring, glint, fireTile, gold, accum })
// ---------------------------------------------------------------------------------------

const FIRE = { hold: 0.1, eye: [0.1, 0.4], dip: [0.35, 0.6], set: [0.55, 1.3], burn: [0.4, 1.3], spread: [0.9, 1.3], shrink: [1.0, 1.8], body: 1.4, surface: [1.5, 1.7], end: 1.75, skip: 0.6 };
const TRUE = { vanish: [0.4, 1.45], dive: [0.45, 0.8], burn: [0.8, 1.55], gold: [0.7, 1.75], star: 1.25, accum: [0.45, 1.55], end: 2.2 };
const REFUSE = { outside: 0.35, poor: 2.2, gutter: 0.25, smoke: [0.15, 1.9], eye: [0.0, 0.5], ball: [0.0, 0.25, 0.6] };
const lin = (t, [a, b]) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const smooth = (x) => x * x * (3 - 2 * x);
const bump = (t, w) => { const x = lin(t, w); return Math.sin(Math.PI * x); }; // (0 at each end of the window, 1 in its middle)
const lerp = (a, b, k) => a + (b - a) * k;

export class Firing {
  constructor() { this.run = null; this.t = 0; }
  get busy() { return !!this.run; }
  /** A firing: tile `i`, its state before (`prev`: { r, bare, rank, stars }) and after (`next`), `deep` for a true firing, `at` the bead. */
  fire({ i, prev, next, deep = false }) { this.run = { kind: 'fire', i, prev, next, deep, end: deep ? TRUE.end : FIRE.end, rang: false }; this.t = 0; }
  /** A refusal, by its code; `glint`: the spread nearest the bead (outside every spread). */
  refuse(why, { glint = -1 } = {}) {
    if (why === 'outside') { this.run = { kind: 'outside', glint, end: REFUSE.outside }; this.t = 0; }
    else if (why === 'poor') { this.run = { kind: 'poor', end: REFUSE.poor }; this.t = 0; }
  }
  /** A click after the first 0.6 s ends a firing at once. */
  skip() { if (this.run?.kind === 'fire' && this.t > FIRE.skip) this.t = this.run.end; }

  /** The tiles as the bath should draw them this frame: the firing tile held at its old spread and size until the beats change them. */
  tiles(list) {
    const R = this.run; if (R?.kind !== 'fire' || !list[R.i]) return list;
    const t = this.t, P = R.prev, N = R.next, out = list.slice(), sp = smooth(lin(t, FIRE.spread)), sh = smooth(lin(t, FIRE.shrink));
    const bare = lerp(P.bare, N.bare, sh), r = Math.max(bare, lerp(P.r, N.bare, sp));
    out[R.i] = { ...list[R.i], r, bare, rank: t < FIRE.body ? P.rank : N.rank, stars: R.deep && t < TRUE.star ? P.stars : N.stars };
    return out;
  }

  /** One frame: what the firing or refusal lays on everything, or null when nothing is playing. */
  update(dt) {
    const R = this.run; if (!R) return null;
    this.t += dt; const t = this.t;
    if (t >= R.end) { this.run = null; return { done: R.kind }; }
    if (R.kind === 'outside') {
      const x = t / REFUSE.outside;
      return {
        pull: (1 / 3) * Math.max(0, 1 - x * 1.4) - 0.06 * Math.sin(Math.PI * Math.min(1, x * 1.4)) * (x < 0.72 ? 1 : 0), // (stuck at a third, springing back past up)
        bead: { shown: 1, scale: 1 - 0.25 * Math.sin(Math.PI * x), men: 1, crawl: Math.sin(Math.PI * x) },
        glint: R.glint >= 0 ? { i: R.glint, k: Math.sin(Math.PI * x) } : null,
      };
    }
    if (R.kind === 'poor') {
      const [b0, b1, b2] = REFUSE.ball;
      return {
        pull: t < b1 ? smooth(lin(t, [b0, b1])) : 1 - smooth(lin(t, [b1, b2])), // (down, then up again: still cocked, nothing set)
        flame: t < REFUSE.gutter ? 0.5 * (1 - t / REFUSE.gutter) : t > REFUSE.poor - 0.4 ? 0.5 * lin(t, [REFUSE.poor - 0.4, REFUSE.poor]) : 0, // (gutters out, relit low at the end)
        smoke: bump(t, REFUSE.smoke), eye: 0.25 * bump(t, REFUSE.eye),
      };
    }
    // a firing
    const deep = R.deep, set = lin(t, FIRE.set);
    const pose = {
      hold: t < FIRE.hold,
      flare: bump(t, FIRE.eye), beam: bump(t, [FIRE.eye[0], FIRE.eye[1] + 0.1]), glow: bump(t, [FIRE.eye[0], FIRE.dip[1]]),
      dive: deep ? { k: smooth(lin(t, TRUE.dive)) * (1 - smooth(lin(t, [TRUE.end - 0.45, TRUE.end]))), burn: Math.max(bump(t, FIRE.burn) * 0.6, bump(t, TRUE.burn)), deep: true }
        : { k: 0.5 * Math.sin(Math.PI * lin(t, [FIRE.burn[0], FIRE.end])), burn: bump(t, FIRE.burn), deep: false },
      bead: {
        shown: 1 - 0.6 * smooth(lin(t, FIRE.dip)) * (1 - smooth(lin(t, FIRE.surface))),
        scale: 1 - 0.15 * smooth(lin(t, FIRE.dip)) * (1 - smooth(lin(t, FIRE.surface))),
        men: deep ? 1 - bump(t, TRUE.vanish) ** 0.5 : 1, crawl: 0,
      },
      fireTile: { i: R.i, heat: set > 0 ? Math.min(1, set * 6) * (1 - smooth(set)) : 0, craze: set > 0 ? Math.min(1, set * 2.5) * (1 - smooth(lin(t, [FIRE.shrink[0] + 0.2, R.end]))) : 0, front: Math.min(1, 0.08 + set * 1.6) }, // (front: the share of the way across the tile from the bead)
      gold: deep ? { i: R.i, k: bump(t, TRUE.gold) ** 0.6 } : null,
      accum: deep ? 0.55 * bump(t, TRUE.accum) : 0,
      ring: false,
    };
    if (!R.rang && t >= FIRE.dip[0]) { R.rang = true; pose.ring = true; }
    return pose;
  }
}
