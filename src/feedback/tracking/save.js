// ---------------------------------------------------------------------------------------
// TRACKING, THE SAVE: the log's lines for where your save is kept (core/save.js, core/cloudsave.js) and for the graphics context lost
// and given back (render/contextloss.js). Nothing is counted: none of it is the Courier's doing. Words are Espada's (2026-10-24).
//
//   saveRules({ on, log })   (tracking/rules.js calls it)
//   events read: save.fail { key, why }   save.cloud { state, from?, ago?, kept? }   render.lost   render.restored { after }
// ---------------------------------------------------------------------------------------
const ago = (s) => (s < 90 ? 'a moment ago' : s < 5400 ? `${Math.round(s / 60)} real minutes ago` : s < 172800 ? `${Math.round(s / 3600)} real hours ago` : `${Math.round(s / 86400)} real days ago`);

export function saveRules({ on, log }) {
  on('save.fail', () => log.say('warn', 'Save failed. This browser\'s storage is full or refused.', { key: 'save.fail', throttle: 60 }));
  on('save.cloud', (e) => {
    const from = e.from || 'another device';
    const line = {
      local: 'Save stored on this device only.',
      took: e.kept ? `Save from ${from} loaded (${ago(e.ago ?? 0)}). It has more play time. This device\'s save is stored in the Codex for 1 game day.`
        : `Save from ${from} loaded (${ago(e.ago ?? 0)}).`, // (nothing played here since the last copy: nothing to keep)
      kept: `Save from ${from} has less play time. This save stays loaded. The other is stored in the Codex for 1 game day.`,
      offer: `Save from ${from} (${ago(e.ago ?? 0)}) has more play time than this one. Press LOAD in the Codex to use it, or keep this one.`,
      failed: 'Online copy failed. The save is stored on this device. The copy is retried later.',
    }[e.state];
    if (line) log.say(e.state === 'failed' || e.state === 'local' ? 'warn' : 'system', line, { key: `save.cloud.${e.state}`, throttle: 30 });
  });
  on('render.lost', () => log.say('warn', 'Graphics lost. Waiting for them to return.', { key: 'render.lost', throttle: 5 }));
  on('render.restored', () => log.say('system', 'Graphics restored.', { key: 'render.lost', throttle: 5 }));
}
