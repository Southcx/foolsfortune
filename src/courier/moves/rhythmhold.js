// ---------------------------------------------------------------------------
// HELD BY THE RHYTHM MODE (a tech that holds the body while a song is played: music/rhythm/rhythm.js, Wanda's): the rhythm mode has the
// digit keys and Esc; the Courier stands where they began it, the other tools put away, and nothing else they do moves them until the song
// ends. Begun on the first frame the rhythm mode is active and they are standing, as the dialogue holds them (moves/talk.js), and ended
// the frame it stops. Nothing about the core movement changes: when the song is over, the core is exactly as it was.
//
// THE BUSKING BODY: with the Crucibelle worn, it stays in their hands (drawn if it was not, put back after if it was not out before), and
// the body plays the song: the bell held up in its idle (Bell_Idle), the lane's own gesture on every judged press (lanes 1 to 5:
// Bell_Note1-5; the high lanes, 6 to 0: Bell_NoteHigh), the JAM (Bell_Jam, a groove of the whole body) while a rhythm combo runs at ten or
// more, and the fever's peak (Bell_FeverPeak) on every twenty-fifth note of a combo. The presses are read off the rhythm mode, never
// changed: a lane's light (`highway.lit[lane]`) jumps to 1 on each judged press, `litGrade` is its grade (a miss is no press), and
// `judge.combo` is the run.
//
// Prior art: Guitar Hero's and Rock Band's band on stage (the player's character playing what the player plays, a big move at a star
// power), Hatsune Miku: Project DIVA's dancer over the notes, Patapon's fever, and Crypt of the NecroDancer's bounce to the beat.
//
//   new RhythmHold(techs)   (a tech: begins itself while game.rhythm.active; no key)   .bell (the Crucibelle kept in hand, or null)
//   .posed (the Crucibelle the busking body is posed with, until its weight has gone: the bell's own layer steps aside for it)
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from './techs.js';
import { Gestures, Crossfade } from '../../tools/heldclips.js';

const JAM_AT = 10, PEAK_EVERY = 25;

export class RhythmHold extends Tech {
  constructor(mgr) { super(mgr, 'rhythm'); this.blendIn = 8; this.bell = null; this.posed = null; this.lit = new Float32Array(10); this.jamW = 0; this.bt = 0; }
  get enabled() { return true; }
  usable() { return true; }
  /** The hands are taken, unless they hold the bell (the instrument they play: the Crucibelle stays out for it). */
  get handsBusy() { return !this.bell; }
  get blocksFire() { return true; }
  label() { return 'SONG'; }
  canStart() {
    const P = this.P, g = this.game;
    return !!g.rhythm?.active && P.grounded && !P.mantle && !g.god?.controlling && !g.dialogue?.open;
  }
  start() {
    const P = this.P, g = this.game, B = g.belt;
    P.endCore?.(); P.vel.set(0, 0, 0);
    const bell = this.mgr.get('crucibelle');
    this.bell = bell?.enabled && B?.isWorn('crucibelle') !== false ? bell : null;
    this.bellWasOut = !!bell && bell.drawTarget > 0;
    for (const t of B?.tools || []) if (t.id !== 'psygun' && t.id !== 'crucibelle' && t.wants) t.stow();
    if (this.bell) { this.bell.drawTarget = 1; B?.draw(B.get('crucibelle')); this.posed = this.bell; }
    this.lit.fill(0); this.seen = false;
  }
  update(dt) {
    if (!this.game.rhythm?.active) return false;
    const P = this.P;
    P.vel.set(0, -2, 0); P.move(dt);
    if (this.bell) for (const t of this.game.belt?.tools || []) if (t.id !== 'crucibelle' && t.wants) t.stow(); // (nothing else comes out while they play)
    return true;
  }
  end() {
    if (this.bell && !this.bellWasOut) this.bell.drawTarget = 0; // (put back as it was found)
    this.bell = null;
  }

  // ---------------------------------------------------------------- the busking body
  /** The presses since last frame: each lane whose light jumped (a judged press), and its gesture. */
  listen() {
    const R = this.game.rhythm, H = R?.highway, J = R?.judge;
    if (!R?.active || !H?.lit) return;
    for (let l = 0; l < 10; l++) {
      const k = H.lit[l] ?? 0, g = H.litGrade?.[l];
      if (this.seen && k >= 0.99 && k > this.lit[l] + 0.01 && g && g !== 'miss') this.press(l, J?.combo ?? 0);
      this.lit[l] = k;
    }
    this.seen = true;
  }
  press(lane, combo) {
    const peak = combo > 0 && combo % PEAK_EVERY === 0;
    if (peak) this.S.play('Bell_FeverPeak', { from: 0.22, fadeOut: 0.25 });
    else this.S.play(lane >= 5 ? 'Bell_NoteHigh' : `Bell_Note${(lane % 5) + 1}`, { from: 0.05, fadeOut: 0.12 });
  }
  animate(ch, base, dt) {
    const C = ch.clips, g = this.game;
    if (this.w < 0.002 && !this.bell) this.posed = null;
    if (!this.posed || !C.clips.Bell_Idle) return; // (no bell, or no suite: held still, as it always was)
    if (!this.S) { this.S = new Gestures(C); this.X = new Crossfade(C, 0.07); this.A = C.pose(); this.B = C.pose(); }
    this.listen();
    const combo = g.rhythm?.judge?.combo ?? 0;
    this.jamW = THREE.MathUtils.damp(this.jamW, g.rhythm?.active && combo >= JAM_AT ? 1 : 0, 2.5, dt);
    this.bt += dt;
    C.sample('Bell_Idle', this.bt, this.A, true);
    if (this.jamW > 0.001) { C.sample('Bell_Jam', this.bt, this.B, true); C.blend(this.A, this.B, this.jamW); }
    this.S.update(dt);
    const sw = this.S.sample(this.B);
    if (sw > 0) C.blend(this.A, this.B, sw * (1 - 0.35 * this.jamW)); // (in the jam the groove shows through the gestures)
    if (this.S.fresh) { this.X.cut(); this.S.fresh = false; }
    this.X.apply(this.A, dt);
    this.posed.wrist?.(C, this.A);
    C.blend(base, this.A, this.w);
  }
  reset() { this.X?.reset(); }
}
