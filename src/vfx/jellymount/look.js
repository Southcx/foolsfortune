// ---------------------------------------------------------------------------------------
// THE SLIP JELLY MOUNT'S LOOK (Petra's handoff of 2026-10-30, docs/handoffs/everyone/2026-10-30-from-petra-jelly-mount.md): the slip
// jelly mount's body and moments dressed over Petra's runtime (courier/jellymount/jellymount.js: THE CALL, THE RIDE, ITS LIFE, THE END),
// read from it and its events (`mount.*`, each with `mount: 'slipjelly'`), never changing a rule. Espada's lines stand in the log.
//
//   ITS BODY     Petra's mesh and material, the wild slip jelly's own (creatures/jelly/deform.js: wet sand over Lachryma, always
//                melting), so it reads as one of them; `body.mat` stays the object Petra's tick tints toward a paint's feeling. One mark
//                says it is yours: YOUR SEAL (world/cradles.js `mine`, drawn by vfx/sealface.js) pressed into both haunches as a brand
//                is (a horse's, the potter's chop on a pot's foot), in the hanko's vermilion, the grooves wet and glossy so the
//                Lachryma's schiller catches in them, the melt's streaks running over it now and then; it never scrolls (it is pressed
//                into the body, in the body's own space). A program of its own ('jelly-melt2-seal', warmed at boot)
//   THE CALL     it wells up out of the ground: a puddle of it spreading under the Courier (vfx/jellymount/puddles.js), the sand
//                pushed up and out in a ring, wet drops thrown off it, and the body growing out of the puddle, wide and flat first and
//                drawn up under the seat as the Courier is lifted, its crown always under them; the puddle soaks away once it stands
//   THE RIDE     it leaves the ground with its rider on a hop (stretched a little rising, squashed falling) and splashes at the
//                take-off and the landing; a blow taken for the rider flashes it and knocks drops off it (Petra's wobble); crude drunk
//                is drawn in across the ground to its foot in the oil film's colours, the film flashing faintly through it
//   THE SLUMP    any end but a burst: it melts down and out into a puddle as the Courier is set down, and the puddle soaks into the
//                ground over about a real second once the body is gone
//   THE BURST    its life at none: gobs of its body and a fine spray flung out in its colour, a low ring of drops over the ground, a
//                small shake, a wide puddle left soaking in (Petra's placeholder dust in burst() is hers, to go when she agrees)
//   THE CHOICE   Y held: the mounts' ring round the Courier (vfx/jellymount/ring.js), the Solar Skiff on the left, the jelly on the
//                right, the lit one lifted
// Where Petra's tick places the body each frame, this runs after it and sets its place and size in the call, the slump and the air
// only (the look of those moments): on the ground in the ride hers stands.
//
// Prior art: the wild slip jelly's own body and burst (creatures/jelly/slipjelly.js), Yoshi's eggs and Dragon Quest's slimes (a mount
// that is a body: squash, stretch, a splat), a rancher's brand and the hanko's seal on a pot (whose it is, pressed in), Splatoon's
// squid rising out of its ink, and Super Mario Sunshine's goop that soaks away.
//
//   game.jellyMountLook = new JellyMountLook(game)   (boot/creatures.js, once the wild jellies' mesh is in)   .update(rawDt) (boot/frame.js,
//   after the techs' tick)   .prewarm() -> undo (boot/warmup.js)   .ring (MountRing: show(pick), set(pick), close())   .puddles   .read()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { JELLY_MOUNT } from '../../progress/jellymount.js';
import { drawSealFace } from '../sealface.js';
import { featTint } from '../oxidation.js';
import { SlipPuddles } from './puddles.js';
import { MountRing } from './ring.js';

/** The look's numbers: the seat over the ground (Petra's SEAT, the jelly's crown); the seal's place on the body (its middle's height
 *  and its size, metres in the body's own space; the haunches' angle off the tail), strength and its ink's field; the body's widening as it wells up and
 *  as it slumps; its stretch in the air; the moments' puddles (radius m, spread, hold and soak real s); the flash's and the drink's fade. */
export const JELLY_LOOK = {
  seat: 1.35,
  seal: { at: 0.66, size: 0.36, haunch: 0.7, k: 0.85, field: 0.7, ink: 0xe0442a },
  well: 0.55, slump: 0.6, stretch: { k: 0.025, lo: -0.12, hi: 0.16 },
  puddle: { call: { r: 1, spread: 0.35, soak: 0.9 }, slump: { r: 1.15, spread: 0.45, hold: 3, soak: 1 }, burst: { r: 1.6, spread: 0.16, hold: 0.35, soak: 1.8 }, gone: { r: 1, spread: 0.05, soak: 1 } },
  flash: 4, drink: { fade: 1.6, every: 0.2, film: 0.22 },
};
const MOUNT = 'slipjelly';
const BODY = new THREE.Color(0x8a6a45), _c = new THREE.Color(), _f = new THREE.Color(), _at = new THREE.Vector3(), _d = new THREE.Vector3();
const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

// the seal pressed into the haunches: its declarations, and its blend laid in after the melt's colour and before its gloss
const SEAL_DECL = /* glsl */`
uniform sampler2D uSealMap; uniform float uSealK; uniform vec3 uSealInk; uniform vec4 uSealSides; uniform vec2 uSealAt;`;
const SEAL_FRAG = /* glsl */`
{
	vec2 sp = vJP.xz, sd = vJP.xz / max( length( vJP.xz ), 1e-4 );
	float sl = 0.0;
	for ( int i = 0; i < 2; i ++ ) {
		vec2 n = i == 0 ? uSealSides.xy : uSealSides.zw;
		vec2 suv = vec2( dot( sp, vec2( n.y, -n.x ) ), vJP.y - uSealAt.x ) / uSealAt.y + 0.5;
		vec2 inb = step( vec2( 0.0 ), suv ) * step( suv, vec2( 1.0 ) );
		sl = max( sl, texture2D( uSealMap, suv ).a * smoothstep( 0.78, 0.9, dot( sd, n ) ) * inb.x * inb.y );
	}
	sl *= uSealK * ( 1.0 - 0.3 * jWet );
	diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * 0.5, sl * 0.45 );
	diffuseColor.rgb = mix( diffuseColor.rgb, uSealInk, sl * 0.6 );
	jWet = max( jWet, sl * 0.7 );
}
`;

export class JellyMountLook {
  constructor(game) {
    this.game = game; this.dressed = null; this.flash = 0; this.drinkK = 0; this.drinkT = 0; this.t = 0;
    this.phase = null; this.air = false; this.vy = 0; this.slumping = null; this.sealKey = null;
    this.puddles = new SlipPuddles(game);
    this.ring = new MountRing(game);
    // the seal's face, drawn once and again when it is carved (white: its alpha is the mark)
    this.sealCanvas = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
    this.sealTex = new THREE.CanvasTexture(this.sealCanvas);
    Object.assign(this.sealTex, { colorSpace: THREE.NoColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, anisotropy: 4 });
    const S = JELLY_LOOK.seal, a = Math.PI - S.haunch, b = Math.PI + S.haunch;
    this.sealU = {
      uSealMap: { value: this.sealTex }, uSealK: { value: S.k }, uSealInk: { value: new THREE.Color(S.ink) },
      uSealSides: { value: new THREE.Vector4(Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b)) }, uSealAt: { value: new THREE.Vector2(S.at, S.size) },
    };
    this.drawSeal();
    const ev = game.events, mine = (f) => (e) => { if (e?.mount === MOUNT) f(e); };
    ev?.on('mount.call', mine(() => this.onCall()));
    ev?.on('mount.hop', mine((e) => this.play('jellymount.hop', { power: 1 + 0.33 * (e.chain || 0) })));
    ev?.on('mount.hurt', mine(() => this.onHurt()));
    ev?.on('mount.burst', mine(() => this.onBurst()));
    ev?.on('mount.drink', mine((e) => this.onDrink(e)));
    ev?.on('mount.end', mine((e) => this.onEnd(e)));
    ev?.on('seal.carve', () => this.drawSeal());
  }
  get J() { return this.game.jellyMount; }

  // ------------------------------------------------------------------ the body
  /** Your seal (or its blank face, before one is carved), drawn white into its canvas when it changes. */
  drawSeal() {
    const seal = this.game.cradles?.mine || null, key = seal ? `${seal.name}|${seal.outline}|${seal.carving}` : '';
    if (key === this.sealKey) return;
    this.sealKey = key;
    const g = this.sealCanvas.getContext('2d'), face = seal || { name: '', outline: 'round', carving: 'relief' };
    g.clearRect(0, 0, 256, 256);
    // (its field of ink first, faint, the marks cut out of it: a seal's fine lines alone average to nothing at a few metres, its mips
    // all but empty; then the seal as it was carved, whole over it)
    g.save(); g.globalAlpha = JELLY_LOOK.seal.field; drawSealFace(g, { ...face, carving: 'intaglio' }, { size: 256, ink: '#ffffff' }); g.restore();
    drawSealFace(g, face, { size: 256, ink: '#ffffff' });
    this.sealTex.needsUpdate = true;
  }
  /** Petra's body dressed once it is made: its material's melt given the seal (the deform's own hook kept and run first). */
  dress() {
    const B = this.J?.body; if (!B?.mat || this.dressed === B.mat) return;
    // (it always stands under its rider, never in a zone of its own: placed by the zones, a body left in the Dunes, or parked at the
    // origin for the warm-up, read hidden at the next call (the zones' `visible` is its owner's and its zone's: render/zones.js), and a
    // tick that waits on `visible` never moved it out of that zone again)
    B.root.userData.zoneFree = true;
    const mat = B.mat, base = mat.onBeforeCompile, U = this.sealU;
    mat.onBeforeCompile = (sh, r) => {
      base?.call(mat, sh, r);
      const F = sh.fragmentShader;
      if (!F.includes('varying vec3 vJP') || !F.includes('float jWet') || !F.includes('#include <roughnessmap_fragment>')) return; // (an anchor gone: the plain melt, never a broken program: casebook rule 120)
      Object.assign(sh.uniforms, U);
      sh.fragmentShader = F.replace('#include <common>', `#include <common>${SEAL_DECL}`).replace('#include <roughnessmap_fragment>', `${SEAL_FRAG}#include <roughnessmap_fragment>`);
    };
    mat.customProgramCacheKey = () => 'jelly-melt2-seal'; // (its own key, never the wrapper's text: casebook rule 104)
    mat.needsUpdate = true;
    this.dressed = mat;
  }
  /** The body's colour now (its wet sand in the tint Petra's tick lays on it), as hex for the effects. */
  tintHex() { const m = this.J?.body?.mat; return _c.copy(BODY).multiply(m?.color ?? _f.setRGB(1, 1, 1)).getHex(); }
  /** The ground under the body now, and the Courier's place over it. */
  ground(out = _at) { const J = this.J, P = J?.P ?? this.game.player, p = P.renderPos ?? P.pos; return out.set(p.x, J?.groundY ?? p.y, p.z); }
  play(name, ctx = {}, at = null) {
    const pos = (at ?? this.ground()).clone();
    return this.game.vfx?.play(name, { pos, normal: new THREE.Vector3(0, 1, 0), dir: _d.set(0, 1, 0).clone(), tint: this.tintHex(), floor: this.J?.groundY ?? pos.y, ...ctx });
  }
  wet() { return SlipPuddles.wetOf(this.J?.body?.mat?.color ?? _f.setRGB(1, 1, 1), new THREE.Color()); }

  // ------------------------------------------------------------------ the moments
  onCall() {
    this.drawSeal();
    const J = this.J, A = JELLY_MOUNT.call.arrive, at = this.ground().clone();
    if ((J?.phaseT ?? 0) >= A) { this.play('jellymount.land', { power: 0.8 }); return; } // (it was left waiting at a door: it comes at once)
    const C = JELLY_LOOK.puddle.call;
    this.puddles.spawn(at, { r: C.r, spread: C.spread, hold: Math.max(0, A - C.spread - 0.15), soak: C.soak, color: this.wet() });
    this.play('jellymount.call', {}, at);
  }
  onHurt() {
    this.flash = 1;
    const J = this.J, P = J?.P ?? this.game.player, p = P.renderPos ?? P.pos;
    this.play('jellymount.hurt', {}, _at.set(p.x, p.y - JELLY_LOOK.seat * 0.45, p.z));
  }
  onBurst() {
    const at = this.ground().clone(), C = JELLY_LOOK.puddle.burst;
    this.slumping = null;
    this.puddles.spawn(at, { r: C.r, spread: C.spread, hold: C.hold, soak: C.soak, color: this.wet() });
    this.play('jellymount.burst', {}, at);
  }
  onDrink(e) {
    this.drinkK = 1;
    if (this.drinkT > 0) return;
    this.drinkT = JELLY_LOOK.drink.every;
    this.play('jellymount.drink', { power: Math.min(1.6, 0.8 + 0.2 * (e.cells || 1)) });
  }
  onEnd(e) {
    if (e.why === 'burst') return;
    if (this.slumping) this.slumping.soak(JELLY_LOOK.puddle.slump.soak);
    else { const C = JELLY_LOOK.puddle.gone; this.puddles.spawn(this.ground().clone(), { r: C.r, spread: C.spread, hold: 0, soak: C.soak, color: this.wet() }); }
    this.slumping = null;
  }
  /** It begins to slump (any end but a burst): its puddle spreads under it, held until the body is gone (`mount.end`; `hold` only a
   *  floor, the slump being half a real second). */
  onSlump() {
    const C = JELLY_LOOK.puddle.slump;
    this.slumping = this.puddles.spawn(this.ground().clone(), { r: C.r, spread: C.spread, hold: C.hold, soak: C.soak, color: this.wet() });
    this.play('jellymount.slump');
  }

  // ------------------------------------------------------------------ each frame (after Petra's tick)
  update(raw = 1 / 60) {
    this.t += raw; this.drinkT = Math.max(0, this.drinkT - raw);
    this.flash = Math.max(0, this.flash - raw * JELLY_LOOK.flash); this.drinkK = Math.max(0, this.drinkK - raw * JELLY_LOOK.drink.fade); // (faded whether it shows or not: a burst's flash is never carried to the next call)
    const J = this.J, B = J?.body;
    if (B?.mat && this.dressed !== B.mat) this.dress();
    if (J) {
      if (J.phase === 'off' && this.phase !== 'off' && J.endWhy !== 'burst') this.onSlump();
      if (this.air && !J.air && J.phase === 'ride') this.play('jellymount.land', { power: Math.max(0.6, Math.min(1.6, -this.vy / 8)) });
      this.phase = J.phase; this.air = !!J.air && J.phase === 'ride';
      if (this.air) this.vy = (J.P ?? this.game.player).vel.y;
    }
    if (B?.mesh && B.root.visible) this.shape(J, B);
    this.puddles.update(raw);
    this.ring.update(raw);
  }

  /** The body's place and size in the call, the slump and the air (on the ground in the ride Petra's stands), and its glow. */
  shape(J, B) {
    const P = J.P ?? this.game.player, p = P.renderPos ?? P.pos, gy = J.groundY ?? p.y - JELLY_LOOK.seat, R = B.root;
    const h = Math.max(0, (p.y - gy) / JELLY_LOOK.seat);
    if (J.phase === 'call') { // (out of the puddle: wide and flat, drawn up under the seat, its crown always under the rider)
      const w = 1 + JELLY_LOOK.well * (1 - smooth(h));
      R.position.y = gy - 0.03; R.scale.set(w, Math.max(0.04, h), w);
    } else if (J.phase === 'off') { // (melting down and out into its puddle as the rider is set down)
      const w = 1 + JELLY_LOOK.slump * (1 - Math.min(1, h));
      R.position.y = gy - 0.02; R.scale.set(w, Math.max(0.04, h), w);
    } else if (J.air) { // (off the ground with its rider: stretched rising, squashed falling, its volume kept)
      const S = JELLY_LOOK.stretch, s = 1 + Math.max(S.lo, Math.min(S.hi, P.vel.y * S.k)), w = 1 / Math.sqrt(s);
      R.position.y = p.y - JELLY_LOOK.seat; R.scale.set(w, s, w);
    }
    // its glow: a blow's warm flash, and the film through it while it drinks (the slip's own schiller is the melt's)
    const e = B.mat.emissive; if (!e) return;
    e.setRGB(this.flash * 0.6, this.flash * 0.5, this.flash * 0.4);
    if (this.drinkK > 0) { featTint(this.t * 0.35, _f); e.r += _f.r * JELLY_LOOK.drink.film * this.drinkK; e.g += _f.g * JELLY_LOOK.drink.film * this.drinkK; e.b += _f.b * JELLY_LOOK.drink.film * this.drinkK; }
  }

  /** For the boot's warm-up: Petra's body made now (her ensureBody: hidden, as on its first call), dressed, and shown 50 m down with a
   *  puddle and the ring's jelly so their programs compile; all hidden and put back after. */
  prewarm() {
    const J = this.J; if (!J?.ensureBody || !this.game.jellies?.geo) return () => {};
    J.ensureBody(); this.dress();
    const R = J.body?.root, undo = [this.puddles.prewarm(), this.ring.prewarm()];
    if (R) { R.position.set(0, -50, 0); R.scale.set(1, 1, 1); R.visible = true; }
    return () => { if (R) { R.visible = false; R.position.set(0, 0, 0); } undo.forEach((f) => f()); };
  }

  /** What is drawn (tests and sheets). */
  read() {
    const B = this.J?.body;
    return { dressed: !!this.dressed, shown: !!B?.root?.visible, phase: this.J?.phase ?? null, scale: B?.root ? B.root.scale.toArray().map((v) => +v.toFixed(2)) : null, flash: +this.flash.toFixed(2), puddles: this.puddles.active, ring: this.ring.read(), seal: this.sealKey };
  }
}
