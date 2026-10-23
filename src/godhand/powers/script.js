// ---------------------------------------------------------------------------------------
// SPELLSCRIPTION'S GOD POWERS (docs/plans/GODHAND.md section 8), as handlers for the runner (godhand/powers.js). The miracles are
// Spellscription's too (godhand/miracles.js, on MMB).
//   WARD    drag from a centre outward: a circle no creature crosses, either way, for a while. Several at a high level.
//   STAMP   drag from one patch to another: the first patch of the island's matter is copied and pressed down over the second. What it
//           lays over less is made from nothing, and paid in Lachryma (free at 99).
// Prior art: the magic circle (a ward as a written boundary); Black & White's wall of influence; a level editor's copy and paste.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SCRIPT = {
  ward: {
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.3, true); },
    end(P, L) {
      const r = Math.max(2, Math.min(L.a.distanceTo(L.b), P.ramp('ward', 'r'))), dur = P.ramp('ward', 'dur'), at = L.a.clone();
      P.cap('ward', Math.round(P.ramp('ward', 'n')));
      const ring = P.game.godhandLooks?.ward(at, r, P.domainColour('ward')) ?? P.ring(at, r, P.domainColour('ward')), side = new WeakMap(); // (its written circle and wall: vfx/godhand/marks.js)
      let t = 0;
      P.keep({
        id: 'ward',
        tick(dt) {
          t += dt;
          for (const c of P.near(at, r + 4)) {
            const dx = c.pos.x - at.x, dz = c.pos.z - at.z, d = Math.hypot(dx, dz) || 1e-3, inside = d < r, was = side.get(c);
            if (was === undefined) { side.set(c, inside); continue; }
            if (was === inside) continue;
            const back = was ? r - 0.4 : r + 0.4; // (set back on the side it came from)
            P.place(c, new THREE.Vector3(at.x + (dx / d) * back, c.pos.y, at.z + (dz / d) * back));
            c.vel?.set(0, 0, 0);
          }
          ring.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
          return t >= dur;
        },
        dispose() { P.drop(ring); },
      });
      P.emit('ward', { r: +r.toFixed(1) });
    },
  },

  stamp: {
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.4, true); },
    end(P, L) {
      const g = P.game, F = P.F, side = P.ramp('stamp', 'side');
      if (!F || L.a.distanceTo(L.b) < side) return;
      const r = F.patch(L.a.x, L.a.z, L.b.x, L.b.z, side / 2, { copy: true });
      if (r.made > 0) g.lachryma.drain(r.made * P.ramp('stamp', 'made'), 'god');
      P.ring(L.a, side / 2, P.domainColour('stamp'), 1); P.ring(L.b, side / 2, P.domainColour('stamp'), 1.5);
      P.emit('stamp', { made: +r.made.toFixed(2), side: +side.toFixed(1) });
    },
  },
};
