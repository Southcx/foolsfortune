// ---------------------------------------------------------------------------------------
// THE CROSSING, SIMULATED (docs/plans/RAIL.md): plays the rail shooter's score (src/progress/rail/) bar by bar against three players
// (novice, good, expert), many times, and says what each meets: the threat a bar (is there a breather, is the set piece the peak?),
// the hits taken against the six the ship bears, the share downed, the score, the rank and the medal, what the pirates are worth to a
// cargo, how often the Leviathan is felled. It also checks the score's rules: everything on a bar line, nothing entering during a
// swing. A model, not the game: its assumptions are the PROFILES and the per-bar fire rates below, and the game measured in play
// (the ledger) is the truth that corrects them.
//
// Prior art: Machinations-style economy runs (the house's scripts/economy.mjs), and the shmup designer's density chart (Cave's stage
// timelines, Treasure's Radiant Silvergun chapter charts): a stage drawn as threat over time before it is built.
//
//   node scripts/rail.mjs            the report        node scripts/rail.mjs --par    also the par each set piece should carry (score.js)
//   node scripts/rail.mjs --runs 500 fewer runs        exits 1 when a rule of the score is broken
// ---------------------------------------------------------------------------------------
import { BARS, BAR_S, SWING, ACTS, SET_PIECES, script, swings } from '../src/progress/rail/crossing.js';
import { WAVES, SHOAL, PIRATES, LEVIATHAN, LANCE, leviathanDeck } from '../src/progress/rail/setpieces.js';
import { SCORE, chain, chainDown, volleyBonus, downScore, rankOf, medalOf, PAR } from '../src/progress/rail/score.js';
import { STAGE } from '../src/progress/econ/emocean.js';

const args = process.argv.slice(2);
const RUNS = +(args[args.indexOf('--runs') + 1] || 0) || 2000;
const SHOW_PAR = args.includes('--par');

// ---- a seeded stream (mulberry32), so the report is the same twice
let seed = 0x9e3779b9;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const binom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; };

// ---- the players. acc: share of shots that land; dodge: share of plain shots avoided; parry: share of outlined shots sent back;
// flip: how well polarity is kept on the feeling coming in (absorbs); lock: share of bars a volley is released when the pool allows;
// engage: how many targets a bar can be aimed at (the rest pass by unshot); order: chance the next down keeps a chain; pb: share of downs at point blank; roll: share of telegraphed blows avoided.
const PROFILES = {
  novice: { engage: 2, acc: 0.35, dodge: 0.86, parry: 0.1, flip: 0.0, lock: 0.25, order: 0.4, pb: 0.05, roll: 0.55 },
  good:   { engage: 4, acc: 0.6,  dodge: 0.93, parry: 0.4, flip: 0.5, lock: 0.6,  order: 0.65, pb: 0.15, roll: 0.75 },
  expert: { engage: 7, acc: 0.85, dodge: 0.97, parry: 0.75, flip: 0.9, lock: 0.9, order: 0.92, pb: 0.3, roll: 0.92 },
};
// a blow with a bar or more of warning (a breach, a broadside, a ram, a fin) is avoided more often than a plain roll
const big = (P) => P.roll + (1 - P.roll) * 0.5;
const SHOTS_PER_BAR = 16; // (full auto: a shot each sixteenth note)
const HP = WAVES.hp, STAY = WAVES.stay, FIRE = WAVES.fire, OUTLINED = WAVES.outlined; // (the authored waves: setpieces.js)
const POOL = { max: 100, start: 60, regen: 2 }; // (Lachryma: the lances' purse; regen a bar)
const ASPECTS = ['wonder', 'desire', 'grief']; // (Anagami's grades: the feelings the sea fires)

// ---- the rules of the score, checked
function rules(enc) {
  const s = script('anagami', 'margarite', 3, { casks: enc === 'pirates' ? 8 : 0, leviathan: enc === 'leviathan' });
  const bad = [];
  if (s.setPiece !== enc) bad.push(`asked for ${enc}, got ${s.setPiece}`);
  const sw = swings(enc);
  const enters = [...s.waves.map((w) => ['wave', w.bar, w.at * BARS]), ...s.beats.map((b) => ['beat', b.bar, b.bar])];
  for (const [what, bar, exact] of enters) {
    if (Math.abs(exact - Math.round(exact)) > 1e-9) bad.push(`${what} at ${exact} is off the bar line`);
    for (const x of sw) if (bar >= x.bar - SWING.bars && bar < x.bar) bad.push(`${what} at bar ${bar} enters during the swing to ${x.to} (bars ${x.bar - SWING.bars}..${x.bar})`);
  }
  if (Math.abs(BARS * BAR_S - STAGE.seconds) > 1e-9) bad.push(`the bars (${BARS} x ${BAR_S}) are not the stage's ${STAGE.seconds} s`);
  return { s, sw, bad };
}

// ---- one crossing
function run(enc, P, danger = -0.5) {
  const S = rules(enc).s;
  const st = { hits: 0, bites: 0, downed: 0, spawned: 0, score: 0, pool: POOL.start, ch: chain(), chainBest: 0, volleyBest: 0, parried: 0, absorbed: 0, failed: false, end: null, casks: 0, threat: new Array(BARS).fill(0) };
  const live = []; // { role, cls, hp, until, aspect }
  const enter = (role, cls, n, bar) => { for (let i = 0; i < n; i++) live.push({ role, cls, hp: HP[cls], until: bar + STAY[role], aspect: ASPECTS[Math.floor(rnd() * ASPECTS.length)] }); st.spawned += n; };
  const down = (t, opts = {}) => { if (!opts.fish) st.downed++; st.fishDown = (st.fishDown || 0) + (opts.fish ? 1 : 0); st.score += downScore({ cls: t.cls, pointBlank: rnd() < P.pb, returned: !!opts.returned }); if (opts.fish) return; const keep = rnd() < P.order; const bonus = chainDown(st.ch, keep && st.ch.aspect ? st.ch.aspect : t.aspect); st.score += bonus; st.chainBest = Math.max(st.chainBest, bonus); };
  const hurt = (n = 1) => { if (st.failed) return; st.hits += n; if (st.hits >= STAGE.bears) st.failed = true; };
  // incoming: n shots, `outl` share parryable; polarity absorbs the share of matching feeling the player keeps up with
  const incoming = (n, outl, bar) => {
    st.threat[bar] += n;
    for (let i = 0; i < n; i++) {
      if (rnd() < (1 / ASPECTS.length) + P.flip * (1 - 1 / ASPECTS.length) * 0.5) { st.absorbed++; st.score += SCORE.absorb; st.pool = Math.min(POOL.max, st.pool + 2); continue; }
      if (rnd() < outl && rnd() < P.parry) { st.parried++; const t = live.find((x) => x.hp > 0); if (t) { t.hp -= 3; if (t.hp <= 0) down(t, { returned: true }); } continue; }
      if (rnd() > P.dodge) hurt();
    }
  };
  // the player's fire this bar at what lives (lowest hp first: what is about to go), and a volley when it can
  const shoot = (bar, extraTargets = null) => {
    let dmg = binom(SHOTS_PER_BAR, P.acc);
    if (st.pool >= 8 * 3 && rnd() < P.lock / 2) { // (a volley every other bar at most)
      const targets = live.filter((t) => t.hp > 0).slice(0, 8), n = targets.length;
      if (n) { st.pool -= n * 3; let d = 0; for (const t of targets) if (rnd() < 0.5 + P.acc / 2) { t.hp -= LANCE; if (t.hp <= 0) { down(t); d++; } } const b = volleyBonus(n, d); st.score += b; st.volleyBest = Math.max(st.volleyBest, n === d ? n : 0); }
    }
    if (extraTargets) dmg = extraTargets(dmg);
    for (const t of live.filter((x) => x.hp > 0).sort((a, b) => a.hp - b.hp).slice(0, P.engage)) { if (dmg <= 0) break; const k = Math.min(dmg, t.hp); t.hp -= k; dmg -= k; if (t.hp <= 0) down(t); }
    st.pool = Math.min(POOL.max, st.pool + POOL.regen);
    return dmg;
  };

  // ---- the set piece's own state
  const E = { fish: 0, caller: SHOAL.caller.hp, scatterUntil: -1, hull: PIRATES.brig.hull, rig: PIRATES.brig.rigging * PIRATES.brig.riggingHp, ports: PIRATES.brig.ports * PIRATES.brig.portHp, gills: LEVIATHAN.gills.count * LEVIATHAN.gills.hp, throat: 0, stolen: 0 };
  const cls0 = Math.max(0, Math.round(danger / 2 + 0.5));
  for (let bar = 0; bar < BARS && !st.failed; bar++) {
    for (const w of S.waves) if (w.bar === bar) enter(w.role, w.cls, w.count, bar);
    for (let i = live.length - 1; i >= 0; i--) if (live[i].until <= bar || live[i].hp <= 0) live.splice(i, 1);
    for (const t of live) incoming(binom(1, Math.min(1, FIRE[t.role])) + (FIRE[t.role] > 1 ? Math.floor(FIRE[t.role]) - 1 : 0), OUTLINED[t.role], bar);
    let spare = shoot(bar, null);
    if (enc === 'shoal' && bar >= 62 && bar < 84) {
      if (bar === 62) { E.fish = SHOAL.count(cls0); st.spawned += 1; } // (the caller counts toward the medal; the fish are one body and do not)
      else if (E.caller > 0) E.fish += SHOAL.reinforce.perBar;
      const striking = bar >= 70 && bar > E.scatterUntil && E.fish > 0;
      if (striking) {
        for (let p = 0; p < 1 / SHOAL.frenzy.every; p++) {
          const g = Math.min(E.fish, SHOAL.frenzy.group(cls0)); st.threat[bar] += g;
          // a strike group is read a quarter bar ahead: dodged as a telegraphed blow; what lands bites
          const land = binom(g, 1 - P.roll); st.bites += land; while (st.bites >= SHOAL.bite.perHit) { st.bites -= SHOAL.bite.perHit; hurt(); }
        }
      }
      // inside the ball every shot finds a fish: spare damage and a share of aimed fire go to the fish; the caller at the expert's pace
      const into = bar < 70 ? 0 : Math.min(E.fish, spare + binom(SHOTS_PER_BAR, P.acc * 0.5)); // (under the crude until the ball forms at 70: only the caller, by lance, can be reached)
      E.fish -= into; for (let i = 0; i < into; i++) down({ cls: cls0 }, { fish: true });
      if (E.caller > 0 && bar >= 62 && rnd() < P.lock * 0.5) { E.caller -= LANCE; if (E.caller <= 0) { st.downed++; st.score += SCORE.end.scattered; E.scatterUntil = bar + SHOAL.scatter.bars; st.end = 'scattered'; } }
    }
    if (enc === 'pirates' && bar >= 62 && bar < 96 && !E.done) {
      if (bar < 70 && bar % PIRATES.chaser.every === 0) { st.threat[bar] += 1; if (rnd() < P.parry) { st.parried++; E.hull -= PIRATES.chaser.returned; } else if (rnd() > P.dodge) hurt(); }
      if (bar >= 70 && bar < 84) {
        if (bar % PIRATES.broadside.every === 0) { const open = Math.ceil(E.ports / PIRATES.brig.portHp); st.threat[bar] += open * PIRATES.broadside.shotsPerPort; if (rnd() < (open / PIRATES.brig.ports) * (1 - big(P))) hurt(); }
        if (bar % PIRATES.boarders.every === 1) { for (let i = 0; i < PIRATES.boarders.count; i++) { st.spawned++; if (rnd() < Math.min(1, P.acc + 0.25)) { st.downed++; st.score += SCORE.part.boarder; } else E.stolen += PIRATES.boarders.steals; } }
        // aimed fire: ports first (they hurt), then rigging by volley, then the hull
        let d = spare + binom(SHOTS_PER_BAR, P.acc * 0.6);
        const hitPart = (k, per, pay) => { const before = Math.ceil(E[k] / per); const take = Math.min(E[k], d); E[k] -= take; d -= take; const after = Math.ceil(E[k] / per); st.score += (before - after) * pay; };
        hitPart('ports', PIRATES.brig.portHp, SCORE.part.port); if (rnd() < P.lock) d += LANCE * 4; hitPart('rig', PIRATES.brig.riggingHp, SCORE.part.rigging); E.hull -= d;
      } else if (bar >= 84) { E.hull -= binom(SHOTS_PER_BAR, P.acc * 0.7); if (bar === 85 && E.hull > 0 && rnd() > big(P)) hurt(PIRATES.ram.hits); }
      if (E.hull <= 0) { E.done = true; st.end = 'sunk'; st.score += SCORE.end.sunk; st.casks += PIRATES.loot.sunk; }
      else if (bar === 92) { E.done = true; if (E.rig <= 0) { st.end = 'struck'; st.score += SCORE.end.struck; st.casks += PIRATES.loot.struck; } else st.end = 'limped'; }
    }
    if (enc === 'leviathan' && bar >= 62 && bar < 96 && !E.done) {
      if (bar === 64) { st.threat[bar] += 4; if (rnd() > big(P)) hurt(LEVIATHAN.breach.hits); }
      if (bar === LEVIATHAN.sound.at) { st.threat[bar] += 4; if (rnd() > big(P)) hurt(LEVIATHAN.sound.hits); }
      const abreast = bar >= 70 && bar < 80, maw = bar >= 88;
      if (abreast && bar % LEVIATHAN.fin.every === 0) { st.threat[bar] += 2; if (rnd() > big(P)) hurt(LEVIATHAN.fin.hits); }
      if (abreast || maw) { st.threat[bar] += 1; if (rnd() < P.parry) { st.parried++; if (maw) E.throat++; else E.gills -= LEVIATHAN.spit.returned; } else if (rnd() > P.dodge) hurt(); }
      const gillsOpen = (bar % LEVIATHAN.gills.of) < LEVIATHAN.gills.open;
      if (abreast && gillsOpen) { const before = Math.ceil(E.gills / LEVIATHAN.gills.hp); E.gills -= spare + binom(SHOTS_PER_BAR, P.acc * 0.7); const after = Math.ceil(Math.max(0, E.gills) / LEVIATHAN.gills.hp); st.score += (before - after) * SCORE.part.gill; }
      if (maw && rnd() < P.lock) st.score += SCORE.part.tooth * 6;
      if (E.gills <= 0 && E.throat >= LEVIATHAN.throat.spits) { E.done = true; st.end = 'felled'; st.score += SCORE.end.felled; }
      if (bar === 95 && !E.done) { E.done = true; st.end = 'driven'; st.score += SCORE.end.driven; }
    }
  }
  const passed = !st.failed; st.stolen = E.stolen;
  if (passed) st.score += (STAGE.bears - st.hits) * SCORE.bears;
  return { ...st, passed, medal: medalOf({ passed, downed: st.downed, spawned: st.spawned }), rank: rankOf(st.score, enc) };
}

// ---- the report
const pct = (x) => `${Math.round(x * 100)}%`.padStart(4);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
let broken = 0;
console.log(`THE CROSSING, SIMULATED (${RUNS} runs each; the Anagami-Margarite run, danger -0.5)\n`);
for (const enc of Object.keys(SET_PIECES)) {
  const r = rules(enc);
  console.log(`== ${enc.toUpperCase()}: views ${[viewOf(r, 0), ...r.sw.map((x) => `${x.to}@${x.bar}`)].join(' > ')}`);
  for (const b of r.bad) { console.log(`   RULE BROKEN: ${b}`); broken++; }
  const par = {};
  for (const [name, P] of Object.entries(PROFILES)) {
    const rs = Array.from({ length: RUNS }, () => run(enc, P));
    const n = rs.length, pass = rs.filter((x) => x.passed).length / n, medal = rs.filter((x) => x.medal).length / n;
    const hits = rs.reduce((a, x) => a + x.hits, 0) / n, shareDown = rs.reduce((a, x) => a + x.downed / Math.max(1, x.spawned), 0) / n;
    const ranks = Object.fromEntries(['S', 'A', 'B', 'C', 'D'].map((k) => [k, rs.filter((x) => x.rank === k).length / n]));
    const ends = {}; for (const x of rs) if (x.end) ends[x.end] = (ends[x.end] || 0) + 1 / n;
    const casks = rs.reduce((a, x) => a + x.casks - (x.stolen || 0), 0) / n;
    par[name] = med(rs.map((x) => x.score));
    console.log(`   ${name.padEnd(7)} pass ${pct(pass)}  hits ${hits.toFixed(1)}/${STAGE.bears}  downed ${pct(shareDown)}  medal ${pct(medal)}  score ${String(par[name]).padStart(6)}  ranks ${Object.entries(ranks).map(([k, v]) => `${k}${pct(v).trim()}`).join(' ')}${Object.keys(ends).length ? `  ends ${Object.entries(ends).map(([k, v]) => `${k} ${pct(v).trim()}`).join(', ')}` : ''}${enc === 'pirates' ? `  casks ${casks >= 0 ? '+' : ''}${casks.toFixed(2)}` : ''}`);
  }
  if (SHOW_PAR) console.log(`   par (the expert's median): ${par.expert} (score.js has ${PAR[enc]})`);
  // the threat a bar, for the good player: drawn as a strip, one character a bar (the shape of the stage)
  const th = new Array(BARS).fill(0); for (let i = 0; i < 300; i++) run(enc, PROFILES.good).threat.forEach((v, b) => { th[b] += v / 300; });
  const top = Math.max(...th), ramp = ' .:-=+*#%@';
  console.log(`   threat |${th.map((v) => ramp[Math.min(9, Math.round((v / top) * 9))]).join('')}|  peak ${top.toFixed(1)} a bar at bar ${th.indexOf(top)}`);
  console.log(`   acts   |${Array.from({ length: BARS }, (_, b) => { const a = ACTS.find((x) => b === x.from); return a ? a.id[0].toUpperCase() : ' '; }).join('')}|\n`);
}
console.log(`The Leviathan's deck: ${[-1.5, -0.5, 0.5, 1.5].map((d) => `danger ${d}: 1 in ${leviathanDeck(d)} (pall ${leviathanDeck(d, 'dread')})`).join('; ')}.`);
console.log(`Pirates' chance on the Margarite run: ${[0, 2, 4, 8].map((c) => `${c} casks ${pct(PIRATES.chance(c, -0.5)).trim()}`).join(', ')}.`);
function viewOf(r, bar) { return r.s.acts.find((a) => bar >= a.from && bar < a.to)?.view; }
if (broken) { console.log(`\n${broken} rule(s) broken.`); process.exit(1); }
