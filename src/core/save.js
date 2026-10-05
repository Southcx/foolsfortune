// ---------------------------------------------------------------------------------------
// THE SAVE: everything the game keeps in the browser, in one place. Each system that keeps something registers a SECTION (its id, its
// SCOPE, how to dump and load it, what a fresh one is, how to read an older version of it, and what must hold after it is loaded), and
// the save writes each scope as one record, whole (never half a save: a box and a belt written apart once disagreed, and two tools
// fell out of the world). Three scopes:
//
//   player    progress that follows the Courier: the kit (box and belt), the ledger, unlocks, the Book. Wiped on a new build.
//   world     progress that belongs to the place: the Wells' fill, the shops, what lies on the ground. Wiped on a new build.
//   settings  the player's own choices: the window colours, the voice, the music, the tuning. Kept across builds.
//
// (player and world are apart on purpose: in co-op, each player's section travels with them and the host owns the world's.)
// A key some module still writes itself is ADOPTED: declared below with its scope, so the wipe, the export and the build reset know it
// until its owner moves it into a section. Nothing new may touch localStorage outside this file (`npm run check`, rule save.storage).
// While something BORROWS the game (the overture's trailer), the save is held: nothing is written, and on release every section is
// loaded again from what was last written.
//
// Prior art: Minecraft's versioned data with fixers run in order (a section's `migrate`), the one save object of Stardew Valley and
// Factorio, the console rule that a save is written whole or not at all, and redux-persist's named slices.
//
//   const save = new Save()   save.boot(build) -> true if this build is new here (its progress wiped)
//   save.section(id, { scope, version, dump, load, reset, migrate, check })   (load runs at once with what was kept, or reset with none)
//   save.dirty(id)   save.flush({ all? })   (dirty marks; flush writes each dirty scope whole: main.js calls it once a frame)   save.writer(fn)
//   save.wipe(scope)   save.check() -> fixes made   save.hold(why) / save.release(why)   save.export() -> string   save.import(text, { replace })
//   save.stash(key, text) / save.unstash(key) (this tab only, across one reload: a replay waiting for its page)
// ---------------------------------------------------------------------------------------
const PREFIXES = ['foolsfortune.', 'ff.']; // (ff.: the workbench's own edits, Calissa's studio)
const ours = (k) => PREFIXES.some((p) => k?.startsWith(p));
const RECORD = { player: 'foolsfortune.save.player', world: 'foolsfortune.save.world', settings: 'foolsfortune.save.settings' };
const BUILD_KEY = 'foolsfortune.build';

/** Keys still written by their own modules, by scope (each owner moves its key into a section in its own round: docs/HANDOFFS.md). */
export const ADOPTED = {
  player: ['foolsfortune.system', 'foolsfortune.stats', 'foolsfortune.veritome', 'foolsfortune.map', 'foolsfortune.course', 'foolsfortune.circuits',
    'foolsfortune.trial', 'foolsfortune.flash', 'foolsfortune.vessel', 'foolsfortune.psygun',
    'foolsfortune.pneuka'], // (the box's, the belt's and the Lockheart's keys before their sections: cleared, never written again)
  world: ['foolsfortune.shops', 'foolsfortune.ground', 'foolsfortune.wells'], // (the ground's and the Wells' keys before their sections: likewise)
  settings: ['foolsfortune.windows', 'foolsfortune.voice', 'foolsfortune.music', 'foolsfortune.rhythm', 'foolsfortune.tuning', 'foolsfortune.help',
    'foolsfortune.log', 'ff.vfx.overrides', 'ff.cine.overrides'],
};
const scopeOfKey = (k) => Object.keys(ADOPTED).find((s) => ADOPTED[s].some((p) => k === p || k.startsWith(`${p}.`)));

export class Save {
  constructor(store = (() => { try { return window.localStorage; } catch { return null; } })()) {
    this.store = store;
    this.sections = new Map();
    this.records = {}; // scope -> { v, at, sections: { id: { v, data } } } as last read or written
    this.dirt = new Set();
    this.holds = new Set();
    this.writers = new Set(); // (an adopted key's owner that writes on a timer of its own: asked to write now when the save must be whole)
    for (const scope of Object.keys(RECORD)) this.records[scope] = this.read(RECORD[scope]) || { v: 1, sections: {} };
  }

  read(key) { try { return JSON.parse(this.store?.getItem(key) || 'null'); } catch { return null; } }
  write(key, value) { try { this.store?.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); return true; } catch { return false; } }

  /** At boot, before anything registers: a new build wipes the progress scopes (and the adopted keys in them). True if it did. */
  boot(build) {
    let was = null; try { was = this.store?.getItem(BUILD_KEY); } catch { /* none */ }
    if (was === build) return false;
    for (const scope of ['player', 'world']) this.wipeStored(scope);
    this.write(BUILD_KEY, build);
    return !!was; // (a first visit has nothing to clear, and is not told it was cleared)
  }

  /** A section: what one system keeps. Loaded at once from the record (migrated if it is older), or reset if there is nothing. */
  section(id, def) {
    const s = { id, version: 1, scope: 'player', ...def };
    if (!RECORD[s.scope]) throw new Error(`save: section ${id} has no scope '${s.scope}'`);
    this.sections.set(id, s);
    this.loadSection(s);
    return s;
  }
  loadSection(s) {
    const kept = this.records[s.scope].sections[s.id];
    let data = kept?.data, v = kept?.v ?? s.version;
    if (data != null && v < s.version && s.migrate) { data = s.migrate(data, v); v = s.version; }
    if (data == null || v > s.version) s.reset?.(); else s.load(data);
  }

  dirty(id) { const s = this.sections.get(id); if (s) this.dirt.add(s.scope); }
  /** An adopted key's owner that keeps changes a while before writing them (the ledger, the System): written too by flush({ all }). */
  writer(fn) { this.writers.add(fn); }
  /** Write every scope that changed, whole. Held: nothing is written (the marks wait). `all`: the adopted keys' owners write now too
   *  (an export, a replay's start: the save must be what the game is). */
  flush({ all = false } = {}) {
    if (this.holds.size) return;
    if (all) for (const w of this.writers) { try { w(); } catch { /* its own business */ } }
    if (!this.dirt.size) return;
    for (const scope of this.dirt) {
      const rec = { v: 1, at: Date.now(), sections: {} };
      for (const s of this.sections.values()) if (s.scope === scope) rec.sections[s.id] = { v: s.version, data: s.dump() };
      if (this.write(RECORD[scope], rec)) this.records[scope] = rec;
    }
    this.dirt.clear();
  }

  /** Every section of a scope fresh, and its adopted keys gone (a new build; the Codex's new game). */
  wipe(scope) {
    this.wipeStored(scope);
    for (const s of this.sections.values()) if (s.scope === scope) s.reset?.();
    this.dirt.add(scope); this.flush();
  }
  wipeStored(scope) {
    this.records[scope] = { v: 1, sections: {} };
    try { this.store?.removeItem(RECORD[scope]); } catch { /* none */ }
    if (!this.store) return;
    for (let i = this.store.length - 1; i >= 0; i--) { const k = this.store.key(i); if (k && scopeOfKey(k) === scope) this.store.removeItem(k); }
  }

  /** What must hold after loading (every tool somewhere...): each section's check; the number of things it had to mend. */
  check() { let n = 0; for (const s of this.sections.values()) if (s.check) n += s.check() || 0; return n; }

  /** Borrowed: nothing written until released; then every section is loaded again from what was last written, and checked. */
  hold(why) { this.holds.add(why); }
  release(why, { restore = true } = {}) {
    this.holds.delete(why);
    if (this.holds.size) return;
    if (restore) { for (const s of this.sections.values()) this.loadSection(s); this.dirt.clear(); this.check(); } else this.flush();
  }

  /** Everything kept, as one text (a backup, a bug report). */
  export() {
    this.flush({ all: true });
    const out = { v: 1, at: Date.now(), keys: {} };
    if (this.store) for (let i = 0; i < this.store.length; i++) { const k = this.store.key(i); if (ours(k)) out.keys[k] = this.store.getItem(k); }
    return JSON.stringify(out);
  }
  /** Put back an export (the page reloads after: every module reads what it keeps at boot). `replace`: ours that it lacks go too (a
   *  replay starts from exactly what was kept, nothing more). */
  import(text, { replace = false } = {}) {
    const inp = typeof text === 'string' ? JSON.parse(text) : text;
    if (!inp?.keys) throw new Error('save: not an export');
    if (replace && this.store) for (let i = this.store.length - 1; i >= 0; i--) { const k = this.store.key(i); if (ours(k) && !(k in inp.keys)) this.store.removeItem(k); }
    for (const [k, v] of Object.entries(inp.keys)) if (ours(k)) this.write(k, v);
  }

  /** A text kept for this tab only, across a reload and no further (a replay waiting for the page it is played on). Taken once. */
  stash(key, text) { try { sessionStorage.setItem(`foolsfortune.${key}`, text); return true; } catch { return false; } }
  unstash(key) { try { const k = `foolsfortune.${key}`, t = sessionStorage.getItem(k); sessionStorage.removeItem(k); return t; } catch { return null; } }
}
