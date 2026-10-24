// ---------------------------------------------------------------------------------------
// KEEPING A SOUND SETTING: the voice's, the music's and the rhythm mode's choices as sections of the save in the settings scope
// (core/save.js), never in localStorage themselves. A section with nothing kept yet reads the key the module once wrote for itself,
// once, takes it in and deletes it, so nobody's settings are lost in the move.
//
//   const dirty = keepSetting(save, id, oldKey, { dump, load, fresh })   dirty() on a change
// ---------------------------------------------------------------------------------------

export function keepSetting(save, id, oldKey, { dump, load, fresh = () => {} }) {
  if (!save?.section) return () => {};
  save.section(id, {
    scope: 'settings', version: 1, dump, load,
    reset: () => {
      fresh();
      let old = null;
      try { old = JSON.parse(save.store?.getItem(oldKey) || 'null'); save.store?.removeItem(oldKey); } catch { /* none kept */ }
      if (old && typeof old === 'object') { load(old); save.dirty(id); }
    },
  });
  return () => save.dirty(id);
}
