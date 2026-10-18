# The Veritomes: variants of the book, each with its own sight

Kept by Dovina (the rules, what each sees, where each is found). The tool's code (`tools/veritome/`) is Petra's; the looks are
Calissa's; the names are Espada's to rule (working names here).

> "Don't make lenses an object in the Pneuka box. We can make variants on the Veritome itself much like the variants of the Lockheart,
> where different Veritomes have different scanning capabilities. The philosophy is that other lens modes can make QoL improvements, but
> that they do not preclude you from accessing content without them." (the owner, 2026-10-18)

## 1. The rules

1. **A variant is a whole book**, as a Lockheart variant is a whole coffin (`HEARTS`, `lockheart/table.js`). You wear one Veritome at
   a time on the belt. The trade is which book you carry; there is no fitting and no inventory of lenses.
2. **Every Veritome is a camera.** Each one takes plates, scans with the tag (OVERLAY.md 17) and feeds the bestiary. A variant adds
   its own sight while the lens is raised.
3. **A sight is a convenience, never a key.** Everything a sight shows can be found or done without it, by another avenue already in
   the world: a sound, a mark on the ground, the map, another tool, a photograph. A sight makes it faster or surer. No content is
   behind any one Veritome.
4. **The scan is the same in every book.** Familiarity decides what the tag reads. A sight adds a layer, never a level.
5. **Divination widens a sight's reach** (the domain's widening, `RAMP.tools`).

## 2. The books (working names)

| book | its sight, the lens raised | what it speeds up | the avenue without it |
|---|---|---|---|
| **the Plain Veritome** (as today) | none beyond the scan | | |
| **the Empath's Veritome** (Mood) | what a being feels: a creature's mental state and its EmO glowing hotter as it rises, the folk's mood | reading a fight; keeping a creature in its yield band; choosing a damage type | the body's temper |
| **the Augur's Veritome** (Intent) | a mind's wiring: what a creature is about to do (its Brain's next action and what drives it), and what the Soul Brush has written on things | reprogramming; reading a windup early | Figment attack telegraphs; the bestiary's facts |
| **the Skeptic's Veritome** (Reveal) | which beings are not so: an Illusion's decoys and mirages, a Figment wearing another's shape | ambushes; picking the real one out | sound and the body (a mirage casts no shadow), a photograph (a plate already undoes what was written) |

### Split with the Dreamvane (the owner, 2026-10-18: "we shouldn't overload individual tools")
The Veritome reads **beings**: creatures, the folk and their minds. The Dreamvane reads **the world**: the ground, the air, and the
Lachryma in them. A sight about the world goes to the Dreamvane, as a convenience on a mode it already has, and never as a variant:
- **Thermal, on the dowse.** While the dowse is held, what it is attuned to glows through sand and walls as heat (buried cubes,
  Lachrymite, chests). Today the dowse points; with this it also shows. The avenue without it is the dowse's pointing.
- **Reveal, on the survey.** The survey's ring shows a false wall and a sealed room's seam for a beat. The avenue without it: a false
  wall rings hollow to the pick.
- So the Dowser's Veritome is cut. Its Margarite prospector's lore is free for a Dreamvane of Margarite's one day, if the owner wants
  the Dreamvane to have variants too.

### Espada's lore (2026-10-18, proposed: LORE.md, "Three plans named")
Each book is from a different island and wears that island's dress (OVERLAY.md 15.4). The sights' UI labels are Thermal, Mood, Intent
and Reveal.
- The Dowser's (Margarite, Nacre: a crude prospector's book) was cut; see the split above.
- The Empath's is from Anagami (Clay): a kiln mender's book.
- The Augur's is from Entropolis (Glass).
- The Skeptic's is from the Emocean (Brine): a Contractor's book, made by sailors who learned from the False Light.
- Who made the Plain one is left blank.

## 3. How they are found

Found, never bought: each one in the world, or earned by an achievement. A book you find is a place's thing, as a body is (HANKO.md 5).
Which place and which achievement are next (with Espada for the places).

## 4. Asked of each division

- **Petra:**
  - the Veritome as a variant, a book id worn on the belt (as the Lockheart's coffins are);
  - each sight a module behind the raised lens, reading what already exists: a creature's mental state and EmO, a Brain's current
    action, `core/tags.js` for what is false;
  - the Dreamvane's two: Thermal on the dowse (`core/signatures.js`, the attunement), Reveal on the survey (`core/tags.js`).
- **Calissa:** each sight's look. A sight is the overlay's (the System's sight, in the island's dress). It is drawn over the
  viewfinder, never as a full-screen filter that hides the world: the lesson of Batman's detective mode, which players never turned off.
- **Espada:** the books' names and their lore (who made each, why it sees what it sees).

## Prior art

- **Metroid Prime's visors** (Scan, Thermal, X-Ray): a sight per need, and the scan as the default.
- **Batman: Arkham's detective mode**: the warning. Players lived in it and saw the game through a blue filter. Hence rule 3 and the
  viewfinder-only look.
- **Fatal Frame's lenses on the Camera Obscura**: the camera's sight grows with what it is fitted with.
- **The Lens of Truth**: the warning the other way. In Ocarina of Time it is required in the Shadow Temple; ours never is.
- **The Lockheart's coffins**: the variant model, already in the game.
