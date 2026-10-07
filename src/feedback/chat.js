// ---------------------------------------------------------------------------------------
// THE CHAT LINE: the log (gamelog.js) takes typing. Enter opens a line at its foot ("/" opens it with the slash already there),
// Enter sends it, Esc puts it away, the arrow keys go back through what was sent. Plain words are said aloud ("Courier : hello"),
// and a line that begins with a slash is a command: the emotes (/sit, /dance, /wave...: emotes.js), a free emote (/em takes a bow),
// and a few of the game's switches (/voice, /music, /window). /help lists them all; the emotes, too many for one line, by family
// (/emotes lists the families, /emotes <family> one of them, /dances /flirts /taunts theirs).
//
// Commands are a table any module can add to (`chat.add(name, { help, aliases, run(args, line) })`), so a feature brings its own.
// What a command does is reported the usual way: it emits an event and tracking.js says it in the log; only a refusal ("There is
// no command /x.") and /help's own list are written directly, as a refusal at the point of use may be.
//
// Prior art: Final Fantasy XI's chat line (/sit, /wave, /em, /say, auto-translate aside) and its macros, MMOs' /help, and the
// shells of the computer the Veritome is meant to be (the typing it invites: a line, a prompt, a command, an answer).
// ---------------------------------------------------------------------------------------
import { EMOTES, EMOTE_OF, FAMILIES, inFamily } from '../courier/emotes.js';
import { THEMES } from '../ui/theme.js';
import { TRACKS, TRACK } from '../music/soundtest.js';

export class Chat {
  constructor(game) {
    this.game = game;
    this.cmds = new Map(); this.alias = new Map();
    this.defaults();
  }
  add(name, spec) {
    this.cmds.set(name, { name, ...spec });
    for (const a of spec.aliases || []) this.alias.set(a, name);
  }
  find(w) { const k = w.toLowerCase(); return this.cmds.get(k) || this.cmds.get(this.alias.get(k)); }

  /** A line from the chat: words to say, or a command to run. */
  run(line) {
    const g = this.game, text = String(line || '').trim();
    if (!text) return;
    if (text[0] !== '/') { g.events.emit('chat.say', { text: text.slice(0, 200), by: 'courier' }); return; }
    const [head, ...rest] = text.slice(1).split(/\s+/);
    const c = this.find(head || '');
    if (!c) { g.log.say('warn', `There is no command /${head}. (/help lists them.)`, { key: 'chat.unknown', throttle: 0.5 }); return; }
    try { c.run(rest, rest.join(' ')); } catch (e) { console.warn('chat', e); }
  }

  defaults() {
    const g = this.game, log = (cls, t) => g.log.say(cls, t);
    this.add('help', {
      help: 'lists the commands (/help sit: one of them)',
      aliases: ['?', 'commands'],
      run: ([w]) => {
        const c = w && this.find(w.replace(/^\//, ''));
        if (c) { log('system', `/${c.name}${c.aliases?.length ? ` (${c.aliases.map((a) => `/${a}`).join(' ')})` : ''}: ${c.help}`); return; }
        const rest = [...this.cmds.values()].filter((x) => !x.emote && !x.family).map((x) => `/${x.name}`).join(' ');
        log('system', `Emotes: ${Object.keys(EMOTES).length}, in ${Object.keys(FAMILIES).length} families (/emotes lists them; /dances /flirts /taunts)  ·  /em <words>: an emote of your own`);
        log('system', `Commands: ${rest}  ·  plain words are said aloud  ·  /help <command> for more`);
      },
    });
    for (const [id, E] of Object.entries(EMOTES)) {
      this.add(id, { emote: true, help: `${E.line} (${E.family}: /emotes ${E.family})`, aliases: E.aliases, run: () => this.emote(id) });
    }
    // the emotes by family: one line a family, not a wall (FFXIV's emote list in categories)
    const family = (f) => log('system', `${f[0].toUpperCase()}${f.slice(1)} (${FAMILIES[f]}): ${inFamily(f).map((id) => `/${id}`).join(' ')}`);
    this.add('emotes', { family: true, help: 'the emotes, by family: /emotes <family> lists one', run: ([w]) => {
      const f = w && w.toLowerCase().replace(/s$/, '');
      if (f && FAMILIES[f]) { family(f); return; }
      log('system', `Emote families: ${Object.keys(FAMILIES).map((k) => `${k} (${inFamily(k).length})`).join(' · ')}  ·  /emotes <family> lists one`);
    } });
    for (const f of ['dance', 'flirt', 'taunt']) this.add(`${f}s`, { family: true, help: `the ${f} emotes`, run: () => family(f) });
    this.add('em', { help: 'an emote of your own: /em takes a bow  ->  The Courier takes a bow.', aliases: ['emote', 'me'], run: (a, rest) => { if (rest) g.events.emit('chat.emote', { text: rest.slice(0, 160), by: 'courier' }); } });
    this.add('say', { help: 'say it aloud (plain words do the same)', aliases: ['s'], run: (a, rest) => { if (rest) g.events.emit('chat.say', { text: rest.slice(0, 200), by: 'courier' }); } });
    this.add('stand', { help: 'stop the emote', aliases: ['stop'], run: () => g.techs?.get('emote')?.stop() });
    this.add('clear', { help: 'clears the log', run: () => g.log.clear() });
    this.add('voice', { help: "the System's voice: /voice on | off", run: ([v]) => { const V = g.voice; if (!V) return; V.set({ on: v ? v === 'on' : !V.settings.on }); log('system', `The System's voice is ${V.settings.on ? 'on' : 'off'}.`); } });
    this.add('music', { help: `the music: /music on | off | stop | ${TRACKS.map((t) => t.id).join(' | ')} (the sound test, in the Codex)`, run: ([v]) => {
      const M = g.music; if (!M) return;
      const T = v && TRACK[v.toLowerCase()];
      if (T) { if (!M.on) M.setOn(true); M.pick = T.score; log('system', `Now playing: ${T.title}.`); return; }
      if (v === 'stop') { M.pick = null; log('system', 'The sound test is stopped.'); return; }
      M.setOn(v ? v === 'on' : !M.on); log('system', `The music is ${M.on ? 'on' : 'off'}.`);
    } });
    this.add('window', { help: `the windows' colour: /window ${Object.keys(THEMES).join(' | ')}`, aliases: ['windows'], run: ([v]) => { const T = g.theme; if (!T) return; if (v && THEMES[v.toLowerCase()]) T.set(v.toLowerCase()); else T.next(); log('system', `The windows are ${T.name}.`); } });
    this.add('where', { help: 'where you are', aliases: ['loc', 'pos'], run: () => {
      const P = g.player.pos, l = g.cartography?.layerOf(P.y), r = g.cartography?.roomAt(P.x, P.y, P.z, 40);
      log('system', `${l?.name || 'Somewhere'}${r && r.name !== l?.name ? ` · ${r.name}` : ''} (${P.x.toFixed(1)}, ${P.y.toFixed(1)}, ${P.z.toFixed(1)}).`);
    } });
  }

  emote(id) {
    const g = this.game, r = g.techs?.get('emote')?.request(id);
    if (r === true || r === 'already') return;
    g.log.say('warn', 'You cannot do that right now.', { key: 'emote.busy', throttle: 1 });
  }
}
export { EMOTE_OF };
