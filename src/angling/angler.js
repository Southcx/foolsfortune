// ---------------------------------------------------------------------------------------
// THE ANGLER: the rod form of the Sondelass, end to end. Choose an aspect of the Courier's mind (keys 4 to 8, or the wheel), hold
// LMB to charge a cast (the arc it will fly shows in the air) and release to throw the lure; it lands where the crosshair points,
// out as far as the charge allows. The lure floats and the entities of the water come to it, or don't. While waiting: tap LMB to
// twitch it (a jig that fish notice), hold RMB to sink it, the wheel to set its depth (it HOLDS the depth it is left at), hold LMB
// to reel it home, middle click to sound: a psychic ping, a sphere of light that leaves the lure and lights what it passes.
// What is tied on is a LURE (lures.js; 9 and 0 change it while the line is in): each has a taste of its own that the fish come to
// or don't, and any curio the Courier holds can be tied on. The aspect (4 to 8) is what a sounding pushes into the lure, and every
// sounding stirs every fish in that water, the nearer the more.
// A fish that has noticed the lure gets a "!" over it, probes it (small dips), and then bites: a "!!!" over the lure, a hard dip and
// a ring of light. Press LMB inside the window to set the hook.
//
// THE FIGHT starts the instant the hook is set. The Courier can no longer walk: the movement keys are the rod's (fight.js: A/D lean,
// S haul, W bow, C brace, LMB reel, RMB give). The screen goes to a frame (letterbox bars, a tighter lens, the camera swinging toward
// the fish), a window slides in with the fish thrashing on the lure (portrait.js), and everything the fight is doing is shown where it
// is: the line is the colour of its load, the reticle sits on the fish and shows what it will do next, a beat before it does it.
// Then the landing: the fish is drawn up out of the water and held, and spent; what it was is written in the log and the ledger.
//
// The lure is held at a cost: casting reserves Lachryma (the mind is out on the line, so the pool is smaller while it is), and
// the fight drains a little every second; a landed fish pays back far more (baubles), and a lost line loses what was reserved.
//
// Prior art (see also species.js, fight.js): Zelda: Twilight Princess (aim, cast, the lure worked along, the strike; its fishing
// hole's cut to a close camera), Animal Crossing (the bobber's dip), FFXIV (patience, the graded bite as !, !!, !!!, hook sets), Stardew
// Valley (the tension band), Dredge (what is in the water is wrong), Red Dead Redemption 2 (reel, lean, give line; the fight's camera),
// Subnautica and Horizon Zero Dawn (the sounding as a sphere). The cast is CC0: Universal Animation Library's Sword_Regular_C, held at
// its raised frame while a cast charges and played through on release.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Lure } from './lure.js';
import { FishingLine } from './line.js';
import { Fight, LOOK } from './fight.js';
import { Reticle } from './reticle.js';
import { aspectStrip } from './ui.js';
import { lureList, attraction, tasteOf } from './lures.js';
import { ASPECTS, BY_SPECIES, TIDES } from './species.js';
import { GROUPS } from '../physics.js';
import { sfx } from '../audio.js';

const COST = 10, SOUND_COST = 5;
/** The default sounding: how far it reaches (m) and how long it takes to get there (s). */
export const PING_R = 54, PING_LIFE = 2.0;
const ASPECT_KEYS = ['Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];
/** A sounding's stir falls off with distance from where it went off (metres at which it is half as strong). */
const STIR_HALF = 16;
const G = 9.81;
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3(), _e = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const CALM = { pull: 0.05, tension: 0.15, stamina: 0.02, seg: { kind: 'spent' } };

/** The colour and mark a segment of the fish's script is shown with. */
const MARKS = {
  lean: { icon: 'chevron', color: 0xffb27a },
  haul: { icon: 'chevron', color: 0xff8a4a, dir: [0, -1] },
  bow: { icon: 'chevron', color: 0xffe08a, dir: [0, 1] },
  brace: { icon: 'burst', color: 0xff4a3a },
};

export class Angler {
  constructor(tool) {
    this.tool = tool;
    const g = (this.game = tool.game);
    g.angler = this;
    this.aspect = 0;
    this.lureId = 'bob';
    this.state = 'idle'; // idle | charge | swing | wait | fight | catch
    this.power = 0; this.castT = 0; this.castPhase = 'none'; this.castW = 0; this.launched = false;
    this.pressT = -1; this.reeling = false; this.sinking = false; this.twitchCool = 0; this.soundCool = 0; this.soundT = 0;
    this.reserved = 0; this.bite = null; this.fight = null; this.hooked = null; this.tremble = 0; this.trembleT = 0; this.bendV = 0; this.bendX = 0;
    this.lastLog = {};
    this.line = new FishingLine(g.scene);
    this.reticle = new Reticle(g.scene);
    this.weir = null; // (the room; set once it exists)
    this.lure = null;
    this.catchT = 0; this.caught = null; this.echo = null;
    this.biteGlyph = null; this.pingCol = 0xffb27a;
    this.aim = { point: new THREE.Vector3(), water: false };
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.marker.visible = false; this.marker.renderOrder = 4;
    g.scene.add(this.marker);
    // the arc a cast will fly, in motes of light
    this.ARC = 26;
    this.arcGeo = new THREE.BufferGeometry();
    this.arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.ARC * 3), 3));
    this.arc = new THREE.Points(this.arcGeo, new THREE.PointsMaterial({ size: 0.34, color: 0xffb27a, map: g.fx.haloTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    this.arc.frustumCulled = false; this.arc.visible = false; this.arc.renderOrder = 4;
    g.scene.add(this.arc);
  }

  // ---------------------------------------------------------------- what the tool asks
  get pool() { return this.game.lachryma; }
  get P() { return this.tool.P; }
  get busy() { return this.state !== 'idle' || this.lure?.active; }
  get stance() { return this.state === 'charge' || this.state === 'swing' || this.state === 'fight' || this.state === 'catch'; }
  get casting() { return this.state === 'charge' || this.state === 'swing'; }
  /** The movement keys are the rod's from the instant the hook is set until the fish is landed or lost. */
  get locksMove() { return this.state === 'fight' || this.state === 'catch'; }
  get castClip() { return this.castW > 0.02; }
  get leftHand() { return this.state === 'fight' ? 1 : this.state === 'wait' ? (this.reeling ? 1 : 0.55) : this.state === 'catch' ? 0.4 : 0; }
  /** What the fish portrait draws from: the fight, or a calm one while it is being held up. */
  fightView() { return this.state === 'fight' ? this.fight : this.state === 'catch' ? CALM : null; }

  init(weir) {
    this.weir = weir;
    this.lure = new Lure(this.game, weir.ripples);
    weir.hooks = {
      lure: () => (this.lure.active ? this.lure : null),
      onProbe: (f, kind) => this.onProbe(f, kind),
      onBite: (f, kind) => this.onBite(f, kind),
      onMiss: (f) => this.onMiss(f),
      onNotice: (f) => this.onNotice(f),
      onPing: (f) => this.onPing(f),
      onSpook: () => {},
    };
  }

  emit(name, data) { this.game.events?.emit(name, data); }
  bend() { return this.bendX; }
  flick() { return this.trembleT > 0 ? Math.sin(performance.now() * 0.05) * this.tremble * 0.06 : 0; }
  stripHtml() { return aspectStrip(this.aspect, this.lureDef()); }
  /** The lure tied on now (lures.js). */
  lureDef() { const L = lureList(this.game.ledger, this.game.veritome?.book); return L.find((l) => l.id === this.lureId) || L[0]; }
  /** Tie on the next (or previous) lure the Courier has. Not while one is out: it is on the line. */
  cycleLure(d) {
    if (this.lure?.active) return;
    const L = lureList(this.game.ledger, this.game.veritome?.book), i = Math.max(0, L.findIndex((l) => l.id === this.lureId));
    this.lureId = L[(i + d + L.length) % L.length].id;
    this.tool.renderStrip(); sfx.plink(3);
    this.emit('angle.lure', { lure: this.lureId });
  }
  castPose(C, out) {
    if (this.castW <= 0.02) return null;
    C.sample('swordC', Math.min(1.9, this.castT), out, false);
    return { pose: out, w: this.castW };
  }
  get aspectColor() { return ASPECTS[this.aspect].color; }
  setAspect(a) {
    if (a === this.aspect) return;
    this.aspect = a;
    if (this.lure?.active) this.lure.setAspect(a);
    this.tool.renderStrip(); sfx.plink(a * 2);
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
    // the aspect (keys 4 to 8; the wheel too, until the lure is in the water) and the depth (the wheel, with it in)
    let depthNudge = 0;
    if (held && this.state !== 'fight' && this.state !== 'catch') {
      ASPECT_KEYS.forEach((k, i) => { if (inp.wasPressed(k)) this.setAspect(i); });
      if (inp.wasPressed('Digit9')) this.cycleLure(-1);
      if (inp.wasPressed('Digit0')) this.cycleLure(1);
      if (inp.wheel) {
        if (this.lure.inWater) depthNudge = inp.wheel > 0 ? 0.5 : -0.5;
        else this.setAspect((this.aspect + (inp.wheel > 0 ? 1 : ASPECTS.length - 1)) % ASPECTS.length);
      }
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
    // the sounding: how far the wave has reached (the pulse itself is drawn by vfx/pulse.js)
    if (this.soundT > 0) {
      this.soundT -= dt;
      const k = 1 - Math.max(0, this.soundT) / PING_LIFE;
      this.weir.sound.r = PING_R * (1 - Math.pow(1 - k, 3));
      if (this.soundT <= 0) this.weir.sound.r = 0;
    }
    // the lure, its line, the rod
    const lure = this.lure;
    if (lure.active && this.state !== 'fight' && this.state !== 'catch') {
      lure.update(dt, {
        poolAt: (x, z) => this.weir.poolAt(x, z), ground: (x, z, y) => this.ground(x, z, y), player: P.pos,
        reeling: this.reeling, sinking: this.sinking, depthNudge, reelSpeed: 3.6,
        onHome: () => this.home(),
      });
      // (a cast of the whole line: too far from the lure and it parts)
      if (lure.active && this.state !== 'fight' && lure.pos.distanceTo(P.pos) > 60) this.lose('spool');
    }
    this.drawLine(dt);
    this.updateMarker(dt, held);
    this.updateReticle(dt);
    // the rod bends toward what pulls it
    const bendT = this.state === 'fight' ? 0.12 + Math.min(1.2, this.fight?.tension ?? 0) * 0.5 : this.state === 'charge' ? -0.12 * this.power : this.bite ? 0.15 : 0;
    this.bendX = THREE.MathUtils.damp(this.bendX, bendT + (this.state === 'fight' && this.fight?.seg?.kind === 'thrash' ? Math.sin(performance.now() * 0.06) * 0.1 : 0), 10, dt);
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
      this.lure.item = this.lureDef();
      this.lure.cast(_t, to, this.aspect);
      this.lure.echo = this.echo && this.echo.t > 0 ? this.echo.id : null;
      if (this.lure.echo) { this.emit('angle.mooch', { echo: this.lure.echo }); this.echo = null; }
      this.castDist = _t.distanceTo(to);
      this.emit('angle.cast', { power: this.finalPower, dist: this.castDist, aspect: ASPECTS[this.aspect].id, water: a.water, lure: this.lureId });
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
    // (a bite that has run out is cleared by the fish)
    if (this.bite) { this.bite.t += dt; if (this.bite.t > this.bite.window + 0.05) { this.bite = null; this.biteGlyph?.close(); this.biteGlyph = null; } }
    if (this.reeling) sfx.reelTick(1);
  }

  /** The sounding: a pulse of the Courier's mind from the lure (wherever it is, on the surface or ten metres down), out to PING_R. */
  sound() {
    const g = this.game;
    if (!this.pool.spend(SOUND_COST, 'sound')) return;
    this.soundCool = 3; this.soundT = PING_LIFE;
    const src = this.lure.active ? this.lure.pos : this.P.pos;
    this.weir.sound.src.copy(src); this.weir.sound.id++; this.weir.sound.r = 0.01;
    const y = this.lure.pool?.surface ?? this.weir.poolAt(src.x, src.z)?.surface ?? null; // (where the shell meets the water it draws a ring on it)
    g.pulse.emit(src, PING_R, this.aspectColor, { life: PING_LIFE, surfaceY: y });
    // the active lure: the aspect is pushed into it for a while, and the whole of that water is stirred (the nearer, the more)
    if (this.lure.active) this.lure.push(this.aspect);
    const pool = this.lure.pool || this.weir.poolAt(src.x, src.z);
    const taste = tasteOf(this.lure.active ? this.lure.item : this.lureDef(), this.lure.active ? this.lure.boost : null);
    let stirred = 0;
    if (pool) for (const f of this.weir.fish) {
      if (f.pool !== pool) continue;
      const d = f.pos.distanceTo(src), fall = 1 / (1 + (d / STIR_HALF) ** 2);
      const k = fall * Math.min(1, 0.35 + attraction(taste, f.sp));
      f.stir(k); if (k > 0.2) stirred++;
    }
    this.tremble = Math.max(this.tremble, 0.35);
    sfx.sounding();
    this.emit('angle.sound', { stirred });
  }

  /** The wave has reached a fish: it opens a blip and is known for a few seconds (the reticle will read its mind). */
  onPing(f) {
    this.game.pulse.blip(f.pos, f.sp.color, 0.5 + Math.min(1.4, f.length * 0.8));
    this.emit('angle.reveal', { species: f.sp.id });
  }

  /** The lure is home. */
  home() {
    this.settle('refund');
    this.state = 'idle'; this.bite = null; this.biteGlyph?.close(); this.biteGlyph = null;
    this.emit('angle.retrieve', {});
    this.tool.renderStrip();
  }

  // ---------------------------------------------------------------- what the fish do to the lure
  /** A "!" over a fish that has noticed the lure. */
  onNotice(f) {
    if (this.state === 'fight') return;
    this.game.glyphs.pop('bang1', _u.copy(f.pos), { color: this.aspectColor, size: 0.55 + Math.min(0.5, f.length * 0.3), burst: true, life: 1.3, float: 0.8, follow: () => _w.copy(f.pos).addScaledVector(UP, 0.35 + f.length * 0.25) });
    sfx.plink(7);
    this.emit('angle.notice', { species: f.sp.id });
  }
  onProbe(f, kind) {
    this.lure.nudge(kind === 'tug' ? 0.5 : 0.25);
    this.weir.ripples.ring(this.lure.pos.x, this.lure.poolY(), this.lure.pos.z, 0.7, 0xffffff, 0.8);
    this.tremble = kind === 'tug' ? 0.5 : 0.25;
    // a nibble is small and quiet; a tug is a "!!" over the lure
    const at = () => _w.copy(this.lure.pos).addScaledVector(UP, 0.5);
    this.game.glyphs.pop(kind === 'tug' ? 'bang2' : 'dots', at(), { color: 0xfff1dc, size: kind === 'tug' ? 0.55 : 0.4, life: 0.9, float: 0.5, follow: at });
    sfx.nibble();
    this.emit('angle.nibble', { kind });
  }
  onBite(f, kind) {
    const lure = this.lure;
    lure.claimed = true;
    const k = kind === 'gulp' ? 2 : kind === 'tug' ? 1 : 0;
    lure.nudge(k === 2 ? 1.8 : 1.1);
    this.weir.ripples.ring(lure.pos.x, lure.poolY(), lure.pos.z, 2.2, 0xfff1dc, 1.1);
    this.weir.ripples.ring(lure.pos.x, lure.poolY(), lure.pos.z, 1.1, this.aspectColor, 0.7);
    this.tremble = 1; sfx.bite(k);
    this.P.shake = Math.max(this.P.shake, 0.18);
    this.bite = { fish: f, kind, t: 0, window: f.window };
    // the bite: "!!!", big, over the lure, for as long as the window is open (it shakes harder as it closes)
    const at = () => _w.copy(lure.pos).addScaledVector(UP, 0.9);
    this.biteGlyph?.close();
    this.biteGlyph = this.game.glyphs.pop('bang3', at(), { color: 0xffd76a, size: k === 2 ? 1.1 : 0.9, burst: true, ring: true, hold: f.window, float: 0.9, follow: at });
    this.game.time.pulse('bite', 0.35, 0.05); // (a flinch)
    this.emit('angle.bite', { kind });
  }
  onMiss(f) {
    this.bite = null;
    this.biteGlyph?.close(); this.biteGlyph = null;
    this.lure.claimed = false;
    const at = _u.copy(this.lure.pos).addScaledVector(UP, 0.6);
    this.game.glyphs.pop('ask', at, { color: 0x9fb3c8, size: 0.6, life: 1.2, float: 0.5 });
    sfx.escape();
    this.emit('angle.miss', { species: f.sp.id });
  }

  hookSet() {
    const b = this.bite, f = b.fish, g = this.game;
    const u = b.t / b.window;
    const quality = u > 0.12 && u < 0.62 ? 'perfect' : u < 0.12 ? 'early' : 'late';
    this.bite = null;
    this.biteGlyph?.close(); this.biteGlyph = null;
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
    // the moment: a hit-stop, the frame, the window with the fish in it
    g.time.pulse('hookset', 0.05, 0.11);
    g.glyphs.pop(quality === 'perfect' ? 'star' : 'bang1', _u.copy(lure.pos).addScaledVector(UP, 0.8), { color: quality === 'perfect' ? 0xffd76a : 0xfff1dc, size: quality === 'perfect' ? 1 : 0.6, burst: true, ring: true, life: 1.3 });
    g.portrait.show(f, this.aspectColor);
    this.frameFight(0, true);
    this.emit('angle.hookset', { quality, kind: b.kind, species: f.sp.id });
    this.tool.renderStrip();
  }

  onFight(kind, d) {
    const f = this.hooked; if (!f) return;
    const P = this.P, pos = f.pos, g = this.game;
    const rip = (r, c = 0xffffff, life = 1) => this.weir.ripples.ring(pos.x, this.fight.ctx.pool.surface, pos.z, r, c, life);
    const over = () => _u.copy(pos).addScaledVector(UP, 0.5 + f.length * 0.3);
    if (kind === 'warn') { sfx.strain(0.8); rip(1.4, 0xff8f7d, 0.6); this.tremble = 0.8; g.glyphs.pop('bang2', over(), { color: 0xff5a3c, size: 0.7, burst: true, life: 1.0 }); this.emit('angle.warn', {}); }
    else if (kind === 'thrash') { rip(2.2, 0xffffff, 0.9); this.emit('angle.thrash', {}); this.game.fx.impact?.(pos.clone(), new THREE.Vector3(0, 1, 0), { sparks: 0, dust: 6 }); P.shake = Math.max(P.shake, 0.25); g.time.pulse('thrash', 0.2, 0.06); g.portrait.hit(); }
    else if (kind === 'leap' || kind === 'breach') { rip(kind === 'breach' ? 5 : 2.4, kind === 'breach' ? 0xffd76a : 0xffffff, 1.4); sfx.splash(kind === 'breach' ? 2 : 1); g.portrait.hit(); if (kind === 'breach') { sfx.leviathan(); P.shake = Math.max(P.shake, 0.6); g.time.pulse('breach', 0.15, 0.2, { release: 0.4 }); this.emit('angle.breach', {}); } }
    else if (kind === 'splash') { rip(2.6, 0xffffff, 1); sfx.splash(1.2); g.portrait.hit(); }
    else if (kind === 'spent') { g.glyphs.pop('star', over(), { color: 0xa8ffcf, size: 0.7, life: 1.4 }); this.emit('angle.spent', { species: f.sp.id }); }
    else if (kind === 'bolt') { rip(1.8, 0xffffff, 0.8); g.glyphs.pop('bang1', over(), { color: 0xff8f7d, size: 0.6, burst: true, life: 1.0 }); this.emit('angle.bolt', {}); }
  }

  /** Which way a pull goes on the screen: -1 (left), 0, 1 (right). The keys lean the other way. */
  screenSide(side, bearing) {
    if (!side) return 0;
    _r.set(1, 0, 0).applyQuaternion(this.game.camera.quaternion);
    _t.set(Math.cos(bearing), 0, -Math.sin(bearing)).multiplyScalar(side);
    const d = _t.dot(_r);
    return Math.abs(d) < 0.05 ? 0 : Math.sign(d);
  }

  updateFight(dt, inp, held, down, rdown) {
    const P = this.P, F = this.fight;
    if (!held) { this.escape('stow'); return; }
    this.reeling = down; this.sinking = false;
    const kd = (c) => inp.isDown(c);
    const lean = (kd('KeyD') ? 1 : 0) - (kd('KeyA') ? 1 : 0), haul = kd('KeyS'), ease = kd('KeyW');
    const brace = P.crouching || kd('KeyC');
    if (brace) F.braced = true;
    // the body squares up to the fish
    P.bodyYaw += wrap(F.bearing - P.bodyYaw) * (1 - Math.exp(-dt * 7));
    const res = F.update(dt, { reel: down, give: rdown, brace, lean, haul, ease, pullDir: this.screenSide(F.seg.side, F.bearing), player: P.pos });
    F.stats.gaveLine = (F.stats.gaveLine || 0) + (rdown ? dt : 0);
    if (F.seg.need) F.stats.needT = (F.stats.needT || 0) + dt;
    F.stats.answered = (F.stats.answered || 0) + (F.answered ? dt : 0);
    // the mind pays for the fight
    const sp = F.sp;
    const rate = Math.min(1.2, 0.3 + sp.lach * 0.01) * (1 - 0.6 * F.relief) * (0.4 + F.tension);
    const took = this.pool.drain(rate * dt, 'angle');
    if (took < rate * dt * 0.5 && this.pool.available <= 0.01 && !F.forceSlack) { F.forceSlack = true; this.emit('angle.mindgone', {}); }
    // sounds
    if (F.tension > 0.7) sfx.strain(F.tension);
    if (down || haul) sfx.reelTick(Math.min(1, F.tension + 0.2));
    if (rdown && F.pull > 0.5) sfx.lineOut(F.pull);
    // the rod's feel
    this.tremble = Math.max(this.tremble, F.tension > 0.85 ? (F.tension - 0.7) : 0);
    P.shake = Math.max(P.shake, F.tension > 0.95 ? 0.15 : 0);
    this.tool.model.setReel(this.tool.model.spin + (down ? dt * 12 * (0.5 + F.tension) : 0));
    if (F.airborne > 0) F.fish.pos.y = F.ctx.pool.surface + F.airborne * (0.6 + F.fish.length * 0.55);
    this.frameFight(dt);
    if (res === 'land') this.land();
    else if (res) this.lose(res);
  }

  /** The camera and the bars for the fight: toward the fish, closer, a longer lens, a tilt with the lean, a red edge with the strain. */
  frameFight(dt, first = false) {
    const F = this.fight, P = this.P, cin = this.game.cinema;
    if (!F) return;
    const T = Math.min(1.25, F.tension);
    const rel = wrap(F.bearing - P.yaw);
    cin.frame('fight', {
      bars: 1, yaw: THREE.MathUtils.clamp(rel * 0.55, -0.8, 0.8), pitch: -0.05 - 0.05 * F.airborne, dist: 0.84 - 0.08 * T, fov: -9 - 4 * T,
      roll: -F.leanS * 0.025 + (F.seg.kind === 'thrash' ? Math.sin(F.t * 38) * 0.006 : 0), ease: first ? 6 : 3.2,
    });
    cin.strain = T > 0.85 ? Math.min(1, (T - 0.85) / 0.35) : 0;
  }

  /** The reticle on the fish: what it is doing, and (a beat ahead) what it is about to. */
  updateReticle(dt) {
    const g = this.game, R = this.reticle, cam = g.camera;
    if (this.state === 'fight' && this.fight) {
      const F = this.fight, f = this.hooked, seg = F.seg, nx = F.next;
      const looking = !!nx && seg.t < LOOK;
      const show = looking ? nx : seg;
      const need = show.need;
      const mark = show.kind === 'spent' ? { icon: 'none', color: 0xa8ffcf } : need ? MARKS[need] : { icon: 'dots', color: 0xcfe6e4 };
      const dir = need === 'lean' ? [this.screenSide(show.side, F.bearing) || 1, 0] : (mark.dir || [1, 0]);
      const hot = show.kind === 'thrash' || show.kind === 'splash';
      R.set({
        pos: _w.copy(f.pos).addScaledVector(UP, f.length * 0.05), size: Math.max(0.5, f.length * 0.7),
        color: hot ? 0xff4a3a : need === 'lean' && show.pull > 0.95 ? 0xff9a3c : mark.color, icon: mark.icon, dir,
        lock: looking ? 1 - seg.t / LOOK : 0.15, stam: F.stamina,
      });
    } else if (this.state === 'wait' && this.weir) {
      // a sounded fish that is about to do something: its mind is open for a few seconds
      let best = null;
      for (const f of this.weir.fish) {
        if (f.glowT <= 0 || f.pool !== this.lure?.pool) continue;
        const it = f.intent; if (!it) continue;
        if (!best || it.lock > best.it.lock) best = { f, it };
      }
      if (best) {
        const { f, it } = best;
        R.set({ pos: f.pos, size: Math.max(0.5, f.length * 0.7), color: it.kind === 'bite' ? 0xffd76a : this.aspectColor, icon: it.kind === 'bite' ? 'burst' : 'dots', dir: [1, 0], lock: it.lock, stam: 0 });
      } else R.hide();
    } else R.hide();
    R.update(dt, cam);
  }

  /** The line goes: 'snap' | 'slip' | 'spool' | 'stow'. */
  lose(why) {
    if (this.state === 'fight') return this.escape(why);
    // (a lure with no fish on it: only the line parting)
    this.lure.retrieve(); this.line.hide(); this.settle('lose');
    this.state = 'idle'; this.bite = null; this.biteGlyph?.close(); this.biteGlyph = null;
    sfx.lineSnap(); this.emit('angle.escape', { why, species: null });
  }

  /** Back to the world: the frame, the window and the reticle let go. */
  release() {
    const g = this.game;
    g.cinema.free('fight'); g.cinema.free('catch'); g.cinema.strain = 0;
    g.portrait.hide();
    this.reticle.hide();
  }

  escape(why) {
    const F = this.fight, f = this.hooked, g = this.game;
    if (why === 'snap' || why === 'spool') { sfx.lineSnap(); this.settle('lose'); g.time.pulse('snap', 0.08, 0.14); g.glyphs.pop('bang3', _u.copy(this.P.pos).addScaledVector(UP, 2.1), { color: 0xff5a3c, size: 0.9, burst: true, life: 1.2 }); }
    else if (why === 'slip') { sfx.escape(); this.settle('lose'); g.glyphs.pop('ask', _u.copy(f ? f.pos : this.P.pos).addScaledVector(UP, 0.8), { color: 0x9fb3c8, size: 0.7, life: 1.3 }); }
    else { sfx.escape(); this.settle('refund'); }
    if (f) { f.state = 'flee'; f.timer = 3; f.cool = 20; f.pos.y = Math.min(f.pos.y, this.fight.ctx.pool.surface - 0.5); f.heading += Math.PI; }
    this.emit('angle.escape', { why, species: f?.sp.id ?? null, dur: F ? F.t : 0, stamina: F?.stamina ?? 1 });
    this.lure.retrieve();
    this.line.hide();
    this.hooked = null; this.fight = null; this.state = 'idle'; this.reeling = false;
    this.release();
    this.tool.renderStrip();
  }

  // ---------------------------------------------------------------- the landing
  land() {
    const F = this.fight, f = this.hooked, P = this.P, sp = f.sp, g = this.game;
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
      ans: (F.stats.answered || 0) / Math.max(1, F.stats.needT || 0), // (how much of what it asked for was answered)
      record: rec === undefined ? false : f.cm > rec, depth: this.lure.pool ? this.lure.pool.surface - f.pos.y : 0, legend: !!sp.legend,
    });
    this.echo = { id: sp.id, t: 150 }; // (what is left on the lure: the next cast carries it)
    sfx.catchSong(sp.tier > 3 ? 3 : sp.tier > 2 ? 2 : sp.tier > 1 ? 1 : 0);
    if (sp.legend) sfx.leviathan();
    P.shake = Math.max(P.shake, sp.legend ? 0.8 : 0.2);
    // the beat: time slows as it comes up out of the water, the frame holds, low, and looking up at it
    g.time.pulse('catch', sp.legend ? 0.25 : 0.4, 0.5, { release: 0.6 });
    g.cinema.free('fight');
    g.cinema.frame('catch', { bars: 1, yaw: 0, pitch: 0.16, dist: 0.74, fov: -6, roll: 0, ease: 3 });
    g.cinema.strain = 0;
    this.reticle.hide();
    this.hooked = null; this.fight = null;
    this.tool.renderStrip();
  }

  updateCatch(dt) {
    const P = this.P, C = this.caught, f = C.f, g = this.game;
    this.catchT += dt;
    const k = smooth(0, 0.9, this.catchT);
    // drawn up out of the water and held before her
    const hold = _t.set(P.pos.x + Math.sin(P.yaw) * 1.6, P.pos.y + 1.7, P.pos.z + Math.cos(P.yaw) * 1.6);
    f.pos.lerpVectors(C.from, hold, k);
    f.pos.y += Math.sin(Math.PI * k) * 1.2;
    f.heading = P.yaw * -1 + Math.PI / 2 + this.catchT * 1.1; f.pitch = 0.3 * (1 - k);
    f.speed = 0.6;
    f.state = 'landed'; f.fade = 1;
    const m = f.mesh.group;
    m.position.copy(f.pos); m.rotation.set(0, -f.heading, f.pitch, 'YZX');
    m.scale.setScalar(THREE.MathUtils.lerp(1, Math.min(1.5, 0.7 / Math.max(0.3, f.length) + 0.9), k));
    f.mesh.swim(dt, 0.3, 0);
    f.mesh.glow(1);
    P.bodyYaw += wrap(P.yaw - P.bodyYaw) * (1 - Math.exp(-dt * 6));
    this.drawLine(dt, true);
    if (this.catchT > 2.1) {
      // it comes apart into what it was made of
      const n = Math.round(2 + f.sp.lach * 0.18 * (0.6 + f.cm / f.sp.size[1]));
      this.game.baubles?.spawn(f.pos.clone(), n);
      this.settle('catch');
      const fx = this.game.fx;
      for (let i = 0; i < 26; i++) fx.add.emit({ pos: f.pos.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3), life: 1.2, size: 0.12, sizeEnd: 0.01, color: new THREE.Color(f.sp.color), alpha: 0.9, drag: 2, floor: -100 });
      g.glyphs.pop('star', _u.copy(f.pos).addScaledVector(UP, 0.6), { color: f.sp.color, size: 0.9 + f.sp.tier * 0.12, burst: true, ring: true, life: 1.5 });
      this.game.pool?.gain?.(0);
      this.weir.remove(f);
      this.caught = null; this.state = 'idle'; this.castPhase = 'none';
      this.release();
      this.line.hide();
      this.emit('angle.landed', { species: f.sp.id, baubles: n });
    }
  }

  // ---------------------------------------------------------------- put away
  stow() {
    if (this.state === 'fight') this.escape('stow');
    else if (this.state === 'catch') { this.catchT = 9; this.updateCatch(0.016); }
    if (this.lure?.active) { this.lure.retrieve(); }
    this.settle('refund');
    this.state = 'idle'; this.bite = null; this.biteGlyph?.close(); this.biteGlyph = null; this.castPhase = 'none'; this.castW = 0; this.power = 0; this.line.hide();
    this.marker.visible = false; this.arc.visible = false; this.pressT = -1;
    this.release();
    if (this.weir) this.weir.sound.r = 0;
  }

  // ---------------------------------------------------------------- the line and the marker
  drawLine(dt, catching = false) {
    const lure = this.lure, tool = this.tool, cam = this.game.camera;
    if (!lure) return;
    const t = performance.now() / 1000;
    tool.model.group.updateMatrixWorld(true);
    tool.tip(_t);
    const o = { dt, time: t, aspect: this.aspectColor, camDist: 8, cam: cam.position };
    if (this.state === 'fight' && this.fight) {
      const f = this.hooked;
      const mouth = _e.copy(f.pos).add(_d.set(Math.cos(f.heading), 0, Math.sin(f.heading)).multiplyScalar(f.length * 0.45));
      o.tension = this.fight.tension; o.camDist = cam.position.distanceTo(_w.copy(_t).add(mouth).multiplyScalar(0.5));
      this.line.set(_t, mouth, o);
    } else if (catching && this.caught) {
      o.tension = 0.55; o.camDist = cam.position.distanceTo(this.caught.f.pos);
      this.line.set(_t, this.caught.f.pos, o);
    } else if (lure.active) {
      const end = _e.copy(lure.pos);
      o.camDist = cam.position.distanceTo(_w.copy(_t).add(end).multiplyScalar(0.5));
      if (lure.state === 'air') { o.tension = 0.7; o.helix = Math.max(0.25, 1 - lure.t / lure.T * 0.75); } // (it pays out coiled and uncoils along the cast)
      else o.tension = lure.state === 'reel' ? 0.6 : 0.2 + (this.bite ? 0.4 : 0);
      this.line.set(_t, end, o);
    } else this.line.hide();
  }

  updateMarker(dt, held) {
    const show = this.state === 'charge';
    this.marker.visible = show; this.arc.visible = show;
    if (!show) return;
    this.marker.position.copy(this.aim.point).y += 0.04;
    const s = 0.9 + this.power * 0.6 + 0.08 * Math.sin(performance.now() * 0.01);
    this.marker.scale.setScalar(s);
    const col = this.aim.water ? this.aspectColor : 0x8c6a58;
    this.marker.material.color.setHex(col);
    // the arc the lure will fly (the same lob Lure.cast solves), in motes
    this.tool.model.group.updateMatrixWorld(true);
    this.tool.tip(_t);
    const to = this.aim.point, d = _t.distanceTo(to), T = THREE.MathUtils.clamp(0.42 + d * 0.028, 0.5, 1.5);
    _d.copy(to).sub(_t).multiplyScalar(1 / T); _d.y += 0.5 * G * T;
    const pos = this.arcGeo.attributes.position;
    for (let i = 0; i < this.ARC; i++) {
      const u = (i / (this.ARC - 1)) * T;
      pos.setXYZ(i, _t.x + _d.x * u, _t.y + _d.y * u - 0.5 * G * u * u, _t.z + _d.z * u);
    }
    pos.needsUpdate = true;
    this.arc.material.color.setHex(col);
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
