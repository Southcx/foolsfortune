// ---------------------------------------------------------------------------------------
// UNIFORM ARRAYS READ AT CONSTANT INDICES, on a phone: every shader handed to WebGL is rewritten so that a uniform array read at an index
// worked out in the shader (`uTints[ti]`, `uW[i]` in a loop) reads it through a helper that picks the element at constant indices
// instead (`uTints_ffAt(int(ti))`, a binary chain of `if`s down to `return uTints[k];`). The picture is the same; an index past the end
// reads the nearest end rather than whatever lay there.
// Why (the owner's iPhone XR, iOS 18.7, 2026-10-26, measured in the box room, boot/box.js): the graphics were taken back at the first draw
// of the game's water every time, and the water cut down until it held: it held whole with its vertex shader's one `uTints[ti]` read at
// constant indices, and was lost with it read at the computed one. Some forty uniform arrays in twenty files are read so (the liquids,
// the vessel's cracks, the weather's splats); three.js's own shaders never are (it unrolls its loops), which is why most of the game
// drew and these did not. Phone only (`machine.mobile`): a desk's shaders are passed through untouched. `?constindex=1` forces it on
// (to see every program compile with it), `?constindex=0` off.
//
// Prior art: ANGLE's own RemoveDynamicIndexing pass (for Direct3D 9, which had no dynamic indexing: each dynamic read of a vector or
// matrix made a call to a generated helper), and three.js's `#pragma unroll_loop_start`, which turns its light loops into constant ones.
//
//   installConstantIndex(gl, { on })   on the context before three.js compiles anything (boot/renderer.js)  -> { on, arrays, shaders }
//   rewriteShader(source) -> { text, arrays: [names rewritten] }   the transform alone, for a test
// ---------------------------------------------------------------------------------------

const OPAQUE = /^[iu]?(sampler|image)/; // (opaque types: never returned from a function, and never read at a computed index in GLSL ES 3.0)

/** The `#define NAME <integer>` lines of a shader, for an array sized by one. */
function defines(src) {
  const D = new Map();
  for (const m of src.matchAll(/^[ \t]*#define[ \t]+(\w+)[ \t]+\(?\s*(\d+)\s*\)?[ \t]*$/gm)) D.set(m[1], Number(m[2]));
  return D;
}

/** A helper reading `name[i]` at constant indices: a binary chain of ifs, each leaf one constant read. */
function helper(type, name, size) {
  const pick = (lo, hi) => {
    if (hi - lo === 1) return `return ${name}[${lo}];`;
    const mid = (lo + hi) >> 1;
    return `if (i < ${mid}) { ${pick(lo, mid)} } else { ${pick(mid, hi)} }`;
  };
  return `\n${type} ${name}_ffAt(int i) { ${pick(0, size)} }\n`;
}

/** Every read of one of `names` at an index that is not a plain integer, from `from` on in `src`, made a call to its helper; spans in
 *  `skip` (the declarations) left alone. Nested reads are rewritten inside their index. */
function rewriteReads(src, names, skip = []) {
  if (!names.length) return { text: src, n: 0 };
  const re = new RegExp(`(?<![\\w.])(${names.join('|')})\\s*\\[`, 'g');
  let out = '', i = 0, n = 0;
  for (;;) {
    re.lastIndex = i;
    const m = re.exec(src); if (!m) break;
    const at = m.index, open = at + m[0].length - 1;
    if (skip.some(([a, b]) => at >= a && at < b)) { out += src.slice(i, open + 1); i = open + 1; continue; }
    let d = 1, j = open + 1;
    while (j < src.length && d) { if (src[j] === '[') d++; else if (src[j] === ']') d--; j++; }
    if (d) break; // (unbalanced: left as it is)
    const inner = src.slice(open + 1, j - 1);
    if (/^\s*\d+u?\s*$/.test(inner)) { out += src.slice(i, j); i = j; continue; } // (a constant index: as it is)
    const sub = rewriteReads(inner, names);
    out += `${src.slice(i, at)}${m[1]}_ffAt(int(${sub.text}))`; n += 1 + sub.n; i = j;
  }
  return { text: out + src.slice(i), n };
}

/** The transform: uniform arrays (not opaque) read at a computed index anywhere in the shader get a helper right after each of their
 *  declarations (inside the same #if, if there is one), and those reads call it. Arrays only ever read at constant indices, and lines
 *  commented out, are left alone. */
export function rewriteShader(src) {
  const D = defines(src), decls = [];
  for (const m of src.matchAll(/\buniform\s+((?:(?:lowp|mediump|highp)\s+)?)(\w+)\s+([^;{}]+);/g)) {
    const [whole, prec, type, list] = m;
    if (OPAQUE.test(type) || src.slice(src.lastIndexOf('\n', m.index) + 1, m.index).includes('//')) continue;
    for (const part of list.split(',')) {
      const a = part.match(/^\s*(\w+)\s*\[\s*(\w+)\s*\]\s*$/); if (!a) continue;
      const size = /^\d+$/.test(a[2]) ? Number(a[2]) : D.get(a[2]);
      if (size > 0) decls.push({ name: a[1], type: `${prec}${type}`, size, span: [m.index, m.index + whole.length] });
    }
  }
  if (!decls.length) return { text: src, arrays: [] };
  const skip = decls.map((d) => d.span);
  const used = new Set(decls.filter((d) => rewriteReads(src, [d.name], skip).n > 0).map((d) => d.name)); // (read at a computed index at all)
  if (!used.size) return { text: src, arrays: [] };
  // the helpers laid in after their declarations, in order, the declarations' spans moved with them
  const ends = [...new Set(decls.filter((d) => used.has(d.name)).map((d) => d.span[1]))].sort((a, b) => a - b);
  let text = '', last = 0, shift = 0;
  const moved = decls.map((d) => [...d.span]);
  for (const e of ends) {
    const add = decls.filter((d) => used.has(d.name) && d.span[1] === e).map((d) => helper(d.type, d.name, d.size)).join('');
    text += src.slice(last, e) + add; last = e;
    decls.forEach((d, k) => { if (d.span[0] >= e) { moved[k][0] = d.span[0] + shift + add.length; moved[k][1] = d.span[1] + shift + add.length; } else if (d.span[1] <= e) { moved[k][0] = d.span[0] + shift; moved[k][1] = d.span[1] + shift; } });
    shift += add.length;
  }
  text += src.slice(last);
  return { text: rewriteReads(text, [...used], moved).text, arrays: [...used] };
}

/** On a phone (or `?constindex=1`): every `shaderSource` given to this context passes through rewriteShader. */
export function installConstantIndex(gl, { on }) {
  let force = null;
  try { const q = new URLSearchParams(location.search).get('constindex'); if (q === '1' || q === '0') force = q === '1'; } catch { /* no location */ }
  const C = { on: force ?? !!on, arrays: new Set(), shaders: 0 };
  if (!C.on || !gl?.shaderSource) return C;
  const source = gl.shaderSource.bind(gl);
  gl.shaderSource = (shader, src) => {
    let text = src;
    try { const r = rewriteShader(src); if (r.arrays.length) { text = r.text; C.shaders++; for (const a of r.arrays) C.arrays.add(a); } } catch { text = src; } // (a shader the transform cannot read goes as it was)
    return source(shader, text);
  };
  return C;
}
