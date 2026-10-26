// ---------------------------------------------------------------------------------------
// THE FIELD REPORT (the owner, 2026-10-25: "are we doing things in a best-practices manner for mobile development?"). What a load of the
// published page did on the device it ran on, written to the page's private store, so the gate reads the owner's iPhone itself instead of
// a desk browser emulating one. One document a load, in the viewer's own subtree beside the cloud save (`data/users/<id>`, private even
// from the artifact's owner: the owner's own loads are the owner's to read, and through the owner the gate's):
//   field.<load>   { build, at, device, ua, screen, view, dpr, tier, machine, standalone, framed,
//                    last (how the load before this one ended: index.html's boot watch note), boot (its stages, real ms),
//                    moments [[what, real s]] (the boot watch's moments after boot, the graphics lost and given back, each zone entered),
//                    errors [[message, real s]] (the first few after boot), samples [{ s, fps, med, worst, geos, tex, programs, heap,
//                    zone, areas, lines }], ended ('hidden' | 'left', s) }
//   field.index    { ids }   the last FIELD.keep loads; an older report is deleted when a new one starts.
// Written at the title, then on FIELD.every real seconds for the first five real minutes and on FIELD.later after, and when the page is
// hidden (a phone may never come back to the tab); one write at a time. Nothing here when the store is absent (the dev server, a test,
// signed out): the cloud save decides that (core/cloudsave.js), and this reads its handle.
//
// Prior art: Firebase Performance Monitoring's per-session traces, MetricKit's daily payloads (iOS), the Web Vitals library's report on
// visibilitychange, and a crash reporter's "previous session ended unexpectedly" breadcrumb (Crashlytics, Sentry).
//
//   const field = new FieldReport(game, { renderer, cloud })   field.frame(rawDt)   (each frame, boot/frame.js)
// ---------------------------------------------------------------------------------------
import { now } from '../core/calendar.js';

/** every / later: real s between writes, before and after the first five real minutes; keep: loads kept; samples, moments, errors: rows kept
 *  a report (the newest samples, the first moments and errors). */
export const FIELD = { every: 30, later: 120, early: 300, keep: 30, samples: 40, moments: 40, errors: 8 };

const rid = () => (globalThis.crypto?.randomUUID?.() || `${now()}${performance.now()}`).replace(/[^a-z0-9]/gi, '').slice(0, 12);
const sec = () => Math.round(performance.now() / 100) / 10;

export class FieldReport {
  constructor(game, { renderer, cloud }) {
    this.game = game; this.r = renderer; this.cloud = cloud;
    this.id = `${now().toString(36)}${rid().slice(0, 6)}`;
    this.frames = []; this.nextT = 0; this.busy = false; this.on = false; this.doc = null;
    const W = globalThis.window?.__bootWatch;
    this.doc = {
      build: W?.build || game.build || '', at: now(), ua: navigator.userAgent, device: game.input?.device ?? null,
      screen: [screen.width, screen.height], view: [innerWidth, innerHeight], dpr: devicePixelRatio,
      standalone: !!(matchMedia?.('(display-mode: standalone)').matches || navigator.standalone), framed: window.top !== window,
      last: W?.last || null, boot: (W?.stages || []).map(([n, ms]) => [n, ms]), moments: [], errors: [], samples: [], ended: null,
    };
    // (the boot watch's moments after boot are this load's too)
    if (W?.moment) { const m = W.moment; W.moment = (name) => { this.moment(name); return m(name); }; }
    game.events?.on?.('render.lost', () => { this.moment('the graphics taken back'); this.write(true); });
    game.events?.on?.('render.restored', (e) => this.moment(`the graphics given back after ${e.after} s`));
    game.events?.on?.('seam.lift', (e) => { const R = game.raceway; this.moment(`cover lifted (${e.kind}): ${e.staged} staged, ${e.textures} textures, ${e.ms} ms${R?.buildMs && game.zones?.current === 'raceway' ? `; raceway ${JSON.stringify(R.buildMs)} field ${R.fieldFrom || 'travel'}` : ''}`); });
    addEventListener('error', (e) => this.error(e?.error?.message || e?.message || 'an error'));
    addEventListener('unhandledrejection', (e) => this.error(e?.reason?.message || String(e?.reason || 'a promise failed')));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.doc.ended = ['hidden', sec()]; this.write(true); } else this.doc.ended = null; });
    addEventListener('pagehide', () => { this.doc.ended = ['left', sec()]; this.write(true); });
  }

  moment(what) { if (this.doc.moments.length < FIELD.moments) this.doc.moments.push([String(what).slice(0, 240), sec()]); }
  error(what) { if (this.doc.errors.length < FIELD.errors) this.doc.errors.push([String(what).slice(0, 200), sec()]); }

  /** Each frame: its real length kept for the next sample; the first write once the cloud save holds the store. */
  frame(rawDt) {
    if (rawDt > 0 && rawDt < 2) this.frames.push(rawDt * 1000);
    const z = this.game.zones?.current ?? null; if (z !== this.zone) { this.zone = z; this.moment(`in ${z}`); } // (where it was, as it went)
    const t = performance.now() / 1000;
    if (t < this.nextT) return;
    if (!this.on) { if (!this.cloud?.db || !this.cloud?.uid || navigator.webdriver) { this.nextT = t + 5; return; } this.on = true; this.start(); }
    this.sample();
    this.nextT = t + (t < FIELD.early ? FIELD.every : FIELD.later);
    this.write();
  }

  sample() {
    const f = this.frames.sort((a, b) => a - b), n = f.length, g = this.game, m = this.r?.info?.memory || {};
    const med = n ? f[n >> 1] : 0;
    this.doc.samples.push({
      s: sec(), fps: med ? Math.round(1000 / med) : 0, med: Math.round(med * 10) / 10, worst: n ? Math.round(f[n - 1]) : 0,
      geos: m.geometries ?? null, tex: m.textures ?? null, programs: this.r?.info?.programs?.length ?? null,
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      zone: g.zones?.current ?? null, areas: g.areas?.stats?.().filter((a) => a.resident).map((a) => a.id).join(',') || '',
      lines: g.present?.dynLines ?? null, tier: g.graphics?.tier ?? null,
    });
    if (this.doc.samples.length > FIELD.samples) this.doc.samples.splice(1, 1); // (the first kept: the load's own beginning)
    this.frames = [];
  }

  col() { return this.cloud.db.collection(`data/users/${this.cloud.uid}`); }

  /** The first write: the machine's reading, then the index of loads, the oldest past FIELD.keep deleted. */
  async start() {
    const M = this.game.graphics?.machine || {};
    this.doc.machine = { renderer: M.renderer || null, cores: M.cores || null, memory: M.memory || null, mobile: !!M.mobile };
    this.doc.tier = this.game.graphics?.tier ?? null; this.doc.device = this.game.input?.device ?? this.doc.device;
    try {
      const ix = this.col().doc('field.index'), ids = ((await ix.get()).data?.()?.ids || []).filter((x) => x !== this.id);
      ids.push(this.id);
      const gone = ids.splice(0, Math.max(0, ids.length - FIELD.keep));
      await ix.set({ ids });
      for (const old of gone) await this.col().doc(`field.${old}`).delete().catch(() => {});
    } catch { /* the report still goes */ }
  }

  /** One write at a time; a write asked while one is out goes after it (`force`: the page is going, write what there is now). */
  async write(force = false) {
    if (!this.on) return;
    if (this.busy) { this.again = true; return; }
    if (force && this.frames.length) this.sample();
    this.doc.boot = (globalThis.window?.__bootWatch?.stages || []).map(([n, ms]) => [n, ms]); // (the stages up to now: 'shaders' and 'ready' come after the title is up)
    this.busy = true;
    try { await this.col().doc(`field.${this.id}`).set(JSON.parse(JSON.stringify(this.doc))); } catch { /* refused: the next one tries */ }
    this.busy = false;
    if (this.again) { this.again = false; this.write(); }
  }
}
