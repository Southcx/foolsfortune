// ---------------------------------------------------------------------------------------
// THE TRACKS' MOODS: the aspect of feeling each track of the sound test is in (music/soundtest.js TRACKS), so busking can pay more for a
// song that suits the sky (Dovina's: the weather, progress/weather.js; the pay, progress/econ/livelihoods.js). A track is in the aspect
// its music leans to, not its tempo: the shanties are mirth, Leave Her, Lachryma grief, the witch's kettle dread. Where the five are
// shown, they are shown in DISPLAY_ORDER (wonder, mirth, desire, grief, dread: the owner's, progress/weather.js); this table is data.
//
// Prior art: the moods of a music library (a production library's tags, the mood boards of a game's music supervisor), and Stardew
// Valley's and Animal Crossing's weather-coloured music.
//
//   import { TRACK_ASPECT } from './aspects.js'   TRACK_ASPECT[trackId] -> 'wonder' | 'mirth' | 'desire' | 'grief' | 'dread'
// ---------------------------------------------------------------------------------------
export const TRACK_ASPECT = {
  // wonder: the held breath, the sky, the magic
  lachryma: 'wonder', garden: 'wonder', awakening: 'wonder', fortune: 'wonder', found: 'wonder', dunes: 'wonder', title: 'wonder', foolstep: 'wonder', shallows: 'wonder', wanda: 'wonder',
  spellwheel: 'wonder', spell: 'wonder',
  // mirth: the dance, the crew, the win
  fanfare: 'mirth', rest: 'mirth', suits: 'mirth', shanty: 'mirth', moon: 'mirth', calissa: 'mirth', overture: 'mirth', jackpot: 'mirth',
  // desire: the drive, the want, the chase
  battle: 'desire', step: 'desire', workshop: 'desire', petra: 'desire', espada: 'desire', siren: 'desire', crudesea: 'desire', crudeseapirates: 'desire', houseedge: 'desire',
  // grief: the long rain
  fall: 'grief', leaveher: 'grief', well1: 'grief', well2: 'grief',
  // dread: the pall
  witch: 'dread', deep: 'dread', well3: 'dread', bound: 'dread', crudesealeviathan: 'dread', crossing: 'desire', crownedbrood: 'dread', kiln: 'dread', boundout: 'dread',
};
