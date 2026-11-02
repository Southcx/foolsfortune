# Words: the garden's scorch, the aberrant clapperjar, the mech's v2 (from Espada, 2026-11-02)

Strings only, old -> new, for whoever holds the file to put in. A line marked **keep** is ruled as it stands; drop its
"Espada's to word" comment and mark it "Espada's, 2026-11-02". No sweep greps these words (checked `scripts/sweeps/`).
Plain words throughout: the mechs are not final.

## The garden (`feedback/tracking/garden.js`, `garden.scorch`)
- `The Fury rain scorched the moss on ${planet(...)} to ash.` -> `Moss on ${planet(e.planetoid)} burned to ash in Fury's rain.`

## The aberrant clapperjar (Dovina's files)
`feedback/tracking/duel.js`:
- `clapper.wrong`: 'A clapperjar caught the mirth in the air and went aberrant.' -> 'A clapperjar went aberrant in Mirth\'s weather.'
- SECRET_LINE.clapback.half: 'The clapperjar claps harder, a little off its own time.' -> 'The clapperjar is losing its rhythm.'
- SECRET_LINE.clapback.done: 'The clapperjar loses its time and claps itself to pieces.' -> 'The clapperjar loses its rhythm and claps itself to pieces.'
- LINE_DEATH.clapper: **keep** ('The clapperjar cracks mid-clap. Duel won. The clapperjar is mended.')
- FOE_LINE.shuffle: `The clapperjar shuffles ${e.n} of your gems.` -> `The clapperjar swaps the colours of ${e.n} of your ${e.n === 1 ? 'gem' : 'gems'}.`
- FOE_LINE.syncopate: off 'The clapperjar claps between the beats.' -> 'The clapperjar now claps on the off-beat.'; back: **keep** ('The clapperjar claps on the beat again.')

`progress/duel/secrets.js`, clapback (shown only once found):
- label: **keep** ('Clap back')
- line -> 'Release your drag on its clap and clear, three turns in a row; it loses its rhythm and claps itself to pieces'

`progress/duel/foeskills.js`: Shuffle and Syncopate, label and line: **keep**.
`progress/duel/powers.js`, Encore line: 'You may drag twice this turn' -> 'Drag twice this turn'
`progress/duelachievements.js`, du14 'Applause': **keep** (it names the win, never the how, as du9 and du10).

## The mech's v2
`progress/mechs/techniques.js` TECHNIQUES, line (and keys where marked). South's rule: "hold" only for a button held down, so
"holding a club" becomes "with a club in hand":
- grab: 'Pick up a loose thing (a post, a girder, a piece of building, a limb)'
- throw: 'Throw the thing in your hands where you aim'; keys 'RMB holding a thing' -> 'RMB with a thing in hand'
- thunderclap: 'Clap both hands. The shock in front staggers and breaks glass'
- groundPound: 'Punch both fists into the ground. Everything near is knocked off its feet'
- elbowDrop: 'Drop elbow first from the air. The higher the drop, the harder the blow'
- superJump: 'Hold Space, then release. Jumps two and a half times as high'
- battering: 'Boost into a building and straight through its walls'
- uppercut: 'A blow up through the chin. Knocks a giant\'s head back, or a roof off'
- spin: 'With a club in hand, hold LMB. A full turn that strikes all round'; keys 'LMB held with a club in hand'
- javelin: 'Throw a post or girder point first. It goes through what it meets'
- shieldUp: 'With a slab of building in hand, press V. It blocks blows from the front until it breaks'
- labels: all **keep**.

PROPS: post, girder, limb **keep**; chunk 'A piece of a building, as it came off' -> 'A piece broken off a building'; tower 'A tank on legs, full' -> 'A full water tank on legs'.

`progress/mechs/ring.js` RIVALS: labels **keep**.
- sparring: '... It guards its body and leaves its head.' -> 'The gantry\'s old practice frame, rebuilt. It guards its body and leaves its head open.'
- heavy, champion: **keep**.

`feedback/tracking/mechs.js`:
- mech.seal: "Your Pneuka Jar turns home in the mech's cradle." -> 'Your Pneuka Jar is sealed into the mech.'
- mech.launch: 'The lift carries the mech up to the proving ground.' -> 'Mech launched to the proving ground.'
- mech.unseal: 'Your Pneuka Jar lifts out of the mech.' -> 'Your Pneuka Jar is out of the mech.'
- mech.fail core: "The mech's core breaks. It kneels and throws your Pneuka Jar clear." -> 'Mech core broken. Your Pneuka Jar is thrown clear.'
- mech.fail dry: "The mech's battery and your pool are spent. It kneels ..." -> 'Mech battery and pool empty. Your Pneuka Jar is thrown clear.'
- mech.cable: 'The cable is in: the battery fills.' -> 'Cable connected. The battery is refilling.'; 'Off the cable: the battery is all there is.' -> 'Cable disconnected. The battery no longer refills.'
- mech.barrier: "The giant's barrier falls." -> "Giant's barrier broken."
- mech.hurt: `The mech's ${region} breaks.` -> `Mech's ${region} broken.`
- mech.berserk: 'The mech moves on its own.' -> 'Mech berserk. It is out of your control.'
- giant.wake: `The ${x} stirs.` -> `The ${x} wakes.`
- giant.stagger, giant.down, the joints' "tears off" lines, bout.down, bout.round: **keep**.
- city.felled: `The ${x} comes down in one.` / `comes down.` -> `The ${x} collapses in one piece.` / `The ${x} collapses.`
- bout.enter: `You square up to the ${x}.` -> `Bout against the ${x}. Fight!` (the bell is the one place a shout earns its mark)
- bout.over lost by head: "Your mech's head pops off its neck. The bout is lost." -> "Your mech's head is knocked off. Bout lost."
- bout.over win and other losses, HOW: **keep**.

`progress/mechachievements.js` (names **keep**):
- mk9: -> 'Knock the heavy frame down with one body blow during its charge.'
- mk10: "Win a bout with your rival's head popped off." -> "Win a bout by knocking the rival frame's head off." ("rival" alone is the Raceway's)
- mk16: 'Strike a giant with its own torn-off arm.' -> 'Strike a giant with an arm torn off it.'
- mk8, mk11 to mk15, mk17: **keep**.

Delete this note when done.
