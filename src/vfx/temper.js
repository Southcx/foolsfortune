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
//   temper.throughWalls = false | true | (c) -> bool   its looks drawn over walls (off: a wall hides them, as it hides the body; the
//                                           switch the Dreamvane's survey will throw as a psychic sonar ping: vfx/glyphs.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const NONE = Object.freeze({ gloss: 0.5, glow: new THREE.Color(0, 0, 0), tremble: 0 }); // (an unregistered creature: nothing to add, nothing made)
const _ember = new THREE.Color(0xff6a2a), _gold = new THREE.Color(0xffd76a);
const LOOKS = ['temper.stoic', 'temper.prismatic', 'temper.agitated', 'temper.enraged']; // (the held looks, in the order `want` keeps them)
const ENRAGE = 0.85; // (the default when no enrage is handed in: EMO.enrage, progress/combat/emo.js)
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class Temper {
  constructor(game) {
    this.game = game;
    this.on = new Map(); // creature -> { state, emo, enrage, held: Map(name -> handle), base: roughness }
    this.throughWalls = false; // (false, true, or a creature -> bool: its looks seen through walls)
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
    if (!T) return NONE;
    const t = this.game.events?.time ?? performance.now() / 1000;
    const heat = smooth(0.5, 1, T.emo), rage = T.enrage || T.emo >= ENRAGE ? 1 : 0;
    const pulse = 0.5 + 0.5 * Math.sin(t * (3 + 9 * heat)); // (a breath that quickens)
    T.glow.copy(_ember).multiplyScalar(0.25 * heat * (0.6 + 0.4 * pulse)).lerp(_gold, rage * 0.4 * pulse);
    const L = T.look ||= { gloss: 0.5, glow: T.glow, tremble: 0 }; // (one answer kept on the creature: nothing made a call)
    L.gloss = (T.state + 2) / 4; L.tremble = Math.max(heat * 0.4, rage); return L;
  }

  update() {
    if (!this.game.vfx) { this.on.forEach(this.glossOnly ||= (T, c) => { if (!c.alive) this.drop(c, T); else this.gloss(c, T); }); return; }
    this.on.forEach(this.step ||= (T, c) => this.stepOne(c, T)); // (one bound step, made once: nothing allocated a frame)
  }

  /** The gloss: the body's roughness, from its own (kept) toward chalk or glass. */
  gloss(c, T) {
    if (!c.mat || !('roughness' in c.mat)) return;
    T.base ??= c.mat.roughness;
    const s = T.state;
    c.mat.roughness = s < 0 ? THREE.MathUtils.lerp(T.base, 0.98, -s / 2) : THREE.MathUtils.lerp(T.base, 0.12, s / 2);
  }

  stepOne(c, T) {
    if (!c.alive) { this.drop(c, T); return; }
    this.gloss(c, T);
    const V = this.game.vfx, scale = THREE.MathUtils.clamp(c.height || 1, 0.5, 2.5), xr = !!(typeof this.throughWalls === 'function' ? this.throughWalls(c) : this.throughWalls);
    const W = T.want ||= new Float32Array(LOOKS.length); // (the four looks' strengths, kept on the creature)
    W[0] = smooth(1, 2, -T.state); W[1] = smooth(1, 2, T.state); W[2] = smooth(0.5, 0.9, T.emo) * (T.enrage ? 0.4 : 1); W[3] = T.enrage || T.emo >= ENRAGE ? 1 : 0;
    const y = c.pos.y + (c.height || 1) * 0.5;
    for (let i = 0; i < LOOKS.length; i++) {
      const name = LOOKS[i], k = W[i]; let h = T.held.get(name);
      if (k > 0.02) {
        if (h && !!h.ctx?.throughWalls !== xr) { h.stop?.(); h = null; } // (the switch thrown: played again into the other pools)
        if (!h || !h.alive) { h = V.play(name, { pos: new THREE.Vector3(c.pos.x, y, c.pos.z), scale, throughWalls: xr }); T.held.set(name, h); } // (a vector only when a look starts)
        h.pos.set(c.pos.x, y, c.pos.z); h.k = k;
      } else if (h) { h.stop?.(); T.held.delete(name); }
    }
  }

  drop(c, T) {
    for (const h of T.held.values()) h.stop?.();
    if (c.mat && T.base != null) c.mat.roughness = T.base;
    this.on.delete(c);
  }
}
