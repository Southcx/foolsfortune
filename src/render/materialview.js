// ---------------------------------------------------------------------------------------
// MATERIAL VIEW: one material drawn by different kinds of mesh, without three re-choosing its program each time the kinds take turns.
//   three keeps a material's program state by the material object itself (WebGLProperties), and a material's program depends on what
//   draws it: a batch, a skinned mesh, an instanced or a plain one. So a material shared by two kinds that are drawn one after the other
//   has its program re-chosen at every change of kind: a parameters object, a key built and joined, the uniform list rebuilt. Measured
//   in the workshop (v258): the outline hull material changed kind 20 times a frame (a prop's plain hull, the prop batches' hulls, a
//   clapperjar's skinned hull), the props' own materials 5 times (a prop standing alone and its copies parked in a batch).
//   A VIEW of a material is an object of its own to three, so it keeps a program state of its own, and it is the same material in
//   every other way: its prototype is the material (it inherits everything, the shader hooks included), and each field the material
//   holds is read and written through to it. A change made on the material reaches what draws the view, a change made through the view
//   reaches the material, and `needsUpdate` on either recompiles both. Its id is the material's: the renderer sorts them together.
//   A shader material is returned as it is: three writes back to its uniforms (uniformsNeedUpdate), which a view would keep apart.
//
// Prior art: the prototype as a live delegate (JavaScript's own Object.create, Self's parent slots); three's per-variant depth
//   materials (WebGLShadowMap's _materialCache), which also give each variant an object of its own.
//
//   const v = viewOf(material, kind)    (kind: any name, 'batch', 'skinned'; one view a material and a kind, made once)
// ---------------------------------------------------------------------------------------

const VIEWS = new WeakMap(); // (material -> Map(kind -> view))

export function viewOf(m, kind) {
  if (!m || Array.isArray(m) || m.isShaderMaterial) return m;
  let by = VIEWS.get(m);
  if (!by) VIEWS.set(m, (by = new Map()));
  let v = by.get(kind);
  if (!v) {
    v = Object.create(m);
    for (const k of Object.keys(m)) Object.defineProperty(v, k, { enumerable: true, configurable: true, get: () => m[k], set: (x) => { m[k] = x; } });
    by.set(kind, v);
  }
  return v;
}
