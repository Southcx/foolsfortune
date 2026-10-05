// ---------------------------------------------------------------------------------------
// THE QAIS TEST: QAIS driven headless, twice. Once away from the store (the dev server as it is: the window opens on F8 and pauses the
// world, the tabs say the store is away, a report is saved as a file and the log says so). Once over a stand-in for the published build's
// store (an in-page `window.claude` with `db`, `assets`, `user` and `mcp` kept in memory, seeded with a round): the Brief and the Tests
// drawn from it, a pass and a note written, a test's evidence seen and written once, take me there, a report filed from a test's Fail
// (two pictures and the state uploaded, the row and the test's link written), and Send to the brigade calling the connector with
// Dovina's session. Exits non-zero on the first thing that is not so.
//
// Prior art: a page object test of a form (Selenium's, Playwright's own), and Pact's stub provider (the store stood in for, its calls
// recorded and checked).
//
//   npm run dev &   node scripts/qaistest.mjs      (URL=<dev server>; `npm run gate` runs it with its own server)
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const fails = [];
const ok = (cond, what) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${what}`); if (!cond) fails.push(what); };
const F8 = (page) => page.keyboard.press('F8');

// ---- 1. away from the store
{
  const g = await openGame({ seed: 3, query: '&clock=1791160275000' });
  const { page } = g;
  await F8(page);
  const s = await page.evaluate(() => { const q = __game.game.qais; return { open: q.open, frame: [q.frame.width, q.frame.height], text: document.querySelector('#qais .qbody').textContent, online: q.store?.online }; });
  ok(s.open, 'F8 opens QAIS');
  ok(s.frame[0] > 1 && s.frame[1] > 1, `the frame is taken (${s.frame.join('x')})`);
  ok(s.online === false && /published build/.test(s.text), 'away from the store, the Brief says where QAIS lives');
  const t0 = await page.evaluate(() => __game.game.events.time);
  await page.evaluate(() => { __game.manual = false; });
  await page.waitForTimeout(600);
  const t1 = await page.evaluate(() => { __game.manual = true; return __game.game.events.time; });
  ok(t1 === t0, 'the world is paused while QAIS is open');
  await page.keyboard.press('KeyB');
  ok(!(await page.evaluate(() => __game.game.codex.open)), 'a key typed in QAIS does not reach the game (B is not the Codex)');
  await page.keyboard.press('Digit3');
  ok(await page.evaluate(() => __game.game.qais.tab === 'reports'), '3 shows the Reports tab');
  const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await page.evaluate(() => [...document.querySelectorAll('#qais button')].find((b) => b.textContent === 'File a report').click());
  await page.waitForSelector('#bugmarkup .title');
  await page.fill('#bugmarkup .title', 'the sand flickers');
  await page.keyboard.press('Enter');
  const file = await dl;
  ok(!!file && /^report-.*-R1\.json$/.test(file.suggestedFilename()), `a report away from the store is saved as a file (${file?.suggestedFilename()})`);
  const said = await page.evaluate(() => __game.game.log.lines.slice(-3).map((l) => l.text).join(' | '));
  ok(/Report 1 filed .*the sand flickers/.test(said), 'the log says the report was filed');
  await page.keyboard.press('Escape');
  ok(!(await page.evaluate(() => __game.game.qais.open)), 'Esc closes QAIS');
  ok(!g.errors.length, `no page errors${g.errors.length ? `: ${g.errors.slice(0, 2).join(' | ')}` : ''}`);
  await g.close();
}

// ---- 2. over a stand-in store
const standIn = () => {
  const data = {}, subs = {}, calls = { uploads: [], tools: [] };
  const snap = (col) => ({ docs: Object.entries(data[col] || {}).map(([id, d]) => ({ id, exists: true, data: () => structuredClone(d) })) });
  const fire = (col) => setTimeout(() => (subs[col] || []).forEach((f) => f(snap(col))));
  const db = {
    collection: (col) => ({ onSnapshot(fn) { (subs[col] ||= []).push(fn); setTimeout(() => fn(snap(col))); return () => {}; } }),
    doc: (path) => { const [col, id] = path.split('/'); return {
      set: async (d) => { (data[col] ||= {})[id] = structuredClone(d); fire(col); },
      update: async (p) => { if (!data[col]?.[id]) throw { code: 'invalid_argument' }; Object.assign(data[col][id], structuredClone(p)); fire(col); },
    }; },
  };
  const assets = { upload: async (blob, o) => { calls.uploads.push(o?.type || blob.type); const id = `a${calls.uploads.length}`; return { id, url: `/_blob/${id}` }; } };
  const user = { me: async () => ({ id: 'owner', name: 'The Owner' }) };
  const mcp = { callTool: async (server, tool, input) => { calls.tools.push({ server, tool, input }); return { payload: { ok: true } }; } };
  // (the round, seeded as Petra seeds it at publish: the Brief, the QAIS tests, a question)
  data.meta = { round: { build: 'v99', sent: false } };
  data.brief = { 'v99-Petra': { build: 'v99', division: 'Petra', lines: ['QAIS opens on F8.'], waiting: ['Say whether the tabs read well.'], at: 2 }, 'v98-Petra': { build: 'v98', division: 'Petra', lines: ['The old one.'], at: 1 } };
  data.tests = {
    T1: { n: 1, build: 'v99', area: 'QAIS', who: 'Petra', what: 'Type /goto kiln.', expect: 'You stand at the kiln.', watch: { event: 'courier.goto', match: { ok: true } }, status: 'open' },
    T2: { n: 2, build: 'v99', area: 'QAIS', who: 'Petra', what: 'Take me there.', expect: 'At the kiln.', go: 'kiln', status: 'open' },
    T3: { n: 3, build: 'v99', area: 'QAIS', who: 'Petra', what: 'Fail me.', expect: 'A report.', status: 'open' },
    T9: { n: 9, build: 'v98', area: 'old', who: 'Petra', what: 'Not this round.', expect: '', status: 'open' },
  };
  data.questions = { Q1: { q: 'Four tabs or five?', from: 'Dovina' } };
  window.__standIn = { data, calls };
  window.claude = { use: (n) => Promise.resolve({ db, assets, user, mcp }[n] || null) };
};
{
  const g = await openGame({ seed: 4, query: '&clock=1791160275000', before: (page) => page.addInitScript(standIn) });
  const { page } = g;
  await page.waitForTimeout(300);
  await F8(page);
  await page.waitForTimeout(200);
  const brief = await page.evaluate(() => document.querySelector('#qais .qbody').textContent);
  ok(/QAIS opens on F8/.test(brief) && /Waiting on you/.test(brief) && /v98.*The old one/.test(brief), 'the Brief is drawn from the store (this round, waiting on you, the builds before)');
  await page.keyboard.press('Digit2');
  const cards = await page.evaluate(() => [...document.querySelectorAll('#qais .qcard')].map((c) => c.dataset.id));
  ok(cards.join() === 'T1,T2,T3', `the Tests show the round's QAIS tests in order (${cards.join()})`);
  // a pass, then a note
  await page.evaluate(() => document.querySelector('#qais .qcard[data-id="T2"] [data-v="pass"]').click());
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => window.__standIn.data.tests.T2.status === 'pass'), 'Pass writes the status');
  await page.click('#qais .qcard[data-id="T2"] textarea');
  await page.keyboard.type('looks right');
  await page.waitForTimeout(1900);
  ok(await page.evaluate(() => window.__standIn.data.tests.T2.note === 'looks right'), 'a note is written after its pause');
  await page.keyboard.press('Escape'); // (out of the note)
  await page.keyboard.press('Escape'); // (QAIS closed)
  // the evidence: /goto kiln fires courier.goto { ok: true }
  await page.evaluate(() => { for (let i = 0; i < 5; i++) __game.game.chat.run('/goto kiln'); __game.game.chat.run('/goto nowhere.at.all'); });
  await page.waitForTimeout(150);
  const seen = await page.evaluate(() => window.__standIn.data.tests.T1.seen || []);
  ok(seen.length === 3 && seen.every((x) => /"ok":true/.test(x.gist)), `the evidence is seen, matched and kept to the first three (${seen.length}: ${seen[0]?.gist})`);
  ok(/You stand at kiln/.test(await page.evaluate(() => __game.game.log.lines.map((l) => l.text).join(' | '))), '/goto says where it set the Courier down');
  // take me there
  await page.evaluate(() => __game.game.chat.run('/goto workshop'));
  await F8(page); await page.keyboard.press('Digit2'); await page.waitForTimeout(100);
  const before = await page.evaluate(() => __game.player.pos.toArray());
  await page.evaluate(() => document.querySelector('#qais .qcard[data-id="T2"] [data-go]').click());
  const after = await page.evaluate(() => ({ pos: __game.player.pos.toArray(), open: __game.game.qais.open, kiln: __game.game.places.pos('kiln').toArray() }));
  const d = Math.hypot(after.pos[0] - after.kiln[0], after.pos[2] - after.kiln[2]);
  ok(!after.open && d < 3 && Math.hypot(after.pos[0] - before[0], after.pos[2] - before[2]) > 0.5, `take me there closes QAIS and sets the Courier by the kiln (${d.toFixed(2)} m)`);
  // a fail files a report carrying the test
  await F8(page); await page.keyboard.press('Digit2'); await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelector('#qais .qcard[data-id="T3"] [data-v="fail"]').click());
  await page.waitForSelector('#bugmarkup .title');
  await page.fill('#bugmarkup .title', 'it failed');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ bug: window.__standIn.data.bugs.R1, t3: window.__standIn.data.tests.T3, uploads: window.__standIn.calls.uploads, tab: __game.game.qais.tab, open: __game.game.qais.open }));
  ok(r.t3.status === 'fail' && r.t3.report === 'R1', 'Fail marks the test and links its report');
  ok(r.bug?.test === 'T3' && r.bug.round === 'v99' && r.bug.status === 'new' && r.bug.frame && r.bug.marks && r.bug.state && r.bug.stand?.startsWith('/goto '), 'the report row carries the test, the round, the status, the assets and the stand line');
  ok(r.uploads.sort().join() === 'application/json,image/png,image/png', `two pictures and the state are uploaded (${r.uploads.join()})`);
  ok(r.open && r.tab === 'reports', 'QAIS comes back on the Reports tab');
  ok(/#1.*it failed/.test(await page.evaluate(() => document.querySelector('#qais .qbody').textContent)), 'the report is listed');
  // send to the brigade
  await page.evaluate(() => [...document.querySelectorAll('#qais button')].find((b) => b.textContent === 'Send to the brigade').click());
  await page.waitForTimeout(300);
  const s = await page.evaluate(() => ({ round: window.__standIn.data.meta.round, call: window.__standIn.calls.tools[0], said: __game.game.log.lines.slice(-2).map((l) => l.text).join(' | ') }));
  ok(s.round.sent === true && s.round.sentAt > 0, 'Send marks the round sent');
  ok(s.call?.server === 'Claude Code Remote' && s.call.tool === 'create_trigger' && s.call.input.persistent_session_id === 'session_01Dn7Yum1aGbbsUQBLqcm863'
    && new Date(s.call.input.run_once_at) > new Date() && /v99/.test(s.call.input.prompt) && /1 passed, 1 failed/.test(s.call.input.prompt), 'Send wakes Dovina\'s session through the connector, with the round in the prompt');
  ok(/Round v99 sent to the brigade/.test(s.said), 'the log says the round was sent');
  // the questions
  await page.keyboard.press('Digit4');
  ok(/Four tabs or five\?/.test(await page.evaluate(() => document.querySelector('#qais .qbody').textContent)), 'the Questions are drawn');
  ok(!g.errors.length, `no page errors${g.errors.length ? `: ${g.errors.slice(0, 2).join(' | ')}` : ''}`);
  await g.close();
}

console.log(`\nqais: ${fails.length ? `${fails.length} FAILED` : 'OK'}`);
process.exit(fails.length ? 1 : 0);
