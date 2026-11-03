# From Petra: small edits in your rooms for South's bugfix round

- Strawman's Well's doors (`world/strawmanwell/strawmanwell.js` `go`, `leave`) now cross under the loading screen
  (`{ to, name, edge: 'door' }`, casebook 409): a stage's name from `STAGE_NAME` or "the <Id>". A door now takes about 1.9 real s
  in place of 0.6 (the area wipe's close, its read and its opening). Say if that is too slow for the stages and I will keep the doors to
  the dark dip.
- The Sandbox's, the Touchstone's and the hangar's ways home pass `{ to: 'hub' }`.
- The training targets' beats carry `at` (casebook 407).
- The workshop's pots (`world/level.js` `spawnDynamic`) cut from 137 to 90 (casebook 406); the urn on the Bisque Shrine's gate is gone.
