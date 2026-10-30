// ---------------------------------------------------------------------------------------
// STRAWMAN AS AN ELITE (plain name; South, 2026-10-30: "Strawman and its domain need to be given more love as far as embracing its
// identity"): a practice duel's look, the Workshop's test dummy made aberrant at the sparring circle's lectern (world/duel/duelsession.js
// `practice`; Dovina's RULESETS.strawman), in its own identity: burlap, straw, Pip's stitching, a sparring yard. The Elite format of the
// Lantern Wisp's and the slip jelly's (wisp.js, jelly.js), one file an aberrant:
//   ITS GROUND     its side of the domains' clash a practice yard at harvest (domains.js `setStyle(3, gust)`): a stubble field under a big
//                  pale sky, a hedge on the horizon with a line of Pip's other dummies on their posts, archery targets on easels and
//                  stacked bales, bunting strung across the sky, straw blowing over it all, the sparring circle's chalk ring round its
//                  feet; the wind gusting as its stitches pop (`gust`)
//   ITS POST       the tsuitate's foe-side member bound in burlap, patched and stitched, straw out of its seams, a target and a tag
//                  (strawmanyard.js `strawmanPost`, framedress.js calls it); the tag swings here
//   ITS YARD       bales, a target on its easel, its fellow dummies, bunting, Pip's sewing kit at giant scale, straw on the wind round it
//                  in the duel's instance (strawmanyard.js `strawmanYard`, sidedress.js calls it)
//   ITS CUT-IN     a burlap band with two seams of cross-stitch, straw blown through it, a target behind its head (cutin.js MOTIF 4)
//   ITS AURA       straw whirled round it as it casts, the ground ring a heptagram sewn in running stitch (auras.js asks `aura()`)
//   ITS END        never a death: either way it loses, its stitches pop, its straw bursts out and it slumps; Pip's needle runs its seams,
//                  the straw flies home, and it stands up whole, bows and claps (strawmanend.js). Nothing drained: it is practice
// Programs: the clash's, the cut-in's, the clay's, Strawman's own sack's and the kit's: nothing new.
// Prior art: Wind Waker's and Ocarina of Time's scarecrows, the carnival target booth and the village fete, Smash's sandbag (hit
// forever, never broken), the scarecrow restuffed in the Wizard of Oz; the Wisp's elite (wisp.js) for the shape of the file.
//
//   const E = new StrawmanElite(view)   StrawmanElite.fits(state, foe)   E.open(state, foe)   E.update(dt)   E.aura() -> { ring, whirl }
//   E.death(how) -> { dur, step, end }   E.close()   STRAWMAN_ELITE (the knobs)
// ---------------------------------------------------------------------------------------
import { TAG, strawTexture, stitchRingTexture } from './strawmanyard.js';
import { PracticeEnd } from './strawmanend.js';

/** gust: how fast the yard's wind drops after a gust (/s); tag: its swing (rad) and the gust's shake. */
export const STRAWMAN_ELITE = { gust: 0.7, tag: [0.1, 0.05, 0.5] };

export class StrawmanElite {
  /** The cut-in's motif behind its bands (cutin.js: 4 burlap, cross-stitch and straw). */
  static MOTIF = 4;
  constructor(view) { this.view = view; this.on = false; this.gust = 0; this.t = 0; this.tag = null; this.end = new PracticeEnd(view); }

  /** Whether a duel is Strawman's: a practice duel (its foe made aberrant at the lectern) or Strawman itself, whatever board it brings. */
  static fits(state, foe) { return !!state && (!!foe?.practice || foe?.kind === 'strawman'); }

  open(state, foe) { this.on = StrawmanElite.fits(state, foe); this.foe = foe; this.gust = 0; this.tag = null; this.dying = false; this.view.clash.setStyle(this.on ? 3 : 0, 0); }

  close() { this.end.clear(); if (this.tag) this.tag.rotation.set(0, 0, 0); this.on = false; this.foe = null; this.tag = null; this.dying = false; this.view.clash.setStyle(0, 0); }

  update(dt) {
    if (!this.on) return; this.t += dt;
    this.gust = Math.max(0, this.gust - dt * STRAWMAN_ELITE.gust); this.view.clash.setStyle(3, this.gust);
    const T = (this.tag ||= this.view.dress?.group?.getObjectByName(TAG) || null), [a, b, g] = STRAWMAN_ELITE.tag; // (its tag, swinging on its string: strawmanyard.js)
    if (T) T.rotation.z = a * Math.sin(this.t * 1.7) + b * Math.sin(this.t * 0.63 + 1) + g * this.gust * Math.sin(this.t * 11);
  }

  /** Its own aura's parts (auras.js): the ground ring sewn, and straw whirled round it. */
  aura() { return { ring: stitchRingTexture(), whirl: strawTexture(), whirlHex: 0xffffff, whirlSpin: 1.1 }; }

  /** Its practice end, whichever way it lost ('line', 'secret', 'finisher'): a timeline the session plays (Petra's). */
  death() {
    const d = this.end.play(this.foe, this); if (!d) return null; this.dying = true;
    return { dur: d.dur, step: d.step, end: () => { d.end(); this.dying = false; } };
  }
}
