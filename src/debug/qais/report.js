// ---------------------------------------------------------------------------------------
// FILING A REPORT: QAIS's Reports tab (docs/plans/BUGREPORT.md). The frame taken when F8 was pressed goes under Calissa's markup window
// (src/ui/bugmarkup.js); what the owner writes there, and everything the machine attaches (attach.js), becomes one report:
//   - in the published build: the frame and the marks as two PNG assets, the state as one JSON asset, and one row `bugs/R<n>` (the
//     words, kind, severity, the build, the place, the asset ids, the QAIS test if filed from one, `status: 'new'`);
//   - anywhere else (the dev server, a page without the capabilities): one .json file, the pictures inline, downloaded to hand over.
// Either way the bus says `qais.report.filed { id, kind, test, by: 'courier' }`, and the log's rule says it (feedback/tracking.js).
//
// Prior art: Valve's `bug` command and Destiny's internal reporter (the frame first, marks on it, few words, the rest attached).
//
//   const row = await fileReport(game, store, frame, { test })   -> the row filed, or null (Esc in the markup window)
// ---------------------------------------------------------------------------------------
import { BugMarkup } from '../../ui/bugmarkup.js';
import { gather, pngOf } from './attach.js';

/** The next report number: one past the highest on the store (the owner files one at a time). */
const nextN = (bugs) => bugs.reduce((m, b) => Math.max(m, +b.n || 0), 0) + 1;

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export async function fileReport(game, store, frame, { test = null, round = null } = {}) {
  const r = await new BugMarkup(game).open(frame);
  if (!r) return null;
  const state = gather(game), w = state.where;
  const n = nextN(store.docs('bugs')), id = `R${n}`;
  const row = {
    n, title: r.title, happened: r.happened, should: r.should, kind: r.kind, severity: r.severity,
    build: w.build, round: round?.build ?? null, zone: w.zone, place: w.place, stand: w.stand, test: test?.id ?? null,
    status: 'new', statusLine: '', filedAt: Date.now(), by: (await store.me()).id,
  };
  if (store.online) {
    const [fr, mk, st] = await Promise.all([
      pngOf(frame).then((b) => store.upload(b, 'image/png')),
      pngOf(r.marks).then((b) => store.upload(b, 'image/png')),
      store.upload(new Blob([JSON.stringify(state)], { type: 'application/json' }), 'application/json'),
    ]);
    Object.assign(row, { frame: fr?.id ?? null, frameUrl: fr?.url ?? null, marks: mk?.id ?? null, marksUrl: mk?.url ?? null, state: st?.id ?? null });
    await store.set('bugs', id, row);
    if (test) await store.update('tests', test.id, { report: id });
  } else {
    // (away from the published build: one file, the pictures inline, to hand over by any means)
    download(`report-${w.build}-${id}.json`, JSON.stringify({ ...row, frame: frame.toDataURL('image/png'), marks: r.marks.toDataURL('image/png'), state }));
  }
  game.events.emit('qais.report.filed', { id: n, title: row.title, kind: row.kind, test: row.test, kept: store.online ? 'store' : 'file', by: 'courier' });
  return row;
}
