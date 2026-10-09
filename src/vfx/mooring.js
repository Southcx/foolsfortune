// ---------------------------------------------------------------------------------------
// THE MOORING: the ship chosen at the pier, lying alongside its end at its life size (docs/GLOSSARY.md: the pier, ship; the hull's look
// vfx/shipclasses.js). The pier's page chooses a hull (game.pier.ship); the one moored beside the nearest pier is that hull, so the
// choice is seen as it is made (the page shut, it is there on the water) and the crossing casts off from it. Riding the crude: its bob
// and roll from the sea where there is one to ask (the crossing's crude sea at Margarite's dock), a slow swell otherwise.
// Only near a pier (inside 160 m) is it shown; the looks are built once a class and kept (the rail's own, vfx/shipclasses.js shipLook).
// A MOUNT'S PREVIEW rides it (vfx/mountpreview.js, docs/plans/CLARITY.md section 6): the pier's page names the mount hovered or chosen
// (`preview(tool)`), and its shape is drawn on the crude round the hull, one at a time, until another is named, none is, or the Courier
// leaves the pier (or casts off). The page pauses the game, so the loop's modal branch ticks the mooring too (else a mount hovered in it
// stands frozen at nothing: casebook rule 135), and a page shut under the pointer sends no leave, so the mooring sets the preview back to the
// mount taken aboard when it sees the page close (rule 136). `side()` says which side of the screen the hull lies on: the page is set aside to the other.
//
// Prior art: Wind Waker's King of Red Lions tied up at every dock, Sunless Sea's ship at its London berth (the ship you chose is the
// one you see), and the harbour of every port town: a hull alongside reads "you can go to sea from here" with no word said.
//
//   game.mooring = new Mooring(game)   .update(raw)   (reads game.pier: its piers' ends and its chosen hull; the sea level per island)
//   .preview(toolId | null)   (a mount's preview on the moored hull; the pier's page calls it)   .side() -> 'left' | 'right' | null   (where the hull is on screen)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shipLook } from './shipclasses.js';
import { MountPreview } from './mountpreview.js';
import { COLOR } from '../progress/weather.js';

const NEAR = 160, SIDE = 1.6, DECK = { anagami: 1.1, margarite: 1.6 }; // (metres: shown within; off the pier's side past the hull's half beam; a pier's deck over the crude: beach.js JETTY.deck, margarite.js MARGARITE.deck)

export class Mooring {
  constructor(game) {
    this.game = game; this.looks = {}; this.cur = null; this.t = 0; this.at = new THREE.Vector3(); this.feel = 0xffc65c;
    this.mounts = new MountPreview(); game.scene.add(this.mounts.mesh); // (built at boot: its program is the rail's marks', compiled in the warm-up)
    this.sea = null; const water = (x, z) => (this.sea ? (this.sea.surfaceAt ? this.sea.surfaceAt(x, z) : this.sea.heightAt(x, z)) : null); // (the crude as drawn there: casebook rule 123, the world's y)
    this.pv = { at: new THREE.Vector3(), yaw: 0, length: 7, camera: game.camera, lines: 480, water, color: this.feel };
  }

  /** A mount's preview on the moored hull (a tool id of MOUNTS), or none: the pier's page names the one hovered or chosen. */
  preview(tool) { this.mounts.show(tool); return this; }

  /** Which side of the screen the moored hull lies on ('left' | 'right'), or none if it is not shown: the pier's page docks to the other,
   *  so the hull and its preview stay in view while a mount is chosen. */
  side() { return this.cur?.group.visible ? (_v.copy(this.at).project(this.game.camera).x < 0 ? 'left' : 'right') : null; }

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
    if (!P || !me || g.emocean?.stage.active) { this.away(); return; }
    let best = null, bd = NEAR;
    for (const [island, at] of P.piers) { const j = at(); if (!j) continue; const d = Math.hypot(j.end.x - me.x, j.end.z - me.z); if (d < bd) { bd = d; best = { island, j }; } }
    if (!best) { this.away(); return; }
    const s = this.look(P.ship || 'sloop'), open = !!g.indexMenu?.open;
    if (this.paged && !open) this.mounts.show(P.chosen?.at(-1) ?? null); // (a page shut under the pointer sends no leave: the mount taken aboard, whatever it was over)
    this.paged = open;
    if (this.cur !== s) { this.hide(); this.cur = s; s.polarity(this.feel = COLOR[g.weather?.at?.(best.island)?.aspect] ?? 0xffc65c); }
    // alongside the pier's end on its south side, the bow out to sea (the pier faces the land: its yaw), a little inland of the end
    const { j, island } = best, yaw = j.yaw ?? 0, out = _f.set(-Math.sin(yaw), 0, -Math.cos(yaw)), side = _r.set(out.z, 0, -out.x);
    const sea = j.top - (DECK[island] ?? 1.3), half = (s.beam ?? 2.4) / 2;
    this.at.copy(j.end).addScaledVector(out, -(s.length ?? 7) * 0.32).addScaledVector(side, 1.6 + half + SIDE); this.at.y = sea;
    const crude = g.emocean?.sea?.mesh?.visible ? g.emocean.sea : null, t = this.t;
    const bob = crude ? crude.heightAt(this.at.x, this.at.z) - crude.y : 0.12 * Math.sin(t * 0.8); // (heightAt is the world's, the crude's own y in it)
    s.group.position.set(this.at.x, sea + bob * 0.7, this.at.z);
    s.group.rotation.set(0.025 * Math.sin(t * 0.6), Math.atan2(out.x, out.z), 0.035 * Math.sin(t * 0.45 + 1), 'YXZ');
    s.set({ sail: 0, side: 1, glow: 0.35, t }); // (moored: the canvas furled, the main tied on the boom amidships and the jib rolled on its stay: sloop.js FURL; the drive low)
    s.group.visible = true;
    // the mount's preview round it: laid on the crude as it is drawn (the dock's sea, or the shore's), level with the hull's heading
    const V = this.pv; this.sea = crude || (g.shore?.sea?.mesh?.visible ? g.shore.sea : null);
    V.at.copy(this.at); V.yaw = s.group.rotation.y; V.length = s.length ?? 7; V.camera = g.camera; V.color = this.feel;
    V.lines = g.renderer?.getDrawingBufferSize?.(_px).y || 480;
    this.mounts.draw(V, raw);
  }

  hide() { if (this.cur) this.cur.group.visible = false; this.cur = null; }
  /** Nothing to moor (no pier near, or the crossing begun): the hull hidden and its preview cleared. */
  away() { this.hide(); this.paged = false; this.mounts.park(); }
}
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _v = new THREE.Vector3(), _px = new THREE.Vector2();
