// ---------------------------------------------------------------------------------------
// THE READING VIEW'S SCENE (docs/plans/SPREADS.md 5.1.1, the owner's moneyshot): the dark the reading view is drawn in. While the Pneuka
// Box is turned over, the world is not drawn; this scene is, through the same glow and grade (game.post). The Courier hangs in it as in
// the title's fall ("they hang in the fall, cards turning round them", title/scene.js): the title's own Courier, borrowed and dressed
// by the vessel. Round them the reading view (Calissa's look, vfx/readingview.js: the orbit, the cloth, the hand, the fall) is set with
// its origin at their feet and their front toward the camera. The camera rises through the cloth into the reading, and turns down
// through it again on the way back.
//
// It opens on `spread.flip { under: true }` while the Box's window is open, and closes on the flip back or on the window shutting (which
// turns the Box back with it, so `laidSpread.under` says what is shown). The window draws the reading's state into the view
// (pneuka/underside.js `toView`); this scene moves it on (`update`) and makes its picks from its camera (`pickAt`, `anchors`).
//
// Prior art: our title's fall; Persona's Velvet Room (a reading in a room outside the world); Kingdom Hearts' Dive to the Heart (a figure
// in the dark on a stained-glass floor).
//
//   game.readingScene = new ReadingScene(game)   .active  .k (0 shut .. 1 open)   .update(rawDt)   .render()
//   .pickAt(x, y) -> the view's pick ({ kind: 'place' | 'hand', id } | null)   .anchors() -> the view's places on screen   (x, y: client px)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const OPEN = 0.7; // (real s the camera takes through the cloth)
/** The camera at rest (in front, over the heart, looking down enough that the cloth shows past the hand), and where it rises from. */
const AT = { pos: [0, 2.1, 5.0], look: [0, 0.7, 0], from: [0, -1.9, 0.6], fromLook: [0, -4.5, 0] };
const smooth = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _l = new THREE.Vector3();

export class ReadingScene {
  constructor(game) {
    this.game = game; this.active = false; this.k = 0; this.dir = 0; this.t = 0; this.ch = null; this.was = null;
    const S = (this.scene = new THREE.Scene());
    S.background = new THREE.Color(0x0b0614); S.fog = new THREE.Fog(0x1a0f2a, 9, 30);
    this.camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.05, 80);
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); });
    S.add(new THREE.HemisphereLight(0x9a86c8, 0x1a0f2a, 1.1)); // (the title's light: title/scene.js lights)
    const key = new THREE.DirectionalLight(0xffe2c0, 1.6); key.position.set(2, 4, 5); S.add(key);
    this.view = game.readingView || null;
    if (this.view?.group) S.add(this.view.group);
    game.events?.on?.('spread.flip', (e) => { if (e.under) this.open(); else this.close(); });
  }

  /** The reading opens: the Courier borrowed from the title (the same model and clips, dressed as in the world), the cards flying in. */
  open() {
    if (!this.game.pneukaUI?.open || this.dir > 0 || (this.active && this.dir === 0)) return;
    const ch = this.game.title?.scene?.ch;
    if (ch && !this.ch) { this.ch = ch; this.was = { p: ch.root.position.clone(), r: ch.root.rotation.clone() }; this.scene.add(ch.root); ch.root.position.set(0, 0, 0); ch.root.rotation.set(0, 0, 0); this.game.vessel?.dress?.(ch); }
    if (this.view?.group) this.view.group.rotation.y = 0; // (the Courier's yaw: they face the camera)
    this.view?.enter?.();
    this.active = true; this.dir = 1; this.t = 0;
  }
  /** The flip back: the cards fly off, the camera turns down through the cloth, then the world. */
  close() { if (this.active && this.dir >= 0) { this.dir = -1; this.view?.leave?.(); } }
  finish() {
    this.active = false; this.dir = 0; this.k = 0;
    const ch = this.ch; this.ch = null;
    if (ch) { this.game.vessel?.dressed?.delete?.(ch); const T = this.game.title?.scene; if (T?.scene) T.scene.add(ch.root); if (this.was) { ch.root.position.copy(this.was.p); ch.root.rotation.copy(this.was.r); } }
  }

  update(raw = 1 / 60) {
    if (!this.active) return;
    const L = this.game.laidSpread;
    if (!this.game.pneukaUI?.open && this.dir >= 0) { if (L?.under) L.flip(false); this.close(); } // (the window shut while turned over: the Box turns back with it)
    this.k = THREE.MathUtils.clamp(this.k + (this.dir || 0) * raw / OPEN, 0, 1);
    if (this.dir < 0 && this.k <= 0) { this.finish(); return; }
    if (this.dir > 0 && this.k >= 1) this.dir = 0;
    this.t += raw;
    // the Courier hangs, as in the title's fall
    const ch = this.ch;
    if (ch) { ch.pose_ ||= ch.clips.pose(); ch.root.position.y = Math.sin(this.t * 0.8) * 0.05; ch.applyPose(ch.clips.sample(ch.clips.clips.jumpLoop ? 'jumpLoop' : 'idle', this.t * 0.35, ch.pose_, true)); }
    this.view?.update?.(raw);
    // the camera: up through the cloth into the reading (and down again on the way back)
    const e = smooth(this.k), C = this.camera;
    C.position.copy(_a.fromArray(AT.from).lerp(_b.fromArray(AT.pos), e));
    C.lookAt(_a.fromArray(AT.fromLook).lerp(_l.fromArray(AT.look), e));
  }
  render() { this.game.post.render(this.scene, this.camera); }

  /** What of the view is under a point of the screen (a place to drop a card on, a card of the hand), asked between frames too. */
  pickAt(x, y) {
    if (!this.active || !this.view?.pick) return null;
    this.camera.updateMatrixWorld(); this.scene.updateMatrixWorld();
    _ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    _ray.setFromCamera(_ndc, this.camera);
    return this.view.pick(_ray) || null;
  }
  /** The view's places on the screen (for the window's labels), in client pixels. */
  anchors() { if (!this.active || !this.view?.anchors) return []; this.camera.updateMatrixWorld(); return this.view.anchors(this.camera, innerWidth, innerHeight); }
}
