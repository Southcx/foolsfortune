// ---------------------------------------------------------------------------------------
// THE CASTER SHADERS' STAGE, S6 TO S10 (MODELS: `caster:shaders2`): the second five caster shaders (vfx/caster/) side by side on the
// Workbench, each over something that shows it, with its sliders: lensing (a black hole before a test card and a few pots), the time
// grade (a sphere over pots that turn and bob, so HOLD and SMEAR read), the hologram (a clone of the Courier's body, skinned, and a
// Holowall), molten (a lava lamp and a glob crusting over on a loop), the corrupted body (a clone of the Courier's body and a pot).
// FOCUS takes the camera to one; its sliders are the module's own `set` keys (and `k`, its strength).
//
// Prior art: a lookdev turntable's test card and the material ball, the shader-graph previews of Unity and Unreal (each node's own
// look, its inputs beside it).
//
//   buildStage('caster:shaders2', game) -> Group   userData.focus(i | name)   userData.parts { lensing, timegrade, hologram, molten, corrupted }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { Lensing } from '../vfx/caster/lensing.js';
import { TimeGrade } from '../vfx/caster/timegrade.js';
import { Hologram } from '../vfx/caster/hologram.js';
import { Molten } from '../vfx/caster/molten.js';
import { Corrupted } from '../vfx/caster/corrupted.js';

export const CASTER_SHADER_STAGE2_IDS = ['caster:shaders2'];
const NAMES = ['lensing', 'timegrade', 'hologram', 'molten', 'corrupted'];
const LABEL = { lensing: 'S6 LENSING', timegrade: 'S7 THE TIME GRADE', hologram: 'S8 THE HOLOGRAM', molten: 'S9 MOLTEN', corrupted: 'S10 THE CORRUPTED BODY' };
const X = [-12, -6, 0, 6, 12];
// each slider: [key, min, max, step]
const SPEC = {
  lensing: [['k', 0, 1, 0.01], ['size', 0.05, 1.2, 0.01], ['disc', 0, 2, 0.05], ['inner', 1.8, 5, 0.1], ['outer', 3, 12, 0.1], ['tilt', -1.5, 1.5, 0.01], ['spin', 0, 4, 0.05], ['doppler', 0, 1, 0.01], ['ring', 0, 2, 0.05]],
  timegrade: [['k', 0, 1, 0.01], ['radius', 0.5, 3, 0.05], ['drain', 0, 1, 0.01], ['grain', 0, 1, 0.01], ['rim', 0, 1, 0.01], ['hold', 0, 24, 1], ['smear', 0, 0.95, 0.01]],
  hologram: [['k', 0, 1, 0.01], ['alpha', 0, 1.5, 0.01], ['scan', 0, 1, 0.01], ['sweep', 0, 2, 0.05], ['slip', 0, 1, 0.01], ['flicker', 0, 1, 0.01], ['hex', 0, 1, 0.01]],
  molten: [['k', 0, 1, 0.01], ['heat', 0, 1, 0.01], ['crust', 0, 1, 0.01], ['blobs', 1, 8, 1], ['speed', 0, 3, 0.05], ['soft', 0.05, 0.8, 0.01]],
  corrupted: [['k', 0, 1, 0.01], ['tear', 0, 1, 0.01], ['crush', 0, 1, 0.01], ['drain', 0, 1, 0.01], ['drop', 0, 1, 0.01], ['cell', 0.05, 0.5, 0.01]],
};
const CSS = `div.castershaders{position:fixed;left:12px;bottom:12px;width:280px;padding:8px 10px;background:rgba(18,10,16,.86);color:#f0dcc8;font:12px/1.4 monospace;box-sizing:border-box;border:1px solid rgba(255,215,140,.25);z-index:40}
div.castershaders .foc{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px}div.castershaders .foc button{flex:1 0 auto;background:rgba(0,0,0,.4);color:inherit;border:1px solid rgba(255,255,255,.2);font:inherit;padding:1px 4px;cursor:pointer}
div.castershaders .foc button.on{border-color:#ffd76a;color:#ffd76a}div.castershaders .row{display:grid;grid-template-columns:62px 1fr 38px;gap:6px;align-items:center}div.castershaders input{width:100%;margin:0}div.castershaders b{display:block;margin:2px 0 4px;color:#ffd76a}`;

/** A test card behind a look: bars of the house's colours, a fine grid and a few stars, so a bend or a grade reads. */
function testCard() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const x = c.getContext('2d');
  x.fillStyle = '#21141c'; x.fillRect(0, 0, 512, 320);
  ['#ffd76a', '#b49be6', '#ff9a5c', '#2480fa', '#38c78c', '#c46a45', '#e8d6c0'].forEach((col, i) => { x.fillStyle = col; x.fillRect(24 + i * 68, 40, 44, 160); });
  x.strokeStyle = 'rgba(255,230,200,.28)'; x.lineWidth = 2; for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 320); x.stroke(); } for (let j = 0; j <= 10; j++) { x.beginPath(); x.moveTo(0, j * 32); x.lineTo(512, j * 32); x.stroke(); }
  x.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const r = Math.random() * 1.6 + 0.6; x.beginPath(); x.arc(Math.random() * 512, 210 + Math.random() * 110, r, 0, Math.PI * 2); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const potGeo = () => new THREE.LatheGeometry([[0.001, 0], [0.22, 0.02], [0.3, 0.2], [0.26, 0.42], [0.14, 0.54], [0.16, 0.6], [0.001, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
const pot = (color, s = 1) => { const m = new THREE.Mesh(potGeo(), new THREE.MeshStandardMaterial({ color, roughness: 0.55 })); m.scale.setScalar(s); return m; };
/** A clone of the Courier's body (skinned), stood 1.7 m tall, or a pot when there is no Courier to clone. */
function body(game) {
  const src = game.character?.model;
  if (!src) return pot(0x9a7348, 2.4);
  const b = cloneSkinned(src), box = new THREE.Box3().setFromObject(b), h = box.max.y - box.min.y || 1;
  b.scale.multiplyScalar(1.7 / h); b.position.y -= box.min.y * (1.7 / h);
  return b;
}

export function casterShaderStage2(game) {
  const root = new THREE.Group(), card = testCard(), cardMat = new THREE.MeshBasicMaterial({ map: card });
  root.userData.placed = true;
  const station = (i) => { const g = new THREE.Group(); g.position.x = X[i]; root.add(g); const w = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.25), cardMat); w.position.set(0, 1.7, -2.6); g.add(w); return g; };
  const S = NAMES.map((_, i) => station(i));
  const parts = {}, props = [];
  // S6: a small black hole before the card, two pots beside it
  parts.lensing = [new Lensing(game, { parent: S[0], pos: new THREE.Vector3(0, 1.55, -0.4), size: 0.2 })];
  for (const [px, col] of [[-1.3, 0xb5532d], [1.2, 0x5f8a6a]]) { const p = pot(col, 1.4); p.position.set(px, 0, -0.9); S[0].add(p); }
  // S7: a sphere over pots that turn and bob (so HOLD and SMEAR read), one outside it to compare
  parts.timegrade = [new TimeGrade(game, { parent: S[1], pos: new THREE.Vector3(0, 1.1, 0), radius: 1.5 })];
  [[0xb5532d, -0.6], [0x2480fa, 0], [0xffd76a, 0.6], [0x38c78c, 2.1]].forEach(([col, px], i) => { const p = pot(col, 1.1); p.position.set(px, 0.4, i === 3 ? 0 : 0.2 * i - 0.2); S[1].add(p); props.push((t) => { p.rotation.y = t * (1.5 + i * 0.4); p.position.y = 0.4 + 0.25 * Math.sin(t * 2.2 + i); }); });
  // S8: the Courier's body as a Double, and a Holowall
  const dbl = body(game); dbl.position.x -= 0.9; S[2].add(dbl);
  parts.hologram = [new Hologram(game, { target: dbl }), new Hologram(game, { parent: S[2], pos: new THREE.Vector3(1.2, 0, -0.3), hex: 1, tint: 0xffd76a, size: [2, 2.4] })];
  parts.hologram[1].group.rotation.y = -0.45;
  props.push((t) => { if (t % 3 < 0.02) parts.hologram[0].blink(); });
  // S9: a lava lamp, and a glob crusting over on a ten-second loop
  parts.molten = [new Molten(game, { parent: S[3], pos: new THREE.Vector3(-0.9, 1.3, 0), size: 0.95 }), new Molten(game, { parent: S[3], pos: new THREE.Vector3(1.1, 0.6, 0.2), size: 0.5, mode: 'glob', blobs: 5 })];
  props.push((t) => { parts.molten[1].p.crust = Math.min(1, (t % 10) / 8); });
  // S10: the Courier's body corrupted, and a pot
  const vic = body(game); vic.position.x -= 0.8; S[4].add(vic);
  const jar = pot(0xc46a45, 2); jar.position.set(1.1, 0, 0); S[4].add(jar);
  parts.corrupted = [new Corrupted(game, { target: vic }), new Corrupted(game, { target: jar, cell: 0.12 })];
  props.push(() => { for (const c of parts.corrupted) S[4].localToWorld(c.at.set(0, 2.6, 1.5)); });
  for (const s of S) { const l = new THREE.PointLight(0xffe2c0, 6, 7, 1.6); l.position.set(0.5, 2.6, 1.6); s.add(l); }
  // the panel: FOCUS, and the focused shader's sliders
  let focus = 0, view = null;
  const host = game.workbench?.root || document.body;
  if (!document.getElementById('castershaders-css')) { const st = document.createElement('style'); st.id = 'castershaders-css'; st.textContent = CSS; document.head.appendChild(st); }
  const panel = document.createElement('div'); panel.className = 'castershaders'; host.appendChild(panel);
  const draw = () => {
    const name = NAMES[focus], P = parts[name][0];
    panel.innerHTML = `<div class="foc">${NAMES.map((n, i) => `<button data-f="${i}" class="${i === focus ? 'on' : ''}">S${i + 6}</button>`).join('')}</div><b>${LABEL[name]}</b>`
      + SPEC[name].map(([k, lo, hi, st]) => { const v = k === 'k' ? P.k : P.p[k]; return `<div style="display:flex;gap:6px;align-items:center;height:20px"><span style="width:58px">${k}</span><input style="flex:1;min-width:0;margin:0" type="range" min="${lo}" max="${hi}" step="${st}" value="${v}" data-k="${k}"><output style="width:34px;text-align:right">${(+v).toFixed(2)}</output></div>`; }).join('');
    panel.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => {
      const k = r.dataset.k, v = +r.value; r.nextElementSibling.textContent = v.toFixed(2);
      for (const x of parts[name]) { if (k === 'k') x.k = v; else x.set({ [k]: v }); }
    }));
  };
  panel.addEventListener('click', (e) => { const b = e.target.closest('button[data-f]'); if (b) root.userData.focus(+b.dataset.f); });
  root.userData.focus = (f) => { focus = typeof f === 'string' ? Math.max(0, NAMES.indexOf(f)) : f; view = null; if (game.workbench) game.workbench.follow = true; draw(); };
  root.userData.parts = parts;
  // the camera: before the focused station, eased there (until the stage is dragged)
  const want = new THREE.Vector3(), look = new THREE.Vector3();
  root.userData.shot = (cam) => {
    want.set(X[focus], 1.7, 5.4); look.set(X[focus], 1.25, -0.4);
    if (!view) { view = 1; cam.position.copy(want); } else cam.position.lerp(want, 0.15);
    cam.lookAt(look); game.workbench?.controls?.target.copy(look);
  };
  let pt = 0;
  root.userData.tick = (t) => {
    const dt = Math.max(0, Math.min(0.1, t - pt)); pt = t;
    for (const f of props) f(t);
    for (const n of NAMES) for (const x of parts[n]) x.update(dt);
  };
  root.userData.dispose = () => { for (const n of NAMES) for (const x of parts[n]) x.dispose(); panel.remove(); card.dispose(); cardMat.dispose(); };
  draw();
  return root;
}
