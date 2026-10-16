// ---------------------------------------------------------------------------------------
// THE OVERLAY'S SCENE: the overlay's own 3D layer (docs/plans/OVERLAY.md 15.2: the owner, 2026-10-16, "a combo of 3D elements for
// things like window bordering or a lachrimeter reservoir"). Real meshes in the interface, lit and turning: a System window's frame, the
// Lachrimeter's glass reservoir, a Possibilikey's small turning model. A scene of its own, with its own light and camera, drawn into the
// canvas after the world and its post pass (render/glow.js calls it last), so the glow and the grade never take it, and at the
// 480-line present (render/present.js) so it pixelates as the world does. Petra's layer; the meshes on it are Calissa's.
//
// Its units are the page's CSS pixels: x right, y down from the anchor, as the HTML HUD is laid out, so a mesh can sit on a DOM
// element (its rect followed each frame). The camera is orthographic, looking down -z; a mesh's depth is ±500 px of z. It draws only
// while something visible is in it: an empty layer costs no pass at all.
//
// What it is not: it is drawn into the canvas, so the HTML over the canvas (the log, a window's words, a veil) is drawn over it. A
// window's words sit on its 3D frame; a veil darkens a frame under it (keep a window's frame out of its own veil, or the veil off).
// Materials here are usually `toneMapped: false` (the interface's colours are the window colour's, not the sun's exposure).
//
// Prior art: Dead Space's RIG (the interface as lit objects), Metroid Prime's visor, Ratchet & Clank's quick-select (3D models in a ring),
// Persona 5's menus; in three.js, the two-scene HUD (an orthographic scene rendered over the main one after clearDepth).
//
//   const S = new OverlayScene(game, renderer)   game.overlayScene
//   S.add(obj, { anchor, x, y, z, el, hud, update }) -> slot    S.remove(obj)    S.render(renderer)   (Glow, last)    S.compile(renderer)
//     anchor: 'tl' | 'tr' | 'bl' | 'br' | 'c' (of the viewport, or of `el`'s rect when given); x, y: CSS px from it (y down)
//     el: a DOM element or a selector, followed each frame (`slot.rect` its rect then, or null while it is not laid out: the slot hides)
//     hud: true (default) hides it with the HUD (F2, a want: feedback/hideui.js); false keeps it, as the letterbox is kept
//     update(dt, slot): each frame it is drawn, before it is placed (slot.rect, slot.view = { w, h })
//   S.key, S.fill: its own lights (a key from the upper left, a hemisphere fill)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const ANCHOR = { tl: [0, 0], tr: [1, 0], bl: [0, 1], br: [1, 1], c: [0.5, 0.5] };

export class OverlayScene {
  constructor(game, renderer) {
    this.game = game; this.r = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
    this.camera.position.set(0, 0, 500);
    this.key = new THREE.DirectionalLight(0xffffff, 2.2); this.key.position.set(-0.45, 0.6, 1);
    this.fill = new THREE.HemisphereLight(0xffffff, 0x404050, 0.9);
    this.scene.add(this.key, this.fill);
    this.slots = new Map();
    this.last = performance.now(); this.w = 0; this.h = 0;
  }

  add(obj, { anchor = 'tl', x = 0, y = 0, z = 0, el = null, hud = true, update = null } = {}) {
    const slot = { obj, anchor: ANCHOR[anchor] || ANCHOR.tl, x, y, z, el, hud, update, rect: null, view: { w: 0, h: 0 } };
    this.slots.set(obj, slot); this.scene.add(obj);
    return slot;
  }
  remove(obj) { if (!this.slots.delete(obj)) return; this.scene.remove(obj); }

  /** The HUD is off the screen (F2, or a feature's want): body.ui1 / body.ui2, as hideui.js sets them; level 2 hides even the kept. */
  hidden(slot) {
    const B = document.body.classList;
    return B.contains('ui2') || (slot.hud && B.contains('ui1') && !B.contains('uilog'));
  }

  /** Place every slot for this frame; true if anything is to be drawn. */
  place(dt) {
    const cv = this.r.domElement, w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
    if (w !== this.w || h !== this.h) {
      this.w = w; this.h = h; const C = this.camera;
      C.left = 0; C.right = w; C.top = 0; C.bottom = -h; C.updateProjectionMatrix();
    }
    let any = false;
    for (const s of this.slots.values()) {
      s.view.w = w; s.view.h = h;
      let ox = 0, oy = 0, aw = w, ah = h;
      if (s.el) {
        const el = typeof s.el === 'string' ? document.querySelector(s.el) : s.el, R = el?.getBoundingClientRect?.();
        s.rect = R && R.width > 0 && R.height > 0 ? { x: R.left, y: R.top, w: R.width, h: R.height } : null;
        if (s.rect) { ox = s.rect.x; oy = s.rect.y; aw = s.rect.w; ah = s.rect.h; }
      }
      const show = !this.hidden(s) && (!s.el || !!s.rect);
      if (show && s.update) s.update(dt, s);
      s.obj.visible = show && s.obj.userData.overlayHidden !== true;
      if (!s.obj.visible) continue;
      s.obj.position.set(ox + s.anchor[0] * aw + s.x, -(oy + s.anchor[1] * ah + s.y), s.z);
      any = true;
    }
    return any;
  }

  /** Drawn over whatever is in the canvas (Glow's last pass): the depth cleared, the colour kept. Nothing visible: nothing drawn. */
  render(renderer = this.r) {
    if (!this.slots.size) return;
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    if (!this.place(dt)) return;
    const auto = renderer.autoClear; renderer.autoClear = false;
    renderer.clearDepth(); renderer.render(this.scene, this.camera);
    renderer.autoClear = auto;
  }

  /** The warm-up: its programs compiled against the canvas, as it is drawn (main.js, beside the glow's own). */
  compile(renderer = this.r) {
    if (!this.slots.size) return;
    const was = renderer.getRenderTarget(); renderer.setRenderTarget(null);
    renderer.compile(this.scene, this.camera); renderer.setRenderTarget(was);
  }
}
