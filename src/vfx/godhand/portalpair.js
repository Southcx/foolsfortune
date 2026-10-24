// ---------------------------------------------------------------------------------------
// THE PORTAL POWER'S EYES (Ouranurgy's Portal, godhand/powers/space.js; the glossary's portal: a linked pair of crude-rimmed eyes, each a
// window on the other's view). The caster shells' own Portal (vfx/caster/portal.js, warmed at boot by vfx/shelllooks/warmup.js: no new
// program) stood up at each end of the drag, each turned to the hand's camera as it was when the pair was made, linked, and each one's
// view out drawn once as it opens (its `refresh`: one small render of the world, never one a frame). Each eye opens over 0.6 real s and
// closes as an eye does over the last 0.8 of its life; under each, the pass ring (the reach a thing must come within) in Ouranurgy's
// Ru celadon, draped on the ground (vfx/godhand/marks.js).
//
// Prior art: Portal's pair (Valve, 2007: each the other's view, drawn from the partner's place), Black & White 2's and Populous's
// teleport stones (a door you can see the far place through from above), and the caster shell's eye, reused whole.
//
//   const E = portalPair(game, [a, b], r, colour, camera)   E.update(dt, t, life)   E.dispose()
// ---------------------------------------------------------------------------------------
import { Portal } from '../caster/portal.js';
import { circleMark, disposeTree } from './marks.js';

const OPEN = 0.6, CLOSE = 0.8; // (real seconds to open; to close at the end)
const ease = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

export function portalPair(game, ends, r, colour, camera) {
  const w = Math.max(1.4, r * 1.1), h = Math.max(2.2, r * 1.6);
  const eyes = ends.map((e) => {
    const P = new Portal({ mode: 'portal', width: w, height: h, open: 0, tint: colour });
    P.object.position.set(e.x, e.y + h / 2 + 0.15, e.z);
    if (camera) P.object.rotation.y = Math.atan2(camera.position.x - e.x, camera.position.z - e.z); // (facing the hand's eye: you look through it)
    game.scene.add(P.object);
    return P;
  });
  eyes[0].link(eyes[1]);
  const rings = ends.map((e) => { const m = circleMark(game, e, r, colour, { opacity: 0.55 }); game.scene.add(m); return m; });
  let drawn = false;
  return {
    eyes, rings,
    update(dt, t, life) {
      if (!drawn && game.renderer) { drawn = true; for (const P of eyes) P.refresh(game.renderer, game.scene); } // (each one's view out, once, now both stand)
      const open = Math.min(ease(t / OPEN), ease((life - t) / CLOSE));
      for (const P of eyes) { P.set({ open }); P.update(dt); }
      for (const m of rings) m.material.opacity = 0.35 + 0.2 * open;
    },
    dispose() { for (const P of eyes) P.dispose(); for (const m of rings) disposeTree(m); },
  };
}
