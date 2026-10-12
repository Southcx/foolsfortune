// ---------------------------------------------------------------------------------------
// THE SHELLS THAT CHANGE A BODY (CASTER-SHELLS.md section 1: M7 morph, M8 per-body gravity and mass, M9 the three-second recording,
// M11 the mind swap; TYPE-17, 20, 27, 45, 49, 50, 54, 55, 59, 60, 64, 65, 69, 80): a part of the shell runner
// (tools/psygun/shellrunner.js). A body is changed for a while and given back as it was: squashed flat, fired to bisque, shrunk, a pot
// on legs, nailed to a wall, lifted by a column of upturned gravity. The RECORDING keeps where each creature near the Courier was for
// the last three real seconds (Rewind sends one back along it); Echo and Bookmark keep the Courier's own. A creature may be turned to
// fight for the Courier a while (Brainwash, Marionette: shellkit.js `fightFor`), or two may trade minds (their grain, drives, memory
// and grudges: a creature's mind is built of parts, creatures/ai/, so the swap is of its parts). A FOE is never removed or swapped
// outright (rule 4): a shell that would wrenches a blow from it instead.
//
// Prior art: Ratchet & Clank's Morph-O-Ray and Sheepinator (a body for a harmless one, and back), the Walloper's flattening; Braid's
// rewind and Prince of Persia's Sands (a short recording played back); Overwatch's Tracer recall (Bookmark: back to where you were,
// your pool as it was); Psychonauts' and Ghost Trick's possession (a mind moved between bodies); Trigun's Cross Punisher (the stake).
//
//   BODIES (a runner part)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { foesNear } from './shellpayloads.js';
import { centerOf, isBoss, graze, moveCourier, fightFor } from './shellkit.js';

const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _w = new THREE.Vector3();
/** How long the recording keeps (real s) and how often it samples (real s). */
const KEEP = 3.2, SAMPLE = 0.1;

const isJelly = (g, c) => g.jellies && (c.kind === 'slipjelly' || c.kind === 'spirit');
/** A creature set somewhere else (a jelly through its own `place`, so its body and collider come too). */
const put = (g, c, at) => (isJelly(g, c) ? g.jellies.place(c, at) : c.pos.copy(at));
/** A FOE's stage wrenched instead of the change a shell would make (rule 4). */
const wrench = (g, c, power, at) => g.creatures.strike(c, at ?? centerOf(c), UP.clone(), power, 'shot', 'courier', null, 'impact');

/** A body's scale changed for a while and given back (Cartwheel's squash, Shrinker, a slipling). */
export function scaleFor(R, c, sx, sy, dur, { reach = false } = {}) {
  if (!c.root || c.scaled) return;
  const was = c.root.scale.clone(), r0 = c.radius, h0 = c.height;
  c.scaled = true; c.root.scale.set(was.x * sx, was.y * sy, was.z * sx);
  if (reach) { c.radius = r0 * sx; c.height = h0 * sy; }
  R.timed({ t: dur, every: dur, end: () => { c.root.scale.copy(was); c.radius = r0; c.height = h0; c.scaled = false; } });
}

/** A mind swap's parts: what of a creature's mind trades places (its grain, its wants, its memory and its grudges). */
const MIND_PARTS = ['traits', 'drives', 'mem', 'rel'];
function swapMinds(a, b) {
  for (const k of MIND_PARTS) { const t = a[k]; a[k] = b[k]; b[k] = t; }
  if (a.brain && b.brain) { const d = a.brain.drives, m = a.brain.mem; a.brain.drives = b.brain.drives; a.brain.mem = b.brain.mem; b.brain.drives = d; b.brain.mem = m; }
}

export const BODIES = {
  carrier: { wheel: { speed: 14, lift: 0, grav: 1, life: 4, r: 0.35 } },
  hit: {
    // Cartwheel: a clay wheel that rolls along the ground and off walls, flattening what it runs over
    wheel: (R, p, k, dir) => {
      if (k.target) {
        graze(R, p, k.target, k.at, dir, p.row.n.power, 99);
        R.game.creatures.apply(k.target, p.row.n.status, p.row.n.dur, 1);
        if (!isBoss(k.target)) scaleFor(R, k.target, 1.3, p.row.n.squash, p.row.n.dur);
        return false;
      }
      if (k.normal.y > 0.5) { p.vel.y = 0; p.pos.y = k.at.y + 0.3; return false; } // (on the ground: it rolls on)
      p.vel.reflect(k.normal).setY(Math.max(0, p.vel.y)); sfx.clonk?.(R.game.listenerDistance?.(k.at));
      return ++p.bounces > 6;
    },
  },
  fires: {
    cartwheel: (R, row, { muzzle, ray }) => { R.launch('wheel', row, muzzle, ray.dir.clone().setY(Math.min(0, ray.dir.y)).normalize(), { scale: 3, col: 0xc46a45 }); },
    // Echo: for `dur` every plain shot is fired again `lag` later by your ghost, from where you stood
    echo: (R, row) => { R.echo = { left: row.n.dur, lag: row.n.lag }; R.game.fx?.absorbSparkle?.(R.game.player.pos.clone().setY(R.game.player.pos.y + 1)); },
    // Bookmark: marks you; fired again within `dur`, it returns you to the mark, your pool as it was then
    bookmark: (R, row) => {
      const g = R.game, P = g.player, B = R.bookmark;
      if (B) { moveCourier(g, B.pos, { yaw: B.yaw, stop: true }); if (g.lachryma) g.lachryma.value = Math.min(g.lachryma.max, B.pool); g.scene.remove(B.mesh); R.bookmark = null; sfx.shellHit?.(['space'], { tier: row.tier }); return; }
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.05), R.mat(0xe8d080)); mesh.position.copy(P.pos).setY(P.pos.y + 1.8); mesh.userData.zoneFree = true; g.scene.add(mesh);
      R.bookmark = { pos: P.pos.clone(), yaw: P.yaw, pool: g.lachryma?.value ?? 0, left: row.n.dur, mesh };
    },
  },
  lands: {
    // Stake: a ceramic stake nails the creature to the nearest wall behind it
    stake: (R, row, at, normal, target, dir) => {
      const g = R.game, n = row.n; if (!target) return;
      g.creatures.strike(target, at.clone(), dir.clone(), n.power, 'shot', 'courier', null, 'impact');
      if (!target.alive) return;
      const flat = dir.clone().setY(0).normalize(), from = centerOf(target);
      const wall = g.physics.raycast(from, flat, 6, g.player.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type);
      if (wall && !isBoss(target)) { put(g, target, wall.point.clone().addScaledVector(flat, -(target.radius + 0.1)).setY(target.pos.y)); g.creatures.apply(target, 'halt', n.dur, 1); g.fx?.impact?.(wall.point, wall.normal, { sparks: 8, dust: 6 }); }
      else g.creatures.apply(target, 'halt', 1.5, 1);
    },
    // Bisque: the creature is fired to bisque: a statue for `dur`, and every blow on it (an Impact one most) lands for double
    bisque: (R, row, at, normal, target) => {
      if (!target) return; const g = R.game, n = row.n;
      g.creatures.apply(target, n.status, isBoss(target) ? 1.5 : n.dur, 1); g.creatures.apply(target, 'soft', n.dur, 1);
      g.vfx?.play?.('caster.bisque', { pos: at, target: target.root ?? target.body, follow: (h) => target.alive && (h.pos.copy(target.pos), true) });
    },
    // Pottify (M7): the creature is a waddling little pot on legs for `dur`: harmless, slow; a FOE has a stage wrenched instead
    pottify: (R, row, at, normal, target) => {
      if (!target) return; const g = R.game, n = row.n;
      if (isBoss(target)) { wrench(g, target, 8, at); return; }
      const body = target.body; if (!body || target.potted) return;
      target.potted = true; body.visible = false;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.5, 9).translate(0, 0.3, 0), R.mat(0xc46a45)); pot.scale.setScalar(1 / Math.max(0.2, target.root.scale.x)); target.root.add(pot);
      g.creatures.apply(target, 'calm', n.dur, 1); g.creatures.apply(target, 'slow', n.dur, 1);
      g.fx?.absorbSparkle?.(centerOf(target));
      R.timed({ t: n.dur, every: 1 / 15, tick: (e) => { pot.rotation.z = Math.sin(e.age * 9) * 0.15; }, end: () => { target.root.remove(pot); pot.geometry.dispose(); body.visible = true; target.potted = false; } });
    },
    // Upfall: gravity reverses in a column of r for `dur`: everything in it falls up (the Courier too, as anything else would), then down
    upfall: (R, row, at) => {
      const g = R.game, n = row.n, base = at.y, top = base + 10, lifted = new Map(), P = g.player;
      const inCol = (x, y, z) => Math.hypot(x - at.x, z - at.z) < n.r && y > base - 1 && y < top;
      R.timed({ t: n.dur, every: 1 / 30, field: 'column', tier: row.tier, tick: (e) => {
        g.physics.world.forEachRigidBody((b) => {
          if (!b.isDynamic()) return; const t = b.translation(), inside = inCol(t.x, t.y, t.z);
          if (inside && !lifted.has(b.handle)) { lifted.set(b.handle, b); b.setGravityScale(-0.6, true); b.wakeUp(); }
          else if (!inside && lifted.has(b.handle)) { lifted.delete(b.handle); b.setGravityScale(1, true); }
        });
        for (const c of foesNear(g, at, n.r + 1)) if (inCol(c.pos.x, c.pos.y, c.pos.z) && !isBoss(c)) { if (isJelly(g, c)) { c.pos.y = Math.min(top - 2, c.pos.y + 3 * e.every); c.groundY = c.pos.y; } else c.knock?.(new THREE.Vector3(0, 3, 0)); }
        if (P && inCol(P.pos.x, P.pos.y, P.pos.z) && P.pos.y < top - 2) P.vel.y += T.physics.gravity * 1.6 * e.every;
      }, end: () => { for (const b of lifted.values()) if (b.isValid?.() !== false) b.setGravityScale(1, true); for (const c of foesNear(g, at, n.r + 1)) if (isJelly(g, c)) c.groundY = null; } });
    },
    // Swap: you and what the shell hit trade places (a creature, a loose thing); a wall's face takes you to it
    swap: (R, row, at, normal, target, dir, ent) => {
      const g = R.game, P = g.player, here = P.pos.clone();
      if (target && !isBoss(target)) { const there = target.pos.clone(); put(g, target, here); moveCourier(g, there); }
      else if (ent?.body?.isDynamic?.()) { const t = ent.body.translation(), there = new THREE.Vector3(t.x, t.y, t.z); ent.body.setTranslation({ x: here.x, y: here.y + 0.6, z: here.z }, true); moveCourier(g, there); }
      else moveCourier(g, at.clone().addScaledVector(normal, normal.y > 0.5 ? 0.05 : 0.6));
      sfx.shellHit?.(['space'], { tier: row.tier });
    },
    // Shrinker: the creature shrinks to `scale` for `dur`
    shrinker: (R, row, at, normal, target) => {
      if (!target) return;
      if (isBoss(target)) { R.game.creatures.apply(target, 'soft', 3, 1); return; }
      scaleFor(R, target, row.n.scale, row.n.scale, row.n.dur, { reach: true });
    },
    // Rewind: the creature hit goes back to where it was `back` real seconds ago, its blow undone
    rewind: (R, row, at, normal, target) => {
      if (!target) return; const g = R.game, rec = R.recording?.get(target);
      g.creatures.unwind?.(target); target.cancel?.('rewind');
      if (isBoss(target) || !rec?.length) return;
      const want = rec[rec.length - 1].t - row.n.back, then = rec.find((s) => s.t >= want) || rec[0];
      for (let i = rec.length - 1; i > 0; i -= 3) g.fx?.tracer?.(rec[i].pos.clone().setY(rec[i].pos.y + 0.5), rec[i - 1].pos.clone().setY(rec[i - 1].pos.y + 0.5));
      put(g, target, then.pos.clone());
    },
    // Last Word: nothing for `delay`, then the creature takes again all it took in that time
    lastWord: (R, row, at, normal, target) => {
      if (!target) return; const g = R.game, hp0 = target.hp ?? 0;
      R.timed({ delay: row.n.delay, t: 0.05, every: 1, tick: () => { const took = hp0 - (target.hp ?? hp0); if (target.alive && took > 0) { g.creatures.strike(target, centerOf(target), UP.clone(), took * row.n.repeat, 'shot', 'courier', null, 'impact'); g.fx?.shockwave?.(centerOf(target), 1); } } });
    },
    // Brainwash: the creature fights for you until the fight is over (nothing against it for 8 s), then is itself again
    brainwash: (R, row, at, normal, target) => { if (target && !isBoss(target)) fightFor(R.game, target, { dur: 600, power: 1.5, until: (quiet) => quiet > 8 }); },
    // Mind Swap: two creatures hit in turn trade minds for `dur`
    mindSwap: (R, row, at, normal, target) => {
      if (!target || isBoss(target)) return; const g = R.game, A = R.swapA;
      if (!A || !A.c.alive || A.c === target) { R.swapA = { c: target, left: 10 }; g.fx?.absorbSparkle?.(centerOf(target)); return; }
      R.swapA = null; const a = A.c, b = target;
      swapMinds(a, b); a.brain?.signal?.(); b.brain?.signal?.();
      g.vfx?.play?.('caster.lightning', { pos: centerOf(a), from: a.head?.() ?? centerOf(a), to: b.head?.() ?? centerOf(b), tint: 0x9fe8ff });
      R.timed({ t: row.n.dur, every: row.n.dur, end: () => { if (a.traits && b.traits) swapMinds(a, b); } });
    },
    // Marionette: a creature just downed near where it lands stands back up on strings and fights for you for `dur`, then falls for good
    marionette: (R, row, at) => {
      const g = R.game, J = g.jellies; if (!J) return;
      const c = J.list.find((x) => !x.alive && !x.spirit && x.dying == null && !x.stashed && x.pos.distanceTo(at) < 3); if (!c) return;
      const where = c.pos.clone(); J.reform(c); J.place(c, where);
      fightFor(g, c, { dur: row.n.dur, power: 1.5, end: (x) => J.vanish(x, 'courier', 'marionette') });
      g.vfx?.play?.('caster.lightning.arc', { pos: where, from: where.clone().setY(where.y + 8), to: where.clone().setY(where.y + 1.2), follow: (h) => c.fighting && (h.ctx.from.set(c.pos.x, c.pos.y + 8, c.pos.z), h.ctx.to.set(c.pos.x, c.pos.y + 1.2, c.pos.z), true) });
    },
  },
  // the recording (M9): where each creature near the Courier was for the last few real seconds; Echo's ghost; the Bookmark's clock
  tick: (R, dt) => {
    const g = R.game, P = g.player; if (!P) return;
    R.clock = (R.clock ?? 0) + dt;
    if ((R.sampleT = (R.sampleT ?? 0) - dt) <= 0) {
      R.sampleT = SAMPLE; R.recording ||= new Map();
      for (const c of foesNear(g, P.pos, 40)) { const rec = R.recording.get(c) || []; rec.push({ t: R.clock, pos: c.pos.clone() }); while (rec.length && rec[0].t < R.clock - KEEP) rec.shift(); R.recording.set(c, rec); }
      for (const [c, rec] of R.recording) if (!c.alive || rec[rec.length - 1].t < R.clock - KEEP) R.recording.delete(c);
    }
    if (R.echo && (R.echo.left -= dt) <= 0) R.echo = null;
    if (R.swapA && (R.swapA.left -= dt) <= 0) R.swapA = null;
    if (R.bookmark && (R.bookmark.left -= dt) <= 0) { g.scene.remove(R.bookmark.mesh); R.bookmark = null; }
    if (R.bookmark) R.bookmark.mesh.rotation.y += dt * 2;
  },
  // Echo: a plain shot fired again by your ghost, `lag` later, from where you stood
  onShot: (R, e) => {
    if (!R.echo || e?.echo || !e?.dir) return;
    const g = R.game, from = g.player.pos.clone().setY(g.player.pos.y + 1.4), dir = e.dir.clone();
    R.timed({ delay: R.echo.lag, t: 0.05, every: 1, tick: () => {
      const hit = g.physics.raycast(from, dir, 120, g.player.collider, undefined, (k) => !k.isSensor());
      const end = hit ? hit.point : from.clone().addScaledVector(dir, 120), ent = hit?.entity;
      g.fx?.tracer?.(from, end);
      if (ent && ent.type === 'creature' && ent.alive && !ent.ally) g.creatures.strike(ent, end, dir, 1, 'shot', 'courier', null, 'impact');
      else if (ent?.type === 'clapper' && ent.alive) g.clappers.hit(ent, end, dir, 1, 'shot');
      else if (ent?.type === 'breakable') g.breakables.damage(ent, 30, end, dir, 1);
    } });
  },
  clear: (R) => { if (R.bookmark) R.game.scene.remove(R.bookmark.mesh); R.bookmark = null; R.echo = null; R.swapA = null; R.recording?.clear(); },
};
