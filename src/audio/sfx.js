// ---------------------------------------------------------------------------------------
// THE SOUND EFFECTS: one mixer (audio/core.js) and its banks, a file per part of the game (audio/weapons.js, audio/angling.js...).
// All sounds are synthesized with WebAudio, so the game has no audio assets; any of them could become a sample later and the call
// sites would stay the same. Everyone calls the one `sfx` (sfx.gunshot(), sfx.catchSong(rare), sfx[name]()): a bank's methods are
// copied onto the Sfx when the game loads, so a new sound is a method in its bank (or a new bank listed here), and the call sites
// never learn which bank holds it. Two banks may not hold a sound of the same name: it is reported at load.
//
// Prior art: the sound banks of console audio middleware (Wwise's SoundBanks, FMOD's banks), grouped by the part of the game that
// plays them, all mixed through one master bus; the mixin (an object's methods copied onto a class's prototype).
//
//   import { sfx } from './sfx.js'    sfx.unlock() (on the first gesture)   sfx.<sound>(...)   sfx.setVolume(v)   sfx.setSlow(s)
// ---------------------------------------------------------------------------------------
import { Sfx } from './core.js';
import { WeaponSounds } from './weapons.js';
import { WorldSounds } from './world.js';
import { UiSounds } from './ui.js';
import { MoveSounds } from './moves.js';
import { JellySounds } from './jelly.js';
import { GodHandSounds } from './godhand.js';
import { SondelassSounds } from './sondelass.js';
import { ToolSounds } from './tools.js';
import { AnglingSounds } from './angling.js';
import { TreasureSounds } from './treasure.js';
import { BrushSounds } from './brush.js';
import { VeritomeSounds } from './veritome.js';
import { ShopSounds } from './shop.js';
import { CrystalSounds } from './crystal.js';
import { VesselSounds } from './vessel.js';
import { DamageSounds } from './damage.js';
import { RailSounds } from './rail.js';
import { CatchSounds } from './catch.js';
import { SpiritSounds } from './spirits.js';

const BANK_OF = (Sfx.bankOf ||= {}); // (which bank each sound came from, kept on the class so a reloaded audio/sfx.js sees it)
for (const Bank of [WeaponSounds, WorldSounds, UiSounds, MoveSounds, JellySounds, GodHandSounds, SondelassSounds, ToolSounds, AnglingSounds, TreasureSounds, BrushSounds, VeritomeSounds, ShopSounds, CrystalSounds, VesselSounds, DamageSounds, RailSounds, CatchSounds, SpiritSounds]) {
  for (const key of Object.getOwnPropertyNames(Bank.prototype)) {
    if (key === 'constructor') continue;
    const had = BANK_OF[key]; // (the same bank again is a reload, not a clash)
    if (had && had !== Bank.name || (!had && Object.prototype.hasOwnProperty.call(Sfx.prototype, key))) console.error(`audio: two banks define sfx.${key} (${had || 'the mixer'}, ${Bank.name})`);
    BANK_OF[key] = Bank.name;
    Object.defineProperty(Sfx.prototype, key, Object.getOwnPropertyDescriptor(Bank.prototype, key));
  }
}

export const sfx = new Sfx();
