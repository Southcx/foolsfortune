// ---------------------------------------------------------------------------------------
// THE SYSTEM'S VOICE: the few things that matter, said aloud. An achievement, a skill learned, a creature's analysis finished, a rank
// S card bound, the Pneuka Box full: the log still writes its line (it is the only TEXT feedback, gamelog.js), and the System also
// says it, once, in a calm, even voice that begins "Notice." The rest of the game stays quiet: a voice that talks all the time is
// one nobody listens to.
//
// The voice is the game's own (speech/synth.js): a formant synthesizer, a glottis and a vocal tract made of filters, speaking from a
// pronouncing dictionary built from the game's own words (speech/lexicon.js). It sounds the same in every browser and asks nothing
// of the machine. It is set where it suits the System: a little above the middle of a speaking voice, even, unhurried, the pitch
// falling at the end of each sentence. A soft two-note chime comes first (a notice rises, a warning falls), and the voice itself is
// lightly treated: a faint doubling (a chorus of a few milliseconds), some presence, a little of the hall. The music dips while it
// speaks. The Codex header has its switch (VOICE), kept in the browser.
//
// Prior art: the "World Voice" and the Great Sage of That Time I Got Reincarnated as a Slime ("Notice. ... Confirmed." — a flat,
// helpful announcer of skills acquired and analyses complete), the System windows of Solo Leveling and its isekai kin, and the
// speaking machines of the eighties (DECtalk, SAM) whose formant voices are what this one is made the way of. Its rules are a table
// over the event bus, as tracking.js's are for the log.
//
//   const v = new SystemVoice(game)   v.say(text, { key, throttle })   v.set({ on, pitch, rate })
// ---------------------------------------------------------------------------------------
import { CREATURES, tierOf } from '../veritome/bestiary.js';
import { CARD } from '../veritome/cards.js';
import { BY_ID } from './skills.js';
import { itemOf } from '../pneuka/items.js';
import { BY_SPECIES } from '../angling/species.js';
import { synthesize } from './speech/synth.js';
import { sfx } from '../audio.js';

const KEY = 'foolsfortune.voice.v2';
// (a little above the middle of a speaking voice; a touch of brightness; even pace)
export const DEFAULTS = { on: true, pitch: 185, rate: 1, volume: 0.9 };
const MAX_QUEUE = 4, DELAY = 0.35;

export class SystemVoice {
  constructor(game) {
    this.game = game;
    this.settings = { ...DEFAULTS };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* defaults */ }
    this.queue = []; this.busyUntil = 0; this.last = new Map(); this.analysed = new Map();
    this.rules();
  }
  get ok() { return this.settings.on; }
  set(o) {
    Object.assign(this.settings, o);
    try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch { /* this session only */ }
  }

  /** Say a line: dropped if the voice is off, the page hidden, the line said too recently, or too many already wait. */
  say(text, { key = text, throttle = 4, tone = 'notice' } = {}) {
    if (!this.ok || (typeof document !== 'undefined' && document.hidden)) return false;
    const now = performance.now() / 1000;
    if (now - (this.last.get(key) ?? -1e9) < throttle) return false;
    if (this.queue.length >= MAX_QUEUE) return false;
    this.last.set(key, now);
    this.queue.push({ text, tone });
    if (this.queue.length === 1) setTimeout(() => this.pump(), DELAY * 1000);
    return true;
  }
  pump() {
    const q = this.queue[0];
    if (!q) return;
    const ctx = sfx.ctx;
    if (!ctx || ctx.state !== 'running' || !this.ok) { this.queue.length = 0; return; }
    const t0 = Math.max(ctx.currentTime + 0.02, this.busyUntil);
    const dur = this.speak(q.text, q.tone, t0);
    this.busyUntil = t0 + dur + 0.25;
    this.game.events?.emit('voice.say', { line: q.text });
    setTimeout(() => { this.queue.shift(); this.pump(); }, (this.busyUntil - ctx.currentTime) * 1000);
  }

  /** Render the line and play it (after its chime) at audio time t0; returns how long it lasts. */
  speak(text, tone, t0) {
    const ctx = sfx.ctx;
    let r;
    try { r = synthesize(text, { f0: this.settings.pitch, rate: this.settings.rate }); } catch (e) { console.warn('voice', e); return 0; }
    const buf = ctx.createBuffer(1, r.samples.length, r.fs); buf.copyToChannel(r.samples, 0);
    const chime = this.chime(t0, tone), start = t0 + chime;
    const src = ctx.createBufferSource(); src.buffer = buf;
    // the treatment: no rumble, a little presence, a faint doubling, a little of the hall
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 130;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 2800; pres.gain.value = 3; pres.Q.value = 0.8;
    const out = ctx.createGain(); out.gain.value = this.settings.volume;
    src.connect(hp).connect(pres).connect(out);
    for (const [ms, pan] of [[9, -0.35], [14, 0.35]]) {
      const d = ctx.createDelay(0.05), p = ctx.createStereoPanner(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      d.delayTime.value = ms / 1000; p.pan.value = pan; g.gain.value = 0.22; lfo.frequency.value = 0.6 + ms * 0.02; lg.gain.value = 0.0012;
      lfo.connect(lg).connect(d.delayTime); pres.connect(d).connect(g).connect(p).connect(out);
      lfo.start(start); lfo.stop(start + buf.duration + 0.2);
    }
    out.connect(sfx.master); out.connect(sfx.verbSend);
    src.start(start);
    this.game.music?.duck(chime + buf.duration + 0.3);
    return chime + buf.duration;
  }
  /** The two notes before a line: a notice rises a fifth, a warning falls a fourth. */
  chime(t, tone) {
    const ctx = sfx.ctx, g = ctx.createGain(); g.connect(sfx.master); g.connect(sfx.verbSend);
    const notes = tone === 'warning' ? [659, 494] : [784, 1175];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), e = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      const s = t + i * 0.12; e.gain.setValueAtTime(0.0001, s); e.gain.exponentialRampToValueAtTime(0.09, s + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
      o.connect(e).connect(g); o.start(s); o.stop(s + 0.55);
    });
    return 0.3;
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
    on('item.full', (e) => this.say(`Warning. The Pneuka Box is full. ${itemOf(e.item)?.name || 'It'} has been left on the ground.`, { key: 'full', throttle: 30, tone: 'warning' }));
    on('chest.open', (e) => { if (e.tier === 4) this.say('Warning. Abnormal concentration of Lachryma detected.', { key: 'prismatic', throttle: 20, tone: 'warning' }); });
    on('angle.landed', (e) => { const sp = BY_SPECIES[e.species]; if (sp?.legend) this.say(`Notice. ${sp.name} has been landed.`, { key: 'legend' }); });
  }
}
