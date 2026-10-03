"""The effect meshes, made in Blender: source_assets/vfx/effects.blend -> src/assets/vfx/<name>.glb (what the game loads).

    python3 -I tools/export_vfx.py                    every object in the "FX" collection, one GLB each, named for the object
    python3 -I tools/export_vfx.py --only ult_helix   some
    python3 -I tools/export_vfx.py --from-glb         (once) build effects.blend from the GLBs already in src/assets/vfx/
    python3 -I tools/export_vfx.py --import a.glb b.glb   add meshes made elsewhere (Mesh Create's bakes: tools/meshflow.mjs) to effects.blend

Needs the `bpy` module (pip install bpy==5.0.1) or run inside Blender:  blender -b source_assets/vfx/effects.blend -P tools/export_vfx.py

How to make one (the owner's way, in Blender):
  - A mesh object in the "FX" collection; its name is the effect mesh's name (the game asks for it by that name: vfx/library.js).
  - Its UVs flow: custom properties on the OBJECT say how (Object Properties > Custom Properties):
        fx_speedU, fx_speedV   texture scroll, tiles a second (V is usually along the mesh: a ribbon's length, a pillar's height)
        fx_blend               'additive' (default) or 'alpha'
        fx_side                'double' (default) or 'front'
  - Its texture: the first Image Texture node of its material (greyscale with alpha reads best: the game tints it).
  - Vertex colour (a Color Attribute, its alpha too) multiplies the texture: paint alpha to fade edges.
  - The preview in Blender scrolls too: the material's Mapping node is driven by the frame (from fx_speedU / fx_speedV).
  Metres, Y up in the game (Blender's Z up: the exporter turns it). Keep it low-poly: a few hundred to a couple of thousand triangles.
"""
import sys, os, json
import bpy

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLEND = os.path.join(ROOT, "source_assets", "vfx", "effects.blend")
OUT = os.path.join(ROOT, "src", "assets", "vfx")
only = args[args.index("--only") + 1].split(",") if "--only" in args else None


def fx_collection():
    c = bpy.data.collections.get("FX")
    if not c:
        c = bpy.data.collections.new("FX")
        bpy.context.scene.collection.children.link(c)
    return c


def drive_scroll(ob):
    """The material's UV offset driven by the frame, from the object's fx_speedU / fx_speedV, so the preview flows."""
    for slot in ob.material_slots:
        m = slot.material
        if not m or not m.use_nodes:
            continue
        nt = m.node_tree
        tex = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None)
        if not tex:
            continue
        mp = next((n for n in nt.nodes if n.type == "MAPPING"), None)
        if not mp:
            uv = nt.nodes.new("ShaderNodeTexCoord")
            mp = nt.nodes.new("ShaderNodeMapping")
            nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
            nt.links.new(mp.outputs["Vector"], tex.inputs["Vector"])
        loc = mp.inputs["Location"]
        for i, key in ((0, "fx_speedU"), (1, "fx_speedV")):
            loc.driver_remove("default_value", i)
            d = loc.driver_add("default_value", i).driver
            d.type = "SCRIPTED"
            v = d.variables.new(); v.name = "s"; v.type = "SINGLE_PROP"
            v.targets[0].id_type = "OBJECT"; v.targets[0].id = ob; v.targets[0].data_path = f'["{key}"]'
            d.expression = "-frame / 24 * s" if i == 1 else "frame / 24 * s"


def from_glb():
    """Build effects.blend from the baked GLBs (their motion read from the extras Mesh Create wrote)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = fx_collection()
    names = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith(".glb"))
    x = 0.0
    for name in names:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, name + ".glb"))
        new = [o for o in bpy.data.objects if o not in before]
        mesh = next((o for o in new if o.type == "MESH"), None)
        if not mesh:
            continue
        # the motion Mesh Create left in the extras (on the mesh object, or its data)
        mf = mesh.get("meshFlow") or (mesh.data.get("meshFlow") if mesh.data else None) or {}
        mf = mf.to_dict() if hasattr(mf, "to_dict") else dict(mf)
        motion = dict(mf.get("motion", {})) if mf else {}
        for o in new:
            for c in list(o.users_collection):
                c.objects.unlink(o)
        mesh.parent = None
        col.objects.link(mesh)
        for o in new:
            if o is not mesh:
                bpy.data.objects.remove(o, do_unlink=True)
        mesh.name = name
        if mesh.data: mesh.data.name = name
        for k in [k for k in mesh.keys()]:
            del mesh[k]
        mesh["fx_speedU"] = float(motion.get("speedU", 0.0))
        mesh["fx_speedV"] = float(motion.get("speedV", 0.0))
        mesh["fx_blend"] = str(mf.get("blend", "additive")) if mf else "additive"
        mesh["fx_side"] = str(mf.get("side", "double")) if mf else "double"
        mesh.location.x = x
        x += max(2.5, mesh.dimensions.x + 1.0)
        drive_scroll(mesh)
    for img in bpy.data.images:
        if img.size[0] and not img.packed_file:
            img.pack()
    bpy.context.scene.frame_end = 240
    os.makedirs(os.path.dirname(BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND, compress=True)
    print("built", BLEND, "with", len(names), "meshes")


def export():
    if bpy.data.filepath != BLEND:
        bpy.ops.wm.open_mainfile(filepath=BLEND)
    col = bpy.data.collections.get("FX")
    if not col:
        sys.exit("no FX collection in " + BLEND)
    os.makedirs(OUT, exist_ok=True)
    for ob in col.objects:
        if ob.type != "MESH" or (only and ob.name not in only):
            continue
        # one object, at the origin, its transforms applied in the export (the game places it)
        loc = ob.location.copy()
        ob.location = (0, 0, 0)
        bpy.ops.object.select_all(action="DESELECT")
        ob.hide_set(False); ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        # the motion as the game reads it (the same shape Mesh Create's extras had: vfx/meshfx.js)
        ob["meshFlow"] = {"motion": {"speedU": float(ob.get("fx_speedU", 0)), "speedV": float(ob.get("fx_speedV", 0)), "rate": 1},
                          "blend": str(ob.get("fx_blend", "additive")), "side": str(ob.get("fx_side", "double")), "source": "blender"}
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, ob.name + ".glb"), export_format="GLB", use_selection=True,
                                  export_apply=True, export_yup=True, export_extras=True, export_texcoords=True, export_normals=True,
                                  export_materials="EXPORT", export_animations=False, export_vertex_color="ACTIVE")
        del ob["meshFlow"]
        ob.location = loc
        print("exported", ob.name)


def import_glbs(paths):
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    col = fx_collection()
    for path in paths:
        name = os.path.basename(path)[:-4]
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        new = [o for o in bpy.data.objects if o not in before]
        mesh = next((o for o in new if o.type == "MESH"), None)
        if not mesh:
            continue
        mf = mesh.get("meshFlow") or {}
        mf = mf.to_dict() if hasattr(mf, "to_dict") else dict(mf)
        motion = dict(mf.get("motion", {}))
        for o in new:
            for c in list(o.users_collection):
                c.objects.unlink(o)
        mesh.parent = None; col.objects.link(mesh)
        for o in new:
            if o is not mesh:
                bpy.data.objects.remove(o, do_unlink=True)
        mesh.name = name
        for k in list(mesh.keys()):
            del mesh[k]
        mesh["fx_speedU"] = float(motion.get("speedU", 0.0)); mesh["fx_speedV"] = float(motion.get("speedV", 0.0))
        mesh["fx_blend"] = str(mf.get("blend", "additive")); mesh["fx_side"] = str(mf.get("side", "double"))
        drive_scroll(mesh)
        print("imported", name)
    for img in bpy.data.images:
        if img.size[0] and not img.packed_file:
            img.pack()
    bpy.ops.wm.save_mainfile(compress=True)


if "--import" in args:
    import_glbs(args[args.index("--import") + 1:])
elif "--from-glb" in args:
    from_glb()
else:
    export()
