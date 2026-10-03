// ---------------------------------------------------------------------------------------
// DIAGNOSTICS (F3): what a frame costs, and why a bad one was bad. F3 cycles: off · the PERF panel · the panel with the physics
// lines (only what is near them) and what the creatures near them are thinking. F4 copies a plain-text report (the last ten seconds:
// the frame times, the worst frames and what changed in them, the counts) to the clipboard, ready to paste into a bug report.
//
// The panel: frames per second and the frame's milliseconds (median and the worst of the last second), the CPU's share split into
// named phases (the simulation, the draw's submission, whatever else calls begin/end), the GPU's own time when the browser can measure it
// (EXT_disjoint_timer_query_webgl2), a graph of the last 240 frames (a bar per frame: green under 16.7 ms, amber under 33, red over),
// draw calls and triangles for the whole frame (all passes: the scene, the shadow, the glow), the programs, geometries and textures the
// GPU holds, the heap, the zone and the lamps lit, and the counts of what is alive (bodies, shards, particles, creatures). A SPIKE is a
// frame over twice the median: it is kept with what changed in it (programs compiled, geometries or textures made, the heap dropping: a
// collection), since those are the usual causes of a hitch, and the last few are listed.
//
// The physics lines are Rapier's debug render, filtered to colliders within 30 m of them and never the terrain (a height field is
// hundreds of thousands of lines), refreshed ten times a second into one buffer that grows and is reused: the old way, every collider in
// the world every frame into a new buffer, ran at five frames a second.
//
// Prior art: every engine's stat overlay (Unreal's `stat unit` and `stat gpu`: game / draw / GPU split; Source's net_graph; the frame
// graph of the console devkits' Performance Analyzer and PIX, with spikes marked), and the "copy diagnostics" button of a bug reporter.
//
//   const diag = new Diag(game, renderer)      diag.frameStart()  diag.begin('sim') ... diag.end('sim')  diag.frameEnd()
//   diag.mode (0 off, 1 panel, 2 panel + lines + minds)   diag.cycle()   diag.report() -> text
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { econLine } from '../econ/economy.js';

const N = 240;
const CSS = `
#diag { position: fixed; left: 8px; top: 64px; z-index: 30; pointer-events: none; font: 11px/1.35 ui-monospace, Menlo, Consolas, monospace;
  color: #e8f4e8; background: rgba(8,10,12,.78); padding: 6px 8px 8px; border: 1px solid rgba(255,255,255,.12); display: none; white-space: pre; }
#diag canvas { display: block; margin-top: 4px; image-rendering: pixelated; }
#diag .k { color: #9fb3a8; } #diag .warn { color: #ffcf6a; } #diag .bad { color: #ff7a6a; }
#diagMinds { position: fixed; left: 8px; z-index: 30; margin: 0; padding: 6px 8px; background: rgba(20,8,6,.72); color: #ffe0c0;
  font: 11px/1.35 ui-monospace, monospace; pointer-events: none; display: none; white-space: pre; }
`;

export class Diag {
  constructor(game, renderer) {
    this.game = game; this.r = renderer;
    this.mode = 0;
    this.ms = new Float32Array(N); this.cpu = new Float32Array(N); this.gpu = new Float32Array(N); this.i = 0;
    this.phase = new Map(); this.open = new Map(); this.phases = {};
    this.spikes = [];
    this.prev = null;
    this.t0 = 0; this.lastEnd = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'diag';
    this.txt = document.createElement('div'); this.el.appendChild(this.txt);
    this.cv = document.createElement('canvas'); this.cv.width = N; this.cv.height = 48; this.el.appendChild(this.cv);
    this.cx = this.cv.getContext('2d');
    this.spk = document.createElement('div'); this.el.appendChild(this.spk);
    document.body.appendChild(this.el);
    this.minds = document.createElement('pre'); this.minds.id = 'diagMinds'; document.body.appendChild(this.minds);
    // the GPU's own clock, if the browser lends it
    const gl = renderer.getContext();
    this.gl = gl; this.tq = gl.getExtension?.('EXT_disjoint_timer_query_webgl2') || null;
    this.queries = []; this.gpuMs = 0;
    // the physics lines: one buffer, grown when it must be, reused every refresh
    this.lineGeo = new THREE.BufferGeometry();
    this.lines = new THREE.LineSegments(this.lineGeo, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: true, transparent: true, opacity: 0.85 }));
    this.lines.frustumCulled = false; this.lines.visible = false; this.lines.renderOrder = 20;
    game.scene.add(this.lines);
    this.cap = 0; this.lineT = 0;
    addEventListener('keydown', (e) => { if (e.code === 'F4' && this.mode) { e.preventDefault(); this.copy(); } });
  }

  cycle() {
    this.mode = (this.mode + 1) % 3;
    this.r.info.autoReset = !this.mode; // (while it is shown, a frame's several renders (the scene, the shadow, the glow's passes) are counted together)
    this.el.style.display = this.mode ? 'block' : 'none'; this.minds.style.display = this.mode === 2 ? 'block' : 'none'; this.lines.visible = this.mode === 2; }

  // ---------------------------------------------------------------- timing
  frameStart() {
    this.t0 = performance.now();
    if (!this.r.info.autoReset) this.r.info.reset();
    this.phase.clear();
    if (this.tq && this.mode && !this.pending) { const q = this.gl.createQuery(); this.gl.beginQuery(this.tq.TIME_ELAPSED_EXT, q); this.pending = q; }
  }
  begin(name) { this.open.set(name, performance.now()); }
  end(name) { const s = this.open.get(name); if (s != null) this.phase.set(name, (this.phase.get(name) || 0) + performance.now() - s); }

  frameEnd() {
    const now = performance.now(), gl = this.gl;
    if (this.pending) { gl.endQuery(this.tq.TIME_ELAPSED_EXT); this.queries.push(this.pending); this.pending = null; }
    // (the GPU's answers come a frame or two late: read what is ready)
    while (this.queries.length) {
      const q = this.queries[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      const bad = gl.getParameter(this.tq.GPU_DISJOINT_EXT);
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT);
      if (!bad) this.gpuMs = ns / 1e6;
      gl.deleteQuery(q); this.queries.shift();
    }
    const frame = this.lastEnd ? now - this.lastEnd : 16.7; this.lastEnd = now;
    const cpu = now - this.t0;
    const i = this.i = (this.i + 1) % N;
    this.ms[i] = frame; this.cpu[i] = cpu; this.gpu[i] = this.gpuMs;
    const info = this.r.info;
    const cur = { calls: info.render.calls, tris: info.render.triangles, programs: info.programs?.length || 0, geos: info.memory.geometries, tex: info.memory.textures, heap: performance.memory?.usedJSHeapSize || 0 };
    // a spike: what changed in it
    if (this.prev && frame > Math.max(25, 2 * this.median())) {
      const why = [];
      if (cur.programs > this.prev.programs) why.push(`+${cur.programs - this.prev.programs} programs compiled`);
      if (cur.geos > this.prev.geos + 2) why.push(`+${cur.geos - this.prev.geos} geometries`);
      if (cur.tex > this.prev.tex) why.push(`+${cur.tex - this.prev.tex} textures`);
      if (cur.heap && this.prev.heap - cur.heap > 2e6) why.push(`heap -${((this.prev.heap - cur.heap) / 1e6).toFixed(1)} MB (a collection)`);
      if (cur.calls > this.prev.calls * 1.5 + 50) why.push(`draws ${this.prev.calls} -> ${cur.calls}`);
      const ph = [...this.phase].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ');
      this.spikes.push({ at: now, ms: frame, cpu, why: why.join('; ') || 'nothing counted changed', ph });
      if (this.spikes.length > 40) this.spikes.shift();
    }
    this.prev = cur; this.cur = cur;
    for (const [k, v] of this.phase) this.phases[k] = (this.phases[k] ?? v) * 0.9 + v * 0.1;
    if (this.mode) this.draw();
  }

  median(n = 60) {
    const a = [];
    for (let k = 0; k < n; k++) { const v = this.ms[(this.i - k + N) % N]; if (v > 0) a.push(v); }
    a.sort((x, y) => x - y);
    return a[a.length >> 1] || 16.7;
  }

  // ---------------------------------------------------------------- the panel
  draw() {
    const g = this.game, c = this.cur, f = this.cx;
    let worst = 0; for (let k = 0; k < 60; k++) worst = Math.max(worst, this.ms[(this.i - k + N) % N]);
    const med = this.median();
    const fps = 1000 / med;
    const cls = (ms) => (ms > 33 ? 'bad' : ms > 17 ? 'warn' : '');
    if ((this.tick = (this.tick || 0) + 1) % 6 === 0) {
      const ph = Object.entries(this.phases).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v.toFixed(1)}`).join('  ');
      const L = g.lights?.stats?.() || {};
      const n = this.counts();
      const heap = c.heap ? `  heap ${(c.heap / 1e6).toFixed(0)} MB` : '';
      this.txt.innerHTML = `<b>${fps.toFixed(0)} fps</b>  frame <span class="${cls(med)}">${med.toFixed(1)}</span> ms  worst/s <span class="${cls(worst)}">${worst.toFixed(1)}</span>`
        + `\n<span class="k">cpu</span> ${this.cpu[this.i].toFixed(1)} ms  <span class="k">gpu</span> ${this.tq ? this.gpuMs.toFixed(1) + ' ms' : 'n/a'}`
        + `\n<span class="k">phases</span> ${ph}`
        + `\n<span class="k">draws</span> ${c.calls}  <span class="k">tris</span> ${(c.tris / 1000).toFixed(0)}k  <span class="k">programs</span> ${c.programs}  <span class="k">geo</span> ${c.geos}  <span class="k">tex</span> ${c.tex}${heap}`
        + `\n<span class="k">zone</span> ${g.zones?.current ?? '-'} (${[...(g.zones?.visible || [])].join(',')})  <span class="k">lamps</span> ${L.lit ?? '-'}/${L.lamps ?? '-'}`
        + `\n<span class="k">alive</span> bodies ${n.bodies}  shards ${n.shards}+${n.chips}  particles ${n.particles}  creatures ${n.creatures}  pots ${n.pots}`
        + (g.ledger ? `\n<span class="k">econ</span> ${econLine(g.ledger).text}` : '')
        + `\n<span class="k">F3 cycles · F4 copies a report</span>`;
      this.spk.innerHTML = this.spikes.slice(-4).reverse().map((s) => `<span class="bad">spike ${s.ms.toFixed(0)} ms</span> ${((performance.now() - s.at) / 1000).toFixed(0)}s ago: ${s.why} <span class="k">(${s.ph})</span>`).join('\n');
    }
    f.clearRect(0, 0, N, 48);
    f.fillStyle = 'rgba(255,255,255,.15)'; f.fillRect(0, 48 - 16.7, N, 1); f.fillRect(0, 48 - 33.3, N, 1);
    for (let k = 0; k < N; k++) {
      const v = this.ms[(this.i + 1 + k) % N];
      f.fillStyle = v > 33 ? '#ff6a5a' : v > 17 ? '#ffc65a' : '#6ad08a';
      const h = Math.min(48, v); f.fillRect(k, 48 - h, 1, h);
    }
  }

  counts() {
    const g = this.game;
    let particles = 0;
    for (const p of [g.fx?.add, g.fx?.alpha, g.fx?.foam]) particles += p?.live ?? p?.p?.length ?? 0;
    return {
      bodies: g.physics?.world?.bodies?.len?.() ?? '-',
      shards: (g.breakables || window.__game?.breakables)?.shards?.length ?? 0,
      chips: (g.breakables || window.__game?.breakables)?.flyers?.length ?? 0,
      particles,
      creatures: g.creatures?.list?.length ?? 0,
      pots: (g.breakables || window.__game?.breakables)?.items?.size ?? 0,
    };
  }

  /** The physics lines (mode 2), near them only, a few times a second; and the minds near them. */
  update(dt) {
    if (this.mode !== 2) return;
    const g = this.game;
    this.lineT -= dt;
    if (this.lineT > 0) return;
    this.lineT = 0.1;
    this.minds.style.top = `${this.el.offsetTop + this.el.offsetHeight + 6}px`;
    this.minds.textContent = g.ai?.describe?.().join('\n') || '';
    const p = g.player.pos, R2 = 30 * 30;
    const near = (c) => { const s = c.shape?.type; if (s === 7 || s === 6) return false; const t = c.translation(); const dx = t.x - p.x, dy = t.y - p.y, dz = t.z - p.z; return dx * dx + dy * dy + dz * dz < R2; };
    const { vertices, colors } = g.physics.world.debugRender(undefined, near);
    const n = vertices.length / 3;
    if (n > this.cap) {
      this.cap = Math.ceil(n * 1.5);
      this.pos = new THREE.BufferAttribute(new Float32Array(this.cap * 3), 3).setUsage(THREE.DynamicDrawUsage);
      this.col = new THREE.BufferAttribute(new Float32Array(this.cap * 4), 4).setUsage(THREE.DynamicDrawUsage);
      this.lineGeo.setAttribute('position', this.pos); this.lineGeo.setAttribute('color', this.col);
    }
    if (!this.pos) return;
    this.pos.array.set(vertices); this.col.array.set(colors);
    this.pos.clearUpdateRanges(); this.pos.addUpdateRange(0, n * 3); this.pos.needsUpdate = true;
    this.col.clearUpdateRanges(); this.col.addUpdateRange(0, n * 4); this.col.needsUpdate = true;
    this.lineGeo.setDrawRange(0, n);
  }

  // ---------------------------------------------------------------- the report
  report() {
    const g = this.game, c = this.cur || {}, a = [];
    for (let k = 0; k < N; k++) { const v = this.ms[(this.i + 1 + k) % N]; if (v > 0) a.push(v); }
    if (!a.length) a.push(0);
    const s = [...a].sort((x, y) => x - y), pct = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(1);
    const n = this.counts();
    const L = g.lights?.stats?.() || {};
    const lines = [
      `Fool's Fortune diagnostics (${new Date().toISOString()})`,
      `browser: ${navigator.userAgent}`,
      `gpu: ${this.gpuName()}  screen ${innerWidth}x${innerHeight} @${devicePixelRatio}  drawn at ${this.r.getDrawingBufferSize(new THREE.Vector2()).toArray().join('x')}`,
      `frame ms over the last ${N} frames: median ${pct(0.5)}  p90 ${pct(0.9)}  p99 ${pct(0.99)}  worst ${s[s.length - 1].toFixed(1)}`,
      `cpu ${this.cpu[this.i].toFixed(1)} ms  gpu ${this.tq ? this.gpuMs.toFixed(1) + ' ms' : 'n/a'}`,
      `phases (ms, smoothed): ${Object.entries(this.phases).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', ')}`,
      `draws ${c.calls}  tris ${c.tris}  programs ${c.programs}  geometries ${c.geos}  textures ${c.tex}  heap ${c.heap ? (c.heap / 1e6).toFixed(0) + ' MB' : 'n/a'}`,
      `zone ${g.zones?.current} visible ${[...(g.zones?.visible || [])].join(',')}  lamps ${L.lit}/${L.lamps}`,
      `alive: ${Object.entries(n).map(([k, v]) => `${k} ${v}`).join(', ')}`,
      `economy: ${g.ledger ? econLine(g.ledger).text : 'n/a'}`,
      `where: ${g.player.pos.toArray().map((v) => v.toFixed(1)).join(', ')}  settings: ${JSON.stringify(g.T?.visual || {})}`,
      `spikes (newest last):`,
      ...this.spikes.slice(-12).map((sp) => `  ${sp.ms.toFixed(0)} ms (cpu ${sp.cpu.toFixed(0)}), ${((performance.now() - sp.at) / 1000).toFixed(1)} s ago: ${sp.why} [${sp.ph}]`),
      `frames: ${a.map((v) => v.toFixed(0)).join(' ')}`,
    ];
    return lines.join('\n');
  }
  /** One frame's draws, counted by what they belong to (the nearest named ancestor, or the material's type), largest first: what to
   *  merge, batch or cull next. (`__game.game.diag.census()` in the console; F5 with the panel up writes it under the panel.) */
  census(frames = 1) {
    const r = this.r, orig = r.renderBufferDirect, tally = new Map();
    const owner = (o) => { let p = o, path = []; while (p && path.length < 3) { if (p.name) path.push(p.name); p = p.parent; } return path.length ? path.reverse().join('/') : `(${o.type}:${o.material?.type || '?'})`; };
    r.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
      const k = (r.shadowMap.enabled && camera.isOrthographicCamera ? 'shadow ' : '') + owner(object);
      tally.set(k, (tally.get(k) || 0) + 1);
      return orig.apply(this, arguments);
    };
    try { for (let i = 0; i < frames; i++) this.game.post?.render(this.game.scene, this.game.camera); } finally { r.renderBufferDirect = orig; }
    return [...tally].sort((a, b) => b[1] - a[1]);
  }

  gpuName() { const e = this.gl.getExtension('WEBGL_debug_renderer_info'); return e ? this.gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }
  copy() {
    const t = this.report();
    window.__diagReport = t;
    navigator.clipboard?.writeText(t).then(() => this.flash('report copied to the clipboard'), () => this.flash('could not reach the clipboard: window.__diagReport holds it'));
  }
  flash(msg) { this.spk.innerHTML = `<span class="warn">${msg}</span>\n` + this.spk.innerHTML; }
}
