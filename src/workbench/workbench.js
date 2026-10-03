// ---------------------------------------------------------------------------------------
// THE WORKBENCH: the game's own studio, inside the game. `/lab` (or `/workbench`) in the chat line puts the world aside and opens a
// stage of its own, drawn by the game's renderer with the game's light and the PS2 glow, so what is seen here is what the game shows:
//
//   EFFECTS    every effect in the library (vfx/library.js), played on the stage, once or on a loop, at any power, tint and speed;
//              its layers as data in an editor beside it: change a number, Apply, and it plays changed, here and in the world (the
//              change is kept in this browser until Reverted; Copy puts it on the clipboard as the library's own text, to paste back
//              into vfx/library.js or to hand to Calissa)
//   MODELS     every model the game has: the GLBs (the Courier, the clapperjar, the god hand, the effect meshes...), the tools, the
//              things of the Pneuka Box, the curios; turned on a turntable, in wireframe, its normals or a UV checker, with its
//              counts (vertices, triangles, materials, bones) and a 1.7 m figure for scale; a rigged model plays its own clips, and the
//              Courier plays every clip of the game's clip pack
//   TEXTURES   the effect textures, the spell circles and the sprite atlas, shown on the stage
//
// Prior art: the engine editor's asset browser and its preview pane (Unity's inspector preview, Unreal's Niagara and static-mesh
// editors: an effect or a mesh on a turntable, its stats beside it), the "sound test" and "model viewer" of the sixth generation's
// extras menus (Metal Gear Solid 2's, Kingdom Hearts' theatre), and live-tuning consoles (a value changed while it plays).
//
//   game.workbench = new Workbench(game)   .toggle()   .open   .frame(dt)  (main.js draws it instead of the world while open)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Vfx, vfxTexture, vfxTextureNames } from '../vfx/vfx.js';
import { LIBRARY } from '../vfx/library.js';
import { atlas } from '../vfx/sprites.js';
import { ITEMS } from '../pneuka/items.js';
import { buildThing } from '../pneuka/thingmodels.js';
import { buildCurio } from '../curiomodel.js';
import { CURIOS } from '../treasure.js';
import { DreamvaneModel } from '../dreamvane/model.js';
import { CrucibelleModel } from '../crucibelle/model.js';

const GLBS = import.meta.glob(['../assets/*.glb', '../assets/vfx/*.glb'], { query: '?b64', import: 'default' });
const STORE = 'ff.vfx.overrides';
const PRISTINE = JSON.parse(JSON.stringify(LIBRARY));

/** Edits made here, kept in this browser: put into the library at boot, so the world plays them too. */
export function applyVfxOverrides() {
  try { const o = JSON.parse(localStorage.getItem(STORE) || '{}'); for (const [k, v] of Object.entries(o)) LIBRARY[k] = v; } catch { /* none */ }
}

const CSS = `
#workbench { position: fixed; inset: 0; z-index: 40; pointer-events: none; font: 13px var(--f-ui, sans-serif); color: #f3e6d8; }
#workbench .wb { position: absolute; top: 12px; bottom: 12px; left: 12px; width: 340px; pointer-events: auto; display: flex; flex-direction: column; padding: 10px 12px; box-sizing: border-box; } /* (the window's own look: ui/theme.js WINDOWS) */
#workbench .tabs { display: flex; gap: 6px; margin-bottom: 8px; }
#workbench .tabs b { cursor: pointer; padding: 3px 9px; border: 1px solid rgba(255,255,255,.2); border-radius: 3px; font-weight: 600; letter-spacing: .08em; }
#workbench .tabs b.on { background: rgba(255,215,140,.18); border-color: rgba(255,215,140,.6); }
#workbench .tabs .x { margin-left: auto; }
#workbench input[type=search] { width: 100%; box-sizing: border-box; background: rgba(0,0,0,.35); color: inherit; border: 1px solid rgba(255,255,255,.2); padding: 4px 6px; margin-bottom: 6px; }
#workbench .list { flex: 1 1 40%; overflow: auto; border: 1px solid rgba(255,255,255,.12); padding: 2px; min-height: 120px; }
#workbench .list div { padding: 2px 6px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#workbench .list div.on { background: rgba(255,215,140,.22); }
#workbench .list div.grp { color: #c9a98f; cursor: default; font-size: 11px; letter-spacing: .1em; margin-top: 4px; }
#workbench .ctl { display: grid; grid-template-columns: 70px 1fr 42px; gap: 4px 6px; align-items: center; margin: 8px 0; }
#workbench .ctl output { text-align: right; font: 12px var(--f-sys, monospace); }
#workbench .row { display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0; }
#workbench button { background: rgba(255,215,140,.12); color: inherit; border: 1px solid rgba(255,215,140,.45); padding: 3px 8px; cursor: pointer; font: inherit; }
#workbench button:hover { background: rgba(255,215,140,.26); }
#workbench textarea { flex: 1 1 45%; min-height: 120px; resize: none; background: rgba(0,0,0,.45); color: #f6ead8; border: 1px solid rgba(255,255,255,.15); font: 11px/1.35 ui-monospace, Menlo, Consolas, monospace; padding: 6px; white-space: pre; }
#workbench .info { font: 11px/1.4 ui-monospace, monospace; color: #e8d6c0; white-space: pre-wrap; }
#workbench .note { font-size: 11px; color: #c9a98f; margin-top: 4px; min-height: 14px; }
#workbench .help { position: absolute; right: 16px; bottom: 14px; font-size: 11px; color: #c9a98f; text-shadow: 1px 1px 0 #000; }
`;

export class Workbench {
  constructor(game) {
    this.game = game; this.open = false; this.tab = 'effects';
    this.loader = new GLTFLoader();
  }

  // ------------------------------------------------------------------ the stage (made the first time it opens)
  build() {
    if (this.scene) return;
    const g = this.game, S = (this.scene = new THREE.Scene());
    S.background = new THREE.Color(0x1a0f16);
    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 400);
    this.camera.position.set(0, 2.2, 6.5);
    S.add(new THREE.HemisphereLight(0xffe6d0, 0x2a1820, 1.2));
    const sun = new THREE.DirectionalLight(0xfff0dc, 2.2); sun.position.set(3, 6, 4); S.add(sun);
    // the floor: a dark disc with metre rings and a grid, so size reads
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
    x.fillStyle = '#26161c'; x.fillRect(0, 0, 1024, 1024);
    x.strokeStyle = 'rgba(255,220,180,.10)'; x.lineWidth = 2; for (let i = 0; i <= 20; i++) { const p = (i / 20) * 1024; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, 1024); x.moveTo(0, p); x.lineTo(1024, p); x.stroke(); }
    x.strokeStyle = 'rgba(255,215,140,.28)'; for (let r = 1; r <= 10; r++) { x.beginPath(); x.arc(512, 512, (r / 10) * 512, 0, Math.PI * 2); x.stroke(); }
    const ft = new THREE.CanvasTexture(c); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 8;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 64), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2; S.add(floor); this.floor = floor;
    // a figure 1.7 m tall, for scale
    this.figure = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.26, 4, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a5a, roughness: 0.9, transparent: true, opacity: 0.45 }));
    this.figure.position.set(-1.6, 0.85, 0); S.add(this.figure);
    this.holder = new THREE.Group(); S.add(this.holder);
    // the effects play here through a VFX of their own, on this stage
    this.shim = { scene: S, camera: this.camera, player: { shake: 0, pos: new THREE.Vector3() }, events: null, glyphs: null, time: null, post: null };
    this.vfx = new Vfx(this.shim);
    this.vfx.lib = LIBRARY; // (the same library as the world's: an edit here is an edit there)
    this.controls = new OrbitControls(this.camera, g.renderer.domElement);
    this.controls.target.set(0, 1, 0); this.controls.enableDamping = true; this.controls.update();
    this.ui();
  }

  ui() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const root = (this.root = document.createElement('div')); root.id = 'workbench'; root.style.display = 'none';
    root.innerHTML = `<div class="wb">
      <div class="tabs"><b data-t="effects">EFFECTS</b><b data-t="models">MODELS</b><b data-t="textures">TEXTURES</b><b class="x" title="close (Esc)">×</b></div>
      <input type="search" placeholder="search">
      <div class="list"></div>
      <div class="pane"></div>
    </div><div class="help">drag: orbit · right drag: pan · wheel: zoom · Space: play · Esc: close</div>`;
    document.body.appendChild(root);
    root.querySelectorAll('.tabs b[data-t]').forEach((b) => b.addEventListener('click', () => this.show(b.dataset.t)));
    root.querySelector('.tabs .x').addEventListener('click', () => this.toggle(false));
    this.search = root.querySelector('input[type=search]'); this.search.addEventListener('input', () => this.list());
    this.listEl = root.querySelector('.list'); this.pane = root.querySelector('.pane');
    root.addEventListener('keydown', (e) => e.stopPropagation()); // (typing here is not the game's)
    addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.code === 'Escape') { this.toggle(false); e.preventDefault(); }
      if (e.code === 'Space' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') { this.play(); e.preventDefault(); }
    }, true);
    this.game.theme?.watch?.(root);
  }

  toggle(on = !this.open) {
    if (on === this.open) return;
    this.build();
    this.open = on;
    const g = this.game;
    this.root.style.display = on ? '' : 'none';
    this.controls.enabled = on;
    g.ui?.want?.('workbench', on); // (the game's HUD steps out: the stage is the workbench's)
    if (on) { document.exitPointerLock?.(); this.prevInput = g.input.enabled; g.input.enabled = false; this.show(this.tab); }
    else { this.clearHolder(); this.stopHeld(); g.input.enabled = this.prevInput ?? true; }
    g.events?.emit('workbench', { open: on });
  }

  show(tab) {
    this.tab = tab;
    this.root.querySelectorAll('.tabs b[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    this.clearHolder(); this.stopHeld();
    this.figure.visible = true;
    this.pane.innerHTML = '';
    if (tab === 'effects') this.effectsPane();
    else if (tab === 'models') this.modelsPane();
    else this.texturesPane();
    this.list();
  }

  // ------------------------------------------------------------------ the list (whatever the tab lists)
  entries() {
    if (this.tab === 'effects') return Object.keys(LIBRARY).sort().map((n) => ({ id: n, grp: n.split('.')[0], label: n }));
    if (this.tab === 'textures') return [...vfxTextureNames().map((n) => ({ id: `tex:${n}`, grp: 'effect textures', label: n })), { id: 'atlas', grp: 'sprites', label: 'the sprite atlas' }];
    const out = [];
    for (const f of Object.keys(GLBS)) out.push({ id: `glb:${f}`, grp: f.includes('/vfx/') ? 'effect meshes' : 'models', label: f.split('/').pop().replace('.glb', '') });
    out.push({ id: 'tool:dreamvane', grp: 'tools', label: 'the Dreamvane' }, { id: 'tool:crucibelle', grp: 'tools', label: 'the Crucibelle' });
    for (const id of Object.keys(ITEMS).sort()) out.push({ id: `thing:${id}`, grp: 'things', label: ITEMS[id].name || id });
    for (const c of CURIOS) out.push({ id: `curio:${c.id}`, grp: 'curios', label: c.name || c.id });
    return out;
  }

  list() {
    const q = (this.search.value || '').toLowerCase();
    const items = this.entries().filter((e) => !q || e.label.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    let grp = null; const html = [];
    for (const e of items) {
      if (e.grp !== grp) { grp = e.grp; html.push(`<div class="grp">${grp.toUpperCase()}</div>`); }
      html.push(`<div data-id="${e.id}" class="${e.id === this.sel ? 'on' : ''}">${e.label}</div>`);
    }
    this.listEl.innerHTML = html.join('');
    this.listEl.querySelectorAll('div[data-id]').forEach((d) => d.addEventListener('click', () => this.pick(d.dataset.id)));
  }

  pick(id) {
    this.sel = id;
    this.listEl.querySelectorAll('div[data-id]').forEach((d) => d.classList.toggle('on', d.dataset.id === id));
    if (this.tab === 'effects') { this.loadEffect(id); this.play(); }
    else if (this.tab === 'models') this.loadModel(id);
    else this.loadTexture(id);
  }

  // ------------------------------------------------------------------ EFFECTS
  effectsPane() {
    this.fx = this.fx || { power: 1, speed: 1, tint: '#ffd76a', loop: true, every: 1.6, target: 'air' };
    const F = this.fx;
    this.pane.innerHTML = `
      <div class="ctl">
        <span>power</span><input type="range" min="0.2" max="3" step="0.05" value="${F.power}" data-k="power"><output>${F.power}</output>
        <span>speed</span><input type="range" min="0.05" max="2" step="0.05" value="${F.speed}" data-k="speed"><output>${F.speed}</output>
        <span>loop every</span><input type="range" min="0.4" max="6" step="0.1" value="${F.every}" data-k="every"><output>${F.every}</output>
        <span>tint</span><input type="color" value="${F.tint}" data-k="tint"><span></span>
      </div>
      <div class="row"><button data-a="play">PLAY ␣</button><button data-a="loop">${F.loop ? 'LOOP ON' : 'LOOP OFF'}</button><button data-a="target">AT: ${F.target.toUpperCase()}</button><button data-a="stop">STOP</button></div>
      <textarea spellcheck="false" placeholder="pick an effect"></textarea>
      <div class="row"><button data-a="apply">APPLY</button><button data-a="revert">REVERT</button><button data-a="copy">COPY</button><button data-a="copyall">COPY ALL EDITS</button><button data-a="dup">DUPLICATE AS…</button></div>
      <div class="note"></div>`;
    this.pane.style.cssText = 'display:flex;flex-direction:column;flex:1 1 55%;min-height:0';
    this.edit = this.pane.querySelector('textarea'); this.note = this.pane.querySelector('.note');
    this.pane.querySelectorAll('input[data-k]').forEach((i) => i.addEventListener('input', () => {
      F[i.dataset.k] = i.type === 'color' ? i.value : +i.value;
      if (i.nextElementSibling?.tagName === 'OUTPUT') i.nextElementSibling.textContent = i.value;
    }));
    this.pane.querySelectorAll('button[data-a]').forEach((b) => b.addEventListener('click', () => this.act(b.dataset.a, b)));
    this.loopT = 0;
  }

  loadEffect(name) {
    if (!this.edit) return;
    this.edit.value = JSON.stringify(LIBRARY[name] || {}, null, 1);
    const edited = this.overrides()[name];
    this.say(edited ? 'edited here (kept in this browser): REVERT puts the library\'s back' : '');
  }

  overrides() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } }
  saveOverrides(o) { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch { /* private window */ } }
  say(t) { if (this.note) this.note.textContent = t; }

  act(a, btn) {
    const F = this.fx, name = this.sel;
    if (a === 'play') this.play();
    else if (a === 'stop') this.stopHeld();
    else if (a === 'loop') { F.loop = !F.loop; btn.textContent = F.loop ? 'LOOP ON' : 'LOOP OFF'; }
    else if (a === 'target') { F.target = { air: 'ground', ground: 'air' }[F.target]; btn.textContent = `AT: ${F.target.toUpperCase()}`; }
    else if (a === 'apply' && name) {
      try {
        const def = JSON.parse(this.edit.value);
        LIBRARY[name] = def; const o = this.overrides(); o[name] = def; this.saveOverrides(o);
        this.say('applied: here and in the world (kept in this browser)'); this.play();
      } catch (e) { this.say(`not applied: ${e.message}`); }
    } else if (a === 'revert' && name) {
      const o = this.overrides(); delete o[name]; this.saveOverrides(o);
      if (PRISTINE[name]) LIBRARY[name] = JSON.parse(JSON.stringify(PRISTINE[name])); else delete LIBRARY[name];
      this.list(); if (LIBRARY[name]) this.loadEffect(name); this.say('reverted to the library');
    } else if (a === 'copy' && name) this.copy(`  '${name}': ${this.edit.value.trim()},\n`, 'copied: paste it into vfx/library.js');
    else if (a === 'copyall') { const o = this.overrides(); this.copy(Object.entries(o).map(([k, v]) => `  '${k}': ${JSON.stringify(v, null, 1)},`).join('\n') || '(no edits)', `copied ${Object.keys(o).length} edited effects`); }
    else if (a === 'dup' && name) {
      const n = prompt('the new effect\'s name (for example hit.blunt.metal)', `${name}.copy`);
      if (!n) return;
      LIBRARY[n] = JSON.parse(JSON.stringify(LIBRARY[name])); const o = this.overrides(); o[n] = LIBRARY[n]; this.saveOverrides(o);
      this.list(); this.pick(n);
    }
  }

  copy(text, msg) { navigator.clipboard?.writeText(text).then(() => this.say(msg), () => { this.edit.value = text; this.say('the clipboard refused: it is in the editor, select and copy it'); }); }

  stopHeld() { for (const h of this.vfx?.live || []) h.stop?.(); }

  play() {
    if (this.tab !== 'effects' || !this.sel || !this.vfx) return;
    const F = this.fx, held = this.vfx.layersOf(LIBRARY[this.sel] || {}).some((L) => L.dur === Infinity);
    if (held) this.stopHeld();
    const pos = new THREE.Vector3(0, F.target === 'air' ? 1.1 : 0.02, 0);
    this.vfx.play(this.sel, { pos, dir: new THREE.Vector3(1, 0.25, 0.4), normal: new THREE.Vector3(0, 1, 0), tint: parseInt(F.tint.slice(1), 16), power: F.power, floor: 0 });
    this.loopT = 0;
  }

  // ------------------------------------------------------------------ MODELS
  modelsPane() {
    this.mv = this.mv || { spin: true, view: 'shaded', figure: true };
    const M = this.mv;
    this.pane.innerHTML = `
      <div class="row"><button data-a="spin">${M.spin ? 'TURNTABLE ON' : 'TURNTABLE OFF'}</button><button data-a="view">VIEW: ${M.view.toUpperCase()}</button><button data-a="figure">FIGURE ${M.figure ? 'ON' : 'OFF'}</button><button data-a="frame">FRAME</button></div>
      <div class="row clips"></div>
      <div class="info"></div>`;
    this.pane.style.cssText = 'display:flex;flex-direction:column;flex:1 1 40%;min-height:0;overflow:auto';
    this.pane.querySelectorAll('button[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a;
      if (a === 'spin') { M.spin = !M.spin; b.textContent = M.spin ? 'TURNTABLE ON' : 'TURNTABLE OFF'; }
      else if (a === 'view') { M.view = { shaded: 'wire', wire: 'normals', normals: 'uv', uv: 'shaded' }[M.view]; b.textContent = `VIEW: ${M.view.toUpperCase()}`; this.applyView(); }
      else if (a === 'figure') { M.figure = !M.figure; b.textContent = `FIGURE ${M.figure ? 'ON' : 'OFF'}`; this.figure.visible = M.figure; }
      else if (a === 'frame') this.frameModel();
    }));
    this.info = this.pane.querySelector('.info'); this.clipsEl = this.pane.querySelector('.clips');
  }

  clearHolder() {
    if (!this.holder) return;
    for (const c of [...this.holder.children]) this.holder.remove(c);
    this.mixer = null; this.packClip = null; this.model = null; this.texPlane = null;
  }

  async loadModel(id) {
    this.clearHolder();
    let obj = null, clips = [];
    try {
      if (id.startsWith('glb:')) {
        const b64 = await GLBS[id.slice(4)]();
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const gl = await this.loader.parseAsync(bin.buffer, '');
        obj = gl.scene; clips = gl.animations || [];
      } else if (id === 'tool:dreamvane') obj = new DreamvaneModel().group;
      else if (id === 'tool:crucibelle') obj = new CrucibelleModel().group;
      else if (id.startsWith('thing:')) obj = buildThing(id.slice(6))?.group;
      else if (id.startsWith('curio:')) obj = buildCurio(id.slice(6))?.group;
    } catch (e) { this.info.textContent = `could not build it: ${e.message}`; return; }
    if (!obj) { this.info.textContent = 'nothing to show'; return; }
    this.model = obj; this.holder.add(obj);
    obj.traverse((o) => { if (o.isMesh) { o.userData.mat0 = o.material; o.frustumCulled = false; } });
    // standing on the floor, its middle over the centre
    const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3());
    obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;
    this.applyView(); this.frameModel();
    // its clips: a GLB's own, and for the Courier every clip of the game's pack
    this.clipsEl.innerHTML = '';
    if (clips.length) {
      this.mixer = new THREE.AnimationMixer(obj);
      for (const cl of clips) this.clipButton(cl.name, () => { this.mixer.stopAllAction(); this.mixer.clipAction(cl).play(); this.packClip = null; });
    }
    const pack = this.game.character?.clips;
    if (id.endsWith('/courier.glb') && pack) {
      const bones = {}; obj.traverse((o) => { if (o.isBone) bones[o.name] = o; });
      this.packBones = pack.bones.map((n) => bones[n]); this.packHip = bones.spine;
      const sel = document.createElement('select');
      sel.innerHTML = `<option value="">a clip of the game's pack (${Object.keys(pack.clips).length})</option>` + Object.keys(pack.clips).sort().map((n) => `<option>${n}</option>`).join('');
      sel.addEventListener('change', () => { this.packClip = sel.value || null; this.packT = 0; });
      sel.style.cssText = 'width:100%;background:rgba(0,0,0,.4);color:inherit;border:1px solid rgba(255,255,255,.2);padding:3px';
      this.clipsEl.appendChild(sel);
    }
    // the counts
    let verts = 0, tris = 0; const mats = new Set(), texs = new Set(); let bones = 0;
    obj.traverse((o) => {
      if (o.isBone) bones++;
      if (!o.isMesh) return;
      const g = o.geometry; verts += g.attributes.position.count; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      for (const m of [].concat(o.material)) { mats.add(m); for (const k of ['map', 'emissiveMap', 'normalMap']) if (m[k]) texs.add(m[k]); }
    });
    const size = box.getSize(new THREE.Vector3());
    this.info.textContent = `${id.replace(/^\w+:/, '')}\nvertices ${verts}   triangles ${Math.round(tris)}\nmaterials ${mats.size}   textures ${texs.size}   bones ${bones}\nsize ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m${clips.length ? `\nclips: ${clips.length}` : ''}`;
  }

  clipButton(name, fn) { const b = document.createElement('button'); b.textContent = name; b.addEventListener('click', fn); this.clipsEl.appendChild(b); }

  applyView() {
    if (!this.model) return;
    const v = this.mv.view;
    this.uvTex ||= (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#e8d6c0' : '#7a4a5a'; x.fillRect(i * 32, j * 32, 32, 32); } x.fillStyle = '#ffd76a'; x.font = 'bold 22px monospace'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) x.fillText(String.fromCharCode(65 + i) + (j + 1), i * 32 + 3, j * 32 + 22); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      const skin = !!o.isSkinnedMesh;
      o.material = v === 'shaded' ? o.userData.mat0
        : v === 'wire' ? new THREE.MeshBasicMaterial({ color: 0xffd76a, wireframe: true })
        : v === 'normals' ? new THREE.MeshNormalMaterial()
        : new THREE.MeshBasicMaterial({ map: this.uvTex });
      if (skin && o.material !== o.userData.mat0) o.material.skinning = true;
    });
  }

  frameModel() {
    if (!this.model) return;
    const box = new THREE.Box3().setFromObject(this.model), s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const r = Math.max(0.3, s.length() * 0.6);
    this.controls.target.copy(c);
    this.camera.position.copy(c).add(new THREE.Vector3(0.6, 0.35, 1).normalize().multiplyScalar(r / Math.tan((this.camera.fov * Math.PI) / 360)));
    this.controls.update();
  }

  // ------------------------------------------------------------------ TEXTURES
  texturesPane() { this.pane.innerHTML = '<div class="info">a texture, shown on the stage (the alpha as white on the dark)</div>'; this.figure.visible = false; }
  loadTexture(id) {
    this.clearHolder();
    const map = id === 'atlas' ? atlas() : vfxTexture(id.slice(4));
    if (!map) return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map, transparent: true, color: 0xfff0dc, side: THREE.DoubleSide }));
    m.position.y = 1.6; this.holder.add(m); this.texPlane = m;
    this.controls.target.set(0, 1.6, 0); this.camera.position.set(0, 1.6, 4.2); this.controls.update();
  }

  // ------------------------------------------------------------------ every frame while open
  frame(dt) {
    const g = this.game, raw = dt;
    if (this.camera.aspect !== innerWidth / innerHeight) { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
    this.controls.update();
    if (this.tab === 'effects' && this.fx) {
      const sp = this.fx.speed;
      this.vfx.update(raw * sp);
      if (this.fx.loop && this.sel) { this.loopT += raw * sp; if (this.loopT >= this.fx.every) this.play(); }
    } else this.vfx.update(raw);
    if (this.mv?.spin && this.model && this.tab === 'models') this.model.rotation.y += raw * 0.5;
    if (this.mixer) this.mixer.update(raw);
    if (this.packClip && this.packBones) { // (the game's own clip, on the Courier: bone by bone, as character.js applies it)
      const C = g.character.clips, pose = (this.packPose ||= C.pose());
      this.packT += raw; C.sample(this.packClip, this.packT, pose, true);
      this.packBones.forEach((b, i) => b?.quaternion.fromArray(pose.q, i * 4));
      if (this.packHip) this.packHip.position.fromArray(pose.p);
    }
    g.post.render(this.scene, this.camera);
  }
}
