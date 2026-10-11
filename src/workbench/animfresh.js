// ---------------------------------------------------------------------------------------
// THE ANIM LAB'S FRESH STATE: what the Anim Lab's Courier and tools (workbench/animrig.js) hold as they were built, kept, and put back
// before every take (workbench/animtake.js), so a take is the same whatever was played before it: the rig's clock and its idle's
// phase, the foot locks, every damped blend and lazily made field of character.js and its modules, each tool's own (the rod's cast, a
// combo engine's clock, the grips), the body and the keys. Without it a take began where the last one stopped (60 degrees at a foot on
// the same cut played twice; the rod held up after a cast).
//
// It walks the state the lab's own objects hold and keeps a copy: numbers and flags, the vectors and quaternions (copied back into the
// same instances), arrays, maps, sets and small typed arrays, and every object of the lab's own reached from them; a field added since
// is taken away again, so what is made lazily is made again the same way. What it never walks, only puts the reference back: an
// Object3D, a material, a geometry, a texture, a page element, what the caller names (`never`: the clip library), and everything the
// game itself holds (`gameHeld`: walked from the game and the config tables, the Workbench left out), so a table the lab's tools share
// with the game's (a moveset's table, a loadout, a knob) is never written back. The Object3Ds under `nodes` (the gun, the tools'
// models, what the tools put in the scene) keep their place, turn, scale, visibility and children, for a part a tool moves from where
// it was.
//
// Prior art: an emulator's save state (the whole machine kept and put back, so a run plays again from the same point), the test
// fixture made fresh for every test (Meszaros, xUnit Test Patterns: Fresh Fixture), Unreal's Persona preview instance reset between
// previews.
//
//   const held = gameHeld(game, { leave: [game.workbench] })   const F = keepFresh(roots, { held, never, nodes })   F.restore()   F.count
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';

const BIG = 1 << 16; // (a typed array longer than this is data, never state: a clip's samples, a texture's pixels)
const isValue = (o) => o.isVector2 || o.isVector3 || o.isVector4 || o.isQuaternion || o.isEuler || o.isColor || o.isMatrix3 || o.isMatrix4;
const is = (o, name) => typeof globalThis[name] === 'function' && o instanceof globalThis[name];

/** Never walked (the reference alone is put back): three's scene objects and GPU things, the page's, the browser's, a big buffer. */
function opaque(o) {
  return o === globalThis || o.isObject3D || o.isMaterial || o.isBufferGeometry || o.isTexture || o.isSkeleton || o.isRenderTarget || o.isWebGLRenderTarget
    || o instanceof Promise || o instanceof WeakMap || o instanceof WeakSet || o instanceof ArrayBuffer || (ArrayBuffer.isView(o) && !(o.length <= BIG))
    || is(o, 'Node') || is(o, 'AudioNode') || is(o, 'BaseAudioContext') || is(o, 'CanvasRenderingContext2D') || is(o, 'ImageData') || is(o, 'Event')
    || Object.isFrozen(o);
}

/** An object's own fields that hold a value (never a getter's: nothing is run), as [key, value]. */
function fields(o) {
  const out = [];
  try { for (const k of Object.keys(o)) { const d = Object.getOwnPropertyDescriptor(o, k); if (d && 'value' in d) out.push([k, d.value]); } } catch { /* a revoked proxy */ }
  return out;
}

/** What an object holds, to walk on. */
function within(o, push) {
  if (Array.isArray(o)) { for (const v of o) push(v); }
  else if (o instanceof Map) { for (const [k, v] of o) { push(k); push(v); } }
  else if (o instanceof Set) { for (const v of o) push(v); }
  else for (const [, v] of fields(o)) push(v);
}

/** Every object the game holds (walked from `game` and the config tables; `leave`, the Workbench that holds the lab, not walked). */
export function gameHeld(game, { leave = [] } = {}) {
  const held = new WeakSet(), stop = new Set(leave), stack = [game, T];
  const push = (v) => { if (v && typeof v === 'object' && !held.has(v) && !stop.has(v)) stack.push(v); };
  while (stack.length) {
    const o = stack.pop();
    if (held.has(o)) continue;
    held.add(o);
    if (!opaque(o) && !isValue(o) && !ArrayBuffer.isView(o)) within(o, push);
  }
  return held;
}

/** Keep the state held from `roots` (see the header); `held`: the game's (gameHeld), `never`: more objects not to walk. */
export function keepFresh(roots, { held = new WeakSet(), never = [], nodes = [] } = {}) {
  const kept = [], seen = new Set(never), stack = [...roots];
  const push = (v) => { if (v && typeof v === 'object' && !seen.has(v)) stack.push(v); };
  while (stack.length) {
    const o = stack.pop();
    if (seen.has(o)) continue;
    seen.add(o);
    if (held.has(o) || opaque(o)) continue;
    if (isValue(o)) kept.push({ o, kind: 'value', data: o.clone() });
    else if (ArrayBuffer.isView(o)) kept.push({ o, kind: 'typed', data: o.slice() });
    else if (Array.isArray(o)) kept.push({ o, kind: 'array', data: o.slice() });
    else if (o instanceof Map) kept.push({ o, kind: 'map', data: [...o] });
    else if (o instanceof Set) kept.push({ o, kind: 'set', data: [...o] });
    else { const data = fields(o); kept.push({ o, kind: 'object', data, keys: new Set(data.map((d) => d[0])) }); }
    if (!isValue(o) && !ArrayBuffer.isView(o)) within(o, push);
  }
  const objs = [];
  for (const top of nodes) top?.traverse?.((x) => objs.push({ x, children: x.children.slice(), p: x.position.clone(), q: x.quaternion.clone(), s: x.scale.clone(), v: x.visible, m: x.layers.mask }));
  return { count: kept.length, restore: () => restore(kept, objs) };
}

function restore(kept, objs) {
  for (const r of kept) {
    const o = r.o;
    if (r.kind === 'value') o.copy(r.data);
    else if (r.kind === 'typed') o.set(r.data);
    else if (r.kind === 'array') { o.length = r.data.length; for (let i = 0; i < r.data.length; i++) o[i] = r.data[i]; }
    else if (r.kind === 'map') { o.clear(); for (const [k, v] of r.data) o.set(k, v); }
    else if (r.kind === 'set') { o.clear(); for (const v of r.data) o.add(v); }
    else {
      for (const k of Object.keys(o)) if (!r.keys.has(k)) { const d = Object.getOwnPropertyDescriptor(o, k); if (d && 'value' in d && d.configurable) delete o[k]; } // (made since: made again)
      for (const [k, v] of r.data) if (o[k] !== v) { try { o[k] = v; } catch { /* read-only */ } }
    }
  }
  for (const r of objs) {
    const x = r.x;
    if (x.children.length !== r.children.length || x.children.some((c, i) => c !== r.children[i])) {
      for (const c of x.children.slice()) if (!r.children.includes(c)) x.remove(c);
      for (const c of r.children) if (c.parent !== x) x.add(c);
    }
    x.position.copy(r.p); x.quaternion.copy(r.q); x.scale.copy(r.s); x.visible = r.v; x.layers.mask = r.m;
  }
}
