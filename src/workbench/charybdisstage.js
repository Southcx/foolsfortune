// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S STAGE 'crossing:charybdis' (the group 'the crossing' on the MODELS tab): the maelstrom's whirlpool (vfx/whirlpool.js)
// and Charybdis (vfx/charybdis.js) on a patch of the crude sea under the storm's light, by the game's own modules, on a 24 real-second
// loop, so the look is judged as the rail will show it:
//
//   0 .. 6    it rises out of the whirlpool (the crown of crude thrown off its lip, the whirlpool spitting round its sheath), its baleen's
//             windup rippling round the lip; the parts intact
//   6 .. 12   it dives (the sea pouring in after it over the lip, the whirlpool deep and fast); the eyes' windup; the throat swells
//   12 .. 18  it rises again; every part damaged
//   18 .. 24  it dives again; every part broken
// Each loop wears the next feeling (wonder, mirth, desire, grief, dread: the display order), and a blow lands twice a second (the
// line and glow's pulse). Its camera (`userData.cam`): 'rail' circling at the arena's radius just over the crude (the default),
// 'above' looking down the whirlpool, 'low' just over the rim, 'below' under the surface (the Umbral: the meniscus wound into the
// whirlpool's underside and the beast hanging in the deep), 'close' at its eyes. The storm at 0.4; the stage keeps its own fog and sky
// (`userData.placed`, `userData.bare`) and puts everything back on `userData.dispose`.
//
// Prior art: the workbench's other crossing stages (workbench/crossingstages.js: the dome, the sea, the Umbral, a camera of its own;
// workbench/bossstage.js: every boss part cycled through its states on a loop), a fighting game's training mode.
//
//   charybdisStage(game) -> Object3D   (userData.tick(t), userData.shot(camera), userData.cam, userData.looks { charybdis, whirl, sea })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from '../vfx/crudesea.js';
import { CharybdisLook } from '../vfx/charybdis.js';
import { Umbral } from '../vfx/umbral.js';
import { warpObject } from '../vfx/stormwarp.js';
import { mindTick } from '../vfx/labradorite.js';
import { COLOR, DISPLAY_ORDER } from '../progress/weather.js';

const LOOP = 24, TURN = 6, RISE = 7, DEPTH = -6, SWING = 0.75, RADIUS = 44.7; // (real seconds; m; the director's own numbers: world/emocean/charybdis.js)
const STATES = ['intact', 'intact', 'damaged', 'broken'];

export function charybdisStage(game) {
  const wb = game.workbench, S = wb?.scene; if (!S) return null;
  const env = game.sky?.env || null;
  const root = new THREE.Group(); root.name = 'stage:crossing:charybdis'; root.userData.placed = true; root.userData.bare = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(330, 32, 16), game.sky.domeMaterial(new THREE.Vector3(-0.55, 0.3, -0.78)));
  dome.frustumCulled = false; dome.renderOrder = -10; root.add(dome);
  const sea = new CrudeSea({ env, size: 300, cells: 120, y: 0 }); root.add(sea.mesh);
  const whirl = sea.whirlpool(), heart = new THREE.Vector3(0, 0, 0);
  const C = new CharybdisLook({ env, fx: wb.vfx || game.vfx || null }); root.add(C.group); warpObject(C.group);
  const U = new Umbral(game, { scene: S, vfx: wb.vfx, sea, hide: [dome], anywhere: true });
  const was = { fog: S.fog, bg: S.background };
  S.fog = new THREE.FogExp2(new THREE.Color(0xcbb9a6), 0.0035); S.background = new THREE.Color(0x2a2230);
  const W = game.stormWarp; W?.set({ storm: 0.4, weather: 0, mind: 0, anywhere: true }); if (W) W.k = 0.4;
  const at = new THREE.Vector3(), look = new THREE.Vector3(), mid = new THREE.Vector3(), tint = new THREE.Color();
  let pt = 0, y = DEPTH, loop = -1, phase = -1;
  const tick = (t) => {
    const dt = THREE.MathUtils.clamp(t - pt, 0, 0.1); pt = t;
    const k = t % LOOP, L = Math.floor(t / LOOP), ph = Math.floor(k / TURN), u = (k % TURN) / TURN;
    if (L !== loop) { loop = L; C.set({ feel: DISPLAY_ORDER[L % DISPLAY_ORDER.length] }); }
    if (ph !== phase) { phase = ph; for (const p of C.parts.map.values()) { p.windupK = 0; p.set(STATES[ph]); } }
    // risen and dived by turns, eased as the director eases it
    const want = ph % 2 === 0 ? RISE : DEPTH; y += (want - y) * Math.min(1, dt / (SWING * 0.5 * 1.5));
    C.set({ y }); C.place(heart, sea);
    if (ph === 0) for (const p of C.parts.list('baleen.')) if (p.alive) p.windup(Math.max(0, Math.sin((u * 2 - p.index * 0.1) * Math.PI)));
    if (ph === 1) { for (const p of C.parts.list('eye.')) if (p.alive) p.windup(Math.max(0, Math.sin((u * 1.5 - p.index * 0.08) * Math.PI))); C.part('throat').windup(u > 0.6 ? Math.sin(((u - 0.6) / 0.4) * Math.PI) : 0); }
    if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) C.hit(1);
    camera(t);
    C.update(dt, { sea, umbral: U, toward: at });
    const w = C.whirlFor(y, sea.lift);
    whirl.set({ at: C.crossing(sea.y + sea.lift + w.apex, mid), on: 1, ...w, tint: tint.setHex(COLOR[C.feel] ?? 0xffffff) });
    whirl.update(dt); sea.update(t, at); mindTick(t);
    W?.update(dt, wb.camera); U.update(dt, wb.camera);
  };
  const camera = (t) => {
    const v = root.userData.cam || 'rail', a = t * 0.06;
    if (v === 'above') { at.set(Math.cos(a) * 18, 46, Math.sin(a) * 18); look.set(0, -4, 0); }
    else if (v === 'low') { at.set(Math.cos(a) * 36, 2.2, Math.sin(a) * 36); look.set(0, -2, 0); }
    else if (v === 'below') { at.set(Math.cos(a) * 40, -7, Math.sin(a) * 40); look.set(0, -10, 0); }
    else if (v === 'close') { at.set(Math.cos(a) * 18, 3, Math.sin(a) * 18); look.set(0, y - 1.5, 0); }
    else { at.set(Math.cos(a) * RADIUS, 4.6, Math.sin(a) * RADIUS); look.set(0, 1.5, 0); }
  };
  root.userData.tick = tick;
  root.userData.shot = (cam) => { cam.position.copy(at).applyMatrix4(root.matrixWorld); cam.up.set(0, 1, 0); cam.lookAt(look.clone().applyMatrix4(root.matrixWorld)); cam.fov = 60; cam.updateProjectionMatrix(); };
  root.userData.looks = { charybdis: C, whirl, sea };
  root.userData.dispose = () => {
    U.dispose(); W?.set({ storm: 0, mind: null, anywhere: false }); if (W) { W.k = 0; W.update(0, wb.camera); }
    S.fog = was.fog; S.background = was.bg;
    C.dispose(); sea.dispose(); dome.geometry.dispose(); dome.material.dispose();
  };
  return root;
}
