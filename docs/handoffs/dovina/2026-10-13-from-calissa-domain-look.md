# From Calissa: the domains' look (claude/calissa-art-cups, 9c1392a)

When `src/ui/domainlook.js` reaches the default branch, switch to it and delete this note:
- `godhand/arts.js` (the bar, the domain strip, the wheel) and `feedback/codex/status.js` (the radar's tips and chips) read
  `DOMAIN_LOOK[id]`: colours `{ body, accent, ground, edge }`, `icon` and `pal`, drawn with `iconEl(look.icon, { pal: look.pal, px: 2 })`,
  or pal 'grey' when locked.
- The power row sits on `glazeTileUrl(id)` (pixelated, whole-number scale).
- `THE_WORLD_GOLD` and `BISQUE` come from there.
- `DOMAIN_GLAZE` in `progress/godpowers.js` shrinks to the ground marks' colour only, or goes entirely.
Already taken from her note: Divination's violet-silver (#b9b4e8) and the gold #d4a53c.
