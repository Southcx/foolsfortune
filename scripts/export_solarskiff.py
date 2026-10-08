"""Export the owner's Solar Skiff: source_assets/Courier/courier_solarskiff.blend -> src/assets/solarskiff.glb (skinned, its own clips).

Usage (from the repo root; -I so a file in the cwd named like a stdlib module cannot break `import bpy`):
    python3 -I scripts/export_solarskiff.py

What it does, all in memory (the .blend was saved by Blender 5.2; bpy here is older, and saving from it loses data: it is never saved):
  - the hull's image `tx_couriership_base1k` (a path outside the repo) is pointed at the owner's painting,
    source_assets/Courier/courier_solarskiff_hull.png (12.png, 2026-10-08), and embedded with the cloth's and the fittings' packed images;
  - the outline shells (Solidify + the Outline slot) are stripped: the game draws its own (render/outline.js);
  - the hull and both oars (one material) are joined into one mesh: two draw calls fewer, and their outlines and shadows with them;
  - the names say what they are in the glossary's words (the skiff is not a ship: "ship" is the Emocean's form): Skiff_Rig, Skiff_Hull,
    Skiff_Rigging, Skiff_Cloth; the materials Skiff_Hull, Skiff_Parts, Skiff_Cloth (CourierEnergy keeps the Courier's own name);
  - only the 15 board clips that partner the rider's (`Courier_Skiff_*__Ship_Rig`) are kept, renamed as the rider's are (Skiff_Summon, ...,
    the same names and frames as courier_anims_skiff.glb's); the rowing, the old hoist and the older lowercase actions are dropped;
  - after the export the glb is rewritten (stdlib only): every channel that never leaves its bone's rest is dropped (the game resets the
    bones to rest before it samples: courier/skiff/boatpose.js), one that holds a pose still is cut to a single key, the skin's weights
    are stored as bytes and the UVs as shorts (core glTF, normalized), and the buffer is packed again without what they used
    (1,405,276 bytes as Blender writes it, 847,488 after: 2,541 of 2,880 channels dropped).

Prior art: export_clapperjar.py (skinned, actions as clips, NLA cleared, force sampling) and export_godmode.py's strip_outline; the
post-pass is what gltf-transform's prune and resample do, written out because the repo has no dependency for it.
"""
import json, os, struct, sys
from array import array
import bpy

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "source_assets", "Courier", "courier_solarskiff.blend")
hull_png = os.path.join(root, "source_assets", "Courier", "courier_solarskiff_hull.png")
out = os.path.join(root, "src", "assets", "solarskiff.glb")
bpy.ops.wm.open_mainfile(filepath=src)

# ---- the hull's painting, in memory
img = bpy.data.images["tx_couriership_base1k"]
img.filepath = hull_png
img.reload()
img.name = "solarskiff_hull"

# ---- names in the glossary's words
RENAME_OBJ = {"Ship_Rig": "Skiff_Rig", "Courier_Ship": "Skiff_Hull", "Courier_Ship_Oar.L": "Skiff_Oar.L", "Courier_Ship_Oar.R": "Skiff_Oar.R",
              "Ship_Rigging": "Skiff_Rigging", "Ship_Cloth": "Skiff_Cloth"}
RENAME_MAT = {"Courier_Ship": "Skiff_Hull", "Ship_Parts": "Skiff_Parts", "Ship_Cloth": "Skiff_Cloth"}
for a, b in RENAME_OBJ.items():
    bpy.data.objects[a].name = b
    if bpy.data.objects[b].type == "MESH":
        bpy.data.objects[b].data.name = b
for a, b in RENAME_MAT.items():
    bpy.data.materials[a].name = b
for im in bpy.data.images:
    if im.name.startswith("tx_ship_"):
        im.name = "solarskiff_" + im.name[len("tx_ship_"):].replace(".png", "")

rig = bpy.data.objects["Skiff_Rig"]
MESHES = ["Skiff_Hull", "Skiff_Oar.L", "Skiff_Oar.R", "Skiff_Rigging", "Skiff_Cloth"]


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


for n in MESHES:
    strip_outline(bpy.data.objects[n])
for n in MESHES:
    ob = bpy.data.objects[n]
    for ca in list(ob.data.color_attributes):
        ob.data.color_attributes.remove(ca)  # (the hull's vertex colour is white everywhere)

# ---- the hull and its oars as one mesh (one material: one draw)
hull = bpy.data.objects["Skiff_Hull"]
oars = [bpy.data.objects["Skiff_Oar.L"], bpy.data.objects["Skiff_Oar.R"]]
for o in bpy.context.view_layer.objects:
    o.select_set(False)
for o in [hull] + oars:
    o.hide_set(False)
    o.select_set(True)
bpy.context.view_layer.objects.active = hull
with bpy.context.temp_override(active_object=hull, object=hull, selected_objects=[hull] + oars, selected_editable_objects=[hull] + oars):
    bpy.ops.object.join()
MESHES = ["Skiff_Hull", "Skiff_Rigging", "Skiff_Cloth"]

# ---- only the board's partners of the rider's clips, named as the rider's are
kept = []
for a in list(bpy.data.actions):
    if a.name.startswith("Courier_Skiff_") and a.name.endswith("__Ship_Rig"):
        a.name = a.name[len("Courier_"):-len("__Ship_Rig")]
        a.use_fake_user = True
        kept.append(a.name)
    else:
        bpy.data.actions.remove(a)
assert len(kept) == 15, kept
ad = rig.animation_data
ad.action = None
for t in list(ad.nla_tracks):
    ad.nla_tracks.remove(t)
rig.data.pose_position = "POSE"
for pb in rig.pose.bones:  # (the rest pose under every clip: nothing left over from the file's last frame)
    pb.location = (0, 0, 0)
    pb.rotation_quaternion = (1, 0, 0, 0)
    pb.scale = (1, 1, 1)

for o in bpy.context.view_layer.objects:
    o.select_set(False)
for n in ["Skiff_Rig"] + MESHES:
    o = bpy.data.objects[n]
    o.hide_set(False)
    o.select_set(True)
bpy.context.view_layer.objects.active = rig

bpy.ops.export_scene.gltf(
    filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
    export_skins=True, export_def_bones=False, export_animations=True, export_animation_mode="ACTIONS",
    export_force_sampling=True, export_image_format="AUTO", export_materials="EXPORT", export_extras=True,
    export_vertex_color="NONE",
)
raw = os.path.getsize(out)


# ---------------------------------------------------------------------------------------------- the post-pass
def read_glb(path):
    b = open(path, "rb").read()
    magic, ver, length = struct.unpack_from("<III", b, 0)
    assert magic == 0x46546C67
    jl, jt = struct.unpack_from("<II", b, 12)
    J = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl, bt = struct.unpack_from("<II", b, off)
    return J, bytearray(b[off + 8:off + 8 + bl])


def write_glb(path, J, bin_):
    js = json.dumps(J, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    bin_ = bytes(bin_) + b"\0" * ((4 - len(bin_) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(bin_)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(bin_), 0x004E4942)); f.write(bin_)


NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def floats(J, bin_, ai):
    a = J["accessors"][ai]
    assert a["componentType"] == 5126
    bv = J["bufferViews"][a["bufferView"]]
    n = a["count"] * NCOMP[a["type"]]
    o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    v = array("f")
    v.frombytes(bytes(bin_[o:o + n * 4]))
    return v


J, BIN = read_glb(out)
REST = {"translation": [0, 0, 0], "rotation": [0, 0, 0, 1], "scale": [1, 1, 1]}
EPS = 1e-4
dropped = held = 0
one_key = {}  # (an animation's single time: one accessor for every held channel of it)


def add_floats(vals, typ, minmax=False):
    global BIN
    while len(BIN) % 4:
        BIN.append(0)
    o = len(BIN)
    BIN += array("f", vals).tobytes()
    J["bufferViews"].append({"buffer": 0, "byteOffset": o, "byteLength": len(vals) * 4})
    acc = {"bufferView": len(J["bufferViews"]) - 1, "componentType": 5126, "count": len(vals) // NCOMP[typ], "type": typ}
    if minmax:
        acc["min"] = [min(vals)]; acc["max"] = [max(vals)]
    J["accessors"].append(acc)
    return len(J["accessors"]) - 1


for ai, anim in enumerate(J.get("animations", [])):
    chans, samps = [], []
    for ch in anim["channels"]:
        s = anim["samplers"][ch["sampler"]]
        path, node = ch["target"]["path"], J["nodes"][ch["target"]["node"]]
        w = 4 if path == "rotation" else 3
        v = floats(J, BIN, s["output"])
        first = v[:w]
        const = all(abs(v[i] - first[i % w]) < EPS for i in range(len(v)))
        if const:
            rest = node.get(path, REST[path])
            same = all(abs(first[i] - rest[i]) < EPS for i in range(w))
            if path == "rotation" and not same:  # (q and -q are one rotation)
                same = all(abs(first[i] + rest[i]) < EPS for i in range(w))
            if same:
                dropped += 1
                continue
            if ai not in one_key:
                t0 = floats(J, BIN, s["input"])[0]
                one_key[ai] = add_floats([t0], "SCALAR", True)
            s = {"input": one_key[ai], "output": add_floats(list(first), "VEC4" if w == 4 else "VEC3"), "interpolation": "LINEAR"}
            held += 1
        samps.append(s)
        chans.append({"sampler": len(samps) - 1, "target": ch["target"]})
    anim["channels"], anim["samplers"] = chans, samps

# the skin's weights as bytes and the UVs as shorts (both core glTF 2.0, normalized; the weights are rigid but for the cloth's)
def add_ints(vals, typ, comp):
    global BIN
    while len(BIN) % 4:
        BIN.append(0)
    o = len(BIN)
    BIN += array("B" if comp == 5121 else "H", vals).tobytes()
    J["bufferViews"].append({"buffer": 0, "byteOffset": o, "byteLength": len(vals) * (1 if comp == 5121 else 2), "target": 34962})
    J["accessors"].append({"bufferView": len(J["bufferViews"]) - 1, "componentType": comp, "normalized": True, "count": len(vals) // NCOMP[typ], "type": typ})
    return len(J["accessors"]) - 1


quant = 0
for m in J["meshes"]:
    for p in m["primitives"]:
        A = p["attributes"]
        w = floats(J, BIN, A["WEIGHTS_0"])
        q = []
        for i in range(0, len(w), 4):
            s = sum(w[i:i + 4]) or 1
            b4 = [round(255 * x / s) for x in w[i:i + 4]]
            b4[b4.index(max(b4))] += 255 - sum(b4)  # (the bytes of one vertex still sum to 255)
            q += b4
        A["WEIGHTS_0"] = add_ints(q, "VEC4", 5121)
        uv = floats(J, BIN, A["TEXCOORD_0"])
        if min(uv) >= 0 and max(uv) <= 1:
            A["TEXCOORD_0"] = add_ints([round(x * 65535) for x in uv], "VEC2", 5123)
            quant += 1
for im in J.get("images", []):
    im["name"] = {"tx_ship_cloth": "solarskiff_cloth", "tx_ship_parts": "solarskiff_parts", "courier_solarskiff_hull": "solarskiff_hull"}.get(im["name"], im["name"])

# pack: keep the accessors and buffer views something still uses, in order
used_acc = set()
for m in J["meshes"]:
    for p in m["primitives"]:
        used_acc.update(p["attributes"].values())
        if "indices" in p:
            used_acc.add(p["indices"])
for sk in J.get("skins", []):
    if "inverseBindMatrices" in sk:
        used_acc.add(sk["inverseBindMatrices"])
for anim in J.get("animations", []):
    for s in anim["samplers"]:
        used_acc.update([s["input"], s["output"]])
acc_map = {a: i for i, a in enumerate(sorted(used_acc))}
used_bv = sorted({J["accessors"][a]["bufferView"] for a in used_acc} | {im["bufferView"] for im in J.get("images", []) if "bufferView" in im})
bv_map, nb = {}, bytearray()
for i, b in enumerate(used_bv):
    bv = J["bufferViews"][b]
    while len(nb) % 4:
        nb.append(0)
    o = bv.get("byteOffset", 0)
    chunk = BIN[o:o + bv["byteLength"]]
    bv["byteOffset"] = len(nb)
    nb += chunk
    bv_map[b] = i
J["bufferViews"] = [J["bufferViews"][b] for b in used_bv]
J["accessors"] = [J["accessors"][a] for a in sorted(used_acc)]
for a in J["accessors"]:
    a["bufferView"] = bv_map[a["bufferView"]]
for im in J.get("images", []):
    if "bufferView" in im:
        im["bufferView"] = bv_map[im["bufferView"]]
for m in J["meshes"]:
    for p in m["primitives"]:
        p["attributes"] = {k: acc_map[v] for k, v in p["attributes"].items()}
        if "indices" in p:
            p["indices"] = acc_map[p["indices"]]
for sk in J.get("skins", []):
    if "inverseBindMatrices" in sk:
        sk["inverseBindMatrices"] = acc_map[sk["inverseBindMatrices"]]
for anim in J.get("animations", []):
    for s in anim["samplers"]:
        s["input"], s["output"] = acc_map[s["input"]], acc_map[s["output"]]
J["buffers"][0]["byteLength"] = len(nb)
write_glb(out, J, nb)
print("exported", out, "raw", raw, "packed", os.path.getsize(out), "channels dropped", dropped, "held to one key", held,
      "kept", sum(len(a["channels"]) for a in J["animations"]), "clips", len(J["animations"]), "uv sets as shorts", quant)
