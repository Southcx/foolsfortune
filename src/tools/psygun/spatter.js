// ---------------------------------------------------------------------------------------
// SPATTER: liquid clay thrown about. Droplets fly (one instanced mesh, stretched along their speed), land as splats on the world (decals
// that grow rather than stack) and as pools on the floor. Hot (a bomb's molten slip: it scalds clapperjars and cooks pots, and cools from
// orange through terracotta to dark clay) or cold (slip: harmless, and wet enough to dive into, so each lays a disc in game.slip). The
// psygun's bomb and slip shells throw it, and so do a burst barrel, the Soul Brush, the slip jellies and the Lockheart's outcomes, all
// through game.shells (shells.js passes them on). Split out of shells.js (R45's clean-up).
//
//   const S = new Spatter(game)   S.addDroplet(pos, vel, r, slip)   S.addSplat(point, normal, size, slip)   S.addPool(point, normal, slip)
//   (`slip`: false hot, true the Courier's cold spill (their paint, in the brush's feeling), 'crude' anyone else's (a jelly's, a barrel's))
//   S.spill(center, dir, amount)   S.fixedUpdate(dt)   S.update(dt)   S.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { stream, randDir } from '../../core/rng.js';
import { loadAspect } from '../soulbrush/load.js';
import { ASPECT_COLOR } from '../../world/ground/paintmap.js';
const simRand = stream('tools/psygun/spatter'); // (the simulation's chance: core/rng.js, the same twice)

const UP = new THREE.Vector3(0, 1, 0);
const MAX = 400; // (droplets in the air at once: the oldest gives way)
// molten slip: starts glowing orange, cools through terracotta to dark clay
const HOT = new THREE.Color(0xffa25a), GLOW = new THREE.Color(0xe0673a), COOL = new THREE.Color(PALETTE.dark);
// cold spills are Lachryma (LACHRYMA-LOOP.md 0 and 5, rule 7): the Courier's (`slip` true) is their paint, refined in the brush's feeling,
// drying darker; anyone else's (`slip` 'crude': a jelly's, a barrel's) is crude, ink drying to a dull sheen (Calissa's look)
const CRUDE = new THREE.Color(0x0b0910), CRUDE_DRY = new THREE.Color(0x3a3442);

/** A splat of slip: soft circles summed and thresholded (metaballs), so the blobs run together at their edges. */
function blobTexture(seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d', { willReadFrequently: true }); // (a canvas kept on the CPU: read back from the GPU's, getImageData stalled the frame for seconds (R41, the owner's dunes spikes))
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.globalCompositeOperation = 'lighter';
  const ball = (x, y, r) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.5);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
  };
  ball(64, 64, 34);
  for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, r = 24 + rnd() * 30, rr = 5 + rnd() * 14; ball(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, rr); }
  const d = g.getImageData(0, 0, 128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const a = d.data[i] / 255;
    d.data[i + 3] = Math.round(255 * THREE.MathUtils.smoothstep(a, 0.3, 0.7));
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
  }
  g.globalCompositeOperation = 'source-over';
  g.putImageData(d, 0, 0);
  return new THREE.CanvasTexture(c);
}

export class Spatter {
  /** The four splat textures: drawn once the game is idle after boot (or the first time a slip lands, if that is sooner). */
  get blobTex() { return (this._blobTex ||= [0, 1, 2, 3].map(blobTexture)); }

  constructor(game) {
    this.game = game;
    this.droplets = []; this.splats = []; this.pools = [];
    this._blobTex = null; // (made when the game is idle after boot, or on first use: see the getter)
    (window.requestIdleCallback || ((f) => setTimeout(f, 3000)))(() => this.blobTex);
    // instanced droplets
    const dg = new THREE.IcosahedronGeometry(1, 1);
    this.dropMesh = new THREE.InstancedMesh(dg, new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX);
    this.dropMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dropMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    this.dropMesh.count = 0;
    this.dropMesh.frustumCulled = false;
    game.scene.add(this.dropMesh);
  }

  addDroplet(pos, vel, r, slip = false) {
    if (this.droplets.length >= MAX) this.droplets.shift();
    this.droplets.push({ pos, vel, r, age: 0, life: 2.5, slip, wet: slip ? this.wetOf(slip) : null });
  }
  /** A cold spill's colours as it lands and as it dries: the Courier's paint in the brush's feeling, or crude. */
  wetOf(slip) { return slip === 'crude' ? CRUDE : ASPECT_COLOR[loadAspect(this.game)] ?? CRUDE; }
  dryOf(wet) { return wet === CRUDE ? CRUDE_DRY : wet.clone().multiplyScalar(0.5); }

  /** A burst barrel: cold liquid clay slops out (harmless, just messy). */
  spill(center, dir, amount = 1) {
    const g = this.game;
    for (let k = 0; k < 70 * amount; k++) {
      const v = randDir(simRand, new THREE.Vector3());
      v.y = Math.abs(v.y) * 0.8;
      v.multiplyScalar(1.5 + simRand() * 3.5).addScaledVector(dir, 1.5);
      this.addDroplet(center.clone().add(new THREE.Vector3((simRand() - 0.5) * 0.3, (simRand() - 0.3) * 0.4, (simRand() - 0.5) * 0.3)), v, 0.03 + simRand() * 0.05, 'crude');
    }
    const down = g.physics.raycast(center, new THREE.Vector3(0, -1, 0), 3, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (down) this.addPool(down.point, down.normal, 'crude');
    sfx.splosh(g.listenerDistance(center));
  }

  stepDroplets(dt) {
    const g = this.game;
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.age += dt;
      d.vel.y -= T.physics.gravity * dt;
      d.vel.multiplyScalar(Math.exp(-0.4 * dt));
      const step = d.vel.clone().multiplyScalar(dt);
      const len = step.length();
      // (slip passes through the creatures, a burst jelly's own body among them (its capsule stays in the query tree until the next step,
      // and a ray from inside it stops where it starts, with no normal: the splats that stood on end in mid-air))
      const hit = len > 1e-5 ? g.physics.raycast(d.pos, step.clone().divideScalar(len), len + d.r, g.player.collider, undefined, (c) => !c.isSensor() && c.isEnabled() && !(d.slip && g.physics.entityOf(c)?.type === 'creature')) : null;
      if (hit || d.age > d.life) {
        if (hit) {
          const ent = hit.entity;
          // (a splat is laid only on the world: fixed ground and walls, with a real normal; never on a body that moves)
          const body = hit.collider.parent();
          if ((!body || body.isFixed()) && hit.normal.lengthSq() > 0.5 && hit.distance > 1e-4) this.addSplat(hit.point, hit.normal, d.r * (6 + simRand() * 5), d.slip);
          if (!d.slip && ent?.type === 'breakable') g.breakables.damage(ent, T.shells.bomb.dropletDamage, hit.point, d.vel.clone().normalize(), 0.5);
          if (!d.slip && ent?.type === 'clapper') g.clappers.scald(ent, 0.4);
          // splash: sometimes spit two smaller droplets
          if (d.r > 0.035 && simRand() < 0.35) {
            for (let k = 0; k < 2; k++) {
              const v = d.vel.clone().reflect(hit.normal).multiplyScalar(0.3).add(randDir(simRand, new THREE.Vector3()).multiplyScalar(1.2));
              this.addDroplet(hit.point.clone().addScaledVector(hit.normal, 0.03), v, d.r * 0.5, d.slip);
            }
          }
        }
        this.droplets.splice(i, 1);
        continue;
      }
      d.pos.add(step);
    }
  }

  addSplat(point, normal, size, slip = false) {
    const g = this.game;
    // don't stack decals on decals: grow a nearby one a little instead
    for (let i = this.splats.length - 1; i >= Math.max(0, this.splats.length - 60); i--) {
      const o = this.splats[i];
      if (o.m.position.distanceToSquared(point) < (size * 0.35) ** 2) {
        if ((o.grown = (o.grown || 0) + 1) < 12) o.m.scale.multiplyScalar(1.04);
        o.age = Math.min(o.age, o.life * 0.3); // fresh slip keeps it wet
        return;
      }
    }
    const wet = slip ? this.wetOf(slip) : null;
    const mat = new THREE.MeshBasicMaterial({ map: this.blobTex[Math.floor(simRand() * 4)], color: (slip ? wet : HOT).clone(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const m = new THREE.Mesh(g.fx.decalGeo, mat);
    m.position.copy(point).addScaledVector(normal, 0.004 + (this.splats.length % 16) * 0.0004);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    m.rotateZ(simRand() * Math.PI * 2);
    m.scale.setScalar(size / 0.16);
    g.scene.add(m);
    const life = T.shells.bomb.splatLife * (0.8 + simRand() * 0.4);
    this.splats.push({ m, age: 0, life, slip, wet, dry: wet && this.dryOf(wet) });
    if (slip) g.slip?.addDisc(point, normal, size * 0.45, Math.min(life * 0.6, T.tech.slip.coverLife), 0, slip === 'crude' ? 'creature' : 'courier'); // wet enough to dive into, for a while (crude is a slick on the ground, the Courier's slip their paint)
    if (this.splats.length > 220) { const s = this.splats.shift(); g.scene.remove(s.m); s.m.material.dispose(); }
  }

  addPool(point, normal, slip = false) {
    const g = this.game, B = T.shells.bomb;
    const wet = slip ? this.wetOf(slip) : null;
    const mat = new THREE.MeshBasicMaterial({ map: this.blobTex[slip ? 2 : 0], color: (slip ? wet : HOT).clone(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.copy(point).addScaledVector(normal, 0.01);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    m.scale.setScalar(B.poolRadius * 2.2);
    m.renderOrder = 1;
    g.scene.add(m);
    this.pools.push({ m, pos: point.clone(), age: 0, life: B.poolLife, r: B.poolRadius * (slip ? 0.8 : 1), slip, wet, dry: wet && this.dryOf(wet) });
    if (slip) g.slip?.addDisc(point, normal, B.poolRadius * 0.8, Math.min(B.poolLife * 0.7, T.tech.slip.coverLife), 0, slip === 'crude' ? 'creature' : 'courier');
  }

  stepPools(dt) {
    const g = this.game, B = T.shells.bomb;
    for (let i = this.pools.length - 1; i >= 0; i--) {
      const p = this.pools[i];
      p.age += dt;
      const heat = 1 - p.age / p.life;
      if (heat <= 0) { g.scene.remove(p.m); p.m.material.dispose(); this.pools.splice(i, 1); continue; }
      const r = p.r * (0.55 + 0.45 * heat);
      if (p.slip) continue; // cold slip: just a mess
      // hot floor: scalds critters, slowly cooks pots sitting in it
      for (const c of g.clappers.list) if (c.alive && Math.abs(c.pos.y - p.pos.y) < 0.4 && c.pos.distanceTo(p.pos) < r) g.clappers.scald(c, dt * heat);
      for (const ent of g.breakables.items) {
        const t = ent.body.translation();
        if (Math.abs(t.y - p.pos.y) < 0.3 && Math.hypot(t.x - p.pos.x, t.z - p.pos.z) < r) g.breakables.damage(ent, B.poolDps * heat * dt, new THREE.Vector3(t.x, t.y + 0.1, t.z), UP, 0.3, true);
      }
      if (simRand() < heat * 0.5) {
        const a = simRand() * Math.PI * 2, rr = simRand() * r * 0.8;
        g.fx.alpha.emit({ pos: p.pos.clone().add(new THREE.Vector3(Math.cos(a) * rr, 0.05, Math.sin(a) * rr)), vel: new THREE.Vector3(0, 0.6, 0), life: 1.2, size: 0.12, sizeEnd: 0.5, color: new THREE.Color(PALETTE.pale), alpha: 0.2 * heat, drag: 1 });
      }
    }
  }

  fixedUpdate(dt) { this.stepDroplets(dt); this.stepPools(dt); }

  /** Draw: droplets stretched along their speed, splats and pools cooling and fading. */
  update(dt) {
    const g = this.game, now = performance.now() * 0.001;
    // droplets: stretched along velocity, cooling from white-hot to clay
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
    this.droplets.forEach((d, i) => {
      const sp = d.vel.length();
      q.setFromUnitVectors(UP, sp > 1e-3 ? d.vel.clone().divideScalar(sp) : UP);
      const st = 1 + Math.min(2.5, sp * 0.18);
      sc.set(d.r / Math.sqrt(st), d.r * st, d.r / Math.sqrt(st));
      mtx.compose(d.pos, q, sc);
      this.dropMesh.setMatrixAt(i, mtx);
      if (d.slip) col.copy(d.wet); else col.copy(HOT).lerp(GLOW, Math.min(1, d.age / 1.2));
      this.dropMesh.setColorAt(i, col);
    });
    this.dropMesh.count = this.droplets.length;
    this.dropMesh.instanceMatrix.needsUpdate = true;
    if (this.dropMesh.instanceColor) this.dropMesh.instanceColor.needsUpdate = true;
    // splats + pool cool down and fade away
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i];
      s.age += dt;
      const t = s.age / s.life;
      if (t >= 1) { g.scene.remove(s.m); s.m.material.dispose(); this.splats.splice(i, 1); continue; }
      if (s.slip) s.m.material.color.copy(s.wet).lerp(s.dry, THREE.MathUtils.smoothstep(t, 0.1, 0.7));
      else s.m.material.color.copy(HOT).lerp(GLOW, Math.min(1, t * 4)).lerp(COOL, THREE.MathUtils.smoothstep(t, 0.15, 0.6));
      s.m.material.opacity = 1 - THREE.MathUtils.smoothstep(t, 0.7, 1);
    }
    for (const p of this.pools) {
      const t = p.age / p.life;
      if (p.slip) p.m.material.color.copy(p.wet).lerp(p.dry, THREE.MathUtils.smoothstep(t, 0.2, 0.8));
      else p.m.material.color.copy(HOT).lerp(GLOW, Math.min(1, t * 3)).lerp(COOL, THREE.MathUtils.smoothstep(t, 0.3, 0.85));
      p.m.material.opacity = (1 - THREE.MathUtils.smoothstep(t, 0.75, 1)) * (0.85 + 0.15 * Math.sin(now * 5));
      p.m.scale.setScalar(p.r * 2.2 * (0.6 + 0.4 * (1 - t)));
    }
  }

  clear() {
    const g = this.game;
    for (const s of this.splats) g.scene.remove(s.m);
    for (const p of this.pools) g.scene.remove(p.m);
    this.splats = []; this.pools = []; this.droplets = [];
  }
}
