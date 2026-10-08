// ---------------------------------------------------------------------------------------
// THE SEA CHART AT THE PIER (docs/plans/PASSAGE.md 2 to 6; Petra's part: the window, the drafting, the reckoning, the rutter): chosen a
// destination at the pier, the sea between is laid (Dovina's seaChart: columns of waypoints joined by lanes that merge and never cross)
// and drawn left to right from where you stand to where you sail. Each waypoint shows what Divination tells of it (portent: its leg
// exactly, two or three candidates, its class, or a dim star, by a confidence that falls with depth); you DRAFT the passage by clicking
// one waypoint a column along the lanes, then cast off. READ THE SEA (the Dreamvane worn): a needle wanders for four beats and the mouse
// holds a mark on it; how long it was held true is the reckoning (voyage.reckon), and the fog over the chart lifts with it. A rutter
// of this route and game day in the Pneuka Box shows the whole sea exact.
// The look is a stand-in for Calissa's (the constellation over the crude, the lanes as threads of light): plain SVG in the Index's
// window. The waypoints' words are placeholders for Espada's.
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

/** The waypoints' words (placeholders for Espada's) and what each sails as today. The legs not built yet sail as the shoal (a stand-in
 *  until Dovina's leg runtime: RAIL-OVERHAUL.md); the havens are the breathers between legs. */
export const WAYPOINT = {
  shoal: { word: 'the shoal', sails: 'shoal' }, wreckers: { word: 'the Wreckers', sails: 'pirates' }, eyewall: { word: 'the eyewall', sails: 'shoal' },
  graveyard: { word: 'the graveyard', sails: 'shoal' }, maelstrom: { word: 'the maelstrom', sails: 'shoal' }, bounty: { word: 'a bounty', sails: 'shoal' },
  leviathan: { word: 'Old Nobody', sails: 'leviathan' }, calm: { word: 'a calm', sails: null }, encounter: { word: 'a sighting', sails: null },
};
const CLASS_WORD = { threat: 'a threat', haven: 'a haven', boss: 'something vast' };
const READ = { beats: 4, beat: 0.6, tol: 14 }; // (the reckoning: four beats of 0.6 real seconds; the mark held within 14 degrees of the needle)
const W = 640, H = 300;

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
      const x = (col) => 70 + ((W - 140) * (col + 0.5)) / C.columns, y = (row) => 30 + ((H - 60) * (row + 0.5)) / C.rows;
      const at = (id) => { const w = C.waypoints[id]; return [x(w.col), y(w.row)]; };
      const open = new Set(next(C, this.path[this.path.length - 1] ?? null));
      let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:6px auto;background:#120a08;border-radius:6px">`;
      const line = (a, b, lit) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${lit ? '#ffe0a0' : '#6b4a3a'}" stroke-width="${lit ? 3 : 1.4}"/>`;
      const fromP = [26, H / 2], toP = [W - 26, H / 2], drafted = (a, b) => { const i = this.path.indexOf(b); return i >= 0 && (i === 0 ? a == null : this.path[i - 1] === a); };
      for (const id of C.first) svg += line(fromP, at(id), drafted(null, id));
      for (const [a, b] of C.edges) svg += line(at(a), at(b), drafted(a, b));
      for (const id of C.last) svg += line(at(id), toP, this.done() && this.path[this.path.length - 1] === id);
      svg += `<circle cx="${fromP[0]}" cy="${fromP[1]}" r="9" fill="#ffb27a"/><circle cx="${toP[0]}" cy="${toP[1]}" r="9" fill="#ffb27a"/>`;
      for (const [id, w] of Object.entries(C.waypoints)) {
        const depth = w.col + 1, P = rutter ? { tier: 'exact', candidates: [w.type], cls: classOf(w.type) } : portent(C, w, depth, s, level);
        const [cx, cy] = at(id), on = this.path.includes(id), can = open.has(id) && !this.done();
        const label = P.tier === 'exact' ? `${WAYPOINT[w.type]?.word || w.type} ${'●'.repeat(w.strength || 1)}` : P.candidates.length ? P.candidates.map((t) => WAYPOINT[t]?.word || t).join(' or ') : P.cls ? CLASS_WORD[P.cls] : '✦';
        const fill = on ? '#ffe0a0' : P.cls === 'haven' ? '#8fd3a8' : P.cls === 'boss' ? '#ff7a6a' : P.tier === 'star' ? '#5a4a6a' : '#c9a0ff';
        svg += `<g data-wp="${id}" style="cursor:${can ? 'pointer' : 'default'};opacity:${can || on ? 1 : 0.6}"><circle cx="${cx}" cy="${cy}" r="${can ? 11 : 8}" fill="${fill}" stroke="${can ? '#fff' : 'none'}" stroke-width="2"/>`;
        svg += `<text x="${cx}" y="${cy + 24}" fill="#fbe3cf" font-size="11" text-anchor="middle">${label}</text></g>`;
      }
      svg += `<text x="${fromP[0] - 14}" y="${fromP[1] - 16}" fill="#fbe3cf" font-size="12" text-anchor="start">${NODES[from]?.name || from}</text>`;
      svg += `<text x="${toP[0] + 14}" y="${toP[1] - 16}" fill="#fbe3cf" font-size="12" text-anchor="end">${NODES[to]?.name || to}</text></svg>`;
      const box = el('div', 'chart'); box.innerHTML = svg;
      box.querySelectorAll('[data-wp]').forEach((n) => { const id = n.getAttribute('data-wp'); if (open.has(id) && !this.done()) n.addEventListener('click', () => this.pick(id)); });
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
