// ---------------------------------------------------------------------------------------
// THE JAR'S CLIPS: the Pneuka Jar played from its own 17 actions (source_assets/Courier/courier_pneuka.blend, the owner's: idle, summon,
// dismiss, hop, land, open, close, gulp, spit, startled, shake, happy, sad, curious, rummage, sleep, wake) on its own mixer
// (courier/anim/rigclips.js), five bones (root > base > belly > chest > lid). The clips own the Jar's squash, its stretch and its scale
// on `root`: nothing else scales it (the god hand's group writes, the reforge's regrow and the garden's spring all gave way to them).
// The joint limits come last (rom.js PNEUKA_JAR_ROM: none of the clips' frames is clamped).
//
// The clip is chosen by whichever mode is drawing the Jar (casebook rule 58): under the god hand (~ in: summon, held still until the
// Courier has stepped out; ~ out: dismiss, quick enough for the 0.4 s the Jar has before it is put away), a blow by how hard (a raid's
// clap or a throw: shake; a ball or a blast: startled), shattered and reforged (summon), a Figment held over its mouth (open, then
// gulp as it is bound, or close if it gets away), mended (happy), low (sad, held drooped), the cursor over it (curious), the Pneuka
// Box open (rummage); in the Spirit Garden, the hop and the landing (vfx/garden/jarhop.js routes them here: the hop without the
// root's rise, which the body makes itself, started at take-off and held at the top of a long flight; the landing at touchdown, as
// hard as it came down), a spirit let go (spit), still a long while (sleep, then wake). Entering the garden always starts at idle, so
// a dismiss held at its last frame (the root at nothing) never carries over.
//
// Prior art: the clapperjar's crossfaded clips (creatures/clappers.js), the squash and stretch of the Disney animators' bouncing ball
// that the owner keyed into these actions, and Super Mario Galaxy's hop on a small world (take-off and landing as two beats).
//
//   const C = new PneukaJarClips(jar, gltf)   C.update(dt)   C.hop()   C.land(speed)   C.mouth(out)   C.rootBone   C.move
//   (built in godhand/jar.js; ticked once a frame from main.js; jar.group.userData.clips is this, for the garden's hop)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RigClips } from '../courier/anim/rigclips.js';
import { pneukaJarLimits } from '../courier/anim/rom.js';

export const JAR_MOVES = {
  idle: { clip: 'idle', loop: true, fade: 0.25 },
  summon: { clip: 'summon', fade: 0 },
  dismiss: { clip: 'dismiss', clamp: true, fade: 0.05, speed: 1.83 }, // (0.733 s into the 0.4 s the Jar is shown after ~ out)
  hop: { clip: 'hopGarden', hold: [14, 16], from: 7, fade: 0.05 }, // (from take-off; the top of the arc held while a long flight lasts)
  land: { clip: 'landGarden', from: 4, fade: 0.04 }, // (from touchdown)
  open: { clip: 'open', clamp: true, fade: 0.08 },
  close: { clip: 'close', fade: 0.06 },
  gulp: { clip: 'gulp', fade: 0.08 },
  spit: { clip: 'spit', fade: 0.1 },
  startled: { clip: 'startled', fade: 0.04 },
  shake: { clip: 'shake', fade: 0.05 },
  happy: { clip: 'happy', fade: 0.15 },
  sad: { clip: 'sad', clamp: true, fade: 0.35 },
  curious: { clip: 'curious', clamp: true, fade: 0.2 },
  rummage: { clip: 'rummage', loop: true, fade: 0.15 },
  sleep: { clip: 'sleep', loop: true, fade: 0.6 },
  wake: { clip: 'wake', fade: 0.12 },
};
const HARD = 12; // (a blow above this startles it; at or below, a shake: a raid's clap is 7, a throw 4, a ball 14, a blast up to 22)
const LOW = 0.4; // (hp share below which it droops)
const SUMMON_AT = 0.25; // (real seconds after ~ before it rises: the Courier is still stepping out)
const SLEEP_AFTER = 25; // (real seconds still in the garden)
const MOUTH = new THREE.Vector3(0, 0.45, 0); // (the mouth's middle in the chest bone's frame: the lid's rim)

export class PneukaJarClips {
  constructor(jar, gltf) {
    this.jar = jar; this.god = jar.M; this.game = jar.M.game;
    const bones = {}; gltf.scene.traverse((o) => { if (o.isBone) bones[o.name] = o; if (o.isSkinnedMesh) o.frustumCulled = false; });
    this.bones = bones; this.rootBone = bones.root || null;
    this.R = new RigClips(gltf.scene, gltf.animations, JAR_MOVES, { limits: pneukaJarLimits(bones, () => new THREE.Quaternion()) }); // (every rest rotation is the identity)
    this.R.variant('hop', 'hopGarden', ['root.position']); this.R.variant('land', 'landGarden', ['root.position']); // (the garden's body rises and falls itself)
    this.wait = 0; this.lastHp = jar.hp; this.still = 0; this.hit = null;
    jar.group.userData.clips = this; // (vfx/garden/jarhop.js routes the hop and the landing here)
    const on = (n, fn) => this.game.events?.on(n, fn);
    const world = () => !this.game.realm?.active, garden = () => !!this.game.realm?.active;
    on('god.enter', () => { this.R.start('summon'); this.wait = SUMMON_AT; this.lastHp = jar.hp; });
    on('god.exit', () => { if (jar.alive) this.R.play('dismiss'); });
    on('jar.hit', (e) => { this.hit = e.amount > HARD ? 'startled' : 'shake'; });
    on('jar.reforge', () => { this.R.start('summon'); this.lastHp = jar.hp; });
    on('catch.grab', () => { if (world()) this.R.play('open', { again: true }); });
    on('catch.free', () => { if (world()) this.R.play('close', { again: true }); });
    on('spirit.bind', (e) => { if (e.from === 'hand' && world()) this.R.play('gulp', { again: true, from: this.R.move === 'open' ? 7 : 0 }); }); // (the lid already open: in at its swallow)
    on('spirit.release', () => { if (garden()) this.R.play('spit', { again: true }); });
    on('garden.enter', () => { this.R.start('idle'); this.still = 0; });
  }

  get move() { return this.R.move; }
  /** The garden's hop leaves the ground. */
  hop() { this.still = 0; this.R.play('hop', { again: true }); }
  /** The garden's landing at `speed` m/s: as much of the squash as the fall was hard. */
  land(speed = 4) { this.still = 0; this.R.play('land', { again: true, weight: THREE.MathUtils.clamp(speed / 10, 0.2, 1) }); }
  /** Where the Jar's mouth is in the world (the catch's tether ends there). */
  mouth(out = new THREE.Vector3()) { const c = this.bones.chest; if (!c) return null; c.updateWorldMatrix(true, false); return c.localToWorld(out.copy(MOUTH)); }

  update(dt) {
    const R = this.R, J = this.jar, G = this.god;
    if (!J.group.visible) return; // (put away: nothing to pose)
    if (this.wait > 0) { this.wait -= dt; R.update(0); return; } // (summon held at its first frame, tiny)
    if (this.game.realm?.active) this.garden(dt);
    else if (G.state === 'in' || G.state === 'on') this.world();
    this.hit = null;
    this.lastHp = J.hp;
    R.update(dt);
  }

  /** Go to a steady clip unless a once is still playing. */
  choose(want) { const R = this.R; if (R.move !== want && !R.busy) R.play(want); }

  world() {
    const R = this.R, J = this.jar, G = this.god;
    if (!J.alive) return;
    if (this.hit && R.move !== 'summon') R.play(this.hit, { again: true }); // (a blow by how hard)
    else if (J.hp > this.lastHp + 0.5 && R.move !== 'summon' && R.move !== 'happy' && !G.catch?.held) R.play('happy', { again: true }); // (mended)
    if (G.catch?.held || this.game.catchLook?.state === 'take') return this.choose('open'); // (drawn down the tether, 0.45 s, `held` is already let go of: the lid stays open for the gulp)
    if (this.game.pneukaUI?.open) return this.choose('rummage');
    if (G.cursor?.over === 'jar') return this.choose('curious');
    this.choose(J.hp < J.max * LOW ? 'sad' : 'idle');
  }

  garden(dt) {
    const B = this.game.realm.jarBody, R = this.R;
    const still = B && B.grounded && !B.held && !B.flight && B.vel.lengthSq() < 0.04;
    this.still = still ? this.still + (this.game.rawDt ?? dt) : 0;
    if (R.move === 'sleep' && !still) { R.play('wake', { again: true }); return; }
    if (R.move === 'hop') { this.downT = B?.grounded ? (this.downT || 0) + dt : 0; if (this.downT > 0.3) R.play('idle'); return; } // (down without a landing said: put back)
    if (R.busy) return;
    if (this.game.pneukaUI?.open) return this.choose('rummage');
    this.choose(this.still > SLEEP_AFTER ? 'sleep' : 'idle');
  }

  dispose() { this.R.dispose(); delete this.jar.group.userData.clips; }
}
