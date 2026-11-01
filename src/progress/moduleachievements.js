// ---------------------------------------------------------------------------------------
// THE NEWER MODULES' ACHIEVEMENTS: one call for the builders that each module keeps beside its rules (the god hand's puzzles and
// Sandbox, Strawman's Well, the Veritome's fieldcraft, the domains' rungs), so achievements.js stays one module of one job (ARCHITECTURE.md: under 800
// lines). Each builder is predicates over the ledger, as every achievement is (CLAUDE.md).
//
//   moduleAchievements({ C, H, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { mimicryAchievements } from './mimicryachievements.js';
import { sandboxAchievements } from './sandboxachievements.js';
import { strawmanWellAchievements } from './strawmanwellachievements.js';
import { stealthAchievements } from './stealthachievements.js';
import { cookingAchievements } from './cookingachievements.js';
import { countAchievements } from './countachievements.js';
import { domainArtAchievements } from './domainartachievements.js';

export function moduleAchievements({ C, H, F }) {
  mimicryAchievements({ C, F }); sandboxAchievements({ C, H }); strawmanWellAchievements({ C, H, F }); stealthAchievements({ C, H, F }); cookingAchievements({ C, H, F }); countAchievements({ C, F }); domainArtAchievements({ F });
}
