// ---------------------------------------------------------------------------------------
// THE SEA CHART AT THE PIER (docs/plans/PASSAGE.md 2 to 6; Petra's part: the window, the drafting, the reckoning, the rutter): chosen a
// destination at the pier, the sea between is laid (Dovina's seaChart: columns of waypoints joined by lanes that merge and never cross)
// and drawn left to right from where you stand to where you sail. Each waypoint shows what Divination tells of it (portent: its leg
// exactly, two or three candidates, its class, or a dim star, by a confidence that falls with depth); you DRAFT the passage by clicking
// one waypoint a column along the lanes, then cast off. READ THE SEA (the Dreamvane worn): a needle wanders for four beats and the mouse
// holds a mark on it; how long it was held true is the reckoning (voyage.reckon), and the fog over the chart lifts with it. A rutter
// of this route and game day in the Pneuka Box shows the whole sea exact.
// The look is Calissa's (ui/seachart/seachart.js SeaChartCanvas: the constellation over the crude, the lanes as threads of light, the
// portents by tier, a waypoint's feeling as a halo, the squall's flame, a following sea's beads on its lane) in the Index's window; the
// hovered waypoint's words under it are placeholders for Espada's.
//
// Prior art: Slay the Spire's map (lanes, a budgeted pool, the drafted path), FTL's sector beacons and scanners (sight that falls off),
// Hades' doors (a counted shortlist, never a percentage), Sunless Sea's charts and port reports (the rutter).
//
//   const C = new SeaChart(game, pier)   C.open(from, to)   C.chart   C.path [waypoint ids]   C.legs() -> [set piece ids]   C.read
// ---------------------------------------------------------------------------------------
import { seaChart, next, sight, portent, classOf } from '../../progress/econ/passage.js';
import { hop, NODES } from '../../progress/econ/emocean.js';
import { stageWx } from '../../progress/weather.js';
import { today } from '../../core/calendar.js';
import { sfx } from '../../audio/sfx.js';
import { SeaChartCanvas, layout, CHART_SIZE } from '../../ui/seachart/seachart.js';
import { draughtTrump } from '../../progress/rail/trip.js';
import { rutterSpread } from '../../vfx/rutter.js';

/** The waypoints' words (placeholders for Espada's) and what each sails as today. The legs not built yet sail as the shoal (a stand-in
 *  until Dovina's leg runtime: RAIL-OVERHAUL.md); the havens are the breathers between legs. */
export const WAYPOINT = {
  shoal: { word: 'the shoal', sails: 'shoal' }, wreckers: { word: 'the Wreckers', sails: 'pirates' }, eyewall: { word: 'the eyewall', sails: 'shoal' },
  graveyard: { word: 'the graveyard', sails: 'shoal' }, maelstrom: { word: 'the maelstrom', sails: 'shoal' }, bounty: { word: 'a bounty', sails: 'shoal' },
  leviathan: { word: 'Old Nobody', sails: 'leviathan' }, calm: { word: 'a calm', sails: null }, encounter: { word: 'a sighting', sails: null },
};
const CLASS_WORD = { threat: 'a threat', haven: 'a haven', boss: 'something vast' };
const READ = { beats: 4, beat: 0.6, tol: 14 }; // (the reckoning: four beats of 0.6 real seconds; the mark held within 14 degrees of the needle)
const W = 640;

export class SeaChart {
  constructor(game, pier) { this.game = game; this.pier = pier; this.chart = null; this.path = []; this.reading = null; }

  /** The sea between two islands, laid for today (the same game day lays the same sea). */
  open(from, to) {
    const g = this.game, V = g.voyage, h = hop(from, to, this.pier.ship, (id) => V.isOpen(id)); if (!h) return false;
    const wx = stageWx(from), casks = V.casks?.() || 0;
    if (!this.chart || this.chart.from !== from || this.chart.to !== to || this.chart.day !== today()) {
      this.chart = seaChart({ from, to, day: today(), danger: h.danger + wx.danger, distance: h.distance, casks, leviathan: false, bounty: false });
      this.path = [];
      g.events?.emit('passage.chart', { from, to, columns: this.chart.columns, day: today(), by: 'courier' });
    }
    this.draw();
    return true;
  }

  /** How far Divination sees today, and at what level (PASSAGE.md 4); a rutter of the route shows everything. */
  seeing() {
    const g = this.game, C = this.chart, V = g.voyage;
    const s = sight(V.reckoning(C.from, C.to), g.psyche?.widen?.('divination.reckon') ?? 1, stageWx(C.from).lead);
    return { s, level: g.psyche?.level?.('divination') ?? 1, rutter: !!this.pier.rutter(C.from, C.to) };
  }

  /** What the drafted passage sails as: the threats in order (three at most, the crossing's chain), each as a set piece built today. */
  legs() {
    const C = this.chart, out = [];
    for (const id of this.path) { const t = C.waypoints[id]?.type, s = WAYPOINT[t]?.sails; if (s) out.push(s); }
    return (out.length ? out : ['shoal']).slice(0, 3);
  }
  done() { return this.chart && this.path.length === this.chart.columns; }

  /** The window: the chart, the drafted path, READ THE SEA and CAST OFF. */
  draw() {
    const g = this.game, C = this.chart, M = this.pier.menu; if (!C || !M) return;
    const { s, level, rutter } = this.seeing(), from = C.from, to = C.to;
    if (!this.sounding) { this.sounding = true; sfx.seaChart?.(true); } // (Wanda's: the chart's ambience while it is open; pier.update says when it shuts)
    M.showPage('seachart', (im, el) => {
      // the chart: Calissa's look (ui/seachart/seachart.js: the constellation over the crude, the lanes threads of light, each portent's
      // tier, a feeling's halo, the squall's flame, a following sea's beads), clicked to draft; the hovered waypoint's words under it
      const P = {};
      for (const [id, w] of Object.entries(C.waypoints)) P[id] = rutter ? { tier: 'exact', candidates: [w.type], cls: classOf(w.type) } : portent(C, w, w.col + 1, s, level);
      const say = (id) => {
        if (this.look) { this.look.hover = id; this.look.draw(); } // (the hovered waypoint lit on the chart)
        if (!this.hoverEl) return;
        const w = id && C.waypoints[id], Q = w && P[id];
        this.hoverEl.textContent = id === 'from' ? (NODES[from]?.name || from) : id === 'to' ? (NODES[to]?.name || to) : !Q ? ' ' : Q.tier === 'exact' ? `${WAYPOINT[w.type]?.word || w.type} ${'●'.repeat(w.strength || 1)}` : Q.candidates.length ? Q.candidates.map((t) => WAYPOINT[t]?.word || t).join(' or ') : Q.cls ? CLASS_WORD[Q.cls] : 'something';
      };
      this.look ||= new SeaChartCanvas({ maxWidth: 672 }); // (its own click and hover handlers unused: the places over it, below, take them)
      this.ways = new Set(next(C, this.path[this.path.length - 1] ?? null));
      const box = el('div', 'chart'); box.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin:6px auto';
      const frame = el('div'); frame.style.cssText = 'position:relative;line-height:0'; frame.appendChild(this.look.canvas); box.appendChild(frame);
      this.look.set(C, { portents: P, drafted: this.path, classOf, trumpOf: (a, b) => draughtTrump(C.waypoints[a]?.feel, C.waypoints[b]?.feel) });
      // each waypoint a place to click over the picture (the drafting's handle, the sweeps' and the tests' too): none drawn
      const at = layout(C);
      for (const id of Object.keys(C.waypoints)) {
        const can = this.ways.has(id) && !this.done(), p = at[id], d = el('div');
        d.setAttribute('data-wp', id);
        d.style.cssText = `position:absolute;left:${(p.x / CHART_SIZE.w) * 100}%;top:${(p.y / CHART_SIZE.h) * 100}%;width:${(26 / CHART_SIZE.w) * 100}%;height:${(26 / CHART_SIZE.h) * 100}%;transform:translate(-50%,-50%);border-radius:50%;cursor:${can ? 'pointer' : 'default'}`;
        d.onpointerenter = () => say(id); d.onpointerleave = () => say(null);
        if (can) d.onclick = () => this.pick(id);
        frame.appendChild(d);
      }
      this.hoverEl = el('div', 'grp', ' '); box.appendChild(this.hoverEl); // (the words are Espada's placeholders)
      const held = this.pier.rutter(from, to); // (a rutter of this sea carried: its open spread under the chart, the passage it set down in ink: vfx/rutter.js)
      if (held) { const page = rutterSpread(held, { chart: C, portents: P }); page.style.cssText = 'width:100%;max-width:336px;margin:6px auto 0;display:block;border-radius:3px'; box.appendChild(page); }
      im.appendChild(box);
      // the reckoning's needle, while it is read
      const read = el('canvas'); read.width = W; read.height = 60; read.style.cssText = `width:100%;max-width:${W}px;display:${this.reading ? 'block' : 'none'};margin:0 auto`;
      im.appendChild(read); this.canvas = read;
      const rows = el('div', 'rooms');
      const act = (n, title, sub, fn, ok = true) => { const d = el('div', 'room', `<span class="n">${n}</span><span><b>${title}</b><s>${sub}</s></span>`); if (ok) d.onclick = fn; else d.style.opacity = '0.5'; rows.appendChild(d); };
      const vane = g.belt?.isWorn('dreamvane');
      act('◎', 'RECKON THE SEA', vane ? `hold the needle on the mark for four beats (today ${Math.round(g.voyage.reckoning(from, to) * 100)}% reckoned)` : 'wear the Dreamvane to reckon the sea', () => this.beginRead(), vane && !this.reading);
      act('↺', 'REDRAFT', 'clear the passage and draft it again', () => { this.path = []; this.draw(); }, this.path.length > 0);
      act('⚓', 'CAST OFF', this.done() ? `sails as: ${this.legs().join(', ')}` : `draft one waypoint in each of the ${C.columns} columns first`, () => this.pier.castOff(from, to), this.done());
      act('←', 'BACK', 'to the pier', () => this.pier.open(from));
      im.appendChild(rows);
    }, { title: 'THE SEA CHART', sub: `to ${NODES[to]?.name || to}` });
  }

  pick(id) {
    this.path.push(id);
    this.game.events?.emit('passage.draft', { waypoints: [...this.path], by: 'courier' });
    this.draw();
  }

  // ---------------------------------------------------------------- the reckoning (PASSAGE.md 5: the survey verb, finally wired)
  beginRead() {
    const t0 = performance.now(), mark = { x: 0.5 };
    this.reading = { t0, held: 0, total: 0, mark };
    this.draw();
    const cv = this.canvas; if (!cv) return;
    const move = (e) => { const r = cv.getBoundingClientRect(); mark.x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    window.addEventListener('mousemove', move);
    const seed = (this.chart.day * 7919 + this.chart.columns * 13) % 1000, dur = READ.beats * READ.beat * 1000;
    let last = t0;
    const step = (now) => {
      const R = this.reading; if (!R || !this.canvas) { window.removeEventListener('mousemove', move); return; }
      const t = (now - t0) / 1000, dt = Math.min(0.1, (now - last) / 1000); last = now;
      // the needle: the sea's pull wandering (three slow waves), across the chart's width
      const needle = 0.5 + 0.32 * Math.sin(t * 1.3 + seed) + 0.12 * Math.sin(t * 3.1 + seed * 2) + 0.05 * Math.sin(t * 7.3);
      const off = Math.abs(needle - mark.x) * 180; R.total += dt; if (off < READ.tol) R.held += dt;
      sfx.reading?.(Math.max(-1, Math.min(1, ((mark.x - needle) * 180) / (READ.tol * 3))), Math.min(1, (now - t0) / dur)); // (the needle's tone steadying: Wanda's)
      const c = this.canvas.getContext('2d'), w = this.canvas.width, h = this.canvas.height;
      c.fillStyle = '#120a08'; c.fillRect(0, 0, w, h);
      c.strokeStyle = off < READ.tol ? '#ffe0a0' : '#c9a0ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(needle * w, 4); c.lineTo(needle * w, h - 4); c.stroke();
      c.fillStyle = '#fbe3cf'; c.beginPath(); c.arc(mark.x * w, h / 2, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,224,160,0.6)'; c.fillRect(0, h - 4, (w * (now - t0)) / dur, 4);
      if (now - t0 < dur) requestAnimationFrame(step); else { window.removeEventListener('mousemove', move); this.finishRead(R.held / Math.max(R.total, 1e-3)); }
    };
    requestAnimationFrame(step);
  }
  /** The reading's quality (0..1, how long the mark was held true) is how much of the sea it divines today (the day's best kept). */
  finishRead(q) {
    const g = this.game, C = this.chart; this.reading = null; sfx.readingEnd?.(q);
    const r = g.voyage.reckon(C.from, C.to, q, +q.toFixed(2));
    g.events?.emit('passage.read', { q: +q.toFixed(2), read: +r.toFixed(2), by: 'courier' });
    this.draw();
  }
}
