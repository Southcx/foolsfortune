// ---------------------------------------------------------------------------------------
// THE GIANTS' LOOKS (plain name; game.giantLooks; docs/plans/MECHS.md 8.2 items 3 and 4): what dresses the proving ground's giants and the
// ring's secret rival over the runtime's placeholders, stepped on the real clock in the `fx` phase, after the hangar has moved them:
//   the giant's body     whichever giant stands (game.hangar.giant), dressed by its row's body: 'sand' the dune colossus
//                        (giants/colossus.js), anything else the straw giant (giants/straw.js); dressed again when its group is rebuilt
//                        or its row changes, let go when the hangar is torn down
//   its barrier          the AT field's look (giants/atfield.js) over its shell, and your mech's barrier pressed into it
//   the shadow frame     the boxing ring's secret rival in your parts, inked black (giants/shadow.js)
// Looks only: nothing here moves a giant, decides a blow or touches a collider.
// Prior art: the house's split of rules from looks (game.mechSpecialLooks, game.sentinelLook, Strawman's Well's look over Dovina's
// placeholders: vfx/strawmanwell/look.js).
//
//   game.giantLooks = installGiantLooks(game)   (boot/world.js, after the mech looks)   .update(rawDt)   .dress (the giant's, or null)
// ---------------------------------------------------------------------------------------
import { dressStrawGiant } from './straw.js';
import { dressColossus } from './colossus.js';
import { ATFieldLook } from './atfield.js';
import { ShadowFrameLook } from './shadow.js';

/** Which dress a giant's row asks for (its `body`: 'sand' the colossus; the rest straw). */
export const bodyOf = (giant) => (giant?.G?.body === 'sand' ? 'sand' : 'straw');

export class GiantLooks {
  constructor(game) { this.game = game; this.giant = null; this.group = null; this.kind = null; this.dress = null; this.t = 0; this.field = null; this.shadow = new ShadowFrameLook(game); }
  update(dt) {
    this.t += dt;
    const H = this.game.hangar, Gi = H?.built !== false && H?.giant?.group ? H.giant : null;
    const kind = Gi ? bodyOf(Gi) : null;
    if (Gi !== this.giant || Gi?.group !== this.group || kind !== this.kind) {
      try { this.dress?.dispose(); } catch { /* (its placeholder already gone) */ }
      this.dress = null; this.giant = Gi; this.group = Gi?.group || null; this.kind = kind;
      if (Gi) { try { this.dress = (kind === 'sand' ? dressColossus : dressStrawGiant)(Gi, this.game); } catch (e) { console.warn('giant look', e); } }
    }
    try { this.dress?.update(dt, this.t); } catch (e) { console.warn('giant look', e); this.dress = null; }
    if (Gi || this.field) {
      this.field ||= new ATFieldLook(this.game);
      this.field.update(dt, this.t, Gi, H?.pilot?.mech ? H.pilot : null);
    }
    this.shadow.update(dt, this.t);
  }
  clear() { this.dress?.dispose(); this.dress = null; this.giant = null; this.group = null; this.field?.dispose(); this.field = null; this.shadow.dispose(); }
}

/** The looks installed and stepped in the `fx` phase on the real clock (core/systems.js). */
export function installGiantLooks(game) {
  const L = game.giantLooks = new GiantLooks(game);
  game.systems?.add('fx', L, { clock: 'raw', name: 'giantLooks' });
  return L;
}
