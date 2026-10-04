// ---------------------------------------------------------------------------------------
// THE SLIP JELLY'S MIND: what a slip jelly wants, and everything it might do about it, as the AI parts put it (src/creatures/ai/, docs/AI.md).
// The body (slipjelly.js) carries it out.
//
// WHAT IT WANTS (drives, each 0..1, rising on its own clock; traits make each jelly its own: bold, greedy, lazy, social)
//   thirst     it is sand held together by water: it dries as it goes, faster moving, faster still spending slip on a lunge or a
//              spit. A dry jelly is pale and matte and its melt runs slow (deform.js); it goes to the oasis's shallows, or to wet slip,
//              and soaks. Lure one far from water and it wilts.
//   hunger     it feeds on Lachryma: baubles lying on the sand, a fish snatched from the shallows, and the Courier's own (a lunge that
//              lands drains them, and feeds it). A hungry jelly is a bold one.
//   rest       it tires, chasing most of all, and settles in the palms' shade, or at home.
//   social     alone it grows lonely; it goes to its kin and sits with them, and now and then they play (a game of hops).
//   fear       a blow, a kin's death nearby, a blast close by: fear spikes and ebbs; enough and it flees, toward its kin and home.
//   curiosity  it goes to look at what it heard (a shot over the dune, a call) and stares at what it half-saw.
//
// WHAT IT KNOWS (memory.js, written by its senses: sight 15 m in a wide arc, feel 2.6 m all round, and its hearing of stimuli)
//   the Courier (how sure, where last, how dangerous they have been, and its grudge), other creatures, where kin burst (a place to mourn,
//   then avoid), things heard but not seen.
//
// WHAT IT DOES (each an action scored by the reasoner, utility.js; the best runs)
//   what is done to it      stunned, asleep, melted, sent home: these overrule everything (statuses: creatures.js)
//   orders written into it  fetch (a reprogrammed errand), follow (the Courier made kin)
//   fighting                watch (a "?": something half-seen), hunt (closes in and strikes: lunge, spit; a call to its kin first)
//   staying alive           flee (from what frightens it, toward kin and home)
//   living                  drink, forage, fish, rest, huddle, play, mourn, investigate, wander, go home, idle
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { st } from '../creatures.js';
import { AWARE, REL, kindOf, curve, norm, steer } from '../ai/index.js';

const _w = new THREE.Vector3(), _s = new THREE.Vector3(), _k = new THREE.Vector3(), _o = new THREE.Vector3(), _t = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export function jellyMind(J) {
  const g = J.game, JL = () => J.constructor.JELLY ?? null; void JL;
  const C = { speed: 2.1, travel: 1.35, wander: 0.7, flee: 2.7, keep: 4.2, leash: 30, home: 14 };

  // ---------------------------------------------------------------- what it looks at, once a think
  const cache = (x) => { if (x.cacheT !== x.now) { x.cacheT = x.now; x.cache = {}; } return x.cache; };
  const look = (x, kind, range) => { const k = cache(x); return (k[kind] ??= g.ai.eco.find(kind, x.c.pos, range) || false) || null; };
  const rel = (x, ent) => g.ai.eco.relation(x.c, ent);
  const bonded = (c, ent) => c.rel.get(ent) === REL.KIN || c.rel.get(kindOf(ent)) === REL.KIN && kindOf(ent) === 'courier';
  const kinNear = (x, r) => { const k = cache(x); return (k['kin' + r] ??= (g.creatures.near(x.c.pos, r).filter((o) => o !== x.c && o.alive && rel(x, o) === REL.KIN))); };
  const distHome = (x) => hd(x.c.pos, x.c.home);
  /** Its foe: what it knows of that it would fight (prey or rival it is sure of, or anything it holds a grudge against), or null. */
  const foe = (x) => {
    const k = cache(x);
    if (k.foe !== undefined) return k.foe;
    let best = null, bs = 0;
    for (const f of x.mem.facts.values()) {
      const e = f.ent;
      if (!e || e === x.c || e.alive === false || bonded(x.c, e)) continue;
      const r = rel(x, e);
      const want = ((r === REL.PREY || r === REL.RIVAL) && f.aware >= 0.55) || f.grudge >= 0.35;
      if (!want || x.now - Math.max(f.seenAt, f.heardAt) > 8) continue;
      const s = f.aware * (1 + f.grudge) / (1 + hd(f.pos, x.c.pos) * 0.05);
      if (s > bs) { bs = s; best = f; }
    }
    return (k.foe = best);
  };
  /** The thing it is most aware of that is not its kin nor beneath its notice (what it would watch). */
  const alien = (x) => { const k = cache(x); return k.alien !== undefined ? k.alien : (k.alien = x.mem.focus((f) => f.ent !== x.c && f.ent?.alive !== false && ![REL.KIN, REL.NEUTRAL].includes(rel(x, f.ent)))); };
  const threat = (x) => {
    const k = cache(x);
    if (k.threat !== undefined) return k.threat;
    let best = null, bs = 0.15;
    for (const f of x.mem.facts.values()) { if (!f.ent || f.ent === x.c || f.ent.alive === false || bonded(x.c, f.ent)) continue; const s = f.threat * f.aware; if (s > bs) { bs = s; best = f; } }
    return (k.threat = best);
  };
  /** How much it wants to fight what it knows of: hunger, grudge, its ground, its kin's fight, its nerve; less its fear. */
  const aggression = (x, f) => {
    if (!f) return 0;
    const c = x.c, D = x.drives, territory = 1 - norm(hd(f.pos, c.home), 6, 22);
    const kin = kinNear(x, 14).some((o) => o.brain?.action?.hunt) ? 0.25 : 0;
    const a = (0.22 + 0.55 * D.get('hunger') + 0.7 * f.grudge + 0.35 * territory + kin) * (c.traits.bold ?? 1) - 0.8 * D.get('fear');
    return Math.max(0, Math.min(1, a));
  };

  // ---------------------------------------------------------------- moving (each action asks for a velocity: c.want)
  const goTo = (x, target, speed, slow = 1.5) => {
    const c = x.c;
    steer.arrive(_w, c.pos, target, speed, slow);
    steer.separate(_s, c.pos, kinNear(x, 2.5), 1.6);
    steer.avoid(_o, c.pos, c.vel, (p, d, l) => J.probe(c, p, d, l), 1.8);
    steer.blend(c.want, [[_w, 1], [_s, 1.2], [_o, 1.4]], speed * 1.1);
    return hd(c.pos, target);
  };
  const facing = (x, p) => { x.c.face = p; };
  const glyph = (x, kind, color = 0xd9c8ff, size = 0.5) => g.glyphs?.pop(kind, J.head(x.c), { color, size, life: 1.1, follow: () => J.head(x.c) });

  // ---------------------------------------------------------------- the actions
  const A = [];
  const act = (a) => { A.push(a); return a; };

  // ---- what is done to it overrules what it wants
  act({ id: 'stunned', weight: 5, urgent: true, when: (x) => st(x.c, 'stun') > 0, tick: (x) => { x.c.pose = 'stun'; return st(x.c, 'stun') > 0 ? 'run' : 'done'; } });
  act({ id: 'asleep', weight: 5, urgent: true, when: (x) => st(x.c, 'sleep') > 0, tick: (x) => { x.c.pose = 'sleep'; return st(x.c, 'sleep') > 0 ? 'run' : 'done'; } });
  act({ id: 'melted', weight: 5, urgent: true, when: (x) => st(x.c, 'melt') > 0, tick: (x) => { x.c.pose = 'melt'; return st(x.c, 'melt') > 0 ? 'run' : 'done'; } });
  act({
    id: 'sent home', weight: 4, urgent: true, when: (x) => st(x.c, 'flee') > 0,
    enter: (x) => glyph(x, 'dots'),
    tick: (x) => { x.c.pose = 'walk'; const d = goTo(x, x.c.home, C.flee); if (d < 1.2) x.c.pose = 'rest'; return st(x.c, 'flee') > 0 ? 'run' : 'done'; },
  });

  // ---- orders written into it (tools/veritome/reprogram.js)
  act({
    id: 'fetch', weight: 3.2, urgent: true, when: (x) => x.c.macro?.id === 'fetch',
    enter: (x) => { x.bb.phase = 'find'; x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb, P = x.P;
      b.t += dt;
      if (b.t > 30) { c.macro = null; return 'fail'; }
      if (b.phase === 'find') {
        const f = look(x, 'food', 30) || look(x, 'shiny', 30);
        if (!f) { c.macro = null; glyph(x, 'ask'); return 'fail'; }
        c.pose = 'walk';
        if (goTo(x, f.pos, C.speed, 0.4) < 0.7) { if (f.take?.(c) !== false) { J.gulp(c, f.pos); b.phase = 'bring'; b.carry = (b.carry || 0) + 1; } }
      } else {
        c.pose = 'walk';
        if (goTo(x, P.pos, C.speed, 1) < 1.6) {
          facing(x, P.pos);
          const at = c.pos.clone().lerp(P.pos, 0.5).setY(c.pos.y + 0.6);
          if (c.stash) { g.cubes?.burst?.(at, c.stash, { count: Math.min(8, c.stash), up: 2.5, from: 'jelly' }); c.stash = 0; } // (their money, given back)
          else g.baubles?.spawn(at, 2 + b.carry * 2, { up: 2.5, spread: 0.6 });
          c.deform.kick(5, new THREE.Vector2(0, 1.2), 0.2);
          g.events?.emit('jelly.fetch', { by: 'courier' });
          c.macro = null; return 'done';
        }
      }
      return 'run';
    },
  });
  act({
    id: 'follow', weight: 1.4, when: (x) => rel(x, x.P) === REL.KIN && !foe(x),
    consider: [(x) => 0.35 + 0.65 * norm(hd(x.c.pos, x.P.pos), 2.5, 9)],
    tick: (x) => { const c = x.c, P = x.P; c.pose = 'walk'; _t.copy(P.pos).addScaledVector(_k.set(c.pos.x - P.pos.x, 0, c.pos.z - P.pos.z).normalize(), 2.4); const d = goTo(x, _t, C.speed * 1.1, 2); if (d < 0.6) { c.pose = 'idle'; facing(x, P.pos); } return 'run'; },
  });

  // ---- fighting
  act({
    id: 'watch', weight: 1.15,
    when: (x) => { const f = alien(x); return !!f && f.aware >= AWARE.SUSPECT * 0.7 && !foe(x); },
    consider: [(x) => curve.bell(0.55, 0.3)(alien(x).aware)],
    cooldown: 2,
    enter: (x) => { if ((x.c.askedT ?? -99) < x.now - 6) { glyph(x, 'ask', 0xd9c8ff, 0.45); x.c.askedT = x.now; } x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, f = alien(x); x.bb.t += dt;
      if (!f) return 'done';
      c.pose = 'watch'; facing(x, f.pos);
      if (rel(x, f.ent) === REL.CURIOUS || x.drives.get('curiosity') > 0.5) goTo(x, f.pos, 0.35, 4); // (it edges closer to see)
      return x.bb.t > 4 ? 'done' : 'run';
    },
  });
  act({
    id: 'hunt', hunt: true, weight: 1.7,
    when: (x) => !st(x.c, 'calm') && !st(x.c, 'forget') && !!foe(x) && distHome(x) < C.leash,
    consider: [(x) => curve.logistic(0.42, 9)(aggression(x, foe(x)))],
    cooldown: 3,
    lock: (x) => !!x.c.attack && x.c.attack.phase !== 'recover',
    enter: (x) => {
      const c = x.c, f = foe(x);
      c.foe = f.ent; c.cd = rnd(0.6, 1.4);
      // the first sight of it in a while: a cry to its kin (they come) and the "!" it carries
      if ((c.calledT ?? -99) < x.now - 10) { c.calledT = x.now; J.call(c, f.ent); }
      if (f.ent === x.P && (c.noticedT ?? -99) < x.now - 12) { c.noticedT = x.now; g.events?.emit('jelly.notice', {}); }
    },
    exit: (x) => { x.c.foe = null; },
    tick: (x, dt) => {
      const c = x.c, f = foe(x);
      if (!f || f.ent !== c.foe) return c.attack ? 'run' : 'done';
      const F = x.now - f.seenAt < 1 ? f.ent.pos : f.pos, d = hd(c.pos, F); // (where it is, while it sees it; where it was, after)
      if (distHome(x) > C.leash) { f.aware = Math.min(f.aware, 0.3); return 'fail'; } // (it will not be drawn off its ground)
      c.pose = 'walk'; facing(x, F);
      if (!c.attack) {
        // keep its distance, circling while it waits for its moment
        if (d > C.keep) steer.pursue(_w, c.pos, F, f.ent.vel ?? _k.set(0, 0, 0), C.speed);
        else if (d < C.keep - 1.2) steer.flee(_w, c.pos, F, C.speed * 0.5);
        else _w.set(0, 0, 0);
        steer.orbit(_o, c.pos, F, C.keep, c.id % 2 ? 1 : -1, 0.6 * Math.abs(Math.sin(x.now * 0.7 + c.id)));
        steer.separate(_s, c.pos, kinNear(x, 3), 2);
        steer.blend(c.want, [[_w, 1], [_o, 1], [_s, 1.3]], C.speed);
        c.cd -= dt;
        const seen = x.now - f.seenAt < 0.6;
        if (c.cd <= 0 && seen && !st(c, 'calm')) {
          if (d < 7.5 && d > 1.5) { J.windUp(c, 'lunge', f.ent); c.cd = rnd(2.2, 3.4); }
          else if (d > 4.5 && d < 13) { J.windUp(c, 'spit', f.ent); c.cd = rnd(2.6, 3.8); }
        }
      }
      x.drives.add('rest', dt / 90);
      return 'run';
    },
  });

  // ---- staying alive
  act({
    id: 'flee', weight: 2.1, urgent: true,
    when: (x) => !!threat(x) || x.c.hp < 3,
    consider: [(x) => curve.logistic(0.55, 9)(Math.max(x.drives.get('fear'), (1 - x.c.hp / 8) * 0.7 * (2 - (x.c.traits.bold ?? 1))))],
    cooldown: 2,
    enter: (x) => glyph(x, 'dots', 0xd9c8ff, 0.4),
    tick: (x, dt) => {
      const c = x.c, t = threat(x) ?? foe(x);
      c.pose = 'walk';
      if (t) steer.evade(_w, c.pos, t.pos, t.ent.vel ?? _k.set(0, 0, 0), C.flee); else _w.set(0, 0, 0);
      steer.seek(_k, c.pos, kinNear(x, 30)[0]?.pos ?? c.home, C.flee * 0.6); // (toward its kin, or home)
      steer.avoid(_o, c.pos, c.vel, (p, d, l) => J.probe(c, p, d, l), 2);
      steer.blend(c.want, [[_w, 1], [_k, 0.5], [_o, 1.5]], C.flee);
      return x.drives.get('fear') < 0.2 || (t && hd(c.pos, t.pos) > 20) ? 'done' : 'run';
    },
  });

  // ---- living
  act({
    id: 'drink', weight: 1.05,
    when: (x) => !!(look(x, 'water', 80) || look(x, 'slip', 8)),
    consider: [(x) => curve.logistic(0.5, 8)(x.drives.get('thirst'))],
    cooldown: 4,
    enter: (x) => { const w = look(x, 'slip', 8) && x.drives.get('thirst') < 0.75 ? look(x, 'slip', 8) : look(x, 'water', 80) || look(x, 'slip', 8); x.bb.at = w.pos.clone(); x.bb.r = Math.max(0.6, (w.radius ?? 0.5) * 0.6); x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb; b.t += dt;
      if (b.t > 40) return 'fail';
      if (!b.soak) { c.pose = 'walk'; if (goTo(x, b.at, C.travel, 1) < b.r + 0.4) { b.soak = true; glyph(x, 'note', 0xbfe3ff, 0.4); } return 'run'; }
      c.pose = 'soak';
      x.drives.sat('thirst', dt * 0.2);
      if (Math.random() < dt * 2) g.fx?.alpha?.emit?.({ pos: c.pos.clone().add(_k.set(rnd(-0.4, 0.4), 0.1, rnd(-0.4, 0.4))), vel: _k.set(0, 0.5, 0).clone(), life: 0.8, size: 0.05, sizeEnd: 0.1, color: new THREE.Color(0xd8ecff), alpha: 0.5, drag: 0.5 });
      return x.drives.get('thirst') < 0.04 ? 'done' : 'run';
    },
  });
  act({
    id: 'forage', weight: 1.0,
    when: (x) => !!(look(x, 'food', 22) || look(x, 'shiny', 16)),
    consider: [(x) => curve.floor(0.2, curve.power(1.3))(x.drives.get('hunger')), (x) => 1 - norm((look(x, 'food', 22) || look(x, 'shiny', 16))?.d ?? 99, 3, 22) * 0.7],
    cooldown: 1.5,
    enter: (x) => { x.bb.f = look(x, 'food', 22) || look(x, 'shiny', 16); x.bb.t = 0; }, // (a bauble, or a cube of their money: it is all Lachryma to a jelly)
    tick: (x, dt) => {
      const c = x.c, f = x.bb.f; x.bb.t += dt;
      if (!f || x.bb.t > 15 || (f.alive && !f.alive())) return 'fail';
      c.pose = 'walk';
      if (goTo(x, f.pos, C.travel * 1.2, 0.4) < 0.75) {
        if (f.take?.(c) === false) return 'fail';
        J.gulp(c, f.pos); c.pose = 'eat';
        x.drives.sat('hunger', 0.28); c.hp = Math.min(8, c.hp + 1);
        g.events?.emit('jelly.eat', { what: f.what ?? 'lachryma', by: 'environment' });
        return 'done';
      }
      return 'run';
    },
  });
  act({
    id: 'fish', weight: 1.0,
    when: (x) => x.drives.get('hunger') > 0.3 && !!look(x, 'prey', 16),
    consider: [(x) => curve.logistic(0.45, 8)(x.drives.get('hunger')), (x) => 1 - norm(look(x, 'prey', 16)?.d ?? 99, 2, 16) * 0.6],
    cooldown: 8,
    enter: (x) => { x.bb.f = look(x, 'prey', 16); x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb, f = b.f; b.t += dt;
      if (!f || b.t > 14 || f.gone?.()) return 'fail';
      facing(x, f.pos);
      if (!b.leapt) {
        c.pose = 'watch';
        if (goTo(x, f.pos, C.travel, 1) < 3.2 && !c.air) { b.leapt = true; c.vel.set(f.pos.x - c.pos.x, 0, f.pos.z - c.pos.z).multiplyScalar(1.6); c.vy = 4.2; c.air = true; c.deform.kick(6, null, 0.15); }
        return 'run';
      }
      if (c.air) return 'run';
      if (hd(c.pos, f.pos) < 1.4 && f.take?.(c) !== false) {
        J.gulp(c, f.pos, true); x.drives.sat('hunger', 0.45); glyph(x, 'note', 0xffd76a, 0.45);
        g.events?.emit('jelly.fish', { by: 'environment' });
        return 'done';
      }
      return 'fail';
    },
  });
  act({
    id: 'rest', weight: 0.95,
    consider: [(x) => curve.logistic(0.62, 9)(x.drives.get('rest'))],
    cooldown: 5,
    enter: (x) => { const s = look(x, 'shade', 40); x.bb.at = s ? s.pos.clone().add(_k.set(rnd(-1.2, 1.2), 0, rnd(-1.2, 1.2))) : x.c.home.clone(); x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb; b.t += dt;
      if (!b.there) { c.pose = 'walk'; if (goTo(x, b.at, C.travel * 0.8, 1) < 0.8 || b.t > 25) { b.there = true; if (x.drives.get('rest') > 0.85) glyph(x, 'dots'); } return 'run'; }
      c.pose = x.drives.get('rest') > 0.7 ? 'sleep' : 'rest';
      x.drives.sat('rest', dt * 0.05);
      if (kinNear(x, 4).length) x.drives.sat('social', dt * 0.04);
      return x.drives.get('rest') < 0.05 ? 'done' : 'run';
    },
  });
  act({
    id: 'huddle', weight: 0.85,
    when: (x) => kinNear(x, 28).length > 0 && !kinNear(x, 2.6).length,
    consider: [(x) => curve.logistic(0.5, 8)(x.drives.get('social')), (x) => 1 - 0.6 * x.drives.get('fear')],
    cooldown: 4,
    tick: (x, dt) => {
      const c = x.c, k = kinNear(x, 28)[0];
      if (!k) return 'fail';
      c.pose = 'walk';
      _t.copy(k.pos).addScaledVector(_k.set(c.pos.x - k.pos.x, 0, c.pos.z - k.pos.z).normalize(), 1.7);
      if (goTo(x, _t, C.travel, 1.2) < 0.6) { c.pose = 'rest'; facing(x, k.pos); x.drives.sat('social', dt * 0.12); }
      return x.drives.get('social') < 0.05 ? 'done' : 'run';
    },
  });
  act({
    id: 'play', weight: 0.7,
    when: (x) => kinNear(x, 9).length > 0 && x.drives.get('fear') < 0.2 && !foe(x),
    consider: [(x) => curve.logistic(0.45, 7)(x.drives.get('social') * 0.6 + x.drives.get('curiosity') * 0.5), (x) => 1 - x.drives.get('hunger') * 0.7],
    cooldown: 20,
    enter: (x) => { glyph(x, 'note', 0xffd76a, 0.45); x.bb.t = 0; x.bb.hop = 0.3; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb, k = kinNear(x, 9)[0];
      b.t += dt; b.hop -= dt;
      if (!k || b.t > 6) return 'done';
      c.pose = 'walk';
      steer.orbit(c.want, c.pos, k.pos, 2, c.id % 2 ? 1 : -1, 1.6);
      if (b.hop <= 0 && !c.air) { b.hop = rnd(0.6, 1.0); c.vy = rnd(2.4, 3.4); c.air = true; c.deform.kick(5, null, 0.15); }
      x.drives.sat('social', dt * 0.1); x.drives.sat('curiosity', dt * 0.08);
      return 'run';
    },
  });
  act({
    id: 'mourn', weight: 1.05,
    when: (x) => !!x.mem.near('mourn', x.c.pos, 30) && !foe(x),
    consider: [(x) => 0.55 + 0.4 * (1 - x.drives.get('fear'))],
    enter: (x) => { x.bb.p = x.mem.near('mourn', x.c.pos, 30); x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb; b.t += dt;
      if (!b.p || b.t > 20) return 'fail';
      if (!b.there) { c.pose = 'walk'; if (goTo(x, b.p.pos, C.travel * 0.7, 2) < 2.3) { b.there = true; b.t = 0; glyph(x, 'dots', 0xb9c6ff, 0.45); } return 'run'; }
      c.pose = 'mourn'; facing(x, b.p.pos);
      if (b.t > 4.5) { b.p.kind = 'mourned'; x.mem.mark('danger', b.p.pos, 1, 50); return 'done'; }
      return 'run';
    },
  });
  act({
    id: 'investigate', weight: 0.9,
    when: (x) => !!x.mem.interest(),
    consider: [(x) => curve.floor(0.25, curve.linear())(x.drives.get('curiosity')), (x) => Math.min(1, x.mem.interest()?.strength ?? 0)],
    cooldown: 3,
    enter: (x) => { x.bb.i = x.mem.interest(); x.bb.t = 0; },
    tick: (x, dt) => {
      const c = x.c, b = x.bb; b.t += dt;
      if (!b.i || b.t > 18) { x.mem.done(b.i); return 'fail'; }
      if (!b.there) { c.pose = 'walk'; if (goTo(x, b.i.pos, C.travel, 1.5) < 2 || hd(b.i.pos, c.home) > C.leash) { b.there = true; b.t = 0; } return 'run'; }
      c.pose = 'watch';
      facing(x, _t.set(c.pos.x + Math.sin(x.now * 1.3) * 3, c.pos.y, c.pos.z + Math.cos(x.now * 1.3) * 3)); // (it looks about)
      if (b.t > 2.5) { x.mem.done(b.i); x.drives.sat('curiosity', 0.35); return 'done'; }
      return 'run';
    },
  });
  act({
    id: 'go home', weight: 1.1,
    when: (x) => distHome(x) > C.home,
    consider: [(x) => norm(distHome(x), C.home, C.leash)],
    tick: (x) => { x.c.pose = 'walk'; return goTo(x, x.c.home, C.travel, 2) < 2 ? 'done' : 'run'; },
  });
  act({
    id: 'wander', weight: 0.6,
    consider: [(x) => 0.3 + 0.45 * x.drives.get('curiosity')],
    cooldown: 3,
    enter: (x) => { x.bb.t = rnd(3, 7); x.bb.w = {}; },
    tick: (x, dt) => {
      const c = x.c; x.bb.t -= dt;
      c.pose = 'walk';
      steer.wander(_w, x.bb.w, c.yaw, C.wander, dt);
      steer.contain(_k, c.pos, c.home, C.home * 0.8, 1);
      steer.separate(_s, c.pos, kinNear(x, 3), 2);
      const avoid = x.mem.near('danger', c.pos, 6); // (it gives a wide berth to where kin burst)
      if (avoid) steer.flee(_t, c.pos, avoid.pos, 0.8); else _t.set(0, 0, 0);
      steer.avoid(_o, c.pos, c.vel, (p, d, l) => J.probe(c, p, d, l), 1.6);
      steer.blend(c.want, [[_w, 1], [_k, 1], [_s, 1], [_t, 1], [_o, 1.4]], C.wander * 1.3);
      x.drives.sat('curiosity', dt * 0.02);
      return x.bb.t <= 0 ? 'done' : 'run';
    },
  });
  act({
    id: 'idle', weight: 0.4, consider: [() => 0.8],
    enter: (x) => { x.bb.t = rnd(2, 5); },
    tick: (x, dt) => { x.c.pose = 'idle'; x.bb.t -= dt; return x.bb.t <= 0 ? 'done' : 'run'; },
  });

  return {
    actions: A,
    drives: {
      thirst: { rise: 1 / 260, start: [0.05, 0.35] },
      hunger: { rise: 1 / 260, start: [0.1, 0.5], trait: 'greedy' },
      rest: { rise: 1 / 320, start: [0, 0.3], trait: 'lazy' },
      social: { rise: 1 / 160, start: [0, 0.45], trait: 'social' },
      fear: { fall: 1 / 14 },
      curiosity: { rise: 1 / 75, start: [0.2, 0.6] },
    },
    traits: { bold: [0.7, 1.35], greedy: [0.75, 1.4], lazy: [0.7, 1.4], social: [0.7, 1.4] },
    /** How fast its wants rise this moment: it dries out faster moving, and is never lonely beside its kin. */
    mods(x) {
      const c = x.c, sp = Math.hypot(c.vel.x, c.vel.z);
      return { thirst: 1 + sp * 0.5, social: kinNear(x, 5).length ? 0 : 1, rest: c.brain.action?.hunt ? 2.5 : 1 };
    },
    /** What it heard, beyond what its memory makes of it: a kin's cry or death frightens it, angers it at whoever did it, and marks
     *  the place; a loud noise close by startles the timid. */
    heard(c, s, reach) {
      const x = c.brain.ctx;
      if ((s.kind === 'pain' || s.kind === 'death') && s.source && s.source !== c) {
        const victim = s.source, vr = g.ai.eco.relation(c, victim), bond = bonded(c, victim);
        if (vr === REL.KIN || bond) {
          const culprit = s.about;
          if (culprit && culprit !== c && (bond || g.ai.eco.relation(c, culprit) !== REL.KIN)) {
            const f = c.mem.ensure(culprit, kindOf(culprit));
            f.grudge = Math.min(1, f.grudge + (s.kind === 'death' ? 0.5 : 0.25) * reach);
            f.threat = Math.min(1, f.threat + (s.kind === 'death' ? 0.35 : 0.12) * reach);
          }
          x.drives.add('fear', ((s.kind === 'death' ? 0.45 : 0.08) * reach) / (c.traits.bold ?? 1));
          if (s.kind === 'death') c.mem.mark('mourn', s.pos, 1, 40);
          c.brain.signal();
        }
      } else if (s.kind === 'noise' && s.strength >= 0.8 && reach > 0.5 && s.source !== c) {
        x.drives.add('fear', (0.12 * reach) / (c.traits.bold ?? 1));
      }
    },
  };
}
