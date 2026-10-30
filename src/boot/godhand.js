// ---------------------------------------------------------------------------------------
// BOOT GOD HAND: the god hand, the island's matter it moves and the creations it raises, the rejection, the Inner Realm (the Spirit
// Garden) with the looks of the Box's reading view and the garden's mood; the rule for when the cursor is free; the lock-on, the interact
// chevron, the cradles and the Sight.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootGodHand(game, made) -> { god, cursorFree }
// ---------------------------------------------------------------------------------------
import { Scanner } from '../world/scanner.js';
import { GodMode } from '../godhand/godhand.js';
import { Rejection } from '../godhand/rejection.js';
import { Creations } from '../godhand/creations.js';
import { IslandMatter } from '../godhand/islandmatter.js';
import { Interact } from '../courier/interact.js';
import { LockOn } from '../courier/lockon.js';
import { GardenMood } from '../vfx/garden/gardenmood.js';
import { GuestJars } from '../vfx/garden/guestjars.js';
import { LaunchLotuses } from '../vfx/garden/launchlotus.js';
import { FacilityLooks } from '../vfx/garden/facilitylooks.js';
import { SlabLook } from '../vfx/garden/slablook.js';
import { RareSpirits } from '../vfx/garden/rarespirits.js';
import { BenchWindowLook } from '../ui/benchlook.js';
import { ScanMoment } from '../ui/scanmoment.js';
import { CodeCard } from '../ui/combcode.js';
import { CelestialTargets } from '../vfx/celestialtargets.js';
import { ReadingTable } from '../ui/readingtable.js';
import { dangerPips } from '../ui/dangerpips.js';
import { ReadingView } from '../vfx/readingview.js';
import { installUndersideLook } from '../ui/undersidelook.js';
import { Realm } from '../world/garden/realm.js';
import { ReadingScene } from '../render/readingscene.js';
import { DuelInstance } from '../render/duelinstance.js';
import { Cradles } from '../world/cradles.js';
import { Sight } from '../progress/sight.js';

export function bootGodHand(game, made) {
  const { mark, renderer, handG, jarG, input, modalOpen } = made;
  const god = new GodMode(game, renderer, handG, jarG);
  delete made.handG; delete made.jarG; // (the parsed hand and jar are the god hand's now: not kept in `made`, which lives as long as the page)
  mark('god');
  game.god = god;
  game.matter = new IslandMatter(game); // (the island's matter the hand moves: godhand/islandmatter.js; GODHAND.md 3)
  game.creations = new Creations(game); // (the hand's voxel creations: godhand/creations.js; GODHAND.md 7)
  game.rejection = new Rejection(game); // (the island's immune response to the hand: godhand/rejection.js; GODHAND.md 10)
  game.realm = new Realm(game, { god }); // (the Spirit Garden entered at a Shrine: the Jar on its planetoids, the hand over it: world/garden/realm.js)
  game.scanner = new Scanner(game); // (a real barcode or QR code read into a material or a spirit slab: /scan, the plate shrine; world/scanner.js)
  game.readingTable = new ReadingTable(game); // (the Pneuka Box's loadout as a two-card reading: Dovina's window mounts .el and calls draw(state), ui/readingtable.js)
  game.dangerPips = dangerPips; // (a Well's danger mark, its FOE's class as pips: the Index's row puts dangerPips(cls) after its key tag, ui/dangerpips.js)
  game.readingView = new ReadingView(game); // (the Box flipped: the laid Majors orbiting the Courier, the cloth under their feet, the hand; its scene, game.readingScene, sets .group and calls update(dt): vfx/readingview.js)
  installUndersideLook(); // (the Box's underside dressed: Dovina's pneuka/underside.js classes, ui/undersidelook.js)
  game.duelInstance = new DuelInstance(game); // (a puzzle duel drawn alone, its actors and nothing of the world: render/duelinstance.js)
  game.readingScene = new ReadingScene(game); // (the dark the reading view is drawn in while the Box is turned over: render/readingscene.js)
  game.celestialTargets = new CelestialTargets(game); // (Celestial mode's targets drawn over the paper: the brush hands its list each frame, vfx/celestialtargets.js)
  game.guestJars = new GuestJars(game); // (a guest visiting your garden as their own Pneuka Jar in their glazes; Petra's runtime calls show: vfx/garden/guestjars.js)
  game.gardenMood = new GardenMood(game); // (the Inner Realm's one mood: the hour, the season and the briar every garden look reads: vfx/garden/gardenmood.js)
  game.launchLotuses = new LaunchLotuses(game); // (the launch lotuses drawn as giant lotuses and their pollen arcs, dressed on garden.enter: vfx/garden/launchlotus.js)
  game.facilityLooks = new FacilityLooks(game); // (the garden's fixed places dressed to read by their silhouettes: vfx/garden/facilitylooks.js)
  game.slabLook = new SlabLook(game); game.rareSpirits = new RareSpirits(game); game.benchLook = new BenchWindowLook(game); // (carving a slab at the bench, drawn over its stand-ins; a flawless dig's spirit inverted; the bench's window dressed: vfx/garden/slablook.js, rarespirits.js, ui/benchlook.js)
  game.scanMoment = new ScanMoment(game); game.codeCard = new CodeCard(game); // (scanning a code's moment; our own codes as a QR code in the Comb's dress: ui/scanmoment.js, ui/combcode.js)
  const cursorFree = () => !!(god.active || game.realm?.active || game.duel?.active || game.trackEditor?.active || game.haunt?.on); // (the hand's cursor is the pointer: no lock taken, no pause on its loss)
  game.cursorFree = cursorFree; // (a finger is the cursor there: core/touchdriver.js)
  input.wantLock = () => !cursorFree() && !modalOpen() && !game.kilnUI?.open && !game.dialogue?.open && !game.pneukaUI?.open && !game.shopUI?.open && !game.qais?.open; // (a refused lock is retried only if the game still wants one: core/input.js)
  game.lock = new LockOn(game); // (Z-targeting: the camera and the blade hold one thing)
  // what the chevron points at: anything F would act on from here
  game.interact = new Interact(game);
  game.cradles = new Cradles(game); // (the Pneuka Jar as a seal: F at a cradle seals you in, world/cradles.js, docs/plans/HANKO.md)
  game.sight = new Sight(game); // (the Sight's waypoint: Jack Sparrow's compass, progress/sight.js; the needle is Calissa's; /sight is added with the chat line)
  return { god, cursorFree };
}
