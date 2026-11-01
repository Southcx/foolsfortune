// ---------------------------------------------------------------------------------------
// THE FIGHTER KIT (docs/plans/FIGHTER.md; South, 2026-10-31: "all the other SSBM-like and platform fighter mechanics to include a shield
// and grab and beyond ... Go wild!"): the Arena's platform fighter, on in the Arena only and taken off whole on leaving it, a modifier
// over the core movement with a source you can see (the Arena itself, and the percent's tag over the Courier in the pool's place).
// It puts together:
//   the fighters   the Courier (fighter/courierbody.js over the Player) and one to three straw fighters (foebody.js, foemind.js), each a
//                  fighter of the one kernel (kernel.js), stepped at the fixed rate through the frame's hooks (wellframe.js: `pre`, the
//                  claim's `step`, `post`)
//   the hits       every active box against every body of the other side, the grabs, the shots (hits.js); what a hit was said by an
//                  event, shown by the house's hit effects, heard by its damage sounds
//   the keys       the Arena's own (keys.js), the drawn body's key poses and hitlag's freeze and shake (pose.js)
//   the match      three stocks each; a KO past a blast line, the platform back in, two real s invincible; every foe's stocks taken,
//                  the stage cleared (the room's rank: time, hits taken, the longest string); the Courier's taken, the match again
//   the lecterns   the foes' level (1 to 9), how many (1 to 3), training (stand, shield, jump: no stocks lost, the boxes shown, the
//                  last move's frame data on a tag), the percent reset
//   the camera     Smash's: framing every fighter in play, zoomed out as they spread
// Events (each with `by`; the tracking is Dovina's, feedback/tracking/strawmanwell.js): well.verb (the Arena row's verbs, through the
// room's `verb`), well.fighter.hit { move, damage, percent, on, foe, result, by }, well.fighter.ko { stage, percent, foe, by },
// well.fighter.stock { stage, left, cause, by: 'courier' }.
//
// Prior art: Super Smash Bros. Melee (the match, the stocks, the respawn platform, the camera, UnclePunch's training), the house's
// stage modules (stagemods.js) and techs (one owner of the step at a time, given back as it was).
//
//   const K = new FighterKit(well)   K.build(stage, into)   K.enter()   K.leave()   K.on   K.pre(dt)   K.post(dt)   K.update(dt)   K.camera(dt)
//   K.spots() -> [{ ref, pos, x }]   K.use(ref) -> bool   K.courier (its fighter)   K.foes   K.level   K.count   K.training   K.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shieldstun } from '../../../progress/platformfighter.js';
import { sfx } from '../../../audio/sfx.js';
import { Fighter } from './kernel.js';
import { go, moveOf } from './fighterstate.js';
import { takeHit } from './kernelhurt.js';
import { tryLedge } from './kernelholds.js';
import { FighterHits } from './hits.js';
import { ArenaKeys } from './keys.js';
import { CourierBody } from './courierbody.js';
import { CourierPose } from './pose.js';
import { StrawFighter } from './foebody.js';
import { FighterLooks } from './looks.js';
import { BODY, KIT } from './moves.js';

export const TRAINING = ['off', 'stand', 'shield', 'jump'];
const CAM = { lift: 1.3, look: 0.5, min: 12, max: 32, k: 0.85, base: 9, ease: 4, fov: 52 };
const _look = new THREE.Vector3(), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);

export class FighterKit {
  constructor(well) {
    this.well = well; this.game = well.game; this.on = false; this.level = 3; this.count = 1; this.training = 'off';
    this.keys = new ArenaKeys(this.game.input); this.body = new CourierBody(this); this.pose = new CourierPose(this);
    this.foes = []; this.courier = null; this.stage = null; this.cam = null; this.cleared = false; this.lastMove = null;
    this.env = {
      verb: (F, id) => { if (F.who === 'courier') this.well.verb(id); },
      tryLedge: (F, tether) => tryLedge(F, this.stage.ledges, tether),
      shot: (F) => this.hits.shoot(F),
      struck: (A, V, hit, res) => this.struck(A, V, hit, res),
      broke: (V) => { if (V.lastBy?.who === 'courier') this.well.verb('shieldBreak'); },
      floorGap: (F) => this.floorGap(F),
    };
  }

  /** The Arena laid (stages/arena.js): its shapes, ledges, blast lines and spawns; the straw fighters made, waiting. */
  build(stage, into) {
    this.stage = stage; this.into = into;
    this.looks = new FighterLooks(into); this.looks.z = stage.z;
    this.hits = new FighterHits({ struck: (A, V, hit, res, s) => this.struck(A, V, hit, res, s), shotLook: (s) => this.looks.shotLook(s), bounds: { x0: stage.blast.x0, x1: stage.blast.x1 } });
    for (let i = 0; i < 3; i++) this.foes.push(new StrawFighter(this, i, { stage, into }));
    for (const f of this.foes) f.show(false);
  }
  get active() { return this.foes.slice(0, this.count); }
  get all() { return [this.courier, ...this.active.map((f) => f.F)].filter(Boolean); }

  // ------------------------------------------------------------------------------------------- on and off
  enter() {
    if (this.on || !this.stage) return;
    const g = this.game, P = g.player, W = this.well.frame;
    this.on = true; this.keys.on();
    W.claim = { step: (dt) => this.body.step(dt), isDown: (c) => (c === 'ShiftLeft' ? this.body.run : c === 'ShiftRight' ? false : undefined), faceLock: true };
    const t = this.pose.tech(P); if (P.techs && !P.techs.list.includes(t)) P.techs.add(t);
    P.techs?.active && P.techs.stop(); P.endCore?.();
    if (g.character) this.pose.warm(g.character);
    this.courier = new Fighter({ id: 'courier', team: 0, who: 'courier', stats: this.body.stats(), h: P.height, r: 0.3, env: this.env });
    this.courier.size = BODY;
    this.start();
  }
  leave() {
    if (!this.on) return;
    const g = this.game, P = g.player;
    this.on = false; this.keys.off();
    if (this.well.frame.claim) this.well.frame.claim = null;
    const t = this.pose.t, L = P.techs?.list; if (t && L) { const i = L.indexOf(t); if (i >= 0) L.splice(i, 1); }
    this.pose.lift(g.character); g.character?.setHidden?.(false);
    this.hits?.clear(); for (const f of this.foes) f.show(false);
    for (const L2 of this.stage?.ledges || []) L2.by = null;
    this.looks?.update([], { z: this.stage?.z ?? 0 }); for (const T of this.looks?.tags?.values() || []) T.s.visible = false;
    this.looks?.frameData(null, new THREE.Vector3());
    this.courier = null; this.cam = null;
  }
  /** The kit off if the Arena is no longer where the Courier is (left by a door, a seam, the hub): the pose tech's tick asks each frame. */
  watch() {
    const W = this.well;
    if (this.on && (W.stage?.id !== 'arena' || !W.frame.on || !W.built)) this.leave();
  }

  /** The match from the top: three stocks each, the Courier on the left, the foes on the right, everyone at 0%. */
  start() {
    const St = this.stage, C = this.courier, S = this.well.stage;
    this.cleared = false; this.hits.clear(); this.restartT = 0;
    for (const L of St.ledges) L.by = null;
    C.stocks = 3; C.stale = []; C.respawnAt(St.spawn[0], St.top); C.face = 1;
    this.body.setDown(St.spawn[0], St.top + 0.05); this.game.character?.setHidden?.(false);
    this.foes.forEach((f, i) => {
      const on = i < this.count; f.show(on);
      f.F.stocks = 3; f.F.stale = []; f.F.respawnAt(St.foeSpawns[i], St.top); f.F.face = -1; f.F.grounded = true;
      if (!on) f.F.st = 'out';
    });
    if (S && S.id === 'arena') { S.t0 = this.game.events?.time ?? 0; S.hits = 0; S.string = 0; S.cleared = false; }
  }

  // ------------------------------------------------------------------------------------------- the fixed step
  pre() { if (!this.on) return; this.pose.lift(this.game.character); this.body.pre(); }
  post() {
    if (!this.on) return;
    this.body.post();
    for (const f of this.active) { if (!f.F.live && f.F.st !== 'dead') continue; const I = f.think(); f.F.step(I); f.move(I); }
    this.hits.resolve(this.all);
    for (const F of this.all) this.blast(F);
    this.match();
  }

  /** Past a blast line: a KO (a stock gone; none in training), and out a beat before the platform. */
  blast(F) {
    if (!F.live || F.st === 'dead' || F.st === 'respawn') return;
    const B = this.stage.blast; if (F.x >= B.x0 && F.x <= B.x1 && F.y >= B.y0 && F.y <= B.y1) return;
    const g = this.game, credit = F.lastBy && F.now - F.lastAt <= KIT.credit * 60 ? F.lastBy : null, percent = Math.round(F.percent);
    if (this.training === 'off') F.stocks--;
    if (F.victim) { F.victim.holder = null; go(F.victim, 'air'); F.victim = null; }
    if (F.holder) { F.holder.victim = null; go(F.holder, 'idle'); F.holder = null; }
    if (F.ledge) { F.ledge.by = null; F.ledge = null; }
    const at = new THREE.Vector3(THREE.MathUtils.clamp(F.x, B.x0 + 3, B.x1 - 3), THREE.MathUtils.clamp(F.y, B.y0 + 3, B.y1 - 3), this.stage.z);
    g.vfx?.play?.('blow.finisher', { pos: at, dir: new THREE.Vector3(Math.sign(F.x - this.stage.mid) || 1, 0, 0), power: 2 });
    if (!sfx.arenaHit) sfx.damage?.('impact', 1); // (a placeholder until Wanda's Arena sounds are in: they answer the events themselves)
    if (F.who === 'courier') {
      g.events?.emit('well.fighter.stock', { stage: 'arena', left: Math.max(0, F.stocks), cause: credit ? 'creature' : 'environment', by: 'courier' });
      g.character?.setHidden?.(true);
    } else {
      const by = credit?.who === 'courier' ? 'courier' : 'environment';
      g.events?.emit('well.fighter.ko', { stage: 'arena', percent, foe: F.id, by });
      if (by === 'courier') this.well.verb('stock');
    }
    F.stale = []; go(F, 'dead'); F.vx = F.vy = F.kvx = F.kvy = 0; F.hl = 0; F.launch = null;
  }

  /** The match's beats: back in on the platform, out of stocks, the clear, the match again. */
  match() {
    const St = this.stage, C = this.courier;
    for (const F of this.all) {
      if (F.st !== 'dead' || F.f < KIT.dead) continue;
      if (F.stocks <= 0) { go(F, 'out'); continue; }
      const x = St.mid, y = St.top + KIT.respawnUp;
      F.respawnAt(x, y); F.st = 'respawn'; F.grounded = false; F.intan = 2;
      if (F === C) { this.body.setDown(x, y); this.game.character?.setHidden?.(false); }
    }
    if (C.st === 'out') { if ((this.restartT += 1) > KIT.dead) this.start(); return; }
    if (!this.cleared && this.training === 'off' && this.active.every((f) => f.F.st === 'out')) { this.cleared = true; this.well.clear(); }
  }

  /** How far over the stage's floor under it a fighter is (Infinity over the void): the stage's own shapes. */
  floorGap(F) {
    const St = this.stage; let best = Infinity;
    for (const T of [...St.solids.map((B) => ({ x0: B.x0, x1: B.x1, y: B.top })), ...St.thins]) if (F.x >= T.x0 && F.x <= T.x1 && F.y >= T.y - 0.05) best = Math.min(best, F.y - T.y);
    return best;
  }

  /** A hit landed (hits.js, kernelholds.js): said, shown and heard. */
  struck(A, V, hit, res) {
    const g = this.game, z = this.stage.z, side = Math.sign(V.x - A.x) || A.face;
    const pos = new THREE.Vector3(V.x - side * V.r * 0.6, V.y + (V.size ?? V.h) * 0.55, z + 0.3), dir = new THREE.Vector3(side, 0.3, 0);
    g.events?.emit('well.fighter.hit', { move: hit.move, damage: hit.damage, percent: Math.round(V.percent), on: V.who === 'courier' ? 'courier' : 'foe', foe: V.who === 'courier' ? A.id : V.id, result: res, by: A.who === 'courier' ? 'courier' : 'creature' });
    const weight = hit.damage < 6 ? 'light' : hit.damage < 13 ? 'heavy' : 'finisher';
    if (res === 'hit') {
      g.vfx?.play?.(V.who === 'courier' ? 'hit.blunt' : 'hit.blunt.straw', { pos, dir, power: Math.min(2, hit.damage / 8) });
      g.vfx?.play?.(`blow.${weight}`, { pos, dir, power: 1 });
      if (!sfx.arenaHit) sfx.damage?.('impact', Math.min(1, hit.damage / 15));
    } else { g.vfx?.play?.('hit.shot', { pos, dir, power: 0.6 }); if (!sfx.arenaHit) sfx.damage?.('impact', 0.3); }
    if (A.who === 'courier') {
      if (res === 'hit') {
        V.combo = V.inCombo ? (V.combo || 1) + 1 : 1; this.well.noteString(V.combo); if (V.combo >= 3) this.well.verb('string');
        const St = this.stage; if (V.x < St.x0 || V.x > St.x1 || V.y < St.top - 0.3) this.well.verb('edgeguard');
        const fo = this.foes.find((f) => f.F === V); fo?.model?.hit?.(pos, dir, Math.min(2, hit.damage / 8)); fo?.model?.flinch?.();
      }
      this.note(hit, res);
    } else if (V.who === 'courier' && res === 'hit') {
      this.well.hit();
      g.character?.hurt?.flinch?.(Math.min(1, hit.damage / 14), [side, 0.2, 0]);
    }
  }
  /** A blow from outside the kit on a straw fighter (foebody.js's creature): taken as a kit hit. */
  outside(F, A, hit) { const res = takeHit(F, A, hit); if (res !== 'miss') this.struck(A || F, F, hit, res); }

  /** The training tag's frame data: the Courier's last move (Melee's on-shield advantage, shieldstun less the frames left after the hit). */
  note(hit, res) {
    const m = moveOf(hit.move); if (!m) return;
    const adv = shieldstun(hit.damage) - (m.total - m.startup);
    this.lastMove = [`${m.name.toUpperCase()}  ${hit.damage}%${res === 'shield' ? '  (shield)' : ''}`, `startup ${m.startup}f  active ${m.active[0]}-${m.active[1]}  total ${m.total}f`,
      `${m.landing ? `landing ${m.landing}f  ` : ''}on shield ${adv >= 0 ? '+' : ''}${adv}f`];
  }

  // ------------------------------------------------------------------------------------------- each render frame
  update(dt) {
    if (!this.on) return;
    this.keys.frame();
    const z = this.stage.z;
    for (const f of this.foes) if (f.model.group.visible || f.F.live) f.look(dt);
    this.looks.update(this.all, { boxes: this.training !== 'off', z });
    for (const f of this.foes.slice(this.count)) { const T = this.looks.tags.get(f.F); if (T) T.s.visible = false; }
    this.pose.shake(this.game.character);
    const L = this.stage.lecterns.train;
    this.looks.frameData(this.training !== 'off' ? this.lastMove || ['TRAINING', 'strike a straw fighter: its numbers show here'] : null, new THREE.Vector3(L.x, this.stage.top + 4.2, z - 1));
  }

  /** Smash's camera: every fighter in play framed, zoomed out as they spread, held inside the blast lines. */
  camera(dt) {
    if (!this.on) return;
    const g = this.game, cam = g.camera, St = this.stage, pts = this.all.filter((F) => F.live && F.st !== 'dead');
    if (!pts.length) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const F of pts) { x0 = Math.min(x0, F.x); x1 = Math.max(x1, F.x); y0 = Math.min(y0, F.y); y1 = Math.max(y1, F.y + 1.6); }
    const span = Math.max(x1 - x0, (y1 - y0) * 1.9), want = {
      x: THREE.MathUtils.clamp((x0 + x1) / 2, St.blast.x0 + 8, St.blast.x1 - 8), y: THREE.MathUtils.clamp((y0 + y1) / 2, St.top - 2, St.top + 14),
      d: THREE.MathUtils.clamp(CAM.base + span * CAM.k, CAM.min, CAM.max) };
    const k = !this.cam ? 1 : 1 - Math.exp(-CAM.ease * (dt || 0.016));
    this.cam ||= { ...want };
    for (const key of ['x', 'y', 'd']) this.cam[key] += (want[key] - this.cam[key]) * k;
    cam.position.set(this.cam.x, this.cam.y + CAM.lift, St.z + this.cam.d);
    _look.set(this.cam.x, this.cam.y + CAM.look, St.z);
    _m.lookAt(cam.position, _look, _up); cam.quaternion.setFromRotationMatrix(_m);
    cam.fov = CAM.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }

  // ------------------------------------------------------------------------------------------- the lecterns
  /** What F would act on here: the lecterns, unless a foe is close (a fight is not the time). */
  spots() {
    const St = this.stage, C = this.courier; if (!this.on || !C) return [];
    if (this.training === 'off' && this.active.some((f) => f.F.live && Math.abs(f.F.x - C.x) < 4 && f.F.st !== 'out')) return [];
    return Object.entries(St.lecterns).map(([id, L]) => ({ ref: `arena.${id}`, pos: new THREE.Vector3(L.x, St.top + 2.2, St.z - 1.2), x: L.x, y: St.top }));
  }
  use(ref) {
    if (!ref?.startsWith?.('arena.')) return false;
    const id = ref.slice(6);
    if (id === 'level') this.level = (this.level % 9) + 1;
    else if (id === 'foes') this.count = (this.count % 3) + 1;
    else if (id === 'train') this.training = TRAINING[(TRAINING.indexOf(this.training) + 1) % TRAINING.length];
    else if (id === 'reset') { if (this.training !== 'off') { for (const F of this.all) F.percent = 0; return true; } }
    else return false;
    this.stage.plates?.();
    this.start();
    return true;
  }
  plateText() { return { level: ['LEVEL', String(this.level)], foes: ['FOES', String(this.count)], train: ['TRAINING', this.training.toUpperCase()], reset: ['RESET', this.training !== 'off' ? 'the percents' : 'the match'] }; }

  dispose() {
    this.leave();
    for (const f of this.foes) f.dispose();
    this.foes = []; this.hits?.clear(); this.looks?.dispose(); this.looks = null; this.stage = null;
  }
}
