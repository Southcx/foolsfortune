// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S LOADER: the studio (workbench/, about 350 KB of source and the stages it draws) is not part of the startup bundle. It is
// a chunk of its own, fetched the first time anything opens it (`/workbench`), built once, and from then on `game.workbench` is the
// Workbench itself with the same `.open`, `.toggle()` and `.frame(dt)` as before. Until then `game.workbench` is this small stand-in,
// `.open` false, so every `game.workbench?.open` in the frame loop, QAIS and the ambience reads as a closed workbench, which it is.
// What the game needs of the workbench at boot (its kept edits) is workbench/overrides.js, small and static.
//
// Prior art: route-level code splitting (React.lazy, Vite's dynamic `import()`), and the developer console loaded on its first
// toggle in an engine's in-game editor (Source's console, Unity's runtime inspector).
//
//   installWorkbenchLoader(game)            game.workbench is the stand-in (before the chat commands are registered)
//   await game.workbench.toggle(on?)        loads the studio if need be, then opens or closes it; a failed load is said in the log
//   await game.workbench.ready()            loads it without opening it (the scripts' way in: posesheet.mjs); afterwards `game.workbench` is the real one
// ---------------------------------------------------------------------------------------

export function installWorkbenchLoader(game) {
  const stand = {
    open: false, loading: null, waiting: false,
    /** Fetch and build the Workbench once; `game.workbench` becomes it. A failed fetch can be tried again. */
    ready() {
      return (stand.loading ||= import('../workbench/workbench.js').then(({ Workbench }) => {
        const wb = new Workbench(game); game.workbench = wb; return wb;
      }, (e) => { stand.loading = null; throw e; }));
    },
    toggle(on) {
      if (stand.waiting) return stand.loading; // (typed twice before it came: one open)
      stand.waiting = true;
      return stand.ready().then(
        (wb) => wb.toggle(on),
        (e) => { console.warn('workbench', e); game.log?.say('system', 'The workbench could not be loaded.', { key: 'wb.load', throttle: 5 }); }, // (the fetch failed: offline, or a build replaced the chunk)
      ).catch((e) => console.warn('workbench', e)).finally(() => { stand.waiting = false; }); // (a throw inside the studio is warned as the chat line warns a command's)
    },
  };
  game.workbench = stand;
  return stand;
}
