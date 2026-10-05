// ---------------------------------------------------------------------------------------
// WHAT COMES OUT OF A LOCKHEART: each outcome (tools/lockheart/table.js) done through the systems everything else uses (creatures.js's
// statuses and strikes, stun.js, spirits.js, the cubes, the chests, the slip, the particles). `power` is how full the coffin was when
// it was opened (1 full, up to 2), `reach` how far it reaches (the WIDE key doubles it). Each emits nothing itself: the Lockheart says
// what came out (`lockheart.outcome`), and tracking.js says it.
//
// The SLIP NUKE is the jackpot and is made to look it: a column of slip thrown up and coming down over everything near (thousands of
// GPU particles: vfx/sprites.js), every creature against them in reach burst, every pot broken, the ground drowned in slip.
//
//   OUTCOME_FX[id](game, at, { power, reach, by }) -> n (how many things it touched)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { REL } from '../../creatures/ai/index.js';
import { sfx } from '../../audio/sfx.js';
import { ECON } from '../../progress/econ/table.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/lockheart/outcomes');       // (what the outcome decides: the chest's tier; core/rng.js, the same twice)
const fxRand = stream('tools/lockheart/outcomes.fx');     // (its spray: a stream of its own, so the particles never shift the tier's draws)

const UP = new THREE.Vector3(0, 1, 0);
const rnd = (a, b) => a + fxRand() * (b - a);
const foes = (g, at, r) => g.creatures.near(at, r).filter((c) => !c.ally);
const burst = (g, at, n, color, { speed = 6, up = 4, life = 1.4, size = 0.12, gravity = 6, alpha = 0.8 } = {}) => {
  const fx = g.fx?.alpha; if (!fx?.emit) return;
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) { const d = new THREE.Vector3().randomDirection(); d.y = Math.abs(d.y) * up / speed + 0.2; fx.emit({ pos: at.clone(), vel: d.normalize().multiplyScalar(speed * rnd(0.4, 1)), life: life * rnd(0.6, 1), size, sizeEnd: size * 0.3, color: c, alpha, drag: 0.8, gravity }); }
};

export const OUTCOME_FX = {
  dud(g, at) { burst(g, at.clone().setY(at.y + 0.3), 6, 0x8a8070, { speed: 0.8, up: 1, life: 2, size: 0.05, gravity: -0.5 }); sfx.fizzle?.(); return 0; },
  bite(g, at, { power }) {
    const took = g.lachryma.drain(25 * power, 'lockheart'); const P = g.player;
    P.shake = Math.max(P.shake || 0, 0.4); burst(g, at, 20, 0x8a2a3a, { speed: 3, size: 0.08 }); sfx.jellySquelch?.(1, 1.2);
    return Math.round(took);
  },
  spill(g, at, { power }) { g.baubles?.spawn(at.clone().setY(at.y + 0.3), Math.round(6 + 6 * power), { spread: 1.2, up: 4 }); return Math.round(6 + 6 * power); },
  cubes(g, at, { power }) { const w = Math.round(ECON.lockheart.cubes * power); g.cubes?.burst?.(at.clone().setY(at.y + 0.4), w, { count: 6 + Math.round(4 * power), up: 5, from: 'lockheart' }); return w; },
  mend(g, at, { power }) {
    g.lachryma.gain(g.lachryma.max, 'lockheart');
    g.lachryma.addModifier('mend', { regenMult: 2 + power, regenDelayMult: 0.3 });
    setTimeout(() => g.lachryma.removeModifier('mend'), 18000 * power);
    burst(g, at, 30, 0xb8f2a6, { speed: 2, up: 3, gravity: -1, size: 0.08 }); sfx.mended?.();
    return 1;
  },
  daze(g, at, { power, reach, by }) {
    let n = 0;
    for (const c of foes(g, at, reach)) { if (g.stun?.add(c, 1.3 * power, { by, cause: 'lockheart' })) n++; }
    for (const c of g.clappers?.list || []) if (c.alive && !c.ally && c.pos.distanceTo(at) < reach) { g.clappers.stun(c, 3 + power, g.shells.glowOutline, g.shells.xray); n++; }
    g.glyphs?.pop('star', at.clone().setY(at.y + 1), { color: 0xffd76a, size: 1.2, life: 1, burst: true, ring: true });
    burst(g, at.clone().setY(at.y + 0.8), 60, 0xffd76a, { speed: reach * 1.2, up: 0.5, gravity: 0, life: 0.6, size: 0.1 });
    g.ai?.stimuli.emit('light', at, { radius: reach * 1.5, strength: 1, by });
    return n;
  },
  hush(g, at, { power, reach, by }) {
    let n = 0;
    for (const c of foes(g, at, reach)) if (g.ai.eco.relation(c, g.player) !== REL.KIN) { g.creatures.apply(c, 'sleep', 9 * power, 1, by); n++; }
    burst(g, at.clone().setY(at.y + 0.5), 40, 0x9ab8ff, { speed: reach * 0.6, up: 1, gravity: -0.3, life: 1.6, size: 0.12, alpha: 0.5 });
    return n;
  },
  kin(g, at, { power, reach }) {
    let n = 0;
    for (const c of foes(g, at, reach)) {
      if (!c.brain) continue;
      c.rel ||= new Map(); c.relUntil ||= new Map();
      c.rel.set('courier', REL.KIN); c.relUntil.set('courier', c.brain.now + 30 * power);
      const f = c.mem?.fact?.(g.player); if (f) { f.grudge = 0; f.threat = 0; }
      c.brain.signal(); n++;
      g.glyphs?.pop('note', c.head?.() ?? c.pos.clone(), { color: 0xff9ad5, size: 0.5, life: 1.2 });
    }
    return n;
  },
  spirit(g, at, { power }) {
    let n = 0;
    for (let k = 0; k < 1 + Math.floor(power); k++) if (g.spirits?.summon(at.clone().add(new THREE.Vector3(rnd(-1.5, 1.5), 0, rnd(-1.5, 1.5))), { life: 25 * power, power: 0.8 + 0.3 * power, from: 'lockheart' })) n++;
    return n;
  },
  chest(g, at, { power }) {
    const tier = Math.min(4, Math.floor(1 + simRand() * 1.6 * power));
    const P = g.player, f = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    g.chests?.drop(tier, at.clone().addScaledVector(f, 2.2).setY(at.y + 6), { yaw: P.yaw + Math.PI, from: 'lockheart' });
    return tier + 1;
  },
  nuke(g, at, { power, reach, by }) {
    const R = reach * 1.6;
    // the column of slip, up and over everything (thousands of particles: the GPU pool carries them for nothing)
    const fx = g.fx?.alpha;
    if (fx?.emit) {
      const col = new THREE.Color(0xb3905f), wet = new THREE.Color(0x7d5f3e), hot = new THREE.Color(0xff5ad0);
      for (let i = 0; i < 2600; i++) {
        const a = fxRand() * Math.PI * 2, r = Math.sqrt(fxRand()) * R * 0.45;
        fx.emit({ pos: at.clone().add(new THREE.Vector3(Math.cos(a) * 0.4, 0.3, Math.sin(a) * 0.4)), vel: new THREE.Vector3(Math.cos(a) * r, rnd(9, 17), Math.sin(a) * r), life: rnd(1.8, 3.2), size: rnd(0.07, 0.16), sizeEnd: 0.05, color: fxRand() < 0.08 ? hot : fxRand() < 0.5 ? col : wet, alpha: 0.9, drag: 0.25, gravity: 9 });
      }
    }
    for (let i = 0; i < 40; i++) { const a = fxRand() * Math.PI * 2, r = Math.sqrt(fxRand()) * R; g.shells?.addDroplet?.(at.clone().setY(at.y + 1), new THREE.Vector3(Math.cos(a) * r * 0.6, rnd(8, 14), Math.sin(a) * r * 0.6), rnd(0.05, 0.1), true); }
    // the ground drowned in it
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = i === 0 ? 0 : rnd(0.3, 1) * R * 0.8; g.slip?.addDisc(at.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.02, Math.sin(a) * r)), UP, rnd(1.6, 3.2), 24, rnd(0.6, 2)); }
    // everything against their burst, every pot broken, every clapperjar flung
    let n = 0;
    for (const c of foes(g, at, R)) { const d = c.pos.clone().sub(at).setY(0.5).normalize(); if (g.creatures.strike(c, c.center(new THREE.Vector3()), d, 99, 'nuke', by)) n++; }
    for (const c of g.clappers?.list || []) if (c.alive && !c.ally && c.pos.distanceTo(at) < R) { g.clappers.knock(c, c.pos.clone().sub(at).setY(0).normalize().multiplyScalar(14).setY(9)); g.clappers.stun(c, 5, g.shells.glowOutline, g.shells.xray); n++; }
    for (const e of [...(g.breakables?.items || [])]) { if (!e.alive || e.def?.trial) continue; const t = e.body.translation(); if ((t.x - at.x) ** 2 + (t.z - at.z) ** 2 < R * R && Math.abs(t.y - at.y) < 6) { g.breakables.shatter(e, new THREE.Vector3(t.x, t.y, t.z), new THREE.Vector3(t.x - at.x, 2, t.z - at.z).normalize(), 2, 'nuke', 'courier'); n++; } }
    const P = g.player; P.shake = Math.max(P.shake || 0, 1.2);
    g.time?.pulse?.('nuke', 0.25, 0.5, { release: 0.6 });
    sfx.explosion?.(); sfx.rainstick?.(2);
    g.ai?.stimuli.emit('death', at, { radius: 40, strength: 1.5, by, ttl: 3 });
    return n;
  },
};
