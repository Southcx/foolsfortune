// ---------------------------------------------------------------------------------------
// THE SCORE CEREMONY: how a result is told at Raku's tables, the same in every game (docs/handoffs/dovina/casino-clarity-art-brief.md
// section 2g; the owner, 2026-10-15: words and numbers MAY show inside the table view, and the Lachryma labradorite is used all-out).
// It plays a list of score steps as one loud moment. DOM and CSS only, 0 shader programs; it draws what the coach says and decides no rule.
//
//   THE ORDER   1 NAME   the hand or outcome slams onto the plate ("TIER 2: ALL RUNS")
//               2 BASE   the base number rolls in
//               3 PIECE  each scoring piece's chip jumps (0.12 s, +-3 degrees) and flies its +n to the total; the pitch rises a step each
//               4 MULT   a cinnabar chip with a white x slams in and the total rolls up
//               5 TOTAL  the total settles in ivory with the film through it, and (with a `target`) flies on to the seat plate
//               6 SHAKE  scaled by result / median: under 1x 0.2 s +-2px; 1x..10x 0.3 s +-4px; over 10x 0.5 s +-8px +-1 degree and the
//                        film flooding the screen (the cloth's sigil gets it from the table view, via `onStep`/`hud.shake`)
//   THE TONES   score ivory on lapis-dark; mult cinnabar; money gold (Raku chips); loss ash grey, crazed. Only these four, never a seat colour.
//   THE FILM    the plate's border, the total's face and the flood walk `featTint` (src/vfx/oxidation.js); no second iridescence.
//   SKIPPING    a click or Esc completes what is left at once; the promise still resolves, with the final total shown.
//
// A step: { kind: 'name'|'base'|'piece'|'mult'|'total'|'bonus', label, value, colour? }. `colour` is a tone ('score'|'mult'|'money'|'loss')
// or any CSS colour; the default follows the kind (mult cinnabar, the rest score). A loss is a piece or bonus of tone 'loss' with a
// negative value. The total's `value` is authoritative (the running sum is only the picture of how it came to be).
//
// Events (game.events, if given; payloads never use `name` or `t`): table.ceremony.begin { steps, ratio, shake }, table.ceremony.step
// { kind, label, value, tone, index, of, intensity, pitch, running }, table.ceremony.end { total, skipped, ratio, shake }. Wanda's
// sounds hang on these. The log's line stays the table's rule (a feature emits an event and gets a rule in tracking.js).
//
// Prior art: Balatro's scoring (chips x mult, each card popping in order with a rising pitch, the screen shaking with the hand's size:
// Crosley's approximate timings), Slay the Spire's damage numbers, Yahtzee's score call-out. Web Animations API for the flights.
//
//   const c = new ScoreCeremony({ root, events, hud, median, speed })
//   await c.play(steps, { median, speed, target, onStep(step, i) })   c.skip()   c.close()   shakeFor(ratio)   toneOf(step)
// ---------------------------------------------------------------------------------------
import { RollingNumber } from './rollnum.js';
import { featTint } from '../vfx/oxidation.js';

export const TONES = { score: '#f4ecd8', mult: '#d4412e', money: '#e8b923', loss: '#8a8a90' };
const PLATE = '#12163a', CRACK = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40"><path d="M2 8 L18 14 L24 5 M18 14 L30 22 L26 36 M30 22 L48 18 L62 28 M48 18 L52 4" fill="none" stroke="#1d1d22" stroke-width="1.6"/></svg>');
export const TIMING = { name: 0.55, base: 0.5, piece: 0.34, pieceMin: 0.2, mult: 0.62, total: 0.85, shakeHold: 0.2, hold: 1.4, fly: 0.28 };

/** Result against the game's median -> the shake: seconds, pixels, degrees, the HUD's 0..1 power and whether the film floods. */
export function shakeFor(ratio) {
  if (ratio > 10) return { dur: 0.5, px: 8, deg: 1, power: 1, flood: true };
  if (ratio >= 1) return { dur: 0.3, px: 4, deg: 0, power: 0.5, flood: false };
  return { dur: 0.2, px: 2, deg: 0, power: 0.25, flood: false };
}

/** A step's tone: its colour if that names one, else its kind's. A free CSS colour is a tone of its own (`custom`). */
export function toneOf(step) {
  if (step.colour && TONES[step.colour]) return step.colour;
  if (step.colour) return 'custom';
  return step.kind === 'mult' ? 'mult' : 'score';
}

const CSS = `
.sc{position:fixed;inset:0;z-index:60;cursor:pointer;font-family:'Trebuchet MS','Segoe UI',system-ui,sans-serif;overflow:hidden;
  --f0:#6a2fb0;--f1:#13a8c8;--f2:#f0c030;--f3:#d83a8a}
.sc-flood{position:absolute;inset:-10%;opacity:0;pointer-events:none;mix-blend-mode:screen;
  background:conic-gradient(from 0deg at 50% 62%,var(--f0),var(--f1),var(--f2),var(--f3),var(--f0))}
.sc-flood.on{animation:sc-flood 1.1s ease-out forwards}
@keyframes sc-flood{0%{opacity:0;transform:scale(.6) rotate(0)}22%{opacity:.7}100%{opacity:0;transform:scale(1.5) rotate(40deg)}}
.sc-plate{position:absolute;left:50%;bottom:18%;min-width:min(78vw,520px);width:max-content;max-width:94vw;transform:translateX(-50%);text-align:center;
  padding:calc(14px*var(--rn-scale,1)) calc(26px*var(--rn-scale,1)) calc(18px*var(--rn-scale,1));border-radius:18px;border:4px solid transparent;
  background:linear-gradient(${PLATE},${PLATE}) padding-box,conic-gradient(from var(--sc-spin,0deg),var(--f0),var(--f1),var(--f2),var(--f3),var(--f0)) border-box;
  box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 24px color-mix(in srgb,var(--f1) 40%,transparent);transition:opacity .45s}
.sc-plate.out{opacity:0}
.sc-name{white-space:nowrap;min-height:1.2em;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:calc(34px*var(--rn-scale,1));color:${TONES.score};
  text-shadow:0 .07em 0 rgba(0,0,0,.6)}
.sc-name.xl{font-size:calc(56px*var(--rn-scale,1))}
.sc-name.film,.sc-total.film .rn{background:linear-gradient(100deg,var(--f0),var(--f1),var(--f2),var(--f3));-webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;text-shadow:none;filter:drop-shadow(0 .05em 0 rgba(0,0,0,.7))}
.sc-slam{animation:sc-slam .26s cubic-bezier(.2,.9,.3,1.3)}
@keyframes sc-slam{0%{transform:scale(2.4);opacity:0}60%{opacity:1}100%{transform:scale(1)}}
.sc-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;min-height:calc(34px*var(--rn-scale,1));margin:8px 0}
.sc-chip{display:inline-flex;gap:.5em;align-items:baseline;padding:.15em .6em;border-radius:999px;font-weight:800;font-size:calc(20px*var(--rn-scale,1));
  color:#17111f;background:var(--tone,${TONES.score});box-shadow:0 2px 0 rgba(0,0,0,.5)}
.sc-chip b{font-size:1.2em}
.sc-chip.mult{color:#fff;background:${TONES.mult}}
.sc-chip.mult b::before{content:'\\00d7';margin-right:.05em}
.sc-chip.money{background:${TONES.money}}
.sc-chip.loss{color:#d4d4da;background:${TONES.loss} url("data:image/svg+xml;utf8,${CRACK}") center/cover;text-decoration:line-through}
.sc-total{margin-top:2px}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-scoreceremony', ''); s.textContent = CSS; document.head.appendChild(s);
}

export class ScoreCeremony {
  constructor({ root = null, events = null, hud = null, median = 1, speed = 1, hold = TIMING.hold } = {}) {
    style();
    this.root = root || document.body; this.events = events; this.hud = hud;
    this.median = median; this.speed = speed; this.hold = hold;
    this.el = null; this.skipped = false; this.waits = new Set(); this.raf = 0; this.holdTimer = 0; this.run = 0;
    this.onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.skip(); } };
  }

  emit(name, data) { try { this.events?.emit(name, data); } catch { /* the bus never throws into a caller */ } }

  /** Complete what is left at once. */
  skip() { this.skipped = true; for (const w of [...this.waits]) w(); }

  /** Take the plate away now. */
  close() {
    this.run++; clearTimeout(this.holdTimer); cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey, true);
    this.el?.remove(); this.el = null; this.skipped = true; for (const w of [...this.waits]) w();
  }

  sleep(sec) {
    if (this.skipped) return Promise.resolve();
    return new Promise((res) => {
      const done = () => { clearTimeout(t); this.waits.delete(done); res(); };
      const t = setTimeout(done, sec * 1000 / this.speed);
      this.waits.add(done);
    });
  }

  // The film, walked: the four stops of the plate's border, the total's face and the flood, from featTint (never a second iridescence).
  filmLoop() {
    const c = featTint(0), t0 = performance.now(), tick = () => {
      if (!this.el) return;
      const ph = (performance.now() - t0) / 1000 * 0.3;
      for (let i = 0; i < 4; i++) this.el.style.setProperty('--f' + i, featTint(ph + i / 4, c).getStyle());
      this.el.querySelector('.sc-plate')?.style.setProperty('--sc-spin', (ph * 360) % 360 + 'deg');
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  /** Play the steps. Resolves true when it has told them all (skipped or not), false if closed or replaced meanwhile. */
  async play(steps, { median = this.median, speed = this.speed, target = null, onStep = null, by = null } = {}) {
    this.close(); this.skipped = false; this.speed = speed;
    const run = ++this.run;
    const el = this.el = document.createElement('div'); el.className = 'sc';
    el.innerHTML = '<div class="sc-flood"></div><div class="sc-plate"><div class="sc-name"></div><div class="sc-chips"></div><div class="sc-total"><span></span></div></div>';
    this.root.appendChild(el);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.skip(); });
    window.addEventListener('keydown', this.onKey, true);
    this.filmLoop();

    const plate = el.querySelector('.sc-plate'), nameEl = el.querySelector('.sc-name'), chips = el.querySelector('.sc-chips');
    const totalWrap = el.querySelector('.sc-total'), num = new RollingNumber(totalWrap.firstChild, { tier: 'XL', speed });
    const total = steps.find((s) => s.kind === 'total'), end = total ? total.value : 0;
    const ratio = median > 0 ? Math.abs(end) / median : 1, shake = shakeFor(end <= 0 ? 0 : ratio);
    const pieces = steps.filter((s) => s.kind === 'piece').length;
    const tag = by ? { by } : {};
    let running = 0, seen = 0, ok = true;
    this.emit('table.ceremony.begin', { ...tag, steps: steps.length, ratio, shake: shake.power });

    const slam = (node) => { node.classList.remove('sc-slam'); void node.offsetWidth; node.classList.add('sc-slam'); };
    const roll = (v) => { running = v; return this.skipped ? (num.set(v), Promise.resolve()) : num.to(v, { stagger: 0.05 }); };
    const fly = (chip) => { // the chip's +n goes to the total
      if (this.skipped || !chip.animate) return chip.remove();
      const a = chip.getBoundingClientRect(), b = totalWrap.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const an = chip.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.4)`, opacity: 0 }],
        { duration: TIMING.fly * 1000 / speed, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
      an.onfinish = () => chip.remove();
    };

    for (let i = 0; i < steps.length && run === this.run; i++) {
      const s = steps[i], tone = toneOf(s), custom = tone === 'custom' ? s.colour : null;
      let intensity = 0, pitch = 0;
      if (s.kind === 'piece') { pitch = seen++; intensity = pieces > 1 ? (pitch + 1) / pieces : 1; }
      if (s.kind === 'name') {
        nameEl.textContent = s.label; nameEl.classList.toggle('xl', shake.flood); nameEl.classList.toggle('film', shake.flood);
        slam(nameEl);
        this.emit('table.ceremony.step', { ...tag, kind: s.kind, label: s.label, value: 0, tone, index: i, of: steps.length, intensity: 1, pitch: 0, running });
        onStep?.(s, i);
        await this.sleep(TIMING.name);
      } else {
        const sum = s.kind === 'mult' ? running * s.value : s.kind === 'base' ? s.value : s.kind === 'total' ? s.value : running + s.value;
        if (s.kind !== 'total' && s.kind !== 'base') {
          const chip = document.createElement('span'); chip.className = 'sc-chip ' + (tone === 'custom' ? '' : tone);
          if (custom) chip.style.setProperty('--tone', custom);
          const lab = document.createElement('span'); lab.textContent = s.label || '';
          const val = document.createElement('b'); val.textContent = s.kind === 'mult' ? String(s.value) : (s.value > 0 ? '+' : '−') + Math.abs(s.value);
          chip.append(lab, val); chips.appendChild(chip);
          if (s.kind === 'mult') { chip.style.fontSize = `calc(${28 + 6 * intensity}px*var(--rn-scale,1))`; slam(chip); }
          else if (chip.animate) { // the jump: 0.12 s, +-3 degrees, bigger as the pieces rise
            const rot = (Math.random() * 6 - 3).toFixed(2), big = 1.25 + 0.3 * intensity;
            chip.animate([{ transform: 'scale(.5)' }, { transform: `scale(${big}) rotate(${rot}deg)` }, { transform: 'scale(1)' }],
              { duration: 120 / speed, easing: 'ease-out' });
          }
          this.emit('table.ceremony.step', { ...tag, kind: s.kind, label: s.label, value: s.value, tone, index: i, of: steps.length, intensity, pitch, running: sum });
          onStep?.(s, i);
          await this.sleep(Math.max(TIMING.pieceMin, TIMING.piece - 0.02 * pitch) * (s.kind === 'mult' ? 0.5 : 0.4));
          fly(chip);
          roll(sum); // (rolls on while the next piece jumps)
          await this.sleep(s.kind === 'mult' ? TIMING.mult : Math.max(TIMING.pieceMin, TIMING.piece - 0.02 * pitch));
        } else {
          totalWrap.classList.toggle('film', s.kind === 'total');
          num.colour(s.kind === 'total' ? TONES.score : custom || TONES[tone]);
          this.emit('table.ceremony.step', { ...tag, kind: s.kind, label: s.label, value: s.value, tone, index: i, of: steps.length, intensity: 1, pitch: 0, running: sum });
          onStep?.(s, i);
          roll(sum);
          await this.sleep(s.kind === 'total' ? TIMING.total : TIMING.base);
        }
      }
    }
    if (run !== this.run) return false;

    // the shake: the plate (and the HUD, by power) for the result's size, the film flooding for the top tier
    const wasSkipped = this.skipped;
    this.skipped = false; // (the shake is the result's size, skipped or not, but short)
    if (!wasSkipped) {
      this.hud?.shake?.(shake.power);
      if (shake.flood) { const f = el.querySelector('.sc-flood'); f.classList.add('on'); }
      const t0 = performance.now(), ms = shake.dur * 1000 / speed;
      await new Promise((res) => {
        const frame = () => {
          const k = Math.min(1, (performance.now() - t0) / ms), amp = 1 - k;
          plate.style.transform = `translateX(-50%) translate(${((Math.random() * 2 - 1) * shake.px * amp).toFixed(1)}px,${((Math.random() * 2 - 1) * shake.px * amp).toFixed(1)}px) rotate(${((Math.random() * 2 - 1) * shake.deg * amp).toFixed(2)}deg)`;
          if (k >= 1 || this.skipped || run !== this.run) { plate.style.transform = 'translateX(-50%)'; res(); } else requestAnimationFrame(frame);
        };
        frame();
      });
    }
    ok = run === this.run;
    if (ok && target && total && plate.animate && !wasSkipped) await this.flyTo(plate, target, speed);
    if (ok) {
      this.emit('table.ceremony.end', { ...tag, total: end, skipped: wasSkipped, ratio, shake: shake.power });
      window.removeEventListener('keydown', this.onKey, true);
      el.style.pointerEvents = 'none';
      this.holdTimer = setTimeout(() => { plate.classList.add('out'); this.holdTimer = setTimeout(() => { if (this.el === el) this.close(); }, 500); }, this.hold * 1000 / speed);
    }
    return ok;
  }

  // The total goes on to the seat plate (an element, or { x, y } on screen) as a film-lit blob; the plate itself stays for its hold.
  flyTo(plate, target, speed) {
    const a = plate.getBoundingClientRect(), t = target.getBoundingClientRect ? target.getBoundingClientRect() : { left: target.x, top: target.y, width: 0, height: 0 };
    const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + t.height / 2 - (a.top + a.height / 2);
    const an = plate.animate([{ transform: 'translateX(-50%)' }, { transform: `translateX(-50%) translate(${dx}px,${dy}px) scale(.25)`, opacity: 0.2 }],
      { duration: 380 / speed, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' });
    return new Promise((res) => { an.onfinish = res; an.oncancel = res; });
  }
}
