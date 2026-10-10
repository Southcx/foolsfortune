// ---------------------------------------------------------------------------------------
// TRACKING, FIGMENT ATTACK TELEGRAPHS (docs/plans/FIGMENT-TELEGRAPHS.md): a windup read (creatures.js `windup.read`) is counted by how it
// was answered; a step of Divination's ladder is said once, as the domain's level first reaches it (Espada's lines,
// progress/combat/figmenttelegraphs.js `said`). A level that jumps several steps says each one passed.
//
//   windup.read { kind, how: 'out' | 'parried' | 'lookAway', by }     domain.level { domain, level, by }
//   figmentTelegraphRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { FIGMENT_TELEGRAPH } from '../../progress/combat/figmenttelegraphs.js';

export function figmentTelegraphRules({ on, L, log }) {
  on('windup.read', (e) => { if (e.by !== 'courier') return; L.inc('windup.read'); L.inc(`windup.read.${e.how}`); if (e.kind) L.inc(`windup.read.kind.${e.kind}`); });
  on('domain.level', (e) => {
    if (e.by !== 'courier' || e.domain !== 'divination') return;
    for (const s of FIGMENT_TELEGRAPH.steps) if (e.level >= s.at && L.first(`figmentTelegraph.step.${s.id}`)) log.say('gain', s.said, { key: `ft.${s.id}` });
  });
}
