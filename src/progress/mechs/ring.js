// ---------------------------------------------------------------------------------------
// THE RING: A BOUT WITH A RIVAL FRAME (docs/plans/MECHS.md 9.4; South, 2026-11-02: "how about we spice things up with some of the mechanics from
// Punch-Out!! Since ostensibly you're testing against another giant robot opponent"). In the proving ground's ring your mech boxes another
// frame, Punch-Out's way: the camera behind you, the rival square in front, no walking; you dodge left or right, duck, block, and punch
// left or right, to the body or (W held) the head. A rival is a pattern of moves, each shown by a tell before it lands (a shoulder
// twitch, a crouch, a blink); answered right (dodged, ducked, blocked), it is open a beat and every punch lands harder (the counter), and
// some answers in some windows earn a STAR. Stars spent on Space throw the star punch, harder for each. Your HEARTS go down when a punch of
// yours is blocked or you are hit; at none you are winded and cannot punch until you dodge cleanly. STAMINA is the bout's shield (the
// vessel's rule: the shield first): at none you go DOWN, and the count runs; you rise by mashing, it rises at its own count; three downs
// in a round is a TKO, a count of ten a KO, both arms off a win (nothing left to box with), three rounds to a decision on points. And under it all the JOINTS (joints.js): blows strain
// them, blocks strain your own arms, and an arm can come off mid-bout (its moves gone from the pattern, Toribash's), and a snapped neck
// is Rock 'Em Sock 'Em's: the head pops on its spring and the bout is over, whatever the stamina says.
// A pure kernel: newBout, then boutStep each frame with what was pressed; the runtime (world/hangar/ring.js) draws it and feeds it, and
// the simulator (scripts/mechs.mjs) fights it with stand-ins.
//
// Prior art: Punch-Out!! (NES, 1987; Wii, 2009): tells, dodge and duck, the counter window, stars and the star punch, hearts and going
// pink, the count and mashing up, TKO on three downs, Glass Joe's taunt, Bald Bull's charge broken by a body blow, Mike Tyson's
// dynamite uppercuts in the first ninety seconds and his blink; Rock 'Em Sock 'Em Robots (the head popped up); Toribash (a limb gone
// mid-fight); Real Steel's ring; Fight Night's body and head.
//
//   PUNCH, STAR, HEARTS, COUNT, RING, RIVALS[id] = { label, line, stamina, guard, speed[round], getUp[down], gap, pattern, moves }
//   CIRCUIT [ids in order]   rivalOpen(id, L)   newBout(rivalId, { punchK, armour, seed, joints }) -> B   boutStep(B, dt, press) -> events
//   press = { punch: 'L' | 'R' | null, high: bool, dodge: 'L' | 'R' | null, duck: bool, block: bool, star: bool, mash: bool }
//   events: bout.tell { move, tell }, bout.strike { move, answered: 'dodge' | 'duck' | 'block' | null, k }, bout.punch { side, high,
//   landed, blocked, counter, k, star? }, bout.star { stars }, bout.hearts { hearts, winded }, bout.down { who, count, downs },
//   bout.count { who, n }, bout.up { who }, bout.joint { who, joint, to }, bout.round { round }, bout.over { winner, how ('ko' | 'tko' | 'head' | 'arms' | 'decision'), rounds, perfect }
// ---------------------------------------------------------------------------------------
import { newJoints, strainBlow, lockOf, headOff, armOK } from './joints.js';

/** Your punch: real s from press to landing, and the whole; its k a full blow's share (the fist's own at sync 0.5, frame.js punch times
 *  outputK, handed in by the runtime as `punchK`); DMG: stamina a full blow takes off (a stamina bar is 100); a counter's multiplier; a
 *  blocked punch's chip (a share of its damage gets through). */
export const PUNCH = { land: 0.15, time: 0.35, k: 0.55, DMG: 14, counter: 1.5, chip: 0.15, high: 1.1 };
/** Stars (Punch-Out's): at most 3; the star punch spends them all, its k multiplied by STAR.k[stars]; it winds up `windup` real s (a
 *  hit then knocks it out of you and the stars with it); a hit taken loses one. */
export const STAR = { max: 3, k: [0, 2.2, 3.4, 4.8], windup: 0.45, lose: 1 };
/** Hearts: at a round's start; lost a blocked punch and a hit; at none, winded until a clean dodge gives `back`. */
export const HEARTS = { start: 20, blocked: 1, hit: 3, back: 6 };
/** The count: a number every `tick` real s, out at `out`; to rise you mash, each press `mash` toward `rise + per x downs` (Punch-Out's
 *  "press the buttons"); a rival rises at its own count (RIVALS getUp), or not at all past its list. Three downs in a round, a TKO. */
export const COUNT = { tick: 1, out: 10, mash: 1, rise: 5, per: 4, tko: 3, back: [0.6, 0.45, 0.3] };
/** The round: real s; how many; between rounds each side gets back `rest` of what it lost; the dodge's and the duck's window (real s
 *  they last from the press, a strike inside it answered); a block halves nothing but turns a blockable move to a chip and strains your
 *  arms (by k x `blockStrain`). */
export const RING = { round: 180, rounds: 3, rest: 0.4, dodge: 0.45, dodgeCool: 0.25, duck: 0.5, blockChip: 0.2, blockStrain: 0.2 };

const M = (o) => ({ k: 0.4, windup: 1, region: 'head', answers: ['dodge', 'duck', 'block'], counter: 1, recover: 0.6, side: 'R', ...o });

/** The rivals, in the circuit's order. stamina: its bar (100 a plain one); guard: what it covers standing ('low' the body, 'high' the
 *  head: punch the other; 'both': only its openings let a punch through); speed: its moves' pace a round; getUp: the count it rises at after its 1st, 2nd, 3rd down (none: it stays down);
 *  gap: real s between moves; pattern: its moves in order, looping ('wait' a beat of nothing); moves: each its tell, windup, k, region,
 *  the answers that work, its counter window (real s it is open after being answered), whether answering it earns a star, its arm. */
export const RIVALS = {
  // THE SPARRING FRAME (Glass Joe's place): slow, its guard low, a taunt that is a gift. Hit its head while it beckons for a star.
  sparring: { label: 'Sparring frame', line: 'The gantry\'s old practice frame, rebuilt. It guards its body and leaves its head.', stamina: 140, guard: 'low',
    speed: [1, 1.1, 1.25], getUp: [3, 6, 9], gap: 1.6,
    pattern: ['jab', 'wait', 'jab', 'hook', 'wait', 'taunt'],
    moves: {
      jab: M({ tell: 'shoulder', windup: 0.9, k: 0.35, side: 'L' }),
      hook: M({ tell: 'cock', windup: 1.4, k: 0.6, answers: ['dodge', 'duck'], counter: 1.4, star: true }),
      taunt: M({ tell: 'beckon', windup: 2.4, k: 0, taunt: true, recover: 0 }), // (no blow: its guard down while it beckons; a head punch then is a star)
    } },
  // THE HEAVY FRAME (Bald Bull's place): big blows, a charge from the far ropes that one body blow in its last moment puts down at once.
  heavy: { label: 'Heavy frame', line: 'A tank frame on legs. It covers up between blows, and hops back three times before it charges.', stamina: 240, guard: 'both',
    speed: [1, 1.1, 1.2], getUp: [4, 7], gap: 1.3,
    pattern: ['jab', 'jab', 'uppercut', 'wait', 'jab', 'hook', 'charge'],
    moves: {
      jab: M({ tell: 'shoulder', windup: 0.75, k: 0.45 }),
      hook: M({ tell: 'cock', windup: 1.1, k: 0.75, answers: ['dodge', 'duck'], side: 'L' }),
      uppercut: M({ tell: 'crouch', windup: 1.2, k: 0.95, answers: ['dodge'], counter: 1.3, star: true }),
      charge: M({ tell: 'hops', windup: 2.6, k: 1.4, region: 'core', answers: ['dodge'], counter: 1.5, breakOn: { window: 0.35, high: false } }), // (a body punch landing in its last 0.35 real s: down at once)
    } },
  // THE CHAMPION FRAME (Mike Tyson's place): for its first 90 real s only uppercuts that can take your head off in two; it blinks first.
  champion: { label: 'Champion frame', line: 'It has never been knocked down. It covers up between blows, and blinks before it throws.', stamina: 260, guard: 'both',
    speed: [1.05, 1.15, 1.3], getUp: [5, 8], gap: 0.9, opening: { secs: 90, pattern: ['dynamite', 'wait', 'dynamite', 'dynamite', 'wait'] },
    pattern: ['jab', 'jab', 'flurry', 'hook', 'wait', 'dynamite', 'jab', 'feint'],
    moves: {
      jab: M({ tell: 'shoulder', windup: 0.6, k: 0.45 }),
      hook: M({ tell: 'cock', windup: 0.9, k: 0.8, answers: ['dodge', 'duck'], side: 'L', counter: 0.9 }),
      flurry: M({ tell: 'shoulder', windup: 0.5, k: 0.3, hits: 4, every: 0.32 }), // (four jabs, each answered on its own)
      dynamite: M({ tell: 'blink', windup: 0.75, k: 2, answers: ['dodge'], counter: 0.8, star: true }), // (k 2 on the neck: fractured in one, snapped by the next)
      feint: M({ tell: 'blink', windup: 0.75, k: 0, feint: true, recover: 0.2 }), // (the blink with nothing after: dodge it and you are the one open)
    } },
  // THE SHADOW FRAME (Punch-Out!!'s dream fight, Mr. Dream after Tyson; MECHS.md 11.4): the secret fourth, every move of the three before it in
  // one frame, quicker. It is never on the ladder's card until the champion is down and you have once won a bout untouched (`secret`).
  shadow: { label: 'Shadow frame', line: 'A frame with no colours. It boxes like all three before it, a little quicker.', stamina: 340, guard: 'both',
    speed: [1.1, 1.2, 1.35], getUp: [6, 9], gap: 0.8, secret: ['mech.bout.perfect', 1],
    opening: { secs: 60, pattern: ['charge', 'wait', 'dynamite', 'flurry', 'dynamite', 'wait'] },
    pattern: ['jab', 'hook', 'flurry', 'wait', 'uppercut', 'feint', 'dynamite', 'jab', 'charge', 'taunt'],
    moves: {
      jab: M({ tell: 'shoulder', windup: 0.55, k: 0.45 }),
      hook: M({ tell: 'cock', windup: 0.85, k: 0.8, answers: ['dodge', 'duck'], side: 'L', counter: 0.9 }),
      flurry: M({ tell: 'shoulder', windup: 0.45, k: 0.3, hits: 5, every: 0.3 }),
      uppercut: M({ tell: 'crouch', windup: 1, k: 0.95, answers: ['dodge'], counter: 1.1, star: true }),
      charge: M({ tell: 'hops', windup: 2.2, k: 1.4, region: 'core', answers: ['dodge'], counter: 1.3 }), // (no break on its charge: it learned from the heavy frame)
      dynamite: M({ tell: 'blink', windup: 0.7, k: 2, answers: ['dodge'], counter: 0.8, star: true }),
      feint: M({ tell: 'blink', windup: 0.7, k: 0, feint: true, recover: 0.2 }),
      taunt: M({ tell: 'beckon', windup: 1.8, k: 0, taunt: true, recover: 0 }), // (its one gift: a head punch while it beckons is a star)
    } },
};
export const CIRCUIT = ['sparring', 'heavy', 'champion', 'shadow'];
/** Is a rival open: the first always, each next once the one before it is beaten (the circuit's ladder, a ledger predicate); a rival with
 *  a `secret` also wants that count ([key, n]) before it is offered at all. */
export const rivalOpen = (id, L) => {
  const i = CIRCUIT.indexOf(id), S = RIVALS[id]?.secret;
  if (i < 0) return false; if (i === 0) return true;
  return (L?.get?.(`mech.bout.won.${CIRCUIT[i - 1]}`) || 0) >= 1 && (!S || (L?.get?.(S[0]) || 0) >= S[1]);
};

const side0 = () => ({ stamina: 100, max: 100, joints: newJoints(), downs: 0, downsAll: 0, state: 'ready', t: 0, landed: 0, taken: 0, points: 0 });

/** A new bout against a rival (its id), your punch's k from the frame (the runtime's), your armour (frame.js stats.armour, a region's),
 *  your frame's own joints (mechstate's: a bout's damage stays on the frame until mended at the gantry). */
export function newBout(rivalId, { punchK = PUNCH.k, armour = {}, seed = 1, joints = null } = {}) {
  const R = RIVALS[rivalId]; if (!R) return null;
  const me = { ...side0(), ...(joints ? { joints } : {}), hearts: HEARTS.start, stars: 0, winded: false, dodgeSide: null, cool: 0, mash: 0, punchSide: null, punchHigh: false, starring: false };
  const foe = { ...side0(), stamina: R.stamina, max: R.stamina, pat: 0, move: null, hit: 0, open: 0, gap: R.gap, taunting: false };
  let a = seed >>> 0; const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; // (the bout's own dice: which arm a block strains)
  return { id: rivalId, R, round: 1, t: 0, punchK, armour, me, foe, over: null, perfect: true, r };
}

const ev = (out, type, o) => out.push({ type, ...o });
/** The foe's live moves: those whose arm is still on (Toribash: an arm gone, its moves struck from the pattern). */
const hasArm = (J, side) => armOK(J, side);
function nextMove(B) {
  const R = B.R, F = B.foe, open = R.opening && B.round === 1 && B.t < R.opening.secs, P = open ? R.opening.pattern : R.pattern;
  for (let n = 0; n < P.length; n++) {
    const id = P[F.pat++ % P.length]; if (id === 'wait') return 'wait';
    const m = R.moves[id]; if (m.k === 0 || hasArm(F.joints, m.side)) return id;
  }
  return 'wait';
}

/** A blow on a side: its stamina (the bout's shield) first, then its joints; a hit's events. */
function blowOn(B, who, k, region, out) {
  const S = B[who], arm = who === 'me' ? (B.armour[region] ?? 1) : 1;
  S.stamina = Math.max(0, S.stamina - k * PUNCH.DMG * arm);
  for (const c of strainBlow(S.joints, region, k, arm)) ev(out, 'bout.joint', { who, ...c });
  if (headOff(S.joints)) return end(B, who === 'me' ? 'foe' : 'me', 'head', out);
  if (!armOK(S.joints, 'L') && !armOK(S.joints, 'R')) return end(B, who === 'me' ? 'foe' : 'me', 'arms', out); // (both arms off: nothing left to box with, Toribash's)
  if (S.stamina <= 0) down(B, who, out);
}
function down(B, who, out) {
  const S = B[who]; S.state = 'down'; S.t = 0; S.mash = 0; S.downs++; S.downsAll++; S.count = 0;
  if (who === 'me') { B.perfect = false; B.me.stars = 0; } else B.me.points += 10;
  ev(out, 'bout.down', { who, downs: S.downs });
  if (S.downs >= COUNT.tko) end(B, who === 'me' ? 'foe' : 'me', 'tko', out);
}
function end(B, winner, how, out) {
  if (B.over) return;
  B.over = { winner, how, rounds: B.round, perfect: winner === 'me' && B.perfect };
  ev(out, 'bout.over', { ...B.over, rival: B.id });
}

/** One step of the bout: real s `dt`, what was pressed this frame. */
export function boutStep(B, dt, press = {}) {
  const out = []; if (B.over) return out;
  const R = B.R, me = B.me, F = B.foe, speed = R.speed[Math.min(B.round, R.speed.length) - 1];
  B.t += dt;
  // the round's bell
  if (B.t >= RING.round) {
    if (B.round >= RING.rounds) { const w = me.points > F.points ? 'me' : 'foe'; end(B, w, 'decision', out); return out; }
    B.round++; B.t = 0; me.downs = 0; F.downs = 0;
    for (const S of [me, F]) { S.stamina += (S.max - S.stamina) * RING.rest; S.state = 'ready'; S.t = 0; }
    F.move = null; F.pat = 0; me.hearts = HEARTS.start; me.winded = false;
    ev(out, 'bout.round', { round: B.round }); return out;
  }
  // a side down: the count, and rising
  for (const who of ['me', 'foe']) {
    const S = B[who]; if (S.state !== 'down') continue;
    S.t += dt; const n = Math.floor(S.t / COUNT.tick);
    if (n > S.count) { S.count = n; ev(out, 'bout.count', { who, n }); if (n >= COUNT.out) { end(B, who === 'me' ? 'foe' : 'me', 'ko', out); return out; } }
    if (who === 'me' && press.mash) S.mash += COUNT.mash;
    const up = who === 'me' ? S.mash >= COUNT.rise + COUNT.per * (S.downs - 1) : R.getUp[S.downs - 1] != null && S.count >= R.getUp[S.downs - 1];
    if (up) { S.state = 'ready'; S.t = 0; S.stamina = S.max * COUNT.back[Math.min(S.downs, COUNT.back.length) - 1]; if (who === 'foe') { F.move = null; F.gap = R.gap; } ev(out, 'bout.up', { who }); }
  }
  if (me.state === 'down' || F.state === 'down') return out;

  // you: dodge, duck, block, punch, the star punch
  me.cool = Math.max(0, me.cool - dt);
  if (me.state === 'dodge' || me.state === 'duck') { me.t -= dt; if (me.t <= 0) { me.state = 'ready'; me.cool = RING.dodgeCool; } }
  if (me.state === 'punch') {
    me.t += dt;
    const landAt = me.starring ? STAR.windup : PUNCH.land;
    if (!me.landedNow && me.t >= landAt) { me.landedNow = true; myPunchLands(B, out); if (B.over) return out; }
    if (me.t >= (me.starring ? STAR.windup + PUNCH.time : PUNCH.time)) { me.state = 'ready'; me.starring = false; }
  }
  if (me.state === 'ready' || me.state === 'block') {
    me.state = press.block ? 'block' : 'ready';
    if (press.dodge && !me.cool) { me.state = 'dodge'; me.dodgeSide = press.dodge; me.t = RING.dodge; }
    else if (press.duck && !me.cool) { me.state = 'duck'; me.t = RING.duck; }
    else if (press.star && me.stars > 0 && !me.winded) { me.state = 'punch'; me.t = 0; me.landedNow = false; me.starring = true; me.punchHigh = true; me.punchSide = hasArm(me.joints, 'R') ? 'R' : 'L'; }
    else if (press.punch && !me.winded && hasArm(me.joints, press.punch)) { me.state = 'punch'; me.t = 0; me.landedNow = false; me.starring = false; me.punchSide = press.punch; me.punchHigh = !!press.high; }
  }

  // the rival: a gap, a tell and windup, the strike, open or recovering
  if (!F.move) { F.gap -= dt * speed; if (F.gap <= 0) { const id = nextMove(B); if (id === 'wait') F.gap = R.gap; else { F.move = id; F.phase = 'windup'; F.t = 0; F.hit = 0; F.taunting = !!R.moves[id].taunt; ev(out, 'bout.tell', { move: id, tell: R.moves[id].tell }); } } return out; }
  const m = R.moves[F.move]; F.t += dt * speed;
  if (F.phase === 'windup' && F.t >= m.windup) {
    if (m.taunt || m.feint) { F.taunting = false; endMove(B, m.recover, 'recover'); return out; } // (a feint lands nothing: a dodge spent on it is a dodge cooling when the real one comes)
    strike(B, m, out); if (B.over) return out;
    F.hit++;
    if (m.hits && F.hit < m.hits) { F.t = m.windup - m.every; return out; } // (a flurry: the next jab of it after `every`)
    if (F.phase === 'windup') endMove(B, m.recover, 'recover');
  } else if ((F.phase === 'open' || F.phase === 'recover') && F.t >= F.until) { F.move = null; F.phase = null; F.gap = R.gap; }
  return out;
}

function endMove(B, secs, phase) { const F = B.foe; F.phase = phase; F.t = 0; F.until = secs; if (!secs) { F.move = null; F.gap = B.R.gap; } }

/** A rival's blow arriving: answered by your dodge, duck or block if its move takes that answer; answered, it is open its counter window. */
function strike(B, m, out) {
  const me = B.me, F = B.foe;
  const answered = me.state === 'dodge' && m.answers.includes('dodge') ? 'dodge' : me.state === 'duck' && m.answers.includes('duck') ? 'duck' : me.state === 'block' && m.answers.includes('block') ? 'block' : null;
  const k = m.k * (lockOf(F.joints, m.side === 'L' ? 'armL' : 'armR') || 1);
  ev(out, 'bout.strike', { move: F.move, answered, k: +k.toFixed(2) });
  if (answered === 'dodge' || answered === 'duck') {
    if (me.winded) { me.winded = false; me.hearts = HEARTS.back; ev(out, 'bout.hearts', { hearts: me.hearts, winded: false }); }
    F.phase = 'open'; F.t = 0; F.until = m.counter; F.starOpen = !!m.star; F.breakable = null; return;
  }
  if (answered === 'block') {
    blowOn(B, 'me', k * RING.blockChip, m.region, out);
    for (const c of strainBlow(me.joints, B.r() < 0.5 ? 'armL' : 'armR', k * RING.blockStrain, 1, 0)) ev(out, 'bout.joint', { who: 'me', ...c }); // (the block's cost is your arms' joints, no threshold)
    return;
  }
  B.perfect = false; me.taken++;
  me.hearts = Math.max(0, me.hearts - HEARTS.hit); if (me.stars) { me.stars = Math.max(0, me.stars - STAR.lose); ev(out, 'bout.star', { stars: me.stars }); }
  if (me.state === 'punch' && me.starring) { me.state = 'ready'; me.starring = false; me.stars = 0; } // (hit out of the star punch: its stars with it)
  if (!me.hearts && !me.winded) { me.winded = true; ev(out, 'bout.hearts', { hearts: 0, winded: true }); }
  blowOn(B, 'me', k, m.region, out);
}

/** Your punch arriving: blocked by its guard where it covers (unless it is open, recovering, taunting, or winding up a charge's last
 *  moment to the body: the charge broken), landed with a counter's weight while it is open, a star for a head punch on a taunt or the
 *  first in a starred opening. */
function myPunchLands(B, out) {
  const me = B.me, F = B.foe, R = B.R, m = F.move && R.moves[F.move];
  const high = me.punchHigh, region = high ? 'head' : 'core', star = me.starring;
  let k = B.punchK * (high ? PUNCH.high : 1) * (lockOf(me.joints, me.punchSide === 'L' ? 'armL' : 'armR') || 0);
  if (star) { k *= STAR.k[me.stars]; me.stars = 0; ev(out, 'bout.star', { stars: 0 }); }
  const open = F.phase === 'open' || F.taunting; // (only answered moves open it: a rival that just hit you is not waiting for you)
  const breaks = m?.breakOn && F.phase === 'windup' && !high && m.windup - F.t <= m.breakOn.window;
  const guarded = !open && !breaks && (R.guard === 'both' || (R.guard === 'high' ? high : !high));
  if (guarded) {
    me.hearts = Math.max(0, me.hearts - HEARTS.blocked); ev(out, 'bout.punch', { side: me.punchSide, high, landed: false, blocked: true, k: 0 });
    if (!me.hearts && !me.winded) { me.winded = true; ev(out, 'bout.hearts', { hearts: 0, winded: true }); }
    F.stamina = Math.max(1, F.stamina - k * PUNCH.DMG * PUNCH.chip);
    for (const c of strainBlow(F.joints, B.r() < 0.5 ? 'armL' : 'armR', k * RING.blockStrain, 1, 0)) ev(out, 'bout.joint', { who: 'foe', ...c }); // (its guard pounded on: its arms' joints)
    if (!armOK(F.joints, 'L') && !armOK(F.joints, 'R')) end(B, 'me', 'arms', out);
    return;
  }
  const counter = F.phase === 'open';
  if (counter) k *= PUNCH.counter;
  if ((F.taunting && high) || (counter && F.starOpen)) { F.starOpen = false; if (me.stars < STAR.max) { me.stars++; ev(out, 'bout.star', { stars: me.stars }); } }
  me.landed++; me.points += 1;
  ev(out, 'bout.punch', { side: me.punchSide, high, landed: true, blocked: false, counter, k: +k.toFixed(2), star, broke: !!breaks });
  if (breaks) { F.move = null; F.phase = null; F.stamina = 0; blowOn(B, 'foe', 0, 'core', out); if (B.foe.state !== 'down') down(B, 'foe', out); return; } // (Bald Bull's: the charge broken by one body blow)
  if (F.taunting) { F.taunting = false; F.move = null; F.gap = R.gap; }
  blowOn(B, 'foe', k, region, out);
}
