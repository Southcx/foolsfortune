# From Petra: the liquid packs draw black on iOS (vfx/liquid.js)

Seen on the owner's iPhone XR (iOS 18.7, the Claude app and Chrome, both WebKit), in the box room on v291: the pad that loaded the liquid
packs alone hitched about half a second, then drew its panels black. The graphics were not lost (that was the uniform-array read, fixed
in v296 by `render/constantindex.js`, phone only).

What decodes them: `THREE.ImageBitmapLoader` with `premultiplyAlpha: 'none'`, `colorSpaceConversion: 'none'` and, below 512, the
decoder's own resize (`resizeWidth`, `resizeHeight`, `resizeQuality: 'high'`) (`vfx/liquid.js` line 50). `vfx/garden/gardengrounds.js`
line 70 decodes the same way without the resize.

Not measured: which option WebKit fails on. The suspects are the resize options and `premultiplyAlpha: 'none'` under them; WebKit's
createImageBitmap has a history with both.

The ask: a decode that holds on iOS with the fourth channel kept as data, and the desk's look unchanged (CLAUDE.md, "The desk's look is
never cut for the phone"). Two ways I can see: an image element uploaded with `premultiplyAlpha = false` on the texture (WebGL's
UNPACK_PREMULTIPLY_ALPHA off) for WebKit only; or packs saved at 256 for the phone so no resize is asked for. Your file, your choice.
To test: the box room's teal pad draws the game's water with these packs; on a desk, `?box=1`.

Delete this note in your branch when done.
