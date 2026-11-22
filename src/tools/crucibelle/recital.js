// ---------------------------------------------------------------------------------------
// THE COMBAT RECITAL (plain name; South, 2026-11-22: "a 'combat recital' mode where you wield a stringed instrument ... and the Crucibelle
// becomes like a floating amplifier plugged into the guitar via a lachryma-colored cable"): a mode of the Crucibelle, Q while it is
// drawn. The bell leaves the hand and hangs in the air at the Courier's right shoulder, mouth out, as the amplifier; the mandolin-guitar
// (tools/crucibelle/guitar.js) is slung across the chest in its place, the right hand over its soundhole and the left round its neck (two
// light reaches, the clip's arms near already: CLAUDE.md's IK rule); a cable of Lachryma runs from its jack to the bell's crown ring.
//   - The notes (1 to 5 the lower register, 6 to 0 the upper) are the five strings, played through the bell in the guitar's voice
//     (music/band.js guitar), each string shaking and lit in its note's colour, the bell's vent lit with it; on the beat as ever (fever,
//     the songs: tools/crucibelle/songs.js). On the beat a note is also A LICK, a bolt of sound thrown from the amp at the foe.
//   - LMB is the STRUM: a power chord (root, fifth, octave) rung out of the floating bell as a cone of sound, struck at the beat's grace
//     (on the beat: x1.5 and fever), staggering what it hits; strums on the beat step THE STRUM CHAIN (1 to 4, wider and harder), the
//     fourth THE WINDMILL rung all round; LMB held past a strum is FEEDBACK, a beam of sound out of the amp on every beat. The fever's
//     peak here is THE ROCKSTAR MOMENT. (Those four: tools/crucibelle/recitalplay.js, RECITAL_PLAY.)
//   - THE CONCERT BODY: the head nodding, the knees giving, the body swaying with the bar, the neck lifted for the upper register, the
//     lean into a held note, the windmill's arm (tools/crucibelle/recitalbody.js). THE AMP pumps on every beat like a speaker.
//   - Q again, or putting the Crucibelle away, ends the recital and the bell comes back to the hand.
// Events: crucibelle.recital { on, by }, crucibelle.strum { onBeat, hits, chain, windmill, by }; and recitalplay.js's lick, feedback
// and rockstar. The stage's looks (the lights, the bolts, the pyro): vfx/recitallooks.js.
//
// Prior art: Brütal Legend (Eddie Riggs' guitar and its amp-born solos), Guitar Hero's power chord, No More Heroes' and Devil May Cry's
// Nevan (a guitar that fights), Hi-Fi Rush (the blow on the beat), the stage amp's cable as the player's leash, a woofer's cone pumping.
//
//   new Recital(crucibelle)   .on   .toggle()   .strum()   .hold(down, dt)   .note(d, octave, on)   .placed(M) (after the hands)
//   .animate(ch, base, dt)   .update(dt)   .end()   .play (RecitalPlay)   .body (RecitalBody)   .beat (0..1, the amp's pump)   RECITAL
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RecitalGuitar, GUITAR } from './guitar.js';
import { CrucibelleModel } from './model.js';
import { Rope } from '../../vfx/rope.js';
import { RecitalPlay } from './recitalplay.js';
import { RecitalBody } from './recitalbody.js';

export const RECITAL = { pump: 0.07, push: 0.09, power: 0.9, beat: 1.5, cool: 0.28, ampScale: 2.4, amp: [0.85, 1.75, -0.35], key: 'KeyQ' };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _qh = new THREE.Quaternion();

export class Recital {
  constructor(tool) {
    this.tool = tool; this.game = tool.game; this.on = false; this.w = 0; this.cool = 0; this.strumT = 1; this.t = 0;
    this.guitar = new RecitalGuitar(); this.guitar.group.visible = false; this.game.scene.add(this.guitar.group);
    this.amp = new CrucibelleModel(); this.amp.group.scale.setScalar(RECITAL.ampScale); this.amp.group.visible = false; this.game.scene.add(this.amp.group);
    this.cable = new Rope(this.game.scene, { n: 26, sides: 5, radius: 0.011, color: GUITAR.lach, glowColor: GUITAR.lach });
    this.ampPos = new THREE.Vector3(); this.ampSet = false; this.beat = 0;
    this.play = new RecitalPlay(this); this.body = new RecitalBody(this);
  }
  toggle() { if (this.on) this.end(); else this.begin(); }
  begin() { this.on = true; this.ampSet = false; this.game.events?.emit('crucibelle.recital', { on: true, by: 'courier' }); }
  end() { if (!this.on) return; this.on = false; this.play.end(); this.cable.hide(); this.game.events?.emit('crucibelle.recital', { on: false, by: 'courier' }); }

  /** The body's frame: forward, left (the root's), up. */
  frame() { const ch = this.game.character, q = ch.root.getWorldQuaternion(_q); _f.set(0, 0, 1).applyQuaternion(q).setY(0).normalize(); _l.set(1, 0, 0).applyQuaternion(q).setY(0).normalize(); }

  /** After the tool's hands: the guitar slung on the chest and the two hands reached onto it. */
  placed() {
    if (this.w < 0.01) return;
    const ch = this.game.character, G = this.guitar.group;
    this.placedN = (this.placedN || 0) + 1;
    this.body.turn(ch, this.dt || 1 / 60); // (the concert body's turns, before the guitar is hung on the chest and the hands reached)
    this.frame();
    const chest = ch.chestPoint(_a);
    // the guitar's frame: the neck to their left and up 32 degrees (more while the upper register plays), the top facing out and up a little
    const neck = 0.56 + this.body.lift * 0.32;
    _x.copy(_l).multiplyScalar(Math.cos(neck)).addScaledVector(_u, Math.sin(neck)).normalize();
    _z.copy(_f).addScaledVector(_u, 0.15).normalize();
    _y.crossVectors(_z, _x).normalize(); _z.crossVectors(_x, _y).normalize();
    _m.makeBasis(_x, _y, _z); G.quaternion.setFromRotationMatrix(_m);
    G.position.copy(chest).addScaledVector(_u, -0.3).addScaledVector(_f, 0.16).addScaledVector(_l, -0.1);
    G.updateMatrixWorld(true);
    // the hands on it: the strumming one swept down and back by a strum, the fretting one round the neck
    // (the sweep grows with the strum chain's step: a bigger strum, a bigger arm)
    const s = Math.sin(Math.min(1, this.strumT) * Math.PI), big = 1 + 0.35 * Math.max(0, (this.lastChain || 1) - 1);
    this.guitar.strumWorld(_b).addScaledVector(_u, 0.07 - s * 0.16 * big).addScaledVector(_f, s * 0.03 * big).addScaledVector(_l, -s * 0.05 * (big - 1));
    ch.reachHand('R', _b, ch.arm.R.hand.getWorldQuaternion(_qh), this.w * 0.9 * this.body.reachR);
    this.guitar.neckWorld(_b);
    ch.reachHand('L', _b, ch.arm.L.hand.getWorldQuaternion(_qh), this.w * 0.85);
  }

  update(dt) {
    const T = this.tool, P = T.P, out = T.drawT > 0.6;
    if (this.on && (!out || !T.worn)) this.end();
    this.w = THREE.MathUtils.damp(this.w, this.on ? 1 : 0, 10, dt);
    this.t += dt; this.cool -= dt; this.dt = dt; this.strumT = Math.min(1.5, this.strumT + dt * 4);
    const shown = this.w > 0.02;
    this.guitar.group.visible = shown;
    for (const c of T.model.group.children) c.visible = !shown; // (the bell gone from the hand: it is the amp)
    this.amp.group.visible = shown;
    if (!shown) { this.cable.hide(); this.cableOk = false; this.placedN = 0; return; }
    this.guitar.update(dt); this.play.update(dt);
    { const G = T.grid(), b = (T.now() - G.t0) / G.spb, f = b - Math.floor(b); this.beat = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4); } // (the amp's pump: 1 on the beat, smooth)
    // the amp: hung at the right shoulder, behind, bobbing, its mouth turned out the way they face and up a little
    this.frame();
    const A = RECITAL.amp, want = _a.copy(P.pos).addScaledVector(_l, -A[0]).addScaledVector(_u, A[1] + Math.sin(this.t * 1.7) * 0.06).addScaledVector(_f, A[2]);
    if (!this.ampSet) { this.ampPos.copy(want); this.ampSet = true; } else this.ampPos.lerp(want, 1 - Math.exp(-dt * 7));
    const amp = this.amp.group;
    _b.copy(_f).addScaledVector(_u, 0.35).normalize();
    amp.position.copy(this.ampPos).addScaledVector(_b, RECITAL.push * this.beat * this.w); // (pushed out on the beat, a speaker's cone)
    amp.scale.setScalar(RECITAL.ampScale * (1 + RECITAL.pump * this.beat));
    amp.quaternion.setFromUnitVectors(_x.set(1, 0, 0), _b);
    amp.updateMatrixWorld(true);
    this.amp.setFever(T.fever); this.amp.update(dt);
    // the cable: jack to the bell's crown ring, slack, lit
    const jack = this.guitar.jackWorld(_a), crown = _b.set(0, 0, 0).applyMatrix4(amp.matrixWorld);
    // (seeded only once the guitar has been placed on the chest: seeded from where it stood before, at the world's origin, the chain
    //  hung out past the frame for seconds)
    if (!this.cableOk) { if (!this.placedN) { this.cable.hide(); return; } this.cable.reset(jack, crown); this.cableOk = true; }
    this.cable.update(dt, jack, crown, { slack: 0.35, gravity: 5, damp: 0.9, iter: 24, taut: 0.4, glow: GUITAR.lach });
  }

  /** A note: its string plucked and the bell's vent lit (the tool plays the voice); on the beat, a lick thrown (recitalplay.js). */
  note(d, octave = 0, on = false) {
    this.guitar.pluck(d - 1, 1); this.amp.lightVent(d - 1, 1); this.body.played(octave > 0);
    this.game.events?.emit('crucibelle.recital.note', { degree: d, octave, onBeat: on, by: 'courier' }); // (for the stage's looks: the amp's ring)
    this.play.note(d, octave, on);
  }
  /** LMB held: the feedback past a strum (recitalplay.js). */
  hold(down, dt) { if (this.on) this.play.hold(down, dt); }
  /** The fever's peak while plugged in. */
  rockstar() { this.play.rockstar(); }
  /** The concert body's legs, after the tool's layer (the Crucibelle's animate). */
  animate(ch, base, dt) { if (this.w > 0.01) this.body.pose(ch, base, dt); }
  /** The bell's mouth in the world (the notes' and the strum's sound comes out of it). */
  mouth(out) { return this.amp.mouthWorld(out); }

  /** LMB: the power chord out of the floating bell, a cone of sound along the aim. */
  strum() {
    if (this.cool > 0) return;
    const T = this.tool, g = this.game, P = T.P, G = T.grid(), t = T.now(), on = T.offBeat(t, G) < 0.085, sc = T.scaleNow();
    this.cool = RECITAL.cool; this.strumT = 0;
    const S = this.play.strum(on, t, G); this.lastChain = S.windmill ? 4 : S.chain; this.body.played(false);
    for (const [d, oct] of [[0, 0], [4, 0], [0, 12]]) T.guitarVoice(G.root + sc[d] + oct, on ? 0.75 : 0.6, 0.9);
    for (let i = 0; i < 5; i++) this.guitar.pluck(i, 0.8);
    T.beatHit(on, t, G);
    const mouth = this.mouth(new THREE.Vector3()), dir = P.lookDir(new THREE.Vector3()).setY(0).normalize();
    const power = RECITAL.power * S.power * (on ? RECITAL.beat : 1) * (1 + T.fever * 0.5);
    let hits = 0;
    for (const c of g.creatures?.near?.(P.pos, S.range) || []) {
      if (c.ally || !c.alive) continue;
      _a.copy(c.pos).sub(P.pos).setY(0); const d = _a.length(); if (d > S.range) continue;
      if (d > 0.01 && _a.multiplyScalar(1 / d).dot(dir) < Math.cos(S.cone)) continue;
      g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.6), (d > 0.01 ? _a : dir).clone(), power, 'bashed', 'courier');
      g.stun?.add(c, S.stun, { by: 'courier', cause: S.windmill ? 'windmill' : 'strum' }); hits++;
    }
    T.ring(mouth, on ? 0xffd76a : GUITAR.lach, 22 + Math.round(12 * T.fever) + (S.windmill ? 18 : 0), 6);
    g.events?.emit('crucibelle.strum', { onBeat: on, hits, chain: S.chain, windmill: S.windmill, by: 'courier' });
  }
}
