// ---------------------------------------------------------------------------------------
// THE TRAPS' BODIES, ONE: the rising pillars, the pendulum, the gust gate and the sinkhole (vfx/racewaytraps.js builds them; the gusher,
// the portal pair and the Wisp turret are bodies2.js). Each is built in its trap's root (on the line at its place, +z the race's way,
// local x = -lat: world/raceway/traps.js frameAt) and returns its look: { root, show(Tp, t, dt), dispose(), lamp? }. Every hit and reach
// is Dovina's (traps.js act); these only stand where her numbers bite.
//   RISING PILLARS  three ruin slabs, one a lane, sunk flush with the sand (their lapis-inlaid tops, gold-rimmed, read from 130 m as the
//                   three hatches); the told lane's hatch lit in ember and its slab rumbling up a hand's width, then standing whole
//   PENDULUM        two ruin posts and an amber-glazed lintel, an iron chain with gold collars, a lapis bob banded in gold; its swath on
//                   the sand lit as the bob nears the line (each crossing told by the light growing under it), the bob glowing with it
//   GUST GATE       a glazed wind-mouth each side, vanes in it; the side it will blow from lit in ember and its vanes spinning up, then
//                   streaks of wind racing across the track (on the sand, at the board's height, and a curtain the rider passes through)
//   SINKHOLE        a ring of half-buried stones round its reach; told, the sand inside darkens and turns in a spiral, faster as it
//                   nears; open, the hole's dark throat spreads from the middle, dust thrown up as it gives
//
// Prior art: Fall Guys' pistons (the floor's lit pad before a beat), the Thwomp's shadow; every platformer's swinging blade (the swath on
// the floor); Ultimate Chicken Horse's fan (vanes and streaks); Crash Bandicoot's collapsing floor and the antlion's pit (the house's own
// maw, vfx/racewaypark.js).
//
//   BODIES = { pillars, pendulum, gust, sinkhole }   each (ctx) -> look   ctx: { game, traps, Tp, root, R, W }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE as P, STATE, solid, glowMat, own, drape, flatRing, flatRect, markShow } from './kit.js';

const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3();
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cyl = (r0, r1, h, x = 0, y = 0, z = 0, seg = 10) => new THREE.CylinderGeometry(r1, r0, h, seg).translate(x, y, z);
/** A ruin post of the Raceway's kit: a plinth, a clay body with two gold bands, a capital; its foot `y0`, its top `y1`. */
const post = (x, z, y0, y1, w = 1.5) => [[box(w * 1.5, 1.2, w * 1.5, x, y0 + 0.6, z), P.cap], [box(w, y1 - y0, w, x, (y0 + y1) / 2, z), P.strata[0]],
  [box(w * 1.06, 0.22, w * 1.06, x, y0 + (y1 - y0) * 0.35, z), P.gold], [box(w * 1.06, 0.22, w * 1.06, x, y0 + (y1 - y0) * 0.7, z), P.gold], [box(w * 1.4, 0.5, w * 1.4, x, y1 - 0.25, z), P.strata[1]]];
const dust = (game, root, x, z) => { const p = new THREE.Vector3(x, 0.3, z); root.localToWorld(p); game.vfx?.play('raceway.pit.snap', { pos: p, dir: UP }); };
const disposeAll = (list) => { for (const x of list) x?.dispose?.(); };

export const BODIES = {
  // ---------------------------------------------------------------- the rising pillars
  pillars({ game, Tp, root, R, W }) {
    const K = Tp.K, band = (2 * W) / 3, bw = band - 0.4, h = K.size.h, len = K.size.len, laneX = (l) => W - band * (l + 0.5); // (lane l's middle: lat -W + band (l + 0.5), traps.js act)
    const slabs = [0, 1, 2].map((l) => {
      const m = solid([[box(bw, h * 0.8, len, 0, -h * 0.1, 0), P.strata[l % 3]], [box(bw + 0.08, 0.22, len + 0.08, 0, h * 0.18, 0), P.gold],
        [box(bw + 0.16, h * 0.2, len + 0.16, 0, h * 0.4, 0), P.ame], [box(bw * 0.62, 0.06, len * 0.62, 0, h / 2 + 0.03, 0), P.lapis],
        [box(bw * 0.7, 0.05, len * 0.7, 0, h / 2 + 0.01, 0), P.gold]]);
      m.position.set(laneX(l), -h / 2, 0); root.add(m); return m;
    });
    const tex = own('hatch', Math.max(1, Math.round(bw / 3)), 1), mats = [0, 1, 2].map(() => glowMat(STATE.idle, STATE.idleO, tex));
    const pads = mats.map((mt, l) => { const m = new THREE.Mesh(drape(flatRect(bw + 0.8, len + 1.6, laneX(l), 0), root, R, 0.1), mt); m.renderOrder = 3; root.add(m); return m; });
    let was = 'idle';
    return {
      root,
      show(Tp, t, dt) {
        const told = Tp.phase === 'tell', up = Tp.phase === 'active';
        if (Tp.phase !== was && (told || up)) dust(game, root, laneX(Tp.lane), 0);
        was = Tp.phase;
        slabs.forEach((m, l) => {
          const mine = l === Tp.lane && Tp.stun <= 0, want = !mine ? -h / 2 : up ? h / 2 : told ? -h / 2 + 0.3 + 0.12 * Math.sin(t * 40) * Tp.k : -h / 2; // (sunk: its top at the sand; told: a rumble, a hand's width up; up: standing)
          m.position.y = up && mine ? damp(m.position.y, want, 18, dt) : damp(m.position.y, want, told ? 30 : 8, dt);
        });
        mats.forEach((mt, l) => markShow(mt, l === Tp.lane ? Tp : { phase: 'idle', stun: Tp.stun }, t, { idle: 0.1 }));
        tex.offset.x = (tex.offset.x + dt * (told ? 1.2 : up ? 0 : 0.05)) % 1;
      },
      dispose() { tex.dispose(); disposeAll(pads.map((m) => m.geometry)); },
    };
  },

  // ---------------------------------------------------------------- the pendulum
  pendulum({ Tp, root, R, W }) {
    const K = Tp.K, reach = Math.min(W, K.size.reach), L = Math.max(11, reach + 3), H = L + 1.8, px = W + 2.4, bob = K.size.bob;
    root.add(solid([...post(-px, 0, -1, H + 0.2), ...post(px, 0, -1, H + 0.2), [box(2 * px + 2.4, 1.3, 1.7, 0, H + 0.85, 0), P.ame], [box(2 * px + 2.3, 0.3, 1.78, 0, H + 0.25, 0), P.drip],
      [box(2 * px + 2.46, 0.2, 1.76, 0, H + 1.05, 0), P.gold], [box(2 * px + 2.9, 0.34, 2.1, 0, H + 1.65, 0), P.coping], [cyl(0.55, 0.55, 2.2, 0, 0, 0, 12).rotateX(Math.PI / 2).translate(0, H, 0), P.gold]]));
    const arm = new THREE.Group(); arm.position.y = H; root.add(arm);
    const chain = [[cyl(0.16, 0.16, L, 0, -L / 2, 0, 6), P.iron]];
    for (let d = 2.4; d < L - 1; d += 2.4) chain.push([cyl(0.3, 0.3, 0.22, 0, -d, 0, 8), P.gold]);
    chain.push([new THREE.IcosahedronGeometry(bob, 1).translate(0, -L, 0), P.lapis], [new THREE.TorusGeometry(bob * 1.02, 0.18, 6, 20).rotateX(Math.PI / 2).translate(0, -L, 0), P.gold],
      [new THREE.ConeGeometry(0.5, 1.1, 6).rotateX(Math.PI).translate(0, -L - bob - 0.4, 0), P.gold]);
    arm.add(solid(chain));
    const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(bob * 1.45, 1), glowMat(STATE.tell, 0, null, true)); halo.position.y = -L; arm.add(halo);
    const swathMat = glowMat(STATE.idle, STATE.idleO), swath = new THREE.Mesh(drape(flatRect(2 * (reach + bob), 2 * K.size.len), root, R, 0.1), swathMat); swath.renderOrder = 3; root.add(swath);
    let last = 1, tellK = 0;
    return {
      root, arm,
      show(Tp, t, dt) {
        const sw = Tp.swing ?? 0, a = Math.abs(sw), nearing = a < last - 1e-4; last = a;
        arm.rotation.z = Math.asin(Math.max(-1, Math.min(1, (sw * reach) / L))); // (the bob over lat -swing x reach: traps.js act's bobLat)
        const want = Tp.phase === 'active' ? 1 : Tp.phase === 'tell' ? Tp.k : nearing ? Math.max(0, Math.min(1, (1 - a) / 0.55)) : 0;
        tellK = damp(tellK, want, 14, dt);
        if (Tp.phase === 'active' || tellK < 0.05) markShow(swathMat, Tp, t);
        else markShow(swathMat, { phase: 'tell', stun: Tp.stun }, t, { k: tellK });
        halo.material.color.setHex(Tp.phase === 'active' ? STATE.active : STATE.tell); halo.material.opacity = 0.12 + 0.55 * tellK;
      },
      dispose() { swath.geometry.dispose(); },
    };
  },

  // ---------------------------------------------------------------- the gust gate
  gust({ Tp, root, R, W }) {
    const K = Tp.K, len = K.size.len, mx = W + 3.4, cy = 2.8, mouthR = 2.3;
    const mouth = (sg) => { const x = sg * mx;
      return [[box(3.2, cy - 1.2, 2.6, x + sg * 0.5, (cy - 1.2) / 2 - 0.6, 0), P.cap], [new THREE.TorusGeometry(mouthR, 0.6, 8, 20).rotateY(Math.PI / 2).translate(x, cy, 0), P.ame],
        [new THREE.TorusGeometry(mouthR + 0.5, 0.14, 6, 24).rotateY(Math.PI / 2).translate(x - sg * 0.3, cy, 0), P.gold], [cyl(mouthR + 0.3, mouthR + 0.3, 0.4, 0, 0, 0, 20).rotateZ(Math.PI / 2).translate(x + sg * 0.75, cy, 0), P.drip],
        [cyl(0.5, 0.5, 0.6, 0, 0, 0, 10).rotateZ(Math.PI / 2).translate(x + sg * 0.3, cy, 0), P.gold]]; };
    root.add(solid([...mouth(-1), ...mouth(1)]));
    const vanes = [-1, 1].map((sg) => { const parts = []; for (let i = 0; i < 4; i++) parts.push([box(0.14, mouthR * 1.8, 0.7).rotateX((i * Math.PI) / 4), P.bisque]); const m = solid(parts); m.position.set(sg * mx, cy, 0); root.add(m); return m; });
    const mouthMats = [-1, 1].map(() => glowMat(STATE.idle, 0, null, true)), mouths = [-1, 1].map((sg, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(mouthR - 0.3, 24).rotateY(-sg * Math.PI / 2), mouthMats[i]); m.position.set(sg * (mx - 0.4), cy, 0); root.add(m); return m; });
    const tex = own('streak', Math.max(1, Math.round(W / 6)), Math.max(1, Math.round(len / 6))), sheetMat = glowMat(0xfff4dc, 0, tex, true), groundMat = glowMat(STATE.idle, STATE.idleO, tex);
    const sheets = [0.9, 2.4].map((y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, len).rotateX(-Math.PI / 2), sheetMat); m.position.y = y; root.add(m); return m; });
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, 3.6), sheetMat); curtain.position.y = 1.9; root.add(curtain);
    const ground = new THREE.Mesh(drape(flatRect(2 * W, len), root, R, 0.1), groundMat); ground.renderOrder = 3; root.add(ground);
    let spin = [0, 0];
    return {
      root,
      show(Tp, t, dt) {
        const dir = Tp.dir || 1, src = dir > 0 ? 1 : 0, on = Tp.phase === 'active', told = Tp.phase === 'tell'; // (blowing toward +lat: from local x = +dir side)
        spin = spin.map((s, i) => damp(s, i === src ? (on ? 16 : told ? 3 + 8 * Tp.k : 0.3) : 0.3, 4, dt));
        vanes.forEach((m, i) => { m.rotation.x += spin[i] * dt * (i ? 1 : -1); });
        mouthMats.forEach((mt, i) => markShow(mt, i === src ? Tp : { phase: 'idle' }, t, { idle: 0.0 }));
        const flow = on ? 2.4 : told ? 0.3 + 0.6 * Tp.k : 0.05;
        tex.offset.x = (tex.offset.x + dt * flow * dir) % 1;
        sheetMat.opacity = damp(sheetMat.opacity, on ? 0.75 : told ? 0.12 + 0.2 * Tp.k : 0, 10, dt);
        markShow(groundMat, Tp, t);
      },
      dispose() { tex.dispose(); ground.geometry.dispose(); },
    };
  },

  // ---------------------------------------------------------------- the sinkhole
  sinkhole({ game, Tp, root, R }) {
    const r = Tp.K.size.r, cx = -(Tp.lat || 0), stones = [], y0 = root.getWorldPosition(new THREE.Vector3()).y;
    const groundY = (x, z) => { _v.set(x, 0, z); root.updateMatrixWorld(true); root.localToWorld(_v); return R?.heightAt ? R.heightAt(_v.x, _v.z) - y0 : 0; };
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.2, x = cx + Math.cos(a) * (r + 0.6), z = Math.sin(a) * (r + 0.6), y = groundY(x, z);
      stones.push([box(0.9, 0.9, 0.7).rotateX(0.25).rotateY(-a).translate(x, y + 0.15, z), P.strata[i % 3]]);
      if (i % 2 === 0) stones.push([box(0.95, 0.14, 0.75, 0, 0.45, 0).rotateX(0.25).rotateY(-a).translate(x, y + 0.15, z), P.gold]);
    }
    root.add(solid(stones));
    const spiralTex = own('spiral'), spiralMat = new THREE.MeshBasicMaterial({ color: P.sand, map: spiralTex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const spiral = new THREE.Mesh(drape(flatRect(2 * r, 2 * r, cx, 0), root, R, 0.12), spiralMat); spiral.renderOrder = 3; root.add(spiral);
    const holeMat = new THREE.MeshBasicMaterial({ map: own('hole'), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const hole = new THREE.Mesh(drape(flatRect(2 * r, 2 * r, cx, 0), root, R, 0.16), holeMat); hole.renderOrder = 4; root.add(hole);
    const ringMat = glowMat(STATE.idle, STATE.idleO), ring = new THREE.Mesh(drape(flatRing(r - 0.35, r + 0.35, cx, 0), root, R, 0.12), ringMat); ring.renderOrder = 3; root.add(ring);
    let was = 'idle', open = 0;
    return {
      root,
      show(Tp, t, dt) {
        if (Tp.phase === 'active' && was !== 'active') dust(game, root, cx, 0);
        was = Tp.phase;
        const told = Tp.phase === 'tell', on = Tp.phase === 'active';
        spiralTex.rotation -= dt * (told ? 1.5 + 5 * Tp.k : on ? 6 : 0.2);
        spiralMat.opacity = damp(spiralMat.opacity, on ? 0.85 : told ? 0.25 + 0.55 * Tp.k : 0, 10, dt);
        open = damp(open, on ? 1 : 0, on ? 12 : 4, dt); holeMat.opacity = Math.min(1, open * 1.4); holeMat.map.repeat.setScalar(1 / Math.max(0.2, open)); // (the dark spreading from the middle)
        markShow(ringMat, Tp, t);
      },
      dispose() { spiralTex.dispose(); holeMat.map.dispose(); for (const m of [spiral, hole, ring]) m.geometry.dispose(); },
    };
  },
};
