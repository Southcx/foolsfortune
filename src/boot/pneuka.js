// ---------------------------------------------------------------------------------------
// BOOT PNEUKA: the Pneuka Box and the windows round it. What the Courier carries (the ground's items, the Pneuka Box, the collection and
// the laid spread, with their windows), the folk's counters (the shops, the kiln's window), what they hear (the System's voice, the
// music, the ambience, Raku's haggling and the sounds events make), the Codex, the rules for which window is open, the pool and the marks
// of their Lachryma (the HUD ring, the release's crack, the hook's mark, the blob shadow, the tools' reach marks), the lent models,
// baubles and shells, the psygun's models and the map.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootPneuka(game, made) -> { codex, modalOpen, windowOpen, lachryma, baubles, shells }
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';
import { sfx } from '../audio/sfx.js';
import { LachrymaPool, Baubles } from '../courier/lachryma.js';
import { Shells } from '../tools/psygun/shells.js';
import { Cartography } from '../feedback/cartography.js';
import { Codex } from '../feedback/codex/codex.js';
import { PneukaBox } from '../pneuka/box.js';
import { IconWarm } from './iconwarm.js';
import { KilnUI } from '../courier/vessel/kilnui.js';
import { Shops } from '../progress/shop/shops.js';
import { ShopUI } from '../progress/shop/ui.js';
import { PneukaUI } from '../pneuka/ui.js';
import { Collection } from '../progress/collection.js';
import { LaidSpread } from '../progress/laidspread.js';
import { GroundItems } from '../pneuka/ground.js';
import { SystemVoice } from '../audio/voice/voice.js';
import { MusicPlayer } from '../music/player.js';
import { Clayese, hearHaggling } from '../npc/clayese.js';
import { hearEvents } from '../audio/cues.js';
import { Ambience } from '../audio/ambience.js';
import { Filigree, HURT } from '../vfx/filigree.js';
import { HudRing } from '../vfx/hudring.js';
import { ReleaseCrack } from '../vfx/releasecrack.js';
import { HookMark } from '../vfx/hookmark.js';
import { BlobShadow } from '../vfx/blobshadow.js';
import { ClassArtLooks } from '../vfx/classartlooks.js';
import { LockheartReach } from '../vfx/lockheartreach.js';
import { CarryThrowMark } from '../vfx/carrythrowmark.js';
import { LobArcMark } from '../vfx/lobarcmark.js'; // (the psygun variants' looks: OVERLAY.md 19)
import { FlareReveal } from '../vfx/flarereveal.js'; // (the psygun variants' looks: OVERLAY.md 19)
import { PEOPLE } from '../npc/people.js';
import { PairSpecials } from '../tools/pairspecials.js';
import { LentModels } from '../tools/lend.js';
import { PsygunModels } from '../vfx/psygunmodels.js';

export function bootPneuka(game, made) {
  const { mark, save, character, input, player } = made;
  const cursorFree = () => made.cursorFree(); // (the god hand's rule for a free cursor, made by bootGodHand a stage later: read when a window closes)
  // the Pneuka Box: what they carry (P), what lies on the ground, and the window; the Veritome is its bank (pneuka/)
  game.ground = new GroundItems(game);
  game.pneuka = new PneukaBox(game);
  game.iconWarm = new IconWarm(game); // (the Box's pictures made ahead in quiet frames: boot/iconwarm.js)
  game.collection = new Collection(game); // (the cards bound, kept in the Codex: progress/collection.js; the Veritome keeps none)
  game.laidSpread = new LaidSpread(game); // (the spread laid on the Box's underside, its four tallies the modifiers: progress/laidspread.js)
  game.belt.tick(); game.pneuka.seed(); game.pneuka.reconcile(); // (a new Courier: the Magician's pair worn, the made lures in the box; and two tools worn, never one twice)
  game.pneukaUI = new PneukaUI(game);
  game.pneukaUI.onClose = () => { if (input.enabled && !cursorFree()) input.requestLock(); };
  // the folk's counters (shop/: Raku's treasury and Old Grog's pier, opened from their talk)
  game.shops = new Shops(game);
  game.shopUI = new ShopUI(game);
  game.shopUI.onClose = () => { if (input.enabled && !cursorFree() && !game.dialogue?.open) input.requestLock(); };
  game.kilnUI = new KilnUI(game);
  game.kilnUI.onClose = () => { if (input.enabled && !cursorFree()) input.requestLock(); };
  // the System's voice: the few things that matter, said aloud (audio/voice/voice.js)
  game.voice = new SystemVoice(game);
  // the music: a theme where there is one (music/: the Dunes for now), under everything, paused for the rave
  game.music = new MusicPlayer(sfx, save);
  game.ambience = new Ambience(game); // (the weather and the hour heard where the Courier stands, and handed to the music: audio/ambience.js)
  hearHaggling(game, new Clayese(sfx), PEOPLE.find((p) => p.id === 'raku').voice); // (Raku's voice for the shop's bargaining: npc/clayese.js)
  hearEvents(game, sfx); // (the sounds events make: audio/cues.js)
  const codex = new Codex(game);
  game.codex = codex;
  codex.onClose = () => { if (input.enabled && !cursorFree()) input.requestLock(); };
  const modalOpen = () => !!(game.codex?.open || game.indexMenu?.open || game.cartography?.open || game.pneukaUI?.open || game.shopUI?.open || game.qais?.open || game.settingsWindow?.isOpen || game.hudLayout?.turnHeld); // (and the settings window; and the turn card: an action mode held upright on a phone, ui/turncard.js)
  // Any window or cover at all: a window that pauses, the kiln's, the dialogue box, a seam or the maw wipe under way, a crossing, a
  // reprogramming, the Opening. A window opens only when none is (or to close itself): one window at a time (SWEEPS group 2).
  const windowOpen = () => modalOpen() || !!(game.kilnUI?.open || game.dialogue?.open || game.seam?.busy || game.mawWipe?.active || game.aberrantWipe?.active || game.areaWipe?.active || game.emocean?.stage.active || game.reprogram?.open || game.lockheartCine?.active);
  // an Esc pressed while a window is open is that window's (it closes it): marked before any window's own handler runs (capture), so the
  // pointer's unlock it may bring is not read as you leaving (onLockChange: casebook 125)
  input.escSpends = () => modalOpen() || !!game.kilnUI?.open || !!game.dialogue?.open; // (marked by core/input.js's listener, the first registered)
  game.windowOpen = windowOpen; // (the chat line does not pause: the world goes on while you type, as in an MMO; the keys typed are the field's, input.js)
  const lachryma = new LachrymaPool({ max: T.lachryma.max, regenRate: T.lachryma.regenRate, regenDelay: T.lachryma.regenDelay });
  game.lachryma = lachryma;
  if (character.filigree) game.filigree = new Filigree(game, character.filigree); // (the armour's lines show the Lachryma in them)
  game.hudRing = new HudRing(game); // (their Lachryma and what has noticed them, on the ground at their feet)
  game.releaseCrack = new ReleaseCrack(game); // (a release cracks the vessel from inside: vessel.release, vfx/releasecrack.js)
  game.hookMark = new HookMark(game); // (the hook's mark: vfx/hookmark.js)
  game.blobShadow = new BlobShadow(game); // (the Courier's blob shadow straight down, beside the sun's: vfx/blobshadow.js)
  game.classArtLooks = new ClassArtLooks(game); // (the class arts drawn on the body and the ground: vfx/classartlooks.js)
  game.lockheartReach = new LockheartReach(game); game.carryThrowMark = new CarryThrowMark(game); game.lobArcMark = new LobArcMark(game); game.flareReveal = new FlareReveal(game); // (the hoover's reach on the ground; where a carried thing would land; the Bombardier's lob previewed, a flare's finds marked: vfx/lockheartreach.js, vfx/carrythrowmark.js, vfx/lobarcmark.js, vfx/flarereveal.js)
  // (a blow taken: they flinch, character.js; the hurting impulses are the filigree's list)
  game.events.on('courier.impulse', (e) => { if (HURT.has(e.why)) character.flinch(Math.min(1, (e.mag || 0) / 10), e.dir); });
  game.events.on('tool.lend', (e) => character.lend(e.tool, game.belt?.freeHand)); // (the sub's verb's body: anim/lendgesture.js)
  game.lentModels = new LentModels(game); // (and the tool at the hand where the verb needs it: tools/lend.js)
  game.pairSpecials = new PairSpecials(game); // (a pair's special: the sub's lent verb fed through the main's, tools/pairspecials.js)
  const baubles = new Baubles(game);
  game.baubles = baubles;
  const shells = new Shells(game);
  game.shells = shells;
  game.psygunModels = new PsygunModels(game); // (the psygun carried drawn as its variant: the Bombardier, the Carbine, the Pepperbox; vfx/psygunmodels.js)
  game.input = input;
  input.onSpend = (code) => { if (player.latches[code] > 0) player.latches[code] = 0; if (code === 'ShiftLeft' || code === 'ShiftRight') player.latches.Dodge = 0; }; // (a spent press is spent for the body too: core/input.js spend)
  game.cartography = new Cartography(game); // (before the hand: it reads the explored area)
  mark('techs+ui');
  return { codex, modalOpen, windowOpen, lachryma, baubles, shells };
}
