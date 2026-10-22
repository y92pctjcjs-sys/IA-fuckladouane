// Offline converter. No decoder is shipped or loaded by the game.
// Usage: node course/tools/prepare-vehicle.cjs <draco-decoder.cjs> <upstream-model-directory>
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  if (process.argv.length < 4) throw Error('Supply the official Three r160 standalone Draco decoder and pmndrs model directory.');
  const createDecoder = require(path.resolve(process.argv[2]));
  const D = await createDecoder({});
  function decode(file, skip = []) {
    const data = fs.readFileSync(path.join(process.argv[3], file));
    const jsonLength = data.readUInt32LE(12), json = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
    const binaryStart = 20 + jsonLength + 8, binary = data.subarray(binaryStart), parts = [];
    for (const node of json.nodes) {
      if (node.mesh === undefined || skip.includes(node.name)) continue;
      for (const primitive of json.meshes[node.mesh].primitives) {
        const ext = primitive.extensions.KHR_draco_mesh_compression, view = json.bufferViews[ext.bufferView];
        const bytes = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
        const decoder = new D.Decoder(), buffer = new D.DecoderBuffer(), mesh = new D.Mesh();
        buffer.Init(new Int8Array(bytes), bytes.length);
        const status = decoder.DecodeBufferToMesh(buffer, mesh);
        if (!status.ok()) throw Error(status.error_msg());
        const attributes = {};
        for (const name of ['POSITION', 'NORMAL']) {
          const attribute = decoder.GetAttributeByUniqueId(mesh, ext.attributes[name]), array = new D.DracoFloat32Array();
          decoder.GetAttributeFloatForAllPoints(mesh, attribute, array);
          attributes[name] = Array.from({length: mesh.num_points() * 3}, (_, i) => array.GetValue(i));
          D.destroy(array);
        }
        const positions = attributes.POSITION;
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < positions.length; i++) { const axis = i % 3; min[axis] = Math.min(min[axis], positions[i]); max[axis] = Math.max(max[axis], positions[i]); }
        const quantized = new Uint16Array(positions.map((p, i) => Math.round((p - min[i % 3]) / (max[i % 3] - min[i % 3] || 1) * 65535)));
        const normals = new Int16Array(attributes.NORMAL.map(n => Math.round(Math.min(1, Math.max(-1, n)) * 32767)));
        const indices = new Uint16Array(mesh.num_faces() * 3), face = new D.DracoInt32Array();
        if (mesh.num_points() > 65535) throw Error('A part exceeds the mobile index budget.');
        for (let i = 0; i < mesh.num_faces(); i++) { decoder.GetFaceFromMesh(mesh, i, face); for (let j = 0; j < 3; j++) indices[i * 3 + j] = face.GetValue(j); }
        const b64 = a => Buffer.from(a.buffer).toString('base64');
        parts.push({name: node.name, material: json.materials[primitive.material].name, min, max, position: b64(quantized), normal: b64(normals), index: b64(indices)});
        console.log(file, node.name, json.materials[primitive.material].name, mesh.num_points(), 'vertices', mesh.num_faces(), 'triangles', min.map(n=>n.toFixed(2)), max.map(n=>n.toFixed(2)));
        D.destroy(face); D.destroy(status); D.destroy(buffer); D.destroy(mesh); D.destroy(decoder);
      }
    }
    return parts;
  }
  const model = {body: decode('chassis-draco.glb', ['Wheel','License','meter','pointer-left','pointer-right']), wheel: decode('wheel-draco.glb')};
  const header = '// Derived from Classic Muscle car by Alexus16, via pmndrs/racing-game. CC BY 4.0.\n// Source, modifications and attribution: ../CREDITS.md. Quantized offline; no runtime Draco.\n';
  fs.writeFileSync(path.join(__dirname, '../assets/vehicle-data.js'), header + 'export const vehicleData = ' + JSON.stringify(model) + ';\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
