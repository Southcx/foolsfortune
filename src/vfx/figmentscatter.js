// ---------------------------------------------------------------------------------------
// A FIGMENT'S SCATTER: how a Figment (or an Egregore) is undone at its death. In a quarter of a real second the body shows what it was
// made of: it steps twice through a coarser grid (a PS1 vertex snap on that one body, each step a tenth of a real second, inside the
// glitch's band of 6 to 10 steps a real second), shows once as its own wire in the Mind's colour, and pops: a burst of motes of
// Lachryma in its feeling's colour, some sinking into the ground and some rising into the sky. Nothing rolls home and nothing is left:
// it goes back into the ambient Lachryma, to the earth and the aether (the owner, 2026-10-13). The creature's own end (the jelly's
// fountain and pool, its cubes) follows at the pop as it always did.
//
// No program of its own: the snap is done on the CPU into a copy of the body's geometry (drawn by the body's own material, its
// deformer and skin untouched); the wire is that material's `wireframe` (a draw mode, not a program key in three r170), lit in the
// Mind's line colour (vfx/labradorite.js, labSoft at the stone's blue); the motes are the particles' pools (vfx/particles.js). `visual.glitch`
// off: no snap and no wire, the pop alone, at the same moment.
// Only a creature that is a Figment or an Egregore: never a spirit (its smoke is its own), a sibling or ally, Strawman, the folk or the
// Courier (none of those are sent here).
//
// Prior art: Digimon World's death (a Digimon breaks into data and scatters, 1999; DATA-LOOK.md proposal 8, its egg cut by the owner),
// .hack's data bug (the body shown as the polygons it is), and the PS1's own vertex snap (the GTE's integer screen coordinates: the
// jitter every "PSX-style" shader imitates), spent here as a beat rather than a style.
//
//   game.figmentScatter = new FigmentScatter(game)
//   game.figmentScatter.play(c, { min, hide }) -> real seconds until the pop (never under `min`), or null when it does not take `c`
//     (hide: it hides `c.root` itself at the pop; else the caller does, at that moment)
//   game.figmentScatter.motes(pos, color, n)   (the pop's motes alone: vfx/dissolve.js's pieces)
//   snapGeometry(geo, step, offset) -> a copy, its positions on a grid of `step` (m, in the geometry's space)
//   figmentColour(c | pos) -> the colour of its feeling (its own, else the weather's where it falls, else Lachryma's lilac)
//   game.figmentScatter.update(dt)   (the sim clock, as the creatures count their own dying)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { COLOR, weatherAt, placeOf } from '../progress/weather.js';

export const SCATTER = { snap: 0.1, wire: 0.06, steps: [1 / 11, 1 / 6], jitter: 0.35, motes: 34 }; // (a step's length, real s; its grid as a share of the body's size)
const LEAD = 2 * SCATTER.snap + SCATTER.wire; // the snaps and the wire, before the pop (0.26 real s)
const MIND_LINE = new THREE.Color(0x5087fa); // (labSoft at the stone's blue, vfx/labradorite.js: the Mind's line colour)
const LACHRYMA = 0xd9c8ff; // (Lachryma with no feeling: the glyphs' lilac)
const _v = new THREE.Vector3(), _c = new THREE.Color();

/** A copy of `geo` with its positions snapped to a grid of `step`, the grid shifted by `offset` (the jitter). */
export function snapGeometry(geo, step, offset = _v.set(0, 0, 0)) {
  const g = geo.clone(), a = g.attributes.position, p = a.array, s = Math.max(1e-4, step);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = Math.round((p[i] + offset.x) / s) * s - offset.x;
    p[i + 1] = Math.round((p[i + 1] + offset.y) / s) * s - offset.y;
    p[i + 2] = Math.round((p[i + 2] + offset.z) / s) * s - offset.z;
  }
  a.needsUpdate = true; g.computeBoundingSphere();
  return g;
}

/** The colour of a Figment's feeling: its own if it has one, else the weather's where it falls, else Lachryma's lilac. */
export function figmentColour(c) {
  const own = c?.feeling ?? c?.aspect;
  if (own && COLOR[own]) return COLOR[own];
  const pos = c?.isVector3 ? c : c?.pos, pl = pos && placeOf(pos);
  const a = pl ? weatherAt(pl.place).aspect : null;
  return a && COLOR[a] ? COLOR[a] : LACHRYMA;
}

/** Is it a Figment or an Egregore (not a spirit, an ally, a sibling)? */
const isFigment = (c) => !!c && c.type === 'creature' && !c.spirit && !c.friend && !c.ally && c.root;

export class FigmentScatter {
  constructor(game) {
    this.game = game;
    this.jobs = [];
  }

  play(c, { min = 0, hide = false } = {}) {
    if (!isFigment(c) || this.jobs.some((j) => j.c === c)) return null;
    const steps = T.visual?.glitch !== false;
    const at = Math.max(min, steps ? LEAD : 0);
    const bodies = [];
    if (steps) c.root.traverse((o) => { if ((o.isMesh || o.isSkinnedMesh) && !o.isInstancedMesh && o.visible && o.geometry?.attributes?.position) bodies.push({ o, geo: o.geometry, size: sizeOf(o.geometry) }); });
    this.jobs.push({ c, t: 0, at, start: at - (steps ? LEAD : 0), bodies, stage: -1, hide, color: figmentColour(c) });
    return at;
  }

  /** The pop's motes: half sink into the ground, half rise into the sky, in the feeling's colour. */
  motes(pos, color, n = SCATTER.motes) {
    const fx = this.game.fx; if (!fx?.alpha?.emit) return;
    const col = _c.set(color);
    for (let i = 0; i < n; i++) {
      const up = i % 2 === 0, a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.1;
      (i % 3 === 0 ? fx.add : fx.alpha).emit({ // (two in three drawn over (they read on bright sand), one in three a glint)
        pos: pos.clone().add(_v.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.3) * 0.6, (Math.random() - 0.5) * 0.5)),
        vel: new THREE.Vector3(Math.cos(a) * r, up ? 1.4 + Math.random() * 2.2 : -(0.6 + Math.random() * 1.2), Math.sin(a) * r),
        life: up ? 1.3 + Math.random() * 0.8 : 0.7 + Math.random() * 0.5, size: 0.07 + Math.random() * 0.05, sizeEnd: 0.015,
        color: col.clone(), alpha: 0.9, drag: up ? 1.1 : 0.6, gravity: up ? -0.6 : 2.5, floor: -1e9, // (no floor: the sinking ones go into it)
      });
    }
  }

  update(dt) {
    for (let i = this.jobs.length - 1; i >= 0; i--) {
      const J = this.jobs[i]; J.t += dt;
      const k = J.t - J.start, stage = k < 0 ? -1 : k < SCATTER.snap ? 0 : k < 2 * SCATTER.snap ? 1 : 2;
      if (stage !== J.stage && J.t < J.at) { this.stage(J, stage); J.stage = stage; }
      if (J.t >= J.at) { this.pop(J); this.jobs.splice(i, 1); }
    }
  }

  /** Into a stage: 0 and 1 the snaps (the grid coarser each time, its origin jittered), 2 the wire. */
  stage(J, stage) {
    if (stage < 0) return;
    for (const b of J.bodies) {
      if (stage <= 1) {
        const s = b.size * SCATTER.steps[stage], j = s * SCATTER.jitter;
        const g = snapGeometry(b.geo, s, _v.set((Math.random() - 0.5) * j, (Math.random() - 0.5) * j, (Math.random() - 0.5) * j));
        if (b.snap) b.snap.dispose();
        b.snap = g; b.o.geometry = g;
      } else {
        b.mats = (Array.isArray(b.o.material) ? b.o.material : [b.o.material]).map((m) => {
          const keep = { m, wire: m.wireframe, color: m.color?.clone(), emissive: m.emissive?.clone(), ei: m.emissiveIntensity };
          m.wireframe = true; m.color?.setRGB(0, 0, 0); m.emissive?.copy(MIND_LINE); if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 1.6;
          return keep;
        });
      }
    }
  }

  pop(J) {
    for (const b of J.bodies) {
      b.o.geometry = b.geo; b.snap?.dispose();
      for (const k of b.mats || []) { k.m.wireframe = k.wire; if (k.color) k.m.color.copy(k.color); if (k.emissive) k.m.emissive.copy(k.emissive); if (k.ei !== undefined) k.m.emissiveIntensity = k.ei; }
    }
    const c = J.c, at = c.center ? c.center(new THREE.Vector3()) : c.pos.clone().setY(c.pos.y + 0.6);
    if (J.hide) c.root.visible = false;
    this.motes(at, J.color);
  }
}

function sizeOf(geo) {
  if (!geo.boundingBox) geo.computeBoundingBox();
  return geo.boundingBox.getSize(_v).length() || 1;
}
