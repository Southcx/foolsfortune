// ---------------------------------------------------------------------------------------
// SALVAGE'S LOOKS (docs/plans/OPEN-SEA.md 14.4; Dovina's rules: progress/opensea/salvage.js, the room: world/opensea/opensea.js
// `salvage`, the wrecks' placeholders: world/opensea/seaprops.js, `props.marks` of kind 'wreck'): the open sea's wrecks dressed and the
// haul drawn.
//   A WRECK      each placeholder mesh kept (the room still finds it by its position: `nearWreck`) and given its look (salvagekit.js
//                wreckLook: broken in two, its masts down, barnacled), level on its own heading at the waterline; over its hold a light
//                under the crude in its tier's colour, breathing (stronger the better the wreck), and the crates it still holds today
//                lying in its hold under the water, as many as `room.salvaged` says are left (its first salvage: its tier's crates)
//   THE HAUL     `sea.salvage { wreck, tier, cubes, part, left }`: a sea chest of the wreck's tier comes up out of the light, crude
//                streaming off it (`sea.salvage.rise`, `.drip`), on the Sondelass's line from the ship's rail, swung up and set down on
//                the deck amidships (`sea.salvage.land`), then its lid bursts open in its tier's light (`sea.salvage.open.<tier>`; a ship's
//                part: `sea.salvage.part` too); it stands a beat, then is gone into the hold. The cubes and the part are the log's
//                (feedback/tracking/opensea.js). It takes about the rule's `SALVAGE.haul` (2 real s) to come aboard.
// Cost: no new program (the islet program; the light a sprite, the line a basic line); one draw a wreck, one a crate, one a light.
//
// Prior art: Sea of Thieves' shipwrecks (a hull broken in two, its loot glowing under the water) and its harpoon (a crate reeled in
// over the rail); The Wind Waker's salvage arm (the light on the water, the chest hauled up dripping); the house's cache (puzzlelooks.js:
// the chest up out of the hole, the lid open on a glint).
//
//   game.salvageLooks = new SalvageLooks(game)   .update(dt)   .dressed (the room's props dressed, or null)   HAUL (the beats)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { seeded } from '../../core/rng.js';
import { today } from '../../core/calendar.js';
import { isletMaterial } from './isletlooks.js';
import { wreckLook, crateLook, TIER_LOOK } from './salvagekit.js';
import { haloTexture } from '../lighthouselamp.js';
import { SALVAGE, cratesOf } from '../../progress/opensea/salvage.js';
import { SEA } from '../../world/opensea/seaprops.js';

/** The haul's beats (real s): up out of the water, swung to the deck, set down, the lid open, gone; drip: real s between its drips. */
export const HAUL = { rise: 0.55, swing: SALVAGE.haul, lid: SALVAGE.haul + 0.35, open: SALVAGE.haul + 0.6, gone: SALVAGE.haul + 2.4, drip: 0.18, lidOpen: 1.9 };
const hashId = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
const backOut = (t) => { const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

export class SalvageLooks {
  constructor(game) {
    this.game = game; this.dressed = null; this.wrecks = []; this.hauls = []; this.crates = {}; this.t = 0; this.checkT = 0;
    this.lineMat = new THREE.LineBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.85, fog: false }); this.lineMat.userData.shared = true;
    this.off = game.events?.on?.('sea.salvage', (e) => this.haul(e));
  }
  get mat() { return this.game.seaLooks?.mat || (this.own ||= isletMaterial()); }
  /** A tier's crate geometry, made once (shared by every crate of that tier, kept: the room's teardown re-uploads it if it lets it go). */
  crate(tier) { return (this.crates[tier] ||= crateLook(tier, seeded(hashId(tier)))); }

  update(dt) {
    this.t += dt;
    const R = this.game.opensea, P = R?.props;
    if (P && this.dressed !== P) { this.dress(P); this.dressed = P; }
    if (!P) { this.dressed = null; this.wrecks = []; }
    if (R?.active) {
      if ((this.checkT -= dt) <= 0) { this.checkT = 1; this.counts(R); }
      for (const W of this.wrecks) { const k = 0.75 + 0.25 * Math.sin(this.t * 1.1 + W.phase); W.glow.material.opacity = 0.5 * TIER_LOOK[W.tier].k * k; W.glow.scale.setScalar(W.size * (0.92 + 0.08 * k)); }
    }
    for (let i = this.hauls.length - 1; i >= 0; i--) if (!this.step(this.hauls[i], dt)) this.hauls.splice(i, 1);
  }

  dress(P) {
    this.wrecks = [];
    for (const m of P.marks) {
      if (m.feature.kind !== 'wreck') continue;
      const f = m.feature, tier = TIER_LOOK[f.tier] ? f.tier : 'common', rng = seeded(hashId(String(f.id))), L = wreckLook(rng, tier), mesh = m.mesh;
      const old = [mesh.geometry, mesh.material]; mesh.geometry = L.geo; mesh.material = this.mat; old[0].dispose(); if (!old[1].userData?.shared) old[1].dispose();
      mesh.rotation.set(0, mesh.rotation.y, 0); mesh.position.y = SEA.y; mesh.castShadow = mesh.receiveShadow = true;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: TIER_LOOK[tier].glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0.4 }));
      glow.position.set(L.rise[0], 0.25, L.rise[2]); glow.renderOrder = 2; mesh.add(glow); // (just over the crude where its crates lie: a light under the water seen through it)
      const C = this.crate(tier), lying = L.spots.map((p, i) => { const c = new THREE.Mesh(C.body, this.mat); c.position.set(...p); c.rotation.set(0.3 * (i - 1), rng() * 3, 0.4); mesh.add(c); return c; });
      this.wrecks.push({ id: f.id, tier, mesh, glow, lying, rise: L.rise, size: 9 + 4 * TIER_LOOK[tier].k, phase: rng() * 6 });
    }
    this.counts(this.game.opensea);
  }

  /** The crates still lying in each wreck today (the room's `salvaged`: none yet is its tier's first haul). */
  counts(R) {
    const day = today();
    for (const W of this.wrecks) {
      const S = R?.salvaged?.[W.id], left = !S ? cratesOf(W.tier, true) : S.left > 0 ? S.left : S.day < day ? cratesOf(W.tier, false) : 0;
      W.lying.forEach((c, i) => { c.visible = i < left; });
      W.glow.visible = left > 0;
    }
  }

  // ---------------------------------------------------------------- the haul
  haul(e) {
    const W = this.wrecks.find((w) => w.id === e?.wreck), helm = this.game.opensea?.helm; if (!W || !helm) return;
    const C = this.crate(W.tier), g = new THREE.Group(), body = new THREE.Mesh(C.body, this.mat), lid = new THREE.Mesh(C.lid, this.mat), hinge = new THREE.Group();
    hinge.position.set(0, C.hinge[0], C.hinge[1]); hinge.add(lid); g.add(body, hinge); g.position.copy(W.mesh.localToWorld(_v.set(...W.rise))).setY(SEA.y - 1.2);
    for (const o of [body, lid]) o.castShadow = true;
    g.userData.zone = 'opensea'; this.game.scene.add(g);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), this.lineMat); line.frustumCulled = false; line.userData.zone = 'opensea'; this.game.scene.add(line);
    this.hauls.push({ g, hinge, line, tier: W.tier, part: !!e.part, from: g.position.clone(), t: 0, dripT: 0, beats: new Set(), side: 0 });
    this.counts(this.game.opensea);
  }

  /** One frame of a haul; false when it is over (out of the scene). */
  step(H, dt) {
    H.t += dt;
    const helm = this.game.opensea?.helm, look = helm?.look, g = H.g, vfx = this.game.vfx;
    if (!look || H.t > HAUL.gone) { this.game.scene.remove(g, H.line); H.line.geometry.dispose(); return false; }
    // the deck amidships on the side nearer the wreck, and the rail the line runs from (the ship's frame, then the world's)
    if (!H.side) { const p = look.group.worldToLocal(_w.copy(H.from)); H.side = p.x < 0 ? -1 : 1; }
    const deck = look.group.localToWorld(_v.set(H.side * look.beam * 0.18, (look.deckY || 2) + 0.05, -0.05 * look.length));
    const rail = look.group.localToWorld(_w.set(H.side * look.beam * 0.46, (look.deckY || 2) + 1.2, 0.02 * look.length)).clone();
    if (H.t < HAUL.rise) { const k = H.t / HAUL.rise; g.position.copy(H.from).setY(SEA.y - 1.2 + 1.7 * backOut(k)); }
    else if (H.t < HAUL.swing) {
      const k = (H.t - HAUL.rise) / (HAUL.swing - HAUL.rise), e = k * k * (3 - 2 * k), top = SEA.y + 0.5;
      g.position.lerpVectors(_v.copy(H.from).setY(top), deck, e).y += Math.sin(Math.PI * e) * Math.max(4, look.length * 0.18);
      g.rotation.set(Math.sin(H.t * 5) * 0.15 * (1 - e), H.t * 0.6, Math.cos(H.t * 4) * 0.12 * (1 - e)); // (swinging on the line)
    } else { g.position.copy(deck); g.rotation.set(0, look.group.rotation.y + 0.4, 0); }
    if (!H.beats.has('rise') && H.t > HAUL.rise * 0.7) { H.beats.add('rise'); vfx?.play?.('sea.salvage.rise', { pos: _v.copy(H.from).setY(SEA.y + 0.3) }); }
    if (H.t > HAUL.rise && H.t < HAUL.swing && (H.dripT -= dt) <= 0) { H.dripT = HAUL.drip; vfx?.play?.('sea.salvage.drip', { pos: g.position }); }
    if (!H.beats.has('land') && H.t >= HAUL.swing) { H.beats.add('land'); vfx?.play?.('sea.salvage.land', { pos: g.position }); }
    if (!H.beats.has('open') && H.t >= HAUL.open) { H.beats.add('open'); vfx?.play?.(`sea.salvage.open.${H.tier}`, { pos: _v.copy(g.position).setY(g.position.y + 1) }); if (H.part) vfx?.play?.('sea.salvage.part', { pos: _v.copy(g.position).setY(g.position.y + 1.2) }); }
    H.hinge.rotation.x = -HAUL.lidOpen * Math.min(1, Math.max(0, (H.t - HAUL.lid) / (HAUL.open - HAUL.lid)) ** 0.5);
    const fade = Math.max(0, (H.t - (HAUL.gone - 0.5)) / 0.5); g.scale.setScalar(1 - fade); // (into the hold)
    // the Sondelass's line, rail to crate, while it is on it
    H.line.visible = H.t < HAUL.swing + 0.2;
    if (H.line.visible) { const a = H.line.geometry.attributes.position; a.setXYZ(0, rail.x, rail.y, rail.z); a.setXYZ(1, g.position.x, g.position.y + 1.1, g.position.z); a.needsUpdate = true; }
    return true;
  }

  dispose() { this.off?.(); for (const H of this.hauls) this.game.scene.remove(H.g, H.line); this.hauls = []; }
}
