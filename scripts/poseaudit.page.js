// ---------------------------------------------------------------------------------------
// THE POSE AUDIT, the page's side: injected by scripts/poseaudit.mjs into the running game (manual mode, stepped by __game.tick), then
// scripts/poseaudit.states.js (the manifest) on top of it. It measures the posed Courier every frame, whatever posed it (a clip, a layer,
// a stance, IK, the hinge repair and rom.js, all as the game runs them), for three things CLAUDE.md forbids: a held tool through the
// body, a limb through the body, a joint past what a body does. What it measures, and how:
//
//  THE BODY'S PROXIES   fitted once from the Courier's skinned meshes in their bind pose (the armour, the core, the mask and the stones; not
//                       the hair, nor the faint shell over the core): each vertex goes to the bone that weighs on it most; each body bone
//                       (head, neck, chest, spine, pelvis, upper arms, forearms, thighs, shins, feet) gets a capsule in its own bind frame,
//                       along its length (the rig's bones point along their local +Y), its ends at the 3rd and 97th percentile of its
//                       vertices along it; across it an ELLIPSE, centred where the flesh is (the spine bone lies at the back of the torso),
//                       its two half-widths the 8th-to-92nd percentile span on the bone's local X and Z, fitted apart for the first and the
//                       last third of its length and tapered between (a thigh is wider at the hip); then drawn in until 95% of its
//                       surface stands no more than 0.5 cm past the bone's own vertices in its direction (calib.json has each one's before
//                       and after, and how far it was drawn in). The proxy sits inside the skin: a thing resting on the body reads about 0, a thing
//                       through it reads how far (at least: a proxy drawn in reads a shallow pass shallower).
//  1. A HELD THING      the tool in the hand (the belt's, drawn whole) or the thing carried: its visible meshes (not outlines, lines,
//                       points or faint additive glows) sampled once, area-weighted, plus their vertices (TOOL_SAMPLES in all), carried to
//                       the world each frame; the deepest sample in each capsule, per body part, in cm. Not tested: the hands (they hold
//                       it), and a forearm against the part of the thing within HANDLE_R of that hand's palm while the palm is on it (a
//                       hilt in the fist is not a clip; the off hand on a haft the same).
//  2. A LIMB            each forearm's and hand's own vertices (skinned on the CPU, as the GPU does) against the chest, spine, pelvis and
//                       thighs; each shin's against the other leg (thigh, shin, foot); past LIMITS.limbCm.
//  3. JOINTS            anatomical angles, every frame, each derived from the rig's rest pose (the T-pose: arms out, palms down, which is
//                       the forearm's neutral, thumbs forward):
//                         the elbow's hinge  the axis square to the forearm and to the thumb's side at rest (the way the elbow flexes is
//                                            the way the thumb points at neutral), carried by the UPPER arm (the forearm's own frame
//                                            turns with pronation); flexion is the signed angle from the upper arm's line to the
//                                            forearm's about it (below 0: hyperextension), the swing out of that plane is "off hinge"
//                         the knee's hinge    the same, its flexion the way the heel goes (opposite the rest toes' direction)
//                         the wrist           the hand's turn from rest in the forearm's frame, its twist about the forearm's line taken
//                                            out (it belongs to the forearm), the rest bent toward the palm (flexion; the palm normal of
//                                            character.js, palm down at rest) or the back of the hand (extension), and toward the thumb
//                                            (radial) or the little finger (ulnar)
//                         the forearm's twist the palm normal about the forearm's line, from neutral (the palm along the elbow's hinge,
//                                            as at rest) toward the way the elbow flexes (supination, +) or away (pronation, -)
//                         the neck's turn     the head's turn from rest about its own length, in the chest's frame (spine003)
//                       The elbow's and knee's readings and the forearm's twist are against the UPPER bone's own frame, as a body's are:
//                       a clip retargeted by direction alone leaves the upper arm or thigh turned about its length by nothing (hinges.js;
//                       the tools' suites are not yet hinge-repaired), and a bend that looks right then reads off its hinge or backward,
//                       which is how the skin sees it. `range` carries `upperArmTwist` and `thighTwist` (that turn, from rest) to tell
//                       which. Frames past "about" a limit by no more than LIMITS.jointSlack make a state marginal, not dirty.
//  OUTPUT               per state: the worst of each measure and its frame, and the frames past each limit (as ranges); the worst frames
//                       redrawn (the pose kept per measured frame and put back) from the front and the side with every other tool off the
//                       Courier, the offending samples, vertices or joint in red over a red outline of the proxy they are in.
//
// Prior art: Unreal's Animation Insights and Pose Watch (a pose recorded per frame and scrubbed back), Unity's Animation Rigging debug
// draw and its physics-shape capsules per bone (the ragdoll wizard's: a capsule along each limb, sized from the skinned mesh), the swing-
// twist decomposition (Dobrowolski; rom.js, hinges.js), the AAOS's normal joint ranges (wrist flexion 80 / extension 70, radial 20 /
// ulnar 30-35, pronation and supination ~80-90 each from mid, cervical rotation ~70-80), and the casebook's rule 178 (a knee or elbow
// measured off its hinge, the twist taken out first).
//
//   __pa.calib()                 what the rest pose gave: the proxies, the axes (for the run's own header)
//   __pa.run(state, opt)         one state of the manifest, stepped and measured: -> { result, sheet (a PNG data URL) | null, tile }
//   __pa.overview(tiles, title)  the worst frame of each dirty state, on one sheet
// ---------------------------------------------------------------------------------------
window.__pa = (() => {
  const G = window.__game, g = G.game, THREE = G.THREE, ch = g.character, B = ch.bones, I = G.input, P = g.player;
  const DEG = 180 / Math.PI;
  /** The limits (degrees, cm): past one, a frame is listed. A joint past its limit by no more than `jointSlack` (the limits are "about":
   *  a capture's run carries its fists 24 degrees radial) makes a state `marginal`; further, an offence, drawn on the sheet. */
  const LIMITS = { toolCm: 1, limbCm: 1, jointSlack: 8, wristFlexion: 75, wristExtension: 70, radialDeviation: 20, ulnarDeviation: 35, forearmTwist: 90,
    elbowHyperextension: 5, kneeHyperextension: 5, elbowOffHinge: 20, kneeOffHinge: 20, neckTurn: 70 };
  const HANDLE_R = 0.14, ON_TOOL = 0.07, TOOL_SAMPLES = 2400, LIMB_VERTS = 220, Q_LO = 0.08, Q_HI = 0.92;
  const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------------------------------------------------------------- 0. the bones as body parts
  function partOf(n) {
    if (n === 'head') return 'head';
    if (n === 'spine004' || n === 'spine005') return 'neck';
    if (n === 'spine003') return 'chest';
    if (n === 'spine001' || n === 'spine002') return 'spine';
    if (n === 'spine' || /^(pelvis|genital)/.test(n)) return 'pelvis';
    const m = n.match(/^(upper_arm|forearm|hand|f_[a-z]+\d+|thumb\d+|thigh|shin|foot|toe|heel02)([LR])$/);
    if (!m) return null;
    const k = m[1], s = m[2];
    const base = k === 'upper_arm' ? 'upperArm' : /^(hand|f_|thumb)/.test(k) ? 'hand' : /^(foot|toe|heel)/.test(k) ? 'foot' : k;
    return base + s;
  }
  const BODY_MESH = /^(Polygon_ID29006(_1)?|Courier_Skin_Core|Courier_Mask|Courier_Stones)$/;
  const meshes = []; ch.model.traverse((o) => { if (o.isSkinnedMesh && !o.userData.isOutline && BODY_MESH.test(o.name)) meshes.push(o); });

  // ---------------------------------------------------------------- 1. the proxies, fitted in the bind pose
  const local = {}; // bone name -> [x, y, z, ...] in its bind frame
  const limbVerts = { forearmL: [], forearmR: [], handL: [], handR: [], shinL: [], shinR: [] };
  for (const m of meshes) {
    const pos = m.geometry.attributes.position, si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
    for (let i = 0; i < pos.count; i++) {
      let best = -1, bw = -1;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      const name = m.skeleton.bones[best].name;
      _v.fromBufferAttribute(pos, i).applyMatrix4(m.bindMatrix).applyMatrix4(m.skeleton.boneInverses[best]);
      (local[name] ||= []).push(_v.x, _v.y, _v.z);
      const part = partOf(name);
      if (limbVerts[part]) limbVerts[part].push([m, i]);
    }
  }
  for (const k in limbVerts) { const a = limbVerts[k]; while (a.length > LIMB_VERTS) a.splice(Math.floor(rnd() * a.length), 1); }
  const pct = (a, q) => a[clamp(Math.round(q * (a.length - 1)), 0, a.length - 1)];
  const section = (xs, zs) => { xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
    return { cx: (pct(xs, Q_LO) + pct(xs, Q_HI)) / 2, ax: Math.max(0.01, (pct(xs, Q_HI) - pct(xs, Q_LO)) / 2), cz: (pct(zs, Q_LO) + pct(zs, Q_HI)) / 2, az: Math.max(0.01, (pct(zs, Q_HI) - pct(zs, Q_LO)) / 2) }; };
  const CAPSULE_PARTS = /^(head|neck|chest|spine|pelvis|upperArm[LR]|forearm[LR]|thigh[LR]|shin[LR]|foot[LR])$/;
  const caps = [];
  for (const [name, a] of Object.entries(local)) {
    const part = partOf(name);
    if (!part || !CAPSULE_PARTS.test(part) || a.length < 3 * 12 || !B[name]) continue;
    const n = a.length / 3, ys = [];
    for (let i = 0; i < n; i++) ys.push(a[i * 3 + 1]);
    ys.sort((p, q) => p - q);
    const yLo = pct(ys, 0.03), yHi = pct(ys, 0.97), t1 = pct(ys, 1 / 3), t2 = pct(ys, 2 / 3);
    const lo = [[], []], hi = [[], []];
    for (let i = 0; i < n; i++) { const y = a[i * 3 + 1], x = a[i * 3], z = a[i * 3 + 2]; if (y <= t1) { lo[0].push(x); lo[1].push(z); } if (y >= t2) { hi[0].push(x); hi[1].push(z); } }
    const s0 = section(...lo), s1 = section(...hi);
    let y0 = yLo + Math.min(s0.ax, s0.az), y1 = yHi - Math.min(s1.ax, s1.az);
    if (y0 > y1) y0 = y1 = (yLo + yHi) / 2;
    caps.push({ name, part, bone: B[name], s0, s1, ya: (yLo + t1) / 2, yb: (t2 + yHi) / 2, y0, y1, n, inv: new THREE.Matrix4(), c: new THREE.Vector3(), R: 0, scale: 1 });
  }
  const capOf = (part) => caps.filter((c) => c.part === part);
  /** A capsule's surface (its own bind frame): three rings round its length and each end's dome (the ends are domes of the end's ellipse). */
  function surface(c) {
    const out = [], sec = (y) => { const u = c.yb > c.ya ? clamp((y - c.ya) / (c.yb - c.ya), 0, 1) : 0.5; return { cx: c.s0.cx + (c.s1.cx - c.s0.cx) * u, cz: c.s0.cz + (c.s1.cz - c.s0.cz) * u, ax: c.s0.ax + (c.s1.ax - c.s0.ax) * u, az: c.s0.az + (c.s1.az - c.s0.az) * u }; };
    for (const [y, dir] of [[c.y0, -1], [(c.y0 + c.y1) / 2, 0], [c.y1, 1]]) {
      const s = sec(y);
      for (let k = 0; k < 16; k++) {
        const t = (k / 16) * Math.PI * 2, ex = s.ax * Math.cos(t), ez = s.az * Math.sin(t), re = Math.hypot(ex, ez);
        out.push(new THREE.Vector3(s.cx + ex, y, s.cz + ez));
        if (dir && k % 2 === 0) out.push(new THREE.Vector3(s.cx + ex * Math.SQRT1_2, y + dir * re * Math.SQRT1_2, s.cz + ez * Math.SQRT1_2)); // (the dome at 45 degrees)
      }
      if (dir) out.push(new THREE.Vector3(s.cx, y + dir * Math.min(s.ax, s.az), s.cz)); // (its tip)
    }
    return out;
  }
  // THE PROXIES KEPT INSIDE THE SKIN: each capsule's surface checked against its own vertices (the skin it was fitted to): a point of it
  // stands out by how far it reaches past the furthest of the bone's vertices in its own direction (within 25 degrees, from the section's
  // centre, the dome's from its end), and the half-widths are drawn in by 7% a step until 95% of its points stand out by no more than
  // SKIN_OUT (measured: the first fit stood out up to 4.9 cm at the waist, 3.9 at the hips, 3.5 at the shins, where a percentile span of a
  // bone's vertices is not its shape). (A test against the body's triangles was tried and refused: the armour lies over the core, so the
  // nearest triangle's side says "outside" between the two.)
  const SKIN_OUT = 0.005, COS25 = Math.cos((25 * Math.PI) / 180);
  function standsOut(c) {
    const a = local[c.name], n = a.length / 3, h = Math.max(0.02, (c.y1 - c.y0) / 6 + 0.01), out = [];
    for (const q of surface(c)) {
      const yc = clamp(q.y, c.y0, c.y1), u = c.yb > c.ya ? clamp((yc - c.ya) / (c.yb - c.ya), 0, 1) : 0.5;
      const cx = c.s0.cx + (c.s1.cx - c.s0.cx) * u, cz = c.s0.cz + (c.s1.cz - c.s0.cz) * u;
      const dx = q.x - cx, dy = q.y - yc, dz = q.z - cz, L = Math.hypot(dx, dy, dz);
      if (L < 1e-6) continue;
      let far = -1;
      for (let i = 0; i < n; i++) {
        const vx = a[i * 3] - cx, vy = a[i * 3 + 1] - yc, vz = a[i * 3 + 2] - cz;
        if (Math.abs(dy) < 1e-6 && Math.abs(vy) > h) continue; // (a ring: the vertices at its height)
        const vl = Math.hypot(vx, Math.abs(dy) < 1e-6 ? 0 : vy, vz); if (vl < 1e-6) continue;
        if ((vx * dx + (Math.abs(dy) < 1e-6 ? 0 : vy * dy) + vz * dz) / (vl * L) < COS25) continue;
        far = Math.max(far, vl);
      }
      if (far > 0) out.push(L - far);
    }
    out.sort((p, q) => p - q);
    return out.length ? out[Math.floor(out.length * 0.95)] : 0;
  }
  for (const c of caps) {
    c.out0 = standsOut(c); c.shrink = 1;
    for (let k = 0; k < 12 && standsOut(c) > SKIN_OUT; k++) { for (const s of [c.s0, c.s1]) { s.ax *= 0.93; s.az *= 0.93; } c.shrink *= 0.93; }
    c.out = standsOut(c);
  }
  /** How far a point (in the capsule bone's bind frame) is inside it (metres; negative: outside). */
  function depthLocal(c, x, y, z) {
    const yc = clamp(y, c.y0, c.y1), e = y - yc;
    const u = c.yb > c.ya ? clamp((yc - c.ya) / (c.yb - c.ya), 0, 1) : 0.5;
    const cx = c.s0.cx + (c.s1.cx - c.s0.cx) * u, cz = c.s0.cz + (c.s1.cz - c.s0.cz) * u;
    const ax = c.s0.ax + (c.s1.ax - c.s0.ax) * u, az = c.s0.az + (c.s1.az - c.s0.az) * u;
    const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
    const re = d < 1e-6 ? Math.min(ax, az) : (ax * az) / Math.hypot((az * dx) / d, (ax * dz) / d);
    return re - Math.hypot(d, e);
  }
  /** Each capsule's world frame this frame (and a bounding sphere for a quick miss). */
  function placeCaps() {
    for (const c of caps) {
      c.inv.copy(c.bone.matrixWorld).invert();
      c.scale = _v.setFromMatrixColumn(c.bone.matrixWorld, 0).length();
      const ym = (c.y0 + c.y1) / 2, r = Math.max(c.s0.ax, c.s0.az, c.s1.ax, c.s1.az) + Math.max(Math.abs(c.s0.cx), Math.abs(c.s0.cz), Math.abs(c.s1.cx), Math.abs(c.s1.cz));
      c.c.set(0, ym, 0).applyMatrix4(c.bone.matrixWorld); c.R = ((c.y1 - c.y0) / 2 + r + 0.02) * c.scale;
    }
  }
  /** Depth (m) of a world point in capsule c (placed). */
  function depthWorld(c, p) {
    if (p.distanceToSquared(c.c) > c.R * c.R) return -1;
    _w.copy(p).applyMatrix4(c.inv);
    return depthLocal(c, _w.x, _w.y, _w.z) * c.scale;
  }

  // ---------------------------------------------------------------- 2. the joints' axes, from the rest pose
  const restQ = (b) => ch.rest.get(b).q, restW = (b) => ch.restCharQ.get(b), restP = (b) => ch.restPos.get(b);
  const Y = new THREE.Vector3(0, 1, 0);
  const inFrame = (b, wv) => wv.clone().applyQuaternion(restW(b).clone().invert()); // a world direction at rest, in b's rest frame
  const perp = (v, ...axes) => { const o = v.clone(); for (const a of axes) o.addScaledVector(a, -o.dot(a)); return o.normalize(); };
  const AX = {};
  for (const s of ['L', 'R']) {
    const hand = B[`hand${s}`], fore = B[`forearm${s}`], shin = B[`shin${s}`];
    const palm = perp(ch.arm[s].palmLocal.clone().normalize(), Y);                                       // hand frame, square to its length
    const thumbW = restP(B[`thumb01${s}`]).clone().sub(restP(hand));
    const thumb = perp(inFrame(hand, thumbW), Y, palm);                                                   // the thumb's side, hand frame
    const thumbF = perp(inFrame(fore, thumbW), Y);                                                        // ... in the forearm's frame
    const hingeF = new THREE.Vector3().crossVectors(Y, thumbF).normalize();                               // + about it moves the forearm thumb-ward: flexion
    const toeW = restP(B[`toe${s}`]).clone().sub(restP(B[`foot${s}`]));
    const back = perp(inFrame(shin, toeW), Y).negate();                                                   // the heel's way, shin frame
    const hingeS = new THREE.Vector3().crossVectors(Y, back).normalize();
    const palmW = ch.arm[s].palmLocal.clone().applyQuaternion(restW(hand)), hingeFW = hingeF.clone().applyQuaternion(restW(fore));
    const restFlex = (up, lo, hL) => { const u = Y.clone().applyQuaternion(restW(up)), f = Y.clone().applyQuaternion(restW(lo)), h = hL.clone().applyQuaternion(restW(lo)); return Math.atan2(new THREE.Vector3().crossVectors(u, f).dot(h), u.dot(f)) * DEG; };
    AX[s] = { palm, thumb, flexAx: new THREE.Vector3().crossVectors(Y, palm).normalize(), devAx: new THREE.Vector3().crossVectors(Y, thumb).normalize(), hingeF, hingeS, palmSign: Math.sign(palmW.dot(hingeFW)) || 1, restElbow: restFlex(B[`upper_arm${s}`], fore, hingeF), restKnee: restFlex(B[`thigh${s}`], shin, hingeS),
      calib: { palmVsHinge: +(Math.acos(Math.min(1, Math.abs(palmW.normalize().dot(hingeFW)))) * DEG).toFixed(1), hingeFVsLocalX: +(Math.acos(Math.min(1, Math.abs(hingeF.x))) * DEG).toFixed(1), hingeSVsLocalX: +(Math.acos(Math.min(1, Math.abs(hingeS.x))) * DEG).toFixed(1),
        handVsForearmAtRest: +(new THREE.Vector3(0, 1, 0).applyQuaternion(restQ(hand)).angleTo(Y) * DEG).toFixed(1) } };
    AX[s].calib.elbowAtRest = +AX[s].restElbow.toFixed(1); AX[s].calib.kneeAtRest = +AX[s].restKnee.toFixed(1);
  }
  const neckRest = restW(B.spine003).clone().invert().multiply(restW(B.head)).invert(); // (the head in the chest's frame at rest, inverted)
  const twistAbout = (q, axis) => { const p = q.x * axis.x + q.y * axis.y + q.z * axis.z; let a = 2 * Math.atan2(p, q.w); if (a > Math.PI) a -= 2 * Math.PI; if (a < -Math.PI) a += 2 * Math.PI; return a; };
  const qw = (b, out) => b.getWorldQuaternion(out);
  const _u = new THREE.Vector3(), _f = new THREE.Vector3(), _h = new THREE.Vector3(), _c = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion();
  /** A hinge joint: flexion (deg, + flexes) and the swing off its plane (deg). */
  function hinge(upper, lower, hLocal) {
    qw(upper, _qa); qw(lower, _qb);
    _u.copy(Y).applyQuaternion(_qa); _f.copy(Y).applyQuaternion(_qb);
    _h.copy(hLocal).applyQuaternion(restQ(lower)).applyQuaternion(_qa); // (the lower's rest hinge, carried by the upper)
    const flex = Math.atan2(_c.crossVectors(_u, _f).dot(_h), _u.dot(_f)) * DEG;
    return { flex, side: Math.abs(Math.asin(clamp(_f.dot(_h), -1, 1))) * DEG };
  }
  function joints() {
    const out = {};
    for (const s of ['L', 'R']) {
      const A = AX[s], hand = B[`hand${s}`], fore = B[`forearm${s}`];
      const el = hinge(B[`upper_arm${s}`], fore, A.hingeF), kn = hinge(B[`thigh${s}`], B[`shin${s}`], A.hingeS);
      // the wrist: the hand's turn from rest, its twist about its length out first
      _qa.copy(restQ(hand)).invert().multiply(hand.quaternion);
      if (_qa.w < 0) _qa.set(-_qa.x, -_qa.y, -_qa.z, -_qa.w);
      const tw = Math.atan2(_qa.y, _qa.w); _qb.set(0, Math.sin(tw), 0, Math.cos(tw)); // (the twist)
      _qc.copy(_qb).invert().multiply(_qa);                                                 // (the bend)
      // (the bend as a rotation vector, square to the hand's length: its share about ŷ × palm is flexion, about ŷ × thumb radial deviation;
      //  whole for any bend, where two atan2's against ŷ both pass 90 once the hand is bent past square)
      if (_qc.w < 0) _qc.set(-_qc.x, -_qc.y, -_qc.z, -_qc.w);
      const sv = Math.hypot(_qc.x, _qc.y, _qc.z), ang = 2 * Math.atan2(sv, _qc.w), k = sv > 1e-9 ? ang / sv : 0;
      _f.set(_qc.x * k, _qc.y * k, _qc.z * k);
      const flex = _f.dot(A.flexAx) * DEG, dev = _f.dot(A.devAx) * DEG;
      // the forearm's twist: the palm about the forearm's line, from the elbow's hinge (neutral) toward the way the elbow flexes
      qw(B[`upper_arm${s}`], _qa); qw(fore, _qb); qw(hand, _qc);
      _h.copy(A.hingeF).applyQuaternion(restQ(fore)).applyQuaternion(_qa);
      _f.copy(Y).applyQuaternion(_qb);
      const pw = ch.arm[s].palmLocal.clone().applyQuaternion(_qc); pw.addScaledVector(_f, -pw.dot(_f));
      const n0 = _h.clone().addScaledVector(_f, -_h.dot(_f)).multiplyScalar(A.palmSign), F = new THREE.Vector3().crossVectors(_h, _f);
      F.addScaledVector(_f, -F.dot(_f));
      const twist = Math.atan2(pw.dot(F.normalize()), pw.dot(n0.normalize())) * DEG;
      // (context, judged by no limit: the shoulder's and the hip's turn of the upper bone about its own length from rest, where a clip
      //  retargeted by direction alone leaves what the forearm's twist and the elbow's hinge then read: hinges.js)
      const ownTwist = (b) => { _qa.copy(restQ(b)).invert().multiply(b.quaternion); if (_qa.w < 0) _qa.set(-_qa.x, -_qa.y, -_qa.z, -_qa.w); return 2 * Math.atan2(_qa.y, _qa.w) * DEG; };
      out[`upperArmTwist${s}`] = ownTwist(B[`upper_arm${s}`]); out[`thighTwist${s}`] = ownTwist(B[`thigh${s}`]);
      Object.assign(out, { [`elbowFlex${s}`]: el.flex, [`elbowSide${s}`]: el.side, [`kneeFlex${s}`]: kn.flex, [`kneeSide${s}`]: kn.side, [`wristFlex${s}`]: flex, [`wristDev${s}`]: dev, [`forearmTwist${s}`]: twist });
    }
    qw(B.spine003, _qa); qw(B.head, _qb);
    _qc.copy(neckRest).multiply(_qa.invert().multiply(_qb)); // (the head's turn from rest, in its rest frame: rest⁻¹ · chest⁻¹ · head)
    if (_qc.w < 0) _qc.set(-_qc.x, -_qc.y, -_qc.z, -_qc.w);
    out.neckTurn = twistAbout(_qc, Y) * DEG;
    return out;
  }
  /** The joint measures checked against the limits: [name, value past which it is out, the value's sign that counts]. */
  const JOINT_RULES = [];
  for (const s of ['L', 'R']) JOINT_RULES.push(
    [`wristFlexion${s}`, `wristFlex${s}`, 1, LIMITS.wristFlexion], [`wristExtension${s}`, `wristFlex${s}`, -1, LIMITS.wristExtension],
    [`radialDeviation${s}`, `wristDev${s}`, 1, LIMITS.radialDeviation], [`ulnarDeviation${s}`, `wristDev${s}`, -1, LIMITS.ulnarDeviation],
    [`supination${s}`, `forearmTwist${s}`, 1, LIMITS.forearmTwist], [`pronation${s}`, `forearmTwist${s}`, -1, LIMITS.forearmTwist],
    [`elbowHyperextension${s}`, `elbowFlex${s}`, -1, LIMITS.elbowHyperextension], [`kneeHyperextension${s}`, `kneeFlex${s}`, -1, LIMITS.kneeHyperextension],
    [`elbowOffHinge${s}`, `elbowSide${s}`, 1, LIMITS.elbowOffHinge], [`kneeOffHinge${s}`, `kneeSide${s}`, 1, LIMITS.kneeOffHinge]);
  JOINT_RULES.push(['neckTurnLeft', 'neckTurn', 1, LIMITS.neckTurn], ['neckTurnRight', 'neckTurn', -1, LIMITS.neckTurn]);
  const JOINT_AT = (name) => { const s = name.slice(-1); return /^(wrist|radial|ulnar|supination|pronation)/.test(name) ? B[`hand${s}`] : /^elbow/.test(name) ? B[`forearm${s}`] : /^knee/.test(name) ? B[`shin${s}`] : B.head; };

  // ---------------------------------------------------------------- 3. the held thing, sampled
  const sampleCache = new WeakMap();
  const shown = (o, top) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === top) return true; } return true; };
  function meshSamples(m, want) {
    let s = sampleCache.get(m);
    if (s) return s;
    const geo = m.geometry, pos = geo.attributes.position, idx = geo.index, tris = [];
    const nt = idx ? idx.count / 3 : pos.count / 3, A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3();
    let total = 0;
    for (let t = 0; t < nt; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      A.fromBufferAttribute(pos, i0); Bv.fromBufferAttribute(pos, i1); C.fromBufferAttribute(pos, i2);
      const area = Bv.clone().sub(A).cross(C.clone().sub(A)).length() / 2; total += area; tris.push([i0, i1, i2, total]);
    }
    const pts = []; // [i0, i1, i2, u, v] (a vertex: [i, i, i, 0, 0])
    const nv = Math.min(pos.count, Math.ceil(want / 2));
    for (let k = 0; k < nv; k++) { const i = nv === pos.count ? k : Math.floor(rnd() * pos.count); pts.push([i, i, i, 0, 0]); }
    for (let k = 0; total > 0 && k < want - nv; k++) {
      const r = rnd() * total; let lo = 0, hi = tris.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid][3] < r) lo = mid + 1; else hi = mid; }
      let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      pts.push([tris[lo][0], tris[lo][1], tris[lo][2], u, v]);
    }
    s = { want, pts }; sampleCache.set(m, s);
    return s;
  }
  const isGlow = (mat) => !mat || (Array.isArray(mat) ? mat.every(isGlow) : mat.blending === THREE.AdditiveBlending || (mat.transparent && mat.opacity < 0.35) || mat.visible === false);
  function heldMeshes(root) {
    const out = [];
    root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && !o.userData.isOutline && o.geometry?.attributes?.position && !isGlow(o.material) && shown(o, root)) out.push(o); });
    return out;
  }
  /** What is in the hands now: the tool drawn whole (the belt's), or the thing carried. */
  function held() {
    const carry = g.techs.get('carry');
    if (carry?.item) { const e = carry.item, root = e.mesh || e.group || e.obj || e.model || null; if (root) return { id: `carried:${e.kind || e.type || 'thing'}`, root }; }
    const t = g.belt?.inHand;
    if (!t || t.drawT < 0.98) return null;
    const root = t.id === 'psygun' ? ch.gun : t.model;
    if (!root || !root.visible) return null;
    const tech = g.techs.get(t.id);
    return { id: t.id + (t.id === 'sondelass' && tech?.form ? `:${tech.form}` : ''), root };
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _cc = new THREE.Vector3();
  /** The held thing's sample points in the world this frame. */
  function heldPoints(h) {
    const ms = heldMeshes(h.root), out = [];
    // (the budget shared by each mesh's size, the first time it is seen: its bounding sphere's radius squared, in the world)
    let area = 0; const areas = ms.map((m) => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const r = (m.geometry.boundingSphere?.radius || 0.1) * _v.setFromMatrixColumn(m.matrixWorld, 0).length(); area += r * r; return r * r; });
    ms.forEach((m, k) => {
      const s = meshSamples(m, clamp(Math.round((TOOL_SAMPLES * areas[k]) / (area || 1)), 24, TOOL_SAMPLES)), pos = m.geometry.attributes.position;
      m.updateWorldMatrix(true, false);
      for (const [i0, i1, i2, u, v] of s.pts) {
        _a.fromBufferAttribute(pos, i0); if (m.isSkinnedMesh) m.applyBoneTransform(i0, _a);
        if (i1 !== i0) { _b.fromBufferAttribute(pos, i1); _cc.fromBufferAttribute(pos, i2); if (m.isSkinnedMesh) { m.applyBoneTransform(i1, _b); m.applyBoneTransform(i2, _cc); } _a.multiplyScalar(1 - u - v).addScaledVector(_b, u).addScaledVector(_cc, v); }
        out.push(_a.clone().applyMatrix4(m.matrixWorld));
      }
    });
    return { pts: out, meshes: ms.length };
  }
  const palmPoint = (s, out) => out.copy(ch.arm[s].palmPt).applyMatrix4(ch.arm[s].hand.matrixWorld);

  // ---------------------------------------------------------------- 4. one frame measured
  const TARGETS = { forearmL: ['chest', 'spine', 'pelvis', 'thighL', 'thighR'], handL: ['chest', 'spine', 'pelvis', 'thighL', 'thighR'],
    forearmR: ['chest', 'spine', 'pelvis', 'thighL', 'thighR'], handR: ['chest', 'spine', 'pelvis', 'thighL', 'thighR'], shinL: ['thighR', 'shinR', 'footR'], shinR: ['thighL', 'shinL', 'footL'] };
  const capsByPart = {}; for (const c of caps) (capsByPart[c.part] ||= []).push(c);
  const MARKS = 48;
  function measure() {
    ch.root.updateMatrixWorld(true);
    placeCaps();
    const f = { tool: null, limb: null, joints: joints() };
    // 1. the held thing
    const h = held();
    if (h) {
      const { pts, meshes: nm } = heldPoints(h);
      const palm = { L: palmPoint('L', new THREE.Vector3()), R: palmPoint('R', new THREE.Vector3()) }, on = { L: Infinity, R: Infinity };
      for (const p of pts) { on.L = Math.min(on.L, p.distanceTo(palm.L)); on.R = Math.min(on.R, p.distanceTo(palm.R)); }
      const hand = on.L < on.R ? 'L' : 'R', grips = ['L', 'R'].filter((s) => on[s] < ON_TOOL);
      const parts = {}, worst = { d: -1, part: null, cap: null, pts: [] };
      for (const c of caps) {
        const skip = grips.includes(c.part.slice(-1)) && c.part === `forearm${c.part.slice(-1)}` ? palm[c.part.slice(-1)] : null;
        let d = -1, hits = [];
        for (const p of pts) {
          if (skip && p.distanceTo(skip) < HANDLE_R) continue;
          const k = depthWorld(c, p);
          if (k > d) d = k;
          if (k > LIMITS.toolCm / 100) hits.push([k, p]);
        }
        if (d > (parts[c.part] ?? -1)) parts[c.part] = d;
        if (d > worst.d) { hits.sort((a, b) => b[0] - a[0]); Object.assign(worst, { d, part: c.part, cap: c.name, pts: hits.slice(0, MARKS).map(([, p]) => p.toArray()) }); }
      }
      f.tool = { id: h.id, hand, grips, samples: pts.length, meshes: nm, d: worst.d, part: worst.part, cap: worst.cap, pts: worst.pts, parts };
    }
    // 2. the limbs
    const pairs = {}, lw = { d: -1, limb: null, part: null, cap: null, pts: [] };
    for (const [limb, list] of Object.entries(limbVerts)) {
      const vs = list.map(([m, i]) => { _a.fromBufferAttribute(m.geometry.attributes.position, i); m.applyBoneTransform(i, _a); return _a.clone().applyMatrix4(m.matrixWorld); });
      for (const part of TARGETS[limb]) for (const c of capsByPart[part] || []) {
        let d = -1; const hits = [];
        for (const p of vs) { const k = depthWorld(c, p); if (k > d) d = k; if (k > LIMITS.limbCm / 100) hits.push([k, p]); }
        const key = `${limb}>${part}`;
        if (d > (pairs[key] ?? -1)) pairs[key] = d;
        if (d > lw.d) { hits.sort((a, b) => b[0] - a[0]); Object.assign(lw, { d, limb, part, cap: c.name, pts: hits.slice(0, MARKS).map(([, p]) => p.toArray()) }); }
      }
    }
    f.limb = { ...lw, pairs };
    return f;
  }

  // ---------------------------------------------------------------- 5. the pose kept, and put back
  function subjects(extra) {
    const list = [];
    for (const r of [ch.root, ch.gun, ...extra]) if (r && !list.includes(r)) r.traverse((o) => list.push(o));
    return list;
  }
  function keep(list) {
    const a = new Float32Array(list.length * 11);
    list.forEach((o, i) => { const k = i * 11; o.position.toArray(a, k); o.quaternion.toArray(a, k + 3); o.scale.toArray(a, k + 7); a[k + 10] = o.visible ? 1 : 0; });
    return a;
  }
  function putBack(list, a) {
    list.forEach((o, i) => { const k = i * 11; o.position.fromArray(a, k); o.quaternion.fromArray(a, k + 3); o.scale.fromArray(a, k + 7); o.visible = a[k + 10] > 0.5; });
    for (const r of new Set(list.map((o) => { let t = o; while (t.parent && t.parent.type !== 'Scene') t = t.parent; return t; }))) r.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- 6. the worst frames drawn
  const RED = new THREE.Color(0xff1030);
  const markMat = { pts: new THREE.PointsMaterial({ color: RED, size: 5, sizeAttenuation: false, depthTest: false, transparent: true }), line: new THREE.LineBasicMaterial({ color: RED, depthTest: false, transparent: true }) };
  function capsuleLines(c) {
    const out = [], ring = (y, n = 20) => { const u = c.yb > c.ya ? clamp((y - c.ya) / (c.yb - c.ya), 0, 1) : 0.5; const cx = c.s0.cx + (c.s1.cx - c.s0.cx) * u, cz = c.s0.cz + (c.s1.cz - c.s0.cz) * u, ax = c.s0.ax + (c.s1.ax - c.s0.ax) * u, az = c.s0.az + (c.s1.az - c.s0.az) * u;
      const r = []; for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI * 2; r.push(new THREE.Vector3(cx + ax * Math.cos(t), y, cz + az * Math.sin(t)).applyMatrix4(c.bone.matrixWorld)); } return r; };
    const rings = [c.y0, (c.y0 + c.y1) / 2, c.y1].map((y) => ring(y));
    for (const r of rings) for (let i = 0; i < r.length - 1; i++) out.push(r[i], r[i + 1]);
    for (const i of [0, 5, 10, 15]) out.push(rings[0][i], rings[1][i], rings[1][i], rings[2][i]);
    return out;
  }
  function marks(off) {
    const grp = new THREE.Group(); grp.renderOrder = 999;
    const lines = [];
    if (off.cap) { const c = caps.find((x) => x.name === off.cap); if (c) lines.push(...capsuleLines(c)); }
    if (off.joint) { const b = JOINT_AT(off.joint), p = b.getWorldPosition(new THREE.Vector3()), par = b.parent.getWorldPosition(new THREE.Vector3()); const kid = b.children.find((k) => k.isBone); lines.push(par, p); if (kid) lines.push(p, kid.getWorldPosition(new THREE.Vector3())); off.pts = [p.toArray()]; }
    if (lines.length) { const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines), markMat.line); l.renderOrder = 999; grp.add(l); }
    if (off.pts?.length) { const p = new THREE.Points(new THREE.BufferGeometry().setFromPoints(off.pts.map((a) => new THREE.Vector3(...a))), markMat.pts); p.renderOrder = 1000; grp.add(p); }
    return grp;
  }
  const TW = 300, TH = 380;
  /** The Courier from the front or their right (the body's yaw as it was at that frame), a tile cut from the frame. */
  const DIST = 3.3;
  /** The Courier from the front or their right ('left': their left), the chest's yaw as it was at that frame, drawn into ctx at (dx, dy). */
  const LAYER = 30; // (the sheet's own layer: only the Courier, what they hold, the marks and the lights are drawn on it)
  function shoot(view, focus, yaw, close, ctx, dx, dy, extra = []) {
    const fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), rt = new THREE.Vector3(-fw.z, 0, fw.x);
    const cam = G.camera, R = G.renderer, at = ch.bones.spine.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.12, 0));
    if (focus) at.lerp(focus, close ? 1 : 0.35);
    let d = fw, name = 'front';
    if (view === 'left') { d = rt.clone().negate(); name = 'their left'; } else if (view !== 'front') { d = rt; name = 'their right'; }
    const dist = close ? 1.1 : DIST;
    const keep = { fov: cam.fov, aspect: cam.aspect, mask: cam.layers.mask, pr: R.getPixelRatio(), size: R.getSize(new THREE.Vector2()), auto: R.shadowMap.autoUpdate };
    cam.fov = close ? 34 : 40; cam.aspect = TW / TH; cam.updateProjectionMatrix();
    cam.position.copy(at).addScaledVector(d, dist); cam.position.y += 0.25 * (dist / DIST); cam.up.set(0, 1, 0); cam.lookAt(at); cam.updateMatrixWorld();
    // (the Courier alone, drawn plainly at the tile's own size, no walls between: the whole room through SwiftShader's post chain cost 3 real
    //  seconds a frame; this, a tenth of it. The shadow map is the last frame's.)
    const lit = [];
    const on = (o) => o?.traverse((x) => { if (!x.layers.isEnabled(LAYER)) { x.layers.enable(LAYER); lit.push(x); } });
    on(ch.root); for (const e of extra) on(e); g.scene.traverse((x) => { if (x.isLight && !x.layers.isEnabled(LAYER)) { x.layers.enable(LAYER); lit.push(x); } });
    cam.layers.set(LAYER); R.shadowMap.autoUpdate = false; R.setPixelRatio(1); R.setSize(TW, TH, false);
    R.render(g.scene, cam);
    ctx.drawImage(R.domElement, 0, 0, TW, TH, dx, dy, TW, TH);
    for (const x of lit) x.layers.disable(LAYER);
    cam.layers.mask = keep.mask; R.shadowMap.autoUpdate = keep.auto; R.setPixelRatio(keep.pr); R.setSize(keep.size.x, keep.size.y, false);
    cam.fov = keep.fov; cam.aspect = keep.aspect; cam.updateProjectionMatrix();
    label(ctx, dx + 2, dy + TH - 4, `${name}${close ? ', close' : ''}`, '#c8b8a8', 10);
  }
  /** Which way the chest faces (the body's own yaw, whatever the clip has turned it to: a whole-body move turns it off the capsule's). */
  const _fz = new THREE.Vector3();
  function facing() { const q = B.spine003.getWorldQuaternion(new THREE.Quaternion()).multiply(restW(B.spine003).clone().invert()); _fz.set(0, 0, 1).applyQuaternion(q); return Math.atan2(_fz.x, _fz.z); }
  function label(ctx, x, y, text, color = '#ffe6c8', size = 12) { ctx.font = `${size}px monospace`; ctx.fillStyle = '#000a'; ctx.fillRect(x, y - size, ctx.measureText(text).width + 6, size + 4); ctx.fillStyle = color; ctx.fillText(text, x + 3, y); }

  return { LIMITS, caps, AX, partOf, measure, held, heldPoints, subjects, keep, putBack, marks, shoot, facing, label, TW, TH, JOINT_RULES, depthWorld, placeCaps, capOf, limbVerts,
    calib() {
      return { proxies: caps.map((c) => ({ bone: c.name, part: c.part, verts: c.n, len: +((c.y1 - c.y0) * 100).toFixed(1), half: [+(c.s0.ax * 100).toFixed(1), +(c.s0.az * 100).toFixed(1), +(c.s1.ax * 100).toFixed(1), +(c.s1.az * 100).toFixed(1)],
        outsideSkinCm: c.out0 != null ? [+(c.out0 * 100).toFixed(1), +(c.out * 100).toFixed(1)] : null, shrink: c.shrink != null ? +c.shrink.toFixed(2) : null })),
        axes: Object.fromEntries(['L', 'R'].map((s) => [s, AX[s].calib])), limbVerts: Object.fromEntries(Object.entries(limbVerts).map(([k, v]) => [k, v.length])), limits: LIMITS, handleR: HANDLE_R, onTool: ON_TOOL };
    } };
})();
