// ---------------------------------------------------------------------------------------
// THE MOORING: the ship chosen at the pier, lying alongside its end at its life size (docs/GLOSSARY.md: the pier, ship; the hull's look
// vfx/shipclasses.js). The pier's page chooses a hull (game.pier.ship); the one moored beside the nearest pier is that hull, so the
// choice is seen as it is made (the page shut, it is there on the water) and the crossing casts off from it. Riding the crude: its bob
// and roll from the sea where there is one to ask (the crossing's crude sea at Margarite's dock), a slow swell otherwise.
// Only near a pier (inside 160 m) is it shown; the looks are built once a class and kept (the rail's own, vfx/shipclasses.js shipLook).
//
// Prior art: Wind Waker's King of Red Lions tied up at every dock, Sunless Sea's ship at its London berth (the ship you chose is the
// one you see), and the harbour of every port town: a hull alongside reads "you can go to sea from here" with no word said.
//
//   game.mooring = new Mooring(game)   .update(raw)   (reads game.pier: its piers' ends and its chosen hull; the sea level per island)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shipLook } from './shipclasses.js';
import { COLOR } from '../progress/weather.js';

const NEAR = 160, SIDE = 1.6, DECK = { anagami: 1.1, margarite: 1.6 }; // (metres: shown within; off the pier's side past the hull's half beam; a pier's deck over the crude: beach.js JETTY.deck, margarite.js MARGARITE.deck)

export class Mooring {
  constructor(game) { this.game = game; this.looks = {}; this.cur = null; this.t = 0; this.at = new THREE.Vector3(); }

  /** The look of a hull, built on first asking and parked in the scene hidden. */
  look(id) {
    if (!this.looks[id]) {
      const s = this.looks[id] = shipLook(id, { env: this.game.sky?.env || null });
      s.group.visible = false; s.group.userData.zoneFree = true; this.game.scene.add(s.group);
    }
    return this.looks[id];
  }

  update(raw) {
    const g = this.game, P = g.pier, me = g.player?.pos; this.t += raw;
    if (!P || !me || g.emocean?.stage.active) { this.hide(); return; }
    let best = null, bd = NEAR;
    for (const [island, at] of P.piers) { const j = at(); if (!j) continue; const d = Math.hypot(j.end.x - me.x, j.end.z - me.z); if (d < bd) { bd = d; best = { island, j }; } }
    if (!best) { this.hide(); return; }
    const s = this.look(P.ship || 'sloop');
    if (this.cur !== s) { this.hide(); this.cur = s; s.polarity(COLOR[g.weather?.at?.(best.island)?.aspect] ?? 0xffc65c); }
    // alongside the pier's end on its south side, the bow out to sea (the pier faces the land: its yaw), a little inland of the end
    const { j, island } = best, yaw = j.yaw ?? 0, out = _f.set(-Math.sin(yaw), 0, -Math.cos(yaw)), side = _r.set(out.z, 0, -out.x);
    const sea = j.top - (DECK[island] ?? 1.3), half = (s.beam ?? 2.4) / 2;
    this.at.copy(j.end).addScaledVector(out, -(s.length ?? 7) * 0.32).addScaledVector(side, 1.6 + half + SIDE); this.at.y = sea;
    const crude = g.emocean?.sea?.mesh?.visible ? g.emocean.sea : null, t = this.t;
    const bob = crude ? crude.heightAt(this.at.x, this.at.z) : 0.12 * Math.sin(t * 0.8);
    s.group.position.set(this.at.x, sea + bob * 0.7, this.at.z);
    s.group.rotation.set(0.025 * Math.sin(t * 0.6), Math.atan2(out.x, out.z), 0.035 * Math.sin(t * 0.45 + 1), 'YXZ');
    s.set({ sail: 0.15, side: 1, glow: 0.35, t }); // (moored: the sails furled to a bundle, the drive low)
    s.group.visible = true;
  }

  hide() { if (this.cur) this.cur.group.visible = false; this.cur = null; }
}
const _f = new THREE.Vector3(), _r = new THREE.Vector3();
