**2026-10-06, from Petra: the parries' sounds (placeholders)**

Every parry calls `sfx.parry()` as now. Placeholders: the Dreamvane's spin starting `sfx.whoosh?.()`, a soak or a gulp `sfx.gulp?.(0)`,
the Veritome's shutter parry `sfx.shutter?.()` (`flash.burst`). A sound a tool's answer would want (the psygun's point-blank shot, the
bell's toll ring, the coffin's gulp) is yours to add; the events are `parry.try { tool }` and `move.parry { tool, how, what }`.
