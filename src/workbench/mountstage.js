// ---------------------------------------------------------------------------------------
// A MOUNT'S PREVIEW ON THE WORKBENCH (`ships:mounts`, the group 'ships' on the MODELS tab): a sloop and a frigate moored at plank
// jetties on a patch of the crude sea, each drawing the same mount's preview (vfx/mountpreview.js), every mount in turn, eight real
// seconds each: from the jetty (where the Courier stands to choose) and from above, the sloop and then the frigate. `userData.view` holds
// one: '<tool>' (that mount, the views in turn) or '<tool>.<hull>.<jetty|above>' (one shot), as the pier's ids name them (MOUNTS).
// Prior art: the workbench's ship classes (workbench/shipstage.js: a sky, a sea and a camera of its own), Into the Breach's tooltip
// board (the area of an action drawn on a small board beside its card).
//
//   mountStage(game) -> Object3D (userData.tick, userData.shot, userData.dispose)   MOUNT_ORDER
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CrudeSea } from '../vfx/crudesea.js';
import { shipLook } from '../vfx/shipclasses.js';
import { MountPreview } from '../vfx/mountpreview.js';
import { COLOR } from '../progress/weather.js';
import { mindTick } from '../vfx/labradorite.js';

export const MOUNT_ORDER = ['soulbrush', 'crucibelle', 'lockheart', 'veritome', 'sondelass', 'dreamvane', 'psygun'];
const HULLS = [{ id: 'sloop', x: -75, feel: 'wonder' }, { id: 'frigate', x: 75, feel: 'mirth' }];
const SHOTS = ['sloop.jetty', 'sloop.above', 'frigate.jetty', 'frigate.above'];
const DECK = 1.1; // (the jetty's planks over the crude: world/dunes/beach.js JETTY.deck)
const _px = new THREE.Vector2();

export function mountStage(game) {
  const wb = game.workbench, S = wb?.scene; if (!S) return null;
  const env = game.sky?.env || null, root = new THREE.Group(); root.userData.placed = true; root.userData.bare = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), game.sky.domeMaterial(new THREE.Vector3(-0.55, 0.3, -0.78)));
  dome.frustumCulled = false; dome.renderOrder = -10; root.add(dome);
  const sea = new CrudeSea({ env, size: 420, cells: 120, y: 0 }); sea.set({ calm: 0.75 }); root.add(sea.mesh);
  const plank = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 });
  const moored = HULLS.map((H) => {
    const s = shipLook(H.id, { env }); s.polarity(COLOR[H.feel]); s.group.position.set(H.x, 0, 0); root.add(s.group);
    const half = (s.beam ?? 2.4) / 2, jx = H.x - (half + 1.6 + 1.6), jetty = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 34), plank); // (alongside on its left, as the mooring lays it: 1.6 m off the jetty's side)
    jetty.position.set(jx, DECK - 0.15, (s.length ?? 7) * 0.32 - 17); root.add(jetty); // (its end a third of the hull ahead of the hull's middle, as at the pier)
    const P = new MountPreview(); root.add(P.mesh);
    const ctx = { at: new THREE.Vector3(H.x, 0, 0), yaw: 0, length: s.length ?? 7, camera: wb.camera, lines: 480, water: (x, z) => sea.surfaceAt(x, z), color: COLOR[H.feel] };
    return { H, s, P, ctx, jx };
  });
  const was = { fog: S.fog, bg: S.background };
  S.fog = new THREE.FogExp2(new THREE.Color(0xcbb9a6), 0.004); S.background = new THREE.Color(0x2a2230);
  const at = new THREE.Vector3(), look = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let last = 0;
  const place = (tool, shot) => {
    const [hull, angle] = shot.split('.'), m = moored.find((q) => q.H.id === hull) || moored[0], x = m.H.x;
    const far = tool === 'psygun' ? 150 : tool === 'sondelass' ? 67 : tool === 'crucibelle' || tool === 'dreamvane' ? 0 : 38;
    if (angle === 'above') { const h = tool === 'psygun' ? 230 : tool === 'crucibelle' ? 165 : tool === 'dreamvane' ? 110 : 105; at.set(x, h, far * 0.5 - 2); look.set(x, 0, far * 0.5); up.set(0, 0, 1); } // (the bow at the top of the picture)
    else { at.set(m.jx, DECK + 3.2, -6); look.set(x + 2, 0, 34); up.set(0, 1, 0); } // (from the jetty, behind where the Courier stands, out to sea past the bow)
  };
  root.userData.tick = (t) => {
    const dt = Math.max(0, Math.min(0.1, t - last)); last = t;
    const v = root.userData.view, [vt, vh, va] = (v || '').split('.');
    const tool = MOUNT_ORDER.includes(vt) ? vt : MOUNT_ORDER[Math.floor(t / 8) % MOUNT_ORDER.length];
    const shot = vh && va ? `${vh}.${va}` : SHOTS[Math.floor(t / 2) % SHOTS.length];
    place(tool, shot);
    const cam = wb.camera; cam.position.copy(at); cam.up.copy(up); cam.lookAt(look); cam.updateMatrixWorld();
    sea.update(t, at); mindTick(t);
    const lines = game.renderer?.getDrawingBufferSize?.(_px).y || 480;
    for (const m of moored) {
      const { x } = m.s.group.position;
      m.s.group.position.y = (sea.surfaceAt(x, 0) - sea.y) * 0.7; m.s.group.rotation.set(0.025 * Math.sin(t * 0.6), 0, 0.035 * Math.sin(t * 0.45 + 1), 'YXZ');
      m.s.set({ sail: 0.15, side: 1, glow: 0.35, t });
      m.ctx.lines = lines; m.ctx.camera = cam; m.P.show(tool); m.P.draw(m.ctx, dt);
    }
  };
  root.userData.shot = (camera) => { camera.position.copy(at); camera.up.copy(up); camera.lookAt(look); camera.fov = 55; camera.updateProjectionMatrix(); };
  root.userData.dispose = () => {
    S.fog = was.fog; S.background = was.bg; sea.dispose(); dome.geometry.dispose(); dome.material.dispose(); plank.dispose();
    for (const m of moored) { m.s.dispose(); m.P.buf.dispose(); }
    root.traverse((o) => { if (o.isMesh && o.geometry?.type === 'BoxGeometry') o.geometry.dispose(); });
  };
  return root;
}
