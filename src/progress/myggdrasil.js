// ---------------------------------------------------------------------------------------
// MYGGDRASIL: the World Mushroom on its own planetoid, as kept and grown (docs/plans/MYCELIUM.md section 4; the owner, 2026-10-08: "own
// planetoid", "make sure its model is BIG"; the name Espada's). Fed anything at its roots, it eats it: THE TINCTURE (its sap) moves to
// the colour of all it has eaten, each meal weighed by its worth, and its GIRTH grows as its meals double. At each dawn (game hour 5)
// its open CAPS fruit (mycelium.js `fruit`): materials of the tincture's colour leaned toward the game day's feeling. The crop waits in
// the crown until picked, never spoiling, and a dawn adds none while one is waiting (a crop is the most it holds: no chore, no loss).
// A Major Arcana card from the Book hung on a BRANCH opens it for good (mycelium.js BRANCHES: a fruit, a sharper tincture, a strain's
// seed). The seventh cap, Mercy, seeds a strain when it opens. The planetoid, the tree's look, the hand's feeding and
// picking are the world's (Petra's) and Calissa's.
//
// Prior art: Legend of Mana's Trent (fed seeds, fruiting by the weekday), Potion Craft's map (a mixture steered by what goes in), the
// Kabbalists' Tree of Life and the Golden Dawn's tarot on its paths, Stardew Valley's bundles (a collection opens the world).
//
//   game.myggdrasil = new Myggdrasil(game)   .tincture -> { h, s, mass } | null   .girth   .caps (open)   .crown -> [material]
//   .feed(boxSlot) -> { ok, why?, girth }   .pick() -> n   .hang(arcana) -> { ok, why?, adds }   .dawn(now?) (called on entering the
//   garden and on the clock)   .branches -> { arcana: true }
// events: myggdrasil.feed { thing, worth, girth }, myggdrasil.girth { girth, caps }, myggdrasil.fruit { n, weekday }, myggdrasil.pick { n },
//         myggdrasil.hang { arcana, adds }, each with `by` (the sporelings were cut: the owner, 2026-10-09)
// ---------------------------------------------------------------------------------------
import { sapAfter, signatureOf, fruit, treeGirth, bodiesOpen, BRANCHES, CAPS, STRAINS } from './mycelium.js';
import { thingOf } from './sporebeds.js';
import { clockAt } from './weather.js';
import * as calendar from '../core/calendar.js';

const clock = calendar.now, GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24, DAWN = 5;
const MERCY = CAPS.indexOf('Mercy') + 1; // (the seventh cap seeds a strain when it opens: Espada's)
const fresh = () => ({ tincture: null, fed: 0, branches: {}, crown: [], dawn: -1, seed: 7 });

export class Myggdrasil {
  constructor(game) {
    this.game = game; this.s = fresh();
    game.save?.section('myggdrasil', { scope: 'player', version: 1, dump: () => this.s, load: (d) => { this.s = { ...fresh(), ...(d || {}) }; }, reset: () => { this.s = fresh(); } });
    game.events?.on?.('garden.enter', () => this.dawn());
  }
  dirty() { this.game.save?.dirty('myggdrasil'); }
  emit(name, e = {}) { this.game.events?.emit(name, { ...e, by: 'courier' }); }
  get tincture() { return this.s.tincture; }
  get girth() { return treeGirth(this.s.fed); }
  get caps() { return bodiesOpen(this.girth); }
  get crown() { return this.s.crown; }
  get branches() { return this.s.branches; }
  /** The branches' sums, as `fruit` reads them. */
  tree() {
    const b = { fruit: 0, sharp: 0 };
    for (const id of Object.keys(this.s.branches)) { const B = BRANCHES[id]; if (B?.adds === 'fruit') b.fruit++; if (B?.adds === 'sharp') b.sharp++; }
    return { sap: this.s.tincture, fed: this.s.fed, branches: b };
  }

  /** Feed it the thing in this box slot: anything with a colour (a curio, a material, a fish); what has none, it will not eat. */
  feed(boxSlot) {
    const box = this.game.pneuka, x = thingOf(box?.slots[boxSlot], this.game.sporeBeds?.itemOf), g = signatureOf(x);
    if (!x) return { ok: false, why: 'There is nothing there to give it.' };
    if (!g) return { ok: false, why: 'It will not eat that.' };
    const was = this.girth, capsWas = this.caps;
    box.take(boxSlot);
    this.s.tincture = sapAfter(this.s.tincture, x); this.s.fed += g.worth;
    this.dirty(); this.emit('myggdrasil.feed', { thing: x.id, worth: g.worth, girth: this.girth });
    if (this.girth > was) {
      this.emit('myggdrasil.girth', { girth: this.girth, caps: this.caps });
      if (capsWas < MERCY && this.caps >= MERCY) this.seedStrain(); // (Mercy opens: a strain)
    }
    return { ok: true, girth: this.girth };
  }
  seedStrain(feeling = null) {
    const S = this.game.sporeBeds; if (!S) return false;
    const want = feeling || Object.keys(STRAINS).find((f) => !S.strains[f]);
    return want ? S.learn(want) : false;
  }

  /** Dawn: if a dawn has passed since the last crop and the crown is bare, the caps fruit. */
  dawn(now = clock()) {
    const day = Math.floor((now - DAWN * GAME_HOUR) / (24 * GAME_HOUR));
    if (day <= this.s.dawn) return 0;
    this.s.dawn = day; this.dirty();
    if (this.s.crown.length || !this.s.tincture?.mass) return 0; // (a crop waiting: the most the crown holds)
    const weekday = clockAt(now).weekday;
    this.s.seed = (this.s.seed * 48271) % 2147483647;
    const r = fruit(this.tree(), weekday, this.s.seed);
    this.s.crown = r.fruit; this.s.tincture = r.sap;
    this.emit('myggdrasil.fruit', { n: r.fruit.length, weekday });
    return r.fruit.length;
  }
  /** Pick the crown: every fruit into the box. */
  pick() {
    this.dawn();
    const n = this.s.crown.length;
    for (const m of this.s.crown) this.game.pneuka?.add(`mat.${m.of}`, 'garden', 0, { kind: m.of, tier: m.tier, hue: m.hue, sat: m.sat, path: m.path });
    this.s.crown = []; if (n) { this.dirty(); this.emit('myggdrasil.pick', { n }); }
    return n;
  }

  /** Hang a Major Arcana card (from the Book) on its branch: the card is given to the tree, and the branch is open for good. */
  hang(arcana) {
    const B = BRANCHES[arcana], book = this.game.veritome?.book, id = `arcana.${arcana}`;
    if (!B) return { ok: false, why: 'No branch takes that.' };
    if (this.s.branches[arcana]) return { ok: false, why: 'That branch is already hung.' };
    if (!book?.has(id)) return { ok: false, why: 'You have no such card in the Book.' };
    book.take(id);
    this.s.branches[arcana] = true; this.dirty();
    if (B.adds === 'seed') this.seedStrain(B.strain);
    this.emit('myggdrasil.hang', { arcana, adds: B.adds });
    return { ok: true, adds: B.adds };
  }
}
