// ---------------------------------------------------------------------------------------
// THE FLASH: the Veritome's lens, at full charge on a creature with a mind (tagged 'programmable'), does not only hold it to what is
// real: it OPENS it. For a while (the WINDOW, a few seconds, set with /flash) its program lies open in the chat line, and what the
// Courier types into it, it does. The program shows a handful of VERBS, each in three phrasings, short, longer and longest: the longer
// the phrase typed, the stronger and the longer what it does (halt for a moment, or until she says so). A wrong letter costs time;
// Enter runs a phrase typed whole; Esc closes it. Each verb answers once a flash. While it is open the world slows (the typing is real
// time, the world is not), and a ring of light at the creature's foot burns down with the window: the clock is on the creature, not
// on the screen. Flashed again soon after, a creature has learned: its window is shorter.
//
// What a verb does is a STATUS on the creature (creatures.js: halt, slow, sleep, forget, flee, soft, calm, melt) or, for STOP, the
// cancelling of a wind-up in progress. The creature decides what each means for it (jelly/slipjelly.js).
//
// Prior art: The Typing of the Dead (a word over each enemy; typed whole, it acts; longer words for bigger threats), Epistory (typing
// as the way to act on the world), Transistor's Turn() (the world paused while a plan is written into it), NieR: Automata's hacking and
// Watch Dogs' profiler (a creature's insides opened for a few seconds), Hacknet and else Heart.Break() (the world as programs that take
// commands), and the status spells of the JRPG. And Fatal Frame, whose camera the Veritome's capture already was.
//
//   game.flash.open(creature, quality 0..1)   game.flash.active   game.flash.window (seconds, /flash <s>)   game.flash.close()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { hasTag } from '../tags.js';
import { sfx } from '../audio.js';

/** The verbs: three phrasings each ({it}: what the creature is called, short), what they put on it, and for how long (x the tier). */
export const VERBS = {
  halt: { phrases: ['halt', 'halt and hold', 'halt and hold until i say'], status: 'halt', base: 1.2 },
  slow: { phrases: ['slow', 'slow down now', 'slow down and stay slow'], status: 'slow', base: 2.5 },
  sleep: { phrases: ['sleep', 'go to sleep', 'go to sleep little {it}'], status: 'sleep', base: 2.2 },
  forget: { phrases: ['forget', 'forget the courier', 'forget you ever saw her'], status: 'forget', base: 3 },
  flee: { phrases: ['flee', 'go back home', 'go back home and stay there'], status: 'flee', base: 2 },
  soft: { phrases: ['soften', 'soften your skin', 'soften your skin to nothing'], status: 'soft', base: 2.5 },
  calm: { phrases: ['calm', 'calm yourself', 'calm yourself and be still'], status: 'calm', base: 3 },
  melt: { phrases: ['melt', 'melt into slip', 'melt into a puddle of slip'], status: 'melt', base: 1.3 },
  cancel: { phrases: ['stop', 'stop that', 'stop that right now'], cancel: true },
};
export const TIER = [1, 2.4, 4.5]; // (how much longer each longer phrasing holds)
const KEY = 'foolsfortune.flash.v1';
const SHOWN = 4, PENALTY = 0.45, SLOW = 0.3, RESIST = { within: 30, k: 0.7 };
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').replace(/^ /, '');

export class Flash {
  constructor(game) {
    this.game = game;
    this.window = 8;
    try { const w = JSON.parse(localStorage.getItem(KEY) || '{}').window; if (w >= 3 && w <= 30) this.window = w; } catch { /* default */ }
    this.cur = null;
    const st = document.createElement('style'); st.textContent = FLASH_CSS; document.head.appendChild(st);
    // the clock on the creature: a ring at its foot that burns down with the window
    const geo = new THREE.RingGeometry(0.85, 1.0, 48, 1);
    this.ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xc9a6ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; this.ring.renderOrder = 5;
    this.ringCount = geo.index.count;
    game.scene.add(this.ring);
    game.chat?.add('flash', { help: `how long the Veritome's Flash holds a mind open: /flash <seconds> (3 to 30; now ${this.window})`, run: ([v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 3 && n <= 30) { this.window = n; try { localStorage.setItem(KEY, JSON.stringify({ window: n })); } catch { /* this session */ } }
      game.events?.emit('flash.window', { seconds: this.window });
    } });
  }
  get active() { return !!this.cur; }

  /** The lens has flashed a creature at full charge: open it, if it has a mind. */
  open(c, quality = 0.5) {
    const g = this.game;
    if (!c?.alive || !hasTag(c, 'programmable')) return false;
    if (this.cur) this.close('replaced');
    const now = performance.now() / 1000;
    const learned = c.flashedAt && now - c.flashedAt < RESIST.within ? (c.flashN || 0) : 0;
    c.flashedAt = now; c.flashN = learned + 1;
    const total = this.window * (0.8 + 0.4 * quality) * Math.pow(RESIST.k, learned);
    // what of its program shows this time: STOP always, and a handful of the rest
    const pool = (c.verbs || []).filter((v) => v !== 'cancel' && VERBS[v]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const verbs = [...pool.slice(0, SHOWN), ...((c.verbs || []).includes('cancel') ? ['cancel'] : [])];
    const it = (c.name || 'it').toLowerCase().split(' ').pop();
    this.cur = { c, t: total, total, verbs, used: new Set(), typed: '', bad: 0, it, lines: verbs.map((v) => ({ v, phrases: VERBS[v].phrases.map((p) => p.replace('{it}', it)) })) };
    g.log?.setMode({ prompt: `${it}>`, onInput: (v) => this.input(v), onSend: (v) => this.send(v), onEscape: () => this.close('closed') });
    this.draw();
    sfx.shutter?.(); sfx.menuOpen?.();
    g.events?.emit('flash.open', { kind: c.kind, seconds: +total.toFixed(1), verbs: verbs.length });
    return true;
  }

  close(why = 'time') {
    const g = this.game, q = this.cur;
    if (!q) return;
    this.cur = null;
    this.ring.visible = false;
    g.time?.free('flash');
    g.log?.setMode(null);
    g.events?.emit('flash.close', { why, kind: q.c.kind, used: q.used.size });
  }

  /** What is typed, as it is typed: a letter that fits no phrase costs time (The Typing of the Dead's miss). */
  input(v) {
    const q = this.cur;
    if (!q) return;
    const t = norm(v);
    if (t.length > q.typed.length && t && !this.fits(t)) {
      q.t -= PENALTY; q.bad++;
      sfx.dryFire?.();
      this.game.events?.emit('flash.miss', {});
    } else if (t.length > q.typed.length) sfx.menuMove?.();
    q.typed = t;
    this.draw();
  }
  fits(t) { const q = this.cur; return q.lines.some((L) => !q.used.has(L.v) && L.phrases.some((p) => p.startsWith(t))); }

  /** Enter: a phrase typed whole runs. */
  send(v) {
    const g = this.game, q = this.cur;
    if (!q) return;
    const t = norm(v).trim();
    let hit = null;
    for (const L of q.lines) { if (q.used.has(L.v)) continue; const i = L.phrases.indexOf(t); if (i >= 0) hit = { L, i }; }
    q.typed = '';
    if (!hit) { q.t -= PENALTY; sfx.fizzle?.(); g.events?.emit('flash.miss', { whole: true }); this.draw(); return; }
    const V = VERBS[hit.L.v], c = q.c;
    q.used.add(hit.L.v);
    let ok = true;
    if (V.cancel) ok = !!c.cancel?.('typed');
    else ok = g.creatures.apply(c, V.status, V.base * TIER[hit.i], hit.i + 1, 'courier');
    sfx.menuOk?.();
    g.events?.emit('flash.cast', { verb: hit.L.v, tier: hit.i + 1, chars: t.length, took: ok, kind: c.kind });
    this.draw();
    if (q.used.size >= q.lines.length) this.close('spent');
  }

  draw() {
    const q = this.cur, el = this.game.log?.prog;
    if (!el || !q) return;
    const k = Math.max(0, q.t / q.total), esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const rows = q.lines.map((L) => {
      const used = q.used.has(L.v);
      const ph = L.phrases.map((p, i) => {
        const on = !used && q.typed && p.startsWith(q.typed);
        const body = on ? `<u>${esc(p.slice(0, q.typed.length))}</u>${esc(p.slice(q.typed.length))}` : esc(p);
        return `<span class="t${i + 1}${on ? ' on' : ''}">${body}</span>`;
      }).join(' <i>·</i> ');
      return `<div class="${used ? 'used' : ''}">${ph}</div>`;
    }).join('');
    el.innerHTML = `<div class="hd"><b>${esc(q.c.name || 'it').toUpperCase()}</b> <s style="--k:${k.toFixed(3)}"></s></div>${rows}`;
  }

  update(rawDt) {
    const q = this.cur, g = this.game;
    if (!q) return;
    if (!q.c.alive || (g.log && !g.log.mode)) { this.close(q.c.alive ? 'closed' : 'gone'); return; }
    q.t -= rawDt;
    g.time?.slow('flash', SLOW);
    // the ring at its foot: the window, burning down
    const k = Math.max(0, q.t / q.total);
    this.ring.visible = true;
    this.ring.position.set(q.c.pos.x, q.c.pos.y + 0.04, q.c.pos.z);
    this.ring.scale.setScalar((q.c.radius || 0.5) * 1.5);
    this.ring.geometry.setDrawRange(0, Math.max(0, Math.floor(this.ringCount * k / 6) * 6));
    this.ring.material.opacity = 0.55 + 0.4 * (k < 0.25 ? 0.5 + 0.5 * Math.cos(q.t * 18) : 1);
    const bar = g.log?.prog?.querySelector('.hd s'); if (bar) bar.style.setProperty('--k', k.toFixed(3));
    if (q.t <= 0) this.close('time');
  }
}

export const FLASH_CSS = `
#chatlog .prog .hd { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; font: 600 11px var(--f-title); letter-spacing: .16em; color: #e7c46a; }
#chatlog .prog .hd s { flex: 1; height: 3px; text-decoration: none; background: linear-gradient(90deg, #c9a6ff calc(var(--k) * 100%), rgba(255,255,255,.08) 0); }
#chatlog .prog div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#chatlog .prog div.used { opacity: .3; text-decoration: line-through; }
#chatlog .prog i { font-style: normal; opacity: .4; }
#chatlog .prog span.t1 { color: #b9a596; } #chatlog .prog span.t2 { color: #d9c3b4; } #chatlog .prog span.t3 { color: #f3e2d6; }
#chatlog .prog span.on { color: #fff; } #chatlog .prog u { text-decoration: none; color: #c9a6ff; text-shadow: 0 0 6px rgba(201,166,255,.8); }
`;
