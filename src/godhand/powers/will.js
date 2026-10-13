// ---------------------------------------------------------------------------------------
// POSSESSION'S GOD POWERS (docs/plans/GODHAND.md section 8), as handlers for the runner (godhand/powers.js). A creature walked by the
// hand has its mind set aside while it walks (P.walk), and given back when the time is up.
//   HERD    drag from a crowd to a place: the creatures near where the stroke began walk to where it ended.
//   TAKE    press on a creature: it is yours to play from above; press on the ground and it goes there; press on it again to let it go.
//   MUSTER  drag from a source to a place: clay workers come up and carry the matter from one to the other, trip by trip, for a while.
// Prior art: Pikmin (the whistle's herd, the carriers); Black & White's leashed creature; Dungeon Keeper's possession; Populous's walkers.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

let taken = null, takenRing = null;
const WORKER = { speed: 4, load: 0.4, r: 1.6 }; // (m/s a worker walks; m³ a worker carries at level open, scaled by the ramp's rate)

export const WILL = {
  herd: {
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.3, true); },
    end(P, L) {
      if (L.a.distanceTo(L.b) < 2) return;
      const list = P.near(L.a, P.ramp('herd', 'r')).slice(0, Math.round(P.ramp('herd', 'n'))), dur = P.ramp('herd', 'dur');
      list.forEach((c, i) => { const a = (i / Math.max(1, list.length)) * Math.PI * 2, rr = Math.sqrt(i) * 0.9; P.walk(c, L.b.clone().add(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)), dur); });
      P.ring(L.b, 1.5, P.domainColour('herd'), 2);
      P.emit('herd', { n: list.length });
    },
  },

  take: {
    begin(P, L) {
      const g = P.game, c = P.creatureAt(L.a);
      if (c && c === taken) { P.release(c); taken = null; return false; }
      if (c) {
        if (taken) P.release(taken);
        taken = c; P.walk(c, c.pos, P.ramp('take', 'dur'));
        if (!takenRing) { takenRing = P.ring(c.pos, 1.1, P.domainColour('take')); P.keep({ id: 'take', tick() { if (!taken?.godWalk) { taken = null; takenRing.visible = false; return false; } takenRing.visible = true; takenRing.position.set(taken.pos.x, taken.pos.y + 0.08, taken.pos.z); return false; }, dispose() { P.drop(takenRing); takenRing = null; taken = null; } }); }
        P.emit('take', { kind: c.kind });
        return false;
      }
      if (taken?.godWalk) { taken.godWalk.to.copy(L.a); P.ring(L.a, 0.6, P.domainColour('take'), 0.6); }
      else g.log.say('warn', 'Press on a creature to take it.', { key: 'take.none', throttle: 3 });
      return false;
    },
  },

  muster: {
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.3, true); },
    end(P, L) {
      const g = P.game, F = P.F; if (!F || L.a.distanceTo(L.b) < 3) return;
      P.cap('muster', 1);
      const a = L.a.clone(), b = L.b.clone(), n = Math.round(P.ramp('muster', 'n')), dur = P.ramp('muster', 'dur'), load = WORKER.load * P.ramp('muster', 'rate');
      const geo = new THREE.CylinderGeometry(0.22, 0.3, 0.7, 7), mat = new THREE.MeshStandardMaterial({ color: 0xb06a44, roughness: 0.9 });
      const crew = Array.from({ length: n }, (_, i) => { const m = new THREE.Mesh(geo, mat); g.scene.add(m); return { m, p: a.clone().lerp(b, i / n), toB: i % 2 === 0, carry: null }; });
      let t = 0, moved = 0;
      P.keep({
        id: 'muster',
        tick(dt) {
          t += dt;
          const F = g.matter?.field; if (!F) return t >= dur;
          for (const w of crew) {
            const to = w.toB ? b : a, d = to.clone().sub(w.p).setY(0), dist = d.length();
            if (dist < 0.4) {
              if (w.toB && w.carry) { for (const kind of ['clay', 'sand', 'water']) if (w.carry[kind] > 0) F.pour(b.x, b.z, WORKER.r, w.carry[kind], { kind, feeling: w.carry.feeling }); moved += w.carry.clay + w.carry.sand + w.carry.water; w.carry = null; }
              else if (!w.toB) { const got = F.take(a.x, a.z, WORKER.r, load); if (got.clay + got.sand + got.water > 0.01) w.carry = got; }
              w.toB = !w.toB;
            } else w.p.addScaledVector(d.multiplyScalar(1 / dist), Math.min(dist, WORKER.speed * dt));
            const y = F.groundAt(w.p.x, w.p.z); w.p.y = Number.isFinite(y) ? y : w.p.y;
            w.m.position.set(w.p.x, w.p.y + 0.35 + (w.carry ? Math.abs(Math.sin(t * 9)) * 0.08 : 0), w.p.z);
          }
          return t >= dur;
        },
        dispose() { for (const w of crew) g.scene.remove(w.m); geo.dispose(); mat.dispose(); g.events?.emit('god.muster.done', { moved: +moved.toFixed(2), by: 'courier' }); },
      });
      P.emit('muster', { n });
    },
  },
};
