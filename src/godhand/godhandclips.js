// ---------------------------------------------------------------------------------------
// THE HAND'S CLIPS: the god hand played from its own 32 actions (source_assets/Courier/courier_godhand.blend, the owner's: spawn, idle,
// spiritFingers, grab, grabHold, release, pinch, pull, point, poke, flick, pat, slam, chop, punch, slap, backhand, block, scoop,
// beckon, shoo, wave, snap, crush, fistClench, count, fingerGun, thumbsUp, thumbsDown, okSign, peace, vanish), on its own mixer
// (courier/anim/rigclips.js). The clips own every bone, the travel and the squash on `godhand_root` included; nothing writes the
// fingers after them but the joint limits (rom.js GODHAND_ROM, learned from these clips: none of their frames is clamped). The hand's
// place in the world stays godhand.js's (placeHand: the group, its bob and its dip) and the garden's (world/garden/hand.js pose).
//
// Which clip plays is read each frame from whichever mode is drawing the hand (casebook rule 58): in the world, the art in use and
// what is under the cursor (godhand.js, arts.js); in the Spirit Garden, the art, the stroke and what is held (world/garden/hand.js).
// The moments come off the bus: an art chosen snaps, a grab grabs, a throw releases, a cut chops, a catch bound crushes; in the
// garden a pet pats, a flick flicks, an undo backhands, a planetoid put back slams. ~ in plays spawn; ~ out plays vanish, and the hand
// stays shown until it ends (godhand.js applyCamera).
// At the spirit press (docs/plans/SOUL-ALCHEMY.md 4.17; the station is world/garden/press.js) the hand reads the station: `point` held
// over a lump, `pinch` held carrying one, `press` (the pat looped) on the mouth while it presses, `grab` then `grabHold` on the ball and
// `pull` held as it is dragged, `idle` over the bath (raised and half-dithered there: vfx/alchemy/presslook.js); and the moments come
// off the bus: the view opened beckons, closed shoos, a lump loaded releases, one taken back flicks, a firing clenches the fist through
// the hit-stop, a refusal throws the hand open (a quick release). Contact frames (`HAND_CONTACTS`) are where a blow lands: `clips.hit` is true on
// the frame a clip crosses one, for a sound or an effect on the beat.
//
// Prior art: Black & White's hand (one hand as your whole presence: grab, pat, slap, point), the clapperjar's crossfaded clips
// (creatures/clappers.js), and Unity's Animator (a state's clip, its loop or its exit, chosen by the game's own state).
//
//   const C = new GodHandClips(god, gltf)   C.update(dt)   C.play('wave')   C.move   C.hit   C.done
//   (built in godhand.js buildHand; ticked by godhand.js updateHand and applyCamera in the world, by world/garden/hand.js pose in the garden)
// ---------------------------------------------------------------------------------------
import { RigClips } from '../courier/anim/rigclips.js';
import { godhandLimits } from '../courier/anim/rom.js';

// (frames at 30 fps: a held stretch is rocked between its two frames until let go; `out` is played on from there; a `firm` once, a blow,
// is played through before anything the chooser wants)
export const HAND_MOVES = {
  idle: { clip: 'idle', loop: true, fade: 0.25 },
  spawn: { clip: 'spawn', fade: 0 },
  vanish: { clip: 'vanish', clamp: true, fade: 0.08 },
  spiritFingers: { clip: 'spiritFingers', loop: true, fade: 0.2 },
  grab: { clip: 'grab', then: 'grabHold', thenFade: 0.1, fade: 0.08 },
  grabHold: { clip: 'grabHold', loop: true, fade: 0.12 },
  release: { clip: 'release', fade: 0.06 },
  crush: { clip: 'crush', fade: 0.12, firm: true },
  snap: { clip: 'snap', fade: 0.12, contact: 19 },
  point: { clip: 'point', hold: [18, 32], fade: 0.12 },
  chop: { clip: 'chop', fade: 0.06, from: 4, contact: 13, firm: true },
  pinch: { clip: 'pinch', hold: [21, 26], then: 'release', fade: 0.12 },
  scoop: { clip: 'scoop', hold: [35, 42], out: [42, 54], fade: 0.15 },
  pour: { clip: 'scoop', hold: [42, 54], from: 42, fade: 0.15 },
  pull: { clip: 'pull', hold: [30, 40], then: 'release', fade: 0.1 },
  pat: { clip: 'pat', fade: 0.08, contact: 10, firm: true },
  press: { clip: 'pat', loop: true, fade: 0.12 },
  shoo: { clip: 'shoo', loop: true, fade: 0.15 },
  shooOnce: { clip: 'shoo', fade: 0.12 }, // (the press view left: once, played out)
  slam: { clip: 'slam', fade: 0.08, contact: 20, firm: true },
  flick: { clip: 'flick', fade: 0.06, contact: 14, firm: true },
  poke: { clip: 'poke', fade: 0.06, contact: 9, firm: true },
  backhand: { clip: 'backhand', fade: 0.06, contact: 11, firm: true },
};
/** Where each blow lands, in frames (30 fps). */
export const HAND_CONTACTS = { slam: 20, chop: 13, punch: 13, poke: 9, pat: 10, flick: 14, slap: 11, backhand: 11, snap: 19 };
// (the clips no state calls for yet, playable by name: C.play('wave'); signs for spirits and siblings, a swat, a count: godhand.md 3)
for (const c of ['wave', 'beckon', 'block', 'thumbsUp', 'thumbsDown', 'okSign', 'peace', 'count', 'fingerGun', 'fistClench', 'punch', 'slap'])
  HAND_MOVES[c] = { clip: c, fade: 0.12, contact: HAND_CONTACTS[c] };

const HELD = { sunder: 'point', swell: 'pinch', wring: 'pinch', manifest: 'scoop' }; // (the world's arts held: the clip held while LMB is)
const STROKE = { pull: 'pull', press: 'press', smooth: 'shoo', flatten: 'press', carve: 'point', roughen: 'spiritFingers', paint: 'shoo' }; // (the garden's strokes)
const THROWN = 3; // (m/s: a throw faster than this lets go briskly)
const MOMENTS = new Set(['beckon', 'shooOnce', 'release', 'flick', 'fistClench']); // (the press's moments, played out before the station's state takes the hand again)

export class GodHandClips {
  constructor(god, gltf) {
    this.god = god; this.game = god.game;
    const bones = {}; gltf.scene.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    const rest = new Map(Object.values(bones).map((b) => [b, b.quaternion.clone()]));
    this.R = new RigClips(gltf.scene, gltf.animations, HAND_MOVES, { limits: godhandLimits(bones, (b) => rest.get(b)) });
    this.held = null; this.stroke = null;
    const on = (n, fn) => this.game.events?.on(n, fn);
    const world = () => this.god.controlling && !this.game.realm?.active, garden = () => !!this.game.realm?.active;
    on('god.enter', () => this.R.start('spawn')); // (posed tiny at once: the clip owns the scale-up)
    on('god.exit', () => this.R.play('vanish', { fade: 0.06 }));
    on('god.select', () => { if (world() && !this.god.grab) this.R.play('snap', { again: true }); });
    on('god.grab', () => { if (world()) this.R.play('grab', { again: true }); });
    on('god.throw', (e) => { if (world()) this.R.play('release', { again: true, speed: e.speed > THROWN ? 1.6 : 1 }); });
    on('catch.free', () => { if (world()) this.R.play('release', { again: true }); });
    on('spirit.bind', (e) => { if (e.from === 'hand' && world()) this.R.play('crush', { again: true }); });
    on('god.sunder', () => { if (world()) this.R.play('chop', { again: true }); });
    on('god.manifest', () => { if (world()) { if (this.R.move === 'scoop') this.R.release(); else this.R.play('scoop', { from: 42, again: true }); } });
    on('garden.enter', () => this.R.start('spawn'));
    on('garden.art', () => { if (garden() && !this.R.busy) this.R.play('snap', { again: true }); });
    on('garden.undo', () => { if (garden()) this.R.play('backhand', { again: true }); });
    on('garden.reset', () => { if (garden()) this.R.play('slam', { again: true }); });
    on('spirit.pet', () => { if (garden()) this.R.play('pat', { again: true }); });
    on('spirit.flick', () => { if (garden()) this.R.play('flick', { again: true }); });
    // the spirit press's moments (SOUL-ALCHEMY.md 4.17)
    const press = () => garden() && this.game.realm.press;
    on('alchemy.open', () => { if (press()) this.R.play('beckon', { again: true, speed: 1.6 }); });
    on('alchemy.close', () => { if (press()) this.R.play('shooOnce', { again: true, speed: 1.6 }); });
    on('alchemy.load', () => { if (press()) this.R.play('release', { again: true }); });
    on('alchemy.unload', (e) => { if (press()?.viewing && e.count === 1) this.R.play('flick', { again: true }); });
    on('alchemy.fire', () => { if (press()) this.R.play('fistClench', { again: true, speed: 1.5 }); });
    on('alchemy.refuse', () => { if (press()) this.R.play('release', { again: true, speed: 1.8 }); });
  }

  get move() { return this.R.move; }
  get hit() { return this.R.hit; }
  get done() { return this.R.done; }
  play(move, opts) { return this.R.play(move, { again: true, ...opts }); }

  /** Once a frame while the hand is drawn: the clip the mode wants, then the mixer and the limits. */
  update(dt) {
    const realm = this.game.realm;
    if (realm?.active) this.garden(realm);
    else if (this.god.controlling) this.world();
    this.R.update(dt);
  }

  /** Go to `want` unless a once is still playing; a held clip that is no longer wanted is let go first. `urgent` cuts a once short,
   *  but never a blow (`firm`). */
  choose(want, urgent = false) {
    const R = this.R;
    if (R.move === 'spawn' && R.frame < 20) return; // (it pops in first)
    if (R.busy && R.spec?.firm) return;
    if (R.move === want) return;
    if (R.move === 'grab' && want === 'grabHold') return; // (the grab goes on to the hold itself)
    if (R.phase === 'in' || R.phase === 'hold') { R.release(); if (!urgent) return; }
    if (R.busy && !urgent) return;
    R.play(want);
  }

  world() {
    const G = this.god, A = G.arts, live = A.live?.id;
    if (G.grab) {
      this.choose('grabHold', true);
      const k = G.catch?.held ? G.catch.progress : 0; // (a Figment struggling: the grip works harder as it is drawn in)
      if (this.R.move === 'grabHold') this.R.speed = 1 + 2 * k;
    } else if (HELD[live]) this.choose(HELD[live], true);
    else this.choose(A.art.id === 'telekinesis' && G.hover ? 'spiritFingers' : 'idle');
  }

  garden(realm) {
    if (realm.press?.viewing) return this.atPress(realm.press);
    const H = realm.hand, I = this.game.input, R = this.R;
    const held = H.seed || H.held;
    if (held && !this.held) R.play('grab', { again: true });
    else if (!held && this.held && R.move !== 'pat') R.play('release', { again: true, speed: H.vel?.length() > THROWN ? 1.6 : 1 });
    this.held = held || null;
    const st = H.stroke?.how || null;
    if (st === 'flatten' && this.stroke !== 'flatten') R.play('slam', { again: true }); // (a terrace begun: the flat palm comes down)
    this.stroke = st;
    if (realm.tribulation?.active && I.wasPressed('Mouse2') && H.art !== 'water') R.play('flick', { again: true }); // (the Heavenly Kiln's bolt sent back)
    if (H.art === 'place' && I.wasPressed('Mouse0') && H.hit) R.play('poke', { again: true });
    if (held) return this.choose('grabHold', true);
    if (st) return this.choose(STROKE[st] || 'press', true);
    if (H.art === 'water' && I.isDown('Mouse2')) return this.choose('scoop', true); // (drinking up: the palm cupped)
    if (H.art === 'water' && I.isDown('Mouse0')) return this.choose('pour', true);
    this.choose(H.art === 'place' ? 'point' : 'idle');
  }

  /** At the spirit press: the clip the station's state wants (the moments are the bus's, above). */
  atPress(S) {
    const R = this.R;
    if (!S.lever && R.busy && MOMENTS.has(R.move)) return; // (a moment the bus called for plays out: the beckon, a release, a flick, the clench)
    if (S.lever) {
      if (!['grab', 'grabHold', 'pull', 'fistClench'].includes(R.move)) R.play('grab', { again: true });
      if (S.pull > 0.15) this.choose('pull', true);
      return;
    }
    if (S.carry) return this.choose('pinch', true);
    if (S.walk || S.beatT != null) return this.choose('press', true);
    if (S.hover) return this.choose('point', true);
    this.choose('idle');
  }

  dispose() { this.R.dispose(); }
}
