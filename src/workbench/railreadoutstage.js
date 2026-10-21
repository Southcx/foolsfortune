// ---------------------------------------------------------------------------------------
// THE RAIL READOUT AND THE RESULTS WINDOW ON THE WORKBENCH (`crossing:readout`, the group 'the crossing' on the MODELS tab): the rail
// readout (ui/railreadout.js) and the results window (ui/railresults.js) driven by made-up data on a 30 real-second loop, so their look
// can be judged before Petra's run feeds them:
//   0 .. 20 s   a leg sailed: the score climbing, downs of one feeling filling the chain's pips and raising its level, another feeling
//               slipped into a three (a break), a hit (a break and a hull pip spent), the surge filling to full, the medal's mark
//               passed and turning gold
//   20 .. 30 s  the results window summoned over it: three legs counted up on the sixteenth, the tally, the ceremony, the trip's rank
//               and medal; closed at the loop's end
// A slab of the crude's mid value under the view, so the windows are judged over what they sit on at sea.
//
// Prior art: the workbench's other stages (workbench/railfoestage.js's demo loop), an arcade's attract mode playing its own HUD.
//
//   railReadoutStage(game) -> Object3D (userData.tick(t), .dispose())
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RailReadout } from '../ui/railreadout.js';
import { RailResults } from '../ui/railresults.js';

const LOOP = 30, LEG = 20, MEDAL_AT = 70, BEARS = 6;
const FEELINGS = ['wonder', 'wonder', 'wonder', 'fury', 'fury', 'fury', 'grief', 'grief', 'grief', 'mirth', 'mirth', 'mirth'];

/** The made-up trip the results window counts (the shapes Petra passes: RAIL-STANDARDS.md 6). */
export const DEMO_TRIP = {
  legs: [
    { type: 'shoal', score: 84210, par: 103400, rank: 'A', downs: 702, medalAt: 660, medal: true, hits: 1, bestChain: 6, parts: 2 },
    { type: 'wreckers', score: 31400, par: 37100, rank: 'A', downs: 188, medalAt: 210, medal: false, hits: 2, bestChain: 4, parts: 5 },
    { type: 'leviathan', score: 66950, par: 60200, rank: 'S', downs: 96, medalAt: 90, medal: true, hits: 0, bestChain: 8, parts: 4 },
  ],
  tally: { bears: 3, per: 1000, total: 3000 },
  trip: { score: 185560, rank: 'A', medal: false },
};

/** The leg at `k` real seconds into the loop: what the readout is told (a down every 0.2 s; a break at 7 s, a hit at 12 s). */
export function demoRun(k) {
  const downs = Math.floor(k / 0.2), chain = { aspect: null, of: 0, level: 0 };
  let score = 0, hits = 0;
  for (let i = 0; i < downs; i++) {
    const at = i * 0.2;
    if (Math.abs(at - 12) < 0.1) { hits = 1; chain.of = 0; chain.level = 0; chain.aspect = null; }
    let a = FEELINGS[i % FEELINGS.length];
    if (Math.abs(at - 7) < 0.1) a = 'dread'; // (another feeling inside a three: the chain is broken)
    if (chain.of === 0 || a === chain.aspect) { chain.aspect = a; chain.of++; } else { chain.aspect = a; chain.of = 1; chain.level = 0; }
    if (chain.of >= 3) { chain.of = 0; chain.level = Math.min(8, chain.level + 1); }
    score += Math.round(300 * (1 + chain.level * 0.25));
  }
  return { score, chain, surge: Math.min(100, k * 7), hits, bears: BEARS, downs, medalAt: MEDAL_AT };
}

export function railReadoutStage(game) {
  const obj = new THREE.Group();
  obj.userData.placed = true;
  obj.userData.view = { pos: new THREE.Vector3(0, 6, -12), look: new THREE.Vector3(0, 0, 0) };
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3440, roughness: 0.6 }));
  slab.position.y = -1; obj.add(slab);
  const readout = new RailReadout(game), results = new RailResults(game);
  let loop = -1, opened = false, lastLevel = 0;
  obj.userData.tick = (t) => {
    const n = Math.floor(t / LOOP), k = t % LOOP;
    if (n !== loop) { loop = n; opened = false; results.close(true); readout.show(true); lastLevel = 0; }
    if (k < LEG) {
      const r = demoRun(k);
      if (r.chain.level === 0 && lastLevel > 0) readout.chainBreak();
      lastLevel = r.chain.level;
      readout.set(r);
    } else if (!opened) { opened = true; results.open(DEMO_TRIP); }
  };
  obj.userData.readout = readout; obj.userData.results = results;
  obj.userData.dispose = () => { results.close(true); readout.destroy(); slab.geometry.dispose(); slab.material.dispose(); };
  return obj;
}
