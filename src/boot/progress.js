// ---------------------------------------------------------------------------------------
// BOOT PROGRESS: the systems of progress beyond the ledger: the economy's commands, the seven domains' experience, the bracelet and how
// it is worn, the voyage, the Spirit Garden with its beds, the World Mushroom, the keepsakes and the mycelium, Soul Alchemy, the weather
// and the Courier's mind, the stones' re-rolls and the palm die, the World shells found, the god hand's poses, knacks, goals, harmony,
// decor, the spirits' lives, the feelings and their awakenings, the lend panel and the ostraca; the stones set the pool's terms; the
// daylight; the macros, the flash and the reprogramming; the log's typing sent to the chat line.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   bootProgress(game, made) -> nothing
// ---------------------------------------------------------------------------------------
import { CourierMind } from '../courier/mind.js';
import { PalmDie, Rerolls } from '../progress/dice.js';
import { WorldShellFinds } from '../progress/combat/worldshells.js';
import { HandPose } from '../progress/mudras.js';
import { installBracelets } from '../vfx/braceletwear.js';
import { Daylight } from '../render/daylight.js';
import { Flash } from '../tools/veritome/flash.js';
import { Reprogram } from '../tools/veritome/reprogram.js';
import { FinishPlate } from '../tools/veritome/finishplate.js';
import { installEconomy } from '../progress/econ/economy.js';
import { installPsyche } from '../progress/psyche.js';
import { Bracelet } from '../progress/bracelet.js';
import { Voyage } from '../progress/voyage.js';
import { Garden } from '../progress/garden.js';
import { SporeBeds } from '../progress/sporebeds.js';
import { itemOf } from '../pneuka/items.js';
import { Myggdrasil } from '../progress/myggdrasil.js';
import { Keepsakes } from '../progress/keepsakes.js';
import { GardenMycelium } from '../world/garden/mycelium.js';
import { renderGrimoire } from '../feedback/codex/grimoire.js';
import { SoulAlchemy } from '../progress/alchemy.js';
import { Knacks } from '../progress/knacks.js';
import { Goals } from '../progress/goals.js';
import { Quests } from '../progress/quests.js';
import { Recap } from '../progress/recap.js';
import { Aptitude } from '../progress/aptitude.js';
import { ClassArts } from '../progress/classarts.js';
import { AreaChecklist } from '../progress/areachecklist.js';
import { ArcanaWays } from '../progress/arcanaways.js';
import { GardenSeason } from '../progress/gardenseason.js';
import { FirstToday } from '../progress/firsttoday.js';
import { FoeSeen } from '../progress/foeseen.js';
import { AberrantDrops } from '../progress/duel/drops.js';
import { gardenBackdropOf } from '../progress/gardenbackdrop.js';
import { Harmony } from '../progress/harmony.js';
import { Decor } from '../progress/decor.js';
import { SpiritLife } from '../progress/spiritlife.js';
import { Feelings } from '../progress/feelings.js';
import { Vantages } from '../world/vantages.js';
import { VantageFrames } from '../vfx/vantageframes.js';
import { Awakening } from '../feedback/awakening.js';
import { Lend } from '../progress/lend.js';
import { Ostraca } from '../world/ostraca.js';
import { Weather, phaseAt } from '../progress/weather.js';
import { modifier as stoneModifier } from '../progress/stones.js';
import { MacroBook } from '../tools/veritome/mind/macros.js';
import { PneukaJarLook } from '../vfx/pneukajar/look.js';

export function bootProgress(game, made) {
  const { events } = made;
  installEconomy(game); // (/grant, for the DEBUG profile)
  installPsyche(game); // (the seven domains' EXP, earned in every layer: progress/psyche.js)
  game.bracelet = new Bracelet(game); // (the ring's sockets and charms: progress/bracelet.js; BRACELET.md)
  game.bracelets = installBracelets(game); // (the bracelet, working name: worn at the hand's wrist, the Pneuka Jar's neck, the Courier's left wrist; driven from the bus: vfx/braceletwear.js)
  game.pneukaJarLook = new PneukaJarLook(game); // (the Pneuka Jar fired in the vessel's looks, and its own lid, handles, shape, foot, pendant and hop's burst: vfx/pneukajar/look.js)
  game.voyage = new Voyage(game); // (the Emocean hop's systems: the hold, the crossing, the reckoning: progress/voyage.js)
  game.garden = new Garden(game); // (the Spirit Garden: the dividend's slots, the beds, the long sink: progress/garden.js)
  game.sporeBeds = new SporeBeds(game, { itemOf }); // (the mycelium's beds: progress/sporebeds.js, docs/plans/MYCELIUM.md)
  game.myggdrasil = new Myggdrasil(game); // (the World Mushroom on its own planetoid: progress/myggdrasil.js)
  game.keepsakes = new Keepsakes(game); // (a spirit let go, fired into a pot that stays: progress/keepsakes.js)
  game.codexPages = { ...(game.codexPages || {}), grimoire: renderGrimoire }; // (the Grimoire of Echoes, the Codex's page of the mycelium: its tab is codex.js's)
  if (game.realm) game.gardenMycelium = new GardenMycelium(game.realm); // (the mycelium in the Inner Realm: Myggdrasil's planetoid, the spore beds, the pots: world/garden/mycelium.js)
  game.alchemy = new SoulAlchemy(game); // (the spirit press: the soul colour, the attributes: progress/alchemy.js)
  game.weather = new Weather(game); // (emotional weather and the day: progress/weather.js)
  game.courierMind = new CourierMind(game); // (your mental state and your draught, kept: courier/mind.js; the garden's rain reads it)
  game.rerolls = new Rerolls(game); // (Luck's re-rolls a game day, spent by your own failed throws: progress/dice.js)
  game.palmDie = new PalmDie(game); // (the Pneuka stones in the god hand's form: overflow past the Lockheart condensed into cubes, progress/dice.js)
  game.worldShellFinds = new WorldShellFinds(game); // (a World shell for every twelfth full-grown blot mopped up: progress/combat/worldshells.js)
  game.handPose = new HandPose(game); // (the god hand's mudras: which pose, and when; a look only, progress/mudras.js)
  game.knacks = new Knacks(game); // (the assists earned, switched on or off: progress/knacks.js; the Crib Sheet first)
  game.gardenSeason = new GardenSeason(game); // (the season's material, once a game day in the garden: progress/gardenseason.js)
  game.arcanaWays = new ArcanaWays(game); // (a Major bound by its meaning done: progress/arcanaways.js, SPREADS.md 5.6)
  game.areaChecklist = new AreaChecklist(game); // (each Dunes area's checklist measured into the ledger: progress/areachecklist.js)
  game.classArts = new ClassArts(game); // (a class's two arts, opened by playing as it: progress/classarts.js, CLASS-ARTS.md)
  game.aptitude = new Aptitude(game); // (the Assay's passive readings: progress/aptitude.js, APTITUDE.md)
  game.goals = new Goals(game); // (the game day's three goals, from the achievements: progress/goals.js)
  game.quests = new Quests(game); game.recap = new Recap(game); // (someone's trouble fixed in steps, and what you were doing: progress/quests.js, progress/recap.js)
  game.firstToday = new FirstToday(game); // (the first of each module a game day pays a little: progress/firsttoday.js)
  game.gardenBackdrop = () => gardenBackdropOf(game); // (your Spirit Garden as your half of a duel's backdrop: progress/gardenbackdrop.js, the view's to draw)
  game.foeSeen = new FoeSeen(game); // (the aberrants' foe skills you have seen, knowledge: the duel's badge tooltips, progress/foeseen.js)
  game.aberrantDrops = new AberrantDrops(game); // (what a won duel against an aberrant leaves: Soul Alchemy materials, progress/duel/drops.js)
  game.harmony = new Harmony(game); // (how calm or overgrown each planetoid of the Spirit Garden is: progress/harmony.js, GARDEN-COZY.md A)
  game.decor = new Decor(game); // (the garden's pieces: the catalogue, the shed's storage and the rating: progress/decor.js, GARDEN-COZY.md D)
  game.spiritLife = new SpiritLife(game); // (the spirits' routines, their wishes and the morning's digest: progress/spiritlife.js, GARDEN-COZY.md C)
  game.feelings = new Feelings(game); // (the seven feelings' awakenings: progress/feelings.js, FEELINGS-AWAKENING.md)
  game.vantages = new Vantages(game); game.vantageFrames = new VantageFrames(game); game.awakening = new Awakening(game); // (Wonder's lookouts: world/vantages.js; the awakening's glitch and the body's wait: feedback/awakening.js)
  game.lend = new Lend(game); // (the lend panel: what DEBUG unlocks without the ledger, a category at a time: progress/lend.js, DEBUG-MODE.md)
  game.ostraca = new Ostraca(game); // (the inscribed sherds and the stelae: world/ostraca.js)
  { // the stones set the pool's terms (progress/stones.js): fired at the kiln, and by day or night (moonstone)
    const setStones = () => game.lachryma?.addModifier('stones', stoneModifier(game.vessel?.look?.stones, { night: phaseAt() === 'night' }));
    game.lachryma?.addModifier('willpower', { get maxMult() { return game.alchemy?.widen?.('willpower.shield') ?? 1; } }); // (Willpower widens the pool, read live: SOUL-ALCHEMY.md 6)
    for (const e of ['title.enter', 'vessel.fire', 'day.phase']) events.on(e, setStones);
    setStones();
  }
  game.daylight = new Daylight(game); // (the light on the open ground by the hour and the weather: render/daylight.js)
  game.macros = new MacroBook(game); // (what they have composed for minds: tools/veritome/mind/macros.js, the Codex's VERITOME, THE MIND)
  game.flash = new Flash(game); // (the Veritome's flash: 1 with the book out; it dazzles and stuns: tools/veritome/flash.js)
  game.reprogram = new Reprogram(game); // (a stunned mind, opened with the middle button and rewritten: tools/veritome/reprogram.js)
  game.finishPlate = new FinishPlate(game); // (a photo finish at the Raceway kept as a plate in the Veritome's memory: tools/veritome/finishplate.js)
  game.log.onSend = (t) => game.chat.run(t);
}
