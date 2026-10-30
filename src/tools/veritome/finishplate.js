// ---------------------------------------------------------------------------------------
// THE PHOTO FINISH'S PLATE (SKIFF-RACING.md 9; the rule Dovina's, world/raceway/race.js PHOTO and its event race.photo { gap, won, stars,
// rival, track, mode }): a rival within 0.3 real s of you at the line, and the frame drawn at the line is kept as a plate in the Veritome's
// memory, no lens raised, its stars the event's (how close it was). It is a plate like any other (it takes the memory's room, it is
// appraised in the darkroom for its stars), says no photo.take (no lens, no subject) and pays no cubes. The memory full, no plate.
//
// Prior art: the photo finish camera (a slit camera at the line, the frame judged after), Gran Turismo's and Mario Kart's photo at the
// line, Pokémon Snap's plates kept for the report; the Veritome's own cut (tools/veritome/veritome.js afterRender: the same aperture,
// size and date stamp, so a race plate sits in the memory as any other).
//
//   game.finishPlate = new FinishPlate(game)   (boot/progress.js)   .afterRender(canvas) (boot/frame.js, after the Veritome's)
//   events veritome.plate { kind: 'race', stars, left, by }
// ---------------------------------------------------------------------------------------
import { PLATE } from './veritome.js';
import { drawStamp, stampText } from '../../ui/datestamp.js';

/** The share of the frame a plate is cut from when the viewfinder is not to hand (its own: 0.8 of the width, 0.76 of the height). */
const APERTURE = { w: 0.8, h: 0.76 };

export class FinishPlate {
  constructor(game) {
    this.game = game; this.want = null;
    game.events?.on?.('race.photo', (e) => { if (e.by === 'courier') this.want = e; }); // (cut from the next frame drawn: the line's)
  }

  /** Just after the frame is drawn: the plate is that frame, cut as the lens cuts one. */
  afterRender(canvas) {
    const e = this.want; if (!e || !canvas) return;
    this.want = null;
    const g = this.game, V = g.veritome, M = V?.memory ?? V?.book?.memory; if (!M || M.full) return;
    let thumb = null;
    try {
      const W = canvas.width, H = canvas.height, A = V.vf?.aperture?.(W, H) ?? { x: (W * (1 - APERTURE.w)) / 2, y: (H * (1 - APERTURE.h)) / 2, w: W * APERTURE.w, h: H * APERTURE.h };
      const c = document.createElement('canvas'); c.width = PLATE.w; c.height = PLATE.h;
      const sw = A.w, sh = sw * (PLATE.h / PLATE.w), sy = A.y + (A.h - sh) / 2, x = c.getContext('2d');
      x.drawImage(canvas, A.x, sy, sw, sh, 0, 0, PLATE.w, PLATE.h);
      drawStamp(x, stampText(), PLATE.w - 6, PLATE.h - 16, 11); // (burnt into the print's corner, as every plate's: ui/datestamp.js)
      thumb = c.toDataURL('image/jpeg', 0.72);
    } catch { thumb = null; }
    const P = g.player?.pos;
    const plate = M.expose({
      shot: { subjects: [], stars: e.stars ?? 1, kinds: 0 }, thumb,
      race: { track: e.track ?? null, mode: e.mode ?? null, gap: e.gap, won: !!e.won, rival: e.rival ?? null },
      pos: P ? [+P.x.toFixed(1), +P.y.toFixed(1), +P.z.toFixed(1)] : null, yaw: +(g.player?.yaw ?? 0).toFixed(2), zone: g.zones?.current ?? null,
    });
    if (!plate) return;
    V.book?.save?.();
    g.events?.emit('veritome.plate', { kind: 'race', stars: e.stars ?? 1, left: M.left, by: 'courier' });
  }
}
