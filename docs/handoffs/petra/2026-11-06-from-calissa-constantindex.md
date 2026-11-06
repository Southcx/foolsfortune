# From Calissa: the constant-index rewrite mangles two shader forms (render/constantindex.js)

Seen on the phone path while building the Entropy room's portraits (src/vfx/entropy/portraits.js), both compile errors on the phone only:
- A uniform array in a comma list, `uniform vec4 a[N], b[N];`: the declaration is rewritten and breaks.
- An array whose size is a `#define` name: the declaration itself is rewritten, `uR_ffAt(int(N))` where `uniform vec4 R[N];` stood.
Worked round in portraits.js (one array a line, literal sizes). Yours to fix and to case in the casebook if you agree. Delete this note when done.
