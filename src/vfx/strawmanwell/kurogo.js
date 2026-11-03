// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE STAGEHANDS IN BLACK (a part of the Well's look, vfx/strawmanwell/look.js; South, 2026-11-01: "lots of
// japanese theatre references and motifs ... those guys in black as stagehands"): kabuki's and bunraku's kurogo, there and by
// convention not there, as the toy theatre has them: flat painted cut-outs pushed on a slider just behind the stage's plane.
//   the follower  on every stage, a stagehand crouched behind the Courier, scuttling after them on their slide, holding a long pole
//                 (sashigane) over the stage with a paper butterfly fluttering on its wire (a ghost-fire, pale blue, on the Noh stages)
//   the clappers  a stage begun: a stagehand slides in standing, strikes the wooden clappers (hyoshigi) twice and slides off; the
//                 same at a clear, and the paper snow (yuki-kago) falls over the stage from the flies: cherry petals on the kabuki
//                 stages, white paper on the Noh ones, gold elsewhere
//   the board     a dummy knocked out: the tsuke board's double beat (sound only: well.tsuke)
// Events for the sounds (Wanda's, audio/welltheatre.js): well.hyoshigi { kind: 'open' | 'close' }, well.tsuke { kind: 'battari' },
// well.kurogo.enter / .leave (the clapper's), on a Noh stage well.noh { kind: 'otsuzumi' } at its start and 'fue' at an S clear, on
// the others well.mie at an S clear; each { by: 'environment', x, y }. Looks only: nothing here touches a rule, a body or a collider.
//
// Prior art: the kurogo (kabuki's and bunraku's black-clad stage assistants, invisible by convention), the sashigane (a butterfly or a
// ghost-fire on a pole and wire), the hyoshigi and the tsuke-uchi (the clappers that open and close an act, the board beaten under a
// mie); the yuki-kago (the snow basket shaken from the flies: snowcountry.fitzmuseum.cam.ac.uk, "Snow in the theatre"); Pollock's
// toy theatre's figures on their wire slides; the house's flats' painting (flats/kit.js: the cut-out's keyline).
//
//   dressKurogo(ctx) -> { lane(id), update(dt), dispose() }   (ctx: look.js)   KUROGO (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** Where they stand (m behind the plane: just behind the stage boxes' back faces), their size, pace and the snow's. */
export const KUROGO = {
  z: -1.62, h: 1.5, lag: 1.6, ahead: 0.9, flyH: 2.15, poleLift: 0.6, slide: 5.5, clapAt: [0.45, 0.75],
  snow: { n: 140, fall: 1.1, life: 7, spread: 9, from: 7.5 }, ink: 0x101014, veil: 0x2a2a34, butterfly: [0xf6efe2, 0xd8b84a], fire: 0x9cd8ff,
};
const K = KUROGO;
const NOH_LANES = new Set(['swing', 'depth', 'wall', 'script']), KABUKI_LANES = new Set(['chase', 'arsenal', 'pit', 'flip', 'jar']);
/** The fighter stages (the Arena, the flat stage): no stagehand stands in a fight. */
const FIGHT_LANES = new Set(['arena', 'flatstage']);

/** The cut-outs' atlas: the crouch (left half) and the stand with the clappers (right half), and the butterfly and the ghost-fire. */
function atlas() {
  const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const ink = '#101014', key = '#2a1a12', veil = 'rgba(70,70,86,0.95)';
  const cut = (draw) => { g.save(); g.lineJoin = 'round'; g.strokeStyle = key; g.lineWidth = 7; draw(true); g.restore(); g.save(); draw(false); g.restore(); };
  // the crouch: kneeling on the back knee, the front knee up, leant forward, one arm out holding the pole; each limb its own shape
  // with a grey cloth edge inside its keyline so the black figure reads as a body (a kurogo's cotton catches the footlights)
  const limb = (pts, w) => { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = key; g.lineWidth = w + 8; g.stroke(); g.strokeStyle = '#3c3c4a'; g.lineWidth = w; g.stroke(); g.strokeStyle = ink; g.lineWidth = w - 7; g.stroke(); };
  limb([[48, 244], [104, 236], [128, 196]], 30);              // the back leg: shin along the floor, the thigh up to the hip
  limb([[128, 196], [176, 178], [184, 244], [206, 246]], 28); // the front leg: thigh forward, the shin down, the foot
  limb([[128, 196], [146, 118]], 44);                         // the body, leant forward
  limb([[150, 124], [196, 146], [234, 152]], 18);             // the arm out to the pole
  limb([[140, 128], [170, 166], [196, 170]], 16);             // the other arm, on the knee
  cut((stroke) => { g.beginPath(); g.ellipse(156, 82, 30, 34, 0.25, 0, Math.PI * 2); if (stroke) g.stroke(); else { g.fillStyle = ink; g.fill(); } });
  g.fillStyle = veil; g.beginPath(); g.ellipse(166, 88, 18, 22, 0.25, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(140,140,160,0.35)'; g.lineWidth = 1.5; for (let x = 152; x < 184; x += 5) { g.beginPath(); g.moveTo(x, 66); g.lineTo(x + 6, 110); g.stroke(); }
  // the stand: upright, both hands up before the chest holding the two clappers
  g.save(); g.translate(256, 0);
  cut((stroke) => {
    g.beginPath(); g.moveTo(70, 252); g.lineTo(78, 140); g.quadraticCurveTo(82, 106, 128, 100); g.quadraticCurveTo(174, 106, 178, 140); g.lineTo(186, 252); g.closePath();
    if (stroke) g.stroke(); else { g.fillStyle = ink; g.fill(); }
    g.beginPath(); g.ellipse(128, 66, 32, 36, 0, 0, Math.PI * 2); if (stroke) g.stroke(); else { g.fillStyle = ink; g.fill(); }
    g.beginPath(); g.moveTo(96, 140); g.lineTo(118, 112); g.lineTo(130, 118); g.lineTo(110, 150); g.moveTo(160, 140); g.lineTo(140, 112); g.lineTo(128, 118); g.lineTo(148, 150);
    if (stroke) g.stroke(); else { g.fillStyle = ink; g.fill(); }
  });
  g.fillStyle = veil; g.beginPath(); g.ellipse(128, 70, 20, 24, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d9b884'; g.strokeStyle = key; g.lineWidth = 3; for (const [x, a] of [[112, -0.5], [146, 0.5]]) { g.save(); g.translate(x, 100); g.rotate(a); g.fillRect(-6, -30, 12, 34); g.strokeRect(-6, -30, 12, 34); g.restore(); }
  g.restore();
  g.fillStyle = '#ffffff'; g.fillRect(W - 12, 0, 12, 12); // (a white texel for the snow, tinted by its vertex colours)
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
/** Where in the atlas: the white texel (the snow's) and an ink texel (the pole's), in uv. */
const WHITE_UV = [1 - 6 / 512, 1 - 6 / 256], INK_UV = [150 / 512, 1 - 170 / 256];

/** The pole's lure: a paper butterfly (two wing quads that flap) or a ghost-fire's flame, painted once. */
function lureTexture(kind) {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  if (kind === 'fire') {
    const gr = g.createRadialGradient(64, 76, 4, 64, 70, 54); gr.addColorStop(0, 'rgba(240,252,255,1)'); gr.addColorStop(0.35, 'rgba(156,216,255,0.95)'); gr.addColorStop(1, 'rgba(60,110,200,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(64, 6); g.quadraticCurveTo(108, 70, 64, 122); g.quadraticCurveTo(20, 70, 64, 6); g.fill();
  } else {
    g.strokeStyle = '#2a1a12'; g.lineWidth = 4; g.fillStyle = '#f6efe2';
    g.beginPath(); g.moveTo(0, 20); g.quadraticCurveTo(110, 0, 124, 60); g.quadraticCurveTo(70, 70, 0, 20); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(10, 120); g.quadraticCurveTo(90, 120, 124, 66); g.quadraticCurveTo(50, 70, 10, 120); g.fill(); g.stroke();
    g.fillStyle = '#d8b84a'; for (const [x, y, r] of [[60, 30, 10], [52, 100, 8], [96, 50, 6]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#b3202a'; g.beginPath(); g.arc(84, 40, 5, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** The flats' own material (flats/build.js: the same program, nothing new compiled): a map cut out at 0.5, vertex colours white. */
const cutMaterial = (map) => new THREE.MeshBasicMaterial({ name: 'well-kurogo', map, alphaTest: 0.5, vertexColors: true, side: THREE.DoubleSide });
const white = (geo) => { geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3)); return geo; };

/** A quad showing one half of the atlas (u0..u1), its feet at its origin. */
function cutQuad(mat, u0, u1, w, h) {
  const geo = white(new THREE.PlaneGeometry(w, h)); geo.translate(0, h / 2, 0);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  return new THREE.Mesh(geo, mat);
}

export function dressKurogo(ctx) {
  const g = ctx.game, root = new THREE.Group(); root.name = 'well.kurogo'; ctx.room.add(root);
  const tex = atlas(), mat = cutMaterial(tex);
  const butterflyTex = lureTexture('butterfly'), fireTex = lureTexture('fire'), lureMat = cutMaterial(butterflyTex), fireMat = cutMaterial(fireTex);
  // the follower: the crouch, its pole, its lure (a butterfly's two wings, or the ghost-fire)
  const follower = cutQuad(mat, 0, 0.5, K.h, K.h); follower.visible = false; root.add(follower);
  const poleGeo = white(new THREE.CylinderGeometry(0.018, 0.024, 1, 5)); { const uv = poleGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, INK_UV[0], INK_UV[1]); }
  const pole = new THREE.Mesh(poleGeo, mat); pole.visible = false; root.add(pole);
  const wingGeo = white(new THREE.PlaneGeometry(0.34, 0.34)); wingGeo.translate(0.17, 0, 0);
  const lure = new THREE.Group(), wingL = new THREE.Mesh(wingGeo, lureMat), wingR = new THREE.Mesh(wingGeo, lureMat); wingR.rotation.y = Math.PI; lure.add(wingL, wingR);
  const fire = new THREE.Mesh(white(new THREE.PlaneGeometry(0.42, 0.5)), fireMat); lure.add(fire); lure.visible = false; root.add(lure);
  // the clapper: the stand, slid on and off
  const clapper = cutQuad(mat, 0.5, 1, K.h * 1.08, K.h * 1.08); clapper.visible = false; root.add(clapper);
  // the snow basket's fall: one mesh, a quad a flake written each frame on the CPU (the atlas's white texel, tinted by its colours)
  const NV = K.snow.n * 6, fPos = new Float32Array(NV * 3), fCol = new Float32Array(NV * 3), fUv = new Float32Array(NV * 2);
  for (let i = 0; i < NV; i++) { fUv[i * 2] = WHITE_UV[0]; fUv[i * 2 + 1] = WHITE_UV[1]; }
  const flakeGeo = new THREE.BufferGeometry(); flakeGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3).setUsage(THREE.DynamicDrawUsage));
  flakeGeo.setAttribute('color', new THREE.BufferAttribute(fCol, 3).setUsage(THREE.DynamicDrawUsage)); flakeGeo.setAttribute('uv', new THREE.BufferAttribute(fUv, 2)); flakeGeo.setDrawRange(0, 0);
  const flakes = new THREE.Mesh(flakeGeo, mat); flakes.frustumCulled = false; root.add(flakes);
  const CORNERS = [[-0.055, -0.04], [0.055, -0.04], [0.055, 0.04], [-0.055, -0.04], [0.055, 0.04], [-0.055, 0.04]];
  const snow = [], Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), W3 = new THREE.Vector3(), C = new THREE.Color();

  let laneId = null, z = 0, fx = null, t = 0, clap = null, face = 1;
  const floorY = () => ctx.at.y;
  const say = (name, kind) => { const p = g.player?.pos; g.events?.emit(name, { kind, x: p?.x ?? 0, y: p?.y ?? 0, by: 'environment' }); };
  const fall = () => {
    const p = g.player?.pos; if (!p) return;
    const cols = NOH_LANES.has(laneId) ? [0xffffff, 0xf2f0ea] : KABUKI_LANES.has(laneId) ? [0xf2b8c4, 0xd8788c, 0xfbe8ec] : [0xe2b04a, 0xf6efe2, 0xd8a944];
    snow.length = 0;
    for (let i = 0; i < K.snow.n; i++) snow.push({ x: p.x + (Math.random() * 2 - 1) * K.snow.spread, y: floorY() + K.snow.from + Math.random() * 2.5, z: z + (Math.random() * 2 - 1.2) * 1.4, a: Math.random() * 6, s: 0.7 + Math.random() * 0.6, c: cols[i % cols.length], born: t + Math.random() * 1.5 });
  };
  const clapStart = (kind) => { const p = g.player?.pos; if (!p) return; clap = { kind, t: 0, x: p.x + 3.2 * (kind === 'open' ? 1 : -1), said: 0 }; say('well.kurogo.enter'); };
  const offs = [
    g.events?.on?.('well.stage.enter', (e) => { if (NOH_LANES.has(e?.stage ?? laneId)) { say('well.noh', 'otsuzumi'); } clapStart('open'); }),
    g.events?.on?.('well.stage.clear', (e) => { clapStart('close'); fall(); if (e?.rank === 'S' || e?.rank === 'SS') { if (NOH_LANES.has(laneId)) say('well.noh', 'fue'); else say('well.mie'); } }),
    g.events?.on?.('well.dummy.ko', () => say('well.tsuke', 'battari')),
  ].filter(Boolean);

  return {
    lane(id) {
      laneId = id; const L = id ? ctx.lanes[id] : null;
      const on = !!L && !FIGHT_LANES.has(id); // (a fighter stage keeps its rehearsal's own crew: no stagehand over a fight)
      follower.visible = pole.visible = lure.visible = on; if (!L) { clapper.visible = false; snow.length = 0; flakes.count = 0; return; }
      z = L.z + K.z; fx = null;
      wingL.visible = wingR.visible = !NOH_LANES.has(id); fire.visible = NOH_LANES.has(id);
    },
    update(dt) {
      t += dt; const p = g.player?.pos; if (!p || !laneId) return;
      const y0 = floorY();
      if (follower.visible) {
        // the follower: a beat behind the Courier on its slide, bobbing as it scuttles, facing the way it goes
        const vx = g.player?.vel?.x ?? 0; if (Math.abs(vx) > 0.4) face = Math.sign(vx);
        const want = p.x - face * K.lag;
        const prev = fx ?? want; fx = prev + (want - prev) * Math.min(1, dt * 2.2);
        const v = (fx - prev) / Math.max(dt, 1e-4), bob = Math.abs(Math.sin(t * 9)) * Math.min(0.08, Math.abs(v) * 0.03);
        follower.position.set(fx, y0 + bob, z); follower.scale.x = v < -0.05 ? -1 : 1;
        // the lure over the Courier's head, ahead of them, fluttering
        const lx = p.x + K.ahead + Math.sin(t * 1.3) * 0.5, ly = Math.max(p.y, y0) + K.flyH + Math.sin(t * 2.1) * 0.25;
        lure.position.set(lx, ly, z + 0.05);
        const flap = Math.abs(Math.sin(t * 13)); wingL.rotation.y = -flap * 1.1; wingR.rotation.y = Math.PI + flap * 1.1; fire.scale.setScalar(0.9 + Math.sin(t * 17) * 0.08);
        // the pole from the stagehand's hand to the lure
        V.set(fx + follower.scale.x * K.h * 0.41, y0 + K.h * 0.41 + bob, z); // (the hand: the atlas's (234, 152) of its 256 square)
        const d = new THREE.Vector3().subVectors(lure.position, V); const len = d.length();
        pole.position.copy(V).addScaledVector(d, 0.5); pole.scale.set(1, len, 1); pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      }
      // the clapper: slides in, claps twice, slides out
      if (clap) {
        clap.t += dt; const T = clap.t, x = clap.x;
        const inK = Math.min(1, T / 0.3), outK = Math.max(0, (T - 1.2) / 0.3), slide = (1 - inK + outK) * 4 * Math.sign(x - p.x || 1);
        clapper.visible = outK < 1; clapper.position.set(x + slide, y0 + (T > 0.4 && T < 1.0 ? Math.abs(Math.sin(T * 30)) * 0.03 : 0), z);
        clapper.scale.x = x > p.x ? -1 : 1;
        if (clap.said < 2 && T > K.clapAt[clap.said]) { clap.said++; if (clap.said === 1) say('well.hyoshigi', clap.kind); }
        if (outK >= 1) { clapper.visible = false; clap = null; say('well.kurogo.leave'); }
      }
      // the paper snow
      let n = 0;
      for (const f of snow) {
        const a = t - f.born; if (a < 0 || a > K.snow.life) continue;
        const y = f.y - a * K.snow.fall * f.s; if (y < y0) continue;
        E.set(a * 2.1 * f.s + f.a, a * 1.4 + f.a, a * 3 * f.s); Q.setFromEuler(E); C.setHex(f.c);
        V.set(f.x + Math.sin(a * 1.7 + f.a) * 0.4, y, f.z);
        for (let k = 0; k < 6; k++) {
          W3.set(CORNERS[k][0] * f.s, CORNERS[k][1] * f.s, 0).applyQuaternion(Q).add(V); const o = (n * 6 + k) * 3;
          fPos[o] = W3.x; fPos[o + 1] = W3.y; fPos[o + 2] = W3.z; fCol[o] = C.r; fCol[o + 1] = C.g; fCol[o + 2] = C.b;
        }
        n++; if (n >= K.snow.n) break;
      }
      flakeGeo.setDrawRange(0, n * 6); if (n) { flakeGeo.attributes.position.needsUpdate = true; flakeGeo.attributes.color.needsUpdate = true; }
    },
    dispose() {
      for (const off of offs) try { off(); } catch (e) { /* (the bus is gone with the room) */ }
      root.removeFromParent(); root.traverse((o) => o.geometry?.dispose?.());
      for (const m of [mat, lureMat, fireMat]) m.dispose(); for (const x of [tex, butterflyTex, fireTex]) x.dispose();
    },
  };
}
