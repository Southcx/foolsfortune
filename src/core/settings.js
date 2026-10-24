// ---------------------------------------------------------------------------------------
// THE SETTINGS (docs/plans/MOBILE.md 9, M1; the labels and lines Espada's, 2026-10-24): the player's own preferences as rows a window can
// draw (the settings window: Calissa's dress) and set. Each row is one setting of core/config.js's T (debug/tuned.js SETTINGS: a
// preference, never a knob under test), with its label, its one line, its kind (a slider, a choice, a switch, an action) and its range.
// Setting one writes T, keeps it as the tuning panel does (core/config.js `saveTuning`), tells the game what changed the way a knob moved
// on the panel does (main.js `game.knobChanged`: the graphics tier set, the volume applied) and says so on the bus. What a setting does
// is read where it bites, as ever: the look (courier/player.js), the camera's follow on touch (courier/camfollow.js), render/graphics.js,
// the sound (audio/core.js), the haptics (audio/haptics.js), the screen's shake (config.js shakeOf).
//
// Prior art: every console game's options page (a few rows, each a label, a line and its control; Celeste's and Hades' among the
// plainest), Unreal's game user settings (the preferences apart from the tuning), Apple's settings rows (a label and a footnote line).
//
//   game.settings = new Settings(game)   .rows   .row(id)   .get(id)   .set(id, value)   .run(id)   .available(id)   SETTING_ROWS
//   Events: setting.change { id, value, by }
// ---------------------------------------------------------------------------------------
import { T, saveTuning } from './config.js';

/** The rows, in the window's order. `path` is the setting in T; a slider has min, max and step; a choice its [value, label] pairs and
 *  a line of its own where one needs it; an action runs and keeps nothing. Words marked (placeholder) are Petra's until Espada's. */
export const SETTING_ROWS = [
  { id: 'look', path: 'camera.sensitivity', kind: 'slider', min: 0.2, max: 3, step: 0.05, label: 'Look sensitivity', line: 'How far the camera turns for how far you drag.' },
  { id: 'follow', path: 'camera.follow', kind: 'slider', min: 0, max: 1, step: 0.05, label: 'Camera follow', line: 'How quickly the camera swings back behind you after you stop dragging.' },
  { id: 'graphics', path: 'visual.graphics', kind: 'choice', choices: [['auto', 'Auto'], ['high', 'High'], ['low', 'Low'], ['minimum', 'Minimum']], label: 'Graphics', line: 'Lower runs smoother and cooler; higher looks finer.', lines: { auto: 'Picked for this device.' } },
  { id: 'volume', path: 'audio.volume', kind: 'slider', min: 0, max: 1.5, step: 0.05, label: 'Volume', line: 'How loud the game plays, music and sound together.' },
  { id: 'haptics', path: 'audio.haptics', kind: 'switch', label: 'Haptics', line: 'Small buzzes when you hop, land, hit or are hit. Only on devices that can buzz.' },
  { id: 'shake', path: 'visual.shake', kind: 'choice', choices: [['full', 'Full'], ['half', 'Half'], ['off', 'Off']], label: 'Screen shake', line: 'How hard the view shakes at a blow or a fall.' }, // (placeholder)
  { id: 'layout', kind: 'action', label: 'Reset the touch layout', line: 'Puts every button back where it started.', confirm: 'Put every button back where it started?' },
];
const BY_ID = new Map(SETTING_ROWS.map((r) => [r.id, r]));
const split = (path) => { const k = path.split('.'); return { obj: k.slice(0, -1).reduce((o, p) => o?.[p], T), leaf: k.at(-1), group: k[0] }; };

export class Settings {
  constructor(game) { this.game = game; this.rows = SETTING_ROWS; }
  row(id) { return BY_ID.get(id) || null; }
  get(id) { const r = this.row(id); if (!r?.path) return undefined; const { obj, leaf } = split(r.path); return obj?.[leaf]; }
  /** A row set to `value` (a slider's clamped to its range and step, a choice's one of its values, a switch's true or false). */
  set(id, value) {
    const r = this.row(id); if (!r?.path) return false;
    let v = value;
    if (r.kind === 'slider') { v = Math.min(r.max, Math.max(r.min, +value || 0)); v = +(Math.round(v / r.step) * r.step).toFixed(4); }
    else if (r.kind === 'choice') { if (!r.choices.some(([c]) => c === value)) return false; }
    else if (r.kind === 'switch') v = !!value;
    const { obj, leaf, group } = split(r.path); if (!obj) return false;
    if (obj[leaf] === v) return true;
    obj[leaf] = v; saveTuning();
    this.game.knobChanged?.(group, leaf); // (applied as the panel's change: main.js)
    this.game.events?.emit('setting.change', { id, value: v, by: 'courier' });
    return true;
  }
  /** Whether an action row can run here yet (the layout's reset waits for the layout editor: MOBILE.md 9, M5). */
  available(id) { return id === 'layout' ? !!this.game.hudLayout?.resetLayout : !!this.row(id); }
  /** An action row run (its confirm is the window's to ask first). */
  run(id) {
    if (id !== 'layout' || !this.available(id)) return false;
    this.game.hudLayout.resetLayout();
    this.game.events?.emit('setting.change', { id, value: null, by: 'courier' });
    return true;
  }
}
