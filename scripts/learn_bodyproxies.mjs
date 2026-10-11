// THE BODY'S PROXIES, LEARNED: the Courier's body as the pose audit fits it (scripts/poseaudit.page.js: a capsule a body bone, its
// cross-section an ellipse centred where the flesh is, tapered, drawn in until it sits inside the skin), written as data for the game
// (src/courier/anim/bodyproxydata.js), so the posed body keeps its hands and forearms out of the very shapes the audit measures them
// against (courier/anim/standoff.js), and a held tool is turned off them (tools/toolbody.js turnOffBody). Also each hand's and forearm's
// own points: the vertices that bone or its fingers carry most, in that bone's bind frame, thinned to the farthest-apart few (farthest-
// point sampling), so the game tests a limb as the audit does (its skinned vertices) at a hundredth of the cost.
// Run it again when the Courier's model or rig changes.
//
//   npm run dev &      (or URL=http://host:port/)
//   node scripts/learn_bodyproxies.mjs
//
// Prior art: scripts/learn_rom.mjs (the game's own data learned from the game, written as a table), Unity's ragdoll wizard (a capsule a
// bone, sized from the mesh), and farthest-point sampling (Eldar et al., 1997) for the few points that stand for many.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const url = process.env.URL || 'http://127.0.0.1:5173/';
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const HAND_POINTS = 140, FORE_POINTS = 200; // (as many as the pose audit tests, 220 at most: every vertex of this body's hands and forearms)
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
await page.goto(`${url}?seed=1`, { waitUntil: 'commit' });
for (let i = 0; i < 240; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
await page.addScriptTag({ path: path.join(HERE, 'poseaudit.page.js') });
const out = await page.evaluate(({ HAND_POINTS, FORE_POINTS }) => {
  const A = window.__pa, ch = __game.game.character, THREE = __game.THREE;
  const r4 = (x) => +x.toFixed(4);
  const sec = (s) => [r4(s.cx), r4(s.cz), r4(s.ax), r4(s.az)];
  const proxies = A.caps.map((c) => ({ bone: c.name, part: c.part, y: [r4(c.y0), r4(c.y1), r4(c.ya), r4(c.yb)], s0: sec(c.s0), s1: sec(c.s1) }));
  // each limb's vertices in its own bones' bind frames (the hand's fingers by the finger that carries them)
  const LIMB = /^(forearm|hand|f_[a-z]+\d+|thumb\d+)([LR])$/, by = { forearmL: [], forearmR: [], handL: [], handR: [] };
  const v = new THREE.Vector3();
  ch.model.traverse((m) => {
    if (!m.isSkinnedMesh || m.userData.isOutline || !/^(Polygon_ID29006(_1)?|Courier_Skin_Core|Courier_Mask|Courier_Stones)$/.test(m.name)) return;
    const pos = m.geometry.attributes.position, si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
    for (let i = 0; i < pos.count; i++) {
      let best = -1, bw = -1;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      const bone = m.skeleton.bones[best], mm = bone.name.match(LIMB); if (!mm) continue;
      const limb = (mm[1] === 'forearm' ? 'forearm' : 'hand') + mm[2];
      const world = v.fromBufferAttribute(pos, i).applyMatrix4(m.bindMatrix).clone(); // (the bind pose, in the model's frame)
      const local = world.clone().applyMatrix4(m.skeleton.boneInverses[best]);
      by[limb].push({ bone: bone.name, world, local });
    }
  });
  // farthest-point sampling, in the bind pose: the first the furthest from the limb's middle, then each the furthest from those taken
  const fps = (pts, n) => {
    if (pts.length <= n) return pts;
    const mid = pts.reduce((a, p) => a.add(p.world), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const d = pts.map((p) => p.world.distanceToSquared(mid)), took = [];
    let k = d.indexOf(Math.max(...d));
    const near = new Float64Array(pts.length).fill(Infinity);
    for (let t = 0; t < n; t++) {
      took.push(pts[k]);
      let best = -1, bi = 0;
      for (let i = 0; i < pts.length; i++) { near[i] = Math.min(near[i], pts[i].world.distanceToSquared(pts[k].world)); if (near[i] > best) { best = near[i]; bi = i; } }
      k = bi;
    }
    return took;
  };
  const points = {};
  for (const [limb, list] of Object.entries(by)) points[limb] = fps(list, /^hand/.test(limb) ? HAND_POINTS : FORE_POINTS).map((p) => [p.bone, r4(p.local.x), r4(p.local.y), r4(p.local.z)]);
  return { proxies, points, counts: Object.fromEntries(Object.entries(by).map(([k, l]) => [k, l.length])) };
}, { HAND_POINTS, FORE_POINTS });
await browser.close();
const rows = out.proxies.map((p) => `  { bone: '${p.bone}', part: '${p.part}', y: [${p.y.join(', ')}], s0: [${p.s0.join(', ')}], s1: [${p.s1.join(', ')}] },`);
const pts = Object.entries(out.points).map(([limb, list]) => `  ${limb}: [\n${list.map((r) => `    ['${r[0]}', ${r[1]}, ${r[2]}, ${r[3]}],`).join('\n')}\n  ],`);
fs.writeFileSync(path.join(HERE, '..', 'src', 'courier', 'anim', 'bodyproxydata.js'), `// Generated by scripts/learn_bodyproxies.mjs from the Courier's skinned meshes in their bind pose (the pose audit's own fit,
// scripts/poseaudit.page.js): do not edit by hand. Read by courier/anim/bodyproxies.js.
// BODY_PROXIES: a capsule a body bone, in that bone's bind frame (it runs along the bone's +Y): y [y0, y1 (the axis's ends), ya, yb (where
// the taper's two sections sit)], s0 and s1 the sections [cx, cz (the ellipse's centre), ax, az (its half-widths on X and Z)], metres.
// LIMB_POINTS: each hand's and forearm's points (of ${Object.entries(out.counts).map(([k, n]) => `${k} ${n}`).join(', ')} vertices), [bone, x, y, z] in that bone's bind frame.
export const BODY_PROXIES = [
${rows.join('\n')}
];
export const LIMB_POINTS = {
${pts.join('\n')}
};
`);
console.log(`bodyproxydata.js: ${out.proxies.length} proxies; points ${Object.entries(out.points).map(([k, l]) => `${k} ${l.length}`).join(', ')} (of ${JSON.stringify(out.counts)})`);
