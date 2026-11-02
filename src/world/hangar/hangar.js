// ---------------------------------------------------------------------------------------
// THE HANGAR (docs/plans/MECHS.md 5.1; South, 2026-11-02: "Giant robots. Pilotable. They should have a cradle for the Pneuka Jar to
// screw into"): the mechs' room off the Index (THE HAND group, beside the Sandbox), a tall hall in a zone of its own (`hangar`, x 3800,
// y 200, z -3000) with the proving ground beside it (`provingground`, world/hangar/provingground.js), both one area (render/areas.js
// stage 2): built when the camera comes to it, torn down whole after it leaves, the mech back in its gantry when it is built again.
//   the gantry against the north wall, the mech standing in it on the lift's deck (mech.js, posed by mechpilot.js);
//   the walkway at its chest, up a ramp along the west: F there seals the Pneuka Jar into the chest's cradle (a body cradle,
//     world/cradles.js), and the launch follows: the lift rides up the shaft through the roof and, under the seam, the mech is set down in
//     the proving ground, piloted (mechpilot.js); X unseals anywhere: it kneels where it stands, the Courier beside it;
//   the lectern at the gantry's foot: F opens the assembly page (assembly.js: the frame chosen, the cracks mended);
//   the door in the south wall back to the hub (and the proving ground's own in its west wall).
// The straw giant (giant.js) stands in the proving ground; the readout (readout.js) shows while sealed. The look is a placeholder
// (clay walls, an iron gantry): Calissa dresses it.
//
// Prior art: Evangelion's cage and launch catapult (the unit clamped in a gantry, the plug inserted from a bridge at its chest, the lift
// up the shaft), Armored Core's garage, the Sandbox's and the Touchstone's rooms (world/sandbox/sandbox.js: the area, arrival, F wiring).
//
//   game.hangar = new Hangar(game)   .build()   .teardown()   .built   .here   .arrive()   .leave()   .update(dt)   .light()
//   .state (MechState: the frame and its cracks, save section `mech`)   .pilot (MechPilot)   .giant (Giant: the straw giant, or the dune colossus once called)   .post (GiantPost)   .field (ProvingGround)   .bout (RingBout)
//   .city (ToyCity: the voxel buildings, city.js)   .props (MechProps: what the mech picks up, props.js)   .challenges (SmashChallenges: the lane's lectern and five smash challenges, challenges.js)
//   .cradle (the mech's body cradle while built)   .deck (the lift's deck)   events: hangar.enter, hangar.leave { by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { StageKit } from '../strawmanwell/stagekit.js';
import { label } from '../basement/basement.js';
import { wholeOf, zoneOf } from '../../render/zonemap.js';
import { HANGAR, PROVING } from './layout.js';
import { MechState } from './mechstate.js';
import { MechPilot } from './mechpilot.js';
import { Giant } from './giant.js';
import { GiantPost } from './giantpost.js';
import { ProvingGround } from './provingground.js';
import { MechReadout } from './readout.js';
import { MechAssembly } from './assembly.js';
import { ToyCity } from './city.js';
import { MechProps } from './props.js';
import { RingBout } from './ringbout.js';
import { SmashChallenges } from './challenges.js';

const C = { floor: 0x8a7a68, wall: 0x7a5a48, roof: 0x3a2a22, iron: 0x4c4a48, walk: 0x6b5a4a, lectern: 0x6b4a36, gold: 0xd9a441, door: 0x6b5a3a, deck: 0x5a5048 };
const GAP = 4, DOOR_H = 5, REACH = 1.8; // (the south wall's door gap and its height, F's reach to the lectern and the door, in metres)

/** The two rooms' air (fog colour, exponential density): the hall's at the Sandbox's warmth; the yard's a dusk haze about a tenth as
 *  thick, so a 16 m giant reads at 200 m (exp(-(0.0012 x 200)^2) keeps 94% of it). */
export const AIR = { hangar: { fog: 0x5a4a3c, density: 0.0045 }, provingground: { fog: 0x9a8a78, density: 0.0012 } };

export class Hangar {
  constructor(game) {
    this.game = game; this.built = false;
    this.state = new MechState(game); this.pilot = new MechPilot(this); this.giant = new Giant(game, 'straw'); this.post = new GiantPost(game); this.field = new ProvingGround(game);
    this.readout = new MechReadout(this); this.assembly = new MechAssembly(this);
    this.city = new ToyCity(this); this.props = new MechProps(this); // (v2: the toy city and what is loose in it, MECHS.md 9.1, 9.2)
    this.city.onChunk = (c) => this.props.addChunk(c); this.city.onGirder = (at) => this.props.addGirder(at);
    this.bindGiant();
    this.bout = new RingBout(this); // (the proving ground's boxing ring: a Punch-Out bout with a rival frame, world/hangar/ringbout.js)
    this.challenges = new SmashChallenges(this); // (the lane's smash challenges: the lectern, the lane, the scoring; world/hangar/challenges.js)
    this.cradle = null; this.deck = null;
  }

  /** The hall built, the proving ground beside it, the mech in its gantry, its cradle added, the giant stood on its spot. */
  build() {
    if (this.built) return;
    const g = this.game, A = HANGAR.at, X = (x) => A.x + x, Z = (z) => A.z + z, y = A.y, w = HANGAR.w / 2, d = HANGAR.d / 2, h = HANGAR.h;
    const room = this.room = new THREE.Group(); room.name = 'hangar'; room.userData.zone = 'hangar';
    const K = this.kit = new StageKit(g, room), box = (p, s, c, o) => K.box(p, s, c, o);
    box([X(0), y - 0.5, Z(0)], [2 * w + 2, 1, 2 * d + 2], C.floor, { outline: false });
    for (const s of [-1, 1]) box([X(s * (w + 0.5)), y + h / 2, Z(0)], [1, h, 2 * d + 2], C.wall, { outline: false });
    box([X(0), y + h / 2, Z(-d - 0.5)], [2 * w + 2, h, 1], C.wall, { outline: false });
    const half = (w + 1 - GAP / 2) / 2;
    for (const s of [-1, 1]) box([X(s * (GAP / 2 + half)), y + h / 2, Z(d + 0.5)], [2 * half, h, 1], C.wall, { outline: false });
    box([X(0), y + DOOR_H + (h - DOOR_H) / 2, Z(d + 0.5)], [GAP, h - DOOR_H, 1], C.wall, { outline: false });
    box([X(0), y + DOOR_H / 2, Z(d + 0.9)], [GAP - 1, DOOR_H, 0.3], C.door);
    label(room, 'THE HUB', [X(0), y + 3.6, Z(d - 0.05)], { width: 2.6, vertical: true, rotY: Math.PI });
    // the roof, open over the gantry for the lift's shaft
    const Gz = HANGAR.gantry.z, o = HANGAR.hole, ry = y + h + 0.5;
    box([X(0), ry, Z((-d - 1 + Gz - o) / 2)], [2 * w + 2, 1, Gz - o + d + 1], C.roof, { outline: false });
    box([X(0), ry, Z((Gz + o + d + 1) / 2)], [2 * w + 2, 1, d + 1 - Gz - o], C.roof, { outline: false });
    for (const s of [-1, 1]) box([X(s * (o + (w + 1 - o) / 2)), ry, Z(Gz)], [w + 1 - o, 1, 2 * o], C.roof, { outline: false });
    // the gantry: two towers either side of the mech, a beam across their tops, its clamps against the north wall
    for (const s of [-1, 1]) { box([X(s * 8.5), y + 11, Z(Gz)], [2, 22, 2], C.iron); box([X(s * 6.2), y + 12, Z(Gz - 3.2)], [2.6, 1, 0.8], C.iron); }
    box([X(0), y + 22.6, Z(Gz)], [19, 1.4, 2], C.iron);
    label(room, 'THE GANTRY', [X(0), y + 24.4, Z(Gz + 1.05)], { width: 6, vertical: true });
    // the walkway at the chest and its ramp up the west (the cradle reached from the walkway's middle)
    const Wk = HANGAR.walk, wy = y + HANGAR.walkY;
    box([X((Wk.x0 + Wk.x1) / 2), wy - 0.2, Z((Wk.z0 + Wk.z1) / 2)], [Wk.x1 - Wk.x0, 0.4, Wk.z1 - Wk.z0], C.walk);
    const Rp = HANGAR.ramp, run = Rp.x1 - Rp.x0, a = Math.atan2(HANGAR.walkY, run), t = 0.5, len = Math.hypot(run, HANGAR.walkY) + 0.3;
    box([X((Rp.x0 + Rp.x1) / 2) + (Math.sin(a) * t) / 2, y + HANGAR.walkY / 2 - (Math.cos(a) * t) / 2, Z(Rp.z)], [len, t, Rp.w], C.walk, { rotZ: a });
    label(room, 'THE CRADLE', [X(0), wy, Z(Wk.z1 - 0.6)], { width: 2.4, sub: 'F seals your Pneuka Jar in' });
    // the lectern, and the lift's deck the mech stands on (its own mesh: it rides up with the mech)
    const L = HANGAR.lectern;
    box([X(L.x), y + 0.5, Z(L.z)], [0.9, 1, 0.9], C.lectern); box([X(L.x), y + 1.02, Z(L.z)], [0.7, 0.04, 0.7], C.gold, { collide: false });
    label(room, 'ASSEMBLY', [X(L.x), y, Z(L.z + 1.1)], { width: 2, sub: 'the frame and its parts' });
    this.deck = K.box([X(0), y, Z(Gz)], [12, 1, 10], C.deck, { own: true, collide: false }).mesh;
    for (const [lx, lz] of [[-18, -14], [18, -14], [-18, 12], [18, 12]]) K.lamp(X(lx), y + h - 3, Z(lz), 1.4);
    K.finish();
    g.scene.add(room);
    this.field.build(); this.bout.build();
    this.city.build(this.field.group); this.props.build(this.field.group); this.challenges.build(this.field.group); // (whole on every visit)
    this.pilot.build(); this.pilot.toGantry();
    const P = PROVING.at, Gs = PROVING.giant;
    this.giant.spawn(this.field.group, new THREE.Vector3(P.x + Gs.x, P.y, P.z + Gs.z), Gs.yaw); this.post.build(this.field.group);
    this.addCradle();
    this.built = true;
  }

  /** The standing giant's limbs thrown off as props (props.js). */
  bindGiant() { this.giant.onLimb = (part, at) => this.props.spawnLimb({ from: 'giant', part, at, label: this.giant.G.label }); }
  /** F at the giant post: the next open giant stands in the yard in place of the one standing (giantpost.js `next`). */
  callGiant() {
    const g = this.game, id = this.post.next(this.giant.G.id);
    if (!id) { g.log?.say('warn', 'No other giant is open yet.', { key: 'giant.call.none', throttle: 3 }); return; }
    const P = PROVING.at, Gs = PROVING.giant;
    this.pilot.tech.grapple.reset(); this.giant.dispose();
    this.giant = new Giant(g, id); this.bindGiant();
    this.giant.spawn(this.field.group, new THREE.Vector3(P.x + Gs.x, P.y, P.z + Gs.z), Gs.yaw);
    g.events?.emit('giant.call', { id, by: 'courier' });
  }

  /** The mech's chest cradle (a body: its controller is the pilot's; F inside is the cable, never an unseal: X unseals). */
  addCradle() {
    const C2 = this.game.cradles, M = this.pilot; if (!C2) return;
    const seat = M.mech.seat(new THREE.Vector3());
    this.cradle = C2.add({ id: 'hangar.mech', kind: 'body', book: 'hangar', pos: seat, at: seat, yaw: Math.PI, reach: 2.6, hold: true, drain: 0,
      onSeal: () => M.onSeal(), onUnseal: (c, why) => M.onUnseal(why), update: (dt) => M.update(dt),
      hurt: (blow) => M.hurt('core', blow?.k ?? 0.3, blow?.by ?? 'creature') });
    this.cradle.keepF = true;
    M.placeCradle(this.cradle);
  }

  teardown() {
    if (!this.built) return;
    const g = this.game;
    if (this.cradle) { g.cradles?.remove(this.cradle); this.cradle = null; }
    this.readout.hide(); this.assembly.close();
    this.challenges.teardown(); this.bout.teardown(); this.props.teardown(); this.city.teardown(); this.post.dispose(); this.giant.dispose(); this.pilot.dispose(); this.field.teardown();
    this.kit?.dispose(); this.room = null; this.kit = null; this.deck = null; this.built = false;
  }

  /** Is the Courier in the hangar or the proving ground? */
  get here() { const z = wholeOf(this.game.player.pos); return z === 'hangar' || z === 'provingground'; }
  arrive() {
    const g = this.game, A = HANGAR.at, R = HANGAR.arrive;
    if (this.built && !g.cradles?.sealed && this.pilot.mode !== 'gantry') this.pilot.toGantry(); // (come back to it: the mech is in its gantry again)
    g.player.killY = A.y - 60; g.course?.teleport(new THREE.Vector3(A.x + R.x, A.y + 0.05, A.z + R.z), R.yaw);
    g.events?.emit('hangar.enter', { by: 'courier' });
  }
  leave() {
    const g = this.game, C2 = g.course, home = () => C2?.teleport(C2.hubSpawn.v, C2.hubSpawn.yaw);
    g.seam?.cross(home) || home();
    g.events?.emit('hangar.leave', { by: 'courier' });
  }

  /** F at the lectern and the doors (wired on the first frame, as the Sandbox's: the chevron exists after boot). */
  wire() {
    const g = this.game; if (this.wired || !g.interact) return; this.wired = true;
    g.interact.add('hangar', () => {
      if (!this.built || !this.here || g.dialogue?.open || g.god?.controlling || g.cradles?.sealed) return null;
      const P = g.player.pos, A = HANGAR.at; let best = null;
      const near = (ref, x, z, reach, hy) => { const d = Math.hypot(P.x - (A.x + x), P.z - (A.z + z)); if (d < reach && Math.abs(P.y - A.y) < 3 && (!best || d < best.d)) best = { pos: new THREE.Vector3(A.x + x, A.y + hy, A.z + z), d, ref }; };
      near('lectern', HANGAR.lectern.x, HANGAR.lectern.z, REACH, 1.6);
      near('door', HANGAR.door.x, HANGAR.door.z, 2.4, 3);
      const f = this.field.offer(P); if (f && (!best || f.d < best.d)) best = f;
      const gp = this.post.offer(P); if (gp && (!best || gp.d < best.d)) best = gp;
      return best;
    });
  }

  /** Each room's own air, after the room's fog is graded each frame (as the Sandbox's and the Touchstone's): the hangar a warm hall's
   *  haze; the proving ground an open yard's, thin enough to see the giant 200 m off and the sky over it. */
  light() {
    const g = this.game, F = g.scene?.fog, z = zoneOf(g.camera.position); if (!F) return;
    const A = AIR[z]; if (!A) return;
    F.color.setHex(A.fog); F.density = A.density;
    if (z === 'provingground' && g.scene.background?.isColor) g.scene.background.setHex(A.fog); // (the yard's horizon as its haze, not the hall's dark)
    // (the yard's far plane, 600 m past the giant 230 m off at launch, is render/zonemap.js ZONE_FAR's: set with the rest in world/dunes/dunes.js)
  }

  update(dt) {
    this.wire();
    if (!this.built) { this.readout.hide(); return; }
    const g = this.game, C2 = g.cradles, on = !!this.cradle && C2?.sealed === this.cradle && C2.phase === 'on';
    if (!on) this.pilot.idle(dt); else this.pilot.drawCable();
    this.giant.update(dt, this.bout.active ? null : this.pilot.target()); // (no giant cuts into a bout)
    this.pilot.tech.grapple.update(dt); // (a giant lifted or thrown: giantgrapple.js)
    this.bout.tick(dt);
    this.city.update(dt, g.rawDt ?? dt); this.props.update(dt); // (the chunks falling, the city re-meshed, the props in flight)
    this.challenges.update(dt, g.rawDt ?? dt); // (after the props: a tower landed this frame rolls on)
    this.readout.update(g.rawDt ?? dt, on && this.pilot.mode === 'pilot' && !this.bout.active); // (a bout has its own readout: ringbout.js)
    const it = g.interact?.cur, P = g.player;
    if (it?.id === 'hangar' && P.peekLatch?.('KeyF') && !C2?.sealed) {
      P.latch('KeyF');
      if (it.ref === 'lectern') this.assembly.open(); else if (it.ref === 'giantpost') this.callGiant(); else this.leave();
    }
  }
}
