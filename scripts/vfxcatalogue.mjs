// ---------------------------------------------------------------------------------------
// THE VFX CATALOGUE: writes docs/VFX-CATALOGUE.md, the exact list of every effect the game can play and every piece they are built
// from, read from the code itself (South, 2026-10-29: "make a note for yourself of exactly what vfx you have available for future
// use"). Run it after any change to the library: it is regenerated, never hand-edited.
//
// What it reads: src/vfx/library.js's LIBRARY (every family imported into it), each effect's comment in its source file, the files
// that ask for it by its exact name; the sprite shapes (vfx/sprites.js SHAPES), the decal textures (src/assets/vfx/tex/*.png and the
// drawn ones in vfx/vfx.js DRAWN), the baked effect meshes (src/assets/vfx/*.glb), the caster shaders (src/vfx/caster/*.js), and the
// shape layer's kit when it is there (src/vfx/shapes/: forms, patterns, ramps).
//
// Prior art: a sprite sheet's index and an engine's asset browser (Unreal's content browser filtered to Niagara systems): a name, what it
// is for, where it is used.
//
//   node scripts/vfxcatalogue.mjs   ->  docs/VFX-CATALOGUE.md
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rel = (p) => path.relative(ROOT, p);
const walk = (d, out = []) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, out); else if (f.name.endsWith('.js')) out.push(p); } return out; };
const tryImport = async (p) => { try { return await import(path.join(ROOT, p)); } catch { return null; } };

const { LIBRARY } = await import(path.join(ROOT, 'src/vfx/library.js'));
const { SHAPES } = await import(path.join(ROOT, 'src/vfx/sprites.js'));
const names = Object.keys(LIBRARY).sort();

// ---- each effect's comment and file: the `//` lines just above its key in the source
const vfxFiles = walk(path.join(ROOT, 'src/vfx'));
const where = {};
for (const f of vfxFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln, i) => {
    const m = ln.match(/^\s*(?:'([a-z][\w.]*)'|([a-z]\w*)):\s*(?:\{|\[|[a-zA-Z(])/);
    const key = m && (m[1] || m[2]);
    if (!key || !(key in LIBRARY) || where[key]) return;
    const notes = [];
    for (let j = i - 1; j >= 0 && /^\s*\/\//.test(lines[j]) && !/={5,}/.test(lines[j]); j--) notes.unshift(lines[j].replace(/^\s*\/\/\s?/, '').trim()); // (a section's banner ends the effect's own comment)
    const tail = ln.match(/\/\/\s*\((.*)\)\s*$/);
    where[key] = { file: rel(f), line: i + 1, note: (notes.join(' ') || (tail ? tail[1] : '')).replace(/\s+/g, ' ').trim() };
  });
}

// ---- who asks for it by its exact name (outside the library's own data)
const srcFiles = walk(path.join(ROOT, 'src'));
const texts = srcFiles.map((f) => [rel(f), fs.readFileSync(f, 'utf8')]);
const callers = (n) => texts.filter(([f, t]) => !/^src\/vfx\/library\.js$/.test(f) && (t.includes(`'${n}'`) || t.includes(`"${n}"`) || t.includes(`\`${n}\``)) && !where[n]?.file.endsWith(f)).map(([f]) => f.replace(/^src\//, ''));

// ---- a layer list in a few words
const layersOf = (def, seen = 0) => [...(def.extends && seen < 8 ? layersOf(LIBRARY[def.extends] || {}, seen + 1) : []), ...(def.layers || []).flat()];
const describe = (def) => {
  const Ls = layersOf(def), by = {};
  let held = false;
  for (const L of Ls) {
    if (L.dur === Infinity) held = true;
    const k = L.type === 'sprites' ? `sprites:${L.shape || 'soft'}` : L.type === 'mesh' ? `mesh:${L.mesh}` : L.type === 'decal' ? `decal:${L.tex}` : L.type === 'caster' ? `caster:${L.shader}` : L.type === 'shape' ? `shape:${L.form || 'quad'}` : L.type === 'fx' ? `fx:${L.fx}` : L.type === 'sound' ? `sound:${L.sfx}` : L.type;
    by[k] = (by[k] || 0) + 1;
  }
  return { held, n: Ls.length, parts: Object.entries(by).map(([k, c]) => (c > 1 ? `${k}×${c}` : k)).join(', ') };
};

// ---- the building blocks
const drawn = [...fs.readFileSync(path.join(ROOT, 'src/vfx/vfx.js'), 'utf8').matchAll(/^\s{2}([a-z]\w*): \(g, R\) =>/gm)].map((m) => m[1]);
const decals = fs.readdirSync(path.join(ROOT, 'src/assets/vfx/tex')).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''));
const meshes = fs.readdirSync(path.join(ROOT, 'src/assets/vfx')).filter((f) => f.endsWith('.glb')).map((f) => f.replace(/\.glb$/, ''));
const caster = fs.readdirSync(path.join(ROOT, 'src/vfx/caster')).filter((f) => f.endsWith('.js') && !/kit|warmup/.test(f)).map((f) => f.replace(/\.js$/, ''));
const headerLine = (p) => { const t = fs.readFileSync(p, 'utf8').split('\n').slice(1, 4).join(' ').replace(/\/\/\s?/g, '').replace(/\s+/g, ' ').trim(); return t.length > 170 ? `${t.slice(0, 167)}...` : t; };
const forms = await tryImport('src/vfx/shapes/forms.js');
const patterns = await tryImport('src/vfx/shapes/textures.js');
const ramps = null; // (read from its text below)
const keysOf = (m, ...names) => { for (const n of names) if (m?.[n] && typeof m[n] === 'object') return Object.keys(m[n]); return null; };

// ---- the families, by the name's first word
const fam = {};
for (const n of names) (fam[n.split('.')[0]] ||= []).push(n);

const out = [];
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
out.push('# The VFX catalogue (generated: do not edit)', '');
out.push(`Every effect the game can play, read from the code by \`node scripts/vfxcatalogue.mjs\` (${new Date().toISOString().slice(0, 10)}). ` +
  `${names.length} effects in ${Object.keys(fam).length} families. How effects are made and named: docs/VFX.md; the library's plan: docs/plans/art/VFX-LIBRARY.md.`, '');
out.push('**Play one:** `game.vfx.play(name, { pos, dir, normal, tint, power, scale, feeling, domain, suit, follow })`; a held one returns a handle (`h.pos`, `h.k`, `h.stop()`). ' +
  'A name falls back from the most particular (`hit.slash.crystal` -> `hit.slash` -> `hit`), so a new name always plays something.', '');
out.push('## The building blocks', '');
out.push('| block | what there is |', '|---|---|');
out.push(`| sprite shapes (\`vfx/sprites.js\`) | ${Object.keys(SHAPES).join(', ')} |`);
out.push(`| decal textures | ${[...decals, ...drawn.map((d) => `${d} (drawn)`)].join(', ')} |`);
out.push(`| baked effect meshes (\`src/assets/vfx/*.glb\`, Mesh Create) | ${meshes.join(', ')} |`);
out.push(`| caster shaders (\`vfx/caster/\`) | ${caster.join(', ')} |`);
// (the ramps' module reaches the fonts through the suits' colours, which node cannot load: its rows are read from its text)
const rampText = fs.existsSync(path.join(ROOT, 'src/vfx/shapes/ramps.js')) ? fs.readFileSync(path.join(ROOT, 'src/vfx/shapes/ramps.js'), 'utf8') : '';
const rampBlock = rampText.split('export const RAMP_STOPS = {')[1]?.split('\n};')[0] || '';
const F = forms?.FORM_NAMES || keysOf(forms, 'FORMS'), P = keysOf(patterns, 'PATTERNS'), R = keysOf(ramps, 'RAMPS') || ([...rampBlock.matchAll(/^\s{2}([a-z]\w*):/gm)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i));
if (F || P || R) {
  if (F) out.push(`| shape layer forms (\`vfx/shapes/forms.js\`) | ${F.join(', ')} |`);
  if (P) out.push(`| shape layer patterns (\`vfx/shapes/textures.js\`) | ${P.join(', ')} |`);
  if (R) out.push(`| shape layer ramps (\`vfx/shapes/ramps.js\`) | ${R.join(', ')}; and 'feeling', 'domain', 'suit', 'tint' from the caller |`);
} else out.push('| shape layer (`vfx/shapes/`) | not built yet |');
out.push('', 'Layer types: sprites, mesh, decal, shape, caster, flash, light, shake, hitstop, smear, glyph, sound, fx (vfx/vfx.js header).', '');
out.push('### The caster shaders', '');
for (const c of caster) out.push(`- **${c}**: ${headerLine(path.join(ROOT, 'src/vfx/caster', `${c}.js`))}`);
out.push('');

out.push('## The effects, by family', '');
out.push('Columns: the name; held (plays until stopped) or a one-shot; its layers (type:what ×count, its `extends` included); what it is (its comment in the source); who asks for it by that exact name (many are asked by a built name, e.g. `hit.${kind}.${material}`, and show none).', '');
for (const [f, list] of Object.entries(fam).sort((a, b) => b[1].length - a[1].length)) {
  out.push(`### ${f} (${list.length})`, '');
  out.push('| effect | kind | layers | what | asked by |', '|---|---|---|---|---|');
  for (const n of list) {
    const def = LIBRARY[n], d = describe(def), w = where[n], c = callers(n);
    const what = (def.extends ? `extends \`${def.extends}\`. ` : '') + (w?.note || '');
    out.push(`| \`${n}\` | ${d.held ? 'held' : 'one-shot'} | ${esc(d.parts)} | ${esc(what.length > 240 ? `${what.slice(0, 237)}...` : what)} | ${esc(c.slice(0, 3).join(', '))}${c.length > 3 ? ` +${c.length - 3}` : ''} |`);
  }
  out.push('');
}
fs.writeFileSync(path.join(ROOT, 'docs/VFX-CATALOGUE.md'), `${out.join('\n')}\n`);
console.log(`docs/VFX-CATALOGUE.md: ${names.length} effects, ${Object.keys(fam).length} families`);
