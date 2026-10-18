// ---------------------------------------------------------------------------------------
// THE SPIRITUAL LINK (OVERLAY.md 10.5g, board v9, signed off by the owner 2026-10-18: "the Tool UIs get connected to the lachrimeter
// via a spiritual link, really shows that they draw from the player as a main source"). One thread of the labradorite film (the
// System's light: vfx/oxidation.js FILM, the colours vfx/lachrimetertube.js's bulb flashes) from the Lachrimeter's bulb to the eye of
// whichever tool UI is up, in the overlay's own scene (render/overlayscene.js), at the 480-line present:
//   AT REST   a 1-dot core in a 3-dot halo, its colours walking toward the tool, faint motes drifting along it
//   A SPEND   a bright bead (about 10 dots, head and tail) leaves the bulb and reaches the tool in 0.1 real s; the bulb flashes
//             (a ring out of its glass, 0.3 real s) and the tool's end flares when the bead lands (0.35 real s)
//   A DRY CLICK  the thread sags about 26 dots and dims to 25%, back by 0.35 real s; no bead (nothing left the pool)
// It is a cubic curve as the mock draws it (out of the bulb's left, low; into the eye from the right, above), a ribbon of 48 quads
// rebuilt into fixed arrays each frame it shows, drawn in the overlay's one shader (a kind of it: no program of its own). It narrates
// nothing: no word, and only what the pool did.
//
// Prior art: the mock (r9-cylinder's drawTether), ported to a mesh; Dead Space's RIG (the suit's spine as the gauge the tools draw
// from); Bioshock's plasmid hand, veins lit as EVE is spent; the tether lines of Destiny's Ghost and Fullmetal Alchemist's
// transmutation (a thread of the user's own substance to what it powers); a pulse along a cable (the Tron light-line, Metroid Prime's
// visor charge) for the bead.
//
// USAGE (the tool UIs build on this):
//   const L = new SpiritualLink(game)   game.spiritualLink   (main.js, after the LachrimeterTube; it reads tube.bulbAt())
//   L.attach(owner, getEnd)   the owner's UI claims the far end (the latest claim wins; a detach gives it back to the one before);
//                             getEnd(out) -> a THREE.Vector3 in the overlay scene's coordinates (its world: x right, y UP, CSS px:
//                             obj.localToWorld of the eye, after obj.updateMatrixWorld()), or null to hide. It is asked each frame,
//                             after the owner's own slot has been placed (attach moves the link's slot to the end of the scene's).
//   L.detach(owner)
//   L.bead({ amount, colour })   a spend: amount in Lachryma (a bigger one, a fuller bead), colour an optional tint for its head
//   L.slack()                    a dry click
//   L.update(dt)                 the overlay scene calls it (its slot's update); nothing else to call
//   L.state                      { shown, owner, beads, slack } for a probe
// Hidden while no owner holds it, its end is null, or the tube is not shown (it sinks, or the HUD is off).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayKind, overlayShader } from './lachrimetertube.js';

const N = 48; // (the ribbon's quads)
const HALF = 6; // (the ribbon's half width, dots: room for the bead's head; the core and halo are drawn inside it)
const PAD = 14; // (the end quads' half size, dots: the bulb's ring and the eye's flare)
const BEAD_T = 0.1, BULB_T = 0.3, FLARE_T = 0.35, SAG = 26, SLACK_T = 0.25, DIM = 0.75; // (the board's beats: real s and dots)
const MAX_BEADS = 3;

// the thread, the bulb's ring and the eye's flare in one kind of the overlay's shader (aPart: 0 the ribbon, 1 the bulb, 2 the eye).
// vUv: the ribbon's (along 0..1 by arc length, across -1..1); an end quad's (-1..1 both ways). Colours in sRGB, taken to linear.
const LINK = overlayKind('link', {
  vdecl: 'attribute float aPart;',
  vbody: 'vUv=uv;vA=aPart;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);',
  fdecl: `uniform float uLinkT,uLen,uDim,uBulb,uFlare,uBeadA,uRing;uniform vec3 uBeads,uBeadC;
vec3 lkFilm(float t){vec3 a=vec3(.30,.06,.70),b=vec3(.04,.55,.75),c=vec3(.95,.72,.18),d=vec3(.85,.10,.50);t=fract(t)*4.;
if(t<1.)return mix(a,b,smoothstep(0.,1.,t));if(t<2.)return mix(b,c,smoothstep(1.,2.,t));if(t<3.)return mix(c,d,smoothstep(2.,3.,t));return mix(d,a,smoothstep(3.,4.,t));}
float lkHash(float n){return fract(sin(n*12.9898)*43758.5453);}
float lkBead(float u,float s,float d){if(u<0.)return 0.;float ds=s-u*uLen;
  float head=exp(-(ds*ds+d*d)/(3.2*uBeadA));float tail=ds<0.&&ds>-10.*uBeadA?(1.+ds/(10.*uBeadA))*exp(-d*d/1.2):0.;return head+tail*.8;}`,
  fbody: `vec3 col;float a;
if(vA<.5){float s=vUv.x*uLen,d=vUv.y*${HALF.toFixed(1)},ad=abs(d);
  vec3 f=lkFilm(vUv.x*.7-uLinkT*.25)*1.25;
  float core=1.-smoothstep(.35,.75,ad),halo=1.-smoothstep(1.,1.75,ad);
  float m=(s-uLinkT*14.)/22.,cell=floor(m),fm=fract(m)-.5;float mote=lkHash(cell)>.45?exp(-(fm*fm*22.*22.+d*d)/1.4)*(.35+.4*lkHash(cell+7.)):0.;
  float b=lkBead(uBeads.x,s,d)+lkBead(uBeads.y,s,d)+lkBead(uBeads.z,s,d);
  col=f*(core*.85+halo*.22+mote*.6)*uDim+mix(vec3(1.),uBeadC,.35)*b+f*b*.5;
  float fade=smoothstep(0.,.02,vUv.x)*smoothstep(1.,.98,vUv.x);col*=fade;a=1.;}
else if(vA<1.5){float r=length(vUv)*(uRing+9.),R=uRing+(1.-uBulb)*7.;
  col=vec3(1.)*exp(-(r-R)*(r-R)/1.1)*uBulb*.8+lkFilm(uLinkT*.08)*exp(-r*r/(uRing*uRing))*uBulb*.5;a=1.;}
else{float r=length(vUv)*${PAD.toFixed(1)};
  col=(mix(vec3(1.),uBeadC,.4)*exp(-r*r/5.)+lkFilm(uLinkT*.25+.1)*exp(-r*r/30.)*.9)*uFlare+lkFilm(uLinkT*.25)*exp(-r*r/2.)*.35*uDim;
  a=1.;}
gl_FragColor=linearToOutputTexel(vec4(pow(max(col,0.),vec3(2.2)),a));`,
});

const bez = (a, b, c, d, u, k) => { const m = 1 - u; return m * m * m * a[k] + 3 * m * m * u * b[k] + 3 * m * u * u * c[k] + u * u * u * d[k]; };

export class SpiritualLink {
  constructor(game) {
    this.game = game; this.S = game.overlayScene;
    this.owners = []; // ([owner, getEnd], the latest last)
    this.t = 0; this.beads = []; this.bulbAge = 9; this.flareAge = 9; this.slackAge = 9; this.amount = 0;
    this.state = { shown: false, owner: null, beads: 0, slack: 0 };
    this.end = new THREE.Vector3(); this.bulb = {};
    this.P = [[0, 0], [0, 0], [0, 0], [0, 0]]; this.cum = new Float32Array(N + 1); this.pts = new Float32Array((N + 1) * 2);
    if (!this.S) return;
    const nv = (N + 1) * 2 + 8, g = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(nv * 3), 3); this.pos.setUsage(THREE.DynamicDrawUsage);
    this.uv = new THREE.BufferAttribute(new Float32Array(nv * 2), 2); this.uv.setUsage(THREE.DynamicDrawUsage);
    const part = new Float32Array(nv); part.fill(1, (N + 1) * 2, (N + 1) * 2 + 4); part.fill(2, (N + 1) * 2 + 4);
    const idx = [];
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    for (let q = 0; q < 2; q++) { const a = (N + 1) * 2 + q * 4; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute('position', this.pos); g.setAttribute('uv', this.uv); g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); g.setIndex(idx);
    this.U = { uLinkT: { value: 0 }, uLen: { value: 1 }, uDim: { value: 1 }, uBulb: { value: 0 }, uFlare: { value: 0 }, uBeadA: { value: 1 }, uRing: { value: 10 },
      uBeads: { value: new THREE.Vector3(-1, -1, -1) }, uBeadC: { value: new THREE.Color(1, 1, 1) } };
    this.mesh = new THREE.Mesh(g, overlayShader(LINK, this.U, { blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
    this.mesh.name = 'spiritualLink'; this.mesh.frustumCulled = false; this.mesh.renderOrder = -1; // (under the tube and the tool: it leaves the bulb's glass and enters the eye)
    this.mesh.userData.overlayHidden = true;
    this.slot = this.S.add(this.mesh, this.slotOpts());
  }
  slotOpts() { return { anchor: 'tl', x: 0, y: 0, z: -400, hud: true, update: (dt) => this.update(dt) }; }

  attach(owner, getEnd) {
    this.detach(owner); this.owners.push([owner, getEnd]);
    if (this.S) { this.S.remove(this.mesh); this.slot = this.S.add(this.mesh, this.slotOpts()); } // (after the owner's slot: its end is this frame's)
  }
  detach(owner) { const i = this.owners.findIndex((o) => o[0] === owner); if (i >= 0) this.owners.splice(i, 1); }

  bead({ amount = 4, colour = null } = {}) {
    if (!this.state.shown) return;
    if (this.beads.length >= MAX_BEADS) this.beads.shift();
    this.beads.push(0); this.bulbAge = 0; this.amount = amount;
    if (colour != null) this.U.uBeadC.value.set(colour); else this.U.uBeadC.value.setRGB(1, 1, 1);
  }
  slack() { if (this.state.shown) this.slackAge = 0; }

  update(dt) {
    const m = this.mesh, top = this.owners[this.owners.length - 1], tube = this.game.lachrimeterTube;
    const end = top ? top[1](this.end) : null, B = end && tube?.bulbAt ? tube.bulbAt(this.bulb) : null;
    this.state.owner = top ? top[0] : null;
    if (!end || !B) { m.userData.overlayHidden = true; this.state.shown = false; this.beads.length = 0; return; }
    m.userData.overlayHidden = false; this.state.shown = true;
    this.t += dt; this.bulbAge += dt; this.slackAge += dt;
    for (let i = this.beads.length - 1; i >= 0; i--) { this.beads[i] += dt; if (this.beads[i] >= BEAD_T) { this.beads.splice(i, 1); this.flareAge = 0; } }
    this.flareAge += dt;
    const dot = (this.S.h || innerHeight) / 480; // (CSS px a line of the present)
    const slack = this.slackAge < 2 ? Math.exp(-this.slackAge / SLACK_T) : 0;
    // the curve, in the scene's coordinates (y up): out of the bulb's glass at its left and low, into the eye from the right and above
    const P = this.P, r = B.r, sag = slack * SAG * dot;
    P[0][0] = B.x - r * 0.92; P[0][1] = B.y - r * 0.25;
    P[3][0] = end.x; P[3][1] = end.y;
    P[1][0] = P[0][0] - 30 * dot; P[1][1] = P[0][1] - 26 * dot - sag;
    P[2][0] = P[3][0] + 48 * dot; P[2][1] = P[3][1] + 30 * dot - sag;
    const pts = this.pts, cum = this.cum; let len = 0;
    for (let i = 0; i <= N; i++) {
      const u = i / N; pts[i * 2] = bez(P[0], P[1], P[2], P[3], u, 0); pts[i * 2 + 1] = bez(P[0], P[1], P[2], P[3], u, 1);
      if (i) len += Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]); cum[i] = len;
    }
    const pa = this.pos.array, ua = this.uv.array, w = HALF * dot, z = 0;
    for (let i = 0; i <= N; i++) {
      const a = Math.max(0, i - 1), b = Math.min(N, i + 1);
      let tx = pts[b * 2] - pts[a * 2], ty = pts[b * 2 + 1] - pts[a * 2 + 1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = -ty * w, ny = tx * w, x = pts[i * 2], y = pts[i * 2 + 1], u = len > 0 ? cum[i] / len : i / N, o = i * 6, q = i * 4;
      pa[o] = x + nx; pa[o + 1] = y + ny; pa[o + 2] = z; pa[o + 3] = x - nx; pa[o + 4] = y - ny; pa[o + 5] = z;
      ua[q] = u; ua[q + 1] = 1; ua[q + 2] = u; ua[q + 3] = -1;
    }
    // the end quads: the bulb's ring (its half size the glass's radius and 9 dots: the ring runs 7 dots out) and the eye's flare
    const quad = (k, cx, cy, h) => { const o = ((N + 1) * 2 + k * 4) * 3, q = ((N + 1) * 2 + k * 4) * 2, C = [-1, -1, 1, -1, -1, 1, 1, 1];
      for (let j = 0; j < 4; j++) { pa[o + j * 3] = cx + C[j * 2] * h; pa[o + j * 3 + 1] = cy + C[j * 2 + 1] * h; pa[o + j * 3 + 2] = z; ua[q + j * 2] = C[j * 2]; ua[q + j * 2 + 1] = C[j * 2 + 1]; } };
    const rd = r / dot; // (the bulb's radius in dots)
    quad(0, B.x, B.y, (rd + 9) * dot); quad(1, end.x, end.y, PAD * dot);
    this.pos.needsUpdate = true; this.uv.needsUpdate = true;
    const U = this.U;
    U.uLinkT.value = this.t % 3600; U.uLen.value = len / dot; U.uRing.value = rd; // (the ribbon's length, the bulb's radius: dots)
    U.uDim.value = 1 - DIM * slack;
    const bulb = this.bulbAge < BULB_T ? Math.pow(1 - this.bulbAge / BULB_T, 1.5) : 0;
    U.uBulb.value = bulb; U.uFlare.value = this.flareAge < FLARE_T ? Math.pow(1 - this.flareAge / FLARE_T, 2) : 0;
    U.uBeadA.value = 1 + Math.min(1, this.amount / 25) * 0.6;
    const bv = U.uBeads.value; bv.set(this.beads[0] ?? -1, this.beads[1] ?? -1, this.beads[2] ?? -1);
    if (bv.x >= 0) bv.x /= BEAD_T; if (bv.y >= 0) bv.y /= BEAD_T; if (bv.z >= 0) bv.z /= BEAD_T;
    this.state.beads = this.beads.length; this.state.slack = slack;
  }
}
