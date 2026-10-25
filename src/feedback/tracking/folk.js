// ---------------------------------------------------------------------------------------
// TRACKING, THE CLAY FOLK: who was met, and every finished line of what they said. Moved out of tracking.js whole, the words unchanged
// (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   folkRules({ on, L, log, g })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function folkRules({ on, L, log, g }) {
  // the clay folk (npc/): who was met, and every finished line of what they said (FFXI's "Name : words")
  on('npc.talk', (e) => {
    L.inc('npc.talk'); L.inc(`npc.talk.${e.npc}`);
    const n = g.folk?.byId[e.npc];
    if (e.first && n) log.say('explore', `You meet ${n.name}, ${n.def.title}.`);
  });
  on('npc.say', (e) => { L.inc('npc.lines'); L.inc(`npc.mood.${e.mood || 'calm'}`); const n = g.folk?.byId[e.npc]; log.say('npc', `${n?.name || 'Someone'} : ${e.line}`); });
  on('npc.choose', (e) => log.say('say', `Courier : ${e.text}`));
}
