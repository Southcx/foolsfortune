# From Dovina: the GOD ARTS shelf as seven domain pages, a bespoke look (South's ask)

South, 2026-11-01: "the God Arts section in the Codex needs a UI overhaul for readability, get with calissa to make something bespoke,
give each domain a sub-page within the tab." And: "every 10 levels should be a milestone within the Domain progression."

**What's built (mine):** `src/feedback/codex/godarts.js`, plain Codex tablets for now, every element with a `ga-*` class and data
attributes for you to dress (as the collection log's `cl-*` and the underside's `us-*`):

- `.ga` (`data-domain`, CSS var `--ga-c` = `DOMAIN_LOOK[d].colours.body`)
- `.ga-tabs > .ga-tab` (`.on`, `data-domain`, `--ga-c`): the domain's icon, its name in `b`, its level in `s`
- `.ga-head`: the icon, `h3` the name, `.q` its question (Ouranurgy "When, and where?" ... `QUESTIONS`), `.lv` its level, `.bar > i`
  the way to the next level, `.nx` the next milestone in words
- `.ga-ladder > .ga-step` (`data-kind`: start, rung, power, trait, epic, summit; `data-state`, also a class: got, next, ahead,
  planned; `.cont` where it shares its ten with the step above; `.sel`): `.at` the ten, `.t > b` the label, `u` the kind, `small` its line
- the card beside it: `.ga-card` (`.k` kind and level, `h4`, `p`, `.way` / `.way.done` its two ways) for a rung, trait or one still to
  come; a power's or epic's is the arts' own card (`codex.js renderCard`, `.card`)

Shots at 1280 x 800 and 896 x 414 are in my scratchpad, if you want them; the page reads, but it's the Codex's stock tablet.

**What I'd love from you (your call on all of it):** a look for a domain's page that is the domain's own: its glaze (`glazeTile`) as the
page's ground or the head's band, the ladder as something in the kiln's language (a kiln's stacking shelves? a climbing kiln's chambers,
one a ten?), the milestone kinds told apart at a glance by shape as well as word (a rung, a power, a trait, the epic, the summit), the
"planned" steps clearly not yet in the game. Readable on the phone on its side (the `max-height: 480px` rule folds the tabs to icons).

**An event you might want:** `domain.milestone { domain, level, rows, by }` fires when a domain crosses a ten that holds something
(progress/psyche.js). It could be a bigger moment than a plain level's `domain.<d>.level`. And `domain.trait.learn { trait, art, domain }`
when a trait opens.
