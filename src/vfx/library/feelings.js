// ---------------------------------------------------------------------------------------
// THE SEVEN FEELINGS' EFFECTS, GATHERED (docs/plans/art/VFX-LIBRARY.md section 3): a feeling is a SKIN, its palette (its shape ramp by
// name, anchored on progress/weather.js COLOR), its paint motif as the shape layer's pattern (Wonder frost, Mirth dots, Desire ripples,
// Fury cracks, Gall curds, Grief streaks, Dread marbling: vfx/shapes/textures.js MOTIF) and its motion character, so the seven differ in
// how they move as much as in their colour. One module a feeling beside this one (vfx/library/feelings/<feeling>.js), merged here into
// one table for the library (vfx/library.js), each effect in three tiers (PRIMARY, SECONDARY, TERTIARY: vfx/library/kitdemo.js):
//
//   feeling.<f>.burst    an impact, about 0.8 real s (its tertiary may stay longer: Wonder's dust, Grief's mist)
//   feeling.<f>.splash   a liquid of it spilt on the ground
//   feeling.<f>.aura     held round a body, calm enough to stand beside play (h.stop() eases it out)
//   feeling.<f>.trail    held on a moving thing (follow it: h.pos), what it sheds left behind
//   feeling.<f>.rise     an awakening's surge round the Courier, the biggest, about 3 real s (vfx/awakeninglook.js: the flood's secondary
//                        and tertiary, never a second flood)
//   feeling.<f>.drink    drawn into the Courier from round them, about 0.8 real s, played at the chest (vfx/feelinglooks.js)
//   shell.<f>.land       a Feelings caster shell's landing (TYPE-81 to 87, vfx/shelllooks.js), its feeling's burst and what it holds
//
// Each names its feeling's ramp and pattern itself (a shell's landing carries no `feeling` in its context), so one played anywhere is
// that feeling's. Every shape has soft edges, scrolls what lives past a fifth of a second, erodes through its pattern and cools down its
// ramp; every impact opens on a hot core about a tenth of a second long (vfx/library/feelings/kit.js); only the rise has a lamp and a
// soft wash (Fury's burst and rise a short shake), inside the budgets (vfx/vfx.js BUDGETS).
//
// Prior art (a museum label): Chrono Cross (Square, 1999), six colours in three opposed pairs, a character's innate colour read off
// its swing trail; Shintaro Takai (VFX director, Final Fantasy VII Remake; CGWorld, 2018) on Cure: energy gathered, made visible,
// absorbed into the body, then glowing (the drink); Riot's League of Legends VFX style guide (2017): a feeling's skin is a tertiary read,
// colouring and moving every layer without blurring the hero's silhouette; each feeling's module names its own (docs/ref/VFX-PRIOR-ART.md
// 1.1, 1.18, 2.1, 3.2).
//
//   FEELING_EFFECTS   (every `feeling.<f>.<moment>` and `shell.<f>.land`, for vfx/library.js)
// ---------------------------------------------------------------------------------------
import { WONDER_EFFECTS } from './feelings/wonder.js';
import { MIRTH_EFFECTS } from './feelings/mirth.js';
import { DESIRE_EFFECTS } from './feelings/desire.js';
import { FURY_EFFECTS } from './feelings/fury.js';
import { GALL_EFFECTS } from './feelings/gall.js';
import { GRIEF_EFFECTS } from './feelings/grief.js';
import { DREAD_EFFECTS } from './feelings/dread.js';

export const FEELING_EFFECTS = { ...WONDER_EFFECTS, ...MIRTH_EFFECTS, ...DESIRE_EFFECTS, ...FURY_EFFECTS, ...GALL_EFFECTS, ...GRIEF_EFFECTS, ...DREAD_EFFECTS };
