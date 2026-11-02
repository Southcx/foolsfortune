// ---------------------------------------------------------------------------------------
// THE SMASH CHALLENGES' RUNTIME (docs/plans/MECHS.md 11.1; South, 2026-11-02 night: "have fun with the giant mech module"): the proving
// ground's lane and its lectern, and the five challenges played there. The rules are Dovina's pure kernel (progress/mechs/challenges.js:
// the lane, the rings, the pins, the scoring, the medals); this lays out what a challenge needs, reads what the mech already says, and
// says the challenge's own events. It adds no physics but one: a bowling tower that lands rolls on to the pins.
//   the lectern: a placeholder at LANE.lectern on the yard's north strip; F with the frame within REACH of it (the Jar sealed, in the
//     proving ground, no bout) opens the lane's page on the index window: each challenge with its line, the best kept (ledger
//     `challenge.best.<id>`, `challenge.medal.<id>`) and its medal bars; a click begins it (props.js grab: F with nothing to pick up);
//   start(id): lays its placeholders and spawns its props at the line through MechProps.spawn: javelin two posts and a girder, bullseye
//     three chunks of about 12 t and the rings, bowling two water towers 70 m up the lane and ten pins at the lane's end;
//   scoring: `mech.prop.throw` (with `from` and `at`) through throwLand (javelin, bullseye), `city.break` through brokeCells and
//     `city.felled` through felled (the timed ones), by the Courier only; bowling reads the tower itself: struck against the standing
//     pins every frame in flight, caught at the landing (props.js endFlight) and rolled on, slowing to rest in 30 m at most, still
//     striking; the pins fall by pinChain along the way it was going, and the ball is scored once it rests;
//   the clock: a timed challenge runs off real seconds (the rule's own; a hit-stop does not give time back); over, a beat for the last
//     pins to fall, then `challenge.end`; unsealing, a mech failing, a bout or the area left is `challenge.quit`;
//   the readout: its lines are added to the mech's readout (readout.js); the log is tracking's (feedback/tracking/mechnight.js).
//
// Prior art: The Incredible Hulk: Ultimate Destruction's minigames (Gamma Golf, Bowling, the Javelin, the timed wrecks), Wii Sports'
// bowling (the ball keeps rolling, the pins fall in a chain), Rampage; the house's rooms (world/hangar/ringbout.js: the F at a place
// while sealed, the readout) and the index window's pages (world/hangar/assembly.js).
//
//   const S = new SmashChallenges(hangar)   S.build(into)   S.teardown()   S.update(dt, real)   S.use() -> bool (F at the lectern: the page)
//   S.start(id) -> bool   S.quit()   S.run (the kernel's run, or null)   S.lines() -> [text] | null (the readout's)   S.catchBall(rec) -> bool
//   REACH   BALL   LOOK
//   placeholders (Calissa's to dress; a mesh or group each, named): challenge.lectern, challenge.line, challenge.ring.<i> (i into RINGS,
//     0 the bull), challenge.pin.<i> (i into pinSpots(); a group, its base the pivot), challenge.ball (the rolling tower's pivot)
//   events: challenge.start { id, by }, challenge.score { id, add, total, what, by }, challenge.end { id, score, medal, best, by },
//     challenge.quit { id, by }; and mech.prop.break { prop, by } where a rolled tower bursts
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { label } from '../basement/basement.js';
import { stream } from '../../core/rng.js';
import { CHALLENGES, CHALLENGE_IDS, MEDAL_NAMES, LANE, RINGS, PINS, pinSpots, newChallenge, throwLand, ball, pinChain, brokeCells, felled, tick, over, medalOf } from '../../progress/mechs/challenges.js';
import { PROVING } from './layout.js';
import { PROP_LOOK } from './props.js';

/** How near (m, the frame's middle to the lectern) F opens the page: the frame is 14 m tall. */
export const REACH = 14;
/** The rolled tower: its radius (m; a strike is within PINS.r of it), how far its middle sits above the ground, the least deceleration
 *  (m/s2; a faster ball slows so it rests in 30 m: v2 / 60), what slows it to a stop (m/s). */
export const BALL = { r: 4, centre: 4, decel: 3, stop: 0.25 };
/** The placeholders' sizes (m) and colours; the pins' fall (real s) and how long a fallen pin lies before it is swept. */
export const LOOK = {
  lectern: { w: 3, h: 5, top: 4.2, colour: 0x6b4a36, gold: 0xd9a441 }, line: { w: 1.4, colour: 0xe8e0d0 },
  rings: [0xd9a441, 0xb03a2e, 0xe8e0d0, 0x3a5ab0], pin: { w: 2.6, colour: 0xe8dcc4, band: 0xb03a2e },
  fall: 0.55, tip: 1.5, lie: 2.0, beat: 1.2, bowlBeat: 2.6, chunk: { w: 4, h: 3, d: 4, colour: 0xb5764a, mass: 12 }, gap: 8, back: 7,
};
const R = stream('world/hangar/challenges');
const CSS = `
.mk-ch{display:flex;flex-direction:column;gap:8px;width:min(720px,88vw);max-width:100%;box-sizing:border-box;color:#f2e2c8;font:13px system-ui}
.mk-ch-row{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:8px 10px;border:1px solid #c8925e;border-radius:8px;background:#3a2218}
.mk-ch-row.on{border-color:#ffd36a}.mk-ch-main{display:flex;flex-direction:column;gap:2px}
.mk-ch-name{font-weight:700;color:#fbeedd;font-size:15px;letter-spacing:.04em}.mk-ch-bars{font:11px ui-monospace,monospace;color:#d9c0a0}
.mk-ch-best{font:12px ui-monospace,monospace;color:#9fe4ff}.mk-ch-best.none{color:#d9c0a0}.mk-ch-best.gold{color:#ffd36a}
.mk-ch .mk-line{color:#d9c0a0;font-size:12px}
.mk-ch .mk-btn{min-width:90px;min-height:40px;padding:6px 12px;border-radius:8px;border:2px solid #c8925e;background:#5c3424;color:#fbeedd;font:700 14px system-ui;cursor:pointer}
`;

export class SmashChallenges {
  constructor(hangar) {
    this.hangar = hangar; this.game = hangar.game; this.into = null; this.run = null; this.parts = []; this.geos = []; this.mats = []; this.owned = new Set();
    this.balls = new Map(); this.pins = []; this.endT = 0; this.offs = []; this.styled = false; this.lectern = null;
  }
  get props() { return this.hangar.props; }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }
  get here() { return this.hangar.built && !!this.into; }

  build(into) {
    this.into = into;
    const ev = this.game.events, on = (n, f) => this.offs.push(ev.on(n, f));
    on('mech.prop.throw', (e) => this.thrown(e));
    on('city.break', (e) => { if (this.run && e.by === 'courier' && e.cells > 0) this.say(brokeCells(this.run, e.cells)); });
    on('city.felled', (e) => { if (this.run && e.by === 'courier') this.say(felled(this.run)); });
    this.layLectern();
  }
  teardown() {
    if (this.run) this.quit();
    this.clear(); for (const o of this.offs) o(); this.offs = [];
    this.lectern?.parent?.remove(this.lectern);
    this.lectern?.traverse((o) => { o.geometry?.dispose(); for (const m of [].concat(o.material || [])) { m.map?.dispose(); m.dispose(); } });
    this.lectern = null; this.geos = []; this.mats = []; this.into = null;
  }

  // ------------------------------------------------------------------ placeholders
  geo(g) { this.geos.push(g); return g; }
  mat(c, o = {}) { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...o }); this.mats.push(m); return m; }
  /** A named box mesh of `size` centred at world `p`, kept in the parts to be taken away with the challenge. */
  block(name, p, size, colour, o = {}) {
    const m = new THREE.Mesh(this.geo(new THREE.BoxGeometry(...size)), this.mat(colour, o)); m.name = name; m.position.set(...p); m.castShadow = true;
    this.into.add(m); this.parts.push(m); return m;
  }
  /** The lectern: a pedestal at the mech's scale with a gold desk and its sign (stays while the yard does). */
  layLectern() {
    const A = PROVING.at, L = LANE.lectern, K = LOOK.lectern, g = this.lectern = new THREE.Group(); g.name = 'challenge.lectern'; g.position.set(A.x + L.x, A.y, A.z + L.z);
    const add = (size, y, c) => { const m = new THREE.Mesh(this.geo(new THREE.BoxGeometry(...size)), this.mat(c)); m.position.y = y; m.castShadow = true; g.add(m); };
    add([K.w, K.h, K.w], K.h / 2, K.colour); add([K.w + 1.4, 0.5, K.w + 1.4], K.top + 0.9, K.gold);
    this.into.add(g);
    label(g, 'SMASH CHALLENGES', [0, K.h + 3.2, K.w / 2 + 0.3], { width: 9, sub: 'F with the frame beside it' });
  }
  /** Take away what a challenge laid (the placeholders, its props, any rolling tower, the pins). */
  clear() {
    const P = this.props;
    for (const r of [...(P?.list || [])]) if (this.owned.has(r.uid)) P.discard(r);
    this.owned.clear();
    for (const b of this.balls.values()) b.pivot?.parent?.remove(b.pivot);
    this.balls.clear();
    for (const pin of this.pins) pin.group.parent?.remove(pin.group);
    this.pins = [];
    for (const o of this.parts) o.parent?.remove(o);
    this.parts = []; this.run = null; this.endT = 0;
    // (the lectern's geometry stays in the lists: only a challenge's own are let go)
    const keep = new Set(this.lectern ? this.lectern.children.map((c) => c.geometry) : []), keepM = new Set(this.lectern ? this.lectern.children.map((c) => c.material) : []);
    this.geos = this.geos.filter((g) => (keep.has(g) ? true : (g.dispose(), false))); this.mats = this.mats.filter((m) => (keepM.has(m) ? true : (m.dispose(), false)));
  }

  // ------------------------------------------------------------------ the page
  /** Can a challenge be played now: the Jar sealed in the piloted mech, in the proving ground, no bout under way. */
  get playable() { const H = this.hangar; return !!(H.built && H.cradle && this.game.cradles?.sealed === H.cradle && H.pilot.mode === 'pilot' && !H.bout?.active); }
  /** The frame's distance to the lectern (m). */
  gap() { const A = PROVING.at, L = LANE.lectern, p = this.hangar.pilot.pos; return Math.hypot(p.x - (A.x + L.x), p.z - (A.z + L.z)); }
  /** F at the lectern with nothing to pick up: the page, when playable and near. True when F was the lectern's. */
  use() { if (!this.here || !this.playable || this.gap() > REACH) return false; this.open(); return true; }

  open() {
    const m = this.menu, L = this.game.ledger; if (!m?.showPage) return;
    if (!this.styled) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); this.styled = true; }
    m.showPage('smash', (im, el) => {
      const root = el('div', 'mk-ch'); im.appendChild(root);
      root.appendChild(el('div', 'mk-line', 'Pick one; it begins as you click. Throw from the line, or break what stands. Leaving the yard or unsealing ends it.'));
      for (const id of CHALLENGE_IDS) {
        const C = CHALLENGES[id], best = L?.get?.(`challenge.best.${id}`) || 0, medal = L?.get?.(`challenge.medal.${id}`) || 0;
        const row = el('div', `mk-ch-row${this.run?.id === id ? ' on' : ''}`), main = el('div', 'mk-ch-main');
        main.append(el('div', 'mk-ch-name', C.label), el('div', 'mk-line', C.line),
          el('div', 'mk-ch-bars', C.medals.map((b, i) => `${MEDAL_NAMES[i + 1].toUpperCase()} ${b}`).join('   ') + `  ${C.unit}`),
          el('div', `mk-ch-best${best ? (medal >= 3 ? ' gold' : '') : ' none'}`, best ? `BEST ${best} ${C.unit}  ${MEDAL_NAMES[medal].toUpperCase()}` : 'NOT PLAYED'));
        const b = el('button', 'mk-btn', this.run?.id === id ? 'AGAIN' : 'BEGIN');
        b.onclick = (e) => { e.stopPropagation(); m.close(); this.start(id); };
        row.append(main, b); root.appendChild(row);
      }
    }, { title: 'THE LANE', sub: 'click a challenge · F closes' });
  }

  // ------------------------------------------------------------------ begin and end
  /** Begin a challenge: the old one quit, the lane laid, the props at the line. False if it cannot be played now. */
  start(id) {
    const C = CHALLENGES[id]; if (!C || !this.here || !this.playable || !this.props?.mats) return false;
    if (this.run) this.quit();
    const run = newChallenge(id), A = PROVING.at, y = A.y, X = A.x, Z = A.z + LANE.z;
    this.run = run;
    const lineX = LANE.line + (id === 'bowling' ? C.from : 0);
    this.block('challenge.line', [X + lineX, y + 0.1, Z], [LOOK.line.w, 0.2, LANE.width], LOOK.line.colour, { emissive: new THREE.Color(LOOK.line.colour), emissiveIntensity: 0.3 });
    const put = (prop, i, n, o = {}) => { // (the props in a row across the lane behind the line, each pointing down it)
      const dz = (i - (n - 1) / 2) * (o.gap ?? LOOK.gap), at = new THREE.Vector3(X + lineX - LOOK.back, y, Z + dz);
      const rec = this.props.spawn(prop, { at, upright: prop === 'tower', mass: o.mass, mesh: o.mesh });
      if (rec) { if (prop === 'post' || prop === 'girder') rec.mesh.rotation.y = Math.PI / 2; this.owned.add(rec.uid); }
      return rec;
    };
    if (id === 'javelin') { put('post', 0, 3); put('girder', 1, 3); put('post', 2, 3); }
    else if (id === 'bullseye') {
      const tx = LANE.line + C.target;
      RINGS.forEach((rg, i) => {
        const m = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(rg.r, rg.r, 0.1, 48)), this.mat(LOOK.rings[i % LOOK.rings.length], { polygonOffset: true, polygonOffsetFactor: -(RINGS.length - i), polygonOffsetUnits: -(RINGS.length - i) }));
        m.name = `challenge.ring.${i}`; m.position.set(X + tx, y + 0.06 + (RINGS.length - i) * 0.04, Z); this.into.add(m); this.parts.push(m);
      });
      for (let i = 0; i < 3; i++) {
        const K = LOOK.chunk, mesh = new THREE.Mesh(new THREE.BoxGeometry(K.w, K.h, K.d), this.mat(K.colour)); mesh.castShadow = true;
        mesh.position.set(X + lineX - LOOK.back, y + K.h / 2 + 0.4, Z + (i - 1) * LOOK.gap * 1.3);
        put('chunk', i, 3, { mass: K.mass, mesh, gap: LOOK.gap * 1.3 });
      }
    } else if (id === 'bowling') {
      put('tower', 0, 2, { gap: 12 }); put('tower', 1, 2, { gap: 12 });
      pinSpots().forEach((s, i) => this.layPin(i, s, X, y, A.z));
    }
    this.game.events?.emit('challenge.start', { id, by: 'courier' });
    return true;
  }
  /** A pin: a group pivoted at its foot (it tips over about it), a plain box with a band. */
  layPin(i, s, X, y, Z0) {
    const w = LOOK.pin.w, g = new THREE.Group(); g.name = `challenge.pin.${i}`; g.position.set(X + s.x, y, Z0 + s.z);
    const body = new THREE.Mesh(this.geo(new THREE.BoxGeometry(w, PINS.h, w)), this.mat(LOOK.pin.colour)), band = new THREE.Mesh(this.geo(new THREE.BoxGeometry(w + 0.1, 0.9, w + 0.1)), this.mat(LOOK.pin.band));
    body.position.y = PINS.h / 2; band.position.y = PINS.h * 0.72; body.castShadow = true; g.add(body, band);
    this.into.add(g); this.pins.push({ i, x: s.x, z: s.z, group: g, fell: false, t: 0, axis: new THREE.Vector3(0, 0, 1) });
  }
  /** The challenge over: its result said, then it is cleared. */
  finish() {
    const run = this.run; if (!run) return;
    const prev = this.game.ledger?.get?.(`challenge.best.${run.id}`) || 0;
    this.game.events?.emit('challenge.end', { id: run.id, score: run.score, medal: medalOf(run.id, run.score), best: run.score > prev, by: 'courier' });
    this.clear();
  }
  /** The challenge given up (the Jar out, a bout, the area left, another begun). */
  quit() { const run = this.run; if (!run) return; this.game.events?.emit('challenge.quit', { id: run.id, by: 'courier' }); this.clear(); }
  say(res) { if (res && this.run) this.game.events?.emit('challenge.score', { id: this.run.id, add: res.add, total: this.run.score, what: res.what, by: 'courier' }); }

  // ------------------------------------------------------------------ scoring
  /** A prop came down (props.js): the javelin's distance, or the bullseye's ring, from the throw's `from` and `at` in local metres. */
  thrown(e) {
    const run = this.run; if (!run || e.by !== 'courier' || !e.from || !e.at) return;
    const A = PROVING.at, loc = (p) => [p[0] - A.x, p[1] - A.y, p[2] - A.z];
    this.say(throwLand(run, { from: loc(e.from), at: loc(e.at), prop: e.prop }));
  }

  // ------------------------------------------------------------------ the bowling ball
  /** The tower's record for this ball, made when it is first seen thrown. */
  ballOf(r) {
    let b = this.balls.get(r.uid);
    if (!b) { b = { r, phase: 'flight', pivot: null, struck: new Set(), knocked: new Set(), dir: null, speed: 0, ux: 1, uz: 0, a: BALL.decel, axis: new THREE.Vector3() }; this.balls.set(r.uid, b); }
    return b;
  }
  /** props.js endFlight: a challenge tower that landed is taken over to roll (true), not burst. */
  catchBall(r) {
    if (this.run?.id !== 'bowling' || !this.owned.has(r.uid) || r.prop !== 'tower') return false;
    const b = this.ballOf(r), vx = r.vel.x, vz = r.vel.z, sp = Math.hypot(vx, vz), A = PROVING.at;
    r.state = 'rolling'; r.vel.set(0, 0, 0);
    b.ux = sp > 0.5 ? vx / sp : 1; b.uz = sp > 0.5 ? vz / sp : 0; b.speed = sp; b.a = Math.max(BALL.decel, (sp * sp) / 60); b.dir ||= [b.ux, b.uz];
    b.axis.set(b.uz, 0, -b.ux); b.phase = 'roll';
    const piv = b.pivot = new THREE.Group(); piv.name = 'challenge.ball'; piv.position.set(r.mesh.position.x, A.y + BALL.centre, r.mesh.position.z);
    this.into.add(piv); r.mesh.rotation.set(0, 0, 0); r.mesh.position.set(0, -(PROP_LOOK.tower.legs + PROP_LOOK.tower.h / 2), 0); piv.add(r.mesh); // (the tank's middle at the pivot)
    if (sp <= BALL.stop * 2) this.rest(b);
    return true;
  }
  /** The ball at (lx, lz) local going (ux, uz): the standing pins it touches fall, and those they knock down in a chain. */
  strike(b, lx, lz, ux, uz) {
    const stand = this.pins.filter((p) => !p.fell), reach = PINS.r + BALL.r, hit = stand.filter((p) => Math.hypot(p.x - lx, p.z - lz) < reach);
    if (!hit.length) return;
    const down = pinChain(stand.map((p) => ({ x: p.x, z: p.z })), hit.map((p) => stand.indexOf(p)), [ux, uz]);
    for (const j of down) {
      const p = stand[j]; let near = null, nd = Infinity;
      for (const h of hit) { const d = Math.hypot(p.x - h.x, p.z - h.z); if (d < nd) { nd = d; near = h; } }
      const direct = hit.includes(p), dx = direct || nd < 0.01 ? ux : (p.x - near.x) / nd, dz = direct || nd < 0.01 ? uz : (p.z - near.z) / nd;
      this.topple(p, direct ? 0 : nd / 28, dx, dz); b.knocked.add(p.i); b.struck.add(p.i);
    }
  }
  /** A pin set falling (after `delay` real s) along (dx, dz), a little off true so a row does not lie in one line. */
  topple(p, delay, dx, dz) {
    const j = (R() - 0.5) * 0.4, c = Math.cos(j), s = Math.sin(j), fx = dx * c - dz * s, fz = dx * s + dz * c;
    p.fell = true; p.t = -delay; p.axis.set(fz, 0, -fx);
  }
  /** The ball at rest: scored, the tower burst where it stopped. */
  rest(b) {
    const r = b.r, P = this.props, n = b.knocked.size;
    this.balls.delete(r.uid); this.owned.delete(r.uid);
    P.shatter(r); b.pivot?.parent?.remove(b.pivot);
    this.game.events?.emit('mech.prop.break', { prop: r.prop, by: 'courier' });
    this.say(ball(this.run, n));
  }
  /** One frame of bowling: a thrown tower in the air is struck against the pins; a rolling one is carried on, slowing, still striking. */
  bowl(dt) {
    const A = PROVING.at, P = this.props;
    for (const r of P.list) {
      if (r.state !== 'flying' || !r.flight || r.prop !== 'tower' || !this.owned.has(r.uid)) continue;
      const b = this.ballOf(r), m = r.mesh.position;
      if (m.y - A.y < PINS.h) { const sp = Math.hypot(r.vel.x, r.vel.z) || 1, ux = r.vel.x / sp, uz = r.vel.z / sp; b.dir ||= [ux, uz]; this.strike(b, m.x - A.x, m.z - A.z, ux, uz); }
    }
    for (const b of [...this.balls.values()]) {
      if (b.phase !== 'roll') continue;
      b.speed = Math.max(0, b.speed - b.a * dt);
      const step = b.speed * dt, piv = b.pivot; piv.position.x += b.ux * step; piv.position.z += b.uz * step; piv.rotateOnAxis(b.axis, step / BALL.r);
      this.strike(b, piv.position.x - A.x, piv.position.z - A.z, b.ux, b.uz);
      if (b.speed <= BALL.stop) this.rest(b);
    }
  }
  /** The pins tipping over about their feet, lying a while, then swept so the next ball sees what stands. */
  animatePins(dt) {
    for (const p of this.pins) {
      if (!p.fell) continue;
      p.t += dt; if (p.t < 0) continue;
      const k = Math.min(1, p.t / LOOK.fall); p.group.quaternion.setFromAxisAngle(p.axis, k * k * LOOK.tip);
      if (p.t > LOOK.fall + LOOK.lie) p.group.visible = false;
    }
  }

  // ------------------------------------------------------------------ the frame
  /** The hangar's frame: the clock, the ball, the pins, the end. `real` is real seconds (a timed challenge's clock). */
  update(dt, real = dt) {
    const run = this.run; if (!run) return;
    if (!this.here || !this.playable) { this.quit(); return; }
    if (run.id === 'bowling') { this.bowl(dt); this.animatePins(dt); }
    if (this.endT > 0) { if ((this.endT -= real) <= 0) this.finish(); return; }
    if (run.left != null) tick(run, real);
    if (over(run) && !this.balls.size) this.endT = run.id === 'bowling' ? LOOK.bowlBeat : LOOK.beat;
  }

  // ------------------------------------------------------------------ the readout's lines
  /** What the mech's readout adds: the running challenge's, or the lectern's offer when the frame stands at it. Null otherwise. */
  lines() {
    const run = this.run;
    if (!run) return this.here && this.playable && this.gap() <= REACH ? ['SMASH CHALLENGES', 'F  CHOOSE'] : null;
    const C = CHALLENGES[run.id], next = C.medals.findIndex((b) => run.score < b), standing = run.id === 'bowling' ? this.pins.filter((p) => !p.fell).length : null;
    const out = [C.label.toUpperCase(), `SCORE    ${run.score} ${C.unit}`];
    if (run.left != null) out.push(`TIME     ${Math.ceil(run.left)} s`);
    else out.push(`THROWS   ${run.tries} left`);
    if (standing != null) out.push(`PINS     ${standing} standing`);
    out.push(next >= 0 ? `NEXT     ${MEDAL_NAMES[next + 1].toUpperCase()} ${C.medals[next]}` : 'NEXT     all medals won');
    return out;
  }
}
