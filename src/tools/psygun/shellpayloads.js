// ---------------------------------------------------------------------------------------
// WHAT A CASTER SHELL DOES WHERE IT LANDS: the payloads of docs/plans/CASTER-SHELLS.md section 1 (blast, type, status, pull, crude,
// charm, decoy, morph, mass, feel, world), each a function of the shell's row (progress/combat/castershells.js: its numbers `n`) and the
// place it landed, for the shell runner (tools/psygun/shellrunner.js) to call. Most shells are their payloads read generically; the
// few whose recipe says more than its parts (Napalm's delayed fire, the Detonator's wait, the feelings) have their own entry in LANDS.
// What lasts a while is a TIMED effect the runner ticks (`R.timed`): a field, a status kept on, a cloud.
//
// Prior art: Noita's spell modifiers and Ratchet & Clank's Omega mods (an effect is a part, applied the same way whatever carried it),
// and the JRPG's status spells (a timer on the target, the target's own code deciding what it means: creatures.js STATUSES).
//
//   land(R, row, at, normal, target, dir)   blast(R, at, r, power, cause, type)   foesNear(g, at, r)   LANDS[id]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { COLOR, TYPE_OF } from '../../progress/weather.js';
import { stream } from '../../core/rng.js';
import { shellLook } from '../../vfx/shelllooks.js'; // (Calissa's: each shell's look, by its id)
const simRand = stream('tools/psygun/shellpayloads'); // (the simulation's chance: core/rng.js, the same twice)

const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _d = new THREE.Vector3();
/** A pot's damage a unit of power (the Bomb's 260 at power 4, config.js shells.bomb). */
const POT_PER_POWER = 65;

/** The creatures near a point that a shell may work on: alive, and not the Courier's own (an ally, a friend). */
export const foesNear = (g, at, r) => (g.creatures?.near?.(at, r) || []).filter((c) => c.alive && !c.ally);

/** A blast: damage falling off to the edge on the creatures, clapperjars and pots within r, and a shove. */
export function blast(R, at, r, power = 1, cause = 'explosion', type) {
  const g = R.game;
  for (const c of foesNear(g, at, r)) {
    const k = Math.max(0.3, 1 - c.pos.distanceTo(at) / r);
    g.creatures.strike(c, at.clone(), _d.subVectors(c.pos, at).setY(0.3).normalize().clone(), power * k, cause, 'courier', null, type);
  }
  for (const c of g.clappers?.list || []) if (c.alive && !c.ally && c.pos.distanceTo(at) < r) g.clappers.hit(c, at, _d.subVectors(c.pos, at).normalize(), Math.max(1, power), 'shot');
  for (const ent of [...(g.breakables?.items || [])]) {
    const t = ent.body.translation(); _v.set(t.x, t.y, t.z); const d = _v.distanceTo(at);
    if (d < r) g.breakables.damage(ent, POT_PER_POWER * power * (1 - d / r), _v.clone(), _v.clone().sub(at).normalize(), 1);
  }
  R.shells.pushBurst(at, r * 1.2, 2 + power);
  g.fx?.explosion?.(at, Math.max(0.5, r * 0.5));
}

/** A status on the target, or on every foe within r of the point. */
function statusOn(R, row, at, target) {
  const g = R.game, n = row.n, name = n.status; if (!name) return;
  const who = target ? [target] : foesNear(g, at, n.r || 2);
  for (const c of who) g.creatures.apply(c, name, n.dur || 4, 1);
}

/** A feeling's colour, as a three.js colour. */
const feelCol = (f) => new THREE.Color(COLOR[f] ?? 0xffffff);
/** A puff of motes in a colour round a point (the look until Calissa's; every shell that called it has its look in vfx/shelllooks.js
 *  now, so it draws nothing: Petra's to remove with its calls). */
export function motes(g, at, col, n = 18, r = 1, up = 2) {
  // (was: n motes of col within r, rising at up)
}

/** A feeling's burst (the Feelings family, TYPE-81 to TYPE-87): its paint on the ground round the point, its colour in the air, and
 *  its damage type's build on every foe within reach (TYPE_OF: Wonder builds Ego's, Dread Delirium's...). */
function feel(R, row, at, target) {
  const g = R.game, f = row.n.feeling, r = row.n.r || 3;
  g.paintmap?.stamp(at.x, at.y, at.z, Math.min(3, r * 0.3), f, 0.7);
  motes(g, at, feelCol(f), 24, Math.min(3, r * 0.2));
  for (const c of target ? [target] : foesNear(g, at, r)) g.creatures.build(c, TYPE_OF[f], 3, 'courier', 'shell');
}

/** Each payload, read generically from a row. */
const PAYLOADS = {
  blast: (R, row, at) => blast(R, at, row.n.r || 1.5, row.n.power || 1, 'explosion', row.n.type),
  type: (R, row, at, normal, target, dir) => { if (target) R.game.creatures.strike(target, at.clone(), dir.clone(), row.n.power || 1, 'shot', 'courier', null, row.n.type || 'impact'); },
  status: (R, row, at, normal, target) => statusOn(R, row, at, target),
  feel,
};

/** What lands has its own way: the shells whose recipe says more than its parts. Each returns nothing; the runner calls it with the
 *  shell's row and the place, the target (a creature) if one was hit, and the way it was going. */
export const LANDS = {
  // Mallet: the head slams down where it lands: a big blast and a sure stun round it
  mallet: (R, row, at) => { blast(R, at, row.n.r, row.n.power, 'slam'); for (const c of foesNear(R.game, at, row.n.r)) R.game.stun?.add?.(c, 99, { by: 'courier', cause: 'slam' }); R.game.fx?.shockwave?.(at, row.n.r); },
  // Napalm: a slick that catches a second later and burns for `dur`
  napalm: (R, row, at) => {
    const g = R.game, n = row.n; g.paintmap?.slick(at.x, at.y, at.z, n.r, 1);
    R.timed({ delay: n.delay, t: n.dur, every: 0.5, field: 'pool', tier: row.tier,
      tick: () => { for (const c of foesNear(g, at, n.r)) g.creatures.strike(c, c.pos.clone(), UP, n.power, 'explosion', 'courier', null, 'impact'); motes(g, at, new THREE.Color(0xff7a2a), 10, n.r * 0.5, 2.5); } });
  },
  // Detonator: the charge waits on what it stuck to, until the next shell is fired (the runner's `armed`)
  detonator: (R, row, at, normal, target) => { R.arm({ row, at: at.clone(), target }); },
  // Lightning Rod: the creature hit draws your misses to it for `dur` (the runner bends a missed shot within `bend` m to it)
  lightningRod: (R, row, at, normal, target) => { if (target) R.rod = { c: target, t: row.n.dur, bend: row.n.bend }; motes(R.game, at, new THREE.Color(0xd99a5a), 12, 0.4); },
  // Static Cling: loose props within r fly to the creature hit and stick, each one a hit, and it slows under them
  staticCling: (R, row, at, normal, target) => {
    if (!target) return; const g = R.game, n = row.n, stuck = new Set();
    g.creatures.apply(target, 'slow', n.dur, 1);
    R.timed({ t: n.dur, every: 0.1, tick: () => {
      if (!target.alive) return;
      g.physics.world.forEachRigidBody((b) => {
        if (!b.isDynamic() || g.physics.links.has(b.handle) || b.mass() > 40 || stuck.has(b.handle)) return;
        const t = b.translation(); _v.set(target.pos.x - t.x, target.pos.y + target.height * 0.5 - t.y, target.pos.z - t.z); const d = _v.length();
        if (d > n.r) return;
        if (d < 0.9) { stuck.add(b.handle); g.creatures.strike(target, target.pos.clone(), UP, n.power, 'shot'); return; }
        g.physics.kick(b, { x: _v.x / d * 2 * b.mass(), y: _v.y / d * 2 * b.mass(), z: _v.z / d * 2 * b.mass() });
      });
    } });
  },
  // Balloon: the creature hit loses its weight and bobs up on the air for `dur`, an easy juggle
  balloon: (R, row, at, normal, target) => { if (!target) return; R.game.creatures.apply(target, 'halt', row.n.dur, 1); R.timed({ t: row.n.dur, every: 0.1, tick: (e) => target.alive && target.knock?.(new THREE.Vector3(0, e.left > row.n.dur * 0.5 ? 2.2 : 0.4, 0)) }); },
  // Leadweight: crushed to the ground, half speed, no jumps
  leadweight: (R, row, at, normal, target) => { if (!target) return; R.game.creatures.apply(target, 'slow', row.n.dur, 1); R.timed({ t: row.n.dur, every: 0.1, tick: () => target.alive && target.knock?.(new THREE.Vector3(0, -6, 0)) }); R.game.fx?.shockwave?.(target.pos, 1); },
  // Weather Away: the clay it hits dries and cracks: a creature softens (double from every blow), a pot crumbles
  weatherAway: (R, row, at, normal, target, dir, hitEnt) => {
    const g = R.game; if (target) g.creatures.apply(target, 'soft', row.n.dur, 1);
    if (hitEnt?.type === 'breakable') g.breakables.damage(hitEnt, 999, at.clone(), dir.clone(), 1);
    motes(g, at, new THREE.Color(0xc9a27a), 14, 0.6, 0.6);
  },
  // Infector: the creature hit fights its own side for `dur` (charmed and counted the Courier's); when it falls the infection jumps on
  infector: (R, row, at, normal, target) => { if (target) infect(R, row, target, row.n.dur); },
  // Pottify (its body swap is M7, later): for now it is calmed and slowed, harmless, for `dur`
  pottify: (R, row, at, normal, target) => { if (!target) return; R.game.creatures.apply(target, 'calm', row.n.dur, 1); R.game.creatures.apply(target, 'slow', row.n.dur, 1); motes(R.game, at, new THREE.Color(0xe8d6c0), 24, 0.6); },
  // Stage Fright: every creature in r freezes in a spotlight, its guard dropped, and a crowd murmurs (Wanda's)
  stageFright: (R, row, at) => { const g = R.game; for (const c of foesNear(g, at, row.n.r)) { g.creatures.apply(c, 'doubt', row.n.dur, 1); g.creatures.apply(c, 'halt', Math.min(2, row.n.dur), 1); } sfx.crowdMurmur?.(row.n.dur); g.pulse?.emit?.(at, row.n.r, 0xfff4d6, { life: 0.8 }); },
  // Lullaby: a cloud of drifting notes; creatures inside sleep, and the notes are played in the music's scale
  lullaby: (R, row, at) => { const g = R.game, n = row.n; R.timed({ t: n.dur, every: 0.5, field: 'cloud', tier: row.tier, tick: () => { for (const c of foesNear(g, at, n.r)) g.creatures.apply(c, 'sleep', 2, 1); motes(g, at, new THREE.Color(0xbcd6ff), 4, n.r * 0.6, 0.4); sfx.lullabyNote?.(g.music?.scale?.(), g.music?.grid?.()?.root); } }); },
  // Wonder: creatures in r stop and stare; every signature within `reveal` m is shown (the pulse)
  wonder: (R, row, at, normal, target) => { feel(R, row, at, target); statusOn(R, row, at, null); R.game.pulse?.emit?.(at, row.n.reveal, COLOR.wonder, { life: 1.6 }); },
  // Mirth: creatures fall over laughing (a stun), and loose things bounce
  mirth: (R, row, at, normal, target) => { feel(R, row, at, target); for (const c of foesNear(R.game, at, row.n.r)) R.game.stun?.add?.(c, 99, { by: 'courier', cause: 'shell' }); R.shells.pushBurst(at, row.n.r, 3); },
  // Desire: every creature, loose cube and drop of Lachryma in r drifts to the point for `dur`
  desire: (R, row, at, normal, target) => {
    const g = R.game, n = row.n; feel(R, row, at, target);
    R.timed({ t: n.dur, every: 0.1, tick: () => {
      for (const c of foesNear(g, at, n.r)) { _v.subVectors(at, c.pos).setY(0); const d = _v.length(); if (d > 0.8) c.knock?.(_v.multiplyScalar(2.5 / d)); }
      for (const b of g.baubles?.list || []) if (b.pos?.distanceTo?.(at) < n.r && b.vel) b.vel.addScaledVector(_v.subVectors(at, b.pos).normalize(), 0.6);
    } });
  },
  // Fury: the creature hit is enraged, its output at the top, and it takes double (both ways is the creature's to read: `fury`)
  fury: (R, row, at, normal, target) => { if (!target) return; feel(R, row, at, target); target.emo = 1; target.fury = row.n.dur; R.game.creatures.apply(target, 'soft', row.n.dur, 1); },
  // Gall: a cloud; creatures inside retch and stop, over and over
  gall: (R, row, at, normal, target) => { const g = R.game, n = row.n; feel(R, row, at, target); R.timed({ t: n.dur, every: 1.2, field: 'cloud', tier: row.tier, tick: () => { for (const c of foesNear(g, at, n.r)) g.creatures.apply(c, 'halt', 0.6, 1); motes(g, at, feelCol('gall'), 10, n.r * 0.6, 0.5); } }); },
  // Grief: a small cloud follows the creature and rains on it; slowed, it weeps Lachryma you can drink
  grief: (R, row, at, normal, target) => {
    if (!target) return; const g = R.game, n = row.n; feel(R, row, at, target); g.creatures.apply(target, 'slow', n.dur, 1);
    R.timed({ t: n.dur, every: 1, tick: () => { if (!target.alive) return; motes(g, target.pos.clone().setY(target.pos.y + target.height + 0.6), feelCol('grief'), 6, 0.4, -2); g.baubles?.spawn?.(target.pos.clone().setY(target.pos.y + 0.5), 1, { spread: 0.4, up: 2 }); } });
  },
  // Dread: every creature in r flees the point
  dread: (R, row, at, normal, target) => { feel(R, row, at, target); statusOn(R, row, at, null); },
};

/** The infection: charmed (it will not attack, and it is the Courier's for the blows: an ally) for `dur`; when it falls inside that
 *  time, it jumps to the nearest of its kind's side within 8 m with what is left. */
function infect(R, row, c, dur) {
  const g = R.game; g.creatures.apply(c, 'charm', dur, 1); c.infected = dur;
  motes(g, c.pos.clone().setY(c.pos.y + c.height * 0.5), new THREE.Color(0x8ad06a), 16, 0.5);
  R.timed({ t: dur, every: 0.25, tick: (e) => {
    if (c.alive) return;
    e.left = 0; const next = foesNear(g, c.pos, 8).find((x) => x !== c && !x.infected);
    if (next && row.n.jumps) infect(R, row, next, Math.max(2, dur - e.age));
  }, end: () => { c.infected = 0; } });
}

/** What a shell does where it lands: its own way if it has one, else each payload in turn; and Wanda's landing sound. */
export function land(R, row, at, normal = UP, target = null, dir = UP, hitEnt = null) {
  sfx.shellHit?.(row.payloads, { tier: row.tier, type: row.n.type || null, feeling: row.n.feeling || null });
  shellLook(R.game, 'land', row, { at, normal, target, dir, ent: hitEnt });
  const own = LANDS[row.id];
  if (own) return own(R, row, at, normal, target, dir, hitEnt);
  for (const p of row.payloads) PAYLOADS[p]?.(R, row, at, normal, target, dir);
}
