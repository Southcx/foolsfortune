"""Export slipjelly.blend -> src/assets/slipjelly.glb (one mesh, the mirror applied; no rig: it is animated as a jelly, see src/creatures/jelly/).

Usage:  python3 scripts/export_slipjelly.py [source_assets/slipjelly.blend]
"""
import sys, os
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
src = args[0] if args else os.path.join(root, "source_assets", "slipjelly.blend")
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(src))

body = bpy.data.objects["Figment_MindJelly"]
for o in bpy.context.view_layer.objects:
    o.select_set(False)
body.hide_set(False)
body.select_set(True)
bpy.context.view_layer.objects.active = body

out = os.path.join(root, "src", "assets", "slipjelly.glb")
bpy.ops.export_scene.gltf(
    filepath=out, export_format="GLB", use_selection=True, export_apply=True,
    export_yup=True, export_normals=True, export_texcoords=True,
    export_image_format="NONE", export_materials="NONE",
)
print("exported", out)
