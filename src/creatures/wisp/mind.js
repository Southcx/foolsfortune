// ---------------------------------------------------------------------------------------
// THE LANTERN WISP'S MIND: what a Lantern Wisp wants and what it might do about it, as the AI parts put it (src/creatures/ai/,
// docs/AI.md). The body (lanternwisp.js) carries it out. A Figment of the Dunes' nights: a little flame in a lantern on a body of
// smoke and clay, curious and skittish, that keeps its distance and throws its fire.
//
// WHAT IT WANTS (drives, 0..1; traits: bold, lazy)
//   fear       a blow, a kin put out nearby, a blast close by; enough and it flees toward home, its flame low
//   curiosity  it drifts over to look at what it heard, and watches what it half-saw, its lantern held up
//   rest       it tires as it fights, and settles to hang still near home
//
// WHAT IT DOES (scored by the reasoner, utility.js)
//   what is done to it      stunned, asleep, melted, sent home (statuses: creatures.js): these overrule everything
//   fighting                watch (a "?"), hunt: it keeps 6 to 10 m off, circling, and casts a ball of its flame (lanternwisp.js
//                           `windUp(c, 'cast')`), which the parry can send back
//   staying alive           flee
//   living                  investigate, wander, go home, idle
//
// Prior art: the will-o'-the-wisp of the fens (a light that keeps its distance and leads you on); the Wisps of Dark Souls and the
// ranged casters of every action game that kite at a distance (Zelda's Wizzrobes, Kingdom Hearts' Heartless casters); built from the
// slip jelly's parts (jelly/mind.js), smaller.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { st } from '../creatures.js';
import { enraged } from '../../progress/combat/emo.js';
import { AWARE, REL, kindOf, curve, norm, steer } from '../ai/index.js';
import { stream } from '../../core/rng.js';
const simRand = stream('creatures/wisp/mind'); // (the simulation's chance: core/rng.js, the same twice)

const _w = new THREE.Vector3(), _s = new THREE.Vector3(), _o = new THREE.Vector3(), _k = new THREE.Vector3(), _t = new THREE.Vector3();
const rnd = (a, b) => a + simRand() * (b - a);
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Its numbers: speed (m/s), keep (the distance it fights from), leash (how far from home it will be drawn), home (where it roams). */
export const WISP_MIND = { speed: 2.6, travel: 1.6, wander: 0.8, flee: 3.4, keep: 8, leash: 26, home: 12, fearFlees: 0.62 };

export function wispMind(W) {
  const g = W.game, C = WISP_MIND;
  const cache = (x) => { if (x.cacheT !== x.now) { x.cacheT = x.now; x.cache = {}; } return x.cache; };
  const rel = (x, ent) => g.ai.eco.relation(x.c, ent);
  const kinNear = (x, r) => { const k = cache(x); return (k['kin' + r] ??= g.creatures.near(x.c.pos, r).filter((o) => o !== x.c && o.alive && rel(x, o) === REL.KIN)); };
  const distHome = (x) => hd(x.c.pos, x.c.home);
  const foe = (x) => {
    const k = cache(x); if (k.foe !== undefined) return k.foe;
    let best = null, bs = 0;
    for (const f of x.mem.facts.values()) {
      const e = f.ent; if (!e || e === x.c || e.alive === false) continue;
      const r = rel(x, e), want = ((r === REL.PREY || r === REL.RIVAL) && f.aware >= 0.55) || f.grudge >= 0.3;
      if (!want || x.now - Math.max(f.seenAt, f.heardAt) > 8) continue;
      const s = f.aware * (1 + f.grudge) / (1 + hd(f.pos, x.c.pos) * 0.05);
      if (s > bs) { bs = s; best = f; }
    }
    return (k.foe = best);
  };
  const alien = (x) => { const k = cache(x); return k.alien !== undefined ? k.alien : (k.alien = x.mem.focus((f) => f.ent !== x.c && f.ent?.alive !== false && ![REL.KIN, REL.NEUTRAL].includes(rel(x, f.ent)))); };
  const threat = (x) => { let best = null, bs = 0.12; for (const f of x.mem.facts.values()) { if (!f.ent || f.ent === x.c || f.ent.alive === false) continue; const s = f.threat * f.aware; if (s > bs) { bs = s; best = f; } } return best; };
  const goTo = (x, target, speed, slow = 1.5) => {
    const c = x.c;
    steer.arrive(_w, c.pos, target, speed, slow);
    steer.separate(_s, c.pos, kinNear(x, 3), 2);
    steer.blend(c.want, [[_w, 1], [_s, 1.2]], speed * 1.1);
    return hd(c.pos, target);
  };
  const glyph = (x, kind, color = 0xffd27a, size = 0.5) => g.glyphs?.pop(kind, W.head(x.c), { color, size, life: 1.1, follow: () => W.head(x.c) });

  const A = [];
  const act = (a) => { A.push(a); return a; };
  for (const [id, s] of [['stunned', 'stun'], ['asleep', 'sleep'], ['melted', 'melt']]) act({ id, weight: 5, urgent: true, when: (x) => st(x.c, s) > 0, tick: (x) => { x.c.pose = s; x.c.want.set(0, 0, 0); return st(x.c, s) > 0 ? 'run' : 'done'; } });
  act({ id: 'sent home', weight: 4, urgent: true, when: (x) => st(x.c, 'flee') > 0, enter: (x) => glyph(x, 'dots'), tick: (x) => { x.c.pose = 'flee'; goTo(x, x.c.home, C.flee); return st(x.c, 'flee') > 0 ? 'run' : 'done'; } });

  act({
    id: 'watch', weight: 1.15, cooldown: 2,
    when: (x) => { const f = alien(x); return !!f && f.aware >= AWARE.SUSPECT * 0.7 && !foe(x); },
    consider: [(x) => curve.bell(0.55, 0.3)(alien(x).aware)],
    enter: (x) => { if ((x.c.askedT ?? -99) < x.now - 6) { glyph(x, 'ask'); x.c.askedT = x.now; } x.bb.t = 0; },
    tick: (x, dt) => { const f = alien(x); x.bb.t += dt; if (!f) return 'done'; x.c.pose = 'watch'; x.c.face = f.pos; x.c.want.set(0, 0, 0); return x.bb.t > 4 ? 'done' : 'run'; },
  });
  act({
    id: 'hunt', hunt: true, weight: 1.7, cooldown: 2,
    when: (x) => !st(x.c, 'calm') && !st(x.c, 'charm') && !st(x.c, 'forget') && !!foe(x) && distHome(x) < C.leash,
    consider: [(x) => curve.logistic(0.38, 9)(Math.max(0, Math.min(1, 0.45 + 0.7 * foe(x).grudge - 0.8 * x.drives.get('fear')) * (x.c.traits.bold ?? 1)))],
    lock: (x) => !!x.c.attack,
    enter: (x) => { const c = x.c; c.foe = foe(x).ent; c.cd = rnd(0.8, 1.6); if (c.foe === x.P && (c.noticedT ?? -99) < x.now - 12) { c.noticedT = x.now; g.events?.emit('wisp.notice', { by: 'creature' }); glyph(x, 'bang1', 0xff9a4a); } },
    exit: (x) => { x.c.foe = null; },
    tick: (x, dt) => {
      const c = x.c, f = foe(x);
      if (!f || f.ent !== c.foe) return c.attack ? 'run' : 'done';
      const F = x.now - f.seenAt < 1 ? f.ent.pos : f.pos, d = hd(c.pos, F);
      if (distHome(x) > C.leash) { f.aware = Math.min(f.aware, 0.3); return 'fail'; }
      c.pose = 'fight'; c.face = F;
      if (!c.attack) {
        if (d > C.keep + 2) steer.seek(_w, c.pos, F, C.speed); else if (d < C.keep - 2) steer.flee(_w, c.pos, F, C.speed); else _w.set(0, 0, 0);
        steer.orbit(_o, c.pos, F, C.keep, c.id % 2 ? 1 : -1, 0.9);
        steer.separate(_s, c.pos, kinNear(x, 4), 3);
        steer.blend(c.want, [[_w, 1], [_o, 1], [_s, 1.3]], C.speed);
        c.cd -= dt * (enraged(c.emo) ? 1.7 : 1);
        if (c.cd <= 0 && x.now - f.seenAt < 0.6 && d > 3 && d < 20) { W.windUp(c, 'cast', f.ent); c.cd = rnd(2.2, 3.6) * (st(c, 'doubt') ? 1.6 : 1); }
      } else c.want.set(0, 0, 0);
      x.drives.add('rest', dt / 80);
      return 'run';
    },
  });
  act({
    id: 'flee', weight: 1.9,
    when: (x) => x.drives.get('fear') > C.fearFlees && !!threat(x),
    consider: [(x) => norm(x.drives.get('fear'), C.fearFlees, 1)],
    enter: (x) => glyph(x, 'dots', 0x9fd0ff),
    tick: (x) => { const c = x.c, t = threat(x); if (!t) return 'done'; c.pose = 'flee'; steer.flee(_w, c.pos, t.pos, C.flee); steer.contain(_k, c.pos, c.home, C.leash, 1); steer.blend(c.want, [[_w, 1], [_k, 0.8]], C.flee); return x.drives.get('fear') > C.fearFlees * 0.5 ? 'run' : 'done'; },
  });
  act({
    id: 'investigate', weight: 0.9, cooldown: 3,
    when: (x) => !!x.mem.interest(),
    consider: [(x) => 0.3 + 0.7 * x.drives.get('curiosity')],
    enter: (x) => { x.bb.i = x.mem.interest(); x.bb.t = 0; },
    tick: (x, dt) => { const c = x.c, b = x.bb; b.t += dt; if (!b.i || b.t > 14) { x.mem.done(b.i); return 'fail'; } c.pose = 'drift'; if (goTo(x, b.i.pos, C.travel, 2) < 2.5) { x.mem.done(b.i); x.drives.sat('curiosity', 0.35); return 'done'; } return 'run'; },
  });
  act({ id: 'go home', weight: 1.1, when: (x) => distHome(x) > C.home, consider: [(x) => norm(distHome(x), C.home, C.leash)], tick: (x) => { x.c.pose = 'drift'; return goTo(x, x.c.home, C.travel, 2) < 2 ? 'done' : 'run'; } });
  act({
    id: 'wander', weight: 0.6, cooldown: 3, consider: [(x) => 0.3 + 0.45 * x.drives.get('curiosity')],
    enter: (x) => { x.bb.t = rnd(3, 7); x.bb.w = {}; },
    tick: (x, dt) => { const c = x.c; x.bb.t -= dt; c.pose = 'drift'; steer.wander(_w, x.bb.w, c.yaw, C.wander, dt); steer.contain(_k, c.pos, c.home, C.home * 0.8, 1); steer.blend(c.want, [[_w, 1], [_k, 1]], C.wander * 1.3); return x.bb.t <= 0 ? 'done' : 'run'; },
  });
  act({ id: 'idle', weight: 0.4, consider: [() => 0.8], enter: (x) => { x.bb.t = rnd(2, 5); }, tick: (x, dt) => { x.c.pose = x.drives.get('rest') > 0.6 ? 'rest' : 'idle'; x.c.want.set(0, 0, 0); x.bb.t -= dt; return x.bb.t <= 0 ? 'done' : 'run'; } });

  return {
    actions: A,
    drives: { fear: { fall: 1 / 10 }, curiosity: { rise: 1 / 60, start: [0.3, 0.7] }, rest: { rise: 1 / 400, start: [0, 0.2], trait: 'lazy' } },
    traits: { bold: [0.7, 1.3], lazy: [0.8, 1.3] },
    mods: () => undefined,
    /** A kin put out nearby, or its cry: fear, and a grudge against whoever did it. */
    heard(c, s, reach) {
      const x = c.brain.ctx;
      if ((s.kind === 'pain' || s.kind === 'death') && s.source && s.source !== c && g.ai.eco.relation(c, s.source) === REL.KIN) {
        if (s.about && s.about !== c) { const f = c.mem.ensure(s.about, kindOf(s.about)); f.grudge = Math.min(1, f.grudge + 0.3 * reach); f.threat = Math.min(1, f.threat + 0.2 * reach); }
        x.drives.add('fear', (s.kind === 'death' ? 0.4 : 0.1) * reach / (c.traits.bold ?? 1)); c.brain.signal();
      } else if (s.kind === 'noise' && s.strength >= 0.8 && reach > 0.5 && s.source !== c) x.drives.add('fear', 0.15 * reach / (c.traits.bold ?? 1));
    },
  };
}
