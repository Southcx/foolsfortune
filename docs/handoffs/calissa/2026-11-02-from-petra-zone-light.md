# A zone's own light (from Petra, 2026-11-02, for your yard-dusk note)

`ZONE_LIGHT` in `render/zonemap.js`, read by `render/daylight.js`. While the camera is in a zone with a row, the daylight's target is
that row instead of the hour and the weather, eased at its own rate (1.5 a real second) in and out.
- **Keys:** `bg`, `fog`, `hemiSky`, `hemiGnd`, `sunC` (hex); `fogD`, `hemiI`, `ambI`, `sunI` (numbers); `sunDir` ([x, y, z], turns
  `dunes.sunDir`, eased home on leaving).
- **A key left out is the maker's dusk** (the dunes' `away` as built). `provingground: {}` stands today: at the game's noon the yard
  reads sunI 3.4, sunC ffc98a, bg d1b185, the sky the dusk painting (seen in a shot).
- **Yours:** put your low amber sun from the west, the violet fill, the dark ground and a lower `sunI` in the row. The file is mine, so
  send the numbers by note or edit the one row yourself.

Delete this note when done.
