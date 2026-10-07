// ---------------------------------------------------------------------------------------
// THE GREAT SLIP JELLY, CROWNED: the Great Dunemaw's FOE, fought in the bowl (world/well/bowl.js; docs/plans/DUNEMAW-SYSTEMS.md section 1
// and DUNEMAW-ARENA.md; its numbers are FOE in progress/combat/dunemaw.js, and every rule here reads them). Its body is a slip jelly's of
// class 2 (creatures/jelly/slipjelly.js: the deformer, the hurt, the burst), driven by this module instead of the jelly's mind (`driven`):
// a boss is a pattern to be read, not a mood.
//
//   ASLEEP   half sunk in W0, its crown up, until the Courier steps onto the floor within 20 m (or strikes it).
//   CROWNED  the urn on its head (Calissa's urn crown, vfx/urncrown.js) is a pot: only what breaks pots breaks it. A blow to the crown
//            cracks it (Impact 1.5, the slam 3, any other type a chip, with the resist mark) and does no harm through it; a blow to its
//            sides lands a quarter. Its moves:
//              the RAM: it lowers its crown and scrapes 1 s (its aim is taken as the scrape BEGINS: Petra measured, aimed later the
//              sidestep fails), then charges 11 m/s for up to 24 m, turning 20 degrees a second. It stops at what it meets: a pillar, a
//              fallen log or a fallen stalactite cracks a whole stage of its crown (and the stone is spent: bowl.spend); the wall
//              stuns it a second for nothing; nothing, it skids and comes again.
//              the SLAM: close in, it rears and slams a ring 6 m across (parried, it breaks off). Slammed down on a fallen
//              stalactite, it cracks its own crown three points: the hammer's way.
//   THE BREAK at the third stage: the crown bursts, and it REELS 4 sim seconds (stunned: every blow lands three times over).
//   BARE     the core is the target (x2; the body x0.5). Every 12 sim seconds it SINKS into the nearest pool and SURFACES 3 s later in
//            another (never the same twice running), the pool ringing 1.2 s before, a slam ring where it comes up, the stalactites over
//            it falling. The floor's sand SLIDES toward its pool (0.8 m/s, 1.5 below a third). At two thirds and one third it CALLS
//            its BROOD from the clutches still whole (world/well/nursery.js).
//   THE END  burst (its health spent): the pale pool forms in W0. Or REPROGRAMMED, below a fifth and reeling or stunned (only then is it
//            `programmable`; the zandatsu never takes it): it sinks into W0 and stays, the nursery is yours, and the pale pool forms
//            in W2.
// Events (each with `by`): foe.crack { stage, cause }, foe.break, foe.end { how }, foe.strike { move } (its blow on the Courier),
// foe.wake, foe.sink { pool }, foe.rise { pool } (1.2 s before it surfaces: the ring's cue), foe.surface { pool }.
//
// Prior art: Zelda's King Dodongo and the bullfight (the boss's own charge turned against it), Monster Hunter's part breaks and its
// arenas, Kirby's and Metroid's armour first then the weak point, Hollow Knight's stagger window, Ocarina's Morpha and the Gohma pit
// (a boss that sinks and surfaces), and the antlion's pit.
//
// In the raid fight (world/well/raid.js: the timeline of casts, progress/combat/greatjelly.js) it is `scripted`: its moves are the casts'
// verbs below (ram, bash, cast, submerge, sinkInto, show, forceBare, heal), and between casts it only keeps near and slams.
//
//   const F = new GreatJelly(game, { bowl, nursery, at })   F.update(dt)   F.c (the body)   F.phase   F.stage   F.ended   F.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FOE, ARENA, crackOf, phase as phaseOf, hitMult, broodAt } from '../../progress/combat/dunemaw.js';
import { HEALTH } from '../../progress/combat/greatjelly.js';
import { UrnCrown } from '../../vfx/urncrown.js';
import { tag, untag } from '../../core/tags.js';
import { st } from '../creatures.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('creatures/jelly/greatjelly'); // (the simulation's chance: core/rng.js, the same twice)

const H = 1.5, CROWN_R = 0.62, STAGE = FOE.crown.stage, STAGES = FOE.crown.stages, GLIDE = 2.6;
const REAR = 0.7, SKID = 0.6, RECOVER = 0.9, REST = [0.8, 1.6]; // (sim seconds: the slam's rear, the skid, the stop at stone, the breath between moves)
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const DEG = Math.PI / 180;

export class GreatJelly {
  constructor(game, { bowl, nursery = null, at }) {
    this.game = game; this.bowl = bowl; this.nursery = nursery;
    const J = game.jellies, c = this.c = J.spawn(at, { once: true, cls: FOE.cls, yaw: 0 });
    c.hp = c.maxHp = HEALTH; c.foeOf = this; c.name = 'Great Slip Jelly'; // (a raid boss's health: greatjelly.js, measured against Strawman)
    untag(c, 'sliceable', 'programmable'); // (no zandatsu on a FOE; reprogrammable only when it is low: see update)
    this.crown = new UrnCrown({ radius: CROWN_R }); c.root.add(this.crown.group);
    this.crown.group.position.y = H;
    const hurt = c.hurt; this.bodyHurt = (p, dir, power, cause, by, from) => hurt(p, dir, power, cause, by, from);
    c.hurt = (p, dir, power, cause, by, from, type) => this.hurt(p, dir, power, cause, by, from, type);
    c.driven = (dt) => this.drive(dt); // (slipjelly.js: its mind stands aside, this module moves it)
    c.onParried = () => {
      if (this.state === 'rear') this.go('idle', RECOVER);
      if (this.state === 'bash') { this.parried = true; this.go('daze', 1.5); c.deform.kick(-6, null, 0.3); } // (Lidfall turned: it staggers)
    };
    this.crack = 0; this.sinceBreak = null; this.state = 'asleep'; this.t = 0; this.wait = 0;
    this.pool = 0; this.sinkT = 0; this.lastShare = 1; this.ended = null; this.by = 'courier';
    this.aim = new THREE.Vector3(); this.dir = new THREE.Vector3(0, 0, 1); this.ran = 0; this.struck = false;
    this.scripted = false; this.raid = null; this.autoCd = 3; this.plates = 0; // (scripted: its casts are the timeline's (world/well/raid.js); between them only its slam)
    this.offReprogram = game.events?.on('reprogram.run', () => { if (game.reprogram?.c === c && !this.ended) this.end('reprogram', 'courier'); });
  }

  get stage() { return Math.min(STAGES, Math.floor(this.crack / STAGE)); }
  get phase() { return this.ended ? 'end' : phaseOf({ crack: this.crack, sinceBreak: this.sinceBreak }); }
  get share() { return Math.max(0, this.c.hp) / this.c.maxHp; }
  local() { return this.bowl.local(this.c.pos); }
  go(state, wait = 0) { this.state = state; this.t = 0; this.wait = wait; }

  // ------------------------------------------------------------------ blows
  /** Where a blow landed on it: the crown (or the core, bare), or its body. */
  part(p) {
    const c = this.c, top = this.crown.group.getWorldPosition(_a);
    if (this.stage < STAGES) return p.y > top.y - CROWN_R * 0.9 || p.distanceTo(top) < CROWN_R * 1.7 ? 'crown' : 'body';
    return p.distanceTo(top) < 0.8 ? 'core' : 'body';
  }
  hurt(p, dir, power, cause, by, from, type = 'impact') {
    const c = this.c, g = this.game;
    if (!c.alive || this.ended || this.disposed || this.state === 'under' || this.state === 'hidden' || this.state === 'sinkHold') return;
    if (this.state === 'asleep') this.wake();
    const ph = this.phase, part = cause === 'slam' && ph === 'crown' ? 'crown' : this.part(p);
    if (ph === 'crown' && part === 'crown') {
      const k = crackOf(type, cause) * Math.max(0.25, power);
      if (type !== 'impact' && cause !== 'slam') g.glyphs?.pop('ward', p.clone(), { color: 0xffffff, size: 0.7, life: 0.7, float: 0.25, burst: true, ring: true }); // (the resist mark: it rings off)
      this.addCrack(k, cause === 'slam' ? 'slam' : 'blow', by);
      c.flash = 0.6; g.fx?.impact?.(p.clone(), dir.clone().negate(), { sparks: 6, dust: 0 });
      return;
    }
    if (this.plates > 0 && ph === 'bare') { // (a plate a brood grew back: it takes the blow whole and breaks)
      this.plates--; c.flash = 0.6; g.glyphs?.pop('ward', p.clone(), { color: 0xffffff, size: 0.7, life: 0.7, float: 0.25, burst: true, ring: true });
      sfx.shatter?.(0.8, g.listenerDistance(c.pos), 'clay'); return;
    }
    const k = hitMult(ph, part, type) / (g.stun?.bonus(c) ?? 1); // (the reel is its own x3: the stun's bonus is not added on top)
    this.bodyHurt(p, dir, power * k, cause, by, from);
    if (c.alive && !this.scripted) this.calls(by);
  }
  /** Crack points into the crown; a stage passed says so; the third bursts it. */
  addCrack(k, cause, by = 'courier') {
    if (this.stage >= STAGES || k <= 0) return;
    const was = this.stage;
    this.crack = Math.min(STAGE * STAGES, this.crack + k);
    if (this.stage > was) {
      this.crown.crack(this.stage);
      this.game.events?.emit('foe.crack', { stage: this.stage, cause, by });
      if (this.stage >= STAGES) this.burst(by);
    }
  }
  /** The crown bursts off: it reels, stunned, and every blow lands three times over. */
  burst(by) {
    const g = this.game, c = this.c;
    this.crown.burst(this.dir.clone());
    this.sinceBreak = 0;
    g.creatures.apply(c, 'stun', FOE.reel.seconds, 1, by);
    c.deform.kick(-6, null, 0.4);
    sfx.shatter?.(2.4, g.listenerDistance(c.pos), 'clay');
    g.events?.emit('foe.break', { by });
    this.go('reel');
  }
  /** Its brood called as its health falls past two thirds and one third (from the clutches still whole). */
  calls(by) {
    const s = this.share, n = broodAt(s, this.lastShare, this.nursery?.whole ?? 0);
    this.lastShare = s;
    if (n > 0) { this.nursery.call(n, this.c.pos); this.c.deform.kick(5, null, 0.3); this.game.events?.emit('foe.call', { n, by: 'creature' }); }
  }

  wake() {
    if (this.state !== 'asleep') return;
    this.go('idle', 0.6);
    this.game.events?.emit('foe.wake', { by: 'courier' });
  }

  // ------------------------------------------------------------------ the body, driven
  drive(dt) {
    const g = this.game, c = this.c, P = g.player, B = this.bowl, L = this.local(), toC = _a.set(P.pos.x - c.pos.x, 0, P.pos.z - c.pos.z), dC = toC.length();
    this.t += dt;
    c.want.set(0, 0, 0); c.face = null; c.squashTo = null;
    if (this.sinceBreak != null) this.sinceBreak += dt;
    const ph = this.phase;
    // (down: stunned outside its reel, or asleep by a song or a macro, it does nothing until it comes to)
    if ((st(c, 'stun') && this.state !== 'reel') || st(c, 'sleep')) { if (this.state === 'charge' || this.state === 'scrape' || this.state === 'rear') { g.creatures.unwind(c); this.crown.tell?.(0); this.go('idle', 0.4); } return; }
    switch (this.state) {
      case 'asleep': { // (half sunk in W0, brooding: squashed low, its crown just over the slip)
        c.squashTo = 0.62;
        const PL = B.local(P.pos);
        if (Math.hypot(PL.x, PL.z) < ARENA.wake && PL.y < 2.5) this.wake();
        return;
      }
      case 'idle': {
        c.face = P.pos;
        if (this.scripted) { // (its casts are the timeline's: between them it keeps near, and slams what comes close, now and then)
          this.autoCd -= dt;
          if (dC > 7) c.want.copy(toC).setLength(GLIDE * 0.6);
          if (dC < FOE.slam.within && this.autoCd <= 0 && !this.raid?.busy) { this.autoCd = 6; this.go('rear', REAR); g.creatures.windup(c, { at: c.pos, radius: FOE.slam.radius, eta: REAR, kind: 'slam', part: c.root }); c.deform.kick(4, null, 0.2); }
          return;
        }
        if (ph === 'bare' && (this.sinkT += dt) >= FOE.sink.every) { this.sinkT = 0; this.sinkTo(); return; }
        if ((this.wait -= dt) > 0) { if (dC > 6) c.want.copy(toC).setLength(GLIDE * 0.5); return; }
        if (dC < FOE.slam.within) { this.go('rear', REAR); g.creatures.windup(c, { at: c.pos, radius: FOE.slam.radius, eta: REAR, kind: 'slam', part: c.root }); c.deform.kick(4, null, 0.2); return; }
        // the ram: its aim taken now, at the scrape's start (FOE.ram.aim 0)
        this.aim.copy(P.pos); this.dir.copy(toC).normalize(); this.scrapeFor = FOE.ram.telegraph;
        this.go('scrape', FOE.ram.telegraph);
        g.creatures.windup(c, { at: c.pos, radius: 2, eta: FOE.ram.telegraph, kind: 'ram', parry: false });
        g.events?.emit('foe.scrape', { by: 'creature' }); // (Wanda's scrape, Calissa's glowing crown: the tell)
        return;
      }
      case 'scrape': {
        c.face = this.aim; c.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
        c.squashTo = 0.7; c.deform.wob = Math.max(c.deform.wob, 0.06);
        this.crown.tell?.(this.t / this.scrapeFor); // (Calissa's: the broken edge and the cracks brighten and the urn trembles)
        if (this.t >= this.scrapeFor) { this.crown.tell?.(0); g.creatures.unwind(c); this.ran = 0; this.struck = false; this.go('charge'); c.deform.kick(7, null, 0.12); }
        return;
      }
      case 'charge': {
        // it turns toward the Courier no faster than FOE.ram.turn degrees a second
        const want = Math.atan2(toC.x, toC.z), now = Math.atan2(this.dir.x, this.dir.z);
        let d = want - now; d = Math.atan2(Math.sin(d), Math.cos(d));
        const a = now + Math.max(-FOE.ram.turn * DEG * dt, Math.min(FOE.ram.turn * DEG * dt, d));
        this.dir.set(Math.sin(a), 0, Math.cos(a));
        c.vel.copy(this.dir).multiplyScalar(FOE.ram.speed); c.want.copy(c.vel);
        this.ran += FOE.ram.speed * dt;
        // the Courier in its way: struck, once a charge
        if (!this.struck && dC < FOE.halfWidth + 0.55 && Math.abs(P.pos.y - c.pos.y) < 2.2) { this.struck = true; this.strike('ram'); }
        const hit = B.ramHit(L.x + this.dir.x * 0.6, L.z + this.dir.z * 0.6, FOE.halfWidth);
        if (hit) { this.rammed(hit); return; }
        if (this.ran >= FOE.ram.range) { this.go('skid', SKID); }
        return;
      }
      case 'skid': { c.vel.multiplyScalar(Math.max(0, 1 - dt * 5)); c.want.copy(c.vel); if (this.t >= this.wait) this.go('idle', rest()); return; }
      case 'daze': { c.vel.set(0, 0, 0); if (this.t >= this.wait) this.go('idle', rest()); return; }
      case 'rear': {
        c.face = P.pos; c.squashTo = 1.35;
        if (this.t >= REAR) { this.slam(c.pos); this.go('idle', RECOVER + rest()); }
        return;
      }
      case 'reel': {
        c.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
        if (this.sinceBreak >= FOE.reel.seconds) { this.sinkT = FOE.sink.every * 0.5; this.go('idle', 0.5); }
        return;
      }
      case 'sink': { // (gliding to its pool, then under)
        const w = B.pools[this.pool], to = _b.set(w.pos.x - c.pos.x, 0, w.pos.z - c.pos.z);
        if (to.length() > 0.6 && this.t < 3) { c.want.copy(to).setLength(6); c.vel.copy(c.want); return; }
        this.under(); return;
      }
      case 'under': {
        if (!this.rang && this.t >= FOE.sink.seconds - FOE.sink.telegraph) {
          if (this.scripted) this.next = this.poolNear(P.pos, this.pool); // (Wedge: it comes up under you)
          this.rang = true; B.ring(this.next, FOE.sink.telegraph); g.events?.emit('foe.rise', { pool: this.next, by: 'creature' }); }
        if (this.t >= FOE.sink.seconds) this.surface(B.pools[this.next]);
        return;
      }
      // ---- the casts' own postures (world/well/raid.js calls the verbs below; jellycasts.js says what each cast is)
      case 'bash': { // (Lidfall's windup: it rears, its crown high, the parry's outline on it; then the lunge)
        c.face = P.pos; c.squashTo = 1.4; c.deform.wob = Math.max(c.deform.wob, 0.05);
        if (this.t >= this.wait) { this.dir.copy(toC).setY(0).normalize(); this.ran = 0; this.struck = false; this.go('lunge'); c.deform.kick(8, null, 0.12); }
        return;
      }
      case 'lunge': { // (a third of a second across `reach` metres: rolled through, parried before, or struck)
        const v = this.reach / 0.3; c.vel.copy(this.dir).multiplyScalar(v); c.want.copy(c.vel); this.ran += v * dt;
        if (!this.struck && dC < FOE.halfWidth + 0.7 && Math.abs(P.pos.y - c.pos.y) < 2.2) { this.struck = true; this.strike('crownBash'); }
        if (this.ran >= this.reach || this.t > 0.45) this.go('skid', SKID);
        return;
      }
      case 'cast': { // (a cast's windup: still, facing them until `lockAt`, its body the telegraph)
        if (this.t < this.lockAt) { c.face = P.pos; this.dir.copy(toC).setY(0).normalize(); } else c.face = _b.copy(c.pos).add(this.dir);
        c.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
        c.squashTo = this.pose; c.deform.wob = Math.max(c.deform.wob, 0.04 + 0.08 * Math.min(1, this.t / Math.max(0.1, this.wait)));
        if (this.t >= this.wait) this.go('idle', 0.6);
        return;
      }
      case 'sinkHold': { // (into a pool and under, to stay until it is called up: the transition, the sherds)
        const w = B.pools[this.pool], to = _b.set(w.pos.x - c.pos.x, 0, w.pos.z - c.pos.z);
        if (to.length() > 0.6 && this.t < 3) { c.want.copy(to).setLength(7); c.vel.copy(c.want); return; }
        this.hide(); return;
      }
      default: return;
    }
  }

  /** The charge met something: stone cracks its crown a whole stage (and is spent); the wall stuns it a second, for nothing. */
  rammed(hit) {
    const g = this.game, c = this.c;
    c.vel.set(0, 0, 0); c.want.set(0, 0, 0);
    c.deform.kick(-8, null, 0.35);
    this.game.player.shake = Math.max(this.game.player.shake || 0, 0.35);
    if (hit.kind === 'wall') { this.go('daze', FOE.ram.wallStun); g.events?.emit('foe.wall', { by: 'creature' }); return; }
    const spent = this.bowl.spend(hit, this.dir);
    if (spent && this.phase === 'crown') this.addCrack(crackOf('', 'ram'), 'ram', 'courier'); // (the Courier drew the charge: the ram is theirs)
    this.go('daze', RECOVER);
  }

  /** Its slam: a ring FOE.slam.radius about it; on a fallen stalactite, its own crown cracks three points (the hammer's way). */
  slam(at) {
    const g = this.game, P = g.player, B = this.bowl, L = B.local(at);
    g.slip?.addDisc(at.clone(), new THREE.Vector3(0, 1, 0), FOE.slam.radius, 22);
    sfx.slam?.(1.2);
    const d = Math.hypot(P.pos.x - at.x, P.pos.z - at.z);
    if (d < FOE.slam.radius + 0.4 && P.pos.y - at.y < 1.6) this.strike('slam');
    const s = B.fallenNear(L.x, L.z, FOE.halfWidth + 1.4);
    if (s && this.phase === 'crown') { B.spend({ kind: 'stal', it: s }, this.dir); this.addCrack(crackOf('', 'slam'), 'slam', 'courier'); }
    g.events?.emit('foe.slam', { by: 'creature' });
  }

  /** A blow of its body on the Courier: knocked away, the vessel cracked (its shield first: courier/vessel/damage.js). */
  strike(move) {
    const g = this.game, P = g.player, c = this.c;
    if (P.invuln > 0) return;
    if (this.raid) { this.raid.struck(move); return; } // (in the fight, what a blow costs is the cast's: world/well/raid.js)
    const v = _b.set(P.pos.x - c.pos.x, 0, P.pos.z - c.pos.z); if (v.lengthSq() < 1e-4) v.copy(this.dir); v.normalize();
    P.impulse(v.clone().multiplyScalar(move === 'ram' ? 13 : 8).setY(move === 'ram' ? 6 : 4.5), 'foe');
    P.shake = Math.max(P.shake || 0, 0.6);
    g.vesselDamage?.hit({ from: c.pos.clone(), k: move === 'ram' ? 0.85 : 0.55, why: 'foe', by: 'creature' });
    g.events?.emit('foe.strike', { move, from: [c.pos.x, c.pos.y, c.pos.z], by: 'creature' });
  }

  // ------------------------------------------------------------------ bare: under the slip and up again
  sinkTo() {
    const B = this.bowl, L = this.local();
    this.pool = B.pools.reduce((b, w) => (Math.hypot(w.x - L.x, w.z - L.z) < Math.hypot(B.pools[b].x - L.x, B.pools[b].z - L.z) ? w.i : b), 0);
    const others = B.pools.filter((w) => w.i !== this.pool);
    this.next = others[Math.floor(simRand() * others.length)].i;
    this.go('sink');
  }
  under() {
    const g = this.game, c = this.c;
    c.root.visible = false; c.col.setEnabled(false); this.rang = false;
    g.events?.emit('foe.sink', { pool: this.pool, by: 'creature' });
    this.go('under');
  }
  surface(w) {
    const g = this.game, c = this.c;
    this.pool = w.i;
    g.jellies.place(c, w.pos.clone(), c.yaw);
    c.root.visible = true; c.col.setEnabled(true);
    c.deform.kick(9, null, 0.3);
    this.bowl.dropOver(w.x, w.z, 3.5); this.bowl.surfaced(w.i);
    g.events?.emit('foe.surface', { pool: w.i, by: 'creature' });
    this.slam(w.pos);
    this.go('idle', RECOVER);
  }

  // ------------------------------------------------------------------ the casts' verbs (world/well/raid.js)
  /** Shoulder Charge: the scrape for `windup`, then the ram. */
  ram(windup) {
    const P = this.game.player, c = this.c;
    this.aim.copy(P.pos); this.dir.set(P.pos.x - c.pos.x, 0, P.pos.z - c.pos.z).normalize(); this.scrapeFor = windup;
    this.go('scrape', windup);
    this.game.creatures.windup(c, { at: c.pos, radius: 2, eta: windup, kind: 'ram', parry: false });
  }
  /** Lidfall: it rears for `windup` (the parry's outline on it), then lunges `reach` metres at them. */
  bash(windup, reach) {
    this.reach = reach; this.parried = false;
    this.go('bash', windup);
    this.game.creatures.windup(this.c, { at: this.game.player.pos.clone(), radius: 2.5, eta: windup, kind: 'bash', parry: true, part: this.c.root });
  }
  /** Any other cast's windup: still, `pose` its squash, facing them until `lockAt` seconds in. */
  cast(windup, { pose = 1.15, lockAt = windup } = {}) { this.pose = pose; this.lockAt = lockAt; this.go('cast', windup); }
  /** Slake and Wedge: down into the nearest pool, up in the one nearest them. */
  submerge() { this.pool = this.poolNear(this.c.pos); this.next = this.pool; this.go('sink'); }
  /** Down into pool `i` to stay (the transition; the sherds); up again with show(). */
  sinkInto(i = 0) { this.pool = i; this.go('sinkHold'); }
  hide() { const c = this.c; c.root.visible = false; c.col.setEnabled(false); c.vel.set(0, 0, 0); this.go('hidden'); }
  /** Up out of pool `i` (W0 by default), with a slam. */
  show(i = 0) { this.next = i; this.surface(this.bowl.pools[i]); }
  /** The crown off without a reel (the transition: it sinks crowned and comes up bare). */
  forceBare() {
    if (this.stage < STAGES) { this.crack = STAGE * STAGES; this.crown.crack(STAGES); this.crown.burst(this.dir.clone()); }
    this.sinceBreak = FOE.reel.seconds + 1;
  }
  heal(share) { const c = this.c; c.hp = Math.min(c.maxHp, c.hp + share * c.maxHp); c.deform.kick(5, null, 0.3); }
  /** The pool nearest a world point (not `not`). */
  poolNear(p, not = -1) {
    const B = this.bowl; let best = 0, bd = Infinity;
    for (const w of B.pools) { if (w.i === not || w.r <= 0) continue; const d = Math.hypot(w.pos.x - p.x, w.pos.z - p.z); if (d < bd) { bd = d; best = w.i; } }
    return best;
  }

  // ------------------------------------------------------------------ the end
  /** Burst (its health spent) or reprogrammed: once, either way. */
  end(how, by = 'courier') {
    if (this.ended) return;
    const g = this.game, c = this.c;
    this.ended = how; this.by = by;
    this.bowl.slide(0, 0, 0);
    if (how === 'reprogram') { // (it sinks into W0 and stays: the nursery is the Courier's now)
      const w = this.bowl.pools[0];
      g.jellies.place(c, w.pos.clone(), c.yaw); c.col.setEnabled(false); c.root.visible = false;
      g.creatures.clearStatus(c, 'stun');
      c.alive = false; c.downBy = by; // (gone from the fight, not burst: nothing pops)
      g.creatures.remove(c);
    }
    g.events?.emit('foe.end', { how, by, ...(this.raid?.record() || {}) }); // (the run's record: the drops its achievements guarantee read it)
  }

  update(dt) {
    const c = this.c;
    this.crown.update(this.game.rawDt ?? dt);
    if (this.ended) return;
    if (!c.alive) { this.end('burst', c.downBy || 'courier'); return; }
    // the crown rides the head as it squashes; reprogrammable only when it is low and down
    this.crown.group.position.y = H * c.deform.sq;
    const low = this.share <= FOE.reprogramAt;
    if (low) tag(c, 'programmable'); else untag(c, 'programmable');
    // bare and above the slip: the sand slides toward its pool (in the fight, only when a cast says: raid.js)
    if (this.scripted) return;
    if (this.phase === 'bare' && this.state !== 'under') {
      const w = this.bowl.pools[this.pool];
      this.bowl.slide(w.x, w.z, this.share < FOE.slide.lowAt ? FOE.slide.low : FOE.slide.speed);
    } else this.bowl.slide(0, 0, 0);
  }

  dispose() {
    this.disposed = true; this.offReprogram?.();
    this.crown.dispose();
    this.game.jellies?.dispose(this.c);
  }
}

const rest = () => REST[0] + simRand() * (REST[1] - REST[0]);
