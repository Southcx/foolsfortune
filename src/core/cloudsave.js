// ---------------------------------------------------------------------------------------
// THE CLOUD SAVE (docs/plans/MOBILE.md section 12; the owner, 2026-10-24: "saves also need to migrate between platforms"): the progress
// kept in the published page's private store too, so one save follows you between the desk and the phone, and survives the phone's
// browser clearing what a page wrote (iOS Safari may, after seven days unvisited; a frame's storage is partitioned). The save in this
// browser stays the save (core/save.js); this is a second writer of the same text, and a reader at boot.
//
//   WHERE   the viewer's own subtree (`data/users/<id>`, private even from the artifact's owner): per mode (DEBUG, STORY), one meta
//           document `save.<mode>` { build, at, device, label, played, keys: { key: { gen, parts } } }, and the stored keys' texts in
//           documents `save.<mode>.<gen>.<n>.<key>` { build, at, device, text } of at most CLOUD.part characters (the store's documents
//           hold 256 KiB). An upload writes the changed keys under a new generation, then the meta, then deletes what the meta no longer
//           names: the meta is the commit, so a page closed mid-upload leaves the last whole save readable.
//   WHEN    written with the save's own flush when the page is hidden or closed, and the changed keys at most once a real minute; one
//           write at a time. Read at boot, waiting CLOUD.boot real ms at most: boot never waits on the store.
//   WHAT    a save from another build is refused (progress resets every build). Settings never travel: a phone's graphics and touch
//           layout are not the desk's. The device is a random id kept in the settings (one a browser), its label read off the browser.
//   WHO WINS  the save played longer, whole, never section by section (a save is one thing): played = the ledger's play time. When only
//           one side changed since the last sync, that side. The other is kept in the Codex for a game day ("Your save from your phone,
//           2 real hours ago: LOAD"); a real hour of play is never lost silently. A cloud answer that comes after the boot's wait is never
//           swapped in under a running game: it is offered, and nothing is uploaded over it until you choose.
//   ABSENT  signed out, the store not granted, a viewer who may not write: the browser alone, as before, said once in the log.
//
// Prior art: Steam Cloud's and the consoles' save sync (the newer copy offered, the conflict shown with both saves' play time and age,
// never merged), Dropbox's conflicted copy (the loser kept beside, never thrown away), and the two-phase commit's last write as the commit.
//
//   const cloud = new CloudSave(save, { build, mode })   await cloud.boot()   (after save.boot, before any section registers)
//   cloud.attach(game)   cloud.update(rawDt)   cloud.flushNow()   cloud.other -> { label, at, played, keys } | null   cloud.loadOther()
//   cloud.keepMine()   CLOUD (its numbers)
//   Events: save.cloud { state: 'on' | 'local' | 'took' | 'kept' | 'offer' | 'failed', from?, ago?, by: 'environment' }
// ---------------------------------------------------------------------------------------
import { codeOf } from './save.js';
import { now } from './calendar.js';

/** boot: real ms the boot waits on the store; every: real s between uploads of what changed; keep: real s the other save is kept (a game
 *  day); part: characters a document holds (under the store's 256 KiB once escaped). */
export const CLOUD = { boot: 1500, every: 60, keep: 3600, part: 180000 };

const labelOf = (ua = navigator.userAgent || '') => (/iPhone|Android.+Mobile/i.test(ua) ? 'your phone' : /iPad|Android|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'your tablet' : 'your computer');
const rid = () => (globalThis.crypto?.randomUUID?.() || `${now()}-${performance.now()}`).replace(/[^a-z0-9]/gi, '').slice(0, 16); // (an id, not the simulation's chance)
const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(undefined), ms))]);

export class CloudSave {
  constructor(save, { build, mode, use = globalThis.window?.claude?.use } = {}) {
    this.save = save; this.build = build; this.mode = mode; this.use = use;
    this.db = null; this.uid = null; this.state = 'off'; // (off: no store here (the dev server, a test); local: the store refused; on)
    this.sent = {}; // key -> text as the cloud now holds it
    this.meta = null; this.busy = false; this.dirtyT = 0; this.waiting = false; // (waiting: an offer stands, nothing is uploaded over it)
    this.events = [];
    // (the device's id, the last sync a mode, the other save: this browser's own, in the settings scope)
    this.kept = { device: null, sync: {}, other: null };
    save.section('cloud', { scope: 'settings', dump: () => this.kept, load: (d) => { this.kept = { device: null, sync: {}, other: null, ...d }; }, reset: () => {} });
    if (!this.kept.device) { this.kept.device = rid(); save.dirty('cloud'); }
    if (this.kept.other && now() > this.kept.other.until) { this.kept.other = null; save.dirty('cloud'); }
  }
  get other() { const o = this.kept.other; return o && o.mode === this.mode ? o : null; }
  emit(state, more = {}) { const e = { state, ...more, by: 'environment' }; if (this.game) this.game.events?.emit('save.cloud', e); else this.events.push(e); }
  col() { return this.db.collection(`data/users/${this.uid}`); }
  metaRef() { return this.col().doc(`save.${this.mode}`); }

  /** At boot: reach the store (or not), read this mode's meta, and settle which save this session plays. Never longer than CLOUD.boot. */
  async boot() {
    if (!this.use || globalThis.navigator?.webdriver) return; // (no store on the dev server; the sweeps and the stress test keep theirs)
    const until = performance.now() + CLOUD.boot, reach = this.connect();
    const got = await withTimeout(reach, CLOUD.boot);
    if (got === undefined) { this.closed = true; reach.then((ok) => ok && this.settle()); return; } // (answered late: offered, never swapped)
    if (got) await withTimeout(this.settle(), Math.max(0, until - performance.now()));
    this.closed = true; // (from here a cloud save that would win is offered: the sections are loading what is stored)
  }
  async connect() {
    try {
      const [db, user] = await Promise.all(['db', 'user'].map((n) => Promise.resolve(this.use(n)).catch(() => null)));
      const uid = await Promise.resolve(user?.id?.()).catch(() => null);
      if (!db || !uid) { this.state = 'local'; this.emit('local'); return false; }
      this.db = db; this.uid = uid; this.state = 'on';
      this.meta = (await this.metaRef().get()).data?.() || null;
      return true;
    } catch { this.state = 'local'; this.emit('local'); return false; }
  }

  /** Which save to play: ours, the cloud's (taken whole, before any section loads), or, when the cloud answered late, an offer. */
  async settle() {
    const M = this.meta, mine = this.save.progress(), sync = this.kept.sync[this.mode] || null;
    this.emit('on');
    if (!M || M.build !== this.build) { this.dirtyT = CLOUD.every; return; } // (nothing there, or another build's: refused; ours goes up)
    const cloudChanged = !sync || M.at !== sync.at, localChanged = sync ? this.save.played() !== sync.played : this.save.played() > 0;
    if (!cloudChanged) { this.adopt(M, null); this.dirtyT = CLOUD.every; return; } // (in step: what we last sent or took)
    const theirs = await this.fetch(M); if (!theirs) { this.dirtyT = CLOUD.every; return; } // (half there: ignored, ours goes up)
    const takeThem = !localChanged || (M.played || 0) > this.save.played();
    if (!takeThem) { this.keepOther({ keys: theirs, label: M.label, at: M.at, played: M.played }); this.emit('kept', { from: M.label, ago: (now() - M.at) / 1000 }); this.dirtyT = CLOUD.every; return; }
    if (this.closed) { this.offer = { keys: theirs, M }; this.waiting = true; this.keepOther({ keys: theirs, label: M.label, at: M.at, played: M.played, offer: true }); this.emit('offer', { from: M.label, ago: (now() - M.at) / 1000 }); return; }
    if (localChanged && Object.keys(mine).length) this.keepOther({ keys: mine, label: labelOf(), at: now(), played: this.save.played() }); // (ours, the shorter: kept a game day)
    else if (this.kept.other?.offer) this.kept.other = null; // (the offer that was this same save: taken now)
    this.save.putProgress(theirs); this.adopt(M, theirs);
    this.emit('took', { from: M.label, ago: (now() - M.at) / 1000 });
  }
  /** The cloud's keys, whole, or null if any part is missing (an upload that never committed). */
  async fetch(M) {
    const out = {};
    try {
      for (const [key, { gen, parts }] of Object.entries(M.keys || {})) {
        let text = '';
        for (let n = 0; n < parts; n++) { const d = (await this.col().doc(docId(this.mode, gen, n, key)).get()).data?.(); if (!d || typeof d.text !== 'string') return null; text += d.text; }
        out[key] = text;
      }
    } catch { return null; }
    return out;
  }
  /** The cloud's state as ours: what it holds, and the sync mark. */
  adopt(M, keys) {
    this.meta = M; this.sent = keys || (M ? { ...this.sent } : {});
    if (!keys && M) for (const key of Object.keys(M.keys || {})) this.sent[key] ??= null; // (unknown text: sent again on the next upload)
    this.kept.sync[this.mode] = { at: M.at, played: M.played || 0 }; this.save.dirty('cloud');
  }
  keepOther(o) { this.kept.other = { ...o, mode: this.mode, until: now() + CLOUD.keep * 1000 }; this.save.dirty('cloud'); }

  attach(game) { this.game = game; for (const e of this.events.splice(0)) game.events?.emit('save.cloud', e); }
  /** Once a frame: the changed keys go up at most once a real minute. */
  update(dt) { if (this.state !== 'on' || this.waiting) return; if ((this.dirtyT += dt) >= CLOUD.every) { this.dirtyT = 0; this.upload(); } }
  /** The page is going (save.watchPage): what changed goes up now, as far as the page lets it. */
  flushNow() { if (this.state === 'on' && !this.waiting) this.upload(); }

  async upload() {
    if (this.save.holds.size) return;
    if (this.busy) { this.again = true; return; } // (asked while one is in flight: run again when it ends, with what is stored then)
    this.busy = true; this.again = false;
    try {
      const cur = this.save.progress(), changed = Object.keys(cur).filter((k) => cur[k] !== this.sent[k]), gone = Object.keys(this.sent).filter((k) => !(k in cur));
      if (!changed.length && !gone.length) return;
      const gen = rid(), at = now(), device = this.kept.device, base = { build: this.build, at, device };
      const keys = { ...(this.meta?.keys || {}) }, stale = [];
      for (const k of changed) {
        const text = cur[k], parts = Math.max(1, Math.ceil(text.length / CLOUD.part));
        for (let n = 0; n < parts; n++) await this.col().doc(docId(this.mode, gen, n, k)).set({ ...base, text: text.slice(n * CLOUD.part, (n + 1) * CLOUD.part) });
        if (keys[k]) stale.push([k, keys[k]]);
        keys[k] = { gen, parts };
      }
      for (const k of gone) { if (keys[k]) stale.push([k, keys[k]]); delete keys[k]; }
      const M = { ...base, label: labelOf(), played: this.save.played(cur), keys }; // (the play time of the save as sent, not as it is by now)
      await this.metaRef().set(M); // (the commit: from here the cloud is this save)
      for (const k of changed) this.sent[k] = cur[k];
      for (const k of gone) delete this.sent[k];
      this.meta = M; this.kept.sync[this.mode] = { at, played: M.played }; this.save.dirty('cloud');
      for (const [k, { gen: g, parts }] of stale) for (let n = 0; n < parts; n++) this.col().doc(docId(this.mode, g, n, k)).delete().catch(() => {});
    } catch (e) {
      if (!this.failed) { this.failed = true; this.emit('failed', { why: e?.code || 'error' }); } // (said once; the browser's copy is the save meanwhile)
      if (e?.code === 'invalid_argument' || e?.code === 'quota_exceeded' || e?.code === 'revoked') this.state = 'local'; // (may not write here: the browser alone)
    } finally { this.busy = false; if (this.again && this.state === 'on' && !this.waiting) this.upload(); }
  }

  /** The other save (the Codex's LOAD): put in place whole, and the page reloads; the one played now is kept in its place a game day. */
  loadOther() {
    const o = this.other; if (!o) return false;
    this.save.flush({ all: true });
    const mine = this.save.progress(), played = this.save.played(), keys = o.keys;
    this.kept.other = { keys: mine, label: labelOf(), at: now(), played, mode: this.mode, until: now() + CLOUD.keep * 1000 }; // (ours, kept in its place)
    if (o.offer && this.offer) this.kept.sync[this.mode] = { at: this.offer.M.at, played: this.offer.M.played || 0 }; // (in step with the cloud's)
    this.save.dirty('cloud'); this.save.flush(); // (the settings written first)
    this.save.putProgress(keys); this.save.hold('other'); // (the progress in place, and nothing written over it before the reload)
    return true;
  }
  /** An offer declined (the Codex's KEEP THIS ONE): ours goes up, the cloud's kept a game day. */
  keepMine() { const o = this.other; if (!o?.offer) return; o.offer = false; this.waiting = false; this.offer = null; this.save.dirty('cloud'); this.upload(); }
  /** Any progress as a code (the Codex's copy of the other save). */
  codeOf(keys) { return codeOf(keys); }
}

const docId = (mode, gen, n, key) => `save.${mode}.${gen}.${n}.${key}`;
