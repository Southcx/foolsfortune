// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE TROUPE: the straw dummies (Dovina's creatures, world/strawmanwell/dummy.js, and the Stomp's walkers,
// world/strawmanwell/mechanics.js) drawn as Pip's earlier tries at Strawman, Strawman's fellows (a part of the Well's look,
// vfx/strawmanwell/look.js):
//   THE TRIES    each dummy's doll restitched as one of Pip's tries by its index (vfx/strawmanwell/pipstries.js; stable: the Brawl's
//                three are the first three, the Stomp's the last three, so the six stand in the theatre once each)
//   THE PERCENT  each Brawl dummy's percent worn as the overlay's tag in the System's type, Smash's readout (vfx/strawmanwell/
//                percenttag.js: it rolls, ramps white to red, shakes on a blow), in the place of Dovina's placeholder sprite, which is
//                taken out of the scene while the look is on (her dummy.js untouched) and put back if the look lets go first
//   THE KO       a dummy knocked past a blast line (`well.dummy.ko`) bursts in straw where it left the view, thrown back toward the
//                stage (Smash's blast at the screen's edge): the library's own straw (`blow.finisher.straw` and `hit.blunt.straw`,
//                vfx/blowfeeleffects.js), big, tinted by its percent's colour; nothing new in the library
//
// Prior art: Super Smash Bros.' damage percent and its KO blast at the screen's edge; Pip's apprentice pieces (LORE.md); the Sandbox's
// look for dressing a room's creatures from outside them (vfx/sandbox/look.js).
//
//   dressTroupe(ctx) -> { update(dt, camera), dispose() }   (ctx: look.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PERCENT } from '../../progress/strawmanwell.js';
import { stitchTry, tryOf } from './pipstries.js';
import { DummyPercentTag, percentColour } from './percenttag.js';

/** The KO's burst: kept this far inside the view's edge (NDC), its sizes (the library's scale), and the head's lift for the tag (m). */
const KO = { inset: 0.84, scale: 2.4, straw: 1.8, power: 3 };
const _a = new THREE.Vector3(), _d = new THREE.Vector3();

export function dressTroupe(ctx) {
  const { game: g, well: W, palette } = ctx, brawl = W.dummies?.list || [], stomp = W.mech?.dummies || [];
  brawl.forEach((c, i) => stitchTry(c.model, tryOf(i), palette));
  stomp.forEach((D, i) => stitchTry(D.model, tryOf(brawl.length + i), palette));
  // the percent: a tag a Brawl dummy, in its lane; the placeholder taken out of the scene
  const tags = brawl.map((c) => {
    const T = new DummyPercentTag(); ctx.add(T.sprite, 'brawl');
    const old = c.tag?.s || null; old?.removeFromParent();
    return { c, T, old };
  });
  let live = true;
  document.fonts?.load?.(`64px 'Jersey 15'`)?.then(() => { if (live) for (const { T } of tags) T.redraw(); }, () => {});

  // the KO: the dummy past its blast line (still there as the event is said: dummy.js emits before it puts it out)
  const outside = (c) => { const A = c.arena; return c.pos.x < A.x0 - PERCENT.blast || c.pos.x > A.x1 + PERCENT.blast || c.pos.y < A.top - 10 || c.pos.y > A.top + 22; };
  const off = g.events?.on?.('well.dummy.ko', (e) => {
    const c = brawl.find((x) => x.alive && !(x.out > 0) && outside(x)); const cam = g.camera; if (!c || !cam || !g.vfx) return;
    const A = c.arena, fell = c.pos.y < A.top - 10;
    _a.copy(c.pos).setY(c.pos.y + c.height * 0.5).project(cam); // (kept inside the view at the same depth: the blast at the screen's edge)
    _a.x = THREE.MathUtils.clamp(_a.x, -KO.inset, KO.inset); _a.y = THREE.MathUtils.clamp(_a.y, -KO.inset, KO.inset); _a.unproject(cam);
    _d.set(fell ? 0 : (A.x0 + A.x1) / 2 - _a.x, fell ? 1 : 0.35, 0).normalize();
    const [r, gg, b] = percentColour(e?.percent ?? c.percent), tint = (r << 16) | (gg << 8) | b;
    g.vfx.play('blow.finisher.straw', { pos: _a, dir: _d, tint, scale: KO.scale });
    g.vfx.play('hit.blunt.straw', { pos: _a, dir: _d, tint, power: KO.power, scale: KO.straw });
  });

  return {
    update(dt, camera) {
      for (const { c, T } of tags) {
        const up = c.alive && c.model.group.visible; T.sprite.visible = up; if (!up) continue;
        const toward = camera ? Math.sign(camera.position.z - c.pos.z) || 1 : 1;
        T.update(dt, c.percent, _a.set(c.pos.x, c.pos.y + c.height, c.pos.z), toward);
      }
    },
    dispose() {
      live = false; off?.();
      for (const { c, T, old } of tags) { T.dispose(); if (old && !old.parent && W.dummies?.list?.includes(c) && c.arena?.into) c.arena.into.add(old); }
    },
  };
}
