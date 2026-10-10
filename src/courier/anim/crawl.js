// ---------------------------------------------------------------------------------------
// THE CRAWL: on all fours under what the crouch cannot pass (the owner, 2026-10-10: "a proper full-prone crawling animation or two to
// use for situations where crawling is warranted (like under a wall, tight spaces)"). The look only, built ahead of its body: the low
// capsule that lets the Courier under is player.js's (Petra's: docs/handoffs/petra/2026-10-10-from-calissa-crawl.md). Until it sets the
// state below, nothing here plays.
//   THE STATE    s.crawl (truthy: down on all fours) and s.prone (0..1: flat on the belly instead of the hands and knees), on the
//                animation state as s.crouch is; the speed is the capsule's.
//   GETTING DOWN Loco_CrawlEnter (0.67 s: standing to the hands and knees), from its squat (CRAWL.enterFrom.crouch) when crouched;
//                faded in over CRAWL.fade. GETTING UP Loco_CrawlExit, to the crouch's squat (CRAWL.exitTo.crouch) when the body stays
//                low after, or to standing; the crawl's weight fades out over its last CRAWL.fade s. `busy`: the getting up still playing
//                (the capsule should stay low until it is done).
//   THE LOOPS    Loco_Crawl (hands and knees: the posed top, hair included, 1.05 m; 0.29 m/s of its own) and Loco_CrawlProne (the
//                belly: 0.74 m; 0.39 m/s), blended by s.prone on one phase, at the move's speed over theirs: strides to CRAWL.stride
//                times their own, the rest cadence; held where they are when the move stops.
//   THE BODY     while the crawl is on, the gait's feet (the foot IK's planting and locks) and the prowl's head give way to it by its
//                weight: hands, knees and feet are where the clips put them, on flat ground.
//
// Prior art: Metal Gear Solid's crawl (prone from the crouch, its own speed, the camera low; getting up a beat of its own the player
// waits out), and The Last of Us's and Uncharted's crawl spaces (a one-shot down and up framing a loop matched to the move).
//
//   const crawl = new Crawl(ch)
//   crawl.pose(dt, s, gs, base, cr) -> w   lays the crawl over base (gs: the ground speed; cr: the crouch's weight); its weight
//   crawl.w, crawl.busy                     the weight laid; the getting up still playing
//   CRAWL                                   the table
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The crawl's clips and its timing (s), measured on the Courier (docs/ART.md section 10). */
export const CRAWL = {
  knees: 'Loco_Crawl', belly: 'Loco_CrawlProne', enter: 'Loco_CrawlEnter', exit: 'Loco_CrawlExit',
  enterFrom: { stand: 0, crouch: 0.2 }, // (s into Loco_CrawlEnter: its frame 6 is a squat near the crouch's)
  exitTo: { stand: 0.64, crouch: 0.4 }, // (s into Loco_CrawlExit it plays to: standing; its frame 12, a squat)
  fade: 0.15,
  stride: 1.3,
};

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class Crawl {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.w = 0; this.on = false; this.t = 0; this.out = null; this.phi = 0;
    this.p = this.C.pose(); this.p2 = this.C.pose();
    this.speed = Object.fromEntries([CRAWL.knees, CRAWL.belly].map((n) => [n, this.C.clips[n] ? ch.analyseGait(n).speed : 0.3])); // (built with the gait's, before the first frame: it poses the body)
  }

  get busy() { return !!this.out; }

  pose(dt, s, gs, base, cr = 0) {
    const C = this.C, want = !!s.crawl;
    if (!C.clips[CRAWL.knees]) return 0;
    if (want && !this.on) { this.on = true; this.out = null; this.t = cr > 0.5 ? CRAWL.enterFrom.crouch : CRAWL.enterFrom.stand; }
    if (!want && this.on) { this.on = false; this.out = { t: 0, to: cr > 0.5 ? CRAWL.exitTo.crouch : CRAWL.exitTo.stand }; }
    if (!this.on && !this.out) { this.w = 0; return 0; }
    // the loop, on its own phase at the move's speed
    const prone = THREE.MathUtils.clamp(s.prone || 0, 0, 1), sp = this.speed;
    const own = THREE.MathUtils.lerp(sp[CRAWL.knees], sp[CRAWL.belly], prone), dur = THREE.MathUtils.lerp(C.clips[CRAWL.knees].dur, C.clips[CRAWL.belly]?.dur ?? 1, prone);
    const ratio = gs / Math.max(0.05, own), stride = THREE.MathUtils.clamp(Math.sqrt(ratio), 0.8, CRAWL.stride);
    this.phi = (this.phi + (ratio / stride / dur) * dt) % 1;
    const pose = C.sample(CRAWL.knees, this.phi * C.clips[CRAWL.knees].dur, this.p);
    if (prone > 0.001 && C.clips[CRAWL.belly]) C.blend(pose, C.sample(CRAWL.belly, this.phi * C.clips[CRAWL.belly].dur, this.p2), prone);
    // getting down: the enter clip over the loop until its end
    if (this.on) {
      const e = C.clips[CRAWL.enter];
      this.t += dt;
      if (e && this.t < e.dur) C.blend(pose, C.sample(CRAWL.enter, this.t, this.p2, false), 1 - smooth(e.dur - CRAWL.fade, e.dur, this.t));
      this.w = Math.min(1, this.w + dt / CRAWL.fade);
    } else {
      // getting up: the exit clip from its start, the crawl's weight out over its last fade
      const o = this.out;
      o.t += dt;
      if (C.clips[CRAWL.exit]) C.blend(pose, C.sample(CRAWL.exit, Math.min(o.t, o.to), this.p2, false), smooth(0, CRAWL.fade * 0.5, o.t));
      this.w = 1 - smooth(o.to - CRAWL.fade, o.to, o.t);
      if (o.t >= o.to) { this.out = null; this.w = 0; return 0; }
    }
    C.blend(base, pose, this.w);
    return this.w;
  }
}
