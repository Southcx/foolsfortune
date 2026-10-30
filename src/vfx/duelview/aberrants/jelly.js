// ---------------------------------------------------------------------------------------
// THE ABERRANT SLIP JELLY AS AN ELITE (docs/plans/ABERRANTS.md 5; South, 2026-10-29: "it should throw a LOT of junk, but its easy to
// clear. The weakness could be being highly susceptible to a well timed Transmute that converts the piled up junk for an OHKO"): the
// jelly's own layers of the duel's look, beside the Wisp's (wisp.js).
//   ITS GROUND     a bog of Gall on its side of the domains' clash (domains.js `setStyle(2, pile)`): ooze, bubbles, slime hung from the
//                  sky, the haze thickening as its slime piles on your half
//   ITS TELL       the secret (Dovina's `dissolve`, secrets.js) on the body only: the jelly shrinks as its slime piles on your half (it has
//                  thrown itself at you: `state.secret.k`), and swells back as the pile goes. Its slime and Spew, Harden and the Transmute
//                  that turns its slime are the board's (pieces.js, foecast.js, powercast.js)
//   ITS DEATHS     the Line's: it rears, wobbles and bursts into its slime, the drops flung out and the Figment's scatter
//                  (figmentscatter.js); the secret's: the slime on your half runs back into it, it slumps flat under its own weight, a
//                  held beat, and it is gone. Petra's session times them (`view.death(how)`).
// Programs: the bursts', the clash's and the cut-in's veil: nothing new.
// Prior art: Dragon Quest's slime (the squash that tells you everything), Puyo Puyo's garbage turned back on the sender, Kirby swallowing
// what is thrown at it, Majora's Mask's Gyorg; the Wisp's elite (wisp.js) for the shape of the file.
//
//   const E = new JellyElite(view)   JellyElite.fits(state, foe)   E.open(state, foe)   E.update(dt)   E.death(how) -> { dur, drainAt, step, end }   E.close()
//   (drainAt: real s into it when its body is gone and an aberrant's data drain may begin, its tail still playing: aberrantdrain.js)
//   JELLY_ELITE (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { secretOf } from '../../../progress/duel/secrets.js';
import { cellLocal, feelColour, sm, clamp01, lerp } from '../layout.js';

/** shrink: the body's scale at a full pile (of its own); ease: how fast the drawn pile follows the kernel's (/s); the deaths' beats (real s;
 *  drain: when its body is gone and an aberrant's data drain may begin). */
export const JELLY_ELITE = { shrink: 0.55, ease: 2.5, line: { rear: 0.35, burst: 0.6, scatter: 0.75, dur: 1.7, drain: 1.4 }, secret: { run: 0.9, slump: 0.8, hold: 0.7, dur: 2.8, drain: 2.1 } };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

export class JellyElite {
  /** The cut-in's motif behind this aberrant's bands (cutin.js: 2 sand). */
  static MOTIF = 2;
  /** Its strip in a cut-in (cutin.js aim): the whole body, a faceless blob read by its outline and drips, under gentler lights (a pale body
   *  went white under the strip's full key: the folds builder's shot, 2026-10-30). */
  static PORTRAIT = { whole: true, light: 0.5 };
  constructor(view) { this.view = view; this.on = false; this.pile = 0; }

  /** Whether a duel is an aberrant slip jelly's (its ruleset's secret is the dissolve, or the foe is one). */
  static fits(state, foe) { return state?.style === 'pve' && (state.rs?.secret === 'dissolve' || foe?.kind === 'slipjelly'); }

  open(state, foe) {
    this.on = JellyElite.fits(state, foe); this.foe = foe; this.pile = 0; this.dying = false;
    this.base = foe?.root ? foe.root.scale.clone() : null; this.view.clash.setStyle(this.on ? 2 : 0, 0);
  }

  close() {
    const f = this.foe; if (f?.root && this.base) f.root.scale.copy(this.base); if (f) f.squashTo = null;
    if (f?.model && f.alive !== false) f.model.visible = true; if (f?.root && f.alive !== false) f.root.visible = true;
    this.on = false; this.foe = null; this.base = null; this.view.clash.setStyle(0, 0);
  }

  /** The body's scale at a pile k (0..1): drawn in as its slime piles on you. */
  scaleAt(k, sy = 1) { const f = this.foe; if (!f?.root || !this.base) return; const s = 1 - JELLY_ELITE.shrink * k; f.root.scale.set(this.base.x * s, this.base.y * s * sy, this.base.z * s); }

  update(dt) {
    if (!this.on || this.dying) return;
    const V = this.view, k = clamp01(secretOf(V.state)?.k ?? 0);
    this.pile += (k - this.pile) * Math.min(1, dt * JELLY_ELITE.ease);
    V.clash.setStyle(2, this.pile); this.scaleAt(this.pile, 1 + 0.03 * Math.sin(performance.now() / 260));
  }

  /** One of its two deaths as a timeline the session plays (Petra's): 'line' or 'secret'. */
  death(how) {
    const V = this.view, g = V.game, f = this.foe, gall = feelColour('gall', _c).getHex(), at = V.foeCast.head(new THREE.Vector3()); this.dying = true;
    if (how === 'line') { const D = JELLY_ELITE.line; let burst = false, scattered = false;
      return { dur: D.dur, drainAt: D.drain, step: (age) => {
        const rear = sm(clamp01(age / D.rear)); this.scaleAt(this.pile, lerp(1, 1.35, rear) + (age < D.burst ? 0.08 * Math.sin(age * 40) : 0)); // (it rears and quivers)
        if (!burst && age >= D.burst) { burst = true; V.bursts.burst(at, gall, 34, { speed: 2.2, life: 0.8, fall: 5, spread: 0.6, size: 0.04 }); V.bursts.burst(at, 0xe8f0a0, 10, { speed: 1.2, life: 0.5, fall: 3, size: 0.03 }); V.stage?.jolt?.(0.8); g.glitch?.pulse?.({ split: 0.08, tear: 0.05, dur: 0.2 }); }
        if (!scattered && age >= D.scatter) { scattered = true; if (f && g.figmentScatter) g.figmentScatter.play(f, { hide: true }); else if (f?.root) f.root.visible = false; } },
        end: () => { this.dying = false; } };
    }
    const D = JELLY_ELITE.secret, B = V.board3, line = V.lineCol ?? B.line; let ran = false, gone = false;
    return { dur: D.dur, drainAt: D.drain, step: (age) => {
      if (!ran) { ran = true; for (let i = 0; i < 14; i++) { const x = Math.floor((i * 7.3) % Math.max(1, line)), y = Math.floor((i * 3.7) % B.h); // (its slime running home off your half)
        V.foeCast.fling(cellLocal(x, y, B, new THREE.Vector3()), at, gall, { delay: i * 0.05, life: D.run * 0.7, size: 0.03, arc: 0.4 }); } }
      const sl = sm(clamp01((age - D.run) / D.slump)); this.scaleAt(Math.max(0, this.pile - sl), lerp(1, 0.12, sl)); // (it slumps flat under its own weight)
      if (age > D.run && f) f.squashTo = lerp(1, 0.2, sl);
      const veil = age < D.run + D.slump ? sm(clamp01((age - D.run) / D.slump)) * 0.6 : age < D.run + D.slump + D.hold ? 0.6 : 0.6 * (1 - sm(clamp01((age - D.run - D.slump - D.hold) / 0.4)));
      V.cutIn?.veil?.(veil);
      if (!gone && age >= D.run + D.slump + D.hold * 0.5) { gone = true; V.bursts.burst(at.clone().setY(at.y - 0.3), gall, 16, { speed: 0.6, life: 0.6, fall: 1, spread: 1, size: 0.03 }); if (f?.root) f.root.visible = false; } },
      end: () => { V.cutIn?.veil?.(0); this.dying = false; } };
  }
}
