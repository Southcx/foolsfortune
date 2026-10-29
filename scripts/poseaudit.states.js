// ---------------------------------------------------------------------------------------
// THE POSE AUDIT'S MANIFEST (page side, after poseaudit.page.js and poseaudit.run.js): every STATE the audit drives, each a small plan
// over the runner's kit (`c`, poseaudit.run.js). Sets: `locomotion` (the core movement, the crawl, carrying, a blow taken, the shatter,
// the Solar Skiff's rider), `sondelass` (the cutlass, the rod and the hook: stance, gait, moveset, the cutlass's own, and every row of the
// melee loadout's catalogue played by the engine: `cutlass.row.<id>`, read at load, so melee phase 3's moves join on their own), `tools` (the
// other six drawn: stance, gait, moveset), `emotes` (every one in courier/emotes.js, the list read by poseaudit.mjs from that file so a
// new emote is audited without a line here), `selftest` (the measures checked against poses made wrong on purpose).
//
// A NEW MOVE: add a state (an id `<tool>.<move>`, its set, a label, a plan); a move of the moveset's grammar on a tool here is already
// driven by the generic plans (string, charge, launcher and the air string, dash, special, RMB). Frames are the plan's own (k / 60 s).
// Places are the basement's (the hub's floor, the course's stations, the tech wing's pool and ladders, the rigging's beam), measured:
// STAGE is the hub's floor heading +X, clear 29.8 m ahead and 9.8 m to each side (rays at 0.2, 0.9 and 1.6 m), so a sprint has room and
// the side camera stands on the floor, not in a wall.
//
// Prior art: the sweeps' QA matrix (scripts/sweeps/tools.mjs: every tool's verbs from every state) and a fighting game's frame-data
// sheet (each move a row, played the same way each time).
// ---------------------------------------------------------------------------------------
window.__paStates = (() => {
  const B = -14, HALF = Math.PI / 2, STAGE = [-10, B, -10], STAGE_YAW = HALF;
  const S = [];
  const add = (id, set, label, plan, extra = {}) => S.push({ id, set, label, plan, ...extra });
  const lab = (c) => c.stand(STAGE, STAGE_YAW);

  // ---------------------------------------------------------------- the self-test: the measures against faults made on purpose
  /** Turn an object about a world point and axis (its world matrix changed, its local set to match, whatever its matrixAutoUpdate). */
  function turnAbout(c, o, point, axis, ang) {
    const T = c.THREE, R = new T.Matrix4().makeTranslation(point.x, point.y, point.z).multiply(new T.Matrix4().makeRotationAxis(axis, ang)).multiply(new T.Matrix4().makeTranslation(-point.x, -point.y, -point.z));
    o.updateWorldMatrix(true, false);
    const W = R.multiply(o.matrixWorld), L = o.parent ? new T.Matrix4().copy(o.parent.matrixWorld).invert().multiply(W) : W;
    if (o.matrixAutoUpdate) L.decompose(o.position, o.quaternion, o.scale); else o.matrix.copy(L);
    o.updateMatrixWorld(true);
  }
  const local = (c, bone, axis, deg) => { const T = c.THREE; bone.quaternion.copy(c.ch.rest.get(bone).q).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(...axis).normalize(), (deg * Math.PI) / 180)); };
  const near = (v, want, tol) => v != null && Math.abs(v - want) <= tol;
  add('selftest.idle', 'selftest', 'standing still, nothing in the hands: reads clean', (c) => lab(c).run(180), {
    expect: (r) => [['clean', r.verdict === 'clean', { verdict: r.verdict, limb: r.limb.worst, joints: Object.entries(r.joints).filter(([, j]) => j.over.length).map(([n]) => n) }]] });
  add('selftest.cutlassIntoChest', 'selftest', 'the cutlass turned about the fist until its blade points at the chest: through the body', (c) => {
    lab(c).tool('sondelass', 'cutlass');
    const s = c.sond(), m = s.model, T = c.THREE, palm = c.V(), chest = c.V(), q = new T.Quaternion(), ax = c.V();
    c.after(() => {
      palm.copy(c.ch.arm.R.palmPt).applyMatrix4(c.ch.arm.R.hand.matrixWorld); c.ch.bones.spine003.getWorldPosition(chest);
      const a = c.V(), b = c.V(); if (m.bladeSegment) { m.group.updateMatrixWorld(true); m.bladeSegment(a, b); } else b.set(1, 0, 0).applyMatrix4(m.group.matrixWorld), a.setFromMatrixPosition(m.group.matrixWorld);
      const dir = b.sub(a).normalize(), want = chest.clone().sub(palm).normalize();
      q.setFromUnitVectors(dir, want); const ang = 2 * Math.acos(Math.min(1, Math.abs(q.w))); ax.set(q.x, q.y, q.z); if (ax.lengthSq() < 1e-12) return;
      turnAbout(c, m.group, palm, ax.normalize(), q.w < 0 ? -ang : ang);
    });
    c.run(60);
  }, { expect: (r) => [['deep, in the torso', (r.tool.worst?.cm ?? 0) >= 5 && /chest|spine/.test(r.tool.worst?.part || ''), r.tool.worst]] });
  add('selftest.joints', 'selftest', 'known turns laid on the idle: the right wrist flexed 60, the left radial 30, the right elbow back 25, the left knee back 20, the head 80', (c) => {
    lab(c);
    const Bn = c.ch.bones, A = window.__pa.AX;
    c.after(() => {
      local(c, Bn.handR, new c.THREE.Vector3(0, 1, 0).cross(A.R.palm).toArray(), 60); // (about ŷ × palm: ŷ goes palm-ward, flexion)
      local(c, Bn.handL, new c.THREE.Vector3(0, 1, 0).cross(A.L.thumb).toArray(), 30); // (about ŷ × thumb: ŷ goes thumb-ward, radial)
      local(c, Bn.forearmR, A.R.hingeF.toArray(), -25 - A.R.restElbow); // (from the rest's own bend: the T-pose's elbows and knees are not straight)
      local(c, Bn.shinL, A.L.hingeS.toArray(), -20 - A.L.restKnee);
      Bn.head.quaternion.multiply(new c.THREE.Quaternion().setFromAxisAngle(new c.THREE.Vector3(0, 1, 0), (80 * Math.PI) / 180));
    });
    c.run(30);
  }, { expect: (r) => [
    ['wrist flexion 60 (R)', near(r.range.wristFlexR?.[1], 60, 1.5), r.range.wristFlexR], ['radial 30 (L)', near(r.range.wristDevL?.[1], 30, 1.5), r.range.wristDevL],
    ['elbow back 25 (R)', near(r.range.elbowFlexR?.[0], -25, 1.5), r.range.elbowFlexR], ['knee back 20 (L)', near(r.range.kneeFlexL?.[0], -20, 1.5), r.range.kneeFlexL],
    ['neck turned past 70', Math.max(...(r.range.neckTurn || [0]).map(Math.abs)) > 70, r.range.neckTurn]] });
  add('selftest.limbIntoChest', 'selftest', 'the right upper arm swung across the body: the forearm and hand through the chest', (c) => {
    lab(c);
    const T = c.THREE, ua = c.ch.bones.upper_armR;
    c.after(() => {
      const yaw = c.P.bodyYaw ?? c.P.yaw, left = new T.Vector3(Math.cos(yaw), -0.15, -Math.sin(yaw)).normalize(); // (their left, a little down)
      const wq = ua.getWorldQuaternion(new T.Quaternion()), dir = new T.Vector3(0, 1, 0).applyQuaternion(wq);
      const nq = new T.Quaternion().setFromUnitVectors(dir, left).multiply(wq), pq = ua.parent.getWorldQuaternion(new T.Quaternion()).invert();
      ua.quaternion.copy(pq.multiply(nq));
    });
    c.run(30);
  }, { expect: (r) => [['deep', (r.limb.worst?.cm ?? 0) >= 3, r.limb.worst]] });

  // ---------------------------------------------------------------- the core movement and the body's other states
  add('loco.idle', 'locomotion', 'the idle A (upright), still', (c) => lab(c).run(240));
  add('loco.idleB', 'locomotion', 'the idle Bs: the three breaks in turn, each asked for at once', (c) => {
    lab(c);
    const I = c.ch.idles;
    for (let b = 0; b < 3; b++) { I.loops = 0; I.stillT = 99; c.until(() => I.brk, 120); c.until(() => !I.brk, 600); c.run(20); }
  });
  for (const key of ['akimbo', 'hipCocked', 'handsBehind', 'armsDown', 'braced', 'weightShift', 'restless']) add(`loco.idle.${key}`, 'locomotion', `the ${key} idle (IDLES)`, (c) => {
    lab(c); if (!c.ch.idles.choose(key)) throw new Error(`no idle ${key}`); c.warm(40).run(200); c.ch.idles.choose('upright');
  });
  add('loco.walk', 'locomotion', 'walking (Alt + W)', (c) => lab(c).hold('AltLeft', 'KeyW').warm(30).run(90));
  add('loco.run', 'locomotion', 'running (W)', (c) => lab(c).hold('KeyW').warm(40).run(70));
  add('loco.sprint', 'locomotion', 'sprinting (W + Shift)', (c) => lab(c).hold('KeyW', 'ShiftLeft').warm(50).run(60));
  add('loco.skid', 'locomotion', 'the skid stop: a sprint let go', (c) => lab(c).hold('KeyW', 'ShiftLeft').warm(55).free('KeyW', 'ShiftLeft').run(70));
  add('loco.reversal', 'locomotion', 'a run reversed (W, then S): the body\'s own turn over the gait', (c) => lab(c).hold('KeyW').warm(50).free('KeyW').hold('KeyS').run(70));
  add('loco.crouch', 'locomotion', 'crouched, still', (c) => lab(c).posture('crouch').run(120));
  add('loco.prowl', 'locomotion', 'the prowl: crouched, W', (c) => lab(c).posture('crouch').hold('KeyW').warm(20).run(100));
  add('loco.crawl', 'locomotion', 'the belly crawl: down onto it, W, and up', (c) => { lab(c); c.P.setPosture('prone'); c.run(60).hold('KeyW').run(120).free('KeyW'); c.P.setPosture('stand'); c.run(60); });
  add('loco.jump', 'locomotion', 'a standing jump and its landing', (c) => lab(c).press('Space').run(80));
  add('loco.doubleJump', 'locomotion', 'a running double jump', (c) => lab(c).hold('KeyW').warm(30).press('Space').run(18).press('Space').run(80));
  add('loco.fallLand', 'locomotion', 'a fall from 7 m and the hard landing', (c) => { lab(c); c.P.pos.y += 7; c.P.prevPos.copy(c.P.pos); c.run(110); });
  add('loco.airDash', 'locomotion', 'a jump, then the air dash (Shift in the air)', (c) => lab(c).hold('KeyW').warm(20).press('Space').run(12).press('ShiftLeft').run(60));
  add('loco.slide', 'locomotion', 'a sprint into the slide (C)', (c) => lab(c).hold('KeyW', 'ShiftLeft').warm(45).press('KeyC').run(70));
  add('loco.slideHeld', 'locomotion', 'a sprint into the slide, C held to its end and up', (c) => lab(c).hold('KeyW', 'ShiftLeft').warm(45).hold('KeyC').run(80).free('KeyC').run(40));
  add('loco.wallrun', 'locomotion', 'the wallrun (the course\'s station 4, the east wall) and its wall jump', (c) => {
    c.stand([35.2, B + 3, 20.6], 0).hold('KeyW', 'ShiftLeft').warm(14).press('Space').run(50).press('Space').run(50);
  });
  add('loco.mantle', 'locomotion', 'a mantle onto the 1.4 m block (the course\'s station 2)', (c) => c.stand([22.5, B, -28], HALF).hold('KeyW').warm(12).hold('Space').run(90));
  add('loco.ladder', 'locomotion', 'the ladder (the tech wing\'s T2): on, up', (c) => c.stand([-28, B, -46.2], Math.PI).hold('KeyW').run(150));
  add('loco.swim', 'locomotion', 'swimming (the tech wing\'s pool)', (c) => c.stand([-28, B - 2.5, -60], 0, 60).hold('KeyW').run(120));
  add('loco.balance', 'locomotion', 'the balance beam (the rigging\'s R2, 0.3 m)', (c) => c.stand([-51.4, B + 1.2, -63], -HALF).hold('KeyW').run(150));

  // ---------------------------------------------------------------- carrying, a blow taken, the shatter, the skiff
  /** A pot of the level's own kind set down 0.8 m before them on the lab's floor, and lifted (F). */
  function lift(c) {
    const g = c.g, carry = g.techs.get('carry'), proto = [...(g.breakables?.items || [])].find((e) => carry.liftable(e));
    const kind = proto?.def?.kind || proto?.kind || 'pot', y = c.P.bodyYaw ?? c.P.yaw;
    g.breakables.spawn({ kind, pos: [c.P.pos.x + Math.sin(y) * 0.8, c.P.pos.y + 0.02, c.P.pos.z + Math.cos(y) * 0.8], yaw: 0 });
    c.warm(30).press('KeyF').until(() => carry.item, 20);
    if (!carry.item) throw new Error(`the lift did not begin (a ${kind})`);
    return carry;
  }
  add('carry.liftWalkPut', 'locomotion', 'a pot lifted (F), carried walking, set down (F)', (c) => { lab(c); const k = lift(c); c.run(40).hold('KeyW').run(80).free('KeyW').run(20).press('KeyF').run(40); c.note('item', k.item ? 'still held' : 'set down'); });
  // (the owner's report: the carry's hold standing, walking and turning, the hands on the pot's sides within a wrist's range)
  add('carry.holdTurn', 'locomotion', 'a pot held standing, then walked in a turn (W, the view turning)', (c) => { lab(c); lift(c); c.warm(30).run(60).hold('KeyW').after((k) => { k.P.yaw += 0.03; }).run(90).after(null).free('KeyW').run(20); });
  add('carry.liftThrow', 'locomotion', 'a pot lifted and thrown (LMB)', (c) => { lab(c); lift(c); c.run(40).press('Mouse0').run(50); });
  add('hurt.small', 'locomotion', 'a light blow taken, standing (the flinch)', (c) => { lab(c); c.ch.flinch(0.3); c.run(50); });
  add('hurt.big', 'locomotion', 'a big blow from the front (the recoil)', (c) => { lab(c); const y = c.P.bodyYaw; c.ch.flinch(0.9, [-Math.sin(y), 0, -Math.cos(y)]); c.run(60); });
  add('hurt.behind', 'locomotion', 'a big blow from behind (the lurch)', (c) => { lab(c); const y = c.P.bodyYaw; c.ch.flinch(0.9, [Math.sin(y), 0, Math.cos(y)]); c.run(60); });
  add('hurt.running', 'locomotion', 'a big blow taken running', (c) => { lab(c).hold('KeyW').warm(40); const y = c.P.bodyYaw; c.ch.flinch(0.9, [-Math.sin(y), 0, -Math.cos(y)]); c.run(50); });
  add('death.shatter', 'locomotion', 'the shatter: the blow, down to the knees, until the burst', (c) => { lab(c); c.g.death.begin({ why: 'blow', by: 'environment' }); c.until(() => c.ch.hidden || !c.g.death.active, 240); }, { last: true });
  add('skiff.ride', 'locomotion', 'the Solar Skiff: summoned (Y), sailed (W), a hop (Space), let down', (c) => {
    c.travel('dunes');
    const k = c.g.techs.get('skiff');
    c.press('KeyY').until(() => k.active && k.phase === 'ride', 200).hold('KeyW').run(120).press('Space').run(70).free('KeyW').hold('KeyS').run(60).free('KeyS');
    c.note('phase', k.phase);
  });
  // a grab (LMB the nose, RMB the tail, both the double) held through a long air (the hop's rise lifted to 7 m/s so it lasts), let go
  // before the landing: the hand to the rail (courier/skiff/grabreach.js); noted, the palm's worst gap to its grip once fully in (cm)
  for (const [kind, keys] of [['nose', ['Mouse0']], ['tail', ['Mouse2']], ['double', ['Mouse0', 'Mouse2']]]) add(`skiff.grab.${kind}`, 'locomotion', `the Solar Skiff: a hop, the ${kind} grab held in the air, let go, landed`, (c) => {
    c.travel('dunes');
    const k = c.g.techs.get('skiff'), gap = {};
    c.press('KeyY').until(() => k.active && k.phase === 'ride', 200).hold('KeyW').warm(90).hold('Space').warm(12).free('Space').warm(2);
    c.P.vel.y = Math.max(c.P.vel.y, 7);
    c.after(() => { const G = k.rider.R?.grabs; if (!G || G.weight < 0.95) return; for (const [s, d] of Object.entries(G.gap(c.ch, k))) gap[s] = Math.max(gap[s] || 0, d); });
    c.hold(...keys).run(45).free(...keys).until(() => !k.air, 120).run(30).free('KeyW');
    c.after(null);
    c.note('grab', k.grab ? 'still held' : 'let go').note('gapCm', Object.fromEntries(Object.entries(gap).map(([s, d]) => [s, +(d * 100).toFixed(1)])));
  });

  // ---------------------------------------------------------------- the tools: stance, gait, moveset
  const TOOLS = [['psygun', null, 'tools'], ['sondelass', 'cutlass', 'sondelass'], ['sondelass', 'rod', 'sondelass'], ['sondelass', 'hook', 'sondelass'], ['soulbrush', null, 'tools'], ['veritome', null, 'tools'], ['dreamvane', null, 'tools'], ['crucibelle', null, 'tools'], ['lockheart', null, 'tools']];
  for (const [tool, form, set] of TOOLS) {
    const n = form || tool, draw = (c) => lab(c).tool(tool, form).pool(100);
    add(`${n}.stance`, set, `${n} drawn, standing`, (c) => draw(c).run(150));
    add(`${n}.walk`, set, `${n} drawn, walking (Alt + W)`, (c) => draw(c).hold('AltLeft', 'KeyW').warm(30).run(80));
    add(`${n}.run`, set, `${n} drawn, running (W)`, (c) => draw(c).hold('KeyW').warm(40).run(70));
    add(`${n}.sprint`, set, `${n} drawn, sprinting (W + Shift)`, (c) => draw(c).hold('KeyW', 'ShiftLeft').warm(50).run(60));
    add(`${n}.string`, set, `${n}: LMB tapped six times (the string)`, (c) => { draw(c); for (let i = 0; i < 6; i++) c.press('Mouse0').run(13); c.run(50); });
    add(`${n}.charge`, set, `${n}: LMB held 0.9 s, let go (the charge)`, (c) => draw(c).hold('Mouse0').run(55).free('Mouse0').run(60));
    add(`${n}.launcher`, set, `${n}: S + LMB held (the launcher, High Time), then LMB thrice in the air (the air string)`, (c) => {
      draw(c).hold('KeyS').press('Mouse0').hold('Mouse0').run(24).free('Mouse0', 'KeyS').run(10);
      for (let i = 0; i < 3; i++) c.press('Mouse0').run(14);
      c.until(() => c.P.grounded, 200).run(30);
    });
    add(`${n}.dash`, set, `${n}: LMB while sprinting (the dash)`, (c) => draw(c).hold('KeyW', 'ShiftLeft').warm(45).press('Mouse0').run(70));
    add(`${n}.${tool === 'sondelass' && form === 'cutlass' ? 'tidecutter' : 'special'}`, set, `${n}: R (the special)`, (c) => draw(c).press('KeyR').run(110));
    add(`${n}.rmbHeld`, set, `${n}: RMB held 1 s (aim, lens, dowse, blade, the octave), let go`, (c) => draw(c).hold('Mouse2').run(60).free('Mouse2').run(40));
    add(`${n}.rmbTap`, set, `${n}: RMB tapped (the stinger, the flick, the fork, the opening)`, (c) => draw(c).press('Mouse2').run(80));
  }
  // the cutlass's own
  const cut = (c) => lab(c).tool('sondelass', 'cutlass').pool(100);
  add('cutlass.iaido', 'sondelass', 'the iaido\'s charge: crouched, RMB held 0.43 s', (c) => cut(c).posture('crouch').hold('Mouse2').run(26));
  add('cutlass.drawCut', 'sondelass', 'the iaido\'s draw cut: crouched, RMB held 0.33 s, let go', (c) => cut(c).posture('crouch').hold('Mouse2').run(20).free('Mouse2').run(60));
  add('cutlass.bladeMode', 'sondelass', 'blade mode: crouched, RMB held through the charge; its stance, then LMB cuts along the line', (c) => cut(c).posture('crouch').hold('Mouse2').run(70).run(40).press('Mouse0').run(60).free('Mouse2').run(30));
  add('cutlass.guard', 'sondelass', 'the guard: V held 1 s', (c) => cut(c).hold('KeyV').run(60).free('KeyV').run(30));
  add('cutlass.parry', 'sondelass', 'the parry: V tapped every 0.4 s before the mortar (the rigging\'s H3)', (c) => { c.stand([-82, B, -64], Math.PI).tool('sondelass', 'cutlass'); for (let i = 0; i < 12; i++) c.press('KeyV').run(24); });
  add('cutlass.stingerFwd', 'sondelass', 'W + RMB (the loadout\'s forward special)', (c) => cut(c).hold('KeyW').press('Mouse2').run(60).free('KeyW').run(30));
  add('cutlass.stingerBack', 'sondelass', 'S + RMB (the loadout\'s back special)', (c) => cut(c).hold('KeyS').press('Mouse2').run(60).free('KeyS').run(30));
  // every row of the Sondelass's melee loadout catalogue (sondelassloadout.js SONDELASS_MOVES, read from the engine as the game built it),
  // each played once by the engine itself from standing: a move added to the catalogue is audited with no line here
  const catalogue = window.__game?.game?.techs?.get('sondelass')?.cutlass?.moves?.S?.catalogue || {};
  for (const r of Object.values(catalogue)) add(`cutlass.row.${r.id}`, 'sondelass', `the loadout's ${r.kind} ${r.id} (${r.clip}), played by the engine`, (c) => {
    const M = cut(c).sond().cutlass.moves, k = c.sond().cutlass;
    const ok = r.kind === 'special' ? (r.wraps ? M.S.wraps?.[r.wraps]?.(r, { paid: false }) : M.begin(r.id, 'special')) : M.begin(r.id, 'ground', 0);
    if (!ok) throw new Error(`the engine would not begin ${r.id}`);
    c.run(2).until(() => !M.cur && !k.stinging, 240).run(20);
  });
  // (the Sondelass's slide: a sprint with the cutlass drawn into the core slide (C), held, and out of it: tools/sondelass/sondelassslide.js)
  add('cutlass.slide', 'sondelass', 'the cutlass drawn, a sprint into the slide (C)', (c) => cut(c).hold('KeyW', 'ShiftLeft').warm(45).press('KeyC').run(70));
  add('cutlass.slideHeld', 'sondelass', 'the cutlass drawn, a sprint into the slide, C held to its end and up', (c) => cut(c).hold('KeyW', 'ShiftLeft').warm(45).hold('KeyC').run(80).free('KeyC').run(40));
  add('cutlass.counter', 'sondelass', 'the guard up, then LMB: the counter (the spin slash)', (c) => cut(c).hold('KeyV').run(20).press('Mouse0').run(60).free('KeyV').run(20));

  // ---------------------------------------------------------------- the emotes (the list read from courier/emotes.js by poseaudit.mjs)
  for (const id of window.__paEmotes || []) add(`emote.${id}`, 'emotes', `/${id}`, (c) => {
    lab(c);
    const E = c.g.techs.get('emote'), r = E.request(id);
    if (r !== true) throw new Error(`/${id}: ${r}`);
    c.until(() => E.active, 60);
    c.until(() => !E.active || E.phase === 'loop', 600);
    if (E.active) { c.run(150); E.stop(); c.until(() => !E.active, 360); }
    c.run(10);
  }, { social: true });

  // (the shatter last: it takes them to the Shrine)
  return S.sort((a, b) => (a.last ? 1 : 0) - (b.last ? 1 : 0));
})();
