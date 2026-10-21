// ---------------------------------------------------------------------------------------
// THE LEGS, CHECKED (docs/plans/RAIL-OVERHAUL.md sections 2, 5 and 6; src/progress/rail/legs.js): every leg's schedule, at every Figment
// class, stormed and not, held to the pacing law and the budgets, before the runtime plays it. One PASS/FAIL line a check, as the sweeps.
//   - the phases add to the leg's bars, and agree with the bars Wanda's cues share (RAIL-OVERHAUL.md section 6, "Each leg's phases");
//   - the flow (RAIL-FLOW.md, the owner's dead air of 2026-10-21): never two empty beats in a row, a good player killing as foes come and
//     the floor pulling the next wave forward (legs.js `deadBeats`); every wave's role flies in the view its phase is in;
//   - every pattern named is in the library, and fair as the leg fires it (its overrides, in its view's mode);
//   - the shots in flight at once stay under the budget (400 at a heavy peak, 60 in a calm), stormed included.
// `node scripts/legs.mjs`
// ---------------------------------------------------------------------------------------
import { LEGS, schedule, deadBeats, STRETCH, SWING_CLEAR, SWING_BREATH, CARRIER_AT } from '../src/progress/rail/legs.js';
import { ROSTER } from '../src/progress/rail/showcase.js';
import { CHARYBDIS, charybdisHurt, WAVES, BOSS, PIRATES, LEVIATHAN } from '../src/progress/rail/setpieces.js';
import { PATTERNS, emit, fair, children } from '../src/progress/rail/patterns.js';

let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const BAR = 1.5, WANDA0 = { shoal: [8, 18, 18, 4], wreckers: [8, 20, 24, 4], leviathan: [8, 24, 28, 4], eyewall: [8, 12, 16, 4], graveyard: [8, 18, 18, 4], maelstrom: [8, 12, 24, 4], bounty: [8, 20, 24, 4], calm: [8, 12, 0, 4] };
const WANDA = Object.fromEntries(Object.entries(WANDA0).map(([k, v]) => [k, v.map((n) => n * STRETCH)])); // (doubled: the owner, R17; Wanda's cues to follow)
const lasting = (name, params) => { const s = emit(name, params, { origin: [0, 0, 0], aim: [0, 0, -1] }); return (s.length ? s[s.length - 1].at : 0) + 1; };
// each pattern judged as the leg runner throws it (progress/rail/legs.js CARRIER_AT): from its view's hold at a ship resting at (0, 3, 0),
// in a plane view with the aim on the plane (up: the side view's +x, else +y), the owner's crossing bugs of 2026-10-20
const SHIP = [0, 3, 0], upOf = (view) => (view === 'side' ? [1, 0, 0] : [0, 1, 0]);
const ctxOf = (mode, view) => {
  const origin = CARRIER_AT[view]?.at || CARRIER_AT.chase.at, up = upOf(view); let aim = SHIP.map((x, i) => x - origin[i]);
  if (mode === 'plane') { const d = aim[0] * up[0] + aim[1] * up[1] + aim[2] * up[2]; aim = aim.map((x, i) => x - up[i] * d); }
  return { origin, aim, mode, up, range: Math.hypot(...aim) };
};

for (const [type, L] of Object.entries(LEGS)) {
  const ph = ['open', 'build', 'peak', 'release'].map((k) => L.phases[k]);
  check(`${type}: the phases make its bars and Wanda's split`, ph.reduce((a, b) => a + b, 0) === L.bars && ph.join() === WANDA[type].join(), `${ph.join('/')} of ${L.bars}`);
  const names = [...new Set(L.cues.filter((c) => c.pattern).map((c) => c.pattern.name))];
  check(`${type}: every phase's view is one of the five views`, ['open', 'build', 'peak', 'release'].every((k) => ['chase', 'above', 'side', 'free', 'astern'].includes(L.views[k])), L.views); // (casebook 150: v133's views went through the stretch and came out NaN)
  check(`${type}: every pattern is in the library`, names.every((n) => PATTERNS[n]), names.filter((n) => !PATTERNS[n]));
  let gaps = [], unfair = [], peak = 0;
  for (const storm of [false, true]) for (let strength = 0; strength <= 3; strength++) {
    const plan = schedule(type, { strength, feel: 'grief', storm });
    gaps.push(...deadBeats(plan).runs.map(([b, n]) => `${storm ? 'storm ' : ''}s${strength} ${b}+${n} beats`));
    // the shots in flight: every shot (and its children) alive from its firing until it is 25 m past the ship (or 9 s), as the field keeps it, counted each tenth
    const live = new Float32Array(Math.ceil(plan.bars * BAR * 10) + 200);
    for (const e of plan.events) {
      if (!e.pattern) continue;
      const view = plan.phases.find((q) => q.id === e.phase)?.view, ctx = ctxOf(e.pattern.mode, view), shots = emit(e.pattern.name, e.pattern.params, ctx);
      if (!storm && strength === 1) { const F = fair(shots, { pos: ctx.origin.map((x, i) => x + ctx.aim[i]), width: 1.2 }, { ...PATTERNS[e.pattern.name].defaults, ...e.pattern.params }, e.pattern.mode === 'cone' ? 8.8 : 12, e.pattern.mode, ctx.up, ctx.origin); if (!F.ok) unfair.push(`${e.pattern.name}@${e.bar} ${view} ${JSON.stringify(F.worst)}`); }
      for (const s of shots.flatMap((x) => [x, ...children(x)])) {
        const t0 = e.bar * BAR + s.at, life = s.motion?.type === 'laser' ? (s.motion.warn + s.motion.burn) : Math.min(9, 85 / Math.max(4, s.speed)); // (the field keeps a shot until 25 m past the ship: 60 up the rail to 25 behind)
        for (let k = Math.floor(t0 * 10); k < Math.min(live.length, (t0 + life) * 10); k++) live[k]++;
      }
    }
    peak = Math.max(peak, ...live);
  }
  check(`${type}: never two empty beats in a row (every class, stormed and not)`, !gaps.length, gaps.slice(0, 6));
  { const plan = schedule(type, { strength: 1, feel: 'grief' }), V = { chase: 'C', free: 'C', above: 'O', side: 'S', astern: 'C' };
    const wrong = plan.events.filter((e) => e.wave && ROSTER[e.wave.role] && !ROSTER[e.wave.role].views.includes(V[plan.phases.find((p) => p.id === e.phase)?.view] || 'C'));
    check(`${type}: every wave's role flies in its phase's view`, !wrong.length, wrong.map((e) => `${e.wave.role}@${e.bar}`).slice(0, 4)); }
  { const plan = schedule(type, { strength: 1, feel: 'grief' }); check(`${type}: a swing is a change between two real views`, plan.swings.length <= 3 && plan.phases.every((p) => typeof p.view === 'string'), plan.swings);
    const bad = plan.events.filter((e) => e.pattern && e.pattern.kind !== 'gift' && plan.swings.some((w) => e.bar >= w - SWING_CLEAR && e.bar < w + SWING_BREATH));
    check(`${type}: no pattern fired across a swing of view (R17)`, !bad.length, bad.map((e) => `${e.pattern.name}@${e.bar}`).slice(0, 4));
    const mixed = []; for (let b = 0; b < plan.bars; b += 8) { const ks = new Set(plan.events.filter((e) => e.pattern && e.pattern.kind !== 'gift' && e.bar >= b && e.bar < b + 8).map((e) => e.pattern.kind)); if (ks.size > 1 && type !== 'graveyard') mixed.push(b); }
    check(`${type}: one world at a time (Astral or Umbral, a block of bars each)`, !mixed.length, mixed.slice(0, 4)); }
  check(`${type}: every pattern fair as the leg fires it`, !unfair.length, unfair.slice(0, 4));
  const cap = type === 'calm' ? 60 : 400;
  check(`${type}: the shots in flight under ${cap}`, peak <= cap, `${peak} at the worst tenth of a second`);
}
// Charybdis: hurt only from the world it is in; both at the surface, double; a Leviathan's hit points; the maelstrom's peak long enough
{ const H = CHARYBDIS, peak = LEGS.maelstrom.phases?.peak ?? 24;
  const ok = charybdisHurt('astral', H.rise) === 1 && charybdisHurt('umbral', H.rise) === 0 && charybdisHurt('umbral', H.depth) === 1 && charybdisHurt('astral', H.depth) === 0 && charybdisHurt('astral', 0) === H.surface && charybdisHurt('umbral', 0) === H.surface;
  console.log(`${ok ? 'PASS' : 'FAIL'} Charybdis is hurt only from the world it is in, by both at the surface`); if (!ok) fails++;
  const EXPERT = 39.5, whole = H.hp + H.eyes.count * H.eyes.hp + H.combs.count * H.combs.hp, felled = +(whole / EXPERT).toFixed(1); // (damage a bar of a scripted expert following both worlds: Petra's charybdistest)
  const fair = whole >= BOSS.shots[0] && whole <= BOSS.shots[1] && H.bars * 2 <= 24;
  console.log(`${fair ? 'PASS' : 'FAIL'} Charybdis is a boss of the boss law's size (parts and core), and turns at least three times ${JSON.stringify({ whole, expertBars: felled, bars: H.bars })}`); if (!fair) fails++;
  const B = PIRATES.brig, brig = B.hull + B.ports * B.portHp + B.rigging * B.riggingHp;
  const ok2 = brig >= BOSS.shots[0] && brig <= BOSS.shots[1];
  console.log(`${ok2 ? 'PASS' : 'FAIL'} the brig is a boss of the boss law's size ${JSON.stringify({ brig, expertBars: +(brig / EXPERT).toFixed(1) })}`); if (!ok2) fails++; }
console.log(fails ? `legs: ${fails} FAILED` : 'legs: all passed'); process.exitCode = fails ? 1 : 0;
