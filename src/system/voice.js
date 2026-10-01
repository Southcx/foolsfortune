// ---------------------------------------------------------------------------------------
// THE SYSTEM'S VOICE: the few things that matter, said aloud. An achievement, a skill learned, a creature's analysis finished, a rank
// S card bound, the Pneuka Box full: the log still writes its line (it is the only TEXT feedback, gamelog.js), and the System also
// says it, once, in a calm, even voice that begins "Notice." The rest of the game stays quiet: a voice that talks all the time is
// one nobody listens to.
//
// The voice is the browser's own speech (the Web Speech API's speechSynthesis): nothing to download, nothing to bundle. It picks the
// clearest voice the machine has (the neural "Natural" voices first, then Google's, then the system's English ones), and speaks a
// little slower and a little lower than the default: even, unhurried, matter-of-fact. Lines are short; at most a few wait in line,
// and a line repeated too soon is dropped. The Codex header has its switch (VOICE), kept in the browser.
//
// Prior art: the "World Voice" and the Great Sage of That Time I Got Reincarnated as a Slime ("Notice. ... Confirmed." — a flat,
// helpful announcer of skills acquired and analyses complete), the System windows of Solo Leveling and its isekai kin, and the
// spoken level-ups of arcade and MMO announcers. Its rules are a table over the event bus, as tracking.js's are for the log.
//
//   const v = new SystemVoice(game)   v.say(text, { key, throttle })   v.set({ on, rate, pitch, volume, voice })   v.voices()
// ---------------------------------------------------------------------------------------
import { CREATURES, tierOf } from '../veritome/bestiary.js';
import { CARD } from '../veritome/cards.js';
import { BY_ID } from './skills.js';
import { itemOf } from '../pneuka/items.js';
import { BY_SPECIES } from '../angling/species.js';

const KEY = 'foolsfortune.voice.v1';
// (calm and even: a touch slower and lower than the browser's default)
export const DEFAULTS = { on: true, rate: 0.96, pitch: 0.9, volume: 0.9, voice: null };
// the voices it would rather have, best first (matched against the voice's name)
const PREFER = [/natural/i, /neural/i, /google uk english female/i, /google us english/i, /samantha/i, /serena/i, /karen/i, /moira/i, /tessa/i, /daniel/i, /zira/i, /hazel/i];
const MAX_QUEUE = 5, DELAY = 0.35;

export class SystemVoice {
  constructor(game) {
    this.game = game;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis || null : null;
    this.settings = { ...DEFAULTS };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* defaults */ }
    this.voice = null; this.out = 0; this.last = new Map(); this.analysed = new Map();
    if (this.synth) {
      this.pick();
      this.synth.addEventListener?.('voiceschanged', () => this.pick());
    }
    this.rules();
  }
  get ok() { return !!this.synth && this.settings.on; }
  voices() { return this.synth ? this.synth.getVoices().filter((v) => /^en/i.test(v.lang)) : []; }
  pick() {
    const all = this.voices();
    this.voice = all.find((v) => v.name === this.settings.voice) || null;
    if (!this.voice) for (const re of PREFER) { this.voice = all.find((v) => re.test(v.name)); if (this.voice) break; }
    if (!this.voice) this.voice = all.find((v) => /en-GB/i.test(v.lang)) || all[0] || null;
  }
  set(o) {
    Object.assign(this.settings, o);
    try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch { /* this session only */ }
    if ('voice' in o) this.pick();
    if (!this.settings.on) { this.synth?.cancel(); this.out = 0; }
  }

  /** Say a line (after the chime that comes with it). Dropped if the voice is off, the page hidden, the line said too recently,
   *  or too many are already waiting. */
  say(text, { key = text, throttle = 4 } = {}) {
    if (!this.ok || document.hidden) return false;
    const now = performance.now() / 1000;
    if (now - (this.last.get(key) ?? -1e9) < throttle) return false;
    if (this.out >= MAX_QUEUE) return false;
    this.last.set(key, now);
    this.out++;
    setTimeout(() => this.speak(text), DELAY * 1000);
    return true;
  }
  speak(text) {
    if (!this.ok) { this.out = Math.max(0, this.out - 1); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; } else u.lang = 'en-GB';
      u.rate = this.settings.rate; u.pitch = this.settings.pitch; u.volume = this.settings.volume;
      const done = () => { this.out = Math.max(0, this.out - 1); };
      u.onend = done; u.onerror = done;
      this.synth.speak(u);
      this.game.events?.emit('voice.say', { line: text });
    } catch { this.out = Math.max(0, this.out - 1); }
  }

  // ---------------------------------------------------------------- what the System says, and when
  rules() {
    const g = this.game, on = (k, f) => g.events?.on(k, (e) => { try { f(e || {}); } catch (err) { console.warn('voice', k, err); } });
    on('achievement', (e) => {
      if (!e.ach) return;
      this.say(`Notice. Achievement acquired: ${e.ach}.`, { key: `ach.${e.id}` });
      if (e.title) this.say(`Title acquired: ${e.title}.`, { key: `title.${e.id}` });
    });
    on('rank.up', (e) => this.say(`Notice. Your rank has risen. You are now known as a ${e.rank}.`, { key: 'rank' }));
    on('system.unlock', (e) => {
      if (g.system?.lab) return;
      const a = BY_ID[e.ability];
      this.say(e.variant ? `Notice. Variant acquired: ${e.title}.` : `Notice. ${a?.realm === 'god' ? 'God art' : 'Skill'} acquired: ${e.title}.`, { key: `skill.${e.ability}.${e.variant || ''}` });
    });
    on('bestiary.fact', (e) => {
      const b = g.veritome?.book.bestiary, C = CREATURES[e.creature];
      if (!b || !C) return;
      const u = b.understanding(e.creature), was = this.analysed.get(e.creature) ?? tierOf(u.n - 1, u.of);
      this.analysed.set(e.creature, Math.max(was, u.tier));
      if (u.tier === 4 && was < 4) this.say(`Notice. Analysis of the ${C.name} is complete.`, { key: `an.${e.creature}` });
      else if (u.tier === 3 && was < 3) this.say(`Notice. Analysis of the ${C.name} has progressed.`, { key: `an.${e.creature}` });
    });
    on('card.get', (e) => {
      const A = CARD[e.card];
      if (e.first && A && (A.rank === 'S' || A.rank === 'SS')) this.say(`Notice. A rank ${A.rank === 'SS' ? 'double S' : 'S'} card has been bound. ${A.name}.`, { key: `card.${e.card}` });
    });
    on('item.full', (e) => this.say(`Warning. The Pneuka Box is full. ${itemOf(e.item)?.name || 'It'} has been left on the ground.`, { key: 'full', throttle: 30 }));
    on('chest.open', (e) => { if (e.tier === 4) this.say('Warning. Abnormal concentration of Lachryma detected.', { key: 'prismatic', throttle: 20 }); });
    on('angle.landed', (e) => { const sp = BY_SPECIES[e.species]; if (sp?.legend) this.say(`Notice. ${sp.name} has been landed.`, { key: 'legend' }); });
  }
}
