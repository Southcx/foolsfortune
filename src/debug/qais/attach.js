// ---------------------------------------------------------------------------------------
// WHAT A REPORT CARRIES: everything the machine attaches to a bug report so that every division reads the same one
// (docs/plans/BUGREPORT.md, "What the machine attaches"): where and when, what the Courier was doing, what was around, what had happened
// (the log, the bus, the console), what it cost (the F4 report), the tuning away from its defaults (debug/tuned.js), and the state (the
// save and the replay so far). The person writes a
// title; the machine writes the rest.
//
// The console ring is installed at boot, before anything can warn: the last 50 warnings and errors (and uncaught ones), kept in order.
//
// Prior art: Valve's Source `bug` command (map, `setpos`/`setang` to paste and stand there again, the build), EVE Online's and Sea of
// Thieves' reporters (the client's logs and state attached without asking), Doom's demos (the play itself, to run again).
//
//   installConsoleRing()   (main.js, at boot)     where(game) -> { build, seed, pos, yaw, zone, place, clock, weather, stand }
//   gather(game) -> the whole state, as plain data (one JSON file)     pngOf(canvas) -> Promise<Blob>
// ---------------------------------------------------------------------------------------
import { zoneOf } from '../../render/zonemap.js';
import { placeOf } from '../../progress/weather.js';
import { now, DAY_MS, dayOf } from '../../core/calendar.js';
import { BUILD } from '../../core/progress.js';
import { tuned } from '../tuned.js';

const RING = [], RING_MAX = 50;
const r2 = (v) => +(+v).toFixed(2);
const v3 = (v) => (v ? [r2(v.x), r2(v.y), r2(v.z)] : null);
const safe = (fn, fallback = null) => { try { return fn(); } catch (e) { return fallback ?? `(could not be read: ${e.message})`; } };

/** The last warnings and errors, kept from boot (a report's "what had happened" in the console's words). */
export function installConsoleRing() {
  if (RING.installed) return;
  RING.installed = true;
  const keep = (kind, args) => {
    const text = args.map((a) => (a instanceof Error ? `${a.message}\n${a.stack || ''}` : typeof a === 'object' ? safe(() => JSON.stringify(a), String(a)) : String(a))).join(' ');
    RING.push({ kind, at: performance.now() / 1000, text: text.slice(0, 2000) });
    if (RING.length > RING_MAX) RING.shift();
  };
  for (const kind of ['warn', 'error']) {
    const orig = console[kind].bind(console);
    console[kind] = (...args) => { keep(kind, args); orig(...args); };
  }
  addEventListener('error', (e) => keep('uncaught', [e.error || e.message]));
  addEventListener('unhandledrejection', (e) => keep('rejection', [e.reason]));
}
export const consoleRing = () => RING.slice();

/** Where and when: enough to stand there again (the `stand` line pasted into the chat: /goto). */
export function where(game) {
  const P = game.player, cam = game.camera, ms = now();
  const dir = cam ? safe(() => v3(cam.getWorldDirection(cam.position.clone())), null) : null;
  const yaw = r2(P.yaw ?? 0);
  return {
    build: BUILD, seed: game.seed, pos: v3(P.pos), yaw,
    camera: cam ? { pos: v3(cam.position), dir } : null,
    zone: zoneOf(P.pos), place: placeOf(P.pos)?.place ?? null,
    clock: { ms, gameDay: dayOf(ms), gameHour: r2(((ms % DAY_MS) / DAY_MS) * 24) },
    weather: safe(() => game.weather?.here(P.pos) ?? null),
    stand: `/goto ${v3(P.pos).join(' ')} ${yaw}`,
  };
}

/** What the Courier was doing: the tech, the tool out, the target, the body's state and the keys held. */
function doing(game) {
  const P = game.player, tool = game.belt?.tools?.find((t) => t.drawT > 0.5);
  const target = game.lock?.target;
  return {
    tech: game.techs?.active?.id ?? null, tool: tool?.id ?? null,
    target: target ? { type: target.type, kind: target.ref?.kind ?? null, pos: safe(() => v3(game.lock.point(P.pos.clone())), null) } : null,
    grounded: !!P.grounded, shape: P.shape, vel: v3(P.vel), held: [...(game.input?.down || [])],
    god: !!game.god?.active, skiff: !!game.skiff?.active, well: game.well?.active ? (game.well.floor ?? true) : false,
  };
}

/** What was around: the creatures within 30 m, their statuses, and their minds as the F3 panel says them. */
function around(game) {
  const P = game.player;
  const near = safe(() => game.creatures.near(P.pos, 30), []);
  return {
    creatures: near.slice(0, 16).map((c) => ({ kind: c.kind ?? c.type ?? null, pos: v3(c.pos), hp: c.hp ?? null, ally: !!c.ally, statuses: [...(c.status?.keys?.() || [])] })),
    minds: safe(() => game.ai?.describe?.() || [], []),
  };
}

/** The whole state, as plain data: one JSON file every division reads the same way. */
export function gather(game) {
  const R = game.renderer, info = R?.info;
  const gl = R?.getContext?.(), dbg = gl?.getExtension?.('WEBGL_debug_renderer_info');
  return {
    where: where(game),
    tuning: safe(() => tuned()), // (every knob and setting away from its default: debug/tuned.js)
    doing: safe(() => doing(game)),
    around: safe(() => around(game)),
    happened: {
      log: safe(() => game.log.lines.slice(-200).map((l) => ({ cls: l.cls, text: l.text, n: l.n || 1 })), []),
      events: safe(() => game.events.log.slice(-300), []),
      console: consoleRing(),
    },
    cost: {
      diag: safe(() => game.diag?.report() ?? null),
      renderer: info ? { calls: info.render.calls, triangles: info.render.triangles, programs: info.programs?.length ?? 0, geometries: info.memory.geometries, textures: info.memory.textures } : null,
      browser: navigator.userAgent, gpu: dbg ? safe(() => gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'unknown',
      screen: [innerWidth, innerHeight, devicePixelRatio],
    },
    state: {
      save: safe(() => game.save.export()),
      replay: safe(() => (game.replay?.began ? game.replay.text() : null)),
    },
  };
}

export const pngOf = (canvas) => new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
