// ---------------------------------------------------------------------------------------
// ITEM ICONS: the picture of a thing in its slot. Each is the thing's own model (a curio's, a lure's, a tool's), rendered once, small, from a three-
// quarter view under a warm key light and kept as an image: the slot shows the curio itself, outline and all, not a symbol for it.
// Rendered on first need (the box's window opening), with the game's own renderer into a little target and read back; if that fails
// the slot falls back to the curio's glyph in its tier's colour.
//
// Prior art: Old School RuneScape's item sprites (every item a small picture of its own model, at a fixed three-quarter angle), and
// the inventory portraits of the PS2 era rendered from the game's own meshes.
//
//   itemIcon(game, id) -> dataURL (cached)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { buildCurio } from '../world/treasure/curiomodel.js';
import { buildLure } from '../tools/sondelass/angling/luremodels.js';
import { buildThing } from './thingmodels.js';
import { itemOf } from './items.js';
import { SPECIES } from '../tools/sondelass/angling/species.js';
import { buildFish } from '../tools/sondelass/angling/fishmesh.js';

const CACHE = new Map(), S = 96, R = 2; // (drawn at twice the size and scaled down: smooth edges without a multisampled target)

export function itemIcon(game, id) {
  if (CACHE.has(id)) return CACHE.get(id);
  const it = itemOf(id);
  let url = null;
  try { url = render(game, it); } catch (e) { console.warn('icon', id, e); }
  if (!url) url = glyphIcon(it);
  CACHE.set(id, url);
  return url;
}

function render(game, it) {
  const r = game.renderer;
  if (!r || !it) return null;
  const m = modelOf(game, it);
  if (!m) return null;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3a2216, 1.8));
  const key = new THREE.DirectionalLight(0xffe6c8, 2.4); key.position.set(1.2, 2, 1.6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb27a, 1.2); rim.position.set(-1.5, 0.6, -1.2); scene.add(rim);
  scene.add(m.group);
  m.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m.group), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
  const cam = new THREE.PerspectiveCamera(28, 1, 0.01, 20);
  cam.position.copy(c).add(new THREE.Vector3(0.62, 0.45, 1).normalize().multiplyScalar(size * 1.9));
  cam.lookAt(c);
  const W = S * R, rt = new THREE.WebGLRenderTarget(W, W);
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prev = r.getRenderTarget(), clear = r.getClearColor(new THREE.Color()), alpha = r.getClearAlpha();
  const buf = new Uint8Array(W * W * 4);
  try {
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
    r.readRenderTargetPixels(rt, 0, 0, W, W, buf);
  } finally { r.setRenderTarget(prev); r.setClearColor(clear, alpha); }
  m.dispose(); rt.dispose();
  // (the target's rows are bottom-up)
  const big = document.createElement('canvas'); big.width = big.height = W;
  const img = big.getContext('2d').createImageData(W, W);
  for (let y = 0; y < W; y++) img.data.set(buf.subarray((W - 1 - y) * W * 4, (W - y) * W * 4), y * W * 4);
  big.getContext('2d').putImageData(img, 0, 0);
  const out = document.createElement('canvas'); out.width = out.height = S;
  const g = out.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, S, S);
  return out.toDataURL('image/png');
}

/** The thing's own model, to be rendered: a curio's, a lure's (tools/sondelass/angling/luremodels.js), or a tool's (a copy of what they wear). */
function modelOf(game, it) {
  if (it.kind === 'curio') return buildCurio(it.key, { sky: game.sky?.env });
  if (it.kind === 'lure') { const L = buildLure(it.key); L.group.rotation.set(0.25, 0.5, 0.15); return L; }
  if (it.kind === 'tool') {
    const src = it.tool === 'psygun' ? game.character?.gunModel : game.belt?.get(it.tool)?.model;
    if (!src) return null;
    const g = new THREE.Group(), c = src.clone(true);
    c.position.set(0, 0, 0); c.quaternion.identity(); c.scale.setScalar(1); c.visible = true;
    // (a resting tool's parts are on a layer no camera draws and its bake is shown instead, render/restbake.js: the parts, not the bake)
    c.traverse((o) => { o.layers.set(0); if (o.name === 'restbake') o.visible = false; });
    g.add(c);
    if (TOOL_TURN[it.tool]) c.rotation.set(...TOOL_TURN[it.tool]);
    return { group: g, dispose() {} };
  }
  if (['instrument', 'heart', 'key', 'material', 'shell'].includes(it.kind) || it.id.startsWith('ostracon.')) return buildThing(it.id);
  if (it.kind === 'fish') {
    const sp = SPECIES.find((x) => x.id === it.key); if (!sp) return null;
    const f = buildFish(sp, (sp.size[0] + sp.size[1]) / 2), g = new THREE.Group();
    g.add(f.group); f.group.rotation.set(0.2, 0.6, 0.35);
    return { group: g, dispose() { f.dispose?.(); } };
  }
  return null;
}
// (how each tool is turned for its picture: lying across the slot, the way OSRS lays a sword diagonally)
const TOOL_TURN = { psygun: [0, Math.PI / 2, 0.3], sondelass: [0, 0, 0.75], soulbrush: [0, 0, 0.75], veritome: [0.3, 0.6, 0], dreamvane: [0, 0, 0.8], crucibelle: [0.2, 0.5, 0], lockheart: [0.2, 0.5, 0] };

function glyphIcon(it) {
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = it ? `#${it.color.toString(16).padStart(6, '0')}` : '#ccc';
  g.font = `${S * 0.6}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(it?.glyph || '?', S / 2, S / 2);
  return c.toDataURL('image/png');
}
