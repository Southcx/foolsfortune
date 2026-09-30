// ---------------------------------------------------------------------------------------
// THE PORTRAIT: while a fish is on the line, a window slides in at the side of the screen (a frame with corner brackets, glowing the
// colour of the lure's aspect) and, inside it, cut to close: the fish itself, hooked, wriggling and thrashing on the lure's ghost
// mask with the line running up out of shot, against a dark backdrop of slow rays in the aspect's colour, bubbles rising. It thrashes
// harder as it pulls harder, the camera in the window pushes in on every heavy pull and drifts the rest of the time, and it slides
// out when the fight is over. A second scene is drawn straight into the main canvas through a scissored viewport under the frame,
// so it costs one extra small render and no extra canvas.
//
// Prior art: the fight cut-ins of Monster Hunter's kill cams and Persona's all-out-attack portraits (a framed window over the action,
// hard angles, a colour keyed to what is happening), Zelda: Twilight Princess' fish shown on the line, and every fighting-game
// super's cut-in. The window is only ever an image: no text, no gauge (the fight's state is in the world: the line, the reticle).
//
//   game.portrait.show(fish, aspectColour)     game.portrait.hide()     game.portrait.update(dt, fight)     game.portrait.render()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { buildFish } from '../angling/fishmesh.js';

const CSS = `
#portrait { position: fixed; right: 2.4vw; top: 15vh; width: min(30vw, 440px); aspect-ratio: 4 / 3; pointer-events: none; z-index: 2; opacity: 0;
  transform: translateX(125%) rotate(5deg) scale(.9); transition: transform .62s cubic-bezier(.16, 1.32, .3, 1), opacity .25s; }
#portrait.on { opacity: 1; transform: none; }
#portrait .frame { position: absolute; inset: -4px; border: 3px solid #b3735a; box-shadow: 0 0 0 2px #1c0d08, 0 0 26px var(--asp, #ffb27a), inset 0 0 34px rgba(0,0,0,.55); }
#portrait .frame::before, #portrait .frame::after { content: ''; position: absolute; width: 26px; height: 26px; border: 4px solid var(--asp, #ffb27a); }
#portrait .frame::before { left: -9px; top: -9px; border-right: none; border-bottom: none; }
#portrait .frame::after { right: -9px; bottom: -9px; border-left: none; border-top: none; }
#portrait .slash { position: absolute; left: -4px; right: -4px; top: 50%; height: 2px; background: linear-gradient(90deg, transparent, var(--asp, #ffb27a), transparent); opacity: .0; }
#portrait.hit .slash { animation: pslash .32s ease-out; }
@keyframes pslash { 0% { opacity: .95; transform: scaleX(.1); } 100% { opacity: 0; transform: scaleX(1.2); } }
`;

const BACKDROP_FRAG = `
uniform vec3 uColor; uniform float uTime, uHeat; varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p), a = atan(p.y, p.x);
  float rays = smoothstep(0.35, 1.0, 0.5 + 0.5 * sin(a * 9.0 + uTime * 0.35)) * smoothstep(1.3, 0.1, r);
  float rays2 = smoothstep(0.55, 1.0, 0.5 + 0.5 * sin(a * 21.0 - uTime * 0.22)) * smoothstep(1.2, 0.2, r) * 0.5;
  vec3 deep = vec3(0.02, 0.012, 0.014);
  vec3 c = mix(deep, uColor * 0.5, smoothstep(1.1, 0.0, r) * (0.35 + 0.4 * uHeat));
  c += uColor * (rays * 0.28 + rays2 * 0.16) * (0.6 + 0.8 * uHeat);
  c += uColor * 0.14 * smoothstep(0.55, 0.0, abs(p.y + 0.2)) * (0.3 + uHeat);   // (a horizon of light: the surface, far above)
  c *= 1.0 - 0.55 * smoothstep(0.55, 1.35, r);
  gl_FragColor = vec4(c, 1.0);
}`;

export class Portrait {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(34, 4 / 3, 0.05, 60);
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.el = document.createElement('div'));
    el.id = 'portrait';
    el.innerHTML = '<div class="frame"></div><div class="slash"></div>';
    document.body.insertBefore(el, document.getElementById('hud'));
    // the backdrop
    this.uni = { uColor: { value: new THREE.Color(0xffb27a) }, uTime: { value: 0 }, uHeat: { value: 0 } };
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.uni, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }', fragmentShader: BACKDROP_FRAG,
    }));
    back.frustumCulled = false; back.renderOrder = -10;
    this.scene.add(back);
    // bubbles
    const N = 46;
    this.bub = new Float32Array(N * 3); this.bubV = new Float32Array(N);
    for (let i = 0; i < N; i++) this.reseed(i, true);
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(this.bub, 3));
    this.bubPts = new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.05, color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    this.scene.add(this.bubPts);
    this.fishRoot = new THREE.Group();
    this.scene.add(this.fishRoot);
    this.k = 0; this.on = false; this.t = 0; this.kick = 0; this.fish = null; this.model = null;
    // the ghost lure and its line
    this.lure = new THREE.Group();
    const skin = new THREE.MeshBasicMaterial({ color: 0xf3c9a8 });
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), skin); head.scale.set(1, 1.1, 0.9);
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x1c0d08 });
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.03), eyeM); e.position.set(s * 0.055, 0.02, 0.105); this.lure.add(e); }
    this.lure.add(head);
    this.lureHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: game.fx.haloTexture, color: 0xffb27a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lureHalo.scale.setScalar(1.1); this.lure.add(this.lureHalo);
    this.lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 4, 0)]);
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xf3e6d2 }));
    this.scene.add(this.line);
  }

  reseed(i, spread = false) { this.bub[i * 3] = (Math.random() - 0.5) * 4.5; this.bub[i * 3 + 1] = spread ? (Math.random() - 0.5) * 3.2 : -1.7; this.bub[i * 3 + 2] = (Math.random() - 0.5) * 2 - 0.5; this.bubV[i] = 0.3 + Math.random() * 0.7; }

  show(fish, color) {
    this.hide(true);
    this.fish = fish;
    this.model = buildFish(fish.sp, fish.cm);
    const L = this.model.length, s = 1.9 / Math.max(0.3, L);
    this.model.group.scale.setScalar(s);
    this.model.glow(0.75);
    this.fishRoot.add(this.model.group);
    // the lure hangs at the mouth (the mouth is the nose: +X of the model)
    this.mouth = new THREE.Vector3(L * 0.5 * s, 0, 0);
    this.fishRoot.add(this.lure);
    this.lureHalo.material.color.set(color);
    this.uni.uColor.value.set(color);
    this.el.style.setProperty('--asp', `#${color.toString(16).padStart(6, '0')}`);
    this.line.material.color.set(0xf3e6d2);
    this.el.classList.add('on');
    this.on = true; this.t = 0; this.kick = 0;
  }

  hide(now = false) {
    this.on = false;
    this.el.classList.remove('on');
    if (this.model) { this.fishRoot.remove(this.model.group); this.model.dispose?.(); this.model = null; }
    this.fishRoot.remove(this.lure);
    this.fish = null;
    if (now) this.k = 0;
  }

  /** A heavy moment in the fight: the portrait flashes and the camera in it kicks in. */
  hit() { this.kick = 1; this.el.classList.remove('hit'); void this.el.offsetWidth; this.el.classList.add('hit'); }

  update(dt, f) {
    this.k = THREE.MathUtils.clamp(this.k + (this.on ? dt * 3 : -dt * 3), 0, 1);
    if (this.k <= 0 && !this.on) return;
    this.t += dt;
    this.kick = Math.max(0, this.kick - dt * 2.4);
    const pull = f ? f.pull : 0.3, tens = f ? Math.min(1.2, f.tension) : 0.3, stam = f ? f.stamina : 0.5, thr = f?.seg?.kind === 'thrash' ? 1 : 0;
    this.uni.uTime.value = this.t; this.uni.uHeat.value = THREE.MathUtils.damp(this.uni.uHeat.value, 0.25 + tens * 0.9, 6, dt);
    const m = this.model;
    if (m) {
      const rage = 0.35 + pull * 1.3 * (0.4 + 0.6 * stam) + thr * 0.8;
      m.swim(dt, 1.2 + rage * 3.5, Math.sin(this.t * 3.1) * rage * 2);
      // thrashing: it hauls against the line (up and to the left, where the line goes) and rolls
      const g = m.group;
      const heave = Math.sin(this.t * (5 + rage * 4)) * 0.14 * rage + Math.sin(this.t * 1.3) * 0.08;
      g.position.set(-0.15 + heave, -0.1 + Math.sin(this.t * 2.2) * 0.1, 0);
      g.rotation.set(Math.sin(this.t * 3.7) * 0.25 * rage, -0.5 + Math.sin(this.t * 1.1) * 0.3, 0.32 + Math.sin(this.t * (6 + rage * 5)) * 0.32 * rage);
      m.glow(0.6 + 0.3 * tens);
      // the lure at its mouth, and the line up out of shot
      g.updateMatrixWorld(true);
      const mw = this.mouth.clone().applyMatrix4(g.matrixWorld);
      this.lure.position.copy(mw).add(new THREE.Vector3(0.05, 0.05, 0.1)); this.lure.rotation.set(0, -0.4, Math.sin(this.t * 7) * 0.2);
      const p = this.lineGeo.attributes.position;
      p.setXYZ(0, mw.x, mw.y, mw.z); p.setXYZ(1, mw.x - 1.2 - this.kick * 0.2, mw.y + 4, mw.z - 0.3); p.needsUpdate = true;
      this.line.material.color.setRGB(1, 0.9 - tens * 0.5, 0.8 - tens * 0.7);
    }
    // the camera: a slow drift, a push-in on every heavy pull
    const drift = this.t * 0.35;
    const d = 3.4 - this.kick * 0.7 - tens * 0.25;
    this.cam.position.set(Math.sin(drift) * 0.7, 0.15 + Math.sin(drift * 0.7) * 0.2, d);
    this.cam.lookAt(-0.1, -0.05, 0);
    this.cam.rotation.z += Math.sin(this.t * 40) * 0.006 * this.kick;
    this.cam.fov = 34 - this.kick * 6;
    this.cam.updateProjectionMatrix();
    for (let i = 0; i < this.bubV.length; i++) { this.bub[i * 3 + 1] += this.bubV[i] * dt * (1 + pull); if (this.bub[i * 3 + 1] > 1.9) this.reseed(i); }
    this.bubPts.geometry.attributes.position.needsUpdate = true;
  }

  /** After the main render: draw the window through a scissored viewport under its frame. */
  render() {
    if (this.k <= 0.001) return;
    const ren = this.game.renderer;
    const r = this.el.getBoundingClientRect();
    if (r.width < 8) return;
    const W = innerWidth, H = innerHeight;
    const left = Math.max(0, r.left), right = Math.min(W, r.right), top = Math.max(0, r.top), bottom = Math.min(H, r.bottom);
    if (right <= left || bottom <= top) return;
    this.cam.aspect = r.width / r.height; this.cam.updateProjectionMatrix();
    ren.setScissorTest(true);
    ren.setViewport(r.left, H - r.bottom, r.width, r.height);
    ren.setScissor(left, H - bottom, right - left, bottom - top);
    ren.render(this.scene, this.cam);
    ren.setScissorTest(false);
    ren.setViewport(0, 0, W, H);
  }
}
