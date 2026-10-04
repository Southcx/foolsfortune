// ---------------------------------------------------------------------------------------
// TEMPER: a creature's body showing its mental state and its agitation, never in words (docs/GLOSSARY.md: temper, mental state,
// Emotional Output). The numbers are not this module's (plan B2 and B4: Dovina's rules, set on the creature by whoever owns them); they
// are handed in, and this shows them:
//
//   MENTAL STATE (-2 Stoic .. +2 Prismatic, the lore's solid to liquid). The body's gloss follows it: chalky and matte when Stoic (a
//                fired, dry clay), glassy when Fluid, wet and shot with the labradorite's colours when Prismatic. At the ends a held
//                look: a Stoic body sheds dry flakes and a little dust; a Prismatic one runs with glints and drips of colour.
//   EmO (0 .. 1, agitation). Past the middle the body steams and gives off heat; at an enrage (`enrage: true`, or EmO at the top) it
//                throws sparks and pulses with hard red-gold rings. The glow and the tremble are offered to the body (`look`), which
//                is the body module's to apply (its own update writes its material every frame).
//
// Prior art: Shadow of the Colossus's and Monster Hunter's tells (a monster shows its rage with its body: steam, glow, posture, never a
// bar), Okami's and Ico's restraint (the state of a thing in its surface, not a label), the iridescent "oil on water" of Lisa Frank
// over Moebius for the liquid end. The looks are data: `temper.*` in vfx/library.js, played through game.vfx and held on the creature.
//
//   game.temper = new Temper(game)
//   temper.set(c, { state, emo, enrage })   whenever they change (missing keys keep their value)
//   temper.look(c) -> { gloss 0..1, glow THREE.Color (add to emissive), tremble 0..1 }   for the body module
//   temper.update()                         every frame, after the creatures
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _ember = new THREE.Color(0xff6a2a), _gold = new THREE.Color(0xffd76a);
const ENRAGE = 0.85; // (the default when no enrage is handed in: EMO.enrage, progress/combat/emo.js)
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class Temper {
  constructor(game) {
    this.game = game;
    this.on = new Map(); // creature -> { state, emo, enrage, held: Map(name -> handle), base: roughness }
  }

  set(c, v = {}) {
    if (!c) return;
    const T = this.on.get(c) || { state: 0, emo: 0, enrage: false, held: new Map(), base: null, glow: new THREE.Color() };
    if (v.state !== undefined) T.state = THREE.MathUtils.clamp(v.state, -2, 2);
    if (v.emo !== undefined) T.emo = THREE.MathUtils.clamp(v.emo, 0, 1);
    if (v.enrage !== undefined) T.enrage = !!v.enrage;
    this.on.set(c, T);
  }

  /** What the body should add to itself this frame: its gloss, a glow for its emissive, and how much it trembles. */
  look(c) {
    const T = this.on.get(c);
    if (!T) return { gloss: 0.5, glow: new THREE.Color(0, 0, 0), tremble: 0 };
    const t = this.game.events?.time ?? performance.now() / 1000;
    const heat = smooth(0.5, 1, T.emo), rage = T.enrage || T.emo >= ENRAGE ? 1 : 0;
    const pulse = 0.5 + 0.5 * Math.sin(t * (3 + 9 * heat)); // (a breath that quickens)
    T.glow.copy(_ember).multiplyScalar(0.25 * heat * (0.6 + 0.4 * pulse)).lerp(_gold, rage * 0.4 * pulse);
    return { gloss: (T.state + 2) / 4, glow: T.glow, tremble: Math.max(heat * 0.4, rage) };
  }

  update() {
    const V = this.game.vfx;
    for (const [c, T] of this.on) {
      if (!c.alive) { this.drop(c, T); continue; }
      // the gloss: the body's roughness, from its own (kept) toward chalk or glass
      if (c.mat && 'roughness' in c.mat) {
        T.base ??= c.mat.roughness;
        const s = T.state;
        c.mat.roughness = s < 0 ? THREE.MathUtils.lerp(T.base, 0.98, -s / 2) : THREE.MathUtils.lerp(T.base, 0.12, s / 2);
      }
      if (!V) continue;
      const scale = THREE.MathUtils.clamp(c.height || 1, 0.5, 2.5);
      const at = (out) => out.set(c.pos.x, c.pos.y + (c.height || 1) * 0.5, c.pos.z);
      const want = {
        'temper.stoic': smooth(1, 2, -T.state),
        'temper.prismatic': smooth(1, 2, T.state),
        'temper.agitated': smooth(0.5, 0.9, T.emo) * (T.enrage ? 0.4 : 1),
        'temper.enraged': T.enrage || T.emo >= ENRAGE ? 1 : 0,
      };
      for (const [name, k] of Object.entries(want)) {
        let h = T.held.get(name);
        if (k > 0.02) {
          if (!h || !h.alive) { h = V.play(name, { pos: at(new THREE.Vector3()), scale }); T.held.set(name, h); }
          at(h.pos); h.k = k;
        } else if (h) { h.stop?.(); T.held.delete(name); }
      }
    }
  }

  drop(c, T) {
    for (const h of T.held.values()) h.stop?.();
    if (c.mat && T.base != null) c.mat.roughness = T.base;
    this.on.delete(c);
  }
}
