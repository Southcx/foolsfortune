"""Export clapperjar.blend -> src/assets/clapperjar.glb with all actions as clips; and the owner's grey texture
(source_assets/clapperjar_base.png, 256 square, painted on the mesh's UVMap) -> src/assets/clapperjar_base.png as one channel of grey.
It is grey so the jar's own colour tints it (vfx/greytint.js); the owner's file is RGBA with r = g = b and no alpha, so one channel
keeps every value at under half the bytes (12,035 -> 5,876). The glb carries no image: clappers.js imports the texture (?b64), as
character.js does the Courier's paintings (a texture inside the glb cost twice the bytes: Blender writes the RGBA file).

Usage:  python3 -I scripts/export_clapperjar.py [source_assets/clapperjar.blend]     (the glb and the texture)
        python3 -I scripts/export_clapperjar.py --texture                            (the texture only)
"""
import sys, os, struct, zlib
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
texture_only = "--texture" in args
args = [a for a in args if not a.startswith("--")]


def grey_png(src, out):
    """The owner's texture as an 8-bit grey PNG (stdlib only: the red channel of each pixel, rows top first, no row filter)."""
    im = bpy.data.images.load(src)
    w, h = im.size
    px = im.pixels[:]  # (a byte image's values as stored, 0..1, rows bottom first: checked against the PNG, every pixel equal)
    rows = []
    for y in range(h):
        base = (h - 1 - y) * w * 4
        rows.append(b"\x00" + bytes(round(px[base + x * 4] * 255) for x in range(w)))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    data = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 0, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"".join(rows), 9)) + chunk(b"IEND", b""))
    with open(out, "wb") as f:
        f.write(data)
    print("texture", out, len(data), "bytes")


if not texture_only:
    src = args[0] if args else os.path.join(root, "source_assets", "clapperjar.blend")
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(src))

    rig = bpy.data.objects["Clapper_rig"]
    body = bpy.data.objects["Clapper"]
    # every action becomes a clip; keep them from being dropped for having no users
    for a in bpy.data.actions:
        a.use_fake_user = True
    if rig.animation_data:
        rig.animation_data.action = None
        for t in list(rig.animation_data.nla_tracks):
            rig.animation_data.nla_tracks.remove(t)

    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in (rig, body):
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig

    out = os.path.join(root, "src", "assets", "clapperjar.glb")
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=True, export_apply=True,
        export_yup=True, export_skins=True, export_animations=True,
        export_animation_mode="ACTIONS", export_force_sampling=True,
        export_image_format="NONE", export_materials="EXPORT",
    )
    print("exported", out)

grey_png(os.path.join(root, "source_assets", "clapperjar_base.png"), os.path.join(root, "src", "assets", "clapperjar_base.png"))
