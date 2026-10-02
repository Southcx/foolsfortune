import * as THREE from 'three';
import { HeldTool } from '../tools/heldtool.js';
import { DreamvaneModel, FORK as FORK_SIZE } from '../dreamvane/model.js';
import { measureSwing, sweep, magnet } from '../combat/melee.js';
import { G, groups } from '../physics.js';
import { sfx } from '../audio.js';

// ---------------------------------------------------------------------------------------
// THE DREAMVANE: the fifth of the Courier's psychic tools. A shepherd's crook with a dreamcatcher hung in it, a pick across it and a
// tuning fork in its heel (dreamvane/model.js), worn across the back and held in both hands. It is a TRACKER first: it hears Lachryma
// (signatures.js) and leans toward it; a pick second (crystal: lachryma/crystals.js); and its fork is how Lachryma is drawn out of
// things.
//
//  - DOWSE (hold RMB): the dreamcatcher turns on its pin toward the loudest Lachryma about, and its web lights and its bead ticks faster
//    the more nearly she faces it and the nearer it is (Skyward Sword's dowsing: turn until it sings). The wheel ATTUNES it: to
//    anything, or only to crystal, to chests, to the living, to what lies loose. What it finds clearly is charted (the map).
//  - THE PICK (LMB): a two-handed overhead blow (UAL Sword_Regular_C, the cutlass's finisher, measured: combat/melee.js). Crystal gives to it a blow at a time;
//    pots and clapperjars and minds are struck as by any heavy thing. Struck into the sand where the vane says something is VEILED,
//    the crystal under it rises.
//  - THE FORK (tap RMB): thrown where she looks (UAL Throw), it sticks and RINGS. In a crystal, the crystal rings with it: the pick's
//    blows give twice, and the last a shard. In a creature, the ringing shakes the Lachryma out of it (liquid baubles, and its poise
//    goes). In the ground, it rings on its own: a sound every creature near goes to look at (a lure: ai/stimuli.js). Tap again and it
//    comes back to the heel (the Leviathan Axe's recall), or it comes back when it has rung out.
//
//  - THE SURVEY (MMB): the heel struck into the ground, and the Mind's ring goes out from her: what is in sight is understood (Mind
//    Mapping's pulse: cartography.js; it was N). The compass across the top of the view is the Dreamvane's too: it shows while it is worn.
//
//   K      draw / stow (X, Q, G, J draw theirs instead)          RMB hold  dowse (the wheel: attune)          RMB tap  throw / recall the fork
//   LMB    the pick                                                MMB       the survey
//
// Prior art: Skyward Sword's dowsing, Pikmin's and Death Stranding's scanners (a sense that points, not a map that shows), the
// pickaxe of every mining game (Minecraft, Deep Rock Galactic), God of War's Leviathan Axe (thrown, stuck, recalled), and the tuning
// fork itself (struck, it sets what it touches ringing at its pitch).
// ---------------------------------------------------------------------------------------
const PICK = { clip: 'swordC', from: 0.25, to: 1.3 }; // (UAL Sword_Regular_C: the overhead brought down to the ground, measured: its strike 0.6-0.7 s)
const SURVEY = { clip: 'swordC', from: 0.45, strike: 0.32, dur: 0.75 }; // (the heel struck down: the pick's downstroke for now)
const TAP = 0.16, RANGE = 70, FORK = { speed: 34, gravity: 6, ring: 7, back: 28, reach: 60, life: 2.2 };
const ATTUNE = [
  { id: 'any', kinds: null, color: 0xe8d7b6 },
  { id: 'crystal', kinds: ['crystal'], color: 0xcdb8f2 },
  { id: 'chest', kinds: ['chest'], color: 0xffb27a },
  { id: 'living', kinds: ['creature', 'clapper', 'spirit'], color: 0x9be36a },
  { id: 'loose', kinds: ['bauble', 'liquid', 'cube'], color: 0x9fe6ff },
];
const FORK_HITS = groups(0xffff, G.STATIC | G.PROP | G.CRITTER);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Dreamvane extends HeldTool {
  constructor(mgr) {
    super(mgr, 'dreamvane', {
      key: 'KeyK',
      // across the back, the crook up over the right shoulder, the heel down by the left hip (a staff slung on a strap)
      worn: { at: [0.1, 1.05, -0.2], along: [-0.55, 1, -0.05], out: [0, 0, -1] },
      draw: { twist: -18, lean: 8, via: [-0.45, 1.25, 0.1], pole: [-0.5, -0.25, -0.35] },
      idle: 'stance:dreamvane', idles: ['stance:dreamvane', 'idle'], grip: 'torchIdle', drawK: 1.2, // (her pilgrim's stance: anim/stances.js)
    });
    this.model = new DreamvaneModel();
    this.mount();
    this.mgr.game.dreamvane = this;
    this.rmbT = -1; this.dowsing = false; this.att = 0; this.glow = 0; this.tickT = 0; this.found = new WeakSet(); this.charted = new WeakSet();
    this.swing = null; this.throwT = -1; this.surveyT = -1;
    this.fork = { state: 'heel', mesh: null, pos: new THREE.Vector3(), vel: new THREE.Vector3(), t: 0, ring: 0, ent: null, off: new THREE.Vector3(), beat: 0 };
    this.needle = { yaw: 0, pitch: 0 };
  }
  get busy() { return !!this.swing || this.throwT >= 0; }
  get slow() { return this.toolOut && (this.dowsing || this.swing) ? 0.7 : 1; }

  onStow() { this.dowsing = false; this.swing = null; this.throwT = -1; this.surveyT = -1; this.rmbT = -1; if (this.fork.state !== 'heel') this.home(); }

  // ---------------------------------------------------------------- input, while it is in the hands
  use(dt, raw, inp) {
    const g = this.game;
    if (inp.wasPressed('Mouse0') && !this.swing && this.throwT < 0 && this.surveyT < 0) this.startSwing();
    if (inp.wasPressed('Mouse1') && !this.swing && this.throwT < 0 && this.surveyT < 0) this.startSurvey();
    if (inp.wasPressed('Mouse2')) this.rmbT = 0;
    if (this.rmbT >= 0) {
      this.rmbT += raw;
      if (!inp.isDown('Mouse2')) { if (this.rmbT < TAP && !this.dowsing) this.forkButton(); this.rmbT = -1; this.dowsing = false; }
      else if (this.rmbT >= TAP && !this.swing) this.dowsing = true;
    }
    if (this.dowsing && inp.wheel) { this.att = (this.att + (inp.wheel > 0 ? 1 : ATTUNE.length - 1)) % ATTUNE.length; inp.wheel = 0; sfx.click?.(); g.events?.emit('dowse.attune', { to: ATTUNE[this.att].id }); }
  }

  // ---------------------------------------------------------------- every frame
  always(dt, raw) {
    this.swingTick(dt);
    this.surveyTick(dt);
    if (this.throwT >= 0) { this.throwT += dt; if (this.throwT > 0.75) this.throwT = -1; }
    this.forkTick(dt);
    this.dowseTick(raw);
  }

  // ---------------------------------------------------------------- the survey (MMB): Mind Mapping's pulse, the Dreamvane's now
  /** The heel struck into the ground: at the blow the Mind's ring goes out from her (cartography.js survey: what is in sight is
   *  understood). A placeholder motion (the pick's downstroke) until Calissa's own. */
  startSurvey() { this.surveyT = 0; this.surveyed = false; this.P.bodyYaw = this.P.yaw; this.game.events?.emit('dreamvane.survey', {}); }
  surveyTick(dt) {
    if (this.surveyT < 0) return;
    this.surveyT += dt;
    if (!this.surveyed && this.surveyT >= SURVEY.strike) {
      this.surveyed = true;
      const ok = this.game.cartography?.survey(false);
      if (!ok) { sfx.fizzle?.(); this.game.log?.say('warn', 'The Mind will not answer yet (the survey is resting, or there is too little Lachryma).', { key: 'survey.no', throttle: 3 }); }
      else { this.game.fx?.impact?.(this.P.pos.clone(), new THREE.Vector3(0, 1, 0), { sparks: 4, dust: 3 }); this.P.shake = Math.max(this.P.shake || 0, 0.15); }
    }
    if (this.surveyT > SURVEY.dur) this.surveyT = -1;
  }

  // ---------------------------------------------------------------- dowsing
  dowseTick(raw) {
    const g = this.game, P = this.P, S = g.signatures, M = this.model;
    const on = this.dowsing && this.held;
    let glow = 0, target = null;
    if (on && S) {
      const A = ATTUNE[this.att];
      target = S.strongest(P.pos, RANGE, { kinds: A.kinds, filter: (s) => s.ref !== this.fork.ent });
      if (target) {
        const look = this.aimFlat(_a), to = _b.set(target.pos.x - P.pos.x, 0, target.pos.z - P.pos.z);
        const d = to.length(), off = d > 0.01 ? look.angleTo(to.normalize()) : 0;
        const align = Math.max(0, 1 - off / 1.2), near = target.pull / (target.pull + 0.6);
        glow = align * align * near;
        // the needle: the hoop turned on its pin to face it (in the staff's own frame)
        M.group.updateMatrixWorld(true);
        const local = _c.copy(target.pos).applyMatrix4(_m.copy(M.group.matrixWorld).invert()).sub(M.catcher.position);
        this.needle.yaw += (Math.atan2(-local.y, local.z) - this.needle.yaw) * (1 - Math.exp(-raw * 6));
        this.needle.pitch += (THREE.MathUtils.clamp(Math.atan2(local.x, Math.hypot(local.y, local.z)) * 0.4, -0.5, 0.5) - this.needle.pitch) * (1 - Math.exp(-raw * 6));
        // found: clearly, and near enough to be worth it: once a thing, it is said, and charted
        if (glow > 0.7 && d < 45 && !this.found.has(target.ref)) { this.found.add(target.ref); g.events?.emit('dowse.find', { kind: target.kind, veiled: !!target.ref?.veiled, dist: Math.round(d) }); }
        if (glow > 0.5 && !this.charted.has(target.ref) && (target.kind === 'crystal' || target.kind === 'chest')) { this.charted.add(target.ref); g.cartography?.chartAt?.(target.pos); }
        // a veiled crystal close under her: the sand over it shivers (a mark on the thing, not words)
        if (target.ref?.veiled && d < 5 && glow > 0.5 && (this.markT = (this.markT || 0) - raw) <= 0) { this.markT = 2.5; g.glyphs?.pop('ask', target.ref.ground.clone().setY(target.ref.ground.y + 0.6), { color: 0xcdb8f2, size: 0.5, life: 1.2 }); }
      }
      // the tick: faster and higher as it sings (Skyward Sword)
      this.tickT -= raw;
      if (this.tickT <= 0) { sfx.dowse?.(glow); this.tickT = THREE.MathUtils.lerp(1.0, 0.09, glow); }
    } else { this.needle.yaw *= 1 - Math.min(1, raw * 3); this.needle.pitch *= 1 - Math.min(1, raw * 3); }
    this.glow = THREE.MathUtils.damp(this.glow, glow, 8, raw);
    M.setDowse(this.needle.yaw, this.needle.pitch + (on && !target ? 0.15 * Math.sin(performance.now() / 700) : 0), this.glow);
    if (on) M.webMat.color.lerp(new THREE.Color(ATTUNE[this.att].color), 0.35); // (its attunement in the web's colour)
    this.target = target;
  }

  // ---------------------------------------------------------------- the pick
  startSwing() {
    const g = this.game, P = this.P, ch = g.character;
    const track = measureSwing(ch, PICK.clip, { tip: 1.05 });
    if (!track) return;
    const m = magnet(g, P, this.aimFlat(_a).clone(), { range: 3.4, cone: 0.9 });
    if (m) P.bodyYaw = Math.atan2(m.pos.x - P.pos.x, m.pos.z - P.pos.z);
    else P.bodyYaw = P.yaw;
    this.swing = { t: PICK.from, prev: PICK.from, dur: PICK.to, track, seen: new Set(), struck: 0, ground: false };
    sfx.whoosh?.(0.8);
    g.events?.emit('dreamvane.swing', {});
  }
  swingTick(dt) {
    const s = this.swing;
    if (!s) return;
    const g = this.game, P = this.P;
    s.prev = s.t; s.t += dt;
    sweep(g, P, P.bodyYaw, s.track, s.prev, s.t, {
      reach: 0.75, seen: s.seen,
      hit: (kind, ent, at, dir) => {
        s.struck++;
        if (kind === 'thing') { ent.struck?.(at, dir, 1.5, 'courier', 'dreamvane'); return; }
        if (kind === 'pot') g.breakables.shatter(ent, at, dir, 1.4, 'picked', 'courier');
        else if (kind === 'clapper') { if (ent.ally) return; g.clappers.knock(ent, dir.clone().setY(0).normalize().multiplyScalar(8).setY(5)); g.clappers.stun(ent, 2, g.shells.glowOutline, g.shells.xray); }
        else g.creatures.strike(ent, at, dir, 1.6, 'picked');
        g.events?.emit('dreamvane.hit', { what: kind === 'creature' ? ent.kind : kind });
      },
    });
    // the end of the blow: into the ground, if it met nothing (the sand where the vane said: what is veiled rises)
    if (!s.ground && s.t >= s.track.strike[1]) {
      s.ground = true;
      if (!s.struck) {
        const tip = this.model.pickWorld(_a);
        const down = g.physics.raycast(_b.copy(tip).setY(tip.y + 0.4), _c.set(0, -1, 0), 1.6, P.collider, undefined, (k) => !k.isSensor());
        if (down) {
          g.fx?.impact?.(down.point.clone(), down.normal.clone(), { sparks: 2, dust: 5 });
          sfx.thunk?.();
          P.shake = Math.max(P.shake || 0, 0.15);
          const n = g.crystals?.reveal(down.point, 3.2, 'courier', 'pick') || 0;
          g.ai?.stimuli.emit('noise', down.point, { radius: 12, strength: 0.4, by: 'courier' });
          if (n) g.events?.emit('dreamvane.unearth', { n });
        }
      } else { P.shake = Math.max(P.shake || 0, 0.2); g.time?.pulse?.('hit', 0.06, 0.04, { release: 0.1 }); sfx.cutHit?.(1.2); }
    }
    if (s.t >= s.dur) this.swing = null;
  }

  // ---------------------------------------------------------------- the fork
  forkButton() {
    const F = this.fork;
    if (F.state === 'heel') this.throwFork();
    else if (F.state !== 'back') this.recall();
  }
  throwFork() {
    const g = this.game, P = this.P, F = this.fork;
    g.camera.getWorldPosition(_a); P.lookDir(_b);
    const hit = g.physics.raycast(_a, _b, FORK.reach, P.collider, FORK_HITS, (k) => !k.isSensor());
    const aim = hit ? hit.point : _a.clone().addScaledVector(_b, FORK.reach);
    const from = this.toolPoint(-0.55, 0, 0, new THREE.Vector3());
    if (!from.toArray().every(Number.isFinite)) return;
    F.mesh ||= this.model.forkMesh();
    g.scene.add(F.mesh);
    F.pos.copy(from);
    const d = aim.clone().sub(from), dist = d.length(), tFly = dist / FORK.speed;
    F.vel.copy(d.normalize().multiplyScalar(FORK.speed)); F.vel.y += 0.5 * FORK.gravity * tFly; // (aimed a little high: it drops on the way)
    F.state = 'fly'; F.t = 0; F.ent = null; F.ring = 0;
    this.model.setFork(false);
    this.throwT = 0;
    P.bodyYaw = P.yaw;
    sfx.toss?.(); g.events?.emit('fork.throw', {});
  }
  recall() { const F = this.fork; if (F.state === 'heel') return; F.state = 'back'; F.t = 0; F.ent = null; sfx.whoosh?.(0.5); }
  /** Back in the heel at once (put away while it was out). */
  home() { const F = this.fork; F.state = 'heel'; F.ent = null; if (F.mesh) this.game.scene.remove(F.mesh); this.model.setFork(true); }

  forkTick(dt) {
    const g = this.game, F = this.fork, P = this.P;
    if (F.state === 'heel') return;
    F.t += dt;
    if (F.state === 'fly') {
      const prev = _a.copy(F.pos);
      F.vel.y -= FORK.gravity * dt;
      F.pos.addScaledVector(F.vel, dt);
      const step = _b.copy(F.pos).sub(prev), len = step.length();
      const hit = len > 1e-4 ? g.physics.raycast(prev, step.normalize(), len + 0.05, P.collider, FORK_HITS, (k) => !k.isSensor()) : null;
      if (hit) this.stick(hit, step);
      else if (F.t > FORK.life) this.recall();
    } else if (F.state === 'stuck') {
      const e = F.ent;
      if (e?.type === 'creature' || e?.type === 'clapper') { if (e.alive === false) return this.recall(); F.pos.copy(e.pos).add(F.off); }
      F.ring -= dt; F.beat -= dt;
      if (F.beat <= 0) {
        F.beat = 1;
        // the ring: a sound every creature near hears (it goes to look), and what it is in gives up its Lachryma
        g.ai?.stimuli.emit('noise', F.pos, { radius: 22, strength: 0.55, by: 'courier', source: F, ttl: 1.2 });
        if (e?.type === 'creature' && !e.ally) {
          g.baubles?.spawn(e.center(_c).clone(), 1, { spread: 0.6, up: 3, ox: 0.75 });
          g.stun?.add(e, 0.16, { by: 'courier', cause: 'fork' });
          g.events?.emit('fork.drain', { kind: e.kind });
        } else if (e?.type === 'clapper' && !e.ally) { g.baubles?.spawn(e.pos.clone().setY(e.pos.y + 0.4), 1, { spread: 0.5, up: 3, ox: 0.4 }); }
        if (Math.floor(F.ring) % 2 === 0) sfx.fork?.(0.6);
      }
      if (F.ring <= 0) this.recall();
    } else if (F.state === 'back') {
      const heel = this.toolPoint(-0.55, 0, 0, _c);
      const to = _a.copy(heel).sub(F.pos), d = to.length(), sp = Math.min(FORK.back, 8 + F.t * 40);
      if (d < 0.3 || F.t > 3) { this.home(); sfx.clink?.(3, 1, 'glass'); g.events?.emit('fork.catch', {}); return; }
      F.pos.addScaledVector(to.normalize(), Math.min(d, sp * dt));
      F.vel.copy(to).multiplyScalar(-1); // (it flies heel-first: the tines trail)
    }
    // the fork's look: point along its flight (or into what it is in), and a tremble while it rings
    if (F.mesh) {
      F.mesh.position.copy(F.pos);
      if (F.state !== 'stuck' && F.vel.lengthSq() > 1e-4) F.mesh.quaternion.setFromUnitVectors(_b.set(-1, 0, 0), _a.copy(F.vel).normalize());
      if (F.state === 'stuck') F.mesh.rotation.z += Math.sin(F.t * 90) * 0.004 * Math.min(1, F.ring);
    }
  }

  stick(hit, dir) {
    const g = this.game, F = this.fork, e = hit.entity;
    F.state = 'stuck'; F.ring = FORK.ring; F.beat = 0.2; F.ent = e || null;
    // (the tines bite a little way in and the rest stands out of it: the fork reaches 0.245 down its -X, times its size)
    F.pos.copy(hit.point).addScaledVector(dir, -(0.245 - 0.09) * FORK_SIZE);
    F.mesh.quaternion.setFromUnitVectors(_b.set(-1, 0, 0), dir);
    let what = 'ground';
    if (e?.type === 'crystal') { g.crystals?.ring(e, FORK.ring); what = 'crystal'; }
    else if (e?.type === 'creature') { F.off.copy(F.pos).sub(e.pos); what = e.ally ? 'spirit' : 'creature'; if (!e.ally) g.creatures.strike(e, hit.point, dir, 0.4, 'fork'); }
    else if (e?.type === 'clapper') { F.off.copy(F.pos).sub(e.pos); what = 'clapper'; if (!e.ally) g.clappers.stun(e, 2.5, g.shells.glowOutline, g.shells.xray); }
    else if (e?.type === 'breakable') { g.breakables.shatter(e, hit.point, dir, 0.8, 'fork', 'courier'); what = 'pot'; this.recall(); }
    sfx.fork?.(1);
    g.fx?.impact?.(hit.point.clone(), hit.normal.clone(), { sparks: 6, dust: 1 });
    g.events?.emit('fork.stick', { what });
  }

  // ---------------------------------------------------------------- animation and the hands
  pose(C, out) {
    const s = this.swing;
    if (s) { C.sample(PICK.clip, s.t, out, false); return { pose: out, w: Math.min(1, (s.t - PICK.from) / 0.08) * (1 - smooth(s.dur - 0.3, s.dur, s.t)) }; }
    if (this.surveyT >= 0) { C.sample(SURVEY.clip, SURVEY.from + this.surveyT * 1.1, out, false); return { pose: out, w: Math.min(1, this.surveyT / 0.08) * (1 - smooth(SURVEY.dur - 0.25, SURVEY.dur, this.surveyT)) }; }
    if (this.throwT >= 0) { C.sample('throw', 0.15 + this.throwT * 1.1, out, false); return { pose: out, w: Math.min(1, this.throwT / 0.05) * (1 - smooth(0.5, 0.75, this.throwT)) }; }
    return null;
  }
  /** The left hand high on the staff, above the right (the owner's note: the upper portion of the haft), but not while it throws;
   *  through a swing, low on it, where the pick's two-handed blow wants it. */
  second() { return this.throwT >= 0 ? null : this.swing || this.surveyT >= 0 ? { x: -0.3 } : { x: 0.3 }; }
  fpArc() { const s = this.swing; return s ? { arc: 'over', u: Math.min(1, (s.t - PICK.from) / (s.dur - PICK.from)) } : { lift: this.dowsing ? 0.08 : 0 }; }
  restSig() { return `${this.fork.state}`; }
}
