// ---------------------------------------------------------------------------------------
// THE BLINK'S PEARLS (a part of the Lachrimeter's tube, vfx/lachrimetertube.js; the owner, 2026-10-18: "find a way to incorporate the
// blink beads into the new 3d lachrimeter"): a short brass rail standing beside the tube's column, on the side away from the screen's
// edge and above the Bottles (the spiritual link leaves the bulb low on that side: clear of it), strung with one glass pearl per Blink
// charge. A ready charge is a pearl full of Lachryma (the column's lit stuff, the labradorite film flashing in it); the one coming back
// fills from the bottom with the refill, dimmed until it is whole, and glints once when it is; a charge spent drains at once with a
// small pop of the film (the pearl flashes, a ring of the film runs out off its glass). The rail is a fight's: shown in combat only
// (game.combat), as the old beads were, easing in and out from its foot.
//
// Prior art: the old beads (the LACHRYMA panel's, retired here) and the charge pips they took from (Dishonored's Blink, Tracer's three pips,
// Hollow Knight's soul vessels); the soroban's beads on their rod (a count you read by position); the thermometer's own bore (a pearl
// fills as the column does). Drawn in the overlay's one shader (its kind `tube.pearl`, added by the tube) and the tube's brass and
// glass: no program of its own, nothing allocated a frame (the rail is rebuilt only when the charge count changes).
//
//   PEARL_KIND                                     the kind's source (the tube adds it: overlayKind('tube.pearl', PEARL_KIND))
//   const P = new BlinkPearls(ctx)                 ctx: { inst, kind, glassB, glassF, body, onto, at, glassOf, flat, uInst }
//   P.update(dt, blink, combat, turnBack)          blink: { n, max, fill } (main.js's blinkState: techs.get('blink')) or null
//   P.state                                        { shown, n, max, fills }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// in the tube's own units (vfx/lachrimetertube.js: the bulb at the origin, the column on x = 0, the scale plate behind at z -0.29)
const RX = -0.58, RZ = -0.08, Y_FOOT = 2.06, Y_FIRST = 2.32, STEP = 0.42; // (the rail's line, its foot, the first pearl's centre, the gap)
const R_GLASS = 0.18, R_LIQ = 0.15, MAXP = 6; // (a pearl's glass and its Lachryma; the most pearls built for)
const DRAIN = 9, POP_T = 0.32, GLINT = 0.55; // (how fast a spent one empties, a unit a real second; the pop's real seconds; the glint's strength)

/** The kind: a unit sphere of the column's Lachryma, cut level at its fill (uPearl.x), its inside seen through the cut as the surface;
 *  uPearl.y the pop's flash, uPearl.z 1 once whole (dimmer while it fills). The tube's NOISE (fbm, pal, uT) and uInst are declared by
 *  the kinds before it. */
export const PEARL_KIND = {
  vbody: 'vec4 w=modelMatrix*vec4(position,1.);vW=(uInst*w).xyz;vP=position;vN=normalize(normalMatrix*normal);vV=vec3(0.,0.,1.);gl_Position=projectionMatrix*viewMatrix*w;',
  fdecl: 'uniform vec3 uPearl;',
  fbody: `vec3 N=normalize(vN),V=normalize(vV);float f=clamp(abs(dot(N,V)),0.,1.);
float lv=uPearl.x*2.-1.,wob=.06*sin(vP.x*7.+uT*9.)*clamp(uPearl.x*(1.-uPearl.x)*4.,0.,1.);
if(uPearl.x<.01||vP.y>lv+wob)discard;
vec3 p=vW*vec3(10.,2.4,10.)+vP*1.5;float n=fbm(p+vec3(0.,uT,0.)),n2=fbm(p*2.1+5.+uT);
float flash=smoothstep(.15,1.,sin((n*3.+vP.y*1.4)*6.2831))*smoothstep(.32,.68,n2);
vec3 fl=pal(n*1.3+f*.6+uT*.15);
vec3 col=mix(vec3(.20,.10,.62),vec3(.42,.30,1.),f*f)*(.85+.5*f)+fl*flash*1.5+vec3(.55,.5,1.)*pow(1.-f,2.)*.4;
if(!gl_FrontFacing)col=vec3(.70,.92,1.)*.75+fl*.35;
col=mix(col*.5,col,uPearl.z)+pal(vP.y*.4+uT*3.)*uPearl.y*1.6;
gl_FragColor=vec4(col,1.);`,
};

// the film's run of colours (vfx/oxidation.js FILM; the shader's pal): the pop's ring walks it
const FILM = [new THREE.Color(0.30, 0.06, 0.70), new THREE.Color(0.04, 0.55, 0.75), new THREE.Color(0.95, 0.72, 0.18), new THREE.Color(0.85, 0.10, 0.50)];
const filmAt = (t, out) => { t = ((t % 1) + 1) % 1 * 4; const i = Math.floor(t); return out.copy(FILM[i]).lerp(FILM[(i + 1) % 4], t - i); };
const sm = (x) => x * x * (3 - 2 * x);

export class BlinkPearls {
  constructor(ctx) {
    this.ctx = ctx;
    this.state = { shown: 0, n: 0, max: 0, fills: [] };
    this.max = 0; this.e = 0; this.t = 0;
    const g = (this.group = new THREE.Group()); g.name = 'blinkPearls'; g.position.set(RX, Y_FOOT, RZ); g.visible = false; ctx.inst.add(g);
    // the rail (brass) and the pearls' glass, rebuilt for the charge count; the liquids and the rings, one each, built once
    this.rail = new THREE.Mesh(new THREE.BufferGeometry(), ctx.body); this.rail.frustumCulled = false; g.add(this.rail);
    this.glass = new THREE.Mesh(new THREE.BufferGeometry(), ctx.glassB); this.glass.renderOrder = 2; this.glass.frustumCulled = false; g.add(this.glass);
    this.glassF = new THREE.Mesh(this.glass.geometry, ctx.glassF); this.glassF.renderOrder = 2.01; this.glassF.frustumCulled = false; this.glass.add(this.glassF);
    const sphere = new THREE.SphereGeometry(1, 24, 16), ring = new THREE.TorusGeometry(1, 0.06, 4, 28);
    this.pearls = [];
    for (let i = 0; i < MAXP; i++) {
      const u = { uPearl: { value: new THREE.Vector3(0, 0, 0) }, uT: { value: i * 1.7 }, uPale: { value: 0 }, uSwirl: { value: 0 }, uGain: { value: 1 }, uInst: ctx.uInst };
      const liq = new THREE.Mesh(sphere, ctx.kind(u)); liq.scale.setScalar(R_LIQ); liq.renderOrder = 1; liq.frustumCulled = false; liq.visible = false; g.add(liq);
      const rg = new THREE.Mesh(ring, ctx.flat()); rg.renderOrder = 9; rg.frustumCulled = false; rg.visible = false; g.add(rg);
      this.pearls.push({ liq, u: u.uPearl.value, ring: rg, fill: 0, pop: 1, glint: 1, whole: false });
    }
    this.col = new THREE.Color();
  }

  /** The rail and the glass for `max` pearls (when the Blink's charge count changes: once, as a rule). */
  build(max) {
    const { at, onto, glassOf } = this.ctx, top = Y_FIRST + STEP * (max - 1) - Y_FOOT;
    const P = [], y0 = Y_FIRST - Y_FOOT;
    P.push(at(new THREE.CylinderGeometry(0.016, 0.016, top + 0.26, 8), [0, (top + 0.26) / 2 - 0.04, 0])); // (the rod the pearls are strung on)
    for (let i = 0; i < max; i++) for (const s of [-1, 1]) P.push(at(new THREE.TorusGeometry(0.034, 0.012, 5, 14), [0, y0 + STEP * i + s * (R_GLASS + 0.01), 0], [Math.PI / 2, 0, 0])); // (a collar above and below each)
    P.push(at(new THREE.SphereGeometry(0.035, 10, 8), [0, top + 0.24, 0]), at(new THREE.CylinderGeometry(0.03, 0.045, 0.06, 10), [0, -0.05, 0])); // (the finial and the foot)
    for (const y of [-0.04, top + 0.16]) { // (two arms back to the scale plate's frame: across, then in)
      P.push(at(new THREE.BoxGeometry(0.28, 0.026, 0.026), [0.13, y, 0]), at(new THREE.BoxGeometry(0.026, 0.026, 0.24), [0.26, y, -0.11]));
    }
    this.rail.geometry.dispose(); this.rail.geometry = onto(mergeGeometries(P), 'brass'); P.forEach((q) => q.dispose());
    const G = []; for (let i = 0; i < max; i++) G.push(glassOf(at(new THREE.SphereGeometry(R_GLASS, 20, 14), [0, y0 + STEP * i, 0]), 0.04, 0.6));
    this.glass.geometry.dispose(); this.glass.geometry = this.glassF.geometry = mergeGeometries(G); G.forEach((q) => q.dispose());
    this.pearls.forEach((p, i) => { p.liq.position.set(0, y0 + STEP * i, 0); p.ring.position.copy(p.liq.position); p.liq.visible = i < max; });
    this.max = max;
  }

  update(dt, blink, combat, turnBack) {
    const want = blink && combat && blink.max > 0 ? 1 : 0;
    this.e += (want - this.e) * Math.min(1, dt * (want ? 8 : 4)); if (!want && this.e < 0.01) this.e = 0;
    const g = this.group; g.visible = this.e > 0; this.state.shown = this.e;
    if (!blink) return;
    const max = Math.min(MAXP, blink.max | 0), n = Math.min(max, blink.n | 0);
    if (max !== this.max) this.build(max);
    this.t += dt;
    for (let i = 0; i < max; i++) {
      const p = this.pearls[i], target = i < n ? 1 : i === n ? Math.max(0, Math.min(1, blink.fill || 0)) : 0;
      if (target < p.fill - 0.5) { p.pop = 0; } // (spent: it drains with a pop of the film)
      p.fill = target < p.fill ? Math.max(target, p.fill - dt * DRAIN) : p.fill + (target - p.fill) * Math.min(1, dt * 14);
      const whole = i < n; if (whole && !p.whole && this.seen) p.glint = 0; p.whole = whole; // (come back whole: it glints)
      p.pop += dt; p.glint += dt;
      const pk = p.pop < POP_T ? Math.pow(1 - p.pop / POP_T, 1.5) : 0, gk = p.glint < POP_T ? GLINT * Math.pow(1 - p.glint / POP_T, 2) : 0;
      p.u.set(p.fill, Math.max(pk, gk), whole ? 1 : 0);
      p.liq.material.uniforms.uT.value += dt * 0.25;
      p.ring.visible = pk > 0 && g.visible;
      if (p.ring.visible) { const k = 1 - pk; p.ring.scale.setScalar(R_GLASS * (1 + 1.4 * k)); p.ring.quaternion.copy(turnBack); p.ring.material.opacity = pk; p.ring.material.color.copy(filmAt(this.t * 2 + i * 0.3, this.col)); }
      this.state.fills[i] = Math.round(p.fill * 100) / 100;
    }
    this.state.fills.length = max; this.state.n = n; this.state.max = max; this.seen = true;
    if (g.visible) { const k = sm(Math.min(1, this.e)); g.scale.set(0.6 + 0.4 * k, k, 0.6 + 0.4 * k); } // (it grows up off its foot)
  }
}
