// ---------------------------------------------------------------------------------------
// BOOT CHAT COMMANDS: the commands that need the whole game built, one `game.chat.add` each, in two stages. `bootChatCommands`: the time,
// vertex painting, the effects and the overture. `bootMoreChatCommands` comes after QAIS: the opt-in Movement Arts, the aberrant wipe and
// the pull's edge, the maw wipe, the glitch, the awakening, the workbench, the rhythm mode, the garden, the spore beds and the tree, the
// Inner Realm's name, the cavern and the Opening; with the rhythm mode, the debug chests and the busker's mats, the log's rule for when
// it may open, and the session's opening.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootChatCommands(game, made) -> nothing
//   bootMoreChatCommands(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { Rhythm, TRACKS as RHYTHM_TRACKS } from '../music/rhythm/rhythm.js';
import { FEELING_CLIPS } from '../courier/anim/feelingclips.js';
import { MOMENTS as GLITCH_MOMENTS } from '../vfx/glitch.js';
import { installWorkbenchLoader } from '../debug/workbenchloader.js';
import { Busk } from '../world/busk.js';
import { VertexPaint } from '../vfx/vertexpaint.js';
import { DebugChests } from '../debug/debugchest.js';
import { OVERTURE_TITLE } from '../cine/overture.board.js';
import { TRACKS as SOUNDTRACKS } from '../music/soundtest.js';

export function bootChatCommands(game) {
  game.scanner?.commands(); // (/scan: a real code read into a material or a spirit slab, world/scanner.js)
  // (for directing the effects: play any effect by name where the Courier stands, or the Lockheart's whole opening without keys)
  // (the clock is the Veritome's: docs/plans/OVERLAY.md; carried, it tells the time; the words are the log's rule, tracking/weather.js)
  game.chat.add('time', { help: 'the game day and game hour (the Veritome tells it)', run: () => {
    if (!game.belt?.isWorn('veritome')) { game.log.say('info', 'You have no Veritome to tell the time.', { key: 'notime', throttle: 2 }); return; }
    game.events.emit('clock.read', { by: 'courier' }); // (the time is read where it is said: the calendar's, which a replay pins)
  } });
  game.vertexPaint = new VertexPaint(game); // (a trial, off by default: a zone's mood lamps baked into its statics per vertex, vfx/vertexpaint.js)
  game.chat.add('vertexpaint', { debug: true, help: "bake a zone's mood lamps into its walls and switch the lamps off: /vertexpaint [zone] (basement), /vertexpaint off", run: ([a]) => {
    if (a === 'off') { game.log.say('info', game.vertexPaint.unbake('basement') ? 'Vertex painting off: the lamps are lit again.' : 'Nothing is vertex painted.', { key: 'vertexpaint', throttle: 0.5 }); return; }
    const s = game.vertexPaint.bake(a || 'basement');
    game.log.say('info', `Vertex painted ${s.zone}: ${s.lamps} lamps baked into ${s.meshes} meshes (${Math.round(s.trisBefore)} -> ${Math.round(s.trisAfter)} triangles, ${s.rays} rays, ${s.ms} ms).`, { key: 'vertexpaint', throttle: 0.5 });
  } });
  game.chat.add('vfx', { help: 'play an effect: /vfx <name> [tint] (no name: the list)', run: ([name, tint]) => {
    const P = game.player;
    if (!name) { game.events.emit('vfx.list', { names: game.vfx.names() }); return; }
    const f = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
    game.vfx.play(name, { pos: P.pos.clone().addScaledVector(f, 2).setY(P.pos.y + 1), dir: f.clone().negate(), tint: tint ? parseInt(tint.replace('#', ''), 16) : 0xffd76a, floor: P.pos.y });
    game.events.emit('vfx.test', { fx: name, found: game.vfx.has(name) });
  } });
  installWorkbenchLoader(game); // (game.workbench: a stand-in until the first open fetches the studio)
  game.chat.add('overture', { help: "the overture's trailer, here and now (the music from the sound test when it has it)", run: () => {
    const tr = SOUNDTRACKS.find((x) => x.score?.title === OVERTURE_TITLE);
    if (tr && game.music) { if (!game.music.on) game.music.setOn(true); game.music.pick = tr.score; }
    import('../cine/overture.js').then(({ Overture }) => (game.overture ||= new Overture(game)).start({ own: !tr })); // (loaded on asking: it no longer plays on the title)
  } });
}

export function bootMoreChatCommands(game, made) {
  const { freshBuild, player, techs, windowOpen, god } = made;
  // the opt-in Movement Arts (the jet arts: courier/moves/jets.js): switched on and off here, kept with the settings
  const OPT_ARTS = ['hover', 'rocket', 'skim'];
  game.save?.section('optarts', { scope: 'settings', version: 1, dump: () => Object.fromEntries(OPT_ARTS.map((a) => [a, !!T.tech[a].enabled])),
    load: (d) => { for (const a of OPT_ARTS) T.tech[a].enabled = !!d[a]; }, reset: () => { for (const a of OPT_ARTS) T.tech[a].enabled = false; } });
  game.chat.add('art', { debug: true, help: `switch an opt-in Movement Art on or off: /art ${OPT_ARTS.join(' | ')} (no name: the list)`, run: ([id]) => {
    if (!OPT_ARTS.includes(id)) { game.events.emit('art.list', { arts: OPT_ARTS.map((a) => `${a} ${T.tech[a].enabled ? 'on' : 'off'}`).join(', ') }); return; }
    T.tech[id].enabled = !T.tech[id].enabled; game.save?.dirty('optarts');
    game.events.emit('art.toggle', { art: id, on: T.tech[id].enabled, by: 'courier' });
  } });
  game.chat.add('aberrantwipe', { debug: true, help: 'the aberrant encounter\'s wipe, shown here on the nearest creature (the shatter follows at once)', run: () => { const P = player.pos; let foe = null, best = 1e9; for (const c of game.creatures?.list || []) { const d = c.pos?.distanceToSquared?.(P) ?? 1e9; if (d < best) { best = d; foe = c; } } game.aberrantWipe.close(() => game.aberrantWipe.open(), { foe }); } });
  game.chat.add('pull', { debug: true, help: "the pull's edge held at a value: /pull 0.5 (0 to 1); /pull alone gives it back to the aberrants' nearness", run: ([v]) => { const k = parseFloat(v); game.aberrantWipe.pullOverride = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : null; } });
  game.chat.add('areawipe', { debug: true, help: 'the area wipe that covers a change of area, shown here over the view: /areawipe <to> (weir, shore, ridges, flats, ruins, workshop, hub, raceway, garden, opensea ...; the cover holds a fake load of a second and a half, its thread filling)', run: ([to, edge]) => { let t0 = null; const P = () => (t0 == null ? 0 : (performance.now() - t0) / 1500); game.areaWipe.close(() => { t0 = performance.now(); setTimeout(() => game.areaWipe.open(), 1500); }, { from: null, to: to || 'weir', edge, progress: P }); } });
  game.chat.add('mawwipe', { help: 'the maw wipe that covers the way into a Well, shown here (it holds a second and a half)', run: () => game.mawWipe.close(() => setTimeout(() => game.mawWipe.open(), 1500)) });
  game.chat.add('glitch', { help: `the picture torn as at a moment (${Object.keys(GLITCH_MOMENTS).join(', ')}), or a drop-out: /glitch drop`, run: (_, arg) => { const m = GLITCH_MOMENTS[arg]; if (arg === 'drop') game.glitch.drop(3); else game.glitch.moment(m || GLITCH_MOMENTS['lockheart.ultimate'], { at: player.pos.clone().setY(player.pos.y + 1), power: 1, stage: 3 }); } });
  game.chat.add('awaken', { debug: true, help: `a feeling's awakening as it looks, nothing learned: /awaken ${Object.keys(FEELING_CLIPS).join(' | ')} (its flood, then its clip)`, run: ([f]) => { if (game.awakeningLook.flood(f)) setTimeout(() => game.awakeningLook.embody(f), 600); } });
  game.chat.add('workbench', { help: 'the workbench: every effect, model and texture of the game, on a stage of its own (Esc closes it)', run: () => game.workbench.toggle() });
  // the rhythm mode: a song played on the ten keys (music/rhythm/); begun from a stage in a room, /rhythm for directing it
  game.rhythm = new Rhythm(game);
  game.debugChests = new DebugChests(game); // (what a test session needs, beside the thing under test: debug/debugchest.js, docs/plans/DEBUG-CHESTS.md)
  game.busk = new Busk(game); // (the busker's mats on the piers: F with the Crucibelle worn begins a song: world/busk.js)
  game.chat.add('garden', { debug: true, help: "into your Inner Realm from where you stand (a tester's way: a Shrine is the door)", run: () => game.realm?.enter(game.shrines?.get?.(game.shrines.last) || null) });
  // (a tester's way to the mycelium until the garden's features are placed by hand: MYCELIUM.md; every verb reports through its event)
  game.chat.add('spore', { debug: (a) => a[0] === 'bed', help: 'the spore beds: /spore bed | inoculate <bed> <feeling> | set <bed> <box slot> [slot] | back <bed> | harvest <bed>', run: (a) => {
    const S = game.sporeBeds, n = (k) => Number(a[k]) - 1, f = { bed: () => ({ ok: true, bed: S.grant() + 1 }), inoculate: () => S.inoculate(n(1), a[2]),
      set: () => S.set(n(1), a.slice(2).map((x) => Number(x) - 1)), back: () => S.back(n(1)), harvest: () => S.harvest(n(1)) }[a[0]];
    const r = f ? f() : { ok: false, why: 'bed, inoculate, set, back or harvest' }; if (!r.ok && r.why) game.log.say('warn', r.why, { key: 'spore', throttle: 1 }); } });
  game.chat.add('tree', { debug: (a) => a[0] === 'dawn', help: 'Myggdrasil: /tree feed <box slot> | pick | hang <arcana> | dawn', run: (a) => {
    const T = game.myggdrasil, f = { feed: () => T.feed(Number(a[1]) - 1), pick: () => ({ ok: true, n: T.pick() }), hang: () => T.hang(a[1]), dawn: () => ({ ok: true, n: T.dawn() }) }[a[0]];
    const r = f ? f() : { ok: false, why: 'feed, pick, hang or dawn' }; if (!r.ok && r.why) game.log.say('warn', r.why, { key: 'tree', throttle: 1 }); } });
  game.chat.add('realmname', { help: 'name your Inner Realm yourself: /realmname <name>', run: (args) => game.realm?.setName(args.join(' ')) });
  game.chat.add('cavern', { debug: true, help: "into the Great Dunemaw and straight down to the great cavern, where the Great Slip Jelly broods (a tester's way: the floors are walked)", run: () => {
    const W = game.well; if (game.rail?.stage.active || game.death?.active) return;
    const go = () => { if (!W.active && !W.enter()) return; W.toCavern(); game.events.emit('cavern.force', { by: 'courier' }); };
    if (game.seam) game.seam.cross(go, { kind: 'maw' }); else go();
  } });
  game.chat.add('rhythm', { help: 'the rhythm mode: /rhythm [track] [light|steady|full], /rhythm offset <ms> (no track: the next)', run: ([a, b]) => {
    if (a === 'offset') { game.rhythm.setOffset(+b || 0); game.events.emit('rhythm.offset', { ms: game.rhythm.offset }); return; }
    if (a && !RHYTHM_TRACKS.some((T) => T.id === a)) { game.events.emit('rhythm.list', { tracks: RHYTHM_TRACKS.map((T) => T.id) }); return; }
    game.rhythm.begin(a, b);
  } });
  game.chat.add('opening', { debug: true, help: "the Lockheart's opening, without keys (the Lockheart worn)", aliases: ['ult'], run: async () => {
    const lh = game.techs?.get?.('lockheart') || techs.get?.('lockheart'); if (!lh || game.ultimate?.active) return;
    const T = await import('../tools/lockheart/table.js'), keys = ['key.brass', 'key.twin', 'key.echo', 'key.loaded'];
    const { table, mods } = T.oddsOf('heart.plain', ['key.brass']);
    lh.queue = [{ id: T.spin(table), R: T.rates(table), power: 1.5, mods, heart: 'heart.plain', keys, i: 0 }];
    game.ultimate.begin(lh); game.events.emit('vfx.test', { fx: 'the opening', found: true });
  } });
  game.log.canOpen = () => !windowOpen() && !god.controlling;
  game.events.emit('session.open', { fresh: !!freshBuild }); // (the welcome is a tracking rule: tracking/place.js)
}
