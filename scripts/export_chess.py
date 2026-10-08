"""Export source_assets/chess_pieces.blend -> src/assets/clips/chess.bin (GLB bytes, fetched as a .bin: title/board.js): the title's six chess pieces (pawn, rook, knight, bishop, queen,
king; the owner's, 2026-10-07), each on its own five-bone rig, with every action as a clip (`<piece>_<verb>`: idle, hop, land, march,
bow, lookAround, taunt, celebrate, fall, getUp, captured, spawn, move; the king's shiver). The rigs are set at the origin (the file lays
them out in a row), each mesh kept where it stands on its own rig, so its bones turn it about its own axis (the export checks each mesh is
centred on its rig's origin); the Solidify outline shells and their Outline slot are stripped (the game draws its own outline); the light and the
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
    # each mesh keeps where it stands against its own rig (in the file, the mesh and its rig stand together at the rig's place in the row),
    # and the pair goes to the origin together. The mesh's place is its parent inverse as well as its location: the file parents each mesh
    # with an inverse that undoes the rig's place in the row (+15 for the pawn, +12 the rook, ... 0 the king), so zeroing the location
    # alone left the mesh that far off its rig, and every bone's turn swung the body round a pivot that far away (casebook, 2026-10-08)
    rel = {ob.name: rig.matrix_world.inverted() @ ob.matrix_world for ob in rig.children if ob.type == "MESH"}
    rig.location = (0, 0, 0)
    if rig.animation_data:
        rig.animation_data.action = None  # (its NLA tracks stay: they are how the exporter knows which rig an action moves)
    keep.append(rig)
    for ob in rig.children:
        if ob.type != "MESH":
            continue
        ob.matrix_parent_inverse.identity()
        ob.matrix_basis = rel[ob.name]
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

# the check: each mesh's vertices, in its rig's space, centred on the rig's origin across the floor (x and Blender's y: the glTF's x and z)
bpy.context.view_layer.update()
for rn in RIGS:
    rig = bpy.data.objects[rn]
    for ob in rig.children:
        if ob.type != "MESH":
            continue
        m = rig.matrix_world.inverted() @ ob.matrix_world
        vs = [m @ v.co for v in ob.data.vertices]
        cx = (min(v.x for v in vs) + max(v.x for v in vs)) / 2
        cy = (min(v.y for v in vs) + max(v.y for v in vs)) / 2
        print(f"{ob.name}: centre on its rig x {cx:+.4f} y {cy:+.4f}, base z {min(v.z for v in vs):+.4f}")
        if abs(cx) > 1e-3 or abs(cy) > 1e-3:
            print(f"  WARNING: {ob.name} stands off its rig's origin: its bones will swing it round a far pivot")

bpy.ops.object.select_all(action="DESELECT")
for o in keep:
    o.hide_set(False)
    o.select_set(True)
bpy.context.view_layer.objects.active = keep[0]
out = os.path.join(root, "src", "assets", "clips", "chess.bin")
# (the exporter adds ".glb" to any other name: written as a .glb beside it, then renamed to the .bin the board fetches)
tmp = out[:-4] + ".glb"
bpy.ops.export_scene.gltf(
    filepath=tmp, export_format="GLB", use_selection=True, export_apply=True,
    export_yup=True, export_skins=True, export_animations=True,
    export_animation_mode="ACTIONS", export_force_sampling=True,
    export_image_format="NONE", export_materials="EXPORT", export_def_bones=False, export_frame_range=False,
)
os.replace(tmp, out)
print("exported", out, os.path.getsize(out))
