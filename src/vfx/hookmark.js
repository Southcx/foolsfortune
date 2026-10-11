// ---------------------------------------------------------------------------------------
// THE HOOK'S MARK: the hook's own UI (the owner, 2026-10-11: "each tool should have its own UI according to what it does, much like the
// Dreamvane already"; docs/plans/MELEE-LOADOUT.md section 4). While the Sondelass's hook form is in the hands with no line out, a small
// ring in the Mind's lines sits on the point the grapnel would bite, within its reach, wherever the aim falls: the same probe the throw
// itself makes (tools/sondelass/hookshot.js `probe()`: a ray from the eye along the aim, 40 m, through the world, the loose things and the
// creatures, the Courier's own body passed), so the mark never says other than the hook does.
//
//   THE RING        on the bite, a fixed size on the screen (in pixels of the 480 lines the scene is drawn at, render/present.js), a
//                   point at its heart. Solid ground, a wall, a heavy thing: an ANCHOR, the line takes them to it.
//   THE BRACKETS    four corners closing on the ring when what it would bite is a CATCH (under 60 kg, a clapperjar, a light creature:
//                   the line brings it to them), as the lock-on's bracket reticle closes on a target (ui/icons/keywordart.js lockon).
//                   They close in once as the catch is found, then hold (docs/ART.md precept 3: a wireframe bursts in once, then holds).
//   DIM             the pool too low to throw (hookshot.js COST): the same mark, faint.
//
// No words and no numbers; it sits on the thing (CLAUDE.md, Feedback: marks in the world). Drawn with the wire compass's one material
// (vfx/wirecompass.js `compassMaterial`, `keyUnder`): lines of the Mind's labradorite, pale light with a dark keyline a pixel out each way,
// so it reads on noon sand and in the basement's dark alike (casebook rule 105); its ink is its own, always pale (the compass's turns with
// the sky behind the tape, not with the ground the mark sits on). No shader program of its own. Gone the frame the hook form leaves the
// hands (the belt says), a line goes out, or the god hand or a framed shot takes the view.
//
// Prior art, as on a museum label:
//   The Legend of Zelda: Ocarina of Time's and Twilight Princess's hookshot sight: a mark on the surface the hook would reach, changed when
//   the target is one it can catch.
//   Rez's lock squares and Panzer Dragoon's lock-on (vfx/wiremarks.js): a reticle of the Mind's lines held a fixed size on the screen.
//   The keyline of comics and signage (the wire compass's: a light line with a dark one under it reads on any ground).
//
//   const m = new HookMark(game)   m.update(rawDt)   m.read() -> { shown, kind, at, dim }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { compassMaterial, compassLines, keyUnder, COMPASS_U } from './wirecompass.js';
import { mindTick } from './labradorite.js';

const LINES = 480;                 // (the scene's lines: render/present.js; the mark is sized in them, whatever the window)
const RING = 6, DOT = 1.3;         // the ring's radius and its heart's, in those pixels
const CORNER = 11, ARM = 4;        // the brackets' corners (at +-CORNER, +-CORNER) and their arms' length
const BURST = 0.14;                // real s a ring or the brackets close in from wide
const COST = 2;                    // (the throw's Lachryma: hookshot.js COST)
const _px = new THREE.Vector2();

const seg = (a, b) => [new THREE.Vector3(a[0], a[1], 0), new THREE.Vector3(b[0], b[1], 0)];
function ringGeo() {
  const pts = [], n = 20;
  for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; pts.push(...seg([Math.cos(a0) * RING, Math.sin(a0) * RING], [Math.cos(a1) * RING, Math.sin(a1) * RING])); }
  const D = [[0, DOT], [DOT, 0], [0, -DOT], [-DOT, 0]]; // (its heart: a small diamond)
  for (let i = 0; i < 4; i++) pts.push(...seg(D[i], D[(i + 1) % 4]));
  return compassLines(new THREE.BufferGeometry().setFromPoints(pts));
}
function bracketGeo() {
  const pts = [];
  for (const sx of [1, -1]) for (const sy of [1, -1]) { const c = [sx * CORNER, sy * CORNER]; pts.push(...seg(c, [sx * (CORNER - ARM), sy * CORNER]), ...seg(c, [sx * CORNER, sy * (CORNER - ARM)])); }
  return compassLines(new THREE.BufferGeometry().setFromPoints(pts));
}

export class HookMark {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group(); this.group.visible = false; this.group.userData.zoneFree = true; this.group.renderOrder = 36;
    const INK = { value: 0 }; // (its own ink: always pale light over a dark keyline, whatever the compass's tape is doing)
    const make = (geo, alpha, keyA) => {
      const mat = compassMaterial({ alpha }); mat.uniforms.uInk = INK;
      const m = new THREE.LineSegments(geo, mat); m.renderOrder = 36; m.frustumCulled = false; m.userData.zoneFree = true;
      const k = keyUnder(m, { alpha: keyA }); k.material.uniforms.uInk = INK;
      this.group.add(m);
      return m;
    };
    this.ringA = { value: 0 }; this.ringKey = { value: 0 }; this.brA = { value: 0 }; this.brKey = { value: 0 };
    this.ring = make(ringGeo(), this.ringA, this.ringKey);
    this.brackets = make(bracketGeo(), this.brA, this.brKey);
    game.scene.add(this.group);
    this.at = new THREE.Vector3(); this.kind = null; this.dim = false;
    this.a = 0; this.br = 0; this.ringT = 0; this.brT = 0;
  }

  /** The hook form in the hands with no line out, as the belt says: its hookshot, or null. */
  hook() {
    const g = this.game, tool = g.techs?.get?.('sondelass');
    if (!tool || g.belt?.inHand?.id !== 'sondelass' || !tool.held || tool.drawTarget <= 0 || tool.form !== 'hook') return null;
    if (tool.hookshot.busy || g.god?.controlling || g.cinema?.active || document.body.classList.contains('cine')) return null;
    return tool.hookshot;
  }

  update(dt) {
    const g = this.game, hs = this.hook(), r = hs ? hs.probe() : null;
    if (!r) { this.hide(); return; }
    mindTick();
    const fresh = !this.group.visible || this.a <= 0;
    this.at.copy(r.point); this.dim = (g.lachryma?.available ?? 0) < COST;
    if (fresh) this.ringT = 0; else this.ringT += dt;
    if (r.kind === 'pull' && this.kind !== 'pull') this.brT = 0; else this.brT += dt;
    this.kind = r.kind;
    this.a = this.dim ? 0.35 : 1;
    this.br = r.kind === 'pull' ? 1 : 0;
    // placed on the bite, facing the eye, sized in the scene's pixels
    const cam = g.camera, s = (2 * cam.position.distanceTo(this.at) * Math.tan((cam.fov * Math.PI) / 360)) / LINES;
    this.group.position.copy(this.at); this.group.quaternion.copy(cam.quaternion); this.group.scale.setScalar(s);
    const close = (t) => 1 + 0.6 * (1 - THREE.MathUtils.smoothstep(t, 0, BURST)); // (in once, from wide, then held)
    this.ring.scale.setScalar(close(this.ringT));
    this.brackets.scale.setScalar(close(Math.min(this.brT, this.ringT)));
    this.brackets.visible = this.br > 0;
    const inR = THREE.MathUtils.smoothstep(this.ringT, 0, BURST), inB = THREE.MathUtils.smoothstep(Math.min(this.brT, this.ringT), 0, BURST);
    this.ringA.value = this.a * inR; this.ringKey.value = 0.8 * this.a * inR;
    this.brA.value = this.a * inB * this.br; this.brKey.value = 0.8 * this.a * inB * this.br;
    g.renderer?.getDrawingBufferSize(_px); if (_px.x > 0) COMPASS_U.uPx.value.set(2 / _px.x, 2 / _px.y); // (the keyline a pixel of the frame out: as the compass sets it)
    this.group.visible = true;
  }

  hide() { if (this.group.visible) { this.group.visible = false; this.a = 0; this.kind = null; } }

  /** What the eye can read off the mark now (for a test): shown, the kind of bite (anchor | pull), where, and whether it is dim. */
  read() { return { shown: this.group.visible, kind: this.group.visible ? this.kind : null, at: this.group.visible ? [this.at.x, this.at.y, this.at.z].map((v) => +v.toFixed(2)) : null, dim: this.dim }; }
}
