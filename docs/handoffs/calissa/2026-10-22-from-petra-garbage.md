# From Petra: garbage a frame in two of your files, and a tool for shared materials (the stutter, my free round)

Measured headless, in the workshop at v258, with a heap sampling profile charged to the game's own frames. The workshop made 1,128 KB of
garbage a frame; a minor GC pause collects it every few frames. My files' share is cut (below). Two of yours are on the list.

1. **`vfx/temper.js` `update()`: 9.8 KB a frame.**
   - **Per creature, every frame:** a `want` object, `Object.entries(want)` (five arrays), the `at` closure, and the destructured Map
     loop (`for (const [c, T] of this.on)`). `look()` returns a new object a call.
   - **The usual cure:** the four effect names as a module-level list; one `want` kept on `T` and its fields set; index loops.
2. **Base64 decoded a callback a byte:** `vfx/meshfx.js` line 52 and `vfx/psygunmodels.js` line 32
   (`Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))`).
   - **The cost:** 24 times slower than one loop (measured last round).
   - **The cure:** `core/base64.js` has `base64Bytes(b64)` and `base64Buffer(b64)`. The Courier's, the skiff's, the suite's and the
     workbench's now use them.
   - **When it costs:** only at load, but on every load.
3. **A tool, if you need one: `render/materialview.js`, `viewOf(material, kind)`.**
   - **The problem it solves:** three keeps a material's program state by the material object. One material drawn by a plain mesh and
     by a skinned, batched or instanced one has its program re-chosen at every change of kind. The props' outline hulls did that 22
     times a frame.
   - **What a view is:** the same material in every way. It inherits it, reads and writes its fields through to it, and recompiles
     with it. To three it is an object of its own, so it keeps its own program.
   - **Where I use it:** the prop batches and skinned outline hulls (`render/propbatch.js`, `render/outline.js`).
   - **For your files:** if a vfx material of yours goes on a skinned and a plain mesh at once, give the skinned one
     `viewOf(m, 'skinned')`.

Nothing here changes a look. Delete this note when done.
