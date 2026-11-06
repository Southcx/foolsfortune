// ---------------------------------------------------------------------------------------
// THE WILD SPORE PRINTS' LOOK: the game day's wild prints dressed where they grow (docs/plans/MYCELIUM.md 3; the rules Dovina's,
// progress/sporeprints.js; the places and the pickup Petra's, world/sporeprintspots.js, whose `spots` this reads). Looks only: which
// prints stand, where, and what F takes are theirs; this hides each spot's placeholder caps and stands the real find in its `group`.
//
//   THE FIND    a small clump of its strain, drawn by the garden's own fungus looks (vfx/garden/strains.js strainBed: the lichen's
//               rosettes and pixie cups, the koji's bloom, the inkcap's shaggy bells, the oyster's shelves, the witches' butter's
//               folds; its fairy ring round it and its foxfire by night), at a wild clump's size: one program for every strain, the
//               garden's, already built at the warm-up
//   THE PRINT   on the ground beside it, the print it dropped: a disc of radial gill lines from a stem's dot, in the strain's real
//               print colour (the inkcap black, the oyster white-lilac, the witches' butter pale yellow, the koji's olive dust, the
//               lichen's grey-green soredia), as a cap left gill-down on paper leaves one
//   THE HAZE    a faint drift of spores rising off the caps in the print's colour, and now and then a glint on a cap (a four-point
//               star in the foxfire's colour), so it reads as findable from a few strides: a world mark, no words. Both only within
//               HAZE.near of the eye, from the house's particle pools (game.fx)
//
// Prior art: the spore print of field mycology (a cap left gill-down overnight; Coprinus's black, Pleurotus's white-lilac), Stardew
// Valley's forage and Monster Hunter's gathering points (a find told by a glint), the house's rare finds (the ridges' fulgurite hot:
// vfx/dunes/hotfulgurite.js), Hollow Knight's Fungal Wastes (spores in the air).
//
//   game.wildSporePrints = new WildSporePrints(game)   .update(rawDt)   (boot/creatures.js; the marks phase)   HAZE   PRINT_INK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { strainBed, foxfireColour } from './garden/strains.js';
import { phaseAt } from '../progress/weather.js';

/** The clump's radius (m), the print's radius and its offset from the clump's middle, and the haze: how near the eye it shows (m),
 *  spores a real second, a glint every so many real seconds (least, most). */
export const HAZE = { radius: 0.42, print: 0.3, printAt: [0.34, 0.22], near: 45, rate: 3, glint: [1.6, 3.2] };
/** Each strain's print colour (a real spore print's), by its feeling. */
export const PRINT_INK = { wonder: '#b9c4a6', mirth: '#7d8a3c', desire: '#1b1514', grief: '#e4dbea', dread: '#efe0a4' };

const PRINT_MAT = {};
/** A strain's print, painted once: radial gills from a stem's dot, denser toward the rim, the rim softly torn. */
function printMaterial(feeling) {
  if (PRINT_MAT[feeling]) return PRINT_MAT[feeling];
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2, ink = PRINT_INK[feeling] || '#cccccc';
  const halo = g.createRadialGradient(m, m, S * 0.05, m, m, m); halo.addColorStop(0, ink + '55'); halo.addColorStop(0.85, ink + '33'); halo.addColorStop(1, ink + '00');
  g.fillStyle = halo; g.fillRect(0, 0, S, S);
  g.strokeStyle = ink; g.lineCap = 'round';
  let s = 7 + feeling.length; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 120; k++) { // (the gills: a long one, then shorter lamellulae between)
    const a = (k / 120) * Math.PI * 2 + r() * 0.01, r0 = k % 3 === 0 ? 0.1 : k % 3 === 1 ? 0.45 : 0.62, r1 = 0.86 + r() * 0.1;
    g.globalAlpha = 0.5 + r() * 0.35; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(m + Math.cos(a) * m * r0, m + Math.sin(a) * m * r0); g.lineTo(m + Math.cos(a) * m * r1, m + Math.sin(a) * m * r1); g.stroke();
  }
  g.globalAlpha = 1; g.fillStyle = ink; g.beginPath(); g.arc(m, m, S * 0.035, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (PRINT_MAT[feeling] = new THREE.MeshStandardMaterial({ name: 'wild-spore-print', map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
}
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export class WildSporePrints {
  constructor(game) { this.game = game; this.dressed = new Map(); this.t = 0; }

  update(raw = 1 / 60) {
    const g = this.game, spots = g.sporePrintSpots?.spots; if (!spots) return;
    const dt = Math.min(raw, 0.05); this.t += dt;
    for (const [s, D] of this.dressed) if (!spots.includes(s)) { D.bed.dispose(); this.dressed.delete(s); } // (taken, or the area or the floor left: its group is gone)
    if (!spots.length) return;
    const night = g.well?.active ? 1 : (({ night: 1, dusk: 0.45, dawn: 0.45 })[phaseAt()] ?? 0);
    for (const s of spots) {
      let D = this.dressed.get(s);
      if (!D) D = this.dress(s);
      D.bed.set({ night }); D.bed.update(dt);
      this.haze(s, D, dt);
    }
  }

  /** The placeholder hidden, the find stood in its group. */
  dress(s) {
    for (const o of s.group.children) o.visible = false;
    const seed = hash(s.id) % 997, bed = strainBed(s.strain, { radius: HAZE.radius, growth: 1, seed });
    bed.group.rotation.y = (seed / 997) * Math.PI * 2; s.group.add(bed.group);
    const [px, pz] = HAZE.printAt, print = new THREE.Mesh(new THREE.CircleGeometry(HAZE.print, 28).rotateX(-Math.PI / 2), printMaterial(bed.feeling));
    print.position.set(px, 0.025, pz); print.rotation.y = seed; print.renderOrder = 1; print.name = 'wild-spore-print'; s.group.add(print);
    const D = { bed, ink: new THREE.Color(PRINT_INK[bed.feeling] || '#cccccc'), fox: foxfireColour(bed.feeling).clone().multiplyScalar(2.2), next: 0.5 + (seed % 10) / 10, acc: 0 };
    this.dressed.set(s, D);
    return D;
  }

  /** Spores drifting up off the caps, and now and then a glint: only near the eye. */
  haze(s, D, dt) {
    const g = this.game, cam = g.camera, V = g.fx?.vfx; if (!cam || !V) return;
    if (cam.position.distanceToSquared(s.pos) > HAZE.near * HAZE.near) return;
    D.acc += dt * HAZE.rate;
    while (D.acc >= 1) {
      D.acc -= 1; const a = Math.random() * Math.PI * 2, r = Math.random() * HAZE.radius * 0.7;
      V.alpha?.emit({ pos: _v.set(s.pos.x + Math.cos(a) * r, s.pos.y + 0.12 + Math.random() * 0.2, s.pos.z + Math.sin(a) * r), vel: _w.set((Math.random() - 0.5) * 0.06, 0.05 + Math.random() * 0.05, (Math.random() - 0.5) * 0.06),
        life: 2.6 + Math.random(), size: 0.06, sizeEnd: 0.35, color: D.ink, alpha: 0.16, alphaEnd: 0, drag: 0.6, gravity: 0, twinkle: 0, shape: 'soft', floor: -1e9 });
    }
    if ((D.next -= dt) <= 0) {
      D.next = HAZE.glint[0] + Math.random() * (HAZE.glint[1] - HAZE.glint[0]);
      const a = Math.random() * Math.PI * 2, r = Math.random() * HAZE.radius * 0.5;
      V.add?.emit({ pos: _v.set(s.pos.x + Math.cos(a) * r, s.pos.y + 0.18 + Math.random() * 0.15, s.pos.z + Math.sin(a) * r), vel: _w.set(0, 0.02, 0),
        life: 0.45, size: 0.22, sizeEnd: 0.02, color: D.fox, alpha: 1, alphaEnd: 0, drag: 1, gravity: 0, twinkle: 0, shape: 'star4', floor: -1e9 });
    }
  }
}
