// ---------------------------------------------------------------------------------------
// THE PUZZLE DUELS' ACHIEVEMENTS (docs/plans/PUZZLE-DUELS.md 22.6): predicates over the ledger (feedback/tracking/duel.js keeps it), the
// BATTLE category's "Puzzle Duels" sub: winning, breaking, the chains, the skills of the worn pair, the all clear. Each worth having has a
// count way and a feat way (DESIGN.md 22): twenty-five duels won, or a chain of six once. Names Espada's (2026-10-27).
//
// Prior art: Puzzle & Dragons' combo medals (a 10-combo), Tetris Effect's journey goals (a perfect clear), Puzzle Quest's spell mastery
// (every spell cast), the house's own achievements.js (its helpers passed in).
//
//   duelAchievements({ C, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { SKILL_TOOLS } from './duel/skills.js';
import { LEARNED, isLearned } from './duel/learned.js';

export function duelAchievements({ C, F }) {
  C('du1', 'battle', 'Puzzle Duels', 1, 'count', 'Mind over Matter', 'Win a puzzle duel.', 'duel.won', 1);
  C('du2', 'battle', 'Puzzle Duels', 2, 'mechanic', 'Cracked', 'Break a Figment in a puzzle duel.', 'duel.break', 1);
  C('du3', 'battle', 'Puzzle Duels', 2, 'mechanic', 'Domino', 'Make a chain of 4 in a puzzle duel.', 'duel.chain.4', 1);
  C('du4', 'battle', 'Puzzle Duels', 4, 'mechanic', 'Cascade', 'Make a chain of 6 in a puzzle duel.', 'duel.chain.6', 1);
  C('du5', 'battle', 'Puzzle Duels', 1, 'count', 'First Cast', 'Fire a skill in a puzzle duel.', 'duel.skill', 1);
  F('du6', 'battle', 'Puzzle Duels', 3, 'collect', 'Every Trick in the Book', 'Fire every tool\'s skill in a puzzle duel.', (L) => SKILL_TOOLS.filter((t) => L.get(`duel.skill.${t}`) >= 1).length, SKILL_TOOLS.length);
  C('du7', 'battle', 'Puzzle Duels', 3, 'mechanic', 'Clean Slate', 'Clear your side of a puzzle duel\'s board.', 'duel.allclear', 1);
  C('du8', 'battle', 'Puzzle Duels', 4, 'endure', 'Headspace', 'Win 25 puzzle duels.', 'duel.won', 25);
  C('du9', 'battle', 'Puzzle Duels', 3, 'mechanic', 'Lights Out', 'Win a puzzle duel against an aberrant Lantern Wisp with the Line short of its wall.', 'duel.secret.snuff', 1); // (its secret: ABERRANTS.md 3; the words never give it away; Espada's, 2026-10-28)
  // the second aberrant, the shiny ones and the learned skills (ABERRANTS.md 5, 8, 10; names and words placeholders, Espada's to word;
  // like du9, a secret's achievement names what you did, never how)
  C('du10', 'battle', 'Puzzle Duels', 3, 'mechanic', 'Come Apart', 'Win a puzzle duel against an aberrant slip jelly with the Line short of its wall.', 'duel.secret.dissolve', 1);
  C('du11', 'battle', 'Puzzle Duels', 3, 'mechanic', 'Shiny', 'Win a puzzle duel against a shiny aberrant.', 'duel.won.shiny', 1);
  F('du12', 'battle', 'Puzzle Duels', 2, 'collect', 'Quick Study', 'Learn a skill from an aberrant.', (L) => Object.keys(LEARNED).filter((id) => isLearned(id, L)).length, 1);
  F('du13', 'battle', 'Puzzle Duels', 4, 'collect', 'Every Lesson', 'Learn every skill the aberrants teach.', (L) => Object.keys(LEARNED).filter((id) => isLearned(id, L)).length, Object.keys(LEARNED).length);
}
