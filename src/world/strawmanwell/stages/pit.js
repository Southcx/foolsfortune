// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE PIT (docs/plans/STRAWMANS-WELL.md 3.12): a stub, a floor and a goal, until its builder lays the stage.
//
//   default export: a stage module (stagemods.js's contract)
// ---------------------------------------------------------------------------------------
import { scaffold, floor, goalFlag, sign } from '../stages.js';

export default {
  id: 'pit',
  build(well, S) {
    const len = S.lane.len;
    scaffold(S, len); floor(S, -1, len + 1);
    goalFlag(S, len - 6, 0); sign(S, 'THE PIT', 8, 4, 'being built');
    return { goal: [len - 6, 0], door: [len - 3, 0], checks: [[2, 0]] };
  },
};
