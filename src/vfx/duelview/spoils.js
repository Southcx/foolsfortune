// ---------------------------------------------------------------------------------------
// A DUEL'S SPOILS AND ITS SHINY (plain names; South, 2026-10-29: "Material drops for aberrant fights is a go. Also ... apply the inverted
// palette modifier shader on aberrants at a 10% chance. They'll be like our shiny versions"; Dovina's progress/duel/drops.js):
//   THE SHINY        an aberrant that went wrong shiny (`c.shiny`, Dovina's roll, Petra's set) wears the inverted colours in the world
//                    (vfx/databug.js gives it AberrantInversion where the rest keep AberrantLook) and on the tsuitate's idol; at the duel's
//                    open a ring of white and gold stars bursts round its head, Pokemon's sparkle, once
//   THE DROP         `duel.drop { items: [{ item, tier }], shiny }` just after a won duel: each material flung from where the aberrant stood
//                    into the Pneuka Jar's mouth in its tier's colour, one after another, a shiny's extra in gold (the log says what)
//   THE REGEN        the kernel's `drink { from: 'regen' }` at your turn's open: "+N" at the Lachrimeter's bulb, in the film, as the bead
//                    runs up the link
// Programs: the bursts' and the words' (bursts.js, juice.js): nothing new.
// Prior art: Pokemon's shiny sparkle, Monster Hunter's carves flying to the hunter, Diablo's drop beams by rarity.
//
//   const S = new DuelSpoils(view)   S.open(state, foe)   S.drop(e)   S.regen(e)   SPOILS (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { feelColour } from './layout.js';

/** TIER: a material's tier's colour (1 common .. 5); stars: the shiny's sparkle; per: the drop's stagger (real s). */
export const SPOILS = { tier: [0xd8d2c4, 0xd8d2c4, 0x7ed67a, 0x6aa8ff, 0xc77aff, 0xffd36a], stars: 14, per: 0.14, fly: 0.7 };
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class DuelSpoils {
  constructor(view) {
    this.view = view; const ev = view.game.events;
    if (ev?.on) ev.on('duel.drop', (e) => this.drop(e));
  }

  /** At the duel's open: a shiny's idol inverted and its sparkle. */
  open(state, foe) {
    const V = this.view; if (!foe?.shiny) return;
    const c = V.pieces.foeMat?.color; if (c) { feelColour(V.aspect, c); c.setRGB(1 - c.r, 1 - c.g, 1 - c.b); } // (the idol in its colours inverted, as the body in the world)
    const at = V.foeCast.head(new THREE.Vector3());
    for (let i = 0; i < SPOILS.stars; i++) { const a = (i / SPOILS.stars) * Math.PI * 2; _b.copy(at).add(_a.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0.05));
      V.foeCast.fling(at, _b.clone(), i % 2 ? 0xffffff : 0xffd36a, { delay: 0.6 + (i % 3) * 0.06, life: 0.4, size: 0.03, arc: 0.1 }); }
  }

  /** A won duel's materials flying into the Pneuka Jar. */
  drop(e) {
    const V = this.view; if (!V.root?.visible || !e?.items?.length) return;
    const from = V.foeCast.head(new THREE.Vector3()), to = V.frame.worldToLocal(V.dive.mouth(new THREE.Vector3()));
    e.items.forEach((it, i) => { const hex = SPOILS.tier[Math.max(0, Math.min(5, it.tier ?? 1))];
      V.foeCast.fling(from, to.clone(), hex, { delay: i * SPOILS.per, life: SPOILS.fly, size: 0.05, arc: 0.9 });
      V.bursts.burst(from, hex, 6, { speed: 0.6, life: 0.4, fall: -0.5, size: 0.02 }); });
    if (e.shiny) V.bursts.burst(from, 0xffd36a, 18, { speed: 1.2, life: 0.6, fall: 0, spread: 0.4, size: 0.025 });
  }

  /** Your turn's regen: "+N" at the bulb. */
  regen(e) {
    const V = this.view, at = V.tubeAt?.(new THREE.Vector3()); if (!at || !e.n) return;
    V.juice.word(`+${e.n}`, at.add(_a.set(0.05, 0.12, 0)), 0x9fd8ff, { h: 0.1, dur: 0.9, rise: 0.12 });
  }
}
