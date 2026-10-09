// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S LOAD: the brush as the tool of environmental Lachryma (the owner, 2026-10-06; Dovina's rulings and numbers,
// docs/plans/SUNSHINE-SYSTEMS.md section 4, progress/brushload.js). Two MODES, as the Sondelass has forms (1 and 2 while it is out):
//   PAINT  the bristles saturate, then spray Lachryma: drops fly where you aim (paintspray.js) and lay a feeling where they land (the paint map:
//          world/ground/paintmap.js); a creature standing in it takes that feeling's status; on water, rings. It spends the bottle,
//          else the pool. What it lays is the bottle's grade (the crude it last drank), else the feeling of the weather here.
//   MOP    the bristles saturate, then drink: stains of spilled crude (world/ground/stains.js) and the paint itself, into the bottle.
// SATURATE is the hold: every press of LMB is still the club's blow at once (tools/soulbrush/club.js); held past the blow on the
// ground, the bristles fill over the psygun's full charge time (`saturateTime(T)`), then the mode works until LMB is let go. Held in the
// air, it is the club's slam, a ground pound (Petra's call, R46).
// THE LACHRYMATO BOTTLE is worn on the upper back (a fitting in its own place, `bottle`: pneuka/box.js; what it holds is kept as its
// `uses`, so a bottle taken off keeps its Lachryma). It feeds the pool while the pool is below half; a broken shield may crack it, and
// what pours out is a stain where the Courier stood.
//
// Prior art: Super Mario Sunshine's FLUDD (the tank on the back, the spray that arcs and lands, refilled from the world), Luigi's
// Mansion 3's Poltergust (blow and suck, one tool, two modes), Splatoon (the ink tank on the back, ink as ground that does things).
//
//   const L = new BrushLoad(tool)   L.mode ('paint' | 'mop')   L.setMode(m)   L.begin() (the club, on a ground hold)   L.working / L.sat
//   L.update(raw, inp) (while held)   L.tick(dt) (always: drops in flight, the bottle's feed)   L.bottle (id | null)   L.held (Lachryma)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BRUSH as LOAD, BOTTLES, saturateTime, bottleFeed, crack } from '../../progress/brushload.js';
import { TYPE_OF, ASPECTS } from '../../progress/weather.js';
import { ASPECT_COLOR } from '../../world/ground/paintmap.js';
import { T } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
import { LachrymatoBottle } from '../../vfx/bottle.js';
import { PaintSpray, SPRAY } from './paintspray.js';

const simRand = stream('tools/soulbrush/load');

/** Spend Lachryma for something that runs on the load (the jet arts: courier/moves/jets.js): the bottle first, then the pool. */
export function spendLoad(game, n, tag = 'load') {
  const L = game.player?.techs?.get('soulbrush')?.load; let got = 0;
  if (L?.bottle && L.held > 0) { got = Math.min(L.held, n); L.held -= got; }
  if (got < n && game.lachryma) got += game.lachryma.drain(n - got, tag);
  return got;
}
/** The feeling the load would lay now (the bottle's grade, else the weather's here). */
export const loadAspect = (game) => game.player?.techs?.get('soulbrush')?.load?.aspect || 'wonder';
const DROPS_PER_SEC = 18, MAX_DROPS = 64, STATUS_EVERY = 0.5; // (the throw, the spread and the splat: paintspray.js)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

export class BrushLoad {
  constructor(tool) {
    this.tool = tool; this.mode = 'paint'; this.sat = -1; this.working = false;
    this.drops = []; this.acc = 0; this.statusT = 0; this.paintArea = 0; this.paintAspect = null; this.mopped = 0; this.grade = null;
    tool.game.events?.on('vessel.shieldbreak', () => this.shieldBreak());
    this.look = null; this.lookId = null; this.crackT = 0; this.mopAt = null; // (the bottle worn, seen: Calissa's vfx/bottle.js)
    this.aimer = new PaintSpray(tool.game); // (where the paint goes and where it will land: paintspray.js, LACHRYMA-LOOP.md 3)
    tool.game.save?.section('brushload', { // (the mode and the grade of what the bottle holds; the Lachryma it holds is the bottle's own `uses`)
      scope: 'player', version: 1,
      dump: () => ({ mode: this.mode, grade: this.grade }),
      load: (d) => { this.mode = LOAD.modes.includes(d.mode) ? d.mode : 'paint'; this.grade = ASPECTS.includes(d.grade) ? d.grade : null; },
      reset: () => { this.mode = 'paint'; this.grade = null; },
    });
  }
  save() { this.game.save?.dirty('brushload'); }
  get game() { return this.tool.game; }
  get P() { return this.tool.P; }
  get box() { return this.game.pneuka; }
  get bottle() { return this.box?.fitted('bottle')[0] || null; }
  get held() { return this.box?.uses?.bottle?.[0] || 0; }
  set held(v) { const U = this.box?.uses?.bottle; if (U && this.bottle) { U[0] = Math.max(0, Math.min(BOTTLES[this.bottle].capacity, v)); this.box.save?.(); } }
  /** The feeling the brush lays: the bottle's grade while it holds some, else the weather's where the Courier stands. */
  get aspect() { const g = this.game; return (this.held > 0.5 && this.grade) || g.weather?.here?.(this.P.pos)?.aspect || 'wonder'; }

  setMode(m) { if (m === this.mode || !LOAD.modes.includes(m)) return; this.mode = m; this.end(); this.save(); sfx.click?.(); this.game.events?.emit('brush.mode', { mode: m, by: 'courier' }); }

  /** The club's ground hold: the bristles start to fill. */
  begin() { this.sat = 0; this.working = false; sfx.brushCharge?.(); }
  end() { if (this.sat >= 0 || this.working) this.flush(); this.sat = -1; this.working = false; this.tool.model.setInk(0); }
  get busy() { return this.sat >= 0; }

  /** While the brush is in the hand: the hold fills, then the mode works, until LMB is let go. */
  update(raw, inp) {
    if (this.sat < 0) return;
    if (!inp.isDown('Mouse0') || (!this.P.grounded && !(this.mode === 'paint' && this.working))) { this.end(); return; } // (begun on the ground; a spray carries on through a jump, wider: paintspray.js)
    if (!this.working) {
      this.sat = Math.min(1, this.sat + raw / saturateTime(T));
      this.tool.model.setInk(this.sat);
      if (this.sat >= 1) { this.working = true; sfx.brushReady?.(); }
      return;
    }
    if (this.mode === 'paint') this.spray(raw); else this.mop(raw);
  }

  /** Paint: Lachryma from the bottle (else the pool) flung forward as drops. */
  spray(dt) {
    const g = this.game, want = LOAD.spray.cost * dt;
    const fromBottle = Math.min(this.held, want);
    if (fromBottle > 0) this.held -= fromBottle;
    const fromPool = want - fromBottle > 0 ? g.lachryma.drain(want - fromBottle, 'brushpaint') : 0;
    if (fromBottle + fromPool < want * 0.5) { this.end(); sfx.fizzle?.(); g.log?.say('info', 'The bristles run dry.', { key: 'brushdry2', throttle: 4 }); return; }
    this.paintFrom = fromBottle > 0 ? 'bottle' : 'pool';
    const aspect = this.aspect;
    this.acc += dt * DROPS_PER_SEC;
    const tip = this.aimer.muzzle(this.P, _a), aim = this.aimer.aim(tip, _d); // (a steady nozzle before the chest: paintspray.js)
    while (this.acc >= 1 && this.drops.length < MAX_DROPS) {
      this.acc -= 1;
      this.drops.push({ p: tip.clone(), v: this.aimer.launch(aim, simRand), aspect, life: 3, travel: 0, trail: 0 }); // (the spray's look is Calissa's: vfx/brushload.js, driven in tick)
    }
    g.ai?.stimuli?.emit?.({ kind: 'sound', pos: tip.clone(), loud: 0.3, by: 'courier' });
  }

  /** Mop: drink stains and laid paint within reach of the bristles, into the bottle. */
  mop(dt) {
    const g = this.game, b = this.bottle;
    if (!b) { this.end(); g.log?.say('info', 'You have no Lachrymato Bottle to mop into.', { key: 'nobottle', throttle: 4 }); return; }
    const room = BOTTLES[b].capacity - this.held;
    if (room <= 0.01) { this.end(); g.log?.say('info', 'Your Lachrymato Bottle is full.', { key: 'bottlefull', throttle: 4 }); return; }
    const tip = this.tool.model.tipWorld(_a), P = this.P, want = Math.min(room, LOAD.mop.rate * dt), r = LOAD.mop.reach;
    const fx = (tip.x + P.pos.x) / 2, fz = (tip.z + P.pos.z) / 2; // (between the feet and the bristles)
    const s = g.stains?.drink(fx, P.pos.y, fz, r, want) || { got: 0 };
    let got = s.got;
    if (s.grade && s.grade !== this.grade) { this.grade = s.grade; this.save(); }
    if (got < want && g.paintmap) { const p = g.paintmap.drink(fx, P.pos.y, fz, r, (want - got) * 0.25) * 4; got += p; } // (a cell-full of paint is four Lachryma)
    if (got > 0) { this.held += got; this.mopped += got; }
    this.mopAt = got > 0 ? (s.at || new THREE.Vector3(fx, P.pos.y, fz)) : null; // (where the stream is drawn from: vfx/brushload.js)
  }

  /** Lachryma poured into the bottle from outside (the mop's parry, the soak: courier/parry.js); returns what it took. */
  fill(n) {
    const b = this.bottle; if (!b || n <= 0) return 0;
    const t = Math.min(n, BOTTLES[b].capacity - this.held); if (t > 0) this.held += t;
    return Math.max(0, t);
  }

  /** What was laid or drunk in one hold goes to the ledger in one event, when the hold ends. */
  flush() {
    const g = this.game;
    this.paintDue = true; // (the paint is said when the last drop of the hold has landed: tick)
    if (this.mopped > 0.01) { g.events?.emit('brush.mop', { lachryma: Math.round(this.mopped * 10) / 10, by: 'courier' }); this.mopped = 0; }
  }
  flushPaint() {
    this.paintDue = false;
    if (this.paintArea > 0.01) this.game.events?.emit('brush.paint', { aspect: this.paintAspect, area: Math.round(this.paintArea * 10) / 10, from: this.paintFrom || 'pool', by: 'courier' });
    this.paintArea = 0;
  }

  /** Always (drawn or not): the drops in flight, the paint's statuses on what stands in it, the bottle feeding the pool. */
  tick(dt) {
    const g = this.game, ph = g.physics;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life -= dt; if (d.life <= 0) { this.drops.splice(i, 1); continue; }
      this.aimer.fly(d, dt, _b); const len = _b.length(); // (straight, then falling: paintspray.js)
      const hit = len > 1e-4 && ph?.raycast(d.p, _b.clone().divideScalar(len), len, this.P.collider, undefined, (c) => !c.isSensor?.());
      const W = g.water?.at(d.p.x, d.p.y, d.p.z);
      if (W && d.p.y + _b.y <= W.surface) { g.water.disturb(d.p.x, d.p.z, 0.25, 'drop'); this.drops.splice(i, 1); continue; }
      if (hit && hit.normal.y > 0.5) { this.land(d, hit.point, hit.normal); this.drops.splice(i, 1); continue; }
      if (hit) { d.v.reflect(hit.normal).multiplyScalar(0.25); continue; } // (a wall: it runs down it)
      d.p.add(_b);
      if ((d.trail += len) >= SPRAY.trail) { d.trail = 0; g.fx?.alpha.emit({ pos: d.p.clone(), vel: d.v.clone().multiplyScalar(0.05), life: 0.25, size: 0.07, sizeEnd: 0.02, color: ASPECT_COLOR[d.aspect], alpha: 0.7, drag: 2, gravity: 4 }); } // (a droplet along the arc each metre)
    }
    if (this.paintDue && !this.drops.length) this.flushPaint();
    // the paint's feeling on what stands in it (the creatures decide what a status means for them: creatures.build)
    this.statusT -= dt;
    if (this.statusT <= 0 && g.paintmap && g.creatures) {
      this.statusT = STATUS_EVERY;
      for (const c of g.creatures.list) {
        if (!c.alive || c.ally) continue;
        const p = g.paintmap.at(c.pos.x, c.pos.y, c.pos.z); if (!p) continue;
        g.creatures.build(c, TYPE_OF[p.aspect], 6 * p.k * STATUS_EVERY, 'courier', 'paint');
      }
    }
    // the looks (Calissa's): the load on the bristles while the brush is out, the bottle worn
    const raw = g.rawDt || dt;
    // the aim: the spread's heat, and the reticle where the stream would land while paint is aimed (a stand-in look: paintspray.js)
    this.aimer.update(dt, this.working && this.mode === 'paint', this.P);
    const aiming = this.busy && this.mode === 'paint' && this.tool.drawT > 0.02, tip = aiming ? this.aimer.muzzle(this.P, _a) : null;
    this.aimer.reticle(aiming, tip, aiming ? this.aimer.aim(tip, _d) : null, ASPECT_COLOR[this.aspect]);
    if (this.busy && this.tool.drawT > 0.02) g.brushLoad?.update(raw, { model: this.tool.model, mode: this.mode, saturate: Math.max(0, this.sat), working: this.working, aim: this.tool.club.aimDir(_d).clone(), from: this.mopAt, feeling: this.aspect });
    // the bottle: a reserve that feeds the pool below half
    const b = this.bottle;
    this.wear(b, raw);
    if (b && this.held > 0 && g.lachryma) {
      const f = bottleFeed(b, this.held, g.lachryma.fraction, dt);
      if (f > 0) { this.held -= f; g.lachryma.gain(f, 'bottle'); }
    }
  }

  /** The bottle on the upper back, seen (vfx/bottle.js): made when one is worn, its fill and its crack each frame. */
  wear(b, raw) {
    const g = this.game, ch = g.character;
    if (b !== this.lookId) { this.look?.dispose(); this.look = null; this.lookId = b; if (b && ch) { this.look = new LachrymatoBottle({ size: b.slice(7) }); this.look.mount(ch); } }
    if (!this.look) return;
    this.look.group.visible = !ch.hidden && !g.god?.active;
    this.crackT = Math.max(0, this.crackT - raw);
    this.look.set({ fill: this.held / BOTTLES[b].capacity, crack: this.crackT > 0 });
    this.look.update(raw, this.P.accel || null);
  }

  land(d, at, normal = _d.set(0, 1, 0)) {
    const g = this.game, sp = this.aimer.splat(d, normal); // (its size by the throw, stretched along a shallow hit; every drop shows: k 0.9)
    let area = g.paintmap?.stamp(at.x, at.y, at.z, sp.r, d.aspect, 0.9) || 0;
    if (sp.stretch > 1.05) { const h = Math.hypot(d.v.x, d.v.z) || 1, o = sp.r * (sp.stretch - 1); area += g.paintmap?.stamp(at.x + (d.v.x / h) * o, at.y, at.z + (d.v.z / h) * o, sp.r * 0.85, d.aspect, 0.9) || 0; }
    this.paintArea += area; this.paintAspect = d.aspect;
    for (const c of g.creatures?.near?.(at, 0.9) || []) if (!c.ally) g.creatures.build(c, TYPE_OF[d.aspect], 3, 'courier', 'paint');
    if (simRand() < 0.3) g.fx?.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3(0, 1.2, 0), life: 0.3, size: 0.12, sizeEnd: 0.02, color: ASPECT_COLOR[d.aspect], alpha: 0.6, drag: 3, gravity: 6 });
  }

  /** A broken shield: the bottle may crack (the simulation's own roll), and what pours out is a stain where they stand. */
  shieldBreak() {
    const g = this.game, b = this.bottle; if (!b || this.held <= 0) return;
    const share = crack(b, simRand()); if (!share) return;
    const spilled = this.held * share; this.held -= spilled;
    g.stains?.spill(this.P.pos.clone(), this.grade || ASPECTS[0], spilled, 'courier', 'bottle');
    sfx.glassCrack?.(); // (a placeholder: Wanda's)
    this.crackT = 12; // (the crack shows a while: vfx/bottle.js)
    g.events?.emit('bottle.crack', { bottle: b, spilled: Math.round(spilled), by: 'creature' });
  }
}
