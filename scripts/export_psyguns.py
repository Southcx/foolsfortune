"""Build the owner's three psygun variants on the owner's own psygun: src/assets/psygun.glb (THE PSYGUN, the Pentagun's model) ->
src/assets/psygun_bombardier.glb (a flare gun), psygun_carbine.glb (a rifle), psygun_pepperbox.glb (a shotgun). The owner, 2026-10-18:
"make 3d models for the Bombardier, Carbine, and Pepperbox-type Psyguns, using my Pentagun Psygun as reference ... a flare gun, rifle, and
shotgun respectively."

Usage (from the repo root; -I so a file in the cwd named like a stdlib module cannot break `import bpy`):
    python3 -I scripts/export_psyguns.py

What it does, all in memory (nothing is saved but the three glbs):
  - imports the reference and splits its one mesh into its six loose parts (measured, glTF units, +X barrel, +Y up, +Z right):
    the barrel block (x 0.112..0.343), the yoke (-0.064..0.113), the rear sight and its energy diamond (-0.157..-0.032), the hammer
    block (-0.262..-0.161), the frame and grip (-0.361..-0.055, down to y -0.179), and the cylinder, a sphere of CourierEnergyShell
    (centre x 0.056, r 0.068). Every variant keeps the reference's frame, grip, hammer block, rear sight and yoke as they are, so the
    hands (character.js GUN_POINTS gripR, gripL) fit as they do, and replaces the barrel and the cylinder with its own;
  - each variant's cylinder is its chamber count's shape, the shape the overlay's cylinder draws (docs/plans/OVERLAY.md 18, board v9):
    the Bombardier a round drum (no corners, one bore, eight studs), the Carbine a triangle (a chamber at each corner, the barrel at the
    top corner), the Pepperbox a hexagon round a heart (six barrels round a seventh, a pepperbox). Where a chamber is, the energy glows:
    the triangle's and the hexagon's corner chamfers, each bore's mouth, the drum's band;
  - in the reference's own hand: low facets, every block chamfered, the dark CourierEnergy body with lines and bores of the glowing
    CourierEnergyShell. The two materials keep their names, so courier/character.js's gun materials (the fade, the charge's glow) take
    them as they take the reference's; flat shaded, no custom normals, no UVs needed (the game's gun materials are untextured).

Prior art: export_clapperjar.py and export_chess.py (the export call); the flare gun after the break-open signal pistol (the Webley
No. 1 and the Orion's fat bore and short tube), the rifle after the carbine's skeleton stock and handguard (the M1 carbine's line, the
skeleton stocks of the Mosin's obrez kits), the shotgun after the pepperbox revolver (Allen's, 1837: the chambers are the barrels) and
the revolving shotgun's drum.
"""
import math, os
import bpy, bmesh

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ref = os.path.join(root, "src", "assets", "psygun.glb")
DARK, GLOW = 0, 1  # the reference's material slots: CourierEnergy (the body), CourierEnergyShell (the glow)


# ---------------------------------------------------------------- a piece: glTF-space vertices (x barrel, y up, z right) and faces
class Piece:
    def __init__(self):
        self.v, self.f = [], []  # f: (indices, material)

    def add(self, other):
        o = len(self.v)
        self.v += other.v
        self.f += [(tuple(i + o for i in idx), m) for idx, m in other.f]
        return self


def shrink(pts, d):
    """A profile drawn in by d toward its centroid (a chamfer's inner loop)."""
    cy = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
    out = []
    for y, z in pts:
        dy, dz = y - cy, z - cz; l = math.hypot(dy, dz) or 1
        k = max(0.0, l - d) / l
        out.append((cy + dy * k, cz + dz * k))
    return out


def loft(sections, side_mat=lambda i, s: DARK, cap0=DARK, cap1=DARK):
    """Loops of (x, [(y, z)...]) joined by quads, capped at both ends. side_mat(i, s): the material of edge i's quad in span s."""
    P = Piece(); n = len(sections[0][1])
    for x, pts in sections:
        P.v += [(x, y, z) for y, z in pts]
    for s in range(len(sections) - 1):
        a, b = s * n, (s + 1) * n
        for i in range(n):
            j = (i + 1) % n
            P.f.append(((a + i, a + j, b + j, b + i), side_mat(i, s)))
    P.f.append((tuple(reversed(range(n))), cap0))
    last = (len(sections) - 1) * n
    P.f.append((tuple(range(last, last + n)), cap1))
    return P


def ngon(n, r, cy=0.0, cz=0.0, rot=0.0):
    """n corners on a circle round (cy, cz) in the y-z plane; rot 0 puts a corner at the top (+y)."""
    return [(cy + r * math.cos(rot + 2 * math.pi * k / n), cz + r * math.sin(rot + 2 * math.pi * k / n)) for k in range(n)]


def chamfered(pts, c):
    """Each corner cut by c along both its edges: 2n points; the cut faces are the even edges (0-1, 2-3, ...)."""
    out = []; n = len(pts)
    for k in range(n):
        p, a, b = pts[k], pts[k - 1], pts[(k + 1) % n]
        for q in (a, b):
            dy, dz = q[0] - p[0], q[1] - p[1]; l = math.hypot(dy, dz)
            out.append((p[0] + dy / l * c, p[1] + dz / l * c))
    return out


def rect(y0, y1, z0, z1, c):
    return chamfered([(y1, z1), (y1, z0), (y0, z0), (y0, z1)], c)


def prism(pts, x0, x1, b=0.006, side_mat=lambda i: DARK, cap0=DARK, cap1=DARK):
    """A profile run along X from x0 to x1 with both ends chamfered by b (the reference's bevelled blocks)."""
    inner = shrink(pts, b)
    return loft([(x0, inner), (x0 + b, pts), (x1 - b, pts), (x1, inner)],
                side_mat=lambda i, s: side_mat(i) if s == 1 else DARK, cap0=cap0, cap1=cap1)


def tube(n, r, cy, cz, x0, x1, b=0.004, mouth=None, rot=None):
    """A round (n-gon) tube along X; mouth: the glow of its bore at x1, a disc of that radius set just proud."""
    rot = math.pi / n if rot is None else rot
    P = prism(ngon(n, r, cy, cz, rot), x0, x1, b)
    if mouth:
        P.add(prism(ngon(n, mouth, cy, cz, rot), x1 - 0.004, x1 + 0.003, 0.0015, cap0=GLOW, cap1=GLOW, side_mat=lambda i: GLOW))
    return P


def along_z(P, cx, cy):
    """A piece built along X about the origin turned to run along Z, set at (cx, cy)."""
    P.v = [(cx + z, cy + y, x) for x, y, z in P.v]
    P.f = [(tuple(reversed(idx)), m) for idx, m in P.f]  # (the turn mirrors it: keep the faces outward)
    return P


def radial(P, cx, ang, cy, cz):
    """Rotate a piece about the X axis through (cy, cz) by ang."""
    ca, sa = math.cos(ang), math.sin(ang)
    P.v = [(x, cy + (y - cy) * ca - (z - cz) * sa, cz + (y - cy) * sa + (z - cz) * ca) for x, y, z in P.v]
    return P


# ---------------------------------------------------------------- the three variants
def bombardier():
    """A FLARE GUN: one fat bore. A round drum, its single chamber, ringed by a glowing band and eight studs; a short fat tube with a
    flared mouth glowing whole; the break-open hinge under the breech and a top latch."""
    P = Piece(); cy = 0.005
    drum = ngon(16, 0.086, cy, 0, math.pi / 16)
    P.add(prism(drum, -0.03, 0.118, 0.012))
    P.add(prism(ngon(16, 0.089, cy, 0, math.pi / 16), 0.034, 0.052, 0.002, side_mat=lambda i: GLOW))  # the band: the chamber's glow
    for k in range(8):  # the eight studs, round the drum behind the band
        s = prism(rect(-0.009, 0.009, -0.009, 0.009, 0.003), 0.0, 0.022, 0.003)
        s.v = [(x, y + cy + 0.084, z) for x, y, z in s.v]
        P.add(radial(s, 0, 2 * math.pi * (k + 0.5) / 8, cy, 0))
    # the tube: fat, short, belled at the mouth
    tb = ngon(16, 0.058, cy, 0, math.pi / 16)
    P.add(loft([(0.112, shrink(tb, 0.006)), (0.118, tb), (0.250, tb), (0.268, ngon(16, 0.066, cy, 0, math.pi / 16)),
                (0.300, ngon(16, 0.070, cy, 0, math.pi / 16)), (0.306, ngon(16, 0.064, cy, 0, math.pi / 16))]))
    P.add(prism(ngon(16, 0.046, cy, 0, math.pi / 16), 0.300, 0.309, 0.002, cap1=GLOW, side_mat=lambda i: GLOW))  # the bore, glowing whole
    P.add(prism(ngon(16, 0.061, cy, 0, math.pi / 16), 0.180, 0.196, 0.003))  # a reinforcing ring on the tube
    # the hinge knuckle under the breech, and the barrel's lug to it
    P.add(along_z(tube(8, 0.018, 0, 0, -0.034, 0.034, 0.004), 0.122, -0.066))
    P.add(prism(rect(-0.075, -0.045, -0.022, 0.022, 0.006), 0.112, 0.17, 0.005))
    # the top latch, a thumb lever over the breech
    P.add(prism(rect(0.080, 0.100, -0.012, 0.012, 0.005), -0.035, 0.03, 0.006))
    P.add(prism(rect(0.094, 0.104, -0.006, 0.006, 0.003), -0.006, 0.020, 0.003, side_mat=lambda i: GLOW))
    return P, {"muzzle": (0.31, cy, 0), "front": (0.24, 0.063 + 0.018)}


def carbine():
    """A RIFLE: the triangle cylinder of three (a chamber at each corner, glowing on the corner's chamfer, the barrel at the top corner),
    a long slim barrel over a handguard with the energy line down both flanks, a muzzle brake, and a skeleton stock off the hammer block."""
    P = Piece(); cy = -0.026; by = 0.030  # the drum's axis, the barrel's (the top corner's chamber)
    tri = chamfered(ngon(3, 0.104, cy, 0, 0.0), 0.024)
    P.add(prism(tri, -0.035, 0.115, 0.010, side_mat=lambda i: GLOW if i % 2 == 0 else DARK))
    for k in range(3):  # each chamber's mouth on the front face
        a = 2 * math.pi * k / 3
        y, z = cy + 0.056 * math.cos(a), 0.056 * math.sin(a)
        P.add(prism(ngon(8, 0.016, y, z, math.pi / 8), 0.112, 0.121, 0.002, cap1=GLOW, side_mat=lambda i: GLOW))
    # the barrel, long and slim, from the top chamber
    P.add(tube(8, 0.021, by, 0, 0.110, 0.600, 0.004))
    # the handguard under it, chamfered, the energy line along each flank (the reference's barrel line, carried)
    hg = rect(-0.040, 0.040, -0.034, 0.034, 0.012)
    P.add(prism(hg, 0.112, 0.420, 0.010))
    for zs in (-1, 1):
        P.add(_flank(zs))
    for x in (0.200, 0.260, 0.320):  # grip grooves under the handguard
        P.add(prism(rect(-0.046, -0.038, -0.026, 0.026, 0.003), x, x + 0.022, 0.003))
    # the muzzle brake, its ports glowing
    P.add(prism(rect(by - 0.028, by + 0.028, -0.026, 0.026, 0.010), 0.590, 0.650, 0.008, cap1=DARK))
    for x in (0.604, 0.626):
        P.add(prism(rect(by - 0.010, by + 0.010, -0.0275, 0.0275, 0.004), x, x + 0.012, 0.002, side_mat=lambda i: GLOW))
    P.add(prism(ngon(8, 0.012, by, 0, math.pi / 8), 0.648, 0.654, 0.0015, cap1=GLOW, side_mat=lambda i: GLOW))
    # the skeleton stock: a top bar off the hammer block, a lower bar off the grip's back, a butt plate; the energy line on the top bar
    P.add(loft([(-0.235, rect(0.015, 0.065, -0.020, 0.020, 0.008)), (-0.32, rect(0.020, 0.062, -0.018, 0.018, 0.008)),
                (-0.60, rect(0.010, 0.046, -0.018, 0.018, 0.008))]))
    P.add(prism(rect(0.040, 0.050, -0.006, 0.006, 0.002), -0.56, -0.30, 0.003, side_mat=lambda i: GLOW, cap0=GLOW, cap1=GLOW))
    P.add(_bar((-0.345, -0.010), (-0.600, -0.075), 0.017, 0.016))
    P.add(prism(rect(-0.120, 0.060, -0.026, 0.026, 0.012), -0.640, -0.590, 0.010))
    P.add(prism(rect(-0.112, 0.052, -0.027, 0.027, 0.010), -0.650, -0.638, 0.004))  # the butt pad
    return P, {"muzzle": (0.655, by, 0), "front": (0.575, by + 0.021 + 0.018)}


def _flank(zs):
    """The Carbine's handguard energy line on one flank (z sign zs)."""
    z0, z1 = (0.034, 0.037) if zs > 0 else (-0.037, -0.034)
    return prism(rect(-0.006, 0.006, z0, z1, 0.0008), 0.135, 0.400, 0.003, side_mat=lambda i: GLOW, cap0=GLOW, cap1=GLOW)


def _bar(a, b, hy, hz):
    """A chamfered bar of half-height hy, half-width hz from (x, y) a to b in the x-y plane."""
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy)
    P = prism(rect(-hy, hy, -hz, hz, min(hy, hz) * 0.5), 0.0, L, 0.005)
    ca, sa = dx / L, dy / L
    P.v = [(x0 + x * ca - y * sa, y0 + x * sa + y * ca, z) for x, y, z in P.v]
    return P


def pepperbox():
    """A SHOTGUN: the pepperbox, six round a heart. A hexagonal drum, a corner up, its six corner chamfers glowing (a chamber each);
    seven barrels from it, the chambers run forward (six round the heart), each bore glowing, bound by a hexagonal collar at the mouth
    and a band; a pump forend under the bundle."""
    P = Piece(); cy = -0.004
    hexa = chamfered(ngon(6, 0.094, cy, 0, 0.0), 0.016)
    P.add(prism(hexa, -0.035, 0.120, 0.010, side_mat=lambda i: GLOW if i % 2 == 0 else DARK))
    P.add(prism(ngon(6, 0.026, cy, 0, 0.0), 0.118, 0.126, 0.002, cap1=GLOW, side_mat=lambda i: GLOW))  # the heart's seat, on the face
    rr, tr = 0.054, 0.023  # the ring of barrels' radius, a barrel's
    bores = [(cy, 0.0)] + [(cy + rr * math.cos(2 * math.pi * k / 6), rr * math.sin(2 * math.pi * k / 6)) for k in range(6)]
    for i, (y, z) in enumerate(bores):
        P.add(tube(8, tr if i else tr + 0.002, y, z, 0.118, 0.372, 0.004, mouth=0.012 if i else 0.014))
    coll = chamfered(ngon(6, 0.090, cy, 0, 0.0), 0.014)
    P.add(prism(coll, 0.318, 0.362, 0.008))
    P.add(prism(chamfered(ngon(6, 0.093, cy, 0, 0.0), 0.015), 0.332, 0.346, 0.002, side_mat=lambda i: GLOW))  # the collar's band
    P.add(prism(coll, 0.180, 0.205, 0.006))
    # the pump: a forend slide under the bundle, ribbed
    P.add(prism(rect(-0.118, -0.070, -0.030, 0.030, 0.012), 0.150, 0.300, 0.010))
    for x in (0.170, 0.200, 0.230, 0.260):
        P.add(prism(rect(-0.124, -0.112, -0.024, 0.024, 0.004), x, x + 0.016, 0.003))
    P.add(prism(rect(-0.080, -0.064, -0.010, 0.010, 0.004), 0.125, 0.315, 0.004))  # its rail
    top = cy + rr + tr
    return P, {"muzzle": (0.376, cy, 0), "front": (0.340, top + 0.014 + 0.018)}


VARIANTS = {"bombardier": bombardier, "carbine": carbine, "pepperbox": pepperbox}


# ---------------------------------------------------------------- the reference, split; a variant built on it; the export
def reference_bmesh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=ref)
    ob = [o for o in bpy.data.objects if o.type == "MESH"][0]
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    mats = [m for m in ob.data.materials]
    assert [m.name for m in mats] == ["CourierEnergy", "CourierEnergyShell"], [m.name for m in mats]
    return ob, bm, mats


def loose_parts(bm):
    bm.faces.ensure_lookup_table(); seen = set(); parts = []
    for f in bm.faces:
        if f in seen: continue
        stack, comp = [f], []; seen.add(f)
        while stack:
            g = stack.pop(); comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h not in seen: seen.add(h); stack.append(h)
        parts.append(comp)
    return parts


def build(name, fn):
    ob, bm, mats = reference_bmesh()
    # drop the reference's cylinder (the glowing sphere) and its barrel block; keep the frame, grip, hammer block, rear sight, yoke
    drop = []
    for comp in loose_parts(bm):
        xs = [v.co.x for f in comp for v in f.verts]
        lo, hi = min(xs), max(xs)
        is_sphere = all(f.material_index == GLOW for f in comp) and hi - lo > 0.12
        is_barrel = lo > 0.10
        if is_sphere or is_barrel: drop += comp
    assert drop, "the reference's parts were not found"
    bmesh.ops.delete(bm, geom=list(set(drop)), context="FACES")
    for layer in list(bm.loops.layers.float_vector.values()):
        bm.loops.layers.float_vector.remove(layer)  # (the reference's custom normals: the new faces have none)
    P, pts = fn()
    base = len(bm.verts); bm.verts.ensure_lookup_table()
    vs = [bm.verts.new((x, -z, y)) for x, y, z in P.v]  # glTF (x, y up, z right) -> Blender (x, -z, y)
    new_faces = []
    for idx, m in P.f:
        f = bm.faces.new([vs[i] for i in idx]); f.material_index = m; new_faces.append(f)
    # (the turn to Blender's axes mirrors handedness: y,z -> -z,y is a rotation, so windings stand; recalc anyway, each piece closed)
    bmesh.ops.recalc_face_normals(bm, faces=new_faces)
    for f in bm.faces: f.smooth = False
    me = bpy.data.meshes.new("Psygun_" + name.capitalize())
    bm.to_mesh(me); bm.free()
    for a in [a.name for a in me.attributes if a.name == "custom_normal"]:
        me.attributes.remove(me.attributes[a])
    for m in mats: me.materials.append(m)
    nob = bpy.data.objects.new("Psygun_" + name.capitalize(), me)
    bpy.context.scene.collection.objects.link(nob)
    for o in list(bpy.data.objects):
        if o is not nob: bpy.data.objects.remove(o)
    nob.select_set(True); bpy.context.view_layer.objects.active = nob
    out = os.path.join(root, "src", "assets", "psygun_%s.glb" % name)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
                              export_animations=False, export_skins=False, export_image_format="NONE", export_materials="EXPORT",
                              export_texcoords=False, export_normals=True)
    print("exported", out, os.path.getsize(out), "bytes,", len(me.polygons), "faces; points", pts)


for k, fn in VARIANTS.items():
    build(k, fn)
