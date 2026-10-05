// ---------------------------------------------------------------------------------------
// THE REPLAY TEST (docs/plans/COOP.md, C2's "done when"): an agent plays a while on one page and the replay is taken (core/replay.js);
// it is loaded as /replay load loads a file (the save put back whole, the page reloaded on its boot seed) and played; both must end in the same state (where the Courier is and how fast,
// the cubes, the ledger's lifetime counts, the events by name). A difference is a hole in the determinism (C1), named by what differs.
//
//   node scripts/replaytest.mjs [--seed 3] [--ticks 2400]      (the dev server on 5173, as for the stress test)
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? +args[i + 1] : d; };
const seed = arg('seed', 3), ticks = arg('ticks', 2400);

// (counted from the moment play begins, on both pages alike: the bus's own log keeps 300, so a counter of its own)
const COUNT = () => { const G = __game.game; window.__evc = {}; const emit = G.events.emit.bind(G.events); G.events.emit = (n, p) => { __evc[n] = (__evc[n] || 0) + 1; return emit(n, p); };
  window.__tr = []; const tk = __game.tick; __game.tick = (dt) => { tk(dt); const P = G.player; __tr.push([P.pos.x, P.pos.y, P.pos.z, P.vel.x, P.vel.z, P.yaw]); }; }; // (the Courier, each tick: where a replay first parts from its recording)
const DIGEST = () => { const G = __game.game, P = G.player, r = (v) => +v.toFixed(5);
  return { frame: G.replay.at || G.replay.length, pos: [r(P.pos.x), r(P.pos.y), r(P.pos.z)], vel: [r(P.vel.x), r(P.vel.y), r(P.vel.z)], yaw: r(P.yaw),
    cubes: G.cubes?.balance, ledger: G.ledger.life, events: __evc, seed: G.seed }; };

const a = await openGame({ seed });
await a.page.evaluate(COUNT);
const plan = [
  { do: 'goto', place: 'kiln', within: 1.5 }, { do: 'hold', keys: ['KeyW', 'KeyD'], ticks: 90 }, { do: 'press', key: 'Space' },
  { do: 'use', tool: 'sondelass' }, { do: 'attack', ticks: 60 }, { do: 'travel', place: 'dunes' }, { do: 'hold', keys: ['KeyW', 'ShiftLeft'], ticks: 240 },
  { do: 'press', key: 'KeyC' }, { do: 'hold', keys: ['KeyA', 'KeyW'], ticks: 120 }, { do: 'travel', place: 'well.mouth' }, { do: 'interact' },
  { do: 'attack', ticks: 120 }, { do: 'hold', keys: ['KeyW', 'Space'], ticks: 300 },
];
let t = 0;
for (const cmd of plan) { if (t >= ticks) break; await a.act(cmd); await a.step(150); t += 150; }
if (t < ticks) await a.step(ticks - t);
const trA = await a.page.evaluate('__tr');
const A = await a.page.evaluate(DIGEST), text = await a.page.evaluate('__game.game.replay.text()');
const head = JSON.parse(text);
console.log(`recorded: ${head.frames.length} frames, seed ${head.seed}, ${(text.length / 1024).toFixed(0)} KB`);

// (played the way /replay load plays a file: the save put back whole, the page reloaded on the boot seed, the title skipped)
const b = a; const reloads = b.reloads;
await b.page.evaluate((t) => __game.game.replays.load(t), text);
for (let i = 0; i < 120 && b.reloads === reloads; i++) { await new Promise((r) => setTimeout(r, 500)); await b.look().catch(() => null); }
if (!(await b.page.evaluate('location.search')).includes('replay')) { console.log('FAIL: the page was not reloaded for the replay'); process.exit(1); }
await b.page.evaluate(COUNT);
const n = head.frames.length;
for (let i = 0; i < n; i += 600) await b.step(Math.min(600, n - i));
const B = await b.page.evaluate(DIGEST);
const trB = await b.page.evaluate('__tr');
const first = trA.findIndex((x, k) => JSON.stringify(x) !== JSON.stringify(trB[k]));
if (process.env.TRACE && first >= 0) { const i = first; console.log('first tick that differs:', i, '\n A', JSON.stringify(trA[i - 1]), '->', JSON.stringify(trA[i]), '\n B', JSON.stringify(trB[i - 1]), '->', JSON.stringify(trB[i]), '\n frame', JSON.stringify(head.frames[i]), JSON.stringify(head.frames[i - 1])); }
await b.close();

const diffs = [];
const cmp = (path, x, y) => {
  if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) cmp(`${path}.${k}`, x[k], y[k]); return; }
  if (JSON.stringify(x) !== JSON.stringify(y)) diffs.push(`${path}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
};
const quiet = (S) => ({ ...S, frame: undefined, events: Object.fromEntries(Object.entries(S.events).filter(([k]) => !k.startsWith('replay.'))) }); // (the replay's own events are the one thing a replay adds)
cmp('state', quiet(A), quiet(B));
console.log(`played: ${B.frame} frames; recorded ended at [${A.pos}], played at [${B.pos}]`);
if (first >= 0) console.log(`the Courier first parts from the recording at tick ${first} (TRACE=1 for the frames around it)`);
console.log(diffs.length ? `DIFFERS in ${diffs.length}:\n  ${diffs.slice(0, 30).join('\n  ')}` : 'replay: the same state, exactly');
process.exit(diffs.length ? 1 : 0);
