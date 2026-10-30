// ---------------------------------------------------------------------------------------
// THE DUEL'S SHOW (plain name; South, 2026-10-29: "punching up the cut ins, stingers, and anything else in the duel module ... Get very
// JRPG with it. Campy ... You can play with the position and scale of the pneuka jar and the Abberant as you see fit. Use as much
// cinematography as you can to illustrate the action and what you want me to see"): the two fighters made actors and the camera made a
// director's, over the board's own beats, a PvE duel's only.
//   THE CAST       the aberrant drawn bigger for its fight (SHOW.foeScale) and the Pneuka Jar bigger at your spot (SHOW.jarScale): two
//                  fighters squared up across the tsuitate; both put back at the close
//   THE VS OPEN    the camera cut close and low on the aberrant as its band tears in from the right with its name, cut to the Jar as
//                  yours tears in from the left, VS slammed between them (stamps.js), then pulled out to the arena and the board
//   THE ACTING     each fighter answers the beats with its body: a push of the Line your way the Jar lunging at it and the aberrant
//                  flinching back (white sparks off its head), a push its way the other round; its skill's cast a lunge of its own; junk
//                  landing on your half the Jar rocked; a duel's break its side knocked back hard; your big moves the Jar hopping as it
//                  pours
//   THE CUTAWAYS   the camera leaves the board for the moments that are the fight's (stage.js `cine`): a low two-shot on a big push or a
//                  break, held a beat and back; the death circled slowly and low round the aberrant; then the hero shot, low on the Jar as
//                  it hops and spins with the film's confetti thrown up round it (no words: the log says you won)
// Programs: the bursts', the cut-ins' and the stamps': nothing new.
// Prior art: Pokemon's battle intro (the trainer slides in, the foe's sprite flashes), Street Fighter's VS screen, Final Fantasy's victory
// pose and its fanfare's cut to the party, Persona 5's All-Out Attack two-shot, Dragon Quest's enemy flinch, Kingdom Hearts' Drive cut,
// Puzzle Fighter's fighters acting out the board under it.
//
//   const S = new DuelShow(view)   S.open(state, foe) (before the elites)   S.event(e) (stage.js)   S.update(dt)   S.cineShot(kind, u, out) (a cutaway's shot)
//   S.victory() -> real s (the death's tail: duelview.js)   S.close()   SHOW (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { filmColour } from '../oxidation.js';
import { sfx } from '../../audio/sfx.js';
import { domainHex } from './powercast.js';
import { sm, clamp01 } from './layout.js';

/** foeScale, jarScale: the fighters' sizes in a PvE duel; vs: its open's beats (real s from the open) and its length; lunge and flinch
 *  (real s and m); cine: the cutaways' lengths (real s); victory: the hero shot's length; confetti: its bits. */
export const SHOW = {
  foeScale: 1.2, jarScale: 1.15, margin: 1.1, front: 1,
  vs: { foe: 0.15, jar: 0.75, stamp: 1.05, pull: 1.55, dur: 2.5 },
  lunge: { out: 0.1, back: 0.34, amp: 0.42 }, flinch: { dur: 0.5, amp: 0.38 }, knock: { dur: 0.8, amp: 0.8 },
  cine: { hit: 0.95, big: 2 }, victory: 1.15, confetti: 46,
};
const NAMES = { wisp: 'LANTERN WISP', slipjelly: 'SLIP JELLY' };
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _d = new THREE.Vector3(), _e = new THREE.Vector3();

export class DuelShow {
  constructor(view) { this.view = view; this.game = view.game; this.on = false; this.t = 0; this.acts = { jar: null, foe: null }; this.off = { jar: new THREE.Vector3(), foe: new THREE.Vector3() }; this.wrote = new THREE.Vector3(); }

  get margin() { return SHOW.margin; }
  get front() { return SHOW.front; } // (+1 when the Jar's face looks along its group's +Z: the cut-in's portrait and the cutaways read it) // (the arena's shot opened wider for the bigger fighters: stage.js arenaShot)

  /** The duel opened: the fighters sized, the VS begun (a PvE duel's only). Before the elites take the foe's scale as theirs. */
  open(state, foe) {
    this.close(); this.on = state?.style === 'pve'; if (!this.on) return;
    this.t = 0; this.foe = foe; this.vsStep = 0; this.won = null;
    if (foe?.root) { this.foeScale0 = foe.root.scale.clone(); foe.root.scale.multiplyScalar(SHOW.foeScale); }
    const J = this.view.dive?.jar; if (J) { this.jarScale0 = J.group.scale.clone(); J.group.scale.multiplyScalar(SHOW.jarScale); this.jar = J; }
    this.view.stage.introT = SHOW.vs.dur;
  }

  close() {
    if (this.foe?.root && this.foeScale0) this.foe.root.scale.copy(this.foeScale0);
    if (this.jar && this.jarScale0) this.jar.group.scale.copy(this.jarScale0);
    this.unAct(); this.foe = null; this.jar = null; this.foeScale0 = null; this.jarScale0 = null; this.on = false;
    if (this.view.stage) this.view.stage.introT = null;
  }

  /** The VS's beats on its clock: the bands, the cuts, the stamp. */
  vs() {
    const V = this.view, S = SHOW.vs, t = this.t;
    if (this.vsStep === 0 && t >= S.foe) { this.vsStep = 1; const f = this.foe; V.stage?.cutAway('vsFoe', S.jar - S.foe + 0.15, { cut: true }); V.auras?.charge(1, { dur: S.jar - S.foe + 0.3 }); V.cutIn?.vs?.(NAMES[f?.kind] || (f?.name || '').toUpperCase(), null, 0.3); V.stage?.jolt?.(0.25); }
    if (this.vsStep === 1 && t >= S.jar) { this.vsStep = 2; V.jarCut?.vs?.('', filmColour(0.3, _c).getHex(), 0.66); V.stage?.cutAway('vsJar', S.pull - S.jar, { cut: true }); V.auras?.charge(0, { dur: S.pull - S.jar + 0.3 }); V.stage?.jolt?.(0.25); }
    if (this.vsStep === 2) V.seeding?.go?.(Math.max(0, S.pull - 0.1 - t)); // (the board dealt in as the camera pulls out to it: seeding.js)
    if (this.vsStep === 2 && t >= S.stamp) { this.vsStep = 3; V.stamps?.stamp('VS', { size: 0.26, y: 0.5, x: 0.5, tilt: -0.12, life: 0.6, spin: 1.4 }); V.stage?.jolt?.(0.5); V.game.glitch?.pulse?.({ split: 0.06, tear: 0.03, dur: 0.15 }); }
  }

  /** An event as the beats play it (stage.js): the fighters act, and the big ones cut away to. */
  event(e) {
    if (!this.on) return; const V = this.view;
    switch (e.type) {
      case 'line': { const d = Math.sign((e.line ?? 0) - (V.lineCol ?? e.line ?? 0)) || (e.side === 0 ? 1 : -1), far = Math.abs((e.line ?? 0) - (V.lineCol ?? 0));
        if (d > 0) { this.act('jar', 'lunge'); this.act('foe', 'flinch'); this.spark(); } else { this.act('foe', 'lunge'); this.act('jar', 'flinch'); }
        if (far >= 2) { V.stage?.whip?.('push'); V.stage?.cutAway('hit', SHOW.cine.hit); } break; }
      case 'foe.skill': this.act('foe', 'lunge'); V.auras?.charge(1, { dur: 1.7 }); break;
      case 'foe.desperate': this.act('foe', 'lunge'); V.auras?.charge(1, { dur: 2.6, big: true }); break;
      case 'turn': V.auras?.charge(e.side ? 1 : 0, { dur: 0.7, chant: false }); break;
      case 'land': if (e.side === 0 || (e.at && e.at[0] < (V.lineCol ?? 0))) this.act('jar', 'flinch', 0.5); break;
      case 'duelBreak': if (e.side === 1) { this.act('jar', 'lunge'); this.act('foe', 'knock'); this.spark(2); } else { this.act('foe', 'lunge'); this.act('jar', 'knock'); }
        V.stage?.cutAway('hit', SHOW.cine.big); break;
      case 'power': if (e.side == null || e.side === 0) { this.act('jar', 'hop'); V.auras?.charge(0, { hex: domainHex(e.domain), dur: 1.8 }); } break;
      case 'skill': if (e.side == null || e.side === 0) { this.act('jar', 'hop'); V.auras?.charge(0, { dur: 1.0, chant: false }); } break;
      case 'duel.finisher': this.act('jar', 'hop'); V.auras?.charge(0, { hex: 0xffd36a, dur: 2.8, big: true }); V.stage?.cutAway('hit', SHOW.cine.big); break;
      default: break;
    }
  }

  /** A body's act begun: 'lunge' at the other, 'flinch' back from it, 'knock' back hard, 'hop' up on the spot. */
  act(who, kind, k = 1) { if (who === 'jar' && !this.jarShown()) return; this.acts[who] = { kind, t: 0, k }; }
  jarShown() { return !!(this.jar && this.jar.group.visible && this.view.dive?.shown === 'hand'); }
  spark(k = 1) { const V = this.view, at = V.foeCast?.head?.(new THREE.Vector3()); if (!at) return; V.bursts?.burst?.(at, 0xffffff, Math.round(10 * k), { speed: 1.6 * k, life: 0.3, fall: 0, spread: 0.2, size: 0.03 }); V.bursts?.burst?.(at, 0xffd36a, Math.round(6 * k), { speed: 1.1, life: 0.4, fall: 2, size: 0.02 }); }

  /** An act's offset this frame along `u` (toward the other fighter: + is at it), and its lift. */
  offset(A, out) {
    const t = A.t; let x = 0, y = 0;
    if (A.kind === 'lunge') { const L = SHOW.lunge; x = L.amp * (t < L.out ? sm(t / L.out) : 1 - sm(clamp01((t - L.out) / L.back))); A.done = t > L.out + L.back; }
    else if (A.kind === 'flinch') { const F = SHOW.flinch, f = clamp01(t / F.dur); x = -F.amp * A.k * Math.exp(-f * 5) * (1 - f) * (1 + 0.35 * Math.sin(t * 70)); A.done = f >= 1; }
    else if (A.kind === 'knock') { const K = SHOW.knock, f = clamp01(t / K.dur); x = -K.amp * Math.sin(Math.PI * Math.min(1, f * 1.6)) * (1 - f * 0.5) * (f < 0.62 ? 1 : 1 - sm((f - 0.62) / 0.38)); y = 0.18 * Math.sin(Math.PI * Math.min(1, f * 2.2)); A.done = f >= 1; }
    else if (A.kind === 'hop') { const f = clamp01(t / 0.42); y = 0.32 * Math.sin(Math.PI * f); A.done = f >= 1; }
    return out.set(x, y, 0);
  }

  /** The acts written onto the bodies: the Jar's group at your spot plus its offset; the foe's root moved by its offset (rebased when
   *  its own body has placed it since). */
  update(dt) {
    if (!this.on) return; const V = this.view, W = this.game.aberrantWipe;
    if (W?.active && W.covered && this.vsStep === 0) { V.stage.introT = V.stage.t + SHOW.vs.dur; return; } // (the encounter's wipe first: the VS opens as it shatters away)
    if (!this.t) sfx.duelVs?.(); // (the VS's t 0, as the wipe shatters away: Wanda's cue, timed to SHOW.vs)
    this.t += dt; if (this.t < SHOW.vs.dur + 0.1) this.vs();
    for (const who of ['jar', 'foe']) { const A = this.acts[who]; if (!A) continue; A.t += dt; this.offset(A, _a); if (A.done) { this.acts[who] = null; _a.set(0, 0, 0); }
      const dir = who === 'jar' ? 1 : -1, o = _b.copy(V.u).setY(0).normalize().multiplyScalar(_a.x * dir).addScaledVector(UP, _a.y);
      if (who === 'jar') { if (this.jarShown()) { V.dive.spot(_d); this.jar.group.position.copy(_d).add(o); } }
      else this.moveFoe(o);
    }
    if (this.won) this.hero(dt);
  }

  moveFoe(o) {
    const r = this.foe?.root; if (!r) return;
    if (!r.position.equals(this.wrote)) this.off.foe.set(0, 0, 0); // (its body placed it since: the offset starts from there)
    r.position.sub(this.off.foe).add(o); this.off.foe.copy(o); this.wrote.copy(r.position);
  }

  unAct() {
    this.acts.jar = this.acts.foe = null; const r = this.foe?.root; if (r && r.position.equals(this.wrote)) r.position.sub(this.off.foe); this.off.foe.set(0, 0, 0);
    if (this.jarShown()) this.view.dive.standJar(false);
  }

  /** The death's tail (duelview.js death): the hero shot on the Jar, hopping and spinning, the film's confetti thrown up. Its length. */
  victory() {
    if (!this.on || !this.jarShown()) return 0;
    sfx.duelHero?.(); // (the hero shot's fanfare: Wanda's, timed to SHOW.victory)
    this.won = { t: 0, yaw: this.jar.group.rotation.y, thrown: 0 }; this.view.stage?.cutAway('hero', SHOW.victory + 0.2, { cut: true });
    return SHOW.victory;
  }
  hero(dt) {
    const W = this.won, J = this.jar, V = this.view; W.t += dt; if (!J) return; const f = clamp01(W.t / SHOW.victory);
    V.dive.spot(_d); J.group.position.copy(_d).addScaledVector(UP, Math.abs(Math.sin(f * Math.PI * 2)) * 0.45 * (1 - f * 0.3));
    J.group.rotation.y = W.yaw + sm(clamp01(f * 1.4)) * Math.PI * 2;
    const want = Math.floor(f * 3) + 1; while (W.thrown < Math.min(3, want)) { W.thrown++; const at = V.frame.worldToLocal(_e.copy(_d).addScaledVector(UP, 0.9));
      for (let i = 0; i < SHOW.confetti / 3; i++) V.bursts?.burst?.(at, filmColour(i * 0.13 + W.thrown, _c).getHex(), 2, { speed: 2.6, life: 1.1, fall: 2.2, spread: 0.45, size: 0.075 }); }
    if (f >= 1) { J.group.rotation.y = W.yaw; this.won = null; }
  }

  /** A cut's shot (stage.js): `kind` at `u` (0..1 through it) into out.pos and out.look (the world); an aberrant's data drain's own two
   *  ('aberrantDrain', 'jarGulp') are its (duelview/aberrantdrain.js). */
  cineShot(kind, u, out) {
    if (kind === 'aberrantDrain' || kind === 'jarGulp') return this.view.aberrantDrain?.shot?.(kind, u, out) || null; // (an aberrant's data drain's two shots: aberrantdrain.js)
    const V = this.view, g = this.game, face = V.face, uu = _a.copy(V.u).setY(0).normalize();
    const jar = g.player?.pos ? _b.copy(g.player.pos) : _b.copy(V.centre).addScaledVector(uu, -2), foe = V.foe?.pos ? _d.copy(V.foe.pos) : _d.copy(V.centre).addScaledVector(uu, 2);
    const head = V.foeCast?.headWorld?.(_e) || _e.copy(foe).setY(foe.y + 1.2), fs = SHOW.foeScale;
    if (kind === 'vsFoe') { const dir = new THREE.Vector3().copy(face).addScaledVector(uu, -0.9).normalize(), d = 1.9 * fs - 0.3 * u;
      out.look.copy(head).addScaledVector(UP, -0.15); out.pos.copy(head).addScaledVector(dir, d).addScaledVector(UP, -0.35); out.fov = -8; return out; }
    const jy = this.won?.yaw ?? this.jar?.group.rotation.y ?? 0, front = new THREE.Vector3(Math.sin(jy), 0, Math.cos(jy)).multiplyScalar(this.front); // (the way the Jar faces as it stands at its spot)
    if (kind === 'vsJar') { const dir = new THREE.Vector3().copy(front).addScaledVector(face, 0.5).normalize(), d = 2.1 - 0.35 * u, top = jar.y + 0.75 * SHOW.jarScale;
      out.look.copy(jar).setY(top); out.pos.copy(jar).addScaledVector(dir, d).setY(jar.y + 0.35); out.fov = -8; return out; }
    if (kind === 'hit') { const mid = new THREE.Vector3().copy(jar).lerp(foe, 0.5), span = jar.distanceTo(foe);
      out.look.copy(mid).setY(mid.y + 0.75).addScaledVector(uu, 0.25 * span * (u - 0.5)); out.pos.copy(mid).addScaledVector(face, span * 0.62 + 1.2).addScaledVector(uu, -span * 0.18).setY(mid.y + 0.3); out.fov = 4; out.roll = -0.05; return out; }
    if (kind === 'death') { const a = -0.55 + 0.7 * u, dir = new THREE.Vector3().copy(face).applyAxisAngle(UP, a), d = 3.1 * fs;
      out.look.copy(head).addScaledVector(UP, -0.4); out.pos.copy(foe).addScaledVector(dir, d).setY(foe.y + 0.45); out.fov = -4; return out; }
    if (kind === 'hero') { const dir = new THREE.Vector3().copy(front).addScaledVector(face, 0.6).normalize(), d = 2.3 + 0.4 * u;
      out.look.copy(jar).setY(jar.y + 0.85 * SHOW.jarScale); out.pos.copy(jar).addScaledVector(dir, d).setY(jar.y + 0.12); out.fov = -2; out.roll = 0.04; return out; }
    return null;
  }
}
