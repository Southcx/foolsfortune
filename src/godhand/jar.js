// ---------------------------------------------------------------------------------------
// THE GOD HAND'S JAR: the Pneuka Jar the Courier becomes while the hand is out (godhand/godhand.js). It stands where the Courier stood and
// can be hurt: a raider's clap, a lobber's ball, a blast, whatever the hand throws at it. Each blow cracks it from the side it came from
// (ribbons raycast over its body: world/props/potcracks.js); mended, the cracks it no longer needs turn to gold; at zero it shatters,
// and a few seconds later it reforges, its old cracks all gold seams (kintsugi: the scars are the record). Its core glows with how whole
// it is. Split out of godhand.js (R45's clean-up); god.jar is this, and its fields (pos, hp, max, alive, mendBy) are what the raids, the
// clapperjars and the catch read. Its look is the owner's painting (vfx/vessoulpaint.js); it moves by its own clips (godhand/pneukajarclips.js,
// `jar.clips`), which own its squash and its scale; its cracks are skinned to it, so they ride the clips (vfx/crackskin.js).
//
//   god.jar = new GodJar(god, gltf)   .hit(amount, from, kind)   .raidStrike(c)   .explosion(center, R)   .mend(amount)   .update(dt)   .clips
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { addOutline } from '../render/outline.js';
import { sfx } from '../audio/sfx.js';
import { crackMat, goldMat } from '../world/props/potcracks.js';
import { pneukaJarPainting, paintFlash } from '../vfx/vessoulpaint.js';
import { crackPointOn, crackRibbon } from '../vfx/crackskin.js';
import { PneukaJarClips } from './pneukajarclips.js';
import { stream } from '../core/rng.js';
const simRand = stream('godhand/jar'); // (the simulation's chance: core/rng.js, the same twice)

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();

export class GodJar {
  constructor(M, gltf) {
    this.M = M;
    this.pos = new THREE.Vector3(); this.hp = T.god.jarHp; this.max = T.god.jarHp; this.alive = true; this.mendBy = null;
    this.scars = 0; this.reforgeT = 0; this.flash = 0; this.cracks = { dark: [], gold: [] };
    this.build(gltf);
  }

  build(gltf) {
    const V = this;
    const group = new THREE.Group();
    group.name = 'PneukaJar';
    const model = gltf.scene;
    group.add(model);
    this.jarMat = pneukaJarPainting(); // (the owner's painting: vfx/vessoulpaint.js)
    this.coreMat = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.4, emissive: PALETTE.glow, emissiveIntensity: 0.6 });
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      const core = o.material.name === 'CourierEnergy';
      o.material = core ? this.coreMat : this.jarMat;
      o.castShadow = true; o.receiveShadow = true;
      if (!core) { addOutline(o); this.jarBody = o; }
    }
    group.visible = false;
    this.M.game.scene.add(group);
    V.group = group;
    this.clips = new PneukaJarClips(this, gltf); // (its own clips own its squash and its scale: godhand/pneukajarclips.js)
    // a halo that shows how whole it is (on the root bone: it rises and shrinks with the Jar's summon and dismiss)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.M.game.fx.haloTexture, color: PALETTE.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.4 }));
    halo.scale.setScalar(2.4);
    halo.position.y = 0.7;
    (this.clips.rootBone || group).add(halo);
    this.halo = halo;
    this.raycaster = new THREE.Raycaster();
  }

  /** A blow to the jar: from the side it came from (a flat direction), by how much, of what kind (raid | blast | ball | thrown). */
  hit(amount, from, kind = 'raid') {
    const V = this;
    if (!V.alive || this.M.state !== 'on') return;
    V.hp = Math.max(0, V.hp - amount);
    V.flash = 1;
    this.M.cam.shake = Math.max(this.M.cam.shake, 0.5);
    this.addCrack(from, amount);
    sfx.jarHit(Math.min(1.5, amount / 10));
    this.M.game.fx.impact?.(V.pos.clone().setY(V.pos.y + 0.7), UP, { sparks: 10, dust: 8 });
    this.M.game.events?.emit('jar.hit', { kind, amount });
    if (V.hp <= 0) this.shatter();
  }

  /** A raider reaches it: it claps, breaks on the jar, and the jar takes the blow. */
  raidStrike(c) {
    const V = this, g = this.M.game;
    const dir = _v.set(c.pos.x - V.pos.x, 0, c.pos.z - V.pos.z).normalize().clone();
    sfx.clap(g.listenerDistance(c.pos));
    g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.4), dir.clone().negate(), 1.2, 'shot');
    c.raider = false;
    this.hit(T.god.raidDamage, dir, 'raid');
  }

  /** A blast nearby: the nearer, the harder. */
  explosion(center, R) {
    const V = this;
    if (this.M.state !== 'on' || !V.alive) return;
    const d = V.pos.distanceTo(center);
    if (d > R * 1.1) return;
    this.hit(T.god.blastDamage * (1 - d / (R * 1.1)), _v.set(center.x - V.pos.x, 0, center.z - V.pos.z).normalize().clone(), 'blast');
  }

  /** Mended by a turned clapperjar or a raid's reward: the cracks it no longer needs turn to gold. */
  mend(amount) {
    const V = this;
    if (!V.alive) return;
    V.hp = Math.min(V.max, V.hp + amount);
    V.mendBy = null;
    // the cracks it no longer needs turn to gold
    const need = Math.ceil((1 - V.hp / V.max) * 8);
    while (V.cracks.dark.length > need) {
      const p = V.cracks.dark.shift();
      if (V.cracks.gold.length < 22) V.cracks.gold.push(p);
    }
    this.rebuildCracks();
    sfx.mended(this.M.game.listenerDistance(V.pos));
    const top = V.pos.clone().setY(V.pos.y + 0.8);
    this.M.game.fx.glitter?.([top], top, UP, new THREE.Color(0xffc65c));
    V.flash = -1;
  }

  shatter() {
    const g = this.M.game, V = this;
    V.alive = false; V.reforgeT = T.god.reforge; V.mendBy = null;
    V.group.visible = false;
    const at = V.pos.clone().setY(V.pos.y + 0.6);
    g.fx.explosion?.(at, 1.6);
    sfx.shatter?.(1.4, 3);
    g.fx.impact?.(at, UP, { sparks: 24, dust: 20 });
    this.M.cam.shake = 1;
    for (const c of g.clappers.list) if (c.alive && c.raider) { c.raider = false; g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.4), UP, 1, 'shot'); }
    g.events?.emit('jar.shatter', {});
  }

  update(dt) {
    const g = this.M.game, V = this;
    if (!V.alive) {
      V.reforgeT -= dt;
      if (V.reforgeT <= 0) {
        V.alive = true; V.hp = V.max * 0.6; V.scars++;
        // what cracked before becomes gold seams
        V.cracks.gold.push(...V.cracks.dark.splice(0)); V.cracks.gold.length = Math.min(V.cracks.gold.length, 22);
        this.rebuildCracks();
        V.group.visible = true; // (its summon rises it: the clips, on jar.reforge)
        sfx.reforge();
        g.events?.emit('jar.reforge', {});
      }
    }
    // integrity shows in the core's glow
    const k = V.hp / V.max;
    V.flash = V.flash > 0 ? Math.max(0, V.flash - dt * 4) : Math.min(0, V.flash + dt * 3);
    this.coreMat.emissiveIntensity = 0.15 + 0.85 * k + Math.max(0, V.flash) * 1.5 + Math.max(0, -V.flash) * 0.8 + (k < 0.4 ? Math.sin(this.M.t * 14) * 0.15 : 0);
    this.coreMat.emissive.setHex(k > 0.4 ? PALETTE.glow : 0xff5a3a);
    paintFlash(this.jarMat, V.flash); // (a blow's flash on its painting)
    this.halo.material.opacity = 0.2 + 0.3 * k;
    this.halo.material.color.setHex(k > 0.4 ? PALETTE.glow : 0xff5a3a);
    V.group.position.copy(g.player.pos);
    V.pos.copy(g.player.pos);
  }

  /** New cracks from the side it was hit on. */
  addCrack(from, amount) {
    const V = this, body = this.jarBody;
    if (!body) return;
    const paths = [];
    const n = amount > 12 ? 2 : 1;
    V.group.updateMatrixWorld(true);
    body.computeBoundingSphere(); if (body.boundingBox) body.computeBoundingBox(); // (a skinned body keeps the bounds of the pose they were first taken in: the one it is in now)
    for (let k = 0; k < n; k++) {
      let ang = Math.atan2(from.x, from.z) + (simRand() - 0.5) * 1.6; // (in the world)
      let y = 0.25 + simRand() * 0.75, th = Math.PI * (0.35 + simRand() * 0.3) * (simRand() < 0.5 ? 1 : -1);
      const pts = [];
      for (let i = 0; i < 18; i++) {
        const dir = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
        const origin = V.pos.clone().addScaledVector(dir, 1.2).setY(V.pos.y + y);
        this.raycaster.set(origin, dir.clone().negate());
        const pt = crackPointOn(body, this.raycaster.intersectObject(body, false)[0]); // (its place and skin in the bind pose: it rides the clips)
        if (!pt) break;
        pts.push(pt);
        th += (simRand() - 0.5) * 1.2;
        y += Math.cos(th) * 0.05;
        ang += Math.sin(th) * 0.05 / 0.25;
        if (y < 0.03 || y > 1.15) break;
      }
      if (pts.length > 2) paths.push(pts);
    }
    V.cracks.dark.push(...paths);
    if (V.cracks.dark.length > 14) V.cracks.dark.splice(0, V.cracks.dark.length - 14);
    this.rebuildCracks();
  }

  rebuildCracks() {
    const V = this;
    for (const key of ['dark', 'gold']) {
      const mk = `${key}Mesh`;
      if (V[mk]) { V[mk].removeFromParent(); V[mk].geometry.dispose(); V[mk] = null; }
      if (!V.cracks[key].length) continue;
      V[mk] = crackRibbon(this.jarBody, V.cracks[key], key === 'dark' ? 0.012 : 0.02, key === 'dark' ? crackMat : goldMat); // (skinned to the Jar: vfx/crackskin.js)
    }
  }
}
