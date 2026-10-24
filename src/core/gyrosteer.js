// ---------------------------------------------------------------------------------------
// GYRO STEERING (docs/plans/MOBILE.md 9, M5: "gyro steering as an option", Mario Kart Tour's): on a phone, the Solar Skiff steered by
// turning the phone as a wheel, a setting (`tech.skiff.gyro`, off by default; the settings' `gyro` row). What is read is gravity's
// direction in the screen's plane (devicemotion's accelerationIncludingGravity, low-passed): the change of its angle from where it lay
// as the ride began is the wheel's turn, so it holds whichever way the phone is held (sideways either way, upright) and on either
// platform's sign (iOS reports the vector negated: the change of its angle is the same). Lying flat (gravity through the screen) the
// phone has no wheel to turn, and the tilt steers nothing until it is raised; turned past GYRO.turned (the phone turned round, not
// steered) it steers nothing, and held there GYRO.settle real s, straight ahead is where it lies now.
// The tilt is fed to the touch stick's own StickMove as a sideways push (core/touchdriver.js), so the board reads exactly what a thumb
// gives it: the analog steer, and A / D past the stick's dead zone (the grind's balance, a bail's aftertouch). A thumb pushing the stick
// steers instead; in the air nothing is tilted (A / D there are the spin: a tilt held through a hop must not spin the board); the sail,
// the brake, the carve and the tricks keep their own controls.
// iOS asks for motion access only inside a tap: the settings switch's tap asks at once, and with the switch kept on from before, the
// first touch lifted after a load asks. A refusal turns the switch off and is said in the log (gyro.refused); a page that hears no
// motion at all (a desk, or a frame that does not pass the sensors on) turns it off too and says so (gyro.unheard).
//
// Prior art: Mario Kart Tour's gyro steering (optional, the phone the wheel, the drift still a touch); Asphalt's tilt steering, centred
// where the phone lies at the start; the W3C DeviceMotion spec and iOS 13's DeviceMotionEvent.requestPermission (asked inside a tap).
//
//   const G = new GyroSteer(game, input)   G.steer(thumbSteers) -> -1..1 | null (null: the tilt steers nothing now)   G.gesture()
//   G.stop()   GYRO     Events: gyro.refused { why, by }   gyro.unheard { by }
// ---------------------------------------------------------------------------------------
import { T } from './config.js';
import { STICK } from './stickmove.js';

/** dead / full: the wheel's turn, degrees from straight ahead, under which it steers nothing / at which it steers fully (past `dead` it
 *  starts at the stick's own least push, STICK.dead, as a thumb's does); flat: under this share of gravity in the screen's plane the
 *  phone lies too flat to read; turned: degrees past which the phone is being turned round, not steered; settle: real s held there
 *  before straight ahead is taken again; ease: real s, the low-pass on gravity (a hand's tremble, a tap's jolt); stale: real s with no
 *  reading before the tilt lets go; unheard: real s listening with no reading before that is said; tries: taps asked in that did not
 *  count as a tap before the asking stops. */
export const GYRO = { dead: 3, full: 25, flat: 0.35, turned: 90, settle: 1, ease: 0.08, stale: 0.5, unheard: 2, tries: 3 };
const DEG = 180 / Math.PI;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const now = () => performance.now();

export class GyroSteer {
  constructor(game, input) {
    this.game = game; this.input = input;
    this.g = null; this.at = 0; // (gravity low-passed, in the device's own axes; when it was last heard, ms)
    this.neutral = null; this.awayAt = 0; // (the angle straight ahead, rad; since when the phone has been turned round)
    this.listening = false; this.asking = false; this.tries = 0; this.since = 0; this.unheardSaid = false;
    this.onMotion = (e) => this.motion(e);
    this.onTurn = () => { this.neutral = null; }; // (the screen turned round: straight ahead is where the phone lies now)
    game.events?.on('setting.change', (e) => { if (e.id !== 'gyro') return; if (e.value) this.gesture(); else this.stop(); }); // (the switch's own tap: iOS asks in it)
  }
  get wanted() { return !!T.tech.skiff?.gyro; }
  /** Whether motion access is asked for inside a tap (iOS 13 and after). */
  get asks() { return typeof globalThis.DeviceMotionEvent?.requestPermission === 'function'; }

  /** A tap (a touch lifted, the settings switch): where motion access must be asked, it is asked now. */
  gesture() {
    if (!this.wanted || this.listening || this.asking) return;
    if (!this.asks) { this.listen(); return; }
    this.asking = true;
    const fail = () => { this.asking = false; if (++this.tries >= GYRO.tries) this.refuse('error'); }; // (asked outside a tap: tried again at the next)
    let p; try { p = globalThis.DeviceMotionEvent.requestPermission(); } catch { fail(); return; }
    Promise.resolve(p).then((r) => { this.asking = false; if (r === 'granted') { this.tries = 0; this.listen(); } else this.refuse(r || 'denied'); }, fail);
  }
  refuse(why) {
    this.game.events?.emit('gyro.refused', { why, by: 'courier' });
    this.off();
  }
  /** The switch turned off (refused, or nothing heard): the settings row shows it, and the switch's change stops the listening. */
  off() { if (this.game.settings) this.game.settings.set('gyro', false); else T.tech.skiff.gyro = false; }
  listen() {
    if (this.listening || typeof globalThis.addEventListener !== 'function') return;
    globalThis.addEventListener('devicemotion', this.onMotion);
    globalThis.addEventListener('orientationchange', this.onTurn); globalThis.screen?.orientation?.addEventListener?.('change', this.onTurn);
    this.listening = true; this.since = now(); this.unheardSaid = false;
  }
  /** Motion no longer listened to (the switch off): nothing is read, nothing kept. */
  stop() {
    if (!this.listening) return;
    globalThis.removeEventListener?.('devicemotion', this.onMotion);
    globalThis.removeEventListener?.('orientationchange', this.onTurn); globalThis.screen?.orientation?.removeEventListener?.('change', this.onTurn);
    this.listening = false; this.g = null; this.at = 0; this.neutral = null;
  }
  motion(e) {
    const a = e?.accelerationIncludingGravity; if (!a || a.x == null || a.y == null || a.z == null) return;
    const t = now(), dt = this.at ? Math.min(0.1, (t - this.at) / 1000) : 0; this.at = t;
    if (!this.g) { this.g = { x: a.x, y: a.y, z: a.z }; return; }
    const k = 1 - Math.exp(-dt / GYRO.ease), g = this.g;
    g.x += (a.x - g.x) * k; g.y += (a.y - g.y) * k; g.z += (a.z - g.z) * k;
  }
  /** Gravity's angle in the screen's plane (rad), or null: unheard a while, or the phone lying too flat to read. */
  angle() {
    const g = this.g; if (!g || now() - this.at > GYRO.stale * 1000) return null;
    const xy = Math.hypot(g.x, g.y), all = Math.hypot(xy, g.z);
    if (!(all > 1) || xy / all < GYRO.flat) return null;
    return Math.atan2(g.y, g.x);
  }

  /** Once a frame from the touch driver: the steer the tilt gives now, -1 (left) to 1 (right), or null where the tilt steers nothing
   *  (off, not riding on touch, in the air, a thumb pushing the stick, the phone flat, turned round or unheard). */
  steer(thumbSteers) {
    if (!this.wanted) { this.stop(); return null; }
    if (!this.listening && !this.asks) this.listen(); // (no asking needed: heard at once)
    const L = this.game.actions?.live?.();
    if (this.input.device !== 'touch' || !L?.has('skiff')) { this.neutral = null; return null; }
    if (this.listening && !this.g && !this.unheardSaid && now() - this.since > GYRO.unheard * 1000) { this.unheardSaid = true; this.game.events?.emit('gyro.unheard', { by: 'environment' }); this.off(); return null; }
    const a = this.angle(); if (a == null) return null;
    if (this.neutral == null) { this.neutral = a; this.awayAt = 0; } // (as the ride begins: where the phone lies is straight ahead)
    const d = wrap(a - this.neutral) * DEG, m = Math.abs(d);
    if (m > GYRO.turned) { const t = now(); if (!this.awayAt) this.awayAt = t; else if (t - this.awayAt > GYRO.settle * 1000) { this.neutral = a; this.awayAt = 0; } return null; }
    this.awayAt = 0;
    if (thumbSteers || L.has('skiff.air')) return null;
    if (m < GYRO.dead) return 0;
    return Math.sign(d) * (STICK.dead + (1 - STICK.dead) * Math.min(1, (m - GYRO.dead) / (GYRO.full - GYRO.dead)));
  }
}
