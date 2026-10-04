import GUI from 'lil-gui';
import { T, DEFAULTS, saveTuning, resetTuning } from '../core/config.js';

// Slider ranges for the live tuning panel (Tab). Anything not listed gets an
// automatic range around its default.
// settings that are one of a few words
const CHOICES = { mode: ['release', 'press'], resolution: ['ps2', '540', '720', 'native'], upscale: ['bilinear', 'pixel'] };
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
  'audio.volume': [0, 1.5, 0.01],
};

export function buildTuningPanel(onChange, actions) {
  const gui = new GUI({ title: 'Tuning (Tab)', width: 300 });
  gui.domElement.style.zIndex = 20;
  for (const group of Object.keys(T)) {
    const f = gui.addFolder(group);
    f.close();
    const addKeys = (folder, obj, defs, prefix) => {
    for (const key of Object.keys(obj)) {
      const v = defs[key];
      let c;
      if (typeof v === 'object') { const sub = folder.addFolder(key); sub.close(); addKeys(sub, obj[key], v, `${prefix}.${key}`); continue; }
      if (typeof v === 'string') { c = folder.add(obj, key, CHOICES[key]); c.onChange(() => { saveTuning(); onChange(group, key); }); continue; }
      if (typeof v === 'boolean') c = folder.add(obj, key);
      else {
        const r = RANGES[`${prefix}.${key}`];
        const max = v === 0 ? 1 : Math.abs(v) * 3;
        const step = Number.isInteger(v) && v >= 1 ? (v > 50 ? 1 : 0.1) : max / 300;
        c = r ? folder.add(obj, key, r[0], r[1], r[2]) : folder.add(obj, key, v < 0 ? -max : 0, max, step);
      }
      c.onChange(() => { saveTuning(); onChange(group, key); });
    }
    };
    addKeys(f, T[group], DEFAULTS[group], group);
  }
  const act = gui.addFolder('actions');
  act.add(actions, 'copyJSON').name('Copy settings JSON');
  act.add(actions, 'resetRoom').name('Set the room again');
  // (what R and H used to do in the basement: moved here to free the keys)
  if (actions.respawn) act.add(actions, 'respawn').name('Back to the last checkpoint');
  if (actions.toHub) act.add(actions, 'toHub').name('Teleport to the hub');
  act.add({ reset: () => { resetTuning(); gui.controllersRecursive().forEach((c) => c.updateDisplay()); onChange('*', '*'); } }, 'reset').name('Restore defaults');
  gui.hide();
  return gui;
}
