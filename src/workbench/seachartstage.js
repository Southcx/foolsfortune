// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S SEA CHART STAGE ('crossing:chart', in the group "the crossing"): the sea chart's look (ui/seachart/seachart.js) on
// three boards, the same sea read at three confidences (the pier with no reckoning; a good reckoning; a good one at a high Divination
// level), the passage drafted lane by lane and begun again (the day's best beside it on the third, a stretch adrift on the second),
// and the rutter's model (vfx/rutter.js) shut and open in front of them.
// The sea is a sample laid by hand to Dovina's rules (progress/econ/passage.js: four lanes that merge and never cross, every type of the
// pool, a squall, the middle column's encounter), so that every tier and class shows at once; its portents are her own `portent()` and
// the draught's trump her own `draughtTrump()` (progress/rail/trip.js), so the stage follows them when they change.
//
// Prior art: the workbench's other stages (workbench/stages.js): a look staged on a loop with the game's own modules.
//
//   seaChartStage() -> Object3D (its loop on userData.tick(t), its freeing on userData.dispose)   SAMPLE_CHART
//   samplePortents(chart, sight, level?) -> { id: portent }   sampleTrump(chart) -> (a, b) => 'trumps' | 'trumped' | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { drawSeaChart, CHART_SIZE } from '../ui/seachart/seachart.js';
import { Rutter } from '../vfx/rutter.js';
import { portent, classOf } from '../progress/econ/passage.js';
import { draughtTrump } from '../progress/rail/trip.js';

const WP = (id, type, feel, strength, storm = false) => { const [col, row] = id.split(':').map(Number); return [id, { id, col, row, type, feel, strength, storm }]; };
/** King to Queen (Margarite to Entropolis, six columns of five rows): every type, a squall, the middle column's encounter. */
export const SAMPLE_CHART = {
  route: 'entra-margarite', from: 'margarite', to: 'entra', day: 3, columns: 6, rows: 5,
  waypoints: Object.fromEntries([
    WP('0:1', 'shoal', 'mirth', 1), WP('0:3', 'graveyard', 'mirth', 1),
    WP('1:0', 'wreckers', 'mirth', 2), WP('1:1', 'calm', 'wonder', 1), WP('1:3', 'shoal', 'wonder', 1), WP('1:4', 'eyewall', 'mirth', 2),
    WP('2:0', 'graveyard', 'wonder', 2), WP('2:2', 'encounter', 'desire', 2), WP('2:4', 'bounty', 'desire', 3),
    WP('3:1', 'eyewall', 'desire', 3, true), WP('3:2', 'maelstrom', 'grief', 3), WP('3:3', 'wreckers', 'desire', 3), WP('3:4', 'calm', 'grief', 2),
    WP('4:1', 'shoal', 'grief', 3), WP('4:2', 'graveyard', 'grief', 3), WP('4:3', 'eyewall', 'dread', 4, true), WP('4:4', 'shoal', null, 3),
    WP('5:0', 'leviathan', 'dread', 4), WP('5:1', 'wreckers', 'dread', 4), WP('5:3', 'shoal', 'dread', 4),
  ]),
  edges: [
    ['0:1', '1:0'], ['0:1', '1:1'], ['0:3', '1:3'], ['0:3', '1:4'],
    ['1:0', '2:0'], ['1:1', '2:2'], ['1:3', '2:2'], ['1:4', '2:4'],
    ['2:0', '3:1'], ['2:2', '3:2'], ['2:2', '3:3'], ['2:4', '3:4'],
    ['3:1', '4:1'], ['3:2', '4:2'], ['3:3', '4:3'], ['3:4', '4:4'],
    ['4:1', '5:0'], ['4:2', '5:1'], ['4:3', '5:3'], ['4:4', '5:3'],
  ],
  first: ['0:1', '0:3'], last: ['5:0', '5:1', '5:3'],
};
const PASSAGE = ['0:3', '1:3', '2:2', '3:3', '4:3', '5:3']; // (through the encounter and the squall)
const GHOST = ['0:1', '1:1', '2:2', '3:2', '4:2', '5:1']; // (the day's best, a sample: through the calm and the maelstrom)

// ---- the portents and the draught's trump: Dovina's own
/** Every waypoint's portent seen from the pier (depth = its column + 1) at a sight (passage.js `sight()`) and Divination level. */
export function samplePortents(chart, sight, level = 1) {
  const out = {};
  for (const w of Object.values(chart.waypoints)) out[w.id] = portent(chart, w, w.col + 1, sight, level);
  return out;
}
/** The draught's trump between two waypoints' feelings. */
export const sampleTrump = (chart) => (a, b) => draughtTrump(chart.waypoints[a]?.feel, chart.waypoints[b]?.feel);

/** The stage: three boards (no reckoning, a good one, a good one at Divination 99), the passage drafted and begun again, the rutter. */
export function seaChartStage() {
  const obj = new THREE.Group(), chart = SAMPLE_CHART, trumpOf = sampleTrump(chart);
  const reads = [{ sight: 0.35, level: 1 }, { sight: 1.0, level: 1 }, { sight: 1.62, level: 99 }];
  const boards = reads.map((rd, i) => {
    const canvas = document.createElement('canvas'), tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 8;
    const w = 1.6, h = (w * CHART_SIZE.h) / CHART_SIZE.w, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.set((i - 1) * 1.7, 1.35, 0); m.rotation.y = (1 - i) * 0.12; obj.add(m);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8 }));
    frame.position.copy(m.position).add(new THREE.Vector3(0, 0, -0.02)); frame.rotation.copy(m.rotation); obj.add(frame);
    return { canvas, tex, portents: samplePortents(chart, rd.sight, rd.level) };
  });
  // the rutter: the passage sailed, shut (its tooled board) and open (its spread), five times its size so it reads beside the boards
  const rutter = { from: chart.from, to: chart.to, day: chart.day, passage: PASSAGE, legs: PASSAGE.map((id) => chart.waypoints[id].type), rank: 'A', read: 0.8 };
  const shut = new Rutter({ rutter, chart, portents: boards[1].portents }), open = new Rutter({ rutter, chart, portents: boards[1].portents });
  shut.group.scale.setScalar(5); shut.group.position.set(-0.8, 0.02, 0.9); shut.group.rotation.y = 0.35; obj.add(shut.group);
  open.group.scale.setScalar(5); open.group.position.set(0.95, 0.02, 0.85); open.group.rotation.y = -0.1; obj.add(open.group); open.open(1);
  let last = -1;
  obj.userData.tick = (t) => {
    const k = Math.floor(t * 15); if (k === last) return; last = k; // (redrawn at 15 a second: the motes and candidates move slowly)
    const step = 1.1, cycle = PASSAGE.length * step + 3, u = t % cycle, n = Math.min(PASSAGE.length, Math.floor(u / step) + 1), drafted = PASSAGE.slice(0, n);
    const since = {}, path = ['from', ...drafted, ...(n === PASSAGE.length ? ['to'] : [])];
    for (let i = 1; i < path.length; i++) since[`${path[i - 1]}>${path[i]}`] = u - (Math.min(i, n) - 1) * step; // (the lane to a waypoint is drafted when it is; the last to the island with the last)
    const hover = n < PASSAGE.length ? PASSAGE[n] : null;
    boards.forEach((b, i) => { drawSeaChart(b.canvas, chart, { scale: 2, t, portents: b.portents, classOf, drafted, since, hover: i === 2 ? hover : null, trumpOf, at: i === 2 ? drafted[Math.max(0, n - 2)] : null, ghost: i === 2 ? GHOST : null, drift: i === 1 ? [['1:3', '2:2']] : null }); b.tex.needsUpdate = true; });
    const o = t % 14, ease = (x) => x * x * (3 - 2 * x); // (shut for a breath, opened over two seconds, lying open, shut again)
    open.open(o < 1.5 ? 0 : o < 3.5 ? ease((o - 1.5) / 2) : o < 12 ? 1 : 1 - ease((o - 12) / 2));
  };
  obj.userData.dispose = () => { // (the workbench calls it when the stage is dropped: the boards' meshes and textures, and both rutters)
    shut.dispose(); open.dispose(); for (const b of boards) b.tex.dispose();
    obj.traverse((o) => { o.geometry?.dispose(); for (const m of [o.material, o.userData.mat0].flat()) m?.dispose?.(); }); // (userData.mat0: what the workbench's view modes put aside)
  };
  return obj;
}
