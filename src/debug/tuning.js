// ---------------------------------------------------------------------------------------
// THE TUNING PANEL (Tab): every number in core/config.js on a slider, live. Laid out for a person rather than by the config's own
// groups (the owner, 2026-10-05: "make it more user-friendly"): the player's SETTINGS first, then Feel, Combat, World, Look, Sound and Developer,
// each holding its config groups; a find box that shows only the knobs whose name holds the words typed; labels in words, not
// camelCase; and every knob away from its default marked, counted on its section and in the panel's title, listed in a TUNED section
// at the top with a reset each. A tuned game must never be mistaken for a bug (debug/tuned.js says it to the log and to QAIS too).
//
// Prior art: Chrome's flags page and Firefox's about:config (a search box over hundreds of switches, the changed ones marked and
// listed, "Reset" beside each), Unreal's console variables shown as changed from default, and every game's options menu putting the
// player's own preferences (sensitivity, resolution, volume) apart from the developer's knobs. The look, the visual group's split and the
// per-knob undo are Calissa's (2026-10-05).
//
//   buildTuningPanel(onChange(group, key), actions) -> the lil-gui (main.js shows and hides it on Tab)
// ---------------------------------------------------------------------------------------
import GUI from 'lil-gui';
import { T, DEFAULTS, saveTuning, resetTuning } from '../core/config.js';
import { SETTINGS, tuned, differs } from './tuned.js';

/** The developer's knobs, apart from the art's (Calissa): Petra's budgets (one sun shadow, the eight lights) and a diagnostic view (the
 *  house rule is smooth shading, so no one lands on faceted by accident). */
const DEVELOPER = ['visual.shadowRes', 'visual.lightSlots', 'visual.smooth'];

// settings that are one of a few words
const CHOICES = { mode: ['release', 'press'], resolution: ['ps2', '540', '720', 'native'], upscale: ['bilinear', 'pixel'] };
// slider ranges; anything not listed gets an automatic range around its default
const RANGES = {
  'movement.maxSlope': [10, 70, 1],
  'movement.dashCharges': [0, 5, 1],
  'camera.sensitivity': [0.1, 4, 0.01],
  'camera.adsSensMult': [0.1, 1.5, 0.01],
  'weapon.fireInterval': [0.03, 0.6, 0.005],
  'weapon.gunScale': [0.3, 1.2, 0.01],
  'weapon.adsHeight': [-0.05, 0.05, 0.001],
  'recoil.permanent': [0, 1, 0.01],
  'recoil.adsMult': [0, 1.5, 0.01],
  'shatter.maxChunk': [1, 8, 1],
  'shatter.maxShards': [50, 2000, 10],
  'visual.outline': [0, 0.03, 0.0005],
  'shells.start': [0, 20, 1],
  'shells.max': [1, 30, 1],
  'shells.refill': [0, 10, 1],
  'shells.slicer.width': [1, 10, 0.1],
  'shells.slicer.speed': [10, 120, 1],
  'shells.well.compressPer': [1, 20, 1],
  'shells.well.compressMax': [0, 30, 1],
  'shells.well.compressDrops': [0, 30, 1],
  'shells.ricochet.bounces': [0, 12, 1],
  'shells.homing.maxLocks': [1, 16, 1],
  'charge.pierce': [0, 20, 1],
  'lachryma.clapperDrop': [0, 20, 1],
  'lachryma.markedDrop': [0, 10, 1],
  'clappers.count': [0, 12, 1],
  'clappers.upstairs': [0, 8, 1],
  'visual.fog': [0, 0.06, 0.001],
  'visual.shadowRes': [256, 2048, 256],
  'visual.lightSlots': [2, 16, 1],
  'visual.toon': [0, 1, 0.05],
  'visual.glow': [0, 1.5, 0.05],
  'visual.grade': [0, 1, 0.05],
  'visual.warp': [0, 1, 0.05],
  'audio.volume': [0, 1.5, 0.01],
};

/** The sections, in the order a person looks for them, each holding config groups (a group not named here falls into the last). */
const SECTIONS = [
  ['Feel', ['movement', 'camera', 'physics', 'anim', 'arts', 'tech']],
  ['Combat', ['weapon', 'recoil', 'charge', 'shells', 'tracer', 'explosion', 'shatter']],
  ['World', ['lachryma', 'zoi', 'clappers', 'trial', 'god']],
  ['Look', ['visual']],
  ['Sound', ['audio']],
];
/** The settings' own words (the player's preferences: never a warning, debug/tuned.js). */
const SETTING_LABEL = {
  'camera.sensitivity': 'mouse sensitivity', 'camera.adsSensMult': 'aiming sensitivity', 'visual.resolution': 'resolution',
  'visual.upscale': 'upscale', 'visual.shadows': 'shadows', 'audio.volume': 'volume', 'charge.mode': 'a charge fires on',
  'visual.warp': 'storm warp', // (a placeholder for Espada's word)
};
/** Words for the config's camelCase: "maxSlope" -> "max slope", "fpAdsFov" -> "fp ads fov". */
export const words = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase();

// the look (Calissa, 2026-10-05): plain lil-gui in the house colours (they follow the window colour the player picks, ui/theme.js); one
// accent only, mirth's canon gold, and it means "tuned" and nothing else (not red: red reads as an error, and a tuned knob is not a bug)
const GOLD = '#f2c84a';
const CSS = `
.lil-gui.ff-tuning, .lil-gui.ff-tuning .lil-gui { --background-color: rgba(var(--jbot), .94); --widget-color: rgba(0,0,0,.35); --text-color: #fff1dc;
  --title-background-color: rgb(var(--jtop)); --font-family: var(--f-ui); --number-color: #fff1dc; --focus-color: ${GOLD}; }
.lil-gui .ff-tuned > .name { color: ${GOLD}; }
.lil-gui .ff-tuned > .name::before { content: '\\25CF  '; color: ${GOLD}; }
.lil-gui .ff-tuned > .widget { outline: 1px solid ${GOLD}; outline-offset: -1px; border-radius: 2px; }
.lil-gui .ff-undo { all: unset; display: none; flex: 0 0 auto; width: auto; margin-left: 4px; padding: 0 5px; border: 1px solid ${GOLD};
  color: ${GOLD}; border-radius: 3px; cursor: pointer; line-height: 1.4; }
.lil-gui .ff-tuned > .ff-undo { display: inline-block; }
.lil-gui .ff-pill { margin-left: 6px; padding: 0 6px; border-radius: 8px; color: ${GOLD}; background: rgba(242,200,74,.16); font-size: .9em; }
.lil-gui .ff-quiet button { background: none !important; border: 1px solid rgba(255,241,220,.45); }
.lil-gui .ff-hidden { display: none !important; }
`;
const get = (o, path) => path.reduce((a, k) => a?.[k], o);

export function buildTuningPanel(onChange, actions) {
  if (!document.getElementById('ff-tuning-css')) { const st = document.createElement('style'); st.id = 'ff-tuning-css'; st.textContent = CSS; document.head.appendChild(st); }
  const gui = new GUI({ title: 'Tuning (Tab)', width: 320 });
  gui.domElement.style.zIndex = 20;
  gui.domElement.classList.add('ff-tuning');
  const all = []; // { c, key, group, label, folders: [folder...] } for every knob
  const folders = []; // { f, base, keys: Set } for the counts on the sections and groups

  // ---- the top: find, what is tuned, and the actions
  const find = { words: '' };
  const findC = gui.add(find, 'words').name('find');
  findC.domElement.classList.add('ff-find');
  findC.onChange(() => filter());
  const input = findC.domElement.querySelector('input');
  input?.addEventListener('keydown', (e) => { if (e.code === 'Escape') { find.words = ''; findC.updateDisplay(); filter(); input.blur(); } });
  const tunedF = gui.addFolder('Tuned');
  const act = gui.addFolder('Actions');
  act.add({ reset: () => { resetTuning(); refreshAll(); onChange('*', '*'); } }, 'reset').name('Restore defaults (all)').domElement.classList.add('ff-quiet'); // (destructive: kept quiet, Calissa)
  act.add(actions, 'copyJSON').name('Copy settings JSON');
  act.add(actions, 'resetRoom').name('Set the room again');
  // (what R and H used to do in the basement: moved here to free the keys)
  if (actions.respawn) act.add(actions, 'respawn').name('Back to the last checkpoint');
  if (actions.toHub) act.add(actions, 'toHub').name('Teleport to the hub');
  act.close();

  // ---- one knob
  const knob = (folder, obj, path, group, label, parents) => {
    const key = path.join('.'), leaf = path[path.length - 1], v = get(DEFAULTS, path);
    let c;
    if (typeof v === 'string') c = folder.add(obj, leaf, CHOICES[leaf]);
    else if (typeof v === 'boolean') c = folder.add(obj, leaf);
    else {
      const r = RANGES[key];
      const max = v === 0 ? 1 : Math.abs(v) * 3;
      const step = Number.isInteger(v) && v >= 1 ? (v > 50 ? 1 : 0.1) : max / 300;
      c = r ? folder.add(obj, leaf, r[0], r[1], r[2]) : folder.add(obj, leaf, v < 0 ? -max : 0, max, step);
    }
    c.name(label);
    c.onChange(() => { saveTuning(); onChange(group, leaf); refresh(); });
    // (a small undo beside a tuned knob: back to its default, this knob alone; shown only while it is tuned)
    const undo = document.createElement('button'); undo.className = 'ff-undo'; undo.textContent = '\u21BA'; undo.title = 'back to the default';
    undo.addEventListener('click', (e) => { e.stopPropagation(); obj[leaf] = structuredClone(v); c.updateDisplay(); saveTuning(); onChange(group, leaf); refresh(); });
    c.domElement.appendChild(undo);
    all.push({ c, key, group, label, hay: `${label} ${key}`.toLowerCase(), parents });
    for (const p of parents) p.keys.add(key);
  };
  const folderOf = (parent, title) => { const f = parent.addFolder(title); f.close(); const rec = { f, base: title, keys: new Set() }; folders.push(rec); return rec; };

  // ---- the player's settings, flat
  const settings = folderOf(gui, 'Settings');
  for (const key of SETTINGS) {
    const path = key.split('.'), obj = get(T, path.slice(0, -1));
    if (obj && path[path.length - 1] in obj) knob(settings.f, obj, path, path[0], SETTING_LABEL[key] || words(path[path.length - 1]), [settings]);
  }
  // ---- the sections, each holding its groups, and within them the config's own nesting
  const placed = new Set(SECTIONS.flatMap(([, gs]) => gs));
  const rest = Object.keys(T).filter((g) => !placed.has(g));
  const sections = SECTIONS.map(([name, gs]) => [name, gs.filter((g) => g in T)]);
  if (rest.length) sections.push(['Other', rest]);
  const DEV = new Set(DEVELOPER);
  for (const [name, groups] of sections) {
    const sec = folderOf(gui, name);
    for (const group of groups) {
      const gf = folderOf(sec.f, words(group));
      const walk = (folder, obj, defs, path, parents) => {
        for (const k of Object.keys(obj)) {
          const p = [...path, k], key = p.join('.');
          if (SETTINGS.has(key) || DEV.has(key)) continue; // (it lives under Settings, or Developer)
          if (defs?.[k] && typeof defs[k] === 'object') { const sub = folderOf(folder, words(k)); walk(sub.f, obj[k], defs[k], p, [...parents, sub]); continue; }
          if (!(k in (defs || {}))) continue;
          knob(folder, obj, p, group, words(k), parents);
        }
      };
      walk(gf.f, T[group], DEFAULTS[group], [group], [sec, gf]);
    }
  }

  // ---- the developer's knobs, flat, last
  const dev = folderOf(gui, 'Developer');
  for (const key of DEVELOPER) {
    const path = key.split('.'), obj = get(T, path.slice(0, -1));
    if (obj && path[path.length - 1] in obj) knob(dev.f, obj, path, path[0], words(path[path.length - 1]), [dev]);
  }

  // ---- what is tuned: marked, counted, listed
  function refreshTuned() {
    for (const c of [...tunedF.controllers]) c.destroy();
    const { knobs } = tuned();
    for (const k of knobs) {
      const rec = all.find((x) => x.key === k.key), path = k.key.split('.');
      const reset = () => { const o = get(T, path.slice(0, -1)); o[path[path.length - 1]] = structuredClone(k.was); saveTuning(); onChange(path[0], path[path.length - 1]); refreshAll(); };
      tunedF.add({ reset }, 'reset').name(`reset ${rec?.label || k.key} (${fmt(k.now)}, default ${fmt(k.was)})`);
    }
    pill(tunedF, 'Tuned', knobs.length, 'none: the stock game');
    if (knobs.length) tunedF.open(); else tunedF.close();
    pill(gui, 'Tuning (Tab)', knobs.length);
  }
  // a folder's title with its count as a gold pill (Calissa); lil-gui's title() writes text, so the pill is set on its button after
  function pill(f, base, n, none = '') {
    f.title(base);
    const t = f.domElement.querySelector(':scope > .title');
    if (!t) return;
    if (n) { const s = document.createElement('span'); s.className = 'ff-pill'; s.textContent = `${n} tuned`; t.appendChild(s); }
    else if (none) { const s = document.createElement('span'); s.className = 'ff-pill'; s.style.opacity = '.6'; s.textContent = none; t.appendChild(s); }
  }
  function refresh() {
    let n = 0;
    for (const r of all) { const t = differs(r.key); r.c.domElement.classList.toggle('ff-tuned', t); r.tuned = t; }
    for (const rec of folders) { n = [...rec.keys].filter((k) => !SETTINGS.has(k) && differs(k)).length; pill(rec.f, rec.base, n); }
    refreshTuned();
  }
  function refreshAll() { gui.controllersRecursive().forEach((c) => c.updateDisplay()); refresh(); }
  function filter() {
    const q = find.words.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = new Set();
    for (const r of all) {
      const ok = !q.length || q.every((w) => r.hay.includes(w));
      r.c.domElement.classList.toggle('ff-hidden', !ok);
      if (ok) for (const p of r.parents) shown.add(p);
    }
    for (const rec of folders) {
      rec.f.domElement.classList.toggle('ff-hidden', q.length > 0 && !shown.has(rec));
      if (q.length) { if (shown.has(rec)) rec.f.open(); } else rec.f.close();
    }
  }

  refresh();
  gui.hide();
  return gui;
}

const fmt = (v) => (typeof v === 'number' ? String(+v.toFixed(4)) : String(v));
