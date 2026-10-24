// ---------------------------------------------------------------------------------------
// TRACKING, THE SAVE: the log's lines for where your save is kept (core/save.js, core/cloudsave.js) and for the graphics context lost
// and given back (render/contextloss.js). Nothing is counted: none of it is the Courier's doing. Words are Espada's (2026-10-24).
//
//   saveRules({ on, log })   (tracking/rules.js calls it)
//   events read: save.fail { key, why }   save.cloud { state, from?, ago?, kept? }   render.lost   render.restored { after }
// ---------------------------------------------------------------------------------------
const ago = (s) => (s < 90 ? 'a moment ago' : s < 5400 ? `${Math.round(s / 60)} real minutes ago` : s < 172800 ? `${Math.round(s / 3600)} real hours ago` : `${Math.round(s / 86400)} real days ago`);

export function saveRules({ on, log }) {
  on('save.fail', () => log.say('warn', 'Your progress could not be written in this browser: its storage is full or refused.', { key: 'save.fail', throttle: 60 }));
  on('save.cloud', (e) => {
    const from = e.from || 'another device';
    const line = {
      local: 'Your save is kept on this device only.',
      took: e.kept ? `Your save from ${from} was played longer, so it is the one loaded (${ago(e.ago ?? 0)}). This one is kept in the Codex for a game day.`
        : `Your save from ${from} is loaded (${ago(e.ago ?? 0)}).`, // (nothing played here since the last copy: nothing to keep)
      kept: `Your save from ${from} was played less, so this one stays. The other is kept in the Codex for a game day.`,
      offer: `Your save from ${from}, ${ago(e.ago ?? 0)}, was played longer than this one. LOAD it in the Codex, or keep this one.`,
      failed: 'Your save could not be copied online just now. It is kept on this device, and the copy is tried again later.',
    }[e.state];
    if (line) log.say(e.state === 'failed' || e.state === 'local' ? 'warn' : 'system', line, { key: `save.cloud.${e.state}`, throttle: 30 });
  });
  on('render.lost', () => log.say('warn', 'The screen\'s graphics were taken away. Waiting for them to come back.', { key: 'render.lost', throttle: 5 }));
  on('render.restored', () => log.say('system', 'The graphics are back.', { key: 'render.lost', throttle: 5 }));
}
