// ---------------------------------------------------------------------------------------
// THE AWAKENING'S LOOK: a feeling learned is a moment, not a notice (the owner, 2026-10-11; docs/plans/FEELINGS-AWAKENING.md section 3).
// The moment's timing and its glitch are Petra's (feedback/awakening.js); this is what it looks like, two things:
//
//   THE FLOOD   on `feeling.wake { feeling, how, by }` (progress/feelings.js: once per feeling, ever) that feeling's heavy weather
//               (vfx/weather.js, the heavy look) breaks out round the Courier, wherever they stand, indoors too, and ebbs: in 0.5 real
//               seconds, held to 3.5, gone by 4.8. A second set of the weather's own falling pieces (its streaks, motes and fog lenses:
//               the same programs, nothing compiled) in a short column centred on the Courier (12 m round, from 2.5 m under their
//               feet to 8 m over them), following them, so it falls in a room as on the sand: its own overhead map is cast from just
//               over their head, so a room's floor is what it lands on, not its roof. In an open place the sky takes it too
//               (`weatherLook.surge`: the aurora, the bows, the bolts, the grade, the camera's own column).
//   THE BODY    on `feeling.embody { feeling, by }` (said by feedback/awakening.js once the Courier is free: out of any fight, any
//               tech, on their feet) the Courier's own clip for that feeling (courier/anim/feelingclips.js), played by the emote tech
//               as an emote is: moving fades it out, so nothing interrupts the core movement.
//
// It never hides a fight's danger: nothing within 3.5 m of the Courier, the middle of the screen kept clear (the pieces' `uClear`),
// and a third as much while a fight is on or a creature has noticed them (game.combat, a creature's memory: what the HUD ring asks,
// vfx/hudring.js). No words (the log line is Espada's), no sound (the feeling's phrase is Wanda's), no glitch (Petra's pulses it).
//
// Prior art: Breath of the Wild's memories (the world falls away round Link and the moment plays where he stands), Okami's brush
// techniques (each learned in a staged scene, the world flooded with that god's colour and weather), Journey's set pieces (wordless:
// the moment is the reward), Inside Out's core memories (a feeling born of an event that is that feeling), and Final Fantasy X's
// summons, whose arrival changes the sky over the field for a few seconds and gives it back.
//
//   game.awakeningLook = new AwakeningLook(game)   .update(rawDt, camera) (each frame)   .flood(feeling, { how, k }) (the look alone:
//   the /awaken command and the sheets; nothing learned, nothing counted)   .on (a flood running)   FLOOD (its timing and sizes)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Overhead } from './overhead.js';
import { LOOK, fallsOf, makeRain, makeMotes, rainTo, motesTo, mistTo } from './weather.js';
import { feelingClipId } from '../courier/anim/feelingclips.js';

/** The flood's timing (real seconds) and sizes. */
export const FLOOD = {
  rise: 0.5, hold: 3.0, ebb: 1.3, // (in over, held for, then out over: 4.8 real seconds in all)
  box: [12, 10.5, 3.5], // (the column round the Courier: radius, height, how far under its centre (a metre over their feet) it reaches)
  rain: 2400, motes: 2000, lenses: 360, // (each piece's pool: the column is a fifteenth of the weather's, so a share of its counts fills it)
  share: { rain: 0.45, motes: 0.7, mist: 1 }, // (how much of the weather's own count the burst draws: dense round the Courier, never a wall)
  size: 1.4, // (the drifting motes a little bigger in the burst: they are near, and a room has no sky to hold them)
  up: { wonder: 0.7 }, // (the burst's own lean: Wonder's ice rises round them, m/s, as if the room had no ceiling; the weather's sinks)
  clear: [0.34, 0.5], // (the clear middle of the screen, its radius in screen heights: calm, and while a fight is on)
  danger: 0.65, // (how much lighter while a fight is on or something has noticed them)
  count: 0.85, // (the count way's flood, a little quieter than the feat's: the plan's "quieter, but still an awakening")
};
const smooth = THREE.MathUtils.smoothstep;

export class AwakeningLook {
  constructor(game) {
    this.game = game;
    this.cur = null; this.t = 0; this.dz = 0; this.made = false;
    game.events?.on?.('feeling.wake', (e) => { if (e?.by === 'courier' && LOOK[e.feeling]) this.flood(e.feeling, { how: e.how }); });
    game.events?.on?.('feeling.embody', (e) => { if (e?.by === 'courier' && LOOK[e.feeling]) this.embody(e.feeling); });
  }
  get on() { return !!this.cur; }

  /** The flood alone: nothing learned, nothing counted (k: how heavy, 1 the heavy look in full). */
  flood(feeling, { how = 'feat', k = how === 'count' ? FLOOD.count : 1 } = {}) {
    if (!LOOK[feeling]) return false;
    if (!this.made) this.make();
    const P = this.game.player?.pos || _c.set(0, 0, 0);
    this.cur = { feeling, k, t: 0, open: this.game.weather?.here?.(P)?.exposure === 'open' }; // (open: lit by the hour as the weather is; in a room, its own lamps)
    this.over.fill(P); // (the floor under the whole column at once: the first frame falls where it should)
    this.dz = this.danger();
    return true;
  }

  /** The body's answer: the feeling's clip, by the emote tech (feedback/awakening.js has waited till the Courier is free). */
  embody(feeling) { return this.game.techs?.get?.('emote')?.request?.(feelingClipId(feeling)) ?? false; }

  /** The burst's pieces, made the first time a feeling wakes (the weather's own programs: nothing new is compiled). */
  make() {
    this.made = true;
    this.group = new THREE.Group(); this.group.name = 'awakening'; this.group.userData.zoneFree = true; this.group.visible = false;
    this.game.scene?.add(this.group);
    this.over = new Overhead(this.game, { n: 24, cell: 1.25, from: 2.4 }); // (from just over the head: the floor of a room, not its roof)
    this.rain = makeRain(FLOOD.rain, this.over.u); this.motes = makeMotes(FLOOD.motes, this.over.u); this.mist = makeMotes(FLOOD.lenses, this.over.u);
    this.mist.u.uMode.value = 3; this.mist.u.uNoise.value = 1.2;
    for (const P of [this.rain, this.motes, this.mist]) { P.u.uBox.value.fromArray(FLOOD.box); this.group.add(P.obj); }
    this.mist.u.uBox.value.x = 14; // (the lenses lie a little wider than the column)
  }

  /** Where the burst is centred: a metre over the Courier's feet. */
  centre() { const p = this.game.player?.pos; return _c.set(p?.x || 0, (p?.y || 0) + 1, p?.z || 0); }

  /** How much of a fight is on round the Courier, 0..1: the fight's heat, or a creature that has noticed them within 30 m. */
  danger() {
    const g = this.game, P = g.player; let d = g.combat?.engaged ? Math.max(0.6, g.combat.heat || 0) : 0;
    if (!P) return d;
    for (const c of g.creatures?.list || []) {
      if (!c.alive || c.ally) continue;
      const aware = c.mem?.fact?.(P)?.aware; if (!(aware >= 0.2)) continue; // (a fact not yet weighed reads NaN: not noticed)
      if (Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z) < 30 && Math.abs(c.pos.y - P.pos.y) < 10) d = Math.max(d, aware);
    }
    return Math.min(1, d);
  }

  update(dt, camera) {
    this.t += dt;
    const F = this.cur, W = this.game.weatherLook;
    if (!F) return;
    F.t += dt;
    const end = FLOOD.rise + FLOOD.hold + FLOOD.ebb;
    if (F.t >= end || !camera) { this.cur = null; this.group.visible = false; W?.surge(null); return; }
    const env = F.t < FLOOD.rise ? smooth(F.t, 0, FLOOD.rise) : F.t < FLOOD.rise + FLOOD.hold ? 1 : 1 - smooth(F.t, FLOOD.rise + FLOOD.hold, end);
    this.dz += (this.danger() - this.dz) * (1 - Math.exp(-dt * 4)); // (eased: a creature noticing them dims it over a quarter second, never a pop)
    const k = F.k * env * (1 - FLOOD.danger * this.dz), a = F.feeling;
    W?.surge(a, k); // (the sky and the camera's own column, where the place is open)
    // the burst round the Courier: the weather's own pieces, at the heavy look's counts and sizes, a share of them
    const c = this.centre(), sky = this.game.weather?.sky?.(), dayK = smooth(sky?.light ?? 0.6, 0.3, 0.6), wind = this.game.dunes?.wind?.dir || null;
    const f = fallsOf(a, k, dayK, wind), L = LOOK[a], S = FLOOD.share, clear = THREE.MathUtils.lerp(FLOOD.clear[0], FLOOD.clear[1], this.dz);
    this.group.visible = true;
    const R = f.rain, M = f.motes, I = f.mist, lit = F.open ? 0.18 + 0.82 * smooth(sky?.light ?? 0.6, 0.1, 0.6) : 0.85; // (the stones and the fog take the light they are in)
    if (R) { R.n *= S.rain; R.lowK = 1; rainTo(this.rain, R, _col.copy(R.colour || L.colour).multiplyScalar((L.tone ?? 1) * (R.lit ? lit : 1))); } // (in the burst all of it near the ground: the column is short)
    if (M) { M.n *= S.motes; M.lowK = 1; if (M.mode === 0) M.size *= FLOOD.size; if (FLOOD.up[a] && M.mode === 0) M.vel[1] = FLOOD.up[a]; motesTo(this.motes, M, _col.copy(M.colour || L.colour).multiplyScalar((M.raw ? 1 : L.tone ?? 1) * (M.lit ? lit : 1))); }
    if (I) { I.n *= S.mist; mistTo(this.mist, I, _col.copy(I.colour).multiplyScalar(lit), wind); }
    this.rain.obj.visible = !!R && R.alpha > 0.005; this.motes.obj.visible = !!M && M.alpha > 0.005; this.mist.obj.visible = !!I && I.alpha > 0.005;
    this.over.update(this.game.player.pos, 40); // (the floor round them kept fresh as they move)
    const px = 480 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); // (the scene is drawn at 480 lines)
    for (const P of [this.rain, this.motes, this.mist]) { P.u.uT.value = this.t; P.u.uCam.value.copy(c); P.u.uClear.value.set(clear, 1); if (P.u.uPx) P.u.uPx.value = px; }
  }

  dispose() {
    this.game.weatherLook?.surge(null);
    if (!this.made) return;
    this.over.dispose(); this.group.parent?.remove(this.group);
    for (const P of [this.rain, this.motes, this.mist]) { P.obj.geometry.dispose(); P.obj.material.dispose(); }
  }
}
const _c = new THREE.Vector3(), _col = new THREE.Color();
