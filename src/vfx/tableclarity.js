// ---------------------------------------------------------------------------------------
// THE TABLE'S CLARITY LAYER (docs/plans/CASINO-CLARITY.md sections 4 to 8; the owner, 2026-10-15: "a nine-year-old works any game out in two
// minutes"): the words and numbers a seat at Raku's tables shows over the cloth, all of it drawn from the coach (progress/casino/coach/) and
// none of it deciding a rule. One job: the DOM side of the table view (vfx/bazaartable.js owns the scene, the pieces and the camera).
//   - THE HUD (ui/tablehud.js): a plate for each seat at its projected place, the goal bar, the turn banner (YOUR TURN in Red and what to do).
//   - THE ACTION BAR (ui/tablebuttons.js): the coach's moves that are no single piece (and a handful or a set of tiles, when few), each with
//     its price and preview and the house's pick glinting gold; AGAIN and STAND UP when the game is over. Hover lights its pieces.
//   - THE TIP (ui/tabletip.js): the label, the line and the preview of the piece under the cursor.
//   - WORDS ON THE CLOTH (the layout's anchors with `text`): the shared numbers, the equation, what you need, the odds, a throw's waits,
//     a Major Arcana's line, the gold brackets round the hand's groups. Each is projected every frame, written when it changes.
//   - THE COUNT-UP (ui/scoreceremony.js): each new outcome in the coach's steps told once, with Wanda's casino sounds on its beats if
//     the game has them (`game.sfx.casinoTick / casinoMult / casinoReel / casinoFlourish`), and a shake of the camera in proportion.
//   - THE HOW-TO (ui/howto.js `playCoach`): the coach's steps on a spotlight on the part of the table each is about, from the session's
//     howto (the first sit, or the "?" button).
// Everything goes away on close(). No localStorage; no shader programs (DOM and CSS).
//
// Prior art: the poker clients' seats and action buttons, Monster Train's previews, Balatro's HUD and count-up, Slay the Spire's tips.
//
//   const tc = new TableClarity(game, { project(v3) -> {x, y, off}, pieceRect(role) -> {x0,y0,x1,y1}, hover(ids|null), picked() })
//   tc.open(session)   tc.sync(coach, session)   tc.frame(dt, { coach, anchors, pick, chosen, actable, hoverId, hoverTip, mouse })   tc.close()
//   tc.jolt(dt) -> shake offset in px   tc.rectOf(role) -> DOMRect | null   tc.busy (a count-up or the how-to is up)
// ---------------------------------------------------------------------------------------
import { TableHud } from '../ui/tablehud.js';
import { actionBar } from '../ui/tablebuttons.js';
import { showTableTip, hideTableTip } from '../ui/tabletip.js';
import { ScoreCeremony, readCeremony } from '../ui/scoreceremony.js';
import { playCoach, howTo, helpButton } from '../ui/howto.js';

const SPEED = { normal: 1, fast: 1.6, fastest: 2.6 };
const BEAT_SFX = { tick: 'casinoTick', mult: 'casinoMult', reel: 'casinoReel', flourish: 'casinoFlourish' };
const HIDE_CENTRE = new Set(['Dice', 'Attack die']); // (the dice are on the cloth, and the equation under them)
const GOLD = '#f2c14e';
const CSS = `
.tc-layer { position: fixed; inset: 0; z-index: 4; pointer-events: none; --u: calc(100vh / 1080); font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; color: #f4ecd8; }
.tc-lab { position: absolute; left: 0; top: 0; white-space: nowrap; text-shadow: 0 calc(2 * var(--u)) 0 #000c, 0 0 calc(10 * var(--u)) #000; font-weight: 900; will-change: transform; }
.tc-lab.equation { font-size: calc(38 * var(--u)); letter-spacing: .03em; padding: calc(4 * var(--u)) calc(16 * var(--u)); background: #12163acc; border-radius: calc(10 * var(--u)); }
.tc-lab.need { font-size: calc(30 * var(--u)); color: ${GOLD}; padding: calc(4 * var(--u)) calc(16 * var(--u)); background: #12163acc; border-radius: calc(10 * var(--u)); }
.tc-lab.odds { font-size: calc(26 * var(--u)); padding: calc(6 * var(--u)) calc(14 * var(--u)); background: #12163aee; border: calc(2 * var(--u)) solid ${GOLD}; border-radius: calc(10 * var(--u)); }
.tc-lab.legend { font-size: calc(18 * var(--u)); color: #cfc6dc; opacity: .9; }
.tc-lab.waits { width: calc(40 * var(--u)); height: calc(40 * var(--u)); border-radius: 50%; display: grid; place-items: center; font-size: calc(26 * var(--u)); background: #12163aee; border: calc(3 * var(--u)) solid #7ee0a1; color: #7ee0a1; }
.tc-lab.waits.dim { border-color: #6c6678; color: #a39dab; }
.tc-lab.arcana { font-size: calc(22 * var(--u)); padding: calc(4 * var(--u)) calc(10 * var(--u)); background: #12163ad8; border-radius: calc(8 * var(--u)); border-left: calc(4 * var(--u)) solid ${GOLD}; white-space: normal; width: calc(250 * var(--u)); }
.tc-lab.arcana small { display: block; font-size: calc(17 * var(--u)); font-weight: 600; opacity: .88; line-height: 1.15; }
.tc-lab.centre { text-align: center; }
.tc-lab.centre div { display: flex; flex-direction: column; align-items: center; line-height: 1; margin-bottom: calc(12 * var(--u)); }
.tc-lab.centre b { font-size: calc(30 * var(--u)); } .tc-lab.centre i { font-style: normal; font-size: calc(15 * var(--u)); letter-spacing: .08em; color: #cfc6dc; text-transform: uppercase; }
.tc-lab.centre .big b { font-size: calc(76 * var(--u)); } .tc-lab.centre .big i { font-size: calc(20 * var(--u)); color: ${GOLD}; }
.tc-br { position: absolute; left: 0; top: 0; height: 0; transform-origin: 0 50%; border-bottom: calc(5 * var(--u)) solid var(--bc); filter: drop-shadow(0 0 calc(5 * var(--u)) var(--bg)); }
.tc-br::before, .tc-br::after { content: ''; position: absolute; bottom: calc(-5 * var(--u)); width: calc(5 * var(--u)); height: calc(18 * var(--u)); background: var(--bc); }
.tc-br::before { left: 0; } .tc-br::after { right: 0; }
.tc-br.rim { border-bottom-width: calc(2 * var(--u)); } .tc-br.rim::before, .tc-br.rim::after { width: calc(2 * var(--u)); height: calc(10 * var(--u)); bottom: calc(-2 * var(--u)); }
.tc-end { position: absolute; left: 50%; top: calc(28 * var(--u)); transform: translateX(-50%); font-size: calc(44 * var(--u)); font-weight: 900; text-align: center; padding: calc(12 * var(--u)) calc(28 * var(--u)); border-radius: calc(14 * var(--u)); max-width: calc(1100 * var(--u));
  background: linear-gradient(180deg, #2a1f38ee, #12163aee); border: calc(3 * var(--u)) solid ${GOLD}; text-shadow: 0 calc(3 * var(--u)) 0 #000b; }
.tc-end[hidden] { display: none; }
.tc-corner { position: absolute; left: calc(14 * var(--u)); top: calc(250 * var(--u)); font-size: calc(17 * var(--u)); font-weight: 700; text-align: left; text-shadow: 0 calc(2 * var(--u)) 0 #000c; color: #cfc6dc; }
.tc-corner b { color: ${GOLD}; }
`;
const el = (cls, tag = 'div', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

export class TableClarity {
  constructor(game, { project, pieceRect, hover, picked } = {}) {
    this.game = game; this.project = project; this.pieceRect = pieceRect; this.onHover = hover; this.onPicked = picked;
    this.hud = null; this.bar = null; this.ceremony = null; this.help = null; this.layer = null; this.labels = new Map();
    this.shakeLeft = 0; this.shakeP = 0; this.barKey = ''; this.sess = null; this.coach = null; this.seenAt = -1; this.S = null; this.howtoOn = false;
  }
  get busy() { return !!(this.ceremony?.el || this.howtoOn); }

  open(session) {
    if (this.layer) return;
    if (!document.getElementById('tc-style')) { const st = el('', 'style'); st.id = 'tc-style'; st.textContent = CSS; document.head.appendChild(st); }
    this.sess = session;
    this.layer = el('tc-layer'); document.body.appendChild(this.layer);
    this.end = el('tc-end'); this.end.hidden = true; this.corner = el('tc-corner'); this.layer.append(this.end, this.corner);
    this.hud = new TableHud().mount(this.layer); this.hud.root.style.position = 'absolute'; this.hud.root.style.zIndex = '1'; this.hud.show();
    this.bar = actionBar([], (id) => this.pick(id), { onHover: (m) => this.onHover?.(m ? new Set(m.pieceIds || []) : null) });
    this.bar.style.display = 'none'; document.body.appendChild(this.bar);
    this.ceremony = new ScoreCeremony({ root: document.body, events: this.game.events, hud: { shake: (p) => this.shake(p) },
      onBeat: (kind, info) => { try { this.game.sfx?.[BEAT_SFX[kind]]?.(info); } catch { /* a sound never stops the count */ } } });
    this.help = helpButton(() => (this.sess?.real || this.sess)?.showHowto?.(), { label: 'How to play' });
  }
  close() {
    if (!this.layer) return;
    this.stopHowto(); this.ceremony?.close(); this.ceremony = null; hideTableTip();
    this.bar?.dispose?.(); this.bar?.remove(); this.bar = null; this.help?.remove(); this.help = null;
    this.hud?.unmount(); this.hud = null; this.layer.remove(); this.layer = null; this.labels.clear();
    this.sess = null; this.coach = null; this.S = null; this.barKey = ''; this.seenAt = -1;
  }

  shake(power) { this.shakeP = Math.max(this.shakeP, power); this.shakeLeft = 0.2 + 0.3 * power; }
  /** The camera's shake this frame (pixels-ish, in metres of camera drift: small), decaying. */
  jolt(dt) {
    if (this.shakeLeft <= 0) return 0;
    this.shakeLeft -= dt; if (this.shakeLeft <= 0) { this.shakeP = 0; return 0; }
    return this.shakeP * 0.03 * Math.min(1, this.shakeLeft * 4);
  }

  /** A choice made on the action bar: AGAIN and STAND UP are the table's; the rest are the coach's moves. */
  pick(id) {
    const s = this.sess, c = this.coach; if (!s || !c || s.demo) return;
    if (id === 'again') { s.again(); return; }
    if (id === 'rise') { s.close(); return; }
    const m = c.moves[id]; if (!m) return;
    this.onHover?.(null); this.onPicked?.(); s.move(m.move);
  }

  /** The coach changed (a move, a turn): the plates, the goal, the banner, the count-up, the how-to. */
  sync(coach, s) {
    this.coach = coach; this.sess = s; const T = s.T, R = s.demo ? null : T.game.result(s.S), over = coach.phase === 'over';
    // the plates
    const seats = coach.seats.map((q) => ({ seat: q.seat, colour: q.colourName, name: q.name, state: over && R?.winner === q.seat ? 'winner' : /^Over/.test(q.badge || '') ? 'out' : q.turn && !over ? 'acting' : 'idle',
      stats: (q.stats || []).map((t) => ({ label: t.label, value: t.value, kind: t.kind, tier: t.big ? 'L' : 'M' })) }));
    this.hud.setSeats(seats);
    // the goal: one shape for every game; Querent's is its three groups
    const g = coach.goal, label = (i) => coach.seats[i]?.colourName || 'White';
    let tracks = (g.perSeat || []).map((p) => ({ seat: p.seat, colour: label(p.seat), value: p.value })), target = g.target, glabel = g.label;
    if (g.groups) { target = g.groups.of; glabel = 'Groups of 3'; tracks = [{ seat: 0, colour: label(0), value: g.groups.value }]; }
    this.hud.setGoal({ label: glabel, line: g.line, target: target || Math.max(1, ...tracks.map((t) => t.value)), tracks, marks: [] });
    // the banner
    const turn = coach.turn;
    if (over) { this.hud.setTurn(null); this.end.textContent = turn.say || ''; this.end.hidden = false; } else {
      this.end.hidden = true;
      this.hud.setTurn(turn.seat == null ? null : { seat: turn.seat, colour: label(turn.seat), say: turn.say, mine: !!turn.yours });
    }
    // the corner: the stake
    const bal = this.game.chips?.balance ?? 0;
    this.corner.innerHTML = s.demo || s.practice ? '<b>PRACTICE</b> · no chips at stake · F to stand up' : `Stake <b>${T.stake}</b> · you hold <b>${bal}</b> chips · F to stand up`;
    this.countUp(coach, s);
    if (s.where === 'howto' && s.howto && !this.howtoOn) this.startHowto(s); else if (s.where !== 'howto' && this.howtoOn) this.stopHowto();
  }

  /** Each new outcome in the coach's steps is told once (a new game starts from what is already there). */
  countUp(coach, s) {
    if (s.demo) return;
    const at = coach.steps?.at ?? -1;
    if (this.S !== s.S) { this.S = s.S; this.seenAt = at; return; }
    if (!coach.steps || at <= this.seenAt) return;
    this.seenAt = at;
    const x = s.S.log[at], who = x?.win ?? x?.seat ?? x?.nova ?? null, name = who != null && who !== 0 ? s.T.names[who] : null, title = readCeremony(coach.steps).title;
    const speed = SPEED[this.game.bazaar?.prefs?.speed] || 1;
    this.ceremony?.play(coach.steps, { title: name ? `${name.toUpperCase()}: ${title}` : title, speed, by: 'courier' });
  }

  startHowto(s) {
    this.howtoOn = true; // (the demo table is the view's own; the lesson and its end are the real session's)
    const r = s.real || s, steps = r.howto.steps, done = () => { this.howtoOn = false; r.howtoStep(steps.length); };
    playCoach(steps, { resolve: (role) => this.rectOf(role), onDone: done, onSkip: () => { this.howtoOn = false; r.howtoStep('skip'); } });
  }
  stopHowto() { if (this.howtoOn) { this.howtoOn = false; try { howTo().stop(); } catch { /* it was not up */ } } }

  /** A how-to role as a rectangle on the screen: a plate or the bar, or the screen box of the pieces that carry that role. */
  rectOf(role) {
    const R = (a) => (a ? new DOMRect(a.left, a.top, a.width, a.height) : null);
    if (role === 'goal') return R(this.hud?.bar?.getBoundingClientRect());
    if (role === 'seats') { const rs = [...(this.hud?.plates.values() || [])].map((p) => p.getBoundingClientRect()); if (rs.length) { const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top)); return new DOMRect(l, t, Math.max(...rs.map((r) => r.right)) - l, Math.max(...rs.map((r) => r.bottom)) - t); } }
    if (role === 'moves' && this.bar?.style.display !== 'none' && this.bar.children.length) return R(this.bar.getBoundingClientRect());
    const b = this.pieceRect?.(role); if (b) return new DOMRect(b.x0 - 14, b.y0 - 14, b.x1 - b.x0 + 28, b.y1 - b.y0 + 28);
    if (role === 'centre') return R(this.labels.get('centre')?.el.getBoundingClientRect());
    return null;
  }

  /** Every frame: place the plates and the goal, write the words on the cloth, show the bar and the tip. */
  frame(dt, { anchors = [], pick = null, chosen = null, actable = null, hoverId = null, hoverTip = null, mouse = null } = {}) {
    if (!this.layer || !this.coach) return;
    const W = innerWidth, H = innerHeight, u = H / 1080, seen = new Set(), c = this.coach;
    for (const a of anchors) {
      const p = this.project(a.at);
      if (a.key.startsWith('seat:')) { const q = +a.key.slice(5); if (q === 0) this.hud.place(a.key, 230 * u, H * 0.5); else this.hud.place(a.key, Math.max(130 * u, Math.min(W - 130 * u, p.x)), Math.max(95 * u, Math.min(H - 215 * u, p.y))); continue; } // (yours stands at the left, clear of the log)
      if (a.key === 'goal') { const g = this.hud.anchors.get('goal'); if (g) { g.style.display = ''; g.style.transform = `translate(${14 * u + 252 * u}px, ${14 * u + 104 * u}px) translate(-50%, -50%) scale(.7)`; } continue; }
      if (a.key === 'centre') { this.write('centre', 'centre', p, c.centre.filter((e) => !HIDE_CENTRE.has(e.label)), seen); continue; }
      if (a.text || a.kind === 'bracket') this.write(a.key, a.kind || 'legend', p, a, seen, a.to ? this.project(a.to) : null);
    }
    for (const [k, v] of this.labels) if (!seen.has(k)) { v.el.remove(); this.labels.delete(k); }
    // the bar: the coach's moves that are no single piece, and a handful or a set of tiles when few; the house's pick; AGAIN and STAND UP at the end
    const moves = this.barMoves(c, pick, chosen, actable), key = JSON.stringify(moves.map((m) => [m.id, m.best, m.label, m.preview]));
    if (key !== this.barKey) { this.barKey = key; this.bar.set(moves); this.bar.style.display = moves.length ? '' : 'none'; }
    // the tip under the cursor
    if (hoverTip && mouse && !this.ceremony?.el) showTableTip(hoverTip, mouse.x, mouse.y); else hideTableTip();
  }

  barMoves(c, pick, chosen, actable) {
    if (c.phase === 'over') return this.sess?.demo ? [] : [{ id: 'again', label: 'AGAIN', line: 'Another game at this table.', size: 'big', best: true }, { id: 'rise', label: 'STAND UP', line: 'Leave the table.', size: 'small' }];
    if (c.phase !== 'yours') return [];
    const pool = chosen?.size && pick ? pick.moves : c.moves, hand = (m) => m.dice || m.tiles || m.cards;
    const on = pool.filter((m) => !m.pieceIds?.length || !m.pieceIds.every((id) => actable?.has(id)) || hand(m));
    const best = chosen?.size && pick?.complete ? pick.complete : null;
    if (on.length > 9) return [];
    return on.map((m) => ({ id: m.id, label: m.label, line: m.line, amount: m.amount, preview: m.preview, tone: m.tone, best: best ? m === best : m.best, size: m.size, pieceIds: m.pieceIds }));
  }

  /** One word or mark on the cloth, at a projected point (made, written when it changes, moved). */
  write(key, kind, p, a, seen, to = null) {
    seen.add(key);
    let L = this.labels.get(key);
    if (!L) { L = { el: el(kind === 'bracket' ? 'tc-br' : `tc-lab ${kind}`), sig: '' }; this.layer.appendChild(L.el); this.labels.set(key, L); }
    const e = L.el;
    if (kind === 'bracket') {
      if (!to || p.off || to.off) { e.style.display = 'none'; return; }
      const dx = to.x - p.x, dy = to.y - p.y, gold = a.tone === 'gold';
      e.style.display = ''; e.className = `tc-br${gold ? '' : ' rim'}`; e.style.setProperty('--bc', gold ? GOLD : '#cfc6dc'); e.style.setProperty('--bg', gold ? '#f2c14e88' : '#0000');
      e.style.width = `${Math.hypot(dx, dy)}px`; e.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${Math.atan2(dy, dx)}rad)`; return;
    }
    const sig = kind === 'centre' ? JSON.stringify(a) : `${a.text}|${a.sub || ''}|${a.tone || ''}`;
    if (sig !== L.sig) {
      L.sig = sig; e.className = `tc-lab ${kind}${a.tone === 'dim' ? ' dim' : ''}`;
      if (kind === 'centre') { e.replaceChildren(...a.map((r) => { const d = el(r.big ? 'big' : ''); d.append(el('', 'b', String(r.value)), el('', 'i', r.label)); return d; })); }
      else { e.textContent = a.text; if (a.sub) { const s = el('', 'small', a.sub); e.appendChild(s); } }
    }
    const left = kind === 'arcana';
    e.style.display = p.off ? 'none' : ''; e.style.transform = `translate(${p.x}px, ${p.y}px) translate(${left ? '0' : '-50%'}, -50%)`;
  }
}
