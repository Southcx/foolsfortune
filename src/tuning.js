import GUI from 'lil-gui';
import { T, DEFAULTS, saveTuning, resetTuning } from './config.js';

// Slider ranges for the live tuning panel (Tab). Anything not listed gets an
// automatic range around its default.
const RANGES = {
  'movement.maxSlope': [10, 70, 1],
  'camera.sensitivity': [0.1, 4, 0.01],
  'camera.adsSensMult': [0.1, 1.5, 0.01],
  'weapon.magSize': [1, 30, 1],
  'weapon.fireInterval': [0.03, 0.6, 0.005],
  'weapon.gunScale': [0.3, 1.2, 0.01],
  'weapon.adsHeight': [-0.05, 0.05, 0.001],
  'recoil.permanent': [0, 1, 0.01],
  'recoil.adsMult': [0, 1.5, 0.01],
  'shatter.maxChunk': [1, 8, 1],
  'shatter.maxShards': [50, 2000, 10],
  'visual.outline': [0, 0.03, 0.0005],
  'visual.fog': [0, 0.06, 0.001],
  'audio.volume': [0, 1.5, 0.01],
};

export function buildTuningPanel(onChange, actions) {
  const gui = new GUI({ title: 'Tuning (Tab)', width: 300 });
  gui.domElement.style.zIndex = 20;
  for (const group of Object.keys(T)) {
    const f = gui.addFolder(group);
    f.close();
    for (const key of Object.keys(T[group])) {
      const v = DEFAULTS[group][key];
      let c;
      if (typeof v === 'boolean') c = f.add(T[group], key);
      else {
        const r = RANGES[`${group}.${key}`];
        const max = v === 0 ? 1 : Math.abs(v) * 3;
        const step = Number.isInteger(v) && v >= 1 ? (v > 50 ? 1 : 0.1) : max / 300;
        c = r ? f.add(T[group], key, r[0], r[1], r[2]) : f.add(T[group], key, v < 0 ? -max : 0, max, step);
      }
      c.onChange(() => { saveTuning(); onChange(group, key); });
    }
  }
  const act = gui.addFolder('actions');
  act.add(actions, 'copyJSON').name('Copy settings JSON');
  act.add(actions, 'resetRoom').name('Reset room (T)');
  act.add({ reset: () => { resetTuning(); gui.controllersRecursive().forEach((c) => c.updateDisplay()); onChange('*', '*'); } }, 'reset').name('Restore defaults');
  gui.hide();
  return gui;
}
