// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S TRAINING TARGETS' BODIES, by kind: the one table the runtime (world/strawmanwell/targets.js) makes a body from.
//   hopper     the target hopper (targets/hopper.js)
//   quintain   the quintain (targets/quintain.js)
//   duck       the gallery duck (targets/duck.js)
//
//   TARGET_BODIES[kind] -> a class (new it: a TargetBody, targets/kit.js)
// ---------------------------------------------------------------------------------------
import { TargetHopperBody } from './hopper.js';
import { QuintainBody } from './quintain.js';
import { GalleryDuckBody } from './duck.js';

export const TARGET_BODIES = { hopper: TargetHopperBody, quintain: QuintainBody, duck: GalleryDuckBody };
