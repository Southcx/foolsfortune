// ---------------------------------------------------------------------------------------
// THE FILIGREE: the Courier's armour shows what the Lachryma in them is doing. The maker drew three line masks over the armour's UVs
// (source_assets/courier_filigree_1..3.png, white lines on black, meant as shader masks); each is one thing Lachryma does in a vessel,
// and each lights with its own magnitude:
//
//   ABSORPTION  (mask 1, the fine veins)     Lachryma coming in: the veins fill, the schiller running up them, and settle. At rest
//                                            they hold a little of it, inked in black labradorite as deep as their pool is full: the
//                                            armour is the gauge (a line that glows with its load beats a gauge: CLAUDE.md)
//   CHANNELLING (mask 2, the veins and nodes) Lachryma going out (the psygun's charge, a dash, an art, a tool drinking): it lights while
//                                            it flows; the charge lights it faint at first and brighter as it builds (a plain shot: not at all)
//   DAMAGE      (mask 3, the bold strokes)   a blow taken: the strokes flash pale and hot, and darken back slowly
//
// Drawn as the Mind and Lachryma are drawn (vfx/labradorite.js): ink with the schiller rising in it, its hue set by the angle of the
// armour to the eye, so the lines turn colour as they turn. Every change is an envelope (a rise and an ease back), never a blink.
//
// Prior art: Tron's and Destiny's circuit lines on a suit (light along drawn channels as the power state), Dead Space's spine
// gauge (the meter is on the body), Okami's brush-line glow, and kintsugi's gold in a crack (damage as a line that is shown, not hid).
//
//   dressFiligree(material)            once, on the armour's material (character.js): returns its uniforms
//   new Filigree(game, uniforms)       listens to the pool and the player; update(dt) each frame
//   filigree.absorb(k) / channel(k) / hurt(k)       0..1, for anything else that wants the armour to say so
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import filigreeB64 from '../assets/courier/courier_filigree.png?b64';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';

let _tex = null;
function masks() {
  if (_tex) return _tex;
  _tex = new THREE.TextureLoader().load(`data:image/png;base64,${filigreeB64}`);
  _tex.flipY = false; // (glTF's UV convention, as the armour's painting)
  _tex.colorSpace = THREE.NoColorSpace; // (masks, not colours)
  _tex.anisotropy = 4;
  return _tex;
}

const FRAG_DECL = `uniform sampler2D uFil;
uniform vec4 uFilK; // absorption, channelling, damage, rest (the pool's fill)
${LAB_GLSL}
`;
// (after the painting is read: the veins are inked as deep as the pool is full, and a blow leaves the strokes dark for a while)
const FRAG_DIFFUSE = `
  vec3 filM = texture2D(uFil, vMapUv).rgb;
  float filInk = clamp(filM.r * (0.1 + 0.3 * uFilK.w) + filM.b * uFilK.z * 0.5, 0.0, 0.8);
  diffuseColor.rgb = mix(diffuseColor.rgb, LAB_INK, filInk);
`;
// (and the schiller in them, added to the light the armour gives off)
const FRAG_EMISSIVE = `
  {
    vec3 vd = normalize(vViewPosition);
    float filNdv = abs(dot(normal, vd));
    float filPh = labPhase(-vViewPosition * 0.6, normal);
    float graze = 0.3 + 0.7 * pow(1.0 - filNdv, 1.3);
    vec3 schiller = labSoft(filPh);
    totalEmissiveRadiance += schiller * filM.r * (uFilK.w * 0.06 * graze + uFilK.x * 1.15);
    totalEmissiveRadiance += labSoft(filPh + 0.3) * filM.g * uFilK.y * 1.3;
    totalEmissiveRadiance += mix(vec3(1.0, 0.92, 1.0), labradorite(filPh + 0.5), 0.45) * filM.b * uFilK.z * 1.5;
  }
`;

/** Dress the armour's material with the three masks; returns the uniforms the Filigree drives. */
export function dressFiligree(material) {
  const uniforms = { uFil: { value: masks() }, uFilK: { value: new THREE.Vector4(0, 0, 0, 1) }, uMindT: mindTime };
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    prev?.call(material, sh, r);
    Object.assign(sh.uniforms, uniforms);
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>${FRAG_DIFFUSE}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${FRAG_EMISSIVE}`);
  };
  const key = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `filigree|${key ? key() : ''}`;
  return uniforms;
}

export const HURT = new Set(['jelly', 'lobber', 'explosion']); // (an impulse that was a blow: player.impulse's why)

export class Filigree {
  constructor(game, uniforms) {
    this.game = game;
    this.u = uniforms;
    this.abs = 0; this.chan = 0; this.dmg = 0; this.flow = 0; this.rest = 1;
    const pool = game.lachryma;
    pool?.on('gain', ({ amount }) => this.absorb(Math.min(1, 0.25 + amount / 25)));
    // (the psygun's plain shots and its charge do not flash it: the charge lights it, rising as it builds: update)
    pool?.on('spend', ({ amount, tag }) => { if (!/^(shot|charge|beam)/.test(tag || '')) this.channel(Math.min(1, 0.3 + amount / 20)); });
    game.events?.on('courier.impulse', ({ why, mag }) => { if (HURT.has(why)) this.hurt(Math.min(1, 0.45 + (mag || 0) / 20)); });
    game.events?.on('jelly.strike', () => this.hurt(1));
  }

  absorb(k) { this.abs = Math.max(this.abs, k); }
  /** Lachryma going out. Called every frame while something drinks steadily (a drain), so it holds while the flow does. */
  channel(k) { this.flow = Math.max(this.flow, k); }
  hurt(k) { this.dmg = Math.max(this.dmg, k); }

  update(dt) {
    mindTick();
    // envelopes: absorption fills and settles over a second and a half, channelling follows its flow (rising fast, easing back),
    // a blow flashes and fades over two seconds
    this.abs = Math.max(0, this.abs - dt * 0.7);
    this.chan += (this.flow - this.chan) * (1 - Math.exp(-dt * (this.flow > this.chan ? 18 : 3)));
    // the psygun's charge: the channels start faint and brighten as it builds (owner's note, R40), and ease back after the beam
    const W = this.game.weapon, ch = W?.charge || 0;
    if (ch > 0) this.flow = Math.max(this.flow, 0.12 + 0.88 * ch * ch);
    this.flow = Math.max(0, this.flow - dt * 4);
    this.dmg = Math.max(0, this.dmg - dt * 0.5);
    const pool = this.game.lachryma;
    if (pool) this.rest += (pool.fraction - this.rest) * (1 - Math.exp(-dt * 3));
    this.u.uFilK.value.set(this.abs, this.chan, this.dmg * this.dmg * (3 - 2 * this.dmg), this.rest);
  }
}
