// ---------------------------------------------------------------------------------------
// LOOSE CARDS: a card out of the Book (book.loose) is shown where it is: circling the Courier at the height of her chest, face out,
// turning slowly, flickering faintly in its last ten seconds (one card, a small thing: not a screen-wide flicker). When the Book is
// opened it flies into it; when its minute is up and it has an item form, it bursts into the thing itself. No words: the card is
// the mark (CLAUDE.md: marks in the world are not text).
//
// Prior art: Greed Island's cards held outside the binder (they turn into their items after a minute), and the orbiting pickups of
// action games that are already yours but not yet put away (Kingdom Hearts' prizes, Zelda's heart pieces held up before they go in).
//
//   const L = new LooseCards(game)   L.update(dt, book, into)   (into: a world point the bound cards fly to)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { cardArt } from './cards.js';

const R = 0.75, H = 1.25;

export class LooseCards {
  constructor(game) {
    this.game = game;
    this.on = new Map(); // loose entry -> { s, a }
    this.fly = [];       // { s, from, to, t, burst }
    this.t = 0;
  }

  sprite(id) {
    const tex = new THREE.CanvasTexture(cardArt(id, 96, 160));
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    s.scale.set(0.2, 0.33, 1); s.renderOrder = 26;
    this.game.scene.add(s);
    return s;
  }
  drop(s) { this.game.scene.remove(s); s.material.map?.dispose(); s.material.dispose(); }

  update(dt, book, into) {
    const g = this.game, P = g.player;
    this.t += dt;
    const live = new Set(book.loose);
    // gone from the loose list: bound (it flies to the Book) or turned into its item (it bursts where it is)
    for (const [L, e] of this.on) {
      if (live.has(L)) continue;
      this.on.delete(L);
      const bound = L.t > 0; // (a card whose minute ran out became its item; any other was bound)
      this.fly.push({ s: e.s, from: e.s.position.clone(), to: into.clone(), t: 0, burst: !bound });
      if (!bound) g.glyphs?.pop('star', e.s.position.clone(), { color: 0xffe7a0, size: 0.35, burst: true, life: 0.7 });
    }
    let i = 0;
    const n = book.loose.length;
    for (const L of book.loose) {
      let e = this.on.get(L);
      if (!e) { e = { s: this.sprite(L.id), a: Math.random() * Math.PI * 2 }; this.on.set(L, e); }
      const a = this.t * 0.9 + (i / Math.max(1, n)) * Math.PI * 2;
      e.s.position.set(P.renderPos.x + Math.sin(a) * R, P.renderPos.y + H + Math.sin(this.t * 2 + i) * 0.06, P.renderPos.z + Math.cos(a) * R);
      e.s.material.opacity = L.t < 10 ? 0.6 + 0.4 * Math.abs(Math.cos(this.t * (3 + (10 - L.t) * 0.6))) : 1;
      e.s.visible = !g.god?.active;
      i++;
    }
    for (let k = this.fly.length - 1; k >= 0; k--) {
      const f = this.fly[k];
      f.t += dt / (f.burst ? 0.35 : 0.45);
      if (f.t >= 1) { this.drop(f.s); this.fly.splice(k, 1); continue; }
      if (f.burst) { f.s.scale.set(0.2 * (1 + f.t * 1.5), 0.33 * (1 + f.t * 1.5), 1); f.s.material.opacity = 1 - f.t; }
      else { const u = f.t * f.t; f.s.position.lerpVectors(f.from, f.to, u); f.s.scale.set(0.2 * (1 - u * 0.7), 0.33 * (1 - u * 0.7), 1); }
    }
  }

  clear() { for (const e of this.on.values()) this.drop(e.s); this.on.clear(); for (const f of this.fly) this.drop(f.s); this.fly.length = 0; }
}
