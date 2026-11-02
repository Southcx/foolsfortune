// ---------------------------------------------------------------------------------------
// A MECH'S BACK PIECE: THE HALOS (the rigid back pieces of vfx/mechs/capes.js): rings that stand close behind the shoulders in the
// chest's frame, wide enough to frame the shoulders and the Pneuka Jar in its cradle between the shoulder blades (a ring round the
// shoulders, never a wreath beside the head; `HALO_FIT`), bobbing slowly as the helm does, and alive in the frame's own time (the
// pose's dt): dim while the frame stands empty, at full strength while a Jar is sealed in (`seal`, the parts body's sealK; HALO_LIFE).
// Built in the parts body's gold and labradorite (so the mount's glazing leaves them their own), and in programs of their own: the
// drums' lacquer and hide, the flames' licking gold and film.
//   renko   the drums' ring (renkō, 連鼓): Raijin's hoop of eight taiko, lacquer-red barrels with gold tacks and hoops, pale hide heads
//           each a mitsudomoe in vermilion filling most of it (2026-11-02: gold went dark brown at distance), the hoop turning; a drum roll chases round it: each drum in turn struck (its heads flash, it
//           swells a little, a ring of the film runs off it) and the lightning jumps on from the drum before
//   kohai   the flame halo (kaen kōhai, 迦楼羅炎): Fudō Myōō's karura flames, S-curled tongues with hooked tips in two overlapping rows
//           (gold behind; before it fire, ember at the root through a gold core to the film's violet only at the tip, additive, licking
//           faster than the gold) round an open ring, licking (each tongue's tip swaying and stretching up it, in
//           the vertex program), the film breathing, embers drifting up off it
// Prior art: the Wind God and Thunder God screens of Tawaraya Sōtatsu (Kennin-ji, early 17th c.: Raijin's ring of drums on a hoop,
// the mitsudomoe on their heads) and Ogata Kōrin's copy; the taiko's byō-uchi (the tacked hide) and its lacquered dō; Fudō Myōō's
// karura-flame mandorla (the Kamakura sculptors, Kōfuku-ji, Tō-ji's lecture hall: the flames as curling birds' tongues); a drum roll
// as a chase of strikes (the matsuri's renda); the floating helm's bob (vfx/mechs/helms.js); the caster shells' procedural lightning
// (vfx/caster/lightning.js); vertex-shader foliage sway (a wave travelling up a blade, its tip moving most).
//
//   HALOS[id](fr, mats, own) -> { group (chest frame), update(dt, seal), dispose() }   (fr: the frame's metrics, capes.js frameOf)
//   HALO_FIT   HALO_LIFE
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { MECH_LOOK as L, seg, plate, shell, labTone } from '../parts/kit.js';
import { create as lightning } from '../../caster/lightning.js';

const PI = Math.PI;
/** Where a halo stands (chest frame, m): its radius from the shoulders' half-width (R = a + b x sw), its centre over the Jar's, and
 *  how far behind the Jar (and at least how far behind the back) its plane sits, and the bob. */
export const HALO_FIT = { R: [2.0, 0.8], lift: 0.2, gap: 0.95, back: 0.35, bob: 0.06 };
/** How the halos live (real seconds): `idle` the strength with no Jar sealed (1 sealed); the drums' turn (rad/s), a lap of the roll,
 *  a strike's decay, its swell, its ring's run and reach; the flames' lick (rad/s), sway (of a tongue's height), stretch, the film's
 *  breath, and the embers (count, rise m/s, life s); the inner row's fire against the gold's (its lick's speed, sway and stretch x). */
export const HALO_LIFE = {
  idle: 0.3,
  renko: { turn: 0.12, lap: 1.6, decay: 0.16, swell: 0.08, ring: 0.45, reach: 1.9 },
  kohai: { lick: 2.6, sway: 0.11, stretch: 0.06, breath: 3.1, embers: 18, rise: 1.1, life: 1.8, fireLick: 2.3, fireSway: 1.8, fireStretch: 2.2 },
};
const COLOURS = { lacquer: 0x8a1c14, hide: 0xefe4cc, tomoe: 0xd8341c };

/** Where the halo's plane stands for this frame, and its radius. */
function fit(fr) {
  const F = HALO_FIT;
  return { R: F.R[0] + F.R[1] * fr.sw, y: fr.jar.y + F.lift, z: Math.min(fr.jar.z - F.gap, fr.chest.min.z - F.back) };
}
/** The pieces of one segment merged into meshes in the body's programs, under `parent` (each pushed to `own`). */
function bakeInto(parent, S, mats, own, name) {
  for (const [k, m] of [['p', mats.p], ['core', mats.core], ['trim', mats.trim], ['g', mats.g], ['l', mats.l]]) {
    if (!S[k].pos.length) continue;
    const mesh = new THREE.Mesh(S[k].done(), m); mesh.name = `mech-cape.${name}.${k}`; mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); own.push(mesh);
  }
}
/** One tomoe's outline in a head of radius Rh: a round head swept into a tapering tail round the centre (a comma). */
function tomoe(Rh) {
  const rho = 0.46 * Rh, w0 = 0.3 * Rh, Th = 2.3, out = [], inn = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, a = t * Th, w = w0 * (1 - t) ** 0.85 + 0.004;
    out.push([Math.cos(a) * (rho + w), Math.sin(a) * (rho + w)]); inn.push([Math.cos(a) * (rho - w), Math.sin(a) * (rho - w)]);
  }
  const head = []; // (the round head, behind the tail's start)
  for (let i = 1; i < 12; i++) { const b = (i / 12) * PI; head.push([rho * 1 + Math.cos(b) * w0 * 1.0, -Math.sin(b) * w0 * 1.05]); }
  return [...out.reverse(), ...head, ...inn];
}
/** A karura flame's tongue pointing +Y, w wide at its root and h tall: its spine an S (leaning, swinging back) ending in a hooked tip
 *  curled toward `side` (+1 toward +X), its width swelling in its lower half and running out to a point. */
function tongue(w, h, side) {
  const N = 18, c = [0, 0], L0 = [], R0 = [], ds = h / N;
  for (let i = 0; i <= N; i++) {
    const t = i / N, phi = side * (-0.3 * Math.sin(PI * 1.5 * t) + 1.9 * t ** 3), ww = (w / 2) * (1 - t) ** 0.7 * (1 + 0.45 * Math.sin(PI * Math.min(1, t * 1.6)));
    const nx = Math.cos(phi), ny = -Math.sin(phi);
    L0.push([c[0] - nx * ww, c[1] - ny * ww]); R0.push([c[0] + nx * ww, c[1] + ny * ww]);
    c[0] += Math.sin(phi) * ds; c[1] += Math.cos(phi) * ds;
  }
  return [...L0, ...R0.reverse().slice(1)];
}
/** A material whose vertices lick: each tongue (aTongue: its root x, y, its angle, its height; aPhase) swayed and stretched by a wave
 *  run up it, its tip moving most; `uLick` (time, sway, stretch, strength). */
function licking(mat, U) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLick = U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aTongue; attribute float aPhase; uniform vec4 uLick;')
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
  { vec2 rel = transformed.xy - aTongue.xy; float ca = cos(aTongue.z), sa = sin(aTongue.z);
    vec2 l = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
    float u = clamp(l.y / max(aTongue.w, 1e-3), 0.0, 1.0), k = uLick.w;
    l.x += uLick.y * k * aTongue.w * u * u * sin(uLick.x * 2.6 + aPhase - u * 3.2);
    l.y *= 1.0 + uLick.z * k * u * sin(uLick.x * 1.7 + aPhase * 1.3);
    transformed.xy = aTongue.xy + vec2(ca * l.x - sa * l.y, sa * l.x + ca * l.y); }`);
  };
  mat.customProgramCacheKey = () => 'mech-halo-lick';
  return mat;
}

/** The inner row as fire (2026-11-02: South's last look, "it reads as lavender petals"): the lick's vertex wave run faster (`uLick`), and
 *  each tongue coloured up its height (aTongue.w) from an ember root through a gold core to the film's violet only at the tip, additive,
 *  its brightness the lick's strength (kept under white: additive over the gold, it bleached to petals); a flicker run up it so the
 *  light moves as the shape does; its tongues narrower and longer than the gold's, so they read as flame. */
function fire(mat, U) {
  licking(mat, U);
  const lick = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh) => {
    lick(sh);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vFireU; varying float vFirePh;')
      .replace('#include <project_vertex>', `{ vec2 rr = position.xy - aTongue.xy; float cz = cos(aTongue.z), sz = sin(aTongue.z); vFireU = clamp((-sz * rr.x + cz * rr.y) / max(aTongue.w, 1e-3), 0.0, 1.0); vFirePh = aPhase; }
  #include <project_vertex>`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying float vFireU; varying float vFirePh; uniform vec4 uLick;`)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `float fu = vFireU, fl = 0.75 + 0.25 * sin(uLick.x * 9.0 + vFirePh * 2.0 - fu * 7.0);
  vec3 emb = vec3(1.0, 0.32, 0.06), gld = vec3(1.0, 0.78, 0.3), tip = vec3(${hexVec(L.film)});
  vec3 fc = mix(emb, gld, smoothstep(0.0, 0.45, fu)); fc = mix(fc, vec3(1.0, 0.95, 0.8), smoothstep(0.3, 0.55, fu) * (1.0 - smoothstep(0.55, 0.8, fu)) * 0.35); fc = mix(fc, tip, smoothstep(0.72, 1.0, fu));
  vec4 diffuseColor = vec4(fc * (1.2 * uLick.w) * fl, opacity * (1.0 - 0.55 * smoothstep(0.8, 1.0, fu)));`);
  };
  mat.customProgramCacheKey = () => 'mech-halo-fire';
  return mat;
}
const hexVec = (h) => { const c = new THREE.Color(h); return `${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)}`; };

export const HALOS = {
  renko(fr, mats, own) {
    const P = fit(fr), R = P.R, rd = R * 0.15, len = rd * 0.95, group = new THREE.Group(), ring = new THREE.Group(), Kl = HALO_LIFE.renko; group.add(ring);
    const lac = new THREE.MeshPhysicalMaterial({ name: 'mech-halo-lacquer', color: COLOURS.lacquer, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1 });
    const hide = new THREE.MeshStandardMaterial({ name: 'mech-halo-hide', color: COLOURS.hide, roughness: 0.7, metalness: 0 });
    const tomoeM = new THREE.MeshStandardMaterial({ name: 'mech-halo-tomoe', color: COLOURS.tomoe, emissive: COLOURS.tomoe, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0 });
    const flash = new THREE.MeshBasicMaterial({ name: 'mech-halo-flash', color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    // the hoop and its stones (the body's gold and labradorite)
    const S = seg();
    S.g.geo(new THREE.TorusGeometry(R, R * 0.03, 10, 96), { c: L.gold });
    S.g.geo(new THREE.TorusGeometry(R, R * 0.014, 6, 96), { at: [0, 0, len * 0.42], c: L.bronze });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2; S.l.ball(R * 0.04, { at: [Math.cos(a) * R, Math.sin(a) * R, 0], c: labTone(k / 8, 0.2) }, 12, 8); } // (a stone between each pair)
    bakeInto(ring, S, mats, own, 'renko');
    // one drum (its axis +Z, to the back and the front), drawn eight times: the lacquered barrel, the hide heads, the gold
    const barrel = new Piece(), heads = new Piece(), gold = new Piece();
    barrel.geo(shell([[rd * 0.92, -len / 2], [rd * 1.04, -len * 0.25], [rd * 1.08, 0], [rd * 1.04, len * 0.25], [rd * 0.92, len / 2]], 28).rotateX(PI / 2), { c: 0xffffff });
    const tom = plate(tomoe(rd * 0.86), 0.04, 0.012), toms = new Piece(); // (vermilion on the pale hide, filling most of the head: read from afar)
    for (const z of [-1, 1]) {
      heads.geo(new THREE.CircleGeometry(rd * 0.93, 32), { at: [0, 0, z * len / 2], rot: [0, z > 0 ? 0 : PI, 0], c: 0xffffff });
      gold.geo(new THREE.TorusGeometry(rd * 0.95, rd * 0.06, 6, 32), { at: [0, 0, z * len / 2], c: L.gold }); // (its hoop)
      for (let t = 0; t < 14; t++) { const b = (t / 14) * PI * 2; gold.ball(rd * 0.05, { at: [Math.cos(b) * rd * 1.0, Math.sin(b) * rd * 1.0, z * len * 0.38], c: L.gold }, 6, 4); } // (the tacks)
      for (let m = 0; m < 3; m++) toms.geo(tom, { at: [0, 0, z * (len / 2 + 0.03)], rot: [0, z > 0 ? 0 : PI, (m / 3) * PI * 2], c: 0xffffff }); // (the mitsudomoe)
    }
    gold.ring(rd * 1.07, rd * 0.035, { at: [0, 0, 0], rot: [PI / 2, 0, 0], c: L.gold }, 32, 4); // (a gilt band round the barrel's belly)
    const disc = new Piece(); for (const z of [-1, 1]) disc.geo(new THREE.CircleGeometry(rd * 0.9, 28), { at: [0, 0, z * (len / 2 + 0.04)], rot: [0, z > 0 ? 0 : PI, 0], c: 0xffffff });
    const inst = (geo, mat, name) => { const m = new THREE.InstancedMesh(geo, mat, 8); m.name = `mech-cape.renko.${name}`; m.castShadow = mat !== flash; ring.add(m); own.push(m); return m; };
    const D = [inst(barrel.done(), lac, 'barrel'), inst(heads.done(), hide, 'heads'), inst(gold.done(), mats.g, 'gold'), inst(toms.done(), tomoeM, 'tomoe')];
    const F = inst(disc.done(), flash, 'flash'), Rg = inst(new THREE.TorusGeometry(rd * 1.1, rd * 0.05, 6, 32), flash, 'ring');
    const drums = [...Array(8).keys()].map((k) => { const a = (k / 8) * PI * 2 + PI / 8; return { a, at: new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0), hit: -9 }; });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Zax = new THREE.Vector3(0, 0, 1), sc = new THREE.Vector3(), col = new THREE.Color(), film = new THREE.Color(L.film);
    let Z = null; try { Z = lightning({ from: drums[7].at, to: drums[0].at, levels: 4, jag: 0.22, branches: 1, width: 0.045 * fr.scl, minPx: 0.9, glow: 2.4, tint: L.film, core: 0xf4efff, rate: 9, k: 0 }); ring.add(Z.object); } catch { Z = null; /* (headless: no arcs) */ }
    group.position.set(0, P.y, P.z);
    let t = 0, beat = -1, str = HALO_LIFE.idle;
    const draw = () => {
      for (let k = 0; k < 8; k++) {
        const d = drums[k], since = t - d.hit, pulse = since >= 0 ? Math.exp(-since / Kl.decay) : 0;
        q.setFromAxisAngle(Zax, d.a);
        m4.compose(d.at, q, sc.setScalar(1 + Kl.swell * pulse * str)); for (const m of D) m.setMatrixAt(k, m4);
        F.setMatrixAt(k, m4); F.setColorAt(k, col.copy(film).multiplyScalar(pulse * (0.25 + 1.6 * str)));
        const u = Math.min(1, Math.max(0, since / Kl.ring)), rk = u < 1 && since >= 0 ? (1 - u) ** 2 : 0;
        m4.compose(d.at, q, sc.setScalar(1 + (Kl.reach - 1) * u)); Rg.setMatrixAt(k, m4); Rg.setColorAt(k, col.copy(film).multiplyScalar(rk * (0.2 + 1.1 * str)));
      }
      for (const m of [...D, F, Rg]) m.instanceMatrix.needsUpdate = true;
      for (const m of [F, Rg]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    draw();
    return { group, update(dt, seal = 0) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1); t += dt;
      str += (HALO_LIFE.idle + (1 - HALO_LIFE.idle) * Math.min(1, Math.max(0, seal)) - str) * Math.min(1, dt * 3);
      ring.rotation.z = -t * Kl.turn; group.position.y = P.y + Math.sin(t * 0.9) * HALO_FIT.bob * fr.scl;
      const b = Math.floor((t * 8) / Kl.lap); // (the roll: a strike every lap/8 real s, round the hoop in order)
      if (b !== beat) {
        beat = b; const k = ((b % 8) + 8) % 8; drums[k].hit = t;
        if (Z) { Z.set({ from: drums[(k + 7) % 8].at, to: drums[k].at }); Z.strike(); }
      }
      if (Z) { const since = t - drums[((beat % 8) + 8) % 8].hit; Z.set({ k: Math.exp(-since / (Kl.decay * 1.2)) * (0.15 + 0.85 * str) }); Z.update(dt); }
      draw();
    }, dispose() { Z?.dispose(); for (const m of [lac, hide, flash, tomoeM]) m.dispose(); } };
  },
  kohai(fr, mats, own) {
    const P = fit(fr), R = P.R, Rr = R * 0.8, k0 = fr.scl, open = 0.62, Kl = HALO_LIFE.kohai, group = new THREE.Group();
    const U = { value: new THREE.Vector4(0, Kl.sway, Kl.stretch, HALO_LIFE.idle) };
    const goldM = licking(new THREE.MeshStandardMaterial({ name: 'mech-halo-flame', color: L.gold, roughness: 0.3, metalness: 0.7, emissive: 0x3a2208, side: THREE.DoubleSide }), U);
    const U2 = { value: new THREE.Vector4(0, Kl.sway * Kl.fireSway, Kl.stretch * Kl.fireStretch, HALO_LIFE.idle) };
    const filmM = fire(new THREE.MeshBasicMaterial({ name: 'mech-halo-fire', color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), U2);
    const emberM = new THREE.MeshBasicMaterial({ name: 'mech-halo-ember', color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    // the ring, open at its foot, and its jewel (the body's gold, trim and labradorite)
    const S = seg();
    S.g.geo(new THREE.TorusGeometry(Rr, R * 0.045, 8, 72, PI * 2 - open * 2), { rot: [0, 0, -PI / 2 + open], c: L.gold });
    S.trim.geo(new THREE.TorusGeometry(Rr * 0.92, R * 0.028, 6, 72, PI * 2 - open * 2), { rot: [0, 0, -PI / 2 + open], c: L.trimM });
    S.g.ball(R * 0.08, { at: [0, Rr, -0.12], c: L.gold }, 14, 10); S.l.ball(R * 0.055, { at: [0, Rr, -0.2], sc: [1, 1, 0.6], c: labTone(0.2, 0.2) }, 12, 8); // (the jewel at its crown)
    bakeInto(group, S, mats, own, 'kohai');
    // the two rows of tongues, each tongue's root and angle written beside its vertices for the lick
    const row = (n, rr, w, h, z, th, off) => {
      const Pc = new Piece(), tg = [], ph = [];
      for (let i = 0; i < n; i++) {
        const theta = -PI + open + ((i + 0.5 + off) / n) * (PI * 2 - open * 2), a = theta + PI / 2, rx = Math.cos(a), ry = Math.sin(a);
        const psi = Math.atan2(ry + 0.9, rx), rot = psi - PI / 2, side = Math.abs(rx) < 0.12 ? (i % 2 ? 1 : -1) : rx >= 0 ? -1 : 1;
        const sc = 0.72 + 0.4 * Math.max(0, ry), bx = rx * rr, by = ry * rr, H = h * sc, before = Pc.pos.length / 3;
        Pc.geo(plate(tongue(w * sc, H, side), th, th * 0.35), { at: [bx, by, z], rot: [0, 0, rot], c: 0xffffff });
        for (let v = before; v < Pc.pos.length / 3; v++) { tg.push(bx, by, rot, H); ph.push(i * 1.7 + off * 3.1); }
      }
      const g = Pc.done(); g.setAttribute('aTongue', new THREE.Float32BufferAttribute(tg, 4)); g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
      return g;
    };
    const gm = new THREE.Mesh(row(13, Rr, R * 0.27, R * 0.6, 0, 0.14 * k0, 0), goldM), fm = new THREE.Mesh(row(13, Rr * 0.97, R * 0.12, R * 0.66, -0.14 * k0 - 0.05, 0.08 * k0, 0.5), filmM);
    for (const [m, nm] of [[gm, 'flames'], [fm, 'fire']]) { m.name = `mech-cape.kohai.${nm}`; m.castShadow = m === gm; group.add(m); own.push(m); } // (the fire is light: no shadow)
    // the embers: small motes off the flames' tips, rising and fading
    const E = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.07 * k0 + 0.03, 0), emberM, Kl.embers); E.name = 'mech-cape.kohai.embers'; group.add(E); own.push(E);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), Zax = new THREE.Vector3(0, 0, 1), sc = new THREE.Vector3(), col = new THREE.Color(), hot = new THREE.Color(L.ember), cool = new THREE.Color(L.film);
    let rnd = 7; const R01 = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
    const spawn = (M, born) => { M.born = born; const a = -PI + open + R01() * (PI * 2 - open * 2) + PI / 2, r = R * (0.95 + 0.25 * R01()); M.x = Math.cos(a) * r; M.y = Math.sin(a) * r; return M; };
    const motes = [...Array(Kl.embers).keys()].map((i) => spawn({}, -(i / Kl.embers) * Kl.life));
    group.position.set(0, P.y, P.z);
    let t = 0, str = HALO_LIFE.idle;
    return { group, update(dt, seal = 0) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1); t += dt;
      str += (HALO_LIFE.idle + (1 - HALO_LIFE.idle) * Math.min(1, Math.max(0, seal)) - str) * Math.min(1, dt * 3);
      group.position.y = P.y + Math.sin(t * 0.9) * HALO_FIT.bob * fr.scl;
      U.value.x = t * (Kl.lick / 2.6); U.value.w = 0.45 + 0.55 * str;
      U2.value.x = t * (Kl.lick / 2.6) * Kl.fireLick; U2.value.w = (0.45 + 0.55 * str) * (0.8 + 0.2 * Math.sin(t * Kl.breath) ** 2); // (the fire: licking faster, breathing)
      for (let i = 0; i < motes.length; i++) {
        const M = motes[i]; let age = t - M.born;
        if (age > Kl.life) { spawn(M, t); age = 0; }
        const u = age / Kl.life;
        v.set(M.x + Math.sin(t * 2 + i) * 0.15 * k0, M.y + age * Kl.rise * k0, -0.2 * k0);
        m4.compose(v, q.setFromAxisAngle(Zax, t * 3 + i), sc.setScalar(1 - u));
        E.setMatrixAt(i, m4); E.setColorAt(i, col.copy(hot).lerp(cool, u).multiplyScalar((1 - u) * (0.2 + 0.9 * str)));
      }
      E.instanceMatrix.needsUpdate = true; if (E.instanceColor) E.instanceColor.needsUpdate = true;
    }, dispose() { for (const m of [goldM, filmM, emberM]) m.dispose(); } };
  },
};
