// ---------------------------------------------------------------------------------------
// THE SMASH CHALLENGES' MOMENTS (plain name; docs/plans/MECHS.md 11.1; Dovina's events, world/hangar/challenges.js): what the lane does
// on her events, looks only, never narration (the log is tracking's, feedback/tracking/mechnight.js):
//   challenge.start  the torii's three lamps lit one after another (red, red, gold: a start light's count), the line's paint flared and
//                    sparks thrown up along it, then the lamps held lit while the challenge runs (a world mark: no words)
//   challenge.score  a burst at what was hit (the pins' gold sunburst and confetti on a STRIKE or SPARE, a gold ring where a throw
//                    landed) and the overlay's tag over it (docs/plans/OVERLAY.md 8: a readout pinned to its thing, in the System's
//                    type): STRIKE, SPARE, "7 DOWN", "+50", "MISS", "142 M"; popped in, held, risen and let go in 2.4 real s
//   challenge.end    the medal's glint: confetti in its metal over the lane (bronze, silver, gold; none, a puff of dust)
// THE TAG          a word on a canvas of its own in the System's type (DotGothic16 for words, Jersey 15 for counts), an ink outline a
//                  dot wide, on a hex-cornered plate of ink rimmed in its tone (feedback/oddstags.js's plate) so it reads gold on a gold
//                  burst or a bright sky, a hairline under it and a dashed leader down to its thing (the house's tag grammar:
//                  vfx/creaturetags.js, vfx/strawmanwell/percenttag.js), drawn as a sprite at a fixed size on screen so it reads from the line 115 m off
// Prior art: Wii Sports' bowling (STRIKE said over the pins, never across the screen), Ultimate Destruction's medal screens (here
// confetti over the lane), a drag strip's christmas tree, Watch Dogs' leader line.
//
//   const T = new WordTag(text, { tone })   parent.add(T.sprite)   T.update(dt, at) -> bool (alive)   T.dispose()   WORD_TAG   tagWords(e)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../../../ui/theme.js';

/** Its size on screen (a share of the view's height), its rise (m over its life), its life (real s), the canvas (px). */
export const WORD_TAG = { h: 0.075, rise: 6, life: 2.4, pop: 0.22, cw: 512, ch: 168 };
const INK = '#0d0a12', WORD = `${FONT.sys}`, COUNT = `'Jersey 15', ${FONT.sys}`;
const TONES = { gold: ['#fff2c8', '#ffd36a'], white: ['#ffffff', '#e8e0d0'], ember: ['#ffd0a0', '#ff7a2a'], grey: ['#d8d0c8', '#9a948c'] };
const backOut = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/** The tag's words for a score: STRIKE and SPARE as said, a bowling ball's pins down, a throw's points or metres, a miss. */
export function tagWords(e) {
  const w = String(e?.what || '');
  if (w === 'STRIKE' || w === 'SPARE') return { text: w, tone: 'gold', big: true };
  if (e.id === 'bowling') return { text: `${e.add} DOWN`, tone: e.add >= 7 ? 'white' : 'grey' };
  if (e.id === 'javelin') return { text: w.toUpperCase(), tone: e.add > 0 ? 'gold' : 'white' };
  if (e.id === 'bullseye') return e.add > 0 ? { text: `+${e.add}`, tone: e.add >= 100 ? 'gold' : e.add >= 50 ? 'white' : 'grey', big: e.add >= 100 } : { text: 'MISS', tone: 'grey' };
  return null; // (the timed ones: their count is the readout's, the city's breaks their own)
}

export class WordTag {
  constructor(text, { tone = 'white', big = false } = {}) {
    const C = WORD_TAG, cv = this.canvas = document.createElement('canvas'); cv.width = C.cw; cv.height = C.ch;
    this.text = text; this.tone = TONES[tone] || TONES.white; this.big = big; this.t = 0;
    this.texture = new THREE.CanvasTexture(cv); this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: false, toneMapped: false });
    this.sprite = new THREE.Sprite(this.material); this.sprite.renderOrder = 9; this.sprite.name = 'challenge.tag';
    this.sprite.center.set(0.5, 0); // (its foot, the leader's end, on the thing)
    this.draw(); try { document.fonts?.ready?.then(() => this.draw()); } catch { /* (headless) */ }
  }
  draw() {
    const C = WORD_TAG, g = this.canvas.getContext('2d'), W = C.cw, H = C.ch, num = /^[+0-9]/.test(this.text);
    g.clearRect(0, 0, W, H);
    const px = num ? 104 : 82; g.font = `${px}px ${num ? COUNT : WORD}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    const base = 96, tw = Math.min(W - 24, g.measureText(this.text).width);
    // the plate of ink behind the word, its corners cut (the odds tag's hex plate), a hairline of its tone inside the rim
    const pw = Math.min(W - 6, tw + 56), ph = px * 0.8 + 30, pX = (W - pw) / 2, pY = base - px * 0.8 - 12, cut = 16;
    const hex = (x, y, w, h, c) => { g.beginPath(); g.moveTo(x + c, y); g.lineTo(x + w - c, y); g.lineTo(x + w, y + c); g.lineTo(x + w, y + h - c); g.lineTo(x + w - c, y + h); g.lineTo(x + c, y + h); g.lineTo(x, y + h - c); g.lineTo(x, y + c); g.closePath(); };
    hex(pX, pY, pw, ph, cut); g.fillStyle = 'rgba(13,10,18,0.86)'; g.fill();
    hex(pX + 4, pY + 4, pw - 8, ph - 8, cut - 3); g.lineWidth = 2; g.strokeStyle = this.tone[1]; g.globalAlpha = 0.55; g.stroke(); g.globalAlpha = 1;
    const fill = g.createLinearGradient(0, base - px * 0.75, 0, base); fill.addColorStop(0, this.tone[0]); fill.addColorStop(1, this.tone[1]);
    g.lineWidth = 12; g.strokeStyle = 'rgba(13,10,18,0.5)'; g.strokeText(this.text, W / 2, base + 4, W - 24); // (its drop shadow)
    g.lineWidth = 8; g.strokeStyle = INK; g.strokeText(this.text, W / 2, base, W - 24); g.fillStyle = fill; g.fillText(this.text, W / 2, base, W - 24);
    // the hairline under it and the leader down to the thing (the tag's own line)
    const x0 = W / 2 - tw / 2;
    g.fillStyle = this.tone[1]; g.fillRect(x0, base + 6, tw, 3);
    for (let y = pY + ph + 4; y < H - 2; y += 9) { g.fillStyle = INK; g.fillRect(W / 2 - 3, y, 6, 6); g.fillStyle = 'rgba(244,239,226,0.9)'; g.fillRect(W / 2 - 1.5, y + 1.5, 3, 3); }
    this.texture.needsUpdate = true;
  }
  /** Stepped (real s) at its thing's place; false once it has gone. */
  update(dt, at) {
    const C = WORD_TAG; this.t += dt; const t = this.t, k = t / C.life;
    if (k >= 1) return false;
    const pop = t < C.pop ? backOut(t / C.pop) : 1, s = C.h * (this.big ? 1.8 : 1) * pop;
    this.sprite.scale.set(s * (C.cw / C.ch), s, 1);
    this.sprite.position.set(at.x, at.y + C.rise * Math.max(0, k - 0.55) / 0.45, at.z);
    this.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    return true;
  }
  dispose() { this.sprite.removeFromParent(); this.texture.dispose(); this.material.dispose(); }
}
