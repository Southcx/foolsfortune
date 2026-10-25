// ---------------------------------------------------------------------------------------
// BOOT SERVICES: the physics world, the effects, the HUD, the maker's pixel art and the events bus; then `game` itself, with the ledger,
// the listener's distance and the breaks, repairs and blasts the props report and the clapperjars' falls; then its first services (zones,
// time, the log, the glow with the overlay's scene and the screen passes of the glitch, the storm warp and the Umbral, the puzzle duel's
// view, the Dunemaw's looks, the hide-UI key, glyphs, the creatures' AI, the signatures, the cinema, the portrait, the pulse) and the
// breakables.
//
// Prior art: the staged start of an engine (Unreal's FEngineLoop::PreInit then Init, Unity's Awake then Start): one function a stage, run
// in order by main.js, each handed `made`, what the stages before it made, and returning what the stages after it read.
//
//   await bootServices(made) -> { physics, fx, hud, stats, events, game, breakables }
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';
import { Physics } from '../core/physics.js';
import { FX } from '../vfx/particles.js';
import { Breakables } from '../world/props/breakables.js';
import { Hud } from '../feedback/hud.js';
import { Events } from '../core/events.js';
import { GameLog } from '../feedback/gamelog.js';
import { Stats } from '../progress/stats.js';
import { TimeScale } from '../core/time.js';
import { Glitch } from '../vfx/glitch.js';
import { StormWarp } from '../vfx/stormwarp.js';
import { Umbral } from '../vfx/umbral.js';
import { DataDrain } from '../vfx/datadrain.js';
import { dunemawMood } from '../vfx/dunemawkit.js';
import { Flythrough } from '../cine/flythrough.js';
import { WellDress } from '../vfx/welldress.js';
import { HideUI } from '../feedback/hideui.js';
import { Glyphs } from '../vfx/glyphs.js';
import { Cinema } from '../vfx/cinema.js';
import { Portrait } from '../vfx/portrait.js';
import { PsychicPulse } from '../vfx/pulse.js';
import { AI } from '../creatures/ai/index.js';
import { reseed, sessionSeed } from '../core/rng.js';
import { DuelView } from '../vfx/duelview.js';
import { Zones } from '../render/zones.js';
import { Areas } from '../render/areas.js';
import { theme } from '../ui/theme.js';
import { px, PX_CSS } from '../ui/pixel.js';
import { Glow } from '../render/glow.js';
import { Signatures, standardSignatures } from '../core/signatures.js';
import { typeOf } from '../progress/combat/types.js';
import { OverlayScene } from '../render/overlayscene.js';

export async function bootServices(made) {
  const { mark, save, cloud, renderer, scene, camera } = made;
  const physics = new Physics();
  await physics.init();
  mark('physics');
  const fx = new FX(scene);
  fx.pixelRatio = renderer.getPixelRatio();
  const hud = new Hud();
  // the maker's pixel art (ui/pixel.js): drawn at 1x, recoloured, scaled by a whole number: the gloves, the Lachrimeter, the windows' buttons
  { const st = document.createElement('style'); st.textContent = PX_CSS; document.head.appendChild(st); }
  await px.load();
  theme.pixelGloves(px);

  const stats = { broken: 0, total: 0 };
  const events = new Events();
  const game = {
    scene, physics, fx, hud, camera, renderer, stats, events, save, cloud,
    reseed, get seed() { return sessionSeed(); }, // (the simulation's chance: core/rng.js; the stress test and replays set it)
    ledger: new Stats(save), // (the quiet ledger: everything counted; see stats.js; kept in the save's player scope)
    listenerDistance: (p) => camera.position.distanceTo(p),
    onBroken(ent, cause, by = 'courier') {
      if (ent.def?.proxy) return; // (the clay of a clapperjar cut into chunks: it has already been counted as the clapper)
      events.emit('prop.break', { kind: ent.kind, target: !!ent.def.target, cause, by, ...(ent.def.training ? { training: true } : {}) });
      if (ent.def.training) return; // (the Throwing Room's: it measures, it never counts: world/testroom/)
      if (ent.def.trial) { game.trial?.onTarget(ent); return; }
      if (ent.def.target) return;
      stats.broken++;
      if (stats.broken === stats.total) events.emit('room.cleared', { total: stats.total });
    },
    onClapper(c, cause = 'shot') {
      stats.clappers = (stats.clappers || 0) + 1;
      const by = cause === 'dismiss' ? 'environment' : 'courier';
      events.emit('clapper.down', { cause, ally: !!c.ally, raider: !!(c.raider || c.wasRaider), by });
      // (a clapperjar dies outside creatures.strike, in one blow: the same event, for familiarity's count of downs)
      events.emit('creature.struck', { kind: 'clapper', dmg: 1, hp: 0, maxHp: 1, kill: true, type: typeOf(cause), k: 1, by });
    },
    onRepaired() {
      stats.total++;
    },
    onExplosion(center, R) {
      game.god?.explosion(center, R);
      game.ai?.stimuli.emit('noise', center, { radius: 18 + R * 6, strength: 1.5, by: 'courier' }); // (a blast is heard far off: creatures/ai/stimuli.js)
      game.ai?.stimuli.emit('light', center, { radius: 10 + R * 3, strength: 1, by: 'courier' });
      if (game.god?.active) return; // (the Courier is a jar just now)
      const { player } = made; // (the Courier, made a stage later by bootCourier: read when the blast is heard)
      const pc = player.pos.clone(); pc.y += 0.9;
      const d = pc.distanceTo(center);
      const reach = R * 1.3;
      if (d < reach) {
        const dir = pc.sub(center).normalize();
        const k = T.explosion.playerKnock * (1 - d / reach);
        player.impulse(dir.multiplyScalar(k).setY(dir.y * k + k * 0.5), 'explosion');
        player.grounded = false;
      }
      player.shake = Math.max(player.shake, T.explosion.shake * Math.max(0, 1 - d / (R * 3.5)));
    },
  };

  game.zones = new Zones(game); // (only the place you are in, and what can be seen from it, is drawn: render/zones.js)
  // (and only the area you are in, or beside, is held on the GPU: render/areas.js; the garden, a Well's floors and the crossing build on entry already)
  game.areas = new Areas(game)
    .register('workshop', { zones: ['workshop'], near: ['basement', 'testroom'] }).register('testroom', { zones: ['testroom'], near: ['workshop'] })
    .register('basement', { zones: ['basement'], near: ['workshop', 'testroom'] }).register('circuits', { zones: ['circuits'] })
    .register('dunes', { zones: ['dunes', 'beach'] }).register('raceway', { zones: ['raceway'] })
    .register('bazaar', { zones: ['bazaar'], build: (g) => g.bazaar?.build(), teardown: (g) => g.bazaar?.teardown() }).register('margarite', { zones: ['margarite'] });
  game.time = new TimeScale(game); // (who slows the world, and by how much: see core/time.js)
  game.log = new GameLog(game); // (the one place for text feedback; see gamelog.js)
  game.renderer = renderer; // (for a warm-up made later than boot: the Spirit Garden's, world/garden/realm.js build())
  game.post = new Glow(renderer);
  game.overlayScene = game.post.overlay = new OverlayScene(game, renderer); // (the overlay's own 3D layer: frames, the reservoir, render/overlayscene.js)
  game.glitch = new Glitch(game); game.post.screen = game.glitch; // (the data showing through: a screen pass in the glow, vfx/glitch.js)
  game.stormWarp = new StormWarp(game); game.umbral = new Umbral(game); // (the crossing's psychic storm and the world under the Emocean's surface: vfx/stormwarp.js, vfx/umbral.js; their screen share rides the glitch's pass)
  game.dataDrain = new DataDrain(game); // (a creature's data pulled out of it, on a reprogramming: vfx/datadrain.js)
  game.duelView = new DuelView(game); // (a puzzle duel's board stood in the world and the domains' clash behind it, for the duel's session to drive: vfx/duelview.js)
  game.wellDress = new WellDress(game); // (the Dunemaw floor's sandfalls dressed: vfx/welldress.js)
  game.flythrough = new Flythrough(game); // (a Dunemaw floor previewed on arrival, smeared by the frame accumulation: cine/flythrough.js)
  game.dunemawMood = dunemawMood(game); // (the Great Dunemaw's verse into the wall: its floors' colours by depth, slammed at the FOE)
  game.ui = new HideUI(game); // (F2: the interface off the screen, for a clean shot)
  game.glyphs = new Glyphs(game); // (the !!! over a bite: marks in the world, on the thing they are about)
  game.ai = new AI(game); // (what creatures notice and what the world offers them: ai/, docs/AI.md)
  game.signatures = new Signatures(game); standardSignatures(game); // (where Lachryma is, for whatever senses it: signatures.js)
  game.px = px; // (the maker's pixel art, for any window that wants it: ui/pixel.js)
  game.cinema = new Cinema(game); // (bars, a composition for the camera, a vignette)
  game.portrait = new Portrait(game); // (the cut-in window of a fish on the line)
  game.pulse = new PsychicPulse(game); // (a sounding: a sphere of light from a point)
  const breakables = new Breakables(scene, physics, fx, game);
  mark('services');
  return { physics, fx, hud, stats, events, game, breakables };
}
