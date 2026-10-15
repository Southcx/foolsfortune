// ---------------------------------------------------------------------------------------
// THE SCORE CEREMONY: how a result is told at Raku's tables, the same in every game (docs/plans/CASINO-CLARITY.md section 8; the owner,
// 2026-10-15: words and numbers MAY show inside the table view, the Lachryma labradorite used all-out). It plays the coach's steps
// (src/progress/casino/coach/ceremony.js: { steps, total, scale, tier?, at }) as Balatro's count. DOM and CSS only, 0 shader programs;
// it draws what the coach says and decides no rule.
//
//   BANNER    the hand's name on one line, shrunk until it fits its box ("TIER 3: A FULL FLUSH").
//   BOXES     BASE (ivory on blue) x MULT (cinnabar), side by side, big. BASE rolls up to the tier's value; MULT starts at 1.
//   REASONS   each step lights one by one as a chip in the lane under the boxes and flies into its box while that box's number rolls:
//             '+' ticks MULT up by n (Querent: 1 + the bonuses), 'x' slams MULT times n, bigger; a die's face adds to the dice;
//             a game with no 'x' and no tier (Event Horizon, dice) adds into BASE alone and its MULT box stays away.
//   REEL      Nebula's reveal ('against') and a Supernova's doubling ('x' with no tier) spin on a reel centred above the boxes.
//   SLAM      the boxes close on each other and merge into the TOTAL: the biggest thing on screen, rolling up from 0.
//   FILM      only a tier 3 total wears the labradorite film (featTint, never a second iridescence), laid on a plain overlay once the
//             number has settled (background-clip:text does not paint through the rolling digits' transforms), and the hall floods with it.
//   SHAKE     the stage and the HUD shake in proportion to `scale` (0 the least, 1 the median, 2 the 90th percentile and beyond).
//   SKIPPING  a click or Esc jumps to the final total at once (no shake, the flourish still sounds); the promise still resolves.
//
// Beats: onBeat(kind, info) for the table view's sounds (Wanda's sfx.casinoTick / casinoMult / casinoReel / casinoFlourish):
//   'tick' { k } (each reason that adds, k = 0, 1, 2 ..: a note higher each)   'mult' { n } (an 'x' slams)
//   'reel' { dur } (a reel spins, seconds)   'flourish' { tier } (the total lands: 1 a chime, 2 the sigil flares, 3 the hall goes labradorite)
// Events (game.events, if given; payloads never use `name` or `t`): table.ceremony.begin { steps, scale, tier }, table.ceremony.beat
// { kind, ...info }, table.ceremony.end { total, skipped, scale, tier }. `by` is added to each when passed.
//
// Prior art: Balatro's scoring (chips x mult, each card popping in order with a rising pitch, the screen shaking with the hand's size:
// Crosley's approximate timings), the fruit machine's reel, Slay the Spire's damage numbers. Web Animations API for the flights.
//
//   const c = new ScoreCeremony({ root, events, hud, speed, onBeat })
//   await c.play({ steps, total, scale, tier, at }, { title, speed, target, onBeat, by })   c.skip()   c.close()   shakeFor(scale)
// ---------------------------------------------------------------------------------------
import { RollingNumber, formatNumber } from './rollnum.js';
import { Reel } from './reel.js';
import { featTint } from '../vfx/oxidation.js';

export const TONES = { score: '#f4ecd8', mult: '#d4412e', money: '#e8b923', loss: '#8a8a90' };
export const TIMING = { name: 0.3, base: 0.3, add: 0.2, mult: 0.32, face: 0.16, reel: 0.7, slam: 0.22, roll: 0.5, hold: 1.4, fly: 0.22, lit: 0.06 };
const PLATE = '#12163a';

/** The coach's scale (0..2) -> the shake: seconds, pixels, degrees, the HUD's 0..1 power. */
export function shakeFor(scale) {
  const k = Math.max(0, Math.min(2, scale || 0));
  return { dur: 0.2 + 0.15 * k, px: 1.5 + 3.5 * k, deg: k > 1.6 ? (k - 1.6) * 2.5 : 0, power: k / 2 };
}

const CSS = `
.sc{position:fixed;inset:0;z-index:60;cursor:pointer;font-family:'Trebuchet MS','Segoe UI',system-ui,sans-serif;overflow:hidden;
  --f0:#6a2fb0;--f1:#13a8c8;--f2:#f0c030;--f3:#d83a8a;}
.sc-flood{position:absolute;inset:-10%;opacity:0;pointer-events:none;mix-blend-mode:screen;
  background:conic-gradient(from 0deg at 50% 55%,var(--f0),var(--f1),var(--f2),var(--f3),var(--f0))}
.sc-flood.on{animation:sc-flood 1.2s ease-out forwards}
@keyframes sc-flood{0%{opacity:0;transform:scale(.6) rotate(0)}22%{opacity:.7}100%{opacity:0;transform:scale(1.5) rotate(40deg)}}
.sc-stage{position:absolute;left:50%;top:50%;width:min(94vw,1000px);transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;
  gap:calc(14px*var(--rn-scale));padding:calc(18px*var(--rn-scale)) calc(22px*var(--rn-scale));box-sizing:border-box;border-radius:22px;
  border:4px solid transparent;background:linear-gradient(${PLATE}f2,${PLATE}f2) padding-box,conic-gradient(from var(--sc-spin,0deg),var(--f0),var(--f1),var(--f2),var(--f3),var(--f0)) border-box;
  box-shadow:0 14px 48px rgba(0,0,0,.65);transition:opacity .45s}
.sc-stage.out{opacity:0}
.sc-banner{width:100%;text-align:center;white-space:nowrap;overflow:hidden;line-height:1.25}
.sc-name{display:inline-block;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:${TONES.score};text-shadow:0 .07em 0 rgba(0,0,0,.6)}
.sc-slam{animation:sc-slam .26s cubic-bezier(.2,.9,.3,1.3)}
@keyframes sc-slam{0%{transform:scale(2.4);opacity:0}60%{opacity:1}100%{transform:scale(1)}}
.sc-reelrow{display:none;flex-direction:column;align-items:center;gap:6px;color:#c9d2f5;font-weight:800;font-size:calc(20px*var(--rn-scale))}
.sc-reelrow.on{display:flex}
.sc-boxes{display:flex;align-items:stretch;justify-content:center;gap:calc(18px*var(--rn-scale));width:100%}
.sc-box{flex:1 1 0;min-width:0;max-width:46%;text-align:center;border-radius:16px;padding:calc(10px*var(--rn-scale)) calc(12px*var(--rn-scale)) calc(14px*var(--rn-scale));
  border:3px solid;box-shadow:inset 0 0 18px rgba(0,0,0,.45),0 4px 0 rgba(0,0,0,.5)}
.sc-box.base{background:#16255a;border-color:#6f8be0;color:#eaf0ff}
.sc-box.mult{background:#5a1710;border-color:${TONES.mult};color:#ffe9e4}
.sc-box.solo{max-width:70%}
.sc-box.gone{display:none}
.sc-box b{display:block;font-size:calc(18px*var(--rn-scale));letter-spacing:.2em;opacity:.8}
.sc-box .rn{--rn-colour:currentColor}
.sc-op{align-self:center;font-weight:900;font-size:calc(64px*var(--rn-scale));color:${TONES.score};text-shadow:0 .06em 0 rgba(0,0,0,.6)}
.sc-op.gone{display:none}
.sc-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;min-height:calc(44px*var(--rn-scale))}
.sc-chip{display:inline-flex;gap:.5em;align-items:baseline;padding:.15em .7em;border-radius:999px;font-weight:800;font-size:calc(24px*var(--rn-scale));
  color:#17111f;background:var(--tone,${TONES.score});box-shadow:0 2px 0 rgba(0,0,0,.5)}
.sc-chip b{font-size:1.2em}
.sc-chip.mult{color:#fff;background:${TONES.mult}}
.sc-chip.money{background:${TONES.money}}
.sc-chip.loss{color:#d4d4da;background:${TONES.loss};text-decoration:line-through}
.sc-totalwrap{display:none;flex-direction:column;align-items:center;gap:2px}
.sc-totalwrap.on{display:flex}
.sc-totalwrap>b{font-size:calc(22px*var(--rn-scale));letter-spacing:.3em;color:#c9d2f5}
.sc-totalbox{display:grid;place-items:center}
.sc-totalbox>*{grid-area:1/1}
.sc-film,.sc-filmback{display:none;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;white-space:pre;letter-spacing:.01em;
  font-family:'Trebuchet MS','Segoe UI',system-ui,sans-serif}
.sc-filmback{color:#000;transform:translate(0,.05em);opacity:.7}
.sc-film{background:linear-gradient(100deg,var(--f0),var(--f1),var(--f2),var(--f3),var(--f0));background-size:200% 100%;background-position:var(--sc-shift,0%) 0;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.sc-totalbox.film .sc-film,.sc-totalbox.film .sc-filmback{display:block}
.sc-totalbox.film .rn{visibility:hidden}
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-scoreceremony', ''); s.textContent = CSS; document.head.appendChild(s);
}
const el = (cls, tag = 'div', text = '') => { const e = document.createElement(tag); e.className = cls; if (text) e.textContent = text; return e; };
const widthEm = (v) => [...formatNumber(v)].reduce((a, c) => a + (c === ' ' ? 0.28 : 0.62), 0);

/** The coach's steps read once: the base, the final multiplier, the mode, the title. */
export function readCeremony(c) {
  const S = c.steps || [], base = S.find((s) => s.op === 'base'), has = (op) => S.some((s) => s.op === op);
  const product = c.tier != null || has('x');
  let mult = 1, dice = 0;
  for (const s of S) { if (s.op === '+' && product) mult += s.n; else if (s.op === 'x') mult *= s.n; else if (s.op === 'face') dice += s.n; }
  const baseValue = base ? base.n : product ? Math.round(c.total / mult) : dice;
  const title = c.tier ? `Tier ${c.tier}: ${base?.why || ''}` : has('against') ? S.find((s) => s.op === 'against').why || 'The reveal' : has('face') ? 'Reaction'
    : has('x') ? S.find((s) => s.op === 'x').why || 'Result' : base?.why || 'Result';
  return { base, product, mult, baseValue, title, label: product ? 'BASE' : has('face') ? 'DICE' : (base?.why || 'BASE').toUpperCase() };
}

export class ScoreCeremony {
  constructor({ root = null, events = null, hud = null, speed = 1, hold = TIMING.hold, onBeat = null } = {}) {
    style();
    this.root = root || document.body; this.events = events; this.hud = hud; this.onBeat = onBeat;
    this.speed = speed; this.hold = hold; this.el = null; this.skipped = false; this.skipP = null; this.skipRes = null; this.raf = 0; this.holdTimer = 0; this.run = 0;
    this.onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.skip(); } };
  }

  emit(name, data) { try { this.events?.emit(name, data); } catch { /* the bus never throws into a caller */ } }

  /** Jump to the final total. */
  skip() { this.skipped = true; this.skipRes?.(); }

  /** Take the stage away now. */
  close() {
    this.run++; clearTimeout(this.holdTimer); cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey, true);
    this.el?.remove(); this.el = null; this.skipped = true; this.skipRes?.();
  }

  sleep(sec) {
    if (this.skipped) return Promise.resolve();
    return Promise.race([new Promise((r) => setTimeout(r, sec * 1000 / this.speed)), this.skipP]);
  }

  // The film, walked: the four stops (the border, the total's face, the flood) from featTint, never a second iridescence.
  filmLoop() {
    const c = featTint(0), t0 = performance.now(), tick = () => {
      if (!this.el) return;
      const ph = (performance.now() - t0) / 1000 * 0.3;
      for (let i = 0; i < 4; i++) this.el.style.setProperty('--f' + i, featTint(ph + i / 4, c).getStyle());
      this.el.style.setProperty('--f4', featTint(ph, c).getStyle());
      this.el.style.setProperty('--sc-spin', (ph * 360) % 360 + 'deg');
      this.el.style.setProperty('--sc-shift', (ph * 200) % 200 + '%');
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  /** Play the coach's ceremony. Resolves true when it has told it (skipped or not), false if closed or replaced meanwhile. */
  async play(c, { title = null, speed = this.speed, target = null, onBeat = this.onBeat, by = null } = {}) {
    this.close(); this.skipped = false; this.speed = speed; this.skipP = new Promise((r) => { this.skipRes = r; });
    const run = ++this.run, R = readCeremony(c), tier = c.tier || (c.scale >= 1.5 ? 2 : 1), shake = shakeFor(c.scale), tag = by ? { by } : {};
    const root = this.el = el('sc'); root.style.setProperty('--rn-scale', String(Math.max(0.8, Math.min(1.6, innerHeight / 1080))));
    const stage = el('sc-stage'), banner = el('sc-banner'), name = el('sc-name', 'span'), reelRow = el('sc-reelrow'), reelEl = el('', 'div'), reelCap = el('', 'div');
    const boxes = el('sc-boxes'), bb = el('sc-box base'), mb = el('sc-box mult'), op = el('sc-op', 'div', '×'), chips = el('sc-chips');
    const bn = el('', 'div'), mn = el('', 'div'), tw = el('sc-totalwrap'), tbox = el('sc-totalbox'), tn = el('', 'div'), film = el('sc-film', 'div'), back = el('sc-filmback', 'div');
    const flood = el('sc-flood');
    bb.append(el('', 'b', R.label), bn); mb.append(el('', 'b', 'MULT'), mn); boxes.append(bb, op, mb);
    banner.append(name); reelRow.append(reelEl, reelCap);
    tbox.append(tn, back, film); tw.append(el('', 'b', 'TOTAL'), tbox);
    stage.append(banner, reelRow, boxes, chips, tw); root.append(flood, stage);
    if (!R.product) { mb.classList.add('gone'); op.classList.add('gone'); bb.classList.add('solo'); }
    this.root.appendChild(root);
    root.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.holdTimer && this.ended) this.close(); else this.skip(); });
    window.addEventListener('keydown', this.onKey, true);
    this.filmLoop();

    // sizes: each number fitted to its place for the value it will end on (so it never changes size mid-roll)
    const stageW = stage.clientWidth - 40, boxW = (R.product ? stageW * 0.46 : stageW * 0.66) - 40;
    const bnum = new RollingNumber(bn, { tier: 'BOX', speed }), mnum = new RollingNumber(mn, { tier: 'BOX', speed }), tnum = new RollingNumber(tn, { tier: 'XXL', speed });
    bnum.fit(boxW, Math.max(R.baseValue, c.total)); mnum.fit(boxW, R.mult); tnum.fit(stageW * 0.92, c.total);
    const scl = parseFloat(root.style.getPropertyValue('--rn-scale')) || 1;
    // the banner: one line, shrunk until it fits
    name.textContent = title || R.title; name.style.fontSize = 40 * scl + 'px';
    for (let i = 0; i < 24 && name.offsetWidth > banner.clientWidth; i++) name.style.fontSize = parseFloat(name.style.fontSize) * 0.92 + 'px';
    name.style.visibility = 'hidden';
    const sizeNum = Math.min(128 * scl, (stageW * 0.92) / widthEm(c.total));
    film.style.fontSize = back.style.fontSize = sizeNum + 'px';
    film.textContent = back.textContent = formatNumber(c.total);

    const beat = (kind, info = {}) => { try { onBeat?.(kind, info); } catch { /* a sound never stops the count */ } this.emit('table.ceremony.beat', { ...tag, kind, ...info }); };
    const slam = (node) => { node.classList.remove('sc-slam'); void node.offsetWidth; node.classList.add('sc-slam'); };
    const roll = (n, v) => (this.skipped ? (n.set(v), Promise.resolve()) : n.to(v, { dur: 0.35, stagger: 0.04 }));
    const pop = (box) => box.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 160 / speed, easing: 'ease-out' });
    const fly = (chip, to) => {
      if (this.skipped || !chip.animate) return chip.remove();
      const a = chip.getBoundingClientRect(), b = to.getBoundingClientRect();
      const an = chip.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.35)`, opacity: 0.2 }],
        { duration: TIMING.fly * 1000 / speed, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
      an.onfinish = () => chip.remove();
    };
    this.emit('table.ceremony.begin', { ...tag, steps: c.steps.length, scale: c.scale, tier });

    name.style.visibility = 'visible'; slam(name); await this.sleep(TIMING.name);
    let reel = null, k = 0, base = 0, mult = R.product ? 1 : 0;
    if (R.product) mnum.set(1);
    const setBase = (v) => { base = v; return roll(bnum, v); };
    const needReel = (symbols, pick) => { reelRow.classList.add('on'); reel ||= new Reel(reelEl, symbols, { tier: 'XL', speed }); return reel.spin(pick, { dur: 0.6 }); };

    for (const s of c.steps) {
      if (this.skipped || run !== this.run) break;
      if (s.op === 'base') { beat('tick', { k: k++ }); setBase(s.n); pop(bb); await this.sleep(TIMING.base); continue; }
      if (s.op === 'against') {
        const sy = ['REVEAL', 'TRUE', 'CAUGHT'], at = Math.max(0, sy.indexOf(s.why));
        reelCap.textContent = s.n != null ? `the claim: ${s.n}` : ''; beat('reel', { dur: 0.6 / speed }); needReel(sy.map((t, i) => ({ text: t, colour: i === 2 ? '#ff7a66' : i === 1 ? '#8be0a8' : TONES.score })), at);
        await this.sleep(TIMING.reel); continue;
      }
      if (s.op === 'x' && c.tier == null) { reelCap.textContent = s.why || ''; beat('reel', { dur: 0.6 / speed }); needReel(['×1', '×2', '×3', '×4', '×5'].map((t) => ({ text: t, colour: TONES.mult })), Math.max(0, Math.min(4, s.n - 1))); await this.sleep(TIMING.reel); }
      const isX = s.op === 'x', isAdd = s.op === '+' || s.op === 'face' || s.op === 'base', info = s.op === 'born' || s.op === 'decayed' || s.op === 'lost';
      const tone = s.op === 'lost' || s.op === 'decayed' ? 'loss' : isX ? 'mult' : s.max ? 'money' : 'score';
      const chip = el('sc-chip ' + (tone === 'score' ? '' : tone)); const val = el('', 'b');
      val.textContent = isX ? '×' + s.n : info ? '' : (s.n >= 0 ? '+' : '−') + Math.abs(s.n);
      chip.append(el('', 'span', s.why || (s.op === 'face' ? 'die' : '')), val); chips.appendChild(chip);
      if (isX) { chip.style.fontSize = `calc(${30 + 4 * Math.min(2, Math.log2(s.n + 1))}px*var(--rn-scale))`; slam(chip); } else chip.animate?.([{ transform: 'scale(.5)' }, { transform: `scale(${1.25 + 0.25 * Math.min(1, k / 8)}) rotate(${(Math.random() * 6 - 3).toFixed(1)}deg)` }, { transform: 'scale(1)' }], { duration: 120 / speed, easing: 'ease-out' });
      await this.sleep(TIMING.lit);
      if (isX) {
        fly(chip, mb); mult *= s.n; beat('mult', { n: s.n }); roll(mnum, mult); pop(mb); slam(mb);
        await this.sleep(TIMING.mult);
      } else if (info) { fly(chip, bb); beat('tick', { k: k++ }); await this.sleep(TIMING.add); }
      else if (isAdd && s.op === '+' && R.product) { fly(chip, mb); mult += s.n; beat('tick', { k: k++ }); roll(mnum, mult); pop(mb); await this.sleep(TIMING.add); }
      else if (isAdd) { fly(chip, bb); beat('tick', { k: k++ }); setBase(base + s.n); pop(bb); await this.sleep(s.op === 'face' ? TIMING.face : TIMING.add); }
    }
    if (run !== this.run) return false;

    // the slam: the two boxes close on each other (skipped: nothing to see) and merge into the total
    const skippedNow = this.skipped;
    if (skippedNow) { chips.textContent = ''; bnum.set(Math.max(R.baseValue, 0)); if (R.product) mnum.set(R.mult); reel?.show(reel.at); }
    else if (bb.animate && R.product) {
      const gap = mb.getBoundingClientRect().left - bb.getBoundingClientRect().right, d = (gap + 12) / 2 + 20;
      bb.animate([{ transform: 'none' }, { transform: `translateX(${d}px) scale(1.05)` }], { duration: TIMING.slam * 1000 / speed, easing: 'cubic-bezier(.6,0,.9,.5)', fill: 'forwards' });
      mb.animate([{ transform: 'none' }, { transform: `translateX(${-d}px) scale(1.05)` }], { duration: TIMING.slam * 1000 / speed, easing: 'cubic-bezier(.6,0,.9,.5)', fill: 'forwards' });
      await this.sleep(TIMING.slam);
    } else await this.sleep(TIMING.slam * 0.5);
    this.skipped = skippedNow;
    boxes.style.display = 'none'; chips.style.display = 'none'; reelRow.classList.remove('on'); tw.classList.add('on');
    if (!skippedNow) { slam(tw); await tnum.to(c.total, { dur: TIMING.roll, stagger: 0.05 }).catch(() => {}); } else tnum.set(c.total);
    if (run !== this.run) return false;

    // the flourish: the film on a tier 3 total (the plain overlay), the flood, the shake in proportion
    const skipped = this.skipped;
    if (tier === 3) tbox.classList.add('film');
    if (tier === 3 && film.animate && !skipped) film.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 180 / speed, easing: 'ease-out' });
    beat('flourish', { tier });
    if (!skipped) {
      this.hud?.shake?.(shake.power);
      if (tier === 3) flood.classList.add('on');
      const t0 = performance.now(), ms = shake.dur * 1000 / speed;
      await new Promise((res) => {
        const frame = () => {
          const f = Math.min(1, (performance.now() - t0) / ms), amp = 1 - f, r = () => (Math.random() * 2 - 1) * amp;
          stage.style.transform = `translate(-50%,-50%) translate(${(r() * shake.px).toFixed(1)}px,${(r() * shake.px).toFixed(1)}px) rotate(${(r() * shake.deg).toFixed(2)}deg)`;
          if (f >= 1 || this.skipped || run !== this.run) { stage.style.transform = 'translate(-50%,-50%)'; res(); } else requestAnimationFrame(frame);
        };
        frame();
      });
    }
    if (run !== this.run) return false;
    if (target && stage.animate && !skipped && !this.skipped) await this.flyTo(stage, target, speed);
    this.ended = true;
    this.emit('table.ceremony.end', { ...tag, total: c.total, skipped, scale: c.scale, tier });
    window.removeEventListener('keydown', this.onKey, true);
    this.holdTimer = setTimeout(() => { stage.classList.add('out'); this.holdTimer = setTimeout(() => { if (this.el === root) this.close(); }, 500); }, this.hold * 1000 / speed);
    return true;
  }

  // The stage goes on to the seat plate (an element, or { x, y } on screen) and shrinks into it.
  flyTo(stage, target, speed) {
    const a = stage.getBoundingClientRect(), t = target.getBoundingClientRect ? target.getBoundingClientRect() : { left: target.x, top: target.y, width: 0, height: 0 };
    const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + t.height / 2 - (a.top + a.height / 2);
    const an = stage.animate([{ transform: 'translate(-50%,-50%)' }, { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.2)`, opacity: 0.2 }],
      { duration: 380 / speed, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' });
    return new Promise((res) => { an.onfinish = res; an.oncancel = res; });
  }
}
