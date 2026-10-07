// ---------------------------------------------------------------------------------------
// THE VESSEL SHATTERS: the Courier's death, and the way back. When a blow lands on clay already cracked through (courier/vessel/damage.js),
// time all but stops; the cracks run over the whole vessel at once, Lachryma burning in every line, as the Courier sinks to a knee; then
// it bursts, a cloud of shards and light, and the frame smears (the PS2's frame accumulation: render/glow.js) as the pieces fall and the
// screen goes dark. The Courier is made whole again at the last Shrine they rested at (the workshop's, where they were made, until
// another: world/shrines.js): the cracks gone, the pool full. Nothing is lost
// but the place (in a Well, they come to at its mouth and the run's haul is lost: world/well/dunemaw.js). Each half is an event
// (`courier.shatter`, `courier.reform`) for the log and the ledger.
//
// Prior art: Halo's death cam (the body left in the world and the camera drawing back from it), Okami's and Ico's soft fade to black,
// the PS2's feedback blur (Silent Hill 2's dream frames, MGS2's and Burnout's trails: the last frame fed back into the next), Dark Souls'
// "YOU DIED" as a moment the game stops for (here without words: CLAUDE.md, the log says it), and a pot's own end, which is to shatter.
//
//   game.death = new Death(game)   .begin({ why, by, region })   .update(rawDt)   .active
//   DeathTech (courier/moves/techs.js list, first): holds the body while it happens: the blow (UAL Hit_Chest), then down into the
//   suite's defeat (Emote_DefeatEnter, then its loop: a slump to the knees, the head bowed) when the social pack is in, else the UAL kneel
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../moves/techs.js';
import { sfx } from '../../audio/sfx.js';
import { clearShot } from '../../core/shotclear.js';
import { stream } from '../../core/rng.js';
const simRand = stream('courier/vessel/death'); // (the simulation's chance: core/rng.js, the same twice)

const CRACK = 1.15, BURST = 1.2, DARK = 2.7, REFORM = 3.6, END = 4.6; // (the beats, in real seconds)
const LACH = 0xb49be6;
/** The body's beats (real s): the blow until `knee`, crossfaded over `blend` into the defeat (or the kneel), played at `rate`. */
const DEFEAT = { enter: 'Emote_DefeatEnter', loop: 'Emote_DefeatLoop', knee: 0.35, blend: 0.12, rate: 1.4, kneelRate: 1.6 };
const _p = new THREE.Vector3(), _l = new THREE.Vector3();

export class Death {
  constructor(game) {
    this.game = game; this.active = false; this.t = 0; this.yaw = 0;
    this.fade = Object.assign(document.createElement('div'), { id: 'deathfade' });
    this.fade.style.cssText = 'position:fixed;inset:0;background:#07030b;opacity:0;pointer-events:none;z-index:9;transition:none';
    document.body.appendChild(this.fade);
  }

  begin({ why = 'blow', by = 'environment', region = null } = {}) {
    const g = this.game, P = g.player;
    if (this.active || !P) return;
    this.active = true; this.t = 0; this.burst = false; this.reformed = false;
    this.at = P.pos.clone(); this.yaw = P.yaw;
    if (g.techs?.active && g.techs.active.id !== 'death') g.techs.stop?.();
    this.want = true; // (DeathTech takes the body on the next step)
    g.events?.emit('courier.shatter', { why, by, region }); // (not vessel.shatter: that is the god hand's jar, godhand/godhand.js)
    sfx.vesselCrack?.(1, region || 'torso');
  }

  update(raw) {
    if (!this.active) return;
    const g = this.game, P = g.player, D = g.vesselDamage, post = g.post;
    this.t += raw;
    const t = this.t, mid = _l.copy(this.at).setY(this.at.y + 0.95);
    // the cracks run over all of it, Lachryma burning in them
    if (t < BURST && D) { const k = Math.min(1, t / CRACK); for (let i = 0; i < D.crack.length; i++) D.crack[i] = Math.max(D.crack[i], k); }
    if (t < BURST) {
      g.time?.slow('death', 0.18);
      if (Math.floor(t * 7) !== Math.floor((t - raw) * 7)) sfx.vesselCrack?.(Math.min(1, 0.4 + t), ['mask', 'torso', 'armL', 'armR', 'legL', 'legR'][Math.floor(simRand() * 6)]);
    } else if (t < REFORM) g.time?.slow('death', 0.45); // (home again, the world runs at its own pace as the dark lifts)
    // the camera: in close, circling as it cracks; drawn up and back as it bursts
    const a = this.yaw + Math.PI + 0.6 + t * 0.35, r = t < BURST ? 2.4 - t * 0.5 : 1.8 + (t - BURST) * 2.2, h = t < BURST ? 1.2 : 1.2 + (t - BURST) * 1.6;
    _p.set(this.at.x + Math.sin(a) * r, this.at.y + h, this.at.z + Math.cos(a) * r);
    // (only until the reform: a shot set after it would hold the camera at the place of death once the Courier is home)
    if (t < REFORM) {
      clearShot(g, mid, _p); // (never inside a wall)
      g.cinema?.shot('death', { pos: _p, look: mid, fov: t < BURST ? -10 + t * 4 : -4, bars: 1, ease: t < BURST ? 3 : 2, roll: t < BURST ? -0.04 * t : 0.04 });
    }
    // the smear: the frame fed back into itself, harder once it bursts
    if (post?.accum && t < REFORM) Object.assign(post.accum, t < BURST ? { amt: 0.45 * Math.min(1, t / 0.5), zoom: 0.004, spin: 0.002 } : { amt: 0.88, zoom: 0.012, spin: 0.006 });
    // it bursts
    if (!this.burst && t >= BURST) {
      this.burst = true;
      const fx = g.fx, up = new THREE.Vector3(0, 1, 0);
      g.character?.setHidden(true);
      fx?.shatterBurst?.(mid.clone(), 2.4, up, { dust: 3, chips: 5 });
      fx?.chipsOff?.(mid.clone(), up, 40, 2.2);
      fx?.toneBurst?.(mid.clone(), LACH, 1, 2.2);
      fx?.toneBurst?.(mid.clone().setY(mid.y + 0.5), 0xffd76a, 1, 1.4);
      fx?.glitter?.([mid.clone(), mid.clone().setY(mid.y + 0.6), mid.clone().setY(mid.y - 0.5)], mid.clone(), up, new THREE.Color(LACH));
      sfx.shatter?.(3, 1, 'porcelain'); sfx.vesselCrack?.(1, 'mask');
      g.time?.pulse?.('death', 0.02, 0.12);
      P.shake = Math.max(P.shake || 0, 0.6);
    }
    // dark, then the workshop
    this.fade.style.opacity = String(t < DARK ? 0 : t < REFORM ? (t - DARK) / (REFORM - DARK) : Math.max(0, 1 - (t - REFORM) / (END - REFORM)));
    if (!this.reformed && t >= REFORM) {
      this.reformed = true;
      if (g.cinema?.cut) g.cinema.cut('death'); else g.cinema?.unshot('death'); // (a cut: the place changed under the shot, and an ease back would fly the camera across the island)
      if (post?.accum) post.accum.amt = 0;
      g.time?.free('death');
      D?.mendAll(true);
      const course = g.course;
      // the last Shrine rested at (world/shrines.js; the workshop's until another); shattered in a Well, the run is lost first
      // (world/well/dunemaw.js), and its mouth is where they come to only if there are no Shrines
      // (a wipe in the great cavern's fight is not a lost run: the Lip Stone, `keep`, before any Shrine: world/well/dunemaw.js wipe)
      const well = g.well?.reformAt?.(), shrine = well?.keep ? null : g.shrines?.reformAt?.(), at = shrine || well;
      if (at && g.places?.stand(at.pos, at.yaw)) { /* (into its zone first: world/places.js) */ } else if (course?.teleport) course.teleport(at ? at.pos : P.spawn.clone(), at ? at.yaw : 0);
      g.character?.setHidden(false);
      g.lachryma?.reset();
      this.want = false;
      g.events?.emit('courier.reform', { where: shrine ? 'shrine' : well?.keep ? 'lip' : well ? 'well' : 'workshop', shrine: shrine ? g.shrines.last : null, lost: !!well && !well.keep, by: 'courier' });
    }
    if (t >= END) { this.active = false; this.fade.style.opacity = '0'; g.cinema?.unshot('death'); g.time?.free('death'); }
  }
}

/** Holds the body while the vessel shatters: no input, no movement, and the Courier sinking to a knee. */
export class DeathTech extends Tech {
  constructor(mgr) { super(mgr, 'death'); this.blendIn = 12; }
  get enabled() { return true; }
  usable() { return true; }
  get overrides() { return 1; }
  get handsBusy() { return true; }
  label() { return 'SHATTERED'; }
  canStart() { return !!this.game.death?.want; }
  start() {
    const P = this.P;
    P.endCore?.(); P.vel.set(0, 0, 0);
    this.defeat = undefined;
    void this.game.clipPack?.social; // (asks for the social pack, the defeat's: in by now if anything fetched it, else ready for the next)
    for (const t of this.game.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow();
  }
  update(dt) {
    const P = this.P;
    P.vel.set(0, Math.min(P.vel.y, 0) - 9 * dt, 0); P.move(dt);
    return !!this.game.death?.want;
  }
  animate(ch, base) {
    const C = ch.clips, t = this.game.death?.t || 0, D = DEFEAT;
    // the blow taken, then down as the cracks run: the suite's defeat if its pack is in (decided once, at the knee), else the kneel
    const hit = C.clips.hitChest ? C.sample('hitChest', Math.min(t * 1.4, (C.clips.hitChest.dur || 0.6) - 0.01), ch.P.tmp, false) : null;
    if (hit) C.blend(base, hit, this.w);
    if (t < D.knee - D.blend) return;
    if (this.defeat === undefined) this.defeat = !!(C.clips[D.enter] && C.clips[D.loop]);
    const u = Math.max(0, t - (D.knee - D.blend)), k = Math.min(1, u / D.blend);
    let down = null;
    if (this.defeat) {
      const e = C.clips[D.enter], at = u * D.rate;
      down = at < e.dur ? C.sample(D.enter, at, ch.P.tmp2, false) : C.sample(D.loop, at - e.dur, ch.P.tmp2, true);
    } else if (C.clips.kneel) down = C.sample('kneel', Math.min(u * D.kneelRate, (C.clips.kneel.dur || 1) - 0.01), ch.P.tmp2, false);
    if (down) C.blend(base, down, this.w * k * k * (3 - 2 * k));
  }
  faceYaw() { return this.game.death?.yaw ?? null; }
}
