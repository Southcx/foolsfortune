// ---------------------------------------------------------------------------------------
// GRAIN'S ACHIEVEMENTS (docs/plans/TEMPERAMENT.md; GAPS G292): a mind cracked by its weakness, a status landed on the one its grain's
// strongest trait opens it to (creatures.js marks it `weak` on creature.status; tracking/creaturestatus.js counts `mind.cracked`), in
// the Five Forces' sub beside the statuses. Words plain, Espada's to rule.
//
// Prior art: Pokemon's natures read off a creature and played to, Monster Hunter's weakness learned by hitting it, Persona's "1 More"
// (a weakness struck is its own reward, and counted).
//
//   grainAchievements({ C, F })   (moduleachievements.js calls it)
// ---------------------------------------------------------------------------------------
const STATUSES = ['stun', 'doubt', 'charm', 'blind', 'confusion']; // (the five a damage type builds, each opened by one trait: temperament.js TRAITS)

export function grainAchievements({ C, F }) {
  C('ff7', 'battle', 'The Five Forces', 2, 'mechanic', 'Where It Gives', 'Land a status on a creature its own nature leaves it open to.', 'mind.cracked', 1);
  F('ff8', 'battle', 'The Five Forces', 4, 'collect', 'Every Grain Read', 'Crack a mind by its weakness with each of the five statuses.',
    (L) => STATUSES.filter((k) => L.get(`mind.cracked.${k}`) > 0).length, STATUSES.length);
}
