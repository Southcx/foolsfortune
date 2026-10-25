// ---------------------------------------------------------------------------------------
// THE GRAPHICS CONTEXT LOST AND GIVEN BACK (docs/plans/MOBILE.md 10, answer 6). A phone takes the WebGL context away when it needs the
// memory (another app, a long background), and a desk's driver can reset; by default the canvas then stays black for good. Here the loss
// is refused as final (`preventDefault`, so the browser may give the context back), the save is written at once (the tab may be killed
// next), and both moments are told on the bus for the log. three.js rebuilds its own state on the restore: every program, texture and
// buffer is uploaded again from what it keeps, as it was the first time; nothing of ours holds a raw GL handle.
//
// Prior art: the WebGL spec's own recipe (webglcontextlost with preventDefault, then webglcontextrestored), three.js's
// WebGLRenderer context-restore path, and the console rule that a lost device is a pause, not a crash.
//
//   installContextLoss(renderer, game)   Events: render.lost { by: 'environment' }, render.restored { after: real s, by: 'environment' }
// ---------------------------------------------------------------------------------------

/** What the GPU held when it was taken back, one line for the page's box (a phone's crash, read off its screenshot: the owner's iPhone,
 *  v273, lost in the Great Dunemaw's fight with nothing to say why): the counts, the textures' rough MB, where, what areas were resident. */
function gpuLine(renderer, game) {
  const m = renderer.info.memory, P = renderer.properties, seen = new Set();
  let px = 0;
  const tex = (t) => { if (!t?.isTexture || seen.has(t)) return; seen.add(t); if (!P.get(t).__webglInit) return; const im = t.userData?.baked || t.image || {}; px += (im.width || 0) * (im.height || 0) * (t.generateMipmaps ? 4 / 3 : 1); };
  const mats = (o) => { for (const mt of [].concat(o.material || [])) { for (const v of Object.values(mt)) tex(v); if (mt.uniforms) for (const u of Object.values(mt.uniforms)) tex(u?.value); } };
  try { game.scene?.traverse(mats); game.overlayScene?.scene?.traverse(mats); } catch { /* counted what could be */ }
  const where = game.zones?.current ?? '?', res = game.areas?.stats?.().filter((a) => a.resident).map((a) => a.id).join(',') || '-';
  return `GPU then: ${m.geometries} geometries, ${m.textures} textures (about ${Math.round(px * 4 / 1048576)} MB of the scene's), ${renderer.info.programs?.length ?? '?'} programs; in ${where}; resident ${res}; tier ${game.graphics?.tier ?? '?'}`;
}

export function installContextLoss(renderer, game) {
  const el = renderer.domElement;
  let lostAt = 0;
  el.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // (asked back, not given up)
    lostAt = performance.now();
    try { game.save?.flush({ all: true }); } catch { /* its own business */ }
    try { window.__bootWatch?.show?.(gpuLine(renderer, game)); } catch { /* the box is the page's */ }
    game.events?.emit('render.lost', { by: 'environment' });
  });
  el.addEventListener('webglcontextrestored', () => {
    game.events?.emit('render.restored', { after: Math.round((performance.now() - lostAt) / 100) / 10, by: 'environment' });
  });
}
