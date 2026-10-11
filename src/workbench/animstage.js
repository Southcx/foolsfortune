// ---------------------------------------------------------------------------------------
// THE ANIM LAB: the Workbench's stage for reviewing the Courier's animation without playing for it (the owner's review, 2026-10-11:
// "pick a tool and a move or stance, play, scrub frame by frame, front, side and top, every other tool hidden"). The Courier on it is a
// rig of the lab's own run through the game's own animation stack (workbench/animrig.js: character.js's layers, the stances, the IK,
// the hinge repair and rom.js last; each tool's own class and combo engine), so what it shows is what the game shows. A play
// (workbench/animplays.js) is recorded as a take (workbench/animtake.js) and laid back frame by frame; the body is pinned where it
// stands, its travel drawn as a ghost line (the hips' path, and its shadow on the floor) and the floor's grid carried under the feet.
//
//   the views    FRONT, SIDE (their right), TOP (orthographic, framed to the take), THREE-QUARTER, and FREE (the Workbench's orbit)
//   the marks    a floor grid (10 cm, a metre bolder), the midline (the body's centre plane, faint, turned with the body), the travel,
//                and the overlays (workbench/animoverlay.js: the bones' axes; the pose audit's, when it is in)
//   the snapshot the frame on show from the front, the side and above, one PNG
// Its controls are workbench/animpanel.js; its keys: Space play, the arrows a frame (Shift: ten), Home and End.
//
// Prior art: Unreal's Animation Editor and Persona's timeline (the preview scene, play, step, scrub with the frame number, the playback
// speed, the viewport's orthographic front, side and top, Show > Bones), Blender's dope sheet scrub (frame by frame, Home and End) and
// its numpad views, Maya's turnaround cameras; the contact sheet of scripts/posesheet.mjs.
//
//   animStage(game) -> Object3D (the Workbench's MODELS list: 'anim:lab'), its `userData.lab`: the AnimLab
//   lab.setTool('sondelass:cutlass')  lab.choose(playId)  lab.play(on)  lab.step(n)  lab.seek(k)  lab.setView('side')  lab.snapshot()
//   lab.ready (a promise: the rig built)  lab.take  lab.frame
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { AnimRig } from './animrig.js';
import { playsFor } from './animplays.js';
import { recordTake, applyFrame } from './animtake.js';
import { ANIM_OVERLAYS, OverlayLayer } from './animoverlay.js';
import { AnimPanel } from './animpanel.js';

export const VIEWS = ['front', 'side', 'top', 'three', 'free'];
const SPEEDS = [0.1, 0.25, 0.5, 1];
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

/** The floor: a grid a metre a tile, ten lines to the metre, the metre bolder; carried under the pinned feet by the travel. */
function makeFloor() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#24151b'; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(255,220,180,.09)'; x.lineWidth = 2;
  for (let i = 1; i < 10; i++) { const p = i * 51.2; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 512); x.moveTo(0, p); x.lineTo(512, p); x.stroke(); }
  x.strokeStyle = 'rgba(255,215,140,.32)'; x.lineWidth = 3; x.strokeRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.name = 'animlab.floor';
  return m;
}

/** The midline: the body's centre plane (x = 0 in the body's frame), faint, its edges and its line on the floor brighter. */
function makeMidline() {
  const g = new THREE.Group(); g.name = 'animlab.midline';
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.3), new THREE.MeshBasicMaterial({ color: 0x9fd7ff, transparent: true, opacity: 0.012, depthWrite: false, side: THREE.DoubleSide }));
  fill.rotation.y = Math.PI / 2; fill.position.y = 1.15; g.add(fill);
  const P = [[0, 0, -1.3], [0, 0, 1.3], [0, 2.3, -1.3], [0, 2.3, 1.3], [0, 0, -1.3], [0, 2.3, -1.3], [0, 0, 1.3], [0, 2.3, 1.3]].flat();
  const edge = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(P, 3)), new THREE.LineBasicMaterial({ color: 0x9fd7ff, transparent: true, opacity: 0.15, depthWrite: false }));
  const ground = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.004, -1.6), new THREE.Vector3(0, 0.004, 1.6)]), new THREE.LineBasicMaterial({ color: 0x9fd7ff, transparent: true, opacity: 0.7 }));
  g.add(edge, ground); g.userData.fill = fill; g.userData.edge = edge;
  return g;
}

export class AnimLab {
  constructor(game) {
    this.game = game; this.wb = game.workbench;
    const root = (this.root = new THREE.Group()); root.name = 'animlab';
    root.userData = { placed: true, bare: true, lab: this, view: { pos: new THREE.Vector3(2.4, 1.7, 3.6), look: new THREE.Vector3(0, 1, 0) },
      tick: (t) => this.tick(t), dispose: () => this.dispose(), camera: () => this.camera() };
    this.carry = new THREE.Group(); this.carry.name = 'animlab.carry'; root.add(this.carry); // (the rig's frame, moved back by the travel: the body pinned)
    this.floor = makeFloor(); root.add(this.floor);
    this.midline = makeMidline(); root.add(this.midline);
    this.ghost = new THREE.Group(); this.carry.add(this.ghost);
    this.overlay = new OverlayLayer(root);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 60); this.persp = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.state = { tool: 'none', others: false, playId: 'stance:idleA', playing: true, loop: true, speed: 1, view: 'three', show: { grid: true, midline: true, travel: true }, overlays: new Set() };
    this.take = null; this.frame = 0; this.playT = 0; this.lastT = null; this.marks = new Map(); this.fit = { y0: -0.1, y1: 2.15 };
    this.panel = new AnimPanel(this);
    this.onKey = (e) => this.key(e); addEventListener('keydown', this.onKey, true);
    this.offDrag = () => { if (this.state.view !== 'free') this.setView('free'); }; // (a drag takes the Workbench's orbit)
    this.wb?.controls?.addEventListener('start', this.offDrag);
    this.panel.say('building the Courier (the suite, the stances)…');
    this.ready = AnimRig.create(game, this.carry).then((R) => {
      if (this.gone) { R.dispose(); return; }
      this.R = R; R.rig.root.traverse((o) => { if (o.isMesh) { o.userData.mat0 = o.material; o.frustumCulled = false; } }); // (the Workbench's VIEW keeps each mesh's own)
      this.setTool(this.state.tool);
    }).catch((e) => { console.error(e); this.panel.say(`could not build it: ${e.message}`); });
  }

  // ------------------------------------------------------------------ what plays
  /** The tool in the hands: 'none' (the kick), 'psygun', 'sondelass:cutlass' | ':rod' | ':hook', 'soulbrush', ... The play is recorded again. */
  setTool(key) {
    const R = this.R; this.state.tool = key;
    if (!R) return;
    const [id, form] = key.split(':');
    R.wear(id === 'none' ? null : id, form || (id === 'sondelass' ? 'cutlass' : null), { others: this.state.others });
    for (const t of Object.values(R.made)) t.model?.group?.traverse?.((o) => { if (o.isMesh && !o.userData.mat0) { o.userData.mat0 = o.material; o.frustumCulled = false; } });
    this.plays = playsFor(R);
    this.panel.tools(); this.panel.list();
    if (!this.plays.find((p) => p.id === this.state.playId)) this.state.playId = 'stance:idleA';
    this.choose(this.state.playId);
  }
  setOthers(on) { this.state.others = on; this.setTool(this.state.tool); }

  /** Record a play and show it from its first frame (a play that names its tool, the drawn run, puts that tool in the hands first). */
  choose(id) {
    const R = this.R, play = this.plays?.find((p) => p.id === id);
    if (!R || !play) return;
    if (play.tool && play.tool !== this.state.tool) { this.state.playId = id; this.setTool(play.tool); return; }
    this.state.playId = id;
    this.panel.say(`recording: ${play.label}…`); this.panel.list();
    clearTimeout(this.pending);
    this.pending = setTimeout(() => this.record(play), 20); // (the panel says so first: a take is recorded at once, frame after frame)
  }

  record(play) {
    const R = this.R, t0 = performance.now();
    try { this.take = recordTake(R, play); } catch (e) { console.error(`animlab: ${play.id}: ${e.stack || e}`); this.panel.say(`could not play it: ${e.message}`); return; }
    const T = this.take, ys = Array.from({ length: T.n }, (_, k) => T.hipsAt(k, _v).y);
    this.fit = { y0: Math.min(0, Math.min(...ys) - 1.05) - 0.12, y1: Math.max(2.05, Math.max(...ys) + 1.0) + 0.12 }; // (the views framed to the body over the whole take)
    this.ghostLine(); this.marks.clear(); this.timelines = null;
    this.playT = 0; this.frame = -1; this.state.playing = true;
    this.seek(0);
    this.panel.say(`${play.label}: ${T.n} frames (${(T.n / T.fps).toFixed(2)} s), recorded in ${Math.round(performance.now() - t0)} ms`);
    this.panel.scrub();
  }

  /** The travel: the hips' path over the take, and its shadow on the floor (in the rig's frame: it slides back under the pinned body). */
  ghostLine() {
    for (const c of [...this.ghost.children]) { this.ghost.remove(c); c.geometry.dispose(); c.material.dispose(); }
    const T = this.take, hips = [], floor = [];
    for (let k = 0; k < T.n; k++) { const h = T.hipsAt(k, new THREE.Vector3()); hips.push(h); floor.push(new THREE.Vector3(h.x, 0.006, h.z)); }
    const far = floor[floor.length - 1].distanceTo(floor[0]) > 0.05 || Math.abs(hips[hips.length - 1].y - hips[0].y) > 0.05;
    this.ghost.visible = far && this.state.show.travel;
    if (!far) return;
    const line = (pts, color, opacity) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    this.ghost.add(line(hips, 0xffd76a, 0.85), line(floor, 0xffd76a, 0.4));
    const end = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    end.rotation.x = -Math.PI / 2; end.position.copy(floor[floor.length - 1]); this.ghost.add(end);
  }

  // ------------------------------------------------------------------ the transport
  play(on = !this.state.playing) { if (on && this.take && this.frame >= this.take.n - 1 && !this.state.loop) this.playT = 0; this.state.playing = on; this.panel.transport(); }
  step(n) { this.state.playing = false; this.seek(this.frame + n); this.panel.transport(); }
  setLoop(on) { this.state.loop = on; this.panel.transport(); }
  setSpeed(x) { this.state.speed = SPEEDS.includes(x) ? x : 1; this.panel.transport(); }

  /** Show frame k (clamped): the pose laid back, the body pinned, the marks for it. */
  seek(k) {
    const T = this.take; if (!T) return;
    k = Math.max(0, Math.min(T.n - 1, Math.round(k)));
    if (!this.state.playing) this.playT = k / T.fps;
    if (k === this.frame) return;
    this.frame = k;
    const tr = T.travelAt(k, _v);
    this.carry.position.set(-tr.x, 0, -tr.z); this.carry.updateMatrixWorld(true);
    applyFrame(this.R, T, k);
    this.floor.position.set(-(tr.x % 1), 0, -(tr.z % 1)); // (the grid under the feet goes by as the treadmill does)
    _e.setFromQuaternion(_q.fromArray(T.frames[k], 3), 'YXZ'); this.midline.rotation.y = _e.y; // (turned with the body's facing)
    this.drawOverlays();
    this.panel.frame();
  }

  // ------------------------------------------------------------------ the marks
  toggle(what) { this.state.show[what] = !this.state.show[what]; this.applyShow(); this.panel.shows(); }
  toggleOverlay(id) { const S = this.state.overlays; if (S.has(id)) S.delete(id); else S.add(id); this.marks.clear(); this.timelines = null; this.drawOverlays(); this.panel.shows(); this.panel.scrub(); }
  applyShow() {
    const s = this.state.show;
    this.floor.visible = s.grid;
    this.midline.visible = s.midline;
    this.midline.userData.fill.visible = this.midline.userData.edge.visible = this.state.view !== 'side'; // (face on from the side: only its line on the floor)
    this.ghost.visible = s.travel && this.ghost.children.length > 0;
  }

  /** Each overlay on, measured on the frame on show (cached by frame) and drawn. */
  drawOverlays() {
    const R = this.R, marks = [];
    if (R && this.take) for (const id of this.state.overlays) {
      const o = ANIM_OVERLAYS.get(id); if (!o) continue;
      const key = `${id}|${this.frame}`;
      if (!this.marks.has(key)) { try { this.marks.set(key, o.measure(this.ctx()) || []); } catch (e) { console.warn('animlab overlay', id, e); this.marks.set(key, []); } }
      marks.push(...this.marks.get(key));
    }
    this.overlay.draw(marks);
  }
  ctx() { const R = this.R; return { rig: R.rig, tool: R.toolModel, toolId: R.toolId, frame: this.frame, take: this.take }; }

  /** The overlays' timelines for the scrub bar (each frame's worst, 0..1), measured once a take for those that give one. */
  timeline() {
    if (this.timelines) return this.timelines;
    const T = this.take, out = [];
    if (T) for (const id of this.state.overlays) {
      const o = ANIM_OVERLAYS.get(id);
      if (!o?.timeline) continue;
      const keep = this.frame;
      try { out.push(o.timeline(T, (k) => { this.frame = -1; this.seek(k); return this.ctx(); })); } catch (e) { console.warn('animlab timeline', id, e); }
      this.frame = -1; this.seek(keep);
    }
    return (this.timelines = out);
  }

  // ------------------------------------------------------------------ the views
  setView(v) { this.state.view = VIEWS.includes(v) ? v : 'free'; this.applyShow(); this.panel.views(); }

  /** The camera the Workbench draws through (null: its own, the FREE orbit). Framed to the take: the orthographic views to the body's
   *  height over the whole take, a margin round it. */
  camera(view = this.state.view, aspect = innerWidth / innerHeight, { ui = true } = {}) {
    if (view === 'free') return null;
    const { y0, y1 } = this.fit, lift = ui ? 0.17 : 0, half = (y1 - y0) / 2 / (1 - lift), cy = (y0 + y1) / 2 - half * lift; // (on screen, the transport bar covers the bottom: the body is framed above it)
    if (view === 'three') {
      const C = this.persp, d = (half * 1.25) / Math.tan((C.fov * Math.PI) / 360);
      C.aspect = aspect; C.position.set(-0.62, 0.3, 0.72).normalize().multiplyScalar(d).add(_v.set(0, cy, 0)); C.up.set(0, 1, 0); C.lookAt(0, cy, 0); C.updateProjectionMatrix();
      return C;
    }
    const C = this.ortho, h = view === 'top' ? 1.75 : half * 1.06;
    C.left = -h * aspect; C.right = h * aspect; C.top = h; C.bottom = -h;
    if (view === 'front') { C.position.set(0, cy, 20); C.up.set(0, 1, 0); C.lookAt(0, cy, 0); }
    else if (view === 'side') { C.position.set(-20, cy, 0); C.up.set(0, 1, 0); C.lookAt(0, cy, 0); } // (their right: +X is their left)
    else { C.position.set(0, 25, 0); C.up.set(0, 0, 1); C.lookAt(0, 0, 0); } // (from above, their front up the screen)
    C.near = 0.05; C.far = 60; C.updateProjectionMatrix(); C.updateMatrixWorld(true);
    return C;
  }

  /** The frame on show from the front, the side and above, side by side, as one PNG (a data URL; `download`: saved too). */
  snapshot({ download = true } = {}) {
    const g = this.game, r = g.renderer, cv = r.domElement, W = cv.width, H = cv.height, pw = Math.round(H * 0.75), head = 22;
    const out = document.createElement('canvas'); out.width = pw * 3; out.height = H + head;
    const x = out.getContext('2d'); x.fillStyle = '#1a0f16'; x.fillRect(0, 0, out.width, out.height);
    const was = this.state.view;
    ['front', 'side', 'top'].forEach((v, i) => {
      this.state.view = v; this.applyShow();
      g.post.render(this.wb.scene, this.camera(v, W / H, { ui: false }));
      x.drawImage(cv, (W - pw) / 2, 0, pw, H, i * pw, head, pw, H);
    });
    this.state.view = was; this.applyShow();
    const T = this.take, play = T?.play;
    x.fillStyle = '#f3e6d8'; x.font = '13px monospace';
    x.fillText(`${play?.label || ''} · ${this.state.tool} · frame ${this.frame} / ${(T?.n || 1) - 1} · ${(this.frame / (T?.fps || 60)).toFixed(3)} s · front, side, top`, 6, 15);
    const url = out.toDataURL('image/png');
    if (download) { const a = document.createElement('a'); a.href = url; a.download = `animlab-${(play?.id || 'frame').replace(/[^a-z0-9]+/gi, '-')}-f${this.frame}.png`; a.click(); }
    return url;
  }

  // ------------------------------------------------------------------ every frame, and the keys
  tick(t) {
    const dt = this.lastT == null ? 0 : Math.max(0, Math.min(0.1, t - this.lastT)); this.lastT = t;
    const T = this.take; if (!T) return;
    if (this.state.playing) {
      this.playT += dt * this.state.speed;
      let k = Math.floor(this.playT * T.fps);
      if (k >= T.n) { if (this.state.loop) { this.playT %= T.n / T.fps; k = Math.floor(this.playT * T.fps); } else { k = T.n - 1; this.state.playing = false; this.panel.transport(); } }
      this.seek(k);
    }
  }

  key(e) {
    if (!this.wb?.open || this.wb.model !== this.root || /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) return;
    const n = e.shiftKey ? 10 : 1;
    if (e.code === 'Space') { this.play(); e.preventDefault(); e.stopPropagation(); }
    else if (e.code === 'ArrowRight') { this.step(n); e.preventDefault(); }
    else if (e.code === 'ArrowLeft') { this.step(-n); e.preventDefault(); }
    else if (e.code === 'Home') { this.step(-1e6); e.preventDefault(); }
    else if (e.code === 'End') { this.step(1e6); e.preventDefault(); }
  }

  dispose() {
    this.gone = true; clearTimeout(this.pending);
    removeEventListener('keydown', this.onKey, true);
    this.wb?.controls?.removeEventListener('start', this.offDrag);
    this.panel.dispose(); this.overlay.dispose(); this.R?.dispose();
  }
}

/** The stage for the Workbench (stages.js 'anim:lab'). */
export function animStage(game) { return new AnimLab(game).root; }
