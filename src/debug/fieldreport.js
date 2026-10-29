// ---------------------------------------------------------------------------------------
// THE FIELD REPORT (the owner, 2026-10-25: "are we doing things in a best-practices manner for mobile development?"). What a load of the
// published page did on the device it ran on, written to the page's private store, so the gate reads the owner's iPhone itself instead of
// a desk browser emulating one. One document a load, in the viewer's own subtree beside the cloud save (`data/users/<id>`, private even
// from the artifact's owner: the owner's own loads are the owner's to read, and through the owner the gate's):
//   field.<load>   { build, at, device, ua, screen, view, dpr, tier, machine, standalone, framed,
//                    last (how the load before this one ended: index.html's boot watch note), boot (its stages, real ms),
//                    moments [[what, real s]] (the boot watch's moments after boot, the graphics lost and given back, each zone entered,
//                    each shader program linked after the first frame and each frame over FIELD.longFrame real ms),
//                    slow [[ms, real s, the events emitted since the frame before]] (the last FIELD.slows frames over FIELD.slow real ms once
//                    play began: what the frame was doing, by what it said; the owner's iPhone XR, v296: "some slowdown when achievements
//                    unlock in rapid succession"),
//                    errors [[message, real s]] (the first few after boot), samples [{ s, fps, med, worst, geos, tex, programs, heap,
//                    zone, areas, lines }], ended ('hidden' | 'left', s),
//                    firsts [{ s, what, in, zone, dry, f }] (at a loss, newest first: each material first drawn since play began),
//                    frames { cols, rows } (at a loss: the last FIELD.frames frames' draws, vertices, new geometries and textures),
//                    mode ('story' | 'debug'), pace [[milestone, real min of play, target]] (STORY's milestones reached: progress/pace.js paceOf) }
//   field.index    { ids }   the last FIELD.keep loads; an older report is deleted when a new one starts.
// Written at the title, then on FIELD.every real seconds for the first five real minutes and on FIELD.later after, and when the page is
// hidden (a phone may never come back to the tab); one write at a time. Nothing here when the store is absent (the dev server, a test,
// signed out): the cloud save decides that (core/cloudsave.js), and this reads its handle.
//
// Prior art: Firebase Performance Monitoring's per-session traces, MetricKit's daily payloads (iOS), the Web Vitals library's report on
// visibilitychange, and a crash reporter's "previous session ended unexpectedly" breadcrumb (Crashlytics, Sentry).
//
//   ?hide=word,word   draws whose material or object name holds a word are skipped (a suspect tried on the phone, a load each)
//   const field = new FieldReport(game, { renderer, cloud })   field.frame(rawDt)   (each frame, boot/frame.js)
// ---------------------------------------------------------------------------------------
import { paceOf } from '../progress/pace.js';
import { now } from '../core/calendar.js';

/** every / later: real s between writes, before and after the first five real minutes; keep: loads kept; samples, moments, errors: rows kept
 *  a report (the newest samples, the first moments and errors); slow, slows: a slow frame's real ms, and how many are kept (the newest);
 *  glCheck: real s between GL error checks (getError makes the CPU wait for the card: on iOS a round trip to the GPU process). */
export const FIELD = { every: 30, later: 120, early: 300, keep: 30, samples: 40, moments: 80, errors: 8, longFrame: 300, firsts: 60, frames: 30, slow: 100, slows: 32, glCheck: 15 };

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
      last: W?.last || null, boot: (W?.stages || []).map(([n, ms]) => [n, ms]), moments: [], errors: [], samples: [], slow: [], ended: null,
    };
    // every event since the frame before, by name, so a slow frame says what it was doing
    this.heard = new Map(); game.events?.on?.('*', (e) => { if (this.heard.has(e.name) || this.heard.size < 24) this.heard.set(e.name, (this.heard.get(e.name) || 0) + 1); });
    // (the boot watch's moments after boot are this load's too)
    if (W?.moment) { const m = W.moment; W.moment = (name) => { this.moment(name); if (name === 'the dive into the world') this.watching = true; return m(name); }; }
    game.events?.on?.('render.lost', (e) => { this.lost = true; this.moment(`the graphics taken back${e?.why ? ` (${e.why})` : ''}`); this.keepLast(); this.write(true); });
    // what the frame began drawing for the first time since play began (each material once, the warm-up's postage stamp aside): a draw that
    // stalls a phone's GPU shows here, the newest last (the owner's iPhone XR, v286: lost on turning the camera in the workshop with no
    // shader compiled and no slow frame in the 22 real s before)
    this.firsts = []; this.drawn = new Set(); this.ring = []; this.gl = renderer?.getContext?.() || null;
    const R = renderer, direct = R?.renderBufferDirect;
    // `?hide=a,b`: draws whose material or object name (or material type) holds one of the words are skipped, so a suspect can be tried
    // on the phone itself, a load each (the gate's bisection, never a player's setting)
    const hide = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hide') || '' : '').toLowerCase().split(',').map((w) => w.trim()).filter(Boolean);
    if (hide.length) this.moment(`hiding ${hide.join(', ')}`);
    const hidden = (m, o) => { const k = `${m.name} ${m.type} ${o?.name || ''}`.toLowerCase(); return hide.some((w) => k.includes(w)); };
    if (direct) R.renderBufferDirect = (camera, scene, geometry, material, object, group) => {
      if (hide.length && material && hidden(material, object)) return;
      this.drawsNow = (this.drawsNow || 0) + 1; this.vertsNow = (this.vertsNow || 0) + (geometry?.index?.count ?? geometry?.attributes?.position?.count ?? 0) * (object?.isInstancedMesh ? object.count : 1);
      if (this.watching && material && !this.drawn.has(material.uuid)) {
        this.drawn.add(material.uuid);
        const n = geometry?.index?.count ?? geometry?.attributes?.position?.count ?? 0, inst = object?.count > 1 ? ` x${object.count}` : '';
        let path = '', p = object?.parent; for (let d = 0; p && d < 4; d++, p = p.parent) if (p.name) path = `${p.name}/${path}`;
        let z = object; while (z && z.userData?.zone === undefined) z = z.parent;
        this.firsts.push({ s: sec(), what: `${material.name || material.type}/${object?.name || object?.type || '?'} v${n}${inst}`, in: path, zone: z?.userData?.zone ?? null, dry: !!geometry?.userData?.dry, f: this.frameNo });
        if (this.firsts.length > FIELD.firsts) this.firsts.shift();
      }
      return direct.call(R, camera, scene, geometry, material, object, group);
    };
    game.events?.on?.('render.restored', (e) => this.moment(`the graphics given back after ${e.after} s`));
    game.events?.on?.('seam.lift', (e) => { const R = game.raceway; this.moment(`cover lifted (${e.kind}): ${e.staged} staged, ${e.textures} textures, ${e.ms} ms${R?.buildMs && game.zones?.current === 'raceway' ? `; raceway ${JSON.stringify(R.buildMs)} field ${R.fieldFrom || 'travel'}` : ''}`); });
    addEventListener('error', (e) => this.error(e?.error?.message || e?.message || 'an error'));
    addEventListener('unhandledrejection', (e) => this.error(e?.reason?.message || String(e?.reason || 'a promise failed')));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.doc.ended = ['hidden', sec()]; this.write(true); } else this.doc.ended = null; });
    addEventListener('pagehide', () => { this.doc.ended = ['left', sec()]; this.write(true); });
  }

  /** At a loss: the materials first drawn (newest first) and the last frames' work, into the report whole (FIELD.firsts, FIELD.frames). */
  keepLast() {
    this.doc.firsts = this.firsts.slice().reverse();
    this.doc.frames = { cols: ['frame', 's', 'draws', 'vertices (indices x instances)', 'new geometries', 'new textures', 'ms'], rows: this.ring.slice() };
  }

  moment(what) { if (this.doc.moments.length < FIELD.moments) this.doc.moments.push([String(what).slice(0, 240), sec()]); }
  error(what) { if (this.doc.errors.length < FIELD.errors) this.doc.errors.push([String(what).slice(0, 200), sec()]); }

  /** Each frame: its real length kept for the next sample; the first write once the cloud save holds the store. */
  frame(rawDt) {
    if (rawDt > 0 && rawDt < 2) this.frames.push(rawDt * 1000);
    // the last frames' work, kept for a loss: draws, vertices, and what was made on the card since the frame before
    const I = this.r?.info; this.frameNo = (this.frameNo || 0) + 1;
    if (I && !this.lost) {
      const m = I.memory, g0 = this.lastMem?.[0] ?? m.geometries, t0 = this.lastMem?.[1] ?? m.textures;
      this.ring.push([this.frameNo, sec(), this.drawsNow || 0, this.vertsNow || 0, m.geometries - g0, m.textures - t0, Math.round(rawDt * 1000)]);
      if (this.ring.length > FIELD.frames) this.ring.shift();
      this.lastMem = [m.geometries, m.textures];
    }
    this.drawsNow = 0; this.vertsNow = 0;
    // a slow frame once play began, with what was said since the frame before (its work, or the timers' between)
    if (this.watching && rawDt * 1000 > FIELD.slow && rawDt < 30) {
      this.doc.slow.push([Math.round(rawDt * 1000), sec(), [...this.heard].map(([k, n]) => (n > 1 ? `${k} x${n}` : k)).join(', ')]);
      if (this.doc.slow.length > FIELD.slows) this.doc.slow.shift();
    }
    this.heard.clear();
    // a GL error, every FIELD.glCheck real s and at each zone entered (getError waits on the card: never every frame, nor every second)
    const now1 = performance.now(), z = this.game.zones?.current ?? null;
    if (this.gl && !this.lost && (z !== this.zone || now1 - (this.errAt || 0) > FIELD.glCheck * 1000)) { this.errAt = now1; const e = this.gl.getError(); if (e && !this.gl.isContextLost()) this.error(`a GL error 0x${e.toString(16)} in ${z ?? '?'}`); }
    if (z !== this.zone) { this.zone = z; this.moment(`in ${z}`); } // (where it was, as it went)
    // the last things before a loss: each shader program linked after boot (by its material's name) and each long frame
    const P = this.r?.info?.programs;
    if (P && this.progs !== undefined && P.length !== this.progs) { const fresh = P.slice(this.progs).map((p) => p.name || '?'); this.moment(`programs ${this.progs} -> ${P.length}${fresh.length ? `: ${fresh.slice(0, 4).join(', ')}` : ''}`); }
    if (P) this.progs = P.length;
    if (rawDt * 1000 > FIELD.longFrame && rawDt < 30) this.moment(`a frame of ${Math.round(rawDt * 1000)} ms`);
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
      ci: g.constantIndex?.on ? g.constantIndex.arrays.size : null, // (uniform arrays read at constant indices so far: render/constantindex.js)
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
    const g = this.game; this.doc.mode = g.mode ?? null; this.doc.pace = g.mode === 'story' && g.ledger ? paceOf(g.ledger).filter((p) => p.at != null).map((p) => [p.id, p.at, p.target]) : null; // (each milestone reached, real minutes of play against its target: progress/pace.js; STORY only, DEBUG lends them)
    this.busy = true;
    try { await this.col().doc(`field.${this.id}`).set(JSON.parse(JSON.stringify(this.doc))); } catch { /* refused: the next one tries */ }
    this.busy = false;
    if (this.again) { this.again = false; this.write(); }
  }
}
