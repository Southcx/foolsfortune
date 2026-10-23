// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S COURIER: a Courier of the Anim Lab's own (courier/character.js, built as a sibling's rig is: main.js makeRig), worn
// with the Courier's look (game.vessel.dress), driven by the game's own animation stack in the game's own order, one frame at a time:
// the techs (the emote, the kick, the launch that carries a whole-body blow) and the tools (each tool's own class: the Sondelass and its
// cutlass, the Soul Brush, the Veritome, the Dreamvane, the Crucibelle, the Lockheart, and the psygun's Weapon) on a belt of their own
// (tools/belt.js), all on the stand-in world (workbench/animshim.js), so nothing the Anim Lab plays reaches the game: not the ledger,
// the log, the pool, the save, the world's things, nor the Courier's own rig and tools.
//
// One frame, as main.js's tick runs the Courier's part of it: the psygun's update; the body's facing; the fixed step (the passive techs,
// then the tech that owns the step, or the core's pinned stand-in: animshim.js LabBody.core); the techs' frame (each tool's draw, its
// moveset); the belt; character.animate (layers, stances, the foot IK, the prowl's head); poseHands (the gun, the tools placed, the
// hands, the knee guard, the hinge repair and the joint limits, rom.js, last); the psygun's flourish after the hands.
//
// Every take begins from the fresh state (workbench/animfresh.js: what the rig, the techs, the belt, the body, the keys and the seven
// tools held once all were built and two frames stepped), the worn tools laid on again, and the holder at the origin while the rig
// steps, so a take is the same whatever was played before it and the world-space work (the foot locks, the holster) is the rig's own.
//
// Prior art: Unreal's Persona preview scene (an editor's own copy of the character, its anim blueprint run for real on it, nothing of
// the level touched), and the co-op sibling (coop/sibling.js: the Courier's own body and rig, driven by keys a mind presses).
//
//   const R = await AnimRig.create(game, holder)   R.wear(tool, form, { others })   R.put({ at, speed, posture }) (fresh)   R.step(dt)
//   R.rig (the Character)  R.body (LabBody)  R.keys (VirtualKeys)  R.techs  R.belt  R.tool (the tool in the hand: its tech, or the Weapon)
//   R.moveset (that tool's Moveset, or the kick's)  R.toolModel (what is drawn in the hand)  R.objects() (every Object3D a take records)
//   R.shoot({ from, speed }) (a shot flown at them: what a parry meets)   R.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import courierB64 from '../assets/courier.glb?b64';
import gunB64 from '../assets/psygun.glb?b64';
import { Character } from '../courier/character.js';
import { rigUniforms } from '../render/outline.js';
import { base64Buffer } from '../core/base64.js';
import { Techs } from '../courier/moves/techs.js';
import { Launch } from '../courier/moves/launch.js';
import { Emote } from '../courier/moves/emote.js';
import { Kick } from '../courier/moves/kick.js';
import { ToolBelt, psygunTool, sondelassTool, soulBrushTool, veritomeTool, heldTool } from '../tools/belt.js';
import { Weapon } from '../tools/psygun/weapon.js';
import { Sondelass } from '../tools/sondelass/sondelass.js';
import { SoulBrush } from '../tools/soulbrush/soulbrush.js';
import { Veritome } from '../tools/veritome/veritome.js';
import { Dreamvane } from '../tools/dreamvane/dreamvane.js';
import { Crucibelle } from '../tools/crucibelle/crucibelle.js';
import { Lockheart } from '../tools/lockheart/lockheart.js';
import { VirtualKeys } from '../coop/sibling.js';
import { T } from '../core/config.js';
import { labGame, LabBody } from './animshim.js';
import { gameHeld, keepFresh } from './animfresh.js';

/** The seven tools, in the game's order (main.js: the techs' list and the belt's): how each is made and worn. */
export const LAB_TOOLS = [
  { id: 'psygun', label: 'the psygun' },
  { id: 'sondelass', label: 'the Sondelass', make: (m) => new Sondelass(m), belt: (t) => sondelassTool(t), forms: ['cutlass', 'rod', 'hook'] },
  { id: 'soulbrush', label: 'the Soul Brush', make: (m) => new SoulBrush(m), belt: (t) => soulBrushTool(t) },
  { id: 'veritome', label: 'the Veritome', make: (m) => new Veritome(m), belt: (t) => veritomeTool(t) },
  { id: 'dreamvane', label: 'the Dreamvane', make: (m) => new Dreamvane(m), belt: (t) => heldTool(t, 'THE DREAMVANE', 'back') },
  { id: 'crucibelle', label: 'the Crucibelle', make: (m) => new Crucibelle(m), belt: (t) => heldTool(t, 'THE CRUCIBELLE', 'hip') },
  { id: 'lockheart', label: 'the Lockheart', make: (m) => new Lockheart(m), belt: (t) => heldTool(t, 'THE LOCKHEART', 'neck') },
];
const bytes = base64Buffer; // (one loop, not a callback a byte: core/base64.js)
/** Where the Anim Lab's body is put down in the world's frame: far from anything of the world's (a blow's sweep asks the tags' registry,
 *  core/tags.js, for what it may strike, and that is the game's own: a plaster patch, a crystal). A take keeps its frames from here. */
export const FAR = new THREE.Vector3(-9000, 0, -9000);
const UP = new THREE.Vector3(0, 1, 0);

/** A tool's Moveset: the cutlass's, the club's, the gun's (GunMoves keeps it as `moves.moves`), or the tool's own. */
export const movesetOf = (t) => t?.cutlass?.moves || t?.club?.moves || t?.moves?.moves || t?.moves || null;

/** The keys a person would press, live to the tools (VirtualKeys, coop/sibling.js, with the fields a tool reads off a keyboard). */
function labKeys() { const k = new VirtualKeys(); k.enabled = true; k.wheel = 0; k.dx = 0; k.dy = 0; return k; }

export class AnimRig {
  static async create(game, holder) {
    const loader = new GLTFLoader();
    const [cG, gG] = await Promise.all([loader.parseAsync(bytes(courierB64), ''), loader.parseAsync(bytes(gunB64), '')]);
    await game.clipPack?.social; // (the emotes, the dances and every clip nothing names yet: the raw clip list is the whole suite)
    return new AnimRig(game, holder, cG, gG);
  }

  constructor(game, holder, cG, gG) {
    this.game = game; this.holder = holder;
    // what the lab's things add to "the scene" goes here, out of sight (a trail, the blade mode's line, a lure): the stage shows the body,
    // the gun and the tool in the hand, which are moved to `holder`
    this.junk = new THREE.Group(); this.junk.visible = false; holder.add(this.junk);
    this.keys = labKeys();
    this.body = new LabBody(this.keys);
    this.aimCam = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 200); // (the over-the-shoulder camera the tools aim by: behind them, looking ahead)
    this.own = { scene: this.junk, camera: this.aimCam, input: this.keys, player: this.body, rawDt: 1 / 60, character: null, techs: null, belt: null, weapon: null, projectiles: new Set() };
    this.g = labGame(game, this.own);
    this.body.game = this.g;
    // the rig: the Courier's own model, clips and corrections (a sibling's rig: its own fade, never hidden by the first-person view)
    this.domGuard(() => {
      this.rig = new Character(holder, cG, gG, game.clipPack, { uniforms: rigUniforms(), fpHide: false });
    });
    this.own.character = this.rig;
    game.vessel?.dress(this.rig, game.vessel.look, { own: true }); // (the Courier's look, the kiln's glazes: not kept with the Courier's rigs)
    if (game.character?.idles?.stand) this.rig.idles.choose(game.character.idles.stand); // (the idle they stand in: the kiln's choice)
    // the techs that pose the body here, in main.js's order
    const techs = (this.techs = new Techs(this.body, this.g));
    this.body.techs = techs; this.own.techs = techs;
    this.domGuard(() => { techs.add(new Emote(techs)); techs.add(new Kick(techs)); techs.add(new Launch(techs)); });
    this.belt = new ToolBelt(this.g); this.own.belt = this.belt;
    this.belt.only = new Set(); // (the lab shows what a take asks, not a main and a sub: tools/belt.js `only`)
    this.made = {}; // tool id -> its tech (or the Weapon)
    this.toolId = null; this.form = null; this.wearing = { id: null, form: null, want: new Set() };
    // the fresh state every take begins from (animfresh.js): every tool made, in the game's order, as the game has them all; two frames
    // stepped with none worn, so what a tool builds on its first frame (the Lockheart's coffin) is built once, not again each take
    for (const t of LAB_TOOLS) this.make(t.id);
    this.put(); this.step(); this.step();
    this.fresh = keepFresh([this.own, this.made], { held: gameHeld(game, { leave: [game.workbench] }), never: [game, this.g, this.rig.clips], nodes: [...this.objects(), this.junk] });
  }

  /** Run `fn`, keeping every element it adds to the page (a tool's strip, its viewfinder, its styles) to take away at dispose(). */
  domGuard(fn) {
    const added = (this.added ||= []), seen = new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) added.push(n); });
    seen.observe(document.documentElement, { childList: true, subtree: true });
    try { return fn(); } finally { for (const m of seen.takeRecords()) for (const n of m.addedNodes) added.push(n); seen.disconnect(); }
  }

  /** The lab's instance of a tool (made once, as the rig is), its model moved out of the junk onto the stage. */
  make(id) {
    if (this.made[id]) return this.made[id];
    const spec = LAB_TOOLS.find((t) => t.id === id);
    if (!spec) return null;
    let t;
    if (id === 'psygun') {
      t = this.domGuard(() => new Weapon(this.g));
      this.own.weapon = t;
      this.belt.add(psygunTool(t));
    } else {
      t = this.domGuard(() => spec.make(this.techs));
      this.techs.add(t);
      this.belt.add(spec.belt(t));
      if (t.rest) t.rest.settle = Infinity; // (never baked at rest: a take records every part where it is, frame by frame)
      if (t.model?.group) this.holder.add(t.model.group);
    }
    this.made[id] = t;
    return t;
  }

  /** The tool in the hands (null: none; the kick is then the moveset), its form, and whether the others are worn (`others`: the
   *  ones the Courier wears in the game, the main and the sub, on their places on the body; off: none of them shown). */
  wear(id, form = null, { others = false } = {}) {
    const want = new Set(id ? [id] : []);
    if (others) for (const t of LAB_TOOLS) if (this.game.belt?.isWorn?.(t.id)) want.add(t.id);
    this.wearing = { id: id || null, form, want };
    this.dress();
  }

  /** What `wear` asked for, laid on the tools: the one in the hands drawn, its form, the others worn or hidden, the gun shown or not. */
  dress() {
    const { id, form, want } = this.wearing;
    this.toolId = id; this.form = form;
    this.belt.only = new Set(want);
    const t = id ? this.made[id] : null;
    if (t && form && t.form !== undefined) t.form = form; // (the Sondelass's form, set as the strip's key would: setForm waits out a move)
    for (const [tid, tool] of Object.entries(this.made)) {
      const draw = tid === id ? 1 : 0;
      if (tid === 'psygun') { tool.drawTarget = draw; tool.manualHolster = !draw; } else tool.drawTarget = draw;
      if (!want.has(tid) && tool.model?.group) tool.model.group.visible = false;
    }
    this.rig.gunOff = !want.has('psygun'); this.rig.gun.visible = !this.rig.gunOff;
  }

  /** The tool in the hands now: its tech, or the Weapon. */
  get tool() { return this.toolId ? this.made[this.toolId] : null; }
  /** Its Moveset (the combo engine: tools/moveset.js): the cutlass's, the club's, a tool's own, the gun's; with nothing in the hands, the kick's. */
  get moveset() { return this.tool ? (this.tool.form && this.tool.form !== 'cutlass' ? null : movesetOf(this.tool)) : this.techs.get('kick')?.moves || null; } // (the rod and the hook strike nothing: no string)
  /** What the hand holds, as drawn (the gun is the rig's own). */
  get toolModel() { const t = this.tool; return !t ? null : this.toolId === 'psygun' ? this.rig.gun : t.model?.group || null; }

  /** Every Object3D a take records, beside the bones: the gun and each tool's model, whole (their parts move: the Sondelass's sections). */
  objects() {
    const out = [this.rig.gun];
    for (const [id, t] of Object.entries(this.made)) if (id !== 'psygun' && t.model?.group) out.push(t.model.group);
    return out;
  }

  /** Put the body down for a take: `at` (y over the floor: 0 standing, more for an air blow), the stance's `speed` (m/s, ahead: the
   *  pinned body's treadmill), its `posture` ('stand' | 'crouch' | 'prone'). */
  put({ at = new THREE.Vector3(), speed = 0, posture = 'stand' } = {}) {
    this.home(); this.fresh?.restore(); this.dress(); // (every take begins from the fresh state: animfresh.js)
    const B = this.body;
    B.reset(at.clone().add(FAR));
    this.aimCam.position.set(-0.55, 1.7, -3.2).add(FAR); this.aimCam.lookAt(FAR.x - 0.55, 1.45, FAR.z + 10); this.aimCam.updateMatrixWorld(true);
    B.posture = posture; B.crouchBlend = posture === 'stand' ? 0 : 1; B.crouching = posture !== 'stand' && B.grounded; B.prone = posture === 'prone';
    B.wish.set(0, 0, speed); B.vel.set(0, 0, B.grounded ? speed : 0);
    this.keys.release();
    // every move let go (never techs.reset(): the Soul Brush's clears the inscriptions of the module's own list, the game's too)
    if (this.techs.active) this.techs.stop();
    this.techs.get('emote')?.reset();
    this.techs.get('kick')?.stop?.();
    for (const t of Object.values(this.made)) { if (t.cutlass) t.cutlass.cancel(); else if (t.club) t.club.cancel(); else movesetOf(t)?.cancel(); }
  }

  /** The holder back at the origin (the stage moves it to pin the body on show): while the rig steps its frame is the world's, as the
   *  game's rig stands in the scene's (the foot locks, the holster and the head's place are worked out in the world). */
  home() { this.holder.position.set(0, 0, 0); this.holder.updateMatrixWorld(true); }

  /** A shot flown at the body's chest from `from` m ahead at `speed` m/s (a plain shot, as a slip jelly spits one: what the parry meets).
   *  It flies with the frames and is gone when it is met or past them. */
  shoot({ from = 1.6, speed = 7 } = {}) {
    const S = this.own.projectiles, B = this.body, pr = { pos: B.pos.clone().add(new THREE.Vector3(0, 1.15, from)), vel: new THREE.Vector3(0, 0, -speed), vanish() { S.delete(pr); } };
    S.add(pr);
  }

  /** The state character.animate reads, as main.js hands it (its tick: `character.animate(dt, {...})`). */
  animState() {
    const B = this.body, W = this.own.weapon, held = W ? W.held : 0;
    return {
      pos: B.renderPos, yaw: B.bodyYaw, velocity: B.vel, vy: B.vel.y, turnRate: 0, airJump: false,
      ground: (x, z, yTop) => (yTop >= 0 && yTop - 1.4 <= 0 ? 0 : null), // (the level floor at y 0, found as main.js's groundAt finds one: 1.4 m down)
      grounded: B.grounded, groundN: B.grounded ? UP : null, groundVel: B.groundVel,
      wall: 0, slide: 0, mantle: 0, mantleT: 1, dash: 0, crouch: B.crouchBlend, crawl: B.prone, prone: 1, posture: B.posture,
      aimPitch: 0, aimYawOffset: 0,
      combat: W ? W.combatBlend * held : 0, upper: W ? W.combatBlend * held : 0, gunHand: 0,
      reload: W?.reloading ? W.reloadT : -1, walkSpeed: T.movement.walkSpeed, sprintSpeed: T.movement.sprintSpeed,
      recoil: W ? W.kick * held : 0, gun: W || undefined, adsT: W?.adsEase || 0, landed: B.landedOut, techs: this.techs,
    };
  }

  /** What poseHands reads (main.js handContext, with no wall and no ledge: an open floor). */
  handState() {
    const W = this.own.weapon, P = this.techs.aimProfile();
    return {
      drawT: W ? W.drawT : 0, upper: W ? W.combatBlend * W.held : 0, fw: 0, fpPos: W?.fpPos, fpQ: W?.fpQ, camera: this.aimCam,
      aimPoint: W?.aimPoint, reloading: !!W?.reloading, leftOverride: W?.leftOverride, leftBlend: W?.leftBlend || 0, mantleT: 1,
      techs: this.techs, aimTurn: P?.turn ?? 1, aimArm: P?.arm || null,
    };
  }

  /** One frame of the Courier's part of main.js's tick (see the header), at `dt` (a 60th: one fixed step a frame). */
  step(dt = 1 / 60) {
    const B = this.body, W = this.own.weapon, K = this.keys, techs = this.techs;
    this.own.rawDt = dt;
    for (const pr of this.own.projectiles) { pr.pos.addScaledVector(pr.vel, dt); if (pr.pos.distanceTo(B.pos) > 6) this.own.projectiles.delete(pr); } // (the lab's shots fly)
    if (W && this.toolId === 'psygun') W.idleT = 0; // (the psygun chosen stays out, as first person keeps it out: no auto holster mid-take)
    if (W) { W.update(dt, K, B); W.computeAimPoint(this.aimCam, B); }
    const face = techs.faceYaw(); if (face != null) B.bodyYaw = face; // (player.js updateBody: a tech's facing, or the lab's front)
    // the fixed step: what player.fixedUpdate runs, pinned (the passives, then the tech with the step, or the core's stand-in)
    B.latchKeys(); B.prevPos.copy(B.pos);
    techs.passives(dt);
    if (!techs.step(dt)) B.core(dt);
    B.blends(dt); B.renderPos.copy(B.pos);
    techs.tick(dt);
    this.belt.tick();
    this.rig.animate(dt, this.animState());
    if (W) W.fpPose(dt, this.aimCam, B, this.rig);
    this.rig.poseHands(this.handState());
    if (W) W.moves.afterHands(this.rig, B);
    K.step(); K.frame();
  }

  dispose() {
    for (const t of Object.values(this.made)) { try { t.strip?.remove?.(); t.model?.group?.removeFromParent(); t.rest?.dispose?.(); } catch { /* gone */ } }
    for (const n of this.added || []) n.parentNode?.removeChild(n); // (what the tools put on the page: theirs, never the game's)
    this.rig.dispose(); this.junk.removeFromParent();
  }
}
