// ---------------------------------------------------------------------------------------
// THE PLAYTEST RUNNER: opens the game headless (seeded: ?seed=N, manual mode: the world waits between steps), and hands a scenario
// the agent interface (src/agent/agent.js) to play it through: look, act, step, check. A scenario is a module in scripts/playtest/
// that exports `name` and `async play(t)`, and ends by calling t.check(...) for each thing the slice promises (docs/plans/COOP.md, C3).
// The stress test fuzzes; a playtest plays.
//
// Prior art: Rare's automated playtests of Sea of Thieves, Unreal's Gauntlet, and an RL environment's observe/act/step.
//
//   node scripts/playtest/run.mjs well [--seed 1]      (the dev server on 5173, as for the stress test)
//   t.act(cmd) -> { ok, why }   t.look(opts) -> state   t.step(n)   t.until(fn(state) -> bool, maxTicks) -> state   t.check(what, ok, detail)
// ---------------------------------------------------------------------------------------
import { openGame } from './game.mjs';

const args = process.argv.slice(2), name = args[0] || 'well';
const seed = +(args[args.indexOf('--seed') + 1] || 1) || 1;
const scenario = await import(`./${name}.mjs`);
const game = await openGame({ seed }), errors = game.errors;

const checks = [];
const t = {
  act: game.act, look: game.look, step: game.step, until: game.until,
  check(what, ok, detail = '') { checks.push({ what, ok: !!ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? `  (${detail})` : ''}`); },
  log: (...a) => console.log('   ', ...a),
};
const t0 = Date.now();
try { await scenario.play(t); } catch (e) { t.check(`the scenario ran to its end`, false, e.message); }
const bad = checks.filter((c) => !c.ok).length;
console.log(`\nplaytest ${name}, seed ${seed}: ${checks.length - bad}/${checks.length} checks passed in ${((Date.now() - t0) / 1000).toFixed(0)} s${errors.length ? `; page errors: ${errors.slice(0, 3).join(' | ')}` : ''}`);
await game.close();
process.exit(bad || errors.length ? 1 : 0);
