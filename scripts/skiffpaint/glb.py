"""A small glTF-binary reader for the Solar Skiff's hull (scripts/skiffpaint/hulls.py): its embedded painting and its UV triangles.
No dependencies past numpy and PIL. Prior art: the glTF 2.0 spec's GLB container (a JSON chunk, a BIN chunk, accessors into bufferViews)."""
import io
import json
import struct

import numpy as np
from PIL import Image

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    bl = struct.unpack('<I', b[o:o + 4])[0]
    return j, b[o + 8:o + 8 + bl]


def view(j, bin_, i):
    v = j['bufferViews'][i]
    s = v.get('byteOffset', 0)
    return bin_[s:s + v['byteLength']]


def accessor(j, bin_, i):
    a = j['accessors'][i]
    v = j['bufferViews'][a['bufferView']]
    n, c = a['count'], NC[a['type']]
    dt = np.dtype(CT[a['componentType']])
    start = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = v.get('byteStride', 0) or dt.itemsize * c
    raw = np.frombuffer(bin_, dtype=np.uint8, count=stride * (n - 1) + dt.itemsize * c, offset=start)
    out = np.lib.stride_tricks.as_strided(raw, shape=(n, dt.itemsize * c), strides=(stride, 1)).copy()
    out = out.view(dt).reshape(n, c)
    if a.get('normalized'):  # (KHR_mesh_quantization: the export packs UVs as unsigned shorts)
        return out.astype(np.float64) / float(np.iinfo(dt).max)
    return out


def hull(path, material='Skiff_Hull'):
    """(the hull's painting as an RGBA PIL image, its UV triangles (n, 3, 2) in glTF's UVs: v down, and their positions (n, 3, 3))."""
    j, bin_ = read(path)
    mi = next(i for i, m in enumerate(j['materials']) if m['name'] == material)
    m = j['materials'][mi]
    ti = (m.get('emissiveTexture') or m['pbrMetallicRoughness']['baseColorTexture'])['index']
    img = Image.open(io.BytesIO(view(j, bin_, j['images'][j['textures'][ti]['source']]['bufferView']))).convert('RGBA')
    uvs, pos = [], []
    for me in j['meshes']:
        for p in me['primitives']:
            if p.get('material') != mi:
                continue
            uv = accessor(j, bin_, p['attributes']['TEXCOORD_0'])
            xyz = accessor(j, bin_, p['attributes']['POSITION'])
            idx = accessor(j, bin_, p['indices']).reshape(-1, 3)
            uvs.append(uv[idx])
            pos.append(xyz[idx])
    return img, np.concatenate(uvs), np.concatenate(pos)
