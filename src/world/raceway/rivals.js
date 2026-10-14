// ---------------------------------------------------------------------------------------
// THE RIVALS (docs/plans/SKIFF-RACING.md section 11; the owner, v198: "clapperjars on mini skiffs as racing opponents, to show off types of
// racing AI, like rubberbanding, as evil as it is", and "Flatout/Burnout style collision to bump them"): three clapperjars on mini skiffs
// race the track you race. Each follows the line at its own lane and skill: it slows for a bend by its grip (v = sqrt(grip / curvature),
// read a stretch ahead, as a driver brakes for the corner it sees), takes a deck where the line is a bridge, glides off a cliff on a
// sink of one in five, and sometimes takes the cavern. RUBBER BANDING (Mario Kart's): a rival ahead of you eases off, one behind is
// pushed on, by how far; it keeps the pack together (and it is, as the owner says, evil: each step of it is a number here, to be turned
// down). BUMPS (Burnout's and FlatOut's): you and a rival push each other apart by your closing speed; hit one hard from the side and it
// is TAKEN DOWN, spun out for a beat, and you are paid in speed (a push) and a third of a banked flare (Burnout's boost for a takedown).
// Their places are counted against yours (race.place), and a race's finish says where you came.
// PERSONALITIES (round 6): the same mind weighted four ways: a BLOCKER takes your line when you are close behind; a RAIL HOG rides the
// track's rails where it can (a lintel's top, a little quicker); a GAMBLER takes the cavern and the inside of every bend; a CLEAN racer
// keeps its lane. THE NEMESIS: the rival that beat you last remembers it (the save's `raceNemesis`): next race it is a little quicker and
// claps at you as it passes (a glyph, no words); beat it and it is forgotten. THE SIBLINGS: the five divisions on skiffs, the hard tier,
// each with its own personality (opened by winning a race, or lent in DEBUG).
// Events: race.place { place, of }, race.bump { rival, impact }, race.takedown { rival, how }, race.rival.finish { rival, seconds },
// race.nemesis { rival, beaten }, race.taunt { rival } (with `by`).
// Placeholders: a clapperjar (the creatures' own model, held still) on a board of a box and a sail; their look and their riding are
// Calissa's to make.
//
// Prior art: Mario Kart's rubber banding and its CPU racers on a racing line; Gran Turismo's AI braking for what it can see; Burnout 3's
// takedowns (a side hit spins a rival out and fills your boost) and FlatOut's bumping; Crash Team Racing's pack.
//
//   const V = new Rivals(game)   V.start(T, solo, roster)   V.go()   V.update(dt, race)   V.stop()   V.place   V.order(race)   V.settle(place)
//   V.takedown(r, how)   ROSTERS   RIVAL (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { RW } from './track.js';

/** The rosters: each rival's name (working names: the clapperjars' Espada's), personality, skill and colour. */
export const ROSTERS = {
  clapperjars: [{ name: 'Clink', kind: 'blocker', skill: 0.95, colour: 0xc98a62 }, { name: 'Crock', kind: 'railhog', skill: 0.99, colour: 0x8a6aa8 }, { name: 'Glaze', kind: 'gambler', skill: 1.03, colour: 0x6aa88a }],
  siblings: [{ name: 'Petra', kind: 'clean', skill: 1.07, colour: 0xd9c08a, sibling: true }, { name: 'Calissa', kind: 'railhog', skill: 1.05, colour: 0x6ab8d9, sibling: true }, { name: 'Espada', kind: 'gambler', skill: 1.06, colour: 0x9a9ab0, sibling: true }],
};
/** Their pace (top speed m/s at skill 1, acceleration and braking m/s^2, the grip a bend is taken at m/s^2, metres ahead a bend is read),
 *  each one's skill, lane (m right of the line) and reaction at GO (real s); the rubber band (metres ahead or behind at which it is at its
 *  most, and the most it slows a leader or speeds a trailer); the hover and the glide's sink; the bump (metres apart they touch, the
 *  share of closing speed each takes, the closing speed across a rival's side that takes it down, real seconds spun out, the banked
 *  flare a takedown pays, the push it pays). */
export const RIVAL = {
  top: 33, accel: 9, brake: 14, grip: 9, look: 45,
  lanes: [-4, 4, 0], grid: [-12, -12, -30], react: [0.25, 0.15, 0.35],
  block: 25, nemesis: 0.03, railRide: 0.55, railPace: 1.08, inside: 3,
  band: { ahead: 60, behind: 140, slow: 0.8, fast: 1.18 }, // (a leader eases to 0.8 by 60 m ahead: the pack stays near; measured: they beat the autopilot by 12 to 33 s over three laps at 90 m and 0.86)
  hover: 0.6, sink: 5,
  bump: { r: 2.3, share: 0.5, takedown: 7, out: 2.4, flare: 0.35, push: [6, 0.8, 2] },
};

const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Rivals {
  constructor(game) {
    this.game = game; this.list = []; this.on = false; this.place = 1; this.nemesis = null; // ({ roster, i })
    game.save?.section('raceNemesis', { scope: 'player', version: 1, dump: () => this.nemesis, load: (d) => { this.nemesis = d?.roster ? d : null; }, reset: () => { this.nemesis = null; } });
  }
  get R() { return this.game.raceway; }

  /** On the grid of track T, held until GO (none when `solo`). */
  start(T, solo = false, roster = 'clapperjars') {
    this.stop(); this.T = T; this.on = !solo; this.roster = roster; if (solo) return;
    const L = T.length, Ns = this.nemesis?.roster === roster ? this.nemesis.i : -1;
    this.list = ROSTERS[roster].map((P, i) => ({ i, P, name: P.name, kind: P.kind, skill: P.skill + (i === Ns ? RIVAL.nemesis : 0), nemesis: i === Ns, lane: RIVAL.lanes[i], lat: RIVAL.lanes[i], d: RIVAL.grid[i] - 20, v: 0, y: null, wreck: 0, react: RIVAL.react[i], cave: P.kind === 'gambler' && !!T.branch, lap: 0, done: null, cool: 0, ahead: false, group: this.body(i, P) }));
    // the rail hog's rails: each lintel rail of the track as its stretch of line, lat and points
    this.railSpans = (T.features.rails || []).filter((d) => !d.line).map((d, k) => { const s0 = T.sOf(d.from[0], d.from[1]), s1r = T.sOf(d.to[0], d.to[1]); return { s0, s1: s1r >= s0 ? s1r : s1r + L, lat0: d.from[2], lat1: d.to[2], rail: (this.R.rails || []).filter((r) => r.track === T.id && !r.coaster)[k] }; });
    for (const r of this.list) { this.place3d(r, 0); this.game.scene.add(r.group); }
    this.go0 = null; this.L = L;
  }
  go() { this.go0 = 0; }
  stop() { for (const r of this.list) { r.group.removeFromParent(); } this.list = []; this.on = false; }

  /** A rival's body: a mini skiff (a hull and a sail) with a clapperjar standing on it, the creatures' own model where it is loaded. */
  body(i, P) {
    const g = this.game, group = new THREE.Group(); group.userData.zone = 'raceway';
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 1.9), new THREE.MeshStandardMaterial({ color: P.colour, roughness: 0.8, flatShading: true }));
    const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.1, 0.5), new THREE.Vector3(0, 2.1, 0.1), new THREE.Vector3(0, 0.1, -0.7)]), new THREE.MeshStandardMaterial({ color: 0xfff1d6, side: THREE.DoubleSide, roughness: 0.9 }));
    sail.geometry.computeVertexNormals(); group.add(hull, sail);
    const src = g.clappers?.gltf?.scene;
    if (P.sibling) { const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 4, 8), new THREE.MeshStandardMaterial({ color: P.colour, roughness: 0.7 })); rider.position.set(0, 0.85, -0.1); group.add(rider); } // (a sibling: a placeholder rider, Calissa's to dress with the sibling's own rig)
    else if (src) { const jar = cloneSkinned(src); jar.scale.setScalar(2.2); jar.position.set(0, 0.12, -0.2); if (g.clappers.mat) jar.traverse((o) => { if (o.isMesh) o.material = g.clappers.mat; }); group.add(jar); }
    else { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xd9906a, roughness: 0.9 })); pot.position.set(0, 0.42, -0.2); group.add(pot); }
    return group;
  }

  /** Where a rival is: its place on the line (or the cavern's, if it takes it), a little over the ground, gliding off a drop. */
  place3d(r, dt) {
    const T = this.T, R = this.R, L = T.length, s = ((T.line + r.d) % L + L) % L, Bn = T.branch;
    let F = T.frame(s);
    if (r.cave && Bn) { const u = ((s - Bn.from) % L + L) % L; if (u < Bn.span) F = Bn.frame((u / Bn.span) * Bn.length); }
    const lat = Math.max(-F.w + 1.5, Math.min(F.w - 1.5, r.lat)), x = RW.x + F.x - F.fz * lat, z = RW.z + F.z + F.fx * lat;
    const decked = T.decks.some((D) => s >= D.s0 && s <= D.s1);
    let ground = (decked ? RW.y + F.y : R.heightAt(x, z)) + RIVAL.hover;
    if (r.onRail) { let best = null; for (const p of r.onRail.rail.pts) { const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (!best || dd < best.dd) best = { dd, y: p.y }; } if (best && best.dd < 4) ground = Math.max(ground, best.y + RIVAL.railRide); } // (the rail hog on a lintel's top)
    r.y = r.y == null || dt === 0 ? ground : Math.max(ground, r.y - (r.v * dt) / RIVAL.sink); // (off a drop it glides down at one in five)
    r.group.position.set(x, r.y, z);
    r.group.quaternion.setFromAxisAngle(UP, Math.atan2(F.fx, F.fz) + (r.wreck > 0 ? r.wreck * 9 : 0));
    r.s = s; r.F = F;
  }

  /** Your distance into the race, as theirs is counted (from the line, laps whole). */
  mine(race) { const L = this.T.length; return (race.lap - 1) * L + ((this.R.s - this.T.line) % L + L) % L - (race.lap === 1 && ((this.R.s - this.T.line) % L + L) % L > L - 60 ? L : 0); }

  update(dt, race) {
    if (!this.on || !this.list.length) return;
    const g = this.game, T = this.T, L = T.length, B = RIVAL.band, me = this.mine(race), running = race.state === 'run';
    if (running && this.go0 != null) this.go0 += dt;
    for (const r of this.list) {
      r.cool = Math.max(0, r.cool - dt);
      if (r.done == null && running && this.go0 > r.react) {
        // the bend it can see: the turn of the line over the next stretch, and the speed its grip allows there
        const a = T.frame(r.s), b = T.frame(r.s + RIVAL.look), turn = Math.abs(wrap(Math.atan2(b.fx, b.fz) - Math.atan2(a.fx, a.fz))) / RIVAL.look;
        const gap = r.d - me, band = gap > 0 ? 1 - (1 - B.slow) * Math.min(1, gap / B.ahead) : 1 + (B.fast - 1) * Math.min(1, -gap / B.behind);
        const sNow = ((r.d % L) + L) % L + T.line, span = r.kind === 'railhog' ? this.railSpans.find((P) => ((sNow - P.s0) % L + L) % L <= P.s1 - P.s0 && P.rail) : null;
        r.onRail = span || null;
        const want = Math.min(RIVAL.top * r.skill * band * (span ? RIVAL.railPace : 1), turn > 1e-4 ? Math.sqrt(RIVAL.grip / turn) * (span ? 1.3 : 1) : 1e9) * (r.wreck > 0 ? 0 : 1);
        r.v = r.v < want ? Math.min(want, r.v + RIVAL.accel * dt) : Math.max(want, r.v - RIVAL.brake * dt);
        r.d += r.v * dt;
        // its line: its lane, weaving a little; out of your way when you are on it (the clean); onto yours when you are close behind (the
        // blocker); along a rail (the hog); to the inside of the bend (the gambler)
        const myLat = this.R.lat, near = Math.abs(r.d - me) < 8 && Math.abs(r.lat - myLat) < 3, behind = me < r.d && r.d - me < RIVAL.block;
        let aim = r.lane + Math.sin(this.go0 * 0.4 + r.i * 2) * 1.5;
        if (r.kind === 'blocker' && behind) aim = myLat;
        else if (span) { const k = ((((sNow - span.s0) % L) + L) % L) / Math.max(1, span.s1 - span.s0); aim = span.lat0 + (span.lat1 - span.lat0) * k; }
        else if (r.kind === 'gambler') { const sd = Math.sign(wrap(Math.atan2(b.fx, b.fz) - Math.atan2(a.fx, a.fz))); aim = sd * -RIVAL.inside + r.lane * 0.3; } // (heading growing: a left bend, its inside the left: negative lat)
        else if (near) aim = r.lane + Math.sign(r.lat - myLat || 1) * 3;
        r.lat += (aim - r.lat) * Math.min(1, dt * 1.5);
        // the nemesis claps as it passes you
        const ahead = r.d > me; if (ahead && !r.ahead && r.nemesis && Math.abs(r.d - me) < 15) { g.glyphs?.pop('bang1', r.group.position.clone().setY(r.group.position.y + 2.2), { color: 0xffd76a, size: 0.7, burst: true, follow: () => r.group.position }); g.events?.emit('race.taunt', { rival: r.i, who: r.name, by: 'creature' }); }
        r.ahead = ahead;
        if (r.d >= RIVAL_LAPS(race) * L && r.done == null) { r.done = race.t; g.events?.emit('race.rival.finish', { rival: r.i, seconds: +race.t.toFixed(2), by: 'creature' }); }
      } else if (r.done != null) { r.v = Math.max(8, r.v - dt * 3); r.d += r.v * dt; }
      r.wreck = Math.max(0, r.wreck - dt);
      this.place3d(r, dt);
    }
    if (running) { this.bumps(dt); this.ranks(me, race); }
  }

  /** Your place: one more than the rivals ahead of you (a finished one is ahead of a racer still running). */
  ranks(me, race) {
    const place = 1 + this.list.filter((r) => (r.done != null && race.running) || r.d > me).length;
    if (place !== this.place) { this.place = place; this.game.events?.emit('race.place', { place, of: this.list.length + 1, by: 'courier' }); }
  }

  /** Every racer's order at your finish: you, then the rivals by their finish time or, still running, how far they had come (the cups'
   *  points: cups.js). [{ who: 'you' | rival index, place }] */
  order(race) {
    const me = { who: 'you', done: race.t, d: Infinity }, all = [me, ...this.list.map((r) => ({ who: r.i, done: r.done, d: r.d }))];
    all.sort((a, b) => (a.done != null && b.done != null ? a.done - b.done : a.done != null ? -1 : b.done != null ? 1 : b.d - a.d));
    return all.map((x, k) => ({ who: x.who, place: k + 1 }));
  }
  /** A rival taken down (a side hit, a shoulder, aftertouch): spun out, and you paid in a push and a share of a banked flare. */
  takedown(r, how = 'side') {
    if (r.wreck > 0) return;
    const g = this.game, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null, Bp = RIVAL.bump;
    r.wreck = Bp.out; r.v *= 0.3; r.cool = 0.6;
    if (S && how !== 'aftertouch') S.kick?.(...Bp.push); if (S?.combo) S.combo.stocks = Math.min(3, S.combo.stocks + Bp.flare);
    g.events?.emit('race.takedown', { rival: r.i, who: r.name, how, by: 'courier' });
  }
  /** After a race: the rival that beat you (the nearest ahead) is the nemesis; the nemesis beaten is forgotten. */
  settle(place) {
    if (!this.list.length) return;
    const g = this.game, ahead = this.list.filter((r) => r.done != null).sort((a, b) => b.done - a.done), N = this.list.find((r) => r.nemesis);
    if (N && N.done == null) { this.nemesis = null; g.events?.emit('race.nemesis', { rival: N.i, who: N.name, beaten: true, by: 'courier' }); }
    if (place > 1 && ahead[0]) { this.nemesis = { roster: this.roster, i: ahead[0].i }; g.events?.emit('race.nemesis', { rival: ahead[0].i, who: ahead[0].name, beaten: false, by: 'creature' }); }
    g.save?.dirty('raceNemesis');
  }

  /** You and a rival touching: pushed apart by the closing speed (by your hull's weight: the garage), the pool drained by it (the hull:
   *  boardrules.js); a hard side hit takes it down (Burnout's takedown). */
  bumps() {
    const g = this.game, P = g.player, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null, Bp = RIVAL.bump; if (!S || S.phase !== 'ride') return;
    for (const r of this.list) {
      const dx = P.pos.x - r.group.position.x, dz = P.pos.z - r.group.position.z, d = Math.hypot(dx, dz);
      if (d > Bp.r || d < 1e-3 || Math.abs(P.pos.y - r.group.position.y) > 2.5 || r.cool > 0) continue;
      const nx = dx / d, nz = dz / d, rf = _v.set(r.F.fx, 0, r.F.fz), rvx = rf.x * r.v, rvz = rf.z * r.v;
      const closing = -((S.v.x - rvx) * nx + (S.v.z - rvz) * nz); if (closing <= 0) continue;
      const side = Math.abs(nx * -rf.z + nz * rf.x); // (how square to the rival's side the hit is: 1 broadside, 0 nose to tail)
      const mass = S.rules?.mult('mass') ?? 1;
      S.v.x += (nx * closing * Bp.share) / mass; S.v.z += (nz * closing * Bp.share) / mass; P.pos.x += nx * (Bp.r - d); P.pos.z += nz * (Bp.r - d);
      r.lat -= (nx * -rf.z + nz * rf.x) * closing * Bp.share * 0.3 * mass; r.v = Math.max(0, r.v - closing * Bp.share * (1 - side) * mass); r.cool = 0.4;
      if (S.rules?.hit('bump', closing / mass)) return; // (the hull: a bump drains the pool; empty, it wrecks you)
      if (closing * mass > Bp.takedown && side > 0.5) this.takedown(r, 'side');
      else g.events?.emit('race.bump', { rival: r.i, impact: +closing.toFixed(1), by: 'courier' });
    }
  }
}
const RIVAL_LAPS = (race) => race.lapsTotal || 3;
