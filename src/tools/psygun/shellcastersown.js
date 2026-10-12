// ---------------------------------------------------------------------------------------
// THE LOCK-ON SHELLS, THE LAST THREE FEELINGS AND THE CASTER'S OWN (CASTER-SHELLS.md section 3: TYPE-75, 88 to 99; M3 the steered
// round): a part of the shell runner (tools/psygun/shellrunner.js). Hydra and Zodiac and the RYNO lock what is in view and send
// something at each; Agate fires the two feelings last drunk, Calm clears what is cast round a point, Prismatic gives each creature the
// blow it is weakest to. The Caster's own (tier IV) are paid in the vessel, not the pool (the toll: shells.js asks
// `game.vesselDamage.toll`): Visibomb is flown by the camera, Inside Out and Leyline open black holes, Thirteen backfires when what it
// hit lives (the owner's ruling: the Courier shatters), Corrupt deletes, the god hand reaches into the third person, and The Fool is
// any of the others at double strength. A FOE is never removed outright: it has a stage wrenched instead (rule 4).
//
// Prior art: Outlaw Star's Caster shells #4 (the black hole), #9, #13 (Gene's last against Hazanko); Ratchet & Clank's RYNO, Visibomb
// Gun, Spitting Hydra and Zodiac; .hack's data drain (Corrupt); Mega Man's lock-on volleys; Star Fox's lock-on release.
//
//   CASTERS_OWN (a runner part)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { TRUMPS, TYPE_IDS } from '../../progress/combat/types.js';
import { CASTER_SHELLS, shellById } from '../../progress/combat/castershells.js';
import { foesNear, blast, land } from './shellpayloads.js';
import { centerOf, isBoss, foesInView, spreadDir, shellRand, stash } from './shellkit.js';
import { dropBack } from './shellspacetime.js';
import { zap } from './shellsplitchain.js';

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), _v = new THREE.Vector3();
const aimPoint = (g, ray, range = 60) => g.physics.raycast(ray.origin, ray.dir, range, g.player.collider, undefined, (k) => !k.isSensor());
/** The foes within `w` m of a line, out to `range` (stopping at the first wall unless `through`). */
function alongLine(g, from, dir, range, w, through = false) {
  const wall = through ? null : g.physics.raycast(from, dir, range, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type);
  const len = wall ? wall.distance : range, out = new Set();
  for (let s = 0; s < len; s += Math.max(1, w)) for (const c of foesNear(g, _v.copy(from).addScaledVector(dir, s), w)) out.add(c);
  return { foes: [...out], end: from.clone().addScaledVector(dir, len) };
}
/** A FOE's stage wrenched (rule 4). */
const wrench = (g, c, power) => g.creatures.strike(c, centerOf(c), UP.clone(), power, 'shot', 'courier', null, 'impact');
/** Gone outright, as the shell says (a jelly through its own `vanish`). */
const unmake = (g, c, cause) => { if (c.vanish) c.vanish('courier', cause); else g.creatures.strike(c, centerOf(c), UP.clone(), 999, 'shot', 'courier'); };
/** The feeling a type is the damage of (weather.js TYPE_OF, turned round). */
const FEEL_OF_TYPE = { impact: 'fury', ego: 'wonder', influence: 'desire', illusion: 'mirth', delirium: 'dread' };

export const CASTERS_OWN = {
  carrier: {
    lance: { speed: 28, lift: 0, grav: 0, life: 3, r: 0.2 },
    rocket: { speed: 22, lift: 0, grav: 0, life: 4, r: 0.25 },
    visi: { speed: 14, lift: 0, grav: 0, life: 8, r: 0.3 },
  },
  hit: {
    lance: (R, p, k, dir) => { if (k.target) R.game.creatures.strike(k.target, k.at, dir, p.row.n.power, 'shot', 'courier', null, 'impact'); R.game.hud?.hitmarker?.(false); return true; },
    rocket: (R, p, k) => { blast(R, k.at, p.row.n.r, p.row.n.power, 'explosion'); sfx.explosion?.(R.game.listenerDistance?.(k.at)); return true; },
    visi: (R, p, k) => { visiBurst(R, p, k.at); return true; },
  },
  fly: {
    lance: (R, p, dt) => home(p, dt, 5),
    rocket: (R, p, dt) => { if (p.age > 0.25) home(p, dt, 3.5); },
    // Visibomb (M3): it flies where the Courier looks, and the camera rides it
    visi: (R, p) => {
      const g = R.game, P = g.player; P.lookDir?.(_v); if (_v.lengthSq() > 0.5) p.vel.copy(_v).multiplyScalar(p.C.speed);
      const d = p.vel.clone().normalize(); p.camPos.copy(p.pos).addScaledVector(d, -1.8).addScaledVector(UP, 0.45); p.camLook.copy(p.pos).addScaledVector(d, 6);
    },
  },
  expire: { visi: (R, p) => visiBurst(R, p, p.pos), rocket: (R, p) => blast(R, p.pos, p.row.n.r, p.row.n.power * 0.5, 'explosion') },
  fires: {
    // Hydra: locks up to `count` creatures in view and sends a lance at each
    hydra: (R, row, { muzzle, ray }) => {
      const foes = foesInView(R.game, row.n.count);
      if (!foes.length) { R.launch('lance', row, muzzle, ray.dir, { scale: 1.4 }); return; }
      foes.forEach((c, i) => R.launch('lance', row, muzzle, spreadDir(ray.dir, 30), { scale: 1.4, extra: { target: c, delay: i * 0.05 } }));
    },
    // RYNO: a volley of `count` homing rockets, spiralling out, shared among what is in view
    ryno: (R, row, { muzzle, ray }) => {
      const foes = foesInView(R.game, 12);
      for (let i = 0; i < row.n.count; i++) R.launch('rocket', row, muzzle, spreadDir(ray.dir, 70), { scale: 1.5, col: 0xff9a4a, speed: 14 + shellRand() * 8, extra: { target: foes.length ? foes[i % foes.length] : null } });
    },
    // Zodiac: marks up to `count` creatures in view; a beam of starlight falls on each, one after another
    zodiac: (R, row) => {
      const g = R.game, n = row.n;
      foesInView(g, n.count).forEach((c, i) => R.timed({ delay: 0.5 + i * 0.15, t: 0.05, every: 1, tick: () => {
        if (!c.alive) return; const at = centerOf(c);
        zap(g, at.clone().setY(at.y + 30), at, 0xfff4d6);
        g.creatures.strike(c, at, DOWN.clone(), n.power, 'shot', 'courier', null, 'ego');
      } }));
      sfx.shellFall?.(0.5, row.tier);
    },
    // Visibomb: the camera rides the shell for `dur`; fly it where you look; the next shell fired (or a touch) bursts it
    visibomb: (R, row, { muzzle, ray }) => {
      const g = R.game, p = R.launch('visi', row, muzzle, ray.dir, { life: row.n.dur, scale: 2, col: 0x9fe8ff, extra: { camPos: muzzle.clone(), camLook: muzzle.clone().addScaledVector(ray.dir, 6) } });
      R.visi = p;
      g.cinema?.shot?.('visibomb', { pos: p.camPos, look: p.camLook, fov: 12, bars: 0, ease: 10 });
    },
    // Thirteen: a bolt the size of a house through everything to the horizon, every damage type at once. If what it hit lives, you shatter
    thirteen: (R, row, { ray, muzzle }) => {
      const g = R.game, n = row.n, { foes, end } = alongLine(g, ray.origin, ray.dir, 200, 2.5, true);
      zap(g, muzzle, end, 0x9cff8a); zap(g, muzzle, end, 0xffd860);
      g.glitch?.pulse?.({ dur: 0.5, drain: 1, split: 0.6 });
      for (const c of foes) for (const t of TYPE_IDS) g.creatures.strike(c, centerOf(c), ray.dir.clone(), n.power / TYPE_IDS.length, 'shot', 'courier', null, t);
      if (!foes.length) return;
      R.timed({ delay: 0.2, t: 0.05, every: 1, tick: () => { if (foes.some((c) => c.alive)) g.death?.begin?.({ why: 'thirteen', by: 'courier' }); } });
    },
    // Calm: a beam that clears every status, summon and field round where it lands
    calm: (R, row, { ray, muzzle }) => {
      const g = R.game, n = row.n, at = aimPoint(g, ray, 40)?.point ?? ray.origin.clone().addScaledVector(ray.dir, 40);
      g.fx?.tracer?.(muzzle, at);
      for (const c of g.creatures.near(at, n.r)) { for (const s of [...(c.status?.keys?.() || [])]) g.creatures.clearStatus?.(c, s); c.releaseFight?.(); }
      for (const p of R.flying) if (p.pos.distanceTo(at) < n.r) p.age = p.life + 1;
      for (const d of R.decoys) if (d.pos.distanceTo(at) < n.r) d.t = 0;
      g.pulse?.emit?.(at, n.r, 0xd04a3a, { life: 1.2 });
    },
    // Prismatic: a rainbow round through everything in line: each creature gets the feeling it is weakest to
    prismatic: (R, row, { ray, muzzle }) => {
      const g = R.game, { foes, end } = alongLine(g, ray.origin, ray.dir, 40, 1.2);
      g.fx?.tracer?.(muzzle, end);
      for (const c of foes) {
        const weak = Object.keys(TRUMPS).find((t) => TRUMPS[t] === c.affinity) || TYPE_IDS[Math.floor(shellRand() * TYPE_IDS.length)];
        g.creatures.strike(c, centerOf(c), ray.dir.clone(), 2, 'shot', 'courier', null, weak);
        g.creatures.build(c, weak, 4, 'courier', 'shell');
        g.paintmap?.stamp?.(c.pos.x, c.pos.y, c.pos.z, 1, FEEL_OF_TYPE[weak], 0.7);
      }
    },
    // The Fool: any other shell after the founding eleven, at double strength
    theFool: (R, row, ctx) => {
      const pool = CASTER_SHELLS.filter((s) => s.no >= 11 && s.no < 99), pick = pool[Math.floor(shellRand() * pool.length)];
      const n = { ...pick.n }; for (const k of ['power', 'count']) if (typeof n[k] === 'number') n[k] *= 2;
      R.fire({ ...pick, n }, ctx);
    },
  },
  lands: {
    // Agate: the two feelings you last drank at once: the stronger acts, the weaker colours it
    agate: (R, row, at, normal, target, dir) => {
      const g = R.game, d = Object.entries(g.draught || {}).sort((a, b) => b[1] - a[1]).map(([f]) => f);
      const [strong, weak] = [d[0] || 'wonder', d[1] || d[0] || 'mirth'], feelRow = shellById(strong);
      if (feelRow) land(R, feelRow, at, normal, target, dir);
      if (weak !== strong) g.paintmap?.stamp?.(at.x, at.y, at.z, 1.4, weak, 0.5);
    },
    // Inside Out: a small black hole: the creature is turned inside out and gone (a FOE has a stage torn off instead)
    insideOut: (R, row, at) => {
      const g = R.game, c = foesNear(g, at, row.n.r)[0];
      g.vfx?.play?.('shell.insideOut', { pos: at.clone().setY(at.y + 0.8), target: c?.root });
      for (const x of foesNear(g, at, row.n.r * 2)) x.knock?.(_v.subVectors(at, x.pos).setY(0).normalize().multiplyScalar(4));
      if (!c) return;
      if (isBoss(c)) wrench(g, c, 30); else R.timed({ delay: 0.6, t: 0.05, every: 1, tick: () => c.alive && unmake(g, c, 'insideOut') });
    },
    // Leyline: a black hole throws the creature straight up into the stars; it falls back from `up` m `dur` later
    leyline: (R, row, at, normal, target) => {
      const g = R.game, n = row.n; if (!target) return;
      if (isBoss(target)) { wrench(g, target, 20); return; }
      const where = target.pos.clone(); stash(g, target);
      zap(g, where, where.clone().setY(where.y + n.up), 0xd8d0ff);
      R.timed({ delay: n.dur, t: 0.05, every: 1, tick: () => dropBack(R, target, where, n.up, 6) });
    },
    // Corrupt: drawn in glitch, its body and mind scrambled for `dur`, then deleted (a FOE is wrenched a stage instead)
    corrupt: (R, row, at, normal, target) => {
      const g = R.game, n = row.n; if (!target) return;
      g.vfx?.play?.('shell.corrupt', { pos: centerOf(target), target: target.root ?? target.body, follow: (h) => target.alive && (h.pos.copy(target.pos), true) });
      g.creatures.apply(target, n.status, n.dur, 1);
      R.timed({ delay: n.dur, t: 0.05, every: 1, tick: () => { if (!target.alive) return; if (isBoss(target)) wrench(g, target, 20); else unmake(g, target, 'corrupt'); } });
    },
    // God Hand: the hand reaches in, grabs what is where the shell lands and throws it the way you aim
    godHand: (R, row, at) => {
      const g = R.game, n = row.n, aim = new THREE.Vector3(0, 0, -1).applyQuaternion(g.camera.quaternion).setY(0).normalize().setY(0.35).normalize();
      const c = foesNear(g, at, n.r)[0];
      g.vfx?.play?.('shell.mallet.land', { pos: at });
      if (c) { if (isBoss(c)) wrench(g, c, 10); else { c.knock?.(aim.clone().multiplyScalar(n.throw)); g.creatures.strike(c, centerOf(c), aim.clone(), 3, 'shot', 'courier', null, 'impact'); } return; }
      let best = null, bd = n.r;
      g.physics.world.forEachRigidBody((b) => { if (!b.isDynamic() || g.physics.links.has(b.handle)) return; const t = b.translation(), d = _v.set(t.x - at.x, t.y - at.y, t.z - at.z).length(); if (d < bd) { bd = d; best = b; } });
      if (best) g.physics.kick(best, { x: aim.x * n.throw * best.mass(), y: aim.y * n.throw * best.mass(), z: aim.z * n.throw * best.mass() });
    },
  },
  // the Visibomb bursts when the next shell is fired
  onShellFired: (R) => { if (R.visi && R.flying.includes(R.visi)) R.visi.age = R.visi.life + 1; },
  clear: (R) => { if (R.visi) R.game.cinema?.cut?.('visibomb'); R.visi = null; },
};

/** A homing round's steering: toward its target (or the nearest foe once its own is gone), turning at `turn` per real second. */
function home(p, dt, turn) {
  if (p.delay > 0) { p.delay -= dt; return; }
  const c = p.target?.alive ? p.target : null; if (!c) return;
  const want = centerOf(c).sub(p.pos).normalize().multiplyScalar(p.vel.length());
  p.vel.lerp(want, Math.min(1, dt * turn));
}
/** The Visibomb's burst: a big blast, and the camera given back. */
function visiBurst(R, p, at) {
  const g = R.game;
  if (p.burst) return; p.burst = true;
  blast(R, at, p.row.n.r, p.row.n.power, 'explosion'); sfx.explosion?.(g.listenerDistance?.(at)); g.onExplosion?.(at, p.row.n.r);
  g.cinema?.unshot?.('visibomb'); if (R.visi === p) R.visi = null;
}
