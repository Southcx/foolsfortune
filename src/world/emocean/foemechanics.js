// ---------------------------------------------------------------------------------------
// THE FOES' MECHANICS: what a foe of the crossing's roster does beyond its path and the patterns its leg throws from it (the roster:
// progress/rail/showcase.js ROSTER and RAIL-MODULES.md 6, Dovina's; the bodies: vfx/railfoes.js, Calissa's). The waves call a role's
// `spawn` once it is on the roll and its `tick` each frame (world/emocean/waves.js); one answer each, as the roster says:
//   escort    tethered to the gunship laid with it: while any escort of it lives the gunship takes no blow (a glance: Dovina, 2026-10-20)
//   gunship   two guns, each a part on the roll that is struck and downed alone; its core is shut until both are down
//   blocker   a wall that takes no blow but at its weak point, held open by a Flash (the plate's `open`) or a Bomb (the toll's onToll)
//   spawner   a hatch: a wave laid `from: 'spawner'` comes out of it, its lid opening; downed, its schools never come
//   grappler  latches on beside the ship and drags it (the ship's pace times latch.pace: Dovina, 2026-10-20) until the roll, the
//             Grapple mount or a shot shakes it off; then it is flung away
//   mine-layer drops a mine each `mine.every` beats it crosses (ROSTER['mine-layer'].mine)
//   mine      a foe of its own (pays `pay`, counts for no medal): bursts into its ring after `fuse` bars or when the ship comes within
//             `near` m, and is gone; shot first, it never bursts
// A blow that a mechanic turns aside reads as a glance (waves.js `glance`: the resist mark and `rail.glance`), never as nothing.
//
// Prior art: R-Type's and Ikaruga's shield escorts (the escort first), Gradius's core behind its barriers (the guns first, then the
// core), Star Fox 64's hatch carriers, Galaga's tractor beam (a foe that takes hold of you until you break free).
//
//   FOE_MECHANICS[role] = { spawn?(W, f, w), tick?(W, f, dt, ctx) }   HOLD_OPEN (real s a Bomb holds a weak point open)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ROSTER } from '../../progress/rail/showcase.js';
import { MOUNTS } from '../../progress/rail/mounts.js';
import { BAR_S } from '../../progress/rail/crossing.js';
import { modeOf } from '../../progress/rail/legs.js';

/** How long a Flash or a Bomb holds a blocker's weak point open (real s): the Flash's own duration. */
export const HOLD_OPEN = MOUNTS.veritome.duration ?? 3;
const LATCH_R = 5, THROWN_S = 1.2; // (the grappler takes hold within 5 m of the ship; flung off, it is gone in 1.2 real s)
const _w = new THREE.Vector3();
const liveOf = (set) => [...(set || [])].some((x) => x.alive);

export const FOE_MECHANICS = {
  escort: {
    spawn(W, f) { // (its charge: the newest gunship on the roll, laid in the same stretch: ROSTER.escort.with)
      const role = ROSTER.escort?.with || 'gunship', g = [...W.foes].reverse().find((x) => x.alive && x.role === role && x.isCore);
      if (!g || !f.body?.link) return;
      f.charge = g; (g.escorts ||= new Set()).add(f);
      f.body.link.target = g.mesh; f.body.link.object.userData.zoneFree = true; W.scene.add(f.body.link.object);
    },
  },
  gunship: {
    spawn(W, f) {
      f.isCore = true;
      const parts = f.body?.parts || {}, hp = Math.max(1, Math.round(f.hp / 2));
      f.guns = ['gunL', 'gunR'].filter((p) => parts[p]).map((part) => W.add({
        kind: 'rail.gunship.gun', name: 'a gunship\'s gun', role: 'gunship', cls: f.cls, aspect: f.aspect, radius: f.radius * 0.35, hp, local: f.local, part,
        armour: () => (liveOf(f.escorts) ? 0 : 1), // (the escort's shield covers the guns too)
        tick: (dt, p) => { if (!f.alive) return false; parts[part].getWorldPosition(_w); W.rail.toLocal(_w, p.local); return true; },
        onHurt: (p) => { f.body?.hit(part); f.body?.hurt?.(part, 1 - p.hp / hp); }, onDown: () => f.body?.down(part), count: false,
      }));
      f.armour = () => (liveOf(f.escorts) || f.guns.some((g) => g.alive) ? 0 : 1); // (shielded, or its core shut behind its guns)
    },
  },
  blocker: {
    spawn(W, f) {
      f.open = 0; f.flashT = 0; // (`open` in it: the Flash's plate holds it, courier/ship/mounts.js plate)
      f.onToll = () => { f.flashT = Math.max(f.flashT, HOLD_OPEN); }; // (the Bomb's toll holds it too)
      f.armour = () => (f.flashT > 0 ? ROSTER.blocker?.armour ?? 1 : 0); // (held open, it takes its row's share of a blow)
    },
    tick(W, f, dt) { f.flashT = Math.max(0, f.flashT - dt); f.open = f.flashT > 0 ? 1 : 0; f.body?.weak?.reveal(f.open > 0); },
  },
  spawner: {
    tick(W, f, dt) { f.hatch = Math.max(0, (f.hatch || 0) - dt * 2); }, // (the lid falls shut after a school is out)
  },
  'mine-layer': {
    tick(W, f, dt) {
      const M = ROSTER['mine-layer']?.mine; if (!M) return;
      f.dropT = (f.dropT ?? 0) + dt; const every = (M.every ?? 1) * BAR_S / 4;
      if (f.dropT < every) return; f.dropT -= every;
      if (Math.abs(f.local.x) < 30 && f.t > BAR_S / 2) W.spawnAt('mine', f.local, { aspect: f.aspect, cls: f.cls, hp: M.hp ?? 1, pay: M.pay, count: false });
    },
  },
  mine: {
    tick(W, f, dt, ctx) {
      const M = ROSTER['mine-layer']?.mine || {}, ship = ctx.ship;
      if (!(f.t >= (M.fuse ?? 2) * BAR_S || (ship && f.local.distanceTo(ship.local) < (M.near ?? 8)))) return;
      const P = W.game.emocean?.trip?.player, view = W.view || 'chase';
      if (M.burst && P) P.play(M.burst.name, M.burst.params || {}, { at: f.local, mode: modeOf(view), kind: 'feel', up: view === 'side' ? [1, 0, 0] : [0, 1, 0] });
      W.game.events?.emit('rail.mine', { at: f.local.clone(), up: view === 'side' ? [1, 0, 0] : [0, 1, 0], by: 'creature' }); // (its flash and shock ring: vfx/railfoemarks.js)
      f.burst = true; return false; // (burst: gone unpaid, its body breaking up where it was: waves.js)
    },
  },
  grappler: {
    spawn(W, f) { f.latch = { pace: ROSTER.grappler?.latch?.pace ?? 0.8 }; f.onGone = () => FOE_MECHANICS.grappler.release(W, f); f.onHurt = () => { f.shaken = true; }; },
    tick(W, f, dt, ctx) {
      const ship = ctx.ship; if (!ship) return;
      if (f.thrownT != null) { f.thrownT += dt; if (f.thrownT > THROWN_S) return false; f.local.addScaledVector(f.fling, dt); return; }
      if (!f.held && f.t > 1 && f.local.distanceTo(ship.local) < LATCH_R) { // (it takes hold: beside the ship, on the side it came from)
        f.held = { off: new THREE.Vector3(Math.sign(f.local.x - ship.local.x) || 1, 0.4, -0.6) };
        ship.drag = f.latch.pace; f.pinned = true; f.body?.pose('attached');
        W.game.events?.emit('rail.latch', { by: 'environment' });
      }
      if (!f.held) return;
      if (ship.turning || f.shaken) { FOE_MECHANICS.grappler.release(W, f, true); return; } // (the roll shakes it off; a shot or the hook)
      f.local.copy(ship.local).add(f.held.off);
      W.rail.toWorld(ship.local, _w); f.body?.latch(_w);
    },
    /** Let go of the ship (its drag gone); flung off when shaken, else only let go (downed, or the crossing over). */
    release(W, f, fling = false) {
      if (!f.held) return;
      f.held = null; f.shaken = false; const ship = W.game.emocean?.ship; if (ship) ship.drag = 1;
      f.body?.latch(null);
      if (fling && f.alive) { f.thrownT = 0; f.fling = new THREE.Vector3(Math.sign(f.local.x) * 18 || 18, 6, 10); f.body?.pose('thrown'); W.game.events?.emit('rail.unlatch', { by: 'courier' }); }
    },
  },
};
