// ---------------------------------------------------------------------------------------
// THE DOMAINS' RUNGS AS ACHIEVEMENTS (docs/plans/DOMAINS.md 12; progress/domainarts.js): each rung opens only by achievement, and the
// achievement is that rung's two ways read as one predicate over the ledger (its domain's level, or its feat done n times). Tier by the
// rung's band: the first relations (10) Medium, the second (30) Hard, the depth (60) Elite. In THE DOMAINS' own sub, Rungs.
//
// Prior art: Old School RuneScape's skill guides (what each level opens, listed by the skill), FFXIV's job quests (one at each rung).
//
//   domainArtAchievements({ F })   (moduleachievements.js calls it)
// ---------------------------------------------------------------------------------------
import { DOMAIN_ARTS, FEAT_WORDS } from './domainarts.js';
import { DOMAINS, levelOf } from './domains.js';

const TIER = { 10: 2, 15: 2, 30: 3, 45: 3, 60: 4, 80: 5, 99: 6 };

export function domainArtAchievements({ F }) {
  let i = 0;
  for (const [id, A] of Object.entries(DOMAIN_ARTS)) {
    const [feat, n] = A.feat, name = DOMAINS[A.domain].name;
    F(`dr${++i}`, 'psyche', 'Rungs', TIER[A.level] ?? 2, 'mechanic', A.label, `Open ${A.label}: ${name} level ${A.level}, or ${n} ${FEAT_WORDS[feat] || feat}.`,
      (L) => (levelOf(L.get(`exp.${A.domain}`)) >= A.level || L.get(`domain.feat.${feat}`) >= n ? 1 : 0), 1, { rung: id });
  }
}
