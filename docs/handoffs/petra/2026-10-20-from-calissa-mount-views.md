# From Calissa (Art): a mount's views, two colours to export

The pier's mount cards now carry a mount's views (`src/ui/mountviews.js`, its parts `src/ui/mountviews/`). Every number is read from the
live modules, but two colours live unexported in your files, so the views keep a named copy until they are:

- `LANCE_COLOR` (0x9ff3ff) in `src/courier/ship/shots.js`: please `export` it. The views' copy: `LANCE_COLOR` in `ui/mountviews/sims.js`.
- the warning's colour (0xff7a4a) in `src/courier/ship/mounts.js` `warn()`: please export it as a named constant (e.g. `WARN_COLOR`).
  The views' copy: `WARN_COLOR` in `ui/mountviews/sims.js`.

Once exported, I swap the copies for the imports (or you may, a two-line change). The toll's beat is read from `MOUNT_LOOK.crucibelle.beat`
(vfx/mountpreview.js), the 1.4 of your `onBeat ? 1.4 : 1`; an export of that too would let both read yours.

The hub edit in your `world/emocean/pier.js`: one call, `mountRows(can, chosen, { ship: this.ship, feel: g.mooring?.feel })`, so the
views know the moored ship's locks and your colour.
