// ---------------------------------------------------------------------------------------
// THE FIRST-DRAW BUDGET: on a phone, what the frame draws for the first time is let in a few at a time (the owner's iPhone XR, v287:
// the graphics taken back about 0.1 real s after a frame first drew some sixty new materials, turning the camera in the workshop and on
// the Raceway's first frame; and once before, v272, a frame after the warm-up's prime draw drew everything at once). A first draw on
// Safari is more than a draw: the card is handed the geometry's buffers and the material's textures, and ANGLE's Metal backend builds a
// render pipeline for that program, vertex layout and state, running the Metal compiler. Dozens in one frame is the burst the phone
// did not survive, whichever of those it was. So each frame admits at most FIRST.materials new pipelines (a program, blend state and vertex layout) and FIRST.mb of new buffers
// and textures; a draw past the budget is skipped this frame and comes in on a later one, a frame or a few late (a prop popping in as
// the view turns; behind the seam's cover, unseen: render/seam.js waits for `pending` to reach nothing before it lifts).
// Only draws into the frame (the canvas, or the frame's own target) are budgeted: a bake, an icon or a probe that draws a scene into a
// target of its own once is never skipped. Off on a desk (`FIRST.on`), or with `?firstdraws=0`.
//
// Prior art: a console streamer's per-frame upload budget (the PS2's VIF transfers spread over frames, id Tech's texture streaming's
// MB a frame), Unreal's PSO precache throttle (pipelines built a few a frame, the draws that want one deferred until it exists), and
// three.js's own lazy upload on first draw, which this paces rather than replaces.
//
//   game.firstDraws = installFirstDraws(game, renderer, { frameTarget: () => game.post.target })   .beginFrame() (boot/frame.js,
//   before the draw)   .pending (draws skipped the frame before)   .on   .admitted (pipelines admitted so far)
// ---------------------------------------------------------------------------------------

/** materials: new pipelines a frame (a program, blend state and vertex layout not drawn before); mb: new buffer and texture MB a frame (pixels at 4
 *  bytes, a third more with mips). */
export const FIRST = { materials: 4, mb: 3 };

const texOf = (m, out) => {
  for (const v of Object.values(m)) if (v?.isTexture) out.push(v);
  if (m.uniforms) for (const u of Object.values(m.uniforms)) { const v = u?.value; if (v?.isTexture) out.push(v); else if (Array.isArray(v)) for (const x of v) if (x?.isTexture) out.push(x); }
};
const geoBytes = (g) => { let n = g.index ? g.index.array.byteLength : 0; for (const a of Object.values(g.attributes)) n += a.array?.byteLength || 0; return n; };

export function installFirstDraws(game, renderer, { frameTarget }) {
  const off = typeof location !== 'undefined' && new URLSearchParams(location.search).get('firstdraws') === '0';
  let budget = FIRST.mb * 1e6, mats = FIRST.materials; // (before F: its beginFrame runs on a desk too, where nothing below is made)
  const F = { on: !!game.graphics?.machine?.mobile && !off, pending: 0, admitted: 0, skippedNow: 0, beginFrame() { F.pending = F.skippedNow; F.skippedNow = 0; budget = FIRST.mb * 1e6; mats = FIRST.materials; } };
  if (!F.on) return F;
  const seenMat = new Set(), seenGeo = new WeakSet(), P = renderer.properties;
  const forget = (e) => { seenGeo.delete(e.target); }; // (let go: it uploads again on its next draw, so it is new again)
  const usedBy = new WeakMap(); // (a texture -> the materials admitted with it: let go, they are new again, render/areas.js evicts them)
  const unseeTex = (e) => { for (const id of usedBy.get(e.target) || []) seenMat.delete(id); usedBy.delete(e.target); };
  // a draw's pipeline on Metal is its program and its vertex layout (and its state): one material on two layouts is two pipelines
  // (kept per object and per material, so a draw allocates nothing: a phone's collector pays for a string a draw)
  const pipes = new WeakMap(), keys = new WeakMap(), states = new WeakMap();
  const stateOf = (m) => { let k = states.get(m); if (!k || k.b !== m.blending || k.t !== m.transparent || k.c !== m.colorWrite) { k = { b: m.blending, t: m.transparent, c: m.colorWrite, k: `${m.blending}${m.transparent ? 't' : ''}${m.colorWrite ? '' : 'n'}${m.blendSrc}${m.blendDst}` }; states.set(m, k); } return k.k; };
  const keyOf = (o, g) => { let k = keys.get(o); if (k === undefined || k.g !== g) { k = { g, k: `${Object.entries(g.attributes).map(([n, a]) => `${n}${a.itemSize}${a.normalized ? 'n' : ''}${a.array?.constructor?.name?.[0] || ''}${a.isInterleavedBufferAttribute ? 'I' : ''}`).sort().join(',')}|${o.isInstancedMesh ? 'i' : ''}${o.isSkinnedMesh ? 's' : ''}` }; keys.set(o, k); } return k.k; };
  const direct = renderer.renderBufferDirect;
  renderer.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
    const rt = renderer.getRenderTarget();
    if (rt && rt !== frameTarget()) return direct.call(this, camera, scene, geometry, material, object, group); // (a bake's own target: never skipped)
    const newMat = material && !seenMat.has(material.uuid), newGeo = geometry && !seenGeo.has(geometry);
    // the pipeline: the program three gave the material (compiled at boot, so known before its first draw; a material not yet given one
    // is its own), its blend state, and the object's vertex layout
    const pipe = material && geometry && object ? keyOf(object, geometry) : null;
    const prog = material ? P.get(material).currentProgram || material : null;
    let mp = prog ? pipes.get(prog) : null;
    const st = material ? stateOf(material) : '';
    const newPipe = pipe !== null && !(mp && mp.get(pipe)?.has(st));
    if (newMat || newGeo || newPipe) {
      let cost = newGeo ? geoBytes(geometry) : 0;
      if (newMat) { const ts = []; texOf(material, ts); for (const t of ts) if (!P.get(t).__webglTexture) { const im = t.userData?.baked || t.image || {}; cost += (im.width || 0) * (im.height || 0) * (im.depth || 1) * 4 * (t.generateMipmaps ? 4 / 3 : 1); } }
      const fits = (!newPipe || mats > 0) && (cost <= budget || budget === FIRST.mb * 1e6); // (one thing bigger than the whole budget goes alone)
      if (!fits) { F.skippedNow++; return; }
      if (newPipe) { if (!mp) pipes.set(prog, (mp = new Map())); let ls = mp.get(pipe); if (!ls) mp.set(pipe, (ls = new Set())); ls.add(st); mats--; F.admitted++; }
      if (newMat) {
        seenMat.add(material.uuid);
        const ts = []; texOf(material, ts);
        for (const t of ts) { let u = usedBy.get(t); if (!u) { usedBy.set(t, (u = new Set())); t.addEventListener('dispose', unseeTex); } u.add(material.uuid); }
      }
      if (newGeo) { seenGeo.add(geometry); geometry.addEventListener('dispose', forget); }
      budget -= cost;
    }
    return direct.call(this, camera, scene, geometry, material, object, group);
  };
  return F;
}
