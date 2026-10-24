// ---------------------------------------------------------------------------------------
// HOST PROBE: what the page's host allows, each fact read from the browser and none assumed (docs/plans/MOBILE.md 10.3 and 11.1: the
// owner's iPhone, the game inside a claude.ai frame; "facts to check on the owner's phone"). A capability is either present or
// MISSING; a state (standalone, persisted) is yes or no, and `undefined` where the browser has no way to say. It reads, it never asks:
// nothing here requests fullscreen, a wake lock, a vibration, a pointer lock or storage persistence, so a probe has no side effects
// and needs no gesture. The perf readout (debug/perfreadout.js) draws it.
//
// Prior art: Modernizr's feature detection (test the thing itself, never the browser's name), the "what is my browser" pages' capability
// tables (webbrowsertools, caniuse's live column), and the Storage API's own `estimate()` / `persisted()` pair.
//
//   probeHost(canvas) -> { framed, secure, query, standalone, iosStandalone, fullscreen, canvasFullscreen, orientationLock, orientation,
//                          wakeLock, vibrate, pointerLock, touchPoints, coarse, hoverNone, ua }       (synchronous)
//   await probeStorage() -> { persistedApi, persisted, estimate, usage, quota }                                (asks the Storage API)
//   fmtBytes(n)   shortUA(ua?)
// ---------------------------------------------------------------------------------------

const media = (q) => { try { return !!matchMedia(q).matches; } catch { return false; } };
const fn = (o, name) => typeof o?.[name] === 'function';

/** The synchronous facts: a boolean for presence, a value where the browser gives one, `undefined` where it has none to give. */
export function probeHost(canvas) {
  const nav = globalThis.navigator || {}, doc = globalThis.document || {};
  let framed = false; try { framed = window.top !== window.self; } catch { framed = true; } // (a cross-origin top throws on some reads: that is a frame)
  return {
    framed,
    secure: !!globalThis.isSecureContext,
    query: location.search || '',
    standalone: media('(display-mode: standalone)'), // (installed to the home screen, or launched as a web app)
    iosStandalone: typeof nav.standalone === 'boolean' ? nav.standalone : undefined, // (Safari's own flag, which no other browser has)
    fullscreen: doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled, // (true / false, undefined: the browser has no fullscreen API at all)
    canvasFullscreen: fn(canvas, 'requestFullscreen') || fn(canvas, 'webkitRequestFullscreen'),
    orientationLock: fn(globalThis.screen?.orientation, 'lock'),
    orientation: globalThis.screen?.orientation?.type,
    wakeLock: !!nav.wakeLock && fn(nav.wakeLock, 'request'),
    vibrate: fn(nav, 'vibrate'),
    pointerLock: fn(canvas, 'requestPointerLock'),
    touchPoints: nav.maxTouchPoints ?? 0,
    coarse: media('(pointer: coarse)'),
    hoverNone: media('(hover: none)'),
    ua: shortUA(nav.userAgent || ''),
  };
}

/** The storage numbers (async; the browser may refuse either call, which reads as missing). */
export async function probeStorage() {
  const S = globalThis.navigator?.storage, out = { persistedApi: fn(S, 'persisted'), persisted: undefined, estimate: fn(S, 'estimate'), usage: undefined, quota: undefined };
  try { if (out.persistedApi) out.persisted = await S.persisted(); } catch { /* none */ }
  try { if (out.estimate) { const e = await S.estimate(); out.usage = e.usage; out.quota = e.quota; } } catch { out.estimate = false; }
  return out;
}

export function fmtBytes(n) {
  if (!(n >= 0)) return 'n/a';
  if (n >= 2 ** 30) return `${(n / 2 ** 30).toFixed(1)} GB`;
  if (n >= 2 ** 20) return `${(n / 2 ** 20).toFixed(n >= 2 ** 27 ? 0 : 1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

/** A user agent without its boilerplate (Mozilla/5.0, the WebKit and Safari build numbers, "like Gecko", "CPU ... like Mac OS X"), cut at 80 characters. */
export function shortUA(ua = globalThis.navigator?.userAgent || '') {
  const s = ua.replace(/^Mozilla\/5\.0\s*/, '').replace(/\(KHTML, like Gecko\)\s*/g, '').replace(/AppleWebKit\/[\d.]+\s*/, '').replace(/\s*Safari\/[\d.]+/, '')
    .replace(/Mobile\/\w+/, 'Mobile').replace(/CPU (iPhone )?OS /, 'iOS ').replace(/ like Mac OS X/, '').replace(/\s+/g, ' ').trim();
  return s.length > 80 ? `${s.slice(0, 79)}\u2026` : s;
}
