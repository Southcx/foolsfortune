// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S TAKES: a play (workbench/animplays.js) recorded on the Anim Lab's Courier (workbench/animrig.js) frame by frame at the
// game's own 60 a second, and laid back on it at any frame, forward or back, so a pose can be stepped and scrubbed though the stack that
// made it (damped blends, foot locks, a combo engine's clock) only ever runs forward. A take keeps, each frame: the root, every bone's
// place and turn, the hips in the rig's own frame (the travel's ghost line), the travel itself (the pinned body's: how far the move or the
// treadmill carried it), and every part of the gun and of each tool's model (the Sondelass's sections slide), shown or not; and what
// was on show (the move, its clip and clip time, and whether its strike was live: the scrub bar's band).
//
// Before the first recorded frame, from the rig's fresh state (R.put: workbench/animfresh.js), the stance is settled and the tool drawn
// (`pre` s, not kept), then `lead` s of the stance before the drive's first action, then until it is over (animplays.js quiet) and `tail`
// s more, or its own length. A raw clip is sampled onto the bones as captured, no layers and no IK, the tool in the hand carried by it.
//
// Prior art: a motion-capture take and the editor's cached preview (Unreal's Persona and Sequencer play an animation into a pose cache
// and scrub that, never the graph backwards); Blender's dope sheet, frame by frame.
//
//   const take = recordTake(R, play)   applyFrame(R, take, k)   take.n   take.fps   take.info[k]   take.travelAt(k, out)
//   take.hipsAt(k, out)   take.strike (Uint8Array n)   take.marks ([frame]: where the drive acted)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { quiet } from './animplays.js';

const FPS = 60, PRE = 1.2, LEAD = 0.25, TAIL = 0.4, MAX = 12;
const _m = new THREE.Matrix4(), _s = new THREE.Vector3();

/** Record a play on the rig (its tool already worn: R.wear). */
export function recordTake(R, play, { fps = FPS, pre = PRE } = {}) {
  const dt = 1 / fps, B = R.body, air = play.pin?.y || 0;
  R.put({ at: new THREE.Vector3(0, air, 0), speed: play.pin?.speed || 0, posture: play.pin?.posture || 'stand' });
  const hang = () => { if (air) { B.pos.y = air; B.vel.y = 0; B.grounded = false; } }; // (an air blow: begun from a hang, as after a jump)
  for (let i = 0; i < Math.round(pre * fps); i++) { hang(); R.step(dt); }
  B.start.copy(B.pos);
  const bones = Object.values(R.rig.bones), objs = [], tops = new Set(R.objects()), O = new THREE.Vector3(B.start.x, 0, B.start.z); // (kept from where the take began, the floor's height kept: the body is put down far off, animrig.js FAR)
  for (const o of tops) o.traverse((x) => objs.push(x));
  R.holder.updateWorldMatrix(true, false); // (the hips are kept in the rig's own frame: the stage's carry still holds the last take's travel)
  const take = { play, fps, bones, objs, frames: [], vis: [], layers: [], info: [], marks: [], n: 0 };
  const nb = bones.length, no = objs.length, stride = 7 + 3 + 3 + nb * 7 + no * 10;
  const capture = (raw) => {
    const F = new Float32Array(stride), V = new Uint8Array(no), L = new Int32Array(no), r = R.rig.root;
    _s.copy(r.position).sub(O).toArray(F, 0); r.quaternion.toArray(F, 3);
    if (!raw) { F[7] = B.pos.x - B.start.x; F[8] = B.pos.y - B.start.y; F[9] = B.pos.z - B.start.z; }
    R.rig.root.updateMatrixWorld(true); R.holder.worldToLocal(R.rig.bones.spine.getWorldPosition(_s)).sub(O).toArray(F, 10);
    let i = 13;
    for (const b of bones) { b.position.toArray(F, i); b.quaternion.toArray(F, i + 3); i += 7; }
    objs.forEach((x, j) => { (tops.has(x) ? _s.copy(x.position).sub(O) : x.position).toArray(F, i); x.quaternion.toArray(F, i + 3); x.scale.toArray(F, i + 7); i += 10; V[j] = x.visible ? 1 : 0; L[j] = x.layers.mask; });
    take.frames.push(F); take.vis.push(V); take.layers.push(L); take.info.push(raw ? { clip: play.clip, t: take.n / fps } : infoOf(R));
    take.n++;
  };
  if (play.kind === 'clip') rawClip(R, play.clip, fps, capture);
  else {
    const lead = Math.round(LEAD * fps), drive = [...(play.drive || [])].sort((a, b) => a[0] - b[0]);
    const len = play.len === 'loop' ? R.rig.clips.clips[R.rig.idles.clip]?.dur || 4 : play.len;
    const min = Math.max(play.min ?? 0.3, ...drive.map((d) => d[0]));
    let still = 0;
    for (let f = 0; f < (play.max || MAX) * fps; f++) {
      const t = (f - lead) / fps;
      while (drive.length && t >= drive[0][0] - 1e-9) { drive.shift()[1](R); take.marks.push(f); }
      R.step(dt);
      capture(false);
      if (t < 0) continue;
      if (len != null) { if (t >= len) break; continue; }
      still = (play.idle ? play.idle(R) : quiet(R)) ? still + dt : 0;
      if (t >= min && still >= TAIL) break;
    }
  }
  take.strike = Uint8Array.from(take.info, (x) => (x.strike ? 1 : 0));
  take.travelAt = (k, out = new THREE.Vector3()) => out.fromArray(take.frames[clampK(take, k)], 7);
  take.hipsAt = (k, out = new THREE.Vector3()) => out.fromArray(take.frames[clampK(take, k)], 10);
  return take;
}

/** A raw clip onto the bones, frame by frame: as captured (its own hips' travel kept), the tool in the hand carried by it. */
function rawClip(R, name, fps, capture) {
  const ch = R.rig, C = ch.clips, c = C.clips[name], pose = C.pose();
  if (!c) return;
  const n = Math.max(2, Math.round(c.dur * fps) + 1);
  for (let f = 0; f < n; f++) {
    ch.resetPose(); ch.applyPose(C.sample(name, Math.min(c.dur, f / fps), pose, false));
    ch.root.position.copy(R.body.start); ch.root.quaternion.identity(); ch.root.updateMatrixWorld(true);
    if (R.toolId === 'psygun') { ch.heldGun(0, _m).decompose(ch.gun.position, ch.gun.quaternion, _s); ch.gun.updateMatrixWorld(true); }
    else R.techs.hands(ch, R.handState()); // (a tool's own placing: the clip's hand carries it)
    capture(true);
  }
}

/** What is on show this frame: the move (its clip, its clip time, its strike live), or the emote's clip, or the stance. */
function infoOf(R) {
  const c = R.moveset?.cur, E = R.techs.get('emote'), L = R.techs.get('launch');
  if (c) { const s = c.def.track?.strike; return { what: c.id, clip: c.def.clip, t: c.t, strike: !!s && c.t >= s[0] && c.t <= s[1] && c.phase !== 'fall' }; }
  if (L?.o?.clip) return { what: L.o.tag, clip: L.o.clip, t: L.clipT };
  if (E?.cur) { const n = E.clipOf?.(); return { what: `/${E.cur}`, clip: n, t: n ? E.timeIn(n) : 0 }; }
  const t = R.tool;
  if (t?.cutlass?.blade?.active) return { what: 'blade mode', clip: 'Sond_ChargeHold' };
  if ((t?.cutlass?.parryT ?? 9) < 0.9) return { what: 'the parry', clip: 'Sond_Parry', t: 0.12 + t.cutlass.parryT }; // (cutlass.js pose(): the parry over the guard)
  if (t?.cutlass?.guardOn) return { what: 'the guard', clip: 'Sond_Block' };
  if (t?.cutlass?.iai) return { what: 'the iaido', clip: 'stance:cutlassIaido' };
  return { what: R.rig.idles.playing ? `idle B: ${R.rig.idles.playing}` : 'the stance', clip: R.rig.idles.playing || null };
}

const clampK = (take, k) => Math.max(0, Math.min(take.n - 1, k | 0));

/** Lay frame k of a take back on the rig and the tools. */
export function applyFrame(R, take, k) {
  if (!take?.n) return;
  const F = take.frames[clampK(take, k)], V = take.vis[clampK(take, k)], L = take.layers[clampK(take, k)], r = R.rig.root;
  r.position.fromArray(F, 0); r.quaternion.fromArray(F, 3);
  let i = 13;
  for (const b of take.bones) { b.position.fromArray(F, i); b.quaternion.fromArray(F, i + 3); i += 7; }
  take.objs.forEach((x, j) => { x.position.fromArray(F, i); x.quaternion.fromArray(F, i + 3); x.scale.fromArray(F, i + 7); i += 10; x.visible = !!V[j]; x.layers.mask = L[j]; });
  r.updateMatrixWorld(true);
  for (const o of R.objects()) o.updateMatrixWorld(true);
}
