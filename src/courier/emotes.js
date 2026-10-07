// ---------------------------------------------------------------------------------------
// EMOTES: the Courier's body language, asked for on the chat line (/wave, /sit, /dance, /wink, /dab ...). Each is a clip of the
// Courier's own animation suite (the owner's; the social pack, courier/anim/suite.js: Emote_*, Dance_*, Flirt_*, Taunt_*), played by
// the emote tech (courier/moves/emote.js): a one-shot plays once (a bow), a loop plays until they move (a dance), a triple goes in,
// holds and comes out (the suite's Enter/Loop/Exit: sitting, crying, sleeping). Moving (WASD, Space) ends any of them, through its
// way out if it has one. Two old ones are still the Universal Animation Library's (CC0, anims.bin): /talk and /fold.
//
// Each emote is in a **family** (greet, joy, anger, fear, sorrow, thought, pride, body, repose, dance, flirt, taunt), which is how
// /emotes lists them (one family a line, not a wall) and how the folk know what to feel at one (npc/folk.js).
//
// Prior art: Final Fantasy XI's and XIV's emotes (/sit, /wave, /dance, /bow, typed in the chat line, the motion and a line in the
// log for those who see it, "You sit down."), FFXIV's emote list in categories (General, Special, Expressions), and the MMO's custom
// /em ("/em takes a bow." -> "The Courier takes a bow."). The lines are placeholders (Espada's to write).
//
//   EMOTES[id] = { family, once? | loop? | enter?, exit? (a clip or a chain of clips), from?, to? (a once's window, s), hold?,
//                  floor? (a floor pose: the legs are the clip's, lifted out of the floor), bare? (lying down: the worn tools are put out of
//                  sight while the body is down, as MMOs put weapons away for an emote: a tool on the back would stand up through them), line, aliases? }
//   FAMILIES[family] = what it holds (for /emotes)        EMOTE_OF[word] = id (aliases too)        inFamily(family) = [id ...]
// ---------------------------------------------------------------------------------------

// a triple of the suite's: Emote_<Name>Enter, Emote_<Name>Loop, Emote_<Name>Exit
const tri = (n) => ({ enter: `Emote_${n}Enter`, loop: `Emote_${n}Loop`, exit: `Emote_${n}Exit` });

export const FAMILIES = {
  greet: 'greetings and partings',
  joy: 'joy, laughter and applause',
  anger: 'anger and distaste',
  fear: 'fright and nerves',
  sorrow: 'sorrow and defeat',
  thought: 'thinking, answering, pointing',
  pride: 'pride and poses',
  body: 'yawns, sneezes, the cold and the heat',
  repose: 'sitting, kneeling, lying down',
  dance: 'dances, each held until you move',
  flirt: 'winks, kisses and poses',
  taunt: 'taunts',
};

export const EMOTES = {
  // ---- greet
  wave: { family: 'greet', once: 'Emote_Wave', line: 'You wave.', aliases: ['call', 'hail'] },
  hi: { family: 'greet', once: 'Emote_WaveSmall', line: 'You wave hello.', aliases: ['hello'] },
  bye: { family: 'greet', once: 'Emote_Farewell', line: 'You wave goodbye.', aliases: ['farewell', 'goodbye'] },
  bow: { family: 'greet', once: 'Emote_Bow', line: 'You bow.' },
  bowdeep: { family: 'greet', once: 'Emote_BowDeep', line: 'You bow low, with a flourish.', aliases: ['flourish'] },
  curtsy: { family: 'greet', once: 'Emote_Curtsy', line: 'You curtsy.' },
  salute: { family: 'greet', once: 'Emote_Salute', line: 'You salute.' },
  palms: { family: 'greet', once: 'Emote_PalmsBow', line: 'You press your palms together and bow.' },
  beckon: { family: 'greet', once: 'Emote_Beckon', line: 'You beckon.', aliases: ['comehere'] },
  thanks: { family: 'greet', once: 'Emote_Thanks', line: 'You give thanks.', aliases: ['thank', 'ty'] },
  // ---- joy
  cheer: { family: 'joy', once: 'Emote_Cheer', line: 'You cheer.' },
  jumpforjoy: { family: 'joy', once: 'Emote_JumpForJoy', line: 'You jump for joy.', aliases: ['yay'] },
  clap: { family: 'joy', once: 'Emote_Clap', line: 'You clap.' },
  applause: { family: 'joy', ...tri('Applause'), line: 'You applaud.', aliases: ['applaud', 'bravo'] },
  celebrate: { family: 'joy', once: 'Emote_Celebrate', line: 'You celebrate.' },
  victory: { family: 'joy', once: 'Emote_Victory', line: 'You punch the air.', aliases: ['win'] },
  laugh: { family: 'joy', once: 'Emote_Laugh', line: 'You laugh.' },
  bellylaugh: { family: 'joy', once: 'Emote_BellyLaugh', line: 'You laugh until your sides ache.', aliases: ['guffaw'] },
  heart: { family: 'joy', once: 'Emote_HeartHands', to: 1.73, line: 'You make a heart with your hands.', aliases: ['hearthands'] }, // (cut before the right forearm's twist flips at f53: it fades out from there)
  hug: { family: 'joy', once: 'Emote_HugAir', line: 'You hug the air.' },
  // ---- anger
  angry: { family: 'anger', once: 'Emote_Angry', line: 'You fume.', aliases: ['mad', 'fume'] },
  fistshake: { family: 'anger', once: 'Emote_FistShake', line: 'You shake your fist.', aliases: ['shakefist'] },
  tantrum: { family: 'anger', once: 'Emote_Tantrum', line: 'You throw a tantrum.' },
  rage: { family: 'anger', once: 'Emote_Rage', line: 'You rage.' },
  disgust: { family: 'anger', once: 'Emote_Disgust', line: 'You recoil in disgust.' },
  ew: { family: 'anger', once: 'Emote_Ew', line: 'Ew.', aliases: ['yuck'] },
  facepalm: { family: 'anger', once: 'Emote_Facepalm', line: 'You put your face in your palm.' },
  // ---- fear
  gasp: { family: 'fear', once: 'Emote_Gasp', line: 'You gasp.' },
  startle: { family: 'fear', once: 'Emote_Startle', line: 'You start.', aliases: ['eek'] },
  panic: { family: 'fear', once: 'Emote_Panic', line: 'You panic.' },
  tremble: { family: 'fear', ...tri('Tremble'), line: 'You tremble.', aliases: ['quail'] },
  cower: { family: 'fear', ...tri('Cower'), line: 'You cower.', aliases: ['duck'] },
  worried: { family: 'fear', ...tri('Worried'), line: 'You fret.', aliases: ['worry', 'fret'] },
  peek: { family: 'fear', once: 'Emote_Peek', line: 'You peek out.' },
  // ---- sorrow
  cry: { family: 'sorrow', ...tri('Cry'), line: 'You cry.', aliases: ['weep', 'sob'] },
  sorry: { family: 'sorrow', once: 'Emote_Sorry', line: 'You apologize.', aliases: ['apologize', 'apologise'] },
  sulk: { family: 'sorrow', ...tri('Sulk'), line: 'You sit and sulk.', aliases: ['pout'], floor: true },
  despair: { family: 'sorrow', ...tri('Despair'), line: 'You fall to your hands and knees in despair.', floor: true },
  faint: { family: 'sorrow', ...tri('Defeat'), line: 'You swoon and sink to your knees.', aliases: ['swoon', 'collapse', 'defeat'], floor: true },
  // ---- thought
  think: { family: 'thought', ...tri('Think'), line: 'You think.', aliases: ['ponder', 'hmm'] },
  scratch: { family: 'thought', once: 'Emote_HeadScratch', line: 'You scratch your head.', aliases: ['headscratch'] },
  shrug: { family: 'thought', once: 'Emote_Shrug', line: 'You shrug.' },
  idea: { family: 'thought', once: 'Emote_Idea', line: 'You have an idea.', aliases: ['eureka'] },
  look: { family: 'thought', once: 'Emote_LookAround', line: 'You look around.', aliases: ['lookaround'] },
  point: { family: 'thought', once: 'Emote_Point', line: 'You point.' },
  nod: { family: 'thought', once: 'Emote_Nod', line: 'You nod.', aliases: ['yes'] },
  agree: { family: 'thought', once: 'Emote_Agree', line: 'You give a thumbs up.', aliases: ['thumbsup'] },
  no: { family: 'thought', once: 'Emote_No', line: 'You shake your head.', aliases: ['shake'] },
  deny: { family: 'thought', once: 'Emote_Deny', line: 'You wag a finger: no.', aliases: ['nope'] },
  shush: { family: 'thought', once: 'Emote_Shush', line: 'You shush.', aliases: ['hush'] },
  talk: { family: 'thought', loop: 'talk', line: 'You chatter away to no one in particular.', aliases: ['chatter'] },
  fold: { family: 'thought', loop: 'foldArms', line: 'You fold your arms.', aliases: ['cross', 'wait'] },
  // ---- pride
  proud: { family: 'pride', ...tri('Proud'), line: 'You stand proud.' },
  smug: { family: 'pride', ...tri('Smug'), line: 'You look smug.' },
  triumph: { family: 'pride', ...tri('VictoryPose'), line: 'You strike a victory pose.', aliases: ['victorypose'] },
  peace: { family: 'pride', ...tri('Peace'), line: 'You flash a peace sign.', aliases: ['vsign'] },
  hero: { family: 'pride', once: 'Emote_HeroPose', line: 'You strike a heroic pose.', aliases: ['heropose'] },
  flex: { family: 'pride', once: 'Emote_Flex', line: 'You flex.' },
  ready: { family: 'pride', once: 'Emote_Ready', line: 'You get ready.' },
  // ---- body
  yawn: { family: 'body', once: 'Emote_Yawn', line: 'You yawn.' },
  stretch: { family: 'body', once: 'Emote_Stretch', line: 'You stretch.' },
  sneeze: { family: 'body', once: 'Emote_Sneeze', line: 'You sneeze.', aliases: ['achoo'] },
  hungry: { family: 'body', once: 'Emote_Hungry', to: 2.23, line: 'Your stomach rumbles.', aliases: ['rumble'] }, // (cut before the right forearm's twist flips at f68)
  phew: { family: 'body', once: 'Emote_Phew', line: 'You wipe your brow. Phew.', aliases: ['relief'] },
  bored: { family: 'body', ...tri('Bored'), line: 'You are bored.', aliases: ['sigh'] },
  exhausted: { family: 'body', ...tri('Exhausted'), line: 'You catch your breath.', aliases: ['tired', 'pant'] },
  doze: { family: 'body', ...tri('Doze'), line: 'You doze on your feet.', aliases: ['nodoff'] },
  cold: { family: 'body', ...tri('Cold'), line: 'You shiver.', aliases: ['shiver', 'brr'] },
  hot: { family: 'body', ...tri('Hot'), line: 'You fan yourself.', aliases: ['fan'] },
  // ---- repose
  sit: { family: 'repose', ...tri('SitCross'), line: 'You sit down.', aliases: ['rest'], floor: true },
  hugknees: { family: 'repose', ...tri('SitHugKnees'), line: 'You sit and hug your knees.', aliases: ['huddle'], floor: true },
  chair: { family: 'repose', ...tri('SitChair'), line: 'You sit on a chair that is not there.', aliases: ['mime'], floor: true },
  kneel: { family: 'repose', ...tri('Kneel'), line: 'You kneel.', aliases: ['tinker', 'fix'], floor: true },
  meditate: { family: 'repose', ...tri('Meditate'), line: 'You meditate.', aliases: ['om'], floor: true },
  hover: { family: 'repose', enter: ['Emote_MeditateEnter', 'Emote_MeditateHoverEnter'], loop: 'Emote_MeditateHoverLoop', exit: ['Emote_MeditateHoverExit', 'Emote_MeditateExit'], line: 'You meditate, and rise off the ground.', aliases: ['levitate', 'float'], floor: true },
  sleep: { family: 'repose', ...tri('Sleep'), line: 'You lie down and sleep.', aliases: ['zzz'], floor: true, bare: true },
  recline: { family: 'repose', ...tri('LieBack'), line: 'You lie back and look at the sky.', aliases: ['lie', 'liedown'], floor: true, bare: true },
  // ---- dance (each loops until you move)
  dance: { family: 'dance', loop: 'Dance_Basic', line: 'You dance.', aliases: ['groove'] },
  jig: { family: 'dance', loop: 'Dance_Jig', line: 'You dance a jig.' },
  salsa: { family: 'dance', loop: 'Dance_Salsa', line: 'You dance the salsa.' },
  lambada: { family: 'dance', loop: 'Dance_Lambada', line: 'You dance the lambada.' },
  whirl: { family: 'dance', loop: 'Dance_Whirl', line: 'You whirl.' },
  ballet: { family: 'dance', loop: 'Dance_Ballet', line: 'You dance ballet.' },
  monkey: { family: 'dance', loop: 'Dance_Monkey', line: 'You do the monkey.' },
  disco: { family: 'dance', loop: 'Dance_Disco', line: 'You dance disco.' },
  robot: { family: 'dance', loop: 'Dance_Robot', line: 'You do the robot.' },
  runningman: { family: 'dance', loop: 'Dance_RunningMan', line: 'You do the running man.' },
  floss: { family: 'dance', loop: 'Dance_Floss', line: 'You floss.' },
  sprinkler: { family: 'dance', loop: 'Dance_Sprinkler', line: 'You do the sprinkler.' },
  headbang: { family: 'dance', loop: 'Dance_Headbang', line: 'You bang your head.' },
  shuffle: { family: 'dance', loop: 'Dance_Shuffle', line: 'You shuffle.' },
  twist: { family: 'dance', loop: 'Dance_Twist', line: 'You do the twist.' },
  cossack: { family: 'dance', loop: 'Dance_Cossack', line: 'You squat and kick.', aliases: ['hopak'] },
  chicken: { family: 'dance', loop: 'Dance_Chicken', line: 'You do the chicken dance.' },
  moonwalk: { family: 'dance', loop: 'Dance_Moonwalk', line: 'You moonwalk.' },
  bodywave: { family: 'dance', loop: 'Dance_Wave', line: 'You send a wave down your body.' },
  vogue: { family: 'dance', loop: 'Dance_Vogue', line: 'You vogue.' },
  hype: { family: 'dance', loop: 'Dance_Hype', line: 'You get hyped.' },
  sway: { family: 'dance', loop: 'Dance_SlowSway', line: 'You sway slowly.', aliases: ['slowdance'] },
  bhangra: { family: 'dance', loop: 'Dance_Bhangra', line: 'You dance the bhangra.' },
  twirl: { family: 'dance', loop: 'Dance_Twirl', line: 'You twirl.' },
  routine: { family: 'dance', loop: 'Dance_Routine', line: 'You dance a routine.' },
  dispatch: { family: 'dance', loop: 'Dance_Dispatch', line: 'You dance the dispatch.' },
  // ---- flirt
  wink: { family: 'flirt', once: 'Flirt_Wink', line: 'You wink.', aliases: ['flirt'] },
  blowkiss: { family: 'flirt', once: 'Flirt_BlowKiss', line: 'You blow a kiss.', aliases: ['mwah'] },
  kiss: { family: 'flirt', once: 'Emote_BlowKissSoft', line: 'You blow a soft kiss.' },
  hairflip: { family: 'flirt', once: 'Flirt_HairFlip', line: 'You flip your hair.' },
  comehither: { family: 'flirt', once: 'Flirt_ComeHither', line: 'You crook a finger: come hither.' },
  hips: { family: 'flirt', once: 'Flirt_PoseHip', line: 'You pose, a hand on your hip.', aliases: ['posehip'] },
  bodyroll: { family: 'flirt', once: 'Flirt_BodyRoll', line: 'You roll your body.' },
  lean: { family: 'flirt', once: 'Flirt_LeanPose', line: 'You lean, ever so casually.' },
  glance: { family: 'flirt', once: 'Flirt_OverShoulder', line: 'You glance over your shoulder.', aliases: ['overshoulder'] },
  catwalk: { family: 'flirt', loop: 'Flirt_Catwalk', line: 'You strut.', aliases: ['strut'] },
  coy: { family: 'flirt', once: 'Flirt_ShyFlirt', line: 'You are coy.', aliases: ['shyflirt'] },
  bitelip: { family: 'flirt', once: 'Flirt_Bite', line: 'You bite your lip.' },
  smitten: { family: 'flirt', once: 'Flirt_Swoon', line: 'You are smitten.' },
  showcase: { family: 'flirt', once: 'Flirt_Showcase', line: 'You show yourself off.' },
  bashful: { family: 'flirt', ...tri('Bashful'), line: 'You are bashful.', aliases: ['shy', 'blush'] },
  // ---- taunt
  comeatme: { family: 'taunt', once: 'Taunt_ComeAtMe', line: 'You beckon them on: come at me.', aliases: ['taunt', 'bringit'] },
  nosethumb: { family: 'taunt', once: 'Taunt_NoseThumb', line: 'You thumb your nose.', aliases: ['nyah'] },
  pointlaugh: { family: 'taunt', once: 'Emote_PointAndLaugh', line: 'You point and laugh.', aliases: ['haha'] },
  boring: { family: 'taunt', once: 'Taunt_Yawn', line: 'You yawn, pointedly.' },
  showoff: { family: 'taunt', once: 'Taunt_Flex', line: 'You show off your muscles.' },
  bawk: { family: 'taunt', once: 'Taunt_Chicken', line: 'You flap your arms: bawk.' },
  tooslow: { family: 'taunt', once: 'Taunt_TooSlow', line: 'Too slow.' },
  mockbow: { family: 'taunt', once: 'Taunt_MockBow', line: 'You bow, mockingly.' },
  dustoff: { family: 'taunt', once: 'Taunt_DustOff', line: 'You dust yourself off.' },
  shoulder: { family: 'taunt', once: 'Taunt_DustShoulder', line: 'You brush the dust off your shoulder.' },
  dab: { family: 'taunt', once: 'Taunt_Dab', line: 'You dab.' },
  loser: { family: 'taunt', once: 'Taunt_Loser', line: 'You make an L on your forehead.' },
  knuckles: { family: 'taunt', once: 'Taunt_KnuckleCrack', from: 0.34, line: 'You crack your knuckles.', aliases: ['crack'] }, // (from f10: the forearms' twist flips before it)
  scoff: { family: 'taunt', once: 'Taunt_Scoff', line: 'You scoff.' },
  shakeit: { family: 'taunt', once: 'Taunt_ShakeIt', line: 'You shake it.' },
  cheeky: { family: 'taunt', once: 'Taunt_ButtSlap', line: 'You slap your own behind.' },
};

export const EMOTE_OF = Object.fromEntries(Object.entries(EMOTES).flatMap(([id, e]) => [[id, id], ...(e.aliases || []).map((a) => [a, id])]));

/** The ids of a family, in the table's order. */
export const inFamily = (family) => Object.keys(EMOTES).filter((id) => EMOTES[id].family === family);
