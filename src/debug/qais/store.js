// ---------------------------------------------------------------------------------------
// QAIS'S STORE: where QAIS keeps its rounds (docs/plans/QAIS.md, "The data"): the published build's own store, which outlives every
// republish to the same URL, and which every division reads and writes with `ArtifactData` on the build's URL. Five collections:
// `brief` (one build's notes from one division), `tests` (one QAIS test each, T<n>), `bugs` (one report each, R<n>), `questions`, and
// `meta` (`round`: the build under test and whether it was sent). Nothing here is in `game.save` (progress is reset with every build;
// QAIS must not be).
//
// Away from the published build (the dev server, a saved copy, the headless runs) the page's capabilities are absent: `online` is
// false, every watch hears an empty list once, and a report is kept as one downloaded file instead (report.js).
//
// Prior art: a test-case manager's store (TestRail: cases, runs, results, kept apart from the build under test), and the artifact
// runtime's own advice: subscribe once per query, write one document at a time, only on a person's action.
//
//   const store = await openStore()    store.online   store.watch(col, (docs) => ...) -> unsubscribe   (docs: [{ id, ...fields }])
//   store.set(col, id, data)   store.update(col, id, patch)   store.upload(blob, type) -> { id, url } | null   store.me() -> { id, name }
//   store.call(server, tool, input) -> payload   (a connector, as the viewer: Send to the brigade)
// ---------------------------------------------------------------------------------------

export const COLLECTIONS = ['brief', 'tests', 'bugs', 'questions', 'meta'];

const use = (name) => {
  try { return window.claude?.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null); } catch { return Promise.resolve(null); }
};

class Store {
  constructor({ db, assets, user, mcp }) {
    this.db = db; this.assets = assets; this.user = user; this.mcp = mcp;
    this.online = !!db;
    this.cache = new Map(); // (each collection's last snapshot, for the window drawn before a snapshot arrives)
    this.subs = new Map();
  }

  /** One subscription per collection, shared by every reader (the runtime's rule: never one per render). */
  watch(col, fn) {
    let s = this.subs.get(col);
    if (!s) {
      s = { fns: new Set(), off: null };
      this.subs.set(col, s);
      if (this.db) {
        s.off = this.db.collection(col).onSnapshot(
          (snap) => { const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })); this.cache.set(col, docs); for (const f of s.fns) f(docs); },
          (e) => console.warn(`QAIS: the ${col} collection could not be read (${e?.code})`),
        );
      } else this.cache.set(col, []);
    }
    s.fns.add(fn);
    if (this.cache.has(col)) fn(this.cache.get(col));
    return () => s.fns.delete(fn);
  }

  docs(col) { return this.cache.get(col) || []; }

  async set(col, id, data) { if (!this.db) return false; try { await this.db.doc(`${col}/${id}`).set(data); return true; } catch (e) { console.warn('QAIS: a write was refused', e?.code); return false; } }
  async update(col, id, patch) { if (!this.db) return false; try { await this.db.doc(`${col}/${id}`).update(patch); return true; } catch (e) { console.warn('QAIS: a write was refused', e?.code); return false; } }

  /** A picture or a file into the build's assets: { id, url }, or null where there are none (a reader's view, the dev server). */
  async upload(blob, type) {
    if (!this.assets) return null;
    try { const r = await this.assets.upload(blob, { type }); return { id: r.id, url: r.url }; } catch (e) { console.warn('QAIS: an upload was refused', e?.code); return null; }
  }

  /** Who is testing: the viewer's opaque id and name (stored as the id; the name only for the brigade's prompt). */
  async me() {
    try { const v = await this.user?.me?.(); return v ? { id: v.id, name: v.name || '' } : { id: null, name: '' }; } catch { return { id: null, name: '' }; }
  }

  /** A connector's tool, called as the viewer (consent asked on first use). Resolves the payload; rejects with { code }. */
  async call(server, tool, input) {
    if (!this.mcp) throw { code: 'not_granted' };
    const r = await this.mcp.callTool(server, tool, input);
    return r?.payload ?? r;
  }
}

/** The store, once the viewer has answered (or at once with nothing, away from the published build). */
export async function openStore() {
  if (!window.claude?.use) return new Store({});
  const [db, assets, user, mcp] = await Promise.all(['db', 'assets', 'user', 'mcp'].map(use));
  return new Store({ db, assets, user, mcp });
}
