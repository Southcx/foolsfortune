// ---------------------------------------------------------------------------------------
// THE BUG REPORT'S MARKUP WINDOW: the owner draws on the frozen frame and says what went wrong (docs/plans/BUGREPORT.md, Dovina's; the
// key, the pause, the frame grab, the attachments and the filing are Petra's, src/debug/bugreport.js, which calls this). A development
// tool the player opened, like the F3 panel: words are allowed in it, and it goes away when filed.
//
//   THE FRAME   the 480-line target as it was drawn, shown at a WHOLE-number scale (never resampled: the true look, pixel for pixel)
//   THE MARKS   a layer of their own over it, at the frame's own size: a PEN, an ARROW, a RING and a BOX, in a hot red or white, each
//               drawn over a dark hairline so it reads on any frame; UNDO takes back the last (the frame under the marks is untouched)
//   THE WORDS   a title (one line), what happened, what should have happened; a KIND and a SEVERITY, one click each, with a default
//   FILE        Enter (Ctrl+Enter from a text box) resolves with the report; Esc resolves null. The window never unpauses: Petra does
// Keys: P pen, A arrow, R ring, B box, C the colour, Ctrl+Z undo (outside the text boxes).
//
// Prior art: Valve's `bug` command (the frame taken first, few words asked), Destiny's and The Division's internal reporters (draw on
// the frozen frame: an arrow, a circle, before a word), and every screenshot tool's markup (Snagit, macOS Markup: the four shapes, two
// colours, undo).
//
//   const r = await new BugMarkup(game).open(frameCanvas)   r: { title, happened, should, kind, severity, marks (a canvas, the frame's
//   size, transparent but for the marks) } | null
// ---------------------------------------------------------------------------------------

export const KINDS = [['bug', 'bug'], ['feel', 'feel'], ['look', 'look'], ['sound', 'sound'], ['words', 'words'], ['numbers', 'numbers'], ['idea', 'idea']];
export const SEVERITIES = [['blocks', 'blocks play'], ['wrong', 'wrong'], ['rough', 'rough'], ['wish', 'a wish']];
const TOOLS = [['pen', 'Pen', 'P'], ['arrow', 'Arrow', 'A'], ['ring', 'Ring', 'R'], ['box', 'Box', 'B']];
const INK = { red: '#ff2d3c', white: '#ffffff' };
const LINE = 3; // (art pixels, at the frame's own size)

const CSS = `
#bugmarkup { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(4,2,8,.55); }
#bugmarkup .bm { display: flex; gap: 14px; color: #fff1dc; max-width: calc(100vw - 24px); max-height: calc(100vh - 24px); }
#bugmarkup .stage { position: relative; line-height: 0; align-self: flex-start; box-shadow: 0 0 0 1px #000, 0 0 0 3px rgba(255,241,220,.35); }
#bugmarkup .stage canvas { image-rendering: pixelated; image-rendering: crisp-edges; display: block; }
#bugmarkup .stage canvas.marks { position: absolute; left: 0; top: 0; cursor: crosshair; }
#bugmarkup .side { width: 320px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
#bugmarkup h2 { margin: 0 0 2px; font-size: 18px; letter-spacing: .18em; }
#bugmarkup .row { display: flex; flex-wrap: wrap; gap: 4px; }
#bugmarkup .chip { all: unset; cursor: pointer; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,241,220,.35); font-size: 12px; }
#bugmarkup .chip.on { background: rgba(255,241,220,.9); color: #1c0d08; text-shadow: none; border-color: #fff1dc; }
#bugmarkup .chip .k { opacity: .55; margin-left: 4px; font-size: 10px; }
#bugmarkup .ink { width: 14px; height: 14px; padding: 2px; }
#bugmarkup label { font-size: 11px; letter-spacing: .08em; opacity: .8; text-transform: uppercase; }
#bugmarkup input, #bugmarkup textarea { box-sizing: border-box; width: 100%; background: rgba(0,0,0,.35); color: #fff1dc; border: 1px solid rgba(255,241,220,.3);
  border-radius: 4px; padding: 5px 7px; font-size: 13px; resize: none; }
#bugmarkup textarea { height: 54px; }
#bugmarkup .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 11px; opacity: .85; }
#bugmarkup .file { all: unset; cursor: pointer; padding: 6px 14px; border-radius: 5px; background: #fff1dc; color: #1c0d08; font-weight: 800; text-shadow: none; }
`;

export class BugMarkup {
  constructor(game) { this.game = game; this.root = null; }

  /** Open over the frozen frame (a canvas, the 480-line target as drawn). Resolves with the report on File, null on Esc. */
  open(frame) {
    if (this.root) this.close(null);
    if (!document.getElementById('bugmarkup-css')) { const st = document.createElement('style'); st.id = 'bugmarkup-css'; st.textContent = CSS; document.head.appendChild(st); }
    const W = frame.width, H = frame.height;
    this.state = { tool: 'arrow', ink: 'red', kind: 'bug', severity: 'wrong', strokes: [], drag: null };
    const root = this.root = document.createElement('div'); root.id = 'bugmarkup';
    root.innerHTML = `<div class="bm"><div class="stage"></div><div class="side">
      <h2>BUG REPORT</h2>
      <div class="row tools">${TOOLS.map(([id, n, k]) => `<button class="chip" data-tool="${id}">${n}<span class="k">${k}</span></button>`).join('')}
        ${Object.entries(INK).map(([id, c]) => `<button class="chip ink" data-ink="${id}" title="${id} (C)" style="background:${c}"></button>`).join('')}
        <button class="chip" data-undo="1">Undo<span class="k">Ctrl+Z</span></button></div>
      <label>Title</label><input class="title" maxlength="120" placeholder="One line: what is wrong">
      <label>What happened</label><textarea class="happened"></textarea>
      <label>What should have happened</label><textarea class="should"></textarea>
      <label>Kind</label><div class="row kinds">${KINDS.map(([id, n]) => `<button class="chip" data-kind="${id}">${n}</button>`).join('')}</div>
      <label>Severity</label><div class="row sevs">${SEVERITIES.map(([id, n]) => `<button class="chip" data-sev="${id}">${n}</button>`).join('')}</div>
      <div class="foot"><span>Enter files · Esc closes</span><button class="file">File</button></div></div></div>`;
    // the frame and the marks, at a whole-number scale that fits beside the form
    const k = Math.max(1, Math.floor(Math.min((innerWidth - 380) / W, (innerHeight - 40) / H)));
    const show = (c) => { c.style.width = `${W * k}px`; c.style.height = `${H * k}px`; return c; };
    const base = document.createElement('canvas'); base.width = W; base.height = H; base.getContext('2d').drawImage(frame, 0, 0);
    const marks = this.marks = document.createElement('canvas'); marks.width = W; marks.height = H; marks.className = 'marks';
    root.querySelector('.stage').append(show(base), show(marks));
    this.k = k;
    document.body.appendChild(root);
    this.wire(root, marks);
    this.refresh();
    root.querySelector('.title').focus();
    return new Promise((res) => { this.resolve = res; });
  }

  wire(root, marks) {
    const S = this.state;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) S.tool = b.dataset.tool;
      if (b.dataset.ink) S.ink = b.dataset.ink;
      if (b.dataset.kind) S.kind = b.dataset.kind;
      if (b.dataset.sev) S.severity = b.dataset.sev;
      if (b.dataset.undo) S.strokes.pop();
      if (b.classList.contains('file')) return this.file();
      this.refresh();
    });
    const at = (e) => { const r = marks.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / this.k), Math.round((e.clientY - r.top) / this.k)]; };
    marks.addEventListener('pointerdown', (e) => { marks.setPointerCapture(e.pointerId); S.drag = { tool: S.tool, ink: S.ink, pts: [at(e), at(e)] }; this.draw(); });
    marks.addEventListener('pointermove', (e) => {
      if (!S.drag) return;
      if (S.drag.tool === 'pen') S.drag.pts.push(at(e)); else S.drag.pts[1] = at(e);
      this.draw();
    });
    marks.addEventListener('pointerup', () => { if (S.drag) { const [a, b] = [S.drag.pts[0], S.drag.pts[S.drag.pts.length - 1]]; if (S.drag.tool === 'pen' || Math.hypot(b[0] - a[0], b[1] - a[1]) > 2) S.strokes.push(S.drag); S.drag = null; this.draw(); } });
    this.onKey = (e) => {
      if (!this.root) return;
      const inText = /^(TEXTAREA|INPUT)$/.test(e.target.tagName);
      e.stopPropagation(); // (the game hears nothing while the window is open)
      if (e.key === 'Escape') { e.preventDefault(); return this.close(null); }
      if (e.key === 'Enter' && (!inText || e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey)) { e.preventDefault(); return this.file(); }
      if (inText) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); S.strokes.pop(); return this.refresh(); }
      const t = TOOLS.find(([, , kk]) => kk.toLowerCase() === key); if (t) { S.tool = t[0]; return this.refresh(); }
      if (key === 'c') { S.ink = S.ink === 'red' ? 'white' : 'red'; return this.refresh(); }
    };
    addEventListener('keydown', this.onKey, true);
    addEventListener('keyup', this.swallow = (e) => { if (this.root) e.stopPropagation(); }, true);
  }

  /** The buttons' lit states, and the marks redrawn. */
  refresh() {
    const S = this.state, R = this.root;
    R.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === S.tool));
    R.querySelectorAll('[data-ink]').forEach((b) => b.classList.toggle('on', b.dataset.ink === S.ink));
    R.querySelectorAll('[data-kind]').forEach((b) => b.classList.toggle('on', b.dataset.kind === S.kind));
    R.querySelectorAll('[data-sev]').forEach((b) => b.classList.toggle('on', b.dataset.sev === S.severity));
    this.draw();
  }

  /** Every mark, over a dark hairline (so a white ring reads on sand and a red one on clay). */
  draw() {
    const g = this.marks.getContext('2d'), S = this.state;
    g.clearRect(0, 0, this.marks.width, this.marks.height);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of [...S.strokes, ...(S.drag ? [S.drag] : [])]) for (const pass of [0, 1]) {
      g.strokeStyle = pass ? INK[s.ink] : 'rgba(10,4,2,.75)'; g.lineWidth = LINE + (pass ? 0 : 2);
      g.beginPath(); shape(g, s); g.stroke();
    }
  }

  file() {
    const R = this.root, S = this.state, v = (sel) => R.querySelector(sel).value.trim();
    this.close({ title: v('.title') || '(untitled)', happened: v('.happened'), should: v('.should'), kind: S.kind, severity: S.severity, marks: this.marks });
  }

  close(result) {
    removeEventListener('keydown', this.onKey, true); removeEventListener('keyup', this.swallow, true);
    this.root?.remove(); this.root = null;
    const res = this.resolve; this.resolve = null; res?.(result);
  }
}

/** A mark's path: the pen's line, an arrow (its head at the end), a ring (the ellipse in the dragged box), a box. */
function shape(g, s) {
  const p = s.pts, [a, b] = [p[0], p[p.length - 1]];
  if (s.tool === 'pen') { g.moveTo(...p[0]); for (const q of p) g.lineTo(...q); return; }
  if (s.tool === 'box') { g.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); return; }
  if (s.tool === 'ring') { g.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(1, Math.abs(b[0] - a[0]) / 2), Math.max(1, Math.abs(b[1] - a[1]) / 2), 0, 0, Math.PI * 2); return; }
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = Math.min(14, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.45);
  g.moveTo(...a); g.lineTo(...b);
  g.moveTo(b[0] - hl * Math.cos(ang - 0.45), b[1] - hl * Math.sin(ang - 0.45)); g.lineTo(...b); g.lineTo(b[0] - hl * Math.cos(ang + 0.45), b[1] - hl * Math.sin(ang + 0.45));
}
