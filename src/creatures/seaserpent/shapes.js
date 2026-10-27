// ---------------------------------------------------------------------------------------
// THE SEA BEASTS THAT ARE NOT CHAINS (docs/plans/OPEN-SEA.md 14.3; Dovina's rows, progress/opensea/seabeasts.js SEA_BEASTS seaMonk and
// bigSquid; their bodies Calissa's, vfx/opensea/beasts/umibozu.js and kraken.js): the umibozu and the kraken carried on the sea serpent's
// chassis (seaserpent.js: its mind, its list, its shots and its windups), each a SHAPE: its parts in place of a spine (part 0 the weak
// point), what its moves do, how a blow lands. The chassis asks the shape wherever a chain would do its own thing; everything else (the
// mind, the senses, the Figment attack telegraphs, the mounts, the room's fight) is the serpent's, unchanged.
//
//   THE UMIBOZU (seaMonk)   parts: eyes (x3, its weak point), head (x1), handL and handR (x0.5).
//     rise   under, then up at the ship's beam (`side`): the ring where it rises is the windup; no blow
//     grip   its hands up out of the sea and closed on the gunwale (k 0..0.7 rising, 0.7..1 closing); held `hold` s, a hit each `fill`
//            s as it pours the sea in; the helm held (`helm.mods` 'grip'). Let go by the Lockheart's gulp (the tale's ladle with no
//            bottom: seamounts.js), by its eyes shot for `gripBreak`, or by time
//     dive   under (the chassis's own)
//   THE KRAKEN (bigSquid)   parts: head (x1, hittable only once `headOpen` arms are off), arm0..arm5 (x1, each its own hp: an arm's hp
//            out, it is broken off: Calissa's voxels). It ENGAGES a ship that comes within its `zone` of home while hunting: its arms rise
//            round the hull and drag it (`helm.mods` 'kraken'); sail out past zone x leash and it lets go (Monster Hunter's territory).
//     grasp  an arm round the hull: a hit, then held `hold` s, the helm held; shoot that arm off to be let go
//     slam   an arm brought down on a ring laid where the ship will be; out of the ring, no hit
//     ink    a cloud on the water held `hold` s: while it lies, no windup is drawn on the water unless the sonar reads through it
//            (the Dreamvane worn, or Calissa's hand aboard: seamounts.js's ping)
//
// Prior art: the tales (Toriyama Sekien's umibozu and the ladle with no bottom; Pontoppidan's kraken), Sea of Thieves' Kraken (arms round
// the hull, each shot off, the ink), Shadow of the Colossus (eyes as weak points; parts of a beast as the arena), Monster Hunter
// (territory left, a fight ended); the serpent's own SIGNATURES (signatures.js: a move held a while round the ship).
//
//   SHAPES[beast] = { body (over the serpent's SERPENT_BODY: seaserpent.js merges them), parts, make(game), init(S, c), swim(S, c, dt), pose(S, c, dt), wind(S, c, move, m, T), tick(S, c, dt),
//                     hold(S, c, dt), end(S, c, why), struck(S, c, i, dmg), damage(S, c, i, power), look(S, c, i), exposed?(S, c, i) }
//   SHAPE (their numbers)   events: seaserpent.hold { id, move, by }, seaserpent.free { how: 'gulp'|'shot'|'time'|..., by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** umibozu: how far out of the beam it rises and grips (m past half the beam), its reach for a grip (m from the hull's footprint),
 *  the damage to its eyes that breaks a grip, the helm while gripped (turn and way x); kraken: how many arms off before the head opens,
 *  the helm while engaged and while grasped, a slam's ring (m), how near the hull an arm grasps from (m), the ship's lead on a slam (s). */
export const SHAPE = {
  umibozu: { off: 27.5, reach: 60, gripBreak: 8, grip: { turn: 0.4, speed: 0.35 } },
  kraken: { headOpen: 2, drag: { speed: 0.7 }, grasp: { turn: 0.25, speed: 0.3 }, slamR: 10, lead: 0.2 },
};
const _a = new THREE.Vector3(), _r = new THREE.Vector3();
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const shipOf = (S) => (S.game.opensea?.sailing ? S.game.opensea.helm : null);
const progress = (A) => Math.min(1, Math.max(0, 1 - A.t / (A.T || 1)));
/** Whether a windup may be drawn on the water: not while the kraken's ink lies, unless the sonar reads through it. */
const readable = (S, c) => !(c.inkT > 0) || !!S.game.belt?.isWorn?.('dreamvane') || !!S.game.seaFight?.crew?.has?.('calissa');
const tell = (S, c, w) => { if (readable(S, c)) S.game.creatures.windup(c, w); };

// ---------------------------------------------------------------- the umibozu
const UMIBOZU = {
  body: { headR: 14, tailR: 6, size: 1.5, keep: [45, 72], reach: SHAPE.umibozu.reach, turn: 0.6, accel: 3, dive: 0.9, deep: 40, ram: 0, coil: 0, sink: 4, wakeAt: 12, poise: 9 },
  parts: ['eyes', 'head', 'handL', 'handR'],
  make: (g) => g.makeUmibozu?.() || null,
  init() {},
  swim(S, c) { if (c.held?.move === 'grip' && c.body) { c.pos.x = c.body.pos.x; c.pos.z = c.body.pos.z; } }, // (gripping, it is where its body stands, abeam)
  pose(S, c, dt) {
    const B0 = c.body, H = shipOf(S), A = c.attack, Hd = c.held;
    if (B0) {
      let move = Hd?.move ?? A?.move ?? null, k = Hd ? 1 : A ? progress(A) : 0;
      if (A?.move === 'rise' && !A.moved) { move = 'dive'; k = c.under; } // (under first, then up where the ring is)
      B0.drive({ at: c.pos, heading: c.yaw, rise: 1 - c.under, move, k, hull: H, pour: Hd ? 1 : null });
      if (dt > 0) B0.update(dt);
      const P = B0.parts; for (let i = 0; i < c.N; i++) { c.spine[i].p.copy(P[i].pos); c.spine[i].r = P[i].r; }
    } else for (const s of c.spine) s.p.copy(c.pos);
  },
  wind(S, c, move, m, T) {
    const H = shipOf(S), A = c.attack;
    if (move === 'rise') { // (the ring at the beam on the side it is on, where it will come up)
      const side = H ? (Math.sign((c.pos.x - H.pos.x) * Math.cos(H.yaw) - (c.pos.z - H.pos.z) * Math.sin(H.yaw)) || 1) : 1;
      if (H) A.at.copy(H.pos).addScaledVector(_r.set(Math.cos(H.yaw), 0, -Math.sin(H.yaw)), side * ((H.look?.beam ?? 9) / 2 + SHAPE.umibozu.off)); else A.at.copy(c.pos);
      A.at.y = S.surf(A.at.x, A.at.z); c.goUnder = 1; c.wantRear = 0; A.moved = false;
      tell(S, c, { at: A.at, radius: c.B.headR, eta: A.t, kind: 'rise', parry: false, area: { shape: 'circle', radius: c.B.headR, at: 'courier' }, type: 'impact', answer: 'read' });
    } else if (move === 'grip') {
      c.goUnder = 0; const r = (H?.look?.beam ?? 9) / 2 + 6;
      tell(S, c, { at: H?.pos ?? c.pos, radius: r, eta: A.t, kind: 'grip', parry: false, area: { shape: 'circle', radius: r, at: 'courier' }, type: 'influence', answer: 'gulp' });
    } else if (move === 'dive') { c.wantRear = 0; tell(S, c, { at: c.pos, radius: 2, eta: A.t, kind: 'dive', parry: false, read: false }); }
  },
  tick(S, c, dt) {
    const A = c.attack, g = S.game, H = shipOf(S);
    if (A.move === 'rise') {
      c.want.set(0, 0, 0);
      if (!A.moved && c.under > 0.9) { c.pos.x = A.at.x; c.pos.z = A.at.z; A.moved = true; } // (under, it goes where the ring is)
      if (A.moved && A.t < A.T * 0.5) c.goUnder = 0;
      if (A.t > 0) return;
      if (!A.moved) { c.pos.x = A.at.x; c.pos.z = A.at.z; }
      c.goUnder = 0; c.attack = null; g.creatures.unwind(c); S.finish(c, 'rise', false); c.brain.signal();
    } else if (A.move === 'grip') {
      c.want.set(0, 0, 0);
      if (A.t > 0) return;
      c.attack = null; g.creatures.unwind(c);
      const reach = !!H && !(c.tether > 0) && H.hullDist(c.pos) <= c.B.reach + 10;
      if (!reach) { S.finish(c, 'grip', false); return; }
      const m = c.row.moves.grip; c.held = { move: 'grip', t: m.hold, hold: m.hold, fillT: m.fill, dmg: 0 };
      g.events?.emit('seaserpent.hold', { id: c.kind, move: 'grip', by: 'creature' });
    } else if (A.move === 'dive') {
      if (A.t > 0) return;
      c.goUnder = 1; c.attack = null; g.creatures.unwind(c); S.finish(c, 'dive', false);
    }
  },
  /** Gripping: it pours the sea in, a hit each `fill` s, the helm held, until its time or an answer lets go. */
  hold(S, c, dt) {
    const Hd = c.held, H = shipOf(S); Hd.t -= dt; Hd.fillT -= dt;
    if (!H) return this.end(S, c, 'time');
    if (Hd.fillT <= 0) { Hd.fillT = c.row.moves.grip.fill; S.finish(c, 'grip', true); } // (the pour first: the hold's last fill lands as it ends)
    if (Hd.t <= 0) return this.end(S, c, 'time');
    H.mods?.set('grip', SHAPE.umibozu.grip); c.want.set(0, 0, 0); c.goUnder = 0;
  },
  end(S, c, why) {
    if (!c.held) return; c.held = null; S.game.opensea?.helm?.mods?.delete('grip');
    S.game.events?.emit('seaserpent.free', { how: why, by: why === 'gulp' || why === 'shot' ? 'courier' : 'creature' });
  },
  struck(S, c, i, dmg) { if (c.held?.move === 'grip' && i === 0 && (c.held.dmg += dmg) >= SHAPE.umibozu.gripBreak) this.end(S, c, 'shot'); },
  damage(S, c, i, power) { return power * (i === 0 ? 3 : i === 1 ? 1 : 0.5); },
  look(S, c, i) { c.body?.hit(this.parts[i], Math.min(1, 1 - c.hp / c.maxHp)); },
};

// ---------------------------------------------------------------- the kraken
const ARMS = 6;
const KRAKEN = {
  body: { headR: 12, tailR: 4, size: 1.6, keep: [30, 60], reach: 95, turn: 0.7, accel: 4, dive: 0.7, deep: 30, ram: 0, coil: 0, sink: 5, wakeAt: 0, poise: 12 },
  parts: ['head', ...Array.from({ length: ARMS }, (_, i) => `arm${i}`)],
  make: (g) => g.makeKraken?.() || null,
  init(S, c) {
    const P = c.row.parts?.arm; c.arms = Array.from({ length: ARMS }, (_, i) => ({ id: i, hp: P?.hp ?? 15, max: P?.hp ?? 15, alive: true, move: null, k: 0, at: null }));
    c.engaged = false; c.inkT = 0; c.awayT = 0;
  },
  broken: (c) => c.arms.filter((a) => !a.alive).length,
  headOpen(c) { return this.broken(c) >= SHAPE.kraken.headOpen; },
  /** Engaged while it hunts a ship inside its territory: it lies beside the hull (its head where the body's would surface), the ship dragged. */
  swim(S, c, dt) {
    const H = shipOf(S), hunting = !!c.brain.action?.hunt && c.alive;
    const inside = !!H && hd(H.pos, c.home) < (c.row.zone ?? 90) * (c.row.leash ?? 1.5);
    if (!c.engaged && hunting && H && inside && hd(c.pos, H.pos) < (c.row.zone ?? 90)) c.engaged = true;
    if (c.engaged && (!hunting || !inside || !H)) { c.engaged = false; c.awayT = 3; this.end(S, c, 'escape'); }
    if (c.engaged) {
      const side = _r.set(Math.cos(H.yaw), 0, -Math.sin(H.yaw)), off = (H.look?.beam ?? 9) / 2 + (c.body?.headRadius ?? 30) + 10;
      _a.copy(H.pos).addScaledVector(side, off); c.pos.x += (_a.x - c.pos.x) * Math.min(1, dt * 2); c.pos.z += (_a.z - c.pos.z) * Math.min(1, dt * 2);
      c.goUnder = 0; c.speed = 0; H.mods?.set('kraken', SHAPE.kraken.drag); // (it holds beside the hull: the mind's circling is the arms')
    } else S.game.opensea?.helm?.mods?.delete('kraken');
    if (c.inkT > 0) c.inkT -= dt;
    if (c.awayT > 0) c.awayT -= dt;
  },
  pose(S, c, dt) {
    const B0 = c.body, H = shipOf(S), A = c.attack, Hd = c.held;
    if (!B0) { for (const s of c.spine) { s.p.copy(c.pos); s.open = false; } return; }
    const up = c.engaged || c.awayT > 0;
    B0.group.visible = up || c.dying != null;
    if (!up && c.dying == null) { for (const s of c.spine) { s.p.copy(c.pos).setY(c.pos.y - 40); s.open = false; } return; }
    const arms = c.arms.map((a) => {
      const on = Hd?.move === 'grasp' && Hd.arm === a.id ? { move: 'grasp', k: 1 } : A && A.arm === a.id ? { move: A.move, k: progress(A), at: A.at } : { move: null, k: 0 };
      return c.engaged ? { id: a.id, ...on } : { id: a.id, move: null, k: 0, base: _a.copy(c.pos).setY(c.pos.y - 40).clone() }; // (let go: the arms sink back under)
    });
    const ink = c.inkT > 0 || A?.move === 'ink';
    B0.drive({ hull: H, open: c.engaged && this.headOpen(c), move: ink ? 'ink' : null, k: A?.move === 'ink' ? progress(A) : ink ? 1 : 0, arms });
    if (dt > 0) B0.update(dt);
    const P = B0.parts(); // (the arms' then the head: the spine is the head then the arms)
    c.spine[0].p.copy(P[ARMS].pos); c.spine[0].r = P[ARMS].r; c.spine[0].open = P[ARMS].open && this.headOpen(c);
    for (let i = 0; i < ARMS; i++) { const s = c.spine[i + 1]; s.p.copy(P[i].pos); s.r = P[i].r; s.open = P[i].open && c.arms[i].alive; }
  },
  exposed(S, c, i) { return !!c.spine[i].open; },
  pickArm(c, A) { const free = c.arms.filter((a) => a.alive && !(c.held?.arm === a.id)); return free.length ? free[Math.floor((c.id * 7 + c.cd[A.move] * 13 + free.length) % free.length)] : null; },
  wind(S, c, move, m, T) {
    const H = shipOf(S), A = c.attack;
    if (move === 'grasp' || move === 'slam') {
      const arm = this.pickArm(c, A); if (!arm || !H) { A.t = 0; A.arm = null; return; }
      A.arm = arm.id;
      if (move === 'slam') { A.at.copy(H.pos).addScaledVector(_a.set(Math.sin(H.yaw), 0, Math.cos(H.yaw)), H.speed * (m.windup + SHAPE.kraken.lead)); A.at.y = S.surf(A.at.x, A.at.z); }
      const r = move === 'slam' ? SHAPE.kraken.slamR : (H.look?.beam ?? 9) / 2 + 4;
      tell(S, c, { at: move === 'slam' ? A.at : H.pos, radius: r, eta: A.t, kind: move, parry: false, area: { shape: 'circle', radius: r, at: 'courier' }, type: 'impact', answer: move === 'slam' ? 'steer' : 'shoot' });
    } else if (move === 'ink') tell(S, c, { at: c.pos, radius: 4, eta: A.t, kind: 'ink', parry: false, read: false });
    else if (move === 'dive') { A.t = 0; }
  },
  tick(S, c, dt) {
    const A = c.attack, g = S.game, H = shipOf(S); c.want.set(0, 0, 0);
    if (A.t > 0 && (A.arm == null || c.arms[A.arm]?.alive !== false)) return;
    c.attack = null; g.creatures.unwind(c);
    const arm = A.arm != null ? c.arms[A.arm] : null;
    if (A.move === 'grasp') {
      if (!arm?.alive || !H || !c.engaged) return S.finish(c, 'grasp', false);
      S.finish(c, 'grasp', true);
      const m = c.row.moves.grasp; c.held = { move: 'grasp', arm: arm.id, t: m.hold, hold: m.hold };
      g.events?.emit('seaserpent.hold', { id: c.kind, move: 'grasp', by: 'creature' });
    } else if (A.move === 'slam') {
      const hit = !!arm?.alive && !!H && H.hullDist(A.at) <= SHAPE.kraken.slamR + 0.5;
      S.finish(c, 'slam', hit);
    } else if (A.move === 'ink') { c.inkT = c.row.moves.ink.hold; S.finish(c, 'ink', false); }
    else S.finish(c, A.move, false);
    c.brain.signal();
  },
  hold(S, c, dt) {
    const Hd = c.held, H = shipOf(S); Hd.t -= dt;
    if (!H || Hd.t <= 0 || !c.engaged) return this.end(S, c, 'time');
    if (!c.arms[Hd.arm]?.alive) return this.end(S, c, 'shot');
    H.mods?.set('grasp', SHAPE.kraken.grasp);
  },
  end(S, c, why) {
    S.game.opensea?.helm?.mods?.delete('grasp'); if (!c.held) return; c.held = null;
    S.game.events?.emit('seaserpent.free', { how: why, by: why === 'shot' ? 'courier' : 'creature' });
  },
  struck() {},
  /** An arm takes the blow against its own hp (broken off at none); the head only once open. */
  damage(S, c, i, power) {
    if (i === 0) return this.headOpen(c) ? power : 'blocked';
    const a = c.arms[i - 1]; if (!a?.alive) return 'blocked';
    const dmg = Math.min(power, a.hp); a.hp -= dmg;
    if (a.hp <= 0) { a.alive = false; c.body?.break(a.id); S.game.events?.emit('seaserpent.break', { id: c.kind, part: `arm${a.id}`, left: c.arms.filter((x) => x.alive).length, by: 'courier' }); if (c.held?.arm === a.id) this.end(S, c, 'shot'); }
    return dmg;
  },
  look(S, c, i) { if (i === 0) c.body?.hit('head', 1 - c.hp / c.maxHp); else { const a = c.arms[i - 1]; c.body?.hit(`arm${i - 1}`, 1 - a.hp / a.max); } },
};

export const SHAPES = { seaMonk: UMIBOZU, bigSquid: KRAKEN };
