// ---------------------------------------------------------------------------------------
// THE A/B ON THE DEVICE (South, 2026-11-01: "performance within the Strawman's Well ... framerate on mobile is truly lacking. It's probably
// attributable to multiple sources"). A desk browser cannot time an iPhone's GPU, so the phone times itself: `/perfab` takes each family of
// draws out in turn (the field report's hide: draws whose material or object name holds the word are skipped), lets the frame settle,
// measures the median frame, and puts it back; the plain frame is measured first and last. Each result is a field report moment (the
// gate reads it from the private store) and a log line. Nothing else changes: the simulation runs on, only those draws are skipped.
// DEBUG only; a run takes about AB.settle + AB.measure real s a family.
//
// Prior art: a bisection by switching off (git bisect's halving, done by hand a family at a time); RenderDoc's and Xcode's GPU frame
// capture "disable draw" (the cost of a draw is the frame without it); Unity's Frame Debugger.
//
//   new PerfAB(game)   /perfab [word,word ...]   (words: the families; none given, AB.families)   events perf.ab { family, ms, base, by }
// ---------------------------------------------------------------------------------------

/** families: words in the draws' material or object names (`well-flats` the painted flats, `theatre` the toy theatre's frame, `wellprops`
 *  the sewing kit's props, `kurogo` the stagehands and the paper snow, `plane.mark` the plane mark, `strawman` the dummies, Strawman and the
 *  fighters, `courier` the Courier's body, `well` all of the Well's own); settle and measure in real s. */
export const AB = { families: ['well-flats', 'theatre', 'wellprops', 'kurogo', 'plane.mark', 'strawman', 'courier', 'lachrimetertube', 'well'], settle: 1.5, measure: 4 };

export class PerfAB {
  constructor(game) {
    this.game = game; this.run = null;
    game.chat?.add('perfab', {
      debug: true,
      help: 'the frame timed with each family of draws taken out in turn (the phone measuring itself; written to the field report): /perfab [word,word]',
      run: (args) => this.start((args?.[0] || '').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)),
    });
  }

  start(words) {
    const g = this.game, F = g.fieldReport;
    if (!F || this.run) return;
    const fam = words.length ? words : AB.families;
    this.run = { steps: [null, ...fam, null], i: 0, t: 0, ms: [], base: [], zone: g.zones?.current };
    F.moment(`perfab begun in ${this.run.zone} (${fam.join(', ')})`);
    this.apply();
  }

  apply() { const R = this.run, w = R.steps[R.i]; this.game.fieldReport.hide = w ? [w] : []; R.t = 0; R.ms = []; }

  /** Each frame (boot/frame.js): the frame's real ms gathered once the family has settled. */
  frame(rawDt) {
    const R = this.run; if (!R) return;
    R.t += rawDt;
    if (R.t > AB.settle) R.ms.push(rawDt * 1000);
    if (R.t < AB.settle + AB.measure) return;
    const s = [...R.ms].sort((a, b) => a - b), med = +(s[s.length >> 1] || 0).toFixed(1), w = R.steps[R.i], g = this.game;
    if (!w) R.base.push(med);
    const base = R.base[0] ?? med;
    g.fieldReport.moment(w ? `perfab without ${w}: ${med} ms (plain ${base} ms)` : `perfab plain: ${med} ms`);
    g.events?.emit('perf.ab', { family: w || 'plain', ms: med, base, by: 'courier' });
    R.i++;
    if (R.i < R.steps.length) { this.apply(); return; }
    g.fieldReport.hide = []; g.fieldReport.write?.(true); this.run = null;
  }
}
