// ---------------------------------------------------------------------------------------
// OURANURGY'S GOD POWERS (docs/plans/GODHAND.md section 8): the rules of space and time over the island, as handlers for the runner
// (godhand/powers.js).
//   PORTAL  drag from one point to another: a linked pair of holes (the glossary's portal: a rift is one alone). A creature, a loose thing or the Courier that comes within one
//           comes out of the other, and Lachryma pooled in the fuller runs through to the emptier. Several pairs at a high level.
//   FOLD    drag from one patch to another: the two patches of the island's matter trade places, with what stands on them.
//   HASTEN  press: matter's time over the patch runs fast (it slumps, runs and mends that much sooner). With Shift, STAY: it stops,
//           and so does everything on it (creatures halted, loose things stilled), while it holds.
// Prior art: Portal (the linked pair, momentum kept); Populous's swamp-and-flood as places that trade; Braid's and Superhot's local time.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _o = new THREE.Vector3();
const DROP = 0.3; // (real seconds a thing is left alone after coming out of a portal, so it does not go straight back in)
const DOWN = { x: 0, y: -1, z: 0 };

/** Where the Courier comes out beside a portal's end: on the floor found under a point a step past its rim, or null if there is none
 *  within reach (an end picked on the island's matter below the basement put them 3 m under its floor, and they fell to killY). */
function floorBeside(g, to, r) {
  const x = to.x + r + 0.6, z = to.z, top = to.y + 2;
  const hit = g.physics?.raycast({ x, y: top, z }, DOWN, 5, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
  if (!hit || hit.distance < 0.05 || hit.normal.y < 0.6) return null; // (none; begun inside a wall; a wall's face)
  return new THREE.Vector3(x, hit.point.y + 0.2, z);
}

export const SPACE = {
  portal: {
    begin(P) { return !!P.F; },
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.2, true); },
    end(P, L) {
      if (L.a.distanceTo(L.b) < 3) return;
      const g = P.game, r = P.ramp('portal', 'r'), life = P.ramp('portal', 'dur'), col = P.domainColour('portal');
      P.cap('portal', Math.round(P.ramp('portal', 'pairs')));
      const ends = [L.a.clone(), L.b.clone()], look = g.godhandLooks?.portal(ends, r, col), rings = look ? [] : ends.map((e) => P.ring(e, r, col)), rest = new WeakMap(); // (the eyes: vfx/godhand/portalpair.js)
      let t = 0;
      const pass = (thing, from, to, pos) => {
        if ((rest.get(thing) ?? 0) > t) return;
        rest.set(thing, t + DROP + 1);
        _o.copy(pos).sub(from).setY(0);
        const at = to.clone().add(_o.setLength(Math.min(_o.length(), r * 0.5) + r + 0.3)); at.y = Math.max(at.y, to.y) + 0.2;
        P.place(thing, at);
        g.events?.emit('god.portal.pass', { what: thing.type === 'creature' ? thing.kind : thing === g.player ? 'courier' : 'thing', by: 'environment' });
      };
      P.keep({
        id: 'portal',
        tick(dt) {
          t += dt;
          for (let s = 0; s < 2; s++) {
            const from = ends[s], to = ends[1 - s];
            for (const c of P.near(from, r)) pass(c, from, to, c.pos);
            P.bodies(from, r, (b, d, dx, dz, p) => pass(b, from, to, _o.set(p.x, p.y, p.z).clone()));
            const pl = g.player;
            if (pl && !P.god.active && pl.pos.distanceTo(from) < r && (rest.get(pl) ?? 0) <= t) {
              rest.set(pl, t + 2);
              const at = floorBeside(g, to, r);
              if (at) g.course?.teleport?.(at, pl.yaw ?? 0); // (no floor at the far end: the Courier is not taken through, casebook rule 275)
            }
          }
          const F = g.matter?.field;
          if (F) { // (what pools in the fuller end runs through to the other)
            const da = F.depthAt(ends[0].x, ends[0].z), db = F.depthAt(ends[1].x, ends[1].z), [hi, lo] = da > db ? [0, 1] : [1, 0];
            if (Math.abs(da - db) > 0.02) { const got = F.take(ends[hi].x, ends[hi].z, r, 1.5 * dt, ['w']); if (got.water > 0) F.pour(ends[lo].x, ends[lo].z, r, got.water, { kind: 'water', feeling: got.feeling }); }
          }
          for (const m of rings) m.rotation.z += dt * 1.5;
          look?.update(dt, t, life);
          return t >= life;
        },
        dispose() { look?.dispose(); rings.forEach((m) => P.drop(m)); },
      });
      P.emit('portal', { len: +L.a.distanceTo(L.b).toFixed(1) });
    },
  },

  fold: {
    begin(P) { return !!P.F; },
    hold(P, L) { P.arts.showBlade(L.a, L.b, 0.6, true); },
    end(P, L) {
      const F = P.F, side = P.ramp('fold', 'side'), h = side / 2;
      if (!F || L.a.distanceTo(L.b) < side) return; // (patches that overlap do not fold)
      const r = F.patch(L.a.x, L.a.z, L.b.x, L.b.z, h);
      // what stands on each patch goes with it
      const move = (from, to) => {
        const off = new THREE.Vector3(to.x - from.x, 0, to.z - from.z), list = [];
        for (const c of P.near(from, h * 1.4)) if (Math.abs(c.pos.x - from.x) < h && Math.abs(c.pos.z - from.z) < h) list.push(c);
        P.bodies(from, h * 1.4, (b, d, dx, dz, p) => { if (Math.abs(dx) < h && Math.abs(dz) < h) list.push(b); });
        return list.map((thing) => { const p = thing.type === 'creature' ? thing.pos : thing.translation(); return [thing, new THREE.Vector3(p.x + off.x, F.groundAt(p.x + off.x, p.z + off.z) + 0.6 || p.y, p.z + off.z)]; });
      };
      const there = [...move(L.a, L.b), ...move(L.b, L.a)];
      for (const [thing, at] of there) P.place(thing, at);
      P.ring(L.a, h, P.domainColour('fold'), 1.2); P.ring(L.b, h, P.domainColour('fold'), 1.2);
      P.emit('fold', { moved: +r.moved.toFixed(2), side: +side.toFixed(1) });
    },
  },

  hasten: {
    begin(P, L) {
      const F = P.F; if (!F) return false;
      const r = P.ramp('hasten', 'r'), dur = P.ramp('hasten', 'dur'), stay = L.shift, at = L.a.clone(), g = P.game;
      F.hasten(at.x, at.z, r, dur, stay ? 0 : P.ramp('hasten', 'scale'));
      if (stay) F.hold(at.x, at.z, r, dur);
      const ring = P.ring(at, r, stay ? 0x8fa0ff : 0xffe08a);
      let t = 0, tick = 0;
      P.keep({
        id: 'hasten',
        tick(dt) {
          t += dt; tick -= dt;
          if (stay) {
            if (tick <= 0) { tick = 1; for (const c of P.near(at, r)) g.creatures.apply(c, 'halt', 1.5, 1, 'courier'); }
            P.bodies(at, r, (b) => { b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true); b.sleep(); });
          }
          ring.material.opacity = 0.3 + 0.25 * Math.sin(t * (stay ? 1 : 8));
          return t >= dur;
        },
        dispose() { if (stay) P.bodies(at, r, (b) => b.wakeUp()); P.drop(ring); },
      });
      P.emit('hasten', { stay, r: +r.toFixed(1) });
      return false; // (done on the press)
    },
  },
};
