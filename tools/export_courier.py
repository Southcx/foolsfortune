"""Export the Courier .blend into web-ready GLBs.

Usage:  python3 tools/export_courier.py path/to/courier_base_rigged.blend
Needs the `bpy` module (pip install bpy==4.5.*) or run inside Blender:
    blender -b courier.blend -P tools/export_courier.py -- courier.blend

Produces:
  public/assets/courier.glb  - skinned character, rest (T) pose, no outline shells
  public/assets/psygun.glb   - the PsyGun mesh in its own local space
Outlines are re-created in-engine (inverted hull) so thickness is tunable.
"""
import sys, os
import bpy

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
src = args[0] if args else None
if src and bpy.data.filepath != os.path.abspath(src):
    bpy.ops.wm.open_mainfile(filepath=src)

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(root, "public", "assets")
os.makedirs(out_dir, exist_ok=True)

arm = bpy.data.objects["basedoll_male_rig"]
arm.data.pose_position = "REST"
if arm.animation_data:
    arm.animation_data.action = None

CHAR_MESHES = ["Courier_Armor", "Courier_Mask", "Courier_Skin", "Courier_Skin_Core",
               "Courier_Stones", "Kiritohair"]
for name in CHAR_MESHES:
    ob = bpy.data.objects[name]
    for m in list(ob.modifiers):
        if m.type == "SOLIDIFY":  # outline shell; rebuilt in-engine
            ob.modifiers.remove(m)
    # drop the Outline material slot (only used by the solidify shell)
    for i in reversed(range(len(ob.material_slots))):
        mat = ob.material_slots[i].material
        if mat and mat.name == "Outline":
            ob.active_material_index = i
            bpy.context.view_layer.objects.active = ob
            with bpy.context.temp_override(object=ob):
                bpy.ops.object.material_slot_remove()

def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

common = dict(export_format="GLB", use_selection=True, export_apply=True,
              export_animations=False, export_yup=True, export_texcoords=True,
              export_normals=True, export_materials="EXPORT", export_image_format="NONE")

select_only([arm] + [bpy.data.objects[n] for n in CHAR_MESHES])
bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, "courier.glb"), export_skins=True,
                          export_def_bones=False, **common)

# Gun: export in its own mesh space (object transform reset)
gun = bpy.data.objects["PsyGun"]
gun.parent = None
gun.matrix_world.identity()
select_only([gun])
bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, "psygun.glb"), **common)
print("exported to", out_dir)
