// ---------------------------------------------------------------------------------------
// THE CONSTELLATIONS (plain name): the house's own figures in the night's stars, as data. Thirteen: the Fool's (you: near the stars'
// pole, so it never sets, and the brightest) and the twelve zodiac Majors the classes name (docs/plans/CLASSES.md 2: the Emperor for
// Aries .. the Moon for Pisces), laid round the sky in the zodiac's order on a belt 20 degrees off the stars' equator. Each is a few
// stars (x east, y north, in degrees on the sky about its centre; `b` a star's brightness, 1 the usual) and the lines between them
// (pairs of star indices). vfx/nightsky.js packs them into one small texture the dome reads, and fades the lines in while the camera
// holds still looking up; the stars themselves are always there.
//
// Prior art: the real figures each sign is drawn with (H. A. Rey's "The Stars", 1952: figures you can see as what they are named for:
// the Lion's sickle, the Archer's teapot, the Twins' two lines), the planetarium's habit of fading the lines in on a pause, and the
// tarot's Fool (Rider-Waite-Smith, 1909): a walker at the cliff's edge, a bindle on a staff over the shoulder, a little dog at the heel.
//
//   CONSTELLATIONS: [{ key, card, ra, dec, stars: [[x, y, b]], lines: [[i, j]] }]   (ra, dec in degrees, on the stars' own wheel)
// ---------------------------------------------------------------------------------------

/** The zodiac's belt: its declination on the stars' wheel (degrees), the first sign's right ascension, and the step between signs. */
export const ZODIAC_BELT = { dec: 20, ra0: 0, step: 30 };

const sign = (i, key, card, stars, lines) => ({ key, card, ra: ZODIAC_BELT.ra0 + i * ZODIAC_BELT.step, dec: ZODIAC_BELT.dec, stars, lines });
const chain = (n, from = 0) => Array.from({ length: n - 1 }, (_, k) => [from + k, from + k + 1]);

export const CONSTELLATIONS = [
  // the Fool: a walker stepping off the cliff, the staff and its bindle over the shoulder, the dog at the heel (the brightest figure)
  { key: 'fool', card: 'fool', ra: 270, dec: 72, bright: 1.5,
    stars: [[0, 6, 1.6], [0, 3.6, 1.2], [0.4, 0, 1.3], [-2.4, -3.4, 1.1], [2.6, -3.8, 1.2], [3, 6.2, 1], [5.4, 8.6, 1.8], [-6, -2.4, 1], [-8, -1.2, 0.9], [-9.5, -4.6, 0.8]],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4], [1, 5], [5, 6], [7, 8], [3, 9]] }, // (the last: the cliff's edge under the back foot)
  sign(0, 'aries', 'emperor', [[0, 0, 1.4], [4, 1.5, 1.1], [7, 2.5, 0.9], [8.5, 2, 0.8]], chain(4)),
  sign(1, 'taurus', 'hierophant', [[0, 0, 0.9], [-2.5, 1.5, 0.9], [-5, 3, 1.7], [-2.5, -1.5, 0.9], [-5, -3, 1], [-12, 5, 1.1], [-11, -4, 1]],
    [[0, 1], [1, 2], [2, 5], [0, 3], [3, 4], [4, 6]]),
  sign(2, 'gemini', 'lovers', [[0, 6, 1.5], [-3, 3, 0.9], [-6, 0, 0.9], [-8, -2, 0.8], [2.5, 4.5, 1.6], [0.5, 1.5, 0.9], [-2.5, -1.5, 0.9], [-4.5, -3.5, 0.8]],
    [...chain(4), ...chain(4, 4), [0, 4]]),
  sign(3, 'cancer', 'chariot', [[0, 0, 0.9], [0, 4, 0.8], [-3, -3, 0.9], [3, -3.5, 0.9], [-4.5, -5, 0.7]], [[0, 1], [0, 2], [0, 3], [2, 4]]),
  sign(4, 'leo', 'strength', [[0, 0, 1.7], [0, 3, 1], [1, 5, 0.9], [3, 6, 1], [5, 5, 0.9], [5.5, 3.5, 0.8], [8, 2, 1.1], [14, 0, 1.2], [9, -1, 0.9]],
    [...chain(6), [1, 6], [6, 7], [7, 8], [8, 0]]),
  sign(5, 'virgo', 'hermit', [[0, -6, 1.7], [2, -1, 0.9], [0, 2, 0.9], [-4, 4, 0.8], [4, 3, 0.9], [8, 5, 0.8]], [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5]]),
  sign(6, 'libra', 'justice', [[0, 0, 1.1], [5, 1, 1.1], [4, 5, 0.9], [-1, 4, 0.9], [-1, -3, 0.8], [6, -2, 0.8]], [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5]]),
  sign(7, 'scorpio', 'death', [[1.5, 6, 0.9], [1, 3.5, 1], [2.5, 2, 0.9], [-2, -1, 1.8], [-4, -3, 0.9], [-5, -6, 0.9], [-4, -9, 0.9], [-1, -11, 1], [2, -10, 1.1], [3, -8, 0.9]],
    [[0, 1], [2, 1], [1, 3], ...chain(7, 3)]),
  sign(8, 'sagittarius', 'temperance', [[0, 0, 1], [4, 0, 1.2], [5, 3, 1], [2, 5, 1], [-1, 3, 1], [3.5, 7, 0.9], [-3.5, 1, 0.8], [7, 1.5, 0.8]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [3, 5], [4, 6], [1, 7], [2, 7]]),
  sign(9, 'capricorn', 'devil', [[0, 0, 1.1], [5, -4, 0.9], [10, -3, 0.9], [13, 0, 1], [8, 1, 0.8]], [...chain(5), [4, 0]]),
  sign(10, 'aquarius', 'star', [[0, 0, 1], [3, 2, 1.1], [6, 1, 1], [8, 3, 0.9], [5, -2, 0.8], [7, -5, 0.8], [4, -7, 0.8]], [...chain(4), [2, 4], [4, 5], [5, 6]]),
  sign(11, 'pisces', 'moon', [[0, 0, 1.3], [-6, 2, 0.8], [-12, 4, 0.9], [-14, 5.5, 0.8], [-15.5, 3.5, 0.8], [-13.5, 2, 0.8], [2.5, 5, 0.8], [5, 10, 0.9], [4, 12.5, 0.8], [6.5, 13, 0.8]],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2], [0, 6], [6, 7], [7, 8], [8, 9], [9, 7]]),
];
