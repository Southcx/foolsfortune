"""Export source_assets/chess_pieces.blend -> src/assets/chess.glb: the title's six chess pieces (pawn, rook, knight, bishop, queen,
king; the owner's, 2026-10-07), each on its own five-bone rig, with every action as a clip (`<piece>_<verb>`: idle, hop, land, march,
bow, lookAround, taunt, celebrate, fall, getUp, captured, spawn, move; the king's shiver). The rigs are set at the origin (the file lays
them out in a row); the Solidify outline shells and their Outline slot are stripped (the game draws its own outline); the light and the
camera stay behind. Materials: Chess_Black and Chess_White, flat colours (title/board.js's porcelain), no images.

Usage:  python3 -I scripts/export_chess.py [source_assets/chess_pieces.blend]
"""
import sys, os
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
src = args[0] if args else os.path.join(root, "source_assets", "chess_pieces.blend")
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(src))

RIGS = ["pawn_Rig", "Rook_Rig", "Knight_Rig", "bishop_Rig", "queen_Rig", "King_Rig"]
keep = []
for a in bpy.data.actions:
    a.use_fake_user = True
for rn in RIGS:
    rig = bpy.data.objects[rn]
    rig.location = (0, 0, 0)
    if rig.animation_data:
        rig.animation_data.action = None  # (its NLA tracks stay: they are how the exporter knows which rig an action moves)
    keep.append(rig)
    for ob in rig.children:
        if ob.type != "MESH":
            continue
        ob.location = (0, 0, 0)
        for m in list(ob.modifiers):
            if m.type == "SOLIDIFY":
                ob.modifiers.remove(m)
        for i in reversed(range(len(ob.material_slots))):
            mat = ob.material_slots[i].material
            if mat and mat.name == "Outline":
                ob.active_material_index = i
                bpy.context.view_layer.objects.active = ob
                with bpy.context.temp_override(object=ob):
                    bpy.ops.object.material_slot_remove()
        keep.append(ob)

bpy.ops.object.select_all(action="DESELECT")
for o in keep:
    o.hide_set(False)
    o.select_set(True)
bpy.context.view_layer.objects.active = keep[0]
out = os.path.join(root, "src", "assets", "chess.glb")
bpy.ops.export_scene.gltf(
    filepath=out, export_format="GLB", use_selection=True, export_apply=True,
    export_yup=True, export_skins=True, export_animations=True,
    export_animation_mode="ACTIONS", export_force_sampling=True,
    export_image_format="NONE", export_materials="EXPORT", export_def_bones=False, export_frame_range=False,
)
print("exported", out, os.path.getsize(out))
