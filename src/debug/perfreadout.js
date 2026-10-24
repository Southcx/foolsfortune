// ---------------------------------------------------------------------------------------
// THE PERF READOUT: a corner panel the owner can screenshot on a phone (docs/plans/MOBILE.md 10.3 and 11.1: the phone is an iPhone and the
// game runs inside a claude.ai frame, so what it costs and what the host allows are measured there first, none assumed). In three blocks
// and a fourth for the page itself:
//   FRAME    fps, the frame's median and worst milliseconds of the last second, the simulation's and the draw's CPU share, draw calls and
//            triangles of the whole frame (the shadow pass and the glow's passes counted), programs, geometries, textures, the heap where
//            the browser gives one, the zone. These are the F3 panel's own numbers (debug/diag.js), read, never measured twice.
//   DISPLAY  the graphics tier and its lines (dynamic resolution's current step), MSAA, lamps, glow, the sun's shadow; the size drawn, the
//            device pixel ratio, the viewport and the screen in CSS pixels.
//   MACHINE  detectMachine()'s reading (renderer string, cores, memory, float targets, samples) and the WebGL extensions the frame leans on.
//   HOST     what the browser and its frame allow, each present or MISSING (debug/hostprobe.js): fullscreen, orientation lock, wake lock,
//            vibration, pointer lock, storage persistence and quota, standalone, touch points, a short user agent; whether the page is framed
//            and whether `?perf` and `?at` reached it.
// Switched on three ways: `?perf` in the page's URL (this page load only), `/perf` on the chat line (any mode: the published page sits in a
// frame whose query may never reach it; it flips the knob and keeps it), and the knob `T.visual.perfReadout` (a setting, kept with the
// tuning). It sits top-left under the F3 panel when that is up, clear of the Sight (top-right) and the Lachrimeter (bottom-right), and
// takes no clicks. While it is up, the renderer's counts are kept across the frame's several renders (Diag.counting), as with F3.
//
// Prior art: Unreal's `stat unit` and `stat fps`, Source's `net_graph`, three.js's stats panel, Firefox's WebGL "about:support" capability
// table, and iOS developers' on-screen performance HUDs (MetricKit's numbers drawn on the device for a screenshot).
//
//   const perf = new PerfReadout(game, { diag, renderer })       game.perfReadout = perf
//   perf.on   perf.set(bool)   (the chat line's /perf)   perf.refresh(force?)   (a timer of its own calls it four times a second)
//   Event: perf.readout { on, by: 'courier' }   (feedback/tracking/perfreadout.js says it)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, saveTuning } from '../core/config.js';
import { RESOLUTIONS } from '../render/present.js';
import { probeHost, probeStorage, fmtBytes } from './hostprobe.js';

const CSS = `
#perfreadout { position: fixed; left: 8px; top: 8px; z-index: 30; box-sizing: border-box; width: min(660px, calc(100vw - 210px)); display: none; pointer-events: none; user-select: none;
  font: 10px/1.25 ui-monospace, Menlo, Consolas, monospace; color: #e8f4e8; background: rgba(8,10,12,.8); border: 1px solid rgba(255,255,255,.14);
  padding: 5px 8px 3px; column-width: 188px; column-gap: 12px; overflow-wrap: anywhere; white-space: pre-wrap; }
#perfreadout .whole { break-inside: avoid; margin-bottom: 4px; }
#perfreadout .h { color: #ffb27a; letter-spacing: .12em; }
#perfreadout .k { color: #9fb3a8; } #perfreadout .warn { color: #ffcf6a; } #perfreadout .bad { color: #ff7a6a; }
#perfreadout .miss { color: #ffcf6a; font-weight: bold; }
`;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const MISSING = '<span class="miss">MISSING</span>';
/** Present or MISSING, for a capability. */
const has = (ok, word = 'present') => (ok ? word : MISSING);
/** yes or no, for a state the browser can tell; n/a where it cannot. */
const yn = (v) => (v === undefined ? 'n/a' : v ? 'yes' : 'no');
const ms1 = (v) => (v == null ? '-' : v.toFixed(1));
const asked = (q) => q.has('perf') && !['0', 'off', 'false'].includes(q.get('perf'));

export class PerfReadout {
  constructor(game, { diag, renderer, query = new URLSearchParams(location.search) }) {
    this.game = game; this.diag = diag; this.r = renderer;
    this.asked = asked(query); // (?perf: this page load, not kept)
    this.ext = new Set(renderer.getContext().getSupportedExtensions?.() || []);
    this.host = probeHost(renderer.domElement); // (the host does not change under the page; the storage's numbers do)
    this.storage = null; this.storageT = -1e9; this.last = 0; this.shown = false;
    this.size = new THREE.Vector2();
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'perfreadout'; document.body.appendChild(this.el);
    game.chat?.add('perf', { help: 'the performance readout, a corner panel of the frame, the display, the machine and what the host allows: /perf on | off (no word: the other)', run: ([v]) => this.set(v ? v === 'on' : !this.on, 'courier') });
    setInterval(() => this.refresh(), 250);
    this.refresh(true);
  }

  /** Whether it is up: asked in the URL, or the knob. */
  get on() { return !!(this.asked || T.visual.perfReadout); }

  /** The chat line's switch: the knob flips and is kept, and `?perf` stands down so that off is off. */
  set(on, by = 'courier') {
    T.visual.perfReadout = !!on; if (!on) this.asked = false;
    saveTuning();
    this.game.events?.emit('perf.readout', { on: this.on, by });
    this.refresh(true);
  }

  show(on) {
    this.shown = on; this.el.style.display = on ? 'block' : 'none';
    this.diag?.counting(on); // (the whole frame's draw calls and triangles, as F3 keeps them)
  }

  refresh(force = false) {
    const on = this.on;
    if (on !== this.shown) this.show(on);
    if (!on) return;
    const now = performance.now();
    if (!force && now - this.last < 240) return;
    this.last = now;
    if (now - this.storageT > 10000) { this.storageT = now; probeStorage().then((s) => { this.storage = s; }); }
    this.el.innerHTML = this.html();
    const d = this.diag; this.el.style.top = d?.mode ? `${d.el.offsetTop + d.el.offsetHeight + 6}px` : '8px'; // (under the F3 panel when it is up)
  }

  html() {
    const g = this.game, d = this.diag, c = d.cur || {}, V = T.visual, G = g.graphics, P = g.present, M = G?.machine || {}, H = this.host, S = this.storage;
    const med = d.median(), worst = d.worst(), ph = d.phases, cls = (v) => (v > 33 ? 'bad' : v > 17 ? 'warn' : '');
    const k = (t) => `<span class="k">${t}</span>`, sec = (cls2, ...lines) => `<div class="sec ${cls2}">${lines.filter(Boolean).join('\n')}</div>`;
    this.r.getDrawingBufferSize(this.size);
    const set = RESOLUTIONS[V.resolution] ?? 480, ex = (n) => this.ext.has(n);
    const vv = globalThis.visualViewport, vvDiffers = vv && (Math.round(vv.width) !== innerWidth || Math.round(vv.height) !== innerHeight);
    const frame = sec('whole',
      `<b class="h">FRAME</b> ${k('zone')} ${esc(g.zones?.current ?? '-')}`,
      `<b>${(1000 / med).toFixed(0)} fps</b>  <span class="${cls(med)}">${med.toFixed(1)}</span> ms  ${k('worst')} <span class="${cls(worst)}">${worst.toFixed(1)}</span>`,
      `${k('tick')} ${ms1(ph.sim)}  ${k('draw')} ${ms1(ph.draw)} ms cpu`,
      `${k('draws')} ${c.calls ?? '-'}  ${k('tris')} ${c.tris != null ? `${(c.tris / 1000).toFixed(0)}k` : '-'}`,
      `${k('programs')} ${c.programs ?? '-'}  ${k('geo')} ${c.geos ?? '-'}  ${k('tex')} ${c.tex ?? '-'}`,
      `${k('heap')} ${c.heap ? `${(c.heap / 1e6).toFixed(0)} MB` : 'n/a (not given)'}`,
    );
    const display = sec('whole',
      `<b class="h">DISPLAY</b> ${esc(G?.tier ?? '-')}${V.graphics !== G?.tier ? ` (${esc(V.graphics)})` : ''}`,
      `${k('lines')} ${set || 'native'}  ${k('dynamic')} ${P?.dynLines ?? '-'}`,
      `${k('msaa')} ${V.msaa}  ${k('lamps')} ${V.lightSlots}  ${k('glow')} ${V.glow}`,
      `${k('shadow')} ${V.shadows ? `${V.shadowRes} ${V.shadowFilter} /${V.shadowEvery}` : 'off'}`,
      `${k('drawn')} ${this.size.x}x${this.size.y} @${this.r.getPixelRatio().toFixed(2)}  ${k('dpr')} ${devicePixelRatio}`,
      `${k('view')} ${innerWidth}x${innerHeight}${vvDiffers ? ` (visual ${Math.round(vv.width)}x${Math.round(vv.height)})` : ''}  ${k('screen')} ${screen.width}x${screen.height}`,
    );
    const machine = sec('whole',
      `<b class="h">MACHINE</b> ${k('cores')} ${M.cores || 'n/a'}  ${k('memory')} ${M.memory ? `${M.memory} GB` : 'n/a'}`,
      esc(M.renderer || '(no renderer string)'),
      `${k('float targets')} ${yn(M.floatTargets)}  ${k('samples')} ${M.maxSamples ?? 'n/a'}`,
      `${k('half float')} ${has(ex('EXT_color_buffer_half_float'), 'yes')}  ${k('linear')} ${has(ex('OES_texture_float_linear'), 'yes')}`,
      `${k('parallel compile')} ${has(ex('KHR_parallel_shader_compile'), 'yes')}`,
      `${k('gpu timer')} ${has(ex('EXT_disjoint_timer_query_webgl2'), 'yes')}`,
    );
    const persisted = !S ? 'asking' : S.persistedApi ? yn(S.persisted) : MISSING;
    const estimate = !S ? 'asking' : S.estimate ? `${fmtBytes(S.usage)} of ${fmtBytes(S.quota)}` : MISSING;
    const host = sec('split', // (the host's rows run on from one column into the next: each says what it is)
      `<b class="h">HOST</b> ${k('MISSING = not offered')}`,
      `${k('fullscreen')} ${H.fullscreen === undefined ? MISSING : H.fullscreen ? 'enabled' : 'disabled'}`,
      `${k('canvas fullscreen')} ${has(H.canvasFullscreen)}`,
      `${k('orientation lock')} ${has(H.orientationLock)}`,
      `${k('orientation now')} ${esc(H.orientation ?? 'n/a')}`,
      `${k('standalone')} ${yn(H.standalone)}  ${k('ios flag')} ${yn(H.iosStandalone)}`,
      `${k('touch points')} ${H.touchPoints}  ${k('coarse')} ${yn(H.coarse)}`,
      `${k('hover none')} ${yn(H.hoverNone)}`,
      `${k('vibrate')} ${has(H.vibrate)}`,
      `${k('pointer lock')} ${has(H.pointerLock)}`,
      `${k('wake lock')} ${has(H.wakeLock)}`,
      `${k('persisted()')} ${persisted}`,
      `${k('estimate()')} ${estimate}`,
      `${k('save store')} ${has(!!g.save?.store, 'ok')}`,
      `${k('framed')} ${yn(H.framed)}  ${k('secure')} ${yn(H.secure)}`,
      `${k('query')} ${H.query ? esc(H.query) : '(none reached the page)'}`,
      `${k('ua')} ${esc(H.ua)}`,
    );
    return frame + display + machine + host;
  }
}
