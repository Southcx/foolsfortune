// ---------------------------------------------------------------------------------------
// THE CONTRACTS: what one division's module offers another, checked in the running game. Each line is a seam between two branches
// (a producer's service on `game`, a consumer that reads it): the names, the arguments and the shapes the reader counts on. A branch that
// renames a field or drops a method fails here, at its own gate, not in a reviewer's reading after the merge (R43: three such seams
// were found by hand).
//
// Prior art: consumer-driven contract tests (Pact): the reader writes down what it needs, the producer runs it; and the smoke test a
// console build runs before it goes to a tester (boot, reach each place, call each system once).
//
//   npm run contracts            (a dev server on URL, default http://127.0.0.1:5173/; `npm run gate` starts its own)
//   a contract: { name, producer, consumer, check(game) -> true | 'what is wrong' } in the page; add one when a branch starts reading
//   another's service
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 7, query: '&clock=1791160275000' });
const results = await g.page.evaluate(async () => {
  const G = __game.game, out = [];
  const is = (v, type) => typeof v === type;
  const fin = (v) => Number.isFinite(v);
  const keys = (o, ks) => { const miss = ks.filter((k) => !(o && k in o)); return miss.length ? `missing ${miss.join(', ')}` : true; };
  const C = (name, producer, consumer, check) => { let r; try { r = check(); } catch (e) { r = `threw: ${e.message}`; } out.push({ name, producer, consumer, ok: r === true, why: r === true ? '' : String(r) }); };
  const pos = G.player.pos.clone();
  const [aspects, soundtest, zonemap, zones, markup] = await Promise.all(['/src/music/aspects.js', '/src/music/soundtest.js', '/src/render/zonemap.js', '/src/render/zones.js', '/src/ui/bugmarkup.js'].map((p) => import(p)));

  // the weather (Dovina) and its readers: the sky's look (Calissa), the ambience (Wanda), the daylight (Petra)
  C('weather.here(pos)', 'progress/weather.js', 'vfx/weather.js, audio/ambience.js', () => { const h = G.weather.here(pos); return keys(h, ['place', 'exposure', 'aspect', 'strength', 'phase']) === true && fin(h.phase) ? true : keys(h, ['place', 'exposure', 'aspect', 'strength', 'phase']); });
  C('weather.sky()', 'progress/weather.js', 'render/daylight.js, vfx/weather.js', () => { const s = G.weather.sky(); return fin(s.phase) && fin(s.light) && 'aspect' in s && fin(s.strength) ? true : `got ${JSON.stringify(s)}`; });
  C('weatherLook exports', 'vfx/weather.js', 'render/daylight.js', () => (G.daylight && fin(G.daylight.k.day) && fin(G.daylight.k.night) ? true : 'game.daylight.k has no day/night shares'));
  C('dunes.away', 'world/dunes/dunes.js', 'render/daylight.js', () => keys(G.dunes.away, ['bg', 'fog', 'fogD', 'hemiSky', 'hemiGnd', 'hemiI', 'ambI', 'sunC', 'sunI']));
  // the crossing into a Well (Petra's seam) under Calissa's wipe
  C('mawWipe.close/open', 'vfx/mawwipe.js', 'render/seam.js', () => (is(G.mawWipe?.close, 'function') && is(G.mawWipe?.open, 'function') ? true : 'no close/open'));
  C('mawWipe warmed', 'main.js warm-up', 'render/seam.js', () => (G.mawWipe.mesh ? true : 'the wipe was not made in the warm-up (its compile lands on the first F at the mouth)'));
  // the shore (Petra) and its look (Calissa)
  C('beach.shoreAt/shore/seaY/jetty', 'world/dunes/beach.js', 'vfx/shore.js', () => { const b = G.dunes.beach, c = b.center; return fin(b.shoreAt(c.x + 480, c.z)) && b.shore.length > 2 && fin(b.seaY) && b.jetty?.end ? true : 'a field is missing'; });
  C('shore built in the warm-up', 'main.js warm-up', 'vfx/shore.js', () => (G.shore.built ? true : 'built on first view (a compile in play)'));
  // the music (Wanda) and its readers: the Crucibelle (Petra), busking pay (Dovina)
  C('music.scale()', 'music/player.js', 'tools/crucibelle', () => { const s = G.music.scale(); return Array.isArray(s) && s.length === 5 && s.every(fin) ? true : `got ${JSON.stringify(s)}`; });
  C('TRACK_ASPECT covers the sound test', 'music/aspects.js', 'progress/econ (busking)', () => { const miss = soundtest.TRACKS.map((t) => t.id).filter((id) => !(id in aspects.TRACK_ASPECT)); return miss.length ? `no aspect for ${miss.join(', ')}` : true; });
  // Soul Alchemy (Dovina) and the vessel's glow (Calissa)
  C('alchemy.colour', 'progress/alchemy.js', 'courier/vessel/vessel.js', () => { const c = G.alchemy?.colour; return c && fin(c.h) && fin(c.s) ? true : `got ${JSON.stringify(c)}`; });
  // the places (Petra) and the agents
  C('places: the shore and the jetty', 'world/places.js', 'agent, playtests', () => (G.places.pos('shore') && G.places.pos('jetty') ? true : 'missing'));
  // the zone map: the pure half agrees with the renderer's
  C('zonemap = zones', 'render/zonemap.js', 'progress/weather.js, scripts', () => { const pts = [[0, 1, 0], [2480, -416, 4], [2000, -400, 0], [-1300, -900, 0], [100, -14, -40]]; const bad = pts.filter(([x, y, z]) => zonemap.zoneOf({ x, y, z }) !== zones.zoneOf({ x, y, z })); return bad.length ? `disagree at ${JSON.stringify(bad)}` : true; });
  // QAIS (Petra) and the markup window (Calissa): the Reports tab opens it over the frame and reads what it resolves
  C('BugMarkup.open -> report', 'ui/bugmarkup.js', 'debug/qais/report.js', () => {
    if (!is(markup.BugMarkup?.prototype?.open, 'function') || !markup.KINDS?.length || !markup.SEVERITIES?.length) return 'BugMarkup.open, KINDS or SEVERITIES missing';
    const m = new markup.BugMarkup(G), c = document.createElement('canvas'); c.width = 64; c.height = 40;
    m.open(c); const marks = m.marks; m.file(); // (it resolves { title, happened, should, kind, severity, marks }: the marks a canvas the frame's size)
    if (document.getElementById('bugmarkup')) return 'the window did not close on file()';
    return marks?.width === 64 && marks.height === 40 ? true : 'the marks are not the frame\'s size';
  });
  C('places.travel/stand', 'world/places.js', 'debug/qais (take me there, /goto)', () => (is(G.places.travel, 'function') && is(G.places.stand, 'function') ? true : 'missing'));
  return out;
});
await g.close();
const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name.padEnd(36)} ${r.producer}  ->  ${r.consumer}${r.ok ? '' : `\n       ${r.why}`}`);
if (g.errors.length) console.log(`page errors: ${g.errors.slice(0, 3).join(' | ')}`);
console.log(`\ncontracts: ${results.length - bad.length}/${results.length}${bad.length || g.errors.length ? ' FAILED' : ' OK'}`);
process.exit(bad.length || g.errors.length ? 1 : 0);
