// ---------------------------------------------------------------------------------------
// THE MOUNTS AT THE FREE HELM, THEIR LOOK (docs/plans/OPEN-SEA.md 14.2; Dovina's SEA_MOUNTS, progress/rail/mounts.js; Petra's runtime,
// world/opensea/seamounts.js): each worn tool's moment at sea drawn at the ship's life size (the sloop 35 m, the beasts 30 to 100 m).
// Owned and driven by the fight's look (vfx/opensea/seafightlook.js `draw`); it hears the runtime's events and reads its state, and
// nothing here is counted or decides anything.
//   THE HARPOON   (Sondelass) a barbed iron fired off the rail that bears, on a line; tethered (`c.tether`), the line hangs from the rail
//                 to the beast's head, sagging slack and drawn straight and humming when it strains, spray where it cuts the water;
//                 when the tether ends it snaps and whips home. A crate hooked rides the line back; a miss splashes and is hauled in.
//                 (seamounts/harpoon.js)
//   THE TOLL      (Crucibelle) the bell on its yoke at the bow swings and rings: a gold shock ring and its bronze echo run out over the
//                 water to the toll's reach, rippling it, and each windup it breaks shatters at its beast's head. (seamounts/rings.js,
//                 seamounts/deck.js)
//   THE GULP      (Lockheart) the coffin on the foredeck throws its lid and the sea off the bow spirals into it, a spit drunk with it;
//                 while it holds a drink its seams glow, and the shot that carries it back leaves with a burst and a violet wake.
//                 (seamounts/deck.js)
//   SONAR         (Dreamvane) pale rings ping out from the hull along the water; where a beast under it will come up (its breach's ring
//                 when it has one), a pale mark breathes on the surface, rings and rising motes, fading over a few real seconds. A world
//                 mark: no words. (seamounts/rings.js)
//   THE FLASH     (Veritome) a white burst off the bow and a plate's four corner brackets thrown round the beast's head, locking in;
//                 gold, with a gold rim round the weak point, while it is held open (`c.open`). (seamounts/flash.js)
//   THE SLICK     (Soul Brush) paint laid astern in the brush's feeling and its paint motif (vfx/paintmotifs.js), glossy, spreading,
//                 fading over its life; a shot or a ball through it sets it alight (a look only, Dovina's line): fire runs out from
//                 where it crossed, flames and smoke blown downwind, its colour gone to ember and char. (seamounts/slick.js)
//   A FIZZLE      a mount refused (`ok` false): a small dry puff where it stands, no words (the log says why).
//
// Prior art: Sea of Thieves' harpoon rowboats (a line you can see go taut) and the Kraken's ink on the water, Assassin's Creed IV:
// Black Flag's swivel gun and its fire barrels (a burning slick a ship is steered through), Moby-Dick's whale line (the line hums
// before it parts), Subnautica's sonar (rings out from the hull, what is under shown where it is), Pokemon Snap's flash and its frame.
//
//   const M = new SeaMountsLook(game)   .draw(fight, dt, live)   (it listens for sea.mount, sea.slick and sea.sonar itself)
//   .shipPoint(x, y, z, out) (the hull's frame: +Z the bow, +X port)   .deckAt(z)   .surf(x, z)   .parked() -> [mesh]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HarpoonLook } from './seamounts/harpoon.js';
import { SlickLook } from './seamounts/slick.js';
import { SeaRings } from './seamounts/rings.js';
import { DeckMounts } from './seamounts/deck.js';
import { FlashLook } from './seamounts/flash.js';

/** puff: a fizzle's grey breath (count, colour, its spark's); */
export const SEA_MOUNTS_LOOK = { puff: { n: 7, color: 0x8f8a82, spark: 0x8a7a60 } };
const _v = new THREE.Vector3(), _d = new THREE.Vector3();

export class SeaMountsLook {
  constructor(game) {
    this.game = game; this.fight = null; this.live = false; this.t = 0;
    this.winding = new Map(); // (a beast -> its head, last frame, while it wound up: what a toll breaks)
    this.harpoon = new HarpoonLook(this); this.slick = new SlickLook(this); this.rings = new SeaRings(this); this.deck = new DeckMounts(this); this.flash = new FlashLook(this);
    const on = (n, f) => game.events?.on?.(n, f);
    on('sea.mount', (e) => this.mount(e)); on('sea.slick', (e) => this.slick.laid(e)); on('sea.sonar', (e) => this.rings.sonar(e));
  }
  parked() { return [...this.harpoon.parked(), ...this.slick.parked(), ...this.rings.parked(), ...this.deck.parked(), ...this.flash.parked()]; }
  get helm() { return this.game.opensea?.helm || null; }
  get serpents() { return this.fight?.serpents || this.game.seaSerpents || null; }
  get fx() { return this.game.fx || null; }
  get L() { return this.helm?.look?.length ?? 35; }
  get beam() { return this.helm?.look?.beam ?? 9; }
  surf(x, z) { return this.serpents?.surf?.(x, z) ?? this.helm?.pos.y ?? 0; }
  deckAt(z) { const K = this.helm?.look; return K?.deckHeight?.(z) ?? K?.deckY ?? 1; }
  /** A point in the hull's frame (+Z the bow, +X port, Y up from the waterline) in the world, by the heading alone (the heel is the props'). */
  shipPoint(x, y, z, out = new THREE.Vector3()) {
    const H = this.helm; if (!H) return out.set(0, 0, 0);
    const s = Math.sin(H.yaw), c = Math.cos(H.yaw);
    return out.set(H.pos.x + x * c + z * s, H.pos.y + y, H.pos.z - x * s + z * c);
  }
  /** Which side a world point lies on: 1 port, -1 starboard. */
  sideOf(p) { const H = this.helm; return H && (p.x - H.pos.x) * Math.cos(H.yaw) - (p.z - H.pos.z) * Math.sin(H.yaw) < 0 ? -1 : 1; }
  /** The side the camera looks out over (the broadside's own test), 1 port, -1 starboard. */
  camSide() { const H = this.helm, d = this.game.camera?.getWorldDirection?.(_d); return H && d && d.x * Math.cos(H.yaw) - d.z * Math.sin(H.yaw) < 0 ? -1 : 1; }

  /** Where a mount stands on the hull (world). */
  mountAt(tool, out = new THREE.Vector3()) {
    const L = this.L, B = this.beam;
    if (tool === 'crucibelle') return this.deck.bellAt(out);
    if (tool === 'lockheart') return this.deck.coffinAt(out);
    if (tool === 'sondelass') { const z = L * 0.2; return this.shipPoint(this.camSide() * B * 0.5, this.deckAt(z) + 1.2, z, out); }
    if (tool === 'veritome') { const z = L * 0.36; return this.shipPoint(0, this.deckAt(z) + 2.2, z, out); }
    if (tool === 'soulbrush') { const z = -L * 0.48; return this.shipPoint(0, this.deckAt(z) + 0.6, z, out); }
    return this.shipPoint(0, this.deckAt(0) + 6, 0, out);
  }

  mount(e) {
    if (!this.helm || !e?.tool) return;
    if (e.ok === false) return this.puff(e.tool);
    if (e.tool === 'sondelass') this.harpoon.fired(e);
    else if (e.tool === 'crucibelle') { this.deck.ring(); this.rings.toll(e, this.winding); }
    else if (e.tool === 'lockheart') this.deck.gulp(e);
    else if (e.tool === 'veritome') this.flash.fired(e);
  }
  /** A mount refused: a small dry puff where it stands (the log says why). */
  puff(tool) {
    const fx = this.fx, P = SEA_MOUNTS_LOOK.puff; if (!fx) return;
    const at = this.mountAt(tool, _v).clone();
    if (tool === 'crucibelle') this.deck.ring(0.25); // (the bell knocks dull: no ring goes out)
    for (let i = 0; i < P.n; i++) fx.alpha?.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.8 + Math.random(), (Math.random() - 0.5) * 1.4), life: 0.9, size: 0.35, sizeEnd: 1.1, color: P.color, alpha: 0.5, drag: 2.5, gravity: -0.6, floor: -1e9 });
    for (let i = 0; i < 3; i++) fx.add?.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 3), life: 0.25, size: 0.08, sizeEnd: 0.02, color: P.spark, alpha: 0.7, drag: 2, gravity: 6, floor: -1e9 });
  }

  /** Each frame, after the runtime: every mount's look, then what is winding up remembered for the next frame's toll. */
  draw(fight, dt, live = true) {
    this.fight = fight; this.live = live && !!this.helm; this.t += dt;
    this.deck.update(dt); this.harpoon.update(dt); this.slick.update(dt); this.rings.update(dt); this.flash.update(dt);
    this.winding.clear();
    if (this.live) for (const c of this.serpents?.list || []) if (c.alive && c.attack) this.winding.set(c, (c.head?.() ?? c.pos).clone());
  }
}
