"""Export the god-mode assets: the rigged hand cursor and the Pneuka jar (the courier's vessel).

Usage:  python3 tools/export_godmode.py            (uses source_assets/courier_godhand.blend, courier_pneuka.blend)
Produces src/assets/godhand.glb (skinned hand, rest pose) and src/assets/pneuka.glb.
Outline shells (Solidify) are dropped; the game rebuilds outlines.
"""
import os
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(root, "source_assets")
out_dir = os.path.join(root, "src", "assets")

def strip_outline(ob):
    for m in list(ob.modifiers):
        if m.type == "SOLIDIFY":
            ob.modifiers.remove(m)
    for i in reversed(range(len(ob.material_slots))):
        mat = ob.material_slots[i].material
        if mat and mat.name == "Outline":
            ob.active_material_index = i
            with bpy.context.temp_override(object=ob, active_object=ob):
                bpy.ops.object.material_slot_remove()

def export(blend, keep, name, skins=False):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(src_dir, blend))
    objs = [bpy.data.objects[n] for n in keep]
    for o in objs:
        if o.type == "ARMATURE":
            o.data.pose_position = "REST"
        else:
            strip_outline(o)
    for o in bpy.data.objects:
        o.select_set(False)
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, name), export_format="GLB", use_selection=True,
                              export_apply=True, export_animations=False, export_yup=True, export_texcoords=True,
                              export_normals=True, export_materials="EXPORT", export_image_format="NONE",
                              export_skins=skins, export_def_bones=False)

export("courier_godhand.blend", ["metarig", "GodHand"], "godhand.glb", skins=True)
export("courier_pneuka.blend", ["Courier_PneukaJar"], "pneuka.glb")
print("exported")
