// ---------------------------------------------------------------------------------------
// WHAT THE ACTION MODES SHOW ON GLASS: the cluster's faces and the strip's on foot, with a tool in hand and in a puzzle duel (docs/plans/
// MOBILE.md 8.5, 8.8, 8.9; the words Espada's, 8.3), read from the moment, read only. Each entry is a tile: its id the binding's touch
// control (core/bindings.js `touch`: the driver presses it through the live ctx), its face (a glyph `touch.<glyph>`, a word, a corner),
// and its state (lit, dim, a note pad's tint). The cluster (cluster.js) and the strip (strip.js) lay them out; nothing here moves.
//   ON FOOT       JUMP (the main), CROUCH, DASH, and the fourth by context: USE naming its thing, else PARRY once learned (the kick),
//                 else BLINK once learned. At the cluster's top edge, small: DRAW (STOW while the main is out), LEND (the sub's verb,
//                 SUB_GIFTS) and SWAP while a sub is worn, SKIFF at the Raceway and in the Dunes. The strip and the pair stand only on
//                 foot (the owner, 2026-10-26: riding, BLINK and the hook are not to be had).
//   A TOOL OUT    FIRE and AIM in the tool's own verbs and glyphs (FIRE / AIM, ATTACK / SPECIAL, CAST or REEL / SINK or GIVE LINE, THROW or
//                 REEL / PAY OUT, ATTACK / FLICK, PHOTO / LENS, PICK / DOWSE, TOLL / HIGH, HOOVER / OPEN), the third its own (SHELL, LOCK,
//                 PING, JUMP off the hook, REPROGRAM by a stunned mind, SURVEY), PARRY the fourth; the strip the tool's (the chambers and
//                 FAN, BREATH scoped; the Sondelass's forms; LURE and CRANK; PAINT or MOP; FLASH; the Crucibelle's five note pads, each in
//                 its note's colour, its number small), BLINK at its end once learned.
//   AT THE HELM   (the open sea's free helm, ctx `helm`: the stick is the rudder) FIRE (the ship's gun) and PARRY (the spit sent back)
//                 while a sea serpent hunts the hull, else USE naming MOOR or DOCK where F would; the throttle's two, each worded with
//                 the step it goes to (STOP .. FULL), dim at its end. The strip: BROADSIDE first (the side the camera looks over fires,
//                 its rim filling with that side's reload; dim while no side bears, the readier side's reload shown), FIX (the sky read,
//                 the Dreamvane worn) and PLATE (the Veritome worn), and USE while a serpent holds the cluster.
//   A PUZZLE DUEL END TURN (the main; dim on the foe's turn), FINISHER on a broken foe, FLEE, FORM (what you would become: HAND or
//                 COURIER); the strip the worn tools' moves (dim in the hand's form: they are the Courier's), ROTATE first while a piece
//                 is under the last touch in the hand's form.
// The tool's name small in FIRE's corner (8.3) is left out: at 72 px it lands on the glyph; the glyph is the tool's own.
//
// Prior art: Genshin Impact's attack and skill tiles changing with the character, Call of Duty Mobile's fire button by weapon, Into the
// Breach's strip of moves with END TURN the largest; the cluster's own reading of the skiff (cluster.js clusterContext).
//
//   footCluster(game) toolCluster(game, tool) duelCluster(game) helmCluster(game) -> [entry]   stripOf(game) -> [entry]   beltPairOf(game) -> [entry]
//   inHandCtx(game) -> 'psygun' | 'cutlass' | 'rod' | 'hook' | 'brush' | 'veritome' | 'dreamvane' | 'crucibelle' | 'lockheart' | null
//   entry { id, glyph, word, corner, lit, dim, tint, charge }   broadsideOf(game) -> { side, charge, bears }   ACTION_TILES (the words and glyphs by tool)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SUB_GIFTS } from '../../progress/toolpairs.js';
import { DEGREE_COLOR } from '../../tools/crucibelle/songs.js';
import { useLabel } from './cluster.js';
import { ROOM } from '../../world/opensea/opensea.js';
import { SEA_FIGHT } from '../../world/opensea/seafight.js';

/** By tool in hand: FIRE's and AIM's faces, the third (or null), and what the faces become in their other moment. */
export const ACTION_TILES = {
  psygun: { fire: ['psfire', 'FIRE'], aim: ['psaim', 'AIM'], third: { id: 'shell', glyph: 'shell', word: 'SHELL' } },
  cutlass: { fire: ['cuattack', 'ATTACK'], aim: ['cuspecial', 'SPECIAL'], third: { id: 'lock', glyph: 'lock', word: 'LOCK' } },
  rod: { fire: ['cast', 'CAST'], aim: ['sink', 'SINK'], fishOn: { fire: 'REEL', aim: 'GIVE LINE' }, third: { id: 'ro.ping', glyph: 'ping', word: 'PING' } },
  hook: { fire: ['throw', 'THROW'], aim: ['payout', 'PAY OUT'], reeling: 'REEL', third: { id: 'jump', glyph: 'jump', word: null } },
  brush: { fire: ['club', 'ATTACK'], aim: ['flick', 'FLICK'], third: { id: 'lock', glyph: 'lock', word: 'LOCK' } },
  veritome: { fire: ['photo', 'PHOTO'], aim: ['lens', 'LENS'], third: { id: 've.mind', glyph: 'mind', word: 'REPROGRAM' } },
  dreamvane: { fire: ['pick', 'PICK'], aim: ['dowse', 'DOWSE'], third: { id: 'dv.survey', glyph: 'survey', word: 'SURVEY' } },
  crucibelle: { fire: ['toll', 'TOLL'], aim: ['high', 'HIGH'], third: null },
  lockheart: { fire: ['hoover', 'HOOVER'], aim: ['open', 'OPEN'], third: null },
};
/** The duel's moves by the tool that brings them (progress/duel/couriertools.js), in the keys' order. */
const DUEL_MOVES = [
  ['psygun', 'du.shoot', 'psfire', 'SHOOT'], ['sondelass', 'du.grab', 'throw', 'GRAB'], ['dreamvane', 'du.drill', 'drill', 'DRILL'],
  ['soulbrush', 'du.paint', 'paint', 'PAINT'], ['crucibelle', 'du.delay', 'delay', 'DELAY'], ['lockheart', 'du.hold', 'hold', 'HOLD'],
  ['lockheart', 'du.send', 'send', 'SEND'],
];
const FORMS = [['so.cutlass', 'sofcutlass', 'cutlass'], ['so.rod', 'sofrod', 'rod'], ['so.hook', 'sofhook', 'hook']];

/** On foot (the bindings' ctx): the strip and the belt's pair stand only there (riding the Solar Skiff, LEND, DRAW and BLINK cannot be done). */
const onFoot = (g) => { const L = g.actions?.live?.(); return L ? L.has('foot') : !g.techs?.get?.('skiff')?.riding; };
const techs = (g) => g.techs || g.player?.techs;
const learned = (g, id) => { const t = techs(g)?.get?.(id); return !!t && (t.usable ? t.usable() : !!t.enabled); };
const E = (id, glyph, word = null, more = {}) => ({ id, glyph, word, ...more });

/** The ctx word of the tool in the hands (the bindings' `tool.<id>` without its prefix), or null. */
export function inHandCtx(g) {
  const t = g?.belt?.inHand; if (!t) return null;
  return t.id === 'sondelass' ? t.form || 'cutlass' : t.id === 'soulbrush' ? 'brush' : t.id;
}

/** On foot, nothing in the hands: JUMP, CROUCH, DASH, the fourth by context (USE, else PARRY, else BLINK); carrying, THROW and PUT DOWN. */
export function footCluster(g, use) {
  const C = g?.player?.techs?.get?.('carry') || g?.techs?.get?.('carry');
  if (g?.techs?.active?.id === 'push') return [E('use', null, 'PUSH'), E('jump', 'jump'), E('crouch', 'crouch', 'CROUCH')]; // (F held is the push: the chevron's USE is gone while it runs, and a tile swapped out lets go; the touch audit, 2026-10-25)
  if (C?.engaged) return [E('fire', 'throw', 'THROW'), E('use', null, 'PUT DOWN'), E('jump', 'jump'), E('crouch', 'crouch', 'CROUCH')]; // (a pot in both hands: the fire button throws it, F sets it down, courier/moves/carry.js; the owner's iPhone, v274)
  const fourth = use ? 'use' : learned(g, 'kick') ? E('parry', 'parry', 'PARRY') : learned(g, 'blink') ? E('blink', 'blink', 'BLINK') : null;
  return [E('jump', 'jump'), E('crouch', 'crouch', 'CROUCH'), E('dash', 'dash'), fourth];
}

/** A tool out: FIRE and AIM in its verbs, its third, PARRY the fourth. */
export function toolCluster(g, ctx) {
  const T = ACTION_TILES[ctx]; if (!T) return null;
  const tool = g.belt?.inHand, fire = E('fire', T.fire[0], T.fire[1]), aim = E('aim', T.aim[0], T.aim[1]);
  if (ctx === 'rod' && tool?.angler?.state === 'fight') { fire.word = T.fishOn.fire; aim.word = T.fishOn.aim; }
  if (ctx === 'hook' && tool?.hookshot?.reeling) fire.word = T.reeling;
  let third = T.third ? { ...T.third } : null;
  if (third?.id === 've.mind' && !g.reprogram?.target?.()) third = null; // (REPROGRAM: shown by a stunned mind)
  return [fire, aim, third, E('parry', 'parry', 'PARRY')];
}

/** A puzzle duel: END TURN, FINISHER on a broken foe, FLEE, FORM. */
export function duelCluster(g) {
  const D = g.duel, s = D?.state; if (!s) return [];
  const S = s.sides[0], broken = (s.sides[1]?.depth || 0) > 0, mine = !!D.mine;
  return [
    E('du.end', 'endturn', 'END TURN', { dim: !mine }),
    broken ? E('du.finish', 'finisher', 'FINISHER', { dim: !mine }) : null,
    E('du.flee', 'flee', 'FLEE', { dim: !mine }),
    S.form === 'hand' ? E('du.form', 'formcourier', 'COURIER', { dim: !mine }) : E('du.form', 'grab', 'HAND', { dim: !mine }),
  ];
}

/** The helm's throttle steps (helm.js THROTTLE's order), as the throttle tiles word them. */
const THROTTLE_WORDS = ['STOP', 'SLOW', 'CRUISE', 'FULL'];
const worn = (g, id) => g.belt?.main === id || g.belt?.sub === id;
const atHelm = (g) => { const L = g.actions?.live?.(); return L ? L.has('helm') : !!g.opensea?.sailing; };

/** What F does at the helm now (opensea.js sail: a quay within ROOM.quay, an islet within ROOM.moor), or null. */
export function helmUse(g) {
  const R = g.opensea, H = R?.helm; if (!H || !R.props) return null;
  for (const q of Object.values(R.props.quays || {})) if (Math.hypot(q.pos.x - H.pos.x, q.pos.z - H.pos.z) < ROOM.quay) return 'DOCK';
  return R.nearIslet?.(H.pos, ROOM.moor) ? 'MOOR' : null;
}

/** At the helm: FIRE and PARRY while a sea serpent hunts, else USE where F moors or docks; the throttle's two. */
export function helmCluster(g) {
  const H = g.opensea?.helm; if (!H) return [];
  const t = H.throttle | 0, use = helmUse(g);
  const up = E('throttle.up', 'throttleup', THROTTLE_WORDS[Math.min(3, t + 1)], { dim: t >= 3 }), down = E('throttle.down', 'throttledown', THROTTLE_WORDS[Math.max(0, t - 1)], { dim: t <= 0 });
  if (g.seaFight?.serpent) return [E('fire', 'psfire', 'FIRE'), E('parry', 'parry', 'PARRY'), up, down];
  return [use ? E('use', null, use) : null, up, down];
}

/** The broadside's side now (seafight.js `broadside`'s own test: the camera's look on port's normal, past SEA_FIGHT.broadside.beam), and
 *  its reload as a charge 0..1 (1 loaded); no side bearing, the readier side's, `bears` false. */
export function broadsideOf(g) {
  const F = g.seaFight, H = g.opensea?.helm, BS = SEA_FIGHT.broadside; if (!F?.reload || !H) return null;
  const d = g.camera?.getWorldDirection?.(_look), dot = d ? d.x * Math.cos(H.yaw) - d.z * Math.sin(H.yaw) : 0, bears = Math.abs(dot) >= BS.beam;
  const k = bears ? (dot > 0 ? 0 : 1) : F.reload[0] <= F.reload[1] ? 0 : 1;
  return { side: k ? 'starboard' : 'port', charge: Math.max(0, Math.min(1, 1 - F.reload[k] / BS.reload)), bears };
}
const _look = new THREE.Vector3();

/** The helm's strip: BROADSIDE, FIX with the Dreamvane worn, PLATE with the Veritome, USE while a serpent holds the cluster. */
function helmStrip(g) {
  const use = g.seaFight?.serpent ? helmUse(g) : null, B = broadsideOf(g);
  return [use ? E('use', null, use) : null, B ? E('broadside', 'broadside', 'BROADSIDE', { charge: B.charge, dim: !B.bears }) : null,
    worn(g, 'dreamvane') ? E('fix', 'fix', 'FIX') : null, worn(g, 'veritome') ? E('plate', 'photo', 'PLATE') : null].filter(Boolean);
}

/** DRAW (STOW while the main is out), LEND (the sub's verb) and SWAP (main and sub traded, Belt.swap) at the cluster's top edge, on foot;
 *  SKIFF (the top bar's, folded under MENU on a phone) where the board may be summoned: the Raceway or the Dunes. */
export function beltPairOf(g) {
  if (g.duel?.active || !onFoot(g)) return [];
  const B = g.belt, skiff = g.raceway?.active || g.dunes?.active ? E('skiff', 'skiff', 'SKIFF') : null;
  if (!B?.main) return skiff ? [skiff] : [];
  const out = !!B.inHand && B.inHand.id === B.main, gift = B.sub ? SUB_GIFTS[B.sub] : null;
  const use = out && g.interact?.cur ? useLabel(g) : null; // (a tool drawn: the cluster is the tool's, so F's thing is offered up here)
  return [
    use ? E('use', null, use.word) : null,
    skiff,
    B.sub ? E('swap', 'swap', 'SWAP') : null,
    gift ? E('lend', 'lend', gift.verb.toUpperCase()) : null,
    out ? E('tool', 'stow', 'STOW', { lit: true }) : E('tool', 'draw', 'DRAW'),
  ].filter(Boolean);
}

/** The strip over the cluster: the tool's own row, or the duel's moves. */
export function stripOf(g) {
  if (g.duel?.active) return duelStrip(g);
  if (atHelm(g)) return helmStrip(g);
  if (!onFoot(g)) return [];
  const ctx = inHandCtx(g);
  if (!ctx) return learned(g, 'blink') && (learned(g, 'kick') || g.interact?.cur) ? [E('blink', 'blink', 'BLINK')] : []; // (nothing in hand: the cluster's fourth is USE or PARRY first, so BLINK stands here)
  const out = [], tool = g.belt.inHand;
  if (ctx === 'psygun') {
    const S = g.shells, n = S?.gun?.chambers ?? S?.chambers?.length ?? 0;
    for (let i = 0; i < Math.min(7, n); i++) out.push(E(`ps.ch${i + 1}`, 'chamber', String(i + 1), { lit: S.selected === i }));
    out.push(E('ps.fan', 'fan', 'FAN'));
    if (g.weapon?.play?.scoped) out.push(E('ps.breath', 'breath', 'BREATH'));
  } else if (ctx === 'cutlass' || ctx === 'rod' || ctx === 'hook') {
    for (const [id, glyph, form] of FORMS) out.push(E(id, glyph, null, { lit: form === ctx }));
    if (ctx === 'rod') out.push(E('ro.lure', 'lure', 'LURE'), E('ro.crank', 'crank', 'CRANK'));
  } else if (ctx === 'brush') {
    const mode = (tool?.load || tool?.tech?.load)?.mode || 'paint';
    out.push(mode === 'paint' ? E('br.mop', 'brmop', 'MOP') : E('br.paint', 'paint', 'PAINT')); // (one tile, its two faces: the one it goes to)
  } else if (ctx === 'veritome') out.push(E('ve.flash', 'flash', 'FLASH'));
  else if (ctx === 'crucibelle') for (let i = 0; i < 5; i++) out.push(E(`cr.n${i + 1}`, null, null, { corner: String(i + 1), tint: DEGREE_COLOR[i], pad: true }));
  if (ctx !== 'hook') out.push(E('jump', 'jump'), E('crouch', 'crouch')); // (a tool drawn keeps the core movement's two: a ladder's kick-off, a hang's drop, a slide; the hook's third is JUMP)
  if (learned(g, 'blink')) out.push(E('blink', 'blink', 'BLINK'));
  return out;
}

function duelStrip(g) {
  const D = g.duel, s = D.state; if (!s) return [];
  const S = s.sides[0], worn = S.tools ? new Set(S.tools) : null, hand = S.form === 'hand', out = [];
  const cell = D.hover, piece = hand && cell ? s.board?.at?.(cell.x, cell.y) : null;
  if (piece && piece.kind !== 'body') out.push(E('du.rotate', 'rotate', 'ROTATE', { dim: !D.mine }));
  for (const [tool, id, glyph, word] of DUEL_MOVES) if (!worn || worn.has(tool)) out.push(E(id, glyph, word, { dim: hand || !D.mine }));
  return out;
}
