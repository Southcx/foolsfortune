// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S OWN ANIMATION: the BRUSH SLIDE, as it was authored before the Courier's own suite had one. The suite's
// Brush_BrushSlide is the slide now (soulbrush.js: lower and wider, the free arm out along the way they go, the brush hand trailing where
// this one put it, so the same light correction lays the bristles on the ground); this stays only as its stand-in, and goes when
// courier/anim/authored.js stops calling it. Nothing in the free libraries (UAL, CMU) slid sideways on its feet dragging
// something behind it, so it was authored once at startup with the key-pose author (authoring.js), as the Skiff's rider is: a
// snowboarder's stance on bare ground, front foot the left, low, the free arm out along the way they are going for balance, the brush
// hand low and behind so the bristles drag on the ground in their wake. At runtime the tech turns the body sideways to the slide and only
// corrects the brush onto the ground (a few centimetres, and the hand's turn).
//
// Body space, as in authoring.js: root at the feet, +Z the way the body faces (out to the side of the slide), +X the character's left,
// which is the way they are sliding. Prior art for the pose: Jet Set Radio's and Splatoon's low sideways skid, and Okami's Amaterasu,
// whose brush is their tail and trails behind them.
//
//   brushSlide   the slide: a slow breath of a bob, the balancing arm riding it
// ---------------------------------------------------------------------------------------
import { V3 } from '../../courier/anim/authoring.js';

export function authorBrush(A, ch) {
  const ah = ch.ankleRest;
  A.clip('brushSlide', {
    dur: 1.2, loop: true, base: 'idle',
    build(u) {
      const b = Math.sin(u * Math.PI * 2);
      this.hips(0.04, -(0.34 + b * 0.012), -0.04);
      this.chain([['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]], 'x', 12);
      this.chain([['spine001', 0.2], ['spine002', 0.3], ['spine003', 0.5]], 'y', 24);
      this.chain([['spine001', 0.3], ['spine002', 0.3], ['spine003', 0.4]], 'z', -6);
      this.chain([['spine004', 0.5], ['head', 0.5]], 'y', 42);
      this.chain([['spine004', 0.5], ['head', 0.5]], 'x', -10);
      const fl = V3(0.5, ah, 0.05), fr = V3(-0.44, ah, -0.02);
      this.foot('L', fl, fl.clone().add(V3(0.15, 0.42, 0.85)), V3(0.25, 0, 1), 0);
      this.foot('R', fr, fr.clone().add(V3(-0.12, 0.42, 0.85)), V3(-0.15, 0, 1), 0);
      // the balancing arm out along the slide, palm down, riding the bob
      const hl = V3(0.66, 1.12 + b * 0.02, 0.3);
      this.hand('L', hl, hl.clone().add(V3(-0.25, -0.35, -0.3)), V3(1, 0.05, 0.25), V3(0, -1, 0.1));
      this.curl('L', 0.25);
      // the brush hand low and behind (the tech turns it so the bristles lie on the ground)
      const hr = V3(-0.46, 0.6 - b * 0.01, 0.14);
      this.hand('R', hr, hr.clone().add(V3(-0.1, 0.45, -0.45)), V3(-0.2, -1, 0), V3(0, 0, 1));
      this.curl('R', 0.9);
    },
  });
}
