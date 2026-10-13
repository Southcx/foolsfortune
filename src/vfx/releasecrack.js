// ---------------------------------------------------------------------------------------
// A RELEASE'S CRACK: the vessel cracking from the inside out (the owner, 2026-10-13: "an open cup when putting things in, but a
// pressurized vessel when taking things out"; docs/plans/SPINE.md 4). A tier IV caster shell's toll, the Lockheart's Prismatic Overload
// and the god hand's epic miracles pull more Lachryma through the stones than their aperture lets out; courier/vessel/damage.js
// `release()` cracks the clay for it and emits `vessel.release { amount, units, why, by }` once (after a `vessel.crack` a unit). This is
// its look, in three beats:
//
//   PRESSURE  0.00 .. 0.25 real s   light pushing out at the apertures (the mask's eyes and mouth, the hands, the joints' seams) in the
//                                   Lachryma's own oil film (vfx/oxidation.js featTint), the skin's Lachryma brightening, and the
//                                   cracked region's clay bulging a hair (its bones scaled); the region's crack mark held back
//   BREAK     0.25 .. 0.85          cracks running out across the region from inside, forking once or twice, a white-hot core in an
//                                   edge of the source's tint, over-bright as they grow so the glow takes them (two skinned ribbons on
//                                   the body's own skeleton: vfx/crackskin.js), the glaze lifting off them in flakes thrown outward, vapour venting
//                                   from the lines, the region's crack mark (courier/vessel/kintsugi.js uDmg) opening with them
//   SETTLE    0.85 .. 2.4           the bright lines cool to the lacquer's dark and go, leaving the vessel's own crack mark to mend
//
// Scaled by `units` (more lines, more flakes, a stronger push). Tinted by its source: the Overload prismatic (the film walked quickly),
// a shell its family's colour (vfx/shelllooks.js SHELL_FAMILY_TINT; `e.family` when the payload carries it, else the Caster's own),
// an epic miracle its domain's glaze (ui/domainlook.js DOMAIN_LOOK; `e.domain`, else Manifestation's). Never data corruption: the
// Courier is clay, and only clay breaks this way. Data draining never hurts the Courier.
//
// No program of its own: the lines are crackMat's (a clone, its colour a uniform: the Pneuka Jar's skinned crack, warmed at boot), the
// flakes the crackle break's unlit instanced shards' (vfx/crackbreak.js), the light and vapour the shared particle pools (game.fx).
//
// Prior art: Okami's brush cracks (Celestial Brush strokes splitting a surface along a line drawn from within), kintsugi (the line
// is the record of the break), Hollow Knight's Shade cracks (the vessel's shell split with void light leaking through the seams),
// and Dark Souls' crack-and-flake (Havel's and the stone knights' armour flaking off where the blow opened it).
//
//   const rc = new ReleaseCrack(game)   rc.update(rawDt)   (listens for vessel.crack and vessel.release by name)   rc.play(e)   .active
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../core/config.js';
import { featTint } from './oxidation.js';
import { SHELL_FAMILY_TINT } from './shelllooks.js';
import { DOMAIN_LOOK } from '../ui/domainlook.js';
import { crackMat } from '../world/props/potcracks.js';
import { crackRibbon } from './crackskin.js';
import { stream, randDir } from '../core/rng.js';
const rng = stream('vfx/releasecrack'); // (its chance from the game's seed: core/rng.js)

const PRESS = 0.25, BREAK = 0.6, SETTLE = 1.55;   // (real seconds of each beat)
const FLAKES = 64, GRAV = 9.8;
const REGION_BONES = [['head'], ['spine003', 'spine002'], ['upper_armL', 'forearmL'], ['upper_armR', 'forearmR'], ['thighL', 'shinL'], ['thighR', 'shinR']];
// (the apertures: where the light pushes out; a bone and an offset in the Courier's facing frame: right, up, forward, metres)
const APERTURES = [['head', 0.034, 0.075, 0.1], ['head', -0.034, 0.075, 0.1], ['head', 0, 0.02, 0.105],
  ['handL', 0, 0, 0], ['handR', 0, 0, 0], ['forearmL', 0, 0, 0], ['forearmR', 0, 0, 0], ['upper_armL', 0, 0, 0], ['upper_armR', 0, 0, 0],
  ['shinL', 0, 0, 0], ['shinR', 0, 0, 0], ['thighL', 0, 0, 0], ['thighR', 0, 0, 0], ['neck', 0, 0, 0]];
const LACQUER = new THREE.Color(PALETTE.outline), WHITE = new THREE.Color(1, 1, 1);
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _e = new THREE.Euler();
const _c = new THREE.Color(), _c2 = new THREE.Color(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0);

/** Its source's colour (null: the film alone). */
function sourceTint(e) {
  if (e.why === 'overload') return null; // (prismatic: the film walked round quickly)
  if (e.why === 'shell' || e.why === 'toll') return new THREE.Color(SHELL_FAMILY_TINT[e.family] ?? SHELL_FAMILY_TINT.will);
  if (e.why === 'epic') return new THREE.Color(DOMAIN_LOOK[e.domain]?.colours?.body ?? DOMAIN_LOOK.manifestation?.colours?.body ?? 0xffffff);
  return null;
}

export class ReleaseCrack {
  constructor(game) {
    this.game = game; this.run = null; this.made = false;
    this.seen = new Float32Array(6); this.cracked = []; this.crackT = -9;
    this.verts = new Map(); // (mesh -> region -> vertex indices, read once)
    const E = game.events;
    E?.on('vessel.crack', (e) => { const r = ['mask', 'torso', 'armL', 'armR', 'legL', 'legR'].indexOf(e.region); if (r < 0) return; if (E.time !== this.crackT) this.cracked = []; this.crackT = E.time; this.cracked.push(r); });
    E?.on('vessel.release', (e) => this.play(e));
  }
  get active() { return !!this.run; }

  make() {
    if (this.made) return; this.made = true;
    this.lineMat = crackMat.clone(); // (the same program as the Pneuka Jar's skinned crack: only the colour moves; the edge, in the source's tint)
    this.coreMat = crackMat.clone(); this.coreMat.polygonOffsetFactor = this.coreMat.polygonOffsetUnits = -4; // (the white-hot core, drawn over the edge)
    this.flakes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ name: 'releasecrack-flakes', fog: false, toneMapped: false }), FLAKES);
    this.flakes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(FLAKES * 3), 3);
    this.flakes.frustumCulled = false; this.flakes.visible = false; this.flakes.userData.zoneFree = true;
    this.game.scene?.add(this.flakes);
  }

  /** The clay meshes a crack may run over (the armour, its trim and the mask), each with its vertices by region. */
  bodies() {
    const ch = this.game.character, out = []; if (!ch?.model) return out;
    ch.model.traverse((o) => {
      if (!o.isSkinnedMesh || !o.geometry.attributes.aRegion || !(o.parent?.name === 'Courier_Armor' || o.name === 'Courier_Mask')) return;
      if (!this.verts.has(o)) {
        const a = o.geometry.attributes.aRegion, by = [[], [], [], [], [], []];
        for (let i = 0; i < a.count; i++) by[Math.round(a.getX(i))]?.push(i);
        this.verts.set(o, by.map((l) => Int32Array.from(l)));
      }
      out.push(o);
    });
    return out;
  }

  /** Crack paths over a region of `o`, from inside out: seeds in the region, each a jagged walk across its vertices, branching once.
   *  Returned as segments in the order they open (step by step across every line at once), each { pts: [a, b], depth }. */
  paths(o, region, n) {
    const L = this.verts.get(o)?.[region]; if (!L || L.length < 8) return [];
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
    const pt = (i) => {
      const p = new THREE.Vector3().fromBufferAttribute(P, i), nn = N ? new THREE.Vector3().fromBufferAttribute(N, i) : new THREE.Vector3(0, 0, 1);
      return { i, p: p.addScaledVector(nn, 0.004), n: nn, si: [0, 1, 2, 3].map((k) => SI.getComponent(i, k)), sw: [0, 1, 2, 3].map((k) => SW.getComponent(i, k)) };
    };
    const nearest = (at, not) => {
      let b = -1, bd = Infinity;
      for (let k = 0; k < L.length; k++) { const i = L[k]; if (i === not) continue; const d = _p.fromBufferAttribute(P, i).distanceToSquared(at); if (d < bd) { bd = d; b = i; } }
      return b;
    };
    const segs = [];
    const walk = (start, dir, steps, depth, d0) => {
      let cur = start, h = dir.clone();
      for (let s = 0; s < steps; s++) {
        const n0 = cur.n;
        h.addScaledVector(n0, -h.dot(n0)).normalize(); // (along the surface)
        h.applyAxisAngle(n0, (rng() - 0.5) * 1.2).normalize(); // (jagged)
        const step = 0.028 + rng() * 0.012;
        const nx = nearest(_s.copy(cur.p).addScaledVector(h, step), cur.i);
        if (nx < 0) break;
        const next = pt(nx);
        if (next.p.distanceTo(cur.p) < 0.004) break;
        segs.push({ pts: [cur, next], depth: d0 + s });
        if (depth < 1 && (s === 1 || (s === 3 && rng() < 0.6))) walk(next, h.clone().applyAxisAngle(n0, rng() < 0.5 ? 0.8 : -0.8), Math.max(2, steps - s - 1), depth + 1, d0 + s + 1); // (a main line forks once or twice)
        cur = next;
      }
    };
    for (let k = 0; k < n; k++) {
      const seed = pt(L[Math.floor(rng() * L.length)]);
      const a = randDir(rng, new THREE.Vector3());
      walk(seed, a, 6 + Math.floor(rng() * 3), 0, 0);
      walk(seed, a.clone().negate(), 3 + Math.floor(rng() * 3), 0, 0); // (both ways from the seed: it opened in the middle)
    }
    return segs.sort((x, y) => x.depth - y.depth);
  }

  play(e = {}) {
    const g = this.game, ch = g.character; if (!ch?.bones) return;
    this.stop(); this.make();
    const units = Math.max(1, Math.round(e.units || 1));
    let regions = g.events && g.events.time - this.crackT < 0.05 ? [...new Set(this.cracked)] : [];
    if (!regions.length) regions = [1];
    const hold = regions.map((r) => this.seen[r]);
    // the skin's Lachryma (the light inside), kept to be given back
    const skin = ch.regionMats?.skin, rest = skin?.emissive ? { c: skin.emissive.clone(), k: skin.emissiveIntensity } : null;
    this.run = { e, units, regions, hold, tint: sourceTint(e), prism: e.why === 'overload', t: 0, broke: false, lines: [], vents: [], flakes: [], skin, rest, scaled: new Map(), phase: rng() };
  }

  /** The cracks open: the lines laid, the flakes thrown, the vents set. */
  breakOpen(R) {
    const g = this.game, bodies = this.bodies();
    const perRegion = Math.max(2, Math.round((2 + 2 * R.units) / Math.sqrt(R.regions.length)));
    for (const r of R.regions) {
      // (the body holding most of the region: the armour for the torso and limbs, the mask for the mask)
      let o = null, most = 0;
      for (const b of bodies) { const c = this.verts.get(b)?.[r]?.length || 0; if (c > most) { most = c; o = b; } }
      if (!o) continue;
      const segs = this.paths(o, r, perRegion);
      if (!segs.length) continue;
      for (const [mat, w, ro] of [[this.lineMat, 0.034 + 0.008 * R.units, 3], [this.coreMat, 0.012 + 0.003 * R.units, 4]]) {
        const mesh = crackRibbon(o, segs.map((s) => s.pts), w, mat); // (about 3x a blow's crack: it must read at 480 lines from 5 m)
        mesh.renderOrder = ro; mesh.userData.zoneFree = true;
        mesh.geometry.setDrawRange(0, 0);
        R.lines.push({ mesh, n: segs.length, o, segs });
      }
      // the vents and the flakes: from points along the lines, as the body is posed now
      const centre = (g.character.bones[REGION_BONES[r][0]] || g.character.bones.spine)?.getWorldPosition(new THREE.Vector3()) || new THREE.Vector3();
      for (let k = 0; k < segs.length; k += 2) {
        const v = segs[k].pts[1].i;
        R.vents.push({ o, i: v, centre: REGION_BONES[r][0], at: segs[k].depth / Math.max(1, segs[segs.length - 1].depth) });
      }
      o.updateMatrixWorld();
      const share = Math.round((FLAKES * Math.min(1, 0.45 + 0.3 * R.units)) / R.regions.length);
      for (let k = 0; k < share && R.flakes.length < FLAKES; k++) {
        const s = segs[Math.floor(rng() * segs.length)], i = s.pts[1].i;
        const at = o.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(o.matrixWorld);
        const out = at.clone().sub(centre); out.y *= 0.4; if (out.lengthSq() < 1e-6) out.set(0, 0, 1); out.normalize();
        const v = out.multiplyScalar(1.6 + 1.8 * rng() * (0.7 + 0.3 * R.units)).add(_p.set(0, 0.9 + rng(), 0));
        R.flakes.push({ at, v, spin: randDir(rng, new THREE.Vector3()).multiplyScalar(12), turn: new THREE.Euler(rng() * 6, rng() * 6, 0),
          size: 0.018 + 0.02 * rng(), delay: (s.depth / Math.max(1, segs[segs.length - 1].depth)) * BREAK * 0.7, life: 0.7 + 0.4 * rng() });
      }
    }
    // the glaze's colour on the flakes (the region's glaze, lifted toward the light on their undersides: a few of them are the light)
    const glaze = new THREE.Color(g.vessel?.glaze?.(g.vessel.look?.body)?.color ?? PALETTE.pale);
    R.flakes.forEach((f, k) => this.flakes.setColorAt(k, k % 5 === 0 ? this.lightOf(R, k / FLAKES, _c2) : _c.copy(glaze).lerp(WHITE, 0.15 * rng())));
    if (this.flakes.instanceColor) this.flakes.instanceColor.needsUpdate = true;
    this.flakes.count = R.flakes.length; this.flakes.visible = R.flakes.length > 0;
  }

  /** The release's light at t: the film's hue shift (quick for the Overload's prismatic), laid over its source's tint. */
  lightOf(R, t, out) {
    featTint(R.phase + t * (R.prism ? 2.5 : 0.6), out, { bright: 1.4 });
    if (R.tint) out.lerp(_c.copy(R.tint).multiplyScalar(1.3), 0.55);
    return out;
  }

  /** The bones of the cracked regions, bulged by k (0 none). */
  bulge(R, k) {
    const ch = this.game.character;
    for (const r of R.regions) {
      const b = ch.bones[REGION_BONES[r][0]]; if (!b) continue;
      if (r === 0 && ch.fpMode) continue; // (the first person hides the head by its scale: character.js)
      if (!R.scaled.has(b)) R.scaled.set(b, b.scale.clone());
      b.scale.copy(R.scaled.get(b)).multiplyScalar(1 + k * (0.03 + 0.015 * R.units));
    }
  }

  update(raw) {
    const g = this.game, D = g.vesselDamage, U = g.vessel?.kinU;
    const R = this.run;
    if (R) this.step(R, raw, U);
    if (D?.crack) this.seen.set(D.crack); // (the cracks as they were drawn: a release's are held back from here)
  }

  step(R, raw, U) {
    const g = this.game, ch = g.character, fx = g.fx;
    R.t += raw;
    const t = R.t;
    // the crack mark: held during the pressure, opening with the lines
    if (U?.uDmg) R.regions.forEach((r, k) => {
      const now = g.vesselDamage?.crack?.[r] ?? U.uDmg.value[r], x = THREE.MathUtils.clamp((t - PRESS) / BREAK, 0, 1);
      U.uDmg.value[r] = R.hold[k] + (now - R.hold[k]) * x;
    });
    if (t < PRESS) {
      // PRESSURE: light at the apertures, the skin brightening, the clay bulging a hair
      const x = t / PRESS;
      this.bulge(R, Math.sin(x * Math.PI * 0.5));
      if (R.skin && R.rest) { this.lightOf(R, x, _c); R.skin.emissive.copy(R.rest.c).lerp(_c, 0.8 * x); R.skin.emissiveIntensity = R.rest.k + (0.9 + 0.5 * R.units) * x; }
      if (fx?.add && ch?.root) {
        ch.root.getWorldDirection(_f); _f.y = 0; _f.normalize(); _r.crossVectors(_f, _u).negate(); // (their facing frame: forward, right)
        const per = raw * 60 * (0.6 + 0.4 * R.units);
        for (const [bn, rx, uy, fz] of APERTURES) {
          const b = ch.bones[bn]; if (!b || rng() > per) continue;
          b.getWorldPosition(_p).addScaledVector(_r, rx).addScaledVector(_u, uy).addScaledVector(_f, fz);
          const out = _s.copy(_f).multiplyScalar(fz ? 0.6 : 0).add(randDir(rng, _s.clone()).multiplyScalar(0.35));
          fx.add.emit({ pos: _p.clone(), vel: out.clone(), life: 0.22 + 0.1 * rng(), size: (bn === 'head' ? 0.05 : 0.07) * (0.8 + 0.3 * x * R.units), sizeEnd: 0.16 * (0.7 + 0.3 * R.units),
            color: this.lightOf(R, x + rng() * 0.2, new THREE.Color()), alpha: 0.55 + 0.4 * x, drag: 3, gravity: 0 });
        }
      }
      return;
    }
    if (!R.broke) {
      R.broke = true;
      this.bulge(R, 0); // (the push gives: the clay back to its size as it splits)
      for (const [b, s] of R.scaled) b.scale.copy(s);
      R.scaled.clear();
      this.breakOpen(R);
    }
    const tb = t - PRESS, x = THREE.MathUtils.clamp(tb / BREAK, 0, 1);
    // the skin's light gives back as it vents
    if (R.skin && R.rest) { const k = Math.max(0, 1 - tb / 0.5); this.lightOf(R, 1, _c); R.skin.emissive.copy(R.rest.c).lerp(_c, 0.8 * k); R.skin.emissiveIntensity = R.rest.k + (0.9 + 0.5 * R.units) * k; }
    // the lines: running out (their segments in the order they open), bright, then cooling to the lacquer
    const cool = THREE.MathUtils.clamp((tb - BREAK * 0.6) / (SETTLE * 0.7), 0, 1);
    // (white-hot at the core going into the source's tint at the edge; over-bright while they grow, so the glow takes them: render/glow.js)
    const hot = 1 + 2.2 * (1 - x) + 0.6 * (1 - cool);
    this.lightOf(R, 0.5 + tb * 0.3, _c).multiplyScalar(1.3 * hot * (1 - cool) + 0.15);
    this.lineMat.color.copy(_c).lerp(LACQUER, cool * cool);
    this.coreMat.color.copy(WHITE).lerp(_c2.setRGB(1, 0.92, 0.8), 0.3).multiplyScalar(1.4 * hot * (1 - cool) + 0.1).lerp(LACQUER, cool * cool);
    const grow = Math.min(1, x * 1.25);
    for (const L of R.lines) {
      const was = L.shown || 0, now = Math.ceil(L.n * grow); L.shown = now;
      L.mesh.geometry.setDrawRange(0, 6 * now);
      // (the glow as each line runs: a bloom of light at its growing tips)
      if (L.mesh.material === this.coreMat && g.fx?.add) for (let k = was; k < now; k++) {
        const at = L.o.getVertexPosition(L.segs[k].pts[1].i, new THREE.Vector3()).applyMatrix4(L.o.matrixWorld);
        g.fx.add.emit({ pos: at, vel: randDir(rng, _s).multiplyScalar(0.15).clone(), life: 0.35, size: 0.09 + 0.03 * R.units, sizeEnd: 0.02, color: this.lightOf(R, k / L.n, new THREE.Color()).lerp(WHITE, 0.4), alpha: 0.85, drag: 3, gravity: 0 });
      }
    }
    // the vapour: venting from the lines as they open, thinning as they cool
    if (g.fx?.alpha && tb < BREAK + SETTLE * 0.6) {
      const vent = (1 - cool) * raw * 30 * (0.6 + 0.4 * R.units);
      for (const v of R.vents) {
        if (v.at > x * 1.25 || rng() > vent / Math.max(1, R.vents.length / 6)) continue;
        const at = v.o.getVertexPosition(v.i, new THREE.Vector3()).applyMatrix4(v.o.matrixWorld);
        const c = ch.bones[v.centre]?.getWorldPosition(_p) || at;
        const out = at.clone().sub(c); out.y = Math.max(0, out.y) * 0.3; out.normalize().multiplyScalar(0.5 + 0.4 * rng()).add(_s.set(0, 0.7, 0));
        g.fx.alpha.emit({ pos: at, vel: out, life: 0.7 + 0.5 * rng(), size: 0.04, sizeEnd: 0.22 + 0.06 * R.units, color: _c2.setHex(PALETTE.pale).lerp(this.lightOf(R, rng(), _c), 0.25).clone(), alpha: 0.32, drag: 2.2, gravity: -0.4 });
        if (rng() < 0.35 && g.fx.add) g.fx.add.emit({ pos: at, vel: out.clone().multiplyScalar(1.4), life: 0.25, size: 0.03, sizeEnd: 0.005, color: this.lightOf(R, rng(), new THREE.Color()), alpha: 0.9, drag: 2, gravity: 0 });
      }
    }
    // the flakes: the glaze lifting off, out from the lines, spinning, falling
    let live = 0;
    R.flakes.forEach((f, i) => {
      const ft = tb - f.delay;
      let sz = 0;
      if (ft > 0 && ft < f.life) {
        f.at.addScaledVector(f.v, raw); f.v.y -= GRAV * raw;
        f.turn.x += f.spin.x * raw; f.turn.y += f.spin.y * raw;
        sz = f.size * (1 - Math.pow(ft / f.life, 2)); live++;
      } else if (ft <= 0) live++;
      this.flakes.setMatrixAt(i, _m.compose(f.at, _q.setFromEuler(_e.copy(f.turn)), _s.set(sz, sz * 0.8, sz * 0.14)));
    });
    this.flakes.instanceMatrix.needsUpdate = true;
    if (!live) this.flakes.visible = false;
    if (tb > BREAK + SETTLE) this.stop();
  }

  stop() {
    const R = this.run; if (!R) return;
    for (const [b, s] of R.scaled) b.scale.copy(s);
    if (R.skin && R.rest) { R.skin.emissive.copy(R.rest.c); R.skin.emissiveIntensity = R.rest.k; }
    for (const L of R.lines) { L.mesh.removeFromParent(); L.mesh.geometry.dispose(); }
    if (this.flakes) this.flakes.visible = false;
    this.run = null;
  }
}
