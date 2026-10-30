// ---------------------------------------------------------------------------------------
// WHAT A CLASS'S ART LEAVES RUNNING (CLASS-ARTS.md; the rules and numbers Dovina's, progress/classarts.js CLASS_ARTS): the arts whose
// work outlasts their press, each a small object the runtime ticks until it is done (courier/classarts/body.js `lasting`). Wave 4's:
//   ride      Ride: a staggered creature's body driven by the Courier's movement keys (its mind stood aside: `c.driven`, as the Great
//             Slip Jelly's pattern drives it), the Courier held where they stand; a slip jelly lunges at what is near where it is steered
//   sanctum   Sanctum: a circle no creature outside it may enter (set back on its rim and turned), and while the Courier stands in it every cost
//             nothing (the pool's modifier)
//   lamp      Lamp: a lamp over the Courier (a PointLight lent by the light budget), the veiled crystals and the creatures within its
//             reach shown, and Dread's fog lifted off them (render/daylight.js asks `lampLit`)
//   echo      Encore: the last tool move's arc struck again from where it was made (the moveset's record: body.js recordMove)
//   veil      Vanish: the Courier unseen (the brain's watch list reads `veiledT`, the Crucibelle's song's own), a smoke Courier left behind
//   thicket   Overgrowth: a thicket round where it was grown, its edge held against what is outside it as the sanctum's, and everything in
//             it slowed (the status `slow`, kept on while it stands)
// Each is a modifier with a source you can see (DESIGN.md 22): the thing ridden, the circle, the lamp, the echo, the smoke; its look is
// Calissa's, on `art.use` (`at`, `target`) and `art.end`.
//
// Prior art: the house's own (the Great Slip Jelly's `driven` body, the god hand's ward, the light budget's lent lamps, the mirage's
// decoys), Shadow of the Colossus's and Ape Escape's ridden creatures, Diablo's sanctuary circles, Dark Souls' Sunlight Spear-lit lamp.
//
//   ride(run, c, dur)   sanctum(run, at, r, dur)   lamp(run, reach, dur)   echo(run, rec, delay)   veil(run, dur)   thicket(run, at, r, dur)
//   -> { art, tick(dt) -> true while it lasts, end() }   (body.js keeps them in `run.lasting`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
/** Petra's, where the rows are silent: a ridden creature's speed (m/s) and the reach (m) it lunges at, the time between its lunges (real
 *  s), the dazed beat it is left in when given back; the sanctum's push back to its rim (m/s); the lamp's colour, strength and throw (m);
 *  an echo's reach past the move's own (m) and its cone (rad); the smoke Courier's time past the veil (real s). */
export const LASTING = { ride: { speed: 5, lunge: 3, every: 1.2, daze: 0.3 }, sanctum: { push: 6 }, lamp: { colour: 0xffe2a8, power: 2.2, throw: 14 }, echo: { pad: 0.9, cone: 1.0 }, smoke: 2 };

export function ride(run, c, dur) {
  const g = run.game, R = LASTING.ride, until = run.now + dur, wish = new THREE.Vector3(), face = new THREE.Vector3();
  let next = 0;
  g.creatures?.clearStatus?.(c, 'stun'); c.ally = true; run.held = (run.held || 0) + 1;
  c.driven = (dt) => {
    c.want.copy(run.P.wishDir(wish)).setY(0).multiplyScalar(R.speed); // (the movement keys, as the Courier's own run reads them)
    if (c.want.lengthSq() > 0.01) c.face = face.copy(c.pos).add(c.want);
    const J = g.jellies; if (!J?.windUp || c.kind !== 'slipjelly') return;
    if (c.attack) { J.attackTick(c, dt); return; }
    if ((next -= dt) > 0) return;
    let foe = null, best = R.lunge;
    for (const o of g.creatures?.near?.(c.pos, R.lunge) || []) { if (o === c || !o.alive || o.ally) continue; const d = o.pos.distanceTo(c.pos); if (d < best) { best = d; foe = o; } }
    if (foe) { J.windUp(c, 'lunge', foe); next = R.every; }
  };
  return {
    art: 'ride',
    tick: () => c.alive && run.now < until,
    end: () => {
      run.held = Math.max(0, (run.held || 0) - 1);
      if (c.driven) c.driven = null;
      if (!c.alive) return;
      c.ally = false; g.stun?.add?.(c, R.daze, { by: 'courier', cause: 'ride' }); // (given back dazed a beat: its own mind again)
    },
  };
}

/** A circle's edge held against the creatures that were outside it when it was made (`inside`: those within, let be). */
function holdRim(g, at, r, inside) {
  for (const c of g.creatures?.near?.(at, r + 2) || []) {
    if (!c.alive || c.ally || inside.has(c)) continue;
    const d = _a.set(c.pos.x - at.x, 0, c.pos.z - at.z), n = d.length(), rim = r + (c.radius ?? 0.5);
    if (n >= rim) continue;
    if (n < 1e-3) d.set(1, 0, 0); else d.multiplyScalar(1 / n);
    c.pos.x = at.x + d.x * rim; c.pos.z = at.z + d.z * rim; // (set back on the rim: a creature's own lunge sets its velocity after any push, so the rim holds its place, as the god hand's grip does)
    const into = c.vel ? -(c.vel.x * d.x + c.vel.z * d.z) : 0;
    c.knock?.(_b.copy(d).multiplyScalar(LASTING.sanctum.push + Math.max(0, into))); // (and turned back, its way in undone)
  }
}

export function sanctum(run, at, r, dur) {
  const g = run.game, until = run.now + dur, inside = new Set((g.creatures?.near?.(at, r) || []).filter((c) => c.alive));
  let free = false;
  const setFree = (on) => { if (on === free) return; free = on; if (on) g.lachryma?.addModifier?.('art.sanctum', { costMult: { '*': 0 } }); else g.lachryma?.removeModifier?.('art.sanctum'); };
  return {
    art: 'sanctum', at: at.clone(), r,
    tick: () => {
      if (run.now >= until) return false;
      holdRim(g, at, r, inside);
      setFree(Math.hypot(run.P.pos.x - at.x, run.P.pos.z - at.z) <= r);
      return true;
    },
    end: () => setFree(false),
  };
}

export function thicket(run, at, r, dur) {
  const g = run.game, until = run.now + dur, inside = new Set((g.creatures?.near?.(at, r) || []).filter((c) => c.alive));
  let keepT = 0;
  return {
    art: 'bloom', at: at.clone(), r,
    tick: (dt) => {
      if (run.now >= until) return false;
      holdRim(g, at, r, inside);
      if ((keepT -= dt) > 0) return true;
      keepT = 0.4;
      for (const c of g.creatures?.near?.(at, r) || []) if (c.alive && !c.ally) g.creatures.apply(c, 'slow', 0.6, 0.5, 'courier'); // (slowed while it stands in the thicket, kept on)
      return true;
    },
    end: () => {},
  };
}

export function lamp(run, reach, dur) {
  const g = run.game, L = LASTING.lamp, until = run.now + dur, light = new THREE.PointLight(L.colour, L.power, L.throw, 2);
  g.scene?.add(light); g.lights?.adopt?.(light);
  run.lampUntil = until;
  let shownT = 0;
  return {
    art: 'lantern',
    tick: (dt) => {
      if (run.now >= until) return false;
      const P = run.P; light.position.set(P.pos.x, P.pos.y + 2.4, P.pos.z);
      if ((shownT -= dt) > 0) return true;
      shownT = 0.25;
      g.crystals?.reveal?.(P.pos, reach, 'courier', 'lamp'); // (a veiled crystal within its reach shown, as a song shows one)
      const play = g.weapon?.play;
      for (const c of g.creatures?.near?.(P.pos, reach) || []) if (c.alive && !c.ally) { c.revealed = true; play?.revealed?.set?.(c, 0.5); }
      return true;
    },
    end: () => { light.intensity = 0; light.visible = false; g.scene?.remove(light); run.lampUntil = -1; },
  };
}

export function echo(run, rec, delay) {
  const g = run.game, E = LASTING.echo, at = run.now + delay;
  return {
    art: 'echo',
    tick: () => {
      if (run.now < at) return true;
      const f = _a.set(Math.sin(rec.yaw), 0, Math.cos(rec.yaw));
      for (const c of g.creatures?.near?.(rec.at, rec.reach + E.pad) || []) {
        if (!c.alive || c.ally) continue;
        const d = _b.copy(c.pos).sub(rec.at).setY(0), n = d.length();
        if (n > 0.3 && d.normalize().angleTo(f) > E.cone) continue;
        g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.8), d.lengthSq() > 0 ? d.clone() : f.clone(), rec.power, rec.cause || 'art', 'courier');
      }
      run.fire('echo', { at: [+rec.at.x.toFixed(1), +rec.at.y.toFixed(1), +rec.at.z.toFixed(1)] });
      return false;
    },
    end: () => {},
  };
}

export function veil(run, dur) {
  const g = run.game, P = run.P, until = run.now + dur;
  g.mirage?.raise?.(P.pos.clone(), dur + LASTING.smoke, 1); // (a Courier of smoke where they stood: the minds' decoys, tools/crucibelle/mirage.js)
  P.veiledT = Math.max(P.veiledT || 0, dur); // (unseen from the press: the watch lists read it this frame)
  return {
    art: 'mirageStep',
    tick: () => { if (run.now >= until) return false; P.veiledT = Math.max(P.veiledT || 0, until - run.now); return true; },
    end: () => { if ((P.veiledT || 0) <= LASTING.smoke) P.veiledT = 0; },
  };
}
