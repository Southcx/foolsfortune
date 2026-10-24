// ---------------------------------------------------------------------------------------
// THE TOOL SKINS' CONTACT SHEET: every tool in every skin (vfx/toolskins.js TOOL_SKINS), the model alone on a dark ground, side on and a
// little turned, one row a tool, as one JPEG (docs/plans/art/tool-skins.jpg by default). Calissa's one headless look at a skin round.
// Each tool's own model is borrowed from the game (a copy sharing its materials, so what is laid is what the game lays), the skin set
// through game.toolSkins, drawn into a render target at twice the tile and halved on a canvas.
//
// Run: `npx vite --port 5747 &` then `URL=http://localhost:5747/ node scripts/toolskins-sheet.mjs [--out docs/plans/art/tool-skins.jpg]`.
// Prints any shader or page error and exits 1 on one.
//
// Prior art: the sweeps' harness (scripts/sweeps/harness.mjs: the page opened headless, manual mode, the clock pinned) and a print
// studio's contact sheet.
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { open, args } from './sweeps/harness.mjs';

const OUT = path.resolve(args.out && args.out !== true ? args.out : 'docs/plans/art/tool-skins.jpg');
const S = await open('toolskins');
const shot = await S.ev(async () => {
  const G = __game, g = G.game, THREE = G.THREE, R = G.renderer;
  const { TOOL_SKINS, TOOL_LABEL } = await import('/src/vfx/toolskins.js');
  const TW = 200, TH = 150, LW = 112, HEAD = 26, TOOLS = Object.keys(TOOL_SKINS), COLS = Math.max(...TOOLS.map((t) => Object.keys(TOOL_SKINS[t]).length));
  const sheet = document.createElement('canvas'); sheet.width = LW + COLS * TW; sheet.height = HEAD + TOOLS.length * (TH + 18);
  const x = sheet.getContext('2d'); x.fillStyle = '#0d0b10'; x.fillRect(0, 0, sheet.width, sheet.height);
  x.fillStyle = '#e8dcc0'; x.font = '15px Georgia, serif'; x.fillText("A tool's skin: every tool in every skin (vfx/toolskins.js TOOL_SKINS)", 10, 18);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x17141c);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x30283a, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(1.5, 2.5, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 1.2); rim.position.set(-2, 1, -2); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(28, TW / TH, 0.01, 50); cam.layers.enableAll();
  const rt = new THREE.WebGLRenderTarget(TW * 2, TH * 2); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const px = new Uint8Array(TW * 2 * TH * 2 * 4), tile = document.createElement('canvas'); tile.width = TW * 2; tile.height = TH * 2; const tx = tile.getContext('2d');
  // each tool's model, posed for its picture
  const lh = g.lockheart; lh?.coffin?.(); if (lh) lh.charge = lh.fill; // (half of twice its measure: the glass reliquary half full)
  const src = (t) => {
    if (t === 'psygun') return g.character.gunModel;
    const m = (g.player?.techs?.get?.(t) || g.belt.get(t))?.model; if (!m?.group) return null;
    if (t === 'sondelass' && m.setBlade) { m.setExtension(0); m.setBlade(1); m.setHook(false); }
    if (t === 'veritome') m.setOpen?.(0);
    return m.group;
  };
  const TURN = { psygun: [0, -0.5, 0], sondelass: [0, -0.4, 0.5], soulbrush: [0, -0.4, 0.55], veritome: [0.3, -0.6, 0.1], dreamvane: [0, -0.4, 0.9], crucibelle: [0, -0.5, 1.2], lockheart: [0, -0.4, -1.2] };
  const errs = [];
  TOOLS.forEach((t, row) => {
    const y0 = HEAD + row * (TH + 18);
    x.fillStyle = '#f2c35a'; x.font = '14px Georgia, serif'; x.fillText(TOOL_LABEL[t], 8, y0 + TH / 2);
    const s0 = src(t); if (!s0) { errs.push(`no model for ${t}`); return; }
    Object.entries(TOOL_SKINS[t]).forEach(([id, skin], col) => {
      g.toolSkins.set(t, id, { by: 'environment' }); g.toolSkins.update(1 / 60);
      const c = s0.clone(true);
      c.traverse((o) => { o.layers.set(0); }); for (const o of [...c.children]) if (o.name === 'restbake') c.remove(o);
      c.position.set(0, 0, 0); c.scale.setScalar(t === 'psygun' ? 1 : 1); c.rotation.set(...TURN[t]); c.visible = true;
      const holder = new THREE.Group(); holder.add(c); scene.add(holder); holder.updateMatrixWorld(true);
      const box = new THREE.Box3(); c.traverse((o) => { if (o.isMesh && o.visible && !o.userData.isOutline) { o.geometry.computeBoundingBox?.(); const b = o.geometry.boundingBox?.clone().applyMatrix4(o.matrixWorld); if (b && Number.isFinite(b.min.x)) box.union(b); } });
      const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), r = Math.max(size.x / cam.aspect, size.y) * 0.62 + 1e-3;
      cam.position.set(ctr.x, ctr.y, ctr.z + r / Math.tan((cam.fov * Math.PI) / 360)); cam.lookAt(ctr); cam.updateMatrixWorld();
      const prev = R.getRenderTarget(); R.setRenderTarget(rt); R.clear(); R.render(scene, cam); R.readRenderTargetPixels(rt, 0, 0, TW * 2, TH * 2, px); R.setRenderTarget(prev);
      scene.remove(holder);
      const im = tx.createImageData(TW * 2, TH * 2); for (let yy = 0; yy < TH * 2; yy++) im.data.set(px.subarray((TH * 2 - 1 - yy) * TW * 8, (TH * 2 - yy) * TW * 8), yy * TW * 8);
      tx.putImageData(im, 0, 0); x.drawImage(tile, LW + col * TW, y0, TW - 2, TH - 2);
      x.fillStyle = '#cfc6d8'; x.font = '11px Georgia, serif'; x.fillText(skin.label, LW + col * TW + 4, y0 + TH + 10);
    });
    g.toolSkins.set(t, 'stock', { by: 'environment' });
  });
  return { url: sheet.toDataURL('image/jpeg', 0.84), errs };
});
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(shot.url.split(',')[1], 'base64'));
const shaderErrs = S.errors.filter((e) => /Shader|WebGLProgram|GLSL|ERROR/i.test(e));
console.log(`sheet: ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB); ${shot.errs.length} model gaps ${JSON.stringify(shot.errs)}; ${S.errors.length} page errors`);
for (const e of [...new Set(S.errors)].slice(0, 8)) console.log('  ', e.slice(0, 600));
await S.browser.close();
process.exit(shaderErrs.length || shot.errs.length ? 1 : 0);
