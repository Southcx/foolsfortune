// ---------------------------------------------------------------------------------------
// THE BRIDGE (docs/plans/COOP.md, C3): the game headless, held open by a small server, so a Claude session (or any program) plays it a
// turn at a time from the shell. The world waits between calls (manual mode): look, think as long as it likes, act, let time pass.
// Every answer is the agent's state as JSON (src/agent/agent.js: the Courier, what is near, what can be interacted with, the events
// and the log's lines since the last look).
//
// Prior art: OpenAI Gym's observe/act/step, the Minecraft agents' bridges (Mineflayer under Voyager: a long-lived game process and
// short calls into it), and a debugger's attach-and-step.
//
//   node scripts/agent.mjs serve [--seed 1] [--port 5199]     (start it in the background; the dev server on 5173, as for the stress test)
//   node scripts/agent.mjs look [--places]                     the state (with the places' list: where it can go)
//   node scripts/agent.mjs act '{"do":"travel","place":"well.mouth"}'   an intent (the answer: { ok, why? } and the state after)
//   node scripts/agent.mjs do '{"do":"goto","place":"kiln"}' [maxTicks]  an intent, then time until it is done (or maxTicks: 1800)
//   node scripts/agent.mjs step [ticks]                        let time pass (60 ticks: one second)
//   node scripts/agent.mjs stop                                close the game and the server
// ---------------------------------------------------------------------------------------
import http from 'http';

const args = process.argv.slice(2), cmd = args[0];
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', process.env.AGENT_PORT || 5199);

if (cmd === 'serve') await serve();
else if (cmd) await call(cmd);
else { console.log('node scripts/agent.mjs serve | look [--places] | act <json> | do <json> [maxTicks] | step [ticks] | stop'); process.exit(1); }

async function serve() {
  const { openGame } = await import('./playtest/game.mjs');
  const seed = +opt('seed', 1) || 1;
  const g = await openGame({ seed });
  const routes = {
    look: async (b) => g.look({ places: !!b.places }),
    act: async (b) => { const r = await g.act(b.cmd); await g.step(1); return { ...r, state: await g.look() }; },
    do: async (b) => { const r = await g.act(b.cmd); if (!r.ok) return { ...r, state: await g.look() }; await g.step(1); const s = await g.until((s) => !s.task, b.max ?? 1800); return { ...r, state: s }; },
    step: async (b) => { await g.step(Math.max(1, Math.min(60 * 60, b.ticks ?? 60))); return g.look(); },
    stop: async () => { setTimeout(async () => { await g.close(); process.exit(0); }, 50); return { ok: true }; },
  };
  let queue = Promise.resolve(), seen = 0; // (one call at a time: the world is one)
  http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      queue = queue.then(async () => {
        const route = routes[req.url.slice(1)];
        let out, code = 200;
        try { out = route ? await route(body ? JSON.parse(body) : {}) : { ok: false, why: `no call '${req.url}'` }; if (!route) code = 404; }
        catch (e) { out = { ok: false, why: e.message }; code = 500; }
        if (g.errors.length) out = { ...out, pageErrors: g.errors.splice(0) };
        if (g.reloads > seen) { seen = g.reloads; out = { ...out, reloaded: 'the page was reloaded (a file changed): the game started over from the seed' }; }
        res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(out));
      });
    });
  }).listen(port, '127.0.0.1', () => console.log(`agent bridge: seed ${seed}, http://127.0.0.1:${port}`));
}

async function call(name) {
  const body = name === 'look' ? { places: args.includes('--places') }
    : name === 'act' || name === 'do' ? { cmd: JSON.parse(args[1] || '{}'), max: args[2] ? +args[2] : undefined }
    : name === 'step' ? { ticks: args[1] ? +args[1] : 60 } : {};
  const out = await new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: `/${name}`, method: 'POST', headers: { 'content-type': 'application/json' } }, (res) => {
      let t = ''; res.on('data', (d) => { t += d; }); res.on('end', () => resolve(t));
    });
    req.on('error', (e) => reject(new Error(`no bridge on ${port} (start it: node scripts/agent.mjs serve &): ${e.message}`)));
    req.end(JSON.stringify(body));
  }).catch((e) => { console.error(e.message); process.exit(2); });
  console.log(out);
}
