// ---------------------------------------------------------------------------------------
// THE SEASON'S MATERIAL (docs/plans/GARDEN-COZY.md E3: "spring blossom, summer reed, autumn leaf, winter frost; each a material of a
// feeling's kind, for the press, the spore beds and a set's recipe. More things to press, not a new currency"): the first visit to the
// Spirit Garden of a game day finds the season's material waiting, one, of the season's kind (the briar cutting stays the prune's,
// any season). The ledger's record `garden.seasonGift.day` keeps which game day was last given, so a day gives once.
//
// Sized against the aim: one material of tier 0 or 1 is 1 to 2 minutes of play's worth (worthOf: 1 + tier), once a game day. A reason
// to look in each day, never a living (Animal Crossing's daily fruit and fossils).
//
//   SEASON_MATERIAL[season] = { kind, label }   game.gardenSeason = new GardenSeason(game)   events: garden.season.gift { season, kind, tier, by }
// ---------------------------------------------------------------------------------------
import { seasonOf } from './seasons.js';
import { today } from '../core/calendar.js';
import { makeMaterial } from './econ/materials.js';

/** Each season's material and the feeling's kind it is (realm.js KIND_OF: wonder arcane, mirth mechanism, desire edge, grief provision). */
export const SEASON_MATERIAL = {
  spring: { kind: 'arcane', label: 'spring blossom' },
  summer: { kind: 'mechanism', label: 'summer reed' },
  autumn: { kind: 'edge', label: 'autumn leaf' },
  winter: { kind: 'provision', label: 'winter frost' },
};

export class GardenSeason {
  constructor(game) {
    this.game = game;
    game.events?.on?.('garden.enter', (e) => { if ((e?.by ?? 'courier') === 'courier') this.give(); });
  }
  give() {
    const g = this.game, L = g.ledger, day = today(); if (!L) return;
    if ((L.best?.('garden.seasonGift.day') ?? -1) >= day) return;
    L.hi('garden.seasonGift.day', day);
    const season = seasonOf(day).id, S = SEASON_MATERIAL[season]; if (!S) return;
    const tier = (day * 2654435761 >>> 0) % 4 === 0 ? 1 : 0, seed = (day * 40503 + 7) >>> 0; // (one day in four a tier up: the same for everyone)
    g.pneuka?.add?.(`mat.${S.kind}`, 'season', 0, makeMaterial(S.kind, seed, tier));
    g.events?.emit('garden.season.gift', { season, kind: S.kind, label: S.label, tier, by: 'courier' });
  }
}
