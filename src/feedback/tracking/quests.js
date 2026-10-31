// ---------------------------------------------------------------------------------------
// TRACKING, QUESTS AND THE RECAP: the log's lines for a quest begun, a step done, a quest complete, the journal asked for (/quests), and
// the recap (/recap, and once on coming back) (progress/quests.js, progress/recap.js; docs/plans/QUESTS.md). The words are
// Espada's (2026-10-31), in the System's voice (CLARITY.md 14).
//
//   questsRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const bare = (s) => String(s || '').replace(/\.$/, '');

export function questsRules({ on, L, log }) {
  on('quest.start', (e) => { if (e.by !== 'courier') return; L.inc('quest.start'); log.say('system', `New quest: ${e.quest}! Type /quests for your first step.`, { key: `quest.start.${e.id}`, throttle: 1 }); });
  on('quest.step', (e) => {
    if (e.by !== 'courier' || !e.next) return; // (the last step is the quest's done line)
    log.say('system', `${e.quest}: ${e.did || `${bare(e.say)}. Done.`} Next: ${e.next}`, { key: `quest.step.${e.id}`, throttle: 0.5 });
  });
  on('quest.done', (e) => { if (e.by !== 'courier') return; L.inc('quest.done'); log.say('gain', `Quest complete: ${e.quest}! +${e.points} quest point${e.points === 1 ? '' : 's'}.`, { key: `quest.done.${e.id}`, throttle: 1 }); });
  on('quests.ask', (e) => {
    const qs = e.quests || [];
    if (!qs.length) { log.say('system', 'No quests yet. They turn up when someone has a problem you can fix.', { key: 'quests.ask', throttle: 1 }); return; }
    for (const q of qs) {
      const line = q.state === 'done' ? `${q.name}: done.` : q.state === 'started' ? `${q.name} (for ${q.who}). Next: ${q.next}` : `${q.name}: not started yet. ${q.begin}`;
      log.say('system', line, { key: `quest.${q.id}`, throttle: 0.5 });
    }
    log.say('system', `Quest points: ${e.points || 0}.`, { key: 'quests.points', throttle: 0.5 });
  });
  on('recap.show', (e) => {
    const say = (text, k) => log.say('system', text, { key: `recap.${k}`, throttle: 0.5 });
    if (!e.last?.length && !e.open?.length && !e.today?.length) { say('Nothing to recap yet. Go do something!', 'none'); return; }
    if (e.last?.length) { say(e.minutes != null ? `Last time, ${e.minutes} real minutes of play:` : 'Last time:', 'head'); e.last.forEach((l, i) => say(l, `last.${i}`)); }
    if (e.open?.length) { say('Quests in progress:', 'open'); e.open.forEach((l, i) => say(l, `open.${i}`)); }
    if (e.today?.length) { say('Still up for grabs today:', 'today'); e.today.forEach((l, i) => say(l, `today.${i}`)); }
  });
}
