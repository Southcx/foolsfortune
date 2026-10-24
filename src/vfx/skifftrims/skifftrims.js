// ---------------------------------------------------------------------------------------
// THE SKIFF'S TRIMS (plain name; the owner, 2026-10-24: "more customization options for the racing module ... new paintjobs for the
// skiff ... build, build, build"): what the Solar Skiff wears past its sail, drawn: a trail's look on the wake (trails.js), a ribbon's
// shape in the air (ribbons.js), a pennant's shape at the masthead (pennants.js) and a hull wrap over the hull glaze (wraps.js). Owned by
// the skiff's paint look (vfx/skiffpaintlook.js: `paintLook.trims`), which hands it what is worn (Dovina's `game.skiffPaint.worn`, a
// race board preview over it) at every change, and the frame and the pose. The kinds are Dovina's catalogue's (progress/skiffpaint.js
// PAINT: trail, ribbon, and length for the pennant's shape, whose tab and streamer are its first two; `wrap` is proposed in
// docs/handoffs/dovina/2026-10-24-from-calissa-skiff-trims.md); each look is keyed by its row's id, and an id none of these files knows
// leaves what stands (the sand's own wake, the plain ribbon, the maker's pennant, the bare hull).
//
// Prior art: Rocket League's and Mario Kart's cosmetics (each slot its own, none touching the numbers), as the paint look's.
//
//   const T = new SkiffTrims(skiff, game)   T.apply(worn)   T.frame(t, dt, { tech, wake, flying, stern, camera, dye })   T.pose(bones)
//   T.clear()   T.dispose()
// ---------------------------------------------------------------------------------------
import { SkiffTrailLook } from './trails.js';
import { SkiffRibbonShapes } from './ribbons.js';
import { SkiffPennantShapes } from './pennants.js';
import { SkiffHullWraps } from './wraps.js';
import { COLOR } from '../../progress/weather.js';

const GOLD = 0xffd36a; // (the pennant's gold: the house's gold line, as the paint look's)

export class SkiffTrims {
  constructor(skiff, game) {
    this.skiff = skiff; this.game = game;
    this.trail = new SkiffTrailLook(game);
    this.ribbon = new SkiffRibbonShapes(game?.scene, game);
    this.pennant = new SkiffPennantShapes(skiff);
    this.wrap = new SkiffHullWraps(skiff, game);
  }

  /** What is worn (the paint look's `worn`): each part set to its row, or to what stands. */
  apply(W = {}) {
    this.trailOn = this.trail.set(W.trail);
    this.ribbon.set(W.ribbon);
    const pen = W.pennant === 'gold' ? GOLD : W.pennant && W.pennant !== 'own' ? (COLOR[W.pennant] ?? null) : null;
    this.pennant.set(W.length, pen); // (a shape is a row of the pennant's `length`, beside the tab and the streamer)
    const seal = W.seal === 'on' ? this.game?.cradles?.mine ?? null : null;
    this.wrap.set(W.wrap, { seal });
  }

  /** Per frame, the board placed (the paint look's frame): the wake's look and bubbles, the ribbon. */
  frame(t, dt, { wake, flying, stern, camera, dye } = {}) {
    if (wake) {
      wake.look = this.trailOn ? this.trail : null;
      if (this.trailOn) wake.color.setHex(this.trail.wakeColour());
    }
    this.ribbon.update(dt, t, !!flying, stern, camera, dye);
  }

  pose(B) { this.pennant.pose(B); }
  clear() { this.ribbon.clear(); }
  dispose() { this.ribbon.dispose(); this.pennant.dispose(); this.wrap.dispose(); }
}
