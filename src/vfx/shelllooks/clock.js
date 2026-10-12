// ---------------------------------------------------------------------------------------
// CLOCK'S LOOKS (the caster shells TYPE-51 to 60 still without one: docs/plans/CASTER-SHELLS.md section 3): time, in the family's pale
// gold. Rows for vfx/shelllooks.js, effects as data for vfx/library.js. The zones' own looks are the runner's (Stasis, the Slow Field
// and Stop-Motion: S7's time grade and S2's glass bubble), as are Rewind's ghost path (its tracers) and the Bookmark's hovering card;
// these give the rounds a ticking tail and the rest their marks.
//
// Prior art: Braid's rewind (time running back, the world's grain reversed), Prince of Persia's Sands, Overwatch's Tracer recall (a
// mark where you were), Devil May Cry's afterimages (Echo is Blink Dash's own, vfx/afterimage.js), kintsugi (Bloom's gold knitting).
//
//   LOOKS (by shell id)   EFFECTS (`shell.<id>.<moment>`)
// ---------------------------------------------------------------------------------------
import { L, leaveGhost } from './kit.js';

const CLOCK = 0xe8d080, GREEN = 0x7ad070;

export const LOOKS = {
  stasis: { fly: 'shell.clock.fly', land: false },
  slowField: { fly: 'shell.clock.fly', land: false },
  stopMotion: { fly: 'shell.clock.fly', land: false },
  rewind: { fly: 'shell.clock.fly', land: 'target', hold: () => 1.2 },
  // 55 Echo: your ghost (Blink Dash's afterimage) left a beat behind you while it lasts, as the ghost that fires again
  echo: { onFire(g, row) {
    let next = 0;
    g.vfx.play('shell.echo.fire', { pos: g.player?.pos, follow: (h) => {
      if (h.t > row.n.dur || !g.player) return false;
      h.pos.copy(g.player.pos);
      if (h.t >= next) { next = h.t + row.n.lag * 0.5; leaveGhost(g, { life: row.n.lag, opacity: 0.35, ph: h.t * 0.1 }); }
      return true;
    } });
  } },
  bloom: { fly: 'shell.clock.fly', land: 'point', r: (row) => row.n.r },
  // 59 Bookmark: the mark set (a gold ring where you stood, held while it waits), or, fired again, a fold where you were
  bookmark: { onFire(g, row) {
    const P = g.player; if (!P) return;
    const B = g.shells?.runner?.bookmark;
    if (B) { g.vfx.play('shell.swap.land', { pos: P.pos.clone().setY(P.pos.y + 0.9), tint: CLOCK }); g.vfx.play('shell.bookmark.back', { pos: B.pos }); return; }
    const at = P.pos.clone(), t = row.n.dur;
    g.vfx.play('shell.bookmark.fire', { pos: at, follow: (h) => h.t <= t && !!g.shells?.runner?.bookmark });
  } },
  lastWord: { fly: 'shell.clock.fly', land: 'target', over: true, hold: (row) => row.n.delay + 0.4 },
};

export const EFFECTS = {
  // the Clock's rounds: pale gold motes and a ring ticking off them
  'shell.clock.fly': { layers: [
    L({ type: 'sprites', rate: 30, dur: Infinity, shape: 'soft', size: [0.12, 0.16], sizeEnd: 0.02, life: 0.25, color: CLOCK }),
    L({ type: 'sprites', rate: 8, dur: Infinity, shape: 'ringthin', size: 0.15, sizeEnd: 0.5, life: 0.2, color: CLOCK, alpha: 0.8 }),
  ] },
  // 54 Rewind: a ring running backward into the body, its motes falling up
  'shell.rewind.land': { layers: [
    L({ type: 'sprites', count: 1, shape: 'swirl', size: 2, sizeEnd: 0.3, life: 0.5, spin: [-10, -8], color: CLOCK, powerCount: false }),
    L({ type: 'sprites', rate: 20, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.6, dir: 'up', speed: [0.6, 1.2], size: [0.1, 0.18], sizeEnd: 0, life: 0.6, gravity: -2, color: [CLOCK, 'white'], twinkle: 12 }),
  ] },
  // 55 Echo: the haste of a second you about you (the ghosts themselves are vfx/afterimage.js's)
  'shell.echo.fire': { layers: [
    L({ type: 'sprites', rate: 6, dur: Infinity, shape: 'sparkle', spawn: 'sphere', r: 0.5, offset: [0, 1, 0], size: [0.1, 0.16], sizeEnd: 0, life: 0.5, color: ['film', 'white'], twinkle: 12 }),
  ] },
  // 57 Bloom: gold lines knitting in to the point, green rising out of the ground round it
  'shell.bloom.land': { layers: [
    L({ type: 'sprites', count: 24, shape: 'streak', spawn: 'ring', r: 'r', dir: 'in', speed: [4, 6], size: [0.2, 0.3], sizeEnd: 0.04, life: 0.6, stretch: 2, color: 'gold', powerCount: false }),
    L({ type: 'sprites', count: 30, shape: 'petal', spawn: 'disc', r: 'r', dir: 'up', speed: [0.6, 1.4], size: [0.1, 0.16], life: [1, 1.6], drag: 1, color: [GREEN, 0x9ae070, 0x4f9a5a], spin: [-3, 3], delay: [0, 0.4], powerCount: false }),
    L({ type: 'sprites', count: 12, shape: 'sparkle', spawn: 'disc', r: 'r', size: [0.15, 0.25], sizeEnd: 0, life: [0.6, 1], color: ['gold', 'white'], twinkle: 10, delay: [0.2, 0.6], powerCount: false }),
  ] },
  // 59 Bookmark: a gold ring held where you stood, a glint over it; and where you come back to, a gold fold
  'shell.bookmark.fire': { layers: [
    L({ type: 'sprites', rate: 0.8, dur: Infinity, shape: 'ringthin', offset: [0, 0.05, 0], size: 0.6, sizeEnd: 1.2, life: 1, color: CLOCK, alpha: 0.8, rot: 0 }),
    L({ type: 'sprites', rate: 3, dur: Infinity, shape: 'glint', offset: [0, 1.8, 0], spawn: 'sphere', r: 0.2, size: [0.14, 0.22], sizeEnd: 0, life: 0.4, color: ['gold', 'white'], twinkle: 10 }),
  ] },
  'shell.bookmark.back': { layers: [
    L({ type: 'sprites', count: 1, shape: 'ring', size: 1.6, sizeEnd: 0.2, life: 0.3, color: CLOCK, rot: 0, powerCount: false }),
    L({ type: 'sprites', count: 12, shape: 'streak', spawn: 'column', r: 0.4, height: 1.8, dir: 'up', speed: [2, 4], size: [0.14, 0.22], sizeEnd: 0.03, life: 0.35, stretch: 2, color: ['gold', 'white'], powerCount: false }),
  ] },
  // 60 Last Word: a ring over the head closing on the beat until the words come due
  'shell.lastWord.land': { layers: [
    L({ type: 'sprites', rate: 1, dur: Infinity, shape: 'ring', size: 0.9, sizeEnd: 0.2, life: 0.9, color: 0xd0a0ff, alpha: 0.85, rot: 0 }),
    L({ type: 'sprites', at: 3, count: 1, shape: 'star4', size: 1.2, sizeEnd: 0.1, life: 0.2, color: 'white', colorEnd: 0xd0a0ff, powerCount: false }),
  ] },
};
