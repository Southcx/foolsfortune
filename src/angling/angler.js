// ---------------------------------------------------------------------------------------
// THE ANGLER: the rod form of the Sondelass, end to end. Choose an aspect of the Courier's mind (wheel), hold LMB to charge a cast
// and release to throw the lure (it lands where the crosshair points, out as far as the charge allows); the lure floats and the
// entities of the water come to it, or don't. While waiting: tap LMB to twitch it (a jig fish notice), hold RMB to sink it to
// the depth you want, hold LMB to reel it home, middle click to sound (a psychic ping that lights up everything near it).
// A fish probes the lure (small dips) and then bites (a hard dip, a ring of light, the rod tip shuddering): press LMB inside the
// window to set the hook. Then the fight (fight.js), then the landing: the fish is drawn up out of the water, held a moment, and
// spent, and what it was is written in the log and the ledger.
//
// The lure is held at a cost: casting reserves Lachryma (the mind is out on the line, so the pool is smaller while it is), and
// the fight drains a little every second; a landed fish pays back far more (baubles), and a lost line loses what was reserved.
//
// Prior art (see also species.js, fight.js): Zelda: Twilight Princess (aim, cast, the lure worked along, the strike), Animal
// Crossing (the bobber's dip), FFXIV (patience, the graded bite, hook sets), Stardew Valley (the tension band), Dredge (what is in
// the water is wrong), Red Dead Redemption 2 (reel, lean, give line). The cast is CC0: Universal Animation Library's
// Sword_Regular_C, held at its raised frame while a cast charges and played through on release.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Lure } from './lure.js';
import { FishingLine } from './line.js';
import { Fight } from './fight.js';
import { AnglerUI } from './ui.js';
import { ASPECTS, BY_SPECIES, TIDES } from './species.js';
import { GROUPS } from '../physics.js';
import { sfx } from '../audio.js';

const COST = 10, SOUND_COST = 5;
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3(), _e = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Angler {
  constructor(tool) {
    this.tool = tool;
    const g = (this.game = tool.game);
    this.aspect = 0;
    this.state = 'idle'; // idle | charge | swing | wait | fight | catch
    this.power = 0; this.castT = 0; this.castPhase = 'none'; this.castW = 0; this.launched = false;
    this.pressT = -1; this.reeling = false; this.sinking = false; this.twitchCool = 0; this.soundCool = 0; this.soundT = 0;
    this.reserved = 0; this.bite = null; this.fight = null; this.hooked = null; this.tremble = 0; this.trembleT = 0; this.bendV = 0; this.bendX = 0;
    this.lastLog = {};
    this.ui = new AnglerUI();
    this.line = new FishingLine(g.scene);
    this.weir = null; // (the room; set once it exists)
    this.lure = null;
    this.catchT = 0; this.caught = null; this.echo = null;
    this.aim = { point: new THREE.Vector3(), water: false };
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.marker.visible = false; this.marker.renderOrder = 4;
    g.scene.add(this.marker);
  }

  // ---------------------------------------------------------------- what the tool asks
  get pool() { return this.game.lachryma; }
  get P() { return this.tool.P; }
  get busy() { return this.state !== 'idle' || this.lure?.active; }
  get stance() { return this.state === 'charge' || this.state === 'swing' || this.state === 'fight' || this.state === 'catch'; }
  get casting() { return this.state === 'charge' || this.state === 'swing'; }
  get castClip() { return this.castW > 0.02; }
  get leftHand() { return this.state === 'fight' ? 1 : this.state === 'wait' ? (this.reeling ? 1 : 0.55) : this.state === 'catch' ? 0.4 : 0; }

  init(weir) {
    this.weir = weir;
    this.lure = new Lure(this.game, weir.ripples);
    weir.hooks = {
      lure: () => (this.lure.active ? this.lure : null),
      onProbe: (f, kind) => this.onProbe(f, kind),
      onBite: (f, kind) => this.onBite(f, kind),
      onMiss: (f) => this.onMiss(f),
      onSpook: () => {},
    };
  }

  emit(name, data) { this.game.events?.emit(name, data); }
  bend() { return this.bendX; }
  flick() { return this.trembleT > 0 ? Math.sin(performance.now() * 0.05) * this.tremble * 0.06 : 0; }
  stripHtml(active) { return this.ui.strip(this.aspect); }
  castPose(C, out) {
    if (this.castW <= 0.02) return null;
    C.sample('swordC', Math.min(1.9, this.castT), out, false);
    return { pose: out, w: this.castW };
  }

  // ---------------------------------------------------------------- landing point of a cast
  aimAt(power) {
    const g = this.game, P = this.P;
    g.camera.getWorldPosition(_o); g.camera.getWorldDirection(_d);
    const maxD = 6 + 30 * power;
    const hit = g.physics.raycast(_o, _d, maxD, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    const dEnd = hit ? hit.distance : maxD;
    _e.copy(_o).addScaledVector(_d, dEnd);
    // the water first: a ray that goes down into a pool lands on its surface
    let water = null;
    if (this.weir) for (const pl of this.weir.pools) {
      if (_d.y < -0.01) {
        const t = (pl.surface - _o.y) / _d.y;
        if (t > 0 && t <= dEnd + 0.01) {
          const x = _o.x + _d.x * t, z = _o.z + _d.z * t;
          if (x > pl.x0 && x < pl.x1 && z > pl.z0 && z < pl.z1) { _e.set(x, pl.surface, z); water = pl; }
        }
      }
    }
    if (!water) {
      const pl = this.weir?.poolAt(_e.x, _e.z);
      if (pl && _e.y > pl.surface) { _e.y = pl.surface; water = pl; }
      else if (!pl) {
        const down = g.physics.raycast({ x: _e.x, y: _e.y + 1.5, z: _e.z }, { x: 0, y: -1, z: 0 }, 30, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
        if (down) _e.y = down.point.y;
      }
    }
    this.aim.point.copy(_e); this.aim.water = !!water;
    return this.aim;
  }

  ground(x, z, y) {
    const g = this.game;
    const h = g.physics.raycast({ x, y, z }, { x: 0, y: -1, z: 0 }, 20, this.P.collider, GROUPS.controllerQuery, (c) => !c.isSensor());
    return h ? h.point.y : null;
  }

  // ---------------------------------------------------------------- reserve
  reserve() {
    if (this.pool.available < COST) { this.pool.spend(COST, 'angle'); return false; } // (the pool says it is denied)
    this.reserved = this.pool.reserve(COST);
    return true;
  }
  settle(kind) { // 'refund' | 'lose' | 'catch'
    const R = this.reserved;
    if (R <= 0) return;
    this.reserved = 0;
    if (kind === 'refund') this.pool.refund(R);
    else if (kind === 'lose') this.pool.commit(R, 'angle');
    else { this.pool.commit(R * 0.4, 'angle'); this.pool.refund(R * 0.6); }
  }

  // ---------------------------------------------------------------- the frame
  update(dt, inp, held) {
    const P = this.P, g = this.game;
    if (!this.lure) { if (g.weir) this.init(g.weir); else return; }
    if (this.echo) { this.echo.t -= dt; if (this.echo.t <= 0) this.echo = null; }
    this.twitchCool -= dt; this.soundCool -= dt; this.tremble = Math.max(0, this.tremble - dt * 0.8); this.trembleT = this.tremble > 0.01 ? 1 : 0;
    // the aspect
    if (held && inp.wheel && this.state !== 'fight' && this.state !== 'catch') {
      this.aspect = (this.aspect + (inp.wheel > 0 ? 1 : ASPECTS.length - 1)) % ASPECTS.length;
      if (this.lure.active) this.lure.setAspect(this.aspect);
      this.tool.renderStrip(); sfx.plink(this.aspect * 2);
    }
    const down = held && inp.isDown('Mouse0'), press = held && inp.wasPressed('Mouse0');
    const rdown = held && inp.isDown('Mouse2');
    // the lure runs whenever there is one
    this.reeling = false; this.sinking = false;
    switch (this.state) {
      case 'idle': this.updateIdle(dt, inp, held, down, press, rdown); break;
      case 'charge': this.updateCharge(dt, inp, held, down, rdown); break;
      case 'swing': this.updateSwing(dt); break;
      case 'wait': this.updateWait(dt, inp, held, down, press, rdown); break;
      case 'fight': this.updateFight(dt, inp, held, down, rdown); break;
      case 'catch': this.updateCatch(dt); break;
      default: break;
    }
    // (the cast clip's weight)
    const want = this.castPhase === 'charge' || this.castPhase === 'swing' ? 1 : 0;
    this.castW = THREE.MathUtils.damp(this.castW, want, want ? 14 : 8, dt);
    if (this.castPhase === 'recover' && this.castW < 0.03) this.castPhase = 'none';
    // the sounding wave
    if (this.soundT > 0) {
      this.soundT -= dt;
      this.weir.sound.r = 27 * (1 - this.soundT / 1.5);
      if (this.soundT <= 0) this.weir.sound.r = 0;
    }
    // the lure, its line, the rod
    const lure = this.lure;
    if (lure.active && this.state !== 'fight' && this.state !== 'catch') {
      lure.update(dt, {
        poolAt: (x, z) => this.weir.poolAt(x, z), ground: (x, z, y) => this.ground(x, z, y), player: P.pos,
        reeling: this.reeling, sinking: this.sinking, reelSpeed: 3.6,
        onHome: () => this.home(),
      });
      // (a cast of the whole line: too far from the lure and it parts)
      if (lure.active && this.state !== 'fight' && lure.pos.distanceTo(P.pos) > 60) this.lose('spool');
    }
    this.drawLine(dt);
    this.updateMarker(dt, held);
    // the rod bends toward what pulls it
    const bendT = this.state === 'fight' ? 0.12 + Math.min(1.2, this.fight?.tension ?? 0) * 0.5 : this.state === 'charge' ? -0.12 * this.power : this.bite ? 0.15 : 0;
    this.bendX = THREE.MathUtils.damp(this.bendX, bendT + (this.state === 'fight' && this.fight?.seg?.kind === 'thrash' ? Math.sin(performance.now() * 0.06) * 0.1 : 0), 10, dt);
    this.ui.cast(this.state === 'charge' ? this.power : 0);
    this.ui.fight(this.state === 'fight' ? this.fight : null, this.fight?.maxLine ?? 20);
  }

  updateIdle(dt, inp, held, down, press, rdown) {
    if (!held) return;
    if (press && this.tool.form === 'rod') {
      if (!this.reserve()) return;
      this.state = 'charge'; this.power = 0; this.castPhase = 'charge'; this.castT = 0;
      this.emit('angle.charge', {});
    }
  }

  updateCharge(dt, inp, held, down, rdown) {
    const P = this.P;
    this.power = Math.min(1, this.power + dt / 1.15);
    this.castT = THREE.MathUtils.damp(this.castT, 0.22 + 0.02 * this.power, 12, dt);
    P.bodyYaw = P.yaw;
    this.aimAt(this.power);
    if (rdown || !held) { this.cancelCast(); return; } // (RMB or putting it away: never mind)
    if (!down) {
      if (this.power < 0.12) { this.cancelCast(); return; }
      this.state = 'swing'; this.castPhase = 'swing'; this.launched = false; this.finalPower = this.power;
      this.castT = 0.22;
      sfx.cast(this.power);
    }
  }

  cancelCast() { this.settle('refund'); this.state = 'idle'; this.castPhase = 'recover'; this.power = 0; }

  updateSwing(dt) {
    const P = this.P;
    P.bodyYaw = P.yaw;
    this.castT += dt * 1.2;
    if (!this.launched && this.castT >= 0.52) {
      this.launched = true;
      const a = this.aimAt(this.finalPower);
      this.tool.model.group.updateMatrixWorld(true);
      this.tool.tip(_t);
      // the mind goes out: a little jitter on a full charge
      const to = a.point.clone();
      if (this.finalPower > 0.92) to.x += (Math.random() - 0.5) * 1.6, to.z += (Math.random() - 0.5) * 1.6;
      this.lure.cast(_t, to, this.aspect);
      this.lure.echo = this.echo && this.echo.t > 0 ? this.echo.id : null;
      if (this.lure.echo) { this.emit('angle.mooch', { echo: this.lure.echo }); this.echo = null; }
      this.castDist = _t.distanceTo(to);
      this.emit('angle.cast', { power: this.finalPower, dist: this.castDist, aspect: ASPECTS[this.aspect].id, water: a.water });
    }
    if (this.castT >= 0.78) { this.state = 'wait'; this.castPhase = 'recover'; this.waitT = 0; this.tool.renderStrip(); }
  }

  updateWait(dt, inp, held, down, press, rdown) {
    const P = this.P, lure = this.lure;
    this.waitT += dt;
    if (!lure.active) { this.state = 'idle'; this.settle('refund'); return; }
    if (!held) return;
    // the strike: a press while the bite is open
    if (press && this.bite) { this.hookSet(); return; }
    if (press) this.pressT = 0;
    if (this.pressT >= 0) {
      if (down) { this.pressT += dt; if (this.pressT > 0.22 && lure.state !== 'air') this.reeling = true; }
      else {
        if (this.pressT <= 0.22 && this.twitchCool <= 0 && lure.inWater && !this.bite) { lure.jig(); this.twitchCool = 0.7; this.tremble = 0.4; this.emit('angle.twitch', {}); }
        this.pressT = -1;
      }
    }
    if (rdown && lure.state !== 'air') this.sinking = true;
    if (inp.wasPressed('Mouse1') && this.soundCool <= 0) this.sound();
    if (lure.state === 'reel' && lure.pos.distanceTo(P.pos) < 3) this.tremble = 0.2;
    // (sound while waiting near a bite window is fine; a bite that has run out is cleared by the fish)
    if (this.bite) { this.bite.t += dt; if (this.bite.t > this.bite.window + 0.05) this.bite = null; }
    if (this.reeling) sfx.reelTick(1);
  }

  sound() {
    const g = this.game;
    if (!this.pool.spend(SOUND_COST, 'sound')) return;
    this.soundCool = 3; this.soundT = 1.5;
    const src = this.lure.active ? this.lure.pos : this.P.pos;
    this.weir.sound.src.copy(src);
    const y = this.lure.pool?.surface ?? this.weir.poolAt(src.x, src.z)?.surface ?? src.y;
    this.weir.ripples.ring(src.x, y, src.z, 27, ASPECTS[this.aspect].color, 1.5);
    this.weir.ripples.ring(src.x, y, src.z, 14, 0xffffff, 1.1);
    sfx.sounding();
    this.emit('angle.sound', {});
  }

  /** The lure is home. */
  home() {
    this.settle('refund');
    this.state = 'idle'; this.bite = null;
    this.emit('angle.retrieve', {});
    this.tool.renderStrip();
  }

  // ---------------------------------------------------------------- what the fish do to the lure
  onProbe(f, kind) {
    this.lure.nudge(kind === 'tug' ? 0.5 : 0.25);
    this.weir.ripples.ring(this.lure.pos.x, this.lure.poolY(), this.lure.pos.z, 0.7, 0xffffff, 0.8);
    this.tremble = kind === 'tug' ? 0.5 : 0.25;
    sfx.nibble();
    this.emit('angle.nibble', { kind });
  }
  onBite(f, kind) {
    const lure = this.lure;
    lure.claimed = true;
    const k = kind === 'gulp' ? 2 : kind === 'tug' ? 1 : 0;
    lure.nudge(k === 2 ? 1.8 : 1.1);
    this.weir.ripples.ring(lure.pos.x, lure.poolY(), lure.pos.z, 2.2, 0xfff1dc, 1.1);
    this.weir.ripples.ring(lure.pos.x, lure.poolY(), lure.pos.z, 1.1, ASPECTS[this.aspect].color, 0.7);
    this.tremble = 1; sfx.bite(k);
    this.P.shake = Math.max(this.P.shake, 0.18);
    this.ui.biteFlash();
    this.bite = { fish: f, kind, t: 0, window: f.window };
    this.emit('angle.bite', { kind });
  }
  onMiss(f) {
    this.bite = null;
    this.lure.claimed = false;
    sfx.escape();
    this.emit('angle.miss', { species: f.sp.id });
  }

  hookSet() {
    const b = this.bite, f = b.fish;
    const u = b.t / b.window;
    const quality = u > 0.12 && u < 0.62 ? 'perfect' : u < 0.12 ? 'early' : 'late';
    this.bite = null;
    f.state = 'hooked';
    this.hooked = f;
    const lure = this.lure;
    lure.claimed = true;
    this.state = 'fight';
    const P = this.P;
    const maxLine = Math.max(16, this.castDist * 1.5 + 8);
    this.fight = new Fight(f, P.pos, { pool: lure.pool, maxLine, onEvent: (k, d) => this.onFight(k, d) });
    this.fight.hookQuality = quality;
    if (quality === 'perfect') this.fight.stamina = 0.9;
    this.fightStart = performance.now();
    this.tremble = 1; P.shake = Math.max(P.shake, 0.35); P.fovPunch = Math.max(P.fovPunch || 0, 4);
    sfx.hookSet();
    lure.group.visible = false; // (the fish has it)
    this.emit('angle.hookset', { quality, kind: b.kind, species: f.sp.id });
    this.tool.renderStrip();
  }

  onFight(kind, d) {
    const f = this.hooked; if (!f) return;
    const P = this.P, pos = f.pos;
    const rip = (r, c = 0xffffff, life = 1) => this.weir.ripples.ring(pos.x, this.fight.ctx.pool.surface, pos.z, r, c, life);
    if (kind === 'warn') { sfx.strain(0.8); rip(1.4, 0xff8f7d, 0.6); this.tremble = 0.8; this.emit('angle.warn', {}); }
    else if (kind === 'thrash') { rip(2.2, 0xffffff, 0.9); this.emit('angle.thrash', {}); this.game.fx.impact?.(pos.clone(), new THREE.Vector3(0, 1, 0), { sparks: 0, dust: 6 }); P.shake = Math.max(P.shake, 0.25); }
    else if (kind === 'leap' || kind === 'breach') { rip(kind === 'breach' ? 5 : 2.4, kind === 'breach' ? 0xffd76a : 0xffffff, 1.4); sfx.splash(kind === 'breach' ? 2 : 1); if (kind === 'breach') { sfx.leviathan(); P.shake = Math.max(P.shake, 0.6); this.emit('angle.breach', {}); } }
    else if (kind === 'splash') { rip(2.6, 0xffffff, 1); sfx.splash(1.2); }
    else if (kind === 'spent') this.emit('angle.spent', { species: f.sp.id });
    else if (kind === 'bolt') { rip(1.8, 0xffffff, 0.8); this.emit('angle.bolt', {}); }
  }

  updateFight(dt, inp, held, down, rdown) {
    const P = this.P, F = this.fight;
    if (!held) { this.escape('stow'); return; }
    this.reeling = down; this.sinking = false;
    const brace = P.crouching || inp.isDown('KeyC');
    if (brace) F.braced = true;
    P.bodyYaw = P.yaw;
    const res = F.update(dt, { reel: down, give: rdown, brace, yaw: P.yaw, player: P.pos });
    F.stats.gaveLine = (F.stats.gaveLine || 0) + (rdown ? dt : 0);
    // the mind pays for the fight
    const sp = F.sp;
    const rate = Math.min(1.2, 0.3 + sp.lach * 0.01) * (1 - 0.6 * F.relief) * (0.4 + F.tension);
    const took = this.pool.drain(rate * dt, 'angle');
    if (took < rate * dt * 0.5 && this.pool.available <= 0.01 && !F.forceSlack) { F.forceSlack = true; this.emit('angle.mindgone', {}); }
    // sounds
    if (F.tension > 0.7) sfx.strain(F.tension);
    if (down) sfx.reelTick(Math.min(1, F.tension + 0.2));
    if (rdown && F.pull > 0.5) sfx.lineOut(F.pull);
    // the rod's feel
    this.tremble = Math.max(this.tremble, F.tension > 0.85 ? (F.tension - 0.7) : 0);
    P.shake = Math.max(P.shake, F.tension > 0.95 ? 0.15 : 0);
    this.tool.model.setReel(this.tool.model.spin + (down ? dt * 12 * (0.5 + F.tension) : 0));
    if (F.airborne > 0) F.fish.pos.y = F.ctx.pool.surface + F.airborne * (0.6 + F.fish.length * 0.55);
    if (res === 'land') this.land();
    else if (res) this.lose(res);
  }

  /** The line goes: 'snap' | 'slip' | 'spool' | 'stow'. */
  lose(why) {
    if (this.state === 'fight') return this.escape(why);
    // (a lure with no fish on it: only the line parting)
    this.lure.retrieve(); this.line.hide(); this.settle('lose');
    this.state = 'idle'; this.bite = null;
    sfx.lineSnap(); this.emit('angle.escape', { why, species: null });
  }

  escape(why) {
    const F = this.fight, f = this.hooked;
    if (why === 'snap' || why === 'spool') { sfx.lineSnap(); this.settle('lose'); }
    else if (why === 'slip') { sfx.escape(); this.settle('lose'); }
    else { sfx.escape(); this.settle('refund'); }
    if (f) { f.state = 'flee'; f.timer = 3; f.cool = 20; f.pos.y = Math.min(f.pos.y, this.fight.ctx.pool.surface - 0.5); f.heading += Math.PI; }
    this.emit('angle.escape', { why, species: f?.sp.id ?? null, dur: F ? F.t : 0, stamina: F?.stamina ?? 1 });
    this.lure.retrieve();
    this.line.hide();
    this.hooked = null; this.fight = null; this.state = 'idle'; this.reeling = false;
    this.ui.fight(null);
    this.tool.renderStrip();
  }

  // ---------------------------------------------------------------- the landing
  land() {
    const F = this.fight, f = this.hooked, P = this.P, sp = f.sp;
    const dur = F.t;
    this.caught = { f, t: 0, from: f.pos.clone() };
    this.state = 'catch'; this.catchT = 0;
    f.state = 'landed';
    this.lure.retrieve();
    const first = this.game.ledger.get(`fish.sp.${sp.id}`) === 0;
    const rec = this.game.ledger.best(`fish.cm.${sp.id}`);
    const tide = TIDES[this.weir.tide].id;
    this.emit('angle.catch', {
      species: sp.id, cm: f.cm, kg: f.kg, cls: f.cls, dur, peak: F.stats.peak, thrashes: F.stats.thrashes, quality: F.hookQuality,
      aspect: ASPECTS[this.aspect].id, tide, brace: !!F.braced, gave: F.stats.gaveLine || 0, slackMax: F.stats.slackMax, first,
      record: rec === undefined ? false : f.cm > rec, depth: this.lure.pool ? this.lure.pool.surface - f.pos.y : 0, legend: !!sp.legend,
    });
    this.echo = { id: sp.id, t: 150 }; // (what is left on the lure: the next cast carries it)
    sfx.catchSong(sp.tier > 3 ? 3 : sp.tier > 2 ? 2 : sp.tier > 1 ? 1 : 0);
    if (sp.legend) sfx.leviathan();
    P.shake = Math.max(P.shake, sp.legend ? 0.8 : 0.2);
    this.hooked = null; this.fight = null;
    this.ui.fight(null);
    this.tool.renderStrip();
  }

  updateCatch(dt) {
    const P = this.P, C = this.caught, f = C.f;
    this.catchT += dt;
    const k = smooth(0, 0.9, this.catchT);
    // drawn up out of the water and held before her
    const hold = _t.set(P.pos.x + Math.sin(P.yaw) * 1.6, P.pos.y + 1.7, P.pos.z + Math.cos(P.yaw) * 1.6);
    f.pos.lerpVectors(C.from, hold, k);
    f.pos.y += Math.sin(Math.PI * k) * 1.2;
    f.heading = P.yaw * -1 + Math.PI / 2 + this.catchT * 1.1; f.pitch = 0.3 * (1 - k);
    f.speed = 0.6;
    f.state = 'landed'; f.fade = 1;
    const g = f.mesh.group;
    g.position.copy(f.pos); g.rotation.set(0, -f.heading, f.pitch, 'YZX');
    g.scale.setScalar(THREE.MathUtils.lerp(1, Math.min(1.5, 0.7 / Math.max(0.3, f.length) + 0.9), k));
    f.mesh.swim(dt, 0.3, 0);
    f.mesh.glow(1);
    this.drawLine(dt, true);
    if (this.catchT > 2.1) {
      // it comes apart into what it was made of
      const n = Math.round(2 + f.sp.lach * 0.18 * (0.6 + f.cm / f.sp.size[1]));
      this.game.baubles?.spawn(f.pos.clone(), n);
      this.settle('catch');
      const fx = this.game.fx;
      for (let i = 0; i < 26; i++) fx.add.emit({ pos: f.pos.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3), life: 1.2, size: 0.12, sizeEnd: 0.01, color: new THREE.Color(f.sp.color), alpha: 0.9, drag: 2, floor: -100 });
      this.game.pool?.gain?.(0);
      this.weir.remove(f);
      this.caught = null; this.state = 'idle'; this.castPhase = 'none';
      this.emit('angle.landed', { species: f.sp.id, baubles: n });
    }
  }

  // ---------------------------------------------------------------- put away
  stow() {
    if (this.state === 'fight') this.escape('stow');
    else if (this.state === 'catch') { this.catchT = 9; this.updateCatch(0.016); }
    if (this.lure?.active) { this.lure.retrieve(); }
    this.settle('refund');
    this.state = 'idle'; this.bite = null; this.castPhase = 'none'; this.castW = 0; this.power = 0; this.line.hide();
    this.marker.visible = false; this.ui.cast(0); this.ui.fight(null); this.pressT = -1;
    if (this.weir) this.weir.sound.r = 0;
  }

  // ---------------------------------------------------------------- the line and the marker
  drawLine(dt, catching = false) {
    const lure = this.lure, tool = this.tool;
    if (!lure) return;
    const t = performance.now() / 1000;
    tool.model.group.updateMatrixWorld(true);
    tool.tip(_t);
    if (this.state === 'fight' && this.fight) {
      const f = this.hooked;
      const mouth = _e.copy(f.pos).add(_d.set(Math.cos(f.heading), 0, Math.sin(f.heading)).multiplyScalar(f.length * 0.45));
      this.line.set(_t, mouth, this.fight.tension, t, ASPECTS[this.aspect].color);
    } else if (catching && this.caught) {
      this.line.set(_t, this.caught.f.pos, 0.55, t);
    } else if (lure.active) {
      const end = _e.copy(lure.pos);
      this.line.set(_t, end, lure.state === 'air' ? 0.75 : lure.state === 'reel' ? 0.6 : 0.2 + (this.bite ? 0.4 : 0), t);
    } else this.line.hide();
  }

  updateMarker(dt, held) {
    const show = this.state === 'charge';
    this.marker.visible = show;
    if (!show) return;
    this.marker.position.copy(this.aim.point).y += 0.04;
    const s = 0.9 + this.power * 0.6 + 0.08 * Math.sin(performance.now() * 0.01);
    this.marker.scale.setScalar(s);
    this.marker.material.color.setHex(this.aim.water ? ASPECTS[this.aspect].color : 0x8c6a58);
  }

  // ---------------------------------------------------------------- fixed step: a big fish drags the Courier
  fixed(dt) {
    if (this.state !== 'fight' || !this.fight) return;
    const P = this.P, F = this.fight;
    if (!P.grounded) return;
    const a = 2.6 * F.pull * (0.5 + F.sizeK) * (F.braced && (P.crouching) ? 0.35 : 1) * (1 - 0.5 * F.relief);
    if (a < 0.2) return;
    const dx = Math.sin(F.bearing), dz = Math.cos(F.bearing);
    // (never into the water, and never off the deck: she is pulled toward the edge and stopped there)
    const nx = P.pos.x + dx * 0.8, nz = P.pos.z + dz * 0.8;
    if (this.weir.poolAt(nx, nz)) return;
    P.vel.x += dx * a * dt; P.vel.z += dz * a * dt;
  }
}
