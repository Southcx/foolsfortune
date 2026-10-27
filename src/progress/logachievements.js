// ---------------------------------------------------------------------------------------
// THE COLLECTION LOG'S ACHIEVEMENTS (docs/plans/COLLECTION-LOG.md): predicates over the ledger through the log's own sections
// (collectionlog.js), in the COLLECTION category's "The Collection Log" sub. A count way (sections filled) and a feat way (every section
// begun, the whole at its enough line). Titles and points, never power (DESIGN.md 22).
//
// Prior art: OSRS's collection log milestones (a count of slots, its own title), Yakuza 0's completion list (the whole as one number).
//
//   logAchievements({ F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { logOf, logShare, LOG_SECTIONS } from './collectionlog.js';

const filled = (L) => logOf(L).filter((s) => s.got === s.of).length;
const begun = (L) => logOf(L).filter((s) => s.got > 0).length;

export function logAchievements({ F }) {
  const n = LOG_SECTIONS.length;
  F('clog1', 'collect', 'The Collection Log', 1, 'collect', 'First Page', 'Fill every slot of one section of the collection log.', filled, 1);
  F('clog2', 'collect', 'The Collection Log', 3, 'collect', 'Curator', 'Fill every slot of five sections of the collection log.', filled, 5);
  F('clog3', 'collect', 'The Collection Log', 3, 'collect', 'Well Rounded', `Begin every section of the collection log (all ${n}).`, begun, n);
  F('clog4', 'collect', 'The Collection Log', 6, 'collect', 'Completionist', 'Bring the collection log to its whole: every section to its enough line.', (L) => Math.floor(logShare(L) * 100), 100, { title: 'Completionist' });
}
