// ---------------------------------------------------------------------------------------
// THE TRAPS' BODIES, TWO: the crude gusher, the portal pair and the Wisp turret (vfx/racewaytraps.js builds them; bodies.js has the
// other four, and the contract: built in the trap's root, local x = -lat, returning { root, show(Tp, t, dt), dispose(), lamp? }).
//   CRUDE GUSHER   a clay well-head flush with the sand, gold-collared; told, crude wells up round it (a black bloom spreading) and the oil
//                  film's ring stands at the spill's reach (7 m), beating; it bursts, a jet of crude thrown up and falling, and the spill
//                  laid as a slick (vfx/slicks.js: crude's own look and ramp, fresh black to the film's bands to a sheen) for as long as
//                  the grip is down
//   PORTAL PAIR    two of the caster shells' crude-rimmed eyes (vfx/caster/portal.js), each a window on the other's view, each stood on
//                  the line in a ring of Ru celadon with gold collars; closed between beats, opening through the tell, lit in Lachryma's
//                  blue while it sends you on; possessed, red, eye and ring (a send-back: Read's colour)
//   WISP TURRET    a stone lantern (a toro) of the Raceway's clay beside the line with a Lantern Wisp in its fire box (the owner's model,
//                  its idle on its own mixer, its flame its own); told, the box's light swells and a thread of ember runs from the lamp
//                  to the rider it will cast at; its flame is the Wisp's ember (vfx/lanternwisplook.js); parried home and stunned,
//                  the lamp goes grey and smokes
//
// Prior art: Mario Kart's oil slick and Spy Hunter's (a black patch with a rainbow sheen), the Bonn Agreement's oil looks (vfx/oxidation.js);
// Portal's pair (each the other's view) and the house's Portal power's eyes (vfx/godhand/portalpair.js); a Japanese toro (the stone
// lantern: base, post, platform, fire box, roof, finial), Ultimate Chicken Horse's crossbow and Crawl's turrets, Zelda's laser-sight
// telegraph (a line to the target before the shot).
//
//   BODIES2 = { gusher, portal, turret }   ball(game, Tp, pos) -> the turret's ember mesh (traps.js flies it)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { PALETTE as P, STATE, solid, glowMat, own, drape, flatRing, flatRect, markShow } from './kit.js';
import { Portal } from '../caster/portal.js';
import { filmColour } from '../oxidation.js';
import { matteFrom } from '../matte.js';

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cyl = (r0, r1, h, x = 0, y = 0, z = 0, seg = 10) => new THREE.CylinderGeometry(r1, r0, h, seg).translate(x, y, z);
const _v = new THREE.Vector3(), _c = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);

export const BODIES2 = {
  // ---------------------------------------------------------------- the crude gusher
  gusher({ game, Tp, root, R }) {
    const K = Tp.K, r = K.size.r, cx = -(Tp.lat || 0);
    root.add(solid([[cyl(1.25, 1.1, 0.4, cx, 0.05, 0, 14), P.strata[1]], [cyl(1.3, 1.3, 0.12, cx, 0.22, 0, 14), P.gold], [cyl(0.7, 0.7, 0.06, cx, 0.27, 0, 14), P.crude]]));
    const bloomMat = new THREE.MeshBasicMaterial({ color: P.crude, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, map: own('hole') });
    const bloom = new THREE.Mesh(drape(flatRect(2 * r, 2 * r, cx, 0), root, R, 0.1), bloomMat); bloom.renderOrder = 3; root.add(bloom);
    const filmMat = glowMat(STATE.idle, STATE.idleO, own('ring')), film = new THREE.Mesh(drape(flatRect(2 * r + 1.4, 2 * r + 1.4, cx, 0), root, R, 0.14), filmMat); film.renderOrder = 4; root.add(film);
    const jetMat = new THREE.MeshStandardMaterial({ color: P.crude, roughness: 0.15, metalness: 0.2 }), jet = new THREE.Mesh(cyl(0.75, 0.35, 1, 0, 0.5, 0, 10), jetMat);
    jet.position.set(cx, 0.2, 0); jet.scale.y = 0.001; jet.visible = false; root.add(jet);
    let was = 'idle', jetT = 9, grow = 0;
    return {
      root,
      show(Tp, t, dt) {
        const told = Tp.phase === 'tell', on = Tp.phase === 'active';
        if (on && was !== 'active') { // (the burst: the jet thrown up, the spill laid where the grip goes)
          jetT = 0; _v.set(cx, 0, 0); root.localToWorld(_v); _v.y = R?.heightAt ? R.heightAt(_v.x, _v.z) : _v.y;
          game.slicks?.spill(_v.clone(), r * (1 + 0.15 * (Tp.wrath || 0)), K.cycle.active + 1.2, { normal: UP });
        }
        was = Tp.phase;
        jetT += dt; const j = jetT < 1.4 ? Math.sin(Math.min(1, jetT / 1.4) * Math.PI) : 0;
        jet.visible = j > 0.01; jet.scale.set(1 + j * 0.4, 0.001 + 8 * j, 1 + j * 0.4);
        grow = damp(grow, told ? 0.25 + 0.45 * Tp.k : on ? (game.slicks ? 0.15 : 1) : 0, 6, dt); // (the bloom spreading; on, the slick is the spill: only the vent's wet)
        bloomMat.opacity = Math.min(0.95, grow * 2.2); bloomMat.map.repeat.setScalar(1 / Math.max(0.08, grow));
        markShow(filmMat, Tp, t, { active: STATE.tell, activeO: 0.35 });
        if (Tp.phase !== 'idle' && Tp.stun <= 0) filmMat.color.lerp(filmColour(t * 0.25 + Tp.i * 0.3, _c), on ? 0.85 : 0.5); // (the oil film's colours walking round the reach)
      },
      dispose() { bloomMat.map.dispose(); filmMat.map.dispose(); for (const m of [bloom, film, jet]) m.geometry.dispose(); },
    };
  },

  // ---------------------------------------------------------------- the portal pair
  portal({ game, traps, Tp, root, R }) {
    const r = Tp.K.size.r, eyeH = r * 2.3, R0 = r * 1.5, sy = 1.14, cy = R0 * sy * Math.SQRT1_2 + 0.1; // (a horseshoe of stone, open at the foot: its ends on the sand, the eye inside it)
    const eye = (base) => {
      const arch = new THREE.TorusGeometry(R0, 0.45, 8, 36, Math.PI * 1.5).rotateZ(-Math.PI / 4).scale(1, sy, 1).translate(0, cy, 0), parts = [[arch, P.celadon]];
      for (const a of [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]) parts.push([box(1.0, 1.0, 1.1).rotateZ(a).translate(Math.cos(a) * R0, cy + Math.sin(a) * R0 * sy, 0), P.gold]);
      for (const sg of [-1, 1]) { const ex = sg * R0 * Math.SQRT1_2; parts.push([box(1.6, 1.0, 1.7, ex, 0.2, 0), P.cap], [box(1.66, 0.2, 1.76, ex, 0.75, 0), P.gold]); }
      base.add(solid(parts));
      const P0 = new Portal({ mode: 'portal', width: 2 * r * 0.98, height: eyeH, open: 0, k: 1, tint: STATE.eye }); P0.object.position.y = cy; base.add(P0.object);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(R0, 0.75, 6, 36, Math.PI * 1.5).rotateZ(-Math.PI / 4).scale(1, sy, 1).translate(0, cy, 0), glowMat(STATE.eye, 0, null, true)); base.add(halo);
      const markMat = glowMat(STATE.idle, STATE.idleO, own('ring')), mark = new THREE.Mesh(drape(flatRect(2 * r + 3, 2 * r + 3), base, R, 0.12), markMat); mark.renderOrder = 3; base.add(mark);
      return { P: P0, halo, mark, markMat };
    };
    // the second eye: its own root at the pair's far end, on its frame of the line
    const far = new THREE.Group(), { F, pos } = traps.frameAt(Tp.s2 ?? Tp.s, 0); far.position.copy(pos); far.rotation.y = Math.atan2(F.fx, F.fz); traps.group.add(far);
    const eyes = [eye(root), eye(far)]; eyes[0].P.link(eyes[1].P);
    let drawn = false, open = 0;
    return {
      root, far,
      show(Tp, t, dt) {
        const told = Tp.phase === 'tell', on = Tp.phase === 'active', red = !!Tp.red;
        open = damp(open, on || red ? 1 : told ? 0.15 + 0.6 * Tp.k : 0, on ? 10 : 6, dt);
        if (!drawn && open > 0.05 && game.renderer) { drawn = true; for (const E of eyes) E.P.refresh(game.renderer, game.scene); } // (each one's view out, once, as it first opens)
        const tint = red ? STATE.red : on ? STATE.lit : STATE.eye;
        for (const E of eyes) {
          E.P.set({ open: open * open * (3 - 2 * open), tint }); E.P.update(dt);
          E.halo.material.color.setHex(tint); E.halo.material.opacity = 0.08 + 0.5 * open;
          markShow(E.markMat, Tp, t, red ? { active: STATE.red } : { active: STATE.lit, activeO: 0.55 }); if (red) E.markMat.color.setHex(STATE.red);
        }
      },
      dispose() { for (const E of eyes) { E.P.dispose(); E.mark.material.map.dispose(); E.mark.geometry.dispose(); } },
    };
  },

  // ---------------------------------------------------------------- the Wisp turret
  turret({ game, traps, Tp, root, R, W }) {
    const x = W + 4, lampY = 6.6; // (where traps.js casts from: lat -(W + 4), 6.6 m up; local x = -lat)
    root.add(solid([[box(2.8, 0.7, 2.8, x, 0, 0), P.cap], [cyl(0.75, 0.55, 3.8, x, 2.25, 0, 8), P.strata[0]], [box(2.6, 0.5, 2.6, x, 4.4, 0), P.ame], [box(2.66, 0.14, 2.66, x, 4.7, 0), P.gold],
      ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => [box(0.28, 2.9, 0.28, x + a * 0.95, 6.15, b * 0.95), P.strata[2]]),
      [new THREE.ConeGeometry(2.1, 1.5, 4).rotateY(Math.PI / 4).translate(x, 8.35, 0), P.cap], [box(2.2, 0.16, 2.2, x, 7.62, 0), P.gold], [new THREE.IcosahedronGeometry(0.34, 1).translate(x, 9.35, 0), P.gold]]));
    const lamp = new THREE.Object3D(); lamp.position.set(x, lampY, 0); root.add(lamp);
    const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), glowMat(STATE.tell, 0.1, null, true)); halo.position.copy(lamp.position); root.add(halo);
    const markMat = glowMat(STATE.idle, STATE.idleO, own('ring')), mark = new THREE.Mesh(drape(flatRect(6, 6, x, 0), root, R, 0.12), markMat); mark.renderOrder = 3; root.add(mark);
    const aimMat = glowMat(STATE.tell, 0, null, true), aim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 6).translate(0, 0.5, 0).rotateX(Math.PI / 2), aimMat); aim.visible = false; traps.group.add(aim);
    // the Wisp in its box: the owner's model, its own materials (its flame ours to dim), its idle on its own mixer
    let wisp = null, mixer = null, flames = [];
    const src = game.wisps?.gltf;
    if (src?.scene) {
      wisp = cloneSkinned(src.scene); wisp.scale.setScalar(1.25); wisp.position.set(x, lampY - 1.05, 0); wisp.rotation.y = -Math.PI / 2; root.add(wisp);
      wisp.traverse((o) => { if (!o.isMesh) return; o.material = matteFrom(o.material); o.frustumCulled = false; if (/Flame|Glow/i.test(o.material.name || '')) flames.push({ m: o.material, base: o.material.emissiveIntensity ?? 1 }); });
      const clip = game.wisps.clips?.get('Idle') || src.animations?.find((c) => /idle/i.test(c.name)) || src.animations?.[0];
      if (clip) { mixer = new THREE.AnimationMixer(wisp); mixer.clipAction(clip).play(); }
    }
    let stunned = false, glow = 0;
    return {
      root, lamp,
      show(Tp, t, dt) {
        mixer?.update(dt);
        const told = Tp.phase === 'tell', on = Tp.phase === 'active', stun = Tp.stun > 0;
        if (stun && !stunned) game.vfx?.play('wisp.snuff', { pos: lamp.getWorldPosition(new THREE.Vector3()) });
        stunned = stun;
        glow = damp(glow, stun ? 0 : on ? 1.4 : told ? 0.35 + 0.65 * Tp.k : 0.25, 12, dt);
        halo.material.color.setHex(stun ? STATE.stun : on ? STATE.active : STATE.tell); halo.material.opacity = stun ? 0.05 : 0.08 + 0.45 * glow + (told ? 0.12 * Math.sin(t * (7 + 9 * Tp.k)) : 0);
        for (const f of flames) f.m.emissiveIntensity = f.base * (stun ? 0.12 : 0.7 + 0.8 * glow);
        markShow(markMat, Tp, t);
        // told: the thread from the lamp to the rider it will cast at (traps.js cast: the nearest in range)
        let target = null;
        if (told && !stun) { const from = lamp.getWorldPosition(_v); let bd = Tp.K.size.range; for (const r of traps.racers()) { const d = r.pos.distanceTo(from); if (d < bd) { bd = d; target = r; } } }
        aim.visible = !!target;
        if (target) { const from = lamp.getWorldPosition(new THREE.Vector3()), to = target.pos.clone().setY(target.pos.y + 1); aim.position.copy(from); aim.lookAt(to); aim.scale.set(1, 1, from.distanceTo(to)); aimMat.opacity = 0.2 + 0.5 * Tp.k; }
      },
      dispose() { mixer?.stopAllAction(); if (wisp) { wisp.traverse((o) => { if (o.isMesh) o.material.dispose(); }); wisp.removeFromParent(); } markMat.map.dispose(); mark.geometry.dispose(); aim.removeFromParent(); aim.geometry.dispose(); aimMat.dispose(); },
    };
  },
};

/** The turret's flame as flown (traps.js cast): the Lantern Wisp's ember (its material's look) at the trap's size, its flight's tail. */
export function ball(game, Tp, pos) {
  const L = game.wisps?.look, src = L?.emberMat, r = (Tp.K.ball?.r ?? 1.3) * 0.6;
  const mat = src ? src.clone() : new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffc070, emissiveIntensity: 4, roughness: 0.5 });
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), mat); m.position.copy(pos); m.castShadow = false;
  game.vfx?.play('wisp.cast', { pos });
  game.vfx?.play('wisp.cast.flight', { pos, follow: (h) => !!m.parent && (h.pos.copy(m.position), true) });
  return m;
}
