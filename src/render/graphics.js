// ---------------------------------------------------------------------------------------
// GRAPHICS: the quality tiers, chosen for the machine (the owner, 2026-10-19: "junk laptop-certified efficiency"). One setting,
// `T.visual.graphics`: 'auto' (the default: the machine is read at boot), 'high' (the look as built), 'low', 'minimum', or 'custom' (a
// knob it owns was changed by hand, so it leaves them all alone). A tier is a row of the knobs that already exist plus four new ones,
// each measured in the render inventory (2026-10-19, SwiftShader and micro-benches; ratios, not milliseconds):
//   lines          the scene's line count (render/present.js): 480 to 360 is a third of the frame
//   floor          the fewest lines dynamic resolution may drop to
//   msaa           the scene buffer's samples (render/glow.js): 4 to 0 is up to two fifths of the frame on a slow fill rate
//   antialias      the canvas's own (only when the glow is off and the scene draws straight to it)
//   lightSlots     point lights lit at once (render/lightbudget.js): every slot runs on every lit pixel, lit or not
//   shadows, shadowRes, shadowFilter ('pcf' | 'basic'), shadowEvery (the sun's map redrawn every n frames)
//   glow           the glow's bloom chain (render/glow.js): off skips its seven passes; the grade stays (off too, the frame would draw
//                  straight to the canvas and every program compile a second time for it: +70 measured)
//   outlineReach   props' outline hulls drawn only within this many metres (0: all); characters' always
// The ones that change which shaders exist (light slots, shadows on or off and their filter, glow, the canvas's antialias, MSAA) are
// read once, before the warm-up: a change in play says so and waits for the next start. Resolution, shadow size and rate and the
// outline reach change at once.
//
// DYNAMIC RESOLUTION, under any tier: when the frame keeps missing the display's refresh, the lines step down toward the floor; when it
// keeps making it with room to spare, back up toward the tier's own. Never below the floor, never above the tier, nothing compiled.
//
// A PHONE OR TABLET (MOBILE.md 10, step 7): an iPhone reports its GPU as "Apple GPU", six cores and no `deviceMemory`, which matched
// nothing above and booted it on High (480 lines, MSAA 4 twice, 8 lamps, a PCF shadow every frame). The machine now also says whether it
// is touch (`navigator.maxTouchPoints` above 0 AND `(pointer: coarse)`: a touchscreen laptop whose first pointer is the mouse is not) and
// whether it is mobile (touch, plus a phone's or tablet's GPU string (Apple GPU, Mali, Adreno, PowerVR), platform (Android, iPhone, iPad,
// an iPad passing as a Mac) or a screen whose short side is under 900 CSS px). A mobile machine boots on Low, never High; the Minimum
// rules (software GL, no half-float targets, two cores, 2 GB) still come first, and the player's own tier or `?graphics=` still stands.
// There is no phone tier here: Low is the stand-in until the owner's measurements on the phone say what one holds (MOBILE.md 10, 4).
// Every machine that is not touch reads exactly as before: `mobile` is false for it, and the rows of `tierFor` for it are untouched.
//
// Prior art: Unreal's scalability groups and its auto-detection; the PC preset row (Low / Medium / High / Custom, a knob moved by hand
// turns the preset Custom); dynamic resolution scaling on consoles (Wipeout HD's dynamic framebuffer, Halo 5, every Switch port);
// leafcanopy.js's own renderer-string test for software GL; pmndrs' detect-gpu (the GPU's string and a mobile flag choosing a tier);
// CSS Media Queries Level 4's `(pointer: coarse)`; web.dev's adaptive loading (`deviceMemory` and `hardwareConcurrency` read together,
// no one of them alone).
//
//   detectMachine() -> { renderer, cores, memory, software, integrated, floatTargets, maxSamples, touch, mobile }
//   tierFor(machine) -> 'high' | 'low' | 'minimum'      GRAPHICS_TIERS      TIER_KEYS (the T.visual knobs a tier owns)
//   const tier = applyBootTier(machine)   (before the renderer is made)
//   game.graphics = new Graphics(game, { renderer, camera, tier, machine })   .update(rawDt)   .observe(rawDt) (the title's frames: the
//   display's refresh)   .beforeDraw()   .setTier(name)
//   Events: graphics.tier { tier, chosen, renderer, touch, mobile, by }, graphics.lines { lines, by: 'environment' }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, DEFAULTS } from '../core/config.js';
import { OUTLINES } from './outline.js';

export const GRAPHICS_TIERS = {
  high:    { lines: 480, floor: 400, msaa: 4, antialias: true,  lightSlots: 8, shadows: true,  shadowRes: 1024, shadowFilter: 'pcf',   shadowEvery: 1, glow: true,  outlineReach: 0 },
  low:     { lines: 400, floor: 320, msaa: 2, antialias: false, lightSlots: 4, shadows: true,  shadowRes: 512,  shadowFilter: 'basic', shadowEvery: 2, glow: true,  outlineReach: 30 },
  minimum: { lines: 360, floor: 270, msaa: 0, antialias: false, lightSlots: 2, shadows: false, shadowRes: 512,  shadowFilter: 'basic', shadowEvery: 2, glow: false, outlineReach: 15 },
};
/** The T.visual knobs a tier sets: one moved by hand turns the setting 'custom'. */
export const TIER_KEYS = ['resolution', 'shadows', 'shadowRes', 'shadowFilter', 'shadowEvery', 'lightSlots', 'glow', 'grade', 'msaa', 'outlineReach'];
/** The line counts dynamic resolution steps through (render/present.js RESOLUTIONS has each). */
export const LINE_STEPS = [480, 440, 400, 360, 320, 270];
const DYN = { window: 2, down: 3, up: 10, upAfterDown: 30, miss: 1.25, make: 1.06, slowest: 18 }; // (real s of samples; real s over before a step down, under before a step up; no step up for this long after one down; the median interval against the display's refresh that counts as missing it, as making it; ms a frame must pass to count as slow at all)

/** A phone's or tablet's GPU, by the string it gives. Safari says "Apple GPU" for every iPhone, iPad and Apple-silicon Mac alike, so it
 *  counts only with touch (a Mac has none). */
const MOBILE_GPU = /apple gpu|mali|adreno|powervr/i;
/** A phone's or tablet's platform, by the user agent (an iPad in desktop mode says Mac: see `touchFacts`). */
const MOBILE_PLATFORM = /android|iphone|ipad|ipod|\bmobile\b/i;
/** A screen whose short side (CSS px) is under this is a phone's or a small tablet's. */
export const MOBILE_SHORT_SIDE = 900;

/** Touch and the platform, from what the browser says: `touch` is touch points AND a coarse first pointer; `platformMobile` is the
 *  user agent hints, the user agent, or an iPad in desktop mode (platform MacIntel with more than one touch point). */
function touchFacts() {
  const n = navigator, points = n.maxTouchPoints || 0;
  let coarse = false; try { coarse = !!matchMedia('(pointer: coarse)').matches; } catch { /* no media queries */ }
  const platformMobile = n.userAgentData?.mobile === true || MOBILE_PLATFORM.test(n.userAgent || '') || (n.platform === 'MacIntel' && points > 1);
  const short = Math.min(screen.width || Infinity, screen.height || Infinity);
  return { touch: points > 0 && coarse, platformMobile, short };
}

/** What the machine says about itself, read from a throwaway context before the game's own is made. */
export function detectMachine() {
  const m = { renderer: '', cores: navigator.hardwareConcurrency || 0, memory: navigator.deviceMemory || 0, software: false, integrated: false, floatTargets: true, maxSamples: 4, touch: false, mobile: false };
  let noContext = false;
  try {
    const c = document.createElement('canvas'), gl = c.getContext('webgl2');
    if (!gl) noContext = true;
    else {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      m.renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      m.floatTargets = !!gl.getExtension('EXT_color_buffer_float');
      m.maxSamples = gl.getParameter(gl.MAX_SAMPLES) || 0;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch { /* no context: the defaults stand */ }
  if (noContext) { m.software = true; m.floatTargets = false; }
  m.software = m.software || /swiftshader|llvmpipe|softpipe|software|basic render/i.test(m.renderer);
  m.integrated = /intel|mali|adreno|powervr|videocore|radeon(\(tm\))? (vega \d\b|graphics)|uhd|iris/i.test(m.renderer) && !/arc a\d/i.test(m.renderer);
  try {
    const t = touchFacts();
    m.touch = t.touch;
    m.mobile = t.touch && (MOBILE_GPU.test(m.renderer) || t.platformMobile || t.short < MOBILE_SHORT_SIDE);
  } catch { /* no navigator or screen: not touch */ }
  return m;
}

/** The tier a machine gets under 'auto'. Firefox buckets the GPU's name (a 3060 Ti reads as a GTX 980), so the name only ever lowers it,
 *  and dynamic resolution corrects the rest in play. */
export function tierFor(m) {
  if (m.software || !m.floatTargets || (m.cores && m.cores <= 2) || (m.memory && m.memory <= 2)) return 'minimum';
  if (m.mobile || m.integrated || (m.cores && m.cores <= 4) || (m.memory && m.memory <= 4)) return 'low'; // (m.mobile: a phone or tablet, never High; false on every machine that is not touch)
  return 'high';
}

/** The tier's knobs written into T.visual, before anything is built. A tuning saved before the setting existed, with a knob it owns
 *  moved by hand, is 'custom': the hand's choice stands. Returns the tier in force (or 'custom'). */
export function applyBootTier(machine, override = new URLSearchParams(location.search).get('graphics')) {
  const V = T.visual;
  if (override && (GRAPHICS_TIERS[override] || override === 'auto')) V.graphics = override; // (?graphics=high: a test measures a fixed tier)
  if (V.graphics === 'custom') return 'custom';
  const name = V.graphics === 'auto' || !GRAPHICS_TIERS[V.graphics] ? tierFor(machine) : V.graphics;
  writeTier(V, name);
  return name;
}

/** One tier's values into T.visual (`glow` and `grade` back to the look's own when on). */
export function writeTier(V, name) {
  const t = GRAPHICS_TIERS[name]; if (!t) return;
  V.resolution = String(t.lines === 480 ? 'ps2' : t.lines);
  V.shadows = t.shadows; V.shadowRes = t.shadowRes; V.shadowFilter = t.shadowFilter; V.shadowEvery = t.shadowEvery;
  V.lightSlots = t.lightSlots; V.msaa = Math.min(t.msaa, 8); V.outlineReach = t.outlineReach;
  V.glow = t.glow ? DEFAULTS.visual.glow : 0; V.grade = DEFAULTS.visual.grade; // (the grade stays: with it the frame still draws into the one target, so no second set of programs is compiled for the canvas, +70 measured)
  V.antialias = t.antialias;
}

export class Graphics {
  constructor(game, { renderer, camera, tier, machine }) {
    this.game = game; this.renderer = renderer; this.camera = camera; this.tier = tier; this.machine = machine;
    this.dynLines = null; this.samples = []; this.overT = 0; this.underT = 0; this.sinceDown = Infinity; this.checkT = 0; this.cullT = 0; this.frame = 0;
    this.applyShadowRate();
    const chosen = T.visual.graphics;
    queueMicrotask(() => game.events?.emit('graphics.tier', { tier, chosen, renderer: machine.renderer, touch: !!machine.touch, mobile: !!machine.mobile, by: 'environment' }));
  }

  /** The sun's map redrawn every n frames (n 1: every frame, three's own). */
  applyShadowRate() {
    const n = Math.max(1, T.visual.shadowEvery | 0 || 1), sm = this.renderer.shadowMap;
    sm.autoUpdate = n <= 1; if (n > 1) sm.needsUpdate = true;
  }

  /** Before each draw (the frame loop's and the harness's): the shadow's turn. */
  beforeDraw() {
    const n = T.visual.shadowEvery | 0;
    if (n > 1 && this.shadowsWanted !== false && (this.frame++ % n) === 0) this.renderer.shadowMap.needsUpdate = true; // (shadowsWanted: the tick's own say, off deep under the workshop)
  }

  /** The player picked a tier in play: what can change now changes; the rest waits for the next start. Returns whether a restart is owed. */
  setTier(name) {
    const V = T.visual;
    if (name === 'custom') return false;
    const target = name === 'auto' ? tierFor(this.machine) : name;
    const before = { lightSlots: V.lightSlots, shadows: V.shadows, shadowFilter: V.shadowFilter, glow: V.glow > 0 || V.grade > 0, msaa: V.msaa, antialias: V.antialias };
    writeTier(V, target);
    this.tier = target; this.dynLines = null;
    this.game.present?.apply(); this.applyShadowRate();
    const after = { lightSlots: V.lightSlots, shadows: V.shadows, shadowFilter: V.shadowFilter, glow: V.glow > 0 || V.grade > 0, msaa: V.msaa, antialias: V.antialias };
    this.game.events?.emit('graphics.tier', { tier: target, chosen: name, renderer: this.machine.renderer, touch: !!this.machine.touch, mobile: !!this.machine.mobile, restart: JSON.stringify(before) !== JSON.stringify(after), by: 'courier' });
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  /** A frame's interval, kept (the title's frames too: cheap, they show the display's own refresh). Returns the window's sorted ms. */
  observe(raw) {
    if (document.hidden || raw <= 0 || raw > 0.25) return null;
    const now = performance.now(), S = this.samples;
    S.push([now, raw * 1000]);
    while (S.length && S[0][0] < now - DYN.window * 1000) S.shift();
    if (S.length < 20) return null;
    const ms = S.map((x) => x[1]).sort((a, b) => a - b);
    this.refresh = Math.min(this.refresh ?? Infinity, ms[Math.floor(ms.length * 0.1)]); // (the best the display has shown: its refresh)
    return ms;
  }

  /** Each frame of the real loop (never the harness's manual ticks): dynamic resolution, and the outline hulls' reach. */
  update(raw) {
    this.cullT -= raw;
    if (this.cullT <= 0) { this.cullT = 0.25; this.cullOutlines(); }
    if (T.visual.dynamicResolution === false) return;
    const ms = this.observe(raw); if (!ms) return;
    this.sinceDown += raw;
    if ((this.checkT -= raw) > 0) return;
    this.checkT = 0.5;
    const med = ms[ms.length >> 1], ref = this.refresh;
    const missing = med > ref * DYN.miss && med > DYN.slowest, making = med <= ref * DYN.make;
    this.overT = missing ? this.overT + 0.5 : 0; this.underT = making ? this.underT + 0.5 : 0;
    const top = GRAPHICS_TIERS[this.tier]?.lines ?? linesOf(T.visual.resolution), floor = GRAPHICS_TIERS[this.tier]?.floor ?? top;
    const cur = this.dynLines ?? top, i = LINE_STEPS.indexOf(nearestStep(cur));
    if (this.overT >= DYN.down && cur > floor && LINE_STEPS[i + 1] >= floor) { this.setLines(LINE_STEPS[i + 1]); this.overT = 0; this.sinceDown = 0; this.samples.length = 0; }
    else if (this.underT >= DYN.up && cur < top && this.sinceDown > DYN.upAfterDown && i > 0) { this.setLines(Math.min(top, LINE_STEPS[i - 1])); this.underT = 0; this.samples.length = 0; }
  }
  setLines(n) {
    this.dynLines = n;
    if (this.game.present) this.game.present.dynLines = n;
    this.game.present?.apply();
    this.game.events?.emit('graphics.lines', { lines: n, by: 'environment' });
  }

  /** Props' outline hulls past the tier's reach hidden (characters' are never in OUTLINES); only the ones it hid are shown again. */
  cullOutlines() {
    const reach = T.visual.outlineReach || 0, cam = this.camera.position, r2 = reach * reach;
    for (const o of OUTLINES) {
      if (!o.parent) { OUTLINES.delete(o); continue; }
      const e = o.matrixWorld.elements, dx = e[12] - cam.x, dy = e[13] - cam.y, dz = e[14] - cam.z;
      const want = !reach || dx * dx + dy * dy + dz * dz < r2;
      if (!want && o.visible) { o.visible = false; o.userData.farCulled = true; }
      else if (want && o.userData.farCulled) { o.visible = true; o.userData.farCulled = false; }
    }
  }
}

const linesOf = (res) => (res === 'ps2' ? 480 : +res || 480);
const nearestStep = (n) => LINE_STEPS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
/** The shadow filter's three constant (boot only: it keys every lit program). */
export const shadowTypeOf = (f) => (f === 'basic' ? THREE.BasicShadowMap : THREE.PCFShadowMap);
