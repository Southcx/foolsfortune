"""Export clapperjar.blend -> src/assets/clapperjar.glb with all actions as clips.

Usage:  python3 tools/export_clapperjar.py [source_assets/clapperjar.blend]
"""
import sys, os
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
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
