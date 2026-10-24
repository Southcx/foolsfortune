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

export function installContextLoss(renderer, game) {
  const el = renderer.domElement;
  let lostAt = 0;
  el.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // (asked back, not given up)
    lostAt = performance.now();
    try { game.save?.flush({ all: true }); } catch { /* its own business */ }
    game.events?.emit('render.lost', { by: 'environment' });
  });
  el.addEventListener('webglcontextrestored', () => {
    game.events?.emit('render.restored', { after: Math.round((performance.now() - lostAt) / 100) / 10, by: 'environment' });
  });
}
