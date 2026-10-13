// ---------------------------------------------------------------------------------------
// PSYCHOKINESIS'S GOD POWERS (docs/plans/GODHAND.md section 8), as handlers for the runner (godhand/powers.js). Telekinesis and Scoop
// are the hand's own (godhand/godhand.js, godhand/matterarts.js).
//   GUST    drag a stroke: wind along it. Loose things and creatures on it are thrown along, sand is blown off it and laid at its end
//           (a dune moved), and the Lachryma round its end is drawn toward it for a few real seconds.
//   SLAB    press on the ground: a slab of the island's matter comes up under the hand, everything above the authored ground; press
//           again elsewhere to set it down.
// Prior art: Black & White's wind miracle; From Dust's sand carried and let fall; Populous's raise land by the block.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
let held = null; // the slab in the hand: { water, sand, clay, feeling, side, mesh }

/** Distance from a point to the segment a..b on the ground, and how far along it (0..1). */
function along(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2));
  return [Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t)), t];
}

export const FORCE = {
  gust: {
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.3, true); },
    end(P, L) {
      const g = P.game, F = P.F, len0 = L.a.distanceTo(L.b); if (len0 < 1.5) return;
      const max = P.ramp('gust', 'len'), b = len0 > max ? L.a.clone().lerp(L.b, max / len0) : L.b.clone();
      const dir = b.clone().sub(L.a).setY(0).normalize(), power = P.ramp('gust', 'power'), w = 2.5, mid = L.a.clone().lerp(b, 0.5), len = L.a.distanceTo(b);
      P.bodies(mid, len / 2 + w, (body, d, dx, dz, p) => { if (along(p, L.a, b)[0] > w) return; const v = body.linvel(); body.setLinvel({ x: v.x + dir.x * power, y: v.y + 2.5, z: v.z + dir.z * power }, true); });
      let hit = 0;
      for (const c of P.near(mid, len / 2 + w)) { if (along(c.pos, L.a, b)[0] > w) continue; c.knock?.(dir.clone().multiplyScalar(power * 0.6).addScaledVector(UP, 2)); hit++; }
      let moved = 0;
      if (F) {
        for (let s = 0; s < len; s += 1.5) { const p = L.a.clone().addScaledVector(dir, s); moved += F.take(p.x, p.z, 1.2, 0.25, ['sand']).sand; }
        if (moved > 0) F.pour(b.x + dir.x * 1.5, b.z + dir.z * 1.5, 2, moved, { kind: 'sand' });
        F.pull(b.x, b.z, len * 0.6, 4, 1.5);
      }
      P.line([L.a.clone().setY(L.a.y + 0.5), b.clone().setY(b.y + 0.5)], P.domainColour('gust'), 0.6);
      P.emit('gust', { len: +len.toFixed(1), hit, moved: +moved.toFixed(2) });
    },
  },

  slab: {
    begin(P, L) {
      const g = P.game, F = P.F; if (!F) return false;
      if (held) { // (set it down)
        const r = held.side / 2;
        for (const kind of ['clay', 'sand', 'water']) if (held[kind] > 0) F.pour(L.a.x, L.a.z, r, held[kind], { kind, feeling: kind === 'water' ? held.feeling : null });
        const moved = held.water + held.sand + held.clay;
        P.drop(held.mesh); held = null;
        P.emit('slab', { moved: +moved.toFixed(2), set: true });
        return false;
      }
      const side = P.ramp('slab', 'side'), got = F.take(L.a.x, L.a.z, side / 2, side * side * 20);
      const v = got.water + got.sand + got.clay;
      if (v < 0.05) { g.log.say('warn', 'There is no matter there to lift: only the island itself.', { key: 'slab.none', throttle: 2 }); return false; }
      const h = Math.max(0.2, v / (side * side));
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(side, h, side), new THREE.MeshStandardMaterial({ color: got.clay >= got.sand ? 0x9a5a3a : 0xd8b878, roughness: 0.9 }));
      g.scene.add(mesh);
      held = { ...got, side, mesh, h };
      P.keep({ id: 'slab', tick() { if (!held || held.mesh !== mesh) return true; const K = P.god.cursor; mesh.visible = !!P.god.active; mesh.position.copy(K.point).setY(K.point.y + 2 + h / 2); return false; }, dispose() {} });
      P.emit('slab', { moved: +v.toFixed(2), set: false });
      return false;
    },
  },
};

/** The hand put away with a slab in it: it falls where the hand last was (godhand/powers.js clear()). */
export function dropSlab(P) {
  if (!held) return;
  const at = held.mesh.position, F = P.game.matter?.field;
  if (F?.contains(at.x, at.z)) for (const kind of ['clay', 'sand', 'water']) if (held[kind] > 0) F.pour(at.x, at.z, held.side / 2, held[kind], { kind, feeling: kind === 'water' ? held.feeling : null });
  P.drop(held.mesh); held = null;
}
