// ---------------------------------------------------------------------------------------
// THE LOAD'S GAUGES: nothing spends in silence (docs/plans/LACHRYMA-LOOP.md section 4). What the Soul Brush's load spends is shown where
// you are looking when you spend it:
//   - THE ARC: a thin arc beside the crosshair, the Lachrymato Bottle's fill (else the pool's, bottle-less), while you paint, mop or a jet
//     runs; it lingers a moment after, and flashes when it runs dry (the log's "The bristles run dry." is the load's own).
//   - THE HOVER'S RING at the feet, draining over its 1.6 s; THE ROCKET'S RING filling over its 0.55 s gather (world marks: no words).
// The looks are Calissa's (vfx/bottlearc.js: the arc; vfx/brushmarks.js: the jet ring); the numbers are the load's own
// (tools/soulbrush/load.js, courier/moves/jets.js).
//
// Prior art: Super Mario Sunshine's water gauge (FLUDD's tank, always shown while it is in use) and its nozzles' timers; Splatoon's ink
// tank on the back and its reticle's ink ring; Zelda: Breath of the Wild's stamina wheel beside the player (shown only while it moves).
//
//   game.loadGauge = new LoadGauge(game)   .update(raw) (once a frame, after the tools)
// ---------------------------------------------------------------------------------------
import { BOTTLES } from '../progress/brushload.js';
import { BottleArc } from '../vfx/bottlearc.js';
import { JetRing } from '../vfx/brushmarks.js';

const LINGER = 0.8, FLASH = 0.6; // (real seconds shown after; the dry flash's length)

export class LoadGauge {
  constructor(game) {
    this.game = game; this.show = 0; this.flash = 0; this.lastHeld = null;
    this.arc = new BottleArc(); this.el = this.arc.el; // (the arc beside the crosshair: vfx/bottlearc.js)
    this.ring = new JetRing(game); // (the jets' ring at the feet: drawn as much of a turn as is left (hover) or gathered (rocket): vfx/brushmarks.js)
  }

  /** What is being spent now, and from what: { frac (0..1 of the bottle, else the pool), active, empty }. */
  read() {
    const g = this.game, L = g.player?.techs?.get?.('soulbrush')?.load, a = g.player?.techs?.active;
    const jet = a && (a.id === 'hover' || a.id === 'rocket' || a.id === 'skim') ? a : null;
    const b = L?.bottle, frac = b ? L.held / BOTTLES[b].capacity : g.lachryma ? g.lachryma.fraction : 0;
    return { frac, active: !!(L?.busy || jet), jet, empty: frac < 0.02 };
  }

  update(raw) {
    const r = this.read(), P = this.game.player;
    if (r.active) this.show = LINGER; else this.show = Math.max(0, this.show - raw);
    if (r.active && r.empty && this.flash <= 0) this.flash = FLASH; else this.flash = Math.max(0, this.flash - raw);
    const on = this.show > 0 && !this.game.god?.active;
    this.arc.set({ show: on ? Math.min(1, this.show / 0.25) : 0, frac: r.frac, flash: this.flash / FLASH, low: r.frac < 0.25 }, raw);
    // the hover's and the rocket's rings
    const j = r.jet; let k = -1;
    if (j?.id === 'hover') k = 1 - Math.min(1, j.t / (j.cfg?.time || 1.6));
    else if (j?.id === 'rocket') k = Math.min(1, (j.gather || 0) / (j.cfg?.charge || 0.55));
    this.ring.set(P && !this.game.god?.active ? k : -1, j?.id, P?.renderPos, raw);
  }
}
