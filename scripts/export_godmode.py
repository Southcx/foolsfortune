"""Export the god-mode assets: the god hand (its rig and its 32 clips) and the Pneuka Jar (its rig and its 17 clips).

Usage:  python3 -I scripts/export_godmode.py        (from the repo root; never saves a .blend: bpy here is older than the files)
Reads   source_assets/Courier/courier_godhand.blend  (the hand: `metarig`, 18 bones with `godhand_root` and `palm.R`, mesh `GodHand`)
        source_assets/Courier/courier_pneuka.blend   (the Jar: `PneukaJar_Rig`, 5 bones with the non-deforming `root`, mesh `Courier_PneukaJar`)
        (the copies at source_assets/ root, courier_godhand.blend and courier_pneuka.blend, are the older unrigged ones: superseded, kept)
Writes  src/assets/godhand.glb and src/assets/pneuka.glb (the names main.js loads).

Every action becomes a clip (ACTIONS mode, sampled at the scene's 30 fps, each slid to start at 0 so a loop has no held frame at its
seam). Lean: a bone channel with no F-curve that never changes is dropped (the fingers' location and scale), a keyed constant one
keeps two keys; then `lean()` drops the sampled keys a straight line gives back (within 0.06 degrees, 0.1 mm), stores rotations as
normalized shorts and packs the keys in one buffer view (the hand 714,260 -> 428,428 bytes; the Jar 189,304 -> 174,360). The armature stays in POSE: REST flattens every clip to two keys of the rest pose (jar.md, measured). The Jar keeps
its `root` (it carries the hop's height and the summon and dismiss scale), so non-deforming bones are exported. The Solidify outline
shells are dropped: the game draws its own outlines (render/outline.js). The textures are not embedded: the game paints them
(godhand/godpaint.js, from src/assets/courier/).
"""
import os
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(root, "source_assets", "Courier")
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


def export(blend, rig_name, mesh_name, name):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(src_dir, blend))
    rig, mesh = bpy.data.objects[rig_name], bpy.data.objects[mesh_name]
    for a in bpy.data.actions:
        a.use_fake_user = True  # (every action a clip, used or not)
    rig.data.pose_position = "POSE"
    if rig.animation_data:
        rig.animation_data.action = None
        for t in list(rig.animation_data.nla_tracks):
            rig.animation_data.nla_tracks.remove(t)
    for p in rig.pose.bones:  # (the nodes' own transforms are the rest pose)
        p.location = (0, 0, 0)
        p.rotation_quaternion = (1, 0, 0, 0)
        p.rotation_euler = (0, 0, 0)
        p.scale = (1, 1, 1)
    strip_outline(mesh)
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in (rig, mesh):
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    out = os.path.join(out_dir, name)
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
        export_texcoords=True, export_normals=True, export_materials="EXPORT", export_image_format="NONE",
        export_skins=True, export_def_bones=False, export_rest_position_armature=True,
        export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True, export_frame_range=False,
        export_anim_slide_to_zero=True, export_optimize_animation_size=True,
        export_optimize_animation_keep_anim_armature=False,
    )
    raw = os.path.getsize(out)
    lean(out)
    print("exported", out, raw, "->", os.path.getsize(out), "bytes,", len(bpy.data.actions), "actions")


# ---- lean clips: the sampled keys a straight line (a slerp, for a rotation) already gives are dropped, and rotations are stored as
# normalized shorts (core glTF 2.0 allows it for rotation outputs; GLTFLoader scales them back). The boot heap holds every asset twice
# (the bundle's text and the string), so bytes here are heap. A key goes only if every pose it stood for is kept within 0.001 rad
# (0.06 degrees) of a rotation, 0.1 mm of a position, 0.0001 of a scale; the first and last keys always stay (loops stay closed).
TOL = {"rotation": 1e-3, "translation": 1e-4, "scale": 1e-4}
SIZE = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
CTYPE = {5120: ("b", 1), 5121: ("B", 1), 5122: ("h", 2), 5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}


def lean(glb):
    import json, struct
    import numpy as np
    data = open(glb, "rb").read()
    jl = struct.unpack_from("<I", data, 12)[0]
    js = json.loads(data[20:20 + jl])
    bo = 20 + jl
    bl = struct.unpack_from("<I", data, bo)[0]
    blob = data[bo + 8:bo + 8 + bl]
    acc, views = js["accessors"], js["bufferViews"]

    def view_bytes(vi):
        v = views[vi]
        return blob[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]

    def read(ai):
        a = acc[ai]
        fmt, size = CTYPE[a["componentType"]]
        n, c = a["count"], SIZE[a["type"]]
        v = views[a["bufferView"]]
        assert v.get("byteStride", size * c) == size * c and not a.get("normalized"), "a clip's accessor packed as Blender packs it"
        raw = view_bytes(a["bufferView"])[a.get("byteOffset", 0):]
        return np.frombuffer(raw, dtype=np.dtype("<" + fmt), count=n * c).astype(np.float64).reshape(n, c)

    def slerp(qa, qb, u):
        d = float(np.dot(qa, qb))
        if d < 0:
            qb, d = -qb, -d
        if d > 0.9995:
            q = qa + (qb - qa) * u[:, None]
        else:
            th = np.arccos(min(1.0, d))
            q = (np.sin((1 - u) * th)[:, None] * qa + np.sin(u * th)[:, None] * qb) / np.sin(th)
        return q / np.linalg.norm(q, axis=1)[:, None]

    def fits(t, v, a, z, path):
        if z - a < 2:
            return True
        u = (t[a + 1:z] - t[a]) / (t[z] - t[a])
        mid = v[a + 1:z]
        if path == "rotation":
            q = slerp(v[a], v[z], u)
            d = np.abs(np.sum(q * mid, axis=1)) / np.linalg.norm(mid, axis=1)
            return bool(np.all(2 * np.arccos(np.clip(d, -1, 1)) <= TOL[path]))
        lin = v[a] + (v[z] - v[a]) * u[:, None]
        return bool(np.all(np.abs(lin - mid) <= TOL[path]))

    # the accessors the clips read are rebuilt; everything else is copied as it was
    anim_acc = {s[k] for an in js.get("animations", []) for s in an["samplers"] for k in ("input", "output")}
    new_views, new_acc, out = [], [], bytearray()
    amap, vmap = {}, {}

    def add_view(b, target=None):
        while len(out) % 4:
            out.append(0)
        v = {"buffer": 0, "byteOffset": len(out), "byteLength": len(b)}
        if target:
            v["target"] = target
        out.extend(b)
        new_views.append(v)
        return len(new_views) - 1

    for i, a in enumerate(acc):
        if i in anim_acc:
            continue
        a = dict(a)
        if "bufferView" in a:
            vi = a["bufferView"]
            if vi not in vmap:
                old = views[vi]
                vmap[vi] = add_view(view_bytes(vi), old.get("target"))
                if "byteStride" in old:
                    new_views[vmap[vi]]["byteStride"] = old["byteStride"]
            a["bufferView"] = vmap[vi]
        amap[i] = len(new_acc)
        new_acc.append(a)
    shared, pack = {}, bytearray()  # (every clip's keys in one buffer view: an accessor apiece, a view apiece, was most of the JSON)

    def add_acc(arr, ctype, typ, normalized=False, minmax=False):
        fmt = CTYPE[ctype][0]
        b = np.asarray(arr).astype("<" + fmt).tobytes()
        key = (b, ctype, typ)
        if key in shared:
            return shared[key]
        while len(pack) % 4:
            pack.append(0)
        a = {"bufferView": -1, "byteOffset": len(pack), "componentType": ctype, "count": int(np.asarray(arr).size // SIZE[typ]), "type": typ}
        pack.extend(b)
        if normalized:
            a["normalized"] = True
        if minmax:
            f32 = lambda x: float(np.format_float_positional(np.float32(x)))  # (the shortest text that is the float32 itself)
            a["min"], a["max"] = [f32(np.min(arr))], [f32(np.max(arr))]
        new_acc.append(a)
        shared[key] = len(new_acc) - 1
        return shared[key]

    keys = [0, 0]
    for an in js.get("animations", []):
        path_of = {ch["sampler"]: ch["target"]["path"] for ch in an["channels"]}
        for si, s in enumerate(an["samplers"]):
            t, v = read(s["input"])[:, 0], read(s["output"])
            what = path_of.get(si, "translation")
            keep, a = [0], 0
            if s.get("interpolation", "LINEAR") == "LINEAR" and len(t) > 2:
                for z in range(2, len(t)):
                    if not fits(t, v, a, z, what):
                        keep.append(z - 1)
                        a = z - 1
            else:
                keep = list(range(len(t) - 1))
            if len(t) > 1:
                keep.append(len(t) - 1)
            keys[0] += len(t)
            keys[1] += len(keep)
            tt, vv = t[keep].astype(np.float32), v[keep]
            s["input"] = add_acc(tt, 5126, "SCALAR", minmax=True)
            if what == "rotation":
                vv = vv / np.linalg.norm(vv, axis=1)[:, None]
                s["output"] = add_acc(np.round(np.clip(vv, -1, 1) * 32767).reshape(-1), 5122, "VEC4", normalized=True)
            else:
                s["output"] = add_acc(vv.astype(np.float32).reshape(-1), 5126, "VEC3")
    if pack:
        pv = add_view(bytes(pack))
        for a in new_acc:
            if a.get("bufferView") == -1:
                a["bufferView"] = pv
    for m in js.get("meshes", []):
        for p in m["primitives"]:
            p["attributes"] = {k: amap[x] for k, x in p["attributes"].items()}
            if "indices" in p:
                p["indices"] = amap[p["indices"]]
            for tg in p.get("targets", []):
                for k in tg:
                    tg[k] = amap[tg[k]]
    for sk in js.get("skins", []):
        if "inverseBindMatrices" in sk:
            sk["inverseBindMatrices"] = amap[sk["inverseBindMatrices"]]
    js["accessors"], js["bufferViews"] = new_acc, new_views
    while len(out) % 4:
        out.append(0)
    js["buffers"] = [{"byteLength": len(out)}]
    jb = json.dumps(js, separators=(",", ":")).encode()
    jb += b" " * ((4 - len(jb) % 4) % 4)
    total = 12 + 8 + len(jb) + 8 + len(out)
    with open(glb, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(jb), 0x4E4F534A) + jb)
        f.write(struct.pack("<II", len(out), 0x004E4942) + bytes(out))
    print("  lean clips:", keys[0], "keys ->", keys[1])


export("courier_godhand.blend", "metarig", "GodHand", "godhand.glb")
export("courier_pneuka.blend", "PneukaJar_Rig", "Courier_PneukaJar", "pneuka.glb")
